import {
  Download,
  Grid3x3,
  List,
  MoreHorizontal,
  Search,
  Sparkles,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type Column } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { KanbanBoard, type KanbanColumnDef } from '@/components/common/KanbanBoard'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { LeadStatusBadge } from '@/components/common/StatusBadge'
import { TagChip } from '@/components/common/TagChip'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportToCsv } from '@/lib/csv'
import { formatCurrency, formatDate } from '@/lib/format'
import { colorFromString } from '@/lib/colors'
import { ConvertLeadDialog } from '@/features/leads/ConvertLeadDialog'
import { LeadFormDrawer } from '@/features/leads/LeadFormDrawer'
import {
  bulkAssignLeads,
  bulkDeleteLeads,
  bulkStatusLeads,
  deleteLead,
  updateLead,
  useCurrentUser,
  useLeads,
  usePermissions,
  useSettings,
  useSources,
  useUsers,
  useUserNameMap,
} from '@/repository'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from '@/types/enums'
import type { Lead } from '@/types/models'

type ViewMode = 'board' | 'table'

export function LeadsPage() {
  const leads = useLeads()
  const users = useUsers()
  const userMap = useUserNameMap()
  const sources = useSources()
  const settings = useSettings()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<ViewMode>('board')
  const [query, setQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const scoped = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return leads
    return leads.filter((lead) => lead.ownerId === currentUser.id)
  }, [leads, permissions.seesAllRecords, currentUser])

  const filtered = useMemo(() => {
    return scoped.filter((lead) => {
      if (query) {
        const haystack = `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.companyName}`.toLowerCase()
        if (!haystack.includes(query.toLowerCase())) return false
      }
      if (ownerFilter !== 'all' && lead.ownerId !== ownerFilter) return false
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false
      return true
    })
  }, [scoped, query, ownerFilter, sourceFilter, statusFilter])

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  )

  const creating = searchParams.get('new') === '1'
  const setCreating = (value: boolean) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('new', '1')
    else params.delete('new')
    setSearchParams(params)
  }

  const columns: Column<Lead>[] = [
    {
      id: 'name',
      header: 'Lead',
      sortValue: (lead) => `${lead.firstName} ${lead.lastName}`,
      cell: (lead) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">
              {lead.firstName} {lead.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'company',
      header: 'Company',
      sortValue: (lead) => lead.companyName,
      cell: (lead) => <span className="text-sm">{lead.companyName || '—'}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (lead) => lead.status,
      cell: (lead) =>
        lead.convertedContactId ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
            <Sparkles className="size-3" />
            Converted
          </span>
        ) : (
          <LeadStatusBadge status={lead.status} />
        ),
    },
    {
      id: 'score',
      header: 'Score',
      align: 'right',
      sortValue: (lead) => lead.score,
      cell: (lead) => <span className="numeric">{lead.score}</span>,
    },
    {
      id: 'value',
      header: 'Est. value',
      align: 'right',
      sortValue: (lead) => lead.estimatedValue,
      cell: (lead) => (
        <span className="numeric">{formatCurrency(lead.estimatedValue, settings.currency)}</span>
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      sortValue: (lead) => userMap[lead.ownerId]?.name ?? '',
      cell: (lead) => {
        const owner = userMap[lead.ownerId]
        return owner ? (
          <span className="flex items-center gap-2">
            <Avatar name={owner.name} color={owner.avatarColor} size="xs" />
            <span className="hidden lg:inline">{owner.name}</span>
          </span>
        ) : (
          '—'
        )
      },
    },
    {
      id: 'created',
      header: 'Created',
      align: 'right',
      sortValue: (lead) => lead.createdAt,
      cell: (lead) => (
        <span className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</span>
      ),
    },
  ]

  const boardColumns: KanbanColumnDef[] = LEAD_STATUSES.map((status) => ({
    id: status,
    title: LEAD_STATUS_LABELS[status],
    color: colorFromString(status),
    meta: (
      <span className="numeric text-xs text-muted-foreground">
        {formatCurrency(
          filtered
            .filter((lead) => lead.status === status)
            .reduce((sum, lead) => sum + lead.estimatedValue, 0),
          settings.currency,
        )}
      </span>
    ),
  }))

  const moveLead = (leadId: string, columnId: string) => {
    updateLead(leadId, { status: columnId as LeadStatus })
    toast.success(`Moved to ${LEAD_STATUS_LABELS[columnId as LeadStatus]}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={`${filtered.length} of ${scoped.length} leads`}
        actions={
          <>
            <div className="flex rounded-xl border p-0.5">
              <Button
                variant={view === 'board' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('board')}
                aria-label="Board view"
                aria-pressed={view === 'board'}
              >
                <Grid3x3 />
              </Button>
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('table')}
                aria-label="Table view"
                aria-pressed={view === 'table'}
              >
                <List />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                exportToCsv(
                  'leads.csv',
                  filtered.map((lead) => ({
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email,
                    phone: lead.phone,
                    company: lead.companyName,
                    status: lead.status,
                    score: lead.score,
                    estimatedValue: lead.estimatedValue,
                    source: lead.source,
                    owner: userMap[lead.ownerId]?.name ?? '',
                    converted: lead.convertedContactId ? 'yes' : 'no',
                  })),
                )
              }
            >
              <Download />
              Export
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Users />
              New lead
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search leads…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
          {permissions.seesAllRecords ? (
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="lg:w-36">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="lg:w-36">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.name}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="lg:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={scoped.length === 0 ? 'No leads yet' : 'No matching leads'}
          description={
            scoped.length === 0
              ? 'Add your first lead to start building pipeline.'
              : 'Try adjusting your filters or search query.'
          }
          action={
            <Button onClick={() => setCreating(true)}>
              <Users />
              New lead
            </Button>
          }
          className="bg-card"
        />
      ) : view === 'board' ? (
        <KanbanBoard
          columns={boardColumns}
          items={filtered}
          getItemId={(lead) => lead.id}
          getColumnId={(lead) => lead.status}
          onMove={moveLead}
          onCardClick={(lead) => setEditingLead(lead)}
          renderCard={(lead) => (
            <LeadCard
              lead={lead}
              ownerName={userMap[lead.ownerId]?.name}
              ownerColor={userMap[lead.ownerId]?.avatarColor}
              currency={settings.currency}
              onConvert={() => setConvertingLead(lead)}
            />
          )}
        />
      ) : (
        <>
          <DataTable
            data={paged}
            columns={columns}
            getRowId={(lead) => lead.id}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            defaultSort={{ id: 'created', desc: true }}
            rowActions={(lead) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditingLead(lead)}>Edit</DropdownMenuItem>
                  {!lead.convertedContactId ? (
                    <DropdownMenuItem onSelect={() => setConvertingLead(lead)}>
                      <Sparkles />
                      Convert
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setDeleteTarget(lead.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            bulkActions={(ids, clear) => (
              <LeadBulkBar
                ids={ids}
                clear={clear}
                onAssign={(ownerId) => {
                  bulkAssignLeads(ids, ownerId)
                  toast.success(`Reassigned ${ids.length} lead(s)`)
                  clear()
                }}
                onStatus={(status) => {
                  bulkStatusLeads(ids, status)
                  toast.success(`Updated status for ${ids.length} lead(s)`)
                  clear()
                }}
                onDelete={() => setDeleteTarget('bulk')}
              />
            )}
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </>
      )}

      <LeadFormDrawer open={creating} onOpenChange={setCreating} />
      <LeadFormDrawer
        open={Boolean(editingLead)}
        onOpenChange={(next) => !next && setEditingLead(null)}
        lead={editingLead}
      />
      <ConvertLeadDialog
        lead={convertingLead}
        onOpenChange={(next) => !next && setConvertingLead(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title={deleteTarget === 'bulk' ? `Delete ${selectedIds.length} lead(s)?` : 'Delete this lead?'}
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget === 'bulk') {
            bulkDeleteLeads(selectedIds)
            toast.success(`Deleted ${selectedIds.length} lead(s)`)
            setSelectedIds([])
          } else if (deleteTarget) {
            deleteLead(deleteTarget)
            toast.success('Lead deleted')
          }
        }}
      />
    </div>
  )
}

interface LeadCardProps {
  lead: Lead
  ownerName?: string
  ownerColor?: string
  currency: string
  onConvert: () => void
}

function LeadCard({ lead, ownerName, ownerColor, currency, onConvert }: LeadCardProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {lead.firstName} {lead.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{lead.companyName || lead.email}</p>
        </div>
        <span className="numeric shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium">
          {lead.score}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="numeric text-sm font-semibold">
          {formatCurrency(lead.estimatedValue, currency)}
        </span>
        {ownerName ? <Avatar name={ownerName} color={ownerColor} size="xs" /> : null}
      </div>

      {lead.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {lead.tags.slice(0, 2).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      ) : null}

      {lead.convertedContactId ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <Sparkles className="size-3" />
          Converted
        </span>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={onConvert}>
          <Sparkles />
          Convert
        </Button>
      )}
    </div>
  )
}

interface LeadBulkBarProps {
  ids: string[]
  clear: () => void
  onAssign: (ownerId: string) => void
  onStatus: (status: LeadStatus) => void
  onDelete: () => void
}

function LeadBulkBar({ ids, clear, onAssign, onStatus, onDelete }: LeadBulkBarProps) {
  const users = useUsers()
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-2.5">
      <span className="text-sm font-medium">{ids.length} selected</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <UserCog />
              Assign owner
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Reassign to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {users.map((user) => (
              <DropdownMenuItem key={user.id} onSelect={() => onAssign(user.id)}>
                {user.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <List />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Set status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LEAD_STATUSES.map((status) => (
              <DropdownMenuItem key={status} onSelect={() => onStatus(status)}>
                {LEAD_STATUS_LABELS[status]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={clear}>
          Clear
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  )
}
