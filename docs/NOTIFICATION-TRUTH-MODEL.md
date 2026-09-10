# Navigre Notification Truth Model

## Purpose

Navigre notifications are user-facing operational signals from the physical mall and the app runtime. They must distinguish a raw event from the condition that is currently true, and they must expose enough context for a user to recover safely.

GitHub CI history is **not** a consumer-app notification source and must not be implemented as a notification-monitoring feature inside the Mall Navigre app.

## Truth chain

```text
RAW SPATIAL / RUNTIME EVENT
        ↓
PROVENANCE
        ↓
CONDITION / ROOT CAUSE
        ↓
OPERATIONAL STATE
        ↓
USER-FACING NOTIFICATION
        ↓
RECOVERY
        ↓
VERIFICATION
```

## Core principles

1. **Event ≠ state.** A momentary low-confidence observation is not automatically proof that localization is continuously unavailable.
2. **Resolution requires evidence.** A notification should resolve when the underlying condition has recovered or authoritative data supersedes it.
3. **Verification is explicit.** Recovery should be grounded in a new observation, network state, or verified venue-data timestamp as appropriate.
4. **Provenance is mandatory.** Runtime notifications retain their mall, source, timestamp, and relevant spatial identifiers where available.
5. **Root causes are grouped.** Repeated signals from the same underlying condition should not become an uncontrolled stream of duplicate user alerts.
6. **History is preserved.** Resolved runtime events may remain available for diagnostics without being presented as current failures.
7. **Current state is derived.** The UI must represent the current operational condition rather than merely the latest event received.
8. **Failure is first-class.** Duplicate, stale, out-of-order, missing-context, unavailable, and corrupted notification states must be testable.
9. **Recovery is actionable.** Where possible, a notification tells the user what they can do next.

## In-app notification types

The consumer app begins with three deliberately narrow notification types:

- `LOW_LOCATION_CONFIDENCE` — the system cannot confidently identify the user's current position.
- `OFFLINE_MODE_ACTIVE` — network connectivity is unavailable and the app is operating from local data.
- `STALE_VENUE_DATA` — venue data is older than the application's accepted freshness threshold or cannot currently be verified.

These notifications are spatial/runtime concerns. They do not represent GitHub workflow health, CI run history, repository failures, or deployment monitoring.

## Operational states

- `active`: evidence indicates the underlying condition is currently present.
- `resolved`: evidence indicates the condition has recovered or been superseded.
- `unknown`: available evidence is insufficient to determine the present condition.

## Minimum provenance

A runtime notification should retain, where applicable:

- mall identifier
- notification type
- source
- occurred-at timestamp
- relevant level, parkade, or node identifier
- confidence or freshness evidence when applicable
- recovery action when one exists

## 33 × 3 audit requirements

### Existence

Can the system create, persist, display, resolve, and recover from a notification event?

### Coherence

Does notification state agree with localization observations, network state, venue-data freshness, and the relevant spatial context?

### Failure

What happens with duplicate events, stale events, out-of-order recovery, missing spatial context, unavailable storage, unavailable network, and corrupted notification data?

## Boundary

```text
GitHub CI
   │
   └── developer/engineering evidence only

Mall runtime
   │
   ├── localization
   ├── connectivity
   └── venue-data freshness
            ↓
      Navigre notification model
            ↓
        consumer UI
```

GitHub remains outside the consumer notification domain. The app's notification model is intentionally limited to conditions that affect the user's physical navigation experience.
