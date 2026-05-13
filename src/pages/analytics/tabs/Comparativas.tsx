import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Layers, TrendingUp, Filter, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

export default function Comparativas() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({ bloque: 'ALL', anio: new Date().getFullYear().toString() });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rawData, error } = await supabase
        .from('indices_semanales')
        .select(`
          total_tallos, semana, ano, semana_ciclo,
          siembras (
            camas (naves (bloques (nombre))),
            variedades (colores (productos (nombre)))
          )
        `);

      if (!error && rawData) {
        const normalized = rawData.map((item: any) => ({
          total: item.total_tallos,
          semana: item.semana,
          ano: item.ano,
          semana_ciclo: item.semana_ciclo,
          producto: item.siembras?.variedades?.colores?.productos?.nombre || 'Otros',
          bloque: item.siembras?.camas?.naves?.bloques?.nombre || 'S/B'
        }));
        setData(normalized);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const options = useMemo(() => ({
    bloques: Array.from(new Set(data.map(d => d.bloque))).sort(),
    anios: Array.from(new Set(data.map(d => d.ano.toString()))).sort().reverse()
  }), [data]);

  const dataFiltrada = useMemo(() => {
    return data.filter(d =>
      (filtros.bloque === 'ALL' || d.bloque === filtros.bloque) &&
      (filtros.anio === 'ALL' || d.ano.toString() === filtros.anio)
    );
  }, [data, filtros]);

  const products = useMemo(() => Array.from(new Set(dataFiltrada.map(d => d.producto))).sort(), [dataFiltrada]);

  const chartDataSemanas = useMemo(() => {
    const weeks = Array.from(new Set(dataFiltrada.map(d => d.semana))).sort((a, b) => a - b);
    return weeks.map(w => {
      const entry: any = { name: `S${w}` };
      products.forEach(p => {
        entry[p] = dataFiltrada.filter(d => d.semana === w && d.producto === p).reduce((s, c) => s + c.total, 0);
      });
      return entry;
    });
  }, [dataFiltrada, products]);

  const chartDataCiclos = useMemo(() => {
    const maxWeeks = Math.max(...dataFiltrada.map(d => d.semana_ciclo), 0);
    return Array.from({ length: maxWeeks }, (_, i) => i + 1).map(w => {
      const entry: any = { name: `W${w}` };
      products.forEach(p => {
        entry[p] = dataFiltrada.filter(d => d.semana_ciclo === w && d.producto === p).reduce((s, c) => s + c.total, 0);
      });
      return entry;
    });
  }, [dataFiltrada, products]);

  const chartDataAnios = useMemo(() => {
    const years = Array.from(new Set(data.map(d => d.ano))).sort();
    return years.map(ano => {
      const entry: any = { name: ano.toString() };
      products.forEach(p => {
        entry[p] = data.filter(d => d.ano === ano && d.producto === p && (filtros.bloque === 'ALL' || d.bloque === filtros.bloque)).reduce((s, c) => s + c.total, 0);
      });
      return entry;
    });
  }, [data, dataFiltrada, products, filtros.bloque]);

  if (loading) return <div className="p-12 text-center animate-pulse font-black text-slate-400">CARGANDO COMPARATIVAS...</div>;

  const renderChart = (title: string, chartData: any[]) => (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
        <TrendingUp size={18} className="text-indigo-500" /> {title}
      </h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700 }} />
            {products.map((p, index) => (
              <Line key={p} type="monotone" dataKey={p} stroke={COLORS[index % COLORS.length]} strokeWidth={4} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md"><Layers size={32} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Comparativa Global</h2>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest opacity-80">Análisis multi-producto y temporal</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-bold">
          <Filter size={18} />
          <span className="text-xs uppercase tracking-wider">Filtros de Análisis:</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin size={14} className="text-slate-400" />
          <select value={filtros.bloque} onChange={e => setFiltros({...filtros, bloque: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="ALL">TODOS LOS BLOQUES</option>
            {options.bloques.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-slate-400" />
          <select value={filtros.anio} onChange={e => setFiltros({...filtros, anio: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="ALL">TODOS LOS AÑOS</option>
            {options.anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {renderChart("Producción por Semanas del Año", chartDataSemanas)}
        {renderChart("Curva de Producción por Ciclo", chartDataCiclos)}
        {renderChart("Histórico Anual Comparativo", chartDataAnios)}
      </div>
    </div>
  );
}
