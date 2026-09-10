import { describe, expect, it } from "vitest";

import type { ParkingSession } from "@/domain/parking/types";

import {
  CONFIDENCE_HALF_LIFE_MS,
  PARKING_ROUTING_CONFIDENCE_THRESHOLD,
  PARKING_SOURCE_CONFIDENCE,
  calculateParkingConfidence,
  calculateTimeDecay,
  getSourceConfidence,
  isParkingRoutingAllowed,
} from "@/domain/confidence/confidence-calculator";

const NOW = new Date("2026-09-10T12:00:00.000Z");

function makeObservation(
  overrides: Partial<ParkingSession> = {},
): Pick<ParkingSession, "source" | "capturedAt" | "updatedAt"> {
  return {
    source: "manual",
    capturedAt: "2026-09-10T12:00:00.000Z",
    ...overrides,
  };
}

describe("Gate 2 — parking confidence calculator", () => {
  describe("source confidence weights", () => {
    it("uses the authorized manual weight", () => {
      expect(getSourceConfidence("manual")).toBe(
        PARKING_SOURCE_CONFIDENCE.manual,
      );
      expect(getSourceConfidence("manual")).toBe(1.0);
    });

    it("uses the authorized BLE weight", () => {
      expect(getSourceConfidence("ble")).toBe(
        PARKING_SOURCE_CONFIDENCE.ble,
      );
      expect(getSourceConfidence("ble")).toBe(0.85);
    });

    it("uses the authorized Wi-Fi weight", () => {
      expect(getSourceConfidence("wifi")).toBe(
        PARKING_SOURCE_CONFIDENCE.wifi,
      );
      expect(getSourceConfidence("wifi")).toBe(0.7);
    });

    it("uses the authorized GPS weight", () => {
      expect(getSourceConfidence("gps")).toBe(
        PARKING_SOURCE_CONFIDENCE.gps,
      );
      expect(getSourceConfidence("gps")).toBe(0.4);
    });

    it("fails closed for the currently unweighted visual source", () => {
      expect(getSourceConfidence("visual")).toBe(0);
    });
  });

  describe("temporal decay", () => {
    it("returns full decay at observation time", () => {
      expect(
        calculateTimeDecay("2026-09-10T12:00:00.000Z", NOW),
      ).toBe(1);
    });

    it("returns 0.5 after one half-life", () => {
      const observedAt = new Date(
        NOW.getTime() - CONFIDENCE_HALF_LIFE_MS,
      ).toISOString();

      expect(calculateTimeDecay(observedAt, NOW)).toBeCloseTo(0.5, 10);
    });

    it("returns 0.25 after two half-lives", () => {
      const observedAt = new Date(
        NOW.getTime() - CONFIDENCE_HALF_LIFE_MS * 2,
      ).toISOString();

      expect(calculateTimeDecay(observedAt, NOW)).toBeCloseTo(0.25, 10);
    });

    it("clamps future timestamps so decay cannot exceed 1", () => {
      expect(
        calculateTimeDecay("2026-09-11T12:00:00.000Z", NOW),
      ).toBe(1);
    });

    it("fails closed for an invalid observation timestamp", () => {
      expect(calculateTimeDecay("not-a-date", NOW)).toBe(0);
    });
  });

  describe("parking confidence", () => {
    it("returns full manual confidence at capture time", () => {
      expect(
        calculateParkingConfidence(
          makeObservation({ source: "manual" }),
          NOW,
        ),
      ).toBe(1);
    });

    it("returns full BLE confidence at capture time", () => {
      expect(
        calculateParkingConfidence(
          makeObservation({ source: "ble" }),
          NOW,
        ),
      ).toBe(0.85);
    });

    it("returns full Wi-Fi confidence at capture time", () => {
      expect(
        calculateParkingConfidence(
          makeObservation({ source: "wifi" }),
          NOW,
        ),
      ).toBe(0.7);
    });

    it("returns full GPS confidence at capture time", () => {
      expect(
        calculateParkingConfidence(
          makeObservation({ source: "gps" }),
          NOW,
        ),
      ).toBe(0.4);
    });

    it("keeps GPS strictly below the routing threshold", () => {
      const confidence = calculateParkingConfidence(
        makeObservation({ source: "gps" }),
        NOW,
      );

      expect(confidence).toBeLessThan(
        PARKING_ROUTING_CONFIDENCE_THRESHOLD,
      );
    });

    it("returns zero for the currently unweighted visual source", () => {
      expect(
        calculateParkingConfidence(
          makeObservation({ source: "visual" }),
          NOW,
        ),
      ).toBe(0);
    });

    it("uses updatedAt when available", () => {
      const confidence = calculateParkingConfidence(
        makeObservation({
          source: "manual",
          capturedAt: "2026-09-08T12:00:00.000Z",
          updatedAt: "2026-09-10T12:00:00.000Z",
        }),
        NOW,
      );

      expect(confidence).toBe(1);
    });

    it("falls back to capturedAt when updatedAt is absent", () => {
      const capturedAt = new Date(
        NOW.getTime() - CONFIDENCE_HALF_LIFE_MS,
      ).toISOString();

      expect(
        calculateParkingConfidence(
          makeObservation({
            source: "manual",
            capturedAt,
            updatedAt: undefined,
          }),
          NOW,
        ),
      ).toBeCloseTo(0.5, 10);
    });

    it("decays manual confidence deterministically after one day", () => {
      const capturedAt = new Date(
        NOW.getTime() - CONFIDENCE_HALF_LIFE_MS,
      ).toISOString();

      expect(
        calculateParkingConfidence(
          makeObservation({ source: "manual", capturedAt }),
          NOW,
        ),
      ).toBeCloseTo(0.5, 10);
    });

    it("decays BLE confidence deterministically after one day", () => {
      const capturedAt = new Date(
        NOW.getTime() - CONFIDENCE_HALF_LIFE_MS,
      ).toISOString();

      expect(
        calculateParkingConfidence(
          makeObservation({ source: "ble", capturedAt }),
          NOW,
        ),
      ).toBeCloseTo(0.425, 10);
    });

    it("decays Wi-Fi confidence deterministically after one day", () => {
      const capturedAt = new Date(
        NOW.getTime() - CONFIDENCE_HALF_LIFE_MS,
      ).toISOString();

      expect(
        calculateParkingConfidence(
          makeObservation({ source: "wifi", capturedAt }),
          NOW,
        ),
      ).toBeCloseTo(0.35, 10);
    });

    it("decays GPS confidence deterministically after one day", () => {
      const capturedAt = new Date(
        NOW.getTime() - CONFIDENCE_HALF_LIFE_MS,
      ).toISOString();

      expect(
        calculateParkingConfidence(
          makeObservation({ source: "gps", capturedAt }),
          NOW,
        ),
      ).toBeCloseTo(0.2, 10);
    });

    it("never exceeds the authorized source weight", () => {
      expect(
        calculateParkingConfidence(
          makeObservation({
            source: "manual",
            capturedAt: "2026-09-11T12:00:00.000Z",
          }),
          NOW,
        ),
      ).toBeLessThanOrEqual(1);
    });

    it("always stays within the [0, 1] invariant", () => {
      const sources: ParkingSession["source"][] = [
        "manual",
        "ble",
        "wifi",
        "gps",
        "visual",
      ];

      for (const source of sources) {
        const confidence = calculateParkingConfidence(
          makeObservation({ source }),
          NOW,
        );

        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("routing policy", () => {
    it("allows routing at exactly the threshold", () => {
      expect(
        isParkingRoutingAllowed(PARKING_ROUTING_CONFIDENCE_THRESHOLD),
      ).toBe(true);
    });

    it("allows routing above the threshold", () => {
      expect(isParkingRoutingAllowed(0.51)).toBe(true);
      expect(isParkingRoutingAllowed(0.7)).toBe(true);
      expect(isParkingRoutingAllowed(1)).toBe(true);
    });

    it("rejects confidence below the threshold", () => {
      expect(isParkingRoutingAllowed(0.49)).toBe(false);
      expect(isParkingRoutingAllowed(0.4)).toBe(false);
      expect(isParkingRoutingAllowed(0)).toBe(false);
    });

    it("rejects NaN", () => {
      expect(isParkingRoutingAllowed(Number.NaN)).toBe(false);
    });

    it("rejects positive infinity", () => {
      expect(isParkingRoutingAllowed(Number.POSITIVE_INFINITY)).toBe(false);
    });

    it("rejects negative infinity", () => {
      expect(isParkingRoutingAllowed(Number.NEGATIVE_INFINITY)).toBe(false);
    });
  });
});
