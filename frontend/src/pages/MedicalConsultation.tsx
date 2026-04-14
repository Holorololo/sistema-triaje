import { Stethoscope } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

function MedicalConsultation() {
  return (
    <div className="p-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Stethoscope className="h-6 w-6 text-primary" />
            Consulta médica
          </CardTitle>
          <CardDescription>
            La ruta médica ya renderiza de forma estable dentro del dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          En la siguiente iteración se conectará con triajes clasificados, signos vitales y el registro de
          atención médica real.
        </CardContent>
      </Card>
    </div>
  )
}

export default MedicalConsultation
