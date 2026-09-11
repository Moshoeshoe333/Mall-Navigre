import { describe, expect, it } from "vitest";

import { mallOfAfricaGraph } from "@/data/malls/mall-of-africa/graph";
import { findRoute } from "@/domain/routing/route";
import { authorizeParkingRouting } from "@/domain/parking/routing-authorization";
import type { ParkingSession } from "@/domain/parking/types";

const NOW = new Date("2026-09-11T10:00:00.000Z");

function makeSession(overrides: Partial<ParkingSession> = {}): ParkingSession {
  return {
    id: "parking-session-1",
    mallId: "mall-of-africa",
    parkadeId: "parkade-c",
    levelId: "mofa-parking-4",
    landmarkId: "p4-entrance-16",
    capturedAt: "2026-09-11T09:00:00.000Z",
    source: "manual",
    confidence: 1,
    ...overrides,
  };
}

describe("Gate 2 parking decision chain", () => {
  it("authorizes an eligible session before calculating a route", () => {
    const session = makeSession();
    const authorization = authorizeParkingRouting(session, NOW);

    expect(authorization).toEqual({ allowed: true, reason: "eligible" });

    if (!authorization.allowed) return;
    const route = findRoute(mallOfAfricaGraph, "p4-start", session.landmarkId!);

    expect(route).not.toBeNull();
    expect(route?.nodeIds).toEqual(["p4-start", "p4-corridor-a", "p4-entrance-16"]);
    expect(route?.distanceMeters).toBe(24);
  });

  it("keeps authorization independent from RouteResult.verified", () => {
    const session = makeSession();
    const authorization = authorizeParkingRouting(session, NOW);
    const route = findRoute(mallOfAfricaGraph, "p4-start", session.landmarkId!);

    expect(authorization.allowed).toBe(true);
    expect(route).not.toBeNull();
    expect(route?.verified).toBe(false);
  });

  it("does not calculate a route when authorization rejects low confidence", () => {
    const session = makeSession({ confidence: 0.49 });
    const authorization = authorizeParkingRouting(session, NOW);

    expect(authorization).toEqual({ allowed: false, reason: "low_confidence" });

    const route = authorization.allowed
      ? findRoute(mallOfAfricaGraph, "p4-start", session.landmarkId!)
      : null;

    expect(route).toBeNull();
  });

  it("does not calculate a route when authorization rejects stale evidence", () => {
    const session = makeSession({ capturedAt: "2026-09-04T10:00:00.000Z" });
    const authorization = authorizeParkingRouting(session, NOW);

    expect(authorization).toEqual({ allowed: false, reason: "stale" });

    const route = authorization.allowed
      ? findRoute(mallOfAfricaGraph, "p4-start", session.landmarkId!)
      : null;

    expect(route).toBeNull();
  });
});
