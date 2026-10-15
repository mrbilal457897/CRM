import { useMemo } from 'react'

import { useAppStore } from '@/store'
import type {
  Activity,
  AppNotification,
  Company,
  Contact,
  Deal,
  EmailTemplate,
  Lead,
  Note,
  Settings,
  Source,
  Stage,
  Tag,
  Task,
  User,
} from '@/types/models'
import type { Role } from '@/types/enums'

export function useUsers(): User[] {
  return useAppStore((s) => s.users)
}

export function useCompanies(): Company[] {
  return useAppStore((s) => s.companies)
}

export function useContacts(): Contact[] {
  return useAppStore((s) => s.contacts)
}

export function useLeads(): Lead[] {
  return useAppStore((s) => s.leads)
}

export function useDeals(): Deal[] {
  return useAppStore((s) => s.deals)
}

export function useActivities(): Activity[] {
  return useAppStore((s) => s.activities)
}

export function useNotes(): Note[] {
  return useAppStore((s) => s.notes)
}

export function useTasks(): Task[] {
  return useAppStore((s) => s.tasks)
}

export function useStages(): Stage[] {
  return useAppStore((s) => s.stages)
}

export function useSources(): Source[] {
  return useAppStore((s) => s.sources)
}

export function useTags(): Tag[] {
  return useAppStore((s) => s.tags)
}

export function useTemplates(): EmailTemplate[] {
  return useAppStore((s) => s.templates)
}

export function useNotifications(): AppNotification[] {
  return useAppStore((s) => s.notifications)
}

export function useSettings(): Settings {
  return useAppStore((s) => s.settings)
}

export function useCurrentUser(): User | null {
  const users = useAppStore((s) => s.users)
  const currentUserId = useAppStore((s) => s.currentUserId)
  return useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [users, currentUserId],
  )
}

export interface Permissions {
  role: Role | null
  isAdmin: boolean
  isManager: boolean
  isRep: boolean
  /** Reps only see records they own; managers and admins see everything. */
  seesAllRecords: boolean
  canReassign: boolean
  canManageUsers: boolean
}

export function usePermissions(): Permissions {
  const user = useCurrentUser()
  const role = user?.role ?? null
  return useMemo(
    () => ({
      role,
      isAdmin: role === 'admin',
      isManager: role === 'manager',
      isRep: role === 'rep',
      seesAllRecords: role === 'admin' || role === 'manager',
      canReassign: role === 'admin' || role === 'manager',
      canManageUsers: role === 'admin',
    }),
    [role],
  )
}

/** Sorted stages (by order) — stable reference derived from the store array. */
export function useSortedStages(): Stage[] {
  const stages = useStages()
  return useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages])
}

export function useUserNameMap(): Record<string, User> {
  const users = useUsers()
  return useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])
}

export function useCompanyMap(): Record<string, Company> {
  const companies = useCompanies()
  return useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c])), [companies])
}
