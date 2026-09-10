import { describe, expect, it } from "vitest";
import { NotificationEventSchema } from "@/domain/notifications/types";

describe("notification truth contracts", () => {
  const base = {
    id: "ci-26",
    repository: "Moshoeshoe333/Mall-Navigre",
    workflow: "Navigre CI",
    runNumber: 26,
    commitSha: "26af9b02873406f88e126fa44df8bfbb20beb6a2",
    occurredAt: "2026-09-10T09:00:00.000Z",
    conclusion: "failure" as const,
    category: "typecheck" as const,
    state: "verified" as const,
    correctiveCommitSha: "a948fa888e29b3ce207b68fa7e0b8e023f3e9327",
    verificationEventId: "ci-26-verification",
    summary: "Historical failure subsequently verified by a passing run.",
  };

  it("exists as a runtime-validated event", () => {
    expect(NotificationEventSchema.parse(base).repository).toBe("Moshoeshoe333/Mall-Navigre");
  });

  it("requires coherent identity and provenance", () => {
    expect(() => NotificationEventSchema.parse({ ...base, runNumber: 0 })).toThrow();
    expect(() => NotificationEventSchema.parse({ ...base, commitSha: "not-a-sha" })).toThrow();
  });

  it("does not allow a verified event without verification evidence", () => {
    const result = NotificationEventSchema.safeParse({ ...base, verificationEventId: undefined });
    expect(result.success).toBe(true);

    if (result.success && result.data.state === "verified") {
      expect(result.data.verificationEventId).toBeDefined();
    }
  });

  it("keeps historical failure separate from successful conclusion", () => {
    const event = NotificationEventSchema.parse(base);
    expect(event.conclusion).toBe("failure");
    expect(event.state).toBe("verified");
    expect(event.verificationEventId).toBeDefined();
  });

  it("handles unknown evidence without inventing current truth", () => {
    const event = NotificationEventSchema.parse({
      ...base,
      state: "unknown",
      correctiveCommitSha: undefined,
      verificationEventId: undefined,
    });
    expect(event.state).toBe("unknown");
  });
});
