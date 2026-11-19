# Master Roadmap Proyek NUSARA (MVP Phase Tracking)

Berdasarkan **PRD Section 18 (Recommended Build Order)** & **ERD Final Draft v3.0**.

---

## Ringkasan Progres MVP

- [x] **Fase 1: Fondasi Arsitektur, Skema ERD & Autentikasi** (100% Selesai)
- [ ] **Fase 2: Menu, Best Seller & Favorit Member** (30% Berjalan)
- [ ] **Fase 3: Dine-in via QR Meja & Validasi Waiter**
- [ ] **Fase 4: Takeaway Order & Self-Pickup**
- [ ] **Fase 5: Integrasi Pembayaran Midtrans & Order Lock**
- [ ] **Fase 6: Sistem Reservasi Meja & Alokasi Kapasitas**
- [ ] **Fase 7: Dashboard Staf (Admin, Kasir, Waiter)**
- [ ] **Fase 8: Docker Compose VPS & Production Readiness**

---

## Rincian Per Fase

### Fase 1: Fondasi Arsitektur, Skema ERD & Autentikasi `[x] COMPLETED`
- [x] Inisialisasi Laravel 13, Inertia.js, React, TypeScript, Tailwind CSS v4.
- [x] Migrasi 24+ tabel ERD (`roles`, `users`, `customers`, `menus`, `orders`, `payments`, `reservations`, dll).
- [x] Seeder data awal (Akun Admin, Kasir, Waiter, Member, Menu Pusaka, Dining Experience, Jam Buka).
- [x] Desain sistem Brand Identity (Burgundy `#32151F`, Ivory `#F4EFE6`, Gold `#B99A65`, Espresso `#211D1B`, font *Cormorant Garamond* & *DM Sans*).
- [x] Halaman Landing Page responsif (`LandingPage.tsx`).
- [x] Halaman Login terpadu (`Login.tsx`) dengan tab Pelanggan & Portal Staf serta tombol demo cepat.
- [x] Sinkronisasi Git branch `main` dan `staging` di GitHub.

---

### Fase 2: Menu, Best Seller & Favorit Member `[/] IN_PROGRESS`
- [x] Tampilan katalog menu publik berdasar kategori.
- [x] Filter pencarian menu & toggle Best Seller.
- [x] Penanganan status menu habis (dimmed/disabled sesuai PRD 3.2).
- [ ] Controller toggle favorit pelanggan terdaftar (`favorites` DB table) -> *Tiket `[REQ-BE-001]`*.
- [ ] Halaman khusus daftar menu favorit member (`/my-favorites`).
- [ ] Penghitungan otomatis menu Best Seller berbasis volume transaksi sukses 30 hari terakhir.

---

### Fase 3: Dine-in via QR Meja & Validasi Waiter `[ ] PENDING`
- [ ] Halaman pemesanan meja dinamis via token hash QR (`/table/{token_hash}`).
- [ ] Lifecycle sesi meja (`table_sessions`):
  - Pelanggan scan QR -> Sesi `Pending Validation`.
  - Waiter konfirmasi kehadiran di meja -> Sesi `Open`.
- [ ] Keranjang belanja meja (Cart Drawer) multi-item dengan catatan khusus kepedasan/alergi -> *Tiket `[REQ-FE-001]`*.
- [ ] Peringatan tegas sebelum order lock bahwa pesanan tidak bisa diedit setelah checkout (PRD 4.2).

---

### Fase 4: Takeaway Order & Self-Pickup `[ ] PENDING`
- [ ] Alur pemesanan Takeaway tanpa meja (`table_session_id = NULL`).
- [ ] Form kontak pengambilan (Nama & WhatsApp).
- [ ] Notifikasi kesiapan makanan untuk diambil sendiri oleh pelanggan di kasir.

---

### Fase 5: Integrasi Pembayaran Midtrans & Order Lock `[ ] PENDING`
- [ ] Integrasi Snap Midtrans (QRIS, Virtual Account Bank Transfer).
- [ ] Pencatatan pembayaran tunai (Cash) yang diverifikasi kasir.
- [ ] Webhook notification handler yang aman dan idempotent -> *Tiket `[REQ-BE-004]`*.
- [ ] Halaman pelacakan pesanan publik (`/order/{order_code}?token=...`) -> *Tiket `[REQ-FE-002]`*.
- [ ] Fitur pengajuan refund sebelum kasir mengonfirmasi pesanan (PRD 5.3).

---

### Fase 6: Sistem Reservasi Meja & Alokasi Kapasitas `[ ] PENDING`
- [ ] Backend handler submit reservasi online dari Landing Page.
- [ ] Logika pencegahan bentrok jadwal meja berdasarkan durasi reservasi (default 120 menit).
- [ ] Manajemen status reservasi oleh kasir: `Pending`, `Confirmed`, `Rejected`, `Completed`.

---

### Fase 7: Dashboard Operasional Staf `[ ] PENDING`
- [ ] **Dashboard Kasir**:
  - Centralized Order Queue (Dine-in + Takeaway).
  - Update status Preparing, Ready, dan Picked Up.
  - Verifikasi pembayaran kas & persetujuan refund.
- [ ] **Dashboard Waiter**:
  - Papan denah status meja (Available, Occupied, Cleaning).
  - Validasi meja terisi.
  - Notifikasi pesanan Ready -> Konfirmasi Served.
  - Konfirmasi meja selesai dibersihkan -> Tutup sesi meja.
- [ ] **Dashboard Admin**:
  - CRUD menu, stok, harga, dan kategori.
  - Manajemen akun staf & QR code meja.
  - Rekap penjualan & audit logs.

---

### Fase 8: Docker Compose VPS & Production Readiness `[ ] PENDING`
- [ ] Setup `Dockerfile` multi-stage build.
- [ ] Setup `docker-compose.yml` (Nginx, PHP-FPM, MySQL, Redis, Queue Worker).
- [ ] Konfigurasi Redis untuk session, cache, dan queue async webhook.
- [ ] Hardening keamanan (HTTPS, secret keys, rate limiting OTP, automated backup).
