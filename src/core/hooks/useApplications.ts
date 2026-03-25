// ============================================================================
// React Hooks - Applications
// Easy-to-use hooks for job application management
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  applicationsApi, 
  type CreateApplicationInput, 
  type UpdateApplicationInput,
  type ApplicationFilters 
} from '../api/applications.api'
import type { JobApplication, PipelineStage } from '../types'

// ============================================================================
// useApplications Hook
// ============================================================================

export interface UseApplicationsOptions {
  filters?: ApplicationFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseApplicationsReturn {
  // State
  applications: JobApplication[]
  isLoading: boolean
  error: string | null

  // Actions
  create: (input: CreateApplicationInput) => Promise<JobApplication>
  update: (id: string, updates: UpdateApplicationInput) => Promise<JobApplication>
  remove: (id: string) => Promise<void>
  moveToStage: (id: string, stage: PipelineStage) => Promise<JobApplication>
  setFollowUpDate: (id: string, date: string | undefined) => Promise<void>
  refresh: () => Promise<void>
  clearError: () => void

  // Computed
  stats: ApplicationStats
  byStage: Record<PipelineStage, JobApplication[]>
}

export interface ApplicationStats {
  total: number
  active: number
  upcomingFollowUps: number
  thisWeek: number
  thisMonth: number
}

export function useApplications(options: UseApplicationsOptions = {}): UseApplicationsReturn {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = options.filters
        ? await applicationsApi.getFiltered(options.filters)
        : await applicationsApi.getAll()
      setApplications(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }, [options.filters])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Auto-refresh
  useEffect(() => {
    if (!options.autoRefresh || !options.refreshInterval) return

    const interval = setInterval(loadApplications, options.refreshInterval)
    return () => clearInterval(interval)
  }, [loadApplications, options.autoRefresh, options.refreshInterval])

  const create = useCallback(async (input: CreateApplicationInput) => {
    const application = await applicationsApi.create(input)
    setApplications(prev => [application, ...prev])
    return application
  }, [])

  const update = useCallback(async (id: string, updates: UpdateApplicationInput) => {
    const application = await applicationsApi.update(id, updates)
    setApplications(prev => prev.map(a => a.id === id ? application : a))
    return application
  }, [])

  const remove = useCallback(async (id: string) => {
    await applicationsApi.delete(id)
    setApplications(prev => prev.filter(a => a.id !== id))
  }, [])

  const moveToStage = useCallback(async (id: string, stage: PipelineStage) => {
    const application = await applicationsApi.moveToStage(id, stage)
    setApplications(prev => prev.map(a => a.id === id ? application : a))
    return application
  }, [])

  const setFollowUpDate = useCallback(async (id: string, date: string | undefined) => {
    await applicationsApi.setFollowUpDate(id, date)
    setApplications(prev => prev.map(a => 
      a.id === id ? { ...a, followUpDate: date } : a
    ))
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // Computed values
  const byStage = useMemo((): Record<PipelineStage, JobApplication[]> => {
    const stages: PipelineStage[] = ['applied', 'interviewing', 'offer', 'rejected', 'closed']
    return stages.reduce((acc, stage) => {
      acc[stage] = applications.filter(a => a.stage === stage && a.status === 'active')
      return acc
    }, {} as Record<PipelineStage, JobApplication[]>)
  }, [applications])

  const stats = useMemo((): ApplicationStats => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const today = now.toISOString().split('T')[0]

    return {
      total: applications.length,
      active: applications.filter(a => a.status === 'active').length,
      upcomingFollowUps: applications.filter(
        a => a.followUpDate && a.followUpDate <= today && a.status === 'active'
      ).length,
      thisWeek: applications.filter(
        a => a.appliedDate >= weekAgo.toISOString().split('T')[0]
      ).length,
      thisMonth: applications.filter(
        a => a.appliedDate >= monthAgo.toISOString().split('T')[0]
      ).length
    }
  }, [applications])

  return {
    applications,
    isLoading,
    error,
    create,
    update,
    remove,
    moveToStage,
    setFollowUpDate,
    refresh: loadApplications,
    clearError,
    stats,
    byStage
  }
}

// ============================================================================
// useApplication Hook
// ============================================================================

export interface UseApplicationReturn {
  application: JobApplication | null
  isLoading: boolean
  error: string | null
  update: (updates: UpdateApplicationInput) => Promise<void>
  moveToStage: (stage: PipelineStage) => Promise<void>
  setFollowUpDate: (date: string | undefined) => Promise<void>
  remove: () => Promise<void>
}

export function useApplication(id: string): UseApplicationReturn {
  const [application, setApplication] = useState<JobApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await applicationsApi.getById(id)
        setApplication(data || null)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) load()
  }, [id])

  const update = useCallback(async (updates: UpdateApplicationInput) => {
    if (!application) return
    const updated = await applicationsApi.update(id, updates)
    setApplication(updated)
  }, [id, application])

  const moveToStage = useCallback(async (stage: PipelineStage) => {
    const updated = await applicationsApi.moveToStage(id, stage)
    setApplication(updated)
  }, [id])

  const setFollowUpDate = useCallback(async (date: string | undefined) => {
    await applicationsApi.setFollowUpDate(id, date)
    setApplication(prev => prev ? { ...prev, followUpDate: date } : null)
  }, [id])

  const remove = useCallback(async () => {
    await applicationsApi.delete(id)
    setApplication(null)
  }, [id])

  return {
    application,
    isLoading,
    error,
    update,
    moveToStage,
    setFollowUpDate,
    remove
  }
}

// ============================================================================
// useApplicationStats Hook
// ============================================================================

export function useApplicationStats(): {
  stats: ApplicationStats | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
} {
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await applicationsApi.getStats()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    isLoading,
    error,
    refresh: loadStats
  }
}
