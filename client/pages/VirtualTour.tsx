import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/use-analytics";
import { useUserId } from "@/hooks/use-auth";
import {
  ChevronLeft, ChevronRight, MapPin, Users, BookOpen, Clock,
  Star, Building2, ArrowLeft, Info, Play, X, RotateCw, Loader, Rotate3D
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import PanoramaViewer from "@/components/PanoramaViewer";

interface Building {
  id: string;
  name: string;
  short_name?: string;
  type: string;
  category: string;
  description: string;
  history?: string;
  academic_depts?: string[];
  facilities?: string[];
  student_capacity?: number;
  year_built?: number;
  coordinates: { lat: number; lng: number };
  image_url: string;
  image_gallery?: string[];
  panorama_url?: string;
  view_count: number;
  visitors_count?: number;
}

export default function VirtualTourPage() {
  useAnalytics("virtual_tour");
  const userId = useUserId();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [show360, setShow360] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch buildings from API
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/virtual-tour/buildings");
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setBuildings(data);
            setSelectedBuilding(data[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch buildings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // Log tour view when building is selected
  useEffect(() => {
    if (selectedBuilding && userId) {
      const logView = async () => {
        try {
          await fetch(`/api/virtual-tour/buildings/${selectedBuilding.id}/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
          });
        } catch (error) {
          console.error("Failed to log view:", error);
        }
      };
      logView();
    }
  }, [selectedBuilding?.id, userId]);

  const handlePrevImage = () => {
    if (!selectedBuilding?.image_gallery) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? selectedBuilding.image_gallery!.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!selectedBuilding?.image_gallery) return;
    setCurrentImageIndex((prev) =>
      prev === selectedBuilding.image_gallery!.length - 1 ? 0 : prev + 1
    );
  };

  const handleSelectBuilding = (building: Building) => {
    setSelectedBuilding(building);
    setCurrentImageIndex(0);
    setShow360(false);
  };

  const categoryColors: Record<string, string> = {
    school: "bg-blue-100 text-blue-700",
    admin: "bg-purple-100 text-purple-700",
    facility: "bg-green-100 text-green-700",
    landmark: "bg-amber-100 text-amber-700"
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-blue-900 text-white py-12">
          <div className="container px-4">
            <h1 className="text-4xl font-extrabold mb-4">Virtual Campus Tour</h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              Immerse yourself in FUTA's campus with high-resolution photos and interactive 360° views.
            </p>
          </div>
        </div>

        <div className="container py-12 px-4 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Loading tour assets...</p>
            </div>
          ) : !selectedBuilding ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Stay tuned! We are currently mapping more buildings.</p>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Media Viewer Area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
                  <div className="flex items-center gap-3">
                    <Badge className={categoryColors[selectedBuilding.category] || "bg-slate-100 text-slate-700"}>
                      {selectedBuilding.category}
                    </Badge>
                    <h2 className="text-2xl font-bold">{selectedBuilding.name}</h2>
                  </div>
                  {selectedBuilding.panorama_url && (
                    <Button
                      variant={show360 ? "default" : "outline"}
                      onClick={() => setShow360(!show360)}
                      className="gap-2 font-bold"
                    >
                      <Rotate3D className="h-4 w-4" />
                      {show360 ? "Photos" : "360° View"}
                    </Button>
                  )}
                </div>

                <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl group">
                  {show360 && selectedBuilding.panorama_url ? (
                    <PanoramaViewer url={selectedBuilding.panorama_url} title={selectedBuilding.name} />
                  ) : (
                    <>
                      <img
                        src={selectedBuilding.image_gallery?.[currentImageIndex] || selectedBuilding.image_url}
                        alt={selectedBuilding.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {selectedBuilding.image_gallery && selectedBuilding.image_gallery.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                          <div className="absolute bottom-6 right-6 bg-black/40 text-white px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-md border border-white/20">
                            {currentImageIndex + 1} / {selectedBuilding.image_gallery.length}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Info Content */}
                <Card className="p-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        About this Building
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedBuilding.description}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-200">
                      <h4 className="font-bold">Quick Facts</h4>
                      <div className="space-y-3">
                        {selectedBuilding.year_built && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Clock className="h-4 w-4" /> Year Built
                            </span>
                            <span className="font-bold">{selectedBuilding.year_built}</span>
                          </div>
                        )}
                        {selectedBuilding.student_capacity && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Users className="h-4 w-4" /> Capacity
                            </span>
                            <span className="font-bold">{selectedBuilding.student_capacity.toLocaleString()} scholars</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Significance
                          </span>
                          <span className="font-bold">Primary Academic Hub</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedBuilding.history && (
                    <div className="border-t pt-8 space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Historical Context
                      </h3>
                      <p className="text-muted-foreground leading-relaxed italic">
                        "{selectedBuilding.history}"
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-8 grid md:grid-cols-2 gap-8">
                    {selectedBuilding.academic_depts && selectedBuilding.academic_depts.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-bold">Departments</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedBuilding.academic_depts.map(dept => (
                            <Badge key={dept} variant="outline" className="bg-white">{dept}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedBuilding.facilities && selectedBuilding.facilities.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-bold">Facilities</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedBuilding.facilities.map(facility => (
                            <div key={facility} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {facility}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <Link to="/map" className="block">
                      <Button className="w-full h-12 rounded-xl gap-2 font-bold shadow-lg">
                        <MapPin className="h-5 w-5" />
                        Go to Map Location
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>

              {/* Sidebar: Building Selection */}
              <div className="space-y-4">
                <h3 className="font-bold text-xl px-2">Campus Map Points</h3>
                <div className="space-y-2">
                  {buildings.map((building) => (
                    <button
                      key={building.id}
                      onClick={() => handleSelectBuilding(building)}
                      className={cn(
                        "w-full p-4 rounded-2xl text-left transition-all border-2 flex items-center gap-4",
                        selectedBuilding.id === building.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-xl scale-[1.02]"
                          : "bg-white border-transparent hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "p-2.5 rounded-xl",
                        selectedBuilding.id === building.id ? "bg-white/20" : "bg-blue-50"
                      )}>
                        <Building2 className={cn("h-5 w-5", selectedBuilding.id === building.id ? "text-white" : "text-blue-600")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{building.name}</p>
                        <p className={cn(
                          "text-xs font-medium uppercase tracking-wider",
                          selectedBuilding.id === building.id ? "text-blue-100" : "text-muted-foreground"
                        )}>
                          {building.category}
                        </p>
                      </div>
                      {building.panorama_url && (
                        <RotateCw className={cn("h-4 w-4 opacity-50", selectedBuilding.id === building.id && "text-white")} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
