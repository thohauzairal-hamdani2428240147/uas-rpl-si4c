const { Op } = require('sequelize');
const { sequelize, Pemesanan, Lapangan, User } = require('../models');

// Helper to calculate duration in hours between two time strings (HH:MM or HH:MM:SS)
function calculateDurationInHours(startTimeStr, endTimeStr) {
  const [startHour, startMin] = startTimeStr.split(':').map(Number);
  const [endHour, endMin] = endTimeStr.split(':').map(Number);
  
  const startMinutes = startHour * 60 + (startMin || 0);
  const endMinutes = endHour * 60 + (endMin || 0);
  
  const diffMinutes = endMinutes - startMinutes;
  if (diffMinutes <= 0) {
    throw new Error('Waktu selesai harus lebih lambat dibanding waktu mulai.');
  }
  return diffMinutes / 60;
}

const BookingController = {
  /**
   * 1. Cek Ketersediaan Lapangan (Check Availability)
   * GET /api/bookings/check
   */
  async checkAvailability(req, res) {
    try {
      const { lapanganId, tanggal, waktuMulai, waktuSelesai } = req.query;

      if (!lapanganId || !tanggal || !waktuMulai || !waktuSelesai) {
        return res.status(400).json({
          status: 'error',
          message: 'Parameter tidak lengkap. Harap sertakan lapanganId, tanggal, waktuMulai, dan waktuSelesai.'
        });
      }

      // Check for overlapping bookings
      const overlapping = await Pemesanan.findOne({
        where: {
          lapanganId,
          tanggal,
          status: {
            [Op.in]: ['Pending', 'Booked', 'Locked', 'Lunas']
          },
          [Op.and]: [
            { waktuMulai: { [Op.lt]: waktuSelesai } },
            { waktuSelesai: { [Op.gt]: waktuMulai } }
          ]
        }
      });

      const isAvailable = !overlapping;

      return res.status(200).json({
        status: 'success',
        available: isAvailable,
        message: isAvailable 
          ? 'Lapangan tersedia untuk dipesan pada jadwal tersebut.' 
          : 'Lapangan sudah dipesan atau sedang diproses pada jadwal tersebut.'
      });
    } catch (error) {
      console.error('Error in checkAvailability:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server saat mengecek ketersediaan.',
        error: error.message
      });
    }
  },

  /**
   * 2. Buat Pemesanan (Create Booking) - Transaksional & Anti-Double-Booking
   * POST /api/bookings
   */
  async createBooking(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { lapanganId, tanggal, slots } = req.body;
      const userId = req.user ? req.user.id : req.body.userId;

      if (!userId || !lapanganId || !tanggal || !slots || !Array.isArray(slots) || slots.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Data tidak lengkap atau format slots salah. Pastikan userId, lapanganId, tanggal, dan slots terisi.'
        });
      }

      // Validate user
      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'User tidak ditemukan.'
        });
      }

      // Validate field & get hourly rate
      const lapangan = await Lapangan.findByPk(lapanganId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!lapangan) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Lapangan tidak ditemukan.'
        });
      }

      if (lapangan.status === 'Maintenance') {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Lapangan sedang dalam perbaikan (Maintenance) dan tidak bisa dipesan.'
        });
      }

      const createdBookings = [];

      // Validate and create booking for each slot
      for (const slot of slots) {
        const waktuMulai = slot.waktuMulai || slot.start;
        const waktuSelesai = slot.waktuSelesai || slot.end;

        if (!waktuMulai || !waktuSelesai) {
          await transaction.rollback();
          return res.status(400).json({
            status: 'error',
            message: 'Setiap slot waktu harus memiliki waktuMulai dan waktuSelesai.'
          });
        }

        // Calculate duration and validate time range
        let durationHours;
        try {
          durationHours = calculateDurationInHours(waktuMulai, waktuSelesai);
        } catch (err) {
          await transaction.rollback();
          return res.status(400).json({
            status: 'error',
            message: `Slot ${waktuMulai}-${waktuSelesai}: ${err.message}`
          });
        }

        // Check overlap with transaction lock 'SELECT ... FOR UPDATE' to eliminate race condition
        const overlapping = await Pemesanan.findOne({
          where: {
            lapanganId,
            tanggal,
            status: {
              [Op.in]: ['Pending', 'Booked', 'Locked', 'Lunas']
            },
            [Op.and]: [
              { waktuMulai: { [Op.lt]: waktuSelesai } },
              { waktuSelesai: { [Op.gt]: waktuMulai } }
            ]
          },
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (overlapping) {
          await transaction.rollback();
          return res.status(490).json({
            status: 'conflict',
            message: `Slot jam ${waktuMulai} - ${waktuSelesai} sudah dipesan atau sedang dikunci oleh pemesan lain.`
          });
        }

        // Calculate price for this slot
        const totalHarga = Math.ceil(durationHours * parseFloat(lapangan.hargaPerJam));

        // Create new booking record for this slot
        const booking = await Pemesanan.create({
          userId,
          lapanganId,
          tanggal,
          waktuMulai,
          waktuSelesai,
          totalHarga,
          status: 'Locked' // Booking starts as Locked/Pending during payments phase
        }, { transaction });

        createdBookings.push(booking);
      }

      // Commit transaction
      await transaction.commit();

      return res.status(201).json({
        status: 'success',
        message: 'Lapangan berhasil dikunci sementara. Silakan selesaikan pembayaran.',
        data: createdBookings.map(b => ({
          id: b.id,
          userId: b.userId,
          lapanganId: b.lapanganId,
          tanggal: b.tanggal,
          waktuMulai: b.waktuMulai,
          waktuSelesai: b.waktuSelesai,
          totalHarga: b.totalHarga,
          status: b.status
        }))
      });

    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error('Error in createBooking:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal membuat pemesanan karena kesalahan internal server.',
        error: error.message
      });
    }
  },

  /**
   * 3. Ambil Semua Booking Terdaftar untuk Lapangan dan Tanggal Tertentu
   * GET /api/bookings/slots
   */
  async getBookedSlots(req, res) {
    try {
      const { lapanganId, tanggal } = req.query;

      if (!lapanganId || !tanggal) {
        return res.status(400).json({
          status: 'error',
          message: 'Parameter lapanganId dan tanggal harus diisi.'
        });
      }

      const bookings = await Pemesanan.findAll({
        where: {
          lapanganId,
          tanggal,
          status: {
            [Op.in]: ['Pending', 'Booked', 'Locked', 'Lunas']
          }
        },
        attributes: ['id', 'waktuMulai', 'waktuSelesai', 'status']
      });

      return res.status(200).json({
        status: 'success',
        data: bookings
      });
    } catch (error) {
      console.error('Error in getBookedSlots:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil jadwal booking.',
        error: error.message
      });
    }
  }
};

module.exports = BookingController;
