# Statement of Work (SOW)
## CogniviaERP — Multi-Tenant Education ERP Platform

---

**Document Type:** Statement of Work & Cost Estimate
**Prepared For:** Revzion / Internal
**Prepared By:** Development Team
**Date:** 30 April 2026
**Currency:** Indian Rupee (INR) — USD conversion at ₹84/USD
**Version:** 1.1

---

## 1. Project Overview

CogniviaERP is a multi-tenant SaaS Education Resource Planning platform designed to serve Schools, Colleges, Madrasas, and Hybrid institutions under a single unified system. Each institution operates independently within its organization, with strict data isolation, configurable academic structures, and role-based access.

**Product Name:** Revzion EduCore
**Tagline:** Unified ERP for Schools, Colleges & Madrasas

### 1.1 Key Capabilities

- Multi-tenant architecture (Organization → Institute → Users)
- Full RBAC with custom role builder
- Student lifecycle management (admission → graduation)
- Attendance, Examinations, Fees & Finance
- Madrasa-specific module (Hifz, Sponsorships, Donations)
- Real-time dashboards and analytics
- Reports + PDF/Excel export engine
- Notification engine (Email, SMS)
- WebSocket-based live updates
- SaaS subscription plan enforcement

---

## 2. Scope of Work

### 2.1 Backend — `cognivia-erp-engine`

**Stack:** NestJS 11 + Fastify · Prisma 6 · PostgreSQL (Neon) · Redis (Upstash) · BullMQ · Cloudflare R2 · Resend · Twilio · Socket.io · Railway

| # | Module | Description |
|---|--------|-------------|
| 1 | Scaffold & DevOps | NestJS bootstrap, Docker Compose, Railway config, CI setup |
| 2 | Database Schema | Full multi-tenant schema — 30+ tables with org/institute isolation |
| 3 | Core Infrastructure | Tenancy middleware, JWT guards, RBAC guards, exception filters, audit log |
| 4 | Auth Module | Register, login, refresh, logout, JWT Passport, permission payload |
| 5 | Students Module | CRUD, enrollment, soft delete, attendance summary |
| 6 | Attendance Module | Bulk mark, section report, monthly analytics, absentees list |
| 7 | Fees & Finance | Payment collection, receipt generation, defaulters, dashboard stats |
| 8 | Examinations | Create exam, marks entry, result publish, rank calculation |
| 9 | Settings | Org profile, institutes, academic years, roles, classes, sections, subjects, student fields |
| 10 | Madrasa Plugin | Hifz progress, sponsorships, donation ledger |
| 11 | Dashboard | Aggregated stats, activity feed, chart data endpoints |
| 12 | Notifications | Templates, send, bulk send, history |
| 13 | Accounts Module | Chart of accounts, receipts, vouchers, ledger, day book, trial balance |
| 14 | Reports & Export | 7 report types, Excel/CSV via exceljs, PDF via pdfkit |
| 15 | BullMQ Jobs | Notification worker, export worker, attendance alert, fee reminder cron |
| 16 | WebSocket Gateway | Live attendance + notifications, per-institute rooms, JWT auth |
| 17 | File Upload (R2) | Avatar, student photo, documents, org logo, signed URLs |
| 18 | Guardians & Tasks | Guardian CRUD, task management, role-based visibility |
| 19 | Multi-Institute | Institute switcher, scoped tokens |
| 20 | Security Hardening | Rate limiting, Helmet, input sanitization, soft-delete, audit retention |
| 21 | Testing | Unit + integration tests, Prisma test client, GitHub Actions CI |
| 22 | Production Deploy | Railway setup, env vars, health check, Swagger verification |

### 2.2 Frontend — `cognivia-erp`

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Zustand · TanStack Query/Table · Recharts · Radix UI · Vercel

| # | Module | Description |
|---|--------|-------------|
| 1 | Foundation | Deps, API client (axios+JWT), auth store (Zustand), query client, UI primitives |
| 2 | Route Guard | proxy.ts — unauthenticated redirect, session-based protection |
| 3 | Auth Pages | Login (show/hide, error, redirect), Register (org type picker), httpOnly cookie auth |
| 4 | App Shell | Sidebar (collapsible, permission-gated, Madrasa conditional), Topbar, PageHeader |
| 5 | Dashboard | Stats cards, attendance chart, fee chart, recent activity, skeleton loaders |
| 6 | Students Module | List (search/filter/pagination), multi-step admission form (5 steps), profile with 6 tabs |
| 7 | Attendance Module | Mark attendance UI, monthly grid (color-coded), absentees, Excel export |
| 8 | Fees Module | Collection form, receipt PDF preview, defaulters aging table, fee structure management |
| 9 | Examinations | Exam list (tabs), create form, marks entry grid, ranking table, PDF export |
| 10 | Settings Module | General, academic structure CRUD, RBAC permission matrix, custom fields, email/SMS |
| 11 | Madrasa Module | Hifz tracker, sponsorships + coverage widget, donation ledger |
| 12 | Reports & Export | Reports hub, 5 report views with charts, Excel/CSV/PDF export |
| 13 | Accounts Module | Chart of accounts tree, day book, ledger view, voucher form, trial balance |
| 14 | Realtime Features | Socket.io client, live attendance updates, notification bell, fee payment toast |
| 15 | Polish & UX | Dark mode, empty states, error boundaries, mobile responsive, print stylesheets |
| 16 | Deployment | Vercel setup, env vars, production verification |

### 2.3 Out of Scope (Future Phases)

The following are documented as future modules and are **not** included in this SOW:

- Mobile Apps (Parent App, Teacher App, Admin App)
- Biometric / RFID integration
- WhatsApp API integration
- LMS / Online Classes integration
- Analytics engine (dropout risk, fee default prediction, performance scoring)
- Payment gateway integration (Razorpay / Stripe)
- Parent Portal & Teacher Portal (separate web apps)

---

## 3. Current Progress

> **Last updated: 2026-05-26**

| Layer | Total Phases | Done | In Progress | Progress | Days Spent |
|-------|-------------|------|------------|----------|------------|
| Backend | 16 | 12 | 2 | ~75% | ~30 days |
| Frontend | 15 | 13 | 2 | ~85% | ~35 days |
| **Total** | **31** | **25** | **4** | **~80%** | **~65 days** |

**Backend — Completed modules:**
- Full PostgreSQL schema (30+ tables, multi-tenant)
- NestJS infrastructure (guards, middleware, interceptors, audit log)
- Auth module (JWT, RBAC guards, multi-institute switcher)
- Students module (CRUD, enrollment, soft delete, attendance summary)
- Attendance module (bulk mark, section report, monthly analytics, absentees)
- Fees & Finance (payment collection, receipt generation, defaulters, dashboard stats)
- Examinations (create exam, marks entry, result publish, rank calculation)
- Settings (academic years, classes, sections, subjects, fee structures, roles, permissions)
- Madrasa module (Hifz progress, sponsorships, donation ledger)
- Dashboard (aggregated stats, activity feed, chart data)
- Accounts module (chart of accounts, day book, ledger, vouchers)
- WebSocket gateways (attendance + notifications, per-institute rooms, JWT auth)

**Backend — Remaining:**
- Reports & PDF/Export engine (partially done via exceljs; PDF not started)
- BullMQ workers (NotificationWorker, ExportWorker, AttendanceAlertWorker, FeeReminderWorker)
- File uploads (Cloudflare R2 — avatar, student photo, org logo, signed URLs)
- Remaining accounts endpoints (cash-in-hand COG2-10, trial-balance COG2-11)
- Employees/Faculty module (not yet started)
- Guardians standalone module (not yet started)
- Security hardening (refresh token rotation COG2-70, CORS lockdown COG2-71, WS rate limiting COG2-68)
- Email/SMS integration (Resend + Twilio — new issues COG2-63–67)
- Production deployment (COG2-73–75)

**Frontend — Completed pages/modules:**
- Foundation (Zustand auth store, axios+JWT client, route guard, UI primitive library)
- Auth pages (Login with Suspense, Register with org type picker)
- App shell (collapsible sidebar, topbar with notification bell, Cmd+K palette, PageHeader)
- Dashboard (stats cards, attendance chart, fee chart, recent activity, skeletons)
- Students module (list with search/filter/pagination, 5-step admission form, profile with 6 tabs)
- Attendance module (bulk mark UI, monthly grid, absentees list, Excel export)
- Fees module (collect payment modal, receipt print, defaulters table, stat cards)
- Examinations module (list, create form, marks entry grid, results + ranking, publish)
- Settings module (general, academic years, classes, sections, fee structures, roles)
- Madrasa module (Hifz tracker, sponsorships, donation ledger)
- Reports module (hub, 5 report types with charts, Excel export)
- Accounts module (chart of accounts, day book, ledger, voucher form)
- Realtime (Socket.io client, live attendance updates, notification bell, toast)
- Polish (dark mode, print styles, empty states, Cmd+K, receipt modal)

**Frontend — Remaining:**
- Employees/Faculty module (new — not in original plan)
- Guardians standalone module (new — not in original plan)
- Export module dedicated page (/export)
- Delete Data module (/delete-data)
- Accounts: trial balance, cash in hand, receipts list, vendors
- Settings: courses, batches, student fields drag-and-drop, email/SMS config
- Production deployment (Vercel)

**Gap items identified from competitive analysis (EdSof comparison):**
Features in comparable systems not yet in scope — added as new Linear issues:
- Employees/Faculty CRUD with role assignment and attendance
- Guardians as a standalone queryable module
- Dedicated Export page (bulk dataset downloads)
- Delete Data module (controlled admin-level deletion)
- Accounts: Vendors, Receipts list view, Contra entries
- Enrollments standalone view (separate from admission flow)

---

## 4. Team & Resource Requirements

### 4.1 Recommended Team Composition

| Role | Responsibility | Required Level |
|------|---------------|----------------|
| Senior Full-Stack Developer | Backend (NestJS) + Frontend (Next.js) | 4+ years, NestJS + React |
| OR: Senior Backend Developer | NestJS, Prisma, PostgreSQL, BullMQ, WebSocket | 4+ years |
| + Mid Frontend Developer | Next.js 16, TanStack, Zustand, Recharts | 2+ years |
| QA Engineer (part-time) | Test planning, manual QA, integration testing | 2+ years |
| DevOps / Infra (part-time) | Railway, Vercel, Neon, R2, Upstash setup | 1+ years |

### 4.2 Engagement Options

| Option | Description | Best For |
|--------|-------------|----------|
| A — Freelance Senior Dev | 1 senior full-stack developer, remote | Lean budget, direct communication |
| B — Small Agency | Team of 2–3, managed delivery | Structured delivery, some overhead |
| C — In-House Team | Hire 1–2 permanent employees | Long-term product ownership |

---

## 5. Development Cost Estimate

### 5.1 Market Rate Reference (India, 2026)

| Level | In-House Monthly CTC | Freelance Hourly |
|-------|---------------------|-----------------|
| Junior (0–2 yrs) | ₹20,000 – ₹35,000 | ₹500 – ₹900 |
| Mid-Level (2–4 yrs) | ₹45,000 – ₹75,000 | ₹1,200 – ₹2,000 |
| Senior (4–7 yrs) | ₹80,000 – ₹1,50,000 | ₹2,500 – ₹4,500 |
| Expert / Architect (7+ yrs) | ₹1,50,000 – ₹2,50,000 | ₹5,000 – ₹9,000 |

> This project requires **minimum Mid–Senior level** due to NestJS multi-tenancy, Next.js 16 App Router, Prisma schema complexity, and multi-tenant RBAC domain logic.

---

### 5.2 Total Development Hours Breakdown

**Full project effort: ~760 developer-hours (95 working days)**

| Area | Days | Hours | Notes |
|------|------|-------|-------|
| Backend — completed (Phases 0–4) | 8 | 64 | Schema, infra, auth, core APIs |
| Backend — remaining (Phases 5–16) | 23 | 184 | Accounts, reports, jobs, WebSocket, deploy |
| Frontend — completed (Phases 0–4) | 10 | 80 | Foundation, auth, shell, dashboard |
| Frontend — remaining (Phases 5–15) | 36 | 288 | All feature modules |
| QA & Testing | 5 | 40 | Manual + integration test runs |
| Project Management | 4 | 32 | Sprint planning, client reviews, handover docs |
| DevOps / Infra Setup | 3 | 24 | Cloud accounts, CI/CD, env config |
| Buffer (10%) | 6 | 48 | Revisions, unexpected scope, bug fixes |
| **Total** | **~95** | **~760** | |

**Remaining work from today: ~59 days / ~472 hours**

---

### 5.3 Scenario A — Freelance Senior Full-Stack Developer

One senior developer handling both backend and frontend sequentially or in parallel.

**Rate used: ₹3,000/hour** (mid-point of senior freelance range)

#### Remaining Work

| Item | Hours | Rate | Cost |
|------|-------|------|------|
| Backend — remaining (Phases 5–16) | 184 hrs | ₹3,000/hr | ₹5,52,000 |
| Frontend — remaining (Phases 5–15) | 288 hrs | ₹3,000/hr | ₹8,64,000 |
| QA & Testing | 40 hrs | ₹2,000/hr | ₹80,000 |
| DevOps / Infra setup | 24 hrs | ₹2,500/hr | ₹60,000 |
| Project management | 32 hrs | ₹1,500/hr | ₹48,000 |
| Buffer (10%) | 63 hrs | ₹3,000/hr | ₹1,89,000 |
| **Subtotal — Remaining** | | | **₹17,93,000** |

#### Full Project (Including Completed Work)

| Item | Hours | Rate | Cost |
|------|-------|------|------|
| Work already done (18 days) | 144 hrs | ₹3,000/hr | ₹4,32,000 |
| Remaining work (above) | — | — | ₹17,93,000 |
| **Total Development Cost** | **760 hrs** | | **₹22,25,000** |

**Freelance Senior Dev Range: ₹18,00,000 – ₹28,00,000**
*(lower end at ₹2,500/hr · upper end at ₹4,000/hr)*

---

### 5.4 Scenario B — Agency (Team of 2–3 Developers)

Dedicated backend developer + frontend developer, managed by agency project lead.

#### Remaining Work Cost

| Role | Days | Daily Rate | Cost |
|------|------|-----------|------|
| Senior Backend Developer | 23 days | ₹6,000/day | ₹1,38,000 |
| Mid Frontend Developer | 36 days | ₹4,500/day | ₹1,62,000 |
| QA Engineer (part-time) | 10 days | ₹3,500/day | ₹35,000 |
| DevOps (part-time) | 5 days | ₹4,500/day | ₹22,500 |
| **Raw Team Cost** | | | **₹3,57,500** |
| Agency overhead + PM (25%) | | | ₹89,375 |
| Agency margin (30%) | | | ₹1,34,063 |
| **Subtotal — Remaining** | | | **₹5,80,938** |

#### Full Project

| Item | Cost |
|------|------|
| Work already completed (valued at agency rate) | ₹1,44,000 |
| Remaining work | ₹5,80,938 |
| **Total Development Cost** | **₹7,24,938** |

**Agency Range: ₹6,50,000 – ₹12,00,000**
*(variance by agency tier, city, and team experience)*

---

### 5.5 Scenario C — In-House Permanent Team

Hiring developers directly as full-time employees.

#### Remaining Project Duration: ~2.5 months (parallel backend + frontend)

| Role | Monthly CTC | Duration | Total |
|------|------------|----------|-------|
| Senior Full-Stack Developer | ₹1,20,000 | 3 months | ₹3,60,000 |
| Junior QA Engineer | ₹35,000 | 2 months | ₹70,000 |
| Employer PF + ESI + Gratuity overhead (15%) | — | — | ₹64,500 |
| One-time recruitment cost | — | — | ₹50,000 |
| Laptop + equipment | — | — | ₹80,000 |
| **Total — Remaining** | | | **₹6,24,500** |

#### Full Project (Including Past Salary)

| Item | Cost |
|------|------|
| Work already done (valued at in-house rate, 18 days) | ₹1,08,000 |
| Remaining work | ₹6,24,500 |
| **Total Development Cost** | **₹7,32,500** |

**In-House Range: ₹6,00,000 – ₹10,00,000**
*(lower if team is retained beyond launch for v2 features, reducing per-project amortization)*

---

## 6. Infrastructure Cost Estimate

Cloud-based, pay-as-you-go. Estimates for production serving 1–5 organizations (~10–50 institutes).

### 6.1 Monthly Infrastructure (Production)

| Service | Purpose | Plan | USD/month | INR/month |
|---------|---------|------|-----------|-----------|
| Neon PostgreSQL | Primary database | Launch | $19 | ₹1,596 |
| Railway | NestJS backend hosting | Hobby/Pro | $12 | ₹1,008 |
| Vercel | Next.js frontend hosting | Pro | $20 | ₹1,680 |
| Upstash Redis | Cache + BullMQ queue | Pay-per-use | $8 | ₹672 |
| Cloudflare R2 | File storage (photos, docs) | Pay-per-use | $5 | ₹420 |
| Resend | Transactional email | Pro | $20 | ₹1,680 |
| Twilio | SMS notifications | Pay-per-use | $15 | ₹1,260 |
| GitHub | Code + Actions CI | Team | $4 | ₹336 |
| **Total Monthly** | | | **$103** | **₹8,652** |

### 6.2 One-Time Setup Costs

| Item | Cost |
|------|------|
| Domain name (1 year) | ₹1,200 |
| SSL Certificate (Cloudflare — free) | ₹0 |
| Cloud account creation (Neon, Upstash, R2) | ₹0 |
| **Total One-Time** | **₹1,200** |

### 6.3 Annual Infrastructure Cost

| Period | Monthly | Annual |
|--------|---------|--------|
| Development phase (reduced usage, 3 months) | ~₹3,000 | ₹9,000 |
| Production — Year 1 | ₹8,652 | ₹1,03,824 |
| **Year 1 Total (infra)** | | **₹1,12,824** |
| **Year 2+ ongoing** | ₹8,652 | **₹1,03,824/year** |

> **Scale-up note:** At 20+ organizations (200+ institutes), infrastructure grows to ~$300–500/month (₹25,200–42,000/month). Neon, Railway, and Upstash all auto-scale horizontally.

---

## 7. Total Project Cost Summary

### 7.1 Full Project Cost (End-to-End, Including Completed Work)

| Component | Scenario A — Freelance | Scenario B — Agency | Scenario C — In-House |
|-----------|----------------------|--------------------|-----------------------|
| Total Development | ₹22,25,000 | ₹7,24,938 | ₹7,32,500 |
| Infrastructure — Year 1 | ₹1,12,824 | ₹1,12,824 | ₹1,12,824 |
| One-time setup | ₹1,200 | ₹1,200 | ₹1,200 |
| **Total — Year 1** | **₹23,38,024** | **₹8,38,962** | **₹8,46,524** |
| **Ongoing — Year 2+** | ₹1,03,824/yr | ₹1,03,824/yr | ₹5,50,000+/yr |

### 7.2 Remaining Work Only (Project is 26% complete)

| Scenario | Development | Infrastructure | Total |
|----------|------------|----------------|-------|
| Freelance Senior Dev | ₹17,93,000 | ₹1,12,824 | **₹19,05,824** |
| Agency | ₹5,80,938 | ₹1,12,824 | **₹6,93,762** |
| In-House Team | ₹6,24,500 | ₹1,12,824 | **₹7,37,324** |

---

## 8. Payment Milestones (Freelance / Agency)

Recommended milestone-based payment structure tied to working deliverables:

| Milestone | Deliverable | % | Amount (Scenario A — Remaining) |
|-----------|------------|---|----------------------------------|
| M1 — Kickoff | Signed SOW, access granted, dev environment live | 10% | ₹1,79,300 |
| M2 — Backend Complete | All API endpoints live, Swagger docs verified, seed data working | 25% | ₹4,48,250 |
| M3 — Core Frontend | Auth, Dashboard, Students, Attendance, Fees working end-to-end | 25% | ₹4,48,250 |
| M4 — Full Feature Set | Exams, Settings, Madrasa, Reports, Accounts, Realtime complete | 25% | ₹4,48,250 |
| M5 — Launch Ready | QA passed, production deployed, handover docs delivered | 15% | ₹2,68,950 |
| **Total** | | **100%** | **₹17,93,000** |

---

## 9. Delivery Timeline

**Parallel development (1 backend + 1 frontend developer):**

```
Week 1–2    Backend: Seed/Migrate, Accounts, Reports/Export
            Frontend: Students Module, Attendance Module

Week 3–4    Backend: BullMQ Jobs, WebSocket, File Upload
            Frontend: Fees Module, Examinations Module

Week 5–6    Backend: Guardians, Tasks, Multi-Institute, Security
            Frontend: Settings, Madrasa Module, Reports UI

Week 7–8    Backend: Testing, Production Deployment
            Frontend: Accounts UI, Realtime, Polish & UX

Week 9      Integration testing + end-to-end QA

Week 10     Buffer — final fixes, stakeholder demo, soft launch
```

**Estimated calendar time: 10 weeks (2.5 months) with 2 parallel developers**
**Sequential (1 developer): 15–17 weeks**

---

## 10. SaaS Revenue Potential

To contextualize the investment:

| Plan | Price/Institute/Month | Institutes to Break Even (Year 1 dev + infra) |
|------|----------------------|-----------------------------------------------|
| Starter — ₹2,000/mo | ₹2,000 | ~35 institutes (Freelance) · ~12 institutes (Agency) |
| Standard — ₹5,000/mo | ₹5,000 | ~14 institutes · ~5 institutes |
| Professional — ₹10,000/mo | ₹10,000 | ~7 institutes · ~3 institutes |

> At **20 institutes on Standard plan:** ₹1,00,000 MRR · ₹12,00,000 ARR — recovers agency/in-house investment within 7–8 months of launch.

---

## 11. Assumptions & Terms

1. **Currency:** INR amounts based on USD/INR rate of ₹84. Infrastructure costs in INR will vary with exchange rate.
2. **Scope freeze:** Any features added beyond this SOW require a written change order and revised cost estimate.
3. **Rate basis:** Freelance rates are per-hour billed against agreed milestones, not monthly retainer.
4. **Infrastructure billing:** All cloud service costs (Neon, Railway, Vercel, Cloudflare, Resend, Twilio) are billed directly to the client's accounts. They are separate from development fees.
5. **Code ownership:** All source code, database schemas, and configuration files are owned by Revzion upon final payment.
6. **Warranty:** Post-launch bug fixes covered for 30 days at no extra charge. Feature enhancements require a separate agreement.
7. **Team assumptions:** Scenario A assumes 1 senior developer working 6–8 hours/day. Scenario B assumes 2 developers working in parallel. Scenario C assumes direct employment.
8. **Tax:** All amounts are exclusive of GST. 18% GST applicable on development services for Indian entities.

---

## 12. GST-Inclusive Totals

| Scenario | Development (excl. GST) | GST 18% | Total (incl. GST) | + Infra Year 1 | **Grand Total** |
|----------|------------------------|---------|-------------------|----------------|-----------------|
| A — Freelance (remaining) | ₹17,93,000 | ₹3,22,740 | ₹21,15,740 | ₹1,12,824 | **₹22,28,564** |
| B — Agency (remaining) | ₹5,80,938 | ₹1,04,569 | ₹6,85,507 | ₹1,12,824 | **₹7,98,331** |
| C — In-House (remaining) | ₹6,24,500 | N/A (salary) | ₹6,24,500 | ₹1,12,824 | **₹7,37,324** |

---

## 13. Next Actions

### Backend
1. Run `prisma migrate dev` against Neon — unblocks all end-to-end testing
2. Run `prisma db seed` — demo org, institutes, roles, admin user
3. Verify Swagger at `localhost:4000/api/docs`
4. Start Phase 6: Accounts Module

### Frontend
1. Start Phase 5: Students Module (list + admission form + profile tabs)
2. Wire to live backend `GET /students` endpoint
3. Build multi-step admission form with Zod validation

---

*Document prepared: 30 April 2026 · Revzion Internal · Subject to revision on scope changes or team decisions.*
