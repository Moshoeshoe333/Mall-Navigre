import type { MallEdge, MallGraph } from "@/domain/navigation/types";

export type RouteOptions = { accessibleOnly?: boolean };
export type RouteResult = { nodeIds: string[]; edges: MallEdge[]; distanceMeters: number } | null;

const key = (a: string, b: string) => `${a}::${b}`;

function heuristic(graph: MallGraph, a: string, b: string): number {
  const na = graph.nodes.find((n) => n.id === a);
  const nb = graph.nodes.find((n) => n.id === b);
  if (!na || !nb) return 0;
  return Math.hypot(na.position.x - nb.position.x, na.position.y - nb.position.y);
}

export function findRoute(graph: MallGraph, startNodeId: string, goalNodeId: string, options: RouteOptions = {}): RouteResult {
  const nodes = new Set(graph.nodes.filter((n) => n.status === "active").map((n) => n.id));
  if (!nodes.has(startNodeId) || !nodes.has(goalNodeId)) return null;
  if (startNodeId === goalNodeId) return { nodeIds: [startNodeId], edges: [], distanceMeters: 0 };

  const open = new Set([startNodeId]);
  const g = new Map<string, number>([[startNodeId, 0]]);
  const f = new Map<string, number>([[startNodeId, heuristic(graph, startNodeId, goalNodeId)]]);
  const cameFrom = new Map<string, { nodeId: string; edge: MallEdge }>();

  const outgoing = (nodeId: string) => graph.edges.flatMap((edge) => {
    if (edge.status !== "active" || (options.accessibleOnly && !edge.accessible)) return [];
    if (edge.fromNodeId === nodeId) return [{ nodeId: edge.toNodeId, edge }];
    if (edge.bidirectional && edge.toNodeId === nodeId) return [{ nodeId: edge.fromNodeId, edge }];
    return [];
  }).filter(({ nodeId }) => nodes.has(nodeId));

  while (open.size) {
    const current = [...open].sort((a, b) => (f.get(a) ?? Infinity) - (f.get(b) ?? Infinity))[0];
    if (current === goalNodeId) {
      const nodeIds = [current];
      const edges: MallEdge[] = [];
      let cursor = current;
      while (cameFrom.has(cursor)) {
        const previous = cameFrom.get(cursor)!;
        edges.unshift(previous.edge);
        cursor = previous.nodeId;
        nodeIds.unshift(cursor);
      }
      return { nodeIds, edges, distanceMeters: edges.reduce((sum, edge) => sum + edge.distanceMeters, 0) };
    }
    open.delete(current);
    for (const { nodeId: neighbor, edge } of outgoing(current)) {
      const tentative = (g.get(current) ?? Infinity) + edge.distanceMeters;
      if (tentative < (g.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, { nodeId: current, edge });
        g.set(neighbor, tentative);
        f.set(neighbor, tentative + heuristic(graph, neighbor, goalNodeId));
        open.add(neighbor);
      }
    }
  }
  return null;
}

export const routeCacheKey = (start: string, goal: string, accessibleOnly = false) => key(start, goal) + (accessibleOnly ? ":accessible" : "");
