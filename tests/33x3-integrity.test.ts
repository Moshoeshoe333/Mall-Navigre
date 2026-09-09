import { describe, expect, it } from "vitest";
import { validateMallGraph } from "@/domain/integrity/validateMall";
import { mallOfAfricaGraph } from "@/data/malls/mall-of-africa/graph";

describe("33x3 integrity sieve — failure degree", () => {
  it("rejects duplicate node identity", () => {
    const invalid = { ...mallOfAfricaGraph, nodes: [...mallOfAfricaGraph.nodes, mallOfAfricaGraph.nodes[0]] };
    const report = validateMallGraph(invalid);
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.code === "DUPLICATE_ID")).toBe(true);
  });

  it("rejects missing level references", () => {
    const invalid = { ...mallOfAfricaGraph, nodes: [{ ...mallOfAfricaGraph.nodes[0], levelId: "missing-level" }] };
    const report = validateMallGraph(invalid);
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.code === "ORPHAN_LEVEL")).toBe(true);
  });

  it("detects disconnected active infrastructure", () => {
    const isolated = {
      ...mallOfAfricaGraph,
      nodes: [
        ...mallOfAfricaGraph.nodes,
        { ...mallOfAfricaGraph.nodes[1], id: "isolated-corridor", type: "corridor" as const, status: "active" as const },
      ],
    };
    const report = validateMallGraph(isolated);
    expect(report.issues.some((issue) => issue.code === "DISCONNECTED_NODE" && issue.entityId === "isolated-corridor")).toBe(true);
  });
});
