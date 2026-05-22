require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("../src/api/utils/logger");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/RealEstate";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    mongoose.connection.on('connected', () => {
      logger.info("🟢 MONGO CONNECTED");
    });

    mongoose.connection.on('error', (err) => {
      logger.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn("⚠️ MongoDB disconnected");
    });

    logger.info("🟢 MONGO CONNECTED");

  } catch (error) {
    logger.error("❌ MONGO FAILED:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
