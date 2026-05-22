const axios = require('axios');
const User = require('../models/userModel');
const Property = require('../models/propertyModel');
const Vehicle = require('../models/vehicleModel');
const PaymentTransaction = require('../models/paymentTransactionModel');
const logger = require('../utils/logger');

const FLOUCI_TIMEOUT_MS = 15000;

const PACK_BENEFITS = {
  bronze: { listings: 3, boosts: 1 },
  silver: { listings: 10, boosts: 3 },
  gold: { listings: 15, boosts: 5 },
  platinum: { listings: 50, boosts: 10 },
};

const PACK_PRICES = {
  bronze: 1,
  silver: 1,
  gold: 1,
  platinum: 1,
};

const BOOST_PLANS = {
  '1day': { duration: 1, cost: 1, label: '1 day boost' },
  '3day': { duration: 3, cost: 1, label: '3 day boost' },
  '7day': { duration: 7, cost: 1, label: '7 day boost' },
};

const getPublicBaseUrl = () => {
  // PUBLIC_URL must be a publicly reachable URL (e.g. ngrok for local dev, or deployed server URL)
  // Flouci's servers need to reach success_link/fail_link — a local IP won't work
  const configuredUrl = process.env.PUBLIC_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
  return configuredUrl.replace(/\/+$/, '');
};

const buildOrderId = (kind) => `re-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getUserDisplayName = (user) => {
  const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.userName || user.email || 'Customer';
};

const ensureFlouciConfig = () => {
  const publicKey = process.env.FLOUCI_PUBLIC_KEY;
  const secretKey = process.env.FLOUCI_SECRET_KEY;
  const baseUrl = process.env.FLOUCI_BASE_URL || 'https://developers.flouci.com/api/v2';

  if (!publicKey || !secretKey) {
    const error = new Error('Flouci payment gateway is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  return {
    publicKey: publicKey.trim(),
    secretKey: secretKey.trim(),
    baseUrl: baseUrl.replace(/\/+$/, ''),
  };
};

const getFlouciHeaders = () => {
  const { publicKey, secretKey } = ensureFlouciConfig();
  return {
    Authorization: `Bearer ${publicKey}:${secretKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
};

const getCheckoutUrl = (payload) => payload?.result?.link || null;

const getPaymentId = (payload) => payload?.result?.payment_id || null;

const normalizeGatewayStatus = (payload) => {
  const rawStatus = String(
    payload?.status
      || payload?.paymentStatus
      || payload?.payment_status
      || payload?.data?.status
      || payload?.payment?.status
      || '',
  ).trim().toLowerCase();

  if (['success', 'paid', 'completed', 'complete', 'succeeded'].includes(rawStatus)) {
    return 'paid';
  }

  if (['failed', 'failure', 'cancelled', 'canceled'].includes(rawStatus)) {
    return 'failed';
  }

  if (['expired'].includes(rawStatus)) {
    return 'expired';
  }

  // Flouci-specific uppercase statuses
  const upperStatus = String(payload?.result?.status || '').trim();
  if (upperStatus === 'SUCCESS') return 'paid';
  if (upperStatus === 'FAILURE') return 'failed';
  if (upperStatus === 'EXPIRED') return 'expired';

  return 'pending';
};

const applyPackBenefits = async (userId, pack) => {
  const benefits = PACK_BENEFITS[pack];
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  user.pack = pack;
  user.listingConfig = {
    status: true,
    number: benefits.listings,
  };
  user.boost = {
    status: benefits.boosts > 0,
    number: benefits.boosts,
  };

  await user.save();
  return user;
};

const applyPropertyBoost = async (propertyId, boostPlan) => {
  const plan = BOOST_PLANS[boostPlan];
  const property = await Property.findById(propertyId);

  if (!property) {
    const error = new Error('Property not found.');
    error.statusCode = 404;
    throw error;
  }

  const expiryDate = new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000);
  property.isPromoted = true;
  property.promotionExpiry = expiryDate;
  property.boostPlan = boostPlan;
  await property.save();

  return {
    property,
    boost: {
      plan: boostPlan,
      label: plan.label,
      expiryDate,
      cost: plan.cost,
    },
  };
};

const applyVehicleBoost = async (vehicleId, boostPlan) => {
  const plan = BOOST_PLANS[boostPlan];
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    const error = new Error('Vehicle not found.');
    error.statusCode = 404;
    throw error;
  }

  const expiryDate = new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000);
  vehicle.isPromoted = true;
  vehicle.promotionExpiry = expiryDate;
  vehicle.boostPlan = boostPlan;
  await vehicle.save();

  return {
    vehicle,
    boost: {
      plan: boostPlan,
      label: plan.label,
      expiryDate,
      cost: plan.cost,
    },
  };
};

const fetchFlouciPaymentDetails = async (paymentId) => {
  const { baseUrl } = ensureFlouciConfig();
  const response = await axios.get(`${baseUrl}/verify_payment/${paymentId}`, {
    headers: getFlouciHeaders(),
    timeout: FLOUCI_TIMEOUT_MS,
  });

  return response.data;
};

const synchronizeTransaction = async (transaction, paymentIdOverride) => {
  const paymentId = paymentIdOverride || transaction.flouciPaymentId;

  if (!paymentId) {
    return { transaction, remoteStatus: transaction.status, remotePayload: null };
  }

  const remotePayload = await fetchFlouciPaymentDetails(paymentId);
  const remoteStatus = normalizeGatewayStatus(remotePayload);

  transaction.flouciPaymentId = paymentId;
  transaction.gatewayResponse = remotePayload;
  transaction.lastGatewayStatus = remoteStatus;

  if (remoteStatus === 'paid') {
    if (!transaction.processedAt) {
      if (transaction.kind === 'pack_purchase') {
        await applyPackBenefits(transaction.user, transaction.pack);
      }

      if (transaction.kind === 'property_boost') {
        await applyPropertyBoost(transaction.property, transaction.boostPlan);
      }

      if (transaction.kind === 'vehicle_boost') {
        await applyVehicleBoost(transaction.vehicle, transaction.boostPlan);
      }

      transaction.processedAt = new Date();
    }

    transaction.status = 'paid';
    transaction.paidAt = transaction.paidAt || new Date();
  } else if (remoteStatus === 'failed') {
    transaction.status = 'failed';
    transaction.failedAt = transaction.failedAt || new Date();
  } else if (remoteStatus === 'expired') {
    transaction.status = 'expired';
    transaction.failedAt = transaction.failedAt || new Date();
  }

  await transaction.save();
  return { transaction, remoteStatus, remotePayload };
};

const buildFlouciPayload = (user, transaction) => {
  const publicBaseUrl = getPublicBaseUrl();
  const displayName = getUserDisplayName(user);

  // Flouci requires amount in millimes (string): 1 TND = 1000 millimes
  const amountMillimes = String(Math.round(transaction.amount * 1000));

  return {
    amount: amountMillimes,
    developer_tracking_id: transaction.orderId,
    accept_card: true,
    success_link: `${publicBaseUrl}/api/payments/return/success?transactionId=${transaction._id}`,
    fail_link: `${publicBaseUrl}/api/payments/return/failure?transactionId=${transaction._id}`,
    webhook: `${publicBaseUrl}/api/payments/webhook?transactionId=${transaction._id}`,
    client_id: displayName,
    session_timeout_secs: 1800,
  };
};

const createFlouciCheckout = async (user, transaction) => {
  const { baseUrl } = ensureFlouciConfig();
  const payload = buildFlouciPayload(user, transaction);

  const response = await axios.post(`${baseUrl}/generate_payment`, payload, {
    headers: getFlouciHeaders(),
    timeout: FLOUCI_TIMEOUT_MS,
  });

  const checkoutUrl = getCheckoutUrl(response.data);
  const paymentId = getPaymentId(response.data);

  if (!checkoutUrl) {
    const error = new Error('Flouci did not return a checkout URL.');
    error.statusCode = 502;
    throw error;
  }

  transaction.gatewayRequest = payload;
  transaction.gatewayResponse = response.data;
  transaction.checkoutUrl = checkoutUrl;
  transaction.flouciPaymentId = paymentId || transaction.flouciPaymentId;
  await transaction.save();

  return transaction;
};

const serializeTransaction = async (transaction) => {
  const baseResponse = {
    transactionId: String(transaction._id),
    kind: transaction.kind,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    description: transaction.description,
    pack: transaction.pack,
    boostPlan: transaction.boostPlan,
    checkoutUrl: transaction.checkoutUrl,
    flouciPaymentId: transaction.flouciPaymentId,
    processedAt: transaction.processedAt,
    paidAt: transaction.paidAt,
    createdAt: transaction.createdAt,
  };

  if (transaction.kind === 'pack_purchase') {
    const user = await User.findById(transaction.user).select('pack listingConfig boost trial firstName lastName fullName email');
    return {
      ...baseResponse,
      user,
    };
  }

  if (transaction.kind === 'property_boost') {
    const property = await Property.findById(transaction.property).select('title isPromoted promotionExpiry boostPlan status');
    return {
      ...baseResponse,
      property,
    };
  }

  const vehicle = await Vehicle.findById(transaction.vehicle).select('title isPromoted promotionExpiry boostPlan status');
  return {
    ...baseResponse,
    vehicle,
  };
};

const renderReturnPage = (status, transactionId) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment ${status}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f6f7fb; color: #1f2937; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { background: white; border-radius: 16px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08); padding: 32px; max-width: 420px; text-align: center; }
      h1 { margin: 0 0 12px; font-size: 28px; }
      p { margin: 0 0 8px; line-height: 1.5; }
      .muted { color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${status === 'success' ? 'Payment confirmed' : 'Payment not completed'}</h1>
      <p>${status === 'success' ? 'You can return to the app now.' : 'Close this page and try again from the app if needed.'}</p>
      <p class="muted">Transaction: ${transactionId || 'unknown'}</p>
    </div>
  </body>
</html>`;

const handleControllerError = (res, error, fallbackMessage) => {
  const statusCode = error.statusCode || error.response?.status || 500;
  logger.error(fallbackMessage, {
    message: error.message,
    stack: error.stack,
    data: error.response?.data,
  });

  // Flouci error responses put the message inside result.message
  const flouciMessage = error.response?.data?.result?.message;
  const message = flouciMessage || error.response?.data?.message || error.message || fallbackMessage;

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

exports.initiatePackPayment = async (req, res) => {
  try {
    const { pack } = req.body;

    if (!pack || !PACK_BENEFITS[pack]) {
      return res.status(400).json({ success: false, message: 'Invalid pack type.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const transaction = new PaymentTransaction({
      user: user._id,
      kind: 'pack_purchase',
      orderId: buildOrderId('pack'),
      pack,
      amount: PACK_PRICES[pack],
      currency: 'TND',
      description: `${pack} subscription pack purchase`,
    });

    await transaction.save();
    await createFlouciCheckout(user, transaction);

    return res.json({
      success: true,
      message: 'Pack checkout created successfully.',
      data: await serializeTransaction(transaction),
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to initiate pack payment.');
  }
};

exports.initiatePropertyBoostPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { boostPlan } = req.body;

    if (!boostPlan || !BOOST_PLANS[boostPlan]) {
      return res.status(400).json({ success: false, message: 'Invalid boost plan.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    if (String(property.owner) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to boost this listing.' });
    }

    if (property.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active listings can be boosted.' });
    }

    const transaction = new PaymentTransaction({
      user: user._id,
      kind: 'property_boost',
      orderId: buildOrderId('property-boost'),
      property: property._id,
      boostPlan,
      amount: BOOST_PLANS[boostPlan].cost,
      currency: 'TND',
      description: `${BOOST_PLANS[boostPlan].label} for property ${property.title}`,
    });

    await transaction.save();
    await createFlouciCheckout(user, transaction);

    return res.json({
      success: true,
      message: 'Boost checkout created successfully.',
      data: await serializeTransaction(transaction),
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to initiate property boost payment.');
  }
};

exports.initiateVehicleBoostPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { boostPlan } = req.body;

    if (!boostPlan || !BOOST_PLANS[boostPlan]) {
      return res.status(400).json({ success: false, message: 'Invalid boost plan.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    if (String(vehicle.owner) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to boost this vehicle.' });
    }

    if (vehicle.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active listings can be boosted.' });
    }

    const transaction = new PaymentTransaction({
      user: user._id,
      kind: 'vehicle_boost',
      orderId: buildOrderId('vehicle-boost'),
      vehicle: vehicle._id,
      boostPlan,
      amount: BOOST_PLANS[boostPlan].cost,
      currency: 'TND',
      description: `${BOOST_PLANS[boostPlan].label} for vehicle ${vehicle.title}`,
    });

    await transaction.save();
    await createFlouciCheckout(user, transaction);

    return res.json({
      success: true,
      message: 'Boost checkout created successfully.',
      data: await serializeTransaction(transaction),
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to initiate vehicle boost payment.');
  }
};

exports.getTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await PaymentTransaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Payment transaction not found.' });
    }

    if (String(transaction.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this payment.' });
    }

    if (transaction.status === 'pending') {
      await synchronizeTransaction(transaction);
    }

    return res.json({
      success: true,
      message: 'Payment transaction fetched successfully.',
      data: await serializeTransaction(transaction),
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch payment status.');
  }
};

exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    for (const transaction of transactions) {
      if (transaction.status === 'pending') {
        await synchronizeTransaction(transaction);
      }
    }

    return res.json({
      success: true,
      message: 'Payment history fetched successfully.',
      data: await Promise.all(transactions.map((transaction) => serializeTransaction(transaction))),
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch payment history.');
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    // Flouci sends the payment_id in the request body (POST)
    const paymentId = req.body?.payment_id || req.query?.payment_id || null;
    const transactionId = req.query?.transactionId || null;
    let transaction = null;

    if (transactionId) {
      transaction = await PaymentTransaction.findById(transactionId);
    }

    if (!transaction && paymentId) {
      transaction = await PaymentTransaction.findOne({ flouciPaymentId: String(paymentId) });
    }

    if (!transaction) {
      logger.warn('Flouci webhook received for unknown transaction', { transactionId, paymentId });
      return res.status(200).json({ success: true, message: 'Webhook acknowledged.' });
    }

    await synchronizeTransaction(transaction, paymentId ? String(paymentId) : null);
    return res.status(200).json({ success: true, message: 'Webhook processed.' });
  } catch (error) {
    logger.error('Flouci webhook processing failed', { message: error.message, stack: error.stack });
    return res.status(200).json({ success: false, message: 'Webhook acknowledged with processing error.' });
  }
};

exports.paymentReturnPage = async (req, res) => {
  const { status } = req.params;
  const { transactionId, payment_id: paymentId } = req.query;

  // Respond immediately so the WebView does not time out waiting for synchronizeTransaction.
  // The mobile app's subscription/boost screens re-verify via getTransactionStatus with
  // retry logic, so this sync is a best-effort background update only.
  res.status(200).send(renderReturnPage(status === 'success' ? 'success' : 'failure', transactionId));

  // Run sync after the response has been flushed (fire-and-forget)
  if (transactionId) {
    PaymentTransaction.findById(transactionId)
      .then((transaction) => {
        if (transaction) {
          return synchronizeTransaction(transaction, paymentId ? String(paymentId) : null);
        }
      })
      .catch((error) => {
        logger.warn('Failed to synchronize transaction from return page', {
          transactionId,
          paymentId,
          message: error.message,
        });
      });
  }
};

/**
 * Initiate Property Booking Payment
 * Creates a Flouci checkout for property booking
 */
exports.initiateBookingPayment = async (req, res) => {
  try {
    const {
      propertyId,
      propertyName,
      amount,
      checkInDate,
      checkOutDate,
      numberOfNights,
      driverEnabled,
      arrivingTime,
      leavingTime,
    } = req.body;

    // Validation
    if (!propertyId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Property ID and valid amount are required.',
      });
    }

    if (!numberOfNights || numberOfNights <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Number of nights must be greater than 0.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.',
      });
    }

    // Create payment transaction
    const transaction = new PaymentTransaction({
      user: user._id,
      kind: 'property_booking',
      orderId: buildOrderId('booking'),
      property: propertyId,
      amount,
      currency: 'TND',
      description: `Booking: ${propertyName || property.title} (${numberOfNights} night${numberOfNights > 1 ? 's' : ''})`,
      metadata: {
        propertyName: propertyName || property.title,
        checkInDate,
        checkOutDate,
        numberOfNights,
        driverEnabled: driverEnabled || false,
        arrivingTime,
        leavingTime,
      },
    });

    await transaction.save();
    await createFlouciCheckout(user, transaction);

    logger.info(`Booking payment initiated: ${transaction._id} for user ${user._id}`);

    return res.json({
      success: true,
      message: 'Booking checkout created successfully.',
      data: {
        transactionId: String(transaction._id),
        checkoutUrl: transaction.checkoutUrl,
        flouciPaymentId: transaction.flouciPaymentId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
      },
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to initiate booking payment.');
  }
};