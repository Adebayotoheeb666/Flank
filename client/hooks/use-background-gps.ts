import { useEffect, useState, useCallback, useRef } from "react";
import {
  startBackgroundTracking,
  stopBackgroundTracking,
  getLastLocation,
  requestLocationPermission,
  monitorProximity,
  getLocationTrajectory,
  estimateTimeToLocation,
  isBackgroundTrackingEnabled
} from "@/lib/background-gps";

interface BackgroundGPSState {
  isTracking: boolean;
  hasPermission: boolean;
  lastLocation: GeolocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
}

export function useBackgroundGPS() {
  const [state, setState] = useState<BackgroundGPSState>({
    isTracking: isBackgroundTrackingEnabled(),
    hasPermission: false,
    lastLocation: getLastLocation(),
    isLoading: false,
    error: null
  });

  const proximityHandlers = useRef<Map<string, () => void>>(new Map());

  // Request location permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const hasPermission = await requestLocationPermission();
        setState(prev => ({ ...prev, hasPermission, isLoading: false }));

        if (hasPermission) {
          await startTracking();
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to request permission",
          isLoading: false
        }));
      }
    };

    checkPermission();
  }, []);

  const startTracking = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await startBackgroundTracking((coords) => {
        setState(prev => ({
          ...prev,
          lastLocation: coords,
          isLoading: false
        }));
      });
      setState(prev => ({ ...prev, isTracking: true, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to start tracking",
        isLoading: false
      }));
    }
  }, []);

  const stopTracking = useCallback(() => {
    stopBackgroundTracking();
    proximityHandlers.current.forEach(handler => handler());
    proximityHandlers.current.clear();
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  const addProximityMonitor = useCallback(
    (id: string, targetLat: number, targetLng: number, radiusMeters: number = 100) => {
      const cleanup = monitorProximity(targetLat, targetLng, radiusMeters, () => {
        // Trigger proximity event
        const event = new CustomEvent("proximity-reached", {
          detail: { id, lat: targetLat, lng: targetLng }
        });
        window.dispatchEvent(event);
      });

      proximityHandlers.current.set(id, cleanup);

      return () => {
        cleanup();
        proximityHandlers.current.delete(id);
      };
    },
    []
  );

  const getTrajectory = useCallback(async (minutes: number = 30) => {
    return await getLocationTrajectory(minutes);
  }, []);

  const getTimeToLocation = useCallback(
    (targetLat: number, targetLng: number, walkingSpeed?: number) => {
      return estimateTimeToLocation(targetLat, targetLng, walkingSpeed);
    },
    []
  );

  return {
    ...state,
    startTracking,
    stopTracking,
    addProximityMonitor,
    getTrajectory,
    getTimeToLocation
  };
}
