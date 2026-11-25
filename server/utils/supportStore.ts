import type { RowDataPacket } from 'mysql2/promise'
import type {
  SupportCategory,
  SupportChatMessage,
  SupportThreadRecord,
  SupportThreadStatus
} from '#shared/types/support'
import { executeSql, queryRows } from './db'

export const supportThreadsStore: SupportThreadRecord[] = [
  {
    id: 'sup-101',
    ticketCode: 'TKT-2611-001',
    customerId: 'usr-customer-demo',
    customerName: 'Nadia Kusuma',
    customerEmail: 'customer@jejaknusa.id',
    customerPhone: '0812-8890-4411',
    category: 'Pertanyaan Trip',
    subject: 'Penjemputan shuttle dari area Canggu ke Gitgit',
    bookingReference: 'INV-20261124-8842',
    status: 'Dibalas Admin',
    createdAt: '2026-11-24 09:15 WIB',
    updatedAt: '2026-11-24 09:28 WIB',
    messages: [
      {
        id: 'smsg-101-1',
        senderRole: 'customer',
        senderName: 'Nadia Kusuma',
        message: 'Halo Admin, saya sudah lunas untuk Canyoning Gitgit 6 Des. Apakah bisa konfirmasi titik jemput shuttle di Canggu jam berapa ya?',
        createdAt: '2026-11-24 09:15 WIB'
      },
      {
        id: 'smsg-101-2',
        senderRole: 'admin',
        senderName: 'Rendra Mahesa (Admin)',
        message: 'Halo Kak Nadia! Titik jemput shuttle area Canggu dijadwalkan pukul 05.30 WITA di lobi penginapan/titik temu Canggu Central. H-1 tim kami & Bli Made akan kirim shareloc driver via WhatsApp ya.',
        createdAt: '2026-11-24 09:28 WIB'
      }
    ]
  },
  {
    id: 'sup-102',
    ticketCode: 'TKT-2611-002',
    customerId: 'usr-raka-demo',
    customerName: 'Raka Mahendra',
    customerEmail: 'raka.mahendra@mail.id',
    customerPhone: '0811-2201-9980',
    category: 'Pembayaran & Invoice',
    subject: 'Batas waktu pelunasan sisa DP 70% Rinjani',
    bookingReference: 'INV-20261124-7731',
    status: 'Menunggu Balasan',
    createdAt: '2026-11-24 14:10 WIB',
    updatedAt: '2026-11-24 14:10 WIB',
    messages: [
      {
        id: 'smsg-102-1',
        senderRole: 'customer',
        senderName: 'Raka Mahendra',
        message: 'Halo Admin, saya sudah bayar DP 30% untuk trip Rinjani 12 Des. Paling lambat pelunasan sisa 70% tanggal berapa ya, dan apakah bisa lewat QRIS lagi?',
        createdAt: '2026-11-24 14:10 WIB'
      }
    ]
  }
]

interface DbSupportRow extends RowDataPacket {
  id: string
  ticket_code: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  category: SupportCategory
  subject: string
  booking_reference: string | null
  status: SupportThreadStatus
  messages_json: string
  created_at: string
  updated_at: string
}

function mapRow(row: DbSupportRow): SupportThreadRecord {
  let messages: SupportChatMessage[] = []
  try {
    const parsed = JSON.parse(row.messages_json)
    if (Array.isArray(parsed)) messages = parsed as SupportChatMessage[]
  } catch {
    messages = []
  }
  return {
    id: row.id,
    ticketCode: row.ticket_code,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    category: row.category,
    subject: row.subject,
    bookingReference: row.booking_reference || undefined,
    status: row.status,
    messages,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function formatWibNow(): string {
  const now = new Date()
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return `${wib.toISOString().slice(0, 10)} ${wib.toISOString().slice(11, 16)} WIB`
}

export async function listSupportThreads(): Promise<SupportThreadRecord[]> {
  try {
    const rows = await queryRows<DbSupportRow>(
      'SELECT * FROM support_threads ORDER BY updated_at DESC LIMIT 200'
    )
    if (rows.length > 0) {
      const dbList = rows.map(mapRow)
      // Keep runtime memory store synced
      const seen = new Set(dbList.map((t) => t.id))
      for (const local of supportThreadsStore) {
        if (!seen.has(local.id)) dbList.push(local)
      }
      return dbList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
  } catch {
    // Fallback to in-memory store
  }
  return [...supportThreadsStore].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function findSupportThreadById(id: string): Promise<SupportThreadRecord | null> {
  try {
    const rows = await queryRows<DbSupportRow>('SELECT * FROM support_threads WHERE id = ? LIMIT 1', [id])
    if (rows[0]) return mapRow(rows[0])
  } catch {
    // Fallback to memory
  }
  return supportThreadsStore.find((t) => t.id === id) ?? null
}

export async function createSupportThread(input: {
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  category: SupportCategory
  subject: string
  bookingReference?: string
  message: string
}): Promise<SupportThreadRecord> {
  const nowLabel = formatWibNow()
  const ts = Date.now()
  const id = `sup-${ts}`
  const ticketCode = `TKT-${new Date().toISOString().slice(2, 7).replace('-', '')}-${String(ts).slice(-4)}`
  const initialMsg: SupportChatMessage = {
    id: `smsg-${ts}`,
    senderRole: 'customer',
    senderName: input.customerName,
    message: input.message.trim(),
    createdAt: nowLabel
  }

  const record: SupportThreadRecord = {
    id,
    ticketCode,
    customerId: input.customerId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone || '-',
    category: input.category,
    subject: input.subject.trim(),
    bookingReference: input.bookingReference?.trim() || undefined,
    status: 'Menunggu Balasan',
    messages: [initialMsg],
    createdAt: nowLabel,
    updatedAt: nowLabel
  }

  supportThreadsStore.unshift(record)

  try {
    await executeSql(
      `INSERT INTO support_threads
        (id, ticket_code, customer_id, customer_name, customer_email, customer_phone,
         category, subject, booking_reference, status, messages_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.ticketCode,
        record.customerId,
        record.customerName,
        record.customerEmail,
        record.customerPhone,
        record.category,
        record.subject,
        record.bookingReference || null,
        record.status,
        JSON.stringify(record.messages),
        record.createdAt,
        record.updatedAt
      ]
    )
  } catch {
    // In-memory store already updated
  }

  return record
}

export async function appendSupportReply(params: {
  threadId: string
  senderRole: 'customer' | 'admin'
  senderName: string
  message: string
}): Promise<SupportThreadRecord | null> {
  const existing = await findSupportThreadById(params.threadId)
  if (!existing) return null

  const nowLabel = formatWibNow()
  const newMsg: SupportChatMessage = {
    id: `smsg-${Date.now()}`,
    senderRole: params.senderRole,
    senderName: params.senderName,
    message: params.message.trim(),
    createdAt: nowLabel
  }

  const nextStatus: SupportThreadStatus =
    params.senderRole === 'admin' ? 'Dibalas Admin' : 'Menunggu Balasan'

  const updated: SupportThreadRecord = {
    ...existing,
    status: nextStatus,
    messages: [...existing.messages, newMsg],
    updatedAt: nowLabel
  }

  const idx = supportThreadsStore.findIndex((t) => t.id === params.threadId)
  if (idx >= 0) supportThreadsStore[idx] = updated
  else supportThreadsStore.unshift(updated)

  try {
    await executeSql(
      `UPDATE support_threads SET status = ?, messages_json = ?, updated_at = ? WHERE id = ?`,
      [updated.status, JSON.stringify(updated.messages), updated.updatedAt, updated.id]
    )
  } catch {
    // In-memory store already updated
  }

  return updated
}

export async function updateSupportThreadStatus(
  threadId: string,
  status: SupportThreadStatus
): Promise<SupportThreadRecord | null> {
  const existing = await findSupportThreadById(threadId)
  if (!existing) return null

  const nowLabel = formatWibNow()
  const updated: SupportThreadRecord = {
    ...existing,
    status,
    updatedAt: nowLabel
  }

  const idx = supportThreadsStore.findIndex((t) => t.id === threadId)
  if (idx >= 0) supportThreadsStore[idx] = updated
  else supportThreadsStore.unshift(updated)

  try {
    await executeSql(
      `UPDATE support_threads SET status = ?, updated_at = ? WHERE id = ?`,
      [updated.status, updated.updatedAt, updated.id]
    )
  } catch {
    // In-memory store already updated
  }

  return updated
}
