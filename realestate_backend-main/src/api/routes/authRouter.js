const router = require("express").Router();
const authCtrl = require("../controllers/authController");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for development - allows unlimited login attempts
    message: {
        success: false,
        message: "Too many login attempts, please try again after 15 minutes"
    }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 5 accounts per hour
    message: {
        success: false,
        message: "Too many accounts created from this IP, please try again after an hour"
    }
});

const { auth } = require("../middleware/auth");

const kycUploadPath = path.join(__dirname, "../uploads/kyc");
fs.mkdirSync(kycUploadPath, { recursive: true });

const kycStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, kycUploadPath),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || "") || (file.mimetype.startsWith("video/") ? ".mp4" : ".jpg");
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        cb(null, safeName);
    }
});

const kycUpload = multer({
    storage: kycStorage,
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (["identityFront", "identityBack"].includes(file.fieldname)) {
            if (file.mimetype.startsWith("image/")) {
                return cb(null, true);
            }
            return cb(new Error("Identity files must be images"));
        }

        if (file.fieldname === "faceVideo") {
            if (file.mimetype.startsWith("video/")) {
                return cb(null, true);
            }
            return cb(new Error("Face verification file must be a video"));
        }

        return cb(new Error("Invalid KYC upload field"));
    }
});

const uploadSellerKyc = kycUpload.fields([
    { name: "identityFront", maxCount: 1 },
    { name: "identityBack", maxCount: 1 },
    { name: "faceVideo", maxCount: 1 },
]);


router.post("/register-email", registerLimiter, authCtrl.registerEmail);
router.get("/email-verification", authCtrl.verifyEmail);
router.post("/resend-email-verification", authCtrl.resendEmail);



router.post("/register-phone", registerLimiter, authCtrl.registerPhone);
router.post("/register-phone-seller-kyc", registerLimiter, uploadSellerKyc, authCtrl.registerSellerWithKyc);
router.post("/verify-otp", authCtrl.verifyOTP);
router.post("/resend-otp", authCtrl.resendOTP);


router.post("/login", authCtrl.login);
router.post("/login-phone", authCtrl.loginPhone);

router.post("/forgot-password-email", authCtrl.forgotPasswordEmail);
router.post("/reset-password-email", authCtrl.resetPasswordEmail);

router.post("/forgot-password-phone", authCtrl.forgotPasswordPhone);
router.post("/reset-password-phone", authCtrl.resetPasswordPhone);

router.post("/logout", auth, authCtrl.logout);

module.exports = router;
