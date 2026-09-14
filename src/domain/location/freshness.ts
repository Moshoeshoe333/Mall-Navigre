import type { LocationObservation } from "./types";

export type LocalizationFreshness = "fresh" | "stale" | "invalid";

export type LocalizationFreshnessPolicy = {
  maxAgeMs: number;
  maxFutureSkewMs?: number;
};

export const DEFAULT_LOCALIZATION_FRESHNESS_POLICY: LocalizationFreshnessPolicy = {
  maxAgeMs: 5_000,
  maxFutureSkewMs: 0,
};

export type LocalizationFreshnessAssessment = {
  freshness: LocalizationFreshness;
  ageMs: number;
};

/**
 * Pure temporal gate. `nowMs` is injected so tests and callers never depend on
 * wall-clock timing hidden inside the resolver.
 */
export function assessLocalizationFreshness(
  observation: LocationObservation,
  nowMs: number,
  policy: LocalizationFreshnessPolicy = DEFAULT_LOCALIZATION_FRESHNESS_POLICY,
): LocalizationFreshnessAssessment {
  if (!Number.isFinite(nowMs) || !Number.isFinite(policy.maxAgeMs) || policy.maxAgeMs < 0) {
    return { freshness: "invalid", ageMs: Number.NaN };
  }

  const capturedMs = Date.parse(observation.capturedAt);
  if (!Number.isFinite(capturedMs)) {
    return { freshness: "invalid", ageMs: Number.NaN };
  }

  const maxFutureSkewMs = policy.maxFutureSkewMs ?? 0;
  if (!Number.isFinite(maxFutureSkewMs) || maxFutureSkewMs < 0) {
    return { freshness: "invalid", ageMs: Number.NaN };
  }

  const ageMs = nowMs - capturedMs;
  if (ageMs < -maxFutureSkewMs) {
    return { freshness: "invalid", ageMs };
  }

  return {
    freshness: ageMs <= policy.maxAgeMs ? "fresh" : "stale",
    ageMs,
  };
}

export function resolveFreshestUnambiguousObservation(
  observations: LocationObservation[],
  nowMs: number,
  policy: LocalizationFreshnessPolicy = DEFAULT_LOCALIZATION_FRESHNESS_POLICY,
): LocationObservation | undefined {
  const assessed = observations
    .map((observation) => ({
      observation,
      assessment: assessLocalizationFreshness(observation, nowMs, policy),
    }))
    .filter(({ assessment }) => assessment.freshness === "fresh")
    .sort((a, b) => {
      const capturedDelta = Date.parse(b.observation.capturedAt) - Date.parse(a.observation.capturedAt);
      if (capturedDelta !== 0) return capturedDelta;
      return b.observation.confidence - a.observation.confidence;
    });

  return assessed[0]?.observation;
}
