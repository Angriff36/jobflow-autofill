// ============================================================================
// Auth Types Tests
// ============================================================================

import { describe, it, expect } from 'vitest'
import type { 
  UserProfile as AuthUserProfile,
  UserSettings,
  AuthState,
  Session,
  Notification,
  NotificationType,
  NotificationPriority,
  SyncStatus,
  CreateNotificationInput
} from '../types/auth'

describe('Auth Types', () => {
  // ===========================================================================
  // User Profile
  // ===========================================================================

  describe('AuthUserProfile', () => {
    it('should have all required auth fields', () => {
      const profile: AuthUserProfile = {
        id: 'user-123',
        email: 'user@example.com',
        displayName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.png',
        syncEnabled: true,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(profile.id).toBeDefined()
      expect(profile.email).toBe('user@example.com')
      expect(profile.syncEnabled).toBe(true)
    })

    it('should allow optional fields to be null', () => {
      const profile: AuthUserProfile = {
        id: 'user-123',
        email: 'user@example.com',
        displayName: null,
        avatarUrl: null,
        syncEnabled: false,
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(profile.displayName).toBeNull()
      expect(profile.avatarUrl).toBeNull()
      expect(profile.lastSyncAt).toBeNull()
    })
  })

  // ===========================================================================
  // User Settings
  // ===========================================================================

  describe('UserSettings', () => {
    it('should have all settings fields', () => {
      const settings: UserSettings = {
        userId: 'user-123',
        
        // Notifications
        notificationsEnabled: true,
        followUpReminderDays: 7,
        emailNotifications: false,
        pushNotifications: true,
        
        // Autofill
        autoSubmit: false,
        confirmBeforeFill: true,
        
        // Theme
        theme: 'dark',
        
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(settings.notificationsEnabled).toBe(true)
      expect(settings.followUpReminderDays).toBe(7)
      expect(settings.theme).toBe('dark')
    })
  })

  // ===========================================================================
  // Session
  // ===========================================================================

  describe('Session', () => {
    it('should have token and user info', () => {
      const session: Session = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh-token-123',
        expiresAt: Date.now() + 3600000,
        user: {
          id: 'user-123',
          email: 'user@example.com'
        }
      }

      expect(session.accessToken).toBeDefined()
      expect(session.refreshToken).toBeDefined()
      expect(session.user.id).toBe('user-123')
    })
  })

  // ===========================================================================
  // Auth State
  // ===========================================================================

  describe('AuthState', () => {
    it('should represent authenticated state', () => {
      const state: AuthState = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          displayName: 'John',
          avatarUrl: null,
          syncEnabled: true,
          lastSyncAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        session: {
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now(),
          user: { id: 'user-123', email: 'user@example.com' }
        },
        isLoading: false,
        isAuthenticated: true,
        error: null
      }

      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('should represent unauthenticated state', () => {
      const state: AuthState = {
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      }

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
    })

    it('should represent loading state', () => {
      const state: AuthState = {
        user: null,
        session: null,
        isLoading: true,
        isAuthenticated: false,
        error: null
      }

      expect(state.isLoading).toBe(true)
    })

    it('should represent error state', () => {
      const state: AuthState = {
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Invalid credentials'
      }

      expect(state.error).toBe('Invalid credentials')
    })
  })
})

describe('Notification Types', () => {
  // ===========================================================================
  // Notification
  // ===========================================================================

  describe('Notification', () => {
    it('should have all notification fields', () => {
      const notification: Notification = {
        id: 'notif-123',
        userId: 'user-123',
        
        // Content
        type: 'follow_up_reminder',
        priority: 'high',
        title: 'Follow up on application',
        message: 'It\'s been 7 days since you applied to Tech Corp',
        
        // Related entity
        entityType: 'application',
        entityId: 'app-456',
        
        // Action
        actionUrl: '/applications/app-456',
        actionLabel: 'View Application',
        
        // Scheduling
        scheduledFor: new Date(),
        
        // Delivery status
        readAt: null,
        dismissedAt: null,
        emailSentAt: null,
        pushSentAt: null,
        
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(notification.id).toBeDefined()
      expect(notification.type).toBe('follow_up_reminder')
      expect(notification.priority).toBe('high')
      expect(notification.entityType).toBe('application')
    })

    it('should support all notification types', () => {
      const types: NotificationType[] = [
        'follow_up_reminder',
        'application_update',
        'interview_scheduled',
        'offer_received',
        'reminder_custom',
        'system'
      ]

      types.forEach(type => {
        const notification: Notification = {
          id: 'test',
          userId: 'user',
          type,
          priority: 'normal',
          title: 'Test',
          message: 'Test message',
          entityType: null,
          entityId: null,
          actionUrl: null,
          actionLabel: null,
          scheduledFor: null,
          readAt: null,
          dismissedAt: null,
          emailSentAt: null,
          pushSentAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        expect(notification.type).toBe(type)
      })
    })

    it('should support all priority levels', () => {
      const priorities: NotificationPriority[] = ['low', 'normal', 'high', 'urgent']

      priorities.forEach(priority => {
        const notification: Notification = {
          id: 'test',
          userId: 'user',
          type: 'system',
          priority,
          title: 'Test',
          message: 'Test message',
          entityType: null,
          entityId: null,
          actionUrl: null,
          actionLabel: null,
          scheduledFor: null,
          readAt: null,
          dismissedAt: null,
          emailSentAt: null,
          pushSentAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        expect(notification.priority).toBe(priority)
      })
    })

    it('should track read and dismissed status', () => {
      const readAt = new Date()
      const notification: Notification = {
        id: 'notif-123',
        userId: 'user-123',
        type: 'follow_up_reminder',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
        entityType: null,
        entityId: null,
        actionUrl: null,
        actionLabel: null,
        scheduledFor: null,
        readAt,
        dismissedAt: readAt,
        emailSentAt: null,
        pushSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(notification.readAt).toBeDefined()
      expect(notification.dismissedAt).toBeDefined()
    })
  })

  // ===========================================================================
  // CreateNotificationInput
  // ===========================================================================

  describe('CreateNotificationInput', () => {
    it('should have required fields', () => {
      const input: CreateNotificationInput = {
        type: 'follow_up_reminder',
        title: 'Reminder',
        message: 'Don\'t forget to follow up!'
      }

      expect(input.type).toBe('follow_up_reminder')
      expect(input.title).toBe('Reminder')
    })

    it('should allow optional fields', () => {
      const input: CreateNotificationInput = {
        type: 'interview_scheduled',
        priority: 'urgent',
        title: 'Interview Tomorrow',
        message: 'Your interview is scheduled for tomorrow at 2pm',
        entityType: 'application',
        entityId: 'app-123',
        actionUrl: '/applications/app-123',
        actionLabel: 'View Details',
        scheduledFor: new Date()
      }

      expect(input.priority).toBe('urgent')
      expect(input.entityType).toBe('application')
      expect(input.scheduledFor).toBeDefined()
    })
  })
})

describe('Sync Types', () => {
  // ===========================================================================
  // SyncStatus
  // ===========================================================================

  describe('SyncStatus', () => {
    it('should have all sync status fields', () => {
      const status: SyncStatus = {
        lastSyncAt: new Date(),
        syncInProgress: false,
        syncEnabled: true,
        pendingChanges: 5,
        lastError: null
      }

      expect(status.syncEnabled).toBe(true)
      expect(status.pendingChanges).toBe(5)
      expect(status.lastError).toBeNull()
    })

    it('should represent initial state', () => {
      const status: SyncStatus = {
        lastSyncAt: null,
        syncInProgress: false,
        syncEnabled: false,
        pendingChanges: 0,
        lastError: null
      }

      expect(status.lastSyncAt).toBeNull()
      expect(status.syncEnabled).toBe(false)
    })

    it('should track sync errors', () => {
      const status: SyncStatus = {
        lastSyncAt: null,
        syncInProgress: false,
        syncEnabled: true,
        pendingChanges: 3,
        lastError: 'Network timeout'
      }

      expect(status.lastError).toBe('Network timeout')
    })

    it('should track in-progress sync', () => {
      const status: SyncStatus = {
        lastSyncAt: new Date(),
        syncInProgress: true,
        syncEnabled: true,
        pendingChanges: 2,
        lastError: null
      }

      expect(status.syncInProgress).toBe(true)
    })
  })
})
