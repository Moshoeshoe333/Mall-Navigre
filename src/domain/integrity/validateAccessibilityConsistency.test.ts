import { describe, expect, it } from "vitest";

import { validateAccessibilityConsistency } from "@/domain/integrity/validateAccessibilityConsistency";
import type { MallGraph } from "@/domain/navigation/types";

function makeGraph(overrides: Partial<MallGraph> = {}): MallGraph {
  return {
    mallId: "synthetic-mall",
    levels: [{ id: "l1", mallId: "synthetic-mall", name: "Level 1", order: 1 }],
    nodes: [
      { id: "entrance", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "entrance", name: "Entrance", position: { x: 0, y: 0 }, accessible: true, status: "active" },
      { id: "corridor", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "corridor", name: "Corridor", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "stairs", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "stairs", name: "Stairs", position: { x: 20, y: 0 }, accessible: false, status: "active" },
    ],
    edges: [
      { id: "e1", fromNodeId: "entrance", toNodeId: "corridor", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      { id: "stairs-edge", fromNodeId: "corridor", toNodeId: "stairs", distanceMeters: 10, accessible: false, movement: "stairs", bidirectional: true, status: "active" },
    ],
    places: [],
    ...overrides,
  };
}

describe("Invariant R5: accessibility consistency", () => {
  it("accepts an accessible edge between accessible nodes", () => {
    const report = validateAccessibilityConsistency(makeGraph());

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("rejects an accessible edge that starts at an inaccessible node", () => {
    const graph = makeGraph({
      edges: [
        { id: "bad-edge", fromNodeId: "stairs", toNodeId: "corridor", distanceMeters: 10, accessible: true, movement: "stairs", bidirectional: true, status: "active" },
      ],
    });

    const report = validateAccessibilityConsistency(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "ACCESSIBLE_EDGE_INACCESSIBLE_FROM_NODE",
      message: "Accessible edge bad-edge starts at inaccessible node stairs",
      entityId: "bad-edge",
    });
  });

  it("rejects an accessible edge that terminates at an inaccessible node", () => {
    const graph = makeGraph({
      edges: [
        { id: "bad-edge", fromNodeId: "corridor", toNodeId: "stairs", distanceMeters: 10, accessible: true, movement: "stairs", bidirectional: true, status: "active" },
      ],
    });

    const report = validateAccessibilityConsistency(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "ACCESSIBLE_EDGE_INACCESSIBLE_TO_NODE",
      message: "Accessible edge bad-edge terminates at inaccessible node stairs",
      entityId: "bad-edge",
    });
  });

  it("accepts an inaccessible edge between accessible nodes", () => {
    const graph = makeGraph({
      edges: [
        { id: "barrier", fromNodeId: "entrance", toNodeId: "corridor", distanceMeters: 10, accessible: false, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    const report = validateAccessibilityConsistency(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("accepts an inaccessible staircase between accessible transition nodes", () => {
    const graph = makeGraph({
      nodes: makeGraph().nodes.map((node) =>
        node.id === "stairs" ? { ...node, accessible: true } : node,
      ),
      edges: [
        { id: "stairs-edge", fromNodeId: "corridor", toNodeId: "stairs", distanceMeters: 10, accessible: false, movement: "stairs", bidirectional: true, status: "active" },
      ],
    });

    const report = validateAccessibilityConsistency(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("ignores inactive edges for current accessibility consistency", () => {
    const graph = makeGraph({
      edges: [
        { id: "inactive-bad-edge", fromNodeId: "stairs", toNodeId: "corridor", distanceMeters: 10, accessible: true, movement: "stairs", bidirectional: true, status: "temporarily_unavailable" },
      ],
    });

    const report = validateAccessibilityConsistency(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("rejects an accessible edge with a missing endpoint", () => {
    const graph = makeGraph({
      edges: [
        { id: "dangling", fromNodeId: "missing", toNodeId: "corridor", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    const report = validateAccessibilityConsistency(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "ACCESSIBLE_EDGE_ENDPOINT_MISSING",
      message: "Accessible edge dangling references a missing endpoint",
      entityId: "dangling",
    });
  });
});
