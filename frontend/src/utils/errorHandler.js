/**
 * Utility functions for error handling
 */

/**
 * Check if an error should be ignored (cancelled/aborted requests)
 * @param {Error} err - Error object
 * @returns {boolean} - True if error should be ignored
 */
export const shouldIgnoreError = (err) => {
  return (
    err.name === 'AbortError' ||
    err.code === 'ERR_CANCELED' ||
    err.message?.includes('cancelled') ||
    err.message?.includes('Duplicate request cancelled')
  );
};

/**
 * Extract error message from error object
 * @param {Error} err - Error object
 * @param {string} defaultMessage - Default message if no error message found
 * @returns {string} - Error message
 */
export const getErrorMessage = (err, defaultMessage = 'An error occurred') => {
  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.response?.data?.detail ||
    err.message ||
    defaultMessage
  );
};

/**
 * Handle API error with optional toast notification
 * @param {Error} err - Error object
 * @param {Object} options - Options
 * @param {Function} options.onError - Custom error handler
 * @param {boolean} options.showToast - Show toast (default: true)
 * @param {string} options.defaultMessage - Default error message
 * @returns {string|null} - Error message or null if ignored
 */
export const handleApiError = (err, options = {}) => {
  const {
    onError,
    showToast = true,
    defaultMessage = 'An error occurred',
  } = options;

  // Ignore cancelled/aborted errors
  if (shouldIgnoreError(err)) {
    return null;
  }

  const errorMessage = getErrorMessage(err, defaultMessage);

  if (onError) {
    onError(err, errorMessage);
  }

  return errorMessage;
};

