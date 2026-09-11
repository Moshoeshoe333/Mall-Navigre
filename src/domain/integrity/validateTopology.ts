import type { MallGraph } from "@/domain/navigation/types";

export type TopologyIssue = {
  severity: "error" | "warning";
  code: "WALK_CROSS_LEVEL" | "VERTICAL_MOVEMENT_SAME_LEVEL" | "LEVEL_TRANSITION_DISCONNECTED";
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
 * - stairs/escalators/lifts must connect different levels;
 * - when active nodes exist on multiple declared levels, those levels must
 *   be connected by usable vertical movement.
 */
export function validateMallTopology(graph: MallGraph): TopologyReport {
  const issues: TopologyIssue[] = [];
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const activeLevels = new Set(
    graph.nodes
      .filter((node) => node.status === "active")
      .map((node) => node.levelId),
  );

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

  if (activeLevels.size > 1) {
    const levelAdjacency = new Map<string, Set<string>>(
      [...activeLevels].map((levelId) => [levelId, new Set<string>()]),
    );

    for (const edge of graph.edges) {
      if (edge.status === "temporarily_unavailable" || edge.movement === "walk") continue;
      const from = nodes.get(edge.fromNodeId);
      const to = nodes.get(edge.toNodeId);
      if (!from || !to || from.levelId === to.levelId) continue;
      if (!activeLevels.has(from.levelId) || !activeLevels.has(to.levelId)) continue;

      levelAdjacency.get(from.levelId)?.add(to.levelId);
      if (edge.bidirectional) levelAdjacency.get(to.levelId)?.add(from.levelId);
    }

    const [root] = activeLevels;
    const reachable = new Set<string>([root]);
    const queue = [root];
    while (queue.length) {
      const current = queue.shift()!;
      for (const next of levelAdjacency.get(current) ?? []) {
        if (!reachable.has(next)) {
          reachable.add(next);
          queue.push(next);
        }
      }
    }

    for (const levelId of activeLevels) {
      if (!reachable.has(levelId)) {
        issues.push({
          severity: "error",
          code: "LEVEL_TRANSITION_DISCONNECTED",
          message: `Active level ${levelId} has no usable vertical transition to the active level network`,
          entityId: levelId,
        });
      }
    }
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}
