/**
 * Strips HTML tags and common XSS vectors from user input.
 */
export const sanitizeText = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

/**
 * Validates that a numeric string is a positive number.
 */
export const isPositiveNumber = (value: string): boolean => {
  const num = parseFloat(value.replace(',', '.'));
  return !isNaN(num) && num > 0;
};

/**
 * Validates margin is between 0 and 99 (exclusive of 100).
 */
export const isValidMargin = (value: string): boolean => {
  const num = parseFloat(value.replace(',', '.'));
  return !isNaN(num) && num >= 0 && num < 100;
};
