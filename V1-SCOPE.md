# Navigre Core 0.1 — Parking Truth Test

## Acceptance test

A user can:

1. Open Navigre.
2. Select or capture a parking location.
3. Save it immediately to local storage.
4. Close the app.
5. Lose network connectivity.
6. Reopen the app.
7. Retrieve the correct active parking session.
8. View the destination on the mall graph.
9. Request a route to the saved destination.
10. Receive honest confidence/status information.

If this fails, the foundation is not ready for AR, AI, BLE, or monetization.

## In scope

- Typed domain model
- Zod runtime validation
- Mall configuration files
- Graph integrity validator
- Parking session model
- Location observation model
- Local-first storage adapter
- Offline-aware application state
- Basic deterministic routing
- Schematic 2D map
- Save My Car / Find My Car
- Confidence-aware language
- Automated tests
- CI checks

## Out of scope

- Survey-grade indoor positioning
- Exact bay location from GPS
- BLE hardware deployment
- Computer vision localization
- AR navigation
- AI Copilot
- Live crowd intelligence
- Advertising/sponsored routing
- Loyalty/social features
- Full CMS
- Multi-mall operations dashboard

## Data truth policy

The application may use verified public mall information as configuration input, but uncertain geometry is explicitly marked `unverified`. We do not manufacture precision.

User state such as “I parked here” is never written into canonical mall infrastructure.

## Definition of done

- Typecheck passes.
- Tests pass.
- Build passes.
- Invalid graph fixtures are rejected.
- Parking data survives reload in the browser.
- Offline operation does not erase the last valid parking session.
- Routing never traverses inactive edges.
- UI never presents an unavailable destination as confidently reachable.
- The 33×3 sieve has been applied to the vertical slice.
