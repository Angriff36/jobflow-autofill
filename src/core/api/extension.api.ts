// ============================================================================
// Extension API - Browser Extension Backend Service
// Provides messaging interface between extension content scripts and the app
// ============================================================================

import type { UserProfile, JobApplication } from '../types'
import { profileApi } from './profile.api'
import { applicationsApi } from './applications.api'

// ============================================================================
// Message Types
// ============================================================================

export type ExtensionMessageType =
  | 'GET_PROFILE'
  | 'FILL_FORM'
  | 'DETECT_FORM'
  | 'SAVE_FORM_SCHEMA'
  | 'GET_APPLICATIONS'
  | 'CREATE_APPLICATION'
  | 'PING'

export interface ExtensionMessage {
  type: ExtensionMessageType
  payload?: unknown
}

export interface ExtensionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// Extension API
// ============================================================================

export const extensionApi = {
  /**
   * Handle incoming message from extension
   */
  async handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
    try {
      switch (message.type) {
        case 'PING':
          return { success: true, data: 'pong' }

        case 'GET_PROFILE':
          return await this.getProfile()

        case 'FILL_FORM':
          return await this.fillForm(message.payload as FillFormPayload)

        case 'DETECT_FORM':
          return await this.detectForm(message.payload as DetectFormPayload)

        case 'SAVE_FORM_SCHEMA':
          return await this.saveFormSchema(message.payload as SaveFormSchemaPayload)

        case 'GET_APPLICATIONS':
          return await this.getApplications()

        case 'CREATE_APPLICATION':
          return await this.createApplication(message.payload as CreateApplicationPayload)

        default:
          return { success: false, error: `Unknown message type: ${message.type}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async getProfile(): Promise<ExtensionResponse<UserProfile | null>> {
    const profile = await profileApi.get()
    return { success: true, data: profile || null }
  },

  async fillForm(payload: FillFormPayload): Promise<ExtensionResponse<FillResult>> {
    const profile = await profileApi.get()
    if (!profile) {
      return { success: false, error: 'No profile found' }
    }

    const filledFields: FilledField[] = []
    const failedFields: FailedField[] = []

    for (const field of payload.fields) {
      try {
        const value = this.getFieldValue(profile, field.mapping)
        if (value !== null && value !== undefined) {
          filledFields.push({
            selector: field.selector,
            value: String(value),
            name: field.name
          })
        }
      } catch (error) {
        failedFields.push({
          selector: field.selector,
          name: field.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      success: true,
      data: { filledFields, failedFields }
    }
  },

  async detectForm(payload: DetectFormPayload): Promise<ExtensionResponse<DetectedForm>> {
    // This would analyze the form structure
    // For now, return basic detection
    const detected: DetectedForm = {
      url: payload.url,
      domain: new URL(payload.url).hostname,
      fields: payload.detectedFields.map(f => ({
        selector: f.selector,
        name: f.name,
        type: f.type,
        suggestedMapping: this.suggestMapping(f.name, f.label, f.placeholder)
      })),
      confidence: 0.8
    }

    return { success: true, data: detected }
  },

  async saveFormSchema(payload: SaveFormSchemaPayload): Promise<ExtensionResponse<{ id: string }>> {
    const { db } = await import('../storage/db')
    
    const schema = {
      id: crypto.randomUUID(),
      domain: payload.domain,
      urlPattern: payload.urlPattern,
      fieldMappings: payload.fieldMappings,
      createdAt: new Date()
    }

    await db.formSchemas.add(schema)

    return { success: true, data: { id: schema.id } }
  },

  async getApplications(): Promise<ExtensionResponse<JobApplication[]>> {
    const applications = await applicationsApi.getAll()
    return { success: true, data: applications }
  },

  async createApplication(payload: CreateApplicationPayload): Promise<ExtensionResponse<JobApplication>> {
    const application = await applicationsApi.create({
      company: payload.company,
      position: payload.position,
      source: payload.source || 'manual',
      sourceUrl: payload.sourceUrl,
      appliedDate: payload.appliedDate || new Date().toISOString().split('T')[0],
      status: 'active',
      stage: 'applied'
    })

    return { success: true, data: application }
  },

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  getFieldValue(profile: UserProfile, mapping: string): unknown {
    const parts = mapping.split('.')
    let value: unknown = profile

    for (const part of parts) {
      if (value === null || value === undefined) return null
      value = (value as Record<string, unknown>)[part]
    }

    return value
  },

  suggestMapping(name: string, label?: string, placeholder?: string): string | null {
    const text = [name, label, placeholder].filter(Boolean).join(' ').toLowerCase()

    const mappings: Record<string, string> = {
      'first name': 'personal.firstName',
      'firstname': 'personal.firstName',
      'fname': 'personal.firstName',
      'last name': 'personal.lastName',
      'lastname': 'personal.lastName',
      'lname': 'personal.lastName',
      'full name': 'personal.firstName',
      'email': 'personal.email',
      'e-mail': 'personal.email',
      'phone': 'personal.phone',
      'telephone': 'personal.phone',
      'mobile': 'personal.phone',
      'address': 'personal.location.address',
      'street': 'personal.location.address',
      'city': 'personal.location.city',
      'state': 'personal.location.state',
      'zip': 'personal.location.zip',
      'postal': 'personal.location.zip',
      'country': 'personal.location.country',
      'linkedin': 'personal.linkedIn',
      'portfolio': 'personal.portfolio',
      'website': 'personal.website',
      'github': 'personal.website'
    }

    for (const [keyword, mapping] of Object.entries(mappings)) {
      if (text.includes(keyword)) {
        return mapping
      }
    }

    return null
  }
}

// ============================================================================
// Types
// ============================================================================

export interface FillFormPayload {
  fields: Array<{
    selector: string
    name: string
    mapping: string
  }>
}

export interface FillResult {
  filledFields: FilledField[]
  failedFields: FailedField[]
}

export interface FilledField {
  selector: string
  value: string
  name: string
}

export interface FailedField {
  selector: string
  name: string
  error: string
}

export interface DetectFormPayload {
  url: string
  detectedFields: Array<{
    selector: string
    name: string
    type: string
    label?: string
    placeholder?: string
  }>
}

export interface DetectedForm {
  url: string
  domain: string
  fields: Array<{
    selector: string
    name: string
    type: string
    suggestedMapping: string | null
  }>
  confidence: number
}

export interface SaveFormSchemaPayload {
  domain: string
  urlPattern: string
  fieldMappings: Array<{
    formField: string
    profileField: string
    transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  }>
}

export interface CreateApplicationPayload {
  company: string
  position: string
  source?: string
  sourceUrl?: string
  appliedDate?: string
}
