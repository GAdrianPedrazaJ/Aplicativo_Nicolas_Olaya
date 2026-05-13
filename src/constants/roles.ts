// ROLES: Enum con los 4 tipos de usuarios
// SUPERADMIN: acceso total (gestión de usuarios + todo lo demás)
// ADMIN: maneja siembras, cosechas, reportes pero no usuarios
// MONITOR: solo visualiza datos y exporta
// OPERARIO: solo registra datos del día a día
export const ROLES = {
  ADMIN: 'ADMIN',
  MONITOR: 'MONITOR',
  OPERARIO: 'OPERARIO',
  SUPERADMIN: 'SUPERADMIN',
} as const;

// TIPO: Para TypeScript
export type UserRole = typeof ROLES[keyof typeof ROLES];

// PERMISOS: Mapeo de qué puede hacer cada rol
// view_all: ver todos los datos
// edit_all: editar cualquier registro
// edit_own: solo editar lo que creó
// delete_all: borrar cualquier cosa
// manage_users: crear/editar/borrar usuarios
// manage_siembras: crear siembras, cargar masivamente
// manage_cosechas: registrar cosechas
// export_data: descargar reportes
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  // SUPERADMIN: Tiene TODO
  SUPERADMIN: [
    'view_all',      // Ve todos los datos
    'edit_all',      // Edita todo
    'delete_all',    // Borra todo
    'manage_users',  // Crea usuarios
    'manage_siembras', // Carga masivas
    'manage_cosechas', // Registra cosechas
    'export_data',   // Descarga reportes
  ],

  // ADMIN: Gestiona operación pero no usuarios
  ADMIN: [
    'view_all',
    'edit_all',
    'manage_siembras',
    'manage_cosechas',
    'export_data',
  ],

  // MONITOR: Solo visualiza y exporta
  MONITOR: [
    'view_all',
    'edit_own',      // Solo edita lo suyo
    'export_data',
  ],

  // OPERARIO: Solo registra datos
  OPERARIO: [
    'view_own',      // Ve solo lo de su área
    'register_data', // Registra cosechas del día
  ],
};
