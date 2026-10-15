import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LOST_REASONS } from '@/lib/constants'

interface LossReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dealTitle: string
  onConfirm: (reason: string) => void
}

export function LossReasonDialog({ open, onOpenChange, dealTitle, onConfirm }: LossReasonDialogProps) {
  const [reason, setReason] = useState<string>(LOST_REASONS[0])
  const [custom, setCustom] = useState('')

  const finalReason = reason === 'Other' ? custom.trim() || 'Other' : reason

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark deal as lost</DialogTitle>
          <DialogDescription>
            Tell us why "{dealTitle}" was lost. This helps improve future forecasting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Loss reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOST_REASONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reason === 'Other' ? (
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                placeholder="Add context…"
                rows={3}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(finalReason)
              onOpenChange(false)
            }}
          >
            Mark as lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
