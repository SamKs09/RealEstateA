// Stub for unlockVehicleMedia
exports.unlockVehicleMedia = async (req, res) => {
  // Implement your logic here
  return res.status(200).json({
    success: true,
    message: 'unlockVehicleMedia endpoint is not yet implemented.'
  });
};
const Availability = require("../models/availabilityModel");
const Vehicle = require("../models/vehicleModel");
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");

// Helper functions
const handleError = (res, error, statusCode = 400) => {
  console.error(error);
  res.status(statusCode).json({
    success: false,
    message: error.message
  });
};

const PACK_LIMITS = {
  freemium: 1,
  bronze: 3,
  silver: 10,
  gold: 15,
  platinum: 50,
};

const BOOST_PLANS = {
  '1day': { duration: 1, cost: 1, label: '1 day boost', visibility: 'Top of search' },
  '3day': { duration: 3, cost: 1, label: '3 day boost', visibility: 'Top of search' },
  '7day': { duration: 7, cost: 1, label: '7 day boost', visibility: 'Top of search' },
};

const isPromotionCurrentlyActive = (item) => {
  if (!item?.isPromoted || !item?.promotionExpiry) {
    return false;
  }

  return new Date(item.promotionExpiry).getTime() > Date.now();
};

const clearExpiredVehiclePromotions = async () => {
  await Vehicle.updateMany(
    {
      isPromoted: true,
      promotionExpiry: { $lte: new Date() },
    },
    {
      $set: {
        isPromoted: false,
        boostPlan: null,
      },
      $unset: {
        promotionExpiry: 1,
      },
    },
  );
};

const formatVehicleResponse = (vehicle, currentUserId) => {
  if (!vehicle) return null;

  // Convert mongoose document to object if needed
  const vehicleObj = vehicle.toObject ? vehicle.toObject() : vehicle;

  // Helper function to convert relative paths to full URLs
  const toFullUrl = (path) => {
    if (!path) return path;
    const baseUrl = process.env.API_URL || 'http://172.20.10.6:3000';

    if (path.startsWith('http')) {
      try {
        const url = new URL(path);
        let pathname = url.pathname;

        // Check if it's our local media
        const isLocalMedia = pathname.startsWith('/uploads') || pathname.startsWith('/images-users');
        
        if (isLocalMedia) {
          // Fix potentially broken paths (e.g. /uploads/filename.jpg instead of /uploads/vehicles/images/filename.jpg)
          if (pathname.startsWith('/uploads/') && !pathname.includes('/properties/') && !pathname.includes('/vehicles/')) {
            // For vehicles, we check the context or just default to properties if ambiguous, but here it's vehiclesController
            pathname = `/uploads/vehicles/images${pathname.replace('/uploads', '')}`;
          }
          // Return fresh URL with current baseUrl
          return `${baseUrl}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
        }
      } catch (err) {
        // Fallback for invalid URLs
      }
      return path;
    }

    // Clean relative path
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // Check for missing prefix
    const hasUploadsPrefix = cleanPath.startsWith('uploads/') || cleanPath.startsWith('images-users/');
    if (!hasUploadsPrefix) {
      // Default to vehicle images if no prefix
      return `${baseUrl}/uploads/vehicles/images/${cleanPath}`;
    }

    return `${baseUrl}/${cleanPath}`;
  };

  const allImages = vehicleObj.media?.images?.map(toFullUrl) || [];
  const allVideos = vehicleObj.media?.videos?.map(toFullUrl) || [];
  const allDocs = vehicleObj.media?.documents?.map(toFullUrl) || [];

  // Determine if media is locked
  const ownerId = vehicleObj.owner && (vehicleObj.owner._id || vehicleObj.owner);
  const isOwner = !!(currentUserId && ownerId && String(ownerId) === String(currentUserId));
  const media = {
    images: allImages,
    videos: allVideos,
    documents: allDocs,
    totalImagesCount: allImages.length,
    totalVideosCount: allVideos.length,
    hasVideo: allVideos.length > 0,
    isLocked: false
  };

  return {
    ...vehicleObj,
    owner: vehicleObj.owner,
    media: media,
    isLocked: false,
    isPromoted: isPromotionCurrentlyActive(vehicleObj),
    promotionExpiry: isPromotionCurrentlyActive(vehicleObj) ? vehicleObj.promotionExpiry : null,
    boostPlan: isPromotionCurrentlyActive(vehicleObj) ? vehicleObj.boostPlan || null : null,
  };
};

exports.formatVehicleResponse = formatVehicleResponse;

const validateVehicleData = (data) => {
  const errors = [];

  // Required fields validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  if (!data.type) {
    errors.push('Vehicle type is required');
  }
  if (!data.listingType) {
    errors.push('Listing type (sale/rent) is required');
  }

  // Vehicle details validation
  if (!data.vehicleDetails) {
    errors.push('Vehicle details are required');
  } else {
    if (!data.vehicleDetails.make || data.vehicleDetails.make.trim().length === 0) {
      errors.push('Vehicle make is required');
    }
    if (!data.vehicleDetails.model || data.vehicleDetails.model.trim().length === 0) {
      errors.push('Vehicle model is required');
    }
    if (!data.vehicleDetails.year) {
      errors.push('Vehicle year is required');
    } else {
      const year = parseInt(data.vehicleDetails.year);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        errors.push(`Vehicle year must be between 1900 and ${currentYear + 1}`);
      }
    }
  }

  // Pricing validation
  if (!data.pricing) {
    errors.push('Pricing information is required');
  } else {
    if (data.listingType === 'sale') {
      if (!data.pricing.salePrice || data.pricing.salePrice <= 0) {
        errors.push('Sale price is required and must be greater than 0');
      }
    }
    if (data.listingType === 'rent') {
      if (!data.pricing.rentPrice || data.pricing.rentPrice <= 0) {
        errors.push('Rent price is required and must be greater than 0');
      }
      if (!data.pricing.rentPeriod) {
        errors.push('Rent period is required for rental listings');
      }
    }
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.errors = errors;
    throw error;
  }
};

const validatePricing = (listingType, pricing) => {
  if (listingType === 'sale' && !pricing.salePrice) {
    throw new Error('Sale price is required for sale listings');
  }
  if (listingType === 'rent' && (!pricing.rentPrice || !pricing.rentPeriod)) {
    throw new Error('Rent price and period are required for rental listings');
  }
};

// Vehicle CRUD Operations
exports.createVehicle = async (req, res) => {
  try {
    console.log('📝 Creating vehicle with data:', JSON.stringify(req.body, null, 2));

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userPack = user.pack || 'freemium';
    const maxListings = user.listingConfig?.number || PACK_LIMITS[userPack] || 1;
    const currentListings = (user.propertyListings?.length || 0) + (user.vehicleListings?.length || 0);

    if (currentListings >= maxListings) {
      return res.status(403).json({
        success: false,
        message: `Your current pack ('${userPack}') allows posting up to ${maxListings} listings. Upgrade your pack to add more listings.`,
      });
    }

    // Validate vehicle data
    validateVehicleData(req.body);

    const { listingType, pricing, location } = req.body;
    validatePricing(listingType, pricing || {});

    // Prepare vehicle data
    const vehicleData = {
      ...req.body,
      owner: req.user.id,
      status: 'active'
    };

    // If location coordinates are provided, use them
    if (location && location.coordinates) {
      vehicleData.location = {
        ...location,
        coordinates: {
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude
        }
      };
    } else if (location) {
      // Ensure location has required fields
      if (!location.city || !location.country) {
        return res.status(400).json({
          success: false,
          message: 'Location must include city and country'
        });
      }
      vehicleData.location = location;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Location information is required'
      });
    }

    console.log('✅ Vehicle data validated, creating in database...');
    const vehicle = await Vehicle.create(vehicleData);

    console.log('✅ Vehicle created successfully:', vehicle._id);

    // Auto-create Availability document for this vehicle
    try {
      await Availability.create({
        listingType: 'vehicle',
        listingId: vehicle._id,
        owner: req.user.id,
        defaultAvailable: true,
        availableRanges: [],
        blockedRanges: [],
        bookedRanges: [],
        minRentalDays: 1,
      });
      console.log(`📅 Auto-created Availability for vehicle: ${vehicle._id}`);
    } catch (availErr) {
      console.warn('⚠️ Could not auto-create Availability for vehicle:', availErr.message);
    }

    // Add vehicle to user's vehicleListings array
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { vehicleListings: vehicle._id } },
      { new: true }
    );
    console.log('✅ Vehicle added to user vehicleListings');

    // Populate owner information before sending response
    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('owner', 'name email phone');

    res.status(201).json({
      success: true,
      message: req.t('vehicleCreated'),
      data: formatVehicleResponse(populatedVehicle, req.user?.id)
    });
  } catch (error) {
    console.error('❌ Error creating vehicle:', error);
    handleError(res, error);
  }
};

exports.getVehicle = async (req, res) => {
  try {
    await clearExpiredVehiclePromotions();

    // Increment views
    await Vehicle.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('likes', 'name');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: req.t('vehicleNotFound')
      });
    }

    res.status(200).json({
      success: true,
      data: formatVehicleResponse(vehicle, req.user?.id)
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { listingType, pricing } = req.body;
    if (listingType || pricing) {
      validatePricing(listingType || 'sale', pricing || {});
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: req.t('vehicleNotFound')
      });
    }

    // Sync Availability.defaultAvailable if availability.isAvailable changed
    if (req.body.availability?.isAvailable !== undefined) {
      await Availability.findOneAndUpdate(
        { listingType: 'vehicle', listingId: req.params.id },
        { defaultAvailable: req.body.availability.isAvailable }
      ).catch(err => console.warn('⚠️ Could not sync Availability on vehicle update:', err.message));
    }

    res.status(200).json({
      success: true,
      data: formatVehicleResponse(vehicle, req.user?.id)
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: req.t('vehicleNotFound')
      });
    }

    // Remove vehicle from user's vehicleListings array
    await User.findByIdAndUpdate(
      vehicle.owner,
      { $pull: { vehicleListings: req.params.id } },
      { new: true }
    );
    console.log('✅ Vehicle removed from user vehicleListings');

    // Delete associated media files
    ['images', 'videos', 'documents'].forEach(type => {
      vehicle.media[type]?.forEach(fileUrl => {
        const filename = fileUrl.split('/').pop();
        const filePath = path.join(__dirname, `../uploads/vehicles/${type}`, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });

    res.status(200).json({
      success: true,
      message: req.t('vehicleDeleted')
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Vehicle Media Operations
exports.addMedia = async (req, res) => {
  try {
    console.log('📤 addMedia - Vehicle ID:', req.params.id);
    console.log('📤 Files received:', req.files ? req.files.length : 0);

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: req.t('vehicleNotFound') || 'Vehicle not found'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Process uploaded files - all files come as array in req.files
    const imageUrls = req.files.map(file => {
      // Return relative path that will be converted to full URL by formatVehicleResponse
      return `/uploads/vehicles/images/${file.filename}`;
    });

    console.log('✅ Image URLs:', imageUrls);

    // Add images to vehicle
    vehicle.media.images.push(...imageUrls);
    await vehicle.save();

    console.log('✅ Vehicle media updated successfully');

    res.status(200).json({
      success: true,
      data: vehicle.media,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Error in addMedia:', error);
    handleError(res, error, 500);
  }
};

exports.removeMedia = async (req, res) => {
  try {
    const { mediaType = 'images' } = req.query;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: req.t('vehicleNotFound')
      });
    }

    const mediaItem = vehicle.media[mediaType].id(req.params.mediaId);
    if (!mediaItem) {
      return res.status(404).json({
        success: false,
        message: req.t('mediaNotFound')
      });
    }

    // Delete physical file
    const filename = mediaItem.url.split('/').pop();
    const filePath = path.join(__dirname, `../uploads/vehicles/${mediaType}`, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    mediaItem.remove();
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: req.t('mediaRemoved')
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Vehicle Interactions
exports.likeVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: req.t('vehicleNotFound')
      });
    }

    if (vehicle.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: req.t('vehicleAlreadyLiked')
      });
    }

    vehicle.likes.push(req.user.id);
    await vehicle.save();

    res.status(200).json({
      success: true,
      data: vehicle.likes
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.unlikeVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: req.t('vehicleNotFound')
      });
    }

    const likeIndex = vehicle.likes.indexOf(req.user.id);
    if (likeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: req.t('vehicleNotLiked')
      });
    }

    vehicle.likes.splice(likeIndex, 1);
    await vehicle.save();

    res.status(200).json({
      success: true,
      data: vehicle.likes
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Search and Availability
exports.searchVehicles = async (req, res) => {
  try {
    await clearExpiredVehiclePromotions();

    const {
      type,
      listingType,
      make,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      fuelType,
      transmission,
      location,
      keyword,
      status = 'active',
      page = 1,
      limit = 10
    } = req.query;

    const query = { status };
    const andConditions = [];

    if (type) query.type = type;
    if (listingType) query.listingType = listingType;
    
    // Enhanced make search - check both make and model fields (in case data was entered incorrectly)
    if (make) {
      andConditions.push({
        $or: [
          { 'vehicleDetails.make': new RegExp(make, 'i') },
          { 'vehicleDetails.model': new RegExp(make, 'i') }
        ]
      });
    }
    
    if (model && !make) {
      query['vehicleDetails.model'] = new RegExp(model, 'i');
    }
    
    if (minYear || maxYear) {
      query['vehicleDetails.year'] = {};
      if (minYear) query['vehicleDetails.year'].$gte = Number(minYear);
      if (maxYear) query['vehicleDetails.year'].$lte = Number(maxYear);
    }
    if (fuelType) {
      const fuelArray = Array.isArray(fuelType) ? fuelType : fuelType.split(',');
      query['vehicleDetails.fuelType'] = { $in: fuelArray };
    }
    if (transmission) {
      const transArray = Array.isArray(transmission) ? transmission : transmission.split(',');
      query['vehicleDetails.transmission'] = { $in: transArray };
    }
    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }

    // Handle pricing filters
    if (listingType) {
      const priceField = listingType === 'rent' ? 'pricing.rentPrice' : 'pricing.salePrice';
      if (minPrice || maxPrice) {
        query[priceField] = {};
        if (minPrice) query[priceField].$gte = Number(minPrice);
        if (maxPrice) query[priceField].$lte = Number(maxPrice);
      }
    } else if (minPrice || maxPrice) {
      andConditions.push({
        $or: [
          { 'pricing.salePrice': { $gte: Number(minPrice || 0), $lte: Number(maxPrice || 1000000) } },
          { 'pricing.rentPrice': { $gte: Number(minPrice || 0), $lte: Number(maxPrice || 1000000) } }
        ]
      });
    }

    if (keyword) {
      andConditions.push({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { 'vehicleDetails.make': { $regex: keyword, $options: 'i' } },
          { 'vehicleDetails.model': { $regex: keyword, $options: 'i' } }
        ]
      });
    }

    // Combine all conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    console.log('🔍 Vehicle search query:', JSON.stringify(query, null, 2));

    const vehicles = await Vehicle.find(query)
      .sort({ isPromoted: -1, promotionExpiry: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('owner', 'name phone');

    const total = await Vehicle.countDocuments(query);

    console.log(`✅ Found ${vehicles.length} vehicles (total: ${total})`);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      data: vehicles.map(v => formatVehicleResponse(v, req.user?.id))
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.boostVehicle = async (req, res) => {
  try {
    await clearExpiredVehiclePromotions();

    const { id } = req.params;
    const { boostPlan } = req.body;
    const userId = req.user.id;

    if (!boostPlan || !BOOST_PLANS[boostPlan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid boost plan. Choose 1day, 3day, or 7day.',
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    if (String(vehicle.owner) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to boost this vehicle.',
      });
    }

    if (vehicle.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active listings can be boosted.',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.boost?.number || user.boost.number <= 0) {
      return res.status(403).json({
        success: false,
        message: 'No boosts remaining on your current pack. Purchase a new pack or start a trial to boost this listing.',
      });
    }

    const plan = BOOST_PLANS[boostPlan];
    const now = new Date();
    const expiryDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    user.boost.number -= 1;
    user.boost.status = user.boost.number > 0;
    await user.save();

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      {
        $set: {
          isPromoted: true,
          promotionExpiry: expiryDate,
          boostPlan,
        },
      },
      { new: true, runValidators: true },
    ).populate('owner', 'name email phone');

    res.status(200).json({
      success: true,
      message: `Listing boosted successfully with ${plan.label}!`,
      data: {
        vehicle: formatVehicleResponse(updatedVehicle, userId),
        boost: {
          plan: boostPlan,
          label: plan.label,
          expiryDate,
          cost: plan.cost,
        },
        user: {
          _id: user._id,
          pack: user.pack,
          boost: user.boost,
          listingConfig: user.listingConfig,
          trial: user.trial,
        },
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user's vehicles
exports.getUserVehicles = async (req, res) => {
  try {
    await clearExpiredVehiclePromotions();

    console.log('🚗 getUserVehicles called for user:', req.user.id);
    const { page = 1, limit = 10, status } = req.query;

    const query = { owner: req.user.id };
    if (status) {
      query.status = status;
    }

    console.log('🔍 Query:', JSON.stringify(query));

    const vehicles = await Vehicle.find(query)
      .sort({ isPromoted: -1, promotionExpiry: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('owner', 'name email phone');

    const total = await Vehicle.countDocuments(query);

    console.log(`✅ Found ${vehicles.length} vehicles (total: ${total})`);
    
    const formattedVehicles = vehicles.map(v => formatVehicleResponse(v, req.user?.id));
    console.log('📦 Formatted vehicles:', JSON.stringify(formattedVehicles, null, 2));

    const responseData = {
      success: true,
      count: vehicles.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      data: formattedVehicles
    };

    console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));

    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Error in getUserVehicles:', error);
    handleError(res, error);
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable, availableFrom, availableTo, minRentPeriod, maxRentPeriod } = req.body;

    if (availableFrom && availableTo && new Date(availableFrom) >= new Date(availableTo)) {
      return res.status(400).json({
        success: false,
        message: req.t('invalidDateRange')
      });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        availability: {
          isAvailable,
          availableFrom,
          availableTo,
          minRentPeriod,
          maxRentPeriod
        }
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: req.t('vehicleNotFound')
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle.availability
    });
  } catch (error) {
    handleError(res, error);
  }
};


