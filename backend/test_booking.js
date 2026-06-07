const { sequelize, User, Lapangan, Pemesanan, Pembayaran } = require('./models');

async function runDiagnostics() {
  const transaction = await sequelize.transaction();
  try {
    console.log('--- Database Diagnostics started ---');
    
    // Find or create a test Penyewa
    let user = await User.findOne({ where: { role: 'Penyewa' } });
    if (!user) {
      console.log('No Penyewa found. Creating a test Penyewa...');
      user = await User.create({
        nama: 'Test Diagnostik',
        nickname: 'testdiag',
        email: 'diag@test.com',
        password: 'password123',
        role: 'Penyewa'
      }, { transaction });
    }
    console.log(`Penyewa ID: ${user.id}, Nama: ${user.nama}`);

    // Find or create a test Lapangan
    let field = await Lapangan.findOne();
    if (!field) {
      console.log('No Lapangan found. Creating a test Lapangan...');
      field = await Lapangan.create({
        namaLapangan: 'Lapangan Test',
        kategori: 'Futsal',
        hargaPerJam: 100000,
        status: 'Available'
      }, { transaction });
    }
    console.log(`Lapangan ID: ${field.id}, Nama: ${field.namaLapangan}`);

    // Create a dummy Pemesanan in Locked state
    const booking = await Pemesanan.create({
      userId: user.id,
      lapanganId: field.id,
      tanggal: '2026-06-20',
      waktuMulai: '10:00',
      waktuSelesai: '11:00',
      totalHarga: 100000,
      status: 'Locked'
    }, { transaction });
    console.log(`Pemesanan created: ID = ${booking.id}, Status = ${booking.status}, PembayaranId = ${booking.pembayaranId}`);

    // Simulate Payment Process (prosesPembayaran)
    const pembayaran = await Pembayaran.create({
      jumlahBayar: 100000,
      metodePembayaran: 'E-Wallet',
      statusBayar: 'Pending'
    }, { transaction });
    console.log(`Pembayaran created: ID = ${pembayaran.id}, Status = ${pembayaran.statusBayar}`);

    // Link booking to payment
    const [affectedRows] = await Pemesanan.update(
      { pembayaranId: pembayaran.id },
      { 
        where: { id: booking.id },
        transaction 
      }
    );
    console.log(`Linked booking to payment: Affected Rows = ${affectedRows}`);

    // Reload booking to check if pembayaranId is set
    await booking.reload({ transaction });
    console.log(`Pemesanan updated: ID = ${booking.id}, PembayaranId = ${booking.pembayaranId}`);

    // Commit this stage to simulate actual API behavior
    await transaction.commit();
    console.log('First stage committed. Starting verification simulation...');

    // Simulate Webhook / Verification stage (verifikasiTransaksi)
    const transaction2 = await sequelize.transaction();
    try {
      const pembayaranFetched = await Pembayaran.findByPk(pembayaran.id, {
        transaction: transaction2,
        lock: transaction2.LOCK.UPDATE,
        include: [{
          model: Pemesanan,
          as: 'pemesanan',
          include: [{
            model: User,
            as: 'user'
          }]
        }]
      });

      if (!pembayaranFetched) {
        throw new Error('Pembayaran not found!');
      }

      console.log(`Pembayaran fetched: ID = ${pembayaranFetched.id}`);
      const associatedBookings = pembayaranFetched.pemesanan || [];
      console.log(`Associated bookings count: ${associatedBookings.length}`);

      if (associatedBookings.length === 0) {
        console.error('ERROR: Associated bookings is EMPTY!');
      } else {
        for (const assocBooking of associatedBookings) {
          console.log(`Found booking: ID = ${assocBooking.id}, Old Status = ${assocBooking.status}`);
          assocBooking.status = 'Lunas';
          await assocBooking.save({ transaction: transaction2 });
          console.log(`Booking saved: ID = ${assocBooking.id}, New Status = ${assocBooking.status}`);
        }
      }

      pembayaranFetched.statusBayar = 'Verified';
      pembayaranFetched.tanggalPembayaran = new Date();
      pembayaranFetched.kodeBooking = `JSC-${pembayaranFetched.id}9999`;
      await pembayaranFetched.save({ transaction: transaction2 });
      console.log(`Pembayaran updated: ID = ${pembayaranFetched.id}, Status = ${pembayaranFetched.statusBayar}, KodeBooking = ${pembayaranFetched.kodeBooking}`);

      await transaction2.commit();
      console.log('Verification stage committed successfully.');

      // Final check: Reload and print results
      const finalBooking = await Pemesanan.findByPk(booking.id);
      console.log(`FINAL BOOKING IN DATABASE: ID = ${finalBooking.id}, Status = ${finalBooking.status}, CheckedIn = ${finalBooking.checkedIn}`);
      
      const finalPayment = await Pembayaran.findByPk(pembayaran.id);
      console.log(`FINAL PAYMENT IN DATABASE: ID = ${finalPayment.id}, Status = ${finalPayment.statusBayar}, KodeBooking = ${finalPayment.kodeBooking}`);
      
      // Cleanup diagnostic data
      await Pemesanan.destroy({ where: { id: booking.id } });
      await Pembayaran.destroy({ where: { id: pembayaran.id } });
      console.log('Diagnostic cleanup completed.');

    } catch (err) {
      await transaction2.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Diagnostics failed:', error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
  } finally {
    process.exit(0);
  }
}

runDiagnostics();
