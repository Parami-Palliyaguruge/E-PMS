/**
 * Utility functions for formatting values
 */

/**
 * Format a number as a currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a date into a readable string
 * @param date The date to format (Date, string, or Timestamp)
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | { seconds: number; nanoseconds: number }): string => {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    // Handle Firestore Timestamp
    dateObj = new Date(date.seconds * 1000);
  } else {
    return '';
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Format a date string or Date object as a localized date and time
 * @param date - Date to format (string or Date object)
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date | { seconds: number; nanoseconds: number }): string => {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    // Handle Firestore Timestamp
    dateObj = new Date(date.seconds * 1000);
  } else {
    return '';
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(dateObj);
}; 