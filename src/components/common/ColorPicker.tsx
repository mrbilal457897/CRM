import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TAG_COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={cn('rounded-full', className)}
          aria-label="Pick color"
        >
          <span className="size-4 rounded-full" style={{ backgroundColor: color }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-6 gap-2">
          {TAG_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-label={option}
              className="flex size-6 items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{ backgroundColor: option }}
            >
              {option.toLowerCase() === color.toLowerCase() ? (
                <Check className="size-3.5 text-white" />
              ) : null}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
