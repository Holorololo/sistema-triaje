export interface Sexo {
  id: number
  nombre: string
}

export interface TipoIngreso {
  id: number
  nombre: string
}

export interface EstadoCaso {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
}

export interface Rol {
  id: number
  nombre: string
}

export interface NivelPrioridad {
  id: number
  nivel: number
  codigo: string
  descripcion: string
  color: string
  tiempoMaximoMinutos?: number | null
}

export interface Usuario {
  id: number
  username: string
  nombreCompleto: string
  email?: string | null
  rol: Rol
  activo?: boolean | null
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export interface AuthResponse {
  token: string
  usuario: Usuario
}

export interface Paciente {
  id: number
  nombres: string
  apellidos: string
  documentoIdentidad: string
  fechaNacimiento?: string | null
  sexo?: Sexo | null
  telefono?: string | null
  direccion?: string | null
  contactoEmergenciaNombre?: string | null
  contactoEmergenciaTelefono?: string | null
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export interface Ingreso {
  id: number
  paciente: Paciente
  motivoConsulta: string
  tipoIngreso?: TipoIngreso | null
  estadoActual: EstadoCaso
  usuarioRegistro?: { id: number } | null
  observacionesRecepcion?: string | null
  fechaHoraIngreso?: string | null
}

export interface PacientePayload {
  nombres: string
  apellidos: string
  documentoIdentidad: string
  fechaNacimiento?: string | null
  sexo: { id: number } | null
  telefono?: string | null
  direccion?: string | null
  contactoEmergenciaNombre?: string | null
  contactoEmergenciaTelefono?: string | null
}

export interface IngresoPayload {
  paciente: { id: number }
  motivoConsulta: string
  tipoIngreso: { id: number } | null
  estadoActual: { id: number }
  usuarioRegistro: { id: number }
  observacionesRecepcion?: string | null
}

export interface UsuarioPayload {
  username: string
  passwordHash?: string | null
  nombreCompleto: string
  email?: string | null
  rol: { id: number }
  activo?: boolean | null
}

export interface TriajeRecord {
  id: number
  ingreso: Ingreso
  prioridad: NivelPrioridad
  estado: EstadoCaso
  sintomas?: string | null
  observaciones?: string | null
  alergias?: string | null
  antecedentesRelevantes?: string | null
  embarazada?: boolean | null
  dificultadRespiratoria?: boolean | null
  sangradoActivo?: boolean | null
  fiebre?: boolean | null
  nivelDolor?: number | null
  clasificadoPor?: Usuario | null
  fechaTriaje?: string | null
}

export interface SignoVitalRecord {
  id: number
  triaje: TriajeRecord
  temperatura?: number | string | null
  presionSistolica?: number | null
  presionDiastolica?: number | null
  frecuenciaCardiaca?: number | null
  frecuenciaRespiratoria?: number | null
  saturacionOxigeno?: number | string | null
  pesoKg?: number | string | null
  tallaM?: number | string | null
  glucemia?: number | string | null
  registradoEn?: string | null
}

export interface AtencionMedicaRecord {
  id: number
  ingreso: Ingreso
  medico: Usuario
  fechaHoraAtencion?: string | null
  diagnosticoPresuntivo?: string | null
  conductaMedica?: string | null
  observaciones?: string | null
  estadoResultante?: EstadoCaso | null
}

export interface AtencionMedicaPayload {
  ingreso: { id: number }
  medico: { id: number }
  diagnosticoPresuntivo: string
  conductaMedica: string
  observaciones?: string | null
  estadoResultante: { id: number } | null
}
