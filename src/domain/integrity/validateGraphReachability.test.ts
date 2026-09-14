import { describe, expect, it } from "vitest";

import { validateGraphReachability } from "@/domain/integrity/validateGraphReachability";
import type { MallGraph } from "@/domain/navigation/types";

function makeGraph(overrides: Partial<MallGraph> = {}): MallGraph {
  return {
    mallId: "synthetic-mall",
    levels: [
      { id: "l1", mallId: "synthetic-mall", name: "Level 1", order: 1 },
      { id: "l2", mallId: "synthetic-mall", name: "Level 2", order: 2 },
    ],
    nodes: [
      { id: "l1-a", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "corridor", name: "L1 A", position: { x: 0, y: 0 }, accessible: true, status: "active" },
      { id: "l1-b", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "corridor", name: "L1 B", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "l2-a", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "corridor", name: "L2 A", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "l2-b", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "store", name: "L2 B", position: { x: 20, y: 0 }, accessible: true, status: "active" },
    ],
    edges: [
      { id: "walk-l1", fromNodeId: "l1-a", toNodeId: "l1-b", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      { id: "lift", fromNodeId: "l1-b", toNodeId: "l2-a", distanceMeters: 4, accessible: true, movement: "lift", bidirectional: true, status: "active" },
      { id: "walk-l2", fromNodeId: "l2-a", toNodeId: "l2-b", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
    ],
    places: [],
    ...overrides,
  };
}

describe("Invariant R3: global graph reachability", () => {
  it("accepts one connected multi-floor graph", () => {
    const report = validateGraphReachability(makeGraph());

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("rejects an isolated active node", () => {
    const graph = makeGraph({
      nodes: [
        ...makeGraph().nodes,
        { id: "orphan", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "store", name: "Orphan Store", position: { x: 99, y: 99 }, accessible: true, status: "active" },
      ],
    });

    const report = validateGraphReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "ORPHANED_ACTIVE_COMPONENT",
      message: "Active graph component containing orphan is disconnected from the other active graph components",
      entityId: "orphan",
    });
  });

  it("rejects a disconnected subgraph rather than only single-node islands", () => {
    const graph = makeGraph({
      nodes: [
        ...makeGraph().nodes,
        { id: "island-a", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "corridor", name: "Island A", position: { x: 50, y: 50 }, accessible: true, status: "active" },
        { id: "island-b", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "restroom", name: "Island B", position: { x: 60, y: 50 }, accessible: true, status: "active" },
      ],
      edges: [
        ...makeGraph().edges,
        { id: "island-walk", fromNodeId: "island-a", toNodeId: "island-b", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    const report = validateGraphReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "ORPHANED_ACTIVE_COMPONENT",
      message: "Active graph component containing island-a is disconnected from the other active graph components",
      entityId: "island-a",
    });
  });

  it("does not mistake a one-way edge for a disconnected graph", () => {
    const graph = makeGraph({
      edges: makeGraph().edges.map((edge) =>
        edge.id === "lift" ? { ...edge, bidirectional: false } : edge,
      ),
    });

    const report = validateGraphReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("does not resurrect temporarily unavailable edges into R3 topology", () => {
    const graph = makeGraph({
      edges: makeGraph().edges.map((edge) =>
        edge.id === "lift" ? { ...edge, status: "temporarily_unavailable" as const } : edge,
      ),
    });

    const report = validateGraphReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "ORPHANED_ACTIVE_COMPONENT",
      message: "Active graph component containing l2-a is disconnected from the other active graph components",
      entityId: "l2-a",
    });
  });

  it("ignores inactive nodes and edges when evaluating the active graph", () => {
    const graph = makeGraph({
      nodes: [
        ...makeGraph().nodes,
        { id: "inactive", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "store", name: "Inactive Store", position: { x: 99, y: 99 }, accessible: true, status: "temporarily_unavailable" },
      ],
      edges: [
        ...makeGraph().edges,
        { id: "inactive-edge", fromNodeId: "inactive", toNodeId: "l2-b", distanceMeters: 5, accessible: true, movement: "walk", bidirectional: true, status: "temporarily_unavailable" },
      ],
    });

    const report = validateGraphReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("does not treat a valid dead end as an orphaned component", () => {
    const graph = makeGraph({
      nodes: [
        ...makeGraph().nodes,
        { id: "cul-de-sac", mallId: "synthetic-mall", levelId: "l2", parkadeId: null, type: "corridor", name: "Cul-de-sac", position: { x: 30, y: 0 }, accessible: true, status: "active" },
      ],
      edges: [
        ...makeGraph().edges,
        { id: "dead-end", fromNodeId: "l2-b", toNodeId: "cul-de-sac", distanceMeters: 5, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    const report = validateGraphReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
