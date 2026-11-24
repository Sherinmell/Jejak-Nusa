import type { Trip } from '#shared/types/trip'

export const TRIPS_DATA: Trip[] = [
  {
    id: 'trip-canyoning-gitgit-bali',
    slug: 'canyoning-air-terjun-gitgit-bali',
    title: 'Canyoning Air Terjun Gitgit & Ngarai Aling-Aling',
    location: 'Buleleng, Bali Utara',
    province: 'Bali',
    category: 'Canyoning',
    adrenalineLevel: 'Menengah',
    pricePerPerson: 1150000,
    duration: '1 Hari (Full Day)',
    nextDepartureDate: '2026-12-06',
    totalQuota: 10,
    remainingQuota: 3,
    meetingPoint: 'Basecamp Sambangan, Buleleng (atau penjemputan Ubud/Canggu)',
    featured: true,
    rating: 4.9,
    reviewCount: 64,
    coverImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Menuruni 6 tebing air terjun tropis dengan teknik rappelling, natural slide, dan cliff jumping di ngarai tersembunyi Bali Utara.',
    description:
      'Rasakan sensasi menyusuri ngarai vulkanik hijau di kawasan Gitgit dan Sambangan, Bali Utara. Paket open trip canyoning ini dipandu langsung oleh instruktur lokal bersertifikat internasional ICOpro dengan standar keamanan tinggi. Cocok bagi penjelajah yang sudah terbiasa berenang dan ingin mencoba rappelling hingga ketinggian 28 meter di bawah guyuran air terjun alami.',
    highlights: [
      '6 jalur rappelling air terjun vulkanik setinggi 8–28 meter',
      'Natural water slide batu alam & lompat tebing opsional (5m & 10m)',
      'Peralatan canyoning standar CE (wetsuit 5mm, harness, helm, sepatu grip)',
      'Dokumentasi foto & video GoPro Hero 12 selama pengarungan'
    ],
    itinerary: [
      {
        day: 'Sesi 1 — Pagi (07.30 - 09.30 WITA)',
        title: 'Registrasi, Sarapan Ringan & Safety Briefing',
        activities: [
          'Kumpul di Basecamp Sambangan, menikmati kopi Bali & jajanan pasar',
          'Fitting wetsuit, harness, helm, serta sepatu khusus canyoning',
          'Simulasi teknik rappelling dan posisi tubuh di tebing latihan kering'
        ]
      },
      {
        day: 'Sesi 2 — Inti (09.30 - 13.30 WITA)',
        title: 'Pengarungan Ngarai & 6 Air Terjun',
        activities: [
          'Trekking 15 menit melewati kebun cengkeh menuju titik masuk hulu ngarai',
          'Rappelling air terjun bertingkat, seluncuran batu alami, dan cliff jump opsional',
          'Rehat di kolam zamrud dengan camilan energi & air hangat'
        ]
      },
      {
        day: 'Sesi 3 — Sore (13.30 - 16.00 WITA)',
        title: 'Makan Siang Khas Buleleng & Transfer Dokumentasi',
        activities: [
          'Bilas air hangat di basecamp & santap siang prasmanan khas Bali Utara',
          'Transfer file foto/video dokumentasi ke seluruh peserta & penutupan trip'
        ]
      }
    ],
    included: [
      'Pemandu Canyoning Lokal Terverifikasi (rasio 1 pemandu : 4 peserta)',
      'Full set peralatan canyoning standar internasional (wetsuit, harness, helm, sepatu)',
      'Tiket masuk kawasan air terjun & donasi konservasi desa adat',
      'Sarapan ringan, snack ngarai, dan makan siang prasmanan',
      'Dokumentasi foto & video action cam + handuk & ruang bilas hangat'
    ],
    excluded: [
      'Transportasi menuju Basecamp Sambangan (tersedia add-on shuttle dari Ubud/Canggu)',
      'Pengeluaran pribadi & tips pemandu (opsional)',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-made-surya',
      name: 'I Made Surya Pratama',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      origin: 'Singaraja, Bali',
      verified: true,
      certifications: ['ICOpro Canyoning Guide Lv. 2', 'BASARNAS Water Rescue', 'First Aid Wilderness'],
      experienceYears: 8,
      completedTrips: 312,
      rating: 4.95,
      reviewCount: 148,
      languages: ['Bahasa Indonesia', 'English', 'Bahasa Bali'],
      responseTime: '± 15 menit',
      bio: 'Putra daerah Buleleng yang telah memetakan lebih dari 14 jalur ngarai di Bali Utara. Mengutamakan keselamatan, edukasi lingkungan sungai, dan suasana trip yang suportif untuk peserta baru.'
    },
    reviews: [
      {
        id: 'rev-1',
        author: 'Nadia Kusuma',
        authorOrigin: 'Jakarta',
        rating: 5,
        date: '2026-11-08',
        comment:
          'Awalnya deg-degan banget pas lihat air terjun 25 meter, tapi Bli Made sabar banget ngasih arahan. Alat-alatnya terawat dan makan siangnya enak pol!'
      },
      {
        id: 'rev-2',
        author: 'Raka Mahendra',
        authorOrigin: 'Bandung',
        rating: 5,
        date: '2026-10-25',
        comment:
          'Ikut sendirian lewat open trip langsung dapat teman baru se-grup. Dokumentasi GoPro-nya mantap, airnya super jernih.'
      }
    ]
  },
  {
    id: 'trip-trekking-rinjani-sembalun',
    slug: 'trekking-gunung-rinjani-sembalun-3h2m',
    title: 'Trekking Puncak Gunung Rinjani 3.726 MDPL via Sembalun',
    location: 'Lombok Timur, NTB',
    province: 'Nusa Tenggara Barat',
    category: 'Trekking',
    adrenalineLevel: 'Ekstrem',
    pricePerPerson: 2450000,
    duration: '3 Hari 2 Malam',
    nextDepartureDate: '2026-12-12',
    totalQuota: 12,
    remainingQuota: 4,
    meetingPoint: 'Basecamp Sembalun Lawang, Lombok Timur',
    featured: true,
    rating: 4.9,
    reviewCount: 92,
    coverImage: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Ekspedisi sabana luas Sembalun, bermalam di Plawangan menghadap Danau Segara Anak, dan summit attack menuju puncak tertinggi kedua di Indonesia.',
    description:
      'Taklukkan megahnya Gunung Rinjani bersama tim pemandu lokal Sasak dan porter berpengalaman dari Sembalun. Jalur Sembalun–Torean/Senaru menghadirkan perpaduan padang sabana keemasan, kawah vulkanik dramatis, pemandian air panas alami, dan pemandangan matahari terbit di atas gugusan Pulau Lombok dan Sumbawa.',
    highlights: [
      'Menyusuri sabana Sembalun & tanjakan legendaris Bukit Penyesalan',
      'Camping nyaman di Plawangan Sembalun dengan tenda double-layer & matras tebal',
      'Summit attack menuju Puncak 3.726 MDPL didampingi guide bersertifikat APGI',
      'Menu makanan gunung segar dimasak hangat oleh tim porter lokal'
    ],
    itinerary: [
      {
        day: 'Hari 1 — Sembalun ke Plawangan Sembalun (2.639 MDPL)',
        title: 'Pendakian Sabana & Sunset Kaldera',
        activities: [
          '07.00 WITA: Registrasi e-Rinjani, pemeriksaan kesehatan, dan briefing rute',
          '08.30 WITA: Mulai trekking dari Gerbang Sembalun menuju Pos 1, Pos 2 (makan siang), dan Pos 3',
          '16.30 WITA: Tiba di Camp Plawangan Sembalun, menikmati teh hangat, sunset Danau Segara Anak, dan makan malam'
        ]
      },
      {
        day: 'Hari 2 — Summit Attack & Danau Segara Anak',
        title: 'Puncak 3.726 MDPL & Berendam Air Panas Alami',
        activities: [
          '02.00 WITA: Light breakfast & start summit attack menuju Puncak Rinjani',
          '06.00 WITA: Tiba di Puncak, sesi foto sunrise, lalu turun kembali ke Plawangan untuk sarapan lengkap',
          '12.00 WITA: Turun menuju Danau Segara Anak, berendam di pemandian air panas alami, dan bermalam di tepi danau'
        ]
      },
      {
        day: 'Hari 3 — Jalur Torean / Senaru menuju Desa',
        title: 'Lembah Air Terjun & Penutupan Ekspedisi',
        activities: [
          '07.00 WITA: Sarapan pagi & packing bersih (prinsip zero-waste)',
          '08.30 WITA: Trekking turun menikmati lembah hijau dan air terjun Penimbungan',
          '15.30 WITA: Tiba di gerbang desa, sertifikat pendakian, dan transfer kembali ke titik penjemputan'
        ]
      }
    ],
    included: [
      'Tiket masuk resmi TNGR (e-Rinjani) & registrasi pendakian',
      'Pemandu Gunung Lokal bersertifikat APGI & porter tim untuk logistik/tenda',
      'Tenda kapasitas 2 orang, sleeping bag thermal, matras spons, dan tenda toilet',
      'Makan 3x sehari selama pendakian + buah segar, kopi/teh, dan air mineral',
      'P3K standar pendakian gunung, oksigen portabel, dan radio komunikasi HT'
    ],
    excluded: [
      'Tiket pesawat ke/dari Bandara Internasional Lombok (LOP)',
      'Perlengkapan pribadi (sepatu gunung, jaket down, headlamp, trekking pole)',
      'Porter pribadi untuk barang bawaan personal',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-bang-zainal',
      name: 'Zainal Abidin (Bang Zain)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      origin: 'Sembalun, Lombok Timur',
      verified: true,
      certifications: ['APGI Mountain Guide', 'TNGR Licensed Guide', 'Wilderness First Responder'],
      experienceYears: 11,
      completedTrips: 215,
      rating: 4.96,
      reviewCount: 173,
      languages: ['Bahasa Indonesia', 'English', 'Bahasa Sasak'],
      responseTime: '± 20 menit',
      bio: 'Pemandu senior asal Desa Sembalun yang sudah lebih dari 200 kali memandu pendaki ke puncak Rinjani. Aktif dalam gerakan bersih gunung Rinjani Zero Waste.'
    },
    reviews: [
      {
        id: 'rev-3',
        author: 'Dimas Prakoso',
        authorOrigin: 'Surabaya',
        rating: 5,
        date: '2026-11-02',
        comment:
          'Manajemen pacing dari Bang Zain luar biasa. Semua 10 peserta di rombongan kami berhasil sampai puncak dengan aman. Masakan porternya seperti restoran di atas awan!'
      },
      {
        id: 'rev-4',
        author: 'Sinta Larasati',
        authorOrigin: 'Yogyakarta',
        rating: 5,
        date: '2026-10-14',
        comment:
          'Rinjani memang berat, tapi tenda hangat, logistik rapi, dan guide yang selalu cek kondisi saturasi bikin tenang sepanjang jalur.'
      }
    ]
  },
  {
    id: 'trip-caving-jomblang-jogja',
    slug: 'caving-gua-jomblang-cahaya-surga-gunungkidul',
    title: 'Eksplorasi Gua Vertikal Jomblang & Hutan Purba Gunungkidul',
    location: 'Gunungkidul, DI Yogyakarta',
    province: 'DI Yogyakarta',
    category: 'Caving',
    adrenalineLevel: 'Pemula',
    pricePerPerson: 675000,
    duration: '1 Hari (06.30 - 15.00 WIB)',
    nextDepartureDate: '2026-12-05',
    totalQuota: 14,
    remainingQuota: 6,
    meetingPoint: 'Stasiun Tugu Yogyakarta / Basecamp Jetis Wetan',
    featured: true,
    rating: 4.8,
    reviewCount: 118,
    coverImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Menuruni sinkhole sedalam 60 meter dengan sistem tali tunggal terpandu untuk menyaksikan fenomena "Cahaya Surga" di Gua Grubug.',
    description:
      'Nikmati keajaiban karst Gunungkidul yang mendunia! Anda akan diturunkan menggunakan sistem tali vertikal (SRT assisted) ke dasar hutan purba Gua Jomblang, menyusuri lorong berlumpur sepanjang 300 meter menuju Gua Grubug tepat saat sinar matahari menembus lubang langit-langit gua pada pukul 10.30–12.00 WIB. Sangat ramah untuk pemula tanpa pengalaman panjat tebing.',
    highlights: [
      'Penurunan vertikal 60 meter yang aman & terpandu penuh oleh tim karst lokal',
      'Menjelajah hutan purba bawah tanah dengan vegetasi endemik karst',
      'Momen ikonik "Cahaya Surga" (Ray of Light) di Gua Grubug',
      'Makan siang tradisional khas Gunungkidul setelah keluar dari gua'
    ],
    itinerary: [
      {
        day: '06.30 - 09.00 WIB',
        title: 'Penjemputan & Perjalanan Menuju Karst Gunungkidul',
        activities: [
          'Penjemputan peserta di titik kumpul Stasiun Tugu Yogyakarta',
          'Perjalanan santai melintasi perbukitan Patuk menuju Basecamp Jomblang',
          'Registrasi kuota harian resmi & persiapan sepatu boots serta helm headlamp'
        ]
      },
      {
        day: '09.30 - 12.30 WIB',
        title: 'Penurunan Vertikal & Eksplorasi Gua Grubug',
        activities: [
          'Pemasangan full-body harness dan penurunan vertikal 60 meter ke dasar sinkhole',
          'Susur hutan purba dan lorong gua menuju titik pandang Cahaya Surga',
          'Sesi foto bergantian dipandu fotografer gua berpengalaman'
        ]
      },
      {
        day: '12.30 - 15.00 WIB',
        title: 'Naik ke Permukaan, Makan Siang & Kembali ke Kota',
        activities: [
          'Proses penarikan kembali ke permukaan dengan tim penarik profesional',
          'Bilas, ganti pakaian, dan makan siang nasi kotak khas desa Semanu',
          'Perjalanan kembali ke Yogyakarta'
        ]
      }
    ],
    included: [
      'Transportasi AC PP dari titik kumpul Yogyakarta ke Gua Jomblang',
      'Tiket masuk resmi & kuota harian Gua Jomblang',
      'Pemandu Caving Lokal bersertifikat HPI & keselamatan vertikal',
      'Perlengkapan caving lengkap (sepatu boots, helm, headlamp, full-body harness)',
      'Makan siang tradisional, kopi/teh hangat, dan air mineral'
    ],
    excluded: [
      'Kaus kaki panjang pribadi (wajib dibawa untuk dipakai di dalam boots)',
      'Pakaian ganti dan kebutuhan pribadi',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-mas-bagas',
      name: 'Bagas Wicaksono',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      origin: 'Wonosari, Gunungkidul',
      verified: true,
      certifications: ['HPI Speleology Guide', 'Vertical Rescue Basic', 'Karst Conservation Volunteer'],
      experienceYears: 7,
      completedTrips: 410,
      rating: 4.88,
      reviewCount: 204,
      languages: ['Bahasa Indonesia', 'English', 'Bahasa Jawa'],
      responseTime: '± 10 menit',
      bio: 'Penggiat speleologi dan konservasi karst Gunungsewu. Paham betul sudut pencahayaan terbaik dan sejarah geologi di balik terbentuknya Gua Jomblang.'
    },
    reviews: [
      {
        id: 'rev-5',
        author: 'Ayu Pratiwi',
        authorOrigin: 'Semarang',
        rating: 5,
        date: '2026-11-11',
        comment:
          'Pertama kali caving dan ternyata aman banget buat pemula! Mas Bagas juga bantu arahin spot foto pas cahaya matahari jatuh sempurna.'
      },
      {
        id: 'rev-6',
        author: 'Fajar Nugroho',
        authorOrigin: 'Tangerang',
        rating: 5,
        date: '2026-10-29',
        comment:
          'Jadwalnya on-time jadi nggak kehabisan momen ray of light. Penjelasan soal geologi karstnya seru dan bikin makin menghargai alam.'
      }
    ]
  },
  {
    id: 'trip-diving-komodo-ntt',
    slug: 'diving-taman-nasional-komodo-manta-point-3h2m',
    title: 'Fun Diving & Liveaboard Taman Nasional Komodo — Manta Point',
    location: 'Labuan Bajo, NTT',
    province: 'Nusa Tenggara Timur',
    category: 'Diving',
    adrenalineLevel: 'Menengah',
    pricePerPerson: 3450000,
    duration: '3 Hari 2 Malam (6 Dives)',
    nextDepartureDate: '2026-12-18',
    totalQuota: 8,
    remainingQuota: 2,
    meetingPoint: 'Pelabuhan Labuan Bajo, Manggarai Barat',
    featured: true,
    rating: 5.0,
    reviewCount: 53,
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1682687982501-1e58ab814714?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      '6 kali penyelaman drift dive bersama Pari Manta, terumbu karang Batu Bolong, dan trekking singkat melihat Komodo serta sunrise Pulau Padar.',
    description:
      'Jelajahi salah satu perairan paling kaya biodiversitas di dunia dengan kapal phinisi modern berkapasitas terbatas (maksimal 8 penyelam). Dipandu Divemaster lokal berpengalaman membaca arus Komodo, Anda akan menyelam di Manta Point, Batu Bolong, Siaba Besar (Turtle City), hingga Castle Rock, dipadukan kunjungan darat ke Pulau Padar dan Pulau Komodo.',
    highlights: [
      '6 sesi penyelaman di spot legendaris: Manta Point, Batu Bolong, Siaba Besar & Tatawa',
      'Rasio aman 1 PADI Divemaster lokal untuk maksimal 4 penyelam',
      'Kabin AC kapal phinisi + makan segar 3x sehari di atas kapal',
      'Bonus trekking sunrise Pulau Padar & wisata konservasi biawak Komodo'
    ],
    itinerary: [
      {
        day: 'Hari 1 — Sebayur & Siaba Besar',
        title: 'Check Dive & Turtle City',
        activities: [
          '09.00 WITA: Boarding di Pelabuhan Labuan Bajo & boat safety briefing',
          '11.30 WITA: Dive 1 (Check Dive) di Sebayur Kecil dengan visibilitas jernih',
          '15.00 WITA: Dive 2 di Siaba Besar bertemu penyu hijau & karang lunak, bermalam di teluk tenang'
        ]
      },
      {
        day: 'Hari 2 — Batu Bolong, Manta Point & Pulau Padar',
        title: 'Drift Dive Pari Manta & Sunset Padar',
        activities: [
          '07.00 WITA: Dive 3 di Batu Bolong menyaksikan ribuan ikan anthias dan hiu karang',
          '10.30 WITA: Dive 4 di Manta Point berenang sejajar bersama Pari Manta',
          '14.00 WITA: Dive 5 di Tatawa Besar, dilanjutkan trekking sore menikmati panorama Pulau Padar'
        ]
      },
      {
        day: 'Hari 3 — Pulau Komodo & Kanawa',
        title: 'Dive Terakhir & Konservasi Komodo',
        activities: [
          '07.30 WITA: Kunjungan darat bersama ranger resmi di Pulau Komodo',
          '11.00 WITA: Dive 6 santai di sekitar Kanawa / Siaba Kecil',
          '15.30 WITA: Kapal bersandar kembali di Pelabuhan Labuan Bajo'
        ]
      }
    ],
    included: [
      'Akomodasi kapal phinisi 3H2M (kabin AC sharing 2 orang)',
      '6x Fun Dive termasuk tabung 12L, pemberat, dan PADI Divemaster terverifikasi',
      'Makan 3x sehari, camilan sore, kopi, teh, dan air minum isi ulang di kapal',
      'Tiket masuk Taman Nasional Komodo & jasa ranger darat',
      'Dokumentasi bawah air oleh dive guide'
    ],
    excluded: [
      'Sewa alat selam personal (BCD, regulator, wetsuit, fins — tersedia paket sewa Rp250.000/hari)',
      'Tiket pesawat ke/dari Bandara Komodo Labuan Bajo (LBJ)',
      'Asuransi petualangan/diving instan tambahan'
    ],
    guide: {
      id: 'guide-yosep-bajo',
      name: 'Yosep Beda (Capt. Yosep)',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      origin: 'Labuan Bajo, NTT',
      verified: true,
      certifications: ['PADI Open Water Scuba Instructor', 'DAN Oxygen Provider', 'Komodo Marine Ranger Partner'],
      experienceYears: 9,
      completedTrips: 184,
      rating: 4.98,
      reviewCount: 112,
      languages: ['Bahasa Indonesia', 'English'],
      responseTime: '± 30 menit',
      bio: 'Instruktur selam asal Flores dengan lebih dari 1.800 logged dives di perairan Komodo. Ahli membaca pasang surut dan arus agar penyelaman tetap aman dan mengesankan.'
    },
    reviews: [
      {
        id: 'rev-7',
        author: 'Kevin Santoso',
        authorOrigin: 'Jakarta',
        rating: 5,
        date: '2026-11-04',
        comment:
          'Ketemu 7 ekor Manta sekaligus di Manta Point! Briefing arus dari Capt. Yosep detail banget, bikin penyelam Open Water Advance merasa sangat terlindungi.'
      }
    ]
  },
  {
    id: 'trip-trekking-ijen-baluran',
    slug: 'trekking-blue-fire-kawah-ijen-sabana-baluran',
    title: 'Midnight Trekking Blue Fire Kawah Ijen & Sabana Baluran',
    location: 'Banyuwangi, Jawa Timur',
    province: 'Jawa Timur',
    category: 'Trekking',
    adrenalineLevel: 'Pemula',
    pricePerPerson: 525000,
    duration: '1 Hari (Midnight - Sore)',
    nextDepartureDate: '2026-12-07',
    totalQuota: 15,
    remainingQuota: 7,
    meetingPoint: 'Stasiun Banyuwangi Kota / Hotel area Banyuwangi',
    featured: false,
    rating: 4.8,
    reviewCount: 87,
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Saksikan fenomena api biru langka di bibir kawah toska Ijen, lalu lanjut safari santai ke Padang Sabana Bekol di Taman Nasional Baluran.',
    description:
      'Paket open trip ramah pemula yang memadukan pendakian malam ke puncak Kawah Ijen (2.386 MDPL) untuk menyaksikan Blue Fire dan danau kawah asam berwarna pirus terbesar di dunia, dilanjutkan relaksasi di "Africa van Java" Taman Nasional Baluran.',
    highlights: [
      'Masker respirator gas belerang & headlamp berkualitas sudah termasuk',
      'Pemandu lokal Banyuwangi yang memahami kondisi angin belerang harian',
      'Panorama matahari terbit di atas danau toska Kawah Ijen',
      'Eksplorasi Sabana Bekol & Pantai Bama di TN Baluran'
    ],
    itinerary: [
      {
        day: '00.30 - 06.30 WIB',
        title: 'Pendakian Paltuding & Fenomena Blue Fire',
        activities: [
          'Penjemputan di Banyuwangi Kota dan perjalanan ke Pos Paltuding',
          'Pendakian santai 3 km (1,5–2 jam) menuju bibir kawah bersama pemandu',
          'Menyaksikan Blue Fire dan sunrise di atas danau kawah belerang'
        ]
      },
      {
        day: '07.00 - 15.00 WIB',
        title: 'Sarapan Lokal & Safari Taman Nasional Baluran',
        activities: [
          'Turun ke Paltuding & sarapan nasi tempong / pecel khas Banyuwangi',
          'Perjalanan ke TN Baluran, menyusuri Evergreen Forest, Sabana Bekol, dan Pantai Bama',
          'Kembali ke Stasiun Banyuwangi Kota'
        ]
      }
    ],
    included: [
      'Transportasi AC & BBM selama trip',
      'Tiket masuk TWA Kawah Ijen & TN Baluran (WNI)',
      'Pemandu lokal terverifikasi & surat keterangan sehat di klinik mitra',
      'Sewa masker respirator anti-belerang dan headlamp',
      'Sarapan pagi & air mineral'
    ],
    excluded: [
      'Taksi troli di jalur Ijen (opsional jika lelah)',
      'Makan siang di Baluran & pengeluaran pribadi',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-arif-oseng',
      name: 'Arif Rahman Hakim',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      origin: 'Licin, Banyuwangi',
      verified: true,
      certifications: ['HPI Jawa Timur', 'Ijen Geopark Guide', 'Basic Life Support'],
      experienceYears: 6,
      completedTrips: 290,
      rating: 4.86,
      reviewCount: 132,
      languages: ['Bahasa Indonesia', 'English'],
      responseTime: '± 15 menit',
      bio: 'Pemandu geopark kelahiran lereng Ijen. Suka berbagi kisah sejarah tambang belerang dan memastikan setiap peserta mendaki dengan ritme nyaman.'
    },
    reviews: [
      {
        id: 'rev-8',
        author: 'Luthfi Ramadhan',
        authorOrigin: 'Bekasi',
        rating: 5,
        date: '2026-11-09',
        comment:
          'Masker gasnya tebal dan bersih, jadi nggak perih sama sekali kena asap belerang. Trip paling worth it di Banyuwangi!'
      }
    ]
  },
  {
    id: 'trip-canyoning-cikaso-sukabumi',
    slug: 'canyoning-body-rafting-green-canyon-pangandaran',
    title: 'Canyoning & Extreme Body Rafting Green Canyon — Citumang',
    location: 'Pangandaran, Jawa Barat',
    province: 'Jawa Barat',
    category: 'Canyoning',
    adrenalineLevel: 'Ekstrem',
    pricePerPerson: 890000,
    duration: '2 Hari 1 Malam',
    nextDepartureDate: '2026-12-13',
    totalQuota: 12,
    remainingQuota: 5,
    meetingPoint: 'Terminal / Alun-alun Pangandaran',
    featured: false,
    rating: 4.9,
    reviewCount: 49,
    coverImage: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Pengarungan jeram 10 km full track Green Canyon, rappelling dinding stalaktit basah, dan loncat tebing Batu Payung di sungai berwarna giok.',
    description:
      'Berbeda dari wisata perahu biasa, rute Extreme Full Track Green Canyon mengajak Anda menyusuri 10 km hulu Sungai Cijulang dengan teknik body rafting, melewati jeram berbatu, terowongan stalaktit hujan abadi, hingga rappelling air terjun tersembunyi bersama tim river rescue lokal.',
    highlights: [
      'Full track body rafting 10 km (durasi pengarungan 4–5 jam)',
      'Rappelling dinding batu karst & cliff jumping Batu Payung',
      'Homestay nyaman dekat pantai & makan malam seafood bakar Pangandaran',
      'Dry bag tim, pelampung buoyancy tinggi, helm, dan dekker pengaman lutut'
    ],
    itinerary: [
      {
        day: 'Hari 1 — Full Track Green Canyon (10 Km)',
        title: 'Pengarungan Jeram & Hujan Abadi',
        activities: [
          '08.00 WIB: Briefing keselamatan, peregangan, dan pembagian perlengkapan pengarungan',
          '09.00 WIB: Start pengarungan dari Hulu Guha Bau menuju Batu Payung dan Hujan Abadi',
          '15.00 WIB: Tiba di dermaga Ciseureuh, santap nasi liwet hangat, lalu check-in homestay'
        ]
      },
      {
        day: 'Hari 2 — Sungai Citumang & Penutupan',
        title: 'Body Rafting Santai & Kuliner Lokal',
        activities: [
          '07.30 WIB: Sarapan pagi & menuju kawasan wisata alam Citumang',
          '09.00 WIB: Eksplorasi sungai jernih Citumang dan Goa Rengganis',
          '13.30 WIB: Bilas, makan siang, dan selesai'
        ]
      }
    ],
    included: [
      'Penginapan homestay AC 1 malam (sharing 2 orang)',
      'Pemandu River Rescue Lokal Terverifikasi (rasio 1 : 3)',
      'Peralatan body rafting & canyoning lengkap + dry bag tim',
      'Makan 4x (termasuk nasi liwet & seafood bakar) + kelapa muda',
      'Dokumentasi foto & video selama di sungai'
    ],
    excluded: [
      'Transportasi dari kota asal menuju Pangandaran',
      'Pengeluaran pribadi',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-kang-asep',
      name: 'Asep Kurniawan (Kang Asep)',
      avatar: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=300&q=80',
      origin: 'Cijulang, Pangandaran',
      verified: true,
      certifications: ['FAJI River Guide Lv. 2', 'Swiftwater Rescue Technician', 'HPI Jawa Barat'],
      experienceYears: 10,
      completedTrips: 365,
      rating: 4.92,
      reviewCount: 161,
      languages: ['Bahasa Indonesia', 'Bahasa Sunda', 'English'],
      responseTime: '± 15 menit',
      bio: 'Atlet arung jeram sekaligus putra asli Cijulang yang hafal setiap pusaran arus Sungai Green Canyon di musim hujan maupun kemarau.'
    },
    reviews: [
      {
        id: 'rev-9',
        author: 'Bima Wijaya',
        authorOrigin: 'Depok',
        rating: 5,
        date: '2026-10-19',
        comment:
          'Adrenalinnya dapet banget! Bagian loncat tebing dan melewati hujan abadi benar-benar tak terlupakan. Kang Asep super sigap jaga seluruh tim.'
      }
    ]
  },
  {
    id: 'trip-diving-derawan-kakaban',
    slug: 'diving-snorkeling-derawan-kakaban-maratua-4h3m',
    title: 'Diving & Island Hopping Derawan — Maratua — Danau Kakaban',
    location: 'Berau, Kalimantan Timur',
    province: 'Kalimantan Timur',
    category: 'Diving',
    adrenalineLevel: 'Pemula',
    pricePerPerson: 2980000,
    duration: '4 Hari 3 Malam',
    nextDepartureDate: '2026-12-20',
    totalQuota: 10,
    remainingQuota: 4,
    meetingPoint: 'Bandara Kalimarau Berau (BEJ) / Dermaga Tanjung Batu',
    featured: false,
    rating: 4.9,
    reviewCount: 41,
    coverImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Menyelam santai di dinding karang Maratua, berenang bersama ubur-ubur tak menyengat di Danau Kakaban, dan bertemu whale shark Talisayan.',
    description:
      'Surga bawah laut Kalimantan Timur yang cocok bagi penyelam pemula maupun non-diver (tersedia opsi Discover Scuba Diving & snorkeling). Menginap di water villa kayu khas Derawan dan menjelajahi tiga pulau eksotis dengan speedboat carter pribadi.',
    highlights: [
      '3x sesi Fun Dive / Discover Scuba di terumbu karang Derawan & Maratua',
      'Berenang di Danau Purba Kakaban bersama ubur-ubur tanpa sengat',
      'Kunjungan konservasi tukik & penyu hijau di Pulau Sangalaki',
      'Penginapan water cottage langsung di atas perairan jernih Derawan'
    ],
    itinerary: [
      {
        day: 'Hari 1 — Kedatangan & Sunset Derawan',
        title: 'Penyeberangan & House Reef Warm-up',
        activities: [
          'Penjemputan Bandara Kalimarau menuju Dermaga Tanjung Batu',
          'Speedboat 30 menit menuju Pulau Derawan & check-in water cottage',
          'Snorkeling sore di dermaga bersama penyu hijau'
        ]
      },
      {
        day: 'Hari 2 — Pulau Maratua & Goa Haji Mangku',
        title: 'Wall Diving Maratua & Lagua Toska',
        activities: [
          '2x sesi penyelaman di Big Fish Country / Coral Garden Maratua',
          'Eksplorasi kolam alami Goa Haji Mangku & makan siang tepi pantai'
        ]
      },
      {
        day: 'Hari 3 — Danau Kakaban & Pulau Sangalaki',
        title: 'Ubur-Ubur Kakaban & Manta Sandy',
        activities: [
          'Berenang santai di Danau Kakaban tanpa fin dan sunblock kimia (ramah ekosistem)',
          'Dive ke-3 di Sangalaki Manta Sandy & kunjungan penangkaran tukik'
        ]
      },
      {
        day: 'Hari 4 — Kembali ke Berau',
        title: 'Belanja Oleh-Oleh & Transfer Bandara',
        activities: [
          'Sarapan pagi menghadap laut & check-out pukul 09.00 WITA',
          'Penyeberangan kembali ke Tanjung Batu dan pengantaran ke Bandara Berau'
        ]
      }
    ],
    included: [
      'Transportasi mobil AC PP Bandara Berau – Tanjung Batu & speedboat island hopping',
      'Penginapan Water Cottage AC 3 malam di Pulau Derawan',
      '3x sesi diving (tabung, pemberat, guide) + peralatan snorkeling lengkap',
      'Makan 8x selama trip, tiket masuk seluruh pulau, dan dokumentasi underwater'
    ],
    excluded: [
      'Tiket pesawat ke/dari Berau (BEJ)',
      'Makan di luar jadwal & pengeluaran pribadi',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-hendra-berau',
      name: 'Hendra Saputra',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      origin: 'Pulau Derawan, Berau',
      verified: true,
      certifications: ['SSI Divemaster', 'Marine Eco-Guide Berau', 'First Aid & CPR'],
      experienceYears: 7,
      completedTrips: 142,
      rating: 4.91,
      reviewCount: 79,
      languages: ['Bahasa Indonesia', 'English'],
      responseTime: '± 25 menit',
      bio: 'Lahir dan besar di pesisir Derawan. Sangat peduli dengan pelestarian penyu hijau dan karang, selalu memastikan peserta berinteraksi secara etis dengan satwa laut.'
    },
    reviews: [
      {
        id: 'rev-10',
        author: 'Clara Wijaya',
        authorOrigin: 'Medan',
        rating: 5,
        date: '2026-10-30',
        comment:
          'Water cottage-nya langsung lihat penyu tiap pagi! Bang Hendra super informatif soal etika laut dan foto bawah airnya bening banget.'
      }
    ]
  },
  {
    id: 'trip-caving-rammang-maros',
    slug: 'caving-karst-rammang-rammang-gua-salukangkallang-maros',
    title: 'Susur Gua Horizontal & Karst Rammang-Rammang Maros',
    location: 'Maros, Sulawesi Selatan',
    province: 'Sulawesi Selatan',
    category: 'Caving',
    adrenalineLevel: 'Menengah',
    pricePerPerson: 780000,
    duration: '2 Hari 1 Malam',
    nextDepartureDate: '2026-12-19',
    totalQuota: 10,
    remainingQuota: 3,
    meetingPoint: 'Bandara Sultan Hasanuddin / Kota Makassar',
    featured: false,
    rating: 4.85,
    reviewCount: 37,
    coverImage: 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Menyusuri gugusan karst terbesar kedua di dunia dengan perahu jolloro, eksplorasi gua prasejarah, dan river caving di perut bukit kapur Maros-Pangkep.',
    description:
      'Kawasan UNESCO Global Geopark Maros-Pangkep menyimpan ratusan gua aktif dan lukisan tangan prasejarah berusia lebih dari 40.000 tahun. Open trip ini memadukan ketenangan menyusuri Sungai Pute di Rammang-Rammang dengan petualangan caving menembus sungai bawah tanah yang penuh ornamen stalaktit berkilau.',
    highlights: [
      'Susur Sungai Pute menggunakan perahu tradisional jolloro',
      'Eksplorasi sungai bawah tanah dengan peralatan caving & headlamp lumen tinggi',
      'Kunjungan situs lukisan purba Taman Prasejarah Leang-Leang',
      'Bermalam di eco-lodge di tengah lembah karst Berua yang tenang'
    ],
    itinerary: [
      {
        day: 'Hari 1 — Rammang-Rammang & Kampung Berua',
        title: 'Menyusuri Lembah Karst & Gua Berlian',
        activities: [
          'Penjemputan di Makassar menuju Dermaga Rammang-Rammang',
          'Menyusuri hutan nipah dengan perahu jolloro menuju Kampung Berua',
          'Eksplorasi Gua Berlian & Gua Kunang-Kunang, lalu makan malam lokal'
        ]
      },
      {
        day: 'Hari 2 — River Caving & Leang-Leang',
        title: 'Petualangan Sungai Bawah Tanah & Jejak Prasejarah',
        activities: [
          '08.00 WITA: Briefing keselamatan dan susur gua sungai bawah tanah bersama tim speleologi Maros',
          '13.00 WITA: Makan siang coto/konro khas Makassar & kunjungan situs Leang-Leang',
          '16.30 WITA: Pengantaran kembali ke Makassar'
        ]
      }
    ],
    included: [
      'Transportasi AC PP Makassar – Maros & sewa perahu jolloro',
      'Eco-lodge 1 malam di Kampung Berua',
      'Pemandu Speleologi Geopark Maros-Pangkep Terverifikasi',
      'Helm, headlamp tahan air, pelampung, dan sepatu caving',
      'Makan 4x, kopi lokal, dan tiket masuk seluruh kawasan geopark'
    ],
    excluded: [
      'Tiket pesawat ke/dari Makassar (UPG)',
      'Pengeluaran pribadi',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-daeng-rahmat',
      name: 'Rahmat Hidayat (Daeng Rahmat)',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
      origin: 'Maros, Sulawesi Selatan',
      verified: true,
      certifications: ['Geopark Maros-Pangkep Certified Guide', 'Cave Rescue Indonesia', 'HPI Sulsel'],
      experienceYears: 9,
      completedTrips: 196,
      rating: 4.9,
      reviewCount: 95,
      languages: ['Bahasa Indonesia', 'Bahasa Makassar', 'English'],
      responseTime: '± 20 menit',
      bio: 'Peneliti amatir gua karst dan pemandu lokal Maros yang berdedikasi memperkenalkan kekayaan Geopark Sulawesi Selatan secara berkelanjutan.'
    },
    reviews: [
      {
        id: 'rev-11',
        author: 'Naufal Azhari',
        authorOrigin: 'Balikpapan',
        rating: 5,
        date: '2026-11-01',
        comment:
          'Pagi hari bangun di Kampung Berua berkabut dikelilingi tebing karst itu magis banget. Caving-nya menantang tapi tetap aman karena peralatan lengkap.'
      }
    ]
  },
  {
    id: 'trip-trekking-prau-dieng',
    slug: 'trekking-golden-sunrise-gunung-prau-dieng-2h1m',
    title: 'Golden Sunrise Gunung Prau 2.590 MDPL via Patak Banteng',
    location: 'Wonosobo, Jawa Tengah',
    province: 'Jawa Tengah',
    category: 'Trekking',
    adrenalineLevel: 'Pemula',
    pricePerPerson: 450000,
    duration: '2 Hari 1 Malam',
    nextDepartureDate: '2026-12-05',
    totalQuota: 16,
    remainingQuota: 2,
    meetingPoint: 'Basecamp Patak Banteng, Dieng Wonosobo',
    featured: false,
    rating: 4.85,
    reviewCount: 142,
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Pendakian santai ramah pemula menuju Bukit Teletubbies Gunung Prau untuk berburu lautan awan dan siluet Gunung Sindoro–Sumbing.',
    description:
      'Pilihan paling ideal bagi pendaki pemula yang ingin merasakan camping di atas awan tanpa rute yang terlalu panjang. Dalam waktu tempuh 3–4 jam santai, Anda sudah bisa mendirikan tenda di padang sabana puncak Prau dengan pemandangan 6 puncak gunung Jawa Tengah sekaligus.',
    highlights: [
      'Rute pendakian 3–4 jam yang sangat ramah untuk pendaki pertama kali',
      'Tenda sudah didirikan lebih awal oleh tim porter di spot sunrise terbaik',
      'Makan malam hangat menu khas Dieng + sesi stargazing',
      'Bonus kunjungan Telaga Warna & kuliner Mie Ongklok setelah turun'
    ],
    itinerary: [
      {
        day: 'Hari 1 — Basecamp Patak Banteng ke Camp Puncak Prau',
        title: 'Pendakian Sore & Stargazing di Atas Awan',
        activities: [
          '12.00 WIB: Registrasi di Basecamp Patak Banteng & cek perlengkapan',
          '13.30 WIB: Pendakian santai melewati Pos 1, Pos 2, dan Pos 3',
          '17.00 WIB: Tiba di area camp, tenda siap huni, menikmati sunset, makan malam hangat, dan langit berbintang'
        ]
      },
      {
        day: 'Hari 2 — Golden Sunrise & Turun Gunung',
        title: 'Lautan Awan Sindoro–Sumbing',
        activities: [
          '05.00 WIB: Menyambut Golden Sunrise dengan kopi/cokelat panas',
          '07.00 WIB: Sarapan pagi, foto bersama di Bukit Teletubbies, dan bersih-bersih area camp',
          '09.30 WIB: Turun menuju Basecamp Patak Banteng (tiba sekitar 12.00 WIB) & selesai'
        ]
      }
    ],
    included: [
      'Simaksi resmi Gunung Prau & asuransi dasar pengelola basecamp',
      'Pemandu gunung lokal terverifikasi & porter tenda tim',
      'Tenda 2–3 orang, matras, sleeping bag, dan alat makan',
      'Makan 2x di gunung (makan malam & sarapan) + minuman hangat bebas isi ulang'
    ],
    excluded: [
      'Transportasi menuju Basecamp Patak Banteng',
      'Jaket tebal, sarung tangan, dan perlengkapan pribadi',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-mbak-ratna',
      name: 'Ratna Dewi Anggraini',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      origin: 'Dieng, Wonosobo',
      verified: true,
      certifications: ['APGI Mountain Guide', 'Wilderness First Aid', 'Leave No Trace Trainer'],
      experienceYears: 6,
      completedTrips: 248,
      rating: 4.94,
      reviewCount: 165,
      languages: ['Bahasa Indonesia', 'English', 'Bahasa Jawa'],
      responseTime: '± 10 menit',
      bio: 'Pemandu gunung perempuan asal Dataran Tinggi Dieng yang dikenal ramah dan telaten mendampingi solo traveler maupun pendaki pemula.'
    },
    reviews: [
      {
        id: 'rev-12',
        author: 'Putri Handayani',
        authorOrigin: 'Jakarta',
        rating: 5,
        date: '2026-11-15',
        comment:
          'Pendakian gunung pertamaku dan rasanya nagih! Mbak Ratna super perhatian, tenda udah berdiri rapi pas kami sampai atas. Sunrisenya juara!'
      }
    ]
  },
  {
    id: 'trip-diving-raja-ampat-papua',
    slug: 'diving-wayag-piaynemo-raja-ampat-papua',
    title: 'Diving & Island Hopping Piaynemo — Wayag Raja Ampat 4H3M',
    location: 'Waisai, Papua Barat Daya',
    province: 'Papua Barat Daya',
    category: 'Diving',
    adrenalineLevel: 'Menengah',
    pricePerPerson: 5450000,
    duration: '4 Hari 3 Malam',
    nextDepartureDate: '2026-12-22',
    totalQuota: 10,
    remainingQuota: 4,
    meetingPoint: 'Pelabuhan Waisai, Raja Ampat (atau Dermaga Sorong 08.30 WIT)',
    featured: true,
    rating: 4.98,
    reviewCount: 41,
    coverImage: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Menyelami episentrum keanekaragaman terumbu karang dunia di Cape Kri, Piaynemo, dan gugusan pulau karst Wayag bersama divemaster lokal Papua.',
    description:
      'Jelajahi surga bahari paling kaya di dunia di Kepulauan Raja Ampat, Papua Barat Daya. Paket open trip 4 hari 3 malam ini memadukan 6 sesi diving/snorkeling terkurasi di Cape Kri, Melissa Garden, dan Arborek dengan trekking puncak karst Piaynemo dan Wayag bersama pemandu asli Papua bersertifikat POSSI/PADI.',
    highlights: [
      '6 sesi dive & snorkeling di Cape Kri, Melissa Garden, dan Dermaga Arborek',
      'Trekking puncak panorama gugusan karst ikonik Piaynemo & Laguna Bintang',
      'Menginap di homestay tepi laut milik warga adat Kampung Sawinggrai',
      'Termasuk kartu PIN konservasi laut Raja Ampat & speedboat mesin ganda'
    ],
    itinerary: [
      {
        day: 'Hari 1 — Penyeberangan & Arborek',
        title: 'Sorong – Waisai & Check Dive Dermaga Arborek',
        activities: [
          'Penjemputan di Pelabuhan Waisai dan orientasi keselamatan laut',
          'Check dive di Dermaga Arborek bersama kawanan ikan karang & pari manta',
          'Check-in homestay tepi laut Sawinggrai & makan malam ikan bakar Papua'
        ]
      },
      {
        day: 'Hari 2 — Piaynemo & Melissa Garden',
        title: 'Puncak Karst Piaynemo & Terumbu Karang Terbaik Dunia',
        activities: [
          'Trekking anak tangga menuju puncak panorama Piaynemo & Telaga Bintang',
          '2 sesi dive / snorkeling di Melissa Garden dengan visibilitas >25 meter'
        ]
      },
      {
        day: 'Hari 3 — Cape Kri & Pasir Timbul',
        title: 'Drift Dive Cape Kri & Konservasi Desa Wisata',
        activities: [
          'Menyelam di Cape Kri bersama hiu karang ramah & penyu sisik',
          'Singgah di Pasir Timbul & interaksi kerajinan anyaman mama-mama Papua'
        ]
      },
      {
        day: 'Hari 4 — Kembali ke Waisai / Sorong',
        title: 'Morning Reef & Penutupan Ekspedisi',
        activities: [
          'Sarapan papeda & ikan kuah kuning khas Papua',
          'Pengantaran kembali ke Pelabuhan Waisai menuju Sorong'
        ]
      }
    ],
    included: [
      'Divemaster lokal Papua bersertifikat POSSI & PADI',
      'Speedboat twin-engine + BBM selama 4 hari',
      'Homestay tepi laut 3 malam & makan 3x sehari menu lokal',
      'Tabung selam, pemberat, dan dokumentasi bawah air'
    ],
    excluded: [
      'Tiket pesawat menuju Bandara DEO Sorong',
      'Sewa alat selam pribadi (BCD/Regulator) jika tidak membawa sendiri',
      'Asuransi petualangan instan tambahan'
    ],
    guide: {
      id: 'guide-yohan-papua',
      name: 'Yohanis Mambrasar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      origin: 'Waisai, Raja Ampat',
      verified: true,
      certifications: ['POSSI CMAS 3-Star Divemaster', 'PADI Rescue Diver', 'Marine Conservation Guide'],
      experienceYears: 9,
      completedTrips: 194,
      rating: 4.98,
      reviewCount: 89,
      languages: ['Bahasa Indonesia', 'English', 'Bahasa Biak'],
      responseTime: '± 20 menit',
      bio: 'Putra asli Raja Ampat yang mengabdikan diri pada ekowisata bahari berkelanjutan dan konservasi terumbu karang bersama masyarakat kampung adat.'
    },
    reviews: [
      {
        id: 'rev-13',
        author: 'Dina Larasati',
        authorOrigin: 'Surabaya',
        rating: 5,
        date: '2026-11-18',
        comment:
          'Pengalaman seumur hidup! Kak Yohan hafal betul arus di Cape Kri dan homestay warga lokalnya hangat sekali.'
      }
    ]
  }
]
