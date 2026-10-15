import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend as RLegend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  Briefcase,
  Clock,
  DollarSign,
  Flame,
  Percent,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { PriorityBadge } from '@/components/common/StatusBadge'
import { StatCard } from '@/components/common/StatCard'
import { Timeline } from '@/components/common/Timeline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  averageDealSize,
  dealTotal,
  dealsByOwner,
  isOpen,
  isRotting,
  isWon,
  leadsBySource,
  pipelineValue,
  revenueByMonth,
  salesFunnel,
  taskBucket,
  weightedValue,
  winRate,
  type RangeKey,
} from '@/lib/metrics'
import { formatCompact, formatCurrency, formatDate, formatPercent } from '@/lib/format'
import {
  useActivities,
  useCurrentUser,
  useDeals,
  useLeads,
  usePermissions,
  useSettings,
  useSortedStages,
  useTasks,
  useUserNameMap,
} from '@/repository'
import type { TimelineItem } from '@/types/models'

export function DashboardPage() {
  const deals = useDeals()
  const leads = useLeads()
  const tasks = useTasks()
  const activities = useActivities()
  const stages = useSortedStages()
  const users = useUserNameMap()
  const settings = useSettings()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()

  const [range, setRange] = useState<RangeKey>('quarter')

  const scopedDeals = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return deals
    return deals.filter((deal) => deal.ownerId === currentUser.id)
  }, [deals, permissions.seesAllRecords, currentUser])

  const scopedTasks = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return tasks
    return tasks.filter((task) => task.assignedToId === currentUser.id)
  }, [tasks, permissions.seesAllRecords, currentUser])

  const scopedActivities = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return activities
    return activities.filter((activity) => activity.userId === currentUser.id)
  }, [activities, permissions.seesAllRecords, currentUser])

  const openDeals = scopedDeals.filter((deal) => isOpen(deal, stages))
  const pipeline = pipelineValue(scopedDeals, stages)
  const weighted = weightedValue(scopedDeals, stages)
  const won = scopedDeals.filter((deal) => isWon(deal, stages))
  const winPct = winRate(scopedDeals, stages)
  const avgSize = averageDealSize(scopedDeals, stages)

  const revenue = useMemo(() => revenueByMonth(scopedDeals, stages, 6), [scopedDeals, stages])
  const funnel = useMemo(() => salesFunnel(scopedDeals, stages), [scopedDeals, stages])
  const byOwner = useMemo(() => dealsByOwner(scopedDeals, stages, Object.values(users)), [scopedDeals, stages, users])
  const bySource = useMemo(
    () => leadsBySource(permissions.seesAllRecords || !currentUser ? leads : leads.filter((l) => l.ownerId === currentUser.id)),
    [leads, permissions.seesAllRecords, currentUser],
  )

  const rotting = useMemo(
    () => openDeals.filter((deal) => isRotting(deal, stages)).slice(0, 5),
    [openDeals, stages],
  )

  const upcomingTasks = useMemo(
    () =>
      scopedTasks
        .filter((task) => task.status === 'open')
        .filter((task) => ['overdue', 'today'].includes(taskBucket(task)))
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
        .slice(0, 6),
    [scopedTasks],
  )

  const timeline = useMemo<TimelineItem[]>(() => {
    return scopedActivities
      .slice()
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
      .slice(0, 8)
      .map((activity) => ({ kind: 'activity', id: activity.id, at: activity.occurredAt, activity }))
  }, [scopedActivities])

  const funnelMax = Math.max(1, ...funnel.map((point) => point.value))
  const sourceTotal = bySource.reduce((sum, point) => sum + point.value, 0)
  const greeting = getGreeting()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${currentUser?.name.split(' ')[0] ?? 'there'}`}
        description="Here's what's happening across your pipeline"
        actions={
          <Tabs value={range} onValueChange={(value) => setRange(value as RangeKey)}>
            <TabsList>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open pipeline"
          value={formatCurrency(pipeline, settings.currency)}
          icon={Briefcase}
          gradient="a"
          hint={`${openDeals.length} active deals`}
        />
        <StatCard
          label="Won revenue"
          value={formatCurrency(won.reduce((sum, deal) => sum + dealTotal(deal), 0), settings.currency)}
          icon={DollarSign}
          gradient="c"
          hint={`${won.length} deals won`}
        />
        <StatCard
          label="Win rate"
          value={formatPercent(winPct)}
          icon={Percent}
          gradient="b"
          hint="Across all closed deals"
        />
        <StatCard
          label="Weighted forecast"
          value={formatCurrency(weighted, settings.currency)}
          icon={Target}
          gradient="d"
          hint={`Avg deal ${formatCurrency(avgSize, settings.currency)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Won revenue</h2>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
              <ArrowUpRight className="size-3" />
              {formatCurrency(revenue.reduce((sum, point) => sum + point.value, 0), settings.currency)}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value: number) => formatCompact(value)}
                />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--border))' }}
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatCurrency(Number(value), settings.currency), 'Won']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Leads by source</h2>
            <p className="text-xs text-muted-foreground">{sourceTotal} leads total</p>
          </div>
          {bySource.length === 0 ? (
            <EmptyState icon={Flame} title="No leads" description="Lead sources will appear here." className="border-0" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bySource}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {bySource.map((point, index) => (
                      <Cell key={point.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <RLegend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Pipeline funnel</h2>
          <div className="space-y-3">
            {funnel.map((point) => (
              <div key={point.stageId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{point.name}</span>
                  <span className="numeric text-muted-foreground">
                    {point.count} · {formatCurrency(point.value, settings.currency)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(point.value / funnelMax) * 100}%`, backgroundColor: point.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Deals by owner</h2>
          {byOwner.length === 0 ? (
            <EmptyState icon={Briefcase} title="No deals" description="Assign deals to see this breakdown." className="border-0" />
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byOwner} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value: number) => formatCompact(value)} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={70}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatCurrency(Number(value), settings.currency), 'Pipeline']}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {byOwner.map((point) => (
                      <Cell key={point.ownerId} fill={point.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Needs attention</h2>
            {rotting.length > 0 ? (
              <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                <Flame className="size-3.5" />
                {rotting.length}
              </span>
            ) : null}
          </div>
          {rotting.length === 0 ? (
            <EmptyState icon={Clock} title="All caught up" description="No deals are going stale right now." className="border-0" />
          ) : (
            <ul className="space-y-2">
              {rotting.map((deal) => (
                <li key={deal.id}>
                  <Link
                    to={`/deals?deal=${deal.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        No activity · {formatDate(deal.updatedAt)}
                      </p>
                    </div>
                    <span className="numeric shrink-0 text-sm font-semibold">
                      {formatCurrency(dealTotal(deal), settings.currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today's focus</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                <Plus />
                Tasks
              </Link>
            </Button>
          </div>
          {upcomingTasks.length === 0 ? (
            <EmptyState icon={Target} title="No tasks due" description="You're on top of things." className="border-0" />
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3 rounded-xl border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(task.dueDate)}
                    </p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Recent activity</h2>
          <Timeline
            items={timeline}
            users={users}
            emptyState={
              <EmptyState icon={TrendingUp} title="No activity yet" description="Logged calls, emails and meetings show up here." className="border-0" />
            }
          />
        </Card>
      </div>
    </div>
  )
}

const tooltipStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
}

const PIE_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444']

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
