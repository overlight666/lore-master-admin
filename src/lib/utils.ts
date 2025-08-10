import { PaginatedResponse } from '@/types';

/**
 * Extracts data from API response, handling both 'items' and 'data' formats
 * @param response - The API response object
 * @returns Array of data items
 */
export function extractDataFromResponse<T>(response: any): T[] {
  if (response?.items && Array.isArray(response.items)) {
    return response.items;
  }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return [];
}

/**
 * Standardizes pagination info from API response
 * @param response - The API response object
 * @returns Pagination info with defaults
 */
export function extractPaginationInfo(response: any) {
  return {
    total: response?.total || 0,
    page: response?.page || 1,
    limit: response?.limit || 10,
    totalPages: response?.totalPages || Math.ceil((response?.total || 0) / (response?.limit || 10))
  };
}

/**
 * Utility to handle API responses consistently across components
 * @param response - The API response object
 * @returns Object with data and pagination info
 */
export function handleApiResponse<T>(response: any): { data: T[], pagination: any } {
  return {
    data: extractDataFromResponse<T>(response),
    pagination: extractPaginationInfo(response)
  };
}

/**
 * Clamps a number between min and max values
 * @param num - The number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Formats a date to a readable string
 * @param date - Date object, timestamp, or date string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number | { _seconds: number }): string {
  let dateObj: Date;
  
  if (typeof date === 'object' && date !== null && '_seconds' in date) {
    // Firebase timestamp format
    dateObj = new Date(date._seconds * 1000);
  } else {
    dateObj = new Date(date);
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Creates a debounced version of a function
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}
