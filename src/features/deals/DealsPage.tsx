import { Filter, KanbanSquare, LayoutGrid, Plus, Search, Table2, TrendingUp, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { StageBadge } from '@/components/common/StatusBadge'
import { Avatar } from '@/components/common/Avatar'
import { KanbanBoard } from '@/components/common/KanbanBoard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/format'
import { dealTotal, isOpen, isRotting, isWon, pipelineValue, weightedValue } from '@/lib/metrics'
import { LossReasonDialog } from '@/features/deals/LossReasonDialog'
import { DealCard } from '@/features/deals/DealCard'
import { DealDetailDrawer } from '@/features/deals/DealDetailDrawer'
import { DealFormDrawer } from '@/features/deals/DealFormDrawer'
import {
  loseDeal,
  moveDealStage,
  useCompanies,
  useCurrentUser,
  useDeals,
  usePermissions,
  useSettings,
  useSortedStages,
  useUsers,
  useUserNameMap,
} from '@/repository'
import type { Deal } from '@/types/models'

type ViewMode = 'board' | 'table'

export function DealsPage() {
  const deals = useDeals()
  const stages = useSortedStages()
  const companies = useCompanies()
  const users = useUsers()
  const userMap = useUserNameMap()
  const settings = useSettings()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<ViewMode>('board')
  const [query, setQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [closeFilter, setCloseFilter] = useState<string>('all')
  const [minValue, setMinValue] = useState('')
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [pendingLoss, setPendingLoss] = useState<Deal | null>(null)

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((company) => [company.id, company])),
    [companies],
  )

  const scoped = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return deals
    return deals.filter((deal) => deal.ownerId === currentUser.id)
  }, [deals, permissions.seesAllRecords, currentUser])

  const filtered = useMemo(() => {
    const min = minValue ? Number(minValue) : 0
    const now = Date.now()
    return scoped.filter((deal) => {
      if (query) {
        const haystack = `${deal.title} ${companyMap[deal.companyId ?? '']?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(query.toLowerCase())) return false
      }
      if (ownerFilter !== 'all' && deal.ownerId !== ownerFilter) return false
      if (stageFilter !== 'all' && deal.stageId !== stageFilter) return false
      if (min > 0 && dealTotal(deal) < min) return false
      if (closeFilter !== 'all') {
        const days = Number(closeFilter)
        const close = new Date(deal.expectedCloseDate).getTime()
        if (close > now + days * 86400000) return false
      }
      return true
    })
  }, [scoped, query, ownerFilter, stageFilter, minValue, closeFilter, companyMap])

  const metrics = useMemo(
    () => ({
      open: scoped.filter((deal) => isOpen(deal, stages)).length,
      pipeline: pipelineValue(scoped, stages),
      weighted: weightedValue(scoped, stages),
      won: scoped.filter((deal) => isWon(deal, stages)).length,
    }),
    [scoped, stages],
  )

  const activeDealId = searchParams.get('deal')
  const activeDeal = filtered.find((deal) => deal.id === activeDealId) ?? scoped.find((d) => d.id === activeDealId) ?? null
  const creating = searchParams.get('new') === '1'

  const openDeal = (id: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('deal', id)
    setSearchParams(params)
  }

  const closeDeal = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('deal')
    setSearchParams(params)
  }

  const setCreating = (value: boolean) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('new', '1')
    else params.delete('new')
    setSearchParams(params)
  }

  const handleMove = (dealId: string, stageId: string) => {
    const deal = deals.find((item) => item.id === dealId)
    const stage = stages.find((item) => item.id === stageId)
    if (!deal || !stage) return
    if (stage.isLost) {
      setPendingLoss(deal)
      return
    }
    moveDealStage(dealId, stageId)
    toast.success(`Moved to ${stage.name}`)
  }

  const columns: Column<Deal>[] = [
    {
      id: 'title',
      header: 'Deal',
      sortValue: (deal) => deal.title,
      cell: (deal) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{deal.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {companyMap[deal.companyId ?? '']?.name ?? 'No company'}
          </p>
        </div>
      ),
    },
    {
      id: 'stage',
      header: 'Stage',
      sortValue: (deal) => stages.find((s) => s.id === deal.stageId)?.order ?? 0,
      cell: (deal) => {
        const stage = stages.find((s) => s.id === deal.stageId)
        return stage ? <StageBadge stage={stage} /> : <span>—</span>
      },
    },
    {
      id: 'value',
      header: 'Value',
      align: 'right',
      sortValue: (deal) => dealTotal(deal),
      cell: (deal) => (
        <span className="numeric font-medium">{formatCurrency(dealTotal(deal), settings.currency)}</span>
      ),
    },
    {
      id: 'probability',
      header: 'Prob.',
      align: 'right',
      sortValue: (deal) => deal.probability,
      cell: (deal) => <span className="text-muted-foreground">{deal.probability}%</span>,
    },
    {
      id: 'owner',
      header: 'Owner',
      sortValue: (deal) => userMap[deal.ownerId]?.name ?? '',
      cell: (deal) => {
        const owner = userMap[deal.ownerId]
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
      id: 'close',
      header: 'Close date',
      align: 'right',
      sortValue: (deal) => deal.expectedCloseDate,
      cell: (deal) => (
        <span className={isRotting(deal, stages) ? 'text-warning' : 'text-muted-foreground'}>
          {formatDate(deal.expectedCloseDate)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Drag deals between stages to update your pipeline."
        actions={
          <>
            <div className="flex rounded-xl border p-0.5">
              <Button
                variant={view === 'board' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('board')}
                aria-pressed={view === 'board'}
              >
                <KanbanSquare />
                Board
              </Button>
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
                aria-pressed={view === 'table'}
              >
                <Table2 />
                Table
              </Button>
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New deal
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open deals" value={metrics.open} icon={LayoutGrid} gradient="a" />
        <StatCard
          label="Pipeline value"
          value={formatCurrency(metrics.pipeline, settings.currency, { compact: true })}
          icon={Wallet}
          gradient="d"
        />
        <StatCard
          label="Weighted value"
          value={formatCurrency(metrics.weighted, settings.currency, { compact: true })}
          icon={TrendingUp}
          gradient="b"
        />
        <StatCard label="Won deals" value={metrics.won} icon={KanbanSquare} gradient="c" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search deals…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
          {permissions.seesAllRecords ? (
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="lg:w-40">
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
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="lg:w-36">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={closeFilter} onValueChange={setCloseFilter}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="Close date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any close date</SelectItem>
              <SelectItem value="7">Closing in 7 days</SelectItem>
              <SelectItem value="30">Closing in 30 days</SelectItem>
              <SelectItem value="90">Closing in 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={minValue}
            onChange={(event) => setMinValue(event.target.value)}
            placeholder="Min value"
            className="lg:w-32"
            aria-label="Minimum deal value"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={filtered.length === 0 && scoped.length > 0 ? Filter : KanbanSquare}
          title={scoped.length === 0 ? 'No deals yet' : 'No matching deals'}
          description={
            scoped.length === 0
              ? 'Create your first deal to start tracking your pipeline.'
              : 'Try adjusting your filters or search query.'
          }
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New deal
            </Button>
          }
          className="bg-card"
        />
      ) : view === 'board' ? (
        <KanbanBoard
          columns={stages.map((stage) => {
            const stageDeals = filtered.filter((deal) => deal.stageId === stage.id)
            const total = stageDeals.reduce((sum, deal) => sum + dealTotal(deal), 0)
            return {
              id: stage.id,
              title: stage.name,
              color: stage.color,
              meta: (
                <span className="numeric text-xs font-medium text-muted-foreground">
                  {formatCurrency(total, settings.currency, { compact: true })}
                </span>
              ),
            }
          })}
          items={filtered}
          getItemId={(deal) => deal.id}
          getColumnId={(deal) => deal.stageId}
          onMove={handleMove}
          onCardClick={(deal) => openDeal(deal.id)}
          renderCard={(deal) => (
            <DealCard
              deal={deal}
              stages={stages}
              owner={userMap[deal.ownerId]}
              company={deal.companyId ? companyMap[deal.companyId] : undefined}
            />
          )}
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(deal) => deal.id}
          onRowClick={(deal) => openDeal(deal.id)}
          defaultSort={{ id: 'value', desc: true }}
          mobileCard={(deal) => (
            <button
              type="button"
              onClick={() => openDeal(deal.id)}
              className="w-full rounded-2xl border bg-card p-4 text-left shadow-soft"
            >
              <DealCard
                deal={deal}
                stages={stages}
                owner={userMap[deal.ownerId]}
                company={deal.companyId ? companyMap[deal.companyId] : undefined}
              />
            </button>
          )}
        />
      )}

      <DealDetailDrawer
        deal={activeDeal}
        open={Boolean(activeDeal)}
        onOpenChange={(next) => !next && closeDeal()}
        onEdit={(deal) => {
          closeDeal()
          setEditingDeal(deal)
        }}
      />

      <DealFormDrawer open={creating} onOpenChange={setCreating} />
      <DealFormDrawer
        open={Boolean(editingDeal)}
        onOpenChange={(next) => !next && setEditingDeal(null)}
        deal={editingDeal}
      />

      <LossReasonDialog
        open={Boolean(pendingLoss)}
        onOpenChange={(next) => !next && setPendingLoss(null)}
        dealTitle={pendingLoss?.title ?? ''}
        onConfirm={(reason) => {
          if (pendingLoss) {
            loseDeal(pendingLoss.id, reason)
            toast.success('Deal marked as lost')
          }
        }}
      />
    </div>
  )
}
