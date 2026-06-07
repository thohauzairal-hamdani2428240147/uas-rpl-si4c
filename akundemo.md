# Akun Demo JSC Arena Booking

Berikut adalah daftar akun demo untuk uji coba sistem **JSC Arena Booking** (Rekayasa Perangkat Lunak):

| Peran (Role) | Nama Lengkap | Nickname / Username | Email | Password | Hak Akses / Kegunaan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `Admin JSC` | `adminjsc` | `admin@test.com` | `adminjsc123` | Dashboard pendapatan, grid ketersediaan jadwal operasional, kelola (CRUD) data lapangan, dan kelola (CRUD) akun staf kasir. |
| **Staff / Kasir 1** | `Staff 1 JSC` | `staff1jsc` | `staf1@test.com` | `staff1jsc123` | Melihat grid jadwal operasional lapangan, memindai QR Code E-Ticket pelanggan (via kamera/webcam), dan memverifikasi status check-in masuk lapangan. |
| **Staff / Kasir 2** | `Staff 2 JSC` | `staff2jsc` | `staf2@test.com` | `staff2jsc123` | Kegunaan sama seperti Staff 1 untuk pengujian multi-kasir. |
| **Penyewa (User 1)** | `User 1 JSC` | `user1` | `user1@test.com` | `user1123` | Memesan lapangan olahraga, melakukan simulasi pembayaran sukses (Verified), mengumpulkan poin loyalitas, serta melihat & mencetak E-Tiket QR Code. |
| **Penyewa (User 2)** | `User 2 JSC` | `user2` | `user2@test.com` | `user2123` | Akun penyewa kedua untuk pengujian transaksi dan pemesanan ganda. |

---

### Cara Melakukan Reset Database & Seeding Ulang
Jika data akun demo di atas belum terdaftar di database lokal Anda:
1. Buka browser Anda.
2. Akses alamat endpoint seeder berikut:
   **`http://localhost:5000/api/auth/seed`**
3. Tunggu hingga muncul pesan `"status": "success"` yang menandakan database berhasil dikosongkan dan di-seed ulang dengan data pengujian di atas.
