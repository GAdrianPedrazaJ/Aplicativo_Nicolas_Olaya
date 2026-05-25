import React, { useState, useMemo, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { ChevronDown, TrendingUp, Award, Target, Flower } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = {
  primary: '#005d5d',
  secondary: '#f5a623',
  text: '#333'
};

export default function Delphinium() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({ variedad: 'ALL', bloque: 'ALL' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rawData, error } = await supabase
        .from('registros_corte_diario')
        .select(`
          fecha_corte, tallos_cortados, semana_ciclo,
          siembras (
            camas (naves (bloques (nombre))),
            variedades (nombre, colores (productos (nombre)))
          )
        `);

      if (!error && rawData) {
        const filtered = rawData
          .filter((reg: any) => reg.siembras?.variedades?.colores?.productos?.nombre?.includes('Delphinium'))
          .map((reg: any) => ({
            fecha: reg.fecha_corte,
            tallos: reg.tallos_cortados,
            variedad: reg.siembras?.variedades?.nombre,
            bloque: reg.siembras?.camas?.naves?.bloques?.nombre || 'S/B',
            semana_ciclo: reg.semana_ciclo || 0
          }));
        setData(filtered);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const dataFiltrada = useMemo(() => {
    return data.filter(d =>
      (filtros.variedad === 'ALL' || d.variedad === filtros.variedad) &&
      (filtros.bloque === 'ALL' || d.bloque === filtros.bloque)
    );
  }, [data, filtros]);

  const kpis = useMemo(() => {
    const total = dataFiltrada.reduce((acc, curr) => acc + curr.tallos, 0);
    const avg = dataFiltrada.length > 0 ? total / dataFiltrada.length : 0;
    const blocks = dataFiltrada.reduce((acc: any, curr) => {
      acc[curr.bloque] = (acc[curr.bloque] || 0) + curr.tallos;
      return acc;
    }, {});
    const bestBlock = Object.entries(blocks).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';
    return { total, avg, bestBlock };
  }, [dataFiltrada]);

  const chartDataCiclo = useMemo(() => {
    const grouped = dataFiltrada.reduce((acc: any, curr) => {
      acc[curr.semana_ciclo] = (acc[curr.semana_ciclo] || 0) + curr.tallos;
      return acc;
    }, {});
    return Object.entries(grouped).map(([sem, tallos]) => ({ name: `S${sem}`, tallos }))
      .sort((a, b) => parseInt(a.name.substring(1)) - parseInt(b.name.substring(1)));
  }, [dataFiltrada]);

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold tracking-widest uppercase">Cargando Delphinium...</div>;

  return (
    <div className="flex flex-col gap-4">

      {/* SLICERS (Filtros Horizontales) */}
      <div className="bg-white p-3 border-b border-slate-100 flex flex-wrap gap-8 items-center">
        <Slicer
          label="Variedad"
          value={filtros.variedad === 'ALL' ? 'Todas' : filtros.variedad}
          onChange={(v: string) => setFiltros({...filtros, variedad: v === 'Todas' ? 'ALL' : v})}
        />
        <Slicer
          label="Bloque"
          value={filtros.bloque === 'ALL' ? 'Todos' : filtros.bloque}
          onChange={(v: string) => setFiltros({...filtros, bloque: v === 'Todos' ? 'ALL' : v})}
        />
        <div className="ml-auto flex gap-6 border-l border-slate-100 pl-6">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-[#005d5d] uppercase">Cosecha Total</span>
            <span className="text-sm font-black text-slate-800">{kpis.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Gráfico Principal */}
        <div className="col-span-12 lg:col-span-8 bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#005d5d] mb-6 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} />
            Rendimiento por Ciclo Semanal (Delphinium)
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataCiclo}>
                <defs>
                  <linearGradient id="colorDelph" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005d5d" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#005d5d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" style={{ fontSize: '10px', fill: '#999', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis style={{ fontSize: '10px', fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="tallos" stroke="#005d5d" strokeWidth={3} fillOpacity={1} fill="url(#colorDelph)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel de Análisis */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#f5a623] p-6 rounded shadow-lg text-white">
            <Award className="text-white/40 mb-4" size={28} />
            <h3 className="text-lg font-black uppercase leading-tight mb-2">Pico de Producción</h3>
            <p className="text-white/80 text-xs font-medium leading-relaxed mb-6">
              El bloque <span className="text-white font-bold">{kpis.bestBlock}</span> registra la mayor concentración de tallos de primera calidad.
            </p>
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-[10px] font-bold uppercase text-white/60 mb-1">Carga Promedio</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black">{Math.round(kpis.avg).toLocaleString()}</span>
                <Flower size={24} className="text-white/40" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex-1">
            <h3 className="text-[10px] font-bold text-[#005d5d] mb-4 uppercase">Estado Operativo</h3>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Ritmo de Cosecha Estable</span>
            </div>
            <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
              Las proyecciones indican que la variedad Delphinium mantendrá una curva ascendente durante las próximas 3 semanas de vida.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slicer({ label, value, onChange }: any) {
  return (
    <div className="flex flex-col min-w-[120px]">
      <span className="text-[9px] font-bold text-[#005d5d] uppercase mb-0.5 tracking-tighter opacity-70">{label}</span>
      <div className="flex items-center justify-between cursor-pointer group">
        <span className="text-[11px] text-slate-600 font-bold group-hover:text-[#005d5d] transition-colors">{value}</span>
        <ChevronDown size={10} className="text-slate-300 group-hover:text-[#005d5d]" />
      </div>
    </div>
  );
}
