import { NavLink } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

import { NAV_GROUPS } from '@/app/nav'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)

  return (
    <div className="flex h-full flex-col gap-1 bg-card/60">
      <div className={cn('flex h-16 items-center gap-2.5 px-5', collapsed && 'justify-center px-2')}>
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm">
          <Sparkles className="size-5" />
        </div>
        {!collapsed ? (
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Northwind</p>
            <p className="text-xs text-muted-foreground">CRM Suite</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )
                }
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {!collapsed ? (
        <div className="m-3 rounded-2xl border bg-gradient-to-br from-primary/10 to-info/5 p-3.5">
          <p className="text-xs font-semibold">Demo workspace</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            All data is stored locally in your browser.
          </p>
        </div>
      ) : null}
    </div>
  )
}
