import { z } from "zod";

export const LocationSourceSchema = z.enum(["manual", "gps", "ble", "wifi", "visual"]);

export const LocationObservationSchema = z.object({
  id: z.string().min(1),
  mallId: z.string().min(1),
  levelId: z.string().min(1).optional(),
  parkadeId: z.string().min(1).optional(),
  nodeId: z.string().min(1).optional(),
  source: LocationSourceSchema,
  accuracyMeters: z.number().finite().nonnegative().optional(),
  confidence: z.number().min(0).max(1),
  capturedAt: z.string().datetime(),
});

export type LocationObservation = z.infer<typeof LocationObservationSchema>;
