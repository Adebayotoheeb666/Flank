import { RequestHandler } from "express";

interface GuidanceStep {
  id: number;
  instruction: string;
  landmark: string;
  action: string;
  distance: string;
  tips: string[];
}

// Guidance data for freshers (should be moved to Supabase once guidance_steps table is created)
const GUIDANCE_SEQUENCE: GuidanceStep[] = [
  {
    id: 1,
    instruction: "Start at the Main Gate",
    landmark: "The big red gate with FUTA signage",
    action: "Walk straight ahead towards the clock tower",
    distance: "200m",
    tips: ["Look for the FUTA banner", "Avoid vehicles during peak hours"]
  },
  {
    id: 2,
    instruction: "Pass the Big Mango Tree",
    landmark: "A large ancient mango tree on your left",
    action: "Continue straight, the tree should be on your left side",
    distance: "150m",
    tips: ["Many students rest under this tree", "Great landmark for orientation"]
  },
  {
    id: 3,
    instruction: "Turn right at the Clock Tower",
    landmark: "The iconic white clock tower at the campus center",
    action: "Make a sharp right turn",
    distance: "100m",
    tips: ["This is the campus landmark", "Perfect place for photos"]
  },
  {
    id: 4,
    instruction: "Head towards Senate Building",
    landmark: "A large administrative building ahead",
    action: "Walk straight until you see the Senate Building",
    distance: "250m",
    tips: ["This is the administrative center", "Most student services are here"]
  },
  {
    id: 5,
    instruction: "Arrival at Destination",
    landmark: "You have arrived",
    action: "Check in with the reception",
    distance: "0m",
    tips: ["Welcome to FUTA!", "Ask staff for further directions if needed"]
  }
];

/**
 * GET /api/guidance
 * Get guidance sequence for freshers mode
 * TODO: Replace with Supabase query once guidance_steps table is created
 */
export const getGuidance: RequestHandler = (req, res) => {
  try {
    res.json(GUIDANCE_SEQUENCE);
  } catch (error) {
    console.error("Get guidance error:", error);
    res.status(500).json({ error: "Failed to get guidance" });
  }
};
