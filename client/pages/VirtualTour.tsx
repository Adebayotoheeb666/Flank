import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  ChevronLeft, ChevronRight, MapPin, Users, BookOpen, Clock,
  Star, Building2, ArrowLeft, Info, ImagePlay, Play, Volume2, X, RotateCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import PanoramaViewer from "@/components/PanoramaViewer";

interface Building {
  id: string;
  name: string;
  shortName: string;
  category: "school" | "admin" | "facility" | "landmark";
  image: string;
  images: string[];
  panoramaImage?: string; // 360° panorama image
  videoUrl?: string; // Tour video URL
  description: string;
  history: string;
  academicDepts: string[];
  facilities: string[];
  studentCapacity?: number;
  yearBuilt?: number;
  coordinates: { lat: number; lng: number };
  visitorsCount?: number;
}

const CAMPUS_BUILDINGS: Building[] = [
  {
    id: "seet",
    name: "School of Electrical Engineering and Technology (SEET)",
    shortName: "SEET Building",
    category: "school",
    image: "https://images.unsplash.com/photo-1516321318423-f06c41e504b3?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1516321318423-f06c41e504b3?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800"
    ],
    panoramaImage: "https://images.unsplash.com/photo-1516321318423-f06c41e504b3?auto=format&fit=crop&q=80&w=2000",
    description: "The main hub for electrical engineering and technology programs at FUTA. State-of-the-art laboratories and classrooms.",
    history: "Established as part of FUTA's founding vision to create a center of excellence in technology education. The SEET building has produced generations of innovative engineers.",
    academicDepts: ["Electrical Engineering", "Electronic Engineering", "Telecommunications Engineering"],
    facilities: ["Advanced Labs", "Computer Labs", "Lecture Halls", "Design Studios"],
    studentCapacity: 2500,
    yearBuilt: 2001,
    coordinates: { lat: 7.2970, lng: 5.1280 },
    visitorsCount: 4500
  },
  {
    id: "saat",
    name: "School of Agriculture and Agricultural Technology (SAAT)",
    shortName: "SAAT Building",
    category: "school",
    image: "https://images.unsplash.com/photo-1494783367193-149034c05e41?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1494783367193-149034c05e41?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=800"
    ],
    panoramaImage: "https://images.unsplash.com/photo-1494783367193-149034c05e41?auto=format&fit=crop&q=80&w=2000",
    description: "Focus on agricultural science, technology, and sustainable farming practices. Features modern farming facilities.",
    history: "SAAT promotes agricultural research and innovation to address food security challenges in Nigeria and Africa.",
    academicDepts: ["Agricultural Engineering", "Agronomy", "Soil Science", "Agricultural Economics"],
    facilities: ["Experimental Farms", "Greenhouses", "Research Labs", "Farm Equipment"],
    studentCapacity: 1800,
    yearBuilt: 2001,
    coordinates: { lat: 7.2920, lng: 5.1220 },
    visitorsCount: 2800
  },
  {
    id: "senate",
    name: "Senate Building",
    shortName: "Administration Hub",
    category: "admin",
    image: "https://images.unsplash.com/photo-1573495627361-c0127efd3481?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1573495627361-c0127efd3481?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800"
    ],
    panoramaImage: "https://images.unsplash.com/photo-1573495627361-c0127efd3481?auto=format&fit=crop&q=80&w=2000",
    description: "The administrative heart of FUTA where major university decisions are made. Houses the Office of the Vice-Chancellor.",
    history: "The Senate Building is the symbol of FUTA's governance and academic authority. It hosted countless important decisions shaping the university's future.",
    academicDepts: ["Vice-Chancellor's Office", "Registrar's Office", "Bursary", "Academic Affairs"],
    facilities: ["Senate Chamber", "Conference Rooms", "Administrative Offices", "Documentation Center"],
    yearBuilt: 2000,
    coordinates: { lat: 7.3000, lng: 5.1300 },
    visitorsCount: 5200
  },
  {
    id: "library",
    name: "Learning Resources Centre",
    shortName: "Library",
    category: "facility",
    image: "https://images.unsplash.com/photo-1507842721343-583f20270319?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1507842721343-583f20270319?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800"
    ],
    panoramaImage: "https://images.unsplash.com/photo-1507842721343-583f20270319?auto=format&fit=crop&q=80&w=2000",
    description: "A comprehensive resource center with thousands of books, journals, and digital materials. The intellectual hub of the campus.",
    history: "The library was founded to support academic excellence with one of the most comprehensive collections in Nigeria.",
    academicDepts: ["Reference Section", "Research Wing", "Digital Resources", "Special Collections"],
    facilities: ["Reading Rooms", "Computer Lab", "Quiet Study Areas", "WiFi Coverage"],
    studentCapacity: 3000,
    yearBuilt: 2002,
    coordinates: { lat: 7.2980, lng: 5.1350 },
    visitorsCount: 8000
  },
  {
    id: "auditorium",
    name: "Main Auditorium",
    shortName: "Auditorium",
    category: "landmark",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1540575467063-178cb50ee898?auto=format&fit=crop&q=80&w=800"
    ],
    panoramaImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=2000",
    description: "A state-of-the-art auditorium hosting lectures, seminars, conferences, and cultural events for up to 2000 people.",
    history: "Built to provide a world-class venue for academic and cultural programs, the auditorium has hosted prominent speakers and national events.",
    academicDepts: ["Events & Conferences", "Lecture Series", "Cultural Programs"],
    facilities: ["Main Venue", "VIP Lounge", "Sound System", "Projection Setup"],
    studentCapacity: 2000,
    yearBuilt: 2005,
    coordinates: { lat: 7.2950, lng: 5.1400 },
    visitorsCount: 3200
  }
];

export default function VirtualTourPage() {
  useAnalytics("virtual_tour");

  const [selectedBuilding, setSelectedBuilding] = useState<Building>(CAMPUS_BUILDINGS[0]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"gallery" | "panorama">("gallery");
  const [showVideo, setShowVideo] = useState(false);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? selectedBuilding.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === selectedBuilding.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleSelectBuilding = (building: Building) => {
    setSelectedBuilding(building);
    setCurrentImageIndex(0);
  };

  const categoryColors = {
    school: "bg-blue-100 text-blue-700",
    admin: "bg-purple-100 text-purple-700",
    facility: "bg-green-100 text-green-700",
    landmark: "bg-amber-100 text-amber-700"
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
          <div className="container space-y-4">
            <div className="flex items-center gap-2">
              <ImagePlay className="h-6 w-6" />
              <h1 className="text-4xl font-extrabold">Virtual Campus Tour</h1>
            </div>
            <p className="text-blue-100 text-lg max-w-2xl">
              Explore FUTA's state-of-the-art facilities, historic buildings, and vibrant academic spaces.
              Navigate through our campus to discover where excellence happens.
            </p>
          </div>
        </div>

        {/* Main Tour Section */}
        <div className="container py-12 space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Media Viewer */}
            <div className="lg:col-span-2 space-y-4">
              {/* View Mode Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "gallery" ? "default" : "outline"}
                  onClick={() => setViewMode("gallery")}
                  className="rounded-lg"
                >
                  <ImagePlay className="h-4 w-4 mr-2" />
                  Gallery
                </Button>
                {selectedBuilding.panoramaImage && (
                  <Button
                    variant={viewMode === "panorama" ? "default" : "outline"}
                    onClick={() => setViewMode("panorama")}
                    className="rounded-lg"
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    360° View
                  </Button>
                )}
              </div>

              {/* Video Player or Image Viewer */}
              {showVideo ? (
                <Card className="overflow-hidden aspect-video bg-black relative">
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <video
                        controls
                        className="w-full h-full object-contain"
                        src="https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4"
                      />
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowVideo(false)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 text-white rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ) : viewMode === "panorama" && selectedBuilding.panoramaImage ? (
                <PanoramaViewer
                  imageUrl={selectedBuilding.panoramaImage}
                  title={`${selectedBuilding.shortName} - 360° View`}
                />
              ) : (
                <Card className="overflow-hidden aspect-video bg-slate-900 relative group">
                  <img
                    src={selectedBuilding.images[currentImageIndex]}
                    alt={selectedBuilding.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Image Navigation */}
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {selectedBuilding.images.length}
                  </div>
                </Card>
              )}

              {/* Building Overview */}
              <Card className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={categoryColors[selectedBuilding.category]}>
                          {selectedBuilding.category}
                        </Badge>
                        <h2 className="text-3xl font-bold">{selectedBuilding.shortName}</h2>
                      </div>
                      <p className="text-muted-foreground text-lg">{selectedBuilding.name}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-amber-900">4.8</span>
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {selectedBuilding.description}
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {selectedBuilding.yearBuilt && (
                      <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
                        <p className="text-sm text-muted-foreground">Year Built</p>
                        <p className="font-bold text-lg">{selectedBuilding.yearBuilt}</p>
                      </div>
                    )}
                    {selectedBuilding.studentCapacity && (
                      <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-bold text-lg">{selectedBuilding.studentCapacity.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedBuilding.visitorsCount && (
                      <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <MapPin className="h-5 w-5 mx-auto text-primary mb-1" />
                        <p className="text-sm text-muted-foreground">Visitors</p>
                        <p className="font-bold text-lg">{selectedBuilding.visitorsCount.toLocaleString()}</p>
                      </div>
                    )}
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                      <Info className="h-5 w-5 mx-auto text-primary mb-1" />
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-bold text-lg">Active</p>
                    </div>
                  </div>
                </div>

                {/* History */}
                <div className="border-t pt-6 space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Historical Significance
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedBuilding.history}
                  </p>
                </div>

                {/* Departments/Facilities */}
                <div className="border-t pt-6 space-y-3">
                  <h3 className="font-bold text-lg">
                    {selectedBuilding.category === "school" ? "Academic Departments" : "Key Facilities"}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedBuilding.academicDepts.map((dept) => (
                      <div
                        key={dept}
                        className="bg-primary/5 border border-primary/10 p-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-primary/10 transition-colors"
                      >
                        {dept}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Facilities */}
                <div className="border-t pt-6 space-y-3">
                  <h3 className="font-bold text-lg">Available Resources</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedBuilding.facilities.map((facility) => (
                      <div
                        key={facility}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-6 space-y-3">
                  {/* Video Tour */}
                  {selectedBuilding.videoUrl && (
                    <Button
                      onClick={() => setShowVideo(true)}
                      variant="outline"
                      className="w-full h-11 rounded-lg gap-2"
                    >
                      <Play className="h-5 w-5" />
                      Watch Video Tour
                    </Button>
                  )}

                  {/* Navigate to Map */}
                  <Link to={`/map?building=${selectedBuilding.id}`} className="block">
                    <Button className="w-full h-11 rounded-lg gap-2">
                      <MapPin className="h-5 w-5" />
                      Navigate on Map
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Building List Sidebar */}
            <div className="space-y-4">
              <h3 className="font-bold text-xl">Campus Buildings</h3>
              <div className="space-y-2">
                {CAMPUS_BUILDINGS.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleSelectBuilding(building)}
                    className={cn(
                      "w-full p-4 rounded-lg text-left transition-all border-2",
                      selectedBuilding.id === building.id
                        ? "bg-primary text-primary-foreground border-primary shadow-lg"
                        : "bg-background border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm line-clamp-2">{building.shortName}</p>
                        <p className={cn(
                          "text-xs",
                          selectedBuilding.id === building.id ? "opacity-80" : "text-muted-foreground"
                        )}>
                          {building.category}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Explore More */}
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 space-y-3">
                <h4 className="font-bold text-blue-900">Discover More</h4>
                <p className="text-sm text-blue-800">
                  Ready to navigate? Check out our interactive map for real-time navigation and directions.
                </p>
                <Link to="/map" className="block">
                  <Button size="sm" className="w-full" variant="default">
                    Open Interactive Map
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t mt-12">
          <div className="container py-8 flex justify-between items-center">
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back Home
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              "FUTA is vertical storytelling" - Explore every corner of excellence
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
