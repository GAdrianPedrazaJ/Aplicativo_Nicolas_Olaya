import { useAuthStore } from '../store/useAuthStore';
import { ROLE_PERMISSIONS } from '../constants/roles';

export function usePermission() {
  // Obtener usuario actual del store
  const { usuario } = useAuthStore();

  // FUNCIÓN: hasPermission
  // Verifica si el usuario tiene UN permiso específico
  // ENTRADA: permission (string)
  // SALIDA: boolean
  const hasPermission = (permission: string): boolean => {
    if (!usuario) return false; // Si no hay usuario, no tiene permisos

    // Obtener lista de permisos del rol del usuario
    const rolesPermisos = ROLE_PERMISSIONS[usuario.rol];

    // Verificar si el permiso está en la lista
    return rolesPermisos.includes(permission);
  };

  // FUNCIÓN: hasAnyPermission
  // Verifica si el usuario tiene AL MENOS UNO de los permisos
  // ENTRADA: permissions (array de strings)
  // SALIDA: boolean
  // EJEMPLO: hasAnyPermission(['edit_all', 'edit_own']) → true si tiene alguno
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!usuario) return false;
    const rolesPermisos = ROLE_PERMISSIONS[usuario.rol];

    // .some() retorna true si al menos uno cumple
    return permissions.some((p) => rolesPermisos.includes(p));
  };

  // FUNCIÓN: hasAllPermissions
  // Verifica si el usuario tiene TODOS los permisos
  // ENTRADA: permissions (array de strings)
  // SALIDA: boolean
  // EJEMPLO: hasAllPermissions(['view_all', 'export_data']) → true si tiene los 2
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!usuario) return false;
    const rolesPermisos = ROLE_PERMISSIONS[usuario.rol];

    // .every() retorna true si todos cumplen
    return permissions.every((p) => rolesPermisos.includes(p));
  };

  // Retornar funciones y usuario
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    usuario
  };
}
