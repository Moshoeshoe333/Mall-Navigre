# R5 — Accessibility Consistency

## Purpose

R5 is the accessibility-integrity gate after R4 destination reachability. It answers one narrow question:

> Do the graph's declared accessibility properties agree internally, and does accessible-only routing honor those declarations?

R5 is a **semantic consistency invariant**, not a physical accessibility certification. `accessible: true` means only that the graph declares the entity usable under the application's accessibility policy. It does not certify legal compliance, dimensions, gradients, obstruction-free travel, or real-world suitability.

## Accessibility model

- `MallNode.accessible` declares whether the node itself is usable under the graph's accessibility policy.
- `MallEdge.accessible` declares whether traversal across that edge is usable under the same policy.
- `accessible: false` is a valid declaration. For example, a staircase may be structurally valid while being excluded from accessible routing.
- An inaccessible edge does **not** make either endpoint node inaccessible. An accessible corridor may legitimately connect to an inaccessible staircase.
- An accessible edge cannot connect to an inaccessible endpoint: such an edge would claim an accessible traversal into or out of a node that the graph itself declares inaccessible.
- Inactive and unverified edges do not make an accessibility claim for current routing and are excluded from R5 active-edge consistency checks.
- Inactive nodes are excluded from active-edge consistency checks; operational availability is not accessibility policy.

## Formal contract

For every active edge `e` whose endpoints are active nodes:

`e.accessible = true` implies both `from.accessible = true` and `to.accessible = true`.

The converse is deliberately **not** required:

`from.accessible = true` and `to.accessible = true` does not imply `e.accessible = true`.

This preserves legitimate barriers or infrastructure that is structurally connected but not accessible.

## Accessible-only routing contract

When `findRoute(..., accessibleOnly = true)` is requested:

- only active nodes may participate;
- every participating node must have `accessible === true`;
- every participating edge must have `accessible === true`;
- edge direction remains governed by the existing routing contract;
- no route may be returned through an inaccessible node or inaccessible edge.

Normal routing (`accessibleOnly = false`) remains unchanged: it may use structurally valid inaccessible nodes and edges.

## Failure semantics

R5 emits deterministic errors for accessibility declaration contradictions:

- `ACCESSIBLE_EDGE_INACCESSIBLE_FROM_NODE` — an active accessible edge starts at an active inaccessible node;
- `ACCESSIBLE_EDGE_INACCESSIBLE_TO_NODE` — an active accessible edge terminates at an active inaccessible node;
- `ACCESSIBLE_EDGE_ENDPOINT_MISSING` — an active accessible edge references a missing endpoint and therefore cannot substantiate an accessibility claim.

Only active edges with active endpoints are evaluated as current accessibility claims. Missing endpoints are still an integrity failure because an accessible edge cannot be trusted without resolving both endpoint declarations.

## Adversarial test matrix

| Case | Expected R5 result | Reason |
|---|---|---|
| Accessible edge between two accessible nodes | PASS | Declaration is internally coherent |
| Accessible edge from inaccessible node | FAIL | Edge claims accessible departure from inaccessible node |
| Accessible edge to inaccessible node | FAIL | Edge claims accessible arrival at inaccessible node |
| Inaccessible edge between accessible nodes | PASS | A barrier can exist between accessible nodes |
| Inaccessible staircase between accessible transition nodes | PASS | Structural validity and accessibility policy remain separate |
| Inactive edge with contradictory accessibility flag | PASS for R5 active-edge check | It makes no current accessibility claim |
| Unverified edge with contradictory accessibility flag | PASS for R5 active-edge check | It is not trusted for current routing |
| Accessible-only route through inaccessible edge | NO ROUTE | Existing edge filter must exclude it |
| Accessible-only route through inaccessible node | NO ROUTE | Node declaration must also be enforced |
| Normal route through inaccessible infrastructure | ROUTE MAY EXIST | Normal routing is not accessibility-restricted |
| Missing endpoint on accessible edge | FAIL | Accessibility claim cannot be resolved |

## Separation from earlier invariants

- **R1** proves vertical transition endpoints have structural pedestrian connections.
- **R2** proves cross-floor movement semantics.
- **R3** proves active topology is globally connected under weak connectivity.
- **R4** proves active destinations are directionally reachable from at least one active ingress.
- **R5** verifies accessibility declarations and ensures accessible-only routing honors them.
- **R6** will own failure/failover behavior when infrastructure becomes unavailable.

R5 does not establish physical accessibility, destination accessibility coverage, shortest accessible routes, sensor confidence, UI claims, or live venue conditions.

## Evidence rule

A green pull-request workflow proves the R5 branch at its exact PR-head SHA. It does not prove a later squash-merge SHA until GitHub Actions executes against that exact SHA. Historical green runs must never be inherited across SHA boundaries.
