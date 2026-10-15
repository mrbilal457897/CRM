# CRM — Build Plan

Browser-only CRM (Vite + React + TS), localStorage persistence, seeded demo data.

## Stack
- Vite + React + TypeScript, Tailwind CSS v3.4 + vendored shadcn/ui (Radix)
- React Router, Zustand (persist), react-hook-form + zod, @tanstack/react-table
- @dnd-kit, Recharts, date-fns, framer-motion, lucide-react, cmdk, papaparse, sonner
- Inter (variable) via @fontsource-variable/inter

## Folder structure
```
src/
  app/            router, providers, AppLayout, Sidebar, Topbar
  components/ui/  shadcn primitives
  components/common/ DataTable, KanbanBoard, StatCard, EmptyState, ConfirmDialog,
                     FormDrawer, Avatar, Badge, Timeline, PageHeader, Pagination, CountUp
  features/       auth dashboard leads contacts companies deals activities tasks
                  calendar reports email-templates import-export settings notifications command-palette
  data/           seed generators
  repository/     thin data-access layer (only code importing the store)
  store/          zustand + persist, selectors
  hooks/          entity hooks, permissions, scoped data, debounce, count-up
  lib/            utils, format, csv, colors, id, constants
  types/          models, enums
  index.css       design tokens
```

## Data model (relations by string id)
User, Company, Contact, Lead, Deal (+ LineItem, StageChange), Stage, Activity, Note,
Task, Tag, Source, EmailTemplate, Notification, Settings. Unified record timeline merges
Activity + Note + StageChange + completed Task.

## Data-access layer
Single persisted zustand store (`crm.store.v1`). `repository/*` is the only importer of the
store; feature hooks call the repository. Store is swappable for a real API later.

## Routes
`/login` `/` `/leads` `/leads/:id` `/contacts` `/contacts/:id` `/companies` `/companies/:id`
`/deals` `/activities` `/tasks` `/calendar` `/reports` `/email-templates` `/import-export`
`/notifications` `/settings/:tab?` `*`.

## Design tokens
HSL CSS variables light + `.dark`: background/foreground/card/popover/primary/secondary/muted/
accent/destructive/border/input/ring/radius + success/warning/info. Primary indigo-violet
`262 83% 58%`, slate neutrals, tabular-nums money, `.glass` overlays, 2xl cards, soft shadows.

## Build order
tokens+shell → model/store/seed/repo → deals → contacts/companies → leads → activities →
tasks → calendar → dashboard → reports/templates → import/export → settings/notifications/palette
→ polish → README. `npm.cmd run build` + `npm.cmd run lint` gate after each module.

## Assumptions
- Simulated auth (plain demo passwords); no backend/email/network.
- Files tab is a static placeholder; "Send email" logs to timeline only.
- Tailwind v3.4, manually vendored shadcn components, @tanstack/react-table for DataTable.
- Notes are a separate entity also shown in the unified timeline.
- Currency selection affects formatting only (no FX).
- Commands invoked with `npm.cmd` (PowerShell execution policy blocks npm.ps1).
