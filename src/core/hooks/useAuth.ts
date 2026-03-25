// ============================================================================
// React Hooks - Authentication
// Easy-to-use hooks for authentication state and operations
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth.api'
import type { Session, UserProfile, UserSettings } from '../types/auth'

// ============================================================================
// useAuth Hook
// ============================================================================

export interface UseAuthReturn {
  // State
  session: Session | null
  profile: UserProfile | null
  settings: UserSettings | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl' | 'syncEnabled'>>) => Promise<{ success: boolean; error?: string }>
  updateSettings: (updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<{ success: boolean; error?: string }>
  refresh: () => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const [sessionData, profileData, settingsData] = await Promise.all([
        authApi.getSession(),
        authApi.getProfile(),
        authApi.getSettings()
      ])

      setSession(sessionData)
      setProfile(profileData)
      setSettings(settingsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh auth state')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    // Subscribe to auth changes
    const { data } = authApi.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession)
        refresh()
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        setSettings(null)
      }
    })

    return () => {
      data?.subscription.unsubscribe()
    }
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    const result = await authApi.signIn(email, password)
    if (result.success) {
      await refresh()
    } else {
      setError(result.error || 'Sign in failed')
      setIsLoading(false)
    }
    return result
  }, [refresh])

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setIsLoading(true)
    const result = await authApi.signUp(email, password, displayName)
    setIsLoading(false)
    if (result.error && !result.needsConfirmation) {
      setError(result.error)
    }
    return result
  }, [])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    setIsLoading(true)
    const result = await authApi.signInWithOAuth(provider)
    if (!result.success) {
      setError(result.error || 'OAuth sign in failed')
      setIsLoading(false)
    }
    return result
  }, [])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    await authApi.signOut()
    setSession(null)
    setProfile(null)
    setSettings(null)
    setIsLoading(false)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    return authApi.resetPassword(email)
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    return authApi.updatePassword(newPassword)
  }, [])

  const updateProfile = useCallback(async (
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl' | 'syncEnabled'>>
  ) => {
    const result = await authApi.updateProfile(updates)
    if (result.success) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }
    return result
  }, [])

  const updateSettings = useCallback(async (
    updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>
  ) => {
    const result = await authApi.updateSettings(updates)
    if (result.success) {
      setSettings(prev => prev ? { ...prev, ...updates } : null)
    }
    return result
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    session,
    profile,
    settings,
    isLoading,
    isAuthenticated: session !== null,
    error,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    updateSettings,
    refresh,
    clearError
  }
}

// ============================================================================
// useRequireAuth Hook
// ============================================================================

export interface UseRequireAuthOptions {
  redirectTo?: string
}

export function useRequireAuth(options: UseRequireAuthOptions = {}): UseAuthReturn {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Could integrate with router here
      if (options.redirectTo) {
        window.location.href = options.redirectTo
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, options.redirectTo])

  return auth
}
