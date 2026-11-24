# Trace report

Generated 2026-11-24T13:16:13.048Z by `scripts/build-trace.mjs`. Source of every ID: `/docs`.

## 1. Reconciliation

Every one of the 434 product features is in exactly one state. Nothing is reported
done because it looks finished: a feature counts as built only when an acceptance criterion of
its own has a passing test named by that AC ID (prototype decision P-6).

| State | Features | Meaning |
|---|---|---|
| Built and passing | 15 | At least one AC has a passing test named by the AC ID |
| Held, prototype default | 99 | Held by an open decision; built as the PRD's Proposed option and labelled (P-1) |
| Mocked externally | 30 | External-system feature standing behind a mock adapter (P-3) |
| Not built | 290 | Scaffolded in Session 0, built in its own session |
| **Total** | **434** | reconciles: yes |

Acceptance criteria in the product: 2850. Criteria with a test in this repository:
30 (30 passing, 0 failing).

## 2. Coverage by area and wave

| Wave | Area | Name | Features | Built | Held | Mocked | Not built |
|---|---|---|---|---|---|---|---|
| 1 Foundation | ADM | Administration, workflow and operations console | 12 | 0 | 2 | 0 | 10 |
| 1 Foundation | IAM | Identity, access and accounts | 27 | 0 | 3 | 1 | 23 |
| 1 Foundation | PLT | Platform foundation and multi-client configuration | 27 | 2 | 3 | 4 | 18 |
| 1 Foundation | SEC | Security, audit and compliance | 15 | 1 | 2 | 5 | 7 |
| 2 Catalogue | CAT | Catalogue and listings | 43 | 0 | 9 | 0 | 34 |
| 2 Catalogue | INV | Inventory and warehouses | 13 | 0 | 1 | 0 | 12 |
| 2 Catalogue | SEL | Sellers and marketplace onboarding | 25 | 0 | 4 | 1 | 20 |
| 2 Catalogue | SRC | Search, discovery and merchandising | 27 | 0 | 4 | 1 | 22 |
| 3 Buy | CHK | Cart and checkout | 19 | 6 | 4 | 0 | 9 |
| 3 Buy | ORD | Orders and B2B transactions (RFQ, contracts, requisitions, offers, group buying) | 28 | 2 | 11 | 0 | 15 |
| 3 Buy | PAY | Payments, tax, settlement and reconciliation | 36 | 1 | 14 | 0 | 21 |
| 4 Fulfil | DOC | Documents and records | 6 | 0 | 2 | 1 | 3 |
| 4 Fulfil | LOG | Shipping, logistics and fulfilment | 32 | 1 | 6 | 2 | 23 |
| 4 Fulfil | RET | Returns, refunds and disputes | 11 | 0 | 4 | 0 | 7 |
| 4 Fulfil | TRK | Tracking and notifications | 12 | 2 | 1 | 0 | 9 |
| 5 Engage and run | CRM | Customer service, help desk and chat | 15 | 0 | 1 | 0 | 14 |
| 5 Engage and run | MKT | Marketing, promotions, loyalty, content and SEO | 14 | 0 | 1 | 0 | 13 |
| 5 Engage and run | RPT | Reporting and analytics | 12 | 0 | 5 | 4 | 3 |
| 6 Reach | AI | AI capabilities | 10 | 0 | 0 | 5 | 5 |
| 6 Reach | CHN | Channels: mobile app, PWA, USSD, SMS, WhatsApp, assisted/agent | 13 | 0 | 2 | 2 | 9 |
| 6 Reach | INT | Integrations and APIs | 13 | 0 | 4 | 1 | 8 |
| 7 Verticals | EGV | e-Government and service catalogue (optional pack) | 7 | 0 | 7 | 0 | 0 |
| 7 Verticals | FIN | Financial products | 5 | 0 | 1 | 3 | 1 |
| 7 Verticals | SVC | Services commerce (booking, delivery and completion of services; SVC-007 covers electronically delivered goods) | 12 | 0 | 8 | 0 | 4 |

## 3. Client requirement coverage

| Client | Requirements | Mapped to a feature | Demonstrated in the prototype | Project service |
|---|---|---|---|---|
| KTDA | 95 | 80 | 7 | 17 |
| Malawi Post | 411 | 374 | 30 | 38 |

"Demonstrated in the prototype" means at least one feature that delivers the requirement has a
passing AC-named test here. It is not a compliance statement: the compliance status of each
requirement is in `docs/compliance/Compliance-Traceability.md`.

## 4. Tests, by acceptance criterion

| AC ID | Feature | Suite | Result |
|---|---|---|---|
| AC-CHK-001-01-01 | PRD-CHK-001 | node (API and rules) | pass |
| AC-CHK-001-01-02 | PRD-CHK-001 | node (API and rules) | pass |
| AC-CHK-001-03-01 | PRD-CHK-001 | node (API and rules) | pass |
| AC-CHK-001-03-02 | PRD-CHK-001 | node (API and rules) | pass |
| AC-CHK-002-02-01 | PRD-CHK-002 | node (API and rules) | pass |
| AC-CHK-002-02-02 | PRD-CHK-002 | node (API and rules) | pass |
| AC-CHK-002-03-01 | PRD-CHK-002 | node (API and rules) | pass |
| AC-CHK-002-04-02 | PRD-CHK-002 | node (API and rules) | pass |
| AC-CHK-002-05-01 | PRD-CHK-002 | node (API and rules) | pass |
| AC-CHK-004-01-01 | PRD-CHK-004 | node (API and rules) | pass |
| AC-CHK-004-01-02 | PRD-CHK-004 | node (API and rules) | pass |
| AC-CHK-004-01-03 | PRD-CHK-004 | node (API and rules) | pass |
| AC-CHK-004-01-07 | PRD-CHK-004 | node (API and rules) | pass |
| AC-CHK-005-01-03 | PRD-CHK-005 | node (API and rules) | pass |
| AC-CHK-005-01-05 | PRD-CHK-005 | node (API and rules) | pass |
| AC-CHK-012-01-02 | PRD-CHK-012 | node (API and rules) | pass |
| AC-CHK-012-02-03 | PRD-CHK-012 | node (API and rules) | pass |
| AC-CHK-019-01-03 | PRD-CHK-019 | node (API and rules) | pass |
| AC-LOG-012-03-01 | PRD-LOG-012 | node (API and rules) | pass |
| AC-ORD-002-02-01 | PRD-ORD-002 | node (API and rules) | pass |
| AC-ORD-007-01-02 | PRD-ORD-007 | node (API and rules) | pass |
| AC-PAY-004-01-01 | PRD-PAY-004 | node (API and rules) | pass |
| AC-PAY-004-01-02 | PRD-PAY-004 | node (API and rules) | pass |
| AC-PLT-003-01-01 | PRD-PLT-003 | node (API and rules) | pass |
| AC-PLT-003-01-02 | PRD-PLT-003 | node (API and rules) | pass |
| AC-PLT-022-01-02 | PRD-PLT-022 | node (API and rules) | pass |
| AC-SEC-004-03-01 | PRD-SEC-004 | node (API and rules) | pass |
| AC-TRK-001-01-01 | PRD-TRK-001 | node (API and rules) | pass |
| AC-TRK-001-01-02 | PRD-TRK-001 | node (API and rules) | pass |
| AC-TRK-011-01-02 | PRD-TRK-011 | node (API and rules) | pass |

## 5. Features held by an open decision (99)

Each is built as the PRD's Proposed option and labelled "Prototype default - decision <ID> pending"
in the user interface and here.

| Decision | Features held | Type | Owner |
|---|---|---|---|
| FG-06 | 22 | a — scope | Malawi Post |
| PH-INF | 18 | a — scope | Product Owner / KTDA / Malawi Post |
| M-19 | 1 | a — scope | Malawi Post |
| K-01 | 1 | a — scope | User / KTDA |
| WF-ENG | 22 | b — build approach | Architecture |
| PO-REC-v8 | 11 | a — scope | Product Owner |
| PAY-DIRECT / LIC-01 | 8 | a — scope | Product Owner / legal |
| E-INV | 4 | a — scope | KTDA / Malawi Post |
| K-08 | 1 | c — counterpart | KTDA |
| C-FX | 1 | c — counterpart | KTDA |
| T-MISS | 10 | d — client content | Malawi Post (content) |
| F-CAT-B | 1 | b — build approach | Architecture |
| API-01 | 2 | b — build approach | Tech lead |
| UOM-01 | 1 | b — build approach | KTDA / Product Owner |
| WAL-01 | 1 | b — build approach | Malawi Post / Product Owner |
| PAID-STUB | 18 | b — build approach | Tech lead / Product Owner |
| DP-01 | 2 | c — counterpart | KTDA / Malawi Post |
| C-SIZE | 1 | c — counterpart | Malawi Post |
| CALLOFF-PLACE | 1 | b — build approach | Tech lead |
| API-GW | 3 | b — build approach | Tech lead |
| DOC-LIB | 12 | b — build approach | Tech lead |
| KG-04 | 1 | c — counterpart | KTDA |
| MG-03 | 1 | c — counterpart | Malawi Post |
| MG-09 | 1 | c — counterpart | Malawi Post |

## 6. Every feature

| Feature | Name | Area | Phase | Wave | State | ACs | Tested | Decision |
|---|---|---|---|---|---|---|---|---|
| PRD-PLT-001 | Client instance provisioning | PLT | P1 | 1 | mocked | 10 | 0 | - |
| PRD-PLT-002 | Client data isolation | PLT | P1 | 1 | held-default | 5 | 0 | F-CAT-B |
| PRD-PLT-003 | Configuration packs | PLT | P1 | 1 | built | 19 | 2 | - |
| PRD-PLT-004 | Settings change control | PLT | P1 | 1 | held-default | 17 | 0 | WF-ENG |
| PRD-PLT-005 | Configuration export, import and promotion | PLT | P1 | 1 | not-built | 7 | 0 | - |
| PRD-PLT-006 | Branding and theme | PLT | P1 | 1 | not-built | 4 | 0 | - |
| PRD-PLT-007 | Custom domain and SSL | PLT | P1 | 1 | not-built | 3 | 0 | - |
| PRD-PLT-008 | Email sender identity | PLT | P1 | 1 | not-built | 3 | 0 | - |
| PRD-PLT-009 | Languages and language packs | PLT | P1 | 1 | not-built | 5 | 0 | - |
| PRD-PLT-010 | Currencies and exchange rates | PLT | P1 | 1 | not-built | 4 | 0 | - |
| PRD-PLT-011 | Time zone and formats | PLT | P1 | 1 | not-built | 2 | 0 | - |
| PRD-PLT-012 | Fiscal calendar for reporting | PLT | P2 | 1 | not-built | 2 | 0 | - |
| PRD-PLT-013 | Multi-store (B2B and B2C storefronts) | PLT | P1 | 1 | not-built | 5 | 0 | - |
| PRD-PLT-014 | Instance health and SLA monitoring | PLT | P1 | 1 | mocked | 5 | 0 | - |
| PRD-PLT-015 | Scalable, open architecture | PLT | P1 | 1 | not-built | 6 | 0 | - |
| PRD-PLT-016 | Backup and disaster recovery | PLT | P1 | 1 | mocked | 4 | 0 | - |
| PRD-PLT-017 | Responsive storefront | PLT | P1 | 1 | not-built | 3 | 0 | - |
| PRD-PLT-018 | Accessibility | PLT | P1 | 1 | not-built | 3 | 0 | - |
| PRD-PLT-019 | Contextual help and guided tours | PLT | P1 | 1 | not-built | 4 | 0 | - |
| PRD-PLT-020 | Data retention and archival | PLT | P1 | 1 | not-built | 11 | 0 | - |
| PRD-PLT-021 | Product release and upgrade management | PLT | P1 | 1 | mocked | 7 | 0 | - |
| PRD-PLT-022 | Feature and module registry | PLT | P1 | 1 | built | 6 | 1 | - |
| PRD-PLT-023 | Client data migration toolkit | PLT | P1 | 1 | not-built | 6 | 0 | - |
| PRD-PLT-024 | Exchange-rate provider framework | PLT | P1 | 1 | not-built | 3 | 0 | - |
| PRD-PLT-025 | Translation management | PLT | P1 | 1 | not-built | 7 | 0 | - |
| PRD-PLT-026 | Hosting profile and sizing NFR | PLT | P1 | 1 | held-default | 2 | 0 | C-SIZE |
| PRD-PLT-027 | Data consistency safeguards | PLT | P2 | 1 | not-built | 5 | 0 | - |
| PRD-IAM-001 | Customer registration and login | IAM | P1 | 1 | not-built | 11 | 0 | - |
| PRD-IAM-002 | Mobile-number identity with OTP | IAM | P1 | 1 | not-built | 20 | 0 | - |
| PRD-IAM-003 | Password policy, lockout and recovery | IAM | P1 | 1 | not-built | 10 | 0 | - |
| PRD-IAM-004 | Multi-factor authentication by role | IAM | P1 | 1 | not-built | 10 | 0 | - |
| PRD-IAM-005 | Single sign-on for staff and B2B buyers | IAM | P2 | 1 | not-built | 6 | 0 | - |
| PRD-IAM-006 | Session management | IAM | P1 | 1 | not-built | 7 | 0 | - |
| PRD-IAM-007 | Roles and permissions | IAM | P1 | 1 | not-built | 13 | 0 | - |
| PRD-IAM-008 | Scoped permissions | IAM | P1 | 1 | not-built | 8 | 0 | - |
| PRD-IAM-009 | Permission delegation | IAM | P2 | 1 | not-built | 7 | 0 | - |
| PRD-IAM-010 | User administration console | IAM | P1 | 1 | not-built | 11 | 0 | - |
| PRD-IAM-011 | Staff invitation and access reviews | IAM | P1 | 1 | not-built | 7 | 0 | - |
| PRD-IAM-012 | Authentication audit and suspicious-login detection | IAM | P1 | 1 | not-built | 8 | 0 | - |
| PRD-IAM-013 | Passwordless and biometric login | IAM | P2 | 1 | not-built | 4 | 0 | - |
| PRD-IAM-014 | Customer profile and address book | IAM | P1 | 1 | not-built | 5 | 0 | - |
| PRD-IAM-015 | Pickup preference and preferred channel | IAM | P1 | 1 | not-built | 4 | 0 | - |
| PRD-IAM-016 | Terms acceptance with versioning | IAM | P1 | 1 | not-built | 9 | 0 | - |
| PRD-IAM-017 | Privacy rights | IAM | P1 | 1 | not-built | 13 | 0 | - |
| PRD-IAM-018 | Account activity history | IAM | P1 | 1 | not-built | 4 | 0 | - |
| PRD-IAM-019 | Account synchronisation with core systems | IAM | P1 | 1 | not-built | 4 | 0 | - |
| PRD-IAM-020 | Identity verification adapter framework | IAM | P1 | 1 | mocked | 6 | 0 | - |
| PRD-IAM-021 | Customer transaction history | IAM | P1 | 1 | not-built | 6 | 0 | - |
| PRD-IAM-022 | B2B company accounts | IAM | P1 | 1 | held-default | 7 | 0 | PH-INF |
| PRD-IAM-023 | B2B buyer registration and approval | IAM | P1 | 1 | held-default | 5 | 0 | PH-INF |
| PRD-IAM-024 | Tax-exempt and VAT-registered buyers | IAM | P1 | 1 | not-built | 4 | 0 | - |
| PRD-IAM-025 | Customer home dashboard | IAM | P2 | 1 | not-built | 3 | 0 | - |
| PRD-IAM-026 | Assisted service by agents | IAM | P1 | 1 | not-built | 10 | 0 | - |
| PRD-IAM-027 | Company cost centres and budgets | IAM | P2 | 1 | held-default | 3 | 0 | PH-INF |
| PRD-SEL-001 | Seller application and profile | SEL | P1 | 2 | not-built | 6 | 0 | - |
| PRD-SEL-002 | Seller KYC documents | SEL | P1 | 2 | not-built | 10 | 0 | - |
| PRD-SEL-003 | Seller verification workflow and tiers | SEL | P1 | 2 | held-default | 15 | 0 | WF-ENG |
| PRD-SEL-004 | Identity and registry verification adapters | SEL | P1 | 2 | mocked | 6 | 0 | - |
| PRD-SEL-005 | Payout accounts and verification | SEL | P1 | 2 | held-default | 8 | 0 | WF-ENG |
| PRD-SEL-006 | Seller terms acceptance | SEL | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SEL-007 | Marketplace rules and listing eligibility | SEL | P1 | 2 | not-built | 7 | 0 | - |
| PRD-SEL-008 | Seller dashboard and onboarding checklist | SEL | P1 | 2 | not-built | 3 | 0 | - |
| PRD-SEL-009 | Seller staff accounts | SEL | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SEL-010 | Seller categorisation | SEL | P2 | 2 | not-built | 2 | 0 | - |
| PRD-SEL-011 | Seller performance monitoring | SEL | P1 | 2 | not-built | 6 | 0 | - |
| PRD-SEL-012 | Seller ratings | SEL | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SEL-013 | Block and watch lists | SEL | P1 | 2 | not-built | 9 | 0 | - |
| PRD-SEL-014 | Approved supplier panels | SEL | P2 | 2 | not-built | 4 | 0 | - |
| PRD-SEL-015 | Bulk participant import and invitation | SEL | P2 | 2 | not-built | 5 | 0 | - |
| PRD-SEL-016 | Commission and fee rules | SEL | P1 | 2 | not-built | 6 | 0 | - |
| PRD-SEL-017 | Seller settlements and payouts | SEL | P1 | 2 | held-default | 15 | 0 | WF-ENG, PAY-DIRECT / LIC-01 / WF-ENG / PAY-DIRECT / LIC-01 |
| PRD-SEL-018 | Seller locations and fulfilment opt-in | SEL | P1 | 2 | not-built | 4 | 0 | - |
| PRD-SEL-019 | Seller vacation mode | SEL | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SEL-020 | Seller notifications | SEL | P1 | 2 | not-built | 4 | 0 | - |
| PRD-SEL-021 | Seller onboarding funnel report | SEL | P1 | 2 | not-built | 2 | 0 | - |
| PRD-SEL-022 | Seller diversity tracking | SEL | P3 | 2 | not-built | 2 | 0 | - |
| PRD-SEL-023 | Seller training content | SEL | P1 | 2 | not-built | 3 | 0 | - |
| PRD-SEL-024 | Seller blacklisting | SEL | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SEL-025 | Commission invoicing to sellers | SEL | P2 | 2 | held-default | 6 | 0 | PH-INF, PO-REC-v8, PAY-DIRECT / LIC-01, E-INV, PAID-STUB, DOC-LIB / PH-INF / PO-REC-v8 / PAY-DIRECT / LIC-01 / E-INV / PAID-STUB / DOC-LIB |
| PRD-CAT-001 | Category taxonomy | CAT | P1 | 2 | not-built | 8 | 0 | - |
| PRD-CAT-002 | Product master record | CAT | P1 | 2 | not-built | 14 | 0 | - |
| PRD-CAT-003 | Identifier patterns | CAT | P1 | 2 | not-built | 5 | 0 | - |
| PRD-CAT-004 | Product and specification attributes | CAT | P1 | 2 | not-built | 4 | 0 | - |
| PRD-CAT-005 | Category attribute schema and listing quality rules | CAT | P1 | 2 | not-built | 8 | 0 | - |
| PRD-CAT-006 | Variants and attribute combinations | CAT | P1 | 2 | not-built | 4 | 0 | - |
| PRD-CAT-007 | Bundles and kits | CAT | P1 | 2 | not-built | 5 | 0 | - |
| PRD-CAT-008 | Product cloning and listing templates | CAT | P2 | 2 | not-built | 4 | 0 | - |
| PRD-CAT-009 | Bulk import/export and PDF catalogue | CAT | P1 | 2 | not-built | 8 | 0 | - |
| PRD-CAT-010 | Import validation report | CAT | P1 | 2 | not-built | 4 | 0 | - |
| PRD-CAT-011 | Catalogue API | CAT | P1 | 2 | held-default | 5 | 0 | API-01, PAID-STUB, API-GW / API-01 / PAID-STUB / API-GW |
| PRD-CAT-012 | Price tiers by customer group and quantity | CAT | P1 | 2 | not-built | 5 | 0 | - |
| PRD-CAT-013 | Call-for-price / negotiable flag | CAT | P1 | 2 | not-built | 6 | 0 | - |
| PRD-CAT-014 | Product tax category | CAT | P1 | 2 | not-built | 3 | 0 | - |
| PRD-CAT-015 | Cross-border trade fields | CAT | P1 | 2 | not-built | 5 | 0 | - |
| PRD-CAT-016 | Product media | CAT | P1 | 2 | not-built | 8 | 0 | - |
| PRD-CAT-017 | Localised product content | CAT | P1 | 2 | not-built | 4 | 0 | - |
| PRD-CAT-018 | Product questions and answers | CAT | P2 | 2 | not-built | 5 | 0 | - |
| PRD-CAT-019 | Regulatory metadata and certificates | CAT | P2 | 2 | not-built | 5 | 0 | - |
| PRD-CAT-020 | Origin and provenance content | CAT | P1 | 2 | not-built | 4 | 0 | - |
| PRD-CAT-021 | Listing policy enforcement | CAT | P1 | 2 | not-built | 9 | 0 | - |
| PRD-CAT-022 | Listing lifecycle and operator approval | CAT | P1 | 2 | held-default | 20 | 0 | WF-ENG |
| PRD-CAT-023 | Listing version history and autosave | CAT | P1 | 2 | not-built | 6 | 0 | - |
| PRD-CAT-024 | Listing availability and withdrawal | CAT | P1 | 2 | not-built | 6 | 0 | - |
| PRD-CAT-025 | Stale listing detection | CAT | P2 | 2 | not-built | 3 | 0 | - |
| PRD-CAT-026 | Service listings | CAT | P1 | 2 | not-built | 6 | 0 | - |
| PRD-CAT-027 | Service booking | CAT | P1 | 2 | held-default | 15 | 0 | FG-06 |
| PRD-CAT-028 | Listing geo-location | CAT | P2 | 2 | not-built | 3 | 0 | - |
| PRD-CAT-029 | Product reviews and ratings | CAT | P1 | 2 | not-built | 7 | 0 | - |
| PRD-CAT-030 | Product returnability flag | CAT | P1 | 2 | not-built | 3 | 0 | - |
| PRD-CAT-031 | Product page delivery promise | CAT | P1 | 2 | not-built | 7 | 0 | - |
| PRD-CAT-032 | Catalogue audit log | CAT | P2 | 2 | not-built | 3 | 0 | - |
| PRD-CAT-033 | Promoted listings with fees | CAT | P1 | 2 | not-built | 5 | 0 | - |
| PRD-CAT-034 | Catalogue analytics | CAT | P1 | 2 | held-default | 7 | 0 | PAID-STUB |
| PRD-CAT-035 | Listing syndication and product feeds | CAT | P2 | 2 | not-built | 3 | 0 | - |
| PRD-CAT-036 | Catalogue segmentation by buyer channel | CAT | P1 | 2 | not-built | 3 | 0 | - |
| PRD-CAT-037 | Order quantity rules | CAT | P2 | 2 | not-built | 4 | 0 | - |
| PRD-CAT-038 | Guided seller listing wizard | CAT | P1 | 2 | not-built | 4 | 0 | - |
| PRD-CAT-039 | Customer and company price lists | CAT | P1 | 2 | held-default | 13 | 0 | PH-INF |
| PRD-CAT-040 | Company-specific assortment | CAT | P2 | 2 | held-default | 4 | 0 | PH-INF |
| PRD-CAT-041 | Units of measure and pack selling | CAT | P1 | 2 | held-default | 3 | 0 | PH-INF, UOM-01 / PH-INF / UOM-01 |
| PRD-CAT-042 | Fixed prices per currency | CAT | P1 | 2 | held-default | 15 | 0 | PH-INF |
| PRD-CAT-043 | Seller listing moderation | CAT | P1 | 2 | held-default | 5 | 0 | WF-ENG |
| PRD-INV-001 | Stock tracking | INV | P1 | 2 | not-built | 10 | 0 | - |
| PRD-INV-002 | Multi-warehouse stock | INV | P1 | 2 | not-built | 8 | 0 | - |
| PRD-INV-003 | Low-stock thresholds and alerts | INV | P1 | 2 | not-built | 6 | 0 | - |
| PRD-INV-004 | Stock reservation and hold | INV | P1 | 2 | not-built | 20 | 0 | - |
| PRD-INV-005 | Stock adjustments with reason codes | INV | P1 | 2 | not-built | 13 | 0 | - |
| PRD-INV-006 | Goods receiving | INV | P1 | 2 | not-built | 8 | 0 | - |
| PRD-INV-007 | Warehouse transfers | INV | P2 | 2 | not-built | 7 | 0 | - |
| PRD-INV-008 | Cycle counts | INV | P2 | 2 | not-built | 6 | 0 | - |
| PRD-INV-009 | Batch and lot tracking | INV | P2 | 2 | not-built | 9 | 0 | - |
| PRD-INV-010 | Serial number tracking | INV | P2 | 2 | not-built | 6 | 0 | - |
| PRD-INV-011 | Expiry management | INV | P2 | 2 | not-built | 4 | 0 | - |
| PRD-INV-012 | WMS/ERP stock synchronisation | INV | P1 | 2 | held-default | 7 | 0 | PAID-STUB |
| PRD-INV-013 | Inventory analytics | INV | P1 | 2 | not-built | 6 | 0 | - |
| PRD-SRC-001 | Keyword search | SRC | P1 | 2 | not-built | 16 | 0 | - |
| PRD-SRC-002 | Search-as-you-type | SRC | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SRC-003 | Faceted filters | SRC | P1 | 2 | not-built | 8 | 0 | - |
| PRD-SRC-004 | Location and delivery-option discovery | SRC | P1 | 2 | not-built | 6 | 0 | - |
| PRD-SRC-005 | Sorting options | SRC | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SRC-006 | Category browse | SRC | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SRC-007 | Merchandising widgets and landing pages | SRC | P1 | 2 | not-built | 6 | 0 | - |
| PRD-SRC-008 | Rules-based recommendations | SRC | P1 | 2 | not-built | 6 | 0 | - |
| PRD-SRC-009 | Personalised recommendations and ranking | SRC | P1 | 2 | mocked | 6 | 0 | - |
| PRD-SRC-010 | Wishlist | SRC | P1 | 2 | not-built | 4 | 0 | - |
| PRD-SRC-011 | Saved searches and watch alerts | SRC | P2 | 2 | not-built | 5 | 0 | - |
| PRD-SRC-012 | Search history | SRC | P2 | 2 | not-built | 6 | 0 | - |
| PRD-SRC-013 | Product comparison | SRC | P1 | 2 | not-built | 2 | 0 | - |
| PRD-SRC-014 | Search engine: relevance, synonyms, multilingual | SRC | P1 | 2 | held-default | 12 | 0 | PAID-STUB |
| PRD-SRC-015 | Trending and bestsellers | SRC | P2 | 2 | not-built | 4 | 0 | - |
| PRD-SRC-016 | Taxonomy governance | SRC | P1 | 2 | held-default | 6 | 0 | WF-ENG |
| PRD-SRC-017 | Seller badges and featured sellers | SRC | P1 | 2 | not-built | 4 | 0 | - |
| PRD-SRC-018 | Delivery promise on listing cards | SRC | P1 | 2 | not-built | 5 | 0 | - |
| PRD-SRC-019 | Search result eligibility | SRC | P1 | 2 | not-built | 7 | 0 | - |
| PRD-SRC-020 | Services browsing area | SRC | P1 | 2 | held-default | 3 | 0 | FG-06 |
| PRD-SRC-021 | Web analytics | SRC | P1 | 2 | not-built | 4 | 0 | - |
| PRD-SRC-022 | Accessible search and navigation | SRC | P1 | 2 | not-built | 4 | 0 | - |
| PRD-SRC-023 | Low-connectivity resilience | SRC | P1 | 2 | not-built | 4 | 0 | - |
| PRD-SRC-024 | Search API for channels | SRC | P1 | 2 | held-default | 4 | 0 | PAID-STUB |
| PRD-SRC-025 | Unified search | SRC | P2 | 2 | not-built | 3 | 0 | - |
| PRD-SRC-026 | Search performance and freshness | SRC | P2 | 2 | not-built | 4 | 0 | - |
| PRD-SRC-027 | Storefront conveniences | SRC | P2 | 2 | not-built | 5 | 0 | - |
| PRD-CHK-001 | Shopping cart | CHK | P1 | 3 | built | 6 | 4 | - |
| PRD-CHK-002 | Checkout | CHK | P1 | 3 | built | 10 | 5 | - |
| PRD-CHK-003 | Checkout validation | CHK | P1 | 3 | not-built | 16 | 0 | - |
| PRD-CHK-004 | Multi-seller split checkout | CHK | P1 | 3 | built | 12 | 4 | WF-ENG, PAY-DIRECT / LIC-01 / WF-ENG / PAY-DIRECT / LIC-01 |
| PRD-CHK-005 | Fulfilment method per line | CHK | P1 | 3 | built | 6 | 2 | - |
| PRD-CHK-006 | Delivery slot and instructions | CHK | P1 | 3 | not-built | 10 | 0 | - |
| PRD-CHK-007 | Structured address capture | CHK | P1 | 3 | not-built | 6 | 0 | - |
| PRD-CHK-008 | Checkout resilience and idempotency | CHK | P1 | 3 | not-built | 9 | 0 | - |
| PRD-CHK-009 | E-transactions consumer controls | CHK | P1 | 3 | not-built | 6 | 0 | - |
| PRD-CHK-010 | Minimum order and fee thresholds | CHK | P1 | 3 | not-built | 3 | 0 | - |
| PRD-CHK-011 | Cart restriction rules | CHK | P1 | 3 | not-built | 6 | 0 | - |
| PRD-CHK-012 | Pickup code / QR | CHK | P1 | 3 | built | 7 | 2 | - |
| PRD-CHK-013 | Assisted checkout | CHK | P1 | 3 | not-built | 6 | 0 | - |
| PRD-CHK-014 | Estimated delivery at checkout | CHK | P1 | 3 | not-built | 5 | 0 | - |
| PRD-CHK-015 | Checkout attributes | CHK | P1 | 3 | held-default | 3 | 0 | PH-INF |
| PRD-CHK-016 | B2B on-account payment and credit limits | CHK | P1 | 3 | held-default | 6 | 0 | PH-INF, PAID-STUB / PH-INF / PAID-STUB |
| PRD-CHK-017 | B2B quick order and bulk add | CHK | P1 | 3 | held-default | 3 | 0 | PH-INF |
| PRD-CHK-018 | B2B purchase approval | CHK | P1 | 3 | held-default | 6 | 0 | PH-INF, WF-ENG / PH-INF / WF-ENG |
| PRD-CHK-019 | Order confirmation | CHK | P1 | 3 | built | 4 | 1 | - |
| PRD-PAY-001 | Payment method framework and routing | PAY | P1 | 3 | not-built | 10 | 0 | - |
| PRD-PAY-002 | Card payments (framework) | PAY | P1 | 3 | not-built | 9 | 0 | - |
| PRD-PAY-003 | PayPal | PAY | P1 | 3 | held-default | 2 | 0 | K-08 |
| PRD-PAY-004 | Mobile money (framework) | PAY | P1 | 3 | built | 9 | 2 | - |
| PRD-PAY-005 | Bank transfer | PAY | P1 | 3 | not-built | 7 | 0 | - |
| PRD-PAY-006 | Letters of credit | PAY | P1 | 3 | not-built | 5 | 0 | - |
| PRD-PAY-007 | Escrow and staged release | PAY | P1 | 3 | held-default | 7 | 0 | PAY-DIRECT / LIC-01 |
| PRD-PAY-008 | Cash on delivery and cash at outlet | PAY | P1 | 3 | not-built | 7 | 0 | - |
| PRD-PAY-009 | Wallet and store credit | PAY | P1 | 3 | held-default | 7 | 0 | FG-06, PAY-DIRECT / LIC-01, WAL-01 / FG-06 / PAY-DIRECT / LIC-01 / WAL-01 |
| PRD-PAY-010 | Split payments | PAY | P1 | 3 | held-default | 6 | 0 | PAY-DIRECT / LIC-01 |
| PRD-PAY-011 | Payment status lifecycle | PAY | P1 | 3 | not-built | 15 | 0 | - |
| PRD-PAY-012 | Payment idempotency | PAY | P1 | 3 | not-built | 4 | 0 | - |
| PRD-PAY-013 | Payment receipts | PAY | P1 | 3 | not-built | 4 | 0 | - |
| PRD-PAY-014 | Payment reconciliation | PAY | P1 | 3 | not-built | 5 | 0 | - |
| PRD-PAY-015 | Payment fees | PAY | P1 | 3 | not-built | 6 | 0 | - |
| PRD-PAY-016 | Refunds | PAY | P1 | 3 | not-built | 12 | 0 | - |
| PRD-PAY-017 | Chargebacks | PAY | P1 | 3 | not-built | 4 | 0 | - |
| PRD-PAY-018 | Payment and order risk controls | PAY | P1 | 3 | not-built | 11 | 0 | - |
| PRD-PAY-019 | Payments operations console | PAY | P1 | 3 | not-built | 3 | 0 | - |
| PRD-PAY-020 | Tax calculation | PAY | P1 | 3 | not-built | 2 | 0 | - |
| PRD-PAY-021 | Tax on fees and tax reporting | PAY | P1 | 3 | not-built | 3 | 0 | - |
| PRD-PAY-022 | Bulk disbursements | PAY | P3 | 3 | not-built | 4 | 0 | - |
| PRD-PAY-023 | Multi-currency settlement | PAY | P1 | 3 | held-default | 3 | 0 | C-FX |
| PRD-PAY-024 | Payment connector SDK | PAY | P1 | 3 | not-built | 7 | 0 | - |
| PRD-PAY-025 | Fiscal e-invoicing framework | PAY | P1 | 3 | held-default | 6 | 0 | PH-INF, E-INV, DOC-LIB / PH-INF / E-INV / DOC-LIB |
| PRD-PAY-026 | KRA eTIMS adapter | PAY | P1 | 3 | held-default | 1 | 0 | PH-INF, E-INV, DOC-LIB / PH-INF / E-INV / DOC-LIB |
| PRD-PAY-027 | MRA EIS adapter | PAY | P1 | 3 | held-default | 1 | 0 | PH-INF, E-INV, DOC-LIB / PH-INF / E-INV / DOC-LIB |
| PRD-PAY-028 | M-Pesa (Kenya) adapter | PAY | P1 | 3 | not-built | 2 | 0 | - |
| PRD-PAY-029 | TNM Mpamba adapter | PAY | P1 | 3 | not-built | 1 | 0 | - |
| PRD-PAY-030 | Airtel Money adapter | PAY | P1 | 3 | not-built | 1 | 0 | - |
| PRD-PAY-031 | KTDA bank card gateway adapter | PAY | P1 | 3 | held-default | 2 | 0 | KG-04 |
| PRD-PAY-032 | MPC card gateway adapter | PAY | P1 | 3 | held-default | 1 | 0 | MG-03 |
| PRD-PAY-033 | Accounts receivable | PAY | P1 | 3 | held-default | 10 | 0 | PAID-STUB |
| PRD-PAY-034 | Outlet receipt printing and cash-up | PAY | P1 | 3 | held-default | 4 | 0 | PH-INF |
| PRD-PAY-035 | Direct payment to the seller | PAY | P2 | 3 | held-default | 5 | 0 | PO-REC-v8, PAY-DIRECT / LIC-01 / PO-REC-v8 / PAY-DIRECT / LIC-01 |
| PRD-PAY-036 | Offline direct payment confirmation | PAY | P2 | 3 | held-default | 4 | 0 | WF-ENG, PO-REC-v8, PAY-DIRECT / LIC-01 / WF-ENG / PO-REC-v8 / PAY-DIRECT / LIC-01 |
| PRD-ORD-001 | Order management console | ORD | P1 | 3 | not-built | 8 | 0 | - |
| PRD-ORD-002 | Configurable order status model | ORD | P1 | 3 | built | 15 | 1 | - |
| PRD-ORD-003 | Order interventions with reason codes and audit | ORD | P1 | 3 | not-built | 7 | 0 | - |
| PRD-ORD-004 | Cancellation rules | ORD | P1 | 3 | not-built | 8 | 0 | - |
| PRD-ORD-005 | Seller order processing | ORD | P1 | 3 | not-built | 7 | 0 | - |
| PRD-ORD-006 | Partial fulfilment approval | ORD | P1 | 3 | not-built | 5 | 0 | - |
| PRD-ORD-007 | Order numbering | ORD | P1 | 3 | built | 5 | 1 | - |
| PRD-ORD-008 | Reorder | ORD | P1 | 3 | not-built | 2 | 0 | - |
| PRD-ORD-009 | Invoices | ORD | P1 | 3 | held-default | 6 | 0 | DOC-LIB |
| PRD-ORD-010 | Order holds | ORD | P1 | 3 | not-built | 8 | 0 | - |
| PRD-ORD-011 | Cut-offs and service levels | ORD | P1 | 3 | not-built | 5 | 0 | - |
| PRD-ORD-012 | Request for quotation | ORD | P1 | 3 | not-built | 9 | 0 | - |
| PRD-ORD-013 | Quote negotiation and conversion | ORD | P1 | 3 | not-built | 8 | 0 | - |
| PRD-ORD-014 | Seller offers | ORD | P1 | 3 | held-default | 5 | 0 | K-01 |
| PRD-ORD-015 | Configurable requisition workflows | ORD | P1 | 3 | held-default | 5 | 0 | WF-ENG |
| PRD-ORD-016 | Contract drafting | ORD | P1 | 3 | held-default | 5 | 0 | DOC-LIB |
| PRD-ORD-017 | Contract e-signature | ORD | P2 | 3 | held-default | 3 | 0 | DOC-LIB |
| PRD-ORD-018 | Contract amendments | ORD | P2 | 3 | held-default | 4 | 0 | WF-ENG |
| PRD-ORD-019 | Contract repository | ORD | P2 | 3 | not-built | 2 | 0 | - |
| PRD-ORD-020 | Award and acceptance letters | ORD | P2 | 3 | held-default | 3 | 0 | DOC-LIB |
| PRD-ORD-021 | Performance securities | ORD | P3 | 3 | not-built | 4 | 0 | - |
| PRD-ORD-022 | Contract-to-order execution | ORD | P1 | 3 | held-default | 5 | 0 | CALLOFF-PLACE, DOC-LIB / CALLOFF-PLACE / DOC-LIB |
| PRD-ORD-023 | Group buying | ORD | P2 | 3 | not-built | 4 | 0 | - |
| PRD-ORD-024 | Scheme applications | ORD | P3 | 3 | held-default | 5 | 0 | WF-ENG |
| PRD-ORD-025 | Proforma invoice | ORD | P1 | 3 | held-default | 4 | 0 | PH-INF, DOC-LIB / PH-INF / DOC-LIB |
| PRD-ORD-026 | Incoterms | ORD | P1 | 3 | held-default | 2 | 0 | PH-INF |
| PRD-ORD-027 | Sample orders | ORD | P2 | 3 | not-built | 2 | 0 | - |
| PRD-ORD-028 | Recurring and subscription orders | ORD | P2 | 3 | not-built | 6 | 0 | - |
| PRD-LOG-001 | Shipping methods and rates | LOG | P1 | 4 | not-built | 7 | 0 | - |
| PRD-LOG-002 | Delivery fee rule engine | LOG | P1 | 4 | not-built | 13 | 0 | - |
| PRD-LOG-003 | Pickup points and outlets | LOG | P1 | 4 | not-built | 9 | 0 | - |
| PRD-LOG-004 | Serviceability rules | LOG | P1 | 4 | not-built | 8 | 0 | - |
| PRD-LOG-005 | Estimated delivery time engine | LOG | P1 | 4 | not-built | 8 | 0 | - |
| PRD-LOG-006 | DHL adapter | LOG | P1 | 4 | not-built | 4 | 0 | - |
| PRD-LOG-007 | Shipping labels and barcodes | LOG | P1 | 4 | not-built | 7 | 0 | - |
| PRD-LOG-008 | Fulfilment allocation and routing | LOG | P1 | 4 | not-built | 6 | 0 | - |
| PRD-LOG-009 | Warehouse pick, pack, dispatch | LOG | P1 | 4 | not-built | 12 | 0 | - |
| PRD-LOG-010 | Shipments | LOG | P1 | 4 | not-built | 5 | 0 | - |
| PRD-LOG-011 | Logistics task creation and seller pickup | LOG | P1 | 4 | held-default | 7 | 0 | FG-06 |
| PRD-LOG-012 | Proof of delivery record | LOG | P1 | 4 | built | 10 | 1 | - |
| PRD-LOG-013 | Delivery exceptions | LOG | P1 | 4 | not-built | 8 | 0 | - |
| PRD-LOG-014 | COD cash reconciliation | LOG | P1 | 4 | not-built | 5 | 0 | - |
| PRD-LOG-015 | Address validation and geocoding | LOG | P1 | 4 | not-built | 5 | 0 | - |
| PRD-LOG-016 | Cross-border shipping | LOG | P1 | 4 | mocked | 7 | 0 | - |
| PRD-LOG-017 | Holding charges and pre-dispatch changes | LOG | P1 | 4 | not-built | 8 | 0 | - |
| PRD-LOG-018 | Logistics KPIs | LOG | P1 | 4 | held-default | 5 | 0 | PAID-STUB |
| PRD-LOG-019 | Specialised logistics | LOG | P3 | 4 | mocked | 3 | 0 | - |
| PRD-LOG-020 | S10 identifiers | LOG | P1 | 4 | not-built | 4 | 0 | - |
| PRD-LOG-021 | Carrier connector framework | LOG | P1 | 4 | not-built | 10 | 0 | - |
| PRD-LOG-022 | Post-office drop-off acceptance | LOG | P1 | 4 | held-default | 4 | 0 | FG-06 |
| PRD-LOG-023 | Hub-and-spoke sorting | LOG | P1 | 4 | held-default | 3 | 0 | FG-06 |
| PRD-LOG-024 | Last-mile route lists and attempts | LOG | P1 | 4 | held-default | 5 | 0 | FG-06 |
| PRD-LOG-025 | FedEx adapter | LOG | P1 | 4 | not-built | 3 | 0 | - |
| PRD-LOG-026 | G4S adapter | LOG | P1 | 4 | not-built | 3 | 0 | - |
| PRD-LOG-027 | Skynet adapter | LOG | P1 | 4 | not-built | 3 | 0 | - |
| PRD-LOG-028 | Wells Fargo (Kenya) courier adapter | LOG | P1 | 4 | not-built | 3 | 0 | - |
| PRD-LOG-029 | Aramex adapter | LOG | P1 | 4 | not-built | 3 | 0 | - |
| PRD-LOG-030 | Shipping lines and agents adapter | LOG | P1 | 4 | not-built | 3 | 0 | - |
| PRD-LOG-031 | MPC delivery partner adapters | LOG | P1 | 4 | not-built | 2 | 0 | - |
| PRD-LOG-032 | Own-fleet POD capture | LOG | P1 | 4 | held-default | 4 | 0 | FG-06, PAID-STUB / FG-06 / PAID-STUB |
| PRD-TRK-001 | Buyer shipment tracking | TRK | P1 | 4 | built | 11 | 2 | - |
| PRD-TRK-002 | Tracking event hub | TRK | P1 | 4 | not-built | 15 | 0 | - |
| PRD-TRK-003 | Scanning and field operations app | TRK | P1 | 4 | held-default | 6 | 0 | FG-06 |
| PRD-TRK-004 | Email notifications and templates | TRK | P1 | 4 | not-built | 6 | 0 | - |
| PRD-TRK-005 | Notification engine (multi-channel) | TRK | P1 | 4 | not-built | 17 | 0 | - |
| PRD-TRK-006 | Notification preferences | TRK | P1 | 4 | not-built | 16 | 0 | - |
| PRD-TRK-007 | Notification delivery tracking and audit | TRK | P1 | 4 | not-built | 7 | 0 | - |
| PRD-TRK-008 | In-app notification feed | TRK | P2 | 4 | not-built | 3 | 0 | - |
| PRD-TRK-009 | Proactive outreach and outage notices | TRK | P1 | 4 | not-built | 5 | 0 | - |
| PRD-TRK-010 | Seller shipment visibility | TRK | P1 | 4 | not-built | 3 | 0 | - |
| PRD-TRK-011 | Guest order-status lookup | TRK | P1 | 4 | built | 3 | 1 | - |
| PRD-TRK-012 | Shipment and pickup event notifications | TRK | P1 | 4 | not-built | 8 | 0 | - |
| PRD-RET-001 | Return requests | RET | P1 | 4 | not-built | 12 | 0 | - |
| PRD-RET-002 | Return eligibility rules | RET | P1 | 4 | not-built | 7 | 0 | - |
| PRD-RET-003 | Return logistics | RET | P1 | 4 | held-default | 8 | 0 | T-MISS |
| PRD-RET-004 | Return inspection | RET | P1 | 4 | not-built | 7 | 0 | - |
| PRD-RET-005 | Automatic refund trigger | RET | P1 | 4 | not-built | 12 | 0 | - |
| PRD-RET-006 | Return fees | RET | P1 | 4 | not-built | 6 | 0 | - |
| PRD-RET-007 | Dispute and issue cases | RET | P1 | 4 | held-default | 15 | 0 | WF-ENG |
| PRD-RET-008 | Dispute SLAs and escalation | RET | P1 | 4 | held-default | 8 | 0 | WF-ENG |
| PRD-RET-009 | Case retention and reports | RET | P1 | 4 | not-built | 3 | 0 | - |
| PRD-RET-010 | Seller return review | RET | P1 | 4 | not-built | 6 | 0 | - |
| PRD-RET-011 | Buyer–seller mediation | RET | P1 | 4 | held-default | 6 | 0 | WF-ENG |
| PRD-CRM-001 | Help desk ticketing | CRM | P1 | 5 | not-built | 16 | 0 | - |
| PRD-CRM-002 | Multi-channel case intake | CRM | P1 | 5 | not-built | 12 | 0 | - |
| PRD-CRM-003 | Agent 360° view | CRM | P1 | 5 | not-built | 8 | 0 | - |
| PRD-CRM-004 | Complaints process | CRM | P1 | 5 | held-default | 7 | 0 | WF-ENG, T-MISS / WF-ENG / T-MISS |
| PRD-CRM-005 | Support quality analytics | CRM | P1 | 5 | not-built | 6 | 0 | - |
| PRD-CRM-006 | Ticket collaboration and audit | CRM | P1 | 5 | not-built | 6 | 0 | - |
| PRD-CRM-007 | Knowledge base | CRM | P1 | 5 | not-built | 9 | 0 | - |
| PRD-CRM-008 | Live web chat | CRM | P1 | 5 | not-built | 7 | 0 | - |
| PRD-CRM-009 | Contact and messaging | CRM | P1 | 5 | not-built | 7 | 0 | - |
| PRD-CRM-010 | Fraud reporting and referral | CRM | P1 | 5 | not-built | 5 | 0 | - |
| PRD-CRM-011 | Experience feedback | CRM | P1 | 5 | not-built | 6 | 0 | - |
| PRD-CRM-012 | Support channel directory | CRM | P2 | 5 | not-built | 3 | 0 | - |
| PRD-CRM-013 | Community forums | CRM | P3 | 5 | not-built | 3 | 0 | - |
| PRD-CRM-014 | Issue routing and escalation | CRM | P1 | 5 | not-built | 12 | 0 | - |
| PRD-CRM-015 | B2B account management | CRM | P2 | 5 | not-built | 5 | 0 | - |
| PRD-MKT-001 | Discounts and coupons | MKT | P1 | 5 | not-built | 11 | 0 | - |
| PRD-MKT-002 | Advanced promotions | MKT | P1 | 5 | not-built | 7 | 0 | - |
| PRD-MKT-003 | Reward points | MKT | P1 | 5 | not-built | 6 | 0 | - |
| PRD-MKT-004 | Gift cards and vouchers | MKT | P1 | 5 | not-built | 6 | 0 | - |
| PRD-MKT-005 | Newsletter and email campaigns | MKT | P1 | 5 | not-built | 9 | 0 | - |
| PRD-MKT-006 | On-site pop-ups | MKT | P1 | 5 | not-built | 7 | 0 | - |
| PRD-MKT-007 | Content management | MKT | P1 | 5 | not-built | 10 | 0 | - |
| PRD-MKT-008 | Content approval and policy versioning | MKT | P1 | 5 | held-default | 11 | 0 | WF-ENG |
| PRD-MKT-009 | SEO | MKT | P1 | 5 | not-built | 8 | 0 | - |
| PRD-MKT-010 | Marketing tags and social | MKT | P1 | 5 | not-built | 7 | 0 | - |
| PRD-MKT-011 | Customer segmentation attributes | MKT | P1 | 5 | not-built | 5 | 0 | - |
| PRD-MKT-012 | Abandoned-cart recovery | MKT | P2 | 5 | not-built | 6 | 0 | - |
| PRD-MKT-013 | Affiliates and referrals | MKT | P2 | 5 | not-built | 6 | 0 | - |
| PRD-MKT-014 | Seller-managed pricing and promotions | MKT | P1 | 5 | not-built | 7 | 0 | - |
| PRD-RPT-001 | Standard reports and dashboard | RPT | P1 | 5 | not-built | 11 | 0 | - |
| PRD-RPT-002 | KPI framework and executive dashboards | RPT | P1 | 5 | held-default | 10 | 0 | PAID-STUB |
| PRD-RPT-003 | Data warehouse and ETL | RPT | P1 | 5 | mocked | 9 | 0 | - |
| PRD-RPT-004 | Report delivery and self-service | RPT | P1 | 5 | mocked | 7 | 0 | - |
| PRD-RPT-005 | Report access control | RPT | P1 | 5 | mocked | 5 | 0 | - |
| PRD-RPT-006 | Compliance and audit reports | RPT | P1 | 5 | mocked | 5 | 0 | - |
| PRD-RPT-007 | Public transparency dashboard | RPT | P3 | 5 | not-built | 3 | 0 | - |
| PRD-RPT-008 | External BI connectivity | RPT | P2 | 5 | held-default | 4 | 0 | PAID-STUB |
| PRD-RPT-009 | Operator performance metrics | RPT | P2 | 5 | not-built | 4 | 0 | - |
| PRD-RPT-010 | Operational dashboards | RPT | P1 | 5 | held-default | 5 | 0 | PAID-STUB |
| PRD-RPT-011 | Commerce and marketing analytics | RPT | P1 | 5 | held-default | 9 | 0 | PAID-STUB |
| PRD-RPT-012 | e-Government and engagement reports | RPT | P1 | 5 | held-default | 2 | 0 | FG-06, PAID-STUB / FG-06 / PAID-STUB |
| PRD-ADM-001 | Administration console | ADM | P1 | 1 | not-built | 12 | 0 | - |
| PRD-ADM-002 | Workflow engine | ADM | P1 | 1 | held-default | 20 | 0 | WF-ENG |
| PRD-ADM-003 | Business rules engine | ADM | P1 | 1 | not-built | 9 | 0 | - |
| PRD-ADM-004 | Transaction types and parameter schema | ADM | P2 | 1 | not-built | 6 | 0 | - |
| PRD-ADM-005 | Eligibility and quota rules | ADM | P2 | 1 | not-built | 6 | 0 | - |
| PRD-ADM-006 | Approval queues | ADM | P1 | 1 | held-default | 14 | 0 | WF-ENG |
| PRD-ADM-007 | Operations console and work queues | ADM | P1 | 1 | not-built | 9 | 0 | - |
| PRD-ADM-008 | Upload and content scanning controls | ADM | P1 | 1 | not-built | 10 | 0 | - |
| PRD-ADM-009 | Exception management | ADM | P2 | 1 | not-built | 5 | 0 | - |
| PRD-ADM-010 | Operational alerts | ADM | P2 | 1 | not-built | 3 | 0 | - |
| PRD-ADM-011 | Template library | ADM | P2 | 1 | not-built | 6 | 0 | - |
| PRD-ADM-012 | Template analytics and shared marketplace | ADM | P3 | 1 | not-built | 3 | 0 | - |
| PRD-DOC-001 | Document generation | DOC | P1 | 4 | held-default | 15 | 0 | DOC-LIB |
| PRD-DOC-002 | Document storage | DOC | P1 | 4 | not-built | 9 | 0 | - |
| PRD-DOC-003 | Document integrity | DOC | P2 | 4 | not-built | 6 | 0 | - |
| PRD-DOC-004 | Document review and compliance export | DOC | P2 | 4 | not-built | 4 | 0 | - |
| PRD-DOC-005 | Document requirements and validation | DOC | P2 | 4 | mocked | 6 | 0 | - |
| PRD-DOC-006 | Export document set | DOC | P1 | 4 | held-default | 5 | 0 | DOC-LIB |
| PRD-SEC-001 | Encryption and transport security | SEC | P1 | 1 | not-built | 10 | 0 | - |
| PRD-SEC-002 | Edge protection | SEC | P1 | 1 | mocked | 12 | 0 | - |
| PRD-SEC-003 | PCI-DSS scope control | SEC | P1 | 1 | not-built | 4 | 0 | - |
| PRD-SEC-004 | Platform audit trail | SEC | P1 | 1 | built | 20 | 1 | - |
| PRD-SEC-005 | Anomaly and correlation detection | SEC | P2 | 1 | mocked | 3 | 0 | - |
| PRD-SEC-006 | Data residency | SEC | P1 | 1 | held-default | 3 | 0 | DP-01 |
| PRD-SEC-007 | Consent and privacy tools | SEC | P1 | 1 | not-built | 10 | 0 | - |
| PRD-SEC-008 | Breach notification workflow | SEC | P1 | 1 | not-built | 7 | 0 | - |
| PRD-SEC-009 | Compliance reports and certificates | SEC | P2 | 1 | mocked | 3 | 0 | - |
| PRD-SEC-010 | Auditor read-only access | SEC | P2 | 1 | not-built | 5 | 0 | - |
| PRD-SEC-011 | Vulnerability management | SEC | P1 | 1 | mocked | 4 | 0 | - |
| PRD-SEC-012 | Country data-protection pack | SEC | P1 | 1 | not-built | 9 | 0 | - |
| PRD-SEC-013 | Bot protection | SEC | P1 | 1 | not-built | 5 | 0 | - |
| PRD-SEC-014 | Data classification and masking | SEC | P2 | 1 | held-default | 6 | 0 | DP-01 |
| PRD-SEC-015 | Security incident management | SEC | P2 | 1 | mocked | 2 | 0 | - |
| PRD-INT-001 | Public REST API | INT | P1 | 6 | held-default | 20 | 0 | API-01, PAID-STUB, API-GW / API-01 / PAID-STUB / API-GW |
| PRD-INT-002 | Integration layer (API gateway) | INT | P1 | 6 | held-default | 14 | 0 | API-GW |
| PRD-INT-003 | Webhooks and events | INT | P1 | 6 | not-built | 14 | 0 | - |
| PRD-INT-004 | Integration health and retries | INT | P1 | 6 | mocked | 9 | 0 | - |
| PRD-INT-005 | ERP and finance connector framework | INT | P1 | 6 | held-default | 12 | 0 | PAID-STUB |
| PRD-INT-006 | SAGE 200 adapter | INT | P1 | 6 | not-built | 4 | 0 | - |
| PRD-INT-007 | PostGlobal adapter | INT | P1 | 6 | not-built | 6 | 0 | - |
| PRD-INT-008 | Banking integrations | INT | P1 | 6 | not-built | 4 | 0 | - |
| PRD-INT-009 | Government system connector framework | INT | P1 | 6 | not-built | 5 | 0 | - |
| PRD-INT-010 | Master data synchronisation | INT | P1 | 6 | not-built | 6 | 0 | - |
| PRD-INT-011 | Plugin extensibility | INT | P1 | 6 | not-built | 6 | 0 | - |
| PRD-INT-012 | Punch-out | INT | P3 | 6 | not-built | 7 | 0 | - |
| PRD-INT-013 | MANEPS adapter | INT | P1 | 6 | held-default | 2 | 0 | MG-09 |
| PRD-CHN-001 | Native mobile apps | CHN | P1 | 6 | held-default | 5 | 0 | M-19, PAID-STUB / M-19 / PAID-STUB |
| PRD-CHN-002 | PWA and low-bandwidth mode | CHN | P1 | 6 | not-built | 9 | 0 | - |
| PRD-CHN-003 | USSD channel | CHN | P1 | 6 | mocked | 8 | 0 | - |
| PRD-CHN-004 | IVR channel | CHN | P2 | 6 | mocked | 3 | 0 | - |
| PRD-CHN-005 | SMS gateway and SMS commands | CHN | P1 | 6 | not-built | 11 | 0 | - |
| PRD-CHN-006 | WhatsApp Business | CHN | P1 | 6 | not-built | 8 | 0 | - |
| PRD-CHN-007 | WeChat | CHN | P1 | 6 | not-built | 3 | 0 | - |
| PRD-CHN-008 | Telegram bot | CHN | P3 | 6 | not-built | 2 | 0 | - |
| PRD-CHN-009 | Agent and correspondent networks | CHN | P2 | 6 | not-built | 6 | 0 | - |
| PRD-CHN-010 | Field agent app | CHN | P2 | 6 | held-default | 5 | 0 | FG-06 |
| PRD-CHN-011 | Social media integration | CHN | P1 | 6 | not-built | 2 | 0 | - |
| PRD-CHN-012 | SMS sender ID and opt-out | CHN | P2 | 6 | not-built | 6 | 0 | - |
| PRD-CHN-013 | Push notifications | CHN | P2 | 6 | not-built | 4 | 0 | - |
| PRD-AI-001 | AI translation | AI | P3 | 6 | not-built | 7 | 0 | - |
| PRD-AI-002 | AI listing assistance | AI | P3 | 6 | not-built | 8 | 0 | - |
| PRD-AI-003 | AI chatbot | AI | P1 | 6 | not-built | 11 | 0 | - |
| PRD-AI-004 | AI drafting and summarisation | AI | P3 | 6 | not-built | 2 | 0 | - |
| PRD-AI-005 | OCR and ID document checks | AI | P2 | 6 | mocked | 3 | 0 | - |
| PRD-AI-006 | ML fraud detection | AI | P3 | 6 | mocked | 2 | 0 | - |
| PRD-AI-007 | ML recommendation engine | AI | P3 | 6 | mocked | 4 | 0 | - |
| PRD-AI-008 | Forecasting and image inspection | AI | P3 | 6 | mocked | 2 | 0 | - |
| PRD-AI-009 | AI contract and letter drafting | AI | P3 | 6 | not-built | 1 | 0 | - |
| PRD-AI-010 | AI governance | AI | P1 | 6 | mocked | 7 | 0 | - |
| PRD-FIN-001 | Credit marketplace | FIN | P3 | 7 | mocked | 14 | 0 | - |
| PRD-FIN-002 | Invoice discounting | FIN | P3 | 7 | mocked | 7 | 0 | - |
| PRD-FIN-003 | Insurance | FIN | P3 | 7 | mocked | 9 | 0 | - |
| PRD-FIN-004 | Subsidies and incentives | FIN | P3 | 7 | not-built | 8 | 0 | - |
| PRD-FIN-005 | Financial and partner services catalogue | FIN | P1 | 7 | held-default | 8 | 0 | FG-06, T-MISS / FG-06 / T-MISS |
| PRD-EGV-001 | e-Government service catalogue | EGV | P1 | 7 | held-default | 9 | 0 | FG-06, T-MISS / FG-06 / T-MISS |
| PRD-EGV-002 | Service applications | EGV | P1 | 7 | held-default | 18 | 0 | FG-06, WF-ENG, T-MISS / FG-06 / WF-ENG / T-MISS |
| PRD-EGV-003 | Appointments | EGV | P1 | 7 | held-default | 6 | 0 | FG-06, T-MISS / FG-06 / T-MISS |
| PRD-EGV-004 | Document delivery | EGV | P1 | 7 | held-default | 6 | 0 | FG-06, T-MISS / FG-06 / T-MISS |
| PRD-EGV-005 | Government fee collection | EGV | P1 | 7 | held-default | 8 | 0 | FG-06, T-MISS / FG-06 / T-MISS |
| PRD-EGV-006 | Agency administration | EGV | P1 | 7 | held-default | 6 | 0 | FG-06, T-MISS / FG-06 / T-MISS |
| PRD-EGV-007 | Digital ID service workflows | EGV | P1 | 7 | held-default | 4 | 0 | FG-06, WF-ENG, T-MISS / FG-06 / WF-ENG / T-MISS |
| PRD-SVC-001 | Service pricing models | SVC | P2 | 7 | held-default | 8 | 0 | PO-REC-v8 |
| PRD-SVC-002 | Service providers and resources | SVC | P2 | 7 | not-built | 8 | 0 | - |
| PRD-SVC-003 | Booking changes, cancellations and no-shows | SVC | P2 | 7 | held-default | 9 | 0 | FG-06, PO-REC-v8 / FG-06 / PO-REC-v8 |
| PRD-SVC-004 | Deposits and advance payment for bookings | SVC | P2 | 7 | held-default | 8 | 0 | FG-06, PO-REC-v8 / FG-06 / PO-REC-v8 |
| PRD-SVC-005 | Service order lifecycle and completion sign-off | SVC | P1 | 7 | not-built | 13 | 0 | - |
| PRD-SVC-006 | Service location at booking | SVC | P2 | 7 | held-default | 5 | 0 | PO-REC-v8 |
| PRD-SVC-007 | Digital products and downloads | SVC | P2 | 7 | held-default | 8 | 0 | PO-REC-v8 |
| PRD-SVC-008 | Rental and hire | SVC | P2 | 7 | not-built | 5 | 0 | - |
| PRD-SVC-009 | Service vouchers and e-tickets | SVC | P2 | 7 | held-default | 8 | 0 | PO-REC-v8 |
| PRD-SVC-010 | Service reminders and follow-up | SVC | P2 | 7 | held-default | 5 | 0 | PO-REC-v8 |
| PRD-SVC-011 | Service-level targets for service orders | SVC | P1 | 7 | not-built | 7 | 0 | - |
| PRD-SVC-012 | Service reports | SVC | P2 | 7 | held-default | 5 | 0 | FG-06, PO-REC-v8 / FG-06 / PO-REC-v8 |
