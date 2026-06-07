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

// Route for getting revenue and booking report
router.get('/laporan', authMiddleware, adminGuard, AdminController.getLaporanPendapatan);

// Rute untuk Grid Jadwal & Modifikasi Status Slot
router.get('/grid', authMiddleware, staffOrAdminGuard, AdminController.getScheduleGrid);
router.post('/grid/status', authMiddleware, staffOrAdminGuard, AdminController.updateScheduleSlotStatus);

// Rute CRUD Lapangan (Sports Fields)
router.post('/fields', authMiddleware, adminGuard, AdminController.createField);
router.put('/fields/:id', authMiddleware, adminGuard, AdminController.updateField);
router.delete('/fields/:id', authMiddleware, adminGuard, AdminController.deleteField);

// Rute CRUD Staff Kasir
router.get('/staff', authMiddleware, adminGuard, AdminController.getStaffList);
router.post('/staff', authMiddleware, adminGuard, AdminController.createStaffAccount);
router.delete('/staff/:id', authMiddleware, adminGuard, AdminController.deleteStaffAccount);

module.exports = router;
