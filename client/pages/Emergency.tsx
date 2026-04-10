import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAnalytics, trackNavigation } from "@/hooks/use-analytics";
import { useUserId } from "@/hooks/use-auth";
import {
  Phone, Shield, Activity, Flame, ArrowLeft, Navigation,
  MapPin, AlertCircle, Send, Clock, Users, CheckCircle,
  Share2, AlertTriangle, Loader, Copy
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { logGeolocationError } from "@/lib/geolocation-utils";
import { SOSTriggerRequest, SOSType } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

interface EmergencySOSType {
  id: SOSType;
  title: string;
  icon: any;
  color: string;
  description: string;
}

interface EmergencyContact {
  id: string;
  title: string;
  phone: string;
  type: string;
}

export default function EmergencyPage() {
  // Track page analytics
  useAnalytics("emergency");
  const { toast } = useToast();
  const userId = useUserId();

  const [selectedSOS, setSelectedSOS] = useState<string | null>(null);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sosActive, setSOSActive] = useState(false);
  const [sosStartTime, setSOSStartTime] = useState<Date | null>(null);
  const [respondersCount, setRespondersCount] = useState(0);
  const [sosId, setSOSId] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [contacts, setContacts] = useState<Array<EmergencyContact & { icon: any; color: string }>>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const locationWatchId = useRef<number | null>(null);

  const sosTypes: EmergencySOSType[] = [
    {
      id: "medical",
      title: "Medical Emergency",
      icon: Activity,
      color: "bg-red-600 hover:bg-red-700",
      description: "Accident, injury, or health issue"
    },
    {
      id: "fire",
      title: "Fire/Evacuation",
      icon: Flame,
      color: "bg-orange-600 hover:bg-orange-700",
      description: "Fire, smoke, or evacuation needed"
    },
    {
      id: "security",
      title: "Security Threat",
      icon: Shield,
      color: "bg-blue-600 hover:bg-blue-700",
      description: "Theft, assault, or suspicious activity"
    },
  ];

  // Fetch emergency contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const response = await fetch("/api/emergency/contacts");
        if (response.ok) {
          const data = await response.json();
          const iconMap: Record<string, any> = {
            security: Shield,
            medical: Activity,
            fire: Flame
          };
          const colorMap: Record<string, string> = {
            security: "bg-blue-600",
            medical: "bg-red-600",
            fire: "bg-orange-600"
          };
          const contactsWithIcons = data.map((contact: EmergencyContact) => ({
            ...contact,
            icon: iconMap[contact.type] || Shield,
            color: colorMap[contact.type] || "bg-gray-600"
          }));
          setContacts(contactsWithIcons);
        }
      } catch (error) {
        console.error("Failed to fetch emergency contacts:", error);
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  // Get user location and update to server
  useEffect(() => {
    if (isLocationActive && navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);

          // Update location on server if SOS is active
          if (sosActive && sosId) {
            try {
              await fetch(`/api/emergency/sos/${sosId}/location`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sosId,
                  latitude: newLocation.lat,
                  longitude: newLocation.lng,
                  timestamp: new Date().toISOString()
                })
              });
            } catch (error) {
              console.error("Failed to update location:", error instanceof Error ? error.message : String(error));
            }
          }
        },
        (error: any) => {
          logGeolocationError("[Emergency] SOS tracking", error);
        }
      );

      return () => {
        if (locationWatchId.current !== null) {
          navigator.geolocation.clearWatch(locationWatchId.current);
        }
      };
    }
  }, [isLocationActive, sosActive, sosId]);

  // Simulate responder arrival
  useEffect(() => {
    if (sosActive) {
      const interval = setInterval(() => {
        setRespondersCount(prev => (prev < 3 ? prev + 1 : prev));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [sosActive]);

  const triggerSOS = async (sosTypeId: string) => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please enable location services to trigger SOS",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTriggering(true);
      const sosRequest: SOSTriggerRequest = {
        sosType: sosTypeId as SOSType,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        userId
      };

      const response = await fetch("/api/emergency/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sosRequest)
      });

      if (!response.ok) {
        throw new Error("Failed to trigger SOS");
      }

      const data = await response.json();
      setSOSId(data.sosId);
      setSelectedSOS(sosTypeId);
      setSOSActive(true);
      setSOSStartTime(new Date());
      setIsLocationActive(true);

      // Track emergency event
      trackNavigation("current_location", sosTypeId, "emergency_sos", 0);

      toast({
        title: "SOS Triggered",
        description: "Responders have been notified of your emergency",
        variant: "default",
      });
    } catch (error) {
      console.error("SOS trigger error:", error);
      toast({
        title: "Error",
        description: "Failed to trigger SOS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const cancelSOS = async () => {
    if (sosId) {
      try {
        await fetch(`/api/emergency/sos/${sosId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sosId })
        });
      } catch (error) {
        console.error("Failed to cancel SOS:", error);
      }
    }
    setSOSActive(false);
    setSelectedSOS(null);
    setSOSStartTime(null);
    setRespondersCount(0);
    setIsLocationActive(false);
    setSOSId(null);
  };

  const copySosId = () => {
    if (sosId) {
      navigator.clipboard.writeText(sosId);
      toast({
        title: "Copied",
        description: "SOS ID copied to clipboard",
      });
    }
  };

  const getCurrentSOSType = () => sosTypes.find(sos => sos.id === selectedSOS);

  // If SOS is active, show live responder status
  if (sosActive && selectedSOS) {
    const currentSOS = getCurrentSOSType();
    const elapsedTime = sosStartTime
      ? Math.floor((new Date().getTime() - sosStartTime.getTime()) / 1000)
      : 0;

    return (
      <Layout>
        <div className="container py-12 space-y-8 animate-in fade-in duration-500">
          {/* SOS Active Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 font-bold text-sm uppercase tracking-wider animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              <span>SOS Active</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-red-600">
              {currentSOS?.title}
            </h1>
          </div>

          {/* Live Status Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Responders */}
            <Card className="p-6 space-y-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="font-bold">Responders Coming</h3>
              </div>
              <div className="space-y-2">
                {Array.from({ length: respondersCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium">Responder {i + 1} En Route</span>
                  </div>
                ))}
                {respondersCount < 3 && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-dashed border-green-300 animate-pulse">
                    <Loader className="h-4 w-4 text-green-500 animate-spin" />
                    <span className="text-sm text-muted-foreground">Notifying responders...</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Location Sharing */}
            <Card className="p-6 space-y-4 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold">Live Location</h3>
              </div>
              {userLocation && (
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-muted-foreground">Latitude</p>
                    <p className="font-mono text-sm font-semibold">{userLocation.lat.toFixed(4)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-muted-foreground">Longitude</p>
                    <p className="font-mono text-sm font-semibold">{userLocation.lng.toFixed(4)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-700 bg-white p-2 rounded border border-blue-200">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Sharing live location with responders
                  </div>
                </div>
              )}
            </Card>

            {/* Timer */}
            <Card className="p-6 space-y-4 border-purple-200 bg-purple-50">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold">SOS Duration</h3>
              </div>
              <div className="space-y-2">
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <p className="text-3xl font-bold font-mono text-purple-600">
                    {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Elapsed time</p>
                </div>
                {sosId && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded border border-purple-200">
                    <span className="text-xs text-muted-foreground flex-1">ID: {sosId.substring(0, 8)}...</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copySosId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Responder Details */}
          <Card className="p-8 space-y-6 border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-bold text-yellow-900">Stay Calm</p>
                <p className="text-sm text-yellow-700">
                  Responders have been notified and are on their way. Remain in a safe location and keep your phone visible.
                  Your live location is being shared with FUTA Security and emergency services.
                </p>
              </div>
            </div>
          </Card>

          {/* Emergency Contacts */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Direct Contacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <Button
                  key={contact.title}
                  size="lg"
                  className={`${contact.color} h-14 rounded-xl text-white font-bold gap-3`}
                >
                  <Phone className="h-5 w-5" />
                  {contact.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Cancel SOS */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={cancelSOS}
              variant="outline"
              size="lg"
              className="rounded-xl h-12 px-8 font-bold border-red-300 text-red-600 hover:bg-red-50"
            >
              Cancel SOS
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-24 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 text-destructive font-bold text-sm uppercase tracking-wider">
            <Shield className="h-4 w-4" />
            <span>Emergency Mode</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Need Immediate Help?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One-tap SOS triggers for any emergency. Your live location is automatically shared with responders.
          </p>
        </div>

        {/* SOS Type Selection */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">What type of emergency?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sosTypes.map((sos) => {
              const IconComponent = sos.icon;
              return (
                <button
                  key={sos.id}
                  onClick={() => triggerSOS(sos.id)}
                  disabled={isTriggering || !userLocation}
                  className={cn(
                    "p-8 rounded-3xl text-white font-bold text-lg group hover:-translate-y-1 transition-all shadow-xl border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed",
                    sos.color,
                    "space-y-4 flex flex-col items-center justify-center min-h-[300px]"
                  )}
                >
                  {isTriggering ? (
                    <>
                      <Loader className="h-16 w-16 animate-spin" />
                      <p className="text-lg font-extrabold">Triggering...</p>
                    </>
                  ) : (
                    <>
                      <IconComponent className="h-16 w-16 group-hover:scale-110 transition-transform" />
                      <div className="space-y-2 text-center">
                        <p className="text-xl font-extrabold">{sos.title}</p>
                        <p className="text-sm font-medium opacity-90">{sos.description}</p>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Contacts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Or Call Directly</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <div key={contact.title} className="bg-card p-8 rounded-3xl shadow-xl border text-center space-y-6 group hover:-translate-y-1 transition-all">
                <div className={`${contact.color} h-20 w-20 mx-auto rounded-3xl flex items-center justify-center text-white shadow-lg`}>
                  <contact.icon className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{contact.title}</h3>
                  <p className="text-muted-foreground font-mono text-xl">{contact.phone}</p>
                </div>
                <Button size="lg" className={`${contact.color} w-full h-14 rounded-2xl text-lg font-bold gap-3 text-white`}>
                  <Phone className="h-6 w-6" />
                  Call Now
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Nearest Safe Building */}
        {userLocation && (
          <div className="bg-muted p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="bg-primary/10 h-16 w-16 rounded-2xl flex items-center justify-center">
                <Navigation className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-xl">Quick Navigation</h4>
                <p className="text-muted-foreground">Find nearest help or safe zone on the map</p>
              </div>
            </div>
            <Link to="/map">
              <Button size="lg" className="rounded-xl h-12 px-8 font-bold">
                Open Map
              </Button>
            </Link>
          </div>
        )}

        <div className="text-center pt-8">
          <Link to="/" className="text-muted-foreground hover:text-primary flex items-center justify-center gap-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
