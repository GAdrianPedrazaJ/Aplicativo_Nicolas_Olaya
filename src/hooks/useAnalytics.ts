import { useState, useEffect, useMemo } from 'react';
import { analyticsService } from '../services/analyticsService';
import { getWeekAndYear } from '../utils/dateHelpers';

export function useAnalytics() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ productos: [], bloques: [], variedades: [] });

  // Estado de Filtros
  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear(),
    semanaInicio: 1,
    semanaFin: 53,
    producto: 'ALL',
    variedad: 'ALL',
    bloque: 'ALL',
    nave: 'ALL'
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [data, dims] = await Promise.all([
        analyticsService.getRawProductionData(),
        analyticsService.getFilterDimensionValues()
      ]);
      setRawData(data);
      setDimensions(dims as any);
      setLoading(false);
    };
    load();
  }, []);

  // PROCESAMIENTO Y FILTRADO
  const filteredAndGrouped = useMemo(() => {
    if (!rawData.length) return { lineData: [], barByBlock: [], barByCombo: [], kpis: {} };

    // 1. Filtrar datos crudos
    const dataFiltrada = rawData.filter(reg => {
      const { week, year } = getWeekAndYear(reg.fecha_corte);
      const siembra = reg.siembras;
      const prodNombre = siembra?.variedades?.colores?.productos?.nombre;
      const varNombre = siembra?.variedades?.nombre;
      const bloqueNombre = siembra?.camas?.naves?.bloques?.nombre;
      const naveNum = siembra?.camas?.naves?.numero_nave;

      const matchAnio = year === filtros.anio;
      const matchSemana = week >= filtros.semanaInicio && week <= filtros.semanaFin;
      const matchProd = filtros.producto === 'ALL' || prodNombre === filtros.producto;
      const matchVar = filtros.variedad === 'ALL' || varNombre === filtros.variedad;
      const matchBloque = filtros.bloque === 'ALL' || bloqueNombre === filtros.bloque;
      const matchNave = filtros.nave === 'ALL' || String(naveNum) === filtros.nave;

      return matchAnio && matchSemana && matchProd && matchVar && matchBloque && matchNave;
    });

    // 2. Agrupar por Semana (para LineChart)
    const weekMap: Record<number, any> = {};
    dataFiltrada.forEach(reg => {
      const { week } = getWeekAndYear(reg.fecha_corte);
      if (!weekMap[week]) weekMap[week] = { semana: `Sem ${week}`, total: 0 };

      // Dinámico: Agregamos sub-llaves según lo que estemos comparando (ej: Variedad)
      const key = filtros.producto === 'ALL'
        ? (reg.siembras?.variedades?.colores?.productos?.nombre || 'S/P')
        : (reg.siembras?.variedades?.nombre || 'S/V');

      weekMap[week][key] = (weekMap[week][key] || 0) + (reg.tallos_cortados || 0);
      weekMap[week].total += (reg.tallos_cortados || 0);
    });

    const lineData = Object.values(weekMap).sort((a: any, b: any) =>
      parseInt(a.semana.split(' ')[1]) - parseInt(b.semana.split(' ')[1])
    );

    // 3. Agrupar por Bloque (para BarChart)
    const blockMap: Record<string, number> = {};
    dataFiltrada.forEach(reg => {
      const b = reg.siembras?.camas?.naves?.bloques?.nombre || 'S/B';
      blockMap[b] = (blockMap[b] || 0) + (reg.tallos_cortados || 0);
    });
    const barByBlock = Object.entries(blockMap).map(([name, tallos]) => ({ name, tallos }));

    // 4. KPIs
    const totalTallos = dataFiltrada.reduce((acc, curr) => acc + (curr.tallos_cortados || 0), 0);
    const kpis = {
      totalTallos,
      promedioSemanal: Math.round(totalTallos / (lineData.length || 1)),
      maxProduccion: Math.max(...lineData.map((d: any) => d.total), 0)
    };

    return { lineData, barByBlock, kpis };
  }, [rawData, filtros]);

  return {
    loading,
    filtros,
    setFiltros,
    dimensions,
    data: filteredAndGrouped
  };
}
