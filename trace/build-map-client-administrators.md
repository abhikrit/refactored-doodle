# Build map — Client administrators

Generated 2026-11-24T13:23:03.126Z by `scripts/build-group-map.mjs`.

The product mapping diagram counts **137** features for this group and the registry reproduces it exactly.

A feature is in this group when its Client-PRD "Who uses it" list names one of:
`client administrators` · `client it administrators` · `client management` · `client managers`.

Groups overlap: these features also serve other users, and most of them are not *only* this
group's. Building them is building the spine of the product, not a silo.

## 1. Profile

| Measure | Value |
|---|---|
| Features | 137 |
| Acceptance criteria | 1117 |
| Phase | P1 115 · P2 18 · P3 4 |
| Priority | Must 96 · Should 30 · Could 11 |
| Held by an open decision | 23 |
| Modules touched | 24 of 24 — ADM AI CAT CHK CHN CRM DOC EGV FIN IAM INT INV LOG MKT ORD PAY PLT RET RPT SEC SEL SRC SVC TRK |
| Build waves | 1, 2, 3, 4, 5, 6, 7 |

### Implementation route

| Route | Features |
|---|---|
| Code-level | 101 |
| Configuration | 23 |
| External system | 10 |
| Licensed plugin | 3 |

### By module

| Module | Name | Features | P1 | Must | Held | ACs |
|---|---|---|---|---|---|---|
| PLT | Platform foundation and multi-client configuration | 9 | 9 | 7 | 1 | 78 |
| IAM | Identity, access and accounts | 10 | 9 | 10 | 0 | 102 |
| SEL | Sellers and marketplace onboarding | 10 | 9 | 5 | 1 | 61 |
| CAT | Catalogue and listings | 9 | 8 | 8 | 2 | 78 |
| INV | Inventory and warehouses | 3 | 3 | 3 | 0 | 38 |
| SRC | Search, discovery and merchandising | 1 | 1 | 1 | 0 | 7 |
| CHK | Cart and checkout | 5 | 5 | 2 | 0 | 38 |
| PAY | Payments, tax, settlement and reconciliation | 7 | 6 | 5 | 1 | 48 |
| ORD | Orders and B2B transactions (RFQ, contracts, requisitions, offers, group buying) | 11 | 7 | 7 | 4 | 63 |
| LOG | Shipping, logistics and fulfilment | 8 | 8 | 5 | 0 | 68 |
| TRK | Tracking and notifications | 5 | 5 | 4 | 0 | 61 |
| RET | Returns, refunds and disputes | 7 | 7 | 4 | 2 | 50 |
| CRM | Customer service, help desk and chat | 4 | 2 | 2 | 1 | 31 |
| MKT | Marketing, promotions, loyalty, content and SEO | 2 | 2 | 1 | 0 | 15 |
| RPT | Reporting and analytics | 6 | 4 | 5 | 1 | 39 |
| ADM | Administration, workflow and operations console | 8 | 5 | 6 | 2 | 80 |
| DOC | Documents and records | 1 | 0 | 1 | 0 | 6 |
| SEC | Security, audit and compliance | 9 | 8 | 8 | 1 | 62 |
| INT | Integrations and APIs | 8 | 7 | 5 | 3 | 84 |
| CHN | Channels: mobile app, PWA, USSD, SMS, WhatsApp, assisted/agent | 7 | 5 | 4 | 0 | 51 |
| AI | AI capabilities | 2 | 2 | 1 | 0 | 18 |
| FIN | Financial products | 1 | 1 | 0 | 1 | 8 |
| EGV | e-Government and service catalogue (optional pack) | 2 | 2 | 1 | 2 | 15 |
| SVC | Services commerce (booking, delivery and completion of services; SVC-007 covers electronically delivered goods) | 2 | 0 | 1 | 1 | 16 |

## 2. Build order

Wave first (handoff section 5.2), then P1 → P2 → P3, then Must → Should → Could, then the
workbook "Depends on" order. "State" is what the prototype has today, from `trace/trace.json`.

**Feature ID** is the ID exactly as the roadmap writes it, with the `PRD-` prefix.
**Roadmap row** is its row in the "Product Features" sheet of
`docs/Product_Feature_List_nopCommerce_5.00.xlsx`, so every line here can be opened in the
workbook directly.

### Wave 1 — Foundation (36 features)

| # | Feature ID | Roadmap row | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-ADM-001 | 390 | Administration console | ADM | P1 | Must Have | Configuration | 12 | 2 | not built | — |
| 2 | PRD-ADM-002 | 391 | Workflow engine | ADM | P1 | Must Have | Code-level | 20 | 1 | held, prototype default | WF-ENG |
| 3 | PRD-ADM-003 | 392 | Business rules engine | ADM | P1 | Must Have | Code-level | 9 | 1 | not built | — |
| 4 | PRD-ADM-006 | 395 | Approval queues | ADM | P1 | Must Have | Code-level | 14 | 1 | held, prototype default | WF-ENG |
| 5 | PRD-IAM-001 | 34 | Customer registration and login | IAM | P1 | Must Have | Configuration | 11 | 2 | not built | — |
| 6 | PRD-IAM-002 | 35 | Mobile-number identity with OTP | IAM | P1 | Must Have | Code-level | 20 | 3 | not built | — |
| 7 | PRD-IAM-003 | 36 | Password policy, lockout and recovery | IAM | P1 | Must Have | Code-level | 10 | 1 | not built | — |
| 8 | PRD-IAM-004 | 37 | Multi-factor authentication by role | IAM | P1 | Must Have | Code-level | 10 | 2 | not built | — |
| 9 | PRD-IAM-006 | 39 | Session management | IAM | P1 | Must Have | Code-level | 7 | 1 | not built | — |
| 10 | PRD-IAM-007 | 40 | Roles and permissions | IAM | P1 | Must Have | Configuration | 13 | 1 | not built | — |
| 11 | PRD-IAM-008 | 41 | Scoped permissions | IAM | P1 | Must Have | Code-level | 8 | 1 | not built | — |
| 12 | PRD-IAM-011 | 44 | Staff invitation and access reviews | IAM | P1 | Must Have | Code-level | 7 | 1 | not built | — |
| 13 | PRD-IAM-026 | 59 | Assisted service by agents | IAM | P1 | Must Have | Code-level | 10 | 2 | not built | — |
| 14 | PRD-PLT-022 | 25 | Feature and module registry | PLT | P1 | Should Have | Code-level | 6 | 1 | built | — |
| 15 | PRD-PLT-003 | 6 | Configuration packs | PLT | P1 | Must Have | Code-level | 19 | 1 | built | — |
| 16 | PRD-PLT-004 | 7 | Settings change control | PLT | P1 | Must Have | Code-level | 17 | 2 | held, prototype default | WF-ENG |
| 17 | PRD-PLT-005 | 8 | Configuration export, import and promotion | PLT | P1 | Must Have | Code-level | 7 | 1 | not built | — |
| 18 | PRD-PLT-006 | 9 | Branding and theme | PLT | P1 | Must Have | Licensed plugin | 4 | 0 | not built | — |
| 19 | PRD-PLT-009 | 12 | Languages and language packs | PLT | P1 | Must Have | Configuration | 5 | 1 | not built | — |
| 20 | PRD-PLT-013 | 16 | Multi-store (B2B and B2C storefronts) | PLT | P1 | Must Have | Configuration | 5 | 1 | not built | — |
| 21 | PRD-PLT-020 | 23 | Data retention and archival | PLT | P1 | Must Have | Code-level | 11 | 1 | not built | — |
| 22 | PRD-SEC-001 | 414 | Encryption and transport security | SEC | P1 | Must Have | Configuration | 10 | 1 | not built | — |
| 23 | PRD-SEC-002 | 415 | Edge protection | SEC | P1 | Must Have | External system | 12 | 1 | mocked | — |
| 24 | PRD-SEC-003 | 416 | PCI-DSS scope control | SEC | P1 | Must Have | Configuration | 4 | 0 | not built | — |
| 25 | PRD-SEC-006 | 419 | Data residency | SEC | P1 | Must Have | External system | 3 | 1 | held, prototype default | DP-01 |
| 26 | PRD-SEC-012 | 425 | Country data-protection pack | SEC | P1 | Must Have | Code-level | 9 | 1 | not built | — |
| 27 | PRD-SEC-007 | 420 | Consent and privacy tools | SEC | P1 | Must Have | Configuration | 10 | 2 | not built | — |
| 28 | PRD-SEC-011 | 424 | Vulnerability management | SEC | P1 | Must Have | External system | 4 | 0 | mocked | — |
| 29 | PRD-ADM-008 | 397 | Upload and content scanning controls | ADM | P1 | Should Have | Code-level | 10 | 1 | not built | — |
| 30 | PRD-PLT-019 | 22 | Contextual help and guided tours | PLT | P1 | Should Have | Code-level | 4 | 2 | not built | — |
| 31 | PRD-SEC-013 | 426 | Bot protection | SEC | P1 | Should Have | Configuration | 5 | 1 | not built | — |
| 32 | PRD-ADM-004 | 393 | Transaction types and parameter schema | ADM | P2 | Must Have | Code-level | 6 | 1 | not built | — |
| 33 | PRD-ADM-011 | 400 | Template library | ADM | P2 | Must Have | Code-level | 6 | 1 | not built | — |
| 34 | PRD-IAM-005 | 38 | Single sign-on for staff and B2B buyers | IAM | P2 | Must Have | Code-level | 6 | 0 | not built | — |
| 35 | PRD-SEC-010 | 423 | Auditor read-only access | SEC | P2 | Must Have | Code-level | 5 | 2 | not built | — |
| 36 | PRD-ADM-012 | 401 | Template analytics and shared marketplace | ADM | P3 | Could Have | Code-level | 3 | 1 | not built | — |

### Wave 2 — Catalogue (23 features)

| # | Feature ID | Roadmap row | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-CAT-001 | 92 | Category taxonomy | CAT | P1 | Must Have | Configuration | 8 | 1 | not built | — |
| 2 | PRD-CAT-002 | 93 | Product master record | CAT | P1 | Must Have | Code-level | 14 | 1 | not built | — |
| 3 | PRD-CAT-005 | 96 | Category attribute schema and listing quality rules | CAT | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 4 | PRD-CAT-016 | 107 | Product media | CAT | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 5 | PRD-CAT-021 | 112 | Listing policy enforcement | CAT | P1 | Must Have | Code-level | 9 | 3 | not built | — |
| 6 | PRD-CAT-022 | 113 | Listing lifecycle and operator approval | CAT | P1 | Must Have | Code-level | 20 | 3 | held, prototype default | WF-ENG |
| 7 | PRD-CAT-036 | 127 | Catalogue segmentation by buyer channel | CAT | P1 | Must Have | Configuration | 3 | 2 | not built | — |
| 8 | PRD-CAT-043 | 134 | Seller listing moderation | CAT | P1 | Must Have | Code-level | 5 | 1 | held, prototype default | WF-ENG |
| 9 | PRD-INV-001 | 138 | Stock tracking | INV | P1 | Must Have | Configuration | 10 | 3 | not built | — |
| 10 | PRD-INV-002 | 139 | Multi-warehouse stock | INV | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 11 | PRD-INV-004 | 141 | Stock reservation and hold | INV | P1 | Must Have | Code-level | 20 | 4 | not built | — |
| 12 | PRD-SEL-001 | 64 | Seller application and profile | SEL | P1 | Must Have | Configuration | 6 | 2 | not built | — |
| 13 | PRD-SEL-002 | 65 | Seller KYC documents | SEL | P1 | Must Have | Code-level | 10 | 4 | not built | — |
| 14 | PRD-SEL-003 | 66 | Seller verification workflow and tiers | SEL | P1 | Must Have | Code-level | 15 | 5 | held, prototype default | WF-ENG |
| 15 | PRD-SEL-007 | 70 | Marketplace rules and listing eligibility | SEL | P1 | Must Have | Code-level | 7 | 1 | not built | — |
| 16 | PRD-SRC-019 | 172 | Search result eligibility | SRC | P1 | Must Have | Code-level | 7 | 0 | not built | — |
| 17 | PRD-SEL-011 | 74 | Seller performance monitoring | SEL | P1 | Should Have | Code-level | 6 | 2 | not built | — |
| 18 | PRD-SEL-012 | 75 | Seller ratings | SEL | P1 | Should Have | Code-level | 5 | 3 | not built | — |
| 19 | PRD-SEL-021 | 84 | Seller onboarding funnel report | SEL | P1 | Should Have | Code-level | 2 | 1 | not built | — |
| 20 | PRD-SEL-009 | 72 | Seller staff accounts | SEL | P1 | Could Have | Code-level | 5 | 2 | not built | — |
| 21 | PRD-SEL-023 | 86 | Seller training content | SEL | P1 | Could Have | Configuration | 3 | 1 | not built | — |
| 22 | PRD-SEL-010 | 73 | Seller categorisation | SEL | P2 | Must Have | Code-level | 2 | 1 | not built | — |
| 23 | PRD-CAT-025 | 116 | Stale listing detection | CAT | P2 | Should Have | Code-level | 3 | 1 | not built | — |

### Wave 3 — Buy (23 features)

| # | Feature ID | Roadmap row | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-CHK-002 | 185 | Checkout | CHK | P1 | Must Have | Configuration | 10 | 1 | built | — |
| 2 | PRD-CHK-009 | 192 | E-transactions consumer controls | CHK | P1 | Must Have | Code-level | 6 | 3 | not built | — |
| 3 | PRD-ORD-002 | 246 | Configurable order status model | ORD | P1 | Must Have | Code-level | 15 | 4 | built | — |
| 4 | PRD-ORD-003 | 247 | Order interventions with reason codes and audit | ORD | P1 | Must Have | Code-level | 7 | 3 | not built | — |
| 5 | PRD-ORD-015 | 259 | Configurable requisition workflows | ORD | P1 | Must Have | Code-level | 5 | 2 | held, prototype default | WF-ENG |
| 6 | PRD-ORD-016 | 260 | Contract drafting | ORD | P1 | Must Have | Code-level | 5 | 2 | held, prototype default | DOC-LIB |
| 7 | PRD-PAY-001 | 206 | Payment method framework and routing | PAY | P1 | Must Have | Code-level | 10 | 2 | not built | — |
| 8 | PRD-PAY-006 | 211 | Letters of credit | PAY | P1 | Must Have | Code-level | 5 | 1 | not built | — |
| 9 | PRD-PAY-024 | 229 | Payment connector SDK | PAY | P1 | Must Have | Code-level | 7 | 0 | not built | — |
| 10 | PRD-PAY-008 | 213 | Cash on delivery and cash at outlet | PAY | P1 | Must Have | Code-level | 7 | 2 | not built | — |
| 11 | PRD-PAY-021 | 226 | Tax on fees and tax reporting | PAY | P1 | Must Have | Code-level | 3 | 1 | not built | — |
| 12 | PRD-CHK-007 | 190 | Structured address capture | CHK | P1 | Should Have | Code-level | 6 | 1 | not built | — |
| 13 | PRD-CHK-011 | 194 | Cart restriction rules | CHK | P1 | Should Have | Code-level | 6 | 1 | not built | — |
| 14 | PRD-ORD-004 | 248 | Cancellation rules | ORD | P1 | Should Have | Code-level | 8 | 2 | not built | — |
| 15 | PRD-ORD-011 | 255 | Cut-offs and service levels | ORD | P1 | Should Have | Code-level | 5 | 2 | not built | — |
| 16 | PRD-PAY-018 | 223 | Payment and order risk controls | PAY | P1 | Should Have | Code-level | 11 | 1 | not built | — |
| 17 | PRD-CHK-006 | 189 | Delivery slot and instructions | CHK | P1 | Could Have | Code-level | 10 | 2 | not built | — |
| 18 | PRD-ORD-007 | 251 | Order numbering | ORD | P1 | Could Have | Code-level | 5 | 1 | built | — |
| 19 | PRD-ORD-018 | 262 | Contract amendments | ORD | P2 | Must Have | Code-level | 4 | 1 | held, prototype default | WF-ENG |
| 20 | PRD-ORD-020 | 264 | Award and acceptance letters | ORD | P2 | Must Have | Code-level | 3 | 1 | held, prototype default | DOC-LIB |
| 21 | PRD-ORD-023 | 267 | Group buying | ORD | P2 | Must Have | Code-level | 4 | 1 | not built | — |
| 22 | PRD-ORD-027 | 271 | Sample orders | ORD | P2 | Should Have | Code-level | 2 | 0 | not built | — |
| 23 | PRD-PAY-035 | 240 | Direct payment to the seller | PAY | P2 | Should Have | Code-level | 5 | 1 | held, prototype default | PO-REC-v8, PAY-DIRECT / LIC-01 / PO-REC-v8 / PAY-DIRECT / LIC-01 |

### Wave 4 — Fulfil (21 features)

| # | Feature ID | Roadmap row | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-LOG-001 | 276 | Shipping methods and rates | LOG | P1 | Must Have | Configuration | 7 | 1 | not built | — |
| 2 | PRD-LOG-002 | 277 | Delivery fee rule engine | LOG | P1 | Must Have | Code-level | 13 | 2 | not built | — |
| 3 | PRD-LOG-004 | 279 | Serviceability rules | LOG | P1 | Must Have | Code-level | 8 | 3 | not built | — |
| 4 | PRD-LOG-005 | 280 | Estimated delivery time engine | LOG | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 5 | PRD-LOG-012 | 287 | Proof of delivery record | LOG | P1 | Must Have | Code-level | 10 | 3 | built | — |
| 6 | PRD-RET-001 | 326 | Return requests | RET | P1 | Must Have | Configuration | 12 | 4 | not built | — |
| 7 | PRD-RET-002 | 327 | Return eligibility rules | RET | P1 | Must Have | Code-level | 7 | 2 | not built | — |
| 8 | PRD-RET-003 | 328 | Return logistics | RET | P1 | Must Have | Code-level | 8 | 2 | held, prototype default | T-MISS |
| 9 | PRD-RET-008 | 333 | Dispute SLAs and escalation | RET | P1 | Must Have | Code-level | 8 | 2 | held, prototype default | WF-ENG |
| 10 | PRD-TRK-004 | 314 | Email notifications and templates | TRK | P1 | Must Have | Code-level | 6 | 1 | not built | — |
| 11 | PRD-TRK-005 | 315 | Notification engine (multi-channel) | TRK | P1 | Must Have | Code-level | 17 | 1 | not built | — |
| 12 | PRD-TRK-006 | 316 | Notification preferences | TRK | P1 | Must Have | Code-level | 16 | 2 | not built | — |
| 13 | PRD-TRK-007 | 317 | Notification delivery tracking and audit | TRK | P1 | Must Have | Code-level | 7 | 2 | not built | — |
| 14 | PRD-LOG-003 | 278 | Pickup points and outlets | LOG | P1 | Should Have | Code-level | 9 | 2 | not built | — |
| 15 | PRD-RET-009 | 334 | Case retention and reports | RET | P1 | Should Have | Code-level | 3 | 1 | not built | — |
| 16 | PRD-RET-010 | 335 | Seller return review | RET | P1 | Should Have | Code-level | 6 | 1 | not built | — |
| 17 | PRD-TRK-002 | 312 | Tracking event hub | TRK | P1 | Should Have | Code-level | 15 | 2 | not built | — |
| 18 | PRD-LOG-015 | 290 | Address validation and geocoding | LOG | P1 | Could Have | Code-level | 5 | 0 | not built | — |
| 19 | PRD-LOG-017 | 292 | Holding charges and pre-dispatch changes | LOG | P1 | Could Have | Code-level | 8 | 3 | not built | — |
| 20 | PRD-RET-006 | 331 | Return fees | RET | P1 | Could Have | Code-level | 6 | 3 | not built | — |
| 21 | PRD-DOC-005 | 409 | Document requirements and validation | DOC | P2 | Must Have | External system | 6 | 1 | mocked | — |

### Wave 5 — Engage and run (12 features)

| # | Feature ID | Roadmap row | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-CRM-001 | 340 | Help desk ticketing | CRM | P1 | Must Have | Licensed plugin | 16 | 3 | not built | — |
| 2 | PRD-CRM-004 | 343 | Complaints process | CRM | P1 | Must Have | Code-level | 7 | 1 | held, prototype default | WF-ENG, T-MISS / WF-ENG / T-MISS |
| 3 | PRD-MKT-007 | 364 | Content management | MKT | P1 | Must Have | Configuration | 10 | 2 | not built | — |
| 4 | PRD-RPT-001 | 375 | Standard reports and dashboard | RPT | P1 | Must Have | Code-level | 11 | 2 | not built | — |
| 5 | PRD-RPT-003 | 377 | Data warehouse and ETL | RPT | P1 | Must Have | External system | 9 | 1 | mocked | — |
| 6 | PRD-RPT-004 | 378 | Report delivery and self-service | RPT | P1 | Must Have | External system | 7 | 2 | mocked | — |
| 7 | PRD-RPT-005 | 379 | Report access control | RPT | P1 | Must Have | External system | 5 | 1 | mocked | — |
| 8 | PRD-MKT-011 | 368 | Customer segmentation attributes | MKT | P1 | Could Have | Code-level | 5 | 1 | not built | — |
| 9 | PRD-RPT-008 | 382 | External BI connectivity | RPT | P2 | Must Have | Licensed plugin | 4 | 1 | held, prototype default | PAID-STUB |
| 10 | PRD-CRM-015 | 354 | B2B account management | CRM | P2 | Should Have | Code-level | 5 | 2 | not built | — |
| 11 | PRD-RPT-007 | 381 | Public transparency dashboard | RPT | P3 | Should Have | Code-level | 3 | 2 | not built | — |
| 12 | PRD-CRM-013 | 352 | Community forums | CRM | P3 | Could Have | Configuration | 3 | 1 | not built | — |

### Wave 6 — Reach (17 features)

| # | Feature ID | Roadmap row | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-AI-010 | 473 | AI governance | AI | P1 | Must Have | External system | 7 | 2 | mocked | — |
| 2 | PRD-CHN-005 | 452 | SMS gateway and SMS commands | CHN | P1 | Must Have | Code-level | 11 | 1 | not built | — |
| 3 | PRD-CHN-006 | 453 | WhatsApp Business | CHN | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 4 | PRD-CHN-007 | 454 | WeChat | CHN | P1 | Must Have | Code-level | 3 | 2 | not built | — |
| 5 | PRD-INT-001 | 432 | Public REST API | INT | P1 | Must Have | Code-level | 20 | 1 | held, prototype default | API-01, PAID-STUB, API-GW / API-01 / PAID-STUB / API-GW |
| 6 | PRD-INT-002 | 433 | Integration layer (API gateway) | INT | P1 | Must Have | External system | 14 | 1 | held, prototype default | API-GW |
| 7 | PRD-INT-003 | 434 | Webhooks and events | INT | P1 | Must Have | Code-level | 14 | 2 | not built | — |
| 8 | PRD-INT-005 | 436 | ERP and finance connector framework | INT | P1 | Must Have | Code-level | 12 | 3 | held, prototype default | PAID-STUB |
| 9 | PRD-INT-011 | 442 | Plugin extensibility | INT | P1 | Must Have | Configuration | 6 | 1 | not built | — |
| 10 | PRD-AI-003 | 466 | AI chatbot | AI | P1 | Should Have | Code-level | 11 | 2 | not built | — |
| 11 | PRD-CHN-002 | 449 | PWA and low-bandwidth mode | CHN | P1 | Should Have | Code-level | 9 | 2 | not built | — |
| 12 | PRD-CHN-003 | 450 | USSD channel | CHN | P1 | Should Have | External system | 8 | 1 | mocked | — |
| 13 | PRD-INT-009 | 440 | Government system connector framework | INT | P1 | Should Have | Code-level | 5 | 2 | not built | — |
| 14 | PRD-INT-010 | 441 | Master data synchronisation | INT | P1 | Should Have | Code-level | 6 | 1 | not built | — |
| 15 | PRD-CHN-009 | 456 | Agent and correspondent networks | CHN | P2 | Must Have | Code-level | 6 | 1 | not built | — |
| 16 | PRD-CHN-012 | 459 | SMS sender ID and opt-out | CHN | P2 | Should Have | Code-level | 6 | 2 | not built | — |
| 17 | PRD-INT-012 | 443 | Punch-out | INT | P3 | Should Have | Configuration | 7 | 1 | not built | — |

### Wave 7 — Verticals (5 features)

| # | Feature ID | Roadmap row | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-EGV-001 | 485 | e-Government service catalogue | EGV | P1 | Must Have | Configuration | 9 | 1 | held, prototype default | FG-06, T-MISS / FG-06 / T-MISS |
| 2 | PRD-EGV-006 | 490 | Agency administration | EGV | P1 | Should Have | Code-level | 6 | 1 | held, prototype default | FG-06, T-MISS / FG-06 / T-MISS |
| 3 | PRD-FIN-005 | 481 | Financial and partner services catalogue | FIN | P1 | Could Have | Code-level | 8 | 2 | held, prototype default | FG-06, T-MISS / FG-06 / T-MISS |
| 4 | PRD-SVC-002 | 496 | Service providers and resources | SVC | P2 | Must Have | Code-level | 8 | 1 | not built | — |
| 5 | PRD-SVC-007 | 501 | Digital products and downloads | SVC | P2 | Should Have | Configuration | 8 | 1 | held, prototype default | PO-REC-v8 |

## 3. Screens these features own

| Surface | Screen | Module | Features | Native or new |
|---|---|---|---|---|
| Admin | Native admin areas: settings, plugins, widgets, schedule tasks, log, maintenance, products (bulk edit), customers | ADM | PRD-ADM-001 | Native |
| Admin — System | Product extension register and start-up check | ADM | PRD-ADM-001 | New |
| Admin — Configuration | Workflow designer, simulator, versions; case list and replay | ADM | PRD-ADM-002 | New |
| Admin — Configuration | Rule sets, rule editor, pattern library, test harness, evaluation log | ADM | PRD-ADM-003 | New |
| Admin — Configuration | Transaction types, parameter schemas, chains | ADM | PRD-ADM-004 | New |
| Admin — Operations | Approval queue and item page; chain and reason-code configuration; moderation queues | ADM | PRD-ADM-006 | New |
| Admin — Configuration | Upload policy | ADM | PRD-ADM-008 | New settings page |
| Admin — Configuration | Template library, versions, analytics, shared library; configuration workspace | ADM | PRD-ADM-011, PRD-ADM-012 | New |
| Admin | Chatbot settings, conversations and unanswered questions | AI | PRD-AI-003 | New |
| Admin | AI use register and AI use log | AI | PRD-AI-010 | New |
| Admin (staff and vendors) | Product edit: listing state panel, submit, versions and compare, audit tab, trade fields, regulatory fields and certificates, service details, slots, location, fixed currency prices, quantity rules | CAT | PRD-CAT-002, PRD-CAT-003, PRD-CAT-004, PRD-CAT-005, PRD-CAT-006, PRD-CAT-007, PRD-CAT-008, PRD-CAT-009, PRD-CAT-010, PRD-CAT-011, PRD-CAT-012, PRD-CAT-013, PRD-CAT-014, PRD-CAT-015, PRD-CAT-016, PRD-CAT-017, PRD-CAT-018, PRD-CAT-019, PRD-CAT-020, PRD-CAT-021, PRD-CAT-022, PRD-CAT-023, PRD-CAT-024, PRD-CAT-025, PRD-CAT-026, PRD-CAT-027, PRD-CAT-028, PRD-CAT-029, PRD-CAT-030, PRD-CAT-031, PRD-CAT-032, PRD-CAT-033, PRD-CAT-034, PRD-CAT-035, PRD-CAT-036, PRD-CAT-037, PRD-CAT-038, PRD-CAT-039, PRD-CAT-040, PRD-CAT-041, PRD-CAT-042 | Native page + CAT tabs |
| Admin | Category schemas and schema approval | CAT | PRD-CAT-005 | New |
| Admin | Prohibited rules; listing reports and takedowns | CAT | PRD-CAT-021 | New |
| Admin | Moderation queue and decision page | CAT | PRD-CAT-022, PRD-CAT-043 | New |
| Admin | Moderation queues, steps and assignment rules | CAT | PRD-CAT-022 | New |
| Admin | Cart restriction rules; delivery windows; e-transactions notices | CHK | PRD-CHK-006, PRD-CHK-009, PRD-CHK-011 | New |
| Admin | Checkout exceptions (split placement, unsent confirmations, participant errors, unreleased reservations) | CHK | PRD-CHK-004, PRD-CHK-009 | New |
| Admin | PWA settings per store | CHN | PRD-CHN-002 | New |
| Admin | USSD and IVR menu editor | CHN | PRD-CHN-003, PRD-CHN-004 | New |
| Admin | SMS providers, log, inbound commands, opt-out keywords | CHN | PRD-CHN-005, PRD-CHN-012 | New |
| Admin | Channel accounts and templates (WhatsApp, WeChat, Telegram, push, voice) | CHN | PRD-CHN-004, PRD-CHN-006, PRD-CHN-007, PRD-CHN-008, PRD-CHN-013 | New |
| Live chat console | WhatsApp and WeChat conversations | CHN | PRD-CHN-006, PRD-CHN-007 | CRM-008 licensed plugin |
| Admin | Agent networks, members, commission rules and commissions | CHN | PRD-CHN-009 | New |
| Admin | Ticket queues and ticket view (notes, history, links, merge, escalate, call log, ready-made answers) | CRM | PRD-CRM-001, PRD-CRM-002, PRD-CRM-006, PRD-CRM-014 | Plugin pages + CRM extension |
| Admin | Complaints queue and escalation matrix | CRM | PRD-CRM-004 | New |
| Admin | Account manager assignment | CRM | PRD-CRM-015 | New |
| Admin — Configuration | Document requirements per process; validation review | DOC | PRD-DOC-005 | New |
| Admin (agency scope) | Agency users and roles; workflow per service | EGV | PRD-EGV-006, PRD-EGV-007 | New |
| Admin | Partners and partner products; consent records; referrals; invoice financing; policies and claims; partner fulfilments | FIN | PRD-FIN-001, PRD-FIN-002, PRD-FIN-003, PRD-FIN-005 | New |
| Admin | Sessions; authentication events and suspicious-login flags | IAM | PRD-IAM-006, PRD-IAM-012 | New |
| Admin | Roles and permissions; ACL | IAM | PRD-IAM-007 | Native |
| Admin | Scopes, delegations, invitations, access-review campaigns, access audit report | IAM | PRD-IAM-008, PRD-IAM-009, PRD-IAM-011 | New |
| Admin | Trade applications and companies; agents and outlets; verification review queue | IAM | PRD-IAM-020, PRD-IAM-022, PRD-IAM-023, PRD-IAM-026 | New (account synchronisation messages of IAM-019 are shown in the INT-004 message log) |
| Admin | API clients and versions (scopes, store limits, keys, change log) | INT | PRD-INT-001 | New |
| Admin | Webhook subscriptions and delivery history | INT | PRD-INT-003 | New |
| Admin | Connectors: ERP, SAGE 200, PostGlobal, banks, government, master-data sync, punch-out | INT | PRD-INT-005, PRD-INT-006, PRD-INT-007, PRD-INT-008, PRD-INT-009, PRD-INT-010, PRD-INT-012, PRD-INT-013 | New |
| Admin | Posting batches and reconciliation exceptions | INT | PRD-INT-005, PRD-INT-006 | New |
| Admin — product edit | ERP-managed field marker | INT | PRD-INT-005 | Native page extended |
| Admin | Government submissions: approval queue | INT | PRD-INT-009 | New |
| Admin | Local plugins (install, store and role limits) | INT | PRD-INT-011 | Native |
| Admin / seller portal | Product inventory section (native) with stock fields guarded by BR-INV-030 | INV | PRD-INV-001, PRD-INV-003, PRD-INV-005 | Native page, INV filter |
| Admin / seller portal | Stock by warehouse; stock history (native tab) with INV reasons; holds | INV | PRD-INV-001, PRD-INV-002, PRD-INV-004 | Native tab extended + new view |
| Admin | Warehouses with code and coordinates | INV | PRD-INV-002 | Native page extended |
| Admin | Unpaid-order list | INV | PRD-INV-004 | New |
| Admin — configuration | Fee tables; coverage areas; delivery standards; outlet extensions and closures; carriers and assignment rules; label templates and printers; proof methods; S10 series; postal-pack settings | LOG | PRD-LOG-002, PRD-LOG-003, PRD-LOG-004, PRD-LOG-005, PRD-LOG-007, PRD-LOG-012, PRD-LOG-017, PRD-LOG-020, PRD-LOG-021 | New (Configuration.ManageShippingSettings) |
| Admin — shipments | Native shipment pages with LOG filters (BR-LOG-160), proof-of-delivery panel, references | LOG | PRD-LOG-010, PRD-LOG-012, PRD-LOG-020 | Native, extended by widget zone admin_order_shipment_details_buttons |
| Admin | Topics, blog, news, polls, menus, Swiper widget | MKT | PRD-MKT-007 | Native |
| Admin | Customer attributes; segment rules | MKT | PRD-MKT-011 | Native + new |
| Admin | Order list and order page with stage, holds, interventions, snapshots | ORD | PRD-ORD-001, PRD-ORD-002, PRD-ORD-003, PRD-ORD-010 | Native pages extended |
| Admin | Stage model, reason codes, cancellation policy, service levels, numbering masks, invoice fields, Incoterms | ORD | PRD-ORD-002, PRD-ORD-003, PRD-ORD-004, PRD-ORD-007, PRD-ORD-009, PRD-ORD-011, PRD-ORD-026 | New configuration pages |
| Admin | Intervention approval queue; stage exceptions; overdue orders | ORD | PRD-ORD-002, PRD-ORD-003, PRD-ORD-011 | New |
| Admin — B2B | Requisitions, contracts and versions, repository, letters, securities, call-offs, group deals, schemes | ORD | PRD-ORD-015, PRD-ORD-016, PRD-ORD-017, PRD-ORD-018, PRD-ORD-019, PRD-ORD-020, PRD-ORD-021, PRD-ORD-022, PRD-ORD-023, PRD-ORD-024 | New |
| Admin | Payment methods and routing rules | PAY | PRD-PAY-001 | Native list extended + new rules page |
| Admin | Letters of credit; escrow stages | PAY | PRD-PAY-006, PRD-PAY-007 | New |
| Admin | Risk rules and review queue (with model score, model version and reasons where AI-006 applies) | PAY | PRD-PAY-018 | New |
| Admin | Tax reports; e-invoicing submissions | PAY | PRD-PAY-021, PRD-PAY-025 | New |
| Admin — Configuration | Packs: list, import, validate, apply runs, conflicts, deviations, applied pack set | PLT | PRD-PLT-003, PRD-PLT-005 | New |
| Admin — Configuration | Change sets: my changes, pending approvals, history, as-of view, compare, configuration-change report | PLT | PRD-PLT-004 | New |
| Admin — Configuration | Settings pages and All settings (controlled keys show a "pending change" marker) | PLT | PRD-PLT-004 | Native pages, PLT action filter |
| Admin — Configuration | Stores, languages, currencies, e-mail accounts, countries | PLT | PRD-PLT-007, PRD-PLT-008, PRD-PLT-009, PRD-PLT-010, PRD-PLT-011, PRD-PLT-013 | Native |
| Admin — Content | Help tips and guided tours | PLT | PRD-PLT-019 | New |
| Admin — Configuration | Fiscal calendar; retention rules and runs | PLT | PRD-PLT-012, PRD-PLT-020 | New |
| Admin — Configuration | Feature registry | PLT | PRD-PLT-022 | New |
| Admin | Return requests (native list) with RET status and actions; status changes checked by BR-RET-001 | RET | PRD-RET-001, PRD-RET-005 | Native page, RET filter and widget |
| Admin | Eligibility rules, shipping models, destinations, fee rules, issue types, triage rules, external bodies | RET | PRD-RET-002, PRD-RET-003, PRD-RET-006, PRD-RET-007, PRD-RET-008 | New |
| Admin | Cases queue and case view (log, evidence, decision, escalation, export) | RET | PRD-RET-007, PRD-RET-008 | New |
| Admin | Returns and disputes report | RET | PRD-RET-009 | New |
| Admin | Dashboard and native reports | RPT | PRD-RPT-001 | Native |
| Admin | Fast and slow movers and stock-level report | RPT | PRD-RPT-001 | New (RPT plugin page; data from INV-013) |
| Admin | Extract datasets, runs, manifests, data dictionary | RPT | PRD-RPT-003 | New |
| Admin | External consumers and BI connections | RPT | PRD-RPT-004, PRD-RPT-008 | New |
| Admin | Public metrics selection | RPT | PRD-RPT-007 | New |
| Admin | Security, captcha, GDPR and store-information settings | SEC | PRD-SEC-001, PRD-SEC-002, PRD-SEC-007, PRD-SEC-013 | Native |
| Admin | Country data-protection profile, processing register, transfers, impact assessments | SEC | PRD-SEC-012, PRD-SEC-006 | New |
| Admin | Audit trail search, entity history, replay, access replay, integrity verification, exports | SEC | PRD-SEC-004, PRD-SEC-010 | New |
| Admin | Auditor access grants | SEC | PRD-SEC-010 | New |
| Admin | Document review queue | SEL | PRD-SEL-002 | New |
| Admin | Tiers, types, document types, rules, KPI thresholds, staff profiles, settlement cycles | SEL | PRD-SEL-002, PRD-SEL-003, PRD-SEL-007, PRD-SEL-009, PRD-SEL-010, PRD-SEL-011, PRD-SEL-017 | New |
| Admin | Seller applications queue, application detail and decision | SEL | PRD-SEL-003, PRD-SEL-004 | New |
| Admin — vendor edit | Native vendor pages with activation gate | SEL | PRD-SEL-003 | Native page, SEL filter |
| Admin | Seller performance, onboarding funnel, diversity reports | SEL | PRD-SEL-011, PRD-SEL-021, PRD-SEL-022 | New |
| Admin | Seller rating moderation | SEL | PRD-SEL-012 | New |
| Admin | Track-and-trace search; rejected events; scan alerts; manual event entry | TRK | PRD-TRK-002 | New |
| Admin | Event dictionary, source mappings, sources, expected-scan rules; devices | TRK | PRD-TRK-002, PRD-TRK-003 | New |
| Admin | Message templates (native) and notification definitions with channel content; channel settings; preference defaults | TRK | PRD-TRK-004, PRD-TRK-005, PRD-TRK-006 | Native list extended + new pages |
| Admin — order edit | Notifications panel (widget zone admin_order_details_block) | TRK | PRD-TRK-007 | Native page, widget |
| Admin | Notification log and delivery reports | TRK | PRD-TRK-007 | New |
| Gateway (external) | Integration console, registry, developer portal, sandbox, health dashboard | INT | PRD-INT-002, PRD-INT-004 | External product |
| BI platform | Executive, operational, commerce, marketing, compliance, e-government dashboards; schedules; self-service | RPT | PRD-RPT-002, PRD-RPT-004, PRD-RPT-005, PRD-RPT-006, PRD-RPT-010, PRD-RPT-011, PRD-RPT-012 | External |
| Agent portal | Agent login, register customer, start and end acting session | IAM | PRD-IAM-026 | New (Assisted service pack) |
| Outlet counter | Code check and hand-over; holding charge; drop-off acceptance | LOG | PRD-LOG-012, PRD-LOG-017, PRD-LOG-022 | New (with PAY-034 outlet pages) |
| Outlet / agent | Payment recording on assisted orders, receipt print, shift cash-up | PAY | PRD-PAY-008, PRD-PAY-034 | New (with CHK-013 assisted checkout) |
| Seller portal | Own webhook subscriptions | INT | PRD-INT-003 | New |
| Seller portal | Delivery coverage districts; batch pick and packing lists; labels; drop-off list | LOG | PRD-LOG-004, PRD-LOG-007, PRD-LOG-009, PRD-LOG-022 | New |
| Seller portal | Payment account connection; offline payment mark-paid with proof; refunds for direct-payment orders; split amounts per order | PAY | PRD-PAY-035, PRD-PAY-036, PRD-PAY-010 | New PAY endpoints (native admin payment actions are blocked for vendors) |
| Seller portal | Return requests of own products; seller inspection; case messages | RET | PRD-RET-004, PRD-RET-010, PRD-RET-011 | New RET seller endpoints |
| Seller portal | Documents; payout accounts; terms; staff; locations and fulfilment opt-in; vacation; statements; ratings; verification and tier | SEL | PRD-SEL-002, PRD-SEL-003, PRD-SEL-004, PRD-SEL-005, PRD-SEL-006, PRD-SEL-009, PRD-SEL-017, PRD-SEL-018, PRD-SEL-019 | New (permission Marketplace.Core.SellerPortal.Access) |
| Seller portal | Resources and schedules; bookings and stages; no-shows; voucher redemption; reports | SVC | PRD-SVC-002, PRD-SVC-003, PRD-SVC-005, PRD-SVC-009, PRD-SVC-012 | New |
| Storefront | Chat widget with disclosure, sources and hand-off | AI | PRD-AI-003, PRD-AI-010 | New (widget) |
| Storefront | Category pages and navigation | CAT | PRD-CAT-001, PRD-CAT-036 | Native |
| Storefront | Product page extensions: request-a-quote button, bundle contents, 360 viewer and brochures, provenance documents, delivery promise, pickup label, returns and dispute summary, Q&A, report listing, booking slot picker, map | CAT | PRD-CAT-007, PRD-CAT-013, PRD-CAT-016, PRD-CAT-018, PRD-CAT-020, PRD-CAT-021, PRD-CAT-027, PRD-CAT-028, PRD-CAT-031 | Native page + CAT widgets / view overrides |
| Storefront | Checkout steps (address with IAM-014 default pre-selected, shipping with per-line fulfilment and IAM-015 preferred outlet, windows and estimates, payment, confirm with notices and acknowledgements) | CHK | PRD-CHK-002, PRD-CHK-005, PRD-CHK-006, PRD-CHK-009, PRD-CHK-014 | Native checkout extended |
| Storefront | Address form with landmark, name, PO box and map pin | CHK | PRD-CHK-007 | Native form extended |
| Storefront | Installable website, offline page and banner, light mode | CHN | PRD-CHN-002 | Theme/view override + plugin |
| Storefront — My account | Link Telegram; notification permission; SMS opt-in status | CHN | PRD-CHN-008, PRD-CHN-012, PRD-CHN-013 | New |
| Storefront | Ticket form; contact-us page (native); contact-the-seller page (native) | CRM | PRD-CRM-001, PRD-CRM-009 | Plugin + native |
| Storefront — My account | My tickets; ticket conversation; rating page; My feedback; account manager | CRM | PRD-CRM-001, PRD-CRM-005, PRD-CRM-011, PRD-CRM-015 | Plugin + new |
| Storefront | Help centre (knowledge-base categories, search, articles); support channel directory; chat widget; forums | CRM | PRD-CRM-007, PRD-CRM-012, PRD-CRM-008, PRD-CRM-013 | Native topics/forums + new |
| Storefront | e-Government service page (fee, documents, process, delivery options) | EGV | PRD-EGV-001 | Native product page; e-Gov template Proposed |
| Storefront | Partner services category with information, hand-off and integrated modes | FIN | PRD-FIN-005 | Native catalog pages |
| Storefront | Register (email) and Register with mobile number (code entry) | IAM | PRD-IAM-001, PRD-IAM-002, PRD-IAM-016 | Native page extended + new page |
| Storefront | Login (email and password, mobile number and code, passkey); MFA verification | IAM | PRD-IAM-001, PRD-IAM-002, PRD-IAM-004, PRD-IAM-013 | Native page extended |
| Storefront | Password recovery by email and by SMS; sensitive-account recovery | IAM | PRD-IAM-002, PRD-IAM-003 | Native page extended + new page |
| Storefront — My account | Information, addresses with default, preferences (pickup point, channel), MFA, passkeys | IAM | PRD-IAM-004, PRD-IAM-013, PRD-IAM-014, PRD-IAM-015 | Native pages extended |
| Storefront | Product page availability text; cart stock warnings (native) and hold warning | INV | PRD-INV-001, PRD-INV-004 | Native + INV message |
| Storefront | Unpaid-order reminder link to the pay-again page (PAY-011) | INV | PRD-INV-004 | PAY page |
| Storefront | Delivery step: methods, fees with breakdown, expected range; pickup point list and map with closures and full flags | LOG | PRD-LOG-001, PRD-LOG-002, PRD-LOG-003, PRD-LOG-004, PRD-LOG-005 | Native checkout step extended |
| Storefront — My account | Order: change address or instructions before dispatch; holding charge due; reschedule a failed delivery | LOG | PRD-LOG-013, PRD-LOG-017 | New |
| Storefront | Pages, blog, news, polls, menus, banners, policy pages, FAQ | MKT | PRD-MKT-007 | Native |
| Storefront — My account | Order stage, cancel with reason, accept order, partial-supply decision, re-order, invoices and consolidated receipt | ORD | PRD-ORD-002, PRD-ORD-004, PRD-ORD-006, PRD-ORD-008, PRD-ORD-009 | Native pages extended |
| Storefront — B2B | Requests for quote with custom items, quote comparison and negotiation, offers, requisition forms, contracts to sign, drawdowns, proformas | ORD | PRD-ORD-012, PRD-ORD-013, PRD-ORD-014, PRD-ORD-015, PRD-ORD-016, PRD-ORD-017, PRD-ORD-022, PRD-ORD-025 | Misc.RFQ pages extended + new |
| Storefront | Payment method selection (checkout step) | PAY | PRD-PAY-001, PRD-PAY-015, PRD-PAY-020 | Native checkout step extended |
| Storefront | Bank transfer and outlet-cash instructions with reference | PAY | PRD-PAY-005, PRD-PAY-008 | Native confirmation page extended |
| Storefront and admin | Help tips, guided tours, accessibility toggle | PLT | PRD-PLT-018, PRD-PLT-019 | New widgets |
| Storefront — order details | Return items link; Report a problem (entry owned by CRM-014) | RET | PRD-RET-001, PRD-RET-007 | Native page; CRM-014 widget |
| Storefront | Return form with eligibility, conditions, evidence upload, fees notice, policy text | RET | PRD-RET-001, PRD-RET-002, PRD-RET-006 | Native page extended (view override) |
| Storefront — My account | Return requests with RET detail, return shipment choice (pickup slot or drop-off), label download, refund breakdown | RET | PRD-RET-001, PRD-RET-003, PRD-RET-005, PRD-RET-006 | Native list extended + new detail |
| Storefront | Public transparency page | RPT | PRD-RPT-007 | New route |
| Storefront | Cookie consent banner and cookie settings page | SEC | PRD-SEC-007 | New (replaces the native cookie warning) |
| Storefront | Apply for vendor account (native form + SEL terms check and seller sign-up entry) | SEL | PRD-SEL-001, PRD-SEL-006, PRD-SEL-013 | Native page extended (widget zones applyvendor_top / applyvendor_bottom) |
| Storefront — My account | Seller application: status, checklist, documents, verification requests, appeals, onboarding content | SEL | PRD-SEL-001, PRD-SEL-002, PRD-SEL-003, PRD-SEL-008, PRD-SEL-023, PRD-SEL-024 | New |
| Storefront — My account | Rate the seller of a completed order | SEL | PRD-SEL-012 | New |
| Storefront | Vendor page and product page notices (vacation); seller rating summary | SEL | PRD-SEL-012, PRD-SEL-019 | Widget zones vendordetails_top, productdetails_top |
| Storefront — My account | Bookings (reschedule, cancel with fee preview), pay balance, service stages and sign-off, vouchers, downloads | SVC | PRD-SVC-003, PRD-SVC-004, PRD-SVC-005, PRD-SVC-007, PRD-SVC-009 | New tabs; downloads tab native |
| Storefront — My account | Orders with latest tracking status; shipment timeline; notification preferences; per-order subscribe / unsubscribe; bell and notification list | TRK | PRD-TRK-001, PRD-TRK-006, PRD-TRK-008 | Native pages extended (widget zones) + new tabs |

## 4. Open decisions that hold features in this group

| Decision | Features held in this group |
|---|---|
| WF-ENG | 10 — PRD-PLT-004, PRD-SEL-003, PRD-CAT-022, PRD-CAT-043, PRD-ORD-015, PRD-ORD-018, PRD-RET-008, PRD-CRM-004, PRD-ADM-002, PRD-ADM-006 |
| T-MISS | 5 — PRD-RET-003, PRD-CRM-004, PRD-FIN-005, PRD-EGV-001, PRD-EGV-006 |
| PAID-STUB | 3 — PRD-RPT-008, PRD-INT-001, PRD-INT-005 |
| FG-06, T-MISS | 3 — PRD-FIN-005, PRD-EGV-001, PRD-EGV-006 |
| FG-06 | 3 — PRD-FIN-005, PRD-EGV-001, PRD-EGV-006 |
| PO-REC-v8 | 2 — PRD-PAY-035, PRD-SVC-007 |
| DOC-LIB | 2 — PRD-ORD-016, PRD-ORD-020 |
| API-GW | 2 — PRD-INT-001, PRD-INT-002 |
| PO-REC-v8, PAY-DIRECT / LIC-01 | 1 — PRD-PAY-035 |
| PAY-DIRECT / LIC-01 | 1 — PRD-PAY-035 |
| WF-ENG, T-MISS | 1 — PRD-CRM-004 |
| DP-01 | 1 — PRD-SEC-006 |
| API-01, PAID-STUB, API-GW | 1 — PRD-INT-001 |
| API-01 | 1 — PRD-INT-001 |

Each is built to the PRD's Proposed option and labelled "Prototype default — decision <ID> pending"
(prototype decision P-1). A real build does not start a held feature until the decision is recorded.
