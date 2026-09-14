import { describe, expect, it } from "vitest";

import { validateRouteOperationalState } from "@/domain/integrity/validateRouteOperationalState";
import { findRoute, type RouteResult } from "@/domain/routing/route";
import type { MallGraph } from "@/domain/navigation/types";

function makeGraph(): MallGraph {
  return {
    mallId: "r6-mall",
    levels: [
      { id: "l1", mallId: "r6-mall", name: "Level 1", order: 1 },
      { id: "l2", mallId: "r6-mall", name: "Level 2", order: 2 },
    ],
    nodes: [
      { id: "start", mallId: "r6-mall", levelId: "l1", parkadeId: null, type: "entrance", name: "Start", position: { x: 0, y: 0 }, accessible: true, status: "active" },
      { id: "primary", mallId: "r6-mall", levelId: "l1", parkadeId: null, type: "lift", name: "Primary Lift", position: { x: 10, y: 0 }, accessible: true, status: "active" },
      { id: "secondary", mallId: "r6-mall", levelId: "l1", parkadeId: null, type: "lift", name: "Secondary Lift", position: { x: 0, y: 10 }, accessible: true, status: "active" },
      { id: "target", mallId: "r6-mall", levelId: "l2", parkadeId: null, type: "store", name: "Target", position: { x: 10, y: 10 }, accessible: true, status: "active" },
    ],
    edges: [
      { id: "primary-path", fromNodeId: "start", toNodeId: "primary", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      { id: "primary-up", fromNodeId: "primary", toNodeId: "target", distanceMeters: 10, accessible: true, movement: "lift", bidirectional: true, status: "active" },
      { id: "secondary-path", fromNodeId: "start", toNodeId: "secondary", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
      { id: "secondary-up", fromNodeId: "secondary", toNodeId: "target", distanceMeters: 15, accessible: true, movement: "lift", bidirectional: true, status: "active" },
    ],
    places: [],
  };
}

describe("Invariant R6: failure and failover integrity", () => {
  it("fails over from an unavailable primary transition to an active secondary transition", () => {
    const graph = makeGraph();
    const primaryRoute = findRoute(graph, "start", "target");
    expect(primaryRoute?.edgeIds).toEqual(["primary-path", "primary-up"]);

    const failedGraph: MallGraph = {
      ...graph,
      edges: graph.edges.map((edge) =>
        edge.id === "primary-up" ? { ...edge, status: "temporarily_unavailable" as const } : edge,
      ),
    };

    expect(validateRouteOperationalState(failedGraph, primaryRoute!).valid).toBe(false);
    expect(findRoute(failedGraph, "start", "target")?.edgeIds).toEqual(["secondary-path", "secondary-up"]);
  });

  it("returns no route when every viable transition is unavailable", () => {
    const graph = makeGraph();
    const failedGraph: MallGraph = {
      ...graph,
      edges: graph.edges.map((edge) =>
        edge.id === "primary-up" || edge.id === "secondary-up"
          ? { ...edge, status: "temporarily_unavailable" as const }
          : edge,
      ),
    };

    expect(findRoute(failedGraph, "start", "target")).toBeNull();
  });

  it("does not claim a route containing an unavailable node", () => {
    const graph = makeGraph();
    const route = findRoute(graph, "start", "target");
    const failedGraph: MallGraph = {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === "primary" ? { ...node, status: "temporarily_unavailable" as const } : node,
      ),
    };

    const report = validateRouteOperationalState(failedGraph, route!);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "ROUTE_NODE_UNAVAILABLE",
      message: "Route references unavailable node primary",
      entityId: "primary",
    });
  });

  it("rejects a route containing an unavailable edge", () => {
    const graph = makeGraph();
    const route = findRoute(graph, "start", "target");
    const failedGraph: MallGraph = {
      ...graph,
      edges: graph.edges.map((edge) =>
        edge.id === "primary-up" ? { ...edge, status: "temporarily_unavailable" as const } : edge,
      ),
    };

    const report = validateRouteOperationalState(failedGraph, route!);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      severity: "error",
      code: "ROUTE_EDGE_UNAVAILABLE",
      message: "Route references unavailable edge primary-up",
      entityId: "primary-up",
    });
  });

  it("accepts a route while all referenced infrastructure remains active", () => {
    const graph = makeGraph();
    const route = findRoute(graph, "start", "target");

    expect(validateRouteOperationalState(graph, route!).valid).toBe(true);
  });

  it("rejects a route referencing a missing node or edge", () => {
    const graph = makeGraph();
    const route: RouteResult = {
      nodeIds: ["start", "missing-node"],
      edgeIds: ["missing-edge"],
      distanceMeters: 10,
      verified: false,
    };

    const report = validateRouteOperationalState(graph, route);

    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      "ROUTE_NODE_MISSING",
      "ROUTE_EDGE_MISSING",
    ]);
  });

  it("preserves accessible-only semantics during failover", () => {
    const graph = makeGraph();
    const failedGraph: MallGraph = {
      ...graph,
      edges: graph.edges.map((edge) =>
        edge.id === "primary-up"
          ? { ...edge, accessible: false }
          : edge,
      ),
    };

    expect(findRoute(failedGraph, "start", "target", true)?.edgeIds).toEqual([
      "secondary-path",
      "secondary-up",
    ]);
  });
});
