import { RequestHandler } from "express";
import { supabase } from "../../shared/supabase";

interface GuidanceStep {
  id: number;
  instruction: string;
  landmark: string;
  action: string;
  distance: string;
  tips: string[];
}

/**
 * GET /api/guidance
 * Get guidance sequence for freshers mode
 * Fetches from Supabase guidance_steps table
 */
export const getGuidance: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("guidance_steps")
      .select("*")
      .order("step_order", { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      // Return empty array if table doesn't exist yet
      return res.json([]);
    }

    // Transform database response to match expected format
    const guidance: GuidanceStep[] = (data || []).map((step: any) => ({
      id: step.id,
      instruction: step.instruction,
      landmark: step.landmark,
      action: step.action,
      distance: step.distance,
      tips: step.tips || []
    }));

    res.json(guidance);
  } catch (error) {
    console.error("Get guidance error:", error);
    res.status(500).json({ error: "Failed to get guidance" });
  }
};
