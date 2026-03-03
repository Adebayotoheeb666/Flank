import { RequestHandler } from "express";
import { supabase } from "../../shared/supabase";

interface Shortcut {
  id: string;
  start_location: string;
  end_location: string;
  distance_meters: number;
  time_saved_seconds: number;
  usage_count: number;
  is_verified: boolean;
  created_by: string;
  created_at: string;
  coordinates: Array<[number, number]>;
}

/**
 * GET /api/shortcuts
 * Get all available shortcuts (most popular first)
 */
export const handleGetShortcuts: RequestHandler = async (req, res) => {
  try {
    const { limit } = req.query;
    const pageLimit = parseInt(limit as string) || 50;

    const { data, error } = await supabase
      .from("shortcuts")
      .select("*")
      .eq("is_verified", true)
      .order("usage_count", { ascending: false })
      .limit(pageLimit);

    if (error) {
      console.error("Supabase Error:", error);
      return res.json([]);
    }

    res.json(data || []);
  } catch (error) {
    console.error("Get shortcuts error:", error);
    res.status(500).json({ error: "Failed to fetch shortcuts" });
  }
};

/**
 * POST /api/shortcuts/report
 * Report a new shortcut or shortcut usage
 */
export const handleReportShortcut: RequestHandler = async (req, res) => {
  try {
    const {
      startLocation,
      endLocation,
      distanceMeters,
      timeSavedSeconds,
      userId,
      coordinates
    }: {
      startLocation: string;
      endLocation: string;
      distanceMeters: number;
      timeSavedSeconds: number;
      userId: string;
      coordinates: Array<[number, number]>;
    } = req.body;

    if (!startLocation || !endLocation || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if shortcut already exists
    const { data: existing, error: checkError } = await supabase
      .from("shortcuts")
      .select("id, usage_count")
      .eq("start_location", startLocation)
      .eq("end_location", endLocation)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Check error:", checkError);
      return res.status(500).json({ error: "Failed to check shortcut" });
    }

    if (existing) {
      // Update existing shortcut
      const { data: updated, error: updateError } = await supabase
        .from("shortcuts")
        .update({ usage_count: existing.usage_count + 1 })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        return res.status(500).json({ error: "Failed to update shortcut" });
      }

      return res.json(updated);
    }

    // Create new shortcut
    const { data: created, error: createError } = await supabase
      .from("shortcuts")
      .insert([
        {
          start_location: startLocation,
          end_location: endLocation,
          distance_meters: distanceMeters || 0,
          time_saved_seconds: timeSavedSeconds || 0,
          usage_count: 1,
          is_verified: false, // Requires admin verification
          created_by: userId,
          coordinates: coordinates || [],
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error("Create error:", createError);
      return res.status(500).json({ error: "Failed to create shortcut" });
    }

    res.status(201).json(created);
  } catch (error) {
    console.error("Report shortcut error:", error);
    res.status(500).json({ error: "Failed to report shortcut" });
  }
};

/**
 * POST /api/shortcuts/:id/verify
 * Admin endpoint to verify a shortcut
 */
export const handleVerifyShortcut: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const { data: updated, error } = await supabase
      .from("shortcuts")
      .update({ is_verified: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Verify error:", error);
      return res.status(500).json({ error: "Failed to verify shortcut" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Verify shortcut error:", error);
    res.status(500).json({ error: "Failed to verify shortcut" });
  }
};

/**
 * GET /api/shortcuts/between/:startLocationId/:endLocationId
 * Get best shortcut between two specific locations
 */
export const handleGetShortcutsBetween: RequestHandler = async (req, res) => {
  try {
    const { startLocationId, endLocationId } = req.params;

    const { data, error } = await supabase
      .from("shortcuts")
      .select("*")
      .eq("start_location", startLocationId)
      .eq("end_location", endLocationId)
      .eq("is_verified", true)
      .order("usage_count", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === "PGRST116") {
      // No shortcut found
      return res.json(null);
    }

    if (error) {
      console.error("Get shortcut error:", error);
      return res.status(500).json({ error: "Failed to fetch shortcut" });
    }

    res.json(data);
  } catch (error) {
    console.error("Get shortcut error:", error);
    res.status(500).json({ error: "Failed to fetch shortcut" });
  }
};
