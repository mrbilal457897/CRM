import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend as RLegend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Target, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportToCsv } from '@/lib/csv'
import { formatCompact, formatCurrency, formatPercent } from '@/lib/format'
import {
  averageDealSize,
  dealTotal,
  dealsByOwner,
  isLost,
  leadsBySource,
  lostReasonBreakdown,
  pipelineValue,
  repPerformance,
  revenueByMonth,
  revenueForecast,
  salesFunnel,
  weightedValue,
  winRate,
} from '@/lib/metrics'
import {
  useCompanies,
  useCurrentUser,
  useDeals,
  useLeads,
  usePermissions,
  useSettings,
  useSortedStages,
  useUsers,
} from '@/repository'

export function ReportsPage() {
  const deals = useDeals()
  const leads = useLeads()
  const stages = useSortedStages()
  const users = useUsers()
  const companies = useCompanies()
  const settings = useSettings()
  const currentUser = useCurrentUser()
  const permissions = usePermissions()

  const [tab, setTab] = useState('overview')

  const scopedDeals = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return deals
    return deals.filter((deal) => deal.ownerId === currentUser.id)
  }, [deals, permissions.seesAllRecords, currentUser])

  const scopedLeads = useMemo(() => {
    if (permissions.seesAllRecords || !currentUser) return leads
    return leads.filter((lead) => lead.ownerId === currentUser.id)
  }, [leads, permissions.seesAllRecords, currentUser])

  const revenue = useMemo(() => revenueByMonth(scopedDeals, stages, 12), [scopedDeals, stages])
  const forecast = useMemo(() => revenueForecast(scopedDeals, stages, 6), [scopedDeals, stages])
  const funnel = useMemo(() => salesFunnel(scopedDeals, stages), [scopedDeals, stages])
  const owners = useMemo(() => dealsByOwner(scopedDeals, stages, users), [scopedDeals, stages, users])
  const sources = useMemo(() => leadsBySource(scopedLeads), [scopedLeads])
  const losses = useMemo(() => lostReasonBreakdown(scopedDeals, stages), [scopedDeals, stages])
  const reps = useMemo(() => repPerformance(scopedDeals, stages, users), [scopedDeals, stages, users])

  const pipeline = pipelineValue(scopedDeals, stages)
  const weighted = weightedValue(scopedDeals, stages)
  const wonValue = scopedDeals
    .filter((deal) => stages.find((s) => s.id === deal.stageId)?.isWon)
    .reduce((sum, deal) => sum + dealTotal(deal), 0)
  const loseRate = scopedDeals.length === 0 ? 0 : (scopedDeals.filter((deal) => isLost(deal, stages)).length / scopedDeals.length) * 100

  const companyPipeline = useMemo(() => {
    const map = new Map<string, number>()
    scopedDeals.forEach((deal) => {
      if (!deal.companyId) return
      map.set(deal.companyId, (map.get(deal.companyId) ?? 0) + dealTotal(deal))
    })
    return companies
      .map((company) => ({ name: company.name, value: map.get(company.id) ?? 0 }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [scopedDeals, companies])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analyse pipeline health, revenue and rep performance"
        actions={
          <Button
            variant="outline"
            onClick={() =>
              exportToCsv(
                'rep-performance.csv',
                reps.map((rep) => ({
                  rep: rep.name,
                  openDeals: rep.open,
                  openValue: rep.openValue,
                  wonDeals: rep.won,
                  wonValue: rep.wonValue,
                  winRate: rep.winRate.toFixed(1),
                })),
              )
            }
          >
            <Download />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open pipeline" value={formatCurrency(pipeline, settings.currency)} icon={TrendingUp} gradient="a" />
        <StatCard label="Won revenue" value={formatCurrency(wonValue, settings.currency)} icon={Target} gradient="c" />
        <StatCard label="Win rate" value={formatPercent(winRate(scopedDeals, stages))} icon={Users} gradient="b" />
        <StatCard label="Loss rate" value={formatPercent(loseRate)} icon={TrendingDown} gradient="d" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales performance</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="losses">Loss analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Won revenue · last 12 months</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value: number) => formatCompact(value)}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatCurrency(Number(value), settings.currency), 'Won']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Pipeline by owner</h2>
              {owners.length === 0 ? (
                <EmptyState icon={Users} title="No data" description="No deals to analyse." className="border-0" />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={owners} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" fontSize={11} tickFormatter={(value: number) => formatCompact(value)} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={tooltipStyle}
                        formatter={(value) => [formatCurrency(Number(value), settings.currency), 'Pipeline']}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {owners.map((owner) => (
                          <Cell key={owner.ownerId} fill={owner.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Top accounts by pipeline</h2>
              {companyPipeline.length === 0 ? (
                <EmptyState icon={Target} title="No data" description="No company pipeline yet." className="border-0" />
              ) : (
                <ul className="space-y-3">
                  {companyPipeline.map((row, index) => (
                    <li key={row.name} className="flex items-center gap-3">
                      <span className="numeric w-5 text-sm text-muted-foreground">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
                      <span className="numeric text-sm font-medium">
                        {formatCurrency(row.value, settings.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-4 space-y-6">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Rep</th>
                    <th className="px-4 py-3 text-right font-medium">Open deals</th>
                    <th className="px-4 py-3 text-right font-medium">Open value</th>
                    <th className="px-4 py-3 text-right font-medium">Won</th>
                    <th className="px-4 py-3 text-right font-medium">Won value</th>
                    <th className="px-4 py-3 text-right font-medium">Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((rep) => (
                    <tr key={rep.userId} className="border-t">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: rep.color }} />
                          {rep.name}
                        </span>
                      </td>
                      <td className="numeric px-4 py-3 text-right">{rep.open}</td>
                      <td className="numeric px-4 py-3 text-right">
                        {formatCurrency(rep.openValue, settings.currency)}
                      </td>
                      <td className="numeric px-4 py-3 text-right">{rep.won}</td>
                      <td className="numeric px-4 py-3 text-right">
                        {formatCurrency(rep.wonValue, settings.currency)}
                      </td>
                      <td className="numeric px-4 py-3 text-right">{formatPercent(rep.winRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Sales funnel</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value: number) => formatCompact(value)}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatCurrency(Number(value), settings.currency), 'Value']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {funnel.map((point) => (
                      <Cell key={point.stageId} fill={point.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="mt-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Weighted forecast" value={formatCurrency(weighted, settings.currency)} icon={Target} gradient="a" />
            <StatCard
              label="Avg deal size"
              value={formatCurrency(averageDealSize(scopedDeals, stages), settings.currency)}
              icon={TrendingUp}
              gradient="b"
            />
            <StatCard label="Commit" value={formatCurrency(wonValue, settings.currency)} icon={Users} gradient="c" />
          </div>
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Weighted vs committed forecast</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value: number) => formatCompact(value)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => formatCurrency(Number(value), settings.currency)}
                  />
                  <RLegend />
                  <Line type="monotone" dataKey="weighted" stroke="hsl(var(--primary))" strokeWidth={2} name="Weighted" />
                  <Line type="monotone" dataKey="committed" stroke="#10b981" strokeWidth={2} name="Committed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="losses" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Lost reasons</h2>
              {losses.length === 0 ? (
                <EmptyState icon={TrendingDown} title="No lost deals" description="Nothing lost yet." className="border-0" />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={losses} dataKey="value" nameKey="name" outerRadius={96} paddingAngle={2}>
                        {losses.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Leads by source</h2>
              {sources.length === 0 ? (
                <EmptyState icon={Users} title="No leads" description="No lead sources to show." className="border-0" />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sources} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" fontSize={11} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={90} />
                      <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
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
