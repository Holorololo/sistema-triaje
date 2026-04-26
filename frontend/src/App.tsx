import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute, RoleHomeRedirect, RoleProtectedRoute } from './auth/RouteGuards'
import { Toaster } from './components/sonner'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import MedicalConsultation from './pages/MedicalConsultation'
import Patients from './pages/Patients'
import Reports from './pages/Reports'
import Triage from './pages/Triage'
import Users from './pages/Users'

function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<RoleHomeRedirect />} />

            <Route element={<RoleProtectedRoute allowedRoles={['RECEPCION']} />}>
              <Route path="/pacientes" element={<Patients />} />
            </Route>

            <Route element={<RoleProtectedRoute allowedRoles={['TRIAJE']} />}>
              <Route path="/triaje" element={<Triage />} />
            </Route>

            <Route element={<RoleProtectedRoute allowedRoles={['MEDICO']} />}>
              <Route path="/consulta-medica" element={<MedicalConsultation />} />
            </Route>

            <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/usuarios" element={<Users />} />
              <Route path="/reportes" element={<Reports />} />
            </Route>

            <Route path="*" element={<RoleHomeRedirect />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
