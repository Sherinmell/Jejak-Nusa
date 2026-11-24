import { defineEventHandler } from 'h3'
import type { RowDataPacket } from 'mysql2/promise'
import { ensureDatabaseReady, getTidbPool } from '../../utils/db'

export default defineEventHandler(async () => {
  await ensureDatabaseReady()
  const pool = getTidbPool()

  const [verRows] = await pool.query<RowDataPacket[]>('SELECT VERSION() AS version, DATABASE() AS db')
  const tables = [
    'users',
    'trips',
    'hotels',
    'community_posts',
    'guide_bookings',
    'custom_trip_requests',
    'custom_trip_bids',
    'passport_stamps',
    'passport_rewards',
    'gear_addons',
    'admin_audit_logs',
    'platform_features',
    'customer_bookings'
  ]

  const counts: Record<string, number> = {}
  for (const tbl of tables) {
    const [r] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM \`${tbl}\``)
    counts[tbl] = Number(r[0]?.cnt || 0)
  }

  return {
    connected: true,
    provider: 'TiDB Cloud Serverless',
    version: String(verRows[0]?.version || 'unknown'),
    database: String(verRows[0]?.db || 'jejaknusa'),
    counts
  }
})
