# Session 0 record

Handoff section 5.1 "One-time setup (session 0)", delivered to the stack the user chose:
React + Node + Tailwind, no .NET, no database, nopCommerce screens replicated.

## What was delivered

| Handoff step | Delivered |
|---|---|
| 1. Repository on the 5.00.1 base | Baseline pinned in `platform/baseline.json` and mapped in `docs/platform/baseline-mapping.md`; the 5.00.1 storefront and admin screens replicated in React + Tailwind (conflict C-1 in CLAUDE.md) |
| 2. CLAUDE.md at the root, kit into /docs | Done, plus the prototype stack addendum recording conflicts C-1 to C-3 |
| 3a. One plugin per area (24) | `packages/server/src/plugins/product-<area>/` with `plugin.json` + `index.js`; the host installs all 24 at boot in `INopStartup` order |
| 3b. Shared core / extension points | `packages/server/src/core/` - repository, settings, pack loader, provider registry (OVR-REG), events, locker, audit, messages, permissions, plugin host |
| 3c. `mocks/` | `packages/mocks/` - 30 adapters covering the external systems, with recorded payloads and healthy / slow / failing switches |
| 3d. `packs/` | 21 pack files: global, country KE and MW, 15 vertical packs, client KTDA and MPC, one store overlay. Merge order global → country → vertical → client → store |
| 3e. `tests/` | `tests/unit/` (API, 30 tests) and `tests/ui/` (browser, 5 tests); every test name is an AC ID |
| 3f. `trace/` | `trace/trace.md`, `trace.json`, `coverage.html`, generated from the test results |
| 4. Running locally with synthetic data | `npm run dev` → http://localhost:4000, seeded per client pack |

Beyond the setup, one end-to-end journey was built so the skeleton is demonstrably alive:
browse → cart with two sellers → per-line delivery or collection → one mobile-money payment →
split into sub-orders under one checkout reference → shipment and tracking → outlet handover
against the pickup code → audit trail, message log and payment transactions in the admin area.

## Decisions applied

P-1 to P-5 as recommended in handoff section 4, except P-4, which the user's stack decision
overrides (no MySQL / SQL Server / Docker / .NET SDK; an in-memory store behind an async
`IRepository`-shaped interface instead). P-6 was adopted as the prototype's Definition of Done
because it governs the tests and the trace report.

## Flags carried into the next session

| Flag | Item |
|---|---|
| F-1 | P-4 not applied as written - no database. A real provider has to be written behind `core/repository.js` |
| F-2 | The 5.00.1 source is not in this repository; `docs/platform/baseline-mapping.md` needs a developer review against the real tag |
| F-3 | P-6 adopted as the Definition of Done although the user's list stopped at P-5 |
| F-4 | Screen layouts are "not specified" in the PRD (section 11.1); native nopCommerce layouts stand in until approved designs exist |
| F-5 | T-MISS, VENDOR-500 and the 45 external systems remain placeholders and mocks by P-3 and P-5 |
| F-6 | 100 features are held by an open decision; 80 of them are P1. The register in `docs/register/` lists the owner of each |

## Next session

Wave 1 Foundation, module by module in the handoff's per-module loop (section 5.3): read the
module chapter, list features / ACs / holds, propose the plan and wait for approval, build, one
test per AC ID, run, update `/trace`, commit with the PRD IDs. Order inside the wave:
PLT → IAM → SEC → ADM.
