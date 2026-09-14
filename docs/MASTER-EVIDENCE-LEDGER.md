# NAVIGRE 2 — Master Evidence Ledger

**Audit date:** 2026-09-14  
**Current repository HEAD / code-under-test:** `e94e3583ba46c7358fcd018ee5a2c877ea2cab0a`  
**Current branch:** `main` (reconciliation branch created from this exact boundary)  
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

A test artifact is L3, not L4. Workflow configuration is not execution evidence. A commit is not runtime proof. Historical evidence does not silently transfer to later code-under-test. PR-head evidence does not automatically transfer to a squash-merge SHA.

## Current evidence boundary

PR #10 established the Gate 2 L5 decision-chain artifact at exact PR head:

`c611672bc82fee2cbbf3e9dc8e27c51bac49c11c`

Exact PR-head telemetry observed:

- Navigre CI — run `34834367497`, job `103944710821` (`verify`) — **SUCCESS**
- Parking Truth Test — run `34834367456`, job `103944710055` (`e2e`) — **SUCCESS**

PR #10 was squash-merged into `main` at:

`e94e3583ba46c7358fcd018ee5a2c877ea2cab0a`

At the audit point, the exact merge SHA had:

- PR-associated workflow runs observed: **0**
- commit statuses observed: **0**
- merge-boundary execution evidence: **NOT OBSERVED**

The zero-run observation is a point-in-time result of the evidence query. It is not declared an intrinsic or permanent failure of the SHA. No synthetic workflow trigger is authorized solely to manufacture boundary evidence.

## Current ledger

| Area | Highest justified level | Classification | Evidence / next action |
|---|---:|---|---|
| Core 0.1 Parking Truth | L4 historical | Strength / evidence boundary | Browser truth has independently passed on earlier exact heads; later code boundaries require their own execution evidence. |
| IndexedDB local-first persistence | L4 historical | Strength | Persistence truth is established historically; current merge-boundary execution remains unobserved. |
| ParkingSession confidence | L2 | Strength | Stored confidence remains canonical persisted data and is not silently rewritten by freshness evaluation. |
| Gate 2 calculator | L2 | Experimental primitive | Source-weight / 24h half-life calculator remains outside production authorization. |
| Gate 2 regression suite | L4 historical | Executed | Historical CI evidence remains valid for its exact code-under-test only. |
| Gate 2 authorization | L4 historical / PR-head current integration evidence | Bounded strength | Authorization is policy-owned and remains independent from route verification. |
| Gate 2 L5 decision chain | **L5 PR-head verified** | **Evidence boundary** | Exact PR head `c611672...` passed Navigre CI and Parking Truth. Merge boundary `e94e358...` has NOT OBSERVED execution evidence. |
| R1 — transition endpoint reachability | L4 PR-head evidence | Hardened invariant | Directionality, lift failover, unavailable vertical transitions, and accessibility-policy separation are covered by the R1 artifact and its verified PR-head execution. |
| R2 — cross-floor semantic integrity | L4 PR-head evidence | Hardened invariant | Cross-floor semantic contract established and verified at its exact PR-head boundary. |
| R3 — graph reachability | L4 PR-head evidence | Hardened invariant | Active graph connectivity contract established and verified at its exact PR-head boundary. |
| R4 — destination reachability | L4 PR-head evidence | Hardened invariant | Directional destination reachability and explicit failure cases established and verified at its exact PR-head boundary. |
| R5 — accessibility consistency | L4 PR-head evidence | Hardened invariant | Accessibility declaration consistency established and verified at its exact PR-head boundary; accessible-only routing semantics preserved. |
| R6 — failure/failover integrity | L4 PR-head evidence | Hardened invariant / merge evidence boundary | Failover, total failure, stale-route invalidation, and accessible-only failover were verified at the R6 PR-head. The later merge boundary requires independent evidence. |
| Deterministic A* routing | L4 historical / invariant PR-head evidence | Strength | Routing recomputes against current graph state and excludes unavailable infrastructure. |
| Localization | L2 interface | Capability gap | GPS/BLE/Wi-Fi remain abstractions, not operational indoor positioning. |
| Sensors | L2 abstraction | Capability gap | No physical sensor deployment evidence. |
| Accessibility verification | L2 partial | Verification gap | Automated keyboard / screen-reader verification remains outstanding. |
| Performance / battery | L1/L2 | Verification gap | Benchmarks and device measurements remain outstanding. |
| Security / privacy | L1/L2 | Verification gap | Dedicated audit remains outstanding. |
| Multi-mall | L2 partial | Capability gap | Architecture seams exist; runtime proof remains outstanding. |
| Gate 3 concurrency | **L1** | **FROZEN** | No multi-tab concurrency implementation until Gates 1 and 2 are resolved. |
| Real Mall of Africa truth | L1 | Operational gap | Seed geometry is schematic/unverified; physical validation remains outstanding. |
| Dependency reproducibility | L4 historical | Strength / evidence boundary | `npm ci` has passed on evidenced heads; later exact boundaries require fresh execution evidence. |

## Gate 2 L5 decision chain

The controlled integration boundary is:

`ParkingSession → freshness/state → authorization → findRoute → RouteOperationalState → RouteResult.verified`

The sequential harness deliberately uses one persisted session through controlled state mutations. It proves that:

1. Missing, stale, unsupported, or low-confidence parking state fails closed at authorization.
2. Authorization does not imply route existence.
3. Route existence does not imply route verification.
4. Unavailable nodes and edges invalidate historical routes.
5. Fresh routing recomputes against the current graph.
6. Failover can select an alternate active path.
7. Total route failure returns `null` rather than stale or partial truth.
8. Accessible-only routing does not use inaccessible infrastructure.
9. Persisted session data is not silently rewritten.

The exact PR head was physically executed and passed. The resulting squash-merge SHA has not yet produced observed execution telemetry in the evidence queries used at audit time. Therefore **L5 is not promoted to the merge boundary**.

## R1–R6 invariant lock

R1–R6 are treated as hardened truth seams, with their evidence attached to their exact verified PR-head boundaries. This does not imply L6 operational truth. The invariants remain about software contracts and graph semantics, not physical certification of Mall of Africa.

The six seams are:

- **R1:** transition endpoint reachability
- **R2:** cross-floor semantic integrity
- **R3:** graph reachability
- **R4:** destination reachability
- **R5:** accessibility consistency
- **R6:** failure / failover integrity

Operational availability and canonical topology remain separate concerns. Unavailable infrastructure must not be routed, while structural graph validation must not silently become a sensor or physical-maintenance system.

## 33×3 Spatial Sieve — next controlled audit

After the merge-boundary evidence state is documented, the next engineering phase is the **Graph Truth Core ↔ Localization Interface** audit.

The 33×3 Sieve is an audit lens, not 99 literal features. Each perspective is examined through:

1. **Existence** — does the thing exist and work?
2. **Coherence** — does it agree with adjacent systems?
3. **Failure** — what happens when it is missing, wrong, stale, unavailable, duplicated, or offline?

The spatial audit must specifically protect the boundary:

`GPS / BLE / Wi-Fi / visual / manual observation → LocationObservation → Localization → Mall Graph → Routing`

Localization may supply observations; deterministic routing must not become dependent on an unverified claim of indoor positioning precision.

## Gate 3

**FROZEN at L1.** No concurrency implementation, multi-tab synchronization, or related complexity is to be introduced during this phase.

## Operational truth gaps

The repository does not yet prove survey-grade geometry, exact parking-bay positioning, physical sensor deployment, device battery/performance behavior, accessibility compliance, security/privacy completeness, multi-mall runtime behavior, or real-world Mall of Africa validation. These remain explicit verification gaps.

## Reconciliation decision — 2026-09-14

**Decision:** document the exact evidence boundary and proceed without synthetic telemetry.

- `c611672...` — Gate 2 L5 PR head **VERIFIED**.
- `e94e358...` — squash merge into `main` **CONFIRMED**.
- `e94e358...` — merge-boundary execution evidence **NOT OBSERVED at audit time**.
- Gate 2 L5 merge-boundary promotion — **WITHHELD**.
- Gate 3 — **FROZEN**.
- Next engineering action — **33×3 Spatial Sieve audit at the Graph Truth ↔ Localization boundary**, after this documentation reconciliation is itself verified through the normal PR process.

**No fabricated green. No inherited green. No premature operational claim.**
