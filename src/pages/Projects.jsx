import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Pencil, Plus, Trash2, Users } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import LoadingScreen from '../components/LoadingScreen'
import PageHeader from '../components/PageHeader'
import ProjectFormModal from '../components/ProjectFormModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabaseClient'
import { getProjectStateMeta } from '../lib/utils'

const emptyForm = {
  description: '',
  title: '',
}

export default function Projects() {
  const { profile, user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState([])
  const [memberCounts, setMemberCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectModalMode, setProjectModalMode] = useState('create')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deletingProject, setDeletingProject] = useState(false)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    const run = async () => {
      if (!user?.id) {
        return
      }

      setLoading(true)

      let projectRows = []

      if (isAdmin) {
        const { data, error } = await supabase
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

        projectRows = data ?? []
      } else {
        const { data: memberships, error: membersError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id)

        if (membersError) {
          toast({
            title: 'Unable to load memberships',
            description: membersError.message,
            type: 'error',
          })
        }

        const projectIds = [...new Set((memberships ?? []).map((item) => item.project_id))]

        if (projectIds.length > 0) {
          const { data, error } = await supabase
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

          projectRows = data ?? []
        }
      }

      if (projectRows.length > 0) {
        const { data: members } = await supabase
          .from('project_members')
          .select('project_id, user_id')
          .in('project_id', projectRows.map((project) => project.id))

        const userIds = [...new Set((members ?? []).map((item) => item.user_id))]
        const { data: memberProfiles } = userIds.length
          ? await supabase.from('users').select('id, role').in('id', userIds)
          : { data: [] }
        const memberRoleMap = (memberProfiles ?? []).reduce((accumulator, item) => {
          accumulator[item.id] = item.role
          return accumulator
        }, {})

        const counts = (members ?? []).reduce((accumulator, item) => {
          if (memberRoleMap[item.user_id] !== 'member') {
            return accumulator
          }

          accumulator[item.project_id] = (accumulator[item.project_id] ?? 0) + 1
          return accumulator
        }, {})

        setMemberCounts(counts)
      } else {
        setMemberCounts({})
      }

      setProjects(projectRows)
      setLoading(false)
    }

    run()
  }, [isAdmin, toast, user?.id])

  const projectSummary = useMemo(() => {
    return projects.length === 1 ? '1 visible project' : `${projects.length} visible projects`
  }, [projects.length])

  const openCreateProject = () => {
    setProjectModalMode('create')
    setSelectedProject(null)
    setForm(emptyForm)
    setShowProjectModal(true)
  }

  const openEditProject = (project) => {
    setProjectModalMode('edit')
    setSelectedProject(project)
    setForm({
      description: project.description || '',
      title: project.title || '',
    })
    setShowProjectModal(true)
  }

  const handleProjectSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    if (projectModalMode === 'create') {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          created_by: user.id,
          description: form.description.trim(),
          title: form.title.trim(),
        })
        .select('*')
        .single()

      if (error) {
        setSubmitting(false)
        toast({
          title: 'Project creation failed',
          description: error.message,
          type: 'error',
        })
        return
      }

      setProjects((current) => [data, ...current])
      setMemberCounts((current) => ({ ...current, [data.id]: 0 }))
      setShowProjectModal(false)
      setForm(emptyForm)
      setSubmitting(false)
      toast({
        title: 'Project created',
        description: `${data.title} is now available.`,
        type: 'success',
      })
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        description: form.description.trim(),
        title: form.title.trim(),
      })
      .eq('id', selectedProject.id)
      .select('*')
      .single()

    setSubmitting(false)

    if (error) {
      toast({
        title: 'Project update failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    setProjects((current) => current.map((project) => (project.id === data.id ? data : project)))
    setShowProjectModal(false)
    setSelectedProject(null)
    setForm(emptyForm)
    toast({
      title: 'Project updated',
      description: `${data.title} has been updated.`,
      type: 'success',
    })
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) {
      return
    }

    setDeletingProject(true)

    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectToDelete.id)

    if (tasksError) {
      setDeletingProject(false)
      toast({
        title: 'Project delete failed',
        description: tasksError.message,
        type: 'error',
      })
      return
    }

    const { error: membersError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectToDelete.id)

    if (membersError) {
      setDeletingProject(false)
      toast({
        title: 'Project delete failed',
        description: membersError.message,
        type: 'error',
      })
      return
    }

    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete.id)

    setDeletingProject(false)

    if (projectError) {
      toast({
        title: 'Project delete failed',
        description: projectError.message,
        type: 'error',
      })
      return
    }

    setProjects((current) => current.filter((project) => project.id !== projectToDelete.id))
    setProjectToDelete(null)
    toast({
      title: 'Project deleted',
      description: 'The project and related records were removed.',
      type: 'success',
    })
  }

  if (loading) {
    return <LoadingScreen label="Loading projects" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title="Manage project spaces"
        description="Admins can create, edit, finish, and remove project hubs. Members only see assigned projects."
        action={
          isAdmin ? (
            <button
              type="button"
              onClick={openCreateProject}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-teal-300"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          ) : null
        }
      />

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">{projectSummary}</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects available"
          description="Create your first project as an admin, or wait until you're added to a project team."
          action={
            isAdmin ? (
              <button
                type="button"
                onClick={openCreateProject}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Create project
              </button>
            ) : null
          }
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {projects.map((project) => {
            const state = getProjectStateMeta(project)

            return (
              <div
                key={project.id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-slate-950 p-3 text-white">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${state.badge}`}>
                    {state.label}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{project.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {project.description || 'No description provided.'}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                  <Users className="h-4 w-4" />
                  {memberCounts[project.id] ?? 0} members
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Open project
                  </Link>

                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditProject(project)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(project)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {showProjectModal ? (
        <ProjectFormModal
          form={form}
          mode={projectModalMode}
          onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
          onClose={() => setShowProjectModal(false)}
          onSubmit={handleProjectSubmit}
          submitting={submitting}
        />
      ) : null}

      {projectToDelete ? (
        <ConfirmModal
          title="Delete project"
          description="This will remove the project, its memberships, and all linked tasks."
          confirmLabel="Delete project"
          loading={deletingProject}
          onClose={() => setProjectToDelete(null)}
          onConfirm={handleDeleteProject}
        />
      ) : null}
    </div>
  )
}
