# Akun Demo JSC SportPass Booking

Berikut adalah daftar akun demo untuk uji coba sistem **JSC SportPass Booking** (Rekayasa Perangkat Lunak):

1. **Akun Admin**
   - Nama Lengkap: `Admin JSC`
   - Nickname/Username: `adminjsc`
   - Email: `admin@test.com`
   - Password: `adminjsc123`
   - Hak Akses/Kegunaan: Dashboard pendapatan, grid ketersediaan jadwal operasional, kelola (CRUD) data lapangan, dan kelola (CRUD) akun staf kasir.

2. **Akun Staff / Kasir 1**
   - Nama Lengkap: `Staff 1 JSC`
   - Nickname/Username: `staff1jsc`
   - Email: `staf1@test.com`
   - Password: `staff1jsc123`
   - Hak Akses/Kegunaan: Melihat grid jadwal operasional lapangan, memindai QR Code E-Ticket pelanggan (via kamera/webcam), dan memverifikasi status check-in masuk lapangan.

3. **Akun Staff / Kasir 2**
   - Nama Lengkap: `Staff 2 JSC`
   - Nickname/Username: `staff2jsc`
   - Email: `staf2@test.com`
   - Password: `staff2jsc123`
   - Hak Akses/Kegunaan: Kegunaan sama seperti Staff 1 untuk pengujian multi-kasir.

4. **Akun Penyewa (User 1)**
   - Nama Lengkap: `User 1 JSC`
   - Nickname/Username: `user1`
   - Email: `user1@test.com`
   - Password: `user1123`
   - Hak Akses/Kegunaan: Memesan lapangan olahraga, melakukan simulasi pembayaran sukses (Verified), mengumpulkan poin loyalitas, serta melihat & mencetak E-Tiket QR Code.

5. **Akun Penyewa (User 2)**
   - Nama Lengkap: `User 2 JSC`
   - Nickname/Username: `user2`
   - Email: `user2@test.com`
   - Password: `user2123`
   - Hak Akses/Kegunaan: Akun penyewa kedua untuk pengujian transaksi dan pemesanan ganda.

---

### Cara Melakukan Reset Database & Seeding Ulang
Jika data akun demo di atas belum terdaftar di database lokal Anda:
1. Buka browser Anda.
2. Akses alamat endpoint seeder berikut:
   **`http://localhost:5000/api/auth/seed`**
3. Tunggu hingga muncul pesan `"status": "success"` yang menandakan database berhasil dikosongkan dan di-seed ulang dengan data pengujian di atas.
