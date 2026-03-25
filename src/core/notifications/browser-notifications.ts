import { applicationRepository, notificationRepository } from '../storage/db'
import { useNotificationStore } from './notifications.store'

// ============================================================================
// Browser Notification Service
// Handles system-level notifications for follow-ups and reminders
// ============================================================================

class BrowserNotificationService {
  private permission: NotificationPermission = 'default'
  private checkInterval: number | null = null

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted'
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    }

    return false
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  async show(
    title: string,
    options?: NotificationOptions
  ): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return null
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        ...options
      })

      notification.onclick = () => {
        window.focus()
        if (options?.data?.url) {
          window.location.href = options.data.url
        }
        notification.close()
      }

      return notification
    } catch (error) {
      console.error('Failed to show notification:', error)
      return null
    }
  }

  // Start periodic check for follow-ups and scheduled notifications
  startPeriodicCheck(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      this.stopPeriodicCheck()
    }

    // Initial check
    this.checkForReminders()

    // Set up interval
    this.checkInterval = window.setInterval(() => {
      this.checkForReminders()
    }, intervalMs)
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async checkForReminders(): Promise<void> {
    const now = new Date()

    // Check for applications with follow-ups due
    const dueApplications = await applicationRepository.getFollowUpsDue(now)

    for (const app of dueApplications) {
      // Check if we already notified today
      const lastNotified = localStorage.getItem(`last_notified_${app.id}`)
      const today = now.toISOString().split('T')[0]

      if (lastNotified !== today) {
        await this.show(
          'Follow-up Reminder',
          {
            body: `Time to follow up with ${app.company} for ${app.position}`,
            tag: `followup-${app.id}`,
            data: {
              url: `/applications/${app.id}`,
              applicationId: app.id
            }
          }
        )

        // Mark as notified today
        localStorage.setItem(`last_notified_${app.id}`, today)
      }
    }

    // Check for scheduled in-app notifications
    const scheduledNotifications = await notificationRepository.getScheduledDue(now)

    for (const notification of scheduledNotifications) {
      if (!notification.readAt && !notification.dismissedAt) {
        await this.show(notification.title, {
          body: notification.message,
          tag: `notification-${notification.id}`,
          data: {
            url: notification.actionUrl || '/notifications',
            notificationId: notification.id
          }
        })
      }
    }
  }
}

export const browserNotifications = new BrowserNotificationService()

// ============================================================================
// Follow-up Reminder Helper
// ============================================================================

export async function createFollowUpReminder(
  applicationId: string,
  company: string,
  position: string,
  daysFromNow: number = 7
): Promise<void> {
  const followUpDate = new Date()
  followUpDate.setDate(followUpDate.getDate() + daysFromNow)

  const store = useNotificationStore.getState()
  
  await store.createNotification({
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

export async function createApplicationUpdateNotification(
  applicationId: string,
  company: string,
  position: string,
  updateType: string
): Promise<void> {
  const store = useNotificationStore.getState()
  
  const messages: Record<string, { title: string; message: string }> = {
    interview: {
      title: 'Interview Scheduled',
      message: `You have an interview for ${position} at ${company}`
    },
    offer: {
      title: 'Offer Received!',
      message: `Congratulations! You received an offer from ${company}`
    },
    rejected: {
      title: 'Application Update',
      message: `Your application to ${company} was not selected`
    }
  }

  const { title, message } = messages[updateType] || {
    title: 'Application Update',
    message: `Your application to ${company} for ${position} has been updated`
  }

  await store.createNotification({
    type: updateType === 'offer' ? 'offer_received' : 
          updateType === 'interview' ? 'interview_scheduled' : 'application_update',
    priority: updateType === 'offer' ? 'high' : 'normal',
    title,
    message,
    entityType: 'application',
    entityId: applicationId,
    actionUrl: `/applications/${applicationId}`,
    actionLabel: 'View Application'
  })
}

// ============================================================================
// React Hook for Notifications
// ============================================================================

import { useEffect } from 'react'

export function useBrowserNotifications() {
  useEffect(() => {
    // Request permission on mount
    browserNotifications.requestPermission()
    
    // Start periodic checks
    browserNotifications.startPeriodicCheck()

    return () => {
      browserNotifications.stopPeriodicCheck()
    }
  }, [])

  return {
    showNotification: browserNotifications.show.bind(browserNotifications),
    requestPermission: browserNotifications.requestPermission.bind(browserNotifications),
    getPermissionStatus: browserNotifications.getPermissionStatus.bind(browserNotifications)
  }
}
