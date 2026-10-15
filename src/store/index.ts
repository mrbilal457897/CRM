import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createSeedData, type DatabaseState } from '@/data/seed'
import { STORE_KEY, STORE_VERSION } from '@/lib/constants'
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

export interface AppStore extends DatabaseState {
  login: (email: string, password: string) => User | null
  logout: () => void
  resetDemoData: () => void

  addUser: (user: User) => void
  updateUser: (id: string, patch: Partial<User>) => void
  deleteUser: (id: string) => void

  addCompany: (company: Company) => void
  updateCompany: (id: string, patch: Partial<Company>) => void
  deleteCompany: (id: string) => void

  addContact: (contact: Contact) => void
  updateContact: (id: string, patch: Partial<Contact>) => void
  updateContacts: (ids: string[], patch: Partial<Contact>) => void
  deleteContact: (id: string) => void
  deleteContacts: (ids: string[]) => void

  addLead: (lead: Lead) => void
  updateLead: (id: string, patch: Partial<Lead>) => void
  updateLeads: (ids: string[], patch: Partial<Lead>) => void
  deleteLead: (id: string) => void
  deleteLeads: (ids: string[]) => void

  addDeal: (deal: Deal) => void
  updateDeal: (id: string, patch: Partial<Deal>) => void
  deleteDeal: (id: string) => void

  addActivity: (activity: Activity) => void
  updateActivity: (id: string, patch: Partial<Activity>) => void
  deleteActivity: (id: string) => void

  addNote: (note: Note) => void
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void

  addTask: (task: Task) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void

  addStage: (stage: Stage) => void
  updateStage: (id: string, patch: Partial<Stage>) => void
  deleteStage: (id: string) => void
  setStages: (stages: Stage[]) => void

  addSource: (source: Source) => void
  deleteSource: (id: string) => void

  addTag: (tag: Tag) => void
  updateTag: (id: string, patch: Partial<Tag>) => void
  deleteTag: (id: string) => void

  addTemplate: (template: EmailTemplate) => void
  updateTemplate: (id: string, patch: Partial<EmailTemplate>) => void
  deleteTemplate: (id: string) => void

  addNotification: (notification: AppNotification) => void
  markNotificationRead: (id: string, read: boolean) => void
  markAllNotificationsRead: (userId: string) => void
  clearNotifications: (userId: string) => void

  updateSettings: (patch: Partial<Settings>) => void
  setCurrentUser: (id: string | null) => void
}

const seed = createSeedData()

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...seed,

      login: (email, password) => {
        const user = get().users.find(
          (candidate) =>
            candidate.email.toLowerCase() === email.trim().toLowerCase() &&
            candidate.password === password,
        )
        if (user) {
          set({ currentUserId: user.id })
          return user
        }
        return null
      },
      logout: () => set({ currentUserId: null }),
      resetDemoData: () => set({ ...createSeedData(), currentUserId: get().currentUserId }),

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (id, patch) =>
        set((state) => ({
          users: state.users.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter((item) => item.id !== id) })),

      addCompany: (company) => set((state) => ({ companies: [company, ...state.companies] })),
      updateCompany: (id, patch) =>
        set((state) => ({
          companies: state.companies.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString() } : item,
          ),
        })),
      deleteCompany: (id) =>
        set((state) => ({
          companies: state.companies.filter((item) => item.id !== id),
          contacts: state.contacts.map((contact) =>
            contact.companyId === id ? { ...contact, companyId: null } : contact,
          ),
          deals: state.deals.map((deal) => (deal.companyId === id ? { ...deal, companyId: null } : deal)),
        })),

      addContact: (contact) => set((state) => ({ contacts: [contact, ...state.contacts] })),
      updateContact: (id, patch) =>
        set((state) => ({
          contacts: state.contacts.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString() } : item,
          ),
        })),
      updateContacts: (ids, patch) =>
        set((state) => ({
          contacts: state.contacts.map((item) =>
            ids.includes(item.id) ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
          ),
        })),
      deleteContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((item) => item.id !== id),
          deals: state.deals.map((deal) => (deal.contactId === id ? { ...deal, contactId: null } : deal)),
          activities: state.activities.map((a) => (a.contactId === id ? { ...a, contactId: null } : a)),
          notes: state.notes.map((n) => (n.contactId === id ? { ...n, contactId: null } : n)),
        })),
      deleteContacts: (ids) =>
        set((state) => ({
          contacts: state.contacts.filter((item) => !ids.includes(item.id)),
          deals: state.deals.map((deal) =>
            deal.contactId && ids.includes(deal.contactId) ? { ...deal, contactId: null } : deal,
          ),
        })),

      addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
      updateLead: (id, patch) =>
        set((state) => ({
          leads: state.leads.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString() } : item,
          ),
        })),
      updateLeads: (ids, patch) =>
        set((state) => ({
          leads: state.leads.map((item) =>
            ids.includes(item.id) ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
          ),
        })),
      deleteLead: (id) => set((state) => ({ leads: state.leads.filter((item) => item.id !== id) })),
      deleteLeads: (ids) => set((state) => ({ leads: state.leads.filter((item) => !ids.includes(item.id)) })),

      addDeal: (deal) => set((state) => ({ deals: [deal, ...state.deals] })),
      updateDeal: (id, patch) =>
        set((state) => ({
          deals: state.deals.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString() } : item,
          ),
        })),
      deleteDeal: (id) =>
        set((state) => ({
          deals: state.deals.filter((item) => item.id !== id),
          activities: state.activities.map((a) => (a.dealId === id ? { ...a, dealId: null } : a)),
          notes: state.notes.map((n) => (n.dealId === id ? { ...n, dealId: null } : n)),
          tasks: state.tasks.map((t) => (t.relatedId === id ? { ...t, relatedId: null, relatedType: null } : t)),
        })),

      addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities] })),
      updateActivity: (id, patch) =>
        set((state) => ({
          activities: state.activities.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteActivity: (id) =>
        set((state) => ({ activities: state.activities.filter((item) => item.id !== id) })),

      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteNote: (id) => set((state) => ({ notes: state.notes.filter((item) => item.id !== id) })),

      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString() } : item,
          ),
        })),
      deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((item) => item.id !== id) })),

      addStage: (stage) => set((state) => ({ stages: [...state.stages, stage] })),
      updateStage: (id, patch) =>
        set((state) => ({
          stages: state.stages.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteStage: (id) => set((state) => ({ stages: state.stages.filter((item) => item.id !== id) })),
      setStages: (stages) => set({ stages }),

      addSource: (source) => set((state) => ({ sources: [...state.sources, source] })),
      deleteSource: (id) => set((state) => ({ sources: state.sources.filter((item) => item.id !== id) })),

      addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
      updateTag: (id, patch) =>
        set((state) => ({ tags: state.tags.map((item) => (item.id === id ? { ...item, ...patch } : item)) })),
      deleteTag: (id) => set((state) => ({ tags: state.tags.filter((item) => item.id !== id) })),

      addTemplate: (template) => set((state) => ({ templates: [template, ...state.templates] })),
      updateTemplate: (id, patch) =>
        set((state) => ({
          templates: state.templates.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteTemplate: (id) =>
        set((state) => ({ templates: state.templates.filter((item) => item.id !== id) })),

      addNotification: (notification) =>
        set((state) => ({ notifications: [notification, ...state.notifications] })),
      markNotificationRead: (id, read) =>
        set((state) => ({
          notifications: state.notifications.map((item) => (item.id === id ? { ...item, read } : item)),
        })),
      markAllNotificationsRead: (userId) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.userId === userId ? { ...item, read: true } : item,
          ),
        })),
      clearNotifications: (userId) =>
        set((state) => ({
          notifications: state.notifications.filter((item) => item.userId !== userId),
        })),

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      setCurrentUser: (id) => set({ currentUserId: id }),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const {
          users,
          companies,
          contacts,
          leads,
          deals,
          activities,
          notes,
          tasks,
          stages,
          sources,
          tags,
          templates,
          notifications,
          settings,
          currentUserId,
        } = state
        return {
          users,
          companies,
          contacts,
          leads,
          deals,
          activities,
          notes,
          tasks,
          stages,
          sources,
          tags,
          templates,
          notifications,
          settings,
          currentUserId,
        }
      },
      migrate: (persisted, version) => {
        const state = persisted as AppStore
        if (version < 5) {
          return { ...state, users: createSeedData().users }
        }
        return state
      },
    },
  ),
)
