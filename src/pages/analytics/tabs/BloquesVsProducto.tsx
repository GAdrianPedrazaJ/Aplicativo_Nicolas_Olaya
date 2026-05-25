import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChevronDown, LayoutGrid, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#005d5d', '#f5a623', '#26c6da', '#4a90d9', '#e05252', '#a78bfa'];

export default function BloquesVsProducto() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({ ano: new Date().getFullYear() });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rawData, error } = await supabase
        .from('indices_semanales')
        .select(`
          total_tallos,
          siembras (
            camas (
              naves (
                bloques (nombre)
              )
            ),
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
          total: item.total_tallos,
          bloque: item.siembras?.camas?.naves?.bloques?.nombre || 'S/B',
          producto: item.siembras?.variedades?.colores?.productos?.nombre || 'Otros'
        }));
        setData(normalized);
      }
      setLoading(false);
    };
    fetchData();
  }, [filtros.ano]);

  const chartData = useMemo(() => {
    const pivot: any = {};
    const productSet = new Set<string>();

    data.forEach(item => {
      if (!pivot[item.bloque]) pivot[item.bloque] = { name: item.bloque };
      pivot[item.bloque][item.producto] = (pivot[item.bloque][item.producto] || 0) + item.total;
      productSet.add(item.producto);
    });

    return {
      data: Object.values(pivot).sort((a: any, b: any) => a.name.localeCompare(b.name)),
      productos: Array.from(productSet)
    };
  }, [data]);

  const bestBlock = useMemo(() => {
    if (chartData.data.length === 0) return 'N/A';
    return chartData.data.reduce((prev: any, current: any) => {
      const prevTotal = Object.keys(prev).filter(k => k !== 'name').reduce((sum, key) => sum + prev[key], 0);
      const currTotal = Object.keys(current).filter(k => k !== 'name').reduce((sum, key) => sum + current[key], 0);
      return currTotal > prevTotal ? current : prev;
    })?.name;
  }, [chartData]);

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold tracking-widest uppercase">Analizando Rendimiento por Bloque...</div>;

  return (
    <div className="flex flex-col gap-4">

      {/* SLICERS (Filtros Horizontales) */}
      <div className="bg-white p-3 border-b border-slate-100 flex flex-wrap gap-8 items-center">
        <Slicer
          label="Año de Análisis"
          value={filtros.ano}
          options={['2024', '2025']}
          onChange={(v: string) => setFiltros({...filtros, ano: parseInt(v)})}
        />
        <div className="ml-auto flex gap-6 border-l border-slate-100 pl-6">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-[#005d5d] uppercase">Bloque con Mayor Carga</span>
            <span className="text-sm font-black text-[#f5a623]">{bestBlock}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Gráfico de Barras Apiladas */}
        <div className="col-span-12 lg:col-span-9 bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#005d5d] mb-6 uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid size={14} />
            Producción Acumulada por Bloque y Línea de Producto
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" style={{ fontSize: '10px', fill: '#999', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis style={{ fontSize: '10px', fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8f9fa'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                {chartData.productos.map((prod, index) => (
                  <Bar
                    key={prod}
                    dataKey={prod}
                    fill={COLORS[index % COLORS.length]}
                    stackId="a"
                    barSize={45}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel Lateral de Eficiencia */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-[#005d5d] p-6 rounded shadow-lg text-white">
            <Zap className="text-emerald-400 mb-4" size={28} />
            <h3 className="text-lg font-black uppercase leading-tight mb-2">Bloque Líder</h3>
            <p className="text-emerald-100/80 text-xs font-medium leading-relaxed mb-6">
              El bloque <span className="text-white font-bold">{bestBlock}</span> presenta la mejor combinación de aprovechamiento de área y volumen de corte.
            </p>
            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold uppercase text-emerald-200 mb-1">Total Tallos Bloque</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black">
                  {chartData.data.find(d => d.name === bestBlock)
                    ? Object.keys(chartData.data.find(d => d.name === bestBlock))
                        .filter(k => k !== 'name')
                        .reduce((sum, k) => sum + chartData.data.find(d => d.name === bestBlock)[k], 0)
                        .toLocaleString()
                    : 0}
                </span>
                <TrendingUp size={24} className="text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex-1">
            <h3 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Leyenda de Eficiencia</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Capacidad Técnica</span>
                  <span>94%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#f5a623]" style={{ width: '94%' }}></div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed italic mt-4">
                "La distribución balanceada entre bloques garantiza una logística de cosecha optimizada."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slicer({ label, value, onChange, options }: any) {
  return (
    <div className="flex flex-col min-w-[140px]">
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
