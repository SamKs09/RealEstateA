const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Availability = require('../models/availabilityModel');
const Cancellation = require('../models/cancellationModel');
const Property = require('../models/propertyModel');
const Vehicle = require('../models/vehicleModel');
const ChatThread = require('../models/chatThreadModel');
const { sendNotification } = require('../utils/notificationHelper');
const { getTemplate } = require('../utils/notificationTemplates');

/**
 * Booking Controller
 * Handles booking creation, retrieval, cancellation, and modifications
 */

/**
 * Create a new booking offer
 * POST /api/bookings/create
 */
exports.createBooking = async (req, res) => {
  try {
    const {
      listingId,
      listingType,
      startDate,
      endDate,
      numberOfGuests,
      proposedPrice,
      guestMessage,
      specialRequests
    } = req.body;
    
    const guestId = req.user._id;
    
    console.log(`📝 Creating booking - Guest: ${guestId}, Listing: ${listingId}, Type: ${listingType}`);
    
    // Validate required fields
    if (!listingId || !listingType || !startDate || !endDate || !numberOfGuests || !proposedPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: [{ field: 'required', message: 'listingId, listingType, startDate, endDate, numberOfGuests, and proposedPrice are required' }]
      });
    }
    
    // Validate listingType
    if (!['property', 'vehicle'].includes(listingType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing type',
        errors: [{ field: 'listingType', message: 'Listing type must be property or vehicle' }]
      });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Compare date-only (ignore time) so selecting today is valid
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);
    
    if (startDay < today) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
        errors: [{ field: 'startDate', message: 'Start date cannot be in the past' }]
      });
    }
    
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
        errors: [{ field: 'endDate', message: 'End date must be after start date' }]
      });
    }
    
    // Validate price
    if (proposedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price',
        errors: [{ field: 'proposedPrice', message: 'Proposed price must be greater than zero' }]
      });
    }
    
    // Validate number of guests
    if (numberOfGuests < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of guests',
        errors: [{ field: 'numberOfGuests', message: 'Number of guests must be at least 1' }]
      });
    }
    
    // Find the listing and verify it exists
    let listing;
    let ownerId;
    
    if (listingType === 'property') {
      listing = await Property.findById(listingId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      ownerId = listing.owner;
      
      // Validate capacity
      if (listing.capacity && numberOfGuests > listing.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Number of guests exceeds property capacity',
          errors: [{ field: 'numberOfGuests', message: `Maximum capacity is ${listing.capacity} guests` }]
        });
      }
    } else {
      listing = await Vehicle.findById(listingId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }
      ownerId = listing.owner;
      
      // Validate seating capacity
      if (listing.vehicleDetails?.seatingCapacity && numberOfGuests > listing.vehicleDetails.seatingCapacity) {
        return res.status(400).json({
          success: false,
          message: 'Number of guests exceeds vehicle seating capacity',
          errors: [{ field: 'numberOfGuests', message: `Maximum seating capacity is ${listing.vehicleDetails.seatingCapacity} guests` }]
        });
      }
    }
    
    // Check if guest is trying to book their own listing
    if (ownerId.toString() === guestId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own listing'
      });
    }
    
    // Check availability
    let availability = await Availability.findOne({
      listingType,
      listingId
    });
    
    if (availability) {
      // Validate rental duration
      const durationValidation = availability.validateRentalDuration(startDate, endDate);
      if (!durationValidation.valid) {
        return res.status(400).json({
          success: false,
          message: durationValidation.reason,
          errors: [{ field: 'dates', message: durationValidation.reason }]
        });
      }
      
      // Check if dates are available
      const isAvailable = availability.isRangeAvailable(startDate, endDate);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Selected dates are not available',
          errors: [{ field: 'dates', message: 'The selected dates are already booked or blocked' }]
        });
      }
    }
    
    // Get base price from listing
    const basePrice = listingType === 'property' 
      ? (listing.pricing?.rentPrice || proposedPrice)
      : (listing.pricing?.rentPrice || proposedPrice);
    
    // Create booking document
    const bookingData = {
      guest: guestId,
      owner: ownerId,
      listingType,
      startDate,
      endDate,
      numberOfGuests,
      basePrice,
      proposedPrice,
      guestMessage,
      specialRequests,
      status: 'pending'
    };
    
    // Set property or vehicle reference
    if (listingType === 'property') {
      bookingData.property = listingId;
    } else {
      bookingData.vehicle = listingId;
    }
    
    const booking = await Booking.create(bookingData);
    
    // Create or get chat thread between guest and owner
    let chatThread = await ChatThread.findOne({
      type: 'user_to_user',
      'participants.userId': { $all: [guestId, ownerId] }
    });
    
    if (!chatThread) {
      chatThread = await ChatThread.create({
        type: 'user_to_user',
        participants: [
          { userId: guestId, role: 'user' },
          { userId: ownerId, role: 'user' }
        ],
        subject: `Booking: ${listingType}`,
        category: listingType === 'vehicle' ? 'vehicle' : 'property',
      });
      console.log(`💬 Created new chat thread: ${chatThread._id}`);
    } else {
      console.log(`💬 Using existing chat thread: ${chatThread._id}`);
    }
    
    // Link chat thread to booking
    booking.chatThreadId = chatThread._id;
    await booking.save();
    
    // Populate booking details for response
    await booking.populate([
      { path: 'guest', select: 'firstName lastName email phoneNumber profileImage' },
      { path: 'owner', select: 'firstName lastName email phoneNumber profileImage' },
      { path: listingType, select: 'title location media pricing' }
    ]);
    
    console.log(`✅ Booking created successfully: ${booking._id}`);

    // Notify owner of new booking request
    try {
      const listingTitle = listing.title || (listingType === 'property' ? 'Property' : 'Vehicle');
      const guestName = `${booking.guest.firstName || ''} ${booking.guest.lastName || ''}`.trim();
      const tpl = getTemplate('booking_new_request', guestName, listingTitle);
      await sendNotification(
        ownerId,
        'booking',
        tpl.title,
        tpl.body,
        { deepLink: '/(tabs)/Bookings', relatedId: booking._id.toString() }
      );
    } catch (notifErr) {
      console.error('⚠️ Failed to send booking request notification:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking offer created successfully',
      data: {
        booking,
        chatThreadId: chatThread._id
      }
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    const booking = await Booking.findById(id)
      .populate('guest', 'firstName lastName email phoneNumber profileImage')
      .populate('owner', 'firstName lastName email phoneNumber profileImage')
      .populate('property', 'title location media pricing cancellationPolicy')
      .populate('vehicle', 'title location media pricing cancellationPolicy');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Authorization: only guest or owner can view booking
    if (booking.guest._id.toString() !== userId.toString() && 
        booking.owner._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this booking'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

/**
 * Get guest's bookings
 * GET /api/bookings/guest/:guestId
 */
exports.getGuestBookings = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { status } = req.query;
    const userId = req.user._id;
    
    // Authorization: user can only view their own bookings
    if (guestId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own bookings'
      });
    }
    
    const query = { guest: guestId };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('owner', 'firstName lastName email phoneNumber profileImage')
      .populate('property', 'title location media pricing')
      .populate('vehicle', 'title location media pricing')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('❌ Error fetching guest bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

/**
 * Get owner's bookings
 * GET /api/bookings/owner/:ownerId
 */
exports.getOwnerBookings = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { status } = req.query;
    const userId = req.user._id;
    
    // Authorization: user can only view their own bookings
    if (ownerId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own bookings'
      });
    }
    
    const query = { owner: ownerId };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('guest', 'firstName lastName email phoneNumber profileImage')
      .populate('property', 'title location media pricing')
      .populate('vehicle', 'title location media pricing')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('❌ Error fetching owner bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

/**
 * Cancel a booking
 * PATCH /api/bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, comments } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    // Validate reason
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required',
        errors: [{ field: 'reason', message: 'Please select a cancellation reason' }]
      });
    }
    
    const validReasons = ['change_of_plans', 'found_alternative', 'price_concerns', 
                          'property_issues', 'emergency', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cancellation reason',
        errors: [{ field: 'reason', message: 'Please select a valid cancellation reason' }]
      });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Authorization: only guest can cancel
    if (booking.guest.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the guest can cancel this booking'
      });
    }
    
    // Check if booking can be cancelled
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'This booking cannot be cancelled',
        errors: [{ field: 'status', message: `Bookings with status '${booking.status}' cannot be cancelled` }]
      });
    }
    
    // Create cancellation record
    const cancellation = await Cancellation.createFromBooking(
      booking,
      userId,
      'guest',
      reason,
      comments
    );
    
    // Capture accepted state before mutating status
    const wasAccepted = booking.status === 'accepted';
    
    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancellationComments = comments;
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;
    await booking.save();
    
    // Restore availability if booking was previously accepted
    if (wasAccepted) {
      const availability = await Availability.findOne({
        listingType: booking.listingType,
        listingId: booking.property || booking.vehicle
      });
      
      if (availability) {
        await availability.removeBookedRange(booking._id);
        console.log(`📅 Availability restored for booking: ${booking._id}`);
      }
    }
    
    console.log(`❌ Booking cancelled: ${booking._id}, Reason: ${reason}`);
    
    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        cancellation
      }
    });
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

/**
 * Request booking modification
 * PATCH /api/bookings/:id/modify
 */
exports.requestModification = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStartDate, newEndDate, reason } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Authorization: only guest can request modification
    if (booking.guest.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the guest can request modifications'
      });
    }
    
    // Check if booking can be modified
    if (booking.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only accepted bookings can be modified'
      });
    }
    
    // Store original booking details in modification history
    booking.modificationHistory.push({
      originalStartDate: booking.startDate,
      originalEndDate: booking.endDate,
      originalPrice: booking.finalPrice || booking.proposedPrice,
      modifiedAt: new Date(),
      modifiedBy: userId,
      reason: reason || 'Date change requested'
    });
    
    // Update booking status
    booking.status = 'modification_requested';
    
    // Store new dates if provided (pending owner approval)
    if (newStartDate) booking.startDate = newStartDate;
    if (newEndDate) booking.endDate = newEndDate;
    
    await booking.save();
    
    console.log(`🔄 Modification requested for booking: ${booking._id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Modification request submitted successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error requesting modification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error requesting modification',
      error: error.message
    });
  }
};

/**
 * Accept a booking offer (owner only)
 * PATCH /api/bookings/:id/accept
 */
exports.acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPrice } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the owner can accept
    if (booking.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the listing owner can accept bookings' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a booking with status '${booking.status}'`
      });
    }

    // Double-check availability before accepting
    const listingId = booking.property || booking.vehicle;
    const availability = await Availability.findOne({ listingType: booking.listingType, listingId });
    if (availability) {
      const isAvailable = availability.isRangeAvailable(booking.startDate, booking.endDate);
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: 'These dates are no longer available'
        });
      }
    }

    booking.status = 'accepted';
    booking.acceptedAt = new Date();
    if (finalPrice !== undefined) booking.finalPrice = finalPrice;
    booking.generateReferenceNumber();
    await booking.save();

    // Block the dates in Availability
    if (availability) {
      await availability.addBookedRange(booking.startDate, booking.endDate, booking._id);
      console.log(`📅 Booked range added to Availability for booking: ${booking._id}`);
    }

    await booking.populate([
      { path: 'guest', select: 'firstName lastName email phoneNumber' },
      { path: 'owner', select: 'firstName lastName email phoneNumber' },
    ]);

    console.log(`✅ Booking accepted: ${booking._id} (ref: ${booking.referenceNumber})`);

    // Notify guest that booking was accepted
    try {
      const listingId = booking.property || booking.vehicle;
      let listingTitle = booking.listingType;
      if (listingId) {
        const ListingModel = booking.listingType === 'property' ? Property : Vehicle;
        const listingDoc = await ListingModel.findById(listingId).select('title');
        if (listingDoc) listingTitle = listingDoc.title;
      }
      const tpl = getTemplate('booking_accepted', listingTitle);
      await sendNotification(
        booking.guest._id || booking.guest,
        'booking',
        tpl.title,
        tpl.body,
        { deepLink: `/booking/${booking._id}`, relatedId: booking._id.toString() }
      );
    } catch (notifErr) {
      console.error('⚠️ Failed to send booking accepted notification:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error accepting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error accepting booking',
      error: error.message
    });
  }
};

/**
 * Decline a booking offer (owner only)
 * PATCH /api/bookings/:id/decline
 */
exports.declineBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the owner can decline
    if (booking.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the listing owner can decline bookings' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot decline a booking with status '${booking.status}'`
      });
    }

    booking.status = 'declined';
    booking.declinedAt = new Date();
    if (reason) {
      booking.cancellationComments = reason;
      booking.cancelledBy = userId;
    }
    await booking.save();

    console.log(`❌ Booking declined: ${booking._id}`);

    // Notify guest that booking was declined
    try {
      const listingId = booking.property || booking.vehicle;
      let listingTitle = booking.listingType;
      if (listingId) {
        const ListingModel = booking.listingType === 'property' ? Property : Vehicle;
        const listingDoc = await ListingModel.findById(listingId).select('title');
        if (listingDoc) listingTitle = listingDoc.title;
      }
      const tpl = getTemplate('booking_declined', listingTitle);
      await sendNotification(
        booking.guest,
        'booking',
        tpl.title,
        tpl.body,
        { deepLink: `/booking/${booking._id}`, relatedId: booking._id.toString() }
      );
    } catch (notifErr) {
      console.error('⚠️ Failed to send booking declined notification:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking declined',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error declining booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error declining booking',
      error: error.message
    });
  }
};

module.exports = exports;
