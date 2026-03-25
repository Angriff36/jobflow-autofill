// ============================================================================
// Notifications Context and Provider
// ============================================================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { notificationsApi } from '../../core/api/notifications.api'
import type { Notification } from '../../core/types/auth'

// ============================================================================
// Types
// ============================================================================

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
  
  // Toast notifications
  toasts: Notification[]
  addToast: (notification: Notification) => void
  removeToast: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

// ============================================================================
// Provider
// ============================================================================

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Notification[]>([])

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await notificationsApi.getAll()
      setNotifications(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()

    // Subscribe to real-time notifications
    const subscription = notificationsApi.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev])
      // Add to toasts for new notifications
      addToast(notification)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadNotifications])

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

  const addToast = useCallback((notification: Notification) => {
    setToasts(prev => [...prev, notification])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(notification.id)
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const unreadCount = notifications.filter(n => !n.readAt && !n.dismissedAt).length

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    dismiss,
    remove,
    refresh: loadNotifications,
    toasts,
    addToast,
    removeToast
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
