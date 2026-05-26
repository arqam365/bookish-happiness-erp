/**
 * Linear workspace setup script for cognivia-erp (Frontend)
 *
 * Run once after creating your Linear workspace:
 *   LINEAR_API_KEY=lin_api_xxx LINEAR_TEAM_ID=xxx npx ts-node scripts/linear-setup.ts
 *
 * Get your API key: Linear → Settings → API → Personal API keys
 * Get your Team ID: Linear → Settings → Members & Teams → copy team ID from URL
 */

import { LinearClient } from '@linear/sdk';

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY! });
const TEAM_ID = process.env.LINEAR_TEAM_ID!;

const PHASES: { title: string; priority: number; issues: { title: string; description: string; labelNames: string[] }[] }[] = [
  {
    title: 'Phase 1 — Foundation Setup',
    priority: 1,
    issues: [
      { title: 'Install core dependencies (Zustand, TanStack Query, RHF, Zod, Recharts)', description: 'Install all required npm packages for state, forms, tables, charts.', labelNames: ['frontend', 'setup'] },
      { title: 'Set up Axios API client with JWT + institute interceptors', description: 'Axios instance with Authorization header, X-Institute-Id, auto-refresh on 401.', labelNames: ['frontend', 'api'] },
      { title: 'Set up Zustand auth store', description: 'Store user, accessToken, permissions, activeInstituteId. hasPermission() helper.', labelNames: ['frontend', 'auth'] },
      { title: 'Set up TanStack Query client', description: 'Configure staleTime, retry, error handling globally.', labelNames: ['frontend', 'setup'] },
      { title: 'Create folder structure — app, components, lib, store, hooks', description: 'Scaffold all directories per PLAN.md structure.', labelNames: ['frontend', 'setup'] },
      { title: 'Route protection middleware', description: 'middleware.ts — redirect unauthenticated users to /login.', labelNames: ['frontend', 'auth'] },
      { title: 'usePermission hook', description: 'Hook to check if current user has a specific permission string.', labelNames: ['frontend', 'auth'] },
    ],
  },
  {
    title: 'Phase 2 — Auth Pages',
    priority: 1,
    issues: [
      { title: 'Login page /login', description: 'Email + password form, show/hide password, loading state, error toast, redirect after login.', labelNames: ['frontend', 'auth'] },
      { title: 'Institute selector on login (multi-campus)', description: 'After login, if user has multiple institutes show selector before dashboard.', labelNames: ['frontend', 'auth'] },
      { title: 'Register page /register', description: 'Org name, slug, type, admin name/email/password. Slug auto-generated from org name.', labelNames: ['frontend', 'auth'] },
    ],
  },
  {
    title: 'Phase 3 — App Shell',
    priority: 1,
    issues: [
      { title: 'Sidebar component with nav items', description: 'Logo, grouped nav, active state, permission-gated items, institute switcher, user menu.', labelNames: ['frontend', 'layout'] },
      { title: 'Sidebar collapse on mobile (drawer)', description: 'Hamburger button + slide-in drawer on small screens.', labelNames: ['frontend', 'layout'] },
      { title: 'Topbar with breadcrumbs + notification bell + user menu', description: 'Dynamic page title, breadcrumb trail, unread notification count, logout.', labelNames: ['frontend', 'layout'] },
      { title: 'Academic year selector in topbar', description: 'Global academic year context selector affecting all data fetches.', labelNames: ['frontend', 'layout'] },
      { title: 'PageHeader component', description: 'Reusable page header with title, subtitle, and action button slot.', labelNames: ['frontend', 'ui'] },
      { title: 'UI base components — Button, Input, Badge, Card, Modal', description: 'Core reusable UI primitives using Radix UI + Tailwind.', labelNames: ['frontend', 'ui'] },
      { title: 'DataTable component (TanStack Table)', description: 'Reusable table with sorting, pagination, search, loading skeleton, empty state.', labelNames: ['frontend', 'ui'] },
    ],
  },
  {
    title: 'Phase 4 — Dashboard',
    priority: 1,
    issues: [
      { title: 'Stats cards row (students, attendance %, fee today, pending)', description: 'Four metric cards fetching from GET /dashboard/stats.', labelNames: ['frontend', 'dashboard'] },
      { title: 'Attendance trend line chart (30 days)', description: 'Recharts LineChart showing daily attendance % for last 30 days.', labelNames: ['frontend', 'dashboard'] },
      { title: 'Fee collection bar chart (6 months)', description: 'Recharts BarChart showing monthly fee collection totals.', labelNames: ['frontend', 'dashboard'] },
      { title: 'Recent admissions table', description: 'Last 5 admitted students from GET /dashboard/activity.', labelNames: ['frontend', 'dashboard'] },
      { title: 'Recent payments table', description: 'Last 5 fee receipts from GET /dashboard/activity.', labelNames: ['frontend', 'dashboard'] },
      { title: 'Madrasa widgets (conditional)', description: 'Sponsor coverage ratio + donation summary shown only for MADRASA/HYBRID orgs.', labelNames: ['frontend', 'dashboard', 'madrasa'] },
      { title: 'Skeleton loaders on all dashboard widgets', description: 'Show loading skeletons while data fetches.', labelNames: ['frontend', 'dashboard'] },
    ],
  },
  {
    title: 'Phase 5 — Students Module',
    priority: 1,
    issues: [
      { title: 'Student list page with search, filters, pagination', description: 'TanStack Table with search, class/section/status filters, paginated from API.', labelNames: ['frontend', 'students'] },
      { title: 'Multi-step student admission form', description: 'Personal info → Contact → Enrollment → Guardian → Custom fields. Zod validation per step.', labelNames: ['frontend', 'students'] },
      { title: 'Custom fields dynamic rendering', description: 'Fetch GET /settings/student-fields and render field types dynamically in admission form.', labelNames: ['frontend', 'students'] },
      { title: 'Student photo upload', description: 'File input with preview and upload to POST /upload/student-photo.', labelNames: ['frontend', 'students'] },
      { title: 'Student profile page /students/[id]', description: 'Header with photo/name/status. Tabs: Overview, Attendance, Fees, Exams, Documents, Hifz.', labelNames: ['frontend', 'students'] },
      { title: 'Attendance tab — monthly calendar heatmap', description: 'Color-coded calendar showing daily attendance status per month.', labelNames: ['frontend', 'students'] },
      { title: 'Student edit + deactivate actions', description: 'Inline edit mode on profile, deactivate with confirmation dialog.', labelNames: ['frontend', 'students'] },
    ],
  },
  {
    title: 'Phase 6 — Attendance Module',
    priority: 1,
    issues: [
      { title: 'Mark attendance page /attendance/mark', description: 'Class → Section → Date selector. Student table with Present/Absent/Late/Excused radio. Mark All Present quick action.', labelNames: ['frontend', 'attendance'] },
      { title: 'Section monthly report grid', description: 'Students × days grid table, color coded by status. Export to Excel button.', labelNames: ['frontend', 'attendance'] },
      { title: 'Daily summary cards', description: 'Present %, absent count for selected date.', labelNames: ['frontend', 'attendance'] },
      { title: 'Absentees list with guardian contact', description: 'List of absent students for a date with phone numbers.', labelNames: ['frontend', 'attendance'] },
    ],
  },
  {
    title: 'Phase 7 — Fees Module',
    priority: 1,
    issues: [
      { title: 'Fee collection form /fees/collect', description: 'Student autocomplete, pending fees display, amount/discount/late fee fields, payment method, submit.', labelNames: ['frontend', 'fees'] },
      { title: 'Printable receipt modal (PDF preview)', description: 'After payment, show receipt preview with print option using react-pdf.', labelNames: ['frontend', 'fees'] },
      { title: 'Fee dashboard with stats + defaulters', description: 'Today collection, pending, overdue stats cards. Defaulters table with aging buckets.', labelNames: ['frontend', 'fees'] },
      { title: 'Fee collection summary chart', description: 'Monthly bar chart of fee collections.', labelNames: ['frontend', 'fees'] },
      { title: 'Fee structure management tab', description: 'CRUD for fee categories and fee structures per academic year.', labelNames: ['frontend', 'fees'] },
    ],
  },
  {
    title: 'Phase 8 — Examinations Module',
    priority: 2,
    issues: [
      { title: 'Exam list with status tabs (Active/Completed/Draft)', description: 'Exam cards with name, dates, status badge. Create exam button.', labelNames: ['frontend', 'exams'] },
      { title: 'Create exam form', description: 'Name, exam type, academic year, grade schema, dates, total/passing marks.', labelNames: ['frontend', 'exams'] },
      { title: 'Marks entry grid /exams/[id]/marks', description: 'Students × subjects grid with inline number inputs. Bulk save.', labelNames: ['frontend', 'exams'] },
      { title: 'Results page with ranking table', description: 'Rank, name, total marks, grade, pass/fail. Publish button with confirmation.', labelNames: ['frontend', 'exams'] },
      { title: 'Bulk report card PDF export', description: 'Export all report cards for an exam as PDF.', labelNames: ['frontend', 'exams'] },
    ],
  },
  {
    title: 'Phase 9 — Settings Module',
    priority: 2,
    issues: [
      { title: 'General settings page /settings/general', description: 'Org name, logo upload, type, timezone, language, currency, report header.', labelNames: ['frontend', 'settings'] },
      { title: 'Academic structure — classes, sections, batches, subjects', description: 'Tabbed CRUD tables for each academic entity.', labelNames: ['frontend', 'settings'] },
      { title: 'Roles & permissions matrix /settings/roles', description: 'Role list. Role detail with module × action checkbox matrix. Create custom role.', labelNames: ['frontend', 'settings'] },
      { title: 'Student fields config /settings/student-fields', description: 'Drag-and-drop field ordering. Add/edit custom fields with type selector.', labelNames: ['frontend', 'settings'] },
      { title: 'Institutes management /settings/institutes', description: 'List, add, edit institute campuses.', labelNames: ['frontend', 'settings'] },
      { title: 'Email & SMS config /settings/notifications', description: 'Resend API key, Twilio config, template editor with variable placeholders.', labelNames: ['frontend', 'settings'] },
    ],
  },
  {
    title: 'Phase 10 — Madrasa Module',
    priority: 2,
    issues: [
      { title: 'Hifz tracker /madrasa/hifz', description: 'Student search, Surah progress table, add progress entry form, completion timeline.', labelNames: ['frontend', 'madrasa'] },
      { title: 'Sponsorships /madrasa/sponsorships', description: 'Sponsorships table, add form, coverage ratio widget.', labelNames: ['frontend', 'madrasa'] },
      { title: 'Donation ledger /madrasa/donations', description: 'Donations table with type filter, summary cards by type, add donation form.', labelNames: ['frontend', 'madrasa'] },
      { title: 'Conditional rendering for MADRASA/HYBRID orgs', description: 'Madrasa nav items and pages only visible when org.type is MADRASA or HYBRID.', labelNames: ['frontend', 'madrasa'] },
    ],
  },
  {
    title: 'Phase 11 — Reports & Export',
    priority: 2,
    issues: [
      { title: 'Reports hub /reports with report type cards', description: 'Grid of report cards, each opens the report view.', labelNames: ['frontend', 'reports'] },
      { title: 'Student strength report', description: 'Class-wise bar chart + count table.', labelNames: ['frontend', 'reports'] },
      { title: 'Attendance analytics report', description: 'Trend chart + section comparison.', labelNames: ['frontend', 'reports'] },
      { title: 'Fee defaulters report with aging', description: 'Sortable table with 30/60/90 day aging buckets + contact info.', labelNames: ['frontend', 'reports'] },
      { title: 'Export buttons (Excel, CSV, PDF) on all reports', description: 'Trigger export API and download file.', labelNames: ['frontend', 'reports'] },
    ],
  },
  {
    title: 'Phase 12 — Accounts Module',
    priority: 3,
    issues: [
      { title: 'Chart of accounts tree view', description: 'Hierarchical account list by type (Asset/Liability/Income/Expense).', labelNames: ['frontend', 'accounts'] },
      { title: 'Day book table', description: 'All transactions for selected date with debit/credit columns.', labelNames: ['frontend', 'accounts'] },
      { title: 'Ledger view per account', description: 'Date range filtered ledger with running balance.', labelNames: ['frontend', 'accounts'] },
      { title: 'Voucher entry form', description: 'Payment / Journal / Contra voucher creation form.', labelNames: ['frontend', 'accounts'] },
      { title: 'Trial balance table', description: 'Debit/credit totals for all accounts.', labelNames: ['frontend', 'accounts'] },
    ],
  },
  {
    title: 'Phase 13 — Realtime Features',
    priority: 3,
    issues: [
      { title: 'Socket.io client setup', description: 'Connect on login, disconnect on logout. JWT auth on handshake.', labelNames: ['frontend', 'realtime'] },
      { title: 'Live attendance dashboard updates', description: 'Attendance stats auto-refresh when teacher marks attendance.', labelNames: ['frontend', 'realtime'] },
      { title: 'In-app notification bell with live push', description: 'Notification dropdown with unread count badge, real-time updates via socket.', labelNames: ['frontend', 'realtime'] },
    ],
  },
  {
    title: 'Phase 14 — Polish & UX',
    priority: 3,
    issues: [
      { title: 'Dark mode toggle', description: 'Tailwind dark: classes + theme toggle in topbar. Persist in localStorage.', labelNames: ['frontend', 'ux'] },
      { title: 'Loading skeletons on all data tables', description: 'Show bone loaders during API fetches.', labelNames: ['frontend', 'ux'] },
      { title: 'Empty state illustrations', description: 'Friendly empty states when tables/lists have no data.', labelNames: ['frontend', 'ux'] },
      { title: 'Error boundaries per page', description: 'Catch render errors and show friendly fallback per module.', labelNames: ['frontend', 'ux'] },
      { title: 'Print stylesheet for receipts + report cards', description: '@media print CSS to hide nav and format documents for printing.', labelNames: ['frontend', 'ux'] },
      { title: 'Cmd+K global search', description: 'Command palette for quick navigation to any student, section, or page.', labelNames: ['frontend', 'ux'] },
    ],
  },
  {
    title: 'Phase 15 — Deployment (Vercel)',
    priority: 1,
    issues: [
      { title: 'Push frontend to GitHub', description: 'Initialize git and push cognivia-erp to GitHub.', labelNames: ['frontend', 'devops'] },
      { title: 'Connect Vercel to GitHub repo', description: 'Import project in Vercel and link to cognivia-erp repo.', labelNames: ['frontend', 'devops'] },
      { title: 'Set env vars in Vercel', description: 'NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL pointing to Railway backend.', labelNames: ['frontend', 'devops'] },
      { title: 'Verify login + dashboard on production URL', description: 'Smoke test full login flow on Vercel production URL.', labelNames: ['frontend', 'devops'] },
    ],
  },
];

async function getOrCreateLabel(teamId: string, name: string, color: string): Promise<string> {
  const labels = await client.issueLabels({ filter: { team: { id: { eq: teamId } } } });
  const existing = labels.nodes.find((l) => l.name === name);
  if (existing) return existing.id;
  const result = await client.createIssueLabel({ teamId, name, color });
  return (await result.issueLabel)!.id;
}

async function main() {
  if (!process.env.LINEAR_API_KEY || !TEAM_ID) {
    console.error('❌ Set LINEAR_API_KEY and LINEAR_TEAM_ID env vars');
    process.exit(1);
  }

  const me = await client.viewer;
  console.log(`✅ Connected as: ${me.name}`);

  const team = await client.team(TEAM_ID);
  const states = await team.states();
  const todoState = states.nodes.find((s) => s.name === 'Todo' || s.name === 'Backlog');

  const labelColors: Record<string, string> = {
    frontend: '#6366f1', setup: '#94a3b8', api: '#0ea5e9', auth: '#f59e0b',
    layout: '#8b5cf6', ui: '#ec4899', dashboard: '#10b981', students: '#84cc16',
    attendance: '#14b8a6', fees: '#f97316', exams: '#6366f1', settings: '#64748b',
    madrasa: '#a78bfa', reports: '#e11d48', accounts: '#0369a1', realtime: '#0d9488',
    ux: '#d946ef', devops: '#1e40af',
  };

  const labelIds: Record<string, string> = {};
  for (const [name, color] of Object.entries(labelColors)) {
    labelIds[name] = await getOrCreateLabel(TEAM_ID, name, color);
    process.stdout.write('.');
  }
  console.log('\n✅ Labels ready');

  let created = 0;
  for (const phase of PHASES) {
    console.log(`\n📦 Creating: ${phase.title}`);
    for (const issue of phase.issues) {
      const resolvedLabelIds = issue.labelNames.map((n) => labelIds[n]).filter(Boolean);
      await client.createIssue({
        teamId: TEAM_ID,
        title: `[FE] ${issue.title}`,
        description: issue.description,
        priority: phase.priority,
        stateId: todoState?.id,
        labelIds: resolvedLabelIds,
      });
      process.stdout.write('.');
      created++;
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`\n\n🎉 Done! Created ${created} frontend issues in Linear.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
