/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const AUTH_TIMEOUT_MS = 12000

function withTimeout(promise, message) {
  let timeoutId

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message))
    }, AUTH_TIMEOUT_MS)
  })

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId)
  })
}

export function useAuth() {
  return useContext(AuthContext)
}

async function createUserRecord(user) {
  if (!user?.id || !user?.email) {
    return null
  }

  const fullName = user.user_metadata?.full_name?.trim() || null

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      role: 'member',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)
  const authRequestRef = useRef(0)
  const profileRequestRef = useRef(0)

  const refreshProfile = useCallback(async (authUser) => {
    const requestId = profileRequestRef.current + 1
    profileRequestRef.current = requestId

    if (!authUser?.id) {
      setProfile(null)
      return null
    }

    const { data, error } = await withTimeout(
      supabase
        .from('users')
        .select('id, email, full_name, role')
        .eq('id', authUser.id)
        .maybeSingle(),
      'Profile lookup is taking too long. Check your Supabase connection.',
    )

    if (error) {
      throw error
    }

    if (data) {
      if (profileRequestRef.current === requestId) {
        setProfile(data)
      }
      return data
    }

    const createdProfile = await createUserRecord(authUser)
    if (profileRequestRef.current === requestId) {
      setProfile(createdProfile)
    }
    return createdProfile
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      const authRequestId = authRequestRef.current + 1
      authRequestRef.current = authRequestId

      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          'Session restore is taking too long. Check your Supabase connection.',
        )

        if (error) {
          throw error
        }

        const activeSession = data.session

        if (!mounted) {
          return
        }

        setAuthError('')
        setSession(activeSession)
        setUser(activeSession?.user ?? null)
        setProfile(null)

        if (activeSession?.user) {
          await refreshProfile(activeSession.user)
        }
      } catch (error) {
        if (mounted && authRequestRef.current === authRequestId) {
          setAuthError(error.message || 'Unable to restore your session.')
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted && authRequestRef.current === authRequestId) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const loadProfileAfterAuthChange = async (authUser, authRequestId) => {
      try {
        await refreshProfile(authUser)
      } catch (error) {
        if (mounted && authRequestRef.current === authRequestId) {
          setAuthError(error.message || 'Unable to load your profile.')
          setProfile(null)
        }
      } finally {
        if (mounted && authRequestRef.current === authRequestId) {
          setLoading(false)
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return
      }

      const authRequestId = authRequestRef.current + 1
      authRequestRef.current = authRequestId
      setLoading(true)
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setProfile(null)
      setAuthError('')

      if (nextSession?.user) {
        setTimeout(() => {
          loadProfileAfterAuthChange(nextSession.user, authRequestId)
        }, 0)
      } else {
        profileRequestRef.current += 1
        if (authRequestRef.current === authRequestId) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshProfile])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        authError,
        profile,
        refreshProfile,
        session,
        signOut,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
