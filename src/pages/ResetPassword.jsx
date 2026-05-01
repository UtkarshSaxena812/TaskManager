import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { supabase } from '../lib/supabaseClient'
import { useAuthForm } from '../hooks/useAuthForm'
import { useToast } from '../hooks/useToast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const { errors, setErrors, updateValue, values } = useAuthForm({
    confirmPassword: '',
    password: '',
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!values.password) {
      nextErrors.password = 'Password is required.'
    } else if (values.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)
    setAuthError('')

    const { error } = await supabase.auth.updateUser({ password: values.password })
    setLoading(false)

    if (error) {
      setAuthError(error.message)
      toast({
        title: 'Password update failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    toast({
      title: 'Password updated',
      description: 'Sign in with your new password.',
      type: 'success',
    })
    await supabase.auth.signOut()
    navigate('/login?audience=member&reset=1', { replace: true })
  }

  return (
    <AuthShell
      activeAudience="member"
      eyebrow="Reset Password"
      title="Create a new password"
      description="Use a password with at least 6 characters."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">New password</span>
          <input
            type="password"
            value={values.password}
            onChange={(event) => updateValue('password', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="Minimum 6 characters"
          />
          {errors.password ? <span className="mt-2 block text-sm text-rose-600">{errors.password}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Confirm new password</span>
          <input
            type="password"
            value={values.confirmPassword}
            onChange={(event) => updateValue('confirmPassword', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="Repeat new password"
          />
          {errors.confirmPassword ? (
            <span className="mt-2 block text-sm text-rose-600">{errors.confirmPassword}</span>
          ) : null}
        </label>

        {authError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {authError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Updating password...' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  )
}
