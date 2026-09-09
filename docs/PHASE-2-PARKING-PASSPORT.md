# Phase 2 — Parking Passport Contract

## Stored truth

A parking session must identify the mall, parkade, level, capture time, source, and confidence. Zone, landmark, bay, note, and photo references are optional because physical environments vary in how much detail can be observed.

## Confidence rule

- `0.80–1.00`: strong observed/manual landmark context
- `0.50–0.79`: usable but should remain visibly approximate
- `<0.50`: do not silently navigate; request a visible landmark confirmation

Confidence is not a probability claim about physical truth. It is Navigre's explicit estimate of how trustworthy the current observation is.

## Offline contract

The save operation writes to local IndexedDB before any future synchronization. Network loss cannot erase the last valid local session.

## Recovery contract

On app startup, Navigre attempts to restore the active session. Invalid persisted data is not trusted. The system fails closed and reports that the local session could not be recovered rather than fabricating a replacement.

## Navigation contract

The routing engine consumes graph nodes/edges, not GPS/BLE/Wi-Fi directly. A localization provider may change without changing the routing algorithm.

## User-facing truth

V1 may say:

> Parkade C · Level 4 · Near Entrance 16 · Confidence 95%

It must not say:

> Bay 184

unless a real observation or verified infrastructure actually supports that claim.
