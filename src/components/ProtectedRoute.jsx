import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children }) {
  const { authError, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen label="Restoring your workspace" />
  }

  if (!user) {
    if (authError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-rose-200 bg-white/90 p-8 shadow-sm">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold text-slate-950">Unable to restore your workspace</p>
            <p className="mt-2 text-sm text-slate-500">{authError}</p>
            <a
              className="mt-5 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/onboarding"
            >
              Go to overview
            </a>
          </div>
        </div>
      )
    }

    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />
  }

  return children
}
