import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { JobApplication, PipelineStage } from '@/core/types'
import { STAGES, stageConfig } from './Applications'
import { format } from 'date-fns'
import { GripVertical, Calendar, MapPin } from 'lucide-react'

interface KanbanBoardProps {
  applications: JobApplication[]
  onStageChange: (id: string, stage: PipelineStage) => void
  onSelect: (app: JobApplication) => void
}

export function KanbanBoard({ applications, onStageChange, onSelect }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const activeApp = activeId ? applications.find(a => a.id === activeId) : null

  const byStage: Record<PipelineStage, JobApplication[]> = {
    applied: [], interviewing: [], offer: [], rejected: [], closed: []
  }
  applications.forEach(app => {
    if (app.status === 'active') {
      byStage[app.stage].push(app)
    }
  })

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const appId = active.id as string
    const targetStage = over.id as PipelineStage

    if (STAGES.includes(targetStage)) {
      const app = applications.find(a => a.id === appId)
      if (app && app.stage !== targetStage) {
        onStageChange(appId, targetStage)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            applications={byStage[stage]}
            onSelect={onSelect}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApp ? <KanbanCardOverlay application={activeApp} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

const stageColors: Record<PipelineStage, string> = {
  applied: 'bg-blue-500',
  interviewing: 'bg-amber-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-red-500',
  closed: 'bg-gray-400',
}

function KanbanColumn({
  stage,
  applications,
  onSelect,
}: {
  stage: PipelineStage
  applications: JobApplication[]
  onSelect: (app: JobApplication) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = stageConfig[stage]

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[280px] rounded-xl transition-all ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-500/30' : 'bg-accent/50'
      }`}
    >
      {/* Column Header */}
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${stageColors[stage]}`} />
          <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
          {applications.length}
        </span>
      </div>

      {/* Cards */}
      <div className="px-2 pb-2 space-y-2 min-h-[120px]">
        {applications.map(app => (
          <KanbanCard key={app.id} application={app} onSelect={onSelect} />
        ))}
        {applications.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-xs text-muted-foreground">Drop applications here</p>
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanCard({
  application,
  onSelect,
}: {
  application: JobApplication
  onSelect: (app: JobApplication) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card rounded-lg border border-border p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-200 dark:hover:border-blue-500/30"
      onClick={() => onSelect(application)}
    >
      <div className="flex items-start gap-2.5">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 p-0.5 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2.5 mb-1.5">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(application.company)}&size=28&background=random&bold=true&format=svg`}
              alt=""
              className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">{application.company}</p>
              <p className="text-xs text-muted-foreground truncate">{application.position}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(application.appliedDate), 'MMM d')}
            </span>
            {application.source && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {application.source}
              </span>
            )}
          </div>
          {application.followUpDate && (
            <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-1 rounded-md inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Follow-up: {format(new Date(application.followUpDate), 'MMM d')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KanbanCardOverlay({ application }: { application: JobApplication }) {
  return (
    <div className="bg-card rounded-lg border-2 border-blue-400 p-3.5 shadow-xl w-[280px] rotate-2">
      <div className="flex items-center gap-2.5">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(application.company)}&size=28&background=random&bold=true&format=svg`}
          alt=""
          className="w-7 h-7 rounded-md"
        />
        <div>
          <p className="text-sm font-semibold text-foreground truncate">{application.company}</p>
          <p className="text-xs text-muted-foreground truncate">{application.position}</p>
        </div>
      </div>
    </div>
  )
}
