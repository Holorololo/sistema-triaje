import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from './components/sonner'
import AppLayout from './layouts/AppLayout'
import MedicalConsultation from './pages/MedicalConsultation'
import Patients from './pages/Patients'
import Reports from './pages/Reports'
import Triage from './pages/Triage'
import Users from './pages/Users'
//.\mvnw.cmd spring-boot:run
function App() {
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/pacientes" replace />} />
          <Route path="/pacientes" element={<Patients />} />
          <Route path="/triaje" element={<Triage />} />
          <Route path="/consulta-medica" element={<MedicalConsultation />} />
          <Route path="/usuarios" element={<Users />} />
          <Route path="/reportes" element={<Reports />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
