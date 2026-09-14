import type { LocationObservation } from "./types";
import {
  DEFAULT_LOCALIZATION_FRESHNESS_POLICY,
  resolveTemporalLocalization,
  type LocalizationFreshnessPolicy,
} from "./temporal";

export type LocalizationState = "fresh" | "stale" | "conflicting" | "unresolved";

export type LocalizationResult = {
  state: LocalizationState;
  observation?: LocationObservation;
  confidence: number;
};

/**
 * Public observation-to-localization boundary.
 *
 * The state is explicit and discriminating: callers cannot mistake a
 * boolean-valid result for a specific temporal/identity condition.
 * This function is pure, read-only, and never establishes route verification.
 */
export function resolveLocalization(
  observations: LocationObservation[],
  nowMs: number,
  policy: LocalizationFreshnessPolicy = DEFAULT_LOCALIZATION_FRESHNESS_POLICY,
): LocalizationResult {
  return resolveTemporalLocalization(observations, nowMs, policy);
}
