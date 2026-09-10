# NAVIGRE 2 — Core 0.2 — Gate 2 Confidence Gap Matrix

**Audit target:** `main` at the latest repository HEAD after the Gate 2 contract commit  
**Purpose:** Map each accepted Gate 2 contract requirement to repository evidence and identify the smallest next action.  
**Mutation policy:** Production behavior is not changed by this audit.  
**Gate 3:** FROZEN.

## 1. Executive result

Gate 2 currently has a coherent **domain primitive** and corresponding test artifact, but it is not yet an accepted production decision chain.

The principal gaps are:

1. stored confidence and effective confidence are not yet separated in production code;
2. the 24-hour decay policy is not yet accepted as routing authority;
3. the seven-day stale state and 24-hour decay relationship is not operationally defined;
4. `visual` has no Gate 2 weight and correctly fails closed;
5. the production route path still consumes persisted `session.confidence` through the Core 0.1 helper;
6. no production call site for `calculateParkingConfidence()` or `isParkingRoutingAllowed()` is present;
7. the Gate 2 tests exist, but execution evidence for the relevant HEAD is not established;
8. integration tests for the complete Gate 2 decision chain do not yet exist as demonstrated evidence.

## 2. Contract-to-code matrix

| # | Contract requirement | Repository evidence | Evidence level | Gap classification | Required action |
|---|---|---|---:|---|---|
| 1 | `ParkingSession.confidence` remains bounded stored observation data | Canonical `ParkingSessionSchema` contains `confidence: z.number().min(0).max(1)` alongside `source`, `capturedAt`, and optional `updatedAt` | L2 | Strength | Preserve schema semantics |
| 2 | Historical `<0.50` confirmation boundary remains compatible | `shouldRequestLandmarkConfirmation(confidence)` returns `confidence < 0.5` | L2 | Strength | Preserve until migration decision |
| 3 | Production currently uses stored confidence | `page.tsx` calls `shouldRequestLandmarkConfirmation(session.confidence)` before `findRoute()` | L2 | Current behavior | Do not replace yet |
| 4 | Effective confidence is a distinct derived concept | Gate 2 calculator defines `calculateParkingConfidence()` | L2 | Implemented primitive | Keep isolated until policy accepted |
| 5 | Effective confidence uses authorized source weights | Calculator contains manual 1.0, BLE 0.85, Wi-Fi 0.7, GPS 0.4 | L2 | Implemented | Preserve pending contract acceptance |
| 6 | Visual source fails closed until authorized | Calculator returns zero for unsupported/unweighted `visual`; tests cover it | L3 artifact | Strength | Preserve; define visual provenance later |
| 7 | Temporal decay is deterministic | Calculator defines 24-hour half-life and tests cover 0/1/2 half-lives | L3 artifact | Policy not yet accepted | Decide scope of decay before production use |
| 8 | `updatedAt` takes precedence | Calculator explicitly uses `updatedAt ?? capturedAt`; test covers precedence | L3 artifact | Semantics need integration definition | Retain; test against selected freshness policy |
| 9 | Future timestamps cannot increase confidence | Calculator clamps elapsed time at zero; test covers future timestamp | L3 artifact | Strength | Preserve |
| 10 | Invalid timestamps fail closed | Calculator returns zero decay; test covers invalid date | L3 artifact | Strength | Preserve |
| 11 | Routing threshold is exact at 0.50 | `isParkingRoutingAllowed()` uses finite `>= 0.5`; tests cover exact and below-threshold cases | L3 artifact | Not production authority | Promote only after contract acceptance |
| 12 | Non-finite routing confidence fails closed | Tests cover NaN and both infinities | L3 artifact | Integration missing | Add decision-chain tests after policy lock |
| 13 | Persisted confidence is not mutated by calculation | Calculator performs pure calculation and no persistence/I/O | L2 | Direct mutation absent; regression test not demonstrated | Add explicit non-mutation test |
| 14 | Manual observations must have explicit temporal semantics | Contract lists Policy A/B/C; calculator currently decays manual observations | L1/L2 | **Specification gap** | Select policy before integration |
| 15 | Seven-day stale state relationship must be explicit | `getParkingState()` separately uses `updatedAt ?? capturedAt` and a seven-day boundary | L2 | **Specification gap** | Decide whether stale is independent, subordinate, or part of routing policy |
| 16 | Gate 2 must not silently replace Core 0.1 semantics | Production still uses Core 0.1 helper; contract explicitly prohibits premature replacement | L2 | Strength | Preserve until promotion |
| 17 | Routing must remain independent of sensor implementation | `findRoute()` consumes graph nodes/edges and does not take GPS/BLE/Wi-Fi observations | L2 | Strength | Preserve architecture |
| 18 | Route geometry verification remains distinct from parking confidence | `RouteResult` has independent `verified`; UI discloses verified vs unverified geometry | L2 | Strength | Preserve distinction |
| 19 | Gate 2 calculator must be integrated before claiming integrated Gate 2 | Repository search finds calculator and tests but no production call site | L3 artifact / integration unestablished | **Integration gap** | Add a policy-owned decision layer, then wire it through the production path |
| 20 | Gate 2 tests must physically execute | Test artifact exists; no execution result for current HEAD is established; commit status is pending with zero statuses | L3 / execution unestablished | **Evidence gap** | Run local/CI tests and record output for exact commit |
| 21 | Complete production decision chain must be tested | Current production path is load → schema → session.confidence → Core 0.1 helper → findRoute; no demonstrated Gate 2 integration test | L2 | **Test gap** | Add integration/E2E scenarios after contract lock |
| 22 | Gate 2 must not claim Level 4/5 from workflow definitions alone | Standard CI runs typecheck + unit tests; separate workflow runs build + Playwright; configuration is present | L2 | Evidence limitation | Record actual workflow run evidence |
| 23 | No exact bay claims without supporting truth | Parking Passport contract and UI explicitly avoid exact bay precision | L2 | Strength | Preserve |
| 24 | Local persistence validates stored data | `saveParkingSession()` parses with `ParkingSessionSchema`; load path is established in production | L2 | Adjacent strength | Preserve while integrating Gate 2 |

## 3. Current production decision chain

```text
IndexedDB
   ↓
loadActiveParkingSession()
   ↓
ParkingSessionSchema validation
   ↓
React hydration
   ↓
session.confidence
   ↓
shouldRequestLandmarkConfirmation()
   ↓
findRoute()
   ↓
RouteResult.verified
   ↓
UI disclosure
```

This is the current production chain. Gate 2 is **not** in this chain.

The repository's production page directly calls the Core 0.1 helper with `session.confidence` and only then calls `findRoute()`. fileciteturn87file0L2-L15

## 4. Gate 2 primitive chain

```text
ParkingSession observation projection
   ↓
source weight
   ↓
temporal decay
   ↓
effective confidence
   ↓
isParkingRoutingAllowed()
```

The calculator is deliberately pure: it performs no persistence, routing, mutation, or conflict resolution. fileciteturn120file0L2-L10

The repository search confirms both calculator functions are currently confined to the calculator module and its test artifact rather than a production caller. fileciteturn86file0L2-L16

## 5. Important contract mismatch discovered

The existing Parking Passport documentation defines confidence as a trust estimate and states that `<0.50` requires landmark confirmation. fileciteturn82file0L2-L2

The Gate 2 calculator additionally makes **age** a determinant of its derived score. Its tests explicitly expect manual confidence to decay after one day. fileciteturn110file0L1-L2

Therefore the unresolved question is not whether the formula works mathematically. The unresolved question is whether **time is authorized to change the routing meaning of a previously stored observation**.

That is a policy/specification decision, not a coding defect.

## 6. Stale-state relationship

The existing parking state helper independently defines:

- `empty`
- `active`
- `stale`

and uses `updatedAt ?? capturedAt`, with a seven-day stale boundary. fileciteturn83file0L2-L2

Repository search found no demonstrated production caller of `getParkingState()` in the Find My Car path. Therefore the seven-day state machine is currently a domain seam rather than established routing authority.

This creates a second integration gap:

```text
24h effective-confidence decay
            ?
            ↓
7d stale state
            ?
            ↓
routing authorization
```

The question marks must be resolved by contract, not inferred from implementation proximity.

## 7. Gate 2 acceptance-test gap

The existing test artifact covers:

- authorized source weights;
- visual fail-closed behavior;
- temporal half-life behavior;
- future timestamps;
- invalid timestamps;
- `updatedAt` precedence;
- source-specific decay;
- `[0,1]` bounds;
- exact routing threshold;
- NaN and infinity rejection. fileciteturn110file0L1-L2

However, the following contract-level tests are still required before production promotion:

1. explicit non-mutation of persisted confidence;
2. selected manual-observation policy;
3. selected relationship between freshness and stale state;
4. production decision-chain authorization;
5. preservation of Core 0.1 behavior for existing sessions;
6. separation of parking confidence from `RouteResult.verified`;
7. fail-closed behavior when the effective-confidence policy cannot be evaluated;
8. end-to-end behavior for save → reload → find under the selected policy.

## 8. CI evidence status

The standard CI workflow is configured for `npm ci`, typecheck, and unit tests. fileciteturn111file0L2-L10

The separate Parking Truth Test workflow performs production build, starts Next.js, waits for the application, and runs Playwright. fileciteturn112file0L2-L10

For the previous Gate 2 test commit, the GitHub commit status currently reports `pending` with zero status entries. fileciteturn114file0L2-L10

Therefore the workflow definitions establish **what would be executed**, not that it has executed successfully for the current Gate 2 state.

## 9. Dependency-risk note

The current `package.json` uses exact dependency versions rather than loose `^`/`latest` ranges. fileciteturn113file0L2-L10

Therefore the previously raised loose-semver dependency-pinning concern is **not a current Gate 2 defect** based on the repository state audited here.

## 10. Action classification

### DEFECT → FIX

No confirmed Gate 2 implementation defect has been established by this matrix.

### RISK → MITIGATE

- accidental semantic replacement of stored confidence;
- assuming decay policy is accepted because the formula is tested;
- assuming CI execution from workflow configuration;
- conflating stale state with effective confidence;
- promoting an orphaned primitive into production without integration tests.

### STRENGTH → PRESERVE

- canonical `ParkingSession` schema;
- pure confidence calculator;
- fail-closed unsupported/invalid inputs;
- graph-only routing;
- independent route verification;
- explicit uncertainty disclosure;
- local-first persistence;
- exact dependency versions.

### TRADE-OFF → DOCUMENT

- uniform vs source-class decay;
- independent freshness vs confidence-as-freshness;
- seven-day stale semantics relative to routing.

### SPECULATION → VERIFY

- whether 24-hour decay reflects real parking-session behavior;
- whether manual observations should age out;
- whether seven-day stale state should block navigation;
- whether current Core 0.1 Level 5 claims are reproducibly established on the relevant commit.

## 11. Evidence ledger after this audit

| Component | Highest justified level now | Reason |
|---|---:|---|
| Stored ParkingSession confidence contract | L2 | Schema and production use exist |
| Core 0.1 confidence boundary | L2/L3 artifact | Helper exists and is tested in repository; execution not reconstructed here |
| Gate 2 calculator | L2 | Source committed |
| Gate 2 calculator tests | L3 | Test artifact exists |
| Gate 2 test execution | Unestablished | No execution evidence for the relevant HEAD |
| Gate 2 production integration | Unestablished | No production call site |
| Seven-day stale state | L2 | Helper exists; production routing consumer not established |
| Gate 2 contract | L1 | Documented as pending policy acceptance |
| Gate 3 | L1 | Frozen |

## 12. Decision

**Gate 2 remains in contract-and-verification phase.**

No production integration change is authorized by this matrix.

The next engineering action is **not** to edit `page.tsx`.

The next action is to make the semantic decision explicit, then create the smallest policy-owned domain boundary required to implement it.

### Recommended order

1. Accept/reject/modify the 24-hour decay scope.
2. Define manual observation semantics.
3. Define the seven-day stale relationship.
4. Add missing contract tests.
5. Execute the complete test suite against the exact commit.
6. Introduce a small routing-authorization domain function if the accepted contract requires one.
7. Integrate that function into production.
8. Execute browser-level Save → Reload → Find verification.
9. Record Level 4/5 evidence.

**Gate 3 remains frozen throughout.**
