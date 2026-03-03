import { RequestHandler } from "express";
import { SOSResponse, SOSTriggerRequest, LocationShareUpdate } from "@shared/api";
import { supabase } from "../../shared/supabase";

const sosResponders = {
  medical: { name: "FUTA Health Centre", eta: 180 },
  fire: { name: "Fire Department", eta: 240 },
  security: { name: "FUTA Security", eta: 120 }
};

// Emergency contact data (should be moved to Supabase once emergency_contacts table is created)
const EMERGENCY_CONTACTS = [
  { id: "security", title: "FUTA Security", phone: "0801-234-5678", type: "security" },
  { id: "health", title: "Health Centre", phone: "0802-345-6789", type: "medical" },
  { id: "fire", title: "Fire Service", phone: "0803-456-7890", type: "fire" }
];

/**
 * GET /api/emergency/contacts
 * Get list of emergency contacts
 * TODO: Replace with Supabase query once emergency_contacts table is created
 */
export const getEmergencyContacts: RequestHandler = async (req, res) => {
  try {
    // TODO: Query from Supabase once table is created
    // const { data, error } = await supabase.from("emergency_contacts").select("*");
    res.json(EMERGENCY_CONTACTS);
  } catch (error) {
    console.error("Get emergency contacts error:", error);
    res.status(500).json({ error: "Failed to get emergency contacts" });
  }
};

/**
 * POST /api/emergency/sos
 * Trigger an emergency SOS alert
 * Automatically shares live location with responders
 */
export const triggerSOS: RequestHandler = async (req, res) => {
  try {
    const { sosType, latitude, longitude, userId }: SOSTriggerRequest = req.body;

    if (!sosType || latitude === undefined || longitude === undefined || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sosId = `SOS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const { data: sosAlert, error } = await supabase
      .from("sos_alerts")
      .insert([
        {
          sos_id: sosId,
          sos_type: sosType,
          user_id: userId,
          latitude,
          longitude,
          status: "active",
          created_at: now.toISOString(),
          last_location_update: now.toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Failed to trigger SOS" });
      return;
    }

    // Simulate notifying responders
    const responderList = Object.entries(sosResponders).map(([type, responder]) => ({
      id: `RESPONDER-${Date.now()}-${Math.random()}`,
      name: responder.name,
      type,
      eta: responder.eta
    }));

    const response: SOSResponse = {
      sosId,
      status: "active",
      responders: responderList,
      createdAt: now.toISOString(),
      lastLocationUpdate: now.toISOString()
    };

    console.log(`🚨 SOS Triggered: ${sosType.toUpperCase()} at ${latitude}, ${longitude}`);

    res.status(201).json(response);
  } catch (error) {
    console.error("SOS trigger error:", error);
    res.status(500).json({ error: "Failed to trigger SOS" });
  }
};

/**
 * POST /api/emergency/sos/:sosId/location
 * Update live location during active SOS
 * Called periodically while SOS is active
 */
export const updateSOSLocation: RequestHandler = async (req, res) => {
  try {
    const { sosId } = req.params;
    const { latitude, longitude } = req.body;

    const { data: sos, error: fetchError } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("sos_id", sosId)
      .single();

    if (fetchError || !sos) {
      return res.status(404).json({ error: "SOS not found" });
    }

    if (sos.status !== "active") {
      return res.status(400).json({ error: "SOS is no longer active" });
    }

    const now = new Date();
    const { error: updateError } = await supabase
      .from("sos_alerts")
      .update({
        latitude,
        longitude,
        last_location_update: now.toISOString()
      })
      .eq("sos_id", sosId);

    if (updateError) {
      console.error("Supabase Error:", updateError);
      res.status(500).json({ error: "Failed to update location" });
      return;
    }

    const response: LocationShareUpdate = {
      sosId,
      latitude,
      longitude,
      timestamp: now.toISOString()
    };

    console.log(`📍 SOS Location Updated: ${sosId} at ${latitude}, ${longitude}`);

    res.json(response);
  } catch (error) {
    console.error("Location update error:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
};

/**
 * GET /api/emergency/sos/:sosId
 * Get current status of an active SOS alert
 */
export const getSOSStatus: RequestHandler = async (req, res) => {
  try {
    const { sosId } = req.params;

    const { data: sos, error } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("sos_id", sosId)
      .single();

    if (error || !sos) {
      return res.status(404).json({ error: "SOS not found" });
    }

    const responderList = Object.entries(sosResponders).map(([type, responder]) => ({
      id: `RESPONDER-${sosId}`,
      name: responder.name,
      type,
      eta: sos.status === "active" ? responder.eta : 0
    }));

    const response: SOSResponse = {
      sosId,
      status: sos.status,
      responders: responderList,
      createdAt: sos.created_at,
      lastLocationUpdate: sos.last_location_update
    };

    res.json(response);
  } catch (error) {
    console.error("SOS status error:", error);
    res.status(500).json({ error: "Failed to get SOS status" });
  }
};

/**
 * POST /api/emergency/sos/:sosId/resolve
 * Mark an SOS as resolved
 */
export const resolveSOSAlert: RequestHandler = async (req, res) => {
  try {
    const { sosId } = req.params;

    const { data: sos, error: fetchError } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("sos_id", sosId)
      .single();

    if (fetchError || !sos) {
      return res.status(404).json({ error: "SOS not found" });
    }

    const now = new Date();
    const { error: updateError } = await supabase
      .from("sos_alerts")
      .update({
        status: "resolved",
        updated_at: now.toISOString()
      })
      .eq("sos_id", sosId);

    if (updateError) {
      console.error("Supabase Error:", updateError);
      res.status(500).json({ error: "Failed to resolve SOS" });
      return;
    }

    const response: SOSResponse = {
      sosId,
      status: "resolved",
      responders: [],
      createdAt: sos.created_at,
      lastLocationUpdate: now.toISOString()
    };

    console.log(`✅ SOS Resolved: ${sosId}`);

    res.json(response);
  } catch (error) {
    console.error("SOS resolve error:", error);
    res.status(500).json({ error: "Failed to resolve SOS" });
  }
};

/**
 * POST /api/emergency/sos/:sosId/cancel
 * Cancel an active SOS alert
 */
export const cancelSOSAlert: RequestHandler = async (req, res) => {
  try {
    const { sosId } = req.params;

    const { data: sos, error: fetchError } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("sos_id", sosId)
      .single();

    if (fetchError || !sos) {
      return res.status(404).json({ error: "SOS not found" });
    }

    const now = new Date();
    const { error: updateError } = await supabase
      .from("sos_alerts")
      .update({
        status: "cancelled",
        updated_at: now.toISOString()
      })
      .eq("sos_id", sosId);

    if (updateError) {
      console.error("Supabase Error:", updateError);
      res.status(500).json({ error: "Failed to cancel SOS" });
      return;
    }

    const response: SOSResponse = {
      sosId,
      status: "cancelled",
      responders: [],
      createdAt: sos.created_at,
      lastLocationUpdate: now.toISOString()
    };

    console.log(`❌ SOS Cancelled: ${sosId}`);

    res.json(response);
  } catch (error) {
    console.error("SOS cancel error:", error);
    res.status(500).json({ error: "Failed to cancel SOS" });
  }
};

/**
 * GET /api/emergency/active
 * Get all active SOS alerts (admin endpoint)
 */
export const getActiveSOS: RequestHandler = async (req, res) => {
  try {
    const { data: activeAlerts, error } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("status", "active");

    if (error) {
      console.error("Supabase Error:", error);
      res.status(500).json({ error: "Failed to get active SOS alerts" });
      return;
    }

    res.json({
      count: (activeAlerts || []).length,
      alerts: (activeAlerts || []).map(sos => ({
        sosId: sos.sos_id,
        sosType: sos.sos_type,
        location: { lat: sos.latitude, lng: sos.longitude },
        createdAt: sos.created_at,
        lastUpdate: sos.last_location_update
      }))
    });
  } catch (error) {
    console.error("Get active SOS error:", error);
    res.status(500).json({ error: "Failed to get active SOS alerts" });
  }
};
