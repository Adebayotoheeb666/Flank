import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAnalytics, trackSearch, trackNavigation } from "@/hooks/use-analytics";
import {
  Search, MapPin, Navigation, Compass, Phone,
  Info, Filter, Layers, ZoomIn, ZoomOut,
  MoreVertical, Clock, TrendingUp, AlertCircle, ChevronRight, ChevronLeft,
  X, LocateFixed, TreeDeciduous, Building2, Utensils, CreditCard, Activity, GraduationCap,
  ArrowRight, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Location } from "@shared/api";
import { RouteResponse, RouteStep } from "@shared/navigation";
import ReportErrorModal from "@/components/ReportErrorModal";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import AddPlaceModal from "@/components/AddPlaceModal";

// Add marker styles
const markerStyles = `
  .custom-marker {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

import { useOfflineSearch } from "@/hooks/use-offline-search";
import { usePersistentNavigation } from "@/hooks/use-persistent-navigation";

// FUTA Central Coordinates
const FUTA_CENTER: [number, number] = [5.1300, 7.3000];

export default function MapPage() {
  // Inject marker styles
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = markerStyles;
    document.head.appendChild(styleTag);
    return () => { document.head.removeChild(styleTag); };
  }, []);

  // Track page analytics
  useAnalytics("map");
  const location = useLocation();

  const mapContainer = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, maplibregl.Marker>>({});

  // Offline-capable hooks
  const { searchLocations, loading: locationsLoading } = useOfflineSearch();
  const {
    selectedLocation,
    isNavigating,
    route,
    preferFlat,
    updateNavState,
    clearNavState
  } = usePersistentNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [reportErrorOpen, setReportErrorOpen] = useState(false);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [mapStyle, setMapStyle] = useState<"streets-v2" | "satellite">("streets-v2");
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [debugInfo, setDebugInfo] = useState<{ keyStatus: string; status?: string; error?: string; layers?: number; center?: string }>({ keyStatus: "awaiting" });

  const locations = useMemo(() => {
    return searchLocations(searchQuery, activeCategory);
  }, [searchQuery, activeCategory, searchLocations]);

  // Initialize MapLibre (for MapTiler)
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Use env variable ONLY, do not fallback to a hardcoded key
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    if (!apiKey) {
      console.warn("MapTiler API Key is missing. Map will not load.");
      setDebugInfo({ keyStatus: "missing" });
      return;
    }

    setDebugInfo({ keyStatus: "found: " + apiKey.substring(0, 4) + "..." });

    try {
      console.log("Initializing MapLibre at FUTA center:", FUTA_CENTER);
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${apiKey}`,
        center: FUTA_CENTER,
        zoom: 15,
      });

      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      // Use ResizeObserver for more reliable sizing
      const resizeObserver = new ResizeObserver(() => {
        if (map.current) {
          map.current.resize();
        }
      });
      resizeObserver.observe(mapContainer.current);

      map.current.on('load', () => {
        const style = map.current?.getStyle();
        console.log("Map load event fired. Layers count:", style?.layers?.length);
        setDebugInfo(prev => ({
          ...prev,
          status: "loaded",
          layers: style?.layers?.length,
          center: JSON.stringify(map.current?.getCenter())
        }));
      });

      // Handle missing images by adding placeholder icons
      map.current.on('styleimagemissing', (e) => {
        const id = e.id;
        console.log(`[Map] Missing image: ${id}, adding placeholder`);

        if (!map.current?.hasImage(id)) {
          // Create a simple placeholder canvas image
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // Fill with a light gray background
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(0, 0, 32, 32);

            // Add a border
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, 32, 32);

            // Add a center dot
            ctx.fillStyle = '#6b7280';
            ctx.beginPath();
            ctx.arc(16, 16, 4, 0, Math.PI * 2);
            ctx.fill();
          }

          try {
            map.current?.addImage(id, canvas);
          } catch (err) {
            console.warn(`Failed to add image ${id}:`, err);
          }
        }
      });

      map.current.on('moveend', () => {
        if (map.current) {
          const center = map.current.getCenter();
          setDebugInfo(prev => ({ ...prev, center: `${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}` }));
        }
      });

      map.current.on('error', (e) => {
        console.error("MapLibre error:", e);
        setDebugInfo(prev => ({ ...prev, error: String(e.error?.message || e.error || "Map error") }));
      });

      return () => {
        resizeObserver.disconnect();
        if (map.current) {
          console.log("Cleaning up map instance");
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error: any) {
      console.error("Failed to initialize map:", error);
      setDebugInfo({ keyStatus: "error", error: error.message });
    }
  }, [mapStyle]);

  // Handle URL focus and category parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Handle focus
    if (params.get("focus") === "search" && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        setIsSidebarOpen(true);
      }, 300);
    }

    // Handle category
    const cat = params.get("category");
    if (cat) {
      setActiveCategory(cat);
      setIsSidebarOpen(true);
    }

    // Handle search query
    const query = params.get("q");
    if (query) {
      setSearchQuery(decodeURIComponent(query));
      setIsSidebarOpen(true);
    }
  }, [location.search]);

  // Handle markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    locations.forEach(loc => {
      const el = document.createElement('div');
      el.className = 'custom-marker';

      const pin = document.createElement('div');
      pin.className = cn(
        "p-1 rounded-full border-2 border-white shadow-lg transition-all hover:scale-125 cursor-pointer",
        selectedLocation?.id === loc.id ? "bg-primary scale-125" : "bg-slate-500"
      );

      // Basic inner dot for now, we can add icons later
      const dot = document.createElement('div');
      dot.className = "w-2 h-2 bg-white rounded-full";
      pin.appendChild(dot);
      el.appendChild(pin);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        handleLocationClick(loc);
      });

      markers.current[loc.id] = marker;
    });
  }, [locations, selectedLocation]);

  useEffect(() => {
    if (route && map.current && isNavigating) {
      drawRoute(route);
    }
  }, [route, isNavigating]);

  const handleLocationClick = (loc: Location) => {
    updateNavState({
      selectedLocation: loc,
      isNavigating: false,
      route: null
    });

    if (map.current) {
      map.current.flyTo({
        center: [loc.coordinates.lng, loc.coordinates.lat],
        zoom: 17,
        essential: true
      });
    }
  };

  const drawRoute = (routeData: RouteResponse) => {
    if (!map.current) return;

    if (map.current.getSource('route')) {
      (map.current.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeData.path
        }
      });
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeData.path
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#888',
          'line-width': 8,
          'line-dasharray': [1, 2]
        }
      });

      map.current.addLayer({
        id: 'route-animated',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'hsl(270, 70%, 40%)',
          'line-width': 6
        }
      });
    }

    const bounds = new maplibregl.LngLatBounds();
    routeData.path.forEach(coord => bounds.extend(coord as [number, number]));
    map.current.fitBounds(bounds, { padding: 50 });
  };

  const startNavigation = async () => {
    if (!selectedLocation) return;
    setIsLocating(true);
    setLocationStatus("Connecting to GPS...");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by your browser."));
          return;
        }

        const options = {
          enableHighAccuracy: false, // Use WiFi/cellular triangulation for speed
          timeout: 8000, // 8 seconds should be plenty for most devices
          maximumAge: 30000 // Allow 30 seconds old cached location
        };

        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
      setLocationStatus("Location found!");

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_lat: userLat,
          start_lng: userLng,
          end_location_id: selectedLocation.id,
          prefer_flat: preferFlat
        })
      });

      if (!response.ok) {
        throw new Error("Failed to calculate route");
      }

      const data: RouteResponse = await response.json();
      updateNavState({
        route: data,
        isNavigating: true
      });

      trackNavigation("current_location", selectedLocation.name, "map_click", data.total_distance);
    } catch (error: any) {
      // Properly extract error details
      let message = "Failed to start navigation.";

      // Handle GeolocationPositionError
      if (error && typeof error === 'object' && 'code' in error) {
        console.error("Navigation geolocation error - Code:", error.code, "Message:", error.message);

        if (error.code === 1) {
          message = "Location access denied. Please enable location permissions in settings.";
        } else if (error.code === 2) {
          message = "Location information is unavailable. Please check your connection and try again.";
        } else if (error.code === 3) {
          message = "Location request timed out. Please try again.";
        } else {
          message = error.message || "Unable to get your location.";
        }
      } else if (error instanceof Error) {
        console.error("Navigation error:", error.message);
        message = error.message;
      } else {
        console.error("Navigation error:", error);
        message = String(error) || "An unknown error occurred.";
      }

      if (!window.isSecureContext) {
        message += " Note: Geolocation requires a secure (HTTPS) connection.";
      }

      setLocationStatus(`Error: ${message}`);
      alert(message);
    } finally {
      setIsLocating(false);
    }
  };

  const stopNavigation = () => {
    updateNavState({ isNavigating: false });
    if (map.current && map.current.getLayer('route')) {
      map.current.removeLayer('route');
      map.current.removeLayer('route-animated');
      map.current.removeSource('route');
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden relative">

        {/* Sidebar Controls */}
        <aside className={cn(
          "w-80 border-r bg-card flex flex-col transition-all duration-300 z-30 absolute md:relative inset-y-0 left-0",
          !isSidebarOpen && "-translate-x-full md:w-0 md:opacity-0"
        )}>
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl">Find Places</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search campus..."
                className="pl-9 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b bg-muted/30">
              {['all', 'school', 'venue', 'hostel', 'admin', 'food', 'bank', 'health'].map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  className="capitalize whitespace-nowrap"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all hover:bg-muted group",
                      selectedLocation?.id === loc.id && "bg-primary/5 border border-primary/20 ring-1 ring-primary/10"
                    )}
                    onClick={() => handleLocationClick(loc)}
                  >
                    <div className={cn(
                      "p-2 rounded-lg text-primary-foreground",
                      selectedLocation?.id === loc.id ? "bg-primary" : "bg-muted-foreground/20 group-hover:bg-primary/50"
                    )}>
                      {loc.category === 'school' && <GraduationCap className="h-5 w-5" />}
                      {loc.category === 'admin' && <Building2 className="h-5 w-5" />}
                      {loc.category === 'food' && <Utensils className="h-5 w-5" />}
                      {loc.category === 'bank' && <CreditCard className="h-5 w-5" />}
                      {loc.category === 'health' && <Activity className="h-5 w-5" />}
                      {loc.category === 'landmark' && <TreeDeciduous className="h-5 w-5" />}
                      {loc.category === 'study' && <Compass className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{loc.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{loc.type} • {loc.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        <main className="flex-1 relative overflow-hidden bg-white">
          <div
            ref={mapContainer}
            className="absolute inset-0 bg-white z-0"
            style={{ width: '100%', height: '100%' }}
          />


          {/* Map Controls (Overlaying Mapbox) */}
          <div className="absolute right-6 top-6 flex flex-col gap-2 z-40">
            <Button
              size="icon"
              variant="secondary"
              className={cn("rounded-full shadow-lg bg-background/80 backdrop-blur", mapStyle === "satellite" && "bg-primary text-primary-foreground")}
              onClick={() => setMapStyle(prev => prev === "streets-v2" ? "satellite" : "streets-v2")}
              title="Toggle satellite view"
            >
              <Layers className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className={cn("rounded-full shadow-lg bg-background/80 backdrop-blur", isLocating && "animate-pulse")}
              onClick={() => {
                if (!navigator.geolocation) {
                  alert("Geolocation is not supported by your browser.");
                  return;
                }

                setIsLocating(true);
                setLocationStatus("Finding your location...");
                const options = {
                  enableHighAccuracy: false, // Use WiFi/cellular triangulation for speed
                  timeout: 8000, // 8 seconds should be plenty for most devices
                  maximumAge: 30000 // Allow 30 seconds old cached location
                };

                navigator.geolocation.getCurrentPosition(
                  (pos: GeolocationPosition) => {
                    setLocationStatus("Caught you!");
                    if (map.current) {
                      map.current.flyTo({
                        center: [pos.coords.longitude, pos.coords.latitude],
                        zoom: 16,
                        essential: true
                      });
                    }
                    setTimeout(() => {
                      setIsLocating(false);
                      setLocationStatus("");
                    }, 1500);
                  },
                  (err: GeolocationPositionError) => {
                    console.error("Geolocation error:", err);
                    setIsLocating(false);
                    setLocationStatus("");
                    let message = "Could not get your location.";
                    if (err.code === 1) message = "Location access denied. Please enable location permissions in your browser settings.";
                    else if (err.code === 2) message = "Location information is unavailable. Please check your connection and try again.";
                    else if (err.code === 3) message = "Location request timed out. Please try again.";

                    if (!window.isSecureContext) {
                      message += " Note: Geolocation requires a secure (HTTPS) connection.";
                    }

                    alert(message);
                  },
                  options
                );
              }}
              title="Find my location"
            >
              <LocateFixed className="h-5 w-5 text-blue-600" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg bg-background/80 backdrop-blur"
              onClick={() => {
                if (map.current) {
                  const center = map.current.getCenter();
                  setCurrentMapCenter({ lat: center.lat, lng: center.lng });
                }
                setAddPlaceOpen(true);
              }}
              title="Add a new place"
            >
              <MapPin className="h-5 w-5 text-green-600" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg bg-background/80 backdrop-blur"
              onClick={() => {
                if (map.current) {
                  const center = map.current.getCenter();
                  setCurrentMapCenter({ lat: center.lat, lng: center.lng });
                }
                setReportErrorOpen(true);
              }}
              title="Report a map error"
            >
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </Button>
          </div>

          {/* Bottom Info Sheet / Navigation Panel */}
          {selectedLocation && (
            <div className={cn(
              "absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] bg-card shadow-2xl rounded-3xl border animate-in slide-in-from-bottom-12 duration-500 overflow-hidden z-40",
              isNavigating && "w-full md:w-[400px] left-auto right-6 bottom-6 translate-x-0"
            )}>
              {isNavigating && route ? (
                /* Navigation Instructions */
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-primary" />
                      Navigating to {selectedLocation.name}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => {
                      stopNavigation();
                    }}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-muted p-4 rounded-2xl border">
                      <div className="flex flex-col items-center">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] font-bold">{Math.round(route.total_distance / 80)} min</span>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex flex-col items-center">
                        <TrendingUp className={cn("h-5 w-5", route.total_elevation_gain > 10 ? "text-orange-500" : "text-green-500")} />
                        <span className="text-[10px] font-bold">{route.total_elevation_gain > 10 ? "Hilly" : "Flat"}</span>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex-1 text-sm font-medium">
                        {route.total_distance}m • Optimized Path
                      </div>
                    </div>

                    <ScrollArea className="max-h-[200px] pr-4">
                      <div className="space-y-4 pt-2">
                        {route.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn(
                                "w-4 h-4 rounded-full",
                                idx === 0 ? "bg-blue-500" : (idx === route.steps.length - 1 ? "border-2 border-primary" : "bg-primary")
                              )} />
                              {idx < route.steps.length - 1 && <div className="w-0.5 h-full bg-border" />}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="font-bold text-sm">{step.instruction}</p>
                              <p className="text-xs text-muted-foreground">{step.distance}m</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl gap-2">
                        <Phone className="h-5 w-5" />
                        Emergency help
                      </Button>
                      <Button variant="outline" className="h-12 rounded-xl" onClick={stopNavigation}>
                        Exit
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Location Details */
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 aspect-video md:aspect-auto bg-muted">
                    <img
                      src={`https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=400`}
                      className="w-full h-full object-cover"
                      alt={selectedLocation.name}
                    />
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="mb-2">{selectedLocation.type}</Badge>
                        <h3 className="text-2xl font-bold">{selectedLocation.name}</h3>
                        <p className="text-muted-foreground text-sm">{selectedLocation.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={clearNavState}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">8:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Hill-Aware Routing Ready</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id="preferFlat"
                          checked={preferFlat}
                          onChange={(e) => updateNavState({ preferFlat: e.target.checked })}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="preferFlat" className="text-sm font-medium text-muted-foreground cursor-pointer">
                          Avoid steep hills (longer path)
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 h-12 rounded-xl font-bold gap-2"
                          onClick={startNavigation}
                          disabled={isLocating}
                        >
                          {isLocating ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Navigation className="h-5 w-5" />
                          )}
                          {isLocating ? "Calculating..." : "Get Directions"}
                        </Button>
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sidebar Toggle Button */}
        {!isSidebarOpen && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-4 z-40 rounded-full shadow-lg bg-background flex"
            onClick={() => setIsSidebarOpen(true)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Geolocation Status Overlay */}
        {isLocating && locationStatus && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-primary shadow-xl text-primary-foreground px-6 py-3 rounded-full flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            <span className="text-sm font-bold tracking-tight">{locationStatus}</span>
          </div>
        )}
      </div>

      <ReportErrorModal
        open={reportErrorOpen}
        onOpenChange={setReportErrorOpen}
        currentLocation={currentMapCenter}
      />

      <AddPlaceModal
        open={addPlaceOpen}
        onOpenChange={setAddPlaceOpen}
        currentLocation={currentMapCenter}
        onSuccess={() => {/* Implicitly handled by offline search interval or manual refresh if added */ }}
      />
    </Layout>
  );
}
