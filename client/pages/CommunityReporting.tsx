import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAnalytics, trackNavigation } from "@/hooks/use-analytics";
import {
  AlertTriangle, Send, MapPin, Clock, CheckCircle, AlertCircle,
  TrendingUp, Users, ArrowLeft, Filter, Search, Loader
} from "lucide-react";
import { Link } from "react-router-dom";
import { MapErrorReport } from "@shared/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ReportType = "incorrect_location" | "missing_building" | "outdated_info" | "navigation_issue" | "other";
type Severity = "low" | "medium" | "high";
type Status = "reported" | "reviewed" | "resolved" | "dismissed";

export default function CommunityReportingPage() {
  useAnalytics("community_reporting");
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"submit" | "view">("submit");
  const [reports, setReports] = useState<MapErrorReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");

  const [formData, setFormData] = useState({
    type: "incorrect_location" as ReportType,
    title: "",
    description: "",
    affectedBuilding: "",
    severity: "medium" as Severity,
    userContact: "",
  });

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/error-reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "view") {
      fetchReports();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/error-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          location: { lat: 7.3000, lng: 5.1300 }, // Default FUTA center
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your report has been submitted. Thank you for helping us improve!",
        });

        // Track the report submission
        trackNavigation("community", "error_report", "form_submission", 0);

        // Reset form
        setFormData({
          type: "incorrect_location",
          title: "",
          description: "",
          affectedBuilding: "",
          severity: "medium",
          userContact: "",
        });

        // Switch to view tab
        setTimeout(() => {
          setActiveTab("view");
          fetchReports();
        }, 1500);
      } else {
        throw new Error("Failed to submit report");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.affectedBuilding?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || report.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getStatusColor = (status?: Status) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-700";
      case "reviewed":
        return "bg-blue-100 text-blue-700";
      case "dismissed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-12 px-4">
          <div className="container space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8" />
              <h1 className="text-4xl font-extrabold">Community Reporting</h1>
            </div>
            <p className="text-orange-100 text-lg max-w-2xl">
              Help us improve the FUTA Pathfinder by reporting map errors, missing buildings, or navigation issues.
              Your feedback is crucial!
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container py-8">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab("submit")}
              className={cn(
                "px-4 py-3 font-medium transition-colors border-b-2 -mb-px",
                activeTab === "submit"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:border-border"
              )}
            >
              <Send className="h-4 w-4 inline mr-2" />
              Report Issue
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={cn(
                "px-4 py-3 font-medium transition-colors border-b-2 -mb-px",
                activeTab === "view"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:border-border"
              )}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              View Reports
            </button>
          </div>
        </div>

        <div className="container py-12 space-y-8">
          {/* Submit Report Tab */}
          {activeTab === "submit" && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Report Type */}
                  <div className="space-y-3">
                    <label className="font-semibold">Issue Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as ReportType })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                    >
                      <option value="incorrect_location">Incorrect Location</option>
                      <option value="missing_building">Missing Building</option>
                      <option value="outdated_info">Outdated Information</option>
                      <option value="navigation_issue">Navigation Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div className="space-y-3">
                    <label className="font-semibold">Title *</label>
                    <Input
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <label className="font-semibold">Description *</label>
                    <textarea
                      placeholder="Detailed explanation of the problem and how it affects navigation"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Affected Building */}
                  <div className="space-y-3">
                    <label className="font-semibold">Affected Building (optional)</label>
                    <Input
                      placeholder="e.g., SEET Building, Library, Senate"
                      value={formData.affectedBuilding}
                      onChange={(e) => setFormData({ ...formData, affectedBuilding: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>

                  {/* Severity */}
                  <div className="space-y-3">
                    <label className="font-semibold">Severity Level</label>
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as Severity[]).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setFormData({ ...formData, severity: sev })}
                          className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-all capitalize",
                            formData.severity === sev
                              ? getSeverityColor(sev) + " ring-2 ring-offset-2"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-3">
                    <label className="font-semibold">Contact (optional)</label>
                    <Input
                      placeholder="Email or phone for follow-up"
                      type="email"
                      value={formData.userContact}
                      onChange={(e) => setFormData({ ...formData, userContact: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-lg font-bold gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </form>
              </Card>

              {/* Tips */}
              <Card className="p-6 bg-blue-50 border-blue-200 mt-6 space-y-3">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-900">Tips for Better Reports</p>
                    <ul className="text-sm text-blue-700 space-y-1 mt-2">
                      <li>• Be specific about the location or building affected</li>
                      <li>• Include step-by-step instructions to reproduce the issue</li>
                      <li>• Mention what device/browser you're using if relevant</li>
                      <li>• Provide your contact info so we can follow up if needed</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* View Reports Tab */}
          {activeTab === "view" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-3xl font-bold">{reports.length}</p>
                </Card>
                <Card className="p-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {reports.filter((r) => r.status === "resolved").length}
                  </p>
                </Card>
                <Card className="p-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {reports.filter((r) => r.status === "reported").length}
                  </p>
                </Card>
              </div>

              {/* Filters */}
              <Card className="p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(["all", "low", "medium", "high"] as const).map((sev) => (
                      <Button
                        key={sev}
                        variant={filterSeverity === sev ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterSeverity(sev)}
                        className="rounded-lg capitalize"
                      >
                        {sev}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Reports List */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredReports.length === 0 ? (
                <Card className="p-12 text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground text-lg">No reports found</p>
                  <p className="text-sm text-muted-foreground">
                    Be the first to report an issue and help us improve!
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((report) => (
                    <Card key={report.id} className="p-6 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{report.title}</h3>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={getSeverityColor(report.severity)}>
                              {report.severity}
                            </Badge>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status || "reported"}
                            </Badge>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {report.affectedBuilding && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {report.affectedBuilding}
                            </div>
                          )}
                          {report.createdAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Resolution */}
                        {report.status === "resolved" && report.resolution && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <p className="font-semibold text-green-900">Resolution</p>
                            </div>
                            <p className="text-sm text-green-700">{report.resolution}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
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
              Thank you for helping improve FUTA Pathfinder
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
