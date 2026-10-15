import { useEffect } from 'react'

import { ThemeProvider } from '@/app/theme'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('antialiased')
  }, [])

  return (
    <ThemeProvider>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}
