import { useEffect, useRef } from "react";
import { PageViewEvent, NavigationEvent } from "@shared/api";

/**
 * Hook to track page views and navigation events
 * Sends analytics data to the server
 */
export function useAnalytics(pageName: string) {
  const sessionStartTime = useRef<number>(Date.now());
  const pageStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Track page view
    pageStartTime.current = Date.now();

    // Send page view event
    const trackPageView = async () => {
      try {
        await fetch("/api/analytics/page-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pageName,
            timestamp: new Date().toISOString(),
          } as PageViewEvent),
        }).catch(() => {
          // Silently fail - don't interrupt user experience
        });
      } catch (error) {
        console.debug("Analytics tracking failed:", error);
      }
    };

    trackPageView();

    // Cleanup: track page exit time
    return () => {
      const duration = Math.round((Date.now() - pageStartTime.current) / 1000);
      
      try {
        // Send page exit with duration (fire and forget)
        fetch("/api/analytics/page-exit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pageName,
            duration,
            timestamp: new Date().toISOString(),
          } as any),
        }).catch(() => {
          // Silently fail
        });
      } catch (error) {
        console.debug("Analytics tracking failed:", error);
      }
    };
  }, [pageName]);
}

/**
 * Track navigation events
 */
export function trackNavigation(
  from: string,
  to: string,
  method: "user_search" | "map_click" | "recommendation",
  distance?: number,
  duration?: number
) {
  try {
    fetch("/api/analytics/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        method,
        distanceMeters: distance,
        duration,
        timestamp: new Date().toISOString(),
      } as NavigationEvent),
    }).catch(() => {
      // Silently fail - don't interrupt user experience
    });
  } catch (error) {
    console.debug("Analytics navigation tracking failed:", error);
  }
}

/**
 * Track search queries
 */
export function trackSearch(query: string) {
  try {
    fetch("/api/analytics/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        timestamp: new Date().toISOString(),
      } as any),
    }).catch(() => {
      // Silently fail
    });
  } catch (error) {
    console.debug("Analytics search tracking failed:", error);
  }
}
