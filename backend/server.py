from fastapi import FastAPI, APIRouter, Request, Response, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
import bcrypt
import jwt
import random
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta, date

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"

ACADEMIC = ["Computer Science", "Mechanical Engineering", "Medicine & Nursing", "Architecture", "Physics", "Mathematics", "Psychology", "Business Administration", "Aviation", "Chemistry"]
SECTORS = ["Medicine", "Law Enforcement", "Military", "Industry", "IT", "Finance", "Retail", "Energy", "Logistics", "Corporate Safety"]
CATEGORIES = {"Academic Disciplines": ACADEMIC, "Business Sectors": SECTORS}
ALL_CATEGORIES = ACADEMIC + SECTORS

SPECIALIZATIONS = {"Corporate": SECTORS, "Academic": ACADEMIC}


# ---------------- Auth helpers ----------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access", "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def clean_user(u: Optional[dict]) -> Optional[dict]:
    if not u:
        return None
    u.pop("password_hash", None)
    u.pop("_id", None)
    return u


async def get_current_user(request: Request) -> Optional[dict]:
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    token = token or request.cookies.get("access_token") or request.cookies.get("session_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") == "access":
            return clean_user(await db.users.find_one({"user_id": payload["sub"]}))
    except jwt.PyJWTError:
        pass
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    exp = session["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        return None
    return clean_user(await db.users.find_one({"user_id": session["user_id"]}))


async def require_user(request: Request) -> dict:
    u = await get_current_user(request)
    if not u:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return u


async def require_teacher(request: Request) -> dict:
    u = await require_user(request)
    if u.get("role") == "student":
        raise HTTPException(status_code=403, detail="Teacher access required")
    return u


# ---------------- Auth models ----------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"
    phone: Optional[str] = None
    specialization: Optional[str] = None
    institution: Optional[str] = None
    accept_terms: bool = False


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class VerifyCodeIn(BaseModel):
    email: EmailStr
    code: str


class ResetIn(BaseModel):
    email: EmailStr
    code: str
    password: str


class ProfileIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    institution: Optional[str] = None
    picture: Optional[str] = None


class ChangePwIn(BaseModel):
    current_password: str
    new_password: str


class NotifIn(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True


def _set_token_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)


@api_router.get("/auth/specializations")
async def specializations():
    return SPECIALIZATIONS


@api_router.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    if not body.accept_terms:
        raise HTTPException(status_code=400, detail="You must accept the terms to continue")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if body.role not in ("student", "teacher"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if body.role == "teacher" and not body.specialization:
        raise HTTPException(status_code=400, detail="Specialization is required for teachers")
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id, "name": body.name, "email": email,
        "password_hash": hash_password(body.password), "role": body.role,
        "phone": body.phone, "specialization": body.specialization if body.role == "teacher" else None,
        "institution": body.institution, "picture": None, "auth_provider": "password",
        "email_notifications": True, "push_notifications": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(dict(doc))
    # Register students into the student pool so teachers can add them to groups
    if body.role == "student":
        await db.students.update_one(
            {"email": email},
            {"$setOnInsert": {"id": f"U-{uuid.uuid4().hex[:6]}"}, "$set": {"name": body.name, "email": email, "phone": body.phone, "institution": body.institution or "Independent", "division": "General"}},
            upsert=True,
        )
    token = create_access_token(user_id, email)
    _set_token_cookie(response, token)
    return {**clean_user(dict(doc)), "token": token}


@api_router.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["user_id"], email)
    _set_token_cookie(response, token)
    return {**clean_user(user), "token": token}


@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing X-Session-ID header")
    async with httpx.AsyncClient() as http:
        r = await http.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data["name"], "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": data["email"], "name": data["name"], "picture": data.get("picture"), "role": "teacher", "auth_provider": "google", "email_notifications": True, "push_notifications": True, "created_at": datetime.now(timezone.utc).isoformat()})
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": session_token, "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()})
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
    return {"user_id": user_id, "email": data["email"], "name": data["name"], "picture": data.get("picture"), "role": "teacher", "session_token": session_token}


@api_router.get("/auth/me")
async def auth_me(request: Request):
    return await require_user(request)


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@api_router.post("/auth/forgot-password")
async def forgot_password(body: ForgotIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    code = f"{random.randint(0, 999999):06d}"
    if user:
        await db.password_resets.update_one({"email": email}, {"$set": {"email": email, "code": code, "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(), "used": False}}, upsert=True)
        logger.info(f"[password-reset] code for {email}: {code}")
    return {"message": "If the email exists, a code has been sent.", "demo_code": code if user else None}


async def _check_code(email: str, code: str) -> dict:
    rec = await db.password_resets.find_one({"email": email})
    if not rec or rec.get("used") or rec.get("code") != code:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    exp = datetime.fromisoformat(rec["expires_at"])
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code has expired")
    return rec


@api_router.post("/auth/verify-code")
async def verify_code(body: VerifyCodeIn):
    await _check_code(body.email.lower(), body.code)
    return {"valid": True}


@api_router.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    email = body.email.lower()
    await _check_code(email, body.code)
    await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_resets.update_one({"email": email}, {"$set": {"used": True}})
    return {"success": True}


@api_router.put("/auth/profile")
async def update_profile(body: ProfileIn, request: Request):
    user = await require_user(request)
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    if upd:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": upd})
    return clean_user(await db.users.find_one({"user_id": user["user_id"]}))


@api_router.post("/auth/change-password")
async def change_password(body: ChangePwIn, request: Request):
    user = await require_user(request)
    full = await db.users.find_one({"user_id": user["user_id"]})
    if not full.get("password_hash") or not verify_password(body.current_password, full["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"password_hash": hash_password(body.new_password)}})
    return {"success": True}


@api_router.put("/auth/notifications")
async def update_notifications(body: NotifIn, request: Request):
    user = await require_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": body.model_dump()})
    return clean_user(await db.users.find_one({"user_id": user["user_id"]}))


# ---------------- Reference data ----------------
@api_router.get("/categories")
async def categories():
    return CATEGORIES


@api_router.get("/content-blocks")
async def content_blocks(type: Optional[str] = None, q: Optional[str] = None, category: Optional[str] = None, skip: int = 0, limit: int = 24):
    query = {}
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    total = await db.content_blocks.count_documents(query)
    items = await db.content_blocks.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "total": total}


@api_router.get("/content-blocks/by-ids")
async def content_blocks_by_ids(ids: str = ""):
    id_list = [x for x in ids.split(",") if x]
    items = await db.content_blocks.find({"id": {"$in": id_list}}, {"_id": 0}).to_list(200)
    bmap = {b["id"]: b for b in items}
    return [bmap[i] for i in id_list if i in bmap]


@api_router.get("/students")
async def get_students(q: Optional[str] = None):
    docs = await db.students.find({}, {"_id": 0}).to_list(500)
    if q:
        ql = q.lower()
        docs = [d for d in docs if ql in d["name"].lower() or ql in d.get("email", "").lower()]
    docs.sort(key=lambda d: d["name"])
    return docs


class StudentIn(BaseModel):
    name: str
    institution: str = "Independent"
    division: str = "General"
    email: str = ""
    phone: str = ""


@api_router.post("/students")
async def add_student(body: StudentIn, request: Request):
    await require_teacher(request)
    sid = f"U-{uuid.uuid4().hex[:6]}"
    doc = {"id": sid, **body.model_dump()}
    await db.students.insert_one(dict(doc))
    return {k: v for k, v in doc.items()}


# ---------------- Lessons ----------------
class LessonIn(BaseModel):
    title: str
    description: str = ""
    category: str
    duration: int = 60
    theory_ids: List[str] = []
    practice_ids: List[str] = []
    quizzes: List[dict] = []


async def _expand_lesson(lesson: dict) -> dict:
    ids = lesson.get("theory_ids", []) + lesson.get("practice_ids", [])
    blocks = await db.content_blocks.find({"id": {"$in": ids}}, {"_id": 0}).to_list(100)
    bmap = {b["id"]: b for b in blocks}
    lesson["theory_blocks"] = [bmap[i] for i in lesson.get("theory_ids", []) if i in bmap]
    lesson["practice_blocks"] = [bmap[i] for i in lesson.get("practice_ids", []) if i in bmap]
    return lesson


@api_router.get("/lessons")
async def get_lessons(q: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    docs = await db.lessons.find(query, {"_id": 0}).to_list(200)
    if q:
        ql = q.lower()
        docs = [d for d in docs if ql in d["title"].lower()]
    return docs


@api_router.get("/lessons/{lid}")
async def get_lesson(lid: str):
    doc = await db.lessons.find_one({"id": lid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return await _expand_lesson(doc)


def _validate_lesson(body: LessonIn):
    if not body.theory_ids:
        raise HTTPException(status_code=400, detail="At least one theory block is required")
    if not body.practice_ids:
        raise HTTPException(status_code=400, detail="At least one practice block is required")


@api_router.post("/lessons")
async def create_lesson(body: LessonIn, request: Request):
    user = await require_teacher(request)
    _validate_lesson(body)
    lid = f"L-{uuid.uuid4().hex[:6]}"
    doc = {"id": lid, **body.model_dump(), "teacher": user.get("name", "Instructor"), "created_at": datetime.now(timezone.utc).date().isoformat()}
    await db.lessons.insert_one(dict(doc))
    return await _expand_lesson(await db.lessons.find_one({"id": lid}, {"_id": 0}))


@api_router.put("/lessons/{lid}")
async def update_lesson(lid: str, body: LessonIn):
    _validate_lesson(body)
    res = await db.lessons.update_one({"id": lid}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return await _expand_lesson(await db.lessons.find_one({"id": lid}, {"_id": 0}))


@api_router.delete("/lessons/{lid}")
async def delete_lesson(lid: str):
    await db.lessons.delete_one({"id": lid})
    return {"success": True}


# ---------------- Groups ----------------
class GroupIn(BaseModel):
    name: str
    direction: str
    student_ids: List[str] = []


@api_router.get("/groups")
async def get_groups():
    docs = await db.groups.find({}, {"_id": 0}).to_list(200)
    for d in docs:
        d["students"] = len(d.get("student_ids", []))
    return docs


@api_router.get("/groups/{gid}")
async def get_group(gid: str):
    doc = await db.groups.find_one({"id": gid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")
    doc["student_list"] = await db.students.find({"id": {"$in": doc.get("student_ids", [])}}, {"_id": 0}).to_list(200)
    doc["students"] = len(doc.get("student_ids", []))
    bookings = await db.bookings.find({"group_id": gid}, {"_id": 0}).to_list(100)
    doc["bookings"] = [await _enrich_booking(b) for b in bookings]
    return doc


@api_router.post("/groups")
async def create_group(body: GroupIn, request: Request):
    user = await require_teacher(request)
    gid = f"G-{uuid.uuid4().hex[:6]}"
    doc = {"id": gid, **body.model_dump(), "teacher": user.get("name", "Instructor"), "created_at": datetime.now(timezone.utc).date().isoformat()}
    await db.groups.insert_one(dict(doc))
    return await get_group(gid)


@api_router.put("/groups/{gid}")
async def update_group(gid: str, body: GroupIn):
    res = await db.groups.update_one({"id": gid}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return await get_group(gid)


@api_router.delete("/groups/{gid}")
async def delete_group(gid: str):
    await db.groups.delete_one({"id": gid})
    return {"success": True}


# ---------------- Bookings ----------------
class BookingIn(BaseModel):
    lesson_id: str
    group_id: str
    date: str
    time: str
    duration: Optional[int] = None


class BookingEditIn(BaseModel):
    group_id: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[int] = None


def _booking_status(date_str: str) -> str:
    try:
        d = date.fromisoformat(date_str)
    except Exception:
        return "scheduled"
    today = datetime.now(timezone.utc).date()
    if d > today:
        return "scheduled"
    if d == today:
        return "active"
    return "archived"


async def _enrich_booking(b: dict) -> dict:
    lesson = await db.lessons.find_one({"id": b["lesson_id"]}, {"_id": 0})
    group = await db.groups.find_one({"id": b["group_id"]}, {"_id": 0})
    b["lesson_title"] = lesson["title"] if lesson else "—"
    b["category"] = lesson["category"] if lesson else "—"
    b["group_name"] = group["name"] if group else "—"
    b["participants"] = len(group.get("student_ids", [])) if group else 0
    b["status"] = _booking_status(b.get("date", ""))
    return b


@api_router.get("/bookings")
async def get_bookings():
    docs = await db.bookings.find({}, {"_id": 0}).to_list(200)
    out = [await _enrich_booking(b) for b in docs]
    out.sort(key=lambda x: (x.get("date", ""), x.get("time", "")))
    return out


@api_router.get("/bookings/student")
async def get_student_bookings(request: Request):
    user = await require_user(request)
    email = user["email"].lower()
    student = await db.students.find_one({"email": email}, {"_id": 0})
    my_id = student["id"] if student else None
    docs = await db.bookings.find({}, {"_id": 0}).to_list(200)
    out = []
    for b in docs:
        group = await db.groups.find_one({"id": b["group_id"]}, {"_id": 0})
        in_group = my_id in group.get("student_ids", []) if group else False
        joined = email in b.get("joined_emails", []) or in_group
        eb = await _enrich_booking(b)
        eb["joined"] = joined
        eb["can_join"] = not joined and eb["status"] != "archived"
        out.append(eb)
    out.sort(key=lambda x: (x.get("date", ""), x.get("time", "")))
    return out


@api_router.get("/bookings/{bid}")
async def get_booking(bid: str):
    b = await db.bookings.find_one({"id": bid}, {"_id": 0})
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    b = await _enrich_booking(b)
    lesson = await db.lessons.find_one({"id": b["lesson_id"]}, {"_id": 0})
    b["lesson"] = await _expand_lesson(lesson) if lesson else None
    b["group"] = await get_group(b["group_id"]) if await db.groups.find_one({"id": b["group_id"]}) else None
    return b


@api_router.post("/bookings")
async def create_booking(body: BookingIn, request: Request):
    user = await require_teacher(request)
    lesson = await db.lessons.find_one({"id": body.lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    bid = f"BK-{uuid.uuid4().hex[:6].upper()}"
    doc = {"id": bid, "lesson_id": body.lesson_id, "group_id": body.group_id, "date": body.date, "time": body.time, "duration": body.duration or lesson.get("duration", 60), "teacher": lesson.get("teacher", user.get("name")), "joined_emails": [], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.bookings.insert_one(dict(doc))
    return await get_booking(bid)


@api_router.put("/bookings/{bid}")
async def update_booking(bid: str, body: BookingEditIn):
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    res = await db.bookings.update_one({"id": bid}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return await get_booking(bid)


@api_router.delete("/bookings/{bid}")
async def delete_booking(bid: str):
    await db.bookings.delete_one({"id": bid})
    return {"success": True}


@api_router.post("/bookings/{bid}/join")
async def join_booking(bid: str, request: Request):
    user = await require_user(request)
    await db.bookings.update_one({"id": bid}, {"$addToSet": {"joined_emails": user["email"].lower()}})
    return {"success": True}


@api_router.post("/bookings/{bid}/leave")
async def leave_booking(bid: str, request: Request):
    user = await require_user(request)
    await db.bookings.update_one({"id": bid}, {"$pull": {"joined_emails": user["email"].lower()}})
    return {"success": True}


# ---------------- Dashboard ----------------
NEWS = [
    {"id": "N-1", "tag": "Release", "title": "Cygnus Rift App v0.9 pushes real-time spatial heatmaps", "date": "2026-06-19", "summary": "Overlay participant gaze and movement heatmaps on the replay timeline."},
    {"id": "N-2", "tag": "AI", "title": "Generative narration now supports 14 languages", "date": "2026-06-14", "summary": "Adaptive theory briefings are auto-authored per cohort."},
    {"id": "N-3", "tag": "Milestone", "title": "Prototype kick-off scheduled for July 2026", "date": "2026-06-10", "summary": "Core immersion loop and session composer enter active build."},
]
PROGRESS_SERIES = [{"month": "Jan", "progress": 42}, {"month": "Feb", "progress": 51}, {"month": "Mar", "progress": 58}, {"month": "Apr", "progress": 63}, {"month": "May", "progress": 69}, {"month": "Jun", "progress": 74}]


@api_router.get("/dashboard/summary")
async def dashboard_summary():
    students = await db.students.count_documents({})
    lessons = await db.lessons.count_documents({})
    groups = await db.groups.count_documents({})
    all_b = await db.bookings.find({}, {"_id": 0}).to_list(500)
    conducted = sum(1 for b in all_b if _booking_status(b.get("date", "")) == "archived")
    analytics = {"students": students, "bookings": len(all_b), "conducted": conducted, "lessons": lessons, "groups": groups}
    return {"analytics": analytics, "progress_series": PROGRESS_SERIES}


@api_router.get("/news")
async def get_news():
    return NEWS


@api_router.get("/")
async def root():
    return {"message": "Cygnus Rift API"}


# ---------------- Seed ----------------
FIRST = ["Liam", "Sofia", "Noah", "Maya", "Ethan", "Chloe", "Omar", "Isla", "Lucas", "Ava", "Mateo", "Zara", "Hugo", "Nina", "Kai", "Lena", "Diego", "Amara", "Felix", "Yuki", "Aria", "Ravi", "Elena", "Marco", "Priya", "Sven", "Leila", "Oscar", "Mila", "Tariq", "Freya", "Ivan", "Sara", "Dominic", "Naomi", "Pavel", "Rosa", "Kenji", "Vera", "Andre", "Lucia", "Malik", "Ingrid", "Cyrus", "Dahlia", "Bjorn", "Anya", "Rex", "Talia", "Emil"]
LAST = ["Carter", "Rossi", "Kim", "Singh", "Brooks", "Dubois", "Haddad", "Murphy", "Nguyen", "Silva", "Kowalski", "Okafor", "Tanaka", "Weber", "Costa", "Popov", "Reyes", "Andersson", "Bauer", "Moreau", "Ivanov", "Schmidt", "Larsen", "Novak", "Petrov", "Fisher", "Hassan", "Lindqvist", "Marino", "Ferreira"]
INSTITUTIONS = [("Global Fund Institute", "Investment Training"), ("Nova Academy", "Internship Program"), ("Orion Consulting", "Advisory Practice"), ("Vertex Corp", "Learning & Development"), ("Helix Robotics", "Field Engineering"), ("Aurora Health", "Clinical Onboarding"), ("Meridian Defense", "Tactical Simulation"), ("Cygnus University", "Immersive Media")]
THEORY_BASE = ["Cinematic Framing", "Global Illumination", "Spatial Storytelling", "MetaHuman Behaviour", "Prompt Design", "Crisis Communication", "Ethics of Immersion", "Non-verbal Signals", "Colour Grading", "Sound Design", "Narrative Pacing", "Camera Language", "Lighting Theory", "Scene Composition", "Cognitive Load", "Adaptive Briefing", "Risk Assessment", "Compliance Basics", "Situational Awareness", "Decision Frameworks", "Anatomy of Trust", "Feedback Loops", "Signal vs Noise", "Emotional Cues", "Environmental Design", "Material Systems", "Physics of Light", "Perception Models", "Debrief Methods", "Scenario Theory"]
PRACTICE_BASE = ["Relight a VR Set", "Interview Drill", "Environment Build", "Board Pitch Roleplay", "Crisis Branching", "Replay Analysis", "Safety Simulation", "Decision Sim", "Triage Exercise", "Negotiation Lab", "Assembly Task", "Inspection Round", "Rescue Drill", "Diagnostic Run", "Field Deployment"]


async def seed():
    # demo auth users (idempotent restore of demo passwords)
    demo = [
        {"email": "teacher@cygnusrift.io", "name": "Elena Voss", "role": "teacher", "specialization": "Immersive Cinematography", "phone": "+1 555 0100", "institution": "Cygnus University"},
        {"email": "student@cygnusrift.io", "name": "Liam Carter", "role": "student", "specialization": None, "phone": "+1 555 0101", "institution": "Nova Academy"},
    ]
    for d in demo:
        await db.users.update_one(
            {"email": d["email"]},
            {"$setOnInsert": {"user_id": f"user_{uuid.uuid4().hex[:12]}", "auth_provider": "password", "created_at": datetime.now(timezone.utc).isoformat(), "email_notifications": True, "push_notifications": True},
             "$set": {"name": d["name"], "role": d["role"], "specialization": d["specialization"], "phone": d["phone"], "institution": d["institution"], "password_hash": hash_password("password123")}},
            upsert=True,
        )
    try:
        await db.users.create_index("email", unique=True)
    except Exception:
        pass

    if await db.students.count_documents({}) == 0:
        students = []
        rng = random.Random(42)
        for i in range(50):
            fn = FIRST[i % len(FIRST)]
            ln = LAST[(i * 3) % len(LAST)]
            inst, div = INSTITUTIONS[i % len(INSTITUTIONS)]
            email = f"student@cygnusrift.io" if i == 0 else f"{fn.lower()}.{ln.lower()}{i}@mail.io"
            students.append({"id": f"U-{i+1:03d}", "name": f"{fn} {ln}", "email": email, "phone": f"+1 555 {rng.randint(1000,9999)}", "institution": inst, "division": div})
        await db.students.insert_many(students)

    if await db.content_blocks.count_documents({}) == 0:
        blocks = []
        rng = random.Random(7)
        for i in range(300):
            base = THEORY_BASE[i % len(THEORY_BASE)]
            blocks.append({"id": f"CT-{i+1:03d}", "title": f"{base} {i // len(THEORY_BASE) + 1:02d}", "type": "theory", "thumbnail": f"https://picsum.photos/seed/theory{i}/400/240", "duration": rng.randint(3, 10), "category": ALL_CATEGORIES[i % len(ALL_CATEGORIES)], "created_at": f"2026-{rng.randint(1,6):02d}-{rng.randint(1,28):02d}"})
        for i in range(70):
            base = PRACTICE_BASE[i % len(PRACTICE_BASE)]
            blocks.append({"id": f"CP-{i+1:03d}", "title": f"{base} {i // len(PRACTICE_BASE) + 1:02d}", "type": "practice", "thumbnail": f"https://picsum.photos/seed/practice{i}/400/240", "duration": 10, "approx": True, "category": ALL_CATEGORIES[i % len(ALL_CATEGORIES)], "created_at": f"2026-{rng.randint(1,6):02d}-{rng.randint(1,28):02d}"})
        await db.content_blocks.insert_many(blocks)

    if await db.lessons.count_documents({}) == 0:
        lessons = [
            {"id": "L-001", "title": "MetaHuman Interview Simulation", "category": "Psychology", "duration": 40, "theory_ids": ["CT-004", "CT-008"], "practice_ids": ["CP-002"], "quizzes": [{"id": "Q1", "block_id": "CT-004", "question": "What signals build rapport fastest?", "options": ["Eye contact", "Silence", "Interrupting", "Note-taking"], "correct": 0}, {"id": "Q2", "block_id": "CP-002", "question": "A strong interview opens with?", "options": ["A hook", "Pricing", "Silence", "Legal"], "correct": 0}]},
            {"id": "L-002", "title": "Lumen Lighting Theory + Practice", "category": "Computer Science", "duration": 30, "theory_ids": ["CT-002"], "practice_ids": ["CP-001"], "quizzes": [{"id": "Q1", "block_id": "CT-002", "question": "Lumen provides?", "options": ["Global illumination", "Physics", "Audio", "Networking"], "correct": 0}]},
            {"id": "L-003", "title": "Enterprise Consulting Simulation", "category": "Finance", "duration": 40, "theory_ids": ["CT-006"], "practice_ids": ["CP-004", "CP-008"], "quizzes": [{"id": "Q1", "block_id": "CP-004", "question": "A good pitch opens with?", "options": ["The ask", "A hook", "Pricing", "Legal"], "correct": 1}]},
            {"id": "L-004", "title": "Crisis Response Scenario", "category": "Law Enforcement", "duration": 35, "theory_ids": ["CT-006", "CT-007"], "practice_ids": ["CP-005"], "quizzes": [{"id": "Q1", "block_id": "CT-006", "question": "First step in a crisis?", "options": ["Assess", "Panic", "Delegate blame", "Wait"], "correct": 0}]},
            {"id": "L-005", "title": "Nanite Environment Walkthrough", "category": "Architecture", "duration": 30, "theory_ids": ["CT-001", "CT-003"], "practice_ids": ["CP-003"], "quizzes": [{"id": "Q1", "block_id": "CP-003", "question": "Nanite optimizes?", "options": ["Geometry", "Sound", "AI", "Text"], "correct": 0}]},
            {"id": "L-006", "title": "Field Safety Simulation", "category": "Corporate Safety", "duration": 25, "theory_ids": ["CT-007"], "practice_ids": ["CP-007"], "quizzes": [{"id": "Q1", "block_id": "CT-007", "question": "PPE stands for?", "options": ["Personal Protective Equipment", "Public Policy Exam", "Peak Performance Effort", "None"], "correct": 0}]},
        ]
        for l in lessons:
            l["teacher"] = "Elena Voss"
            l["description"] = f"An immersive {l['category']} session blending cinematic theory with hands-on VR practice."
            l["created_at"] = "2026-05-10"
        await db.lessons.insert_many(lessons)

    if await db.groups.count_documents({}) == 0:
        all_students = await db.students.find({}, {"_id": 0, "id": 1}).to_list(500)
        sids = [s["id"] for s in all_students]
        rng = random.Random(11)
        directions = ["Computer Science", "Medicine & Nursing", "Finance", "Law Enforcement", "Architecture", "Corporate Safety", "Psychology", "IT"]
        groups = []
        for i, dirn in enumerate(directions):
            count = rng.randint(8, 14)
            members = rng.sample(sids, min(count, len(sids)))
            if i < 3 and "U-001" not in members:
                members = ["U-001"] + members[:-1]
            groups.append({"id": f"G-{i+1:02d}", "name": f"{dirn.split()[0]} Cohort {chr(65+i)}", "direction": dirn, "teacher": "Elena Voss", "created_at": f"2026-0{(i%6)+1}-1{i%9}", "student_ids": members})
        await db.groups.insert_many(groups)

    if await db.bookings.count_documents({}) == 0:
        lessons = await db.lessons.find({}, {"_id": 0, "id": 1, "duration": 1}).to_list(50)
        groups = await db.groups.find({}, {"_id": 0, "id": 1}).to_list(50)
        rng = random.Random(21)
        today = datetime.now(timezone.utc).date()
        bookings = []
        offsets = [-6, -3, -1, 0, 1, 2, 4, 7, 10, 14]
        for i in range(9):
            l = lessons[i % len(lessons)]
            g = groups[i % len(groups)]
            d = today + timedelta(days=offsets[i])
            bookings.append({"id": f"BK-{i+1:04d}", "lesson_id": l["id"], "group_id": g["id"], "date": d.isoformat(), "time": rng.choice(["09:30", "11:00", "13:00", "15:30", "17:00"]), "duration": l.get("duration", 60), "teacher": "Elena Voss", "joined_emails": [], "created_at": datetime.now(timezone.utc).isoformat()})
        await db.bookings.insert_many(bookings)


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)


@app.on_event("startup")
async def startup():
    await seed()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
