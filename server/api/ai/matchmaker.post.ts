import { defineEventHandler, readBody } from 'h3'
import type { MatchmakerAnswers, MatchmakerRecommendation } from '#shared/types/ecosystem'
import type { Trip } from '#shared/types/trip'
import { TRIPS_DATA } from '../../utils/tripsData'
import { getAllTripsFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<{ recommendations: MatchmakerRecommendation[] }> => {
  const body = await readBody<Partial<MatchmakerAnswers>>(event)

  let sourceTrips: Trip[]
  try {
    sourceTrips = await getAllTripsFromDb()
  } catch {
    sourceTrips = TRIPS_DATA
  }

  const fitness = body?.fitness || 'moderate'
  const comfort = body?.comfort || 'all'
  const maxBudget = Number(body?.maxBudget) || 4000000
  const vibe = body?.vibe || 'adrenaline'
  const durationPref = body?.durationPref || 'short'

  const scored: MatchmakerRecommendation[] = sourceTrips.map((trip) => {
    let score = 58
    const reasons: string[] = []

    // Fitness match
    if (fitness === 'relaxed') {
      if (trip.adrenalineLevel === 'Pemula') {
        score += 18
        reasons.push('Ramah untuk tingkat kebugaran pemula / santai')
      } else if (trip.adrenalineLevel === 'Menengah') {
        score += 5
      } else {
        score -= 16
      }
    } else if (fitness === 'moderate') {
      if (trip.adrenalineLevel === 'Menengah') {
        score += 17
        reasons.push('Intensitas gerak pas untuk kebugaran aktif rutin')
      } else if (trip.adrenalineLevel === 'Pemula') {
        score += 10
      } else {
        score += 4
      }
    } else {
      if (trip.adrenalineLevel === 'Ekstrem') {
        score += 19
        reasons.push('Memberikan tantangan adrenalin tinggi sesuai stamina Anda')
      } else if (trip.adrenalineLevel === 'Menengah') {
        score += 12
        reasons.push('Medan variatif dengan unsur petualangan aktif')
      }
    }

    // Comfort / fear filter
    if (comfort === 'no-heights' && (trip.category === 'Canyoning' || trip.slug.includes('jomblang'))) {
      score -= 22
    } else if (comfort === 'no-deep-water' && trip.category === 'Diving') {
      score -= 24
    } else if (comfort === 'easy-land' && (trip.category === 'Diving' || trip.adrenalineLevel === 'Ekstrem')) {
      score -= 18
    } else {
      score += 8
      reasons.push('Sesuai batas kenyamanan ketinggian & medan air Anda')
    }

    // Budget fit
    if (trip.pricePerPerson <= maxBudget) {
      score += 12
      reasons.push('Masuk dalam kisaran anggaran yang Anda pilih')
    } else {
      score -= 12
    }

    // Vibe match
    if (vibe === 'adrenaline' && trip.category === 'Canyoning') {
      score += 14
      reasons.push('Kaya aksi rappelling & aliran sungai tropis')
    } else if (vibe === 'ocean' && trip.category === 'Diving') {
      score += 15
      reasons.push('Eksplorasi terumbu karang & biota laut ikonik')
    } else if (vibe === 'summit' && trip.category === 'Trekking') {
      score += 15
      reasons.push('Menawarkan panorama puncak gunung & sunrise terbaik')
    } else if (vibe === 'karst' && trip.category === 'Caving') {
      score += 15
      reasons.push('Pengalaman geologi gua karst purba yang unik')
    }

    // Duration preference
    const isShort = trip.duration.startsWith('1 Hari')
    if ((durationPref === 'short' && isShort) || (durationPref === 'multi-day' && !isShort)) {
      score += 6
      reasons.push(`Durasi ${trip.duration} sesuai preferensi waktu liburan Anda`)
    }

    const clamped = Math.max(62, Math.min(99, score))
    if (reasons.length === 0) {
      reasons.push(`Dipandu langsung oleh ${trip.guide.name} dengan rating ${trip.rating.toFixed(1)}`)
    }

    return {
      trip,
      matchScore: clamped,
      reasons: reasons.slice(0, 3)
    }
  })

  const recommendations = scored
    .sort((a, b) => b.matchScore - a.matchScore || b.trip.rating - a.trip.rating)
    .slice(0, 3)

  return { recommendations }
})
