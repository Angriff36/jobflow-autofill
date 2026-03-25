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
    location?: {
      city?: string
      state?: string
    }
    linkedIn?: string
  }
  workExperience?: Array<{ company: string; title: string }>
  education?: Array<{ institution: string; degree: string }>
  skills?: string[]
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
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [fillCount, setFillCount] = useState(0)
  const [view, setView] = useState<'main' | 'settings' | 'profile'>('main')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (tab?.id) {
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
          setTabState({
            isJobSite: false,
            fieldsDetected: 0,
            domain: tab.url ? new URL(tab.url).hostname : 'Unknown',
            fields: [],
          })
        }
      }

      const result = await chrome.storage.local.get('profile')
      let loadedProfile = result.profile || null
      
      // If no profile in extension storage, try importing from web app via active tab
      if (!loadedProfile) {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
          if (tab?.id) {
            const webProfile = await chrome.tabs.sendMessage(tab.id, { type: 'GET_LOCAL_PROFILE' }).catch(() => null)
            if (webProfile?.data) {
              loadedProfile = webProfile.data
              // Save to extension storage for future use
              await chrome.storage.local.set({ profile: loadedProfile })
            }
          }
        } catch (_) { /* tab may not have content script */ }
      }
      setProfile(loadedProfile)

      // Load fill count for this month
      const fillResult = await chrome.runtime.sendMessage({ type: 'GET_FILL_COUNT' })
      if (fillResult?.success) {
        setFillCount(fillResult.data.count)
      }
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
          const count = response.data.filledCount
          setStatus({
            text: count > 0 ? `Filled ${count} field${count !== 1 ? 's' : ''}` : 'No fields could be filled',
            type: count > 0 ? 'success' : 'error'
          })
          if (count > 0) {
            // Track the fill count
            const trackResult = await chrome.runtime.sendMessage({ type: 'TRACK_FILL', payload: { count } })
            if (trackResult?.success) {
              setFillCount(trackResult.data.total)
            }
          }
          setTimeout(() => setStatus(null), 4000)
        } else {
          setStatus({ text: response?.error || 'Autofill failed', type: 'error' })
        }
      }
    } catch {
      setStatus({ text: 'Could not connect to page', type: 'error' })
    } finally {
      setIsAutofilling(false)
    }
  }

  const handleOpenDashboard = () => {
    setView('profile')
  }

  const handleHighlightFields = async () => {
    if (!tabState?.fields.length) return

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_FIELDS',
        payload: { selectors: tabState.fields.map(f => f.selector) },
      })
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid #e5e7eb',
          borderTopColor: '#2563eb', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>JobFlow</h1>
        <button
          onClick={() => setView(view === 'main' ? 'settings' : 'main')}
          style={{
            padding: '4px', background: 'none', border: 'none', cursor: 'pointer',
            borderRadius: '4px', display: 'flex'
          }}
          title="Settings"
        >
          <svg width="20" height="20" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {view === 'settings' ? (
        <SettingsView onBack={() => setView('main')} />
      ) : view === 'profile' ? (
        <ProfileSetupView onBack={() => setView('main')} onSaved={(p) => { setProfile(p); setView('main'); }} />
      ) : (
        <>
          {/* Status Message */}
          {status && (
            <div style={{
              marginBottom: '12px', padding: '10px 12px', borderRadius: '8px',
              backgroundColor: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              <p style={{
                margin: 0, fontSize: '13px',
                color: status.type === 'success' ? '#15803d' : '#b91c1c'
              }}>{status.text}</p>
            </div>
          )}

          {/* Quick Profile Summary */}
          <div style={{
            marginBottom: '12px', padding: '12px', backgroundColor: '#fff',
            borderRadius: '8px', border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Profile</span>
              {profile?.personal?.firstName ? (
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>Ready</span>
              ) : (
                <span style={{ fontSize: '12px', color: '#ca8a04', fontWeight: 500 }}>Not set up</span>
              )}
            </div>
            {profile?.personal?.firstName ? (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <p style={{ margin: '2px 0' }}>
                  {profile.personal.firstName} {profile.personal.lastName}
                </p>
                {profile.personal.email && (
                  <p style={{ margin: '2px 0' }}>{profile.personal.email}</p>
                )}
                {profile.personal.phone && (
                  <p style={{ margin: '2px 0' }}>{profile.personal.phone}</p>
                )}
                {profile.personal.location?.city && (
                  <p style={{ margin: '2px 0' }}>
                    {profile.personal.location.city}
                    {profile.personal.location.state ? `, ${profile.personal.location.state}` : ''}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p style={{ margin: '4px 0 8px', fontSize: '12px', color: '#9ca3af' }}>
                  Set up your profile to start autofilling
                </p>
                <button
                  onClick={handleOpenDashboard}
                  style={{
                    padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                    color: '#fff', backgroundColor: '#2563eb', border: 'none',
                    borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  Set up your profile
                </button>
              </div>
            )}
          </div>

          {/* Current Page Status */}
          <div style={{
            marginBottom: '12px', padding: '12px', backgroundColor: '#fff',
            borderRadius: '8px', border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block',
                backgroundColor: tabState?.isJobSite ? '#22c55e' : '#d1d5db'
              }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                {tabState?.domain || 'Unknown'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              {tabState?.fieldsDetected
                ? `${tabState.fieldsDetected} form field${tabState.fieldsDetected !== 1 ? 's' : ''} detected`
                : 'No form fields detected'}
            </p>
            {tabState && tabState.fieldsDetected > 0 && (
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                {tabState.fields.filter(f => f.suggestedMapping).length} can be auto-filled
              </p>
            )}
          </div>

          {/* Fill Count */}
          <div style={{
            marginBottom: '12px', padding: '8px 12px', backgroundColor: '#eff6ff',
            borderRadius: '8px', textAlign: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 500 }}>
              {fillCount} fill{fillCount !== 1 ? 's' : ''} this month
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleAutofill}
              disabled={!tabState?.fieldsDetected || !profile?.personal?.firstName || isAutofilling}
              style={{
                width: '100%', padding: '10px 16px', fontSize: '14px', fontWeight: 500,
                color: '#fff', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px',
                cursor: (!tabState?.fieldsDetected || !profile?.personal?.firstName || isAutofilling) ? 'not-allowed' : 'pointer',
                opacity: (!tabState?.fieldsDetected || !profile?.personal?.firstName || isAutofilling) ? 0.5 : 1,
                transition: 'background-color 0.15s'
              }}
            >
              {isAutofilling ? 'Filling...' : 'Autofill This Page'}
            </button>

            {tabState && tabState.fieldsDetected > 0 && (
              <button
                onClick={handleHighlightFields}
                style={{
                  width: '100%', padding: '10px 16px', fontSize: '14px', fontWeight: 500,
                  color: '#374151', backgroundColor: '#fff', border: '1px solid #d1d5db',
                  borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.15s'
                }}
              >
                Highlight Fields
              </button>
            )}

            <button
              onClick={handleOpenDashboard}
              style={{
                width: '100%', padding: '10px 16px', fontSize: '14px', fontWeight: 500,
                color: '#374151', backgroundColor: '#fff', border: '1px solid #d1d5db',
                borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.15s'
              }}
            >
              Open Dashboard
            </button>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
              JobFlow Autofill v1.0.0
            </p>
            <button
              onClick={handleOpenDashboard}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '11px', color: '#2563eb', textDecoration: 'underline', padding: 0
              }}
            >
              Settings
            </button>
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

  const toggleStyle = (active: boolean) => ({
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: active ? '#2563eb' : '#d1d5db',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'background-color 0.2s'
  })

  const toggleKnobStyle = (active: boolean) => ({
    display: 'block',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transform: active ? 'translateX(24px)' : 'translateX(4px)',
    transition: 'transform 0.2s'
  })

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px',
          color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, marginBottom: '16px'
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px' }}>Settings</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#374151' }}>Auto-detect forms</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>Automatically detect job application forms</p>
          </div>
          <button onClick={() => saveSettings('autoDetect', !autoDetect)} style={toggleStyle(autoDetect)}>
            <span style={toggleKnobStyle(autoDetect)} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#374151' }}>Notifications</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>Show notifications after autofill</p>
          </div>
          <button onClick={() => saveSettings('showNotifications', !showNotifications)} style={toggleStyle(showNotifications)}>
            <span style={toggleKnobStyle(showNotifications)} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Profile Setup View (inline in popup — works on all browsers)
// ============================================================================

function ProfileSetupView({ onBack, onSaved }: { onBack: () => void; onSaved: (p: Profile) => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    city: '', state: '', country: '',
    linkedIn: '', company: '', title: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    chrome.storage.local.get('profile', (result) => {
      const p = result.profile
      if (p?.personal) {
        setForm({
          firstName: p.personal.firstName || '',
          lastName: p.personal.lastName || '',
          email: p.personal.email || '',
          phone: p.personal.phone || '',
          city: p.personal.location?.city || '',
          state: p.personal.location?.state || '',
          country: p.personal.location?.country || '',
          linkedIn: p.personal.linkedIn || '',
          company: p.work?.currentCompany || '',
          title: p.work?.currentTitle || '',
        })
      }
    })
  }, [])

  const handleSave = async () => {
    if (!form.firstName || !form.email) return
    setSaving(true)
    const profile: Profile = {
      personal: {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone,
        location: { city: form.city, state: form.state },
        linkedIn: form.linkedIn,
      },
      workExperience: form.company ? [{ company: form.company, title: form.title }] : [],
    }
    // Also save in the extended format for autofill
    const extProfile = {
      personal: {
        ...profile.personal,
        location: { address: '', city: form.city, state: form.state, zip: '', country: form.country },
      },
      work: { currentCompany: form.company, currentTitle: form.title },
    }
    await chrome.storage.local.set({ profile: extProfile })
    setSaving(false)
    onSaved(profile)
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13px', marginBottom: '8px',
  }
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#6b7280', marginBottom: '2px' }

  return (
    <div>
      <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:'4px',fontSize:'13px',color:'#6b7280',background:'none',border:'none',cursor:'pointer',padding:0,marginBottom:'12px' }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>
      <h2 style={{ fontSize:'16px', fontWeight:600, margin:'0 0 12px' }}>Set Up Profile</h2>

      <div style={{ display:'flex', gap:'8px' }}>
        <div style={{ flex:1 }}><label style={labelStyle}>First Name *</label><input style={inputStyle} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Jane" /></div>
        <div style={{ flex:1 }}><label style={labelStyle}>Last Name</label><input style={inputStyle} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Doe" /></div>
      </div>
      <label style={labelStyle}>Email *</label><input style={inputStyle} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@example.com" type="email" />
      <label style={labelStyle}>Phone</label><input style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(555) 123-4567" />
      <div style={{ display:'flex', gap:'8px' }}>
        <div style={{ flex:2 }}><label style={labelStyle}>City</label><input style={inputStyle} value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="San Francisco" /></div>
        <div style={{ flex:1 }}><label style={labelStyle}>State</label><input style={inputStyle} value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="CA" /></div>
      </div>
      <label style={labelStyle}>Country</label><input style={inputStyle} value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="United States" />
      <label style={labelStyle}>LinkedIn</label><input style={inputStyle} value={form.linkedIn} onChange={e => setForm({...form, linkedIn: e.target.value})} placeholder="https://linkedin.com/in/you" />
      <div style={{ display:'flex', gap:'8px' }}>
        <div style={{ flex:1 }}><label style={labelStyle}>Company</label><input style={inputStyle} value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Acme Corp" /></div>
        <div style={{ flex:1 }}><label style={labelStyle}>Title</label><input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Engineer" /></div>
      </div>

      <button onClick={handleSave} disabled={!form.firstName || !form.email || saving} style={{
        width:'100%', padding:'10px', fontSize:'14px', fontWeight:600,
        color:'#fff', backgroundColor: (!form.firstName || !form.email) ? '#93c5fd' : '#2563eb',
        border:'none', borderRadius:'8px', cursor: (!form.firstName || !form.email) ? 'not-allowed' : 'pointer',
        marginTop:'4px',
      }}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  )
}

// ============================================================================
// Render
// ============================================================================

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<PopupApp />)
