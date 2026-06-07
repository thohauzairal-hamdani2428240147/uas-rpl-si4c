# Akun Demo JSC Arena Booking

Berikut adalah daftar akun demo untuk uji coba sistem **JSC Arena Booking** (Rekayasa Perangkat Lunak):

| Peran (Role) | Nickname / Username | Email | Password | Hak Akses / Kegunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `adminjsc` | `admin@jsc.com` | `adminpassword` | Dashboard pendapatan, grid ketersediaan jadwal operasional, kelola (CRUD) data lapangan, dan kelola (CRUD) akun staf kasir. |
| **Staff / Kasir** | `kasirjsc` | `kasir@jsc.com` | `kasirpassword` | Melihat grid jadwal operasional lapangan, memindai QR Code E-Ticket pelanggan (via kamera/webcam), dan memverifikasi status check-in masuk lapangan. |
| **Penyewa (User 1)** | `ahmad123` | `ahmad@demo.com` | `password123` | Memesan lapangan olahraga, melakukan simulasi pembayaran sukses (Verified), mengumpulkan poin loyalitas, serta melihat & mencetak E-Tiket QR Code. |
| **Penyewa (User 2)** | `budi456` | `budi@demo.com` | `password123` | Akun penyewa alternatif untuk melakukan simulasi transaksi ganda. |

---

### Cara Melakukan Reset Database & Seeding Ulang
Jika data akun demo di atas belum terdaftar di database lokal Anda:
1. Buka browser Anda.
2. Akses alamat endpoint seeder berikut:
   **`http://localhost:5000/api/auth/seed`**
3. Tunggu hingga muncul pesan `"status": "success"` yang menandakan database berhasil dikosongkan dan di-seed ulang dengan data pengujian di atas.
