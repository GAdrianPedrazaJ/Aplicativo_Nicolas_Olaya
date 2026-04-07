import React from 'react'

export default function BulkRetryModal({ open, total, done, onClose }: { open: boolean, total: number, done: number, onClose: () => void }) {
  if (!open) return null

  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        <h3 className="text-lg font-semibold mb-2">Reintentando filas</h3>
        <p className="text-sm text-gray-600 mb-4">Procesando {done} de {total} filas</p>
        <div className="w-full bg-gray-100 rounded h-3 mb-3 overflow-hidden">
          <div className="h-3 bg-green-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">{percent}%</div>
          <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded text-sm">Cerrar</button>
        </div>
      </div>
    </div>
  )
}
