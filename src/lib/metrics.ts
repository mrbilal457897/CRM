import { differenceInCalendarDays, startOfMonth, startOfQuarter, startOfYear, subDays } from 'date-fns'

import type { Deal, Lead, Stage, Task, User } from '@/types/models'

export type RangeKey = '7d' | '30d' | 'quarter' | 'year'

export const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  quarter: 'This quarter',
  year: 'This year',
}

export function rangeStart(range: RangeKey, now = new Date()): Date {
  switch (range) {
    case '7d':
      return subDays(now, 7)
    case '30d':
      return subDays(now, 30)
    case 'quarter':
      return startOfQuarter(now)
    case 'year':
      return startOfYear(now)
    default:
      return subDays(now, 30)
  }
}

export function withinRange(dateISO: string | null | undefined, range: RangeKey, now = new Date()): boolean {
  if (!dateISO) return false
  const date = new Date(dateISO)
  if (Number.isNaN(date.getTime())) return false
  return date >= rangeStart(range, now) && date <= now
}

export function lineItemTotal(deal: Pick<Deal, 'items'>): number {
  return deal.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100),
    0,
  )
}

export function dealTotal(deal: Pick<Deal, 'items' | 'value'>): number {
  if (deal.items.length === 0) return deal.value
  return lineItemTotal(deal)
}

export function isOpen(deal: Deal, stages: Stage[]): boolean {
  const stage = stages.find((s) => s.id === deal.stageId)
  return !!stage && !stage.isWon && !stage.isLost
}

export function isWon(deal: Deal, stages: Stage[]): boolean {
  return !!stages.find((s) => s.id === deal.stageId)?.isWon
}

export function isLost(deal: Deal, stages: Stage[]): boolean {
  return !!stages.find((s) => s.id === deal.stageId)?.isLost
}

export function isRotting(deal: Deal, stages: Stage[], now = new Date()): boolean {
  if (!isOpen(deal, stages)) return false
  const reference = deal.lastActivityAt ? new Date(deal.lastActivityAt) : new Date(deal.updatedAt)
  return differenceInCalendarDays(now, reference) >= 7
}

export function pipelineValue(deals: Deal[], stages: Stage[]): number {
  return deals.filter((deal) => isOpen(deal, stages)).reduce((sum, deal) => sum + dealTotal(deal), 0)
}

export function weightedValue(deals: Deal[], stages: Stage[]): number {
  return deals
    .filter((deal) => isOpen(deal, stages))
    .reduce((sum, deal) => sum + (dealTotal(deal) * deal.probability) / 100, 0)
}

export function wonValue(deals: Deal[], stages: Stage[]): number {
  return deals.filter((deal) => isWon(deal, stages)).reduce((sum, deal) => sum + dealTotal(deal), 0)
}

export function winRate(deals: Deal[], stages: Stage[]): number {
  const won = deals.filter((deal) => isWon(deal, stages)).length
  const lost = deals.filter((deal) => isLost(deal, stages)).length
  const closed = won + lost
  return closed === 0 ? 0 : (won / closed) * 100
}

export function averageDealSize(deals: Deal[], stages: Stage[]): number {
  const won = deals.filter((deal) => isWon(deal, stages))
  if (won.length === 0) return 0
  return won.reduce((sum, deal) => sum + dealTotal(deal), 0) / won.length
}

export interface MonthPoint {
  key: string
  label: string
  value: number
  count: number
}

export function revenueByMonth(deals: Deal[], stages: Stage[], months = 6, now = new Date()): MonthPoint[] {
  const points: MonthPoint[] = []
  for (let i = months - 1; i >= 0; i -= 1) {
    const monthDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1))
    points.push({
      key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      label: monthDate.toLocaleString('en-US', { month: 'short' }),
      value: 0,
      count: 0,
    })
  }
  deals.forEach((deal) => {
    if (!isWon(deal, stages)) return
    const closed = deal.closedAt ? new Date(deal.closedAt) : new Date(deal.updatedAt)
    const key = `${closed.getFullYear()}-${closed.getMonth()}`
    const point = points.find((p) => p.key === key)
    if (point) {
      point.value += dealTotal(deal)
      point.count += 1
    }
  })
  return points
}

export interface FunnelPoint {
  stageId: string
  name: string
  color: string
  count: number
  value: number
}

export function salesFunnel(deals: Deal[], stages: Stage[]): FunnelPoint[] {
  return [...stages]
    .sort((a, b) => a.order - b.order)
    .filter((stage) => !stage.isLost)
    .map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stageId === stage.id)
      return {
        stageId: stage.id,
        name: stage.name,
        color: stage.color,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + dealTotal(deal), 0),
      }
    })
}

export interface OwnerPoint {
  ownerId: string
  name: string
  value: number
  count: number
  color: string
}

export function dealsByOwner(deals: Deal[], stages: Stage[], users: User[]): OwnerPoint[] {
  return users
    .map((user) => {
      const owned = deals.filter((deal) => deal.ownerId === user.id && isOpen(deal, stages))
      return {
        ownerId: user.id,
        name: user.name.split(' ')[0],
        value: owned.reduce((sum, deal) => sum + dealTotal(deal), 0),
        count: owned.length,
        color: user.avatarColor,
      }
    })
    .filter((entry) => entry.count > 0)
}

export interface SourcePoint {
  name: string
  value: number
}

export function leadsBySource(leads: Lead[]): SourcePoint[] {
  const map = new Map<string, number>()
  leads.forEach((lead) => {
    map.set(lead.source, (map.get(lead.source) ?? 0) + 1)
  })
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function lostReasonBreakdown(deals: Deal[], stages: Stage[]): { name: string; value: number }[] {
  const map = new Map<string, number>()
  deals
    .filter((deal) => isLost(deal, stages))
    .forEach((deal) => {
      const reason = deal.lostReason ?? 'Other'
      map.set(reason, (map.get(reason) ?? 0) + 1)
    })
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

export interface RepPerformance {
  userId: string
  name: string
  color: string
  won: number
  wonValue: number
  open: number
  openValue: number
  winRate: number
}

export function repPerformance(deals: Deal[], stages: Stage[], users: User[]): RepPerformance[] {
  return users
    .filter((user) => user.role !== 'admin')
    .map((user) => {
      const owned = deals.filter((deal) => deal.ownerId === user.id)
      const won = owned.filter((deal) => isWon(deal, stages))
      const lost = owned.filter((deal) => isLost(deal, stages))
      const open = owned.filter((deal) => isOpen(deal, stages))
      return {
        userId: user.id,
        name: user.name,
        color: user.avatarColor,
        won: won.length,
        wonValue: won.reduce((sum, deal) => sum + dealTotal(deal), 0),
        open: open.length,
        openValue: open.reduce((sum, deal) => sum + dealTotal(deal), 0),
        winRate: won.length + lost.length === 0 ? 0 : (won.length / (won.length + lost.length)) * 100,
      }
    })
}

export interface ForecastPoint {
  label: string
  weighted: number
  committed: number
}

export function revenueForecast(deals: Deal[], stages: Stage[], months = 6, now = new Date()): ForecastPoint[] {
  const points: ForecastPoint[] = []
  for (let i = 0; i < months; i += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const label = monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    const monthDeals = deals.filter((deal) => {
      const close = new Date(deal.expectedCloseDate)
      return (
        close.getFullYear() === monthDate.getFullYear() &&
        close.getMonth() === monthDate.getMonth() &&
        isOpen(deal, stages)
      )
    })
    points.push({
      label,
      weighted: monthDeals.reduce((sum, deal) => sum + (dealTotal(deal) * deal.probability) / 100, 0),
      committed: monthDeals.reduce((sum, deal) => sum + dealTotal(deal), 0),
    })
  }
  return points
}

export type TaskBucket = 'overdue' | 'today' | 'upcoming' | 'done'

export function taskBucket(task: Task, now = new Date()): TaskBucket {
  if (task.status === 'done') return 'done'
  const due = new Date(task.dueDate)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  if (due < startOfToday) return 'overdue'
  if (due <= endOfToday) return 'today'
  return 'upcoming'
}
