# NAVIGRE 2 — Core 0.2 — Gate 2 Confidence Contract v1

**Status:** Contract draft / architecture decision pending production promotion  
**Gate:** Core 0.2 — Gate 2: Confidence Formalization  
**Production integration:** NOT AUTHORIZED by this document  
**Gate 3:** FROZEN

## 1. Purpose

Gate 2 formalizes how Navigre evaluates the trustworthiness of a parking observation without silently changing the historical meaning of the persisted `ParkingSession.confidence` field.

This contract separates:

1. **stored observation confidence** — the value captured with a parking session;
2. **effective confidence** — a derived runtime value, if and when the Gate 2 policy is explicitly enabled;
3. **routing authorization** — the policy decision that determines whether navigation may proceed.

The distinction is mandatory. A derived confidence calculation must not become a replacement for persisted confidence merely because the calculator exists.

## 2. Historical Core 0.1 semantics

The Core 0.1 Parking Passport stores `confidence` as a bounded value in `[0, 1]`, together with `source`, `capturedAt`, and optional `updatedAt`.

Core 0.1 defines the user-facing routing boundary as:

- confidence `< 0.50`: request visible landmark confirmation;
- confidence `>= 0.50`: eligible to pass the confidence confirmation boundary.

The existing production flow currently consumes the persisted `session.confidence` through `shouldRequestLandmarkConfirmation(session.confidence)` before calling the routing engine.

**Compatibility rule:** Core 0.2 MUST preserve this historical interpretation until a separately accepted migration contract authorizes otherwise.

## 3. Stored observation confidence

`ParkingSession.confidence` represents Navigre's explicit estimate of how trustworthy the parking observation was when it was recorded or last updated.

It is **not** defined as:

- a probability that the car is physically at the claimed location;
- a continuously changing clock value;
- a guarantee that the current user is still parked there;
- a survey-grade localization measurement.

The persisted value remains bounded to `[0, 1]` by the canonical schema.

## 4. Effective confidence

Gate 2 introduces the concept of an **effective confidence** as a derived runtime assessment.

The current experimental calculator uses:

`effectiveConfidence = authorizedSourceWeight × temporalDecay`

with a 24-hour half-life.

This calculation is currently a **domain primitive**, not production routing authority.

The calculator MUST NOT overwrite persisted `ParkingSession.confidence`.

The calculator MUST NOT be wired into production routing until the temporal and source policies in this contract are explicitly accepted and the resulting behavior is covered by executed integration evidence.

## 5. Source provenance policy

The canonical source set is:

- `manual`
- `gps`
- `ble`
- `wifi`
- `visual`

The current Gate 2 calculator authorizes these base weights:

| Source | Base weight | Gate 2 status |
|---|---:|---|
| manual | 1.00 | authorized for calculation |
| BLE | 0.85 | authorized for calculation |
| Wi-Fi | 0.70 | authorized for calculation |
| GPS | 0.40 | authorized; below routing threshold |
| visual | undefined | fail closed pending explicit policy |

No source may receive an invented weight merely to make a calculation complete.

## 6. Temporal semantics

### 6.1 Current contract position

The 24-hour half-life is **experimental Gate 2 policy**, not yet an accepted universal freshness rule for all parking observations.

`updatedAt` takes precedence over `capturedAt` when the calculator evaluates observation time, matching the current Gate 2 primitive.

Future timestamps are clamped so they cannot increase confidence beyond the authorized source weight.

Invalid timestamps fail closed.

### 6.2 Seven-day stale state

Core 0.1 currently contains a separate parking-state rule that treats a session as `stale` when the relevant timestamp is more than seven days old.

The relationship between:

- 24-hour confidence decay, and
- seven-day stale state

is intentionally **not inferred** by this contract.

They represent potentially different concepts and must not be merged without an explicit decision.

## 7. Manual-observation policy

A manually saved parking location is a user-confirmed observation and currently receives a base confidence of `1.00` in the Gate 2 calculator.

However, this contract does **not** yet declare that a manually confirmed observation must decay with the same 24-hour half-life as sensor observations.

Before production promotion, one of the following policies must be explicitly selected:

### Policy A — Uniform decay

All authorized sources decay using the same temporal function.

Consequence: a manual `1.00` observation reaches `0.50` after 24 hours and becomes `<0.50` after 24 hours plus any additional elapsed time.

### Policy B — Source-class decay

Manual observations retain their observation confidence while sensor-derived observations decay according to freshness.

Consequence: stored manual confirmation and sensor freshness are treated as different trust dimensions.

### Policy C — Observation confidence + independent freshness

Stored confidence remains stable, while freshness is evaluated separately as another routing input.

Consequence: confidence does not silently become a proxy for session age.

**Gate 2 v1 recommendation:** Policy C is the cleanest semantic model pending evidence because it avoids redefining an existing field while still allowing freshness to influence navigation safety.

This recommendation is not a production authorization.

## 8. Visual-source policy

`visual` is part of the canonical Core 0.1 source enum but has no authorized Gate 2 weight.

Until a provenance contract establishes what constitutes a visual observation and how its reliability is measured, visual observations MUST fail closed within the Gate 2 calculator rather than receive an arbitrary confidence value.

## 9. Routing authorization invariant

Routing authorization is a policy decision, not the confidence calculation itself.

At minimum:

```text
RoutingAllowed iff
    navigation state is valid
    AND parking observation satisfies its applicable confidence/freshness policy
    AND required graph integrity constraints hold
    AND a route exists
    AND no applicable safety constraint rejects the route.
```

For the confidence boundary specifically:

```text
finite value >= 0.50
    => eligible to pass the confidence boundary

finite value < 0.50
    => confirmation/recovery required

NaN, +Infinity, -Infinity, invalid or unsupported evidence
    => fail closed
```

This does not mean that `0.50` alone guarantees a physically correct route. Graph integrity, route existence, and other declared constraints remain independent requirements.

## 10. Preservation of routing architecture

The routing engine consumes graph nodes and edges. It does not directly consume GPS, BLE, or Wi-Fi observations.

Gate 2 MUST preserve this separation.

Confidence determines whether the parking state is sufficiently trustworthy to enter navigation; it does not change the routing algorithm's graph semantics.

The route's own `verified` state remains distinct from parking-observation confidence.

Therefore:

```text
parking observation confidence
        !=
route geometry verification
```

Neither value may be presented as a substitute for the other.

## 11. Failure and fail-closed rules

Gate 2 MUST fail closed when:

- the observation source is unsupported;
- the source has no authorized policy;
- an observation timestamp is invalid;
- calculated confidence is non-finite;
- required parking identity is invalid;
- applicable routing confidence is below threshold.

Failing closed means rejecting authorization, requesting confirmation, degrading the state, or otherwise refusing to represent unsupported certainty as verified truth.

## 12. Compatibility with `ParkingSession`

Gate 2 MUST consume the canonical Core 0.1 `ParkingSession` contract rather than introducing a duplicate parking-session schema.

The current experimental calculator intentionally accepts the narrow projection:

```ts
Pick<ParkingSession, "source" | "capturedAt" | "updatedAt">
```

No persistence migration is required merely to define effective confidence.

Any future schema migration must be separately specified and tested.

## 13. Boundary examples

### Example 1 — New manual save

```text
source = manual
stored confidence = 1.00
age = 0
```

The observation is eligible under the historical Core 0.1 confidence boundary.

### Example 2 — Manual save after one day

Under the experimental uniform-decay calculator:

```text
1.00 × 0.5 = 0.50
```

This exposes the semantic decision that must be resolved before production integration. It MUST NOT be treated as proof that the manual parking observation itself has become physically unreliable.

### Example 3 — GPS observation at capture time

```text
source weight = 0.40
```

GPS alone cannot satisfy the `0.50` confidence routing boundary.

### Example 4 — Invalid timestamp

```text
observedAt = invalid
```

The calculator returns a fail-closed result and routing authorization MUST NOT be granted on that basis.

### Example 5 — Unverified route geometry

A parking observation may satisfy its confidence policy while the graph route remains `verified: false`.

The system MUST disclose that distinction rather than upgrading the route to verified status.

## 14. Acceptance tests for Gate 2

Before Gate 2 is promoted beyond domain-primitive status, tests MUST establish at least:

1. source weights are exactly the authorized values;
2. unsupported sources fail closed;
3. confidence remains within `[0, 1]`;
4. invalid timestamps fail closed;
5. future timestamps cannot increase confidence;
6. half-life behavior is deterministic;
7. `updatedAt` precedence is deterministic;
8. routing boundary is exact at `0.50`;
9. non-finite values cannot authorize routing;
10. persisted `ParkingSession.confidence` is not mutated by calculation;
11. manual-observation policy is explicitly tested once selected;
12. effective confidence and route verification remain separate;
13. production decision-chain integration is tested end-to-end before promotion.

## 15. Evidence requirements

Gate 2 status MUST obey the NAVIGRE Evidence Ledger:

- **Level 1 — Defined:** this contract and its invariants exist and are accepted.
- **Level 2 — Implemented:** production/domain code implements the accepted contract.
- **Level 3 — Tested:** corresponding test artifacts exist.
- **Level 4 — Executed:** tests physically run and pass.
- **Level 5 — Integrated:** the accepted behavior is verified across adjacent system layers.
- **Level 6 — Operational:** behavior is proven in real-world conditions or immutable release evidence.

The existence of the current calculator and test files does not by itself establish Level 4 or Level 5.

No Gate 2 claim may exceed its lowest supporting evidence level.

## 16. Explicit non-goals

Gate 2 does not, by itself:

- prove physical parking truth;
- provide indoor positioning;
- establish survey-grade coordinates;
- authorize exact bay claims;
- replace graph integrity validation;
- replace route verification;
- resolve concurrency conflicts;
- introduce multi-mall support;
- authorize sensor hardware deployment;
- change persisted confidence semantics without a migration decision.

## 17. Promotion criteria

Gate 2 may be promoted into the production decision chain only after:

1. the manual/source-class/independent-freshness policy is explicitly selected;
2. the 24-hour half-life is either accepted, rejected, or scoped to an explicitly defined observation class;
3. the relationship between effective confidence and the seven-day stale state is documented;
4. the routing authorization invariant is implemented;
5. production integration tests demonstrate the complete decision path;
6. the test suite is physically executed and passing;
7. execution evidence is recorded for the relevant commit;
8. no regression is introduced into the existing local-first Parking Passport workflow.

Until all criteria are satisfied, the Gate 2 calculator remains a domain primitive and production continues to use the existing Core 0.1 confidence boundary.

## 18. Decision record

**Current decision:** DO NOT integrate the Gate 2 calculator into `page.tsx` yet.

**Reason:** The calculator is technically coherent as an isolated primitive, but its temporal semantics have not yet been accepted as the authoritative meaning of navigation readiness.

**Next decision required:** Select the semantic model for stored confidence, freshness, and effective navigation readiness, then implement and execute tests against that accepted contract.
