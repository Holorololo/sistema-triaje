import { useState, type FormEvent } from 'react'
import type { AxiosError } from 'axios'
import { ArrowRight, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

type ApiErrorBody = {
  error?: string
}

function Login() {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!identifier.trim() || !password.trim()) {
      toast.error('Ingresa tu usuario o correo y la contrasena')
      return
    }

    setSubmitting(true)
    try {
      await login(identifier.trim(), password)
      toast.success('Sesion iniciada correctamente')
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorBody>
      toast.error(apiError.response?.data?.error || 'No se pudo iniciar sesion')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#f4f7fb_0%,_#e0f2fe_48%,_#fef3c7_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(217,119,6,0.12),_transparent_28%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-sm text-primary shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Acceso seguro al sistema de triaje
          </div>

          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-primary/70">LAN Clinic</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-tight text-slate-950">
              Entra con tu correo o tu nombre de usuario para comenzar el flujo clinico.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              El acceso ya no depende del modulo de usuarios. Desde aqui inicias sesion y luego entras al panel
              operativo del sistema.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Recepcion', text: 'Ingreso de pacientes y apertura de casos.' },
              { title: 'Triaje', text: 'Seguimiento rapido del estado y prioridad.' },
              { title: 'Usuarios', text: 'Administracion del personal sin mezclar el acceso.' },
            ].map((item) => (
              <Card key={item.title} className="border-white/70 bg-white/70 shadow-lg backdrop-blur">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base font-semibold text-slate-900">{item.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-600">{item.text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Card className="border-white/75 bg-white/85 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-2">
            <p className="text-sm uppercase tracking-[0.25em] text-primary/70">Iniciar sesion</p>
            <CardTitle className="text-3xl font-semibold text-slate-950">Acceso del personal</CardTitle>
            <CardDescription>
              Usa tu username o correo y tu contrasena actual para entrar al sistema.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="identifier">Usuario o correo</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="h-12 pl-10"
                    placeholder="Ej. recepcion1 o recepcion@triaje.com"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 pl-10"
                    placeholder="Ingresa tu contrasena"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-sky-50/70 p-4 text-sm text-slate-600">
                Si tu cuenta esta inactiva o no recuerdas tu contrasena, un administrador puede actualizarla desde
                el modulo de usuarios.
              </div>

              <Button type="submit" className="h-12 w-full gap-2 text-base" disabled={submitting}>
                {submitting ? 'Ingresando...' : 'Entrar al sistema'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
