/**
 * Email validation
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation
 * At least 6 characters
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Phone number validation
 * Accepts various formats: +234..., 0..., etc.
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s()-]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Meter number validation
 * Alphanumeric, 8-15 characters
 */
export const validateMeterNumber = (meterNumber: string): boolean => {
  const meterRegex = /^[A-Z0-9]{8,15}$/i;
  return meterRegex.test(meterNumber);
};

/**
 * Name validation
 * At least 2 characters, letters and spaces only
 */
export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  return nameRegex.test(name);
};

/**
 * Token validation
 * 20 digit token
 */
export const validateToken = (token: string): boolean => {
  const tokenRegex = /^\d{20}$/;
  return tokenRegex.test(token.replace(/\s/g, ''));
};

/**
 * Amount validation
 * Positive number
 */
export const validateAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
};

/**
 * Get validation error message
 */
export const getValidationError = (field: string, value: any): string | null => {
  switch (field) {
    case 'email':
      if (!value) return 'Email is required';
      if (!validateEmail(value)) return 'Invalid email address';
      return null;

    case 'password':
      if (!value) return 'Password is required';
      if (!validatePassword(value)) return 'Password must be at least 6 characters';
      return null;

    case 'firstName':
    case 'lastName':
      if (!value) return `${field === 'firstName' ? 'First' : 'Last'} name is required`;
      if (!validateName(value)) return 'Name must contain only letters and spaces';
      return null;

    case 'phoneNumber':
      if (!value) return 'Phone number is required';
      if (!validatePhoneNumber(value)) return 'Invalid phone number';
      return null;

    case 'meterNumber':
      if (!value) return 'Meter number is required';
      if (!validateMeterNumber(value)) return 'Invalid meter number (8-15 alphanumeric characters)';
      return null;

    case 'token':
      if (!value) return 'Token is required';
      if (!validateToken(value)) return 'Invalid token (must be 20 digits)';
      return null;

    case 'amount':
      if (!value) return 'Amount is required';
      if (!validateAmount(value)) return 'Invalid amount';
      return null;

    default:
      return null;
  }
};
