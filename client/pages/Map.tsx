import { useState, useMemo, useEffect } from "react";
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

export default function MapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loading, setLoading] = useState(true);

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
          {/* Simulated Map Canvas */}
          <div className="absolute inset-0 bg-[#f8f9fa] flex items-center justify-center p-20">
            <div className="relative w-full h-full max-w-5xl max-h-[800px] border-4 border-white shadow-2xl rounded-3xl overflow-hidden bg-slate-200">
              {/* Map Layers Grid */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-30 pointer-events-none">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-slate-400" />
                ))}
              </div>
              
              {/* Roads (Stylized Lines) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path d="M 0 500 Q 500 500 1000 500" stroke="white" strokeWidth="40" fill="none" opacity="0.8" />
                <path d="M 500 0 Q 500 500 500 1000" stroke="white" strokeWidth="40" fill="none" opacity="0.8" />
                <path d="M 0 500 Q 500 500 1000 500" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10" fill="none" />
                <path d="M 500 0 Q 500 500 500 1000" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10" fill="none" />
              </svg>

              {/* Location Pins */}
              {locations.map(loc => (
                <button
                  key={loc.id}
                  className={cn(
                    "absolute w-8 h-8 -ml-4 -mt-8 transition-all hover:scale-125 z-10 group",
                    selectedLocation?.id === loc.id ? "scale-125 z-20" : "opacity-80 hover:opacity-100"
                  )}
                  style={{ left: `${loc.coordinates.x || 50}%`, top: `${loc.coordinates.y || 50}%` }}
                  onClick={() => handleLocationClick(loc)}
                >
                  <MapPin className={cn(
                    "w-full h-full drop-shadow-lg transition-colors",
                    selectedLocation?.id === loc.id ? "text-primary fill-primary/20" : "text-slate-500 fill-white"
                  )} />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {loc.name}
                  </div>
                </button>
              ))}

              {/* Navigation Route Path (Simulated) */}
              {isNavigating && selectedLocation && selectedLocation.coordinates.x && selectedLocation.coordinates.y && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    d={`M 100 800 L 500 800 L 500 ${selectedLocation.coordinates.y * 10} L ${selectedLocation.coordinates.x * 10} ${selectedLocation.coordinates.y * 10}`}
                    stroke="var(--primary)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="10 5"
                    className="animate-[dash_20s_linear_infinite]"
                  />
                  <circle cx="100" cy="800" r="8" fill="var(--primary)" className="animate-pulse" />
                </svg>
              )}

              {/* User Position Marker */}
              <div className="absolute left-[10%] top-[80%] -ml-4 -mt-4 z-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 h-8 w-8 -m-1" />
                  <div className="bg-blue-600 border-2 border-white rounded-full h-6 w-6 shadow-xl flex items-center justify-center">
                    <Navigation className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute right-6 top-6 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-background/80 backdrop-blur">
              <Layers className="h-5 w-5" />
            </Button>
            <div className="flex flex-col border rounded-2xl overflow-hidden shadow-lg bg-background/80 backdrop-blur">
              <Button size="icon" variant="ghost" className="rounded-none border-b"><ZoomIn className="h-5 w-5" /></Button>
              <Button size="icon" variant="ghost" className="rounded-none"><ZoomOut className="h-5 w-5" /></Button>
            </div>
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
