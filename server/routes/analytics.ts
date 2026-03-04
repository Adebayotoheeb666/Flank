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

// Analytics data is now strictly persisted to Supabase
// No in-memory fallbacks allowed to ensure data consistency

/**
 * Track page view
 * POST /api/analytics/page-view
 * TODO: Persist all analytics to Supabase once analytics tables are created
 */
export const trackPageView: RequestHandler = async (req, res) => {
  try {
    const { page, timestamp, visitorId } = req.body;

    if (!page || !visitorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const pageViewData = {
      page,
      visitor_id: visitorId,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Save to Supabase
    if (supabase) {
      const { error } = await supabase
        .from("page_views")
        .insert([pageViewData]);

      if (error) {
        console.error("Failed to save page view to Supabase:", error);
        return res.status(500).json({ error: "Failed to log page view" });
      }
    } else {
      console.error("Supabase client not available");
      return res.status(503).json({ error: "Service unavailable" });
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
export const trackPageExit: RequestHandler = async (req, res) => {
  try {
    const { page, duration, visitorId } = req.body;

    if (!page || !visitorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!supabase) return res.status(503).json({ error: "Service unavailable" });

    // Update the most recent page view for this visitor and page that doesn't have a duration
    const { data: latestView, error: fetchError } = await supabase
      .from("page_views")
      .select("id")
      .eq("page", page)
      .eq("visitor_id", visitorId)
      .is("duration", null)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to fetch latest view:", fetchError);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (latestView) {
      const { error: updateError } = await supabase
        .from("page_views")
        .update({ duration })
        .eq("id", latestView.id);

      if (updateError) {
        console.error("Failed to update page exit duration:", updateError);
        return res.status(500).json({ error: "Failed to log page exit" });
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
 */
export const trackNavigation: RequestHandler = async (req, res) => {
  try {
    const { from, to, method, distanceMeters, visitorId, timestamp } = req.body;

    if (!from || !to || !method || !visitorId) {
      return res.status(400).json({
        error: "Missing required fields: from, to, method, visitorId",
      });
    }

    // Save to Supabase
    if (supabase) {
      const { error } = await supabase
        .from("navigation_events")
        .insert([{
          start_location: from,
          end_location: to,
          method,
          distance: distanceMeters,
          visitor_id: visitorId,
          timestamp: timestamp || new Date().toISOString()
        }]);

      if (error) {
        console.error("Failed to save navigation event:", error);
        return res.status(500).json({ error: "Failed to log navigation" });
      }
    } else {
      return res.status(503).json({ error: "Service unavailable" });
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
 */
export const trackSearch: RequestHandler = async (req, res) => {
  try {
    const { query, timestamp, visitorId } = req.body;

    if (!query || !visitorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const searchData = {
      query: query.toLowerCase(),
      visitor_id: visitorId,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Save to Supabase
    if (supabase) {
      const { error } = await supabase
        .from("search_events")
        .insert([searchData]);

      if (error) {
        console.error("Failed to save search to Supabase:", error);
        return res.status(500).json({ error: "Failed to log search" });
      }
    } else {
      return res.status(503).json({ error: "Service unavailable" });
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
export const getAnalyticsDashboard: RequestHandler = async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Service unavailable" });

    // Fetch metrics from Supabase
    const { count: totalPageViews } = await supabase.from("page_views").select("*", { count: "exact", head: true });
    const { count: totalNavigations } = await supabase.from("navigation_events").select("*", { count: "exact", head: true });

    const { data: viewsData, error: viewsError } = await supabase
      .from("page_views")
      .select("duration, visitor_id, page");

    if (viewsError) throw viewsError;

    const averageSessionDuration = Math.round(
      (viewsData || []).reduce((sum, pv) => sum + (pv.duration || 0), 0) / Math.max(viewsData?.length || 1, 1)
    );

    const uniqueVisitors = new Set((viewsData || []).map(pv => pv.visitor_id)).size;

    // Get most visited destinations
    const { data: navData, error: navError } = await supabase
      .from("navigation_events")
      .select("end_location");

    if (navError) throw navError;

    const destinationMap = new Map<string, DestinationAnalytics>();

    (navData || []).forEach((nav) => {
      const key = nav.end_location;
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
    (viewsData || []).forEach((pv) => {
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
    const { data: searchData, error: searchError } = await supabase
      .from("search_events")
      .select("query");

    if (searchError) throw searchError;

    const searchMap = new Map<string, number>();
    (searchData || []).forEach((sq) => {
      searchMap.set(sq.query, (searchMap.get(sq.query) || 0) + 1);
    });

    const topSearchQueries = Array.from(searchMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const dashboard: AnalyticsDashboard = {
      totalPageViews: totalPageViews || 0,
      totalNavigations: totalNavigations || 0,
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
export const getRawAnalytics: RequestHandler = async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Service unavailable" });

    const [pv, nav, search] = await Promise.all([
      supabase.from("page_views").select("*"),
      supabase.from("navigation_events").select("*"),
      supabase.from("search_events").select("*")
    ]);

    res.json({
      pageViews: pv.data || [],
      navigationEvents: nav.data || [],
      searchQueries: search.data || [],
      total: {
        pageViews: (pv.data || []).length,
        navigationEvents: (nav.data || []).length,
        searchQueries: (search.data || []).length,
      },
    });
  } catch (error) {
    console.error("Error fetching raw analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};
