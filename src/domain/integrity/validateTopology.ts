import type { MallGraph } from "@/domain/navigation/types";

export type TopologyIssue = {
  severity: "error" | "warning";
  code: "WALK_CROSS_LEVEL" | "VERTICAL_MOVEMENT_SAME_LEVEL";
  message: string;
  entityId: string;
};

export type TopologyReport = {
  valid: boolean;
  issues: TopologyIssue[];
};

/**
 * Validate topology semantics independently from physical/survey truth.
 *
 * This does not claim that coordinates or distances are physically accurate.
 * It only rejects movement relationships that contradict the level model:
 * - walking cannot directly connect nodes on different levels;
 * - stairs/escalators/lifts must connect different levels.
 */
export function validateMallTopology(graph: MallGraph): TopologyReport {
  const issues: TopologyIssue[] = [];
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));

  for (const edge of graph.edges) {
    const from = nodes.get(edge.fromNodeId);
    const to = nodes.get(edge.toNodeId);
    if (!from || !to) continue;

    const crossesLevel = from.levelId !== to.levelId;
    const isVerticalMovement = edge.movement !== "walk";

    if (edge.movement === "walk" && crossesLevel) {
      issues.push({
        severity: "error",
        code: "WALK_CROSS_LEVEL",
        message: `Walking edge ${edge.id} crosses levels ${from.levelId} → ${to.levelId}`,
        entityId: edge.id,
      });
    }

    if (isVerticalMovement && !crossesLevel) {
      issues.push({
        severity: "error",
        code: "VERTICAL_MOVEMENT_SAME_LEVEL",
        message: `Vertical movement edge ${edge.id} stays on level ${from.levelId}`,
        entityId: edge.id,
      });
    }
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}
