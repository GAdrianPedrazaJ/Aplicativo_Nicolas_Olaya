import React, { useState, useMemo, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { ShieldAlert, TrendingDown, PieChart as PieIcon, Filter, AlertCircle, activity } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AstronovaDanos() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({ bloque: 'ALL', tipo: 'ALL' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [resCorte, resDanos] = await Promise.all([
        supabase.from('registros_corte_diario').select(`
          fecha_corte, tallos_perdidos,
          causas_danos (nombre, tipo),
          siembras (camas (naves (bloques (nombre))), variedades (colores (productos (nombre))))
        `).eq('siembras.variedades.colores.productos.nombre', 'Astronova').gt('tallos_perdidos', 0),

        supabase.from('registros_danos_solo').select(`
          fecha_dano, cantidad_danada,
          causas_danos (nombre, tipo),
          siembras (camas (naves (bloques (nombre))), variedades (colores (productos (nombre))))
        `).eq('siembras.variedades.colores.productos.nombre', 'Astronova')
      ]);

      const combinada = [
        ...(resCorte.data || []).map(r => ({
          fecha: r.fecha_corte,
          cantidad: r.tallos_perdidos,
          causa: r.causas_danos?.nombre || 'No especificada',
          tipo: r.causas_danos?.tipo || 'Otros',
          bloque: r.siembras?.camas?.naves?.bloques?.nombre || 'S/B'
        })),
        ...(resDanos.data || []).map(r => ({
          fecha: r.fecha_dano,
          cantidad: r.cantidad_danada,
          causa: r.causas_danos?.nombre || 'No especificada',
          tipo: r.causas_danos?.tipo || 'Otros',
          bloque: r.siembras?.camas?.naves?.bloques?.nombre || 'S/B'
        }))
      ];

      setData(combinada);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filtros bi-direccionales: Tipos disponibles según Bloque y viceversa
  const availableTipos = useMemo(() => {
    const filtered = filtros.bloque === 'ALL' ? data : data.filter(d => d.bloque === filtros.bloque);
    return Array.from(new Set(filtered.map(d => d.tipo))).sort();
  }, [data, filtros.bloque]);

  const availableBloques = useMemo(() => {
    const filtered = filtros.tipo === 'ALL' ? data : data.filter(d => d.tipo === filtros.tipo);
    return Array.from(new Set(filtered.map(d => d.bloque))).sort();
  }, [data, filtros.tipo]);

  const dataFiltrada = useMemo(() => {
    return data.filter(d =>
      (filtros.bloque === 'ALL' || d.bloque === filtros.bloque) &&
      (filtros.tipo === 'ALL' || d.tipo === filtros.tipo)
    );
  }, [data, filtros]);

  const chartDataTipos = useMemo(() => {
    const grouped = dataFiltrada.reduce((acc: any, curr) => {
      acc[curr.tipo] = (acc[curr.tipo] || 0) + curr.cantidad;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [dataFiltrada]);

  const chartDataCausas = useMemo(() => {
    const grouped = dataFiltrada.reduce((acc: any, curr) => {
      acc[curr.causa] = (acc[curr.causa] || 0) + curr.cantidad;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value).slice(0, 8);
  }, [dataFiltrada]);

  const totalPerdidas = useMemo(() => dataFiltrada.reduce((acc, curr) => acc + curr.cantidad, 0), [dataFiltrada]);

  if (loading) return <div className="p-12 text-center animate-pulse font-black text-slate-400">ANALIZANDO DAÑOS ASTRONOVA...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-rose-500">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/30"><ShieldAlert className="text-rose-500" size={32} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Daños Astronova</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Análisis Fitopatológico y Fisiológico</p>
          </div>
        </div>
        <div className="text-center md:text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Tallos Perdidos</p>
          <p className="text-4xl font-black text-rose-500">{totalPerdidas.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2 text-slate-400 font-bold">
          <Filter size={18} />
          <span className="text-xs uppercase tracking-wider">Filtros Avanzados:</span>
        </div>
        <select
          value={filtros.bloque}
          onChange={e => setFiltros({...filtros, bloque: e.target.value})}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
        >
          <option value="ALL">TODOS LOS BLOQUES</option>
          {availableBloques.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={filtros.tipo}
          onChange={e => setFiltros({...filtros, tipo: e.target.value})}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
        >
          <option value="ALL">TODOS LOS TIPOS DE DAÑO</option>
          {availableTipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
            <PieIcon className="text-rose-500" size={18} />
            Pérdidas por Tipo (Categoría)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataTipos}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartDataTipos.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
            <TrendingDown className="text-rose-500" size={18} />
            Top Causas Específicas
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataCausas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{fontSize: 10, fontWeight: 700}} width={120} />
                <Tooltip cursor={{fill: '#fff5f5'}} />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
