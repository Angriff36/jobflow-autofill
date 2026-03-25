// ============================================================================
// Sync API - Cloud Synchronization
// Handles syncing local data with Supabase cloud storage
// ============================================================================

import { syncQueueRepository, syncStatusRepository, applicationRepository } from '../storage/db'
import { supabase } from '../storage/supabase'
import { authApi } from './auth.api'
import type { SyncStatus, SyncResult, SyncError } from '../types/auth'

// ============================================================================
// Sync API
// ============================================================================

export const syncApi = {
  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    return syncStatusRepository.get()
  },

  /**
   * Check if sync is enabled
   */
  async isEnabled(): Promise<boolean> {
    const status = await this.getStatus()
    const isAuthenticated = await authApi.isAuthenticated()
    return status.syncEnabled && isAuthenticated
  },

  /**
   * Enable or disable sync
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await syncStatusRepository.setSyncEnabled(enabled)
    
    // Update profile if authenticated
    if (await authApi.isAuthenticated()) {
      const { authService } = await import('../storage/supabase')
      await authService.updateProfile({ syncEnabled: enabled })
    }
  },

  // ---------------------------------------------------------------------------
  // Sync Operations
  // ---------------------------------------------------------------------------

  /**
   * Perform a full sync
   */
  async sync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      syncedAt: new Date(),
      applicationsSynced: 0,
      profilesSynced: 0,
      errors: []
    }

    // Check if sync is possible
    const isAuthenticated = await authApi.isAuthenticated()
    if (!isAuthenticated) {
      result.errors.push({ entity: 'auth', entityId: '', error: 'Not authenticated' })
      return result
    }

    // Mark sync as in progress
    await syncStatusRepository.setSyncInProgress(true)

    try {
      // Sync applications
      const appResult = await this.syncApplications()
      result.applicationsSynced = appResult.synced
      result.errors.push(...appResult.errors)

      // Process sync queue
      const queueResult = await this.processQueue()
      result.errors.push(...queueResult.errors)

      // Mark success if no critical errors
      result.success = result.errors.filter(e => 
        !e.error.includes('Not found') && !e.error.includes('already synced')
      ).length === 0

      // Update sync status
      await syncStatusRepository.recordSync(result.success)

    } catch (error) {
      result.errors.push({ 
        entity: 'sync', 
        entityId: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      await syncStatusRepository.recordSync(false, result.errors[0]?.error)
    } finally {
      await syncStatusRepository.setSyncInProgress(false)
    }

    return result
  },

  /**
   * Sync all local applications to cloud
   */
  async syncApplications(): Promise<{ synced: number; errors: SyncError[] }> {
    const errors: SyncError[] = []
    let synced = 0

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { synced: 0, errors: [{ entity: 'auth', entityId: '', error: 'Not authenticated' }] }
    }

    const localApps = await applicationRepository.getAll()

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
          errors.push({ 
            entity: 'application', 
            entityId: app.id, 
            error: error.message 
          })
        } else {
          synced++
        }
      } catch (err) {
        errors.push({ 
          entity: 'application', 
          entityId: app.id, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        })
      }
    }

    return { synced, errors }
  },

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<{ processed: number; errors: SyncError[] }> {
    const errors: SyncError[] = []
    let processed = 0

    const queue = await syncQueueRepository.getAll()

    for (const item of queue) {
      try {
        const success = await this.processQueueItem(item)
        if (success) {
          await syncQueueRepository.remove(item.id!)
          processed++
        }
      } catch (err) {
        await syncQueueRepository.incrementRetry(
          item.id!, 
          err instanceof Error ? err.message : 'Unknown error'
        )
        errors.push({
          entity: item.entityType,
          entityId: item.entityId,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return { processed, errors }
  },

  /**
   * Process a single sync queue item
   */
  async processQueueItem(item: {
    id?: number
    entityType: string
    entityId: string
    action: string
    payload: Record<string, unknown>
    retryCount: number
  }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Skip if too many retries
    if (item.retryCount >= 5) {
      console.warn(`Skipping queue item ${item.id}: too many retries`)
      return true // Remove from queue
    }

    switch (item.entityType) {
      case 'application':
        return this.syncApplicationItem(user.id, item)
      
      case 'notification':
        return this.syncNotificationItem(user.id, item)
      
      default:
        console.warn(`Unknown entity type: ${item.entityType}`)
        return true // Remove unknown items
    }
  },

  /**
   * Sync an application queue item
   */
  async syncApplicationItem(
    userId: string, 
    item: { entityId: string; action: string; payload: Record<string, unknown> }
  ): Promise<boolean> {
    if (item.action === 'delete') {
      const { error } = await supabase
        .from('synced_applications')
        .delete()
        .eq('user_id', userId)
        .eq('local_id', item.entityId)

      return !error
    }

    const app = item.payload as {
      id: string
      company: string
      position: string
      source: string
      sourceUrl?: string
      appliedDate: string
      status: string
      stage: string
      followUpDate?: string
      notes?: string
      salary?: { amount: number; currency: string; frequency: string }
    }

    const { error } = await supabase
      .from('synced_applications')
      .upsert({
        user_id: userId,
        local_id: item.entityId,
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

    return !error
  },

  /**
   * Sync a notification queue item
   */
  async syncNotificationItem(
    userId: string,
    item: { entityId: string; action: string; payload: Record<string, unknown> }
  ): Promise<boolean> {
    if (item.action === 'delete') {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('id', item.entityId)

      return !error
    }

    const notification = item.payload as {
      type: string
      priority: string
      title: string
      message: string
      entityType?: string
      entityId?: string
      actionUrl?: string
      actionLabel?: string
      scheduledFor?: string
    }

    const { error } = await supabase
      .from('notifications')
      .upsert({
        id: item.entityId,
        user_id: userId,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        entity_type: notification.entityType,
        entity_id: notification.entityId,
        action_url: notification.actionUrl,
        action_label: notification.actionLabel,
        scheduled_for: notification.scheduledFor
      })

    return !error
  },

  // ---------------------------------------------------------------------------
  // Pull from Cloud
  // ---------------------------------------------------------------------------

  /**
   * Pull data from cloud to local storage
   */
  async pullFromCloud(): Promise<{ applications: number; notifications: number }> {
    const result = { applications: 0, notifications: 0 }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return result

    // Pull applications
    const { data: cloudApps, error: appsError } = await supabase
      .from('synced_applications')
      .select('*')
      .eq('user_id', user.id)

    if (!appsError && cloudApps) {
      for (const cloudApp of cloudApps) {
        const localApp = await applicationRepository.getById(cloudApp.local_id)
        
        if (!localApp) {
          // Create local copy
          await applicationRepository.create({
            company: cloudApp.company,
            position: cloudApp.position,
            source: cloudApp.source,
            sourceUrl: cloudApp.source_url,
            appliedDate: cloudApp.applied_date,
            status: cloudApp.status,
            stage: cloudApp.stage,
            followUpDate: cloudApp.follow_up_date,
            notes: cloudApp.notes || '',
            contacts: [],
            salary: cloudApp.salary_amount ? {
              amount: cloudApp.salary_amount,
              currency: cloudApp.salary_currency || 'USD',
              frequency: cloudApp.salary_frequency || 'yearly'
            } : undefined
          })
          result.applications++
        }
      }
    }

    return result
  },

  // ---------------------------------------------------------------------------
  // Conflict Resolution
  // ---------------------------------------------------------------------------

  /**
   * Resolve sync conflicts
   * Uses last-write-wins strategy based on updated_at timestamp
   */
  async resolveConflicts(): Promise<number> {
    // This would compare local and cloud timestamps
    // For now, we use last-write-wins in upsert operations
    return 0
  }
}
