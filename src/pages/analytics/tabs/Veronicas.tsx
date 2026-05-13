import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Flower2, Filter, Target, Award } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

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

  const availableVariedades = useMemo(() => {
    const filtered = filtros.bloque === 'ALL' ? data : data.filter(d => d.bloque === filtros.bloque);
    return Array.from(new Set(filtered.map(d => d.variedad))).sort();
  }, [data, filtros.bloque]);

  const availableBloques = useMemo(() => {
    const filtered = filtros.variedad === 'ALL' ? data : data.filter(d => d.variedad === filtros.variedad);
    return Array.from(new Set(filtered.map(d => d.bloque))).sort();
  }, [data, filtros.variedad]);

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
    return Object.entries(grouped).map(([sem, tallos]) => ({ name: `Sem ${sem}`, tallos }))
      .sort((a, b) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]));
  }, [dataFiltrada]);

  if (loading) return <div className="p-12 text-center font-black text-slate-400">CARGANDO VERONICA SPRAY...</div>;

  return (
    <div className="space-y-6">
      {/* HEADER EXCLUSIVO */}
      <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md"><Flower2 size={32} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Veronica Spray</h2>
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest opacity-80">Dashboard de Producción Exclusiva</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 border-l border-white/20 pl-8">
          <div>
            <p className="text-[10px] font-black uppercase opacity-60 mb-1 text-emerald-200">Total Cosechado</p>
            <p className="text-2xl font-black">{kpis.total.toLocaleString()}</p>
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] font-black uppercase opacity-60 mb-1 text-emerald-200">Mejor Bloque</p>
            <p className="text-2xl font-black">{kpis.bestBlock}</p>
          </div>
        </div>
      </div>

      {/* FILTROS BI-DIRECCIONALES */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2 text-emerald-600 font-bold">
          <Filter size={18} />
          <span className="text-xs uppercase tracking-wider">Filtros Inteligentes:</span>
        </div>
        <select
          value={filtros.variedad}
          onChange={e => setFiltros({...filtros, variedad: e.target.value})}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">TODAS LAS VARIEDADES</option>
          {availableVariedades.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          value={filtros.bloque}
          onChange={e => setFiltros({...filtros, bloque: e.target.value})}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">TODOS LOS BLOQUES</option>
          {availableBloques.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
            <TrendingUp className="text-emerald-500" size={18} />
            Curva de Producción por Ciclo
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataCiclo}>
                <defs>
                  <linearGradient id="colorTallos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 700}} />
                <YAxis tick={{fontSize: 11}} />
                <Tooltip />
                <Area type="monotone" dataKey="tallos" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTallos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between">
           <div>
            <Award className="text-emerald-400 mb-4" size={32} />
            <h3 className="text-xl font-black uppercase leading-tight mb-2">Análisis de Eficiencia</h3>
            <p className="text-slate-400 text-xs font-bold leading-relaxed">
              El bloque <span className="text-emerald-400">{kpis.bestBlock}</span> lidera la producción de Verónica Spray en el periodo actual.
            </p>
           </div>
           <div className="pt-6 border-t border-white/10 mt-6">
             <div className="flex justify-between items-end">
               <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase">Promedio Diario</p>
                 <p className="text-3xl font-black">{Math.round(kpis.avg).toLocaleString()}</p>
               </div>
               <Target className="text-slate-700" size={40} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
