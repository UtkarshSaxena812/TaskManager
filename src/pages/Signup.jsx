import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { supabase } from '../lib/supabaseClient'
import { useAuthForm } from '../hooks/useAuthForm'
import { useToast } from '../hooks/useToast'

function validate(values) {
  const errors = {}

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

export default function Signup() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const { errors, setErrors, updateValue, values } = useAuthForm({
    confirmPassword: '',
    email: '',
    fullName: '',
    password: '',
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validate(values)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)
    setAuthError('')

    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          full_name: values.fullName.trim(),
          role: 'member',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setLoading(false)
      setAuthError(error.message)
      toast({
        title: 'Signup failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    if (data.user) {
      await supabase.from('users').upsert(
        {
          email: data.user.email,
          full_name: values.fullName.trim(),
          id: data.user.id,
          role: 'member',
        },
        { onConflict: 'id' },
      )
    }

    setLoading(false)
    toast({
      title: 'Account created',
      description: data.session
        ? 'You are now signed in.'
        : 'Verify your email to activate this member account.',
      type: 'success',
    })

    navigate(
      data.session
        ? '/'
        : `/verify-email?email=${encodeURIComponent(values.email.trim())}`,
      { replace: true },
    )
  }

  return (
    <AuthShell
      activeAudience="member"
      eyebrow="Create Account"
      title="Create a member account"
      description="Public signup is available only for members. Admin credentials should be provisioned from the backend."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Full name</span>
          <input
            type="text"
            value={values.fullName}
            onChange={(event) => updateValue('fullName', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="Nishant Bhardwaj"
          />
          {errors.fullName ? <span className="mt-2 block text-sm text-rose-600">{errors.fullName}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => updateValue('email', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="designer@company.com"
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
            placeholder="Minimum 6 characters"
          />
          {errors.password ? <span className="mt-2 block text-sm text-rose-600">{errors.password}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Confirm password</span>
          <input
            type="password"
            value={values.confirmPassword}
            onChange={(event) => updateValue('confirmPassword', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="Repeat your password"
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Already have a member account?{' '}
        <Link className="font-medium text-teal-700 transition hover:text-teal-600" to="/login?audience=member">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
