import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { Edit, Plus, Search, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { DEFAULT_USUARIO_REGISTRO_ID } from '../lib/config'
import type {
  EstadoCaso,
  Ingreso,
  IngresoPayload,
  Paciente,
  PacientePayload,
  Sexo,
  TipoIngreso,
  Usuario,
} from '../types/models'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'

type PatientFormState = {
  nombres: string
  apellidos: string
  documentoIdentidad: string
  fechaNacimiento: string
  sexoId: string
  telefono: string
  direccion: string
  contactoEmergenciaNombre: string
  contactoEmergenciaTelefono: string
}

type AdmissionFormState = {
  motivoConsulta: string
  tipoIngresoId: string
  estadoActualId: string
  usuarioRegistroId: string
  observacionesRecepcion: string
}

type ApiErrorBody = {
  status?: number
  error?: string
}

const emptyPatientForm: PatientFormState = {
  nombres: '',
  apellidos: '',
  documentoIdentidad: '',
  fechaNacimiento: '',
  sexoId: '',
  telefono: '',
  direccion: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
}

const emptyAdmissionForm: AdmissionFormState = {
  motivoConsulta: '',
  tipoIngresoId: '',
  estadoActualId: '',
  usuarioRegistroId: '',
  observacionesRecepcion: '',
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorBody>
  return axiosError.response?.data?.error || fallback
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function Patients() {
  const [patients, setPatients] = useState<Paciente[]>([])
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [sexos, setSexos] = useState<Sexo[]>([])
  const [tiposIngreso, setTiposIngreso] = useState<TipoIngreso[]>([])
  const [estadosCaso, setEstadosCaso] = useState<EstadoCaso[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [patientDialogOpen, setPatientDialogOpen] = useState(false)
  const [admissionDialogOpen, setAdmissionDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null)
  const [patientForm, setPatientForm] = useState<PatientFormState>(emptyPatientForm)
  const [admissionForm, setAdmissionForm] = useState<AdmissionFormState>(emptyAdmissionForm)
  const [loading, setLoading] = useState(true)
  const [savingPatient, setSavingPatient] = useState(false)
  const [savingAdmission, setSavingAdmission] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const estadosByPaciente = useMemo(() => {
    const latestByPatient = new Map<number, Ingreso>()
    for (const ingreso of ingresos) {
      const current = latestByPatient.get(ingreso.paciente.id)
      if (!current || ingreso.id > current.id) {
        latestByPatient.set(ingreso.paciente.id, ingreso)
      }
    }
    return latestByPatient
  }, [ingresos])

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return patients
    return patients.filter((patient) => {
      const fullName = `${patient.nombres} ${patient.apellidos}`.toLowerCase()
      return (
        patient.documentoIdentidad?.toLowerCase().includes(term) ||
        fullName.includes(term) ||
        patient.apellidos.toLowerCase().includes(term)
      )
    })
  }, [patients, searchTerm])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [patientsRes, sexosRes, tiposRes, estadosRes, ingresosRes, usuariosRes] = await Promise.all([
        api.get<Paciente[]>('/api/pacientes'),
        api.get<Sexo[]>('/api/catalogos/sexos'),
        api.get<TipoIngreso[]>('/api/catalogos/tipos-ingreso'),
        api.get<EstadoCaso[]>('/api/catalogos/estados-caso'),
        api.get<Ingreso[]>('/api/ingresos'),
        api.get<Usuario[]>('/api/usuarios'),
      ])

      setPatients(patientsRes.data)
      setSexos(sexosRes.data)
      setTiposIngreso(tiposRes.data)
      setEstadosCaso(estadosRes.data)
      setIngresos(ingresosRes.data)
      setUsuarios(usuariosRes.data)
    } catch (err) {
      setError('No se pudieron cargar los datos del módulo de pacientes.')
      toast.error(getApiErrorMessage(err, 'Error al cargar pacientes y catálogos'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function openCreatePatient() {
    setSelectedPatient(null)
    setPatientForm(emptyPatientForm)
    setPatientDialogOpen(true)
  }

  function openEditPatient(patient: Paciente) {
    setSelectedPatient(patient)
    setPatientForm({
      nombres: patient.nombres ?? '',
      apellidos: patient.apellidos ?? '',
      documentoIdentidad: patient.documentoIdentidad ?? '',
      fechaNacimiento: patient.fechaNacimiento ?? '',
      sexoId: patient.sexo?.id ? String(patient.sexo.id) : '',
      telefono: patient.telefono ?? '',
      direccion: patient.direccion ?? '',
      contactoEmergenciaNombre: patient.contactoEmergenciaNombre ?? '',
      contactoEmergenciaTelefono: patient.contactoEmergenciaTelefono ?? '',
    })
    setPatientDialogOpen(true)
  }

  function openAdmissionDialog(patient: Paciente) {
    const defaultEstado = estadosCaso[0]
    const preferredUsuario =
      usuarios.find((usuario) => usuario.id === DEFAULT_USUARIO_REGISTRO_ID) || usuarios[0]

    setSelectedPatient(patient)
    setAdmissionForm({
      ...emptyAdmissionForm,
      estadoActualId: defaultEstado ? String(defaultEstado.id) : '',
      usuarioRegistroId: preferredUsuario ? String(preferredUsuario.id) : '',
    })
    setAdmissionDialogOpen(true)
  }

  async function handleSavePatient() {
    if (!patientForm.nombres || !patientForm.apellidos || !patientForm.documentoIdentidad) {
      toast.error('Completa nombres, apellidos y documento de identidad.')
      return
    }

    const payload: PacientePayload = {
      nombres: patientForm.nombres.trim(),
      apellidos: patientForm.apellidos.trim(),
      documentoIdentidad: patientForm.documentoIdentidad.trim(),
      fechaNacimiento: patientForm.fechaNacimiento || null,
      sexo: patientForm.sexoId ? { id: Number(patientForm.sexoId) } : null,
      telefono: patientForm.telefono || null,
      direccion: patientForm.direccion || null,
      contactoEmergenciaNombre: patientForm.contactoEmergenciaNombre || null,
      contactoEmergenciaTelefono: patientForm.contactoEmergenciaTelefono || null,
    }

    setSavingPatient(true)
    try {
      if (selectedPatient) {
        await api.put(`/api/pacientes/${selectedPatient.id}`, payload)
        toast.success('Paciente actualizado correctamente')
      } else {
        await api.post('/api/pacientes', payload)
        toast.success('Paciente registrado correctamente')
      }

      setPatientDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo guardar el paciente'))
      console.error(err)
    } finally {
      setSavingPatient(false)
    }
  }

  async function handleSaveAdmission() {
    if (!selectedPatient) return
    if (!admissionForm.motivoConsulta || !admissionForm.estadoActualId || !admissionForm.usuarioRegistroId) {
      toast.error('Completa motivo de consulta, estado inicial y usuario de registro.')
      return
    }

    const payload: IngresoPayload = {
      paciente: { id: selectedPatient.id },
      motivoConsulta: admissionForm.motivoConsulta.trim(),
      tipoIngreso: admissionForm.tipoIngresoId
        ? { id: Number(admissionForm.tipoIngresoId) }
        : null,
      estadoActual: { id: Number(admissionForm.estadoActualId) },
      usuarioRegistro: { id: Number(admissionForm.usuarioRegistroId) },
      observacionesRecepcion: admissionForm.observacionesRecepcion || null,
    }

    setSavingAdmission(true)
    try {
      await api.post('/api/ingresos', payload)
      toast.success('Ingreso registrado correctamente')
      setAdmissionDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar el ingreso'))
      console.error(err)
    } finally {
      setSavingAdmission(false)
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestión de pacientes</h2>
          <p className="mt-1 text-muted-foreground">
            Registro, búsqueda, edición e ingreso clínico inicial.
          </p>
        </div>
        <Button onClick={openCreatePatient} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por documento, nombres o apellidos..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Pacientes registrados</CardTitle>
          <CardDescription>
            {loading ? 'Cargando pacientes...' : `${filteredPatients.length} pacientes visibles en el sistema`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Cargando información clínica...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha nac.</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-10 w-10 opacity-50" />
                        <span>No se encontraron pacientes.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => {
                    const latestIngreso = estadosByPaciente.get(patient.id)
                    return (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.documentoIdentidad}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {patient.nombres} {patient.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground">{patient.sexo?.nombre || 'Sin sexo'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(patient.fechaNacimiento)}</TableCell>
                        <TableCell>{patient.sexo?.nombre || 'No registrado'}</TableCell>
                        <TableCell>{patient.telefono || 'Sin teléfono'}</TableCell>
                        <TableCell>{latestIngreso?.estadoActual?.nombre || 'Sin ingreso'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => openAdmissionDialog(patient)}
                            >
                              <UserPlus className="h-4 w-4" />
                              Ingreso
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditPatient(patient)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPatient ? 'Editar paciente' : 'Registrar paciente'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input
                id="nombres"
                value={patientForm.nombres}
                onChange={(e) => setPatientForm((prev) => ({ ...prev, nombres: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                value={patientForm.apellidos}
                onChange={(e) => setPatientForm((prev) => ({ ...prev, apellidos: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentoIdentidad">Documento de identidad</Label>
              <Input
                id="documentoIdentidad"
                value={patientForm.documentoIdentidad}
                onChange={(e) => setPatientForm((prev) => ({ ...prev, documentoIdentidad: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={patientForm.fechaNacimiento}
                onChange={(e) => setPatientForm((prev) => ({ ...prev, fechaNacimiento: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select
                value={patientForm.sexoId}
                onValueChange={(value) => setPatientForm((prev) => ({ ...prev, sexoId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sexo" />
                </SelectTrigger>
                <SelectContent>
                  {sexos.map((sexo) => (
                    <SelectItem key={sexo.id} value={String(sexo.id)}>
                      {sexo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={patientForm.telefono}
                onChange={(e) => setPatientForm((prev) => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={patientForm.direccion}
                onChange={(e) => setPatientForm((prev) => ({ ...prev, direccion: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactoEmergenciaNombre">Contacto de emergencia</Label>
              <Input
                id="contactoEmergenciaNombre"
                value={patientForm.contactoEmergenciaNombre}
                onChange={(e) =>
                  setPatientForm((prev) => ({ ...prev, contactoEmergenciaNombre: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactoEmergenciaTelefono">Teléfono de emergencia</Label>
              <Input
                id="contactoEmergenciaTelefono"
                value={patientForm.contactoEmergenciaTelefono}
                onChange={(e) =>
                  setPatientForm((prev) => ({ ...prev, contactoEmergenciaTelefono: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setPatientDialogOpen(false)} disabled={savingPatient}>
              Cancelar
            </Button>
            <Button onClick={handleSavePatient} disabled={savingPatient}>
              {savingPatient ? 'Guardando...' : selectedPatient ? 'Actualizar paciente' : 'Registrar paciente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={admissionDialogOpen} onOpenChange={setAdmissionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar ingreso</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <p className="text-sm text-muted-foreground">
              {selectedPatient.nombres} {selectedPatient.apellidos} · {selectedPatient.documentoIdentidad}
            </p>
          )}
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="motivoConsulta">Motivo de consulta</Label>
              <Input
                id="motivoConsulta"
                value={admissionForm.motivoConsulta}
                onChange={(e) =>
                  setAdmissionForm((prev) => ({ ...prev, motivoConsulta: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de ingreso</Label>
                <Select
                  value={admissionForm.tipoIngresoId}
                  onValueChange={(value) =>
                    setAdmissionForm((prev) => ({ ...prev, tipoIngresoId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposIngreso.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado inicial</Label>
                <Select
                  value={admissionForm.estadoActualId}
                  onValueChange={(value) =>
                    setAdmissionForm((prev) => ({ ...prev, estadoActualId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosCaso.map((estado) => (
                      <SelectItem key={estado.id} value={String(estado.id)}>
                        {estado.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Usuario de registro</Label>
              <Select
                value={admissionForm.usuarioRegistroId}
                onValueChange={(value) =>
                  setAdmissionForm((prev) => ({ ...prev, usuarioRegistroId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el usuario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={String(usuario.id)}>
                      {usuario.nombreCompleto} ({usuario.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {usuarios.length === 0 && (
                <p className="text-sm text-destructive">
                  No hay usuarios cargados en el backend. Debes crear al menos uno para registrar ingresos.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacionesRecepcion">Observaciones de recepción</Label>
              <textarea
                id="observacionesRecepcion"
                value={admissionForm.observacionesRecepcion}
                onChange={(e) =>
                  setAdmissionForm((prev) => ({ ...prev, observacionesRecepcion: e.target.value }))
                }
                className="min-h-28 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder="Observaciones iniciales del caso..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setAdmissionDialogOpen(false)}
              disabled={savingAdmission}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveAdmission} disabled={savingAdmission || usuarios.length === 0}>
              {savingAdmission ? 'Registrando...' : 'Registrar ingreso'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Patients
