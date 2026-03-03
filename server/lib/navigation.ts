import { NavNode, NavEdge, Graph, RouteStep, RouteResponse } from "../../shared/navigation";
import fs from "fs/promises";
import path from "path";

interface PriorityNode {
  id: string;
  priority: number;
}

export class NavigationService {
  private graph: Graph;
  private nodeCache: Map<string, NavNode> = new Map();

  constructor(graph: Graph) {
    this.graph = graph;
    // Build cache for faster lookups
    graph.nodes.forEach(node => this.nodeCache.set(node.id, node));
  }

  static async load(): Promise<NavigationService> {
    const dataPath = path.join(process.cwd(), "server/data/road_network.json");
    const data = await fs.readFile(dataPath, "utf-8");
    return new NavigationService(JSON.parse(data));
  }

  // Heuristic distance for A* algorithm
  private heuristic(from: NavNode, to: NavNode): number {
    const latDiff = from.lat - to.lat;
    const lngDiff = from.lng - to.lng;
    // Use haversine-like approximation at FUTA's latitude
    const earthRadiusM = 6371000;
    const latRad = (Math.PI / 180) * ((from.lat + to.lat) / 2);
    const lngMetersPerDegree = earthRadiusM * Math.cos(latRad) * (Math.PI / 180);
    const latMetersPerDegree = earthRadiusM * (Math.PI / 180);

    return Math.sqrt(
      Math.pow(latDiff * latMetersPerDegree, 2) +
      Math.pow(lngDiff * lngMetersPerDegree, 2)
    );
  }

  // A* implementation for optimal pathfinding
  private calculateCost(
    distance: number,
    elevationGain: number,
    preferFlat: boolean
  ): number {
    let cost = distance;

    if (preferFlat && elevationGain > 0) {
      // Penalize uphill more heavily when preferring flat routes
      // Formula: base distance + (elevation gain * weight factor)
      const elevationWeight = 15; // Each meter of elevation = 15m of distance penalty
      cost += elevationGain * elevationWeight;
    }

    return cost;
  }

  calculateRoute(startNodeId: string, endNodeId: string, preferFlat: boolean = false): RouteResponse | null {
    const startNode = this.nodeCache.get(startNodeId);
    const endNode = this.nodeCache.get(endNodeId);

    if (!startNode || !endNode) return null;

    const gScore: Record<string, number> = {};
    const fScore: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const openSet = new Set<string>();

    // Initialize scores
    for (const node of this.graph.nodes) {
      gScore[node.id] = Infinity;
      fScore[node.id] = Infinity;
      prev[node.id] = null;
    }

    gScore[startNodeId] = 0;
    fScore[startNodeId] = this.heuristic(startNode, endNode);
    openSet.add(startNodeId);

    while (openSet.size > 0) {
      // Find node with lowest f score
      let current: string | null = null;
      let lowestF = Infinity;

      for (const nodeId of openSet) {
        if (fScore[nodeId] < lowestF) {
          lowestF = fScore[nodeId];
          current = nodeId;
        }
      }

      if (!current) break;

      if (current === endNodeId) {
        // Reconstruct path
        const pathIds: string[] = [];
        let node: string | null = endNodeId;
        while (node !== null) {
          pathIds.unshift(node);
          node = prev[node];
        }

        return this.buildRouteResponse(pathIds);
      }

      openSet.delete(current);
      const neighbors = this.getNeighbors(current);

      for (const { edgeId, neighborId, edge } of neighbors) {
        const tentativeGScore = gScore[current] +
          this.calculateCost(edge.distance, edge.elevation_gain, preferFlat);

        if (tentativeGScore < gScore[neighborId]) {
          prev[neighborId] = current;
          gScore[neighborId] = tentativeGScore;

          const neighborNode = this.nodeCache.get(neighborId)!;
          fScore[neighborId] = gScore[neighborId] + this.heuristic(neighborNode, endNode);

          if (!openSet.has(neighborId)) {
            openSet.add(neighborId);
          }
        }
      }
    }

    return null; // No path found
  }

  private getNeighbors(nodeId: string): Array<{ edgeId: string; neighborId: string; edge: NavEdge }> {
    const neighbors: Array<{ edgeId: string; neighborId: string; edge: NavEdge }> = [];

    this.graph.edges.forEach((edge, idx) => {
      if (edge.from === nodeId) {
        neighbors.push({ edgeId: `${idx}`, neighborId: edge.to, edge });
      } else if (edge.to === nodeId) {
        neighbors.push({ edgeId: `${idx}`, neighborId: edge.from, edge });
      }
    });

    return neighbors;
  }

  private buildRouteResponse(pathIds: string[]): RouteResponse {
    const pathCoords: [number, number][] = pathIds.map(id => {
      const node = this.nodeCache.get(id)!;
      return [node.lng, node.lat];
    });

    const steps: RouteStep[] = [];
    let totalDist = 0;
    let totalElevation = 0;

    for (let i = 0; i < pathIds.length - 1; i++) {
      const fromId = pathIds[i];
      const toId = pathIds[i + 1];

      const edge = this.graph.edges.find(e =>
        (e.from === fromId && e.to === toId) ||
        (e.from === toId && e.to === fromId)
      );

      if (edge) {
        const toNode = this.nodeCache.get(toId)!;
        const instruction = this.generateInstruction(toNode, edge);

        steps.push({
          instruction,
          distance: edge.distance,
          node_id: toId
        });

        totalDist += edge.distance;
        totalElevation += edge.elevation_gain;
      }
    }

    return {
      path: pathCoords,
      steps,
      total_distance: totalDist,
      total_elevation_gain: Math.max(0, totalElevation)
    };
  }

  private generateInstruction(node: NavNode, edge: NavEdge): string {
    let instruction = `Head towards ${node.name || node.id}`;

    if (edge.is_staircase) {
      instruction += " (via stairs)";
    } else if (edge.elevation_gain > 5) {
      instruction += " (steep uphill)";
    } else if (edge.elevation_gain > 0) {
      instruction += " (slight uphill)";
    } else if (edge.elevation_gain < -5) {
      instruction += " (steep downhill)";
    }

    return instruction;
  }

  // Find nearest node to given coordinates
  findNearestNode(lat: number, lng: number): string {
    let nearest: string = this.graph.nodes[0].id;
    let minDist = Infinity;

    for (const node of this.graph.nodes) {
      const d = Math.sqrt(Math.pow(node.lat - lat, 2) + Math.pow(node.lng - lng, 2));
      if (d < minDist) {
        minDist = d;
        nearest = node.id;
      }
    }
    return nearest;
  }
}
