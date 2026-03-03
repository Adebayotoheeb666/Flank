import { RequestHandler } from "express";
import { NavigationService } from "../lib/navigation";
import { RouteRequest } from "../../shared/navigation";
import { supabase } from "../../shared/supabase";

export const handleRouteRequest: RequestHandler = async (req, res) => {
  try {
    const { start_lat, start_lng, end_location_id, prefer_flat } = req.body as RouteRequest;

    if (!start_lat || !start_lng || !end_location_id) {
      res.status(400).json({ error: "Missing required route parameters" });
      return;
    }

    // Fetch the destination location from Supabase to get its coordinates
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("coordinates")
      .eq("id", end_location_id)
      .single();

    if (locError || !location) {
      res.status(404).json({ error: "Location not found" });
      return;
    }

    const navService = await NavigationService.load();

    // Find nearest nodes for both start and end locations
    const startNodeId = navService.findNearestNode(start_lat, start_lng);
    const endNodeId = navService.findNearestNode(location.coordinates.lat, location.coordinates.lng);

    const route = navService.calculateRoute(startNodeId, endNodeId, prefer_flat);

    if (!route) {
      res.status(404).json({ error: "No path found between the selected locations" });
      return;
    }

    res.json(route);
  } catch (error) {
    console.error("Navigation error:", error);
    res.status(500).json({ error: "Internal server error during routing" });
  }
};
