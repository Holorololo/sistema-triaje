import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { getDefaultRouteForUser, type AppRole, userHasRole } from './roles'

function SessionGate({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="rounded-2xl border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
        {text}
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <SessionGate text="Validando sesion..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function RoleProtectedRoute({ allowedRoles }: { allowedRoles: AppRole[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <SessionGate text="Validando permisos..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!userHasRole(user, allowedRoles)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />
  }

  return <Outlet />
}

export function RoleHomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return <SessionGate text="Cargando panel..." />
  }

  return <Navigate to={getDefaultRouteForUser(user)} replace />
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <SessionGate text="Cargando acceso..." />
  }

  if (user) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />
  }

  return <Outlet />
}
