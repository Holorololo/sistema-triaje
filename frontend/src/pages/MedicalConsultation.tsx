import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, Filter, Heart, Stethoscope, Thermometer } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { api } from '../lib/api'
import type {
  AtencionMedicaPayload,
  AtencionMedicaRecord,
  EstadoCaso,
  SignoVitalRecord,
  TriajeRecord,
} from '../types/models'

type ApiErrorBody = {
  status?: number
  error?: string
}

type ConsultationFormState = {
  diagnosis: string
  treatment: string
  observations: string
  resultingStatusId: string
}

type PriorityAppearance = {
  badge: string
  container: string
  accent: string
  text: string
}

type MedicalCase = {
  ingresoId: number
  triaje: TriajeRecord
  signosVitales?: SignoVitalRecord | null
  latestAttention?: AtencionMedicaRecord | null
}

const priorityStyles: Record<string, PriorityAppearance> = {
  ROJO: {
    badge: 'bg-red-600',
    container: 'border-red-300 bg-red-50',
    accent: 'border-red-500',
    text: 'text-red-700',
  },
  NARANJA: {
    badge: 'bg-orange-500',
    container: 'border-orange-300 bg-orange-50',
    accent: 'border-orange-500',
    text: 'text-orange-700',
  },
  AMARILLO: {
    badge: 'bg-amber-500',
    container: 'border-amber-300 bg-amber-50',
    accent: 'border-amber-500',
    text: 'text-amber-700',
  },
  VERDE: {
    badge: 'bg-emerald-500',
    container: 'border-emerald-300 bg-emerald-50',
    accent: 'border-emerald-500',
    text: 'text-emerald-700',
  },
  AZUL: {
    badge: 'bg-sky-500',
    container: 'border-sky-300 bg-sky-50',
    accent: 'border-sky-500',
    text: 'text-sky-700',
  },
}

function normalizeText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorBody>
  return axiosError.response?.data?.error || fallback
}

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return 'Sin fecha'

  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return `${age} anos`
}

function formatTime(value?: string | null) {
  if (!value) return 'Sin hora'
  return new Date(value).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatValue(value?: number | string | null, suffix = '') {
  if (value == null || value === '') return 'N/D'
  return `${value}${suffix}`
}

function formatHeight(value?: number | string | null) {
  if (value == null || value === '') return 'N/D'
  const numeric = Number(value)
  if (!Number.isNaN(numeric)) {
    return `${Math.round(numeric * 100)} cm`
  }
  return `${value} m`
}

function getPriorityAppearance(code?: string | null) {
  return priorityStyles[normalizeText(code)] || {
    badge: 'bg-slate-600',
    container: 'border-slate-300 bg-slate-50',
    accent: 'border-slate-500',
    text: 'text-slate-700',
  }
}

function getPriorityBadge(caseItem: MedicalCase) {
  const appearance = getPriorityAppearance(caseItem.triaje.prioridad?.codigo)
  return (
    <Badge className={`${appearance.badge} border-0 px-3 py-1 font-semibold text-white`}>
      {caseItem.triaje.prioridad?.codigo || 'SIN PRIORIDAD'}
    </Badge>
  )
}

function getDefaultStatusId(estados: EstadoCaso[]) {
  const alta = estados.find((estado) => normalizeText(estado.codigo) === 'ALTA')
  if (alta) return String(alta.id)

  const atencion = estados.find((estado) => normalizeText(estado.codigo).includes('ATENCION'))
  if (atencion) return String(atencion.id)

  return estados[0] ? String(estados[0].id) : ''
}

function isClosedCaseStatus(code?: string | null) {
  const normalizedCode = normalizeText(code)
  return normalizedCode === 'ALTA' || normalizedCode === 'CERRADO'
}

function buildForm(caseItem: MedicalCase | null, estadosCaso: EstadoCaso[]): ConsultationFormState {
  const latestAttention = caseItem?.latestAttention
  return {
    diagnosis: latestAttention?.diagnosticoPresuntivo || '',
    treatment: latestAttention?.conductaMedica || '',
    observations: latestAttention?.observaciones || '',
    resultingStatusId: latestAttention?.estadoResultante?.id
      ? String(latestAttention.estadoResultante.id)
      : getDefaultStatusId(estadosCaso),
  }
}

function MedicalConsultation() {
  const { user } = useAuth()
  const [triajes, setTriajes] = useState<TriajeRecord[]>([])
  const [signosVitales, setSignosVitales] = useState<SignoVitalRecord[]>([])
  const [atenciones, setAtenciones] = useState<AtencionMedicaRecord[]>([])
  const [estadosCaso, setEstadosCaso] = useState<EstadoCaso[]>([])
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedIngresoId, setSelectedIngresoId] = useState<number | null>(null)
  const [consultationData, setConsultationData] = useState<ConsultationFormState>({
    diagnosis: '',
    treatment: '',
    observations: '',
    resultingStatusId: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const medicalCases = useMemo(() => {
    const signosByTriage = new Map<number, SignoVitalRecord>()
    for (const signo of signosVitales) {
      signosByTriage.set(signo.triaje.id, signo)
    }

    const latestAtencionByIngreso = new Map<number, AtencionMedicaRecord>()
    for (const atencion of atenciones) {
      const current = latestAtencionByIngreso.get(atencion.ingreso.id)
      if (!current || atencion.id > current.id) {
        latestAtencionByIngreso.set(atencion.ingreso.id, atencion)
      }
    }

    return [...triajes]
      .sort((a, b) => {
        const byPriority = (a.prioridad?.nivel || 999) - (b.prioridad?.nivel || 999)
        if (byPriority !== 0) return byPriority
        const aTime = a.fechaTriaje ? new Date(a.fechaTriaje).getTime() : 0
        const bTime = b.fechaTriaje ? new Date(b.fechaTriaje).getTime() : 0
        return aTime - bTime
      })
      .map((triaje) => ({
        ingresoId: triaje.ingreso.id,
        triaje,
        signosVitales: signosByTriage.get(triaje.id) || null,
        latestAttention: latestAtencionByIngreso.get(triaje.ingreso.id) || null,
      }))
  }, [triajes, signosVitales, atenciones])

  const queuedCases = useMemo(
    () =>
      medicalCases.filter((caseItem) => !isClosedCaseStatus(caseItem.triaje.ingreso.estadoActual?.codigo)),
    [medicalCases],
  )

  const filteredCases = useMemo(() => {
    return queuedCases.filter((caseItem) => {
      const matchesPriority =
        filterPriority === 'all' || String(caseItem.triaje.prioridad?.id) === filterPriority
      const matchesStatus =
        filterStatus === 'all' || String(caseItem.triaje.ingreso.estadoActual?.id) === filterStatus
      return matchesPriority && matchesStatus
    })
  }, [queuedCases, filterPriority, filterStatus])

  const selectedCase = useMemo(
    () => filteredCases.find((caseItem) => caseItem.ingresoId === selectedIngresoId) || filteredCases[0] || null,
    [filteredCases, selectedIngresoId],
  )

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [triajesRes, signosRes, atencionesRes, estadosRes] = await Promise.all([
        api.get<TriajeRecord[]>('/api/triajes'),
        api.get<SignoVitalRecord[]>('/api/signos-vitales'),
        api.get<AtencionMedicaRecord[]>('/api/atenciones-medicas'),
        api.get<EstadoCaso[]>('/api/catalogos/estados-caso'),
      ])

      setTriajes(triajesRes.data)
      setSignosVitales(signosRes.data)
      setAtenciones(atencionesRes.data)
      setEstadosCaso(estadosRes.data)
    } catch (err) {
      setError('No se pudieron cargar los casos clinicos para consulta medica.')
      toast.error(getApiErrorMessage(err, 'Error al cargar el modulo medico'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (!filteredCases.length) {
      if (selectedIngresoId !== null) {
        setSelectedIngresoId(null)
      }
      return
    }

    const exists = filteredCases.some((caseItem) => caseItem.ingresoId === selectedIngresoId)
    if (!exists) {
      setSelectedIngresoId(filteredCases[0].ingresoId)
    }
  }, [filteredCases, selectedIngresoId])

  useEffect(() => {
    setConsultationData(buildForm(selectedCase, estadosCaso))
  }, [selectedCase?.ingresoId, selectedCase?.latestAttention?.id, estadosCaso])

  async function handleSaveConsultation() {
    if (!selectedCase) {
      toast.error('Selecciona un paciente para registrar la atencion medica.')
      return
    }

    if (!user?.id) {
      toast.error('No se pudo identificar la sesion actual.')
      return
    }

    if (!consultationData.diagnosis.trim() || !consultationData.treatment.trim()) {
      toast.error('Por favor completa el diagnostico y el tratamiento.')
      return
    }

    if (!consultationData.resultingStatusId) {
      toast.error('Selecciona el estado final del paciente.')
      return
    }

    const currentCaseIndex = filteredCases.findIndex((caseItem) => caseItem.ingresoId === selectedCase.ingresoId)
    const nextCase =
      currentCaseIndex >= 0
        ? filteredCases[currentCaseIndex + 1] || filteredCases[currentCaseIndex - 1] || null
        : null

    const payload: AtencionMedicaPayload = {
      ingreso: { id: selectedCase.triaje.ingreso.id },
      medico: { id: user.id },
      diagnosticoPresuntivo: consultationData.diagnosis.trim(),
      conductaMedica: consultationData.treatment.trim(),
      observaciones: consultationData.observations.trim() || null,
      estadoResultante: consultationData.resultingStatusId
        ? { id: Number(consultationData.resultingStatusId) }
        : null,
    }

    setSaving(true)
    try {
      if (selectedCase.latestAttention) {
        await api.put(`/api/atenciones-medicas/${selectedCase.latestAttention.id}`, payload)
        toast.success('Atencion medica actualizada correctamente')
      } else {
        await api.post('/api/atenciones-medicas', payload)
        toast.success('Atencion medica registrada correctamente')
      }

      setSelectedIngresoId(nextCase?.ingresoId ?? null)
      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo guardar la atencion medica'))
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Card className="p-8 text-sm text-muted-foreground shadow-lg">
          Cargando triajes, signos vitales y atencion medica...
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex w-96 shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/30"
      >
        <div className="sticky top-0 z-10 border-b border-border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Pacientes en cola medica</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">Filtros</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Array.from(
                    new Map(
                      queuedCases.map((caseItem) => [
                        caseItem.triaje.prioridad.id,
                        caseItem.triaje.prioridad,
                      ]),
                    ).values(),
                  ).map((prioridad) => (
                    <SelectItem key={prioridad.id} value={String(prioridad.id)}>
                      {prioridad.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from(
                    new Map(
                      queuedCases.map((caseItem) => [
                        caseItem.triaje.ingreso.estadoActual.id,
                        caseItem.triaje.ingreso.estadoActual,
                      ]),
                    ).values(),
                  ).map((estado) => (
                    <SelectItem key={estado.id} value={String(estado.id)}>
                      {estado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2 p-3">
          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Stethoscope className="mb-2 h-12 w-12 opacity-50" />
                  <p className="text-sm">No hay pacientes con estos filtros</p>
                </div>
              ) : (
                filteredCases.map((caseItem, index) => (
                  <motion.div
                    key={caseItem.ingresoId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedIngresoId(caseItem.ingresoId)}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                      selectedCase?.ingresoId === caseItem.ingresoId
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-transparent bg-card hover:border-border hover:shadow'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {caseItem.triaje.ingreso.paciente.nombres} {caseItem.triaje.ingreso.paciente.apellidos}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {caseItem.triaje.ingreso.paciente.documentoIdentidad} •{' '}
                          {calculateAge(caseItem.triaje.ingreso.paciente.fechaNacimiento)} •{' '}
                          {caseItem.triaje.ingreso.paciente.sexo?.nombre || 'Sin sexo'}
                        </p>
                      </div>
                      {getPriorityBadge(caseItem)}
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm text-foreground/80">
                      {caseItem.triaje.ingreso.motivoConsulta}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Triaje: {formatTime(caseItem.triaje.fechaTriaje)}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-6 p-8">
          {!selectedCase ? (
            <Card className="p-8 text-sm text-muted-foreground shadow-lg">
              No hay pacientes en cola para consulta medica.
            </Card>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/20 p-6 shadow-lg">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h2 className="text-2xl font-bold">
                          {selectedCase.triaje.ingreso.paciente.nombres} {selectedCase.triaje.ingreso.paciente.apellidos}
                        </h2>
                        {getPriorityBadge(selectedCase)}
                      </div>
                      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>Doc: {selectedCase.triaje.ingreso.paciente.documentoIdentidad}</span>
                        <span>•</span>
                        <span>{calculateAge(selectedCase.triaje.ingreso.paciente.fechaNacimiento)}</span>
                        <span>•</span>
                        <span>Sexo: {selectedCase.triaje.ingreso.paciente.sexo?.nombre || 'No registrado'}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>Ingreso: {formatTime(selectedCase.triaje.ingreso.fechaHoraIngreso)}</span>
                        <span>•</span>
                        <span>Triaje: {formatTime(selectedCase.triaje.fechaTriaje)}</span>
                        <span>•</span>
                        <span>Estado: {selectedCase.triaje.ingreso.estadoActual?.nombre || 'No definido'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-accent/50 p-4">
                      <p className="mb-1 text-sm font-medium text-accent-foreground">Motivo de consulta</p>
                      <p>{selectedCase.triaje.ingreso.motivoConsulta}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="mb-1 text-sm font-medium">Alergias</p>
                      <p
                        className={
                          selectedCase.triaje.alergias &&
                          normalizeText(selectedCase.triaje.alergias) !== 'NINGUNA'
                            ? 'font-medium text-destructive'
                            : 'text-muted-foreground'
                        }
                      >
                        {selectedCase.triaje.alergias || 'No registradas'}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Activity className="h-5 w-5 text-primary" />
                    Resumen de triaje
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">Sintomas</p>
                      <p>{selectedCase.triaje.sintomas || 'Sin sintomas registrados'}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">Observaciones</p>
                      <p>{selectedCase.triaje.observaciones || 'Sin observaciones registradas'}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">Antecedentes relevantes</p>
                      <p>{selectedCase.triaje.antecedentesRelevantes || 'Sin antecedentes registrados'}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Heart className="h-5 w-5 text-primary" />
                    Signos vitales
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Temperatura</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatValue(selectedCase.signosVitales?.temperatura, ' C')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">Presion arterial</p>
                      <p className="text-2xl font-bold">
                        {selectedCase.signosVitales?.presionSistolica || 'N/D'}/
                        {selectedCase.signosVitales?.presionDiastolica || 'N/D'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">FC</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatValue(selectedCase.signosVitales?.frecuenciaCardiaca, ' lpm')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">Sat. O2</p>
                      <p className="text-2xl font-bold">
                        {formatValue(selectedCase.signosVitales?.saturacionOxigeno, '%')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">FR</p>
                      <p className="text-2xl font-bold">
                        {formatValue(selectedCase.signosVitales?.frecuenciaRespiratoria, ' rpm')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">Peso</p>
                      <p className="text-2xl font-bold">
                        {formatValue(selectedCase.signosVitales?.pesoKg, ' kg')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">Talla</p>
                      <p className="text-2xl font-bold">{formatHeight(selectedCase.signosVitales?.tallaM)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">Glucemia</p>
                      <p className="text-2xl font-bold">
                        {formatValue(selectedCase.signosVitales?.glucemia, ' mg/dL')}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-2 border-primary/20 p-6 shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Atencion medica
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Medico responsable</Label>
                      <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                        {user?.nombreCompleto || user?.username || 'Sesion no disponible'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnostico presuntivo *</Label>
                      <textarea
                        id="diagnosis"
                        value={consultationData.diagnosis}
                        onChange={(e) =>
                          setConsultationData((prev) => ({ ...prev, diagnosis: e.target.value }))
                        }
                        placeholder="Diagnostico medico basado en la evaluacion clinica..."
                        className="min-h-[100px] w-full resize-none rounded-md border border-input bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="treatment">Conducta medica / tratamiento *</Label>
                      <textarea
                        id="treatment"
                        value={consultationData.treatment}
                        onChange={(e) =>
                          setConsultationData((prev) => ({ ...prev, treatment: e.target.value }))
                        }
                        placeholder="Medicacion, procedimientos, indicaciones al paciente..."
                        className="min-h-[120px] w-full resize-none rounded-md border border-input bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medicalObservations">Observaciones medicas</Label>
                      <textarea
                        id="medicalObservations"
                        value={consultationData.observations}
                        onChange={(e) =>
                          setConsultationData((prev) => ({ ...prev, observations: e.target.value }))
                        }
                        placeholder="Notas adicionales, recomendaciones de seguimiento..."
                        className="min-h-[80px] w-full resize-none rounded-md border border-input bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resultingStatus">Estado resultante</Label>
                      <Select
                        value={consultationData.resultingStatusId || undefined}
                        onValueChange={(value) =>
                          setConsultationData((prev) => ({ ...prev, resultingStatusId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado resultante" />
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
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end"
              >
                <Button
                  onClick={handleSaveConsultation}
                  size="lg"
                  disabled={saving || !user?.id}
                  className="h-14 bg-primary px-8 text-lg shadow-lg hover:bg-primary/90"
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  {saving ? 'Guardando y avanzando...' : 'Guardar y pasar al siguiente'}
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MedicalConsultation
