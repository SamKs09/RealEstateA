const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route   POST /api/stripe/create-payment-intent
 * @desc    Create a Stripe payment intent for booking
 * @access  Private
 */
router.post('/create-payment-intent', authMiddleware, stripeController.createPaymentIntent);

/**
 * @route   POST /api/stripe/confirm-payment
 * @desc    Confirm payment after successful Stripe checkout
 * @access  Private
 */
router.post('/confirm-payment', authMiddleware, stripeController.confirmPayment);

/**
 * @route   POST /api/stripe/webhook
 * @desc    Stripe webhook for payment events
 * @access  Public (verified by Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.stripeWebhook);

module.exports = router;
