// ============================================================================
// Notifications API - Notification Management
// Handles in-app notifications, browser notifications, and notification
// preferences
// ============================================================================

import { notificationRepository } from '../storage/db'
import { notificationService } from '../storage/supabase'
import { authApi } from './auth.api'
import type { 
  Notification, 
  NotificationType, 
  NotificationPriority,
  CreateNotificationInput 
} from '../types/auth'
import { isToday, isYesterday } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export interface NotificationFilters {
  type?: NotificationType
  read?: boolean
  priority?: NotificationPriority
  dateFrom?: Date
  dateTo?: Date
}

// ============================================================================
// Helper function for grouping notifications by date
// ============================================================================

function groupNotificationsByDate(notifications: Notification[]): Array<{ date: string; notifications: Notification[] }> {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const groups = new Map<string, Notification[]>()

  // Sort by created date descending
  const sorted = [...notifications].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  for (const notification of sorted) {
    const date = new Date(notification.createdAt)

    let groupKey: string
    if (isToday(date)) {
      groupKey = 'Today'
    } else if (isYesterday(date)) {
      groupKey = 'Yesterday'
    } else if (date >= weekAgo) {
      groupKey = 'This Week'
    } else if (date >= monthAgo) {
      groupKey = 'This Month'
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(notification)
  }

  return Array.from(groups.entries()).map(([ date, notifications ]) => ({
    date,
    notifications
  }))
}

// ============================================================================
// Notifications API
// ============================================================================

export const notificationsApi = {
  // ---------------------------------------------------------------------------
  // Fetching
  // ---------------------------------------------------------------------------

  /**
   * Get all notifications
   */
  async getAll(): Promise<Notification[]> {
    const isCloud = await authApi.isAuthenticated()
    
    if (isCloud) {
      return notificationService.getAll()
    }
    
    return notificationRepository.getAll()
  },

  /**
   * Get unread notifications
   */
  async getUnread(): Promise<Notification[]> {
    const isCloud = await authApi.isAuthenticated()
    
    if (isCloud) {
      return notificationService.getUnread()
    }
    
    return notificationRepository.getUnread()
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const isCloud = await authApi.isAuthenticated()
    
    if (isCloud) {
      return notificationService.getUnreadCount()
    }
    
    return notificationRepository.getUnreadCount()
  },

  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<Notification | undefined> {
    return notificationRepository.getById(id)
  },

  /**
   * Get notifications with filters
   */
  async getFiltered(filters: NotificationFilters): Promise<Notification[]> {
    let notifications = await this.getAll()

    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type)
    }

    if (filters.read !== undefined) {
      notifications = notifications.filter(n => 
        filters.read ? n.readAt !== null : n.readAt === null
      )
    }

    if (filters.priority) {
      notifications = notifications.filter(n => n.priority === filters.priority)
    }

    if (filters.dateFrom) {
      notifications = notifications.filter(n => 
        n.createdAt >= filters.dateFrom!
      )
    }

    if (filters.dateTo) {
      notifications = notifications.filter(n => 
        n.createdAt <= filters.dateTo!
      )
    }

    return notifications
  },

  /**
   * Group notifications by date (helper for hooks)
   */
  groupByDate(notifications: Notification[]): Array<{ date: string; notifications: Notification[] }> {
    return groupNotificationsByDate(notifications)
  },

  /**
   * Get grouped notifications (Today, Yesterday, This Week, etc.)
   */
  async getGrouped(): Promise<Array<{ date: string; notifications: Notification[] }>> {
    const notifications = await this.getAll()
    const groups = new Map<string, Notification[]>()
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filter out dismissed
    const visible = notifications.filter(n => !n.dismissedAt)

    for (const notification of visible) {
      const date = new Date(notification.createdAt)
      let groupKey: string

      if (date >= today) {
        groupKey = 'Today'
      } else if (date >= yesterday) {
        groupKey = 'Yesterday'
      } else if (date >= weekAgo) {
        groupKey = 'This Week'
      } else if (date >= monthAgo) {
        groupKey = 'This Month'
      } else {
        groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(notification)
    }

    return Array.from(groups.entries()).map(([date, notifications]) => ({
      date,
      notifications
    }))
  },

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput): Promise<Notification | null> {
    const isCloud = await authApi.isAuthenticated()

    if (isCloud) {
      return notificationService.create(input)
    }

    const id = await notificationRepository.create({
      userId: 'local',
      type: input.type,
      priority: input.priority || 'normal',
      title: input.title,
      message: input.message,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      actionUrl: input.actionUrl || null,
      actionLabel: input.actionLabel || null,
      scheduledFor: input.scheduledFor || null,
      readAt: null,
      dismissedAt: null,
      emailSentAt: null,
      pushSentAt: null
    })

    const notification = await notificationRepository.getById(id)
    return notification ?? null
  },

  /**
   * Mark notification as read
   */
  async markRead(id: string): Promise<boolean> {
    const isCloud = await authApi.isAuthenticated()

    if (isCloud) {
      return notificationService.markRead(id)
    }

    await notificationRepository.markRead(id)
    return true
  },

  /**
   * Mark all notifications as read
   */
  async markAllRead(): Promise<boolean> {
    const isCloud = await authApi.isAuthenticated()

    if (isCloud) {
      return notificationService.markAllRead()
    }

    await notificationRepository.markAllRead()
    return true
  },

  /**
   * Dismiss a notification
   */
  async dismiss(id: string): Promise<boolean> {
    const isCloud = await authApi.isAuthenticated()

    if (isCloud) {
      return notificationService.dismiss(id)
    }

    await notificationRepository.dismiss(id)
    return true
  },

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<boolean> {
    const isCloud = await authApi.isAuthenticated()

    if (isCloud) {
      return notificationService.delete(id)
    }

    await notificationRepository.delete(id)
    return true
  },

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    const isCloud = await authApi.isAuthenticated()

    if (isCloud) {
      const notifications = await this.getAll()
      await Promise.all(notifications.map(n => notificationService.delete(n.id)))
      return
    }

    await notificationRepository.clearAll()
  },

  // ---------------------------------------------------------------------------
  // Real-time Subscription (Cloud only)
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to real-time notifications
   */
  subscribe(callback: (notification: Notification) => void) {
    return notificationService.subscribe(callback)
  }
}

// ============================================================================
// Follow-up Reminder Helpers
// ============================================================================

/**
 * Create a follow-up reminder notification
 */
export async function createFollowUpReminder(
  applicationId: string,
  company: string,
  position: string,
  daysFromNow: number = 7
): Promise<Notification | null> {
  const followUpDate = new Date()
  followUpDate.setDate(followUpDate.getDate() + daysFromNow)

  return notificationsApi.create({
    type: 'follow_up_reminder',
    priority: 'normal',
    title: `Follow up with ${company}`,
    message: `Time to follow up on your application for ${position} at ${company}`,
    entityType: 'application',
    entityId: applicationId,
    actionUrl: `/applications/${applicationId}`,
    actionLabel: 'View Application',
    scheduledFor: followUpDate
  })
}

/**
 * Create an application update notification
 */
export async function createApplicationUpdateNotification(
  applicationId: string,
  company: string,
  position: string,
  updateType: 'interview' | 'offer' | 'rejected' | 'update'
): Promise<Notification | null> {
  const configs: Record<string, { title: string; message: string; priority: NotificationPriority }> = {
    interview: {
      title: 'Interview Scheduled',
      message: `You have an interview for ${position} at ${company}`,
      priority: 'high'
    },
    offer: {
      title: 'Offer Received!',
      message: `Congratulations! You received an offer from ${company}`,
      priority: 'high'
    },
    rejected: {
      title: 'Application Update',
      message: `Your application to ${company} was not selected`,
      priority: 'normal'
    },
    update: {
      title: 'Application Updated',
      message: `Your application to ${company} for ${position} has been updated`,
      priority: 'normal'
    }
  }

  const config = configs[updateType]

  return notificationsApi.create({
    type: updateType === 'offer' ? 'offer_received' : 
          updateType === 'interview' ? 'interview_scheduled' : 'application_update',
    priority: config.priority,
    title: config.title,
    message: config.message,
    entityType: 'application',
    entityId: applicationId,
    actionUrl: `/applications/${applicationId}`,
    actionLabel: 'View Application'
  })
}
