import { useState } from 'react'
import { LoaderCircle, Mail, PencilLine, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabaseClient'
import Modal from './Modal'
import UserAvatar from './UserAvatar'

export default function ProfileModal({ onClose, userProfile }) {
  const { profile, refreshProfile, user } = useAuth()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState(userProfile?.full_name || '')

  const isCurrentUser = userProfile?.id === user?.id

  const handleSave = async (event) => {
    event.preventDefault()

    if (!isCurrentUser) {
      return
    }

    setSaving(true)

    const nextName = fullName.trim() || null
    const { error } = await supabase
      .from('users')
      .update({ full_name: nextName })
      .eq('id', user.id)

    if (!error) {
      await supabase.auth.updateUser({
        data: {
          full_name: nextName,
        },
      })
    }

    setSaving(false)

    if (error) {
      toast({
        title: 'Profile update failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    await refreshProfile(user)
    setEditing(false)
    toast({
      title: 'Profile updated',
      description: 'Your profile information has been saved.',
      type: 'success',
    })
  }

  return (
    <Modal
      title={isCurrentUser ? 'My profile' : 'Team member profile'}
      description={isCurrentUser ? 'View and update your account details.' : 'Directory profile visible to the team.'}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-[1.5rem] bg-slate-50 p-4">
          <UserAvatar user={userProfile} size="xl" />
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold text-slate-950">
              {userProfile?.full_name || userProfile?.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                {userProfile?.email}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
                {userProfile?.role === 'admin' ? (
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                ) : (
                  <UserRound className="h-4 w-4 text-sky-500" />
                )}
                {userProfile?.role}
              </span>
            </div>
          </div>
        </div>

        {isCurrentUser ? (
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                Profile details
              </p>
              <button
                type="button"
                onClick={() => setEditing((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <PencilLine className="h-4 w-4" />
                {editing ? 'Cancel edit' : 'Edit profile'}
              </button>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input
                type="text"
                disabled={!editing}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 disabled:bg-slate-100"
                placeholder="Your full name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
              />
            </label>

            {editing ? (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Save profile
                </button>
              </div>
            ) : null}
          </form>
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            This profile is visible in your team directory. Members can edit only their own profile.
          </div>
        )}
      </div>
    </Modal>
  )
}
