import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DatePicker } from '@/components/common/DatePicker'
import { FormDrawer } from '@/components/common/FormDrawer'
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
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/format'
import { PRODUCT_CATALOG } from '@/lib/constants'
import { uid } from '@/lib/id'
import {
  createDeal,
  updateDeal,
  useCompanies,
  useContacts,
  useCurrentUser,
  useSettings,
  useSortedStages,
  useSources,
  useUsers,
} from '@/repository'
import type { Deal, LineItem } from '@/types/models'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(160, 'Keep it under 160 characters'),
  companyId: z.string(),
  contactId: z.string(),
  ownerId: z.string().min(1, 'Select an owner'),
  stageId: z.string().min(1, 'Select a stage'),
  source: z.string(),
  expectedCloseDate: z.date({ message: 'Pick an expected close date' }),
  manualValue: z.number().min(0),
})

type FormValues = z.infer<typeof schema>

interface DealFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal?: Deal | null
}

function emptyItem(): LineItem {
  return { id: uid('item'), productName: '', quantity: 1, unitPrice: 0, discount: 0 }
}

export function DealFormDrawer({ open, onOpenChange, deal }: DealFormDrawerProps) {
  const companies = useCompanies()
  const contacts = useContacts()
  const users = useUsers()
  const stages = useSortedStages()
  const sources = useSources()
  const settings = useSettings()
  const currentUser = useCurrentUser()

  const [items, setItems] = useState<LineItem[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      companyId: '',
      contactId: '',
      ownerId: currentUser?.id ?? '',
      stageId: stages[0]?.id ?? '',
      source: '',
      expectedCloseDate: new Date(),
      manualValue: 0,
    },
  })

  const companyId = form.watch('companyId')

  const contactOptions = useMemo(
    () => (companyId ? contacts.filter((c) => c.companyId === companyId) : contacts),
    [contacts, companyId],
  )

  useEffect(() => {
    if (!open) return
    if (deal) {
      form.reset({
        title: deal.title,
        companyId: deal.companyId ?? '',
        contactId: deal.contactId ?? '',
        ownerId: deal.ownerId,
        stageId: deal.stageId,
        source: deal.source,
        expectedCloseDate: new Date(deal.expectedCloseDate),
        manualValue: deal.value,
      })
      setItems(deal.items)
    } else {
      form.reset({
        title: '',
        companyId: '',
        contactId: '',
        ownerId: currentUser?.id ?? '',
        stageId: stages[0]?.id ?? '',
        source: '',
        expectedCloseDate: new Date(Date.now() + 30 * 86400000),
        manualValue: 0,
      })
      setItems([])
    }
  }, [open, deal, currentUser, stages, form])

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100),
    0,
  )
  const hasItems = items.length > 0

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const onSubmit = (values: FormValues) => {
    const value = hasItems ? Math.round(itemsTotal) : Math.round(values.manualValue)
    const payload = {
      title: values.title,
      value,
      stageId: values.stageId,
      probability: stages.find((s) => s.id === values.stageId)?.probability ?? 0,
      ownerId: values.ownerId,
      companyId: values.companyId || null,
      contactId: values.contactId || null,
      expectedCloseDate: values.expectedCloseDate.toISOString(),
      source: values.source,
      items,
    }

    if (deal) {
      updateDeal(deal.id, payload)
      toast.success('Deal updated')
    } else {
      const stage = stages.find((s) => s.id === values.stageId)
      createDeal({
        ...payload,
        lostReason: null,
        closedAt: null,
        lastActivityAt: null,
        stageHistory: stage
          ? [
              {
                id: uid('sc'),
                stageId: stage.id,
                stageName: stage.name,
                fromName: null,
                toName: stage.name,
                userId: values.ownerId,
                at: new Date().toISOString(),
              },
            ]
          : [],
      })
      toast.success('Deal created')
    }
    onOpenChange(false)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={deal ? 'Edit deal' : 'New deal'}
      description={deal ? 'Update the details of this opportunity.' : 'Add a new opportunity to your pipeline.'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="deal-form">
            {deal ? 'Save changes' : 'Create deal'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form id="deal-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deal title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Enterprise Platform Rollout" {...field} />
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
                    onValueChange={(value) => {
                      field.onChange(value === 'none' ? '' : value)
                      form.setValue('contactId', '')
                    }}
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
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary contact</FormLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No contact</SelectItem>
                      {contactOptions.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
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
              name="stageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
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
              name="expectedCloseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected close date</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
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
                  <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
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

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Line items</p>
                <p className="text-xs text-muted-foreground">
                  Optional — when empty the manual value is used.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems((current) => [...current, emptyItem()])}
              >
                <Plus />
                Add item
              </Button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 items-end gap-2 rounded-xl border p-3">
                <div className="col-span-12 sm:col-span-5">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Product</label>
                  <Input
                    list="product-catalog"
                    value={item.productName}
                    onChange={(event) => updateItem(item.id, { productName: event.target.value })}
                    placeholder="Product or service"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Qty</label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.id, { quantity: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Price</label>
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(event) =>
                      updateItem(item.id, { unitPrice: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Disc %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={item.discount}
                    onChange={(event) =>
                      updateItem(item.id, { discount: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setItems((current) => current.filter((i) => i.id !== item.id))}
                    aria-label="Remove item"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}

            <datalist id="product-catalog">
              {PRODUCT_CATALOG.map((product) => (
                <option key={product.name} value={product.name} />
              ))}
            </datalist>

            {hasItems ? (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Calculated total</span>
                <span className="numeric font-semibold">
                  {formatCurrency(itemsTotal, settings.currency)}
                </span>
              </div>
            ) : (
              <Controller
                control={form.control}
                name="manualValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </form>
      </Form>
    </FormDrawer>
  )
}
