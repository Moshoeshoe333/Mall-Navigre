# Mall Navigre

**Indoor navigation and parking intelligence platform.**

> **Know where you are. Know where you're going. Never lose your car again.**

---

## 33×3 Sieve

NAVIGRE is governed by the **33×3 Sieve**: 33 architectural perspectives, each examined through three verification degrees — **Existence, Coherence, Failure**.

The sieve is an audit lens, not a list of 99 features. No claim may exceed its supporting evidence.

## Current project state — 2026-09-14

**Current `main` merge boundary:** `e94e3583ba46c7358fcd018ee5a2c877ea2cab0a`

**Gate 2 L5 PR head:** `c611672bc82fee2cbbf3e9dc8e27c51bac49c11c`

PR #10 established the smallest adjacent-system decision-chain harness:

`ParkingSession → freshness/state → authorization → findRoute → RouteOperationalState → RouteResult.verified`

The exact PR head passed Navigre CI and Parking Truth. PR #10 was then squash-merged into `main` at `e94e358...`. At the 2026-09-14 audit point, the merge SHA had **0 PR-associated workflow runs and 0 commit statuses observed**. This is recorded as **EXECUTION EVIDENCE NOT OBSERVED**, not as a permanent failure. PR-head evidence is not silently transferred to the merge SHA.

| Area | State | Evidence ceiling |
|---|---|---:|
| Core 0.1 Parking Truth | 🟢 | L4 historical / boundary-aware |
| Local-first persistence | 🟢 | L4 historical |
| Deterministic A* routing | 🟢 | L4 historical + invariant PR-head evidence |
| R1–R6 graph invariants | 🟢 | PR-head verified; merge-boundary evidence separately tracked |
| Gate 2 authorization | 🟢 | L4 historical / bounded integration |
| Gate 2 L5 integration | 🟡 | PR-head verified; merge-boundary execution evidence not observed |
| Real Mall of Africa geometry | 🟡 | L1 schematic/unverified |
| Localization / sensors | 🟡 | L2 interfaces only |
| Accessibility verification | 🟡 | Partial |
| Multi-mall | 🟡 | Partial architecture, runtime proof pending |
| Gate 3 concurrency | 🔒 frozen | L1 |

See `docs/MASTER-EVIDENCE-LEDGER.md` for the detailed evidence record.

### Evidence levels

- **L0** — Undefined
- **L1** — Defined
- **L2** — Implemented
- **L3** — Tested (test artifact exists)
- **L4** — Executed (tests physically ran and passed)
- **L5** — Integrated (adjacent systems verified together)
- **L6** — Operational (real-world/release evidence)

**Tests existing ≠ tests passed. Workflow configuration ≠ execution. Commits ≠ runtime proof. PR-head execution ≠ merge-boundary execution.**

---

## Core 0.1 — Parking Truth

The first build intentionally proves a narrow vertical slice:

`SAVE MY CAR → STORE → CLOSE APP → REOPEN → FIND MY CAR`

Core principles:

- Local-first persistence keeps the last valid parking state available offline.
- Canonical mall infrastructure is separate from user-generated parking state.
- Localization is a replaceable service; navigation is not.
- Every spatial node carries explicit mall/level/parkade context.
- Confidence is explicit; below `0.5`, landmark confirmation is required.
- GPS does not become indoor precision by assertion.
- Unverified geometry is disclosed.
- Temporarily unavailable infrastructure is never routable.
- Correctness comes before optimization; measured performance earns complexity.

---

## Core 0.2 — Hardened Truth Boundaries

### R1–R6 graph invariants

The graph truth layer has been hardened across six controlled seams:

- **R1:** transition endpoint reachability
- **R2:** cross-floor semantic integrity
- **R3:** graph reachability
- **R4:** destination reachability
- **R5:** accessibility consistency
- **R6:** failure / failover integrity

These invariants are verified at their respective exact PR-head boundaries. They do **not** constitute physical certification of Mall of Africa, survey-grade geometry, or operational indoor positioning.

### Gate 2 L5 integration

The production decision boundary is deliberately explicit:

`stored ParkingSession → freshness/state → policy authorization → deterministic A* route → RouteOperationalState → RouteResult.verified → UI`

The Gate 2 integration harness carries one persisted session through controlled mutations to prove that authorization, route existence, operational validity, and route verification remain distinct truths.

Exact PR-head evidence:

- Navigre CI: run `34834367497`, job `103944710821` — **SUCCESS**
- Parking Truth Test: run `34834367456`, job `103944710055` — **SUCCESS**

Merge boundary:

- PR #10 — squash merged
- exact `main` SHA: `e94e3583ba46c7358fcd018ee5a2c877ea2cab0a`
- merge-boundary workflow runs observed at audit time: **0**
- merge-boundary commit statuses observed at audit time: **0**
- status: **EXECUTION EVIDENCE NOT OBSERVED**

No synthetic workflow trigger is used solely to create boundary evidence.

### Gate 3 — Concurrency

**FROZEN.** No multi-tab concurrency implementation until Gates 1 and 2 are resolved.

---

## Next controlled sequence

1. Complete this evidence reconciliation through the normal documentation PR path.
2. Recheck the exact merge boundary without transferring PR-head evidence.
3. Run the **33×3 Spatial Sieve Audit** across the **Graph Truth Core ↔ Localization Interface**.
4. Verify that sensor contracts remain decoupled from deterministic A* routing.
5. Only then consider crossing into localization implementation or further system complexity.

Do not wire experimental calculators into production prematurely, replace stored confidence semantics by inference, claim survey-grade or exact-bay positioning, or unfreeze Gate 3.

---

## Repository map

```text
Mall-Navigre/
├── ARCHITECTURE.md
├── 33x3-SIEVE.md
├── V1-SCOPE.md
├── docs/
│   ├── MASTER-EVIDENCE-LEDGER.md
│   └── CORE-0.2-GATE-2-CONFIDENCE-CONTRACT.md
├── src/
│   ├── app/                 # human experience
│   ├── domain/              # navigation, routing, parking, localization, integrity
│   ├── data/                # canonical mall configuration
│   └── storage/             # local-first persistence
└── tests/                   # truth tests and regression coverage
```

## V1 boundary

Included: typed domain models, runtime validation, graph integrity, deterministic A* routing, Parking Passport, IndexedDB persistence, offline-aware state, schematic 2D navigation, confidence handling, and E2E automation.

Deferred: BLE infrastructure, AR, AI Copilot, predictive routing, computer vision, live crowd intelligence, advertising, loyalty, social features, and a full CMS.

## Data truth

Mall geometry in the initial seed is deliberately **schematic/unverified** until properly digitized and validated. Public mall facts may inform configuration, but the application must not present uncertain data as precise.

## Using the 33×3 Sieve

For every feature or architectural change:

1. Map the change to at least 3 perspectives.
2. Test Existence, Coherence, and Failure.
3. Classify the result as **DEFECT → FIX**, **RISK → MITIGATE**, **STRENGTH → PRESERVE**, **TRADE-OFF → DOCUMENT**, or **SPECULATION → VERIFY**.
4. Record the highest justified evidence level.
5. Never promote a claim merely because a file, test, commit, or workflow exists.

## How to Run

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run dev
npm run start
npx playwright test
```

All gates must pass before merging to main.

## Dependencies

The audited package manifest uses exact dependency versions rather than loose `^` or `latest` ranges. Dependency pinning remains a strength to preserve.

CI eslint support warnings and runner/action Node.js deprecation warnings are maintenance signals, not correctness evidence, and should be handled separately from the truth-hardening gates.

## License

Proprietary (Mall Navigre)

---

**Governance:** All decisions are evaluated against the 33×3 Sieve and the 7-Level Evidence Ledger before promotion.
