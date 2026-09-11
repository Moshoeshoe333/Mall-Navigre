import type { MallGraph, MallNode } from "@/domain/navigation/types";

export type ReachabilityIssue = {
  severity: "error";
  code: "TRANSITION_ENDPOINT_UNREACHABLE";
  message: string;
  entityId: string;
};

export type ReachabilityReport = {
  valid: boolean;
  issues: ReachabilityIssue[];
};

/**
 * Invariant R1: every active vertical transition must terminate at an
 * active, same-level pedestrian component on both sides.
 *
 * This contract is structural. Accessibility preferences and live
 * availability remain routing-policy concerns. Unavailable transitions are
 * not candidates for R1 validation.
 */
export function validateTransitionEndpointReachability(
  graph: MallGraph,
): ReachabilityReport {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const issues: ReachabilityIssue[] = [];
  const walkAdjacency = new Map<string, Set<string>>();

  for (const node of graph.nodes) {
    if (node.status === "active") walkAdjacency.set(node.id, new Set());
  }

  for (const edge of graph.edges) {
    if (edge.status !== "active" || edge.movement !== "walk") continue;
    const from = nodes.get(edge.fromNodeId);
    const to = nodes.get(edge.toNodeId);
    if (!from || !to || from.status !== "active" || to.status !== "active") continue;
    if (from.levelId !== to.levelId) continue;
    walkAdjacency.get(from.id)?.add(to.id);
    if (edge.bidirectional) walkAdjacency.get(to.id)?.add(from.id);
  }

  const componentFor = (start: MallNode): Set<string> => {
    const seen = new Set<string>([start.id]);
    const queue = [start.id];
    while (queue.length) {
      const current = queue.shift()!;
      for (const next of walkAdjacency.get(current) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return seen;
  };

  for (const edge of graph.edges) {
    if (edge.status !== "active" || edge.movement === "walk") continue;
    const from = nodes.get(edge.fromNodeId);
    const to = nodes.get(edge.toNodeId);
    if (!from || !to || from.status !== "active" || to.status !== "active") continue;
    if (from.levelId === to.levelId) continue;

    for (const endpoint of [from, to]) {
      if (componentFor(endpoint).size <= 1) {
        issues.push({
          severity: "error",
          code: "TRANSITION_ENDPOINT_UNREACHABLE",
          message: `Vertical transition endpoint ${endpoint.id} has no active same-level pedestrian connection`,
          entityId: edge.id,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
