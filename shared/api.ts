/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
    x?: number; // For the 2D mock map
    y?: number; // For the 2D mock map
  };
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  locations: Location[];
}

// Phase 3: Timetable & Reminder System
export interface Course {
  id: string;
  code: string;
  name: string;
  venue: string;
  time: string;
  day: string;
  duration: number;
  notificationTime: number;
  studentId?: string;
}

export interface CourseResponse {
  courses: Course[];
}

export interface RouteReminderRequest {
  courseId: string;
  studentId: string;
}

export interface RouteReminderResponse {
  courseId: string;
  estimatedTravelTime: number;
  distanceMeters: number;
  shouldLeaveNow: boolean;
  nextClass?: Course;
}

// Phase 3: Emergency SOS System
export type SOSType = "medical" | "fire" | "security";

export interface SOSTriggerRequest {
  sosType: SOSType;
  latitude: number;
  longitude: number;
  userId: string;
}

export interface SOSResponse {
  sosId: string;
  status: "active" | "resolved" | "cancelled";
  responders: {
    id: string;
    name: string;
    type: string;
    eta: number; // in seconds
  }[];
  createdAt: string;
  lastLocationUpdate: string;
}

export interface LocationShareUpdate {
  sosId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface FreshersGuideStep {
  id: number;
  instruction: string;
  landmark: string;
  action: string;
  distance: string;
  tips: string[];
}

// Phase 4: Offline Resilience
export interface CachedLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationTrajectory {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface ProximityAlert {
  id: string;
  targetLat: number;
  targetLng: number;
  radiusMeters: number;
  reached: boolean;
}

export interface PWACacheInfo {
  name: string;
  count: number;
}

export interface StorageQuota {
  quota: number;
  usage: number;
  percentage: number;
}

// Phase 6: Community Error Reporting
export interface MapErrorReport {
  id?: string;
  type: "incorrect_location" | "missing_building" | "outdated_info" | "navigation_issue" | "other";
  title: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
  };
  affectedBuilding?: string;
  userContact?: string;
  severity: "low" | "medium" | "high";
  status?: "reported" | "reviewed" | "resolved" | "dismissed";
  createdAt?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface MapErrorReportResponse {
  reportId: string;
  status: "submitted" | "error";
  message: string;
}

export interface ErrorReportListResponse {
  reports: MapErrorReport[];
  total: number;
  resolved: number;
}

// Phase 6: Analytics Tracking
export interface PageViewEvent {
  id?: string;
  page: string;
  timestamp?: string;
  duration?: number;
  visitorId: string;
}

export interface NavigationEvent {
  id?: string;
  from: string;
  to: string;
  timestamp?: string;
  distanceMeters?: number;
  duration?: number;
  visitorId: string;
  method: "user_search" | "map_click" | "recommendation" | "route_reminder" | "emergency_sos" | "form_submission";
}

export interface SearchEvent {
  query: string;
  timestamp?: string;
  visitorId: string;
}

export interface DestinationAnalytics {
  buildingId: string;
  buildingName: string;
  visitCount: number;
  navigationCount: number;
  averageTimeSpent?: number;
  popularity: "high" | "medium" | "low";
}

export interface AnalyticsDashboard {
  totalPageViews: number;
  totalNavigations: number;
  mostVisitedDestinations: DestinationAnalytics[];
  averageSessionDuration: number;
  uniqueVisitors: number;
  topSearchQueries: { query: string; count: number }[];
}
