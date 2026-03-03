import { RequestHandler } from "express";
import { AnalyticsDashboard, DestinationAnalytics } from "@shared/api";
import { supabase } from "../../shared/supabase";

interface PageViewEvent {
  page: string;
  timestamp: string;
  duration?: number;
}

interface NavigationEventData {
  from: string;
  to: string;
  method: string;
  distanceMeters?: number;
  duration?: number;
  timestamp: string;
}

interface SearchEvent {
  query: string;
  timestamp: string;
}

// Fallback in-memory storage (for when Supabase tables are not available)
const pageViews: PageViewEvent[] = [];
const navigationEvents: NavigationEventData[] = [];
const searchQueries: SearchEvent[] = [];

/**
 * Track page view
 * POST /api/analytics/page-view
 * TODO: Persist all analytics to Supabase once analytics tables are created
 */
export const trackPageView: RequestHandler = async (req, res) => {
  try {
    const { page, timestamp } = req.body;

    if (!page) {
      return res.status(400).json({ error: "Missing page name" });
    }

    const pageViewData = {
      page,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Try to save to Supabase if available
    if (supabase) {
      const { error } = await supabase
        .from("page_views")
        .insert([pageViewData])
        .catch(() => ({ error: "Supabase not available" }));

      if (error) {
        console.warn("Failed to save page view to Supabase, using in-memory storage:", error);
        pageViews.push(pageViewData);
      }
    } else {
      pageViews.push(pageViewData);
    }

    res.json({ tracked: true });
  } catch (error) {
    console.error("Error tracking page view:", error);
    res.status(500).json({ error: "Failed to track page view" });
  }
};

/**
 * Track page exit
 * POST /api/analytics/page-exit
 */
export const trackPageExit: RequestHandler = (req, res) => {
  try {
    const { page, duration, timestamp } = req.body;

    if (!page) {
      return res.status(400).json({ error: "Missing page name" });
    }

    // Update the last page view with duration
    for (let i = pageViews.length - 1; i >= 0; i--) {
      if (pageViews[i].page === page && !pageViews[i].duration) {
        pageViews[i].duration = duration;
        break;
      }
    }

    res.json({ tracked: true });
  } catch (error) {
    console.error("Error tracking page exit:", error);
    res.status(500).json({ error: "Failed to track page exit" });
  }
};

/**
 * Track navigation
 * POST /api/analytics/navigation
 * TODO: Persist to Supabase once navigation_events table is created
 */
export const trackNavigation: RequestHandler = async (req, res) => {
  try {
    const { from, to, method, distanceMeters, duration, timestamp } = req.body;

    if (!from || !to || !method) {
      return res.status(400).json({
        error: "Missing required fields: from, to, method",
      });
    }

    const navigationData = {
      from,
      to,
      method,
      distanceMeters,
      duration,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Try to save to Supabase if available
    if (supabase) {
      const { error } = await supabase
        .from("navigation_events")
        .insert([navigationData])
        .catch(() => ({ error: "Supabase not available" }));

      if (error) {
        console.warn("Failed to save navigation to Supabase, using in-memory storage:", error);
        navigationEvents.push(navigationData);
      }
    } else {
      navigationEvents.push(navigationData);
    }

    console.log(`[Analytics] Navigation tracked: ${from} -> ${to}`);

    res.json({ tracked: true });
  } catch (error) {
    console.error("Error tracking navigation:", error);
    res.status(500).json({ error: "Failed to track navigation" });
  }
};

/**
 * Track search
 * POST /api/analytics/search
 * TODO: Persist to Supabase once search_events table is created
 */
export const trackSearch: RequestHandler = async (req, res) => {
  try {
    const { query, timestamp } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing search query" });
    }

    const searchData = {
      query: query.toLowerCase(),
      timestamp: timestamp || new Date().toISOString(),
    };

    // Try to save to Supabase if available
    if (supabase) {
      const { error } = await supabase
        .from("search_events")
        .insert([searchData])
        .catch(() => ({ error: "Supabase not available" }));

      if (error) {
        console.warn("Failed to save search to Supabase, using in-memory storage:", error);
        searchQueries.push(searchData);
      }
    } else {
      searchQueries.push(searchData);
    }

    console.log(`[Analytics] Search tracked: "${query}"`);

    res.json({ tracked: true });
  } catch (error) {
    console.error("Error tracking search:", error);
    res.status(500).json({ error: "Failed to track search" });
  }
};

/**
 * Get analytics dashboard data
 * GET /api/analytics/dashboard
 */
export const getAnalyticsDashboard: RequestHandler = (req, res) => {
  try {
    // Calculate metrics
    const totalPageViews = pageViews.length;
    const totalNavigations = navigationEvents.length;
    const averageSessionDuration = Math.round(
      pageViews.reduce((sum, pv) => sum + (pv.duration || 0), 0) / Math.max(pageViews.length, 1)
    );
    const uniqueVisitors = new Set(
      pageViews.map((_, i) => `visitor-${Math.floor(i / 5)}`)
    ).size; // Mock unique visitors

    // Get most visited destinations
    const destinationMap = new Map<string, DestinationAnalytics>();

    navigationEvents.forEach((nav) => {
      const key = nav.to;
      const existing = destinationMap.get(key) || {
        buildingId: key,
        buildingName: key,
        visitCount: 0,
        navigationCount: 0,
        popularity: "low" as const,
      };

      existing.navigationCount++;
      destinationMap.set(key, existing);
    });

    // Calculate visit counts from page views
    pageViews.forEach((pv) => {
      if (pv.page !== "/" && pv.page !== "/index") {
        const key = pv.page.replace(/\//g, "");
        const existing = destinationMap.get(key) || {
          buildingId: key,
          buildingName: key,
          visitCount: 0,
          navigationCount: 0,
          popularity: "low" as const,
        };

        existing.visitCount++;
        destinationMap.set(key, existing);
      }
    });

    // Determine popularity
    const destinations = Array.from(destinationMap.values()).map((dest) => {
      const totalInteractions = dest.visitCount + dest.navigationCount;
      dest.popularity =
        totalInteractions > 20 ? "high" : totalInteractions > 5 ? "medium" : "low";
      return dest;
    });

    const mostVisitedDestinations = destinations
      .sort((a, b) => (b.visitCount + b.navigationCount) - (a.visitCount + a.navigationCount))
      .slice(0, 10);

    // Get top search queries
    const searchMap = new Map<string, number>();
    searchQueries.forEach((sq) => {
      searchMap.set(sq.query, (searchMap.get(sq.query) || 0) + 1);
    });

    const topSearchQueries = Array.from(searchMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const dashboard: AnalyticsDashboard = {
      totalPageViews,
      totalNavigations,
      mostVisitedDestinations,
      averageSessionDuration,
      uniqueVisitors,
      topSearchQueries,
    };

    res.json(dashboard);
  } catch (error) {
    console.error("Error fetching analytics dashboard:", error);
    res.status(500).json({
      totalPageViews: 0,
      totalNavigations: 0,
      mostVisitedDestinations: [],
      averageSessionDuration: 0,
      uniqueVisitors: 0,
      topSearchQueries: [],
    });
  }
};

/**
 * Get raw analytics data (for detailed analysis)
 * GET /api/analytics/raw
 */
export const getRawAnalytics: RequestHandler = (req, res) => {
  try {
    res.json({
      pageViews,
      navigationEvents,
      searchQueries,
      total: {
        pageViews: pageViews.length,
        navigationEvents: navigationEvents.length,
        searchQueries: searchQueries.length,
      },
    });
  } catch (error) {
    console.error("Error fetching raw analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};
