import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  commandOpen: boolean
  mobileNavOpen: boolean
  sidebarCollapsed: boolean
  setCommandOpen: (open: boolean) => void
  setMobileNavOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      commandOpen: false,
      mobileNavOpen: false,
      sidebarCollapsed: false,
      setCommandOpen: (open) => set({ commandOpen: open }),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'crm.ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
)
