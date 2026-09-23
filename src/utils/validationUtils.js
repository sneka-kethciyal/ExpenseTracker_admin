/**
 * Form and Data Validation Utilities
 */

/**
 * Validates a username according to application rules.
 * Username must be 3-30 characters, alphanumeric with optional underscores, periods, and hyphens.
 * No spaces allowed.
 */
export function validateUsername(username) {
  if (!username || !username.trim()) {
    return 'Username is required.';
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return 'Username must be at least 3 characters long.';
  }
  if (trimmed.length > 30) {
    return 'Username cannot exceed 30 characters.';
  }
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return 'Username can only contain letters, numbers, underscores (_), hyphens (-), and periods (.).';
  }
  return null;
}

/**
 * Validates password strength & length
 */
export function validatePassword(password) {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null;
}

/**
 * Validates coordinate pair
 */
export function isValidCoordinate(lat, lng) {
  const nLat = parseFloat(lat);
  const nLng = parseFloat(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180
  );
}
