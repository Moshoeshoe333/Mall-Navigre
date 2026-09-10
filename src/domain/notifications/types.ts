import { z } from "zod";

export const NotificationTypeSchema = z.enum([
  "LOW_LOCATION_CONFIDENCE",
  "OFFLINE_MODE_ACTIVE",
  "STALE_VENUE_DATA",
]);

export const NotificationStateSchema = z.enum([
  "active",
  "resolved",
  "unknown",
]);

export const NotificationSeveritySchema = z.enum([
  "info",
  "warning",
  "critical",
]);

export const NotificationSourceSchema = z.enum([
  "localization",
  "network",
  "venue_data",
  "system",
]);

export const NotificationEventSchema = z.object({
  id: z.string().min(1),
  mallId: z.string().min(1),
  type: NotificationTypeSchema,
  state: NotificationStateSchema,
  severity: NotificationSeveritySchema,
  source: NotificationSourceSchema,
  occurredAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  message: z.string().min(1).max(500),
  levelId: z.string().min(1).optional(),
  parkadeId: z.string().min(1).optional(),
  nodeId: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  dataVerifiedAt: z.string().datetime().optional(),
  recoveryAction: z.string().max(300).optional(),
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationState = z.infer<typeof NotificationStateSchema>;
export type NotificationSeverity = z.infer<typeof NotificationSeveritySchema>;
export type NotificationSource = z.infer<typeof NotificationSourceSchema>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
