# Malawi Post requirement map — actor "MPC Ops"

Generated 2026-11-24T13:45:00.936Z by `scripts/build-mpc-map.mjs`.

Source: `docs/client/MPC-Lot1-FR-Catalogue.md`, the client's own annex
(MPC Requirements Catalogue Annex, Deliverable 2 — Lot 1, FR-001…FR-350). The FR numbering is the
same as `REQ-MPC-FR-nnn` in the compliance report, which is where the requirement → feature
mapping comes from.

## 1. Profile

| Measure | Value |
|---|---|
| Requirements with actor "MPC Ops" | 16 of 350 |
| Client priority | Should 8 · Must 7 · Could 1 |
| Distinct product features needed | 15 |
| Of those, inside the "Logistics, warehouse and operations staff" user group | 11 |
| **Outside it** | **4** |
| Client acceptance criteria stated | 32 |

### By the client's own domain

| Domain | Requirements |
|---|---|
| Logistics & Fulfilment | 10 |
| Tracking & Notifications | 2 |
| User & Access Management | 1 |
| Payments & Reconciliation | 1 |
| Order Management | 1 |
| Returns, Refunds & Dispute Resolution | 1 |

### Bidder response already given to the client

| Response | Requirements |
|---|---|
| Customisation required | 14 |
| Available | 2 |

## 2. Features this actor needs that the user group does not contain (4)

A build led by the user group would miss these. They are needed by at least one "MPC Ops"
requirement, but the Client-PRD "Who uses it" list for those features does not name the group.

| Feature ID | Roadmap row | Name | Module | Phase | Priority | Wave | State | Required by |
|---|---|---|---|---|---|---|---|---|
| PRD-IAM-026 | 59 | Assisted service by agents | IAM | P1 | Must Have | 1 | not-built | FR-025 |
| PRD-LOG-014 | 289 | COD cash reconciliation | LOG | P1 | Should Have | 4 | not-built | FR-194 |
| PRD-LOG-022 | 297 | Post-office drop-off acceptance | LOG | P1 | Must Have | 4 | held-default | FR-178 |
| PRD-PAY-034 | 239 | Outlet receipt printing and cash-up | PAY | P1 | Should Have | 3 | held-default | FR-131 |

## 3. Every requirement, with the features that deliver it

Ordered by the client's priority, then by requirement number. "Client AC" is the client's own
acceptance criteria — what a demo is judged against. They are not the product's AC-<AREA>-nnn and
do not replace them; a feature is still only built when its own ACs pass (P-6).

| Req | Priority | Domain | Shall statement | Client AC | Bidder response | Features |
|---|---|---|---|---|---|---|
| FR-025 | Must | User & Access Management | The Platform shall allow MPC outlet agents to authenticate using named accounts and record transactions performed on behalf of customers (assisted service). | 1. Outlet agent login is distinct from customer account. 2. Assisted transactions record agent ID and outlet identifier. | Available | PRD-IAM-026 |
| FR-131 | Must | Payments & Reconciliation | The Platform shall support assisted cash payments at MPC outlets for orders initiated online, with secure payment reference and reconciliation. | 1. Agent can accept cash and record payment against order using reference. 2. Order status updates to Paid and cash collection is included in reconciliation report. | Customisation required | PRD-PAY-008, PRD-PAY-034 |
| FR-162 | Must | Order Management | The Platform shall provide an operational view of orders requiring pickup, sorting, dispatch, and last-mile delivery actions. | 1. Operations user can view a queue of tasks by outlet/hub and status. 2. Tasks can be filtered by due date and service level. | Customisation required | PRD-ADM-007 |
| FR-178 | Must | Logistics & Fulfilment | The Platform shall support drop-off processing at post offices/agencies, including scanning and acceptance of parcels for delivery. | 1. Outlet agent can scan a parcel and accept it into system. 2. System records acceptance location and time. | Customisation required (Custom Module – Pickup Scheduling and Confirmation) | PRD-LOG-022 |
| FR-183 | Must | Logistics & Fulfilment | The Platform shall support creation and printing of standardized shipping labels and barcodes compatible with postal scanning processes. | 1. Label includes tracking number/barcode and routing information. 2. Label template can be configured and printed. | Customisation required | PRD-LOG-007 |
| FR-192 | Must | Logistics & Fulfilment | The Platform shall support hub-and-spoke sorting operations with scanning events at each handover point. | 1. Scan events can be recorded at pickup, hub arrival, hub departure, delivery. 2. Each scan records location and timestamp. | Customisation required | PRD-LOG-023 |
| FR-204 | Must | Tracking & Notifications | The Platform shall provide scanning interfaces for recording track-and-trace events at pickup, hub, and delivery points. | 1. Ops user can record scan event with shipment ID and location. 2. Scan events update tracking status and are visible to buyer. | Customisation required | PRD-TRK-003 |
| FR-177 | Should | Logistics & Fulfilment | The Platform shall allow MPC Ops to schedule parcel pick-up from sellers and record pickup confirmation. | 1. Ops user can schedule pickup for eligible sellers/orders. 2. Pickup confirmation updates shipment status and is logged. | Available | PRD-LOG-011 |
| FR-179 | Should | Logistics & Fulfilment | The Platform shall support route planning/dispatch lists for last-mile delivery tasks with ability to mark delivery attempts. | 1. Delivery runs can be generated for a date/outlet. 2. Driver can record delivery attempt outcomes and capture reason codes. | Customisation required (Requires External Logistics Integration and Custom Last-Mile Delivery Module) | PRD-LOG-024 |
| FR-186 | Should | Logistics & Fulfilment | The Platform shall support incident reporting for logistics (lost parcel, damaged parcel, delayed) with escalation workflows. | 1. Ops user can log a logistics incident with category and description. 2. Incident is linked to shipment and visible to customer support. | Customisation required (Custom Logistics Incident management module) | PRD-LOG-013 |
| FR-188 | Should | Logistics & Fulfilment | The Platform shall support pickup point management including operating hours, capacity flags, and temporary closure status. | 1. Admin/Ops can update pickup point status and hours. 2. Checkout and notifications reflect pickup point status changes. | Customisation required (Custom module on top of the pick-up point module) | PRD-LOG-003 |
| FR-194 | Should | Logistics & Fulfilment | The Platform shall support cash collection handling for COD deliveries including reconciliation of cash collected to order and delivery run. | 1. Delivery agent can record COD cash collected per order. 2. Daily reconciliation report shows COD collected vs expected. | Customisation required (Module with Finance or ERP Integration) | PRD-LOG-014 |
| FR-199 | Should | Logistics & Fulfilment | The Platform shall provide a mechanism to generate daily dispatch manifests for handover to linehaul/transport operators. | 1. Manifest can be generated for selected route/outlet and date. 2. Manifest includes shipment IDs, quantities, and handover signatures/acknowledgements. | Customisation required | PRD-LOG-009 |
| FR-224 | Should | Tracking & Notifications | The Platform shall support capturing delivery agent identifiers and device identifiers for tracking events for accountability. | 1. Tracking event records include agent ID and device ID for events created via delivery app. 2. Records are retrievable in audit reports. | Customisation required | PRD-TRK-003 |
| FR-250 | Should | Returns, Refunds & Dispute Resolution | The Platform shall support return item inspection at MPC outlet/warehouse (received condition, photos, acceptance/rejection) and record the inspection outcome in the return case. | 1. Ops user can record inspection outcome and attach photos where applicable. 2. Inspection outcome triggers next workflow step (refund approval, seller notification) as configured. | Customisation required | PRD-RET-004 |
| FR-181 | Could | Logistics & Fulfilment | The Platform shall support warehouse/fulfilment centre operations where enabled (pick, pack, stage, dispatch) for MPC-fulfilled items. | 1. Warehouse user can create pick list and confirm pick/pack actions. 2. Inventory adjustments are recorded and auditable. | Customisation required (Warehouse and Fulfillment management Module) | PRD-LOG-009 |

## 4. Worth a review before the demo

### 4.1 Answered "Available", delivered by a feature the PRD does not route as configuration (2)

"Available" in the bidder response reads as *the capability exists in the product*; the PRD's
route says *how this product builds it*. The two are not the same statement, so this is a review
list, not a contradiction — but each line is a place where the client may expect to see something
working that is in fact a build.

| Req | Priority | Shall statement | Route | Features |
|---|---|---|---|---|
| FR-025 | Must | The Platform shall allow MPC outlet agents to authenticate using named accounts and record transactions performed on behalf of customers (assisted service). | Code-level | PRD-IAM-026 |
| FR-177 | Should | The Platform shall allow MPC Ops to schedule parcel pick-up from sellers and record pickup confirmation. | Code-level | PRD-LOG-011 |

### 4.2 Answered "Available", delivered by a feature held by an open decision (1)

These are firmer: the feature cannot be started until the decision is recorded (P-1), yet the
client has been told the capability is available.

| Req | Shall statement | Feature | Held by |
|---|---|---|---|
| FR-177 | The Platform shall allow MPC Ops to schedule parcel pick-up from sellers and record pickup confirmation. | PRD-LOG-011 | FG-06 |

## 5. Build order for the features this actor needs

Wave, then the client's priority, then the product's phase.

### Wave 1 — Foundation (2)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-ADM-007 | 396 | Operations console and work queues | ADM | P1 | yes | not-built | FR-162 |
| PRD-IAM-026 | 59 | Assisted service by agents | IAM | P1 | **no** | not-built | FR-025 |

### Wave 3 — Buy (2)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-PAY-008 | 213 | Cash on delivery and cash at outlet | PAY | P1 | yes | not-built | FR-131 |
| PRD-PAY-034 | 239 | Outlet receipt printing and cash-up | PAY | P1 | **no** | held-default | FR-131 |

### Wave 4 — Fulfil (11)

| Feature ID | Roadmap row | Name | Module | Phase | In the user group | State | Client requirements |
|---|---|---|---|---|---|---|---|
| PRD-LOG-003 | 278 | Pickup points and outlets | LOG | P1 | yes | not-built | FR-188 |
| PRD-LOG-007 | 282 | Shipping labels and barcodes | LOG | P1 | yes | not-built | FR-183 |
| PRD-LOG-009 | 284 | Warehouse pick, pack, dispatch | LOG | P1 | yes | not-built | FR-181, FR-199 |
| PRD-LOG-011 | 286 | Logistics task creation and seller pickup | LOG | P1 | yes | held-default | FR-177 |
| PRD-LOG-013 | 288 | Delivery exceptions | LOG | P1 | yes | not-built | FR-186 |
| PRD-LOG-014 | 289 | COD cash reconciliation | LOG | P1 | **no** | not-built | FR-194 |
| PRD-LOG-022 | 297 | Post-office drop-off acceptance | LOG | P1 | **no** | held-default | FR-178 |
| PRD-LOG-023 | 298 | Hub-and-spoke sorting | LOG | P1 | yes | held-default | FR-192 |
| PRD-LOG-024 | 299 | Last-mile route lists and attempts | LOG | P1 | yes | held-default | FR-179 |
| PRD-RET-004 | 329 | Return inspection | RET | P1 | yes | not-built | FR-250 |
| PRD-TRK-003 | 313 | Scanning and field operations app | TRK | P1 | yes | held-default | FR-204, FR-224 |
