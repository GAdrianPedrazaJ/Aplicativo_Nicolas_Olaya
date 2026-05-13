import { supabase } from './supabase';

export const analyticsService = {
  /**
   * Obtiene todos los registros de corte con su metadata asociada
   * Une: registros_corte_diario -> siembras -> variedades (productos) + camas (bloques)
   */
  async getRawProductionData() {
    const { data, error } = await supabase
      .from('registros_corte_diario')
      .select(`
        id_registro,
        fecha_corte,
        tallos_cortados,
        id_siembra,
        siembras (
          id_siembra,
          estado,
          camas (
            numero_cama,
            naves (
              numero_nave,
              bloques (nombre)
            )
          ),
          variedades (
            nombre,
            colores (
              nombre,
              productos (nombre)
            )
          )
        )
      `);

    if (error) {
      console.error('Error fetching analytics data:', error);
      return [];
    }
    return data;
  },

  async getFilterDimensionValues() {
    const [productos, bloques, variedades] = await Promise.all([
      supabase.from('productos').select('nombre'),
      supabase.from('bloques').select('nombre'),
      supabase.from('variedades').select('nombre')
    ]);

    return {
      productos: productos.data?.map(p => p.nombre) || [],
      bloques: bloques.data?.map(b => b.nombre) || [],
      variedades: variedades.data?.map(v => v.nombre) || []
    };
  }
};
