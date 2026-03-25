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
import { GripVertical, Calendar } from 'lucide-react'

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
      className={`flex-shrink-0 w-64 rounded-lg transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'
      }`}
    >
      {/* Column Header */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.bg.split(' ')[0]}`} />
          <h3 className="text-sm font-semibold text-gray-700">{config.label}</h3>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>

      {/* Cards */}
      <div className="px-2 pb-2 space-y-2 min-h-[100px]">
        {applications.map(app => (
          <KanbanCard key={app.id} application={app} onSelect={onSelect} />
        ))}
        {applications.length === 0 && (
          <div className="py-8 text-center text-xs text-gray-400">
            Drop here
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
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onSelect(application)}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 p-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{application.company}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{application.position}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              {format(new Date(application.appliedDate), 'MMM d')}
            </span>
            {application.source && (
              <span className="truncate">{application.source}</span>
            )}
          </div>
          {application.followUpDate && (
            <div className="mt-1.5 text-xs text-amber-600 font-medium">
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
    <div className="bg-white rounded-lg border-2 border-blue-400 p-3 shadow-lg w-64 rotate-2">
      <p className="text-sm font-medium text-gray-900 truncate">{application.company}</p>
      <p className="text-xs text-gray-500 truncate mt-0.5">{application.position}</p>
    </div>
  )
}
