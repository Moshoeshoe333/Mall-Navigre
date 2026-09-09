import { describe, expect, it } from "vitest";
import { findRoute } from "@/domain/routing/route";
import { validateMallGraph } from "@/domain/integrity/validateMall";
import { mallOfAfricaGraph } from "@/data/malls/mall-of-africa/graph";

describe("Navigre Core", () => {
  it("accepts the seeded graph as structurally valid", () => {
    const report = validateMallGraph(mallOfAfricaGraph);
    expect(report.valid).toBe(true);
    expect(report.issues.filter((x) => x.severity === "error")).toHaveLength(0);
  });

  it("detects a broken edge reference", () => {
    const broken = { ...mallOfAfricaGraph, edges: [...mallOfAfricaGraph.edges, { ...mallOfAfricaGraph.edges[0], id: "broken", toNodeId: "missing" }] };
    const report = validateMallGraph(broken);
    expect(report.valid).toBe(false);
    expect(report.issues.some((x) => x.code === "MISSING_TO_NODE")).toBe(true);
  });

  it("finds the shortest available route", () => {
    const result = findRoute(mallOfAfricaGraph, "p4-start", "p4-lift");
    expect(result?.nodeIds).toEqual(["p4-start", "p4-corridor-a", "p4-entrance-16", "p4-lift"]);
    expect(result?.distanceMeters).toBe(32);
  });

  it("returns no route when the destination is unavailable", () => {
    const graph = { ...mallOfAfricaGraph, nodes: mallOfAfricaGraph.nodes.map((n) => n.id === "p4-lift" ? { ...n, status: "temporarily_unavailable" as const } : n) };
    expect(findRoute(graph, "p4-start", "p4-lift")).toBeNull();
  });
});
