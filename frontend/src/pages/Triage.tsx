import { ClipboardPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

function Triage() {
  return (
    <div className="p-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ClipboardPlus className="h-6 w-6 text-primary" />
            Triaje
          </CardTitle>
          <CardDescription>
            La pantalla visual de triaje quedó estabilizada y lista para conectarse en la siguiente fase.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta ruta ya está operativa dentro del router y no rompe la aplicación. El siguiente paso será
          conectarla a ingresos pendientes, prioridades, signos vitales y estados reales del backend.
        </CardContent>
      </Card>
    </div>
  )
}

export default Triage
