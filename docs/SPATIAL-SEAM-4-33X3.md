# Spatial Seam 4 — 33×3 Sieve Boundary

## Existence

A routing start must have an explicit authorization function between localization and routing.

## Coherence

The authorization consumes the public four-state `LocalizationResult` and the current `MallGraph`, reusing graph validation rather than duplicating node-status rules.

## Failure

The boundary fails closed for non-fresh localization, missing identity, graph mismatch, unavailable nodes, and unverified nodes. It never returns a route or verification claim.

The seam is intentionally narrow: sensor reliability, route reachability, destination authorization, and route verification remain owned by their existing boundaries.
