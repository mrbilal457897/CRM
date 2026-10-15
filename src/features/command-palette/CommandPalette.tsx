import {
  Building2,
  Calendar,
  CheckSquare,
  KanbanSquare,
  LayoutDashboard,
  Mail,
  Moon,
  Plus,
  Sun,
  UserPlus,
  Users,
} from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'

import { useTheme } from '@/app/theme'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  useCompanies,
  useContacts,
  useDeals,
  useLeads,
  useTasks,
} from '@/repository'
import { useUiStore } from '@/store/ui'

export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen)
  const setOpen = useUiStore((state) => state.setCommandOpen)
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()

  const contacts = useContacts()
  const companies = useCompanies()
  const deals = useDeals()
  const leads = useLeads()
  const tasks = useTasks()

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, setOpen])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem value="new contact create add" onSelect={() => go('/contacts?new=1')}>
            <Plus />
            New contact
          </CommandItem>
          <CommandItem value="new deal create add" onSelect={() => go('/deals?new=1')}>
            <Plus />
            New deal
          </CommandItem>
          <CommandItem value="new lead create add" onSelect={() => go('/leads?new=1')}>
            <Plus />
            New lead
          </CommandItem>
          <CommandItem value="new company create add" onSelect={() => go('/companies?new=1')}>
            <Plus />
            New company
          </CommandItem>
          <CommandItem value="new task create add" onSelect={() => go('/tasks?new=1')}>
            <Plus />
            New task
          </CommandItem>
          <CommandItem
            value="toggle theme dark light mode"
            onSelect={() => {
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              setOpen(false)
            }}
          >
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
            Toggle {resolvedTheme === 'dark' ? 'light' : 'dark'} mode
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          <CommandItem value="dashboard home overview" onSelect={() => go('/')}>
            <LayoutDashboard />
            Dashboard
          </CommandItem>
          <CommandItem value="deals pipeline board" onSelect={() => go('/deals')}>
            <KanbanSquare />
            Deals
          </CommandItem>
          <CommandItem value="leads" onSelect={() => go('/leads')}>
            <UserPlus />
            Leads
          </CommandItem>
          <CommandItem value="contacts" onSelect={() => go('/contacts')}>
            <Users />
            Contacts
          </CommandItem>
          <CommandItem value="companies" onSelect={() => go('/companies')}>
            <Building2 />
            Companies
          </CommandItem>
          <CommandItem value="tasks" onSelect={() => go('/tasks')}>
            <CheckSquare />
            Tasks
          </CommandItem>
          <CommandItem value="calendar meetings schedule" onSelect={() => go('/calendar')}>
            <Calendar />
            Calendar
          </CommandItem>
          <CommandItem value="email templates" onSelect={() => go('/email-templates')}>
            <Mail />
            Email templates
          </CommandItem>
        </CommandGroup>

        {contacts.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contacts">
              {contacts.slice(0, 6).map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`contact ${contact.firstName} ${contact.lastName} ${contact.email}`}
                  onSelect={() => go(`/contacts/${contact.id}`)}
                >
                  <Users />
                  <span>{contact.firstName} {contact.lastName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{contact.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {companies.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Companies">
              {companies.slice(0, 5).map((company) => (
                <CommandItem
                  key={company.id}
                  value={`company ${company.name} ${company.industry}`}
                  onSelect={() => go(`/companies/${company.id}`)}
                >
                  <Building2 />
                  <span>{company.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{company.industry}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {deals.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Deals">
              {deals.slice(0, 6).map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={`deal ${deal.title}`}
                  onSelect={() => go(`/deals?deal=${deal.id}`)}
                >
                  <KanbanSquare />
                  <span className="truncate">{deal.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {leads.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Leads">
              {leads.slice(0, 5).map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`lead ${lead.firstName} ${lead.lastName} ${lead.companyName}`}
                  onSelect={() => go(`/leads?id=${lead.id}`)}
                >
                  <UserPlus />
                  <span>{lead.firstName} {lead.lastName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{lead.companyName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {tasks.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {tasks.slice(0, 5).map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task ${task.title}`}
                  onSelect={() => go('/tasks')}
                >
                  <CheckSquare />
                  <span className="truncate">{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
