import { describe, expect, it } from "vitest";

import { findRoute } from "@/domain/routing/route";
import type { MallGraph } from "@/domain/navigation/types";

function makeGraph(): MallGraph {
  return {
    mallId: "synthetic-mall",
    levels: [{ id: "l1", mallId: "synthetic-mall", name: "Level 1", order: 1 }],
    nodes: [
      { id: "start", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "entrance", name: "Start", position: { x: 0, y: 0 }, accessible: true, status: "active" },
      { id: "blocked", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "corridor", name: "Blocked", position: { x: 10, y: 0 }, accessible: false, status: "active" },
      { id: "target", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "store", name: "Target", position: { x: 20, y: 0 }, accessible: true, status: "active" },
    ],
    edges: [
      { id: "to-blocked", fromNodeId: "start", toNodeId: "blocked", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      { id: "from-blocked", fromNodeId: "blocked", toNodeId: "target", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
    ],
    places: [],
  };
}

describe("R5: accessible-only routing", () => {
  it("rejects a route that would pass through an inaccessible node", () => {
    const graph = makeGraph();

    expect(findRoute(graph, "start", "target", true)).toBeNull();
  });

  it("preserves normal routing through an inaccessible node", () => {
    const graph = makeGraph();

    expect(findRoute(graph, "start", "target")?.nodeIds).toEqual([
      "start",
      "blocked",
      "target",
    ]);
  });

  it("rejects an inaccessible start or target for accessible-only routing", () => {
    const graph = makeGraph();

    expect(findRoute(graph, "blocked", "target", true)).toBeNull();
    expect(findRoute(graph, "start", "blocked", true)).toBeNull();
  });
});
