import Link from 'next/link'
import {
  GraduationCap,
  UserCheck,
  DollarSign,
  ClipboardList,
  BookOpen,
  BarChart3,
  Landmark,
  Shield,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const FEATURES = [
  { icon: GraduationCap, title: 'Students',       desc: 'Admissions, profiles, enrollment history, guardian linking.' },
  { icon: UserCheck,     title: 'Attendance',      desc: 'Bulk marking per section, monthly grid reports, absentee alerts.' },
  { icon: DollarSign,    title: 'Fees',            desc: 'Collect payments, auto-generate receipts, track defaulters.' },
  { icon: ClipboardList, title: 'Examinations',    desc: 'Create exams, enter marks, auto-rank, publish results.' },
  { icon: BookOpen,      title: 'Madrasa',         desc: 'Hifz tracker, sponsorships, Zakat & Sadaqah donation ledger.' },
  { icon: BarChart3,     title: 'Reports',         desc: 'Strength, attendance analytics, fee aging — on demand.' },
  { icon: Landmark,      title: 'Accounts',        desc: 'Day book, per-account ledger, double-entry vouchers.' },
  { icon: Shield,        title: 'Access Control',  desc: 'Custom roles with granular per-module permissions.' },
]

const STEPS = [
  { n: '1', title: 'Register',  desc: 'Create an account, set up your institute, add your logo and timezone.' },
  { n: '2', title: 'Configure', desc: 'Add academic years, classes, sections, subjects, and invite staff.' },
  { n: '3', title: 'Manage',    desc: 'Admit students, mark attendance, collect fees, and pull reports — all from one dashboard.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] selection:bg-indigo-100 dark:selection:bg-indigo-900/50">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-100/80 bg-white/90 backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0a]/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4F46E5]">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
              Cognivia <span className="font-normal text-gray-400">ERP</span>
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="hidden text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white sm:block transition-colors">
              Features
            </Link>
            <Link href="#how" className="hidden text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white sm:block transition-colors">
              How it works
            </Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <ThemeToggle />
            <Link
              href="/get-started"
              className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 sm:pt-36 sm:pb-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-px w-[600px] -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent dark:via-indigo-700/40" />
        </div>

        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-4 text-sm font-medium text-[#4F46E5]">For schools, colleges &amp; madrasas</p>

          <h1 className="text-[2.75rem] font-bold leading-[1.15] tracking-tight text-gray-950 dark:text-white sm:text-6xl">
            Institute management,{' '}
            <span className="text-[#4F46E5]">finally simple</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-500 dark:text-gray-400">
            One platform for students, attendance, fees, exams, accounts, and reporting.
            Built for the way educational institutions actually work.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="h-px bg-gray-100 dark:bg-white/5" />
      </div>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#4F46E5]">Modules</p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Everything in one place
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px border border-gray-100 bg-gray-100 dark:border-white/5 dark:bg-white/5 sm:grid-cols-2 lg:grid-cols-4 rounded-xl overflow-hidden">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group flex flex-col gap-3 bg-white p-6 hover:bg-gray-50/80 dark:bg-[#0a0a0a] dark:hover:bg-white/[0.03] transition-colors"
              >
                <f.icon className="h-4.5 w-4.5 text-[#4F46E5]" strokeWidth={1.75} />
                <div>
                  <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{f.title}</p>
                  <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="h-px bg-gray-100 dark:bg-white/5" />
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#4F46E5]">How it works</p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-bold text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-500">
                  {s.n}
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-900 dark:text-white">{s.title}</p>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="h-px bg-gray-100 dark:bg-white/5" />
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-10 py-16 text-center dark:border-white/5 dark:bg-white/[0.02]">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Ready to get started?
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Set up your institute in under five minutes. No credit card required.
            </p>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors"
            >
              Request onboarding
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-white/5">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4F46E5]">
              <GraduationCap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Cognivia ERP</span>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Built by{' '}
            <a
              href="https://revzion.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Revzion
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </p>

          <div className="flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500">
            <Link href="/login" className="hover:text-gray-700 dark:hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-gray-700 dark:hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
