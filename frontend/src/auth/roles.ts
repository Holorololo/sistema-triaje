import type { Usuario } from '../types/models'

export const APP_ROLES = ['ADMIN', 'RECEPCION', 'TRIAJE', 'MEDICO'] as const

export type AppRole = (typeof APP_ROLES)[number]

const DEFAULT_ROUTE_BY_ROLE: Record<AppRole, string> = {
  ADMIN: '/usuarios',
  RECEPCION: '/pacientes',
  TRIAJE: '/triaje',
  MEDICO: '/consulta-medica',
}

export function normalizeRoleName(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

export function getUserRole(user?: Usuario | null): AppRole | null {
  const normalizedRole = normalizeRoleName(user?.rol?.nombre)
  return APP_ROLES.includes(normalizedRole as AppRole) ? (normalizedRole as AppRole) : null
}

export function userHasRole(user: Usuario | null | undefined, allowedRoles: readonly AppRole[]) {
  const role = getUserRole(user)
  return role != null && allowedRoles.includes(role)
}

export function getDefaultRouteForUser(user?: Usuario | null) {
  const role = getUserRole(user)
  return role ? DEFAULT_ROUTE_BY_ROLE[role] : '/login'
}
