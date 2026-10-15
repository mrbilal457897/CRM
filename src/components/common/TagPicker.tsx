import { Check, Tag as TagIcon } from 'lucide-react'

import { TagChip } from '@/components/common/TagChip'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTags } from '@/repository'
import { cn } from '@/lib/utils'

interface TagPickerProps {
  value: string[]
  onChange: (tags: string[]) => void
  className?: string
}

export function TagPicker({ value, onChange, className }: TagPickerProps) {
  const tags = useTags()

  const toggle = (name: string) => {
    onChange(value.includes(name) ? value.filter((tag) => tag !== name) : [...value, name])
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {value.map((name) => {
        const tag = tags.find((item) => item.name === name)
        return <TagChip key={name} label={name} color={tag?.color} onRemove={() => toggle(name)} />
      })}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs">
            <TagIcon className="size-3.5" />
            Add tag
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1.5">
          {tags.map((tag) => {
            const selected = value.includes(tag.name)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.name)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="flex-1 text-left">{tag.name}</span>
                {selected ? <Check className="size-3.5 text-primary" /> : null}
              </button>
            )
          })}
        </PopoverContent>
      </Popover>
    </div>
  )
}
