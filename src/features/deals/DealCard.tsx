import { AlertTriangle, Building2, CalendarDays } from 'lucide-react'

import { Avatar } from '@/components/common/Avatar'
import { formatCurrency, formatDate } from '@/lib/format'
import { dealTotal, isRotting } from '@/lib/metrics'
import type { Company, Deal, Stage, User } from '@/types/models'

interface DealCardProps {
  deal: Deal
  stages: Stage[]
  owner?: User
  company?: Company
}

export function DealCard({ deal, stages, owner, company }: DealCardProps) {
  const rotting = isRotting(deal, stages)

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{deal.title}</p>
        {rotting ? (
          <span
            className="flex shrink-0 items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning"
            title="No activity in 7+ days"
          >
            <AlertTriangle className="size-3" />
            Stale
          </span>
        ) : null}
      </div>

      {company ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5" />
          <span className="truncate">{company.name}</span>
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <span className="numeric text-sm font-semibold">{formatCurrency(dealTotal(deal))}</span>
        <span className="text-xs text-muted-foreground">{deal.probability}%</span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-2.5">
        {owner ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={owner.name} color={owner.avatarColor} size="xs" />
            <span className="text-xs text-muted-foreground">{owner.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {formatDate(deal.expectedCloseDate, 'MMM d')}
        </span>
      </div>
    </div>
  )
}
