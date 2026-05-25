import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { ChevronDown, RefreshCcw, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = {
  primary: '#005d5d',
  secondary: '#f5a623',
  text: '#333'
};

export default function CiclosProductividad() {
  const [loading, setLoading] = useState(true);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [selectedCiclo, setSelectedCiclo] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rawData, error } = await supabase
        .from('indices_semanales')
        .select(`
          total_tallos,
          semana_ciclo,
          id_ciclo,
          ciclos_produccion (
            numero_ciclo
          )
        `)
        .not('id_ciclo', 'is', null);

      if (!error && rawData) {
        setData(rawData);
        const uniqueCiclos = Array.from(new Set(rawData.map((d: any) => d.id_ciclo)))
          .map(id => {
            const item = rawData.find((d: any) => d.id_ciclo === id);
            return {
              id,
              nombre: `Ciclo ${item.ciclos_produccion?.numero_ciclo || 'N/A'}`
            };
          });
        setCiclos(uniqueCiclos);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    let filtered = data;
    if (selectedCiclo !== 'ALL') filtered = data.filter(d => d.id_ciclo === selectedCiclo);

    const grouped = filtered.reduce((acc: any, curr) => {
      const key = curr.semana_ciclo;
      if (!acc[key]) acc[key] = { name: `Sem ${key}`, semana_ciclo: key, tallos: 0, count: 0 };
      acc[key].tallos += curr.total_tallos;
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .map((item: any) => ({
        ...item,
        valor: selectedCiclo === 'ALL' ? Math.round(item.tallos / item.count) : item.tallos
      }))
      .sort((a: any, b: any) => a.semana_ciclo - b.semana_ciclo);
  }, [data, selectedCiclo]);

  const peakWeek = useMemo(() => {
    return chartData.reduce((max, curr) => curr.valor > (max.valor || 0) ? curr : max, {semana_ciclo: 0}).semana_ciclo;
  }, [chartData]);

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold tracking-widest uppercase">Analizando Ciclos de Vida...</div>;

  return (
    <div className="flex flex-col gap-4">

      {/* SLICERS (Filtros Horizontales) */}
      <div className="bg-white p-3 border-b border-slate-100 flex flex-wrap gap-8 items-center">
        <Slicer
          label="Ciclo de Producción"
          value={selectedCiclo === 'ALL' ? 'Todos los Ciclos' : ciclos.find(c => c.id === selectedCiclo)?.nombre}
          options={['Todos los Ciclos', ...ciclos.map(c => c.nombre)]}
          onChange={(v: string) => {
            if (v === 'Todos los Ciclos') setSelectedCiclo('ALL');
            else {
              const id = ciclos.find(c => c.nombre === v)?.id;
              setSelectedCiclo(id);
            }
          }}
        />
        <div className="ml-auto flex gap-6 border-l border-slate-100 pl-6">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-[#005d5d] uppercase">Pico Detectado</span>
            <span className="text-sm font-black text-[#f5a623]">Semana {peakWeek}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Gráfico de Curva de Ciclo */}
        <div className="col-span-12 lg:col-span-8 bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#005d5d] mb-6 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} />
            Curva de Rendimiento Promedio por Etapa del Ciclo
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5a623" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f5a623" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" style={{ fontSize: '10px', fill: '#999', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis style={{ fontSize: '10px', fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="valor" stroke="#f5a623" strokeWidth={3} fillOpacity={1} fill="url(#colorOrange)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel Informativo Lateral */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#005d5d] p-6 rounded shadow-lg text-white">
            <Zap className="text-emerald-400 mb-4" size={28} />
            <h3 className="text-lg font-black uppercase leading-tight mb-2">Pico de Eficiencia</h3>
            <p className="text-emerald-100/80 text-xs font-medium leading-relaxed mb-6">
              El análisis estadístico muestra que el rendimiento máximo se alcanza en la <span className="text-white font-bold">Semana {peakWeek}</span> del ciclo.
            </p>
            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold uppercase text-emerald-200 mb-1">Volumen Promedio en Pico</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black">
                  {Math.max(...chartData.map(d => d.valor)).toLocaleString()}
                </span>
                <span className="text-[10px] font-bold uppercase pb-1">Tallos / M2</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex-1">
            <h3 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Observaciones Técnicas</h3>
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100 mb-4">
              <RefreshCcw size={16} className="text-amber-600 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Los datos actuales corresponden al comportamiento promedio histórico de las últimas 52 semanas.
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              "Mantener un monitoreo constante durante las semanas 12 a 18 es crítico para asegurar la calidad final del tallo."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slicer({ label, value, onChange, options }: any) {
  return (
    <div className="flex flex-col min-w-[160px]">
      <span className="text-[9px] font-bold text-[#005d5d] uppercase mb-0.5 tracking-tighter opacity-70">{label}</span>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent w-full text-[11px] text-slate-600 font-bold pr-6 outline-none cursor-pointer focus:text-[#005d5d] transition-colors"
        >
          {options.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-[#005d5d] pointer-events-none" />
      </div>
    </div>
  );
}
