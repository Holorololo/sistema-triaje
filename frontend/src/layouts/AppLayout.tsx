import { Activity, ClipboardPlus, FileBarChart2, LogOut, Stethoscope, Users } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import type { AppRole } from '../auth/roles'
import { userHasRole } from '../auth/roles'
import { Button } from '../components/ui/button'

const navigationItems = [
  {
    to: '/pacientes',
    label: 'Recepcion',
    description: 'Registro de pacientes e ingresos.',
    icon: Users,
    roles: ['RECEPCION'],
  },
  {
    to: '/triaje',
    label: 'Triaje',
    description: 'Clasificacion y signos vitales.',
    icon: ClipboardPlus,
    roles: ['TRIAJE'],
  },
  {
    to: '/consulta-medica',
    label: 'Consulta medica',
    description: 'Evaluacion clinica y conducta medica.',
    icon: Stethoscope,
    roles: ['MEDICO'],
  },
  {
    to: '/usuarios',
    label: 'Usuarios',
    description: 'Administracion de cuentas y accesos.',
    icon: Activity,
    roles: ['ADMIN'],
  },
  {
    to: '/reportes',
    label: 'Reportes',
    description: 'Metricas y exportacion operativa.',
    icon: FileBarChart2,
    roles: ['ADMIN'],
  },
] satisfies Array<{
  to: string
  label: string
  description: string
  icon: typeof Users
  roles: AppRole[]
}>

function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const visibleNavigationItems = navigationItems.filter((item) => userHasRole(user, item.roles))
  const currentSection =
    visibleNavigationItems.find((item) => location.pathname === item.to) || visibleNavigationItems[0]

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="border-b border-sidebar-border px-6 py-6">
          <p className="text-sm uppercase tracking-[0.3em] text-sidebar-foreground/70">LAN Clinic</p>
          <h1 className="mt-2 text-2xl font-semibold">Sistema de Triaje</h1>
          <p className="mt-2 text-sm text-sidebar-foreground/70">
            {currentSection?.description || 'Operacion clinica por modulo y permisos de acceso.'}
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {visibleNavigationItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border px-6 py-4 text-xs text-sidebar-foreground/70">
          Backend: Spring Boot + PostgreSQL
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card/85 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Red LAN clinica</p>
              <h2 className="text-xl font-semibold">{currentSection?.label || 'Panel operativo'}</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-accent px-4 py-2 text-right text-sm">
                <p className="font-medium text-accent-foreground">{user?.nombreCompleto || 'Sesion activa'}</p>
                <p className="text-xs text-accent-foreground/80">
                  {user?.rol?.nombre || user?.username || 'Sin rol'}
                </p>
              </div>

              <Button type="button" variant="outline" className="gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
