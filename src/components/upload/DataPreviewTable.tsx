import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'

type RowData = Record<string, unknown>

const columnHelper = createColumnHelper<RowData>()

export default function DataPreviewTable({ data, onMapped }: { data: RowData[], onMapped?: (mapped: RowData[]) => void }) {
  if (!data || data.length === 0) return <div className="text-sm text-gray-500 p-8 text-center">No hay datos cargados.</div>

  const keys = Array.from(new Set(data.flatMap((r) => Object.keys(r))))

  // Fields we expect to map to
  const targetFields = [
    'Bloque', 'Nave', 'Cama', 'Producto', 'Color', 'Variedad', 'FechaSiembra', 'PlantasSembradas', 'AreaM2', 'Estado'
  ]

  // helper: normalize header for matching
  const norm = (s: string) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').replace(/[_-]/g, '').toLowerCase()

  // default auto mapping
  const autoMapping: Record<string, string | undefined> = {}
  targetFields.forEach((t) => {
    const found = keys.find((k) => norm(k) === norm(t) || norm(k).includes(norm(t)) || norm(t).includes(norm(k)))
    if (found) autoMapping[t] = found
    else autoMapping[t] = undefined
  })

  const [mapping, setMapping] = React.useState<Record<string, string | undefined>>(autoMapping)

  const applyMapping = () => {
    const mapped = data.map((row) => {
      const out: any = {}
      targetFields.forEach((t) => {
        const source = mapping[t]
        if (source) out[t] = row[source]
      })
      return out
    })
    onMapped?.(mapped)
  }

  const columns = keys.map((header) =>
    columnHelper.accessor(header as keyof RowData, {
      id: header,
      header,
      cell: (info) => String(info.getValue() ?? ''),
    })
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full">
      {/* Mapping controls */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {targetFields.map((tf) => (
            <div key={tf} className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-28">{tf}</label>
              <select
                value={mapping[tf] ?? ''}
                onChange={(e) => setMapping((m) => ({ ...m, [tf]: e.target.value || undefined }))}
                className="p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">-- sin asignar --</option>
                {keys.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMapping(autoMapping)} className="px-3 py-2 bg-gray-200 rounded">Auto map</button>
          <button onClick={applyMapping} className="px-3 py-2 bg-blue-600 text-white rounded">Aplicar mapeo</button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          placeholder="Buscar en datos..."
          value={(table.getState().globalFilter ?? '') as string}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td 
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Página <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> de <span className="font-medium">{table.getPageCount()}</span>
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-12 h-10 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
            >
              {'<'}
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-12 h-10 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
            >
              {'>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

