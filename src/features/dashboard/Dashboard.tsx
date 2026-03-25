import { useEffect, useState, useMemo } from 'react'
import { applicationRepository } from '@/core/storage/db'
import type { JobApplication, PipelineStage } from '@/core/types'
import { Briefcase, Clock, CheckCircle, XCircle, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const stageConfig: Record<PipelineStage, { label: string; color: string; bgColor: string; icon: typeof Briefcase }> = {
  applied: { label: 'Applied', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: Briefcase },
  interviewing: { label: 'Interviewing', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', icon: Clock },
  offer: { label: 'Offer', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', icon: XCircle },
  closed: { label: 'Closed', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200', icon: XCircle },
}

const STAGES: PipelineStage[] = ['applied', 'interviewing', 'offer', 'rejected', 'closed']

export function Dashboard() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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

  const stats = useMemo(() => {
    const active = applications.filter(a => a.status === 'active')
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const today = now.toISOString().split('T')[0]

    const byStage: Record<PipelineStage, number> = {
      applied: 0, interviewing: 0, offer: 0, rejected: 0, closed: 0
    }
    active.forEach(a => { byStage[a.stage]++ })

    const totalActive = active.length
    const responded = byStage.interviewing + byStage.offer + byStage.rejected + byStage.closed
    const responseRate = totalActive > 0 ? Math.round((responded / totalActive) * 100) : 0

    const thisWeek = active.filter(a => a.appliedDate >= weekAgo.toISOString().split('T')[0]).length
    const thisMonth = active.filter(a => a.appliedDate >= monthAgo.toISOString().split('T')[0]).length

    const upcomingFollowUps = active.filter(
      a => a.followUpDate && a.followUpDate <= today
    )

    const recentApps = [...active]
      .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate))
      .slice(0, 5)

    return { totalActive, byStage, responseRate, thisWeek, thisMonth, upcomingFollowUps, recentApps }
  }, [applications])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={() => navigate('/app/applications')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View all applications <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Active"
          value={stats.totalActive}
          icon={<Briefcase className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          label="Applied This Week"
          value={stats.thisWeek}
          icon={<Calendar className="w-5 h-5 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <StatCard
          label="Interviews"
          value={stats.byStage.interviewing}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          bgColor="bg-amber-50"
        />
        <StatCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Pipeline Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STAGES.map((stage) => {
            const config = stageConfig[stage]
            const Icon = config.icon
            const count = stats.byStage[stage]
            return (
              <div
                key={stage}
                className={`rounded-lg border p-4 text-center transition-colors hover:shadow-sm cursor-pointer ${config.bgColor}`}
                onClick={() => navigate('/app/applications')}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${config.color}`} />
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{config.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Follow-ups */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Upcoming Follow-ups
          </h3>
          {stats.upcomingFollowUps.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No follow-ups due</p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingFollowUps.slice(0, 5).map(app => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate('/app/applications')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.company}</p>
                    <p className="text-xs text-gray-500">{app.position}</p>
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    {app.followUpDate && format(new Date(app.followUpDate), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Recent Applications
          </h3>
          {stats.recentApps.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">No applications yet.</p>
              <button
                onClick={() => navigate('/app/applications')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
              >
                Add your first application
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentApps.map(app => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate('/app/applications')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.company}</p>
                    <p className="text-xs text-gray-500">{app.position}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      stageConfig[app.stage].bgColor
                    } ${stageConfig[app.stage].color}`}>
                      {stageConfig[app.stage].label}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(app.appliedDate), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, bgColor }: {
  label: string
  value: number | string
  icon: React.ReactNode
  bgColor: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
