import type { CommunityBuddyPost, TripParticipantPreview } from '#shared/types/adventure'

export const communityPostsStore: CommunityBuddyPost[] = [
  {
    id: 'post-1',
    tripSlug: 'canyoning-air-terjun-gitgit-bali',
    tripTitle: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
    location: 'Buleleng, Bali Utara',
    authorName: 'Nadia Kusuma',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    authorOrigin: 'Jakarta',
    travelStyle: 'Solo Traveler',
    departureDate: '2026-12-06',
    slotsLookingFor: 2,
    note: 'Hai! Aku berangkat solo dari Canggu pagi-pagi. Ada yang mau patungan shuttle ke Basecamp Sambangan + sharing eco-lodge semalam sebelumnya?',
    likes: 14,
    createdAt: '2026-11-21'
  },
  {
    id: 'post-2',
    tripSlug: 'trekking-gunung-rinjani-sembalun-3h2m',
    tripTitle: 'Trekking Puncak Gunung Rinjani 3.726 MDPL via Sembalun',
    location: 'Lombok Timur, NTB',
    authorName: 'Raka Mahendra',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    authorOrigin: 'Bandung',
    travelStyle: 'Fotografi Alam',
    departureDate: '2026-12-12',
    slotsLookingFor: 3,
    note: 'Cari barengan pacing santai yang suka motret Milky Way di Plawangan Sembalun. Rencana sewa 1 porter bersama biar carrier lebih ringan!',
    likes: 21,
    createdAt: '2026-11-20'
  },
  {
    id: 'post-3',
    tripSlug: 'caving-gua-jomblang-cahaya-surga-gunungkidul',
    tripTitle: 'Eksplorasi Gua Vertikal Jomblang & Hutan Purba Gunungkidul',
    location: 'Gunungkidul, DI Yogyakarta',
    authorName: 'Ayu Pratiwi',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    authorOrigin: 'Semarang',
    travelStyle: 'Pemula Santai',
    departureDate: '2026-12-05',
    slotsLookingFor: 2,
    note: 'Pertama kali mau coba caving vertikal nih! Ada solo traveler cewek lain yang ikut jadwal 5 Des? Yuk kenalan dulu sebelum ketemu di Stasiun Tugu.',
    likes: 18,
    createdAt: '2026-11-22'
  },
  {
    id: 'post-4',
    tripSlug: 'diving-taman-nasional-komodo-manta-point-3h2m',
    tripTitle: 'Fun Diving & Liveaboard Taman Nasional Komodo — Manta Point',
    location: 'Labuan Bajo, NTT',
    authorName: 'Kevin Santoso',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    authorOrigin: 'Surabaya',
    travelStyle: 'Cari Teman Sharing',
    departureDate: '2026-12-18',
    slotsLookingFor: 1,
    note: 'Cari dive buddy untuk sharing kabin kapal phinisi dan patungan sewa vila 1 malam di Labuan Bajo sebelum boarding. Open Water / Advanced welcome!',
    likes: 11,
    createdAt: '2026-11-19'
  }
]

export const tripParticipantsMap: Record<string, TripParticipantPreview[]> = {
  'canyoning-air-terjun-gitgit-bali': [
    {
      id: 'p1',
      name: 'Nadia K.',
      origin: 'Jakarta',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      isSoloTraveler: true,
      badge: 'Solo Traveler'
    },
    {
      id: 'p2',
      name: 'Dimas P.',
      origin: 'Surabaya',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      isSoloTraveler: true,
      badge: 'First Timer'
    },
    {
      id: 'p3',
      name: 'Clara & Budi',
      origin: 'Bandung',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
      isSoloTraveler: false,
      badge: 'Grup 2 Org'
    }
  ],
  'trekking-gunung-rinjani-sembalun-3h2m': [
    {
      id: 'p4',
      name: 'Raka M.',
      origin: 'Bandung',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      isSoloTraveler: true,
      badge: 'Fotografi Alam'
    },
    {
      id: 'p5',
      name: 'Sinta L.',
      origin: 'Yogyakarta',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isSoloTraveler: true,
      badge: 'Solo Traveler'
    }
  ]
}
