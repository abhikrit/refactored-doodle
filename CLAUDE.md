# CLAUDE.md — nopCommerce product prototype (KTDA, Malawi Post)

## What this repo is
A working prototype of one reusable e-commerce product on nopCommerce 5.00.1 (.NET 10) covering 434 features (PRD-<AREA>-nnn) for KTDA (Kenya) and Malawi Post. Specs are in /docs. Build exactly what the specs say; leave no layout or scope to discretion.

## Sources of truth (in this order)
1. /docs/prd/modules/PRD-<AREA>.md — stories (US-), acceptance criteria (AC-), rules (BR-), contracts (IC-), states (SM-), audit (AUD-), permissions, messages, configuration.
2. /docs/prd/01-product-prd.md — architecture, registers (§6.3), configuration model, NFRs, Definition of Done.
3. /docs/PRD_Product_Backlog_v10.xlsx — phase, pack, fit, depends-on, config pack schema, decisions.
4. /docs/register/Decisions-Gaps-Register.md — open decisions. For a held feature, build the PRD's "Proposed" option and label it "Prototype default — decision <ID> pending".
If sources conflict, stop and report both citations. Never invent requirements, values or names; where a value is "Not stated in source", make it a setting with no hidden default and list it.

## Architecture rules
- Never edit nopCommerce core, except entries listed in the core-modification register (L1 §6.3). Everything else is a plugin under src/Plugins/Nop.Plugin.Product.<Area>.
- One owner per overridden nopCommerce service (OVR-REG); other modules plug in as providers through the owner's contract (IC-…).
- Event consumers only notify or enqueue (consumers swallow exceptions). Order payment status changes only through IOrderProcessingService. Use ILocker with the named keys from the PRD. INopStartup order as specified.
- 5.00.1 is async-only: do not use removed sync APIs.
- Fixed decisions: CART-500 (single cart split across sellers; shoppingcartsettings.vendorenabled and .vendorrequired = false), PRICE-500 (native price lists for CAT-039/042; per-currency fixed prices built), VER-500 (5.00.1).
- All client differences through configuration packs (/packs, merge order global → country → vertical → client → store). No client-specific code paths.
- External systems (payments, tax e-invoicing, postal, SMS/WhatsApp, banks, ERP, Google services) are mocks under /mocks behind the same adapter interface the PRD defines.
- Messages through TRK-005, uploads through ADM-008, downloads through SEC-002, audit through SEC-004.

## Working method per module
Read the module chapter → list features/ACs/holds → propose a plan and wait for approval → build → one automated test per AC (test name = AC ID) → run → update /trace → commit with PRD IDs. Do not mark a feature done unless all its ACs pass.

## Output style
Tables over prose. End each session with: done / flagged / next, plus Flags / Open items / Conflicts.

---

## Prototype stack addendum (this repository, Session 0)

This repository is the **UI/UX prototype** of the product specified above. The user decided the prototype
stack: **React + Node.js + Tailwind, runs locally, no .NET and no database**, and that the nopCommerce
screens are **replicated** in that stack. The rules above still govern *what* is built; the three rows below
record where the prototype stack departs from the platform rules, with both citations, as required by
"If sources conflict, stop and report both citations".

| # | Kit source | User decision | Resolution in this repo |
|---|---|---|---|
| C-1 | `docs/prototype/PROTOTYPE_HANDOFF.md` §5.1.1 "add nopCommerce release-5.00.1 as the base"; this file "plugins under src/Plugins/Nop.Plugin.Product.<Area>" | React + Node + Tailwind, no .NET | No .NET source in the repo. 5.00.1 is pinned as a reference baseline in `platform/baseline.json` and mapped entity-by-entity in `docs/platform/baseline-mapping.md`; its storefront (DefaultClean) and admin screens are replicated in React + Tailwind. The plugin skeleton keeps the 24 area codes, one module per area under `packages/server/src/plugins/product-<area>/` with a `plugin.json` descriptor (`supportedVersions: ["5.00"]`). |
| C-2 | `docs/prototype/PROTOTYPE_HANDOFF.md` §4 **P-4** "MySQL 8 or SQL Server, local Docker; .NET 10 SDK" | no database | **P-4 is not applied as written.** State lives in an in-memory store behind an async `IRepository`-shaped interface (`packages/server/src/core/repository.js`), so a real provider can replace it without touching callers. No Docker, no migrations. |
| C-3 | This file / module chapters §11.1 "developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns" | replicate the nopCommerce screens | Agrees. `packages/web/src/ui/nop/` reproduces native nopCommerce patterns only. Every screen in the prototype carries its §11.1 row (surface, features, Native or New). |

### Prototype rules that follow from the stack
- Area code, feature ID, story ID, AC ID, rule ID, setting key, permission name and message key stay **exactly** as the PRD states them. The prototype is a different runtime, never a different vocabulary.
- 5.00.1 is async-only: every core service and repository method in the prototype is `async`.
- All client differences stay in `/packs` (merge order global → country → vertical → client → store). No client-specific code path, no `if (client === 'KTDA')`.
- External systems are mocks under `packages/mocks/` behind the adapter interface the PRD defines (P-3).
- Held features build the PRD's Proposed option and are labelled **"Prototype default — decision <ID> pending"** in the UI and in `trace/` (P-1).
- A feature is only reported built when its ACs have tests named by AC ID that pass (P-6). Everything else is `not-built` in `trace/`, never silently green.
