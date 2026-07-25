"""Focused auth security checks retained separately for quick regression runs."""
import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
API = f"{BASE_URL}/api"


def _demo_credentials():
    path = Path("/app/memory/test_credentials.md")
    if not path.exists():
        pytest.skip("Missing /app/memory/test_credentials.md")
    text = path.read_text(encoding="utf-8")
    teacher = re.search(r"Teacher:\s*`([^`]+)`\s*/\s*`([^`]+)`", text)
    student = re.search(r"Student:\s*`([^`]+)`\s*/\s*`([^`]+)`", text)
    if not teacher or not student:
        pytest.skip("Demo credentials missing from test_credentials.md")
    return {"teacher": (teacher.group(1), teacher.group(2)), "student": (student.group(1), student.group(2))}


# Login/session contract and the prior teacher-specialization regression.
class TestAuthOverhaulSmoke:
    @pytest.mark.parametrize("account,role", [("teacher", "teacher"), ("student", "student")])
    def test_demo_login_and_me(self, account, role):
        email, password = _demo_credentials()[account]
        login = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
        assert login.status_code == 200, login.text
        assert login.json()["role"] == role and login.json()["email"] == email
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {login.json()['token']}"}, timeout=20)
        assert me.status_code == 200
        assert me.json()["role"] == role and "password_hash" not in me.json()

    def test_teacher_without_specialization_returns_400(self):
        response = requests.post(
            f"{API}/auth/register",
            json={"name": "TEST Missing Spec", "email": f"test_{uuid.uuid4().hex[:10]}@example.com", "password": "secret123", "role": "teacher", "accept_terms": True},
            timeout=20,
        )
        assert response.status_code == 400
        assert "specialization" in response.json().get("detail", "").lower()

    def test_unauthenticated_me_is_401(self):
        response = requests.get(f"{API}/auth/me", timeout=20)
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"
