import {
  Building2,
  Download,
  Grid3x3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  Tags,
  Trash2,
  UserCog,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type Column } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { dealTotal, isOpen } from '@/lib/metrics'
import { CompanyCard } from '@/features/companies/CompanyCard'
import { CompanyFormDrawer } from '@/features/companies/CompanyFormDrawer'
import {
  bulkAssignCompanies,
  bulkDeleteCompanies,
  bulkTagCompanies,
  deleteCompany,
  useCompanies,
  useContacts,
  useCurrentUser,
  useDeals,
  usePermissions,
  useSettings,
  useSortedStages,
  useTags,
  useUsers,
  useUserNameMap,
} from '@/repository'
import { COMPANY_SIZES, INDUSTRIES } from '@/types/enums'
import type { Company } from '@/types/models'

type ViewMode = 'cards' | 'table'

export function CompaniesPage() {
  const companies = useCompanies()
  const contacts = useContacts()
  const deals = useDeals()
  const stages = useSortedStages()
  const users = useUsers()
  const userMap = useUserNameMap()
  const settings = useSettings()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<ViewMode>('cards')
  const [query, setQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editing, setEditing] = useState<Company | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const scoped = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return companies
    return companies.filter((company) => company.ownerId === currentUser.id)
  }, [companies, permissions.seesAllRecords, currentUser])

  const filtered = useMemo(() => {
    return scoped.filter((company) => {
      if (query) {
        const haystack = `${company.name} ${company.industry} ${company.location}`.toLowerCase()
        if (!haystack.includes(query.toLowerCase())) return false
      }
      if (industryFilter !== 'all' && company.industry !== industryFilter) return false
      if (sizeFilter !== 'all' && company.size !== sizeFilter) return false
      if (ownerFilter !== 'all' && company.ownerId !== ownerFilter) return false
      return true
    })
  }, [scoped, query, industryFilter, sizeFilter, ownerFilter])

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  )

  const stats = useMemo(() => {
    const map: Record<string, { contacts: number; openDeals: number; pipeline: number }> = {}
    companies.forEach((company) => {
      map[company.id] = { contacts: 0, openDeals: 0, pipeline: 0 }
    })
    contacts.forEach((contact) => {
      if (contact.companyId && map[contact.companyId]) map[contact.companyId].contacts += 1
    })
    deals.forEach((deal) => {
      if (deal.companyId && map[deal.companyId] && isOpen(deal, stages)) {
        map[deal.companyId].openDeals += 1
        map[deal.companyId].pipeline += dealTotal(deal)
      }
    })
    return map
  }, [companies, contacts, deals, stages])

  const creating = searchParams.get('new') === '1'
  const setCreating = (value: boolean) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('new', '1')
    else params.delete('new')
    setSearchParams(params)
  }

  const exportRows = (rows: Company[]) =>
    exportToCsv(
      'companies.csv',
      rows.map((company) => ({
        name: company.name,
        industry: company.industry,
        size: company.size,
        website: company.website,
        location: company.location,
        phone: company.phone,
        owner: userMap[company.ownerId]?.name ?? '',
        contacts: stats[company.id]?.contacts ?? 0,
        openDeals: stats[company.id]?.openDeals ?? 0,
        pipeline: stats[company.id]?.pipeline ?? 0,
        tags: company.tags.join('; '),
      })),
    )

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  const columns: Column<Company>[] = [
    {
      id: 'name',
      header: 'Company',
      sortValue: (company) => company.name,
      cell: (company) => (
        <Link
          to={`/companies/${company.id}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {company.name}
        </Link>
      ),
    },
    { id: 'industry', header: 'Industry', sortValue: (company) => company.industry, cell: (company) => company.industry },
    { id: 'size', header: 'Size', sortValue: (company) => company.size, cell: (company) => company.size },
    {
      id: 'contacts',
      header: 'Contacts',
      align: 'right',
      sortValue: (company) => stats[company.id]?.contacts ?? 0,
      cell: (company) => <span className="numeric">{stats[company.id]?.contacts ?? 0}</span>,
    },
    {
      id: 'pipeline',
      header: 'Open pipeline',
      align: 'right',
      sortValue: (company) => stats[company.id]?.pipeline ?? 0,
      cell: (company) => (
        <span className="numeric">{formatCurrency(stats[company.id]?.pipeline ?? 0, settings.currency)}</span>
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: (company) => {
        const owner = userMap[company.ownerId]
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
      sortValue: (company) => company.createdAt,
      cell: (company) => <span className="text-xs text-muted-foreground">{formatDate(company.createdAt)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description={`${filtered.length} of ${scoped.length} accounts`}
        actions={
          <>
            <div className="flex rounded-xl border p-0.5">
              <Button
                variant={view === 'cards' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('cards')}
                aria-label="Card view"
                aria-pressed={view === 'cards'}
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
            <Button variant="outline" onClick={() => exportRows(filtered)}>
              <Download />
              Export
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New company
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
            placeholder="Search companies…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sizeFilter} onValueChange={setSizeFilter}>
            <SelectTrigger className="lg:w-32">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sizes</SelectItem>
              {COMPANY_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={scoped.length === 0 ? 'No companies yet' : 'No matching companies'}
          description={
            scoped.length === 0
              ? 'Add your first account to get started.'
              : 'Try adjusting your filters or search query.'
          }
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New company
            </Button>
          }
          className="bg-card"
        />
      ) : view === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((company) => (
            <div key={company.id} className="relative">
              <Checkbox
                checked={selectedIds.includes(company.id)}
                onCheckedChange={() => toggleSelect(company.id)}
                aria-label={`Select ${company.name}`}
                className="absolute right-3 top-3 z-10 bg-card"
              />
              <Link to={`/companies/${company.id}`} className="block">
                <CompanyCard
                  company={company}
                  contactsCount={stats[company.id]?.contacts ?? 0}
                  openDeals={stats[company.id]?.openDeals ?? 0}
                  pipelineValue={stats[company.id]?.pipeline ?? 0}
                  currency={settings.currency}
                />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          data={paged}
          columns={columns}
          getRowId={(company) => company.id}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          defaultSort={{ id: 'name', desc: false }}
          rowActions={(company) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/companies/${company.id}`}>Open</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setEditing(company)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteTarget(company.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      )}

      {filtered.length > 0 ? (
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
      ) : null}

      {selectedIds.length > 0 ? (
        <CompanyBulkBar
          ids={selectedIds}
          clear={() => setSelectedIds([])}
          onAssign={(ownerId) => {
            bulkAssignCompanies(selectedIds, ownerId)
            toast.success(`Reassigned ${selectedIds.length} company(ies)`)
            setSelectedIds([])
          }}
          onTag={(tag) => {
            bulkTagCompanies(selectedIds, tag)
            toast.success(`Tagged ${selectedIds.length} company(ies)`)
            setSelectedIds([])
          }}
          onDelete={() => setDeleteTarget('bulk')}
        />
      ) : null}

      <CompanyFormDrawer open={creating} onOpenChange={setCreating} />
      <CompanyFormDrawer
        open={Boolean(editing)}
        onOpenChange={(next) => !next && setEditing(null)}
        company={editing}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title={deleteTarget === 'bulk' ? `Delete ${selectedIds.length} company(ies)?` : 'Delete this company?'}
        description="This will remove the company. Related contacts and deals will be unlinked. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget === 'bulk') {
            bulkDeleteCompanies(selectedIds)
            toast.success(`Deleted ${selectedIds.length} company(ies)`)
            setSelectedIds([])
          } else if (deleteTarget) {
            deleteCompany(deleteTarget)
            toast.success('Company deleted')
          }
        }}
      />
    </div>
  )
}

interface BulkBarProps {
  ids: string[]
  clear: () => void
  onAssign: (ownerId: string) => void
  onTag: (tag: string) => void
  onDelete: () => void
}

function CompanyBulkBar({ ids, clear, onAssign, onTag, onDelete }: BulkBarProps) {
  const users = useUsers()
  const tags = useTags()

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[calc(100%-2rem)] max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-card/95 px-4 py-2.5 shadow-lift backdrop-blur">
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
              <Tags />
              Add tag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Add tag</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tags.map((tag) => (
              <DropdownMenuItem key={tag.id} onSelect={() => onTag(tag.name)}>
                <Tag className="size-3.5" style={{ color: tag.color }} />
                {tag.name}
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
