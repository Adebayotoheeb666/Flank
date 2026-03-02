import { NavNode, NavEdge, Graph, RouteStep, RouteResponse } from "../../shared/navigation";
import fs from "fs/promises";
import path from "path";

export class NavigationService {
  private graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  static async load(): Promise<NavigationService> {
    const dataPath = path.join(process.cwd(), "server/data/road_network.json");
    const data = await fs.readFile(dataPath, "utf-8");
    return new NavigationService(JSON.parse(data));
  }

  // Basic Dijkstra implementation
  calculateRoute(startNodeId: string, endNodeId: string, preferFlat: boolean = false): RouteResponse | null {
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const nodes = new Set<string>();

    for (const node of this.graph.nodes) {
      dist[node.id] = Infinity;
      prev[node.id] = null;
      nodes.add(node.id);
    }

    dist[startNodeId] = 0;

    while (nodes.size > 0) {
      // Find node with minimum distance
      let u: string | null = null;
      for (const nodeId of nodes) {
        if (u === null || dist[nodeId] < dist[u]) {
          u = nodeId;
        }
      }

      if (u === null || dist[u] === Infinity || u === endNodeId) {
        break;
      }

      nodes.delete(u);

      const neighbors = this.graph.edges.filter(e => e.from === u || e.to === u);

      for (const edge of neighbors) {
        const v = edge.from === u ? edge.to : edge.from;
        if (!nodes.has(v)) continue;

        // Hill-awareness weight: add cost for elevation gain if preferFlat is true
        let cost = edge.distance;
        if (preferFlat && edge.elevation_gain > 0) {
          cost += edge.elevation_gain * 10; // Simple heuristic: 1m elevation gain = 10m extra distance cost
        }

        const alt = dist[u] + cost;
        if (alt < dist[v]) {
          dist[v] = alt;
          prev[v] = u;
        }
      }
    }

    // Reconstruct path
    const pathIds: string[] = [];
    let curr: string | null = endNodeId;
    while (curr) {
      pathIds.unshift(curr);
      curr = prev[curr];
    }

    if (pathIds[0] !== startNodeId) return null;

    const pathCoords: [number, number][] = pathIds.map(id => {
      const node = this.graph.nodes.find(n => n.id === id)!;
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
      )!;

      const toNode = this.graph.nodes.find(n => n.id === toId)!;
      
      steps.push({
        instruction: `Head towards ${toNode.name || toId}`,
        distance: edge.distance,
        node_id: toId
      });

      totalDist += edge.distance;
      totalElevation += edge.elevation_gain;
    }

    return {
      path: pathCoords,
      steps,
      total_distance: totalDist,
      total_elevation_gain: totalElevation
    };
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
