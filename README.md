# SIMANDUPA - Sistem Informasi Manajemen Terpadu MAN 2 Palembang

Aplikasi manajemen madrasah terpadu untuk MAN 2 Palembang dengan fitur absensi QR code, manajemen siswa/guru, dan notifikasi WhatsApp otomatis.

## 🚀 Fitur Utama

- ✅ Absensi digital dengan QR Code scanner
- ✅ Manajemen data siswa dan guru
- ✅ Notifikasi WhatsApp otomatis untuk orang tua
- ✅ Laporan absensi bulanan (export PDF)
- ✅ Sistem perizinan siswa
- ✅ Multi-role (Admin, Guru, Wali Kelas)
- ✅ Real-time attendance tracking

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Vite + Vanilla JavaScript
- **Database**: MySQL
- **Authentication**: bcrypt
- **Deployment**: Hostinger + GitHub Actions

## 📦 Struktur Proyek

##  Konfigurasi WhatsApp (Fonnte)

1. Daftar di https://fonnte.com
2. Dapatkan token dari dashboard
3. Tambahkan ke environment variables:
   - Production: `FONNTE_TOKEN` di hosting panel
   - Development: `FONNTE_TOKEN` di file `.env`