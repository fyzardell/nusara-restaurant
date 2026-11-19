# Permintaan Fitur ke Frontend (Frontend Requests)

File ini digunakan untuk mendaftarkan tugas perancangan antarmuka, pembuatan halaman, komponen interaktif, atau integrasi props baru di sisi **Frontend (React + Tailwind CSS)**.

---

## Template Pengajuan Tiket Frontend (Copy & Paste ke Bawah)

```markdown
### [REQ-FE-XXX] <Judul Singkat Tugas UI / Frontend>
- **Tanggal Diajukan**: YYYY-MM-DD
- **Prioritas**: High / Medium / Low
- **Status**: [ ] PENDING
- **Diminta Oleh**: Backend / UX
- **Target File / Halaman**: `resources/js/Pages/...` atau `Components/...`
- **Deskripsi Kebutuhan**: Jelaskan komponen atau tampilan apa yang perlu dibuat / diubah.
- **Elemen UI yang Harus Ada**:
  - [ ] Input / Selector X
  - [ ] State loading saat submit
  - [ ] Notifikasi error / success
- **Panduan Desain (Brand Identity)**: Warna, font, responsive breakpoint.
```

---

## Daftar Permintaan Frontend (Aktif & Terjadwal)

### [REQ-FE-001] Keranjang Belanja Mengambang (Cart Drawer) & Peringatan Order Lock
- **Tanggal Diajukan**: 2026-11-19
- **Prioritas**: High
- **Status**: [ ] PENDING
- **Diminta Oleh**: UX / PRD Alur Pesanan
- **Target File**: `resources/js/Components/CartDrawer.tsx`
- **Deskripsi Kebutuhan**:
  - Drawer slide-out dari kanan yang menampilkan item pesanan yang dipilih.
  - Per item menampilkan: foto kecil, nama, kuantitas (+/-), catatan khusus (misal kepedasan), subtotal.
  - Menghitung subtotal otomatis, pajak PB1 11%, dan total pembayaran.
  - **Aturan Tegas PRD Section 4.2**: Sebelum menekan tombol bayar, tampilkan peringatan konfirmasi tegas bahwa pesanan tidak dapat diubah setelah dikirim/dibayar.
- **Elemen UI**:
  - Badge floating counter di kanan bawah layar.
  - Form catatan per item & catatan umum pesanan.
  - Modal dialog konfirmasi final sebelum dialihkan ke payment gateway.

---

### [REQ-FE-002] Halaman Pelacakan Pesanan Pelanggan (Customer Order Tracking)
- **Tanggal Diajukan**: 2026-11-19
- **Prioritas**: High
- **Status**: [ ] PENDING
- **Target File**: `resources/js/Pages/Customer/OrderTracking.tsx`
- **Deskripsi Kebutuhan**:
  - Halaman publik untuk melacak status pesanan secara real-time via URL token (tanpa harus login).
  - Menampilkan stepper progress status pesanan:
    - `Menunggu Pembayaran` -> `Menunggu Konfirmasi Kasir` -> `Dapur Memasak (Preparing)` -> `Siap Saji/Siap Ambil (Ready)` -> `Disajikan (Served)` / `Diambil (Picked Up)`.
  - Rincian item yang dipesan, estimasi waktu, serta instruksi pengambilan bagi Takeaway.

---

### [REQ-FE-003] Dashboard Antrean Kasir (Cashier Centralized Order Queue)
- **Tanggal Diajukan**: 2026-11-19
- **Prioritas**: High
- **Status**: [ ] PENDING
- **Target File**: `resources/js/Pages/Cashier/OrderQueue.tsx`
- **Deskripsi Kebutuhan**:
  - Antrean pesanan terpusat untuk pesanan Dine-in dan Takeaway (PRD Section 8.1).
  - Aksi kasir: Verifikasi pembayaran tunai, Konfirmasi order masuk, Ubah status Preparing/Ready, Konfirmasi Picked Up untuk pesanan takeaway.
  - Font dashboard: `Manrope` (kontras tinggi, tombol aksi cepat, kartu terorganisir per status).

---

### [REQ-FE-004] Antarmuka Layar Waiter (Waiter Table & Service Board)
- **Tanggal Diajukan**: 2026-11-19
- **Prioritas**: Medium
- **Status**: [ ] PENDING
- **Target File**: `resources/js/Pages/Waiter/Dashboard.tsx`
- **Deskripsi Kebutuhan**:
  - Grid denah/status Meja 01 s/d Meja 08 (Available, Pending Validation, Occupied, Cleaning).
  - Tombol 1-klik untuk konfirmasi meja benar-benar ditempati pelanggan (validasi QR).
  - Tab pesanan Dine-in berstatus `Ready` dari dapur, dengan tombol konfirmasi `Served` setelah diantar ke meja.
  - Tombol tandai meja `Cleaning` dan konfirmasi kembali `Available` setelah meja dibersihkan.
