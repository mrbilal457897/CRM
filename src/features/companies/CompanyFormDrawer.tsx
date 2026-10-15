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
import { Textarea } from '@/components/ui/textarea'
import { createCompany, updateCompany, useCurrentUser, useUsers } from '@/repository'
import { COMPANY_SIZES, INDUSTRIES } from '@/types/enums'
import type { Company } from '@/types/models'

const schema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1),
  size: z.string().min(1),
  website: z.string(),
  location: z.string(),
  phone: z.string(),
  description: z.string(),
  ownerId: z.string().min(1, 'Select an owner'),
  tags: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface CompanyFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company | null
}

export function CompanyFormDrawer({ open, onOpenChange, company }: CompanyFormDrawerProps) {
  const users = useUsers()
  const currentUser = useCurrentUser()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      industry: INDUSTRIES[0],
      size: COMPANY_SIZES[0],
      website: '',
      location: '',
      phone: '',
      description: '',
      ownerId: currentUser?.id ?? '',
      tags: [],
    },
  })

  useEffect(() => {
    if (!open) return
    if (company) {
      form.reset({
        name: company.name,
        industry: company.industry,
        size: company.size,
        website: company.website,
        location: company.location,
        phone: company.phone,
        description: company.description,
        ownerId: company.ownerId,
        tags: company.tags,
      })
    } else {
      form.reset({
        name: '',
        industry: INDUSTRIES[0],
        size: COMPANY_SIZES[0],
        website: '',
        location: '',
        phone: '',
        description: '',
        ownerId: currentUser?.id ?? '',
        tags: [],
      })
    }
  }, [open, company, currentUser, form])

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      industry: values.industry as Company['industry'],
      size: values.size as Company['size'],
    }
    if (company) {
      updateCompany(company.id, payload)
      toast.success('Company updated')
    } else {
      createCompany(payload)
      toast.success('Company created')
    }
    onOpenChange(false)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={company ? 'Edit company' : 'New company'}
      description={company ? 'Update company details.' : 'Add a new account to your CRM.'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="company-form">
            {company ? 'Save changes' : 'Create company'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form id="company-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
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
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company size</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size} employees
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
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Notes about this account…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
