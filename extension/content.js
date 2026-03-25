// Content script for form detection and autofill

(function() {
  'use strict'

  // Common field patterns for job applications
  const FIELD_PATTERNS = {
    firstName: /^(first_?name|firstname|first_name|given_?name)$/i,
    lastName: /^(last_?name|lastname|last_name|family_?name|surname)$/i,
    email: /^(email|email_?address|e_?mail)$/i,
    phone: /^(phone|mobile|cell|telephone|tel|phone_?number|contact_?phone)$/i,
    company: /^(company|employer|company_?name|organization|org)$/i,
    title: /^(title|job_?title|position|role|job_?title)$/i,
    address: /^(address|street|street_?address|addr|address1|address_1)$/i,
    city: /^(city|town|location|city_?name)$/i,
    state: /^(state|province|region|state_?province)$/i,
    zip: /^(zip|zip_?code|postal|postal_?code|postcode)$/i,
    country: /^(country|nation|nationality|country_?code)$/i,
    linkedIn: /^(linkedin|linked_?in|linkedin_?url)$/i,
    portfolio: /^(portfolio|website|personal_?site|web_?site|URL)$/i,
    resume: /^(resume|cv|curriculum|resume_?file|cv_?file)$/i
  }

  // Detect form fields on the page
  function detectFields() {
    const fields = []
    const forms = document.querySelectorAll('form')

    forms.forEach((form, formIndex) => {
      const inputs = form.querySelectorAll('input, select, textarea')

      inputs.forEach((input) => {
        const name = input.name || input.id || ''
        const label = findLabel(input) || input.placeholder || ''
        const type = input.type || 'text'

        // Skip hidden fields and buttons
        if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'file') {
          return
        }

        // Try to match field to profile field
        const matchedField = matchField(name, label)

        if (matchedField) {
          fields.push({
            element: input,
            name: name,
            label: label,
            type: type,
            matchedField: matchedField,
            formIndex: formIndex
          })
        }
      })
    })

    return fields
  }

  // Find label for an input element
  function findLabel(input) {
    // Check label element
    if (input.id) {
      const labels = document.querySelectorAll(`label[for="${input.id}"]`)
      if (labels.length > 0) {
        return labels[0].textContent.trim()
      }
    }

    // Check parent label
    const parentLabel = input.closest('label')
    if (parentLabel) {
      return parentLabel.textContent.trim()
    }

    // Check previous sibling
    const prevSibling = input.previousElementSibling
    if (prevSibling && prevSibling.tagName === 'LABEL') {
      return prevSibling.textContent.trim()
    }

    return ''
  }

  // Match field name/label to profile field
  function matchField(name, label) {
    const searchText = `${name} ${label}`.toLowerCase()

    for (const [fieldName, pattern] of Object.entries(FIELD_PATTERNS)) {
      if (pattern.test(name) || pattern.test(label)) {
        return fieldName
      }
    }

    return null
  }

  // Auto-fill fields with profile data
  function autofill(fields, profile) {
    fields.forEach((field) => {
      const value = getNestedValue(profile, field.matchedField)

      if (value) {
        const element = field.element

        // Set value
        element.value = value

        // Trigger change events
        element.dispatchEvent(new Event('input', { bubbles: true }))
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
  }

  // Get nested value from object using dot notation
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DETECT_FIELDS') {
      const fields = detectFields()
      sendResponse({ fields: fields })
    }

    if (message.type === 'AUTOFILL') {
      const fields = detectFields()
      autofill(fields, message.profile)
      sendResponse({ success: true, filledCount: fields.length })
    }

    return true
  })

  // Notify that content script is loaded
  console.log('JobFlow Autofill: Content script loaded')
})()
