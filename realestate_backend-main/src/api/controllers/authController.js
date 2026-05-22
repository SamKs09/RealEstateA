const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const ejs = require("ejs");
const Merchants = require("../models/userModel");
const Token = require("../models/tokenModel");
const TWILIO_AUTH_TOKEN = process.env.AUTH_TOKEN;
const SGmail = require("@sendgrid/mail");
const accountSid = process.env.TWILIO_SID;

// Initialize Twilio client only if credentials are properly configured
let client = null;
if (accountSid && accountSid.startsWith('AC') && TWILIO_AUTH_TOKEN && TWILIO_AUTH_TOKEN !== 'your_twilio_auth_token_here') {
  try {
    client = require("twilio")(accountSid, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized');
  } catch (error) {
    console.warn('⚠️  Twilio initialization failed:', error.message);
  }
} else {
  console.warn('⚠️  Twilio credentials not configured - SMS functionality disabled');
}

SGmail.setApiKey(process.env.SENDGRID_API_KEY);
const generateToken = {
  createAccessToken: (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30d",
    });
  },
};

// Helper function to check if Twilio is available
const isTwilioAvailable = () => {
  return client !== null;
};

// Helper function to handle Twilio operations
const handleTwilioOperation = async (operation, errorMessage) => {
  if (!isTwilioAvailable()) {
    throw new Error('SMS functionality is currently unavailable. Please use email instead.');
  }
  return await operation();
};
const authCtrl = {
  registerEmail: async (req, res, next) => {
    try {
      const { email, password, confirmPassword, firstName, lastName, userType, interest } = req.body;
      console.log("Request Body:", req.body);

      if (!password || !confirmPassword) {
        console.log("Missing fields");
        return res.status(403).json({
          success: false,
          message: req.t('missingFields'),
        });
      }

      if (!validateEmail(email)) {
        console.log("Invalid email format");
        return res.status(401).json({
          success: false,
          message: req.t('invalidEmail'),
        });
      }

      const user_email = await Merchants.findOne({ email });
      if (user_email) {
        console.log("Email already registered");
        return res.status(400).json({
          success: false,
          message: req.t('emailAlreadyRegistered'),
        });
      }

      if (password.length < 8) {
        console.log("Password too short");
        return res.status(402).json({
          success: false,
          message: req.t('passwordTooShort'),
        });
      }

      if (password !== confirmPassword) {
        console.log("Passwords do not match");
        return res.status(405).json({
          success: false,
          message: req.t('passwordsDoNotMatch'),
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      console.log("Password hashed");

      // Determine role based on userType (simplified to buyer/seller only)
      let role = 'client'; // default (maps to 'buyer' in UI)
      if (userType === 'seller') {
        role = 'seller';
      } else if (userType === 'buyer') {
        role = 'client';
      }

      // Build user preferences based on interest
      const preferences = {};
      if (interest === 'property') {
        preferences.propertyTypes = [];
      } else if (interest === 'cars') {
        preferences.vehicleTypes = [];
      } else if (interest === 'both') {
        preferences.propertyTypes = [];
        preferences.vehicleTypes = [];
      }

      const newUser = new Merchants({
        email,
        password: passwordHash,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        fullName: `${firstName || email.split('@')[0]} ${lastName || ''}`.trim(),
        role,
        interest: interest || 'property', // Save interest field
        preferences,
      });

      const user = await newUser.save();
      console.log("User saved:", user);

      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        console.log("Creating new token");
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }

      var data = [{ userId: user._id }, { token: token.token }];
      var ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        process.env.TOKEN_ENCRYPTION_KEY || "secret key 1234567890"
      )
        .toString()
        .replace(/\+/g, "%2B");

      const newPath = `${process.env.BASE_URL_EMAIL}/api/auth/email-verification?scheme=${ciphertext}`;
      console.log("New path:", newPath);

      let emailTemplate = await ejs.renderFile(
        "./src/api/controllers/views/confirm.ejs",
        { newPath: newPath }
      );

      const message = {
        to: email,
        from: (process.env.SENDGRID_FROM_EMAIL || '').trim(),
        subject: "Email Activation",
        text: "Welcome aboard, please confirm your email address",
        html: emailTemplate,
      };

      console.log("Sending email to:", email);
      SGmail.send(message);

      return res.status(200).json({
        success: true,
        message: req.t('registrationSuccessEmail', email),

      });
    } catch (err) {
      console.error("Error during registration:", err);
      return res.status(500).json({
        success: false,
        message: req.t('serverError'),
      });
    }
  },

  registerPhone: async (req, res, next) => {
    try {
      const { password, confirmPassword, phoneNumber, email, firstName, lastName, userType, interest } = req.body;
      console.log(req.body);

      if (!validator.isMobilePhone(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidPhoneNumber'),
        });
      }

      // Check if phone number is already registered
      const user_phone = await Merchants.findOne({ phoneNumber });
      if (user_phone) {
        return res.status(400).json({
          success: false,
          message: req.t('phoneAlreadyRegistered'),
        });
      }

      // Check if email is provided and valid (required for verification since SMS is not available)
      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: req.t('emailRequiredForVerification'),
        });
      }

      // Check if email is already registered
      const user_email = await Merchants.findOne({ email });
      if (user_email) {
        return res.status(400).json({
          success: false,
          message: req.t('emailAlreadyRegistered'),
        });
      }

      if (!password || !confirmPassword)
        return res.status(403).json({
          success: false,
          message: req.t('missingFields'),
        });

      if (password.length < 8) {
        return res.status(402).json({
          success: false,
          message: req.t('passwordTooShort'),
        });
      }

      if (password !== confirmPassword)
        return res.status(405).json({
          success: false,
          message: req.t('passwordsDoNotMatch'),
        });

      // Since SMS is not available, we'll use email verification
      if (!isTwilioAvailable()) {
        console.log("📱 SMS not available, using email verification for phone registration");

        const passwordHash = await bcrypt.hash(password, 12);

        // Determine role based on userType (simplified to buyer/seller only)
        let role = 'client'; // default (maps to 'buyer' in UI)
        if (userType === 'seller') {
          role = 'seller';
        } else if (userType === 'buyer') {
          role = 'client';
        }

        // Build user preferences based on interest
        const preferences = {};
        if (interest === 'property') {
          preferences.propertyTypes = [];
        } else if (interest === 'cars') {
          preferences.vehicleTypes = [];
        } else if (interest === 'both') {
          preferences.propertyTypes = [];
          preferences.vehicleTypes = [];
        }

        const newUser = new Merchants({
          phoneNumber,
          email,
          password: passwordHash,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || '',
          fullName: `${firstName || email.split('@')[0]} ${lastName || ''}`.trim(),
          role,
          interest: interest || 'property', // Save interest field
          preferences,
          emailVerified: false, // Will be verified via email
          phoneVerified: false, // Will be marked as verified after email confirmation
        });

        const user = await newUser.save();

        // Generate email verification token
        let token = await Token.findOne({ userId: user._id });
        if (!token) {
          token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
          }).save();
        }

        // Send verification email
        const link = `${process.env.BASE_URL_EMAIL}/api/auth/email-verification?token=${token.token}`;
        const templatePath = path.join(__dirname, "./views/confirm.ejs");
        const html = await ejs.renderFile(templatePath, {
          name: email.split('@')[0], // Use email prefix as name
          newPath: link, // Use newPath to match the template
        });

        const msg = {
          to: email,
          from: (process.env.SENDGRID_FROM_EMAIL || '').trim(),
          subject: "Verify Your Real Estate Account",
          html: html,
        };

        await SGmail.send(msg);

        return res.status(200).json({
          success: true,
          message: req.t('registrationSuccessEmail', email),
          user: {
            phoneVerified: false,
            emailVerified: false,
            _id: user._id,
          },
        });
      } else {
        // Original SMS verification code (when Twilio is available)
        await handleTwilioOperation(async () => {
          return client.verify.v2
            .services(process.env.SERVICE_ID)
            .verifications.create({
              to: `+${phoneNumber}`,
              channel: "sms",
            });
        });

        const passwordHash = await bcrypt.hash(password, 12);
        const newUser = new Merchants({
          phoneNumber,
          email: email || undefined,
          password: passwordHash,
        });

        const user = await newUser.save();
        let token = await Token.findOne({ userId: user._id });
        if (!token) {
          token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
          }).save();
        }

        return res.status(200).json({
          success: true,
          message: req.t('registrationSuccessPhone'),
          user: {
            phoneVerified: newUser.phoneVerified,
            _id: newUser._id,
          },
        });
      }
    } catch (err) {
      console.error("Phone registration error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Server error during registration",
      });
    }
  },
  registerSellerWithKyc: async (req, res) => {
    try {
      const {
        password,
        confirmPassword,
        phoneNumber,
        email,
        firstName,
        lastName,
        interest,
        city,
        documentType,
      } = req.body;

      const files = req.files || {};
      const identityFront = files.identityFront?.[0];
      const identityBack = files.identityBack?.[0];
      const faceVideo = files.faceVideo?.[0];

      if (!validator.isMobilePhone(phoneNumber || "")) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidPhoneNumber'),
        });
      }

      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: req.t('emailRequiredForVerification'),
        });
      }

      if (!password || !confirmPassword) {
        return res.status(403).json({
          success: false,
          message: req.t('missingFields'),
        });
      }

      if (password.length < 8) {
        return res.status(402).json({
          success: false,
          message: req.t('passwordTooShort'),
        });
      }

      if (password !== confirmPassword) {
        return res.status(405).json({
          success: false,
          message: req.t('passwordsDoNotMatch'),
        });
      }

      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City is required',
        });
      }

      if (!identityFront || !identityBack || !faceVideo) {
        return res.status(400).json({
          success: false,
          message: 'Front document image, back document image, and live face video are required',
        });
      }

      const userPhone = await Merchants.findOne({ phoneNumber });
      if (userPhone) {
        return res.status(400).json({
          success: false,
          message: req.t('phoneAlreadyRegistered'),
        });
      }

      const userEmail = await Merchants.findOne({ email });
      if (userEmail) {
        return res.status(400).json({
          success: false,
          message: req.t('emailAlreadyRegistered'),
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const preferences = {};
      if (interest === 'property') {
        preferences.propertyTypes = [];
      } else if (interest === 'cars') {
        preferences.vehicleTypes = [];
      } else if (interest === 'both') {
        preferences.propertyTypes = [];
        preferences.vehicleTypes = [];
      }

      const baseKycPath = '/uploads/kyc';
      const newUser = new Merchants({
        phoneNumber,
        email,
        password: passwordHash,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        fullName: `${firstName || email.split('@')[0]} ${lastName || ''}`.trim(),
        role: 'seller',
        interest: interest || 'property',
        preferences,
        city,
        emailVerified: false,
        phoneVerified: false,
        verification: {
          email: false,
          phone: false,
          identity: false,
        },
        sellerVerification: {
          documentType: documentType === 'passport' ? 'passport' : 'cin',
          identityFront: `${baseKycPath}/${identityFront.filename}`,
          identityBack: `${baseKycPath}/${identityBack.filename}`,
          faceVideo: `${baseKycPath}/${faceVideo.filename}`,
          status: 'pending',
          submittedAt: new Date(),
        },
      });

      const user = await newUser.save();

      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString('hex'),
        }).save();
      }

      const link = `${process.env.BASE_URL_EMAIL}/api/auth/email-verification?token=${token.token}`;
      const templatePath = path.join(__dirname, './views/confirm.ejs');
      const html = await ejs.renderFile(templatePath, {
        name: email.split('@')[0],
        newPath: link,
      });

      await SGmail.send({
        to: email,
        from: (process.env.SENDGRID_FROM_EMAIL || '').trim(),
        subject: 'Verify Your Real Estate Account',
        html,
      });

      return res.status(200).json({
        success: true,
        message: req.t('registrationSuccessEmail', email),
        user: {
          phoneVerified: false,
          emailVerified: false,
          _id: user._id,
          sellerVerificationStatus: 'pending',
        },
      });
    } catch (err) {
      console.error('Seller KYC registration error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Server error during seller KYC registration',
      });
    }
  },
  resendEmail: async (req, res, next) => {
    try {
      const regex = /\ /gi;
      const lastdata = req.query.scheme.replace(regex, "+");

      var bytes = CryptoJS.AES.decrypt(lastdata, process.env.TOKEN_ENCRYPTION_KEY || "secret key 1234567890");
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const user = await Merchants.findById(decryptedData[0].userId);
      const email = user.email;

      if (user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: req.t('userAlreadyVerified'),
        });
      }
      let token = await Token.findOne({ userId: decryptedData[0].userId });
      if (!token) {
        token = await new Token({
          userId: decryptedData[0].userId,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }
      var data = [{ userId: user._id }, { token: token.token }];

      var ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        process.env.TOKEN_ENCRYPTION_KEY || "secret key 1234567890"
      )
        .toString()
        .replace(/\+/gi, "%2B");

      const newPath = `${process.env.BASE_URL_EMAIL}/api/auth/email-verification?scheme=${ciphertext}`;

      let emailTemplate = await ejs.renderFile(
        "./src/api/controllers/views/confirm.ejs",
        { newPath: newPath }
      );

      const message = {
        to: email,
        from: (process.env.SENDGRID_FROM_EMAIL || '').trim(),
        subject: "Email Activation",
        text: "Welcome abroad, please confirm your email address",
        html: emailTemplate,
      };
      const sent = await SGmail.send(message, (err, result) => {
        if (err) {
          res.status(400).json({
            success: false,
            message: err.message,
          });
        } else {
          return res.status(200).json({
            success: true,
            message: req.t('resendSuccess'),
          });
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  resendOTP: async (req, res, next) => {
    try {
      const phoneNumber = req.body.phoneNumber;
      if (phoneNumber) {
        const phoneNumber = req.body.phoneNumber;
        const user_phone = await Merchants.findOne({ phoneNumber });
        if (user_phone.phoneVerified) {
          return res.status(400).json({
            success: false,
            message: req.t('phoneAlreadyVerified'),
          });
        }
        client.verify.v2
          .services(process.env.SERVICE_ID)
          .verifications.create({
            to: `+${phoneNumber}`,
            channel: "sms",
          })
          .then((verification) => {
            console.log(verification);
          });
        res.status(200).json({
          success: true,
          message: req.t('otpSent'),
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  verifyEmail: async (req, res, next) => {
    try {
      const regex = /\%2B/gi;
      const data = req.query.scheme.replace(regex, "+");
      var bytes = CryptoJS.AES.decrypt(data, process.env.TOKEN_ENCRYPTION_KEY || "secret key 1234567890");
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const user = await Merchants.findById(decryptedData[0].userId);

      if (!user) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "text/html");
        res.sendFile(__dirname + "/views/error.ejs");
      }
      const token = await Token.findOne({
        userId: decryptedData[0].userId,
        token: decryptedData[1].token,
      });

      if (!token) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "text/html");
        res.sendFile(__dirname + "/views/error.ejs");
      }
      if (user.emailVerified) {
        res.statusCode = 402;
        res.setHeader("Content-Type", "text/html");
        res.sendFile(__dirname + "/views/verified.ejs");
      }

      const verifiedUser = await Merchants.findOneAndUpdate(
        { _id: decryptedData[0].userId },
        { emailVerified: true },
        { returnOriginal: false }
      );
      if (token) {
        await token.delete();
      }

      if (verifiedUser) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.sendFile(__dirname + "/views/success.ejs");
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  verifyOTP: async (req, res) => {
    try {
      const code = req.body.code;
      const phoneNumber = req.body.phoneNumber;
      console.log(req.body);
      const user_phone = await Merchants.findOne({ phoneNumber });
      if (!user_phone) {
        return res.status(404).json({
          success: false,
          message: req.t('userWithPhoneNotFound'),
        });
      }
      if (code.length !== 6) {
        return res.status(405).json({
          success: false,
          message: req.t('otpCodeLength'),
        });
      }
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: req.t('noPhoneInRequest'),
        });
      }
      if (!code) {
        return res.status(400).json({
          success: false,
          message: req.t('noCodeInRequest'),
        });
      }
      client.verify.v2
        .services(process.env.SERVICE_ID)
        .verificationChecks.create({ to: `+${phoneNumber}`, code: code })
        .then((verification_check) => {
          console.log("verification_check", verification_check);
          if (verification_check.valid === false) {
            return res.status(401).json({
              success: false,
              message: req.t('otpIncorrect'),
            });
          }
          if (verification_check.status === "approved") {
            user_phone.phoneNumber = phoneNumber;
            user_phone.phoneVerified = true;
            user_phone.save();
            const access_token = generateToken.createAccessToken({
              id: user_phone._id,
            });

            res.status(200).json({
              success: true,
              message: req.t('phoneVerified'),
              access_token,
            });
          } else {
            return res.status(500).json({
              success: false,
              message: req.t('verificationFailed'),
            });
          }
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).json({
            success: false,
            message: req.t('otpIncorrectOrExpired'),
          });
        });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: req.t('otpIncorrectOrExpired'),
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(req.body);
      if (!email || !password)
        return res.status(403).json({
          success: false,
          message: req.t('missingFields'),
        });
      if (!validateEmail(email))
        return res.status(400).json({
          success: false,
          message: req.t('invalidEmail'),
        });
      const user = await Merchants.findOne({ email }).populate("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('userNotRegistered'),
        });
      }
      if (!user.emailVerified) {
        let token = await Token.findOne({ userId: user._id });
        if (!token) {
          token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
          }).save();
        }
        var data = [{ userId: user._id }, { token: token.token }];

        var ciphertext = CryptoJS.AES.encrypt(
          JSON.stringify(data),
          process.env.TOKEN_ENCRYPTION_KEY || "secret key 1234567890"
        )
          .toString()
          .replace(/\+/gi, "%2B");
        const newPath = `${process.env.BASE_URL_EMAIL}/api/auth/email-verification?scheme=${ciphertext}`;
        let emailTemplate = await ejs.renderFile(
          "./src/api/controllers/views/confirm.ejs",
          { newPath: newPath }
        );

        const message = {
          to: email,
          from: (process.env.SENDGRID_FROM_EMAIL || '').trim(),
          subject: "Email Activation",
          text: "Welcome abroad, please confirm your email address",
          html: emailTemplate,
        };
        const sent = await SGmail.send(message, (err, result) => {
          return res.status(401).json({
            success: false,
            message: req.t('emailNotVerified'),
          });
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(402).json({
          success: false,
          message: req.t('incorrectPassword'),
        });
      }

      const access_token = generateToken.createAccessToken({ id: user._id });
      console.log(access_token);
      user.save();

      return res.status(200).json({
        success: true,
        message: req.t('loginSuccess'),
        access_token,
        user: {
          _id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          interest: user.interest || 'property',
          preferences: user.preferences,
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  loginPhone: async (req, res) => {
    try {
      const { phoneNumber, password } = req.body;
      console.log(req.body);
      if (!phoneNumber || !password)
        return res.status(403).json({
          success: false,
          message: req.t('missingFields'),
        });
      if (!validator.isMobilePhone(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidPhoneNumber'),
        });
      }

      const user = await Merchants.findOne({ phoneNumber }).populate(
        "-password"
      );
      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('userNotRegistered'),
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(402).json({
          success: false,
          message: req.t('incorrectPassword'),
        });
      }
      if (!user.phoneVerified) {
        client.verify.v2
          .services(process.env.SERVICE_ID)
          .verifications.create({
            to: `${phoneNumber}`,
            channel: "sms",
          })
          .then((verification) => {
            console.log(verification);
          });
        return res.status(401).json({
          success: false,
          message: req.t('phoneNotVerified'),
        });
      }

      const access_token = generateToken.createAccessToken({ id: user._id });

      user.online = true;
      user.save();

      return res.status(200).json({
        success: true,
        message: req.t('loginSuccess'),
        access_token,
        user: {
          _id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          interest: user.interest || 'property', // Return interest field from user document
          preferences: user.preferences,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },

  logout: async (req, res) => {
    try {
      const user = await Merchants.findOne({ _id: req.user._id });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('userNotFound'),
        });
      }

      if (user.online === false) {
        return res.status(400).json({
          success: false,
          message: req.t('alreadyLoggedOut'),
        });
      }

      user.online = false;
      await user.save();
      console.log("logged out successfully", user);

      return res.status(200).json({
        success: true,
        message: req.t('logoutSuccess'),
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
        code: "0x0006",
      });
    }
  },
  forgotPasswordEmail: async (req, res) => {
    try {
      const { email } = req.body;

      // Validation
      if (!email) {
        return res.status(400).json({
          success: false,
          message: req.t('emailRequired'),
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: req.t('validEmailRequired'),
        });
      }

      // Find user
      const user = await Merchants.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('noAccountWithEmail'),
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.latestOtp = otp;
      user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      const templatePath = path.join(
        "./src/api/controllers/views/passwordRecover.ejs"
      );
      let emailTemplate;

      try {
        emailTemplate = await ejs.renderFile(templatePath, {
          otp: otp,
          userEmail: email,
        });
      } catch (templateError) {
        console.error("Template rendering error:", templateError);
        return res.status(500).json({
          success: false,
          message: req.t('failedToGenerateTemplate'),
        });
      }

      const message = {
        to: email.toLowerCase(),
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: "FiatFlex Team",
        },
        subject: "Password Reset Verification Code - RealEstate Team",
        text: `Your password reset verification code is: ${otp}. This code will expire in 15 minutes.`,
        html: emailTemplate,
      };

      try {
        await SGmail.send(message);
      } catch (emailError) {
        console.error("SendGrid error:", emailError);

        user.latestOtp = null;
        await user.save();

        return res.status(500).json({
          success: false,
          message: req.t('failedToSendEmail'),
        });
      }

      return res.status(200).json({
        success: true,
        message: req.t('passwordResetEmailSent'),
        data: {
          email: email.toLowerCase(),
          expiresIn: "15 minutes",
        },
      });
    } catch (error) {
      console.error("Error in forgotPasswordEmail:", error);
      return res.status(500).json({
        success: false,
        message: req.t('internalServerError'),
      });
    }
  },

  resetPasswordEmail: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      console.log("Reset password email request:", {
        email,
        otp,
        passwordLength: newPassword?.length,
      });
      console.log(req.body);
      // Validation
      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: req.t('emailOtpAndPasswordRequired'),
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: req.t('validEmailRequired'),
        });
      }

      // OTP format validation
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          message: req.t('verificationCodeSixDigits'),
        });
      }

      // Password validation
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: req.t('passwordTooShort'),
        });
      }

      // Find user
      const user = await Merchants.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('noAccountWithEmail'),
        });
      }

      // Verify OTP
      if (!user.latestOtp || user.latestOtp !== otp) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidVerificationCode'),
        });
      }

      if (!user.latestOtp) {
        return res.status(400).json({
          success: false,
          message: req.t('verificationCodeExpired'),
        });
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      user.password = passwordHash;
      user.latestOtp = null;
      user.otpExpiry = null;
      await user.save();

      console.log("Password updated successfully for user:", user._id);

      return res.status(200).json({
        success: true,
        message: req.t('passwordResetSuccess'),
      });
    } catch (error) {
      console.error("Error in resetPasswordEmail:", error);
      return res.status(500).json({
        success: false,
        message: req.t('internalServerError'),
      });
    }
  },

  forgotPasswordPhone: async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      console.log(phoneNumber);
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: req.t('phoneRequired'),
        });
      }

      const cleanPhoneNumber = phoneNumber.replace(/[\s-()]/g, "");

      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(cleanPhoneNumber)) {
        return res.status(400).json({
          success: false,
          message: req.t('validPhoneRequired'),
        });
      }

      const user = await Merchants.findOne({ phoneNumber: phoneNumber });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('noAccountWithPhone'),
        });
      }

      const formattedPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber.replace(/^\+/, "")}`;

      try {
        // Send verification via Twilio
        const verification = await client.verify.v2
          .services(process.env.SERVICE_ID)
          .verifications.create({
            to: formattedPhoneNumber,
            channel: "sms",
          });

        console.log("Twilio verification created:", verification.status);

        return res.status(200).json({
          success: true,
          message: req.t('resetCodeSentToPhone'),
          data: {
            phoneNumber: phoneNumber,
            status: verification.status,
          },
        });
      } catch (twilioError) {
        console.error("Twilio error:", twilioError);

        if (twilioError.code === 21211) {
          return res.status(400).json({
            success: false,
            message: req.t('invalidPhoneFormat'),
          });
        }

        if (twilioError.code === 21608) {
          return res.status(400).json({
            success: false,
            message: req.t('phoneNotMobile'),
          });
        }

        return res.status(500).json({
          success: false,
          message: req.t('failedToSendSms'),
        });
      }
    } catch (error) {
      console.error("Error in forgotPasswordPhone:", error);
      return res.status(500).json({
        success: false,
        message: req.t('internalServerError'),
      });
    }
  },

  resetPasswordPhone: async (req, res) => {
    try {
      const { code, phoneNumber, newPassword } = req.body;

      // Validation
      if (!code || !phoneNumber || !newPassword) {
        return res.status(400).json({
          success: false,
          message: req.t('codePhonePasswordRequired'),
        });
      }

      // Code format validation
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: req.t('verificationCodeSixDigits'),
        });
      }

      // Password validation
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: req.t('passwordTooShort'),
        });
      }

      // Find user
      const user = await Merchants.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('noAccountWithPhone'),
        });
      }

      // Format phone number for Twilio - ensure it starts with +
      const formattedPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber.replace(/^\+/, "")}`;

      try {
        // Verify code with Twilio
        const verificationCheck = await client.verify.v2
          .services(process.env.SERVICE_ID)
          .verificationChecks.create({
            to: formattedPhoneNumber,
            code: code,
          });

        console.log("Twilio verification check:", verificationCheck.status);

        if (verificationCheck.status !== "approved") {
          return res.status(400).json({
            success: false,
            message: req.t('invalidOrExpiredCode'),
          });
        }

        // Hash new password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        user.password = passwordHash;
        await user.save();

        console.log("Password updated successfully for user:", user._id);

        return res.status(200).json({
          success: true,
          message: req.t('passwordResetSuccess'),
        });
      } catch (twilioError) {
        console.error("Twilio verification error:", twilioError);

        // Handle specific Twilio errors
        if (twilioError.status === 404 && twilioError.code === 20404) {
          return res.status(400).json({
            success: false,
            message: req.t('invalidOrExpiredCode'),
          });
        }

        if (twilioError.code === 60202) {
          return res.status(400).json({
            success: false,
            message: req.t('verificationCodeExpired'),
          });
        }

        return res.status(500).json({
          success: false,
          message: req.t('failedToVerifyCode'),
        });
      }
    } catch (error) {
      console.error("Error in resetPasswordPhone:", error);
      return res.status(500).json({
        success: false,
        message: req.t('internalServerError'),
      });
    }
  },
};

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

module.exports = authCtrl;
