const express = require('express');
const router = express.Router();
const StaffController = require('../controllers/StaffController');
const authMiddleware = require('../middlewares/authMiddleware');

const staffOrAdminGuard = (req, res, next) => {
  if (req.user && (req.user.role === 'Staff' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Akses ditolak. Rute ini hanya dapat diakses oleh Staf Kasir atau Admin.'
    });
  }
};

// Route for getting booking details by booking code (QR scanner)
router.get('/booking/:kodeBooking', authMiddleware, staffOrAdminGuard, StaffController.getBookingDetails);

// Route for executing check-in
router.post('/booking/checkin', authMiddleware, staffOrAdminGuard, StaffController.processCheckIn);

module.exports = router;
