import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { ChevronDown, TrendingUp, Award, Target } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = {
  primary: '#005d5d',
  secondary: '#f5a623',
  text: '#333'
};

export default function Veronicas() {
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
          .filter((reg: any) => reg.siembras?.variedades?.colores?.productos?.nombre === 'Veronica Spray')
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

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold tracking-widest uppercase">Cargando Verónica Spray...</div>;

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
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#005d5d] uppercase">Total Tallos</span>
            <span className="text-sm font-black text-slate-800">{kpis.total.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#005d5d] uppercase">Mejor Bloque</span>
            <span className="text-sm font-black text-[#f5a623]">{kpis.bestBlock}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Gráfico de Curva de Producción */}
        <div className="col-span-12 lg:col-span-8 bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#005d5d] mb-6 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} />
            Curva de Producción por Ciclo de Vida (Semanas)
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataCiclo}>
                <defs>
                  <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005d5d" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#005d5d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" style={{ fontSize: '10px', fill: '#999', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis style={{ fontSize: '10px', fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="tallos" stroke="#005d5d" strokeWidth={3} fillOpacity={1} fill="url(#colorTeal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tarjeta de Análisis Lateral */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#005d5d] p-6 rounded shadow-lg text-white flex-1">
            <Award className="text-emerald-400 mb-4" size={28} />
            <h3 className="text-lg font-black uppercase leading-tight mb-4">Líder de Eficiencia</h3>
            <p className="text-emerald-100/80 text-xs font-medium leading-relaxed mb-6">
              El análisis dinámico identifica al bloque <span className="text-white font-bold">{kpis.bestBlock}</span> como el de mayor rendimiento para la variedad seleccionada.
            </p>
            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold uppercase text-emerald-200 mb-1">Promedio por Registro</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black">{Math.round(kpis.avg).toLocaleString()}</span>
                <Target size={24} className="text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 mb-4 uppercase">Distribución por Bloque</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#f5a623]"></div>
                     <span className="text-[11px] font-bold text-slate-600">Bloque PM{70+i}</span>
                   </div>
                   <span className="text-[11px] font-mono font-bold text-slate-400">24.5%</span>
                </div>
              ))}
            </div>
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
      <div className="flex items-center justify-between cursor-pointer group relative">
        <span className="text-[11px] text-slate-600 font-bold group-hover:text-[#005d5d] transition-colors">{value}</span>
        <ChevronDown size={10} className="text-slate-300 group-hover:text-[#005d5d]" />
      </div>
    </div>
  );
}
