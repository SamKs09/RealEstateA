require("dotenv").config();
const path = require('path');
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const http = require("http");
const fs = require("fs");
const logger = require("./src/api/utils/logger");

const authRouter = require("./src/api/routes/authRouter");
const userRouter = require("./src/api/routes/userRouter");
const supportRouter = require("./src/api/routes/supportRouter");
const supportRouterNew = require("./src/api/routes/supportRouterNew");
const messageRouter = require("./src/api/routes/messageRouter");
const clientMessageRouter = require("./src/api/routes/clientMessageRouter");
const socketHandler = require("./src/api/utils/socketHandler");
const receiptChecker = require("./src/api/utils/notificationReceiptChecker");

const propertiesRouter = require("./src/api/routes/propertiesRouter");
const vehiclesRouter = require("./src/api/routes/vehiclesRouter");
const notificationRouter = require("./src/api/routes/notificationRouter");
const sellerRouter = require("./src/api/routes/sellerRouter");
const analyticsRouter = require("./src/api/routes/analyticsRouter");
const bookingRouter = require("./src/api/routes/bookingRouter");
const offerRouter = require("./src/api/routes/offerRouter");
const availabilityRouter = require("./src/api/routes/availabilityRouter");
const paymentRouter = require("./src/api/routes/paymentRouter");
const languageMiddleware = require('./src/api/middleware/languageMiddleware');

const app = express();
const server = http.createServer(app);

// Connect to database
connectDB();

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, "images-users");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory at: ${uploadDir}`);
}

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature"],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use((req, res, next) => {
  logger.info(`📡 Incoming Request: ${req.method} ${req.url}`);
  next();
});
app.use(
  bodyParser.json({
    parameterLimit: 100000,
    limit: "150mb",
    extended: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(languageMiddleware);

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/images-users", express.static(path.join(__dirname, "images-users")));
// Serve property uploads
app.use("/uploads", express.static(path.join(__dirname, "src/api/uploads")));

// Routes
app.get("/", (req, res) => {
  res.send("REAL ESTATE SERVER RUNNING 🟢 VERSION 2.1 ⛔");
});

app.get("/api/ping", (req, res) => {
  res.json({ success: true, message: "pong", time: new Date().toISOString() });
});
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/support", supportRouter);
app.use("/api/support-v2", supportRouterNew); // New support system
app.use("/api/messages", messageRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/client/messages", clientMessageRouter);
app.use("/api/client/notifications", notificationRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/offers", offerRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/payments", paymentRouter);

// 404 Handler for API routes
app.use("/api", (req, res) => {
  logger.warn(`🚫 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
    debug: {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(`Global error handler: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode || 500);
  res.json({
    success: false,
    message: req.t ? req.t(err.message) : err.message,
  });
});

// Process exceptions
process.on("uncaughtException", function (err) {
  logger.error("Uncaught exception:", err);
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  logger.info(`🟢 SERVER RUNNING ON ${port}`);

  // Initialize Socket.io for real-time messaging
  const io = socketHandler.initializeSocket(server);
  app.set('io', io); // Make io accessible to routes
  logger.info(`🔌 WebSocket initialized for real-time messaging`);

  // Start Expo push receipt checker (confirms delivery every 15 min)
  receiptChecker.startJob();
});