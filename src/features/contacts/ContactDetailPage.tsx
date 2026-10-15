import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  CheckSquare,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Tag as TagIcon,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { StatCard } from '@/components/common/StatCard'
import { ContactStatusBadge, StageBadge } from '@/components/common/StatusBadge'
import { TagChip } from '@/components/common/TagChip'
import { Timeline } from '@/components/common/Timeline'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportToCsv } from '@/lib/csv'
import { formatCurrency, formatDate, formatRelative } from '@/lib/format'
import { dealTotal, isOpen, isWon } from '@/lib/metrics'
import { ContactFormDrawer } from '@/features/contacts/ContactFormDrawer'
import { LogActivityDialog } from '@/features/activities/LogActivityDialog'
import { NoteList } from '@/features/notes/NoteList'
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog'
import {
  deleteContact,
  toggleTask,
  useActivities,
  useCompanies,
  useContacts,
  useDeals,
  useNotes,
  useSettings,
  useSortedStages,
  useTasks,
  useUserNameMap,
} from '@/repository'
import type { TimelineItem } from '@/types/models'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const contacts = useContacts()
  const companies = useCompanies()
  const deals = useDeals()
  const activities = useActivities()
  const users = useUserNameMap()
  const notes = useNotes()
  const tasks = useTasks()
  const stages = useSortedStages()
  const settings = useSettings()

  const [editOpen, setEditOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [activityType, setActivityType] = useState<'call' | 'email' | 'meeting'>('call')
  const [taskOpen, setTaskOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const contact = contacts.find((item) => item.id === id)
  const company = contact?.companyId ? companies.find((c) => c.id === contact.companyId) : undefined

  const contactDeals = useMemo(
    () => (contact ? deals.filter((deal) => deal.contactId === contact.id) : []),
    [deals, contact],
  )

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!contact) return []
    const items: TimelineItem[] = []
    activities
      .filter((activity) => activity.contactId === contact.id)
      .forEach((activity) =>
        items.push({ kind: 'activity', id: activity.id, at: activity.occurredAt, activity }),
      )
    notes
      .filter((note) => note.contactId === contact.id)
      .forEach((note) => items.push({ kind: 'note', id: note.id, at: note.createdAt, note }))
    tasks
      .filter((task) => task.relatedId === contact.id && task.status === 'done')
      .forEach((task) =>
        items.push({ kind: 'task', id: task.id, at: task.completedAt ?? task.updatedAt, task }),
      )
    return items.sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [contact, activities, notes, tasks])

  const contactTasks = contact ? tasks.filter((task) => task.relatedId === contact.id) : []
  const openValue = contactDeals.filter((deal) => isOpen(deal, stages)).reduce((sum, deal) => sum + dealTotal(deal), 0)
  const wonValue = contactDeals.filter((deal) => isWon(deal, stages)).reduce((sum, deal) => sum + dealTotal(deal), 0)

  if (!contact) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={UserIcon}
          title="Contact not found"
          description="This contact may have been deleted."
          action={
            <Button variant="outline" onClick={() => navigate('/contacts')}>
              <ArrowLeft />
              Back to contacts
            </Button>
          }
        />
      </div>
    )
  }

  const owner = users[contact.ownerId]

  const openActivity = (type: 'call' | 'email' | 'meeting') => {
    setActivityType(type)
    setActivityOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')}>
          <ArrowLeft />
          Contacts
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">
          <div className="-mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="rounded-2xl border-4 border-card bg-card">
                <Avatar name={`${contact.firstName} ${contact.lastName}`} size="xl" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-semibold tracking-tight">
                  {contact.firstName} {contact.lastName}
                </h1>
                <p className="text-sm text-muted-foreground">{contact.title || '—'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => openActivity('call')}>
                <Phone className="text-info" />
                Call
              </Button>
              <Button variant="outline" size="sm" onClick={() => openActivity('email')}>
                <Mail className="text-primary" />
                Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => openActivity('meeting')}>
                <CalendarPlus className="text-warning" />
                Meeting
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="More actions">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() =>
                      exportToCsv('contact.csv', [
                        {
                          firstName: contact.firstName,
                          lastName: contact.lastName,
                          email: contact.email,
                          phone: contact.phone,
                          title: contact.title,
                          company: company?.name ?? '',
                          status: contact.status,
                          owner: owner?.name ?? '',
                        },
                      ])
                    }
                  >
                    Export contact
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <Trash2 />
                    Delete contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <ContactStatusBadge status={contact.status} />
            <span className="flex items-center gap-1.5">
              <Mail className="size-4" />
              <a href={`mailto:${contact.email}`} className="hover:text-primary hover:underline">
                {contact.email}
              </a>
            </span>
            {contact.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone className="size-4" />
                {contact.phone}
              </span>
            ) : null}
            {company ? (
              <Link
                to={`/companies/${company.id}`}
                className="flex items-center gap-1.5 hover:text-primary hover:underline"
              >
                <Building2 className="size-4" />
                {company.name}
              </Link>
            ) : null}
            {contact.location ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {contact.location}
              </span>
            ) : null}
            {owner ? (
              <span className="flex items-center gap-1.5">
                <UserIcon className="size-4" />
                {owner.name}
              </span>
            ) : null}
          </div>

          {contact.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open pipeline"
          value={formatCurrency(openValue, settings.currency)}
          icon={TagIcon}
          gradient="a"
          hint={`${contactDeals.filter((deal) => isOpen(deal, stages)).length} open deals`}
        />
        <StatCard
          label="Won revenue"
          value={formatCurrency(wonValue, settings.currency)}
          icon={CheckSquare}
          gradient="c"
          hint={`${contactDeals.filter((deal) => isWon(deal, stages)).length} won`}
        />
        <StatCard
          label="Total deals"
          value={contactDeals.length}
          icon={Building2}
          gradient="b"
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 rounded-2xl border bg-card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <Timeline
                items={timeline.slice(0, 6)}
                users={users}
                emptyState={
                  <EmptyState
                    icon={Phone}
                    title="No activity yet"
                    description="Log a call, email or meeting to get started."
                  />
                }
              />
            </div>
            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Details</h2>
              <dl className="space-y-3 text-sm">
                <Row label="Source">{contact.source || '—'}</Row>
                <Row label="Score">
                  <span className="numeric">{contact.score}</span>
                </Row>
                <Row label="Last contacted">
                  {contact.lastContactedAt ? formatDate(contact.lastContactedAt) : '—'}
                </Row>
                <Row label="Created">{formatDate(contact.createdAt)}</Row>
                <Row label="Updated">{formatRelative(contact.updatedAt)}</Row>
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="rounded-2xl border bg-card p-5">
            <Timeline
              items={timeline}
              users={users}
              emptyState={
                <EmptyState
                  icon={Phone}
                  title="No activity yet"
                  description="Log a call, email or meeting to build the timeline."
                />
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="deals" className="mt-4">
          <div className="rounded-2xl border bg-card p-5">
            {contactDeals.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No deals"
                description="This contact has no deals yet."
              />
            ) : (
              <ul className="divide-y">
                {contactDeals.map((deal) => {
                  const stage = stages.find((s) => s.id === deal.stageId)
                  return (
                    <li key={deal.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{deal.title}</p>
                        {stage ? <StageBadge stage={stage} className="mt-1" /> : null}
                      </div>
                      <span className="numeric shrink-0 font-semibold">
                        {formatCurrency(dealTotal(deal), settings.currency)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
              <Plus />
              Add task
            </Button>
            {contactTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks"
                description="Create a task to follow up with this contact."
              />
            ) : (
              <ul className="space-y-2">
                {contactTasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 rounded-xl border p-3">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 size-4 shrink-0 rounded-[5px] border ${
                        task.status === 'done' ? 'border-primary bg-primary' : 'border-input'
                      }`}
                      aria-label="Toggle task"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${
                          task.status === 'done' ? 'text-muted-foreground line-through' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="rounded-2xl border bg-card p-5">
            <NoteList contactId={contact.id} companyId={contact.companyId} />
          </div>
        </TabsContent>
      </Tabs>

      <ContactFormDrawer open={editOpen} onOpenChange={setEditOpen} contact={contact} />
      <LogActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        defaultType={activityType}
        contactId={contact.id}
        companyId={contact.companyId}
      />
      <TaskFormDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        defaultRelated={{ type: 'contact', id: contact.id }}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this contact?"
        description="This will remove the contact and unlink related records. This cannot be undone."
        confirmLabel="Delete contact"
        destructive
        onConfirm={() => {
          deleteContact(contact.id)
          toast.success('Contact deleted')
          navigate('/contacts')
        }}
      />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}
