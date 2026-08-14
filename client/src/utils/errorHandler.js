/**
 * Centralized API Error Parser & Normalizer for Frontend
 * Converts any Axios / Network / HTTP error into a user-friendly, safe message
 */
export const getErrorMessage = (error, fallbackMessage = 'Something went wrong. Please try again.') => {
  if (!error) return fallbackMessage;

  // 1. Network / Connection Errors
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // 2. Timeout Errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }

  // 3. HTTP Response Status Code Specific Messages
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;

  if (serverMsg && typeof serverMsg === 'string' && !serverMsg.includes('stack') && !serverMsg.includes('MongoError')) {
    return serverMsg;
  }

  switch (status) {
    case 400:
      return 'Invalid request. Please check the entered details and try again.';
    case 401:
      return 'Please login to continue.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'The requested item or resource could not be found.';
    case 409:
      return 'This action could not be completed because the data has changed or already exists.';
    case 422:
      return 'Unable to process request. Please review your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Something went wrong on our side. Please try again.';
    default:
      return fallbackMessage;
  }
};
