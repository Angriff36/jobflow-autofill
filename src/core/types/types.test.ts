// ============================================================================
// Type Tests - Validate TypeScript type definitions
// ============================================================================

import { describe, it, expect } from 'vitest'
import type { 
  UserProfile, 
  JobApplication, 
  PipelineStage, 
  ApplicationStatus,
  AppSettings,
  FormSchema,
  FieldMapping
} from '../types'

describe('Core Types', () => {
  // ===========================================================================
  // User Profile Types
  // ===========================================================================
  
  describe('UserProfile', () => {
    it('should have all required fields', () => {
      const profile: UserProfile = {
        id: '123',
        personal: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          location: {
            address: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            country: 'USA'
          },
          linkedIn: 'https://linkedin.com/in/johndoe',
          portfolio: 'https://johndoe.com',
          website: 'https://johndoe.dev'
        },
        workExperience: [
          {
            id: 'exp1',
            company: 'Acme Corp',
            title: 'Software Engineer',
            location: 'San Francisco',
            startDate: '2020-01-01',
            endDate: null, // Current job
            description: 'Built amazing things'
          }
        ],
        education: [
          {
            id: 'edu1',
            institution: 'State University',
            degree: 'Bachelor',
            field: 'Computer Science',
            graduationDate: '2019-05-15',
            gpa: '3.8'
          }
        ],
        skills: ['TypeScript', 'React', 'Node.js'],
        documents: [],
        answers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(profile.id).toBeDefined()
      expect(profile.personal.firstName).toBe('John')
      expect(profile.workExperience[0].endDate).toBeNull() // Current job
      expect(profile.skills).toHaveLength(3)
    })

    it('should allow optional fields to be undefined', () => {
      const profile: UserProfile = {
        id: '123',
        personal: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
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

      expect(profile.personal.linkedIn).toBeUndefined()
      expect(profile.personal.portfolio).toBeUndefined()
    })
  })

  // ===========================================================================
  // Job Application Types
  // ===========================================================================

  describe('JobApplication', () => {
    it('should have all required fields', () => {
      const application: JobApplication = {
        id: 'app-123',
        company: 'Tech Corp',
        position: 'Senior Engineer',
        source: 'LinkedIn',
        sourceUrl: 'https://linkedin.com/jobs/123',
        appliedDate: '2024-01-15',
        status: 'active',
        stage: 'applied',
        notes: 'Great opportunity',
        contacts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(application.id).toBeDefined()
      expect(application.company).toBe('Tech Corp')
      expect(application.status).toBe('active')
      expect(application.stage).toBe('applied')
    })

    it('should support all pipeline stages', () => {
      const stages: PipelineStage[] = ['applied', 'interviewing', 'offer', 'rejected', 'closed']
      
      stages.forEach(stage => {
        const application: JobApplication = {
          id: 'test',
          company: 'Test',
          position: 'Test',
          source: 'Test',
          appliedDate: '2024-01-01',
          status: 'active',
          stage,
          notes: '',
          contacts: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        expect(application.stage).toBe(stage)
      })
    })

    it('should support optional nextAction', () => {
      const application: JobApplication = {
        id: 'app-123',
        company: 'Tech Corp',
        position: 'Senior Engineer',
        source: 'LinkedIn',
        appliedDate: '2024-01-15',
        status: 'active',
        stage: 'interviewing',
        notes: '',
        contacts: [],
        nextAction: {
          type: 'interview',
          dueDate: '2024-02-01',
          description: 'Technical interview with team lead'
        },
        followUpDate: '2024-02-05',
        salary: {
          amount: 150000,
          currency: 'USD',
          frequency: 'yearly'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(application.nextAction).toBeDefined()
      expect(application.nextAction?.type).toBe('interview')
      expect(application.salary?.amount).toBe(150000)
      expect(application.salary?.frequency).toBe('yearly')
    })

    it('should support application status transitions', () => {
      const statuses: ApplicationStatus[] = ['active', 'archived', 'deleted']
      
      statuses.forEach(status => {
        const application: JobApplication = {
          id: 'test',
          company: 'Test',
          position: 'Test',
          source: 'Test',
          appliedDate: '2024-01-01',
          status,
          stage: 'applied',
          notes: '',
          contacts: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        expect(application.status).toBe(status)
      })
    })

    it('should support contacts', () => {
      const application: JobApplication = {
        id: 'app-123',
        company: 'Tech Corp',
        position: 'Senior Engineer',
        source: 'LinkedIn',
        appliedDate: '2024-01-15',
        status: 'active',
        stage: 'interviewing',
        notes: '',
        contacts: [
          {
            id: 'contact-1',
            name: 'Jane Smith',
            role: 'Hiring Manager',
            email: 'jane@techcorp.com',
            phone: '555-5678',
            notes: 'Met at conference'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(application.contacts).toHaveLength(1)
      expect(application.contacts[0].email).toBe('jane@techcorp.com')
    })
  })

  // ===========================================================================
  // Settings Types
  // ===========================================================================

  describe('AppSettings', () => {
    it('should have default settings structure', () => {
      const settings: AppSettings = {
        notifications: {
          enabled: true,
          followUpReminderDays: 7
        },
        autofill: {
          autoSubmit: false,
          confirmBeforeFill: true
        },
        theme: 'system'
      }

      expect(settings.notifications.enabled).toBe(true)
      expect(settings.autofill.confirmBeforeFill).toBe(true)
      expect(['light', 'dark', 'system']).toContain(settings.theme)
    })

    it('should allow all theme options', () => {
      const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
      
      themes.forEach(theme => {
        const settings: AppSettings = {
          notifications: { enabled: true, followUpReminderDays: 7 },
          autofill: { autoSubmit: false, confirmBeforeFill: true },
          theme
        }
        expect(settings.theme).toBe(theme)
      })
    })
  })

  // ===========================================================================
  // Form Schema Types
  // ===========================================================================

  describe('FormSchema', () => {
    it('should have field mapping with transforms', () => {
      const schema: FormSchema = {
        id: 'schema-1',
        domain: 'linkedin.com',
        urlPattern: '*://*.linkedin.com/jobs/*',
        fieldMappings: [
          {
            formField: 'input[name="firstName"]',
            profileField: 'personal.firstName',
            transform: 'capitalize'
          },
          {
            formField: 'input[name="email"]',
            profileField: 'personal.email',
            transform: 'none'
          }
        ],
        createdAt: new Date()
      }

      expect(schema.fieldMappings).toHaveLength(2)
      expect(schema.fieldMappings[0].transform).toBe('capitalize')
    })

    it('should allow optional transform', () => {
      const mapping: FieldMapping = {
        formField: 'input[name="name"]',
        profileField: 'personal.firstName'
      }

      expect(mapping.transform).toBeUndefined()
    })
  })
})
