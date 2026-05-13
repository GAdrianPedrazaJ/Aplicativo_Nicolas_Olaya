import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { LayoutGrid } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Consultando distribución por bloques...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <LayoutGrid size={20} />
          </div>
          <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">Rendimiento por Bloque y Producto</h3>
        </div>

        <select
          value={filtros.ano}
          onChange={(e) => setFiltros({...filtros, ano: parseInt(e.target.value)})}
          className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200"
        >
          {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 700}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              {chartData.productos.map((prod, index) => (
                <Bar
                  key={prod}
                  dataKey={prod}
                  fill={COLORS[index % COLORS.length]}
                  stackId="a"
                  radius={index === chartData.productos.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
