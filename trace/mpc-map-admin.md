# Malawi Post requirement map — actor "Admin"

Generated 2026-11-24T13:52:48.796Z by `scripts/build-mpc-map.mjs`.

Source: `docs/client/MPC-Lot1-FR-Catalogue.md`, the client's own annex
(MPC Requirements Catalogue Annex, Deliverable 2 — Lot 1, FR-001…FR-350). The FR numbering is the
same as `REQ-MPC-FR-nnn` in the compliance report, which is where the requirement → feature
mapping comes from.

## 1. Profile

| Measure | Value |
|---|---|
| Requirements with actor "Admin" | 87 of 350 |
| Client priority | Should 38 · Must 32 · Could 17 |
| Distinct product features needed | 80 |
| Of those, inside the "Client administrators" user group | 48 |
| **Outside it** | **32** |
| Client acceptance criteria stated | 174 |

### By the client's own domain

| Domain | Requirements |
|---|---|
| Administration & Configuration | 25 |
| Reporting & Analytics | 15 |
| Seller/SME Onboarding & Verification | 10 |
| Product Catalog Management | 6 |
| Returns, Refunds & Dispute Resolution | 6 |
| User & Access Management | 5 |
| Customer Service & CRM | 5 |
| Search & Discovery | 4 |
| Order Management | 4 |
| Payments & Reconciliation | 2 |
| Tracking & Notifications | 2 |
| Cart & Checkout | 1 |
| Logistics & Fulfilment | 1 |
| Integrations & e-Government Services | 1 |

### Bidder response already given to the client

| Response | Requirements |
|---|---|
| Customisation required | 63 |
| Available | 10 |
| Partially available, customisation required | 10 |
| Available, customisation required | 4 |

## 2. Features this actor needs that the user group does not contain (32)

A build led by the user group would miss these. They are needed by at least one "Admin"
requirement, but the Client-PRD "Who uses it" list for those features does not name the group.

| Feature ID | Roadmap row | Name | Module | Phase | Priority | Wave | State | Required by |
|---|---|---|---|---|---|---|---|---|
| PRD-CAT-033 | 124 | Promoted listings with fees | CAT | P1 | Should Have | 2 | not-built | FR-070 |
| PRD-CAT-034 | 125 | Catalogue analytics | CAT | P1 | Should Have | 2 | held-default | FR-066 |
| PRD-CHK-010 | 193 | Minimum order and fee thresholds | CHK | P1 | Could Have | 3 | not-built | FR-122 |
| PRD-CRM-003 | 342 | Agent 360° view | CRM | P1 | Must Have | 5 | not-built | FR-263 |
| PRD-CRM-007 | 346 | Knowledge base | CRM | P1 | Should Have | 5 | not-built | FR-273 |
| PRD-CRM-014 | 353 | Issue routing and escalation | CRM | P1 | Must Have | 5 | not-built | FR-259 |
| PRD-EGV-002 | 486 | Service applications | EGV | P1 | Must Have | 7 | held-default | FR-307 |
| PRD-IAM-010 | 43 | User administration console | IAM | P1 | Must Have | 1 | not-built | FR-024 |
| PRD-MKT-001 | 358 | Discounts and coupons | MKT | P1 | Must Have | 5 | not-built | FR-062 |
| PRD-MKT-008 | 365 | Content approval and policy versioning | MKT | P1 | Must Have | 5 | held-default | FR-306, FR-313 |
| PRD-ORD-001 | 245 | Order management console | ORD | P1 | Must Have | 3 | not-built | FR-156, FR-174 |
| PRD-PAY-015 | 220 | Payment fees | PAY | P1 | Should Have | 3 | not-built | FR-139, FR-304 |
| PRD-PAY-016 | 221 | Refunds | PAY | P1 | Must Have | 3 | not-built | FR-245 |
| PRD-PAY-019 | 224 | Payments operations console | PAY | P1 | Must Have | 3 | not-built | FR-144 |
| PRD-PLT-014 | 17 | Instance health and SLA monitoring | PLT | P1 | Should Have | 1 | mocked | FR-290, FR-299 |
| PRD-RET-007 | 332 | Dispute and issue cases | RET | P1 | Must Have | 4 | held-default | FR-231 |
| PRD-RPT-002 | 376 | KPI framework and executive dashboards | RPT | P1 | Must Have | 5 | held-default | FR-276, FR-288, FR-296 |
| PRD-RPT-006 | 380 | Compliance and audit reports | RPT | P1 | Must Have | 5 | mocked | FR-292 |
| PRD-RPT-010 | 384 | Operational dashboards | RPT | P1 | Must Have | 5 | held-default | FR-277, FR-278, FR-279, FR-280 |
| PRD-RPT-011 | 385 | Commerce and marketing analytics | RPT | P1 | Must Have | 5 | held-default | FR-294 |
| PRD-RPT-012 | 386 | e-Government and engagement reports | RPT | P1 | Must Have | 5 | held-default | FR-281 |
| PRD-SEC-004 | 417 | Platform audit trail | SEC | P1 | Must Have | 1 | built | FR-039, FR-320 |
| PRD-SEL-005 | 68 | Payout accounts and verification | SEL | P1 | Must Have | 2 | held-default | FR-039 |
| PRD-SEL-013 | 76 | Block and watch lists | SEL | P1 | Must Have | 2 | not-built | FR-323 |
| PRD-SEL-016 | 79 | Commission and fee rules | SEL | P1 | Must Have | 2 | not-built | FR-043, FR-303 |
| PRD-SEL-024 | 87 | Seller blacklisting | SEL | P1 | Must Have | 2 | not-built | FR-041 |
| PRD-SRC-007 | 160 | Merchandising widgets and landing pages | SRC | P1 | Must Have | 2 | not-built | FR-082, FR-094 |
| PRD-SRC-014 | 167 | Search engine: relevance, synonyms, multilingual | SRC | P1 | Must Have | 2 | held-default | FR-090 |
| PRD-SRC-016 | 169 | Taxonomy governance | SRC | P1 | Must Have | 2 | held-default | FR-099, FR-309 |
| PRD-SRC-017 | 170 | Seller badges and featured sellers | SRC | P1 | Should Have | 2 | not-built | FR-082 |
| PRD-SVC-011 | 505 | Service-level targets for service orders | SVC | P1 | Should Have | 7 | not-built | FR-165, FR-311 |
| PRD-TRK-009 | 319 | Proactive outreach and outage notices | TRK | P1 | Could Have | 4 | not-built | FR-267 |

## 3. Every requirement, with the features that deliver it

Ordered by the client's priority, then by requirement number. "Client AC" is the client's own
acceptance criteria — what a demo is judged against. They are not the product's AC-<AREA>-nnn and
do not replace them; a feature is still only built when its own ACs pass (P-6).

| Req | Priority | Domain | Shall statement | Client AC | Bidder response | Features |
|---|---|---|---|---|---|---|
| FR-011 | Must | User & Access Management | The Platform shall implement role-based access control (RBAC) for administrative and operational users. | 1. System has defined roles (e.g., Admin, Customer Support, Operations) and role assignment is auditable. 2. Unauthorized role attempts are blocked. | Available | PRD-IAM-007 |
| FR-012 | Must | User & Access Management | The Platform shall support MFA for privileged administrative roles. | 1. MFA can be enabled per role/user. 2. When enabled, system blocks access unless MFA challenge is completed. | Customisation required | PRD-IAM-004 |
| FR-021 | Must | User & Access Management | The Platform shall provide configurable account security policies (password policy, lockout thresholds, MFA enforcement) aligned to MPC security program. | 1. Admin can configure security policy parameters. 2. Policy changes are applied to new sessions/users without code changes. | Customisation required | PRD-IAM-003, PRD-IAM-004 |
| FR-024 | Must | User & Access Management | The Platform shall provide a user administration console to search, view, and manage user accounts with full audit logging. | 1. Admin can search users by name, mobile number, or email. 2. All admin actions are logged with user, timestamp, and reason code. | Available | PRD-IAM-010 |
| FR-028 | Must | Seller/SME Onboarding & Verification | The Platform shall provide a workflow for verification and approval of Seller profiles with status states (Submitted, Under Review, Approved, Rejected, Suspended). | 1. Admin can change seller status with mandatory reason code. 2. Seller sees current status and reasons for rejection/suspension. | Customisation required | PRD-SEL-003 |
| FR-033 | Must | Seller/SME Onboarding & Verification | The Platform shall enforce Seller listing eligibility rules before allowing product publication. | 1. Seller cannot publish products unless status is Approved. 2. Suspended seller products are automatically unpublished. | Partially available, customisation required | PRD-SEL-007 |
| FR-043 | Must | Seller/SME Onboarding & Verification | The Platform shall support configurable Seller commission and fee rules by category/service (e.g., listing type, logistics services). | 1. Admin can configure commission/fee tables and effective dates. 2. Orders apply correct fee rule based on category/service. | Partially available, customisation required | PRD-SEL-016 |
| FR-046 | Must | Seller/SME Onboarding & Verification | The Platform shall allow Admin to configure and publish marketplace rules for Sellers (prohibited products, listing standards, delivery SLAs) and enforce them. | 1. Rules are accessible to Sellers in-platform. 2. Enforcement actions (takedowns, suspensions) are logged and traceable. | Partially available, customisation required | PRD-ORD-011, PRD-SEL-007, PRD-SEL-011 |
| FR-058 | Must | Product Catalog Management | The Platform shall support an Admin moderation workflow for product listings (approve, reject, request changes) with reasons. | 1. Admin can approve/reject listing with reason. 2. Seller receives notification and can resubmit. | Available, customisation required | PRD-CAT-043 |
| FR-059 | Must | Product Catalog Management | The Platform shall allow Admin to define prohibited product categories/items and enforce automated checks where feasible. | 1. Admin can configure prohibited rules. 2. System blocks publication of prohibited listings and logs the event. | Available, customisation required | PRD-CAT-021 |
| FR-073 | Must | Product Catalog Management | The Platform shall support product takedown requests and evidence capture for regulatory or policy compliance. | 1. Admin can disable a product and record reason/evidence attachments. 2. Takedown action is reflected on site immediately and logged. | Partially available, customisation required | PRD-CAT-021 |
| FR-094 | Must | Search & Discovery | The Platform shall support dynamic category landing pages for campaigns with configurable layout components. | 1. Admin can create a landing page with components (banner, categories, product blocks). 2. Landing page can be published/unpublished without code change. | Partially available, customisation required | PRD-SRC-007 |
| FR-099 | Must | Search & Discovery | The Platform shall provide a taxonomy governance workflow (propose new categories, approve, deprecate) with audit trail. | 1. Proposed changes require approval by authorized role. 2. All taxonomy changes are logged and versioned. | Available, customisation required | PRD-SRC-016 |
| FR-144 | Must | Payments & Reconciliation | The Platform shall provide a payments operations console for authorized users to view transaction logs, exceptions, and manual interventions with audit trail. | 1. Authorized user can search payments by order ID/reference and view statuses. 2. Manual actions require reason codes and are logged. | Customisation required | PRD-PAY-019 |
| FR-156 | Must | Order Management | The Platform shall provide an admin console for order search and intervention, with all interventions requiring reason codes and audit logs. | 1. Admin can search orders by order ID, buyer, seller, or tracking reference. 2. Interventions are logged with user, time, and reason. | Customisation required | PRD-ORD-001, PRD-ORD-003 |
| FR-228 | Must | Returns, Refunds & Dispute Resolution | The Platform shall support configurable return shipping models (merchant-paid, customer-paid, shared, MPC-subsidized) based on Table 10 and policy configuration. | 1. Admin can configure return shipping model per category/seller/policy. 2. Return workflow calculates and displays who pays return shipping and how it is collected. | Customisation required | PRD-RET-003 |
| FR-231 | Must | Returns, Refunds & Dispute Resolution | The Platform shall provide an escalation path for unresolved return disputes, including routing to MPC dispute resolution process. | 1. Support/Admin can escalate a dispute case and assign it to a resolver. 2. Escalation decisions are logged and visible in case history. | Customisation required | PRD-RET-007 |
| FR-237 | Must | Returns, Refunds & Dispute Resolution | The Platform shall enforce return eligibility rules per product category and seller policy (e.g., non-returnable items). | 1. Non-returnable items are blocked from return initiation. 2. Eligibility rules are configurable and logged. | Customisation required | PRD-RET-002 |
| FR-263 | Must | Customer Service & CRM | The Platform shall support role-based permissions for support agents to restrict access to sensitive personal data. | 1. Support roles have configurable field-level visibility. 2. Unauthorized access attempts are blocked and logged. | Customisation required | PRD-CRM-003 |
| FR-276 | Must | Reporting & Analytics | The Platform shall provide dashboards for key KPIs including registrations, active buyers/sellers, GMV, orders, and conversion rates. | 1. Dashboard shows KPI values for selectable date ranges. 2. KPIs can be filtered by location/service /User where data exists. | Available | PRD-RPT-002 |
| FR-278 | Must | Reporting & Analytics | The Platform shall provide payments reports (payment success rate, method mix, reconciliation exceptions, refunds) by payment method. | 1. Report shows success/failure counts and values by method. 2. Exception list can be downloaded for investigation. | Customisation required | PRD-RPT-010 |
| FR-281 | Must | Reporting & Analytics | The Platform shall provide e-government service usage reports (service requests, payments collected, fulfilment status) by agency and service type. | 1. Report can be filtered by agency and service type. 2. Report includes counts, amounts, and fulfilment statuses. | Customisation required | PRD-RPT-012 |
| FR-298 | Must | Reporting & Analytics | The Platform shall provide user management and access audit reports (role assignments, privileged accounts, MFA status). | 1. Report lists privileged accounts and MFA status. 2. Report is exportable and includes last login timestamp. | Customisation required | PRD-IAM-011 |
| FR-301 | Must | Administration & Configuration | The Platform shall provide an administrative console for system configuration and governance functions. | 1. Admin console is accessible only to authorized roles. 2. Admin console provides configuration modules for key platform settings. | Customisation required | PRD-ADM-001 |
| FR-302 | Must | Administration & Configuration | The Platform shall support configuration of user roles and permissions (RBAC) including creation of custom roles. | 1. Admin can create a role and assign permissions. 2. Role assignment changes take effect for users. | Available | PRD-IAM-007 |
| FR-303 | Must | Administration & Configuration | The Platform shall support configuration of marketplace commission rates, fees,Taxes and effective dates without code changes. | 1. Admin can configure commission rate, Tax rate by category and effective date. 2. Orders apply correct commission and fees. | Customisation required | PRD-PAY-021, PRD-SEL-016 |
| FR-305 | Must | Administration & Configuration | The Platform shall support configuration of payment methods availability and routing per service type and {Location rular and urban }geography. | 1. Admin can enable/disable payment methods. 2. Disabled methods do not appear in checkout. | Customisation required | PRD-PAY-001 |
| FR-306 | Must | Administration & Configuration | The Platform shall support configuration of policy documents and legal notices (Privacy, Terms, Returns, Complaints) with version control. | 1. Admin can upload and publish policy documents with version. 2. System records which version each user accepted. | Customisation required | PRD-MKT-007, PRD-MKT-008 |
| FR-307 | Must | Administration & Configuration | The Platform shall support configuration and management of e-government service catalogue entries (service definitions, fees, required documents, workflows). | 1. Admin can create/edit/publish an eGov service entry. 2. Service entry appears in user-facing catalogue. | Customisation required | PRD-ADM-002, PRD-EGV-001, PRD-EGV-002, PRD-EGV-006 |
| FR-309 | Must | Administration & Configuration | The Platform shall support configuration of product categories, attributes, and required listing fields with governance workflow. | 1. Admin can add category/attribute and require it for a category. 2. Changes are versioned and auditable. | Customisation required | PRD-CAT-005, PRD-SRC-016 |
| FR-314 | Must | Administration & Configuration | The Platform shall provide an integration configuration console to manage API endpoints, credentials (securely), and integration health status for connected systems. | 1. Admin can view list of integrations and current status. 2. Credentials are stored securely and not displayed in plain text. | Customisation required | PRD-INT-002 |
| FR-318 | Must | Administration & Configuration | The Platform shall provide audit logs for all administrative configuration changes including actor, timestamp, old/new values. | 1. Audit log entries exist for each configuration change. 2. Audit logs are exportable and tamper-evident. | Customisation required | PRD-PLT-004 |
| FR-013 | Should | User & Access Management | The Platform shall enforce configurable session timeout and idle logout for authenticated users. | 1. Admin can configure session timeout value. 2. When idle time exceeds configured value, system logs the user out. | Available | PRD-IAM-006 |
| FR-029 | Should | Seller/SME Onboarding & Verification | The Platform shall support risk-based Seller verification (e.g., tiered verification levels) configurable by Admin. | 1. Admin can define verification tiers and associated limits/controls. 2. Seller tier is displayed and enforced in workflows. | Customisation required | PRD-SEL-003 |
| FR-036 | Should | Seller/SME Onboarding & Verification | The Platform shall allow Admin to configure required Seller profile fields and documents without code changes. | 1. Admin can add/edit required fields in configuration. 2. Changes reflect in Seller onboarding forms. | Available, customisation required | PRD-SEL-002 |
| FR-037 | Should | Seller/SME Onboarding & Verification | The Platform shall provide a Seller performance monitoring view (orders fulfilled, cancellation rate, return rate, complaints) with configurable thresholds for interventions. | 1. Admin can view KPIs by seller and time range. 2. Admin can configure threshold alerts and view triggered alerts. | Customisation required | PRD-SEL-011 |
| FR-039 | Should | Seller/SME Onboarding & Verification | The Platform shall provide an approval workflow for high-risk actions (e.g., payout account changes) with audit trail. | 1. High-risk action triggers approval workflow. 2. Audit trail records approver, timestamp, and decision. | Partially available, customisation required | PRD-ADM-006, PRD-SEC-004, PRD-SEL-005 |
| FR-041 | Should | Seller/SME Onboarding & Verification | The Platform shall support blacklisting and watchlist controls for Sellers with fraud/abuse history. | 1. Admin can add seller to blacklist/watchlist with reason code. 2. System enforces restrictions for blacklisted sellers. | Partially available, customisation required | PRD-SEL-024 |
| FR-048 | Should | Seller/SME Onboarding & Verification | The Platform shall provide reporting on Seller onboarding funnel (registered, submitted, approved, rejected) and cycle time. | 1. Report shows counts by status and average time to approve. 2. Report can be exported to CSV/PDF. | Partially available, customisation required | PRD-SEL-021 |
| FR-062 | Should | Product Catalog Management | The Platform shall support platform-level promotions (sitewide campaigns, category campaigns) managed by Admin. | 1. Admin can create campaigns and define eligibility rules. 2. Eligible products show campaign pricing/badges. | Available | PRD-MKT-001 |
| FR-066 | Should | Product Catalog Management | The Platform shall provide catalog analytics for Admin (active listings, categories, out-of-stock rate, listing rejection reasons). | 1. Admin can view analytics dashboards. 2. Dashboard data is filterable by date range and category. | Available | PRD-CAT-034 |
| FR-082 | Should | Search & Discovery | The Platform shall allow Admin to configure featured placements (homepage banners, featured sellers, featured categories) with start/end dates. | 1. Admin can publish a banner/featured placement with schedule. 2. Featured placement expires automatically at end date. | Partially available, customisation required | PRD-SRC-007, PRD-SRC-017 |
| FR-090 | Should | Search & Discovery | The Platform shall provide configurable search relevance tuning (boosting by category, featured status, location) with audit of changes. | 1. Admin can change boosting rules and changes are logged. 2. Search results reflect updated boosting rules. | Partially available, customisation required | PRD-SRC-014 |
| FR-139 | Should | Payments & Reconciliation | The Platform shall provide configuration for payment fees (provider fees, platform fees) and support versioned fee schedules. | 1. Admin can configure fee schedules with effective dates. 2. Order totals reflect correct fee schedule. | Customisation required | PRD-PAY-015 |
| FR-165 | Should | Order Management | The Platform shall allow configuration of order cut-off times and fulfilment SLAs per service level. | 1. Admin can configure cut-off times and SLAs. 2. System enforces cut-off times and flags SLA breaches. | Customisation required | PRD-ORD-011, PRD-SVC-011 |
| FR-174 | Should | Order Management | The Platform shall provide an order export function for authorized users with filters (date, status, seller) to support offline analysis and statutory reporting. | 1. Admin can export order dataset in CSV format. 2. Export respects RBAC and excludes restricted fields. | Available | PRD-ORD-001 |
| FR-213 | Should | Tracking & Notifications | The Platform shall provide notification delivery reports (sent, delivered, failed) by channel and event type. | 1. Report is available by date range and channel. 2. Failed deliveries are shown with error codes where available. | Customisation required | PRD-TRK-007 |
| FR-241 | Should | Returns, Refunds & Dispute Resolution | The Platform shall provide configurable SLA timers for dispute/return handling (seller response time, support resolution time). | 1. Admin can configure SLA timers and escalation thresholds. 2. System flags SLA breaches and triggers notifications/escalations. | Customisation required | PRD-RET-008 |
| FR-245 | Should | Returns, Refunds & Dispute Resolution | The Platform shall support refund approval controls and segregation of duties for manual refunds above a configurable threshold. | 1. Manual refunds above threshold require second approver. 2. Approval actions are logged and auditable. | Customisation required | PRD-PAY-016 |
| FR-259 | Should | Customer Service & CRM | The Platform shall provide configurable support categories and routing rules (by service type, order status, geography). | 1. Admin can configure categories and routing rules. 2. New tickets are auto-assigned according to routing rules. | Customisation required | PRD-CRM-014 |
| FR-277 | Should | Reporting & Analytics | The Platform shall provide order and logistics performance reports (on-time delivery, delivery success rate, average transit time) by outlet/hub/ user/service. | 1. Reports show KPIs by outlet/hub/user/ service and date range. 2. Reports can be exported to CSV/PDF. | Customisation required (Module to integrate with the Logistics Module) | PRD-RPT-010 |
| FR-279 | Should | Reporting & Analytics | The Platform shall provide seller performance reports (fulfilment SLA adherence, cancellations, returns rate, ratings) and export capabilities. | 1. Admin can generate seller performance report by period. 2. Report includes at least four KPIs and is exportable. | Customisation required | PRD-RPT-010 |
| FR-285 | Should | Reporting & Analytics | The Platform shall provide ad-hoc query and export capability for authorized analysts using defined data views. | 1. Authorized user can select predefined data view and export to CSV. 2. Exports include data dictionary and timestamp. | Customisation required | PRD-RPT-004 |
| FR-290 | Should | Reporting & Analytics | The Platform shall provide monitoring of system health and usage analytics (page views, API calls) with alerts on anomalies. | 1. Dashboard shows usage metrics by channel. 2. Alert triggers when anomaly threshold exceeded (demo). | Customisation required | PRD-PLT-014 |
| FR-292 | Should | Reporting & Analytics | The Platform shall provide regulatory/compliance reporting as required by policies (complaints, AML/CFT flags, privacy requests). | 1. Compliance report can be generated for a period. 2. Report includes required fields and is exportable. | Customisation required | PRD-RPT-006 |
| FR-296 | Should | Reporting & Analytics | The Platform shall provide a standard monthly implementation and operations report template auto-populated from system metrics. | 1. Report can be generated for a month and includes defined sections (adoption, orders, payments, logistics, incidents). 2. Template is configurable and exportable. | Customisation required | PRD-RPT-002 |
| FR-299 | Should | Reporting & Analytics | The Platform shall provide performance dashboards for system response times and key transaction latencies (search, checkout, payment confirmation). | 1. Dashboard shows response time metrics over time. 2. Alerts can be configured when thresholds exceeded [TBD – Client to confirm thresholds]. | Customisation required | PRD-PLT-014 |
| FR-304 | Should | Administration & Configuration | The Platform shall support configuration of logistics pricing tables (delivery fees, pickup fees, COD fees) by service level and location( rular/ urban}. | 1. Admin can define pricing tables and effective dates. 2. Checkout reflects correct fees based on configured pricing. | Customisation required | PRD-LOG-002, PRD-PAY-015 |
| FR-308 | Should | Administration & Configuration | The Platform shall support configuration of seller verification rules, tiers, and limits without code changes. | 1. Admin can edit verification tier rules and limits. 2. Rules are enforced during seller onboarding and transactions. | Customisation required | PRD-SEL-003 |
| FR-310 | Should | Administration & Configuration | The Platform shall provide configuration of notification templates and channel settings (SMS, email, in-app) including quiet hours and rate limits. | 1. Admin can modify template and preview output. 2. Quiet hours settings suppress notifications as configured. | Customisation required | PRD-TRK-004, PRD-TRK-005, PRD-TRK-006 |
| FR-311 | Should | Administration & Configuration | The Platform shall support configuration of service-level standards (delivery SLA, pickup deadline, support SLA) and associated escalations. | 1. Admin can define a service standard and escalation trigger{ as giuded by Regulatory requirement}. 2. System flags breaches and triggers escalation workflows. | Customisation required | PRD-CRM-001, PRD-LOG-017, PRD-ORD-011, PRD-RET-008, PRD-SVC-011 |
| FR-312 | Should | Administration & Configuration | The Platform shall provide configuration for dispute resolution rules and escalation matrix in line with Complaints & ADR Policy. | 1. Admin can define escalation steps and thresholds. 2. Dispute cases follow configured escalation path. | Customisation required | PRD-RET-008 |
| FR-313 | Should | Administration & Configuration | The Platform shall support configuration of content pages, banners, Customer service charter and announcements (CMS) with publish/unpublish and approval workflow. | 1. Admin can create content and publish. 2. Content changes are versioned and include approval where configured. | Available | PRD-MKT-007, PRD-MKT-008 |
| FR-317 | Should | Administration & Configuration | The Platform shall provide a configuration baseline export and import function for backup and environment replication (dev/test/prod Recovery). | 1. Admin can export configuration to a file. 2. Imported configuration restores settings in a test environment. | Customisation required | PRD-PLT-005 |
| FR-319 | Should | Administration & Configuration | The Platform shall support configuration of product/seller moderation queues and assignment rules. | 1. Admin can define moderation queues and assignment rules. 2. Items enter queue based on triggers (new listing, flagged listing). | Customisation required | PRD-ADM-006, PRD-CAT-022, PRD-CAT-043, PRD-SEL-003 |
| FR-320 | Should | Administration & Configuration | The Platform shall support configuration of fraud rules and thresholds and allow enabling/disabling rules with audit trail. | 1. Admin can enable/disable a rule and set threshold. 2. Rule changes are logged and take effect without code change. | Customisation required | PRD-PAY-018, PRD-PLT-004, PRD-SEC-004 |
| FR-321 | Should | Administration & Configuration | The Platform shall support configuration of API rate limits, throttling, and allowed client applications. | 1. Admin can set a rate limit for an API client. 2. Requests exceeding limit are throttled and logged. | Customisation required | PRD-INT-002 |
| FR-323 | Should | Administration & Configuration | The Platform shall provide administrative tools for managing blacklists/whitelists (users, sellers, IPs, devices) with audit trail. | 1. Admin can add/remove entries with reason codes. 2. Blacklisted entities are restricted according to rules. | Customisation required | PRD-SEL-013 |
| FR-324 | Should | Administration & Configuration | The Platform shall provide system parameter configuration for maximum file upload sizes, supported file types, and content scanning controls. | 1. Admin can configure limits and file types. 2. System rejects disallowed files and logs attempts. | Customisation required | PRD-ADM-008 |
| FR-347 | Should | Integrations & e-Government Services | The Platform shall maintain integration change logs and provide backward compatibility policies for API versioning. | 1. API versioning is implemented and documented. 2. Deprecation notices can be issued and tracked. | Customisation required | PRD-INT-001 |
| FR-070 | Could | Product Catalog Management | The Platform shall support a featured listing/advertising mechanism with configurable placement rules and fees. | 1. Admin can designate featured listings and set duration/fee. 2. Featured listings display in defined placements and expire automatically. | Customisation required | PRD-CAT-033 |
| FR-122 | Could | Cart & Checkout | The Platform shall allow configuration of minimum order values and fee thresholds (e.g., free pickup) per policy. | 1. Admin can configure thresholds and effective dates. 2. Checkout enforces thresholds correctly. | Available | PRD-CHK-010 |
| FR-170 | Could | Order Management | The Platform shall support configuration of seller fulfilment deadlines and automatic cancellations/penalties for non-compliance as per marketplace policy. | 1. Admin can set deadlines and penalties. 2. System applies actions when deadlines exceeded and logs outcomes. | Customisation required | PRD-ORD-004 |
| FR-198 | Could | Logistics & Fulfilment | The Platform shall support configuration of pickup and delivery fees and revenue share models for logistics partners where applicable. | 1. Admin can configure partner fee share rules. 2. Settlement reports reflect partner shares. | Customisation required | PRD-LOG-002 |
| FR-219 | Could | Tracking & Notifications | The Platform shall provide configuration for notification suppression rules (quiet hours, rate limits) to manage user experience. | 1. Admin can configure quiet hours and rate limits. 2. Notifications are suppressed/queued according to rules. | Customisation required | PRD-TRK-006 |
| FR-248 | Could | Returns, Refunds & Dispute Resolution | The Platform shall support configurable retention of dispute/return case records and evidence per data retention policy. | 1. Admin can set retention policy configuration. 2. System archives or deletes records according to policy and logs actions.3.The System shall maintain an audit trail and records of all deletion and will not allow permanent record removal without approvals | Customisation required | PRD-RET-009 |
| FR-267 | Could | Customer Service & CRM | The Platform shall provide an outbound communications tool for proactive updates (service outage, delivery delays) to affected users based on criteria. | 1. Admin can select affected user segment and send message via configured channels. 2. Tool logs messages and delivery outcomes. | Customisation required | PRD-TRK-009 |
| FR-270 | Could | Customer Service & CRM | The Platform shall support a complaints escalation matrix (internal escalation steps, external escalation points) configurable by Admin. | 1. Admin can configure escalation steps and triggers. 2. System records escalations and notifies assigned parties. | Customisation required | PRD-CRM-004 |
| FR-273 | Could | Customer Service & CRM | The Platform shall support a knowledge article approval workflow to ensure published guidance is accurate and consistent with policies. | 1. Draft article requires approval before publish. 2. Published article displays version and last updated date. | Customisation required | PRD-CRM-007 |
| FR-280 | Could | Reporting & Analytics | The Platform shall provide fraud and risk analytics (flagged transactions, rule triggers, fraud case outcomes). | 1. Dashboard lists flagged events and outcomes by period. 2. Flags can be drilled down to transaction/case details. | Customisation required | PRD-RPT-010 |
| FR-284 | Could | Reporting & Analytics | The Platform shall provide configurable report scheduling and email delivery of reports to nominated recipients. | 1. Admin can schedule at least one report and configure recipients. 2. Scheduled report is delivered and logged. | Customisation required (Enhancing the Scheduling Module) | PRD-RPT-004 |
| FR-288 | Could | Reporting & Analytics | The Platform shall provide a configurable KPI catalogue where PIU/MPC can define additional KPIs and formulas (where feasible) without code changes. | 1. Admin can define a KPI with formula from available fields. 2. KPI appears on dashboard and computes correctly. | Customisation required | PRD-RPT-002 |
| FR-294 | Could | Reporting & Analytics | The Platform shall support segmentation reports (by district/outlet, buyer type, [ age, Gender, rulal/ urban) seller type [ SMEs}for targeted outreach and adoption campaigns. | 1. Admin can run segmentation report by at least two dimensions. 2. Segmentation outputs can be exported. | Customisation required | PRD-RPT-011 |
| FR-315 | Could | Administration & Configuration | The Platform shall support configuration of tax and fee rules applicable to platform transactions and generate corresponding reports. | 1. Admin can configure tax rules. 2. Reports reflect configured tax rules and are exportable. | Customisation required | PRD-PAY-021 |
| FR-316 | Could | Administration & Configuration | The Platform shall support configuration of user segmentation attributes (buyer type,Gender, Age, rular/ uran seller type SMEs) used for reporting and marketing. | 1. Admin can define segmentation attributes. 2. Attributes are captured and usable in reports. | Customisation required | PRD-MKT-011 |
| FR-322 | Could | Administration & Configuration | The Platform shall support configuration of data retention and archival rules for key modules (orders, payments, tickets, logs). | 1. Admin can define retention periods per module. 2. System archives/deletes records based on configured rules and logs actions. | Customisation required | PRD-PLT-020 |
| FR-325 | Could | Administration & Configuration | The Platform shall support configuration of onboarding content, training materials, and guided tours for users and sellers. | 1. Admin can update onboarding content without code changes. 2. Users can access onboarding content from relevant screens. | Customisation required | PRD-MKT-007, PRD-PLT-019, PRD-SEL-023 |

## 4. Worth a review before the demo

### 4.1 Answered "Available", delivered by a feature the PRD does not route as configuration (5)

"Available" in the bidder response reads as *the capability exists in the product*; the PRD's
route says *how this product builds it*. The two are not the same statement, so this is a review
list, not a contradiction — but each line is a place where the client may expect to see something
working that is in fact a build.

| Req | Priority | Shall statement | Route | Features |
|---|---|---|---|---|
| FR-013 | Should | The Platform shall enforce configurable session timeout and idle logout for authenticated users. | Code-level | PRD-IAM-006 |
| FR-024 | Must | The Platform shall provide a user administration console to search, view, and manage user accounts with full audit logging. | Code-level | PRD-IAM-010 |
| FR-066 | Should | The Platform shall provide catalog analytics for Admin (active listings, categories, out-of-stock rate, listing rejection reasons). | Code-level | PRD-CAT-034 |
| FR-276 | Must | The Platform shall provide dashboards for key KPIs including registrations, active buyers/sellers, GMV, orders, and conversion rates. | External system | PRD-RPT-002 |
| FR-313 | Should | The Platform shall support configuration of content pages, banners, Customer service charter and announcements (CMS) with publish/unpublish and approval workflow. | Configuration / Code-level | PRD-MKT-007, PRD-MKT-008 |

### 4.2 Answered "Available", delivered by a feature held by an open decision (3)

These are firmer: the feature cannot be started until the decision is recorded (P-1), yet the
client has been told the capability is available.

| Req | Shall statement | Feature | Held by |
|---|---|---|---|
| FR-066 | The Platform shall provide catalog analytics for Admin (active listings, categories, out-of-stock rate, listing rejection reasons). | PRD-CAT-034 | PAID-STUB |
| FR-276 | The Platform shall provide dashboards for key KPIs including registrations, active buyers/sellers, GMV, orders, and conversion rates. | PRD-RPT-002 | PAID-STUB |
| FR-313 | The Platform shall support configuration of content pages, banners, Customer service charter and announcements (CMS) with publish/unpublish and approval workflow. | PRD-MKT-008 | WF-ENG |

## 5. Build order for the features this actor needs

Wave, then the client's priority, then the product's phase.

### Wave 1 — Foundation (16)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-ADM-001 | 390 | Administration console | ADM | P1 | yes | not-built | FR-301 |
| PRD-ADM-002 | 391 | Workflow engine | ADM | P1 | yes | held-default | FR-307 |
| PRD-ADM-006 | 395 | Approval queues | ADM | P1 | yes | held-default | FR-039, FR-319 |
| PRD-ADM-008 | 397 | Upload and content scanning controls | ADM | P1 | yes | not-built | FR-324 |
| PRD-IAM-003 | 36 | Password policy, lockout and recovery | IAM | P1 | yes | not-built | FR-021 |
| PRD-IAM-004 | 37 | Multi-factor authentication by role | IAM | P1 | yes | not-built | FR-012, FR-021 |
| PRD-IAM-006 | 39 | Session management | IAM | P1 | yes | not-built | FR-013 |
| PRD-IAM-007 | 40 | Roles and permissions | IAM | P1 | yes | not-built | FR-011, FR-302 |
| PRD-IAM-010 | 43 | User administration console | IAM | P1 | **no** | not-built | FR-024 |
| PRD-IAM-011 | 44 | Staff invitation and access reviews | IAM | P1 | yes | not-built | FR-298 |
| PRD-PLT-004 | 7 | Settings change control | PLT | P1 | yes | held-default | FR-318, FR-320 |
| PRD-PLT-005 | 8 | Configuration export, import and promotion | PLT | P1 | yes | not-built | FR-317 |
| PRD-PLT-014 | 17 | Instance health and SLA monitoring | PLT | P1 | **no** | mocked | FR-290, FR-299 |
| PRD-PLT-019 | 22 | Contextual help and guided tours | PLT | P1 | yes | not-built | FR-325 |
| PRD-PLT-020 | 23 | Data retention and archival | PLT | P1 | yes | not-built | FR-322 |
| PRD-SEC-004 | 417 | Platform audit trail | SEC | P1 | **no** | built | FR-039, FR-320 |

### Wave 2 — Catalogue (20)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-CAT-005 | 96 | Category attribute schema and listing quality rules | CAT | P1 | yes | not-built | FR-309 |
| PRD-CAT-021 | 112 | Listing policy enforcement | CAT | P1 | yes | not-built | FR-059, FR-073 |
| PRD-CAT-022 | 113 | Listing lifecycle and operator approval | CAT | P1 | yes | held-default | FR-319 |
| PRD-CAT-033 | 124 | Promoted listings with fees | CAT | P1 | **no** | not-built | FR-070 |
| PRD-CAT-034 | 125 | Catalogue analytics | CAT | P1 | **no** | held-default | FR-066 |
| PRD-CAT-043 | 134 | Seller listing moderation | CAT | P1 | yes | held-default | FR-058, FR-319 |
| PRD-SEL-002 | 65 | Seller KYC documents | SEL | P1 | yes | not-built | FR-036 |
| PRD-SEL-003 | 66 | Seller verification workflow and tiers | SEL | P1 | yes | held-default | FR-028, FR-029, FR-308, FR-319 |
| PRD-SEL-005 | 68 | Payout accounts and verification | SEL | P1 | **no** | held-default | FR-039 |
| PRD-SEL-007 | 70 | Marketplace rules and listing eligibility | SEL | P1 | yes | not-built | FR-033, FR-046 |
| PRD-SEL-011 | 74 | Seller performance monitoring | SEL | P1 | yes | not-built | FR-037, FR-046 |
| PRD-SEL-013 | 76 | Block and watch lists | SEL | P1 | **no** | not-built | FR-323 |
| PRD-SEL-016 | 79 | Commission and fee rules | SEL | P1 | **no** | not-built | FR-043, FR-303 |
| PRD-SEL-021 | 84 | Seller onboarding funnel report | SEL | P1 | yes | not-built | FR-048 |
| PRD-SEL-023 | 86 | Seller training content | SEL | P1 | yes | not-built | FR-325 |
| PRD-SEL-024 | 87 | Seller blacklisting | SEL | P1 | **no** | not-built | FR-041 |
| PRD-SRC-007 | 160 | Merchandising widgets and landing pages | SRC | P1 | **no** | not-built | FR-082, FR-094 |
| PRD-SRC-014 | 167 | Search engine: relevance, synonyms, multilingual | SRC | P1 | **no** | held-default | FR-090 |
| PRD-SRC-016 | 169 | Taxonomy governance | SRC | P1 | **no** | held-default | FR-099, FR-309 |
| PRD-SRC-017 | 170 | Seller badges and featured sellers | SRC | P1 | **no** | not-built | FR-082 |

### Wave 3 — Buy (11)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-CHK-010 | 193 | Minimum order and fee thresholds | CHK | P1 | **no** | not-built | FR-122 |
| PRD-ORD-001 | 245 | Order management console | ORD | P1 | **no** | not-built | FR-156, FR-174 |
| PRD-ORD-003 | 247 | Order interventions with reason codes and audit | ORD | P1 | yes | not-built | FR-156 |
| PRD-ORD-004 | 248 | Cancellation rules | ORD | P1 | yes | not-built | FR-170 |
| PRD-ORD-011 | 255 | Cut-offs and service levels | ORD | P1 | yes | not-built | FR-046, FR-165, FR-311 |
| PRD-PAY-001 | 206 | Payment method framework and routing | PAY | P1 | yes | not-built | FR-305 |
| PRD-PAY-015 | 220 | Payment fees | PAY | P1 | **no** | not-built | FR-139, FR-304 |
| PRD-PAY-016 | 221 | Refunds | PAY | P1 | **no** | not-built | FR-245 |
| PRD-PAY-018 | 223 | Payment and order risk controls | PAY | P1 | yes | not-built | FR-320 |
| PRD-PAY-019 | 224 | Payments operations console | PAY | P1 | **no** | not-built | FR-144 |
| PRD-PAY-021 | 226 | Tax on fees and tax reporting | PAY | P1 | yes | not-built | FR-303, FR-315 |

### Wave 4 — Fulfil (12)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-LOG-002 | 277 | Delivery fee rule engine | LOG | P1 | yes | not-built | FR-198, FR-304 |
| PRD-LOG-017 | 292 | Holding charges and pre-dispatch changes | LOG | P1 | yes | not-built | FR-311 |
| PRD-RET-002 | 327 | Return eligibility rules | RET | P1 | yes | not-built | FR-237 |
| PRD-RET-003 | 328 | Return logistics | RET | P1 | yes | held-default | FR-228 |
| PRD-RET-007 | 332 | Dispute and issue cases | RET | P1 | **no** | held-default | FR-231 |
| PRD-RET-008 | 333 | Dispute SLAs and escalation | RET | P1 | yes | held-default | FR-241, FR-311, FR-312 |
| PRD-RET-009 | 334 | Case retention and reports | RET | P1 | yes | not-built | FR-248 |
| PRD-TRK-004 | 314 | Email notifications and templates | TRK | P1 | yes | not-built | FR-310 |
| PRD-TRK-005 | 315 | Notification engine (multi-channel) | TRK | P1 | yes | not-built | FR-310 |
| PRD-TRK-006 | 316 | Notification preferences | TRK | P1 | yes | not-built | FR-219, FR-310 |
| PRD-TRK-007 | 317 | Notification delivery tracking and audit | TRK | P1 | yes | not-built | FR-213 |
| PRD-TRK-009 | 319 | Proactive outreach and outage notices | TRK | P1 | **no** | not-built | FR-267 |

### Wave 5 — Engage and run (15)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-CRM-001 | 340 | Help desk ticketing | CRM | P1 | yes | not-built | FR-311 |
| PRD-CRM-003 | 342 | Agent 360° view | CRM | P1 | **no** | not-built | FR-263 |
| PRD-CRM-004 | 343 | Complaints process | CRM | P1 | yes | held-default | FR-270 |
| PRD-CRM-007 | 346 | Knowledge base | CRM | P1 | **no** | not-built | FR-273 |
| PRD-CRM-014 | 353 | Issue routing and escalation | CRM | P1 | **no** | not-built | FR-259 |
| PRD-MKT-001 | 358 | Discounts and coupons | MKT | P1 | **no** | not-built | FR-062 |
| PRD-MKT-007 | 364 | Content management | MKT | P1 | yes | not-built | FR-306, FR-313, FR-325 |
| PRD-MKT-008 | 365 | Content approval and policy versioning | MKT | P1 | **no** | held-default | FR-306, FR-313 |
| PRD-MKT-011 | 368 | Customer segmentation attributes | MKT | P1 | yes | not-built | FR-316 |
| PRD-RPT-002 | 376 | KPI framework and executive dashboards | RPT | P1 | **no** | held-default | FR-276, FR-288, FR-296 |
| PRD-RPT-004 | 378 | Report delivery and self-service | RPT | P1 | yes | mocked | FR-284, FR-285 |
| PRD-RPT-006 | 380 | Compliance and audit reports | RPT | P1 | **no** | mocked | FR-292 |
| PRD-RPT-010 | 384 | Operational dashboards | RPT | P1 | **no** | held-default | FR-277, FR-278, FR-279, FR-280 |
| PRD-RPT-011 | 385 | Commerce and marketing analytics | RPT | P1 | **no** | held-default | FR-294 |
| PRD-RPT-012 | 386 | e-Government and engagement reports | RPT | P1 | **no** | held-default | FR-281 |

### Wave 6 — Reach (2)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-INT-001 | 432 | Public REST API | INT | P1 | yes | held-default | FR-347 |
| PRD-INT-002 | 433 | Integration layer (API gateway) | INT | P1 | yes | held-default | FR-314, FR-321 |

### Wave 7 — Verticals (4)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-EGV-001 | 485 | e-Government service catalogue | EGV | P1 | yes | held-default | FR-307 |
| PRD-EGV-002 | 486 | Service applications | EGV | P1 | **no** | held-default | FR-307 |
| PRD-EGV-006 | 490 | Agency administration | EGV | P1 | yes | held-default | FR-307 |
| PRD-SVC-011 | 505 | Service-level targets for service orders | SVC | P1 | **no** | not-built | FR-165, FR-311 |
