require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const { z } = require('zod')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

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
  FechaSiembra: z.string().min(1),
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

// POST /planos
app.post('/planos', async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : req.body.rows
  if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'Se requiere un arreglo de filas' })

  const errors = []
  const valid = []

  rows.forEach((r, i) => {
    const mapped = normalizeRowKeys(r)
    const parsed = PlanoRow.safeParse(mapped)
    if (!parsed.success) {
      errors.push({ index: i, issues: parsed.error.errors, raw: r })
    } else {
      valid.push({ ...parsed.data, __idx: i })
    }
  })

  if (valid.length === 0) return res.status(400).json({ inserted: 0, errors })

  // Ensure Producto exists: fall back to Variedad when Producto column is missing
  for (const v of valid) {
    if (!v.Producto || String(v.Producto).trim() === '') {
      v.Producto = v.Variedad || 'DESCONOCIDO'
    }
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

    // 1. bloques
    const bloques = Array.from(new Set(valid.map((v) => v.Bloque)))
    if (bloques.length) {
      const existingResp = await supabase.from('bloques').select('id_bloque,nombre').in('nombre', bloques)
      const existing = (existingResp && existingResp.data) || []
      existing.forEach((b) => bloqueMap.set(b.nombre, b.id_bloque))
      const missing = bloques.filter((b) => !bloqueMap.has(b)).map((nombre) => ({ nombre }))
      if (missing.length) {
        const insResp = await supabase.from('bloques').insert(missing).select('id_bloque,nombre')
        const ins = (insResp && insResp.data) || []
        ins.forEach((b) => bloqueMap.set(b.nombre, b.id_bloque))
      }
    }

    // 2. naves
    const uniqueNaves = Array.from(new Set(valid.map((v) => `${v.Bloque}||${v.Nave}`))).map((s) => {
      const [bloque, nave] = s.split('||')
      return { bloque, nave }
    })
    for (const it of uniqueNaves) {
      const bloque_id = bloqueMap.get(it.bloque)
      const parsedNaveNumMatch = String(it.nave ?? '').match(/(\d+)/)
      const parsedNaveNum = parsedNaveNumMatch ? Number(parsedNaveNumMatch[1]) : null
      const matchQuery = parsedNaveNum != null ? { numero_nave: parsedNaveNum, id_bloque: bloque_id } : { nombre: it.nave, id_bloque: bloque_id }
      const found = await supabase.from('naves').select('id_nave').match(matchQuery).limit(1)
      if (found.data && found.data.length) {
        naveMap.set(`${it.bloque}||${it.nave}`, found.data[0].id_nave)
        continue
      }
      const insResp = await supabase.from('naves').insert([{ numero_nave: parsedNaveNum, nombre: it.nave, id_bloque: bloque_id }]).select('id_nave')
      const ins = (insResp && insResp.data) || []
      if (ins.length) {
        naveMap.set(`${it.bloque}||${it.nave}`, ins[0].id_nave)
      } else {
        errors.push({ message: 'No se pudo insertar nave', entry: it, detail: insResp && insResp.error })
      }
    }

    // 3. camas
    const uniqueCamas = Array.from(new Set(valid.map((v) => `${v.Bloque}||${v.Nave}||${v.Cama}`))).map((s) => {
      const [bloque, nave, cama] = s.split('||')
      return { bloque, nave, cama }
    })
    for (const it of uniqueCamas) {
      const naveKey = `${it.bloque}||${it.nave}`
      const id_nave = naveMap.get(naveKey)
      const parsedCamaNumMatch = String(it.cama ?? '').match(/(\d+)/)
      const parsedCamaNum = parsedCamaNumMatch ? Number(parsedCamaNumMatch[1]) : null
      const matchQuery = parsedCamaNum != null ? { numero_cama: parsedCamaNum, id_nave } : { nombre: it.cama, id_nave }
      const found = await supabase.from('camas').select('id_cama').match(matchQuery).limit(1)
      if (found.data && found.data.length) {
        camaMap.set(`${it.bloque}||${it.nave}||${it.cama}`, found.data[0].id_cama)
        continue
      }
      const areaVal = (it.AreaM2 !== undefined && it.AreaM2 !== null) ? Number(it.AreaM2) : 0
      const payload = { numero_cama: parsedCamaNum, nombre: it.cama, id_nave, area_m2: isNaN(areaVal) ? 0 : areaVal }
      const insResp = await supabase.from('camas').insert([payload]).select('id_cama')
      const ins = (insResp && insResp.data) || []
      if (ins.length) {
        camaMap.set(`${it.bloque}||${it.nave}||${it.cama}`, ins[0].id_cama)
      } else {
        errors.push({ message: 'No se pudo insertar cama', entry: it, detail: insResp && insResp.error })
      }
    }

    // 4. productos/colores/variedades
    const productos = Array.from(new Set(valid.map((v) => v.Producto)))
    if (productos.length) {
      const existResp = await supabase.from('productos').select('id_producto,nombre').in('nombre', productos)
      const exist = (existResp && existResp.data) || []
      exist.forEach((p) => productoMap.set(p.nombre, p.id_producto))
      const missing = productos.filter((p) => !productoMap.has(p)).map((nombre) => ({ nombre }))
      if (missing.length) {
        const insResp = await supabase.from('productos').insert(missing).select('id_producto,nombre')
        const ins = (insResp && insResp.data) || []
        ins.forEach((p) => productoMap.set(p.nombre, p.id_producto))
      }
    }

    // colores
    const colores = Array.from(new Set(valid.map((v) => `${v.Producto}||${v.Color}`))).map((s) => {
      const [producto, color] = s.split('||')
      return { producto, color }
    })
    for (const it of colores) {
      const id_producto = productoMap.get(it.producto)
      const foundResp = await supabase.from('colores').select('id_color').match({ nombre: it.color, id_producto }).limit(1)
      const found = (foundResp && foundResp.data) || []
      if (found && found.length) {
        colorMap.set(`${it.producto}||${it.color}`, found[0].id_color)
        continue
      }
      const insResp = await supabase.from('colores').insert([{ nombre: it.color, id_producto }]).select('id_color')
      const ins = (insResp && insResp.data) || []
      if (ins.length) colorMap.set(`${it.producto}||${it.color}`, ins[0].id_color)
      else errors.push({ message: 'No se pudo insertar color', entry: it, detail: insResp && insResp.error })
    }

    // variedades
    const variedades = Array.from(new Set(valid.map((v) => `${v.Producto}||${v.Color}||${v.Variedad}`))).map((s) => {
      const [producto, color, variedad] = s.split('||')
      return { producto, color, variedad }
    })
    for (const it of variedades) {
      const id_producto = productoMap.get(it.producto)
      const id_color = colorMap.get(`${it.producto}||${it.color}`)
      const foundResp = await supabase.from('variedades').select('id_variedad').match({ nombre: it.variedad, id_color }).limit(1)
      const found = (foundResp && foundResp.data) || []
      if (found && found.length) {
        variedadMap.set(`${it.producto}||${it.color}||${it.variedad}`, found[0].id_variedad)
        continue
      }
      const insResp = await supabase.from('variedades').insert([{ nombre: it.variedad, id_color }]).select('id_variedad')
      const ins = (insResp && insResp.data) || []
      if (ins.length) variedadMap.set(`${it.producto}||${it.color}||${it.variedad}`, ins[0].id_variedad)
      else errors.push({ message: 'No se pudo insertar variedad', entry: it, detail: insResp && insResp.error })
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
      siembras.push({ id_cama: cama_id, id_variedad: variedad_id, fecha_siembra: fecha.toISOString().split('T')[0], plantas_sembradas: Number(v.PlantasSembradas), estado: v.Estado || 'EN PRODUCCION', creado_por: null })
    }

    // insert siembras
    if (siembras.length) {
      const { data: insSiembras, error: insErr } = await supabase.from('siembras').insert(siembras).select('id_siembra,id_cama,fecha_siembra')
      if (insErr) throw insErr
      // create ciclos for inserted siembras
      const ciclos = (insSiembras || []).map((s) => ({ id_siembra: s.id_siembra, numero_ciclo: 1, fecha_inicio: s.fecha_siembra, estado: 'ACTIVO' }))
      if (ciclos.length) {
        const { error: cErr } = await supabase.from('ciclos_produccion').insert(ciclos)
        if (cErr) throw cErr
      }
    }

    return res.json({ inserted: siembras.length, errors, details: { bloques: bloqueMap.size } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno', details: String(err) })
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
