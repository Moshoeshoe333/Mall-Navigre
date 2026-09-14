# R3 — Global Graph Reachability

## Purpose

R3 is the topology gate between semantic graph validation and routing. It answers one narrow question:

> Do all active navigable nodes belong to one connected graph topology, or has the configuration created an orphaned active subgraph?

R3 is deliberately narrower than routing. It validates graph topology without deciding whether every node is reachable in the direction of travel, whether a route is accessible, or whether a temporarily unavailable transition should be used.

## Formal contract

Given an active-node set `V` and active-edge set `E`, construct an undirected projection `Gᵤ = (V, Eᵤ)` where every active edge `{fromNodeId, toNodeId}` contributes connectivity in both directions regardless of `bidirectional`.

R3 passes iff `Gᵤ` contains at most one connected component containing active nodes.

Equivalently, for every pair of active nodes `u, v`, there is an undirected path between them when only active edges whose endpoints are active are considered.

This is a **weak-connectivity** invariant by design.

## Why direction is excluded

A one-way escalator can be physically connected to both endpoint networks while still allowing travel in only one declared direction. Treating that as a disconnected graph would make R3 duplicate routing semantics and incorrectly reject valid topology.

Directional reachability belongs to routing and the later destination-reachability invariant (R4).

## Active-state rule

Only nodes with `status: "active"` participate in R3.

Only edges with `status: "active"` participate, and an active edge contributes connectivity only when both endpoint node IDs resolve to active nodes.

Temporary unavailability is therefore not silently converted into active topology.

## Failure semantics

R3 emits `ORPHANED_ACTIVE_COMPONENT` errors when more than one active connected component exists. Each disconnected component is represented by one deterministic traversal representative (`component[0]`) in the report.

A valid dead end is **not** an R3 failure. A corridor can terminate without forming an orphaned island; dead-end suitability is a routing/destination concern.

## Adversarial test matrix

| Case | Expected R3 result | Reason |
|---|---|---|
| Connected multi-floor graph | PASS | Vertical edge joins level networks |
| Isolated active node | FAIL | Creates an orphaned component |
| Disconnected multi-node island | FAIL | Orphan is a subgraph, not merely a single node |
| One-way active transition | PASS | R3 uses weak connectivity; routing owns direction |
| Vertical edge temporarily unavailable | FAIL if it is the only inter-component bridge | R3 does not resurrect unavailable topology |
| Inactive node/edge | IGNORE | Not part of the active graph |
| Connected dead end | PASS | Dead ends are not automatically topology errors |

## Non-goals

R3 does not establish:

- directional source-to-destination reachability;
- accessibility-policy correctness;
- route optimality;
- live sensor confidence;
- destination completeness;
- UI behavior;
- cloud synchronization;
- physical survey accuracy.

Those concerns remain separate invariants or system layers.

## Evidence rule

A green pull-request workflow proves the R3 branch at its exact PR head SHA. It does **not** prove a later squash-merge SHA until GitHub Actions executes against that exact SHA. Historical green runs must never be inherited across SHA boundaries.
