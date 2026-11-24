import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import mysql from 'mysql2/promise'

// Simple .env loader for standalone CLI script
const envPath = resolve(process.cwd(), '.env')
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

const host = process.env.TIDB_HOST
const port = Number(process.env.TIDB_PORT || 4000)
const user = process.env.TIDB_USER
const password = process.env.TIDB_PASSWORD
const rawDb = (process.env.TIDB_DATABASE || 'jejaknusa').trim()
const forbidden = new Set(['sys', 'mysql', 'information_schema', 'performance_schema', 'metrics_schema'])
const database = !rawDb || forbidden.has(rawDb.toLowerCase()) ? 'jejaknusa' : rawDb.replace(/[^a-zA-Z0-9_]/g, '_')

async function main() {
  console.log(`Connecting to TiDB Cloud: ${host}:${port} as ${user}...`)
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  })

  try {
    const [ver] = await conn.query('SELECT VERSION() AS v')
    console.log('Connected! Server version:', ver[0].v)

    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    console.log(`Database "${database}" is ready.`)
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error('TiDB Cloud setup failed:', err.message)
  process.exit(1)
})
