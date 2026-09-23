/**
 * Formatting Utilities for Currency, Coordinates, and Numbers
 */

/**
 * Formats a monetary amount into Indian Rupee (INR) currency format
 * @param {number|string} amount
 * @returns {string} e.g. "₹10,000.00"
 */
export function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats geographic coordinates nicely
 * @param {number|string} lat
 * @param {number|string} lng
 * @returns {string} e.g. "12.971599, 77.594563"
 */
export function formatCoordinates(lat, lng) {
  const nLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const nLng = typeof lng === 'number' ? lng : parseFloat(lng);
  if (isNaN(nLat) || isNaN(nLng)) return 'Invalid coordinates';
  return `${nLat.toFixed(6)}, ${nLng.toFixed(6)}`;
}

/**
 * Formats a count or generic number
 */
export function formatNumber(value) {
  const num = typeof value === 'number' ? value : parseInt(value, 10) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
}
