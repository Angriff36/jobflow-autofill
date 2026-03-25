import { create } from 'zustand'
import type { Notification, NotificationGroup, CreateNotificationInput } from '../types/auth'
import { notificationService } from '../storage/supabase'
import { notificationRepository } from '../storage/db'
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  isCloudEnabled: boolean
}

interface NotificationActions {
  loadNotifications: () => Promise<void>
  getUnreadCount: () => Promise<number>
  createNotification: (input: CreateNotificationInput) => Promise<Notification | null>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>
  delete: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  setCloudEnabled: (enabled: boolean) => void
  getGroupedNotifications: () => NotificationGroup[]
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  isCloudEnabled: true,

  // Actions
  loadNotifications: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { isCloudEnabled } = get()
      
      let notifications: Notification[]
      if (isCloudEnabled) {
        notifications = await notificationService.getAll()
      } else {
        notifications = await notificationRepository.getAll()
      }
      
      const unreadCount = notifications.filter(n => !n.readAt).length
      
      set({ notifications, unreadCount, isLoading: false })
    } catch (error) {
      set({ 
        error: 'Failed to load notifications', 
        isLoading: false 
      })
    }
  },

  getUnreadCount: async () => {
    try {
      const { isCloudEnabled } = get()
      
      let count: number
      if (isCloudEnabled) {
        count = await notificationService.getUnreadCount()
      } else {
        count = await notificationRepository.getUnreadCount()
      }
      
      set({ unreadCount: count })
      return count
    } catch {
      return 0
    }
  },

  createNotification: async (input: CreateNotificationInput) => {
    try {
      const { isCloudEnabled } = get()
      
      let notification: Notification | null
      if (isCloudEnabled) {
        notification = await notificationService.create(input)
      } else {
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
        notification = await notificationRepository.getById(id) || null
      }
      
      if (notification) {
        set(state => ({
          notifications: [notification!, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }))
      }
      
      return notification
    } catch (error) {
      set({ error: 'Failed to create notification' })
      return null
    }
  },

  markRead: async (id: string) => {
    try {
      const { isCloudEnabled } = get()
      
      let success: boolean
      if (isCloudEnabled) {
        success = await notificationService.markRead(id)
      } else {
        await notificationRepository.markRead(id)
        success = true
      }
      
      if (success) {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, readAt: new Date() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }))
      }
    } catch {
      set({ error: 'Failed to mark notification as read' })
    }
  },

  markAllRead: async () => {
    try {
      const { isCloudEnabled } = get()
      
      let success: boolean
      if (isCloudEnabled) {
        success = await notificationService.markAllRead()
      } else {
        await notificationRepository.markAllRead()
        success = true
      }
      
      if (success) {
        const now = new Date()
        set(state => ({
          notifications: state.notifications.map(n => ({
            ...n,
            readAt: n.readAt || now
          })),
          unreadCount: 0
        }))
      }
    } catch {
      set({ error: 'Failed to mark all notifications as read' })
    }
  },

  dismiss: async (id: string) => {
    try {
      const { isCloudEnabled } = get()
      
      let success: boolean
      if (isCloudEnabled) {
        success = await notificationService.dismiss(id)
      } else {
        await notificationRepository.dismiss(id)
        success = true
      }
      
      if (success) {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, dismissedAt: new Date() } : n
          )
        }))
      }
    } catch {
      set({ error: 'Failed to dismiss notification' })
    }
  },

  delete: async (id: string) => {
    try {
      const { isCloudEnabled } = get()
      
      let success: boolean
      if (isCloudEnabled) {
        success = await notificationService.delete(id)
      } else {
        await notificationRepository.delete(id)
        success = true
      }
      
      if (success) {
        set(state => {
          const notification = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notification && !notification.readAt 
              ? Math.max(0, state.unreadCount - 1) 
              : state.unreadCount
          }
        })
      }
    } catch {
      set({ error: 'Failed to delete notification' })
    }
  },

  clearAll: async () => {
    try {
      const { isCloudEnabled } = get()
      
      if (isCloudEnabled) {
        // Delete all one by one (or add a bulk delete endpoint)
        const { notifications } = get()
        await Promise.all(notifications.map(n => notificationService.delete(n.id)))
      } else {
        await notificationRepository.clearAll()
      }
      
      set({ notifications: [], unreadCount: 0 })
    } catch {
      set({ error: 'Failed to clear notifications' })
    }
  },

  setCloudEnabled: (enabled: boolean) => {
    set({ isCloudEnabled: enabled })
  },

  getGroupedNotifications: () => {
    const { notifications } = get()
    const groups: Map<string, Notification[]> = new Map()
    
    // Filter out dismissed notifications
    const visible = notifications.filter(n => !n.dismissedAt)
    
    for (const notification of visible) {
      const date = new Date(notification.createdAt)
      let groupKey: string
      
      if (isToday(date)) {
        groupKey = 'Today'
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday'
      } else if (isThisWeek(date)) {
        groupKey = 'This Week'
      } else if (isThisMonth(date)) {
        groupKey = 'This Month'
      } else {
        groupKey = format(date, 'MMMM yyyy')
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
  }
}))

// Subscribe to real-time notifications (cloud only)
let subscription: { unsubscribe: () => void } | null = null

export function subscribeToNotifications() {
  const store = useNotificationStore.getState()
  
  if (store.isCloudEnabled && !subscription) {
    subscription = notificationService.subscribe((_notification) => {
      store.loadNotifications()
    })
  }
}

export function unsubscribeFromNotifications() {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }
}
