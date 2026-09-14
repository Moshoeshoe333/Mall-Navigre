import type { LocationObservation } from "./types";

export type LocalizationState = "unresolved" | "candidate" | "resolved";

export type LocalizationResult = {
  mallId: string;
  levelId?: string;
  nodeId?: string;
  confidence: number;
  source: LocationObservation["source"];
  capturedAt: string;
  state: LocalizationState;
};

/**
 * Pure boundary resolver: observations are interpreted, never used to mutate the graph.
 * Only an unambiguous observation can become a resolved node claim.
 */
export function resolveLocalization(observations: LocationObservation[]): LocalizationResult {
  if (observations.length === 0) {
    return {
      mallId: "unknown",
      confidence: 0,
      source: "manual",
      capturedAt: new Date(0).toISOString(),
      state: "unresolved",
    };
  }

  const mallIds = new Set(observations.map((o) => o.mallId));
  if (mallIds.size !== 1) {
    return unresolved(observations);
  }

  const knownLevels = new Set(observations.map((o) => o.levelId).filter((v): v is string => Boolean(v)));
  if (knownLevels.size > 1) {
    return unresolved(observations);
  }

  const candidates = observations.filter((o) => Boolean(o.nodeId));
  if (candidates.length === 0) {
    return unresolved(observations);
  }

  const nodeIds = new Set(candidates.map((o) => o.nodeId));
  if (nodeIds.size > 1) {
    return unresolved(observations);
  }

  const best = [...candidates].sort((a, b) => b.confidence - a.confidence)[0];
  const state: LocalizationState = best.confidence >= 0.5 ? "resolved" : "candidate";
  return {
    mallId: best.mallId,
    ...(best.levelId ? { levelId: best.levelId } : {}),
    nodeId: best.nodeId,
    confidence: best.confidence,
    source: best.source,
    capturedAt: best.capturedAt,
    state,
  };
}

function unresolved(observations: LocationObservation[]): LocalizationResult {
  const best = [...observations].sort((a, b) => b.confidence - a.confidence)[0];
  return {
    mallId: best.mallId,
    ...(best.levelId ? { levelId: best.levelId } : {}),
    confidence: best.confidence,
    source: best.source,
    capturedAt: best.capturedAt,
    state: "unresolved",
  };
}
