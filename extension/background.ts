/// <reference types="chrome" />

// ============================================================================
// JobFlow Autofill - Extension Background Service Worker
// Handles extension lifecycle, messaging, and coordination with web app
// ============================================================================

// ============================================================================
// Types
// ============================================================================

interface Profile {
  personal: {
    firstName: string
    lastName: string
    email: string
    phone: string
    location: {
      address: string
      city: string
      state: string
      zip: string
      country: string
    }
    linkedIn?: string
    portfolio?: string
    website?: string
  }
  workExperience: Array<{
    id: string
    company: string
    title: string
    location: string
    startDate: string
    endDate: string | null
    description: string
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    graduationDate: string
    gpa?: string
  }>
  skills: string[]
  answers: Array<{
    id: string
    question: string
    answer: string
    tags: string[]
  }>
}

interface DetectedField {
  selector: string
  name: string
  type: string
  label?: string
  placeholder?: string
  suggestedMapping: string | null
}

interface FormSchema {
  id: string
  domain: string
  urlPattern: string
  fieldMappings: Array<{
    formField: string
    profileField: string
    transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  }>
  createdAt: Date
}

// ============================================================================
// Extension Installation
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('JobFlow Autofill installed')
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html?onboarding=true')
    })
  } else if (details.reason === 'update') {
    console.log('JobFlow Autofill updated to version', chrome.runtime.getManifest().version)
  }
})

// ============================================================================
// Message Handling
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handler error:', error)
      sendResponse({ success: false, error: error.message })
    })
  return true // Keep channel open for async response
})

async function handleMessage(
  message: { type: string; payload?: unknown },
  _sender: chrome.runtime.MessageSender
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  switch (message.type) {
    case 'GET_PROFILE':
      return getProfile()

    case 'SAVE_PROFILE':
      return saveProfile(message.payload as Profile)

    case 'AUTOFILL':
      return autofill(message.payload as { fields: DetectedField[] })

    case 'TRACK_FILL':
      return trackFill(message.payload as { count: number })

    case 'DETECT_FORM':
      return { success: true, data: { detected: true } }

    case 'SAVE_FORM_SCHEMA':
      return saveFormSchema(message.payload as FormSchema)

    case 'GET_FORM_SCHEMAS':
      return getFormSchemas(message.payload as { domain: string })

    case 'LOG_APPLICATION':
      return logApplication(message.payload as {
        company: string
        position: string
        sourceUrl: string
      })

    case 'SHOW_NOTIFICATION':
      return showNotification(message.payload as {
        title: string
        message: string
        type?: 'basic' | 'image' | 'list' | 'progress'
      })

    case 'GET_FILL_COUNT':
      return getFillCount()

    case 'CONTENT_SCRIPT_READY':
    case 'FORM_DETECTED':
      // Acknowledged - no action needed
      return { success: true }

    default:
      return { success: false, error: `Unknown message type: ${message.type}` }
  }
}

// ============================================================================
// Profile Operations
// ============================================================================

async function getProfile(): Promise<{ success: boolean; data?: Profile; error?: string }> {
  try {
    const result = await chrome.storage.local.get('profile')

    if (result.profile) {
      return { success: true, data: result.profile }
    }

    return {
      success: true,
      data: {
        personal: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          location: {
            address: '',
            city: '',
            state: '',
            zip: '',
            country: ''
          }
        },
        workExperience: [],
        education: [],
        skills: [],
        answers: []
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get profile'
    }
  }
}

async function saveProfile(profile: Profile): Promise<{ success: boolean; error?: string }> {
  try {
    await chrome.storage.local.set({ profile })
    // Broadcast profile update to any listening web app tabs
    broadcastToWebApp({ type: 'PROFILE_UPDATED', payload: profile })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save profile'
    }
  }
}

// ============================================================================
// Autofill Operations
// ============================================================================

async function autofill(payload: { fields: DetectedField[] }): Promise<{ success: boolean; filledCount?: number; error?: string }> {
  try {
    const profileResult = await getProfile()

    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: 'No profile found' }
    }

    const profile = profileResult.data
    let filledCount = 0

    for (const field of payload.fields) {
      if (field.suggestedMapping) {
        const value = getNestedValue(profile, field.suggestedMapping)
        if (value !== null && value !== undefined) {
          filledCount++
        }
      }
    }

    return { success: true, filledCount }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Autofill failed'
    }
  }
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' && key in current
      ? (current as Record<string, unknown>)[key]
      : null
  }, obj)
}

// ============================================================================
// Fill Count Tracking
// ============================================================================

function getUsageKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `usage_${year}_${month}`
}

async function trackFill(payload: { count: number }): Promise<{ success: boolean; data?: { total: number }; error?: string }> {
  try {
    const key = getUsageKey()
    const result = await chrome.storage.local.get(key)
    const current = (result[key] as number) || 0
    const total = current + payload.count
    await chrome.storage.local.set({ [key]: total })

    // Update badge text
    chrome.action.setBadgeText({ text: String(total) })
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' })

    return { success: true, data: { total } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track fill'
    }
  }
}

async function getFillCount(): Promise<{ success: boolean; data?: { count: number }; error?: string }> {
  try {
    const key = getUsageKey()
    const result = await chrome.storage.local.get(key)
    const count = (result[key] as number) || 0
    return { success: true, data: { count } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get fill count'
    }
  }
}

// Initialize badge with current fill count on startup
;(async () => {
  const key = getUsageKey()
  const result = await chrome.storage.local.get(key)
  const count = (result[key] as number) || 0
  if (count > 0) {
    chrome.action.setBadgeText({ text: String(count) })
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' })
  }
})()

// ============================================================================
// Form Schema Operations
// ============================================================================

async function saveFormSchema(schema: FormSchema): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await chrome.storage.local.get('formSchemas')
    const schemas: FormSchema[] = result.formSchemas || []

    const existingIndex = schemas.findIndex(s =>
      s.domain === schema.domain && s.urlPattern === schema.urlPattern
    )

    if (existingIndex >= 0) {
      schemas[existingIndex] = schema
    } else {
      schemas.push(schema)
    }

    await chrome.storage.local.set({ formSchemas: schemas })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save schema'
    }
  }
}

async function getFormSchemas(payload: { domain: string }): Promise<{ success: boolean; data?: FormSchema[]; error?: string }> {
  try {
    const result = await chrome.storage.local.get('formSchemas')
    const schemas: FormSchema[] = result.formSchemas || []
    const filtered = schemas.filter(s => s.domain === payload.domain)
    return { success: true, data: filtered }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get schemas'
    }
  }
}

// ============================================================================
// Application Logging
// ============================================================================

interface LoggedApplication {
  id: string
  company: string
  position: string
  sourceUrl: string
  appliedDate: string
  status: string
  stage: string
  createdAt: string
}

async function logApplication(payload: {
  company: string
  position: string
  sourceUrl: string
}): Promise<{ success: boolean; data?: LoggedApplication; error?: string }> {
  try {
    const result = await chrome.storage.local.get('applications')
    const applications: LoggedApplication[] = result.applications || []

    const newApplication: LoggedApplication = {
      id: crypto.randomUUID(),
      company: payload.company,
      position: payload.position,
      sourceUrl: payload.sourceUrl,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      stage: 'applied',
      createdAt: new Date().toISOString()
    }

    applications.unshift(newApplication)
    await chrome.storage.local.set({ applications })

    showNotification({
      title: 'Application Logged',
      message: `${payload.company} - ${payload.position}`
    })

    return { success: true, data: newApplication }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log application'
    }
  }
}

// ============================================================================
// Notifications
// ============================================================================

async function showNotification(payload: {
  title: string
  message: string
  type?: 'basic' | 'image' | 'list' | 'progress'
}): Promise<{ success: boolean; error?: string }> {
  try {
    await chrome.notifications.create({
      type: payload.type || 'basic',
      iconUrl: 'icons/icon128.png',
      title: payload.title,
      message: payload.message
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to show notification'
    }
  }
}

// ============================================================================
// Tab Update Listener - Auto-detect job application pages
// ============================================================================

const JOB_SITE_PATTERNS = [
  'greenhouse.io',
  'lever.co',
  'workday.com',
  'myworkdayjobs.com',
  'indeed.com',
  'linkedin.com/jobs',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
  'smartrecruiters.com',
  'jobvite.com',
  'icims.com',
  'taleo.net',
  'brassring.com',
  'careers',
  '/apply',
  '/application'
]

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url)
      const isJobSite = JOB_SITE_PATTERNS.some(pattern =>
        url.hostname.includes(pattern) || url.pathname.includes(pattern)
      )

      if (isJobSite) {
        chrome.action.setBadgeText({ text: '!', tabId })
        chrome.action.setBadgeBackgroundColor({ color: '#10B981', tabId })
      }
    } catch {
      // Invalid URL, skip
    }
  }
})

// ============================================================================
// Web App Communication via BroadcastChannel
// ============================================================================

// Listen for messages from web app pages via external messaging
chrome.runtime.onMessageExternal?.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ success: false, error: error.message })
    })
  return true
})

// Broadcast messages to web app tabs that have the JobFlow dashboard open
function broadcastToWebApp(message: { type: string; payload?: unknown }): void {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        // Send to tabs that might have the web app open
        chrome.tabs.sendMessage(tab.id, {
          type: 'WEBAPP_BROADCAST',
          payload: message
        }).catch(() => {
          // Tab doesn't have content script, ignore
        })
      }
    }
  })
}

// Listen for profile changes in storage and sync to web app
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.profile) {
    broadcastToWebApp({
      type: 'PROFILE_UPDATED',
      payload: changes.profile.newValue
    })
  }
})

console.log('JobFlow Autofill: Background service worker initialized')
