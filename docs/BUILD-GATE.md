# Core Build Gate

Before `feat/parking-truth-core` can be merged into `main`, CI must prove:

- TypeScript has no errors.
- Domain regression tests pass.
- 33×3 failure-mode tests pass.
- Parking schema rejects missing identity and invalid confidence.
- Routing refuses temporarily unavailable infrastructure.
- Routing can operate on unverified geometry while explicitly reporting `verified: false`.
- Local persistence validates data on write and read.
- UI exposes online/offline state and does not claim exact bay precision.

A passing build is necessary, not sufficient: the next gate is browser-level verification of Save → Reload → Find under simulated offline conditions.
