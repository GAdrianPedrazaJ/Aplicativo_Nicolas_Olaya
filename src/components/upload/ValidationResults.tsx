import React from 'react'

export default function ValidationResults({ errors }: { errors: any[] }) {
  if (!errors || errors.length === 0) return null
  
  return (
    <div className="p-4 bg-red-50 border-l-4 border-red-400">
      <h4 className="font-semibold text-red-800 mb-3">❌ {errors.length} errores de validación</h4>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {errors.slice(0, 20).map((err, i) => (
          <div key={i} className="bg-white p-3 rounded border text-sm">
            <div className="font-medium text-red-700 mb-1">
              Fila {err.rowIndex || i + 2}:
            </div>
            <div className="text-xs">
              {Object.entries(err.errors || {}).map(([field, msgs]) => (
                <div key={field}>
                  <strong>{field}:</strong> {Array.isArray(msgs) ? msgs[0] : msgs}
                </div>
              ))}
            </div>
          </div>
        ))}
        {errors.length > 20 && (
          <p className="text-sm text-gray-600">... y {errors.length - 20} errores más</p>
        )}
      </div>
    </div>
  )
}
