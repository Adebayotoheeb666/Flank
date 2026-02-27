import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Phone, Shield, Activity, Flame, ArrowLeft, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmergencyPage() {
  const contacts = [
    { title: "FUTA Security", phone: "0801-234-5678", icon: Shield, color: "bg-blue-600" },
    { title: "Health Centre", phone: "0802-345-6789", icon: Activity, color: "bg-red-600" },
    { title: "Fire Service", phone: "0803-456-7890", icon: Flame, color: "bg-orange-600" },
  ];

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
            One-tap assistance for any emergency on campus. Your live location is automatically shared with responders.
          </p>
        </div>

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

        <div className="bg-muted p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="bg-primary/10 h-16 w-16 rounded-2xl flex items-center justify-center">
              <Navigation className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-xl">Nearest Safe Building</h4>
              <p className="text-muted-foreground">Senate Building (250m away)</p>
            </div>
          </div>
          <Link to="/map?id=senate">
            <Button size="lg" className="rounded-xl h-12 px-8 font-bold">
              Navigate There
            </Button>
          </Link>
        </div>

        <div className="text-center pt-8">
           <Link to="/" className="text-muted-foreground hover:text-primary flex items-center justify-center gap-2 transition-colors">
             <ArrowLeft className="h-4 w-4" />
             Back to Safety Home
           </Link>
        </div>
      </div>
    </Layout>
  );
}
