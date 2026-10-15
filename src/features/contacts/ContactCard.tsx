import { Building2, Mail, MapPin } from 'lucide-react'

import { Avatar } from '@/components/common/Avatar'
import { ContactStatusBadge } from '@/components/common/StatusBadge'
import { TagChip } from '@/components/common/TagChip'
import type { Company, Contact } from '@/types/models'

interface ContactCardProps {
  contact: Contact
  company?: Company
}

export function ContactCard({ contact, company }: ContactCardProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex items-start gap-3">
        <Avatar
          name={`${contact.firstName} ${contact.lastName}`}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {contact.firstName} {contact.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{contact.title || '—'}</p>
        </div>
        <ContactStatusBadge status={contact.status} />
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {company ? (
          <p className="flex items-center gap-1.5">
            <Building2 className="size-3.5" />
            <span className="truncate">{company.name}</span>
          </p>
        ) : null}
        <p className="flex items-center gap-1.5">
          <Mail className="size-3.5" />
          <span className="truncate">{contact.email}</span>
        </p>
        {contact.location ? (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            <span className="truncate">{contact.location}</span>
          </p>
        ) : null}
      </div>

      {contact.tags.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-1.5">
          {contact.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
