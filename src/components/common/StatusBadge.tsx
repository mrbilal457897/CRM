import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CONTACT_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  type ContactStatus,
  type LeadStatus,
  type TaskPriority,
} from '@/types/enums'
import type { Stage } from '@/types/models'

const CONTACT_VARIANTS: Record<ContactStatus, BadgeProps['variant']> = {
  active: 'info',
  prospect: 'default',
  customer: 'success',
  inactive: 'secondary',
  churned: 'destructive',
}

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return <Badge variant={CONTACT_VARIANTS[status]}>{CONTACT_STATUS_LABELS[status]}</Badge>
}

const LEAD_VARIANTS: Record<LeadStatus, BadgeProps['variant']> = {
  new: 'info',
  contacted: 'default',
  qualified: 'success',
  unqualified: 'secondary',
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={LEAD_VARIANTS[status]}>{LEAD_STATUS_LABELS[status]}</Badge>
}

const PRIORITY_VARIANTS: Record<TaskPriority, BadgeProps['variant']> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={PRIORITY_VARIANTS[priority]}>{TASK_PRIORITY_LABELS[priority]}</Badge>
}

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: `${stage.color}1f`, color: stage.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
      {stage.name}
    </span>
  )
}
