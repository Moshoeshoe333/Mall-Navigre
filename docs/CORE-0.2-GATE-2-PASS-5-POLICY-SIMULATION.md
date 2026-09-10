# NAVIGRE 2 — Core 0.2 — Gate 2 Pass 5 Policy Simulation

**Purpose:** Stress-test the three candidate confidence policies before any production integration.

**Audit discipline:** 33×3 Sieve + 7-Level Evidence Ledger.

**Mutation policy:** No production behavior changed by this pass.

**Gate 3:** FROZEN.

## 1. Executive result

Pass 5 confirms that the principal unresolved issue is semantic rather than mathematical: a temporal decay formula can be internally correct while still being the wrong authority for a previously stored parking observation.

The simulation rejects **Uniform Decay** as the preferred production policy because it causes a manually saved parking observation to fall from 1.0 to 0.5 after 24 hours and 0.25 after 48 hours.

**Source-Class Decay** avoids degrading manual observations but still makes sensor freshness part of the confidence score, which mixes two different questions: observation trust and record age.

**Policy C — Stored Observation Confidence + Independent Freshness** survives the semantic failure matrix most cleanly. Under this model:

- `ParkingSession.confidence` remains the stored trust estimate of the observation;
- freshness is evaluated independently from that stored value;
- the existing seven-day stale boundary can act as an explicit freshness/safety gate only if the contract authorizes it;
- a 24-hour age must not silently rewrite a user's stored manual confidence;
- Gate 2 must not replace Core 0.1 semantics until the policy is explicitly accepted.

This is a **policy recommendation produced by simulation**, not yet a production authorization.

## 2. Candidate policies

### Policy A — Uniform Decay

`effectiveConfidence = sourceWeight × temporalDecay`

All sources use the same 24-hour half-life.

### Policy B — Source-Class Decay

Manual observations remain stable while sensor-derived observations decay over time.

This separates manual persistence from sensor freshness better than Policy A, but still embeds age directly into the confidence score for some sources.

### Policy C — Stored Confidence + Independent Freshness

Stored observation confidence is not rewritten by age.

Freshness is evaluated as a separate domain dimension. A routing decision may consume both values, but they retain distinct meanings and failure rules.

## 3. Baseline simulation values

Gate 2 currently defines source weights:

| Source | Base weight |
|---|---:|
| manual | 1.00 |
| BLE | 0.85 |
| Wi-Fi | 0.70 |
| GPS | 0.40 |
| visual | 0.00 / fail closed |

The current calculator uses a 24-hour half-life and a routing threshold of `0.50`. The calculator is a pure primitive and does not mutate persistence or call routing. This simulation therefore evaluates the policy semantics separately from implementation integration.

## 4. Scenario matrix

### Scenario 1 — New manual save

**Input:** manual observation, age 0.

| Policy | Result | Decision |
|---|---:|---|
| A | 1.00 | Routable |
| B | 1.00 | Routable |
| C | stored 1.00; freshness fresh | Routable |

**Result:** All policies pass.

### Scenario 2 — Manual observation after 24 hours

**Input:** manual observation, age 24h.

| Policy | Result | Decision |
|---|---:|---|
| A | 0.50 | Boundary-routable |
| B | 1.00 | Routable |
| C | stored 1.00; freshness aged | Routable unless an independently authorized freshness gate says otherwise |

**Failure concern:** Policy A makes the meaning of the stored manual observation depend on elapsed time even though the stored confidence itself represents observation trust.

**Result:** Policy A fails semantic preference. Policies B/C pass.

### Scenario 3 — Manual observation after 48 hours

**Input:** manual observation, age 48h.

| Policy | Result | Decision |
|---|---:|---|
| A | 0.25 | Confirmation required |
| B | 1.00 | Routable |
| C | stored 1.00; freshness aged | Routable unless independently blocked by an accepted freshness rule |

**Result:** Policy A fails the manual-save preservation requirement. Policies B/C pass provisionally.

### Scenario 4 — BLE observation

**Input:** BLE observation, age 0/24h/48h.

| Age | Policy A | Policy B | Policy C |
|---|---:|---:|---|
| 0h | 0.85 | 0.85 | stored observation + independent freshness |
| 24h | 0.425 | 0.425 | stored observation + independent freshness |
| 48h | 0.2125 | 0.2125 | stored observation + independent freshness |

**Result:** A and B behave identically for BLE under the current source-class proposal. C keeps freshness separate and therefore avoids redefining the stored observation score.

### Scenario 5 — Wi-Fi observation

**Input:** Wi-Fi observation, age 0/24h/48h.

| Age | Policy A | Policy B | Policy C |
|---|---:|---:|---|
| 0h | 0.70 | 0.70 | stored observation + independent freshness |
| 24h | 0.35 | 0.35 | stored observation + independent freshness |
| 48h | 0.175 | 0.175 | stored observation + independent freshness |

**Result:** A/B make age part of the effective confidence score. C preserves the distinction between trust and freshness.

### Scenario 6 — GPS observation

**Input:** GPS observation, age 0.

| Policy | Result | Decision |
|---|---:|---|
| A | 0.40 | Not routable |
| B | 0.40 | Not routable |
| C | stored observation; GPS source remains below authorization threshold | Not routable without another accepted signal/policy |

**Result:** All policies preserve the important Gate 2 invariant that GPS alone cannot authorize parking routing.

### Scenario 7 — Visual observation

**Input:** visual source with no authorized Gate 2 weight.

| Policy | Result | Decision |
|---|---:|---|
| A | 0.00 | Fail closed |
| B | 0.00 | Fail closed |
| C | no authorized confidence authority | Fail closed |

**Result:** All policies pass. No visual score is invented.

### Scenario 8 — Record older than seven days

**Input:** observation age >7d.

The existing domain state helper separately defines a seven-day stale boundary. The simulation therefore tests two possible meanings rather than silently assuming one:

**Variant C1 — stale is advisory:** stored confidence remains unchanged and the UI warns that the record is old.

**Variant C2 — stale is an authorization gate:** stale records require visible landmark confirmation before routing.

| Policy | C1 | C2 |
|---|---|---|
| A | already strongly degraded | confirmation likely required |
| B | manual may remain routable; sensors degraded | confirmation required |
| C | stored confidence preserved | confirmation required by independent freshness gate |

**Preferred result:** Policy C + C2 is the strongest safety interpretation if the product wants a hard upper bound on parking-record age while avoiding the 24-hour manual-save trap.

**Important:** C2 is a policy proposal, not yet an accepted production rule.

### Scenario 9 — Updated observation

**Input:** `updatedAt` is newer than `capturedAt`.

The current calculator uses `updatedAt ?? capturedAt` as its temporal reference.

**Result:** This precedence is coherent for a freshness calculation and should remain in the eventual contract. The simulation does not authorize persistence mutation or redefine the meaning of `updatedAt`.

### Scenario 10 — Invalid timestamp

**Input:** malformed or non-finite observation time.

**Result:** fail closed. No candidate policy should allow an invalid time value to increase routing authority.

### Scenario 11 — Future timestamp

**Input:** observation timestamp later than the evaluation time.

**Result:** elapsed time must clamp at zero. A future timestamp must never create confidence greater than the source's authorized maximum.

### Scenario 12 — Offline reload

**Input:** persisted `ParkingSession` is loaded after application restart with no network.

**Result:** Policy C is the cleanest compatibility model because stored observation confidence remains available locally while freshness can be evaluated independently. No network signal is required merely to preserve the stored observation.

The existing local-first architecture must remain intact.

### Scenario 13 — Unverified route geometry

**Input:** parking decision is authorized, but `RouteResult.verified === false`.

**Result:** parking confidence must not be conflated with route geometry verification. The route may remain explicitly unverified while parking confidence is independently authorized.

All candidate policies pass if this separation is preserved.

## 5. Failure matrix summary

| Requirement | A Uniform | B Source-Class | C Independent Freshness |
|---|---|---|---|
| New manual save | PASS | PASS | PASS |
| Manual after 24h | **FAIL semantic preference** | PASS | **PASS** |
| Manual after 48h | **FAIL semantic preference** | PASS | **PASS** |
| Sensor aging | PASS mechanically | PASS mechanically | PASS with separate freshness |
| GPS cannot authorize alone | PASS | PASS | PASS |
| Visual fail closed | PASS | PASS | PASS |
| Invalid time fail closed | PASS | PASS | PASS |
| Future time cannot boost | PASS | PASS | PASS |
| Offline stored observation preserved | PASS | PASS | **PASS strongest separation** |
| Stale >7d semantics | **Entangled** | **Partly entangled** | **Explicitly separable** |
| Route verification separation | PASS | PASS | PASS |
| Core 0.1 compatibility | **Risk** | Better | **Best fit** |

## 6. 33×3 classification

### EXISTENCE

- Gate 2 calculator exists.
- Source weights exist.
- 24-hour decay exists.
- Routing threshold exists.
- Core 0.1 stored confidence exists.
- Seven-day stale helper exists.

### COHERENCE

- The calculator is pure and isolated.
- Stored and effective confidence can be treated as separate concepts.
- Policy C provides the cleanest semantic boundary.
- GPS remains below the routing threshold.
- Visual remains fail closed.
- Route geometry verification remains independent.

### FAILURE

- Uniform decay exposes a semantic failure for manually saved observations.
- Source-class decay still couples age to the confidence score for sensor observations.
- Independent freshness provides the cleanest place to define stale-session safety without rewriting stored observation trust.

## 7. Policy decision produced by Pass 5

### Recommended Gate 2 policy

**Adopt Policy C as the candidate for Gate 2 Contract v2:**

> Stored Observation Confidence and Freshness are separate domain concepts. Age does not mutate or overwrite `ParkingSession.confidence`. Routing authorization may require both a valid stored confidence and an independently defined freshness state.

### Recommended stale rule for v2

Use the existing seven-day stale boundary as an independent safety gate:

- `<7 days`: freshness does not rewrite stored confidence;
- `>=7 days`: require visible landmark confirmation before parking routing;
- invalid/future time data: fail closed for freshness evaluation;
- a new observation/update refreshes freshness using `updatedAt ?? capturedAt` according to the accepted contract.

This rule is deliberately proposed as a contract decision, not inferred from the current helper's mere existence.

### What is explicitly rejected

- Do not multiply stored manual confidence by the 24-hour decay factor.
- Do not replace `ParkingSession.confidence` with `calculateParkingConfidence()`.
- Do not treat the calculator's existing 24-hour half-life as automatically production-authoritative.
- Do not use `RouteResult.verified` as a substitute for parking confidence.
- Do not unfreeze Gate 3.

## 8. Evidence status

This document establishes a **reasoned policy simulation artifact**, not Level 4 execution evidence.

The numerical scenarios above are deterministic consequences of the committed calculator constants and formula. They demonstrate policy behavior mathematically, but they do not prove that the TypeScript tests physically executed on the current repository HEAD.

Therefore:

- Gate 2 calculator: **L2 implementation artifact**;
- Gate 2 tests: **L3 test artifact**;
- Pass 5 policy simulation: **L2 analytical artifact**;
- Gate 2 execution: **still unestablished**;
- Gate 2 production integration: **not authorized yet**.

## 9. Next gate action

If Policy C + independent seven-day stale authorization is accepted, the next mutation should be limited to the domain contract and tests:

1. create Gate 2 Contract v2;
2. encode stored-confidence/non-mutation semantics;
3. encode independent freshness semantics;
4. encode seven-day stale confirmation rule;
5. add explicit regression tests for Core 0.1 compatibility;
6. run the complete test suite against the exact commit;
7. only after successful evidence, create the smallest policy-owned routing authorization boundary;
8. integrate into production without changing Gate 3.

**No `page.tsx` change is authorized by Pass 5.**
