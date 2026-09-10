import { z } from "zod";

export const NotificationStateSchema = z.enum([
  "active",
  "resolved",
  "verified",
  "superseded",
  "unknown",
]);

export const NotificationCategorySchema = z.enum([
  "dependency",
  "typecheck",
  "unit_test",
  "build",
  "e2e",
  "infrastructure",
  "unknown",
]);

const NotificationEventBaseSchema = z.object({
  id: z.string().min(1),
  repository: z.string().min(1),
  workflow: z.string().min(1),
  runNumber: z.number().int().positive(),
  commitSha: z.string().regex(/^[0-9a-f]{7,64}$/i).optional(),
  occurredAt: z.string().datetime(),
  conclusion: z.enum(["success", "failure", "cancelled", "skipped", "unknown"]),
  category: NotificationCategorySchema,
  state: NotificationStateSchema,
  rootCauseId: z.string().min(1).optional(),
  correctiveCommitSha: z.string().regex(/^[0-9a-f]{7,64}$/i).optional(),
  verificationEventId: z.string().min(1).optional(),
  summary: z.string().max(500).optional(),
});

export const NotificationEventSchema = NotificationEventBaseSchema.superRefine((event, ctx) => {
  if (event.state === "verified" && !event.verificationEventId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["verificationEventId"],
      message: "Verified notifications require verification evidence.",
    });
  }

  if (event.state === "resolved" && !event.correctiveCommitSha) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["correctiveCommitSha"],
      message: "Resolved notifications require a corrective commit reference.",
    });
  }
});

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
