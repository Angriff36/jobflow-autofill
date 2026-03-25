import { useEffect, useState, useMemo } from 'react'
import { applicationRepository } from '@/core/storage/db'
import type { JobApplication, PipelineStage } from '@/core/types'
import { Briefcase, Clock, CheckCircle, XCircle, TrendingUp, Calendar, ArrowRight, Plus, User, Puzzle, Zap, Target, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'

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
  const { profile } = useAuth()

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
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const firstName = profile?.displayName?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{greeting}, {firstName}</h2>
          <p className="text-muted-foreground mt-1">Here's an overview of your job search progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <QuickAction icon={Plus} label="Add Application" onClick={() => navigate('/applications')} primary />
          <QuickAction icon={User} label="Edit Profile" onClick={() => navigate('/profile')} />
          <QuickAction icon={Puzzle} label="Extension" onClick={() => navigate('/settings')} />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Active"
          value={stats.totalActive}
          icon={<Briefcase className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="This Week"
          value={stats.thisWeek}
          icon={<Calendar className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Interviews"
          value={stats.byStage.interviewing}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Getting Started Checklist - show for new users */}
      {stats.totalActive < 3 && (
        <GettingStartedChecklist
          hasProfile={!!(profile?.displayName)}
          hasApplications={stats.totalActive > 0}
          onNavigate={navigate}
        />
      )}

      {/* Pipeline Overview */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pipeline Overview</h3>
          <button
            onClick={() => navigate('/applications')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STAGES.map((stage) => {
            const config = stageConfig[stage]
            const Icon = config.icon
            const count = stats.byStage[stage]
            return (
              <div
                key={stage}
                className={`rounded-xl border p-4 text-center transition-all hover:shadow-md cursor-pointer ${config.bgColor}`}
                onClick={() => navigate('/applications')}
              >
                <Icon className={`w-5 h-5 mx-auto mb-2 ${config.color}`} />
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{config.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Follow-ups */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Follow-ups Due
          </h3>
          {stats.upcomingFollowUps.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.upcomingFollowUps.slice(0, 5).map(app => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent cursor-pointer group"
                  onClick={() => navigate('/applications')}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&size=32&background=random&bold=true&format=svg`}
                      alt=""
                      className="w-8 h-8 rounded-lg"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-blue-600">{app.company}</p>
                      <p className="text-xs text-muted-foreground">{app.position}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    {app.followUpDate && format(new Date(app.followUpDate), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Recent Activity
          </h3>
          {stats.recentApps.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No applications yet</p>
              <p className="text-xs text-muted-foreground mb-3">Start tracking to see your activity here.</p>
              <button
                onClick={() => navigate('/applications')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add your first application
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recentApps.map(app => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent cursor-pointer group"
                  onClick={() => navigate('/applications')}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&size=32&background=random&bold=true&format=svg`}
                      alt=""
                      className="w-8 h-8 rounded-lg"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-blue-600">{app.company}</p>
                      <p className="text-xs text-muted-foreground">{app.position}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      stageConfig[app.stage].bgColor
                    } ${stageConfig[app.stage].color}`}>
                      {stageConfig[app.stage].label}
                    </span>
                    <p className="text-xs text-muted-foreground">
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

function StatCard({ label, value, icon, color }: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'emerald' | 'amber' | 'purple'
}) {
  const colorMap = {
    blue: { bg: 'from-blue-50 to-blue-100/50', iconBg: 'bg-blue-100', iconText: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'from-emerald-50 to-emerald-100/50', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'from-amber-50 to-amber-100/50', iconBg: 'bg-amber-100', iconText: 'text-amber-600', border: 'border-amber-100' },
    purple: { bg: 'from-purple-50 to-purple-100/50', iconBg: 'bg-purple-100', iconText: 'text-purple-600', border: 'border-purple-100' },
  }
  const c = colorMap[color]

  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-xl border ${c.border} p-5 shadow-sm`}>
      <div className={`inline-flex p-2 rounded-lg ${c.iconBg} ${c.iconText} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick, primary }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
        primary
          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          : 'bg-card text-foreground border border-border hover:bg-accent shadow-sm'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function GettingStartedChecklist({ hasProfile, hasApplications, onNavigate }: {
  hasProfile: boolean
  hasApplications: boolean
  onNavigate: (path: string) => void
}) {
  const steps = [
    { label: 'Set up your profile', done: hasProfile, action: () => onNavigate('/profile'), icon: User },
    { label: 'Install browser extension', done: false, action: () => onNavigate('/settings'), icon: Puzzle },
    { label: 'Track your first application', done: hasApplications, action: () => onNavigate('/applications'), icon: Target },
  ]
  const completed = steps.filter(s => s.done).length

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-500/5 dark:via-indigo-500/5 dark:to-purple-500/5 rounded-xl border border-blue-100 dark:border-blue-500/20 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Getting Started</h3>
            <span className="text-xs text-muted-foreground font-medium">{completed}/{steps.length} complete</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>
          <div className="space-y-2.5">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={step.action}
                className="w-full flex items-center gap-3 text-left group"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step.done
                    ? 'bg-emerald-500 text-white'
                    : 'border-2 border-gray-300 text-gray-400 group-hover:border-blue-400 group-hover:text-blue-500'
                }`}>
                  {step.done ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-3 h-3" />
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  step.done
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground group-hover:text-blue-600'
                }`}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
