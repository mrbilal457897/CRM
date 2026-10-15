import { format, formatDistanceToNow, isThisYear, parseISO } from 'date-fns'

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: 'Rs ',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  options: { compact?: boolean; decimals?: boolean } = {},
): string {
  const { compact = false, decimals = false } = options
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : decimals ? 2 : 0,
      minimumFractionDigits: decimals && !compact ? 2 : 0,
    }).format(amount)
  } catch {
    return `${CURRENCY_SYMBOLS[currency] ?? ''}${amount.toLocaleString()}`
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value: string | Date | null | undefined, pattern = 'MMM d, yyyy'): string {
  const date = toDate(value)
  if (!date) return '—'
  return format(date, isThisYear(date) || pattern.includes('y') ? pattern : 'MMM d')
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return format(date, 'MMM d, yyyy · h:mm a')
}

export function formatRelative(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return formatDistanceToNow(date, { addSuffix: true })
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function toISODateTime(date: Date): string {
  return date.toISOString()
}
