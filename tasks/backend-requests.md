# Permintaan Fitur ke Backend (Backend Requests)

File ini digunakan oleh **Frontend** (atau perancang sistem) untuk mendaftarkan kebutuhan endpoint, query database, controller, atau props baru ke tim **Backend**.

---

## Template Pengajuan Tiket Baru (Copy & Paste ke Bawah)

```markdown
### [REQ-BE-XXX] <Judul Singkat Kebutuhan>
- **Tanggal Diajukan**: YYYY-MM-DD
- **Prioritas**: High / Medium / Low
- **Status**: [ ] PENDING
- **Diminta Oleh**: Frontend
- **Halaman / Komponen Pemanggil**: `resources/js/Pages/...` atau `Components/...`
- **Tujuan / Masalah**: Jelaskan mengapa fitur ini dibutuhkan di UI.
- **Kontrak Data (Input -> Output)**:
  - **HTTP Method & Route**: `POST /order/checkout`
  - **Input Payload**:
    ```json
    {
      "key": "value"
    }
    ```
  - **Output / Response yang Diharapkan**:
    ```json
    {
      "success": true,
      "data": {}
    }
    ```
- **Aturan Bisnis (PRD / ERD)**: Catatan validasi, locking stok, dsb.
```

---

## Daftar Permintaan Backend (Aktif & Terjadwal)

### [REQ-BE-001] Endpoint Simpan & Hapus Menu Favorit (Toggle Favorite)
- **Tanggal Diajukan**: 2026-11-19
- **Prioritas**: High
- **Status**: [ ] PENDING
- **Diminta Oleh**: Frontend (`MenuCard.tsx`, `LandingPage.tsx`)
- **Tujuan**: Memungkinkan user yang sudah login untuk menyimpan atau membatalkan menu favorit ke tabel database `favorites`.
- **Kontrak Data**:
  - **Method & Route**: `POST /favorites/toggle`
  - **Payload**:
    ```json
    {
      "menu_id": 1
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "is_favorited": true,
      "message": "Menu berhasil ditambahkan ke favorit Anda."
    }
    ```
- **Aturan Bisnis**:
  - Wajib cek `Auth::check()`. Jika belum login, return 401 / redirect ke login.
  - Sesuai ERD, ada unique constraint `unique(user_id, menu_id)`.

---

### [REQ-BE-002] Validasi QR Meja & Pembuatan Table Session (Dine-in)
- **Tanggal Diajukan**: 2026-11-19
- **Prioritas**: High
- **Status**: [ ] PENDING
- **Diminta Oleh**: Frontend (`OrderTypeModal.tsx`, Halaman Pemesanan Meja)
- **Tujuan**: Saat pelanggan scan QR di meja, backend memvalidasi token QR dan membuat atau mengambil sesi meja aktif.
- **Kontrak Data**:
  - **Method & Route**: `GET /table/{token_hash}`
  - **Response Props (Inertia)**:
    ```json
    {
      "table": {
        "id": 1,
        "table_number": "Meja 03",
        "capacity": 4,
        "status": "Occupied"
      },
      "session": {
        "id": 10,
        "session_code": "SES-03-9821",
        "status": "Open"
      }
    }
    ```
- **Aturan Bisnis**: Sesuai PRD 4.1 & 6.1, jika belum ada sesi, buat sesi `Pending Validation`. Begitu waiter mengonfirmasi, status menjadi `Open`.

---

### [REQ-BE-003] Controller Checkout Pemesanan (Dine-in & Takeaway)
- **Tanggal Diajukan**: 2026-11-19
- **Prioritas**: Critical
- **Status**: [ ] PENDING
- **Diminta Oleh**: Frontend (`CartDrawer.tsx` / `CheckoutPage.tsx`)
- **Tujuan**: Menyimpan order baru ke tabel `orders` dan `order_items` serta melakukan snapshot nama dan harga menu.
- **Kontrak Data**:
  - **Method & Route**: `POST /checkout`
  - **Payload**:
    ```json
    {
      "order_type": "dine_in",
      "table_session_id": 10,
      "customer_notes": "Tanpa daun ketumbar",
      "items": [
        { "menu_id": 1, "quantity": 2, "item_notes": "Pedas sedang" },
        { "menu_id": 7, "quantity": 1, "item_notes": "Es dipisah" }
      ]
    }
    ```
  - **Response**:
    ```json
    {
      "order_code": "ORD-20261119-0012",
      "access_token": "a1b2c3d4...",
      "subtotal": 555000,
      "tax": 61050,
      "total": 616050,
      "payment_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
    }
    ```
- **Aturan Bisnis**:
  - Validasi stok di server (PRD Section 9). Tolak checkout jika stok habis.
  - Lakukan DB Transaction agar konsisten.
  - Snapshot nama dan harga menu ke `order_items` agar histori tidak berubah jika menu diupdate di masa depan (PRD Section 13.3).

---

### [REQ-BE-004] Webhook Handler Midtrans Payment
- **Tanggal Diajukan**: 2026-11-19
- **Prioritas**: Critical
- **Status**: [ ] PENDING
- **Diminta Oleh**: Sistem Pembayaran
- **Tujuan**: Menerima notifikasi status pembayaran dari Midtrans (settlement, expire, cancel).
- **Aturan Bisnis**:
  - Validasi Signature Key SHA512.
  - Proses secara Idempotent (jangan gandakan order/payment jika webhook terkirim 2x).
  - Update status tabel `payments` dan transisikan status `orders` ke `Paid / Waiting Confirmation`.
