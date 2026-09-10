import { describe, expect, it } from "vitest";
import { NotificationEventSchema } from "@/domain/notifications/types";

describe("notification truth contracts", () => {
  const base = {
    id: "notification-1",
    mallId: "mall-of-africa",
    state: "active" as const,
    severity: "warning" as const,
    source: "localization" as const,
    occurredAt: "2026-09-10T09:00:00.000Z",
    message: "Your location confidence is low.",
    levelId: "level-4",
    parkadeId: "parkade-c",
    nodeId: "p4-entrance-16",
  };

  it("validates low-location-confidence events", () => {
    const event = NotificationEventSchema.parse({
      ...base,
      type: "LOW_LOCATION_CONFIDENCE",
      confidence: 0.42,
      recoveryAction: "Confirm a nearby visual landmark.",
    });

    expect(event.type).toBe("LOW_LOCATION_CONFIDENCE");
    expect(event.confidence).toBe(0.42);
  });

  it("validates offline-mode events", () => {
    const event = NotificationEventSchema.parse({
      ...base,
      id: "notification-2",
      type: "OFFLINE_MODE_ACTIVE",
      source: "network",
      severity: "info",
      message: "Offline mode is active. Saved parking data remains available locally.",
    });

    expect(event.type).toBe("OFFLINE_MODE_ACTIVE");
    expect(event.source).toBe("network");
  });

  it("validates stale-venue-data events with verification provenance", () => {
    const event = NotificationEventSchema.parse({
      ...base,
      id: "notification-3",
      type: "STALE_VENUE_DATA",
      source: "venue_data",
      dataVerifiedAt: "2026-09-01T09:00:00.000Z",
      message: "Some venue data has not been verified recently.",
      state: "unknown",
    });

    expect(event.type).toBe("STALE_VENUE_DATA");
    expect(event.dataVerifiedAt).toBe("2026-09-01T09:00:00.000Z");
    expect(event.state).toBe("unknown");
  });

  it("enforces bounded confidence", () => {
    expect(
      NotificationEventSchema.safeParse({
        ...base,
        type: "LOW_LOCATION_CONFIDENCE",
        confidence: 1.01,
      }).success,
    ).toBe(false);

    expect(
      NotificationEventSchema.safeParse({
        ...base,
        type: "LOW_LOCATION_CONFIDENCE",
        confidence: -0.01,
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported notification categories and sources", () => {
    expect(
      NotificationEventSchema.safeParse({
        ...base,
        type: "TYPECHECK_FAILURE",
      }).success,
    ).toBe(false);

    expect(
      NotificationEventSchema.safeParse({
        ...base,
        type: "OFFLINE_MODE_ACTIVE",
        source: "github_ci",
      }).success,
    ).toBe(false);
  });

  it("requires a valid message and timestamp", () => {
    expect(
      NotificationEventSchema.safeParse({
        ...base,
        type: "OFFLINE_MODE_ACTIVE",
        message: "",
      }).success,
    ).toBe(false);

    expect(
      NotificationEventSchema.safeParse({
        ...base,
        type: "OFFLINE_MODE_ACTIVE",
        occurredAt: "not-a-date",
      }).success,
    ).toBe(false);
  });
});
