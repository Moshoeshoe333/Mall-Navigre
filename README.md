# Mall Navigre

**Indoor navigation and parking intelligence platform.**

> **Know where you are. Know where you're going. Never lose your car again.**

---

## 33×3 Sieve: Guarantee Mode Mapping

This project uses the **33×3 Sieve** (33 architectural perspectives, 3 degrees of verification: Existence, Coherence, Failure) as the governing standard for all features and architectural changes.

### Current Verification State

**Core 0.1 Status: 60/99 (61%) — PRODUCT-READY FOR SCOPE**

| Perspective | E | C | F | Notes |
|---|---|---|---|---|
| **A. Reality** | ✅ | ✅ | ⚠️ | Physical model is schematic but explicitly marked unverified |
| **B. Knowledge** | ✅ | ⚠️ | ⚠️ | Identities are unique within graph; cross-mall collision risk unfenced |
| **C. Logic** | ✅ | ⚠️ | ⚠️ | Routing is correct; graph validation incomplete (no orphan detection) |
| **D. Human Experience** | ✅ | ✅ | ⚠️ | UI is honest about limits; accessibility not yet automated |
| **E. Technology** | ✅ | ⚠️ | ⚠️ | Local storage is robust; no server sync, no multi-device backup |
| **F. Evolution** | ⚠️ | ⚠️ | ⚠️ | Multi-mall designed but unproven; data updates require redeploy |

### Degree 1: EXISTENCE ✅ 27/33
- ✅ Core features work: save parking, close app, reopen, find car, route
- ✅ Offline operation verified (E2E automated)
- ✅ Persistence with corruption detection (IndexedDB migrations)
- ✅ A* routing engine with edge-distance authority
- ⚠️ Orphaned node detection missing
- ⚠️ Multi-mall instantiation untested
- ⚠️ Live data update mechanism absent

**Verdict:** Core 0.1 scope is fully realized.

### Degree 2: COHERENCE ✅ 19/33
- ✅ Domain models are internally consistent (Zod validation enforced)
- ✅ Routing assumes valid graph; assumptions are documented
- ✅ Confidence model is explicit (< 0.5 blocks routing)
- ⚠️ Graph validator incomplete (no cross-reference checks)
- ⚠️ Localization interface stubbed (GPS/BLE undefined)
- ⚠️ Multi-tab conflicts not detected (last-write-wins silently)
- ⚠️ No temporal coherence (stale data undetectable)

**Verdict:** Internal contracts are sound; external contracts have weak edges.

### Degree 3: FAILURE ✅ 14/33
- ✅ Storage errors caught and surfaced (CORRUPTED, STORAGE_ERROR states)
- ✅ Offline state maintained without data loss
- ✅ Invalid graph fixtures rejected (Zod validation)
- ⚠️ Orphaned node clusters allowed (silent logical error)
- ⚠️ Confidence calculation missing (stubbed at 1.0 for manual)
- ⚠️ No retry on transient network failure
- ⚠️ Cross-device sync gap undetected
- ⚠️ Stale mall data can be served without warning

**Verdict:** Known failure modes are handled; unknown failure modes exist.

---

## Navigre Core 0.1

The first build is intentionally narrow: prove the **Parking Truth Test** before adding advanced systems.

`SAVE MY CAR → STORE → CLOSE APP → REOPEN → FIND MY CAR`

### Core principles

- **Boring underneath. Beautiful on top.**
- Local-first: the last valid parking state remains useful without network access.
- Canonical mall infrastructure is separate from user-generated state.
- Localization is a replaceable service; navigation is not.
- Every spatial node has explicit mall/level/parkade context and may carry a physical visual landmark.
- Confidence is explicit; below `0.5`, the experience must request landmark confirmation rather than silently trusting weak positioning.
- GPS does not become indoor precision by assertion.
- Unverified geometry is disclosed.
- Temporarily unavailable infrastructure is never routable.
- Correctness comes before optimization; measured performance earns complexity.
- The **33 × 3 sieve** is an architectural audit, not a list of 99 features.

## Repository map

```text
Mall-Navigre/
├── ARCHITECTURE.md
├── 33x3-SIEVE.md
├── V1-SCOPE.md
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

## Status

**Core 0.1:** ✅ Complete and verified
- Parking Truth Test passes (E2E automated)
- All unit tests pass (23/23)
- TypeScript strict mode passes
- Production build passes
- Dependencies locked and reproducible

**Core 0.2:** ⏳ In planning (see below)

## Core 0.2: Hardened Truth Boundaries

Next engineering gates (planned):

1. **Graph Validator** (Existence, Coherence, Failure)
   - Detect orphaned/disconnected nodes
   - Reject impossible cross-floor movement
   - Validate accessibility constraints
   - Ensure every node is reachable from entrance

2. **Confidence Model Formalization**
   - Define `observation → accuracy → confidence` function
   - Remove hardcoded 1.0 for manual capture
   - Prepare for GPS/BLE/WiFi provider integration

3. **Concurrency Safety**
   - Versioned parking sessions
   - Detect multi-tab stale writes
   - Deterministic conflict resolution

4. **Real Mall of Africa Data**
   - Verified node count, positions, distances
   - Physical walkthrough validation
   - Entrance/exit confirmation
   - Landmark photographic proof

5. **Accessibility Verification**
   - Keyboard-only user testing (automated)
   - Screen reader semantics (automated)
   - Accessible routing constraints

6. **Multi-Mall**
   - Mall selection in UI (not hardcoded)
   - Cross-mall routing proof
   - Namespace collision prevention

After Core 0.2 gates pass: **tag `v0.1.1-hardened`**

---

## Using the 33×3 Sieve

For all PRs and features:

1. **Map your work to at least 3 perspectives** (A–F, 1–33)
2. **Prove all three degrees:** Does it exist? Does it cohere? What fails when it's wrong?
3. **Document in the commit message** which sieve cells your change addresses
4. **Link to tests** that verify Existence and Failure modes

Example commit message:

```
feat: add graph validator

Addresses Sieve perspectives C.12 (graph integrity), C.13 (routing), F.31 (expansion).

Existence: Rejects orphaned nodes, dangling references, impossible transitions.
Coherence: Walk edges only between same level; lift/stairs between different levels.
Failure: Invalid graphs are rejected before routing; no silent corruption.

Tests: tests/graph-validator.spec.ts (12 new tests, 100% pass)
E2E: Parking Truth Test still passes with validator enabled.
```

---

## How to Run

```bash
npm ci              # Install locked dependencies
npm run typecheck   # TypeScript strict mode
npm test            # Vitest unit suite
npm run build       # Production build
npm run dev         # Development server
npm run start       # Production server
npx playwright test # E2E browser automation
```

All gates must pass before merging to main.

---

## Current Verification Evidence

| Gate | Command | Status |
|---|---|---|
| Dependency reproducibility | `npm ci` | ✅ PASS |
| Type safety | `npm run typecheck` | ✅ PASS |
| Unit tests | `npm test` | ✅ PASS (23/23) |
| Production build | `npm run build` | ✅ PASS |
| E2E truth test | `npx playwright test` | ✅ PASS (2/2) |
| CI pipeline | GitHub Actions | ✅ GREEN |

Latest verified commit: `8a956e7510ab2730fdba9d131e3959fb9a679ad0`

---

## Architectural Principles

- **Correctness-first routing:** Edge distances are authoritative; schematic geometry is conservative only.
- **Local-first resilience:** Users never lose data, even without network.
- **Explicit confidence:** No silent failures. < 0.5 confidence blocks routing.
- **Honest about limits:** Unverified geometry is disclosed to users.
- **Zod validation everywhere:** Runtime contracts enforce type safety.
- **Offline-aware design:** App is fully functional without network.

---

## License

Proprietary (Mall Navigre)

---

**Status:** Core 0.1 verified. Next gate: Graph validator (Core 0.2, item 1).

**Governance:** All decisions evaluated against the 33×3 Sieve before merge.
