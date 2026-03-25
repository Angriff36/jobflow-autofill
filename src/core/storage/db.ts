import Dexie, { Table } from 'dexie'
import type { 
  UserProfile, 
  JobApplication, 
  FormSchema, 
  AppSettings,
  Notification,
  SyncStatus
} from '../types'

// ============================================================================
// IndexedDB Schema (Local-First Storage)
// ============================================================================

export class JobFlowDatabase extends Dexie {
  // Core tables
  profiles!: Table<UserProfile>
  applications!: Table<JobApplication>
  formSchemas!: Table<FormSchema>
  settings!: Table<AppSettings & { id: string }>
  
  // New tables for auth & notifications
  notifications!: Table<Notification>
  syncQueue!: Table<SyncQueueItem>
  syncStatus!: Table<SyncStatus & { id: string }>

  constructor() {
    super('JobFlowDB')
    
    // Version 2 adds notifications and sync tables
    this.version(2).stores({
      profiles: 'id, createdAt, updatedAt',
      applications: 'id, company, status, stage, appliedDate, createdAt, followUpDate',
      formSchemas: 'id, domain, urlPattern',
      settings: 'id',
      // New tables
      notifications: 'id, userId, type, priority, scheduledFor, readAt, createdAt, [userId+readAt]',
      syncQueue: '++id, entityType, entityId, action, createdAt',
      syncStatus: 'id'
    })
  }
}

// Sync queue for offline-first sync
export interface SyncQueueItem {
  id?: number
  entityType: 'application' | 'profile' | 'settings' | 'notification'
  entityId: string
  action: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  createdAt: Date
  retryCount: number
  lastError?: string
}

export const db = new JobFlowDatabase()

// ============================================================================
// Database Initialization
// ============================================================================

export async function initializeDatabase() {
  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'default',
      notifications: {
        enabled: true,
        followUpReminderDays: 7
      },
      autofill: {
        autoSubmit: false,
        confirmBeforeFill: true
      },
      theme: 'system'
    })
  }
  
  const syncStatusCount = await db.syncStatus.count()
  if (syncStatusCount === 0) {
    await db.syncStatus.add({
      id: 'default',
      lastSyncAt: null,
      syncInProgress: false,
      syncEnabled: false,
      pendingChanges: 0,
      lastError: null
    })
  }
}

// ============================================================================
// Profile Repository
// ============================================================================

export const profileRepository = {
  async get(): Promise<UserProfile | undefined> {
    return db.profiles.toCollection().first()
  },

  async save(profile: UserProfile): Promise<string> {
    profile.updatedAt = new Date()
    await db.profiles.put(profile)
    return profile.id
  },

  async create(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const newProfile: UserProfile = {
      ...profile,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    }
    await db.profiles.add(newProfile)
    return newProfile.id
  },

  async delete(): Promise<void> {
    await db.profiles.clear()
  }
}

// ============================================================================
// Application Repository
// ============================================================================

export const applicationRepository = {
  async getAll(): Promise<JobApplication[]> {
    return db.applications.orderBy('appliedDate').reverse().toArray()
  },

  async getById(id: string): Promise<JobApplication | undefined> {
    return db.applications.get(id)
  },

  async getByStage(stage: JobApplication['stage']): Promise<JobApplication[]> {
    return db.applications.where('stage').equals(stage).toArray()
  },

  async getActive(): Promise<JobApplication[]> {
    return db.applications.where('status').equals('active').toArray()
  },

  async getFollowUpsDue(date: Date): Promise<JobApplication[]> {
    const dateStr = date.toISOString().split('T')[0]
    return db.applications
      .where('followUpDate')
      .belowOrEqual(dateStr)
      .filter(app => app.status === 'active')
      .toArray()
  },

  async save(application: JobApplication): Promise<string> {
    application.updatedAt = new Date()
    await db.applications.put(application)
    return application.id
  },

  async create(application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const newApp: JobApplication = {
      ...application,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    }
    await db.applications.add(newApp)
    return newApp.id
  },

  async delete(id: string): Promise<void> {
    await db.applications.delete(id)
  },

  async updateStage(id: string, stage: JobApplication['stage']): Promise<void> {
    await db.applications.update(id, { stage, updatedAt: new Date() })
  },

  async updateFollowUpDate(id: string, followUpDate: string | undefined): Promise<void> {
    await db.applications.update(id, { followUpDate, updatedAt: new Date() })
  }
}

// ============================================================================
// Notification Repository
// ============================================================================

export const notificationRepository = {
  async getAll(): Promise<Notification[]> {
    return db.notifications.orderBy('createdAt').reverse().toArray()
  },

  async getUnread(): Promise<Notification[]> {
    return db.notifications
      .where('[userId+readAt]')
      .between(['', ''], ['', '\uffff'])  // readAt is null (empty string in indexeddb)
      .toArray()
      .then(items => items.filter(n => n.readAt === null))
  },

  async getUnreadCount(): Promise<number> {
    const all = await db.notifications.toArray()
    return all.filter(n => n.readAt === null).length
  },

  async getScheduledDue(date: Date): Promise<Notification[]> {
    return db.notifications
      .where('scheduledFor')
      .belowOrEqual(date)
      .filter(n => n.readAt === null && n.scheduledFor !== null)
      .toArray()
  },

  async getById(id: string): Promise<Notification | undefined> {
    return db.notifications.get(id)
  },

  async create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    }
    await db.notifications.add(newNotification)
    return newNotification.id
  },

  async markRead(id: string): Promise<void> {
    await db.notifications.update(id, { readAt: new Date(), updatedAt: new Date() })
  },

  async markAllRead(): Promise<void> {
    const unread = await this.getUnread()
    const now = new Date()
    await Promise.all(
      unread.map(n => db.notifications.update(n.id, { readAt: now, updatedAt: now }))
    )
  },

  async dismiss(id: string): Promise<void> {
    await db.notifications.update(id, { dismissedAt: new Date(), updatedAt: new Date() })
  },

  async delete(id: string): Promise<void> {
    await db.notifications.delete(id)
  },

  async clearAll(): Promise<void> {
    await db.notifications.clear()
  }
}

// ============================================================================
// Settings Repository
// ============================================================================

export const settingsRepository = {
  async get(): Promise<AppSettings> {
    const settings = await db.settings.get('default')
    return settings || {
      notifications: { enabled: true, followUpReminderDays: 7 },
      autofill: { autoSubmit: false, confirmBeforeFill: true },
      theme: 'system'
    }
  },

  async save(settings: AppSettings): Promise<void> {
    await db.settings.put({ ...settings, id: 'default' })
  }
}

// ============================================================================
// Sync Queue Repository
// ============================================================================

export const syncQueueRepository = {
  async getAll(): Promise<SyncQueueItem[]> {
    return db.syncQueue.orderBy('createdAt').toArray()
  },

  async getCount(): Promise<number> {
    return db.syncQueue.count()
  },

  async add(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<number> {
    return db.syncQueue.add({
      ...item,
      createdAt: new Date(),
      retryCount: 0
    }) as Promise<number>
  },

  async incrementRetry(id: number, error: string): Promise<void> {
    const item = await db.syncQueue.get(id)
    if (item) {
      await db.syncQueue.update(id, {
        retryCount: item.retryCount + 1,
        lastError: error
      })
    }
  },

  async remove(id: number): Promise<void> {
    await db.syncQueue.delete(id)
  },

  async clear(): Promise<void> {
    await db.syncQueue.clear()
  }
}

// ============================================================================
// Sync Status Repository
// ============================================================================

export const syncStatusRepository = {
  async get(): Promise<SyncStatus> {
    const status = await db.syncStatus.get('default')
    return status || {
      lastSyncAt: null,
      syncInProgress: false,
      syncEnabled: false,
      pendingChanges: 0,
      lastError: null
    }
  },

  async update(updates: Partial<SyncStatus>): Promise<void> {
    const current = await this.get()
    await db.syncStatus.put({ ...current, ...updates, id: 'default' })
  },

  async setSyncEnabled(enabled: boolean): Promise<void> {
    await this.update({ syncEnabled: enabled })
  },

  async setSyncInProgress(inProgress: boolean): Promise<void> {
    await this.update({ syncInProgress: inProgress })
  },

  async recordSync(success: boolean, error?: string): Promise<void> {
    await this.update({
      lastSyncAt: success ? new Date() : undefined,
      syncInProgress: false,
      lastError: error || null
    })
  }
}
