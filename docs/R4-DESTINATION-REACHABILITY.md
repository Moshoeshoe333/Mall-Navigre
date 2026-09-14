# R4 — Destination Reachability

## Purpose

R4 is the directional destination gate after R3 topology validation. It answers one narrow question:

> Can every configured active destination be reached from at least one active ingress using the graph's declared travel directions?

R4 deliberately moves from R3's weak connectivity to **directional travel reachability**. It does not require every node to reach every other node, and it does not judge route optimality, accessibility policy, live availability, sensor confidence, or physical survey accuracy.

## Destination and ingress model

- A **destination** is an active `Place` whose referenced `nodeId` resolves to an active graph node.
- An **ingress** is an active graph node whose type is `entrance` or `parking`.
- A destination may be reachable from any one active ingress; all destinations do not need to be reachable from every ingress.
- If a destination references a missing or inactive node, that is a destination-integrity failure rather than a routing failure.
- A graph with no active destinations has no R4 destination claims to verify and therefore passes this invariant.
- A graph with active destinations but no active ingress fails because there is no declared navigable origin from which destination reachability can be established.

## Formal contract

Let `I` be the set of active ingress nodes. Let `D` be the set of active places resolved to active nodes. Construct a directed active graph from active edges:

- a bidirectional edge contributes `from → to` and `to → from`;
- a one-way edge contributes only `from → to`;
- inactive or unverified edges do not contribute travel reachability;
- edges whose endpoints are not active nodes do not contribute travel reachability.

R4 passes iff every destination node in `D` is reachable from at least one node in `I` in this directed graph.

## Why R4 is separate from R3

R3 intentionally ignores direction and proves only that active topology is not split into disconnected islands. A one-way transition can therefore pass R3 while still making a destination unreachable from the declared ingress direction. R4 catches that failure without weakening R3's topology definition.

## Availability boundary

R4 uses the graph's active state because a route cannot be claimed through an inactive or unverified edge. This is a **current operational reachability assertion**, not a statement that the canonical physical topology is permanently invalid. Canonical topology remains governed by R3; recovery/failover policy belongs to R6.

## Failure semantics

R4 emits deterministic errors for:

- `DESTINATION_NODE_MISSING` — an active place points to no node;
- `DESTINATION_NODE_INACTIVE` — an active place points to a non-active node;
- `NO_ACTIVE_INGRESS` — active destinations exist but no active entrance/parking node exists;
- `UNREACHABLE_DESTINATION` — an active destination node cannot be reached from any active ingress under declared edge direction.

One issue is emitted per affected destination where a destination-specific failure exists. Missing/inactive node failures do not require a traversal attempt.

## Adversarial test matrix

| Case | Expected R4 result | Reason |
|---|---|---|
| Connected ingress → destination | PASS | Directional path exists |
| Multiple ingresses, destination reachable from one | PASS | Any valid ingress is sufficient |
| One-way edge points toward destination | PASS | Declared travel direction supports the route |
| One-way edge points away from destination | FAIL | R3 can pass while directional destination reachability fails |
| Active destination points to missing node | FAIL | Destination reference is invalid |
| Active destination points to inactive node | FAIL | No current route can terminate at it |
| Active destination with no active ingress | FAIL | No declared origin exists |
| Inactive/unverified edges omitted | FAIL when they are the only path | R4 cannot claim unavailable/unverified travel |
| No active destinations | PASS | There is no destination claim to verify |
| Destination reachable through inaccessible edge | PASS for R4 | Accessibility policy is R5, not R4 |
| Valid dead-end destination | PASS | A destination can legitimately terminate a route |

## Non-goals

R4 does not establish:

- global weak connectivity (R3);
- accessibility-policy correctness (R5);
- failover quality across outages (R6);
- shortest or fastest route;
- live localization confidence;
- UI behavior;
- cloud synchronization;
- physical survey accuracy;
- whether every graph node is a user-facing destination.

## Evidence rule

A green pull-request workflow proves the R4 branch at its exact PR head SHA. It does not prove a later squash-merge SHA until GitHub Actions executes against that exact SHA. Historical green runs must never be inherited across SHA boundaries.
