import type { MallGraph } from "@/domain/navigation/types";

/** Deliberately schematic V1 seed. Geometry is not survey-grade and remains unverified. */
export const mallOfAfricaGraph: MallGraph = {
  mallId: "mall-of-africa",
  levels: [{ id: "mofa-parking-4", mallId: "mall-of-africa", name: "Parking Level 4", order: 4 }],
  nodes: [
    { id: "p4-start", mallId: "mall-of-africa", levelId: "mofa-parking-4", parkadeId: "parkade-c", type: "parking", name: "Saved Parking Area", position: { x: 100, y: 160 }, accessible: true, status: "unverified", visualLandmark: { kind: "parking_marker", label: "Saved area" } },
    { id: "p4-corridor-a", mallId: "mall-of-africa", levelId: "mofa-parking-4", parkadeId: "parkade-c", type: "corridor", name: "Parking Connector A", position: { x: 220, y: 160 }, accessible: true, status: "unverified" },
    { id: "p4-entrance-16", mallId: "mall-of-africa", levelId: "mofa-parking-4", parkadeId: "parkade-c", type: "entrance", name: "Entrance 16", position: { x: 340, y: 160 }, accessible: true, status: "unverified", visualLandmark: { kind: "entrance_gate", label: "16" } },
    { id: "p4-lift", mallId: "mall-of-africa", levelId: "mofa-parking-4", parkadeId: "parkade-c", type: "lift", name: "Lift Core", position: { x: 340, y: 80 }, accessible: true, status: "unverified" },
  ],
  edges: [
    { id: "e-p4-1", fromNodeId: "p4-start", toNodeId: "p4-corridor-a", distanceMeters: 12, accessible: true, movement: "walk", bidirectional: true, status: "unverified" },
    { id: "e-p4-2", fromNodeId: "p4-corridor-a", toNodeId: "p4-entrance-16", distanceMeters: 12, accessible: true, movement: "walk", bidirectional: true, status: "unverified" },
    { id: "e-p4-3", fromNodeId: "p4-entrance-16", toNodeId: "p4-lift", distanceMeters: 8, accessible: true, movement: "walk", bidirectional: true, status: "unverified" },
  ],
  places: [],
};
