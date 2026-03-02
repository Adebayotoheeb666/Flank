import { RequestHandler } from "express";
import { NavigationService } from "../lib/navigation";
import { RouteRequest } from "../../shared/navigation";

export const handleRouteRequest: RequestHandler = async (req, res) => {
  try {
    const { start_lat, start_lng, end_location_id, prefer_flat } = req.body as RouteRequest;

    if (!start_lat || !start_lng || !end_location_id) {
      res.status(400).json({ error: "Missing required route parameters" });
      return;
    }

    const navService = await NavigationService.load();

    // Map the target building location to our navigation graph nodes
    // For now, mapping some known IDs from our seed data or manually
    // In a real app, this would be more dynamic.
    const endNodeId = end_location_id; // For simplicity, assume they match our node IDs for now.

    const startNodeId = navService.findNearestNode(start_lat, start_lng);
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
