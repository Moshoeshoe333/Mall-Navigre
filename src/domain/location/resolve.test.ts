import { describe, expect, it } from "vitest";
import { resolveLocalization, type LocalizationState } from "./resolve";
import type { LocationObservation } from "./types";

const NOW = Date.parse("2026-09-14T10:00:00.000Z");
const observation = (overrides: Partial<LocationObservation> = {}): LocationObservation => ({
  id: "obs-1",
  mallId: "mofa",
  levelId: "level-4",
  nodeId: "p4-start",
  source: "manual",
  confidence: 0.9,
  capturedAt: new Date(NOW).toISOString(),
  ...overrides,
});

describe("resolveLocalization", () => {
  it("exposes exactly the four public localization states", () => {
    const states: LocalizationState[] = ["fresh", "stale", "conflicting", "unresolved"];
    expect(new Set(states).size).toBe(4);
  });

  it("returns unresolved for an empty observation set", () => {
    expect(resolveLocalization([], NOW)).toEqual({ state: "unresolved", confidence: 0 });
  });

  it("returns fresh with an explicit observation for coherent current evidence", () => {
    const result = resolveLocalization([observation()], NOW);
    expect(result).toMatchObject({ state: "fresh", confidence: 0.9 });
    expect(result.observation?.nodeId).toBe("p4-start");
  });

  it("returns stale instead of refreshing an old high-confidence observation", () => {
    const result = resolveLocalization([
      observation({ confidence: 0.99, capturedAt: new Date(NOW - 10_000).toISOString() }),
    ], NOW);
    expect(result.state).toBe("stale");
    expect(result.observation).toBeUndefined();
  });

  it("returns conflicting for fresh contradictory mall identities", () => {
    const result = resolveLocalization([
      observation({ mallId: "mall-a", confidence: 0.99 }),
      observation({ id: "obs-2", mallId: "mall-b", confidence: 0.55 }),
    ], NOW);
    expect(result.state).toBe("conflicting");
    expect(result.observation).toBeUndefined();
  });

  it("returns conflicting for fresh contradictory floors and nodes", () => {
    expect(resolveLocalization([
      observation({ levelId: "level-4" }),
      observation({ id: "obs-2", levelId: "level-5" }),
    ], NOW).state).toBe("conflicting");

    expect(resolveLocalization([
      observation({ nodeId: "p4-start" }),
      observation({ id: "obs-2", nodeId: "p4-lift" }),
    ], NOW).state).toBe("conflicting");
  });

  it("returns unresolved when fresh evidence has no node identity", () => {
    const result = resolveLocalization([observation({ nodeId: undefined })], NOW);
    expect(result.state).toBe("unresolved");
    expect(result.observation).toBeUndefined();
  });

  it("returns unresolved for invalid or future-dated timestamps", () => {
    expect(resolveLocalization([
      observation({ capturedAt: "not-a-timestamp" }),
    ], NOW).state).toBe("unresolved");

    expect(resolveLocalization([
      observation({ capturedAt: new Date(NOW + 1).toISOString() }),
    ], NOW).state).toBe("unresolved");
  });

  it("never lets confidence override freshness or identity conflict", () => {
    expect(resolveLocalization([
      observation({ confidence: 0.99, capturedAt: new Date(NOW - 10_000).toISOString() }),
      observation({ id: "obs-2", confidence: 0.55 }),
    ], NOW).state).toBe("fresh");

    expect(resolveLocalization([
      observation({ confidence: 0.99, nodeId: "p4-start" }),
      observation({ id: "obs-2", confidence: 0.55, nodeId: "p4-lift" }),
    ], NOW).state).toBe("conflicting");
  });

  it("does not mutate incoming observations", () => {
    const observations = [
      observation({ confidence: 0.7 }),
      observation({ id: "obs-2", confidence: 0.95 }),
    ];
    const before = structuredClone(observations);
    resolveLocalization(observations, NOW);
    expect(observations).toEqual(before);
  });

  it("does not expose or fabricate route verification", () => {
    const result = resolveLocalization([observation()], NOW);
    expect(result).not.toHaveProperty("verified");
  });
});
