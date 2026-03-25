// ============================================================================
// Applications API Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applicationsApi, type CreateApplicationInput } from './applications.api'

// Mock the database repository
vi.mock('../storage/db', () => ({
  applicationRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    getByStage: vi.fn(),
    getActive: vi.fn(),
    getFollowUpsDue: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    updateStage: vi.fn(),
    updateFollowUpDate: vi.fn()
  },
  syncQueueRepository: {
    add: vi.fn()
  }
}))

vi.mock('./auth.api', () => ({
  authApi: {
    isAuthenticated: vi.fn().mockResolvedValue(false)
  }
}))

import { applicationRepository, syncQueueRepository } from '../storage/db'

const mockAppRepo = applicationRepository as any

const mockSyncQueue = syncQueueRepository as any

describe('Applications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // CRUD Operations
  // ===========================================================================

  describe('getAll', () => {
    it('should return all applications', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          company: 'Tech Corp',
          position: 'Engineer',
          source: 'LinkedIn',
          appliedDate: '2024-01-01',
          status: 'active' as const,
          stage: 'applied' as const,
          notes: '',
          contacts: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'app-2',
          company: 'Startup Inc',
          position: 'Developer',
          source: 'Indeed',
          appliedDate: '2024-01-15',
          status: 'active' as const,
          stage: 'interviewing' as const,
          notes: '',
          contacts: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockAppRepo.getAll.mockResolvedValue(mockApplications)

      const result = await applicationsApi.getAll()

      expect(result).toHaveLength(2)
      expect(mockAppRepo.getAll).toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return application by ID', async () => {
      const mockApp = {
        id: 'app-1',
        company: 'Tech Corp',
        position: 'Engineer',
        source: 'LinkedIn',
        appliedDate: '2024-01-01',
        status: 'active' as const,
        stage: 'applied' as const,
        notes: '',
        contacts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockAppRepo.getById.mockResolvedValue(mockApp)

      const result = await applicationsApi.getById('app-1')

      expect(result?.company).toBe('Tech Corp')
      expect(mockAppRepo.getById).toHaveBeenCalledWith('app-1')
    })

    it('should return undefined for non-existent ID', async () => {
      mockAppRepo.getById.mockResolvedValue(undefined)

      const result = await applicationsApi.getById('non-existent')

      expect(result).toBeUndefined()
    })
  })

  describe('getByStage', () => {
    it('should return applications filtered by stage', async () => {
      const mockApps = [
        {
          id: 'app-1',
          company: 'Tech Corp',
          position: 'Engineer',
          source: 'LinkedIn',
          appliedDate: '2024-01-01',
          status: 'active' as const,
          stage: 'interviewing' as const,
          notes: '',
          contacts: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockAppRepo.getByStage.mockResolvedValue(mockApps)

      const result = await applicationsApi.getByStage('interviewing')

      expect(result).toHaveLength(1)
      expect(result[0].stage).toBe('interviewing')
      expect(mockAppRepo.getByStage).toHaveBeenCalledWith('interviewing')
    })
  })

  describe('create', () => {
    it('should create a new application', async () => {
      const input: CreateApplicationInput = {
        company: 'New Corp',
        position: 'Senior Engineer',
        source: 'Company Website',
        appliedDate: '2024-02-01'
      }

      const createdApp = {
        id: 'new-app-id',
        ...input,
        status: 'active',
        stage: 'applied',
        notes: '',
        contacts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockAppRepo.create.mockResolvedValue('new-app-id')
      mockAppRepo.getById.mockResolvedValue(createdApp)
      mockSyncQueue.add.mockResolvedValue(1)

      const result = await applicationsApi.create(input)

      expect(result.id).toBe('new-app-id')
      expect(result.company).toBe('New Corp')
      expect(mockAppRepo.create).toHaveBeenCalled()
    })

    it('should use default values when not provided', async () => {
      const input: CreateApplicationInput = {
        company: 'New Corp',
        position: 'Engineer',
        source: 'LinkedIn',
        appliedDate: '2024-02-01'
      }

      const createdApp = {
        id: 'new-app-id',
        ...input,
        status: 'active' as const,
        stage: 'applied' as const,
        notes: '',
        contacts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockAppRepo.create.mockResolvedValue('new-app-id')
      mockAppRepo.getById.mockResolvedValue(createdApp)

      const result = await applicationsApi.create(input)

      expect(result.status).toBe('active')
      expect(result.stage).toBe('applied')
    })
  })

  describe('update', () => {
    it('should update an existing application', async () => {
      const existingApp = {
        id: 'app-1',
        company: 'Tech Corp',
        position: 'Engineer',
        source: 'LinkedIn',
        appliedDate: '2024-01-01',
        status: 'active' as const,
        stage: 'applied' as const,
        notes: 'Old notes',
        contacts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updatedApp = {
        ...existingApp,
        notes: 'Updated notes',
        stage: 'interviewing' as const
      }

      mockAppRepo.getById.mockResolvedValue(existingApp)
      mockAppRepo.save.mockResolvedValue()
      mockAppRepo.getById.mockResolvedValueOnce(existingApp).mockResolvedValueOnce(updatedApp)

      const result = await applicationsApi.update('app-1', { notes: 'Updated notes', stage: 'interviewing' })

      expect(result.notes).toBe('Updated notes')
      expect(result.stage).toBe('interviewing')
      expect(mockAppRepo.save).toHaveBeenCalled()
    })

    it('should throw error when application not found', async () => {
      mockAppRepo.getById.mockResolvedValue(undefined)

      await expect(applicationsApi.update('non-existent', { notes: 'test' }))
        .rejects.toThrow('Application non-existent not found')
    })
  })

  describe('delete', () => {
    it('should delete an application', async () => {
      mockAppRepo.delete.mockResolvedValue()

      await applicationsApi.delete('app-1')

      expect(mockAppRepo.delete).toHaveBeenCalledWith('app-1')
    })
  })

  // ===========================================================================
  // Stage Management
  // ===========================================================================

  describe('moveToStage', () => {
    it('should move application to new stage', async () => {
      const app = {
        id: 'app-1',
        company: 'Tech Corp',
        position: 'Engineer',
        source: 'LinkedIn',
        appliedDate: '2024-01-01',
        status: 'active' as const,
        stage: 'applied' as const,
        notes: '',
        contacts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockAppRepo.updateStage.mockResolvedValue()
      mockAppRepo.getById.mockResolvedValue({ ...app, stage: 'interviewing' as const })

      await applicationsApi.moveToStage('app-1', 'interviewing')

      expect(mockAppRepo.updateStage).toHaveBeenCalledWith('app-1', 'interviewing')
    })
  })

  describe('setFollowUpDate', () => {
    it('should set follow-up date', async () => {
      mockAppRepo.updateFollowUpDate.mockResolvedValue()

      await applicationsApi.setFollowUpDate('app-1', '2024-02-15')

      expect(mockAppRepo.updateFollowUpDate).toHaveBeenCalledWith('app-1', '2024-02-15')
    })

    it('should allow clearing follow-up date', async () => {
      mockAppRepo.updateFollowUpDate.mockResolvedValue()

      await applicationsApi.setFollowUpDate('app-1', undefined)

      expect(mockAppRepo.updateFollowUpDate).toHaveBeenCalledWith('app-1', undefined)
    })
  })

  // ===========================================================================
  // Filtering
  // ===========================================================================

  describe('getFiltered', () => {
    it('should filter by status', async () => {
      const mockApps = [
        { id: '1', company: 'A', position: 'P', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'applied' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', company: 'B', position: 'P', source: 'S', appliedDate: '2024-01-01', status: 'archived' as const, stage: 'applied' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      mockAppRepo.getAll.mockResolvedValue(mockApps)

      const result = await applicationsApi.getFiltered({ status: 'active' })

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('active')
    })

    it('should filter by stage', async () => {
      const mockApps = [
        { id: '1', company: 'A', position: 'P', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'applied' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', company: 'B', position: 'P', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'interviewing' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      mockAppRepo.getAll.mockResolvedValue(mockApps)

      const result = await applicationsApi.getFiltered({ stage: 'interviewing' })

      expect(result).toHaveLength(1)
      expect(result[0].stage).toBe('interviewing')
    })

    it('should filter by company name', async () => {
      const mockApps = [
        { id: '1', company: 'Google', position: 'P', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'applied' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', company: 'Amazon', position: 'P', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'applied' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      mockAppRepo.getAll.mockResolvedValue(mockApps)

      const result = await applicationsApi.getFiltered({ company: 'google' })

      expect(result).toHaveLength(1)
      expect(result[0].company).toBe('Google')
    })

    it('should filter by search term', async () => {
      const mockApps = [
        { id: '1', company: 'Tech Corp', position: 'Frontend Dev', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'applied' as const, notes: 'Looking for React work', contacts: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', company: 'Startup', position: 'Backend Dev', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'applied' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      mockAppRepo.getAll.mockResolvedValue(mockApps)

      const result = await applicationsApi.getFiltered({ search: 'react' })

      expect(result).toHaveLength(1)
      expect(result[0].company).toBe('Tech Corp')
    })

    it('should combine multiple filters', async () => {
      const mockApps = [
        { id: '1', company: 'Google', position: 'Eng', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'interviewing' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', company: 'Google', position: 'Eng', source: 'S', appliedDate: '2024-01-01', status: 'active' as const, stage: 'applied' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      mockAppRepo.getAll.mockResolvedValue(mockApps)

      const result = await applicationsApi.getFiltered({ company: 'google', stage: 'interviewing' })

      expect(result).toHaveLength(1)
      expect(result[0].stage).toBe('interviewing')
    })
  })

  // ===========================================================================
  // Statistics
  // ===========================================================================

  describe('getStats', () => {
    it('should calculate correct statistics', async () => {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const mockApps = [
        { id: '1', company: 'A', position: 'P', source: 'S', appliedDate: today, status: 'active' as const, stage: 'applied' as const, notes: '', contacts: [], followUpDate: today, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', company: 'B', position: 'P', source: 'S', appliedDate: weekAgo, status: 'active' as const, stage: 'interviewing' as const, notes: '', contacts: [], followUpDate: futureDate, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', company: 'C', position: 'P', source: 'S', appliedDate: monthAgo, status: 'active' as const, stage: 'offer' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '4', company: 'D', position: 'P', source: 'S', appliedDate: monthAgo, status: 'archived' as const, stage: 'applied' as const, notes: '', contacts: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      mockAppRepo.getAll.mockResolvedValue(mockApps)

      const result = await applicationsApi.getStats()

      expect(result.total).toBe(4)
      expect(result.active).toBe(3)
      expect(result.upcomingFollowUps).toBe(1)
      expect(result.byStage.interviewing).toBe(1)
      expect(result.byStage.offer).toBe(1)
    })
  })
})
