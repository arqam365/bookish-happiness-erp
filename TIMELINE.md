# Cognivia ERP — Project Timeline & Progress Tracker

**Platform:** CogniviaERP — Multi-Tenant Education ERP (Schools, Colleges, Madrasas)
**Last Updated:** 2026-04-30
**Repos:** `cognivia-erp` (Frontend · Next.js 16) + `cognivia-erp-engine` (Backend · NestJS 11)

---

## Overall Completion Summary

| Layer | Phases Total | Phases Done | Progress | Time Spent | Time Remaining |
|-------|-------------|-------------|----------|------------|----------------|
| Backend (NestJS) | 16 | 4 | 25% | ~8 days | ~23 days |
| Frontend (Next.js) | 15 | 4 | 27% | ~1 day (AI-assisted) | ~36 days |
| **Combined** | **31** | **8** | **~26%** | **~9 days** | **~59 days** |

> **AI-assisted velocity note:** Frontend Phases 1–4 (normally ~10 days) were completed in a single session using Claude Code. Remaining estimates use standard human-dev pacing (1 developer). With continued AI assistance, remaining frontend work could compress to ~15–18 days.

---

## Backend — `cognivia-erp-engine`

Stack: NestJS 11 + Fastify · Prisma 6 · PostgreSQL (Neon) · Redis (Upstash) · BullMQ · Railway

### Completed (~8 days spent)

| Phase | Description | Time Spent | Status |
|-------|-------------|------------|--------|
| 0 | Scaffold — NestJS + Fastify bootstrap, ConfigModule, Docker Compose, Railway config | ~0.5 day | ✅ Done |
| 1 | Database Schema — full multi-tenant schema, RBAC tables, all ERP models, Madrasa plugin models | ~2 days | ✅ Done |
| 2 | Core Infrastructure — TenancyMiddleware, JwtAuthGuard, RbacGuard, GlobalExceptionFilter, AuditLogInterceptor, decorators | ~1.5 days | ✅ Done |
| 3 | Auth Module — register, login, refresh, logout, /auth/me, JWT Passport strategy | ~1 day | ✅ Done |
| 4 | Core ERP Modules — Students, Attendance, Fees, Exams, Settings, Madrasa, Dashboard, Notifications, Health check | ~3 days | ✅ Done |

### Remaining (~23 days)

| Phase | Description | Est. Time | Priority |
|-------|-------------|-----------|----------|
| 5 | Seed & Permissions — migrate to Neon, seed demo org/roles/permissions, verify Swagger | 0.5 day | 🔴 Immediate |
| 6 | Accounts Module — chart of accounts, receipts, vouchers, ledger, day book, cash-in-hand, trial balance | 3 days | 🔴 High |
| 7 | Reports & Export Engine — 7 report endpoints, Excel/CSV/PDF export via exceljs + pdfkit | 4 days | 🔴 High |
| 8 | BullMQ Background Jobs — notification worker, export worker, attendance alert worker, fee reminder cron | 3 days | 🟡 Medium |
| 9 | Realtime WebSocket Gateway — attendance gateway, notification gateway, per-institute rooms, JWT socket auth | 2 days | 🟡 Medium |
| 10 | File Upload (Cloudflare R2) — avatar, student photo, documents, org logo, signed URLs | 1.5 days | 🟡 Medium |
| 11 | Guardians & Parent Data — CRUD endpoints, link guardian to student, sponsor flag | 1 day | 🟡 Medium |
| 12 | Tasks & Events — task CRUD, mark complete, my-tasks, role-based visibility | 1 day | 🟢 Low |
| 13 | Multi-Institute Switching — list institutes, switch-institute token, institute-scoped tokens | 1 day | 🟡 Medium |
| 14 | Security Hardening — rate limiting, Helmet, input sanitization, audit log retention, soft-delete | 2 days | 🟡 Medium |
| 15 | Testing — unit tests (auth, fees, attendance), integration tests, Prisma test client, GitHub Actions CI | 3 days | 🟡 Medium |
| 16 | Production Deployment — Railway setup, env vars, migrate deploy, health check verification | 1 day | 🔴 High |

**Backend: ~8 days spent · ~23 days remaining**

---

## Frontend — `cognivia-erp`

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Zustand · TanStack Query/Table · Vercel

### Completed (~1 day spent, AI-assisted)

| Phase | Description | Time Spent | Status |
|-------|-------------|------------|--------|
| 0 | Scaffold — Next.js 16 + React 19 + TypeScript + Tailwind CSS v4, basic layout.tsx + page.tsx | ~0.5 hr | ✅ Done |
| 1 | Foundation — deps, lib/api.ts (axios+JWT+auto-refresh), query-client, auth.store (Zustand+persist), ui.store, hooks (usePermission, useInstitute), UI primitives (Button, Input, Badge, Card, Spinner), proxy.ts route guard | ~1.5 hr | ✅ Done |
| 2 | Auth Pages — Login (email+password, show/hide, error, redirect-after-login), Register (org type picker, 5 fields), 4 API route handlers (login/refresh/logout/register) with httpOnly cookie refresh token | ~1 hr | ✅ Done |
| 3 | App Shell — Sidebar (permission-gated nav, collapse toggle, Madrasa conditional, user menu+logout), Topbar (dynamic title, notification bell, avatar), PageHeader, dashboard layout, placeholder pages for all 9 modules | ~1 hr | ✅ Done |
| 4 | Dashboard — 4 stats cards + skeleton loaders, attendance line chart, fee bar chart, recent admissions + payments tables — all via TanStack Query | ~1 hr | ✅ Done |

### Remaining (~36 days standard / ~15–18 days AI-assisted)

| Phase | Description | Est. Time | Priority |
|-------|-------------|-----------|----------|
| 5 | Students Module — list (search/filter/pagination, TanStack Table), multi-step admission form (5 steps + Zod), student profile with 6 tabs | 5 days | 🔴 High |
| 6 | Attendance Module — mark attendance UI (class→section→date, bulk mark), monthly grid with color coding, absentees list, Excel export | 3 days | 🔴 High |
| 7 | Fees Module — fee collection form with receipt PDF preview, fee dashboard (defaulters aging, chart), fee structure management | 3 days | 🔴 High |
| 8 | Examinations Module — exam list (active/completed/draft tabs), create form, marks entry grid, results/ranking, PDF export | 4 days | 🟡 Medium |
| 9 | Settings Module — general settings, academic structure CRUD (years/classes/sections/batches/subjects/courses), RBAC permission matrix, student custom fields, email/SMS config | 5 days | 🟡 Medium |
| 10 | Madrasa Module — Hifz tracker (surah progress + timeline), sponsorships (coverage widget), donation ledger (type filter + summary) | 3 days | 🟡 Medium |
| 11 | Reports & Export — reports hub, 5 report views with charts, Excel/CSV export buttons, bulk PDF export | 4 days | 🟡 Medium |
| 12 | Accounts Module — chart of accounts tree, day book table, ledger view, cash-in-hand widget, voucher entry form, trial balance | 3 days | 🟡 Medium |
| 13 | Realtime Features — Socket.io client, live attendance updates, in-app notification bell, fee payment toast | 2 days | 🟢 Low |
| 14 | Polish & UX — dark mode, empty states, error boundaries, optimistic UI, mobile responsive sidebar, print stylesheets | 3 days | 🟢 Low |
| 15 | Deployment (Vercel) — push to GitHub, connect Vercel, set env vars, verify production | 1 day | 🔴 High |

**Frontend: ~1 day spent · ~36 days remaining (standard) · ~15–18 days remaining (AI-assisted)**

---

## Combined Timeline (Parallel Development)

Frontend Phases 1–4 are **done**. Backend and frontend now run in parallel from here.

```
            BACKEND                          FRONTEND
─────────────────────────────────────────────────────────────────
Now         Phase 5 (Seed/Migrate, 0.5d)    Phase 5 (Students, 5d)
Week 1–2    Phase 6 (Accounts, 3d)          Phase 6 (Attendance, 3d)
            Phase 7 (Reports/Export, 4d)    Phase 7 (Fees, 3d)

Week 3–4    Phase 8 (BullMQ, 3d)            Phase 8 (Exams, 4d)
            Phase 9 (WebSocket, 2d)         Phase 9 (Settings, 5d)

Week 5–6    Phase 10 (R2 Upload, 1.5d)      Phase 10 (Madrasa, 3d)
            Phase 11 (Guardians, 1d)        Phase 11 (Reports UI, 4d)
            Phase 12 (Tasks, 1d)            Phase 12 (Accounts UI, 3d)

Week 7–8    Phase 13 (Multi-Institute, 1d)  Phase 13 (Realtime, 2d)
            Phase 14 (Security, 2d)         Phase 14 (Polish, 3d)
            Phase 15 (Testing, 3d)
            Phase 16 (Deploy, 1d)           Phase 15 (Deploy, 1d)

Week 9      Integration testing + end-to-end QA
Week 10     Buffer — stakeholder demo, soft launch
```

| Metric | Value |
|--------|-------|
| Total dev-days spent | ~9 days |
| Backend remaining | ~23 days |
| Frontend remaining (standard) | ~36 days |
| Frontend remaining (AI-assisted) | ~15–18 days |
| **Calendar time to launch (parallel + AI)** | **~8–9 weeks** |
| **Calendar time to launch (standard)** | **~10 weeks** |

---

## Module Dependency Map

```
Backend Auth (✅ Done)
    └── Frontend Auth Pages  →  App Shell  →  All feature modules

Backend Core ERP (✅ Done)
    └── Frontend: Dashboard, Students, Attendance, Fees, Exams can begin immediately

Backend Accounts (Phase 6, ~3 days)
    └── Frontend Accounts Module (Phase 12)

Backend Reports/Export (Phase 7, ~4 days)
    └── Frontend Reports & Export (Phase 11)

Backend BullMQ + WebSocket (Phase 8–9)
    └── Frontend Realtime Features (Phase 13)

Backend File Upload R2 (Phase 10)
    └── Frontend photo/document upload in Student Profile
```

---

## Risk Items

| Risk | Impact | Status |
|------|--------|--------|
| Neon DB not migrated yet — backend Phase 5 blocked | Blocks all production testing | 🔴 Open — run `prisma migrate dev` immediately |
| Accounts module (double-entry bookkeeping) is complex | Could slip 1–2 days | 🟡 Scope MVP to receipts + ledger first |
| PDF generation (report cards, ID cards) is heavy | BullMQ worker required | 🟡 Use async export + email link pattern |
| Multi-tenant data isolation under load | Security risk | 🟡 Covered in Backend Phase 14 hardening |
| ~~Frontend zero deps~~ | ~~Nothing buildable~~ | ✅ Resolved — all deps installed, Phases 1–4 done |

---

## Next Actions

### Backend (Do Now)
1. `prisma migrate dev` against Neon — unblocks end-to-end testing
2. `prisma db seed` — demo org + admin user
3. Verify Swagger at `localhost:4000/api/docs`
4. Start Phase 6: Accounts Module

### Frontend (Do Now)
1. Start Phase 5: Students Module (list + admission form + profile tabs)
2. Wire students list to `GET /students` — backend already live
3. Build multi-step admission form with Zod validation
