# NAVIGRE 2 — Master Evidence Ledger

**Audit date:** 2026-09-11  
**Code-under-test commit:** `4a1c0e72e83fe8a823f39145550540397f6ab74e`  
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
| Core 0.1 Parking Passport | L4/L5 historical + current E2E L4 | Strength / evidence | Current commit `4a1c0e7` passed CI unit/typecheck and the Parking Truth browser workflow. Integrated production semantics remain intentionally unchanged. |
| IndexedDB local-first persistence | L2 | Strength | Persistence implementation exists; current browser workflow passed the existing truth test. Gate 2 integration remains separate. |
| Canonical ParkingSession confidence | L2 | Strength | Bounded stored observation confidence remains canonical persisted data. |
| Core 0.1 confidence boundary | L2/L4 | Compatibility boundary | `<0.50` requests landmark confirmation; exact `0.50` remains eligible. Regression suite executed successfully. |
| Gate 2 calculator | L2 | Experimental primitive | Source-weight/24h-decay calculator exists. It remains outside production authorization. |
| Gate 2 calculator tests | L4 | Executed | 30 calculator tests passed in the exact-commit CI run. |
| Gate 2 Contract v2 | L1 | Candidate decision | Policy C + independent seven-day freshness gate remains candidate until explicitly accepted. |
| Gate 2 Policy C regression suite | L4 | **Pass 7 executed** | 13 new freshness/compatibility tests passed in the exact-commit CI run. |
| Gate 2 production integration | Unestablished | Integration gap | `page.tsx` remains untouched. Do not integrate until contract acceptance and policy-owned authorization boundary are established. |
| Seven-day stale state | L4 | Hardened seam | Exact seven-day boundary, invalid timestamp fail-closed, future timestamp non-authorizing, and `updatedAt` precedence are now regression-tested and passed. |
| Graph integrity | L2 | Reconciliation required | Existing validator is implemented, but strict later taxonomy is not established. Reconcile before changing it. |
| Deterministic routing | L2/L4 historical | Strength | A* routing remains separate from parking confidence; current browser truth workflow passed. |
| Localization | L2 interface | Capability gap | GPS/BLE/Wi-Fi are abstractions, not operational indoor positioning. |
| Accessibility | L2 partial | Verification gap | Automated keyboard/screen-reader verification remains outstanding. |
| Sensors | L2 abstraction | Capability gap | No physical sensor deployment evidence. |
| Performance/battery | L1/L2 | Verification gap | Benchmarks and device measurements remain outstanding. |
| Security/privacy | L1/L2 | Verification gap | Dedicated audit remains outstanding. |
| Multi-mall | L2 partial | Capability gap | Architecture seams exist; multi-mall runtime proof remains outstanding. |
| Gate 3 concurrency | L1 | **FROZEN** | No multi-tab concurrency implementation until Gates 1 and 2 are resolved. |
| Real Mall of Africa truth | L1 | Operational gap | Schematic geometry is not physical validation. Requires verified data and field walkthrough evidence. |
| Dependency reproducibility | L2/L4 | Strength | `npm ci` succeeded and exact dependency versions remain in use. CI reported 0 vulnerabilities during install. |

## Pass 7 execution evidence

Exact code-under-test commit: `4a1c0e72e83fe8a823f39145550540397f6ab74e`

**Navigre CI run:** `34582998639`

- `npm ci` — PASS
- `npm run typecheck` — PASS
- `npm test` — PASS
- 8 test files passed
- 66 tests passed
- Gate 2 calculator suite — 30 tests passed
- Gate 2 freshness/compatibility suite — 13 tests passed

**Parking Truth Test run:** `34582998658`

- production build — PASS
- Next.js start — PASS
- application wait — PASS
- Browser Truth Test — PASS
- Playwright report upload — PASS

This establishes **L4 execution evidence for commit `4a1c0e7`**. It does not establish L5 Gate 2 integration because the new policy has not been wired into the production routing path.

## Change made during Pass 7

`src/domain/parking/state.ts` was hardened to match the candidate Gate 2 freshness contract:

- exactly seven days is stale (`>= 7 days`);
- invalid current/observation time is stale;
- future observation timestamps are stale/non-authorizing;
- `updatedAt ?? capturedAt` remains authoritative for freshness.

This is a bounded domain change, not production Gate 2 routing integration.

## Decision

Pass 7 is **executed successfully at L4**. Gate 2 remains **not production-authorized**.

The next controlled step is to resolve explicit acceptance of Contract v2, then implement the smallest policy-owned routing authorization boundary without conflating stored confidence, freshness, and `RouteResult.verified`.

**Gate 3 remains frozen.**
