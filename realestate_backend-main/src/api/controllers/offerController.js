const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Availability = require('../models/availabilityModel');
const Property = require('../models/propertyModel');
const Vehicle = require('../models/vehicleModel');

/**
 * Offer Controller
 * Manages offer lifecycle (accept, decline, retrieve)
 */

/**
 * Get all offers for an owner
 * GET /api/offers/owner/:ownerId
 */
exports.getOwnerOffers = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { status, listingType } = req.query;
    const userId = req.user._id;
    
    // Authorization: user can only view their own offers
    if (ownerId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own offers'
      });
    }
    
    const query = { owner: ownerId };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by listing type if provided
    if (listingType) {
      query.listingType = listingType;
    }
    
    const offers = await Booking.find(query)
      .populate('guest', 'firstName lastName email phoneNumber profileImage')
      .populate('property', 'title location media pricing')
      .populate('vehicle', 'title location media pricing')
      .sort({ createdAt: -1 });
    
    // Group offers by status for easier frontend handling
    const groupedOffers = {
      pending: offers.filter(o => o.status === 'pending'),
      accepted: offers.filter(o => o.status === 'accepted'),
      declined: offers.filter(o => o.status === 'declined'),
      cancelled: offers.filter(o => o.status === 'cancelled'),
      all: offers
    };
    
    return res.status(200).json({
      success: true,
      data: groupedOffers,
      count: {
        total: offers.length,
        pending: groupedOffers.pending.length,
        accepted: groupedOffers.accepted.length,
        declined: groupedOffers.declined.length,
        cancelled: groupedOffers.cancelled.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching owner offers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

/**
 * Accept an offer
 * PATCH /api/offers/:id/accept
 */
exports.acceptOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid offer ID'
      });
    }
    
    const booking = await Booking.findById(id)
      .populate('guest', 'firstName lastName email phoneNumber')
      .populate('property', 'title location')
      .populate('vehicle', 'title location');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    // Authorization: only owner can accept offer
    if (booking.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the listing owner can accept this offer'
      });
    }
    
    // Check if offer can be accepted
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending offers can be accepted',
        currentStatus: booking.status
      });
    }
    
    // Check if dates are still available
    const availability = await Availability.findOne({
      listingType: booking.listingType,
      listingId: booking.property || booking.vehicle
    });
    
    if (availability) {
      const isAvailable = availability.isRangeAvailable(booking.startDate, booking.endDate);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Selected dates are no longer available'
        });
      }
    }
    
    // Update booking status
    booking.status = 'accepted';
    booking.acceptedAt = new Date();
    booking.finalPrice = booking.proposedPrice; // Set final price to proposed price
    
    // Generate reference number
    booking.generateReferenceNumber();
    
    await booking.save();
    
    // Block dates in availability
    if (availability) {
      await availability.addBookedRange(booking.startDate, booking.endDate, booking._id);
      console.log(`📅 Dates blocked for booking: ${booking._id}`);
    } else {
      // Create availability record with booked range
      const listingId = booking.property || booking.vehicle;
      await Availability.create({
        listingType: booking.listingType,
        listingId,
        owner: userId,
        defaultAvailable: true,
        availableRanges: [],
        blockedRanges: [],
        bookedRanges: [{
          startDate: booking.startDate,
          endDate: booking.endDate,
          bookingId: booking._id
        }]
      });
      console.log(`📅 Created availability and blocked dates for booking: ${booking._id}`);
    }
    
    console.log(`✅ Offer accepted: ${booking._id}, Reference: ${booking.referenceNumber}`);
    
    return res.status(200).json({
      success: true,
      message: 'Offer accepted successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error accepting offer:', error);
    return res.status(500).json({
      success: false,
      message: 'Error accepting offer',
      error: error.message
    });
  }
};

/**
 * Decline an offer
 * PATCH /api/offers/:id/decline
 */
exports.declineOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid offer ID'
      });
    }
    
    const booking = await Booking.findById(id)
      .populate('guest', 'firstName lastName email phoneNumber')
      .populate('property', 'title')
      .populate('vehicle', 'title');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    // Authorization: only owner can decline offer
    if (booking.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the listing owner can decline this offer'
      });
    }
    
    // Check if offer can be declined
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending offers can be declined',
        currentStatus: booking.status
      });
    }
    
    // Update booking status
    booking.status = 'declined';
    booking.declinedAt = new Date();
    
    // Store decline reason if provided
    if (reason) {
      booking.guestMessage = `${booking.guestMessage || ''}\n\nDecline reason: ${reason}`.trim();
    }
    
    await booking.save();
    
    console.log(`❌ Offer declined: ${booking._id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Offer declined successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error declining offer:', error);
    return res.status(500).json({
      success: false,
      message: 'Error declining offer',
      error: error.message
    });
  }
};

/**
 * Get offer details
 * GET /api/offers/:id
 */
exports.getOfferDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid offer ID'
      });
    }
    
    const booking = await Booking.findById(id)
      .populate('guest', 'firstName lastName email phoneNumber profileImage')
      .populate('owner', 'firstName lastName email phoneNumber profileImage')
      .populate('property', 'title description location media pricing cancellationPolicy capacity')
      .populate('vehicle', 'title description location media pricing cancellationPolicy vehicleDetails.seatingCapacity');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    // Authorization: only guest or owner can view offer details
    if (booking.guest._id.toString() !== userId.toString() && 
        booking.owner._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this offer'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('❌ Error fetching offer details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching offer details',
      error: error.message
    });
  }
};

/**
 * Get receipt data for an accepted offer
 * GET /api/offers/:id/receipt
 */
exports.getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid offer ID'
      });
    }
    
    const booking = await Booking.findById(id)
      .populate('guest', 'firstName lastName email phoneNumber')
      .populate('owner', 'firstName lastName email phoneNumber')
      .populate('property', 'title location pricing cancellationPolicy')
      .populate('vehicle', 'title location pricing cancellationPolicy');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Authorization: only guest or owner can view receipt
    if (booking.guest._id.toString() !== userId.toString() && 
        booking.owner._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this receipt'
      });
    }
    
    // Check if booking is accepted
    if (booking.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Receipt is only available for accepted bookings'
      });
    }
    
    // Get listing details
    const listing = booking.property || booking.vehicle;
    const listingTitle = listing.title;
    const listingLocation = listing.location;
    
    // Calculate duration
    const duration = booking.durationDays;
    
    // Prepare receipt data
    const receiptData = {
      referenceNumber: booking.referenceNumber,
      bookingId: booking._id,
      status: booking.status,
      
      // Dates
      startDate: booking.startDate,
      endDate: booking.endDate,
      duration: `${duration} day${duration > 1 ? 's' : ''}`,
      
      // Listing details
      listingType: booking.listingType,
      listingTitle,
      listingLocation: {
        address: listingLocation.address,
        city: listingLocation.city,
        country: listingLocation.country
      },
      
      // Guest details
      guest: {
        name: `${booking.guest.firstName} ${booking.guest.lastName}`,
        email: booking.guest.email,
        phoneNumber: booking.guest.phoneNumber,
        numberOfGuests: booking.numberOfGuests
      },
      
      // Owner details
      owner: {
        name: `${booking.owner.firstName} ${booking.owner.lastName}`,
        email: booking.owner.email,
        phoneNumber: booking.owner.phoneNumber
      },
      
      // Pricing
      pricing: {
        basePrice: booking.basePrice,
        proposedPrice: booking.proposedPrice,
        finalPrice: booking.finalPrice,
        currency: booking.currency,
        pricePerDay: (booking.finalPrice / duration).toFixed(2)
      },
      
      // Additional info
      specialRequests: booking.specialRequests,
      cancellationPolicy: listing.cancellationPolicy,
      
      // Timestamps
      bookedAt: booking.createdAt,
      acceptedAt: booking.acceptedAt
    };
    
    return res.status(200).json({
      success: true,
      data: receiptData
    });
  } catch (error) {
    console.error('❌ Error generating receipt:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating receipt',
      error: error.message
    });
  }
};

module.exports = exports;
