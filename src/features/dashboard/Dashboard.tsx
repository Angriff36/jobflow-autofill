import { useEffect, useState } from 'react'
import { applicationRepository } from '@/core/storage/db'
import type { JobApplication, PipelineStage } from '@/core/types'
import { Briefcase, Clock, CheckCircle, XCircle } from 'lucide-react'

const stageConfig: Record<PipelineStage, { label: string; color: string; icon: typeof Briefcase }> = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800', icon: Briefcase },
  interviewing: { label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  offer: { label: 'Offer', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

export function Dashboard() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  async function loadApplications() {
    try {
      const apps = await applicationRepository.getActive()
      setApplications(apps)
    } catch (error) {
      console.error('Failed to load applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const stageCounts = applications.reduce((acc, app) => {
    acc[app.stage] = (acc[app.stage] || 0) + 1
    return acc
  }, {} as Record<PipelineStage, number>)

  const totalActive = applications.length
  const recentlyApplied = applications.filter((app) => {
    const applied = new Date(app.appliedDate)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return applied >= weekAgo
  }).length

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Total Active Applications</p>
          <p className="text-4xl font-bold">{totalActive}</p>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Applied This Week</p>
          <p className="text-4xl font-bold">{recentlyApplied}</p>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Interviews</p>
          <p className="text-4xl font-bold">{stageCounts.interviewing || 0}</p>
        </div>
      </div>

      <div className="p-6 bg-card rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Pipeline Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(Object.keys(stageConfig) as PipelineStage[]).map((stage) => {
            const config = stageConfig[stage]
            const Icon = config.icon
            return (
              <div key={stage} className="p-4 rounded-lg border text-center">
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stageCounts[stage] || 0}</p>
                <p className="text-sm text-muted-foreground">{config.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {applications.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>No active applications yet.</p>
          <p className="text-sm">Go to Applications to add your first job application.</p>
        </div>
      )}
    </div>
  )
}
