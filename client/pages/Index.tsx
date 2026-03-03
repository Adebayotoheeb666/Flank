import { MapPin, Navigation, Compass, Phone, Search, Bell, Clock, Info, Shield, GraduationCap, Building2, Utensils, Landmark, CreditCard, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/use-analytics";

export default function Index() {
  // Track page analytics
  useAnalytics("index");

  const [searchQuery, setSearchQuery] = useState("");

  const quickLinks = [
    { label: "My Department", icon: GraduationCap, path: "/map?category=department", color: "bg-blue-500" },
    { label: "Lecture Venue", icon: Building2, path: "/map?category=venue", color: "bg-purple-500" },
    { label: "Nearest Food", icon: Utensils, path: "/map?category=food", color: "bg-orange-500" },
    { label: "Bank/ATM", icon: CreditCard, path: "/map?category=bank", color: "bg-green-500" },
    { label: "Health Center", icon: Activity, path: "/map?category=health", color: "bg-red-500" },
    { label: "Senate/Admin", icon: Landmark, path: "/map?category=admin", color: "bg-indigo-500" },
  ];

  const categories = [
    { id: "schools", label: "Schools (SEET, SAAT...)", count: 12 },
    { id: "halls", label: "Lecture Halls", count: 45 },
    { id: "hostels", label: "Hostels", count: 18 },
    { id: "banks", label: "Banks & ATMs", count: 8 },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/95 to-primary text-primary-foreground p-6">
        {/* Abstract Map Background Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 20 L20 0 M20 40 L40 20 M40 60 L60 40 M60 80 L80 60 M80 100 L100 80" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <path d="M0 80 L20 100 M20 60 L40 80 M40 40 L60 60 M60 20 L80 40 M80 0 L100 20" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <circle cx="20" cy="20" r="2" fill="currentColor" />
            <circle cx="80" cy="20" r="2" fill="currentColor" />
            <circle cx="20" cy="80" r="2" fill="currentColor" />
            <circle cx="80" cy="80" r="2" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              FUTA Pathfinder
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 max-w-2xl mx-auto">
              Smart navigation through the hills and halls of the Federal University of Technology Akure.
            </p>
          </div>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for departments, lecture halls, hostels..."
              className="w-full h-14 pl-12 pr-4 rounded-full text-lg shadow-2xl text-foreground focus-visible:ring-secondary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/map">
              <Button size="lg" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8 text-lg font-bold gap-2">
                <Navigation className="h-5 w-5" />
                Explore Map
              </Button>
            </Link>
            <Link to="/tour">
              <Button size="lg" variant="outline" className="rounded-full border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur hover:bg-primary-foreground/20 h-14 px-8 text-lg font-bold gap-2">
                <Compass className="h-5 w-5" />
                Virtual Tour
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="container -mt-20 relative z-20 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className="bg-card hover:bg-accent p-6 rounded-2xl shadow-xl transition-all hover:-translate-y-1 flex flex-col items-center text-center gap-3 group border border-border"
            >
              <div className={cn("p-3 rounded-xl text-white transition-transform group-hover:scale-110", link.color)}>
                <link.icon className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Freshers Mode Section */}
      <section className="container py-12 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/20 text-secondary font-bold text-sm">
            <Navigation className="h-4 w-4" />
            <span>NEW STUDENT?</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-primary">
            Guided Freshers Mode
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Welcome to FUTA! Getting lost is part of the tradition, but it doesn't have to be.
            Our Guided Mode takes you step-by-step from your hostel to your department, lecture halls, and back.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="bg-primary/10 p-1.5 rounded-full mt-1">
                <Navigation className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-bold">Step-by-step navigation:</span>
                <p className="text-sm text-muted-foreground">"Turn left at the big mango tree."</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-primary/10 p-1.5 rounded-full mt-1">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-bold">Hill-aware routing:</span>
                <p className="text-sm text-muted-foreground">Optimal paths that avoid steep climbs when you're tired.</p>
              </div>
            </li>
          </ul>
          <Link to="/freshers">
            <Button size="lg" className="rounded-xl px-8 h-12 text-lg font-bold">
              Start Guided Experience
            </Button>
          </Link>
        </div>
        <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-background">
           <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F81c227575c2f438fa8ab005c4c674b2d%2Fb468438e83c744bc84c3de4ecb943f88?format=webp&width=800&height=1200"
                alt="FUTA Senate Building"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
                <p className="text-lg font-bold">Senate Building</p>
                <p className="text-sm opacity-80 italic">"Walk past the Senate building. Turn left at the big mango tree."</p>
              </div>
           </div>
        </div>
      </section>

      {/* Search Categories Grid */}
      <section className="bg-muted/50 py-20">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Search Anything</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Quickly find whatever you need across the campus.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-background p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-border group cursor-pointer">
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{cat.label}</h3>
                <p className="text-muted-foreground">{cat.count} verified locations</p>
              </div>
            ))}
          </div>
          <div className="text-center">
             <Button variant="outline" size="lg" className="rounded-xl font-bold">
               View Full Directory
             </Button>
          </div>
        </div>
      </section>

      {/* Timetable & Emergency */}
      <section className="container py-24 grid md:grid-cols-2 gap-12">
        <div className="bg-primary p-10 rounded-3xl text-primary-foreground space-y-6 flex flex-col">
          <div className="h-14 w-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
            <Bell className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Never Miss a Lecture</h2>
          <p className="text-lg opacity-90 leading-relaxed flex-1">
            Sync your course timetable and get notifications before class starts. We even tell you exactly when to leave based on your current location and walking speed.
          </p>
          <div className="pt-4">
            <Link to="/timetable">
              <Button className="w-full md:w-auto bg-white text-primary hover:bg-white/90 h-12 rounded-xl font-bold text-lg border-none">
                Add My Courses
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-destructive p-10 rounded-3xl text-destructive-foreground space-y-6 flex flex-col">
          <div className="h-14 w-14 bg-destructive-foreground/20 rounded-2xl flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive-foreground" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Emergency Mode</h2>
          <p className="text-lg opacity-90 leading-relaxed flex-1">
            One tap for immediate help. Connect directly to FUTA Security, the Health Centre, or Fire Service. Your live location is shared automatically.
          </p>
          <div className="pt-4">
            <Link to="/emergency">
              <Button className="w-full md:w-auto bg-white text-destructive hover:bg-white/90 h-12 rounded-xl font-bold text-lg border-none">
                Open Emergency Panel
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Feedback Section */}
      <section className="bg-gradient-to-br from-orange-50 to-red-50 py-24 border-t">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-orange-900">
              Help Us Improve
            </h2>
            <p className="text-orange-700 max-w-2xl mx-auto text-lg">
              Found an error on the map? Missing building? Tell us! Your feedback helps us build a more accurate and useful navigation tool for everyone.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link to="/community/reports">
              <button className="bg-white p-8 rounded-2xl text-center space-y-3 hover:shadow-lg transition-all border-2 border-orange-200 group w-full">
                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg text-orange-900">Report an Issue</h3>
                <p className="text-sm text-orange-700">Help us fix map errors and navigation problems</p>
              </button>
            </Link>
            <Link to="/community/reports">
              <button className="bg-white p-8 rounded-2xl text-center space-y-3 hover:shadow-lg transition-all border-2 border-orange-200 group w-full">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg text-orange-900">View Reports</h3>
                <p className="text-sm text-orange-700">See what issues are being tracked and fixed</p>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics & Admin */}
      <section className="container py-24">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
            Campus Insights
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Discover the most visited locations and popular navigation patterns on campus.
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <Link to="/admin/analytics">
            <Button size="lg" className="w-full h-14 rounded-xl font-bold text-lg gap-2">
              <Info className="h-5 w-5" />
              View Analytics Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Floating Emergency Button (Mobile/Desktop Always) */}
      <Link to="/emergency">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-destructive text-destructive-foreground shadow-2xl z-50 hover:bg-destructive/90 animate-bounce"
          title="Emergency Assistance"
        >
          <Phone className="h-8 w-8" />
        </Button>
      </Link>
    </Layout>
  );
}
