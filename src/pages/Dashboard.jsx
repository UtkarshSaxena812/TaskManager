import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MessageSquareMore,
  Search,
} from 'lucide-react'
import LoadingScreen from '../components/LoadingScreen'
import MemberDirectory from '../components/MemberDirectory'
import PageHeader from '../components/PageHeader'
import ProfileModal from '../components/ProfileModal'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabaseClient'
import { formatDate, getProjectStateMeta, isTaskOverdue, withTimeout } from '../lib/utils'

export default function Dashboard() {
  const { profile, user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      if (!cancelled) {
        setLoading(true)
        setErrorMessage('')
      }

      try {
        const isAdmin = profile?.role === 'admin'
        let accessibleProjectIds = []
        let projectRows = []

        if (isAdmin) {
          const { data: adminProjects, error: projectsError } = await withTimeout(
            supabase.from('projects').select('*').eq('created_by', user.id),
            10000,
            'Projects request timed out.',
          )

          if (projectsError) {
            throw projectsError
          }

          projectRows = adminProjects ?? []
          accessibleProjectIds = projectRows.map((project) => project.id)
        } else {
          const { data: memberships, error: membersError } = await withTimeout(
            supabase.from('project_members').select('project_id').eq('user_id', user.id),
            10000,
            'Project memberships request timed out.',
          )

          if (membersError) {
            throw membersError
          }

          accessibleProjectIds = [...new Set((memberships ?? []).map((member) => member.project_id))]

          if (accessibleProjectIds.length > 0) {
            const { data: memberProjects, error: projectError } = await withTimeout(
              supabase.from('projects').select('*').in('id', accessibleProjectIds),
              10000,
              'Projects request timed out.',
            )

            if (projectError) {
              throw projectError
            }

            projectRows = memberProjects ?? []
          }
        }

        const taskQuery = isAdmin
          ? accessibleProjectIds.length === 0
            ? null
            : supabase
                .from('tasks')
                .select('id, title, description, assigned_to, project_id, status, due_date')
                .in('project_id', accessibleProjectIds)
          : supabase
              .from('tasks')
              .select('id, title, description, assigned_to, project_id, status, due_date')
              .eq('assigned_to', user.id)

        const { data: taskRows, error: taskError } = taskQuery
          ? await withTimeout(taskQuery, 10000, 'Tasks request timed out.')
          : { data: [], error: null }

        if (taskError) {
          throw taskError
        }

        const memberIds = [...new Set((taskRows ?? []).map((task) => task.assigned_to).filter(Boolean))]
        const { data: memberRows, error: memberError } = memberIds.length
          ? await supabase.from('users').select('id, email, full_name, role').in('id', memberIds)
          : { data: [], error: null }

        if (memberError) {
          throw memberError
        }

        if (!cancelled) {
          setProjects(projectRows)
          setTasks(taskRows ?? [])
          setMembers(memberRows ?? [])
        }
      } catch (error) {
        if (!cancelled) {
          setProjects([])
          setTasks([])
          setMembers([])
          setErrorMessage(error.message || 'Unable to load dashboard data.')
        }

        toast({
          title: 'Dashboard load failed',
          description: error.message || 'Unable to load dashboard data.',
          type: 'error',
        })
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [profile?.role, toast, user?.id])

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'done').length
    const pending = tasks.filter((task) => task.status !== 'done').length
    const overdue = tasks.filter(isTaskOverdue).length
    return { completed, overdue, pending, total: tasks.length }
  }, [tasks])

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return projects
    }

    return projects.filter((project) =>
      [project.title, project.description].join(' ').toLowerCase().includes(query),
    )
  }, [projects, search])

  const urgentTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.status !== 'done')
      .sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
      .slice(0, 4)
  }, [tasks])

  const commentsPreview = useMemo(() => {
    return tasks.slice(0, 4).map((task, index) => ({
      id: task.id,
      message: task.description || 'No description added yet.',
      owner:
        members.find((member) => member.id === task.assigned_to)?.full_name ||
        members.find((member) => member.id === task.assigned_to)?.email ||
        'Unassigned',
      title: task.title,
      tone: ['bg-orange-100', 'bg-sky-100', 'bg-emerald-100', 'bg-violet-100'][index % 4],
    }))
  }, [members, tasks])

  if (loading) {
    return <LoadingScreen label="Loading dashboard" />
  }

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="My workspace"
          title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'there'}`}
          description="Your active work, projects, and teammates in one clear view."
        />

        {errorMessage ? (
          <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">Current focus</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {urgentTasks[0]?.title || 'No urgent tasks right now'}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  {urgentTasks[0]?.description || 'When a task is assigned with a due date, it will appear here first.'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-3xl bg-slate-50 p-2">
                <div className="rounded-2xl bg-white px-4 py-3 text-center">
                  <p className="text-xl font-semibold text-slate-950">{stats.total}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Total</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-center">
                  <p className="text-xl font-semibold text-teal-700">{stats.completed}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Done</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-center">
                  <p className="text-xl font-semibold text-sky-700">{stats.pending}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Open</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {urgentTasks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  You are clear for now.
                </div>
              ) : (
                urgentTasks.map((task) => (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 px-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(task.due_date)}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">Team pulse</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">{projects.length} visible project{projects.length === 1 ? '' : 's'}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {members.length > 0
                ? `${members.length} teammate${members.length === 1 ? '' : 's'} connected through your assigned work.`
                : 'Teammates will appear when tasks are assigned.'}
            </p>
            <div className="mt-5 flex -space-x-3">
              {members.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-slate-950 text-xs font-semibold text-white shadow-sm"
                  title={member.full_name || member.email}
                >
                  {(member.full_name || member.email || '?').slice(0, 2).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">My projects</h3>
              <p className="mt-1 text-sm text-slate-500">Projects where your assigned work belongs.</p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects"
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-950 transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No projects match this search.
              </div>
            ) : (
              filteredProjects.slice(0, 6).map((project) => {
                const state = getProjectStateMeta(project)
                return (
                  <div key={project.id} className="rounded-3xl border border-slate-200 p-4 transition hover:border-teal-200 hover:bg-teal-50/50">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="truncate font-semibold text-slate-950">{project.title}</h4>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${state.badge}`}>
                        {state.label}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">{project.description || 'No description provided.'}</p>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {selectedMember ? <ProfileModal key={selectedMember.id} onClose={() => setSelectedMember(null)} userProfile={selectedMember} /> : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace overview"
        title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'there'}`}
        description="Here is your agenda for today across projects, members, and active task streams."
      />

      {errorMessage ? (
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard accent="bg-slate-950 text-white" hint="Visible tasks" icon={BriefcaseBusiness} label="Total tasks" value={stats.total} />
        <StatCard accent="bg-teal-100 text-teal-700" hint="Delivered work" icon={CheckCircle2} label="Completed" value={stats.completed} />
        <StatCard accent="bg-sky-100 text-sky-700" hint="Open or in progress" icon={Clock3} label="Pending" value={stats.pending} />
        <StatCard accent="bg-rose-100 text-rose-700" hint="Need attention" icon={AlertTriangle} label="Overdue" value={stats.overdue} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Project workspace directory</h3>
                <p className="mt-1 text-sm text-slate-500">Search and scan visible projects from your current portfolio.</p>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search projects"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-950 transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredProjects.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                  No projects match this search.
                </div>
              ) : (
                filteredProjects.slice(0, 4).map((project) => {
                  const state = getProjectStateMeta(project)
                  return (
                    <div key={project.id} className="rounded-[1.5rem] border border-slate-200 p-5 transition hover:border-teal-200 hover:bg-teal-50/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-950">{project.title}</h4>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${state.badge}`}>
                          {state.label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">{project.description || 'No description provided.'}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
              <h3 className="text-lg font-semibold text-slate-950">Urgent tasks</h3>
              <div className="mt-5 space-y-3">
                {urgentTasks.length === 0 ? (
                  <p className="text-sm text-slate-500">No urgent tasks at the moment.</p>
                ) : (
                  urgentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/50">
                      <div>
                        <p className="font-medium text-slate-950">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(task.due_date)}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
                  <MessageSquareMore className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">New comments</h3>
                  <p className="mt-1 text-sm text-slate-500">Recent task notes and short updates.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {commentsPreview.length === 0 ? (
                  <p className="text-sm text-slate-500">No comments to show yet.</p>
                ) : (
                  commentsPreview.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 p-4 transition hover:border-teal-200 hover:bg-teal-50/50">
                      <div className={`mt-1 h-10 w-10 rounded-2xl ${item.tone}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">{item.owner}</p>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.title}</p>
                        <p className="mt-2 truncate text-sm text-slate-500">{item.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <MemberDirectory members={members} onSelectMember={setSelectedMember} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Today at a glance</h3>
            <p className="mt-1 text-sm text-slate-500">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
        </div>
      </section>

      {selectedMember ? <ProfileModal key={selectedMember.id} onClose={() => setSelectedMember(null)} userProfile={selectedMember} /> : null}
    </div>
  )
}
