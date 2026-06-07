const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pemesanan = sequelize.define('Pemesanan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lapanganId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lapangan',
      key: 'id'
    }
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  waktuMulai: {
    type: DataTypes.TIME,
    allowNull: false
  },
  waktuSelesai: {
    type: DataTypes.TIME,
    allowNull: false
  },
  totalHarga: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Booked', 'Lunas', 'Cancelled', 'Locked', 'Maintenance'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  pembayaranId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'pembayaran',
      key: 'id'
    }
  },
  checkedIn: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'pemesanan',
  timestamps: true
});

module.exports = Pemesanan;
