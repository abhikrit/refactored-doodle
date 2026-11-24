# Product Requirements Document (L1): Reusable B2B + B2C e-commerce product on nopCommerce 5.00

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. Do not edit the Word file. -->

## 0. Document control

| Item | Value |
|---|---|
| Document | Product PRD: Part 0 product overview, Part 1 product requirements (this part), Part 2 the 24 module chapters. It specifies what the product does and how it is built on nopCommerce 5.00. |
| Version / date | 1.0 (nopCommerce 5.00, draft for review) / 2026-11-24 |
| Status | Draft, not approved. Approval by the Product Owner (Scrum Guide 2020: the Product Owner is accountable for the Product Goal and the Product Backlog). Product Owner name: Not stated in source — requires confirmation. |
| Baseline data | The product baseline workbook (434 product features with pack and reuse tier, phasing, nopCommerce 5.00 fit, configuration-pack schema). Every count and list in this document is generated from it. |
| Platform | nopCommerce 5.00.1 on .NET 10, verified against the official source tag release-5.00.1 (decision VER-500). Fit: 70 configuration / 11 licensed plugin / 308 code-level / 45 external system. |
| Companion documents | Compliance and traceability report (client requirements, compliance status, traceability matrix, source coverage and conflicts). Decisions, gaps and open items register (decision log, holds and readiness conditions, gap register, open items per feature). |
| Change control | Change the baseline workbook or the module content first, then regenerate. Do not edit the generated files. |

## 1. Purpose and how to read this PRD

This PRD is the baseline the developers start from. It states what the product must do, why, for whom, on which nopCommerce capability it rests, in which phase it is delivered, and which client requirement it satisfies. It does not size work or plan Sprints; sizing belongs to the Developers (Scrum Guide 2020).

### 1.1 PRD layers

| Document | Content | Readers |
|---|---|---|
| Product PRD (this document) | Part 0 product overview; Part 1 vision, Product Goal, scope, users, architecture on nopCommerce 5.00, configuration model, non-functional requirements, integrations, release phases, Definition of Done, feature index, glossary; Part 2 one chapter per module with user stories, acceptance criteria, rules, states, data, screens, configuration, contracts and tests | Developers, testers, architects |
| Compliance and traceability report | Client requirement baseline and compliance status; requirement → feature → story → criterion → test matrix; feature → story → criterion → test trace; per-feature source traceability; catalog and Post Gebeya coverage; source conflicts | Business analysts; client submissions |
| Decisions, gaps and open items register | Decision log, holds and readiness conditions, gap register, compliance reclassification, open items per feature | Product Owner; steering |

In Part 2, "L1 §n" refers to section n of Part 1 of this document. Status lines in the chapters read "On hold: <decision ID>" or "Readiness conditions: <decision IDs>"; the meaning of each ID is in Appendix B, and the decisions themselves are in the Decisions, gaps and open items register.

### 1.2 Identifier conventions (stable across all layers)

| Identifier | Format | Example | Meaning |
|---|---|---|---|
| Client requirement | REQ-<CLIENT>-<MODULE>-nnn | REQ-KTDA-PAY-004, REQ-MPC-FR-126 | A requirement extracted from a client source |
| Catalog feature | FC-Mnn-nnn | FC-M24-005 | A feature row of the Feature Catalog (module, row order) |
| Post Gebeya item | <AREA>-nn | CHK-11 | A capability recorded in the Post Gebeya blueprint |
| Product feature | PRD-<AREA>-nnn | PRD-PAY-004 | One product feature (Product Backlog item) |
| User story | US-<AREA>-nnn-nn | US-PAY-004-01 | A story under a product feature (L2) |
| Business rule | BR-<AREA>-nnn | BR-PAY-012 | A rule the system enforces (L2) |
| Acceptance criterion | AC-<AREA>-nnn-nn-nn | AC-PAY-004-01-02 | A testable condition of a story (L2) |
| Non-functional requirement | NFR-<AREA>-nnn / NFR-X-nnn | NFR-X-003 | Module-specific / cross-cutting quality requirement |
| Decision | as in the decision log | K-08, FG-06, VER-500 | An open or closed decision (§12) |

### 1.3 Labels used for every statement

- **Stated**: the source says it; the source ID is cited.
- **Inference**: derived by the analyst; the reasoning is given and the item is to be confirmed.
- **Not stated in source — requires confirmation**: a gap; it is not filled by assumption.
- **Subject to decision / client content**: the requirement holds, but part of it depends on an open decision or on content the client has not provided.


## 2. Product vision and Product Goal

### 2.1 Problem statement

The project brief states the aim: build one reusable e-commerce product on nopCommerce that covers the requirements of KTDA and Malawi Post, and that future clients onboard "by configuration, not new customisation each time". Success is defined in the brief as "one nopCommerce-based product where onboarding a new client means configuring the product, not rebuilding it".

### 2.2 Product Goal (proposed — the Product Owner to confirm)

One reusable nopCommerce-based e-commerce product, for business buyers (B2B) and consumers (B2C), where onboarding a new client means configuring the product, not rebuilding it — starting with KTDA (Kenya) and Malawi Post.

Source: project description; user directive 2026-11-18 (the product is B2B and B2C, goods and services).

### 2.3 What the Goal means in practice

- Every client runs the same product version; differences are settings, configuration packs and adapters (PRD-PLT-001, PLT-003, PLT-021, PLT-022).
- KTDA's and Malawi Post's stated requirements are delivered by product features; project services (training, support, hosting, hardware) are delivered by the project, not the product.
- Country-specific needs (payment rails, carriers, statutory e-invoicing, data protection) are adapters or country packs, never changes to the core.
- No India-specific rails or examples from the catalog (UPI, Aadhaar, GST, DLT, GeM and similar) are carried; Kenya and Malawi equivalents are named only where a client source confirms them.

### 2.4 Success measures

Not stated in source — requires confirmation. No source gives a measurable target for the Goal (for example time to onboard a new client, or share of client differences handled without code). The Product Owner should set them before the first Sprint Review.


## 3. Scope

### 3.1 In scope

| Measure | Value |
|---|---|
| Product features | 434 |
| Feature areas (modules) | 24 |
| Phase P1 / P2 / P3 | 337 / 76 / 21 (rules in §10) |
| Catalog features in scope | 469 of 544 (the 75 excluded are tender, auction and bid features, decision D-02) |
| Commerce types | Goods and services; B2B and B2C; G2C/G2B services as an optional pack (areas SVC and EGV) |

### 3.2 Out of scope

| Item | Basis |
|---|---|
| Tender, auction and bid management (75 catalog features) | Decision D-02 (2026-11-18). RFQ, contracts, scheme payouts and group buying stay in scope. KTDA OFR-002 "receive buyer bids" conflicts with this exclusion (decision K-01). |
| Project services: training, support and maintenance, hosting provision, hardware (Malawi Post Lot 2), marketing campaigns run by the vendor, reports and documents delivered by the project | Compliance sheets, status "Project service"; decision ORG-SVC |
| India-specific rails and regulations from the catalog (UPI, Aadhaar, PAN, GST, DLT, DBT, PMFBY, GeM, CSC, DPDP) | Project instruction; catalog finding FCAT-11 |
| Ethiopia-specific rails from Post Gebeya (Telebirr, EthSwitch) | Blueprint coverage: Not carried |

The 75 excluded catalog features are listed in Appendix D (by module) and individually in the workbook sheet "Catalog coverage".

### 3.3 Conditional scope — not ready for Sprint Planning until decided

Some features wait for an open decision. Such a feature shows "On hold: <decision ID>" in Appendix A and in its chapter, and a developer does not start it until the decision is recorded. A feature that depends on a feature on hold is on hold for the same decision. Other decisions do not stop a feature but must be decided, or their Proposed default accepted by the Product Owner, before the affected story enters Sprint Planning; chapters show them as "Readiness conditions". 100 features are on hold at this version. The decisions, the hold list and the readiness conditions are in the Decisions, gaps and open items register; Appendix B gives a one-line meaning of each ID.


<!-- HOLDS-BEGIN: machine-readable hold tables (shown in the Decisions, gaps and open items register, not in the Product PRD) -->

These features are in scope, and most are P1, but each is held by an open decision. A developer does not start them until the decision is recorded. Appendix A shows the holding decision per feature (column "Held by").

**Hold rule (round 5, PO-F-014).** An open decision holds a feature when it decides (a) whether the feature is in scope or in P1, (b) the build approach or the product the feature is built on, (c) the external counterpart without which the feature cannot be built (a bank, gateway, regulator position or hosting constraint), or (d) client content that the feature's criteria need. A hold propagates (PO-F-007): a feature that depends on a held feature in the workbook "Depends on" column — which includes every override provider depending on its override host (§6.3) — is held by the same decision. Decisions that set a parameter or a Proposed design inside an otherwise specified feature do not hold it; they are readiness conditions (table 2).

**Table 1 — holds**

| Decision | Features held | Of which held through a dependency (feature → held feature it depends on) | Type | Owner | If not confirmed |
|---|---|---|---|---|---|
| FG-06 | LOG-011, LOG-022, LOG-023, LOG-024, LOG-032, TRK-003, EGV-001, EGV-002, EGV-003, EGV-004, EGV-005, EGV-006, EGV-007, RPT-012, FIN-005, PAY-009, SRC-020, CAT-027, CHN-010, SVC-003, SVC-004, SVC-012 | CHN-010 → TRK-003, SVC-003 → CAT-027, SVC-004 → CAT-027, SVC-012 → CAT-027 | a — scope | Malawi Post | Not stated in source — requires confirmation |
| PH-INF | IAM-022, IAM-023, CAT-039, CAT-041, CAT-042, CHK-015, CHK-016, CHK-017, CHK-018, PAY-025, PAY-034, ORD-025, ORD-026, CAT-040, IAM-027, PAY-026, PAY-027, SEL-025 | CAT-040 → IAM-022, IAM-027 → IAM-022, PAY-026 → PAY-025, PAY-027 → PAY-025, SEL-025 → PAY-025 | a — scope | Product Owner / KTDA / Malawi Post | Move to P2 (decision text) |
| M-19 | CHN-001 | — | a — scope | Malawi Post | Not stated in source — requires confirmation |
| K-01 | ORD-014 | — | a — scope | User / KTDA | Not stated in source — requires confirmation |
| WF-ENG | ADM-002, ADM-006, CAT-022, CAT-043, CHK-004, CHK-018, CRM-004, EGV-002, EGV-007, MKT-008, ORD-015, ORD-018, ORD-024, PAY-036, PLT-004, RET-007, RET-008, RET-011, SEL-003, SEL-005, SEL-017, SRC-016 | ADM-006 → ADM-002, CAT-022 → ADM-002, CAT-043 → ADM-002, CHK-004 → ADM-002, CHK-018 → ADM-002, CRM-004 → ADM-002, EGV-002 → ADM-002, EGV-007 → ADM-002, MKT-008 → ADM-002, ORD-015 → ADM-002, ORD-018 → ADM-002, ORD-024 → ADM-002, PAY-036 → ADM-002, PLT-004 → ADM-002, RET-007 → ADM-002, RET-008 → ADM-002, RET-011 → ADM-002, SEL-003 → ADM-002, SEL-005 → ADM-002, SEL-017 → ADM-002, SRC-016 → ADM-002 | b — build approach | Architecture | Specification of every ADM-002 dependant waits (decision text) |
| PO-REC-v8 | SVC-003, SVC-004, SVC-007, SVC-010, SVC-012, PAY-035, PAY-036, SEL-025, SVC-001, SVC-006, SVC-009 | — | a — scope | Product Owner | Not stated in source — requires confirmation |
| PAY-DIRECT / LIC-01 | PAY-007, PAY-009, PAY-010, PAY-035, PAY-036, SEL-025, CHK-004, SEL-017 | CHK-004 → PAY-010, SEL-017 → PAY-010 | a — scope | Product Owner / legal | Not stated in source — requires confirmation |
| E-INV | PAY-025, PAY-026, PAY-027, SEL-025 | SEL-025 → PAY-025 | a — scope | KTDA / Malawi Post | PAY-026/027 not needed; PAY-025 to P2 (decision text) |
| K-08 | PAY-003 | — | c — counterpart | KTDA | Not stated in source — requires confirmation |
| C-FX | PAY-023 | — | c — counterpart | KTDA | Not stated in source — requires confirmation |
| T-MISS | FIN-005, RET-003, CRM-004, EGV-001, EGV-002, EGV-003, EGV-004, EGV-005, EGV-006, EGV-007 | — | d — client content | Malawi Post (content) | Not stated in source — requires confirmation |
| F-CAT-B | PLT-002 | — | b — build approach | Architecture | Not stated in source — requires confirmation |
| API-01 | CAT-011, INT-001 | — | b — build approach | Tech lead | Not stated in source — requires confirmation |
| UOM-01 | CAT-041 | — | b — build approach | KTDA / Product Owner | CAT-041 sells in integer base units (custom plugin) (decision text) |
| WAL-01 | PAY-009 | — | b — build approach | Malawi Post / Product Owner | Not stated in source — requires confirmation |
| PAID-STUB | CAT-011, CAT-034, INV-012, SRC-014, SRC-024, PAY-033, LOG-018, LOG-032, RPT-002, RPT-008, INT-001, INT-005, CHN-001, CHK-016, SEL-025, RPT-010, RPT-011, RPT-012 | CHK-016 → PAY-033, SEL-025 → PAY-033, RPT-010 → RPT-002, RPT-011 → RPT-002, RPT-012 → RPT-002 | b — build approach | Tech lead / Product Owner | Not stated in source — requires confirmation |
| DP-01 | SEC-006, SEC-014 | SEC-014 → SEC-006 | c — counterpart | KTDA / Malawi Post | Not stated in source — requires confirmation |
| C-SIZE | PLT-026 | — | c — counterpart | Malawi Post | Not stated in source — requires confirmation |
| CALLOFF-PLACE | ORD-022 | — | b — build approach | Tech lead | Not stated in source — requires confirmation |
| API-GW | INT-002, INT-001, CAT-011 | CAT-011 → INT-001 | b — build approach | Tech lead | Not stated in source — requires confirmation |
| DOC-LIB | DOC-001, PAY-025, DOC-006, ORD-009, ORD-016, ORD-017, ORD-020, ORD-022, ORD-025, PAY-026, PAY-027, SEL-025 | DOC-006 → DOC-001, ORD-009 → DOC-001, ORD-016 → DOC-001, ORD-017 → DOC-001, ORD-020 → DOC-001, ORD-022 → DOC-001, ORD-025 → DOC-001, PAY-026 → DOC-001, PAY-027 → DOC-001, SEL-025 → DOC-001 | b — build approach | Tech lead | Not stated in source — requires confirmation |
| KG-04 | PAY-031 | — | c — counterpart | KTDA | Not stated in source — requires confirmation |
| MG-03 | PAY-032 | — | c — counterpart | Malawi Post | Not stated in source — requires confirmation |
| MG-09 | INT-013 | — | c — counterpart | Malawi Post | Not stated in source — requires confirmation |

**Table 2 — readiness conditions that do not hold a feature.** A story of a feature listed here enters Sprint Planning only when the decision is recorded, or when the Product Owner explicitly accepts the Proposed design or default stated in the L2 chapter (§11.3 rule 5). Features are those whose L2 stories, criteria, rules or open items cite the decision (generated), plus the owning feature named in the decision log.

| Decision | Kind | Features affected | Owner (decision log) |
|---|---|---|---|
| OVR-REG | Proposed architecture / product design | ADM-001, ADM-005, AI-002, CAT-002, CAT-013, CAT-022, CAT-037, CAT-039, CAT-042, CHK-003, CHK-005, CHK-019, CHN-003, CHN-005, DOC-001, EGV-001, EGV-004, FIN-004, INT-001, INT-011, INT-012, INV-004, INV-009, INV-011, LOG-007, LOG-009, LOG-021, MKT-001, MKT-002, MKT-005, MKT-006, MKT-010, MKT-012, ORD-009, ORD-010, PAY-001, PAY-006, PAY-009, PAY-011, PAY-013, PAY-015, PAY-018, PAY-025, PLT-004, RET-002, SEC-004, SEL-007, SEL-013, SRC-003, SRC-005, SRC-009, SVC-001, SVC-004, SVC-008, TRK-005 | tech lead / Product Owner |
| SINGLE-FILTER | Proposed architecture / product design | ADM-001, ADM-008, CHK-013, CHK-015, CHN-006, CHN-010, CRM-001, CRM-015, DOC-005, EGV-002, LOG-012, LOG-013, ORD-012, RET-001, RPT-011, SEL-002, TRK-003 | tech lead |
| ONE-RECORD | Proposed architecture / product design | AI-005, CHK-002, CHK-009, CRM-003, EGV-007, FIN-001, IAM-016, MKT-008, SEL-004, SEL-006 | Product Owner |
| MSG-ROUTE | Proposed architecture / product design | AI-003, CHK-019, CHN-005, CHN-006, CHN-012, CHN-013, CRM-001, CRM-002, EGV-002, MKT-005, ORD-002, ORD-017, SEL-020, SVC-005, TRK-005, TRK-006 | Product Owner; client choice |
| FIELD-APP | Proposed architecture / product design | CHN-010, TRK-003 | Product Owner |
| INV-HOLD | Proposed architecture / product design | INV-004, PAY-004, PAY-011 | Product Owner to confirm |
| ANL-002-OWN | Proposed architecture / product design | INV-013, RPT-001 | Product Owner |
| CFG-01 | Proposed architecture / product design | AI-002, CHN-006, CHN-007, CHN-011, CRM-002, FIN-001, INT-002, INV-012, PAY-024, PLT-001, PLT-003, PLT-005, PLT-008, RPT-003, RPT-008, SEC-001, SEC-004 | Product Owner |
| SPLIT-PAY | Proposed architecture / product design | CAT-042, CHK-004, PAY-011 | Product Owner / tech lead |
| SINGLE-NODE | Proposed architecture / product design | — | Product Owner / tech lead |
| RURAL-SRC | Open parameter / client decision | LOG-004 | Product Owner / Malawi Post |
| ORDER-MAIL | Open parameter / client decision | TRK-005 | Product Owner / client |
| CUTOFF | Open parameter / client decision | ORD-011 | Malawi Post |
| SIGN-SVC | Open parameter / client decision | ORD-017 | tech lead / Product Owner |
| OTP-OPTOUT | Open parameter / client decision | TRK-006 | Product Owner |
| GA-EVENTS | Open parameter / client decision | SEC-007 | Product Owner |
| GC-CONC | Open parameter / client decision | MKT-004 | Product Owner / tech lead |
| AGENT-XOUTLET | Open parameter / client decision | IAM-026 | Product Owner / Malawi Post |
| OPTOUT-SCOPE | Open parameter / client decision | MKT-005 | Product Owner |
| PAYEX-ADM | Open parameter / client decision | PAY-019 | Product Owner |
| HOLD-BILL | Open parameter / client decision | LOG-017 | Malawi Post |
| ORD-UNAVAIL | Open parameter / client decision | ORD-006 | tech lead |
| FEE-CTRL | Open parameter / client decision | PAY-015, PAY-001 | Product Owner |
| CART-FAILCLOSE | Open parameter / client decision | CHK-003 | Product Owner |
| PACK-FMT | Open parameter / client decision | PLT-003, PLT-001 | tech lead |
| DEP-BAL | Open parameter / client decision | SVC-004 | Product Owner |
| ORD-INTERV | Open parameter / client decision | ORD-003 | Product Owner |
| K-SELLER | Open parameter / client decision | SEL-001, SEL-003 | KTDA |
| C-SELLER | Open parameter / client decision | SEL-001, SEL-003, ORD-005, SEL-002, SEL-004, SEL-005, SEL-006, SEL-007, SEL-008, SEL-009, SEL-010, SEL-011, SEL-012, SEL-016, SEL-017, SEL-018, SEL-019, SEL-020, SEL-021, SEL-022, SEL-023, SEL-024, SEL-025 | Malawi Post |
| KTDA-ADP | Open parameter / client decision | INT-005, INT-008 | Product Owner |
| KG-03 | Open parameter / client decision | INT-005 (KTDA ERP criteria), INT-001, INT-005, INV-006, INV-012 | KTDA |
| COMP-R5 | Open parameter / client decision | — (requirement statuses) | Product Owner to ratify |


<!-- HOLDS-END -->

## 4. Clients and requirement baseline

The client requirement baseline (95 KTDA and 411 Malawi Post requirements), the compliance status of each requirement and the client differences are in the Compliance and traceability report. This document specifies the product that delivers them.

## 5. Users, roles and channels

### 5.1 Channels

| Channel | Features |
|---|---|
| B2B + B2C | 233 |
| Platform / back-office | 111 |
| Seller / back-office | 38 |
| B2B | 34 |
| G2C / G2B | 12 |
| B2C | 6 |
| Total | 434 |

### 5.2 Who the features serve

The roles below are taken from the "Who benefits" column of the Product Backlog (count = number of features naming the role). They are beneficiary groups, not defined personas.

| Beneficiary group | Features naming it |
|---|---|
| Shoppers | 159 |
| Clients | 48 |
| Sellers | 47 |
| Business buyers | 40 |
| Finance staff | 34 |
| Marketing staff | 17 |
| Client staff | 15 |
| Platform team | 15 |
| Support staff | 15 |
| Auditors | 13 |
| Catalogue staff | 13 |
| Client administrators | 12 |
| Logistics staff | 12 |
| Malawi Post | 12 |
| Management | 12 |
| Service providers | 11 |
| Compliance staff | 8 |
| International buyers | 8 |
| Regulators | 8 |
| All users | 7 |
| Government agencies | 6 |
| IT teams | 6 |
| Sales staff | 6 |
| Stock staff | 6 |
| Warehouse staff | 6 |
| Citizens | 5 |
| Export staff | 5 |
| Couriers | 4 |
| KTDA logistics | 4 |
| Outlet staff | 4 |
| Walk-in customers | 4 |
| Analysts | 3 |
| Content staff | 3 |
| Fraud staff | 3 |
| IT | 3 |
| Malawi Post operations | 3 |
| New clients | 3 |
| Operations staff | 3 |
| Partners | 3 |
| Programme staff | 3 |
| Staff | 3 |
| Support managers | 3 |
| Agents | 2 |
| Approvers | 2 |
| Catalogue managers | 2 |
| Client operations staff | 2 |
| Customers | 2 |
| Farmers | 2 |
| International shoppers | 2 |
| Legal and sales staff | 2 |
| Legal staff | 2 |
| Malawi Post finance | 2 |
| Operations managers | 2 |
| Quality staff | 2 |
| Security team | 2 |
| Shoppers in low-connectivity areas | 2 |
| Shoppers on basic phones | 2 |
| Stock planners | 2 |
| Affiliates | 1 |
| All clients | 1 |
| Applicants | 1 |
| Beneficiaries | 1 |
| Catalogue and marketing staff | 1 |
| Client management | 1 |
| Client managers | 1 |
| Client sales staff | 1 |
| Clients' customers | 1 |
| Content and legal staff | 1 |
| Field agents | 1 |
| Finance and fraud staff | 1 |
| Finance and legal staff | 1 |
| Fraud and compliance staff | 1 |
| Fraud and security staff | 1 |
| Funders | 1 |
| Guest shoppers | 1 |
| KTDA | 1 |
| KTDA export staff | 1 |
| KTDA finance | 1 |
| KTDA shoppers | 1 |
| KTDA staff | 1 |
| Kenyan shoppers | 1 |
| Logistics managers | 1 |
| Malawi Post couriers | 1 |
| Malawi Post customers | 1 |
| Malawi Post field staff | 1 |
| Malawi Post shoppers | 1 |
| Malawian shoppers | 1 |
| New users | 1 |
| Operations | 1 |
| Outlet agents | 1 |
| Post-office staff | 1 |
| Procurement staff | 1 |
| Programme and compliance staff | 1 |
| Programme funders | 1 |
| Sales and logistics staff | 1 |
| Security and fraud staff | 1 |
| Shoppers and staff with disabilities | 1 |
| Shoppers with disabilities | 1 |
| Small businesses | 1 |
| Small buyers | 1 |
| Suppliers | 1 |
| Support and client staff | 1 |
| Tax authorities | 1 |
| The public | 1 |
| Translators | 1 |
| Warehouse and outlet staff | 1 |

**Gap.** The catalog names 9 personas and 6 verticals without defining them (FCAT-01 / F-01), and neither client source defines personas. KTDA's organisational structure and roles are not described (G-ORG, REQ-KTDA-PRJ-001 partially compliant). Persona definitions are not stated in source — requires confirmation. The permission model (roles, scoped permissions, delegation) is specified in the IAM module PRD (PRD-IAM-007, IAM-008, IAM-009).


## 6. Solution architecture on nopCommerce 5.00

### 6.1 Platform baseline (verified against release-5.00.1)

Source paths are relative to `src/` of the nopCommerce release-5.00.1 tag; "repository root" marks a file outside `src/`. Decision VER-500 (approved 2026-11-24) moved the target from 4.90 (release-4.90.8) to 5.00.1; every 4.90.8 path cited below was re-checked in 5.00.1 (mechanism check of 2,336 identifiers: 143 changed, 34 removed; the changes the product relies on are listed in this section and in §6.3).

| Fact | Consequence for the build | Evidence (source path) |
|---|---|---|
| nopCommerce 5.00.1 (version constants 5.00 and 1) is a .NET 10 application (target framework net10.0; SDK 10.0.401 pinned) with a plugin architecture (BasePlugin/IPlugin, plugin.json, widget zones, admin plugin manager); data providers for SQL Server, MySQL and PostgreSQL; distributed cache (memory, SQL Server, Redis, Redis-synchronized memory; disabled by default — DistributedCacheConfig.Enabled = false). Migrations use FluentMigrator 8.0.1 with one runner package per database provider. | New capability is delivered as plugins; core changes are the exception and are registered (§6.3). | Libraries/Nop.Core/NopVersion.cs:11,16; Directory.Build.props:3 (net10.0); global.json (repository root; sdk 10.0.401); Libraries/Nop.Services/Plugins/BasePlugin.cs; Libraries/Nop.Services/Plugins/PluginDescriptor.cs; Libraries/Nop.Data/DataProviderType.cs; Libraries/Nop.Core/Configuration/DistributedCacheType.cs; Libraries/Nop.Core/Configuration/DistributedCacheConfig.cs:15,20; Libraries/Nop.Data/Nop.Data.csproj:15-18 (FluentMigrator 8.0.1) |
| Hosting requirements as the 5.00.1 source states them: "nopCommerce runs on .NET 10 with an MS SQL 2012 (or higher) backend database" and "supports PostgreSQL and MySQL databases" (no minimum version stated for either). The MySQL provider uses the linq2db MySQL 8.0 dialect and tolerates one unknown system variable on servers older than 8.0. | Each installation needs the .NET 10 runtime. SQL Server 2012 or higher is the stated minimum; a minimum MySQL or PostgreSQL version is Not stated in source — requires confirmation (Inference: MySQL 8.0 or later, from the dialect the provider selects). Whether .NET 10 runs on Windows Server 2019 (Malawi Post REQ-MPC-ARC-004) is not stated in the nopCommerce source — requires confirmation against the Microsoft .NET 10 support matrix (open item HOST-500). | README.md:13,16 (repository root); Libraries/Nop.Data/DataProviders/MySqlDataProvider.cs:193,356 |
| One installation has one database connection; settings carry a StoreId. | Client isolation is achieved by one installation per client (PRD-PLT-002). Shared multi-store across clients is open (F-CAT-B; §6.4). | Libraries/Nop.Data/Configuration/DataConfig.cs (single ConnectionString); Libraries/Nop.Core/Domain/Configuration/Setting.cs (StoreId) |
| 5.00 removed the synchronous service APIs ("All methods in nopCommerce are async"): IRepository has no synchronous Insert/Update/Delete/GetById/GetAll; the synchronous members of ISettingService, ILocalizationService, ILogger, IEventPublisher (Publish), IStoreContext (GetCurrentStore), IStoreMappingService (Authorize, GetStoresIdsWithAccess) and IGeoLookupService are gone. IWebHelper moved to Nop.Services.Helpers, IThemeContext to Nop.Services.Themes; the AutoMapper configuration was replaced by an own mapper configuration; the admin file manager RoxyFileman was replaced by elFinder. | Product plugins and ported 4.70 / 4.90 plugin code call only the async members (principle 10). The SEC-004 IRepository<> decorator and the PLT-004 ISettingService override implement only the async members. | README.md:18 (repository root); Libraries/Nop.Data/IRepository.cs:26-165; Libraries/Nop.Services/Configuration/ISettingService.cs; Libraries/Nop.Services/Localization/ILocalizationService.cs; Libraries/Nop.Services/Logging/ILogger.cs; Libraries/Nop.Core/Events/IEventPublisher.cs; Libraries/Nop.Core/IStoreContext.cs; Libraries/Nop.Services/Stores/IStoreMappingService.cs; Libraries/Nop.Services/Directory/IGeoLookupService.cs; Libraries/Nop.Services/Helpers/IWebHelper.cs; Libraries/Nop.Services/Themes/IThemeContext.cs; Libraries/Nop.Core/Infrastructure/Mapper/MapperConfiguration.cs; Presentation/Nop.Web/Areas/Admin/Controllers/ElFinderController.cs |
| Search.Lucene, Misc.WebApi.Frontend, Misc.PowerBI, Misc.Dynamics365 and Misc.NopMobileApp contain only a plugin class, an admin-menu consumer and a Configure view linking to a paid plugin. The stub plugin.json (SupportedVersions 5.00) confirms only that nopCommerce markets the paid plugin for 5.00. The Search.Lucene stub implements IMiscPlugin, not ISearchProvider: it cannot be selected as the search provider. | These are not working features. Each is licensed or built (decision PAID-STUB); the 5.00 build, licence and scope of each paid plugin are V-01 items. Only a storefront Web API stub exists; the back-office API product is decision API-01. | Plugins/Nop.Plugin.{Search.Lucene, Misc.WebApi.Frontend, Misc.PowerBI, Misc.Dynamics365, Misc.NopMobileApp}/Views/Configure.cshtml and plugin.json; Plugins/Nop.Plugin.Search.Lucene/LuceneSearchProvider.cs:10 |
| Misc.RFQ is a working plugin (new since 4.70.5): request, quote, expiry and conversion to order, between buyer and store owner only (no vendor reference). Expiry is applied lazily when a quote is read; there is no expiry task or expiry notification. 5.00 adds RfqSettings (Enabled, captcha on the request page, customer quote PDF). | Base for PRD-ORD-012 and ORD-013; seller-to-buyer quoting, expiry alerts and notifications are a build. | Plugins/Nop.Plugin.Misc.RFQ/Domains/QuoteStatus.cs; Plugins/Nop.Plugin.Misc.RFQ/Services/RfqService.cs:272 (CheckIsQuoteExpiredAsync); Plugins/Nop.Plugin.Misc.RFQ/RfqSettings.cs:13-23 |
| New compared with 4.70.5 (introduced in 4.80 or 4.90, present in 5.00.1): vendor discounts, product bulk edit, view/edit permission split, Google and DeepL pre-translation, AI product descriptions and SEO text, vendor low-stock emails, multiple wishlists, customer self-cancel, native menus. | Reduces build for MKT-014, CAT-017, SRC-010 and related features. | Libraries/Nop.Core/Domain/Discounts/Discount.cs:98 (VendorId); Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs (BulkEdit); Libraries/Nop.Services/Security/StandardPermission.cs; Libraries/Nop.Core/Domain/Translation/TranslationServiceType.cs; Libraries/Nop.Core/Domain/ArtificialIntelligence/ArtificialIntelligenceSettings.cs; Libraries/Nop.Core/Domain/Messages/MessageTemplateSystemNames.cs; Libraries/Nop.Core/Domain/Orders/CustomWishlist.cs; Libraries/Nop.Core/Domain/Orders/OrderSettings.cs; Libraries/Nop.Core/Domain/Menus/ |
| New in 5.00 — native price lists: PriceList, PriceListItem (with ManualPrice), PriceListCustomer, PriceListCustomerRole, IPriceListService, strategy CatalogSettings.PriceListStrategy (MinimalPrice / UseByPriority), admin price lists with Excel import/export, permissions Catalog.PriceListsView / PriceListsCreateEditDelete / PriceListsImportExport. GetFinalPriceAsync applies the price-list price first; a tier price found afterwards replaces it. PriceList has no currency field. | Decision PRICE-500: CAT-039 and CAT-042 use native price lists; per-currency fixed prices remain a build; a configuration rule is needed where a price list and a tier price both apply (§6.5). CAT-042 overrides must not apply price lists a second time. | Libraries/Nop.Core/Domain/PriceLists/; Libraries/Nop.Services/PriceLists/IPriceListService.cs; Libraries/Nop.Services/Catalog/PriceCalculationService.cs:77-140,454-462; Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:20; Libraries/Nop.Services/Security/StandardPermission.cs:76-78; Presentation/Nop.Web/Areas/Admin/Controllers/PriceListController.cs:489 |
| New in 5.00 — separate cart per vendor: ShoppingCartSettings.VendorEnabled / VendorRequired, IShoppingCartService.SetShoppingCartVendorAsync, storefront CustomerCart / ChangeVendorCart. With VendorEnabled on, the cart page shows one chosen vendor's items; with both settings on and more than one vendor in the cart, checkout is blocked with the warning ShoppingCart.SelectVendorToCheckout until one vendor is chosen. It does not split one checkout into sub-orders. | Decision CART-500: the product keeps one cart whose order and payment are split across sellers (CHK-004, SPLIT-PAY); the native per-vendor cart setting stays off (configuration rule, §6.5). | Libraries/Nop.Core/Domain/Orders/ShoppingCartSettings.cs:131,136; Libraries/Nop.Services/Orders/IShoppingCartService.cs:351; Libraries/Nop.Services/Orders/ShoppingCartService.cs:1220-1226; Presentation/Nop.Web/Controllers/ShoppingCartController.cs:1260,1276 |
| New in 5.00 — phone login with one-time codes (OtpSettings.LoginByPhoneEnabled, OtpTimeLife, OtpLength; ICustomerRegistrationService.ValidateCustomerByPhoneAsync) and SMS provider plugins (ISmsProvider; active provider MessagesSettings.ActiveSmsProviderSystemName; permission Configuration.ManageSmsSettings). The only bundled SMS provider is Sms.Twilio. ISmsService is used only by the storefront customer (one-time code) flow. | IAM-002, IAM-006 and CHN-005 build on it; a local SMS aggregator is a new ISmsProvider plugin; message-template SMS and inbound SMS remain builds. Twilio is not assumed: its coverage in Kenya and Malawi and its data protection are open (SMS-COV-500, DP-EXT-500). | Libraries/Nop.Core/Domain/Customers/OtpSettings.cs:13-39; Libraries/Nop.Services/Customers/ICustomerRegistrationService.cs:30; Libraries/Nop.Services/Messages/ISmsProvider.cs:8; Libraries/Nop.Services/Messages/ISmsService.cs:3; Libraries/Nop.Core/Domain/Messages/MessagesSettings.cs:25; Libraries/Nop.Services/Security/StandardPermission.cs:123; Plugins/Nop.Plugin.Sms.Twilio/TwilioProvider.cs:13 |
| New in 5.00 — AI recommendation / search provider type: ProductService.SearchProductsAsync first calls the active IAiRecommendationPlugin (ArtificialIntelligenceSettings.ActiveAIRecommendationProviderSystemName; standard search only if UseStandardSearchWhenNoResults), then the ISearchProvider (fallback CatalogSettings.UseStandardSearchWhenNoResults, which replaces UseStandardSearchWhenSearchProviderThrowsException). The bundled provider is AIRecommendation.GoogleAI (Google AI Commerce Search, an external service). | Search providers (IC-SRC-02, IC-CAT-04) account for the AI path returning early. Google AI Commerce Search is an external service: data protection and cost are open (DP-EXT-500). | Libraries/Nop.Services/ArtificialIntelligence/IAiRecommendationPlugin.cs:9; Libraries/Nop.Services/Catalog/ProductService.cs:899-951; Libraries/Nop.Core/Domain/ArtificialIntelligence/ArtificialIntelligenceSettings.cs:88,93; Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:612,617; Plugins/Nop.Plugin.AIRecommendation.GoogleAI/GoogleAiPlugin.cs:17 |
| New in 5.00 — reminders and automatic cancellation: abandoned-cart, pending-order and incomplete-registration e-mail follow-ups (ReminderSettings, IReminderService, three scheduled tasks, permission Promotions.ManageReminders); automatic cancellation of unpaid orders (OrderSettings.AutoCancelEnabled, AutoCancelDelay, AutoCancelIgnoredPaymentMethods, AutoCancelRestoreShoppingCart, AutoCancelIgnoreBeforeUtc; AutoCancelOrdersTask); next-recurring-payment customer notification (OrderSettings.NextRecurringPaymentNotificationDays). | E-mail follow-ups and unpaid-order cancellation are native; SMS / WhatsApp follow-ups and seller-deadline cancellation remain builds. TRK-005 routes or explicitly leaves native the five new message senders. Installation defaults: all three reminder types on, automatic cancellation off; each client pack sets them explicitly (they overlap the INV-004 unpaid-order handling). | Libraries/Nop.Core/Domain/Reminders/ReminderSettings.cs; Libraries/Nop.Services/Reminders/; Libraries/Nop.Services/Installation/InstallRequiredData.cs:1895,2204-2210 (defaults); Libraries/Nop.Services/Security/StandardPermission.cs:96; Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:184-209; Libraries/Nop.Services/Orders/AutoCancelOrdersTask.cs; Libraries/Nop.Services/Messages/IWorkflowMessageService.cs:379,490,801,813,826 |
| Return-request settings moved from OrderSettings to ReturnRequestSettings (keys returnrequestsettings.*): ReturnRequestsEnabled, ReturnRequestsAllowFiles, ReturnRequestsFileMaximumSize, ReturnRequestNumberMask, NumberOfDaysReturnRequestAvailable; new: GuestReturnRequestsAllowed, ReturnReasonsEnabled, ReturnActionsEnabled, ReturnRequestsForCompletedOrdersOnly, DownloadableProductsReturnRequestsAllowed, UseEuWithdrawalLocales, WithdrawalLinkDaysValid. Guest and EU-withdrawal flows (token links) are native. | Packs and RET / ADM / SEC rules use the returnrequestsettings.* keys. EU withdrawal wording and the EU product-safety settings (GpsrSettings) are EU-specific: not applicable to Kenya or Malawi unless a client source requires them (open item EU-500). | Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:13-68; Presentation/Nop.Web/Controllers/ReturnRequestController.cs:179,209,322; Libraries/Nop.Core/Domain/Catalog/GpsrSettings.cs |
| Order-number zero-padding code is commented out. | PRD-ORD-007 needs an override. | Libraries/Nop.Services/Orders/CustomNumberFormatter.cs:85-98 |
| Recurring payments of Manual-type payment methods are processed only by admin "Process next payment" or customer retry; no scheduled task charges them (the core scheduled tasks in 5.00.1 are exchange rates, three reminder tasks, auto-cancel, guest deletion, queued e-mail, keep-alive, licence check, inactive-customer deletion, cache and log; bundled plugins add Brevo and Zettle synchronisation, the ChatGPT Shopping feed and the Avalara tax-rate download). Automatic-type methods charge on the gateway side; bundled PayPal Commerce is Manual. 5.00 sends a next-payment notification and no longer passes stored card data. | PRD-ORD-028 includes a scheduled task for Manual-type adapters. | Libraries/Nop.Services/Payments/RecurringPaymentType.cs; Libraries/Nop.Services/Orders/OrderProcessingService.cs:1557-1567,1891; Libraries/Nop.Services/**/*Task.cs (implementations of IScheduleTask); Plugins/Nop.Plugin.Payments.PayPalCommerce/PayPalCommercePaymentMethod.cs:568; Presentation/Nop.Web/Areas/Admin/Controllers/RecurringPaymentController.cs |
| 5.00 removed the bundled Payments.Manual plugin and card storage: ProcessPaymentResult.AllowStoringCreditCardNumber is gone; the card fields of Order are [Obsolete] ("not used since 5.00", to be removed in 5.10); the admin action OrderController.EditCreditCardInfo is gone. | The platform stores no card data (NFR-X-001 card part is native). Evidence that cited Payments.Manual cites RecurringPaymentType.cs and the PayPal Commerce method instead. | Libraries/Nop.Core/Domain/Orders/Order.cs:313-384; Libraries/Nop.Services/Payments/ProcessPaymentResult.cs; src/Plugins (no Nop.Plugin.Payments.Manual) |
| The permission model introduced in 4.90 is unchanged in 5.00: IPermissionProvider / StandardPermissionProvider are gone; permissions are defined through IPermissionConfigManager and string system names (for example Catalog.ProductsView); admin actions use [CheckPermission]. PermissionRecord still exists. 5.00 moved news, polls and forums into bundled plugins (Misc.News, Misc.Polls, Misc.Forums) with their own permission names (News.View / News.Manage, Polls.View / Polls.Manage, Forums.View / Forums.Manage); the ContentManagement.News*, Polls* and Forums* names are gone. The ForumModerators role is created by Misc.Forums. Private messages moved to core customers (PrivateMessage, PrivateMessageSettings). | Packs and ported plugins use 5.00 permission names; 4.70 names grant nothing, silently. The IAM role catalogue and the MKT permission table use the plugin names, and these plugins are installed only where the feature is used (open item PLG-500). | Libraries/Nop.Services/Security/IPermissionConfigManager.cs; Libraries/Nop.Services/Security/StandardPermission.cs; Presentation/Nop.Web.Framework/Mvc/Filters/CheckPermissionAttribute.cs; Plugins/Nop.Plugin.Misc.News/NewsDefaults.cs:139-140; Plugins/Nop.Plugin.Misc.Polls/PollsDefaults.cs:58-59; Plugins/Nop.Plugin.Misc.Forums/ForumDefaults.cs:23,282-283; Libraries/Nop.Core/Domain/Customers/PrivateMessage.cs; Libraries/Nop.Core/Domain/Customers/PrivateMessageSettings.cs |
| Post Gebeya third-party plugins (NopStation, Nop-Templates, FoxNetSoft) and AFR extensions were built for 4.70.5. | Ports must at least retarget to net10.0, replace IPermissionProvider with IPermissionConfigManager and 5.00 permission names, recompile against FluentMigrator 8.0.1, set plugin.json SupportedVersions to 5.00, and replace every removed synchronous API call with its async member. Whether each vendor publishes a 5.00 build is not verifiable from source (V-01; open item VENDOR-500). AFR source availability is open (FG-05, V-01). | Directory.Build.props:3; Libraries/Nop.Data/Nop.Data.csproj:15-18 (FluentMigrator 8.0.1); Plugins/Nop.Plugin.Search.Lucene/plugin.json:6 (SupportedVersions 5.00); 4.70.5: Libraries/Nop.Services/Security/IPermissionProvider.cs (absent in 4.90.8 and 5.00.1) |
| Other 5.00 additions, adopted only where a client source or the fit requires them: customer-chosen delivery date (date only, no time slots); contact-form attributes; search-term history per customer; product 3D objects; report exports in IExportManager; bundled Feed.ChatGptShopping, Widgets.Jotform (AI agent chatbot, external service) and Misc.PunchOut (cXML punch-out). | Each is used only where the 5.00 fit names it; external services (Jotform, ChatGPT Shopping) are options, not client requirements. New upload actions (3D object, price-list Excel import, elFinder connector) are named in the ADM-008 single upload filter list (UPL-500). | Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:126,131; Libraries/Nop.Core/Domain/Common/ContactFormAttribute.cs; Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:251; Libraries/Nop.Core/Domain/Catalog/Product3dObject.cs; Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:4256; Libraries/Nop.Services/ExportImport/IExportManager.cs; Plugins/Nop.Plugin.Feed.ChatGptShopping/; Plugins/Nop.Plugin.Widgets.Jotform/plugin.json; Plugins/Nop.Plugin.Misc.PunchOut/plugin.json |


### 6.2 Architecture principles

1. **Plugin first.** Every product feature is a nopCommerce plugin, a theme/view override, a configuration, or an external system with an integration plugin. The "Code change type" of each feature is recorded in Appendix A and the module chapters.
2. **Core modification only when registered.** A change to nopCommerce core code is allowed only for the features in §6.3 (Definition of Done criterion 13). Core changes are kept on a product fork branch tracking the nopCommerce release tag; each change is one commit tagged with its PRD ID; schema changes are FluentMigrator migrations in a separate product assembly; the register lists the files touched. On each nopCommerce release the fork is rebased and the register-driven regression set is run.
3. **Order of preference** for any change: settings → plugin event or ModelReceivedEvent veto → DI override of a virtual service or model factory → view override → core change.
4. **Configuration over customisation.** Anything that differs between clients is a setting, configuration-pack entry, feature toggle or adapter (Definition of Done criterion 2).
5. **Adapters for country and client specifics.** Payment rails, carriers, statutory e-invoicing and client back-office systems sit behind connection frameworks (PRD-PAY-024, LOG-021, PAY-025, INT-005).
6. **Secrets never in packs.** Credentials and keys are entered per client instance, never stored in configuration packs (Inference — decision CFG-01).
7. **DI overrides are registered.** A plugin that replaces a core service or factory registers it in INopStartup with Order ≥ 3000 (core Nop.Web.Framework is 2000, Nop.Web 2002; the last registration wins; Presentation/Nop.Web.Framework/Infrastructure/NopStartup.cs:337, Presentation/Nop.Web/Infrastructure/NopStartup.cs:129, bundled example Plugins/Nop.Plugin.Misc.Brevo/Infrastructure/NopStartup.cs:44). Only one product plugin may override a given interface; overrides are listed in a DI-override register (interface, plugin, PRD ID). plugin.json DependsOnSystemNames controls install order only, not load or DI order.
8. **No critical logic in event consumers.** Logic that must not fail silently is not placed in IConsumer<T>: the event publisher logs and swallows consumer exceptions, except on AppStartedEvent (Libraries/Nop.Services/Events/EventPublisher.cs:35-51).
9. **External systems stay external.** Capabilities classed "Cannot be done in nopCommerce" (§6.7, register §6.9) are delivered by the named external system and an integration plugin; the product does not re-implement them.
10. **Async only.** Product code calls only the asynchronous nopCommerce APIs; the synchronous members removed in 5.00 (§6.1) are not re-introduced by product plugins or overrides.
11. **Native first in 5.00.** Where 5.00 added a native mechanism that the 5.00 fit adopts (price lists, per-customer search history, punch-out, AI search provider, one-time-code login, reminders, unpaid-order cancellation), the product configures it and builds only the stated remainder; superseded acceptance criteria are marked "Withdrawn (VER-500)" in the module chapter, never deleted (IDs stay stable).

### 6.3 Register of features that involve a nopCommerce core modification (6)

Nine features earlier classed as core modifications are achievable with plugin mechanisms in 4.90.8 (still so in 5.00.1) and were reclassified (NOP-911, NOP-912, NOP-914, R2-04): PLT-004, CAT-022, ORD-002 (changing the OrderStatus enum is prohibited), SVC-004 (custom plugin); CAT-042, SEC-004 (custom plugin with DI override); CHK-004 (custom plugin; since round 5 the order-splitter provider IC-CHK-11 to the core CHK-003 IOrderProcessingService host); INV-009, INV-011 (custom plugin, provider to the IProductService override through IC-CAT-04, decision OVR-REG; the override is hosted by core CAT-002 since round 6, CAT-022 being its publish-gate provider). Rows marked "conditional" become core changes only if the named decision requires it.

| PRD ID | Feature | Code change type | What changes |
|---|---|---|---|
| PRD-PLT-018 | Accessibility | Theme/view override + Core modification (admin views) | WCAG 2.1 AA audit and fixes on storefront and admin views; contrast/text-size toggle. |
| PRD-PLT-027 | Data consistency safeguards | Core modification + Custom plugin | Optimistic concurrency (row version on key tables + repository checks) and idempotency keys for state-changing requests/APIs. Row-version columns on core tables are a registered core modification; idempotency keys are plugin middleware. (NOP-922) |
| PRD-IAM-008 | Scoped permissions | Custom plugin + Core modification | Scoped permission model and data filtering in admin queries. |
| PRD-CAT-041 | Units of measure and pack selling | Custom plugin; Core modification (conditional, decision UOM-01) | Selling by unit of measure with weight-based price. If fractional quantities (for example 2.5 kg) are required: change Quantity/StockQuantity from int to decimal in ShoppingCartItem, OrderItem, ShipmentItem, Product, ProductWarehouseInventory and all services/views (core modification). If not required: sell in integer base units (for example 100 g) with BasepriceEnabled (custom plugin). (NOP-913) |
| PRD-CHK-005 | Fulfilment method per line | Core modification | Per-line fulfilment choice. Requires changes to checkout flow, shipping calculation and order model. |
| PRD-CHK-008 | Checkout resilience and idempotency | Custom plugin; Core modification (conditional) | Base in 5.00.1 (unchanged from 4.90.8): OrderGuid reuse (PaymentSettings.RegenerateOrderGuidInterval), OrderSettings.PlaceOrderWithLock, MinimumOrderPlacementInterval, RePostPayment for unpaid redirect orders. Build: pre-order reference shown before payment for non-redirect methods; core change only if the custom order number must exist before the Order insert. (NOP-914) PlaceOrderWithLock uses a host-local named Mutex; with more than one web node, cross-node duplicate protection relies on the distributed-cache marker and the PLT-027 idempotency key. (R2-03) |

**Product extension register — DI overrides, decorators, filters and other mechanisms (30 numbered entries and 3 filter registers, 33 rows).** Principle 7 and decision OVR-REG: one owning feature per overridden interface; other features plug in as providers through the contract the owner publishes. Generated from the L2 ADM chapter, rules BR-ADM-002 to BR-ADM-008 (owner of the register: ADM-001, BR-ADM-001). Round 5 (PO-F-006, D-01): the IOrderProcessingService host moved from CHK-004 (Marketplace pack) to core CHK-003, and the IShipmentService.InsertShipmentAsync host from PAY-006 (B2B trade pack) to core ORD-010; pack features are providers only. Round 6 (PO-F-024): the IProductService host moved from CAT-022 (held by WF-ENG) to core CAT-002, so search and catalogue providers no longer inherit the WF-ENG hold. Entries (1) to (30) are the numbered entries of BR-ADM-002 to 004 and 008; BR-ADM-005 to 007 are filter registers, one row each. The core-modification entries of the register (PRD-CAT-041, PRD-CHK-005, PRD-CHK-008, PRD-IAM-008, PRD-PLT-018, PRD-PLT-027) are the same features as the core-modification table above (checked by the build). A provider depends on its host in the workbook "Depends on" column, so a hold on the host propagates (§3.3).

| Rule | # | Interface / mechanism | Owning feature | Register entry (owner, providers, rules) |
|---|---|---|---|---|
| BR-ADM-002 | 1 | IOrderProcessingService | CHK-003 | owner CHK-003, the core checkout feature (PlaceOrderAsync with the placement lock and minimum-interval check once per checkout, BR-CHK-006; core host, D-01; CHK-004 is the order splitter IC-CHK-11 when the Marketplace pack is on; ShipAsync, ReadyForPickupAsync, DeliverAsync and CancelOrderAsync wrappers; BR-CHK-006, BR-CHK-021); providers: placement validators IC-CHK-02 (PAY-001 routing and PAY-018 risk through IC-PAY-03, LOG-004 serviceability and seller coverage, CHK-011 restrictions, CHK-018 approval); placement participants IC-CHK-06 (ADM-005 quota, MKT-001 limited-use discounts through IC-MKT-04, CHK-006 delivery window, CHK-016 credit, CAT-042 order-total adjustments (BR-CAT-033; the only participant for IC-CAT-06 providers, so the PAY-009 wallet under WAL-01 option (b) is reserved through it, not by a PAY participant), FIN-004 subsidy budget (BR-FIN-007), PAY-011 group payment (Confirm only, BR-PAY-014); ORD-005 seller task creation uses Confirm only (IC-ORD-09)); group payment IC-CHK-04 (PAY, IC-PAY-02); order-action guards IC-CHK-07 (ORD-010 hold, IC-ORD-02); cancellation participants IC-CHK-08 (CHK-006 window release, CHK-012 code revocation) |
| BR-ADM-002 | 2 | IShoppingCartService | CHK-003 | owner CHK-003 (GetShoppingCartWarningsAsync, GetShoppingCartItemWarningsAsync, GetRentalProductWarningsAsync, GetSubTotalAsync, and the protected virtual GetStandardWarningsAsync, reachable only inside the owner class; BR-CHK-015); in 5.00 the interface gains SetShoppingCartVendorAsync and ResetCheckoutDataAsync (moved from ICustomerService), GetShoppingCartAsync becomes two overloads (one ShoppingCartType, or a list of types) and ShoppingCartService loses IsCustomerShoppingCartEmptyAsync — the owner derives from ShoppingCartService and keeps the native members; configuration rule (decision CART-500): ShoppingCartSettings.VendorEnabled stays off, because with it on the native warning ShoppingCart.SelectVendorToCheckout blocks a mixed-vendor checkout before the CHK-004 splitter runs (Libraries/Nop.Services/Orders/ShoppingCartService.cs:1187); providers: cart check providers IC-CHK-01 (CHK-011 restrictions, ORD-027 sample limits, CAT-037 / CAT-026 / CAT-027 checks and the two registered CAT replacers of native warnings, INV-004 holds as replacer of the stock warning, SVC-008 rental availability, EGV-001 workflow check, ADM-005 eligibility and quota) and the line subtotal adjuster IC-CHK-05 (MKT-002 buy-X-get-Y, IC-MKT-01) |
| BR-ADM-002 | 3 | IPriceCalculationService and IOrderTotalCalculationService | CAT-042 | owner CAT-042 (GetShoppingCartTotalAsync and the protected UpdateTotalAsync used by admin order edits; BR-CAT-025, BR-CAT-031, BR-CAT-033); providers: CAT-039 price lists (since 5.00 native price lists applied by PriceCalculationService.GetFinalPriceAsync before tier prices, Libraries/Nop.Services/Catalog/PriceCalculationService.cs:77, 454; decision PRICE-500; the owner does not apply them a second time and the IC-CAT-05 provider is as the CAT chapter states); order-total adjustments IC-CAT-06: PAY-009 wallet deduction only under WAL-01 option (b), FIN-003 charge only if variable premiums are confirmed; any future PAY-015 or CHK-005 total change is a provider, never a second override |
| BR-ADM-002 | 4 | Nop.Web IProductModelFactory and IShoppingCartModelFactory | CAT-042 | CAT-042 (fixed prices per currency, BR-CAT-025; not named in OVR-REG, single claimant); in 5.00 the ProductModelFactory constructor and PrepareProductToWishlistModelAsync changed and GetBaseProductPriceAsync moved to IProductService |
| BR-ADM-003 | 5 | IProductService (5.00 adds GetBaseProductPriceAsync and the Product3dObject members; a class derived from ProductService is unaffected) | CAT-002 | owner CAT-002, the core product master record (CAT-022 is the publish-gate provider for Insert/Update, BR-CAT-005; CAT-003 SKU generation BR-CAT-004); providers IC-CAT-04: CAT-022 publish gate, INV-009 / INV-011 sellable-stock adjusters (GetTotalStockQuantityAsync, IC-INV-04), SRC search-filter and ordering contributors (SearchProductsAsync, IC-SRC-02, BR-SRC-012), SEL eligibility check (IC-SEL-01); decision PS-OVR is replaced by OVR-REG |
| BR-ADM-003 | 6 | IShipmentService.InsertShipmentAsync | ORD-010 | owner ORD-010 shipment-guard host (core, BR-ORD-055, D-01); guard providers IC-ORD-11: PAY letter of credit, ORD-010 order hold (IC-ORD-02), EGV-004 application Issued (BR-EGV-008); INV lot and serial capture runs before the insert on LOG paths and in the INV AddShipment filter (IC-INV-07, BR-INV-070), not as a guard provider; LOG and TRK register no shipment override (BR-LOG-003, BR-LOG-042) |
| BR-ADM-003 | 7 | IPdfService (interface unchanged in 5.00; PdfService.ResolvePdfFont was replaced by GetFontInfo) | DOC-001 | owner DOC-001 (BR-DOC-001); providers through IC-DOC-02 token providers: ORD-009 invoice, receipt, proforma, contract, letter and Incoterm fields (IC-ORD-07), PAY-025 fiscal number and QR, CAT-015 trade fields, CAT-042 order-total adjustments |
| BR-ADM-003 | 8 | IWorkflowMessageService | TRK-005 | owner TRK-005 (SendNotificationAsync, signature unchanged in 5.00, BR-TRK-020; the 5.00 reminder, recurring-payment and withdrawal senders end in it; the forum and news senders left core with the Misc.Forums and Misc.News plugins; SendContactUsMessageAsync gains customAttributes); modules send their own event codes through IC-TRK-04; the bundled Misc.Brevo (BrevoMessageService, NopStartup Order 3000) is not installed in client instances (BR-TRK-021, BR-CHN-010) |
| BR-ADM-003 | 9 | ISettingService | PLT-004 | owner PLT-004 (Insert/Update/DeleteSettingAsync capture of controlled keys, BR-PLT-020; 5.00 removed the synchronous members, so only the async members are overridden) |
| BR-ADM-003 | 10 | IReturnRequestService | RET | owner RET (GetReturnRequestAvailabilityAsync, InsertReturnRequestAsync; BR-RET-010, BR-RET-012) |
| BR-ADM-003 | 11 | ICustomNumberFormatter | ORD-007 | ORD-007 (padded order number, BR-ORD-040; not named in OVR-REG, single claimant) |
| BR-ADM-004 | 12 | ICustomerRegistrationService and IAuthenticationService | IAM | owner IAM (IAM-002 mobile identity, IAM-006 sessions; BR-IAM-011, BR-IAM-040); 5.00 adds ICustomerRegistrationService.ValidateCustomerByPhoneAsync and a native phone one-time-code login (OtpSettings), which IAM-002 uses as the IAM chapter states |
| BR-ADM-004 | 13 | IPermissionService | IAM | IAM (scopes, delegations and SEC-010 time-bound grants; BR-IAM-060, BR-SEC-050; single claimant) |
| BR-ADM-004 | 14 | IGdprService.PermanentDeleteCustomerAsync | IAM-017 | IAM-017 (erasure providers IC-IAM-08; BR-IAM-092; in 5.00 the native method no longer deletes forum or news data, which the plugins handle, and also deletes custom wishlists and private messages) |
| BR-ADM-004 | 15 | IRepository<> decorator | SEC-004 | SEC-004 (INopStartup Order greater than 10; BR-SEC-010; 5.00 removed the synchronous Insert, Update, Delete, GetById and GetAll, so the decorator implements the async members only) |
| BR-ADM-004 | 16 | IAclService.SaveAclAsync and IStoreMappingService.SaveStoreMappingsAsync | SEC-004 | SEC-004 (BR-SEC-011; unchanged in 5.00, which removed only the synchronous Authorize and GetStoresIdsWithAccess) |
| BR-ADM-004 | 17 | IWidgetPluginManager.LoadActivePluginsAsync and, since 5.00, IsPluginActiveAsync | SEC-007 | owner SEC-007 (consent categories, BR-SEC-020; IsPluginActiveAsync gates the server-side Google Analytics cart events, BR-SEC-021; MKT and AI widgets are mapped to categories, BR-MKT-012) |
| BR-ADM-004 | 18 | IExportManager | SEC-014 | SEC-014 (masking in staff exports, BR-SEC-060; 5.00 adds 17 report export members — sales summary, low stock, best sellers, never sold, country sales, registered and best customers — which the masking covers) |
| BR-ADM-004 | 19 | IDownloadService.GetDownloadBitsAsync(IFormFile) and IPictureService.InsertPictureAsync(IFormFile, ...) | ADM-008 | ADM-008 (upload policy backstop for IFormFile uploads, BR-ADM-060; files received as bytes are checked through IC-ADM-08 CheckUpload) |
| BR-ADM-004 | 20 | Nop.Web ICatalogModelFactory.PrepareSortingOptionsAsync | SRC-005 | SRC-005 (new sort options). Not an override: the SRC ISearchProvider plugin is a native provider type selected by catalogsettings.activesearchprovidersystemname |
| BR-ADM-005 | — | global action filters on Admin OrderController (one filter class per module; refusing guards run before capture filters, order value Proposed) | per entry (see text) | PAY (PAY-016, PAY-019): CaptureOrder, MarkOrderAsPaid, RefundOrder, RefundOrderOffline, VoidOrder, VoidOrderOffline, PartiallyRefundOrderPopup [POST] (BR-PAY-082). ORD-010 shipment-guard host: AddShipment [POST], showing the first IC-ORD-11 refusal (BR-ORD-055). INV-009: AddShipment [POST], lot and serial capture through IC-INV-07 (BR-INV-070). LOG (LOG-010, LOG-012, LOG-017, LOG-020): SetAsDelivered, SetAsDeliveredSelected, EditShippedDate, EditDeliveryDate, EditReadyForPickupDate, SetTrackingNumber, AddShipment [POST], DeleteShipment, AddressEdit [POST] (BR-LOG-160). ORD (ORD-002, ORD-003): ChangeOrderStatus, CancelOrder, EditOrderTotals, EditOrderItem, DeleteOrderItem, EditShippingMethod, AddressEdit, AddProductToOrderDetails, OrderNoteDelete, Delete (BR-ORD-020); disjoint from the PAY payment actions. ADM-008: ImportFromXlsx [POST] (upload policy, data imports context; BR-ADM-060). Shared actions: AddShipment (ORD-010 host, INV, LOG) and AddressEdit (ORD reason, LOG carrier-booking lock). |
| BR-ADM-006 | — | global action filters on other Admin controllers | per entry (see text) | PLT-004: SettingController POSTs including SettingUpdate, SettingAdd, SettingDelete, and plugin Configure POSTs (BR-PLT-020). INV-001 / INV-005: ProductController.Edit, BulkEditSave, ProductAttributeCombinationEditPopup, ProductAttributeCombinationCreatePopup, ImportExcel [POST] (BR-INV-030). CAT-032: ProductController.Edit [GET] view log (AUD-CAT-011). ADM-008, the single upload filter (BR-ADM-060, decision SINGLE-FILTER): PictureController.AsyncUpload (admin picture), DownloadController.AsyncUpload (admin download; product documents included), ProductController.ProductPictureAdd (product picture; CAT-002 product pictures, BR-CAT-003) and the file fields of ProductAttributeCombinationCreatePopup / EditPopup, the imports ProductController.ImportExcel, CategoryController and ManufacturerController ImportFromXlsx, CustomerController.ImportExcel, FilterLevelValueController.ImportFromXlsx, CountryController.ImportCsv, NewsLetterSubscriptionController.ImportCsv (data imports), LanguageController.ImportXml (language import), SettingController.UploadIcons (store icons), PluginController.UploadPluginsAndThemes (plugin upload), and the upload actions added in 5.00: ProductController.Upload3dObject (product 3D object; reads the file through IDownloadService.GetDownloadBitsAsync), PriceListController.ImportExcel (data imports) and ElFinderController.Connector (HTML-editor files; elFinder replaced Roxy Fileman and applies its own allow-list of images, plain text and PDF up to 10 MB, the stricter limit applies); CAT adds no upload filter: its own admin upload actions (CAT-016 360 image sets and brochures, CAT-019 certificates, CAT-020 provenance documents, CAT-021 takedown evidence, CAT-009 import files) are registered with ADM-008 under admin picture, admin download and data imports (BR-CAT-003); the RPT-011 ad-spend file uses data imports. SRC-016: CategoryController Create, Edit, Delete, DeleteSelected, ImportFromXlsx [POST] (BR-SRC-060). SEL-003: VendorController Create, Edit and Delete [POST] activation and deactivation gate (BR-SEL-002). SEL-009: global seller-staff filter on admin and seller-portal actions for vendor users (BR-SEL-010). MKT-008: TopicController Create / Edit, BlogController BlogPostCreate / BlogPostEdit [POST], and the Misc.News plugin controller NewsAdminController NewsItemCreate / NewsItemEdit [POST] only where that bundled plugin is installed (the core admin NewsController was removed in 5.00) (BR-MKT-007). MKT-014 and MKT-005: no filter since 5.00 — vendor discount scope (DiscountController Create, Edit, ProductAddPopup) and the Omnisend Configuration.ManagePlugins check are native (BR-MKT-011, BR-MKT-013; VER-500); Misc.Brevo is not installed. IAM-026, the single impersonation filter (BR-IAM-130, decision SINGLE-FILTER): CustomerController.Impersonate [POST] (route action name Edit), after the native CheckPermission; it allows Administrators and, for other users, asks the rule providers IC-IAM-09: the IAM-026 agent rule (customers of the agent outlets; CHK-013 acting sessions) and the CRM-015 account-manager rule (BR-CRM-070); CRM and CHK register no filter on this action. IAM-007: CustomerRoleController Edit and Delete [POST] (product role protection); SecurityController.PermissionEditPopup [POST] (permission exclusions, BR-IAM-054). IAM: read-access logging on admin customer and order views (BR-IAM-080) and the scope check on single-record actions (BR-IAM-060). RET: ReturnRequestController.Edit [POST] (BR-RET-001). SEC-002, the single download-ownership filter (BR-SEC-005, decision SINGLE-FILTER): DownloadController.DownloadFile, shared with Nop.Web DownloadController.GetFileUpload (BR-ADM-007); rule providers IC-SEC-05: EGV-002, RET, CRM-001, ORD, SEL-002, DOC-002, LOG-012, TRK-003. AI-002: ArtificialIntelligenceController.GenerateMetaTags (no native CheckPermission; BR-AI-004). SEC-007: Widgets.GoogleAnalytics WidgetsGoogleAnalyticsController.Configure [POST] refuses EnableEcommerce = true while the country profile requires consent or is not configured (BR-SEC-021); it runs beside the PLT-004 Configure filter and checks a different thing. |
| BR-ADM-007 | — | global action filters on Nop.Web (storefront) controllers | per entry (see text) | CHK-009 / CHK-002: CheckoutController.ConfirmOrder and OpcConfirmOrder [POST] (BR-CHK-013). SVC-004: the same actions (payment-plan price check, BR-SVC-031). SVC-001: ShoppingCartController.AddProductToCart_Catalog and AddProductToCart_Details (price on request, BR-SVC-002; in 5.00 AddProductToCart_Details takes an extra customwishlistid parameter, which the filter ignores). SVC-003: OrderController.CancelOrder (booking cancellation rules). INV-004: CheckoutController Index and OnePageCheckout [GET] (checkout hold, BR-INV-021). ADM-008, the single upload filter (BR-ADM-060, decision SINGLE-FILTER): ShoppingCartController.UploadFileProductAttribute (storefront attribute file; EGV-002 e-Government application document by resolver) and UploadFileCheckoutAttribute (checkout attribute file), ReturnRequestController.UploadFileReturnRequest (return-request file), CustomerController.UploadAvatar (avatar), VendorController.ApplyVendorSubmit [POST] (route action name ApplyVendor) and VendorController.Info [POST] (vendor picture); EGV-002 registers no upload filter (BR-EGV-004). SEC-002: ShoppingCartController.UploadFileProductAttribute, UploadFileCheckoutAttribute and ReturnRequestController.UploadFileReturnRequest [POST] record upload ownership only (no file check), and DownloadController.GetFileUpload carries the single download-ownership filter with the IC-SEC-05 rule providers (BR-SEC-005); EGV-002 registers no download filter (BR-EGV-004). RET-002: ReturnRequestController.ReturnRequestSubmit [POST] (BR-RET-012; in 5.00 the action also accepts a guest withdrawal token, which stays unused while ReturnRequestSettings.GuestReturnRequestsAllowed is off). CRM-002: CommonController.ContactUsSend [POST] (in 5.00 with an extra IFormCollection parameter for contact-form attributes), ticket after a successful send. SEL-006 / SEL-013: VendorController.ApplyVendorSubmit [POST] (route action name ApplyVendor; terms and block check). SEL-013: CustomerController.Register and Login [POST] and the IAM mobile registration and login POST actions (block scope; BR-IAM-003; in 5.00 Login and Register redirect to the native phone one-time-code verification when OtpSettings.LoginByPhoneEnabled is on, and Login shows the generic wrong-credentials message for unknown and unregistered accounts). IAM: CustomerController.PasswordRecoverySend [POST] (BR-IAM-020; in 5.00 the native action no longer reveals an unknown e-mail); global MFA-by-role redirect (BR-IAM-030); global policy re-acceptance redirect, also in the seller portal (BR-IAM-091). |
| BR-ADM-008 | 21 | Result filter on admin view models and JSON results | SEC-014 | owner SEC-014 (masking in staff views, BR-SEC-060; applied only when SEC-014 is delivered) |
| BR-ADM-008 | 22 | Middleware for request idempotency keys | PLT-027 | owner PLT-027 (IC-PLT-07; until PLT-027 is delivered checkout runs on one web node, BR-PLT-004) |
| BR-ADM-008 | 23 | ModelReceivedEvent veto on Admin ProductController.Create and Edit [POST] for the publish gate | CAT-022 | owner CAT-022 (BR-CAT-005; CAT-022 owns only this veto) |
| BR-ADM-008 | 24 | ModelReceivedEvent handler on Admin ProductController.Edit [POST] for the edit-version check | CAT-023 | owner CAT-023 (BR-CAT-019) |
| BR-ADM-008 | 25 | Registered core modification, row version and repository check | PLT-027 | owner PLT-027 (L1 section 6.3) |
| BR-ADM-008 | 26 | Registered core modification, admin views | PLT-018 | owner PLT-018 (L1 section 6.3) |
| BR-ADM-008 | 27 | Registered core modification, admin query filtering by scope | IAM-008 | owner IAM-008 (BR-IAM-060; L1 section 6.3) |
| BR-ADM-008 | 28 | Registered core modification, per-line fulfilment | CHK-005 | owner CHK-005 (L1 section 6.3) |
| BR-ADM-008 | 29 | Conditional core modification, decimal quantities | CAT-041 | owner CAT-041 (only if decision UOM-01 requires it; L1 section 6.3) |
| BR-ADM-008 | 30 | Conditional core modification, order number before the Order insert | CHK-008 | owner CHK-008 (only if the custom order number must exist before the Order insert; otherwise the CheckoutSession reference is used and there is no core change; L1 section 6.3, workbook fit: Custom plugin; Core modification (conditional)) |

**5.00.1 changes to the registered interfaces and actions (19).** No owned interface was removed, so every register row stays valid; the changes below apply to the implementation. The last column is generated: it checks the L2 ADM chapter rules for the 4.90 name.

| Interface / action | Change in 5.00.1 | Consequence | Evidence (5.00.1) | Register text (ADM chapter) |
|---|---|---|---|---|
| IShoppingCartService | GetShoppingCartAsync is two overloads (List<int> shoppingCartTypes; ShoppingCartType); ResetCheckoutDataAsync moved here from ICustomerService; SetShoppingCartVendorAsync added; ShoppingCartService.IsCustomerShoppingCartEmptyAsync removed. | Override of the cart service implements both overloads; checkout reset is called on IShoppingCartService. SetShoppingCartVendorAsync is not used (CART-500). | Libraries/Nop.Services/Orders/IShoppingCartService.cs:77,94,339,351 | aligned |
| IProductService | GetBaseProductPriceAsync added (moved from ProductModelFactory); four Product3dObject members added. | The CAT-002 override host forwards the new members to the base implementation. | Libraries/Nop.Services/Catalog/IProductService.cs:432,876-897 | aligned |
| IWorkflowMessageService | Forum and news senders removed (they live in the plugins); SendContactUsMessageAsync gains customAttributes; five new senders: next recurring payment, withdrawal confirmation, incomplete registration, abandoned cart, pending order. | TRK-005 routes each new sender or explicitly leaves it native. | Libraries/Nop.Services/Messages/IWorkflowMessageService.cs:379,490,661,801,813,826 | aligned |
| ICustomerRegistrationService | ValidateCustomerByPhoneAsync added (phone login with one-time code). | IAM-002 builds on it; an override implements it. | Libraries/Nop.Services/Customers/ICustomerRegistrationService.cs:30 | aligned |
| IExportManager | 17 export members added (report exports, for example sales summary, low stock, best sellers, never sold, country sales, registered and best customers). | SEC-014 masking covers the new exports. | Libraries/Nop.Services/ExportImport/IExportManager.cs | aligned |
| IProductModelFactory / ProductModelFactory | Constructor and PrepareProductToWishlistModelAsync changed; GetBaseProductPriceAsync moved to IProductService. | The CAT-042 factory override is recompiled against the new constructor. | Presentation/Nop.Web/Factories/ProductModelFactory.cs | aligned |
| IPdfService / PdfService | IPdfService unchanged; PdfService.ResolvePdfFont replaced by the protected GetFontInfo. | Matters only if DOC-001 subclasses PdfService. | Libraries/Nop.Services/Common/PdfService.cs:239 | aligned |
| IMessageTokenProvider | AddReturnRequestTokensAsync gains an Order parameter; GetListOfAllowedTokensAsync gains a MessageTemplate parameter. | Token providers (IC-DOC-02) implement the new signatures. | Libraries/Nop.Services/Messages/IMessageTokenProvider.cs:91,211 | aligned |
| DiscountService | The protected four-parameter GetValidationResultAsync overload is removed. | MKT-001 overrides use the remaining overload. | Libraries/Nop.Services/Discounts/DiscountService.cs:79,610 | aligned |
| Filter: news item create / edit | NewsController.NewsItemCreate / NewsItemEdit no longer exist in Nop.Web; the actions are in NewsAdminController of the Misc.News plugin, guarded by News.Manage. | The MKT-008 filter targets the plugin controller and applies only when Misc.News is installed (PLG-500). | Plugins/Nop.Plugin.Misc.News/Admin/Controllers/NewsAdminController.cs:166,176 | aligned |
| Filter: contact us | CommonController.ContactUsSend takes (model, captchaValid, IFormCollection form) for contact-form attributes. | The CRM-002 filter binds to the new signature. | Presentation/Nop.Web/Controllers/CommonController.cs:276 | aligned |
| Filter: return request | ReturnRequestController.ReturnRequest(orderId, token) and ReturnRequestSubmit accept a guest withdrawal token. | RET filters handle the guest token path. | Presentation/Nop.Web/Controllers/ReturnRequestController.cs:179,209 | aligned |
| Filter: add to cart (details) | ShoppingCartController.AddProductToCart_Details gains customwishlistid. | SVC-001 filter binds to the new signature. | Presentation/Nop.Web/Controllers/ShoppingCartController.cs:791 | aligned |
| Filter: Omnisend configuration | Configure, SyncContacts and SyncProducts carry [CheckPermission(Configuration.ManagePlugins)] natively; SyncOrders removed. | The MKT-013 filter is complementary; it no longer lists SyncOrders. | Plugins/Nop.Plugin.Misc.Omnisend/Controllers/OmnisendAdminController.cs:73-138 | aligned |
| Filter: vendor discounts | DiscountController Create / Edit force DiscountType.AssignedToSkus for vendors and refuse other vendors' discounts; ProductAddPopup enforces vendor ownership. | The MKT-014 filter is complementary to the native checks. | Presentation/Nop.Web/Areas/Admin/Controllers/DiscountController.cs:114-183,466-487 | aligned |
| Admin order card data | OrderController.EditCreditCardInfo removed (card storage removed). | No register entry may name it. | Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs | aligned |
| Single upload filter (ADM-008) | Three new upload points: ProductController.Upload3dObject, PriceListController.ImportExcel, ElFinderController.Connector (admin file manager, replaces RoxyFileman). | The ADM-008 upload list names them (UPL-500). | Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:4256; PriceListController.cs:489; ElFinderController.cs:43 | aligned |
| Search fallback setting | CatalogSettings.UseStandardSearchWhenSearchProviderThrowsException removed; CatalogSettings.UseStandardSearchWhenNoResults also falls back when the provider returns nothing; an AI recommendation provider runs first. | Search rules cite the new setting. | Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:617; Libraries/Nop.Services/Catalog/ProductService.cs:899-951 | aligned |
| Return-request settings | OrderSettings.ReturnRequest* moved to ReturnRequestSettings. | Rules and packs cite returnrequestsettings.* keys. | Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:13-68 | aligned |

### 6.4 Tenancy and deployment model

- **Stated (fit evidence):** one nopCommerce installation is one database; deploying one installation per client gives full data isolation (PRD-PLT-002, Out of the box). This is the default.
- **Per installation:** appsettings.json (App_Data, generated at install: connection string, cache, data protection), App_Data/plugins.json (installed plugins), each plugin's plugin.json store and role limits, and the scheduled-task list (ScheduleTask has no store scope).
- **P1 is single-node for checkout (decision SINGLE-NODE, Proposed):** until PLT-027 idempotency keys (P2) are delivered, a client serves checkout from one web node; the go-live checklist fails with more than one checkout node (BR-PLT-004, AC-CHK-008-03-04).
- **More than one web node per client:** DistributedCacheConfig.Enabled = true (Redis or SQL Server) so that task locks (ILocker) and cache are shared (the order-placement lock OrderSettings.PlaceOrderWithLock is a host-local Mutex, Libraries/Nop.Services/Orders/OrderProcessingService.cs:1681-1717 in 5.00.1; idempotency keys, PRD-PLT-027, are required for cross-node duplicate protection); shared media (for example the bundled Misc.AzureBlob plugin or a shared file store); shared data-protection keys; identical plugin folders on every node.
- **If a shared installation across clients were chosen (open, F-CAT-B):** one database, one plugin set and install list, one task schedule and one upgrade window for all clients; per-client data separation only through StoreMapping and ACL, which does not isolate admin users (no store-limited admin found in source). Event sourcing as system of record (catalog M03) is also part of F-CAT-B. Neither client source requires shared tenancy.
- **Runtime (decision VER-500):** every installation runs nopCommerce 5.00.1 on the .NET 10 runtime. Database as the 5.00.1 source states it: SQL Server 2012 or higher; MySQL and PostgreSQL supported, minimum version not stated in source — requires confirmation (§6.1). Windows Server 2019 compatibility of .NET 10 (REQ-MPC-ARC-004) is open item HOST-500.
- **Hosting:** KTDA prefers AWS or Azure (REQ-KTDA-HST-001); Malawi Post states a sizing of 4 cores / 8 GB / 2 TB (REQ-MPC-HST-002) whose status as floor or ceiling is open (C-SIZE). Hosting region and cross-border transfer are open (DP-01). Hosting provision is a project service. Licence cost per installation is open (LIC-PI).

### 6.5 Configuration model

Runtime resolution in nopCommerce is two-level only: store-specific value, else the StoreId 0 shared value (SettingService.LoadSettingAsync). Global, country and vertical layers exist only in pack files; the PLT-003 pack loader merges global → country → vertical → client at apply time and writes the result as StoreId 0 rows, and store-layer keys as StoreId = n rows (BR-PLT-010, Proposed). Layers: global = product defaults; country = the country pack (one per pack set, versioned; Kenya, Malawi, or a new country); vertical = the industry pack; client = the client pack; store = per store. No runtime layer resolver is to be built (NOP-906). Override order and secrets rule: decision CFG-01. Setting group names verified against release-4.90.8 (NOP_Review_L1 table c) and re-verified against release-5.00.1 (decision VER-500).

| Configurable artefact | nopCommerce 5.00.1 source (setting key / entity / file) | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Core settings (catalog, orders, customers, shopping cart, shipping, tax, media, SEO, security) | Setting table keys: catalogsettings.*, ordersettings.*, customersettings.*, shoppingcartsettings.*, shippingsettings.*, taxsettings.*, mediasettings.*, seosettings.*, securitysettings.*, returnrequestsettings.* (5.00 moved the return-request settings out of ordersettings: Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs) (key = lower-case <SettingsClassName>.<PropertyName>; verified in release-4.90.8, NOP_Review_L1 table c; re-verified in release-5.00.1) | global → vertical → client → store | PLT-003 | Core |
| Store definitions and store mapping | Store, StoreMapping entities | client → store | PLT-013 | Core |
| Theme and branding | storeinformationsettings.defaultstoretheme, .logopictureid, .allowcustomertoselecttheme; theme plugin configuration | client → store | PLT-006 | Core |
| Languages and locale resources | Language, LocaleStringResource (XML packs) | global → vertical → client | PLT-009 / PLT-025 | Core |
| Currencies and rate provider | Currency, currencysettings.*, rate-provider plugin config | client → store | PLT-010 / PLT-024 | Core |
| Time zone, formats, fiscal calendar | datetimesettings.defaultstoretimezoneid, .allowcustomerstosettimezone (class in Nop.Services/Helpers); date and number formats = Language.LanguageCulture; fiscal-calendar settings (new) | client | PLT-011 / PLT-012 | Core |
| Message templates (email) | MessageTemplate entities with tokens; per language via LocalizedProperty; per store by separate template rows with StoreMapping | global → vertical → client → store | TRK-004 | Core |
| Multi-channel notification templates and routing | Notification engine templates per event/channel (new) | global → vertical → client | TRK-005 | Core |
| Customer roles, permissions, ACL | CustomerRole, PermissionRecord + PermissionRecordCustomerRoleMapping (definitions from IPermissionConfigManager / StandardPermission string system names, view/edit split since 4.90, unchanged in 5.00.1), AclRecord. Packs use 5.00.1 system names (for example Catalog.ProductsView; news, polls and forums use the plugin names News.Manage, Polls.Manage, Forums.Manage); 4.70 names (for example ManageProducts) are invalid and grant nothing. | global → vertical → client | IAM-007 / IAM-008 | Core |
| Feature/module toggles | Feature registry (new): feature ID, on/off, per store | vertical (pack default) → client → store | PLT-022 | Core |
| Plugin enablement | Installed list: App_Data/plugins.json (file). Store/role limits: LimitedToStores / LimitedToCustomerRoles persisted in each plugin's plugin.json (file). Active providers: settings paymentsettings.activepaymentmethodsystemnames, shippingsettings.activeshippingratecomputationmethodsystemnames, shippingsettings.activepickuppointprovidersystemnames, taxsettings.activetaxprovidersystemname, widgetsettings.activewidgetsystemnames, catalogsettings.activesearchprovidersystemname, and since 5.00 artificialintelligencesettings.activeairecommendationprovidersystemname and messagessettings.activesmsprovidersystemname (database, store-overridable). The pack loader writes both the files and the settings; deployment must not overwrite plugin.json limits. | vertical → client → store | PLT-022 | Core |
| Category taxonomy and specification attributes | Category, SpecificationAttribute(Group), ProductAttribute | vertical → client | CAT-001 / CAT-004 | Core |
| Category attribute schemas and listing rules | Required-attribute sets (new) | vertical → client | CAT-005 | Core |
| Tax categories and rates | TaxCategory, tax-provider config | global → country → client | PAY-020 | Core |
| Fiscal e-invoicing adapter selection | Fiscal adapter config (new) | country → client | PAY-025 | Core |
| Payment methods and routing rules | Payment plugin activation, restrictions, routing rules (new) | country → client → store | PAY-001 / PAY-024 | Core |
| Shipping methods, rates, delivery dates | ShippingMethod, rate tables, DeliveryDate | client → store | LOG-001 / LOG-002 | Core |
| Carrier adapter selection | Carrier adapter config (new) | country → client | LOG-021 | Core |
| Pickup points and outlets | StorePickupPoint (bundled Pickup.PickupInStore plugin) + outlet extensions such as capacity and closures (new) | client | LOG-003 | Core |
| Order status model and reason codes | Status/transition tables (new), reason codes | vertical → client | ORD-002 / ORD-003 | Core |
| Return reasons and actions | ReturnRequestReason, ReturnRequestAction | vertical → client | RET-001 | Core |
| Workflow definitions | Workflow engine definitions (new) | vertical → client | ADM-002 | Core |
| Business rules | Rules engine library (new) | vertical → client | ADM-003 | Core |
| Transaction types and templates | Transaction type schemas, template library (new) | vertical → client | ADM-004 / ADM-011 | Core |
| Content pages, policies, topics | Topic, BlogPost, NewsItem (in 5.00 an entity of the Misc.News plugin); policy versions | vertical → client → store | MKT-007 / MKT-008 | Core |
| Country law profile (e-transactions, data protection) | Law profile (new): consent texts, timelines, DSAR SLAs, breach deadlines | country | CHK-009 / SEC-012 | Core |
| Scheduled tasks | ScheduleTask entries and intervals (installation-wide; no store scope) | installation only (no store scope) | ADM-001 | Core |
| Discount and promotion defaults | Discount templates | vertical → client | MKT-001 | Core |
| Marketplace pack settings | vendorsettings.*, commission rules, seller tiers; shoppingcartsettings.vendorenabled and .vendorrequired = false (decision CART-500) | vertical (Marketplace pack) → client | SEL-003 / SEL-016 | Marketplace pack |
| B2B pack settings | Company account roles, credit terms, price lists (native in 5.00: PriceList entities, catalogsettings.priceliststrategy; decision PRICE-500), approval limits | vertical (B2B pack) → client | IAM-022 / CHK-016 / CAT-039 | B2B trade pack |
| Postal pack settings | S10 series, hubs, routes, holding charges | vertical (Postal pack) → client | LOG-020 / LOG-023 / LOG-017 | Postal and logistics pack |
| e-Government pack settings | Agency, service catalogue, fee schedules | vertical (e-Gov pack) → client | EGV-001 / EGV-005 | e-Government pack |
| Countries, states/provinces, districts (Kenya counties, Malawi districts) | Country, StateProvince; addresssettings.countyenabled / .countyrequired (free-text County); district list (new) only if a controlled list is required | global → country → client | CHK-007 / LOG-002 / PAY-020 | Core |
| Data retention rules | Retention policy per data type (new); maintenance tasks | country → client | PLT-020 | Core |
| SMS gateway and sender ID | SMS provider plugin settings (5.00: ISmsProvider plugin selected by messagessettings.activesmsprovidersystemname); sender ID; opt-out keywords; quiet hours | country → client | CHN-005 / CHN-012 | Core |
| Customer attributes and checkout attributes | CustomerAttribute, CheckoutAttribute | vertical → client → store | MKT-011 / CHK-015 | Core |
| Measures and units of measure | MeasureWeight, MeasureDimension, measuresettings.*; UoM list (new) | global → vertical → client | CAT-002 / CAT-041 | Core / B2B trade pack |
| Payment fee schedules | Payment-method additional fee settings; provider/platform fee schedules (new) | country → client | PAY-015 | Core |
| Serviceability rules | Coverage areas per outlet/seller (new) | client | LOG-004 | Core |
| KPI catalogue | KPI definitions and formulas (new) | vertical → client | RPT-002 | Core |
| Further core setting groups | captchasettings.*, gdprsettings.*, multifactorauthenticationsettings.*, rewardpointssettings.*, localizationsettings.*, storeinformationsettings.* | global → client → store | SEC-013 / SEC-007 / IAM-004 / MKT-003 / PLT-009 / PLT-006 | Core |
| Warehouse pack settings | Warehouse entities; batch/lot, serial, expiry and cycle-count settings (new); WMS/ERP sync config | vertical (Warehouse pack) → client | INV-002 / INV-009 / INV-011 / INV-012 | Warehouse pack |
| Channels pack settings | Mobile app branding and API client; USSD menus; IVR menus; WhatsApp/WeChat/Telegram accounts; push provider | vertical (Channels pack) → client | CHN-001 / CHN-003 / CHN-004 / CHN-006 / CHN-013 | Channels pack |
| AI pack settings | AI provider, model and feature toggles per use; translation languages; governance disclosures | vertical (AI pack) → client | AI-001 – AI-010 | AI pack |
| Analytics pack settings | Data warehouse sources, BI connection, dashboard sets, public metrics | vertical (Analytics pack) → client | RPT-010 / RPT-011 / RPT-007 / RPT-008 | Analytics pack |
| Agri-finance and schemes pack settings | Scheme definitions, eligibility rules, budgets, partner credit/insurance products, disbursement rails | vertical (Schemes pack) → client | ORD-024 / PAY-022 / FIN-001 – FIN-004 | Agri-finance and schemes pack |
| Assisted service pack settings | Agent roles, outlet assignment, receipt printer profile, cash-up rules | vertical (Assisted pack) → client | IAM-026 / CHK-013 / PAY-034 | Assisted service pack |
| Services and bookings pack settings | Service product templates, coverage areas, booking slots | vertical (Services pack) → client | CAT-026 / CAT-027 | Services and bookings pack |
| Engagement and loyalty pack settings | Reward-point rules, promotion types, pop-ups, abandoned-cart timing (5.00: remindersettings.*, native e-mail reminders), affiliates, recurring cycles | vertical (Engagement pack) → client → store | MKT-002 / MKT-003 / MKT-012 / ORD-028 | Engagement and loyalty pack |
| Service desk extensions pack settings | Complaint categories and ADR escalation matrix, support channel directory | vertical → client | CRM-004 / CRM-012 | Service desk extensions pack |
| Commerce extensions pack settings | Cart restriction rules, return fees, feed/syndication targets, PayPal method enablement and options (credentials entered per client instance, not stored in the pack) | vertical → client → store | CHK-011 / RET-006 / CAT-035 / PAY-003 | Commerce extensions pack |
| Access and admin extensions pack settings | Delegation rules, passwordless/biometric options, guided-tour content | vertical → client | IAM-009 / IAM-013 / PLT-019 | Access and admin extensions pack |
| Integration adapters, API clients and scopes | API client registry and scopes (new, BR-INT-006); adapter endpoint settings; outbox (IC-INT-09) | country → client | INT-001 / INT-004 / INT-005 | Core |

**Configuration rules set by decisions (5.00).** Recorded here and in the decision log; the L2 features and rules that implement each are generated from the module content.

| Decision | Configuration rule | Setting / mechanism (5.00.1) | Cited by (L2 features; rules) |
|---|---|---|---|
| VER-500 | Every client installation runs nopCommerce 5.00.1 on .NET 10; packs use 5.00.1 setting keys and permission names (for example returnrequestsettings.*, News.Manage); plugin.json SupportedVersions is 5.00. | Libraries/Nop.Core/NopVersion.cs:11,16; Directory.Build.props:3 | ADM-008, AI-003, AI-007, CAT-010, CAT-011, CAT-016, CAT-039, CHK-004, CHK-006, CHK-014, CHK-016, CHK-017, CHK-018, CHN-005, CHN-012, CRM-002, CRM-013, FIN-004, IAM-002, IAM-003, IAM-021, INT-012, INV-004, INV-012, LOG-005, LOG-006, LOG-009, LOG-012, LOG-015, LOG-016, LOG-018, LOG-020, LOG-025, MKT-002, MKT-005, MKT-007, MKT-010, MKT-012, MKT-014, ORD-004, ORD-012, ORD-015, ORD-025, ORD-028, PAY-002, PAY-005, PAY-011, PAY-013, PAY-035, PLT-003, PLT-006, PLT-015, PLT-017, PLT-021, PLT-023, RET-001, RPT-001, SEC-001, SEC-007, SEC-012, SEL-013, SEL-016, SRC-001, SRC-007, SRC-009, SRC-012, SRC-014, SRC-024, SRC-027, SVC-001, SVC-010, TRK-005, TRK-011; rules BR-PLT-097, BR-IAM-011, BR-IAM-012, BR-IAM-013, BR-IAM-092, BR-INV-023, BR-SRC-150, BR-PAY-170, BR-MKT-011, BR-MKT-013, BR-ADM-006, BR-SEC-003, BR-SEC-021, BR-SEC-081 |
| CART-500 | The native separate cart per vendor stays off in every client pack: shoppingcartsettings.vendorenabled = false and shoppingcartsettings.vendorrequired = false (the installation default). With vendorenabled on, the cart page shows one chosen vendor's items (admin label "Vendor filtering"); with both on, checkout of a cart with more than one vendor is blocked until one vendor is chosen. The product keeps one cart whose order and payment are split across sellers (CHK-004 order splitter, SPLIT-PAY). | ShoppingCartSettings.VendorEnabled / VendorRequired (Libraries/Nop.Core/Domain/Orders/ShoppingCartSettings.cs:131,136; defaults Libraries/Nop.Services/Installation/InstallRequiredData.cs:1856-1857); cart filter Presentation/Nop.Web/Factories/ShoppingCartModelFactory.cs:997-1000; warning ShoppingCart.SelectVendorToCheckout (Libraries/Nop.Services/Orders/ShoppingCartService.cs:1220-1226) | CHK-004, PAY-035, SEL-016, SEL-017; rules BR-CHK-023, BR-ADM-002 |
| PRICE-500 | Customer and company prices (CAT-039, CAT-042) are native price lists (catalogsettings.priceliststrategy chooses MinimalPrice or UseByPriority). Per-currency fixed prices remain a build. Natively a tier price replaces the price-list price, so a rule is required wherever a product carries both; the rule text is owned by the CAT chapter (column 4). | PriceList, PriceListItem.ManualPrice, PriceListCustomer, PriceListCustomerRole; PriceCalculationService.GetFinalPriceAsync (Libraries/Nop.Services/Catalog/PriceCalculationService.cs:77-140,454-462) | CAT-039, CAT-042, FIN-004, MKT-002, SVC-001; rules BR-CAT-020, BR-CAT-034, BR-ADM-002 |

### 6.6 Reuse tiers and packs (decision D-01)

| Reuse tier | Features |
|---|---|
| Platform core | 216 |
| Product option | 196 |
| Client-specific extension | 19 |
| Common core | 3 |
| Total | 434 |

| Pack | Features |
|---|---|
| Core (always on) | 216 |
| Marketplace pack | 42 |
| B2B trade pack | 34 |
| Postal and logistics pack | 19 |
| Services and bookings pack | 15 |
| Engagement and loyalty pack | 13 |
| Commerce extensions pack | 10 |
| e-Government pack | 10 |
| AI pack | 10 |
| Analytics pack | 8 |
| Warehouse pack | 8 |
| Channels pack | 8 |
| Client: MPC | 6 |
| Agri-finance and schemes pack | 6 |
| Assisted service pack | 5 |
| Service desk extensions pack | 5 |
| Carrier adapter (reusable, Kenya) | 4 |
| Access and admin extensions pack | 3 |
| Core (both clients) | 3 |
| Carrier adapter (reusable) | 3 |
| Country: Kenya | 2 |
| Country: Malawi | 2 |
| Country: Kenya/Malawi | 1 |
| Client: KTDA | 1 |
| Total | 434 |

Inference: the pack and tier of 17 features added after v5 (PLT-027, SEC-015, SEL-025, PAY-035, PAY-036, SVC-001 to SVC-012) were assigned in v9 by the analyst and recorded in the workbook Product Backlog — SVC-007 and the two security/platform items to Core, the direct-payment items to the Marketplace pack, the other SVC items to the Services and bookings pack. The Product Owner to confirm.

### 6.7 Implementation fit by area

| Area | Configuration | Licensed plugin | Code-level | External system | Total |
|---|---|---|---|---|---|
| PLT | 9 | 1 | 12 | 5 | 27 |
| IAM | 3 | 0 | 23 | 1 | 27 |
| SEL | 3 | 0 | 21 | 1 | 25 |
| CAT | 10 | 1 | 32 | 0 | 43 |
| INV | 2 | 0 | 11 | 0 | 13 |
| SRC | 10 | 2 | 14 | 1 | 27 |
| CHK | 4 | 1 | 14 | 0 | 19 |
| PAY | 2 | 0 | 31 | 3 | 36 |
| ORD | 2 | 0 | 25 | 1 | 28 |
| LOG | 2 | 1 | 25 | 4 | 32 |
| TRK | 1 | 1 | 9 | 1 | 12 |
| RET | 1 | 0 | 10 | 0 | 11 |
| CRM | 2 | 2 | 11 | 0 | 15 |
| MKT | 9 | 0 | 5 | 0 | 14 |
| RPT | 0 | 1 | 3 | 8 | 12 |
| ADM | 1 | 0 | 11 | 0 | 12 |
| DOC | 0 | 0 | 5 | 1 | 6 |
| SEC | 4 | 0 | 5 | 6 | 15 |
| INT | 2 | 0 | 9 | 2 | 13 |
| CHN | 1 | 1 | 8 | 3 | 13 |
| AI | 0 | 0 | 5 | 5 | 10 |
| FIN | 0 | 0 | 2 | 3 | 5 |
| EGV | 1 | 0 | 6 | 0 | 7 |
| SVC | 1 | 0 | 11 | 0 | 12 |
| Total | 70 | 11 | 308 | 45 | 434 |

Definitions: Configuration = Out of the box in 5.00.1 (fit re-verified 2026-11-24, decision VER-500); Licensed plugin = a third-party or nopCommerce-team plugin to license; Code-level = custom plugin and/or theme/core change; External system = capability outside nopCommerce, connected by an integration plugin.

### 6.8 Licensed plugin register (11) — all subject to V-01 (vendor 5.00 builds not verifiable from source)

| PRD ID | Feature | Candidate and condition |
|---|---|---|
| PRD-PLT-006 | Branding and theme | Colours/fonts/layout per client without code: Nop-Templates Pavilion theme (PG PLT-02) — 5.00 version to confirm with vendor. Native alternative: per-client DefaultClean child theme (Theme/view override). Availability of this licensed plugin for 5.00 is not verifiable from source (evidence is Post Gebeya on 4.70.5); decision V-01. |
| PRD-CAT-011 | Catalogue API | Licence the official nopCommerce Web API plugin (separate download, by nopCommerce team; stub (plugin.json SupportedVersions 5.00, Plugins/Nop.Plugin.Misc.WebApi.Frontend/plugin.json) confirms only that nopCommerce markets the paid plugin for 5.00; the paid plugin's 5.00 build, licence terms and scope are V-01 items to confirm with nopCommerce). The source contains only the Web API Frontend stub (storefront API); a backend (admin / catalog write) API product is not found in source — decision API-01. Do not assume the frontend API covers catalog write or ERP integration. (NOP-920) |
| PRD-SRC-007 | Merchandising widgets and landing pages | Product carousels, curated collections, ribbons ('New'/'Sale' labels on pictures), HTML widgets and date-scheduled widget display are not native → Nop-Templates JCarousel (STF-08), Smart Product Collections (STF-09), Product Ribbons (STF-11), Html Widgets (CNT-03), NT framework scheduling (NT-01). Built for 4.70.5: needs 5.00 version from vendor (5.00 support not verifiable from source; confirm with vendor). Availability of this licensed plugin for 5.00 is not verifiable from source (evidence is Post Gebeya on 4.70.5); decision V-01. |
| PRD-SRC-027 | Storefront conveniences | Quick view, 'Buy now' and previous/next product links are not in source (grep 'BuyNow' returns nothing) → Nop-Templates Quick View (STF-12), Buy now (STF-20, NT part), Prev/Next Product (STF-19). Built for 4.70.5: 5.00 support not verifiable from source; confirm with vendor. Availability of this licensed plugin for 5.00 is not verifiable from source (evidence is Post Gebeya on 4.70.5); decision V-01. |
| PRD-CHK-017 | B2B quick order and bulk add | SKU entry, paste and spreadsheet upload to cart → nopStation Bulk Order plugin (v4 candidate; version not stated on listing; 5.00 support not verifiable from source; confirm with vendor). Build fallback if not available. |
| PRD-LOG-006 | DHL adapter | DHL rates/booking/labels/tracking → v4 candidates nopStation DHL Shipping Integration (lists 4.70) or FoxNetSoft DHL Connector 2 (lists 4.70). 5.00 support not verifiable from source; confirm with vendor; build fallback. Availability of this licensed plugin for 5.00 is not verifiable from source (evidence is Post Gebeya on 4.70.5); decision V-01. |
| PRD-TRK-011 | Guest order-status lookup | FoxNetSoft guest order-status plugin as used on PG. Availability of a 5.00 build of this licensed vendor plugin is not verifiable from source (decision V-01). Fallback custom plugin can reuse the 5.00 order-number + email + CAPTCHA + token pattern of ReturnRequestController.Find. |
| PRD-CRM-001 | Help desk ticketing | Nop-Templates Nop Help Desk (in use on PG) or nopStation Helpdesk Ticket. Availability of a 5.00 build of this licensed vendor plugin is not verifiable from source (decision V-01). |
| PRD-CRM-008 | Live web chat | Tawk.to via Nop-Plus plugin as on PG. Availability of a 5.00 build of this licensed vendor plugin is not verifiable from source (decision V-01). Inference (not verified in a running store): a chat provider's script could be placed in CustomHeadTags or the Jotform EmbedCode field without the vendor plugin. |
| PRD-RPT-008 | External BI connectivity | Official nopCommerce Power BI plugin (paid) or BI reading the DW (RPT-003). The 5.00 stub confirms only that nopCommerce markets the paid plugin for 5.00; build, licence and scope are V-01 items. |
| PRD-CHN-001 | Native mobile apps | Licensed official nopCommerce mobile app (or NS app per PG INT-02). The 5.00 stub confirms only that nopCommerce markets the paid app for 5.00; build, licence and scope are V-01 items; app-store publishing outside nopCommerce. |

### 6.9 External systems register (45)

| PRD ID | Feature | External element and integration |
|---|---|---|
| PRD-PLT-001 | Client instance provisioning | Provisioning of live + test instances with lifecycle status belongs in DevOps/IaC pipeline (infra templates, DB create, appsettings). nopCommerce side: load client config pack (see PRD-PLT-003). |
| PRD-PLT-014 | Instance health and SLA monitoring | Uptime/APM/SLA dashboards and alerting and cross-instance operator view need an external monitoring platform; nopCommerce exposes logs and a health endpoint (health endpoint to be added via small plugin). |
| PRD-PLT-016 | Backup and disaster recovery | Scheduled backups, tested restores, DR site and RTO/RPO are hosting/DB-platform capabilities. |
| PRD-PLT-021 | Product release and upgrade management | Release pipeline, per-client upgrade orchestration and regression checks are CI/CD tooling outside nopCommerce. Every custom and third-party plugin must be rebuilt for 5.00 / .NET 10. |
| PRD-PLT-026 | Hosting profile and sizing NFR | Hosting profile (MPC: 4 cores, 8 GB, 2 TB) is an infrastructure deliverable. |
| PRD-IAM-020 | Identity verification adapter framework | External registries (national ID, tax authority, MNO KYC) perform verification; nopCommerce needs an adapter-framework plugin calling them. |
| PRD-SEL-004 | Identity and registry verification adapters | External ID/tax/business-registry/MNO checks via the PRD-IAM-020 adapter framework. |
| PRD-SRC-009 | Personalised recommendations and ranking | External ML recommendation service (v4 candidates: nopStation Amazon Personalize — lists 4.70, 5.00 support not verifiable from source; confirm with vendor; Google Recommendations AI plugin — version not stated). nopCommerce needs an integration plugin: consent-gated event export, recommendation widget; keyword-search ranking via ISearchProvider (returns ordered product IDs); category/listing ranking needs an IProductService or catalog model factory override. (NOP-923) 5.00 delta: the bundled Google AI plugin can serve as the keyword-search ranking part; consent-gated event export, recommendation widgets and category/listing ranking remain. |
| PRD-PAY-007 | Escrow and staged release | Holding buyer funds is a regulated service of a bank/PSP escrow or trust account. nopCommerce needs an integration plugin that triggers staged releases on dispatch/delivery/acceptance events. |
| PRD-PAY-026 | KRA eTIMS adapter | External: KRA eTIMS (government e-invoicing system). nopCommerce needs an adapter plugin on the PAY-025 framework (submit invoice/credit note, receive fiscal number/QR). |
| PRD-PAY-027 | MRA EIS adapter | External: MRA EIS (government e-invoicing system). Adapter plugin on the PAY-025 framework. |
| PRD-ORD-017 | Contract e-signature | External e-signature provider (signing, signer evidence, quorum rules such as 3 of 5). nopCommerce needs an integration plugin to send contracts and record signatures. |
| PRD-LOG-016 | Cross-border shipping | External UPU CDS (customs declarations) and IPS (international tracking). nopCommerce needs an integration plugin (customs data on items/shipments, EDI exchange, duties display). Post Gebeya CHK-05/INT-03 are AFR: AFR port required. v9 scope: UPU GMS (Global Monitoring System) data exchange in addition to CDS and IPS. |
| PRD-LOG-019 | Specialised logistics | Temperature recording through the journey and out-of-range alerts require external IoT/telematics; certified carriers and documents are carrier-side. nopCommerce needs an integration plugin (receive telemetry/alerts, attach documents, restrict carriers). |
| PRD-LOG-023 | Hub-and-spoke sorting | Hub sorting and handover scans belong to the postal operations / track-and-trace system (e.g. IPS or the operator's sorting system — not named in source). nopCommerce needs an integration (IShipmentTracker events in, status updates). |
| PRD-LOG-032 | Own-fleet POD capture | Phone app for own-fleet staff capturing signature, photo, GPS — native mobile app build is outside nopCommerce. nopCommerce needs an API plugin receiving POD and attaching it to the shipment. |
| PRD-TRK-003 | Scanning and field operations app | Native or cross-platform field scanning app (offline, device ID, GPS, photo/voice/video evidence) outside nopCommerce; nopCommerce needs an authenticated API/plugin to receive scan events into TRK-002. |
| PRD-RPT-002 | KPI framework and executive dashboards | BI platform for KPI definition, executive dashboards, drill-down, self-built dashboards and monthly report; nopCommerce supplies data (DW feed RPT-003 or Power BI plugin). |
| PRD-RPT-003 | Data warehouse and ETL | Data warehouse + ETL (data dictionary, quality checks, anonymisation); nopCommerce exposes DB/API extracts. |
| PRD-RPT-004 | Report delivery and self-service | BI/reporting tool for scheduling, self-service queries, sharing and versioning. PG ADM-04 NopStation SQL manager is a partial in-nop alternative (5.00 support to confirm with vendor). |
| PRD-RPT-005 | Report access control | Field/row-level security in the BI platform for RPT-002/003 reports. |
| PRD-RPT-006 | Compliance and audit reports | Regulator/audit reports in BI over the SEC-004 audit store. |
| PRD-RPT-010 | Operational dashboards | Operational dashboards in BI fed by DW (delivery, payments, sellers, fraud, case load, SLA). |
| PRD-RPT-011 | Commerce and marketing analytics | BI analytics (cost, cohorts, campaigns, segments, trends) over DW. v9 scope: Import of advertising and campaign spend (sources to be confirmed with the client). |
| PRD-RPT-012 | e-Government and engagement reports | BI reports on e-government usage by agency and engagement, fed by EGV data in DW. |
| PRD-DOC-005 | Document requirements and validation | OCR / document-verification and signature-validation service; nopCommerce needs a plugin defining required documents per process and calling the service. Round 5: works without AI-005; with no IC-DOC-06 provider every document goes to manual review (AC-DOC-005-03-02). |
| PRD-SEC-002 | Edge protection | WAF and DDoS protection at hosting/CDN level; no nopCommerce integration needed beyond proxy settings (ProxySettings/hosting config). |
| PRD-SEC-005 | Anomaly and correlation detection | SIEM / anomaly-correlation platform; nopCommerce needs log export (plugin) to it. |
| PRD-SEC-006 | Data residency | Hosting region selection per client deployment (separate instance per client). |
| PRD-SEC-009 | Compliance reports and certificates | GRC/compliance tooling for SOC 2/ISO 27001 evidence and certification; nopCommerce supplies logs/audit exports. |
| PRD-SEC-011 | Vulnerability management | SCA/DAST/container scanning in CI/CD and runtime, pen-test tracking with remediation deadlines (DevSecOps tools). |
| PRD-SEC-015 | Security incident management | Security incident management/ITSM tool (records, playbooks, timeline, lessons learned); nopCommerce supplies log exports. |
| PRD-INT-002 | Integration layer (API gateway) | API gateway product (partner registry, rate limits, transformation, developer portal, sandbox) in front of nopCommerce APIs. |
| PRD-INT-004 | Integration health and retries | Integration monitoring, retry and dead-letter handling in the integration layer (INT-002). |
| PRD-CHN-003 | USSD channel | USSD gateway (mobile network operator/aggregator) running the menus; nopCommerce needs an API plugin for order lookup, simple order and payment. |
| PRD-CHN-004 | IVR channel | IVR / voice platform; nopCommerce needs an API/notification plugin. |
| PRD-CHN-010 | Field agent app | Native/cross-platform offline field agent app; nopCommerce needs API endpoints (INT-001). |
| PRD-AI-005 | OCR and ID document checks | OCR and ID-document verification service; nopCommerce integration plugin. |
| PRD-AI-006 | ML fraud detection | ML fraud-scoring service; plugin calls it at checkout/payment. |
| PRD-AI-007 | ML recommendation engine | ML recommendation service and widget rendering still required. Inference: the bundled Google Retail integration (catalogue sync, visitor ID) can be extended to call the same service's recommendation API, reducing integration effort. |
| PRD-AI-008 | Forecasting and image inspection | Demand forecasting and image-inspection ML services; integration plugin. |
| PRD-AI-010 | AI governance | AI disclosure notices (plugin/view) plus explainability and bias monitoring in the ML/LLM operations platform. |
| PRD-FIN-001 | Credit marketplace | Lender loan-origination/credit-scoring systems; nopCommerce needs data-sharing API, offer display and repayment deduction from vendor settlement. |
| PRD-FIN-002 | Invoice discounting | Lender/factoring platform; nopCommerce shares invoice data and records early-payment status. |
| PRD-FIN-003 | Insurance | Insurer systems for policy issuance and claims; integration plugin. |


## 7. Functional scope by module

Each area has its own L2 module PRD. The table gives the size and phase profile of each; Appendix A lists every feature.

| Code | Area | Features | P1 | P2 | P3 | Module PRD |
|---|---|---|---|---|---|---|
| PLT | Platform foundation and multi-client configuration | 27 | 25 | 2 | 0 | modules/PRD-PLT.md |
| IAM | Identity, access and accounts | 27 | 22 | 5 | 0 | modules/PRD-IAM.md |
| SEL | Sellers and marketplace onboarding | 25 | 20 | 4 | 1 | modules/PRD-SEL.md |
| CAT | Catalogue and listings | 43 | 34 | 9 | 0 | modules/PRD-CAT.md |
| INV | Inventory and warehouses | 13 | 8 | 5 | 0 | modules/PRD-INV.md |
| SRC | Search, discovery and merchandising | 27 | 21 | 6 | 0 | modules/PRD-SRC.md |
| CHK | Cart and checkout | 19 | 19 | 0 | 0 | modules/PRD-CHK.md |
| PAY | Payments, tax, settlement and reconciliation | 36 | 33 | 2 | 1 | modules/PRD-PAY.md |
| ORD | Orders and B2B transactions (RFQ, contracts, requisitions, offers, group buying) | 28 | 19 | 7 | 2 | modules/PRD-ORD.md |
| LOG | Shipping, logistics and fulfilment | 32 | 31 | 0 | 1 | modules/PRD-LOG.md |
| TRK | Tracking and notifications | 12 | 11 | 1 | 0 | modules/PRD-TRK.md |
| RET | Returns, refunds and disputes | 11 | 11 | 0 | 0 | modules/PRD-RET.md |
| CRM | Customer service, help desk and chat | 15 | 12 | 2 | 1 | modules/PRD-CRM.md |
| MKT | Marketing, promotions, loyalty, content and SEO | 14 | 12 | 2 | 0 | modules/PRD-MKT.md |
| RPT | Reporting and analytics | 12 | 9 | 2 | 1 | modules/PRD-RPT.md |
| ADM | Administration, workflow and operations console | 12 | 6 | 5 | 1 | modules/PRD-ADM.md |
| DOC | Documents and records | 6 | 3 | 3 | 0 | modules/PRD-DOC.md |
| SEC | Security, audit and compliance | 15 | 10 | 5 | 0 | modules/PRD-SEC.md |
| INT | Integrations and APIs | 13 | 12 | 0 | 1 | modules/PRD-INT.md |
| CHN | Channels: mobile app, PWA, USSD, SMS, WhatsApp, assisted/agent | 13 | 7 | 5 | 1 | modules/PRD-CHN.md |
| AI | AI capabilities | 10 | 2 | 1 | 7 | modules/PRD-AI.md |
| FIN | Financial products | 5 | 1 | 0 | 4 | modules/PRD-FIN.md |
| EGV | e-Government and service catalogue (optional pack) | 7 | 7 | 0 | 0 | modules/PRD-EGV.md |
| SVC | Services commerce (booking, delivery and completion of services; SVC-007 covers electronically delivered goods) | 12 | 2 | 10 | 0 | modules/PRD-SVC.md |
|  | Total | 434 | 337 | 76 | 21 |  |


### 7.1 PLT — Platform foundation and multi-client configuration

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-PLT-001 | Client instance provisioning | P1 | External system |
| PRD-PLT-002 | Client data isolation | P1 | Configuration |
| PRD-PLT-003 | Configuration packs | P1 | Code-level |
| PRD-PLT-004 | Settings change control | P1 | Code-level |
| PRD-PLT-005 | Configuration export, import and promotion | P1 | Code-level |
| PRD-PLT-006 | Branding and theme | P1 | Licensed plugin |
| PRD-PLT-007 | Custom domain and SSL | P1 | Configuration |
| PRD-PLT-008 | Email sender identity | P1 | Configuration |
| PRD-PLT-009 | Languages and language packs | P1 | Configuration |
| PRD-PLT-010 | Currencies and exchange rates | P1 | Configuration |
| PRD-PLT-011 | Time zone and formats | P1 | Configuration |
| PRD-PLT-012 | Fiscal calendar for reporting | P2 | Code-level |
| PRD-PLT-013 | Multi-store (B2B and B2C storefronts) | P1 | Configuration |
| PRD-PLT-014 | Instance health and SLA monitoring | P1 | External system |
| PRD-PLT-015 | Scalable, open architecture | P1 | Configuration |
| PRD-PLT-016 | Backup and disaster recovery | P1 | External system |
| PRD-PLT-017 | Responsive storefront | P1 | Configuration |
| PRD-PLT-018 | Accessibility | P1 | Code-level |
| PRD-PLT-019 | Contextual help and guided tours | P1 | Code-level |
| PRD-PLT-020 | Data retention and archival | P1 | Code-level |
| PRD-PLT-021 | Product release and upgrade management | P1 | External system |
| PRD-PLT-022 | Feature and module registry | P1 | Code-level |
| PRD-PLT-023 | Client data migration toolkit | P1 | Code-level |
| PRD-PLT-024 | Exchange-rate provider framework | P1 | Code-level |
| PRD-PLT-025 | Translation management | P1 | Code-level |
| PRD-PLT-026 | Hosting profile and sizing NFR | P1 | External system |
| PRD-PLT-027 | Data consistency safeguards | P2 | Code-level |

### 7.2 IAM — Identity, access and accounts

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-IAM-001 | Customer registration and login | P1 | Configuration |
| PRD-IAM-002 | Mobile-number identity with OTP | P1 | Code-level |
| PRD-IAM-003 | Password policy, lockout and recovery | P1 | Code-level |
| PRD-IAM-004 | Multi-factor authentication by role | P1 | Code-level |
| PRD-IAM-005 | Single sign-on for staff and B2B buyers | P2 | Code-level |
| PRD-IAM-006 | Session management | P1 | Code-level |
| PRD-IAM-007 | Roles and permissions | P1 | Configuration |
| PRD-IAM-008 | Scoped permissions | P1 | Code-level |
| PRD-IAM-009 | Permission delegation | P2 | Code-level |
| PRD-IAM-010 | User administration console | P1 | Code-level |
| PRD-IAM-011 | Staff invitation and access reviews | P1 | Code-level |
| PRD-IAM-012 | Authentication audit and suspicious-login detection | P1 | Code-level |
| PRD-IAM-013 | Passwordless and biometric login | P2 | Code-level |
| PRD-IAM-014 | Customer profile and address book | P1 | Code-level |
| PRD-IAM-015 | Pickup preference and preferred channel | P1 | Code-level |
| PRD-IAM-016 | Terms acceptance with versioning | P1 | Code-level |
| PRD-IAM-017 | Privacy rights | P1 | Code-level |
| PRD-IAM-018 | Account activity history | P1 | Code-level |
| PRD-IAM-019 | Account synchronisation with core systems | P1 | Code-level |
| PRD-IAM-020 | Identity verification adapter framework | P1 | External system |
| PRD-IAM-021 | Customer transaction history | P1 | Code-level |
| PRD-IAM-022 | B2B company accounts | P1 | Code-level |
| PRD-IAM-023 | B2B buyer registration and approval | P1 | Code-level |
| PRD-IAM-024 | Tax-exempt and VAT-registered buyers | P1 | Configuration |
| PRD-IAM-025 | Customer home dashboard | P2 | Code-level |
| PRD-IAM-026 | Assisted service by agents | P1 | Code-level |
| PRD-IAM-027 | Company cost centres and budgets | P2 | Code-level |

### 7.3 SEL — Sellers and marketplace onboarding

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-SEL-001 | Seller application and profile | P1 | Configuration |
| PRD-SEL-002 | Seller KYC documents | P1 | Code-level |
| PRD-SEL-003 | Seller verification workflow and tiers | P1 | Code-level |
| PRD-SEL-004 | Identity and registry verification adapters | P1 | External system |
| PRD-SEL-005 | Payout accounts and verification | P1 | Code-level |
| PRD-SEL-006 | Seller terms acceptance | P1 | Configuration |
| PRD-SEL-007 | Marketplace rules and listing eligibility | P1 | Code-level |
| PRD-SEL-008 | Seller dashboard and onboarding checklist | P1 | Code-level |
| PRD-SEL-009 | Seller staff accounts | P1 | Code-level |
| PRD-SEL-010 | Seller categorisation | P2 | Code-level |
| PRD-SEL-011 | Seller performance monitoring | P1 | Code-level |
| PRD-SEL-012 | Seller ratings | P1 | Code-level |
| PRD-SEL-013 | Block and watch lists | P1 | Code-level |
| PRD-SEL-014 | Approved supplier panels | P2 | Code-level |
| PRD-SEL-015 | Bulk participant import and invitation | P2 | Code-level |
| PRD-SEL-016 | Commission and fee rules | P1 | Code-level |
| PRD-SEL-017 | Seller settlements and payouts | P1 | Code-level |
| PRD-SEL-018 | Seller locations and fulfilment opt-in | P1 | Code-level |
| PRD-SEL-019 | Seller vacation mode | P1 | Code-level |
| PRD-SEL-020 | Seller notifications | P1 | Code-level |
| PRD-SEL-021 | Seller onboarding funnel report | P1 | Code-level |
| PRD-SEL-022 | Seller diversity tracking | P3 | Code-level |
| PRD-SEL-023 | Seller training content | P1 | Configuration |
| PRD-SEL-024 | Seller blacklisting | P1 | Code-level |
| PRD-SEL-025 | Commission invoicing to sellers | P2 | Code-level |

### 7.4 CAT — Catalogue and listings

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-CAT-001 | Category taxonomy | P1 | Configuration |
| PRD-CAT-002 | Product master record | P1 | Code-level |
| PRD-CAT-003 | Identifier patterns | P1 | Code-level |
| PRD-CAT-004 | Product and specification attributes | P1 | Configuration |
| PRD-CAT-005 | Category attribute schema and listing quality rules | P1 | Code-level |
| PRD-CAT-006 | Variants and attribute combinations | P1 | Configuration |
| PRD-CAT-007 | Bundles and kits | P1 | Code-level |
| PRD-CAT-008 | Product cloning and listing templates | P2 | Code-level |
| PRD-CAT-009 | Bulk import/export and PDF catalogue | P1 | Code-level |
| PRD-CAT-010 | Import validation report | P1 | Code-level |
| PRD-CAT-011 | Catalogue API | P1 | Licensed plugin |
| PRD-CAT-012 | Price tiers by customer group and quantity | P1 | Configuration |
| PRD-CAT-013 | Call-for-price / negotiable flag | P1 | Code-level |
| PRD-CAT-014 | Product tax category | P1 | Configuration |
| PRD-CAT-015 | Cross-border trade fields | P1 | Code-level |
| PRD-CAT-016 | Product media | P1 | Code-level |
| PRD-CAT-017 | Localised product content | P1 | Configuration |
| PRD-CAT-018 | Product questions and answers | P2 | Code-level |
| PRD-CAT-019 | Regulatory metadata and certificates | P2 | Code-level |
| PRD-CAT-020 | Origin and provenance content | P1 | Code-level |
| PRD-CAT-021 | Listing policy enforcement | P1 | Code-level |
| PRD-CAT-022 | Listing lifecycle and operator approval | P1 | Code-level |
| PRD-CAT-023 | Listing version history and autosave | P1 | Code-level |
| PRD-CAT-024 | Listing availability and withdrawal | P1 | Code-level |
| PRD-CAT-025 | Stale listing detection | P2 | Code-level |
| PRD-CAT-026 | Service listings | P1 | Code-level |
| PRD-CAT-027 | Service booking | P1 | Code-level |
| PRD-CAT-028 | Listing geo-location | P2 | Code-level |
| PRD-CAT-029 | Product reviews and ratings | P1 | Configuration |
| PRD-CAT-030 | Product returnability flag | P1 | Configuration |
| PRD-CAT-031 | Product page delivery promise | P1 | Code-level |
| PRD-CAT-032 | Catalogue audit log | P2 | Code-level |
| PRD-CAT-033 | Promoted listings with fees | P1 | Code-level |
| PRD-CAT-034 | Catalogue analytics | P1 | Code-level |
| PRD-CAT-035 | Listing syndication and product feeds | P2 | Code-level |
| PRD-CAT-036 | Catalogue segmentation by buyer channel | P1 | Configuration |
| PRD-CAT-037 | Order quantity rules | P2 | Code-level |
| PRD-CAT-038 | Guided seller listing wizard | P1 | Code-level |
| PRD-CAT-039 | Customer and company price lists | P1 | Configuration |
| PRD-CAT-040 | Company-specific assortment | P2 | Code-level |
| PRD-CAT-041 | Units of measure and pack selling | P1 | Code-level |
| PRD-CAT-042 | Fixed prices per currency | P1 | Code-level |
| PRD-CAT-043 | Seller listing moderation | P1 | Code-level |

### 7.5 INV — Inventory and warehouses

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-INV-001 | Stock tracking | P1 | Configuration |
| PRD-INV-002 | Multi-warehouse stock | P1 | Code-level |
| PRD-INV-003 | Low-stock thresholds and alerts | P1 | Configuration |
| PRD-INV-004 | Stock reservation and hold | P1 | Code-level |
| PRD-INV-005 | Stock adjustments with reason codes | P1 | Code-level |
| PRD-INV-006 | Goods receiving | P1 | Code-level |
| PRD-INV-007 | Warehouse transfers | P2 | Code-level |
| PRD-INV-008 | Cycle counts | P2 | Code-level |
| PRD-INV-009 | Batch and lot tracking | P2 | Code-level |
| PRD-INV-010 | Serial number tracking | P2 | Code-level |
| PRD-INV-011 | Expiry management | P2 | Code-level |
| PRD-INV-012 | WMS/ERP stock synchronisation | P1 | Code-level |
| PRD-INV-013 | Inventory analytics | P1 | Code-level |

### 7.6 SRC — Search, discovery and merchandising

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-SRC-001 | Keyword search | P1 | Configuration |
| PRD-SRC-002 | Search-as-you-type | P1 | Configuration |
| PRD-SRC-003 | Faceted filters | P1 | Code-level |
| PRD-SRC-004 | Location and delivery-option discovery | P1 | Code-level |
| PRD-SRC-005 | Sorting options | P1 | Code-level |
| PRD-SRC-006 | Category browse | P1 | Configuration |
| PRD-SRC-007 | Merchandising widgets and landing pages | P1 | Licensed plugin |
| PRD-SRC-008 | Rules-based recommendations | P1 | Configuration |
| PRD-SRC-009 | Personalised recommendations and ranking | P1 | External system |
| PRD-SRC-010 | Wishlist | P1 | Configuration |
| PRD-SRC-011 | Saved searches and watch alerts | P2 | Code-level |
| PRD-SRC-012 | Search history | P2 | Configuration |
| PRD-SRC-013 | Product comparison | P1 | Configuration |
| PRD-SRC-014 | Search engine: relevance, synonyms, multilingual | P1 | Code-level |
| PRD-SRC-015 | Trending and bestsellers | P2 | Code-level |
| PRD-SRC-016 | Taxonomy governance | P1 | Code-level |
| PRD-SRC-017 | Seller badges and featured sellers | P1 | Code-level |
| PRD-SRC-018 | Delivery promise on listing cards | P1 | Code-level |
| PRD-SRC-019 | Search result eligibility | P1 | Code-level |
| PRD-SRC-020 | Services browsing area | P1 | Configuration |
| PRD-SRC-021 | Web analytics | P1 | Configuration |
| PRD-SRC-022 | Accessible search and navigation | P1 | Code-level |
| PRD-SRC-023 | Low-connectivity resilience | P1 | Code-level |
| PRD-SRC-024 | Search API for channels | P1 | Code-level |
| PRD-SRC-025 | Unified search | P2 | Code-level |
| PRD-SRC-026 | Search performance and freshness | P2 | Configuration |
| PRD-SRC-027 | Storefront conveniences | P2 | Licensed plugin |

### 7.7 CHK — Cart and checkout

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-CHK-001 | Shopping cart | P1 | Code-level |
| PRD-CHK-002 | Checkout | P1 | Configuration |
| PRD-CHK-003 | Checkout validation | P1 | Code-level |
| PRD-CHK-004 | Multi-seller split checkout | P1 | Code-level |
| PRD-CHK-005 | Fulfilment method per line | P1 | Code-level |
| PRD-CHK-006 | Delivery slot and instructions | P1 | Code-level |
| PRD-CHK-007 | Structured address capture | P1 | Code-level |
| PRD-CHK-008 | Checkout resilience and idempotency | P1 | Code-level |
| PRD-CHK-009 | E-transactions consumer controls | P1 | Code-level |
| PRD-CHK-010 | Minimum order and fee thresholds | P1 | Configuration |
| PRD-CHK-011 | Cart restriction rules | P1 | Code-level |
| PRD-CHK-012 | Pickup code / QR | P1 | Code-level |
| PRD-CHK-013 | Assisted checkout | P1 | Code-level |
| PRD-CHK-014 | Estimated delivery at checkout | P1 | Code-level |
| PRD-CHK-015 | Checkout attributes | P1 | Configuration |
| PRD-CHK-016 | B2B on-account payment and credit limits | P1 | Code-level |
| PRD-CHK-017 | B2B quick order and bulk add | P1 | Licensed plugin |
| PRD-CHK-018 | B2B purchase approval | P1 | Code-level |
| PRD-CHK-019 | Order confirmation | P1 | Configuration |

### 7.8 PAY — Payments, tax, settlement and reconciliation

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-PAY-001 | Payment method framework and routing | P1 | Code-level |
| PRD-PAY-002 | Card payments (framework) | P1 | Code-level |
| PRD-PAY-003 | PayPal | P1 | Configuration |
| PRD-PAY-004 | Mobile money (framework) | P1 | Code-level |
| PRD-PAY-005 | Bank transfer | P1 | Code-level |
| PRD-PAY-006 | Letters of credit | P1 | Code-level |
| PRD-PAY-007 | Escrow and staged release | P1 | External system |
| PRD-PAY-008 | Cash on delivery and cash at outlet | P1 | Code-level |
| PRD-PAY-009 | Wallet and store credit | P1 | Code-level |
| PRD-PAY-010 | Split payments | P1 | Code-level |
| PRD-PAY-011 | Payment status lifecycle | P1 | Code-level |
| PRD-PAY-012 | Payment idempotency | P1 | Code-level |
| PRD-PAY-013 | Payment receipts | P1 | Code-level |
| PRD-PAY-014 | Payment reconciliation | P1 | Code-level |
| PRD-PAY-015 | Payment fees | P1 | Code-level |
| PRD-PAY-016 | Refunds | P1 | Code-level |
| PRD-PAY-017 | Chargebacks | P1 | Code-level |
| PRD-PAY-018 | Payment and order risk controls | P1 | Code-level |
| PRD-PAY-019 | Payments operations console | P1 | Code-level |
| PRD-PAY-020 | Tax calculation | P1 | Configuration |
| PRD-PAY-021 | Tax on fees and tax reporting | P1 | Code-level |
| PRD-PAY-022 | Bulk disbursements | P3 | Code-level |
| PRD-PAY-023 | Multi-currency settlement | P1 | Code-level |
| PRD-PAY-024 | Payment connector SDK | P1 | Code-level |
| PRD-PAY-025 | Fiscal e-invoicing framework | P1 | Code-level |
| PRD-PAY-026 | KRA eTIMS adapter | P1 | External system |
| PRD-PAY-027 | MRA EIS adapter | P1 | External system |
| PRD-PAY-028 | M-Pesa (Kenya) adapter | P1 | Code-level |
| PRD-PAY-029 | TNM Mpamba adapter | P1 | Code-level |
| PRD-PAY-030 | Airtel Money adapter | P1 | Code-level |
| PRD-PAY-031 | KTDA bank card gateway adapter | P1 | Code-level |
| PRD-PAY-032 | MPC card gateway adapter | P1 | Code-level |
| PRD-PAY-033 | Accounts receivable | P1 | Code-level |
| PRD-PAY-034 | Outlet receipt printing and cash-up | P1 | Code-level |
| PRD-PAY-035 | Direct payment to the seller | P2 | Code-level |
| PRD-PAY-036 | Offline direct payment confirmation | P2 | Code-level |

### 7.9 ORD — Orders and B2B transactions (RFQ, contracts, requisitions, offers, group buying)

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-ORD-001 | Order management console | P1 | Configuration |
| PRD-ORD-002 | Configurable order status model | P1 | Code-level |
| PRD-ORD-003 | Order interventions with reason codes and audit | P1 | Code-level |
| PRD-ORD-004 | Cancellation rules | P1 | Code-level |
| PRD-ORD-005 | Seller order processing | P1 | Code-level |
| PRD-ORD-006 | Partial fulfilment approval | P1 | Code-level |
| PRD-ORD-007 | Order numbering | P1 | Code-level |
| PRD-ORD-008 | Reorder | P1 | Configuration |
| PRD-ORD-009 | Invoices | P1 | Code-level |
| PRD-ORD-010 | Order holds | P1 | Code-level |
| PRD-ORD-011 | Cut-offs and service levels | P1 | Code-level |
| PRD-ORD-012 | Request for quotation | P1 | Code-level |
| PRD-ORD-013 | Quote negotiation and conversion | P1 | Code-level |
| PRD-ORD-014 | Seller offers | P1 | Code-level |
| PRD-ORD-015 | Configurable requisition workflows | P1 | Code-level |
| PRD-ORD-016 | Contract drafting | P1 | Code-level |
| PRD-ORD-017 | Contract e-signature | P2 | External system |
| PRD-ORD-018 | Contract amendments | P2 | Code-level |
| PRD-ORD-019 | Contract repository | P2 | Code-level |
| PRD-ORD-020 | Award and acceptance letters | P2 | Code-level |
| PRD-ORD-021 | Performance securities | P3 | Code-level |
| PRD-ORD-022 | Contract-to-order execution | P1 | Code-level |
| PRD-ORD-023 | Group buying | P2 | Code-level |
| PRD-ORD-024 | Scheme applications | P3 | Code-level |
| PRD-ORD-025 | Proforma invoice | P1 | Code-level |
| PRD-ORD-026 | Incoterms | P1 | Code-level |
| PRD-ORD-027 | Sample orders | P2 | Code-level |
| PRD-ORD-028 | Recurring and subscription orders | P2 | Code-level |

### 7.10 LOG — Shipping, logistics and fulfilment

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-LOG-001 | Shipping methods and rates | P1 | Configuration |
| PRD-LOG-002 | Delivery fee rule engine | P1 | Code-level |
| PRD-LOG-003 | Pickup points and outlets | P1 | Code-level |
| PRD-LOG-004 | Serviceability rules | P1 | Code-level |
| PRD-LOG-005 | Estimated delivery time engine | P1 | Code-level |
| PRD-LOG-006 | DHL adapter | P1 | Licensed plugin |
| PRD-LOG-007 | Shipping labels and barcodes | P1 | Code-level |
| PRD-LOG-008 | Fulfilment allocation and routing | P1 | Code-level |
| PRD-LOG-009 | Warehouse pick, pack, dispatch | P1 | Code-level |
| PRD-LOG-010 | Shipments | P1 | Configuration |
| PRD-LOG-011 | Logistics task creation and seller pickup | P1 | Code-level |
| PRD-LOG-012 | Proof of delivery record | P1 | Code-level |
| PRD-LOG-013 | Delivery exceptions | P1 | Code-level |
| PRD-LOG-014 | COD cash reconciliation | P1 | Code-level |
| PRD-LOG-015 | Address validation and geocoding | P1 | Code-level |
| PRD-LOG-016 | Cross-border shipping | P1 | External system |
| PRD-LOG-017 | Holding charges and pre-dispatch changes | P1 | Code-level |
| PRD-LOG-018 | Logistics KPIs | P1 | Code-level |
| PRD-LOG-019 | Specialised logistics | P3 | External system |
| PRD-LOG-020 | S10 identifiers | P1 | Code-level |
| PRD-LOG-021 | Carrier connector framework | P1 | Code-level |
| PRD-LOG-022 | Post-office drop-off acceptance | P1 | Code-level |
| PRD-LOG-023 | Hub-and-spoke sorting | P1 | External system |
| PRD-LOG-024 | Last-mile route lists and attempts | P1 | Code-level |
| PRD-LOG-025 | FedEx adapter | P1 | Code-level |
| PRD-LOG-026 | G4S adapter | P1 | Code-level |
| PRD-LOG-027 | Skynet adapter | P1 | Code-level |
| PRD-LOG-028 | Wells Fargo (Kenya) courier adapter | P1 | Code-level |
| PRD-LOG-029 | Aramex adapter | P1 | Code-level |
| PRD-LOG-030 | Shipping lines and agents adapter | P1 | Code-level |
| PRD-LOG-031 | MPC delivery partner adapters | P1 | Code-level |
| PRD-LOG-032 | Own-fleet POD capture | P1 | External system |

### 7.11 TRK — Tracking and notifications

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-TRK-001 | Buyer shipment tracking | P1 | Code-level |
| PRD-TRK-002 | Tracking event hub | P1 | Code-level |
| PRD-TRK-003 | Scanning and field operations app | P1 | External system |
| PRD-TRK-004 | Email notifications and templates | P1 | Code-level |
| PRD-TRK-005 | Notification engine (multi-channel) | P1 | Code-level |
| PRD-TRK-006 | Notification preferences | P1 | Code-level |
| PRD-TRK-007 | Notification delivery tracking and audit | P1 | Code-level |
| PRD-TRK-008 | In-app notification feed | P2 | Code-level |
| PRD-TRK-009 | Proactive outreach and outage notices | P1 | Code-level |
| PRD-TRK-010 | Seller shipment visibility | P1 | Configuration |
| PRD-TRK-011 | Guest order-status lookup | P1 | Licensed plugin |
| PRD-TRK-012 | Shipment and pickup event notifications | P1 | Code-level |

### 7.12 RET — Returns, refunds and disputes

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-RET-001 | Return requests | P1 | Configuration |
| PRD-RET-002 | Return eligibility rules | P1 | Code-level |
| PRD-RET-003 | Return logistics | P1 | Code-level |
| PRD-RET-004 | Return inspection | P1 | Code-level |
| PRD-RET-005 | Automatic refund trigger | P1 | Code-level |
| PRD-RET-006 | Return fees | P1 | Code-level |
| PRD-RET-007 | Dispute and issue cases | P1 | Code-level |
| PRD-RET-008 | Dispute SLAs and escalation | P1 | Code-level |
| PRD-RET-009 | Case retention and reports | P1 | Code-level |
| PRD-RET-010 | Seller return review | P1 | Code-level |
| PRD-RET-011 | Buyer–seller mediation | P1 | Code-level |

### 7.13 CRM — Customer service, help desk and chat

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-CRM-001 | Help desk ticketing | P1 | Licensed plugin |
| PRD-CRM-002 | Multi-channel case intake | P1 | Code-level |
| PRD-CRM-003 | Agent 360° view | P1 | Code-level |
| PRD-CRM-004 | Complaints process | P1 | Code-level |
| PRD-CRM-005 | Support quality analytics | P1 | Code-level |
| PRD-CRM-006 | Ticket collaboration and audit | P1 | Code-level |
| PRD-CRM-007 | Knowledge base | P1 | Code-level |
| PRD-CRM-008 | Live web chat | P1 | Licensed plugin |
| PRD-CRM-009 | Contact and messaging | P1 | Configuration |
| PRD-CRM-010 | Fraud reporting and referral | P1 | Code-level |
| PRD-CRM-011 | Experience feedback | P1 | Code-level |
| PRD-CRM-012 | Support channel directory | P2 | Code-level |
| PRD-CRM-013 | Community forums | P3 | Configuration |
| PRD-CRM-014 | Issue routing and escalation | P1 | Code-level |
| PRD-CRM-015 | B2B account management | P2 | Code-level |

### 7.14 MKT — Marketing, promotions, loyalty, content and SEO

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-MKT-001 | Discounts and coupons | P1 | Configuration |
| PRD-MKT-002 | Advanced promotions | P1 | Code-level |
| PRD-MKT-003 | Reward points | P1 | Configuration |
| PRD-MKT-004 | Gift cards and vouchers | P1 | Configuration |
| PRD-MKT-005 | Newsletter and email campaigns | P1 | Configuration |
| PRD-MKT-006 | On-site pop-ups | P1 | Code-level |
| PRD-MKT-007 | Content management | P1 | Configuration |
| PRD-MKT-008 | Content approval and policy versioning | P1 | Code-level |
| PRD-MKT-009 | SEO | P1 | Configuration |
| PRD-MKT-010 | Marketing tags and social | P1 | Configuration |
| PRD-MKT-011 | Customer segmentation attributes | P1 | Code-level |
| PRD-MKT-012 | Abandoned-cart recovery | P2 | Configuration |
| PRD-MKT-013 | Affiliates and referrals | P2 | Code-level |
| PRD-MKT-014 | Seller-managed pricing and promotions | P1 | Configuration |

### 7.15 RPT — Reporting and analytics

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-RPT-001 | Standard reports and dashboard | P1 | Code-level |
| PRD-RPT-002 | KPI framework and executive dashboards | P1 | External system |
| PRD-RPT-003 | Data warehouse and ETL | P1 | External system |
| PRD-RPT-004 | Report delivery and self-service | P1 | External system |
| PRD-RPT-005 | Report access control | P1 | External system |
| PRD-RPT-006 | Compliance and audit reports | P1 | External system |
| PRD-RPT-007 | Public transparency dashboard | P3 | Code-level |
| PRD-RPT-008 | External BI connectivity | P2 | Licensed plugin |
| PRD-RPT-009 | Operator performance metrics | P2 | Code-level |
| PRD-RPT-010 | Operational dashboards | P1 | External system |
| PRD-RPT-011 | Commerce and marketing analytics | P1 | External system |
| PRD-RPT-012 | e-Government and engagement reports | P1 | External system |

### 7.16 ADM — Administration, workflow and operations console

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-ADM-001 | Administration console | P1 | Configuration |
| PRD-ADM-002 | Workflow engine | P1 | Code-level |
| PRD-ADM-003 | Business rules engine | P1 | Code-level |
| PRD-ADM-004 | Transaction types and parameter schema | P2 | Code-level |
| PRD-ADM-005 | Eligibility and quota rules | P2 | Code-level |
| PRD-ADM-006 | Approval queues | P1 | Code-level |
| PRD-ADM-007 | Operations console and work queues | P1 | Code-level |
| PRD-ADM-008 | Upload and content scanning controls | P1 | Code-level |
| PRD-ADM-009 | Exception management | P2 | Code-level |
| PRD-ADM-010 | Operational alerts | P2 | Code-level |
| PRD-ADM-011 | Template library | P2 | Code-level |
| PRD-ADM-012 | Template analytics and shared marketplace | P3 | Code-level |

### 7.17 DOC — Documents and records

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-DOC-001 | Document generation | P1 | Code-level |
| PRD-DOC-002 | Document storage | P1 | Code-level |
| PRD-DOC-003 | Document integrity | P2 | Code-level |
| PRD-DOC-004 | Document review and compliance export | P2 | Code-level |
| PRD-DOC-005 | Document requirements and validation | P2 | External system |
| PRD-DOC-006 | Export document set | P1 | Code-level |

### 7.18 SEC — Security, audit and compliance

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-SEC-001 | Encryption and transport security | P1 | Configuration |
| PRD-SEC-002 | Edge protection | P1 | External system |
| PRD-SEC-003 | PCI-DSS scope control | P1 | Configuration |
| PRD-SEC-004 | Platform audit trail | P1 | Code-level |
| PRD-SEC-005 | Anomaly and correlation detection | P2 | External system |
| PRD-SEC-006 | Data residency | P1 | External system |
| PRD-SEC-007 | Consent and privacy tools | P1 | Configuration |
| PRD-SEC-008 | Breach notification workflow | P1 | Code-level |
| PRD-SEC-009 | Compliance reports and certificates | P2 | External system |
| PRD-SEC-010 | Auditor read-only access | P2 | Code-level |
| PRD-SEC-011 | Vulnerability management | P1 | External system |
| PRD-SEC-012 | Country data-protection pack | P1 | Code-level |
| PRD-SEC-013 | Bot protection | P1 | Configuration |
| PRD-SEC-014 | Data classification and masking | P2 | Code-level |
| PRD-SEC-015 | Security incident management | P2 | External system |

### 7.19 INT — Integrations and APIs

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-INT-001 | Public REST API | P1 | Code-level |
| PRD-INT-002 | Integration layer (API gateway) | P1 | External system |
| PRD-INT-003 | Webhooks and events | P1 | Code-level |
| PRD-INT-004 | Integration health and retries | P1 | External system |
| PRD-INT-005 | ERP and finance connector framework | P1 | Code-level |
| PRD-INT-006 | SAGE 200 adapter | P1 | Code-level |
| PRD-INT-007 | PostGlobal adapter | P1 | Code-level |
| PRD-INT-008 | Banking integrations | P1 | Code-level |
| PRD-INT-009 | Government system connector framework | P1 | Code-level |
| PRD-INT-010 | Master data synchronisation | P1 | Code-level |
| PRD-INT-011 | Plugin extensibility | P1 | Configuration |
| PRD-INT-012 | Punch-out | P3 | Configuration |
| PRD-INT-013 | MANEPS adapter | P1 | Code-level |

### 7.20 CHN — Channels: mobile app, PWA, USSD, SMS, WhatsApp, assisted/agent

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-CHN-001 | Native mobile apps | P1 | Licensed plugin |
| PRD-CHN-002 | PWA and low-bandwidth mode | P1 | Code-level |
| PRD-CHN-003 | USSD channel | P1 | External system |
| PRD-CHN-004 | IVR channel | P2 | External system |
| PRD-CHN-005 | SMS gateway and SMS commands | P1 | Code-level |
| PRD-CHN-006 | WhatsApp Business | P1 | Code-level |
| PRD-CHN-007 | WeChat | P1 | Code-level |
| PRD-CHN-008 | Telegram bot | P3 | Code-level |
| PRD-CHN-009 | Agent and correspondent networks | P2 | Code-level |
| PRD-CHN-010 | Field agent app | P2 | External system |
| PRD-CHN-011 | Social media integration | P1 | Configuration |
| PRD-CHN-012 | SMS sender ID and opt-out | P2 | Code-level |
| PRD-CHN-013 | Push notifications | P2 | Code-level |

### 7.21 AI — AI capabilities

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-AI-001 | AI translation | P3 | Code-level |
| PRD-AI-002 | AI listing assistance | P3 | Code-level |
| PRD-AI-003 | AI chatbot | P1 | Code-level |
| PRD-AI-004 | AI drafting and summarisation | P3 | Code-level |
| PRD-AI-005 | OCR and ID document checks | P2 | External system |
| PRD-AI-006 | ML fraud detection | P3 | External system |
| PRD-AI-007 | ML recommendation engine | P3 | External system |
| PRD-AI-008 | Forecasting and image inspection | P3 | External system |
| PRD-AI-009 | AI contract and letter drafting | P3 | Code-level |
| PRD-AI-010 | AI governance | P1 | External system |

### 7.22 FIN — Financial products

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-FIN-001 | Credit marketplace | P3 | External system |
| PRD-FIN-002 | Invoice discounting | P3 | External system |
| PRD-FIN-003 | Insurance | P3 | External system |
| PRD-FIN-004 | Subsidies and incentives | P3 | Code-level |
| PRD-FIN-005 | Financial and partner services catalogue | P1 | Code-level |

### 7.23 EGV — e-Government and service catalogue (optional pack)

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-EGV-001 | e-Government service catalogue | P1 | Configuration |
| PRD-EGV-002 | Service applications | P1 | Code-level |
| PRD-EGV-003 | Appointments | P1 | Code-level |
| PRD-EGV-004 | Document delivery | P1 | Code-level |
| PRD-EGV-005 | Government fee collection | P1 | Code-level |
| PRD-EGV-006 | Agency administration | P1 | Code-level |
| PRD-EGV-007 | Digital ID service workflows | P1 | Code-level |

### 7.24 SVC — Services commerce (booking, delivery and completion of services; SVC-007 covers electronically delivered goods)

| PRD ID | Feature | Phase | Implementation |
|---|---|---|---|
| PRD-SVC-001 | Service pricing models | P2 | Code-level |
| PRD-SVC-002 | Service providers and resources | P2 | Code-level |
| PRD-SVC-003 | Booking changes, cancellations and no-shows | P2 | Code-level |
| PRD-SVC-004 | Deposits and advance payment for bookings | P2 | Code-level |
| PRD-SVC-005 | Service order lifecycle and completion sign-off | P1 | Code-level |
| PRD-SVC-006 | Service location at booking | P2 | Code-level |
| PRD-SVC-007 | Digital products and downloads | P2 | Configuration |
| PRD-SVC-008 | Rental and hire | P2 | Code-level |
| PRD-SVC-009 | Service vouchers and e-tickets | P2 | Code-level |
| PRD-SVC-010 | Service reminders and follow-up | P2 | Code-level |
| PRD-SVC-011 | Service-level targets for service orders | P1 | Code-level |
| PRD-SVC-012 | Service reports | P2 | Code-level |


Services commerce is also mapped as a customer journey in the workbook sheet "Services view" (31 steps).


## 8. Cross-cutting requirements (non-functional)

### 8.1 Client-stated non-functional requirements — ToR level (29)

Selected by requirement type: every KTDA and Malawi Post ToR-level requirement in a non-functional area (security, hosting, environments, architecture, resilience, audit, UX, support), plus KTDA CHK-003 (easy-to-use checkout), LEG-001 (regulatory and data-protection compliance) and ANL-008 (lawful data collection). Support items are project services (SLA), listed because they state targets. Text is quoted from the source extraction; numbers appear only where the source states them.

| Requirement | Area | Requirement (source text) | Delivered by (P1) |
|---|---|---|---|
| REQ-KTDA-UX-001 | UX & design | Responsive on mobile, tablet and desktop. | PRD-PLT-017 |
| REQ-KTDA-CHK-003 | Cart & checkout | Easy-to-use checkout. | PRD-CHK-002 |
| REQ-KTDA-NFR-001 | Non-functional | Scalable; new features can be added. | PRD-INT-011, PRD-PLT-015 |
| REQ-KTDA-LEG-001 | Legal & compliance | Comply with local and international e-commerce, trade and data protection regulations. | PRD-CAT-015, PRD-CHK-009, PRD-DOC-006, PRD-IAM-017, PRD-ORD-026, PRD-SEC-007, PRD-SEC-012 |
| REQ-KTDA-SEC-001 | Security | PCI-DSS compliance. | PRD-SEC-003 |
| REQ-KTDA-UX-002 | UX & design | Clean, modern, user-friendly interface aligned with KTDA branding (RFP §IV f.i). | PRD-PLT-006 |
| REQ-KTDA-SUP-001 | Support | Minimum 12 months post-implementation support. |  |
| REQ-KTDA-ENV-001 | Environments | UAT environment before production. | PRD-PLT-001 |
| REQ-KTDA-HST-001 | Hosting | Secure, scalable hosting; cloud preferred (AWS, Azure). | PRD-PLT-015, PRD-SEC-002 |
| REQ-KTDA-SEC-002 | Security | Best-practice cybersecurity incl. firewall, SSL, DDoS protection. | PRD-SEC-001, PRD-SEC-002 |
| REQ-KTDA-ANL-008 | Analytics | Lawful data collection for analytics and customer insights. | PRD-IAM-017, PRD-SEC-007, PRD-SEC-012 |
| REQ-MPC-ARC-001 | Architecture | Three-tier architecture: database servers, application servers, clients; data warehouse for data storage. | PRD-PLT-015, PRD-RPT-003 |
| REQ-MPC-ARC-002 | Architecture | Browser-based access. | PRD-PLT-015 |
| REQ-MPC-ARC-003 | Architecture | Open, non-proprietary database architecture. | PRD-PLT-015 |
| REQ-MPC-ARC-004 | Architecture | Compatible with Windows Server 2019 or newest at implementation. | PRD-PLT-015 |
| REQ-MPC-ARC-005 | Architecture | Extensible design for future expansion. | PRD-PLT-015 |
| REQ-MPC-AUD-001 | Audit | Transaction audit trail, exportable in different formats. | PRD-SEC-004 |
| REQ-MPC-HST-001 | Hosting | Assess the hosting environment; deliver a hosting assessment report. |  |
| REQ-MPC-HST-002 | Hosting | Cloud hosting for the first 6 months, minimum 2 TB storage, 4 cores @2.0 GHz, 8 GB RAM. | PRD-PLT-026 |
| REQ-MPC-NFR-001 | Resilience | Disaster recovery approach ensuring high availability. | PRD-PLT-016 |
| REQ-MPC-NFR-002 | Resilience | Online backup without interrupting core operations. | PRD-PLT-016 |
| REQ-MPC-SEC-001 | Security | Security against hacking/tampering, unauthorised access, and for data in transit. | PRD-SEC-001, PRD-SEC-002 |
| REQ-MPC-SUP-001 | Support | 18 months post-implementation support. |  |
| REQ-MPC-SUP-002 | Support | Support SLA: critical 1 h, high 4 h, medium 8 h. |  |
| REQ-MPC-SUP-003 | Support | Second-level help desk with machine-learning abilities for bugs and errors. |  |
| REQ-MPC-UX-001 | UX | User-friendly platform and ordering system. | PRD-CHK-002, PRD-PLT-017, PRD-SRC-006 |
| REQ-MPC-UX-002 | UX | PC- and mobile-friendly platform. | PRD-PLT-017 |
| REQ-MPC-UX-003 | UX | Runs smoothly on mobile web browsers. | PRD-PLT-017 |
| REQ-MPC-UX-004 | UX | Multiple navigation options suited to user experience levels. | PRD-SRC-001, PRD-SRC-003, PRD-SRC-006 |

### 8.2 Malawi Post FRs with non-functional content (32)

Inference (reviewer classification, BA-908): these functional requirements state a quality the system must have rather than a feature.

| Requirement | Type | Requirement (source text) | Delivered by (P1) |
|---|---|---|---|
| REQ-MPC-FR-012 | Security / identity | The Platform shall support MFA for privileged administrative roles. | PRD-IAM-004 |
| REQ-MPC-FR-013 | Security / identity | The Platform shall enforce configurable session timeout and idle logout for authenticated users. | PRD-IAM-006 |
| REQ-MPC-FR-015 | Security / identity | The Platform shall log all authentication events and expose them for security monitoring and audit. | PRD-IAM-012 |
| REQ-MPC-FR-021 | Security / identity | The Platform shall provide configurable account security policies (password policy, lockout thresholds, MFA enforcement) aligned to MPC security program. | PRD-IAM-003, PRD-IAM-004 |
| REQ-MPC-FR-121 | Security / identity | The Platform shall provide a secure checkout session and prevent tampering with price/totals between client and server. | PRD-CHK-002 |
| REQ-MPC-FR-263 | Security / identity | The Platform shall support role-based permissions for support agents to restrict access to sensitive personal data. | PRD-CRM-003 |
| REQ-MPC-FR-338 | Security / identity | The Platform shall implement secure authentication and authorization for APIs (e.g., OAuth2/OpenID Connect or equivalent) as supported by the selected API gateway. | PRD-INT-001, PRD-INT-002 |
| REQ-MPC-FR-339 | Security / identity | The Platform shall implement API rate limiting, throttling, and abuse detection for external clients. | PRD-INT-002 |
| REQ-MPC-FR-010 | Privacy | The Platform shall provide a consent management mechanism for cookies/tracking and marketing communications as applicable. | PRD-IAM-017, PRD-SEC-007 |
| REQ-MPC-FR-017 | Privacy | The Platform shall provide a mechanism for users to request access to their personal data and obtain an export (DSAR). | PRD-IAM-017, PRD-SEC-007 |
| REQ-MPC-FR-018 | Privacy | The Platform shall provide a mechanism for users to request correction of personal information used for orders and deliveries. | PRD-IAM-017 |
| REQ-MPC-FR-293 | Privacy | The Platform shall provide a mechanism to anonymize/pseudonymize data for analytics when required by policy. | PRD-RPT-003 |
| REQ-MPC-FR-175 | Audit | The Platform shall maintain immutable audit logs for all order state transitions and key order field changes. | PRD-ORD-003 |
| REQ-MPC-FR-274 | Audit | The Platform shall provide audit logs for all ticket modifications (status changes, assignment, edits) with actor and timestamp. | PRD-CRM-006 |
| REQ-MPC-FR-287 | Audit | The Platform shall provide audit log reporting (logins, admin actions, configuration changes) for security and compliance monitoring. | PRD-PLT-004, PRD-RPT-006, PRD-SEC-004 |
| REQ-MPC-FR-298 | Audit | The Platform shall provide user management and access audit reports (role assignments, privileged accounts, MFA status). | PRD-IAM-011 |
| REQ-MPC-FR-318 | Audit | The Platform shall provide audit logs for all administrative configuration changes including actor, timestamp, old/new values. | PRD-PLT-004 |
| REQ-MPC-FR-225 | Retention | The Platform shall support tracking event retention and archival rules consistent with compliance requirements and operational needs. | PRD-PLT-020, PRD-TRK-002 |
| REQ-MPC-FR-248 | Retention | The Platform shall support configurable retention of dispute/return case records and evidence per data retention policy. | PRD-RET-009 |
| REQ-MPC-FR-322 | Retention | The Platform shall support configuration of data retention and archival rules for key modules (orders, payments, tickets, logs). | PRD-PLT-020 |
| REQ-MPC-FR-114 | Resilience / integrity | The Platform shall provide a checkout failure recovery workflow (resume checkout after payment interruption) with idempotency controls. | PRD-CHK-008 |
| REQ-MPC-FR-135 | Resilience / integrity | The Platform shall implement idempotency for payment initiation to prevent duplicate charges under retry conditions. | PRD-PAY-012 |
| REQ-MPC-FR-297 | Resilience / integrity | The Platform shall provide data backup and restore reporting (backup success, last restore test) for audit. | PRD-PLT-016 |
| REQ-MPC-FR-290 | Monitoring / performance | The Platform shall provide monitoring of system health and usage analytics (page views, API calls) with alerts on anomalies. | PRD-PLT-014 |
| REQ-MPC-FR-299 | Monitoring / performance | The Platform shall provide performance dashboards for system response times and key transaction latencies (search, checkout, payment confirmation). | PRD-PLT-014 |
| REQ-MPC-FR-342 | Monitoring / performance | The Platform shall support integration health monitoring and alerting for API failures and latency thresholds. | PRD-INT-004 |
| REQ-MPC-FR-019 | Low bandwidth / accessibility | The Platform shall provide accessibility features suitable for low-bandwidth and low-end devices (lightweight web/app experience). | PRD-CHN-002 |
| REQ-MPC-FR-092 | Low bandwidth / accessibility | The Platform shall provide accessibility-friendly search and navigation (keyboard navigation, screen-reader labels) as applicable to web channels. | PRD-SRC-022 |
| REQ-MPC-FR-096 | Low bandwidth / accessibility | The Platform shall provide offline-friendly error handling and retry prompts for search under intermittent connectivity. | PRD-SRC-023 |
| REQ-MPC-FR-324 | Uploads | The Platform shall provide system parameter configuration for maximum file upload sizes, supported file types, and content scanning controls. | PRD-ADM-008 |
| REQ-MPC-FR-347 | API lifecycle | The Platform shall maintain integration change logs and provide backward compatibility policies for API versioning. | PRD-INT-001 |
| REQ-MPC-FR-148 | Encryption | The Platform shall encrypt payment-related data at rest and in transit, and shall never store sensitive card data in cleartext. | PRD-SEC-001, PRD-SEC-003 |

### 8.3 Cross-cutting requirements adopted for the product (NFR-X)

| ID | Requirement | Basis type | Basis |
|---|---|---|---|
| NFR-X-001 | Security: no high or critical vulnerability in the dependency scan of any Increment; card data never stored; access limited by role. | Proposed (DoD 5, to be adopted by the Scrum Team); card-data part client-stated | DoD 5; PRD-SEC-001, SEC-003, SEC-011; REQ-KTDA-SEC-002; REQ-MPC-FR-148, FR-012, FR-013, FR-015, FR-021. The card-data part is native in 5.00.1: card storage was removed from the platform (§6.1) |
| NFR-X-002 | Privacy: personal data handled under the country data-protection profile, with consent, export, deletion, retention and breach handling. Law names (Kenya DPA 2019; Malawi DPA 2024) are inference (DP-01). | Client-stated (KTDA LEG-001, ANL-008; MPC FRs); law names inference | PRD-SEC-007, SEC-008, SEC-012, SEC-014; REQ-MPC-FR-010, FR-017, FR-018, FR-293, FR-225, FR-248, FR-322 |
| NFR-X-003 | Audit: important actions logged to the platform audit trail with before/after values. | Client-stated | PRD-SEC-004, implemented by an IRepository<> decorator, not entity events (EntityUpdatedEvent carries only the new entity; some writes bypass events); REQ-MPC-FR-175, FR-274, FR-287, FR-298, FR-318 |
| NFR-X-004 | Localisation: all user-facing text in language resources; right-to-left layout required for Arabic (KTDA LOC-001; inference, gap KG-14). | Client-stated (languages); right-to-left inference | DoD 8; PRD-PLT-009, PLT-025 |
| NFR-X-005 | Accessibility: WCAG 2.1 AA is proposed; the client states keyboard navigation and screen-reader support only (FR-092). | Proposed (DoD 9); client-stated in part | DoD 9; PRD-PLT-018; REQ-MPC-FR-092 |
| NFR-X-006 | Devices and networks: phone, tablet and desktop; low-bandwidth behaviour. Page-weight / load-time target: Not stated in source — requires confirmation. | Proposed (DoD 10); low-bandwidth client-stated | DoD 10; PRD-PLT-017, CHN-002; REQ-MPC-FR-019, FR-096 |
| NFR-X-007 | Data consistency: state-changing requests are idempotent; key tables use optimistic concurrency. | Proposed; idempotency client-stated (FR-135) | PRD-PLT-027 (row-version columns on core tables are a registered core modification; idempotency keys are plugin middleware), CHK-008; REQ-MPC-FR-114, FR-135, FR-297 |
| NFR-X-008 | Configuration: no client-specific code in core; new settings added to the configuration-pack schema. | Proposed (DoD 2) | DoD 2; §6.5 |
| NFR-X-009 | Service levels: response-time SLA stated by Malawi Post SUP-002 (1 h critical, 4 h high, 8 h medium; response or resolution not stated). Performance, availability, recovery time and recovery point: Not stated in source — requires confirmation (gaps KG-18, KG-02 volumes, MG-13). The catalog states search latency three different ways (FCAT-10); none is adopted. | Client-stated (SUP-002); rest gap | REQ-MPC-SUP-002; REQ-MPC-FR-290, FR-299, FR-342 |


## 9. Integrations and external interfaces

### 9.1 Integration features (103)

Inclusion rule: every feature in the INT area, every feature whose implementation is External system, whose code change type includes an integration plugin, or which is an adapter, connector, connection framework, API, channel gateway or data synchronisation.

| PRD ID | Feature | Phase | Implementation | Code change | Requirements delivered | On hold |
|---|---|---|---|---|---|---|
| PRD-PLT-001 | Client instance provisioning | P1 | External system | External system + integration plugin | REQ-KTDA-ENV-001 |  |
| PRD-PLT-014 | Instance health and SLA monitoring | P1 | External system | External system + integration plugin | REQ-MPC-FR-290, REQ-MPC-FR-299 |  |
| PRD-PLT-016 | Backup and disaster recovery | P1 | External system | External system + integration plugin | REQ-MPC-NFR-001, REQ-MPC-NFR-002, REQ-MPC-FR-297 |  |
| PRD-PLT-021 | Product release and upgrade management | P1 | External system | External system + integration plugin |  |  |
| PRD-PLT-024 | Exchange-rate provider framework | P1 | Code-level | Custom plugin | REQ-KTDA-LOC-002 |  |
| PRD-PLT-026 | Hosting profile and sizing NFR | P1 | External system | External system + integration plugin | REQ-MPC-HST-002 | C-SIZE |
| PRD-IAM-019 | Account synchronisation with core systems | P1 | Code-level | External system + integration plugin | REQ-MPC-FR-020 |  |
| PRD-IAM-020 | Identity verification adapter framework | P1 | External system | External system + integration plugin | REQ-MPC-FR-344 |  |
| PRD-SEL-004 | Identity and registry verification adapters | P1 | External system | External system + integration plugin | REQ-MPC-FR-047 |  |
| PRD-CAT-011 | Catalogue API | P1 | Licensed plugin | None | REQ-MPC-FR-072 | API-01, PAID-STUB, API-GW |
| PRD-CAT-015 | Cross-border trade fields | P1 | Code-level | Custom plugin | REQ-KTDA-CUS-002, REQ-KTDA-LEG-001, REQ-MPC-FR-063 |  |
| PRD-INV-012 | WMS/ERP stock synchronisation | P1 | Code-level | External system + integration plugin | REQ-KTDA-INT-001 | PAID-STUB |
| PRD-SRC-001 | Keyword search | P1 | Configuration | None (configuration of bundled plugin + external Google Cloud Retail account) | REQ-KTDA-SRC-001, REQ-MPC-FR-076, REQ-MPC-UX-004 |  |
| PRD-SRC-009 | Personalised recommendations and ranking | P1 | External system | External system + integration plugin | REQ-MPC-FR-081 |  |
| PRD-SRC-024 | Search API for channels | P1 | Code-level | Custom plugin | REQ-MPC-FR-097 | PAID-STUB |
| PRD-PAY-001 | Payment method framework and routing | P1 | Code-level | Custom plugin | REQ-KTDA-PAY-007, REQ-MPC-FR-116, REQ-MPC-FR-305, REQ-MPC-PAY-001 |  |
| PRD-PAY-002 | Card payments (framework) | P1 | Code-level | Custom plugin | REQ-KTDA-PAY-002, REQ-KTDA-PAY-001, REQ-KTDA-PAY-007, REQ-MPC-FR-129, REQ-MPC-PAY-001 |  |
| PRD-PAY-003 | PayPal | P1 | Configuration | None | REQ-KTDA-PAY-003, REQ-KTDA-PAY-007 | K-08 |
| PRD-PAY-004 | Mobile money (framework) | P1 | Code-level | Custom plugin | REQ-KTDA-PAY-004, REQ-MPC-FR-126, REQ-MPC-FR-127, REQ-MPC-FR-140, REQ-MPC-FR-244, REQ-MPC-PAY-001 |  |
| PRD-PAY-005 | Bank transfer | P1 | Code-level | Custom plugin | REQ-KTDA-PAY-005, REQ-KTDA-INT-002, REQ-MPC-FR-128, REQ-MPC-PAY-001 |  |
| PRD-PAY-007 | Escrow and staged release | P1 | External system | External system + integration plugin | REQ-KTDA-PAY-008 | PAY-DIRECT / LIC-01 |
| PRD-PAY-024 | Payment connector SDK | P1 | Code-level | Custom plugin | REQ-KTDA-PAY-007, REQ-MPC-FR-330, REQ-MPC-PAY-001 |  |
| PRD-PAY-025 | Fiscal e-invoicing framework | P1 | Code-level | Custom plugin | REQ-KTDA-ORD-002, REQ-KTDA-TAX-001 | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-026 | KRA eTIMS adapter | P1 | External system | External system + integration plugin |  | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-027 | MRA EIS adapter | P1 | External system | External system + integration plugin |  | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-028 | M-Pesa (Kenya) adapter | P1 | Code-level | Custom plugin | REQ-KTDA-PAY-004 |  |
| PRD-PAY-029 | TNM Mpamba adapter | P1 | Code-level | Custom plugin | REQ-MPC-FR-126, REQ-MPC-FR-330, REQ-MPC-PAY-001 |  |
| PRD-PAY-030 | Airtel Money adapter | P1 | Code-level | Custom plugin | REQ-MPC-FR-127, REQ-MPC-FR-330, REQ-MPC-PAY-001 |  |
| PRD-PAY-031 | KTDA bank card gateway adapter | P1 | Code-level | Custom plugin | REQ-KTDA-PAY-001, REQ-KTDA-PAY-002 | KG-04 |
| PRD-PAY-032 | MPC card gateway adapter | P1 | Code-level | Custom plugin | REQ-MPC-FR-129, REQ-MPC-PAY-001 | MG-03 |
| PRD-ORD-017 | Contract e-signature | P2 | External system | External system + integration plugin |  | DOC-LIB |
| PRD-LOG-006 | DHL adapter | P1 | Licensed plugin | None | REQ-KTDA-LOG-003, REQ-KTDA-INT-003 |  |
| PRD-LOG-016 | Cross-border shipping | P1 | External system | External system + integration plugin | REQ-MPC-FR-190, REQ-MPC-FR-191, REQ-MPC-FR-329, REQ-MPC-FR-221 |  |
| PRD-LOG-019 | Specialised logistics | P3 | External system | External system + integration plugin |  |  |
| PRD-LOG-021 | Carrier connector framework | P1 | Code-level | Custom plugin | REQ-KTDA-INT-003, REQ-KTDA-LOG-003, REQ-MPC-FR-180 |  |
| PRD-LOG-023 | Hub-and-spoke sorting | P1 | External system | External system + integration plugin | REQ-MPC-FR-192 | FG-06 |
| PRD-LOG-025 | FedEx adapter | P1 | Code-level | Custom plugin | REQ-KTDA-LOG-003 |  |
| PRD-LOG-026 | G4S adapter | P1 | Code-level | Custom plugin | REQ-KTDA-LOG-003 |  |
| PRD-LOG-027 | Skynet adapter | P1 | Code-level | Custom plugin | REQ-KTDA-LOG-003 |  |
| PRD-LOG-028 | Wells Fargo (Kenya) courier adapter | P1 | Code-level | Custom plugin | REQ-KTDA-LOG-003 |  |
| PRD-LOG-029 | Aramex adapter | P1 | Code-level | Custom plugin | REQ-KTDA-LOG-003 |  |
| PRD-LOG-030 | Shipping lines and agents adapter | P1 | Code-level | Custom plugin | REQ-KTDA-LOG-003 |  |
| PRD-LOG-031 | MPC delivery partner adapters | P1 | Code-level | Custom plugin | REQ-MPC-FR-180 |  |
| PRD-LOG-032 | Own-fleet POD capture | P1 | External system | External system + integration plugin | REQ-MPC-FR-187 | FG-06, PAID-STUB |
| PRD-TRK-002 | Tracking event hub | P1 | Code-level | Custom plugin | REQ-KTDA-INT-003, REQ-KTDA-LOG-003, REQ-MPC-FR-203, REQ-MPC-FR-209, REQ-MPC-FR-221, REQ-MPC-FR-225, REQ-MPC-ORD-001 |  |
| PRD-TRK-003 | Scanning and field operations app | P1 | External system | External system + integration plugin | REQ-MPC-FR-204, REQ-MPC-FR-224 | FG-06 |
| PRD-TRK-005 | Notification engine (multi-channel) | P1 | Code-level | Custom plugin | REQ-MPC-FR-214, REQ-MPC-FR-159, REQ-MPC-FR-212, REQ-MPC-FR-310 |  |
| PRD-CRM-002 | Multi-channel case intake | P1 | Code-level | Custom plugin | REQ-MPC-FR-253, REQ-MPC-FR-260 |  |
| PRD-CRM-008 | Live web chat | P1 | Licensed plugin | None | REQ-KTDA-CHT-001 |  |
| PRD-MKT-010 | Marketing tags and social | P1 | Configuration | None | REQ-KTDA-MKT-001, REQ-KTDA-ANL-006, REQ-MPC-INT-003 |  |
| PRD-RPT-002 | KPI framework and executive dashboards | P1 | External system | External system + integration plugin | REQ-MPC-FR-276, REQ-MPC-FR-288, REQ-MPC-FR-296, REQ-MPC-RPT-001 | PAID-STUB |
| PRD-RPT-003 | Data warehouse and ETL | P1 | External system | External system + integration plugin | REQ-KTDA-ANL-007, REQ-MPC-FR-275, REQ-MPC-FR-282, REQ-MPC-FR-286, REQ-MPC-FR-291, REQ-MPC-FR-293, REQ-MPC-ARC-001 |  |
| PRD-RPT-004 | Report delivery and self-service | P1 | External system | External system + integration plugin | REQ-MPC-FR-284, REQ-MPC-FR-285, REQ-MPC-FR-289 |  |
| PRD-RPT-005 | Report access control | P1 | External system | External system + integration plugin | REQ-MPC-FR-283 |  |
| PRD-RPT-006 | Compliance and audit reports | P1 | External system | External system + integration plugin | REQ-MPC-FR-287, REQ-MPC-FR-292 |  |
| PRD-RPT-008 | External BI connectivity | P2 | Licensed plugin | None |  | PAID-STUB |
| PRD-RPT-010 | Operational dashboards | P1 | External system | External system + integration plugin | REQ-MPC-FR-277, REQ-MPC-FR-278, REQ-MPC-FR-279, REQ-MPC-FR-280 | PAID-STUB |
| PRD-RPT-011 | Commerce and marketing analytics | P1 | External system | External system + integration plugin | REQ-KTDA-ANL-003, REQ-KTDA-ANL-004, REQ-KTDA-ANL-005, REQ-KTDA-ANL-006, REQ-MPC-FR-294 | PAID-STUB |
| PRD-RPT-012 | e-Government and engagement reports | P1 | External system | External system + integration plugin | REQ-MPC-FR-281, REQ-MPC-FR-295 | FG-06, PAID-STUB |
| PRD-ADM-008 | Upload and content scanning controls | P1 | Code-level | Custom plugin + External system + integration plugin | REQ-MPC-FR-324 |  |
| PRD-DOC-003 | Document integrity | P2 | Code-level | Custom plugin + External system + integration plugin |  |  |
| PRD-DOC-005 | Document requirements and validation | P2 | External system | External system + integration plugin |  |  |
| PRD-SEC-002 | Edge protection | P1 | External system | External system + integration plugin | REQ-KTDA-SEC-002, REQ-KTDA-HST-001, REQ-MPC-SEC-001 |  |
| PRD-SEC-005 | Anomaly and correlation detection | P2 | External system | External system + integration plugin |  |  |
| PRD-SEC-006 | Data residency | P1 | External system | External system + integration plugin |  | DP-01 |
| PRD-SEC-009 | Compliance reports and certificates | P2 | External system | External system + integration plugin |  |  |
| PRD-SEC-011 | Vulnerability management | P1 | External system | External system + integration plugin |  |  |
| PRD-SEC-015 | Security incident management | P2 | External system | External system + integration plugin |  |  |
| PRD-INT-001 | Public REST API | P1 | Code-level | Custom plugin (on licensed Web API plugin) | REQ-KTDA-INT-001, REQ-KTDA-INT-002, REQ-KTDA-INT-003, REQ-MPC-FR-338, REQ-MPC-FR-347, REQ-MPC-FR-289, REQ-MPC-INT-004, REQ-MPC-MOB-002 | API-01, PAID-STUB, API-GW |
| PRD-INT-002 | Integration layer (API gateway) | P1 | External system | External system + integration plugin | REQ-MPC-FR-314, REQ-MPC-FR-321, REQ-MPC-FR-326, REQ-MPC-FR-337, REQ-MPC-FR-340, REQ-MPC-FR-341, REQ-MPC-FR-346, REQ-MPC-FR-339, REQ-MPC-FR-338, REQ-MPC-INT-004 | API-GW |
| PRD-INT-003 | Webhooks and events | P1 | Code-level | Custom plugin | REQ-MPC-FR-166, REQ-MPC-FR-217, REQ-MPC-FR-348 |  |
| PRD-INT-004 | Integration health and retries | P1 | External system | External system + integration plugin | REQ-MPC-FR-342 |  |
| PRD-INT-005 | ERP and finance connector framework | P1 | Code-level | Custom plugin | REQ-KTDA-INT-001 | PAID-STUB |
| PRD-INT-006 | SAGE 200 adapter | P1 | Code-level | Custom plugin | REQ-MPC-FR-138, REQ-MPC-FR-328 |  |
| PRD-INT-007 | PostGlobal adapter | P1 | Code-level | Custom plugin | REQ-MPC-FR-327, REQ-MPC-FR-166, REQ-MPC-FR-221, REQ-MPC-ORD-001 |  |
| PRD-INT-008 | Banking integrations | P1 | Code-level | Custom plugin | REQ-KTDA-INT-002 |  |
| PRD-INT-009 | Government system connector framework | P1 | Code-level | Custom plugin | REQ-MPC-FR-343, REQ-MPC-INT-001 |  |
| PRD-INT-010 | Master data synchronisation | P1 | Code-level | Custom plugin | REQ-MPC-FR-349 |  |
| PRD-INT-011 | Plugin extensibility | P1 | Configuration | None | REQ-KTDA-NFR-001, REQ-MPC-INT-004, REQ-MPC-INT-001 |  |
| PRD-INT-012 | Punch-out | P3 | Configuration | None (configure bundled plugin); Custom plugin only for OCI / cXML OrderRequest |  |  |
| PRD-INT-013 | MANEPS adapter | P1 | Code-level | Custom plugin | REQ-MPC-INT-001 | MG-09 |
| PRD-CHN-001 | Native mobile apps | P1 | Licensed plugin | None | REQ-MPC-MOB-001, REQ-MPC-MOB-002 | M-19, PAID-STUB |
| PRD-CHN-003 | USSD channel | P1 | External system | External system + integration plugin | REQ-MPC-INT-002 |  |
| PRD-CHN-004 | IVR channel | P2 | External system | External system + integration plugin |  |  |
| PRD-CHN-005 | SMS gateway and SMS commands | P1 | Code-level | Custom plugin |  |  |
| PRD-CHN-006 | WhatsApp Business | P1 | Code-level | External system + integration plugin | REQ-KTDA-CHT-001 |  |
| PRD-CHN-007 | WeChat | P1 | Code-level | External system + integration plugin | REQ-KTDA-CHT-001 |  |
| PRD-CHN-008 | Telegram bot | P3 | Code-level | External system + integration plugin |  |  |
| PRD-CHN-010 | Field agent app | P2 | External system | External system + integration plugin |  | FG-06 |
| PRD-CHN-011 | Social media integration | P1 | Configuration | None | REQ-MPC-INT-003 |  |
| PRD-CHN-012 | SMS sender ID and opt-out | P2 | Code-level | Custom plugin |  |  |
| PRD-CHN-013 | Push notifications | P2 | Code-level | External system + integration plugin |  |  |
| PRD-AI-003 | AI chatbot | P1 | Code-level | Custom plugin + External system + integration plugin | REQ-MPC-FR-256, REQ-MPC-CHT-001 |  |
| PRD-AI-005 | OCR and ID document checks | P2 | External system | External system + integration plugin |  |  |
| PRD-AI-006 | ML fraud detection | P3 | External system | External system + integration plugin |  |  |
| PRD-AI-007 | ML recommendation engine | P3 | External system | External system + integration plugin |  |  |
| PRD-AI-008 | Forecasting and image inspection | P3 | External system | External system + integration plugin |  |  |
| PRD-AI-010 | AI governance | P1 | External system | External system + integration plugin |  |  |
| PRD-FIN-001 | Credit marketplace | P3 | External system | External system + integration plugin |  |  |
| PRD-FIN-002 | Invoice discounting | P3 | External system | External system + integration plugin |  |  |
| PRD-FIN-003 | Insurance | P3 | External system | External system + integration plugin |  |  |
| PRD-FIN-005 | Financial and partner services catalogue | P1 | Code-level | Custom plugin + External system + integration plugin | REQ-MPC-FR-336 | FG-06, T-MISS |
| PRD-EGV-007 | Digital ID service workflows | P1 | Code-level | Custom plugin + External system + integration plugin | REQ-MPC-FR-350 | FG-06, WF-ENG, T-MISS |

### 9.2 Named or stated external systems (28)

| System | Client | Source | Product feature | Open item |
|---|---|---|---|---|
| PayPal | KTDA | REQ-KTDA-PAY-003 | PRD-PAY-003 | K-08 (is PayPal acceptable under the CBK-bank rule) |
| CBK-regulated bank card gateway (bank not named) | KTDA | REQ-KTDA-PAY-001, PAY-002 | PRD-PAY-002, PAY-031 | KG-04; K-08 |
| Malawi Post card gateway (not named) | Malawi Post | REQ-MPC-FR-129 | PRD-PAY-002, PAY-032 | Gateway not named (MG-03) |
| M-Pesa (Safaricom) | KTDA | REQ-KTDA-PAY-004 | PRD-PAY-004 (framework); PAY-028 | C-FX (USD base vs KES settlement); API not stated (KG-05) |
| TNM Mpamba; Airtel Money | Malawi Post | REQ-MPC-FR-126, FR-127, FR-330 | PRD-PAY-004 (framework); PAY-029, PAY-030 | APIs not stated (MG-03) |
| Bank systems | KTDA / Malawi Post | REQ-KTDA-INT-002; REQ-MPC-FR-128 | PRD-INT-008, PAY-005, PAY-014 | Banks not named (KG-04, MG-03) |
| Escrow provider (bank / PSP) | KTDA | REQ-KTDA-PAY-008 | PRD-PAY-007 | KG-07; PAY-DIRECT; LIC-01 |
| KRA eTIMS / MRA EIS | KTDA / Malawi Post | External law (not in client sources) | PRD-PAY-025 (framework); PAY-026, PAY-027 | E-INV |
| KTDA ERP(s) | KTDA | REQ-KTDA-INT-001 | PRD-INT-005 | ERP not named (KG-03) |
| Shipping systems and couriers (DHL, FedEx, G4S, Skynet, Wells Fargo, Aramex, shipping lines) | KTDA | REQ-KTDA-INT-003, LOG-003 | PRD-LOG-021 (framework); LOG-006, LOG-025 to LOG-030 | Carrier API availability unverified (F-3) |
| PostGlobal (postal operations) | Malawi Post | REQ-MPC-FR-327 | PRD-INT-007 | FG-06: which postal operations stay in PostGlobal |
| SAGE 200 (accounting) | Malawi Post | REQ-MPC-FR-328 | PRD-INT-006 |  |
| MANEPS (e-procurement) | Malawi Post | REQ-MPC-INT-001 | PRD-INT-013 | Purpose and data not stated (MG-09) |
| Malawi Post core systems (accounts) | Malawi Post | see Appendix C | PRD-IAM-019 | Interface not stated |
| UPU CDS, IPS, GMS | Malawi Post | REQ-MPC-FR-190, FR-191, FR-221, FR-329 | PRD-LOG-016 |  |
| Malawi Post delivery partners (not named) | Malawi Post | REQ-MPC-FR-180 | PRD-LOG-031 | Partners not named |
| USSD operator / aggregator | Malawi Post | REQ-MPC-INT-002 | PRD-CHN-003 | Use cases and MNO not stated (MG-10) |
| SMS gateway | Malawi Post (KTDA by inference via IAM-002 OTP) | REQ-MPC-FR-214 | PRD-CHN-005, CHN-012 | Provider not named. nopCommerce 5.00.1 bundles one SMS provider plugin (Sms.Twilio); it is not assumed: coverage in Kenya and Malawi and data protection are open (SMS-COV-500, DP-EXT-500) |
| WhatsApp Business; WeChat | KTDA / Malawi Post | REQ-KTDA-CHT-001; REQ-MPC-FR-256 | PRD-CHN-006, CHN-007, AI-003 | MG-11 (chatbot ML expectations) |
| Live chat service (Tawk.to on Post Gebeya) | KTDA | REQ-KTDA-CHT-001 | PRD-CRM-008 | V-01 |
| AI / LLM service for the chatbot | Malawi Post | REQ-MPC-FR-256; ToR CHT-001 | PRD-AI-003, AI-010 | MG-11 |
| Google Ads, analytics and social platforms | KTDA / Malawi Post | REQ-KTDA-MKT-001, ANL-006; REQ-MPC-INT-003 | PRD-MKT-010, SRC-021, CHN-011 | Campaigns are a project service (KTDA MKT-001) |
| AI / advanced analytics platforms; data warehouse | KTDA / Malawi Post | REQ-KTDA-ANL-007; REQ-MPC-ARC-001, FR-282 | PRD-RPT-003, RPT-008 | KG-17; MG-12 |
| Cloud hosting (AWS or Azure) | KTDA | REQ-KTDA-HST-001 | PRD-PLT-002 (instance per client) | Hosting is a project service; DP-01 |
| National ID / registry and mobile-network KYC | Malawi Post | REQ-MPC-FR-047, FR-344 | PRD-IAM-020, SEL-004 | Registries not named |
| Regulators and ADR bodies (for example MACRA) | Malawi Post | REQ-MPC-FR-247, FR-343 | PRD-INT-009 | Data and format not stated |
| Government agencies (fee remittance) | Malawi Post | REQ-MPC-FR-146, FR-331 | PRD-EGV-005 | FG-06 |
| E-signature provider | — | see Appendix A | PRD-ORD-017 | Provider not named |

Appendix B and Appendix C give the full list of delivering features for every integration requirement.


## 10. Release phases

### 10.1 Phase rules

- P1 = features that deliver a KTDA or Malawi Post requirement (stated, or by inference mapping — marked in Phasing basis and to be confirmed with the client; decision PH-INF), plus the 13 Product Goal enablers, plus go-live essentials (PO-701), plus features a P1 feature depends on. The 13 enablers are: PLT-001 provisioning, PLT-003 configuration packs, PLT-004 change control, PLT-005 configuration export/import and promotion, PLT-021 release management, PLT-022 feature registry, PLT-023 data migration, ADM-002 workflow engine, ADM-003 rules engine, PAY-024 payment connector SDK, LOG-021 carrier connector framework, TRK-005 notification engine, SEC-004 audit trail.
- P2 = all remaining features that a general B2B/B2C e-commerce system for goods and services needs (catalog Must/Should, or PO recommendation). Also includes the named PO-701 placements SVC-009, AI-005 and CAT-035.
- P3 = specialised features: the AI pack and the agri-finance and schemes pack (whatever their catalog priority), features whose highest priority across all sources is Could/Best-in-class, features that are P3-only in the catalog, and the named PO-701 exceptions (INT-012, ORD-021, RPT-007).
- Dependencies: a feature needed by a P1 feature is pulled into P1; one needed by a P2 feature is pulled into P2.
- Implementation categories come from the 'nopCommerce 5.00 fit' sheet (source-verified against release-5.00.1, decision VER-500): Reusable — configuration = Out of the box; Reusable — configuration (licensed plugin) = Third-party plugin; Code-level modification; Cannot be done in nopCommerce = external system with integration.

### 10.2 Phase × implementation

| Phase | Features | Configuration | Licensed plugin | Code-level | External system |
|---|---|---|---|---|---|
| P1 | 337 | 64 | 9 | 234 | 30 |
| P2 | 76 | 4 | 2 | 62 | 8 |
| P3 | 21 | 2 | 0 | 12 | 7 |
| Total | 434 | 70 | 11 | 308 | 45 |

### 10.3 Go-live essentials placed in P1 (PO-701) (14)

| PRD ID | Feature | Reason |
|---|---|---|
| PRD-PLT-002 | Client data isolation | Go-live essential (PO-701): This is the multi-client model the Product Goal rests on, and the open architecture decision F-CAT-B. It cannot come after onboarding similar projects, which is P1 by definition. |
| PRD-PLT-007 | Custom domain and SSL | Go-live essential (PO-701): No client site can go live without its own domain and TLS certificate. KTDA explicitly requires SSL. |
| PRD-PLT-008 | Email sender identity | Go-live essential (PO-701): P1 email features (TRK-004 templates, CHK-019 confirmation, PAY-013 receipts) need a verified sender domain, or messages are rejected or marked as spam. |
| PRD-PLT-018 | Accessibility | Go-live essential (PO-701): Definition of Done criterion 9 applies WCAG 2.1 AA to every new or changed screen from the first Increment, and it cites PLT-018 as its basis. Malawi Post requires accessible search (FR-092 → SRC-022, P1). GovTech client. |
| PRD-CAT-013 | Call-for-price / negotiable flag | Go-live essential (PO-701): This is the storefront entry point ("request a quote" instead of "add to cart") for KTDA's quote and offer cycle (ORD-012, P1). |
| PRD-CAT-027 | Service booking | Go-live essential (PO-701): PRD-EGV-003 Appointments (P1, MPC FR-334) schedules in-person visits on a booking calendar, which is the capability CAT-027 provides. |
| PRD-INV-004 | Stock reservation and hold | Go-live essential (PO-701): The native platform takes stock at order placement but never releases it for an unpaid order. INV-004 releases the stock of unpaid orders automatically when the payment window expires (its description), which mobile-money payments (PAY-004, P1) need because they confirm asynchronously (decision INV-HOLD, option b |
| PRD-PAY-026 | KRA eTIMS adapter | Inference: statutory e-invoicing obligation under Kenyan tax law (KRA eTIMS); not in client sources; P1 subject to E-INV (PO-701) |
| PRD-PAY-027 | MRA EIS adapter | Inference: statutory e-invoicing obligation under Malawian tax law (MRA EIS); not in client sources; P1 subject to E-INV (PO-701) |
| PRD-SEC-006 | Data residency | Go-live essential (PO-701): KTDA prefers AWS/Azure cloud hosting, which raises cross-border transfer questions under the data-protection laws in SEC-012 (P1). Decision DP-01 must be answered before go-live. |
| PRD-SEC-008 | Breach notification workflow | Go-live essential (PO-701): SEC-012 (P1) holds the statutory breach deadlines, and SEC-008 is the workflow that meets them. Without it, the P1 data-protection pack cannot discharge the breach duty. |
| PRD-SEC-011 | Vulnerability management | Go-live essential (PO-701): Definition of Done criterion 5 ("no new high or critical vulnerabilities in dependency scan") cites SEC-011 and applies to every Increment. KTDA requires best-practice cybersecurity. |
| PRD-SEC-013 | Bot protection | Go-live essential (PO-701): Public self-registration (IAM-001, P1) needs CAPTCHA protection at go-live. It is native configuration (Out of the box). |
| PRD-AI-010 | AI governance | Go-live essential (PO-701): The AI chatbot PRD-AI-003 is P1 (MPC ToR CHT-001, FR-256). Telling users that AI is in use, and explaining its answers, must ship with it. |

### 10.4 P1 by inference mapping — subject to client confirmation (decision PH-INF) (13)

| PRD ID | Feature | Basis |
|---|---|---|
| PRD-IAM-022 | B2B company accounts | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-IAM-023 | B2B buyer registration and approval | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-CAT-039 | Customer and company price lists | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-CAT-041 | Units of measure and pack selling | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-CAT-042 | Fixed prices per currency | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-CHK-015 | Checkout attributes | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-CHK-016 | B2B on-account payment and credit limits | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-CHK-017 | B2B quick order and bulk add | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-CHK-018 | B2B purchase approval | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-PAY-025 | Fiscal e-invoicing framework | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-PAY-034 | Outlet receipt printing and cash-up | P1 subject to Malawi Post confirmation (decision PH-INF); inference mapping |
| PRD-ORD-025 | Proforma invoice | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |
| PRD-ORD-026 | Incoterms | P1 subject to KTDA confirmation (decision PH-INF); inference mapping |

PAY-025 is also required by PAY-026 and PAY-027 (go-live features under E-INV).

### 10.5 Features pulled forward by a dependency (4)

| PRD ID | Feature | Phase | Basis |
|---|---|---|---|
| PRD-PAY-033 | Accounts receivable | P1 | General e-commerce capability (catalog Must/Should or PO recommendation for complete B2B/B2C goods and services commerce); pulled into P1 because PRD-CHK-016 depends on it |
| PRD-DOC-001 | Document generation | P1 | General e-commerce capability (catalog Must/Should or PO recommendation for complete B2B/B2C goods and services commerce); pulled into P1 because PRD-ORD-025 depends on it |
| PRD-DOC-002 | Document storage | P1 | General e-commerce capability (catalog Must/Should or PO recommendation for complete B2B/B2C goods and services commerce); pulled into P1 because PRD-SEL-002 depends on it |
| PRD-CHN-005 | SMS gateway and SMS commands | P1 | General e-commerce capability (catalog Must/Should or PO recommendation for complete B2B/B2C goods and services commerce); pulled into P1 because PRD-IAM-002 depends on it |

## 11. Delivery framework

### 11.1 Scrum mapping (Scrum Guide 2020)

| Element | Where it lives / status |
|---|---|
| Product Goal | §2.2 — proposed; Product Owner to confirm |
| Product Backlog | Baseline workbook, sheet "Product Backlog" (434 items); refined into user stories in L2 |
| Sprint Goal and Sprint Backlog | Created by the Scrum Team at each Sprint Planning; not part of this PRD |
| Increment and Definition of Done | §11.2 — proposed |
| Product Owner, Scrum Master, Developers | Not stated in source — requires confirmation (names) |
| Stakeholders | KTDA, Malawi Post, future clients, CSM Technologies product team |
| Product Backlog order | Set by the Product Owner; **not yet set**. Phase does not define order within a phase. |
| Practices not defined by the Scrum Guide | Phases P1/P2/P3, reuse tiers, packs, fit categories, compliance statuses — inputs to ordering only |

### 11.2 Definition of Done (proposed — the Scrum Team to adopt or change)

| # | Area | Criterion | Basis |
|---|---|---|---|
| 1 | Function | Behaviour meets the acceptance criteria of the item's L2 user stories. Linked requirements with status 'subject to decision', 'subject to client content' or 'by inference' are not acceptance criteria until resolved (L1 §11.3 rule 3). Catalog lines marked 'India rail not carried' apply only with the Kenya/Malawi equivalent named by a client source. | Traceability; L1 §11.3 |
| 2 | Configuration | Anything that differs between clients is a setting, configuration-pack entry or adapter — no client-specific code in core; new settings are added to the Config pack schema. | Product Goal; Config pack schema |
| 3 | Platform | Runs on nopCommerce 5.00.1 on .NET 10 (release-5.00.1); any plugin used is installed and tested on 5.00.1 with licence recorded. | VER-500; V-01 |
| 4 | Quality | Code reviewed by another Developer; automated tests pass; no open critical or high defects. | Practice |
| 5 | Security | No new high or critical vulnerabilities in dependency scan; card data never stored; access limited by role. | SEC-001, SEC-003, SEC-011 |
| 6 | Privacy | Personal data handled per the applicable data-protection rules; once SEC-012 and SEC-014 are Done, per the country pack with masking. | SEC-007, SEC-012, SEC-014 |
| 7 | Audit | Important actions are logged; once SEC-004 is Done, to the platform audit trail. | SEC-004 |
| 8 | Localisation | All user-facing text is in language resources (translatable); right-to-left layout not broken. | PLT-009, PLT-025 |
| 9 | Accessibility | New or changed user-facing screens meet WCAG 2.1 AA. | PLT-018 |
| 10 | Devices and networks | Works on phone, tablet and desktop; meets the page-weight / load-time target set by the Scrum Team for slow connections (no target is stated in any source — to be set). | PLT-017, CHN-002 |
| 11 | Documentation | User help and admin configuration notes updated; release notes entry written. | Practice |
| 12 | Integration | Integrated into the product Increment and deployable to a client test instance by a documented, repeatable procedure; once PLT-001 is Done, by the provisioning template. | Scrum Guide: Increment must be usable; PLT-001 |
| 13 | Upgrade safety | No change to nopCommerce core code except for features in the core-modification register (L1 §6.3); each such change is isolated and listed for re-application on upgrade. | L1 §6.2 principle 2 |
|  | Note | The Scrum Guide 2020: the Definition of Done is a formal description of the state of the Increment when it meets the quality measures required for the product. If the organisation has a Definition of Done, the Scrum Team follows it as a minimum. The criteria above are a proposal. |  |

### 11.3 Traceability rules

Every user story cites its feature and every acceptance criterion cites its story; test cases are TC-<criterion>. The traceability rules and the full requirement → feature → story → criterion → test matrix are in the Compliance and traceability report.

## 12. Decisions, flags and open items

Open and closed decisions, gaps and open items are kept in the Decisions, gaps and open items register. Appendix B lists the IDs used in this document with a one-line meaning.

## Appendix A. Feature index (434)

Page (where the feature section starts in Part 2), phase, implementation, pack, dependencies and the decision a feature is on hold for. Descriptions, native capability, build scope, stories and acceptance criteria per feature are in the module chapters (Part 2).


### A.1 PLT — Platform foundation and multi-client configuration (27)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-PLT-001 | Client instance provisioning | {{PG:PRD-PLT-001}} | P1 | External system | External system + integration plugin | Core (always on) | PRD-PLT-003, PRD-PLT-021 |  |
| PRD-PLT-002 | Client data isolation | {{PG:PRD-PLT-002}} | P1 | Configuration | None | Core (always on) |  | F-CAT-B |
| PRD-PLT-003 | Configuration packs | {{PG:PRD-PLT-003}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PLT-022 |  |
| PRD-PLT-004 | Settings change control | {{PG:PRD-PLT-004}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002, PRD-SEC-004 | WF-ENG |
| PRD-PLT-005 | Configuration export, import and promotion | {{PG:PRD-PLT-005}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PLT-003 |  |
| PRD-PLT-006 | Branding and theme | {{PG:PRD-PLT-006}} | P1 | Licensed plugin | None (or Theme/view override if no Pavilion licence) | Core (always on) |  |  |
| PRD-PLT-007 | Custom domain and SSL | {{PG:PRD-PLT-007}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-PLT-008 | Email sender identity | {{PG:PRD-PLT-008}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-PLT-009 | Languages and language packs | {{PG:PRD-PLT-009}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-PLT-010 | Currencies and exchange rates | {{PG:PRD-PLT-010}} | P1 | Configuration | None | Core (always on) | PRD-PLT-024 |  |
| PRD-PLT-011 | Time zone and formats | {{PG:PRD-PLT-011}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-PLT-012 | Fiscal calendar for reporting | {{PG:PRD-PLT-012}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PLT-013 | Multi-store (B2B and B2C storefronts) | {{PG:PRD-PLT-013}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-PLT-014 | Instance health and SLA monitoring | {{PG:PRD-PLT-014}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-PLT-015 | Scalable, open architecture | {{PG:PRD-PLT-015}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-PLT-016 | Backup and disaster recovery | {{PG:PRD-PLT-016}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-PLT-017 | Responsive storefront | {{PG:PRD-PLT-017}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-PLT-018 | Accessibility | {{PG:PRD-PLT-018}} | P1 | Code-level | Theme/view override + Core modification (admin views) | Core (always on) |  |  |
| PRD-PLT-019 | Contextual help and guided tours | {{PG:PRD-PLT-019}} | P1 | Code-level | Custom plugin + Theme/view override | Access and admin extensions pack |  |  |
| PRD-PLT-020 | Data retention and archival | {{PG:PRD-PLT-020}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PLT-021 | Product release and upgrade management | {{PG:PRD-PLT-021}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-PLT-022 | Feature and module registry | {{PG:PRD-PLT-022}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PLT-023 | Client data migration toolkit | {{PG:PRD-PLT-023}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PLT-024 | Exchange-rate provider framework | {{PG:PRD-PLT-024}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PLT-025 | Translation management | {{PG:PRD-PLT-025}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PLT-009 |  |
| PRD-PLT-026 | Hosting profile and sizing NFR | {{PG:PRD-PLT-026}} | P1 | External system | External system + integration plugin | Core (always on) |  | C-SIZE |
| PRD-PLT-027 | Data consistency safeguards | {{PG:PRD-PLT-027}} | P2 | Code-level | Core modification + Custom plugin | Core (always on) |  |  |

### A.2 IAM — Identity, access and accounts (27)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-IAM-001 | Customer registration and login | {{PG:PRD-IAM-001}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-IAM-002 | Mobile-number identity with OTP | {{PG:PRD-IAM-002}} | P1 | Code-level | Custom plugin (ISmsProvider + DI override) + Theme/view override | Core (always on) | PRD-CHN-005 |  |
| PRD-IAM-003 | Password policy, lockout and recovery | {{PG:PRD-IAM-003}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-IAM-004 | Multi-factor authentication by role | {{PG:PRD-IAM-004}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-IAM-005 | Single sign-on for staff and B2B buyers | {{PG:PRD-IAM-005}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-IAM-006 | Session management | {{PG:PRD-IAM-006}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-IAM-007 | Roles and permissions | {{PG:PRD-IAM-007}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-IAM-008 | Scoped permissions | {{PG:PRD-IAM-008}} | P1 | Code-level | Custom plugin + Core modification | Core (always on) |  |  |
| PRD-IAM-009 | Permission delegation | {{PG:PRD-IAM-009}} | P2 | Code-level | Custom plugin | Access and admin extensions pack |  |  |
| PRD-IAM-010 | User administration console | {{PG:PRD-IAM-010}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-IAM-011 | Staff invitation and access reviews | {{PG:PRD-IAM-011}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-IAM-012 | Authentication audit and suspicious-login detection | {{PG:PRD-IAM-012}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-004 |  |
| PRD-IAM-013 | Passwordless and biometric login | {{PG:PRD-IAM-013}} | P2 | Code-level | Custom plugin | Access and admin extensions pack |  |  |
| PRD-IAM-014 | Customer profile and address book | {{PG:PRD-IAM-014}} | P1 | Code-level | Theme/view override + Custom plugin | Core (always on) |  |  |
| PRD-IAM-015 | Pickup preference and preferred channel | {{PG:PRD-IAM-015}} | P1 | Code-level | Custom plugin | Postal and logistics pack |  |  |
| PRD-IAM-016 | Terms acceptance with versioning | {{PG:PRD-IAM-016}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-IAM-017 | Privacy rights | {{PG:PRD-IAM-017}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-012 |  |
| PRD-IAM-018 | Account activity history | {{PG:PRD-IAM-018}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-IAM-019 | Account synchronisation with core systems | {{PG:PRD-IAM-019}} | P1 | Code-level | External system + integration plugin | Client: MPC |  |  |
| PRD-IAM-020 | Identity verification adapter framework | {{PG:PRD-IAM-020}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-IAM-021 | Customer transaction history | {{PG:PRD-IAM-021}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-IAM-022 | B2B company accounts | {{PG:PRD-IAM-022}} | P1 | Code-level | Custom plugin + Theme/view override | B2B trade pack |  | PH-INF |
| PRD-IAM-023 | B2B buyer registration and approval | {{PG:PRD-IAM-023}} | P1 | Code-level | Custom plugin + Theme/view override | B2B trade pack |  | PH-INF |
| PRD-IAM-024 | Tax-exempt and VAT-registered buyers | {{PG:PRD-IAM-024}} | P1 | Configuration | None | B2B trade pack |  |  |
| PRD-IAM-025 | Customer home dashboard | {{PG:PRD-IAM-025}} | P2 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-IAM-026 | Assisted service by agents | {{PG:PRD-IAM-026}} | P1 | Code-level | Custom plugin | Assisted service pack |  |  |
| PRD-IAM-027 | Company cost centres and budgets | {{PG:PRD-IAM-027}} | P2 | Code-level | Custom plugin | B2B trade pack | PRD-IAM-022 | PH-INF |

### A.3 SEL — Sellers and marketplace onboarding (25)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-SEL-001 | Seller application and profile | {{PG:PRD-SEL-001}} | P1 | Configuration | None | Marketplace pack |  |  |
| PRD-SEL-002 | Seller KYC documents | {{PG:PRD-SEL-002}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-DOC-002 |  |
| PRD-SEL-003 | Seller verification workflow and tiers | {{PG:PRD-SEL-003}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-ADM-002 | WF-ENG |
| PRD-SEL-004 | Identity and registry verification adapters | {{PG:PRD-SEL-004}} | P1 | External system | External system + integration plugin | Marketplace pack | PRD-IAM-020 |  |
| PRD-SEL-005 | Payout accounts and verification | {{PG:PRD-SEL-005}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-ADM-006 | WF-ENG |
| PRD-SEL-006 | Seller terms acceptance | {{PG:PRD-SEL-006}} | P1 | Configuration | None | Marketplace pack |  |  |
| PRD-SEL-007 | Marketplace rules and listing eligibility | {{PG:PRD-SEL-007}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-CAT-002 |  |
| PRD-SEL-008 | Seller dashboard and onboarding checklist | {{PG:PRD-SEL-008}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-009 | Seller staff accounts | {{PG:PRD-SEL-009}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-010 | Seller categorisation | {{PG:PRD-SEL-010}} | P2 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-011 | Seller performance monitoring | {{PG:PRD-SEL-011}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-012 | Seller ratings | {{PG:PRD-SEL-012}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-013 | Block and watch lists | {{PG:PRD-SEL-013}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-SEL-014 | Approved supplier panels | {{PG:PRD-SEL-014}} | P2 | Code-level | Custom plugin | B2B trade pack |  |  |
| PRD-SEL-015 | Bulk participant import and invitation | {{PG:PRD-SEL-015}} | P2 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-016 | Commission and fee rules | {{PG:PRD-SEL-016}} | P1 | Code-level | Custom plugin (on vendor plugin base) | Marketplace pack |  |  |
| PRD-SEL-017 | Seller settlements and payouts | {{PG:PRD-SEL-017}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-PAY-010, PRD-SEL-005, PRD-PAY-024 | WF-ENG, PAY-DIRECT / LIC-01 |
| PRD-SEL-018 | Seller locations and fulfilment opt-in | {{PG:PRD-SEL-018}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-019 | Seller vacation mode | {{PG:PRD-SEL-019}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-020 | Seller notifications | {{PG:PRD-SEL-020}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-021 | Seller onboarding funnel report | {{PG:PRD-SEL-021}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-022 | Seller diversity tracking | {{PG:PRD-SEL-022}} | P3 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-SEL-023 | Seller training content | {{PG:PRD-SEL-023}} | P1 | Configuration | None | Marketplace pack |  |  |
| PRD-SEL-024 | Seller blacklisting | {{PG:PRD-SEL-024}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-SEL-013 |  |
| PRD-SEL-025 | Commission invoicing to sellers | {{PG:PRD-SEL-025}} | P2 | Code-level | Custom plugin | Marketplace pack | PRD-SEL-016, PRD-PAY-033, PRD-PAY-021, PRD-PAY-025 | PH-INF, PO-REC-v8, PAY-DIRECT / LIC-01, E-INV, PAID-STUB, DOC-LIB |

### A.4 CAT — Catalogue and listings (43)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-CAT-001 | Category taxonomy | {{PG:PRD-CAT-001}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CAT-002 | Product master record | {{PG:PRD-CAT-002}} | P1 | Code-level | Custom plugin (DI override) | Core (always on) |  |  |
| PRD-CAT-003 | Identifier patterns | {{PG:PRD-CAT-003}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-004 | Product and specification attributes | {{PG:PRD-CAT-004}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CAT-005 | Category attribute schema and listing quality rules | {{PG:PRD-CAT-005}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-006 | Variants and attribute combinations | {{PG:PRD-CAT-006}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CAT-007 | Bundles and kits | {{PG:PRD-CAT-007}} | P1 | Code-level | Custom plugin + Theme/view override | Engagement and loyalty pack |  |  |
| PRD-CAT-008 | Product cloning and listing templates | {{PG:PRD-CAT-008}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-009 | Bulk import/export and PDF catalogue | {{PG:PRD-CAT-009}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-010 | Import validation report | {{PG:PRD-CAT-010}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-011 | Catalogue API | {{PG:PRD-CAT-011}} | P1 | Licensed plugin | None | Commerce extensions pack | PRD-INT-001 | API-01, PAID-STUB, API-GW |
| PRD-CAT-012 | Price tiers by customer group and quantity | {{PG:PRD-CAT-012}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CAT-013 | Call-for-price / negotiable flag | {{PG:PRD-CAT-013}} | P1 | Code-level | Custom plugin + Theme/view override | B2B trade pack |  |  |
| PRD-CAT-014 | Product tax category | {{PG:PRD-CAT-014}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CAT-015 | Cross-border trade fields | {{PG:PRD-CAT-015}} | P1 | Code-level | Custom plugin | B2B trade pack |  |  |
| PRD-CAT-016 | Product media | {{PG:PRD-CAT-016}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-CAT-017 | Localised product content | {{PG:PRD-CAT-017}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CAT-018 | Product questions and answers | {{PG:PRD-CAT-018}} | P2 | Code-level | Custom plugin + Theme/view override | Marketplace pack |  |  |
| PRD-CAT-019 | Regulatory metadata and certificates | {{PG:PRD-CAT-019}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-020 | Origin and provenance content | {{PG:PRD-CAT-020}} | P1 | Code-level | Custom plugin | Commerce extensions pack |  |  |
| PRD-CAT-021 | Listing policy enforcement | {{PG:PRD-CAT-021}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-CAT-022 | Listing lifecycle and operator approval | {{PG:PRD-CAT-022}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002, PRD-CAT-002 | WF-ENG |
| PRD-CAT-023 | Listing version history and autosave | {{PG:PRD-CAT-023}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-024 | Listing availability and withdrawal | {{PG:PRD-CAT-024}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-025 | Stale listing detection | {{PG:PRD-CAT-025}} | P2 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-CAT-026 | Service listings | {{PG:PRD-CAT-026}} | P1 | Code-level | Custom plugin | Services and bookings pack |  |  |
| PRD-CAT-027 | Service booking | {{PG:PRD-CAT-027}} | P1 | Code-level | Custom plugin | Services and bookings pack |  | FG-06 |
| PRD-CAT-028 | Listing geo-location | {{PG:PRD-CAT-028}} | P2 | Code-level | Custom plugin | Services and bookings pack |  |  |
| PRD-CAT-029 | Product reviews and ratings | {{PG:PRD-CAT-029}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CAT-030 | Product returnability flag | {{PG:PRD-CAT-030}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CAT-031 | Product page delivery promise | {{PG:PRD-CAT-031}} | P1 | Code-level | Theme/view override + Custom plugin | Core (always on) | PRD-LOG-005 |  |
| PRD-CAT-032 | Catalogue audit log | {{PG:PRD-CAT-032}} | P2 | Code-level | Custom plugin | Core (always on) | PRD-SEC-004 |  |
| PRD-CAT-033 | Promoted listings with fees | {{PG:PRD-CAT-033}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-CAT-034 | Catalogue analytics | {{PG:PRD-CAT-034}} | P1 | Code-level | Custom plugin | Analytics pack |  | PAID-STUB |
| PRD-CAT-035 | Listing syndication and product feeds | {{PG:PRD-CAT-035}} | P2 | Code-level | Custom plugin | Commerce extensions pack |  |  |
| PRD-CAT-036 | Catalogue segmentation by buyer channel | {{PG:PRD-CAT-036}} | P1 | Configuration | None | B2B trade pack |  |  |
| PRD-CAT-037 | Order quantity rules | {{PG:PRD-CAT-037}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CAT-038 | Guided seller listing wizard | {{PG:PRD-CAT-038}} | P1 | Code-level | Custom plugin + Theme/view override | Marketplace pack |  |  |
| PRD-CAT-039 | Customer and company price lists | {{PG:PRD-CAT-039}} | P1 | Configuration | None | B2B trade pack | PRD-IAM-022 | PH-INF |
| PRD-CAT-040 | Company-specific assortment | {{PG:PRD-CAT-040}} | P2 | Code-level | Custom plugin | B2B trade pack | PRD-IAM-022 | PH-INF |
| PRD-CAT-041 | Units of measure and pack selling | {{PG:PRD-CAT-041}} | P1 | Code-level | Custom plugin; Core modification (conditional, decision UOM-01) | B2B trade pack |  | PH-INF, UOM-01 |
| PRD-CAT-042 | Fixed prices per currency | {{PG:PRD-CAT-042}} | P1 | Code-level | Custom plugin (DI override) | Core (always on) |  | PH-INF |
| PRD-CAT-043 | Seller listing moderation | {{PG:PRD-CAT-043}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-CAT-022 | WF-ENG |

### A.5 INV — Inventory and warehouses (13)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-INV-001 | Stock tracking | {{PG:PRD-INV-001}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-INV-002 | Multi-warehouse stock | {{PG:PRD-INV-002}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-INV-003 | Low-stock thresholds and alerts | {{PG:PRD-INV-003}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-INV-004 | Stock reservation and hold | {{PG:PRD-INV-004}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-INV-005 | Stock adjustments with reason codes | {{PG:PRD-INV-005}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-INV-006 | Goods receiving | {{PG:PRD-INV-006}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-INV-007 | Warehouse transfers | {{PG:PRD-INV-007}} | P2 | Code-level | Custom plugin | Warehouse pack |  |  |
| PRD-INV-008 | Cycle counts | {{PG:PRD-INV-008}} | P2 | Code-level | Custom plugin | Warehouse pack |  |  |
| PRD-INV-009 | Batch and lot tracking | {{PG:PRD-INV-009}} | P2 | Code-level | Custom plugin (provider under OVR-REG) | Warehouse pack | PRD-CAT-002 |  |
| PRD-INV-010 | Serial number tracking | {{PG:PRD-INV-010}} | P2 | Code-level | Custom plugin | Warehouse pack |  |  |
| PRD-INV-011 | Expiry management | {{PG:PRD-INV-011}} | P2 | Code-level | Custom plugin (provider under OVR-REG) | Warehouse pack | PRD-INV-009, PRD-CAT-002 |  |
| PRD-INV-012 | WMS/ERP stock synchronisation | {{PG:PRD-INV-012}} | P1 | Code-level | External system + integration plugin | Warehouse pack |  | PAID-STUB |
| PRD-INV-013 | Inventory analytics | {{PG:PRD-INV-013}} | P1 | Code-level | Custom plugin | Warehouse pack |  |  |

### A.6 SRC — Search, discovery and merchandising (27)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-SRC-001 | Keyword search | {{PG:PRD-SRC-001}} | P1 | Configuration | None (configuration of bundled plugin + external Google Cloud Retail account) | Core (always on) |  |  |
| PRD-SRC-002 | Search-as-you-type | {{PG:PRD-SRC-002}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-SRC-003 | Faceted filters | {{PG:PRD-SRC-003}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | PRD-CAT-002 |  |
| PRD-SRC-004 | Location and delivery-option discovery | {{PG:PRD-SRC-004}} | P1 | Code-level | Custom plugin + Theme/view override | Postal and logistics pack |  |  |
| PRD-SRC-005 | Sorting options | {{PG:PRD-SRC-005}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | PRD-CAT-002 |  |
| PRD-SRC-006 | Category browse | {{PG:PRD-SRC-006}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-SRC-007 | Merchandising widgets and landing pages | {{PG:PRD-SRC-007}} | P1 | Licensed plugin | None | Core (both clients) |  |  |
| PRD-SRC-008 | Rules-based recommendations | {{PG:PRD-SRC-008}} | P1 | Configuration | None | Engagement and loyalty pack |  |  |
| PRD-SRC-009 | Personalised recommendations and ranking | {{PG:PRD-SRC-009}} | P1 | External system | External system + integration plugin | Analytics pack | PRD-SRC-008, PRD-CAT-002 |  |
| PRD-SRC-010 | Wishlist | {{PG:PRD-SRC-010}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-SRC-011 | Saved searches and watch alerts | {{PG:PRD-SRC-011}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-SRC-012 | Search history | {{PG:PRD-SRC-012}} | P2 | Configuration | None | Core (always on) |  |  |
| PRD-SRC-013 | Product comparison | {{PG:PRD-SRC-013}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-SRC-014 | Search engine: relevance, synonyms, multilingual | {{PG:PRD-SRC-014}} | P1 | Code-level | Custom plugin | Core (both clients) |  | PAID-STUB |
| PRD-SRC-015 | Trending and bestsellers | {{PG:PRD-SRC-015}} | P2 | Code-level | Custom plugin | Analytics pack |  |  |
| PRD-SRC-016 | Taxonomy governance | {{PG:PRD-SRC-016}} | P1 | Code-level | Custom plugin | Commerce extensions pack | PRD-ADM-002 | WF-ENG |
| PRD-SRC-017 | Seller badges and featured sellers | {{PG:PRD-SRC-017}} | P1 | Code-level | Custom plugin + Theme/view override | Marketplace pack |  |  |
| PRD-SRC-018 | Delivery promise on listing cards | {{PG:PRD-SRC-018}} | P1 | Code-level | Custom plugin + Theme/view override | Postal and logistics pack | PRD-LOG-005 |  |
| PRD-SRC-019 | Search result eligibility | {{PG:PRD-SRC-019}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-SRC-020 | Services browsing area | {{PG:PRD-SRC-020}} | P1 | Configuration | None | Services and bookings pack |  | FG-06 |
| PRD-SRC-021 | Web analytics | {{PG:PRD-SRC-021}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-SRC-022 | Accessible search and navigation | {{PG:PRD-SRC-022}} | P1 | Code-level | Theme/view override | Core (always on) |  |  |
| PRD-SRC-023 | Low-connectivity resilience | {{PG:PRD-SRC-023}} | P1 | Code-level | Theme/view override | Core (always on) | PRD-CHN-002 |  |
| PRD-SRC-024 | Search API for channels | {{PG:PRD-SRC-024}} | P1 | Code-level | Custom plugin | Analytics pack |  | PAID-STUB |
| PRD-SRC-025 | Unified search | {{PG:PRD-SRC-025}} | P2 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-SRC-026 | Search performance and freshness | {{PG:PRD-SRC-026}} | P2 | Configuration | None | Core (always on) |  |  |
| PRD-SRC-027 | Storefront conveniences | {{PG:PRD-SRC-027}} | P2 | Licensed plugin | None | Core (always on) |  |  |

### A.7 CHK — Cart and checkout (19)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-CHK-001 | Shopping cart | {{PG:PRD-CHK-001}} | P1 | Code-level | Theme/view override + Custom plugin | Core (always on) |  |  |
| PRD-CHK-002 | Checkout | {{PG:PRD-CHK-002}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CHK-003 | Checkout validation | {{PG:PRD-CHK-003}} | P1 | Code-level | Custom plugin (DI override) | Core (always on) |  |  |
| PRD-CHK-004 | Multi-seller split checkout | {{PG:PRD-CHK-004}} | P1 | Code-level | Custom plugin (provider under OVR-REG) | Marketplace pack | PRD-PAY-010, PRD-SEL-017, PRD-CHK-003 | WF-ENG, PAY-DIRECT / LIC-01 |
| PRD-CHK-005 | Fulfilment method per line | {{PG:PRD-CHK-005}} | P1 | Code-level | Core modification | Postal and logistics pack |  |  |
| PRD-CHK-006 | Delivery slot and instructions | {{PG:PRD-CHK-006}} | P1 | Code-level | Custom plugin | Postal and logistics pack |  |  |
| PRD-CHK-007 | Structured address capture | {{PG:PRD-CHK-007}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-CHK-008 | Checkout resilience and idempotency | {{PG:PRD-CHK-008}} | P1 | Code-level | Custom plugin; Core modification (conditional) | Core (always on) |  |  |
| PRD-CHK-009 | E-transactions consumer controls | {{PG:PRD-CHK-009}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CHK-010 | Minimum order and fee thresholds | {{PG:PRD-CHK-010}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CHK-011 | Cart restriction rules | {{PG:PRD-CHK-011}} | P1 | Code-level | Custom plugin | Commerce extensions pack |  |  |
| PRD-CHK-012 | Pickup code / QR | {{PG:PRD-CHK-012}} | P1 | Code-level | Custom plugin | Postal and logistics pack | PRD-CHN-005 |  |
| PRD-CHK-013 | Assisted checkout | {{PG:PRD-CHK-013}} | P1 | Code-level | Custom plugin | Assisted service pack |  |  |
| PRD-CHK-014 | Estimated delivery at checkout | {{PG:PRD-CHK-014}} | P1 | Code-level | Theme/view override | Postal and logistics pack | PRD-LOG-005 |  |
| PRD-CHK-015 | Checkout attributes | {{PG:PRD-CHK-015}} | P1 | Configuration | None | Core (always on) |  | PH-INF |
| PRD-CHK-016 | B2B on-account payment and credit limits | {{PG:PRD-CHK-016}} | P1 | Code-level | Custom plugin | B2B trade pack | PRD-IAM-022, PRD-PAY-033 | PH-INF, PAID-STUB |
| PRD-CHK-017 | B2B quick order and bulk add | {{PG:PRD-CHK-017}} | P1 | Licensed plugin | None | B2B trade pack |  | PH-INF |
| PRD-CHK-018 | B2B purchase approval | {{PG:PRD-CHK-018}} | P1 | Code-level | Custom plugin | B2B trade pack | PRD-ADM-002, PRD-IAM-022 | PH-INF, WF-ENG |
| PRD-CHK-019 | Order confirmation | {{PG:PRD-CHK-019}} | P1 | Configuration | None | Core (always on) |  |  |

### A.8 PAY — Payments, tax, settlement and reconciliation (36)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-PAY-001 | Payment method framework and routing | {{PG:PRD-PAY-001}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PAY-002 | Card payments (framework) | {{PG:PRD-PAY-002}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 |  |
| PRD-PAY-003 | PayPal | {{PG:PRD-PAY-003}} | P1 | Configuration | None | Commerce extensions pack |  | K-08 |
| PRD-PAY-004 | Mobile money (framework) | {{PG:PRD-PAY-004}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024, PRD-INV-004 |  |
| PRD-PAY-005 | Bank transfer | {{PG:PRD-PAY-005}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 |  |
| PRD-PAY-006 | Letters of credit | {{PG:PRD-PAY-006}} | P1 | Code-level | Custom plugin (provider under OVR-REG) | B2B trade pack | PRD-ORD-010 |  |
| PRD-PAY-007 | Escrow and staged release | {{PG:PRD-PAY-007}} | P1 | External system | External system + integration plugin | B2B trade pack |  | PAY-DIRECT / LIC-01 |
| PRD-PAY-008 | Cash on delivery and cash at outlet | {{PG:PRD-PAY-008}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 |  |
| PRD-PAY-009 | Wallet and store credit | {{PG:PRD-PAY-009}} | P1 | Code-level | Custom plugin | Engagement and loyalty pack |  | FG-06, PAY-DIRECT / LIC-01, WAL-01 |
| PRD-PAY-010 | Split payments | {{PG:PRD-PAY-010}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-PAY-024 | PAY-DIRECT / LIC-01 |
| PRD-PAY-011 | Payment status lifecycle | {{PG:PRD-PAY-011}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PAY-012 | Payment idempotency | {{PG:PRD-PAY-012}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PAY-013 | Payment receipts | {{PG:PRD-PAY-013}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-CHN-005 |  |
| PRD-PAY-014 | Payment reconciliation | {{PG:PRD-PAY-014}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 |  |
| PRD-PAY-015 | Payment fees | {{PG:PRD-PAY-015}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PAY-016 | Refunds | {{PG:PRD-PAY-016}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 |  |
| PRD-PAY-017 | Chargebacks | {{PG:PRD-PAY-017}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PAY-018 | Payment and order risk controls | {{PG:PRD-PAY-018}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-PAY-019 | Payments operations console | {{PG:PRD-PAY-019}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PAY-020 | Tax calculation | {{PG:PRD-PAY-020}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-PAY-021 | Tax on fees and tax reporting | {{PG:PRD-PAY-021}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PAY-022 | Bulk disbursements | {{PG:PRD-PAY-022}} | P3 | Code-level | Custom plugin | Agri-finance and schemes pack | PRD-PAY-024 |  |
| PRD-PAY-023 | Multi-currency settlement | {{PG:PRD-PAY-023}} | P1 | Code-level | Custom plugin | Commerce extensions pack |  | C-FX |
| PRD-PAY-024 | Payment connector SDK | {{PG:PRD-PAY-024}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-PAY-025 | Fiscal e-invoicing framework | {{PG:PRD-PAY-025}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-ORD-009 | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-026 | KRA eTIMS adapter | {{PG:PRD-PAY-026}} | P1 | External system | External system + integration plugin | Country: Kenya | PRD-PAY-025 | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-027 | MRA EIS adapter | {{PG:PRD-PAY-027}} | P1 | External system | External system + integration plugin | Country: Malawi | PRD-PAY-025 | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-028 | M-Pesa (Kenya) adapter | {{PG:PRD-PAY-028}} | P1 | Code-level | Custom plugin | Country: Kenya | PRD-PAY-004 |  |
| PRD-PAY-029 | TNM Mpamba adapter | {{PG:PRD-PAY-029}} | P1 | Code-level | Custom plugin | Country: Malawi | PRD-PAY-004 |  |
| PRD-PAY-030 | Airtel Money adapter | {{PG:PRD-PAY-030}} | P1 | Code-level | Custom plugin | Country: Kenya/Malawi | PRD-PAY-004 |  |
| PRD-PAY-031 | KTDA bank card gateway adapter | {{PG:PRD-PAY-031}} | P1 | Code-level | Custom plugin | Client: KTDA | PRD-PAY-002 | KG-04 |
| PRD-PAY-032 | MPC card gateway adapter | {{PG:PRD-PAY-032}} | P1 | Code-level | Custom plugin | Client: MPC | PRD-PAY-002 | MG-03 |
| PRD-PAY-033 | Accounts receivable | {{PG:PRD-PAY-033}} | P1 | Code-level | Custom plugin | B2B trade pack |  | PAID-STUB |
| PRD-PAY-034 | Outlet receipt printing and cash-up | {{PG:PRD-PAY-034}} | P1 | Code-level | Custom plugin | Assisted service pack |  | PH-INF |
| PRD-PAY-035 | Direct payment to the seller | {{PG:PRD-PAY-035}} | P2 | Code-level | Custom plugin | Marketplace pack | PRD-PAY-024 | PO-REC-v8, PAY-DIRECT / LIC-01 |
| PRD-PAY-036 | Offline direct payment confirmation | {{PG:PRD-PAY-036}} | P2 | Code-level | Custom plugin | Marketplace pack | PRD-RET-007 | WF-ENG, PO-REC-v8, PAY-DIRECT / LIC-01 |

### A.9 ORD — Orders and B2B transactions (RFQ, contracts, requisitions, offers, group buying) (28)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-ORD-001 | Order management console | {{PG:PRD-ORD-001}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-ORD-002 | Configurable order status model | {{PG:PRD-ORD-002}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-ORD-003 | Order interventions with reason codes and audit | {{PG:PRD-ORD-003}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-004 |  |
| PRD-ORD-004 | Cancellation rules | {{PG:PRD-ORD-004}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-ORD-005 | Seller order processing | {{PG:PRD-ORD-005}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-ORD-006 | Partial fulfilment approval | {{PG:PRD-ORD-006}} | P1 | Code-level | Custom plugin | Marketplace pack |  |  |
| PRD-ORD-007 | Order numbering | {{PG:PRD-ORD-007}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-ORD-008 | Reorder | {{PG:PRD-ORD-008}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-ORD-009 | Invoices | {{PG:PRD-ORD-009}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-DOC-001 | DOC-LIB |
| PRD-ORD-010 | Order holds | {{PG:PRD-ORD-010}} | P1 | Code-level | Custom plugin (DI override) | Core (always on) |  |  |
| PRD-ORD-011 | Cut-offs and service levels | {{PG:PRD-ORD-011}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-ORD-012 | Request for quotation | {{PG:PRD-ORD-012}} | P1 | Code-level | Custom plugin | B2B trade pack |  |  |
| PRD-ORD-013 | Quote negotiation and conversion | {{PG:PRD-ORD-013}} | P1 | Code-level | Custom plugin | B2B trade pack | PRD-ORD-012 |  |
| PRD-ORD-014 | Seller offers | {{PG:PRD-ORD-014}} | P1 | Code-level | Custom plugin | B2B trade pack |  | K-01 |
| PRD-ORD-015 | Configurable requisition workflows | {{PG:PRD-ORD-015}} | P1 | Code-level | Custom plugin | B2B trade pack | PRD-ADM-002 | WF-ENG |
| PRD-ORD-016 | Contract drafting | {{PG:PRD-ORD-016}} | P1 | Code-level | Custom plugin | B2B trade pack | PRD-DOC-001 | DOC-LIB |
| PRD-ORD-017 | Contract e-signature | {{PG:PRD-ORD-017}} | P2 | External system | External system + integration plugin | B2B trade pack | PRD-ORD-016 | DOC-LIB |
| PRD-ORD-018 | Contract amendments | {{PG:PRD-ORD-018}} | P2 | Code-level | Custom plugin | B2B trade pack | PRD-ADM-002 | WF-ENG |
| PRD-ORD-019 | Contract repository | {{PG:PRD-ORD-019}} | P2 | Code-level | Custom plugin | B2B trade pack |  |  |
| PRD-ORD-020 | Award and acceptance letters | {{PG:PRD-ORD-020}} | P2 | Code-level | Custom plugin | B2B trade pack | PRD-DOC-001 | DOC-LIB |
| PRD-ORD-021 | Performance securities | {{PG:PRD-ORD-021}} | P3 | Code-level | Custom plugin | B2B trade pack |  |  |
| PRD-ORD-022 | Contract-to-order execution | {{PG:PRD-ORD-022}} | P1 | Code-level | Custom plugin | B2B trade pack | PRD-ORD-016 | CALLOFF-PLACE, DOC-LIB |
| PRD-ORD-023 | Group buying | {{PG:PRD-ORD-023}} | P2 | Code-level | Custom plugin | Engagement and loyalty pack |  |  |
| PRD-ORD-024 | Scheme applications | {{PG:PRD-ORD-024}} | P3 | Code-level | Custom plugin | Agri-finance and schemes pack | PRD-ADM-002 | WF-ENG |
| PRD-ORD-025 | Proforma invoice | {{PG:PRD-ORD-025}} | P1 | Code-level | Custom plugin | B2B trade pack | PRD-DOC-001 | PH-INF, DOC-LIB |
| PRD-ORD-026 | Incoterms | {{PG:PRD-ORD-026}} | P1 | Code-level | Custom plugin | B2B trade pack |  | PH-INF |
| PRD-ORD-027 | Sample orders | {{PG:PRD-ORD-027}} | P2 | Code-level | Custom plugin | B2B trade pack |  |  |
| PRD-ORD-028 | Recurring and subscription orders | {{PG:PRD-ORD-028}} | P2 | Code-level | Custom plugin | Engagement and loyalty pack |  |  |

### A.10 LOG — Shipping, logistics and fulfilment (32)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-LOG-001 | Shipping methods and rates | {{PG:PRD-LOG-001}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-LOG-002 | Delivery fee rule engine | {{PG:PRD-LOG-002}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-003 | Pickup points and outlets | {{PG:PRD-LOG-003}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-004 | Serviceability rules | {{PG:PRD-LOG-004}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-005 | Estimated delivery time engine | {{PG:PRD-LOG-005}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-006 | DHL adapter | {{PG:PRD-LOG-006}} | P1 | Licensed plugin | None | Carrier adapter (reusable) | PRD-LOG-021 |  |
| PRD-LOG-007 | Shipping labels and barcodes | {{PG:PRD-LOG-007}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-008 | Fulfilment allocation and routing | {{PG:PRD-LOG-008}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-009 | Warehouse pick, pack, dispatch | {{PG:PRD-LOG-009}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-010 | Shipments | {{PG:PRD-LOG-010}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-LOG-011 | Logistics task creation and seller pickup | {{PG:PRD-LOG-011}} | P1 | Code-level | Custom plugin | Postal and logistics pack |  | FG-06 |
| PRD-LOG-012 | Proof of delivery record | {{PG:PRD-LOG-012}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-013 | Delivery exceptions | {{PG:PRD-LOG-013}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-014 | COD cash reconciliation | {{PG:PRD-LOG-014}} | P1 | Code-level | Custom plugin | Postal and logistics pack |  |  |
| PRD-LOG-015 | Address validation and geocoding | {{PG:PRD-LOG-015}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-016 | Cross-border shipping | {{PG:PRD-LOG-016}} | P1 | External system | External system + integration plugin | Postal and logistics pack |  |  |
| PRD-LOG-017 | Holding charges and pre-dispatch changes | {{PG:PRD-LOG-017}} | P1 | Code-level | Custom plugin | Postal and logistics pack |  |  |
| PRD-LOG-018 | Logistics KPIs | {{PG:PRD-LOG-018}} | P1 | Code-level | Custom plugin | Postal and logistics pack |  | PAID-STUB |
| PRD-LOG-019 | Specialised logistics | {{PG:PRD-LOG-019}} | P3 | External system | External system + integration plugin | Warehouse pack |  |  |
| PRD-LOG-020 | S10 identifiers | {{PG:PRD-LOG-020}} | P1 | Code-level | Custom plugin | Postal and logistics pack |  |  |
| PRD-LOG-021 | Carrier connector framework | {{PG:PRD-LOG-021}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-LOG-022 | Post-office drop-off acceptance | {{PG:PRD-LOG-022}} | P1 | Code-level | Custom plugin | Postal and logistics pack | PRD-TRK-003 | FG-06 |
| PRD-LOG-023 | Hub-and-spoke sorting | {{PG:PRD-LOG-023}} | P1 | External system | External system + integration plugin | Postal and logistics pack | PRD-TRK-003 | FG-06 |
| PRD-LOG-024 | Last-mile route lists and attempts | {{PG:PRD-LOG-024}} | P1 | Code-level | Custom plugin | Postal and logistics pack | PRD-TRK-003 | FG-06 |
| PRD-LOG-025 | FedEx adapter | {{PG:PRD-LOG-025}} | P1 | Code-level | Custom plugin | Carrier adapter (reusable) | PRD-LOG-021 |  |
| PRD-LOG-026 | G4S adapter | {{PG:PRD-LOG-026}} | P1 | Code-level | Custom plugin | Carrier adapter (reusable, Kenya) | PRD-LOG-021 |  |
| PRD-LOG-027 | Skynet adapter | {{PG:PRD-LOG-027}} | P1 | Code-level | Custom plugin | Carrier adapter (reusable, Kenya) | PRD-LOG-021 |  |
| PRD-LOG-028 | Wells Fargo (Kenya) courier adapter | {{PG:PRD-LOG-028}} | P1 | Code-level | Custom plugin | Carrier adapter (reusable, Kenya) | PRD-LOG-021 |  |
| PRD-LOG-029 | Aramex adapter | {{PG:PRD-LOG-029}} | P1 | Code-level | Custom plugin | Carrier adapter (reusable) | PRD-LOG-021 |  |
| PRD-LOG-030 | Shipping lines and agents adapter | {{PG:PRD-LOG-030}} | P1 | Code-level | Custom plugin | Carrier adapter (reusable, Kenya) | PRD-LOG-021 |  |
| PRD-LOG-031 | MPC delivery partner adapters | {{PG:PRD-LOG-031}} | P1 | Code-level | Custom plugin | Client: MPC | PRD-LOG-021 |  |
| PRD-LOG-032 | Own-fleet POD capture | {{PG:PRD-LOG-032}} | P1 | External system | External system + integration plugin | Postal and logistics pack | PRD-TRK-003, PRD-LOG-012 | FG-06, PAID-STUB |

### A.11 TRK — Tracking and notifications (12)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-TRK-001 | Buyer shipment tracking | {{PG:PRD-TRK-001}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-TRK-002 |  |
| PRD-TRK-002 | Tracking event hub | {{PG:PRD-TRK-002}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-TRK-003 | Scanning and field operations app | {{PG:PRD-TRK-003}} | P1 | External system | External system + integration plugin | Postal and logistics pack |  | FG-06 |
| PRD-TRK-004 | Email notifications and templates | {{PG:PRD-TRK-004}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PLT-008 |  |
| PRD-TRK-005 | Notification engine (multi-channel) | {{PG:PRD-TRK-005}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-TRK-006 | Notification preferences | {{PG:PRD-TRK-006}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-TRK-007 | Notification delivery tracking and audit | {{PG:PRD-TRK-007}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-004 |  |
| PRD-TRK-008 | In-app notification feed | {{PG:PRD-TRK-008}} | P2 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-TRK-009 | Proactive outreach and outage notices | {{PG:PRD-TRK-009}} | P1 | Code-level | Custom plugin | Postal and logistics pack |  |  |
| PRD-TRK-010 | Seller shipment visibility | {{PG:PRD-TRK-010}} | P1 | Configuration | None | Marketplace pack |  |  |
| PRD-TRK-011 | Guest order-status lookup | {{PG:PRD-TRK-011}} | P1 | Licensed plugin | None | Core (always on) | PRD-TRK-002 |  |
| PRD-TRK-012 | Shipment and pickup event notifications | {{PG:PRD-TRK-012}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-CHN-005, PRD-TRK-005 |  |

### A.12 RET — Returns, refunds and disputes (11)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-RET-001 | Return requests | {{PG:PRD-RET-001}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-RET-002 | Return eligibility rules | {{PG:PRD-RET-002}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-RET-003 | Return logistics | {{PG:PRD-RET-003}} | P1 | Code-level | Custom plugin | Core (always on) |  | T-MISS |
| PRD-RET-004 | Return inspection | {{PG:PRD-RET-004}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-RET-005 | Automatic refund trigger | {{PG:PRD-RET-005}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-016 |  |
| PRD-RET-006 | Return fees | {{PG:PRD-RET-006}} | P1 | Code-level | Custom plugin | Commerce extensions pack |  |  |
| PRD-RET-007 | Dispute and issue cases | {{PG:PRD-RET-007}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002, PRD-CRM-014 | WF-ENG |
| PRD-RET-008 | Dispute SLAs and escalation | {{PG:PRD-RET-008}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-ADM-002, PRD-RET-007, PRD-CRM-014 | WF-ENG |
| PRD-RET-009 | Case retention and reports | {{PG:PRD-RET-009}} | P1 | Code-level | Custom plugin | Service desk extensions pack |  |  |
| PRD-RET-010 | Seller return review | {{PG:PRD-RET-010}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-RET-001, PRD-CRM-014 |  |
| PRD-RET-011 | Buyer–seller mediation | {{PG:PRD-RET-011}} | P1 | Code-level | Custom plugin | Marketplace pack | PRD-RET-007 | WF-ENG |

### A.13 CRM — Customer service, help desk and chat (15)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-CRM-001 | Help desk ticketing | {{PG:PRD-CRM-001}} | P1 | Licensed plugin | None | Core (always on) | PRD-CRM-014 |  |
| PRD-CRM-002 | Multi-channel case intake | {{PG:PRD-CRM-002}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CRM-003 | Agent 360° view | {{PG:PRD-CRM-003}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-CRM-004 | Complaints process | {{PG:PRD-CRM-004}} | P1 | Code-level | Custom plugin | Service desk extensions pack | PRD-ADM-002, PRD-RET-007, PRD-CRM-014 | WF-ENG, T-MISS |
| PRD-CRM-005 | Support quality analytics | {{PG:PRD-CRM-005}} | P1 | Code-level | Custom plugin | Analytics pack |  |  |
| PRD-CRM-006 | Ticket collaboration and audit | {{PG:PRD-CRM-006}} | P1 | Code-level | Custom plugin | Service desk extensions pack | PRD-SEC-004 |  |
| PRD-CRM-007 | Knowledge base | {{PG:PRD-CRM-007}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-CRM-008 | Live web chat | {{PG:PRD-CRM-008}} | P1 | Licensed plugin | None | Engagement and loyalty pack | PRD-CHN-006 |  |
| PRD-CRM-009 | Contact and messaging | {{PG:PRD-CRM-009}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-CRM-010 | Fraud reporting and referral | {{PG:PRD-CRM-010}} | P1 | Code-level | Custom plugin | Service desk extensions pack |  |  |
| PRD-CRM-011 | Experience feedback | {{PG:PRD-CRM-011}} | P1 | Code-level | Custom plugin | Engagement and loyalty pack |  |  |
| PRD-CRM-012 | Support channel directory | {{PG:PRD-CRM-012}} | P2 | Code-level | Custom plugin | Service desk extensions pack |  |  |
| PRD-CRM-013 | Community forums | {{PG:PRD-CRM-013}} | P3 | Configuration | None | Engagement and loyalty pack |  |  |
| PRD-CRM-014 | Issue routing and escalation | {{PG:PRD-CRM-014}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-CRM-015 | B2B account management | {{PG:PRD-CRM-015}} | P2 | Code-level | Custom plugin | B2B trade pack |  |  |

### A.14 MKT — Marketing, promotions, loyalty, content and SEO (14)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-MKT-001 | Discounts and coupons | {{PG:PRD-MKT-001}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-MKT-002 | Advanced promotions | {{PG:PRD-MKT-002}} | P1 | Code-level | Custom plugin | Engagement and loyalty pack |  |  |
| PRD-MKT-003 | Reward points | {{PG:PRD-MKT-003}} | P1 | Configuration | None | Engagement and loyalty pack |  |  |
| PRD-MKT-004 | Gift cards and vouchers | {{PG:PRD-MKT-004}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-MKT-005 | Newsletter and email campaigns | {{PG:PRD-MKT-005}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-MKT-006 | On-site pop-ups | {{PG:PRD-MKT-006}} | P1 | Code-level | Custom plugin | Engagement and loyalty pack |  |  |
| PRD-MKT-007 | Content management | {{PG:PRD-MKT-007}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-MKT-008 | Content approval and policy versioning | {{PG:PRD-MKT-008}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002 | WF-ENG |
| PRD-MKT-009 | SEO | {{PG:PRD-MKT-009}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-MKT-010 | Marketing tags and social | {{PG:PRD-MKT-010}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-MKT-011 | Customer segmentation attributes | {{PG:PRD-MKT-011}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-MKT-012 | Abandoned-cart recovery | {{PG:PRD-MKT-012}} | P2 | Configuration | None (email); Custom plugin if SMS reminders required | Engagement and loyalty pack | PRD-TRK-005 |  |
| PRD-MKT-013 | Affiliates and referrals | {{PG:PRD-MKT-013}} | P2 | Code-level | Custom plugin | Engagement and loyalty pack |  |  |
| PRD-MKT-014 | Seller-managed pricing and promotions | {{PG:PRD-MKT-014}} | P1 | Configuration | None | Marketplace pack |  |  |

### A.15 RPT — Reporting and analytics (12)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-RPT-001 | Standard reports and dashboard | {{PG:PRD-RPT-001}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-RPT-002 | KPI framework and executive dashboards | {{PG:PRD-RPT-002}} | P1 | External system | External system + integration plugin | Core (always on) | PRD-RPT-003 | PAID-STUB |
| PRD-RPT-003 | Data warehouse and ETL | {{PG:PRD-RPT-003}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-RPT-004 | Report delivery and self-service | {{PG:PRD-RPT-004}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-RPT-005 | Report access control | {{PG:PRD-RPT-005}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-RPT-006 | Compliance and audit reports | {{PG:PRD-RPT-006}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-RPT-007 | Public transparency dashboard | {{PG:PRD-RPT-007}} | P3 | Code-level | Custom plugin | Analytics pack |  |  |
| PRD-RPT-008 | External BI connectivity | {{PG:PRD-RPT-008}} | P2 | Licensed plugin | None | Analytics pack |  | PAID-STUB |
| PRD-RPT-009 | Operator performance metrics | {{PG:PRD-RPT-009}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-RPT-010 | Operational dashboards | {{PG:PRD-RPT-010}} | P1 | External system | External system + integration plugin | Analytics pack | PRD-RPT-002 | PAID-STUB |
| PRD-RPT-011 | Commerce and marketing analytics | {{PG:PRD-RPT-011}} | P1 | External system | External system + integration plugin | Core (both clients) | PRD-RPT-002 | PAID-STUB |
| PRD-RPT-012 | e-Government and engagement reports | {{PG:PRD-RPT-012}} | P1 | External system | External system + integration plugin | e-Government pack | PRD-RPT-002 | FG-06, PAID-STUB |

### A.16 ADM — Administration, workflow and operations console (12)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-ADM-001 | Administration console | {{PG:PRD-ADM-001}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-ADM-002 | Workflow engine | {{PG:PRD-ADM-002}} | P1 | Code-level | Custom plugin | Core (always on) |  | WF-ENG |
| PRD-ADM-003 | Business rules engine | {{PG:PRD-ADM-003}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-ADM-004 | Transaction types and parameter schema | {{PG:PRD-ADM-004}} | P2 | Code-level | Custom plugin | Core (always on) | PRD-ADM-003 |  |
| PRD-ADM-005 | Eligibility and quota rules | {{PG:PRD-ADM-005}} | P2 | Code-level | Custom plugin | Core (always on) | PRD-SEL-013 |  |
| PRD-ADM-006 | Approval queues | {{PG:PRD-ADM-006}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002 | WF-ENG |
| PRD-ADM-007 | Operations console and work queues | {{PG:PRD-ADM-007}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-ADM-008 | Upload and content scanning controls | {{PG:PRD-ADM-008}} | P1 | Code-level | Custom plugin + External system + integration plugin | Core (always on) |  |  |
| PRD-ADM-009 | Exception management | {{PG:PRD-ADM-009}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-ADM-010 | Operational alerts | {{PG:PRD-ADM-010}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-ADM-011 | Template library | {{PG:PRD-ADM-011}} | P2 | Code-level | Custom plugin | Core (always on) | PRD-ADM-004 |  |
| PRD-ADM-012 | Template analytics and shared marketplace | {{PG:PRD-ADM-012}} | P3 | Code-level | Custom plugin | Commerce extensions pack | PRD-ADM-011 |  |

### A.17 DOC — Documents and records (6)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-DOC-001 | Document generation | {{PG:PRD-DOC-001}} | P1 | Code-level | Custom plugin | Core (always on) |  | DOC-LIB |
| PRD-DOC-002 | Document storage | {{PG:PRD-DOC-002}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-DOC-003 | Document integrity | {{PG:PRD-DOC-003}} | P2 | Code-level | Custom plugin + External system + integration plugin | Core (always on) |  |  |
| PRD-DOC-004 | Document review and compliance export | {{PG:PRD-DOC-004}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-DOC-005 | Document requirements and validation | {{PG:PRD-DOC-005}} | P2 | External system | External system + integration plugin | Core (always on) | PRD-DOC-002 |  |
| PRD-DOC-006 | Export document set | {{PG:PRD-DOC-006}} | P1 | Code-level | Custom plugin | B2B trade pack | PRD-DOC-001 | DOC-LIB |

### A.18 SEC — Security, audit and compliance (15)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-SEC-001 | Encryption and transport security | {{PG:PRD-SEC-001}} | P1 | Configuration | None | Core (always on) | PRD-PLT-007 |  |
| PRD-SEC-002 | Edge protection | {{PG:PRD-SEC-002}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-SEC-003 | PCI-DSS scope control | {{PG:PRD-SEC-003}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-SEC-004 | Platform audit trail | {{PG:PRD-SEC-004}} | P1 | Code-level | Custom plugin (DI override) | Core (always on) |  |  |
| PRD-SEC-005 | Anomaly and correlation detection | {{PG:PRD-SEC-005}} | P2 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-SEC-006 | Data residency | {{PG:PRD-SEC-006}} | P1 | External system | External system + integration plugin | Core (always on) |  | DP-01 |
| PRD-SEC-007 | Consent and privacy tools | {{PG:PRD-SEC-007}} | P1 | Configuration | None | Core (always on) | PRD-SEC-012 |  |
| PRD-SEC-008 | Breach notification workflow | {{PG:PRD-SEC-008}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-012 |  |
| PRD-SEC-009 | Compliance reports and certificates | {{PG:PRD-SEC-009}} | P2 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-SEC-010 | Auditor read-only access | {{PG:PRD-SEC-010}} | P2 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-SEC-011 | Vulnerability management | {{PG:PRD-SEC-011}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-SEC-012 | Country data-protection pack | {{PG:PRD-SEC-012}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-SEC-013 | Bot protection | {{PG:PRD-SEC-013}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-SEC-014 | Data classification and masking | {{PG:PRD-SEC-014}} | P2 | Code-level | Custom plugin + Theme/view override | Core (always on) | PRD-SEC-006 | DP-01 |
| PRD-SEC-015 | Security incident management | {{PG:PRD-SEC-015}} | P2 | External system | External system + integration plugin | Core (always on) |  |  |

### A.19 INT — Integrations and APIs (13)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-INT-001 | Public REST API | {{PG:PRD-INT-001}} | P1 | Code-level | Custom plugin (on licensed Web API plugin) | Core (always on) |  | API-01, PAID-STUB, API-GW |
| PRD-INT-002 | Integration layer (API gateway) | {{PG:PRD-INT-002}} | P1 | External system | External system + integration plugin | Core (always on) |  | API-GW |
| PRD-INT-003 | Webhooks and events | {{PG:PRD-INT-003}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-INT-004 | Integration health and retries | {{PG:PRD-INT-004}} | P1 | External system | External system + integration plugin | Core (always on) |  |  |
| PRD-INT-005 | ERP and finance connector framework | {{PG:PRD-INT-005}} | P1 | Code-level | Custom plugin | Core (always on) |  | PAID-STUB |
| PRD-INT-006 | SAGE 200 adapter | {{PG:PRD-INT-006}} | P1 | Code-level | Custom plugin | Client: MPC |  |  |
| PRD-INT-007 | PostGlobal adapter | {{PG:PRD-INT-007}} | P1 | Code-level | Custom plugin | Client: MPC |  |  |
| PRD-INT-008 | Banking integrations | {{PG:PRD-INT-008}} | P1 | Code-level | Custom plugin | Commerce extensions pack |  |  |
| PRD-INT-009 | Government system connector framework | {{PG:PRD-INT-009}} | P1 | Code-level | Custom plugin | e-Government pack |  |  |
| PRD-INT-010 | Master data synchronisation | {{PG:PRD-INT-010}} | P1 | Code-level | Custom plugin | Core (always on) |  |  |
| PRD-INT-011 | Plugin extensibility | {{PG:PRD-INT-011}} | P1 | Configuration | None | Core (always on) |  |  |
| PRD-INT-012 | Punch-out | {{PG:PRD-INT-012}} | P3 | Configuration | None (configure bundled plugin); Custom plugin only for OCI / cXML OrderRequest | B2B trade pack |  |  |
| PRD-INT-013 | MANEPS adapter | {{PG:PRD-INT-013}} | P1 | Code-level | Custom plugin | Client: MPC | PRD-INT-009 | MG-09 |

### A.20 CHN — Channels: mobile app, PWA, USSD, SMS, WhatsApp, assisted/agent (13)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-CHN-001 | Native mobile apps | {{PG:PRD-CHN-001}} | P1 | Licensed plugin | None | Channels pack |  | M-19, PAID-STUB |
| PRD-CHN-002 | PWA and low-bandwidth mode | {{PG:PRD-CHN-002}} | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) |  |  |
| PRD-CHN-003 | USSD channel | {{PG:PRD-CHN-003}} | P1 | External system | External system + integration plugin | Channels pack |  |  |
| PRD-CHN-004 | IVR channel | {{PG:PRD-CHN-004}} | P2 | External system | External system + integration plugin | Channels pack | PRD-TRK-005 |  |
| PRD-CHN-005 | SMS gateway and SMS commands | {{PG:PRD-CHN-005}} | P1 | Code-level | Custom plugin | Core (always on) | PRD-TRK-005 |  |
| PRD-CHN-006 | WhatsApp Business | {{PG:PRD-CHN-006}} | P1 | Code-level | External system + integration plugin | Channels pack | PRD-TRK-005 |  |
| PRD-CHN-007 | WeChat | {{PG:PRD-CHN-007}} | P1 | Code-level | External system + integration plugin | Channels pack |  |  |
| PRD-CHN-008 | Telegram bot | {{PG:PRD-CHN-008}} | P3 | Code-level | External system + integration plugin | Channels pack |  |  |
| PRD-CHN-009 | Agent and correspondent networks | {{PG:PRD-CHN-009}} | P2 | Code-level | Custom plugin | Assisted service pack |  |  |
| PRD-CHN-010 | Field agent app | {{PG:PRD-CHN-010}} | P2 | External system | External system + integration plugin | Assisted service pack | PRD-TRK-003 | FG-06 |
| PRD-CHN-011 | Social media integration | {{PG:PRD-CHN-011}} | P1 | Configuration | None | Channels pack |  |  |
| PRD-CHN-012 | SMS sender ID and opt-out | {{PG:PRD-CHN-012}} | P2 | Code-level | Custom plugin | Core (always on) | PRD-CHN-005 |  |
| PRD-CHN-013 | Push notifications | {{PG:PRD-CHN-013}} | P2 | Code-level | External system + integration plugin | Channels pack | PRD-TRK-005 |  |

### A.21 AI — AI capabilities (10)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-AI-001 | AI translation | {{PG:PRD-AI-001}} | P3 | Code-level | Custom plugin + Theme/view override | AI pack |  |  |
| PRD-AI-002 | AI listing assistance | {{PG:PRD-AI-002}} | P3 | Code-level | Custom plugin | AI pack |  |  |
| PRD-AI-003 | AI chatbot | {{PG:PRD-AI-003}} | P1 | Code-level | Custom plugin + External system + integration plugin | AI pack | PRD-CHN-006, PRD-AI-010 |  |
| PRD-AI-004 | AI drafting and summarisation | {{PG:PRD-AI-004}} | P3 | Code-level | Custom plugin | AI pack |  |  |
| PRD-AI-005 | OCR and ID document checks | {{PG:PRD-AI-005}} | P2 | External system | External system + integration plugin | AI pack |  |  |
| PRD-AI-006 | ML fraud detection | {{PG:PRD-AI-006}} | P3 | External system | External system + integration plugin | AI pack |  |  |
| PRD-AI-007 | ML recommendation engine | {{PG:PRD-AI-007}} | P3 | External system | External system + integration plugin | AI pack | PRD-SRC-009 |  |
| PRD-AI-008 | Forecasting and image inspection | {{PG:PRD-AI-008}} | P3 | External system | External system + integration plugin | AI pack |  |  |
| PRD-AI-009 | AI contract and letter drafting | {{PG:PRD-AI-009}} | P3 | Code-level | Custom plugin | AI pack |  |  |
| PRD-AI-010 | AI governance | {{PG:PRD-AI-010}} | P1 | External system | External system + integration plugin | AI pack |  |  |

### A.22 FIN — Financial products (5)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-FIN-001 | Credit marketplace | {{PG:PRD-FIN-001}} | P3 | External system | External system + integration plugin | Agri-finance and schemes pack |  |  |
| PRD-FIN-002 | Invoice discounting | {{PG:PRD-FIN-002}} | P3 | External system | External system + integration plugin | Agri-finance and schemes pack |  |  |
| PRD-FIN-003 | Insurance | {{PG:PRD-FIN-003}} | P3 | External system | External system + integration plugin | Agri-finance and schemes pack |  |  |
| PRD-FIN-004 | Subsidies and incentives | {{PG:PRD-FIN-004}} | P3 | Code-level | Custom plugin | Agri-finance and schemes pack |  |  |
| PRD-FIN-005 | Financial and partner services catalogue | {{PG:PRD-FIN-005}} | P1 | Code-level | Custom plugin + External system + integration plugin | e-Government pack |  | FG-06, T-MISS |

### A.23 EGV — e-Government and service catalogue (optional pack) (7)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-EGV-001 | e-Government service catalogue | {{PG:PRD-EGV-001}} | P1 | Configuration | None | e-Government pack |  | FG-06, T-MISS |
| PRD-EGV-002 | Service applications | {{PG:PRD-EGV-002}} | P1 | Code-level | Custom plugin | e-Government pack | PRD-ADM-002 | FG-06, WF-ENG, T-MISS |
| PRD-EGV-003 | Appointments | {{PG:PRD-EGV-003}} | P1 | Code-level | Custom plugin | e-Government pack | PRD-CAT-027 | FG-06, T-MISS |
| PRD-EGV-004 | Document delivery | {{PG:PRD-EGV-004}} | P1 | Code-level | Custom plugin | e-Government pack | PRD-ORD-010 | FG-06, T-MISS |
| PRD-EGV-005 | Government fee collection | {{PG:PRD-EGV-005}} | P1 | Code-level | Custom plugin | e-Government pack |  | FG-06, T-MISS |
| PRD-EGV-006 | Agency administration | {{PG:PRD-EGV-006}} | P1 | Code-level | Custom plugin | e-Government pack |  | FG-06, T-MISS |
| PRD-EGV-007 | Digital ID service workflows | {{PG:PRD-EGV-007}} | P1 | Code-level | Custom plugin + External system + integration plugin | e-Government pack | PRD-ADM-002 | FG-06, WF-ENG, T-MISS |

### A.24 SVC — Services commerce (booking, delivery and completion of services; SVC-007 covers electronically delivered goods) (12)

| PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold |
|---|---|---|---|---|---|---|---|---|
| PRD-SVC-001 | Service pricing models | {{PG:PRD-SVC-001}} | P2 | Code-level | Custom plugin + Theme/view override | Services and bookings pack | PRD-CAT-026 | PO-REC-v8 |
| PRD-SVC-002 | Service providers and resources | {{PG:PRD-SVC-002}} | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-026 |  |
| PRD-SVC-003 | Booking changes, cancellations and no-shows | {{PG:PRD-SVC-003}} | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-027 | FG-06, PO-REC-v8 |
| PRD-SVC-004 | Deposits and advance payment for bookings | {{PG:PRD-SVC-004}} | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-027, PRD-PAY-016 | FG-06, PO-REC-v8 |
| PRD-SVC-005 | Service order lifecycle and completion sign-off | {{PG:PRD-SVC-005}} | P1 | Code-level | Custom plugin | Services and bookings pack | PRD-ORD-002 |  |
| PRD-SVC-006 | Service location at booking | {{PG:PRD-SVC-006}} | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-LOG-004 | PO-REC-v8 |
| PRD-SVC-007 | Digital products and downloads | {{PG:PRD-SVC-007}} | P2 | Configuration | None | Core (always on) |  | PO-REC-v8 |
| PRD-SVC-008 | Rental and hire | {{PG:PRD-SVC-008}} | P2 | Code-level | Custom plugin | Services and bookings pack |  |  |
| PRD-SVC-009 | Service vouchers and e-tickets | {{PG:PRD-SVC-009}} | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-026 | PO-REC-v8 |
| PRD-SVC-010 | Service reminders and follow-up | {{PG:PRD-SVC-010}} | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-TRK-005 | PO-REC-v8 |
| PRD-SVC-011 | Service-level targets for service orders | {{PG:PRD-SVC-011}} | P1 | Code-level | Custom plugin | Services and bookings pack | PRD-ORD-011 |  |
| PRD-SVC-012 | Service reports | {{PG:PRD-SVC-012}} | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-027 | FG-06, PO-REC-v8 |


## Appendix B. Glossary (84) and IDs used in this document

| Term | Plain meaning |
|---|---|
| nopCommerce | The open-source online-shop software the product is built on (version 5.00.1 on .NET 10, source tag release-5.00.1; decision VER-500). |
| Plugin | An add-on that adds a feature to nopCommerce without changing its core. |
| AFR extensions | Custom add-ons built for Ethiopost's Post Gebeya shop; their source code is not available (FG-05). |
| B2B / B2C | Business-to-business (selling to companies) / business-to-consumer (selling to the public). |
| G2C / G2B | Government-to-citizen / government-to-business services. |
| PBI | Product Backlog item — one piece of work in the Product Backlog. |
| Platform core | Features every client always gets. |
| Product option / pack | Features switched on per client; related options are grouped into packs (for example the B2B trade pack). |
| Client-specific extension | An adapter or item for one client or one country (for example the M-Pesa connection). |
| Adapter / connector | A small piece of software that links the product to an outside service such as a payment provider or courier. |
| Configuration pack | A saved set of settings applied when a client is set up. |
| SKU | Stock-keeping unit — a product code. |
| API | A technical interface that lets two systems exchange data. |
| Webhook | An automatic message sent to another system when something happens. |
| OTP | One-time password — a short code sent by SMS to confirm identity. |
| MFA | Multi-factor authentication — a second check at login. |
| SSO | Single sign-on — one login for several systems. |
| M-Pesa, TNM Mpamba, Airtel Money | Mobile-money services in Kenya and Malawi. |
| CBK | Central Bank of Kenya. |
| KES / MWK | Kenyan shilling / Malawian kwacha. |
| KRA eTIMS / MRA EIS | Electronic invoicing systems of the Kenya and Malawi revenue authorities. |
| VAT / TIN / KRA PIN | Value-added tax / tax identification number / Kenya tax PIN. |
| Letter of credit (LC) | A bank's promise to pay a seller once shipping documents are presented. |
| Escrow | Money held by a trusted party until conditions are met. |
| Incoterms | International rules saying who pays for and is responsible for transport (for example FOB, CIF). |
| Proforma invoice | A preliminary invoice issued before payment or shipment. |
| Phytosanitary certificate | An official certificate that plant products are free of pests and diseases. |
| HS code | An international customs code for a type of product. |
| RFQ | Request for quotation — a buyer asks sellers for prices. |
| UPU S10 | The international standard format for postal tracking numbers. |
| CDS / IPS | Postal systems for customs declarations and international parcel tracking. |
| PostGlobal | Malawi Post's postal operations system. |
| SAGE 200 | Malawi Post's accounting system. |
| MANEPS | Malawi's national electronic government procurement system. |
| POD | Proof of delivery. |
| 3PL | Third-party logistics company (courier). |
| FEFO | First expired, first out — pick the stock that expires soonest. |
| USSD | Short-code menus on any mobile phone (for example *123#), no internet needed. |
| IVR | Automated phone menus. |
| PWA | Progressive web app — a website that can be installed and used like an app. |
| WCAG 2.1 AA | International accessibility standard for websites. |
| PCI-DSS | Card industry security standard. |
| DSAR | Data subject access request — a person asking for a copy of their data. |
| DPIA | Data protection impact assessment. |
| Data warehouse / ETL | A separate database for reporting / the process that copies and cleans data into it. |
| BI | Business intelligence — reporting and dashboard tools. |
| Build level | Position in the dependency chain: level 0 has no prerequisites; higher levels need lower ones first. |
| V-01 | Decision-log item: verify platform claims and plugin compatibility; since decision VER-500 on nopCommerce 5.00.1 (release-5.00.1). |
| ERP | The business system a company uses for accounts, stock and purchasing. |
| REST API | A common way for systems to exchange data over the internet. |
| SEO | Making the shop easy to find in Google and other search engines. |
| SDK | A ready-made kit of code and rules for building connections. |
| SSL / TLS | The encryption behind the browser padlock. |
| NFR | Non-functional requirement: a quality the system must have (speed, size, security) rather than a feature. |
| SLA | Service-level agreement: an agreed time or quality target. |
| OCR | Reading text from a photo or scan automatically. |
| ML | Machine learning: software that learns patterns from past data. |
| WMS | Warehouse management system. |
| COD | Cash on delivery. |
| KPI | Key performance indicator: a key measure of results. |
| KYC | Know your customer: checking who a customer or seller really is. |
| QR code | A square barcode read by a phone camera. |
| XML | A standard file format for exchanging data. |
| Idempotency | A repeated request has the same effect as one request, so pressing 'pay' twice never charges twice. |
| Taxonomy | The tree of product categories. |
| Faceted filters | Filters such as price, brand or size that narrow search results. |
| Cycle count | Counting part of the stock on a schedule instead of everything at once. |
| Call-off / drawdown | An order placed against an existing contract. |
| KTDA | Kenya Tea Development Agency. |
| MPC | Malawi Posts Corporation (also written 'Malawi Post Corporation' in the ToR). |
| Product Goal | The long-term objective for the Scrum Team; the Product Backlog serves it. |
| Product Backlog | The ordered list of everything needed to improve the product. |
| Product Owner | The person accountable for the product's value, the Product Backlog and its order. |
| Developers | The people in the Scrum Team who do the work and size it. |
| Scrum Team | The Product Owner, the Scrum Master and the Developers. |
| Sprint | A fixed period of one month or less in which the work is done. |
| Sprint Planning | The event that starts a Sprint and decides what will be done. |
| Increment | A usable step toward the Product Goal. |
| Definition of Done | The quality standard every Increment must meet. |
| JSON / CSV | Common file formats for exchanging data. |
| Till / paybill | M-Pesa business numbers that customers pay into. |
| SOC 2 / ISO 27001 | International standards for an organisation's security controls; certification is by an external auditor. |
| GraphQL | A flexible way for other systems to ask the API for exactly the data they need. |
| Chain of custody | A record of who held an item and when. |

### Decision and gap IDs used in this document (97)

A status line such as "On hold: FG-06" or "Readiness conditions: CFG-01" names one of these IDs. The full text, owner and history of each is in the Decisions, gaps and open items register.

| ID | Meaning | Status |
|---|---|---|
| D-01 | Reuse tiers: Platform core / Common core / Product option (named packs) / Client-specific extension; Platform core is always on irrespective of client demand. | Approved |
| D-02 | Tender, auction and bid management excluded; RFQ, contracts, scheme payouts, group buying and template engine retained. | Approved |
| K-01 | KTDA OFR-002 'receive buyer bids' vs bid exclusion | Open — user |
| C-FX | KTDA LOC-002 USD base currency vs M-Pesa settlement in KES (PAY-004) | Open — ask KTDA |
| C-SIZE | MPC HST-002 sizing (4 cores/8 GB/2 TB) vs co-hosting data warehouse, search engine, API gateway. | Open — ask MPC (floor or ceiling) |
| FG-06 | Postal operations (LOG-011, LOG-022–024, LOG-032, TRK-003) in product vs via PostGlobal | Open — MPC |
| FG-05 | AFR extension source code availability; drives reuse vs rebuild for features with route 'AFR extension reuse'. | Open — AFRICOM/Ethiopost |
| F-CAT-B | Tenancy: one instance per client (PLT-002) vs shared multi-store; event sourcing proposed as append-only audit store (SEC-004). | Open — architecture |
| WF-ENG | Workflow engine build vs embeddable product; decide before specifying any feature depending on ADM-002. | Open — architecture |
| E-INV | Statutory e-invoicing (KRA eTIMS, MRA EIS) not in client sources; added as PAY-025–027. | Open — confirm with both clients |
| DP-01 | Hosting region and cross-border transfer under Kenya DPA 2019 / Malawi DPA 2024; ODPC registration and DPIA are services. | Open — both clients |
| T-MISS | MPC Tables 8, 10, 13 and Complaints & ADR policy not provided; FIN-005, RET-003, EGV-*, CRM-004 content pending. | Open — request from MPC |
| M-19 | Native mobile apps (CHN-001) an MPC deliverable or not. | Open — MPC |
| G-ORG | KTDA organisational structure (factories, regions) not described. | Open — KTDA |
| V-01 | Platform-knowledge claims to verify in 4.90 (release-4.90.8) source: ECB currency coverage, MFA role enforcement, tier-price keys, vendor discounts, order-ID… | Version part superseded by VER-500 (2026-11-24); third-party plugin 5.00 builds remain OPEN — vendors to confirm (VENDOR-500) |
| ORG-SVC | ODPC registration, pen-test programme, certifications, translation work, content production, training, hosting are services, outside product features. | Recorded |
| K-08 | KTDA requires payment gateways operated by a CBK-regulated bank (PAY-001) and also asks for PayPal (PAY-003) and global payment processing (PAY-007); whether… | Open — KTDA |
| PH-INF | 13 P1 features are placed in P1 by inference | Open — Product Owner / KTDA / Malawi Post |
| LIC-01 | Inference (not stated in any source): collecting and splitting funds for sellers (MPC FR-133, FR-042, FR-145), escrow (KTDA PAY-008) and stored-value wallets… | Open — legal |
| PAY-DIRECT | Direct-to-seller payment model (PRD-PAY-035/036, SEL-025): interaction with Malawi Post FR-133 (split payments) and FR-042/FR-145 (settlements), KTDA PAY-008… | Open — Product Owner / legal |
| PO-REC-v8 | Features with no client source (PO recommendation) awaiting Product Owner acceptance: SVC-003, SVC-004, SVC-007, SVC-010, SVC-012, PAY-035, PAY-036, SEL-025 … | Open — Product Owner |
| PAID-STUB | Paid-plugin stubs in 5.00.1 (Search.Lucene, WebApi.Frontend, PowerBI, Dynamics365, NopMobileApp, OmnibusDirective; still stubs, verified 2026-11-24): license… | Open — tech lead / Product Owner |
| CFG-01 | Inference — product design, Product Owner to confirm | Open — Product Owner |
| UOM-01 | Whether fractional quantities (for example 2.5 kg) must be sold | Open — KTDA / Product Owner |
| API-01 | Which nopCommerce Web API product is the base for PRD-CAT-011 and PRD-INT-001 | Open — tech lead |
| LIC-PI | Whether licensed plugins are priced per installation | Open — commercial |
| WAL-01 | Wallet spend model for PRD-PAY-009: (a) wallet as a payment method, full-order payment only; or (b) partial spend applied as an order-total deduction through… | Open — Malawi Post / Product Owner |
| INV-HOLD | Role of PRD-INV-004 after NOP-1017 (stock is taken natively at order placement) | Proposed — Product Owner to confirm |
| OVR-REG | Proposed owner of each overridden nopCommerce service (one plugin per interface; other modules plug in as providers) | Proposed — tech lead / Product Owner |
| API-GW | Which API gateway product to use (PRD-INT-002), its hosting and licence, and who runs the OAuth 2.0 / OpenID Connect authorization server for partners (PRD-I… | Open — tech lead |
| DOC-LIB | Which document rendering library (HTML to PDF, DOCX, images) and QR library to use for DOC-001 and PAY-025 | Open — tech lead |
| C-SELLER | Conflict: gap MG-02 says the Malawi Post seller model is not stated, while MPC FR-026 to FR-050 (fit-gap report copy, M-01) describe seller onboarding in detail | Open — Malawi Post |
| ANL-002-OWN | KTDA ANL-002 fast and slow movers and stock levels: both RPT-001 (native Bestsellers and Low-stock reports) and INV-013 deliver parts | Proposed — Product Owner |
| SINGLE-FILTER | Proposed: one owner per intercepted native action | Proposed — tech lead |
| ONE-RECORD | Proposed: IAM (IC-IAM-05) owns terms acceptance and consent records; MKT-008 owns policy versions and the re-acceptance flag; IC-IAM-02 identity results (Ver… | Proposed — Product Owner |
| MSG-ROUTE | Proposed: TRK-005 sends all notifications | Proposed — Product Owner; client choice |
| FIELD-APP | Proposed: one field app; TRK-003 owns scanning, CHN-010 owns agent functions. | Proposed — Product Owner |
| CALLOFF-PLACE | Placement path for contract call-off orders created by a scheduled task (ORD-022) without touching the buyer's live cart | Open — tech lead |
| SPLIT-PAY | Proposed: in P1 a multi-seller cart is limited to one seller per order until group payment (BR-PAY-014, Proposed) exists; CHK-004 then splits through IC-CHK-11 | Proposed — Product Owner / tech lead |
| RURAL-SRC | Source of the rural / urban location type: LOG-004 coverage area (BR-LOG-021, Proposed) or MKT-011 customer attribute (AC-MKT-011-01-02) | Open — Product Owner / Malawi Post |
| ORDER-MAIL | Default for the native order-completed email on e-Government and service-only orders (per-client choice, BR-TRK-024; default not stated) | Open — Product Owner / client |
| CUTOFF | Per-origin cut-off times and per-outlet pickup deadlines; values not stated in source | Open — Malawi Post |
| SIGN-SVC | One signing service for ORD-017 and DOC-003 (tech lead); provider-sent signing requests as a MSG-ROUTE exception (Product Owner) | Open — tech lead / Product Owner |
| OTP-OPTOUT | Whether one-time security codes are sent to numbers that opted out (whether the 'Security codes' category is mandatory) | Open — Product Owner |
| GA-EVENTS | Google Analytics server-side events and consent (BR-SEC-021 against MKT-010 Events.cs) | Open — Product Owner |
| GC-CONC | Gift-card concurrency: accept the native per-customer lock, or add an IC-CHK-06 participant | Open — Product Owner / tech lead |
| AGENT-XOUTLET | Whether agents may serve customers registered at another outlet | Open — Product Owner / Malawi Post |
| OPTOUT-SCOPE | Whether TRK-006 opt-outs also suppress campaigns and Omnisend reminders | Open — Product Owner |
| PAYEX-ADM | Whether payment exceptions are also raised into the ADM-009 exception queue | Open — Product Owner |
| HOLD-BILL | How the parcel holding charge is billed and paid (order adjustment or separate outlet receipt, PAY-034) | Open — Malawi Post |
| ORD-UNAVAIL | Treatment of an order line whose whole quantity is unavailable, and the related cart warnings | Open — tech lead |
| FEE-CTRL | Whether fee schedules and payment routing rules are PLT-004 controlled configuration | Open — Product Owner |
| CART-FAILCLOSE | Fail-closed behaviour when a cart-check provider (IC-CHK-01) returns an error | Open — Product Owner |
| PACK-FMT | Configuration-pack file format, and the installer approach (posting the install form or restoring a baseline database) | Open — tech lead |
| DEP-BAL | Deposit and balance as separate linked orders | Open — Product Owner |
| ORD-INTERV | Approval of order interventions in P1 (catalog FC-M03-024 is Should/P2) | Open — Product Owner |
| K-SELLER | KTDA seller model: KTDA only, or factories and subsidiaries as sellers (gap KG-01) | Open — KTDA |
| KG-03 | KTDA ERP(s) not named (REQ-KTDA-INT-001) | Open — KTDA |
| KG-04 | KTDA bank not named (REQ-KTDA-PAY-001, INT-002) | Open — KTDA |
| MG-03 | Malawi Post card gateway and mobile-money APIs not named (REQ-MPC-FR-129) | Open — Malawi Post |
| KTDA-ADP | Whether the KTDA ERP adapter and the KTDA bank-systems adapter become separate client-extension features (Pack 'Client: KTDA'), as INT-006, INT-007 and INT-0… | Open — Product Owner |
| COMP-R5 | Round 5 compliance reclassification (BA-F-002, BA-F-003, PO-F-010): requirements marked 'Compliant' whose L3 coverage is Partial on every row, or whose crite… | Proposed — Product Owner to ratify |
| SINGLE-NODE | Proposed: P1 serves checkout from one web node until PLT-027 idempotency keys (P2) are delivered; the go-live checklist fails with more than one checkout nod… | Proposed — Product Owner / tech lead |
| MG-09 | Malawi Post interface content not stated: MANEPS purpose and data (REQ-MPC-INT-001) and the SAGE 200 summary and posting rules (REQ-MPC-FR-138, FR-328) | Open — Malawi Post |
| VER-500 | Target platform is nopCommerce 5.00.1 on .NET 10 (source tag release-5.00.1) | Approved — user 2026-11-24 |
| CART-500 | Keep the product single cart that splits order and payment across sellers (CHK-004, SPLIT-PAY) | Approved — user 2026-11-24 |
| PRICE-500 | Customer and company pricing (CAT-039, CAT-042) use the native 5.00 price lists | Approved — user 2026-11-24 |
| KG-01 | Gap: Seller model — not stated in the client source | Open — client |
| KG-02 | Gap: Volumes — not stated in the client source | Open — client |
| KG-05 | Gap: Mobile money — not stated in the client source | Open — client |
| KG-06 | Gap: Tax & invoicing — not stated in the client source | Open — client |
| KG-07 | Gap: Escrow & LC — not stated in the client source | Open — client |
| KG-08 | Gap: Pricing — not stated in the client source | Open — client |
| KG-09 | Gap: Requisition workflows — not stated in the client source | Open — client |
| KG-10 | Gap: Offer management — not stated in the client source | Open — client |
| KG-11 | Gap: Loyalty — not stated in the client source | Open — client |
| KG-12 | Gap: Returns policy — not stated in the client source | Open — client |
| KG-13 | Gap: Delivery — not stated in the client source | Open — client |
| KG-14 | Gap: Languages — not stated in the client source | Open — client |
| KG-15 | Gap: Currencies — not stated in the client source | Open — client |
| KG-16 | Gap: Roles — not stated in the client source | Open — client |
| KG-17 | Gap: AI / analytics — not stated in the client source | Open — client |
| KG-18 | Gap: NFRs — not stated in the client source | Open — client |
| KG-19 | Gap: Support SLA — not stated in the client source | Open — client |
| KG-23 | Gap: Export compliance — not stated in the client source | Open — client |
| KG-24 | Gap: Chat — not stated in the client source | Open — client |
| MG-02 | Gap: Business model — not stated in the client source | Open — client |
| MG-04 | Gap: Localisation — not stated in the client source | Open — client |
| MG-05 | Gap: Tax & invoicing — not stated in the client source | Open — client |
| MG-06 | Gap: Delivery & tracking — not stated in the client source | Open — client |
| MG-07 | Gap: Counter operations — not stated in the client source | Open — client |
| MG-08 | Gap: Users & roles — not stated in the client source | Open — client |
| MG-10 | Gap: USSD — not stated in the client source | Open — client |
| MG-11 | Gap: AI/ML — not stated in the client source | Open — client |
| MG-12 | Gap: Data warehouse — not stated in the client source | Open — client |
| MG-13 | Gap: NFRs — not stated in the client source | Open — client |
| MG-14 | Gap: Hosting after 6 months — not stated in the client source | Open — client |
