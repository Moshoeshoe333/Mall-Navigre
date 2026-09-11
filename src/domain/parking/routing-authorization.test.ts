import { describe, expect, it } from "vitest";

import type { ParkingSession } from "@/domain/parking/types";
import { authorizeParkingRouting } from "@/domain/parking/routing-authorization";

const NOW = new Date("2026-09-11T12:00:00.000Z");

function session(overrides: Partial<ParkingSession> = {}): ParkingSession {
  return {
    id: "parking-session-1",
    mallId: "mall-of-africa",
    parkadeId: "parkade-c",
    levelId: "mofa-parking-4",
    landmarkId: "p4-start",
    capturedAt: "2026-09-11T12:00:00.000Z",
    source: "manual",
    confidence: 1,
    ...overrides,
  };
}

describe("Gate 2 v2 routing authorization", () => {
  it("allows a fresh manual observation at or above the confidence boundary", () => {
    expect(authorizeParkingRouting(session({ confidence: 0.5 }), NOW)).toEqual({
      allowed: true,
      reason: "eligible",
    });
  });

  it("rejects confidence below 0.50", () => {
    expect(authorizeParkingRouting(session({ confidence: 0.49 }), NOW)).toEqual({
      allowed: false,
      reason: "low_confidence",
    });
  });

  it("rejects GPS as an independent routing authority", () => {
    expect(authorizeParkingRouting(session({ source: "gps", confidence: 1 }), NOW)).toEqual({
      allowed: false,
      reason: "low_confidence",
    });
  });

  it("keeps visual observations fail closed", () => {
    expect(authorizeParkingRouting(session({ source: "visual", confidence: 1 }), NOW)).toEqual({
      allowed: false,
      reason: "unsupported_source",
    });
  });

  it("allows BLE when stored confidence is sufficient and fresh", () => {
    expect(authorizeParkingRouting(session({ source: "ble", confidence: 0.85 }), NOW)).toEqual({
      allowed: true,
      reason: "eligible",
    });
  });

  it("allows Wi-Fi when stored confidence is sufficient and fresh", () => {
    expect(authorizeParkingRouting(session({ source: "wifi", confidence: 0.7 }), NOW)).toEqual({
      allowed: true,
      reason: "eligible",
    });
  });

  it("rejects an exactly seven-day-old observation", () => {
    expect(
      authorizeParkingRouting(
        session({ capturedAt: "2026-09-04T12:00:00.000Z" }),
        NOW,
      ),
    ).toEqual({ allowed: false, reason: "stale" });
  });

  it("rejects invalid temporal data through the freshness boundary", () => {
    expect(
      authorizeParkingRouting(
        session({ capturedAt: "not-a-date" as ParkingSession["capturedAt"] }),
        NOW,
      ),
    ).toEqual({ allowed: false, reason: "stale" });
  });

  it("rejects a future observation rather than granting freshness", () => {
    expect(
      authorizeParkingRouting(
        session({ capturedAt: "2026-09-12T12:00:00.000Z" }),
        NOW,
      ),
    ).toEqual({ allowed: false, reason: "stale" });
  });

  it("does not mutate the stored session", () => {
    const original = session({ confidence: 0.83, capturedAt: "2026-09-10T12:00:00.000Z" });
    const before = structuredClone(original);

    authorizeParkingRouting(original, NOW);

    expect(original).toEqual(before);
  });

  it("rejects invalid confidence values", () => {
    expect(authorizeParkingRouting(session({ confidence: Number.NaN }), NOW).allowed).toBe(false);
    expect(authorizeParkingRouting(session({ confidence: Number.POSITIVE_INFINITY }), NOW).allowed).toBe(false);
  });

  it("uses updatedAt to refresh freshness without changing stored confidence", () => {
    const original = session({
      confidence: 0.91,
      capturedAt: "2026-08-20T12:00:00.000Z",
      updatedAt: "2026-09-10T12:00:00.000Z",
    });

    expect(authorizeParkingRouting(original, NOW)).toEqual({ allowed: true, reason: "eligible" });
    expect(original.confidence).toBe(0.91);
  });

  it("rejects a missing session", () => {
    expect(authorizeParkingRouting(null, NOW)).toEqual({
      allowed: false,
      reason: "missing_session",
    });
  });
});
