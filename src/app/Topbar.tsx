import { Menu, PanelLeft, Search } from 'lucide-react'

import { ThemeToggle } from '@/app/ThemeToggle'
import { UserMenu } from '@/app/UserMenu'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/store/ui'

export function Topbar() {
  const setCommandOpen = useUiStore((state) => state.setCommandOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft />
      </Button>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group flex h-9 w-full max-w-md items-center gap-2 rounded-xl border bg-card/60 px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:border-ring/50 hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search contacts, deals, tasks…</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <UserMenu />
      </div>
    </header>
  )
}
