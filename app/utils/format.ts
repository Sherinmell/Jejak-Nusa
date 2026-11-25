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

/**
 * Rewrite Unsplash image URLs to lighter WebP dimensions for mobile speed.
 * Non-Unsplash / local / data URLs are returned unchanged.
 */
export function optimizeImageUrl(url: string | undefined | null, width = 640, quality = 72): string {
  if (!url) return ''
  if (!url.includes('images.unsplash.com')) return url
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('auto', 'format')
    parsed.searchParams.set('fit', 'crop')
    parsed.searchParams.set('fm', 'webp')
    parsed.searchParams.set('w', String(width))
    parsed.searchParams.set('q', String(quality))
    return parsed.toString()
  } catch {
    return url
  }
}

export function buildImageSrcSet(
  url: string | undefined | null,
  widths: number[] = [400, 640, 960],
  quality = 72
): string | undefined {
  if (!url || !url.includes('images.unsplash.com')) return undefined
  return widths.map((w) => `${optimizeImageUrl(url, w, quality)} ${w}w`).join(', ')
}
