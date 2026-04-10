import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGetLocations, handlePostLocation, handleSearchLocations, handleUpdateLocation, handleDeleteLocation } from "./routes/locations";
import { handleRouteRequest } from "./routes/navigation";
import {
  getTimetable,
  addCourse,
  deleteCourse,
  getRouteReminder,
  getUpcomingCourses
} from "./routes/timetable";
import {
  triggerSOS,
  updateSOSLocation,
  getSOSStatus,
  resolveSOSAlert,
  cancelSOSAlert,
  getActiveSOS,
  getEmergencyContacts
} from "./routes/emergency";
import {
  submitErrorReport,
  getErrorReports,
  getErrorReport,
  updateErrorReport,
  deleteErrorReport
} from "./routes/error-reports";
import {
  trackPageView,
  trackPageExit,
  trackNavigation,
  trackSearch,
  getAnalyticsDashboard,
  getRawAnalytics
} from "./routes/analytics";
import { getGuidance, createGuidanceStep, updateGuidanceStep, deleteGuidanceStep } from "./routes/guidance";
import {
  handleGetShortcuts,
  handleReportShortcut,
  handleVerifyShortcut,
  handleGetShortcutsBetween
} from "./routes/shortcuts";
import {
  handleScheduleReminder,
  handleGetPendingReminders,
  handleMarkReminderSent,
  handleDismissReminder,
  handleGetAllReminders,
  handleSendBatchNotifications
} from "./routes/notifications";
import {
  handleGetTourBuildings,
  handleGetTourBuilding,
  handleCreateTourBuilding,
  handleUpdateTourBuilding,
  handleDeleteTourBuilding,
  handleGetHighlights,
  handleLogTourView
} from "./routes/virtual-tour";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // FUTA Pathfinder API routes
  app.get("/api/locations", handleGetLocations);
  app.get("/api/search", handleSearchLocations);
  app.post("/api/locations", handlePostLocation);
  app.patch("/api/locations/:locationId", handleUpdateLocation);
  app.delete("/api/locations/:locationId", handleDeleteLocation);
  app.post("/api/route", handleRouteRequest);

  // Phase 3: Timetable Integration Routes
  app.get("/api/timetable/:studentId", getTimetable);
  app.post("/api/timetable/:studentId", addCourse);
  app.delete("/api/timetable/:studentId/:courseId", deleteCourse);
  app.post("/api/timetable/:studentId/reminder", getRouteReminder);
  app.get("/api/timetable/:studentId/upcoming", getUpcomingCourses);

  // Phase 3: Emergency SOS Routes
  app.get("/api/emergency/contacts", getEmergencyContacts);
  app.post("/api/emergency/sos", triggerSOS);
  app.post("/api/emergency/sos/:sosId/location", updateSOSLocation);
  app.get("/api/emergency/sos/:sosId", getSOSStatus);
  app.post("/api/emergency/sos/:sosId/resolve", resolveSOSAlert);
  app.post("/api/emergency/sos/:sosId/cancel", cancelSOSAlert);
  app.get("/api/emergency/active", getActiveSOS);

  // Phase 6: Error Reporting Routes
  app.post("/api/error-reports", submitErrorReport);
  app.get("/api/error-reports", getErrorReports);
  app.get("/api/error-reports/:reportId", getErrorReport);
  app.patch("/api/error-reports/:reportId", updateErrorReport);
  app.delete("/api/error-reports/:reportId", deleteErrorReport);

  // Phase 6: Analytics Routes
  app.post("/api/analytics/page-view", trackPageView);
  app.post("/api/analytics/page-exit", trackPageExit);
  app.post("/api/analytics/navigation", trackNavigation);
  app.post("/api/analytics/search", trackSearch);
  app.get("/api/analytics/dashboard", getAnalyticsDashboard);
  app.get("/api/analytics/raw", getRawAnalytics);

  // Phase 3: Guidance Routes (Freshers Mode)
  app.get("/api/guidance", getGuidance);
  app.post("/api/guidance", createGuidanceStep);
  app.patch("/api/guidance/:stepId", updateGuidanceStep);
  app.delete("/api/guidance/:stepId", deleteGuidanceStep);

  // Phase 2: Shortcut Detection Routes
  app.get("/api/shortcuts", handleGetShortcuts);
  app.post("/api/shortcuts/report", handleReportShortcut);
  app.post("/api/shortcuts/:id/verify", handleVerifyShortcut);
  app.get("/api/shortcuts/between/:startLocationId/:endLocationId", handleGetShortcutsBetween);

  // Phase 3: Push Notification Routes
  app.post("/api/notifications/schedule", handleScheduleReminder);
  app.get("/api/notifications/:studentId/pending", handleGetPendingReminders);
  app.post("/api/notifications/:reminderId/mark-sent", handleMarkReminderSent);
  app.post("/api/notifications/:reminderId/dismiss", handleDismissReminder);
  app.get("/api/notifications/:studentId/all", handleGetAllReminders);
  app.post("/api/notifications/send-batch", handleSendBatchNotifications);

  // Phase 5: Virtual Tour Routes
  app.get("/api/virtual-tour/buildings", handleGetTourBuildings);
  app.get("/api/virtual-tour/buildings/:buildingId", handleGetTourBuilding);
  app.post("/api/virtual-tour/buildings", handleCreateTourBuilding);
  app.patch("/api/virtual-tour/buildings/:buildingId", handleUpdateTourBuilding);
  app.delete("/api/virtual-tour/buildings/:buildingId", handleDeleteTourBuilding);
  app.get("/api/virtual-tour/highlights", handleGetHighlights);
  app.post("/api/virtual-tour/buildings/:buildingId/view", handleLogTourView);

  return app;
}
