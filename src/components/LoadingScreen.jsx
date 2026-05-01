import { LoaderCircle } from 'lucide-react'

export default function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-slate-200 bg-white/80 p-8 shadow-sm">
      <div className="flex items-center gap-3 text-slate-600">
        <LoaderCircle className="h-5 w-5 animate-spin text-teal-600" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  )
}
