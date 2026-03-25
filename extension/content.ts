/// <reference types="chrome" />

// ============================================================================
// JobFlow Autofill - Content Script
// Detects and auto-fills job application forms
// ============================================================================

(function () {
  'use strict'

  // ============================================================================
  // Types
  // ============================================================================

  interface FieldMapping {
    formField: string
    profileField: string
    transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  }

  interface DetectedField {
    selector: string
    name: string
    type: string
    label?: string
    placeholder?: string
    suggestedMapping: string | null
    element?: HTMLElement
  }

  interface FormSchema {
    id: string
    domain: string
    urlPattern: string
    fieldMappings: FieldMapping[]
  }

  // ============================================================================
  // Field Patterns
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

  // Map form fields to profile paths
  const FIELD_TO_PROFILE_MAP: Record<string, string> = {
    firstName: 'personal.firstName',
    lastName: 'personal.lastName',
    fullName: 'personal.firstName', // Will need special handling
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

    // Get all input-like elements
    const inputs = document.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]),' +
      'select,' +
      'textarea'
    )

    inputs.forEach((element) => {
      const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      
      // Generate unique identifier
      const selector = getUniqueSelector(input)
      if (seen.has(selector)) return
      seen.add(selector)

      // Get field attributes
      const name = input.name || input.id || ''
      const type = input.type || 'text'
      const label = findLabel(input)
      const placeholder = input.placeholder || ''

      // Skip file inputs for now (handled separately)
      if (type === 'file') return

      // Match to profile field
      const matchedField = matchField(name, label, placeholder)

      fields.push({
        selector,
        name,
        type,
        label,
        placeholder,
        suggestedMapping: matchedField ? FIELD_TO_PROFILE_MAP[matchedField] || null : null,
        element: input,
      })
    })

    return fields
  }

  function getUniqueSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`
    }

    const path: string[] = []
    let current: HTMLElement | null = element

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase()
      
      if (current.id) {
        selector = `#${current.id}`
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
    // Check for associated label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`)
      if (label) return label.textContent?.trim() || ''
    }

    // Check parent label
    const parentLabel = input.closest('label')
    if (parentLabel) {
      return parentLabel.textContent?.trim() || ''
    }

    // Check aria-label
    if (input.getAttribute('aria-label')) {
      return input.getAttribute('aria-label') || ''
    }

    // Check previous sibling
    let prev = input.previousElementSibling
    while (prev) {
      if (prev.tagName === 'LABEL') {
        return prev.textContent?.trim() || ''
      }
      prev = prev.previousElementSibling
    }

    return ''
  }

  function matchField(name: string, label: string, placeholder: string): string | null {
    const searchText = [name, label, placeholder].join(' ').toLowerCase()

    for (const [fieldName, patterns] of Object.entries(FIELD_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(name) || pattern.test(label) || pattern.test(placeholder)) {
          return fieldName
        }
      }
    }

    return null
  }

  // ============================================================================
  // Autofill
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
    [key: string]: unknown
  }

  async function autofill(fields: DetectedField[], profile: Profile): Promise<number> {
    let filledCount = 0

    for (const field of fields) {
      if (!field.suggestedMapping || !field.element) continue

      const value = getNestedValue(profile, field.suggestedMapping)
      if (!value && value !== 0) continue

      const input = field.element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      const stringValue = String(value)

      // Handle different input types
      if (input.tagName === 'SELECT') {
        filledCount += await fillSelect(input as HTMLSelectElement, stringValue) ? 1 : 0
      } else if (input.type === 'checkbox') {
        (input as HTMLInputElement).checked = Boolean(value)
        filledCount++
      } else if (input.type === 'radio') {
        filledCount += await fillRadio(input as HTMLInputElement, stringValue) ? 1 : 0
      } else {
        // Text input, textarea
        input.value = stringValue
        filledCount++
      }

      // Trigger events
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.dispatchEvent(new Event('blur', { bubbles: true }))
    }

    return filledCount
  }

  async function fillSelect(select: HTMLSelectElement, value: string): Promise<boolean> {
    // Try exact match first
    for (const option of select.options) {
      if (option.value.toLowerCase() === value.toLowerCase() ||
          option.textContent?.toLowerCase() === value.toLowerCase()) {
        select.value = option.value
        return true
      }
    }

    // Try partial match
    for (const option of select.options) {
      if (option.value.toLowerCase().includes(value.toLowerCase()) ||
          option.textContent?.toLowerCase().includes(value.toLowerCase())) {
        select.value = option.value
        return true
      }
    }

    return false
  }

  async function fillRadio(input: HTMLInputElement, value: string): Promise<boolean> {
    const name = input.name
    if (!name) return false

    const radios = document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`)
    for (const radio of radios) {
      if (radio.value.toLowerCase() === value.toLowerCase() ||
          radio.textContent?.toLowerCase() === value.toLowerCase()) {
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
  // Message Handling
  // ============================================================================

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'DETECT_FIELDS':
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

      case 'PERFORM_AUTOFILL':
        const result = autofill(message.payload.fields, message.payload.profile)
        result.then((filledCount) => {
          sendResponse({ success: true, data: { filledCount } })
        })
        return true // Keep channel open for async

      case 'HIGHLIGHT_FIELDS':
        highlightFields(message.payload.selectors)
        sendResponse({ success: true })
        break

      case 'CLEAR_HIGHLIGHTS':
        clearHighlights()
        sendResponse({ success: true })
        break

      default:
        sendResponse({ success: false, error: `Unknown message type: ${message.type}` })
    }

    return true
  })

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
    // Extension context may not be ready yet, ignore
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
