"""Backend tests for Cygnus Rift dashboard API (iteration 2 - sessions/groups/orders CRUD)."""
import os
import time
import subprocess
import pytest
import requests
from pathlib import Path

def _load_frontend_env():
    p = Path("/app/frontend/.env")
    if p.exists():
        for line in p.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip()
    return None

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_env() or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session_token():
    """Insert a test user + session into Mongo and return the token."""
    token = f"test_session_{int(time.time())}"
    user_id = f"test-user-{int(time.time())}"
    email = f"test.user.{int(time.time())}@example.com"
    js = f"""
    db.users.insertOne({{ user_id: '{user_id}', email: '{email}', name: 'Test User', picture: null, created_at: new Date() }});
    db.user_sessions.insertOne({{ user_id: '{user_id}', session_token: '{token}', expires_at: new Date(Date.now()+7*24*60*60*1000), created_at: new Date() }});
    """
    subprocess.run(
        ["mongosh", "mongodb://localhost:27017/test_database", "--quiet", "--eval", js],
        check=True, capture_output=True, text=True,
    )
    yield token
    subprocess.run(
        ["mongosh", "mongodb://localhost:27017/test_database", "--quiet", "--eval",
         f"db.user_sessions.deleteOne({{session_token:'{token}'}}); db.users.deleteOne({{user_id:'{user_id}'}});"],
        capture_output=True, text=True,
    )


# --- Public dashboard/mock endpoints ---
class TestPublicEndpoints:
    def test_summary(self):
        r = requests.get(f"{API}/dashboard/summary", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert "analytics" in j and "progress_series" in j

    def test_news(self):
        r = requests.get(f"{API}/news", timeout=10)
        assert r.status_code == 200 and len(r.json()) > 0

    def test_meta(self):
        r = requests.get(f"{API}/meta", timeout=10)
        assert r.status_code == 200
        j = r.json()
        for k in ["teachers", "courses", "students", "products"]:
            assert k in j and isinstance(j[k], list) and len(j[k]) > 0


# --- Sessions ---
class TestSessions:
    def test_list_all(self):
        r = requests.get(f"{API}/sessions", timeout=10)
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list) and len(docs) > 0
        assert {"id", "title", "group", "teacher", "date", "status"}.issubset(docs[0].keys())
        # No mongo _id leaked
        assert "_id" not in docs[0]

    def test_filter_by_status(self):
        r = requests.get(f"{API}/sessions", params={"status": "completed"}, timeout=10)
        assert r.status_code == 200
        docs = r.json()
        assert all(d["status"] == "completed" for d in docs)
        assert len(docs) >= 1

    def test_filter_by_teacher(self):
        r = requests.get(f"{API}/sessions", params={"teacher": "Dr. Elena Voss"}, timeout=10)
        assert r.status_code == 200
        docs = r.json()
        assert all(d["teacher"] == "Dr. Elena Voss" for d in docs)

    def test_filter_by_group(self):
        r = requests.get(f"{API}/sessions", params={"group": "Alpha Cohort"}, timeout=10)
        assert r.status_code == 200
        docs = r.json()
        assert all(d["group"] == "Alpha Cohort" for d in docs)

    def test_filter_by_date(self):
        r = requests.get(f"{API}/sessions", params={"date": "2026-06-24"}, timeout=10)
        assert r.status_code == 200
        docs = r.json()
        assert all(d["date"] == "2026-06-24" for d in docs)

    def test_search_q(self):
        r = requests.get(f"{API}/sessions", params={"q": "Lumen"}, timeout=10)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 1
        assert all("lumen" in d["title"].lower() for d in docs)

    def test_get_single(self):
        r = requests.get(f"{API}/sessions/S-4821", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["id"] == "S-4821"
        assert "materials" in j and "homework" in j
        assert isinstance(j["homework"].get("submissions"), list)

    def test_get_single_404(self):
        r = requests.get(f"{API}/sessions/DOES-NOT-EXIST", timeout=10)
        assert r.status_code == 404

    def test_delete_session(self):
        # Insert a temp session via Mongo to avoid mutating seeded data
        js = "db.sessions.insertOne({id:'S-TEST-DEL', title:'TEST_del', group:'X', teacher:'X', date:'2026-01-01', time:'00:00', status:'scheduled', materials:[], homework:{description:'',submissions:[]}});"
        subprocess.run(["mongosh", "mongodb://localhost:27017/test_database", "--quiet", "--eval", js],
                       check=True, capture_output=True, text=True)
        r = requests.delete(f"{API}/sessions/S-TEST-DEL", timeout=10)
        assert r.status_code == 200 and r.json().get("success") is True
        r2 = requests.get(f"{API}/sessions/S-TEST-DEL", timeout=10)
        assert r2.status_code == 404


# --- Groups CRUD ---
class TestGroups:
    created_id = None

    def test_list(self):
        r = requests.get(f"{API}/groups", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) > 0

    def test_get_single_with_students_and_sessions(self):
        r = requests.get(f"{API}/groups/G-01", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["id"] == "G-01"
        assert "student_list" in j and isinstance(j["student_list"], list)
        assert len(j["student_list"]) == len(j.get("student_ids", []))
        assert "sessions" in j and isinstance(j["sessions"], list)

    def test_get_single_404(self):
        r = requests.get(f"{API}/groups/NOPE", timeout=10)
        assert r.status_code == 404

    def test_create_update_delete(self):
        # CREATE
        payload = {"name": "TEST_QA_Group", "course": "Immersive Cinematography",
                   "teacher": "Dr. Elena Voss", "institution": "TEST Inst",
                   "division": "QA", "limit": 20, "student_ids": ["U-1", "U-2"]}
        r = requests.post(f"{API}/groups", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["name"] == "TEST_QA_Group"
        assert created["students"] == 2
        assert created["course"] == "Immersive Cinematography"
        gid = created["id"]
        TestGroups.created_id = gid

        # GET verify persisted
        r2 = requests.get(f"{API}/groups/{gid}", timeout=10)
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST_QA_Group"
        assert len(r2.json()["student_list"]) == 2

        # UPDATE
        payload["name"] = "TEST_QA_Group_Renamed"
        payload["student_ids"] = ["U-1", "U-2", "U-3"]
        r3 = requests.put(f"{API}/groups/{gid}", json=payload, timeout=10)
        assert r3.status_code == 200
        assert r3.json()["name"] == "TEST_QA_Group_Renamed"
        assert r3.json()["students"] == 3

        # DELETE + verify 404
        r4 = requests.delete(f"{API}/groups/{gid}", timeout=10)
        assert r4.status_code == 200 and r4.json().get("success") is True
        r5 = requests.get(f"{API}/groups/{gid}", timeout=10)
        assert r5.status_code == 404

    def test_update_nonexistent(self):
        payload = {"name": "X", "course": "X", "teacher": "X", "student_ids": []}
        r = requests.put(f"{API}/groups/G-DOES-NOT-EXIST", json=payload, timeout=10)
        assert r.status_code == 404


# --- Orders ---
class TestOrders:
    def test_list(self):
        r = requests.get(f"{API}/orders", timeout=10)
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list) and len(docs) > 0
        # sorted date desc
        assert docs[0]["date"] >= docs[-1]["date"]

    def test_get_single(self):
        r = requests.get(f"{API}/orders/ORD-90231", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["id"] == "ORD-90231"
        assert "payer" in j and "breakdown" in j and "history" in j
        assert j["breakdown"]["total"] == 24800

    def test_get_single_404(self):
        r = requests.get(f"{API}/orders/NOPE-XX", timeout=10)
        assert r.status_code == 404

    def test_create_order_checkout_stub(self):
        payload = {"client": "TEST_ClientCo", "product": "Enterprise VR Program",
                   "amount": 24800, "method": "Card", "promo": "COHORT12", "discount": 1200}
        r = requests.post(f"{API}/orders", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["status"] == "paid"
        assert created["amount"] == 24800 - 1200
        assert created["breakdown"]["total"] == 23600
        assert created["breakdown"]["subtotal"] == 24800
        assert created["breakdown"]["discount"] == 1200
        assert created["breakdown"]["promo"] == "COHORT12"
        assert any(h["status"] == "paid" for h in created["history"])

        # GET verify persisted
        r2 = requests.get(f"{API}/orders/{created['id']}", timeout=10)
        assert r2.status_code == 200
        assert r2.json()["client"] == "TEST_ClientCo"


# --- Auth ---
class TestAuth:
    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_with_valid_bearer(self, session_token):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {session_token}"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("email", "").startswith("test.user.")

    def test_logout(self, session_token):
        r = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {session_token}"}, timeout=10)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {session_token}"}, timeout=10)
        assert r2.status_code == 401

    def test_session_missing_header(self):
        r = requests.post(f"{API}/auth/session", timeout=10)
        assert r.status_code == 400
