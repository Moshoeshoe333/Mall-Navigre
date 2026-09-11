import type { ParkingSession } from "@/domain/parking/types";
import { getParkingState } from "@/domain/parking/state";

export const PARKING_ROUTING_CONFIDENCE_THRESHOLD = 0.5;

export type ParkingRoutingAuthorization =
  | { allowed: true; reason: "eligible" }
  | { allowed: false; reason: "missing_session" | "low_confidence" | "stale" | "invalid_confidence" | "unsupported_source" };

/**
 * Policy-owned routing boundary for Gate 2 v2.
 *
 * Stored confidence is authoritative observation data; freshness is evaluated
 * independently. This function does not mutate or decay the ParkingSession.
 */
export function authorizeParkingRouting(
  session: ParkingSession | null,
  now = new Date(),
): ParkingRoutingAuthorization {
  if (!session) return { allowed: false, reason: "missing_session" };

  if (!Number.isFinite(session.confidence) || session.confidence < 0 || session.confidence > 1) {
    return { allowed: false, reason: "invalid_confidence" };
  }

  if (session.source === "visual") {
    return { allowed: false, reason: "unsupported_source" };
  }

  if (session.source === "gps") {
    return { allowed: false, reason: "low_confidence" };
  }

  if (session.confidence < PARKING_ROUTING_CONFIDENCE_THRESHOLD) {
    return { allowed: false, reason: "low_confidence" };
  }

  if (getParkingState(session, now) === "stale") {
    return { allowed: false, reason: "stale" };
  }

  return { allowed: true, reason: "eligible" };
}
