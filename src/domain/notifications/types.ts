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

export const NotificationEventSchema = z.object({
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

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
