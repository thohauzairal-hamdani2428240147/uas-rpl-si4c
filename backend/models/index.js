const sequelize = require('../config/database');
const User = require('./User');
const Lapangan = require('./Lapangan');
const Pemesanan = require('./Pemesanan');
const Pembayaran = require('./Pembayaran');

// Define Associations
User.hasMany(Pemesanan, { foreignKey: 'userId', as: 'pemesanan' });
Pemesanan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Lapangan.hasMany(Pemesanan, { foreignKey: 'lapanganId', as: 'lapangan_pemesanan' });
Pemesanan.belongsTo(Lapangan, { foreignKey: 'lapanganId', as: 'lapangan' });

Pembayaran.hasMany(Pemesanan, { foreignKey: 'pembayaranId', as: 'pemesanan' });
Pemesanan.belongsTo(Pembayaran, { foreignKey: 'pembayaranId', as: 'pembayaran' });

module.exports = {
  sequelize,
  User,
  Lapangan,
  Pemesanan,
  Pembayaran
};
