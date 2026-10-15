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
import {
  createTask,
  updateTask,
  useCompanies,
  useContacts,
  useCurrentUser,
  useDeals,
  useLeads,
  useUsers,
} from '@/repository'
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, type RelatedType } from '@/types/enums'
import type { Task } from '@/types/models'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(140, 'Keep it under 140 characters'),
  description: z.string().max(1000).optional(),
  dueDate: z.string().min(1, 'Pick a due date'),
  priority: z.enum(['low', 'medium', 'high']),
  assignedToId: z.string().min(1, 'Select an owner'),
  relatedType: z.enum(['none', 'contact', 'company', 'deal', 'lead']),
  relatedId: z.string(),
})

type FormValues = z.infer<typeof schema>

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  defaultRelated?: { type: RelatedType; id: string } | null
}

function toLocalInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export function TaskFormDialog({ open, onOpenChange, task, defaultRelated }: TaskFormDialogProps) {
  const users = useUsers()
  const contacts = useContacts()
  const companies = useCompanies()
  const deals = useDeals()
  const leads = useLeads()
  const currentUser = useCurrentUser()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: toLocalInput(new Date()),
      priority: 'medium',
      assignedToId: currentUser?.id ?? '',
      relatedType: defaultRelated?.type ?? 'none',
      relatedId: defaultRelated?.id ?? '',
    },
  })

  const relatedType = form.watch('relatedType')

  useEffect(() => {
    if (!open) return
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        dueDate: toLocalInput(new Date(task.dueDate)),
        priority: task.priority,
        assignedToId: task.assignedToId,
        relatedType: task.relatedType ?? 'none',
        relatedId: task.relatedId ?? '',
      })
    } else {
      form.reset({
        title: '',
        description: '',
        dueDate: toLocalInput(new Date()),
        priority: 'medium',
        assignedToId: currentUser?.id ?? '',
        relatedType: defaultRelated?.type ?? 'none',
        relatedId: defaultRelated?.id ?? '',
      })
    }
  }, [open, task, defaultRelated, currentUser, form])

  const onSubmit = (values: FormValues) => {
    const related =
      values.relatedType === 'none'
        ? { relatedType: null, relatedId: null }
        : { relatedType: values.relatedType as RelatedType, relatedId: values.relatedId || null }

    if (task) {
      updateTask(task.id, {
        title: values.title,
        description: values.description ?? '',
        dueDate: new Date(values.dueDate).toISOString(),
        priority: values.priority,
        assignedToId: values.assignedToId,
        ...related,
      })
      toast.success('Task updated')
    } else {
      createTask({
        title: values.title,
        description: values.description ?? '',
        dueDate: new Date(values.dueDate).toISOString(),
        priority: values.priority,
        assignedToId: values.assignedToId,
        ...related,
      })
      toast.success('Task created')
    }
    onOpenChange(false)
  }

  const relatedOptions = getRelatedOptions(relatedType, { contacts, companies, deals, leads })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the details of this task.' : 'Create a task and link it to a record.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Follow up on proposal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add context…" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITIES.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {TASK_PRIORITY_LABELS[priority]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="relatedType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue('relatedId', '')
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No link</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="deal">Deal</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {relatedType !== 'none' ? (
                <FormField
                  control={form.control}
                  name="relatedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select record" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {relatedOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                {task ? 'Save changes' : 'Create task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function getRelatedOptions(
  type: FormValues['relatedType'],
  data: {
    contacts: { id: string; firstName: string; lastName: string }[]
    companies: { id: string; name: string }[]
    deals: { id: string; title: string }[]
    leads: { id: string; firstName: string; lastName: string }[]
  },
): { id: string; label: string }[] {
  switch (type) {
    case 'contact':
      return data.contacts.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }))
    case 'company':
      return data.companies.map((c) => ({ id: c.id, label: c.name }))
    case 'deal':
      return data.deals.map((d) => ({ id: d.id, label: d.title }))
    case 'lead':
      return data.leads.map((l) => ({ id: l.id, label: `${l.firstName} ${l.lastName}` }))
    default:
      return []
  }
}
