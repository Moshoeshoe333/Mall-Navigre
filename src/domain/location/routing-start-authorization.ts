import type { MallGraph } from "@/domain/navigation/types";
import { validateLocalizationAgainstGraph } from "./validate";
import type { LocalizationResult } from "./resolve";

export const RoutingStartAuthorizationIssue = {
  NOT_FRESH: "ROUTING_START_NOT_FRESH",
  NO_NODE: "ROUTING_START_NODE_MISSING",
  GRAPH_MISMATCH: "ROUTING_START_GRAPH_MISMATCH",
  NODE_UNAVAILABLE: "ROUTING_START_NODE_UNAVAILABLE",
  NODE_UNVERIFIED: "ROUTING_START_NODE_UNVERIFIED",
} as const;

export type RoutingStartAuthorizationIssueCode =
  (typeof RoutingStartAuthorizationIssue)[keyof typeof RoutingStartAuthorizationIssue];

export type RoutingStartAuthorization =
  | { allowed: true; nodeId: string }
  | { allowed: false; reason: RoutingStartAuthorizationIssueCode };

/**
 * Final gate between a localized identity claim and routing.
 *
 * A routing start requires an explicit fresh localization state, a node identity,
 * and a current graph validation. Confidence never creates route verification.
 * The function is read-only and must be re-run against the current graph before
 * each routing attempt.
 */
export function authorizeRoutingStart(
  localization: LocalizationResult,
  graph: MallGraph,
): RoutingStartAuthorization {
  if (localization.state !== "fresh") {
    return { allowed: false, reason: RoutingStartAuthorizationIssue.NOT_FRESH };
  }

  if (!localization.nodeId) {
    return { allowed: false, reason: RoutingStartAuthorizationIssue.NO_NODE };
  }

  const validation = validateLocalizationAgainstGraph(localization, graph);
  if (!validation.valid) {
    const codes = new Set(validation.issues.map((issue) => issue.code));
    if (codes.has("LOCALIZATION_NODE_UNAVAILABLE")) {
      return { allowed: false, reason: RoutingStartAuthorizationIssue.NODE_UNAVAILABLE };
    }
    if (codes.has("LOCALIZATION_NODE_UNVERIFIED")) {
      return { allowed: false, reason: RoutingStartAuthorizationIssue.NODE_UNVERIFIED };
    }
    return { allowed: false, reason: RoutingStartAuthorizationIssue.GRAPH_MISMATCH };
  }

  return { allowed: true, nodeId: localization.nodeId };
}
