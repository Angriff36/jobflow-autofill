import type { JobApplication, PipelineStage } from '@/core/types'
import { stageConfig, type SortField, type SortDirection } from './Applications'
import { Trash2, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
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
      <div className="py-8 text-center text-gray-500 text-sm">
        No applications match your filters.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-[1fr_1fr_120px_130px_130px_80px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <button onClick={() => onToggleSort('company')} className="text-left hover:text-gray-700 flex items-center">
          Company <SortIcon field="company" current={sortField} direction={sortDirection} />
        </button>
        <button onClick={() => onToggleSort('position')} className="text-left hover:text-gray-700 flex items-center">
          Position <SortIcon field="position" current={sortField} direction={sortDirection} />
        </button>
        <span>Source</span>
        <button onClick={() => onToggleSort('stage')} className="text-left hover:text-gray-700 flex items-center">
          Stage <SortIcon field="stage" current={sortField} direction={sortDirection} />
        </button>
        <button onClick={() => onToggleSort('appliedDate')} className="text-left hover:text-gray-700 flex items-center">
          Applied <SortIcon field="appliedDate" current={sortField} direction={sortDirection} />
        </button>
        <span />
      </div>

      {/* Rows */}
      {applications.map((app) => (
        <div
          key={app.id}
          className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_130px_130px_80px] gap-2 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors items-center"
          onClick={() => onSelect(app)}
        >
          {/* Company */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{app.company}</p>
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
          <p className="text-sm text-gray-600 truncate">{app.position}</p>

          {/* Source */}
          <p className="text-sm text-gray-500 truncate">{app.source || '—'}</p>

          {/* Stage */}
          <div onClick={e => e.stopPropagation()}>
            <select
              value={app.stage}
              onChange={e => onStageChange(app.id, e.target.value as PipelineStage)}
              className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${stageConfig[app.stage].bg}`}
            >
              {Object.entries(stageConfig).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <p className="text-sm text-gray-500">
            {format(new Date(app.appliedDate), 'MMM d, yyyy')}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onDelete(app.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
