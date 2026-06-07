const { Pembayaran, Pemesanan, Lapangan, User } = require('../models');

const StaffController = {
  /**
   * 1. Get Booking Details by Booking Code (Scan QR Result)
   * GET /api/staff/booking/:kodeBooking
   */
  async getBookingDetails(req, res) {
    try {
      const { kodeBooking } = req.params;

      if (!kodeBooking) {
        return res.status(400).json({
          status: 'error',
          message: 'Kode booking wajib disertakan.'
        });
      }

      const pembayaran = await Pembayaran.findOne({
        where: { kodeBooking },
        include: [{
          model: Pemesanan,
          as: 'pemesanan',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'nama', 'nickname', 'email']
          }, {
            model: Lapangan,
            as: 'lapangan',
            attributes: ['id', 'namaLapangan', 'kategori', 'hargaPerJam']
          }]
        }]
      });

      if (!pembayaran) {
        return res.status(404).json({
          status: 'error',
          message: 'Tiket/Booking dengan kode tersebut tidak ditemukan.'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: pembayaran
      });

    } catch (error) {
      console.error('Error in getBookingDetails:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memuat detail booking.',
        error: error.message
      });
    }
  },

  /**
   * 2. Process Check-in (Mark all bookings under kodeBooking as checkedIn = true)
   * POST /api/staff/booking/checkin
   */
  async processCheckIn(req, res) {
    try {
      const { kodeBooking } = req.body;

      if (!kodeBooking) {
        return res.status(400).json({
          status: 'error',
          message: 'Kode booking wajib disertakan.'
        });
      }

      const pembayaran = await Pembayaran.findOne({
        where: { kodeBooking },
        include: [{
          model: Pemesanan,
          as: 'pemesanan'
        }]
      });

      if (!pembayaran) {
        return res.status(404).json({
          status: 'error',
          message: 'Transaksi pembayaran tidak ditemukan.'
        });
      }

      const bookings = pembayaran.pemesanan || [];
      if (bookings.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Tidak ada slot pemesanan yang terkait dengan tiket ini.'
        });
      }

      // Check if already checked in
      const alreadyCheckedIn = bookings.every(b => b.checkedIn);
      if (alreadyCheckedIn) {
        return res.status(400).json({
          status: 'error',
          message: 'Tiket ini sudah pernah di-checkin sebelumnya.'
        });
      }

      // Mark all as checkedIn
      for (const booking of bookings) {
        booking.checkedIn = true;
        await booking.save();
      }

      return res.status(200).json({
        status: 'success',
        message: 'Check-in berhasil! Selamat bermain.'
      });

    } catch (error) {
      console.error('Error in processCheckIn:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memproses check-in tiket.',
        error: error.message
      });
    }
  }
};

module.exports = StaffController;
