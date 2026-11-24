# nopCommerce product prototype — KTDA and Malawi Post

A **UI/UX prototype** of the reusable B2B + B2C e-commerce product specified in `/docs`: one
nopCommerce-based product covering **434 features across 24 areas**, where onboarding a client
means applying a configuration pack, not changing code.

The real product is nopCommerce **5.00.1 on .NET 10** (decision VER-500). This repository is the
prototype of it, built to a different stack by explicit instruction:

> **React + Node.js + Tailwind, runs locally, no .NET and no database**, with the nopCommerce
> screens replicated so the prototype reads as nopCommerce and maps one-to-one onto the later
> .NET build.

Everything the prototype shows about the product — features, user stories, acceptance criteria,
business rules, screens, settings, permissions, client requirements, decisions — is **generated
from `/docs`**. No requirement, ID, count or rule is typed by hand in the application.

---

## Run it

Requires **Node 22 or later** (this repository was built on v22.23.5). Nothing else: no .NET SDK,
no Docker, no database.

```bash
npm install
```

```bash
npm run dev
```

Then open:

**http://localhost:4000**

That is the only port. The API is mounted into the dev server as middleware, so one command, one
process, one port. The API lives under `http://localhost:4000/api`.

To run the production build instead (same port):

```bash
npm run build && npm start
```

### What to do first

1. **Walk the buyer journey** (the one end-to-end flow Session 0 built):
   browse → add items from **two different sellers** → in the cart set one line to *Home delivery*
   and the other to *Collect at an outlet* → Checkout → choose **M-Pesa** → confirm the push on the
   "handset" → the order splits into **two sub-orders under one checkout reference**, and the
   collection sub-order shows its **pickup code**.
2. **Switch the client pack** in the black bar at the top: *Malawi Posts Corporation* (the default,
   and the client being implemented) ⇄ *Kenya Tea Development Agency*. The storefront re-skins, the
   language and currency change, the payment rails change, and guest checkout is refused for
   Malawi Post — with **no code change**. See it in Administration → Configuration →
   **Configuration packs**. Start on another pack with `CLIENT=KTDA npm run dev`.
3. **Hand the parcel over** at Outlet / agent → *Hand over a collection*: a wrong code is refused,
   the right code completes the delivery.
4. **Look behind it**: Administration → Local plugins (the 24 area plugins and the override
   register), System → Audit trail, System → Mocks console, Configuration → Feature registry.
6. **Look at the whole product**: Product explorer → Features / Areas / Roles / Requirement
   coverage / Decisions / Trace report.

5. **Plan the build by user group**: Product explorer → **User groups** → *Client administrators*
   — the 137 features of the product mapping diagram, in build order by wave, phase, priority and
   dependency. The same order is written to `trace/build-map-client-administrators.md`.

Seeded sign-ins (synthetic, password `demo` for all): `buyer@example.com`,
`company.buyer@example.com`, `admin@example.com`, `finance@example.com`, `logistics@example.com`,
`auditor@example.com`, and for Malawi Post `agent.lilongwe@example.com`.

### Other commands

| Command | What it does |
|---|---|
| `npm run generate` | Regenerates `packages/shared/data/*.json` from `/docs` |
| `npm run check` | The handoff's consistency gate: 434 features / 24 areas / 274 screens / 2 850 ACs / 506 requirements and every cross-reference |
| `npm test` | Acceptance tests over the API; **every test is named by an AC ID** |
| `npm run test:ui` | The same journey in a real browser (needs `npm run dev` running) |
| `npm run trace` | Rebuilds `trace/trace.md`, `trace/trace.json` and `trace/coverage.html` |
| `npm run map` | Writes the build map for a user group, e.g. `npm run map -- finance-fraud-and-legal-staff` |
| `npm run verify` | check → test → trace |

---

## What is built, and what is not

Session 0 of `docs/prototype/PROTOTYPE_HANDOFF.md` §5.1 is: set the repository up, scaffold a
plugin per area, add the mocks, packs, tests and trace folders, and get it running with synthetic
data. On top of that this prototype builds **one end-to-end journey** so the skeleton is
demonstrably alive.

| State | Features | Meaning |
|---|---|---|
| Built and passing | 15 | At least one acceptance criterion has a passing test named by its AC ID |
| Held, prototype default | 99 | Held by an open decision; built as the PRD's *Proposed* option and labelled "Prototype default — decision &lt;ID&gt; pending" (P‑1) |
| Mocked externally | 30 | External-system feature behind a mock adapter (P‑3) |
| Not built | 290 | Scaffolded in Session 0; built in its own session |
| **Total** | **434** | reconciles — see `trace/trace.md` |

**Nothing is reported done because it looks finished.** A feature only counts as built when one of
its own acceptance criteria has a passing test named by that AC ID (decision P‑6). 30 AC-named
tests pass today; the product has 2 850 acceptance criteria.

All 24 areas are scaffolded as plugins, and all **274 screens** from the module chapters are
registered and reachable. The ones Session 0 built for real are the storefront journey, the
administration area listed above, the seller portal read model and the outlet counter.

---

## How it maps to the real nopCommerce build

| Prototype | Real build |
|---|---|
| `packages/server/src/plugins/product-<area>/` with `plugin.json` | `src/Plugins/Nop.Plugin.Product.<AREA>` with `plugin.json` (`SupportedVersions: 5.00`) |
| `core/repository.js` — in-memory, async only | `Nop.Data` `IRepository<TEntity>` (5.00 removed the synchronous members) |
| `core/settings.js` — store value, else StoreId 0 | `SettingService.LoadSettingAsync` |
| `core/pack-loader.js` | PRD‑PLT‑003 pack loader (BR‑PLT‑010) |
| `core/providers.js` — one owner per service | Decision OVR‑REG / L1 §6.2 principle 7 |
| `core/events.js` — consumers swallow errors | `IEventPublisher` + consumers (L1 §6.2 principle 8) |
| `core/locker.js` — named keys | `ILocker` with the key names the PRD states |
| `packages/web/src/ui/nop/` | DefaultClean storefront theme and the admin area |
| `packages/mocks/` | The 45 external systems of L1 §6.9 |

Setting keys, permission system names, locale resource keys, entity names, message texts, AC IDs
and business-rule IDs are the PRD's own, unchanged. `platform/baseline.json` pins the baseline and
`docs/platform/baseline-mapping.md` records the mapping.

---

## Prototype decisions (handoff §4)

| # | Decision | Applied as |
|---|---|---|
| P‑1 | Open decisions holding 100 features | Build the PRD's *Proposed* option, labelled "Prototype default — decision &lt;ID&gt; pending" in the UI and in `trace/` |
| P‑2 | 11 licensed + 6 paid-stub plugins | Minimal in-house equivalent behind the same extension point. No purchases |
| P‑3 | 45 external-system features | Mock adapters with recorded sample payloads (`packages/mocks/payloads/`), switchable per adapter to healthy / slow / failing |
| P‑4 | *Database and hosting* | **Not applied as written.** The handoff recommends MySQL 8 or SQL Server in Docker with the .NET 10 SDK; the instruction for this prototype is no .NET and no database, so state lives in an in-memory store behind an async `IRepository`-shaped interface |
| P‑5 | Demo data | Synthetic only. Client content that was not supplied (decision T‑MISS) is shown as a labelled placeholder, never invented |
| P‑6 | "Done" for the prototype | Feature demonstrable **and** its ACs pass as named tests; everything else is `not-built` in `trace/` |

Three conflicts between the kit and the stack instruction are recorded with both citations in
`CLAUDE.md` (C‑1 the 5.00.1 base, C‑2 the database, C‑3 screen layouts).

---

## Layout

```
CLAUDE.md                  rules for this repository + the prototype stack addendum
docs/                      the handoff kit, unchanged: prd/ (L1 + 24 module chapters), client/,
                           compliance/, register/, work500/, both workbooks
docs/platform/             baseline-mapping.md - prototype ↔ nopCommerce 5.00.1
docs/prototype/            PROTOTYPE_HANDOFF.md and the Session 0 record
platform/baseline.json     the pinned nopCommerce baseline (release-5.00.1, .NET 10, VER-500)
packages/shared/           generated registries - the single source the web and API both read
packages/server/           Express API: core services + one plugin per area
  src/core/                repository, settings, pack loader, providers, events, locker, audit,
                           messages, permissions, plugin host
  src/plugins/product-*/   the 24 area plugins (plugin.json + index.js + services/)
  src/data/seed/           synthetic data for both clients
packages/mocks/            external-system adapters and their recorded payloads
packages/web/              React 19 + Vite + Tailwind 4
  src/ui/nop/              the nopCommerce UI kit (storefront and admin patterns)
  src/surfaces/            storefront · admin · seller · outlet · explorer
packs/                     global · country/{KE,MW} · vertical/* · client/{KTDA,MPC} · store
tests/unit/                acceptance tests over the API, named by AC ID
tests/ui/                  the same journey in a browser
trace/                     generated coverage report (md, json, html)
scripts/                   generate-registries · check-consistency · build-packs ·
                           scaffold-plugins · build-trace
```

---

## Honest limits

- This is a **prototype**, not the product. There is no .NET, no database, no real external
  system and no security control: passwords are not hashed, sessions are a header, and the store
  is a process-memory Map that resets when the server restarts or the client pack is switched.
- All data is **synthetic** (P‑5). No KTDA or Malawi Post content is reproduced here, because the
  sources do not contain it. Branding colours are placeholders — KTDA's brand guidelines were not
  provided (REQ‑KTDA‑UX‑002) and Malawi Post's branding is not stated in source.
- No request leaves the machine. Every payment rail, carrier, tax authority, postal system, SMS
  and WhatsApp gateway, ERP and bank is a mock with a recorded payload.
- Screen layouts are **not specified** in the PRD (module chapters §11.1), so the prototype uses
  native nopCommerce patterns only and invents no layout of its own.
- 100 features are held by an open decision. They are built to the PRD's *Proposed* option and
  labelled; a real build does not start them until the decision is recorded.
