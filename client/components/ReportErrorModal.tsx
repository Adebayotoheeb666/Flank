import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapErrorReport } from "@shared/api";
import { AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation?: { lat: number; lng: number };
}

export default function ReportErrorModal({
  open,
  onOpenChange,
  currentLocation,
}: ReportErrorModalProps) {
  const [step, setStep] = useState<"form" | "submitted">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MapErrorReport>({
    type: "incorrect_location",
    title: "",
    description: "",
    severity: "medium",
    location: currentLocation,
  });

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/error-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStep("submitted");
        setTimeout(() => {
          setStep("form");
          onOpenChange(false);
          setFormData({
            type: "incorrect_location",
            title: "",
            description: "",
            severity: "medium",
            location: currentLocation,
          });
        }, 2000);
      } else {
        alert("Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error submitting report. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        {step === "form" ? (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <AlertDialogTitle>Report a Map Error</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                Help us improve the campus map by reporting inaccuracies or missing information.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-6 py-4">
              {/* Error Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="font-semibold">
                  Error Type <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incorrect_location">
                      Incorrect Building Location
                    </SelectItem>
                    <SelectItem value="missing_building">
                      Missing Building/Facility
                    </SelectItem>
                    <SelectItem value="outdated_info">Outdated Information</SelectItem>
                    <SelectItem value="navigation_issue">
                      Navigation Issue
                    </SelectItem>
                    <SelectItem value="other">Other Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold">
                  Title <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Brief summary of the issue"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">
                  Description <span className="text-red-600">*</span>
                </Label>
                <textarea
                  id="description"
                  placeholder="Please provide detailed information about the error..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  maxLength={500}
                  className="w-full h-24 px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Affected Building */}
                <div className="space-y-2">
                  <Label htmlFor="building" className="font-semibold">
                    Affected Building
                  </Label>
                  <Input
                    id="building"
                    placeholder="e.g., SEET Building"
                    value={formData.affectedBuilding || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        affectedBuilding: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Contact (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="contact" className="font-semibold">
                    Contact (Optional)
                  </Label>
                  <Input
                    id="contact"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.userContact || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, userContact: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label htmlFor="severity" className="font-semibold">
                  Severity Level
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, severity: level })}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all capitalize font-medium text-sm",
                        formData.severity === level
                          ? level === "low"
                            ? "bg-green-50 border-green-500 text-green-700"
                            : level === "medium"
                            ? "bg-amber-50 border-amber-500 text-amber-700"
                            : "bg-red-50 border-red-500 text-red-700"
                          : "bg-background border-border hover:border-muted-foreground/50"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Location Info */}
              {formData.location && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                  <p className="text-blue-900 font-medium">
                    Reported at coordinates:
                  </p>
                  <p className="text-blue-700 font-mono text-xs">
                    {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <AlertDialogCancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading && <Loader className="h-4 w-4 animate-spin" />}
                  {loading ? "Submitting..." : "Submit Report"}
                </Button>
              </AlertDialogAction>
            </div>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center space-y-2">
                  <AlertDialogTitle>Thank You!</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    Your error report has been submitted successfully. Our team will review it shortly and work to fix the issue.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
