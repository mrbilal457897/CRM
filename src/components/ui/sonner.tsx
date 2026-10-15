import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/app/theme'

function Toaster(props: ToasterProps) {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group rounded-xl border bg-popover text-popover-foreground shadow-lift',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
