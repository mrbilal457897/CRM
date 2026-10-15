import {
  Download,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  Video,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportToCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { LogActivityDialog } from '@/features/activities/LogActivityDialog'
import {
  deleteActivity,
  useActivities,
  useCompanies,
  useContacts,
  useCurrentUser,
  useDeals,
  usePermissions,
  useUsers,
} from '@/repository'
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, type ActivityType } from '@/types/enums'
import type { Activity } from '@/types/models'

const TYPE_META: Record<ActivityType, { icon: typeof Phone; className: string }> = {
  call: { icon: Phone, className: 'bg-info/12 text-info' },
  email: { icon: Mail, className: 'bg-primary/12 text-primary' },
  meeting: { icon: Video, className: 'bg-warning/12 text-warning' },
  note: { icon: MessageSquare, className: 'bg-muted text-muted-foreground' },
}

export function ActivitiesPage() {
  const activities = useActivities()
  const users = useUsers()
  const contacts = useContacts()
  const companies = useCompanies()
  const deals = useDeals()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [logOpen, setLogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])
  const contactMap = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts])
  const companyMap = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c])), [companies])
  const dealMap = useMemo(() => Object.fromEntries(deals.map((d) => [d.id, d])), [deals])

  const scoped = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return activities
    return activities.filter((activity) => activity.userId === currentUser.id)
  }, [activities, permissions.seesAllRecords, currentUser])

  const filtered = useMemo(() => {
    return scoped.filter((activity) => {
      if (query) {
        const haystack = `${activity.subject} ${activity.body}`.toLowerCase()
        if (!haystack.includes(query.toLowerCase())) return false
      }
      if (typeFilter !== 'all' && activity.type !== typeFilter) return false
      if (userFilter !== 'all' && activity.userId !== userFilter) return false
      return true
    })
  }, [scoped, query, typeFilter, userFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>()
    const sorted = [...filtered].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    sorted.forEach((activity) => {
      const key = activity.occurredAt.slice(0, 10)
      const bucket = map.get(key) ?? []
      bucket.push(activity)
      map.set(key, bucket)
    })
    return Array.from(map.entries())
  }, [filtered])

  const relatedLabel = (activity: Activity) => {
    if (activity.dealId && dealMap[activity.dealId]) {
      return (
        <Link to={`/deals?deal=${activity.dealId}`} className="hover:text-primary hover:underline">
          {dealMap[activity.dealId].title}
        </Link>
      )
    }
    if (activity.contactId && contactMap[activity.contactId]) {
      const contact = contactMap[activity.contactId]
      return (
        <Link to={`/contacts/${contact.id}`} className="hover:text-primary hover:underline">
          {contact.firstName} {contact.lastName}
        </Link>
      )
    }
    if (activity.companyId && companyMap[activity.companyId]) {
      const company = companyMap[activity.companyId]
      return (
        <Link to={`/companies/${company.id}`} className="hover:text-primary hover:underline">
          {company.name}
        </Link>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description={`${filtered.length} of ${scoped.length} logged activities`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                exportToCsv(
                  'activities.csv',
                  filtered.map((activity) => ({
                    type: ACTIVITY_TYPE_LABELS[activity.type],
                    subject: activity.subject,
                    body: activity.body,
                    user: userMap[activity.userId]?.name ?? '',
                    occurredAt: activity.occurredAt,
                  })),
                )
              }
            >
              <Download />
              Export
            </Button>
            <Button onClick={() => setLogOpen(true)}>
              <Plus />
              Log activity
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activities…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="lg:w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ACTIVITY_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {permissions.seesAllRecords ? (
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="lg:w-40">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Phone}
          title={scoped.length === 0 ? 'No activities yet' : 'No matching activities'}
          description={
            scoped.length === 0
              ? 'Log your calls, emails and meetings to build a history.'
              : 'Try adjusting your filters or search query.'
          }
          action={
            <Button onClick={() => setLogOpen(true)}>
              <Plus />
              Log activity
            </Button>
          }
          className="bg-card"
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, items]) => (
            <div key={day} className="space-y-3">
              <h2 className="sticky top-0 z-10 bg-background/80 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                {formatRelativeDay(day)}
              </h2>
              <ol className="space-y-3">
                {items.map((activity) => {
                  const meta = TYPE_META[activity.type]
                  const Icon = meta.icon
                  const user = userMap[activity.userId]
                  return (
                    <li
                      key={activity.id}
                      className="flex gap-3 rounded-2xl border bg-card p-4 shadow-soft"
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${meta.className}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{activity.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {ACTIVITY_TYPE_LABELS[activity.type]}
                              {relatedLabel(activity) ? <> · {relatedLabel(activity)}</> : null}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="numeric text-xs text-muted-foreground">
                              {formatDate(activity.occurredAt, 'h:mm a')}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" aria-label="Activity actions">
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => setDeleteTarget(activity.id)}
                                >
                                  <Trash2 />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {activity.body ? (
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {activity.body}
                          </p>
                        ) : null}
                        {user ? (
                          <div className="flex items-center gap-2 pt-1">
                            <Avatar name={user.name} color={user.avatarColor} size="xs" />
                            <span className="text-xs text-muted-foreground">{user.name}</span>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </div>
      )}

      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete this activity?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteActivity(deleteTarget)
            toast.success('Activity deleted')
          }
        }}
      />
    </div>
  )
}

function formatRelativeDay(day: string): string {
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (day === todayKey) return 'Today'
  if (day === yesterday.toISOString().slice(0, 10)) return 'Yesterday'
  return formatDate(day, 'EEEE, MMM d, yyyy')
}
