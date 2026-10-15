import Papa from 'papaparse'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileDown,
  FileUp,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportToCsv, exportToJson } from '@/lib/csv'
import {
  clearAllData,
  createCompany,
  createContact,
  createLead,
  exportAllData,
  importAllData,
  resetDemoData,
  useActivities,
  useCompanies,
  useContacts,
  useDeals,
  useLeads,
  useTasks,
  useUserNameMap,
} from '@/repository'

type ImportEntity = 'contacts' | 'leads' | 'companies'

interface ParsedRow {
  [key: string]: string
}

export function ImportExportPage() {
  const contacts = useContacts()
  const leads = useLeads()
  const companies = useCompanies()
  const deals = useDeals()
  const activities = useActivities()
  const tasks = useTasks()
  const userMap = useUserNameMap()

  const [entity, setEntity] = useState<ImportEntity>('contacts')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<'reset' | 'clear' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    setImportedCount(null)
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedRows(results.data)
        setParseError('')
      },
      error: (error) => {
        setParseError(error.message)
        setParsedRows([])
      },
    })
  }

  const runImport = () => {
    let count = 0
    parsedRows.forEach((row) => {
      if (entity === 'contacts') {
        const firstName = (row.firstName || row.first || '').trim()
        const lastName = (row.lastName || row.last || '').trim()
        const email = (row.email || '').trim()
        if (!firstName && !lastName) return
        createContact({
          firstName: firstName || 'Unknown',
          lastName: lastName || '',
          email,
          phone: (row.phone || '').trim(),
          title: (row.title || '').trim(),
          companyId: null,
          ownerId: matchOwner(row.owner),
          status: 'prospect',
          tags: splitTags(row.tags),
          source: (row.source || '').trim(),
          score: Number(row.score) || 0,
          location: (row.location || '').trim(),
          lastContactedAt: null,
        })
        count += 1
      } else if (entity === 'leads') {
        const firstName = (row.firstName || row.first || '').trim()
        const lastName = (row.lastName || row.last || '').trim()
        if (!firstName && !lastName) return
        createLead({
          firstName: firstName || 'Unknown',
          lastName: lastName || '',
          email: (row.email || '').trim(),
          phone: (row.phone || '').trim(),
          companyName: (row.company || row.companyName || '').trim(),
          source: (row.source || '').trim(),
          status: 'new',
          score: Number(row.score) || 0,
          ownerId: matchOwner(row.owner),
          estimatedValue: Number(row.estimatedValue || row.value) || 0,
          notes: (row.notes || '').trim(),
          tags: splitTags(row.tags),
        })
        count += 1
      } else {
        const name = (row.name || row.company || row.companyName || '').trim()
        if (!name) return
        createCompany({
          name,
          industry: 'Technology',
          size: '11-50',
          website: (row.website || '').trim(),
          location: (row.location || '').trim(),
          phone: (row.phone || '').trim(),
          description: (row.description || '').trim(),
          ownerId: matchOwner(row.owner),
          tags: splitTags(row.tags),
        })
        count += 1
      }
    })
    setImportedCount(count)
    toast.success(`Imported ${count} ${entity}`)
    setParsedRows([])
    setFileName('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const matchOwner = (value?: string): string => {
    if (!value) return Object.keys(userMap)[0] ?? 'user_admin'
    const lower = value.toLowerCase()
    const match = Object.values(userMap).find((user) => user.name.toLowerCase() === lower)
    return match?.id ?? Object.keys(userMap)[0] ?? 'user_admin'
  }

  const downloadTemplate = () => {
    const sample =
      entity === 'contacts'
        ? [
            {
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@example.com',
              phone: '+1 555 000 0000',
              title: 'VP Sales',
              company: 'Acme',
              owner: '',
              source: 'Referral',
              score: 70,
              location: 'New York, US',
              tags: 'vip; enterprise',
            },
          ]
        : entity === 'leads'
          ? [
              {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john@example.com',
                phone: '+1 555 111 1111',
                company: 'Globex',
                source: 'Website',
                score: 60,
                estimatedValue: 12000,
                owner: '',
                tags: 'inbound',
              },
            ]
          : [
              {
                name: 'Globex Corporation',
                industry: 'Technology',
                website: 'globex.com',
                location: 'Springfield, US',
                phone: '+1 555 222 2222',
                description: 'Manufacturing',
                owner: '',
                tags: 'target',
              },
            ]
    exportToCsv(`${entity}-template.csv`, sample)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Import / Export" description="Move data in and out of your CRM" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <FileDown className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Export data</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Download your records as CSV or take a full JSON backup of everything.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ExportButton
              label={`Contacts (${contacts.length})`}
              onClick={() =>
                exportToCsv(
                  'contacts.csv',
                  contacts.map((contact) => ({
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email,
                    phone: contact.phone,
                    title: contact.title,
                    status: contact.status,
                    owner: userMap[contact.ownerId]?.name ?? '',
                    source: contact.source,
                    score: contact.score,
                    location: contact.location,
                    tags: contact.tags.join('; '),
                  })),
                )
              }
            />
            <ExportButton
              label={`Leads (${leads.length})`}
              onClick={() =>
                exportToCsv(
                  'leads.csv',
                  leads.map((lead) => ({
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email,
                    phone: lead.phone,
                    company: lead.companyName,
                    status: lead.status,
                    score: lead.score,
                    estimatedValue: lead.estimatedValue,
                    source: lead.source,
                    owner: userMap[lead.ownerId]?.name ?? '',
                  })),
                )
              }
            />
            <ExportButton
              label={`Companies (${companies.length})`}
              onClick={() =>
                exportToCsv(
                  'companies.csv',
                  companies.map((company) => ({
                    name: company.name,
                    industry: company.industry,
                    size: company.size,
                    website: company.website,
                    location: company.location,
                    phone: company.phone,
                    owner: userMap[company.ownerId]?.name ?? '',
                    tags: company.tags.join('; '),
                  })),
                )
              }
            />
            <ExportButton
              label={`Deals (${deals.length})`}
              onClick={() =>
                exportToCsv(
                  'deals.csv',
                  deals.map((deal) => ({
                    title: deal.title,
                    value: deal.value,
                    probability: deal.probability,
                    source: deal.source,
                    expectedCloseDate: deal.expectedCloseDate,
                    owner: userMap[deal.ownerId]?.name ?? '',
                  })),
                )
              }
            />
            <ExportButton
              label={`Activities (${activities.length})`}
              onClick={() =>
                exportToCsv(
                  'activities.csv',
                  activities.map((activity) => ({
                    type: activity.type,
                    subject: activity.subject,
                    body: activity.body,
                    occurredAt: activity.occurredAt,
                  })),
                )
              }
            />
            <ExportButton
              label={`Tasks (${tasks.length})`}
              onClick={() =>
                exportToCsv(
                  'tasks.csv',
                  tasks.map((task) => ({
                    title: task.title,
                    dueDate: task.dueDate,
                    priority: task.priority,
                    status: task.status,
                    assignee: userMap[task.assignedToId]?.name ?? '',
                  })),
                )
              }
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => exportToJson('crm-backup.json', exportAllData())}
          >
            <Database />
            Download full backup (.json)
          </Button>
          <label className="block">
            <Button variant="ghost" className="w-full" asChild>
              <span>
                <Upload />
                Restore from backup (.json)
              </span>
            </Button>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  try {
                    const data = JSON.parse(String(reader.result))
                    importAllData(data)
                    toast.success('Backup restored')
                  } catch {
                    toast.error('That file is not a valid backup')
                  }
                }
                reader.readAsText(file)
                event.target.value = ''
              }}
            />
          </label>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileUp className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Import data</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download />
              Template
            </Button>
          </div>

          <div className="space-y-1.5">
            <Select value={entity} onValueChange={(value) => setEntity(value as ImportEntity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="companies">Companies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label
            htmlFor="csv-input"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors hover:bg-accent/50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const file = event.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
          >
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {fileName || 'Drop a CSV file or click to browse'}
            </span>
            <span className="text-xs text-muted-foreground">
              Columns are matched automatically from the header row
            </span>
            <input
              ref={inputRef}
              id="csv-input"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </label>

          {parseError ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {parseError}
            </p>
          ) : null}

          {parsedRows.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{parsedRows.length} rows detected</span>
                <Button size="sm" onClick={runImport}>
                  <Upload />
                  Import {parsedRows.length}
                </Button>
              </div>
              <div className="max-h-40 overflow-auto rounded-xl border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/60 text-muted-foreground">
                    <tr>
                      {Object.keys(parsedRows[0]).slice(0, 6).map((header) => (
                        <th key={header} className="px-2 py-1.5 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t">
                        {Object.keys(parsedRows[0]).slice(0, 6).map((header) => (
                          <td key={header} className="truncate px-2 py-1.5">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {importedCount !== null ? (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="size-4" />
              Imported {importedCount} {entity}
            </p>
          ) : null}
        </Card>
      </div>

      <Card className="space-y-4 border-destructive/30 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          These actions affect all of your data and cannot be undone.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setConfirm('reset')}>
            <RotateCcw />
            Reset demo data
          </Button>
          <Button variant="destructive" onClick={() => setConfirm('clear')}>
            <Trash2 />
            Delete all records
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => !next && setConfirm(null)}
        title={confirm === 'reset' ? 'Reset to demo data?' : 'Delete all records?'}
        description={
          confirm === 'reset'
            ? 'Your current data will be replaced with the seeded demo dataset.'
            : 'All contacts, companies, leads, deals, activities, notes and tasks will be removed.'
        }
        confirmLabel={confirm === 'reset' ? 'Reset data' : 'Delete everything'}
        destructive
        onConfirm={() => {
          if (confirm === 'reset') {
            resetDemoData()
            toast.success('Demo data restored')
          } else {
            clearAllData()
            toast.success('All records deleted')
          }
        }}
      />
    </div>
  )
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" className="justify-start" onClick={onClick}>
      <Download />
      {label}
    </Button>
  )
}

function splitTags(value?: string): string[] {
  if (!value) return []
  return value
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}
