import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import LoadingScreen from '../components/LoadingScreen'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import ProjectFormModal from '../components/ProjectFormModal'
import StatusBadge from '../components/StatusBadge'
import TaskFormModal from '../components/TaskFormModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabaseClient'
import { formatDate, getProjectStateMeta, isTaskOverdue } from '../lib/utils'

const emptyTaskForm = {
  assigned_to: '',
  description: '',
  due_date: '',
  project_id: '',
  status: 'todo',
  title: '',
}

const emptyProjectForm = {
  description: '',
  title: '',
}

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [projectSubmitting, setProjectSubmitting] = useState(false)
  const [projectDeleting, setProjectDeleting] = useState(false)
  const [projectFinishing, setProjectFinishing] = useState(false)
  const [taskDeleting, setTaskDeleting] = useState(false)
  const [taskForm, setTaskForm] = useState({ ...emptyTaskForm, project_id: id })
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [memberId, setMemberId] = useState('')
  const [taskModalMode, setTaskModalMode] = useState('create')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [confirmProjectDelete, setConfirmProjectDelete] = useState(false)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    const run = async () => {
      if (!user?.id || !id) {
        return
      }

      setLoading(true)

      const [
        { data: projectData, error: projectError },
        { data: taskData, error: taskError },
        { data: membershipData, error: membershipError },
        { data: userRows, error: usersError },
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('tasks')
          .select('id, title, description, assigned_to, project_id, status, due_date')
          .eq('project_id', id),
        supabase.from('project_members').select('id, project_id, user_id').eq('project_id', id),
        supabase.from('users').select('id, email, full_name, role'),
      ])

      const firstError = projectError || taskError || membershipError || usersError

      if (firstError) {
        toast({
          title: 'Unable to load project',
          description: firstError.message,
          type: 'error',
        })
      }

      setProject(projectData)
      setProjectForm({
        description: projectData?.description || '',
        title: projectData?.title || '',
      })
      setTasks(taskData ?? [])
      setMemberships(membershipData ?? [])
      setUsers(userRows ?? [])
      setLoading(false)
    }

    run()
  }, [id, toast, user?.id])

  const memberMap = useMemo(() => {
    return users.reduce((accumulator, current) => {
      accumulator[current.id] = current
      return accumulator
    }, {})
  }, [users])

  const currentMemberIds = useMemo(() => memberships.map((member) => member.user_id), [memberships])

  const availableMembers = useMemo(() => {
    return users
      .filter((candidate) => candidate.role === 'member' && !currentMemberIds.includes(candidate.id))
      .sort((first, second) => first.email.localeCompare(second.email))
  }, [currentMemberIds, users])

  const projectMembers = useMemo(() => {
    return memberships
      .map((member) => memberMap[member.user_id])
      .filter(Boolean)
      .filter((member) => member.role === 'member')
      .sort((first, second) => first.email.localeCompare(second.email))
  }, [memberMap, memberships])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => statusFilter === 'all' || task.status === statusFilter)
  }, [statusFilter, tasks])

  const canUpdateTask = (task) => {
    if (isAdmin) {
      return true
    }

    return task.assigned_to === user?.id
  }

  const openCreateTask = () => {
    if (project?.is_finished) {
      toast({
        title: 'Project finished',
        description: 'Reopen the project before creating new tasks.',
        type: 'info',
      })
      return
    }

    setTaskModalMode('create')
    setEditingTaskId(null)
    setTaskForm({ ...emptyTaskForm, project_id: id })
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

  const handleTaskStatusChange = async (taskId, nextStatus) => {
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
      description: 'Task status saved successfully.',
      type: 'success',
    })
  }

  const handleTaskSubmit = async (event) => {
    event.preventDefault()
    setTaskSubmitting(true)

    const payload = {
      assigned_to: taskForm.assigned_to || null,
      description: taskForm.description.trim(),
      due_date: taskForm.due_date || null,
      project_id: id,
      status: taskForm.status,
      title: taskForm.title.trim(),
    }

    if (taskModalMode === 'create') {
      const { data, error } = await supabase
        .from('tasks')
        .insert(payload)
        .select('id, title, description, assigned_to, project_id, status, due_date')
        .single()

      setTaskSubmitting(false)

      if (error) {
        toast({
          title: 'Task creation failed',
          description: error.message,
          type: 'error',
        })
        return
      }

      setTasks((current) => [data, ...current])
      setTaskForm({ ...emptyTaskForm, project_id: id })
      setShowTaskModal(false)
      toast({
        title: 'Task created',
        description: `${data.title} was added to this project.`,
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

    setTaskSubmitting(false)

    if (error) {
      toast({
        title: 'Task update failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    setTasks((current) => current.map((task) => (task.id === data.id ? data : task)))
    setShowTaskModal(false)
    setEditingTaskId(null)
    setTaskForm({ ...emptyTaskForm, project_id: id })
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

    setTaskDeleting(true)
    const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete.id)
    setTaskDeleting(false)

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

  const handleAddMember = async (event) => {
    event.preventDefault()

    const selectedUser = users.find((candidate) => candidate.id === memberId)
    if (!selectedUser || selectedUser.role !== 'member') {
      toast({
        title: 'Select a member account',
        description: 'Admins manage projects but are not added as project members.',
        type: 'error',
      })
      return
    }

    setMemberSubmitting(true)

    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: id,
        user_id: memberId,
      })
      .select('id, project_id, user_id')
      .single()

    setMemberSubmitting(false)

    if (error) {
      toast({
        title: 'Member could not be added',
        description: error.message,
        type: 'error',
      })
      return
    }

    setMemberships((current) => [...current, data])
    setMemberId('')
    setShowMemberModal(false)
    toast({
      title: 'Member added',
      description: 'The user can now access this project.',
      type: 'success',
    })
  }

  const handleProjectSubmit = async (event) => {
    event.preventDefault()
    setProjectSubmitting(true)

    const { data, error } = await supabase
      .from('projects')
      .update({
        description: projectForm.description.trim(),
        title: projectForm.title.trim(),
      })
      .eq('id', id)
      .select('*')
      .single()

    setProjectSubmitting(false)

    if (error) {
      toast({
        title: 'Project update failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    setProject(data)
    setShowProjectModal(false)
    toast({
      title: 'Project updated',
      description: `${data.title} has been updated.`,
      type: 'success',
    })
  }

  const handleToggleProjectFinished = async () => {
    if (!project) {
      return
    }

    setProjectFinishing(true)
    const nextFinishedState = !project.is_finished
    const { data, error } = await supabase
      .from('projects')
      .update({
        finished_at: nextFinishedState ? new Date().toISOString() : null,
        is_finished: nextFinishedState,
      })
      .eq('id', id)
      .select('*')
      .single()

    setProjectFinishing(false)

    if (error) {
      toast({
        title: 'Project state update failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    setProject(data)
    toast({
      title: nextFinishedState ? 'Project marked finished' : 'Project reopened',
      description: nextFinishedState
        ? 'No new tasks should be created until the project is reopened.'
        : 'The project is active again.',
      type: 'success',
    })
  }

  const handleDeleteProject = async () => {
    setProjectDeleting(true)

    const { error: tasksError } = await supabase.from('tasks').delete().eq('project_id', id)
    if (tasksError) {
      setProjectDeleting(false)
      toast({
        title: 'Project delete failed',
        description: tasksError.message,
        type: 'error',
      })
      return
    }

    const { error: membersError } = await supabase.from('project_members').delete().eq('project_id', id)
    if (membersError) {
      setProjectDeleting(false)
      toast({
        title: 'Project delete failed',
        description: membersError.message,
        type: 'error',
      })
      return
    }

    const { error: projectError } = await supabase.from('projects').delete().eq('id', id)
    setProjectDeleting(false)

    if (projectError) {
      toast({
        title: 'Project delete failed',
        description: projectError.message,
        type: 'error',
      })
      return
    }

    toast({
      title: 'Project deleted',
      description: 'The project and related records were removed.',
      type: 'success',
    })
    navigate('/projects', { replace: true })
  }

  if (loading) {
    return <LoadingScreen label="Loading project" />
  }

  if (!project) {
    return (
      <EmptyState
        icon={Users}
        title="Project not found"
        description="This project is unavailable or you no longer have access to it."
        action={
          <Link
            to="/projects"
            className="inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Back to projects
          </Link>
        }
      />
    )
  }

  const projectState = getProjectStateMeta(project)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <PageHeader
        eyebrow="Project"
        title={project.title}
        description={project.description || 'No description provided.'}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-2 text-xs font-semibold ${projectState.badge}`}>
              {projectState.label}
            </span>

            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit project
                </button>
                <button
                  type="button"
                  onClick={() => setShowMemberModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5"
                >
                  <UserPlus className="h-4 w-4" />
                  Add member
                </button>
                <button
                  type="button"
                  disabled={projectFinishing}
                  onClick={handleToggleProjectFinished}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {project.is_finished ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {project.is_finished ? 'Reopen project' : 'Mark finished'}
                </button>
                <button
                  type="button"
                  onClick={openCreateTask}
                  className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-teal-300"
                >
                  <Plus className="h-4 w-4" />
                  Add task
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmProjectDelete(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete project
                </button>
              </>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Project members</h3>
              <p className="mt-1 text-sm text-slate-500">{projectMembers.length} users currently assigned.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {projectMembers.length === 0 ? (
              <p className="rounded-3xl bg-slate-50 px-4 py-5 text-sm text-slate-500">No members added yet.</p>
            ) : (
              projectMembers.map((member) => (
                <div key={member.id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{member.full_name || member.email}</p>
                      <p className="mt-1 text-xs text-slate-500">{member.email}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{member.role}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Team member
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Tasks by project</h3>
              <p className="mt-1 text-sm text-slate-500">Admins can edit and delete tasks. Members can update their own status.</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              <option value="all">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="mt-6 space-y-3">
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={Plus}
                title="No matching tasks"
                description="Create a task or change the filter to see more work items."
              />
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold text-slate-950">{task.title}</p>
                        <StatusBadge status={task.status} />
                        {isTaskOverdue(task) ? (
                          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                            Overdue
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {task.description || 'No description provided.'}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          Due {formatDate(task.due_date)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {task.assigned_to ? memberMap[task.assigned_to]?.email || 'Unknown user' : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        disabled={!canUpdateTask(task)}
                        value={task.status}
                        onChange={(event) => handleTaskStatusChange(task.id, event.target.value)}
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
              ))
            )}
          </div>
        </div>
      </section>

      {showTaskModal ? (
        <TaskFormModal
          form={taskForm}
          members={projectMembers}
          mode={taskModalMode}
          onChange={(field, value) => setTaskForm((current) => ({ ...current, [field]: value }))}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleTaskSubmit}
          submitting={taskSubmitting}
        />
      ) : null}

      {showProjectModal ? (
        <ProjectFormModal
          form={projectForm}
          mode="edit"
          onChange={(field, value) => setProjectForm((current) => ({ ...current, [field]: value }))}
          onClose={() => setShowProjectModal(false)}
          onSubmit={handleProjectSubmit}
          submitting={projectSubmitting}
        />
      ) : null}

      {showMemberModal ? (
        <Modal
          title="Add project member"
          description="Grant a user access to this project."
          onClose={() => setShowMemberModal(false)}
        >
          <form className="space-y-4" onSubmit={handleAddMember}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">User</span>
              <select
                required
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              >
                <option value="">Select a user</option>
                {availableMembers.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.full_name ? `${candidate.full_name} (${candidate.email})` : candidate.email}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={memberSubmitting || availableMembers.length === 0}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {memberSubmitting ? 'Adding...' : 'Add member'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {taskToDelete ? (
        <ConfirmModal
          title="Delete task"
          description="This task will be removed from the project permanently."
          confirmLabel="Delete task"
          loading={taskDeleting}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleDeleteTask}
        />
      ) : null}

      {confirmProjectDelete ? (
        <ConfirmModal
          title="Delete project"
          description="This will remove the project, all memberships, and all project tasks."
          confirmLabel="Delete project"
          loading={projectDeleting}
          onClose={() => setConfirmProjectDelete(false)}
          onConfirm={handleDeleteProject}
        />
      ) : null}
    </div>
  )
}
