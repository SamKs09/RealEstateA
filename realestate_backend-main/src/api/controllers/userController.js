const path = require("path");
const fs = require("fs").promises;
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const User = require("../models/userModel");
const Property = require("../models/propertyModel"); // Add these if they exist
const Vehicle = require("../models/vehicleModel");   // Add these if they exist
const { formatPropertyResponse } = require("./propertiesController");
const { formatVehicleResponse } = require("./vehiclesController");

console.log("User controller initialized");

const PACK_BENEFITS = {
  freemium: { listings: 1, boosts: 0 },
  bronze: { listings: 3, boosts: 1 },
  silver: { listings: 10, boosts: 3 },
  gold: { listings: 15, boosts: 5 },
  platinum: { listings: 50, boosts: 10 },
};

const applyPackBenefits = (user, pack) => {
  const normalizedPack = PACK_BENEFITS[pack] ? pack : 'freemium';
  const benefits = PACK_BENEFITS[normalizedPack];

  user.pack = normalizedPack;
  user.listingConfig = {
    status: true,
    number: benefits.listings,
  };
  user.boost = {
    status: benefits.boosts > 0,
    number: benefits.boosts,
  };

  return benefits;
};

const userController = {
  // Purchase or upgrade pack
  purchasePack: async (req, res) => {
    try {
      const { pack } = req.body;
      const allowedPacks = Object.keys(PACK_BENEFITS);
      if (!pack || !allowedPacks.includes(pack)) {
        return res.status(400).json({ success: false, message: 'Invalid pack type.' });
      }
      return res.status(400).json({
        success: false,
        message: 'Direct pack activation is disabled. Start checkout with the payment endpoint instead.',
      });
    } catch (error) {
      logger.error('Pack purchase/upgrade failed', { error });
      return res.status(500).json({ success: false, message: 'Pack purchase/upgrade failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
  },
  
  // Start 7-day free trial
  startTrial: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      
      if (user.trial && user.trial.isUsed) {
        return res.status(400).json({ success: false, message: 'Trial already used.' });
      }

      if (user.pack && user.pack !== 'freemium') {
        return res.status(400).json({ success: false, message: 'Trial is only available before purchasing a paid pack.' });
      }
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);
      
      user.trial = {
        isUsed: true,
        startDate,
        endDate,
        status: 'active'
      };

      // Sanitize role if it's malformed (fix for legacy 'buyer' array issue)
      if (Array.isArray(user.role)) {
        user.role = user.role[0] === 'buyer' ? 'client' : user.role[0];
      }
      if (user.role === 'buyer') user.role = 'client';
      
      user.pack = 'freemium';
      user.listingConfig = { status: true, number: 1 };
      user.boost = { status: true, number: 1 };
      
      await user.save();
      
      return res.json({ 
        success: true, 
        message: '7-day free trial started successfully.', 
        trial: user.trial,
        user: {
          _id: user._id,
          pack: user.pack,
          listingConfig: user.listingConfig,
          boost: user.boost,
          trial: user.trial
        }
      });
    } catch (error) {
      logger.error('Start trial failed', { error });
      return res.status(500).json({ success: false, message: 'Failed to start trial.', error: error.message });
    }
  },

  // Move requires to the top of the file

  completeProfile: async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Request user:", req.user);
      console.log("Request file:", req.file);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation failed", { errors: errors.array() });
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = req.user;
      const {
        firstName,
        lastName,
        phoneNumber,
        email,
        role,
        preferences,
        verification,
        rating,
        isActive,
        lastLogin,
      } = req.body;

      console.log("Extracted fields:", {
        firstName,
        lastName,
        phoneNumber,
        email,
        role,
        preferences,
        verification,
        rating,
        isActive,
        lastLogin
      });

      const updates = {};

      // Input sanitization
      if (firstName) updates.firstName = firstName.trim();
      if (lastName) updates.lastName = lastName.trim();
      if (phoneNumber) updates.phoneNumber = phoneNumber.trim();
      if (email) updates.email = email.trim().toLowerCase();

      // Role (mutually exclusive: client, seller, renter, support, admin)
      if (role) {
        let parsedRole = role;
        if (typeof role === "string") {
          try {
            parsedRole = JSON.parse(role);
          } catch {
            parsedRole = role;
          }
        }
        // Only allow one role, and only seller or renter (not both)
        const allowedRoles = ['client', 'seller', 'renter', 'support', 'admin'];
        if (!allowedRoles.includes(parsedRole)) {
          return res.status(400).json({ success: false, message: "Invalid role specified." });
        }
        // If switching to seller/renter, enforce exclusivity
        if ((parsedRole === 'seller' || parsedRole === 'renter')) {
          updates.role = parsedRole;
        } else {
          updates.role = parsedRole;
        }
        console.log("Processed role:", updates.role);
      }

      // Preferences
      try {
        const prefs = typeof preferences === "string" ? JSON.parse(preferences) : preferences;
        console.log("Raw preferences:", prefs);

        updates.preferences = {
          propertyTypes: prefs.propertyTypes || [],
          vehicleTypes: prefs.vehicleTypes || [],
          priceRange: {
            min: Number(prefs.priceRange?.min ?? 0),
            max: Number(prefs.priceRange?.max ?? 0),
          },
          location: {
            city: prefs.location?.city?.trim() || "",
            state: prefs.location?.state?.trim() || "",
            country: prefs.location?.country?.trim() || "",
            coordinates: {
              latitude: Number(prefs.location?.coordinates?.latitude ?? 0),
              longitude: Number(prefs.location?.coordinates?.longitude ?? 0),
            },
          },
          notifications: {
            email: Boolean(prefs.notifications?.email),
            push: Boolean(prefs.notifications?.push),
            sms: Boolean(prefs.notifications?.sms),
          },
        };
        console.log("Processed preferences:", updates.preferences);
      } catch {
        logger.warn("Failed to parse preferences");
        console.log("Failed to parse preferences, defaulting to empty object");
        updates.preferences = {};
      }

      // Verification
      try {
        const verif = typeof verification === "string" ? JSON.parse(verification) : verification;
        updates.verification = {
          email: Boolean(verif?.email),
          phone: Boolean(verif?.phone),
          identity: Boolean(verif?.identity),
        };
        console.log("Processed verification:", updates.verification);
      } catch {
        logger.warn("Failed to parse verification");
        console.log("Failed to parse verification");
      }

      // Rating
      try {
        const rate = typeof rating === "string" ? JSON.parse(rating) : rating;
        updates.rating = {
          average: typeof rate?.average === "number" ? rate.average : 0,
          count: typeof rate?.count === "number" ? rate.count : 0,
        };
        console.log("Processed rating:", updates.rating);
      } catch {
        logger.warn("Failed to parse rating");
        console.log("Failed to parse rating");
      }

      // Active
      if (typeof isActive !== "undefined") {
        updates.isActive = isActive === "true" || isActive === true;
        console.log("Processed isActive:", updates.isActive);
      }

      // lastLogin
      if (lastLogin) {
        const parsed = new Date(lastLogin);
        if (!isNaN(parsed)) {
          updates.lastLogin = parsed;
          console.log("Processed lastLogin:", updates.lastLogin);
        }
      }

      // Avatar
      if (req.file) {
        updates.avatar = `/images-users/${req.file.filename}`;
        console.log("New avatar path:", updates.avatar);

        if (user.avatar) {
          const oldAvatarPath = path.join(process.cwd(), user.avatar.startsWith('/') ? user.avatar.substring(1) : user.avatar);
          console.log("Old avatar path:", oldAvatarPath);

          try {
            const exists = await fs.access(oldAvatarPath).then(() => true).catch(() => false);
            console.log("Old avatar exists:", exists);

            if (exists) {
              await fs.unlink(oldAvatarPath);
              console.log("Old avatar deleted successfully");
              logger.info(`Old avatar deleted for user ${user._id}`);
            }
          } catch (err) {
            logger.warn(`Failed to delete old avatar: ${err.message}`);
            console.error("Error deleting old avatar:", err);
          }
        }
      }

      updates.profileCompleted = true;
      updates.updatedAt = new Date();
      console.log("Final updates object:", updates);

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password -latestOtp -otpExpiry");

      if (!updatedUser) {
        console.log("User not found with ID:", user._id);
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      console.log("User updated successfully:", updatedUser);
      return res.json({
        success: true,
        message: req.t('profileUpdated'),
        user: updatedUser,
      });
    } catch (error) {
      logger.error("Profile update failed", { error });
      console.error("Profile update failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('profileUpdateFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // GET profile
  getProfile: async (req, res) => {
    try {
      console.log("Getting profile for user:", req.user._id);

      const user = await User.findById(req.user._id).select("-password -latestOtp -otpExpiry");

      if (!user) {
        console.log("User not found with ID:", req.user._id);
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      console.log("Profile retrieved successfully");
      return res.json({
        success: true,
        user: user,
      });
    } catch (error) {
      logger.error("Get profile failed", { error });
      console.error("Get profile failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('profileFetchFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Basic info update (handles name, contact, location and optional avatar)
  updateBasicProfile: async (req, res) => {
    try {
      console.log("Updating basic profile for user:", req.user._id);
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation failed", { errors: errors.array() });
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { firstName, lastName, phoneNumber, email, location } = req.body;
      const updates = {};

      // Input sanitization
      if (firstName !== undefined) updates.firstName = firstName.trim();
      if (lastName !== undefined) updates.lastName = lastName.trim();
      if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
      if (email !== undefined) updates.email = email.trim().toLowerCase();

      // Update fullName if names changed
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const currentUser = await User.findById(req.user._id).select("firstName lastName");
        const fName = updates.firstName !== undefined ? updates.firstName : (currentUser?.firstName || "");
        const lName = updates.lastName !== undefined ? updates.lastName : (currentUser?.lastName || "");
        updates.fullName = `${fName} ${lName}`.trim();
      }

      // Handle location (can be JSON string from FormData or object from JSON request)
      if (location) {
        try {
          const parsedLocation = typeof location === "string" ? JSON.parse(location) : location;
          updates.location = {
            city: parsedLocation.city?.trim() || "",
            country: parsedLocation.country?.trim() || "",
            state: parsedLocation.state?.trim() || "",
            address: parsedLocation.address?.trim() || "",
          };

          // Also update preferences.location for backward compatibility/sync
          updates["preferences.location.city"] = updates.location.city;
          updates["preferences.location.country"] = updates.location.country;
        } catch (e) {
          console.warn("Failed to parse location:", e.message);
        }
      }

      // Handle Avatar (req.file from multer)
      if (req.file) {
        updates.avatar = `/images-users/${req.file.filename}`;
        console.log("New avatar path:", updates.avatar);

        // Delete old avatar
        const currentUser = await User.findById(req.user._id).select("avatar");
        if (currentUser?.avatar) {
          const oldAvatarPath = path.join(process.cwd(), currentUser.avatar.startsWith('/') ? currentUser.avatar.substring(1) : currentUser.avatar);
          try {
            await fs.unlink(oldAvatarPath);
            console.log("Old avatar deleted");
          } catch (err) {
            console.log("Failed to delete old avatar:", err.message);
          }
        }
      }

      updates.updatedAt = new Date();
      console.log("Final profile updates:", updates);

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password -latestOtp -otpExpiry");

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      console.log("Basic profile updated successfully");
      return res.json({
        success: true,
        message: req.t('profileUpdated'),
        user: updatedUser,
      });
    } catch (error) {
      logger.error("Basic profile update failed", { error });
      console.error("Basic profile update failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('basicProfileUpdateFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Preferences update only
  updatePreferences: async (req, res) => {
    try {
      console.log("Updating preferences for user:", req.user._id);
      console.log("Request body:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation failed", { errors: errors.array() });
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { preferences } = req.body;

      if (!preferences) {
        return res.status(400).json({
          success: false,
          message: req.t('preferencesRequired')
        });
      }

      const updates = {};

      try {
        const prefs = typeof preferences === "string" ? JSON.parse(preferences) : preferences;
        console.log("Raw preferences:", prefs);

        updates.preferences = {
          propertyTypes: prefs.propertyTypes || [],
          vehicleTypes: prefs.vehicleTypes || [],
          priceRange: {
            min: Number(prefs.priceRange?.min ?? 0),
            max: Number(prefs.priceRange?.max ?? 0),
          },
          location: {
            city: prefs.location?.city?.trim() || "",
            state: prefs.location?.state?.trim() || "",
            country: prefs.location?.country?.trim() || "",
            coordinates: {
              latitude: Number(prefs.location?.coordinates?.latitude ?? 0),
              longitude: Number(prefs.location?.coordinates?.longitude ?? 0),
            },
          },
          notifications: {
            email: Boolean(prefs.notifications?.email),
            push: Boolean(prefs.notifications?.push),
            sms: Boolean(prefs.notifications?.sms),
          },
        };
        console.log("Processed preferences:", updates.preferences);
      } catch (parseError) {
        logger.warn("Failed to parse preferences", { error: parseError });
        return res.status(400).json({
          success: false,
          message: req.t('invalidPreferencesFormat'),
        });
      }

      updates.updatedAt = new Date();

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password -latestOtp -otpExpiry");

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      console.log(req.t('preferencesUpdated'));
      return res.json({
        success: true,
        message: req.t('preferencesUpdated'),
        user: updatedUser,
      });
    } catch (error) {
      logger.error("Preferences update failed", { error });
      console.error("Preferences update failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('preferencesUpdateFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Avatar upload only
  uploadAvatar: async (req, res) => {
    try {
      console.log("Uploading avatar for user:", req.user._id);
      console.log("Request file:", req.file);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: req.t('noAvatarFile'),
        });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      const updates = {
        avatar: `/images-users/${req.file.filename}`,
        updatedAt: new Date(),
      };

      console.log("New avatar path:", updates.avatar);

      // Delete old avatar if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(process.cwd(), user.avatar.startsWith('/') ? user.avatar.substring(1) : user.avatar);
        console.log("Old avatar path:", oldAvatarPath);

        try {
          const exists = await fs.access(oldAvatarPath).then(() => true).catch(() => false);
          console.log("Old avatar exists:", exists);

          if (exists) {
            await fs.unlink(oldAvatarPath);
            console.log("Old avatar deleted successfully");
            logger.info(`Old avatar deleted for user ${user._id}`);
          }
        } catch (err) {
          logger.warn(`Failed to delete old avatar: ${err.message}`);
          console.error("Error deleting old avatar:", err);
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password -latestOtp -otpExpiry");

      console.log(req.t('avatarUploaded'));
      return res.json({
        success: true,
        message: req.t('avatarUploaded'),
        user: updatedUser,
        avatarUrl: updates.avatar,
      });
    } catch (error) {
      logger.error("Avatar upload failed", { error });
      console.error("Avatar upload failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('avatarUploadFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Get user's property listings
  getUserPropertyListings: async (req, res) => {
    try {
      console.log("Getting property listings for user:", req.user._id);

      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get user with property listings
      const user = await User.findById(req.user._id)
        .populate({
          path: 'propertyListings',
          options: {
            skip: skip,
            limit: parseInt(limit),
            sort: { createdAt: -1 }
          },
          match: status ? { status: status } : {},
          populate: {
            path: 'owner',
            select: 'firstName lastName avatar'
          }
        });

      if (!user) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      const totalListings = user.propertyListings.length;
      const totalPages = Math.ceil(totalListings / parseInt(limit));

      // Format properties to include 'id' instead of '_id' and full media URLs
      const formattedListings = user.propertyListings.map(p => formatPropertyResponse(p, req.user._id));

      console.log(`Found ${formattedListings.length} property listings for user`);
      return res.json({
        success: true,
        listings: formattedListings,
        pagination: {
          page: parseInt(page),
          pages: totalPages,
          limit: parseInt(limit),
          total: totalListings,
        },
      });
    } catch (error) {
      logger.error("Get user property listings failed", { error });
      console.error("Get user property listings failed with error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve property listings",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Get user's vehicle listings
  getUserVehicleListings: async (req, res) => {
    try {
      console.log("Getting vehicle listings for user:", req.user._id);

      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get user with vehicle listings
      const user = await User.findById(req.user._id)
        .populate({
          path: 'vehicleListings',
          options: {
            skip: skip,
            limit: parseInt(limit),
            sort: { createdAt: -1 }
          },
          match: status ? { status: status } : {},
          populate: {
            path: 'owner',
            select: 'firstName lastName avatar'
          }
        });

      if (!user) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      const totalListings = user.vehicleListings.length;
      const totalPages = Math.ceil(totalListings / parseInt(limit));

      const formattedListings = user.vehicleListings.map(v => formatVehicleResponse(v, req.user._id));

      console.log(`Found ${formattedListings.length} vehicle listings for user`);
      return res.json({
        success: true,
        listings: formattedListings,
        pagination: {
          page: parseInt(page),
          pages: totalPages,
          limit: parseInt(limit),
          total: totalListings,
        },
      });
    } catch (error) {
      logger.error("Get user vehicle listings failed", { error });
      console.error("Get user vehicle listings failed with error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve vehicle listings",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Get user's favorite properties with pagination
  getFavoriteProperties: async (req, res) => {
    try {
      console.log("Getting favorite properties for user:", req.user._id);

      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get user with just favoriteProperties array for counting
      const user = await User.findById(req.user._id).select('favoriteProperties');

      if (!user) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      const totalFavorites = user.favoriteProperties.length;
      const totalPages = Math.ceil(totalFavorites / parseInt(limit));

      // Get paginated favorites
      const paginatedFavoriteIds = user.favoriteProperties.slice(skip, skip + parseInt(limit));

      // Only query if Property model exists
      let favorites = [];
      try {
        if (Property) {
          favorites = await Property.find({
            _id: { $in: paginatedFavoriteIds }
          })
            .populate('owner', 'firstName lastName avatar')
            .sort({ createdAt: -1 });
        }
      } catch (err) {
        console.log("Property model not available:", err.message);
        favorites = paginatedFavoriteIds; // Return just IDs if model doesn't exist
      }

      // Format favorites
      const formattedFavorites = favorites.map(f => formatPropertyResponse(f, req.user._id));

      console.log(`Found ${formattedFavorites.length} favorite properties for user (page ${page})`);
      return res.json({
        success: true,
        favorites: formattedFavorites,
        pagination: {
          page: parseInt(page),
          pages: totalPages,
          limit: parseInt(limit),
          total: totalFavorites,
        },
      });
    } catch (error) {
      logger.error("Get favorite properties failed", { error });
      console.error("Get favorite properties failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('favoritePropertiesFetchFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Get user's favorite vehicles with pagination
  getFavoriteVehicles: async (req, res) => {
    try {
      console.log("Getting favorite vehicles for user:", req.user._id);

      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get user with just favoriteVehicles array for counting
      const user = await User.findById(req.user._id).select('favoriteVehicles');

      if (!user) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      const totalFavorites = user.favoriteVehicles.length;
      const totalPages = Math.ceil(totalFavorites / parseInt(limit));

      // Get paginated favorites
      const paginatedFavoriteIds = user.favoriteVehicles.slice(skip, skip + parseInt(limit));

      // Only query if Vehicle model exists
      let favorites = [];
      try {
        if (Vehicle) {
          favorites = await Vehicle.find({
            _id: { $in: paginatedFavoriteIds }
          })
            .populate('owner', 'firstName lastName avatar')
            .sort({ createdAt: -1 });
        }
      } catch (err) {
        console.log("Vehicle model not available:", err.message);
        favorites = paginatedFavoriteIds; // Return just IDs if model doesn't exist
      }

      // Format favorites
      const formattedFavorites = favorites.map(f => formatVehicleResponse(f, req.user._id));

      console.log(`Found ${formattedFavorites.length} favorite vehicles for user (page ${page})`);
      return res.json({
        success: true,
        favorites: formattedFavorites,
        pagination: {
          page: parseInt(page),
          pages: totalPages,
          limit: parseInt(limit),
          total: totalFavorites,
        },
      });
    } catch (error) {
      logger.error("Get favorite vehicles failed", { error });
      console.error("Get favorite vehicles failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('favoriteVehiclesFetchFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Add property to favorites
  addFavoriteProperty: async (req, res) => {
    try {
      const { propertyId } = req.params;
      console.log("Adding favorite property:", propertyId, "for user:", req.user._id);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidPropertyId'),
        });
      }

      // Check if property exists (only if Property model is available)
      try {
        if (Property) {
          const property = await Property.findById(propertyId).select('owner');
          if (!property) {
            return res.status(404).json({
              success: false,
              message: req.t('propertyNotFound'),
            });
          }

          // Check if user owns the property
          if (property.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({
              success: false,
              message: req.t('cannotFavoriteOwnProperty'),
            });
          }
        }
      } catch (err) {
        console.log("Property model not available, skipping validation:", err.message);
      }

      // Use atomic operation to add favorite only if not already present
      const result = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          favoriteProperties: { $ne: propertyId }  // Only update if not already favorite
        },
        { $addToSet: { favoriteProperties: propertyId } },
        { new: true }
      );

      if (!result) {
        // Either user not found or already in favorites
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ success: false, message: req.t('userNotFound') });
        }
        return res.status(400).json({
          success: false,
          message: req.t('propertyAlreadyFavorited'),
        });
      }

      console.log("Favorite property added successfully");
      return res.json({
        success: true,
        message: req.t('addedToFavoriteProperties'),
        favoritesCount: result.favoriteProperties.length,
      });
    } catch (error) {
      logger.error("Add favorite property failed", { error });
      console.error("Add favorite property failed with error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add favorite property",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Add vehicle to favorites
  addFavoriteVehicle: async (req, res) => {
    try {
      const { vehicleId } = req.params;
      console.log("Adding favorite vehicle:", vehicleId, "for user:", req.user._id);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidVehicleId'),
        });
      }

      // Check if vehicle exists (only if Vehicle model is available)
      try {
        if (Vehicle) {
          const vehicle = await Vehicle.findById(vehicleId).select('owner');
          if (!vehicle) {
            return res.status(404).json({
              success: false,
              message: req.t('vehicleNotFound'),
            });
          }

          // Check if user owns the vehicle
          if (vehicle.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({
              success: false,
              message: req.t('cannotFavoriteOwnVehicle'),
            });
          }
        }
      } catch (err) {
        console.log("Vehicle model not available, skipping validation:", err.message);
      }

      // Use atomic operation to add favorite only if not already present
      const result = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          favoriteVehicles: { $ne: vehicleId }  // Only update if not already favorite
        },
        { $addToSet: { favoriteVehicles: vehicleId } },
        { new: true }
      );

      if (!result) {
        // Either user not found or already in favorites
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ success: false, message: req.t('userNotFound') });
        }
        return res.status(400).json({
          success: false,
          message: req.t('vehicleAlreadyFavorited'),
        });
      }

      console.log("Favorite vehicle added successfully");
      return res.json({
        success: true,
        message: req.t('addedToFavoriteVehicles'),
        favoritesCount: result.favoriteVehicles.length,
      });
    } catch (error) {
      logger.error("Add favorite vehicle failed", { error });
      console.error("Add favorite vehicle failed with error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add favorite vehicle",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Remove property from favorites
  removeFavoriteProperty: async (req, res) => {
    try {
      const { propertyId } = req.params;
      console.log("Removing favorite property:", propertyId, "for user:", req.user._id);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidPropertyId'),
        });
      }

      // Use atomic operation to remove favorite only if present
      const result = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          favoriteProperties: propertyId  // Only update if actually in favorites
        },
        { $pull: { favoriteProperties: propertyId } },
        { new: true }
      );

      if (!result) {
        // Either user not found or not in favorites
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ success: false, message: req.t('userNotFound') });
        }
        return res.status(400).json({
          success: false,
          message: req.t('propertyNotInFavorites'),
        });
      }

      console.log("Favorite property removed successfully");
      return res.json({
        success: true,
        message: req.t('removedFromFavoriteProperties'),
        favoritesCount: result.favoriteProperties.length,
      });
    } catch (error) {
      logger.error("Remove favorite property failed", { error });
      console.error("Remove favorite property failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('removeFavoritePropertyFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Remove vehicle from favorites
  removeFavoriteVehicle: async (req, res) => {
    try {
      const { vehicleId } = req.params;
      console.log("Removing favorite vehicle:", vehicleId, "for user:", req.user._id);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidVehicleId'),
        });
      }

      // Use atomic operation to remove favorite only if present
      const result = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          favoriteVehicles: vehicleId  // Only update if actually in favorites
        },
        { $pull: { favoriteVehicles: vehicleId } },
        { new: true }
      );

      if (!result) {
        // Either user not found or not in favorites
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ success: false, message: req.t('userNotFound') });
        }
        return res.status(400).json({
          success: false,
          message: req.t('vehicleNotInFavorites'),
        });
      }

      console.log("Favorite vehicle removed successfully");
      return res.json({
        success: true,
        message: req.t('removedFromFavoriteVehicles'),
        favoritesCount: result.favoriteVehicles.length,
      });
    } catch (error) {
      logger.error("Remove favorite vehicle failed", { error });
      console.error("Remove favorite vehicle failed with error:", error);
      return res.status(500).json({
        success: false,
        message: req.t('removeFavoriteVehicleFailed'),
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Get all favorites (combined properties and vehicles)
  getAllFavorites: async (req, res) => {
    try {
      console.log("Getting all favorites for user:", req.user._id);

      const { page = 1, limit = 10, type } = req.query;

      const user = await User.findById(req.user._id)
        .select('favoriteProperties favoriteVehicles');

      if (!user) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      let allFavorites = [];

      // Get properties if requested or if no type specified
      if (!type || type === 'property') {
        try {
          if (Property && user.favoriteProperties.length > 0) {
            const properties = await Property.find({
              _id: { $in: user.favoriteProperties }
            })
              .populate('owner', 'firstName lastName avatar')
              .sort({ createdAt: -1 })
              .lean();

            // Add type field to distinguish
            const propertiesWithType = properties.map(prop => ({
              ...prop,
              favoriteType: 'property'
            }));
            allFavorites = allFavorites.concat(propertiesWithType);
          }
        } catch (err) {
          console.log("Property model not available:", err.message);
        }
      }

      // Get vehicles if requested or if no type specified
      if (!type || type === 'vehicle') {
        try {
          if (Vehicle && user.favoriteVehicles.length > 0) {
            const vehicles = await Vehicle.find({
              _id: { $in: user.favoriteVehicles }
            })
              .populate('owner', 'firstName lastName avatar')
              .sort({ createdAt: -1 })
              .lean();

            // Add type field to distinguish
            const vehiclesWithType = vehicles.map(vehicle => ({
              ...vehicle,
              favoriteType: 'vehicle'
            }));
            allFavorites = allFavorites.concat(vehiclesWithType);
          }
        } catch (err) {
          console.log("Vehicle model not available:", err.message);
        }
      }

      // Sort all favorites by creation date
      allFavorites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedFavorites = allFavorites.slice(skip, skip + parseInt(limit));
      const totalFavorites = allFavorites.length;
      const totalPages = Math.ceil(totalFavorites / parseInt(limit));

      console.log(`Found ${paginatedFavorites.length} total favorites for user (page ${page})`);
      return res.json({
        success: true,
        favorites: paginatedFavorites,
        pagination: {
          page: parseInt(page),
          pages: totalPages,
          limit: parseInt(limit),
          total: totalFavorites,
        },
        summary: {
          totalProperties: user.favoriteProperties.length,
          totalVehicles: user.favoriteVehicles.length,
          totalFavorites: totalFavorites
        }
      });
    } catch (error) {
      logger.error("Get all favorites failed", { error });
      console.error("Get all favorites failed with error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve favorites",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      console.log("Changing password for user:", req.user._id);

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: req.t('currentAndNewPasswordRequired'),
        });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: req.t('userNotFound') });
      }

      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: req.t('incorrectCurrentPassword'),
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
      user.updatedAt = new Date();
      await user.save();

      console.log(req.t('passwordChanged'));
      return res.json({
        success: true,
        message: req.t('passwordChanged'),
      });
    } catch (error) {
      logger.error("Change password failed", { error });
      return res.status(500).json({
        success: false,
        message: req.t('passwordChangeFailed'),
      });
    }
  },
  // Get public profile of another user
  getPublicProfile: async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Getting public profile for user:", id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid User ID format" });
      }

      const user = await User.findById(id).select("firstName lastName avatar role location preferences rating createdAt");

      if (!user) {
        console.log("User not found with ID:", id);
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Convert to a plain object and add helpful fields
      const userObj = user.toObject();
      userObj.name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

      console.log("Public profile retrieved successfully");
      return res.json({
        success: true,
        user: userObj,
      });
    } catch (error) {
      logger.error("Get public profile failed", { error });
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve public profile",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = userController;
