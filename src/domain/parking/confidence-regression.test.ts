/**
 * NAVIGRE 2 — Gate 2 — Contract v2 Regression Coverage
 *
 * This suite is intentionally aligned with the canonical Core 0.1 / Gate 2
 * contracts. The pasted historical regression proposal was useful as a
 * semantic checklist, but its API and several assertions do not match the
 * current implementation.
 *
 * Policy C boundary:
 * - stored ParkingSession.confidence is authoritative observation data;
 * - freshness is evaluated independently by parking state / authorization;
 * - the 24-hour calculator remains an experimental calculation primitive;
 * - routing authorization, not the calculator, decides production eligibility.
 */

import { describe, expect, it } from "vitest";

import type { ParkingSession } from "@/domain/parking/types";
import {
  calculateParkingConfidence,
  calculateTimeDecay,
} from "@/domain/confidence/confidence-calculator";
import { getParkingState } from "@/domain/parking/state";
import { authorizeParkingRouting } from "@/domain/parking/routing-authorization";

const NOW = new Date("2026-09-11T12:00:00.000Z");
const ONE_DAY = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * ONE_DAY;

function session(overrides: Partial<ParkingSession> = {}): ParkingSession {
  return {
    id: "confidence-regression-session",
    mallId: "mall-of-africa",
    parkadeId: "parkade-c",
    levelId: "mofa-parking-4",
    landmarkId: "p4-start",
    capturedAt: NOW.toISOString(),
    source: "manual",
    confidence: 1,
    ...overrides,
  };
}

describe("Gate 2 Contract v2 regression coverage", () => {
  describe("Policy C production boundary", () => {
    it("keeps a fresh manual save routable at 1.0 confidence", () => {
      expect(authorizeParkingRouting(session({ confidence: 1 }), NOW)).toEqual({
        allowed: true,
        reason: "eligible",
      });
    });

    it("keeps exactly 0.50 routable", () => {
      expect(authorizeParkingRouting(session({ confidence: 0.5 }), NOW)).toEqual({
        allowed: true,
        reason: "eligible",
      });
    });

    it("blocks 0.49 confidence", () => {
      expect(authorizeParkingRouting(session({ confidence: 0.49 }), NOW)).toEqual({
        allowed: false,
        reason: "low_confidence",
      });
    });

    it("blocks a manual observation at the exact seven-day stale boundary", () => {
      const capturedAt = new Date(NOW.getTime() - SEVEN_DAYS).toISOString();
      expect(
        getParkingState(session({ capturedAt }), NOW),
      ).toBe("stale");
      expect(
        authorizeParkingRouting(session({ capturedAt }), NOW),
      ).toEqual({ allowed: false, reason: "stale" });
    });

    it("blocks GPS as an independent production routing authority", () => {
      expect(
        authorizeParkingRouting(session({ source: "gps", confidence: 1 }), NOW),
      ).toEqual({ allowed: false, reason: "low_confidence" });
    });

    it("keeps visual observations fail closed", () => {
      expect(
        authorizeParkingRouting(session({ source: "visual", confidence: 1 }), NOW),
      ).toEqual({ allowed: false, reason: "unsupported_source" });
    });

    it("fails closed for invalid and future temporal data", () => {
      expect(
        authorizeParkingRouting(
          session({ capturedAt: "not-a-date" as ParkingSession["capturedAt"] }),
          NOW,
        ),
      ).toEqual({ allowed: false, reason: "stale" });

      expect(
        authorizeParkingRouting(
          session({ capturedAt: new Date(NOW.getTime() + ONE_DAY).toISOString() }),
          NOW,
        ),
      ).toEqual({ allowed: false, reason: "stale" });
    });
  });

  describe("Experimental 24-hour decay primitive", () => {
    it("retains the deterministic half-life calculation without making it production policy", () => {
      const oneDayAgo = new Date(NOW.getTime() - ONE_DAY).toISOString();
      expect(calculateTimeDecay(oneDayAgo, NOW)).toBeCloseTo(0.5, 10);

      // The calculator uses authorized source weights. BLE is 0.85, so after
      // one half-life its experimental effective value is 0.425.
      expect(
        calculateParkingConfidence(
          { source: "ble", capturedAt: oneDayAgo },
          NOW,
        ),
      ).toBeCloseTo(0.425, 3);
    });

    it("does not confuse calculator decay with stored manual confidence", () => {
      const twoDaysAgo = new Date(NOW.getTime() - 2 * ONE_DAY).toISOString();
      const stored = session({ capturedAt: twoDaysAgo, confidence: 1 });

      // Stored confidence remains unchanged under Policy C.
      expect(stored.confidence).toBe(1);
      expect(authorizeParkingRouting(stored, NOW)).toEqual({
        allowed: true,
        reason: "eligible",
      });

      // The experimental calculator may independently produce a decayed
      // value; it is deliberately not the production authorization authority.
      expect(
        calculateParkingConfidence({ source: "manual", capturedAt: twoDaysAgo }, NOW),
      ).toBeCloseTo(0.25, 3);
    });
  });
});
