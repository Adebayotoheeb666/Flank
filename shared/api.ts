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
