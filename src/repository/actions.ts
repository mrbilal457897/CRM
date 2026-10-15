import { currentUserId, getStore } from '@/repository/core'
import { useAppStore } from '@/store'
import type { DatabaseState } from '@/data/seed'
import { uid } from '@/lib/id'
import { DEFAULT_STAGES } from '@/lib/constants'
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

function nowISO(): string {
  return new Date().toISOString()
}

function actor(): string {
  return currentUserId()
}

/* ---------------------------------- users --------------------------------- */

export type UserInput = Omit<User, 'id' | 'createdAt'>

export function createUser(input: UserInput): User {
  const user: User = { ...input, id: uid('user'), createdAt: nowISO() }
  getStore().addUser(user)
  return user
}

export function updateUser(id: string, patch: Partial<User>): void {
  getStore().updateUser(id, patch)
}

export function deleteUser(id: string): void {
  getStore().deleteUser(id)
}

/* -------------------------------- companies ------------------------------- */

export type CompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>

export function createCompany(input: CompanyInput): Company {
  const company: Company = {
    ...input,
    id: uid('company'),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    createdBy: actor(),
  }
  getStore().addCompany(company)
  return company
}

export function updateCompany(id: string, patch: Partial<Company>): void {
  getStore().updateCompany(id, patch)
}

export function deleteCompany(id: string): void {
  getStore().deleteCompany(id)
}

export function bulkAssignCompanies(ids: string[], ownerId: string): void {
  const store = getStore()
  ids.forEach((id) => store.updateCompany(id, { ownerId }))
}

export function bulkTagCompanies(ids: string[], tag: string): void {
  const store = getStore()
  ids.forEach((id) => {
    const company = store.companies.find((c) => c.id === id)
    if (company && !company.tags.includes(tag)) {
      store.updateCompany(id, { tags: [...company.tags, tag] })
    }
  })
}

export function bulkDeleteCompanies(ids: string[]): void {
  const store = getStore()
  ids.forEach((id) => store.deleteCompany(id))
}

/* -------------------------------- contacts -------------------------------- */

export type ContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>

export function createContact(input: ContactInput): Contact {
  const contact: Contact = {
    ...input,
    id: uid('contact'),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    createdBy: actor(),
  }
  getStore().addContact(contact)
  return contact
}

export function updateContact(id: string, patch: Partial<Contact>): void {
  getStore().updateContact(id, patch)
}

export function deleteContact(id: string): void {
  getStore().deleteContact(id)
}

export function bulkAssignContacts(ids: string[], ownerId: string): void {
  getStore().updateContacts(ids, { ownerId })
}

export function bulkStatusContacts(ids: string[], status: Contact['status']): void {
  getStore().updateContacts(ids, { status })
}

export function bulkTagContacts(ids: string[], tag: string): void {
  const store = getStore()
  ids.forEach((id) => {
    const contact = store.contacts.find((c) => c.id === id)
    if (contact && !contact.tags.includes(tag)) {
      store.updateContact(id, { tags: [...contact.tags, tag] })
    }
  })
}

export function bulkDeleteContacts(ids: string[]): void {
  getStore().deleteContacts(ids)
}

/* ---------------------------------- leads --------------------------------- */

export type LeadInput = Omit<
  Lead,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'convertedContactId' | 'convertedCompanyId' | 'convertedDealId' | 'convertedAt'
> &
  Partial<Pick<Lead, 'convertedContactId' | 'convertedCompanyId' | 'convertedDealId' | 'convertedAt'>>

export function createLead(input: LeadInput): Lead {
  const lead: Lead = {
    ...input,
    convertedContactId: input.convertedContactId ?? null,
    convertedCompanyId: input.convertedCompanyId ?? null,
    convertedDealId: input.convertedDealId ?? null,
    convertedAt: input.convertedAt ?? null,
    id: uid('lead'),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    createdBy: actor(),
  }
  getStore().addLead(lead)
  return lead
}

export function updateLead(id: string, patch: Partial<Lead>): void {
  getStore().updateLead(id, patch)
}

export function deleteLead(id: string): void {
  getStore().deleteLead(id)
}

export function bulkAssignLeads(ids: string[], ownerId: string): void {
  getStore().updateLeads(ids, { ownerId })
}

export function bulkStatusLeads(ids: string[], status: Lead['status']): void {
  getStore().updateLeads(ids, { status })
}

export function bulkDeleteLeads(ids: string[]): void {
  getStore().deleteLeads(ids)
}

export interface ConvertLeadResult {
  contact: Contact
  company: Company
  deal: Deal
}

export function convertLead(leadId: string): ConvertLeadResult | null {
  const store = getStore()
  const lead = store.leads.find((item) => item.id === leadId)
  if (!lead || lead.convertedContactId) return null

  const existingCompany = store.companies.find(
    (company) => company.name.toLowerCase() === lead.companyName.trim().toLowerCase(),
  )
  const company =
    existingCompany ??
    createCompany({
      name: lead.companyName || `${lead.firstName} ${lead.lastName} Co.`,
      industry: 'Technology',
      size: '11-50',
      website: '',
      location: '',
      phone: lead.phone,
      description: `Created from lead conversion.`,
      ownerId: lead.ownerId,
      tags: [],
    })

  const contact = createContact({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    title: '',
    companyId: company.id,
    ownerId: lead.ownerId,
    status: 'prospect',
    tags: lead.tags,
    source: lead.source,
    score: lead.score,
    location: '',
    lastContactedAt: null,
  })

  const firstStage = [...store.stages].sort((a, b) => a.order - b.order)[0] ?? DEFAULT_STAGES[0]
  const closeDate = new Date()
  closeDate.setDate(closeDate.getDate() + 30)
  const deal = createDeal({
    title: `${lead.companyName || `${lead.firstName} ${lead.lastName}`} — New Opportunity`,
    value: lead.estimatedValue,
    stageId: firstStage.id,
    probability: firstStage.probability,
    ownerId: lead.ownerId,
    companyId: company.id,
    contactId: contact.id,
    expectedCloseDate: closeDate.toISOString(),
    source: lead.source,
    items: [],
    lostReason: null,
    closedAt: null,
    stageHistory: [
      {
        id: uid('sc'),
        stageId: firstStage.id,
        stageName: firstStage.name,
        fromName: null,
        toName: firstStage.name,
        userId: actor(),
        at: nowISO(),
      },
    ],
    lastActivityAt: nowISO(),
  })

  updateLead(leadId, {
    status: 'qualified',
    convertedContactId: contact.id,
    convertedCompanyId: company.id,
    convertedDealId: deal.id,
    convertedAt: nowISO(),
  })

  pushNotification({
    type: 'lead_assigned',
    title: 'Lead converted',
    message: `${lead.firstName} ${lead.lastName} was converted to a contact, company and deal.`,
    link: '/deals',
    userId: lead.ownerId,
  })

  return { contact, company, deal }
}

/* ---------------------------------- deals --------------------------------- */

export type DealInput = Omit<
  Deal,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'stageHistory'
> & {
  stageHistory?: Deal['stageHistory']
}

export function createDeal(input: DealInput): Deal {
  const deal: Deal = {
    ...input,
    stageHistory: input.stageHistory ?? [],
    id: uid('deal'),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    createdBy: actor(),
  }
  getStore().addDeal(deal)
  return deal
}

export function updateDeal(id: string, patch: Partial<Deal>): void {
  getStore().updateDeal(id, patch)
}

export function deleteDeal(id: string): void {
  getStore().deleteDeal(id)
}

export function moveDealStage(dealId: string, stageId: string): void {
  const store = getStore()
  const deal = store.deals.find((item) => item.id === dealId)
  const stage = store.stages.find((item) => item.id === stageId)
  if (!deal || !stage || deal.stageId === stageId) return

  const fromStage = store.stages.find((item) => item.id === deal.stageId)
  const history = [
    ...deal.stageHistory,
    {
      id: uid('sc'),
      stageId: stage.id,
      stageName: stage.name,
      fromName: fromStage?.name ?? null,
      toName: stage.name,
      userId: actor(),
      at: nowISO(),
    },
  ]

  updateDeal(dealId, {
    stageId: stage.id,
    probability: stage.probability,
    stageHistory: history,
    closedAt: stage.isWon || stage.isLost ? nowISO() : null,
    lostReason: stage.isLost ? deal.lostReason : null,
    lastActivityAt: nowISO(),
  })

  if (stage.isWon) {
    pushNotification({
      type: 'deal_won',
      title: 'Deal won 🎉',
      message: `${deal.title} was marked as Won.`,
      link: `/deals?deal=${deal.id}`,
      userId: deal.ownerId,
    })
  }
}

export function loseDeal(dealId: string, reason: string): void {
  const store = getStore()
  const lostStage = store.stages.find((stage) => stage.isLost)
  if (!lostStage) return
  updateDeal(dealId, { lostReason: reason })
  moveDealStage(dealId, lostStage.id)
}

/* -------------------------------- activities ------------------------------ */

export type ActivityInput = Omit<Activity, 'id' | 'createdAt' | 'userId'> & { userId?: string }

export function logActivity(input: ActivityInput): Activity {
  const activity: Activity = {
    ...input,
    userId: input.userId ?? actor(),
    id: uid('activity'),
    createdAt: nowISO(),
  }
  getStore().addActivity(activity)
  return activity
}

export function deleteActivity(id: string): void {
  getStore().deleteActivity(id)
}

/* ---------------------------------- notes --------------------------------- */

export type NoteInput = Omit<Note, 'id' | 'createdAt' | 'authorId'> & { authorId?: string }

export function createNote(input: NoteInput): Note {
  const note: Note = {
    ...input,
    authorId: input.authorId ?? actor(),
    id: uid('note'),
    createdAt: nowISO(),
  }
  getStore().addNote(note)
  return note
}

export function updateNote(id: string, patch: Partial<Note>): void {
  getStore().updateNote(id, patch)
}

export function deleteNote(id: string): void {
  getStore().deleteNote(id)
}

/* ---------------------------------- tasks --------------------------------- */

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'completedAt' | 'status'> &
  Partial<Pick<Task, 'status' | 'completedAt'>>

export function createTask(input: TaskInput): Task {
  const task: Task = {
    ...input,
    status: input.status ?? 'open',
    completedAt: input.completedAt ?? null,
    id: uid('task'),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    createdBy: actor(),
  }
  getStore().addTask(task)
  return task
}

export function updateTask(id: string, patch: Partial<Task>): void {
  getStore().updateTask(id, patch)
}

export function toggleTask(id: string): void {
  const store = getStore()
  const task = store.tasks.find((item) => item.id === id)
  if (!task) return
  const done = task.status === 'open'
  store.updateTask(id, {
    status: done ? 'done' : 'open',
    completedAt: done ? nowISO() : null,
  })
}

export function deleteTask(id: string): void {
  getStore().deleteTask(id)
}

/* --------------------------------- stages --------------------------------- */

export function createStage(input: Omit<Stage, 'id' | 'order'>): Stage {
  const store = getStore()
  const stage: Stage = {
    ...input,
    id: uid('stage'),
    order: store.stages.length,
  }
  store.addStage(stage)
  return stage
}

export function updateStage(id: string, patch: Partial<Stage>): void {
  getStore().updateStage(id, patch)
}

export function deleteStage(id: string): void {
  getStore().deleteStage(id)
}

export function reorderStages(stages: Stage[]): void {
  getStore().setStages(stages.map((stage, index) => ({ ...stage, order: index })))
}

/* --------------------------------- sources -------------------------------- */

export function createSource(name: string): Source {
  const source: Source = { id: uid('src'), name }
  getStore().addSource(source)
  return source
}

export function deleteSource(id: string): void {
  getStore().deleteSource(id)
}

/* ---------------------------------- tags ---------------------------------- */

export function createTag(name: string, color: string): Tag {
  const tag: Tag = { id: uid('tag'), name, color }
  getStore().addTag(tag)
  return tag
}

export function updateTag(id: string, patch: Partial<Tag>): void {
  getStore().updateTag(id, patch)
}

export function deleteTag(id: string): void {
  getStore().deleteTag(id)
}

/* -------------------------------- templates ------------------------------- */

export type TemplateInput = Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>

export function createTemplate(input: TemplateInput): EmailTemplate {
  const template: EmailTemplate = {
    ...input,
    id: uid('template'),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    createdBy: actor(),
  }
  getStore().addTemplate(template)
  return template
}

export function updateTemplate(id: string, patch: Partial<EmailTemplate>): void {
  getStore().updateTemplate(id, { ...patch, updatedAt: nowISO() })
}

export function deleteTemplate(id: string): void {
  getStore().deleteTemplate(id)
}

/* ------------------------------ notifications ----------------------------- */

export type NotificationInput = Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'userId'> & {
  userId?: string
}

export function pushNotification(input: NotificationInput): AppNotification {
  const notification: AppNotification = {
    ...input,
    userId: input.userId ?? actor(),
    read: false,
    id: uid('notif'),
    createdAt: nowISO(),
  }
  getStore().addNotification(notification)
  return notification
}

export function markNotificationRead(id: string, read: boolean): void {
  getStore().markNotificationRead(id, read)
}

export function markAllNotificationsRead(userId: string): void {
  getStore().markAllNotificationsRead(userId)
}

export function clearNotifications(userId: string): void {
  getStore().clearNotifications(userId)
}

/* -------------------------------- settings -------------------------------- */

export function updateSettings(patch: Partial<Settings>): void {
  getStore().updateSettings(patch)
}

/* --------------------------------- session -------------------------------- */

export function login(email: string, password: string): User | null {
  return getStore().login(email, password)
}

export function logout(): void {
  getStore().logout()
}

export function resetDemoData(): void {
  getStore().resetDemoData()
}

/** Force an immediate persistence write (used after seeding). */
export function persistNow(): void {
  useAppStore.setState({})
}

/* ------------------------------ import / export --------------------------- */

export type BackupBundle = DatabaseState

export function exportAllData(): BackupBundle {
  const state = getStore()
  return {
    users: state.users,
    companies: state.companies,
    contacts: state.contacts,
    leads: state.leads,
    deals: state.deals,
    activities: state.activities,
    notes: state.notes,
    tasks: state.tasks,
    stages: state.stages,
    sources: state.sources,
    tags: state.tags,
    templates: state.templates,
    notifications: state.notifications,
    settings: state.settings,
    currentUserId: state.currentUserId,
  }
}

export function importAllData(data: Partial<BackupBundle>): void {
  useAppStore.setState((state) => ({
    users: data.users ?? state.users,
    companies: data.companies ?? state.companies,
    contacts: data.contacts ?? state.contacts,
    leads: data.leads ?? state.leads,
    deals: data.deals ?? state.deals,
    activities: data.activities ?? state.activities,
    notes: data.notes ?? state.notes,
    tasks: data.tasks ?? state.tasks,
    stages: data.stages ?? state.stages,
    sources: data.sources ?? state.sources,
    tags: data.tags ?? state.tags,
    templates: data.templates ?? state.templates,
    notifications: data.notifications ?? state.notifications,
    settings: data.settings ?? state.settings,
  }))
}

export function clearAllData(): void {
  useAppStore.setState((state) => ({
    companies: [],
    contacts: [],
    leads: [],
    deals: [],
    activities: [],
    notes: [],
    tasks: [],
    notifications: [],
    users: state.users,
    settings: state.settings,
    currentUserId: state.currentUserId,
  }))
}
