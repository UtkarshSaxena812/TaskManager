import { ArrowUpRight } from 'lucide-react'

export default function StatCard({ icon: Icon, label, value, accent, hint }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white p-5 shadow-xl shadow-slate-950/10 transition hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-teal-500" />
      </div>
      <p className="mt-6 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
    </div>
  )
}
