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

    // Validate request body (simple check)
    if (!locationData.name || !locationData.type || !locationData.coordinates) {
      res.status(400).json({ error: "Missing required location fields" });
      return;
    }

    const { data, error } = await supabase
      .from("locations")
      .insert([locationData])
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
