# Spatial Localization Contract

## Purpose

Define the smallest truthful boundary between probabilistic location observations and deterministic mall-graph routing.

## Boundary

`LocationObservation[] -> LocalizationResult -> resolved node identity -> routing`

Sensor providers may produce observations. They must not mutate mall topology, edge state, node state, route distance, or `RouteResult.verified`.

## LocalizationResult

A localization result represents an interpretation of observations, not a physical-map mutation.

Required semantics:
- `mallId` identifies the venue context.
- `levelId` is optional until floor resolution is established.
- `nodeId` is optional because localization may remain unresolved.
- `confidence` is bounded to `[0,1]`.
- `source` records the provenance of the selected interpretation.
- `capturedAt` records the observation time used for the interpretation.
- `state` distinguishes `unresolved`, `candidate`, and `resolved`.

## Invariants

1. An unresolved result MUST NOT be treated as a routing start node.
2. A localization confidence score MUST NOT set `RouteResult.verified`.
3. Localization MUST NOT create, delete, activate, deactivate, or rewrite graph nodes or edges.
4. A resolved `nodeId` MUST belong to the same `mallId` and, when both are known, the same `levelId` context as the result.
5. An observation with stale or conflicting context MUST NOT silently become a stronger location claim.
6. Routing remains deterministic over the supplied `MallGraph`.
7. Sensor source changes MUST NOT alter graph topology semantics.

## Failure states

- missing observations -> unresolved
- conflicting mall identity -> unresolved
- conflicting known floors -> unresolved unless an explicit higher-level resolution policy exists
- invalid confidence -> rejected by the observation contract
- unknown node -> unresolved
- inactive/unverified node -> not a verified localization claim
- stale observation -> unresolved or explicitly stale; never silently freshened

## Non-goals

This contract does not implement GPS, BLE, Wi-Fi, visual positioning, sensor fusion, geofencing, map matching, Kalman filtering, or automatic floor detection.

It also does not authorize graph editing or route caching.

## Verification boundary

The first implementation should be contract tests only. Real sensor adapters come later and must conform to this boundary.
