# Auth Testing Playbook (Emergent Google OAuth)

## Create test user + session
```
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({ user_id: userId, email: 'test.user.'+Date.now()+'@example.com', name: 'Test User', picture: 'https://via.placeholder.com/150', created_at: new Date() });
db.user_sessions.insertOne({ user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now()+7*24*60*60*1000), created_at: new Date() });
print('Session token: ' + sessionToken);
"
```

## Backend
- GET /api/auth/me with `Authorization: Bearer <session_token>` → user JSON
- POST /api/auth/logout → clears session

## Browser (guest path, no OAuth needed)
- Go to /login, click `guest-login-button` → lands on /dashboard.

## Browser (session cookie path)
```
await page.context.add_cookies([{ "name":"session_token","value":"<TOKEN>","domain":"<host>","path":"/","httpOnly":true,"secure":true,"sameSite":"None" }])
```
Or set localStorage `session_token` before load (Bearer fallback).

## Public data endpoints (no auth)
/api/dashboard/summary, /api/sessions, /api/orders, /api/groups, /api/news
