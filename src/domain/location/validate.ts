import type { MallGraph } from "@/domain/navigation/types";
import type { LocalizationResult } from "./resolve";

export const LocalizationValidationIssue = {
  MALL_MISMATCH: "LOCALIZATION_MALL_MISMATCH",
  NODE_MISSING: "LOCALIZATION_NODE_MISSING",
  NODE_MALL_MISMATCH: "LOCALIZATION_NODE_MALL_MISMATCH",
  LEVEL_MISMATCH: "LOCALIZATION_LEVEL_MISMATCH",
  NODE_UNAVAILABLE: "LOCALIZATION_NODE_UNAVAILABLE",
  NODE_UNVERIFIED: "LOCALIZATION_NODE_UNVERIFIED",
} as const;

export type LocalizationValidationIssueCode =
  (typeof LocalizationValidationIssue)[keyof typeof LocalizationValidationIssue];

export type LocalizationValidationIssue = {
  code: LocalizationValidationIssueCode;
  message: string;
};

export type LocalizationValidationReport = {
  valid: boolean;
  issues: LocalizationValidationIssue[];
};

/**
 * Validates an already-resolved localization claim against the current graph.
 * This is read-only: it never mutates topology or routing state.
 */
export function validateLocalizationAgainstGraph(
  localization: LocalizationResult,
  graph: MallGraph,
): LocalizationValidationReport {
  const issues: LocalizationValidationIssue[] = [];

  if (localization.mallId !== "unknown" && localization.mallId !== graph.mallId) {
    issues.push({
      code: LocalizationValidationIssue.MALL_MISMATCH,
      message: `Localization mall ${localization.mallId} does not match graph mall ${graph.mallId}.`,
    });
  }

  if (!localization.nodeId) {
    return { valid: issues.length === 0, issues };
  }

  const node = graph.nodes.find((candidate) => candidate.id === localization.nodeId);
  if (!node) {
    issues.push({
      code: LocalizationValidationIssue.NODE_MISSING,
      message: `Localization node ${localization.nodeId} does not exist in the graph.`,
    });
    return { valid: false, issues };
  }

  if (node.mallId !== graph.mallId || node.mallId !== localization.mallId) {
    issues.push({
      code: LocalizationValidationIssue.NODE_MALL_MISMATCH,
      message: `Localization node ${node.id} belongs to mall ${node.mallId}, not ${localization.mallId}.`,
    });
  }

  if (localization.levelId && node.levelId !== localization.levelId) {
    issues.push({
      code: LocalizationValidationIssue.LEVEL_MISMATCH,
      message: `Localization node ${node.id} is on level ${node.levelId}, not ${localization.levelId}.`,
    });
  }

  if (node.status === "temporarily_unavailable") {
    issues.push({
      code: LocalizationValidationIssue.NODE_UNAVAILABLE,
      message: `Localization node ${node.id} is temporarily unavailable.`,
    });
  }

  if (node.status === "unverified") {
    issues.push({
      code: LocalizationValidationIssue.NODE_UNVERIFIED,
      message: `Localization node ${node.id} is unverified.`,
    });
  }

  return { valid: issues.length === 0, issues };
}
