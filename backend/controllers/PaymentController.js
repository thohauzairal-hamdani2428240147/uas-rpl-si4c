const { Op } = require('sequelize');
const { sequelize, Pembayaran, Pemesanan, User } = require('../models');

const PaymentController = {
  /**
   * 1. Proses Pembayaran (Initiate Payment)
   * POST /api/payments/process
   */
  async prosesPembayaran(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { pemesananIds, jumlahBayar, metodePembayaran } = req.body;

      if (!pemesananIds || !Array.isArray(pemesananIds) || pemesananIds.length === 0 || !jumlahBayar || !metodePembayaran) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Data tidak lengkap. Pastikan pemesananIds (array), jumlahBayar, dan metodePembayaran terisi.'
        });
      }

      // Check if bookings exist
      const bookings = await Pemesanan.findAll({
        where: {
          id: { [Op.in]: pemesananIds }
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (bookings.length !== pemesananIds.length) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Beberapa data pemesanan tidak ditemukan.'
        });
      }

      // Check if any booking is cancelled
      for (const booking of bookings) {
        if (booking.status === 'Cancelled') {
          await transaction.rollback();
          return res.status(400).json({
            status: 'error',
            message: `Pemesanan dengan ID ${booking.id} sudah dibatalkan.`
          });
        }
      }

      // Create a pending Payment record
      const pembayaran = await Pembayaran.create({
        jumlahBayar,
        metodePembayaran,
        statusBayar: 'Pending'
      }, { transaction });

      // Update bookings with paymentId
      await Pemesanan.update(
        { pembayaranId: pembayaran.id },
        { 
          where: { id: { [Op.in]: pemesananIds } },
          transaction 
        }
      );

      await transaction.commit();

      // Return a simulated response with a mockup checkout url
      return res.status(201).json({
        status: 'success',
        message: 'Transaksi pembayaran berhasil diinisiasi.',
        data: {
          pembayaranId: pembayaran.id,
          pemesananIds: pemesananIds,
          jumlahBayar: pembayaran.jumlahBayar,
          metodePembayaran: pembayaran.metodePembayaran,
          statusBayar: pembayaran.statusBayar,
          checkoutUrl: `http://localhost:5000/api/payments/checkout-mock/${pembayaran.id}`
        }
      });
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error('Error in prosesPembayaran:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal menginisiasi pembayaran.',
        error: error.message
      });
    }
  },

  /**
   * 2. Verifikasi Transaksi (Webhook / Simulation Callback)
   * POST /api/payments/verify
   */
  async verifikasiTransaksi(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { pembayaranId, statusBayar } = req.body;

      if (!pembayaranId || !statusBayar) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Data tidak lengkap. Harap masukkan pembayaranId dan statusBayar.'
        });
      }

      if (!['Verified', 'Failed'].includes(statusBayar)) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Status pembayaran tidak valid. Hanya menerima Verified atau Failed.'
        });
      }

      // Fetch payment details and lock the row
      const pembayaran = await Pembayaran.findByPk(pembayaranId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
        include: [{
          model: Pemesanan,
          as: 'pemesanan',
          include: [{
            model: User,
            as: 'user'
          }]
        }]
      });

      if (!pembayaran) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Data pembayaran tidak ditemukan.'
        });
      }

      if (pembayaran.statusBayar !== 'Pending') {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Transaksi ini sudah diproses sebelumnya dengan status: ${pembayaran.statusBayar}.`
        });
      }

      if (statusBayar === 'Verified') {
        // 1. Update Pembayaran
        pembayaran.statusBayar = 'Verified';
        pembayaran.tanggalPembayaran = new Date();
        // Generate E-Ticket Booking Code
        const generatedCode = `JSC-${pembayaran.id}${Math.floor(1000 + Math.random() * 9000)}`;
        pembayaran.kodeBooking = generatedCode;
        await pembayaran.save({ transaction });

        // 2. Update all associated bookings to Lunas
        const bookings = pembayaran.pemesanan || [];
        if (bookings.length > 0) {
          for (const booking of bookings) {
            booking.status = 'Lunas';
            await booking.save({ transaction });
          }

          // 3. Loyalty Points System: 10% of transaction totalHarga sum
          const user = bookings[0]?.user;
          if (user && user.role === 'Penyewa') {
            let totalBookingPrice = 0;
            for (const booking of bookings) {
              totalBookingPrice += parseFloat(booking.totalHarga);
            }
            const addedPoints = Math.floor(totalBookingPrice * 0.10);
            user.poinLoyalitas = user.poinLoyalitas + addedPoints;
            await user.save({ transaction });

            console.log(`Loyalty Points updated for User ${user.id}: +${addedPoints} points. Total points: ${user.poinLoyalitas}`);
          }
        }
      } else {
        // Payment Failed
        pembayaran.statusBayar = 'Failed';
        await pembayaran.save({ transaction });

        const bookings = pembayaran.pemesanan || [];
        for (const booking of bookings) {
          booking.status = 'Cancelled';
          await booking.save({ transaction });
        }
      }

      // Commit transaction
      await transaction.commit();

      const hasBookings = pembayaran.pemesanan && pembayaran.pemesanan.length > 0;
      return res.status(200).json({
        status: 'success',
        message: statusBayar === 'Verified' 
          ? 'Pembayaran berhasil diverifikasi. Pesanan Lunas dan Poin Loyalitas diperbarui.' 
          : 'Pembayaran gagal. Pesanan telah dibatalkan.',
        data: {
          pembayaranId: pembayaran.id,
          statusBayar: pembayaran.statusBayar,
          bookingStatus: hasBookings ? pembayaran.pemesanan[0].status : null,
          poinLoyalitas: (hasBookings && pembayaran.pemesanan[0].user) ? pembayaran.pemesanan[0].user.poinLoyalitas : null
        }
      });
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error('Error in verifikasiTransaksi:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memverifikasi transaksi.',
        error: error.message
      });
    }
  }
};

module.exports = PaymentController;
