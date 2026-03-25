import { useEffect, useState } from 'react'
import { applicationRepository } from '@/core/storage/db'
import type { JobApplication, PipelineStage } from '@/core/types'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { format } from 'date-fns'

const stageConfig: Record<PipelineStage, { label: string; color: string }> = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  interviewing: { label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800' },
  offer: { label: 'Offer', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
}

const emptyApplication = (): Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'> => ({
  company: '',
  position: '',
  source: '',
  sourceUrl: '',
  appliedDate: format(new Date(), 'yyyy-MM-dd'),
  status: 'active',
  stage: 'applied',
  notes: '',
  contacts: []
})

export function Applications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newApp, setNewApp] = useState<Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>>(emptyApplication())

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

  async function handleCreate() {
    try {
      await applicationRepository.create(newApp)
      setNewApp(emptyApplication())
      setShowForm(false)
      loadApplications()
    } catch (error) {
      console.error('Failed to create application:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this application?')) return
    try {
      await applicationRepository.delete(id)
      loadApplications()
    } catch (error) {
      console.error('Failed to delete application:', error)
    }
  }

  async function handleStageChange(id: string, stage: PipelineStage) {
    try {
      await applicationRepository.updateStage(id, stage)
      loadApplications()
    } catch (error) {
      console.error('Failed to update stage:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Applications</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Application
        </button>
      </div>

      {/* New Application Form */}
      {showForm && (
        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-xl font-semibold mb-4">New Application</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input
                type="text"
                value={newApp.company}
                onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <input
                type="text"
                value={newApp.position}
                onChange={(e) => setNewApp({ ...newApp, position: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <input
                type="text"
                value={newApp.source}
                onChange={(e) => setNewApp({ ...newApp, source: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="LinkedIn, Indeed, Company site..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source URL</label>
              <input
                type="url"
                value={newApp.sourceUrl || ''}
                onChange={(e) => setNewApp({ ...newApp, sourceUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Applied Date</label>
              <input
                type="date"
                value={newApp.appliedDate}
                onChange={(e) => setNewApp({ ...newApp, appliedDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stage</label>
              <select
                value={newApp.stage}
                onChange={(e) => setNewApp({ ...newApp, stage: e.target.value as PipelineStage })}
                className="w-full px-3 py-2 border rounded-md"
              >
                {Object.entries(stageConfig).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={newApp.notes}
                onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md h-24"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No applications yet. Click "Add Application" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-4 bg-card rounded-lg border flex items-center gap-4"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold truncate">{app.company}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${stageConfig[app.stage].color}`}>
                    {stageConfig[app.stage].label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{app.position}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(app.appliedDate), 'MMM d, yyyy')}
              </div>
              <select
                value={app.stage}
                onChange={(e) => handleStageChange(app.id, e.target.value as PipelineStage)}
                className="px-2 py-1 border rounded-md text-sm"
              >
                {Object.entries(stageConfig).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => handleDelete(app.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
