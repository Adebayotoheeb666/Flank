import { useState, useMemo, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, MapPin, Navigation, Compass, Phone,
  Info, Filter, Layers, ZoomIn, ZoomOut,
  MoreVertical, Clock, TrendingUp, AlertCircle, ChevronRight, ChevronLeft,
  X, LocateFixed, TreeDeciduous, Building2, Utensils, CreditCard, Activity, GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Location } from "@/shared/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// FUTA Central Coordinates
const FUTA_CENTER: [number, number] = [5.1300, 7.3000];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loading, setLoading] = useState(true);
  const markers = useRef<Record<string, mapboxgl.Marker>>({});

  // Initialize Mapbox
  useEffect(() => {
    if (map.current) return; // initialize map only once

    const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN || "REPLACE_ENV.MAPBOX_TOKEN";

    if (token === "REPLACE_ENV.MAPBOX_TOKEN") {
      console.error("Mapbox token is missing! Please add VITE_MAPBOX_TOKEN to your environment variables.");
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: FUTA_CENTER,
      zoom: 15,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

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

      const marker = new mapboxgl.Marker(el)
        .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        handleLocationClick(loc);
      });

      markers.current[loc.id] = marker;
    });
  }, [locations, selectedLocation]);

  useEffect(() => {
    fetchLocations();
  }, [activeCategory]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const url = activeCategory === "all" ? "/api/locations" : `/api/locations?category=${activeCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery, locations]);

  const handleLocationClick = (loc: Location) => {
    setSelectedLocation(loc);
    setIsNavigating(false);
    if (map.current) {
      map.current.flyTo({
        center: [loc.coordinates.lng, loc.coordinates.lat],
        zoom: 17,
        essential: true
      });
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);
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
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="md:hidden">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search campus..." 
                className="pl-9 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b bg-muted/30">
              {['all', 'school', 'admin', 'food', 'bank', 'health'].map(cat => (
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
                {filteredLocations.map(loc => (
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

        {/* Sidebar Toggle (Desktop) */}
        {!isSidebarOpen && (
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute left-4 top-4 z-40 rounded-full shadow-lg bg-background hidden md:flex"
            onClick={() => setIsSidebarOpen(true)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Map View Area */}
        <main className="flex-1 relative bg-muted overflow-hidden">
          <div ref={mapContainer} className="absolute inset-0" />

          {/* Map Controls (Overlaying Mapbox) */}
          <div className="absolute right-6 top-6 flex flex-col gap-2 z-10">
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-background/80 backdrop-blur">
              <Layers className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-background/80 backdrop-blur">
              <LocateFixed className="h-5 w-5 text-blue-600" />
            </Button>
          </div>

          {/* Bottom Info Sheet / Navigation Panel */}
          {selectedLocation && (
            <div className={cn(
              "absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] bg-card shadow-2xl rounded-3xl border animate-in slide-in-from-bottom-12 duration-500 overflow-hidden",
              isNavigating && "w-full md:w-[400px] left-auto right-6 bottom-6 translate-x-0"
            )}>
              {isNavigating ? (
                /* Navigation Instructions */
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-primary" />
                      Navigating to {selectedLocation.name}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsNavigating(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-muted p-4 rounded-2xl border">
                      <div className="flex flex-col items-center">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] font-bold">12 min</span>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex flex-col items-center">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        <span className="text-[10px] font-bold">Hill Path</span>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex-1 text-sm font-medium">
                        850m • Via Senate Road
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-primary" />
                          <div className="w-0.5 h-full bg-border" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-bold text-sm">Walk past the Senate Building</p>
                          <p className="text-xs text-muted-foreground">Keep the main gate to your right.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <TreeDeciduous className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="w-0.5 h-full bg-border" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-bold text-sm">Turn left at the Big Mango Tree</p>
                          <p className="text-xs text-muted-foreground">Look for the orange seating benches.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-4 h-4 rounded-full border-2 border-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">Arrive at {selectedLocation.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl gap-2">
                        <Phone className="h-5 w-5" />
                        Emergency help
                      </Button>
                      <Button variant="outline" className="h-12 rounded-xl" onClick={() => setIsNavigating(false)}>
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
                      <Button variant="ghost" size="icon" onClick={() => setSelectedLocation(null)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">8:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">1.2 km away</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 h-12 rounded-xl font-bold gap-2" onClick={startNavigation}>
                        <Navigation className="h-5 w-5" />
                        Get Directions
                      </Button>
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Layout>
  );
}
