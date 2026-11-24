# Handoff: end-to-end working prototype (nopCommerce 5.00.1) — KTDA and Malawi Post

## 1. Goal
One running nopCommerce 5.00.1 product that demonstrates all 434 PRD features (PRD-<AREA>-nnn) and, through two configuration packs, the KTDA and Malawi Post requirements those features deliver. Onboarding a client = applying a configuration pack, not changing code.

## 2. What is in this kit
| Folder | Content | Use |
|---|---|---|
| `prd/modules/PRD-<AREA>.md` (24) | Developer chapters: stories, acceptance criteria (AC-…), rules (BR-…), contracts (IC-…), states (SM-…), audit (AUD-…), permissions, messages, configuration, test notes. Source of truth for building. | Build spec per module |
| `prd/01-product-prd.md` | Product PRD Part 1: scope, users/roles, architecture on 5.00.1, override / core-modification / filter registers (§6), configuration model, NFRs, integrations, phases, Definition of Done | Read first |
| `prd/00-pr-faq.md`, `client/Client-PRD.md` | Product overview and client edition | Demo narrative |
| `compliance/Compliance-Traceability.md` | Requirement → feature → story → AC → test (KTDA 95, Malawi Post 411) | Acceptance |
| `register/Decisions-Gaps-Register.md` | 72+ decisions, holds, gaps, open items | Defaults for open decisions |
| `PRD_Product_Backlog_v10.xlsx` | 434 features: phase, pack, fit (5.00.1), depends-on, config pack schema, Decisions, Definition of Done | Build order and fit |
| `PRD-L3-Traceability.xlsx` | Full trace matrix | Test coverage |
| `work500/` | 5.00.1 fit evidence per feature and mechanism changes vs 4.90 | Architecture reference |
| `CLAUDE.md` | Rules for Claude Code in the prototype repo | Copy to repo root |

## 3. Facts that shape the build (from the baseline)
- Fit on 5.00.1: 70 out of the box, 11 licensed third-party plugin, 308 code-level, 45 external system.
- Phases: P1 337, P2 76, P3 21. Dependency depth: most features are level 1–2; deepest chains reach level 5 (P1).
- 100 features are held by open decisions (80 in P1). Examples: WF-ENG (workflow engine), PAID-STUB (paid nopCommerce plugins), API-01 / API-GW (API product and gateway), DOC-LIB, CALLOFF-PLACE, FG-06, PH-INF, T-MISS (client content not supplied).
- Third-party plugins (NopStation, Nop-Templates, FoxNetSoft, AFR) have no verifiable 5.00 build (VENDOR-500). Paid official plugins in 5.00.1 are configuration stubs only (Lucene, Web API, Power BI, Dynamics 365, Mobile App, Omnibus).
- External systems are not reachable in a prototype: M-Pesa / Airtel / TNM Mpamba, KRA eTIMS, MRA EIS, PostGlobal and other postal systems, banks, ERPs, SMS / WhatsApp gateways, Google Cloud services.

## 4. Decisions to take BEFORE the first build session (prototype scope)
| # | Decision | Recommended for a prototype |
|---|---|---|
| P-1 | Open product decisions that hold 100 features | Build with the PRD's "Proposed" option for each, labelled "Prototype default — decision <ID> pending" in UI/admin and in the trace report |
| P-2 | Third-party / paid plugins (11 licensed + 6 stubs) | Build a minimal in-house equivalent behind the same extension point, or mock; no purchases for the prototype |
| P-3 | 45 external-system features | Mock services with recorded sample payloads (one mock project), switchable to real sandboxes later (e.g. Safaricom Daraja sandbox) |
| P-4 | Database and hosting | MySQL 8 or SQL Server, local Docker; .NET 10 SDK |
| P-5 | Demo data | Synthetic data only; client content not supplied (T-MISS) shown as placeholders |
| P-6 | "Done" for the prototype | Feature demonstrable + its ACs pass as automated or scripted tests; held features show the prototype default |

## 5. Build process (Claude Code)
### 5.1 One-time setup (session 0)
1. Create a repo; add nopCommerce `release-5.00.1` (git clone https://github.com/nopSolutions/nopCommerce --branch release-5.00.1) as the base; never edit core except entries in the core-modification register (L1 §6.3).
2. Copy `CLAUDE.md` (this kit) to the repo root, the kit's `prd/`, `client/`, `compliance/`, `register/`, workbook and `work500/` into `/docs`.
3. Skeleton: one solution folder `src/Plugins/Nop.Plugin.Product.<Area>` per area that needs code (24 areas), shared `Nop.Plugin.Product.Core` (extension points / provider registries per OVR-REG), `mocks/` (external systems), `packs/` (global, country KE/MW, vertical, client KTDA/MPC, store — merge order BR-PLT-010), `tests/` (xUnit + Playwright UI tests, test names = AC IDs), `trace/` (generated coverage report).
4. Run nopCommerce locally, install, seed synthetic data, commit.

### 5.2 Build order (waves, by dependency and the Areas order)
| Wave | Areas | Why first |
|---|---|---|
| 1 Foundation | PLT (packs, multi-client), IAM (roles, sign-in incl. phone OTP), SEC (audit, consent), ADM (workflow/approvals, extension register, uploads) | Everything plugs into these |
| 2 Catalogue | CAT (incl. IProductService host CAT-002, price lists PRICE-500), INV, SRC, SEL | Sellable catalogue |
| 3 Buy | CHK (single cart split across sellers, CART-500), PAY (mocked rails), ORD | First end-to-end order |
| 4 Fulfil | LOG, TRK, RET, DOC | Delivery, tracking, returns, documents |
| 5 Engage and run | CRM, MKT, RPT | Support, marketing, reporting |
| 6 Reach | CHN, INT, AI | Channels, APIs, AI |
| 7 Verticals | FIN, EGV, SVC | Finance, e-government, services |
Inside each wave: P1 features first, then P2, then P3; inside a module, the workbook "Depends on" order.

### 5.3 Per-module loop (one or more Claude Code sessions per module)
1. Read `docs/prd/modules/PRD-<AREA>.md` and L1 §6 for that area; list features, ACs, rules, contracts and held items.
2. Plan: files, entities and migrations, overrides / filters / consumers allowed by the registers, settings and pack keys; confirm before coding.
3. Build the plugin; config through settings and packs only; messages through TRK; uploads through ADM-008; audit through SEC-004.
4. Tests: one test per AC ID (name = AC ID); permission tests; state-transition tests from SM tables.
5. Run tests; update `trace/` (feature → AC → test → pass/fail); add a demo script per user story group.
6. Commit with the PRD IDs in the message; update the programme tracker.

### 5.4 Client configuration and demos
- Build `packs/client/KTDA` and `packs/client/MPC` from the Config pack schema sheet; switching packs must change behaviour without code.
- Demo journeys per client from the Client Overview (buyer purchase to delivery and returns; seller onboarding and listing approval; client-specific flows as stated in the client PRD). Tender, auction and bid scope is excluded (decision D-02).

### 5.5 Verification gates
- After each wave: all ACs of the wave pass; check_consistency of IDs; BA agent reviews the trace report against `compliance/`; Product Owner agent reviews demos against stories.
- Final: requirement coverage for KTDA (95) and Malawi Post (411) from the trace report, with held / mocked items listed.

## 6. Realistic size
308 code-level + 45 external features across 24 plugins is a multi-month build for a team; Claude Code accelerates it but each module needs several sessions and human review. Plan by wave; demo after each wave.
