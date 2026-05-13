import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { RefreshCcw, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '../../../services/supabase';

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
      if (!acc[key]) acc[key] = { semana_ciclo: key, tallos: 0, count: 0 };
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

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando ciclos...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3 mr-4">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <RefreshCcw size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase text-sm">Productividad por Ciclo</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Rendimiento por etapa</p>
          </div>
        </div>

        <select
          value={selectedCiclo}
          onChange={(e) => setSelectedCiclo(e.target.value)}
          className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 outline-none transition-all min-w-[200px]"
        >
          <option value="ALL">Todos los Ciclos (Promedio)</option>
          {ciclos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500" />
            Curva de Producción
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="semana_ciclo" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="valor" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-lg h-fit">
          <Zap size={24} className="mb-4 opacity-80" />
          <h4 className="text-sm font-bold uppercase tracking-widest opacity-80">Pico del Ciclo</h4>
          <p className="text-4xl font-black mt-1">
            Semana {chartData.reduce((max, curr) => curr.valor > (max.valor || 0) ? curr : max, {semana_ciclo: 0}).semana_ciclo}
          </p>
          <p className="text-xs mt-2 font-medium opacity-90">Mayor eficiencia detectada en el ciclo.</p>
        </div>
      </div>
    </div>
  );
}
