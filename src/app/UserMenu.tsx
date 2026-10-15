import { LogOut, Settings, User as UserIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUser, logout } from '@/repository'
import { ROLE_LABELS } from '@/types/enums'

export function UserMenu() {
  const user = useCurrentUser()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label="User menu"
        >
          <Avatar name={user.name} color={user.avatarColor} size="sm" />
          <span className="hidden text-left text-sm leading-tight sm:block">
            <span className="block font-medium">{user.name}</span>
            <span className="block text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{user.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings/profile')}>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings/appearance')}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            logout()
            toast.success('Signed out')
            navigate('/login')
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
