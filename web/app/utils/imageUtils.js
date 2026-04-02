/**
 * Utility functions for handling image URLs
 */

/**
 * Get the full URL for an image path
 * @param {string} imagePath - The relative image path (e.g., "/uploads/students/photo.jpg")
 * @returns {string} - The full URL for the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Normalize the API base so uploads always resolve from the API host, not the frontend host.
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  let baseUrl = rawApiUrl.trim();

  if (baseUrl.startsWith('.')) {
    baseUrl = `https://${baseUrl.slice(1)}`;
  }

  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl.replace(/^\/+/, '')}`;
  }

  baseUrl = baseUrl.replace(/\/api\/?$/, '');
  
  // Ensure the path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Get the full URL for a profile photo
 * @param {string} profilePhotoPath - The profile photo path
 * @returns {string|null} - The full URL or null if no path
 */
export const getProfilePhotoUrl = (profilePhotoPath) => {
  return getImageUrl(profilePhotoPath);
};

/**
 * Get the full URL for a passport photo
 * @param {string} passportPhotoPath - The passport photo path
 * @returns {string|null} - The full URL or null if no path
 */
export const getPassportPhotoUrl = (passportPhotoPath) => {
  return getImageUrl(passportPhotoPath);
};

/**
 * Check if an image URL is valid
 * @param {string} url - The image URL to validate
 * @returns {boolean} - True if the URL is valid
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
