# Spatial Seam 4 — Failure Matrix

| Condition | Authorization |
|---|---|
| Fresh + active graph-consistent node | Allowed |
| Stale | Denied |
| Conflicting | Denied |
| Unresolved | Denied |
| Missing node identity | Denied |
| Mall mismatch | Denied |
| Level mismatch | Denied |
| Missing node in graph | Denied |
| Temporarily unavailable node | Denied |
| Unverified node | Denied |
| High confidence alone | Never sufficient to create verification |
| No route to destination | Not decided here |
| Graph changed after prior authorization | Revalidate; do not reuse stale authorization |
