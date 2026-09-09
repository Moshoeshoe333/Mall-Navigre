import { describe, expect, it } from "vitest";
import { ParkingSessionSchema } from "@/domain/parking/types";

describe("ParkingSession contract", () => {
  const valid = {
    id: "session-1", mallId: "mall-of-africa", parkadeId: "parkade-c", levelId: "mofa-parking-4",
    capturedAt: "2026-09-09T12:00:00.000Z", source: "manual", confidence: 0.95,
  };

  it("requires parkade and level identity", () => {
    expect(ParkingSessionSchema.safeParse({ ...valid, parkadeId: undefined }).success).toBe(false);
    expect(ParkingSessionSchema.safeParse({ ...valid, levelId: undefined }).success).toBe(false);
  });

  it("rejects confidence outside 0..1", () => {
    expect(ParkingSessionSchema.safeParse({ ...valid, confidence: -0.01 }).success).toBe(false);
    expect(ParkingSessionSchema.safeParse({ ...valid, confidence: 1.01 }).success).toBe(false);
  });
});
