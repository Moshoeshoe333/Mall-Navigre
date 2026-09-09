# 33 × 3 Engineering Sieve

The 33 perspectives are an audit lens, not 99 features.

Every meaningful capability is tested at three degrees:

1. **Existence** — does it work in reality?
2. **Coherence** — does it agree with adjacent systems?
3. **Failure** — what happens when it is wrong, missing, stale, duplicated, unavailable, or offline?

## 33 perspectives

### A — Reality
1. Physical environment
2. Mall structure
3. Floors and vertical relationships
4. Entrances/exits
5. Parking infrastructure

### B — Knowledge
6. Mall identity
7. Place identity
8. Node identity
9. Edge identity
10. Floor relationships
11. Data provenance/freshness

### C — Logic
12. Graph integrity
13. Routing
14. Localization
15. Confidence
16. State transitions
17. Error handling/recovery

### D — Human experience
18. User intent
19. Cognitive load
20. Accessibility
21. Discoverability
22. Trust/transparency
23. Recovery from mistakes

### E — Technology
24. Local storage
25. Network/offline state
26. Sensors
27. Performance/battery
28. Security/privacy

### F — Evolution
29. Data updates
30. Hardware replacement
31. Mall expansion
32. Multi-mall portability
33. Observability/testing

## Required audit direction

For important flows, inspect both:

`UI → Domain Logic → Data`

and the reverse trace:

`Data → Domain Logic → UI`

The second direction is critical for finding silent contradictions, stale state, invalid references, and UI claims that the data cannot support.

## First crucible

`SAVE MY CAR → STORE → CLOSE → REOPEN → FIND MY CAR`

This single vertical slice exercises local persistence, user state, parking identity, graph relationships, offline behavior, confidence, routing, recovery, and trust.
