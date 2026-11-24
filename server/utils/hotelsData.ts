import type { Hotel } from '#shared/types/hotel'

export const HOTELS_DATA: Hotel[] = [
  {
    id: 'hotel-sambangan-bali',
    slug: 'sambangan-rainforest-eco-lodge-bali',
    name: 'Sambangan Rainforest Eco-Lodge',
    location: 'Buleleng, Bali Utara',
    province: 'Bali',
    type: 'Eco Lodge',
    stars: 4,
    rating: 4.9,
    reviewCount: 128,
    pricePerNight: 680000,
    nearTripSlug: 'canyoning-air-terjun-gitgit-bali',
    nearTripLabel: 'Canyoning Air Terjun Gitgit & Aling-Aling',
    distanceToBasecamp: '5 menit jalan kaki ke Basecamp Canyoning',
    verifiedPartner: true,
    featured: true,
    coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Pondok bambu modern di tepi lembah hijau Bali Utara dengan infinity pool air pegunungan dan sarapan organik sebelum memulai canyoning.',
    description:
      'Tersembunyi di tengah perkebunan cengkeh dan terasering hijau Desa Sambangan, Sambangan Rainforest Eco-Lodge dirancang khusus untuk para petualang yang menginginkan istirahat tenang sebelum dan sesudah pengarungan ngarai. Setiap kamar memiliki balkon menghadap hutan tropis, air hangat bertenaga surya, serta loker pengering peralatan outdoor.',
    facilities: [
      'Infinity Pool Air Pegunungan',
      'Sarapan Organik Bali (Gratis)',
      'Wi-Fi Cepat & Ruang Kerja Santai',
      'Area Pengering Wetsuit & Sepatu Outdoor',
      'Air Panas & Rain Shower',
      'Restoran Kopi Buleleng'
    ],
    checkInTime: '14:00 WITA',
    checkOutTime: '12:00 WITA',
    rooms: [
      {
        id: 'room-sambangan-forest',
        name: 'Forest View Bamboo Suite',
        capacity: 2,
        bedType: '1 Queen Bed / Twin',
        sizeSqm: 34,
        pricePerNight: 680000,
        breakfastIncluded: true,
        availableRooms: 5,
        amenities: ['Balkon Hutan', 'AC & Kipas', 'Air Panas', 'Sarapan 2 Orang']
      },
      {
        id: 'room-sambangan-family',
        name: 'Canopy Loft (Grup Petualang)',
        capacity: 4,
        bedType: '2 Queen Beds',
        sizeSqm: 56,
        pricePerNight: 1180000,
        breakfastIncluded: true,
        availableRooms: 2,
        amenities: ['Lantai Mezzanine', 'Balkon Luas', 'Loker Gear', 'Sarapan 4 Orang']
      }
    ],
    policies: [
      'Pembatalan gratis hingga H-3 sebelum tanggal check-in.',
      'Tersedia sarapan pagi lebih awal (06.00 WITA) khusus peserta open trip.',
      'Bebas asap rokok di seluruh area kamar.'
    ]
  },
  {
    id: 'hotel-sembalun-lombok',
    slug: 'sembalun-valley-boutique-resort-lombok',
    name: 'Sembalun Valley Boutique Resort',
    location: 'Sembalun Lawang, Lombok Timur',
    province: 'Nusa Tenggara Barat',
    type: 'Boutique Hotel',
    stars: 4,
    rating: 4.85,
    reviewCount: 96,
    pricePerNight: 790000,
    nearTripSlug: 'trekking-gunung-rinjani-sembalun-3h2m',
    nearTripLabel: 'Trekking Puncak Gunung Rinjani via Sembalun',
    distanceToBasecamp: '7 menit berkendara ke Gerbang TNGR Sembalun',
    verifiedPartner: true,
    featured: true,
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Kamar hangat bergaya kayu Sasak dengan pemandangan langsung dinding kaldera Rinjani, penitipan koper gratis selama mendaki, dan pemanas ruangan.',
    description:
      'Berada di ketinggian 1.150 MDPL tepat di kaki Gunung Rinjani, Sembalun Valley Boutique Resort menjadi tempat aklimatisasi terbaik sebelum summit attack. Nikmati tidur nyenyak dengan selimut thermal tebal, sarapan tinggi karbohidrat, serta layanan penitipan tas kota gratis selama Anda mendaki 3 hari 2 malam.',
    facilities: [
      'Pemandangan Langsung Gunung Rinjani',
      'Penitipan Koper Gratis Selama Pendakian',
      'Air Panas 24 Jam & Selimut Thermal',
      'Sarapan Pagi Mulai 05.30 WITA',
      'Kafe Kopi Arabika Sembalun',
      'Layanan Pijat Pemulihan Pasca-Trekking'
    ],
    checkInTime: '13:00 WITA',
    checkOutTime: '12:00 WITA',
    rooms: [
      {
        id: 'room-sembalun-deluxe',
        name: 'Rinjani Panorama Cottage',
        capacity: 2,
        bedType: '1 King Bed / Twin',
        sizeSqm: 32,
        pricePerNight: 790000,
        breakfastIncluded: true,
        availableRooms: 6,
        amenities: ['Teras View Gunung', 'Water Heater', 'Ketel Kopi', 'Sarapan 2 Orang']
      },
      {
        id: 'room-sembalun-bunk',
        name: 'Trekkers Timber Suite',
        capacity: 4,
        bedType: '2 Double Beds',
        sizeSqm: 48,
        pricePerNight: 1290000,
        breakfastIncluded: true,
        availableRooms: 3,
        amenities: ['Ruang Packing Gear', 'Water Heater', 'Pemanas Portable', 'Sarapan 4 Orang']
      }
    ],
    policies: [
      'Penitipan barang pribadi selama pendakian gratis dan diawasi CCTV 24 jam.',
      'Check-in awal fleksibel sesuai jadwal kedatangan dari Bandara Lombok.',
      'Pembatalan gratis hingga 48 jam sebelum check-in.'
    ]
  },
  {
    id: 'hotel-bajo-komodo',
    slug: 'bajo-cliffside-sunset-villa-komodo',
    name: 'Bajo Cliffside Sunset Villa',
    location: 'Labuan Bajo, NTT',
    province: 'Nusa Tenggara Timur',
    type: 'Villa',
    stars: 5,
    rating: 4.96,
    reviewCount: 154,
    pricePerNight: 1450000,
    nearTripSlug: 'diving-taman-nasional-komodo-manta-point-3h2m',
    nearTripLabel: 'Fun Diving & Liveaboard Taman Nasional Komodo',
    distanceToBasecamp: '10 menit ke Pelabuhan Labuan Bajo',
    verifiedPartner: true,
    featured: true,
    coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Vila tepi tebing menghadap gugusan pulau Flores & sunset Labuan Bajo, lengkap dengan plunge pool dan bak bilas alat selam.',
    description:
      'Sempurnakan liburan sebelum boarding kapal phinisi atau pasca-liveaboard di Bajo Cliffside Sunset Villa. Menawarkan panorama 180 derajat Teluk Labuan Bajo dari teras kayu jati, kolam renang menghadap laut, serta fasilitas bilas dan pengering perlengkapan selam pribadi.',
    facilities: [
      'Sunset Deck & Infinity Ocean Pool',
      'Antar-Jemput Bandara Komodo (Gratis)',
      'Tank Bilas & Rak Pengering Alat Diving',
      'Sarapan Laut & Tropis',
      'Restoran Seafood Segar',
      'Wi-Fi Starlink Berkecepatan Tinggi'
    ],
    checkInTime: '14:00 WITA',
    checkOutTime: '12:00 WITA',
    rooms: [
      {
        id: 'room-bajo-ocean',
        name: 'Ocean Cliff Suite',
        capacity: 2,
        bedType: '1 King Bed',
        sizeSqm: 44,
        pricePerNight: 1450000,
        breakfastIncluded: true,
        availableRooms: 4,
        amenities: ['View Teluk Bajo', 'Smart TV', 'Bathtub Outdoor', 'Sarapan 2 Orang']
      },
      {
        id: 'room-bajo-pool',
        name: 'Two-Bedroom Private Pool Villa',
        capacity: 4,
        bedType: '2 King Beds',
        sizeSqm: 92,
        pricePerNight: 2650000,
        breakfastIncluded: true,
        availableRooms: 2,
        amenities: ['Private Plunge Pool', 'Ruang Keluarga', 'Dapur Mini', 'Sarapan 4 Orang']
      }
    ],
    policies: [
      'Gratis penjemputan dari Bandara Komodo (LBJ) dengan konfirmasi nomor penerbangan.',
      'Tersedia late check-out hingga pukul 14.00 WITA (tergantung ketersediaan).'
    ]
  },
  {
    id: 'hotel-jomblang-jogja',
    slug: 'karst-heritage-glamping-gunungkidul-jogja',
    name: 'Karst Heritage Glamping & Suites',
    location: 'Semanu, Gunungkidul, DI Yogyakarta',
    province: 'DI Yogyakarta',
    type: 'Glamping',
    stars: 4,
    rating: 4.82,
    reviewCount: 74,
    pricePerNight: 540000,
    nearTripSlug: 'caving-gua-jomblang-cahaya-surga-gunungkidul',
    nearTripLabel: 'Eksplorasi Gua Vertikal Jomblang & Hutan Purba',
    distanceToBasecamp: '12 menit ke Basecamp Gua Jomblang',
    verifiedPartner: true,
    featured: true,
    coverImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Tenda glamping ber-AC mewah di tepi perbukitan kapur Gunungkidul dengan api unggun malam dan jarak super dekat ke Gua Jomblang.',
    description:
      'Tidak perlu berangkat subuh-subuh dari pusat kota Yogyakarta. Menginap di Karst Heritage Glamping membuat Anda bangun dengan udara segar perbukitan karst, menikmati kopi tubruk dan wedang uwuh di teras tenda kanvas ber-AC, lalu tiba di Gua Jomblang hanya dalam 12 menit.',
    facilities: [
      'Tenda Kanvas Premium Ber-AC & Kamar Mandi Dalam',
      'Area Api Unggun & Stargazing',
      'Sarapan Khas Jawa & Kopi Merapi',
      'Parkir Luas & Wi-Fi',
      'Layanan Laundry Kilat Pasca-Caving'
    ],
    checkInTime: '14:00 WIB',
    checkOutTime: '11:00 WIB',
    rooms: [
      {
        id: 'room-karst-tent',
        name: 'Limestone Dome Glamping',
        capacity: 2,
        bedType: '1 Queen Bed',
        sizeSqm: 28,
        pricePerNight: 540000,
        breakfastIncluded: true,
        availableRooms: 7,
        amenities: ['AC & Water Heater', 'Teras Hammock', 'Sarapan 2 Orang']
      },
      {
        id: 'room-karst-squad',
        name: 'Explorer Cabin (4 Orang)',
        capacity: 4,
        bedType: '2 Queen Beds',
        sizeSqm: 44,
        pricePerNight: 920000,
        breakfastIncluded: true,
        availableRooms: 3,
        amenities: ['Kabin Kayu AC', 'Area Barbeque', 'Sarapan 4 Orang']
      }
    ],
    policies: [
      'Ramah keluarga dan grup kecil.',
      'Tersedia paket barbeque malam dengan pemesanan di tempat.'
    ]
  },
  {
    id: 'hotel-ijen-banyuwangi',
    slug: 'ijen-highland-resort-banyuwangi',
    name: 'Ijen Highland Terraces Resort',
    location: 'Licin, Banyuwangi, Jawa Timur',
    province: 'Jawa Timur',
    type: 'Resort',
    stars: 4,
    rating: 4.88,
    reviewCount: 112,
    pricePerNight: 720000,
    nearTripSlug: 'trekking-blue-fire-kawah-ijen-sabana-baluran',
    nearTripLabel: 'Midnight Trekking Blue Fire Kawah Ijen & Baluran',
    distanceToBasecamp: '25 menit ke Pos Paltuding Kawah Ijen',
    verifiedPartner: true,
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Resort dikelilingi sawah bertingkat lereng Gunung Ijen dengan kolam air hangat dan layanan breakfast box untuk pendakian tengah malam.',
    description:
      'Terletak di desa sejuk Licin di kaki Gunung Ijen, Ijen Highland Terraces Resort menawarkan kenyamanan istirahat maksimal dengan kolam renang berpemandangan sawah dan gunung, serta layanan wake-up call & breakfast box pukul 00.30 WIB bagi peserta midnight trekking Blue Fire.',
    facilities: [
      'Kolam Renang Menghadap Sawah & Gunung',
      'Midnight Breakfast Box Gratis',
      'Spa & Pijat Kaki Tradisional Osing',
      'Restoran Kuliner Banyuwangi',
      'Wi-Fi & Parkir Gratis'
    ],
    checkInTime: '14:00 WIB',
    checkOutTime: '12:00 WIB',
    rooms: [
      {
        id: 'room-ijen-terrace',
        name: 'Paddy Terrace Deluxe',
        capacity: 2,
        bedType: '1 King / Twin',
        sizeSqm: 36,
        pricePerNight: 720000,
        breakfastIncluded: true,
        availableRooms: 6,
        amenities: ['Balkon Sawah', 'Air Panas', 'Sarapan / Breakfast Box']
      },
      {
        id: 'room-ijen-villa',
        name: 'Highland Garden Villa',
        capacity: 3,
        bedType: '1 King + 1 Single',
        sizeSqm: 54,
        pricePerNight: 1120000,
        breakfastIncluded: true,
        availableRooms: 2,
        amenities: ['Taman Pribadi', 'Bathtub Air Hangat', 'Sarapan 3 Orang']
      }
    ],
    policies: [
      'Layanan wake-up call tengah malam gratis untuk peserta Blue Fire Ijen.',
      'Pembatalan gratis hingga 48 jam sebelum kedatangan.'
    ]
  },
  {
    id: 'hotel-derawan-kalimantan',
    slug: 'derawan-lagoon-water-villa-berau',
    name: 'Derawan Lagoon Water Villa',
    location: 'Pulau Derawan, Berau, Kaltim',
    province: 'Kalimantan Timur',
    type: 'Villa',
    stars: 4,
    rating: 4.92,
    reviewCount: 68,
    pricePerNight: 1180000,
    nearTripSlug: 'diving-snorkeling-derawan-kakaban-maratua-4h3m',
    nearTripLabel: 'Diving & Island Hopping Derawan — Kakaban',
    distanceToBasecamp: 'Dermaga pribadi langsung untuk speedboat diving',
    verifiedPartner: true,
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription:
      'Vila kayu di atas air jernih berwarna pirus tempat penyu hijau berenang tepat di bawah balkon kamar Anda setiap pagi.',
    description:
      'Bangun tidur langsung di atas terumbu karang dangkal Pulau Derawan! Derawan Lagoon Water Villa memiliki tangga langsung turun ke laut untuk snorkeling, dermaga pribadi untuk penjemputan speedboat menuju Maratua dan Danau Kakaban, serta teras sunset yang memukau.',
    facilities: [
      'Akses Tangga Langsung ke Laut (House Reef)',
      'Dermaga Speedboat Pribadi',
      'Sarapan Laut & Kopi Pagi di Balkon',
      'AC, Air Tawar Hangat & Wi-Fi',
      'Sewa Kayak Transparan Gratis'
    ],
    checkInTime: '14:00 WITA',
    checkOutTime: '11:00 WITA',
    rooms: [
      {
        id: 'room-derawan-water',
        name: 'Lagoon Overwater Room',
        capacity: 2,
        bedType: '1 Queen Bed',
        sizeSqm: 38,
        pricePerNight: 1180000,
        breakfastIncluded: true,
        availableRooms: 5,
        amenities: ['Balkon di Atas Laut', 'AC & Water Heater', 'Sarapan 2 Orang']
      },
      {
        id: 'room-derawan-sunset',
        name: 'Sunset Horizon Water Suite',
        capacity: 4,
        bedType: '2 Queen Beds',
        sizeSqm: 62,
        pricePerNight: 1950000,
        breakfastIncluded: false,
        availableRooms: 2,
        amenities: ['Sun Deck Luas', 'Hammock di Atas Air', 'Area Santai Grup']
      }
    ],
    policies: [
      'Wajib menjaga kelestarian penyu hijau — dilarang menyentuh atau memberi makan satwa laut.',
      'Gratis penjemputan dari dermaga utama Pulau Derawan.'
    ]
  }
]
