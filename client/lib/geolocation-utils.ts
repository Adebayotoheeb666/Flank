/**
 * Utility functions for handling Geolocation API errors
 */

export interface GeolocationErrorDetails {
  code: number;
  message: string;
  userMessage: string;
}

/**
 * Parse and format geolocation errors with proper details
 */
export function parseGeolocationError(error: any): GeolocationErrorDetails {
  const code = error?.code ?? 0;
  let message = "Unknown geolocation error";
  let userMessage = "Unable to get your location";

  if (error instanceof GeolocationPositionError) {
    // Proper GeolocationPositionError with code
    switch (code) {
      case 1: // PERMISSION_DENIED
        message = "PERMISSION_DENIED";
        userMessage = "Location permission denied. Please enable location access in settings.";
        break;
      case 2: // POSITION_UNAVAILABLE
        message = "POSITION_UNAVAILABLE";
        userMessage = "Location information is unavailable. Please try again.";
        break;
      case 3: // TIMEOUT
        message = "TIMEOUT";
        userMessage = "Location request timed out. Please try again.";
        break;
      default:
        message = error.message || "Unknown error";
        userMessage = "Unable to get your location. Please try again.";
    }
  } else if (error?.message) {
    message = error.message;
    userMessage = error.message;
  } else if (typeof error === 'string') {
    message = error;
    userMessage = error;
  }

  return { code, message, userMessage };
}

/**
 * Log geolocation error with full details
 */
export function logGeolocationError(
  context: string,
  error: any
): void {
  const details = parseGeolocationError(error);
  console.error(
    `[${context}] Geolocation Error (Code: ${details.code}) ${details.message}`,
    error
  );
}

/**
 * Get user-friendly error message
 */
export function getGeolocationErrorMessage(error: any): string {
  return parseGeolocationError(error).userMessage;
}
