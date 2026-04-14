import { FileBarChart2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

function Reports() {
  return (
    <div className="p-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileBarChart2 className="h-6 w-6 text-primary" />
            Reportes
          </CardTitle>
          <CardDescription>
            Ruta disponible para estadísticas y reportes operativos del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          La navegación ya está lista. Más adelante puedes conectar métricas de ingresos, prioridades y tiempos
          de atención con el backend.
        </CardContent>
      </Card>
    </div>
  )
}

export default Reports
