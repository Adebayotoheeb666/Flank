import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MapPin, Search, Navigation, Compass, Phone, Info, Menu, X, Home } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import OfflineStatus from "@/components/OfflineStatus";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Map", path: "/map", icon: MapPin },
    { label: "Guided Tour", path: "/tour", icon: Compass },
    { label: "Timetable", path: "/timetable", icon: Navigation },
    { label: "Emergency", path: "/emergency", icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <OfflineStatus />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="bg-primary text-primary-foreground p-1 rounded-lg">
              <MapPin className="h-6 w-6" />
            </div>
            <span>FUTA Pathfinder</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive(item.path) ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/map?focus=search">
              <Button variant="outline" size="sm" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </Link>
            <Link to="/freshers">
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 border-none">
                Freshers Mode
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-6 gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-4 text-lg font-medium p-3 rounded-xl transition-colors",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t flex flex-col gap-4">
              <Link to="/map?focus=search" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full justify-start gap-4 h-12 text-lg">
                  <Search className="h-5 w-5" />
                  Search Campus
                </Button>
              </Link>
              <Link to="/freshers" onClick={() => setIsMenuOpen(false)}>
                <Button variant="secondary" className="w-full justify-start gap-4 h-12 text-lg">
                  <Compass className="h-5 w-5" />
                  Start Freshers Guide
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Social proof & secondary navigation - Hide on map page */}
      {location.pathname !== "/map" && (
        <footer className="border-t bg-muted/30 py-8">
          <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-4">
                <MapPin className="h-6 w-6" />
                <span>FUTA Pathfinder</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm">
                Navigating FUTA's hills and halls with ease. The ultimate companion for every student, visitor, and staff member.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/map" className="hover:text-primary">Campus Map</Link></li>
                <li><Link to="/tour" className="hover:text-primary">Virtual Tour</Link></li>
                <li><Link to="/emergency" className="hover:text-primary">Emergency Services</Link></li>
                <li><Link to="/timetable" className="hover:text-primary">Class Timetable</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/help" className="hover:text-primary">Help Center</Link></li>
                <li><Link to="/community/reports" className="hover:text-primary">Report an Issue</Link></li>
                <li><Link to="/emergency" className="hover:text-primary">Contact Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="container mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Federal University of Technology Akure. Designed for Excellence.
          </div>
        </footer>
      )}
    </div >
  );
}
