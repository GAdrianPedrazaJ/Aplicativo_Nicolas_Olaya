require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const { z } = require('zod')

const app = express()
app.use(cors())
// allow larger payloads for big spreadsheets
app.use(express.json({ limit: '50mb' }))

const PORT = process.env.PORT || 4000
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Zod schema for a plano row
const PlanoRow = z.object({
  Bloque: z.string().min(1),
  Nave: z.string().min(1),
  Cama: z.string().min(1),
  AreaM2: z.preprocess((v) => Number(v), z.number().positive()).optional(),
  Producto: z.string().min(1).optional(),
  Color: z.string().min(1),
  Variedad: z.string().min(1),
  FechaSiembra: z.preprocess((v) => (v == null ? '' : String(v)), z.string().min(1)),
  PlantasSembradas: z.preprocess((v) => Number(v), z.number().int().nonnegative()),
  Estado: z.string().optional(),
})

// Normalize incoming row keys to the expected schema keys.
function normalizeRowKeys(raw) {
  const normalized = {}
  const normKey = (k) => String(k || '')
    .normalize('NFD') // split accents
    .replace(/\p{Diacritic}/gu, '') // remove diacritics
    .replace(/\s+/g, '')
    .replace(/[_-]/g, '')
    .toLowerCase()

  for (const k of Object.keys(raw)) {
    const v = raw[k]
    const k2 = normKey(k)
    switch (k2) {
      case 'bloque':
      case 'bloquename':
      case 'nombrebloque':
        normalized.Bloque = v
        break
      case 'nave':
      case 'nomenave':
        normalized.Nave = v
        break
      case 'cama':
      case 'numerocama':
      case 'nombrecama':
        normalized.Cama = v
        break
      case 'aream2':
      case 'area':
      case 'aream2m':
        normalized.AreaM2 = v
        break
      case 'producto':
      case 'productonombre':
      case 'productoname':
      case 'producto_nombre':
        normalized.Producto = v
        break
      case 'flor':
      case 'flower':
        // some files use 'Flor' column for product name
        normalized.Producto = v
        break
      case 'color':
      case 'colornombre':
        normalized.Color = v
        break
      case 'variedad':
      case 'variedadnombre':
        normalized.Variedad = v
        break
      case 'fechasiembra':
      case 'fechadesiembra':
      case 'fechadesiembra':
      case 'fechadesiembra':
      case 'fecha':
      case 'fechade siembra':
      case 'fechadesiembra':
      case 'fechadesiembra':
        normalized.FechaSiembra = v
        break
      case 'plantas':
      case 'plantassembradas':
      case 'cantidad':
        normalized.PlantasSembradas = v
        break
      case 'estado':
        normalized.Estado = v
        break
      default:
        // ignore unknown columns
        break
    }
  }

  return normalized
}

// Extract unique Producto+Color+Variedad combos from raw rows
function extractUniqueCombos(rows) {
  const norm = (s) => (s == null ? '' : String(s).trim().toLowerCase().replace(/\s+/g, ' '))
  const map = new Map()
  rows.forEach((r, i) => {
    const mapped = normalizeRowKeys(r)
    const p = mapped.Producto || mapped.Flor || ''
    const c = mapped.Color || ''
    const v = mapped.Variedad || ''
    const key = `${norm(p)}||${norm(c)}||${norm(v)}`
    if (!map.has(key)) map.set(key, { producto: p, color: c, variedad: v, count: 0, sample: [] })
    const rec = map.get(key)
    rec.count += 1
    if (rec.sample.length < 3) rec.sample.push({ index: i, raw: r })
  })
  return Array.from(map.values()).map(x => ({ producto: x.producto, color: x.color, variedad: x.variedad, count: x.count, sample: x.sample }))
}

// POST /planos
app.post('/planos', async (req, res) => {
  // support two shapes: direct array body or { rows: [...], allowedCombos: [...] }
  const rows = Array.isArray(req.body) ? req.body : (Array.isArray(req.body && req.body.rows) ? req.body.rows : null)
  const allowedCombos = (req.body && (req.body.allowedCombos || req.body.allowed)) || null
  // allowedCombos can be an array of strings 'producto||color||variedad' or objects {producto,color,variedad}
  if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'Se requiere un arreglo de filas' })

  // Dev logging: incoming payload overview
  try {
    console.log(`[planos] incoming rows: ${rows.length}`)
    if (rows.length > 0) console.debug('[planos] sample rows:', JSON.stringify(rows.slice(0, Math.min(5, rows.length))))
  } catch (e) {
    // ignore stringify errors
  }

  const errors = []
  const valid = []

    rows.forEach((r, i) => {
    const mapped = normalizeRowKeys(r)
    // do NOT auto-fill Producto here; we'll try to infer it later from Variedad+Color
    const parsed = PlanoRow.safeParse(mapped)
    if (!parsed.success) {
      errors.push({ index: i, issues: parsed.error.errors, raw: r })
    } else {
        valid.push({ ...parsed.data, __idx: i })
    }
  })

  if (valid.length === 0) return res.status(400).json({ inserted: 0, errors })

  // If allowedCombos provided, filter valid rows to only those combos
  if (allowedCombos && Array.isArray(allowedCombos) && allowedCombos.length) {
    const norm = (s) => (s == null ? '' : String(s).trim().toLowerCase().replace(/\s+/g, ' '))
    const allowedSet = new Set()
    for (const a of allowedCombos) {
      if (typeof a === 'string') {
        allowedSet.add(a.toLowerCase())
      } else if (a && (a.producto || a.color || a.variedad)) {
        const key = `${norm(a.producto || '')}||${norm(a.color || '')}||${norm(a.variedad || '')}`
        allowedSet.add(key)
      }
    }
    const before = valid.length
    const filtered = valid.filter(v => allowedSet.has(`${norm(v.Producto || v.Flor || '')}||${norm(v.Color)}||${norm(v.Variedad)}`))
    console.log(`[planos] filtered by allowedCombos: ${before} -> ${filtered.length}`)
    valid.length = 0
    valid.push(...filtered)
  }

  // Try to infer missing Producto values by looking up existing variedades/colores in DB
  // Fetch existing catalogs to perform inference without creating duplicates
  try {
    const { data: allProducts } = await supabase.from('productos').select('id_producto,nombre')
    const { data: allColors } = await supabase.from('colores').select('id_color,nombre,id_producto')
    const { data: allVariedades } = await supabase.from('variedades').select('id_variedad,nombre,id_color')
    const prodById = new Map((allProducts || []).map(p => [p.id_producto, p]))
    const colorById = new Map((allColors || []).map(c => [c.id_color, c]))
    const variedadList = (allVariedades || [])

    for (const v of valid) {
      if (!v.Producto || String(v.Producto).trim() === '') {
        // try to find variedad match (normalized)
        const vv = String(v.Variedad || '').trim()
        const cc = String(v.Color || '').trim()
        if (vv) {
          const match = variedadList.find(x => norm(x.nombre) === norm(vv))
          if (match) {
            const colorRow = colorById.get(match.id_color)
            if (colorRow) {
              const prodRow = prodById.get(colorRow.id_producto)
              if (prodRow) {
                v.Producto = prodRow.nombre
                v.Color = colorRow.nombre
                // keep variedad as-is (match.nombre could be different case/spacing)
                v.Variedad = match.nombre
                continue
              }
            }
          }
        }
        // try to match color only and get product
        if (cc) {
          const foundColor = (allColors || []).find(c => norm(c.nombre) === norm(cc))
          if (foundColor) {
            const prodRow = prodById.get(foundColor.id_producto)
            if (prodRow) {
              v.Producto = prodRow.nombre
              v.Color = foundColor.nombre
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error fetching catalogs for inference', e)
  }
  // If any Producto is still missing after inference, stop and return rows
  const missingProducts = valid.filter(v => !v.Producto || String(v.Producto).trim() === '')
  if (missingProducts.length) {
    // return small sample to let UI ask for mapping before creating placeholder products
    const sample = missingProducts.slice(0, 20).map(r => ({ index: r.__idx, Flor: r.Producto || r.Flor || null, Color: r.Color, Variedad: r.Variedad }))
    return res.status(400).json({ error: 'Faltan productos para algunas filas. Mapéalos antes de importar.', missing_count: missingProducts.length, sample })
  }

  // helper: parse Excel serial dates or ISO strings
  function parseExcelDate(value) {
    if (value == null) return null
    const s = String(value).trim()
    // pure integer => likely Excel serial
    if (/^\d+$/.test(s)) {
      const serial = Number(s)
      const ms = (serial - 25569) * 86400 * 1000 // convert Excel serial to JS ms
      const d = new Date(ms)
      return isNaN(d.getTime()) ? null : d
    }
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }

  try {
    // Maps for created/found ids
    const bloqueMap = new Map()
    const naveMap = new Map()
    const camaMap = new Map()
    const productoMap = new Map()
    const colorMap = new Map()
    const variedadMap = new Map()
    const pad = (n) => String(n).padStart(3, '0')
  // helper: normalize names for matching (trim, collapse spaces, lowercase)
  const norm = (s) => (s == null ? '' : String(s).trim().replace(/\s+/g, ' ').toLowerCase())
    // record what we create during this import for audit / UI
    const created = { productos: [], colores: [], variedades: [], bloques: [], naves: [], camas: [] }
    // 1. productos/colores/variedades — create product catalog first
    // PRODUCTS: fetch existing products and match using normalized names to avoid case/whitespace duplicates
    const productos = Array.from(new Set(valid.map((v) => v.Producto)))
    if (productos.length) {
      const existResp = await supabase.from('productos').select('id_producto,nombre')
      const exist = (existResp && existResp.data) || []
      // map normalized name -> id
      const existMap = new Map()
      exist.forEach((p) => existMap.set(norm(p.nombre), p.id_producto))
      // fill productoMap with normalized keys but keep original display name as key too
      exist.forEach((p) => productoMap.set(p.nombre, p.id_producto))
      // for each product from file, check normalized match
      const missing = []
      for (const nombre of productos) {
        const n = norm(nombre)
        if (existMap.has(n)) {
          productoMap.set(nombre, existMap.get(n))
        } else {
          missing.push({ nombre: String(nombre).trim() })
        }
      }
      if (missing.length) {
        console.debug('[planos] inserting productos:', missing)
        const insResp = await supabase.from('productos').insert(missing).select('id_producto,nombre')
        const ins = (insResp && insResp.data) || []
        ins.forEach((p) => { productoMap.set(p.nombre, p.id_producto); created.productos.push({ id_producto: p.id_producto, nombre: p.nombre }) })
      }
    }

    // colores
    const colores = Array.from(new Set(valid.map((v) => `${v.Producto}||${v.Color}`))).map((s) => {
      const [producto, color] = s.split('||')
      return { producto, color }
    })
    for (const it of colores) {
      console.debug('[planos] ensuring color for', it)
      const id_producto = productoMap.get(it.producto)
      // fetch colors for this product and do a normalized comparison to avoid dupes by case/space
      const foundResp = await supabase.from('colores').select('id_color,nombre').eq('id_producto', id_producto)
      const foundRows = (foundResp && foundResp.data) || []
      const matched = foundRows.find(r => norm(r.nombre) === norm(it.color))
      if (matched) {
        colorMap.set(`${it.producto}||${it.color}`, matched.id_color)
        continue
      }
      console.debug('[planos] inserting color payload:', { nombre: it.color, id_producto })
      const insResp = await supabase.from('colores').insert([{ nombre: String(it.color).trim(), id_producto }]).select('id_color,nombre')
      const ins = (insResp && insResp.data) || []
      if (ins.length) { colorMap.set(`${it.producto}||${it.color}`, ins[0].id_color); created.colores.push({ id_color: ins[0].id_color, nombre: ins[0].nombre, producto: it.producto }) }
      else { errors.push({ message: 'No se pudo insertar color', entry: it, detail: insResp && insResp.error }); console.error('[planos] failed insert color:', insResp && insResp.error) }
    }

    // variedades
    const variedades = Array.from(new Set(valid.map((v) => `${v.Producto}||${v.Color}||${v.Variedad}`))).map((s) => {
      const [producto, color, variedad] = s.split('||')
      return { producto, color, variedad }
    })
    for (const it of variedades) {
      console.debug('[planos] ensuring variedad for', it)
      const id_color = colorMap.get(`${it.producto}||${it.color}`)
      // fetch variedades for this color and do normalized comparison
      const foundResp = await supabase.from('variedades').select('id_variedad,nombre').eq('id_color', id_color)
      const foundRows = (foundResp && foundResp.data) || []
      const matched = foundRows.find(r => norm(r.nombre) === norm(it.variedad))
      if (matched) {
        variedadMap.set(`${it.producto}||${it.color}||${it.variedad}`, matched.id_variedad)
        continue
      }
      console.debug('[planos] inserting variedad payload:', { nombre: it.variedad, id_color })
      const insResp = await supabase.from('variedades').insert([{ nombre: String(it.variedad).trim(), id_color }]).select('id_variedad')
      const ins = (insResp && insResp.data) || []
      if (ins.length) { variedadMap.set(`${it.producto}||${it.color}||${it.variedad}`, ins[0].id_variedad); created.variedades.push({ id_variedad: ins[0].id_variedad, nombre: ins[0].nombre, producto: it.producto, color: it.color }) }
      else { errors.push({ message: 'No se pudo insertar variedad', entry: it, detail: insResp && insResp.error }); console.error('[planos] failed insert variedad:', insResp && insResp.error) }
    }

    // 2. bloques — apply naming rule: prefix with 'B' and store nombre as e.g. 'BPM71'
    const bloquesRaw = Array.from(new Set(valid.map((v) => String(v.Bloque).trim())))
    const bloques = bloquesRaw.map((bn) => `B${bn}`)
    if (bloques.length) {
      const existingResp = await supabase.from('bloques').select('id_bloque,nombre').in('nombre', bloques)
      const existing = (existingResp && existingResp.data) || []
      existing.forEach((b) => bloqueMap.set(b.nombre, b.id_bloque))
      const missing = bloques.filter((b) => !bloqueMap.has(b)).map((nombre) => ({ nombre }))
      if (missing.length) {
        const insResp = await supabase.from('bloques').insert(missing).select('id_bloque,nombre')
        const ins = (insResp && insResp.data) || []
        ins.forEach((b) => { bloqueMap.set(b.nombre, b.id_bloque); created.bloques.push({ id_bloque: b.id_bloque, nombre: b.nombre }) })
      }
    }

    // 3. naves
    const uniqueNaves = Array.from(new Set(valid.map((v) => `${v.Bloque}||${v.Nave}`))).map((s) => {
      const [bloque, nave] = s.split('||')
      return { bloque: String(bloque).trim(), nave: String(nave).trim() }
    })
    for (const it of uniqueNaves) {
      console.debug('[planos] ensuring nave for', it)
      const blockName = `B${it.bloque}`
      const bloque_id = bloqueMap.get(blockName)
      const parsedNaveNumMatch = String(it.nave ?? '').match(/(\d+)/)
      const parsedNaveNum = parsedNaveNumMatch ? Number(parsedNaveNumMatch[1]) : null
      const naveNombre = parsedNaveNum != null ? `${blockName}N${pad(parsedNaveNum)}` : `${blockName}N${it.nave}`
      const matchQuery = parsedNaveNum != null ? { numero_nave: parsedNaveNum, id_bloque: bloque_id } : { nombre: naveNombre, id_bloque: bloque_id }
      const found = await supabase.from('naves').select('id_nave').match(matchQuery).limit(1)
      if (found.data && found.data.length) {
        naveMap.set(`${it.bloque}||${it.nave}`, found.data[0].id_nave)
        continue
      }
      const payload = { numero_nave: parsedNaveNum, nombre: naveNombre, id_bloque: bloque_id, area_m2: 462.4 }
      console.debug('[planos] inserting nave payload:', payload)
      const insResp = await supabase.from('naves').insert([payload]).select('id_nave')
      const ins = (insResp && insResp.data) || []
      if (ins.length) {
        naveMap.set(`${it.bloque}||${it.nave}`, ins[0].id_nave)
        created.naves.push({ id_nave: ins[0].id_nave, nombre: payload.nombre, bloque: blockName })
      } else {
        errors.push({ message: 'No se pudo insertar nave', entry: it, detail: insResp && insResp.error })
        console.error('[planos] failed insert nave:', insResp && insResp.error)
      }
    }

    // 4. camas
    const uniqueCamas = Array.from(new Set(valid.map((v) => `${v.Bloque}||${v.Nave}||${v.Cama}`))).map((s) => {
      const [bloque, nave, cama] = s.split('||')
      return { bloque: String(bloque).trim(), nave: String(nave).trim(), cama: String(cama).trim() }
    })
    for (const it of uniqueCamas) {
      console.debug('[planos] ensuring cama for', it)
      const naveKey = `${it.bloque}||${it.nave}`
      const id_nave = naveMap.get(naveKey)
      const parsedCamaNumMatch = String(it.cama ?? '').match(/(\d+)/)
      const parsedCamaNum = parsedCamaNumMatch ? Number(parsedCamaNumMatch[1]) : null
      const blockName = `B${it.bloque}`
      // cama nombre: B{bloque}N{nave}C{cama}
      const parsedNaveNumMatch = String(it.nave ?? '').match(/(\d+)/)
      const parsedNaveNum = parsedNaveNumMatch ? Number(parsedNaveNumMatch[1]) : null
      const navePart = parsedNaveNum != null ? `${blockName}N${pad(parsedNaveNum)}` : `${blockName}N${it.nave}`
      const camaNombre = parsedCamaNum != null ? `${navePart}C${pad(parsedCamaNum)}` : `${navePart}C${it.cama}`
      const matchQuery = parsedCamaNum != null ? { numero_cama: parsedCamaNum, id_nave } : { nombre: camaNombre, id_nave }
      const found = await supabase.from('camas').select('id_cama').match(matchQuery).limit(1)
      if (found.data && found.data.length) {
        camaMap.set(`${it.bloque}||${it.nave}||${it.cama}`, found.data[0].id_cama)
        continue
      }
      // determine area and densidad from sample rows matching this cama
      const sampleRows = valid.filter(v => String(v.Bloque).trim() === it.bloque && String(v.Nave).trim() === it.nave && String(v.Cama).trim() === it.cama)
      const areaVal = 46.24
      const densityVal = sampleRows.length ? Number(sampleRows[0].PlantasSembradas || 0) : 0
      const payload = { numero_cama: parsedCamaNum, nombre: camaNombre, id_nave, area_m2: areaVal, densidad_plantas: isNaN(densityVal) ? 0 : densityVal }
      console.debug('[planos] inserting cama payload:', payload)
      const insResp = await supabase.from('camas').insert([payload]).select('id_cama')
      const ins = (insResp && insResp.data) || []
      if (ins.length) {
        camaMap.set(`${it.bloque}||${it.nave}||${it.cama}`, ins[0].id_cama)
        created.camas.push({ id_cama: ins[0].id_cama, nombre: camaNombre, nave: navePart })
      } else {
        errors.push({ message: 'No se pudo insertar cama', entry: it, detail: insResp && insResp.error })
        console.error('[planos] failed insert cama:', insResp && insResp.error)
      }
    }

    // 5. prepare siembras payloads
    const siembras = []
    for (const v of valid) {
      const camaKey = `${v.Bloque}||${v.Nave}||${v.Cama}`
      const cama_id = camaMap.get(camaKey)
      const variedad_id = variedadMap.get(`${v.Producto}||${v.Color}||${v.Variedad}`)
      const fecha = parseExcelDate(v.FechaSiembra)
      if (!cama_id || !variedad_id || !fecha) {
        errors.push({ index: v.__idx, message: 'Falta referencia cama/variedad o fecha inválida' })
        continue
      }
      // Per user rules:
      // - creado_por fixed to given uploader id
      // - densidad_m2 set to total plantas (PlantasSembradas column)
      // - numero_ciclo = 1
      // - fecha_inicio_corte_real / fecha_fin_corte_real left null
      // - modificado_por / fecha_modificacion left null
      const creadoPor = 'dbe395e8-6d27-4285-80d2-eacf0f6404e5'
      siembras.push({
        id_cama: cama_id,
        id_variedad: variedad_id,
        fecha_siembra: fecha.toISOString().split('T')[0],
        plantas_sembradas: Number(v.PlantasSembradas),
        densidad_m2: Number(v.PlantasSembradas),
        // Normalize estado to allowed values. DB accepts: EN PRODUCCION, PODADA, ARRANCADA
        estado: (['EN PRODUCCION','PODADA','ARRANCADA'].includes(String(v.Estado)) ? String(v.Estado) : 'EN PRODUCCION'),
        creado_por: creadoPor,
        numero_ciclo: 1,
        fecha_inicio_corte_real: null,
        fecha_fin_corte_real: null,
        modificado_por: null,
        fecha_modificacion: null,
      })
    }

    // insert siembras
    if (siembras.length) {
      console.debug('[planos] inserting siembras count:', siembras.length)
      const { data: insSiembras, error: insErr } = await supabase.from('siembras').insert(siembras).select('id_siembra,id_cama,fecha_siembra')
      if (insErr) { console.error('[planos] failed insert siembras:', insErr); throw insErr }
      // create ciclos for inserted siembras
      const ciclos = (insSiembras || []).map((s) => ({ id_siembra: s.id_siembra, numero_ciclo: 1, fecha_inicio: s.fecha_siembra, estado: 'ACTIVO' }))
      if (ciclos.length) {
        console.debug('[planos] inserting ciclos count:', ciclos.length)
        const { error: cErr } = await supabase.from('ciclos_produccion').insert(ciclos)
        if (cErr) { console.error('[planos] failed insert ciclos:', cErr); throw cErr }
      }
    }

    // Dev logging: outcome
    try {
      console.log(`[planos] inserted: ${siembras.length}, errors: ${errors.length}, bloquesKnown: ${bloqueMap.size}`)
      if (errors && errors.length) console.debug('[planos] errors detail:', JSON.stringify(errors.slice(0, Math.min(10, errors.length))))
      // persist an audit of what was created during this import
      try {
        const fs = require('fs')
        fs.writeFileSync('last_import_audit.json', JSON.stringify(created, null, 2))
      } catch (e) {
        console.error('Failed to write last_import_audit.json', e)
      }
    } catch (e) {}
    return res.json({ inserted: siembras.length, errors, details: { bloques: bloqueMap.size }, created })
  } catch (err) {
    console.error(err)
    try {
      const fs = require('fs')
      // Safely stringify error, include non-enumerable props like stack
      let serialized
      try {
        serialized = JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
      } catch (se) {
        serialized = String(err)
      }
      const logLine = `${new Date().toISOString()} - /planos error:\n${serialized}\n\n`
      fs.appendFileSync('error.log', logLine)
    } catch (e) {
      console.error('Failed writing error log:', e)
    }
    const short = (err && err.stack) ? err.stack.split('\n').slice(0,5).join('\n') : (typeof err === 'string' ? err : JSON.stringify(err, Object.getOwnPropertyNames(err)).slice(0,300))
    return res.status(500).json({ error: 'Error interno', details: short })
  }
})
// POST /planos/preview - return unique Producto+Color+Variedad combos and counts
app.post('/planos/preview', (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : (Array.isArray(req.body && req.body.rows) ? req.body.rows : null)
  if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'Se requiere un arreglo de filas' })
  try {
    const combos = extractUniqueCombos(rows)
    return res.json({ combos, total_rows: rows.length })
  } catch (e) {
    console.error('preview error', e)
    return res.status(500).json({ error: 'Error procesando preview' })
  }
})
// Basic root page and health
app.get('/', (req, res) => {
  res.send(`<html><body style="font-family: Arial, Helvetica, sans-serif; padding:20px">
    <h2>RDC Tandil SAS - Backend</h2>
    <p>POST <code>/planos</code> to insert planos de siembra.</p>
    <p>Example (curl):</p>
    <pre>curl -X POST http://localhost:${PORT}/planos -H "Content-Type: application/json" -d '[{"Bloque":"B1","Nave":"N1","Cama":"C1","Producto":"Rosa","Color":"Rojo","Variedad":"Rosa Roja","FechaSiembra":"2026-03-20","PlantasSembradas":100}]'</pre>
    <p><a href="/health">/health</a></p>
  </body></html>`)
})

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }))

app.listen(PORT, () => console.log(`RDC backend listening on ${PORT}`))
