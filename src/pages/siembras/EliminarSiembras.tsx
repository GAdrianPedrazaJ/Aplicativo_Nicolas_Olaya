import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSiembras } from '../../hooks/useSiembras'
import { Sidebar } from '../../components/Sidebar'
import { SIEMBRAS_SUBROUTES } from '../../config/routes'
import FileUploader from '../../components/upload/FileUploader'
import DataPreviewTable from '../../components/upload/DataPreviewTable'
import { Trash2, AlertCircle, Database, Info, FileX, RefreshCcw } from 'lucide-react'

export default function EliminarSiembras() {
  const { deleteSiembrasByFile, deleteSiembras, siembras, fetchSiembras, loading } = useSiembras()
  const location = useLocation()

  const tableData = useMemo(() => siembras.map(s => ({
    ID_REAL: s?.id_siembra,
    ID: s?.id_siembra?.substring(0, 8),
    Bloque: s?.camas?.naves?.bloques?.nombre || 'N/A',
    Cama: s?.camas?.numero_cama || 'N/A',
    Variedad: s?.variedades?.nombre || 'N/A',
    Plantas: s?.plantas_sembradas?.toLocaleString() || 0,
    Estado: s?.estado || 'N/A'
  })), [siembras])

  useEffect(() => {
    fetchSiembras()
  }, [])

  const handleDeleteIndividual = async (row: any) => {
    if (window.confirm(`¿Seguro que quieres eliminar esta siembra?\n\nDetalles: Bloque ${row.Bloque}, Cama ${row.Cama}, Variedad ${row.Variedad}`)) {
      const result = await deleteSiembras([row.ID_REAL])
      if (result.success) {
        // La actualización de la tabla se hace vía fetchSiembras dentro del hook
      } else {
        alert('Error al eliminar: ' + result.error)
      }
    }
  }

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
                  ? 'border-rose-600 text-rose-600 bg-rose-50/50'
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

          {/* HEADER SECCIÓN DE RIESGO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[24px] border border-rose-100 shadow-sm shadow-rose-50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-600 text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-rose-200">
                <FileX size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Eliminación de Registros</h2>
                <p className="text-rose-600 font-bold text-[10px] uppercase tracking-widest opacity-80">Gestión de bajas y depuración del sistema</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                <AlertCircle className="text-rose-600" size={20} />
                <p className="text-[10px] font-black text-rose-700 uppercase leading-tight text-right">
                  Atención: Esta acción es irreversible.<br />Los datos serán eliminados permanentemente.
                </p>
              </div>
              <button
                onClick={fetchSiembras}
                className="bg-white text-rose-600 border border-rose-100 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 transition-all shadow-sm"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                Actualizar
              </button>
            </div>
          </div>

          {/* PANEL DE ACCIÓN (SUPERIOR - ANCHO COMPLETO) */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
            <FileUploader
              mode="siembras"
              onUpload={deleteSiembrasByFile}
              titleLabel="Eliminar por Archivo (Baja Masiva)"
              fileLabel="Seleccionar archivo de bajas"
              submitLabel="Eliminar Registros"
              confirmMessage="¿Estás seguro de que deseas eliminar masivamente estos registros? Esta acción borrará permanentemente los datos en la base de datos."
              extraInfo={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-rose-600">
                      <Info size={16} />
                      <span className="text-[11px] font-black uppercase tracking-wider text-rose-600/70">Instrucciones</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Para eliminar registros de forma masiva, suba un archivo con los datos de las siembras a retirar. El sistema buscará coincidencias exactas por <span className="font-bold text-rose-700">Bloque, Cama y Variedad</span>.
                    </p>
                  </div>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Database size={16} />
                      <span className="text-[11px] font-black uppercase tracking-wider">Seguridad</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                      También puede eliminar registros individualmente usando el icono de basura en la tabla inferior.
                    </p>
                  </div>
                </div>
              }
            />
          </div>

          {/* TABLA DE REGISTROS (INFERIOR - ANCHO COMPLETO) */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-md overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-rose-600 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Inventario de Siembras</h3>
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {siembras.length} Registros activos
              </div>
            </div>
            <div className="p-6">
              <DataPreviewTable
                onDeleteRow={handleDeleteIndividual}
                data={tableData}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
