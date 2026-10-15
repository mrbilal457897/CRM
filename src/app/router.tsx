import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/app/AppLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { PageLoader } from '@/components/common/PageLoader'

const ActivitiesPage = lazy(() =>
  import('@/features/activities/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage })),
)
const CalendarPage = lazy(() =>
  import('@/features/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const CompaniesPage = lazy(() =>
  import('@/features/companies/CompaniesPage').then((m) => ({ default: m.CompaniesPage })),
)
const CompanyDetailPage = lazy(() =>
  import('@/features/companies/CompanyDetailPage').then((m) => ({ default: m.CompanyDetailPage })),
)
const ContactDetailPage = lazy(() =>
  import('@/features/contacts/ContactDetailPage').then((m) => ({ default: m.ContactDetailPage })),
)
const ContactsPage = lazy(() =>
  import('@/features/contacts/ContactsPage').then((m) => ({ default: m.ContactsPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const DealsPage = lazy(() =>
  import('@/features/deals/DealsPage').then((m) => ({ default: m.DealsPage })),
)
const EmailTemplatesPage = lazy(() =>
  import('@/features/email-templates/EmailTemplatesPage').then((m) => ({
    default: m.EmailTemplatesPage,
  })),
)
const ImportExportPage = lazy(() =>
  import('@/features/import-export/ImportExportPage').then((m) => ({
    default: m.ImportExportPage,
  })),
)
const LeadsPage = lazy(() =>
  import('@/features/leads/LeadsPage').then((m) => ({ default: m.LeadsPage })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const NotFoundPage = lazy(() =>
  import('@/features/misc/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const TasksPage = lazy(() =>
  import('@/features/tasks/TasksPage').then((m) => ({ default: m.TasksPage })),
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'deals', element: <DealsPage /> },
          { path: 'leads', element: <LeadsPage /> },
          { path: 'contacts', element: <ContactsPage /> },
          { path: 'contacts/:id', element: <ContactDetailPage /> },
          { path: 'companies', element: <CompaniesPage /> },
          { path: 'companies/:id', element: <CompanyDetailPage /> },
          { path: 'tasks', element: <TasksPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'activities', element: <ActivitiesPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'email-templates', element: <EmailTemplatesPage /> },
          { path: 'import-export', element: <ImportExportPage /> },
          { path: 'settings', element: <Navigate to="/settings/profile" replace /> },
          { path: 'settings/:tab', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
