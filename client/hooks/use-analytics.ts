import { useEffect, useRef } from "react";
import { PageViewEvent, NavigationEvent, SearchEvent } from "@shared/api";

const VISITOR_ID_KEY = "futa_visitor_id";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

/**
 * Hook to track page views and navigation events
 * Sends analytics data to the server
 */
export function useAnalytics(pageName: string) {
  const pageStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Track page view
    pageStartTime.current = Date.now();
    const visitorId = getVisitorId();

    // Send page view event
    const trackPageView = async () => {
      try {
        await fetch("/api/analytics/page-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pageName,
            visitorId,
            timestamp: new Date().toISOString(),
          } as PageViewEvent),
        }).catch(() => { });
      } catch (error) {
        console.debug("Analytics tracking failed:", error);
      }
    };

    trackPageView();

    // Cleanup: track page exit time
    return () => {
      const duration = Math.round((Date.now() - pageStartTime.current) / 1000);

      try {
        fetch("/api/analytics/page-exit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pageName,
            duration,
            visitorId,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => { });
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
  method: "user_search" | "map_click" | "recommendation" | "route_reminder" | "emergency_sos" | "form_submission",
  distance?: number,
  duration?: number
) {
  try {
    const visitorId = getVisitorId();
    fetch("/api/analytics/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        method,
        distanceMeters: distance,
        duration,
        visitorId,
        timestamp: new Date().toISOString(),
      } as NavigationEvent),
    }).catch(() => { });
  } catch (error) {
    console.debug("Analytics navigation tracking failed:", error);
  }
}

/**
 * Track search queries
 */
export function trackSearch(query: string) {
  try {
    const visitorId = getVisitorId();
    fetch("/api/analytics/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        visitorId,
        timestamp: new Date().toISOString(),
      } as SearchEvent),
    }).catch(() => { });
  } catch (error) {
    console.debug("Analytics search tracking failed:", error);
  }
}
