import {
  MallEdgeSchema,
  MallGraph,
  MallNodeSchema,
  LevelSchema,
  PlaceSchema,
} from "@/domain/navigation/types";

export type IntegrityIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  entityId?: string;
};

export type IntegrityReport = {
  valid: boolean;
  issues: IntegrityIssue[];
};

const duplicateIds = (ids: string[], kind: string): IntegrityIssue[] => {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => ({ severity: "error", code: "DUPLICATE_ID", message: `Duplicate ${kind} id: ${id}`, entityId: id }));
};

export function validateMallGraph(graph: MallGraph): IntegrityReport {
  const issues: IntegrityIssue[] = [];
  const levelIds = new Set(graph.levels.map((level) => level.id));
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const placeIds = new Set(graph.places.map((place) => place.id));

  issues.push(...duplicateIds(graph.levels.map((x) => x.id), "level"));
  issues.push(...duplicateIds(graph.nodes.map((x) => x.id), "node"));
  issues.push(...duplicateIds(graph.edges.map((x) => x.id), "edge"));
  issues.push(...duplicateIds(graph.places.map((x) => x.id), "place"));

  for (const level of graph.levels) {
    const result = LevelSchema.safeParse(level);
    if (!result.success) issues.push({ severity: "error", code: "INVALID_LEVEL", message: `Invalid level: ${level.id}`, entityId: level.id });
    if (level.mallId !== graph.mallId) issues.push({ severity: "error", code: "WRONG_MALL", message: `Level ${level.id} belongs to another mall`, entityId: level.id });
  }

  for (const node of graph.nodes) {
    const result = MallNodeSchema.safeParse(node);
    if (!result.success) issues.push({ severity: "error", code: "INVALID_NODE", message: `Invalid node: ${node.id}`, entityId: node.id });
    if (!levelIds.has(node.levelId)) issues.push({ severity: "error", code: "ORPHAN_LEVEL", message: `Node ${node.id} references missing level ${node.levelId}`, entityId: node.id });
    if (node.mallId !== graph.mallId) issues.push({ severity: "error", code: "WRONG_MALL", message: `Node ${node.id} belongs to another mall`, entityId: node.id });
  }

  for (const edge of graph.edges) {
    const result = MallEdgeSchema.safeParse(edge);
    if (!result.success) issues.push({ severity: "error", code: "INVALID_EDGE", message: `Invalid edge: ${edge.id}`, entityId: edge.id });
    if (!nodeIds.has(edge.fromNodeId)) issues.push({ severity: "error", code: "MISSING_FROM_NODE", message: `Edge ${edge.id} references missing from-node ${edge.fromNodeId}`, entityId: edge.id });
    if (!nodeIds.has(edge.toNodeId)) issues.push({ severity: "error", code: "MISSING_TO_NODE", message: `Edge ${edge.id} references missing to-node ${edge.toNodeId}`, entityId: edge.id });
    if (edge.fromNodeId === edge.toNodeId) issues.push({ severity: "warning", code: "SELF_LOOP", message: `Edge ${edge.id} loops to itself`, entityId: edge.id });
  }

  for (const place of graph.places) {
    const result = PlaceSchema.safeParse(place);
    if (!result.success) issues.push({ severity: "error", code: "INVALID_PLACE", message: `Invalid place: ${place.id}`, entityId: place.id });
    if (!nodeIds.has(place.nodeId)) issues.push({ severity: "error", code: "ORPHAN_PLACE", message: `Place ${place.id} references missing node ${place.nodeId}`, entityId: place.id });
    if (!placeIds.has(place.id)) issues.push({ severity: "error", code: "INTERNAL_PLACE_REFERENCE", message: `Unexpected place reference: ${place.id}`, entityId: place.id });
  }

  const connectedNodeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId) && edge.status !== "temporarily_unavailable") {
      connectedNodeIds.add(edge.fromNodeId);
      connectedNodeIds.add(edge.toNodeId);
    }
  }
  for (const node of graph.nodes) {
    if (node.type !== "parking" && node.status === "active" && !connectedNodeIds.has(node.id)) {
      issues.push({ severity: "warning", code: "DISCONNECTED_NODE", message: `Active node ${node.id} is disconnected from the usable graph`, entityId: node.id });
    }
  }

  return { valid: issues.every((issue) => issue.severity !== "error"), issues };
}
