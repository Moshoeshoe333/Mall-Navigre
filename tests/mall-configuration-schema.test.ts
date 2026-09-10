import { describe, expect, it } from "vitest";
import { MallConfigurationSchema } from "@/data/schemas/MallConfiguration.schema";

describe("MallConfigurationSchema", () => {
  it("accepts the minimal pilot configuration shape", () => {
    const result = MallConfigurationSchema.safeParse({
      schemaVersion: 1,
      mall: {
        id: "mall-of-africa",
        name: "Mall of Africa",
        status: "unverified",
        source: "pilot-schematic",
        verifiedAt: null,
      },
      levels: [{
        id: "level-4",
        mallId: "mall-of-africa",
        name: "Level 4",
        floorNumber: 4,
        status: "unverified",
      }],
      nodes: [{
        id: "p4-start",
        mallId: "mall-of-africa",
        levelId: "level-4",
        parkadeId: "parkade-c",
        type: "parking",
        name: "Parking start",
        position: { x: 0, y: 0 },
        accessible: true,
        status: "unverified",
      }],
      edges: [],
      places: [],
      visualLandmarks: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an edge with no distance", () => {
    const result = MallConfigurationSchema.safeParse({
      schemaVersion: 1,
      mall: { id: "m", name: "Mall", status: "unverified", source: "test", verifiedAt: null },
      levels: [],
      nodes: [],
      edges: [{
        id: "e1",
        fromNodeId: "a",
        toNodeId: "b",
        distanceMeters: -1,
        accessible: true,
        movement: "walk",
        bidirectional: true,
        status: "unverified",
      }],
      places: [],
      visualLandmarks: [],
    });

    expect(result.success).toBe(false);
  });
});
