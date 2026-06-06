const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pembayaran = sequelize.define('Pembayaran', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  jumlahBayar: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  metodePembayaran: {
    type: DataTypes.STRING,
    allowNull: false
  },
  statusBayar: {
    type: DataTypes.ENUM('Pending', 'Verified', 'Failed'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  tanggalPembayaran: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pembayaran',
  timestamps: true
});

module.exports = Pembayaran;
