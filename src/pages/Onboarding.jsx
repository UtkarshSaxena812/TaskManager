import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'

const steps = [
  {
    badge: '01',
    eyebrow: 'Organize',
    title: 'Turn scattered work into one shared plan.',
    description:
      'Create projects, define deadlines, and keep every task tied to a clear owner before the team starts execution.',
    metric: '8 active projects',
    icon: LayoutDashboard,
  },
  {
    badge: '02',
    eyebrow: 'Assign',
    title: 'Give admins and members the right workspace.',
    description:
      'Admins manage projects and people, while members see only the work they need to finish and update.',
    metric: '24 assigned tasks',
    icon: UsersRound,
  },
  {
    badge: '03',
    eyebrow: 'Track',
    title: 'Spot blockers before deadlines slip.',
    description:
      'Use status, due dates, and reports to understand what is done, delayed, and ready for review.',
    metric: '92% on-time delivery',
    icon: BarChart3,
  },
]

const previewTasks = [
  { label: 'Finalize API schema', status: 'In review', tone: 'bg-amber-100 text-amber-700' },
  { label: 'Invite frontend team', status: 'Done', tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'QA dashboard filters', status: 'Today', tone: 'bg-sky-100 text-sky-700' },
]

export default function Onboarding() {
  const [activeStep, setActiveStep] = useState(0)
  const step = steps[activeStep]

  const progress = useMemo(() => `${((activeStep + 1) / steps.length) * 100}%`, [activeStep])

  const goNext = () => {
    setActiveStep((current) => Math.min(current + 1, steps.length - 1))
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.24),_transparent_34%),linear-gradient(135deg,_#020617_0%,_#0f172a_58%,_#111827_100%)]" />
        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col">
          <nav className="flex items-center justify-between gap-4 py-3">
            <Link to="/onboarding" className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Team Task Manager"
                className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-teal-950/30"
              />
              <span>
                <span className="block text-base font-semibold">Team Task Manager</span>
                <span className="block text-xs text-slate-400">Project clarity, shipped faster</span>
              </span>
            </Link>
            <Link
              to="/login?audience=member"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>

          <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-4 py-2 text-sm text-teal-100">
                <Sparkles className="h-4 w-4 text-teal-300" />
                Assignment-ready team workflow
              </div>

              <div className="mt-8 max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-300">
                  {step.eyebrow}
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {step.title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                  {step.description}
                </p>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                {steps.map((item, index) => {
                  const ItemIcon = item.icon
                  const isActive = index === activeStep

                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        isActive
                          ? 'border-teal-300/50 bg-teal-300/15 shadow-lg shadow-teal-950/30'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-400">{item.badge}</span>
                        <ItemIcon className={isActive ? 'h-4 w-4 text-teal-200' : 'h-4 w-4 text-slate-400'} />
                      </span>
                      <span className="mt-4 block text-sm font-semibold text-white">{item.eyebrow}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 h-1.5 max-w-xl overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-teal-300 transition-all duration-300" style={{ width: progress }} />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {activeStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
                  >
                    Create member account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  to="/login?audience=admin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Admin access
                  <ShieldCheck className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/10 bg-white p-4 text-slate-950 shadow-2xl shadow-slate-950/40 sm:p-5">
                <div className="rounded-[1.5rem] bg-slate-50 p-4 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
                        Live workspace
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight">Sprint command center</h2>
                    </div>
                    <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                      {step.metric}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <CalendarClock className="h-5 w-5 text-sky-600" />
                      <p className="mt-4 text-2xl font-semibold">12</p>
                      <p className="mt-1 text-xs text-slate-500">Due this week</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="mt-4 text-2xl font-semibold">31</p>
                      <p className="mt-1 text-xs text-slate-500">Completed</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <UsersRound className="h-5 w-5 text-violet-600" />
                      <p className="mt-4 text-2xl font-semibold">9</p>
                      <p className="mt-1 text-xs text-slate-500">Members</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold">Priority tasks</p>
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                        Synced
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {previewTasks.map((task) => (
                        <div key={task.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100">
                              <CheckCircle2 className="h-4 w-4 text-slate-500" />
                            </span>
                            <p className="truncate text-sm font-medium text-slate-800">{task.label}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${task.tone}`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
