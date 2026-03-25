// ============================================================================
// Auth API - Authentication Operations
// Handles user authentication, sessions, and profile management
// ============================================================================

import { supabase } from '../storage/supabase'
import type { Session, UserProfile, UserSettings } from '../types/auth'

// Auth state change callback type
export type AuthStateCallback = (event: string, session: Session | null) => void

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return null

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at || 0,
      user: {
        id: data.session.user.id,
        email: data.session.user.email || ''
      }
    }
  },

  /**
   * Get the current authenticated user ID
   */
  async getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession()
    return session !== null
  },

  // ---------------------------------------------------------------------------
  // Authentication Methods
  // ---------------------------------------------------------------------------

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Check if email confirmation is required
    const needsConfirmation = !data.session && data.user && !data.user.confirmed_at

    return { 
      success: true, 
      needsConfirmation: needsConfirmation || false,
      error: needsConfirmation ? 'Please check your email to confirm your account' : undefined
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return { success: !error, error: error?.message }
  },

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(
    provider: 'google' | 'github'
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    return { success: !error, error: error?.message }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signOut()
    return { success: !error, error: error?.message }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { success: !error, error: error?.message }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { success: !error, error: error?.message }
  },

  // ---------------------------------------------------------------------------
  // Profile Management
  // ---------------------------------------------------------------------------

  /**
   * Get the current user's profile
   */
  async getProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) return null

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      syncEnabled: data.sync_enabled,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl' | 'syncEnabled'>>
  ): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
        sync_enabled: updates.syncEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    return { success: !error, error: error?.message }
  },

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) return null

    return {
      userId: data.user_id,
      notificationsEnabled: data.notifications_enabled,
      followUpReminderDays: data.follow_up_reminder_days,
      emailNotifications: data.email_notifications,
      pushNotifications: data.push_notifications,
      autoSubmit: data.auto_submit,
      confirmBeforeFill: data.confirm_before_fill,
      theme: data.theme,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  /**
   * Update user settings
   */
  async updateSettings(
    updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

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
      .eq('user_id', user.id)

    return { success: !error, error: error?.message }
  },

  // ---------------------------------------------------------------------------
  // Event Subscription
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: AuthStateCallback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        callback(event, {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at || 0,
          user: {
            id: session.user.id,
            email: session.user.email || ''
          }
        })
      } else {
        callback(event, null)
      }
    })
  }
}
