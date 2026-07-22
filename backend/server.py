from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


# ---------------- Models ----------------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None


# ---------------- Auth helpers ----------------
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

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


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
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data.get("picture")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60,
    )

    return {
        "user_id": user_id,
        "email": data["email"],
        "name": data["name"],
        "picture": data.get("picture"),
        "session_token": session_token,
    }


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


# ---------------- Mock dashboard data ----------------
ANALYTICS = {
    "students": 248,
    "students_delta": "+12.4%",
    "sessions_conducted": 96,
    "sessions_delta": "+8.1%",
    "learning_progress": 74,
    "progress_delta": "+5.2%",
    "homework_completed": 182,
    "homework_total": 210,
    "homework_delta": "+3.6%",
}

PROGRESS_SERIES = [
    {"month": "Jan", "progress": 42, "sessions": 8},
    {"month": "Feb", "progress": 51, "sessions": 11},
    {"month": "Mar", "progress": 58, "sessions": 13},
    {"month": "Apr", "progress": 63, "sessions": 15},
    {"month": "May", "progress": 69, "sessions": 18},
    {"month": "Jun", "progress": 74, "sessions": 21},
]

SCHEDULE = [
    {"id": "S-4821", "title": "MetaHuman Interview Simulation", "group": "Alpha Cohort", "date": "2026-06-24", "time": "09:30", "duration": "90 min", "mode": "Hybrid", "status": "confirmed"},
    {"id": "S-4822", "title": "Lumen Lighting Theory + Practice", "group": "Nova Interns", "date": "2026-06-24", "time": "13:00", "duration": "60 min", "mode": "Practice", "status": "confirmed"},
    {"id": "S-4823", "title": "Spatial Replay Debrief", "group": "Orion Consultants", "date": "2026-06-25", "time": "11:00", "duration": "45 min", "mode": "Theory", "status": "pending"},
    {"id": "S-4824", "title": "Prompt-Engineered Crisis Scenario", "group": "Vertex L&D", "date": "2026-06-26", "time": "15:30", "duration": "120 min", "mode": "Hybrid", "status": "confirmed"},
    {"id": "S-4825", "title": "Nanite Environment Walkthrough", "group": "Alpha Cohort", "date": "2026-06-27", "time": "10:00", "duration": "75 min", "mode": "Practice", "status": "pending"},
]

ORDERS = [
    {"id": "ORD-90231", "date": "2026-06-18", "client": "Global Fund Institute", "product": "Enterprise VR Program", "amount": 24800, "currency": "USD", "status": "paid"},
    {"id": "ORD-90230", "date": "2026-06-16", "client": "Vertex L&D", "product": "Hybrid Session Pack (x20)", "amount": 8600, "currency": "USD", "status": "paid"},
    {"id": "ORD-90229", "date": "2026-06-15", "client": "Orion Consulting", "product": "Spatial Replay Add-on", "amount": 3200, "currency": "USD", "status": "pending"},
    {"id": "ORD-90228", "date": "2026-06-12", "client": "Nova Academy", "product": "Internship Track", "amount": 15400, "currency": "USD", "status": "paid"},
    {"id": "ORD-90227", "date": "2026-06-09", "client": "Helix Robotics", "product": "MetaHuman Scenario License", "amount": 5100, "currency": "USD", "status": "failed"},
    {"id": "ORD-90226", "date": "2026-06-05", "client": "Aurora Health", "product": "Onboarding Curriculum", "amount": 11250, "currency": "USD", "status": "pending"},
]

GROUPS = [
    {"id": "G-01", "name": "Alpha Cohort", "students": 32, "institution": "Global Fund Institute", "division": "Investment Training", "progress": 78},
    {"id": "G-02", "name": "Nova Interns", "students": 18, "institution": "Nova Academy", "division": "Internship Program", "progress": 64},
    {"id": "G-03", "name": "Orion Consultants", "students": 12, "institution": "Orion Consulting", "division": "Advisory Practice", "progress": 91},
    {"id": "G-04", "name": "Vertex L&D", "students": 26, "institution": "Vertex Corp", "division": "Learning & Development", "progress": 55},
    {"id": "G-05", "name": "Helix Squad", "students": 9, "institution": "Helix Robotics", "division": "Field Engineering", "progress": 47},
]

NEWS = [
    {"id": "N-1", "tag": "Release", "title": "Cygnus Rift App v0.9 pushes real-time spatial heatmaps", "date": "2026-06-19", "summary": "Trainers can now overlay participant gaze and movement heatmaps directly on the replay timeline."},
    {"id": "N-2", "tag": "AI", "title": "Generative narration now supports 14 languages", "date": "2026-06-14", "summary": "Adaptive theory briefings are auto-authored per cohort with localized voice synthesis."},
    {"id": "N-3", "tag": "Milestone", "title": "Prototype kick-off scheduled for July 2026", "date": "2026-06-10", "summary": "Core immersion loop, session composer and headset sync pipeline enter active build."},
    {"id": "N-4", "tag": "Partner", "title": "Global Fund joins the first institutional cohort", "date": "2026-06-02", "summary": "Enterprise due-diligence replay tooling enters closed pilot with design partners."},
]


@api_router.get("/dashboard/summary")
async def dashboard_summary():
    return {"analytics": ANALYTICS, "progress_series": PROGRESS_SERIES}


@api_router.get("/sessions")
async def get_sessions():
    return SCHEDULE


@api_router.get("/orders")
async def get_orders():
    return ORDERS


@api_router.get("/groups")
async def get_groups():
    return GROUPS


@api_router.get("/news")
async def get_news():
    return NEWS


@api_router.get("/")
async def root():
    return {"message": "Cygnus Rift API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
