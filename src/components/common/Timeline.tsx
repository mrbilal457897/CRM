import { CheckCircle2, GitBranch, Mail, MessageSquare, Phone, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Avatar } from '@/components/common/Avatar'
import { formatDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimelineItem, User } from '@/types/models'

interface TimelineProps {
  items: TimelineItem[]
  users: Record<string, User>
  className?: string
  emptyState?: React.ReactNode
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: MessageSquare,
}

const ICON_STYLES: Record<string, string> = {
  call: 'bg-info/12 text-info',
  email: 'bg-primary/12 text-primary',
  meeting: 'bg-warning/14 text-warning',
  note: 'bg-muted text-muted-foreground',
  stage: 'bg-success/12 text-success',
  task: 'bg-success/12 text-success',
}

export function Timeline({ items, users, className, emptyState }: TimelineProps) {
  if (items.length === 0 && emptyState) return <>{emptyState}</>

  return (
    <ol className={cn('relative space-y-1', className)}>
      {items.map((item, index) => {
        const { icon: Icon, tone, title, body, authorId, at } =
          item.kind === 'activity'
            ? {
                icon: ACTIVITY_ICONS[item.activity.type] ?? MessageSquare,
                tone: item.activity.type,
                title: item.activity.subject,
                body: item.activity.body,
                authorId: item.activity.userId,
                at: item.activity.occurredAt,
              }
            : item.kind === 'note'
              ? {
                  icon: MessageSquare,
                  tone: 'note',
                  title: 'Note added',
                  body: item.note.body,
                  authorId: item.note.authorId,
                  at: item.note.createdAt,
                }
              : item.kind === 'stage'
                ? {
                    icon: GitBranch,
                    tone: 'stage',
                    title: item.change.fromName
                      ? `Moved from ${item.change.fromName} to ${item.change.toName}`
                      : `Added to ${item.change.toName}`,
                    body: '',
                    authorId: item.change.userId,
                    at: item.change.at,
                  }
                : {
                    icon: CheckCircle2,
                    tone: 'task',
                    title: `Completed task: ${item.task.title}`,
                    body: '',
                    authorId: item.task.assignedToId,
                    at: item.task.completedAt ?? item.task.updatedAt,
                  }

        const author = users[authorId]

        return (
          <li key={`${item.kind}-${item.id}`} className="relative flex gap-3 pb-5">
            {index < items.length - 1 ? (
              <span className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-border" aria-hidden />
            ) : null}
            <span
              className={cn(
                'z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
                ICON_STYLES[tone] ?? ICON_STYLES.note,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium">{title}</p>
                <time className="text-xs text-muted-foreground" title={formatDateTime(at)}>
                  {formatRelative(at)}
                </time>
              </div>
              {body ? <p className="mt-0.5 text-sm text-muted-foreground">{body}</p> : null}
              {author ? (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Avatar name={author.name} color={author.avatarColor} size="xs" />
                  {author.name}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
