// ============================================================================
// Notification Settings Component
// ============================================================================

import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export function NotificationSettings() {
  const { settings, updateSettings } = useAuth()
  const [isSaving, setIsSaving] = useState(false)

  if (!settings) {
    return (
      <div className="p-4 text-gray-500">
        Please log in to manage notification settings.
      </div>
    )
  }

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    setIsSaving(true)
    await updateSettings({ [key]: value })
    setIsSaving(false)
  }

  const handleNumberChange = async (key: keyof typeof settings, value: number) => {
    setIsSaving(true)
    await updateSettings({ [key]: value })
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        <p className="text-sm text-gray-500">
          Manage how and when you receive notifications.
        </p>
      </div>

      <div className="space-y-4">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Enable Notifications
            </label>
            <p className="text-sm text-gray-500">
              Turn on all notifications
            </p>
          </div>
          <ToggleSwitch
            checked={settings.notificationsEnabled}
            onChange={(value) => handleToggle('notificationsEnabled', value)}
            disabled={isSaving}
          />
        </div>

        {/* Follow-up Reminder Days */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Follow-up Reminder
            </label>
            <p className="text-sm text-gray-500">
              Days before follow-up reminder
            </p>
          </div>
          <select
            value={settings.followUpReminderDays}
            onChange={(e) => handleNumberChange('followUpReminderDays', parseInt(e.target.value))}
            disabled={isSaving || !settings.notificationsEnabled}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={3}>3 days</option>
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>

        <hr />

        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email Notifications
            </label>
            <p className="text-sm text-gray-500">
              Receive notifications via email
            </p>
          </div>
          <ToggleSwitch
            checked={settings.emailNotifications}
            onChange={(value) => handleToggle('emailNotifications', value)}
            disabled={isSaving || !settings.notificationsEnabled}
          />
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Push Notifications
            </label>
            <p className="text-sm text-gray-500">
              Receive browser push notifications
            </p>
          </div>
          <ToggleSwitch
            checked={settings.pushNotifications}
            onChange={(value) => handleToggle('pushNotifications', value)}
            disabled={isSaving || !settings.notificationsEnabled}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Toggle Switch Component
// ============================================================================

interface ToggleSwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
