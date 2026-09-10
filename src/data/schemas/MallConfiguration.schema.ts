import { z } from "zod";

const Id = z.string().min(1);
const IsoDateTime = z.string().datetime();

export const MallSchema = z.object({
  id: Id,
  name: z.string().min(1),
  status: z.enum(["active", "draft", "unverified"]),
  source: z.string().min(1),
  verifiedAt: IsoDateTime.nullable(),
});

export const LevelSchema = z.object({
  id: Id,
  mallId: Id,
  name: z.string().min(1),
  floorNumber: z.number().int(),
  status: z.enum(["active", "temporarily_unavailable", "unverified"]),
});

export const VisualLandmarkSchema = z.object({
  id: Id,
  nodeId: Id,
  code: z.string().min(1),
  kind: z.enum(["entrance_gate", "column", "zone_sign", "parking_marker", "other"]),
  label: z.string().min(1),
  verified: z.boolean(),
});

export const MallConfigurationNodeSchema = z.object({
  id: Id,
  mallId: Id,
  levelId: Id,
  parkadeId: Id.nullable(),
  type: z.enum([
    "entrance",
    "corridor",
    "store",
    "lift",
    "escalator",
    "stairs",
    "restroom",
    "parking",
    "landmark",
  ]),
  name: z.string().min(1),
  position: z.object({ x: z.number(), y: z.number() }),
  accessible: z.boolean(),
  status: z.enum(["active", "temporarily_unavailable", "unverified"]),
});

export const MallConfigurationEdgeSchema = z.object({
  id: Id,
  fromNodeId: Id,
  toNodeId: Id,
  distanceMeters: z.number().nonnegative(),
  accessible: z.boolean(),
  movement: z.enum(["walk", "stairs", "escalator", "lift"]),
  bidirectional: z.boolean(),
  status: z.enum(["active", "temporarily_unavailable", "unverified"]),
});

export const MallConfigurationPlaceSchema = z.object({
  id: Id,
  mallId: Id,
  levelId: Id,
  nodeId: Id,
  name: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(["active", "temporarily_unavailable", "unverified"]),
});

export const MallConfigurationSchema = z.object({
  schemaVersion: z.literal(1),
  mall: MallSchema,
  levels: z.array(LevelSchema),
  nodes: z.array(MallConfigurationNodeSchema),
  edges: z.array(MallConfigurationEdgeSchema),
  places: z.array(MallConfigurationPlaceSchema),
  visualLandmarks: z.array(VisualLandmarkSchema),
});

export type MallConfiguration = z.infer<typeof MallConfigurationSchema>;
export type MallConfigurationNode = z.infer<typeof MallConfigurationNodeSchema>;
export type MallConfigurationEdge = z.infer<typeof MallConfigurationEdgeSchema>;
