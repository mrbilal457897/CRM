import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  Import,
  KanbanSquare,
  LayoutDashboard,
  Mail,
  Settings,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
      { label: 'Deals', to: '/deals', icon: KanbanSquare },
      { label: 'Leads', to: '/leads', icon: UserPlus },
      { label: 'Contacts', to: '/contacts', icon: Users },
      { label: 'Companies', to: '/companies', icon: Building2 },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { label: 'Tasks', to: '/tasks', icon: CheckSquare },
      { label: 'Calendar', to: '/calendar', icon: Calendar },
      { label: 'Activities', to: '/activities', icon: Activity },
      { label: 'Reports', to: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Email Templates', to: '/email-templates', icon: Mail },
      { label: 'Import / Export', to: '/import-export', icon: Import },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]
