// ============================================================================
// Profile API - User Profile Management
// Handles the user's job search profile (resume data, experience, etc.)
// ============================================================================

import { profileRepository } from '../storage/db'
import type { 
  UserProfile, 
  PersonalInfo, 
  WorkExperience, 
  Education, 
  Document, 
  SavedAnswer 
} from '../types'

// ============================================================================
// Types
// ============================================================================

export interface UpdateProfileInput {
  personal?: Partial<PersonalInfo>
  workExperience?: WorkExperience[]
  education?: Education[]
  skills?: string[]
  documents?: Document[]
  answers?: SavedAnswer[]
}

export interface AddExperienceInput {
  company: string
  title: string
  location: string
  startDate: string
  endDate: string | null
  description: string
}

export interface AddEducationInput {
  institution: string
  degree: string
  field: string
  graduationDate: string
  gpa?: string
}

export interface AddDocumentInput {
  name: string
  type: 'resume' | 'cover-letter' | 'other'
  content: string // Base64
  mimeType: string
}

export interface AddAnswerInput {
  question: string
  answer: string
  tags?: string[]
}

// ============================================================================
// Profile API
// ============================================================================

export const profileApi = {
  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  /**
   * Get the user's profile
   */
  async get(): Promise<UserProfile | undefined> {
    return profileRepository.get()
  },

  /**
   * Create a new profile
   */
  async create(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return profileRepository.create(profile)
  },

  /**
   * Update the entire profile
   */
  async save(profile: UserProfile): Promise<string> {
    return profileRepository.save(profile)
  },

  /**
   * Delete the profile
   */
  async delete(): Promise<void> {
    return profileRepository.delete()
  },

  // ---------------------------------------------------------------------------
  // Partial Updates
  // ---------------------------------------------------------------------------

  /**
   * Update personal information
   */
  async updatePersonal(personal: Partial<PersonalInfo>): Promise<UserProfile> {
    const profile = await this.getOrCreate()
    
    profile.personal = { ...profile.personal, ...personal }
    await profileRepository.save(profile)
    
    return profile
  },

  /**
   * Update skills
   */
  async updateSkills(skills: string[]): Promise<UserProfile> {
    const profile = await this.getOrCreate()
    
    profile.skills = skills
    await profileRepository.save(profile)
    
    return profile
  },

  // ---------------------------------------------------------------------------
  // Work Experience
  // ---------------------------------------------------------------------------

  /**
   * Add work experience
   */
  async addExperience(input: AddExperienceInput): Promise<WorkExperience> {
    const profile = await this.getOrCreate()
    
    const experience: WorkExperience = {
      id: crypto.randomUUID(),
      company: input.company,
      title: input.title,
      location: input.location,
      startDate: input.startDate,
      endDate: input.endDate,
      description: input.description
    }

    profile.workExperience.push(experience)
    await profileRepository.save(profile)

    return experience
  },

  /**
   * Update work experience
   */
  async updateExperience(id: string, updates: Partial<Omit<WorkExperience, 'id'>>): Promise<WorkExperience | null> {
    const profile = await this.getOrCreate()
    
    const index = profile.workExperience.findIndex(e => e.id === id)
    if (index === -1) return null

    profile.workExperience[index] = {
      ...profile.workExperience[index],
      ...updates
    }

    await profileRepository.save(profile)
    return profile.workExperience[index]
  },

  /**
   * Remove work experience
   */
  async removeExperience(id: string): Promise<boolean> {
    const profile = await this.getOrCreate()
    
    const index = profile.workExperience.findIndex(e => e.id === id)
    if (index === -1) return false

    profile.workExperience.splice(index, 1)
    await profileRepository.save(profile)

    return true
  },

  /**
   * Reorder work experience
   */
  async reorderExperience(fromIndex: number, toIndex: number): Promise<WorkExperience[]> {
    const profile = await this.getOrCreate()
    
    const [item] = profile.workExperience.splice(fromIndex, 1)
    profile.workExperience.splice(toIndex, 0, item)
    
    await profileRepository.save(profile)
    
    return profile.workExperience
  },

  // ---------------------------------------------------------------------------
  // Education
  // ---------------------------------------------------------------------------

  /**
   * Add education
   */
  async addEducation(input: AddEducationInput): Promise<Education> {
    const profile = await this.getOrCreate()
    
    const education: Education = {
      id: crypto.randomUUID(),
      institution: input.institution,
      degree: input.degree,
      field: input.field,
      graduationDate: input.graduationDate,
      gpa: input.gpa
    }

    profile.education.push(education)
    await profileRepository.save(profile)

    return education
  },

  /**
   * Update education
   */
  async updateEducation(id: string, updates: Partial<Omit<Education, 'id'>>): Promise<Education | null> {
    const profile = await this.getOrCreate()
    
    const index = profile.education.findIndex(e => e.id === id)
    if (index === -1) return null

    profile.education[index] = {
      ...profile.education[index],
      ...updates
    }

    await profileRepository.save(profile)
    return profile.education[index]
  },

  /**
   * Remove education
   */
  async removeEducation(id: string): Promise<boolean> {
    const profile = await this.getOrCreate()
    
    const index = profile.education.findIndex(e => e.id === id)
    if (index === -1) return false

    profile.education.splice(index, 1)
    await profileRepository.save(profile)

    return true
  },

  // ---------------------------------------------------------------------------
  // Documents
  // ---------------------------------------------------------------------------

  /**
   * Add document
   */
  async addDocument(input: AddDocumentInput): Promise<Document> {
    const profile = await this.getOrCreate()
    
    const document: Document = {
      id: crypto.randomUUID(),
      name: input.name,
      type: input.type,
      content: input.content,
      mimeType: input.mimeType
    }

    profile.documents.push(document)
    await profileRepository.save(profile)

    return document
  },

  /**
   * Update document
   */
  async updateDocument(id: string, updates: Partial<Omit<Document, 'id'>>): Promise<Document | null> {
    const profile = await this.getOrCreate()
    
    const index = profile.documents.findIndex(d => d.id === id)
    if (index === -1) return null

    profile.documents[index] = {
      ...profile.documents[index],
      ...updates
    }

    await profileRepository.save(profile)
    return profile.documents[index]
  },

  /**
   * Remove document
   */
  async removeDocument(id: string): Promise<boolean> {
    const profile = await this.getOrCreate()
    
    const index = profile.documents.findIndex(d => d.id === id)
    if (index === -1) return false

    profile.documents.splice(index, 1)
    await profileRepository.save(profile)

    return true
  },

  /**
   * Get primary resume
   */
  async getPrimaryResume(): Promise<Document | null> {
    const profile = await this.getOrCreate()
    
    // Find first resume document
    return profile.documents.find(d => d.type === 'resume') || null
  },

  // ---------------------------------------------------------------------------
  // Saved Answers
  // ---------------------------------------------------------------------------

  /**
   * Add saved answer
   */
  async addAnswer(input: AddAnswerInput): Promise<SavedAnswer> {
    const profile = await this.getOrCreate()
    
    const answer: SavedAnswer = {
      id: crypto.randomUUID(),
      question: input.question,
      answer: input.answer,
      tags: input.tags || []
    }

    profile.answers.push(answer)
    await profileRepository.save(profile)

    return answer
  },

  /**
   * Update saved answer
   */
  async updateAnswer(id: string, updates: Partial<Omit<SavedAnswer, 'id'>>): Promise<SavedAnswer | null> {
    const profile = await this.getOrCreate()
    
    const index = profile.answers.findIndex(a => a.id === id)
    if (index === -1) return null

    profile.answers[index] = {
      ...profile.answers[index],
      ...updates
    }

    await profileRepository.save(profile)
    return profile.answers[index]
  },

  /**
   * Remove saved answer
   */
  async removeAnswer(id: string): Promise<boolean> {
    const profile = await this.getOrCreate()
    
    const index = profile.answers.findIndex(a => a.id === id)
    if (index === -1) return false

    profile.answers.splice(index, 1)
    await profileRepository.save(profile)

    return true
  },

  /**
   * Search answers by question text or tags
   */
  async searchAnswers(query: string): Promise<SavedAnswer[]> {
    const profile = await this.getOrCreate()
    const lowerQuery = query.toLowerCase()

    return profile.answers.filter(a =>
      a.question.toLowerCase().includes(lowerQuery) ||
      a.answer.toLowerCase().includes(lowerQuery) ||
      a.tags.some(t => t.toLowerCase().includes(lowerQuery))
    )
  },

  // ---------------------------------------------------------------------------
  // Import/Export
  // ---------------------------------------------------------------------------

  /**
   * Export profile as JSON
   */
  async export(): Promise<string> {
    const profile = await this.getOrCreate()
    return JSON.stringify(profile, null, 2)
  },

  /**
   * Import profile from JSON
   */
  async import(json: string): Promise<UserProfile> {
    const data = JSON.parse(json)
    
    // Validate required fields
    if (!data.personal) {
      throw new Error('Invalid profile: missing personal info')
    }

    const profile: UserProfile = {
      id: crypto.randomUUID(),
      personal: data.personal,
      workExperience: data.workExperience || [],
      education: data.education || [],
      skills: data.skills || [],
      documents: data.documents || [],
      answers: data.answers || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await profileRepository.save(profile)
    return profile
  },

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Get profile or create empty one
   */
  async getOrCreate(): Promise<UserProfile> {
    let profile = await profileRepository.get()
    
    if (!profile) {
      profile = {
        id: crypto.randomUUID(),
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
        documents: [],
        answers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await profileRepository.create(profile)
    }

    return profile
  }
}
