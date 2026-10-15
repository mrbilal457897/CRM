import { Avatar as AvatarRoot, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { colorFromString, contrastText, initials } from '@/lib/colors'
import { cn } from '@/lib/utils'

const SIZE_CLASSES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
} as const

export type AvatarSize = keyof typeof SIZE_CLASSES

interface AvatarProps {
  name: string
  color?: string
  size?: AvatarSize
  src?: string
  className?: string
}

export function Avatar({ name, color, size = 'md', src, className }: AvatarProps) {
  const background = color ?? colorFromString(name)
  return (
    <AvatarRoot className={cn(SIZE_CLASSES[size], className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback
        style={{ backgroundColor: background, color: contrastText(background) }}
        className="font-semibold"
      >
        {initials(name)}
      </AvatarFallback>
    </AvatarRoot>
  )
}

interface AvatarStackProps {
  people: { name: string; color?: string }[]
  max?: number
  size?: AvatarSize
}

export function AvatarStack({ people, max = 4, size = 'sm' }: AvatarStackProps) {
  const visible = people.slice(0, max)
  const overflow = people.length - visible.length
  return (
    <div className="flex items-center">
      {visible.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          color={person.color}
          size={size}
          className={cn('ring-2 ring-background', index > 0 && '-ml-2')}
        />
      ))}
      {overflow > 0 ? (
        <div
          className={cn(
            '-ml-2 flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-background',
            SIZE_CLASSES[size],
          )}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  )
}
