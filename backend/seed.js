require('dotenv').config();
const { sequelize, User, Lapangan, Pemesanan, Pembayaran } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Sync database (recreates tables)
    await sequelize.sync({ force: true });
    console.log('Database tables cleared and synchronized.');

    // 1. Create Demo Users (2 Penyewa, 1 Admin)
    const penyewa1 = await User.create({
      nama: 'Ahmad Penyewa',
      nickname: 'ahmad123',
      email: 'ahmad@demo.com',
      password: 'password123',
      role: 'Penyewa',
      poinLoyalitas: 10
    });

    const penyewa2 = await User.create({
      nama: 'Budi Penyewa',
      nickname: 'budi456',
      email: 'budi@demo.com',
      password: 'password123',
      role: 'Penyewa',
      poinLoyalitas: 0
    });

    const admin = await User.create({
      nama: 'JSC Admin',
      nickname: 'adminjsc',
      email: 'admin@jsc.com',
      password: 'adminpassword',
      role: 'Admin'
    });

    const staff = await User.create({
      nama: 'JSC Staf Kasir',
      nickname: 'kasirjsc',
      email: 'kasir@jsc.com',
      password: 'kasirpassword',
      role: 'Staff'
    });

    console.log('Demo Users created:');
    console.log(`- Penyewa 1: Nickname = "${penyewa1.nickname}", Password = "password123" (${penyewa1.email})`);
    console.log(`- Penyewa 2: Nickname = "${penyewa2.nickname}", Password = "password123" (${penyewa2.email})`);
    console.log(`- Admin: Nickname = "${admin.nickname}", Password = "adminpassword" (${admin.email})`);
    console.log(`- Staff: Nickname = "${staff.nickname}", Password = "kasirpassword" (${staff.email})`);

    // 2. Create Demo Lapangan
    const futsal = await Lapangan.create({
      namaLapangan: 'JSC Futsal Arena A',
      kategori: 'Futsal',
      hargaPerJam: 150000,
      status: 'Available'
    });

    const basket = await Lapangan.create({
      namaLapangan: 'JSC Basketball Hall B',
      kategori: 'Basket',
      hargaPerJam: 200000,
      status: 'Available'
    });

    const badminton = await Lapangan.create({
      namaLapangan: 'JSC Badminton Court 1',
      kategori: 'Badminton',
      hargaPerJam: 80000,
      status: 'Available'
    });

    console.log('\nDemo Lapangan created:');
    console.log(`- Lapangan Futsal ID: ${futsal.id} (${futsal.namaLapangan})`);
    console.log(`- Lapangan Basket ID: ${basket.id} (${basket.namaLapangan})`);
    console.log(`- Lapangan Badminton ID: ${badminton.id} (${badminton.namaLapangan})`);

    // 3. Seed some dummy bookings and payments for testing admin reports
    // Booking 1: Futsal (Lunas)
    const pembayaran1 = await Pembayaran.create({
      jumlahBayar: 300000,
      metodePembayaran: 'E-Wallet',
      statusBayar: 'Verified',
      tanggalPembayaran: new Date(),
      kodeBooking: 'JSC-DUMMY1'
    });

    const booking1 = await Pemesanan.create({
      userId: penyewa1.id,
      lapanganId: futsal.id,
      tanggal: '2026-06-10',
      waktuMulai: '08:00',
      waktuSelesai: '10:00',
      totalHarga: 300000, // 2 hours
      status: 'Lunas',
      pembayaranId: pembayaran1.id,
      checkedIn: false
    });

    // Booking 2: Basket (Pending)
    const pembayaran2 = await Pembayaran.create({
      jumlahBayar: 200000,
      metodePembayaran: 'Transfer Bank',
      statusBayar: 'Pending',
      kodeBooking: 'JSC-DUMMY2'
    });

    const booking2 = await Pemesanan.create({
      userId: penyewa2.id,
      lapanganId: basket.id,
      tanggal: '2026-06-11',
      waktuMulai: '15:00',
      waktuSelesai: '16:00',
      totalHarga: 200000, // 1 hour
      status: 'Pending',
      pembayaranId: pembayaran2.id,
      checkedIn: false
    });

    console.log('\nDummy bookings and payments seeded for verification testing.');

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
