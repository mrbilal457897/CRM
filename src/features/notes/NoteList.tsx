import { Pin, StickyNote, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { createNote, deleteNote, updateNote, useCurrentUser, useNotes, useUserNameMap } from '@/repository'

interface NoteListProps {
  contactId?: string | null
  companyId?: string | null
  dealId?: string | null
  leadId?: string | null
  className?: string
}

export function NoteList({ contactId, companyId, dealId, leadId, className }: NoteListProps) {
  const notes = useNotes()
  const users = useUserNameMap()
  const currentUser = useCurrentUser()
  const [value, setValue] = useState('')

  const filtered = notes
    .filter((note) => {
      if (contactId && note.contactId === contactId) return true
      if (companyId && note.companyId === companyId) return true
      if (dealId && note.dealId === dealId) return true
      if (leadId && note.leadId === leadId) return true
      return false
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const handleAdd = () => {
    if (!value.trim()) return
    createNote({
      body: value.trim(),
      contactId: contactId ?? null,
      companyId: companyId ?? null,
      dealId: dealId ?? null,
      leadId: leadId ?? null,
      pinned: false,
    })
    setValue('')
    toast.success('Note added')
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border p-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Write a note…"
          rows={3}
          className="border-0 px-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {currentUser ? `Adding as ${currentUser.name}` : ''}
          </span>
          <Button size="sm" onClick={handleAdd} disabled={!value.trim()}>
            Add note
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Notes you add will appear here and on the timeline."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((note) => {
            const author = users[note.authorId]
            return (
              <li key={note.id} className="group rounded-xl border p-3.5">
                <div className="flex items-start gap-3">
                  {author ? <Avatar name={author.name} color={author.avatarColor} size="sm" /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{author?.name ?? 'Unknown'}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatRelative(note.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {note.body}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                    onClick={() => updateNote(note.id, { pinned: !note.pinned })}
                    className={note.pinned ? 'text-primary' : undefined}
                  >
                    <Pin className={note.pinned ? 'fill-current' : undefined} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete note"
                    onClick={() => {
                      deleteNote(note.id)
                      toast.success('Note deleted')
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
