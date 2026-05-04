import React from 'react'
import { useHistoricos } from '../hooks/useHistoricos'
import FileUploader from '../components/upload/FileUploader'
import ModuleCard from '../components/shared/ModuleCard'

export default function CargaHistoricos() {
  const { uploadData } = useHistoricos()

  return (
    <div className="space-y-10 pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Históricos de Producción</h2>
        <p className="text-slate-500 mt-1">Sincroniza los datos de cortes y rendimiento histórico.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <ModuleCard title="Importación de Datos">
          <div className="max-w-3xl">
            <div className="mb-8 p-5 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl">
              <h4 className="text-indigo-900 font-bold mb-1 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Instrucciones de Carga
              </h4>
              <p className="text-indigo-700 text-sm leading-relaxed">
                El sistema procesará los registros de corte diario. Asegúrese de que el archivo incluya las columnas de
                <strong> Fecha Corte</strong>, <strong>Tallos Cortados</strong> y la referencia al <strong>Ciclo</strong> o <strong>Cama</strong> correspondiente.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
              <FileUploader mode="historicos" onUpload={uploadData} />
            </div>
          </div>
        </ModuleCard>
      </div>
    </div>
  )
}
