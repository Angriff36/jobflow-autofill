// Background service worker for JobFlow Autofill extension

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PROFILE') {
    // Retrieve profile from storage and send back
    chrome.storage.local.get(['userProfile'], (result) => {
      sendResponse({ profile: result.userProfile || null })
    })
    return true // Keep message channel open for async response
  }

  if (message.type === 'SAVE_APPLICATION') {
    // Save application data
    chrome.storage.local.get(['applications'], (result) => {
      const applications = result.applications || []
      applications.push(message.application)
      chrome.storage.local.set({ applications }, () => {
        sendResponse({ success: true })
      })
    })
    return true
  }

  if (message.type === 'GET_FORM_SCHEMAS') {
    chrome.storage.local.get(['formSchemas'], (result) => {
      sendResponse({ schemas: result.formSchemas || [] })
    })
    return true
  }
})

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize default storage
    chrome.storage.local.set({
      userProfile: null,
      applications: [],
      formSchemas: [],
      settings: {
        autofill: {
          confirmBeforeFill: true,
          autoSubmit: false
        }
      }
    })
  }
})
