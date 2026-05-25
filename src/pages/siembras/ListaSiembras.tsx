import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSiembras } from '../../hooks/useSiembras'
import DataPreviewTable from '../../components/upload/DataPreviewTable'
import { Sidebar } from '../../components/Sidebar'
import { SIEMBRAS_SUBROUTES } from '../../config/routes'
import { RefreshCcw, Database, List } from 'lucide-react'

export default function ListaSiembras() {
  const { siembras, fetchSiembras, loading } = useSiembras()
  const location = useLocation()

  const tableData = useMemo(() => siembras.map(s => ({
    ID: s?.id_siembra?.substring(0, 8),
    Bloque: s?.camas?.naves?.bloques?.nombre || 'N/A',
    Nave: s?.camas?.naves?.numero_nave || 'N/A',
    Cama: s?.camas?.numero_cama || 'N/A',
    Producto: s?.variedades?.colores?.productos?.nombre || 'N/A',
    Color: s?.variedades?.colores?.nombre || 'N/A',
    Variedad: s?.variedades?.nombre || 'N/A',
    Plantas: s?.plantas_sembradas?.toLocaleString() || 0,
    Estado: s?.estado || 'N/A'
  })), [siembras])

  useEffect(() => {
    fetchSiembras()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />

      {/* SUB-NAVBAR GRIS DE SIEMBRAS */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 shrink-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex h-11 items-center gap-1">
          {SIEMBRAS_SUBROUTES.map((sub) => (
            <Link
              key={sub.id}
              to={sub.path}
              className={`flex items-center gap-2 px-6 h-full text-[10px] font-black uppercase tracking-wider border-b-4 transition-all
                ${location.pathname === sub.path
                  ? 'border-[#005d5d] text-[#005d5d] bg-emerald-50/30'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
              `}
            >
              <sub.icon size={14} />
              {sub.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#005d5d] text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <List size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Inventario de Siembras</h2>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] opacity-70">Consulta y gestión de planos activos</p>
              </div>
            </div>

            <button
              onClick={fetchSiembras}
              className="bg-white text-[#005d5d] border border-slate-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              Actualizar Lista
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-md overflow-hidden">
             <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-slate-400" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Base de Datos de Planos</h3>
                </div>
             </div>
             <div className="p-6">
                <DataPreviewTable data={tableData} />
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
