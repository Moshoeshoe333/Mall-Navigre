# Spatial Localization Freshness & Conflict Contract

## Purpose

This seam establishes the temporal truth boundary between probabilistic `LocationObservation` evidence and deterministic localization/routing.

The contract is deliberately independent of GPS, BLE, Wi-Fi, visual positioning, sensor fusion, graph mutation, and route calculation.

## Boundary

```text
LocationObservation[]
        ↓
Temporal Localization Gate
        ↓
FRESH | STALE | CONFLICTING | UNRESOLVED
        ↓
Graph Validation
        ↓
Usable Node Identity
        ↓
Routing
```

## Temporal policy

The default policy is explicit and injectable:

- maximum age: **5 seconds**;
- future skew: **0 ms**;
- `now` is supplied by the caller/test rather than read implicitly by the resolver.

A deployment may choose another policy, but the policy must remain explicit and testable.

## State semantics

### FRESH

At least one observation is current, temporally valid, has a node identity, and does not conflict with another current observation on mall, floor, or node identity.

When multiple unambiguous fresh observations exist, the newest capture timestamp wins. Confidence is only a tie-breaker; it cannot make stale evidence current.

### STALE

No observation is current, and the available observations are temporally valid but older than the configured maximum age.

Stale confidence is never converted into current confidence merely because the value is high.

### CONFLICTING

Two or more fresh observations disagree on mall identity, known floor identity, or node identity.

Recency and confidence do not silently resolve a current contradiction. The boundary fails closed.

### UNRESOLVED

No trustworthy current node identity can be produced. This includes no observations, missing node identity, invalid/future-dated timestamps, or invalid evidence mixed with otherwise fresh evidence.

## Adversarial invariants

1. Fresh evidence is eligible only within the explicit age policy.
2. Stale evidence cannot silently become fresh.
3. A stale `0.99` observation cannot override a fresh `0.55` observation.
4. Future-dated evidence is invalid and cannot become fresh.
5. Fresh mall conflicts fail closed.
6. Fresh floor conflicts fail closed.
7. Fresh node conflicts fail closed.
8. Graph validity does not change temporal classification.
9. Persisted observation data is read-only; temporal assessment does not rewrite timestamps or confidence.
10. Temporal assessment has no `RouteResult.verified` field and cannot establish route verification.

## Separation of concerns

This seam does **not** decide whether a node exists, is active, is verified, or is routable. Those questions remain in graph validation and routing.

It also does not define sensor fusion. A provider may produce observations, but the temporal gate remains deterministic over the observations it receives.

## Failure law

```text
invalid / future evidence → UNRESOLVED
no fresh evidence → STALE
fresh contradiction → CONFLICTING
fresh + unambiguous node → FRESH
```

No temporal state may mutate the mall graph, route topology, route distance, or `RouteResult.verified`.
