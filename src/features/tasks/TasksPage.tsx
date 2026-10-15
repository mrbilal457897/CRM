import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { PriorityBadge } from '@/components/common/StatusBadge'
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportToCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { taskBucket, type TaskBucket } from '@/lib/metrics'
import {
  deleteTask,
  toggleTask,
  useCompanies,
  useContacts,
  useCurrentUser,
  useDeals,
  useLeads,
  usePermissions,
  useTasks,
  useUsers,
} from '@/repository'
import type { Task } from '@/types/models'

const BUCKETS: { id: TaskBucket; label: string; icon: typeof Clock; className: string }[] = [
  { id: 'overdue', label: 'Overdue', icon: CalendarClock, className: 'text-destructive' },
  { id: 'today', label: 'Today', icon: Clock, className: 'text-warning' },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarPlus, className: 'text-info' },
  { id: 'done', label: 'Completed', icon: CheckCircle2, className: 'text-success' },
]

export function TasksPage() {
  const tasks = useTasks()
  const users = useUsers()
  const deals = useDeals()
  const contacts = useContacts()
  const companies = useCompanies()
  const leads = useLeads()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])

  const relatedLabel = useMemo(() => {
    const dealMap = Object.fromEntries(deals.map((d) => [d.id, d.title]))
    const contactMap = Object.fromEntries(
      contacts.map((c) => [c.id, `${c.firstName} ${c.lastName}`]),
    )
    const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]))
    const leadMap = Object.fromEntries(
      leads.map((l) => [l.id, `${l.firstName} ${l.lastName}`]),
    )
    return (task: Task): { label: string; to: string } | null => {
      if (!task.relatedId || !task.relatedType) return null
      switch (task.relatedType) {
        case 'deal':
          return dealMap[task.relatedId] ? { label: dealMap[task.relatedId], to: `/deals?deal=${task.relatedId}` } : null
        case 'contact':
          return contactMap[task.relatedId]
            ? { label: contactMap[task.relatedId], to: `/contacts/${task.relatedId}` }
            : null
        case 'company':
          return companyMap[task.relatedId]
            ? { label: companyMap[task.relatedId], to: `/companies/${task.relatedId}` }
            : null
        case 'lead':
          return leadMap[task.relatedId] ? { label: leadMap[task.relatedId], to: '/leads' } : null
        default:
          return null
      }
    }
  }, [deals, contacts, companies, leads])

  const scoped = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return tasks
    return tasks.filter((task) => task.assignedToId === currentUser.id)
  }, [tasks, permissions.seesAllRecords, currentUser])

  const filtered = useMemo(() => {
    return scoped.filter((task) => {
      if (query && !task.title.toLowerCase().includes(query.toLowerCase())) return false
      if (assigneeFilter !== 'all' && task.assignedToId !== assigneeFilter) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      return true
    })
  }, [scoped, query, assigneeFilter, priorityFilter])

  const creating = searchParams.get('new') === '1'
  const setCreating = (value: boolean) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('new', '1')
    else params.delete('new')
    setSearchParams(params)
  }

  const grouped = useMemo(() => {
    const map: Record<TaskBucket, Task[]> = { overdue: [], today: [], upcoming: [], done: [] }
    filtered.forEach((task) => map[taskBucket(task)].push(task))
    ;(Object.keys(map) as TaskBucket[]).forEach((key) =>
      map[key].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)),
    )
    return map
  }, [filtered])

  const counts = useMemo(
    () => ({
      overdue: grouped.overdue.length,
      today: grouped.today.length,
      upcoming: grouped.upcoming.length,
      done: grouped.done.length,
    }),
    [grouped],
  )

  const renderTask = (task: Task) => {
    const assignee = userMap[task.assignedToId]
    const related = relatedLabel(task)
    const done = task.status === 'done'
    return (
      <li
        key={task.id}
        className="group flex items-start gap-3 rounded-xl border bg-card p-3 shadow-soft"
      >
        <button
          type="button"
          onClick={() => toggleTask(task.id)}
          className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
          aria-label={done ? 'Mark as open' : 'Mark as done'}
        >
          {done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>
            {task.title}
          </p>
          {task.description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3.5" />
              {formatDate(task.dueDate)}
            </span>
            <PriorityBadge priority={task.priority} />
            {related ? (
              <Link to={related.to} className="hover:text-primary hover:underline">
                {related.label}
              </Link>
            ) : null}
            {assignee ? (
              <span className="flex items-center gap-1.5">
                <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" />
                {assignee.name.split(' ')[0]}
              </span>
            ) : null}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Task actions" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditingTask(task)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteTarget(task.id)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${filtered.length} of ${scoped.length} tasks`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                exportToCsv(
                  'tasks.csv',
                  filtered.map((task) => ({
                    title: task.title,
                    dueDate: task.dueDate,
                    priority: task.priority,
                    status: task.status,
                    assignee: userMap[task.assignedToId]?.name ?? '',
                    related: relatedLabel(task)?.label ?? '',
                  })),
                )
              }
            >
              <Download />
              Export
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New task
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BUCKETS.map((bucket) => {
          const Icon = bucket.icon
          return (
            <div key={bucket.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
              <div className={`flex size-10 items-center justify-center rounded-xl bg-muted ${bucket.className}`}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="numeric text-xl font-semibold">{counts[bucket.id]}</p>
                <p className="text-xs text-muted-foreground">{bucket.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex">
          {permissions.seesAllRecords ? (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="lg:w-40">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="lg:w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={scoped.length === 0 ? 'No tasks yet' : 'No matching tasks'}
          description={
            scoped.length === 0
              ? 'Create a task to stay on top of your follow-ups.'
              : 'Try adjusting your filters or search query.'
          }
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New task
            </Button>
          }
          className="bg-card"
        />
      ) : (
        <div className="space-y-6">
          {BUCKETS.map((bucket) => {
            const items = grouped[bucket.id]
            if (items.length === 0) return null
            const Icon = bucket.icon
            return (
              <section key={bucket.id} className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className={`size-4 ${bucket.className}`} />
                  {bucket.label}
                  <span className="numeric rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </h2>
                <ul className="space-y-2">{items.map(renderTask)}</ul>
              </section>
            )
          })}
        </div>
      )}

      <TaskFormDialog open={creating} onOpenChange={setCreating} />
      <TaskFormDialog
        open={Boolean(editingTask)}
        onOpenChange={(next) => !next && setEditingTask(null)}
        task={editingTask}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete this task?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteTask(deleteTarget)
            toast.success('Task deleted')
          }
        }}
      />
    </div>
  )
}
