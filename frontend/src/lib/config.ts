export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString().trim() || 'http://localhost:8081'

export const DEFAULT_USUARIO_REGISTRO_ID = Number(
  import.meta.env.VITE_USUARIO_REGISTRO_ID || 1,
)
