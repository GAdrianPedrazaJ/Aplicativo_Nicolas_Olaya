#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

const args = process.argv.slice(2)
let file = args[0]
if (!file) {
  const candidates = fs.readdirSync(process.cwd()).filter(f => f.match(/Detalle\.(xlsx|xls|csv)$/i))
  if (candidates.length) file = candidates[0]
}
if (!file || !fs.existsSync(file)) {
  console.error('No Detalle.xlsx found in cwd. Provide path as arg')
  process.exit(2)
}
const wb = XLSX.readFile(file)
const sheet = wb.SheetNames[0]
const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' })
if (rows.length === 0) {
  console.log('No rows')
  process.exit(0)
}
const headers = rows[0]
const sample = rows.slice(1, 11)
console.log('File:', file)
console.log('Headers:', JSON.stringify(headers, null, 2))
console.log('Sample rows (first 10):')
console.log(JSON.stringify(sample, null, 2))
