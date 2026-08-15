/**
 * lib/validations.js
 * Input Sanitization & Validation Helpers.
 * Prevents injection attacks, invalid types, and malformed payload parameters.
 */

export function sanitizeText(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Strip basic HTML tags
    .slice(0, maxLength);
}

export function validatePositiveNumber(value, min = 1, max = 1_000_000) {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return { valid: false, error: `Value must be a valid number between ${min} and ${max}` };
  }
  return { valid: true, value: num };
}

export function validateUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') {
    return { valid: false, error: 'UPI ID is required' };
  }
  const cleaned = upiId.trim();
  const upiRegex = /^[\w\.\-]+@[\w\-]+$/;
  if (!upiRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid UPI ID format (e.g. user@upi)' };
  }
  return { valid: true, value: cleaned };
}

export function validateTransactionId(txId) {
  if (!txId || typeof txId !== 'string') {
    return { valid: false, error: 'Transaction reference ID is required' };
  }
  const cleaned = txId.trim();
  if (cleaned.length < 6 || cleaned.length > 64) {
    return { valid: false, error: 'Transaction ID must be between 6 and 64 characters' };
  }
  return { valid: true, value: cleaned };
}
