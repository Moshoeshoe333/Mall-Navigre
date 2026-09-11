# Mall Navigre

**Indoor navigation and parking intelligence platform.**

> **Know where you are. Know where you're going. Never lose your car again.**

---

## 33×3 Sieve

NAVIGRE is governed by the **33×3 Sieve**: 33 architectural perspectives, each examined through three verification degrees — **Existence, Coherence, Failure**.

The sieve is an audit lens, not a list of 99 features. No claim may exceed its supporting evidence.

## Current project state — 2026-09-11

**Repository HEAD:** `232ea9cb633c5b52634d89392fc17872cee044cc`

**Overall:** Core 0.1 foundation established; Core 0.2 truth-hardening is active. Current-head execution evidence is being reconstructed deliberately rather than inherited from older commits.

| Area | State | Evidence ceiling |
|---|---|---:|
| Core 0.1 Parking Truth architecture | 🟢 | L2/L3 current; historical L4/L5 at `8a956e...` |
| Local-first persistence | 🟢 | L2 |
| Deterministic A* routing | 🟢 | L2 |
| Graph integrity | 🟡 | L2; strict taxonomy reconciliation pending |
| Gate 2 confidence | 🟡 | L1 contract candidate / L2 calculator / L3 tests |
| Gate 2 production integration | 🔴 blocked | Not established |
| Real Mall of Africa geometry | 🟡 | L1 schematic/unverified |
| Localization / sensors | 🟡 | L2 interfaces only |
| Accessibility verification | 🟡 | Partial; execution evidence pending |
| Multi-mall | 🟡 | Partial architecture, runtime proof pending |
| Gate 3 concurrency | 🔒 frozen | L1 |

See [`docs/MASTER-EVIDENCE-LEDGER.md`](docs/MASTER-EVIDENCE-LEDGER.md) for the current ledger.

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

### Historical verification boundary

The original Core 0.1 baseline was verified at commit `8a956e7510ab2730fdba9d131e3959fb9a679ad0`, including the documented Parking Truth E2E evidence. Those results are historical evidence and are **not automatically evidence for later commits**.

Current HEAD must earn its own L4/L5 status through execution.

---

## Core 0.2 — Hardened Truth Boundaries

### Gate 1 — Graph integrity

Graph foundation and deterministic routing are implemented. A reconciliation pass remains necessary because later strict graph-contract identifiers are not established as current production code. **Do not mutate the validator speculatively.**

### Gate 2 — Confidence formalization

Gate 2 Contract v2 is a **candidate** decision, not yet production authority. It adopts:

- **Policy C:** stored observation confidence + independent freshness;
- persisted confidence is not silently decayed by elapsed time;
- manual confidence remains unchanged at 24h and 48h;
- freshness uses `updatedAt ?? capturedAt`;
- `< 7 days` is not stale when temporal evidence is valid;
- `>= 7 days` requires visible landmark confirmation;
- invalid temporal evidence fails closed;
- GPS alone cannot satisfy the `0.50` confidence boundary under the declared policy;
- `visual` remains fail closed until explicitly authorized;
- `RouteResult.verified` remains independent;
- the experimental 24-hour half-life calculator is not production routing authority.

**Gate 2 production integration is not authorized yet.** `page.tsx` remains untouched until the contract is accepted and the regression suite has executed successfully.

### Gate 3 — Concurrency

**FROZEN.** No multi-tab concurrency implementation until Gates 1 and 2 are resolved.

---

## Next controlled sequence

1. Accept, reject, or amend Gate 2 Contract v2.
2. Complete Pass 7 Contract v2 regression tests.
3. Execute the exact commit locally/through CI and record L4 evidence.
4. Introduce the smallest policy-owned routing authorization boundary.
5. Integrate only after policy tests pass.
6. Re-run offline Save → Reload → Find at browser level.
7. Record L5 integration evidence.
8. Reconcile and harden Gate 1.
9. Validate physical Mall of Africa truth before claiming operational indoor navigation.

**Do not:**

- wire the experimental calculator into production prematurely;
- replace stored confidence semantics by inference;
- claim current CI green without a current run;
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

## License

Proprietary (Mall Navigre)

---

**Governance:** All decisions are evaluated against the 33×3 Sieve and the 7-Level Evidence Ledger before promotion.
