/// <reference types="chrome" />

// ============================================================================
// JobFlow Autofill - Content Script
// Detects and auto-fills job application forms
// ============================================================================

;(function () {
  'use strict'

  // ============================================================================
  // Types
  // ============================================================================

  interface DetectedField {
    selector: string
    name: string
    type: string
    label?: string
    placeholder?: string
    suggestedMapping: string | null
  }

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
    [key: string]: unknown
  }

  // ============================================================================
  // Field Patterns - regex patterns for matching field names/ids
  // ============================================================================

  const FIELD_PATTERNS: Record<string, RegExp[]> = {
    // Personal Info
    firstName: [
      /^(first_?name|firstname|first_name|given_?name|fname)$/i,
      /^name_first$/i,
    ],
    lastName: [
      /^(last_?name|lastname|last_name|family_?name|surname|lname)$/i,
      /^name_last$/i,
    ],
    fullName: [
      /^(full_?name|fullname|full_name|name|your_?name)$/i,
      /^applicant_?name$/i,
    ],
    email: [
      /^(email|email_?address|e_?mail|user_?email|login_?email)$/i,
      /^email_address$/i,
    ],
    phone: [
      /^(phone|mobile|cell|telephone|tel|phone_?number|contact_?phone|phone_?primary)$/i,
      /^mobile_?number$/i,
    ],

    // Address
    address: [
      /^(address|street|street_?address|addr|address1|address_?line_?1)$/i,
    ],
    address2: [
      /^(address2|address_?line_?2|apartment|suite|unit|apt)$/i,
    ],
    city: [
      /^(city|town|location|city_?name)$/i,
    ],
    state: [
      /^(state|province|region|state_?province|state_?code)$/i,
    ],
    zip: [
      /^(zip|zip_?code|postal|postal_?code|postcode)$/i,
    ],
    country: [
      /^(country|nation|nationality|country_?code|country_?name)$/i,
    ],

    // Professional
    linkedIn: [
      /^(linkedin|linked_?in|linkedin_?url|linkedin_?profile)$/i,
    ],
    portfolio: [
      /^(portfolio|website|personal_?site|web_?site|url|homepage)$/i,
    ],
    github: [
      /^(github|github_?url|github_?profile)$/i,
    ],

    // Work History
    company: [
      /^(company|employer|company_?name|organization|org|current_?company)$/i,
    ],
    jobTitle: [
      /^(title|job_?title|position|role|current_?title|designation)$/i,
    ],

    // Education
    school: [
      /^(school|university|college|institution|education_?institution)$/i,
    ],
    degree: [
      /^(degree|education_?level|degree_?type)$/i,
    ],
    major: [
      /^(major|field|field_?of_?study|area_?of_?study)$/i,
    ],

    // Other
    coverLetter: [
      /^(cover_?letter|coverletter|message|additional_?info)$/i,
    ],
    resume: [
      /^(resume|cv|curriculum|resume_?file|cv_?file)$/i,
    ],
  }

  // Looser patterns for matching label text (not anchored)
  const LABEL_PATTERNS: Record<string, RegExp[]> = {
    firstName: [/first\s*name/i, /given\s*name/i],
    lastName: [/last\s*name/i, /family\s*name/i, /surname/i],
    fullName: [/full\s*name/i, /your\s*name/i, /^name$/i],
    email: [/e[\s-]*mail/i],
    phone: [/phone/i, /mobile/i, /telephone/i, /cell/i],
    address: [/street\s*address/i, /address\s*(line)?\s*1/i, /^address$/i],
    address2: [/address\s*(line)?\s*2/i, /apartment/i, /suite/i, /unit/i],
    city: [/^city$/i, /^town$/i],
    state: [/^state$/i, /province/i, /^region$/i],
    zip: [/zip/i, /postal/i, /postcode/i],
    country: [/country/i],
    linkedIn: [/linkedin/i],
    portfolio: [/portfolio/i, /personal\s*(web)?site/i],
    github: [/github/i],
    company: [/company/i, /employer/i, /organization/i],
    jobTitle: [/job\s*title/i, /position/i, /current\s*title/i, /^title$/i, /^role$/i],
    school: [/school/i, /university/i, /college/i, /institution/i],
    degree: [/degree/i, /education\s*level/i],
    major: [/major/i, /field\s*of\s*study/i],
    coverLetter: [/cover\s*letter/i],
    resume: [/resume/i, /^cv$/i],
  }

  // Map form field keys to profile data paths
  const FIELD_TO_PROFILE_MAP: Record<string, string> = {
    firstName: 'personal.firstName',
    lastName: 'personal.lastName',
    fullName: '__fullName__', // Special handling for concatenation
    email: 'personal.email',
    phone: 'personal.phone',
    address: 'personal.location.address',
    city: 'personal.location.city',
    state: 'personal.location.state',
    zip: 'personal.location.zip',
    country: 'personal.location.country',
    linkedIn: 'personal.linkedIn',
    portfolio: 'personal.portfolio',
    github: 'personal.website',
  }

  // ============================================================================
  // Form Detection
  // ============================================================================

  function detectFields(): DetectedField[] {
    const fields: DetectedField[] = []
    const seen = new Set<string>()

    const inputs = document.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]),' +
      'select,' +
      'textarea'
    )

    inputs.forEach((element) => {
      const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

      const selector = getUniqueSelector(input)
      if (seen.has(selector)) return
      seen.add(selector)

      const name = input.name || input.id || ''
      const type = input.type || 'text'
      const label = findLabel(input)
      const placeholder = input.placeholder || ''

      // Skip file inputs (handled separately for resume upload)
      if (type === 'file') return

      const matchedField = matchField(name, label, placeholder)

      fields.push({
        selector,
        name,
        type,
        label,
        placeholder,
        suggestedMapping: matchedField ? FIELD_TO_PROFILE_MAP[matchedField] || null : null,
      })
    })

    return fields
  }

  function getUniqueSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${CSS.escape(element.id)}`
    }

    const path: string[] = []
    let current: HTMLElement | null = element

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase()

      if (current.id) {
        selector = `#${CSS.escape(current.id)}`
        path.unshift(selector)
        break
      }

      const siblings = current.parentElement?.children
      if (siblings && siblings.length > 1) {
        const index = Array.from(siblings).indexOf(current) + 1
        selector += `:nth-child(${index})`
      }

      path.unshift(selector)
      current = current.parentElement
    }

    return path.join(' > ')
  }

  function findLabel(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
    // Check for associated label via for attribute
    if (input.id) {
      const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`)
      if (label) return label.textContent?.trim() || ''
    }

    // Check parent label
    const parentLabel = input.closest('label')
    if (parentLabel) {
      // Get label text excluding the input's own text
      const clone = parentLabel.cloneNode(true) as HTMLElement
      const inputs = clone.querySelectorAll('input, select, textarea')
      inputs.forEach(el => el.remove())
      return clone.textContent?.trim() || ''
    }

    // Check aria-label
    const ariaLabel = input.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel

    // Check aria-labelledby
    const labelledBy = input.getAttribute('aria-labelledby')
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy)
      if (labelEl) return labelEl.textContent?.trim() || ''
    }

    // Check previous sibling labels
    let prev = input.previousElementSibling
    while (prev) {
      if (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV') {
        const text = prev.textContent?.trim()
        if (text && text.length < 100) return text
      }
      prev = prev.previousElementSibling
    }

    return ''
  }

  function matchField(name: string, label: string, placeholder: string): string | null {
    // First try strict patterns against name/id attributes
    for (const [fieldName, patterns] of Object.entries(FIELD_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(name)) {
          return fieldName
        }
      }
    }

    // Then try strict patterns against placeholder
    for (const [fieldName, patterns] of Object.entries(FIELD_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(placeholder)) {
          return fieldName
        }
      }
    }

    // Finally try looser label-text patterns
    if (label) {
      for (const [fieldName, patterns] of Object.entries(LABEL_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(label)) {
            return fieldName
          }
        }
      }
    }

    // Try looser patterns against placeholder text too
    if (placeholder) {
      for (const [fieldName, patterns] of Object.entries(LABEL_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(placeholder)) {
            return fieldName
          }
        }
      }
    }

    return null
  }

  // ============================================================================
  // Autofill
  // ============================================================================

  function performAutofill(fields: DetectedField[], profile: Profile): number {
    let filledCount = 0

    for (const field of fields) {
      if (!field.suggestedMapping) continue

      // Resolve the DOM element from the selector
      let element: HTMLElement | null = null
      try {
        element = document.querySelector<HTMLElement>(field.selector)
      } catch {
        continue
      }
      if (!element) continue

      // Get the value from the profile
      let value: unknown
      if (field.suggestedMapping === '__fullName__') {
        // Special handling: concatenate first + last name
        const first = profile.personal?.firstName || ''
        const last = profile.personal?.lastName || ''
        value = [first, last].filter(Boolean).join(' ')
      } else {
        value = getNestedValue(profile, field.suggestedMapping)
      }

      if (!value && value !== 0) continue

      const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      const stringValue = String(value)

      // Handle different input types
      if (input.tagName === 'SELECT') {
        if (!fillSelect(input as HTMLSelectElement, stringValue)) continue
      } else if (input.type === 'checkbox') {
        ;(input as HTMLInputElement).checked = Boolean(value)
      } else if (input.type === 'radio') {
        if (!fillRadio(input as HTMLInputElement, stringValue)) continue
      } else {
        // Text input, textarea
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, stringValue)
        } else {
          input.value = stringValue
        }
      }

      // Dispatch events to trigger framework reactivity (React, Angular, Vue, etc.)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.dispatchEvent(new Event('blur', { bubbles: true }))

      filledCount++
    }

    return filledCount
  }

  function fillSelect(select: HTMLSelectElement, value: string): boolean {
    const lowerValue = value.toLowerCase()

    // Try exact match first
    for (const option of select.options) {
      if (option.value.toLowerCase() === lowerValue ||
          option.textContent?.trim().toLowerCase() === lowerValue) {
        select.value = option.value
        return true
      }
    }

    // Try partial match
    for (const option of select.options) {
      if (option.value.toLowerCase().includes(lowerValue) ||
          option.textContent?.trim().toLowerCase().includes(lowerValue)) {
        select.value = option.value
        return true
      }
    }

    return false
  }

  function fillRadio(input: HTMLInputElement, value: string): boolean {
    const name = input.name
    if (!name) return false

    const lowerValue = value.toLowerCase()
    const radios = document.querySelectorAll<HTMLInputElement>(
      `input[type="radio"][name="${CSS.escape(name)}"]`
    )

    for (const radio of radios) {
      const radioLabel = findLabel(radio)
      if (radio.value.toLowerCase() === lowerValue ||
          radioLabel.toLowerCase() === lowerValue) {
        radio.checked = true
        radio.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      }
    }

    return false
  }

  function getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && key in current
        ? (current as Record<string, unknown>)[key]
        : null
    }, obj)
  }

  // ============================================================================
  // Visual Feedback
  // ============================================================================

  function highlightFields(selectors: string[]): void {
    clearHighlights()

    selectors.forEach(selector => {
      try {
        const element = document.querySelector<HTMLElement>(selector)
        if (element) {
          element.style.outline = '2px solid #3B82F6'
          element.style.outlineOffset = '2px'
          element.style.transition = 'outline 0.2s ease'
          element.classList.add('jobflow-highlighted')
        }
      } catch {
        // Invalid selector, skip
      }
    })
  }

  function clearHighlights(): void {
    document.querySelectorAll<HTMLElement>('.jobflow-highlighted').forEach(el => {
      el.style.outline = ''
      el.style.outlineOffset = ''
      el.classList.remove('jobflow-highlighted')
    })
  }

  // ============================================================================
  // Message Handling
  // ============================================================================

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'DETECT_FIELDS': {
        const fields = detectFields()
        sendResponse({
          success: true,
          data: {
            fields: fields.map(f => ({
              selector: f.selector,
              name: f.name,
              type: f.type,
              label: f.label,
              placeholder: f.placeholder,
              suggestedMapping: f.suggestedMapping,
            })),
            url: window.location.href,
            domain: window.location.hostname,
          },
        })
        break
      }

      case 'PERFORM_AUTOFILL': {
        // Re-detect fields to get fresh selectors, then merge with provided mappings
        const currentFields = detectFields()
        const profile = message.payload?.profile as Profile
        if (!profile) {
          sendResponse({ success: false, error: 'No profile provided' })
          break
        }

        // Use provided fields if they have mappings, otherwise use detected
        const fieldsToFill = message.payload?.fields?.length
          ? (message.payload.fields as DetectedField[])
          : currentFields

        const filledCount = performAutofill(fieldsToFill, profile)
        sendResponse({ success: true, data: { filledCount } })
        break
      }

      case 'HIGHLIGHT_FIELDS':
        highlightFields(message.payload?.selectors || [])
        sendResponse({ success: true })
        break

      case 'CLEAR_HIGHLIGHTS':
        clearHighlights()
        sendResponse({ success: true })
        break

      case 'WEBAPP_BROADCAST':
        // Forward messages from background to the page via postMessage
        // This enables communication between extension and web app
        window.postMessage({
          source: 'jobflow-extension',
          ...message.payload
        }, '*')
        sendResponse({ success: true })
        break

      default:
        sendResponse({ success: false, error: `Unknown message type: ${message.type}` })
    }

    return true
  })

  // ============================================================================
  // Web App Communication via postMessage
  // ============================================================================

  // Listen for messages from the web app page
  window.addEventListener('message', (event) => {
    // Only accept messages from the same page
    if (event.source !== window) return
    if (!event.data || event.data.source !== 'jobflow-webapp') return

    const { type, payload } = event.data

    // Forward relevant messages to the background service worker
    switch (type) {
      case 'SYNC_PROFILE':
        chrome.runtime.sendMessage({
          type: 'SAVE_PROFILE',
          payload
        }).catch(() => {})
        break

      case 'REQUEST_PROFILE':
        chrome.runtime.sendMessage({ type: 'GET_PROFILE' }).then((response) => {
          if (response?.success) {
            window.postMessage({
              source: 'jobflow-extension',
              type: 'PROFILE_DATA',
              payload: response.data
            }, '*')
          }
        }).catch(() => {})
        break

      case 'LOG_APPLICATION':
        chrome.runtime.sendMessage({
          type: 'LOG_APPLICATION',
          payload
        }).catch(() => {})
        break
    }
  })

  // ============================================================================
  // BroadcastChannel for cross-tab communication
  // ============================================================================

  let broadcastChannel: BroadcastChannel | null = null
  try {
    broadcastChannel = new BroadcastChannel('jobflow-sync')

    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data || {}

      if (type === 'PROFILE_UPDATED') {
        // Forward profile update to background
        chrome.runtime.sendMessage({
          type: 'SAVE_PROFILE',
          payload
        }).catch(() => {})
      }
    }
  } catch {
    // BroadcastChannel not supported, fall back to postMessage only
  }

  // ============================================================================
  // Page Load Detection
  // ============================================================================

  // Notify background that content script is ready
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    payload: {
      url: window.location.href,
      domain: window.location.hostname,
    },
  }).catch(() => {
    // Extension context may not be ready yet
  })

  // Auto-detect forms on page load
  window.addEventListener('load', () => {
    const fields = detectFields()
    if (fields.length > 0) {
      chrome.runtime.sendMessage({
        type: 'FORM_DETECTED',
        payload: {
          fieldCount: fields.length,
          url: window.location.href,
        },
      }).catch(() => {})
    }
  })

  console.log('JobFlow Autofill: Content script loaded')
})()
