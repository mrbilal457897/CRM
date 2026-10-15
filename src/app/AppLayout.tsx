import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from '@/app/Sidebar'
import { Topbar } from '@/app/Topbar'
import { PageLoader } from '@/components/common/PageLoader'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { CommandPalette } from '@/features/command-palette/CommandPalette'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

export function AppLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen)
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r lg:block',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <Sidebar />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn('flex min-h-screen flex-col transition-[padding]', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <Topbar />
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 p-4 md:p-6"
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </motion.main>
      </div>

      <CommandPalette />
    </div>
  )
}
