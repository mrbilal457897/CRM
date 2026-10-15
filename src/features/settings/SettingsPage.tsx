import {
  ArrowDown,
  ArrowUp,
  Bell,
  Building2,
  Check,
  Database,
  Layers,
  Monitor,
  Moon,
  Palette,
  Plus,
  RotateCcw,
  Sun,
  Tags as TagsIcon,
  Trash2,
  Upload,
  User as UserIcon,
  Users as UsersIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar } from '@/components/common/Avatar'
import { ColorPicker } from '@/components/common/ColorPicker'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { TagChip } from '@/components/common/TagChip'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CURRENCIES } from '@/lib/constants'
import { formatDate, formatRelative } from '@/lib/format'
import { useTheme } from '@/app/theme'
import { UserFormDialog } from '@/features/settings/UserFormDialog'
import {
  clearNotifications,
  createSource,
  createStage,
  createTag,
  deleteSource,
  deleteStage,
  deleteTag,
  deleteUser,
  markAllNotificationsRead,
  markNotificationRead,
  resetDemoData,
  reorderStages,
  updateStage,
  updateTag,
  updateSettings,
  updateUser,
  useCurrentUser,
  useNotifications,
  usePermissions,
  useSettings,
  useSources,
  useSortedStages,
  useTags,
  useUsers,
} from '@/repository'
import { TAG_COLORS } from '@/lib/colors'
import { ROLE_LABELS } from '@/types/enums'
import type { Stage, Tag, User } from '@/types/models'

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserIcon, adminOnly: false },
  { id: 'workspace', label: 'Workspace', icon: Building2, adminOnly: true },
  { id: 'pipeline', label: 'Pipeline', icon: Layers, adminOnly: true },
  { id: 'tags', label: 'Tags', icon: TagsIcon, adminOnly: true },
  { id: 'sources', label: 'Sources', icon: Upload, adminOnly: true },
  { id: 'users', label: 'Users', icon: UsersIcon, adminOnly: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: false },
  { id: 'appearance', label: 'Appearance', icon: Palette, adminOnly: false },
  { id: 'data', label: 'Data', icon: Database, adminOnly: true },
]

export function SettingsPage() {
  const { tab } = useParams<{ tab: string }>()
  const permissions = usePermissions()

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0]
  if (activeTab.adminOnly && !permissions.canManageUsers) {
    return <Navigate to="/settings/profile" replace />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your workspace and preferences" />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-56 lg:flex-col">
          {TABS.filter((item) => !item.adminOnly || permissions.canManageUsers).map((item) => {
            const Icon = item.icon
            const active = item.id === activeTab.id
            return (
              <Link
                key={item.id}
                to={`/settings/${item.id}`}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1">
          {activeTab.id === 'profile' ? <ProfileSection /> : null}
          {activeTab.id === 'workspace' ? <WorkspaceSection /> : null}
          {activeTab.id === 'pipeline' ? <PipelineSection /> : null}
          {activeTab.id === 'tags' ? <TagsSection /> : null}
          {activeTab.id === 'sources' ? <SourcesSection /> : null}
          {activeTab.id === 'users' ? <UsersSection /> : null}
          {activeTab.id === 'notifications' ? <NotificationsSection /> : null}
          {activeTab.id === 'appearance' ? <AppearanceSection /> : null}
          {activeTab.id === 'data' ? <DataSection /> : null}
        </div>
      </div>
    </div>
  )
}

function ProfileSection() {
  const user = useCurrentUser()
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [title, setTitle] = useState(user?.title ?? '')

  if (!user) return null

  return (
    <Card className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} color={user.avatarColor} size="xl" />
        <div>
          <h2 className="text-lg font-semibold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Job title</Label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={user.email} disabled />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          onClick={() => {
            updateUser(user.id, { name, title })
            toast.success('Profile updated')
          }}
        >
          <Check />
          Save changes
        </Button>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          Manage account
        </Button>
      </div>

      <UserFormDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
    </Card>
  )
}

function WorkspaceSection() {
  const settings = useSettings()
  const [companyName, setCompanyName] = useState(settings.companyName)
  const [currency, setCurrency] = useState(settings.currency)

  return (
    <Card className="space-y-6 p-6">
      <div>
        <h2 className="text-sm font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">General settings for your organisation.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Company name</Label>
        <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Default currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.code} · {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => {
            updateSettings({ companyName, currency })
            toast.success('Workspace updated')
          }}
        >
          <Check />
          Save
        </Button>
      </div>
    </Card>
  )
}

function PipelineSection() {
  const stages = useSortedStages()
  const [newName, setNewName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Stage | null>(null)

  const move = (index: number, direction: -1 | 1) => {
    const next = [...stages]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderStages(next)
  }

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-sm font-semibold">Pipeline stages</h2>
        <p className="text-sm text-muted-foreground">Order and configure your deal stages.</p>
      </div>

      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
            <ColorPicker
              color={stage.color}
              onChange={(color) => updateStage(stage.id, { color })}
            />
            <Input
              value={stage.name}
              onChange={(event) => updateStage(stage.id, { name: event.target.value })}
              className="h-9 w-40"
            />
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Prob %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={stage.probability}
                onChange={(event) => updateStage(stage.id, { probability: Number(event.target.value) })}
                className="h-9 w-20"
              />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5">
                <Switch
                  checked={stage.isWon}
                  onCheckedChange={(checked) => updateStage(stage.id, { isWon: checked, isLost: false })}
                />
                Won
              </label>
              <label className="flex items-center gap-1.5">
                <Switch
                  checked={stage.isLost}
                  onCheckedChange={(checked) => updateStage(stage.id, { isLost: checked, isWon: false })}
                />
                Lost
              </label>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => move(index, 1)}
                disabled={index === stages.length - 1}
                aria-label="Move down"
              >
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                onClick={() => setDeleteTarget(stage)}
                aria-label="Delete stage"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>Add stage</Label>
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Stage name"
          />
        </div>
        <Button
          onClick={() => {
            if (!newName.trim()) return
            createStage({
              name: newName.trim(),
              color: '#6366f1',
              probability: 50,
              isWon: false,
              isLost: false,
            })
            setNewName('')
            toast.success('Stage added')
          }}
        >
          <Plus />
          Add
        </Button>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title={`Delete the "${deleteTarget?.name}" stage?`}
        description="Deals in this stage will keep their data but may need reassignment."
        confirmLabel="Delete stage"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteStage(deleteTarget.id)
            toast.success('Stage deleted')
          }
        }}
      />
    </Card>
  )
}

function TagsSection() {
  const tags = useTags()
  const [name, setName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-sm font-semibold">Tags</h2>
        <p className="text-sm text-muted-foreground">Categorise records with coloured tags.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 rounded-full border px-3 py-1.5">
            <TagChip label={tag.name} color={tag.color} />
            <ColorPicker color={tag.color} onChange={(color) => updateTag(tag.id, { color })} />
            <button
              type="button"
              onClick={() => setDeleteTarget(tag)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Delete ${tag.name}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>New tag</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tag name" />
        </div>
        <Button
          onClick={() => {
            if (!name.trim()) return
            createTag(name.trim(), TAG_COLORS[tags.length % TAG_COLORS.length])
            setName('')
            toast.success('Tag created')
          }}
        >
          <Plus />
          Add
        </Button>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title={`Delete the "${deleteTarget?.name}" tag?`}
        description="This removes the tag from all records."
        confirmLabel="Delete tag"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteTag(deleteTarget.id)
            toast.success('Tag deleted')
          }
        }}
      />
    </Card>
  )
}

function SourcesSection() {
  const sources = useSources()
  const [name, setName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-sm font-semibold">Lead sources</h2>
        <p className="text-sm text-muted-foreground">Where your leads come from.</p>
      </div>
      <ul className="divide-y">
        {sources.map((source) => (
          <li key={source.id} className="flex items-center justify-between py-2.5">
            <span className="text-sm">{source.name}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              onClick={() => setDeleteTarget(source.id)}
              aria-label={`Delete ${source.name}`}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>New source</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Webinar" />
        </div>
        <Button
          onClick={() => {
            if (!name.trim()) return
            createSource(name.trim())
            setName('')
            toast.success('Source added')
          }}
        >
          <Plus />
          Add
        </Button>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete this source?"
        description="Existing records keep their value."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteSource(deleteTarget)
            toast.success('Source deleted')
          }
        }}
      />
    </Card>
  )
}

function UsersSection() {
  const users = useUsers()
  const currentUser = useCurrentUser()
  const [editing, setEditing] = useState<User | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Team members</h2>
          <p className="text-sm text-muted-foreground">{users.length} users in your workspace.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Invite user
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
              <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Email</th>
              <th className="px-3 py-2 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Avatar name={user.name} color={user.avatarColor} size="xs" />
                    <span className="font-medium">{user.name}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{ROLE_LABELS[user.role]}</td>
                <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">{user.email}</td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(user)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => setDeleteTarget(user)}
                    disabled={user.id === currentUser?.id}
                    aria-label="Delete user"
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <UserFormDialog
        open={Boolean(editing)}
        onOpenChange={(next) => !next && setEditing(null)}
        user={editing}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.name}?`}
        description="They will lose access to the workspace. Their records remain."
        confirmLabel="Remove user"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteUser(deleteTarget.id)
            toast.success('User removed')
          }
        }}
      />
    </Card>
  )
}

function NotificationsSection() {
  const notifications = useNotifications()
  const currentUser = useCurrentUser()

  const mine = notifications.filter((item) => item.userId === currentUser?.id)

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">{mine.filter((n) => !n.read).length} unread</p>
        </div>
        {currentUser ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => markAllNotificationsRead(currentUser.id)}>
              Mark all read
            </Button>
            <Button variant="outline" size="sm" onClick={() => clearNotifications(currentUser.id)}>
              Clear all
            </Button>
          </div>
        ) : null}
      </div>

      {mine.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." className="border-0" />
      ) : (
        <ul className="space-y-2">
          {mine.map((item) => (
            <li
              key={item.id}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                item.read ? '' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDate(item.createdAt)} · {formatRelative(item.createdAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markNotificationRead(item.id, !item.read)}
              >
                {item.read ? 'Unread' : 'Read'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-sm font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">Choose how the app looks.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon
          const active = theme === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-colors ${
                active ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent'
              }`}
            >
              <Icon className="size-6" />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function DataSection() {
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Data management</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Import, export or reset your data from the Import / Export workspace.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link to="/import-export">
            <Upload />
            Go to Import / Export
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setConfirmReset(true)}>
          <RotateCcw />
          Reset demo data
        </Button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset to demo data?"
        description="Your current data will be replaced with the seeded demo dataset."
        confirmLabel="Reset data"
        destructive
        onConfirm={() => {
          resetDemoData()
          toast.success('Demo data restored')
        }}
      />
    </Card>
  )
}
