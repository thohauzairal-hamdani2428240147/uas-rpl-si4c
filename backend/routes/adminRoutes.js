const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/authMiddleware');

const adminGuard = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Akses ditolak. Rute ini hanya dapat diakses oleh Admin.'
    });
  }
};

// Route for getting revenue and booking report
router.get('/laporan', authMiddleware, adminGuard, AdminController.getLaporanPendapatan);

module.exports = router;
