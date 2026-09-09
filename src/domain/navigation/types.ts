import { z } from "zod";

export const NodeType = z.enum([
  "entrance",
  "corridor",
  "store",
  "lift",
  "escalator",
  "stairs",
  "restroom",
  "parking",
  "landmark",
]);

export const NodeStatus = z.enum(["active", "temporarily_unavailable", "unverified"]);

export const MallNodeSchema = z.object({
  id: z.string().min(1),
  mallId: z.string().min(1),
  levelId: z.string().min(1),
  type: NodeType,
  name: z.string().min(1),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
  accessible: z.boolean(),
  status: NodeStatus,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const MovementType = z.enum(["walk", "stairs", "escalator", "lift"]);

export const MallEdgeSchema = z.object({
  id: z.string().min(1),
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  distanceMeters: z.number().finite().positive(),
  accessible: z.boolean(),
  movement: MovementType,
  bidirectional: z.boolean(),
  status: NodeStatus,
});

export const LevelSchema = z.object({
  id: z.string().min(1),
  mallId: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int(),
});

export const PlaceSchema = z.object({
  id: z.string().min(1),
  mallId: z.string().min(1),
  nodeId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  status: NodeStatus,
});

export type MallNode = z.infer<typeof MallNodeSchema>;
export type MallEdge = z.infer<typeof MallEdgeSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type Place = z.infer<typeof PlaceSchema>;

export type MallGraph = {
  mallId: string;
  levels: Level[];
  nodes: MallNode[];
  edges: MallEdge[];
  places: Place[];
};
