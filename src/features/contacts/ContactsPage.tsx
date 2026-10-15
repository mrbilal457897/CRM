import {
  Download,
  Grid3x3,
  List,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  Tags,
  Trash2,
  UserCog,
  Users,
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
import { ContactStatusBadge } from '@/components/common/StatusBadge'
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
import { formatDate } from '@/lib/format'
import { ContactCard } from '@/features/contacts/ContactCard'
import { ContactFormDrawer } from '@/features/contacts/ContactFormDrawer'
import {
  bulkAssignContacts,
  bulkDeleteContacts,
  bulkStatusContacts,
  bulkTagContacts,
  deleteContact,
  useCompanies,
  useContacts,
  useCurrentUser,
  usePermissions,
  useTags,
  useUsers,
  useUserNameMap,
} from '@/repository'
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, type ContactStatus } from '@/types/enums'
import type { Contact } from '@/types/models'

type ViewMode = 'table' | 'cards'

export function ContactsPage() {
  const contacts = useContacts()
  const companies = useCompanies()
  const users = useUsers()
  const userMap = useUserNameMap()
  const tags = useTags()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<ViewMode>('table')
  const [query, setQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((company) => [company.id, company])),
    [companies],
  )

  const scoped = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return contacts
    return contacts.filter((contact) => contact.ownerId === currentUser.id)
  }, [contacts, permissions.seesAllRecords, currentUser])

  const filtered = useMemo(() => {
    return scoped.filter((contact) => {
      if (query) {
        const haystack = `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.title}`.toLowerCase()
        if (!haystack.includes(query.toLowerCase())) return false
      }
      if (ownerFilter !== 'all' && contact.ownerId !== ownerFilter) return false
      if (companyFilter !== 'all' && contact.companyId !== companyFilter) return false
      if (statusFilter !== 'all' && contact.status !== statusFilter) return false
      if (tagFilter !== 'all' && !contact.tags.includes(tagFilter)) return false
      return true
    })
  }, [scoped, query, ownerFilter, companyFilter, statusFilter, tagFilter])

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

  const columns: Column<Contact>[] = [
    {
      id: 'name',
      header: 'Name',
      sortValue: (contact) => `${contact.firstName} ${contact.lastName}`,
      cell: (contact) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
          <div className="min-w-0">
            <Link
              to={`/contacts/${contact.id}`}
              className="block truncate font-medium hover:text-primary hover:underline"
            >
              {contact.firstName} {contact.lastName}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{contact.title || contact.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'company',
      header: 'Company',
      sortValue: (contact) => companyMap[contact.companyId ?? '']?.name ?? '',
      cell: (contact) => (
        <span className="text-sm">{companyMap[contact.companyId ?? '']?.name ?? '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (contact) => contact.status,
      cell: (contact) => <ContactStatusBadge status={contact.status} />,
    },
    {
      id: 'owner',
      header: 'Owner',
      sortValue: (contact) => userMap[contact.ownerId]?.name ?? '',
      cell: (contact) => {
        const owner = userMap[contact.ownerId]
        return owner ? (
          <span className="flex items-center gap-2">
            <Avatar name={owner.name} color={owner.avatarColor} size="xs" />
            <span className="hidden lg:inline">{owner.name.split(' ')[0]}</span>
          </span>
        ) : (
          '—'
        )
      },
    },
    {
      id: 'email',
      header: 'Email',
      cell: (contact) => (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Mail className="size-3.5" />
          <span className="hidden xl:inline">{contact.email}</span>
        </span>
      ),
    },
    {
      id: 'lastContacted',
      header: 'Last contact',
      align: 'right',
      sortValue: (contact) => contact.lastContactedAt ?? '',
      cell: (contact) => (
        <span className="text-xs text-muted-foreground">
          {contact.lastContactedAt ? formatDate(contact.lastContactedAt) : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description={`${filtered.length} of ${scoped.length} contacts`}
        actions={
          <>
            <div className="flex rounded-xl border p-0.5">
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('table')}
                aria-label="Table view"
                aria-pressed={view === 'table'}
              >
                <List />
              </Button>
              <Button
                variant={view === 'cards' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setView('cards')}
                aria-label="Card view"
                aria-pressed={view === 'cards'}
              >
                <Grid3x3 />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                exportToCsv(
                  'contacts.csv',
                  filtered.map((contact) => ({
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email,
                    phone: contact.phone,
                    title: contact.title,
                    company: companyMap[contact.companyId ?? '']?.name ?? '',
                    status: contact.status,
                    owner: userMap[contact.ownerId]?.name ?? '',
                    source: contact.source,
                    score: contact.score,
                    location: contact.location,
                    tags: contact.tags.join('; '),
                  })),
                )
              }
            >
              <Download />
              Export
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New contact
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
            placeholder="Search by name, email or title…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
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
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="lg:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CONTACT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {CONTACT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="lg:w-32">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.name}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={scoped.length === 0 ? 'No contacts yet' : 'No matching contacts'}
          description={
            scoped.length === 0
              ? 'Add your first contact to get started.'
              : 'Try adjusting your filters or search query.'
          }
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New contact
            </Button>
          }
          className="bg-card"
        />
      ) : view === 'table' ? (
        <>
          <DataTable
            data={paged}
            columns={columns}
            getRowId={(contact) => contact.id}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            defaultSort={{ id: 'name', desc: false }}
            rowActions={(contact) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/contacts/${contact.id}`}>Open</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setEditingContact(contact)}>Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setDeleteTarget(contact.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            bulkActions={(ids, clear) => (
              <BulkBar
                ids={ids}
                clear={clear}
                onAssign={(ownerId) => {
                  bulkAssignContacts(ids, ownerId)
                  toast.success(`Reassigned ${ids.length} contact(s)`)
                  clear()
                }}
                onStatus={(status) => {
                  bulkStatusContacts(ids, status)
                  toast.success(`Updated status for ${ids.length} contact(s)`)
                  clear()
                }}
                onTag={(tag) => {
                  bulkTagContacts(ids, tag)
                  toast.success(`Tagged ${ids.length} contact(s)`)
                  clear()
                }}
                onDelete={() => setDeleteTarget('bulk')}
              />
            )}
            mobileCard={(contact) => (
              <Link to={`/contacts/${contact.id}`} className="block">
                <ContactCard contact={contact} company={companyMap[contact.companyId ?? '']} />
              </Link>
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((contact) => (
            <Link key={contact.id} to={`/contacts/${contact.id}`} className="block">
              <ContactCard contact={contact} company={companyMap[contact.companyId ?? '']} />
            </Link>
          ))}
        </div>
      )}

      {view === 'cards' && filtered.length > 0 ? (
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

      <ContactFormDrawer open={creating} onOpenChange={setCreating} />
      <ContactFormDrawer
        open={Boolean(editingContact)}
        onOpenChange={(next) => !next && setEditingContact(null)}
        contact={editingContact}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title={deleteTarget === 'bulk' ? `Delete ${selectedIds.length} contact(s)?` : 'Delete this contact?'}
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget === 'bulk') {
            bulkDeleteContacts(selectedIds)
            toast.success(`Deleted ${selectedIds.length} contact(s)`)
            setSelectedIds([])
          } else if (deleteTarget) {
            deleteContact(deleteTarget)
            toast.success('Contact deleted')
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
  onStatus: (status: ContactStatus) => void
  onTag: (tag: string) => void
  onDelete: () => void
}

function BulkBar({ ids, clear, onAssign, onStatus, onTag, onDelete }: BulkBarProps) {
  const users = useUsers()
  const tags = useTags()

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
            {CONTACT_STATUSES.map((status) => (
              <DropdownMenuItem key={status} onSelect={() => onStatus(status)}>
                {CONTACT_STATUS_LABELS[status]}
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
