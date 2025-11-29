import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format energy value with unit
 */
export const formatEnergy = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} MWh`;
  }
  return `${value.toFixed(2)} kWh`;
};

/**
 * Format currency
 */
export const formatCurrency = (value: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Format date
 */
export const formatDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as: +234 XXX XXX XXXX
  if (cleaned.startsWith('234')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  // Format as: 0XXX XXX XXXX
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Format meter number (add spaces every 4 characters)
 */
export const formatMeterNumber = (meterNumber: string): string => {
  return meterNumber.match(/.{1,4}/g)?.join(' ') || meterNumber;
};

/**
 * Format token (add spaces every 5 digits)
 */
export const formatToken = (token: string): string => {
  const cleaned = token.replace(/\s/g, '');
  return cleaned.match(/.{1,5}/g)?.join(' ') || token;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format voltage
 */
export const formatVoltage = (value: number): string => {
  return `${value.toFixed(1)} V`;
};

/**
 * Format current
 */
export const formatCurrent = (value: number): string => {
  return `${value.toFixed(2)} A`;
};

/**
 * Format power
 */
export const formatPower = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kW`;
  }
  return `${value.toFixed(2)} W`;
};

/**
 * Format power factor
 */
export const formatPowerFactor = (value: number): string => {
  return value.toFixed(3);
};

/**
 * Format frequency
 */
export const formatFrequency = (value: number): string => {
  return `${value.toFixed(2)} Hz`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Get initials from name
 */
export const getInitials = (firstName: string, lastName?: string): string => {
  if (lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  return firstName.charAt(0).toUpperCase();
};
