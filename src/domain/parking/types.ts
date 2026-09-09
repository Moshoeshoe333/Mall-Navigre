import { z } from "zod";

export const ParkingSourceSchema = z.enum(["manual", "gps", "ble", "wifi", "visual"]);

export const ParkingSessionSchema = z.object({
  id: z.string().min(1),
  mallId: z.string().min(1),
  parkadeId: z.string().min(1),
  levelId: z.string().min(1),
  zoneId: z.string().min(1).optional(),
  landmarkId: z.string().min(1).optional(),
  bayId: z.string().min(1).optional(),
  capturedAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  source: ParkingSourceSchema,
  confidence: z.number().min(0).max(1),
  note: z.string().max(500).optional(),
  photoReference: z.string().max(500).optional(),
});

export type ParkingSession = z.infer<typeof ParkingSessionSchema>;
