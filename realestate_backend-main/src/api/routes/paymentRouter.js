const router = require('express').Router();
const paymentCtrl = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

router.post('/initiate-pack', auth, paymentCtrl.initiatePackPayment);
router.post('/initiate-booking', auth, paymentCtrl.initiateBookingPayment);
router.post('/properties/:id/initiate-boost', auth, paymentCtrl.initiatePropertyBoostPayment);
router.post('/vehicles/:id/initiate-boost', auth, paymentCtrl.initiateVehicleBoostPayment);
router.get('/transactions', auth, paymentCtrl.getMyTransactions);
router.get('/transactions/:transactionId', auth, paymentCtrl.getTransactionStatus);
router.post('/webhook', paymentCtrl.paymentWebhook);
router.get('/return/:status', paymentCtrl.paymentReturnPage);

module.exports = router;