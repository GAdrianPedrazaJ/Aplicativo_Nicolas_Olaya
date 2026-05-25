import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { statsService, StatsResumen } from '../services/statsService';
import { Sidebar } from '../components/Sidebar';
import {
  LayoutGrid,
  TrendingUp,
  Leaf,
  Calendar,
  ArrowUpRight,
  Target,
  Sparkles,
  ChevronRight,
  BarChart3,
  Activity,
  Flower2,
  ShieldAlert,
  RefreshCcw,
  AlertTriangle,
  Box,
  Sprout,
  BarChart2
} from 'lucide-react';

// Importar componentes de analítica
import ProduccionSemanal from './analytics/tabs/ProduccionSemanal';
import CiclosProductividad from './analytics/tabs/CiclosProductividad';
import Danos from './analytics/tabs/Danos';
import Comparativas from './analytics/tabs/Comparativas';
import BloquesVsProducto from './analytics/tabs/BloquesVsProducto';
import Veronicas from './analytics/tabs/Veronicas';
import Delphinium from './analytics/tabs/Delphinium';
import AstronovaDanos from './analytics/tabs/AstronovaDanos';
import Productividad from './analytics/tabs/Productividad';
import DistribucionSiembras from './analytics/tabs/DistribucionSiembras';

const TABS = [
  { id: 'general', label: 'Resumen General', icon: LayoutGrid, color: 'indigo' },
  { id: 'productividad', label: 'Productividad', icon: BarChart2, color: 'indigo' },
  { id: 'siembras', label: 'Análisis de Siembras', icon: Sprout, color: 'emerald' },
  { id: 'comparativas', label: 'Comparativas', icon: BarChart3, color: 'indigo' },
  { id: 'veronicas', label: 'Verónica Spray', icon: Activity, color: 'emerald' },
  { id: 'delphinium', label: 'Delphinium', icon: Flower2, color: 'blue' },
  { id: 'astronova', label: 'Daños Astronova', icon: ShieldAlert, color: 'rose' },
  { id: 'semanal', label: 'Producción Semanal', icon: Calendar, color: 'amber' },
  { id: 'ciclos', label: 'Ciclos', icon: RefreshCcw, color: 'purple' },
  { id: 'danos', label: 'Gestión Daños', icon: AlertTriangle, color: 'orange' },
  { id: 'bloques', label: 'Bloques vs Producto', icon: Box, color: 'cyan' },
];

export default function Dashboard() {
  const { usuario } = useAuthStore();
  const [stats, setStats] = useState<StatsResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const data = await statsService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error al cargar estadísticas", error);
      } finally {
        setLoading(false);
      }
    };
    cargarEstadisticas();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralStats();
      case 'productividad': return <Productividad />;
      case 'siembras': return <DistribucionSiembras />;
      case 'comparativas': return <Comparativas />;
      case 'veronicas': return <Veronicas />;
      case 'delphinium': return <Delphinium />;
      case 'astronova': return <AstronovaDanos />;
      case 'semanal': return <ProduccionSemanal />;
      case 'ciclos': return <CiclosProductividad />;
      case 'danos': return <Danos />;
      case 'bloques': return <BloquesVsProducto />;
      default: return renderGeneralStats();
    }
  };

  const renderGeneralStats = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Siembras Activas"
          value={stats?.totalSiembras}
          icon={Leaf}
          color="emerald"
          loading={loading}
          trend="+2 esta semana"
        />
        <StatCard
          label="Variedades"
          value={stats?.totalVariedades}
          icon={LayoutGrid}
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Tallos Cortados"
          value={stats?.tallosEsteMes.toLocaleString()}
          sublabel="Este Mes"
          icon={TrendingUp}
          color="indigo"
          loading={loading}
          trend="12% vs mes anterior"
        />
        <StatCard
          label="Calidad Promedio"
          value={stats ? `${stats.calidadPromedio}%` : null}
          icon={Target}
          color="rose"
          loading={loading}
          trend="Objetivo: 95%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">PRODUCCIÓN SEMANAL</h2>
              <p className="text-slate-500 text-sm font-medium">Rendimiento de las últimas 4 semanas</p>
            </div>
          </div>

          <div className="flex items-end gap-6 h-64 mt-4">
            {stats?.produccionSemanal.map((sem, idx) => {
              const maxTallos = Math.max(...stats.produccionSemanal.map(s => s.tallos), 1);
              const heightPercentage = (sem.tallos / maxTallos) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex justify-center items-end h-full">
                    <div
                      className="w-full max-w-[60px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-2xl transition-all duration-500 group-hover:shadow-lg group-hover:shadow-indigo-200 group-hover:-translate-y-1"
                      style={{ height: `${Math.max(10, heightPercentage)}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                        {sem.tallos}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 mt-4 tracking-widest uppercase">{sem.semana}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] text-white flex flex-col justify-between">
          <div>
            <div className="bg-indigo-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="text-indigo-400" size={24} />
            </div>
            <h2 className="text-2xl font-black mb-3 tracking-tight">Estado de Operación</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              La calidad promedio se mantiene estable. Se recomienda revisar el bloque B4 por reportes de daños leves.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-bold tracking-wide">Operación Normal</span>
              </div>
            </div>
            <button className="w-full bg-white text-slate-900 font-bold py-3 rounded-2xl text-sm hover:bg-slate-100 transition-colors">
              REVISAR ALERTAS
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      {/* NAVBAR SUPERIOR */}
      <Sidebar />

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Espaciado superior para separar de la navbar */}
        <div className="p-8 max-w-7xl mx-auto w-full flex-1">
          {renderContent()}
        </div>

        {/* NAVEGACIÓN INFERIOR (TABS ESTILO POWER BI) */}
        <div className="bg-white border-t border-slate-200 h-12 flex items-center px-4 shrink-0 z-20 overflow-x-auto no-scrollbar sticky bottom-0">
          <div className="max-w-7xl mx-auto flex h-full items-center">
            <div className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 h-12 text-[10px] font-black transition-all duration-300 uppercase tracking-wider border-t-4
                    ${activeTab === tab.id
                      ? 'bg-indigo-50/50 text-indigo-600 border-indigo-600'
                      : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sublabel, icon: Icon, color, loading, trend }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition group">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${colors[color]} border transition group-hover:scale-110 duration-300`}>
          <Icon size={22} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <ArrowUpRight size={10} />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-5">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {loading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg"></div> : value}
          </h3>
          {sublabel && <span className="text-[10px] text-slate-400 font-bold uppercase">{sublabel}</span>}
        </div>
      </div>
    </div>
  );
}
