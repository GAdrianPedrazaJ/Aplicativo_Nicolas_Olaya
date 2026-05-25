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
import { Trash2 } from 'lucide-react'

type RowData = Record<string, unknown>

const columnHelper = createColumnHelper<RowData>()

const norm = (s: string) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').replace(/[_-]/g, '').toLowerCase()

const extractProduct = (v: any) => {
  if (v == null) return ''
  const s = String(v).trim()
  if (!s) return ''
  const sepMatch = s.match(/\s[-—–:\|]\s/)
  if (sepMatch) return s.split(sepMatch[0])[0].trim()
  if (s.includes(' - ')) return s.split(' - ')[0].trim()
  if (s.includes('—')) return s.split('—')[0].trim()
  if (s.includes('-')) return s.split('-')[0].trim()
  return s
}

const TARGET_FIELDS = [
  'Bloque', 'Nave', 'Cama', 'Producto', 'Color', 'Variedad', 'FechaSiembra', 'PlantasSembradas', 'AreaM2', 'Estado'
] as const

type TargetField = (typeof TARGET_FIELDS)[number]

interface DataPreviewTableProps {
  data: RowData[]
  onMapped?: (mapped: RowData[]) => void
  onDeleteRow?: (row: RowData) => void
}

export default function DataPreviewTable({ data, onMapped, onDeleteRow }: DataPreviewTableProps) {
  const keys = React.useMemo(() => Array.from(new Set(data?.flatMap((r) => Object.keys(r)) || [])), [data])

  const targetFields = React.useMemo(() => Array.from(TARGET_FIELDS), [])

  const detectKey = React.useCallback((candidates: string[]) => keys.find((k) => candidates.some((c) => norm(k).includes(c))), [keys])

  const productKey = React.useMemo(() => detectKey(['flor', 'producto', 'product']) || 'Flor', [detectKey])
  const colorKey = React.useMemo(() => detectKey(['color', 'colores']) || 'Color', [detectKey])
  const variedadKey = React.useMemo(() => detectKey(['var', 'variedad', 'variedades']) || 'Variedad', [detectKey])

  const autoMapping = React.useMemo(() => {
    const mapping: Record<string, string | undefined> = {}

    targetFields.forEach((t) => {
      let found = keys.find((k) => norm(k) === norm(t) || norm(k).includes(norm(t)) || norm(t).includes(norm(k)))
      if (!found) {
        if (t === 'Producto') found = productKey
        if (t === 'Color') found = colorKey
        if (t === 'Variedad') found = variedadKey
      }
      mapping[t] = found
    })

    if (data.length > 0 && !mapping['FechaSiembra']) {
      const sampleSize = Math.min(10, data.length)
      const sampleRows = data.slice(0, sampleSize)

      const isDateLike = (v: any) => {
        if (v == null) return false
        const s = String(v).trim()
        if (!s) return false
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) return true
        if (/^\d+$/.test(s)) {
          const n = Number(s)
          return n > 20000 && n < 50000
        }
        return false
      }

      for (const k of keys) {
        if (mapping['FechaSiembra']) break
        let count = 0
        for (const r of sampleRows) {
          if (isDateLike(r[k])) count++
        }
        if (count >= Math.max(1, Math.floor(sampleSize * 0.6))) {
          mapping['FechaSiembra'] = k
        }
      }
    }

    return mapping
  }, [data, keys, targetFields, productKey, colorKey, variedadKey])

  const [mapping, setMapping] = React.useState<Record<string, string | undefined>>(() => autoMapping)

  // When headers/keys change, reapply auto-mapping so fields like FechaSiembra get detected
  const onMappedRef = React.useRef(onMapped)
  React.useEffect(() => {
    onMappedRef.current = onMapped
  }, [onMapped])

  React.useEffect(() => {
    setMapping(autoMapping)
  }, [autoMapping])

  // visibleData: the rows currently shown in the table (affected by filters)
  const [visibleData, setVisibleData] = React.useState<RowData[]>(data)
  React.useEffect(() => setVisibleData(data), [data])

  const applyMapping = () => {
    const mapped = data.map((row) => {
      const out: any = {}
      targetFields.forEach((t) => {
        const source = mapping[t]
        if (source) out[t] = row[source]
      })
      return out
    })
    onMappedRef.current?.(mapped)
  }

  const columns = React.useMemo(() => {
    const cols = keys.map((header) =>
      columnHelper.accessor(header as keyof RowData, {
        id: header,
        header,
        cell: (info) => String(info.getValue() ?? ''),
      })
    )

    if (onDeleteRow) {
      cols.push(
        columnHelper.display({
          id: 'actions',
          header: 'Acciones',
          cell: (info) => (
            <button
              onClick={() => onDeleteRow(info.row.original)}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              title="Eliminar Registro"
            >
              <Trash2 size={16} />
            </button>
          ),
        }) as any
      )
    }

    return cols
  }, [keys, onDeleteRow])

  const table = useReactTable({
    data: visibleData,
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

  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-500 p-8 text-center">No hay datos cargados.</div>
  }

  return (
    <div className="w-full">
      <DataPreviewFilterPanel
        data={data}
        productKey={productKey}
        colorKey={colorKey}
        variedadKey={variedadKey}
        mapping={mapping}
        targetFields={targetFields}
        onMapped={onMapped}
        setVisibleData={setVisibleData}
      />

      {/* Search */}
      <div className="mb-4 flex justify-center">
        <input
          placeholder="Buscar en datos..."
          value={(table.getState().globalFilter ?? '') as string}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="w-full max-w-4xl p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
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
                    className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' (asc)',
                      desc: ' (desc)',
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
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center"
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

interface DataPreviewFilterPanelProps {
  data: RowData[]
  productKey: string
  colorKey: string
  variedadKey: string
  mapping: Record<string, string | undefined>
  targetFields: string[]
  onMapped?: (mapped: RowData[]) => void
  setVisibleData: React.Dispatch<React.SetStateAction<RowData[]>>
}

function DataPreviewFilterPanel({
  data,
  productKey,
  colorKey,
  variedadKey,
  mapping,
  targetFields,
  onMapped,
  setVisibleData,
}: DataPreviewFilterPanelProps) {
  const onMappedRef = React.useRef(onMapped)
  React.useEffect(() => {
    onMappedRef.current = onMapped
  }, [onMapped])

  const normV = (s: any) => (s == null ? '' : String(s).trim().toLowerCase().replace(/\s+/g, ' '))
  type Combo = { producto: string; color: string; variedad: string; count: number; sample: RowData[] }

  const combos = React.useMemo(() => {
    const map = new Map<string, Combo>()
    for (const r of data) {
      const raw = (r[productKey] ?? r['Flor'] ?? '') as any
      const p = extractProduct(raw)
      const c = (r[colorKey] ?? r['Color'] ?? '') as string
      const v = (r[variedadKey] ?? r['Variedad'] ?? '') as string
      const key = `${normV(p)}||${normV(c)}||${normV(v)}`
      if (!map.has(key)) map.set(key, { producto: p, color: c, variedad: v, count: 0, sample: [] })
      const e = map.get(key)!
      e.count += 1
      if (e.sample.length < 2) e.sample.push(r)
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [data, productKey, colorKey, variedadKey])

  const products = React.useMemo(
    () => Array.from(new Map(combos.map((c) => [normV(c.producto), c.producto])).values()),
    [combos]
  )

  const productCounts = React.useMemo(() => {
    const acc = new Map<string, number>()
    combos.forEach((c) => {
      const k = normV(c.producto)
      acc.set(k, (acc.get(k) || 0) + c.count)
    })
    return acc
  }, [combos])

  const colors = React.useMemo(
    () =>
      Array.from(
        combos
          .map((c) => ({ producto: c.producto, color: c.color, key: `${normV(c.producto)}||${normV(c.color)}` }))
          .reduce((acc: Map<string, { producto: string; color: string }>, cur) => {
            if (!acc.has(cur.key)) acc.set(cur.key, { producto: cur.producto, color: cur.color })
            return acc
          }, new Map()).values()
      ),
    [combos]
  )

  const varieties = React.useMemo(
    () =>
      Array.from(
        combos
          .map((c) => ({ producto: c.producto, color: c.color, variedad: c.variedad, key: `${normV(c.producto)}||${normV(c.color)}||${normV(c.variedad)}` }))
          .reduce((acc: Map<string, { producto: string; color: string; variedad: string }>, cur) => {
            if (!acc.has(cur.key)) acc.set(cur.key, cur)
            return acc
          }, new Map()).values()
      ),
    [combos]
  )

  const [selectedProducts, setSelectedProducts] = React.useState<Set<string>>(new Set())
  const [selectedColors, setSelectedColors] = React.useState<Set<string>>(new Set())
  const [selectedVarieties, setSelectedVarieties] = React.useState<Set<string>>(new Set())

  const colorList = React.useMemo(
    () => Array.from(colors).filter((c: any) => selectedProducts.size === 0 || selectedProducts.has(normV(c.producto))),
    [colors, selectedProducts]
  )

  const varietyList = React.useMemo(
    () =>
      Array.from(varieties).filter((v: any) => {
        const prodMatch = selectedProducts.size === 0 || selectedProducts.has(normV(v.producto))
        const colorMatch = selectedColors.size === 0 || selectedColors.has(`${normV(v.producto)}||${normV(v.color)}`)
        return prodMatch && colorMatch
      }),
    [varieties, selectedProducts, selectedColors]
  )

  const toggleSet = (s: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    const next = new Set(s)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setFn(next)
  }

  React.useEffect(() => {
    const filtered = data.filter((row) => {
      const raw = (row[productKey] ?? row['Flor'] ?? '') as any
      const p = normV(extractProduct(raw))
      const c = normV((row[colorKey] ?? row['Color'] ?? '') as any)
      const v = normV((row[variedadKey] ?? row['Variedad'] ?? '') as any)
      const prodOk = selectedProducts.size === 0 || selectedProducts.has(p)
      const colorOk = selectedColors.size === 0 || selectedColors.has(`${p}||${c}`)
      const varOk = selectedVarieties.size === 0 || selectedVarieties.has(`${p}||${c}||${v}`)
      return prodOk && colorOk && varOk
    })

    setVisibleData(filtered)
    const mappedFiltered = filtered.map((row) => {
      const out: any = {}
      targetFields.forEach((t) => {
        const source = mapping[t] ?? (t === 'Producto' ? productKey : t === 'Color' ? colorKey : t === 'Variedad' ? variedadKey : undefined)
        if (source) out[t] = row[source]
      })
      return out
    })
    onMappedRef.current?.(mappedFiltered)
  }, [data, mapping, selectedProducts, selectedColors, selectedVarieties, productKey, colorKey, variedadKey, targetFields, setVisibleData])

  const clearFilters = () => {
    setSelectedProducts(new Set())
    setSelectedColors(new Set())
    setSelectedVarieties(new Set())
    setVisibleData(data)
    const fullMapped = data.map((row) => {
      const out: any = {}
      targetFields.forEach((t) => {
        const source = mapping[t] ?? (t === 'Producto' ? productKey : t === 'Color' ? colorKey : t === 'Variedad' ? variedadKey : undefined)
        if (source) out[t] = row[source]
      })
      return out
    })
    onMappedRef.current?.(fullMapped)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="w-full">
          <div className="font-medium mb-2">Productos</div>
          <div className="h-[40vh] overflow-auto border rounded p-2">
            {products.map((p: string) => {
              const keyp = normV(p)
              const cnt = productCounts.get(keyp) || 0
              return (
                <label key={p} className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedProducts.has(keyp)} onChange={() => toggleSet(selectedProducts, setSelectedProducts, keyp)} />
                    <div className="text-sm">{p || '(sin producto)'}</div>
                  </div>
                  <div className="text-xs text-gray-400">{cnt}</div>
                </label>
              )
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <button className="px-2 py-1 text-sm bg-white border rounded text-green-700" onClick={() => setSelectedProducts(new Set(products.map((p: string) => normV(p))))}>Seleccionar todo</button>
            <button className="px-2 py-1 text-sm bg-white border rounded" onClick={() => setSelectedProducts(new Set())}>Limpiar</button>
          </div>
        </div>

        <div className="w-full">
          <div className="font-medium mb-2">Colores (por producto)</div>
          <div className="h-[40vh] overflow-auto border rounded p-2">
            {colorList.map((c: any) => {
              const key = `${normV(c.producto)}||${normV(c.color)}`
              return (
                <label key={key} className="flex items-center gap-2 mb-1">
                  <input type="checkbox" checked={selectedColors.has(key)} onChange={() => toggleSet(selectedColors, setSelectedColors, key)} />
                  <div className="text-sm">
                    <div>{c.color || '(sin color)'}</div>
                    <div className="text-xs text-gray-500">{c.producto || '(sin producto)'}</div>
                  </div>
                </label>
              )
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedColors(new Set(colors.map((c: any) => `${normV(c.producto)}||${normV(c.color)}`)))}>Seleccionar todo</button>
            <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedColors(new Set())}>Limpiar</button>
          </div>
        </div>

        <div className="w-full">
          <div className="font-medium mb-2">Variedades (por color & producto)</div>
          <div className="h-[40vh] overflow-auto border rounded p-2">
            {varietyList.map((v: any) => {
              const key = `${normV(v.producto)}||${normV(v.color)}||${normV(v.variedad)}`
              return (
                <label key={key} className="flex items-center gap-2 mb-1">
                  <input type="checkbox" checked={selectedVarieties.has(key)} onChange={() => toggleSet(selectedVarieties, setSelectedVarieties, key)} />
                  <div className="text-sm">
                    <div>{v.variedad || '(sin variedad)'}</div>
                    <div className="text-xs text-gray-500">{v.color || '(sin color)'} • {v.producto || '(sin producto)'}</div>
                  </div>
                </label>
              )
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedVarieties(new Set(varieties.map((v: any) => `${normV(v.producto)}||${normV(v.color)}||${normV(v.variedad)}`)))}>Seleccionar todo</button>
            <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedVarieties(new Set())}>Limpiar</button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <button onClick={clearFilters} className="px-4 py-2 bg-white border text-green-700 rounded">Limpiar filtros</button>
        <button
          onClick={() => {
            const mapped = data.map((row) => {
              const out: any = {}
              targetFields.forEach((t) => {
                const source = mapping[t] ?? (t === 'Producto' ? productKey : t === 'Color' ? colorKey : t === 'Variedad' ? variedadKey : undefined)
                if (source) out[t] = row[source]
              })
              return out
            })
            onMapped?.(mapped)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >Aplicar selección</button>
      </div>
    </div>
  )
}
