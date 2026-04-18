import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { AnimatePresence, motion } from 'motion/react'
import {
  Activity,
  AlertCircle,
  Droplets,
  Heart,
  Ruler,
  Thermometer,
  Weight,
  Wind,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { api } from '../lib/api'
import { DEFAULT_USUARIO_REGISTRO_ID } from '../lib/config'
import type { EstadoCaso, Ingreso, NivelPrioridad, TriajeRecord, Usuario } from '../types/models'

type ApiErrorBody = {
  status?: number
  error?: string
}

type TriageFormState = {
  symptoms: string
  observations: string
  allergies: string
  relevantHistory: string
  isPregnant: boolean
  hasRespiratoryDistress: boolean
  hasActiveBleeding: boolean
  hasFever: boolean
  painLevel: string
  temperature: string
  systolicBP: string
  diastolicBP: string
  heartRate: string
  respiratoryRate: string
  oxygenSaturation: string
  weight: string
  height: string
  bloodGlucose: string
  priorityId: string
  statusId: string
  classifiedById: string
}

type PriorityAppearance = {
  badge: string
  container: string
  accent: string
  text: string
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

const vitalRanges = {
  temperature: { min: 30, max: 45, label: 'La temperatura' },
  systolicBP: { min: 50, max: 300, label: 'La presión sistólica' },
  diastolicBP: { min: 30, max: 200, label: 'La presión diastólica' },
  heartRate: { min: 20, max: 250, label: 'La frecuencia cardíaca' },
  respiratoryRate: { min: 5, max: 80, label: 'La frecuencia respiratoria' },
  oxygenSaturation: { min: 0, max: 100, label: 'La saturación de oxígeno' },
  weight: { min: 0, max: 500, label: 'El peso' },
  heightCm: { min: 30, max: 250, label: 'La talla' },
  bloodGlucose: { min: 0, max: 1000, label: 'La glucemia' },
} as const

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

  return `${age} años`
}

function formatAdmissionTime(value?: string | null) {
  if (!value) return 'Sin hora'
  return new Date(value).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPatientSexLabel(ingreso: Ingreso) {
  const sexoNombre = ingreso.paciente.sexo?.nombre
  if (!sexoNombre) return 'Sin sexo'
  if (normalizeText(sexoNombre).startsWith('M')) return 'M'
  if (normalizeText(sexoNombre).startsWith('F')) return 'F'
  return sexoNombre
}

function getPreferredTriageStateId(estados: EstadoCaso[]) {
  const preferred = estados.find((estado) => {
    const combined = `${estado.codigo} ${estado.nombre}`
    return normalizeText(combined).includes('TRIAJ')
  })
  return preferred ? String(preferred.id) : estados[0] ? String(estados[0].id) : ''
}

function buildEmptyForm(defaultStatusId = '', defaultUserId = ''): TriageFormState {
  return {
    symptoms: '',
    observations: '',
    allergies: '',
    relevantHistory: '',
    isPregnant: false,
    hasRespiratoryDistress: false,
    hasActiveBleeding: false,
    hasFever: false,
    painLevel: '0',
    temperature: '',
    systolicBP: '',
    diastolicBP: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    bloodGlucose: '',
    priorityId: '',
    statusId: defaultStatusId,
    classifiedById: defaultUserId,
  }
}

function parseInteger(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function parseDecimal(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseFloat(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

function convertHeightToMeters(value: string) {
  const parsed = parseDecimal(value)
  if (parsed == null) return null
  return parsed > 10 ? Number((parsed / 100).toFixed(2)) : parsed
}

function hasVitalSigns(form: TriageFormState) {
  return [
    form.temperature,
    form.systolicBP,
    form.diastolicBP,
    form.heartRate,
    form.respiratoryRate,
    form.oxygenSaturation,
    form.weight,
    form.height,
    form.bloodGlucose,
  ].some((value) => value.trim() !== '')
}

function validateFieldRange(
  rawValue: string,
  min: number,
  max: number,
  label: string,
) {
  const trimmed = rawValue.trim()
  if (!trimmed) return null
  const value = Number(trimmed)
  if (Number.isNaN(value)) {
    return `${label} debe ser un número válido`
  }
  if (value < min || value > max) {
    return `${label} debe estar entre ${min} y ${max}`
  }
  return null
}

function validateVitalSigns(form: TriageFormState) {
  const messages = [
    validateFieldRange(
      form.temperature,
      vitalRanges.temperature.min,
      vitalRanges.temperature.max,
      vitalRanges.temperature.label,
    ),
    validateFieldRange(
      form.systolicBP,
      vitalRanges.systolicBP.min,
      vitalRanges.systolicBP.max,
      vitalRanges.systolicBP.label,
    ),
    validateFieldRange(
      form.diastolicBP,
      vitalRanges.diastolicBP.min,
      vitalRanges.diastolicBP.max,
      vitalRanges.diastolicBP.label,
    ),
    validateFieldRange(
      form.heartRate,
      vitalRanges.heartRate.min,
      vitalRanges.heartRate.max,
      vitalRanges.heartRate.label,
    ),
    validateFieldRange(
      form.respiratoryRate,
      vitalRanges.respiratoryRate.min,
      vitalRanges.respiratoryRate.max,
      vitalRanges.respiratoryRate.label,
    ),
    validateFieldRange(
      form.oxygenSaturation,
      vitalRanges.oxygenSaturation.min,
      vitalRanges.oxygenSaturation.max,
      vitalRanges.oxygenSaturation.label,
    ),
    validateFieldRange(form.weight, vitalRanges.weight.min, vitalRanges.weight.max, vitalRanges.weight.label),
    validateFieldRange(
      form.height,
      vitalRanges.heightCm.min,
      vitalRanges.heightCm.max,
      `${vitalRanges.heightCm.label} en cm`,
    ),
    validateFieldRange(
      form.bloodGlucose,
      vitalRanges.bloodGlucose.min,
      vitalRanges.bloodGlucose.max,
      vitalRanges.bloodGlucose.label,
    ),
  ].filter((message): message is string => Boolean(message))

  const systolic = parseInteger(form.systolicBP)
  const diastolic = parseInteger(form.diastolicBP)
  if (systolic != null && diastolic != null && systolic < diastolic) {
    messages.push('La presión sistólica no puede ser menor que la diastólica')
  }

  return messages
}

function getPriorityAppearance(prioridad: NivelPrioridad) {
  return priorityStyles[normalizeText(prioridad.codigo)] || {
    badge: 'bg-slate-600',
    container: 'border-slate-300 bg-slate-50',
    accent: 'border-slate-500',
    text: 'text-slate-700',
  }
}

function Triage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [triajes, setTriajes] = useState<TriajeRecord[]>([])
  const [prioridades, setPrioridades] = useState<NivelPrioridad[]>([])
  const [estadosCaso, setEstadosCaso] = useState<EstadoCaso[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [selectedIngresoId, setSelectedIngresoId] = useState<number | null>(null)
  const [triageData, setTriageData] = useState<TriageFormState>(buildEmptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pendingIngresos = useMemo(() => {
    const triageIngresoIds = new Set(triajes.map((triaje) => triaje.ingreso.id))
    return ingresos
      .filter((ingreso) => !triageIngresoIds.has(ingreso.id))
      .filter((ingreso) => normalizeText(ingreso.estadoActual?.codigo) !== 'ALTA')
      .sort((a, b) => {
        const aTime = a.fechaHoraIngreso ? new Date(a.fechaHoraIngreso).getTime() : 0
        const bTime = b.fechaHoraIngreso ? new Date(b.fechaHoraIngreso).getTime() : 0
        return aTime - bTime
      })
  }, [ingresos, triajes])

  const selectedIngreso = useMemo(
    () => pendingIngresos.find((ingreso) => ingreso.id === selectedIngresoId) || pendingIngresos[0] || null,
    [pendingIngresos, selectedIngresoId],
  )

  const preferredUser = useMemo(
    () => usuarios.find((usuario) => usuario.id === DEFAULT_USUARIO_REGISTRO_ID) || usuarios[0] || null,
    [usuarios],
  )

  const preferredStatusId = useMemo(() => getPreferredTriageStateId(estadosCaso), [estadosCaso])

  const selectedPriority = useMemo(
    () => prioridades.find((prioridad) => String(prioridad.id) === triageData.priorityId) || null,
    [prioridades, triageData.priorityId],
  )

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [ingresosRes, triajesRes, prioridadesRes, estadosRes, usuariosRes] = await Promise.all([
        api.get<Ingreso[]>('/api/ingresos'),
        api.get<TriajeRecord[]>('/api/triajes'),
        api.get<NivelPrioridad[]>('/api/catalogos/niveles-prioridad'),
        api.get<EstadoCaso[]>('/api/catalogos/estados-caso'),
        api.get<Usuario[]>('/api/usuarios'),
      ])

      setIngresos(ingresosRes.data)
      setTriajes(triajesRes.data)
      setPrioridades(prioridadesRes.data.sort((a, b) => a.nivel - b.nivel))
      setEstadosCaso(estadosRes.data)
      setUsuarios(usuariosRes.data)
    } catch (err) {
      setError('No se pudieron cargar los ingresos pendientes ni los catálogos de triaje.')
      toast.error(getApiErrorMessage(err, 'Error al cargar el módulo de triaje'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (!pendingIngresos.length) {
      if (selectedIngresoId !== null) {
        setSelectedIngresoId(null)
      }
      return
    }

    const exists = pendingIngresos.some((ingreso) => ingreso.id === selectedIngresoId)
    if (!exists) {
      setSelectedIngresoId(pendingIngresos[0].id)
    }
  }, [pendingIngresos, selectedIngresoId])

  useEffect(() => {
    if (!selectedIngreso) return
    setTriageData(buildEmptyForm(preferredStatusId, preferredUser ? String(preferredUser.id) : ''))
  }, [selectedIngreso?.id, preferredStatusId, preferredUser?.id])

  async function handleSaveTriage() {
    if (!selectedIngreso) {
      toast.error('Selecciona un ingreso pendiente para registrar el triaje.')
      return
    }

    if (!triageData.priorityId) {
      toast.error('Por favor selecciona una prioridad.')
      return
    }

    if (!triageData.statusId) {
      toast.error('Selecciona el estado del paciente.')
      return
    }

    if (!triageData.classifiedById) {
      toast.error('Selecciona el usuario que clasifica el triaje.')
      return
    }

    const vitalErrors = validateVitalSigns(triageData)
    if (vitalErrors.length > 0) {
      toast.error(vitalErrors[0])
      return
    }

    setSaving(true)

    try {
      const triajePayload = {
        ingreso: { id: selectedIngreso.id },
        prioridad: { id: Number(triageData.priorityId) },
        estado: { id: Number(triageData.statusId) },
        sintomas: triageData.symptoms || null,
        observaciones: triageData.observations || null,
        alergias: triageData.allergies || null,
        antecedentesRelevantes: triageData.relevantHistory || null,
        embarazada: triageData.isPregnant,
        dificultadRespiratoria: triageData.hasRespiratoryDistress,
        sangradoActivo: triageData.hasActiveBleeding,
        fiebre: triageData.hasFever,
        nivelDolor: parseInteger(triageData.painLevel) ?? 0,
        clasificadoPor: { id: Number(triageData.classifiedById) },
      }

      const triajeRes = await api.post<TriajeRecord>('/api/triajes', triajePayload)

      if (hasVitalSigns(triageData)) {
        const signosPayload = {
          triaje: { id: triajeRes.data.id },
          temperatura: parseDecimal(triageData.temperature),
          presionSistolica: parseInteger(triageData.systolicBP),
          presionDiastolica: parseInteger(triageData.diastolicBP),
          frecuenciaCardiaca: parseInteger(triageData.heartRate),
          frecuenciaRespiratoria: parseInteger(triageData.respiratoryRate),
          saturacionOxigeno: parseDecimal(triageData.oxygenSaturation),
          pesoKg: parseDecimal(triageData.weight),
          tallaM: convertHeightToMeters(triageData.height),
          glucemia: parseDecimal(triageData.bloodGlucose),
        }

        await api.post('/api/signos-vitales', signosPayload)
      }

      toast.success(
        `Triaje registrado para ${selectedIngreso.paciente.nombres} ${selectedIngreso.paciente.apellidos}`,
        {
          description: selectedPriority
            ? `Prioridad asignada: ${selectedPriority.codigo} - ${selectedPriority.descripcion}`
            : 'Clasificación registrada correctamente.',
        },
      )

      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar el triaje'))
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Card className="p-8 text-sm text-muted-foreground shadow-lg">
          Cargando ingresos pendientes, prioridades y estados clínicos...
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 shrink-0 border-r border-border bg-muted/30"
      >
        <div className="sticky top-0 z-10 border-b border-border bg-card p-4">
          <h3 className="text-lg font-semibold">Pacientes pendientes</h3>
          <p className="text-sm text-muted-foreground">{pendingIngresos.length} en espera de triaje</p>
        </div>

        <div className="space-y-2 p-3">
          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : pendingIngresos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
              No hay ingresos pendientes de clasificar en este momento.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {pendingIngresos.map((ingreso, index) => (
                <motion.button
                  key={ingreso.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelectedIngresoId(ingreso.id)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                    selectedIngreso?.id === ingreso.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-transparent bg-card hover:border-border hover:shadow'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {ingreso.paciente.nombres} {ingreso.paciente.apellidos}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ingreso.paciente.documentoIdentidad} · {calculateAge(ingreso.paciente.fechaNacimiento)} ·{' '}
                        {getPatientSexLabel(ingreso)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatAdmissionTime(ingreso.fechaHoraIngreso)}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-foreground/80">{ingreso.motivoConsulta}</p>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-6 p-8">
          {!selectedIngreso ? (
            <Card className="p-8 text-sm text-muted-foreground shadow-lg">
              No hay un paciente seleccionado para triaje.
            </Card>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border bg-gradient-to-br from-card to-muted/20 p-6 shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="mb-2 text-2xl font-bold">
                        {selectedIngreso.paciente.nombres} {selectedIngreso.paciente.apellidos}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>Doc: {selectedIngreso.paciente.documentoIdentidad}</span>
                        <span>•</span>
                        <span>{calculateAge(selectedIngreso.paciente.fechaNacimiento)}</span>
                        <span>•</span>
                        <span>Sexo: {selectedIngreso.paciente.sexo?.nombre || 'No registrado'}</span>
                        <span>•</span>
                        <span>Ingreso: {formatAdmissionTime(selectedIngreso.fechaHoraIngreso)}</span>
                      </div>
                      <div className="mt-3 rounded-md bg-accent/50 p-3">
                        <p className="text-sm font-medium text-accent-foreground">Motivo de consulta:</p>
                        <p>{selectedIngreso.motivoConsulta}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 text-sm">
                      {selectedIngreso.estadoActual?.nombre || 'Pendiente'}
                    </Badge>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <Card className="p-6 shadow-lg">
                  <h3 className="mb-4 text-xl font-semibold">Evaluación inicial</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="symptoms">Síntomas</Label>
                      <textarea
                        id="symptoms"
                        value={triageData.symptoms}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, symptoms: e.target.value }))
                        }
                        placeholder="Descripción detallada de los síntomas..."
                        className="min-h-[80px] w-full resize-none rounded-md border border-input bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observations">Observaciones</Label>
                      <textarea
                        id="observations"
                        value={triageData.observations}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, observations: e.target.value }))
                        }
                        placeholder="Observaciones generales del paciente..."
                        className="min-h-[80px] w-full resize-none rounded-md border border-input bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="allergies">Alergias</Label>
                        <Input
                          id="allergies"
                          value={triageData.allergies}
                          onChange={(e) =>
                            setTriageData((prev) => ({ ...prev, allergies: e.target.value }))
                          }
                          placeholder="Alergias conocidas"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relevantHistory">Antecedentes relevantes</Label>
                        <Input
                          id="relevantHistory"
                          value={triageData.relevantHistory}
                          onChange={(e) =>
                            setTriageData((prev) => ({ ...prev, relevantHistory: e.target.value }))
                          }
                          placeholder="Antecedentes médicos relevantes"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-4 md:grid-cols-2">
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="pregnant" className="cursor-pointer">
                          Embarazada
                        </Label>
                        <Switch
                          id="pregnant"
                          checked={triageData.isPregnant}
                          onCheckedChange={(checked) =>
                            setTriageData((prev) => ({ ...prev, isPregnant: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="respiratory" className="cursor-pointer">
                          Dificultad respiratoria
                        </Label>
                        <Switch
                          id="respiratory"
                          checked={triageData.hasRespiratoryDistress}
                          onCheckedChange={(checked) =>
                            setTriageData((prev) => ({ ...prev, hasRespiratoryDistress: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="bleeding" className="cursor-pointer">
                          Sangrado activo
                        </Label>
                        <Switch
                          id="bleeding"
                          checked={triageData.hasActiveBleeding}
                          onCheckedChange={(checked) =>
                            setTriageData((prev) => ({ ...prev, hasActiveBleeding: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="fever" className="cursor-pointer">
                          Fiebre
                        </Label>
                        <Switch
                          id="fever"
                          checked={triageData.hasFever}
                          onCheckedChange={(checked) =>
                            setTriageData((prev) => ({ ...prev, hasFever: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="painLevel">Nivel de dolor (0-10)</Label>
                      <div className="flex items-center gap-4">
                        <input
                          id="painLevel"
                          type="range"
                          min="0"
                          max="10"
                          value={triageData.painLevel}
                          onChange={(e) =>
                            setTriageData((prev) => ({ ...prev, painLevel: e.target.value }))
                          }
                          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                        />
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
                          {triageData.painLevel}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
              >
                <Card className="p-6 shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Activity className="h-5 w-5 text-primary" />
                    Signos vitales
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="temperature" className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4" />
                        Temperatura (°C)
                      </Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        min={vitalRanges.temperature.min}
                        max={vitalRanges.temperature.max}
                        value={triageData.temperature}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, temperature: e.target.value }))
                        }
                        placeholder="36.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="systolicBP">Presión sistólica (mmHg)</Label>
                      <Input
                        id="systolicBP"
                        type="number"
                        min={vitalRanges.systolicBP.min}
                        max={vitalRanges.systolicBP.max}
                        value={triageData.systolicBP}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, systolicBP: e.target.value }))
                        }
                        placeholder="120"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diastolicBP">Presión diastólica (mmHg)</Label>
                      <Input
                        id="diastolicBP"
                        type="number"
                        min={vitalRanges.diastolicBP.min}
                        max={vitalRanges.diastolicBP.max}
                        value={triageData.diastolicBP}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, diastolicBP: e.target.value }))
                        }
                        placeholder="80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heartRate" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Frecuencia cardíaca (lpm)
                      </Label>
                      <Input
                        id="heartRate"
                        type="number"
                        min={vitalRanges.heartRate.min}
                        max={vitalRanges.heartRate.max}
                        value={triageData.heartRate}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, heartRate: e.target.value }))
                        }
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="respiratoryRate" className="flex items-center gap-2">
                        <Wind className="h-4 w-4" />
                        Frecuencia respiratoria (rpm)
                      </Label>
                      <Input
                        id="respiratoryRate"
                        type="number"
                        min={vitalRanges.respiratoryRate.min}
                        max={vitalRanges.respiratoryRate.max}
                        value={triageData.respiratoryRate}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, respiratoryRate: e.target.value }))
                        }
                        placeholder="16"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oxygenSaturation" className="flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Saturación O₂ (%)
                      </Label>
                      <Input
                        id="oxygenSaturation"
                        type="number"
                        step="0.1"
                        min={vitalRanges.oxygenSaturation.min}
                        max={vitalRanges.oxygenSaturation.max}
                        value={triageData.oxygenSaturation}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, oxygenSaturation: e.target.value }))
                        }
                        placeholder="98"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="flex items-center gap-2">
                        <Weight className="h-4 w-4" />
                        Peso (kg)
                      </Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min={vitalRanges.weight.min}
                        max={vitalRanges.weight.max}
                        value={triageData.weight}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, weight: e.target.value }))
                        }
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Talla (cm)
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        min={vitalRanges.heightCm.min}
                        max={vitalRanges.heightCm.max}
                        value={triageData.height}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, height: e.target.value }))
                        }
                        placeholder="170"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodGlucose">Glucemia (mg/dL)</Label>
                      <Input
                        id="bloodGlucose"
                        type="number"
                        step="0.1"
                        min={vitalRanges.bloodGlucose.min}
                        max={vitalRanges.bloodGlucose.max}
                        value={triageData.bloodGlucose}
                        onChange={(e) =>
                          setTriageData((prev) => ({ ...prev, bloodGlucose: e.target.value }))
                        }
                        placeholder="90"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
              >
                <Card className="border-2 border-primary/20 p-6 shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Clasificación clínica
                  </h3>

                  <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {prioridades.map((prioridad) => {
                      const appearance = getPriorityAppearance(prioridad)
                      const isSelected = triageData.priorityId === String(prioridad.id)

                      return (
                        <motion.button
                          key={prioridad.id}
                          type="button"
                          onClick={() =>
                            setTriageData((prev) => ({ ...prev, priorityId: String(prioridad.id) }))
                          }
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`rounded-xl border-2 p-6 text-left transition-all duration-200 ${
                            isSelected
                              ? `${appearance.accent} ${appearance.container} shadow-lg`
                              : 'border-border bg-card hover:border-border/50 hover:shadow'
                          }`}
                        >
                          <div
                            className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold text-white ${appearance.badge}`}
                          >
                            {prioridad.nivel}
                          </div>
                          <p className={`mb-1 font-bold ${isSelected ? appearance.text : 'text-foreground'}`}>
                            {prioridad.codigo}
                          </p>
                          <p className="text-sm text-muted-foreground">{prioridad.descripcion}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Tiempo máximo: {prioridad.tiempoMaximoMinutos ?? 'No definido'} min
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Estado del paciente</Label>
                      <Select
                        value={triageData.statusId || undefined}
                        onValueChange={(value) =>
                          setTriageData((prev) => ({ ...prev, statusId: value }))
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
                    <div className="space-y-2">
                      <Label>Clasificado por</Label>
                      <Select
                        value={triageData.classifiedById || undefined}
                        onValueChange={(value) =>
                          setTriageData((prev) => ({ ...prev, classifiedById: value }))
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
                          No hay usuarios cargados en el backend para clasificar triajes.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="flex justify-end"
              >
                <Button
                  onClick={handleSaveTriage}
                  size="lg"
                  disabled={saving || usuarios.length === 0}
                  className="h-14 bg-primary px-8 text-lg shadow-lg hover:bg-primary/90"
                >
                  <Activity className="mr-2 h-5 w-5" />
                  {saving ? 'Guardando triaje...' : 'Guardar clasificación de triaje'}
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Triage
