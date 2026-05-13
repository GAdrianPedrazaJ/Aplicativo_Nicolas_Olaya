import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// INTERFAZ: Define la forma del usuario
// id_usuario: identificador único
// username: nombre de usuario
// nombre_completo: nombre real
// email: correo electrónico
// rol: su nivel de acceso (ADMIN, MONITOR, OPERARIO, SUPERADMIN)
// activo: si el usuario está activo o no
export interface Usuario {
  id_usuario: string;
  username: string;
  nombre_completo: string;
  email: string;
  rol: 'ADMIN' | 'MONITOR' | 'OPERARIO' | 'SUPERADMIN';
  activo: boolean;
}

// INTERFAZ: Define la forma del store
// usuario: el usuario actualmente logueado (null si no hay nadie)
// isAuthenticated: boolean para saber si hay sesión activa
// login(): guarda un usuario en el store
// logout(): limpia el usuario
// setUsuario(): actualiza los datos del usuario sin cerrar sesión
interface AuthStore {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (usuario: Usuario) => void;
  logout: () => void;
  setUsuario: (usuario: Usuario) => void;
}

// CREAR STORE:
// - create() crea el store de Zustand
// - persist() guarda en localStorage automáticamente
// - El objeto dentro define las propiedades iniciales y funciones
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ESTADO INICIAL
      usuario: null,
      isAuthenticated: false,

      // FUNCIÓN login: Recibe un usuario y lo guarda
      // set() actualiza el estado
      login: (usuario: Usuario) => {
        set({ usuario, isAuthenticated: true });
      },

      // FUNCIÓN logout: Limpia todo
      logout: () => {
        set({ usuario: null, isAuthenticated: false });
      },

      // FUNCIÓN setUsuario: Actualiza usuario sin cerrar sesión
      // Útil si cambio datos de perfil
      setUsuario: (usuario: Usuario) => {
        set({ usuario });
      },
    }),
    {
      // CONFIGURACIÓN: Nombre de la clave en localStorage
      name: 'auth-storage',
    }
  )
);
