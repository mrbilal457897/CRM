import { colorFromString, contrastText } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface TagChipProps {
  label: string
  color?: string
  className?: string
  onRemove?: () => void
}

export function TagChip({ label, color, className, onRemove }: TagChipProps) {
  const background = color ?? colorFromString(label)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: `${background}1f`, color: background }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: background }} />
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="ml-0.5 rounded-full opacity-60 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      ) : null}
    </span>
  )
}

interface DotProps {
  color: string
  className?: string
}

export function ColorDot({ color, className }: DotProps) {
  return (
    <span
      className={cn('inline-block size-2 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  )
}

interface ColorSwatchProps {
  color: string
  label: string
  selected?: boolean
  onClick?: () => void
}

export function ColorSwatch({ color, label, selected, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        'size-7 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110',
        selected && 'ring-2 ring-ring',
      )}
      style={{ backgroundColor: color, color: contrastText(color) }}
    />
  )
}
