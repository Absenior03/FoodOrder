/**
 * Decode HTML entities in a string
 * Useful for fixing encoded base64 image data
 */
export const decodeHTMLEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

/**
 * Sanitize profile picture URL
 * Handles HTML-encoded base64 data URLs
 */
export const sanitizeProfilePictureUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  // If it's already a valid data URL, return as is
  if (url.startsWith('data:image/') && !url.includes('&#')) {
    return url;
  }
  
  // Decode HTML entities
  return decodeHTMLEntities(url);
};
