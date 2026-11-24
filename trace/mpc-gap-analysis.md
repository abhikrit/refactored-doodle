# Malawi Post — is anything missing from the product?

Generated 2026-11-24T14:15:50.085Z by `scripts/build-mpc-gaps.mjs`.

Sources: `docs/client/MPC-Lot1-FR-Catalogue.md` (the client's Lot 1 annex, FR-001…FR-350) and
`docs/compliance/Compliance-Traceability.md` (the requirement → feature mapping and the
compliance status of each requirement).

## Answer

**No Malawi Post requirement is without a product feature.** All 350 Lot 1 functional
requirements map to at least one of the 434 features. 37 Malawi Post requirements carry no
feature at all, and 37 of those are project services - hardware, hosting, training,
reports - which are delivered by the project, not by the product (L1 section 3.2).
None of them is a product requirement left uncovered.

What is missing is narrower and in three kinds.

| Kind | Count | What to do |
|---|---|---|
| A product requirement with no feature | 0 | add a feature |
| A feature that covers only part of the requirement | 2 | widen the feature's scope, or add one |
| A requirement with no measurable target in the client's own source | 5 | ask the client for the number; no code decides this |
| Covered, but held by an open decision | 77 | record the decision; the feature cannot start until then |

## 1. Scope gaps — a stated behaviour the mapped feature does not cover (2)

These are the only places where the product needs to grow for Malawi Post. Each is a behaviour the
requirement states and the mapped feature does not. Widening the existing feature keeps the PRD ID
space intact; adding a new `PRD-<AREA>-nnn` forks it from the PRD set, so the roadmap revision
should say which was chosen.

| Req | Actor | Priority | Requirement | Mapped to | What is not covered |
|---|---|---|---|---|---|
| FR-085 | Buyer | Could | The Platform shall provide product comparison functionality for selected attributes within a category. | PRD-SRC-013 | comparison covered (SRC-013); restriction "within a category" is not in the 5.00 fit and not specified |
| FR-313 | Admin | Should | The Platform shall support configuration of content pages, banners, Customer service charter and announcements (CMS) with publish/unpublish and approval workflow. | PRD-MKT-007, PRD-MKT-008 | pages, announcements and charter covered (MKT-007, MKT-008); banner (Swiper slide) publish / unpublish and approval not covered |

## 2. Missing measurable targets — the client's specification, not the product (5)

These read as gaps but no feature closes them: the requirement states a quality with no number.
They need a figure from Malawi Post, recorded as a setting with no hidden default (CLAUDE.md).

The split between this section and the one above follows the wording of the compliance note:
"not covered" means the feature falls short, "not stated in source" means the client has not said
what the behaviour should be. **FR-323 sits on that line**: SEL-013 does carry Allow entries, but
what an Allow entry does beyond suppressing Watch flags is not stated, so no one can build it
either way until Malawi Post says. Treat it as a question to the client, not as a feature to add.

| Req | Requirement | Mapped to | What is not stated |
|---|---|---|---|
| FR-019 | The Platform shall provide accessibility features suitable for low-bandwidth and low-end devices (lightweight web/app experience). | PRD-CHN-002 | light pages and installable website covered (CHN-002); measurable page-weight / load target not stated (NFR-X-006) |
| FR-323 | The Platform shall provide administrative tools for managing blacklists/whitelists (users, sellers, IPs, devices) with audit trail. | PRD-SEL-013 | block and watch lists covered (SEL-013); the effect of whitelist (Allow) entries beyond suppressing Watch flags is not stated in source |
| REQ-MPC-CHT-001 | Chatbot with machine-learning capability for basic help and guidance. | PRD-AI-003 | "machine-learning capability" undefined (MG-11); a language model answering from approved content is Proposed (AI-003) |
| REQ-MPC-UX-001 | User-friendly platform and ordering system. | PRD-CHK-002, PRD-PLT-017, PRD-SRC-006 | ordering on every device covered (PLT-017, SRC-006, CHK-002); "user-friendly" has no measurable criterion in source |
| REQ-MPC-UX-003 | Runs smoothly on mobile web browsers. | PRD-PLT-017 | mobile-browser operation covered (PLT-017); "smoothly" has no measurable target in source (NFR-X-006) |

## 3. Covered but blocked

### 3.1 Every delivering feature is held by an open decision (77)

The requirement is mapped, but no part of it can be started until the decision is recorded (P-1).
This is the largest single risk to a Malawi Post build.

| Decision | Requirements blocked | Of which Must |
|---|---|---|
| WF-ENG | 28 | 14 |
| FG-06 | 22 | 13 |
| PAID-STUB | 19 | 5 |
| T-MISS | 17 | 12 |
| API-GW | 11 | 3 |
| FG-06, T-MISS | 8 | 5 |
| PAY-DIRECT / LIC-01 | 5 | 3 |
| FG-06, WF-ENG, T-MISS | 4 | 3 |
| WF-ENG, PAY-DIRECT / LIC-01 | 3 | 2 |
| API-01, PAID-STUB, API-GW | 3 | 1 |
| API-01 | 3 | 1 |
| FG-06, PAID-STUB | 3 | 2 |
| DOC-LIB | 2 | 1 |
| WF-ENG, T-MISS | 2 | 1 |
| FG-06, PAY-DIRECT / LIC-01, WAL-01 | 1 | 0 |
| WAL-01 | 1 | 0 |

Must-priority requirements blocked this way:

| Req | Actor | Requirement | Feature | Held by |
|---|---|---|---|---|
| FR-028 | Admin | The Platform shall provide a workflow for verification and approval of Seller profiles with status states (Submitted, Under Review, Approved, Rejected, Suspended). | PRD-SEL-003 | WF-ENG |
| FR-031 | Seller/SME | The Platform shall allow a Seller to register one or more payout accounts (mobile money and/or bank) for settlement. | PRD-SEL-005 | WF-ENG |
| FR-042 | Seller/SME | The Platform shall allow a Seller to view and download monthly settlement statements for payouts. | PRD-SEL-017 | WF-ENG, PAY-DIRECT / LIC-01 / WF-ENG / PAY-DIRECT / LIC-01 |
| FR-058 | Admin | The Platform shall support an Admin moderation workflow for product listings (approve, reject, request changes) with reasons. | PRD-CAT-043 | WF-ENG |
| FR-089 | Buyer | The Platform shall support search for e-government services and display a structured service catalogue (fees, required documents, delivery options). | PRD-EGV-001 | FG-06, T-MISS / FG-06 / T-MISS |
| FR-099 | Admin | The Platform shall provide a taxonomy governance workflow (propose new categories, approve, deprecate) with audit trail. | PRD-SRC-016 | WF-ENG |
| FR-110 | Buyer | The Platform shall support split checkout for items from multiple sellers and generate separate fulfilment tasks per seller while presenting a unified checkout experience. | PRD-CHK-004 | WF-ENG, PAY-DIRECT / LIC-01 / WF-ENG / PAY-DIRECT / LIC-01 |
| FR-133 | System | The Platform shall support split payments and fee splitting among stakeholders (seller payout, MPC logistics fee, platform commission) as per configured rules. | PRD-PAY-010 | PAY-DIRECT / LIC-01 |
| FR-146 | System | The Platform shall provide integration hooks for government fee collection and remittance workflows for e-government services. | PRD-EGV-005 | FG-06, T-MISS / FG-06 / T-MISS |
| FR-171 | Buyer | The Platform shall provide a digital invoice that includes seller identity, MPC service fees, and tax components as configured. | PRD-ORD-009 | DOC-LIB |
| FR-176 | System | The Platform shall integrate with a logistics management module to create fulfilment tasks for pickup, sorting, dispatch, and delivery/collection. | PRD-LOG-011 | FG-06 |
| FR-178 | MPC Ops | The Platform shall support drop-off processing at post offices/agencies, including scanning and acceptance of parcels for delivery. | PRD-LOG-022 | FG-06 |
| FR-187 | System | The Platform shall support proof-of-delivery capture, including time, location, recipient acknowledgement method, and media attachment where applicable. | PRD-LOG-032 | FG-06, PAID-STUB / FG-06 / PAID-STUB |
| FR-189 | System | The Platform shall support reverse logistics workflows for returns, including return pickup/drop-off and routing back to seller/warehouse. | PRD-RET-003 | T-MISS |
| FR-192 | MPC Ops | The Platform shall support hub-and-spoke sorting operations with scanning events at each handover point. | PRD-LOG-023 | FG-06 |
| FR-204 | MPC Ops | The Platform shall provide scanning interfaces for recording track-and-trace events at pickup, hub, and delivery points. | PRD-TRK-003 | FG-06 |
| FR-228 | Admin | The Platform shall support configurable return shipping models (merchant-paid, customer-paid, shared, MPC-subsidized) based on Table 10 and policy configuration. | PRD-RET-003 | T-MISS |
| FR-229 | System | The Platform shall create a return logistics task (pickup or drop-off) when a return is approved and provide a return tracking reference. | PRD-RET-003 | T-MISS |
| FR-231 | Admin | The Platform shall provide an escalation path for unresolved return disputes, including routing to MPC dispute resolution process. | PRD-RET-007 | WF-ENG |
| FR-235 | Customer Support | The Platform shall provide a case management view for returns and disputes with status, parties, evidence, and decision logging. | PRD-RET-007 | WF-ENG |
| FR-239 | System | The Platform shall provide evidence capture for delivered items (proof of delivery) and link it to dispute cases. | PRD-RET-007 | WF-ENG |
| FR-246 | System | The Platform shall provide return labels and/or return instructions for buyers depending on chosen return shipping model. | PRD-RET-003 | T-MISS |
| FR-269 | Buyer | The Platform shall provide a standardized complaint submission process aligned to Complaints & ADR Policy referenced in feasibility study. | PRD-CRM-004 | WF-ENG, T-MISS / WF-ENG / T-MISS |
| FR-276 | Admin | The Platform shall provide dashboards for key KPIs including registrations, active buyers/sellers, GMV, orders, and conversion rates. | PRD-RPT-002 | PAID-STUB |
| FR-278 | Admin | The Platform shall provide payments reports (payment success rate, method mix, reconciliation exceptions, refunds) by payment method. | PRD-RPT-010 | PAID-STUB |
| FR-281 | Admin | The Platform shall provide e-government service usage reports (service requests, payments collected, fulfilment status) by agency and service type. | PRD-RPT-012 | FG-06, PAID-STUB / FG-06 / PAID-STUB |
| FR-307 | Admin | The Platform shall support configuration and management of e-government service catalogue entries (service definitions, fees, required documents, workflows). | PRD-ADM-002, PRD-EGV-001, PRD-EGV-002, PRD-EGV-006 | WF-ENG / FG-06, T-MISS / FG-06 / T-MISS / FG-06, WF-ENG, T-MISS |
| FR-314 | Admin | The Platform shall provide an integration configuration console to manage API endpoints, credentials (securely), and integration health status for connected systems. | PRD-INT-002 | API-GW |
| FR-318 | Admin | The Platform shall provide audit logs for all administrative configuration changes including actor, timestamp, old/new values. | PRD-PLT-004 | WF-ENG |
| FR-326 | System | The Platform shall implement an Integration Layer using API management/gateway to securely expose and consume APIs for internal and external systems. | PRD-INT-002 | API-GW |
| FR-331 | System | The Platform shall provide an integration mechanism for government e-service fee collection and remittance reporting per agency requirements. | PRD-EGV-005 | FG-06, T-MISS / FG-06 / T-MISS |
| FR-332 | Govt Service User | The Platform shall provide a user-facing workflow to request priority e-government services identified in Table 13, including application submission, fee payment, and status tracking. | PRD-EGV-002 | FG-06, WF-ENG, T-MISS / FG-06 / WF-ENG / T-MISS |
| FR-333 | System | The Platform shall support document upload, validation, and secure storage for e-government service applications. | PRD-EGV-002 | FG-06, WF-ENG, T-MISS / FG-06 / WF-ENG / T-MISS |
| FR-335 | System | The Platform shall support physical delivery/collection options for e-government outputs (documents) via MPC delivery network, including tracking. | PRD-EGV-004 | FG-06, T-MISS / FG-06 / T-MISS |
| FR-338 | System | The Platform shall implement secure authentication and authorization for APIs (e.g., OAuth2/OpenID Connect or equivalent) as supported by the selected API gateway. | PRD-INT-001, PRD-INT-002 | API-01, PAID-STUB, API-GW / API-01 / PAID-STUB / API-GW |

### 3.2 Status of the 350 Lot 1 requirements

| Compliance status | Requirements |
|---|---|
| Compliant | 298 |
| Compliant subject to decision | 32 |
| Compliant subject to client content | 16 |
| Partially compliant | 4 |

Subject to decision: 32. Subject to client content: 16. Both are covered by a
feature; neither is a hole in the product.

## 4. The build set

The product mapping diagram's **Client administrators** group holds 137 features. Malawi Post's
own annex gives the **Admin** actor 87 requirements, which need 80 features. The two cuts
are not the same, so the set to build is the union - nothing from the 137 is dropped, and what
Malawi Post's Admin needs on top is added.

| Set | Features |
|---|---|
| Client administrators user group | 137 |
| Features the MPC Admin actor needs | 80 |
| In both | 48 |
| Only in the user group | 89 |
| Only required by Malawi Post | 32 |
| **Union - the build set** | **169** |

| Measure | Value |
|---|---|
| Acceptance criteria | 1380 |
| Phase | P1 147 · P2 18 · P3 4 |
| Priority | Could Have 13 · Must Have 119 · Should Have 37 |
| Held by an open decision | 34 |
| By wave | 1: 39 · 2: 33 · 3: 28 · 4: 23 · 5: 22 · 6: 17 · 7: 7 |

### Only required by Malawi Post, not in the user group (32)

| Feature ID | Roadmap row | Name | Module | Phase | Priority | Wave | Required by |
|---|---|---|---|---|---|---|---|
| PRD-CAT-033 | 124 | Promoted listings with fees | CAT | P1 | Should Have | 2 | FR-070 |
| PRD-CAT-034 | 125 | Catalogue analytics | CAT | P1 | Should Have | 2 | FR-066 |
| PRD-CHK-010 | 193 | Minimum order and fee thresholds | CHK | P1 | Could Have | 3 | FR-122 |
| PRD-CRM-003 | 342 | Agent 360° view | CRM | P1 | Must Have | 5 | FR-263 |
| PRD-CRM-007 | 346 | Knowledge base | CRM | P1 | Should Have | 5 | FR-273 |
| PRD-CRM-014 | 353 | Issue routing and escalation | CRM | P1 | Must Have | 5 | FR-259 |
| PRD-EGV-002 | 486 | Service applications | EGV | P1 | Must Have | 7 | FR-307 |
| PRD-IAM-010 | 43 | User administration console | IAM | P1 | Must Have | 1 | FR-024 |
| PRD-MKT-001 | 358 | Discounts and coupons | MKT | P1 | Must Have | 5 | FR-062 |
| PRD-MKT-008 | 365 | Content approval and policy versioning | MKT | P1 | Must Have | 5 | FR-306, FR-313 |
| PRD-ORD-001 | 245 | Order management console | ORD | P1 | Must Have | 3 | FR-156, FR-174 |
| PRD-PAY-015 | 220 | Payment fees | PAY | P1 | Should Have | 3 | FR-139, FR-304 |
| PRD-PAY-016 | 221 | Refunds | PAY | P1 | Must Have | 3 | FR-245 |
| PRD-PAY-019 | 224 | Payments operations console | PAY | P1 | Must Have | 3 | FR-144 |
| PRD-PLT-014 | 17 | Instance health and SLA monitoring | PLT | P1 | Should Have | 1 | FR-290, FR-299 |
| PRD-RET-007 | 332 | Dispute and issue cases | RET | P1 | Must Have | 4 | FR-231 |
| PRD-RPT-002 | 376 | KPI framework and executive dashboards | RPT | P1 | Must Have | 5 | FR-276, FR-288, FR-296 |
| PRD-RPT-006 | 380 | Compliance and audit reports | RPT | P1 | Must Have | 5 | FR-292 |
| PRD-RPT-010 | 384 | Operational dashboards | RPT | P1 | Must Have | 5 | FR-277, FR-278, FR-279, FR-280 |
| PRD-RPT-011 | 385 | Commerce and marketing analytics | RPT | P1 | Must Have | 5 | FR-294 |
| PRD-RPT-012 | 386 | e-Government and engagement reports | RPT | P1 | Must Have | 5 | FR-281 |
| PRD-SEC-004 | 417 | Platform audit trail | SEC | P1 | Must Have | 1 | FR-039, FR-320 |
| PRD-SEL-005 | 68 | Payout accounts and verification | SEL | P1 | Must Have | 2 | FR-039 |
| PRD-SEL-013 | 76 | Block and watch lists | SEL | P1 | Must Have | 2 | FR-323 |
| PRD-SEL-016 | 79 | Commission and fee rules | SEL | P1 | Must Have | 2 | FR-043, FR-303 |
| PRD-SEL-024 | 87 | Seller blacklisting | SEL | P1 | Must Have | 2 | FR-041 |
| PRD-SRC-007 | 160 | Merchandising widgets and landing pages | SRC | P1 | Must Have | 2 | FR-082, FR-094 |
| PRD-SRC-014 | 167 | Search engine: relevance, synonyms, multilingual | SRC | P1 | Must Have | 2 | FR-090 |
| PRD-SRC-016 | 169 | Taxonomy governance | SRC | P1 | Must Have | 2 | FR-099, FR-309 |
| PRD-SRC-017 | 170 | Seller badges and featured sellers | SRC | P1 | Should Have | 2 | FR-082 |
| PRD-SVC-011 | 505 | Service-level targets for service orders | SVC | P1 | Should Have | 7 | FR-165, FR-311 |
| PRD-TRK-009 | 319 | Proactive outreach and outage notices | TRK | P1 | Could Have | 4 | FR-267 |
