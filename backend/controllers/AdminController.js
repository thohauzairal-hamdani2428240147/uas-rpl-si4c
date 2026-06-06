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

      // 2. Count bookings per category (Futsal, Basket, Badminton)
      const rekapKategori = await Pemesanan.findAll({
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
  }
};

module.exports = AdminController;
