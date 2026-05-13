import { useAuthStore } from '../store/useAuthStore';

export function useWithUser() {
  // Obtener usuario del store
  const { usuario } = useAuthStore();

  // FUNCIÓN: enrichPayload
  // PROPÓSITO: Agregar creado_por automáticamente
  // ENTRADA: payload (objeto con datos)
  // SALIDA: mismo objeto pero con creado_por agregado
  // PASOS:
  // 1. Copiar el objeto original (...)
  // 2. Agregar creado_por con el ID del usuario actual
  const enrichPayload = (payload: any) => {
    return {
      ...payload,
      creado_por: usuario?.id_usuario,
    };
  };

  return { usuario, enrichPayload };
}
