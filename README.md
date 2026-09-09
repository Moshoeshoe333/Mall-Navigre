# Mall Navigre

**Indoor navigation and parking intelligence platform.**

> **Know where you are. Know where you're going. Never lose your car again.**

## Navigre Core 0.1

The first build is intentionally narrow: prove the **Parking Truth Test** before adding advanced systems.

`SAVE MY CAR → STORE → CLOSE APP → REOPEN → FIND MY CAR`

### Core principles

- **Boring underneath. Beautiful on top.**
- Local-first: the last valid parking state remains useful without network access.
- Canonical mall infrastructure is separate from user-generated state.
- Localization is a replaceable service; navigation is not.
- Every spatial node has explicit mall/level/parkade context and may carry a physical visual landmark.
- Confidence is explicit; below `0.5`, the experience must request landmark confirmation rather than silently trusting weak positioning.
- GPS does not become indoor precision by assertion.
- Unverified geometry is disclosed.
- Temporarily unavailable infrastructure is never routable.
- Correctness comes before optimization; measured performance earns complexity.
- The **33 × 3 sieve** is an architectural audit, not a list of 99 features.

## Repository map

```text
Mall-Navigre/
├── ARCHITECTURE.md
├── 33x3-SIEVE.md
├── V1-SCOPE.md
├── src/
│   ├── app/                 # human experience
│   ├── domain/              # navigation, routing, parking, localization, integrity
│   ├── data/                # canonical mall configuration
│   └── storage/             # local-first persistence
└── tests/                   # truth tests and regression coverage
```

## V1 boundary

Included: typed domain models, runtime validation, graph integrity, deterministic A* routing, Parking Passport, IndexedDB persistence, offline-aware state, schematic 2D navigation, confidence handling, data validation, and automated tests.

Deferred: BLE infrastructure, AR, AI Copilot, predictive routing, computer vision, live crowd intelligence, advertising, loyalty, social features, and a full CMS.

## Data truth

Mall geometry in the initial seed is deliberately **schematic/unverified** until properly digitized and validated. Public mall facts may inform configuration, but the application must not present unverified geometry as survey-grade positioning.

## Status

Core contracts, integrity checks, routing, persistence, UI, and failure-mode tests are implemented on the `feat/parking-truth-core` branch. The next gate is automated CI/build verification before merging to `main`.
