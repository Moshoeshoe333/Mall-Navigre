# NAVIGRE 2 — Master Evidence Ledger

**Audit date:** 2026-09-11  
**Current repository HEAD / code-under-test:** `9af8249e499b3545d9f1b948e1797545ed2c7847`  
**Current branch:** `main`  
**Governing rule:** NO CLAIM ABOVE ITS EVIDENCE LEVEL.  
**Gate 3:** FROZEN.

## 7-Level Evidence Standard

| Level | Meaning |
|---|---|
| L0 | Undefined |
| L1 | Defined |
| L2 | Implemented |
| L3 | Tested — test artifact exists |
| L4 | Executed — tests physically ran and passed |
| L5 | Integrated — adjacent systems verified together |
| L6 | Operational — real-world/release evidence |

**Important:** a test file is L3, not L4. A workflow definition is not execution evidence. A commit is not proof that runtime behavior works.

## Current ledger

| Area | Highest justified level | Classification | Evidence / next action |
|---|---:|---|---|
| Core 0.1 Parking Truth | L4 current browser execution | Strength / evidence | Parking Truth workflow passed against current head `9af8249`. This does not promote Gate 2 to L5. |
| IndexedDB local-first persistence | L4 current browser execution | Strength | Existing browser truth workflow passes; Gate 2 policy remains a separate boundary. |
| Canonical ParkingSession confidence | L2 | Strength | Stored observation confidence remains canonical persisted data and is not silently mutated by freshness evaluation. |
| Core 0.1 confidence boundary | L4 | Compatibility boundary | `<0.50` rejects routing / requests confirmation; exact `0.50` remains eligible. Covered by current regression suite. |
| Gate 2 calculator | L2 | Experimental primitive | Source-weight / 24h half-life calculator exists. It remains outside production authorization. |
| Gate 2 calculator tests | L4 | Executed | 30 calculator tests passed on current head CI run `34584682285`. |
| Gate 2 Contract v2 / Policy C | L1 | Candidate decision | Policy C semantics are implemented in the authorization boundary, but the contract document remains a candidate governance decision unless explicitly promoted. |
| Gate 2 regression suite | L4 | Executed | Current head CI passed `10` test files / `88` tests, including `9` regression tests in `confidence-regression.test.ts`. |
| Gate 2 routing authorization boundary | L4 | Strength / bounded integration | Policy-owned authorization is implemented and current CI passes. Production path uses it; browser workflow also passes. |
| Gate 2 production decision chain | L4 | Integrated execution, not L5 claim | Current production path is stored session → authorization → route calculation → `RouteResult.verified` → UI. Current CI and browser execution pass, but no dedicated adjacent-system integration artifact is being claimed as L5 yet. |
| Seven-day stale state | L4 | Hardened seam | Exact seven-day boundary, invalid timestamps, future timestamps, and `updatedAt` precedence are regression-tested. |
| Experimental decay separation | L4 | Compatibility protection | Current regression coverage proves experimental calculator decay is separate from stored manual confidence / production authorization. |
| Graph integrity | L2 | Reconciliation required | Existing validator is implemented; strict later taxonomy is not established in current production code. Reconcile before mutation. |
| Deterministic routing | L4 current browser execution | Strength | A* routing remains separate from confidence authorization; current browser truth workflow passes. |
| Localization | L2 interface | Capability gap | GPS/BLE/Wi-Fi remain abstractions, not operational indoor positioning. |
| Accessibility | L2 partial | Verification gap | Automated keyboard / screen-reader verification remains outstanding. |
| Sensors | L2 abstraction | Capability gap | No physical sensor deployment evidence. |
| Performance/battery | L1/L2 | Verification gap | Benchmarks and device measurements remain outstanding. |
| Security/privacy | L1/L2 | Verification gap | Dedicated audit remains outstanding. |
| Multi-mall | L2 partial | Capability gap | Architecture seams exist; multi-mall runtime proof remains outstanding. |
| Gate 3 concurrency | L1 | **FROZEN** | No multi-tab concurrency implementation until Gates 1 and 2 are resolved. |
| Real Mall of Africa truth | L1 | Operational gap | Schematic geometry is not physical validation. Requires verified data and field walkthrough evidence. |
| Dependency reproducibility | L4 | Strength | `npm ci` passed on current head; CI reported 0 vulnerabilities during install. |

## Current-head CI execution evidence

Exact code-under-test commit: `9af8249e499b3545d9f1b948e1797545ed2c7847`

**Navigre CI run:** `34584682285`

- checkout resolved exactly to `9af8249e499b3545d9f1b948e1797545ed2c7847`;
- `npm ci` — PASS;
- `npm run typecheck` — PASS;
- `npm test` — PASS;
- **10 test files passed / 88 tests passed**;
- calculator suite — 30 tests passed;
- `confidence-regression.test.ts` — 9 tests passed;
- `state.test.ts` — 13 tests passed;
- `routing-authorization.test.ts` — 13 tests passed;
- no vulnerabilities reported by `npm ci`.

The CI log also reports deprecation warnings from the runner/action runtime and an unsupported eslint package warning. These did not fail the run, but they are maintenance signals and should be tracked separately from product correctness.

**Parking Truth Test run:** `34584682174`

- production build — PASS;
- Next.js start — PASS;
- application wait — PASS;
- Browser Truth Test — PASS;
- Playwright report upload — PASS.

Artifact: `playwright-report`, id `10193268295`, retained and not expired at audit time. Digest: `sha256:b6f098f2b82001635dc2aa1899b2ca9ebc60f043e8c9da323a223fb4e2c309ac`.

This establishes **L4 execution evidence for the current head `9af8249`**.

## Pass 8 / Gate 2 authorization

The production authorization boundary is now policy-owned rather than calculator-owned. It evaluates, in order:

1. missing session;
2. invalid confidence;
3. unsupported `visual` source;
4. GPS as insufficient independent authority;
5. confidence below `0.50`;
6. stale / invalid / future temporal evidence;
7. otherwise eligible.

The boundary does not mutate the persisted `ParkingSession` and does not conflate authorization with `RouteResult.verified`.

The current production path invokes authorization before A* route calculation. A route can therefore be **authorized** while its geometry remains explicitly **unverified**; those are separate claims.

## Regression suite interpretation

The external Gemini proposal was treated as a semantic checklist, not copied as literal API authority. Its proposed API did not match the repository contracts, and its requirement that the experimental calculator preserve manual confidence conflicted with the deliberately separated Policy C architecture.

The adapted current-repository regression suite therefore verifies the actual architecture:

- stored manual confidence remains unchanged over time;
- freshness is independent from stored confidence;
- exact `0.50` is eligible;
- `<0.50` is rejected;
- GPS cannot independently authorize routing;
- visual remains fail closed;
- exact seven days is stale;
- invalid and future timestamps fail closed;
- the experimental 24-hour calculator remains separate from production authorization.

## L4 versus L5 decision

Current evidence is strong enough to say the Gate 2 authorization code is **implemented and executed successfully**, and that the production application path plus browser truth workflow pass on the same current head.

It is **not sufficient to claim L5 Gate 2 integration yet** under the project's strict ledger rule, because no dedicated test artifact has been designated as proving the complete adjacent-system contract as an integrated unit across all relevant seams.

The next controlled test should therefore be a small decision-chain integration test covering:

`ParkingSession → freshness/state → authorization → findRoute → RouteResult.verified`

with explicit assertions that authorization and route verification remain independent. Only after that artifact executes successfully should L5 be considered for promotion.

## Gate 1

Do not mutate the graph validator spec merely to satisfy an older or externally proposed taxonomy. Current production code does not establish later identifiers such as `UNREACHABLE_NODE`, `WALK_CROSS_LEVEL`, or `VERTICAL_MOVEMENT_SAME_LEVEL`. Reconcile the intended contract against actual graph semantics before changing the validator.

## Gate 3

**FROZEN.** No concurrency implementation, multi-tab synchronization, or related complexity should be introduced while Gates 1 and 2 remain unresolved.

## Operational truth gaps

The current system still does **not** prove physical indoor positioning, survey-grade geometry, exact bay precision, sensor deployment, device performance/battery behavior, accessibility compliance, security/privacy completeness, multi-mall runtime behavior, or real-world Mall of Africa validation. These remain explicit L1/L2 or verification gaps rather than implied capabilities.

## Decision

**Current head `9af8249` is L4-verified for the current automated CI and browser truth scope.**

Gate 2 authorization is implemented and executed. Gate 2 **L5 remains unclaimed** pending the dedicated decision-chain integration test. Gate 1 remains in reconciliation. Gate 3 remains frozen.

**Next controlled move: add the smallest decision-chain integration test, execute it on CI, then reassess L5 without broadening scope.**
