const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage for uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, webp) and PDF documents are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * Upload a buffer to Cloudinary or fallback to data-uri if Cloudinary not configured
 * @param {Buffer} buffer - file buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - 'image' or 'raw' or 'auto'
 * @param {string} mimeType - optional mime type for fallback
 * @returns {Promise<string>} secure_url or data URL
 */
const uploadToCloudinary = (buffer, folder = 'tunistudy', resourceType = 'auto', mimeType = 'application/octet-stream') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary credentials are valid (not default placeholder)
    if (
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_KEY !== 'your_api_key'
    ) {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error) {
            console.warn('Cloudinary upload failed, using Data URI fallback:', error.message);
            // Fallback gracefully to base64 Data URI
            const base64 = buffer.toString('base64');
            return resolve(`data:${mimeType};base64,${base64}`);
          }
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    } else {
      // Local development Data URI fallback so uploads work out of the box
      const base64 = buffer.toString('base64');
      resolve(`data:${mimeType};base64,${base64}`);
    }
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };
