import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { supabase } from '../lib/supabaseClient'
import { useAuthForm } from '../hooks/useAuthForm'
import { useToast } from '../hooks/useToast'

function validate(values) {
  const errors = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!values.password.trim()) {
    errors.password = 'Password is required.'
  }

  return errors
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const { errors, setErrors, updateValue, values } = useAuthForm({
    email: '',
    password: '',
  })

  const redirectTo = location.state?.from || '/'
  const audience = searchParams.get('audience') === 'admin' ? 'admin' : 'member'
  const isAdminLogin = audience === 'admin'
  const verified = searchParams.get('verified') === '1'
  const reset = searchParams.get('reset') === '1'

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validate(values)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)
    setAuthError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    })

    if (error) {
      setLoading(false)
      setAuthError(error.message)
      toast({
        title: 'Login failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      await supabase.auth.signOut()
      setLoading(false)
      setAuthError(userError?.message || 'Unable to validate account role.')
      toast({
        title: 'Login blocked',
        description: userError?.message || 'Unable to validate account role.',
        type: 'error',
      })
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile?.role) {
      await supabase.auth.signOut()
      setLoading(false)
      setAuthError(profileError?.message || 'Account role is missing. Contact support.')
      toast({
        title: 'Login blocked',
        description: profileError?.message || 'Account role is missing. Contact support.',
        type: 'error',
      })
      return
    }

    const expectedRole = isAdminLogin ? 'admin' : 'member'

    if (profile.role !== expectedRole) {
      await supabase.auth.signOut()
      setLoading(false)
      setAuthError(
        isAdminLogin
          ? 'This account is not allowed on the admin login page.'
          : 'This account is not allowed on the member login page.',
      )
      toast({
        title: 'Wrong login portal',
        description:
          profile.role === 'admin'
            ? 'Use the admin login page for this account.'
            : 'Use the member login page for this account.',
        type: 'error',
      })
      return
    }

    setLoading(false)

    toast({
      title: 'Welcome back',
      description: 'Redirecting to your dashboard.',
      type: 'success',
    })
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthShell
      activeAudience={audience}
      eyebrow={isAdminLogin ? 'Admin Access' : 'Member Access'}
      title={isAdminLogin ? 'Admin sign in' : 'Welcome back'}
      description={
        isAdminLogin
          ? 'Use your backend-issued credentials.'
          : 'Sign in to view your tasks and updates.'
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {verified ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Email verified successfully. You can sign in now.
          </div>
        ) : null}

        {reset ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Password updated. Sign in with your new password.
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => updateValue('email', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="teamlead@company.com"
          />
          {errors.email ? <span className="mt-2 block text-sm text-rose-600">{errors.email}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={values.password}
            onChange={(event) => updateValue('password', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="Enter your password"
          />
          {errors.password ? <span className="mt-2 block text-sm text-rose-600">{errors.password}</span> : null}
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
          {loading ? 'Signing in...' : isAdminLogin ? 'Sign in as admin' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4">
        <Link
          className="text-sm font-medium text-slate-500 transition hover:text-teal-700"
          to="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>

      {isAdminLogin ? (
        <p className="mt-6 text-sm text-slate-500">
          Need member access instead?{' '}
          <Link className="font-medium text-teal-700 transition hover:text-teal-600" to="/login?audience=member">
            Switch to member access
          </Link>
        </p>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>Need a member account?</span>
          <Link className="font-medium text-teal-700 transition hover:text-teal-600" to="/signup">
            Create one
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
