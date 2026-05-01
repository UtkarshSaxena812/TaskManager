import UserAvatar from './UserAvatar'

export default function MemberDirectory({ members, onSelectMember, title = 'Team directory', compact = false }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white p-5 shadow-xl shadow-slate-950/10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">View profiles across the workspace.</p>
        </div>
      </div>

      <div className={compact ? 'mt-5 grid gap-3' : 'mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2'}>
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelectMember(member)}
            className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 p-3 text-left transition hover:border-teal-200 hover:bg-teal-50/70"
          >
            <UserAvatar user={member} size={compact ? 'sm' : 'md'} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{member.full_name || member.email}</p>
              <p className="truncate text-xs text-slate-500">{member.email}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">{member.role}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
