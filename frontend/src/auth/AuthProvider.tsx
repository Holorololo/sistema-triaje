import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AxiosError } from 'axios'
import { api, setApiAuthToken } from '../lib/api'
import type { AuthResponse, Usuario } from '../types/models'

type AuthContextValue = {
  user: Usuario | null
  token: string | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
}

type ApiErrorBody = {
  error?: string
}

type StoredSession = {
  token: string
  user: Usuario
}

const STORAGE_KEY = 'triaje-auth-session'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredSession(): StoredSession | null {
  const rawSession = window.localStorage.getItem(STORAGE_KEY)
  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as StoredSession
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function storeSession(session: StoredSession | null) {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = readStoredSession()
    if (!session) {
      setLoading(false)
      return
    }

    setApiAuthToken(session.token)
    setToken(session.token)

    void api
      .get<Usuario>('/api/auth/me')
      .then((response) => {
        const nextSession = { token: session.token, user: response.data }
        setUser(response.data)
        storeSession(nextSession)
      })
      .catch(() => {
        setApiAuthToken(null)
        setToken(null)
        setUser(null)
        storeSession(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorBody>) => {
        if (error.response?.status === 401) {
          setApiAuthToken(null)
          setToken(null)
          setUser(null)
          storeSession(null)
        }

        return Promise.reject(error)
      },
    )

    return () => {
      api.interceptors.response.eject(interceptor)
    }
  }, [])

  async function login(identifier: string, password: string) {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      identifier,
      password,
    })

    const nextSession = {
      token: response.data.token,
      user: response.data.usuario,
    }

    setApiAuthToken(nextSession.token)
    setToken(nextSession.token)
    setUser(nextSession.user)
    storeSession(nextSession)
  }

  function logout() {
    setApiAuthToken(null)
    setToken(null)
    setUser(null)
    storeSession(null)
  }

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}
