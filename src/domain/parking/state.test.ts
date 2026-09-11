import { describe, expect, it } from "vitest";

import type { ParkingSession } from "@/domain/parking/types";
import {
  getParkingState,
  normalizeParkingSession,
  shouldRequestLandmarkConfirmation,
} from "@/domain/parking/state";

const NOW = new Date("2026-09-11T12:00:00.000Z");

function makeSession(overrides: Partial<ParkingSession> = {}): ParkingSession {
  return {
    id: "parking-session-1",
    mallId: "mall-of-africa",
    parkadeId: "parkade-1",
    levelId: "level-1",
    capturedAt: "2026-09-11T12:00:00.000Z",
    source: "manual",
    confidence: 1,
    ...overrides,
  };
}

describe("Gate 2 v2 — parking freshness and compatibility", () => {
  describe("Policy C non-mutation", () => {
    it("does not mutate stored confidence when freshness is evaluated", () => {
      const session = makeSession({
        capturedAt: "2026-09-09T12:00:00.000Z",
        confidence: 0.83,
      });
      const before = structuredClone(session);

      getParkingState(session, NOW);

      expect(session).toEqual(before);
      expect(session.confidence).toBe(0.83);
    });

    it("preserves manual confidence at 24 hours", () => {
      const session = makeSession({
        capturedAt: "2026-09-10T12:00:00.000Z",
        confidence: 1,
      });

      expect(getParkingState(session, NOW)).toBe("active");
      expect(session.confidence).toBe(1);
    });

    it("preserves manual confidence at 48 hours", () => {
      const session = makeSession({
        capturedAt: "2026-09-09T12:00:00.000Z",
        confidence: 1,
      });

      expect(getParkingState(session, NOW)).toBe("active");
      expect(session.confidence).toBe(1);
    });
  });

  describe("seven-day freshness boundary", () => {
    it("treats an observation younger than seven days as active", () => {
      const session = makeSession({
        capturedAt: "2026-09-04T12:00:00.001Z",
      });

      expect(getParkingState(session, NOW)).toBe("active");
    });

    it("treats an observation exactly seven days old as stale", () => {
      const session = makeSession({
        capturedAt: "2026-09-04T12:00:00.000Z",
      });

      expect(getParkingState(session, NOW)).toBe("stale");
    });

    it("treats an observation older than seven days as stale", () => {
      const session = makeSession({
        capturedAt: "2026-09-03T12:00:00.000Z",
      });

      expect(getParkingState(session, NOW)).toBe("stale");
    });

    it("uses updatedAt rather than capturedAt for freshness", () => {
      const session = makeSession({
        capturedAt: "2026-08-20T12:00:00.000Z",
        updatedAt: "2026-09-10T12:00:00.000Z",
      });

      expect(getParkingState(session, NOW)).toBe("active");
    });

    it("fails closed when the freshness timestamp is invalid", () => {
      const session = makeSession({ capturedAt: "not-a-date" as ParkingSession["capturedAt"] });

      expect(getParkingState(session, NOW)).toBe("stale");
    });

    it("does not authorize freshness from a future timestamp", () => {
      const session = makeSession({
        capturedAt: "2026-09-12T12:00:00.000Z",
      });

      expect(getParkingState(session, NOW)).toBe("stale");
    });
  });

  describe("Core 0.1 confidence compatibility", () => {
    it("requires landmark confirmation below 0.50", () => {
      expect(shouldRequestLandmarkConfirmation(0.49)).toBe(true);
    });

    it("keeps exact 0.50 eligible", () => {
      expect(shouldRequestLandmarkConfirmation(0.5)).toBe(false);
    });

    it("keeps confidence separate from freshness state", () => {
      const session = makeSession({
        capturedAt: "2026-09-04T12:00:00.000Z",
        confidence: 0.91,
      });

      expect(getParkingState(session, NOW)).toBe("stale");
      expect(session.confidence).toBe(0.91);
    });
  });

  describe("schema preservation", () => {
    it("round-trips a valid session without changing stored confidence", () => {
      const session = makeSession({ confidence: 0.77 });
      const normalized = normalizeParkingSession(session);

      expect(normalized).toEqual(session);
      expect(normalized.confidence).toBe(0.77);
    });
  });
});
