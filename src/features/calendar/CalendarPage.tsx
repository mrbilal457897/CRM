import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, toISODate } from '@/lib/format'
import { dealTotal, isOpen } from '@/lib/metrics'
import {
  useActivities,
  useCurrentUser,
  useDeals,
  usePermissions,
  useSettings,
  useSortedStages,
  useTasks,
} from '@/repository'
import type { Deal, Task } from '@/types/models'

interface CalendarEvent {
  id: string
  date: string
  type: 'deal' | 'task' | 'activity'
  title: string
  meta: string
  color: string
  to?: string
}

export function CalendarPage() {
  const deals = useDeals()
  const tasks = useTasks()
  const activities = useActivities()
  const stages = useSortedStages()
  const settings = useSettings()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()

  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const scopedDeals = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return deals
    return deals.filter((deal) => deal.ownerId === currentUser.id)
  }, [deals, permissions.seesAllRecords, currentUser])

  const scopedTasks = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return tasks
    return tasks.filter((task) => task.assignedToId === currentUser.id)
  }, [tasks, permissions.seesAllRecords, currentUser])

  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = []
    scopedDeals.forEach((deal: Deal) => {
      const stage = stages.find((s) => s.id === deal.stageId)
      if (!isOpen(deal, stages)) return
      list.push({
        id: `deal-${deal.id}`,
        date: deal.expectedCloseDate.slice(0, 10),
        type: 'deal',
        title: deal.title,
        meta: formatCurrency(dealTotal(deal), settings.currency),
        color: stage?.color ?? '#6366f1',
        to: `/deals?deal=${deal.id}`,
      })
    })
    scopedTasks
      .filter((task: Task) => task.status === 'open')
      .forEach((task) => {
        list.push({
          id: `task-${task.id}`,
          date: task.dueDate.slice(0, 10),
          type: 'task',
          title: task.title,
          meta: `Task · ${task.priority}`,
          color: '#f59e0b',
        })
      })
    activities
      .filter((activity) => activity.type === 'meeting')
      .forEach((activity) => {
        list.push({
          id: `activity-${activity.id}`,
          date: activity.occurredAt.slice(0, 10),
          type: 'activity',
          title: activity.subject,
          meta: 'Meeting',
          color: '#0ea5e9',
        })
      })
    return list
  }, [scopedDeals, scopedTasks, activities, stages, settings.currency])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach((event) => {
      const bucket = map.get(event.date) ?? []
      bucket.push(event)
      map.set(event.date, bucket)
    })
    return map
  }, [events])

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Deals closing, task due dates and scheduled meetings"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => setCursor((c) => subMonths(c, 1))} aria-label="Previous month">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(cursor, 'MMMM yyyy')}</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Legend color="#6366f1" label="Deal close" />
          <Legend color="#f59e0b" label="Task" />
          <Legend color="#0ea5e9" label="Meeting" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = toISODate(day)
            const dayEvents = eventsByDay.get(key) ?? []
            const inMonth = isSameMonth(day, cursor)
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(key)}
                className={cn(
                  'min-h-24 border-b border-r p-1.5 text-left align-top transition-colors hover:bg-accent/50',
                  !inMonth && 'bg-muted/20 text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'numeric inline-flex size-6 items-center justify-center rounded-full text-xs',
                    isToday(day) && 'bg-primary font-semibold text-primary-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px]"
                      style={{ backgroundColor: `${event.color}1f`, color: event.color }}
                    >
                      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: event.color }} />
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 ? (
                    <p className="px-1.5 text-[11px] text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </p>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Sheet open={selectedDay !== null} onOpenChange={(next) => !next && setSelectedDay(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selectedDay ? formatDate(selectedDay, 'EEEE, MMMM d, yyyy') : 'Events'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {selectedEvents.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="Nothing scheduled"
                description="No deals, tasks or meetings for this day."
              />
            ) : (
              selectedEvents.map((event) => (
                <div key={event.id} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: event.color }} />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {event.type}
                    </span>
                  </div>
                  {event.to ? (
                    <Link to={event.to} className="mt-1 block font-medium hover:text-primary hover:underline">
                      {event.title}
                    </Link>
                  ) : (
                    <p className="mt-1 font-medium">{event.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{event.meta}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
