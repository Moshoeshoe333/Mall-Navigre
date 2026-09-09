import type { MallEdge, MallGraph } from "@/domain/navigation/types";

export type RouteResult = {
  nodeIds: string[];
  edgeIds: string[];
  distanceMeters: number;
};

/** V1 correctness-first Dijkstra. Upgrade only after measured graph performance requires it. */
export function findRoute(graph: MallGraph, startNodeId: string, targetNodeId: string, accessibleOnly = false): RouteResult | null {
  if (startNodeId === targetNodeId) return { nodeIds: [startNodeId], edgeIds: [], distanceMeters: 0 };

  const nodes = new Set(graph.nodes.filter((n) => n.status !== "temporarily_unavailable").map((n) => n.id));
  if (!nodes.has(startNodeId) || !nodes.has(targetNodeId)) return null;

  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edge: MallEdge }>();
  const unvisited = new Set(nodes);
  for (const nodeId of nodes) distances.set(nodeId, Number.POSITIVE_INFINITY);
  distances.set(startNodeId, 0);

  const outgoing = (nodeId: string) => graph.edges.filter((edge) => {
    if (edge.status === "temporarily_unavailable") return false;
    if (accessibleOnly && !edge.accessible) return false;
    if (edge.fromNodeId === nodeId) return true;
    return edge.bidirectional && edge.toNodeId === nodeId;
  });

  while (unvisited.size) {
    let current: string | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const id of unvisited) {
      const distance = distances.get(id) ?? Number.POSITIVE_INFINITY;
      if (distance < best) { best = distance; current = id; }
    }
    if (!current || best === Number.POSITIVE_INFINITY) break;
    unvisited.delete(current);
    if (current === targetNodeId) break;

    for (const edge of outgoing(current)) {
      const next = edge.fromNodeId === current ? edge.toNodeId : edge.fromNodeId;
      if (!unvisited.has(next)) continue;
      const candidate = best + edge.distanceMeters;
      if (candidate < (distances.get(next) ?? Number.POSITIVE_INFINITY)) {
        distances.set(next, candidate);
        previous.set(next, { nodeId: current, edge });
      }
    }
  }

  if (!previous.has(targetNodeId)) return null;
  const nodeIds = [targetNodeId];
  const edgeIds: string[] = [];
  let cursor = targetNodeId;
  while (cursor !== startNodeId) {
    const step = previous.get(cursor);
    if (!step) return null;
    edgeIds.unshift(step.edge.id);
    nodeIds.unshift(step.nodeId);
    cursor = step.nodeId;
  }
  return { nodeIds, edgeIds, distanceMeters: distances.get(targetNodeId) ?? 0 };
}
