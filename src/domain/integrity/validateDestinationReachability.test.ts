import { describe, expect, it } from "vitest";

import { validateDestinationReachability } from "@/domain/integrity/validateDestinationReachability";
import type { MallGraph } from "@/domain/navigation/types";

function makeGraph(overrides: Partial<MallGraph> = {}): MallGraph {
  return {
    mallId: "synthetic-mall",
    levels: [{ id: "l1", mallId: "synthetic-mall", name: "Level 1", order: 1 }],
    nodes: [
      { id: "entrance", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "entrance", name: "Entrance", position: { x: 0, y: 0 }, accessible: true, status: "active" },
      { id: "corridor", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "corridor", name: "Corridor", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "store", mallId: "synthetic-mall", levelId: "l1", parkadeId: null, type: "store", name: "Store", position: { x: 20, y: 0 }, accessible: true, status: "active" },
    ],
    edges: [
      { id: "e1", fromNodeId: "entrance", toNodeId: "corridor", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      { id: "e2", fromNodeId: "corridor", toNodeId: "store", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
    ],
    places: [
      { id: "place-store", mallId: "synthetic-mall", nodeId: "store", name: "Store", category: "retail", status: "active" },
    ],
    ...overrides,
  };
}

describe("Invariant R4: destination reachability", () => {
  it("accepts a destination reachable from an active entrance", () => {
    const report = validateDestinationReachability(makeGraph());

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("accepts a destination reachable from any one of multiple active ingresses", () => {
    const graph = makeGraph({
      nodes: [
        ...makeGraph().nodes,
        { id: "parking", mallId: "synthetic-mall", levelId: "l1", parkadeId: "parkade-c", type: "parking", name: "Parking", position: { x: 0, y: 20 }, accessible: true, status: "active" },
      ],
      edges: [
        ...makeGraph().edges,
        { id: "parking-route", fromNodeId: "parking", toNodeId: "store", distanceMeters: 20, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      ],
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("accepts a one-way edge when its declared direction leads toward the destination", () => {
    const graph = makeGraph({
      edges: [
        { id: "e1", fromNodeId: "entrance", toNodeId: "corridor", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: false, status: "active" },
        { id: "e2", fromNodeId: "corridor", toNodeId: "store", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: false, status: "active" },
      ],
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("rejects a one-way edge that points away from the destination", () => {
    const graph = makeGraph({
      edges: [
        { id: "e1", fromNodeId: "corridor", toNodeId: "entrance", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: false, status: "active" },
        { id: "e2", fromNodeId: "store", toNodeId: "corridor", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: false, status: "active" },
      ],
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "UNREACHABLE_DESTINATION",
      message: "Active destination place-store at node store is unreachable from every active ingress",
      entityId: "place-store",
    });
  });

  it("rejects an active destination that references a missing node", () => {
    const graph = makeGraph({
      places: [{ id: "missing-place", mallId: "synthetic-mall", nodeId: "missing", name: "Missing", category: "retail", status: "active" }],
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "DESTINATION_NODE_MISSING",
      message: "Active destination missing-place references missing node missing",
      entityId: "missing-place",
    });
  });

  it("rejects an active destination that references an inactive node", () => {
    const graph = makeGraph({
      nodes: makeGraph().nodes.map((node) =>
        node.id === "store" ? { ...node, status: "temporarily_unavailable" as const } : node,
      ),
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "DESTINATION_NODE_INACTIVE",
      message: "Active destination place-store references inactive node store",
      entityId: "place-store",
    });
  });

  it("rejects active destinations when no active ingress exists", () => {
    const graph = makeGraph({
      nodes: makeGraph().nodes.map((node) =>
        node.id === "entrance" ? { ...node, status: "temporarily_unavailable" as const } : node,
      ),
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "NO_ACTIVE_INGRESS",
      message: "Active destination place-store has no active entrance or parking ingress",
      entityId: "place-store",
    });
  });

  it("does not claim a route through an inactive or unverified edge", () => {
    const graph = makeGraph({
      edges: makeGraph().edges.map((edge) =>
        edge.id === "e2" ? { ...edge, status: "unverified" as const } : edge,
      ),
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "UNREACHABLE_DESTINATION",
      message: "Active destination place-store at node store is unreachable from every active ingress",
      entityId: "place-store",
    });
  });

  it("does not apply accessibility policy to R4", () => {
    const graph = makeGraph({
      edges: makeGraph().edges.map((edge) => ({ ...edge, accessible: false })),
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("passes when there are no active destinations", () => {
    const graph = makeGraph({
      places: makeGraph().places.map((place) => ({ ...place, status: "temporarily_unavailable" as const })),
    });

    const report = validateDestinationReachability(graph);

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
