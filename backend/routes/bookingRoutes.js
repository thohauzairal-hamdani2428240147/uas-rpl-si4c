const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/BookingController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route for checking availability
router.get('/check', BookingController.checkAvailability);

// Route for getting booked slots on a specific date/field
router.get('/slots', BookingController.getBookedSlots);

// Route for fetching all fields
router.get('/fields', async (req, res) => {
  try {
    const { Lapangan } = require('../models');
    const fields = await Lapangan.findAll();
    return res.status(200).json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    return res.status(500).json({ message: 'Gagal memuat lapangan', error: error.message });
  }
});

// Route for fetching user details (loyalty points)
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Gagal memuat profil user', error: error.message });
  }
});

// Route for getting logged-in user's own bookings
router.get('/my-bookings', authMiddleware, BookingController.getMyBookings);

// Route for creating a booking
router.post('/', authMiddleware, BookingController.createBooking);

module.exports = router;
