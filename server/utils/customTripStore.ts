import type { CustomTripRequest } from '#shared/types/ecosystem'

export const customTripsStore: CustomTripRequest[] = [
  {
    id: 'ct-101',
    title: 'Private Canyoning & Eco-Lodge Grup Kantor (6 Orang)',
    destination: 'Bali Utara (Gitgit / Sambangan)',
    category: 'Canyoning',
    preferredDate: '2026-12-20',
    groupSize: 6,
    budgetPerPerson: 1200000,
    requesterName: 'Nadia Kusuma & Tim',
    notes: 'Cari rute seru ramah pemula + dokumentasi drone/GoPro dan makan siang khas Buleleng. Penjemputan dari Canggu.',
    status: 'Menerima Penawaran',
    createdAt: '2026-11-22',
    bids: [
      {
        id: 'bid-1',
        guideName: 'I Made Surya Pratama',
        guideAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&q=80',
        guideCertification: 'ICOpro Canyoning Lv. 2',
        guideRating: 4.95,
        pricePerPerson: 1120000,
        proposedHighlights: [
          'Private track 5 air terjun ramah pemula (2 pemandu + 1 fotografer)',
          'Termasuk shuttle HiAce PP dari Canggu & makan siang prasmanan',
          'Bonus 1 video Reels edit cepat H+1'
        ],
        note: 'Halo Nadia! Untuk 6 orang kita bisa berangkat pukul 06.30 dari Canggu agar ngarai masih sepi dan eksklusif.',
        status: 'Menunggu Pilihan'
      },
      {
        id: 'bid-2',
        guideName: 'Ketut Dharma Putra',
        guideAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=80',
        guideCertification: 'FAJI & BASARNAS Rescue',
        guideRating: 4.88,
        pricePerPerson: 1050000,
        proposedHighlights: [
          'Kombinasi trekking sawah Sambangan + 4 air terjun canyoning',
          'Full set wetsuit & sepatu water grip baru',
          'Snack kopi luwak desa & kelapa muda'
        ],
        note: 'Harga spesial grup 6 orang sudah all-in tiket konservasi desa adat.',
        status: 'Menunggu Pilihan'
      }
    ]
  },
  {
    id: 'ct-102',
    title: 'Private Trekking Sunrise Prau & Sikunir (8 Orang)',
    destination: 'Dieng, Wonosobo, Jawa Tengah',
    category: 'Trekking',
    preferredDate: '2026-12-26',
    groupSize: 8,
    budgetPerPerson: 520000,
    requesterName: 'Grup Alumni ITB',
    notes: 'Butuh tenda sudah berdiri di puncak, porter logistik penuh, dan menu makan malam hangat khas Dieng.',
    status: 'Menerima Penawaran',
    createdAt: '2026-11-21',
    bids: [
      {
        id: 'bid-3',
        guideName: 'Ratna Dewi Anggraini',
        guideAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=180&q=80',
        guideCertification: 'APGI Mountain Guide',
        guideRating: 4.94,
        pricePerPerson: 485000,
        proposedHighlights: [
          '4 tenda double-layer + 2 porter tim + 2 pemandu APGI',
          'Menu hangat soto hangat, pisang goreng, kopi & cokelat bebas isi ulang',
          'Termasuk Simaksi resmi & homestay transit mandi hangat'
        ],
        note: 'Siap mendampingi rombongan 8 orang dengan pacing santai dan dokumentasi sunrise.',
        status: 'Menunggu Pilihan'
      }
    ]
  }
]
