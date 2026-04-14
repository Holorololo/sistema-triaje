import { Activity, ClipboardPlus, FileBarChart2, Stethoscope, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navigationItems = [
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/triaje', label: 'Triaje', icon: ClipboardPlus },
  { to: '/consulta-medica', label: 'Consulta médica', icon: Stethoscope },
  { to: '/usuarios', label: 'Usuarios', icon: Activity },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart2 },
]

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="border-b border-sidebar-border px-6 py-6">
          <p className="text-sm uppercase tracking-[0.3em] text-sidebar-foreground/70">LAN Clinic</p>
          <h1 className="mt-2 text-2xl font-semibold">Sistema de Triaje</h1>
          <p className="mt-2 text-sm text-sidebar-foreground/70">
            Recepción, clasificación y consulta médica en tiempo real.
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {navigationItems.map((item) => {
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Red LAN clínica</p>
              <h2 className="text-xl font-semibold">Panel operativo</h2>
            </div>
            <div className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              Usuario de desarrollo
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
