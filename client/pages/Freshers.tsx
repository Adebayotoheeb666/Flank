import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Volume2, MapPin, Compass, ChevronRight, ChevronLeft,
  TreeDeciduous, Building2, AlertCircle, Phone, X,
  Play, Pause, SkipForward, SkipBack, Home
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Landmark-based guidance system
const GUIDANCE_SEQUENCE = [
  {
    id: 1,
    instruction: "Start at the Main Gate",
    landmark: "The big red gate with FUTA signage",
    action: "Walk straight ahead towards the clock tower",
    distance: "200m",
    tips: ["Look for the FUTA banner", "Avoid vehicles during peak hours"]
  },
  {
    id: 2,
    instruction: "Pass the Big Mango Tree",
    landmark: "A large ancient mango tree on your left",
    action: "Continue straight, the tree should be on your left side",
    distance: "150m",
    tips: ["Many students rest under this tree", "Great landmark for orientation"]
  },
  {
    id: 3,
    instruction: "Turn right at the Clock Tower",
    landmark: "The iconic white clock tower at the campus center",
    action: "Make a sharp right turn",
    distance: "100m",
    tips: ["This is the campus landmark", "Perfect place for photos"]
  },
  {
    id: 4,
    instruction: "Head towards Senate Building",
    landmark: "A large administrative building ahead",
    action: "Walk straight until you see the Senate Building",
    distance: "250m",
    tips: ["This is the administrative center", "Most student services are here"]
  },
  {
    id: 5,
    instruction: "Arrival at Destination",
    landmark: "You have arrived",
    action: "Check in with the reception",
    distance: "0m",
    tips: ["Welcome to FUTA!", "Ask staff for further directions if needed"]
  }
];

export default function FreshersPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const synth = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      synth.current = window.speechSynthesis;
    }
  }, []);

  const playVoiceGuidance = (text: string) => {
    if (!synth.current || !isVoiceEnabled) return;

    // Cancel any ongoing speech
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);

    synth.current.speak(utterance);
  };

  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < GUIDANCE_SEQUENCE.length - 1) {
      setCurrentStep(currentStep + 1);
      playVoiceGuidance(GUIDANCE_SEQUENCE[currentStep + 1].instruction);
    }
  };

  const handlePlayVoice = () => {
    const current = GUIDANCE_SEQUENCE[currentStep];
    const fullText = `${current.instruction}. ${current.action}. ${current.landmark}`;
    playVoiceGuidance(fullText);
  };

  const step = GUIDANCE_SEQUENCE[currentStep];
  const progress = ((currentStep + 1) / GUIDANCE_SEQUENCE.length) * 100;

  return (
    <Layout>
      <div className="container py-12 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-bold text-sm uppercase tracking-wider">
            <Compass className="h-4 w-4" />
            <span>Freshers Mode</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Welcome to FUTA</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let us guide you through campus with landmark-based directions and voice assistance.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{currentStep + 1} of {GUIDANCE_SEQUENCE.length}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Guidance Card */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Landmark Visualization */}
          <Card className="p-8 flex flex-col justify-between min-h-[400px]">
            <div className="space-y-6">
              <div className="relative w-full aspect-video bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-200">
                {step.id === 1 && <Building2 className="h-24 w-24 text-blue-400 opacity-50" />}
                {step.id === 2 && <TreeDeciduous className="h-24 w-24 text-green-400 opacity-50" />}
                {step.id === 3 && <Compass className="h-24 w-24 text-yellow-400 opacity-50" />}
                {step.id === 4 && <Building2 className="h-24 w-24 text-purple-400 opacity-50" />}
                {step.id === 5 && <MapPin className="h-24 w-24 text-red-400 opacity-50" />}
                <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                  {step.landmark}
                </div>
              </div>

              <div className="space-y-2">
                <Badge variant={completedSteps.includes(currentStep) ? "secondary" : "default"}>
                  Step {currentStep + 1}
                </Badge>
                <h2 className="text-3xl font-bold">{step.instruction}</h2>
                <p className="text-muted-foreground text-lg">{step.action}</p>
              </div>

              <div className="bg-muted p-4 rounded-xl">
                <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Helpful Tips
                </p>
                <ul className="space-y-2">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">Distance</p>
                  <p className="text-xs text-blue-700">{step.distance} to next landmark</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Controls & Audio Section */}
          <div className="flex flex-col gap-6">
            {/* Voice Control Card */}
            <Card className="p-8 space-y-6">
              <div className="space-y-3">
                <h3 className="font-bold text-xl">Voice Guidance</h3>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                  <input
                    type="checkbox"
                    id="voiceToggle"
                    checked={isVoiceEnabled}
                    onChange={(e) => setIsVoiceEnabled(e.target.checked)}
                    className="w-5 h-5 text-primary rounded"
                  />
                  <label htmlFor="voiceToggle" className="cursor-pointer flex-1">
                    <p className="font-semibold">Enable voice guidance</p>
                    <p className="text-xs text-muted-foreground">Listen to landmarks and directions</p>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handlePlayVoice}
                  disabled={!isVoiceEnabled}
                  className="w-full h-12 rounded-xl gap-2 font-bold"
                  variant={isPlaying ? "secondary" : "default"}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-5 w-5" />
                      Stop Voice
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-5 w-5" />
                      Play Voice Guidance
                    </>
                  )}
                </Button>
              </div>

              {/* Navigation Controls */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-bold">Navigation</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 0}
                    className="flex-1 rounded-xl"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => currentStep < GUIDANCE_SEQUENCE.length - 1 && setCurrentStep(currentStep + 1)}
                    disabled={currentStep === GUIDANCE_SEQUENCE.length - 1}
                    className="flex-1 rounded-xl"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {currentStep < GUIDANCE_SEQUENCE.length - 1 && (
                <Button
                  onClick={handleStepComplete}
                  size="lg"
                  className="w-full h-12 rounded-xl gap-2 font-bold bg-green-600 hover:bg-green-700"
                >
                  <ChevronRight className="h-5 w-5" />
                  Mark Complete & Continue
                </Button>
              )}

              {currentStep === GUIDANCE_SEQUENCE.length - 1 && (
                <div className="space-y-3">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                    <p className="font-bold text-green-900">Congratulations!</p>
                    <p className="text-sm text-green-700">You've completed the guided tour</p>
                  </div>
                  <Link to="/map">
                    <Button size="lg" className="w-full h-12 rounded-xl">
                      <MapPin className="h-5 w-5" />
                      Explore Interactive Map
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 space-y-3">
              <h3 className="font-bold">Quick Actions</h3>
              <Link to="/emergency" className="block">
                <Button variant="outline" size="lg" className="w-full h-11 rounded-xl gap-2 justify-start border-red-200 text-red-600 hover:text-red-700">
                  <Phone className="h-5 w-5" />
                  Emergency Help
                </Button>
              </Link>
              <Link to="/" className="block">
                <Button variant="outline" size="lg" className="w-full h-11 rounded-xl gap-2 justify-start">
                  <Home className="h-5 w-5" />
                  Back to Home
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* Completed Steps Overview */}
        {completedSteps.length > 0 && (
          <Card className="p-8 space-y-4">
            <h3 className="font-bold text-lg">Completed Steps</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {GUIDANCE_SEQUENCE.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "p-4 rounded-xl text-center transition-all border-2",
                    completedSteps.includes(idx)
                      ? "bg-green-50 border-green-300"
                      : idx < currentStep
                      ? "bg-muted border-muted-foreground/20"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  <p className="text-sm font-bold">{s.id}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.instruction}</p>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
