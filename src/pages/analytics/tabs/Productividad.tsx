import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Calendar } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const getWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default function Productividad() {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear(),
    semanaInicio: 1,
    semanaFin: 52
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registros_corte_diario')
      .select(`
        fecha_corte,
        tallos_cortados,
        siembras (
          variedades (
            nombre,
            colores (
              productos (nombre)
            )
          )
        )
      `);

    if (!error && data) {
      const normalized = data.map((reg: any) => ({
        fecha: new Date(reg.fecha_corte),
        tallos: reg.tallos_cortados,
        producto: reg.siembras?.variedades?.colores?.productos?.nombre || 'Otros',
        variedad: reg.siembras?.variedades?.nombre || 'Otras',
        semana: getWeek(new Date(reg.fecha_corte)),
        anio: new Date(reg.fecha_corte).getFullYear()
      }));
      setRawData(normalized);
    }
    setLoading(false);
  };

  const dataFiltrada = useMemo(() => {
    return rawData.filter(d =>
      d.anio === filtros.anio &&
      d.semana >= filtros.semanaInicio &&
      d.semana <= filtros.semanaFin
    );
  }, [rawData, filtros]);

  const chartDataSemanal = useMemo(() => {
    const grouped = dataFiltrada.reduce((acc: any, curr) => {
      if (!acc[curr.semana]) acc[curr.semana] = { semana: `Sem ${curr.semana}`, total: 0 };
      acc[curr.semana].total += curr.tallos;
      acc[curr.semana][curr.producto] = (acc[curr.semana][curr.producto] || 0) + curr.tallos;
      return acc;
    }, {});
    return Object.values(grouped).sort((a: any, b: any) => {
      const s1 = parseInt(a.semana.split(' ')[1]);
      const s2 = parseInt(b.semana.split(' ')[1]);
      return s1 - s2;
    });
  }, [dataFiltrada]);

  const chartDataVariedades = useMemo(() => {
    const grouped = dataFiltrada.reduce((acc: any, curr) => {
      acc[curr.variedad] = (acc[curr.variedad] || 0) + curr.tallos;
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 10);
  }, [dataFiltrada]);

  const kpis = useMemo(() => {
    const total = dataFiltrada.reduce((s, d) => s + d.tallos, 0);
    const semanas = new Set(dataFiltrada.map(d => d.semana)).size;
    return {
      total,
      promedio: semanas > 0 ? Math.round(total / semanas) : 0,
      max: Math.max(...chartDataSemanal.map((d: any) => d.total), 0)
    };
  }, [dataFiltrada, chartDataSemanal]);

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando productividad...</div>;

  return (
    <div className="space-y-6">
      {/* FILTROS LOCALES */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Año</label>
          <select
            value={filtros.anio}
            onChange={(e) => setFiltros({...filtros, anio: parseInt(e.target.value)})}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Semana Inicio</label>
            <input
              type="number" value={filtros.semanaInicio}
              onChange={(e) => setFiltros({...filtros, semanaInicio: parseInt(e.target.value)})}
              className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Semana Fin</label>
            <input
              type="number" value={filtros.semanaFin}
              onChange={(e) => setFiltros({...filtros, semanaFin: parseInt(e.target.value)})}
              className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <Activity size={20} />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Producción</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.total.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Promedio Semanal</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.promedio.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <Calendar size={20} />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Máximo Semanal</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.max.toLocaleString()}</p>
        </div>
      </div>

      {/* GRAFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Producción Total por Semana</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataSemanal}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="semana" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top 10 Variedades</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataVariedades} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartDataVariedades.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
