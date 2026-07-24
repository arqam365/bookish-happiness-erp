# Cognivia ERP — Pre-Production Checklist

> Last updated: 2026-05-26
> Status: Local dev complete. This doc tracks what's needed before real production launch.

---

## Linear Hygiene (Already Done — needs marking)

Many COG-1 through COG-52 issues are complete but still show "Todo" in Linear.
Mark all of these Done: COG-1–24, COG-25–52, COG-69.

---

## 1. PDF Generation  🔴 Blocking

| # | What | Notes |
|---|------|-------|
| COG2-18 | Report card PDF per student per exam | Puppeteer or `@react-pdf/renderer` |
| COG2-19 | Student ID card PDF | Same stack |
| COG-45  | Bulk report card export (all students, one exam) | Zip of individual PDFs |

**Decision needed:** Puppeteer (heavyweight, accurate CSS) vs. `@react-pdf/renderer` (pure Node, no Chromium).
Recommended: `@react-pdf/renderer` for serverless/Railway compatibility.

---

## 2. File Uploads  🔴 Blocking

| # | What | Service |
|---|------|---------|
| COG2-29 | Student photo upload | Cloudflare R2 |
| COG2-31 | Org / institute logo upload | Cloudflare R2 |
| COG2-30 | Student documents (TC, birth cert) | Cloudflare R2 |
| COG2-28 | User profile avatar | Cloudflare R2 |
| COG2-32 | Signed URL generation for private files | R2 presigned URLs |

**Needs:** R2 bucket created, `WRANGLER_API_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` in env.

---

## 3. Email & SMS  🔴 Blocking

| # | What | Service |
|---|------|---------|
| NEW | Welcome email on org registration | Resend |
| NEW | Fee payment receipt email | Resend |
| NEW | Password reset email | Resend |
| NEW | Absent SMS to guardian | Twilio |
| NEW | Fee due reminder SMS | Twilio |

**Needs:** Resend API key + verified sending domain. Twilio account SID + auth token.

---

## 4. Background Workers  🟡 High Priority

| # | What | Notes |
|---|------|-------|
| COG2-22 | AttendanceAlertWorker — SMS to guardian when student absent | Trigger after markBulk |
| COG2-23 | FeeReminderWorker — cron job, 3 days before due date | BullMQ + Redis |
| COG2-20 | NotificationWorker — async SMS/email delivery queue | BullMQ |
| COG2-21 | ExportWorker — async Excel/PDF for large datasets | BullMQ |
| COG2-24 | GET /jobs/:id/status — job polling endpoint | For async exports |

**Needs:** Redis instance (Railway Redis or Upstash). BullMQ already in deps? Check.

---

## 5. Remaining Backend Endpoints  🟡 High Priority

| # | Endpoint | Notes |
|---|----------|-------|
| COG2-10 | GET /accounts/cash-in-hand | Current cash balance |
| COG2-11 | GET /accounts/trial-balance | Debit/credit totals per account |
| COG2-6  | POST /receipts | Standalone receipt creation (not voucher) |

---

## 6. Remaining Frontend Pages / Features  🟡 High Priority

| # | What | Notes |
|---|------|-------|
| COG-14 | Academic year selector in topbar | Switch active AY context |
| COG-28 | Student photo upload UI | Drag-drop, preview, crop |
| COG-37 | Printable receipt modal (PDF preview) | Currently print-only, needs PDF download |
| COG-45 | Bulk report card PDF export | Per exam, download all |
| COG-48 | Roles & permissions matrix UI | /settings/roles visual grid |

---

## 7. Security & Compliance  🟡 High Priority

| # | What | Notes |
|---|------|-------|
| COG2-44 | Audit log retention policy | Auto-delete logs older than 90 days |
| NEW | Rate limit WS connections | Prevent socket flood per IP |
| NEW | Input validation on WS messages | Gateway DTOs / pipes |
| NEW | Refresh token rotation | Currently stateless — add token blacklist on logout |
| NEW | CORS lockdown for production | Remove wildcard, set exact domain |

---

## 8. Testing  🟡 High Priority

| # | What | Notes |
|---|------|-------|
| COG2-45 | Unit tests — AuthService | Login, register, switch-institute |
| COG2-46 | Unit tests — FeesService | collectPayment, defaulters |
| COG2-47 | Integration test — full student lifecycle | Admit → Enroll → Attendance → Fee → Exam |
| NEW | E2E — login + dashboard smoke test | Playwright |

---

## 9. CI / DevOps  🟠 Pre-Deploy

| # | What | Notes |
|---|------|-------|
| COG2-48 | GitHub Actions CI pipeline | tsc + prisma validate + tests on PR |
| COG2-49 | Push backend to GitHub | Private repo |
| COG2-50 | Railway deployment (backend) | Docker or Nixpacks |
| COG-75  | Push frontend to GitHub | Private repo |
| COG-76  | Connect Vercel to GitHub repo | Auto-deploy on push |
| COG-77  | Set env vars in Vercel | All NEXT_PUBLIC_* vars |
| COG-78  | Verify login + dashboard on production URL | Smoke test |
| NEW | Domain + SSL setup | cognivia.app or client domain |
| NEW | Production DB migration (prisma migrate deploy) | On Railway build step |
| NEW | Seed production super admin only | Not full demo data |

---

## 10. Nice-to-Have (Post-Launch)  🟢

| What | Notes |
|------|-------|
| COG-17 | Full DataTable with server-side sorting/pagination | Currently simple lists |
| WhatsApp notifications | Twilio WhatsApp or WATI API |
| Student promotion bulk action | Promote class to next grade at year end |
| Multi-language (Urdu RTL) | i18n setup |
| Mobile app (React Native) | Phase 2 |

---

## Launch Sequence

```
1. Set up R2 bucket + get credentials
2. Set up Resend + verify domain
3. Set up Twilio (or skip SMS for soft launch)
4. Add Redis (Upstash free tier) for BullMQ workers
5. Build PDF generation (react-pdf)
6. Push to GitHub (both repos)
7. Deploy backend to Railway with env vars
8. Deploy frontend to Vercel with env vars
9. Run: prisma migrate deploy + seed super admin
10. Smoke test all critical flows
11. Go live
```

---

## Estimated Effort

| Area | Estimate |
|------|----------|
| PDF generation | 2–3 days |
| File uploads (R2) | 1 day |
| Email/SMS integration | 1 day |
| Background workers | 2 days |
| Tests (critical paths) | 2 days |
| CI/CD + deployment | 1 day |
| **Total** | **~10 days** |
