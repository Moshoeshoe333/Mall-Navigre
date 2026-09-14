import { describe, expect, it } from "vitest";
import type { MallGraph } from "@/domain/navigation/types";
import type { LocalizationResult } from "./resolve";
import { authorizeRoutingStart, RoutingStartAuthorizationIssue } from "./routing-start-authorization";

const baseNode = {
  id: "start",
  mallId: "mall-a",
  levelId: "level-1",
  parkadeId: null,
  type: "corridor" as const,
  name: "Start",
  position: { x: 0, y: 0 },
  accessible: true,
  status: "active" as const,
};

function graph(overrides: Partial<MallGraph["nodes"][number]> = {}): MallGraph {
  return {
    mallId: "mall-a",
    levels: [
      {
        id: "level-1",
        mallId: "mall-a",
        name: "Level 1",
        order: 1,
      },
    ],
    nodes: [{ ...baseNode, ...overrides }],
    edges: [],
    places: [],
  };
}

function localization(overrides: Partial<LocalizationResult> = {}): LocalizationResult {
  return {
    state: "fresh",
    mallId: "mall-a",
    levelId: "level-1",
    nodeId: "start",
    confidence: 1,
    source: "manual",
    capturedAt: "2026-09-14T10:00:00.000Z",
    ...overrides,
  };
}

describe("authorizeRoutingStart", () => {
  it("allows a fresh localization whose node is active and graph-consistent", () => {
    expect(authorizeRoutingStart(localization(), graph())).toEqual({ allowed: true, nodeId: "start" });
  });

  it.each(["stale", "conflicting", "unresolved"] as const)("fails closed for %s localization", (state) => {
    expect(authorizeRoutingStart(localization({ state }), graph())).toEqual({
      allowed: false,
      reason: RoutingStartAuthorizationIssue.NOT_FRESH,
    });
  });

  it("fails closed when a fresh localization has no node identity", () => {
    expect(authorizeRoutingStart(localization({ nodeId: undefined }), graph())).toEqual({
      allowed: false,
      reason: RoutingStartAuthorizationIssue.NO_NODE,
    });
  });

  it("rejects a mall mismatch", () => {
    expect(authorizeRoutingStart(localization({ mallId: "mall-b" }), graph())).toEqual({
      allowed: false,
      reason: RoutingStartAuthorizationIssue.GRAPH_MISMATCH,
    });
  });

  it("rejects a level mismatch", () => {
    expect(authorizeRoutingStart(localization({ levelId: "level-2" }), graph())).toEqual({
      allowed: false,
      reason: RoutingStartAuthorizationIssue.GRAPH_MISMATCH,
    });
  });

  it("distinguishes a node identity that is absent from the current graph", () => {
    expect(authorizeRoutingStart(localization({ nodeId: "missing" }), graph())).toEqual({
      allowed: false,
      reason: RoutingStartAuthorizationIssue.NODE_NOT_IN_GRAPH,
    });
  });

  it("rejects a temporarily unavailable node", () => {
    expect(authorizeRoutingStart(localization(), graph({ status: "temporarily_unavailable" }))).toEqual({
      allowed: false,
      reason: RoutingStartAuthorizationIssue.NODE_UNAVAILABLE,
    });
  });

  it("rejects an unverified node without turning confidence into verification", () => {
    expect(authorizeRoutingStart(localization({ confidence: 1 }), graph({ status: "unverified" }))).toEqual({
      allowed: false,
      reason: RoutingStartAuthorizationIssue.NODE_UNVERIFIED,
    });
  });

  it("does not mutate localization or graph state", () => {
    const value = localization();
    const mallGraph = graph();
    const beforeLocalization = structuredClone(value);
    const beforeGraph = structuredClone(mallGraph);
    authorizeRoutingStart(value, mallGraph);
    expect(value).toEqual(beforeLocalization);
    expect(mallGraph).toEqual(beforeGraph);
  });

  it("revalidates the same localization against a mutated current graph", () => {
    const value = localization();
    const mallGraph = graph();
    expect(authorizeRoutingStart(value, mallGraph)).toEqual({ allowed: true, nodeId: "start" });
    mallGraph.nodes[0].status = "temporarily_unavailable";
    expect(authorizeRoutingStart(value, mallGraph)).toEqual({
      allowed: false,
      reason: RoutingStartAuthorizationIssue.NODE_UNAVAILABLE,
    });
  });

  it("keeps authorization separate from route existence", () => {
    expect(authorizeRoutingStart(localization(), graph())).toEqual({ allowed: true, nodeId: "start" });
    // No edges exist: start authorization succeeds even though a route to any
    // destination would still require a separate routing decision.
  });

  it("accepts a valid start regardless of confidence once localization is fresh", () => {
    expect(authorizeRoutingStart(localization({ confidence: 0 }), graph())).toEqual({
      allowed: true,
      nodeId: "start",
    });
  });

  it("never returns route verification state", () => {
    const result = authorizeRoutingStart(localization(), graph());
    expect(result).toEqual({ allowed: true, nodeId: "start" });
    expect("verified" in result).toBe(false);
  });
});
