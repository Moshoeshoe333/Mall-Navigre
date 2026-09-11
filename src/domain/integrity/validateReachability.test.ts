import { describe, expect, it } from "vitest";

import { validateTransitionEndpointReachability } from "@/domain/integrity/validateReachability";
import type { MallGraph } from "@/domain/navigation/types";

function makeGraph(overrides: Partial<MallGraph> = {}): MallGraph {
  return {
    mallId: "synthetic-mall",
    levels: [
      { id: "l1", mallId: "synthetic-mall", name: "Level 1", order: 1 },
      { id: "l2", mallId: "synthetic-mall", name: "Level 2", order: 2 },
    ],
    nodes: [
      { id: "l1-start", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "corridor", name: "L1 Start", position: { x: 0, y: 0 }, accessible: true, status: "active" },
      { id: "l1-lift", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "lift", name: "L1 Lift", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "l2-lift", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "lift", name: "L2 Lift", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "l2-destination", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "corridor", name: "L2 Destination", position: { x: 20, y: 0 }, accessible: true, status: "active" },
    ],
    edges: [
      { id: "walk-l1", fromNodeId: "l1-start", toNodeId: "l1-lift", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      { id: "lift-l1-l2", fromNodeId: "l1-lift", toNodeId: "l2-lift", distanceMeters: 4, accessible: true, movement: "lift", bidirectional: true, status: "active" },
      { id: "walk-l2", fromNodeId: "l2-lift", toNodeId: "l2-destination", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
    ],
    places: [],
    ...overrides,
  };
}

describe("Invariant R1: transition endpoint reachability", () => {
  it("accepts a vertical transition whose endpoints both reach pedestrian networks", () => {
    const report = validateTransitionEndpointReachability(makeGraph());

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("rejects an isolated destination transition endpoint", () => {
    const graph = makeGraph({
      edges: [
        { id: "walk-l1", fromNodeId: "l1-start", toNodeId: "l1-lift", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
        { id: "lift-l1-l2", fromNodeId: "l1-lift", toNodeId: "l2-lift", distanceMeters: 4, accessible: true, movement: "lift", bidirectional: true, status: "active" },
      ],
    });

    const report = validateTransitionEndpointReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "TRANSITION_ENDPOINT_UNREACHABLE",
      message: "Vertical transition endpoint l2-lift has no active same-level pedestrian connection",
      entityId: "lift-l1-l2",
    });
  });

  it("rejects an isolated source transition endpoint", () => {
    const graph = makeGraph({
      edges: [
        { id: "lift-l1-l2", fromNodeId: "l1-lift", toNodeId: "l2-lift", distanceMeters: 4, accessible: true, movement: "lift", bidirectional: true, status: "active" },
        { id: "walk-l2", fromNodeId: "l2-lift", toNodeId: "l2-destination", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    const report = validateTransitionEndpointReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "TRANSITION_ENDPOINT_UNREACHABLE",
      message: "Vertical transition endpoint l1-lift has no active same-level pedestrian connection",
      entityId: "lift-l1-l2",
    });
  });

  it("does not treat an unavailable transition as a candidate for R1", () => {
    const graph = makeGraph({
      edges: [
        { id: "walk-l1", fromNodeId: "l1-start", toNodeId: "l1-lift", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
        { id: "lift-l1-l2", fromNodeId: "l1-lift", toNodeId: "l2-lift", distanceMeters: 4, accessible: true, movement: "lift", bidirectional: true, status: "temporarily_unavailable" },
        { id: "walk-l2", fromNodeId: "l2-lift", toNodeId: "l2-destination", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    const report = validateTransitionEndpointReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("keeps accessibility policy separate from structural reachability", () => {
    const graph = makeGraph({
      edges: [
        { id: "walk-l1", fromNodeId: "l1-start", toNodeId: "l1-lift", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
        { id: "lift-l1-l2", fromNodeId: "l1-lift", toNodeId: "l2-lift", distanceMeters: 4, accessible: false, movement: "lift", bidirectional: true, status: "active" },
        { id: "walk-l2", fromNodeId: "l2-lift", toNodeId: "l2-destination", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    const report = validateTransitionEndpointReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
