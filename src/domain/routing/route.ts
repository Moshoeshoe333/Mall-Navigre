import type { MallEdge, MallGraph } from "@/domain/navigation/types";

export type RouteResult = { nodeIds: string[]; edgeIds: string[]; distanceMeters: number };

function heuristic(graph: MallGraph, a: string, b: string): number {
  const from = graph.nodes.find((n) => n.id === a);
  const to = graph.nodes.find((n) => n.id === b);
  return from && to ? Math.hypot(from.position.x - to.position.x, from.position.y - to.position.y) : 0;
}

/** Correctness-first A*. Geometry is only a heuristic; edge distance is authoritative. */
export function findRoute(graph: MallGraph, startNodeId: string, targetNodeId: string, accessibleOnly = false): RouteResult | null {
  const active = new Set(graph.nodes.filter((n) => n.status === "active").map((n) => n.id));
  if (!active.has(startNodeId) || !active.has(targetNodeId)) return null;
  if (startNodeId === targetNodeId) return { nodeIds: [startNodeId], edgeIds: [], distanceMeters: 0 };

  const g = new Map<string, number>([[startNodeId, 0]]);
  const f = new Map<string, number>([[startNodeId, heuristic(graph, startNodeId, targetNodeId)]]);
  const open = new Set([startNodeId]);
  const previous = new Map<string, { nodeId: string; edge: MallEdge }>();

  const outgoing = (nodeId: string) => graph.edges.flatMap((edge) => {
    if (edge.status !== "active" || (accessibleOnly && !edge.accessible)) return [];
    if (edge.fromNodeId === nodeId) return [{ next: edge.toNodeId, edge }];
    if (edge.bidirectional && edge.toNodeId === nodeId) return [{ next: edge.fromNodeId, edge }];
    return [];
  }).filter(({ next }) => active.has(next));

  while (open.size) {
    const current = [...open].reduce((best, id) => (f.get(id)! < f.get(best)! ? id : best));
    if (current === targetNodeId) {
      const nodeIds = [current];
      const edgeIds: string[] = [];
      let cursor = current;
      while (previous.has(cursor)) {
        const step = previous.get(cursor)!;
        nodeIds.unshift(step.nodeId);
        edgeIds.unshift(step.edge.id);
        cursor = step.nodeId;
      }
      return { nodeIds, edgeIds, distanceMeters: g.get(targetNodeId)! };
    }
    open.delete(current);
    for (const { next, edge } of outgoing(current)) {
      const candidate = g.get(current)! + edge.distanceMeters;
      if (candidate < (g.get(next) ?? Infinity)) {
        previous.set(next, { nodeId: current, edge });
        g.set(next, candidate);
        f.set(next, candidate + heuristic(graph, next, targetNodeId));
        open.add(next);
      }
    }
  }
  return null;
}
