import Link from 'next/link'
import {
  GraduationCap, UserCheck, DollarSign, ClipboardList,
  BookOpen, BarChart3, Landmark, Shield,
  ArrowRight, ArrowUpRight, Home, Zap, Globe, Clock, Users, TrendingUp,
} from 'lucide-react'

const MODULES = [
  { icon: GraduationCap, label: 'Students',   color: 'bg-indigo-500',  stat: '∞ profiles'   },
  { icon: UserCheck,     label: 'Attendance', color: 'bg-blue-500',    stat: 'Bulk marking'  },
  { icon: DollarSign,    label: 'Fees',       color: 'bg-emerald-500', stat: 'Auto receipts' },
  { icon: ClipboardList, label: 'Exams',      color: 'bg-orange-500',  stat: 'Auto ranking'  },
  { icon: BookOpen,      label: 'Madrasa',    color: 'bg-rose-500',    stat: 'Hifz tracker'  },
  { icon: BarChart3,     label: 'Reports',    color: 'bg-violet-500',  stat: 'On-demand'     },
  { icon: Landmark,      label: 'Accounts',   color: 'bg-cyan-600',    stat: 'Double entry'  },
  { icon: Shield,        label: 'Access',     color: 'bg-slate-500',   stat: 'Custom roles'  },
]

const REVZION_STATS = [
  { icon: Globe,      value: '10+',   label: 'Products shipped' },
  { icon: Users,      value: '50k+',  label: 'Users served'     },
  { icon: TrendingUp, value: '99.9%', label: 'Uptime SLA'       },
  { icon: Clock,      value: '< 48h', label: 'First prototype'  },
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] selection:bg-indigo-100 dark:selection:bg-indigo-900/50 overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#030712]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4F46E5]">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
              Cognivia <span className="font-normal text-gray-400">ERP</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-[#4338CA] transition-all"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[68vh] flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-16">

        {/* Single radial spotlight at top */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-[500px]"
          style={{
            background:
              'radial-gradient(ellipse 75% 90% at 50% -20%, rgba(79,70,229,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Fine line grid — radially masked so it fades toward edges */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              'linear-gradient(rgba(99,102,241,0.10) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(99,102,241,0.10) 1px, transparent 1px)',
            ].join(','),
            backgroundSize: '52px 52px',
            maskImage:
              'radial-gradient(ellipse 65% 70% at 50% 38%, black 0%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 65% 70% at 50% 38%, black 0%, transparent 85%)',
          }}
        />

        {/* Light beams from top-center */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[44%] w-px -translate-x-1/2 bg-gradient-to-b from-indigo-500/50 to-transparent" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-56 w-px origin-top bg-gradient-to-b from-indigo-400/22 to-transparent"
          style={{ transform: 'translateX(-50%) rotate(-22deg)' }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-56 w-px origin-top bg-gradient-to-b from-indigo-400/22 to-transparent"
          style={{ transform: 'translateX(-50%) rotate(22deg)' }}
        />

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white dark:from-[#030712] to-transparent" />

        <div className="relative flex flex-col items-center text-center">

          {/* Status badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/80 px-4 py-1.5 backdrop-blur-sm dark:border-rose-500/20 dark:bg-rose-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Error 404 — Page not found
            </span>
          </div>

          {/* Glitch 404 — three layers: gradient main + cyan + rose */}
          <div className="relative mb-6 select-none" aria-label="404">
            {/* Underglow */}
            <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
              <div className="h-20 w-[480px] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20" />
            </div>

            {/* Main gradient text */}
            <span
              className="block text-[8.5rem] font-black leading-none tracking-tighter sm:text-[13rem]"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 45%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </span>

            {/* Glitch layer — cyan */}
            <span
              className="glitch-layer-1 pointer-events-none absolute inset-0 block text-[8.5rem] font-black leading-none tracking-tighter sm:text-[13rem]"
              aria-hidden
            >
              404
            </span>

            {/* Glitch layer — rose */}
            <span
              className="glitch-layer-2 pointer-events-none absolute inset-0 block text-[8.5rem] font-black leading-none tracking-tighter sm:text-[13rem]"
              aria-hidden
            >
              404
            </span>
          </div>

          <h1 className="mb-3 text-[1.6rem] font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            This page doesn&apos;t exist
          </h1>
          <p className="mb-10 max-w-[420px] text-[0.9375rem] leading-relaxed text-gray-500 dark:text-gray-400">
            The page you&apos;re looking for may have been moved, renamed, or never existed.
            Let&apos;s get you back to where the action is.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-[#4338CA] hover:-translate-y-px transition-all"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:-translate-y-px dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08] transition-all"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Module preview ───────────────────────────────────────── */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#4F46E5]">
            While you&apos;re here
          </p>
          <h2 className="mb-8 text-center text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Discover what Cognivia ERP can do
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MODULES.map((m) => (
              <Link
                key={m.label}
                href="/get-started"
                className="card-elevated group flex flex-col gap-3 rounded-xl border border-gray-100/80 bg-white p-4 dark:border-white/[0.09] dark:bg-white/[0.06] hover:-translate-y-0.5 transition-all"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.color} text-white`}>
                  <m.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white transition-colors">
                    {m.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{m.stat}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Revzion advertisement ────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-[#4F46E5]">
            Crafted by
          </p>

          {/* Gradient border wrapper — 1px gradient ring around the card */}
          <div
            className="rounded-[18px] p-px"
            style={{
              background:
                'linear-gradient(135deg, rgba(79,70,229,0.50) 0%, rgba(124,58,237,0.22) 50%, rgba(99,102,241,0.50) 100%)',
            }}
          >
            <div className="relative overflow-hidden rounded-[17px] bg-white px-8 py-10 dark:bg-[#0a0a12]">

              {/* Subtle inner top glow */}
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 h-44 opacity-60"
                style={{
                  background:
                    'radial-gradient(ellipse 70% 80% at 50% -10%, rgba(79,70,229,0.14) 0%, transparent 70%)',
                }}
              />

              {/* Header row */}
              <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] shadow-lg shadow-indigo-500/30">
                  <Zap className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2.5">
                    <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                      Revzion
                    </h3>
                    <span className="rounded-full bg-[#4F46E5]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#4F46E5] dark:bg-[#4F46E5]/20">
                      Studio
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Digital experiences that outlast the competition.
                  </p>
                </div>
                <a
                  href="https://revzion.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-[#4338CA] hover:-translate-y-px transition-all"
                >
                  Visit Revzion <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              {/* Description */}
              <p className="relative mt-5 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                We design and build enterprise-grade software for organizations that need to move fast
                without breaking things — ERP systems, SaaS platforms, and bespoke digital products
                that scale with your ambitions. Cognivia ERP is one of our flagship builds.
              </p>

              {/* Stats */}
              <div className="relative mt-8 grid grid-cols-2 gap-5 border-t border-gray-100 pt-8 dark:border-white/[0.06] sm:grid-cols-4">
                {REVZION_STATS.map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center gap-1.5">
                      <s.icon className="h-3.5 w-3.5 text-[#4F46E5]" strokeWidth={2} />
                      <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                        {s.value}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA strip */}
              <div className="relative mt-7 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Need a product like this?
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    We ship MVPs in weeks, not months. Let&apos;s talk.
                  </p>
                </div>
                <a
                  href="https://revzion.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#4F46E5]/30 bg-[#4F46E5]/5 px-4 py-2 text-sm font-semibold text-[#4F46E5] hover:bg-[#4F46E5]/10 transition-all dark:border-[#4F46E5]/20 dark:bg-[#4F46E5]/10 dark:hover:bg-[#4F46E5]/20"
                >
                  Start a project <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
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
            <Link href="/get-started" className="hover:text-gray-700 dark:hover:text-white transition-colors">Get started</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
