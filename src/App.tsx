import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ListaSiembras from './pages/siembras/ListaSiembras';
import CargaSiembras from './pages/siembras/CargaSiembras';
import EliminarSiembras from './pages/siembras/EliminarSiembras';
import CargaHistoricos from './pages/CargaHistoricos';
import Reportes from './pages/reportes/Reportes';
import Usuarios from './pages/usuarios/Usuarios';
import Configuracion from './pages/configuracion/Configuracion';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* RUTAS DE SIEMBRAS */}
        <Route
          path="/siembras/lista"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'MONITOR', 'SUPERADMIN']}>
              <ListaSiembras />
            </ProtectedRoute>
          }
        />
        <Route
          path="/siembras/cargar"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERADMIN']}>
              <CargaSiembras />
            </ProtectedRoute>
          }
        />
        <Route
          path="/siembras/eliminar"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERADMIN']}>
              <EliminarSiembras />
            </ProtectedRoute>
          }
        />

        <Route
          path="/siembras/historicos"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'MONITOR', 'SUPERADMIN']}>
              <CargaHistoricos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'MONITOR', 'SUPERADMIN']}>
              <Reportes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute requiredRoles={['SUPERADMIN']}>
              <Usuarios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERADMIN']}>
              <Configuracion />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
