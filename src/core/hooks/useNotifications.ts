// ============================================================================
// React Hooks - Notifications
// Easy-to-use hooks for notification management
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  notificationsApi, 
  type NotificationFilters,
  createFollowUpReminder
} from '../api/notifications.api'
import { browserNotifications } from '../notifications/browser-notifications'
import type { Notification } from '../types/auth'

// ============================================================================
// Types
// ============================================================================

export interface NotificationGroup {
  date: string
  notifications: Notification[]
}

// ============================================================================
// useNotifications Hook
// ============================================================================

export interface UseNotificationsOptions {
  filters?: NotificationFilters
  autoRefresh?: boolean
  refreshInterval?: number
  enableBrowserNotifications?: boolean
}

export interface UseNotificationsReturn {
  // State
  notifications: Notification[]
  isLoading: boolean
  error: string | null

  // Actions
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
  clearError: () => void

  // Computed
  unreadCount: number
  unread: Notification[]
  grouped: NotificationGroup[]
}

export interface NotificationGroup {
  date: string
  notifications: Notification[]
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = options.filters
        ? await notificationsApi.getFiltered(options.filters)
        : await notificationsApi.getAll()
      setNotifications(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [options.filters])

  useEffect(() => {
    loadNotifications()

    // Enable browser notifications
    if (options.enableBrowserNotifications) {
      browserNotifications.requestPermission()
      browserNotifications.startPeriodicCheck()
    }

    return () => {
      if (options.enableBrowserNotifications) {
        browserNotifications.stopPeriodicCheck()
      }
    }
  }, [loadNotifications, options.enableBrowserNotifications])

  // Auto-refresh
  useEffect(() => {
    if (!options.autoRefresh || !options.refreshInterval) return

    const interval = setInterval(loadNotifications, options.refreshInterval)
    return () => clearInterval(interval)
  }, [loadNotifications, options.autoRefresh, options.refreshInterval])

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id)
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, readAt: new Date() } : n
    ))
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead()
    const now = new Date()
    setNotifications(prev => prev.map(n => ({
      ...n,
      readAt: n.readAt || now
    })))
  }, [])

  const dismiss = useCallback(async (id: string) => {
    await notificationsApi.dismiss(id)
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, dismissedAt: new Date() } : n
    ))
  }, [])

  const remove = useCallback(async (id: string) => {
    await notificationsApi.delete(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // Computed values
  const unread = useMemo(() => 
    notifications.filter(n => !n.readAt && !n.dismissedAt),
    [notifications]
  )

  const unreadCount = unread.length

  const grouped = useMemo(() => {
    return notificationsApi.groupByDate(notifications.filter(n => !n.dismissedAt))
  }, [notifications])

  return {
    notifications,
    isLoading,
    error,
    markRead,
    markAllRead,
    dismiss,
    remove,
    refresh: loadNotifications,
    clearError,
    unreadCount,
    unread,
    grouped
  }
}

// ============================================================================
// useUnreadCount Hook
// ============================================================================

export function useUnreadCount(): {
  count: number
  isLoading: boolean
  refresh: () => Promise<void>
} {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadCount = useCallback(async () => {
    setIsLoading(true)
    try {
      const unreadCount = await notificationsApi.getUnreadCount()
      setCount(unreadCount)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCount()
  }, [loadCount])

  return {
    count,
    isLoading,
    refresh: loadCount
  }
}

// ============================================================================
// useFollowUpReminder Hook
// ============================================================================

export function useFollowUpReminder(): {
  createReminder: (
    applicationId: string,
    company: string,
    position: string,
    daysFromNow?: number
  ) => Promise<Notification | null>
} {
  const createReminder = useCallback(async (
    applicationId: string,
    company: string,
    position: string,
    daysFromNow: number = 7
  ) => {
    return createFollowUpReminder(applicationId, company, position, daysFromNow)
  }, [])

  return { createReminder }
}

// ============================================================================
// useBrowserNotifications Hook
// ============================================================================

export function useBrowserNotifications(): {
  permission: NotificationPermission
  requestPermission: () => Promise<boolean>
  show: (title: string, options?: NotificationOptions) => Promise<globalThis.Notification | null>
  isEnabled: boolean
} {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const requestPermission = useCallback(async () => {
    const granted = await browserNotifications.requestPermission()
    setPermission(Notification.permission)
    return granted
  }, [])

  const show = useCallback(async (title: string, options?: NotificationOptions) => {
    return browserNotifications.show(title, options)
  }, [])

  return {
    permission,
    requestPermission,
    show,
    isEnabled: permission === 'granted'
  }
}
