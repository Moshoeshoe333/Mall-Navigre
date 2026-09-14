import type { LocationObservation } from "./types";
import {
  DEFAULT_LOCALIZATION_FRESHNESS_POLICY,
  type LocalizationFreshnessPolicy,
} from "./freshness";
import { resolveTemporalLocalization } from "./temporal";

export type LocalizationState = "fresh" | "stale" | "conflicting" | "unresolved";

export type LocalizationResult = {
  state: LocalizationState;
  mallId?: string;
  levelId?: string;
  nodeId?: string;
  observation?: LocationObservation;
  confidence: number;
  source?: LocationObservation["source"];
  capturedAt?: string;
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
  const result = resolveTemporalLocalization(observations, nowMs, policy);

  if (!result.observation) {
    return { state: result.state, confidence: result.confidence };
  }

  return {
    state: result.state,
    mallId: result.observation.mallId,
    ...(result.observation.levelId ? { levelId: result.observation.levelId } : {}),
    ...(result.observation.nodeId ? { nodeId: result.observation.nodeId } : {}),
    observation: result.observation,
    confidence: result.confidence,
    source: result.observation.source,
    capturedAt: result.observation.capturedAt,
  };
}
