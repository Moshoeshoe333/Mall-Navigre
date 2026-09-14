import type { MallGraph, MallNode } from "@/domain/navigation/types";

export type AccessibilityConsistencyIssue = {
  severity: "error";
  code:
    | "ACCESSIBLE_EDGE_INACCESSIBLE_FROM_NODE"
    | "ACCESSIBLE_EDGE_INACCESSIBLE_TO_NODE"
    | "ACCESSIBLE_EDGE_ENDPOINT_MISSING";
  message: string;
  entityId: string;
};

export type AccessibilityConsistencyReport = {
  valid: boolean;
  issues: AccessibilityConsistencyIssue[];
};

/**
 * Invariant R5: active accessible edges may only connect active accessible
 * nodes. Accessibility remains a declaration-level policy, not a physical
 * accessibility certification.
 */
export function validateAccessibilityConsistency(
  graph: MallGraph,
): AccessibilityConsistencyReport {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const issues: AccessibilityConsistencyIssue[] = [];

  for (const edge of graph.edges) {
    if (edge.status !== "active" || !edge.accessible) continue;

    const from = nodes.get(edge.fromNodeId);
    const to = nodes.get(edge.toNodeId);

    if (!from || !to) {
      issues.push({
        severity: "error",
        code: "ACCESSIBLE_EDGE_ENDPOINT_MISSING",
        message: `Accessible edge ${edge.id} references a missing endpoint`,
        entityId: edge.id,
      });
      continue;
    }

    if (from.status !== "active" || to.status !== "active") continue;

    if (!from.accessible) {
      issues.push({
        severity: "error",
        code: "ACCESSIBLE_EDGE_INACCESSIBLE_FROM_NODE",
        message: `Accessible edge ${edge.id} starts at inaccessible node ${from.id}`,
        entityId: edge.id,
      });
    }

    if (!to.accessible) {
      issues.push({
        severity: "error",
        code: "ACCESSIBLE_EDGE_INACCESSIBLE_TO_NODE",
        message: `Accessible edge ${edge.id} terminates at inaccessible node ${to.id}`,
        entityId: edge.id,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
