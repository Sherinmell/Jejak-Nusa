export type FinanceEntryType = 'income_booking' | 'payout_guide' | 'refund_weather'
export type FinanceDirection = 'MASUK' | 'KELUAR'
export type FinanceSeverity = 'success' | 'warning' | 'danger' | 'normal'

export interface FinanceLedgerItem {
  id: string
  dateOnly: string
  timestamp: string
  sortTime: number
  type: FinanceEntryType
  typeLabel: string
  direction: FinanceDirection
  referenceCode: string
  title: string
  counterparty: string
  counterpartyInfo: string
  paymentMethod: string
  grossAmount: number
  settledAmount: number
  outstandingAmount: number
  platformCommission: number
  serviceFee: number
  insuranceFee: number
  carbonOffsetFee: number
  netCashImpact: number
  status: string
  severity: FinanceSeverity
  notes: string
  detailLink?: string
}

export interface DestinationFinanceRow {
  tripSlug: string
  tripTitle: string
  location: string
  bookingsCount: number
  participantsCount: number
  grossRevenue: number
  paidRevenue: number
  unpaidRevenue: number
  estimatedCommission: number
}

export interface AdminFinanceSummary {
  commissionPercent: number
  totalGmv: number
  totalBookingGross: number
  totalCashIn: number
  totalReceivable: number
  totalPlatformCommission: number
  totalServiceFee: number
  totalInsuranceFee: number
  totalCarbonOffsetFee: number
  totalPlatformNetRevenue: number
  totalPayoutReleased: number
  totalPayoutPending: number
  totalRefundApproved: number
  totalRefundPending: number
  totalCashOut: number
  netEscrowBalance: number
  paidTransactionsCount: number
  dpTransactionsCount: number
  unpaidTransactionsCount: number
  totalTransactionsCount: number
}

export interface AdminFinanceReportResponse {
  generatedAt: string
  summary: AdminFinanceSummary
  byDestination: DestinationFinanceRow[]
  ledger: FinanceLedgerItem[]
}
