-- JobFlow Autofill - User Auth & Notifications Schema
-- Migration: 001_user_auth_notifications
-- Created: 2026-03-20

-- ============================================================================
-- USER PROFILES
-- Extends Supabase auth.users with app-specific profile data
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Sync metadata
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Index for quick email lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- USER SETTINGS (Cloud-synced preferences)
-- ============================================================================

CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT true,
  follow_up_reminder_days INTEGER DEFAULT 7,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  
  -- Autofill preferences
  auto_submit BOOLEAN DEFAULT false,
  confirm_before_fill BOOLEAN DEFAULT true,
  
  -- Theme
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS
-- Stores user notifications for in-app display and email/push dispatch
-- ============================================================================

CREATE TYPE notification_type AS ENUM (
  'follow_up_reminder',    -- Time to follow up on application
  'application_update',    -- Status/stage changed
  'interview_scheduled',   -- Interview date set
  'offer_received',        -- Job offer received
  'reminder_custom',       -- User-created custom reminder
  'system'                 -- System announcements
);

CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'normal',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity (optional link to application, etc.)
  entity_type TEXT,  -- 'application', 'profile', etc.
  entity_id UUID,    -- ID of related entity
  
  -- Action (optional CTA)
  action_url TEXT,
  action_label TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,  -- When to deliver (null = immediate)
  
  -- Delivery status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for) 
  WHERE scheduled_for IS NOT NULL AND read_at IS NULL;
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- ============================================================================
-- SYNCED APPLICATIONS (Cloud backup of local job applications)
-- ============================================================================

CREATE TYPE application_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE pipeline_stage AS ENUM ('applied', 'interviewing', 'offer', 'rejected', 'closed');

CREATE TABLE public.synced_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,  -- Reference to local IndexedDB ID
  
  -- Application data
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  source TEXT,
  source_url TEXT,
  applied_date DATE NOT NULL,
  status application_status DEFAULT 'active',
  stage pipeline_stage DEFAULT 'applied',
  
  -- Follow-up tracking
  follow_up_date DATE,
  next_action_type TEXT,
  next_action_due DATE,
  next_action_description TEXT,
  
  -- Additional data
  notes TEXT,
  salary_amount INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  salary_frequency TEXT CHECK (salary_frequency IN ('hourly', 'yearly')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one sync record per local app per user
  UNIQUE(user_id, local_id)
);

ALTER TABLE public.synced_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON public.synced_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own applications"
  ON public.synced_applications FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_synced_applications_user ON public.synced_applications(user_id);
CREATE INDEX idx_synced_applications_stage ON public.synced_applications(user_id, stage);
CREATE INDEX idx_synced_applications_status ON public.synced_applications(user_id, status);

-- ============================================================================
-- SYNCED CONTACTS (Contacts linked to applications)
-- ============================================================================

CREATE TABLE public.synced_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.synced_applications(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.synced_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contacts via applications"
  ON public.synced_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.synced_applications 
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_synced_applications_updated_at
  BEFORE UPDATE ON public.synced_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_synced_contacts_updated_at
  BEFORE UPDATE ON public.synced_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- NOTIFICATION HELPER FUNCTIONS
-- ============================================================================

-- Create a follow-up reminder notification
CREATE OR REPLACE FUNCTION create_follow_up_reminder(
  p_user_id UUID,
  p_application_id UUID,
  p_company TEXT,
  p_position TEXT,
  p_remind_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    priority,
    title,
    message,
    entity_type,
    entity_id,
    scheduled_for
  ) VALUES (
    p_user_id,
    'follow_up_reminder',
    'normal',
    'Follow up with ' || p_company,
    'Time to follow up on your application for ' || p_position || ' at ' || p_company,
    'application',
    p_application_id,
    p_remind_date::timestamp with time zone
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = p_user_id AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id AND auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL DATA FOR NEW USERS
-- ============================================================================

-- Trigger to create profile and settings when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
