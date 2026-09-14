# Seam 4 Evidence Gate

This document records the evidence rule for Spatial Seam 4.

## Exact-head rule

The branch must receive natural CI and browser truth telemetry against the exact current PR head. Evidence from an earlier commit does not transfer after a code change.

## Required checks

- Navigre CI: install, typecheck, unit tests
- Parking Truth Test: production build, application startup, browser truth test

## Merge rule

Do not merge until both exact-head workflows complete successfully. After squash merge, inspect the new merge SHA independently. PR-head L4 evidence is not inherited by the merge boundary.
