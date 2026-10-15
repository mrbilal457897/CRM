import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useCurrentUser } from '@/repository'

export function ProtectedRoute() {
  const user = useCurrentUser()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
