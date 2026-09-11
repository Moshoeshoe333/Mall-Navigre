# Mall Navigre

**Indoor navigation and parking intelligence platform.**

> **Know where you are. Know where you're going. Never lose your car again.**

---

## 33×3 Sieve

NAVIGRE is governed by the **33×3 Sieve**: 33 architectural perspectives, each examined through three verification degrees — **Existence, Coherence, Failure**.

The sieve is an audit lens, not a list of 99 features. No claim may exceed its supporting evidence.

## Current project state — 2026-09-11

**Current repository HEAD:** `ddce04f48ddb0531855c5486def04268fa3a6c4c`

**Code-under-test commit:** `4a1c0e72e83fe8a823f39145550540397f6ab74e`

**Overall:** Core 0.1 foundation established. Core 0.2 truth-hardening is active. Pass 7 has now executed successfully at L4 on the code-under-test commit. Gate 2 remains deliberately unintegrated until the candidate contract is accepted and the smallest policy-owned authorization boundary is implemented.

| Area | State | Evidence ceiling |
|---|---|---:|
| Core 0.1 Parking Truth | 🟢 | L4 current browser execution; L5 Gate 2 not claimed |
| Local-first persistence | 🟢 | L4 current browser truth workflow |
| Deterministic A* routing | 🟢 | L4 current browser truth workflow |
| Graph integrity | 🟡 | L2; strict taxonomy reconciliation pending |
| Gate 2 confidence contract | 🟡 | L1 candidate |
| Gate 2 calculator | 🟡 | L2 experimental / L4 tests |
| Gate 2 Policy C regression | 🟢 | L4 — 13 tests passed |
| Gate 2 production integration | 🔴 blocked | Not established |
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

On code-under-test commit `4a1c0e72e83fe8a823f39145550540397f6ab74e`:

- `npm ci` — PASS
- `npm run typecheck` — PASS
- `npm test` — PASS: **8 files / 66 tests**
- Parking Truth production build — PASS
- Next.js start/wait — PASS
- Browser Truth Test — PASS

The previous Core 0.1 evidence at `8a956e...` remains historical and is not silently transferred to later code.

---

## Core 0.2 — Hardened Truth Boundaries

### Gate 1 — Graph integrity

Graph foundation and deterministic routing are implemented. A reconciliation pass remains necessary because later strict graph-contract identifiers are not established as current production code. **Do not mutate the validator speculatively.**

### Gate 2 — Confidence formalization

Gate 2 Contract v2 is a **candidate** decision, not yet production authority. The candidate model is:

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

### Pass 7 — Regression execution

Pass 7 added a dedicated parking freshness/compatibility regression suite and hardened the existing freshness boundary so that:

- exactly seven days is stale;
- future observation timestamps are non-authorizing;
- invalid temporal data fails closed;
- `updatedAt` takes precedence;
- stored confidence is not mutated by freshness evaluation.

The exact code-under-test commit passed the full CI unit/typecheck workflow and the existing browser Parking Truth workflow. This is **L4 evidence**, not L5 Gate 2 integration.

**Gate 2 production integration remains blocked.** `page.tsx` has not been replaced with the experimental calculator path.

### Gate 3 — Concurrency

**FROZEN.** No multi-tab concurrency implementation until Gates 1 and 2 are resolved.

---

## Next controlled sequence

1. Explicitly accept, reject, or amend Gate 2 Contract v2.
2. Preserve the L4 Pass 7 evidence.
3. Implement the smallest policy-owned routing authorization boundary required by the accepted contract.
4. Add decision-chain tests around confidence + freshness + graph/route constraints.
5. Integrate only after those tests pass.
6. Re-run offline Save → Reload → Find at browser level.
7. Record L5 integration evidence.
8. Reconcile and harden Gate 1.
9. Validate physical Mall of Africa truth before claiming operational indoor navigation.

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

## License

Proprietary (Mall Navigre)

---

**Governance:** All decisions are evaluated against the 33×3 Sieve and the 7-Level Evidence Ledger before promotion.
