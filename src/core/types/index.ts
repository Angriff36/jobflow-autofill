// Re-export auth types
export * from './auth'

// User Profile Types
export interface UserProfile {
  id: string
  personal: PersonalInfo
  workExperience: WorkExperience[]
  education: Education[]
  skills: string[]
  documents: Document[]
  answers: SavedAnswer[]
  createdAt: Date
  updatedAt: Date
}

export interface PersonalInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: Location
  linkedIn?: string
  portfolio?: string
  website?: string
}

export interface Location {
  address: string
  city: string
  state: string
  zip: string
  country: string
}

export interface WorkExperience {
  id: string
  company: string
  title: string
  location: string
  startDate: string
  endDate: string | null // null = current
  description: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  graduationDate: string
  gpa?: string
}

export interface Document {
  id: string
  name: string
  type: 'resume' | 'cover-letter' | 'other'
  content: string // Base64 or file path
  mimeType: string
}

export interface SavedAnswer {
  id: string
  question: string
  answer: string
  tags: string[]
}

// Application Types
export interface JobApplication {
  id: string
  company: string
  position: string
  source: string
  sourceUrl?: string
  appliedDate: string
  status: ApplicationStatus
  stage: PipelineStage
  nextAction?: NextAction
  notes: string
  contacts: Contact[]
  followUpDate?: string
  salary?: Salary
  createdAt: Date
  updatedAt: Date
}

export type ApplicationStatus = 'active' | 'archived' | 'deleted'
export type PipelineStage = 'applied' | 'interviewing' | 'offer' | 'rejected' | 'closed'

export interface NextAction {
  type: 'follow-up' | 'interview' | 'decision' | 'other'
  dueDate: string
  description: string
}

export interface Contact {
  id: string
  name: string
  role: string
  email?: string
  phone?: string
  notes: string
}

export interface Salary {
  amount: number
  currency: string
  frequency: 'hourly' | 'yearly'
}

// Form Schema Types
export interface FormSchema {
  id: string
  domain: string
  urlPattern: string
  fieldMappings: FieldMapping[]
  createdAt: Date
}

export interface FieldMapping {
  formField: string // CSS selector or name
  profileField: string // Path in UserProfile (e.g., "personal.firstName")
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
}

// Settings
export interface AppSettings {
  notifications: {
    enabled: boolean
    followUpReminderDays: number
  }
  autofill: {
    autoSubmit: boolean
    confirmBeforeFill: boolean
  }
  theme: 'light' | 'dark' | 'system'
}
