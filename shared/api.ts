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
