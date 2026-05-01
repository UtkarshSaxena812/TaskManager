/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const toastStyles = {
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-400',
    shellClass: 'border-rose-500/30 bg-slate-950 text-white',
  },
  info: {
    icon: Info,
    iconClass: 'text-sky-300',
    shellClass: 'border-sky-500/30 bg-slate-950 text-white',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-300',
    shellClass: 'border-emerald-500/30 bg-slate-950 text-white',
  },
}

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    ({ title, description, type = 'info' }) => {
      const fingerprint = `${type}:${title}:${description ?? ''}`
      const id = crypto.randomUUID()

      setToasts((current) => {
        const alreadyVisible = current.some(
          (toast) =>
            `${toast.type}:${toast.title}:${toast.description ?? ''}` === fingerprint,
        )

        if (alreadyVisible) {
          return current
        }

        return [...current, { description, id, title, type }]
      })

      window.setTimeout(() => {
        dismissToast(id)
      }, 3500)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({
      dismissToast,
      toast: pushToast,
    }),
    [dismissToast, pushToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const config = toastStyles[toast.type] ?? toastStyles.info
          const Icon = config.icon

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur ${config.shellClass}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-white/10 p-2">
                  <Icon className={`h-4 w-4 ${config.iconClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm text-white/70">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
