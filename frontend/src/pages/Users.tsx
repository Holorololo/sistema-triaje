import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { motion } from 'motion/react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
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
import { api } from '../lib/api'
import type { Rol, Usuario, UsuarioPayload } from '../types/models'

type ApiErrorBody = {
  status?: number
  error?: string
}

type UserFormState = {
  username: string
  passwordHash: string
  nombreCompleto: string
  email: string
  rolId: string
  activo: string
}

const emptyForm: UserFormState = {
  username: '',
  passwordHash: '',
  nombreCompleto: '',
  email: '',
  rolId: '',
  activo: 'true',
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorBody>
  return axiosError.response?.data?.error || fallback
}

function Users() {
  const [users, setUsers] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)),
    [users],
  )

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get<Usuario[]>('/api/usuarios'),
        api.get<Rol[]>('/api/roles'),
      ])

      setUsers(usersRes.data)
      setRoles(rolesRes.data)
    } catch (err) {
      setError('No se pudieron cargar los usuarios y roles del sistema.')
      toast.error(getApiErrorMessage(err, 'Error al cargar el módulo de usuarios'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function openCreateDialog() {
    setSelectedUser(null)
    setForm({
      ...emptyForm,
      rolId: roles[0] ? String(roles[0].id) : '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(user: Usuario) {
    setSelectedUser(user)
    setForm({
      username: user.username,
      passwordHash: '',
      nombreCompleto: user.nombreCompleto,
      email: user.email || '',
      rolId: user.rol?.id ? String(user.rol.id) : '',
      activo: String(user.activo ?? true),
    })
    setDialogOpen(true)
  }

  async function handleSaveUser() {
    if (!form.username.trim() || !form.nombreCompleto.trim() || !form.rolId) {
      toast.error('Completa username, nombre completo y rol.')
      return
    }

    if (!selectedUser && !form.passwordHash.trim()) {
      toast.error('La contraseña es obligatoria para crear el usuario.')
      return
    }

    const payload: UsuarioPayload = {
      username: form.username.trim(),
      passwordHash: form.passwordHash.trim() || null,
      nombreCompleto: form.nombreCompleto.trim(),
      email: form.email.trim() || null,
      rol: { id: Number(form.rolId) },
      activo: form.activo === 'true',
    }

    setSaving(true)
    try {
      if (selectedUser) {
        await api.put(`/api/usuarios/${selectedUser.id}`, payload)
        toast.success('Usuario actualizado correctamente')
      } else {
        await api.post('/api/usuarios', payload)
        toast.success('Usuario registrado correctamente')
      }

      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo guardar el usuario'))
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(user: Usuario) {
    const nextStatus = !(user.activo ?? true)
    setUpdatingStatusId(user.id)

    try {
      await api.patch(`/api/usuarios/${user.id}/activo`, null, {
        params: { activo: nextStatus },
      })
      toast.success(
        nextStatus
          ? `Usuario ${user.username} activado correctamente`
          : `Usuario ${user.username} desactivado correctamente`,
      )
      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo actualizar el estado del usuario'))
      console.error(err)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="space-y-6 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold">Gestión de usuarios</h2>
          <p className="mt-1 text-muted-foreground">Administración de personal y perfiles del sistema</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={openCreateDialog}>
          <Plus className="h-5 w-5" />
          Nuevo usuario
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="overflow-hidden shadow-lg">
          {error ? (
            <div className="p-6 text-sm text-destructive">{error}</div>
          ) : loading ? (
            <div className="p-6 text-sm text-muted-foreground">Cargando usuarios y roles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="border-b transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">{user.nombreCompleto}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.rol?.nombre || 'Sin rol'}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email || 'Sin correo'}</TableCell>
                      <TableCell>
                        <Badge variant={user.activo ? 'default' : 'secondary'}>
                          {user.activo ? 'activo' : 'inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={user.activo ? 'text-destructive' : 'text-emerald-600'}
                            onClick={() => handleToggleStatus(user)}
                            disabled={updatingStatusId === user.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Editar usuario' : 'Registrar usuario'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombreCompleto">Nombre completo</Label>
              <Input
                id="nombreCompleto"
                value={form.nombreCompleto}
                onChange={(e) => setForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordHash">
                {selectedUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </Label>
              <Input
                id="passwordHash"
                type="password"
                value={form.passwordHash}
                onChange={(e) => setForm((prev) => ({ ...prev, passwordHash: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={form.rolId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, rolId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={String(rol.id)}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.activo}
                onValueChange={(value) => setForm((prev) => ({ ...prev, activo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {roles.length === 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              No hay roles cargados en el backend. Debes crear al menos un rol antes de registrar usuarios.
            </div>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={saving || roles.length === 0}>
              {saving ? 'Guardando...' : selectedUser ? 'Actualizar usuario' : 'Registrar usuario'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Users
