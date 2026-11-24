import type {
  AdventureBadge,
  LoyaltyReward,
  MemberTier,
  PassportProfileResponse,
  PassportStamp
} from '#shared/types/ecosystem'

export const passportStateStore = {
  points: 1850,
  totalKmExplored: 148,
  visitedProvinces: ['Bali', 'Nusa Tenggara Barat', 'DI Yogyakarta', 'Jawa Timur'],
  stamps: [
    {
      id: 'st-1',
      province: 'Bali',
      destination: 'Buleleng, Bali Utara',
      tripTitle: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
      date: '2026-09-14',
      guideName: 'I Made Surya Pratama',
      category: 'Canyoning'
    },
    {
      id: 'st-2',
      province: 'Nusa Tenggara Barat',
      destination: 'Sembalun, Lombok Timur',
      tripTitle: 'Trekking Puncak Gunung Rinjani 3.726 MDPL',
      date: '2026-07-22',
      guideName: 'Zainal Abidin (Bang Zain)',
      category: 'Trekking'
    },
    {
      id: 'st-3',
      province: 'DI Yogyakarta',
      destination: 'Gunungkidul',
      tripTitle: 'Eksplorasi Gua Vertikal Jomblang & Hutan Purba',
      date: '2026-05-10',
      guideName: 'Bagas Wicaksono',
      category: 'Caving'
    },
    {
      id: 'st-4',
      province: 'Jawa Timur',
      destination: 'Banyuwangi',
      tripTitle: 'Midnight Trekking Blue Fire Kawah Ijen',
      date: '2026-03-04',
      guideName: 'Arif Rahman Hakim',
      category: 'Trekking'
    }
  ] as PassportStamp[],
  badges: [
    {
      id: 'bdg-3000',
      title: 'Penakluk 3.000 MDPL',
      subtitle: 'Berhasil menyelesaikan puncak gunung di atas 3.000 meter',
      category: 'Trekking',
      unlocked: true,
      unlockedDate: '2026-07-22',
      progressText: 'Selesai di Gunung Rinjani (3.726 MDPL)'
    },
    {
      id: 'bdg-cave',
      title: 'Cave Explorer',
      subtitle: 'Menjelajahi gua vertikal & sistem karst Nusantara',
      category: 'Caving',
      unlocked: true,
      unlockedDate: '2026-05-10',
      progressText: 'Gua Jomblang 60m SRT'
    },
    {
      id: 'bdg-eco',
      title: 'Eco-Warrior',
      subtitle: 'Berpartisipasi pada Carbon Offset & Leave No Trace 3+ trip',
      category: 'Eco-Tourism',
      unlocked: true,
      unlockedDate: '2026-09-14',
      progressText: '4/3 trip Zero Waste & Offset'
    },
    {
      id: 'bdg-canyon',
      title: 'Waterfall Rappeller',
      subtitle: 'Menuntaskan pengarungan minimal 5 tebing air terjun',
      category: 'Canyoning',
      unlocked: true,
      unlockedDate: '2026-09-14',
      progressText: '6 air terjun Gitgit Bali'
    },
    {
      id: 'bdg-coral',
      title: 'Coral Guardian',
      subtitle: 'Menyelesaikan 1 paket Diving ramah terumbu karang',
      category: 'Diving',
      unlocked: false,
      progressText: '0/1 trip Diving (Coba Komodo atau Derawan!)'
    },
    {
      id: 'bdg-archipelago',
      title: 'Penjelajah 6 Provinsi',
      subtitle: 'Kumpulkan stempel dari 6 provinsi berbeda di Indonesia',
      category: 'Eksplorasi',
      unlocked: false,
      progressText: '4/6 provinsi tercapai'
    }
  ] as AdventureBadge[],
  rewards: [
    {
      id: 'rew-disc-100',
      title: 'Voucher Diskon Trip Rp100.000',
      pointsCost: 800,
      badgeText: 'Paling Populer',
      description: 'Berlaku untuk seluruh open trip trekking, canyoning, diving, dan caving.'
    },
    {
      id: 'rew-early-access',
      title: 'Early Access Pass — Kuota Terbatas',
      pointsCost: 600,
      badgeText: 'Prioritas 48 Jam',
      description: 'Akses pemesanan 48 jam lebih awal untuk trip langka seperti Liveaboard Komodo & Rinjani.'
    },
    {
      id: 'rew-free-gear',
      title: 'Gratis Sewa Add-On Gear (Maks. Rp150.000)',
      pointsCost: 1100,
      badgeText: 'Hemat Gear',
      description: 'Tukar poin untuk gratis sewa sepatu grip, dry bag, atau paket Action Cam.'
    }
  ] as LoyaltyReward[]
}

export interface PerUserPassportState {
  points: number
  totalKmExplored: number
  visitedProvinces: string[]
  stamps: PassportStamp[]
  badges: AdventureBadge[]
  rewards: LoyaltyReward[]
}

const perUserPassports = new Map<string, PerUserPassportState>()

function createZeroStatePassport(): PerUserPassportState {
  return {
    points: 0,
    totalKmExplored: 0,
    visitedProvinces: [],
    stamps: [],
    badges: [
      {
        id: 'bdg-3000',
        title: 'Penakluk 3.000 MDPL',
        subtitle: 'Berhasil menyelesaikan puncak gunung di atas 3.000 meter',
        category: 'Trekking',
        unlocked: false,
        progressText: '0/1 puncak gunung selesai'
      },
      {
        id: 'bdg-cave',
        title: 'Cave Explorer',
        subtitle: 'Menjelajahi gua vertikal & sistem karst Nusantara',
        category: 'Caving',
        unlocked: false,
        progressText: '0/1 trip caving selesai'
      },
      {
        id: 'bdg-eco',
        title: 'Eco-Warrior',
        subtitle: 'Berpartisipasi pada Carbon Offset & Leave No Trace 3+ trip',
        category: 'Eco-Tourism',
        unlocked: false,
        progressText: '0/3 trip Carbon Offset'
      },
      {
        id: 'bdg-canyon',
        title: 'Waterfall Rappeller',
        subtitle: 'Menuntaskan pengarungan minimal 5 tebing air terjun',
        category: 'Canyoning',
        unlocked: false,
        progressText: '0/1 trip canyoning selesai'
      },
      {
        id: 'bdg-coral',
        title: 'Coral Guardian',
        subtitle: 'Menyelesaikan 1 paket Diving ramah terumbu karang',
        category: 'Diving',
        unlocked: false,
        progressText: '0/1 trip diving selesai'
      },
      {
        id: 'bdg-archipelago',
        title: 'Penjelajah 6 Provinsi',
        subtitle: 'Kumpulkan stempel dari 6 provinsi berbeda di Indonesia',
        category: 'Eksplorasi',
        unlocked: false,
        progressText: '0/6 provinsi tercapai'
      }
    ],
    rewards: passportStateStore.rewards.map((r) => ({ ...r, redeemedCode: undefined }))
  }
}

export function isDemoExperiencedUser(userId?: string, email?: string): boolean {
  return userId === 'usr-customer-demo' || email?.toLowerCase() === 'customer@jejaknusa.id'
}

export function getPassportStateForUser(userId?: string, email?: string): PerUserPassportState {
  if (isDemoExperiencedUser(userId, email)) {
    return passportStateStore
  }
  const key = userId || email || 'new-customer'
  let state = perUserPassports.get(key)
  if (!state) {
    state = createZeroStatePassport()
    perUserPassports.set(key, state)
  }
  return state
}

export function buildPassportResponse(
  state: PerUserPassportState,
  explorerName: string
): PassportProfileResponse {
  const points = state.points
  let tier: MemberTier = 'Trailblazer'
  let nextTierName: MemberTier = 'Summit Seeker'
  let nextTierPoints = 1000

  if (points >= 2500) {
    tier = 'Nusantara Legend'
    nextTierName = 'Nusantara Legend'
    nextTierPoints = 2500
  } else if (points >= 1000) {
    tier = 'Summit Seeker'
    nextTierName = 'Nusantara Legend'
    nextTierPoints = 2500
  }

  return {
    explorerName,
    tier,
    points,
    nextTierName,
    nextTierPoints,
    completedTripsCount: state.stamps.length,
    totalKmExplored: state.totalKmExplored,
    visitedProvinces: state.visitedProvinces,
    stamps: state.stamps,
    badges: state.badges,
    rewards: state.rewards
  }
}

export function awardTripCompletionToPassport(input: {
  userId?: string
  email?: string
  tripTitle: string
  location: string
  province: string
  guideName: string
  category: 'Trekking' | 'Canyoning' | 'Diving' | 'Caving'
  hasCarbonOffset?: boolean
  completedDate: string
}) {
  const state = getPassportStateForUser(input.userId, input.email)
  const alreadyStamped = state.stamps.some(
    (s) => s.tripTitle.toLowerCase() === input.tripTitle.toLowerCase() && s.date === input.completedDate
  )
  if (alreadyStamped) {
    return { pointsAwarded: 0, unlockedBadges: [] as string[] }
  }

  const pointsAwarded = 500
  state.points += pointsAwarded
  state.totalKmExplored += 28

  if (input.province && !state.visitedProvinces.includes(input.province)) {
    state.visitedProvinces.push(input.province)
  }

  state.stamps.unshift({
    id: `st-${Date.now()}`,
    province: input.province || 'Indonesia',
    destination: input.location,
    tripTitle: input.tripTitle,
    date: input.completedDate,
    guideName: input.guideName,
    category: input.category
  })

  const unlockedBadges: string[] = []
  const unlockBadge = (id: string, progressText: string) => {
    const b = state.badges.find((item) => item.id === id)
    if (b && !b.unlocked) {
      b.unlocked = true
      b.unlockedDate = input.completedDate
      b.progressText = progressText
      unlockedBadges.push(b.title)
    }
  }

  if (input.category === 'Trekking') unlockBadge('bdg-3000', `Selesai di ${input.location}`)
  if (input.category === 'Caving') unlockBadge('bdg-cave', `Eksplorasi di ${input.location}`)
  if (input.category === 'Canyoning') unlockBadge('bdg-canyon', `Selesai di ${input.location}`)
  if (input.category === 'Diving') unlockBadge('bdg-coral', `Diving di ${input.location}`)
  if (input.hasCarbonOffset) unlockBadge('bdg-eco', `Carbon Offset aktif di ${input.location}`)

  const archBadge = state.badges.find((item) => item.id === 'bdg-archipelago')
  if (archBadge && !archBadge.unlocked) {
    archBadge.progressText = `${state.visitedProvinces.length}/6 provinsi tercapai`
    if (state.visitedProvinces.length >= 6) {
      archBadge.unlocked = true
      archBadge.unlockedDate = input.completedDate
      unlockedBadges.push(archBadge.title)
    }
  }

  return { pointsAwarded, unlockedBadges }
}
