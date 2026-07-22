"""Backend tests for Cygnus Rift dashboard API."""
import os
import time
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://luminous-portal.preview.emergentagent.com").rstrip("/")
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


# --- Public mock data endpoints ---
class TestPublicEndpoints:
    def test_summary(self):
        r = requests.get(f"{API}/dashboard/summary", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert "analytics" in j and "progress_series" in j
        a = j["analytics"]
        for k in ["students", "sessions_conducted", "learning_progress", "homework_completed"]:
            assert k in a
        assert isinstance(j["progress_series"], list) and len(j["progress_series"]) > 0

    def test_sessions(self):
        r = requests.get(f"{API}/sessions", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        assert {"id", "title", "group", "date", "time", "status"}.issubset(data[0].keys())

    def test_orders(self):
        r = requests.get(f"{API}/orders", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        assert {"id", "date", "client", "product", "amount", "status"}.issubset(data[0].keys())

    def test_groups(self):
        r = requests.get(f"{API}/groups", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        assert {"id", "name", "students", "institution", "progress"}.issubset(data[0].keys())

    def test_news(self):
        r = requests.get(f"{API}/news", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0


# --- Auth ---
class TestAuth:
    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_with_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer nope-invalid"}, timeout=10)
        assert r.status_code == 401

    def test_me_with_valid_bearer(self, session_token):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {session_token}"}, timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("email", "").startswith("test.user.")
        assert "user_id" in j and "name" in j

    def test_logout_deletes_session(self, session_token):
        # Logout with bearer
        r = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {session_token}"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("success") is True
        # Now /auth/me with same token should be 401
        r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {session_token}"}, timeout=10)
        assert r2.status_code == 401

    def test_session_missing_header(self):
        r = requests.post(f"{API}/auth/session", timeout=10)
        assert r.status_code == 400
