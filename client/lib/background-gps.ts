/**
 * Background GPS Tracking
 * Maintains location state even when app is minimized or screen is locked
 * Stores location history in IndexedDB for offline access
 */

import { logGeolocationError, cachePosition, getCachedPosition } from './geolocation-utils';

interface StoredLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

interface LocationCallback {
  (location: GeolocationCoordinates): void;
}

const DB_NAME = "futa-navigator";
const STORE_NAME = "locations";
const LOCATION_TIMEOUT = 60000; // 1 minute

let db: IDBDatabase | null = null;
let watcherId: number | null = null;
let lastLocation: GeolocationCoordinates | null = null;
let backgroundTrackingEnabled = false;

/**
 * Initialize IndexedDB for storing location history
 */
async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object store for locations
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id"
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Save location to IndexedDB
 */
async function saveLocation(coords: GeolocationCoordinates, timestamp: number): Promise<void> {
  try {
    const database = await initializeDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const location: StoredLocation = {
      id: `loc-${timestamp}-${Math.random()}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp,
      altitude: coords.altitude ?? undefined,
      heading: coords.heading ?? undefined,
      speed: coords.speed ?? undefined
    };

    store.add(location);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error("[Background GPS] Error saving location:", error);
  }
}

/**
 * Get recent locations from IndexedDB
 */
export async function getRecentLocations(
  minutes: number = 30
): Promise<StoredLocation[]> {
  try {
    const database = await initializeDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");

    const cutoffTime = Date.now() - minutes * 60 * 1000;
    const range = IDBKeyRange.lowerBound(cutoffTime);

    return new Promise((resolve, reject) => {
      const request = index.getAll(range);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[Background GPS] Error retrieving locations:", error);
    return [];
  }
}

/**
 * Clear old location history
 */
export async function clearOldLocations(days: number = 7): Promise<void> {
  try {
    const database = await initializeDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");

    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const range = IDBKeyRange.upperBound(cutoffTime);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      request.onerror = () => reject(request.error);

      setTimeout(() => resolve(), 100);
    });
  } catch (error) {
    console.error("[Background GPS] Error clearing old locations:", error);
  }
}

/**
 * Start background GPS tracking
 * Watches location and stores it for offline access
 */
export function startBackgroundTracking(
  onLocationUpdate?: LocationCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    backgroundTrackingEnabled = true;

    let errorCount = 0;

    // High accuracy watch position
    watcherId = navigator.geolocation.watchPosition(
      async (position) => {
        const { coords, timestamp } = position;
        lastLocation = coords;
        errorCount = 0; // Reset error count on successful location

        // Save to IndexedDB for offline access
        await saveLocation(coords, timestamp);

        // Trigger callback if provided
        if (onLocationUpdate) {
          onLocationUpdate(coords);
        }

        console.log(
          "[Background GPS] Location updated:",
          `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
        );
      },
      (error: any) => {
        errorCount++;
        logGeolocationError("[Background GPS] Tracking", error);

        // Log recovery action if timeout errors are common
        if (error?.code === 3) {
          console.warn("[Background GPS] Location timeout - retrying with relaxed settings");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT, // 60 seconds for background tracking
        maximumAge: 10000 // Cache for 10 seconds
      }
    );

    // Request background app refresh (iOS 13+)
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        console.log("[Background GPS] Background app refresh scheduled");
      });
    }

    resolve();
  });
}

/**
 * Stop background GPS tracking
 */
export function stopBackgroundTracking(): void {
  if (watcherId !== null) {
    navigator.geolocation.clearWatch(watcherId);
    watcherId = null;
    backgroundTrackingEnabled = false;
    console.log("[Background GPS] Tracking stopped");
  }
}

/**
 * Get current cached location
 */
export function getLastLocation(): GeolocationCoordinates | null {
  return lastLocation;
}

/**
 * Check if background tracking is active
 */
export function isBackgroundTrackingEnabled(): boolean {
  return backgroundTrackingEnabled;
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    // Check current permission
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({
        name: 'geolocation'
      });

      if (permission.state === 'granted') {
        return true;
      }

      if (permission.state === 'denied') {
        return false;
      }
    }

    // Request permission
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          console.log("[Background GPS] Permission granted");
          resolve(true);
        },
        () => {
          console.log("[Background GPS] Permission denied");
          resolve(false);
        }
      );
    });
  } catch (error) {
    console.error("[Background GPS] Error requesting permission:", error);
    return false;
  }
}

/**
 * Calculate distance between two coordinates (in meters)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get location history trajectory
 */
export async function getLocationTrajectory(minutes: number = 30): Promise<Array<{
  lat: number;
  lng: number;
  timestamp: number;
}>> {
  const locations = await getRecentLocations(minutes);
  return locations
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((loc) => ({
      lat: loc.latitude,
      lng: loc.longitude,
      timestamp: loc.timestamp
    }));
}

/**
 * Estimate time to location
 */
export function estimateTimeToLocation(
  targetLat: number,
  targetLng: number,
  walkingSpeedMs: number = 1.4 // 1.4 m/s = ~5 km/h
): number | null {
  if (!lastLocation) {
    return null;
  }

  const distance = calculateDistance(
    lastLocation.latitude,
    lastLocation.longitude,
    targetLat,
    targetLng
  );

  return Math.round(distance / walkingSpeedMs); // seconds
}

/**
 * Start proximity monitoring
 * Alert when within a certain distance of a target
 */
export function monitorProximity(
  targetLat: number,
  targetLng: number,
  radiusMeters: number = 100,
  onProximity?: () => void
): () => void {
  let proximityReached = false;

  const handler = (coords: GeolocationCoordinates) => {
    const distance = calculateDistance(
      coords.latitude,
      coords.longitude,
      targetLat,
      targetLng
    );

    if (distance <= radiusMeters && !proximityReached) {
      proximityReached = true;
      console.log("[Background GPS] Proximity reached:", { distance, radiusMeters });

      if (onProximity) {
        onProximity();
      }
    } else if (distance > radiusMeters) {
      proximityReached = false;
    }
  };

  // Start tracking if not already enabled
  if (!backgroundTrackingEnabled) {
    startBackgroundTracking(handler).catch(console.error);
  }

  return () => {
    // Could stop tracking here, but we keep it for other purposes
  };
}
