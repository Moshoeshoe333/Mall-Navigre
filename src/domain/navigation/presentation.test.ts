import { describe, expect, it } from "vitest";
import { createRouteViewModel } from "@/domain/navigation/presentation";
import type { MallGraph } from "@/domain/navigation/types";
import type { ParkingSession } from "@/domain/parking/types";
import type { RouteResult } from "@/domain/routing/route";

const now = new Date("2026-09-11T10:00:00.000Z");

const session: ParkingSession = {
  id: "session-1",
  mallId: "mall-1",
  parkadeId: "parkade-1",
  levelId: "level-1",
  capturedAt: "2026-09-11T09:00:00.000Z",
  source: "manual",
  confidence: 1,
};

const graph: MallGraph = {
  mallId: "mall-1",
  levels: [{ id: "level-1", mallId: "mall-1", name: "Level 1", order: 1 }],
  nodes: [
    { id: "node-a", mallId: "mall-1", levelId: "level-1", parkadeId: "parkade-1", type: "parking", name: "A", position: { x: 0, y: 0 }, accessible: true, status: "active" },
    { id: "node-b", mallId: "mall-1", levelId: "level-1", parkadeId: null, type: "corridor", name: "B", position: { x: 10, y: 0 }, accessible: true, status: "active" },
  ],
  edges: [
    { id: "edge-1", fromNodeId: "node-a", toNodeId: "node-b", distanceMeters: 10, accessible: true, movement: "walk", bidirectional: true, status: "active" },
  ],
  places: [],
};

const route = (verified: boolean): RouteResult => ({
  nodeIds: ["node-a", "node-b"],
  edgeIds: ["edge-1"],
  distanceMeters: 10,
  verified,
});

describe("Seam Hardening 1: Route Presentation Contract", () => {
  it("allows ACTIVE_GUIDANCE only for an eligible session and verified route", () => {
    const vm = createRouteViewModel({ session, routeResult: route(true), graph, now });
    expect(vm.mode).toBe("ACTIVE_GUIDANCE");
    expect(vm.isGuidanceAllowed).toBe(true);
    expect(vm.displayableEdgeIds).toEqual(["edge-1"]);
  });

  it("contains an unverified route as a preview with guidance disabled", () => {
    const unverifiedGraph: MallGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => ({ ...node, status: "unverified" })),
      edges: graph.edges.map((edge) => ({ ...edge, status: "unverified" })),
    };
    const vm = createRouteViewModel({ session, routeResult: route(false), graph: unverifiedGraph, now });
    expect(vm.mode).toBe("UNVERIFIED_PREVIEW");
    expect(vm.isGuidanceAllowed).toBe(false);
    expect(vm.displayableEdgeIds).toEqual(["edge-1"]);
  });

  it("fails closed when authorization rejects the session", () => {
    const rejected = { ...session, confidence: 0.49 };
    const vm = createRouteViewModel({ session: rejected, routeResult: route(true), graph, now });
    expect(vm.mode).toBe("FAILED_CLOSED");
    expect(vm.isGuidanceAllowed).toBe(false);
    expect(vm.pathNodeIds).toHaveLength(0);
    expect(vm.displayableEdgeIds).toHaveLength(0);
  });

  it("fails closed for a stale session", () => {
    const stale = { ...session, capturedAt: "2026-09-04T10:00:00.000Z" };
    const vm = createRouteViewModel({ session: stale, routeResult: route(true), graph, now });
    expect(vm.mode).toBe("FAILED_CLOSED");
    expect(vm.rejectionReason).toBe("stale");
  });

  it("never presents an unavailable edge as active navigation", () => {
    const unavailableGraph: MallGraph = {
      ...graph,
      edges: [{ ...graph.edges[0], status: "temporarily_unavailable" }],
    };
    const vm = createRouteViewModel({ session, routeResult: route(true), graph: unavailableGraph, now });
    expect(vm.mode).toBe("FAILED_CLOSED");
    expect(vm.displayableEdgeIds).toHaveLength(0);
    expect(vm.isGuidanceAllowed).toBe(false);
  });

  it("does not expose mutable path arrays", () => {
    const vm = createRouteViewModel({ session, routeResult: route(true), graph, now });
    expect(Object.isFrozen(vm.pathNodeIds)).toBe(true);
    expect(Object.isFrozen(vm.displayableEdgeIds)).toBe(true);
  });
});
