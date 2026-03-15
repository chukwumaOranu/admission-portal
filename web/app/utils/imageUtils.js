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
  
  // Get the base URL from environment or default to localhost:5001
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
  
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
