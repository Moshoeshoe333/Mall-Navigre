import { describe, expect, it } from "vitest";

import { findRoute } from "@/domain/routing/route";
import type { MallGraph } from "@/domain/navigation/types";

const multiLevelGraph: MallGraph = {
  mallId: "test-mall",
  levels: [
    { id: "l1", mallId: "test-mall", name: "Level 1", order: 1 },
    { id: "l2", mallId: "test-mall", name: "Level 2", order: 2 },
  ],
  nodes: [
    { id: "l1-start", mallId: "test-mall", levelId: "l1", parkadeId: null, type: "parking", name: "Start", position: { x: 0, y: 0 }, accessible: true, status: "active" },
    { id: "l1-lift", mallId: "test-mall", levelId: "l1", parkadeId: null, type: "lift", name: "Lift L1", position: { x: 10, y: 0 }, accessible: true, status: "active" },
    { id: "l2-lift", mallId: "test-mall", levelId: "l2", parkadeId: null, type: "lift", name: "Lift L2", position: { x: 10, y: 0 }, accessible: true, status: "active" },
    { id: "l2-destination", mallId: "test-mall", levelId: "l2", parkadeId: null, type: "landmark", name: "Destination", position: { x: 20, y: 0 }, accessible: true, status: "active" },
  ],
  edges: [
    { id: "walk-up", fromNodeId: "l1-start", toNodeId: "l1-lift", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
    { id: "lift-up", fromNodeId: "l1-lift", toNodeId: "l2-lift", distanceMeters: 4, accessible: true, movement: "lift", bidirectional: true, status: "active" },
    { id: "walk-down", fromNodeId: "l2-lift", toNodeId: "l2-destination", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
  ],
  places: [],
};

describe("multi-level routing", () => {
  it("routes across levels through an explicit vertical transition", () => {
    const result = findRoute(multiLevelGraph, "l1-start", "l2-destination");

    expect(result?.nodeIds).toEqual(["l1-start", "l1-lift", "l2-lift", "l2-destination"]);
    expect(result?.edgeIds).toEqual(["walk-up", "lift-up", "walk-down"]);
    expect(result?.distanceMeters).toBe(24);
    expect(result?.verified).toBe(true);
  });

  it("routes in the reverse direction when the vertical transition is bidirectional", () => {
    const result = findRoute(multiLevelGraph, "l2-destination", "l1-start");

    expect(result?.nodeIds).toEqual(["l2-destination", "l2-lift", "l1-lift", "l1-start"]);
    expect(result?.edgeIds).toEqual(["walk-down", "lift-up", "walk-up"]);
    expect(result?.distanceMeters).toBe(24);
  });

  it("returns no route when the only vertical transition is unavailable", () => {
    const graph: MallGraph = {
      ...multiLevelGraph,
      edges: multiLevelGraph.edges.map((edge) =>
        edge.id === "lift-up" ? { ...edge, status: "temporarily_unavailable" as const } : edge,
      ),
    };

    expect(findRoute(graph, "l1-start", "l2-destination")).toBeNull();
  });

  it("excludes a non-accessible vertical transition in accessible-only mode", () => {
    const graph: MallGraph = {
      ...multiLevelGraph,
      edges: multiLevelGraph.edges.map((edge) =>
        edge.id === "lift-up" ? { ...edge, accessible: false } : edge,
      ),
    };

    expect(findRoute(graph, "l1-start", "l2-destination", true)).toBeNull();
  });
});
