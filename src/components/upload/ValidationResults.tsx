import React from 'react'

export default function ValidationResults({ errors, onEdit, onRetryNow }: { errors: any[], onEdit?: (err: any) => void, onRetryNow?: (err: any) => void }) {
  if (!errors || errors.length === 0) return null

  return (
    <div className="p-4 bg-red-50 border-l-4 border-red-400">
      <h4 className="font-semibold text-red-800 mb-3">❌ {errors.length} errores de validación</h4>
      <div className="max-h-72 overflow-y-auto space-y-2">
        {errors.slice(0, 50).map((err, i) => (
          <div key={i} className="bg-white p-3 rounded border text-sm">
            <div className="font-medium text-red-700 mb-1">Fila {typeof err.rowIndex === 'number' ? err.rowIndex + 1 : (err.rowIndex || i + 1)}</div>
            <div className="text-xs space-y-1">
              {Array.isArray(err.messages) ? (
                err.messages.map((m: any, j: number) => (
                  <div key={j} className="break-words">- {String(m)}</div>
                ))
              ) : (
                <div>- {String(err.message ?? JSON.stringify(err))}</div>
              )}
              {err.raw && (
                <div className="text-xs text-gray-500 mt-2">Datos: <pre className="inline">{JSON.stringify(err.raw)}</pre></div>
              )}
              <div className="mt-2 flex gap-2">
                {onEdit && (
                  <button onClick={() => onEdit(err)} className="px-2 py-1 text-sm bg-yellow-100 border rounded">Editar y reintentar</button>
                )}
                {onRetryNow && (
                  <button onClick={() => onRetryNow(err)} className="px-2 py-1 text-sm bg-green-100 border rounded">Reintentar ahora</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {errors.length > 50 && (
          <p className="text-sm text-gray-600">... y {errors.length - 50} errores más</p>
        )}
      </div>
    </div>
  )
}
