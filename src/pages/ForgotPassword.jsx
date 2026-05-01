import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { supabase } from '../lib/supabaseClient'
import { useAuthForm } from '../hooks/useAuthForm'
import { useToast } from '../hooks/useToast'

export default function ForgotPassword() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { errors, setErrors, updateValue, values } = useAuthForm({ email: '' })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {}
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)

    if (error) {
      toast({
        title: 'Reset email failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    setSent(true)
    toast({
      title: 'Reset email sent',
      description: 'Check your inbox for the password reset link.',
      type: 'success',
    })
  }

  return (
    <AuthShell
      activeAudience="member"
      eyebrow="Password Recovery"
      title="Reset your password"
      description="We will email a secure password reset link to this account."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {sent ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Reset instructions sent. Open the link from your email to continue.
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => updateValue('email', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="member@company.com"
          />
          {errors.email ? <span className="mt-2 block text-sm text-rose-600">{errors.email}</span> : null}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Back to{' '}
        <Link className="font-medium text-teal-700 transition hover:text-teal-600" to="/login?audience=member">
          member sign in
        </Link>
      </p>
    </AuthShell>
  )
}
