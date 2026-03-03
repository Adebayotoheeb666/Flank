import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGetLocations, handlePostLocation, handleSearchLocations } from "./routes/locations";
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
  getActiveSOS
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
  app.post("/api/route", handleRouteRequest);

  // Phase 3: Timetable Integration Routes
  app.get("/api/timetable/:studentId", getTimetable);
  app.post("/api/timetable/:studentId", addCourse);
  app.delete("/api/timetable/:studentId/:courseId", deleteCourse);
  app.post("/api/timetable/:studentId/reminder", getRouteReminder);
  app.get("/api/timetable/:studentId/upcoming", getUpcomingCourses);

  // Phase 3: Emergency SOS Routes
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

  return app;
}
