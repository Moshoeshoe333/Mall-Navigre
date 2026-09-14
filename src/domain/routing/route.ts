import type { MallEdge, MallGraph } from "@/domain/navigation/types";

export type RouteResult = {
  nodeIds: string[];
  edgeIds: string[];
  distanceMeters: number;
  verified: boolean;
};

/**
 * Derive a conservative geometry-to-distance scale from the graph itself.
 * This keeps the heuristic admissible even when V1 coordinates are schematic.
 */
function geometryScale(graph: MallGraph): number {
  let scale = Infinity;
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const edge of graph.edges) {
    const left = nodes.get(edge.fromNodeId);
    const right = nodes.get(edge.toNodeId);
    if (!left || !right) continue;
    const geometric = Math.hypot(left.position.x - right.position.x, left.position.y - right.position.y);
    if (geometric > 0) scale = Math.min(scale, edge.distanceMeters / geometric);
  }
  return Number.isFinite(scale) ? Math.max(0, scale) : 0;
}

/** Correctness-first A*. Edge distance is authoritative; schematic geometry is only a conservative heuristic. */
export function findRoute(graph: MallGraph, startNodeId: string, targetNodeId: string, accessibleOnly = false): RouteResult | null {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const usable = new Set(
    graph.nodes
      .filter((n) => n.status !== "temporarily_unavailable" && (!accessibleOnly || n.accessible))
      .map((n) => n.id),
  );
  if (!usable.has(startNodeId) || !usable.has(targetNodeId)) return null;
  if (startNodeId === targetNodeId) {
    return { nodeIds: [startNodeId], edgeIds: [], distanceMeters: 0, verified: nodes.get(startNodeId)?.status === "active" };
  }

  const scale = geometryScale(graph);
  const heuristic = (a: string, b: string): number => {
    const from = nodes.get(a);
    const to = nodes.get(b);
    if (!from || !to) return 0;
    return Math.hypot(from.position.x - to.position.x, from.position.y - to.position.y) * scale;
  };

  const outgoing = new Map<string, { next: string; edge: MallEdge }[]>();
  for (const edge of graph.edges) {
    if (edge.status === "temporarily_unavailable" || (accessibleOnly && !edge.accessible)) continue;
    if (!usable.has(edge.fromNodeId) || !usable.has(edge.toNodeId)) continue;
    const forward = outgoing.get(edge.fromNodeId) ?? [];
    forward.push({ next: edge.toNodeId, edge });
    outgoing.set(edge.fromNodeId, forward);
    if (edge.bidirectional) {
      const reverse = outgoing.get(edge.toNodeId) ?? [];
      reverse.push({ next: edge.fromNodeId, edge });
      outgoing.set(edge.toNodeId, reverse);
    }
  }

  const g = new Map<string, number>([[startNodeId, 0]]);
  const f = new Map<string, number>([[startNodeId, heuristic(startNodeId, targetNodeId)]]);
  const open = new Set([startNodeId]);
  const previous = new Map<string, { nodeId: string; edge: MallEdge }>();

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
      const verified = nodeIds.every((id) => nodes.get(id)?.status === "active") &&
        edgeIds.every((id) => graph.edges.find((e) => e.id === id)?.status === "active");
      return { nodeIds, edgeIds, distanceMeters: g.get(targetNodeId)!, verified };
    }
    open.delete(current);
    for (const { next, edge } of outgoing.get(current) ?? []) {
      const candidate = g.get(current)! + edge.distanceMeters;
      if (candidate < (g.get(next) ?? Infinity)) {
        previous.set(next, { nodeId: current, edge });
        g.set(next, candidate);
        f.set(next, candidate + heuristic(next, targetNodeId));
        open.add(next);
      }
    }
  }
  return null;
}
