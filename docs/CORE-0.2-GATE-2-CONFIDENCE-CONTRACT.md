# NAVIGRE 2 — Core 0.2 — Gate 2 Confidence Contract v2

**Status:** Candidate contract — Policy C + independent seven-day freshness gate  
**Gate:** Core 0.2 — Gate 2: Confidence Formalization  
**Production integration:** NOT AUTHORIZED until promotion criteria are satisfied  
**Gate 3:** FROZEN

## 1. Purpose

Gate 2 formalizes parking-observation trust without silently changing the historical meaning of persisted `ParkingSession.confidence`.

Contract v2 adopts the semantic model selected by Pass 5:

1. **Stored Observation Confidence** answers: "How trustworthy was the observation when recorded or last updated?"
2. **Freshness** answers: "How old is the observation?"
3. **Routing Authorization** evaluates the applicable safety policy using those separate dimensions plus graph and route constraints.

These dimensions MUST remain separate.

Age MUST NOT mutate or overwrite persisted `ParkingSession.confidence` merely because time has elapsed.

## 2. Decision record

### Candidate policy

**Policy C — Stored Observation Confidence + Independent Freshness.**

The Pass 5 simulation rejected uniform decay as the preferred production semantic because it makes a manually confirmed observation progressively lose its stored meaning solely through elapsed time. Source-class decay is safer but still couples freshness to confidence for sensor observations.

Policy C preserves the existing field semantics and gives freshness its own explicit safety authority.

### Candidate stale rule

The seven-day stale boundary is adopted as an **independent freshness safety gate** for Gate 2:

- age `< 7 days` → not stale;
- age `>= 7 days` → stale and requires visible landmark confirmation before parking routing;
- invalid or non-evaluable temporal data → freshness cannot authorize routing and must fail closed;
- a newer accepted observation/update refreshes freshness using `updatedAt ?? capturedAt`.

This is a declared product safety boundary, not a claim of physical certainty.

### Explicit rejection

The 24-hour half-life remains an analytical/experimental primitive and is **not** the production authority for persisted manual confidence under v2.

The current calculator MUST NOT be wired into production as a replacement for `ParkingSession.confidence`.

## 3. Historical Core 0.1 compatibility

Core 0.1 stores `confidence` as a bounded value in `[0, 1]`, together with `source`, `capturedAt`, and optional `updatedAt`.

The historical confidence boundary remains:

- `< 0.50` → visible landmark confirmation required;
- `>= 0.50` → eligible to pass the confidence boundary.

Contract v2 preserves this interpretation.

The production flow MUST NOT silently reinterpret persisted confidence as a temporal decay score.

## 4. Stored Observation Confidence

`ParkingSession.confidence` is the persisted observation-trust value.

It is not:

- a probability that the car is physically present;
- a continuously decaying clock;
- a guarantee of current parking truth;
- survey-grade localization accuracy.

It remains bounded by the canonical schema and MUST NOT be rewritten by freshness evaluation.

### Non-mutation invariant

For an unchanged persisted session:

```text
storedBefore === storedAfter
```

after any confidence/freshness calculation.

Any migration that intentionally changes the stored field requires a separately specified migration contract.

## 5. Freshness

Freshness is a separate derived domain dimension.

The temporal reference is:

```text
freshnessObservedAt = updatedAt ?? capturedAt
```

A valid timestamp is required for freshness authorization.

### Seven-day boundary

```text
age < 7 days  => fresh enough for the stale-state gate
age >= 7 days => stale
```

The stale gate does not modify stored confidence.

### Future timestamps

A timestamp later than the evaluation time MUST NOT make a record appear more authoritative than its declared stored observation confidence.

Future temporal data is non-authorizing for freshness until a valid temporal state exists.

### Invalid timestamps

Malformed, non-finite, or otherwise invalid temporal data MUST fail closed for freshness authorization.

## 6. Source provenance

The canonical source set remains:

- `manual`
- `gps`
- `ble`
- `wifi`
- `visual`

The Gate 2 calculator's experimental source weights remain documented as:

| Source | Experimental base weight | v2 production meaning |
|---|---:|---|
| manual | 1.00 | stored confidence remains authoritative for observation trust |
| BLE | 0.85 | experimental only; not a replacement for stored confidence |
| Wi-Fi | 0.70 | experimental only; not a replacement for stored confidence |
| GPS | 0.40 | experimental; GPS alone remains below the 0.50 boundary |
| visual | undefined | fail closed until explicitly authorized |

No source receives an invented production weight.

## 7. Manual observation policy

A manually saved parking location is a user-confirmed observation.

Its stored confidence is preserved over time. Passage of 24 or 48 hours MUST NOT automatically reduce `ParkingSession.confidence`.

Freshness may still become stale at the seven-day safety boundary.

Therefore:

```text
manual observation
    ↓
stored confidence remains stable
    ↓
freshness ages independently
    ↓
>= 7 days → landmark confirmation required
```

This prevents the manual-save trap identified during Pass 5 while preserving an explicit maximum-age safety gate.

## 8. Sensor observations

Sensor observations retain their stored observation confidence.

Gate 2 may later introduce source-specific freshness or effective-confidence policy, but such a change requires a new accepted contract or explicit amendment.

The experimental 24-hour calculator is not sufficient authority to overwrite or replace stored confidence.

## 9. Visual observations

`visual` has no authorized Gate 2 production weight.

Until provenance, capture semantics, and reliability policy are explicitly defined, visual evidence MUST fail closed where Gate 2 authorization requires a source policy.

## 10. Routing authorization invariant

Routing authorization is a composite decision.

At minimum:

```text
RoutingAllowed iff
    valid parking identity
    AND stored confidence passes its applicable boundary
    AND freshness is valid
    AND freshness is not stale
    AND graph integrity constraints hold
    AND a route exists
    AND no applicable safety constraint rejects the route.
```

For the historical confidence boundary:

```text
finite stored confidence >= 0.50
    => eligible to pass confidence confirmation

finite stored confidence < 0.50
    => landmark confirmation/recovery required

NaN, +Infinity, -Infinity
    => fail closed
```

For freshness:

```text
valid age < 7 days
    => freshness gate passes

valid age >= 7 days
    => landmark confirmation required

invalid temporal evidence
    => freshness gate fails closed
```

A `0.50` confidence value does not guarantee physical parking truth or route correctness. It only satisfies the declared confidence boundary.

## 11. Route verification remains independent

Parking-observation confidence/freshness MUST NOT be conflated with `RouteResult.verified`.

```text
parking observation trust + freshness
                 !=
route geometry verification
```

A route may remain explicitly unverified even when parking authorization succeeds.

Gate 2 does not upgrade route geometry.

## 12. Failure and fail-closed rules

Gate 2 MUST fail closed when:

- parking identity is invalid;
- stored confidence is non-finite;
- stored confidence is below the applicable threshold;
- freshness timestamp is invalid;
- freshness is stale;
- an unsupported source is being used as sole authorization evidence;
- an applicable policy cannot be evaluated safely.

Fail closed means refusing authorization, requesting visible landmark confirmation, degrading state, or otherwise avoiding unsupported certainty.

## 13. Offline and local-first compatibility

Gate 2 MUST preserve the local-first Parking Passport workflow.

An offline reload must be able to validate and read the persisted session without requiring a network request merely to preserve stored observation confidence.

Freshness is evaluated locally from the accepted temporal fields.

No network availability may be treated as proof of parking truth.

## 14. Persistence boundary

Gate 2 calculation and freshness evaluation MUST NOT mutate persistence as a side effect.

The persistence layer remains responsible for validating/storing the canonical `ParkingSession`.

The policy layer may derive runtime authorization state without rewriting the underlying observation.

## 15. Acceptance tests — Contract v2

Before production promotion, tests MUST establish:

1. stored confidence remains bounded to `[0,1]`;
2. stored confidence is unchanged after freshness evaluation;
3. manual confidence remains unchanged at 24h and 48h;
4. `<0.50` requires landmark confirmation;
5. exact `0.50` remains eligible for the confidence boundary;
6. non-finite stored confidence fails closed;
7. age `<7 days` passes the stale-state gate when timestamp data is valid;
8. age `>=7 days` requires landmark confirmation;
9. invalid timestamps fail closed for freshness;
10. future timestamps do not create freshness authorization;
11. `updatedAt` takes precedence over `capturedAt`;
12. a newer accepted update refreshes freshness without changing unrelated stored confidence;
13. visual source remains fail closed without explicit policy;
14. GPS alone cannot satisfy the `0.50` confidence boundary under the declared source policy;
15. parking authorization and `RouteResult.verified` remain independent;
16. offline save → reload preserves stored confidence;
17. offline save → reload → find enforces the accepted freshness/confidence policy;
18. the existing Core 0.1 routing path remains behaviorally compatible for sessions that are below seven days and satisfy the historical confidence boundary.

## 16. Evidence requirements

Gate 2 status MUST obey the NAVIGRE Evidence Ledger:

- **L1 — Defined:** Contract v2 is accepted as the governing semantic model.
- **L2 — Implemented:** domain production code implements the accepted contract.
- **L3 — Tested:** corresponding test artifacts exist.
- **L4 — Executed:** tests physically run and pass.
- **L5 — Integrated:** adjacent persistence, routing, and UI behavior are verified together.
- **L6 — Operational:** behavior is proven in real-world conditions or immutable release evidence.

No claim may exceed the lowest supporting evidence level.

The contract itself is currently a **candidate decision artifact** until explicitly accepted; writing it does not elevate implementation or execution evidence.

## 17. Promotion criteria

Gate 2 may enter the production decision chain only after:

1. Contract v2 is accepted;
2. the v2 regression suite is implemented;
3. the regression suite physically executes and passes;
4. exact-commit execution evidence is recorded;
5. the smallest policy-owned routing authorization boundary is implemented;
6. production integration tests pass;
7. Save → Reload → Find is verified offline;
8. no Core 0.1 compatibility regression is demonstrated;
9. Gate 3 remains frozen.

Until then, the existing Core 0.1 production confidence behavior remains authoritative.

## 18. Explicit non-goals

Gate 2 v2 does not:

- prove physical parking truth;
- provide indoor positioning;
- establish survey-grade coordinates;
- authorize exact parking-bay claims;
- replace graph integrity validation;
- replace route verification;
- resolve concurrency conflicts;
- introduce multi-mall support;
- authorize sensor hardware deployment;
- mutate stored confidence merely because time elapsed.

## 19. Decision status

**Candidate decision:** Adopt Policy C — Stored Observation Confidence + Independent Freshness, with an independent seven-day stale authorization gate.

**Production status:** NOT YET AUTHORIZED.

**Next engineering step:** Implement the Contract v2 regression tests only. Do not modify `page.tsx`. Do not unfreeze Gate 3.
