// Popup script for JobFlow Autofill extension

let currentProfile = null
let detectedFields = []

const statusEl = document.getElementById('status')
const detectBtn = document.getElementById('detectBtn')
const autofillBtn = document.getElementById('autofillBtn')
const fieldsContainer = document.getElementById('fieldsContainer')
const fieldsList = document.getElementById('fieldsList')

// Initialize popup
async function init() {
  try {
    // Get profile from storage
    const result = await chrome.storage.local.get(['userProfile'])
    currentProfile = result.userProfile

    if (currentProfile) {
      statusEl.textContent = `Profile loaded: ${currentProfile.personal?.firstName || 'Unknown'} ${currentProfile.personal?.lastName || ''}`
      statusEl.className = 'status success'
    } else {
      statusEl.textContent = 'No profile found. Please set up your profile in the web app.'
      statusEl.className = 'status warning'
    }
  } catch (error) {
    statusEl.textContent = 'Error loading profile'
    statusEl.className = 'status warning'
    console.error(error)
  }
}

// Detect fields on current page
detectBtn.addEventListener('click', async () => {
  statusEl.textContent = 'Detecting fields...'
  statusEl.className = 'status info'
  detectBtn.disabled = true

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'DETECT_FIELDS' })

    if (response && response.fields) {
      detectedFields = response.fields
      displayFields(response.fields)

      if (response.fields.length > 0) {
        statusEl.textContent = `Found ${response.fields.length} matching fields`
        statusEl.className = 'status success'
        autofillBtn.disabled = false
      } else {
        statusEl.textContent = 'No matching fields found on this page'
        statusEl.className = 'status warning'
        autofillBtn.disabled = true
      }
    }
  } catch (error) {
    statusEl.textContent = 'Error detecting fields. Make sure you are on a job application page.'
    statusEl.className = 'status warning'
    console.error(error)
  } finally {
    detectBtn.disabled = false
  }
})

// Autofill the form
autofillBtn.addEventListener('click', async () => {
  if (!currentProfile) {
    statusEl.textContent = 'No profile to autofill from'
    statusEl.className = 'status warning'
    return
  }

  statusEl.textContent = 'Filling form...'
  statusEl.className = 'status info'
  autofillBtn.disabled = true

  try {
    const [tab] = await chrome.tabs.sendMessage(tab.id, {
      type: 'AUTOFILL',
      profile: currentProfile
    })

    statusEl.textContent = 'Form autofilled!'
    statusEl.className = 'status success'
  } catch (error) {
    statusEl.textContent = 'Error autofilling form'
    statusEl.className = 'status warning'
    console.error(error)
  }
})

// Display detected fields
function displayFields(fields) {
  fieldsList.innerHTML = ''

  if (fields.length === 0) {
    fieldsContainer.style.display = 'none'
    return
  }

  fieldsContainer.style.display = 'block'

  fields.forEach((field) => {
    const item = document.createElement('div')
    item.className = 'field-item'
    item.innerHTML = `
      <span class="field-name">${field.name || field.label || 'Unknown'}</span>
      <span class="field-match">→ ${field.matchedField}</span>
    `
    fieldsList.appendChild(item)
  })
}

// Initialize on load
init()
