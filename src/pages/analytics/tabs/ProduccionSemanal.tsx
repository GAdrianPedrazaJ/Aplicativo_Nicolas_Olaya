import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Filter, Activity } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ProduccionSemanal() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({ ano: new Date().getFullYear(), producto: 'TODOS' });
  const [productos, setProductos] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rawData, error } = await supabase
        .from('indices_semanales')
        .select(`
          ano, semana, total_tallos,
          siembras (
            variedades (
              colores (
                productos (nombre)
              )
            )
          )
        `)
        .eq('ano', filtros.ano);

      if (!error && rawData) {
        const normalized = rawData.map((item: any) => ({
          semana: item.semana,
          total: item.total_tallos,
          producto: item.siembras?.variedades?.colores?.productos?.nombre || 'Otros'
        }));
        setData(normalized);
        const prods = Array.from(new Set(normalized.map((d: any) => d.producto))) as string[];
        setProductos(['TODOS', ...prods]);
      }
      setLoading(false);
    };
    fetchData();
  }, [filtros.ano]);

  const chartData = useMemo(() => {
    let filtered = data;
    if (filtros.producto !== 'TODOS') filtered = data.filter(d => d.producto === filtros.producto);

    const grouped = filtered.reduce((acc: any, curr) => {
      if (!acc[curr.semana]) acc[curr.semana] = { semana: curr.semana };
      acc[curr.semana][curr.producto] = (acc[curr.semana][curr.producto] || 0) + curr.total;
      acc[curr.semana].total = (acc[curr.semana].total || 0) + curr.total;
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => a.semana - b.semana);
  }, [data, filtros.producto]);

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Consultando índices semanales...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Calendar size={12}/> Año</label>
          <select value={filtros.ano} onChange={e => setFiltros({...filtros, ano: parseInt(e.target.value)})} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold ring-1 ring-slate-200">
            {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Filter size={12}/> Producto</label>
          <select value={filtros.producto} onChange={e => setFiltros({...filtros, producto: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold ring-1 ring-slate-200">
            {productos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <Activity className="text-indigo-600" /> Curva de Producción
        </h3>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="semana" label={{ value: 'Semana', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              {filtros.producto === 'TODOS' ? (
                <Line type="monotone" dataKey="total" name="Total General" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4 }} />
              ) : (
                <Line type="monotone" dataKey={filtros.producto} stroke="#10b981" strokeWidth={4} dot={{ r: 4 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
