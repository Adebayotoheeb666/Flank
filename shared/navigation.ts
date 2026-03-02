export interface NavNode {
  id: string;
  name?: string;
  lat: number;
  lng: number;
  type: 'intersection' | 'building' | 'landmark';
}

export interface NavEdge {
  from: string;
  to: string;
  distance: number; // in meters
  elevation_gain: number; // in meters (positive for uphill)
  is_staircase?: boolean;
}

export interface Graph {
  nodes: NavNode[];
  edges: NavEdge[];
}

export interface RouteRequest {
  start_lat: number;
  start_lng: number;
  end_location_id: string;
  prefer_flat?: boolean;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  node_id: string;
}

export interface RouteResponse {
  path: [number, number][]; // coordinates [lng, lat]
  steps: RouteStep[];
  total_distance: number;
  total_elevation_gain: number;
}
