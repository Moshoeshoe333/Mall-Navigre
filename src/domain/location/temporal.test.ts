import { describe, expect, it } from "vitest";
import type { LocationObservation } from "./types";
import { resolveTemporalLocalization } from "./temporal";

const NOW = Date.parse("2026-09-14T10:00:00.000Z");
const observation = (overrides: Partial<LocationObservation> = {}): LocationObservation => ({
  id: "obs-1",
  mallId: "mall-a",
  levelId: "level-1",
  nodeId: "node-a",
  source: "manual",
  confidence: 0.55,
  capturedAt: new Date(NOW).toISOString(),
  ...overrides,
});

describe("temporal localization contract", () => {
  it("FRESH: selects current, unambiguous evidence", () => {
    const result = resolveTemporalLocalization([
      observation({ id: "old", capturedAt: new Date(NOW - 1_000).toISOString(), confidence: 0.99 }),
      observation({ id: "new", capturedAt: new Date(NOW - 500).toISOString(), confidence: 0.55 }),
    ], NOW);
    expect(result.state).toBe("fresh");
    expect(result.observation?.id).toBe("new");
  });

  it("STALE: rejects an old high-confidence observation instead of refreshing it", () => {
    const result = resolveTemporalLocalization([
      observation({ confidence: 0.99, capturedAt: new Date(NOW - 10_000).toISOString() }),
    ], NOW);
    expect(result.state).toBe("stale");
    expect(result.observation).toBeUndefined();
  });

  it("CONFLICTING: fresh mall identities cannot be resolved by confidence", () => {
    const result = resolveTemporalLocalization([
      observation({ mallId: "mall-a", confidence: 0.99 }),
      observation({ mallId: "mall-b", capturedAt: new Date(NOW - 500).toISOString(), confidence: 0.55 }),
    ], NOW);
    expect(result.state).toBe("conflicting");
    expect(result.observation).toBeUndefined();
  });

  it("CONFLICTING: fresh floor identities cannot be resolved by recency", () => {
    const result = resolveTemporalLocalization([
      observation({ levelId: "level-1", confidence: 0.99 }),
      observation({ levelId: "level-2", capturedAt: new Date(NOW - 500).toISOString(), confidence: 0.55 }),
    ], NOW);
    expect(result.state).toBe("conflicting");
    expect(result.observation).toBeUndefined();
  });

  it("CONFLICTING: fresh node identities cannot be resolved by confidence", () => {
    const result = resolveTemporalLocalization([
      observation({ nodeId: "node-a", confidence: 0.99 }),
      observation({ nodeId: "node-b", capturedAt: new Date(NOW - 500).toISOString(), confidence: 0.55 }),
    ], NOW);
    expect(result.state).toBe("conflicting");
    expect(result.observation).toBeUndefined();
  });

  it("UNRESOLVED: no observations produce no location claim", () => {
    expect(resolveTemporalLocalization([], NOW)).toEqual({ state: "unresolved", confidence: 0 });
  });

  it("UNRESOLVED: fresh evidence without a node identity cannot manufacture one", () => {
    const result = resolveTemporalLocalization([observation({ nodeId: undefined })], NOW);
    expect(result.state).toBe("unresolved");
    expect(result.observation).toBeUndefined();
  });

  it("UNRESOLVED: future-dated evidence is invalid and cannot become fresh", () => {
    const result = resolveTemporalLocalization([
      observation({ capturedAt: new Date(NOW + 1).toISOString() }),
    ], NOW);
    expect(result.state).toBe("unresolved");
    expect(result.observation).toBeUndefined();
  });

  it("STALE: stale conflicting observations do not become a current conflict", () => {
    const result = resolveTemporalLocalization([
      observation({ mallId: "mall-a", capturedAt: new Date(NOW - 10_000).toISOString() }),
      observation({ mallId: "mall-b", capturedAt: new Date(NOW - 11_000).toISOString() }),
    ], NOW);
    expect(result.state).toBe("stale");
  });

  it("preserves observations and never produces route verification state", () => {
    const source = observation({ capturedAt: new Date(NOW - 10_000).toISOString() });
    const before = structuredClone(source);
    const result = resolveTemporalLocalization([source], NOW);
    expect(source).toEqual(before);
    expect(result).not.toHaveProperty("verified");
  });
});
