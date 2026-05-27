# Product Requirements Document (PRD)
# Sistem Operasional Perusahaan AC (Air Condition)
### AirCool Management System

---

**Versi Dokumen** : 1.2  
**Tanggal** : 20 Mei 2026  
**Status** : ✅ Disetujui — Siap untuk Development  

---

## 1. Latar Belakang

Perusahaan ini bergerak di bidang penjualan unit AC, sparepart, dan penyediaan jasa service AC. Saat ini operasional masih dilakukan secara manual atau dengan sistem yang terpisah-pisah, sehingga menyebabkan kesulitan dalam pemantauan order, pengelolaan stok, pencatatan keuangan, dan koordinasi antar tim (admin dan teknisi).

Dibutuhkan sebuah sistem manajemen operasional berbasis web yang terintegrasi, responsif, dan mudah digunakan oleh seluruh pihak yang terlibat — mulai dari admin, teknisi, hingga manajemen.

---

## 2. Tujuan Proyek

| # | Tujuan |
|---|--------|
| 1 | Mengotomasi alur operasional dari order service hingga pembayaran |
| 2 | Memberikan visibilitas real-time terhadap order, stok, dan keuangan |
| 3 | Meningkatkan koordinasi antara admin dan teknisi melalui notifikasi otomatis |
| 4 | Menjamin kelengkapan pencatatan keuangan (kas masuk/keluar) dan stok |
| 5 | Mendukung program maintenance berkala untuk pelanggan loyal |

---

## 3. Ruang Lingkup Sistem

Sistem ini berbasis **web responsif** yang dapat diakses melalui **PC/Laptop, Tablet, dan Smartphone**. Sistem terdiri dari 8 modul utama:

```
┌──────────────────────────────────────────────┐
│           AirCool Management System          │
├──────────┬──────────┬──────────┬─────────────┤
│ Penjualan│  Order   │Inventory │ Maintenance │
│  Langsung│ Service  │ Control  │  Berkala    │
├──────────┴──────────┴──────────┴─────────────┤
│    Notifikasi WA/Telegram (Integrasi)        │
├──────────────────────────────────────────────┤
│           Dashboard & Laporan                │
├──────────────────────────────────────────────┤
│       Manajemen User & Role Akses            │
└──────────────────────────────────────────────┘
```

---

## 4. Stakeholder & User Role

| Role | Deskripsi | Hak Akses |
|------|-----------|-----------|
| **Admin** | Staf kantor yang mengelola operasional harian | Akses penuh ke semua modul |
| **Teknisi** | Tenaga lapangan yang mengerjakan service AC | Modul Order (update status & laporan hasil service) |
| **Manajemen** *(opsional)* | Pemilik / manajer | Dashboard & Laporan (read-only) |

---

## 5. Persyaratan Fungsional

### 5.1 Modul Penjualan Langsung (Point of Sale)

**Deskripsi**: Mencatat transaksi penjualan unit AC dan sparepart langsung kepada customer di lokasi.

#### Fitur yang Dibutuhkan:

| ID | Fitur | Prioritas |
|----|-------|-----------|
| PJ-01 | Pencarian produk (unit AC / sparepart) berdasarkan nama, kode, atau kategori | Tinggi |
| PJ-02 | Keranjang belanja yang bisa menampung lebih dari 1 item | Tinggi |
| PJ-03 | Input jumlah barang yang dibeli | Tinggi |
| PJ-04 | Kalkulasi total harga otomatis (termasuk diskon jika ada) | Tinggi |
| PJ-05 | Pilihan metode pembayaran: Tunai, Transfer, QRIS | Sedang |
| PJ-06 | Cetak / kirim struk transaksi | Sedang |
| PJ-07 | Stok otomatis berkurang setelah transaksi berhasil | Tinggi |
| PJ-08 | Histori transaksi penjualan | Tinggi |
| PJ-09 | Input data customer (nama, nomor HP) — opsional untuk walk-in | Rendah |
| PJ-10 | Retur barang dengan alasan dan update stok | Sedang |

---

### 5.2 Modul Order Service AC

**Deskripsi**: Mengelola seluruh alur service AC dari penerimaan order hingga pembayaran selesai.

#### 5.2.1 Workflow Order

```
[INPUT ORDER] → [JADWAL & TEKNISI] → [PROSES/BERANGKAT] → [LAPORAN TEKNISI]
                                                                    │
                              ┌─────────────────────────────────────┤
                              ▼                                     ▼
                    [OUTSTANDING]                          [PENDING - tunggu part]
                    (selesai, belum bayar)                         │
                              │                                     ▼
                              ▼                            [PROSES KEMBALI]
                           [DONE]  ◄──────────────────────────────┘
                    (selesai + lunas)

                    [RE-SCHEDULE] ← dapat terjadi di mana saja dalam alur
```

#### 5.2.2 Status Order

| Status | Kode | Kondisi | Warna Indikator |
|--------|------|---------|-----------------|
| **Order** | `ORDER` | Data pertama kali diinput oleh Admin | 🔵 Biru |
| **Proses** | `PROCESS` | Teknisi sudah berangkat & sedang service | 🟡 Kuning |
| **Outstanding** | `OUTSTANDING` | Service selesai, laporan masuk, **belum bayar** | 🟠 Oranye |
| **Done** | `DONE` | Service selesai, laporan masuk, **lunas bayar** | 🟢 Hijau |
| **Pending** | `PENDING` | Menunggu sparepart untuk penggantian | 🔴 Merah |
| **Re-schedule** | `RESCHEDULE` | Dijadwalkan ulang (dari customer / teknisi) | ⚫ Abu-abu |

#### 5.2.3 Fitur Order Service

| ID | Fitur | Prioritas |
|----|-------|-----------|
| OS-01 | Input order baru (nama customer, alamat, jenis AC, keluhan, tanggal) | Tinggi |
| OS-02 | Penugasan **satu atau lebih teknisi** ke satu order dan penetapan jadwal service | Tinggi |
| OS-03 | Update status order (order → proses → outstanding/pending → done) | Tinggi |
| OS-04 | **Teknisi langsung** input laporan hasil service (deskripsi pekerjaan, sparepart digunakan, foto eviden) — **tanpa perlu approval Admin** | Tinggi |
| OS-05 | Pencatatan pembayaran dan perubahan status ke Done | Tinggi |
| OS-06 | Fitur Re-schedule dengan input alasan dan notifikasi otomatis | Tinggi |
| OS-07 | Monitor semua order di dashboard dengan filter status | Tinggi |
| OS-08 | Detail order menampilkan histori perubahan status (timeline) | Sedang |
| OS-09 | Pencarian & filter order (by status, teknisi, tanggal, customer) | Sedang |
| OS-10 | Sparepart yang digunakan **otomatis masuk ke tagihan order** dan mengurangi stok inventory | Tinggi |
| OS-11 | Pembayaran dicatat sebagai kas masuk | Tinggi |
| OS-12 | Rating & feedback customer pasca service (opsional, tidak wajib diisi) | Sedang |
| OS-13 | **History Service per Pelanggan** — riwayat lengkap semua order & service yang pernah dilakukan oleh satu pelanggan, dapat diakses dari halaman detail customer | Tinggi |

#### 5.2.4 Form Laporan Teknisi

Saat teknisi menyelesaikan pekerjaan, field yang perlu diisi:

| Field | Tipe | Keterangan |
|-------|------|------------|
| Deskripsi pekerjaan | Textarea | Apa yang dikerjakan |
| **Item jasa** | Multi-select + harga | Pilih dari master item jasa; harga default dari master, bisa diubah per order |
| Sparepart digunakan | Multi-select + qty | Pilih dari stok; harga diambil dari master produk |
| **Total biaya jasa** | Auto-calc | Akumulasi semua item jasa |
| **Total biaya sparepart** | Auto-calc | Akumulasi harga sparepart yang dipakai |
| **Grand Total** | Auto-calc | Total jasa + total sparepart |
| **Foto eviden** | Upload | **Wajib**, min 1 foto, max 5 foto sebagai bukti pekerjaan |
| Status bayar | Toggle | Lunas / Belum Lunas |
| Metode bayar | Pilihan | Tunai / Transfer / QRIS |
| Rating & Feedback | Bintang 1-5 + komentar | Opsional — bisa diisi teknisi saat serah terima hasil ke customer |

---

### 5.3 Modul Inventory Control

**Deskripsi**: Mengelola pergerakan stok barang (unit AC dan sparepart).

#### 5.3.1 Stok Masuk (IN)

| ID | Fitur | Prioritas |
|----|-------|-----------|
| IN-01 | Input pembelian barang dari supplier (kode barang, nama, qty, harga beli) | Tinggi |
| IN-02 | Pilih / tambah supplier | Sedang |
| IN-03 | Nomor referensi / nomor faktur pembelian | Sedang |
| IN-04 | Riwayat pembelian barang | Tinggi |
| IN-05 | Stok otomatis bertambah setelah entry pembelian | Tinggi |
| IN-06 | Notifikasi / alert saat stok barang mendekati batas minimum | Tinggi |

#### 5.3.2 Stok Keluar (OUT)

| ID | Fitur | Sumber Transaksi |
|----|-------|-----------------|
| OUT-01 | Penjualan unit / sparepart langsung (Modul POS) | Otomatis |
| OUT-02 | Pemakaian sparepart saat service (Laporan Teknisi) | Otomatis |
| OUT-03 | Penyesuaian stok manual (misalnya barang rusak / hilang) | Manual Admin |

#### 5.3.3 Fitur Inventory Lainnya

| ID | Fitur | Prioritas |
|----|-------|-----------|
| IV-01 | Daftar semua produk dengan stok saat ini | Tinggi |
| IV-02 | Batas stok minimum per produk (konfigurasi Admin) | Tinggi |
| IV-03 | Laporan pergerakan stok per produk (IN/OUT) | Tinggi |
| IV-04 | Kategori produk (Unit AC / Sparepart / Aksesoris) | Sedang |
| IV-05 | Harga jual dan harga beli per produk | Tinggi |

---

### 5.4 Modul Maintenance Berkala

**Deskripsi**: Pengelolaan jadwal service rutin pelanggan yang memiliki kontrak maintenance (misal: setiap 3 bulan).

| ID | Fitur | Prioritas |
|----|-------|-----------|
| MB-01 | Input jadwal maintenance pelanggan (nama, alamat, unit AC, interval service misal 3 bulan, tanggal mulai) | Tinggi |
| MB-02 | Sistem menghitung otomatis tanggal jatuh tempo service berikutnya | Tinggi |
| MB-03 | Notifikasi WA **dan** Telegram ke Admin pada **H-1 sebelum jatuh tempo** | Tinggi |
| MB-04 | Admin bisa melakukan **reschedule manual** berdasarkan hasil follow-up ke pelanggan | Tinggi |
| MB-05 | Riwayat semua service maintenance per pelanggan | Sedang |
| MB-06 | Status jadwal maintenance: Aktif / Tidak Aktif | Sedang |
| MB-07 | Dashboard daftar maintenance yang jatuh tempo bulan ini | Sedang |

---

### 5.5 Modul Notifikasi (WhatsApp / Telegram)

**Deskripsi**: Sistem notifikasi otomatis yang terintegrasi dengan WhatsApp (via API, misal: WhatsApp Business API / Fonnte / WAPintar) dan/atau Telegram Bot.

#### 5.5.1 Jenis Notifikasi

| ID | Penerima | Trigger | Isi Notifikasi |
|----|----------|---------|----------------|
| NT-01 | **Admin** | Setiap hari (pagi) | Daftar semua order yang jatuh tempo hari ini (H+0) dan besok (H+1) — dikirim via **WA & Telegram** |
| NT-02 | **Admin** | H-1 maintenance | Pengingat maintenance berkala customer yang jatuh tempo besok — via **WA & Telegram** |
| NT-03 | **Admin** | Ada Re-schedule | Notifikasi bahwa ada order yang di-reschedule, beserta detail jadwal baru — via **WA & Telegram** |
| NT-04 | **Teknisi** | Setiap hari (malam/pagi) | Daftar tugas service untuk hari berikutnya (H+1) — via **WA & Telegram** |
| NT-05 | **Teknisi** | Ada penugasan baru | Notif langsung saat admin menetapkan teknisi ke order baru — via **WA & Telegram** |
| NT-06 | **Admin** | Stok hampir habis | Alert saat stok produk mencapai batas minimum — via **WA & Telegram** |

#### 5.5.2 Konfigurasi Notifikasi

| ID | Fitur | Prioritas |
|----|-------|-----------|
| NK-01 | Input nomor WA / Telegram ID per user (Admin/Teknisi) | Tinggi |
| NK-02 | Pilih channel notifikasi: WA, Telegram, atau keduanya | Tinggi |
| NK-03 | Jadwal pengiriman notifikasi harian (default: 07.00 pagi) | Sedang |
| NK-04 | Log pengiriman notifikasi (status terkirim/gagal) | Sedang |
| NK-05 | Template pesan notifikasi yang dapat dikustomisasi | Rendah |

---

### 5.6 Modul Dashboard

**Deskripsi**: Halaman utama yang menampilkan ringkasan kondisi operasional terkini secara visual.

#### Widget Dashboard

| Widget | Deskripsi | Akses |
|--------|-----------|-------|
| 📦 **Total Order Bulan Ini** | Jumlah order masuk bulan berjalan, dengan breakdown status | Admin |
| 💰 **Pendapatan Bulan Ini** | Total kas masuk dari service + penjualan | Admin |
| 💸 **Pengeluaran Bulan Ini** | Total pembelian sparepart / barang | Admin |
| ⚠️ **Stok Hampir Habis** | Daftar produk di bawah stok minimum | Admin |
| 📋 **Order Aktif** | Tabel order dengan status Order/Proses/Pending/Outstanding | Admin & Teknisi |
| 🗓️ **Jadwal Hari Ini** | Daftar order yang dijadwalkan hari ini (per teknisi) | Admin & Teknisi |
| 🔔 **Maintenance Jatuh Tempo** | Daftar maintenance yang jatuh tempo bulan ini | Admin |

---

### 5.7 Modul Laporan Keuangan

**Deskripsi**: Laporan bisnis berdasarkan periode yang dapat dipilih (harian, mingguan, bulanan, custom range).

#### 5.7.1 Laporan yang Tersedia

| ID | Nama Laporan | Isi | Akses |
|----|--------------|-----|-------|
| LK-01 | **Ringkasan Keuangan** | Total Pendapatan, Pendapatan Service, Pendapatan Penjualan, Total Pengeluaran, Laba Kotor | Admin |
| LK-02 | **Laporan Order Selesai** | Daftar order Done per periode, dengan biaya dan teknisi | Admin |
| LK-03 | **Performa Teknisi** | Jumlah order selesai, total pendapatan yang dihasilkan, rating (opsional) per teknisi | Admin |
| LK-04 | **History Transaksi Service** | Log semua transaksi service (order, tanggal, customer, teknisi, status, total bayar) | Admin |
| LK-05 | **History Transaksi Penjualan** | Log semua penjualan langsung | Admin |
| LK-06 | **Laporan Stok** | Pergerakan stok (IN/OUT) per produk per periode | Admin |

#### 5.7.2 Fitur Laporan

| ID | Fitur | Prioritas |
|----|-------|-----------|
| LF-01 | Filter periode (harian, mingguan, bulanan, custom) | Tinggi |
| LF-02 | Export laporan ke format PDF dan Excel (CSV) | Tinggi |
| LF-03 | Grafik visualisasi pendapatan vs pengeluaran | Sedang |

---

### 5.8 Modul User & Manajemen Akses

| ID | Fitur | Prioritas |
|----|-------|-----------|
| UA-01 | Login dengan username & password | Tinggi |
| UA-02 | Role-based access control (Admin / Teknisi) | Tinggi |
| UA-03 | Admin bisa tambah, edit, nonaktifkan akun user | Tinggi |
| UA-04 | Profil user: nama, nomor HP (WA), Telegram ID | Tinggi |
| UA-05 | Ganti password | Sedang |
| UA-06 | Log aktivitas user (audit trail) | Rendah |

#### Matriks Hak Akses

| Modul | Admin | Teknisi |
|-------|-------|---------|
| Dashboard | ✅ Full | ✅ Terbatas (order & jadwal hari ini) |
| Penjualan Langsung | ✅ Full | ❌ |
| Order Service - Lihat | ✅ Full | ✅ (hanya miliknya) |
| Order Service - Input Laporan | ✅ | ✅ |
| Order Service - Update Status | ✅ Full | ✅ (hanya miliknya) |
| Inventory | ✅ Full | ❌ |
| Maintenance Berkala | ✅ Full | ❌ |
| Laporan Keuangan | ✅ Full | ❌ |
| Pengaturan Notifikasi | ✅ Full | ❌ |
| Manajemen User | ✅ Full | ❌ |

---

## 6. Persyaratan Non-Fungsional

### 6.1 Performa

| Kriteria | Target |
|----------|--------|
| Waktu muat halaman | < 3 detik pada koneksi 4G |
| Response API | < 1 detik untuk operasi CRUD standar |
| Kapasitas data | Mendukung hingga 10.000 order/tahun |

### 6.2 Responsivitas (UI/UX)

| Perangkat | Lebar Layar | Keterangan |
|-----------|-------------|------------|
| Smartphone | 320px – 767px | Layout satu kolom, navigasi hamburger menu |
| Tablet | 768px – 1023px | Layout dua kolom |
| PC/Laptop | ≥ 1024px | Layout penuh dengan sidebar navigasi |

### 6.3 Keamanan

| Aspek | Ketentuan |
|-------|-----------|
| Autentikasi | JWT Token / Session-based |
| Password | Hashed (bcrypt) |
| HTTPS | Wajib untuk semua komunikasi |
| Role isolation | Data teknisi tidak bisa diakses oleh teknisi lain |
| Session timeout | Otomatis logout setelah idle 8 jam |

### 6.4 Ketersediaan

| Aspek | Target |
|-------|--------|
| Uptime | 99% (dapat down maks. ~7 jam/bulan) |
| Backup data | Otomatis harian |
| Browser support | Chrome, Firefox, Safari, Edge (versi terbaru) |

---

## 7. Arsitektur Sistem (Overview)

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│       PC / Laptop / Tablet / Smartphone                  │
│              [Responsive Web App]                        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                   WEB SERVER / API                       │
│                 [Backend REST API]                       │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│   │  Auth    │ │  Order   │ │Inventory │ │ Report   │  │
│   │ Service  │ │ Service  │ │ Service  │ │ Service  │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│   ┌─────────────────────────────────────────────────┐   │
│   │          Notification Service                   │   │
│   │     (Scheduler + WA API / Telegram Bot)         │   │
│   └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  DATABASE SERVER                         │
│              [PostgreSQL / Supabase]                     │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Model Data Utama (Entitas & Relasi)

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐
│   CUSTOMER  │    │    ORDER     │    │    TEKNISI    │
│─────────────│    │──────────────│    │───────────────│
│ id          │◄──┤ customer_id  ├───►│ id            │
│ nama        │    │ teknisi_id  │    │ nama          │
│ alamat      │    │ status      │    │ nomor_hp      │
│ nomor_hp    │    │ tanggal     │    │ telegram_id   │
└─────────────┘    │ total_biaya │    └───────────────┘
                   │ catatan     │
                   └──────┬──────┘
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
   ┌──────────────────┐     ┌──────────────────────┐
   │  ORDER_SPAREPART │     │   ORDER_PEMBAYARAN   │
   │──────────────────│     │──────────────────────│
   │ order_id         │     │ order_id             │
   │ produk_id  ◄─────┼─┐  │ jumlah               │
   │ qty              │ │  │ metode               │
   │ harga_saat_itu   │ │  │ tanggal_bayar        │
   └──────────────────┘ │  └──────────────────────┘
                        │
              ┌─────────▼──────────┐
              │      PRODUK        │
              │────────────────────│
              │ id                 │
              │ kode               │
              │ nama               │
              │ kategori           │
              │ harga_jual         │
              │ harga_beli         │
              │ stok               │
              │ stok_minimum       │
              └────────────────────┘
```

---

## 9. Integrasi Eksternal

### 9.1 WhatsApp API — **WAHA (WhatsApp HTTP API)**

**Platform yang digunakan: [WAHA](https://waha.devlike.pro/)** — solusi self-hosted WhatsApp API unofficial berbasis Docker.

| Aspek | Detail |
|-------|--------|
| **Tipe** | Self-hosted (dijalankan di server sendiri via Docker) |
| **Biaya** | Gratis (open source) / WAHA Plus berbayar untuk fitur tambahan |
| **Kelebihan** | Tidak bergantung pihak ketiga, tidak ada biaya per pesan |
| **Cara kerja** | REST API HTTP — sistem backend memanggil endpoint WAHA untuk kirim pesan |
| **Kebutuhan** | Server dengan Docker, nomor WA yang didedikasikan |
| **Catatan** | Nomor WA yang digunakan harus selalu tersambung (scan QR sekali, session aktif) |

### 9.2 Telegram Bot

| Aspek | Keterangan |
|-------|------------|
| Setup | Buat bot via @BotFather, gratis |
| API | Telegram Bot API (HTTP) |
| Fitur | Kirim pesan teks, format Markdown, tombol inline |
| Biaya | Gratis, tidak ada limit pesan |

> **Keputusan**: Kedua channel notifikasi (WA via WAHA + Telegram Bot) aktif sejak **v1.0**. Setiap notifikasi dikirim ke **kedua platform secara bersamaan**.

---

## 10. Stack Teknologi yang Direkomendasikan

### 10.1 Frontend

| Aspek | Detail |
|-------|--------|
| **Framework** | **React.js** (Vite sebagai build tool) |
| **UI Library** | Tailwind CSS + shadcn/ui atau Ant Design |
| **State Management** | Zustand / React Query (untuk server state) |
| **Routing** | React Router v6 |
| **Notifikasi Real-time** | Socket.io client / Polling |
| **Alasan** | Komponen reusable cocok untuk sistem multi-modul; ekosistem luas; performa optimal untuk dashboard & form kompleks |

### 10.2 Backend

| Aspek | Detail |
|-------|--------|
| **Runtime** | **Node.js** |
| **Framework** | Express.js |
| **Autentikasi** | JWT (JSON Web Token) |
| **Scheduler** | node-cron (untuk notifikasi terjadwal harian) |
| **File Upload** | Multer (foto eviden laporan teknisi) |
| **Alasan** | Ringan, cepat, ekosistem npm yang kaya; cocok dipadukan dengan React di sisi frontend |

### 10.3 Database

| Aspek | Detail |
|-------|--------|
| **Database** | **PostgreSQL** |
| **Opsi Hosting** | **Supabase** (PostgreSQL as a Service — gratis untuk skala awal) |
| **ORM** | Prisma ORM |
| **Alasan** | PostgreSQL handal untuk data relasional kompleks (order, inventory, keuangan); Supabase menyediakan database + Auth + Storage + Realtime dalam satu platform |

### 10.4 Integrasi & Infrastruktur

| Komponen | Teknologi |
|----------|-----------|
| WA Notifikasi | **WAHA** (self-hosted via Docker) |
| Telegram Notifikasi | Telegram Bot API |
| File Storage | Supabase Storage / Cloudinary (foto eviden) |
| Deployment Backend | Railway / Render / VPS |
| Deployment Frontend | Vercel / Netlify |

```
┌─────────────────────────────────────────────────────┐
│          TECH STACK OVERVIEW                        │
├──────────────┬──────────────┬───────────────────────┤
│   FRONTEND   │   BACKEND    │      DATABASE         │
│   React.js   │   Node.js    │  PostgreSQL/Supabase  │
│   (Vite)     │  (Express)   │   + Prisma ORM        │
└──────┬───────┴──────┬───────┴───────────────────────┘
       │              │
       │   REST API   │◄── node-cron (scheduler)
       └──────────────┘
              │
   ┌──────────┴──────────┐
   │  WAHA (Docker)      │   Telegram Bot API
   │  WA Notifikasi      │   Telegram Notifikasi
   └─────────────────────┘
```

---

## 11. Tahapan Implementasi (Roadmap)

### Fase 1 – Fondasi (Bulan 1-2)
- [ ] Setup infrastruktur & database
- [ ] Modul Autentikasi & Manajemen User
- [ ] Modul Inventory Control (CRUD produk, IN/OUT stok)
- [ ] Modul Penjualan Langsung (POS dasar)

### Fase 2 – Core Service (Bulan 2-3)
- [ ] Modul Order Service (workflow lengkap dengan semua status)
- [ ] Form Laporan Teknisi
- [ ] Integrasi stok dari laporan teknisi
- [ ] Pencatatan pembayaran & kas masuk

### Fase 3 – Notifikasi & Maintenance (Bulan 3-4)
- [ ] Modul Maintenance Berkala
- [ ] Integrasi Telegram Bot
- [ ] Integrasi WhatsApp API
- [ ] Scheduler notifikasi otomatis

### Fase 4 – Dashboard & Laporan (Bulan 4)
- [ ] Dashboard dengan semua widget
- [ ] Modul Laporan Keuangan
- [ ] Export PDF & Excel
- [ ] Grafik & visualisasi data

### Fase 5 – UAT & Go Live (Bulan 5)
- [ ] User Acceptance Testing (UAT) dengan Admin & Teknisi
- [ ] Perbaikan bug
- [ ] Training pengguna
- [ ] Go Live

---

## 12. Asumsi & Batasan

### Asumsi
- Seluruh pengguna memiliki akses internet yang cukup memadai
- Teknisi memiliki smartphone untuk mengakses sistem di lapangan
- Admin mengelola satu atau lebih nomor WA/Telegram untuk menerima notifikasi
- Tidak ada integrasi dengan sistem eksternal lain di luar yang disebutkan (WA/Telegram)

### Batasan (Out of Scope v1.0)
- Aplikasi mobile native (Android/iOS) — sistem ini berbasis web saja
- Customer portal (pelanggan tidak login ke sistem)
- Integrasi dengan payment gateway otomatis
- Multi-cabang / multi-outlet
- Akuntansi double-entry (hanya pencatatan kas sederhana)

---

## 13. Keputusan Desain yang Telah Dikonfirmasi

> [!NOTE]
> Semua pertanyaan terbuka telah dijawab. Berikut adalah keputusan yang menjadi acuan development:

| # | Pertanyaan | Keputusan |
|---|-----------|----------|
| 1 | Multi-teknisi dalam satu order? | ✅ **Ya** — satu order bisa ditangani oleh lebih dari satu teknisi |
| 2 | Biaya sparepart otomatis ke tagihan customer? | ✅ **Ya** — biaya sparepart otomatis masuk dalam total tagihan order |
| 3 | Platform notifikasi? | ✅ **Keduanya** — WA (via WAHA) + Telegram aktif sejak v1.0 |
| 4 | Format kontrak maintenance spesifik? | ✅ **Tidak perlu** — cukup data dasar (pelanggan, AC, interval, tanggal) |
| 5 | Approval Admin untuk laporan teknisi? | ✅ **Tidak** — teknisi langsung update status ke Done, disertai wajib foto eviden |
| 6 | Penentuan harga jasa service? | ✅ **Custom per order** — ambil nilai default dari master item jasa, bisa diubah |
| 7 | Fitur rating/feedback customer? | ✅ **Ada, tapi opsional** — tidak wajib diisi, bisa diisi teknisi saat serah terima |

---

## 14. Master Data yang Perlu Dipersiapkan

Sebelum sistem digunakan, data berikut perlu disiapkan oleh Admin:

| Master Data | Contoh Isi | Modul Pengguna |
|-------------|-----------|----------------|
| **Produk / Sparepart** | Freon R32, Filter AC, Remote AC, Unit AC 1/2 PK | Inventory, POS, Order |
| **Item Jasa** | Cuci AC, Isi Freon, Bongkar-Pasang, Cek Kerusakan | Order Service (form laporan) |
| **Data Teknisi** | Nama, No HP (WA), Telegram ID | Order, Notifikasi |
| **Data Customer** | Nama, Alamat, No HP | Order, Maintenance |
| **Konfigurasi Notifikasi** | Jam kirim, Template pesan, No WA Admin | Notifikasi |

---

*Dokumen ini telah direvisi ke versi 1.2 berdasarkan masukan tambahan stakeholder pada 20 Mei 2026.*  
*Status: ✅ Siap untuk tahap pengembangan (development).*
