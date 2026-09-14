import { describe, expect, it } from "vitest";
import { resolveLocalization } from "./resolve";
import type { LocationObservation } from "./types";

const observation = (overrides: Partial<LocationObservation> = {}): LocationObservation => ({
  id: "obs-1",
  mallId: "mofa",
  levelId: "level-4",
  nodeId: "p4-start",
  source: "manual",
  confidence: 0.9,
  capturedAt: "2026-09-14T09:00:00.000Z",
  ...overrides,
});

describe("resolveLocalization", () => {
  it("returns unresolved when there are no observations", () => {
    expect(resolveLocalization([]).state).toBe("unresolved");
  });

  it("resolves an unambiguous high-confidence node", () => {
    const result = resolveLocalization([observation()]);
    expect(result).toMatchObject({ mallId: "mofa", levelId: "level-4", nodeId: "p4-start", confidence: 0.9, state: "resolved" });
  });

  it("keeps low-confidence node evidence as a candidate", () => {
    const result = resolveLocalization([observation({ confidence: 0.49 })]);
    expect(result).toMatchObject({ nodeId: "p4-start", confidence: 0.49, state: "candidate" });
  });

  it("fails closed on conflicting mall identities", () => {
    const result = resolveLocalization([observation(), observation({ id: "obs-2", mallId: "other-mall" })]);
    expect(result.state).toBe("unresolved");
    expect(result.nodeId).toBeUndefined();
  });

  it("fails closed on conflicting known floors", () => {
    const result = resolveLocalization([observation(), observation({ id: "obs-2", levelId: "level-5" })]);
    expect(result.state).toBe("unresolved");
    expect(result.nodeId).toBeUndefined();
  });

  it("fails closed on conflicting node candidates", () => {
    const result = resolveLocalization([observation(), observation({ id: "obs-2", nodeId: "p4-lift" })]);
    expect(result.state).toBe("unresolved");
    expect(result.nodeId).toBeUndefined();
  });

  it("does not invent a node when observations contain no node identity", () => {
    const result = resolveLocalization([observation({ nodeId: undefined })]);
    expect(result.state).toBe("unresolved");
    expect(result.nodeId).toBeUndefined();
  });

  it("selects the strongest unambiguous observation without changing graph data", () => {
    const observations = [observation({ confidence: 0.7 }), observation({ id: "obs-2", confidence: 0.95 })];
    const before = structuredClone(observations);
    const result = resolveLocalization(observations);
    expect(result.nodeId).toBe("p4-start");
    expect(result.confidence).toBe(0.95);
    expect(observations).toEqual(before);
  });
});
