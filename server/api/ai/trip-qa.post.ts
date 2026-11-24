import { createError, defineEventHandler, readBody } from 'h3'
import type { TripQaResponse } from '#shared/types/ecosystem'
import type { Trip } from '#shared/types/trip'
import { TRIPS_DATA } from '../../utils/tripsData'
import { getTripBySlugFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<TripQaResponse> => {
  const body = await readBody<{ slug?: string; question?: string }>(event)
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : ''
  const question = typeof body?.question === 'string' ? body.question.trim() : ''

  let trip: Trip | null = null
  try {
    trip = await getTripBySlugFromDb(slug)
  } catch {
    trip = TRIPS_DATA.find((t) => t.slug === slug) ?? null
  }
  if (!trip) {
    throw createError({ statusCode: 404, statusMessage: 'Trip tidak ditemukan untuk analisis Q&A.' })
  }

  if (!question) {
    throw createError({ statusCode: 400, statusMessage: 'Silakan tulis pertanyaan Anda terlebih dahulu.' })
  }

  const q = question.toLowerCase()
  const highlights: string[] = []
  let answer = ''

  if (q.includes('pemula') || q.includes('pertama') || q.includes('susah') || q.includes('fisik') || q.includes('berat')) {
    if (trip.adrenalineLevel === 'Pemula') {
      answer = `Ya! "${trip.title}" berlevel Pemula dan sangat ramah untuk peserta yang baru pertama kali mencoba ${trip.category}. Pemandu lokal ${trip.guide.name} akan memberikan safety briefing menyeluruh sebelum mulai dan menjaga ritme kelompok tetap nyaman.`
    } else if (trip.adrenalineLevel === 'Menengah') {
      answer = `Trip ini berada di level Menengah. Peserta pemula tetap bisa ikut asalkan dalam kondisi bugar dan nyaman dengan aktivitas luar ruang (${trip.category}). Sebelum berangkat, ${trip.guide.name} melakukan latihan teknik dasar di basecamp agar semua peserta percaya diri.`
    } else {
      answer = `Perlu persiapan fisik ekstra karena "${trip.title}" berlevel Ekstrem (${trip.duration}). Kami menyarankan latihan kardio/jalan kaki minimal 2–3 minggu sebelum keberangkatan. Pemandu ${trip.guide.name} (${trip.guide.certifications[0]}) mendampingi ketat dengan rasio aman.`
    }
    highlights.push(`Level Adrenalin: ${trip.adrenalineLevel}`, `Durasi: ${trip.duration}`, `Pemandu: ${trip.guide.name}`)
  } else if (q.includes('sinyal') || q.includes('internet') || q.includes('wifi') || q.includes('hp') || q.includes('listrik')) {
    const isRemote = trip.category === 'Trekking' || trip.category === 'Diving'
    answer = isRemote
      ? `Di area meeting point (${trip.meetingPoint}), sinyal seluler (terutama Telkomsel/XL) masih tersedia baik untuk komunikasi & kirim kabar ke keluarga. Namun saat memasuki jalur inti ${trip.category}, sinyal terbatas/hilang. Tim pemandu membawa radio komunikasi HT dan protokol check-in posko.`
      : `Di sekitar basecamp ${trip.meetingPoint}, sinyal 4G cukup stabil. Saat berada di dalam area inti ${trip.category} (${trip.location}), sinyal bisa melemah sementara — kami sarankan membawa powerbank dan mengaktifkan fitur "Info Safety untuk Keluarga" sebelum mulai.`
    highlights.push(`Meeting Point: ${trip.meetingPoint}`, 'Tim pemandu membawa HT & kontak posko lokal')
  } else if (q.includes('alat') || q.includes('bawa') || q.includes('termasuk') || q.includes('sewa') || q.includes('gear')) {
    answer = `Paket ini sudah termasuk: ${trip.included.slice(0, 3).join('; ')}. Yang belum termasuk antara lain: ${trip.excluded.slice(0, 2).join('; ')}. Jika belum punya perlengkapan pribadi, Anda bisa langsung menyewanya lewat bagian "Checklist Bawaan & Sewa Gear Add-On" di halaman ini.`
    highlights.push(...trip.included.slice(0, 2))
  } else if (q.includes('hujan') || q.includes('cuaca') || q.includes('refund') || q.includes('batal')) {
    answer = `Keselamatan adalah prioritas utama. Jika BMKG atau pengelola kawasan ${trip.location} menyatakan cuaca ekstrem / jalur ditutup, peserta mendapatkan Garansi Refund 100% atau Reschedule gratis ke jadwal berikutnya. Anda juga bisa menambah Asuransi Petualangan Instan (+Rp50.000/org).`
    highlights.push('Garansi Refund / Reschedule 100% untuk cuaca ekstrem', 'Dana dilindungi Escrow JejakNusa')
  } else if (q.includes('solo') || q.includes('sendiri') || q.includes('teman')) {
    answer = `Sangat cocok untuk Solo Traveler! Lebih dari 60% peserta di open trip ini mendaftar sendiri. Anda bisa melihat siapa saja yang sudah ikut dan mulai berkenalan lewat kotak "Komunitas & Teman Seperjalanan" di bawah atau di halaman Buddy Finder.`
    highlights.push(`Sisa kuota saat ini: ${trip.remainingQuota} dari ${trip.totalQuota} slot`, 'Grup pra-trip ramah solo traveler')
  } else if (q.includes('meeting') || q.includes('kumpul') || q.includes('jadwal') || q.includes('jam') || q.includes('hotel')) {
    answer = `Titik kumpul berada di ${trip.meetingPoint}. Keberangkatan terdekat dijadwalkan pada ${trip.nextDepartureDate} dengan durasi ${trip.duration}. Sesi pertama dimulai dari "${trip.itinerary[0]?.title || 'Safety Briefing'}". Anda juga dapat memesan penginapan partner di ${trip.province} dengan shuttle langsung ke meeting point.`
    highlights.push(`Meeting Point: ${trip.meetingPoint}`, `Sesi 1: ${trip.itinerary[0]?.day || 'Hari 1'}`)
  } else {
    answer = `Berdasarkan itinerary "${trip.title}" di ${trip.location}, paket berdurasi ${trip.duration} (level ${trip.adrenalineLevel}) ini dipandu oleh ${trip.guide.name} (${trip.guide.certifications.join(', ')}). Biaya Rp${trip.pricePerPerson.toLocaleString('id-ID')}/orang sudah mencakup ${trip.included[0]} dan ${trip.included[1] || 'fasilitas utama lapangan'}.`
    highlights.push(`Lokasi: ${trip.location}`, `Kuota tersisa: ${trip.remainingQuota} slot`, `Respon pemandu: ${trip.guide.responseTime}`)
  }

  return {
    answer,
    highlights,
    confidenceNote: `Dijawab berbasis data itinerary resmi & catatan pemandu ${trip.guide.name}`,
    suggestedFollowUps: [
      'Apakah jalur ini ramah untuk pemula?',
      'Apakah ada sinyal seluler di basecamp?',
      'Perlengkapan apa yang sudah termasuk?',
      'Bagaimana kebijakan refund jika cuaca hujan?'
    ]
  }
})
