import type { MallGraph } from "@/domain/navigation/types";
import type { RouteResult } from "@/domain/routing/route";

export type RouteOperationalIssue = {
  severity: "error";
  code:
    | "ROUTE_NODE_MISSING"
    | "ROUTE_NODE_UNAVAILABLE"
    | "ROUTE_EDGE_MISSING"
    | "ROUTE_EDGE_UNAVAILABLE";
  message: string;
  entityId: string;
};

export type RouteOperationalReport = {
  valid: boolean;
  issues: RouteOperationalIssue[];
};

/**
 * R6 invariant: a route is only claimable while every referenced node and edge
 * remains active in the current operational graph.
 */
export function validateRouteOperationalState(
  graph: MallGraph,
  route: RouteResult,
): RouteOperationalReport {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = new Map(graph.edges.map((edge) => [edge.id, edge]));
  const issues: RouteOperationalIssue[] = [];

  for (const nodeId of route.nodeIds) {
    const node = nodes.get(nodeId);
    if (!node) {
      issues.push({
        severity: "error",
        code: "ROUTE_NODE_MISSING",
        message: `Route references missing node ${nodeId}`,
        entityId: nodeId,
      });
    } else if (node.status !== "active") {
      issues.push({
        severity: "error",
        code: "ROUTE_NODE_UNAVAILABLE",
        message: `Route references unavailable node ${nodeId}`,
        entityId: nodeId,
      });
    }
  }

  for (const edgeId of route.edgeIds) {
    const edge = edges.get(edgeId);
    if (!edge) {
      issues.push({
        severity: "error",
        code: "ROUTE_EDGE_MISSING",
        message: `Route references missing edge ${edgeId}`,
        entityId: edgeId,
      });
    } else if (edge.status !== "active") {
      issues.push({
        severity: "error",
        code: "ROUTE_EDGE_UNAVAILABLE",
        message: `Route references unavailable edge ${edgeId}`,
        entityId: edgeId,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
