const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Check if credentials exist
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

let storage;

if (isCloudinaryConfigured) {
    // Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Configure Storage
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'matkaking_profiles',
            allowed_formats: ['jpg', 'png', 'jpeg'],
            transformation: [{ width: 500, height: 500, crop: 'fill' }], // Resize automatically
        },
    });
} else {
    // Fallback if not configured (prevents crash)
    console.warn("⚠️ Cloudinary not configured. Uploads will fallback to memory storage (not saved).");
    storage = multer.memoryStorage();
}

module.exports = {
    cloudinary,
    storage,
    isCloudinaryConfigured
};
