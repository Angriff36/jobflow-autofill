import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { 
  UserProfile, 
  UserSettings, 
  Notification, 
  CreateNotificationInput,
  Session
} from '../types/auth'

// ============================================================================
// Supabase Client Configuration
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ============================================================================
// Auth Service
// ============================================================================

export const authService = {
  // Get current session
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

  // Get current user profile
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

  // Sign up with email
  async signUp(email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    })
    
    return { success: !error, error: error?.message }
  },

  // Sign in with email
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { success: !error, error: error?.message }
  },

  // Sign in with OAuth
  async signInWithOAuth(provider: 'google' | 'github'): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    })
    
    return { success: !error, error: error?.message }
  },

  // Sign out
  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  // Update profile
  async updateProfile(updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl' | 'syncEnabled'>>): Promise<{ success: boolean; error?: string }> {
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

  // Listen for auth changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
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

// ============================================================================
// User Settings Service (Cloud)
// ============================================================================

export const settingsService = {
  async get(): Promise<UserSettings | null> {
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

  async update(updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; error?: string }> {
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
  }
}

// ============================================================================
// Notification Service (Cloud)
// ============================================================================

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return []

    return data.map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      priority: n.priority,
      title: n.title,
      message: n.message,
      entityType: n.entity_type,
      entityId: n.entity_id,
      actionUrl: n.action_url,
      actionLabel: n.action_label,
      scheduledFor: n.scheduled_for ? new Date(n.scheduled_for) : null,
      readAt: n.read_at ? new Date(n.read_at) : null,
      dismissedAt: n.dismissed_at ? new Date(n.dismissed_at) : null,
      emailSentAt: n.email_sent_at ? new Date(n.email_sent_at) : null,
      pushSentAt: n.push_sent_at ? new Date(n.push_sent_at) : null,
      createdAt: new Date(n.created_at),
      updatedAt: new Date(n.updated_at)
    }))
  },

  async getUnread(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })

    if (error) return []

    return data.map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      priority: n.priority,
      title: n.title,
      message: n.message,
      entityType: n.entity_type,
      entityId: n.entity_id,
      actionUrl: n.action_url,
      actionLabel: n.action_label,
      scheduledFor: n.scheduled_for ? new Date(n.scheduled_for) : null,
      readAt: null,
      dismissedAt: n.dismissed_at ? new Date(n.dismissed_at) : null,
      emailSentAt: n.email_sent_at ? new Date(n.email_sent_at) : null,
      pushSentAt: n.push_sent_at ? new Date(n.push_sent_at) : null,
      createdAt: new Date(n.created_at),
      updatedAt: new Date(n.updated_at)
    }))
  },

  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)

    return error ? 0 : (count || 0)
  },

  async create(input: CreateNotificationInput): Promise<Notification | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: input.type,
        priority: input.priority || 'normal',
        title: input.title,
        message: input.message,
        entity_type: input.entityType || null,
        entity_id: input.entityId || null,
        action_url: input.actionUrl || null,
        action_label: input.actionLabel || null,
        scheduled_for: input.scheduledFor?.toISOString() || null
      })
      .select()
      .single()

    if (error) return null

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      priority: data.priority,
      title: data.title,
      message: data.message,
      entityType: data.entity_type,
      entityId: data.entity_id,
      actionUrl: data.action_url,
      actionLabel: data.action_label,
      scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : null,
      readAt: null,
      dismissedAt: null,
      emailSentAt: null,
      pushSentAt: null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  async markRead(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    return !error
  },

  async markAllRead(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)

    return !error
  },

  async dismiss(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', id)

    return !error
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    return !error
  },

  // Subscribe to real-time notifications
  subscribe(callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const n = payload.new as Record<string, unknown>
          callback({
            id: n.id as string,
            userId: n.user_id as string,
            type: n.type as Notification['type'],
            priority: n.priority as Notification['priority'],
            title: n.title as string,
            message: n.message as string,
            entityType: n.entity_type as string | null,
            entityId: n.entity_id as string | null,
            actionUrl: n.action_url as string | null,
            actionLabel: n.action_label as string | null,
            scheduledFor: n.scheduled_for ? new Date(n.scheduled_for as string) : null,
            readAt: null,
            dismissedAt: null,
            emailSentAt: null,
            pushSentAt: null,
            createdAt: new Date(n.created_at as string),
            updatedAt: new Date(n.updated_at as string)
          })
        }
      )
      .subscribe()
  }
}

// ============================================================================
// Sync Service (Offline-First Queue Pattern)
// ============================================================================

import type { SyncQueueItem } from './db'

const MAX_RETRY_COUNT = 5

export const syncService = {
  // Queue a local write for cloud sync
  async queueSync(
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    action: SyncQueueItem['action'],
    payload: Record<string, unknown>
  ): Promise<void> {
    const { syncQueueRepository, syncStatusRepository } = await import('./db')
    await syncQueueRepository.add({ entityType, entityId, action, payload })
    const count = await syncQueueRepository.getCount()
    await syncStatusRepository.update({ pendingChanges: count })
  },

  // Process the entire sync queue
  async processQueue(): Promise<{ synced: number; failed: number; errors: string[] }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { synced: 0, failed: 0, errors: ['Not authenticated'] }

    const { syncQueueRepository, syncStatusRepository } = await import('./db')

    const status = await syncStatusRepository.get()
    if (status.syncInProgress) return { synced: 0, failed: 0, errors: ['Sync already in progress'] }
    if (!status.syncEnabled) return { synced: 0, failed: 0, errors: ['Sync is disabled'] }

    await syncStatusRepository.setSyncInProgress(true)

    const queue = await syncQueueRepository.getAll()
    let synced = 0
    let failed = 0
    const errors: string[] = []

    for (const item of queue) {
      try {
        await this.processQueueItem(item, user.id)
        await syncQueueRepository.remove(item.id!)
        synced++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        failed++
        errors.push(`${item.entityType}/${item.entityId}: ${errorMsg}`)

        if (item.retryCount >= MAX_RETRY_COUNT) {
          await syncQueueRepository.remove(item.id!)
          errors.push(`Dropped ${item.entityType}/${item.entityId} after ${MAX_RETRY_COUNT} retries`)
        } else {
          await syncQueueRepository.incrementRetry(item.id!, errorMsg)
        }
      }
    }

    const remaining = await syncQueueRepository.getCount()
    await syncStatusRepository.update({ pendingChanges: remaining })
    await syncStatusRepository.recordSync(errors.length === 0, errors.join('; ') || undefined)

    return { synced, failed, errors }
  },

  // Process a single queue item
  async processQueueItem(item: SyncQueueItem, userId: string): Promise<void> {
    const tableMap: Record<string, string> = {
      application: 'synced_applications',
      profile: 'profiles',
      settings: 'user_settings',
      notification: 'notifications'
    }
    const table = tableMap[item.entityType]
    if (!table) throw new Error(`Unknown entity type: ${item.entityType}`)

    if (item.action === 'create' || item.action === 'update') {
      const payload: Record<string, unknown> = { ...item.payload, user_id: userId, updated_at: new Date().toISOString() }

      if (item.entityType === 'application') {
        payload.local_id = item.entityId
        const { error } = await supabase
          .from(table)
          .upsert(payload, { onConflict: 'user_id,local_id' })
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from(table).upsert(payload)
        if (error) throw new Error(error.message)
      }
    } else if (item.action === 'delete') {
      if (item.entityType === 'application') {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId)
          .eq('local_id', item.entityId)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', item.entityId)
        if (error) throw new Error(error.message)
      }
    }
  },

  // Full sync of all local applications to cloud
  async syncApplications(): Promise<{ synced: number; errors: string[] }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { synced: 0, errors: ['Not authenticated'] }

    const errors: string[] = []
    let synced = 0

    const { db } = await import('./db')
    const localApps = await db.applications.toArray()

    for (const app of localApps) {
      try {
        const { error } = await supabase
          .from('synced_applications')
          .upsert({
            user_id: user.id,
            local_id: app.id,
            company: app.company,
            position: app.position,
            source: app.source,
            source_url: app.sourceUrl,
            applied_date: app.appliedDate,
            status: app.status,
            stage: app.stage,
            follow_up_date: app.followUpDate,
            notes: app.notes,
            salary_amount: app.salary?.amount,
            salary_currency: app.salary?.currency,
            salary_frequency: app.salary?.frequency,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,local_id'
          })

        if (error) {
          errors.push(`Failed to sync ${app.company}: ${error.message}`)
        } else {
          synced++
        }
      } catch (err) {
        errors.push(`Error syncing ${app.company}: ${err}`)
      }
    }

    await supabase
      .from('profiles')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', user.id)

    return { synced, errors }
  }
}

// ============================================================================
// Background Sync Manager
// ============================================================================

const SYNC_INTERVAL_MS = 30_000 // 30 seconds

export class BackgroundSyncManager {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private isRunning = false

  async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true

    // Process queue immediately on start
    await this.tick()

    // Then run on interval
    this.intervalId = setInterval(() => this.tick(), SYNC_INTERVAL_MS)

    // Also sync when browser comes back online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.tick())
    }
  }

  stop(): void {
    this.isRunning = false
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.tick())
    }
  }

  private async tick(): Promise<void> {
    if (!navigator.onLine) return

    try {
      await syncService.processQueue()
    } catch {
      // Silently fail - will retry on next tick
    }
  }
}

export const backgroundSync = new BackgroundSyncManager()
