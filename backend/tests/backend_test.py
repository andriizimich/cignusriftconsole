"""Iteration 3 API regression for Cygnus Rift auth, lessons, groups, bookings, and profile."""
import os
import re
import subprocess
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

FRONTEND_ENV = dotenv_values("/app/frontend/.env")
BACKEND_ENV = dotenv_values("/app/backend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or FRONTEND_ENV.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL") or BACKEND_ENV.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME") or BACKEND_ENV.get("DB_NAME")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
API = f"{BASE_URL}/api"


def load_credentials():
    path = Path("/app/memory/test_credentials.md")
    if not path.exists():
        pytest.skip("Missing /app/memory/test_credentials.md")
    text = path.read_text(encoding="utf-8")
    teacher = re.search(r"Teacher:\s*`([^`]+)`\s*/\s*`([^`]+)`", text)
    student = re.search(r"Student:\s*`([^`]+)`\s*/\s*`([^`]+)`", text)
    if not teacher or not student:
        pytest.skip("Teacher/student credentials are absent from test_credentials.md")
    return {
        "teacher": {"email": teacher.group(1), "password": teacher.group(2)},
        "student": {"email": student.group(1), "password": student.group(2)},
    }


def mongo_eval(script):
    result = subprocess.run(
        ["mongosh", MONGO_URL, "--quiet", "--eval", f"db=db.getSiblingDB('{DB_NAME}'); {script}"],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    )
    return result.stdout.strip()


@pytest.fixture(scope="session")
def credentials():
    return load_credentials()


@pytest.fixture(scope="session")
def teacher(credentials):
    session = requests.Session()
    response = session.post(f"{API}/auth/login", json=credentials["teacher"], timeout=20)
    assert response.status_code == 200, response.text
    session.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
    return session


@pytest.fixture(scope="session")
def student(credentials):
    session = requests.Session()
    response = session.post(f"{API}/auth/login", json=credentials["student"], timeout=20)
    assert response.status_code == 200, response.text
    session.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
    return session


@pytest.fixture(scope="session")
def reference_data():
    theory = requests.get(f"{API}/content-blocks", params={"type": "theory", "limit": 2}, timeout=20).json()["items"]
    practice = requests.get(f"{API}/content-blocks", params={"type": "practice", "limit": 2}, timeout=20).json()["items"]
    students = requests.get(f"{API}/students", timeout=20).json()
    lessons = requests.get(f"{API}/lessons", timeout=20).json()
    groups = requests.get(f"{API}/groups", timeout=20).json()
    assert theory and practice and len(students) >= 8 and lessons and groups
    return {"theory": theory, "practice": practice, "students": students, "lessons": lessons, "groups": groups}


# Public reference data and dashboard response contracts.
class TestPublicData:
    def test_summary_and_reference_contracts(self):
        summary = requests.get(f"{API}/dashboard/summary", timeout=20)
        categories = requests.get(f"{API}/categories", timeout=20)
        blocks = requests.get(f"{API}/content-blocks", params={"type": "theory", "limit": 3}, timeout=20)
        assert summary.status_code == categories.status_code == blocks.status_code == 200
        data = summary.json()
        assert set(data["analytics"]) >= {"students", "bookings", "conducted", "lessons", "groups"}
        assert isinstance(data["progress_series"], list) and len(data["progress_series"]) == 6
        assert "Academic Disciplines" in categories.json() and "Business Sectors" in categories.json()
        block_data = blocks.json()
        assert block_data["total"] >= len(block_data["items"]) > 0
        assert all(item["type"] == "theory" and "_id" not in item for item in block_data["items"])

    def test_seed_constraints(self):
        lessons = requests.get(f"{API}/lessons", timeout=20).json()
        groups = requests.get(f"{API}/groups", timeout=20).json()
        assert lessons and all(1 <= item["duration"] <= 40 for item in lessons)
        assert groups and all(item["students"] >= 8 for item in groups)


# JWT password login, cookie, hashing, CORS, error handling, and lockout.
class TestAuth:
    @pytest.mark.parametrize("kind,role", [("teacher", "teacher"), ("student", "student")])
    def test_login_me_and_cookie(self, credentials, kind, role):
        session = requests.Session()
        login = session.post(f"{API}/auth/login", json=credentials[kind], timeout=20)
        assert login.status_code == 200, login.text
        body = login.json()
        assert body["email"] == credentials[kind]["email"] and body["role"] == role
        assert isinstance(body["token"], str) and "password_hash" not in body and "_id" not in body
        cookie = login.headers.get("set-cookie", "").lower()
        assert "access_token=" in cookie and "httponly" in cookie and "secure" in cookie and "samesite=none" in cookie
        me = session.get(f"{API}/auth/me", timeout=20)
        assert me.status_code == 200 and me.json()["email"] == credentials[kind]["email"]

    def test_bad_credentials_return_meaningful_401(self):
        response = requests.post(f"{API}/auth/login", json={"email": f"missing_{uuid.uuid4().hex}@example.com", "password": "wrongpass"}, timeout=20)
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    def test_hashes_are_bcrypt_2b(self, credentials):
        for kind in ("teacher", "student"):
            email = credentials[kind]["email"]
            output = mongo_eval(f"print(db.users.findOne({{email:'{email}'}}).password_hash)")
            assert output.startswith("$2b$"), output

    def test_cors_rejects_untrusted_origin_when_credentials_enabled(self):
        response = requests.options(
            f"{API}/auth/login",
            headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"},
            timeout=20,
        )
        assert response.headers.get("access-control-allow-origin") not in {"*", "https://evil.example"}

    def test_five_failures_lock_temporary_account(self):
        email = f"test_lock_{uuid.uuid4().hex[:10]}@example.com"
        password = "secret123"
        registered = requests.post(f"{API}/auth/register", json={"name": "TEST Lock User", "email": email, "password": password, "role": "teacher", "specialization": "IT", "accept_terms": True}, timeout=20)
        assert registered.status_code == 200, registered.text
        try:
            statuses = [requests.post(f"{API}/auth/login", json={"email": email, "password": "wrongpass"}, timeout=20).status_code for _ in range(6)]
            assert statuses[:5] == [401] * 5
            assert statuses[5] == 429, statuses
        finally:
            mongo_eval(f"db.users.deleteMany({{email:'{email}'}}); db.login_attempts.deleteMany({{identifier:/.*{email}.*/}})")


# Lesson CRUD, section-level quiz persistence, duration validation, and role authorization.
class TestLessons:
    def test_lesson_crud_and_section_quizzes(self, teacher, reference_data):
        suffix = uuid.uuid4().hex[:8]
        theory_id = reference_data["theory"][0]["id"]
        practice_id = reference_data["practice"][0]["id"]
        payload = {
            "title": f"TEST Section Quiz {suffix}", "description": "QA", "category": "IT", "duration": 39,
            "theory_ids": [theory_id], "practice_ids": [practice_id],
            "quizzes": [
                {"id": "Q1", "block_id": "theory", "question": "Theory?", "options": ["A", "B", "C", "D"], "correct": 1},
                {"id": "Q2", "block_id": "practice", "question": "Practice?", "options": ["A", "B", "C", "D"], "correct": 2},
            ],
        }
        lesson_id = None
        try:
            created = teacher.post(f"{API}/lessons", json=payload, timeout=20)
            assert created.status_code == 200, created.text
            lesson_id = created.json()["id"]
            fetched = requests.get(f"{API}/lessons/{lesson_id}", timeout=20)
            assert fetched.status_code == 200
            body = fetched.json()
            assert body["title"] == payload["title"] and body["duration"] == 39
            assert {quiz["block_id"] for quiz in body["quizzes"]} == {"theory", "practice"}
            assert body["theory_blocks"][0]["id"] == theory_id and body["practice_blocks"][0]["id"] == practice_id
            payload["title"] += " Updated"
            updated = teacher.put(f"{API}/lessons/{lesson_id}", json=payload, timeout=20)
            assert updated.status_code == 200
            assert requests.get(f"{API}/lessons/{lesson_id}", timeout=20).json()["title"].endswith("Updated")
            too_long = {**payload, "duration": 41}
            rejected = teacher.put(f"{API}/lessons/{lesson_id}", json=too_long, timeout=20)
            assert rejected.status_code == 400 and "40" in rejected.json()["detail"]
        finally:
            if lesson_id:
                teacher.delete(f"{API}/lessons/{lesson_id}", timeout=20)
                assert requests.get(f"{API}/lessons/{lesson_id}", timeout=20).status_code == 404

    def test_student_cannot_mutate_lessons(self, student, reference_data):
        payload = {
            "title": "TEST Student Mutation", "description": "QA", "category": "IT", "duration": 30,
            "theory_ids": [reference_data["theory"][0]["id"]], "practice_ids": [reference_data["practice"][0]["id"]], "quizzes": [],
        }
        response = student.put(f"{API}/lessons/L-NOT-FOUND", json=payload, timeout=20)
        assert response.status_code == 403, response.text
        response = student.delete(f"{API}/lessons/L-NOT-FOUND", timeout=20)
        assert response.status_code == 403, response.text


# Group minimum-size rule, CRUD persistence, and role authorization.
class TestGroups:
    def test_group_minimum_and_crud(self, teacher, reference_data):
        suffix = uuid.uuid4().hex[:8]
        student_ids = [item["id"] for item in reference_data["students"][:8]]
        too_small = teacher.post(f"{API}/groups", json={"name": f"TEST Small {suffix}", "direction": "IT", "student_ids": student_ids[:1]}, timeout=20)
        small_id = too_small.json().get("id") if too_small.headers.get("content-type", "").startswith("application/json") else None
        if small_id:
            teacher.delete(f"{API}/groups/{small_id}", timeout=20)
        assert too_small.status_code == 400, too_small.text

        group_id = None
        try:
            payload = {"name": f"TEST Group {suffix}", "direction": "IT", "student_ids": student_ids}
            created = teacher.post(f"{API}/groups", json=payload, timeout=20)
            assert created.status_code == 200, created.text
            group_id = created.json()["id"]
            assert created.json()["students"] == 8 and len(created.json()["student_list"]) == 8
            payload["name"] += " Updated"
            updated = teacher.put(f"{API}/groups/{group_id}", json=payload, timeout=20)
            assert updated.status_code == 200
            fetched = requests.get(f"{API}/groups/{group_id}", timeout=20).json()
            assert fetched["name"].endswith("Updated") and fetched["students"] == 8
        finally:
            if group_id:
                teacher.delete(f"{API}/groups/{group_id}", timeout=20)
                assert requests.get(f"{API}/groups/{group_id}", timeout=20).status_code == 404

    def test_student_cannot_mutate_groups(self, student):
        response = student.put(f"{API}/groups/G-NOT-FOUND", json={"name": "TEST", "direction": "IT", "student_ids": []}, timeout=20)
        assert response.status_code == 403, response.text
        response = student.delete(f"{API}/groups/G-NOT-FOUND", timeout=20)
        assert response.status_code == 403, response.text


# Booking linked-resource validation, CRUD, state restrictions, and student join/leave.
class TestBookings:
    def test_booking_crud_and_invalid_group(self, teacher, reference_data):
        lesson_id = reference_data["lessons"][0]["id"]
        group_id = reference_data["groups"][0]["id"]
        future = (datetime.now(timezone.utc).date() + timedelta(days=30)).isoformat()
        invalid = teacher.post(f"{API}/bookings", json={"lesson_id": lesson_id, "group_id": "G-MISSING", "date": future, "time": "13:00"}, timeout=20)
        invalid_id = invalid.json().get("id") if invalid.headers.get("content-type", "").startswith("application/json") else None
        if invalid_id:
            teacher.delete(f"{API}/bookings/{invalid_id}", timeout=20)
        assert invalid.status_code == 404, invalid.text

        booking_id = None
        try:
            created = teacher.post(f"{API}/bookings", json={"lesson_id": lesson_id, "group_id": group_id, "date": future, "time": "13:00"}, timeout=20)
            assert created.status_code == 200, created.text
            booking_id = created.json()["id"]
            body = created.json()
            assert body["status"] == "scheduled" and body["participants"] == len(body["group"]["student_list"])
            update = teacher.put(f"{API}/bookings/{booking_id}", json={"group_id": group_id, "date": future, "time": "14:30", "duration": 40}, timeout=20)
            assert update.status_code == 200
            fetched = requests.get(f"{API}/bookings/{booking_id}", timeout=20).json()
            assert fetched["time"] == "14:30" and fetched["duration"] == 40
        finally:
            if booking_id:
                teacher.delete(f"{API}/bookings/{booking_id}", timeout=20)
                assert requests.get(f"{API}/bookings/{booking_id}", timeout=20).status_code == 404

    def test_student_cannot_update_or_delete_booking(self, teacher, student, reference_data):
        future = (datetime.now(timezone.utc).date() + timedelta(days=31)).isoformat()
        created = teacher.post(f"{API}/bookings", json={"lesson_id": reference_data["lessons"][0]["id"], "group_id": reference_data["groups"][0]["id"], "date": future, "time": "10:00"}, timeout=20)
        assert created.status_code == 200
        booking_id = created.json()["id"]
        try:
            update = student.put(f"{API}/bookings/{booking_id}", json={"time": "11:00"}, timeout=20)
            assert update.status_code == 403, update.text
            delete = student.delete(f"{API}/bookings/{booking_id}", timeout=20)
            assert delete.status_code == 403, delete.text
        finally:
            teacher.delete(f"{API}/bookings/{booking_id}", timeout=20)

    def test_archived_booking_cannot_be_joined(self, teacher, student, reference_data):
        past = (datetime.now(timezone.utc).date() - timedelta(days=3)).isoformat()
        created = teacher.post(f"{API}/bookings", json={"lesson_id": reference_data["lessons"][0]["id"], "group_id": reference_data["groups"][-1]["id"], "date": past, "time": "10:00"}, timeout=20)
        assert created.status_code == 200 and created.json()["status"] == "archived"
        booking_id = created.json()["id"]
        try:
            joined = student.post(f"{API}/bookings/{booking_id}/join", timeout=20)
            assert joined.status_code in (400, 403), joined.text
        finally:
            teacher.delete(f"{API}/bookings/{booking_id}", timeout=20)


# Profile and notification persistence on the seeded teacher with restoration.
class TestProfile:
    def test_profile_and_notifications_persist_and_restore(self, teacher):
        original = teacher.get(f"{API}/auth/me", timeout=20).json()
        profile_restore = {key: original.get(key) for key in ("name", "phone", "institution", "picture")}
        notif_restore = {"email_notifications": original.get("email_notifications", True), "push_notifications": original.get("push_notifications", True)}
        try:
            changed = {**profile_restore, "phone": "+1 555 TEST"}
            response = teacher.put(f"{API}/auth/profile", json=changed, timeout=20)
            assert response.status_code == 200 and response.json()["phone"] == "+1 555 TEST"
            assert teacher.get(f"{API}/auth/me", timeout=20).json()["phone"] == "+1 555 TEST"
            prefs = {"email_notifications": not notif_restore["email_notifications"], "push_notifications": not notif_restore["push_notifications"]}
            response = teacher.put(f"{API}/auth/notifications", json=prefs, timeout=20)
            assert response.status_code == 200 and response.json()["email_notifications"] == prefs["email_notifications"]
            me = teacher.get(f"{API}/auth/me", timeout=20).json()
            assert me["email_notifications"] == prefs["email_notifications"] and me["push_notifications"] == prefs["push_notifications"]
        finally:
            teacher.put(f"{API}/auth/profile", json=profile_restore, timeout=20)
            teacher.put(f"{API}/auth/notifications", json=notif_restore, timeout=20)
