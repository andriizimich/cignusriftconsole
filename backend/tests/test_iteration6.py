"""Iteration 6 focused regression tests for seed constraints, booking participants, notifications, roles, and create flows."""
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

FRONTEND_ENV = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or FRONTEND_ENV.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
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


@pytest.fixture(scope="session")
def credentials():
    return load_credentials()


@pytest.fixture(scope="session")
def teacher_session(credentials):
    session = requests.Session()
    login = session.post(f"{API}/auth/login", json=credentials["teacher"], timeout=20)
    assert login.status_code == 200, login.text
    data = login.json()
    session.headers.update({"Authorization": f"Bearer {data['token']}"})
    return session, data


@pytest.fixture(scope="session")
def student_session(credentials):
    session = requests.Session()
    login = session.post(f"{API}/auth/login", json=credentials["student"], timeout=20)
    assert login.status_code == 200, login.text
    data = login.json()
    session.headers.update({"Authorization": f"Bearer {data['token']}"})
    return session, data


# Seeded lesson/group constraints and booking participant expansion.
class TestIteration6SeedData:
    def test_all_seeded_lesson_durations_are_at_most_40_minutes(self):
        response = requests.get(f"{API}/lessons", timeout=20)
        assert response.status_code == 200, response.text
        lessons = response.json()
        assert lessons
        assert all(isinstance(row["duration"], int) for row in lessons)
        assert all(0 < row["duration"] <= 40 for row in lessons), [(row["id"], row["duration"]) for row in lessons]

    def test_every_seeded_group_has_at_least_eight_students(self):
        response = requests.get(f"{API}/groups", timeout=20)
        assert response.status_code == 200, response.text
        groups = response.json()
        assert groups
        assert all(row["students"] >= 8 for row in groups), [(row["id"], row["students"]) for row in groups]

    def test_every_booking_detail_has_matching_nonempty_group_participants(self):
        listing = requests.get(f"{API}/bookings", timeout=20)
        assert listing.status_code == 200, listing.text
        rows = listing.json()
        assert rows
        for row in rows:
            detail_response = requests.get(f"{API}/bookings/{row['id']}", timeout=20)
            assert detail_response.status_code == 200, detail_response.text
            detail = detail_response.json()
            student_list = detail["group"]["student_list"]
            assert student_list, row["id"]
            assert detail["participants"] == len(student_list) == detail["group"]["students"]
            assert {student["id"] for student in student_list} == set(detail["group"]["student_ids"])
            assert all(student.get("name") and student.get("institution") for student in student_list)


# Auth contract and independent notification preference persistence.
class TestIteration6AuthAndNotifications:
    def test_teacher_and_student_roles_and_httponly_cookie(self, credentials):
        for account, expected_role in (("teacher", "teacher"), ("student", "student")):
            response = requests.post(f"{API}/auth/login", json=credentials[account], timeout=20)
            assert response.status_code == 200, response.text
            data = response.json()
            assert data["role"] == expected_role
            assert data["email"] == credentials[account]["email"]
            cookie = response.headers.get("set-cookie", "").lower()
            assert "access_token=" in cookie and "httponly" in cookie and "secure" in cookie

    def test_notification_toggles_update_independently_and_persist(self, teacher_session):
        session, _ = teacher_session
        original_response = session.get(f"{API}/auth/me", timeout=20)
        assert original_response.status_code == 200
        original = original_response.json()
        restore = {
            "email_notifications": original.get("email_notifications", True),
            "push_notifications": original.get("push_notifications", True),
        }
        try:
            first = {"email_notifications": not restore["email_notifications"], "push_notifications": restore["push_notifications"]}
            response = session.put(f"{API}/auth/notifications", json=first, timeout=20)
            assert response.status_code == 200, response.text
            assert response.json()["email_notifications"] == first["email_notifications"]
            assert response.json()["push_notifications"] == first["push_notifications"]
            persisted = session.get(f"{API}/auth/me", timeout=20).json()
            assert persisted["email_notifications"] == first["email_notifications"]
            assert persisted["push_notifications"] == first["push_notifications"]

            second = {"email_notifications": first["email_notifications"], "push_notifications": not first["push_notifications"]}
            response = session.put(f"{API}/auth/notifications", json=second, timeout=20)
            assert response.status_code == 200, response.text
            persisted = session.get(f"{API}/auth/me", timeout=20).json()
            assert persisted["email_notifications"] == second["email_notifications"]
            assert persisted["push_notifications"] == second["push_notifications"]
        finally:
            session.put(f"{API}/auth/notifications", json=restore, timeout=20)


# Teacher create lesson/group/booking and student join/leave end-to-end regression.
class TestIteration6CreateAndJoinRegression:
    def test_teacher_create_resources_then_student_join_leave(self, teacher_session, student_session):
        teacher, _ = teacher_session
        student, student_user = student_session
        suffix = uuid.uuid4().hex[:8]
        lesson_id = group_id = booking_id = None
        try:
            blocks_theory = requests.get(f"{API}/content-blocks", params={"type": "theory", "limit": 1}, timeout=20).json()["items"]
            blocks_practice = requests.get(f"{API}/content-blocks", params={"type": "practice", "limit": 1}, timeout=20).json()["items"]
            students = requests.get(f"{API}/students", timeout=20).json()
            assert blocks_theory and blocks_practice and students
            theory_id = blocks_theory[0]["id"]
            practice_id = blocks_practice[0]["id"]
            non_demo_student = next(row for row in students if row["email"].lower() != student_user["email"].lower())

            lesson_payload = {
                "title": f"TEST Iteration6 Lesson {suffix}",
                "description": "QA create regression",
                "category": "IT",
                "duration": 35,
                "theory_ids": [theory_id],
                "practice_ids": [practice_id],
                "quizzes": [
                    {"id": "Q1", "block_id": theory_id, "question": "Theory question?", "options": ["A", "B", "C", "D"], "correct": 0},
                    {"id": "Q2", "block_id": practice_id, "question": "Practice question?", "options": ["A", "B", "C", "D"], "correct": 1},
                ],
            }
            created_lesson = teacher.post(f"{API}/lessons", json=lesson_payload, timeout=20)
            assert created_lesson.status_code == 200, created_lesson.text
            lesson_id = created_lesson.json()["id"]
            fetched_lesson = requests.get(f"{API}/lessons/{lesson_id}", timeout=20).json()
            assert fetched_lesson["duration"] == 35
            assert fetched_lesson["theory_blocks"][0]["id"] == theory_id
            assert fetched_lesson["practice_blocks"][0]["id"] == practice_id
            assert {quiz["block_id"] for quiz in fetched_lesson["quizzes"]} == {theory_id, practice_id}

            group_payload = {"name": f"TEST Iteration6 Group {suffix}", "direction": "IT", "student_ids": [non_demo_student["id"]]}
            created_group = teacher.post(f"{API}/groups", json=group_payload, timeout=20)
            assert created_group.status_code == 200, created_group.text
            group_id = created_group.json()["id"]
            fetched_group = requests.get(f"{API}/groups/{group_id}", timeout=20).json()
            assert fetched_group["student_ids"] == [non_demo_student["id"]]
            assert fetched_group["student_list"][0]["id"] == non_demo_student["id"]

            future = (datetime.now(timezone.utc).date() + timedelta(days=30)).isoformat()
            created_booking = teacher.post(
                f"{API}/bookings",
                json={"lesson_id": lesson_id, "group_id": group_id, "date": future, "time": "14:00"},
                timeout=20,
            )
            assert created_booking.status_code == 200, created_booking.text
            booking_id = created_booking.json()["id"]
            booking = requests.get(f"{API}/bookings/{booking_id}", timeout=20).json()
            assert booking["lesson_id"] == lesson_id and booking["group_id"] == group_id
            assert booking["status"] == "scheduled" and booking["duration"] == 35
            assert booking["participants"] == 1 and len(booking["group"]["student_list"]) == 1

            before = student.get(f"{API}/bookings/student", timeout=20)
            assert before.status_code == 200
            row = next(item for item in before.json() if item["id"] == booking_id)
            assert row["joined"] is False and row["can_join"] is True
            joined = student.post(f"{API}/bookings/{booking_id}/join", timeout=20)
            assert joined.status_code == 200 and joined.json() == {"success": True}
            row = next(item for item in student.get(f"{API}/bookings/student", timeout=20).json() if item["id"] == booking_id)
            assert row["joined"] is True
            left = student.post(f"{API}/bookings/{booking_id}/leave", timeout=20)
            assert left.status_code == 200 and left.json() == {"success": True}
            row = next(item for item in student.get(f"{API}/bookings/student", timeout=20).json() if item["id"] == booking_id)
            assert row["joined"] is False and row["can_join"] is True
        finally:
            if booking_id:
                teacher.delete(f"{API}/bookings/{booking_id}", timeout=20)
                assert requests.get(f"{API}/bookings/{booking_id}", timeout=20).status_code == 404
            if group_id:
                teacher.delete(f"{API}/groups/{group_id}", timeout=20)
                assert requests.get(f"{API}/groups/{group_id}", timeout=20).status_code == 404
            if lesson_id:
                teacher.delete(f"{API}/lessons/{lesson_id}", timeout=20)
                assert requests.get(f"{API}/lessons/{lesson_id}", timeout=20).status_code == 404
