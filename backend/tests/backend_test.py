"""Iteration 4 backend API regression tests for auth, seeded data, lessons, groups, bookings, and profile."""
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


def _credentials():
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


def _mongo_eval(script):
    if not MONGO_URL or not DB_NAME:
        raise RuntimeError("MONGO_URL or DB_NAME is missing")
    return subprocess.run(
        ["mongosh", MONGO_URL, "--quiet", "--eval", f"use('{DB_NAME}'); {script}"],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    ).stdout.strip()


@pytest.fixture(scope="session")
def credentials():
    return _credentials()


@pytest.fixture(scope="session")
def teacher_auth(credentials):
    response = requests.post(f"{API}/auth/login", json=credentials["teacher"], timeout=20)
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


@pytest.fixture(scope="session")
def student_auth(credentials):
    response = requests.post(f"{API}/auth/login", json=credentials["student"], timeout=20)
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


@pytest.fixture(scope="session")
def temporary_teacher():
    email = f"test_teacher_{uuid.uuid4().hex[:10]}@example.com"
    password = "secret123"
    response = requests.post(
        f"{API}/auth/register",
        json={
            "name": "TEST Profile Teacher",
            "email": email,
            "password": password,
            "role": "teacher",
            "specialization": "IT",
            "accept_terms": True,
        },
        timeout=20,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    yield {"email": email, "password": password, "token": data["token"], "user": data}
    _mongo_eval(f"db.users.deleteMany({{email:'{email}'}}); db.password_resets.deleteMany({{email:'{email}'}});")


# Seed counts, response enrichment, filters, and reference collections.
class TestSeedAndReferenceData:
    def test_exact_seed_counts_and_summary_values(self):
        summary = requests.get(f"{API}/dashboard/summary", timeout=20)
        students = requests.get(f"{API}/students", timeout=20)
        groups = requests.get(f"{API}/groups", timeout=20)
        lessons = requests.get(f"{API}/lessons", timeout=20)
        bookings = requests.get(f"{API}/bookings", timeout=20)
        assert all(r.status_code == 200 for r in [summary, students, groups, lessons, bookings])
        analytics = summary.json()["analytics"]
        assert analytics["students"] == 50
        assert analytics["groups"] == 8
        assert analytics["lessons"] == 6
        assert analytics["bookings"] == 9
        assert len(students.json()) == 50
        assert len(groups.json()) == 8
        assert len(lessons.json()) == 6
        assert len(bookings.json()) == 9

    def test_seed_bookings_are_enriched_and_status_is_derived(self):
        rows = requests.get(f"{API}/bookings", timeout=20).json()
        assert rows
        required = {"lesson_title", "category", "group_name", "participants", "status"}
        assert all(required.issubset(row) for row in rows)
        assert all(row["status"] in {"scheduled", "active", "archived"} for row in rows)
        assert all(isinstance(row["participants"], int) for row in rows)

    def test_categories_are_grouped_academic_and_business(self):
        response = requests.get(f"{API}/categories", timeout=20)
        assert response.status_code == 200
        data = response.json()
        assert set(data) == {"Academic Disciplines", "Business Sectors"}
        assert "Computer Science" in data["Academic Disciplines"]
        assert "IT" in data["Business Sectors"]

    @pytest.mark.parametrize("block_type", ["theory", "practice"])
    def test_content_block_type_filter(self, block_type):
        response = requests.get(f"{API}/content-blocks", params={"type": block_type}, timeout=20)
        assert response.status_code == 200
        rows = response.json()
        assert rows and all(row["type"] == block_type for row in rows)
        assert all("_id" not in row for row in rows)


# Demo accounts, registration regression, JWT cookie, and brute-force protection.
class TestAuthRegression:
    @pytest.mark.parametrize("account,role", [("teacher", "teacher"), ("student", "student")])
    def test_demo_login_accounts(self, credentials, account, role):
        response = requests.post(f"{API}/auth/login", json=credentials[account], timeout=20)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["email"] == credentials[account]["email"]
        assert data["role"] == role
        assert isinstance(data["token"], str) and len(data["token"]) > 20
        assert "password_hash" not in data and "_id" not in data

    def test_teacher_registration_without_specialization_is_rejected(self):
        email = f"test_missing_spec_{uuid.uuid4().hex[:10]}@example.com"
        response = requests.post(
            f"{API}/auth/register",
            json={"name": "TEST Missing Spec", "email": email, "password": "secret123", "role": "teacher", "accept_terms": True},
            timeout=20,
        )
        assert response.status_code == 400, response.text
        assert "specialization" in response.json()["detail"].lower()

    def test_login_sets_secure_httponly_cookie(self, credentials):
        response = requests.post(f"{API}/auth/login", json=credentials["teacher"], timeout=20)
        cookie = response.headers.get("set-cookie", "").lower()
        assert response.status_code == 200
        assert "access_token=" in cookie and "httponly" in cookie
        assert "secure" in cookie and "samesite=none" in cookie

    def test_bcrypt_demo_hash_starts_with_2b(self, credentials):
        email = credentials["teacher"]["email"]
        output = _mongo_eval(f"print(db.users.findOne({{email:'{email}'}}).password_hash);")
        assert output.startswith("$2b$"), output

    def test_cors_credentials_echoes_explicit_frontend_origin(self):
        response = requests.options(
            f"{API}/auth/login",
            headers={"Origin": BASE_URL, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"},
            timeout=20,
        )
        assert response.status_code in (200, 204)
        assert response.headers.get("access-control-allow-origin") == BASE_URL
        assert response.headers.get("access-control-allow-credentials", "").lower() == "true"

    def test_brute_force_lockout_after_five_failures(self):
        email = f"test_lockout_{uuid.uuid4().hex[:10]}@example.com"
        statuses = []
        for _ in range(6):
            response = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong-pass"}, timeout=20)
            statuses.append(response.status_code)
        assert statuses[:5] == [401] * 5
        assert statuses[5] == 429, f"Expected lockout on sixth attempt, got {statuses}"


# Lesson list/search/category/detail and teacher CRUD validation.
class TestLessons:
    def test_filters_and_expanded_detail(self):
        all_rows = requests.get(f"{API}/lessons", timeout=20).json()
        target = all_rows[0]
        search = requests.get(f"{API}/lessons", params={"q": target["title"].split()[0]}, timeout=20)
        category = requests.get(f"{API}/lessons", params={"category": target["category"]}, timeout=20)
        detail = requests.get(f"{API}/lessons/{target['id']}", timeout=20)
        assert search.status_code == category.status_code == detail.status_code == 200
        assert target["id"] in {row["id"] for row in search.json()}
        assert all(row["category"] == target["category"] for row in category.json())
        expanded = detail.json()
        assert expanded["theory_blocks"] and expanded["practice_blocks"]
        assert all(block["id"] in expanded["theory_ids"] for block in expanded["theory_blocks"])

    @pytest.mark.parametrize("theory_ids,practice_ids,fragment", [([], ["CP-01"], "theory"), (["CT-01"], [], "practice")])
    def test_create_requires_theory_and_practice(self, teacher_auth, theory_ids, practice_ids, fragment):
        response = requests.post(
            f"{API}/lessons",
            headers=teacher_auth,
            json={"title": "TEST Invalid Lesson", "description": "QA", "category": "IT", "duration": 30, "theory_ids": theory_ids, "practice_ids": practice_ids, "quizzes": []},
            timeout=20,
        )
        assert response.status_code == 400
        assert fragment in response.json()["detail"].lower()

    def test_teacher_create_update_delete_with_persistence(self, teacher_auth):
        payload = {
            "title": "TEST Lesson CRUD",
            "description": "Initial QA lesson",
            "category": "IT",
            "duration": 45,
            "theory_ids": ["CT-01"],
            "practice_ids": ["CP-01"],
            "quizzes": [{"id": "Q1", "question": "TEST question?", "options": ["A", "B", "C", "D"], "correct": 1, "show_after": "theory"}],
        }
        created_id = None
        try:
            created = requests.post(f"{API}/lessons", headers=teacher_auth, json=payload, timeout=20)
            assert created.status_code == 200, created.text
            data = created.json()
            created_id = data["id"]
            assert data["title"] == payload["title"]
            assert data["theory_blocks"][0]["id"] == "CT-01"
            payload["title"] = "TEST Lesson CRUD Updated"
            payload["duration"] = 55
            updated = requests.put(f"{API}/lessons/{created_id}", headers=teacher_auth, json=payload, timeout=20)
            assert updated.status_code == 200
            fetched = requests.get(f"{API}/lessons/{created_id}", timeout=20)
            assert fetched.json()["title"] == payload["title"] and fetched.json()["duration"] == 55
        finally:
            if created_id:
                deleted = requests.delete(f"{API}/lessons/{created_id}", headers=teacher_auth, timeout=20)
                assert deleted.status_code == 200 and deleted.json() == {"success": True}
                assert requests.get(f"{API}/lessons/{created_id}", timeout=20).status_code == 404

    def test_student_cannot_create_teacher_lesson(self, student_auth):
        response = requests.post(
            f"{API}/lessons",
            headers=student_auth,
            json={"title": "TEST Student Forbidden", "description": "QA", "category": "IT", "duration": 30, "theory_ids": ["CT-01"], "practice_ids": ["CP-01"], "quizzes": []},
            timeout=20,
        )
        if response.status_code == 200:
            requests.delete(f"{API}/lessons/{response.json()['id']}", timeout=20)
        assert response.status_code in (401, 403), response.text


# Student pool and group create/read/update/delete expansion.
class TestGroups:
    def test_add_student_and_group_crud(self, teacher_auth):
        suffix = uuid.uuid4().hex[:8]
        new_student_id = None
        group_id = None
        try:
            student = requests.post(
                f"{API}/students",
                headers=teacher_auth,
                json={"name": f"TEST Student {suffix}", "institution": "TEST Institute", "division": "QA", "email": f"test_{suffix}@example.com", "phone": "+1 555 7777"},
                timeout=20,
            )
            assert student.status_code == 200, student.text
            new_student_id = student.json()["id"]
            assert student.json()["name"] == f"TEST Student {suffix}"
            create_payload = {"name": f"TEST Group {suffix}", "direction": "IT", "student_ids": [new_student_id]}
            created = requests.post(f"{API}/groups", headers=teacher_auth, json=create_payload, timeout=20)
            assert created.status_code == 200, created.text
            group_id = created.json()["id"]
            assert created.json()["students"] == 1
            assert created.json()["student_list"][0]["id"] == new_student_id
            update_payload = {**create_payload, "name": f"TEST Group Updated {suffix}", "student_ids": [new_student_id, "U-001"]}
            updated = requests.put(f"{API}/groups/{group_id}", headers=teacher_auth, json=update_payload, timeout=20)
            assert updated.status_code == 200
            fetched = requests.get(f"{API}/groups/{group_id}", timeout=20)
            assert fetched.json()["name"] == update_payload["name"]
            assert fetched.json()["students"] == 2
            assert isinstance(fetched.json()["bookings"], list)
        finally:
            if group_id:
                deleted = requests.delete(f"{API}/groups/{group_id}", headers=teacher_auth, timeout=20)
                assert deleted.status_code == 200
                assert requests.get(f"{API}/groups/{group_id}", timeout=20).status_code == 404
            if new_student_id:
                _mongo_eval(f"db.students.deleteMany({{id:'{new_student_id}'}});")


# Booking linked-resource CRUD, derived status, expanded detail, and student join/leave.
class TestBookings:
    def test_create_update_detail_delete_and_derived_status(self, teacher_auth):
        future = (datetime.now(timezone.utc).date() + timedelta(days=20)).isoformat()
        booking_id = None
        try:
            created = requests.post(
                f"{API}/bookings",
                headers=teacher_auth,
                json={"lesson_id": "L-001", "group_id": "G-08", "date": future, "time": "12:30"},
                timeout=20,
            )
            assert created.status_code == 200, created.text
            data = created.json()
            booking_id = data["id"]
            assert data["status"] == "scheduled"
            assert data["lesson"]["theory_blocks"] and data["lesson"]["practice_blocks"]
            assert isinstance(data["group"]["student_list"], list)
            update = requests.put(
                f"{API}/bookings/{booking_id}",
                headers=teacher_auth,
                json={"group_id": "G-07", "date": future, "time": "14:45", "duration": 80},
                timeout=20,
            )
            assert update.status_code == 200
            fetched = requests.get(f"{API}/bookings/{booking_id}", timeout=20).json()
            assert fetched["group_id"] == "G-07"
            assert fetched["time"] == "14:45" and fetched["duration"] == 80
            assert fetched["group_name"] == fetched["group"]["name"]
        finally:
            if booking_id:
                deleted = requests.delete(f"{API}/bookings/{booking_id}", headers=teacher_auth, timeout=20)
                assert deleted.status_code == 200 and deleted.json() == {"success": True}
                assert requests.get(f"{API}/bookings/{booking_id}", timeout=20).status_code == 404

    def test_today_and_past_statuses(self, teacher_auth):
        today = datetime.now(timezone.utc).date()
        ids = []
        try:
            for date_value, expected in [(today.isoformat(), "active"), ((today - timedelta(days=2)).isoformat(), "archived")]:
                response = requests.post(
                    f"{API}/bookings",
                    headers=teacher_auth,
                    json={"lesson_id": "L-002", "group_id": "G-08", "date": date_value, "time": "10:00"},
                    timeout=20,
                )
                assert response.status_code == 200
                ids.append(response.json()["id"])
                assert response.json()["status"] == expected
        finally:
            for booking_id in ids:
                requests.delete(f"{API}/bookings/{booking_id}", headers=teacher_auth, timeout=20)

    def test_unknown_group_link_is_rejected(self, teacher_auth):
        response = requests.post(
            f"{API}/bookings",
            headers=teacher_auth,
            json={"lesson_id": "L-001", "group_id": "G-DOES-NOT-EXIST", "date": (datetime.now(timezone.utc).date() + timedelta(days=5)).isoformat(), "time": "11:00"},
            timeout=20,
        )
        if response.status_code == 200:
            requests.delete(f"{API}/bookings/{response.json()['id']}", headers=teacher_auth, timeout=20)
        assert response.status_code == 404, response.text

    def test_student_join_then_leave_toggles(self, teacher_auth, student_auth, credentials):
        future = (datetime.now(timezone.utc).date() + timedelta(days=25)).isoformat()
        booking_id = None
        try:
            created = requests.post(
                f"{API}/bookings",
                headers=teacher_auth,
                json={"lesson_id": "L-003", "group_id": "G-08", "date": future, "time": "16:00"},
                timeout=20,
            )
            assert created.status_code == 200
            booking_id = created.json()["id"]
            before = requests.get(f"{API}/bookings/student", headers=student_auth, timeout=20).json()
            row = next(item for item in before if item["id"] == booking_id)
            assert row["joined"] is False and row["can_join"] is True
            joined = requests.post(f"{API}/bookings/{booking_id}/join", headers=student_auth, timeout=20)
            assert joined.status_code == 200 and joined.json() == {"success": True}
            row = next(item for item in requests.get(f"{API}/bookings/student", headers=student_auth, timeout=20).json() if item["id"] == booking_id)
            assert row["joined"] is True
            left = requests.post(f"{API}/bookings/{booking_id}/leave", headers=student_auth, timeout=20)
            assert left.status_code == 200 and left.json() == {"success": True}
            row = next(item for item in requests.get(f"{API}/bookings/student", headers=student_auth, timeout=20).json() if item["id"] == booking_id)
            assert row["joined"] is False and row["can_join"] is True
        finally:
            if booking_id:
                requests.delete(f"{API}/bookings/{booking_id}", headers=teacher_auth, timeout=20)


# Authenticated profile, notification, and password-change persistence.
class TestProfile:
    def test_profile_and_notifications_persist(self, temporary_teacher):
        headers = {"Authorization": f"Bearer {temporary_teacher['token']}"}
        profile = requests.put(
            f"{API}/auth/profile",
            headers=headers,
            json={"name": "TEST Profile Updated", "phone": "+1 555 9999", "institution": "TEST Academy", "picture": "data:image/png;base64,dGVzdA=="},
            timeout=20,
        )
        assert profile.status_code == 200
        assert profile.json()["name"] == "TEST Profile Updated"
        assert profile.json()["institution"] == "TEST Academy"
        me = requests.get(f"{API}/auth/me", headers=headers, timeout=20)
        assert me.json()["phone"] == "+1 555 9999"
        notif = requests.put(f"{API}/auth/notifications", headers=headers, json={"email_notifications": False, "push_notifications": True}, timeout=20)
        assert notif.status_code == 200
        assert notif.json()["email_notifications"] is False and notif.json()["push_notifications"] is True
        assert requests.get(f"{API}/auth/me", headers=headers, timeout=20).json()["email_notifications"] is False

    def test_change_password_validates_current_and_can_restore(self, temporary_teacher):
        headers = {"Authorization": f"Bearer {temporary_teacher['token']}"}
        wrong = requests.post(f"{API}/auth/change-password", headers=headers, json={"current_password": "wrong", "new_password": "changed123"}, timeout=20)
        assert wrong.status_code == 400
        changed = requests.post(
            f"{API}/auth/change-password",
            headers=headers,
            json={"current_password": temporary_teacher["password"], "new_password": "changed123"},
            timeout=20,
        )
        assert changed.status_code == 200 and changed.json() == {"success": True}
        assert requests.post(f"{API}/auth/login", json={"email": temporary_teacher["email"], "password": "changed123"}, timeout=20).status_code == 200
        restored = requests.post(f"{API}/auth/change-password", headers=headers, json={"current_password": "changed123", "new_password": temporary_teacher["password"]}, timeout=20)
        assert restored.status_code == 200
