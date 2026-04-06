import { supabase } from './supabase'
import { siembraRowSchema, SiembraRow } from '../utils/validators'
import { parseDate } from '../utils/dateHelpers'

type RowError = { index: number; errors: string[] }

function normalizeRow(raw: any) {
  // Normalize common header variants to our expected keys
  const mapKey = (k: string) => k.replace(/\s+/g, '').toLowerCase()
  const normalized: any = {}
  for (const k of Object.keys(raw)) {
    const v = raw[k]
    switch (mapKey(k)) {
      case 'bloque':
        normalized.Bloque = String(v ?? '').trim()
        break
      case 'nave':
        normalized.Nave = String(v ?? '').trim()
        break
      case 'cama':
        normalized.Cama = String(v ?? '').trim()
        break
      case 'variedad':
        normalized.Variedad = String(v ?? '').trim()
        break
      case 'fechasiembra':
      case 'fechadesiembra':
      case 'fechasiembra':
        normalized.FechaSiembra = String(v ?? '').trim()
        break
      case 'cantidad':
      case 'plantas':
      case 'plantassembradas':
        normalized.Cantidad = v
        break
      default:
        // ignore
        break
    }
  }
  return normalized
}

export async function insertSiembrasBatch(rows: any[], userId: string) {
  const rowErrors: RowError[] = []
  const validRows: { row: SiembraRow; index: number }[] = []

  // 1) Validate rows and normalize
  rows.forEach((raw, i) => {
    try {
      const normalized = normalizeRow(raw)
      const parsed = siembraRowSchema.parse(normalized)
      // parse/normalize date
      const iso = parseDate(parsed.FechaSiembra as unknown as string)
      if (!iso) throw new Error('FechaSiembra inválida')
      const prepared: SiembraRow = {
        ...parsed,
        FechaSiembra: iso,
      } as any
      validRows.push({ row: prepared, index: i })
    } catch (e: any) {
      rowErrors.push({ index: i, errors: [e?.message ?? String(e)] })
    }
  })

  if (validRows.length === 0) {
    return { inserted: 0, errors: rowErrors }
  }

  // Helpers to get-or-create entities
  const bloqueIdMap = new Map<string, string>()
  const naveIdMap = new Map<string, string>() // key = bloque|nave
  const camaIdMap = new Map<string, string>() // key = bloque|nave|cama
  const variedadIdMap = new Map<string, string>()

  // 2) Create / fetch bloques
  const bloques = Array.from(new Set(validRows.map((v) => v.row.Bloque)))
  if (bloques.length > 0) {
    const { data: existing } = await supabase.from('bloques').select('id,nombre').in('nombre', bloques)
    (existing ?? []).forEach((b: any) => bloqueIdMap.set(b.nombre, b.id))
    const missing = bloques.filter((b) => !bloqueIdMap.has(b)).map((nombre) => ({ nombre }))
    if (missing.length > 0) {
      const { data: inserted, error } = await supabase.from('bloques').insert(missing).select('id,nombre')
      if (error) throw error
      (inserted ?? []).forEach((b: any) => bloqueIdMap.set(b.nombre, b.id))
    }
  }

  // 3) Create / fetch naves (per bloque)
  const uniqueNaves = Array.from(
    new Set(validRows.map((v) => `${v.row.Bloque}||${v.row.Nave}`))
  ).map((s) => {
    const [bloque, nave] = s.split('||')
    return { bloque, nave }
  })

  for (const item of uniqueNaves) {
    const bloque_id = bloqueIdMap.get(item.bloque)!
    const key = `${item.bloque}||${item.nave}`
    // try fetch
    const { data: found } = await supabase.from('naves').select('id').match({ nombre: item.nave, bloque_id }).limit(1)
    if (found && found.length > 0) {
      naveIdMap.set(key, found[0].id)
      continue
    }
    const { data: ins, error } = await supabase.from('naves').insert([{ nombre: item.nave, bloque_id }]).select('id')
    if (error) throw error
    naveIdMap.set(key, ins![0].id)
  }

  // 4) Create / fetch camas
  const uniqueCamas = Array.from(
    new Set(validRows.map((v) => `${v.row.Bloque}||${v.row.Nave}||${v.row.Cama}`))
  ).map((s) => {
    const [bloque, nave, cama] = s.split('||')
    return { bloque, nave, cama }
  })

  for (const item of uniqueCamas) {
    const naveKey = `${item.bloque}||${item.nave}`
    const nave_id = naveIdMap.get(naveKey)!
    const key = `${item.bloque}||${item.nave}||${item.cama}`
    const { data: found } = await supabase.from('camas').select('id').match({ nombre: item.cama, nave_id }).limit(1)
    if (found && found.length > 0) {
      camaIdMap.set(key, found[0].id)
      continue
    }
    const { data: ins, error } = await supabase.from('camas').insert([{ nombre: item.cama, nave_id }]).select('id')
    if (error) throw error
    camaIdMap.set(key, ins![0].id)
  }

  // 5) Create / fetch variedades (simple strategy: by nombre)
  const variedades = Array.from(new Set(validRows.map((v) => v.row.Variedad)))
  if (variedades.length > 0) {
    const { data: existing } = await supabase.from('variedades').select('id,nombre').in('nombre', variedades)
    (existing ?? []).forEach((r: any) => variedadIdMap.set(r.nombre, r.id))
    const missing = variedades.filter((n) => !variedadIdMap.has(n)).map((nombre) => ({ nombre }))
    if (missing.length > 0) {
      const { data: inserted, error } = await supabase.from('variedades').insert(missing).select('id,nombre')
      if (error) throw error
      (inserted ?? []).forEach((r: any) => variedadIdMap.set(r.nombre, r.id))
    }
  }

  // 6) Check business rules: no overlapping siembras in same cama (active)
  const camaIds = Array.from(new Set(validRows.map((v) => {
    const key = `${v.row.Bloque}||${v.row.Nave}||${v.row.Cama}`
    return camaIdMap.get(key)!
  })))
  const { data: activeSiembras } = await supabase.from('siembras').select('id,cama_id,estado').in('cama_id', camaIds).eq('estado', 'ACTIVO')
  const activeCamaSet = new Set((activeSiembras ?? []).map((s: any) => s.cama_id))

  // build insert payloads and per-row errors
  const siembrasToInsert: any[] = []
  const rowIndexToPayloadIndex: number[] = []

  validRows.forEach(({ row, index }) => {
    const camaKey = `${row.Bloque}||${row.Nave}||${row.Cama}`
    const cama_id = camaIdMap.get(camaKey)!
    if (activeCamaSet.has(cama_id)) {
      rowErrors.push({ index, errors: ['Existe una siembra ACTIVA en la misma cama'] })
      return
    }
    const variedad_id = variedadIdMap.get(row.Variedad)!
    siembrasToInsert.push({
      cama_id,
      variedad_id,
      fecha_siembra: row.FechaSiembra,
      plantas_sembradas: Number(row.Cantidad),
      estado: 'ACTIVO',
      usuario_id: userId,
    })
    rowIndexToPayloadIndex.push(index)
  })

  if (siembrasToInsert.length === 0) {
    return { inserted: 0, errors: rowErrors }
  }

  // 7) Insert siembras
  const { data: insertedSiembras, error: insertErr } = await supabase.from('siembras').insert(siembrasToInsert).select('id,cama_id,fecha_siembra')
  if (insertErr) {
    throw insertErr
  }

  // 8) Create ciclos_produccion for each siembra
  const ciclos = (insertedSiembras ?? []).map((s: any) => ({ siembra_id: s.id, fecha_inicio: s.fecha_siembra, estado: 'ACTIVO' }))
  if (ciclos.length > 0) {
    const { error: cErr } = await supabase.from('ciclos_produccion').insert(ciclos)
    if (cErr) throw cErr
  }

  return { inserted: insertedSiembras?.length ?? 0, errors: rowErrors }
}
