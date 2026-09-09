import { ParkingSession, ParkingSessionSchema } from "@/domain/parking/types";

export type ParkingState = "empty" | "active" | "stale";

export function getParkingState(session: ParkingSession | null, now = new Date()): ParkingState {
  if (!session) return "empty";
  const captured = new Date(session.updatedAt ?? session.capturedAt).getTime();
  if (!Number.isFinite(captured)) return "stale";
  return now.getTime() - captured > 1000 * 60 * 60 * 24 * 7 ? "stale" : "active";
}

export function shouldRequestLandmarkConfirmation(confidence: number): boolean {
  return confidence < 0.5;
}

export function normalizeParkingSession(input: unknown): ParkingSession {
  return ParkingSessionSchema.parse(input);
}
