import type { MallGraph, MallNode } from "@/domain/navigation/types";

export type DestinationReachabilityIssue = {
  severity: "error";
  code:
    | "DESTINATION_NODE_MISSING"
    | "DESTINATION_NODE_INACTIVE"
    | "NO_ACTIVE_INGRESS"
    | "UNREACHABLE_DESTINATION";
  message: string;
  entityId: string;
};

export type DestinationReachabilityReport = {
  valid: boolean;
  issues: DestinationReachabilityIssue[];
};

function isIngress(node: MallNode): boolean {
  return node.type === "entrance" || node.type === "parking";
}

/**
 * Invariant R4: every active Place must be directionally reachable from at
 * least one active entrance or parking node.
 *
 * R4 owns destination travel reachability. It deliberately does not apply
 * accessibility policy, route optimization, or localization confidence.
 */
export function validateDestinationReachability(
  graph: MallGraph,
): DestinationReachabilityReport {
  const activeNodes = graph.nodes.filter((node) => node.status === "active");
  const activeNodeIds = new Set(activeNodes.map((node) => node.id));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const activeIngresses = activeNodes.filter(isIngress);
  const activeDestinations = graph.places.filter((place) => place.status === "active");
  const issues: DestinationReachabilityIssue[] = [];

  if (activeDestinations.length === 0) {
    return { valid: true, issues };
  }

  for (const place of activeDestinations) {
    const node = nodeById.get(place.nodeId);

    if (!node) {
      issues.push({
        severity: "error",
        code: "DESTINATION_NODE_MISSING",
        message: `Active destination ${place.id} references missing node ${place.nodeId}`,
        entityId: place.id,
      });
      continue;
    }

    if (node.status !== "active") {
      issues.push({
        severity: "error",
        code: "DESTINATION_NODE_INACTIVE",
        message: `Active destination ${place.id} references inactive node ${place.nodeId}`,
        entityId: place.id,
      });
    }
  }

  if (activeIngresses.length === 0) {
    for (const place of activeDestinations) {
      const node = nodeById.get(place.nodeId);
      if (node?.status === "active") {
        issues.push({
          severity: "error",
          code: "NO_ACTIVE_INGRESS",
          message: `Active destination ${place.id} has no active entrance or parking ingress`,
          entityId: place.id,
        });
      }
    }
    return { valid: issues.length === 0, issues };
  }

  const adjacency = new Map<string, string[]>();
  for (const node of activeNodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    if (edge.status !== "active") continue;
    if (!activeNodeIds.has(edge.fromNodeId) || !activeNodeIds.has(edge.toNodeId)) continue;

    adjacency.get(edge.fromNodeId)?.push(edge.toNodeId);
    if (edge.bidirectional) {
      adjacency.get(edge.toNodeId)?.push(edge.fromNodeId);
    }
  }

  const reachable = new Set<string>();
  const queue = activeIngresses.map((node) => node.id);
  for (const ingressId of queue) reachable.add(ingressId);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (reachable.has(next)) continue;
      reachable.add(next);
      queue.push(next);
    }
  }

  for (const place of activeDestinations) {
    const node = nodeById.get(place.nodeId);
    if (!node || node.status !== "active") continue;

    if (!reachable.has(node.id)) {
      issues.push({
        severity: "error",
        code: "UNREACHABLE_DESTINATION",
        message: `Active destination ${place.id} at node ${node.id} is unreachable from every active ingress`,
        entityId: place.id,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
