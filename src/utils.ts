/**
 * Compares a date string in DD/MM/YYYY format with the current date.
 * Returns true if the date is in the past.
 */
export const isPastDate = (dateStr: string): boolean => {
  if (!dateStr || dateStr.length < 10) return false;

  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
};

/**
 * Parses DD/MM/YYYY into a Date object.
 */
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.length < 10) return null;
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};
