import { supabase } from '../../shared/supabase';

export const handler = async (event, context) => {
  // Route based on path and method
  const { httpMethod, path, queryStringParameters } = event;
  const body = event.body ? JSON.parse(event.body) : {};

  // /api/analytics/page-view
  if (httpMethod === 'POST' && path.endsWith('/page-view')) {
    const { page, timestamp, visitorId } = body;
    if (!page || !visitorId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    const pageViewData = {
      page,
      visitor_id: visitorId,
      timestamp: timestamp || new Date().toISOString(),
    };
    const { error } = await supabase.from('page_views').insert([pageViewData]);
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to log page view' })
      };
    }
    return { statusCode: 200, body: JSON.stringify({ tracked: true }) };
  }

  // /api/analytics/page-exit
  if (httpMethod === 'POST' && path.endsWith('/page-exit')) {
    const { page, duration, visitorId } = body;
    if (!page || !visitorId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    const { data: latestView, error: fetchError } = await supabase
      .from('page_views')
      .select('id')
      .eq('page', page)
      .eq('visitor_id', visitorId)
      .is('duration', null)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fetchError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
    if (latestView) {
      const { error: updateError } = await supabase
        .from('page_views')
        .update({ duration })
        .eq('id', latestView.id);
      if (updateError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to log page exit' })
        };
      }
    }
    return { statusCode: 200, body: JSON.stringify({ tracked: true }) };
  }

  // /api/analytics/navigation
  if (httpMethod === 'POST' && path.endsWith('/navigation')) {
    const { from, to, method, distanceMeters, visitorId, timestamp } = body;
    if (!from || !to || !method || !visitorId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: from, to, method, visitorId' })
      };
    }
    const { error } = await supabase.from('navigation_events').insert([
      {
        start_location: from,
        end_location: to,
        method,
        distance: distanceMeters,
        visitor_id: visitorId,
        timestamp: timestamp || new Date().toISOString()
      }
    ]);
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to log navigation' })
      };
    }
    return { statusCode: 200, body: JSON.stringify({ tracked: true }) };
  }

  // /api/analytics/search
  if (httpMethod === 'POST' && path.endsWith('/search')) {
    const { query, timestamp, visitorId } = body;
    if (!query || !visitorId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    const searchData = {
      query: query.toLowerCase(),
      visitor_id: visitorId,
      timestamp: timestamp || new Date().toISOString(),
    };
    const { error } = await supabase.from('search_events').insert([searchData]);
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to log search' })
      };
    }
    return { statusCode: 200, body: JSON.stringify({ tracked: true }) };
  }

  // /api/analytics/dashboard
  if (httpMethod === 'GET' && path.endsWith('/dashboard')) {
    try {
      const { count: totalPageViews } = await supabase.from('page_views').select('*', { count: 'exact', head: true });
      const { count: totalNavigations } = await supabase.from('navigation_events').select('*', { count: 'exact', head: true });
      const { data: viewsData, error: viewsError } = await supabase.from('page_views').select('duration, visitor_id, page');
      if (viewsError) throw viewsError;
      const averageSessionDuration = Math.round((viewsData || []).reduce((sum, pv) => sum + (pv.duration || 0), 0) / Math.max(viewsData?.length || 1, 1));
      const uniqueVisitors = new Set((viewsData || []).map(pv => pv.visitor_id)).size;
      const { data: navData, error: navError } = await supabase.from('navigation_events').select('end_location');
      if (navError) throw navError;
      const destinationMap = new Map();
      (navData || []).forEach((nav) => {
        const key = nav.end_location;
        const existing = destinationMap.get(key) || { buildingId: key, buildingName: key, visitCount: 0, navigationCount: 0, popularity: 'low' };
        existing.navigationCount++;
        destinationMap.set(key, existing);
      });
      (viewsData || []).forEach((pv) => {
        if (pv.page !== '/' && pv.page !== '/index') {
          const key = pv.page.replace(/\//g, '');
          const existing = destinationMap.get(key) || { buildingId: key, buildingName: key, visitCount: 0, navigationCount: 0, popularity: 'low' };
          existing.visitCount++;
          destinationMap.set(key, existing);
        }
      });
      const destinations = Array.from(destinationMap.values()).map((dest) => {
        const totalInteractions = dest.visitCount + dest.navigationCount;
        dest.popularity = totalInteractions > 20 ? 'high' : totalInteractions > 5 ? 'medium' : 'low';
        return dest;
      });
      const mostVisitedDestinations = destinations.sort((a, b) => (b.visitCount + b.navigationCount) - (a.visitCount + a.navigationCount)).slice(0, 10);
      const { data: searchData, error: searchError } = await supabase.from('search_events').select('query');
      if (searchError) throw searchError;
      const searchMap = new Map();
      (searchData || []).forEach((sq) => { searchMap.set(sq.query, (searchMap.get(sq.query) || 0) + 1); });
      const topSearchQueries = Array.from(searchMap.entries()).map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 10);
      return {
        statusCode: 200,
        body: JSON.stringify({
          totalPageViews: totalPageViews || 0,
          totalNavigations: totalNavigations || 0,
          mostVisitedDestinations,
          averageSessionDuration,
          uniqueVisitors,
          topSearchQueries,
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch analytics dashboard' })
      };
    }
  }

  // /api/analytics/raw
  if (httpMethod === 'GET' && path.endsWith('/raw')) {
    try {
      const [pv, nav, search] = await Promise.all([
        supabase.from('page_views').select('*'),
        supabase.from('navigation_events').select('*'),
        supabase.from('search_events').select('*')
      ]);
      return {
        statusCode: 200,
        body: JSON.stringify({
          pageViews: pv.data || [],
          navigationEvents: nav.data || [],
          searchQueries: search.data || [],
          total: {
            pageViews: (pv.data || []).length,
            navigationEvents: (nav.data || []).length,
            searchQueries: (search.data || []).length,
          },
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch analytics data' })
      };
    }
  }

  // --- Virtual Tour Endpoints ---
  // GET /api/virtual-tour/buildings
  if (httpMethod === 'GET' && path.endsWith('/virtual-tour/buildings')) {
    try {
      let query = supabase.from('virtual_tour_buildings').select('*').order('name', { ascending: true });
      if (queryStringParameters && queryStringParameters.category) {
        query = query.eq('category', queryStringParameters.category);
      }
      const { data, error } = await query;
      if (error) return { statusCode: 200, body: JSON.stringify([]) };
      return { statusCode: 200, body: JSON.stringify(data || []) };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify([]) };
    }
  }

  // GET /api/virtual-tour/buildings/:buildingId
  const buildingIdMatch = path.match(/\/virtual-tour\/buildings\/(\w+)/);
  if (httpMethod === 'GET' && buildingIdMatch) {
    try {
      const buildingId = buildingIdMatch[1];
      const { data, error } = await supabase.from('virtual_tour_buildings').select('*').eq('id', buildingId).maybeSingle();
      if (error) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
      return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch building' }) };
    }
  }

  // POST /api/virtual-tour/buildings/:buildingId/view
  const buildingViewMatch = path.match(/\/virtual-tour\/buildings\/(\w+)\/view/);
  if (httpMethod === 'POST' && buildingViewMatch) {
    try {
      const buildingId = buildingViewMatch[1];
      // You can implement view tracking logic here if needed
      return { statusCode: 200, body: JSON.stringify({ viewed: true }) };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to track view' }) };
    }
  }

  // POST /api/virtual-tour/buildings (add new building)
  if (httpMethod === 'POST' && path.endsWith('/virtual-tour/buildings')) {
    try {
      const { name, type, category, description, coordinates, image_url } = body;
      if (!name || !type || !category || !description || !coordinates || !image_url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
      }
      const { data, error } = await supabase.from('virtual_tour_buildings').insert([{ name, type, category, description, coordinates, image_url }]);
      if (error) return { statusCode: 500, body: JSON.stringify({ error: 'Failed to add building' }) };
      return { statusCode: 201, body: JSON.stringify(data) };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to add building' }) };
    }
  }

  // Not found
  return { statusCode: 404, body: 'Not found' };
};
