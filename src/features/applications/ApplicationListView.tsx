import type { JobApplication, PipelineStage } from '@/core/types'
import { stageConfig, type SortField, type SortDirection } from './Applications'
import { Trash2, ArrowUp, ArrowDown, ExternalLink, Search } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  applications: JobApplication[]
  sortField: SortField
  sortDirection: SortDirection
  onToggleSort: (field: SortField) => void
  onSelect: (app: JobApplication) => void
  onStageChange: (id: string, stage: PipelineStage) => void
  onDelete: (id: string) => void
}

function SortIcon({ field, current, direction }: { field: SortField; current: SortField; direction: SortDirection }) {
  if (field !== current) return null
  return direction === 'asc'
    ? <ArrowUp className="w-3 h-3 inline ml-1" />
    : <ArrowDown className="w-3 h-3 inline ml-1" />
}

export function ApplicationListView({
  applications, sortField, sortDirection, onToggleSort, onSelect, onStageChange, onDelete
}: Props) {
  if (applications.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">No applications match your filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-[1fr_1fr_120px_130px_130px_80px] gap-2 px-5 py-3 bg-accent/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <button onClick={() => onToggleSort('company')} className="text-left hover:text-foreground flex items-center transition-colors">
          Company <SortIcon field="company" current={sortField} direction={sortDirection} />
        </button>
        <button onClick={() => onToggleSort('position')} className="text-left hover:text-foreground flex items-center transition-colors">
          Position <SortIcon field="position" current={sortField} direction={sortDirection} />
        </button>
        <span>Source</span>
        <button onClick={() => onToggleSort('stage')} className="text-left hover:text-foreground flex items-center transition-colors">
          Stage <SortIcon field="stage" current={sortField} direction={sortDirection} />
        </button>
        <button onClick={() => onToggleSort('appliedDate')} className="text-left hover:text-foreground flex items-center transition-colors">
          Applied <SortIcon field="appliedDate" current={sortField} direction={sortDirection} />
        </button>
        <span />
      </div>

      {/* Rows */}
      {applications.map((app) => (
        <div
          key={app.id}
          className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_130px_130px_80px] gap-2 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-accent/50 cursor-pointer transition-all items-center group"
          onClick={() => onSelect(app)}
        >
          {/* Company */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&size=32&background=random&bold=true&format=svg`}
              alt=""
              className="w-8 h-8 rounded-lg flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">{app.company}</p>
              {app.sourceUrl && (
                <a
                  href={app.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-blue-500 hover:underline inline-flex items-center gap-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  Link
                </a>
              )}
            </div>
          </div>

          {/* Position */}
          <p className="text-sm text-muted-foreground truncate">{app.position}</p>

          {/* Source */}
          <p className="text-sm text-muted-foreground truncate">{app.source || '—'}</p>

          {/* Stage */}
          <div onClick={e => e.stopPropagation()}>
            <select
              value={app.stage}
              onChange={e => onStageChange(app.id, e.target.value as PipelineStage)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer appearance-none ${stageConfig[app.stage].bg}`}
            >
              {Object.entries(stageConfig).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <p className="text-sm text-muted-foreground">
            {format(new Date(app.appliedDate), 'MMM d, yyyy')}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onDelete(app.id)}
              className="p-1.5 text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
