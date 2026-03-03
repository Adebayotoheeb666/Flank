import { RequestHandler } from "express";
import { SOSResponse, SOSTriggerRequest, LocationShareUpdate } from "@shared/api";

// Mock database for active SOS alerts
interface ActiveSOS {
  sosId: string;
  sosType: string;
  userId: string;
  latitude: number;
  longitude: number;
  status: "active" | "resolved" | "cancelled";
  createdAt: Date;
  lastLocationUpdate: Date;
  respondersNotified: string[];
}

const activeSOS: Map<string, ActiveSOS> = new Map();
const sosResponders = {
  medical: { name: "FUTA Health Centre", eta: 180 },
  fire: { name: "Fire Department", eta: 240 },
  security: { name: "FUTA Security", eta: 120 }
};

/**
 * POST /api/emergency/sos
 * Trigger an emergency SOS alert
 * Automatically shares live location with responders
 */
export const triggerSOS: RequestHandler = (req, res) => {
  try {
    const { sosType, latitude, longitude, userId }: SOSTriggerRequest = req.body;

    if (!sosType || latitude === undefined || longitude === undefined || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sosId = `SOS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const sosAlert: ActiveSOS = {
      sosId,
      sosType,
      userId,
      latitude,
      longitude,
      status: "active",
      createdAt: now,
      lastLocationUpdate: now,
      respondersNotified: []
    };

    activeSOS.set(sosId, sosAlert);

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
export const updateSOSLocation: RequestHandler = (req, res) => {
  try {
    const { sosId } = req.params;
    const { latitude, longitude } = req.body;

    const sos = activeSOS.get(sosId);
    if (!sos) {
      return res.status(404).json({ error: "SOS not found" });
    }

    if (sos.status !== "active") {
      return res.status(400).json({ error: "SOS is no longer active" });
    }

    sos.latitude = latitude;
    sos.longitude = longitude;
    sos.lastLocationUpdate = new Date();

    const response: LocationShareUpdate = {
      sosId,
      latitude,
      longitude,
      timestamp: sos.lastLocationUpdate.toISOString()
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
export const getSOSStatus: RequestHandler = (req, res) => {
  try {
    const { sosId } = req.params;

    const sos = activeSOS.get(sosId);
    if (!sos) {
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
      createdAt: sos.createdAt.toISOString(),
      lastLocationUpdate: sos.lastLocationUpdate.toISOString()
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
export const resolveSOSAlert: RequestHandler = (req, res) => {
  try {
    const { sosId } = req.params;

    const sos = activeSOS.get(sosId);
    if (!sos) {
      return res.status(404).json({ error: "SOS not found" });
    }

    sos.status = "resolved";

    const response: SOSResponse = {
      sosId,
      status: "resolved",
      responders: [],
      createdAt: sos.createdAt.toISOString(),
      lastLocationUpdate: new Date().toISOString()
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
export const cancelSOSAlert: RequestHandler = (req, res) => {
  try {
    const { sosId } = req.params;

    const sos = activeSOS.get(sosId);
    if (!sos) {
      return res.status(404).json({ error: "SOS not found" });
    }

    sos.status = "cancelled";

    const response: SOSResponse = {
      sosId,
      status: "cancelled",
      responders: [],
      createdAt: sos.createdAt.toISOString(),
      lastLocationUpdate: new Date().toISOString()
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
export const getActiveSOS: RequestHandler = (req, res) => {
  try {
    const activeAlerts = Array.from(activeSOS.values()).filter(
      sos => sos.status === "active"
    );

    res.json({
      count: activeAlerts.length,
      alerts: activeAlerts.map(sos => ({
        sosId: sos.sosId,
        sosType: sos.sosType,
        location: { lat: sos.latitude, lng: sos.longitude },
        createdAt: sos.createdAt.toISOString(),
        lastUpdate: sos.lastLocationUpdate.toISOString()
      }))
    });
  } catch (error) {
    console.error("Get active SOS error:", error);
    res.status(500).json({ error: "Failed to get active SOS alerts" });
  }
};
