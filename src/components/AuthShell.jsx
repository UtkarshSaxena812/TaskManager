import { ArrowLeft, CheckSquare2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthShell({ children, eyebrow, title, description, activeAudience = 'member' }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.24),_transparent_34%),linear-gradient(135deg,_#020617_0%,_#0f172a_58%,_#111827_100%)]" />
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-slate-950/40 backdrop-blur lg:grid-cols-[0.82fr_1fr]">
          <section className="hidden p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <Link to="/onboarding" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Team Task Manager" className="h-11 w-11 rounded-2xl object-cover" />
              <span>
                <span className="block text-sm font-semibold">Team Task Manager</span>
                <span className="block text-xs text-slate-400">Workspace access</span>
              </span>
            </Link>

            <div className="my-10">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-300">
                Choose Portal
              </p>
              <h1 className="mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-tight">
                Sign in to manage work clearly.
              </h1>
            </div>

            <div className="grid gap-3">
              <Link
                to="/login?audience=admin"
                className={`rounded-3xl border p-4 transition ${
                  activeAudience === 'admin'
                    ? 'border-teal-400/40 bg-teal-400/10 shadow-lg shadow-teal-900/30'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-teal-300" />
                  <div>
                    <p className="text-sm font-semibold">Admin</p>
                    <p className="mt-1 text-xs text-slate-400">Projects, members, reports</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/login?audience=member"
                className={`rounded-3xl border p-4 transition ${
                  activeAudience === 'member'
                    ? 'border-sky-400/40 bg-sky-400/10 shadow-lg shadow-sky-950/30'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckSquare2 className="h-5 w-5 text-sky-300" />
                  <div>
                    <p className="text-sm font-semibold">Member</p>
                    <p className="mt-1 text-xs text-slate-400">Tasks, deadlines, status</p>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          <section className="bg-white px-6 py-8 text-slate-950 sm:px-10 lg:px-12 lg:py-12">
            <div className="mx-auto max-w-md">
              <Link
                to="/onboarding"
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Overview
              </Link>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-600">{eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
              {description ? <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p> : null}
              <div className="mt-8">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
