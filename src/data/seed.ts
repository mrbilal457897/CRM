import {
  COMPANY_SIZES,
  type ActivityType,
  type CompanySize,
  type ContactStatus,
  type Industry,
  type LeadStatus,
  type TaskPriority,
} from '@/types/enums'
import type {
  Activity,
  AppNotification,
  Company,
  Contact,
  Deal,
  EmailTemplate,
  Lead,
  LineItem,
  Note,
  Settings,
  Source,
  Stage,
  StageChange,
  Tag,
  Task,
  User,
} from '@/types/models'
import { colorFromString } from '@/lib/colors'
import { DEFAULT_SOURCES, DEFAULT_STAGES, DEFAULT_TAGS, PRODUCT_CATALOG } from '@/lib/constants'

export interface DatabaseState {
  users: User[]
  companies: Company[]
  contacts: Contact[]
  leads: Lead[]
  deals: Deal[]
  activities: Activity[]
  notes: Note[]
  tasks: Task[]
  stages: Stage[]
  sources: Source[]
  tags: Tag[]
  templates: EmailTemplate[]
  notifications: AppNotification[]
  settings: Settings
  currentUserId: string | null
}

function mulberry32(seed: number) {
  let a = seed
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(20261014)

function randInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function pick<T>(items: readonly T[]): T {
  return items[randInt(0, items.length - 1)]
}

function pickMany<T>(items: readonly T[], count: number): T[] {
  const pool = [...items]
  const out: T[] = []
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    out.push(pool.splice(randInt(0, pool.length - 1), 1)[0])
  }
  return out
}

function chance(probability: number): boolean {
  return random() < probability
}

function daysFromNow(days: number, hoursOffset = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(9 + hoursOffset, 0, 0, 0)
  return date.toISOString()
}

function roundCurrency(value: number): number {
  return Math.round(value / 100) * 100
}

const FIRST_NAMES = [
  'Ayesha', 'Bilal', 'Fatima', 'Hassan', 'Zainab', 'Usman', 'Sana', 'Ali', 'Hira', 'Omar',
  'Mariam', 'Tariq', 'Nida', 'Kamran', 'Sadia', 'Rizwan', 'Priya', 'Arjun', 'Neha', 'Rahul',
  'Ananya', 'Vikram', 'Divya', 'Rohan', 'Sneha', 'Karan', 'Pooja', 'Aditya', 'Daniel', 'Sarah',
  'Michael', 'Emma', 'James', 'Olivia', 'Ahmed', 'Layla', 'Sofia', 'Lucas', 'Chloe', 'Noah',
  'Amara', 'Ethan', 'Isabella', 'Yusuf', 'Grace', 'Leo', 'Mia', 'Owen', 'Aarav', 'Meera',
]

const LAST_NAMES = [
  'Khan', 'Ahmed', 'Sharma', 'Patel', 'Malik', 'Sheikh', 'Iqbal', 'Nair', 'Chaudhry', 'Reddy',
  'Hussain', 'Kapoor', 'Raza', 'Verma', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Garcia',
  'Chen', 'Okafor', 'Nwosu', 'Ali', 'Farooq', 'Ansari', 'Desai', 'Gill', 'Bhatti', 'Qureshi',
]

const LOCATIONS = [
  'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan', 'Dubai, UAE',
  'Mumbai, India', 'Bengaluru, India', 'New Delhi, India', 'London, United Kingdom',
  'Singapore', 'Austin, United States', 'Toronto, Canada', 'Berlin, Germany',
]

const CONTACT_TITLES = [
  'CEO', 'CTO', 'COO', 'VP Engineering', 'VP Sales', 'Head of Operations',
  'Procurement Manager', 'IT Director', 'Product Manager', 'Finance Director',
  'Head of Marketing', 'Founder', 'Operations Lead', 'Chief of Staff',
]

const COMPANY_NAMES: { name: string; industry: Industry; location: string }[] = [
  { name: 'Northwind Technologies', industry: 'Technology', location: 'Karachi, Pakistan' },
  { name: 'Falcon Logistics', industry: 'Logistics', location: 'Dubai, UAE' },
  { name: 'Zenith Financial', industry: 'Financial Services', location: 'London, United Kingdom' },
  { name: 'Crescent Health', industry: 'Healthcare', location: 'Lahore, Pakistan' },
  { name: 'Orbit Software', industry: 'SaaS', location: 'Bengaluru, India' },
  { name: 'Silk Road Traders', industry: 'Retail', location: 'Islamabad, Pakistan' },
  { name: 'Meridian Manufacturing', industry: 'Manufacturing', location: 'Berlin, Germany' },
  { name: 'BluePeak Retail', industry: 'Retail', location: 'Singapore' },
  { name: 'Apex Energy', industry: 'Energy', location: 'Austin, United States' },
  { name: 'Lumen Telecom', industry: 'Telecom', location: 'Mumbai, India' },
  { name: 'GreenField Agritech', industry: 'Education', location: 'New Delhi, India' },
  { name: 'Summit Realty', industry: 'Real Estate', location: 'Toronto, Canada' },
  { name: 'Nimbus Cloud', industry: 'Technology', location: 'Austin, United States' },
  { name: 'Vertex Education', industry: 'Education', location: 'London, United Kingdom' },
  { name: 'Harbor Hospitality', industry: 'Hospitality', location: 'Dubai, UAE' },
]

const DEAL_TITLES = [
  'Enterprise Platform Rollout',
  'Annual Subscription Renewal',
  'Cloud Migration Project',
  'Analytics Suite Expansion',
  'Multi-Region Deployment',
  'CRM Implementation',
  'Support Plan Upgrade',
  'Data Platform Modernization',
  'API Integration Package',
  'Onboarding & Enablement',
  'Security & Compliance Add-on',
  'Global Team License',
]

const EMAIL_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'Intro / Discovery',
    subject: 'Quick intro — {{company}}',
    body:
      'Hi {{first_name}},\n\nThanks for your interest in our platform. I would love to learn more about how {{company}} handles its sales operations today and see if we can help.\n\nWould you have 20 minutes this week for a quick call?\n\nBest regards,\n{{sender_name}}',
  },
  {
    name: 'Follow-up after demo',
    subject: 'Following up on our demo',
    body:
      'Hi {{first_name}},\n\nThank you for your time on the demo. As promised, I have attached a summary tailored to {{company}}.\n\nDo you have any questions I can answer before we align on next steps?\n\nBest,\n{{sender_name}}',
  },
  {
    name: 'Proposal sent',
    subject: 'Your proposal from {{sender_company}}',
    body:
      'Hi {{first_name}},\n\nPlease find our proposal attached. It covers scope, timeline, and pricing for {{company}}.\n\nHappy to walk through it together — let me know what works for you.\n\nBest regards,\n{{sender_name}}',
  },
  {
    name: 'Meeting confirmation',
    subject: 'Confirming our meeting',
    body:
      'Hi {{first_name}},\n\nJust confirming our meeting. Looking forward to connecting with you and the {{company}} team.\n\nTalk soon,\n{{sender_name}}',
  },
  {
    name: 'Check-in / nurture',
    subject: 'Checking in',
    body:
      'Hi {{first_name}},\n\nIt has been a little while — I wanted to check in and see how things are progressing at {{company}}.\n\nIs there anything I can help with?\n\nBest,\n{{sender_name}}',
  },
]

export function createSeedData(): DatabaseState {
  const users: User[] = [
    {
      id: 'user_admin',
      name: 'Ayesha Khan',
      email: 'ayesha.khan@northwindcrm.com',
      password: 'manager123',
      role: 'manager',
      title: 'Sales Manager',
      avatarColor: colorFromString('Ayesha Khan'),
      createdAt: daysFromNow(-400),
    },
    {
      id: 'user_manager',
      name: 'Bilal Alee',
      email: 'bilal.alee@northwindcrm.com',
      password: 'admin123',
      role: 'admin',
      title: 'Sales Director',
      avatarColor: colorFromString('Bilal Alee'),
      createdAt: daysFromNow(-380),
    },
    {
      id: 'user_rep_priya',
      name: 'Priya Sharma',
      email: 'priya.sharma@northwindcrm.com',
      password: 'rep123',
      role: 'rep',
      title: 'Account Executive',
      avatarColor: colorFromString('Priya Sharma'),
      createdAt: daysFromNow(-300),
    },
    {
      id: 'user_rep_daniel',
      name: 'Daniel Okafor',
      email: 'daniel.okafor@northwindcrm.com',
      password: 'rep123',
      role: 'rep',
      title: 'Account Executive',
      avatarColor: colorFromString('Daniel Okafor'),
      createdAt: daysFromNow(-260),
    },
  ]

  const repIds = users.map((u) => u.id)

  const companies: Company[] = COMPANY_NAMES.map((entry, index) => {
    const slug = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const owner = pick(repIds)
    const created = daysFromNow(-randInt(120, 360))
    return {
      id: `company_${index + 1}`,
      name: entry.name,
      industry: entry.industry,
      size: pick(COMPANY_SIZES) as CompanySize,
      website: `https://www.${slug}.com`,
      location: entry.location,
      phone: `+${randInt(1, 99)} ${randInt(100, 999)} ${randInt(1000000, 9999999)}`,
      description: `${entry.name} is a ${entry.industry.toLowerCase()} organisation headquartered in ${entry.location}.`,
      ownerId: owner,
      tags: pickMany(DEFAULT_TAGS, randInt(1, 2)).map((t) => t.name),
      createdAt: created,
      updatedAt: daysFromNow(-randInt(0, 40)),
      createdBy: pick(repIds),
    }
  })

  const usedEmails = new Set<string>()
  const contacts: Contact[] = []
  const STATUS_WEIGHTS: ContactStatus[] = ['active', 'customer', 'prospect', 'active', 'customer', 'inactive', 'prospect']

  for (let i = 0; i < 40; i += 1) {
    const firstName = pick(FIRST_NAMES)
    const lastName = pick(LAST_NAMES)
    let email = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '') + `@${pick(companies).name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 12)}.com`
    if (usedEmails.has(email)) email = `${firstName}.${lastName}.${i}`.toLowerCase() + '@example.com'
    usedEmails.add(email)

    const company = pick(companies)
    const created = daysFromNow(-randInt(20, 300))
    const lastContacted = chance(0.7) ? daysFromNow(-randInt(0, 45)) : null
    contacts.push({
      id: `contact_${i + 1}`,
      firstName,
      lastName,
      email,
      phone: `+${randInt(1, 99)} ${randInt(100, 999)} ${randInt(1000000, 9999999)}`,
      title: pick(CONTACT_TITLES),
      companyId: company.id,
      ownerId: pick(repIds),
      status: pick(STATUS_WEIGHTS),
      tags: pickMany(DEFAULT_TAGS, randInt(0, 2)).map((t) => t.name),
      source: pick(DEFAULT_SOURCES).name,
      score: randInt(10, 98),
      location: pick(LOCATIONS),
      lastContactedAt: lastContacted,
      createdAt: created,
      updatedAt: daysFromNow(-randInt(0, 30)),
      createdBy: pick(repIds),
    })
  }

  const leads: Lead[] = []
  const LEAD_STATUS_WEIGHTS: LeadStatus[] = [
    'new', 'new', 'contacted', 'contacted', 'qualified', 'new', 'unqualified', 'contacted', 'qualified', 'new',
  ]
  for (let i = 0; i < 30; i += 1) {
    const firstName = pick(FIRST_NAMES)
    const lastName = pick(LAST_NAMES)
    const createdAt = daysFromNow(-randInt(1, 120))
    const converted = i < 5
    leads.push({
      id: `lead_${i + 1}`,
      firstName,
      lastName,
      email: `${firstName}.${lastName}${i}`.toLowerCase().replace(/[^a-z0-9]/g, '') + '@example.com',
      phone: `+${randInt(1, 99)} ${randInt(100, 999)} ${randInt(1000000, 9999999)}`,
      companyName: chance(0.5) ? pick(companies).name : `${lastName} Ventures`,
      source: pick(DEFAULT_SOURCES).name,
      status: converted ? 'qualified' : pick(LEAD_STATUS_WEIGHTS),
      score: randInt(20, 99),
      ownerId: pick(repIds),
      estimatedValue: roundCurrency(randInt(8, 80) * 1000),
      notes: chance(0.5) ? 'Inbound request via website. Interested in a demo for the sales team.' : '',
      tags: pickMany(DEFAULT_TAGS, randInt(0, 2)).map((t) => t.name),
      convertedContactId: converted ? `contact_${i + 1}` : null,
      convertedCompanyId: converted ? pick(companies).id : null,
      convertedDealId: converted ? `deal_${i + 1}` : null,
      convertedAt: converted ? daysFromNow(-randInt(5, 60)) : null,
      createdAt,
      updatedAt: daysFromNow(-randInt(0, 20)),
      createdBy: pick(repIds),
    })
  }

  const wonStage = DEFAULT_STAGES.find((s) => s.isWon) as Stage
  const lostStage = DEFAULT_STAGES.find((s) => s.isLost) as Stage

  const stagePlan: Stage[] = [
    ...Array<Stage>(7).fill(DEFAULT_STAGES[0]),
    ...Array<Stage>(6).fill(DEFAULT_STAGES[1]),
    ...Array<Stage>(6).fill(DEFAULT_STAGES[2]),
    ...Array<Stage>(5).fill(DEFAULT_STAGES[3]),
    ...Array<Stage>(8).fill(wonStage),
    ...Array<Stage>(5).fill(lostStage),
  ]

  const deals: Deal[] = []
  stagePlan.forEach((stage, index) => {
    const company = pick(companies)
    const companyContacts = contacts.filter((c) => c.companyId === company.id)
    const contact = companyContacts.length > 0 ? pick(companyContacts) : pick(contacts)
    const owner = chance(0.5) ? contact.ownerId : pick(repIds)
    const createdDaysAgo = stage.isWon || stage.isLost ? randInt(20, 170) : randInt(3, 90)
    const itemCount = randInt(1, 3)
    const items: LineItem[] = pickMany(PRODUCT_CATALOG, itemCount).map((product, itemIndex) => {
      const quantity = randInt(1, 6)
      return {
        id: `item_${index + 1}_${itemIndex + 1}`,
        productName: product.name,
        quantity,
        unitPrice: product.unitPrice,
        discount: chance(0.4) ? randInt(5, 20) : 0,
      }
    })
    const value = roundCurrency(
      items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100), 0),
    )

    const expectedCloseDays = stage.isWon || stage.isLost ? -randInt(1, 30) : randInt(5, 75)
    const lastActivityDaysAgo =
      stage.isWon || stage.isLost ? randInt(1, 20) : chance(0.3) ? randInt(8, 25) : randInt(0, 6)

    const history: StageChange[] = []
    const startName = DEFAULT_STAGES[0].name
    history.push({
      id: `sc_${index + 1}_0`,
      stageId: DEFAULT_STAGES[0].id,
      stageName: startName,
      fromName: null,
      toName: startName,
      userId: pick(repIds),
      at: daysFromNow(-createdDaysAgo),
    })
    const pathStages = [DEFAULT_STAGES[1], DEFAULT_STAGES[2], stage].filter(
      (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i,
    )
    pathStages.forEach((s, pathIndex) => {
      if (s.id === DEFAULT_STAGES[0].id) return
      history.push({
        id: `sc_${index + 1}_${pathIndex + 1}`,
        stageId: s.id,
        stageName: s.name,
        fromName: pathIndex === 0 ? startName : pathStages[pathIndex - 1].name,
        toName: s.name,
        userId: pick(repIds),
        at: daysFromNow(-Math.max(1, createdDaysAgo - (pathIndex + 1) * randInt(4, 14))),
      })
    })

    const closedAt =
      stage.isWon || stage.isLost ? daysFromNow(-randInt(1, 150)) : null

    deals.push({
      id: `deal_${index + 1}`,
      title: `${pick(DEAL_TITLES)} — ${company.name}`,
      value,
      stageId: stage.id,
      probability: stage.probability,
      ownerId: owner,
      companyId: company.id,
      contactId: contact.id,
      expectedCloseDate: daysFromNow(expectedCloseDays),
      source: pick(DEFAULT_SOURCES).name,
      items,
      lostReason: stage.isLost ? pick(['Price too high', 'Went with competitor', 'No budget', 'Bad timing', 'Feature gap']) : null,
      closedAt,
      stageHistory: history,
      lastActivityAt: daysFromNow(-lastActivityDaysAgo),
      createdAt: daysFromNow(-createdDaysAgo),
      updatedAt: daysFromNow(-randInt(0, 10)),
      createdBy: owner,
    })
  })

  const activities: Activity[] = []
  const activityTypes: ActivityType[] = ['call', 'email', 'meeting', 'note', 'email', 'call']
  const activitySubjects: Record<ActivityType, string[]> = {
    call: ['Discovery call', 'Follow-up call', 'Pricing discussion', 'Check-in call'],
    email: ['Sent proposal', 'Shared pricing sheet', 'Followed up on demo', 'Sent case study'],
    meeting: ['Product demo', 'Onboarding workshop', 'Quarterly review', 'Technical deep-dive'],
    note: ['Internal note', 'Summary of call', 'Next steps'],
  }

  for (let i = 0; i < 110; i += 1) {
    const type = pick(activityTypes)
    const deal = pick(deals)
    const contact = deal.contactId ? contacts.find((c) => c.id === deal.contactId) ?? pick(contacts) : pick(contacts)
    const isUpcomingMeeting = type === 'meeting' && chance(0.35)
    const occurredAt = isUpcomingMeeting ? daysFromNow(randInt(1, 21), randInt(0, 6)) : daysFromNow(-randInt(0, 110), randInt(0, 8))
    activities.push({
      id: `activity_${i + 1}`,
      type,
      subject: pick(activitySubjects[type]),
      body:
        type === 'note'
          ? 'Logged key discussion points and agreed next steps with the customer.'
          : `Interaction with ${contact.firstName} ${contact.lastName} regarding ${deal.title}.`,
      contactId: chance(0.8) ? contact.id : null,
      companyId: deal.companyId,
      dealId: chance(0.8) ? deal.id : null,
      leadId: null,
      userId: deal.ownerId,
      occurredAt,
      createdAt: occurredAt,
    })
  }

  const notes: Note[] = []
  for (let i = 0; i < 24; i += 1) {
    const contact = pick(contacts)
    notes.push({
      id: `note_${i + 1}`,
      body: pick([
        'Champion identified — will help push internally.',
        'Budget approved for next quarter.',
        'Competitor evaluation in progress.',
        'Requested a revised proposal with annual discount.',
        'Decision maker is on leave until next month.',
        'Very positive call, wants a technical demo.',
      ]),
      authorId: contact.ownerId,
      contactId: contact.id,
      companyId: contact.companyId,
      dealId: null,
      leadId: null,
      pinned: chance(0.2),
      createdAt: daysFromNow(-randInt(0, 60)),
    })
  }

  const tasks: Task[] = []
  const taskTitles = [
    'Call to confirm requirements',
    'Send proposal',
    'Schedule product demo',
    'Follow up on contract',
    'Prepare pricing comparison',
    'Share case study',
    'Check in after onboarding',
    'Review renewal terms',
    'Collect feedback',
    'Prepare quarterly business review',
  ]
  const priorities: TaskPriority[] = ['low', 'medium', 'high', 'medium', 'high']
  for (let i = 0; i < 42; i += 1) {
    const deal = pick(deals)
    const contact = deal.contactId ? contacts.find((c) => c.id === deal.contactId) ?? pick(contacts) : pick(contacts)
    const done = chance(0.3)
    const dayOffset = done ? -randInt(1, 40) : pick([-6, -4, -2, -1, 0, 0, 1, 2, 3, 5, 7, 10, 14])
    const status = done ? 'done' : 'open'
    tasks.push({
      id: `task_${i + 1}`,
      title: pick(taskTitles),
      description: `Associated with ${deal.title}.`,
      dueDate: daysFromNow(dayOffset, randInt(0, 8)),
      priority: pick(priorities),
      status,
      assignedToId: deal.ownerId,
      relatedType: chance(0.7) ? 'deal' : 'contact',
      relatedId: chance(0.7) ? deal.id : contact.id,
      createdAt: daysFromNow(-randInt(1, 60)),
      updatedAt: daysFromNow(-randInt(0, 10)),
      completedAt: done ? daysFromNow(dayOffset) : null,
      createdBy: deal.ownerId,
    })
  }

  const templates: EmailTemplate[] = EMAIL_TEMPLATES.map((tpl, index) => ({
    ...tpl,
    id: `template_${index + 1}`,
    createdAt: daysFromNow(-randInt(30, 200)),
    updatedAt: daysFromNow(-randInt(0, 30)),
    createdBy: pick(repIds),
  }))

  const notifications: AppNotification[] = [
    {
      id: 'notif_1',
      type: 'deal_won',
      title: 'Deal won 🎉',
      message: 'Enterprise Platform Rollout was marked as Won.',
      read: false,
      userId: 'user_admin',
      link: '/deals',
      createdAt: daysFromNow(0, 1),
    },
    {
      id: 'notif_2',
      type: 'deal_assigned',
      title: 'New deal assigned',
      message: 'You were assigned a new deal worth $24,000.',
      read: false,
      userId: 'user_rep_priya',
      link: '/deals',
      createdAt: daysFromNow(-1, 3),
    },
    {
      id: 'notif_3',
      type: 'task_due',
      title: 'Task due today',
      message: 'Send proposal is due today.',
      read: false,
      userId: 'user_rep_daniel',
      link: '/tasks',
      createdAt: daysFromNow(0, 2),
    },
    {
      id: 'notif_4',
      type: 'lead_assigned',
      title: 'New lead assigned',
      message: 'A new qualified lead was assigned to you.',
      read: true,
      userId: 'user_manager',
      link: '/leads',
      createdAt: daysFromNow(-2, 4),
    },
    {
      id: 'notif_5',
      type: 'system',
      title: 'Welcome to Northwind CRM',
      message: 'Your demo workspace is ready. Explore the dashboard to get started.',
      read: true,
      userId: 'user_admin',
      link: '/',
      createdAt: daysFromNow(-5, 1),
    },
  ]

  return {
    users,
    companies,
    contacts,
    leads,
    deals,
    activities,
    notes,
    tasks,
    stages: DEFAULT_STAGES,
    sources: DEFAULT_SOURCES,
    tags: DEFAULT_TAGS,
    templates,
    notifications,
    settings: { currency: 'USD', companyName: 'Northwind CRM' },
    currentUserId: null,
  }
}

export function stageProbability(stages: Stage[], stageId: string): number {
  return stages.find((s) => s.id === stageId)?.probability ?? 0
}

export function makeStageChange(
  stage: Stage,
  fromName: string | null,
  userId: string,
  at: string,
): StageChange {
  return {
    id: `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    stageId: stage.id,
    stageName: stage.name,
    fromName,
    toName: stage.name,
    userId,
    at,
  }
}
