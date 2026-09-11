import { ParkingSession, ParkingSessionSchema } from "@/domain/parking/types";

const STALE_AFTER_MS = 1000 * 60 * 60 * 24 * 7;

export type ParkingState = "empty" | "active" | "stale";

export function getParkingState(session: ParkingSession | null, now = new Date()): ParkingState {
  if (!session) return "empty";
  const captured = new Date(session.updatedAt ?? session.capturedAt).getTime();
  const current = now.getTime();

  if (!Number.isFinite(captured) || !Number.isFinite(current)) return "stale";
  if (captured > current) return "stale";

  return current - captured >= STALE_AFTER_MS ? "stale" : "active";
}

export function shouldRequestLandmarkConfirmation(confidence: number): boolean {
  return confidence < 0.5;
}

export function normalizeParkingSession(input: unknown): ParkingSession {
  return ParkingSessionSchema.parse(input);
}
