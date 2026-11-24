# Build map — Client administrators

Generated 2026-11-24T13:16:13.229Z by `scripts/build-group-map.mjs`.

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

### Wave 1 — Foundation (36 features)

| # | Feature | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-ADM-001 | Administration console | ADM | P1 | Must Have | Configuration | 12 | 2 | not built | — |
| 2 | PRD-ADM-002 | Workflow engine | ADM | P1 | Must Have | Code-level | 20 | 1 | held, prototype default | WF-ENG |
| 3 | PRD-ADM-003 | Business rules engine | ADM | P1 | Must Have | Code-level | 9 | 1 | not built | — |
| 4 | PRD-ADM-006 | Approval queues | ADM | P1 | Must Have | Code-level | 14 | 1 | held, prototype default | WF-ENG |
| 5 | PRD-IAM-001 | Customer registration and login | IAM | P1 | Must Have | Configuration | 11 | 2 | not built | — |
| 6 | PRD-IAM-002 | Mobile-number identity with OTP | IAM | P1 | Must Have | Code-level | 20 | 3 | not built | — |
| 7 | PRD-IAM-003 | Password policy, lockout and recovery | IAM | P1 | Must Have | Code-level | 10 | 1 | not built | — |
| 8 | PRD-IAM-004 | Multi-factor authentication by role | IAM | P1 | Must Have | Code-level | 10 | 2 | not built | — |
| 9 | PRD-IAM-006 | Session management | IAM | P1 | Must Have | Code-level | 7 | 1 | not built | — |
| 10 | PRD-IAM-007 | Roles and permissions | IAM | P1 | Must Have | Configuration | 13 | 1 | not built | — |
| 11 | PRD-IAM-008 | Scoped permissions | IAM | P1 | Must Have | Code-level | 8 | 1 | not built | — |
| 12 | PRD-IAM-011 | Staff invitation and access reviews | IAM | P1 | Must Have | Code-level | 7 | 1 | not built | — |
| 13 | PRD-IAM-026 | Assisted service by agents | IAM | P1 | Must Have | Code-level | 10 | 2 | not built | — |
| 14 | PRD-PLT-022 | Feature and module registry | PLT | P1 | Should Have | Code-level | 6 | 1 | built | — |
| 15 | PRD-PLT-003 | Configuration packs | PLT | P1 | Must Have | Code-level | 19 | 1 | built | — |
| 16 | PRD-PLT-004 | Settings change control | PLT | P1 | Must Have | Code-level | 17 | 2 | held, prototype default | WF-ENG |
| 17 | PRD-PLT-005 | Configuration export, import and promotion | PLT | P1 | Must Have | Code-level | 7 | 1 | not built | — |
| 18 | PRD-PLT-006 | Branding and theme | PLT | P1 | Must Have | Licensed plugin | 4 | 0 | not built | — |
| 19 | PRD-PLT-009 | Languages and language packs | PLT | P1 | Must Have | Configuration | 5 | 1 | not built | — |
| 20 | PRD-PLT-013 | Multi-store (B2B and B2C storefronts) | PLT | P1 | Must Have | Configuration | 5 | 1 | not built | — |
| 21 | PRD-PLT-020 | Data retention and archival | PLT | P1 | Must Have | Code-level | 11 | 1 | not built | — |
| 22 | PRD-SEC-001 | Encryption and transport security | SEC | P1 | Must Have | Configuration | 10 | 1 | not built | — |
| 23 | PRD-SEC-002 | Edge protection | SEC | P1 | Must Have | External system | 12 | 1 | mocked | — |
| 24 | PRD-SEC-003 | PCI-DSS scope control | SEC | P1 | Must Have | Configuration | 4 | 0 | not built | — |
| 25 | PRD-SEC-006 | Data residency | SEC | P1 | Must Have | External system | 3 | 1 | held, prototype default | DP-01 |
| 26 | PRD-SEC-012 | Country data-protection pack | SEC | P1 | Must Have | Code-level | 9 | 1 | not built | — |
| 27 | PRD-SEC-007 | Consent and privacy tools | SEC | P1 | Must Have | Configuration | 10 | 2 | not built | — |
| 28 | PRD-SEC-011 | Vulnerability management | SEC | P1 | Must Have | External system | 4 | 0 | mocked | — |
| 29 | PRD-ADM-008 | Upload and content scanning controls | ADM | P1 | Should Have | Code-level | 10 | 1 | not built | — |
| 30 | PRD-PLT-019 | Contextual help and guided tours | PLT | P1 | Should Have | Code-level | 4 | 2 | not built | — |
| 31 | PRD-SEC-013 | Bot protection | SEC | P1 | Should Have | Configuration | 5 | 1 | not built | — |
| 32 | PRD-ADM-004 | Transaction types and parameter schema | ADM | P2 | Must Have | Code-level | 6 | 1 | not built | — |
| 33 | PRD-ADM-011 | Template library | ADM | P2 | Must Have | Code-level | 6 | 1 | not built | — |
| 34 | PRD-IAM-005 | Single sign-on for staff and B2B buyers | IAM | P2 | Must Have | Code-level | 6 | 0 | not built | — |
| 35 | PRD-SEC-010 | Auditor read-only access | SEC | P2 | Must Have | Code-level | 5 | 2 | not built | — |
| 36 | PRD-ADM-012 | Template analytics and shared marketplace | ADM | P3 | Could Have | Code-level | 3 | 1 | not built | — |

### Wave 2 — Catalogue (23 features)

| # | Feature | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-CAT-001 | Category taxonomy | CAT | P1 | Must Have | Configuration | 8 | 1 | not built | — |
| 2 | PRD-CAT-002 | Product master record | CAT | P1 | Must Have | Code-level | 14 | 1 | not built | — |
| 3 | PRD-CAT-005 | Category attribute schema and listing quality rules | CAT | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 4 | PRD-CAT-016 | Product media | CAT | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 5 | PRD-CAT-021 | Listing policy enforcement | CAT | P1 | Must Have | Code-level | 9 | 3 | not built | — |
| 6 | PRD-CAT-022 | Listing lifecycle and operator approval | CAT | P1 | Must Have | Code-level | 20 | 3 | held, prototype default | WF-ENG |
| 7 | PRD-CAT-036 | Catalogue segmentation by buyer channel | CAT | P1 | Must Have | Configuration | 3 | 2 | not built | — |
| 8 | PRD-CAT-043 | Seller listing moderation | CAT | P1 | Must Have | Code-level | 5 | 1 | held, prototype default | WF-ENG |
| 9 | PRD-INV-001 | Stock tracking | INV | P1 | Must Have | Configuration | 10 | 3 | not built | — |
| 10 | PRD-INV-002 | Multi-warehouse stock | INV | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 11 | PRD-INV-004 | Stock reservation and hold | INV | P1 | Must Have | Code-level | 20 | 4 | not built | — |
| 12 | PRD-SEL-001 | Seller application and profile | SEL | P1 | Must Have | Configuration | 6 | 2 | not built | — |
| 13 | PRD-SEL-002 | Seller KYC documents | SEL | P1 | Must Have | Code-level | 10 | 4 | not built | — |
| 14 | PRD-SEL-003 | Seller verification workflow and tiers | SEL | P1 | Must Have | Code-level | 15 | 5 | held, prototype default | WF-ENG |
| 15 | PRD-SEL-007 | Marketplace rules and listing eligibility | SEL | P1 | Must Have | Code-level | 7 | 1 | not built | — |
| 16 | PRD-SRC-019 | Search result eligibility | SRC | P1 | Must Have | Code-level | 7 | 0 | not built | — |
| 17 | PRD-SEL-011 | Seller performance monitoring | SEL | P1 | Should Have | Code-level | 6 | 2 | not built | — |
| 18 | PRD-SEL-012 | Seller ratings | SEL | P1 | Should Have | Code-level | 5 | 3 | not built | — |
| 19 | PRD-SEL-021 | Seller onboarding funnel report | SEL | P1 | Should Have | Code-level | 2 | 1 | not built | — |
| 20 | PRD-SEL-009 | Seller staff accounts | SEL | P1 | Could Have | Code-level | 5 | 2 | not built | — |
| 21 | PRD-SEL-023 | Seller training content | SEL | P1 | Could Have | Configuration | 3 | 1 | not built | — |
| 22 | PRD-SEL-010 | Seller categorisation | SEL | P2 | Must Have | Code-level | 2 | 1 | not built | — |
| 23 | PRD-CAT-025 | Stale listing detection | CAT | P2 | Should Have | Code-level | 3 | 1 | not built | — |

### Wave 3 — Buy (23 features)

| # | Feature | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-CHK-002 | Checkout | CHK | P1 | Must Have | Configuration | 10 | 1 | built | — |
| 2 | PRD-CHK-009 | E-transactions consumer controls | CHK | P1 | Must Have | Code-level | 6 | 3 | not built | — |
| 3 | PRD-ORD-002 | Configurable order status model | ORD | P1 | Must Have | Code-level | 15 | 4 | built | — |
| 4 | PRD-ORD-003 | Order interventions with reason codes and audit | ORD | P1 | Must Have | Code-level | 7 | 3 | not built | — |
| 5 | PRD-ORD-015 | Configurable requisition workflows | ORD | P1 | Must Have | Code-level | 5 | 2 | held, prototype default | WF-ENG |
| 6 | PRD-ORD-016 | Contract drafting | ORD | P1 | Must Have | Code-level | 5 | 2 | held, prototype default | DOC-LIB |
| 7 | PRD-PAY-001 | Payment method framework and routing | PAY | P1 | Must Have | Code-level | 10 | 2 | not built | — |
| 8 | PRD-PAY-006 | Letters of credit | PAY | P1 | Must Have | Code-level | 5 | 1 | not built | — |
| 9 | PRD-PAY-024 | Payment connector SDK | PAY | P1 | Must Have | Code-level | 7 | 0 | not built | — |
| 10 | PRD-PAY-008 | Cash on delivery and cash at outlet | PAY | P1 | Must Have | Code-level | 7 | 2 | not built | — |
| 11 | PRD-PAY-021 | Tax on fees and tax reporting | PAY | P1 | Must Have | Code-level | 3 | 1 | not built | — |
| 12 | PRD-CHK-007 | Structured address capture | CHK | P1 | Should Have | Code-level | 6 | 1 | not built | — |
| 13 | PRD-CHK-011 | Cart restriction rules | CHK | P1 | Should Have | Code-level | 6 | 1 | not built | — |
| 14 | PRD-ORD-004 | Cancellation rules | ORD | P1 | Should Have | Code-level | 8 | 2 | not built | — |
| 15 | PRD-ORD-011 | Cut-offs and service levels | ORD | P1 | Should Have | Code-level | 5 | 2 | not built | — |
| 16 | PRD-PAY-018 | Payment and order risk controls | PAY | P1 | Should Have | Code-level | 11 | 1 | not built | — |
| 17 | PRD-CHK-006 | Delivery slot and instructions | CHK | P1 | Could Have | Code-level | 10 | 2 | not built | — |
| 18 | PRD-ORD-007 | Order numbering | ORD | P1 | Could Have | Code-level | 5 | 1 | built | — |
| 19 | PRD-ORD-018 | Contract amendments | ORD | P2 | Must Have | Code-level | 4 | 1 | held, prototype default | WF-ENG |
| 20 | PRD-ORD-020 | Award and acceptance letters | ORD | P2 | Must Have | Code-level | 3 | 1 | held, prototype default | DOC-LIB |
| 21 | PRD-ORD-023 | Group buying | ORD | P2 | Must Have | Code-level | 4 | 1 | not built | — |
| 22 | PRD-ORD-027 | Sample orders | ORD | P2 | Should Have | Code-level | 2 | 0 | not built | — |
| 23 | PRD-PAY-035 | Direct payment to the seller | PAY | P2 | Should Have | Code-level | 5 | 1 | held, prototype default | PO-REC-v8, PAY-DIRECT / LIC-01 / PO-REC-v8 / PAY-DIRECT / LIC-01 |

### Wave 4 — Fulfil (21 features)

| # | Feature | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-LOG-001 | Shipping methods and rates | LOG | P1 | Must Have | Configuration | 7 | 1 | not built | — |
| 2 | PRD-LOG-002 | Delivery fee rule engine | LOG | P1 | Must Have | Code-level | 13 | 2 | not built | — |
| 3 | PRD-LOG-004 | Serviceability rules | LOG | P1 | Must Have | Code-level | 8 | 3 | not built | — |
| 4 | PRD-LOG-005 | Estimated delivery time engine | LOG | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 5 | PRD-LOG-012 | Proof of delivery record | LOG | P1 | Must Have | Code-level | 10 | 3 | built | — |
| 6 | PRD-RET-001 | Return requests | RET | P1 | Must Have | Configuration | 12 | 4 | not built | — |
| 7 | PRD-RET-002 | Return eligibility rules | RET | P1 | Must Have | Code-level | 7 | 2 | not built | — |
| 8 | PRD-RET-003 | Return logistics | RET | P1 | Must Have | Code-level | 8 | 2 | held, prototype default | T-MISS |
| 9 | PRD-RET-008 | Dispute SLAs and escalation | RET | P1 | Must Have | Code-level | 8 | 2 | held, prototype default | WF-ENG |
| 10 | PRD-TRK-004 | Email notifications and templates | TRK | P1 | Must Have | Code-level | 6 | 1 | not built | — |
| 11 | PRD-TRK-005 | Notification engine (multi-channel) | TRK | P1 | Must Have | Code-level | 17 | 1 | not built | — |
| 12 | PRD-TRK-006 | Notification preferences | TRK | P1 | Must Have | Code-level | 16 | 2 | not built | — |
| 13 | PRD-TRK-007 | Notification delivery tracking and audit | TRK | P1 | Must Have | Code-level | 7 | 2 | not built | — |
| 14 | PRD-LOG-003 | Pickup points and outlets | LOG | P1 | Should Have | Code-level | 9 | 2 | not built | — |
| 15 | PRD-RET-009 | Case retention and reports | RET | P1 | Should Have | Code-level | 3 | 1 | not built | — |
| 16 | PRD-RET-010 | Seller return review | RET | P1 | Should Have | Code-level | 6 | 1 | not built | — |
| 17 | PRD-TRK-002 | Tracking event hub | TRK | P1 | Should Have | Code-level | 15 | 2 | not built | — |
| 18 | PRD-LOG-015 | Address validation and geocoding | LOG | P1 | Could Have | Code-level | 5 | 0 | not built | — |
| 19 | PRD-LOG-017 | Holding charges and pre-dispatch changes | LOG | P1 | Could Have | Code-level | 8 | 3 | not built | — |
| 20 | PRD-RET-006 | Return fees | RET | P1 | Could Have | Code-level | 6 | 3 | not built | — |
| 21 | PRD-DOC-005 | Document requirements and validation | DOC | P2 | Must Have | External system | 6 | 1 | mocked | — |

### Wave 5 — Engage and run (12 features)

| # | Feature | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-CRM-001 | Help desk ticketing | CRM | P1 | Must Have | Licensed plugin | 16 | 3 | not built | — |
| 2 | PRD-CRM-004 | Complaints process | CRM | P1 | Must Have | Code-level | 7 | 1 | held, prototype default | WF-ENG, T-MISS / WF-ENG / T-MISS |
| 3 | PRD-MKT-007 | Content management | MKT | P1 | Must Have | Configuration | 10 | 2 | not built | — |
| 4 | PRD-RPT-001 | Standard reports and dashboard | RPT | P1 | Must Have | Code-level | 11 | 2 | not built | — |
| 5 | PRD-RPT-003 | Data warehouse and ETL | RPT | P1 | Must Have | External system | 9 | 1 | mocked | — |
| 6 | PRD-RPT-004 | Report delivery and self-service | RPT | P1 | Must Have | External system | 7 | 2 | mocked | — |
| 7 | PRD-RPT-005 | Report access control | RPT | P1 | Must Have | External system | 5 | 1 | mocked | — |
| 8 | PRD-MKT-011 | Customer segmentation attributes | MKT | P1 | Could Have | Code-level | 5 | 1 | not built | — |
| 9 | PRD-RPT-008 | External BI connectivity | RPT | P2 | Must Have | Licensed plugin | 4 | 1 | held, prototype default | PAID-STUB |
| 10 | PRD-CRM-015 | B2B account management | CRM | P2 | Should Have | Code-level | 5 | 2 | not built | — |
| 11 | PRD-RPT-007 | Public transparency dashboard | RPT | P3 | Should Have | Code-level | 3 | 2 | not built | — |
| 12 | PRD-CRM-013 | Community forums | CRM | P3 | Could Have | Configuration | 3 | 1 | not built | — |

### Wave 6 — Reach (17 features)

| # | Feature | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-AI-010 | AI governance | AI | P1 | Must Have | External system | 7 | 2 | mocked | — |
| 2 | PRD-CHN-005 | SMS gateway and SMS commands | CHN | P1 | Must Have | Code-level | 11 | 1 | not built | — |
| 3 | PRD-CHN-006 | WhatsApp Business | CHN | P1 | Must Have | Code-level | 8 | 2 | not built | — |
| 4 | PRD-CHN-007 | WeChat | CHN | P1 | Must Have | Code-level | 3 | 2 | not built | — |
| 5 | PRD-INT-001 | Public REST API | INT | P1 | Must Have | Code-level | 20 | 1 | held, prototype default | API-01, PAID-STUB, API-GW / API-01 / PAID-STUB / API-GW |
| 6 | PRD-INT-002 | Integration layer (API gateway) | INT | P1 | Must Have | External system | 14 | 1 | held, prototype default | API-GW |
| 7 | PRD-INT-003 | Webhooks and events | INT | P1 | Must Have | Code-level | 14 | 2 | not built | — |
| 8 | PRD-INT-005 | ERP and finance connector framework | INT | P1 | Must Have | Code-level | 12 | 3 | held, prototype default | PAID-STUB |
| 9 | PRD-INT-011 | Plugin extensibility | INT | P1 | Must Have | Configuration | 6 | 1 | not built | — |
| 10 | PRD-AI-003 | AI chatbot | AI | P1 | Should Have | Code-level | 11 | 2 | not built | — |
| 11 | PRD-CHN-002 | PWA and low-bandwidth mode | CHN | P1 | Should Have | Code-level | 9 | 2 | not built | — |
| 12 | PRD-CHN-003 | USSD channel | CHN | P1 | Should Have | External system | 8 | 1 | mocked | — |
| 13 | PRD-INT-009 | Government system connector framework | INT | P1 | Should Have | Code-level | 5 | 2 | not built | — |
| 14 | PRD-INT-010 | Master data synchronisation | INT | P1 | Should Have | Code-level | 6 | 1 | not built | — |
| 15 | PRD-CHN-009 | Agent and correspondent networks | CHN | P2 | Must Have | Code-level | 6 | 1 | not built | — |
| 16 | PRD-CHN-012 | SMS sender ID and opt-out | CHN | P2 | Should Have | Code-level | 6 | 2 | not built | — |
| 17 | PRD-INT-012 | Punch-out | INT | P3 | Should Have | Configuration | 7 | 1 | not built | — |

### Wave 7 — Verticals (5 features)

| # | Feature | Name | Module | Phase | Priority | Implementation | ACs | Screens | State | Held by |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PRD-EGV-001 | e-Government service catalogue | EGV | P1 | Must Have | Configuration | 9 | 1 | held, prototype default | FG-06, T-MISS / FG-06 / T-MISS |
| 2 | PRD-EGV-006 | Agency administration | EGV | P1 | Should Have | Code-level | 6 | 1 | held, prototype default | FG-06, T-MISS / FG-06 / T-MISS |
| 3 | PRD-FIN-005 | Financial and partner services catalogue | FIN | P1 | Could Have | Code-level | 8 | 2 | held, prototype default | FG-06, T-MISS / FG-06 / T-MISS |
| 4 | PRD-SVC-002 | Service providers and resources | SVC | P2 | Must Have | Code-level | 8 | 1 | not built | — |
| 5 | PRD-SVC-007 | Digital products and downloads | SVC | P2 | Should Have | Configuration | 8 | 1 | held, prototype default | PO-REC-v8 |

## 3. Screens these features own

| Surface | Screen | Module | Features | Native or new |
|---|---|---|---|---|
| Admin | Native admin areas: settings, plugins, widgets, schedule tasks, log, maintenance, products (bulk edit), customers | ADM | ADM-001 | Native |
| Admin — System | Product extension register and start-up check | ADM | ADM-001 | New |
| Admin — Configuration | Workflow designer, simulator, versions; case list and replay | ADM | ADM-002 | New |
| Admin — Configuration | Rule sets, rule editor, pattern library, test harness, evaluation log | ADM | ADM-003 | New |
| Admin — Configuration | Transaction types, parameter schemas, chains | ADM | ADM-004 | New |
| Admin — Operations | Approval queue and item page; chain and reason-code configuration; moderation queues | ADM | ADM-006 | New |
| Admin — Configuration | Upload policy | ADM | ADM-008 | New settings page |
| Admin — Configuration | Template library, versions, analytics, shared library; configuration workspace | ADM | ADM-011, ADM-012 | New |
| Admin | Chatbot settings, conversations and unanswered questions | AI | AI-003 | New |
| Admin | AI use register and AI use log | AI | AI-010 | New |
| Admin (staff and vendors) | Product edit: listing state panel, submit, versions and compare, audit tab, trade fields, regulatory fields and certificates, service details, slots, location, fixed currency prices, quantity rules | CAT | CAT-002, CAT-003, CAT-004, CAT-005, CAT-006, CAT-007, CAT-008, CAT-009, CAT-010, CAT-011, CAT-012, CAT-013, CAT-014, CAT-015, CAT-016, CAT-017, CAT-018, CAT-019, CAT-020, CAT-021, CAT-022, CAT-023, CAT-024, CAT-025, CAT-026, CAT-027, CAT-028, CAT-029, CAT-030, CAT-031, CAT-032, CAT-033, CAT-034, CAT-035, CAT-036, CAT-037, CAT-038, CAT-039, CAT-040, CAT-041, CAT-042 | Native page + CAT tabs |
| Admin | Category schemas and schema approval | CAT | CAT-005 | New |
| Admin | Prohibited rules; listing reports and takedowns | CAT | CAT-021 | New |
| Admin | Moderation queue and decision page | CAT | CAT-022, CAT-043 | New |
| Admin | Moderation queues, steps and assignment rules | CAT | CAT-022 | New |
| Admin | Cart restriction rules; delivery windows; e-transactions notices | CHK | CHK-006, CHK-009, CHK-011 | New |
| Admin | Checkout exceptions (split placement, unsent confirmations, participant errors, unreleased reservations) | CHK | CHK-004, CHK-009 | New |
| Admin | PWA settings per store | CHN | CHN-002 | New |
| Admin | USSD and IVR menu editor | CHN | CHN-003, CHN-004 | New |
| Admin | SMS providers, log, inbound commands, opt-out keywords | CHN | CHN-005, CHN-012 | New |
| Admin | Channel accounts and templates (WhatsApp, WeChat, Telegram, push, voice) | CHN | CHN-004, CHN-006, CHN-007, CHN-008, CHN-013 | New |
| Live chat console | WhatsApp and WeChat conversations | CHN | CHN-006, CHN-007 | CRM-008 licensed plugin |
| Admin | Agent networks, members, commission rules and commissions | CHN | CHN-009 | New |
| Admin | Ticket queues and ticket view (notes, history, links, merge, escalate, call log, ready-made answers) | CRM | CRM-001, CRM-002, CRM-006, CRM-014 | Plugin pages + CRM extension |
| Admin | Complaints queue and escalation matrix | CRM | CRM-004 | New |
| Admin | Account manager assignment | CRM | CRM-015 | New |
| Admin — Configuration | Document requirements per process; validation review | DOC | DOC-005 | New |
| Admin (agency scope) | Agency users and roles; workflow per service | EGV | EGV-006, EGV-007 | New |
| Admin | Partners and partner products; consent records; referrals; invoice financing; policies and claims; partner fulfilments | FIN | FIN-001, FIN-002, FIN-003, FIN-005 | New |
| Admin | Sessions; authentication events and suspicious-login flags | IAM | IAM-006, IAM-012 | New |
| Admin | Roles and permissions; ACL | IAM | IAM-007 | Native |
| Admin | Scopes, delegations, invitations, access-review campaigns, access audit report | IAM | IAM-008, IAM-009, IAM-011 | New |
| Admin | Trade applications and companies; agents and outlets; verification review queue | IAM | IAM-020, IAM-022, IAM-023, IAM-026 | New (account synchronisation messages of IAM-019 are shown in the INT-004 message log) |
| Admin | API clients and versions (scopes, store limits, keys, change log) | INT | INT-001 | New |
| Admin | Webhook subscriptions and delivery history | INT | INT-003 | New |
| Admin | Connectors: ERP, SAGE 200, PostGlobal, banks, government, master-data sync, punch-out | INT | INT-005, INT-006, INT-007, INT-008, INT-009, INT-010, INT-012, INT-013 | New |
| Admin | Posting batches and reconciliation exceptions | INT | INT-005, INT-006 | New |
| Admin — product edit | ERP-managed field marker | INT | INT-005 | Native page extended |
| Admin | Government submissions: approval queue | INT | INT-009 | New |
| Admin | Local plugins (install, store and role limits) | INT | INT-011 | Native |
| Admin / seller portal | Product inventory section (native) with stock fields guarded by BR-INV-030 | INV | INV-001, INV-003, INV-005 | Native page, INV filter |
| Admin / seller portal | Stock by warehouse; stock history (native tab) with INV reasons; holds | INV | INV-001, INV-002, INV-004 | Native tab extended + new view |
| Admin | Warehouses with code and coordinates | INV | INV-002 | Native page extended |
| Admin | Unpaid-order list | INV | INV-004 | New |
| Admin — configuration | Fee tables; coverage areas; delivery standards; outlet extensions and closures; carriers and assignment rules; label templates and printers; proof methods; S10 series; postal-pack settings | LOG | LOG-002, LOG-003, LOG-004, LOG-005, LOG-007, LOG-012, LOG-017, LOG-020, LOG-021 | New (Configuration.ManageShippingSettings) |
| Admin — shipments | Native shipment pages with LOG filters (BR-LOG-160), proof-of-delivery panel, references | LOG | LOG-010, LOG-012, LOG-020 | Native, extended by widget zone admin_order_shipment_details_buttons |
| Admin | Topics, blog, news, polls, menus, Swiper widget | MKT | MKT-007 | Native |
| Admin | Customer attributes; segment rules | MKT | MKT-011 | Native + new |
| Admin | Order list and order page with stage, holds, interventions, snapshots | ORD | ORD-001, ORD-002, ORD-003, ORD-010 | Native pages extended |
| Admin | Stage model, reason codes, cancellation policy, service levels, numbering masks, invoice fields, Incoterms | ORD | ORD-002, ORD-003, ORD-004, ORD-007, ORD-009, ORD-011, ORD-026 | New configuration pages |
| Admin | Intervention approval queue; stage exceptions; overdue orders | ORD | ORD-002, ORD-003, ORD-011 | New |
| Admin — B2B | Requisitions, contracts and versions, repository, letters, securities, call-offs, group deals, schemes | ORD | ORD-015, ORD-016, ORD-017, ORD-018, ORD-019, ORD-020, ORD-021, ORD-022, ORD-023, ORD-024 | New |
| Admin | Payment methods and routing rules | PAY | PAY-001 | Native list extended + new rules page |
| Admin | Letters of credit; escrow stages | PAY | PAY-006, PAY-007 | New |
| Admin | Risk rules and review queue (with model score, model version and reasons where AI-006 applies) | PAY | PAY-018 | New |
| Admin | Tax reports; e-invoicing submissions | PAY | PAY-021, PAY-025 | New |
| Admin — Configuration | Packs: list, import, validate, apply runs, conflicts, deviations, applied pack set | PLT | PLT-003, PLT-005 | New |
| Admin — Configuration | Change sets: my changes, pending approvals, history, as-of view, compare, configuration-change report | PLT | PLT-004 | New |
| Admin — Configuration | Settings pages and All settings (controlled keys show a "pending change" marker) | PLT | PLT-004 | Native pages, PLT action filter |
| Admin — Configuration | Stores, languages, currencies, e-mail accounts, countries | PLT | PLT-007, PLT-008, PLT-009, PLT-010, PLT-011, PLT-013 | Native |
| Admin — Content | Help tips and guided tours | PLT | PLT-019 | New |
| Admin — Configuration | Fiscal calendar; retention rules and runs | PLT | PLT-012, PLT-020 | New |
| Admin — Configuration | Feature registry | PLT | PLT-022 | New |
| Admin | Return requests (native list) with RET status and actions; status changes checked by BR-RET-001 | RET | RET-001, RET-005 | Native page, RET filter and widget |
| Admin | Eligibility rules, shipping models, destinations, fee rules, issue types, triage rules, external bodies | RET | RET-002, RET-003, RET-006, RET-007, RET-008 | New |
| Admin | Cases queue and case view (log, evidence, decision, escalation, export) | RET | RET-007, RET-008 | New |
| Admin | Returns and disputes report | RET | RET-009 | New |
| Admin | Dashboard and native reports | RPT | RPT-001 | Native |
| Admin | Fast and slow movers and stock-level report | RPT | RPT-001 | New (RPT plugin page; data from INV-013) |
| Admin | Extract datasets, runs, manifests, data dictionary | RPT | RPT-003 | New |
| Admin | External consumers and BI connections | RPT | RPT-004, RPT-008 | New |
| Admin | Public metrics selection | RPT | RPT-007 | New |
| Admin | Security, captcha, GDPR and store-information settings | SEC | SEC-001, SEC-002, SEC-007, SEC-013 | Native |
| Admin | Country data-protection profile, processing register, transfers, impact assessments | SEC | SEC-012, SEC-006 | New |
| Admin | Audit trail search, entity history, replay, access replay, integrity verification, exports | SEC | SEC-004, SEC-010 | New |
| Admin | Auditor access grants | SEC | SEC-010 | New |
| Admin | Document review queue | SEL | SEL-002 | New |
| Admin | Tiers, types, document types, rules, KPI thresholds, staff profiles, settlement cycles | SEL | SEL-002, SEL-003, SEL-007, SEL-009, SEL-010, SEL-011, SEL-017 | New |
| Admin | Seller applications queue, application detail and decision | SEL | SEL-003, SEL-004 | New |
| Admin — vendor edit | Native vendor pages with activation gate | SEL | SEL-003 | Native page, SEL filter |
| Admin | Seller performance, onboarding funnel, diversity reports | SEL | SEL-011, SEL-021, SEL-022 | New |
| Admin | Seller rating moderation | SEL | SEL-012 | New |
| Admin | Track-and-trace search; rejected events; scan alerts; manual event entry | TRK | TRK-002 | New |
| Admin | Event dictionary, source mappings, sources, expected-scan rules; devices | TRK | TRK-002, TRK-003 | New |
| Admin | Message templates (native) and notification definitions with channel content; channel settings; preference defaults | TRK | TRK-004, TRK-005, TRK-006 | Native list extended + new pages |
| Admin — order edit | Notifications panel (widget zone admin_order_details_block) | TRK | TRK-007 | Native page, widget |
| Admin | Notification log and delivery reports | TRK | TRK-007 | New |
| Gateway (external) | Integration console, registry, developer portal, sandbox, health dashboard | INT | INT-002, INT-004 | External product |
| BI platform | Executive, operational, commerce, marketing, compliance, e-government dashboards; schedules; self-service | RPT | RPT-002, RPT-004, RPT-005, RPT-006, RPT-010, RPT-011, RPT-012 | External |
| Agent portal | Agent login, register customer, start and end acting session | IAM | IAM-026 | New (Assisted service pack) |
| Outlet counter | Code check and hand-over; holding charge; drop-off acceptance | LOG | LOG-012, LOG-017, LOG-022 | New (with PAY-034 outlet pages) |
| Outlet / agent | Payment recording on assisted orders, receipt print, shift cash-up | PAY | PAY-008, PAY-034 | New (with CHK-013 assisted checkout) |
| Seller portal | Own webhook subscriptions | INT | INT-003 | New |
| Seller portal | Delivery coverage districts; batch pick and packing lists; labels; drop-off list | LOG | LOG-004, LOG-007, LOG-009, LOG-022 | New |
| Seller portal | Payment account connection; offline payment mark-paid with proof; refunds for direct-payment orders; split amounts per order | PAY | PAY-035, PAY-036, PAY-010 | New PAY endpoints (native admin payment actions are blocked for vendors) |
| Seller portal | Return requests of own products; seller inspection; case messages | RET | RET-004, RET-010, RET-011 | New RET seller endpoints |
| Seller portal | Documents; payout accounts; terms; staff; locations and fulfilment opt-in; vacation; statements; ratings; verification and tier | SEL | SEL-002, SEL-003, SEL-004, SEL-005, SEL-006, SEL-009, SEL-017, SEL-018, SEL-019 | New (permission Marketplace.Core.SellerPortal.Access) |
| Seller portal | Resources and schedules; bookings and stages; no-shows; voucher redemption; reports | SVC | SVC-002, SVC-003, SVC-005, SVC-009, SVC-012 | New |
| Storefront | Chat widget with disclosure, sources and hand-off | AI | AI-003, AI-010 | New (widget) |
| Storefront | Category pages and navigation | CAT | CAT-001, CAT-036 | Native |
| Storefront | Product page extensions: request-a-quote button, bundle contents, 360 viewer and brochures, provenance documents, delivery promise, pickup label, returns and dispute summary, Q&A, report listing, booking slot picker, map | CAT | CAT-007, CAT-013, CAT-016, CAT-018, CAT-020, CAT-021, CAT-027, CAT-028, CAT-031 | Native page + CAT widgets / view overrides |
| Storefront | Checkout steps (address with IAM-014 default pre-selected, shipping with per-line fulfilment and IAM-015 preferred outlet, windows and estimates, payment, confirm with notices and acknowledgements) | CHK | CHK-002, CHK-005, CHK-006, CHK-009, CHK-014 | Native checkout extended |
| Storefront | Address form with landmark, name, PO box and map pin | CHK | CHK-007 | Native form extended |
| Storefront | Installable website, offline page and banner, light mode | CHN | CHN-002 | Theme/view override + plugin |
| Storefront — My account | Link Telegram; notification permission; SMS opt-in status | CHN | CHN-008, CHN-012, CHN-013 | New |
| Storefront | Ticket form; contact-us page (native); contact-the-seller page (native) | CRM | CRM-001, CRM-009 | Plugin + native |
| Storefront — My account | My tickets; ticket conversation; rating page; My feedback; account manager | CRM | CRM-001, CRM-005, CRM-011, CRM-015 | Plugin + new |
| Storefront | Help centre (knowledge-base categories, search, articles); support channel directory; chat widget; forums | CRM | CRM-007, CRM-012, CRM-008, CRM-013 | Native topics/forums + new |
| Storefront | e-Government service page (fee, documents, process, delivery options) | EGV | EGV-001 | Native product page; e-Gov template Proposed |
| Storefront | Partner services category with information, hand-off and integrated modes | FIN | FIN-005 | Native catalog pages |
| Storefront | Register (email) and Register with mobile number (code entry) | IAM | IAM-001, IAM-002, IAM-016 | Native page extended + new page |
| Storefront | Login (email and password, mobile number and code, passkey); MFA verification | IAM | IAM-001, IAM-002, IAM-004, IAM-013 | Native page extended |
| Storefront | Password recovery by email and by SMS; sensitive-account recovery | IAM | IAM-002, IAM-003 | Native page extended + new page |
| Storefront — My account | Information, addresses with default, preferences (pickup point, channel), MFA, passkeys | IAM | IAM-004, IAM-013, IAM-014, IAM-015 | Native pages extended |
| Storefront | Product page availability text; cart stock warnings (native) and hold warning | INV | INV-001, INV-004 | Native + INV message |
| Storefront | Unpaid-order reminder link to the pay-again page (PAY-011) | INV | INV-004 | PAY page |
| Storefront | Delivery step: methods, fees with breakdown, expected range; pickup point list and map with closures and full flags | LOG | LOG-001, LOG-002, LOG-003, LOG-004, LOG-005 | Native checkout step extended |
| Storefront — My account | Order: change address or instructions before dispatch; holding charge due; reschedule a failed delivery | LOG | LOG-013, LOG-017 | New |
| Storefront | Pages, blog, news, polls, menus, banners, policy pages, FAQ | MKT | MKT-007 | Native |
| Storefront — My account | Order stage, cancel with reason, accept order, partial-supply decision, re-order, invoices and consolidated receipt | ORD | ORD-002, ORD-004, ORD-006, ORD-008, ORD-009 | Native pages extended |
| Storefront — B2B | Requests for quote with custom items, quote comparison and negotiation, offers, requisition forms, contracts to sign, drawdowns, proformas | ORD | ORD-012, ORD-013, ORD-014, ORD-015, ORD-016, ORD-017, ORD-022, ORD-025 | Misc.RFQ pages extended + new |
| Storefront | Payment method selection (checkout step) | PAY | PAY-001, PAY-015, PAY-020 | Native checkout step extended |
| Storefront | Bank transfer and outlet-cash instructions with reference | PAY | PAY-005, PAY-008 | Native confirmation page extended |
| Storefront and admin | Help tips, guided tours, accessibility toggle | PLT | PLT-018, PLT-019 | New widgets |
| Storefront — order details | Return items link; Report a problem (entry owned by CRM-014) | RET | RET-001, RET-007 | Native page; CRM-014 widget |
| Storefront | Return form with eligibility, conditions, evidence upload, fees notice, policy text | RET | RET-001, RET-002, RET-006 | Native page extended (view override) |
| Storefront — My account | Return requests with RET detail, return shipment choice (pickup slot or drop-off), label download, refund breakdown | RET | RET-001, RET-003, RET-005, RET-006 | Native list extended + new detail |
| Storefront | Public transparency page | RPT | RPT-007 | New route |
| Storefront | Cookie consent banner and cookie settings page | SEC | SEC-007 | New (replaces the native cookie warning) |
| Storefront | Apply for vendor account (native form + SEL terms check and seller sign-up entry) | SEL | SEL-001, SEL-006, SEL-013 | Native page extended (widget zones applyvendor_top / applyvendor_bottom) |
| Storefront — My account | Seller application: status, checklist, documents, verification requests, appeals, onboarding content | SEL | SEL-001, SEL-002, SEL-003, SEL-008, SEL-023, SEL-024 | New |
| Storefront — My account | Rate the seller of a completed order | SEL | SEL-012 | New |
| Storefront | Vendor page and product page notices (vacation); seller rating summary | SEL | SEL-012, SEL-019 | Widget zones vendordetails_top, productdetails_top |
| Storefront — My account | Bookings (reschedule, cancel with fee preview), pay balance, service stages and sign-off, vouchers, downloads | SVC | SVC-003, SVC-004, SVC-005, SVC-007, SVC-009 | New tabs; downloads tab native |
| Storefront — My account | Orders with latest tracking status; shipment timeline; notification preferences; per-order subscribe / unsubscribe; bell and notification list | TRK | TRK-001, TRK-006, TRK-008 | Native pages extended (widget zones) + new tabs |

## 4. Open decisions that hold features in this group

| Decision | Features held in this group |
|---|---|
| WF-ENG | 10 — PLT-004, SEL-003, CAT-022, CAT-043, ORD-015, ORD-018, RET-008, CRM-004, ADM-002, ADM-006 |
| T-MISS | 5 — RET-003, CRM-004, FIN-005, EGV-001, EGV-006 |
| PAID-STUB | 3 — RPT-008, INT-001, INT-005 |
| FG-06, T-MISS | 3 — FIN-005, EGV-001, EGV-006 |
| FG-06 | 3 — FIN-005, EGV-001, EGV-006 |
| PO-REC-v8 | 2 — PAY-035, SVC-007 |
| DOC-LIB | 2 — ORD-016, ORD-020 |
| API-GW | 2 — INT-001, INT-002 |
| PO-REC-v8, PAY-DIRECT / LIC-01 | 1 — PAY-035 |
| PAY-DIRECT / LIC-01 | 1 — PAY-035 |
| WF-ENG, T-MISS | 1 — CRM-004 |
| DP-01 | 1 — SEC-006 |
| API-01, PAID-STUB, API-GW | 1 — INT-001 |
| API-01 | 1 — INT-001 |

Each is built to the PRD's Proposed option and labelled "Prototype default — decision <ID> pending"
(prototype decision P-1). A real build does not start a held feature until the decision is recorded.
