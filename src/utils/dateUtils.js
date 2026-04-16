/**
 * Date and Fiscal Utilities for Indian Payroll
 */

/**
 * Parses a month label like "April 2026"
 */
export const parseMonthLabel = (label) => {
  if (!label) return new Date();
  const [monthName, year] = label.split(' ');
  const date = new Date(`${monthName} 1, ${year}`);
  return date;
};

/**
 * Gets number of days in the month for a label like "April 2026"
 */
export const getDaysInMonth = (label) => {
  const date = parseMonthLabel(label);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

/**
 * Calculates months remaining in the Indian Financial Year (ending March)
 * @param {string} label - "Month YYYY"
 */
export const getMonthsRemainingInFY = (label) => {
  const date = parseMonthLabel(label);
  const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = Apr, 11 = Dec)
  
  // April (3) -> 12
  // May (4) -> 11
  // ...
  // Dec (11) -> 4
  // Jan (0) -> 3
  // Feb (1) -> 2
  // Mar (2) -> 1
  
  const fyMonthsRemaining = [3, 2, 1, 12, 11, 10, 9, 8, 7, 6, 5, 4];
  return fyMonthsRemaining[month];
};

/**
 * Gets the Financial Year range for a label
 * e.g. "April 2026" -> "2026-27"
 * e.g. "March 2026" -> "2025-26"
 */
export const getFinancialYearRange = (label) => {
  const date = parseMonthLabel(label);
  const month = date.getMonth();
  const year = date.getFullYear();
  
  if (month >= 3) { // April onwards
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
};
