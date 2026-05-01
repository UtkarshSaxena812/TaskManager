import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabaseClient'

const CALLBACK_TIMEOUT_MS = 12000

function parseHash() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  return new URLSearchParams(hash)
}

function withTimeout(promise, message) {
  let timeoutId

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message))
    }, CALLBACK_TIMEOUT_MS)
  })

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId)
  })
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const resolveCallback = async () => {
      try {
        const hashParams = parseHash()
        const code = searchParams.get('code')
        const next = searchParams.get('next')
        const callbackType = hashParams.get('type') || searchParams.get('type')

        if (code) {
          const { error } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            'Authentication is taking too long. Please request a new link.',
          )

          if (error) {
            toast({
              title: 'Auth callback failed',
              description: error.message,
              type: 'error',
            })
            navigate('/login?audience=member', { replace: true })
            return
          }
        } else {
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')

          if (access_token && refresh_token) {
            const { error } = await withTimeout(
              supabase.auth.setSession({ access_token, refresh_token }),
              'Session restore is taking too long. Please request a new link.',
            )

            if (error) {
              toast({
                title: 'Session restore failed',
                description: error.message,
                type: 'error',
              })
              navigate('/login?audience=member', { replace: true })
              return
            }
          }
        }

        if (callbackType === 'recovery' || next === '/reset-password') {
          navigate('/reset-password', { replace: true })
          return
        }

        toast({
          title: 'Email verified',
          description: 'Your email has been confirmed. Sign in to continue.',
          type: 'success',
        })
        await withTimeout(
          supabase.auth.signOut(),
          'Sign out after verification is taking too long. Continue from login.',
        )
        navigate('/login?audience=member&verified=1', { replace: true })
      } catch (error) {
        toast({
          title: 'Authentication link failed',
          description: error.message || 'Please request a new link and try again.',
          type: 'error',
        })
        navigate('/login?audience=member', { replace: true })
      }
    }

    resolveCallback()
  }, [navigate, searchParams, toast])

  return <LoadingScreen label="Completing authentication" />
}
