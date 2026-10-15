import { useAppStore } from '@/store'

export function getStore() {
  return useAppStore.getState()
}

export function currentUserId(): string {
  return useAppStore.getState().currentUserId ?? 'user_admin'
}
