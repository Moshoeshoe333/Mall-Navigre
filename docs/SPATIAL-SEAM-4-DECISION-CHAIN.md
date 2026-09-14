# Spatial Seam 4 — Decision Chain

The routing start authorization seam intentionally stops before route computation.

```text
current localization
        ↓
state gate (fresh only)
        ↓
node identity gate
        ↓
current graph identity/status validation
        ↓
routing start authorization
        ↓
route computation
        ↓
operational route validation
        ↓
route result
```

A successful start authorization means only that the current localized node is permitted to be supplied as a routing start. It does not mean a destination is reachable, a route exists, or the resulting route is verified.

A graph mutation after authorization invalidates the prior decision because the authorization is explicitly a current-state gate, not a cache.

Parking Passport remains the destination-side authorization boundary. It is not merged into localization authorization.
