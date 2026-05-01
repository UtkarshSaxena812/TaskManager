export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/10 px-6 py-6 text-white shadow-2xl shadow-slate-950/20 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.28em] text-teal-300">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm text-slate-300">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
