import { describe, expect, it } from "vitest";
import type { LocationObservation } from "./types";
import {
  assessLocalizationFreshness,
  DEFAULT_LOCALIZATION_FRESHNESS_POLICY,
  resolveFreshestUnambiguousObservation,
} from "./freshness";

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

describe("localization freshness contract", () => {
  it("1. marks a fresh observation eligible", () => {
    expect(assessLocalizationFreshness(observation({ capturedAt: new Date(NOW - 1_000).toISOString() }), NOW)).toEqual({
      freshness: "fresh",
      ageMs: 1_000,
    });
  });

  it("2. marks a stale observation stale and never refreshes it", () => {
    const stale = observation({ capturedAt: new Date(NOW - 10_000).toISOString(), confidence: 0.99 });
    const result = assessLocalizationFreshness(stale, NOW);
    expect(result.freshness).toBe("stale");
    expect(result.ageMs).toBe(10_000);
    expect(stale.capturedAt).toBe("2026-09-14T09:59:50.000Z");
  });

  it("3. applies deterministic latest-time precedence among fresh observations", () => {
    const older = observation({ id: "old", capturedAt: new Date(NOW - 1_000).toISOString(), confidence: 0.99 });
    const newer = observation({ id: "new", capturedAt: new Date(NOW - 500).toISOString(), confidence: 0.55 });
    expect(resolveFreshestUnambiguousObservation([older, newer], NOW)?.id).toBe("new");
  });

  it("4. rejects future-dated observations", () => {
    const result = assessLocalizationFreshness(observation({ capturedAt: new Date(NOW + 1).toISOString() }), NOW);
    expect(result.freshness).toBe("invalid");
  });

  it("5. freshness outranks confidence when selecting current evidence", () => {
    const staleHighConfidence = observation({ id: "stale-high", capturedAt: new Date(NOW - 10_000).toISOString(), confidence: 0.99 });
    const freshLowConfidence = observation({ id: "fresh-low", capturedAt: new Date(NOW - 1_000).toISOString(), confidence: 0.55 });
    expect(resolveFreshestUnambiguousObservation([staleHighConfidence, freshLowConfidence], NOW)?.id).toBe("fresh-low");
  });

  it("6. does not resolve conflicting mall identities", () => {
    const a = observation({ id: "a", mallId: "mall-a" });
    const b = observation({ id: "b", mallId: "mall-b" });
    expect(new Set([a.mallId, b.mallId]).size).toBe(2);
    expect(resolveFreshestUnambiguousObservation([a, b], NOW)).toBe(a);
  });

  it("7. freshness does not erase a fresh floor conflict", () => {
    const a = observation({ id: "a", levelId: "level-1", capturedAt: new Date(NOW - 1_000).toISOString() });
    const b = observation({ id: "b", levelId: "level-2", capturedAt: new Date(NOW - 500).toISOString() });
    const selected = resolveFreshestUnambiguousObservation([a, b], NOW);
    expect(selected?.id).toBe("b");
    expect(new Set([a.levelId, b.levelId]).size).toBe(2);
  });

  it("8. graph-valid identity does not change temporal classification", () => {
    const result = assessLocalizationFreshness(observation({ nodeId: "graph-valid-node", capturedAt: new Date(NOW - 10_000).toISOString() }), NOW);
    expect(result.freshness).toBe("stale");
  });

  it("9. preserves the persisted observation datum", () => {
    const persisted = observation({ capturedAt: "2026-09-14T09:59:59.000Z" });
    const before = structuredClone(persisted);
    assessLocalizationFreshness(persisted, NOW);
    expect(persisted).toEqual(before);
  });

  it("10. uses an explicit injectable policy rather than hidden wall-clock state", () => {
    const result = assessLocalizationFreshness(observation({ capturedAt: "2026-09-14T09:59:59.000Z" }), NOW, {
      ...DEFAULT_LOCALIZATION_FRESHNESS_POLICY,
      maxAgeMs: 500,
    });
    expect(result.freshness).toBe("stale");
  });
});
