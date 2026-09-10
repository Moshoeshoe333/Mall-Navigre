import type { ParkingSession } from "@/domain/parking/types";

/**
 * NAVIGRE 2 — Core 0.2 — Gate 2
 * Confidence Formalization
 *
 * 33×3 Audit
 * ------------
 * EXISTENCE
 * - Every observation source maps to an explicitly authorized confidence weight.
 * - Temporal decay is deterministic.
 * - Result is bounded to [0, 1].
 *
 * COHERENCE
 * - Uses the canonical Core 0.1 ParkingSession source/capture contracts.
 * - Does not duplicate ParkingSourceSchema or ParkingSession.
 * - GPS remains strictly below the routing threshold.
 * - Confidence calculation is separated from routing policy.
 *
 * FAILURE
 * - Unknown/unsupported sources fail closed.
 * - Invalid timestamps do not increase confidence.
 * - Non-finite confidence cannot authorize routing.
 * - Future timestamps are clamped so confidence cannot exceed source weight.
 *
 * Scope
 * -----
 * This module calculates confidence only.
 * It performs no persistence, I/O, routing, mutation, or conflict resolution.
 */

export const PARKING_ROUTING_CONFIDENCE_THRESHOLD = 0.5;

export const CONFIDENCE_HALF_LIFE_MS = 24 * 60 * 60 * 1000;

/**
 * Authoritative Gate 2 source weights.
 *
 * NOTE:
 * "visual" exists in the Core 0.1 domain contract, but no Gate 2
 * confidence weight has been authorized for it yet. It therefore
 * fails closed rather than receiving an invented score.
 */
export const PARKING_SOURCE_CONFIDENCE = {
  manual: 1.0,
  ble: 0.85,
  wifi: 0.7,
  gps: 0.4,
} as const;

export type WeightedParkingSource = keyof typeof PARKING_SOURCE_CONFIDENCE;

/**
 * A confidence observation is deliberately a narrow projection of
 * the canonical ParkingSession rather than a second domain model.
 *
 * Core 0.1 already defines:
 * - source
 * - capturedAt
 * - updatedAt
 *
 * Therefore Gate 2 consumes those existing contracts directly.
 */
export type ParkingObservation = Pick<
  ParkingSession,
  "source" | "capturedAt" | "updatedAt"
>;

/**
 * Return the base confidence associated with an authorized source.
 *
 * Unsupported sources fail closed by returning 0.
 */
export function getSourceConfidence(
  source: ParkingSession["source"],
): number {
  if (source in PARKING_SOURCE_CONFIDENCE) {
    return PARKING_SOURCE_CONFIDENCE[source as WeightedParkingSource];
  }

  return 0;
}

/**
 * Calculate deterministic temporal decay.
 *
 * A 24-hour half-life is used:
 *
 *   decay = 0.5 ^ (elapsed / halfLife)
 *
 * Future timestamps are clamped to zero elapsed time so they cannot
 * create confidence greater than the source's authorized weight.
 *
 * Invalid timestamps fail closed to zero decay.
 */
export function calculateTimeDecay(observedAt: string, now: Date): number {
  const observedTime = new Date(observedAt).getTime();
  const nowTime = now.getTime();

  if (!Number.isFinite(observedTime) || !Number.isFinite(nowTime)) {
    return 0;
  }

  const elapsedMs = Math.max(0, nowTime - observedTime);

  return Math.pow(0.5, elapsedMs / CONFIDENCE_HALF_LIFE_MS);
}

/**
 * Calculate confidence for a parking observation.
 *
 * Temporal reference:
 * - updatedAt when present
 * - otherwise capturedAt
 *
 * This mirrors the Core 0.1 parking-state freshness contract.
 */
export function calculateParkingConfidence(
  observation: ParkingObservation,
  now = new Date(),
): number {
  const sourceConfidence = getSourceConfidence(observation.source);

  if (!Number.isFinite(sourceConfidence) || sourceConfidence <= 0) {
    return 0;
  }

  const observedAt = observation.updatedAt ?? observation.capturedAt;
  const decay = calculateTimeDecay(observedAt, now);
  const confidence = sourceConfidence * decay;

  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(1, Math.max(0, confidence));
}

/**
 * Routing policy is deliberately separate from confidence calculation.
 *
 * A confidence score of exactly 0.5 is routable.
 * GPS has a maximum base confidence of 0.4 and therefore cannot
 * authorize routing even at time zero.
 */
export function isParkingRoutingAllowed(confidence: number): boolean {
  return (
    Number.isFinite(confidence) &&
    confidence >= PARKING_ROUTING_CONFIDENCE_THRESHOLD
  );
}
