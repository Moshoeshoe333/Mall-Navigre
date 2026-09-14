# Spatial Seam 4 — Routing Start Authorization

## Purpose

Establish the smallest truthful boundary between a current localization identity claim and the routing engine.

The seam is:

`LocalizationResult → routing-start authorization → findRoute()`

A localization claim is not automatically a routing start. The claim must be fresh, identify a node, and remain valid against the current mall graph.

## Contract

`authorizeRoutingStart(localization, graph)` returns either:

- `{ allowed: true, nodeId }`
- `{ allowed: false, reason }`

The authorization result deliberately contains no route and no `verified` field.

## Invariants

1. Only `fresh` localization may authorize a routing start.
2. `stale`, `conflicting`, and `unresolved` localization fail closed.
3. Missing node identity fails closed.
4. Mall and level identity must agree with the current graph.
5. The node must exist in the current graph.
6. Temporarily unavailable nodes cannot authorize a start.
7. Unverified nodes cannot authorize a start.
8. Localization confidence does not create route verification.
9. Start authorization does not imply a route exists.
10. Authorization is read-only.
11. Authorization is evaluated against the current graph and must be repeated for a new routing attempt after graph state changes.
12. Parking-destination authorization remains a separate boundary from current-start authorization.

## Failure codes

- `ROUTING_START_NOT_FRESH`
- `ROUTING_START_NODE_MISSING`
- `ROUTING_START_GRAPH_MISMATCH`
- `ROUTING_START_NODE_UNAVAILABLE`
- `ROUTING_START_NODE_UNVERIFIED`

## Explicit non-goals

- GPS/BLE/Wi-Fi sensor integration
- sensor fusion
- route selection
- route verification
- graph mutation
- localization confidence calibration
- accessibility certification
- route caching
- UI changes

## Adversarial coverage

The contract tests cover:

- valid fresh start
- all non-fresh temporal states
- missing node identity
- mall mismatch
- level mismatch
- missing graph node
- unavailable node
- unverified node
- immutability
- graph mutation after an initially valid authorization
- authorization without route existence
- confidence independence
- absence of route verification in the authorization result

## Decision-chain boundary

```text
LocationObservation[]
        ↓
Temporal localization
        ↓
LocalizationResult
        ↓
Graph validation
        ↓
Routing-start authorization
        ↓
findRoute()
        ↓
RouteOperationalState
        ↓
RouteResult
```

The seam preserves the existing separation between localization truth, routing existence, and route verification.
