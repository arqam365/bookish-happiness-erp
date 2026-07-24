# CogniviaERP — Project Summary
### For: Mama (Paternal Uncle)
### Prepared by: Arqam
### Date: 30 April 2026

---

## What Are We Building?

A **school management software** (ERP) that runs on the internet.

Any school, college, or madrasa can sign up and use it to manage:

- Students (admissions, profiles, documents)
- Attendance (daily marking, reports)
- Fees (collection, receipts, pending dues)
- Exams (marks entry, results, report cards)
- Accounts (day book, receipts, vouchers)
- Teachers & Staff (roles, permissions)
- Madrasa extras (Hifz tracking, sponsorships, donations)

Multiple schools can use the same software — each school's data is completely separate and private.

---

## Current Status

> **Last updated: 2026-05-26**

The project is roughly **80% complete.**

| What | Status |
|------|--------|
| Database design (all tables) | ✅ Done |
| Backend server (the engine) | ✅ ~75% done |
| Login & registration system | ✅ Done |
| Students module | ✅ Done (list, admission, profile) |
| Attendance module | ✅ Done (mark, reports, monthly grid) |
| Fees module | ✅ Done (collect, receipt, defaulters) |
| Exams module | ✅ Done (create, marks, results, ranking) |
| Accounts module | ✅ Done (chart of accounts, day book, ledger, vouchers) |
| Madrasa module | ✅ Done (Hifz, sponsorships, donations) |
| Reports module | ✅ Done (5 report types, Excel export) |
| Settings module | ✅ ~80% done (general, academic, roles, fees) |
| Dashboard | ✅ Done (stats, charts, activity feed) |
| Live updates (WebSocket) | ✅ Done (attendance + notifications) |
| Cmd+K search palette | ✅ Done |
| Website (all above pages) | ✅ ~85% done |
| Employees/Faculty module | ❌ Not started |
| Guardians standalone module | ❌ Not started |
| Export module (dedicated page) | ❌ Not started |
| File uploads (photos, documents) | ❌ Not started |
| Email/SMS notifications | ❌ Not started |
| PDF generation | ❌ Not started |
| Background jobs (auto alerts) | ❌ Not started |
| Security hardening | ❌ Partially done |
| Testing (unit + E2E) | ❌ Not started |
| Go live on hosting | ❌ Not started |

---

## What Is Left?

### Backend (Server Side)
- Employees/Faculty module (new)
- File uploads via Cloudflare R2
- Email via Resend + SMS via Twilio
- Background jobs (BullMQ — attendance alerts, fee reminders)
- PDF generation for report cards + ID cards
- Refresh token rotation + CORS lockdown
- Production deployment on Railway

### Frontend (Website)
- Employees/Faculty module page
- Guardians standalone module page
- Export module (/export)
- Delete Data module (/delete-data)
- Accounts: trial balance, cash in hand, receipts list, vendors
- Settings: courses, batches, student fields, email/SMS config
- Go live on Vercel

---

## How Long Will It Take?

If I work on it **full time** (alone):

| Phase | Time |
|-------|------|
| Finish backend | ~3–4 weeks |
| Finish frontend (website) | ~4–5 weeks |
| Testing + going live | ~2 weeks |
| **Total** | **~2.5 to 3 months** |

If I can also get **1 more developer** to help (one does backend, one does frontend at the same time):

| **Total time with 2 people** | **~6–7 weeks** |
|------------------------------|----------------|

---

## What Will It Cost?

### Monthly Hosting & Services (Once Live)

These are the online services the software needs to run every month:

| Service | What It Does | Monthly Cost |
|---------|-------------|-------------|
| Neon (Database) | Stores all school data | ₹1,600 |
| Railway (Server) | Runs the backend | ₹1,000 |
| Vercel (Website hosting) | Hosts the website | ₹1,680 |
| Redis (Speed cache) | Makes app faster | ₹670 |
| Cloudflare R2 (File storage) | Stores photos, PDFs | ₹420 |
| Resend (Email service) | Sends emails to parents etc. | ₹1,680 |
| Twilio (SMS service) | Sends SMS alerts | ₹1,260 |
| GitHub (Code storage) | Keeps the code safe | ₹336 |
| **Total per month** | | **~₹8,650** |
| **Total per year** | | **~₹1,04,000** |

---

### Development Cost (My Time)

Since I am handling this myself, there is **no developer salary cost.**

However, for reference — if someone else were hired to build this:

| Who | Cost |
|-----|------|
| 1 freelance senior developer | ₹18–22 lakh total |
| Small agency (2–3 people) | ₹7–10 lakh total |
| 1 hired employee for 3 months | ₹5–7 lakh total |

Since I am doing it myself — **the only real cost is the monthly hosting (₹8,650/month).**

---

## When Can Schools Start Using It?

If I start consistently now:

| Target | Date |
|--------|------|
| Backend fully working | Late May / Early June 2026 |
| Website fully working | Mid June 2026 |
| Ready for first school to use | **July 2026** |

---

## How Schools Will Pay (Once Live)

| Plan | Monthly Fee per School | What They Get |
|------|----------------------|---------------|
| Basic | ₹2,000 | Students, Attendance, Fees |
| Standard | ₹5,000 | Everything above + Exams, Reports |
| Full | ₹10,000 | Everything + Madrasa module, Accounts |

**To cover the monthly server cost of ₹8,650 — we only need 2 schools on Standard plan.**

---

## In Short

| | |
|-|-|
| **What it is** | School/Madrasa management software (SaaS) |
| **Who builds it** | Arqam (me), alone |
| **Time to finish** | ~2.5–3 months solo · ~6–7 weeks with help |
| **Monthly server cost** | ~₹8,650 |
| **My development cost** | ₹0 (I am doing it myself) |
| **Target launch** | July 2026 |
| **Revenue needed to break even** | 2 schools paying ₹5,000/month |

---

*Any questions, just ask Arqam directly.*
