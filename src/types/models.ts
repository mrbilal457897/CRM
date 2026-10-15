import type {
  ActivityType,
  CompanySize,
  ContactStatus,
  Industry,
  LeadStatus,
  NotificationType,
  RelatedType,
  Role,
  TaskPriority,
  TaskStatus,
} from '@/types/enums'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  title: string
  avatarColor: string
  createdAt: string
}

export interface Company {
  id: string
  name: string
  industry: Industry
  size: CompanySize
  website: string
  location: string
  phone: string
  description: string
  ownerId: string
  tags: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  title: string
  companyId: string | null
  ownerId: string
  status: ContactStatus
  tags: string[]
  source: string
  score: number
  location: string
  lastContactedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  source: string
  status: LeadStatus
  score: number
  ownerId: string
  estimatedValue: number
  notes: string
  tags: string[]
  convertedContactId: string | null
  convertedCompanyId: string | null
  convertedDealId: string | null
  convertedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface LineItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
}

export interface StageChange {
  id: string
  stageId: string
  stageName: string
  fromName: string | null
  toName: string
  userId: string
  at: string
}

export interface Deal {
  id: string
  title: string
  value: number
  stageId: string
  probability: number
  ownerId: string
  companyId: string | null
  contactId: string | null
  expectedCloseDate: string
  source: string
  items: LineItem[]
  lostReason: string | null
  closedAt: string | null
  stageHistory: StageChange[]
  lastActivityAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface Stage {
  id: string
  name: string
  order: number
  color: string
  probability: number
  isWon: boolean
  isLost: boolean
}

export interface Activity {
  id: string
  type: ActivityType
  subject: string
  body: string
  contactId: string | null
  companyId: string | null
  dealId: string | null
  leadId: string | null
  userId: string
  occurredAt: string
  createdAt: string
}

export interface Note {
  id: string
  body: string
  authorId: string
  contactId: string | null
  companyId: string | null
  dealId: string | null
  leadId: string | null
  pinned: boolean
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  assignedToId: string
  relatedType: RelatedType | null
  relatedId: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  createdBy: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Source {
  id: string
  name: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  userId: string
  link: string | null
  createdAt: string
}

export interface Settings {
  currency: string
  companyName: string
}

export type TimelineItem =
  | { kind: 'activity'; id: string; at: string; activity: Activity }
  | { kind: 'note'; id: string; at: string; note: Note }
  | { kind: 'stage'; id: string; at: string; change: StageChange; dealId: string }
  | { kind: 'task'; id: string; at: string; task: Task }
