# NAVIGRE 2 — Master Evidence Ledger

**Audit date:** 2026-09-11  
**Repository:** `Moshoeshoe333/Mall-Navigre`  
**Audited HEAD:** `230b57c06e9049df4b34f13b7377ff7ba6a72735`  
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
| Core 0.1 Parking Passport | L2/L3 | Strength / evidence reconstruction | Historical L4/L5 evidence exists at `8a956e7510ab2730fdba9d131e3959fb9a679ad0`; current HEAD requires re-execution before any current L4/L5 claim. |
| IndexedDB local-first persistence | L2 | Strength | Canonical save/load path exists. Re-run offline Save → Reload → Find for current-head evidence. |
| Canonical ParkingSession confidence | L2 | Strength | Bounded stored observation confidence remains the canonical persisted field. |
| Core 0.1 confidence boundary | L2/L3 | Compatibility boundary | `<0.50` requests landmark confirmation; exact `0.50` remains eligible. Current execution evidence must be reconstructed. |
| Gate 2 calculator | L2 | Experimental primitive | Source-weight/24h-decay calculator exists. It is not production authority. |
| Gate 2 calculator tests | L3 | Test artifact | Existing tests cover weights, decay, timestamps, bounds and threshold. They must execute on the current accepted commit. |
| Gate 2 Contract v2 | L1 | Candidate decision | Policy C + independent seven-day freshness gate is documented but requires explicit project acceptance before promotion. |
| Gate 2 Policy C regression suite | L3 | Active work | Pass 7 adds non-mutation, seven-day boundary, future/invalid temporal behavior, updatedAt precedence and Core 0.1 compatibility checks. |
| Gate 2 production integration | Unestablished | Integration gap | Do not edit `page.tsx` until contract acceptance + regression execution evidence. |
| Seven-day stale state | L2 | Domain seam | `getParkingState()` implements `updatedAt ?? capturedAt` and seven-day boundary; routing consumption remains unproven. |
| Graph integrity | L2 | Reconciliation required | Existing validator is implemented, but strict later taxonomy is not established. Reconcile before changing it. |
| Deterministic routing | L2 | Strength | A* routing and route result verification remain separate from parking confidence. |
| Localization | L2 interface | Capability gap | GPS/BLE/Wi-Fi are abstractions, not operational indoor positioning. |
| Accessibility | L2 partial | Verification gap | Automated keyboard/screen-reader verification remains outstanding. |
| Sensors | L2 abstraction | Capability gap | No physical sensor deployment evidence. |
| Performance/battery | L1/L2 | Verification gap | Benchmarks and device measurements remain outstanding. |
| Security/privacy | L1/L2 | Verification gap | Dedicated audit remains outstanding. |
| Multi-mall | L2 partial | Capability gap | Architecture seams exist; multi-mall runtime proof remains outstanding. |
| Gate 3 concurrency | L1 | **FROZEN** | No multi-tab concurrency implementation until Gates 1 and 2 are resolved. |
| Real Mall of Africa truth | L1 | Operational gap | Schematic geometry is not physical validation. Requires verified data and field walkthrough evidence. |
| Dependency reproducibility | L2 | Strength | Current package versions are exact; no loose `^`/`latest` dependency ranges in the audited package manifest. |

## Gate 2 current decision

**Candidate:** Policy C — Stored Observation Confidence + Independent Freshness, with an independent seven-day stale authorization gate.

Rules under the candidate contract:

- persisted `ParkingSession.confidence` is not silently decayed by time;
- manual confidence remains unchanged at 24h and 48h;
- freshness is evaluated separately from stored confidence;
- `updatedAt ?? capturedAt` is the temporal reference;
- age `< 7 days` passes the stale-state gate when temporal data is valid;
- age `>= 7 days` requires visible landmark confirmation;
- invalid temporal evidence fails closed;
- GPS alone cannot satisfy the `0.50` boundary under the declared experimental source policy;
- `visual` remains fail closed until explicitly authorized;
- `RouteResult.verified` remains independent;
- the experimental 24-hour half-life calculator is not production routing authority.

These are contract-candidate semantics until accepted and implemented.

## Pass 7 acceptance-test ledger

The regression suite must establish, at minimum:

1. stored confidence remains bounded in `[0,1]`;
2. freshness evaluation does not mutate stored confidence;
3. manual confidence is unchanged at 24h and 48h;
4. `<0.50` requests landmark confirmation;
5. exact `0.50` remains eligible;
6. NaN and infinities fail closed;
7. `<7 days` is not stale;
8. `>=7 days` is stale;
9. invalid timestamps are stale/non-authorizing;
10. future timestamps do not create freshness authorization;
11. `updatedAt` takes precedence;
12. a newer update refreshes freshness without changing confidence;
13. visual remains fail closed;
14. GPS remains below the confidence boundary;
15. parking confidence remains distinct from route verification;
16. existing Core 0.1 behavior remains compatible below seven days.

## Execution gate

After Pass 7 code is committed:

- **L3** may be claimed when the regression artifacts exist.
- **L4** may be claimed only after the exact commit's tests physically execute and pass.
- **L5** remains blocked until persistence/routing/UI integration is executed together.
- **L6** remains blocked until real-world/release evidence exists.

**Next permitted step after L4:** implement the smallest policy-owned routing-authorization boundary.  
**Forbidden until then:** replacing the production `page.tsx` confidence path; unfreezing Gate 3; claiming operational indoor positioning.
