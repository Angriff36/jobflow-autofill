// ============================================================================
// Auth Context and Provider
// Provides authentication state and methods to the app
// ============================================================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '../../core/storage/supabase'
import type { Session, UserProfile, UserSettings } from '../../core/types/auth'

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
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
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl' | 'syncEnabled'>>) => Promise<void>
  updateSettings: (updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// ============================================================================
// Auth Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load session and profile on mount
  useEffect(() => {
    loadSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadSession()
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setProfile(null)
          setSettings(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSession = async () => {
    setIsLoading(true)
    try {
      const { data: { session: supabaseSession } } = await supabase.auth.getSession()
      
      if (supabaseSession) {
        setSession({
          accessToken: supabaseSession.access_token,
          refreshToken: supabaseSession.refresh_token,
          expiresAt: supabaseSession.expires_at || 0,
          user: {
            id: supabaseSession.user.id,
            email: supabaseSession.user.email || ''
          }
        })

        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseSession.user.id)
          .single()

        if (profileData) {
          setProfile({
            id: profileData.id,
            email: profileData.email,
            displayName: profileData.display_name,
            avatarUrl: profileData.avatar_url,
            syncEnabled: profileData.sync_enabled,
            lastSyncAt: profileData.last_sync_at ? new Date(profileData.last_sync_at) : null,
            createdAt: new Date(profileData.created_at),
            updatedAt: new Date(profileData.updated_at)
          })
        }

        // Load settings
        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', supabaseSession.user.id)
          .single()

        if (settingsData) {
          setSettings({
            userId: settingsData.user_id,
            notificationsEnabled: settingsData.notifications_enabled,
            followUpReminderDays: settingsData.follow_up_reminder_days,
            emailNotifications: settingsData.email_notifications,
            pushNotifications: settingsData.push_notifications,
            autoSubmit: settingsData.auto_submit,
            confirmBeforeFill: settingsData.confirm_before_fill,
            theme: settingsData.theme,
            createdAt: new Date(settingsData.created_at),
            updatedAt: new Date(settingsData.updated_at)
          })
        }
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return { success: false, error: error.message }
    }

    await loadSession()
    return { success: true }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setIsLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
      return { success: false, error: error.message }
    }

    const needsConfirmation = !data.session && data.user && !data.user.confirmed_at
    return { 
      success: true, 
      needsConfirmation: !!needsConfirmation,
      error: needsConfirmation ? 'Please check your email to confirm your account' : undefined
    }
  }, [])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setError(error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  }, [])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setSettings(null)
    setIsLoading(false)
  }, [])

  const updateProfile = useCallback(async (
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl' | 'syncEnabled'>>
  ) => {
    if (!session) return

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
        sync_enabled: updates.syncEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [session])

  const updateSettings = useCallback(async (
    updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!session) return

    const { error } = await supabase
      .from('user_settings')
      .update({
        notifications_enabled: updates.notificationsEnabled,
        follow_up_reminder_days: updates.followUpReminderDays,
        email_notifications: updates.emailNotifications,
        push_notifications: updates.pushNotifications,
        auto_submit: updates.autoSubmit,
        confirm_before_fill: updates.confirmBeforeFill,
        theme: updates.theme,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)

    if (!error) {
      setSettings(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [session])

  const clearError = useCallback(() => setError(null), [])

  const value: AuthContextType = {
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
    updateProfile,
    updateSettings,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// useAuth Hook
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
