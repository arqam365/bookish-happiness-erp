import Link from 'next/link'
import {
  GraduationCap, UserCheck, DollarSign, ClipboardList,
  BookOpen, BarChart3, Landmark, Shield, ArrowRight, ArrowUpRight,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const FEATURES = [
  { icon: GraduationCap, label: 'Students',      desc: 'Admissions, profiles, enrollment history, guardian linking.',         color: 'bg-indigo-500' },
  { icon: UserCheck,     label: 'Attendance',     desc: 'Bulk marking per section, monthly grid reports, absentee alerts.',    color: 'bg-blue-500' },
  { icon: DollarSign,    label: 'Fees',           desc: 'Collect payments, auto-generate receipts, track defaulters.',         color: 'bg-emerald-500' },
  { icon: ClipboardList, label: 'Examinations',   desc: 'Create exams, enter marks, auto-rank, publish results.',             color: 'bg-orange-500' },
  { icon: BookOpen,      label: 'Madrasa',        desc: 'Hifz tracker, sponsorships, Zakat & Sadaqah donation ledger.',        color: 'bg-rose-500' },
  { icon: BarChart3,     label: 'Reports',        desc: 'Strength, attendance analytics, fee aging — on demand.',             color: 'bg-violet-500' },
  { icon: Landmark,      label: 'Accounts',       desc: 'Day book, per-account ledger, double-entry vouchers.',               color: 'bg-cyan-600' },
  { icon: Shield,        label: 'Access Control', desc: 'Custom roles with granular per-module permissions.',                 color: 'bg-slate-500' },
]

const STEPS = [
  { n: '01', title: 'Register',  desc: 'Create an account, set up your institute, add your logo and timezone.' },
  { n: '02', title: 'Configure', desc: 'Add academic years, classes, sections, subjects, and invite staff.' },
  { n: '03', title: 'Manage',    desc: 'Admit students, mark attendance, collect fees, and pull reports — all from one dashboard.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] selection:bg-indigo-100 dark:selection:bg-indigo-900/50">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#030712]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4F46E5]">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
              Cognivia <span className="font-normal text-gray-400">ERP</span>
            </span>
          </div>

          <nav className="flex items-center gap-5">
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-[#4338CA] transition-all"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(99 102 241 / 0.45) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Colour blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 -top-20 h-[580px] w-[580px] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[110px] dark:bg-indigo-500/12"
            style={{ animation: 'blob-float 10s ease-in-out infinite' }}
          />
          <div
            className="absolute -right-20 top-1/4 h-[420px] w-[420px] rounded-full bg-violet-400/15 blur-[90px] dark:bg-violet-500/10"
            style={{ animation: 'blob-float-alt 13s ease-in-out infinite' }}
          />
          <div
            className="absolute -left-20 top-1/3 h-[320px] w-[320px] rounded-full bg-blue-400/15 blur-[80px] dark:bg-blue-500/8"
            style={{ animation: 'blob-float 11s ease-in-out infinite 2s' }}
          />
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-white dark:from-[#030712] to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="mb-5 text-sm font-medium text-[#4F46E5]">For schools, colleges &amp; madrasas</p>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-gray-950 dark:text-white sm:text-[4.5rem]">
            Institute management,{' '}
            <span className="text-[#4F46E5]">finally simple</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
            One platform for students, attendance, fees, exams, accounts, and reporting.
            Built for the way educational institutions actually work.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-[#4338CA] hover:shadow-indigo-500/35 hover:-translate-y-px transition-all"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:-translate-y-px dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08] transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gray-50/50 dark:bg-white/[0.01]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#4F46E5]">Modules</p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Everything in one place
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="card-elevated group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-100/80 bg-white px-6 py-5 dark:border-white/[0.09] dark:bg-white/[0.06]"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${f.color} text-white`}>
                  <f.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-900 dark:text-white">{f.label}</p>
                  <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#4F46E5]">How it works</p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Up and running in minutes
            </h2>
          </div>

          <div className="relative grid grid-cols-1 gap-12 sm:grid-cols-3">
            {/* Connector line — from center of circle 1 to center of circle 3 */}
            <div className="pointer-events-none absolute left-6 right-[calc(33.33%_-_3.17rem)] top-6 hidden h-px bg-gray-200 dark:bg-white/[0.08] sm:block" />

            {STEPS.map((s) => (
              <div key={s.n} className="relative flex flex-col gap-5">
                <div className="card-elevated relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100/80 bg-white dark:border-white/[0.09] dark:bg-white/[0.06]">
                  <span className="text-sm font-bold text-[#4F46E5]">{s.n}</span>
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

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="card-elevated rounded-2xl border border-gray-100/80 bg-white px-10 py-16 text-center dark:border-white/[0.09] dark:bg-white/[0.06]">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Ready to get started?
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Set up your institute in under five minutes. No credit card required.
            </p>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-[#4338CA] hover:-translate-y-px transition-all"
            >
              Request onboarding <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#4F46E5]">
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
              Revzion <ArrowUpRight className="h-3 w-3" />
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
