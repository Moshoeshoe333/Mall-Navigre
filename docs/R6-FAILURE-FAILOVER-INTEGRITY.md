# R6 — Failure / Failover Integrity

## Purpose

R6 is the operational-failure gate after R5 accessibility consistency. It answers one narrow question:

> When declared infrastructure becomes unavailable, does Navigre stop claiming the failed route and recover through a valid alternative when one exists?

R6 is about **route truth under failure**, not prediction, monitoring, sensor detection, or automatic infrastructure repair.

## Contract

Given a start and destination:

1. Active infrastructure may be used for routing.
2. Temporarily unavailable nodes and edges must not participate in a returned route.
3. If a valid alternative route exists after a failure, a fresh route may be returned through that alternative.
4. If no valid route remains, routing must return `null` rather than return a stale or partially invalid route.
5. A route returned after failure must contain only currently active nodes and edges.
6. Normal routing and accessible-only routing retain their existing semantics; R6 does not redefine accessibility.
7. Recovery is recomputation against current graph state, not historical route reuse.

## Failure model

The graph remains the canonical topology. Operational state can temporarily remove nodes or edges from routing without declaring the physical mall topology permanently invalid.

This preserves the separation:

- R3 — canonical active topology integrity;
- R4 — current directional destination reachability;
- R5 — accessibility declaration consistency;
- R6 — behavior when operational availability changes.

A temporarily unavailable bridge may therefore make a destination unreachable at runtime without meaning the underlying mall graph is structurally wrong.

## Failover law

For a route `R` computed against graph state `G`, if an element of `R` becomes unavailable, `R` is no longer claimable against the new state `G'`.

The system must recompute against `G'`:

`route(G') = alternate route | null`

It must never silently continue presenting `route(G)` as current truth.

## Adversarial test matrix

| Case | Expected result | Reason |
|---|---|---|
| Primary edge fails, alternate path exists | Alternate route | Recovery through valid active infrastructure |
| Primary vertical transition fails, secondary transition exists | Secondary route | Failover preserves destination reachability |
| All viable transitions fail | `null` | No truthful route remains |
| Failed edge is on the previous route | Previous route not reused | Stale route is forbidden |
| Failed node is on the previous route | `null` or alternate route | Failed node cannot participate |
| Failed infrastructure leaves destination reachable | Route remains directional and active | Failure is operational, not semantic |
| Failed infrastructure disconnects destination | `null` | Do not manufacture reachability |
| Accessible-only route loses accessible edge | Alternate accessible route or `null` | R5 accessibility semantics remain enforced |
| Normal route loses inaccessible edge | Alternate normal route or `null` | R6 does not change normal routing policy |

## Non-goals

R6 does not implement:

- BLE/GPS/Wi-Fi failure detection;
- live sensor monitoring;
- automatic graph editing;
- predictive maintenance;
- UI notifications;
- physical infrastructure repair;
- traffic/crowd optimization;
- accessibility certification;
- route caching across incompatible graph states.

## Evidence rule

A green pull-request workflow proves the exact PR-head SHA only. A later squash-merge SHA is a new evidence boundary and must be checked independently. No historical workflow result may be inherited across SHA boundaries.
