export type Role = 'admin' | 'manager' | 'rep'

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified'
export type LeadSource = string

export type ContactStatus = 'active' | 'prospect' | 'customer' | 'inactive' | 'churned'

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'open' | 'done'

export type ActivityType = 'call' | 'email' | 'meeting' | 'note'

export type RelatedType = 'contact' | 'company' | 'deal' | 'lead'

export type NotificationType =
  | 'task_due'
  | 'deal_assigned'
  | 'deal_won'
  | 'lead_assigned'
  | 'system'

export const ROLES: Role[] = ['admin', 'manager', 'rep']

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  rep: 'Sales Rep',
}

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'unqualified']

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  unqualified: 'Unqualified',
}

export const CONTACT_STATUSES: ContactStatus[] = [
  'active',
  'prospect',
  'customer',
  'inactive',
  'churned',
]

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  active: 'Active',
  prospect: 'Prospect',
  customer: 'Customer',
  inactive: 'Inactive',
  churned: 'Churned',
}

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const ACTIVITY_TYPES: ActivityType[] = ['call', 'email', 'meeting', 'note']

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
}

export const INDUSTRIES = [
  'Technology',
  'SaaS',
  'Financial Services',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Logistics',
  'Education',
  'Real Estate',
  'Energy',
  'Telecom',
  'Hospitality',
] as const

export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
] as const

export type Industry = (typeof INDUSTRIES)[number]
export type CompanySize = (typeof COMPANY_SIZES)[number]
