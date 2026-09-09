# 33×3 Parking Truth Audit

| # | Perspective | Existence | Coherence | Failure | V1 state |
|---|---|---|---|---|---|
| 1 | Physical environment | parking context modeled | parkade/level identity | wrong level must be visible | partial |
| 2 | Mall structure | mallId modeled | graph scoped to mall | wrong mall rejected | pass |
| 3 | Floors | levelId required | node/parking agree | missing level rejected | pass |
| 4 | Entrances/exits | entrance node | graph edge relationship | unavailable edge blocked | pass |
| 5 | Parking infrastructure | parkadeId required | session links to graph | unknown bay not invented | pass |
| 6 | Mall identity | mallId | all entities agree | mismatch rejected | pass |
| 7 | Place identity | Place contract | node reference | orphan rejected | pass |
| 8 | Node identity | unique id | edges reference nodes | duplicates fail | pass |
| 9 | Edge identity | unique id | endpoints resolve | dangling edge fails | pass |
| 10 | Floor relationships | level references | vertical nodes modeled | missing transition exposed | partial |
| 11 | Provenance | source/status fields | UI disclosure | stale data visible | partial |
| 12 | Graph integrity | validator exists | domain-owned | invalid graph fails | pass |
| 13 | Routing | A* exists | consumes graph only | no route is explicit | pass |
| 14 | Localization | observation contract | provider-independent | weak source can pause | pass |
| 15 | Confidence | 0..1 | drives UX | <0.5 confirmation | pass |
| 16 | State transitions | parking states | persistence aligned | invalid state fails closed | pass |
| 17 | Error handling | explicit messages | no fabricated fallback | storage/routing errors surfaced | pass |
| 18 | Intent | Save/Find actions | parking-first | no hidden automation | pass |
| 19 | Cognitive load | small action set | one core task | details progressive | pass |
| 20 | Accessibility | graph flag | route option | inaccessible route excluded | pass |
| 21 | Discoverability | Save/Find visible | state obvious | empty state clear | pass |
| 22 | Trust | truth mode | claims bounded by data | unverified disclosed | pass |
| 23 | Recovery | reload restore | local-first | corrupt data not trusted | pass |
| 24 | Local storage | IndexedDB | schema validated | unavailable reported | pass |
| 25 | Network | online/offline state | no network dependency for save | offline retained | pass |
| 26 | Sensors | observation source | no routing coupling | weak sensor can defer | partial |
| 27 | Performance | small deterministic graph | no premature optimization | benchmark later | partial |
| 28 | Security/privacy | local state | no unnecessary cloud data | no PII required | partial |
| 29 | Data updates | status model | routing respects status | unavailable blocked | pass |
| 30 | Hardware replacement | provider-independent | observation contract | provider can change | pass |
| 31 | Mall expansion | config-driven | engine reusable | new mall is data | partial |
| 32 | Multi-mall | mallId boundary | no hard-coded engine | config separation | partial |
| 33 | Observability/testing | regression tests | contracts tested | failure fixtures fail CI | pass |

## Gate

This matrix is intentionally honest: `partial` means the architecture has a seam, not that the capability is complete. The next phases close the partials with real data and measured tests rather than adding visual complexity.
