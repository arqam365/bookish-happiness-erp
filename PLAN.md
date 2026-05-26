# Revzion CogniviaERP
## Multi-Tenant Education ERP Platform Architecture

---

## Build Status — Last updated 2026-05-26

| Phase | Module | Status |
|-------|--------|--------|
| BE-1 | Scaffold + DevOps | ✅ Done |
| BE-2 | Database Schema (30+ tables) | ✅ Done |
| BE-3 | Core Infrastructure (guards, middleware, audit log) | ✅ Done |
| BE-4 | Auth Module (JWT, RBAC, multi-institute) | ✅ Done |
| BE-5 | Students Module | ✅ Done |
| BE-6 | Attendance Module | ✅ Done |
| BE-7 | Fees & Finance | ✅ Done |
| BE-8 | Examinations | ✅ Done |
| BE-9 | Settings | ✅ Done |
| BE-10 | Madrasa Plugin | ✅ Done |
| BE-11 | Dashboard endpoints | ✅ Done |
| BE-12 | Accounts Module (chart of accounts, day book, ledger, vouchers) | ✅ Done |
| BE-13 | WebSocket Gateway (attendance + notifications) | ✅ Done |
| BE-14 | Employees/Faculty Module | ❌ Not started (COG2-76, COG2-79) |
| BE-15 | Guardians standalone endpoints | ❌ Not started (COG2-77) |
| BE-16 | Reports & Export Engine | 🟡 Partial (Excel done; PDF not started) |
| BE-17 | BullMQ Workers | ❌ Not started (COG2-20–23) |
| BE-18 | File Upload (Cloudflare R2) | ❌ Not started (COG2-28–32) |
| BE-19 | Email (Resend) + SMS (Twilio) | ❌ Not started (COG2-63–67) |
| BE-20 | Security Hardening | 🟡 Partial (COG2-68–71 pending) |
| BE-21 | Testing | ❌ Not started (COG2-45–47, COG2-72) |
| BE-22 | Production Deploy | ❌ Not started (COG2-73–75) |
| | | |
| FE-0 | Scaffold | ✅ Done |
| FE-1 | Foundation (API client, auth store, route guard, UI lib) | ✅ Done |
| FE-2 | Auth pages (Login, Register) | ✅ Done |
| FE-3 | App Shell (sidebar, topbar, Cmd+K, PageHeader) | ✅ Done |
| FE-4 | Dashboard | ✅ Done |
| FE-5 | Students Module | ✅ Done |
| FE-6 | Attendance Module | ✅ Done |
| FE-7 | Fees Module | ✅ Done |
| FE-8 | Examinations Module | ✅ Done |
| FE-9 | Settings Module | 🟡 Partial (courses, batches, student fields, email/SMS config missing) |
| FE-10 | Madrasa Module | ✅ Done |
| FE-11 | Reports & Export | ✅ Done |
| FE-12 | Accounts Module | 🟡 Partial (trial balance, cash in hand, receipts list, vendors missing) |
| FE-13 | Realtime Features | ✅ Done |
| FE-14 | Polish & UX | ✅ Done |
| FE-15 | Employees/Faculty Module | ❌ Not started (COG-103) |
| FE-16 | Guardians Module | ❌ Not started (COG-104) |
| FE-17 | Export Module (/export) | ❌ Not started (COG-105) |
| FE-18 | Delete Data Module | ❌ Not started (COG-106) |
| FE-19 | Production Deploy (Vercel) | ❌ Not started (COG-75–78) |

---

A scalable ERP platform supporting:
- Schools
- Colleges
- Madrasas
- Coaching Institutes
- Hybrid Religious + Modern Institutions

Designed as a configurable SaaS multi-organization system.

---

# 1. Platform Hierarchy

System structure:

Creator (Platform Owner)
└── Organizations
└── Institutes / Campuses
└── Users

Example:

Revzion
└── Al Noor Trust
├── Madrasa Campus
└── School Campus

Each institute operates independently inside one organization.

---

# 2. Role-Based Access Control (RBAC)

Default roles:

- Platform Owner
- Organization Owner
- Director
- Principal
- Vice Principal
- Teacher
- Accountant
- Parent
- Student
- Staff

Custom roles supported:

Example:
- Hostel Manager
- Exam Controller
- Hifz Supervisor
- Transport Manager

Database tables:

roles
permissions
role_permission_mapping
user_role_mapping

---

# 3. Multi-Tenant Database Design

Each table must include:

organization_id
institute_id

Example tables:

organizations
institutes
users
students
parents
teachers
attendance
fees
exams
reports
notifications
roles
permissions

Purpose:

Ensures strict data isolation across institutes.

---

# 4. Core ERP Modules (Universal)

## 4.1 Student Lifecycle Management

Features:

- Admission management
- Enrollment tracking
- Class assignment
- Section allocation
- Student promotion
- Transfer certificates
- Student history timeline

---

## 4.2 Academic Structure Engine

Configurable academic hierarchy:

Class
Section
Batch
Semester
Stream
Subject
Electives

Supports:

School structure:

Science
Commerce
Arts

Madrasa structure:

Nazra
Hifz
Alimiyat
Dars-e-Nizami

Implementation rule:

Academic programs must be configurable, never hardcoded.

---

## 4.3 Attendance Engine

Supports:

- Student attendance
- Teacher attendance
- Subject-wise attendance
- Section attendance
- Daily attendance analytics
- Monthly attendance reports

Future support:

Biometric integration
RFID integration
Mobile attendance marking

---

## 4.4 Examination Engine

Supports:

Exam Categories
Marks Schema
Grade Schema
Result Publishing
Report Card Generator
Transcript Generator
Rank Calculation

Custom exam types:

academic
oral
written
memorization

Madrasa-specific tracking:

Surah progress
Ayat memorization
Sabqi tracking
Hifz completion milestones

---

## 4.5 Fees & Finance Engine

Supports:

Admission Fees
Monthly Fees
Transport Fees
Hostel Fees
Library Fees
Exam Fees
Late Fees
Scholarships
Installments

Madrasa-specific support:

Zakat tracking
Sadaqah tracking
Sponsor mapping
Qurbani contributions
Donation ledger

---

# 5. Madrasa Module (Plugin Architecture)

Never hardcode madrasa logic into core ERP.

Structure:

modules/
school/
college/
madrasa/

Madrasa module includes:

Student sponsorship tracking
Hifz progress management
Islamic subject grading
Qurbani management
Waqf accounting
Donor reports

Activated when:

organization_type == madrasa

---

# 6. Organization Customization Engine

Each institute can configure:

Custom Subjects
Custom Fee Types
Custom Roles
Custom Exam Patterns
Custom Certificates
Custom Attendance Rules

Examples:

School:

Midterm
Final

College:

Semester 1
Semester 2

Madrasa:

Sabqi
Para Revision
Hifz Evaluation

---

# 7. Dashboard Intelligence Layer

Dashboard widgets:

Attendance Today %
Fee Collection Today
Pending Fees
Active Students
Inactive Students
Teacher Workload
Exam Performance Trends
Sponsor Coverage Ratio
Donation Summary

Dashboards configurable per role.

Example:

Principal Dashboard
Teacher Dashboard
Accountant Dashboard
Parent Dashboard

---

# 8. Reports Engine

Critical ERP selling component.

Reports supported:

Student Strength Report
Attendance Analytics
Fee Defaulters Report
Sponsor Coverage Report
Subject Performance Report
Teacher Workload Report
Donor Contribution Summary
Exam Ranking Report

Export formats:

PDF
Excel
CSV

---

# 9. Accounts Module

Includes:

Receipts
Vouchers
Contra Entries
Day Book
Ledger
Cash In Hand
Vendor Management
Gateway Status
Qurbani Gateway Status
Animal Data Tracking

Supports:

Multi-account handling
Donation accounting
Institutional finance tracking

---

# 10. Tasks & Events Module

Supports:

Employee Task Assignment
Internal Events
My Tasks
Section Attendance Tasks
Qurbani Completion Tracking
Manage Qurbani Completion

Role-based visibility.

---

# 11. Examination Module

Features:

Start Exam
Manage Exam
Manage Previous Exams
Exam Categories
Marks Entry
Result Publishing
Report Card Generation

Supports:

Custom grading systems

Example:

Percentage
GPA
Grade Bands
Memorization Level Scores

---

# 12. Reports Module

Includes:

Students Reports
Housing Reports
Enrollments Reports
Guardian/Sponsor Reports
Receipts Reports
Vouchers Reports
Vendor Reports
Employee Task Reports

---

# 13. Export Module

Exportable datasets:

Attendance Summary
Attendance Detailed
Students
Enrollments
Fees
Guardians
Receipts
Vouchers
ID Cards
Report Cards

Formats:

PDF
Excel
CSV

---

# 14. Delete Data Module

Controlled deletion access for:

Receipts
Students
Enrollments
Guardians
Vouchers
Contra Entries

Restricted to admin-level permissions.

---

# 15. Parent Portal (Future Module)

Features:

Attendance Alerts
Fee Reminders
Exam Results
Homework Updates
Announcements
Leave Requests

Improves engagement and retention.

---

# 16. Teacher Portal (Future Module)

Features:

Attendance Marking
Homework Upload
Marks Entry
Student Feedback
Class Notes
Lesson Planning

---

# 17. Notification Engine

Channels:

SMS
Email
Push Notifications
WhatsApp (future)

Triggers:

Attendance Missing
Fee Due
Exam Result Published
Announcement Posted

---

# 18. Multi-Institute Support

Example structure:

Organization
├── School Campus
├── Madrasa Campus
└── College Campus

Shared:

Users
Finance
Reports

Separated:

Students
Attendance
Exams

---

# 19. Custom Role Builder

Admin can create:

Role Name
Designation
Permission Scope

Examples:

Transport Manager
Hostel Warden
Library Admin
Hifz Supervisor

---

# 20. Product Positioning Strategy

Product Name:

Revzion EduCore

Tagline:

Unified ERP for Schools, Colleges & Madrasas

Modes:

School Mode
College Mode
Madrasa Mode
Hybrid Mode

Hybrid mode supports institutions running both religious and modern curriculum.

---

# 21. Recommended Future Additions

Mobile Apps:

Parent App
Teacher App
Admin App

Integrations:

Biometric Devices
Payment Gateways
WhatsApp API
LMS Systems
Online Classes

Analytics:

Performance prediction
Dropout risk detection
Fee default forecasting
Student engagement scoring

# 22. Settings Module (Core Configuration Layer)

Central control panel for platform-level and institute-level configuration.

Includes:

General Settings
Plan & Usage
User Role & Management
Course Structure
Class Structure
Batch Management
Section Management
Academic Year Engine
Master Data Configuration
Student Profile Master
Email & SMS Configuration

---

# 22.1 General Settings

Controls institute-level configuration.

Includes:

Institute Name
Institute Type (School / College / Madrasa / Hybrid)
Timezone
Language
Currency
Logo Upload
Address Details
Contact Information

Optional:

Theme Selection
Report Header Customization
Certificate Branding

---

# 22.2 Plan & Usage Module

Supports SaaS subscription enforcement.

Tracks:

Active Users Count
Student Limit
Teacher Limit
Storage Usage
SMS Credits
Email Credits
API Usage

Plan types example:

Starter
Standard
Professional
Enterprise

Controls:

Feature Access
Institute Limits
Module Permissions
Export Limits
Analytics Access

Example:

Starter Plan:

Attendance
Students
Fees

Enterprise Plan:

Attendance
Fees
Analytics
Sponsor Tracking
Donor Ledger
Advanced Reports
Mobile App Access

---

# 22.3 User Role & Management

Implements Role-Based Access Control (RBAC).

Features:

Create Role
Edit Role
Assign Permissions
Assign Users to Roles
Department-level Access Control

Permission categories:

Student Management
Attendance
Fees
Accounts
Reports
Exam Control
Settings Access

Example:

Teacher Role:

Mark Attendance
Upload Marks
View Students

Accountant Role:

Manage Fees
Generate Receipts
Access Ledger

Principal Role:

Full Academic Access
Reports Dashboard
Staff Monitoring

---

# 22.4 Course Module

Defines educational programs.

Examples:

Science
Commerce
Arts
Alimiyat
Hifz
Nazra
Dars-e-Nizami

Course contains:

Subjects
Duration
Evaluation Type
Credit Structure
Exam Pattern

Supports:

Multi-course institutes
Parallel curriculum institutes

---

# 22.5 Class Module

Defines class hierarchy inside courses.

Examples:

Grade 1
Grade 2
Year 1
Year 2
Hifz Level 1
Hifz Level 2

Class attributes:

Course Mapping
Section Count
Class Teacher Assignment
Subject Allocation

---

# 22.6 Batch Module

Batch represents session grouping.

Examples:

2024 Batch
2025 Batch
Morning Batch
Evening Batch
Ramadan Special Batch

Supports:

Parallel teaching groups
Flexible timetable assignment
Shift-based institutions

---

# 22.7 Section Module

Defines subdivisions within classes.

Examples:

Class 5A
Class 5B
Hifz Section A
Science Section Red

Supports:

Separate attendance
Separate exam evaluation
Separate teacher assignment

---

# 22.8 Academic Year Module

Controls academic session lifecycle.

Examples:

2023–2024
2024–2025

Features:

Session Activation
Session Locking
Promotion Processing
Historical Data Archiving
Report Filtering by Session

Supports:

Multi-session reporting
Student promotion automation

---

# 22.9 Master Data Module

Central reusable configuration repository.

Includes:

Subject Master
Department Master
Designation Master
Religion Categories
Nationality Categories
Transport Routes
Hostel Blocks
Fee Categories

Purpose:

Avoid duplicate manual entries
Maintain consistent taxonomy

---

# 22.10 Student Profile Master

Controls student data schema dynamically.

Admin can configure:

Custom Fields
Mandatory Fields
Optional Fields
Dropdown Values
Document Upload Fields

Example fields:

Passport Number
Aadhar Number
Guardian Occupation
Sponsor Name
Previous School
Hifz Status
Medical Notes

Supports:

Country-specific compliance
Religious institution requirements
Government reporting needs

---

# 22.11 Email & SMS Module

Communication infrastructure layer.

Supports:

SMTP Configuration
SMS Gateway Integration
Template Management
Bulk Messaging
Event-based Notifications

Trigger-based messaging:

Admission Confirmation
Attendance Alerts
Fee Due Reminder
Exam Result Published
Holiday Announcement

Template example:

"Dear {ParentName}, {StudentName} was absent today."

Supports:

Email Templates
SMS Templates
WhatsApp-ready template structure (future-ready)

Credit tracking:

SMS Usage
Email Usage
Gateway Status Monitoring

---

---

# FRONTEND IMPLEMENTATION PLAN

## `cognivia-erp` · Next.js 16 + React 19 + Tailwind CSS v4

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| State | Zustand (global) + TanStack Query (server state) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Icons | Lucide React |
| Date handling | Day.js |
| PDF preview | react-pdf |
| Realtime | Socket.io client |
| Auth | Custom JWT (stored in httpOnly cookies via API route) |
| Deployment | Vercel |

---

## Current Status

### ✅ Phase 0 — Scaffold (DONE)
- [x] Next.js 16 + React 19 + TypeScript created
- [x] Tailwind CSS v4 configured
- [x] Basic `layout.tsx` + `page.tsx`

---

## Phase 1 — Foundation Setup (START HERE)

### 1.1 Install Core Dependencies
```bash
npm install zustand @tanstack/react-query @tanstack/react-table
npm install react-hook-form zod @hookform/resolvers
npm install recharts lucide-react dayjs
npm install axios socket.io-client
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-toast
npm install @radix-ui/react-tabs @radix-ui/react-popover
```

### 1.2 Project Structure
```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx            ← sidebar + topbar shell
│   ├── page.tsx              ← dashboard home
│   ├── students/
│   ├── attendance/
│   ├── fees/
│   ├── exams/
│   ├── accounts/
│   ├── reports/
│   ├── settings/
│   └── madrasa/
├── api/
│   └── auth/[...nextauth]/   ← token proxy (httpOnly cookies)
└── layout.tsx

components/
├── ui/                       ← Button, Input, Modal, Table, Badge, Card
├── layout/                   ← Sidebar, Topbar, PageHeader
├── forms/                    ← FormField, SearchInput, DatePicker
└── charts/                   ← BarChart, LineChart, DonutChart

lib/
├── api.ts                    ← axios instance with JWT interceptor
├── auth.ts                   ← token store + helpers
├── query-client.ts           ← TanStack Query config
└── utils.ts

store/
├── auth.store.ts             ← user, permissions, institute context
└── ui.store.ts               ← sidebar state, theme

hooks/
├── usePermission.ts          ← check if user has permission
├── useInstitute.ts           ← active institute context
└── use[Module].ts            ← per-module query hooks
```

### 1.3 API Client
- [ ] Axios instance with `baseURL = NEXT_PUBLIC_API_URL`
- [ ] Request interceptor — attach `Authorization: Bearer <token>`
- [ ] Request interceptor — attach `X-Institute-Id` header
- [ ] Response interceptor — auto-refresh token on 401
- [ ] Error interceptor — redirect to login on refresh failure

### 1.4 Auth Store (Zustand)
- [ ] `user`, `accessToken`, `permissions`, `activeInstituteId`
- [ ] `setAuth()`, `clearAuth()`, `switchInstitute()`
- [ ] `hasPermission(permission: string): boolean`
- [ ] Persist to localStorage (token in memory only for security)

### 1.5 Route Protection
- [ ] `middleware.ts` — redirect unauthenticated users to `/login`
- [ ] `usePermission` hook — hide/disable UI elements by permission
- [ ] Role-aware sidebar — items shown based on permissions

---

## Phase 2 — Auth Pages

### 2.1 Login Page `/login`
- [ ] Email + password form (React Hook Form + Zod)
- [ ] Show/hide password toggle
- [ ] "Remember me" checkbox
- [ ] Loading state on submit
- [ ] Error toast on invalid credentials
- [ ] Redirect to `/` after login
- [ ] Institute selector if user has multiple institutes

### 2.2 Register Page `/register`
- [ ] Organization name, slug, type (School/College/Madrasa/Hybrid)
- [ ] Admin name, email, password
- [ ] Slug auto-generated from org name
- [ ] Success redirect to login with toast

---

## Phase 3 — App Shell

### 3.1 Sidebar
- [ ] Logo + org name at top
- [ ] Nav items grouped by module (icons + labels)
- [ ] Active state indicator
- [ ] Collapsible on mobile
- [ ] Permission-gated nav items (hide if no access)
- [ ] Institute switcher dropdown (multi-campus)
- [ ] Bottom: user avatar + name + logout

Nav items:
```
Dashboard
Students
Attendance
Fees
Examinations
Accounts
Reports
Tasks
Madrasa          ← shown only if org type = MADRASA / HYBRID
Settings
```

### 3.2 Topbar
- [ ] Page title (dynamic)
- [ ] Breadcrumbs
- [ ] Notification bell with unread count
- [ ] User menu (profile, settings, logout)
- [ ] Academic year selector (global context)

### 3.3 Page Shell Component
- [ ] `PageHeader` with title + subtitle + action button slot
- [ ] Consistent padding + max-width

---

## Phase 4 — Dashboard

- [ ] Stats cards row: Total Students, Attendance Today %, Fee Collected Today, Pending Fees
- [ ] Attendance trend line chart (last 30 days)
- [ ] Fee collection bar chart (last 6 months)
- [ ] Recent admissions table (last 5 students)
- [ ] Recent payments table (last 5 receipts)
- [ ] Active exams list
- [ ] Madrasa widget: Sponsor Coverage Ratio + Donation Summary (conditional)
- [ ] All data via TanStack Query (`/dashboard/stats`, `/dashboard/activity`)
- [ ] Skeleton loaders while fetching

---

## Phase 5 — Students Module

### 5.1 Student List `/students`
- [ ] Search bar (name, admission no)
- [ ] Filters: class, section, status (active/inactive)
- [ ] Paginated data table (TanStack Table)
  - Columns: Admission No, Name, Class, Section, Phone, Status, Actions
- [ ] "Add Student" button → opens admission form modal
- [ ] Row click → navigate to student profile

### 5.2 Student Admission Form
- [ ] Multi-step form:
  - Step 1: Personal info (name, DOB, gender, religion, nationality, blood group)
  - Step 2: Contact (address, phone, email)
  - Step 3: Enrollment (class, section, batch, academic year, roll no)
  - Step 4: Guardian details
  - Step 5: Custom fields (dynamically rendered from `GET /settings/student-fields`)
- [ ] Photo upload
- [ ] Form validation with Zod
- [ ] Progress indicator between steps

### 5.3 Student Profile `/students/[id]`
- [ ] Profile header: photo, name, admission no, status badge
- [ ] Tabs:
  - **Overview** — personal info + enrollment history
  - **Attendance** — monthly calendar heatmap + summary stats
  - **Fees** — payment history table + outstanding amount
  - **Exams** — results per exam with grades
  - **Documents** — uploaded files
  - **Hifz** — Hifz progress (conditional, madrasa only)
- [ ] Edit button → inline edit mode
- [ ] Transfer / Deactivate actions

---

## Phase 6 — Attendance Module

### 6.1 Mark Attendance `/attendance/mark`
- [ ] Select: Class → Section → Date (defaults to today)
- [ ] Student list table with radio buttons: Present / Absent / Late / Excused
- [ ] "Mark All Present" quick action
- [ ] Remarks field per student (optional)
- [ ] Submit → `POST /attendance/mark`
- [ ] Success toast + summary (X present, Y absent)

### 6.2 Attendance Reports `/attendance/reports`
- [ ] Section monthly report — grid table (students × days)
  - Color coded: green=present, red=absent, yellow=late
- [ ] Daily summary cards (present %, absent count)
- [ ] Absentees list for selected date with guardian contact
- [ ] Export to Excel button

---

## Phase 7 — Fees Module

### 7.1 Fee Collection `/fees/collect`
- [ ] Student search (autocomplete)
- [ ] Show student's pending fees
- [ ] Fee category + amount + discount + late fee fields
- [ ] Payment method selector
- [ ] Submit → receipt generated
- [ ] Printable receipt modal (PDF preview)

### 7.2 Fee Dashboard `/fees`
- [ ] Stats: Today's Collection, Pending Amount, Overdue Count
- [ ] Defaulters table with aging (30/60/90 days)
- [ ] Collection summary chart by month
- [ ] Fee structure management tab

### 7.3 Student Fees View
- [ ] Fee history table per student
- [ ] Outstanding balance summary
- [ ] "Collect Payment" action button

---

## Phase 8 — Examinations Module

### 8.1 Exam List `/exams`
- [ ] Active / Completed / Draft tabs
- [ ] Exam cards: name, dates, status badge, total marks
- [ ] "Create Exam" button

### 8.2 Create Exam Form
- [ ] Name, exam type, academic year, grade schema
- [ ] Start / end dates
- [ ] Total marks + passing marks

### 8.3 Marks Entry `/exams/[id]/marks`
- [ ] Student list × subject columns grid
- [ ] Inline number inputs
- [ ] Save row by row or bulk save
- [ ] Validation: cannot exceed total marks

### 8.4 Results `/exams/[id]/results`
- [ ] Ranking table: Rank, Name, Total Marks, Grade, Pass/Fail
- [ ] Publish Results button (with confirmation)
- [ ] Export report cards PDF (bulk)

---

## Phase 9 — Settings Module

### 9.1 General Settings `/settings/general`
- [ ] Org name, logo upload, type, timezone, language, currency
- [ ] Report header customization

### 9.2 Academic Structure `/settings/academic`
- [ ] Tabs: Academic Years | Classes | Sections | Batches | Subjects | Courses
- [ ] CRUD tables for each with inline add/edit

### 9.3 User & Roles `/settings/roles`
- [ ] Roles list with permission count
- [ ] Role detail: permission matrix (module × action checkboxes)
- [ ] Create custom role
- [ ] Assign role to user

### 9.4 Institutes `/settings/institutes`
- [ ] List of campuses
- [ ] Add / edit institute

### 9.5 Student Fields `/settings/student-fields`
- [ ] Drag-and-drop field order
- [ ] Add custom field (text, number, dropdown, date)
- [ ] Toggle mandatory / optional

### 9.6 Email & SMS `/settings/notifications`
- [ ] Resend API key config
- [ ] Twilio config
- [ ] Template editor with variable placeholders

---

## Phase 10 — Madrasa Module (Conditional)

Shown only when `org.type === 'MADRASA' || org.type === 'HYBRID'`

### 10.1 Hifz Tracker `/madrasa/hifz`
- [ ] Student search
- [ ] Surah progress table: Surah name, from/to Ayat, status badge, date
- [ ] Add progress entry form
- [ ] Hifz completion timeline per student

### 10.2 Sponsorships `/madrasa/sponsorships`
- [ ] Active sponsorships table: student, sponsor, amount, frequency
- [ ] Add sponsorship form
- [ ] Coverage ratio widget

### 10.3 Donation Ledger `/madrasa/donations`
- [ ] Donations table: donor, type, amount, date
- [ ] Type filter: Zakat / Sadaqah / Waqf / Qurbani / General
- [ ] Summary cards by type
- [ ] Add donation entry form

---

## Phase 11 — Reports & Export

### 11.1 Reports Hub `/reports`
- [ ] Cards per report type (click to generate)

### 11.2 Report Views
- [ ] Student Strength Report (class-wise bar chart + table)
- [ ] Attendance Analytics (trend + section comparison)
- [ ] Fee Defaulters (aging table with contact info)
- [ ] Exam Performance (subject-wise averages chart)
- [ ] Sponsor Coverage (madrasa only)

### 11.3 Exports
- [ ] Export buttons on every report (Excel, CSV)
- [ ] Bulk report card PDF export per exam
- [ ] ID card PDF export

---

## Phase 12 — Accounts Module

- [ ] Chart of accounts tree view
- [ ] Day book table (all transactions by date)
- [ ] Ledger view (per account, date range)
- [ ] Cash in hand widget
- [ ] Voucher entry form (Payment / Journal / Contra)
- [ ] Trial balance table

---

## Phase 13 — Realtime Features

- [ ] Socket.io client connecting on login
- [ ] Attendance dashboard auto-updates when teacher marks attendance
- [ ] In-app notification bell with live push
- [ ] Toast on fee payment received (accountant view)

---

## Phase 14 — Polish & UX

- [ ] Dark mode toggle (Tailwind CSS v4 `dark:`)
- [ ] Loading skeletons on all data tables
- [ ] Empty states with illustrations
- [ ] Error boundaries per page
- [ ] Optimistic UI on form submits
- [ ] Mobile responsive sidebar (drawer on small screens)
- [ ] Print stylesheet for receipts + report cards
- [ ] Keyboard shortcuts: `Cmd+K` global search, `N` for new record

---

## Phase 15 — Deployment (Vercel)

- [ ] Push frontend to GitHub
- [ ] Connect Vercel to repo
- [ ] Set env vars:
  ```
  NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
  NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
  ```
- [ ] Verify login + dashboard on production URL

---

## Build Order (Recommended Sequence)

```
Phase 1 (Foundation)  →  Phase 2 (Auth)  →  Phase 3 (Shell)
     ↓
Phase 4 (Dashboard)  →  Phase 5 (Students)  →  Phase 6 (Attendance)
     ↓
Phase 7 (Fees)  →  Phase 8 (Exams)  →  Phase 9 (Settings)
     ↓
Phase 10 (Madrasa)  →  Phase 11 (Reports)  →  Phase 12 (Accounts)
     ↓
Phase 13 (Realtime)  →  Phase 14 (Polish)  →  Phase 15 (Deploy)
```

Each phase is independently deployable — ship working modules incrementally.

---

## Design System

- **Primary color:** Deep Indigo `#4F46E5`
- **Accent:** Emerald `#10B981`
- **Danger:** Rose `#F43F5E`
- **Warning:** Amber `#F59E0B`
- **Font:** Geist Sans (already in layout.tsx)
- **Border radius:** `rounded-xl` for cards, `rounded-lg` for inputs
- **Shadow:** subtle `shadow-sm` on cards
- **Table rows:** zebra striping with hover highlight
