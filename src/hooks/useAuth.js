import { useEffect, useState } from 'react'
import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabase'
import {
  clearAuthParamsFromUrl,
  formatAuthError,
  readOAuthErrorFromUrl,
} from '../utils/auth'
import { trackEvent } from '../lib/analytics'
import { OAUTH_PENDING_KEY, SUPABASE_MISSING_MSG } from '../utils/constants'

export function useAuth({ setError, showToast }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    let subscription = null

    const bootAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setAuthLoading(false)
        setError(SUPABASE_MISSING_MSG)
        return
      }

      const oauthError = readOAuthErrorFromUrl()
      if (oauthError) {
        sessionStorage.removeItem(OAUTH_PENDING_KEY)
        setError(formatAuthError(oauthError))
        clearAuthParamsFromUrl()
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!cancelled) {
          setUser(data.session?.user ?? null)
          if (data.session?.user && !oauthError) {
            clearAuthParamsFromUrl()
          }
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setUser(null)
          setError(formatAuthError(err.message || '로그인 상태를 확인하지 못했습니다.'))
        }
      } finally {
        if (!cancelled) setAuthLoading(false)
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (cancelled) return
          setUser(session?.user ?? null)
          setAuthLoading(false)

          if (event === 'SIGNED_IN' && session?.user) {
            clearAuthParamsFromUrl()
          }
        },
      )
      subscription = listener.subscription
    }

    bootAuth()

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [setError])

  const handleGoogleSignIn = async (source = 'unknown') => {
    const loginSource = typeof source === 'string' ? source : 'unknown'
    trackEvent('login_click', { method: 'google', source: loginSource })
    setError('')
    setAuthBusy(true)
    try {
      const client = requireSupabase()
      sessionStorage.setItem(OAUTH_PENDING_KEY, '1')
      const { error: signInError } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          scopes: 'openid email profile',
          queryParams: {
            prompt: 'select_account',
          },
        },
      })
      if (signInError) throw signInError
    } catch (err) {
      console.error(err)
      sessionStorage.removeItem(OAUTH_PENDING_KEY)
      trackEvent('login_fail', { method: 'google', source: loginSource })
      setError(formatAuthError(err.message || 'Google 로그인에 실패했습니다.'))
      setAuthBusy(false)
    }
  }

  const handleSignOut = async () => {
    setError('')
    setAuthBusy(true)
    try {
      const client = requireSupabase()
      sessionStorage.removeItem(OAUTH_PENDING_KEY)
      const { error: signOutError } = await client.auth.signOut()
      if (signOutError) throw signOutError
      trackEvent('logout')
      showToast('로그아웃했어요')
    } catch (err) {
      console.error(err)
      setError(formatAuthError(err.message || '로그아웃에 실패했습니다.'))
    } finally {
      setAuthBusy(false)
    }
  }

  return {
    user,
    authLoading,
    authBusy,
    handleGoogleSignIn,
    handleSignOut,
  }
}
