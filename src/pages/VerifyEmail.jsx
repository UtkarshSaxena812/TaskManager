import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../hooks/useToast'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const { toast } = useToast()
  const [sending, setSending] = useState(false)

  const handleResend = async () => {
    if (!email) {
      return
    }

    setSending(true)
    const { error } = await supabase.auth.resend({
      email,
      type: 'signup',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setSending(false)

    if (error) {
      toast({
        title: 'Verification resend failed',
        description: error.message,
        type: 'error',
      })
      return
    }

    toast({
      title: 'Verification email sent',
      description: 'Check your inbox for the confirmation link.',
      type: 'success',
    })
  }

  return (
    <AuthShell
      activeAudience="member"
      eyebrow="Verify Email"
      title="Confirm your email address"
      description="Open the verification email from Supabase to activate the account. Once verified, you can sign in as a member."
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-700">
          Verification link sent to <span className="font-semibold">{email || 'your email'}</span>.
        </div>

        <button
          type="button"
          disabled={sending || !email}
          onClick={handleResend}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? 'Resending...' : 'Resend verification email'}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>Already verified?</span>
        <Link className="font-medium text-teal-700 transition hover:text-teal-600" to="/login?audience=member">
          Go to sign in
        </Link>
      </div>
    </AuthShell>
  )
}
