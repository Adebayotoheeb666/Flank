import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGetLocations, handlePostLocation, handleSearchLocations } from "./routes/locations";
import { handleRouteRequest } from "./routes/navigation";

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

  return app;
}
