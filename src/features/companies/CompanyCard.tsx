import { Building2, Globe, MapPin } from 'lucide-react'

import { formatCurrency } from '@/lib/format'
import { TagChip } from '@/components/common/TagChip'
import type { Company } from '@/types/models'

interface CompanyCardProps {
  company: Company
  contactsCount: number
  openDeals: number
  pipelineValue: number
  currency: string
}

export function CompanyCard({
  company,
  contactsCount,
  openDeals,
  pipelineValue,
  currency,
}: CompanyCardProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{company.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {company.industry} · {company.size}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {company.location ? (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            <span className="truncate">{company.location}</span>
          </p>
        ) : null}
        {company.website ? (
          <p className="flex items-center gap-1.5">
            <Globe className="size-3.5" />
            <span className="truncate">{company.website}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 border-t pt-3 text-center">
        <Metric label="Contacts" value={String(contactsCount)} />
        <Metric label="Open deals" value={String(openDeals)} />
        <Metric label="Pipeline" value={formatCurrency(pipelineValue, currency)} />
      </div>

      {company.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {company.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="numeric text-sm font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
