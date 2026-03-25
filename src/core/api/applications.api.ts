// ============================================================================
// Applications API - Job Application Management
// Handles CRUD operations for job applications with local-first storage
// and optional cloud sync
// ============================================================================

import { applicationRepository, syncQueueRepository } from '../storage/db'
import { authApi } from './auth.api'
import type { JobApplication, ApplicationStatus, PipelineStage } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface CreateApplicationInput {
  company: string
  position: string
  source: string
  sourceUrl?: string
  appliedDate: string
  status?: ApplicationStatus
  stage?: PipelineStage
  followUpDate?: string
  notes?: string
  salary?: {
    amount: number
    currency: string
    frequency: 'hourly' | 'yearly'
  }
}

export interface UpdateApplicationInput {
  company?: string
  position?: string
  source?: string
  sourceUrl?: string
  appliedDate?: string
  status?: ApplicationStatus
  stage?: PipelineStage
  followUpDate?: string
  notes?: string
  salary?: {
    amount: number
    currency: string
    frequency: 'hourly' | 'yearly'
  }
}

export interface ApplicationFilters {
  status?: ApplicationStatus
  stage?: PipelineStage
  company?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// Applications API
// ============================================================================

export const applicationsApi = {
  // ---------------------------------------------------------------------------
  // CRUD Operations (Local-First)
  // ---------------------------------------------------------------------------

  /**
   * Get all applications
   */
  async getAll(): Promise<JobApplication[]> {
    return applicationRepository.getAll()
  },

  /**
   * Get application by ID
   */
  async getById(id: string): Promise<JobApplication | undefined> {
    return applicationRepository.getById(id)
  },

  /**
   * Get applications by stage
   */
  async getByStage(stage: PipelineStage): Promise<JobApplication[]> {
    return applicationRepository.getByStage(stage)
  },

  /**
   * Get active applications
   */
  async getActive(): Promise<JobApplication[]> {
    return applicationRepository.getActive()
  },

  /**
   * Get applications with follow-ups due
   */
  async getFollowUpsDue(date?: Date): Promise<JobApplication[]> {
    return applicationRepository.getFollowUpsDue(date || new Date())
  },

  /**
   * Get applications with filters
   */
  async getFiltered(filters: ApplicationFilters): Promise<JobApplication[]> {
    let applications = await this.getAll()

    if (filters.status) {
      applications = applications.filter(a => a.status === filters.status)
    }

    if (filters.stage) {
      applications = applications.filter(a => a.stage === filters.stage)
    }

    if (filters.company) {
      applications = applications.filter(a =>
        a.company.toLowerCase().includes(filters.company!.toLowerCase())
      )
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      applications = applications.filter(a =>
        a.company.toLowerCase().includes(search) ||
        a.position.toLowerCase().includes(search) ||
        (a.notes && a.notes.toLowerCase().includes(search))
      )
    }

    if (filters.dateFrom) {
      applications = applications.filter(a => a.appliedDate >= filters.dateFrom!)
    }

    if (filters.dateTo) {
      applications = applications.filter(a => a.appliedDate <= filters.dateTo!)
    }

    return applications
  },

  /**
   * Create a new application
   */
  async create(input: CreateApplicationInput): Promise<JobApplication> {
    const id = await applicationRepository.create({
      company: input.company,
      position: input.position,
      source: input.source,
      sourceUrl: input.sourceUrl,
      appliedDate: input.appliedDate,
      status: input.status || 'active',
      stage: input.stage || 'applied',
      followUpDate: input.followUpDate,
      notes: input.notes || '',
      contacts: [],
      salary: input.salary
    })

    const application = await applicationRepository.getById(id)
    if (!application) {
      throw new Error('Failed to create application')
    }

    // Queue for sync if authenticated
    await this.queueSync(application.id, 'create')

    return application
  },

  /**
   * Update an application
   */
  async update(id: string, updates: UpdateApplicationInput): Promise<JobApplication> {
    const application = await applicationRepository.getById(id)
    if (!application) {
      throw new Error(`Application ${id} not found`)
    }

    await applicationRepository.save({
      ...application,
      ...updates
    })

    const updated = await applicationRepository.getById(id)
    if (!updated) {
      throw new Error('Failed to update application')
    }

    // Queue for sync if authenticated
    await this.queueSync(id, 'update')

    return updated
  },

  /**
   * Delete an application
   */
  async delete(id: string): Promise<void> {
    await applicationRepository.delete(id)

    // Queue for sync if authenticated
    await this.queueSync(id, 'delete')
  },

  // ---------------------------------------------------------------------------
  // Stage Management
  // ---------------------------------------------------------------------------

  /**
   * Move application to a new stage
   */
  async moveToStage(id: string, stage: PipelineStage): Promise<JobApplication> {
    await applicationRepository.updateStage(id, stage)
    const application = await applicationRepository.getById(id)
    if (!application) {
      throw new Error(`Application ${id} not found`)
    }

    // Queue for sync
    await this.queueSync(id, 'update')

    return application
  },

  /**
   * Set follow-up date
   */
  async setFollowUpDate(id: string, date: string | undefined): Promise<void> {
    await applicationRepository.updateFollowUpDate(id, date)
    await this.queueSync(id, 'update')
  },

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  /**
   * Get application statistics
   */
  async getStats(): Promise<{
    total: number
    active: number
    byStage: Record<PipelineStage, number>
    upcomingFollowUps: number
    thisWeek: number
    thisMonth: number
  }> {
    const applications = await this.getAll()
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const today = now.toISOString().split('T')[0]

    const byStage: Record<PipelineStage, number> = {
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      closed: 0
    }

    let upcomingFollowUps = 0

    for (const app of applications) {
      if (app.status === 'active') {
        byStage[app.stage]++
      }
      if (app.followUpDate && app.followUpDate <= today && app.status === 'active') {
        upcomingFollowUps++
      }
    }

    return {
      total: applications.length,
      active: applications.filter(a => a.status === 'active').length,
      byStage,
      upcomingFollowUps,
      thisWeek: applications.filter(a => a.appliedDate >= weekAgo.toISOString().split('T')[0]).length,
      thisMonth: applications.filter(a => a.appliedDate >= monthAgo.toISOString().split('T')[0]).length
    }
  },

  // ---------------------------------------------------------------------------
  // Sync Helper
  // ---------------------------------------------------------------------------

  /**
   * Queue an application for cloud sync
   */
  async queueSync(id: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    const isAuthenticated = await authApi.isAuthenticated()
    if (!isAuthenticated) return

    const application = action !== 'delete' ? await this.getById(id) : undefined

    await syncQueueRepository.add({
      entityType: 'application',
      entityId: id,
      action,
      payload: application ? { ...application } as unknown as Record<string, unknown> : { id }
    })
  }
}
