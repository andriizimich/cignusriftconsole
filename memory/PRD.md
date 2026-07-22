# PRD — Cygnus Rift VR Ops Console

## Original Problem Statement
Build an English-language futuristic user dashboard for the "Cygnus Rift" brand (enterprise VR training platform, from landing https://reel-to-radiance.lovable.app/). Authenticated dashboard with left/top nav (Summary, Sessions, Groups, Orders, Profile), a "My Schedule" block, quick analytics (students, sessions conducted, learning progress, homework), an Orders block (table: Order ID, Date, Client, Product, Amount, color-coded Payment Status, Action=download receipt), a Groups block (recent groups w/ student count + institution), and a news/announcements feed.

## User Choices
- Auth: Emergent-managed Google login + guest/demo entry
- Data: mock
- Receipt download: stub (toast)
- Theme: dark futuristic (designer's discretion)

## Architecture / Tasks Done (2026-06-22)
- Backend (FastAPI + Mongo): Emergent Google OAuth (`/api/auth/session`, `/api/auth/me`, `/api/auth/logout`, cookie + Bearer), mock endpoints (`/api/dashboard/summary`, `/api/sessions`, `/api/orders`, `/api/groups`, `/api/news`).
- Frontend (React + Tailwind + framer-motion + recharts + shadcn/sonner): dark cinematic theme (Unbounded + IBM Plex Sans), split-screen Login with Google + guest, DashboardLayout sidebar, pages Summary/Sessions/Groups/Orders/Profile with all required widgets and color-coded status badges.
- Verified: testing agent 100% backend + 100% frontend.

## Personas
- Lead Trainer / L&D operator managing VR cohorts, sessions, orders.

## Core Requirements (static)
- English UI, futuristic dark aesthetic, 5-section nav, analytics, schedule, orders table w/ receipt action, groups, news.

## Implemented (grows over time)
- 2026-06-22: MVP complete — auth (Google + guest), full dashboard, mock data, receipt stub.

## Backlog
- P1: Real receipt PDF generation; real CRUD for sessions/orders/groups; error/loading skeletons on Summary fetches.
- P2: Session calendar view; group detail pages; notifications; search/filter on orders.
