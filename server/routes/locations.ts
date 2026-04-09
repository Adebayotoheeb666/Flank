import { RequestHandler } from "express";
import { supabase } from "../../shared/supabase";
import { Location } from "../../shared/api";

export const handleGetLocations: RequestHandler = async (req, res) => {
  try {
    const { category } = req.query;
    let query = supabase.from("locations").select("*");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSearchLocations: RequestHandler = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .ilike("name", `%${q}%`); // Simple search, we can make it better with PostGIS later

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Search failed" });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handlePostLocation: RequestHandler = async (req, res) => {
  try {
    const locationData: Omit<Location, "id"> = req.body;
    const creatorId = req.body.creator_id;

    // Validate request body (simple check)
    if (!locationData.name || !locationData.type || !locationData.coordinates) {
      res.status(400).json({ error: "Missing required location fields" });
      return;
    }

    if (!creatorId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const { data, error } = await supabase
      .from("locations")
      .insert([{
        ...locationData,
        creator_id: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Failed to create location" });
      return;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PATCH /api/locations/:locationId
 * Update a location (only creator can update)
 */
export const handleUpdateLocation: RequestHandler = async (req, res) => {
  try {
    const { locationId } = req.params;
    const updates = req.body;
    const userId = req.body.user_id;

    if (!locationId) {
      return res.status(400).json({ error: "Missing location ID" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get the location to check creator
    const { data: location, error: getError } = await supabase
      .from("locations")
      .select("creator_id")
      .eq("id", locationId)
      .single();

    if (getError && getError.code === "PGRST116") {
      return res.status(404).json({ error: "Location not found" });
    }

    if (getError) {
      console.error("Supabase Error:", getError);
      return res.status(500).json({ error: "Failed to update location" });
    }

    // Check if user is the creator
    if (location?.creator_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to update this location" });
    }

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "type",
      "category",
      "description",
      "coordinates",
      "metadata"
    ];

    const safeUpdates: any = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    // Always update the updated_at timestamp
    safeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("locations")
      .update(safeUpdates)
      .eq("id", locationId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Failed to update location" });
    }

    res.json(data);
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
};

/**
 * DELETE /api/locations/:locationId
 * Delete a location (only creator can delete)
 */
export const handleDeleteLocation: RequestHandler = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.body.user_id;

    if (!locationId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the location to check creator
    const { data: location, error: getError } = await supabase
      .from("locations")
      .select("creator_id")
      .eq("id", locationId)
      .single();

    if (getError && getError.code === "PGRST116") {
      return res.status(404).json({ error: "Location not found" });
    }

    if (getError) {
      console.error("Supabase Error:", getError);
      return res.status(500).json({ error: "Failed to delete location" });
    }

    // Check if user is the creator
    if (location?.creator_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to delete this location" });
    }

    // Delete the location
    const { error: deleteError } = await supabase
      .from("locations")
      .delete()
      .eq("id", locationId);

    if (deleteError) {
      console.error("Supabase Error:", deleteError);
      return res.status(500).json({ error: "Failed to delete location" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete location error:", error);
    res.status(500).json({ error: "Failed to delete location" });
  }
};
