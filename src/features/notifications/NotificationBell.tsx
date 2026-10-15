import { AlertTriangle, Bell, CheckCheck, Clock, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelative } from '@/lib/format'
import { taskBucket } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import {
  markAllNotificationsRead,
  markNotificationRead,
  useCurrentUser,
  useNotifications,
  useTasks,
} from '@/repository'
import type { NotificationType } from '@/types/enums'
import type { AppNotification } from '@/types/models'

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  deal_won: Trophy,
  deal_assigned: Bell,
  lead_assigned: Bell,
  task_due: Clock,
  system: Bell,
}

export function NotificationBell() {
  const user = useCurrentUser()
  const notifications = useNotifications()
  const tasks = useTasks()
  const navigate = useNavigate()

  if (!user) return null

  const mine = notifications
    .filter((item) => item.userId === user.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const reminders = tasks.filter(
    (task) =>
      task.assignedToId === user.id &&
      task.status === 'open' &&
      (taskBucket(task) === 'overdue' || taskBucket(task) === 'today'),
  )

  const unread = mine.filter((item) => !item.read).length + reminders.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {mine.some((item) => !item.read) ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => markAllNotificationsRead(user.id)}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-[24rem]">
          <div className="divide-y">
            {reminders.map((task) => {
              const overdue = taskBucket(task) === 'overdue'
              return (
                <button
                  key={`reminder-${task.id}`}
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                      overdue ? 'bg-destructive/12 text-destructive' : 'bg-warning/14 text-warning',
                    )}
                  >
                    <AlertTriangle className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {overdue ? 'Overdue task' : 'Task due today'}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{task.title}</span>
                  </span>
                </button>
              )
            })}

            {mine.length === 0 && reminders.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">You're all caught up.</p>
              </div>
            ) : null}

            {mine.map((item) => (
              <NotificationRow
                key={item.id}
                notification={item}
                onOpen={() => {
                  markNotificationRead(item.id, true)
                  if (item.link) navigate(item.link)
                }}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification
  onOpen: () => void
}) {
  const Icon = NOTIFICATION_ICONS[notification.type]
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
        !notification.read && 'bg-primary/5',
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium">{notification.title}</span>
          {!notification.read ? <span className="size-1.5 rounded-full bg-primary" /> : null}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{notification.message}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {formatRelative(notification.createdAt)}
        </span>
      </span>
    </button>
  )
}
