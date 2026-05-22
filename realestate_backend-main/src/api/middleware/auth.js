const Merchants = require("../models/userModel");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(402).json({
        success: false,
        message: "You are not authorized. Login !",
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decoded);

    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "You are not authorized. Login !",
      });
    }

    const user = await Merchants.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Please Login !",
        decoded: decoded.id,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (decoded) {
        const user = await Merchants.findOne({ _id: decoded.id });
        if (user) {
          req.user = user;
        }
      }
    } catch (jwtErr) {
      // Ignore JWT errors in optional auth
      console.log("Optional auth: Invalid token ignored");
    }
    next();
  } catch (err) {
    next(); // Always proceed for optional auth
  }
};

module.exports = { auth, optionalAuth };
