import type { ReactNode } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

type Side = 'top' | 'right' | 'bottom' | 'left'

interface FormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  side?: Side
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  side = 'right',
  children,
  footer,
  className,
}: FormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={className}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}
