import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_PERMISSIONS, UserRole } from '../constants/roles';

// INTERFAZ: Props del componente
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRoles,
}: ProtectedRouteProps) {
  // Obtener usuario del store global
  const { usuario, isAuthenticated } = useAuthStore();

  // VERIFICACIÓN 1: ¿Está logueado?
  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // VERIFICACIÓN 2: ¿Tiene el rol requerido?
  if (requiredRoles && !requiredRoles.includes(usuario.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600">
            No tienes permisos para acceder a esta sección
          </p>
        </div>
      </div>
    );
  }

  // VERIFICACIÓN 3: ¿Tiene el permiso específico?
  if (requiredPermission) {
    const permissions = ROLE_PERMISSIONS[usuario.rol];
    if (!permissions.includes(requiredPermission)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Acceso Denegado
            </h1>
            <p className="text-gray-600">
              No tienes permisos para realizar esta acción
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
