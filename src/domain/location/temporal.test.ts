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
    const stale = observation({ confidence: 0.99, capturedAt: new Date(NOW - 10_000).toISOString() });
    const result = resolveTemporalLocalization([stale], NOW);
    expect(result.state).toBe("stale");
    expect(result.observation).toBeUndefined();
  });

  it("CONFLICTING: fresh mall identities cannot be resolved by confidence", () => {
    const a = observation({ mallId: "mall-a", confidence: 0.99 });
    const b = observation({ mallId: "mall-b", capturedAt: new Date(NOW - 500).toISOString(), confidence: 0.55 });
    const result = resolveTemporalLocalization([a, b], NOW);
    expect(result.state).toBe("conflicting");
    expect(result.observation).toBeUndefined();
  });

  it("CONFLICTING: fresh floor identities cannot be resolved by recency", () => {
    const a = observation({ levelId: "level-1", confidence: 0.99 });
    const b = observation({ levelId: "level-2", capturedAt: new Date(NOW - 500).toISOString(), confidence: 0.55 });
    const result = resolveTemporalLocalization([a, b], NOW);
    expect(result.state).toBe("conflicting");
    expect(result.observation).toBeUndefined();
  });

  it("CONFLICTING: fresh node identities cannot be resolved by confidence", () => {
    const a = observation({ nodeId: "node-a", confidence: 0.99 });
    const b = observation({ nodeId: "node-b", capturedAt: new Date(NOW - 500).toISOString(), confidence: 0.55 });
    const result = resolveTemporalLocalization([a, b], NOW);
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

  it("future-dated observations do not become fresh evidence", () => {
    const result = resolveTemporalLocalization([observation({ capturedAt: new Date(NOW + 1).toISOString() })], NOW);
    expect(result.state).toBe("stale");
    expect(result.observation).toBeUndefined();
  });

  it("stale conflicting observations remain stale rather than becoming a current conflict", () => {
    const a = observation({ mallId: "mall-a", capturedAt: new Date(NOW - 10_000).toISOString() });
    const b = observation({ mallId: "mall-b", capturedAt: new Date(NOW - 11_000).toISOString() });
    expect(resolveTemporalLocalization([a, b], NOW).state).toBe("stale");
  });

  it("timestamp policy cannot mutate the observation or imply route verification", () => {
    const source = observation({ capturedAt: new Date(NOW - 10_000).toISOString() });
    const before = structuredClone(source);
    const result = resolveTemporalLocalization([source], NOW);
    expect(source).toEqual(before);
    expect(result).not.toHaveProperty("verified");
  });
});
