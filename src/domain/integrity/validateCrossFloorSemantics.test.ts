import { describe, expect, it } from "vitest";

import {
  validateCrossFloorSemantics,
} from "@/domain/integrity/validateCrossFloorSemantics";
import type { MallGraph } from "@/domain/navigation/types";

function makeGraph(overrides: Partial<MallGraph> = {}): MallGraph {
  return {
    mallId: "synthetic-mall",
    levels: [
      { id: "l1", mallId: "synthetic-mall", name: "Level 1", order: 1 },
      { id: "l2", mallId: "synthetic-mall", name: "Level 2", order: 2 },
    ],
    nodes: [
      { id: "l1-corridor", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "corridor", name: "L1 Corridor", position: { x: 0, y: 0 }, accessible: true, status: "active" },
      { id: "l1-lift", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "lift", name: "L1 Lift", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "l2-lift", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "lift", name: "L2 Lift", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "l2-corridor", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "corridor", name: "L2 Corridor", position: { x: 20, y: 0 }, accessible: true, status: "active" },
    ],
    edges: [
      { id: "walk-l1", fromNodeId: "l1-corridor", toNodeId: "l1-lift", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      { id: "lift-l1-l2", fromNodeId: "l1-lift", toNodeId: "l2-lift", distanceMeters: 4, accessible: true, movement: "lift", bidirectional: true, status: "active" },
      { id: "walk-l2", fromNodeId: "l2-lift", toNodeId: "l2-corridor", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
    ],
    places: [],
    ...overrides,
  };
}

describe("Invariant R2: cross-floor semantic integrity", () => {
  it("accepts same-level walk edges and cross-floor lift edges with matching endpoints", () => {
    const report = validateCrossFloorSemantics(makeGraph());

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("rejects a walk edge that crosses levels", () => {
    const graph = makeGraph({
      edges: [
        { id: "walk-cross-level", fromNodeId: "l1-corridor", toNodeId: "l2-corridor", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    expect(validateCrossFloorSemantics(graph).issues).toContainEqual({
      severity: "error",
      code: "WALK_CROSS_LEVEL",
      message: "Walk edge walk-cross-level crosses from level l1 to l2",
      entityId: "walk-cross-level",
    });
  });

  it("rejects vertical movement that stays on one level", () => {
    const graph = makeGraph({
      nodes: [
        ...makeGraph().nodes,
        { id: "l1-lift-b", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "lift", name: "L1 Lift B", position: { x: 20, y: 0 }, accessible: true, status: "active" },
      ],
      edges: [
        { id: "same-level-lift", fromNodeId: "l1-lift", toNodeId: "l1-lift-b", distanceMeters: 4, accessible: true, movement: "lift", bidirectional: true, status: "active" },
      ],
    });

    expect(validateCrossFloorSemantics(graph).issues).toContainEqual({
      severity: "error",
      code: "VERTICAL_MOVEMENT_SAME_LEVEL",
      message: "Vertical edge same-level-lift (lift) stays on level l1",
      entityId: "same-level-lift",
    });
  });

  it("rejects vertical movement whose endpoints do not match the declared transition type", () => {
    const graph = makeGraph({
      edges: [
        { id: "bad-stairs", fromNodeId: "l1-corridor", toNodeId: "l2-corridor", distanceMeters: 5, accessible: true, movement: "stairs", bidirectional: true, status: "active" },
      ],
    });

    const report = validateCrossFloorSemantics(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "VERTICAL_ENDPOINT_TYPE_MISMATCH",
      message: "Vertical edge bad-stairs (stairs) requires stairs endpoints",
      entityId: "bad-stairs",
    });
  });

  it("keeps availability and accessibility outside R2 semantic validation", () => {
    const graph = makeGraph({
      edges: [
        { id: "lift-l1-l2", fromNodeId: "l1-lift", toNodeId: "l2-lift", distanceMeters: 4, accessible: false, movement: "lift", bidirectional: true, status: "temporarily_unavailable" },
      ],
    });

    expect(validateCrossFloorSemantics(graph).valid).toBe(true);
  });
});
