import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { FormDrawer } from '@/components/common/FormDrawer'
import { TagPicker } from '@/components/common/TagPicker'
import { Button } from '@/components/ui/button'
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
import { createContact, updateContact, useCompanies, useCurrentUser, useSources, useUsers } from '@/repository'
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS } from '@/types/enums'
import type { Contact } from '@/types/models'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string(),
  title: z.string(),
  companyId: z.string(),
  ownerId: z.string().min(1, 'Select an owner'),
  status: z.enum(['active', 'prospect', 'customer', 'inactive', 'churned']),
  source: z.string(),
  score: z.number().min(0).max(100),
  location: z.string(),
  tags: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface ContactFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact | null
}

export function ContactFormDrawer({ open, onOpenChange, contact }: ContactFormDrawerProps) {
  const companies = useCompanies()
  const users = useUsers()
  const sources = useSources()
  const currentUser = useCurrentUser()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      companyId: '',
      ownerId: currentUser?.id ?? '',
      status: 'active',
      source: '',
      score: 50,
      location: '',
      tags: [],
    },
  })

  useEffect(() => {
    if (!open) return
    if (contact) {
      form.reset({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        companyId: contact.companyId ?? '',
        ownerId: contact.ownerId,
        status: contact.status,
        source: contact.source,
        score: contact.score,
        location: contact.location,
        tags: contact.tags,
      })
    } else {
      form.reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        companyId: '',
        ownerId: currentUser?.id ?? '',
        status: 'active',
        source: '',
        score: 50,
        location: '',
        tags: [],
      })
    }
  }, [open, contact, currentUser, form])

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      companyId: values.companyId || null,
    }
    if (contact) {
      updateContact(contact.id, payload)
      toast.success('Contact updated')
    } else {
      createContact({ ...payload, lastContactedAt: null })
      toast.success('Contact created')
    }
    onOpenChange(false)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={contact ? 'Edit contact' : 'New contact'}
      description={contact ? 'Update contact details.' : 'Add a new person to your CRM.'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="contact-form">
            {contact ? 'Save changes' : 'Create contact'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form id="contact-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. VP Sales" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No company</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
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
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTACT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {CONTACT_STATUS_LABELS[status]}
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
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No source</SelectItem>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score (0–100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagPicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDrawer>
  )
}
