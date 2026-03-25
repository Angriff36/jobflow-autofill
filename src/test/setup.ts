// ============================================================================
// Test Setup - Global mocks and utilities
// ============================================================================

import { vi } from 'vitest'

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
}

vi.stubGlobal('indexedDB', indexedDB)

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${Math.random().toString(36).substring(7)}`
})

// Mock window
vi.stubGlobal('window', {
  location: { href: '', origin: 'http://localhost' },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
})

// Mock BroadcastChannel
vi.stubGlobal('BroadcastChannel', vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  onmessage: null,
  close: vi.fn()
})))

// Mock notifications
vi.stubGlobal('Notification', vi.fn().mockImplementation(() => ({
  close: vi.fn()
})))

// Silence console errors in tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {})
