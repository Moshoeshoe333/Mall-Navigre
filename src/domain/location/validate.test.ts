import { describe, expect, it } from "vitest";
import type { MallGraph } from "@/domain/navigation/types";
import type { LocalizationResult } from "./resolve";
import { LocalizationValidationIssue, validateLocalizationAgainstGraph } from "./validate";

const graph: MallGraph = {
  mallId: "mall-1",
  levels: [{ id: "level-1", mallId: "mall-1", name: "Level 1", order: 1 }],
  nodes: [
    {
      id: "node-active",
      mallId: "mall-1",
      levelId: "level-1",
      parkadeId: null,
      type: "corridor",
      name: "Active Corridor",
      position: { x: 0, y: 0 },
      accessible: true,
      status: "active",
    },
    {
      id: "node-unavailable",
      mallId: "mall-1",
      levelId: "level-1",
      parkadeId: null,
      type: "corridor",
      name: "Unavailable Corridor",
      position: { x: 1, y: 0 },
      accessible: true,
      status: "temporarily_unavailable",
    },
    {
      id: "node-unverified",
      mallId: "mall-1",
      levelId: "level-1",
      parkadeId: null,
      type: "corridor",
      name: "Unverified Corridor",
      position: { x: 2, y: 0 },
      accessible: true,
      status: "unverified",
    },
  ],
  edges: [],
  places: [],
};

const localization = (overrides: Partial<LocalizationResult> = {}): LocalizationResult => ({
  mallId: "mall-1",
  levelId: "level-1",
  nodeId: "node-active",
  confidence: 0.9,
  source: "manual",
  capturedAt: "2026-09-14T09:00:00.000Z",
  state: "fresh",
  ...overrides,
});

describe("validateLocalizationAgainstGraph", () => {
  it("accepts an active node with matching mall and level", () => {
    expect(validateLocalizationAgainstGraph(localization(), graph)).toEqual({ valid: true, issues: [] });
  });

  it("rejects a localization mall mismatch", () => {
    const report = validateLocalizationAgainstGraph(localization({ mallId: "mall-2" }), graph);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain(LocalizationValidationIssue.MALL_MISMATCH);
  });

  it("rejects an unknown node", () => {
    const report = validateLocalizationAgainstGraph(localization({ nodeId: "missing" }), graph);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain(LocalizationValidationIssue.NODE_MISSING);
  });

  it("rejects a node whose level conflicts with the localization claim", () => {
    const report = validateLocalizationAgainstGraph(localization({ levelId: "level-2" }), graph);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain(LocalizationValidationIssue.LEVEL_MISMATCH);
  });

  it("rejects temporarily unavailable nodes", () => {
    const report = validateLocalizationAgainstGraph(localization({ nodeId: "node-unavailable" }), graph);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain(LocalizationValidationIssue.NODE_UNAVAILABLE);
  });

  it("rejects unverified nodes from a verified localization claim", () => {
    const report = validateLocalizationAgainstGraph(localization({ nodeId: "node-unverified" }), graph);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain(LocalizationValidationIssue.NODE_UNVERIFIED);
  });

  it("does not manufacture a node claim when localization is unresolved", () => {
    const report = validateLocalizationAgainstGraph(localization({ nodeId: undefined, state: "unresolved" }), graph);
    expect(report).toEqual({ valid: true, issues: [] });
  });
});
