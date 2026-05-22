const Offer = require('../models/offerModel');
const Property = require('../models/propertyModel');
const Vehicle = require('../models/vehicleModel');
const User = require('../models/userModel');
const messageService = require('../services/messageService');
const profileService = require('../services/profileService');
const logger = require('../utils/logger');

/**
 * Get seller profile data
 */
exports.getSellerProfile = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const profile = await profileService.getSellerProfile(sellerId);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error(`Get seller profile error: ${error.message}`);
    
    if (error.message === 'Invalid seller ID') {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    if (error.message === 'Seller not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get seller's active listings
 */
exports.getSellerListings = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const listings = await profileService.getSellerListings(
      sellerId, 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    logger.error(`Get seller listings error: ${error.message}`);
    
    if (error.message === 'Invalid seller ID') {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all offers for a seller, grouped by property or vehicle
 */
exports.getSellerOffers = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { type } = req.query; // 'property' or 'car'

    if (!type) {
      return res.status(400).json({ success: false, message: 'Type is required' });
    }

    const offers = await Offer.find({ seller: sellerId, type })
      .populate('buyer', 'fullName firstName lastName avatar email')
      .populate('property', 'title pricing media propertyDetails')
      .populate('vehicle', 'title pricing media vehicleDetails')
      .sort({ createdAt: -1 });

    // Grouping by item
    const groupedOffers = [];
    const itemMap = new Map();

    offers.forEach(offer => {
      const item = type === 'property' ? offer.property : offer.vehicle;
      if (!item) return;

      const itemId = item._id.toString();
      if (!itemMap.has(itemId)) {
        itemMap.set(itemId, {
          id: itemId,
          type,
          item: {
            id: itemId,
            image: item.media?.images?.[0] || '',
            name: item.title,
            price: type === 'property' 
              ? `${item.pricing?.rentPrice || item.pricing?.salePrice}DT / Month` 
              : `${item.pricing?.salePrice}DT`,
            details: type === 'property' 
              ? { bedrooms: item.propertyDetails?.bedrooms, bathrooms: item.propertyDetails?.bathrooms }
              : { year: item.vehicleDetails?.year, mileage: item.vehicleDetails?.mileage }
          },
          offers: []
        });
        groupedOffers.push(itemMap.get(itemId));
      }

      itemMap.get(itemId).offers.push({
        id: offer._id,
        buyer: offer.buyer,
        message: offer.message,
        status: offer.status,
        createdAt: offer.createdAt
      });
    });

    res.json({
      success: true,
      offers: groupedOffers
    });
  } catch (error) {
    logger.error(`Get seller offers error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Accept an offer and create a chat thread
 */
exports.acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const sellerId = req.user._id;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this offer' });
    }

    offer.status = 'accepted';
    await offer.save();

    // Create chat thread between buyer and seller
    try {
      const participants = [
        { userId: offer.buyer, role: 'user' },
        { userId: offer.seller, role: 'user' }
      ];

      const itemTitle = offer.type === 'property' 
        ? (await Property.findById(offer.property))?.title 
        : (await Vehicle.findById(offer.vehicle))?.title;

      await messageService.createThread({
        participants,
        type: 'user_to_user',
        subject: `Offer accepted: ${itemTitle}`,
        metadata: {
          offerId: offer._id,
          itemId: offer.type === 'property' ? offer.property : offer.vehicle,
          itemType: offer.type
        }
      });
      
      // Optionally send a system message or initial message
      // await messageService.sendMessage({ ... });

    } catch (chatError) {
      logger.error(`Error creating chat thread for accepted offer: ${chatError.message}`);
      // Don't fail the whole request if chat creation fails, but maybe log it
    }

    res.json({
      success: true,
      message: 'Offer accepted successfully',
      data: offer
    });
  } catch (error) {
    logger.error(`Accept offer error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Decline an offer
 */
exports.declineOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const sellerId = req.user._id;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to decline this offer' });
    }

    offer.status = 'declined';
    await offer.save();

    res.json({
      success: true,
      message: 'Offer declined successfully',
      data: offer
    });
  } catch (error) {
    logger.error(`Decline offer error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new offer (Buyer action)
 */
exports.createOffer = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { itemId, type, message, price } = req.body;

    if (!itemId || !type) {
      return res.status(400).json({ success: false, message: 'Item ID and type are required' });
    }

    let sellerId;
    if (type === 'property') {
      const property = await Property.findById(itemId);
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
      sellerId = property.owner;
    } else {
      const vehicle = await Vehicle.findById(itemId);
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
      sellerId = vehicle.owner;
    }

    const offer = await Offer.create({
      buyer: buyerId,
      seller: sellerId,
      property: type === 'property' ? itemId : undefined,
      vehicle: type === 'car' ? itemId : undefined,
      type,
      message,
      price
    });

    res.status(201).json({
      success: true,
      message: 'Offer sent successfully',
      data: offer
    });
  } catch (error) {
    logger.error(`Create offer error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * Get all offers made by the authenticated buyer
 */
exports.getBuyerOffers = async (req, res) => {
  try {
    const buyerId = req.user._id;

    const offers = await Offer.find({ buyer: buyerId })
      .populate('seller', 'fullName firstName lastName avatar email')
      .populate('property', 'title pricing media propertyDetails')
      .populate('vehicle', 'title pricing media vehicleDetails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    logger.error(`Get buyer offers error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
