import { describe, expect, it } from "vitest";
import { shouldRequestLandmarkConfirmation } from "@/domain/parking/state";
import { validateMallGraph } from "@/domain/integrity/validateMall";
import { findRoute } from "@/domain/routing/aStar";
import type { MallGraph } from "@/domain/navigation/types";

const graph: MallGraph = {
  mallId: "mall-of-africa",
  levels: [{ id: "l4", mallId: "mall-of-africa", name: "Level 4", order: 4 }],
  nodes: [
    { id: "parking-a", mallId: "mall-of-africa", levelId: "l4", parkadeId: "parkade-c", type: "parking", name: "Parkade C", position: { x: 0, y: 0 }, accessible: true, status: "active" },
    { id: "gate-16", mallId: "mall-of-africa", levelId: "l4", parkadeId: "parkade-c", type: "entrance", name: "Entrance 16", position: { x: 20, y: 0 }, accessible: true, status: "active", visualLandmark: { kind: "entrance_gate", label: "16" } },
  ],
  edges: [{ id: "e1", fromNodeId: "parking-a", toNodeId: "gate-16", distanceMeters: 20, accessible: true, movement: "walk", bidirectional: true, status: "active" }],
  places: [],
};

describe("Parking Truth Test", () => {
  it("requires landmark confirmation below 0.5 confidence", () => {
    expect(shouldRequestLandmarkConfirmation(0.49)).toBe(true);
    expect(shouldRequestLandmarkConfirmation(0.5)).toBe(false);
  });

  it("accepts a coherent graph", () => {
    expect(validateMallGraph(graph).valid).toBe(true);
  });

  it("rejects dangling edges", () => {
    const invalid = { ...graph, edges: [{ ...graph.edges[0], toNodeId: "missing" }] };
    const report = validateMallGraph(invalid);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.code === "MISSING_TO_NODE")).toBe(true);
  });

  it("routes around active graph edges", () => {
    const route = findRoute(graph, "parking-a", "gate-16");
    expect(route?.nodeIds).toEqual(["parking-a", "gate-16"]);
    expect(route?.distanceMeters).toBe(20);
  });

  it("does not traverse unavailable edges", () => {
    const unavailable = { ...graph, edges: [{ ...graph.edges[0], status: "temporarily_unavailable" as const }] };
    expect(findRoute(unavailable, "parking-a", "gate-16")).toBeNull();
  });
});
