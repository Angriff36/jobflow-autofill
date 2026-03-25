import { useEffect, useState, useMemo } from 'react'
import { applicationRepository } from '@/core/storage/db'
import type { JobApplication, PipelineStage } from '@/core/types'
import { Plus, Search, List, Columns, X } from 'lucide-react'
import { KanbanBoard } from './KanbanBoard'
import { ApplicationDetailModal } from './ApplicationDetailModal'
import { QuickAddForm } from './QuickAddForm'
import { ApplicationListView } from './ApplicationListView'

export const STAGES: PipelineStage[] = ['applied', 'interviewing', 'offer', 'rejected', 'closed']

export const stageConfig: Record<PipelineStage, { label: string; color: string; bg: string }> = {
  applied: { label: 'Applied', color: 'text-blue-700', bg: 'bg-blue-100 text-blue-800' },
  interviewing: { label: 'Interviewing', color: 'text-amber-700', bg: 'bg-amber-100 text-amber-800' },
  offer: { label: 'Offer', color: 'text-emerald-700', bg: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100 text-red-800' },
  closed: { label: 'Closed', color: 'text-gray-700', bg: 'bg-gray-100 text-gray-800' },
}

export type SortField = 'company' | 'appliedDate' | 'stage' | 'position'
export type SortDirection = 'asc' | 'desc'

export function Applications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState<PipelineStage | ''>('')
  const [filterSource, setFilterSource] = useState('')
  const [sortField, setSortField] = useState<SortField>('appliedDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    loadApplications()
  }, [])

  async function loadApplications() {
    try {
      const apps = await applicationRepository.getAll()
      setApplications(apps)
    } catch (error) {
      console.error('Failed to load applications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(appData: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      await applicationRepository.create(appData)
      setShowQuickAdd(false)
      loadApplications()
    } catch (error) {
      console.error('Failed to create application:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this application?')) return
    try {
      await applicationRepository.delete(id)
      if (selectedApp?.id === id) setSelectedApp(null)
      loadApplications()
    } catch (error) {
      console.error('Failed to delete application:', error)
    }
  }

  async function handleStageChange(id: string, stage: PipelineStage) {
    try {
      await applicationRepository.updateStage(id, stage)
      loadApplications()
      if (selectedApp?.id === id) {
        setSelectedApp(prev => prev ? { ...prev, stage } : null)
      }
    } catch (error) {
      console.error('Failed to update stage:', error)
    }
  }

  async function handleUpdate(id: string, updates: Partial<JobApplication>) {
    try {
      const app = await applicationRepository.getById(id)
      if (!app) return
      await applicationRepository.save({ ...app, ...updates })
      loadApplications()
      if (selectedApp?.id === id) {
        setSelectedApp(prev => prev ? { ...prev, ...updates } : null)
      }
    } catch (error) {
      console.error('Failed to update application:', error)
    }
  }

  // Get unique sources for filter dropdown
  const sources = useMemo(() => {
    const s = new Set(applications.map(a => a.source).filter(Boolean))
    return Array.from(s).sort()
  }, [applications])

  // Filter and sort
  const filteredApps = useMemo(() => {
    let result = [...applications]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.company.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q)
      )
    }
    if (filterStage) {
      result = result.filter(a => a.stage === filterStage)
    }
    if (filterSource) {
      result = result.filter(a => a.source === filterSource)
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'company':
          cmp = a.company.localeCompare(b.company)
          break
        case 'position':
          cmp = a.position.localeCompare(b.position)
          break
        case 'appliedDate':
          cmp = a.appliedDate.localeCompare(b.appliedDate)
          break
        case 'stage':
          cmp = STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage)
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })

    return result
  }, [applications, searchQuery, filterStage, filterSource, sortField, sortDirection])

  // Stats
  const stats = useMemo(() => {
    const active = applications.filter(a => a.status === 'active')
    const byStage: Record<PipelineStage, number> = {
      applied: 0, interviewing: 0, offer: 0, rejected: 0, closed: 0
    }
    active.forEach(a => { byStage[a.stage]++ })

    const total = active.length
    const responded = byStage.interviewing + byStage.offer + byStage.rejected + byStage.closed
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0

    return { total, byStage, responseRate }
  }, [applications])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{stats.total} active</span>
            <span className="text-gray-300">|</span>
            <span>{stats.responseRate}% response rate</span>
            {STAGES.filter(s => s !== 'closed').map(stage => (
              <span key={stage} className="hidden md:inline">
                <span className={stageConfig[stage].color}>{stats.byStage[stage]}</span>
                {' '}{stageConfig[stage].label.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Application
        </button>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search company, position, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Stage Filter */}
        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value as PipelineStage | '')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Stages</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{stageConfig[s].label}</option>
          ))}
        </select>

        {/* Source Filter */}
        {sources.length > 0 && (
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            {sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {/* View Toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${
              view === 'list' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-l border-gray-200 ${
              view === 'kanban' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Columns className="w-4 h-4" />
            Kanban
          </button>
        </div>
      </div>

      {/* Content */}
      {applications.length === 0 ? (
        <div className="py-16 text-center">
          <Columns className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No applications yet</h3>
          <p className="text-sm text-gray-500 mb-4">Start tracking your job applications to stay organized.</p>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Your First Application
          </button>
        </div>
      ) : view === 'list' ? (
        <ApplicationListView
          applications={filteredApps}
          sortField={sortField}
          sortDirection={sortDirection}
          onToggleSort={toggleSort}
          onSelect={setSelectedApp}
          onStageChange={handleStageChange}
          onDelete={handleDelete}
        />
      ) : (
        <KanbanBoard
          applications={filteredApps}
          onStageChange={handleStageChange}
          onSelect={setSelectedApp}
        />
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddForm
          onSubmit={handleCreate}
          onClose={() => setShowQuickAdd(false)}
        />
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={(updates) => handleUpdate(selectedApp.id, updates)}
          onStageChange={(stage) => handleStageChange(selectedApp.id, stage)}
          onDelete={() => handleDelete(selectedApp.id)}
        />
      )}
    </div>
  )
}
