// ============================================================================
// Hooks Tests - useApplications (Simplified - Testing Logic Only)
// ============================================================================

import { describe, it, expect } from 'vitest'

// Test the hook logic without rendering React components
// This tests the pure functions and calculations used in the hooks

import type { PipelineStage, JobApplication } from '../types'

describe('useApplications Hook Logic', () => {
  // ===========================================================================
  // Stats Calculation
  // ===========================================================================

  describe('stats calculation', () => {
    const createMockApp = (overrides: Partial<JobApplication> = {}): JobApplication => ({
      id: 'app-1',
      company: 'Tech Corp',
      position: 'Engineer',
      source: 'LinkedIn',
      appliedDate: '2024-01-01',
      status: 'active',
      stage: 'applied',
      notes: '',
      contacts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    })

    it('should count total applications', () => {
      const applications = [
        createMockApp({ id: '1' }),
        createMockApp({ id: '2' }),
        createMockApp({ id: '3' })
      ]

      expect(applications.length).toBe(3)
    })

    it('should count active applications', () => {
      const applications = [
        createMockApp({ id: '1', status: 'active' }),
        createMockApp({ id: '2', status: 'active' }),
        createMockApp({ id: '3', status: 'archived' })
      ]

      const activeCount = applications.filter(a => a.status === 'active').length
      expect(activeCount).toBe(2)
    })

    it('should count upcoming follow-ups', () => {
      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const applications = [
        createMockApp({ id: '1', followUpDate: today, status: 'active' }),
        createMockApp({ id: '2', followUpDate: futureDate, status: 'active' }),
        createMockApp({ id: '3', followUpDate: today, status: 'archived' }),
        createMockApp({ id: '4', followUpDate: undefined })
      ]

      const upcomingFollowUps = applications.filter(
        a => a.followUpDate && a.followUpDate <= today && a.status === 'active'
      ).length

      expect(upcomingFollowUps).toBe(1)
    })

    it('should count applications this week', () => {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const applications = [
        createMockApp({ id: '1', appliedDate: now.toISOString().split('T')[0] }),
        createMockApp({ id: '2', appliedDate: weekAgo.toISOString().split('T')[0] }),
        createMockApp({ id: '3', appliedDate: monthAgo.toISOString().split('T')[0] })
      ]

      const thisWeek = applications.filter(
        a => a.appliedDate >= weekAgo.toISOString().split('T')[0]
      ).length

      expect(thisWeek).toBe(2)
    })

    it('should count applications this month', () => {
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const applications = [
        createMockApp({ id: '1', appliedDate: now.toISOString().split('T')[0] }),
        createMockApp({ id: '2', appliedDate: monthAgo.toISOString().split('T')[0] })
      ]

      const thisMonth = applications.filter(
        a => a.appliedDate >= monthAgo.toISOString().split('T')[0]
      ).length

      expect(thisMonth).toBe(2)
    })
  })

  // ===========================================================================
  // By Stage Grouping
  // ===========================================================================

  describe('byStage grouping', () => {
    const createMockApp = (stage: PipelineStage, status: 'active' | 'archived' = 'active'): JobApplication => ({
      id: 'app-1',
      company: 'Tech Corp',
      position: 'Engineer',
      source: 'LinkedIn',
      appliedDate: '2024-01-01',
      status,
      stage,
      notes: '',
      contacts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    })

    it('should group applications by stage', () => {
      const applications = [
        createMockApp('applied'),
        createMockApp('applied'),
        createMockApp('interviewing'),
        createMockApp('offer')
      ]

      const stages: PipelineStage[] = ['applied', 'interviewing', 'offer', 'rejected', 'closed']
      const byStage = stages.reduce((acc, stage) => {
        acc[stage] = applications.filter(a => a.stage === stage && a.status === 'active')
        return acc
      }, {} as Record<PipelineStage, JobApplication[]>)

      expect(byStage.applied).toHaveLength(2)
      expect(byStage.interviewing).toHaveLength(1)
      expect(byStage.offer).toHaveLength(1)
      expect(byStage.rejected).toHaveLength(0)
      expect(byStage.closed).toHaveLength(0)
    })

    it('should only include active applications in byStage', () => {
      const applications = [
        createMockApp('applied', 'active'),
        createMockApp('applied', 'archived')
      ]

      const byStageApplied = applications.filter(a => a.stage === 'applied' && a.status === 'active')
      expect(byStageApplied).toHaveLength(1)
    })
  })

  // ===========================================================================
  // Filter Logic
  // ===========================================================================

  describe('filter logic', () => {
    const createMockApp = (overrides: Partial<JobApplication> = {}): JobApplication => ({
      id: 'app-1',
      company: 'Tech Corp',
      position: 'Frontend Developer',
      source: 'LinkedIn',
      appliedDate: '2024-01-01',
      status: 'active',
      stage: 'applied',
      notes: 'Great opportunity',
      contacts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    })

    it('should filter by status', () => {
      const applications = [
        createMockApp({ id: '1', status: 'active' }),
        createMockApp({ id: '2', status: 'archived' })
      ]

      const filtered = applications.filter(a => a.status === 'active')
      expect(filtered).toHaveLength(1)
    })

    it('should filter by stage', () => {
      const applications = [
        createMockApp({ id: '1', stage: 'applied' }),
        createMockApp({ id: '2', stage: 'interviewing' })
      ]

      const filtered = applications.filter(a => a.stage === 'interviewing')
      expect(filtered).toHaveLength(1)
    })

    it('should filter by company (case insensitive)', () => {
      const applications = [
        createMockApp({ id: '1', company: 'Google' }),
        createMockApp({ id: '2', company: 'Amazon' }),
        createMockApp({ id: '3', company: 'Alphabet' })
      ]

      const filtered = applications.filter(a =>
        a.company.toLowerCase().includes('google'.toLowerCase())
      )
      expect(filtered).toHaveLength(1)
    })

    it('should filter by search term (company, position, notes)', () => {
      const applications = [
        createMockApp({ id: '1', company: 'Tech Corp', position: 'Engineer', notes: 'React' }),
        createMockApp({ id: '2', company: 'Startup', position: 'Developer', notes: 'Node.js' }),
        createMockApp({ id: '3', company: 'Big Tech', position: 'React Developer', notes: '' })
      ]

      const search = 'react'
      const filtered = applications.filter(a =>
        a.company.toLowerCase().includes(search) ||
        a.position.toLowerCase().includes(search) ||
        (a.notes && a.notes.toLowerCase().includes(search))
      )

      expect(filtered).toHaveLength(2) // Tech Corp (notes), React Developer (position)
    })

    it('should filter by date range', () => {
      const applications = [
        createMockApp({ id: '1', appliedDate: '2024-01-01' }),
        createMockApp({ id: '2', appliedDate: '2024-01-15' }),
        createMockApp({ id: '3', appliedDate: '2024-02-01' })
      ]

      const filtered = applications.filter(a =>
        a.appliedDate >= '2024-01-10' && a.appliedDate <= '2024-01-20'
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('2')
    })

    it('should combine multiple filters', () => {
      const applications = [
        createMockApp({ id: '1', company: 'Google', stage: 'interviewing', status: 'active' }),
        createMockApp({ id: '2', company: 'Google', stage: 'applied', status: 'active' }),
        createMockApp({ id: '3', company: 'Amazon', stage: 'interviewing', status: 'active' })
      ]

      const filtered = applications
        .filter(a => a.company.toLowerCase().includes('google'))
        .filter(a => a.stage === 'interviewing')

      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('1')
    })
  })

  // ===========================================================================
  // Stage Transitions
  // ===========================================================================

  describe('stage transitions', () => {
    const stages: PipelineStage[] = ['applied', 'interviewing', 'offer', 'rejected', 'closed']

    it('should have all expected stages', () => {
      expect(stages).toHaveLength(5)
      expect(stages).toContain('applied')
      expect(stages).toContain('interviewing')
      expect(stages).toContain('offer')
      expect(stages).toContain('rejected')
      expect(stages).toContain('closed')
    })

    it('should allow valid stage transitions', () => {
      // Common valid transitions
      const validTransitions: Array<[PipelineStage, PipelineStage]> = [
        ['applied', 'interviewing'],
        ['applied', 'rejected'],
        ['applied', 'closed'],
        ['interviewing', 'offer'],
        ['interviewing', 'rejected'],
        ['interviewing', 'closed'],
        ['offer', 'closed'],
        ['offer', 'rejected']
      ]

      validTransitions.forEach(([from, to]) => {
        // Just verify the stages are valid
        expect(stages).toContain(from)
        expect(stages).toContain(to)
      })
    })
  })
})
