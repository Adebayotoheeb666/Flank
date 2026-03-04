import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Info, MapPin, Navigation, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/use-analytics";

export default function HelpPage() {
    useAnalytics("help");

    const faqs = [
        {
            question: "How do I use Freshers Mode?",
            answer: "Click on 'Freshers Mode' in the navigation bar or on the Home page. It provides a step-by-step guided experience with landmark-based directions (like 'Turn left at the big mango tree') and voice assistance to help you find your way around campus easily."
        },
        {
            question: "Can I use the app offline?",
            answer: "Yes! FUTA Pathfinder is a Progressive Web App (PWA). Once you've visited the site, the map and location data are cached on your device. You can search for locations and navigate even without an active internet connection."
        },
        {
            question: "What should I do in an emergency?",
            answer: "Tap the floating emergency button (telephone icon) or go to the 'Emergency' page. You can one-tap call FUTA Security, the Health Centre, or Fire Service. Your live coordinates are displayed on the screen to help responders find you."
        },
        {
            question: "How do I report a missing building or wrong location?",
            answer: "Go to the 'Community Reports' page (accessible from the home page or footer). You can submit a report with details about the issue. Our team reviews these regularly to keep the map updated."
        },
        {
            question: "How do I see my course timetable?",
            answer: "Navigate to the 'Timetable' page and add your courses. You'll receive intelligent reminders telling you exactly when to leave for class based on your current location on campus."
        }
    ];

    return (
        <Layout>
            <div className="container py-12 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm uppercase tracking-wider">
                        <HelpCircle className="h-4 w-4" />
                        <span>Support Center</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">How can we help?</h1>
                    <p className="text-xl text-muted-foreground">
                        Find answers to common questions and learn how to make the most of FUTA Pathfinder.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 space-y-3 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
                        <Navigation className="h-8 w-8 text-primary" />
                        <h3 className="font-bold text-lg">Navigation</h3>
                        <p className="text-sm text-muted-foreground">Learn how to route between departments and landmarks.</p>
                    </Card>
                    <Card className="p-6 space-y-3 border-orange-200 bg-gradient-to-br from-orange-50 to-transparent">
                        <Shield className="h-8 w-8 text-orange-600" />
                        <h3 className="font-bold text-lg">Safety</h3>
                        <p className="text-sm text-muted-foreground">Access emergency contacts and share your live location.</p>
                    </Card>
                    <Card className="p-6 space-y-3 border-blue-200 bg-gradient-to-br from-blue-50 to-transparent">
                        <MapPin className="h-8 w-8 text-blue-600" />
                        <h3 className="font-bold text-lg">Offline Maps</h3>
                        <p className="text-sm text-muted-foreground">Using the app without data or in low-signal areas.</p>
                    </Card>
                </div>

                {/* FAQs */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Info className="h-6 w-6 text-primary" />
                        Frequently Asked Questions
                    </h2>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left font-semibold py-4 hover:no-underline hover:text-primary transition-colors">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                {/* Contact Support */}
                <div className="bg-muted/50 p-8 rounded-3xl text-center space-y-6">
                    <h3 className="text-2xl font-bold">Still need help?</h3>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        If you encounter any technical issues or have suggestions for new features, please use our reporting tool or visit the Computer State Centre.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/emergency">
                            <Button size="lg" className="rounded-xl px-8 font-bold gap-2 w-full sm:w-auto">
                                <Phone className="h-5 w-5" />
                                Call Security
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="rounded-xl px-8 font-bold border-primary text-primary hover:bg-primary/5 w-full sm:w-auto">
                            Email Support
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
