import { useEffect, useState } from 'react'
import { settingsRepository, initializeDatabase } from '@/core/storage/db'
import type { AppSettings } from '@/core/types'
import { Save } from 'lucide-react'

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    notifications: { enabled: true, followUpReminderDays: 7 },
    autofill: { autoSubmit: false, confirmBeforeFill: true },
    theme: 'system'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    initializeDatabase().then(loadSettings)
  }, [])

  async function loadSettings() {
    try {
      const loaded = await settingsRepository.get()
      setSettings(loaded)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await settingsRepository.save(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Notifications */}
      <section className="p-6 bg-card rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Notifications</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifications.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, enabled: e.target.checked }
                })
              }
              className="w-4 h-4"
            />
            <span>Enable notifications</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">
              Follow-up reminder (days after applying)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={settings.notifications.followUpReminderDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    followUpReminderDays: parseInt(e.target.value) || 7
                  }
                })
              }
              className="w-24 px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </section>

      {/* Autofill */}
      <section className="p-6 bg-card rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Autofill</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autofill.confirmBeforeFill}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  autofill: { ...settings.autofill, confirmBeforeFill: e.target.checked }
                })
              }
              className="w-4 h-4"
            />
            <span>Confirm before autofilling forms</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autofill.autoSubmit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  autofill: { ...settings.autofill, autoSubmit: e.target.checked }
                })
              }
              className="w-4 h-4"
            />
            <span>Automatically submit after autofill (not recommended)</span>
          </label>
        </div>
      </section>

      {/* Theme */}
      <section className="p-6 bg-card rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Appearance</h3>
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) =>
              setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'system' })
            }
            className="w-48 px-3 py-2 border rounded-md"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      {/* Data Management */}
      <section className="p-6 bg-card rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          All your data is stored locally in your browser. No data is sent to any server.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm('Export all data as JSON?')) {
                // Export functionality would go here
                alert('Export feature coming soon')
              }
            }}
            className="px-4 py-2 border rounded-md hover:bg-muted"
          >
            Export Data
          </button>
          <button
            onClick={() => {
              if (confirm('Clear all data? This cannot be undone.')) {
                // Clear functionality would go here
                alert('Clear feature coming soon')
              }
            }}
            className="px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10"
          >
            Clear All Data
          </button>
        </div>
      </section>
    </div>
  )
}
