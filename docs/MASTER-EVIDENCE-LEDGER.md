# NAVIGRE 2 — Master Evidence Ledger

**Audit date:** 2026-09-14  
**Current repository HEAD / code-under-test:** `aafebed908c6ef4363d38d109796ba0a9f307d92`  
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

**Important:** a test file is L3, not L4. A workflow definition is not execution evidence. A commit is not proof that runtime behavior works. Historical L4 evidence does not silently transfer to later code-under-test.

## Current ledger

| Area | Highest justified level | Classification | Evidence / next action |
|---|---:|---|---|
| Core 0.1 Parking Truth | L4 historical | Strength / evidence boundary | The last independently evidenced current-head browser workflow was against `9af8249`. Later commits advanced main; therefore that L4 claim is historical until the new head executes. |
| IndexedDB local-first persistence | L4 historical | Strength | Existing browser truth workflow established execution on `9af8249`; current head has no recorded workflow/status execution. |
| Canonical ParkingSession confidence | L2 | Strength | Stored observation confidence remains canonical persisted data and is not silently mutated by freshness evaluation. |
| Core 0.1 confidence boundary | L4 historical | Compatibility boundary | `<0.50` rejects routing / requests confirmation; exact `0.50` remains eligible. Historical regression evidence exists; current-head execution remains unverified. |
| Gate 2 calculator | L2 | Experimental primitive | Source-weight / 24h half-life calculator remains outside production authorization. |
| Gate 2 calculator tests | L4 historical | Executed | 30 calculator tests passed on historical current-head CI run `34584682285` at `9af8249`. |
| Gate 2 Contract v2 / Policy C | L1 | Candidate decision | Policy semantics remain a governance decision unless explicitly promoted. |
| Gate 2 regression suite | L4 historical | Executed | Historical CI passed 10 test files / 88 tests at `9af8249`. No execution evidence is being invented for `aafebed`. |
| Gate 2 routing authorization boundary | L4 historical | Strength / bounded integration | Policy-owned authorization is implemented and was executed successfully on `9af8249`; current-head execution is pending. |
| Gate 2 production decision chain | L3 current head | Integration artifact exists | `src/domain/parking/decision-chain.test.ts` now exists on `aafebed`, covering session → authorization → route calculation and independence of `RouteResult.verified`. It has not yet been given L4 execution evidence on the current head. |
| Seven-day stale state | L4 historical | Hardened seam | Exact seven-day boundary, invalid timestamps, future timestamps, and `updatedAt` precedence are regression-tested historically. |
| Experimental decay separation | L4 historical | Compatibility protection | Historical regression coverage proves experimental calculator decay is separate from stored manual confidence / production authorization. |
| Graph integrity | L3 current head | Active hardening | R1 transition-endpoint validator is implemented and its regression artifact now covers directional transitions, lift failover, unavailable vertical transitions, and accessibility policy separation. Current-head execution remains pending. |
| Invariant R1 — transition endpoint reachability | L3 current head | Hardened structural seam | `validateTransitionEndpointReachability` exists. Current tests cover active same-level pedestrian connectivity and failure cases plus routing boundaries. No L4 claim until the exact current head executes. |
| Deterministic routing | L4 historical | Strength | A* routing was executed in the historical browser truth workflow; current R1 additions have not yet been execution-verified. |
| Localization | L2 interface | Capability gap | GPS/BLE/Wi-Fi remain abstractions, not operational indoor positioning. |
| Accessibility | L2 partial | Verification gap | Automated keyboard / screen-reader verification remains outstanding. |
| Sensors | L2 abstraction | Capability gap | No physical sensor deployment evidence. |
| Performance/battery | L1/L2 | Verification gap | Benchmarks and device measurements remain outstanding. |
| Security/privacy | L1/L2 | Verification gap | Dedicated audit remains outstanding. |
| Multi-mall | L2 partial | Capability gap | Architecture seams exist; multi-mall runtime proof remains outstanding. |
| Gate 3 concurrency | L1 | **FROZEN** | No multi-tab concurrency implementation until Gates 1 and 2 are resolved. |
| Real Mall of Africa truth | L1 | Operational gap | Schematic geometry is not physical validation. Requires verified data and field walkthrough evidence. |
| Dependency reproducibility | L4 historical | Strength | `npm ci` passed on historical current head; later commits require fresh execution before the claim is renewed. |

## 2026-09-14 evidence reconciliation

This audit deliberately distinguishes **repository progress** from **executed evidence**.

### Confirmed repository progress since the previous ledger head

1. The repository advanced from the previously evidenced `9af8249...` head to `aafebed...`.
2. A dedicated decision-chain regression artifact exists at `src/domain/parking/decision-chain.test.ts`.
3. The decision-chain artifact covers:
   - eligible `ParkingSession` authorization before route calculation;
   - independence between authorization and `RouteResult.verified`;
   - low-confidence rejection preventing route calculation;
   - stale-evidence rejection preventing route calculation.
4. Invariant R1 coverage was expanded to exercise:
   - one-way escalator directionality;
   - secondary-lift failover when the primary lift is unavailable;
   - no cross-floor route when all vertical transitions are unavailable;
   - inaccessible staircase exclusion under accessible-only routing while preserving normal routing.
5. The corrupted-persistence E2E setup was stabilized so the test waits for application hydration before deliberately corrupting IndexedDB, avoiding a test race.

These are **code/test artifacts**, therefore L2/L3 evidence only until physically executed.

## Current-head execution boundary

Exact code-under-test: `aafebed908c6ef4363d38d109796ba0a9f307d92`.

A direct check of commit-associated PR workflow runs returned **zero runs**, and the combined commit status returned **no statuses** for this exact SHA at audit time.

Therefore this ledger intentionally makes **no L4 claim for `aafebed`**. This is not a product failure finding; it is an evidence gap. The repository must not manufacture a workflow run, reuse a historical green run, or conflate an older successful execution with the newer code.

## Gate 2 L5 decision

The dedicated decision-chain test artifact that was previously the next controlled move now exists on the current head. It is still L3 until executed.

The intended chain remains:

`ParkingSession → freshness/state → authorization → findRoute → RouteResult.verified`

The test explicitly keeps authorization independent from route verification. Once this exact head executes successfully in CI, the evidence can be reassessed for L5. L5 is **not promoted by the existence of the test alone**.

## Gate 1 — R1 hardening

Invariant R1 is now the active graph-truth seam:

> Every active vertical transition must terminate at an active, same-level pedestrian component on both sides.

The current implementation deliberately excludes unavailable transitions from R1 structural validation and keeps accessibility preferences as routing-policy concerns. This separation is supported by the current test artifact.

The next graph-truth work should proceed only after current-head execution evidence is obtained, then reconcile the next invariant family rather than importing an external taxonomy wholesale.

Candidate next families remain:

- **R2 — Cross-Floor Semantic Integrity**
- **R3 — Graph Reachability**
- **R4 — Destination Reachability**
- **R5 — Accessibility Consistency**
- **R6 — Failure/Failover Integrity**

## Gate 3

**FROZEN.** No concurrency implementation, multi-tab synchronization, or related complexity should be introduced while Gates 1 and 2 remain unresolved.

## Operational truth gaps

The current system still does **not** prove physical indoor positioning, survey-grade geometry, exact bay precision, sensor deployment, device performance/battery behavior, accessibility compliance, security/privacy completeness, multi-mall runtime behavior, or real-world Mall of Africa validation. These remain explicit L1/L2 or verification gaps rather than implied capabilities.

## Decision

**Audit conclusion for 2026-09-14:** the project has materially advanced its truth-hardening layer, but the exact current head `aafebed` has no recorded CI/status execution evidence at audit time. The strict ledger therefore caps new current-head evidence at L3 where artifacts exist.

The most important next controlled move is **execution, not feature expansion**:

1. Execute the exact current head `aafebed` through the normal CI/browser truth path.
2. Record the resulting exact SHA, workflow IDs, test counts, and outcomes.
3. Reassess Gate 2 L5 from the decision-chain artifact.
4. Then continue Gate 1 reconciliation into R2 only if the evidence remains green.

**No fabricated green. No inherited green. No premature L5.**
