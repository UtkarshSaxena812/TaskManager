import { LoaderCircle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmModal({
  confirmLabel = 'Confirm',
  description,
  loading = false,
  onClose,
  onConfirm,
  title,
  tone = 'danger',
}) {
  const buttonClass =
    tone === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-700'
      : 'bg-slate-950 text-white hover:bg-slate-800'

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
