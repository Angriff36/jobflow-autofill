/// <reference types="chrome" />
import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

// ============================================================================
// Types
// ============================================================================

interface Profile {
  personal: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

interface DetectedField {
  selector: string
  name: string
  type: string
  label?: string
  suggestedMapping: string | null
}

interface TabState {
  isJobSite: boolean
  fieldsDetected: number
  domain: string
  fields: DetectedField[]
}

// ============================================================================
// App Component
// ============================================================================

function PopupApp() {
  const [tabState, setTabState] = useState<TabState | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAutofilling, setIsAutofilling] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [view, setView] = useState<'main' | 'settings'>('main')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (tab?.id) {
        // Request field detection from content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'DETECT_FIELDS' })
          if (response?.success) {
            setTabState({
              isJobSite: response.data.fields.length > 0,
              fieldsDetected: response.data.fields.length,
              domain: response.data.domain,
              fields: response.data.fields,
            })
          }
        } catch {
          // Content script not loaded
          setTabState({
            isJobSite: false,
            fieldsDetected: 0,
            domain: new URL(tab.url || '').hostname,
            fields: [],
          })
        }
      }

      // Get profile
      const result = await chrome.storage.local.get('profile')
      setProfile(result.profile || null)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutofill = async () => {
    if (!tabState?.fields.length || !profile) return

    setIsAutofilling(true)
    setStatus(null)

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (tab?.id) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'PERFORM_AUTOFILL',
          payload: {
            fields: tabState.fields,
            profile,
          },
        })

        if (response?.success) {
          setStatus(`Filled ${response.data.filledCount} fields`)
          setTimeout(() => setStatus(null), 3000)
        }
      }
    } catch (error) {
      setStatus('Autofill failed')
    } finally {
      setIsAutofilling(false)
    }
  }

  const handleOpenDashboard = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html'),
    })
  }

  const handleHighlightFields = async () => {
    if (!tabState?.fields.length) return

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_FIELDS',
        payload: {
          selectors: tabState.fields.map(f => f.selector),
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">JobFlow</h1>
        <button
          onClick={() => setView(view === 'main' ? 'settings' : 'main')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {view === 'settings' ? (
        <SettingsView onBack={() => setView('main')} />
      ) : (
        <>
          {/* Status */}
          {status && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{status}</p>
            </div>
          )}

          {/* Current Page Status */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              {tabState?.isJobSite ? (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              ) : (
                <span className="w-2 h-2 bg-gray-300 rounded-full" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {tabState?.domain || 'Unknown'}
              </span>
            </div>
            
            {tabState?.fieldsDetected ? (
              <p className="text-sm text-gray-500">
                {tabState.fieldsDetected} form field{tabState.fieldsDetected !== 1 ? 's' : ''} detected
              </p>
            ) : (
              <p className="text-sm text-gray-500">No form fields detected</p>
            )}
          </div>

          {/* Profile Status */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Profile</span>
              {profile ? (
                <span className="text-sm text-green-600">Ready</span>
              ) : (
                <span className="text-sm text-yellow-600">Not set up</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleAutofill}
              disabled={!tabState?.fieldsDetected || !profile || isAutofilling}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAutofilling ? 'Filling...' : 'Autofill Form'}
            </button>

            {tabState?.fieldsDetected ? (
              <button
                onClick={handleHighlightFields}
                className="w-full py-2 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
              >
                Highlight Fields
              </button>
            ) : null}

            <button
              onClick={handleOpenDashboard}
              className="w-full py-2 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
            >
              Open Dashboard
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              JobFlow Autofill v1.0.0
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Settings View
// ============================================================================

function SettingsView({ onBack }: { onBack: () => void }) {
  const [autoDetect, setAutoDetect] = useState(true)
  const [showNotifications, setShowNotifications] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await chrome.storage.local.get('settings')
    if (result.settings) {
      setAutoDetect(result.settings.autoDetect ?? true)
      setShowNotifications(result.settings.showNotifications ?? true)
    }
  }

  const saveSettings = async (key: string, value: boolean) => {
    const result = await chrome.storage.local.get('settings')
    const settings = result.settings || {}
    settings[key] = value
    await chrome.storage.local.set({ settings })
    
    if (key === 'autoDetect') setAutoDetect(value)
    if (key === 'showNotifications') setShowNotifications(value)
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-lg font-semibold mb-4">Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Auto-detect forms</p>
            <p className="text-xs text-gray-500">Automatically detect job application forms</p>
          </div>
          <button
            onClick={() => saveSettings('autoDetect', !autoDetect)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoDetect ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoDetect ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Notifications</p>
            <p className="text-xs text-gray-500">Show notifications after autofill</p>
          </div>
          <button
            onClick={() => saveSettings('showNotifications', !showNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showNotifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Render
// ============================================================================

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<PopupApp />)
