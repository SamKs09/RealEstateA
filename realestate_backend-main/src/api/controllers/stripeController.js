const Stripe = require('stripe');
const PaymentTransaction = require('../models/paymentTransactionModel');
const User = require('../models/userModel');
const Property = require('../models/propertyModel');
const logger = require('../utils/logger');

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent for booking payments
 * @route POST /api/stripe/create-payment-intent
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const {
      amount,
      currency = 'usd', // Change to 'tnd' if Stripe supports it, otherwise use 'eur' or 'usd'
      propertyId,
      propertyName,
      checkInDate,
      checkOutDate,
      numberOfNights,
      driverEnabled,
      userId,
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    // Get user info
    const user = await User.findById(userId || req.user?._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
        },
      });
      
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create payment intent
    // Note: Stripe amounts are in cents (smallest currency unit)
    // For USD: $100.00 = 10000 cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        propertyId: propertyId || 'N/A',
        propertyName: propertyName || 'N/A',
        checkInDate: checkInDate || 'N/A',
        checkOutDate: checkOutDate || 'N/A',
        numberOfNights: numberOfNights?.toString() || '1',
        driverEnabled: driverEnabled?.toString() || 'false',
        userId: user._id.toString(),
      },
      description: `Booking payment for ${propertyName || 'property'} - ${numberOfNights || 1} night(s)`,
    });

    // Create payment transaction record
    const transaction = new PaymentTransaction({
      user: user._id,
      property: propertyId,
      amount: amount,
      currency: currency,
      kind: 'property_booking',
      orderId: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      description: `Booking: ${propertyName} (${numberOfNights} nights)`,
      metadata: {
        propertyName,
        checkInDate,
        checkOutDate,
        numberOfNights,
        driverEnabled,
      },
    });

    await transaction.save();

    logger.info(`Payment intent created: ${paymentIntent.id} for user ${user._id}`);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transactionId: transaction._id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
    });
  }
};

/**
 * Webhook handler for Stripe events
 * @route POST /api/stripe/webhook
 */
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await handlePaymentFailed(paymentIntent);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        await handleRefund(charge);
        break;
      }
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Confirm payment success and update booking
 * @route POST /api/stripe/confirm-payment
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, transactionId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required',
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find transaction
    const transaction = await PaymentTransaction.findOne({
      $or: [
        { stripePaymentIntentId: paymentIntentId },
        { _id: transactionId },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Update transaction based on payment intent status
    if (paymentIntent.status === 'succeeded') {
      transaction.status = 'paid';
      transaction.paidAt = new Date();
      transaction.processedAt = new Date();
      await transaction.save();

      logger.info(`Payment confirmed: ${paymentIntentId}`);

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        transaction,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
      });
    } else {
      transaction.status = paymentIntent.status === 'canceled' ? 'failed' : 'pending';
      await transaction.save();

      return res.status(200).json({
        success: false,
        message: `Payment ${paymentIntent.status}`,
        transaction,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      });
    }
  } catch (error) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment',
    });
  }
};

// Helper function to handle successful payments
async function handlePaymentSuccess(paymentIntent) {
  const transaction = await PaymentTransaction.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (transaction && transaction.status !== 'paid') {
    transaction.status = 'paid';
    transaction.paidAt = new Date();
    transaction.processedAt = new Date();
    transaction.gatewayResponse = paymentIntent;
    await transaction.save();

    logger.info(`Payment succeeded webhook processed: ${paymentIntent.id}`);
  }
}

// Helper function to handle failed payments
async function handlePaymentFailed(paymentIntent) {
  const transaction = await PaymentTransaction.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (transaction) {
    transaction.status = 'failed';
    transaction.failedAt = new Date();
    transaction.gatewayResponse = paymentIntent;
    await transaction.save();

    logger.error(`Payment failed webhook processed: ${paymentIntent.id}`);
  }
}

// Helper function to handle refunds
async function handleRefund(charge) {
  const transaction = await PaymentTransaction.findOne({
    stripePaymentIntentId: charge.payment_intent,
  });

  if (transaction) {
    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.gatewayResponse = charge;
    await transaction.save();

    logger.info(`Refund processed: ${charge.id}`);
  }
}
