import type { Source, Stage, Tag } from '@/types/models'

export const STORE_KEY = 'crm.store.v5'
export const STORE_VERSION = 5

export const DEFAULT_STAGES: Stage[] = [
  { id: 'stage_lead', name: 'Lead', order: 0, color: '#64748b', probability: 10, isWon: false, isLost: false },
  { id: 'stage_contacted', name: 'Contacted', order: 1, color: '#3b82f6', probability: 25, isWon: false, isLost: false },
  { id: 'stage_proposal', name: 'Proposal', order: 2, color: '#8b5cf6', probability: 50, isWon: false, isLost: false },
  { id: 'stage_negotiation', name: 'Negotiation', order: 3, color: '#f59e0b', probability: 75, isWon: false, isLost: false },
  { id: 'stage_won', name: 'Won', order: 4, color: '#22c55e', probability: 100, isWon: true, isLost: false },
  { id: 'stage_lost', name: 'Lost', order: 5, color: '#ef4444', probability: 0, isWon: false, isLost: true },
]

export const DEFAULT_SOURCES: Source[] = [
  { id: 'src_website', name: 'Website' },
  { id: 'src_referral', name: 'Referral' },
  { id: 'src_cold_call', name: 'Cold Call' },
  { id: 'src_linkedin', name: 'LinkedIn' },
  { id: 'src_email_campaign', name: 'Email Campaign' },
  { id: 'src_event', name: 'Event' },
  { id: 'src_partner', name: 'Partner' },
  { id: 'src_webinar', name: 'Webinar' },
  { id: 'src_organic', name: 'Organic Search' },
  { id: 'src_paid_ads', name: 'Paid Ads' },
]

export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag_enterprise', name: 'Enterprise', color: '#6366f1' },
  { id: 'tag_smb', name: 'SMB', color: '#22c55e' },
  { id: 'tag_hot', name: 'Hot', color: '#f43f5e' },
  { id: 'tag_vip', name: 'VIP', color: '#a855f7' },
  { id: 'tag_renewal', name: 'Renewal', color: '#f59e0b' },
  { id: 'tag_upsell', name: 'Upsell', color: '#06b6d4' },
  { id: 'tag_churn_risk', name: 'Churn Risk', color: '#ef4444' },
  { id: 'tag_government', name: 'Government', color: '#64748b' },
  { id: 'tag_startup', name: 'Startup', color: '#ec4899' },
  { id: 'tag_trial', name: 'Trial', color: '#3b82f6' },
]

export const CURRENCIES: { code: string; label: string }[] = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'PKR', label: 'Pakistani Rupee' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'AED', label: 'UAE Dirham' },
]

export const LOST_REASONS = [
  'Price too high',
  'Went with competitor',
  'No budget',
  'Bad timing',
  'No decision / unresponsive',
  'Feature gap',
  'Other',
]

export const PRODUCT_CATALOG = [
  { name: 'Platform License', unitPrice: 12000 },
  { name: 'Pro Plan (annual)', unitPrice: 8400 },
  { name: 'Enterprise Plan (annual)', unitPrice: 24000 },
  { name: 'Onboarding & Setup', unitPrice: 3500 },
  { name: 'Premium Support', unitPrice: 4800 },
  { name: 'Custom Integration', unitPrice: 6500 },
  { name: 'Training Package', unitPrice: 1800 },
  { name: 'Analytics Add-on', unitPrice: 2400 },
  { name: 'API Access Pack', unitPrice: 3000 },
  { name: 'Data Migration', unitPrice: 4200 },
]
