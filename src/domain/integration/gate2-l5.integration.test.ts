import { describe, expect, it } from "vitest";
import type { MallGraph } from "@/domain/navigation/types";
import type { ParkingSession } from "@/domain/parking/types";
import { authorizeParkingRouting } from "@/domain/parking/routing-authorization";
import { findRoute } from "@/domain/routing/route";
import { validateRouteOperationalState } from "@/domain/integrity/validateRouteOperationalState";

const NOW = new Date("2026-09-14T10:00:00.000Z");
const START = "ingress";
const TARGET = "parking-target";

function graph(overrides: Partial<MallGraph> = {}): MallGraph {
  return {
    mallId: "mofa",
    levels: [{ id: "level-4", mallId: "mofa", name: "Parking Level 4", order: 4 }],
    nodes: [
      {
        id: START,
        mallId: "mofa",
        levelId: "level-4",
        parkadeId: "parkade-c",
        type: "entrance",
        name: "Entrance",
        position: { x: 0, y: 0 },
        accessible: true,
        status: "active",
      },
      {
        id: "primary",
        mallId: "mofa",
        levelId: "level-4",
        parkadeId: "parkade-c",
        type: "lift",
        name: "Primary Lift",
        position: { x: 1, y: 0 },
        accessible: true,
        status: "active",
      },
      {
        id: "secondary",
        mallId: "mofa",
        levelId: "level-4",
        parkadeId: "parkade-c",
        type: "lift",
        name: "Secondary Lift",
        position: { x: 1, y: 1 },
        accessible: true,
        status: "active",
      },
      {
        id: TARGET,
        mallId: "mofa",
        levelId: "level-4",
        parkadeId: "parkade-c",
        type: "parking",
        name: "Saved Parking Area",
        position: { x: 2, y: 0 },
        accessible: true,
        status: "active",
      },
    ],
    edges: [
      {
        id: "e-primary-in",
        fromNodeId: START,
        toNodeId: "primary",
        distanceMeters: 10,
        accessible: true,
        movement: "walk",
        bidirectional: true,
        status: "active",
      },
      {
        id: "e-primary-out",
        fromNodeId: "primary",
        toNodeId: TARGET,
        distanceMeters: 10,
        accessible: true,
        movement: "lift",
        bidirectional: true,
        status: "active",
      },
      {
        id: "e-secondary-in",
        fromNodeId: START,
        toNodeId: "secondary",
        distanceMeters: 20,
        accessible: true,
        movement: "walk",
        bidirectional: true,
        status: "active",
      },
      {
        id: "e-secondary-out",
        fromNodeId: "secondary",
        toNodeId: TARGET,
        distanceMeters: 20,
        accessible: true,
        movement: "lift",
        bidirectional: true,
        status: "active",
      },
    ],
    places: [],
    ...overrides,
  };
}

function session(overrides: Partial<ParkingSession> = {}): ParkingSession {
  return {
    id: "parking-session-1",
    mallId: "mofa",
    parkadeId: "parkade-c",
    levelId: "level-4",
    landmarkId: TARGET,
    capturedAt: NOW.toISOString(),
    source: "manual",
    confidence: 1,
    note: "Saved manually.",
    ...overrides,
  };
}

describe("Gate 2 L5 integration decision chain", () => {
  it("carries one persisted session through sequential state mutations without stale truth", () => {
    // State 1: persisted parking truth -> freshness/state -> authorization -> route.
    const persisted = session();
    const baselineGraph = graph();
    const authorization = authorizeParkingRouting(persisted, NOW);
    expect(authorization).toEqual({ allowed: true, reason: "eligible" });

    const initialRoute = findRoute(baselineGraph, START, persisted.landmarkId!);
    expect(initialRoute).not.toBeNull();
    expect(initialRoute!.verified).toBe(true);
    expect(validateRouteOperationalState(baselineGraph, initialRoute!).valid).toBe(true);

    // State 2: authorization failures remain upstream of routing.
    expect(authorizeParkingRouting(null, NOW)).toEqual({ allowed: false, reason: "missing_session" });
    expect(authorizeParkingRouting(session({ confidence: Number.NaN }), NOW)).toEqual({ allowed: false, reason: "invalid_confidence" });
    expect(authorizeParkingRouting(session({ source: "visual" }), NOW)).toEqual({ allowed: false, reason: "unsupported_source" });
    expect(authorizeParkingRouting(session({ capturedAt: "2026-09-01T10:00:00.000Z" }), NOW)).toEqual({ allowed: false, reason: "stale" });

    // State 3: authorization does not imply destination reachability.
    const disconnected = graph({ edges: [] });
    expect(authorizeParkingRouting(persisted, NOW)).toEqual({ allowed: true, reason: "eligible" });
    expect(findRoute(disconnected, START, persisted.landmarkId!)).toBeNull();

    // State 4: operational failure invalidates the historical route.
    const primaryFailed: MallGraph = {
      ...baselineGraph,
      edges: baselineGraph.edges.map((edge) =>
        edge.id === "e-primary-out" ? { ...edge, status: "temporarily_unavailable" } : edge,
      ),
    };
    expect(validateRouteOperationalState(primaryFailed, initialRoute!).valid).toBe(false);

    // State 5: fresh routing recomputes and fails over to the secondary path.
    const failoverRoute = findRoute(primaryFailed, START, persisted.landmarkId!);
    expect(failoverRoute).not.toBeNull();
    expect(failoverRoute!.nodeIds).toContain("secondary");
    expect(failoverRoute!.nodeIds).not.toContain("primary");
    expect(failoverRoute!.verified).toBe(true);
    expect(validateRouteOperationalState(primaryFailed, failoverRoute!).valid).toBe(true);

    // State 6: total operational failure closes the route rather than returning stale truth.
    const allTransitionsFailed: MallGraph = {
      ...primaryFailed,
      edges: primaryFailed.edges.map((edge) =>
        edge.id === "e-secondary-out" ? { ...edge, status: "temporarily_unavailable" } : edge,
      ),
    };
    expect(findRoute(allTransitionsFailed, START, persisted.landmarkId!)).toBeNull();

    // State 7: accessibility policy remains independent and fail-closed.
    const inaccessibleOnly: MallGraph = {
      ...baselineGraph,
      edges: baselineGraph.edges.map((edge) =>
        ({ ...edge, accessible: false }),
      ),
    };
    expect(findRoute(inaccessibleOnly, START, TARGET, true)).toBeNull();
    expect(findRoute(inaccessibleOnly, START, TARGET, false)).not.toBeNull();

    // State 8: route existence and route verification are distinct properties.
    const unverifiedGraph: MallGraph = {
      ...baselineGraph,
      nodes: baselineGraph.nodes.map((node) =>
        node.id === TARGET ? { ...node, status: "unverified" } : node,
      ),
      edges: baselineGraph.edges.map((edge) =>
        edge.id === "e-primary-out" ? { ...edge, status: "unverified" } : edge,
      ),
    };
    const unverifiedRoute = findRoute(unverifiedGraph, START, TARGET);
    expect(unverifiedRoute).not.toBeNull();
    expect(unverifiedRoute!.verified).toBe(false);

    // State 9: the persisted datum itself has not been rewritten by routing/failure.
    expect(persisted).toEqual(session());

    // State 10: the historical route can never override the current graph state.
    expect(validateRouteOperationalState(allTransitionsFailed, initialRoute!).valid).toBe(false);
    expect(findRoute(allTransitionsFailed, START, TARGET)).toBeNull();
  });
});
