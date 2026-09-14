export { LocationObservationSchema, LocationSourceSchema } from "@/domain/location/types";
export type { LocationObservation } from "@/domain/location/types";
export { resolveLocalization } from "@/domain/location/resolve";
export type { LocalizationResult, LocalizationState } from "@/domain/location/resolve";
export { LocalizationValidationIssue, validateLocalizationAgainstGraph } from "@/domain/location/validate";
export type {
  LocalizationValidationIssueCode,
  LocalizationValidationIssue as LocalizationValidationIssueDetail,
  LocalizationValidationReport,
} from "@/domain/location/validate";
export {
  assessLocalizationFreshness,
  DEFAULT_LOCALIZATION_FRESHNESS_POLICY,
  resolveFreshestUnambiguousObservation,
} from "@/domain/location/freshness";
export type {
  LocalizationFreshness,
  LocalizationFreshnessAssessment,
  LocalizationFreshnessPolicy,
} from "@/domain/location/freshness";
export { resolveTemporalLocalization } from "@/domain/location/temporal";
export type { TemporalLocalizationResult, TemporalLocalizationState } from "@/domain/location/temporal";
