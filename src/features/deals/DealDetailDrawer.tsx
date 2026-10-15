import {
  Building2,
  CalendarPlus,
  CheckSquare,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { StageBadge } from '@/components/common/StatusBadge'
import { Timeline } from '@/components/common/Timeline'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate, formatDateTime, formatRelative } from '@/lib/format'
import { dealTotal } from '@/lib/metrics'
import { NoteList } from '@/features/notes/NoteList'
import { LogActivityDialog } from '@/features/activities/LogActivityDialog'
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog'
import {
  deleteDeal,
  toggleTask,
  useActivities,
  useCompanies,
  useContacts,
  useNotes,
  useSettings,
  useSortedStages,
  useTasks,
  useUserNameMap,
} from '@/repository'
import type { Deal, TimelineItem } from '@/types/models'

interface DealDetailDrawerProps {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (deal: Deal) => void
}

export function DealDetailDrawer({ deal, open, onOpenChange, onEdit }: DealDetailDrawerProps) {
  const companies = useCompanies()
  const contacts = useContacts()
  const users = useUserNameMap()
  const stages = useSortedStages()
  const activities = useActivities()
  const notes = useNotes()
  const tasks = useTasks()
  const settings = useSettings()

  const [activityOpen, setActivityOpen] = useState(false)
  const [activityType, setActivityType] = useState<'call' | 'email' | 'meeting'>('call')
  const [taskOpen, setTaskOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const stage = deal ? stages.find((s) => s.id === deal.stageId) : undefined

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!deal) return []
    const items: TimelineItem[] = []
    activities
      .filter((activity) => activity.dealId === deal.id)
      .forEach((activity) =>
        items.push({ kind: 'activity', id: activity.id, at: activity.occurredAt, activity }),
      )
    notes
      .filter((note) => note.dealId === deal.id)
      .forEach((note) => items.push({ kind: 'note', id: note.id, at: note.createdAt, note }))
    deal.stageHistory.forEach((change) =>
      items.push({ kind: 'stage', id: change.id, at: change.at, change, dealId: deal.id }),
    )
    tasks
      .filter((task) => task.relatedId === deal.id && task.status === 'done')
      .forEach((task) =>
        items.push({
          kind: 'task',
          id: task.id,
          at: task.completedAt ?? task.updatedAt,
          task,
        }),
      )
    return items.sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [deal, activities, notes, tasks])

  const dealTasks = deal ? tasks.filter((task) => task.relatedId === deal.id) : []
  const company = deal?.companyId ? companies.find((c) => c.id === deal.companyId) : undefined
  const contact = deal?.contactId ? contacts.find((c) => c.id === deal.contactId) : undefined
  const owner = deal ? users[deal.ownerId] : undefined

  const openActivity = (type: 'call' | 'email' | 'meeting') => {
    setActivityType(type)
    setActivityOpen(true)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[620px] p-0">
        {deal ? (
          <>
            <SheetHeader className="pr-12">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <SheetTitle className="pr-2 text-lg leading-snug">{deal.title}</SheetTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {stage ? <StageBadge stage={stage} /> : null}
                    <span className="numeric text-sm font-semibold">
                      {formatCurrency(dealTotal(deal), settings.currency)}
                    </span>
                  </div>
                </div>
                <div className="mr-1 flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" onClick={() => onEdit(deal)} aria-label="Edit deal">
                    <Pencil />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setConfirmDelete(true)}
                      >
                        <Trash2 />
                        Delete deal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openActivity('call')}>
                  <Phone className="text-info" />
                  Log call
                </Button>
                <Button size="sm" variant="outline" onClick={() => openActivity('email')}>
                  <Mail className="text-primary" />
                  Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => openActivity('meeting')}>
                  <CalendarPlus className="text-warning" />
                  Meeting
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
                  <Plus />
                  Task
                </Button>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b px-6 py-3">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-6 py-5">
                  <TabsContent value="overview" className="mt-0 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <Detail label="Owner" icon={<UserIcon className="size-3.5" />}>
                        {owner ? (
                          <span className="flex items-center gap-2">
                            <Avatar name={owner.name} color={owner.avatarColor} size="xs" />
                            {owner.name}
                          </span>
                        ) : (
                          '—'
                        )}
                      </Detail>
                      <Detail label="Company" icon={<Building2 className="size-3.5" />}>
                        {company ? (
                          <Link to={`/companies/${company.id}`} className="hover:text-primary hover:underline">
                            {company.name}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </Detail>
                      <Detail label="Contact">
                        {contact ? (
                          <Link to={`/contacts/${contact.id}`} className="hover:text-primary hover:underline">
                            {contact.firstName} {contact.lastName}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </Detail>
                      <Detail label="Expected close">{formatDate(deal.expectedCloseDate)}</Detail>
                      <Detail label="Source">{deal.source || '—'}</Detail>
                      <Detail label="Created">{formatDate(deal.createdAt)}</Detail>
                    </div>

                    <div className="rounded-xl border p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <TrendingUp className="size-4" />
                          Probability
                        </span>
                        <span className="font-medium">{deal.probability}%</span>
                      </div>
                      <Progress value={deal.probability} className="mt-2" />
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Weighted value</span>
                        <span className="numeric font-medium text-foreground">
                          {formatCurrency((dealTotal(deal) * deal.probability) / 100, settings.currency)}
                        </span>
                      </div>
                    </div>

                    {deal.lostReason ? (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                        <p className="font-medium text-destructive">Lost reason</p>
                        <p className="mt-0.5 text-muted-foreground">{deal.lostReason}</p>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-2 text-sm font-semibold">Line items</p>
                      {deal.items.length === 0 ? (
                        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                          No line items — deal value is set manually.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">Item</th>
                                <th className="px-2 py-2 text-right font-medium">Qty</th>
                                <th className="px-2 py-2 text-right font-medium">Price</th>
                                <th className="px-2 py-2 text-right font-medium">Disc</th>
                                <th className="px-3 py-2 text-right font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deal.items.map((item) => (
                                <tr key={item.id} className="border-t">
                                  <td className="px-3 py-2">{item.productName || '—'}</td>
                                  <td className="numeric px-2 py-2 text-right">{item.quantity}</td>
                                  <td className="numeric px-2 py-2 text-right">
                                    {formatCurrency(item.unitPrice, settings.currency)}
                                  </td>
                                  <td className="numeric px-2 py-2 text-right">{item.discount}%</td>
                                  <td className="numeric px-3 py-2 text-right font-medium">
                                    {formatCurrency(
                                      item.quantity * item.unitPrice * (1 - item.discount / 100),
                                      settings.currency,
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="border-t bg-muted/40">
                              <tr>
                                <td colSpan={4} className="px-3 py-2 text-right text-sm text-muted-foreground">
                                  Total
                                </td>
                                <td className="numeric px-3 py-2 text-right font-semibold">
                                  {formatCurrency(dealTotal(deal), settings.currency)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>

                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      Created by {users[deal.createdBy]?.name ?? 'Unknown'} · Updated{' '}
                      {formatDateTime(deal.updatedAt)}
                    </p>
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-0">
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
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0">
                    <NoteList dealId={deal.id} companyId={deal.companyId} contactId={deal.contactId} />
                  </TabsContent>

                  <TabsContent value="tasks" className="mt-0 space-y-3">
                    <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
                      <Plus />
                      Add task
                    </Button>
                    {dealTasks.length === 0 ? (
                      <EmptyState
                        icon={CheckSquare}
                        title="No tasks"
                        description="Create a task to keep this deal moving."
                      />
                    ) : (
                      <ul className="space-y-2">
                        {dealTasks.map((task) => (
                          <li
                            key={task.id}
                            className="flex items-start gap-3 rounded-xl border p-3"
                          >
                            <button
                              type="button"
                              onClick={() => toggleTask(task.id)}
                              className={`mt-0.5 size-4 shrink-0 rounded-[5px] border ${
                                task.status === 'done'
                                  ? 'border-primary bg-primary'
                                  : 'border-input'
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
                              <p className="text-xs text-muted-foreground">
                                Due {formatDate(task.dueDate)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-0">
                    <ol className="space-y-4">
                      {[...deal.stageHistory].reverse().map((change) => (
                        <li key={change.id} className="flex gap-3">
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          <div>
                            <p className="text-sm">
                              {change.fromName
                                ? `Moved from ${change.fromName} to ${change.toName}`
                                : `Added to ${change.toName}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {users[change.userId]?.name ?? 'Unknown'} · {formatRelative(change.at)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>

            <LogActivityDialog
              open={activityOpen}
              onOpenChange={setActivityOpen}
              defaultType={activityType}
              dealId={deal.id}
              contactId={deal.contactId}
              companyId={deal.companyId}
            />
            <TaskFormDialog
              open={taskOpen}
              onOpenChange={setTaskOpen}
              defaultRelated={{ type: 'deal', id: deal.id }}
            />
            <ConfirmDialog
              open={confirmDelete}
              onOpenChange={setConfirmDelete}
              title="Delete this deal?"
              description="This will remove the deal and unlink related activity. This cannot be undone."
              confirmLabel="Delete deal"
              destructive
              onConfirm={() => {
                deleteDeal(deal.id)
                onOpenChange(false)
                toast.success('Deal deleted')
              }}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Detail({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  )
}
