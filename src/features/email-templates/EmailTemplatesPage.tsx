import {
  Copy,
  FileText,
  Mail,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTemplate, deleteTemplate, updateTemplate, useTemplates } from '@/repository'
import type { EmailTemplate } from '@/types/models'

const MERGE_FIELDS = [
  { token: '{{firstName}}', label: 'First name' },
  { token: '{{lastName}}', label: 'Last name' },
  { token: '{{company}}', label: 'Company' },
  { token: '{{title}}', label: 'Job title' },
  { token: '{{email}}', label: 'Email' },
]

const BLANK = { name: '', subject: '', body: '' }

export function EmailTemplatesPage() {
  const templates = useTemplates()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState(BLANK)
  const [isNew, setIsNew] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null)

  const selected = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [templates, selectedId],
  )

  useEffect(() => {
    if (selected) {
      setDraft({ name: selected.name, subject: selected.subject, body: selected.body })
      setIsNew(false)
      setDirty(false)
    }
  }, [selected])

  const startNew = () => {
    setSelectedId(null)
    setDraft(BLANK)
    setIsNew(true)
    setDirty(false)
  }

  const save = () => {
    if (!draft.name.trim()) {
      toast.error('Give the template a name')
      return
    }
    if (isNew || !selected) {
      const created = createTemplate(draft)
      setSelectedId(created.id)
      setIsNew(false)
      toast.success('Template created')
    } else {
      updateTemplate(selected.id, draft)
      toast.success('Template saved')
    }
    setDirty(false)
  }

  const duplicate = (template: EmailTemplate) => {
    const created = createTemplate({
      name: `${template.name} (copy)`,
      subject: template.subject,
      body: template.body,
    })
    setSelectedId(created.id)
    toast.success('Template duplicated')
  }

  const insertField = (token: string) => {
    setDraft((current) => ({ ...current, body: `${current.body}${token}` }))
    setDirty(true)
  }

  const preview = draft.body
    .replace(/\{\{firstName\}\}/g, 'Alex')
    .replace(/\{\{lastName\}\}/g, 'Morgan')
    .replace(/\{\{company\}\}/g, 'Northwind Co.')
    .replace(/\{\{title\}\}/g, 'VP Sales')
    .replace(/\{\{email\}\}/g, 'alex@northwind.co')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email templates"
        description="Reusable messages with merge fields"
        actions={
          <Button onClick={startNew}>
            <Plus />
            New template
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {templates.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No templates"
              description="Create a template to speed up your outreach."
              action={
                <Button onClick={startNew}>
                  <Plus />
                  New template
                </Button>
              }
              className="bg-card"
            />
          ) : (
            templates.map((template) => {
              const active = template.id === selectedId
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedId(template.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                    active ? 'border-primary/40 bg-primary/5' : 'bg-card hover:bg-accent/50'
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{template.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{template.subject}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {selected || isNew ? (
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {isNew ? 'New template' : 'Edit template'}
              </h2>
              <div className="flex items-center gap-2">
                {!isNew && selected ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => duplicate(selected)}>
                      <Copy />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(selected)}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </>
                ) : null}
                <Button size="sm" onClick={save} disabled={!dirty && !isNew}>
                  {isNew ? 'Create' : 'Save'}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">Name</Label>
                <Input
                  id="tpl-name"
                  value={draft.name}
                  onChange={(event) => {
                    setDraft((c) => ({ ...c, name: event.target.value }))
                    setDirty(true)
                  }}
                  placeholder="e.g. Intro outreach"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-subject">Subject</Label>
                <Input
                  id="tpl-subject"
                  value={draft.subject}
                  onChange={(event) => {
                    setDraft((c) => ({ ...c, subject: event.target.value }))
                    setDirty(true)
                  }}
                  placeholder="Subject line"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Insert merge field:</span>
                {MERGE_FIELDS.map((field) => (
                  <button
                    key={field.token}
                    type="button"
                    onClick={() => insertField(field.token)}
                    className="rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
                  >
                    {field.label}
                  </button>
                ))}
              </div>
              <Textarea
                rows={10}
                value={draft.body}
                onChange={(event) => {
                  setDraft((c) => ({ ...c, body: event.target.value }))
                  setDirty(true)
                }}
                placeholder="Write your message…"
                className="font-mono text-sm"
              />
            </div>

            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5" />
                Preview
              </p>
              <p className="text-sm font-medium">{draft.subject || 'No subject'}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{preview || 'No body'}</p>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  const text = `${draft.subject}\n\n${preview}`
                  navigator.clipboard?.writeText(text)
                  toast.success('Copied template to clipboard')
                }}
              >
                <Send />
                Copy to clipboard
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-10">
            <EmptyState
              icon={Mail}
              title="Select a template"
              description="Choose a template from the list or create a new one."
              className="border-0"
            />
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete this template?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteTemplate(deleteTarget.id)
            if (deleteTarget.id === selectedId) {
              setSelectedId(null)
              setDraft(BLANK)
              setIsNew(false)
            }
            toast.success('Template deleted')
          }
        }}
      />
    </div>
  )
}
