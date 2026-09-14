import type { MallGraph } from "@/domain/navigation/types";

export type GraphReachabilityIssue = {
  severity: "error";
  code: "ORPHANED_ACTIVE_COMPONENT";
  message: string;
  entityId: string;
};

export type GraphReachabilityReport = {
  valid: boolean;
  issues: GraphReachabilityIssue[];
};

/**
 * Invariant R3: all active navigable nodes must belong to one weakly connected
 * graph component when active edges are treated according to their declared
 * endpoints, but without imposing travel direction.
 *
 * R3 is intentionally topology-only. A one-way edge is therefore considered
 * connected in both directions for component membership. Directional travel,
 * accessibility policy, and temporary availability remain routing concerns.
 * R1/R2 validate the semantic correctness of transitions before R3 is used.
 */
export function validateGraphReachability(
  graph: MallGraph,
): GraphReachabilityReport {
  const activeNodes = graph.nodes.filter((node) => node.status === "active");
  const activeNodeIds = new Set(activeNodes.map((node) => node.id));
  const adjacency = new Map<string, Set<string>>();
  const issues: GraphReachabilityIssue[] = [];

  for (const node of activeNodes) {
    adjacency.set(node.id, new Set());
  }

  for (const edge of graph.edges) {
    if (edge.status !== "active") continue;
    if (!activeNodeIds.has(edge.fromNodeId) || !activeNodeIds.has(edge.toNodeId)) continue;

    adjacency.get(edge.fromNodeId)?.add(edge.toNodeId);
    adjacency.get(edge.toNodeId)?.add(edge.fromNodeId);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const node of activeNodes) {
    if (visited.has(node.id)) continue;

    const component: string[] = [];
    const queue = [node.id];
    visited.add(node.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }

    components.push(component);
  }

  if (components.length > 1) {
    for (const component of components) {
      const representative = component[0];
      issues.push({
        severity: "error",
        code: "ORPHANED_ACTIVE_COMPONENT",
        message: `Active graph component containing ${representative} is disconnected from the other active graph components`,
        entityId: representative,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
