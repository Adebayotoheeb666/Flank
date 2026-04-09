import { RequestHandler } from "express";
import { supabase } from "../../shared/supabase";

interface GuidanceStep {
  id: number;
  instruction: string;
  landmark: string;
  action: string;
  distance: string;
  tips: string[];
  creator_id?: string;
  created_at?: string;
  updated_at?: string;
  step_order?: number;
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
      tips: step.tips || [],
      creator_id: step.creator_id,
      created_at: step.created_at,
      updated_at: step.updated_at,
      step_order: step.step_order
    }));

    res.json(guidance);
  } catch (error) {
    console.error("Get guidance error:", error);
    res.status(500).json({ error: "Failed to get guidance" });
  }
};

/**
 * PATCH /api/guidance/:stepId
 * Update a guidance step (only creator can update)
 */
export const updateGuidanceStep: RequestHandler = async (req, res) => {
  try {
    const { stepId } = req.params;
    const updates = req.body;
    const userId = req.body.user_id;

    if (!stepId) {
      return res.status(400).json({ error: "Missing step ID" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get the step to check creator
    const { data: step, error: getError } = await supabase
      .from("guidance_steps")
      .select("creator_id")
      .eq("id", stepId)
      .single();

    if (getError && getError.code === "PGRST116") {
      return res.status(404).json({ error: "Guidance step not found" });
    }

    if (getError) {
      console.error("Supabase Error:", getError);
      return res.status(500).json({ error: "Failed to update guidance step" });
    }

    // Check if user is the creator
    if (step?.creator_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to update this guidance step" });
    }

    // Only allow updating specific fields
    const allowedFields = [
      "instruction",
      "landmark",
      "action",
      "distance",
      "tips",
      "step_order"
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
      .from("guidance_steps")
      .update(safeUpdates)
      .eq("id", stepId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Failed to update guidance step" });
    }

    res.json(data);
  } catch (error) {
    console.error("Update guidance step error:", error);
    res.status(500).json({ error: "Failed to update guidance step" });
  }
};

/**
 * DELETE /api/guidance/:stepId
 * Delete a guidance step (only creator can delete)
 */
export const deleteGuidanceStep: RequestHandler = async (req, res) => {
  try {
    const { stepId } = req.params;
    const userId = req.body.user_id;

    if (!stepId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the step to check creator
    const { data: step, error: getError } = await supabase
      .from("guidance_steps")
      .select("creator_id")
      .eq("id", stepId)
      .single();

    if (getError && getError.code === "PGRST116") {
      return res.status(404).json({ error: "Guidance step not found" });
    }

    if (getError) {
      console.error("Supabase Error:", getError);
      return res.status(500).json({ error: "Failed to delete guidance step" });
    }

    // Check if user is the creator
    if (step?.creator_id !== userId) {
      return res.status(403).json({ error: "You don't have permission to delete this guidance step" });
    }

    // Delete the step
    const { error: deleteError } = await supabase
      .from("guidance_steps")
      .delete()
      .eq("id", stepId);

    if (deleteError) {
      console.error("Supabase Error:", deleteError);
      return res.status(500).json({ error: "Failed to delete guidance step" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete guidance step error:", error);
    res.status(500).json({ error: "Failed to delete guidance step" });
  }
};
