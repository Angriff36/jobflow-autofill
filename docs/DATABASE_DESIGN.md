# Database Design - JobFlow Autofill

## Overview

This document describes the database schema for User Authentication and Notifications features in JobFlow Autofill.

## Architecture

JobFlow Autofill uses a **dual-storage architecture**:
- **IndexedDB (local)**: Primary storage for offline-first operation
- **Supabase (cloud)**: Optional storage for auth and cross-device sync

## Cloud Database Schema (Supabase)

### Tables

#### `profiles`
Extended user profile data linked to Supabase auth.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| email | TEXT | User email |
| display_name | TEXT | Optional display name |
| avatar_url | TEXT | Optional avatar URL |
| sync_enabled | BOOLEAN | Whether user has cloud sync enabled |
| last_sync_at | TIMESTAMPTZ | Last sync timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### `user_settings`
Cloud-synced user preferences.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Primary key, references profiles.id |
| notifications_enabled | BOOLEAN | Global notification toggle |
| follow_up_reminder_days | INTEGER | Days before follow-up reminder |
| email_notifications | BOOLEAN | Email notification preference |
| push_notifications | BOOLEAN | Push notification preference |
| auto_submit | BOOLEAN | Auto-submit forms after fill |
| confirm_before_fill | BOOLEAN | Show confirmation before autofill |
| theme | TEXT | 'light', 'dark', or 'system' |

#### `notifications`
In-app notifications with scheduling support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles.id |
| type | ENUM | Notification type (see below) |
| priority | ENUM | 'low', 'normal', 'high', 'urgent' |
| title | TEXT | Notification title |
| message | TEXT | Notification body |
| entity_type | TEXT | Related entity type (e.g., 'application') |
| entity_id | UUID | Related entity ID |
| action_url | TEXT | URL to navigate on click |
| action_label | TEXT | CTA button label |
| scheduled_for | TIMESTAMPTZ | Scheduled delivery time |
| read_at | TIMESTAMPTZ | When marked as read |
| dismissed_at | TIMESTAMPTZ | When dismissed |
| email_sent_at | TIMESTAMPTZ | When email was sent |
| push_sent_at | TIMESTAMPTZ | When push was sent |

**Notification Types:**
- `follow_up_reminder` - Time to follow up on application
- `application_update` - Status/stage changed
- `interview_scheduled` - Interview date set
- `offer_received` - Job offer received
- `reminder_custom` - User-created custom reminder
- `system` - System announcements

#### `synced_applications`
Cloud backup of job applications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles.id |
| local_id | TEXT | Local IndexedDB ID |
| company | TEXT | Company name |
| position | TEXT | Job position |
| source | TEXT | Application source |
| source_url | TEXT | Original job posting URL |
| applied_date | DATE | Date applied |
| status | ENUM | 'active', 'archived', 'deleted' |
| stage | ENUM | 'applied', 'interviewing', 'offer', 'rejected', 'closed' |
| follow_up_date | DATE | Next follow-up date |
| notes | TEXT | User notes |
| salary_amount | INTEGER | Salary amount |
| salary_currency | TEXT | Currency code |
| salary_frequency | TEXT | 'hourly' or 'yearly' |

#### `synced_contacts`
Contacts linked to synced applications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| application_id | UUID | References synced_applications.id |
| local_id | TEXT | Local IndexedDB ID |
| name | TEXT | Contact name |
| role | TEXT | Contact role/title |
| email | TEXT | Contact email |
| phone | TEXT | Contact phone |
| notes | TEXT | Contact notes |

## Local Database Schema (IndexedDB)

### Stores

| Store | Key | Indexes | Purpose |
|-------|-----|---------|---------|
| profiles | id | createdAt, updatedAt | User profile data |
| applications | id | company, status, stage, appliedDate, followUpDate | Job applications |
| formSchemas | id | domain, urlPattern | Domain-specific form mappings |
| settings | id | - | App settings |
| notifications | id | userId, type, scheduledFor, [userId+readAt] | Local notifications |
| syncQueue | auto-increment | entityType, entityId | Pending sync operations |
| syncStatus | id | - | Sync state tracking |

## Row Level Security

All cloud tables use RLS policies:

```sql
-- Example: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);
```

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/001_user_auth_notifications.sql` | Cloud database migration |
| `src/core/types/auth.ts` | TypeScript types for auth/notifications |
| `src/core/storage/db.ts` | IndexedDB schema and repositories |
| `src/core/storage/supabase.ts` | Supabase client and services |
| `src/core/auth/auth.store.ts` | Zustand store for auth state |
| `src/core/notifications/notifications.store.ts` | Zustand store for notifications |
| `src/core/notifications/browser-notifications.ts` | Browser notification service |
| `.env.example` | Environment variables template |

## Setup Instructions

1. Create a Supabase project at https://supabase.com
2. Run the migration in Supabase SQL editor:
   ```sql
   -- Contents of supabase/migrations/001_user_auth_notifications.sql
   ```
3. Copy `.env.example` to `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

## API Reference

### Auth Service

```typescript
import { authService } from './core/storage/supabase'

// Sign up
await authService.signUp('user@example.com', 'password', 'Display Name')

// Sign in
await authService.signIn('user@example.com', 'password')

// OAuth
await authService.signInWithOAuth('google')

// Sign out
await authService.signOut()

// Get current profile
const profile = await authService.getProfile()
```

### Notification Service

```typescript
import { notificationService } from './core/storage/supabase'

// Get all notifications
const notifications = await notificationService.getAll()

// Get unread count
const count = await notificationService.getUnreadCount()

// Create notification
await notificationService.create({
  type: 'follow_up_reminder',
  title: 'Follow up',
  message: 'Time to follow up with Acme Corp',
  scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
})

// Mark as read
await notificationService.markRead(notificationId)
```

### Browser Notifications

```typescript
import { browserNotifications, createFollowUpReminder } from './core/notifications/browser-notifications'

// Request permission
await browserNotifications.requestPermission()

// Show notification
await browserNotifications.show('Title', { body: 'Message' })

// Create follow-up reminder (7 days from now)
await createFollowUpReminder(applicationId, 'Acme Corp', 'Software Engineer', 7)
```
