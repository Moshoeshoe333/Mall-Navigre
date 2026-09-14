import type { MallGraph } from "@/domain/navigation/types";

export type CrossFloorSemanticIssue = {
  severity: "error";
  code:
    | "WALK_CROSS_LEVEL"
    | "VERTICAL_MOVEMENT_SAME_LEVEL"
    | "VERTICAL_ENDPOINT_TYPE_MISMATCH";
  message: string;
  entityId: string;
};

export type CrossFloorSemanticReport = {
  valid: boolean;
  issues: CrossFloorSemanticIssue[];
};

const verticalNodeTypeByMovement = {
  stairs: "stairs",
  escalator: "escalator",
  lift: "lift",
} as const;

/**
 * Invariant R2: edge movement semantics must agree with the levels and
 * endpoint node types declared by the mall graph.
 *
 * Walk edges stay on one level. Vertical movement crosses levels. Vertical
 * movement endpoints are represented by the matching transition node type.
 * Availability and accessibility remain separate routing concerns.
 */
export function validateCrossFloorSemantics(
  graph: MallGraph,
): CrossFloorSemanticReport {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const issues: CrossFloorSemanticIssue[] = [];

  for (const edge of graph.edges) {
    const from = nodes.get(edge.fromNodeId);
    const to = nodes.get(edge.toNodeId);

    if (!from || !to) continue;

    const crossesLevel = from.levelId !== to.levelId;

    if (edge.movement === "walk") {
      if (crossesLevel) {
        issues.push({
          severity: "error",
          code: "WALK_CROSS_LEVEL",
          message: `Walk edge ${edge.id} crosses from level ${from.levelId} to ${to.levelId}`,
          entityId: edge.id,
        });
      }
      continue;
    }

    if (!crossesLevel) {
      issues.push({
        severity: "error",
        code: "VERTICAL_MOVEMENT_SAME_LEVEL",
        message: `Vertical edge ${edge.id} (${edge.movement}) stays on level ${from.levelId}`,
        entityId: edge.id,
      });
    }

    const expectedType = verticalNodeTypeByMovement[edge.movement];
    if (from.type !== expectedType || to.type !== expectedType) {
      issues.push({
        severity: "error",
        code: "VERTICAL_ENDPOINT_TYPE_MISMATCH",
        message: `Vertical edge ${edge.id} (${edge.movement}) requires ${expectedType} endpoints`,
        entityId: edge.id,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
