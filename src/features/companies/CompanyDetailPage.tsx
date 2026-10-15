import {
  ArrowLeft,
  Building2,
  CheckSquare,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  TrendingUp,
  User as UserIcon,
  Users,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/format'
import { dealTotal, isOpen, isWon } from '@/lib/metrics'
import { CompanyFormDrawer } from '@/features/companies/CompanyFormDrawer'
import { LogActivityDialog } from '@/features/activities/LogActivityDialog'
import { NoteList } from '@/features/notes/NoteList'
import {
  deleteCompany,
  useActivities,
  useCompanies,
  useContacts,
  useDeals,
  useSettings,
  useSortedStages,
  useTasks,
  useUserNameMap,
} from '@/repository'
import type { TimelineItem } from '@/types/models'

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const companies = useCompanies()
  const contacts = useContacts()
  const deals = useDeals()
  const activities = useActivities()
  const tasks = useTasks()
  const users = useUserNameMap()
  const stages = useSortedStages()
  const settings = useSettings()

  const [editOpen, setEditOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [activityType, setActivityType] = useState<'call' | 'email' | 'meeting'>('call')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const company = companies.find((item) => item.id === id)

  const companyContacts = useMemo(
    () => (company ? contacts.filter((contact) => contact.companyId === company.id) : []),
    [contacts, company],
  )
  const companyDeals = useMemo(
    () => (company ? deals.filter((deal) => deal.companyId === company.id) : []),
    [deals, company],
  )

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!company) return []
    const items: TimelineItem[] = []
    activities
      .filter((activity) => activity.companyId === company.id)
      .forEach((activity) =>
        items.push({ kind: 'activity', id: activity.id, at: activity.occurredAt, activity }),
      )
    tasks
      .filter((task) => task.relatedId === company.id && task.status === 'done')
      .forEach((task) =>
        items.push({ kind: 'task', id: task.id, at: task.completedAt ?? task.updatedAt, task }),
      )
    return items.sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [company, activities, tasks])

  const openValue = companyDeals.filter((deal) => isOpen(deal, stages)).reduce((sum, deal) => sum + dealTotal(deal), 0)
  const wonValue = companyDeals.filter((deal) => isWon(deal, stages)).reduce((sum, deal) => sum + dealTotal(deal), 0)

  if (!company) {
    return (
      <EmptyState
        icon={Building2}
        title="Company not found"
        description="This company may have been deleted."
        action={
          <Button variant="outline" onClick={() => navigate('/companies')}>
            <ArrowLeft />
            Back to companies
          </Button>
        }
      />
    )
  }

  const owner = users[company.ownerId]
  const openActivity = (type: 'call' | 'email' | 'meeting') => {
    setActivityType(type)
    setActivityOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/companies')}>
          <ArrowLeft />
          Companies
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">
          <div className="-mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl border-4 border-card bg-primary/10 text-primary">
                <Building2 className="size-7" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {company.industry} · {company.size} employees
                </p>
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
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <Trash2 />
                    Delete company
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {company.website ? (
              <a
                href={`https://${company.website.replace(/^https?:\/\//, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-primary hover:underline"
              >
                <Globe className="size-4" />
                {company.website}
              </a>
            ) : null}
            {company.location ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {company.location}
              </span>
            ) : null}
            {company.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone className="size-4" />
                {company.phone}
              </span>
            ) : null}
            {owner ? (
              <span className="flex items-center gap-1.5">
                <UserIcon className="size-4" />
                {owner.name}
              </span>
            ) : null}
          </div>

          {company.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {company.tags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open pipeline" value={formatCurrency(openValue, settings.currency)} icon={TrendingUp} gradient="a" />
        <StatCard label="Won revenue" value={formatCurrency(wonValue, settings.currency)} icon={CheckSquare} gradient="c" />
        <StatCard label="Contacts" value={companyContacts.length} icon={Users} gradient="b" />
        <StatCard label="Deals" value={companyDeals.length} icon={Building2} gradient="d" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
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
                    description="Log an interaction to get started."
                  />
                }
              />
            </div>
            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold">About</h2>
              <p className="text-sm text-muted-foreground">
                {company.description || 'No description added.'}
              </p>
              <dl className="space-y-3 border-t pt-4 text-sm">
                <Row label="Industry">{company.industry}</Row>
                <Row label="Size">{company.size} employees</Row>
                <Row label="Created">{formatDate(company.createdAt)}</Row>
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <div className="rounded-2xl border bg-card p-5">
            {companyContacts.length === 0 ? (
              <EmptyState icon={Users} title="No contacts" description="No contacts linked to this company yet." />
            ) : (
              <ul className="divide-y">
                {companyContacts.map((contact) => (
                  <li key={contact.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
                      <div>
                        <Link
                          to={`/contacts/${contact.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{contact.title || contact.email}</p>
                      </div>
                    </div>
                    <ContactStatusBadge status={contact.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="mt-4">
          <div className="rounded-2xl border bg-card p-5">
            {companyDeals.length === 0 ? (
              <EmptyState icon={Building2} title="No deals" description="No deals linked to this company." />
            ) : (
              <ul className="divide-y">
                {companyDeals.map((deal) => {
                  const stage = stages.find((s) => s.id === deal.stageId)
                  return (
                    <li key={deal.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <Link to={`/deals?deal=${deal.id}`} className="truncate font-medium hover:text-primary hover:underline">
                          {deal.title}
                        </Link>
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

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-2xl border bg-card p-5">
            <Timeline
              items={timeline}
              users={users}
              emptyState={
                <EmptyState icon={Phone} title="No activity yet" description="Log an interaction to build the timeline." />
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="rounded-2xl border bg-card p-5">
            <NoteList companyId={company.id} />
          </div>
        </TabsContent>
      </Tabs>

      <CompanyFormDrawer open={editOpen} onOpenChange={setEditOpen} company={company} />
      <LogActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        defaultType={activityType}
        companyId={company.id}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this company?"
        description="This will remove the company and unlink related records. This cannot be undone."
        confirmLabel="Delete company"
        destructive
        onConfirm={() => {
          deleteCompany(company.id)
          toast.success('Company deleted')
          navigate('/companies')
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
