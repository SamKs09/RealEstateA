const multer = require("multer");
const fs = require("fs");
const path = require("path");

// File type filter (accepts common image formats) - ORIGINAL
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /\.(jfif|jpg|jpeg|png|gif|webp|pdf)$/i;
  if (!allowedTypes.test(file.originalname)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// Enhanced file type filter for property media
const propertyMediaFileFilter = (req, file, cb) => {
  let allowedTypes;

  switch (file.fieldname) {
    case 'avatar':
      // Keep original avatar validation
      allowedTypes = /\.(jfif|jpg|jpeg|png|gif|webp|pdf)$/i;
      if (!allowedTypes.test(file.originalname)) {
        return cb(new Error("Only image files are allowed!"), false);
      }
      break;
    case 'images':
      allowedTypes = /\.(jfif|jpg|jpeg|png|gif|webp)$/i;
      if (!allowedTypes.test(file.originalname)) {
        return cb(new Error("Only image files are allowed for images!"), false);
      }
      break;
    case 'videos':
      allowedTypes = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i;
      if (!allowedTypes.test(file.originalname)) {
        return cb(new Error("Only video files are allowed for videos!"), false);
      }
      break;
    case 'documents':
      allowedTypes = /\.(pdf|doc|docx|txt)$/i;
      if (!allowedTypes.test(file.originalname)) {
        return cb(new Error("Only document files are allowed for documents!"), false);
      }
      break;
    case 'virtualTour':
      allowedTypes = /\.(mp4|mov|jpg|jpeg|png|webp)$/i;
      if (!allowedTypes.test(file.originalname)) {
        return cb(new Error("Only video or image files are allowed for virtual tour!"), false);
      }
      break;
    default:
      return cb(new Error("Invalid upload field"), false);
  }

  cb(null, true);
};

// Storage config - ENHANCED
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "";

    // Support both avatar and property media fieldnames
    if (file.fieldname === "avatar") {
      uploadPath = path.join(process.cwd(), "images-users");
    } else if (file.fieldname === "images") {
      uploadPath = path.join(__dirname, "../uploads/properties/images");
    } else if (file.fieldname === "videos") {
      uploadPath = path.join(__dirname, "../uploads/properties/videos");
    } else if (file.fieldname === "documents") {
      uploadPath = path.join(__dirname, "../uploads/properties/documents");
    } else if (file.fieldname === "virtualTour") {
      uploadPath = path.join(__dirname, "../uploads/properties/virtualTour");
    } else if (file.fieldname === "attachments") {
      uploadPath = path.join(__dirname, "../uploads/support/attachments");
    } else if (file.fieldname === "media") {
      // Vehicle media uploads
      uploadPath = path.join(__dirname, "../uploads/vehicles/images");
    } else {
      return cb(new Error("Invalid upload field"), false);
    }

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

// Multer instance - ORIGINAL
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "attachments") {
      // Log file info for debugging
      console.log('📎 Support attachment upload:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        fieldname: file.fieldname
      });
      
      // Accept all image types and common document types
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/jfif',
        'image/bmp',
        'image/tiff',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      // Check MIME type first (more reliable for mobile uploads)
      const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
      
      // Also check if it starts with 'image/' for any image type
      const isImage = file.mimetype.startsWith('image/');
      
      if (!hasValidMimeType && !isImage) {
        console.log('❌ Rejected attachment - invalid type:', file.mimetype);
        return cb(new Error("Invalid file type for attachments!"), false);
      }
      
      console.log('✅ Accepted attachment:', file.originalname);
      return cb(null, true);
    }
    if (file.fieldname === "media") {
      // Vehicle media uploads - accept images
      const allowedTypes = /\.(jfif|jpg|jpeg|png|gif|webp)$/i;
      if (!allowedTypes.test(file.originalname)) {
        console.log('❌ Rejected vehicle media - invalid type:', file.originalname);
        return cb(new Error("Only image files are allowed for vehicle media!"), false);
      }
      console.log('✅ Accepted vehicle media:', file.originalname);
      return cb(null, true);
    }
    return imageFileFilter(req, file, cb);
  },
});

// Enhanced multer instance for property media
const propertyUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for videos
  fileFilter: propertyMediaFileFilter,
});

// Multiple field upload for property media
const uploadPropertyMedia = propertyUpload.fields([
  { name: 'images', maxCount: 15 },
  { name: 'videos', maxCount: 5 },
  { name: 'documents', maxCount: 5 },
  { name: 'virtualTour', maxCount: 1 }
]);

const uploadSupportAttachments = upload.array("attachments", 5);

module.exports = {
  upload,
  propertyUpload,
  uploadPropertyMedia,
  uploadSupportAttachments
};