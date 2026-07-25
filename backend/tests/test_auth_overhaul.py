"""Iteration 3 API tests for email/password auth, reset flow, and auth security controls."""
import os
import re
import subprocess
import uuid
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
if not MONGO_URL or not DB_NAME:
    raise RuntimeError("MONGO_URL or DB_NAME is missing")
API = f"{BASE_URL}/api"
TEACHER = {"email": "teacher@cygnusrift.io", "password": "password123"}
STUDENT = {"email": "student@cygnusrift.io", "password": "password123"}
CREATED_EMAILS = []


def _mongo_eval(script):
    return subprocess.run(
        ["mongosh", MONGO_URL, "--quiet", "--eval", f"use('{DB_NAME}'); {script}"],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    ).stdout.strip()


@pytest.fixture(scope="module", autouse=True)
def cleanup_registered_users():
    yield
    if CREATED_EMAILS:
        emails = ",".join(f"'{email}'" for email in CREATED_EMAILS)
        _mongo_eval(f"db.users.deleteMany({{email:{{$in:[{emails}]}}}}); db.password_resets.deleteMany({{email:{{$in:[{emails}]}}}});")


def _assert_auth_payload(data, expected_email, expected_role):
    assert isinstance(data.get("token"), str) and len(data["token"]) > 20
    assert data["email"] == expected_email
    assert data["role"] == expected_role
    assert isinstance(data.get("user_id"), str) and data["user_id"].startswith("user_")
    assert "password_hash" not in data
    assert "_id" not in data


# Registration, specialization metadata, persistence, and validation.
class TestRegistration:
    def test_specializations_grouped(self):
        response = requests.get(f"{API}/auth/specializations", timeout=15)
        assert response.status_code == 200
        data = response.json()
        assert set(data) == {"Corporate", "Academic"}
        assert all(isinstance(items, list) and items for items in data.values())
        assert "Software Engineering" in data["Corporate"]
        assert "Computer Science" in data["Academic"]

    def test_register_student_and_verify_me(self):
        email = f"test_student_{uuid.uuid4().hex[:10]}@example.com"
        CREATED_EMAILS.append(email)
        payload = {
            "name": "TEST Student",
            "email": email,
            "password": "secret123",
            "role": "student",
            "phone": "+1 555 1010",
            "accept_terms": True,
        }
        response = requests.post(f"{API}/auth/register", json=payload, timeout=15)
        assert response.status_code == 200, response.text
        data = response.json()
        _assert_auth_payload(data, email, "student")
        assert data["specialization"] is None
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {data['token']}"}, timeout=15)
        assert me.status_code == 200
        assert me.json()["email"] == email and me.json()["role"] == "student"
        assert "password_hash" not in me.json()

    def test_register_teacher_and_verify_persistence(self):
        email = f"test_teacher_{uuid.uuid4().hex[:10]}@example.com"
        CREATED_EMAILS.append(email)
        payload = {
            "name": "TEST Teacher",
            "email": email,
            "password": "secret123",
            "role": "teacher",
            "phone": "+1 555 2020",
            "specialization": "Software Engineering",
            "accept_terms": True,
        }
        response = requests.post(f"{API}/auth/register", json=payload, timeout=15)
        assert response.status_code == 200, response.text
        data = response.json()
        _assert_auth_payload(data, email, "teacher")
        assert data["specialization"] == "Software Engineering"
        login = requests.post(f"{API}/auth/login", json={"email": email, "password": "secret123"}, timeout=15)
        assert login.status_code == 200
        assert login.json()["specialization"] == "Software Engineering"

    def test_teacher_requires_specialization(self):
        email = f"test_teacher_missing_spec_{uuid.uuid4().hex[:10]}@example.com"
        CREATED_EMAILS.append(email)
        response = requests.post(
            f"{API}/auth/register",
            json={
                "name": "TEST Missing Spec",
                "email": email,
                "password": "secret123",
                "role": "teacher",
                "phone": "+1 555 3030",
                "accept_terms": True,
            },
            timeout=15,
        )
        assert response.status_code == 400, f"Teacher without specialization was accepted: {response.text}"
        assert "special" in response.json().get("detail", "").lower()

    @pytest.mark.parametrize(
        "payload,expected_fragment",
        [
            ({"name": "TEST Terms", "email": "placeholder", "password": "secret123", "role": "student", "accept_terms": False}, "terms"),
            ({"name": "TEST Short", "email": "placeholder", "password": "12345", "role": "student", "accept_terms": True}, "6"),
        ],
    )
    def test_register_validation(self, payload, expected_fragment):
        email = f"test_validation_{uuid.uuid4().hex[:10]}@example.com"
        payload["email"] = email
        response = requests.post(f"{API}/auth/register", json=payload, timeout=15)
        assert response.status_code == 400
        assert expected_fragment in response.json().get("detail", "").lower()

    def test_duplicate_email_rejected(self):
        response = requests.post(
            f"{API}/auth/register",
            json={"name": "Duplicate", "email": TEACHER["email"], "password": "secret123", "role": "student", "accept_terms": True},
            timeout=15,
        )
        assert response.status_code == 400
        assert "already exists" in response.json().get("detail", "").lower()


# Demo login, JWT /me behavior, cookie flags, CORS, and lockout security.
class TestLoginAndSession:
    @pytest.mark.parametrize(
        "credentials,expected_role",
        [(TEACHER, "teacher"), (STUDENT, "student")],
    )
    def test_demo_login(self, credentials, expected_role):
        response = requests.post(f"{API}/auth/login", json=credentials, timeout=15)
        assert response.status_code == 200, response.text
        _assert_auth_payload(response.json(), credentials["email"], expected_role)

    def test_wrong_password_is_401(self):
        response = requests.post(f"{API}/auth/login", json={"email": TEACHER["email"], "password": "wrong-password"}, timeout=15)
        assert response.status_code == 401
        assert response.json().get("detail") == "Invalid email or password"

    def test_login_cookie_is_httponly_secure_samesite_none(self):
        response = requests.post(f"{API}/auth/login", json=TEACHER, timeout=15)
        assert response.status_code == 200
        cookie = response.headers.get("set-cookie", "").lower()
        assert "access_token=" in cookie
        assert "httponly" in cookie
        assert "secure" in cookie
        assert "samesite=none" in cookie
        assert "path=/" in cookie

    def test_me_without_token_is_401(self):
        response = requests.get(f"{API}/auth/me", timeout=15)
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"

    def test_me_with_bearer_has_clean_user(self):
        login = requests.post(f"{API}/auth/login", json=TEACHER, timeout=15)
        token = login.json()["token"]
        response = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert response.status_code == 200
        assert response.json()["role"] == "teacher"
        assert response.json()["email"] == TEACHER["email"]
        assert "password_hash" not in response.json() and "_id" not in response.json()

    def test_cors_credentials_uses_explicit_origin(self):
        response = requests.options(
            f"{API}/auth/login",
            headers={
                "Origin": BASE_URL,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
            timeout=15,
        )
        assert response.status_code in (200, 204)
        assert response.headers.get("access-control-allow-origin") == BASE_URL
        assert response.headers.get("access-control-allow-credentials", "").lower() == "true"

    def test_bcrypt_hashes_are_2b(self):
        output = _mongo_eval("printjson(db.users.findOne({email:'teacher@cygnusrift.io'},{_id:0,password_hash:1}));")
        assert re.search(r'password_hash\s*:\s*[\'\"]\$2b\$', output), output

    def test_lockout_after_five_failures(self):
        email = f"lockout_probe_{uuid.uuid4().hex[:8]}@example.com"
        CREATED_EMAILS.append(email)
        register = requests.post(
            f"{API}/auth/register",
            json={"name": "TEST Lockout", "email": email, "password": "secret123", "role": "student", "accept_terms": True},
            timeout=15,
        )
        assert register.status_code == 200
        statuses = []
        for _ in range(6):
            response = requests.post(f"{API}/auth/login", json={"email": email, "password": "bad-password"}, timeout=15)
            statuses.append(response.status_code)
        assert statuses[:5] == [401] * 5
        assert statuses[5] == 429, f"No brute-force lockout after five failures; statuses={statuses}"


# Three-step password recovery including code reuse prevention and password restoration.
class TestPasswordRecovery:
    def test_existing_email_full_reset_then_restore(self):
        forgot = requests.post(f"{API}/auth/forgot-password", json={"email": STUDENT["email"]}, timeout=15)
        assert forgot.status_code == 200
        code = forgot.json().get("demo_code")
        assert isinstance(code, str) and re.fullmatch(r"\d{6}", code)

        wrong = requests.post(f"{API}/auth/verify-code", json={"email": STUDENT["email"], "code": "not-it"}, timeout=15)
        assert wrong.status_code == 400
        assert "invalid or expired" in wrong.json().get("detail", "").lower()

        verify = requests.post(f"{API}/auth/verify-code", json={"email": STUDENT["email"], "code": code}, timeout=15)
        assert verify.status_code == 200 and verify.json() == {"valid": True}

        new_password = f"new-{uuid.uuid4().hex[:8]}"
        try:
            reset = requests.post(
                f"{API}/auth/reset-password",
                json={"email": STUDENT["email"], "code": code, "password": new_password},
                timeout=15,
            )
            assert reset.status_code == 200 and reset.json() == {"success": True}
            old_login = requests.post(f"{API}/auth/login", json=STUDENT, timeout=15)
            assert old_login.status_code == 401
            new_login = requests.post(f"{API}/auth/login", json={"email": STUDENT["email"], "password": new_password}, timeout=15)
            assert new_login.status_code == 200 and new_login.json()["role"] == "student"
            reused = requests.post(
                f"{API}/auth/reset-password",
                json={"email": STUDENT["email"], "code": code, "password": "another123"},
                timeout=15,
            )
            assert reused.status_code == 400
        finally:
            restore_forgot = requests.post(f"{API}/auth/forgot-password", json={"email": STUDENT["email"]}, timeout=15)
            restore_code = restore_forgot.json().get("demo_code")
            restore = requests.post(
                f"{API}/auth/reset-password",
                json={"email": STUDENT["email"], "code": restore_code, "password": STUDENT["password"]},
                timeout=15,
            )
            assert restore.status_code == 200

    def test_unknown_email_does_not_disclose_account(self):
        response = requests.post(f"{API}/auth/forgot-password", json={"email": "absent_user@example.com"}, timeout=15)
        assert response.status_code == 200
        assert response.json()["demo_code"] is None
        assert response.json()["message"] == "If the email exists, a code has been sent."

    def test_reset_rejects_short_password(self):
        forgot = requests.post(f"{API}/auth/forgot-password", json={"email": TEACHER["email"]}, timeout=15)
        code = forgot.json()["demo_code"]
        response = requests.post(
            f"{API}/auth/reset-password",
            json={"email": TEACHER["email"], "code": code, "password": "12345"},
            timeout=15,
        )
        assert response.status_code == 400
        assert "at least 6" in response.json().get("detail", "").lower()
