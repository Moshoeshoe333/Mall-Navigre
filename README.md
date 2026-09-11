# Mall Navigre

**Indoor navigation and parking intelligence platform.**

> **Know where you are. Know where you're going. Never lose your car again.**

---

## 33×3 Sieve

NAVIGRE is governed by the **33×3 Sieve**: 33 architectural perspectives, each examined through three verification degrees — **Existence, Coherence, Failure**.

The sieve is an audit lens, not a list of 99 features. No claim may exceed its supporting evidence.

## Current project state — 2026-09-11

**Current repository HEAD:** `9af8249e499b3545d9f1b948e1797545ed2c7847`

**Current automated evidence:** CI and the Parking Truth browser workflow both pass against the exact current head.

**Overall:** Core 0.1 foundation is established. Core 0.2 truth-hardening is active. Gate 2 authorization is implemented and executed at L4. Gate 2 L5 remains deliberately unclaimed pending a dedicated decision-chain integration test.

| Area | State | Evidence ceiling |
|---|---|---:|
| Core 0.1 Parking Truth | 🟢 | L4 current browser execution |
| Local-first persistence | 🟢 | L4 current browser truth workflow |
| Deterministic A* routing | 🟢 | L4 current browser truth workflow |
| Graph integrity | 🟡 | L2; strict taxonomy reconciliation pending |
| Gate 2 confidence contract | 🟡 | L1 candidate governance decision |
| Gate 2 calculator | 🟡 | L2 experimental / L4 tests |
| Gate 2 regression | 🟢 | L4 — current CI: 10 files / 88 tests |
| Gate 2 authorization | 🟢 | L4 — current CI + browser path |
| Gate 2 L5 integration | 🟡 | Not claimed; decision-chain test pending |
| Real Mall of Africa geometry | 🟡 | L1 schematic/unverified |
| Localization / sensors | 🟡 | L2 interfaces only |
| Accessibility verification | 🟡 | Partial |
| Multi-mall | 🟡 | Partial architecture, runtime proof pending |
| Gate 3 concurrency | 🔒 frozen | L1 |

See [`docs/MASTER-EVIDENCE-LEDGER.md`](docs/MASTER-EVIDENCE-LEDGER.md) for the detailed evidence record.

### Evidence levels

- **L0** — Undefined
- **L1** — Defined
- **L2** — Implemented
- **L3** — Tested (test artifact exists)
- **L4** — Executed (tests physically ran and passed)
- **L5** — Integrated (adjacent systems verified together)
- **L6** — Operational (real-world/release evidence)

**Tests existing ≠ tests passed. Workflow configuration ≠ execution. Commits ≠ runtime proof.**

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

### Current execution evidence

On current head `9af8249e499b3545d9f1b948e1797545ed2c7847`:

- `npm ci` — PASS
- `npm run typecheck` — PASS
- `npm test` — PASS: **10 files / 88 tests**
- Parking Truth production build — PASS
- Next.js start/wait — PASS
- Browser Truth Test — PASS

The previous Core 0.1 evidence at `8a956e...` remains historical and is not silently transferred to later code.

---

## Core 0.2 — Hardened Truth Boundaries

### Gate 1 — Graph integrity

Graph foundation and deterministic routing are implemented. A reconciliation pass remains necessary because later strict graph-contract identifiers are not established as current production code. **Do not mutate the validator speculatively.**

### Gate 2 — Confidence formalization

The repository separates **stored observation confidence** from **freshness**. The experimental 24-hour half-life calculator is not production routing authority.

The current policy-owned authorization boundary evaluates:

- missing session → reject;
- invalid confidence → reject;
- `visual` source → fail closed;
- GPS alone → reject as independent authority;
- confidence `< 0.50` → reject / request confirmation;
- stale, invalid, or future temporal evidence → reject;
- otherwise → eligible.

The boundary does not mutate the persisted `ParkingSession` and does not conflate authorization with `RouteResult.verified`.

### Current Gate 2 regression evidence

The current head CI run passed:

- 10 test files;
- 88 tests;
- 30 calculator tests;
- 9 confidence-regression tests;
- 13 freshness/state tests;
- 13 routing-authorization tests.

The dedicated regression suite covers stored-confidence preservation, exact `0.50` eligibility, low-confidence rejection, seven-day staleness, GPS/visual fail-closed behavior, invalid/future timestamps, and separation of experimental decay from production authorization.

### Production path

The current production flow is:

`stored ParkingSession → policy authorization → deterministic A* route → RouteResult.verified → UI`

This is executed successfully within the current CI/browser scope. It is **not yet promoted to L5** because the project ledger requires a dedicated adjacent-system decision-chain artifact before making that claim.

### Gate 3 — Concurrency

**FROZEN.** No multi-tab concurrency implementation until Gates 1 and 2 are resolved.

---

## Next controlled sequence

1. Add the smallest decision-chain integration test:
   `ParkingSession → freshness/state → authorization → findRoute → RouteResult.verified`.
2. Explicitly assert that authorization and route verification remain independent.
3. Execute the new test on CI at a new exact head.
4. Reassess Gate 2 L5 using the evidence ledger — without promoting beyond what the artifact proves.
5. Reconcile and harden Gate 1.
6. Validate physical Mall of Africa truth before claiming operational indoor navigation.

**Do not:**

- wire the experimental calculator into production prematurely;
- replace stored confidence semantics by inference;
- claim L5 from L4 execution alone;
- claim survey-grade or exact-bay positioning;
- unfreeze Gate 3.

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

The audited package manifest uses exact dependency versions rather than loose `^` or `latest` ranges. Dependency pinning is therefore currently a **strength to preserve**, not an active defect.

CI currently reports an eslint support warning and runner/action Node.js deprecation warnings. These are maintenance signals, not correctness failures, and should be handled separately from Gate 2.

## License

Proprietary (Mall Navigre)

---

**Governance:** All decisions are evaluated against the 33×3 Sieve and the 7-Level Evidence Ledger before promotion.
