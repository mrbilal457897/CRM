import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  trend?: { value: number; label?: string }
  gradient?: 'a' | 'b' | 'c' | 'd'
  hint?: string
  isLoading?: boolean
  className?: string
}

const GRADIENTS = {
  a: 'stat-gradient-a',
  b: 'stat-gradient-b',
  c: 'stat-gradient-c',
  d: 'stat-gradient-d',
} as const

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  gradient = 'a',
  hint,
  isLoading,
  className,
}: StatCardProps) {
  const positive = (trend?.value ?? 0) >= 0

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className={cn('absolute inset-0', GRADIENTS[gradient])} aria-hidden />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="numeric text-2xl font-semibold tracking-tight">{value}</p>
            )}
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-background/70 text-primary shadow-sm ring-1 ring-border/60">
            <Icon className="size-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && !isLoading ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium',
                positive ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive',
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
          {trend?.label ? <span className="text-muted-foreground">{trend.label}</span> : null}
        </div>
      </div>
    </Card>
  )
}
