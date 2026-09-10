# Navigre Notification Truth Model

## Purpose

The notification layer must distinguish historical events from current operational state. A failed CI run is an event; it is not, by itself, proof that the system is currently failing.

## Truth chain

```text
RAW EVENT
   ↓
PROVENANCE
   ↓
ROOT-CAUSE CLASSIFICATION
   ↓
OPERATIONAL STATE
   ↓
NOTIFICATION
   ↓
RESOLUTION
   ↓
VERIFICATION
```

## Core principles

1. **Event ≠ state.** A historical failure remains a historical failure after a later fix.
2. **Resolution requires evidence.** Age or run number alone must not mark an event resolved.
3. **Verification is explicit.** A fix should reference the verification event/run that proves recovery.
4. **Provenance is mandatory.** CI events should retain workflow, run number, commit SHA, and timestamp where available.
5. **Root causes are grouped.** Repeated runs caused by the same defect should be traceable to one incident/root cause.
6. **History is preserved.** Resolved events are classified, not deleted.
7. **Current state is derived.** The operational UI should not infer current health from an old notification.
8. **Failure is first-class.** Duplicate, stale, out-of-order, missing-provenance, and unavailable-event conditions must be testable.

## Operational states

- `active`: evidence indicates the underlying condition remains unresolved.
- `resolved`: a corrective change is known, but verification is not yet attached or complete.
- `verified`: subsequent evidence proves the affected behavior passed.
- `superseded`: the event is retained but replaced by a newer authoritative event/state.
- `unknown`: available evidence is insufficient to determine present state.

## Minimum provenance

For CI-derived events, retain:

- repository
- workflow name
- run number
- commit SHA
- occurred-at timestamp
- conclusion
- failure category when known

The commit SHA should be stored as structured data rather than encoded only into a display name.

## Failure classification

Use stable categories rather than parsing arbitrary human-readable messages:

- `dependency`
- `typecheck`
- `unit_test`
- `build`
- `e2e`
- `infrastructure`
- `unknown`

## 33 × 3 audit requirements

### Existence

Can the system create, persist, display, resolve, and verify a notification event?

### Coherence

Does notification state agree with event provenance, repository state, corrective commit, and verification evidence?

### Failure

What happens with duplicate events, stale events, missing SHA, missing classification, out-of-order resolution, unavailable verification, or corrupted notification data?

## Design boundary

GitHub remains the source of raw CI events. Navigre owns the normalized operational model. This avoids coupling Navigre's future notification system to GitHub's presentation semantics.
