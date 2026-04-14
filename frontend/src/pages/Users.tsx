import { Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

function Users() {
  return (
    <div className="p-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Activity className="h-6 w-6 text-primary" />
            Usuarios
          </CardTitle>
          <CardDescription>
            Módulo de administración estabilizado para navegación.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta vista queda lista para conectar el CRUD de usuarios y roles del backend cuando quieras avanzar
          con autenticación y perfiles.
        </CardContent>
      </Card>
    </div>
  )
}

export default Users
