import { supabase } from './supabase';

export interface ProduccionSemanal {
  semana: string;
  tallos: number;
}

export interface StatsResumen {
  totalSiembras: number;
  totalVariedades: number;
  tallosEsteMes: number;
  calidadPromedio: number;
  produccionSemanal: ProduccionSemanal[];
}

export const statsService = {
  async getTotalSiembrasActivas(): Promise<number> {
    const { count, error } = await supabase
      .from('siembras')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'EN PRODUCCION');

    return !error ? (count ?? 0) : 0;
  },

  async getTotalVariedades(): Promise<number> {
    const { count, error } = await supabase
      .from('variedades')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);

    return !error ? (count ?? 0) : 0;
  },

  async getTallosCortadosEsteMes(): Promise<number> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('registros_corte_diario')
      .select('tallos_cortados')
      .gte('fecha_corte', firstDay)
      .lte('fecha_corte', lastDay);

    if (error) return 0;
    return data?.reduce((sum, reg) => sum + (reg.tallos_cortados ?? 0), 0) ?? 0;
  },

  async getProduccionUltimas4Semanas(): Promise<ProduccionSemanal[]> {
    const today = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(today.getDate() - 28);

    const { data: registros, error } = await supabase
      .from('registros_corte_diario')
      .select('fecha_corte, tallos_cortados')
      .gte('fecha_corte', fourWeeksAgo.toISOString().split('T')[0])
      .lte('fecha_corte', today.toISOString().split('T')[0]);

    if (error || !registros) return [];

    const weeks: ProduccionSemanal[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(today.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(today.getDate() - i * 7);

      const totalTallos = registros
        .filter(r => {
          const d = new Date(r.fecha_corte);
          return d >= start && d < end;
        })
        .reduce((sum, r) => sum + (r.tallos_cortados ?? 0), 0);

      weeks.push({
        semana: `Semana ${4 - i}`,
        tallos: totalTallos
      });
    }

    return weeks;
  },

  async getCalidadPromedio(): Promise<number> {
    const { data } = await supabase
      .from('indices_semanales')
      .select('porcentaje_calidad')
      .not('porcentaje_calidad', 'is', null);

    if (!data || data.length === 0) return 0;
    const promedio = data.reduce((sum, item) => sum + (Number(item.porcentaje_calidad) ?? 0), 0) / data.length;
    return Math.round(promedio);
  },

  async getDashboardStats(): Promise<StatsResumen> {
    const [siembras, variedades, tallos, calidad, produccion] = await Promise.all([
      this.getTotalSiembrasActivas(),
      this.getTotalVariedades(),
      this.getTallosCortadosEsteMes(),
      this.getCalidadPromedio(),
      this.getProduccionUltimas4Semanas(),
    ]);

    return {
      totalSiembras: siembras,
      totalVariedades: variedades,
      tallosEsteMes: tallos,
      calidadPromedio: calidad,
      produccionSemanal: produccion,
    };
  }
};
