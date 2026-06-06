const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lapangan = sequelize.define('Lapangan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  namaLapangan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  kategori: {
    type: DataTypes.ENUM('Futsal', 'Basket', 'Badminton'),
    allowNull: false
  },
  hargaPerJam: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Available', 'Maintenance'),
    allowNull: false,
    defaultValue: 'Available'
  }
}, {
  tableName: 'lapangan',
  timestamps: true
});

module.exports = Lapangan;
