// ============================================================================
// User Authentication Types
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  syncEnabled: boolean
  lastSyncAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  userId: string
  
  // Notification preferences
  notificationsEnabled: boolean
  followUpReminderDays: number
  emailNotifications: boolean
  pushNotifications: boolean
  
  // Autofill preferences
  autoSubmit: boolean
  confirmBeforeFill: boolean
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  createdAt: Date
  updatedAt: Date
}

// Auth state for the app
export interface AuthState {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  error?: string | null
}

// Supabase session (simplified)
export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: {
    id: string
    email: string
  }
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 
  | 'follow_up_reminder'
  | 'application_update'
  | 'interview_scheduled'
  | 'offer_received'
  | 'reminder_custom'
  | 'system'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification {
  id: string
  userId: string
  
  // Content
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  
  // Related entity
  entityType: string | null  // 'application', 'profile', etc.
  entityId: string | null
  
  // Action
  actionUrl: string | null
  actionLabel: string | null
  
  // Scheduling
  scheduledFor: Date | null
  
  // Delivery status
  readAt: Date | null
  dismissedAt: Date | null
  emailSentAt: Date | null
  pushSentAt: Date | null
  
  createdAt: Date
  updatedAt: Date
}

// For creating new notifications
export interface CreateNotificationInput {
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  entityType?: string
  entityId?: string
  actionUrl?: string
  actionLabel?: string
  scheduledFor?: Date
}

// For displaying in UI
export interface NotificationGroup {
  date: string  // 'Today', 'Yesterday', 'This Week', etc.
  notifications: Notification[]
}

// ============================================================================
// Cloud Sync Types
// ============================================================================

export interface SyncStatus {
  lastSyncAt: Date | null
  syncInProgress: boolean
  syncEnabled: boolean
  pendingChanges: number
  lastError: string | null
}

export interface SyncResult {
  success: boolean
  syncedAt: Date
  applicationsSynced: number
  profilesSynced: number
  errors: SyncError[]
}

export interface SyncError {
  entity: string
  entityId: string
  error: string
}
