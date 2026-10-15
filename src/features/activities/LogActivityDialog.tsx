import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { logActivity } from '@/repository'
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, type ActivityType } from '@/types/enums'

const schema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note']),
  subject: z.string().min(1, 'Subject is required').max(120, 'Keep it under 120 characters'),
  body: z.string().max(2000).optional(),
  occurredAt: z.string().min(1, 'Pick a date and time'),
})

type FormValues = z.infer<typeof schema>

interface LogActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: ActivityType
  contactId?: string | null
  companyId?: string | null
  dealId?: string | null
  leadId?: string | null
  contactName?: string
}

function toLocalInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export function LogActivityDialog({
  open,
  onOpenChange,
  defaultType = 'call',
  contactId = null,
  companyId = null,
  dealId = null,
  leadId = null,
  contactName,
}: LogActivityDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      subject: '',
      body: '',
      occurredAt: toLocalInput(new Date()),
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        type: defaultType,
        subject: '',
        body: '',
        occurredAt: toLocalInput(new Date()),
      })
    }
  }, [open, defaultType, form])

  const onSubmit = (values: FormValues) => {
    logActivity({
      type: values.type,
      subject: values.subject,
      body: values.body ?? '',
      contactId,
      companyId,
      dealId,
      leadId,
      occurredAt: new Date(values.occurredAt).toISOString(),
    })
    toast.success(`${ACTIVITY_TYPE_LABELS[values.type]} logged`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
          <DialogDescription>
            {contactName ? `Record an interaction with ${contactName}.` : 'Record an interaction.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {ACTIVITY_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="occurredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date &amp; time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Discovery call" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What happened?" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                Log activity
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
