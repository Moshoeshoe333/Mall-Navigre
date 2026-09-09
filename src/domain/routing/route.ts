import type { MallEdge, MallGraph } from "@/domain/navigation/types";

export type RouteResult = {
  nodeIds: string[];
  edgeIds: string[];
  distanceMeters: number;
  verified: boolean;
};

function heuristic(graph: MallGraph, a: string, b: string): number {
  const from = graph.nodes.find((n) => n.id === a);
  const to = graph.nodes.find((n) => n.id === b);
  return from && to ? Math.hypot(from.position.x - to.position.x, from.position.y - to.position.y) : 0;
}

/** Correctness-first A*. Edge distance is authoritative; geometry is only a heuristic. */
export function findRoute(graph: MallGraph, startNodeId: string, targetNodeId: string, accessibleOnly = false): RouteResult | null {
  const usable = new Set(graph.nodes.filter((n) => n.status !== "temporarily_unavailable").map((n) => n.id));
  if (!usable.has(startNodeId) || !usable.has(targetNodeId)) return null;
  if (startNodeId === targetNodeId) return { nodeIds: [startNodeId], edgeIds: [], distanceMeters: 0, verified: graph.nodes.find((n) => n.id === startNodeId)?.status === "active" };

  const g = new Map<string, number>([[startNodeId, 0]]);
  const f = new Map<string, number>([[startNodeId, heuristic(graph, startNodeId, targetNodeId)]]);
  const open = new Set([startNodeId]);
  const previous = new Map<string, { nodeId: string; edge: MallEdge }>();

  const outgoing = (nodeId: string) => graph.edges.flatMap((edge) => {
    if (edge.status === "temporarily_unavailable" || (accessibleOnly && !edge.accessible)) return [];
    if (edge.fromNodeId === nodeId) return [{ next: edge.toNodeId, edge }];
    if (edge.bidirectional && edge.toNodeId === nodeId) return [{ next: edge.fromNodeId, edge }];
    return [];
  }).filter(({ next }) => usable.has(next));

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
      const verified = nodeIds.every((id) => graph.nodes.find((n) => n.id === id)?.status === "active") &&
        edgeIds.every((id) => graph.edges.find((e) => e.id === id)?.status === "active");
      return { nodeIds, edgeIds, distanceMeters: g.get(targetNodeId)!, verified };
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
