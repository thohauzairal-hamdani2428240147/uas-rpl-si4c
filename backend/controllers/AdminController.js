const { sequelize, Pembayaran, Pemesanan, Lapangan, User } = require('../models');

const AdminController = {
  /**
   * 1. Get Laporan Pendapatan & Rekapitulasi Pemesanan (Admin Only)
   * GET /api/admin/laporan
   */
  async getLaporanPendapatan(req, res) {
    try {
      // 1. Calculate total revenue from Verified payments
      const totalPendapatan = await Pembayaran.sum('jumlahBayar', {
        where: {
          statusBayar: 'Verified'
        }
      });

      // 2. Count bookings per category (Futsal, Basket, Badminton) - active bookings only
      const { Op } = require('sequelize');
      const rekapKategori = await Pemesanan.findAll({
        where: {
          status: {
            [Op.in]: ['Booked', 'Lunas', 'Locked']
          }
        },
        attributes: [
          [sequelize.col('lapangan.kategori'), 'kategori'],
          [sequelize.fn('COUNT', sequelize.col('Pemesanan.id')), 'jumlahPemesanan']
        ],
        include: [{
          model: Lapangan,
          as: 'lapangan',
          attributes: [] // Do not select Lapangan columns, only use in GROUP and alias
        }],
        group: ['lapangan.kategori'],
        raw: true
      });

      // Standard categories list
      const allCategories = ['Futsal', 'Basket', 'Badminton'];
      
      // Map and fill 0 for categories with no bookings
      const rekapitulasi = allCategories.map(cat => {
        const found = rekapKategori.find(r => r.kategori && r.kategori.toLowerCase() === cat.toLowerCase());
        return {
          kategori: cat,
          jumlahPemesanan: found ? parseInt(found.jumlahPemesanan, 10) : 0
        };
      });

      // 3. Fetch latest transactions
      const transactions = await Pembayaran.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{
          model: Pemesanan,
          as: 'pemesanan',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'nama']
          }, {
            model: Lapangan,
            as: 'lapangan',
            attributes: ['id', 'namaLapangan']
          }]
        }]
      });

      return res.status(200).json({
        status: 'success',
        message: 'Laporan pendapatan admin berhasil dimuat.',
        data: {
          totalPendapatan: parseFloat(totalPendapatan) || 0.0,
          rekapitulasi,
          transactions
        }
      });
    } catch (error) {
      console.error('Error in getLaporanPendapatan:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memuat laporan pendapatan admin.',
        error: error.message
      });
    }
  },

  /**
   * 2. Ambil Grid Jadwal Ketersediaan Lapangan untuk Tanggal Tertentu (Admin Only)
   * GET /api/admin/grid
   */
  async getScheduleGrid(req, res) {
    try {
      const { Op } = require('sequelize');
      const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];

      const fields = await Lapangan.findAll();
      const bookings = await Pemesanan.findAll({
        where: {
          tanggal,
          status: {
            [Op.ne]: 'Cancelled'
          }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'role']
        }]
      });

      return res.status(200).json({
        status: 'success',
        data: {
          tanggal,
          fields,
          bookings
        }
      });
    } catch (error) {
      console.error('Error in getScheduleGrid:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memuat grid jadwal lapangan.',
        error: error.message
      });
    }
  },

  /**
   * 3. Ubah Status Slot Jadwal Lapangan (Admin Only)
   * POST /api/admin/grid/status
   */
  async updateScheduleSlotStatus(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { Op } = require('sequelize');
      const { lapanganId, tanggal, waktuMulai, waktuSelesai, status } = req.body;
      const adminUserId = req.user.id;

      if (!lapanganId || !tanggal || !waktuMulai || !waktuSelesai || !status) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Parameter tidak lengkap. Harap sertakan lapanganId, tanggal, waktuMulai, waktuSelesai, dan status.'
        });
      }

      // Find overlapping active bookings
      const overlappingBookings = await Pemesanan.findAll({
        where: {
          lapanganId,
          tanggal,
          status: {
            [Op.in]: ['Pending', 'Booked', 'Lunas', 'Locked', 'Maintenance']
          },
          [Op.and]: [
            { waktuMulai: { [Op.lt]: waktuSelesai } },
            { waktuSelesai: { [Op.gt]: waktuMulai } }
          ]
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (status === 'Available') {
        // Cancel all overlapping bookings
        for (const booking of overlappingBookings) {
          booking.status = 'Cancelled';
          await booking.save({ transaction });
        }
      } else if (status === 'Booked') {
        // Create manual booking by Admin
        if (overlappingBookings.length > 0) {
          for (const booking of overlappingBookings) {
            booking.status = 'Lunas';
            await booking.save({ transaction });
          }
        } else {
          const lapangan = await Lapangan.findByPk(lapanganId, { transaction });
          if (!lapangan) {
            await transaction.rollback();
            return res.status(404).json({
              status: 'error',
              message: 'Lapangan tidak ditemukan.'
            });
          }
          const duration = calculateDurationInHours(waktuMulai, waktuSelesai);
          const totalHarga = Math.ceil(duration * parseFloat(lapangan.hargaPerJam));

          await Pemesanan.create({
            userId: adminUserId,
            lapanganId,
            tanggal,
            waktuMulai,
            waktuSelesai,
            totalHarga,
            status: 'Lunas'
          }, { transaction });
        }
      } else if (status === 'Maintenance') {
        // Block for maintenance
        if (overlappingBookings.length > 0) {
          for (const booking of overlappingBookings) {
            booking.status = 'Maintenance';
            await booking.save({ transaction });
          }
        } else {
          await Pemesanan.create({
            userId: adminUserId,
            lapanganId,
            tanggal,
            waktuMulai,
            waktuSelesai,
            totalHarga: 0,
            status: 'Maintenance'
          }, { transaction });
        }
      } else {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Status '${status}' tidak valid.`
        });
      }

      await transaction.commit();
      await transaction.commit();
      return res.status(200).json({
        status: 'success',
        message: `Status jadwal slot ${waktuMulai} - ${waktuSelesai} berhasil diperbarui.`
      });
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error('Error in updateScheduleSlotStatus:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui status slot.',
        error: error.message
      });
    }
  },

  /**
   * 4. Tambah Lapangan Baru
   * POST /api/admin/fields
   */
  async createField(req, res) {
    try {
      const { namaLapangan, kategori, hargaPerJam, status } = req.body;
      if (!namaLapangan || !kategori || !hargaPerJam) {
        return res.status(400).json({ status: 'error', message: 'Data lapangan tidak lengkap.' });
      }
      const field = await Lapangan.create({ namaLapangan, kategori, hargaPerJam, status: status || 'Available' });
      return res.status(201).json({ status: 'success', message: 'Lapangan berhasil ditambahkan.', data: field });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal menambahkan lapangan.', error: error.message });
    }
  },

  /**
   * 5. Edit Lapangan
   * PUT /api/admin/fields/:id
   */
  async updateField(req, res) {
    try {
      const { id } = req.params;
      const { namaLapangan, kategori, hargaPerJam, status } = req.body;
      const field = await Lapangan.findByPk(id);
      if (!field) {
        return res.status(404).json({ status: 'error', message: 'Lapangan tidak ditemukan.' });
      }
      await field.update({ namaLapangan, kategori, hargaPerJam, status });
      return res.status(200).json({ status: 'success', message: 'Lapangan berhasil diperbarui.', data: field });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal memperbarui lapangan.', error: error.message });
    }
  },

  /**
   * 6. Hapus Lapangan
   * DELETE /api/admin/fields/:id
   */
  async deleteField(req, res) {
    try {
      const { id } = req.params;
      const bookingCount = await Pemesanan.count({ where: { lapanganId: id } });
      if (bookingCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Lapangan ini tidak dapat dihapus karena sudah memiliki riwayat transaksi booking. Anda dapat mengubah statusnya menjadi Maintenance agar tidak bisa dibooking.'
        });
      }
      const field = await Lapangan.findByPk(id);
      if (!field) {
        return res.status(404).json({ status: 'error', message: 'Lapangan tidak ditemukan.' });
      }
      await field.destroy();
      return res.status(200).json({ status: 'success', message: 'Lapangan berhasil dihapus.' });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal menghapus lapangan.', error: error.message });
    }
  },

  /**
   * 7. Ambil Daftar Staff Kasir
   * GET /api/admin/staff
   */
  async getStaffList(req, res) {
    try {
      const staffList = await User.findAll({
        where: { role: 'Staff' },
        attributes: ['id', 'nama', 'nickname', 'email', 'createdAt']
      });
      return res.status(200).json({ status: 'success', data: staffList });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal memuat daftar staf.', error: error.message });
    }
  },

  /**
   * 8. Buat Akun Staff Baru
   * POST /api/admin/staff
   */
  async createStaffAccount(req, res) {
    try {
      const { Op } = require('sequelize');
      const { nama, nickname, email, password } = req.body;
      if (!nama || !nickname || !email || !password) {
        return res.status(400).json({ status: 'error', message: 'Data staf tidak lengkap.' });
      }
      // Check if nickname or email already exists
      const existingUser = await User.findOne({ where: { [Op.or]: [{ nickname }, { email }] } });
      if (existingUser) {
        return res.status(400).json({ status: 'error', message: 'Nickname atau email sudah digunakan.' });
      }
      const staff = await User.create({ nama, nickname, email, password, role: 'Staff' });
      return res.status(201).json({
        status: 'success',
        message: 'Akun staf kasir berhasil dibuat.',
        data: { id: staff.id, nama: staff.nama, nickname: staff.nickname, email: staff.email }
      });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal membuat akun staf.', error: error.message });
    }
  },

  /**
   * 9. Hapus Akun Staff
   * DELETE /api/admin/staff/:id
   */
  async deleteStaffAccount(req, res) {
    try {
      const staff = await User.findOne({ where: { id: req.params.id, role: 'Staff' } });
      if (!staff) {
        return res.status(404).json({ status: 'error', message: 'Akun staf tidak ditemukan.' });
      }
      await staff.destroy();
      return res.status(200).json({ status: 'success', message: 'Akun staf berhasil dihapus.' });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal menghapus akun staf.', error: error.message });
    }
  }
};

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

module.exports = AdminController;
