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

export interface Usuario {
  id: number
  username: string
  nombreCompleto: string
  email?: string | null
  activo?: boolean | null
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
