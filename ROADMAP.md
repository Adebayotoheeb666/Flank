# FUTA Pathfinder - Product Roadmap v1.0

## 🎓 Vision
To provide a seamless, intelligent, and reliable navigation experience for the Federal University of Technology Akure (FUTA). FUTA is "vertical storytelling," and this app aims to guide users through its hills, halls, and hidden shortcuts with ease.

---

## 🛠️ Phase 1: Infrastructure & Data Foundation
**Goal**: Build a robust backend to manage campus data dynamically.
- [ ] **Database Integration**: Set up a Neon PostgreSQL database via [MCP Integration](#open-mcp-popover).
- [ ] **GeoJSON Schema**: Define a standard GeoJSON format for all campus landmarks (Schools, Halls, ATMs, Trees).
- [ ] **RESTful API**:
  - `GET /api/locations`: Fetch all campus markers.
  - `GET /api/search`: Fuzzy search for buildings or departments.
  - `POST /api/locations`: Admin-only endpoint for adding new spots.

## 📍 Phase 2: Map Engine & Real-World Routing
**Goal**: Replace mock UI with a live, interactive map engine.
- [ ] **Mapbox GL JS**: Integrate Mapbox for professional-grade tile rendering and geolocation.
- [ ] **Custom Campus Layer**: Upload FUTA's specific GeoJSON data as a Mapbox layer.
- [ ] **Pathfinding Logic (Dijkstra/A*)**:
  - [ ] Build a graph of FUTA's road network.
  - [ ] **Hill-Awareness**: Incorporate elevation data (DEM) to weigh steep paths more heavily.
  - [ ] **Shortcut Detection**: Map student-used footpaths between SEET and SAAT.

## 📱 Phase 3: Student & Visitor Utility
**Goal**: Add the specialized "FUTA features" that solve daily student problems.
- [ ] **Guided Freshers Mode**:
  - [ ] Implement landmark-based text instructions ("Turn left at the big mango tree").
  - [ ] Add voice prompts using the Web Speech API.
- [ ] **Timetable Sync**:
  - [ ] User authentication (using JWT or Clerk/Supabase).
  - [ ] Course-to-venue mapping logic.
  - [ ] **Route Reminders**: Push notifications 15-20 mins before class.
- [ ] **Emergency 2.0**:
  - [ ] Live location sharing with FUTA Security.
  - [ ] One-tap SOS triggers for different emergency types (Medical, Fire, Security).

## 📶 Phase 4: Offline Resilience (The "FUTA Corner" Mode)
**Goal**: Ensure the app works even when the network signal is weak or non-existent.
- [ ] **PWA Conversion**: Add manifest.json and service worker support.
- [ ] **Map Caching**: Cache the GeoJSON and essential map tiles locally.
- [ ] **Background GPS**: Maintain navigation state even when the screen is locked or the app is minimized.

## 📸 Phase 5: Virtual Tour & Immersive Experience
**Goal**: Help prospective students and parents visualize the campus before they arrive.
- [ ] **360° Panorama Viewer**: Use `react-three-fiber` or `pannellum` for high-res building walkthroughs.
- [ ] **Campus Intro Video**: Hero section integration for the FUTA documentary/intro.
- [ ] **Info Cards**: Detailed historical and academic info for each School (SEET, SAAT, SET, etc.).

## 🚀 Phase 6: Production Launch & Community
**Goal**: Deploy for public use and gather feedback.
- [ ] **Production Deployment**: Host on Netlify/Vercel via [MCP](#open-mcp-popover).
- [ ] **Community Reporting**: Add a "Report Map Error" button to crowdsource data corrections.
- [ ] **Analytics**: Track "Popular Destinations" to optimize campus bus routes (shared with school admin).

---
*Created for the FUTA community with Excellence and Self-Reliance.*
