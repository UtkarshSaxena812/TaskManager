import { useEffect, useMemo, useState } from 'react'
import { eachMonthOfInterval, endOfYear, format, startOfYear } from 'date-fns'
import { BarChart3, BriefcaseBusiness, CheckCircle2, Clock3, Users } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import LoadingScreen from '../components/LoadingScreen'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { parseAppDate } from '../lib/utils'

function ProgressBar({ label, value, colorClass }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function Reports() {
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => {
    const run = async () => {
      if (!user?.id) {
        return
      }

      setLoading(true)

      const isAdmin = profile?.role === 'admin'
      let projectRows = []

      if (isAdmin) {
        const { data } = await supabase.from('projects').select('*').eq('created_by', user.id)
        projectRows = data ?? []
      } else {
        const { data } = await supabase.from('project_members').select('project_id').eq('user_id', user.id)
        const projectIds = [...new Set((data ?? []).map((item) => item.project_id))]
        if (projectIds.length > 0) {
          const { data: projectsData } = await supabase.from('projects').select('*').in('id', projectIds)
          projectRows = projectsData ?? []
        }
      }

      const projectIds = projectRows.map((project) => project.id)
      const { data: taskRows } = projectIds.length
        ? await supabase
            .from('tasks')
            .select('id, status, assigned_to, project_id, due_date')
            .in('project_id', projectIds)
        : { data: [] }

      const memberIds = [...new Set((taskRows ?? []).map((task) => task.assigned_to).filter(Boolean))]
      const { data: userRows } = memberIds.length
        ? await supabase.from('users').select('id, email, full_name, role').in('id', memberIds)
        : { data: [] }

      setProjects(projectRows)
      setTasks(taskRows ?? [])
      setMembers(userRows ?? [])
      setLoading(false)
    }

    run()
  }, [profile?.role, user?.id])

  const stats = useMemo(() => {
    const finishedProjects = projects.filter((project) => project.is_finished).length
    const completedTasks = tasks.filter((task) => task.status === 'done').length
    const workHours = tasks.length * 3
    const completion = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
    const finishedRate = projects.length ? Math.round((finishedProjects / projects.length) * 100) : 0

    return {
      completion,
      finishedProjects,
      finishedRate,
      totalMembers: members.length,
      totalProjects: projects.length,
      totalWorkHours: workHours,
    }
  }, [members.length, projects, tasks])

  const monthlyCapacity = useMemo(() => {
    const months = eachMonthOfInterval({
      end: endOfYear(new Date()),
      start: startOfYear(new Date()),
    })

    return months.map((monthDate) => {
      const count = tasks.filter((task) => {
        if (!task.due_date) {
          return false
        }

        const dueDate = parseAppDate(task.due_date)
        return (
          dueDate.getFullYear() === monthDate.getFullYear() &&
          dueDate.getMonth() === monthDate.getMonth()
        )
      }).length

      return {
        count,
        label: format(monthDate, 'MMM'),
      }
    })
  }, [tasks])

  const maxMonthlyCount = useMemo(
    () => Math.max(...monthlyCapacity.map((item) => item.count), 0),
    [monthlyCapacity],
  )

  if (loading) {
    return <LoadingScreen label="Loading reports" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Workspace reports"
        description="A simple view of delivery, capacity, and project health."
      />

      <section className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">Executive summary</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {stats.completion}% completion
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
              {stats.totalProjects} project{stats.totalProjects === 1 ? '' : 's'}, {tasks.length} task{tasks.length === 1 ? '' : 's'}, and {stats.totalMembers} active teammate{stats.totalMembers === 1 ? '' : 's'} in this workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { icon: BriefcaseBusiness, label: 'Projects', value: stats.totalProjects, tone: 'bg-teal-100 text-teal-700' },
              { icon: Users, label: 'Team', value: stats.totalMembers, tone: 'bg-sky-100 text-sky-700' },
              { icon: Clock3, label: 'Hours', value: `${stats.totalWorkHours}h`, tone: 'bg-slate-100 text-slate-700' },
              { icon: CheckCircle2, label: 'Done', value: `${stats.completion}%`, tone: 'bg-emerald-100 text-emerald-700' },
            ].map((item) => {
              const Icon = item.icon

              return (
                <div key={item.label} className="rounded-3xl bg-slate-50 p-4">
                  <div className={`inline-flex rounded-2xl p-3 ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
          <h3 className="text-lg font-semibold text-slate-950">Project progress</h3>
          <p className="mt-1 text-sm text-slate-500">Snapshot of current delivery health.</p>
          <div className="mt-6 space-y-5">
            <ProgressBar label="Task completion" value={stats.completion} colorClass="bg-teal-400" />
            <ProgressBar label="Project completion" value={stats.finishedRate} colorClass="bg-sky-400" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl shadow-slate-950/10">
          <h3 className="text-lg font-semibold text-slate-950">Monthly capacity</h3>
          <p className="mt-1 text-sm text-slate-500">Monthly task volume based on real due dates.</p>
          {tasks.filter((task) => task.due_date).length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={BarChart3}
                title="No dated task data"
                description="Reports will render here once tasks with due dates are available."
              />
            </div>
          ) : (
            <div className="mt-6 flex h-52 items-end gap-3 rounded-3xl bg-slate-50 p-4">
              {monthlyCapacity.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#5eead4_0%,#38bdf8_100%)]"
                    style={{
                      height: `${Math.max(18, maxMonthlyCount ? (item.count / maxMonthlyCount) * 150 : 18)}px`,
                    }}
                  />
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span className="text-[11px] font-medium text-slate-500">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
