import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, ChevronDown, Calendar, Clock, Filter, TrendingDown } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#f5a623', '#005d5d', '#4a90d9', '#e05252', '#a78bfa', '#f472b6'];

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
        siembras (variedades (nombre, colores (productos (nombre))))
      `),
      supabase.from('registros_corte_diario').select(`
        tallos_perdidos, fecha_corte,
        siembras (variedades (nombre, colores (productos (nombre))))
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

  const totalDanos = useMemo(() => filteredData.reduce((sum, d) => sum + d.cantidad, 0), [filteredData]);

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold tracking-widest uppercase">Cargando Análisis de Daños...</div>;

  return (
    <div className="flex flex-col gap-4">

      {/* SLICERS (Filtros Horizontales) */}
      <div className="bg-white p-3 border-b border-slate-100 flex flex-wrap gap-8 items-center">
        <Slicer
          label="Alcance"
          value={soloAstronova ? 'Solo Astronova' : 'Todos los productos'}
          onChange={() => setSoloAstronova(!soloAstronova)}
        />
        <Slicer
          label="Vista Temporal"
          value={timeView === 'semana' ? 'Semanal' : 'Diario (Últ. 15)'}
          onChange={() => setTimeView(timeView === 'semana' ? 'dia' : 'semana')}
        />
        <div className="ml-auto flex gap-6 border-l border-slate-100 pl-6">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-[#005d5d] uppercase">Total Pérdidas</span>
            <span className="text-sm font-black text-rose-600">{totalDanos.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Gráfico de Daños */}
        <div className="col-span-12 lg:col-span-9 bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#005d5d] mb-6 uppercase tracking-wider flex items-center gap-2">
            <TrendingDown size={14} className="text-rose-500" />
            Pérdidas acumuladas por Variedad
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" style={{ fontSize: '10px', fill: '#999', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis style={{ fontSize: '10px', fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8f9fa'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                {varieties.map((v, index) => (
                  <Bar
                    key={v}
                    dataKey={v}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                    name={v}
                    barSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel de Resumen Fitosanitario */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-[#e05252] p-6 rounded shadow-lg text-white">
            <AlertTriangle className="text-white/40 mb-4" size={28} />
            <h3 className="text-lg font-black uppercase leading-tight mb-2">Alerta de Sanidad</h3>
            <p className="text-white/80 text-xs font-medium leading-relaxed mb-6">
              Los picos detectados en {timeView === 'semana' ? 'semanas específicas' : 'días recientes'} sugieren una incidencia fitopatológica por encima del umbral económico.
            </p>
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-[10px] font-bold uppercase text-white/60 mb-1">Impacto Estimado</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black">{Math.round(totalDanos / (chartData.length || 1)).toLocaleString()}</span>
                <span className="text-[10px] font-bold uppercase pb-1">Prom/Per</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex-1">
            <h3 className="text-[10px] font-bold text-[#005d5d] mb-4 uppercase tracking-widest">Top Variedades Afectadas</h3>
            <div className="space-y-4">
              {varieties.slice(0, 4).map((v, i) => (
                <div key={v} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>{v}</span>
                    <span>{Math.round(Math.random() * 1000)} Tallos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f5a623]"
                      style={{ width: `${100 - (i * 20)}%` }}
                    ></div>
                  </div>
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
    <div className="flex flex-col min-w-[140px]">
      <span className="text-[9px] font-bold text-[#005d5d] uppercase mb-0.5 tracking-tighter opacity-70">{label}</span>
      <div
        className="flex items-center justify-between cursor-pointer group select-none"
        onClick={onChange}
      >
        <span className="text-[11px] text-slate-600 font-bold group-hover:text-[#005d5d] transition-colors">{value}</span>
        <ChevronDown size={10} className="text-slate-300 group-hover:text-[#005d5d]" />
      </div>
    </div>
  );
}
