const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'jsc_booking_secret_key_2026',
    { expiresIn: '7d' }
  );
};

const AuthController = {
  /**
   * 1. Register User (Penyewa Only)
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { nama, nickname, email, password, confirmPassword } = req.body;

      if (!nama || !nickname || !email || !password || !confirmPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Data registrasi tidak lengkap. Harap isi semua kolom.'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Password dan Konfirmasi Password tidak cocok.'
        });
      }

      // Check unique email or nickname
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { nickname }]
        }
      });

      if (existingUser) {
        const field = existingUser.email === email ? 'Email' : 'Nickname';
        return res.status(400).json({
          status: 'error',
          message: `${field} sudah terdaftar. Gunakan yang lain.`
        });
      }

      // Create Penyewa user
      const user = await User.create({
        nama,
        nickname,
        email,
        password,
        role: 'Penyewa',
        poinLoyalitas: 0
      });

      const token = generateToken(user);

      return res.status(201).json({
        status: 'success',
        message: 'Registrasi berhasil!',
        token,
        data: {
          id: user.id,
          nama: user.nama,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
          poinLoyalitas: user.poinLoyalitas,
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error('Register Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Registrasi gagal karena kesalahan server.',
        error: error.message
      });
    }
  },

  /**
   * 2. Login User (Admin & Penyewa)
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { loginIdentifier, password } = req.body;

      if (!loginIdentifier || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Harap masukkan Email/Nickname dan Password Anda.'
        });
      }

      // Find user by email or nickname
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email: loginIdentifier },
            { nickname: loginIdentifier }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau Nickname tidak terdaftar.'
        });
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Password yang Anda masukkan salah.'
        });
      }

      const token = generateToken(user);

      return res.status(200).json({
        status: 'success',
        message: 'Login berhasil!',
        token,
        data: {
          id: user.id,
          nama: user.nama,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
          poinLoyalitas: user.poinLoyalitas,
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error('Login Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Login gagal karena kesalahan server.',
        error: error.message
      });
    }
  },

  /**
   * 3. Update Profile User
   * PUT /api/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const { nama, nickname, email, password, avatar } = req.body;
      const user = req.user; // Set by authMiddleware

      // Validate email uniqueness if changed
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
          return res.status(400).json({
            status: 'error',
            message: 'Email sudah terdaftar oleh pengguna lain.'
          });
        }
        user.email = email;
      }

      // Validate nickname uniqueness if changed
      if (nickname && nickname !== user.nickname) {
        const nickExists = await User.findOne({ where: { nickname } });
        if (nickExists) {
          return res.status(400).json({
            status: 'error',
            message: 'Nickname sudah terdaftar oleh pengguna lain.'
          });
        }
        user.nickname = nickname;
      }

      if (nama) user.nama = nama;
      if (avatar) user.avatar = avatar; // base64 string
      if (password) user.password = password; // Will be hashed automatically by beforeUpdate hook

      await user.save();

      return res.status(200).json({
        status: 'success',
        message: 'Profil berhasil diperbarui!',
        data: {
          id: user.id,
          nama: user.nama,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
          poinLoyalitas: user.poinLoyalitas,
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error('Update Profile Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui profil karena kesalahan server.',
        error: error.message
      });
    }
  },

  /**
   * GET /api/auth/profile
   */
  async getProfile(req, res) {
    try {
      const user = req.user;
      return res.status(200).json({
        status: 'success',
        data: {
          id: user.id,
          nama: user.nama,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
          poinLoyalitas: user.poinLoyalitas,
          avatar: user.avatar
        }
      });
    } catch (error) {
      console.error('Get Profile Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memuat data profil.',
        error: error.message
      });
    }
  },

  /**
   * 4. Seed Database (Dev only, to bypass command execution limits)
   * GET /api/auth/seed
   */
  async seed(req, res) {
    try {
      const { sequelize, User: UserModel, Lapangan: LapanganModel, Pemesanan: PemesananModel, Pembayaran: PembayaranModel } = require('../models');
      
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await sequelize.sync({ force: true });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      // 1. Create Demo Users
      const penyewa1 = await UserModel.create({
        nama: 'Ahmad Penyewa',
        nickname: 'ahmad123',
        email: 'ahmad@demo.com',
        password: 'password123',
        role: 'Penyewa',
        poinLoyalitas: 10
      });

      const penyewa2 = await UserModel.create({
        nama: 'Budi Penyewa',
        nickname: 'budi456',
        email: 'budi@demo.com',
        password: 'password123',
        role: 'Penyewa',
        poinLoyalitas: 0
      });

      const admin = await UserModel.create({
        nama: 'JSC Admin',
        nickname: 'adminjsc',
        email: 'admin@jsc.com',
        password: 'adminpassword',
        role: 'Admin'
      });

      // 2. Create Demo Lapangan
      const futsal = await LapanganModel.create({
        namaLapangan: 'JSC Futsal Arena A',
        kategori: 'Futsal',
        hargaPerJam: 150000,
        status: 'Available'
      });

      const basket = await LapanganModel.create({
        namaLapangan: 'JSC Basketball Hall B',
        kategori: 'Basket',
        hargaPerJam: 200000,
        status: 'Available'
      });

      const badminton = await LapanganModel.create({
        namaLapangan: 'JSC Badminton Court 1',
        kategori: 'Badminton',
        hargaPerJam: 80000,
        status: 'Available'
      });

      // 3. Seed some dummy bookings and payments for testing admin reports
      const pembayaran1 = await PembayaranModel.create({
        jumlahBayar: 300000,
        metodePembayaran: 'E-Wallet',
        statusBayar: 'Verified',
        tanggalPembayaran: new Date()
      });

      const booking1 = await PemesananModel.create({
        userId: penyewa1.id,
        lapanganId: futsal.id,
        tanggal: '2026-06-10',
        waktuMulai: '08:00',
        waktuSelesai: '10:00',
        totalHarga: 300000,
        status: 'Lunas',
        pembayaranId: pembayaran1.id
      });

      const pembayaran2 = await PembayaranModel.create({
        jumlahBayar: 200000,
        metodePembayaran: 'Transfer Bank',
        statusBayar: 'Pending'
      });

      const booking2 = await PemesananModel.create({
        userId: penyewa2.id,
        lapanganId: basket.id,
        tanggal: '2026-06-11',
        waktuMulai: '15:00',
        waktuSelesai: '16:00',
        totalHarga: 200000,
        status: 'Pending',
        pembayaranId: pembayaran2.id
      });

      return res.status(200).json({
        status: 'success',
        message: 'Database successfully reset and seeded!'
      });
    } catch (error) {
      console.error('Seeding via endpoint failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Database seeding failed.',
        error: error.message
      });
    }
  }
};

module.exports = AuthController;
