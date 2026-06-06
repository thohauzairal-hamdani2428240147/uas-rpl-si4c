# Spesifikasi Pengembangan Sistem Pemesanan Lapangan JSC (Arsitektur Terintegrasi MCP)

## 1. Lingkungan & Infrastruktur Proyek
* **Nama Folder Direktori:** `JSC`
* **Nama Basis Data (MySQL):** `demojsc`
* **Metode Pemetaan Antarmuka:** Integrasi Desain Google Stitch menggunakan Model Context Protocol (MCP) untuk sinkronisasi otomatis komponen UI ke dalam presentasi komponen React.js.

## 2. Arsitektur Sistem (3-Tier Architecture)
* **Presentation Tier (Frontend):** React.js dengan UI Component yang disinkronkan dari Google Stitch via MCP, diperkuat dengan tata letak responsif menggunakan Bootstrap.
* **Application Tier (Backend Logika):** Node.js menggunakan framework Express.js dengan pola MVC (Model-View-Controller) / Controller-Repository Layer.
* **Data Access Tier (Database):** MySQL berbasis Sequelize ORM untuk mengelola persistensi data secara transaksional pada database `demojsc`.

## 3. Skema Relasi Tabel (Sequelize Models)
Sistem memetakan entitas transaksional dengan integritas data yang ketat untuk mengeliminasi bentrok jadwal (*double booking*):
* **User:** Superclass yang membedakan hak akses berdasarkan *role* (`Penyewa` dengan akumulasi poin loyalitas, dan `Admin`).
* **Lapangan:** Superclass polimorfik atau berpemetaan kategori untuk `Lapangan Futsal`, `Lapangan Basket`, dan `Lapangan Badminton`.
* **Pemesanan:** Entitas agregasi utama yang menghubungkan relasi `User`, `Lapangan`, dan entitas `Pembayaran`.
* **Pembayaran:** Entitas pencatatan status kliring finansial yang terhubung secara logis dengan pemesanan.

## 4. Logika Bisnis & API Akses Utama
* `AuthenticateUser`: Penanganan otentikasi akun, pembuatan token sesi (JWT), dan pengecekan otorisasi peran (*role-based access control*).
* `CheckAvailability`: Metode evaluasi *real-time* sebelum komit data untuk memastikan slot waktu pada lapangan dan tanggal tertentu dalam database `demojsc` tidak tumpang tindih (*false* jika sudah terisi).
* `CreateBooking`: Proses penulisan transaksional terisolasi untuk mengunci jadwal lapangan dan menerbitkan ID Pembayaran.
* `VerifyPayment`: Sinkronisasi status pembayaran untuk mengubah status pesanan menjadi final dan memperbarui akumulasi poin loyalitas penyewa.
* `CancelBooking`: Pembatalan pemesanan yang mengubah status ketersediaan lapangan kembali menjadi kosong (*available*).
* `GenerateReport`: Agregasi data finansial untuk menyajikan grafik pendapatan dan tingkat okupansi lapangan pada dasbor Admin.
