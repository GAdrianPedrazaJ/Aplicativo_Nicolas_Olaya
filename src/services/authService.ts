import { supabase } from './supabase';
import { Usuario } from '../store/useAuthStore';

// FUNCIÓN AUXILIAR: Generar Hash SHA-256 (compatible con Android/Kotlin)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const authService = {
  // FUNCIÓN: login
  async login(username: string, password: string): Promise<Usuario | null> {
    try {
      // 1. Buscar usuario
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('activo', true)
        .single();

      if (error || !data) {
        throw new Error('Usuario no encontrado');
      }

      // 2. Generar hash de la contraseña ingresada
      const hashedPassword = await sha256(password);

      // 3. Verificar contra la BD y el usuario de emergencia "bypass"
      const isEmergency = password === 'bypass' && data.password_hash === 'bypass';
      const isCorrect = data.password_hash === hashedPassword;

      if (!isCorrect && !isEmergency) {
        throw new Error('Contraseña incorrecta');
      }

      // 4. Retornar datos
      return {
        id_usuario: data.id_usuario,
        username: data.username,
        nombre_completo: data.nombre_completo,
        email: data.email,
        rol: data.rol,
        activo: data.activo,
      };
    } catch (error) {
      console.error('Error en login:', error);
      return null;
    }
  },

  async updateLastAccess(userId: string): Promise<void> {
    await supabase
      .from('usuarios')
      .update({
        ultimo_acceso: new Date().toISOString()
      })
      .eq('id_usuario', userId);
  },

  async getUserById(userId: string): Promise<Usuario | null> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id_usuario', userId)
        .single();

      if (error || !data) return null;

      return {
        id_usuario: data.id_usuario,
        username: data.username,
        nombre_completo: data.nombre_completo,
        email: data.email,
        rol: data.rol,
        activo: data.activo,
      };
    } catch (error) {
      return null;
    }
  },
};
