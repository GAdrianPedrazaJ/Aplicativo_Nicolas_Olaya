import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { AlertTriangle, TrendingDown, Calendar, Clock, Filter } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

const getWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default function Danos() {
  const [loading, setLoading] = useState(true);
  const [danosData, setDanosData] = useState<any[]>([]);
  const [timeView, setTimeView] = useState<'dia' | 'semana'>('semana');
  const [soloAstronova, setSoloAstronova] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [resSolo, resCorte] = await Promise.all([
      supabase.from('registros_danos_solo').select(`
        cantidad_danada, fecha_dano,
        siembras (
          variedades (
            nombre,
            colores (productos (nombre))
          )
        )
      `),
      supabase.from('registros_corte_diario').select(`
        tallos_perdidos, fecha_corte,
        siembras (
          variedades (
            nombre,
            colores (productos (nombre))
          )
        )
      `).gt('tallos_perdidos', 0)
    ]);

    if (!resSolo.error && !resCorte.error) {
      const combined = [
        ...(resSolo.data || []).map((d: any) => ({
          cantidad: d.cantidad_danada || 0,
          fecha: d.fecha_dano,
          variedad: d.siembras?.variedades?.nombre || 'N/A',
          producto: (d.siembras?.variedades?.colores?.productos?.nombre || '').toLowerCase()
        })),
        ...(resCorte.data || []).map((d: any) => ({
          cantidad: d.tallos_perdidos || 0,
          fecha: d.fecha_corte,
          variedad: d.siembras?.variedades?.nombre || 'N/A',
          producto: (d.siembras?.variedades?.colores?.productos?.nombre || '').toLowerCase()
        }))
      ];
      setDanosData(combined);
    }
    setLoading(false);
  };

  const filteredData = useMemo(() => {
    return soloAstronova
      ? danosData.filter(d => d.producto.includes('astronova'))
      : danosData;
  }, [danosData, soloAstronova]);

  const chartData = useMemo(() => {
    if (timeView === 'semana') {
      const grouped = filteredData.reduce((acc: any, curr) => {
        const week = getWeek(new Date(curr.fecha));
        const key = `Sem ${week}`;
        if (!acc[key]) acc[key] = { name: key, total: 0, weekNum: week };
        acc[key].total += curr.cantidad;
        // Break down by variety
        acc[key][curr.variedad] = (acc[key][curr.variedad] || 0) + curr.cantidad;
        return acc;
      }, {});
      return Object.values(grouped).sort((a: any, b: any) => a.weekNum - b.weekNum);
    } else {
      const grouped = filteredData.reduce((acc: any, curr) => {
        const key = curr.fecha;
        if (!acc[key]) acc[key] = { name: key, total: 0 };
        acc[key].total += curr.cantidad;
        acc[key][curr.variedad] = (acc[key][curr.variedad] || 0) + curr.cantidad;
        return acc;
      }, {});
      return Object.values(grouped).sort((a: any, b: any) => new Date(a.name).getTime() - new Date(b.name).getTime()).slice(-15);
    }
  }, [filteredData, timeView]);

  const varieties = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach(d => set.add(d.variedad));
    return Array.from(set);
  }, [filteredData]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Cargando análisis de Daños Astronova...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase text-sm">Análisis de Daños Especializado</h3>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setSoloAstronova(!soloAstronova)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${soloAstronova ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
              >
                {soloAstronova ? 'SOLO ASTRONOVA' : 'TODOS LOS PRODUCTOS'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTimeView('dia')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeView === 'dia' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Clock size={14} /> Diario (Últ. 15)
          </button>
          <button
            onClick={() => setTimeView('semana')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeView === 'semana' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Calendar size={14} /> Semanal
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <TrendingDown className="text-rose-500" />
            Pérdidas de {soloAstronova ? 'Astronova' : 'General'} por {timeView === 'dia' ? 'Día' : 'Semana'}
          </h3>
        </div>

        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              {varieties.map((v, index) => (
                <Bar
                  key={v}
                  dataKey={v}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  name={v}
                  radius={index === varieties.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
          <h4 className="text-sm font-black text-rose-700 uppercase mb-2">Resumen Crítico</h4>
          <p className="text-xs text-rose-600 leading-relaxed font-medium">
            Se está analizando específicamente el comportamiento de {soloAstronova ? 'la línea Astronova' : 'toda la producción'}.
            Los picos en la gráfica indican eventos de daño concentrados que requieren inspección técnica inmediata.
          </p>
        </div>
      </div>
    </div>
  );
}
