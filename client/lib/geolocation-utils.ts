/**
 * Utility functions for handling Geolocation API errors
 *
 * TIMEOUT BEST PRACTICES:
 * - getCurrentPosition (one-time): 30-60 seconds (device needs to acquire lock)
 * - watchPosition (continuous): 45+ seconds (allows device to use cached/low-accuracy data)
 * - maximumAge: Use generous values (60000+) to allow cached positions
 * - Timeouts < 15s often fail on weak GPS/network conditions
 *
 * ERROR CODES:
 * - 1: PERMISSION_DENIED - User denied location access
 * - 2: POSITION_UNAVAILABLE - Device/service unavailable
 * - 3: TIMEOUT - Device couldn't get position within timeout period
 *
 * FALLBACK STRATEGY:
 * - Store last known good position in sessionStorage
 * - Use cached position if fresh (within 5 minutes)
 * - Retry with relaxed accuracy if first attempt times out
 */

export interface GeolocationErrorDetails {
  code: number;
  message: string;
  userMessage: string;
}

// Cache for last known good position
const CACHE_KEY = 'geolocation-cache';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

interface CachedPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export function getCachedPosition(): GeolocationCoordinates | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedPosition = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    // Only use cache if less than 5 minutes old
    if (age > CACHE_MAX_AGE) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Return as GeolocationCoordinates-like object
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy
      })
    };
  } catch (error) {
    console.warn("[Geolocation] Failed to retrieve cached position:", error);
    return null;
  }
}

export function cachePosition(coords: GeolocationCoordinates): void {
  try {
    const cached: CachedPosition = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn("[Geolocation] Failed to cache position:", error);
  }
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
 * Log geolocation error with full details (without stringifying the raw error object)
 */
export function logGeolocationError(
  context: string,
  error: any
): void {
  const details = parseGeolocationError(error);
  const errorInfo = {
    code: error?.code,
    message: error?.message,
    PERMISSION_DENIED: error?.code === 1 ? 'true' : 'false',
    POSITION_UNAVAILABLE: error?.code === 2 ? 'true' : 'false',
    TIMEOUT: error?.code === 3 ? 'true' : 'false',
  };

  console.error(
    `[${context}] Geolocation Error (Code: ${details.code}) ${details.message}`,
    errorInfo
  );
}

/**
 * Get user-friendly error message
 */
export function getGeolocationErrorMessage(error: any): string {
  return parseGeolocationError(error).userMessage;
}
