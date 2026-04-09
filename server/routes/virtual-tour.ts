import { RequestHandler } from "express";
import { supabase } from "../../shared/supabase";

export interface VirtualTourBuilding {
  id: string;
  name: string;
  short_name?: string;
  category: string;
  image_url: string;
  image_gallery?: string[];
  panorama_url?: string;
  video_url?: string;
  description: string;
  history: string;
  academic_depts: string[];
  facilities: string[];
  student_capacity?: number;
  year_built?: number;
  coordinates: { lat: number; lng: number };
  creator_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * GET /api/virtual-tour/buildings
 * Get all campus buildings for virtual tour
 */
export const handleGetTourBuildings: RequestHandler = async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from("virtual_tour_buildings")
      .select("*")
      .order("name", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Error:", error);
      // Return empty array if table doesn't exist
      return res.json([]);
    }

    res.json(data || []);
  } catch (error) {
    console.error("Get buildings error:", error);
    res.status(500).json({ error: "Failed to fetch buildings" });
  }
};

/**
 * GET /api/virtual-tour/buildings/:buildingId
 * Get detailed information about a specific building
 */
export const handleGetTourBuilding: RequestHandler = async (req, res) => {
  try {
    const { buildingId } = req.params;

    const { data, error } = await supabase
      .from("virtual_tour_buildings")
      .select("*")
      .eq("id", buildingId)
      .single();

    if (error && error.code === "PGRST116") {
      // Not found
      return res.status(404).json({ error: "Building not found" });
    }

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Failed to fetch building" });
    }

    res.json(data);
  } catch (error) {
    console.error("Get building error:", error);
    res.status(500).json({ error: "Failed to fetch building" });
  }
};

/**
 * POST /api/virtual-tour/buildings
 * Create a new building tour (user-generated)
 */
export const handleCreateTourBuilding: RequestHandler = async (req, res) => {
  try {
    const building: Omit<VirtualTourBuilding, "id"> = req.body;
    const creatorId = req.body.creator_id;

    if (!building.name || !building.category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!creatorId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { data, error } = await supabase
      .from("virtual_tour_buildings")
      .insert([
        {
          name: building.name,
          short_name: building.short_name,
          category: building.category,
          image_url: building.image_url,
          panorama_url: building.panorama_url,
          video_url: building.video_url,
          description: building.description,
          history: building.history,
          academic_depts: building.academic_depts,
          facilities: building.facilities,
          student_capacity: building.student_capacity,
          year_built: building.year_built,
          coordinates: building.coordinates,
          creator_id: creatorId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Failed to create building tour" });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Create building error:", error);
    res.status(500).json({ error: "Failed to create building tour" });
  }
};

/**
 * PATCH /api/virtual-tour/buildings/:buildingId
 * Update a building tour
 */
export const handleUpdateTourBuilding: RequestHandler = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const updates = req.body;

    if (!buildingId) {
      return res.status(400).json({ error: "Missing building ID" });
    }

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "short_name",
      "category",
      "image_url",
      "image_gallery",
      "panorama_url",
      "video_url",
      "description",
      "history",
      "academic_depts",
      "facilities",
      "student_capacity",
      "year_built",
      "coordinates",
      "is_featured"
    ];

    const safeUpdates: any = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    const { data, error } = await supabase
      .from("virtual_tour_buildings")
      .update(safeUpdates)
      .eq("id", buildingId)
      .select()
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Building not found" });
    }

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Failed to update building tour" });
    }

    res.json(data);
  } catch (error) {
    console.error("Update building error:", error);
    res.status(500).json({ error: "Failed to update building tour" });
  }
};

/**
 * DELETE /api/virtual-tour/buildings/:buildingId
 * Delete a building tour (only creator can delete)
 */
export const handleDeleteTourBuilding: RequestHandler = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const userId = req.body.user_id;

    if (!buildingId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the building to check creator
    const { data: building, error: getError } = await supabase
      .from("virtual_tour_buildings")
      .select("creator_id")
      .eq("id", buildingId)
      .single();

    if (getError && getError.code === "PGRST116") {
      return res.status(404).json({ error: "Building not found" });
    }

    if (getError) {
      console.error("Supabase Error:", getError);
      return res.status(500).json({ error: "Failed to delete building tour" });
    }

    // Check if user is the creator
    if (building?.creator_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to delete this tour" });
    }

    // Delete the building
    const { error: deleteError } = await supabase
      .from("virtual_tour_buildings")
      .delete()
      .eq("id", buildingId);

    if (deleteError) {
      console.error("Supabase Error:", deleteError);
      return res.status(500).json({ error: "Failed to delete building tour" });
    }

    res.json({ success: true, message: "Building tour deleted successfully" });
  } catch (error) {
    console.error("Delete building error:", error);
    res.status(500).json({ error: "Failed to delete building tour" });
  }
};

/**
 * GET /api/virtual-tour/highlights
 * Get highlighted/featured buildings for the tour intro
 */
export const handleGetHighlights: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("virtual_tour_buildings")
      .select("*")
      .eq("is_featured", true)
      .order("name", { ascending: true })
      .limit(6);

    if (error) {
      console.error("Supabase Error:", error);
      return res.json([]);
    }

    res.json(data || []);
  } catch (error) {
    console.error("Get highlights error:", error);
    res.status(500).json({ error: "Failed to fetch highlights" });
  }
};

/**
 * POST /api/virtual-tour/buildings/:buildingId/view
 * Log a tour view for analytics
 */
export const handleLogTourView: RequestHandler = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { userId } = req.body;

    if (!buildingId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Increment view count on the building
    const { data: building, error: getError } = await supabase
      .from("virtual_tour_buildings")
      .select("visitors_count")
      .eq("id", buildingId)
      .single();

    if (getError && getError.code !== "PGRST116") {
      console.error("Get error:", getError);
      return res.status(500).json({ error: "Failed to log view" });
    }

    const newCount = (building?.visitors_count || 0) + 1;

    const { data: updated, error: updateError } = await supabase
      .from("virtual_tour_buildings")
      .update({ visitors_count: newCount })
      .eq("id", buildingId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return res.status(500).json({ error: "Failed to log view" });
    }

    // Optionally log to tour_views table for detailed analytics
    const { error: logError } = await supabase
      .from("tour_views")
      .insert([
        {
          building_id: buildingId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        }
      ]);

    if (logError && logError.code !== "PGRST116") {
      console.warn("Log view error:", logError);
    }

    res.json(updated);
  } catch (error) {
    console.error("Log view error:", error);
    res.status(500).json({ error: "Failed to log view" });
  }
};
