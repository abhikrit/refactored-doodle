# Malawi Post requirement map — actor "Customer Support"

Generated 2026-11-24T13:45:00.992Z by `scripts/build-mpc-map.mjs`.

Source: `docs/client/MPC-Lot1-FR-Catalogue.md`, the client's own annex
(MPC Requirements Catalogue Annex, Deliverable 2 — Lot 1, FR-001…FR-350). The FR numbering is the
same as `REQ-MPC-FR-nnn` in the compliance report, which is where the requirement → feature
mapping comes from.

## 1. Profile

| Measure | Value |
|---|---|
| Requirements with actor "Customer Support" | 15 of 350 |
| Client priority | Should 8 · Must 6 · Could 1 |
| Distinct product features needed | 11 |
| Of those, inside the "Support staff" user group | 11 |
| **Outside it** | **0** |
| Client acceptance criteria stated | 30 |

### By the client's own domain

| Domain | Requirements |
|---|---|
| Customer Service & CRM | 12 |
| Returns, Refunds & Dispute Resolution | 2 |
| Tracking & Notifications | 1 |

### Bidder response already given to the client

| Response | Requirements |
|---|---|
| Customisation required | 10 |
| Available | 5 |

## 2. Features this actor needs that the user group does not contain (0)

A build led by the user group would miss these. They are needed by at least one "Customer Support"
requirement, but the Client-PRD "Who uses it" list for those features does not name the group.

None.

## 3. Every requirement, with the features that deliver it

Ordered by the client's priority, then by requirement number. "Client AC" is the client's own
acceptance criteria — what a demo is judged against. They are not the product's AC-<AREA>-nnn and
do not replace them; a feature is still only built when its own ACs pass (P-6).

| Req | Priority | Domain | Shall statement | Client AC | Bidder response | Features |
|---|---|---|---|---|---|---|
| FR-211 | Must | Tracking & Notifications | The Platform shall provide customer support users with a consolidated view of order, payment, and tracking status for a given customer query. | 1. Support agent can search by order ID/tracking number/phone number. 2. View displays key statuses and history for payment and tracking. | Customisation required | PRD-CRM-003 |
| FR-235 | Must | Returns, Refunds & Dispute Resolution | The Platform shall provide a case management view for returns and disputes with status, parties, evidence, and decision logging. | 1. Support agent can view all open cases and filter by status and age. 2. Decisions and messages are logged with timestamps and actors. | Customisation required | PRD-RET-007 |
| FR-252 | Must | Customer Service & CRM | The Platform shall provide a ticketing system for customer support to manage cases with statuses, assignment, and SLA timers. | 1. Support agent can create/update ticket status and assign owner. 2. SLA timers are tracked and visible for each ticket. | Available | PRD-CRM-001 |
| FR-254 | Must | Customer Service & CRM | The Platform shall provide a 360-degree customer view for support agents (profile, orders, payments, delivery events, disputes). | 1. Support agent can retrieve customer record by phone/email/order ID. 2. View consolidates orders, payments, logistics events, and cases. | Available | PRD-CRM-003 |
| FR-260 | Must | Customer Service & CRM | The Platform shall log all customer-support communications (messages, calls, emails) as part of the case history. | 1. Case history shows chronological communications with timestamps and actor. 2. Case history is immutable for support users. | Available | PRD-CRM-002 |
| FR-274 | Must | Customer Service & CRM | The Platform shall provide audit logs for all ticket modifications (status changes, assignment, edits) with actor and timestamp. | 1. Audit log is accessible for authorized admins. 2. Audit log captures before/after values for key fields. | Customisation required | PRD-CRM-006 |
| FR-253 | Should | Customer Service & CRM | The Platform shall support multi-channel case intake (web/app form, email-to-ticket, phone/call centre logging) as configured. | 1. At least two intake channels are enabled and demonstrated. 2. All channels create standardized case records. | Available | PRD-CRM-002 |
| FR-256 | Should | Customer Service & CRM | The Platform shall support scripted responses and templates for common inquiries, with version control and approval. And this will be used through AI chat bots achieved though platforms such as Whatsapp , browser chat Support Agents | 1. Support agent can select template response for a ticket. 2. Templates are versioned and only approved templates are available. | Customisation required | PRD-AI-003, PRD-CRM-007 |
| FR-258 | Should | Customer Service & CRM | The Platform shall support escalation workflows from Level 1 support to specialized teams (payments ops, logistics ops, technical support). | 1. Support agent can escalate ticket to predefined queue with reason. 2. Escalation updates ticket status and is logged. | Customisation required | PRD-CRM-014 |
| FR-262 | Should | Customer Service & CRM | The Platform shall provide support performance dashboards (ticket volume, resolution time, SLA breaches) by queue and agent. | 1. Dashboard shows KPIs by date range and queue. 2. Reports can be exported. | Customisation required | PRD-CRM-005 |
| FR-265 | Should | Customer Service & CRM | The Platform shall support attachment uploads in tickets with file type and size controls. | 1. Allowed attachment types are accepted; disallowed are rejected. 2. Attachments are stored securely and linked to ticket. | Available | PRD-CRM-001 |
| FR-266 | Should | Customer Service & CRM | The Platform shall support fraud reporting and referral workflow when fraud indicators are detected (e.g., repeated complaints, suspicious sellers). | 1. Support agent can flag a case as suspected fraud and route to fraud queue. 2. Fraud flag triggers additional monitoring for associated seller/buyer. | Customisation required | PRD-CRM-010 |
| FR-268 | Should | Customer Service & CRM | The Platform shall integrate ticketing with order/dispute workflows such that dispute/return cases can be created from tickets and linked bidirectionally. | 1. Support agent can convert ticket to dispute/return case. 2. Case and ticket link to each other and share updates. | Customisation required | PRD-CRM-006 |
| FR-272 | Should | Customer Service & CRM | The Platform shall support internal notes and collaboration for support agents on a ticket without exposing notes to customers. | 1. Agents can add internal notes and tag other agents. 2. Customers cannot view internal notes. | Customisation required | PRD-CRM-006 |
| FR-247 | Could | Returns, Refunds & Dispute Resolution | The Platform shall support dispute escalation to external regulators/ADR channels as applicable (e.g., MACRA) with export of case dossier. | 1. Support can export case dossier (messages, evidence, decisions) as a file. 2. Export contains required fields and is access-controlled. | Customisation required (The custom module to be integrated with the external disputes module) | PRD-RET-008 |

## 4. Worth a review before the demo

### 4.1 Answered "Available", delivered by a feature the PRD does not route as configuration (5)

"Available" in the bidder response reads as *the capability exists in the product*; the PRD's
route says *how this product builds it*. The two are not the same statement, so this is a review
list, not a contradiction — but each line is a place where the client may expect to see something
working that is in fact a build.

| Req | Priority | Shall statement | Route | Features |
|---|---|---|---|---|
| FR-252 | Must | The Platform shall provide a ticketing system for customer support to manage cases with statuses, assignment, and SLA timers. | Licensed plugin | PRD-CRM-001 |
| FR-253 | Should | The Platform shall support multi-channel case intake (web/app form, email-to-ticket, phone/call centre logging) as configured. | Code-level | PRD-CRM-002 |
| FR-254 | Must | The Platform shall provide a 360-degree customer view for support agents (profile, orders, payments, delivery events, disputes). | Code-level | PRD-CRM-003 |
| FR-260 | Must | The Platform shall log all customer-support communications (messages, calls, emails) as part of the case history. | Code-level | PRD-CRM-002 |
| FR-265 | Should | The Platform shall support attachment uploads in tickets with file type and size controls. | Licensed plugin | PRD-CRM-001 |

### 4.2 Answered "Available", delivered by a feature held by an open decision (0)

These are firmer: the feature cannot be started until the decision is recorded (P-1), yet the
client has been told the capability is available.

None.

## 5. Build order for the features this actor needs

Wave, then the client's priority, then the product's phase.

### Wave 4 — Fulfil (2)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-RET-007 | 332 | Dispute and issue cases | RET | P1 | yes | held-default | FR-235 |
| PRD-RET-008 | 333 | Dispute SLAs and escalation | RET | P1 | yes | held-default | FR-247 |

### Wave 5 — Engage and run (8)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-CRM-001 | 340 | Help desk ticketing | CRM | P1 | yes | not-built | FR-252, FR-265 |
| PRD-CRM-002 | 341 | Multi-channel case intake | CRM | P1 | yes | not-built | FR-253, FR-260 |
| PRD-CRM-003 | 342 | Agent 360° view | CRM | P1 | yes | not-built | FR-211, FR-254 |
| PRD-CRM-005 | 344 | Support quality analytics | CRM | P1 | yes | not-built | FR-262 |
| PRD-CRM-006 | 345 | Ticket collaboration and audit | CRM | P1 | yes | not-built | FR-268, FR-272, FR-274 |
| PRD-CRM-007 | 346 | Knowledge base | CRM | P1 | yes | not-built | FR-256 |
| PRD-CRM-010 | 349 | Fraud reporting and referral | CRM | P1 | yes | not-built | FR-266 |
| PRD-CRM-014 | 353 | Issue routing and escalation | CRM | P1 | yes | not-built | FR-258 |

### Wave 6 — Reach (1)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-AI-003 | 466 | AI chatbot | AI | P1 | yes | not-built | FR-256 |
