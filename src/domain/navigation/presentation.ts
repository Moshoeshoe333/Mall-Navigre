import type { MallGraph } from "@/domain/navigation/types";
import type { RouteResult } from "@/domain/routing/route";
import type { ParkingSession } from "@/domain/parking/types";
import { authorizeParkingRouting } from "@/domain/parking/routing-authorization";
import { getParkingState } from "@/domain/parking/state";

export type NavigationPresentationMode =
  | "NONE"
  | "UNVERIFIED_PREVIEW"
  | "ACTIVE_GUIDANCE"
  | "FAILED_CLOSED";

export type RouteViewModel = {
  readonly mode: NavigationPresentationMode;
  readonly isGuidanceAllowed: boolean;
  readonly formattedDistanceMeters: string | null;
  readonly pathNodeIds: readonly string[];
  readonly displayableEdgeIds: readonly string[];
  readonly statusMessage: string;
  readonly rejectionReason?: string;
};

function empty(reason: string, statusMessage: string): RouteViewModel {
  return {
    mode: "FAILED_CLOSED",
    isGuidanceAllowed: false,
    formattedDistanceMeters: null,
    pathNodeIds: Object.freeze([]),
    displayableEdgeIds: Object.freeze([]),
    statusMessage,
    rejectionReason: reason,
  };
}

/**
 * Single presentation boundary between routing/policy state and the UI.
 * The UI must consume this model rather than raw RouteResult objects.
 */
export function createRouteViewModel(params: {
  session: ParkingSession | null;
  routeResult: RouteResult | null;
  graph: MallGraph;
  now?: Date;
}): RouteViewModel {
  const { session, routeResult, graph, now = new Date() } = params;
  if (!session) return empty("missing_session", "Navigation requires a saved parking session.");

  const authorization = authorizeParkingRouting(session, now);
  if (!authorization.allowed) {
    return empty(authorization.reason, "Navigation is unavailable until the saved parking session is eligible.");
  }

  if (getParkingState(session, now) === "stale") {
    return empty("stale", "Navigation is unavailable because the saved parking session is stale.");
  }

  if (!routeResult || routeResult.nodeIds.length === 0) {
    return empty("no_route", "No usable path was found to your saved parking location.");
  }

  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = new Map(graph.edges.map((edge) => [edge.id, edge]));
  const activeEdges = routeResult.edgeIds.every((id) => edges.get(id)?.status === "active");
  const activeNodes = routeResult.nodeIds.every((id) => nodes.get(id)?.status === "active");

  if (!activeEdges || !activeNodes) {
    return empty("unusable_route", "The route became unavailable and cannot be presented for navigation.");
  }

  const pathNodeIds = Object.freeze([...routeResult.nodeIds]);
  const displayableEdgeIds = Object.freeze([...routeResult.edgeIds]);

  if (!routeResult.verified) {
    return {
      mode: "UNVERIFIED_PREVIEW",
      isGuidanceAllowed: false,
      formattedDistanceMeters: `${Math.round(routeResult.distanceMeters)}m (Unverified)`,
      pathNodeIds,
      displayableEdgeIds,
      statusMessage: "Displaying schematic preview. Turn-by-turn guidance disabled.",
    };
  }

  return {
    mode: "ACTIVE_GUIDANCE",
    isGuidanceAllowed: true,
    formattedDistanceMeters: `${Math.round(routeResult.distanceMeters)}m`,
    pathNodeIds,
    displayableEdgeIds,
    statusMessage: "Route verified. Navigation active.",
  };
}
