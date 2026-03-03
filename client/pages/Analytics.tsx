import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Users, MapPin, Search, Clock, Activity,
  RefreshCw, ArrowLeft, Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnalyticsDashboard, DestinationAnalytics } from "@shared/api";
import { cn } from "@/lib/utils";

const COLORS = {
  high: "#10b981",
  medium: "#f59e0b",
  low: "#ef4444"
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch("/api/analytics/dashboard");
      const analyticsData: AnalyticsDashboard = await response.json();
      setData(analyticsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchAnalytics(true), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center space-y-4">
          <Activity className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="container py-12 text-center space-y-4">
          <p className="text-muted-foreground">Failed to load analytics data</p>
          <Button onClick={() => fetchAnalytics()}>Retry</Button>
        </div>
      </Layout>
    );
  }

  const destinationChartData = data.mostVisitedDestinations.map(d => ({
    name: d.buildingName,
    visits: d.visitCount,
    navigations: d.navigationCount
  }));

  const searchChartData = data.topSearchQueries.map(q => ({
    name: q.query,
    searches: q.count
  }));

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
          <div className="container space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <h1 className="text-3xl font-extrabold">Analytics Dashboard</h1>
              </div>
              <Button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                variant="secondary"
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                {refreshing ? "Updating..." : "Refresh"}
              </Button>
            </div>
            {lastUpdated && (
              <p className="text-blue-100 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-12 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 space-y-3 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Page Views</p>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">{data.totalPageViews}</p>
              <p className="text-xs text-muted-foreground">Tracked across all pages</p>
            </Card>

            <Card className="p-6 space-y-3 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Navigations</p>
                <MapPin className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">{data.totalNavigations}</p>
              <p className="text-xs text-muted-foreground">User-initiated routes</p>
            </Card>

            <Card className="p-6 space-y-3 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Avg Session Duration</p>
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold">{data.averageSessionDuration}s</p>
              <p className="text-xs text-muted-foreground">Per page visit</p>
            </Card>

            <Card className="p-6 space-y-3 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold">{data.uniqueVisitors}</p>
              <p className="text-xs text-muted-foreground">Estimated users</p>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Most Visited Destinations */}
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Most Visited Destinations
              </h2>
              {destinationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={destinationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visits" fill="#3b82f6" name="Page Visits" />
                    <Bar dataKey="navigations" fill="#8b5cf6" name="Navigations" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No navigation data yet</p>
              )}
            </Card>

            {/* Top Search Queries */}
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Top Search Queries
              </h2>
              {searchChartData.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {searchChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.searches} searches</p>
                      </div>
                      <div className="bg-primary/10 px-3 py-1 rounded text-sm font-bold text-primary">
                        {item.searches}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No search data yet</p>
              )}
            </Card>
          </div>

          {/* Destination Popularity Table */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Destination Popularity Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-bold">Building Name</th>
                    <th className="text-center py-3 px-4 font-bold">Page Visits</th>
                    <th className="text-center py-3 px-4 font-bold">Navigations</th>
                    <th className="text-center py-3 px-4 font-bold">Total Interactions</th>
                    <th className="text-center py-3 px-4 font-bold">Popularity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mostVisitedDestinations.map((dest, idx) => {
                    const totalInteractions = dest.visitCount + dest.navigationCount;
                    return (
                      <tr key={idx} className="border-b hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-medium">{dest.buildingName}</td>
                        <td className="text-center py-3 px-4">{dest.visitCount}</td>
                        <td className="text-center py-3 px-4">{dest.navigationCount}</td>
                        <td className="text-center py-3 px-4 font-bold">{totalInteractions}</td>
                        <td className="text-center py-3 px-4">
                          <Badge
                            className={cn(
                              dest.popularity === "high"
                                ? "bg-green-100 text-green-700"
                                : dest.popularity === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {dest.popularity}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-8 border-t">
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Analytics data refreshes every 30 seconds</p>
              <p>Data is stored locally for demonstration purposes</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
