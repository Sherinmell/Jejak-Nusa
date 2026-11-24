# Jejak-Nusa

Platform Open Trip & Penginapan Hotel berbasis Nuxt 4, Tailwind CSS v4, dan TiDB Cloud Serverless.

## Fitur Utama
- **Login Terpadu (Username / Email / WhatsApp & Password)** dengan enkripsi `scrypt` dan penyimpanan permanen di **TiDB Cloud**.
- **Katalog Open Trip & Penginapan Hotel** (bisa pesan Open Trip saja, gabung Trip + Hotel terdekat, maupun Hotel saja).
- **Persyaratan Trip & Ketentuan Menginap**, form data diri peserta dinamis (NIK/Paspor, kontak darurat, riwayat medis), dan waiver persetujuan wajib.
- **Pembayaran QRIS Dinamis** & **Cetak / Unduh Bukti Pembayaran (Invoice)**.
- **Pengiriman & Klaim Sertifikat Resmi** oleh Admin ke Peserta, terhubung otomatis ke **Adventure Passport** (+500 poin, stempel destinasi, peta jejak Nusantara, dan lencana digital).
- **Admin Command Center**: monitoring transaksi, verifikasi pembayaran, kontrol status selesai & kirim sertifikat, manajemen feature flags & komisi, serta CRUD database.

## Menjalankan Proyek
```bash
npm install
cp .env.example .env
# Isi kredensial TiDB Cloud di .env
npm run db:setup
npm run dev
```
