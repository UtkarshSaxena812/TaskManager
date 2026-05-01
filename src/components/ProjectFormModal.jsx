import { LoaderCircle } from 'lucide-react'
import Modal from './Modal'

export default function ProjectFormModal({
  form,
  mode = 'create',
  onChange,
  onClose,
  onSubmit,
  submitting,
}) {
  const isEdit = mode === 'edit'

  return (
    <Modal
      title={isEdit ? 'Edit project' : 'Create project'}
      description={
        isEdit
          ? 'Update the project name and summary.'
          : 'Set the project name and a short summary so the team has context.'
      }
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            type="text"
            required
            value={form.title}
            onChange={(event) => onChange('title', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="Website redesign"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => onChange('description', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="Scope, goals, milestones..."
          />
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
