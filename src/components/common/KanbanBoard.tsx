import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import * as React from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface KanbanColumnDef {
  id: string
  title: string
  color: string
  meta?: ReactNode
}

interface KanbanBoardProps<T> {
  columns: KanbanColumnDef[]
  items: T[]
  getItemId: (item: T) => string
  getColumnId: (item: T) => string
  renderCard: (item: T, isDragging: boolean) => ReactNode
  onMove: (itemId: string, columnId: string) => void
  onCardClick?: (item: T) => void
  className?: string
  columnClassName?: string
}

export function KanbanBoard<T>({
  columns,
  items,
  getItemId,
  getColumnId,
  renderCard,
  onMove,
  onCardClick,
  className,
  columnClassName,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const activeItem = activeId ? items.find((item) => getItemId(item) === activeId) ?? null : null

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const itemId = String(active.id)
    const columnId = String(over.id)
    const item = items.find((candidate) => getItemId(candidate) === itemId)
    if (!item) return
    if (getColumnId(item) === columnId) return
    onMove(itemId, columnId)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={cn('flex gap-4 overflow-x-auto pb-4 scrollbar-thin', className)}>
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            className={columnClassName}
            count={items.filter((item) => getColumnId(item) === column.id).length}
          >
            {items
              .filter((item) => getColumnId(item) === column.id)
              .map((item) => (
                <DraggableCard
                  key={getItemId(item)}
                  id={getItemId(item)}
                  onClick={() => onCardClick?.(item)}
                >
                  {(isDragging) => renderCard(item, isDragging)}
                </DraggableCard>
              ))}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeItem ? (
          <div className="rotate-2 cursor-grabbing rounded-xl border bg-card p-3 shadow-lift">
            {renderCard(activeItem, false)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface KanbanColumnProps {
  column: KanbanColumnDef
  count: number
  className?: string
  children: ReactNode
}

function KanbanColumn({ column, count, className, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[85vw] shrink-0 flex-col rounded-2xl border bg-muted/30 transition-colors sm:w-80',
        isOver && 'border-primary/60 bg-primary/5 ring-2 ring-primary/30',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="text-sm font-semibold">{column.title}</span>
          <span className="rounded-full bg-background px-1.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
        </div>
        {column.meta}
      </div>
      <div className="flex max-h-[calc(100vh-19rem)] flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-3 scrollbar-thin">
        {children}
      </div>
    </div>
  )
}

interface DraggableCardProps {
  id: string
  onClick?: () => void
  children: (isDragging: boolean) => ReactNode
}

function DraggableCard({ id, onClick, children }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        'touch-none rounded-xl border bg-card p-3 text-left shadow-sm transition-shadow',
        'hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        isDragging && 'opacity-40',
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {children(isDragging)}
    </div>
  )
}
