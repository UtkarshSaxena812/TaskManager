import { useState } from 'react'
import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import ProfileModal from './ProfileModal'
import UserAvatar from './UserAvatar'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: CalendarDays, label: 'Calendar', to: '/calendar' },
  { icon: FolderKanban, label: 'Projects', to: '/projects' },
  { adminOnly: true, icon: PieChart, label: 'Reports', to: '/reports' },
  { icon: CheckSquare, label: 'Tasks', to: '/tasks' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || profile?.role === 'admin')

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: 'Logged out',
        description: 'Your session has been cleared.',
        type: 'success',
      })
      navigate('/login')
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: error.message,
        type: 'error',
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.24),_transparent_34%),linear-gradient(135deg,_#020617_0%,_#0f172a_58%,_#111827_100%)]" />
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="mx-auto flex min-h-screen max-w-[1700px]">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-[108px] flex-col border-r border-white/10 bg-white/5 px-4 py-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl xl:w-[112px]',
            'transition-transform duration-300 lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="Team Task Manager"
              className="h-16 w-16 rounded-[1.75rem] object-cover shadow-lg shadow-teal-950/30"
            />
            <button
              type="button"
              className="rounded-2xl border border-white/10 p-2 text-slate-300 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-10 space-y-3">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-2 rounded-3xl px-3 py-4 text-[11px] font-medium transition',
                    isActive
                      ? 'bg-teal-300 text-slate-950 shadow-lg shadow-teal-950/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full flex-col items-center gap-2 rounded-3xl border border-white/10 px-3 py-4 text-[11px] font-medium text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between px-4 pb-4 pt-4 lg:px-10 lg:pt-8">
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-teal-200">Team Task Manager</p>
              <p className="mt-1 text-2xl font-semibold text-white">Workspace</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-3 shadow-sm backdrop-blur lg:flex">
                <div className="h-2.5 w-2.5 rounded-full bg-teal-300" />
                <span className="text-sm text-slate-200">Workspace online</span>
              </div>
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="rounded-full border border-white/20 bg-white/10 p-1 shadow-sm"
              >
                <UserAvatar user={profile} size="md" />
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 pb-6 lg:px-10 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>

      {showProfile ? <ProfileModal key={profile?.id || 'me'} onClose={() => setShowProfile(false)} userProfile={profile} /> : null}
    </div>
  )
}
