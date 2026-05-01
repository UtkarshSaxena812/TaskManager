import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, Pencil, Plus, Trash2 } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import LoadingScreen from '../components/LoadingScreen'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import TaskFormModal from '../components/TaskFormModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabaseClient'
import { formatDate, isTaskOverdue } from '../lib/utils'

const emptyTaskForm = {
  assigned_to: '',
  description: '',
  due_date: '',
  project_id: '',
  status: 'todo',
  title: '',
}

function uniqueById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()]
}

export default function Tasks() {
  const { profile, user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [memberships, setMemberships] = useState([])
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({
    project: 'all',
    status: 'all',
  })
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [taskModalMode, setTaskModalMode] = useState('create')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [deletingTask, setDeletingTask] = useState(false)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    const run = async () => {
      if (!user?.id) {
        return
      }

      setLoading(true)

      let projectRows = []

      if (isAdmin) {
        const { data: createdProjects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('created_by', user.id)

        if (error) {
          toast({
            title: 'Unable to load projects',
            description: error.message,
            type: 'error',
          })
        }

        projectRows = createdProjects ?? []
      } else {
        const { data: memberRows, error: memberError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id)

        if (memberError) {
          toast({
            title: 'Unable to load memberships',
            description: memberError.message,
            type: 'error',
          })
        }

        const projectIds = [...new Set((memberRows ?? []).map((item) => item.project_id))]

        if (projectIds.length > 0) {
          const { data: visibleProjects, error } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds)

          if (error) {
            toast({
              title: 'Unable to load projects',
              description: error.message,
              type: 'error',
            })
          }

          projectRows = visibleProjects ?? []
        }
      }

      const projectIds = projectRows.map((project) => project.id)
      let taskRows = []

      if (isAdmin && projectIds.length > 0) {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, description, assigned_to, project_id, status, due_date')
          .in('project_id', projectIds)

        if (error) {
          toast({
            title: 'Unable to load tasks',
            description: error.message,
            type: 'error',
          })
        }

        taskRows = data ?? []
      }

      if (!isAdmin) {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, description, assigned_to, project_id, status, due_date')
          .eq('assigned_to', user.id)

        if (error) {
          toast({
            title: 'Unable to load tasks',
            description: error.message,
            type: 'error',
          })
        }

        taskRows = data ?? []
      }

      const { data: memberRows } = projectIds.length
        ? await supabase.from('project_members').select('project_id, user_id').in('project_id', projectIds)
        : { data: [] }

      const memberIds = [...new Set((memberRows ?? []).map((item) => item.user_id))]
      const [
        { data: projectUserRows },
        { data: workspaceMemberRows, error: workspaceMembersError },
      ] = await Promise.all([
        memberIds.length
          ? supabase.from('users').select('id, email, full_name, role').in('id', memberIds)
          : { data: [] },
        supabase.from('users').select('id, email, full_name, role').eq('role', 'member'),
      ])

      if (workspaceMembersError) {
        toast({
          title: 'Unable to load workspace members',
          description: workspaceMembersError.message,
          type: 'error',
        })
      }

      setProjects(projectRows)
      setTasks(taskRows)
      setMemberships(memberRows ?? [])
      setUsers(uniqueById([...(projectUserRows ?? []), ...(workspaceMemberRows ?? [])]))
      setLoading(false)
    }

    run()
  }, [isAdmin, toast, user?.id])

  const projectMap = useMemo(() => {
    return projects.reduce((accumulator, current) => {
      accumulator[current.id] = current
      return accumulator
    }, {})
  }, [projects])

  const userMap = useMemo(() => {
    return users.reduce((accumulator, current) => {
      accumulator[current.id] = current
      return accumulator
    }, {})
  }, [users])

  const assignableMembers = useMemo(() => {
    if (!taskForm.project_id) {
      return []
    }

    return users
      .filter((member) => member.role === 'member')
      .sort((first, second) => first.email.localeCompare(second.email))
  }, [taskForm.project_id, users])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false
      }

      if (filters.project !== 'all' && task.project_id !== filters.project) {
        return false
      }

      return true
    })
  }, [filters.project, filters.status, tasks])

  const openCreateTask = () => {
    setTaskModalMode('create')
    setEditingTaskId(null)
    setTaskForm(emptyTaskForm)
    setShowTaskModal(true)
  }

  const openEditTask = (task) => {
    setTaskModalMode('edit')
    setEditingTaskId(task.id)
    setTaskForm({
      assigned_to: task.assigned_to || '',
      description: task.description || '',
      due_date: task.due_date || '',
      project_id: task.project_id,
      status: task.status,
      title: task.title,
    })
    setShowTaskModal(true)
  }

  const handleStatusChange = async (taskId, nextStatus) => {
    const previous = tasks
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)))

    const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', taskId)

    if (error) {
      setTasks(previous)
      toast({
        title: 'Status update failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    toast({
      title: 'Task updated',
      description: 'The status change has been saved.',
      type: 'success',
    })
  }

  const handleTaskSubmit = async (event) => {
    event.preventDefault()

    if (projectMap[taskForm.project_id]?.is_finished) {
      toast({
        title: 'Project finished',
        description: 'Reopen the project before adding or editing tasks inside it.',
        type: 'error',
      })
      return
    }

    setSubmitting(true)

    const payload = {
      assigned_to: taskForm.assigned_to || null,
      description: taskForm.description.trim(),
      due_date: taskForm.due_date || null,
      project_id: taskForm.project_id,
      status: taskForm.status,
      title: taskForm.title.trim(),
    }

    if (payload.assigned_to) {
      const isProjectMember = memberships.some(
        (membership) =>
          membership.project_id === payload.project_id && membership.user_id === payload.assigned_to,
      )

      if (!isProjectMember) {
        const { data: membership, error: membershipError } = await supabase
          .from('project_members')
          .insert({
            project_id: payload.project_id,
            user_id: payload.assigned_to,
          })
          .select('project_id, user_id')
          .single()

        if (membershipError) {
          setSubmitting(false)
          toast({
            title: 'Assignee could not be added to project',
            description: membershipError.message,
            type: 'error',
          })
          return
        }

        setMemberships((current) => [...current, membership])
      }
    }

    if (taskModalMode === 'create') {
      const { data, error } = await supabase
        .from('tasks')
        .insert(payload)
        .select('id, title, description, assigned_to, project_id, status, due_date')
        .single()

      setSubmitting(false)

      if (error) {
        toast({
          title: 'Task creation failed',
          description: error.message,
          type: 'error',
        })
        return
      }

      setTasks((current) => [data, ...current])
      setTaskForm(emptyTaskForm)
      setShowTaskModal(false)
      toast({
        title: 'Task created',
        description: `${data.title} is now tracked.`,
        type: 'success',
      })
      return
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', editingTaskId)
      .select('id, title, description, assigned_to, project_id, status, due_date')
      .single()

    setSubmitting(false)

    if (error) {
      toast({
        title: 'Task update failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    setTasks((current) => current.map((task) => (task.id === data.id ? data : task)))
    setTaskForm(emptyTaskForm)
    setShowTaskModal(false)
    setEditingTaskId(null)
    toast({
      title: 'Task updated',
      description: `${data.title} has been updated.`,
      type: 'success',
    })
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) {
      return
    }

    setDeletingTask(true)
    const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete.id)
    setDeletingTask(false)

    if (error) {
      toast({
        title: 'Task delete failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    setTasks((current) => current.filter((task) => task.id !== taskToDelete.id))
    setTaskToDelete(null)
    toast({
      title: 'Task deleted',
      description: 'The task has been removed.',
      type: 'success',
    })
  }

  if (loading) {
    return <LoadingScreen label="Loading tasks" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tasks"
        title={isAdmin ? 'Assignment control' : 'My assigned tasks'}
        description={
          isAdmin
            ? 'Create, edit, delete, and assign work across your projects.'
            : 'Track the work assigned to you and update progress as it changes.'
        }
        action={
          isAdmin ? (
            <button
              type="button"
              onClick={openCreateTask}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-teal-300"
            >
              <Plus className="h-4 w-4" />
              Create task
            </button>
          ) : null
        }
      />

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-600">Filter by status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              <option value="all">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600">Filter by project</span>
            <select
              value={filters.project}
              onChange={(event) => setFilters((current) => ({ ...current, project: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                  {project.is_finished ? ' (Finished)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="There are no tasks matching the current filters."
          action={
            isAdmin ? (
              <button
                type="button"
                onClick={openCreateTask}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Create a task
              </button>
            ) : null
          }
        />
      ) : (
        <section className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{task.title}</h3>
                    <StatusBadge status={task.status} />
                    {isTaskOverdue(task) ? (
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                        Overdue
                      </span>
                    ) : null}
                    {projectMap[task.project_id]?.is_finished ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        Project finished
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {task.description || 'No description provided.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {projectMap[task.project_id]?.title || 'Unknown project'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Due {formatDate(task.due_date)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {task.assigned_to ? userMap[task.assigned_to]?.email || 'Unknown assignee' : 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={task.status}
                    onChange={(event) => handleStatusChange(task.id, event.target.value)}
                    disabled={!isAdmin && task.assigned_to !== user.id}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>

                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditTask(task)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskToDelete(task)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {showTaskModal ? (
        <TaskFormModal
          form={taskForm}
          members={assignableMembers}
          mode={taskModalMode}
          onChange={(field, value) => {
            setTaskForm((current) => ({
              ...current,
              [field]: value,
              ...(field === 'project_id' ? { assigned_to: '' } : {}),
            }))
          }}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleTaskSubmit}
          projects={projects}
          showProjectField
          submitting={submitting}
        />
      ) : null}

      {taskToDelete ? (
        <ConfirmModal
          title="Delete task"
          description="This task will be removed permanently."
          confirmLabel="Delete task"
          loading={deletingTask}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleDeleteTask}
        />
      ) : null}
    </div>
  )
}
