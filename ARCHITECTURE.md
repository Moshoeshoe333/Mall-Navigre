# Mall Navigre — Core Architecture

## The Point
Reduce friction in large physical environments: disorientation, time-loss, and misplaced vehicles.

## The Knowing
Translate physical reality into validated spatial knowledge, then into a simple human action:

`Reality → Graph → Integrity → State → Decision → Experience`

## V1 Core

1. Mall configuration
2. Spatial graph (`MallNode`, `MallEdge`)
3. Places/facilities
4. Parking Passport (`ParkingSession`)
5. Location observations
6. Local-first/offline persistence
7. Deterministic routing
8. 2D schematic map
9. Data integrity validation
10. Automated type/build checks

## Explicitly deferred

AR, BLE infrastructure, live crowd prediction, AI routing, computer vision, loyalty, advertising, social features, predictive parking, and other non-core systems.

## Boundary rules

- Canonical mall data is separate from user state.
- Localization providers must produce a common `LocationObservation`; routing must not depend on a specific sensor.
- V1 never claims GPS is an exact indoor parking-bay locator.
- Uncertainty is represented explicitly through confidence and status.
- Every graph relationship must be referentially valid.
- A feature enters Core only after Existence, Coherence, and Failure checks.

## Future portability

The routing/domain engine must remain independent of Mall of Africa-specific configuration. A future mall is data, not a new navigation engine.
