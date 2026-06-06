const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');

// Route for processing/initiating payment
router.post('/process', PaymentController.prosesPembayaran);

// Route for verifying payment (callback/webhook simulator)
router.post('/verify', PaymentController.verifikasiTransaksi);

module.exports = router;
