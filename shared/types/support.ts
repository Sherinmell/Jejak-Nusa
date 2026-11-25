export type SupportCategory =
  | 'Pertanyaan Trip'
  | 'Pembayaran & Invoice'
  | 'Refund & Reschedule'
  | 'Sertifikat & Passport'
  | 'Kendala Akun'
  | 'Lainnya'

export type SupportThreadStatus = 'Menunggu Balasan' | 'Dibalas Admin' | 'Selesai'

export interface SupportChatMessage {
  id: string
  senderRole: 'customer' | 'admin'
  senderName: string
  message: string
  createdAt: string
}

export interface SupportThreadRecord {
  id: string
  ticketCode: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  category: SupportCategory
  subject: string
  bookingReference?: string
  status: SupportThreadStatus
  messages: SupportChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface SupportListResponse {
  threads: SupportThreadRecord[]
  counts: {
    total: number
    waiting: number
    replied: number
    resolved: number
  }
}
