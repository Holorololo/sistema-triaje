function resolveDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:8081'
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
  const hostname = window.location.hostname || 'localhost'

  return `${protocol}//${hostname}:8081`
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString().trim() || resolveDefaultApiBaseUrl()
