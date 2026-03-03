import "./global.css";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import MapPage from "./pages/Map";
import VirtualTourPage from "./pages/VirtualTour";
import AnalyticsPage from "./pages/Analytics";
import EmergencyPage from "./pages/Emergency";
import FreshersPage from "./pages/Freshers";
import TimetablePage from "./pages/Timetable";
import NotFound from "./pages/NotFound";
import OfflineIndicator from "@/components/OfflineIndicator";
import { registerServiceWorker, requestPersistentStorage } from "@/lib/service-worker";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Register service worker for offline support
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log("PWA service worker registered");
      }
    });

    // Request persistent storage
    requestPersistentStorage().then((granted) => {
      if (granted) {
        console.log("Persistent storage granted");
      }
    });

    // Listen for service worker updates
    const handleSWUpdate = () => {
      console.log("Service worker update available");
    };

    window.addEventListener("sw-update-available", handleSWUpdate);

    return () => {
      window.removeEventListener("sw-update-available", handleSWUpdate);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/freshers" element={<FreshersPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/tour" element={<VirtualTourPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
