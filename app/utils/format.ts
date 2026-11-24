import type { AdrenalineLevel, TripCategory } from '#shared/types/trip'

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDateID(isoDate: string): string {
  if (!isoDate) return '-'
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

export function getAdrenalineBadgeClass(level: AdrenalineLevel): string {
  switch (level) {
    case 'Pemula':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Menengah':
      return 'bg-amber-100 text-amber-900 border-amber-200'
    case 'Ekstrem':
      return 'bg-orange-100 text-orange-800 border-orange-300'
  }
}

export function getAdrenalineDotClass(level: AdrenalineLevel): string {
  switch (level) {
    case 'Pemula':
      return 'bg-emerald-600'
    case 'Menengah':
      return 'bg-amber-500'
    case 'Ekstrem':
      return 'bg-orange-600'
  }
}

export function getCategoryDescription(category: TripCategory): string {
  switch (category) {
    case 'Trekking':
      return 'Puncak gunung, sabana & jalur hutan tropis'
    case 'Canyoning':
      return 'Rappelling air terjun & susur ngarai sungai'
    case 'Diving':
      return 'Terumbu karang, drift dive & biota laut'
    case 'Caving':
      return 'Gua vertikal, karst purba & sungai bawah tanah'
  }
}
