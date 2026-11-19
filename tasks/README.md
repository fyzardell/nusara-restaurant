# Sistem Manajemen Task & Kolaborasi NUSARA

Dokumen ini menjadi panduan kerja terpadu antara **Frontend**, **Backend**, dan pengembang (manusia maupun AI assistant) agar pengembangan fitur berjalan selaras tanpa ada kebutuhan data atau antarmuka yang terlewat.

---

## 1. Pembagian Wilayah Kerja

| Area | Direktori Proyek | Tanggung Jawab Utama |
|---|---|---|
| **Backend** | `app/`, `routes/`, `database/` | Database migrations, Eloquent models, validation request, authorization, business logic, integrasi pembayaran & webhook |
| **Frontend** | `resources/js/`, `resources/css/` | Komponen React, Inertia pages, styling Tailwind CSS, state management, form interaktif |
| **Bridge** | `app/Http/Middleware/HandleInertiaRequests.php` | Pengiriman data props bersama (auth, role, flash, settings) dari backend ke frontend |

---

## 2. Struktur File di Folder `tasks/`

1. [`backend-requests.md`](file:///c:/laragon/www/nusara/tasks/backend-requests.md)
   - Tempat **Frontend** mengajukan permintaan ke **Backend** saat membutuhkan controller, props baru, endpoint API, kolom database, atau logika validasi.
2. [`frontend-requests.md`](file:///c:/laragon/www/nusara/tasks/frontend-requests.md)
   - Tempat **Backend** atau desainer mencatat kebutuhan tampilan UI, form input, modal, atau penyesuaian komponen frontend.
3. [`roadmap.md`](file:///c:/laragon/www/nusara/tasks/roadmap.md)
   - Master checklist fitur MVP berdasarkan **PRD & ERD v3.0** untuk melacak progres keseluruhan proyek.

---

## 3. Konvensi Status Task

Gunakan label status berikut pada setiap nomor tiket task:
- `[ ] PENDING` : Belum dikerjakan / menunggu giliran.
- `[/] IN_PROGRESS` : Sedang aktif dikerjakan.
- `[x] COMPLETED` : Sudah selesai diimplementasikan dan diuji.
- `[!] BLOCKED` : Terhalang kebutuhan lain (tuliskan alasannya).

---

## 4. Alur Kerja (Workflow) Permintaan Fitur

```mermaid
flowchart LR
    A[Frontend butuh data / aksi baru] --> B[Catat di tasks/backend-requests.md]
    B --> C[Sertakan format Kontrak Data]
    C --> D[Backend mengimplementasikan Controller / Service]
    D --> E[Tandai status [x] COMPLETED]
    E --> F[Frontend mengonsumsi data via Inertia Props]
```

1. **Identifikasi Kebutuhan**: Saat membangun komponen UI (misalnya keranjang belanja), frontend menyadari belum ada endpoint untuk menyimpan checkout.
2. **Buat Tiket Request**: Tambahkan entri baru di `tasks/backend-requests.md` dengan nomor urut (`REQ-BE-XXX`).
3. **Tuliskan Kontrak Data**: Wajib menuliskan input yang dikirim dan response/props yang diharapkan (lihat template di dalam file).
4. **Eksekusi**: Backend (atau agen AI) membaca tiket tersebut dan langsung mengimplementasikannya sesuai spesifikasi kontrak.
