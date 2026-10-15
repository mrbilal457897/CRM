import { ArrowRight, Building2, Sparkles, UserPlus, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { convertLead } from '@/repository'
import type { Lead } from '@/types/models'

interface ConvertLeadDialogProps {
  lead: Lead | null
  onOpenChange: (open: boolean) => void
}

export function ConvertLeadDialog({ lead, onOpenChange }: ConvertLeadDialogProps) {
  const navigate = useNavigate()

  const onConvert = () => {
    if (!lead) return
    const result = convertLead(lead.id)
    if (!result) {
      toast.error('This lead has already been converted')
      onOpenChange(false)
      return
    }
    toast.success('Lead converted to contact, company and deal', {
      action: {
        label: 'View contact',
        onClick: () => navigate(`/contacts/${result.contact.id}`),
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={Boolean(lead)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Convert lead
          </DialogTitle>
          <DialogDescription>
            This will create a contact, a company (if it doesn&apos;t exist) and a deal, then link them
            together.
          </DialogDescription>
        </DialogHeader>

        {lead ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
              <Avatar name={`${lead.firstName} ${lead.lastName}`} size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {lead.firstName} {lead.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserPlus className="size-4" />
                Contact
              </span>
              <ArrowRight className="size-4" />
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" />
                {lead.companyName || 'New company'}
              </span>
              <ArrowRight className="size-4" />
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="size-4" />
                Deal
              </span>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConvert}>
            <Sparkles />
            Convert lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
