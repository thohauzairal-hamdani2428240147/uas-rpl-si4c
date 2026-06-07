require('dotenv').config();
require('mysql2'); // Force Vercel to bundle mysql2 driver
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);

// Health check endpoint (trigger nodemon restart)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'JSC Booking Backend is running.' });
});

// Start Server & Sync Database
async function startServer() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync database models (creates tables if they don't exist, reset is handled via seeder endpoint)
    await sequelize.sync();
    console.log('All models were synchronized successfully.');

    // Run dynamic migrations to update MySQL database schema
    try {
      await sequelize.query("ALTER TABLE pemesanan MODIFY COLUMN status ENUM('Pending', 'Booked', 'Lunas', 'Cancelled', 'Locked', 'Maintenance') NOT NULL DEFAULT 'Pending'");
      console.log('Database enum status updated successfully to include Maintenance.');
    } catch (err) {
      console.warn('Note: Could not alter status enum:', err.message);
    }

    try {
      await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('Penyewa', 'Admin', 'Staff') NOT NULL DEFAULT 'Penyewa'");
      console.log('Database role enum updated successfully to include Staff.');
    } catch (err) {
      console.warn('Note: Could not alter role enum:', err.message);
    }

    try {
      await sequelize.query("ALTER TABLE pembayaran ADD COLUMN kodeBooking VARCHAR(255) UNIQUE");
      console.log('Database pembayaran column kodeBooking added.');
    } catch (err) {
      console.log('Note: Column kodeBooking already exists or cannot be added:', err.message);
    }

    try {
      await sequelize.query("ALTER TABLE pemesanan ADD COLUMN checkedIn BOOLEAN NOT NULL DEFAULT false");
      console.log('Database pemesanan column checkedIn added.');
    } catch (err) {
      console.log('Note: Column checkedIn already exists or cannot be added:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start the server:', error);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  startServer();
} else {
  // On serverless environment like Vercel, authenticate database on-demand
  sequelize.authenticate()
    .then(() => console.log('Database connected on demand (Vercel).'))
    .catch(err => console.error('Database connection error on Vercel:', err));
}

module.exports = app;
