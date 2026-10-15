import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  clearable?: boolean
  onClear?: () => void
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  disabled,
  clearable,
  onClear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date>(value ?? new Date())

  React.useEffect(() => {
    if (value) setMonth(value)
  }, [value])

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4" />
          {value ? format(value, 'MMM d, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="flex items-center justify-between pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMonth((current) => subMonths(current, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-medium">{format(month, 'MMMM yyyy')}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            aria-label="Next month"
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((day) => (
            <span
              key={day}
              className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </span>
          ))}
          {days.map((day) => {
            const selected = value ? isSameDay(day, value) : false
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => {
                  onChange(day)
                  setOpen(false)
                }}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg text-sm transition-colors',
                  !isSameMonth(day, month) && 'text-muted-foreground/50',
                  isToday(day) && !selected && 'font-semibold text-primary',
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
        {clearable ? (
          <div className="mt-2 border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onClear?.()
                setOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
