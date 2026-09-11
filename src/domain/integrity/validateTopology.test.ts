import { describe, expect, it } from "vitest";

import { mallOfAfricaGraph } from "@/data/malls/mall-of-africa/graph";
import { validateMallTopology } from "@/domain/integrity/validateTopology";

describe("Gate 1 topology reconciliation", () => {
  it("accepts the current schematic seed topology", () => {
    const report = validateMallTopology(mallOfAfricaGraph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("rejects a walking edge that crosses levels", () => {
    const graph = {
      ...mallOfAfricaGraph,
      levels: [
        ...mallOfAfricaGraph.levels,
        { id: "mofa-parking-3", mallId: "mall-of-africa", name: "Parking Level 3", order: 3 },
      ],
      nodes: [
        ...mallOfAfricaGraph.nodes,
        { ...mallOfAfricaGraph.nodes[1], id: "p3-corridor", levelId: "mofa-parking-3" },
      ],
      edges: [
        ...mallOfAfricaGraph.edges,
        {
          id: "e-invalid-cross-level-walk",
          fromNodeId: "p4-corridor-a",
          toNodeId: "p3-corridor",
          distanceMeters: 10,
          accessible: true,
          movement: "walk" as const,
          bidirectional: true,
          status: "active" as const,
        },
      ],
    };

    const report = validateMallTopology(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "WALK_CROSS_LEVEL",
      message: "Walking edge e-invalid-cross-level-walk crosses levels mofa-parking-4 → mofa-parking-3",
      entityId: "e-invalid-cross-level-walk",
    });
  });

  it("rejects vertical movement that remains on one level", () => {
    const graph = {
      ...mallOfAfricaGraph,
      edges: [
        ...mallOfAfricaGraph.edges,
        {
          id: "e-invalid-same-level-lift",
          fromNodeId: "p4-corridor-a",
          toNodeId: "p4-lift",
          distanceMeters: 8,
          accessible: true,
          movement: "lift" as const,
          bidirectional: true,
          status: "active" as const,
        },
      ],
    };

    const report = validateMallTopology(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "VERTICAL_MOVEMENT_SAME_LEVEL",
      message: "Vertical movement edge e-invalid-same-level-lift stays on level mofa-parking-4",
      entityId: "e-invalid-same-level-lift",
    });
  });
});
