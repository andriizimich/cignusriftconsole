from fastapi import FastAPI, APIRouter, Request, Response, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


# ---------------- Auth ----------------
async def get_current_user(request: Request) -> Optional[dict]:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    return await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})


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
        await db.users.insert_one({"user_id": user_id, "email": data["email"], "name": data["name"], "picture": data.get("picture"), "created_at": datetime.now(timezone.utc).isoformat()})
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": session_token, "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()})
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
    return {"user_id": user_id, "email": data["email"], "name": data["name"], "picture": data.get("picture"), "session_token": session_token}


@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


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
    return {"success": True}


# ---------------- Static analytics/news ----------------
ANALYTICS = {"students": 248, "students_delta": "+12.4%", "sessions_conducted": 96, "sessions_delta": "+8.1%", "learning_progress": 74, "progress_delta": "+5.2%", "homework_completed": 182, "homework_total": 210, "homework_delta": "+3.6%"}
PROGRESS_SERIES = [{"month": "Jan", "progress": 42, "sessions": 8}, {"month": "Feb", "progress": 51, "sessions": 11}, {"month": "Mar", "progress": 58, "sessions": 13}, {"month": "Apr", "progress": 63, "sessions": 15}, {"month": "May", "progress": 69, "sessions": 18}, {"month": "Jun", "progress": 74, "sessions": 21}]
NEWS = [
    {"id": "N-1", "tag": "Release", "title": "Cygnus Rift App v0.9 pushes real-time spatial heatmaps", "date": "2026-06-19", "summary": "Trainers can now overlay participant gaze and movement heatmaps directly on the replay timeline."},
    {"id": "N-2", "tag": "AI", "title": "Generative narration now supports 14 languages", "date": "2026-06-14", "summary": "Adaptive theory briefings are auto-authored per cohort with localized voice synthesis."},
    {"id": "N-3", "tag": "Milestone", "title": "Prototype kick-off scheduled for July 2026", "date": "2026-06-10", "summary": "Core immersion loop, session composer and headset sync pipeline enter active build."},
    {"id": "N-4", "tag": "Partner", "title": "Global Fund joins the first institutional cohort", "date": "2026-06-02", "summary": "Enterprise due-diligence replay tooling enters closed pilot with design partners."},
]
TEACHERS = [
    {"id": "T-1", "name": "Dr. Elena Voss"}, {"id": "T-2", "name": "Marcus Reid"},
    {"id": "T-3", "name": "Aiko Tanaka"}, {"id": "T-4", "name": "Sam Okafor"},
]
COURSES = [
    {"id": "C-1", "name": "Immersive Cinematography"}, {"id": "C-2", "name": "Prompt Engineering for VR"},
    {"id": "C-3", "name": "Enterprise Consulting Sim"}, {"id": "C-4", "name": "MetaHuman Interaction"},
]
STUDENTS = [
    {"id": "U-1", "name": "Liam Carter", "attendance": 92, "grade": 88},
    {"id": "U-2", "name": "Sofia Rossi", "attendance": 85, "grade": 91},
    {"id": "U-3", "name": "Noah Kim", "attendance": 78, "grade": 74},
    {"id": "U-4", "name": "Maya Singh", "attendance": 96, "grade": 95},
    {"id": "U-5", "name": "Ethan Brooks", "attendance": 64, "grade": 69},
    {"id": "U-6", "name": "Chloe Dubois", "attendance": 88, "grade": 82},
    {"id": "U-7", "name": "Omar Haddad", "attendance": 90, "grade": 87},
    {"id": "U-8", "name": "Isla Murphy", "attendance": 73, "grade": 79},
]

SEED_SESSIONS = [
    {"id": "S-4821", "title": "MetaHuman Interview Simulation", "group": "Alpha Cohort", "teacher": "Dr. Elena Voss", "date": "2026-06-24", "time": "09:30", "duration": "90 min", "mode": "Hybrid", "status": "scheduled", "description": "Hands-on MetaHuman-driven interview scenarios blended with cinematic theory on non-verbal cues.", "materials": [{"name": "Interview Brief.pdf", "type": "file"}, {"name": "MetaHuman Slides.pptx", "type": "slides"}, {"name": "Reference Reel", "type": "link"}], "homework": {"description": "Record and annotate one 3-minute simulated interview; submit reflection notes.", "submissions": [{"student": "Maya Singh", "grade": "A"}, {"student": "Liam Carter", "grade": "B+"}]}},
    {"id": "S-4822", "title": "Lumen Lighting Theory + Practice", "group": "Nova Interns", "teacher": "Marcus Reid", "date": "2026-06-24", "time": "13:00", "duration": "60 min", "mode": "Practice", "status": "scheduled", "description": "Real-time global illumination with Lumen, from theory to a hands-on relight of a VR set.", "materials": [{"name": "Lumen Basics.pdf", "type": "file"}, {"name": "Lighting Rig", "type": "link"}], "homework": {"description": "Relight the provided scene and export before/after captures.", "submissions": []}},
    {"id": "S-4823", "title": "Spatial Replay Debrief", "group": "Orion Consultants", "teacher": "Aiko Tanaka", "date": "2026-06-25", "time": "11:00", "duration": "45 min", "mode": "Theory", "status": "in_progress", "description": "Reviewing recorded decision-making sessions in 3D spatial replay.", "materials": [{"name": "Debrief Framework.pdf", "type": "file"}], "homework": {"description": "Write a due-diligence summary from the replay footage.", "submissions": [{"student": "Omar Haddad", "grade": "A-"}]}},
    {"id": "S-4824", "title": "Prompt-Engineered Crisis Scenario", "group": "Vertex L&D", "teacher": "Sam Okafor", "date": "2026-06-26", "time": "15:30", "duration": "120 min", "mode": "Hybrid", "status": "scheduled", "description": "Prompt pipelines compose a high-tension crisis simulation with adaptive branching.", "materials": [{"name": "Scenario Prompts.pdf", "type": "file"}, {"name": "Branch Map", "type": "link"}], "homework": {"description": "Author two alternative branches for the crisis scenario.", "submissions": []}},
    {"id": "S-4825", "title": "Nanite Environment Walkthrough", "group": "Alpha Cohort", "teacher": "Dr. Elena Voss", "date": "2026-06-20", "time": "10:00", "duration": "75 min", "mode": "Practice", "status": "completed", "description": "Building and navigating a Nanite-heavy environment at institutional fidelity.", "materials": [{"name": "Nanite Guide.pdf", "type": "file"}], "homework": {"description": "Optimize the provided mesh and report triangle counts.", "submissions": [{"student": "Sofia Rossi", "grade": "A"}, {"student": "Noah Kim", "grade": "B"}]}},
    {"id": "S-4826", "title": "Consulting Roleplay: Board Pitch", "group": "Orion Consultants", "teacher": "Aiko Tanaka", "date": "2026-06-18", "time": "14:00", "duration": "90 min", "mode": "Hybrid", "status": "completed", "description": "Virtual boardroom pitch with AI-driven skeptical stakeholders.", "materials": [{"name": "Pitch Rubric.pdf", "type": "file"}], "homework": {"description": "Submit your recorded pitch for peer review.", "submissions": [{"student": "Isla Murphy", "grade": "B+"}]}},
]

SEED_GROUPS = [
    {"id": "G-01", "name": "Alpha Cohort", "course": "Immersive Cinematography", "teacher": "Dr. Elena Voss", "students": 32, "limit": 40, "institution": "Global Fund Institute", "division": "Investment Training", "progress": 78, "created_at": "2026-01-12", "student_ids": ["U-1", "U-2", "U-4", "U-6"]},
    {"id": "G-02", "name": "Nova Interns", "course": "Prompt Engineering for VR", "teacher": "Marcus Reid", "students": 18, "limit": 25, "institution": "Nova Academy", "division": "Internship Program", "progress": 64, "created_at": "2026-02-03", "student_ids": ["U-3", "U-5", "U-7"]},
    {"id": "G-03", "name": "Orion Consultants", "course": "Enterprise Consulting Sim", "teacher": "Aiko Tanaka", "students": 12, "limit": 15, "institution": "Orion Consulting", "division": "Advisory Practice", "progress": 91, "created_at": "2026-02-20", "student_ids": ["U-7", "U-8", "U-1"]},
    {"id": "G-04", "name": "Vertex L&D", "course": "MetaHuman Interaction", "teacher": "Sam Okafor", "students": 26, "limit": 30, "institution": "Vertex Corp", "division": "Learning & Development", "progress": 55, "created_at": "2026-03-15", "student_ids": ["U-2", "U-3", "U-6", "U-8"]},
    {"id": "G-05", "name": "Helix Squad", "course": "Prompt Engineering for VR", "teacher": "Marcus Reid", "students": 9, "limit": 12, "institution": "Helix Robotics", "division": "Field Engineering", "progress": 47, "created_at": "2026-04-01", "student_ids": ["U-4", "U-5"]},
]

SEED_ORDERS = [
    {"id": "ORD-90231", "date": "2026-06-18", "client": "Global Fund Institute", "product": "Enterprise VR Program", "amount": 24800, "currency": "USD", "status": "paid", "method": "Wire Transfer", "payer": {"name": "Global Fund Institute", "email": "billing@globalfund.io", "address": "1 Finsbury Ave, London"}, "breakdown": {"subtotal": 26000, "discount": 1200, "tax": 0, "total": 24800, "promo": "COHORT12"}, "history": [{"status": "created", "date": "2026-06-15"}, {"status": "pending", "date": "2026-06-16"}, {"status": "paid", "date": "2026-06-18"}]},
    {"id": "ORD-90230", "date": "2026-06-16", "client": "Vertex L&D", "product": "Hybrid Session Pack (x20)", "amount": 8600, "currency": "USD", "status": "paid", "method": "Card", "payer": {"name": "Vertex Corp", "email": "ap@vertex.com", "address": "500 Market St, SF"}, "breakdown": {"subtotal": 8600, "discount": 0, "tax": 0, "total": 8600, "promo": None}, "history": [{"status": "created", "date": "2026-06-15"}, {"status": "paid", "date": "2026-06-16"}]},
    {"id": "ORD-90229", "date": "2026-06-15", "client": "Orion Consulting", "product": "Spatial Replay Add-on", "amount": 3200, "currency": "USD", "status": "pending", "method": "Card", "payer": {"name": "Orion Consulting", "email": "finance@orion.co", "address": "22 King St, Toronto"}, "breakdown": {"subtotal": 3200, "discount": 0, "tax": 0, "total": 3200, "promo": None}, "history": [{"status": "created", "date": "2026-06-14"}, {"status": "pending", "date": "2026-06-15"}]},
    {"id": "ORD-90228", "date": "2026-06-12", "client": "Nova Academy", "product": "Internship Track", "amount": 15400, "currency": "USD", "status": "paid", "method": "Wire Transfer", "payer": {"name": "Nova Academy", "email": "bursar@nova.edu", "address": "9 Campus Rd, Boston"}, "breakdown": {"subtotal": 16000, "discount": 600, "tax": 0, "total": 15400, "promo": "EDU5"}, "history": [{"status": "created", "date": "2026-06-10"}, {"status": "paid", "date": "2026-06-12"}]},
    {"id": "ORD-90227", "date": "2026-06-09", "client": "Helix Robotics", "product": "MetaHuman Scenario License", "amount": 5100, "currency": "USD", "status": "failed", "method": "Card", "payer": {"name": "Helix Robotics", "email": "pay@helix.ai", "address": "77 Innovation Dr, Austin"}, "breakdown": {"subtotal": 5100, "discount": 0, "tax": 0, "total": 5100, "promo": None}, "history": [{"status": "created", "date": "2026-06-08"}, {"status": "failed", "date": "2026-06-09"}]},
    {"id": "ORD-90226", "date": "2026-06-05", "client": "Aurora Health", "product": "Onboarding Curriculum", "amount": 11250, "currency": "USD", "status": "pending", "method": "Wire Transfer", "payer": {"name": "Aurora Health", "email": "accounts@aurora.health", "address": "3 Wellness Way, Denver"}, "breakdown": {"subtotal": 11250, "discount": 0, "tax": 0, "total": 11250, "promo": None}, "history": [{"status": "created", "date": "2026-06-04"}, {"status": "pending", "date": "2026-06-05"}]},
]

PRODUCTS = [
    {"id": "P-1", "name": "Enterprise VR Program", "price": 24800},
    {"id": "P-2", "name": "Hybrid Session Pack (x20)", "price": 8600},
    {"id": "P-3", "name": "Spatial Replay Add-on", "price": 3200},
    {"id": "P-4", "name": "Internship Track", "price": 15400},
]


async def seed():
    if await db.sessions.count_documents({}) == 0:
        await db.sessions.insert_many([dict(x) for x in SEED_SESSIONS])
    if await db.groups.count_documents({}) == 0:
        await db.groups.insert_many([dict(x) for x in SEED_GROUPS])
    if await db.orders.count_documents({}) == 0:
        await db.orders.insert_many([dict(x) for x in SEED_ORDERS])


# ---------------- Dashboard ----------------
@api_router.get("/dashboard/summary")
async def dashboard_summary():
    return {"analytics": ANALYTICS, "progress_series": PROGRESS_SERIES}


@api_router.get("/news")
async def get_news():
    return NEWS


@api_router.get("/meta")
async def meta():
    return {"teachers": TEACHERS, "courses": COURSES, "students": STUDENTS, "products": PRODUCTS}


# ---------------- Sessions ----------------
@api_router.get("/sessions")
async def get_sessions(q: Optional[str] = None, teacher: Optional[str] = None, group: Optional[str] = None, status: Optional[str] = None, date: Optional[str] = None):
    query = {}
    if teacher:
        query["teacher"] = teacher
    if group:
        query["group"] = group
    if status:
        query["status"] = status
    if date:
        query["date"] = date
    docs = await db.sessions.find(query, {"_id": 0}).to_list(200)
    if q:
        ql = q.lower()
        docs = [d for d in docs if ql in d["title"].lower()]
    docs.sort(key=lambda d: (d["date"], d["time"]))
    return docs


@api_router.get("/sessions/{sid}")
async def get_session(sid: str):
    doc = await db.sessions.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return doc


@api_router.delete("/sessions/{sid}")
async def delete_session(sid: str):
    await db.sessions.delete_one({"id": sid})
    return {"success": True}


# ---------------- Groups ----------------
class GroupIn(BaseModel):
    name: str
    course: str
    teacher: str
    institution: str = ""
    division: str = ""
    limit: int = 30
    student_ids: List[str] = []


@api_router.get("/groups")
async def get_groups():
    return await db.groups.find({}, {"_id": 0}).to_list(200)


@api_router.get("/groups/{gid}")
async def get_group(gid: str):
    doc = await db.groups.find_one({"id": gid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")
    doc["student_list"] = [s for s in STUDENTS if s["id"] in doc.get("student_ids", [])]
    doc["sessions"] = await db.sessions.find({"group": doc["name"]}, {"_id": 0}).to_list(50)
    return doc


@api_router.post("/groups")
async def create_group(body: GroupIn):
    gid = f"G-{uuid.uuid4().hex[:6]}"
    doc = body.model_dump()
    doc.update({"id": gid, "students": len(body.student_ids), "progress": 0, "created_at": datetime.now(timezone.utc).date().isoformat()})
    await db.groups.insert_one(dict(doc))
    return await db.groups.find_one({"id": gid}, {"_id": 0})


@api_router.put("/groups/{gid}")
async def update_group(gid: str, body: GroupIn):
    doc = body.model_dump()
    doc["students"] = len(body.student_ids)
    res = await db.groups.update_one({"id": gid}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return await db.groups.find_one({"id": gid}, {"_id": 0})


@api_router.delete("/groups/{gid}")
async def delete_group(gid: str):
    await db.groups.delete_one({"id": gid})
    return {"success": True}


# ---------------- Orders ----------------
class OrderIn(BaseModel):
    client: str
    product: str
    amount: int
    method: str = "Card"
    promo: Optional[str] = None
    discount: int = 0


@api_router.get("/orders")
async def get_orders():
    docs = await db.orders.find({}, {"_id": 0}).to_list(200)
    docs.sort(key=lambda d: d["date"], reverse=True)
    return docs


@api_router.get("/orders/{oid}")
async def get_order(oid: str):
    doc = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


@api_router.post("/orders")
async def create_order(body: OrderIn):
    oid = f"ORD-{uuid.uuid4().hex[:6].upper()}"
    today = datetime.now(timezone.utc).date().isoformat()
    total = body.amount - body.discount
    doc = {
        "id": oid, "date": today, "client": body.client, "product": body.product,
        "amount": total, "currency": "USD", "status": "paid", "method": body.method,
        "payer": {"name": body.client, "email": "", "address": ""},
        "breakdown": {"subtotal": body.amount, "discount": body.discount, "tax": 0, "total": total, "promo": body.promo},
        "history": [{"status": "created", "date": today}, {"status": "paid", "date": today}],
    }
    await db.orders.insert_one(dict(doc))
    return await db.orders.find_one({"id": oid}, {"_id": 0})


@api_router.get("/")
async def root():
    return {"message": "Cygnus Rift API"}


app.include_router(api_router)

app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
