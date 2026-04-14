import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { motion } from 'motion/react'
import { Activity, BarChart3, Calendar, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { api } from '../lib/api'
import type { AtencionMedicaRecord, Ingreso, NivelPrioridad, TriajeRecord } from '../types/models'

type ApiErrorBody = {
  status?: number
  error?: string
}

type StatCard = {
  icon: typeof Users
  label: string
  value: string
  change: string
  color: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorBody>
  return axiosError.response?.data?.error || fallback
}

function normalizeText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function dateKey(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function monthKey(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDelta(current: number, previous: number, suffix = '%') {
  if (previous === 0) {
    if (current === 0) return 'Sin cambios'
    return `+${current} ${suffix === '%' ? 'nuevo' : suffix}`.trim()
  }

  const delta = ((current - previous) / previous) * 100
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(0)}%`
}

function formatDifference(current: number | null, previous: number | null, unit: string) {
  if (current == null) return 'Sin datos'
  if (previous == null) return `${current.toFixed(0)} ${unit}`

  const diff = current - previous
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(0)} ${unit}`
}

function average(numbers: number[]) {
  if (numbers.length === 0) return null
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length
}

function getWaitMinutes(triaje: TriajeRecord) {
  if (!triaje.ingreso.fechaHoraIngreso || !triaje.fechaTriaje) return null
  const ingreso = new Date(triaje.ingreso.fechaHoraIngreso).getTime()
  const clasificacion = new Date(triaje.fechaTriaje).getTime()
  if (Number.isNaN(ingreso) || Number.isNaN(clasificacion) || clasificacion < ingreso) return null
  return Math.round((clasificacion - ingreso) / 60000)
}

function csvEscape(value: unknown) {
  const stringValue = value == null ? '' : String(value)
  const escaped = stringValue.replace(/"/g, '""')
  return `"${escaped}"`
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    toast.error('No hay datos disponibles para exportar.')
    return
  }

  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ]

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function Reports() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [triajes, setTriajes] = useState<TriajeRecord[]>([])
  const [atenciones, setAtenciones] = useState<AtencionMedicaRecord[]>([])
  const [nivelesPrioridad, setNivelesPrioridad] = useState<NivelPrioridad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [ingresosRes, triajesRes, atencionesRes, prioridadesRes] = await Promise.all([
        api.get<Ingreso[]>('/api/ingresos'),
        api.get<TriajeRecord[]>('/api/triajes'),
        api.get<AtencionMedicaRecord[]>('/api/atenciones-medicas'),
        api.get<NivelPrioridad[]>('/api/catalogos/niveles-prioridad'),
      ])

      setIngresos(ingresosRes.data)
      setTriajes(triajesRes.data)
      setAtenciones(atencionesRes.data)
      setNivelesPrioridad(prioridadesRes.data.sort((a, b) => a.nivel - b.nivel))
    } catch (err) {
      setError('No se pudieron cargar los datos de reportes del sistema.')
      toast.error(getApiErrorMessage(err, 'Error al cargar reportes'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const reportData = useMemo(() => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const todayKey = dateKey(today.toISOString())
    const yesterdayKey = dateKey(yesterday.toISOString())
    const currentMonthKey = monthKey(today.toISOString())

    const attendedToday = atenciones.filter((atencion) => dateKey(atencion.fechaHoraAtencion) === todayKey)
    const attendedYesterday = atenciones.filter(
      (atencion) => dateKey(atencion.fechaHoraAtencion) === yesterdayKey,
    )

    const inTriageCount = ingresos.filter(
      (ingreso) => normalizeText(ingreso.estadoActual?.codigo) === 'EN_TRIAGE',
    ).length
    const activeCases = ingresos.filter((ingreso) => {
      const code = normalizeText(ingreso.estadoActual?.codigo)
      return code !== 'ALTA' && code !== 'CERRADO'
    }).length

    const criticalCases = triajes.filter((triaje) => {
      const priorityCode = normalizeText(triaje.prioridad?.codigo)
      const stateCode = normalizeText(triaje.ingreso.estadoActual?.codigo)
      return priorityCode === 'ROJO' && stateCode !== 'ALTA' && stateCode !== 'CERRADO'
    }).length

    const criticalToday = triajes.filter(
      (triaje) =>
        normalizeText(triaje.prioridad?.codigo) === 'ROJO' && dateKey(triaje.fechaTriaje) === todayKey,
    ).length

    const waitTimesToday = triajes
      .filter((triaje) => dateKey(triaje.fechaTriaje) === todayKey)
      .map(getWaitMinutes)
      .filter((value): value is number => value != null)

    const waitTimesYesterday = triajes
      .filter((triaje) => dateKey(triaje.fechaTriaje) === yesterdayKey)
      .map(getWaitMinutes)
      .filter((value): value is number => value != null)

    const avgWaitToday = average(waitTimesToday)
    const avgWaitYesterday = average(waitTimesYesterday)

    const priorityDistribution = nivelesPrioridad.map((nivel) => {
      const count = triajes.filter((triaje) => triaje.prioridad?.id === nivel.id).length
      return {
        ...nivel,
        count,
      }
    })

    const totalTriages = priorityDistribution.reduce((sum, item) => sum + item.count, 0)

    const monthlySummaryMap = new Map<
      string,
      { fecha: string; ingresos: number; triajes: number; atenciones: number }
    >()

    for (const ingreso of ingresos) {
      const key = dateKey(ingreso.fechaHoraIngreso)
      if (!key || monthKey(ingreso.fechaHoraIngreso) !== currentMonthKey) continue
      if (!monthlySummaryMap.has(key)) {
        monthlySummaryMap.set(key, { fecha: key, ingresos: 0, triajes: 0, atenciones: 0 })
      }
      monthlySummaryMap.get(key)!.ingresos += 1
    }

    for (const triaje of triajes) {
      const key = dateKey(triaje.fechaTriaje)
      if (!key || monthKey(triaje.fechaTriaje) !== currentMonthKey) continue
      if (!monthlySummaryMap.has(key)) {
        monthlySummaryMap.set(key, { fecha: key, ingresos: 0, triajes: 0, atenciones: 0 })
      }
      monthlySummaryMap.get(key)!.triajes += 1
    }

    for (const atencion of atenciones) {
      const key = dateKey(atencion.fechaHoraAtencion)
      if (!key || monthKey(atencion.fechaHoraAtencion) !== currentMonthKey) continue
      if (!monthlySummaryMap.has(key)) {
        monthlySummaryMap.set(key, { fecha: key, ingresos: 0, triajes: 0, atenciones: 0 })
      }
      monthlySummaryMap.get(key)!.atenciones += 1
    }

    const statsCards: StatCard[] = [
      {
        icon: Users,
        label: 'Pacientes Atendidos Hoy',
        value: String(attendedToday.length),
        change: formatDelta(attendedToday.length, attendedYesterday.length),
        color: 'text-blue-600',
      },
      {
        icon: Activity,
        label: 'En Triaje',
        value: String(inTriageCount),
        change: activeCases === 0 ? 'Sin casos abiertos' : `${Math.round((inTriageCount / activeCases) * 100)}% activos`,
        color: 'text-yellow-600',
      },
      {
        icon: TrendingUp,
        label: 'Casos Críticos',
        value: String(criticalCases),
        change: `${criticalToday} hoy`,
        color: 'text-red-600',
      },
      {
        icon: Calendar,
        label: 'Tiempo Promedio Espera',
        value: avgWaitToday == null ? 'N/D' : `${avgWaitToday.toFixed(0)} min`,
        change: formatDifference(avgWaitToday, avgWaitYesterday, 'min'),
        color: 'text-green-600',
      },
    ]

    return {
      statsCards,
      priorityDistribution,
      totalTriages,
      dailyAttentionRows: attendedToday.map((atencion) => ({
        fecha: atencion.fechaHoraAtencion || '',
        paciente: `${atencion.ingreso.paciente.nombres} ${atencion.ingreso.paciente.apellidos}`,
        documento: atencion.ingreso.paciente.documentoIdentidad,
        medico: atencion.medico?.nombreCompleto || '',
        diagnostico: atencion.diagnosticoPresuntivo || '',
        estado: atencion.estadoResultante?.nombre || atencion.ingreso.estadoActual?.nombre || '',
      })),
      monthlySummaryRows: Array.from(monthlySummaryMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha)),
      waitTimesRows: triajes
        .map((triaje) => ({
          paciente: `${triaje.ingreso.paciente.nombres} ${triaje.ingreso.paciente.apellidos}`,
          documento: triaje.ingreso.paciente.documentoIdentidad,
          ingreso: triaje.ingreso.fechaHoraIngreso || '',
          triaje: triaje.fechaTriaje || '',
          prioridad: triaje.prioridad?.codigo || '',
          esperaMinutos: getWaitMinutes(triaje) ?? '',
        }))
        .filter((row) => row.esperaMinutos !== ''),
      priorityRows: priorityDistribution.map((item) => ({
        prioridad: item.codigo,
        descripcion: item.descripcion,
        nivel: item.nivel,
        cantidad: item.count,
      })),
    }
  }, [ingresos, triajes, atenciones, nivelesPrioridad])

  function exportDailyAttentions() {
    downloadCsv('reporte-diario-atenciones.csv', reportData.dailyAttentionRows)
    if (reportData.dailyAttentionRows.length) {
      toast.success('Reporte diario exportado correctamente')
    }
  }

  function exportMonthlyStats() {
    downloadCsv('estadisticas-mensuales.csv', reportData.monthlySummaryRows)
    if (reportData.monthlySummaryRows.length) {
      toast.success('Estadísticas mensuales exportadas correctamente')
    }
  }

  function exportWaitTimes() {
    downloadCsv('tiempos-espera.csv', reportData.waitTimesRows)
    if (reportData.waitTimesRows.length) {
      toast.success('Reporte de tiempos exportado correctamente')
    }
  }

  function exportPriorityDistribution() {
    downloadCsv('distribucion-prioridades.csv', reportData.priorityRows)
    if (reportData.priorityRows.length) {
      toast.success('Distribución por prioridad exportada correctamente')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Card className="p-8 text-sm text-muted-foreground shadow-lg">
          Cargando estadísticas operativas del sistema...
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold">Reportes y estadísticas</h2>
        <p className="mt-1 text-muted-foreground">Análisis de actividad del sistema con datos reales del backend</p>
      </motion.div>

      {error ? (
        <Card className="p-6 text-sm text-destructive shadow-lg">{error}</Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {reportData.statsCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 shadow-lg transition-shadow hover:shadow-xl">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    <span className="text-right text-sm font-medium text-muted-foreground">{stat.change}</span>
                  </div>
                  <p className="mb-1 text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-6 xl:grid-cols-2"
          >
            <Card className="p-6 shadow-lg">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <BarChart3 className="h-5 w-5 text-primary" />
                Atenciones por prioridad
              </h3>

              {reportData.totalTriages === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay triajes registrados para calcular esta distribución.
                </p>
              ) : (
                <div className="space-y-4">
                  {reportData.priorityDistribution.map((item) => {
                    const width = reportData.totalTriages === 0 ? 0 : (item.count / reportData.totalTriages) * 100
                    const colorClass =
                      normalizeText(item.codigo) === 'ROJO'
                        ? 'bg-red-600'
                        : normalizeText(item.codigo) === 'NARANJA'
                          ? 'bg-orange-500'
                          : normalizeText(item.codigo) === 'AMARILLO'
                            ? 'bg-amber-500'
                            : normalizeText(item.codigo) === 'VERDE'
                              ? 'bg-emerald-500'
                              : 'bg-sky-500'

                    return (
                      <div key={item.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            Prioridad {item.nivel} - {item.codigo}
                          </span>
                          <span className="font-medium">{item.count} pacientes</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${colorClass}`}
                            style={{ width: `${Math.max(width, item.count > 0 ? 6 : 0)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card className="p-6 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold">Reportes disponibles</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={exportDailyAttentions}>
                  Reporte Diario de Atenciones
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={exportMonthlyStats}>
                  Estadísticas Mensuales
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={exportWaitTimes}>
                  Tiempos de Espera
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={exportPriorityDistribution}>
                  Distribución por Prioridad
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Los archivos se exportan en formato CSV usando los datos cargados desde Spring Boot.
              </p>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}

export default Reports
