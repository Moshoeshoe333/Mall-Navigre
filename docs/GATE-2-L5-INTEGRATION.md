# Gate 2 — L5 Integration Harness

## Purpose

Establish the smallest integration boundary that composes the existing Parking Passport state, routing authorization, routing engine, and R6 operational validation without replacing any contract.

The intended decision chain is:

`ParkingSession → freshness/state → authorization → findRoute → RouteOperationalState → RouteResult.verified`

The harness is sequential and stateful by design. One persisted session is carried through controlled mutations to authorization state, graph availability, and routing policy. Each transition must be evaluated against current truth.

## Invariants under test

1. Missing, stale, unsupported, or low-confidence parking state fails closed at authorization.
2. Authorization does not imply route existence.
3. Route existence does not imply route verification.
4. An unavailable node or edge cannot remain claimable through a historical route.
5. Fresh routing recomputes against the current graph.
6. Failover may select an alternate active path.
7. If no active path remains, routing returns `null`.
8. Accessible-only routing cannot use inaccessible nodes or edges.
9. `RouteResult.verified` remains a routing/graph property, independent of parking authorization.
10. A persisted parking session remains the same domain datum while the surrounding operational state changes.

## 14-point adversarial matrix

| # | State transition | Required outcome |
|---|---|---|
| 1 | Valid persisted session → authorize → route | Authorized, route exists, active route is operationally valid |
| 2 | Missing session | Authorization denies |
| 3 | Corrupted/invalid confidence session | Authorization denies |
| 4 | Stale session | Authorization denies |
| 5 | Unsupported visual source | Authorization denies |
| 6 | Authorized session + unreachable destination | `findRoute()` returns `null` |
| 7 | Authorized session + unavailable route edge | Historical route is invalidated |
| 8 | Primary path fails + alternate path active | Fresh route selects alternate path |
| 9 | All viable paths fail | Fresh route returns `null` |
| 10 | Accessible-only + inaccessible route infrastructure | Inaccessible path cannot leak through |
| 11 | Route exists but contains unverified graph data | `RouteResult.verified === false` |
| 12 | Active route on active graph | `RouteResult.verified === true` |
| 13 | Same persisted session after operational mutation | Session datum is not silently rewritten |
| 14 | Historical route after graph mutation | Historical route cannot override current graph truth |

## Harness boundary

The test harness owns orchestration only. It must not duplicate policy already owned by:

- `getParkingState()`
- `authorizeParkingRouting()`
- `findRoute()`
- `validateRouteOperationalState()`

No UI changes, persistence implementation changes, localization changes, or new routing semantics are authorized by this gate.

## Evidence rule

A passing local or branch test establishes behavior only for that exact code state. Gate 2 promotion requires CI evidence against the exact PR head. A later squash-merge SHA is a new evidence boundary and must be checked independently.
