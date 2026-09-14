import type { LocationObservation } from "./types";
import {
  assessLocalizationFreshness,
  type LocalizationFreshnessPolicy,
} from "./freshness";

export type TemporalLocalizationState = "fresh" | "stale" | "conflicting" | "unresolved";

export type TemporalLocalizationResult = {
  state: TemporalLocalizationState;
  observation?: LocationObservation;
  confidence: number;
};

/**
 * Temporal gate for localization claims. Freshness is evaluated before
 * confidence, and contradictions among current evidence fail closed.
 */
export function resolveTemporalLocalization(
  observations: LocationObservation[],
  nowMs: number,
  policy?: LocalizationFreshnessPolicy,
): TemporalLocalizationResult {
  if (observations.length === 0) {
    return { state: "unresolved", confidence: 0 };
  }

  const fresh = observations.filter(
    (observation) => assessLocalizationFreshness(observation, nowMs, policy).freshness === "fresh",
  );

  if (fresh.length === 0) {
    const confidence = Math.max(...observations.map((observation) => observation.confidence));
    return { state: "stale", confidence };
  }

  const mallIds = new Set(fresh.map((observation) => observation.mallId));
  if (mallIds.size > 1) {
    return { state: "conflicting", confidence: Math.max(...fresh.map((observation) => observation.confidence)) };
  }

  const knownLevels = new Set(fresh.map((observation) => observation.levelId).filter(Boolean));
  if (knownLevels.size > 1) {
    return { state: "conflicting", confidence: Math.max(...fresh.map((observation) => observation.confidence)) };
  }

  const knownNodes = new Set(fresh.map((observation) => observation.nodeId).filter(Boolean));
  if (knownNodes.size > 1) {
    return { state: "conflicting", confidence: Math.max(...fresh.map((observation) => observation.confidence)) };
  }

  const selected = [...fresh].sort((a, b) => {
    const timestampDelta = Date.parse(b.capturedAt) - Date.parse(a.capturedAt);
    if (timestampDelta !== 0) return timestampDelta;
    return b.confidence - a.confidence;
  })[0];

  if (!selected?.nodeId) {
    return { state: "unresolved", confidence: selected?.confidence ?? 0 };
  }

  return {
    state: "fresh",
    observation: selected,
    confidence: selected.confidence,
  };
}
