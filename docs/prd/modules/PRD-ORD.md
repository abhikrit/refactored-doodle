# L2 Module PRD — ORD: Orders and B2B transactions (RFQ, contracts, requisitions, offers, group buying)

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | ORD — Orders and B2B transactions (RFQ, contracts, requisitions, offers, group buying) |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets client staff and sellers run every order after checkout: the order console, client-defined order stages on top of the four native order statuses, interventions with reason codes and audit, cancellations, seller processing, partial supply, numbering, reorder, invoices, holds and service levels. For business buyers it adds request for quotation, quote negotiation, seller offers, requisition workflows, contracts from drafting to execution, proforma invoices and Incoterms; and as options group buying, sample orders, recurring orders, performance securities and scheme applications. It also defines the order-acceptance event used by PAY-007 and the line stage sets used by service orders.

**In scope**

- Order console, export and current carts (ORD-001); configurable order stages and the acceptance event (ORD-002); interventions with reason codes, approval, locking and snapshots (ORD-003)
- Cancellation rules for buyers and sellers, seller deadlines and automatic cancellation (ORD-004); seller order processing (ORD-005); partial fulfilment approval (ORD-006)
- Order numbering (ORD-007), reorder (ORD-008), invoices and consolidated receipt (ORD-009), order holds (ORD-010), cut-offs and service levels (ORD-011)
- Request for quotation on Misc.RFQ, quote negotiation and conversion, seller offers (ORD-012 to ORD-014)
- Requisition workflows, contract drafting, e-signature, amendments, repository, award letters, performance securities, contract-to-order execution (ORD-015 to ORD-022)
- Group buying, scheme applications, proforma invoice, Incoterms, sample orders, recurring orders (ORD-023 to ORD-028)

**Not in this module**

| Item | Where it is |
|---|---|
| Checkout, split into sub-orders per seller, checkout reference; the IOrderProcessingService override | CHK module (PRD-CHK-003 placement host, CHK-004 split, CHK-008; decision OVR-REG); ORD plugs in as a provider (IC-CHK-06 seller task at placement, IC-CHK-07 hold guard) |
| Payment status changes and escrow releases | PAY module (PRD-PAY-011, PAY-007); ORD publishes the acceptance event |
| Refund triggers and refund execution | RET module (PRD-RET-005, IC-RET-04) and PAY module (PRD-PAY-016); ORD raises no refund to PAY directly |
| Shipment-creation guard host (IShipmentService.InsertShipmentAsync override) | PAY module (PRD-PAY-006, decision OVR-REG); ORD-010 is a guard provider |
| Statutory e-invoicing submission and fiscal number | PAY module (PRD-PAY-025); PAY prints the fiscal data through its DOC token provider |
| Return requests and dispute cases | RET module (PRD-RET-001, RET-007) |
| Warehouse pick, pack and dispatch; seller batch pick and packing lists; seller pickup and drop-off | LOG module (PRD-LOG-009, LOG-011, LOG-022); ORD-005 starts them from the seller dashboard |
| Delivery fees and estimated delivery time | LOG module (PRD-LOG-001, LOG-002, LOG-005); ORD-011 supplies cut-offs and service levels |
| Workflow engine and approval queues | ADM module (PRD-ADM-002, ADM-006); ORD-015, 018, 024 run on them |
| Document templates, PDF rendering and the IPdfService override | DOC module (PRD-DOC-001, decision OVR-REG); ORD supplies document types, numbering, issue rules and tokens (IC-DOC-01, IC-DOC-02) |
| Notification sending (IWorkflowMessageService override) and templates | TRK module (PRD-TRK-005, IC-TRK-04); ORD raises the events |
| Audit store (before/after values) | SEC module (PRD-SEC-004); ORD-003 adds reason codes and approvals |
| Seller commission, settlements and penalties deduction | SEL module (PRD-SEL-016, SEL-017); ORD-004 records penalties |
| Disbursement of approved scheme support | PAY module (PRD-PAY-022) |
| Support SLAs | CRM module (PRD-CRM-001) |
| Report a problem on an order (support ticket with order details) and issue routing | CRM module (PRD-CRM-014); ORD order data is read by CRM (CRM-003) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-ORD-001 | Order management console | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-ORD-002 | Configurable order status model | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-ORD-003 | Order interventions with reason codes and audit | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-004 | |
| PRD-ORD-004 | Cancellation rules | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-ORD-005 | Seller order processing | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-ORD-006 | Partial fulfilment approval | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-ORD-007 | Order numbering | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-ORD-008 | Reorder | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-ORD-009 | Invoices | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-DOC-001 | DOC-LIB |
| PRD-ORD-010 | Order holds | B2B + B2C | P1 | Code-level | Custom plugin (DI override) | Core (always on) | | |
| PRD-ORD-011 | Cut-offs and service levels | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-ORD-012 | Request for quotation | B2B | P1 | Code-level | Custom plugin | B2B trade pack | | |
| PRD-ORD-013 | Quote negotiation and conversion | B2B | P1 | Code-level | Custom plugin | B2B trade pack | PRD-ORD-012 | |
| PRD-ORD-014 | Seller offers | B2B | P1 | Code-level | Custom plugin | B2B trade pack | | K-01 |
| PRD-ORD-015 | Configurable requisition workflows | B2B | P1 | Code-level | Custom plugin | B2B trade pack | PRD-ADM-002 | WF-ENG |
| PRD-ORD-016 | Contract drafting | B2B | P1 | Code-level | Custom plugin | B2B trade pack | PRD-DOC-001 | DOC-LIB |
| PRD-ORD-017 | Contract e-signature | B2B | P2 | External system | External system + integration plugin | B2B trade pack | PRD-ORD-016 | DOC-LIB |
| PRD-ORD-018 | Contract amendments | B2B | P2 | Code-level | Custom plugin | B2B trade pack | PRD-ADM-002 | WF-ENG |
| PRD-ORD-019 | Contract repository | B2B | P2 | Code-level | Custom plugin | B2B trade pack | | |
| PRD-ORD-020 | Award and acceptance letters | B2B | P2 | Code-level | Custom plugin | B2B trade pack | PRD-DOC-001 | DOC-LIB |
| PRD-ORD-021 | Performance securities | B2B | P3 | Code-level | Custom plugin | B2B trade pack | | |
| PRD-ORD-022 | Contract-to-order execution | B2B | P1 | Code-level | Custom plugin | B2B trade pack | PRD-ORD-016 | CALLOFF-PLACE, DOC-LIB |
| PRD-ORD-023 | Group buying | B2B + B2C | P2 | Code-level | Custom plugin | Engagement and loyalty pack | | |
| PRD-ORD-024 | Scheme applications | G2C / G2B | P3 | Code-level | Custom plugin | Agri-finance and schemes pack | PRD-ADM-002 | WF-ENG |
| PRD-ORD-025 | Proforma invoice | B2B | P1 | Code-level | Custom plugin | B2B trade pack | PRD-DOC-001 | PH-INF, DOC-LIB |
| PRD-ORD-026 | Incoterms | B2B | P1 | Code-level | Custom plugin | B2B trade pack | | PH-INF |
| PRD-ORD-027 | Sample orders | B2B | P2 | Code-level | Custom plugin | B2B trade pack | | |
| PRD-ORD-028 | Recurring and subscription orders | B2B + B2C | P2 | Code-level | Custom plugin | Engagement and loyalty pack | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper / business buyer | Follows order stages, cancels within policy, accepts delivered orders and partial supply, reorders, requests quotes, negotiates and accepts, responds to offers, submits requisitions, signs contracts, joins group deals | Registered (native) + B2B role (IAM-022) |
| Seller | Accepts, packs and hands over own sub-orders, rejects with reason, proposes partial supply, answers RFQs and counter-offers, posts offers | Vendors (native) + IAM-007 |
| Client order staff | Use the order console, record interventions with reasons, cancel, export | Client-specific role with native Orders.* permissions (configuration only, BR-IAM-050) |
| Approver (client manager) | Approves interventions that need a second person | Administrators by default; client roles get Orders.Core.Interventions.Approve through the configuration pack |
| Fraud and compliance staff | Place and release order holds | Role system name "Risk" (BR-IAM-050) |
| KTDA sales, export and legal staff | Process requisitions, draft and review contracts, issue proformas, award letters, manage contract execution | Client-specific roles mapped in the configuration pack (BR-IAM-050: client-specific roles are configuration only); role list to confirm (KG-16) |
| Programme staff (P3) | Review and approve scheme applications | Client-specific role mapped in the configuration pack; to confirm |
| Client administrator | Configures stages, reason codes, cancellation policy, numbering, service levels, invoice fields, Incoterms | Administrators (native) |
| E-signature provider (system, P2) | Collects signatures and returns signature evidence | External system via adapter (provider not named) |
| PAY, LOG, TRK, RET, CHK, DOC (system) | Consume order events (acceptance, holds, cancellations), host the overrides ORD plugs into (CHK-003, ORD-010, DOC-001), raise refunds (RET-005) and send messages (TRK-005) | Internal services |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Orders.OrdersView / Orders.OrdersCreateEditDelete / Orders.OrdersImportExport (native) | Orders | View, edit (with ORD-003 reason capture) and export or import orders | Administrators (native); client order-staff roles through the configuration pack |
| Orders.CurrentCartsManage (native) | Orders | View customers' current carts and wishlists | Administrators |
| Orders.ShipmentsView / Orders.ShipmentsCreateEditDelete (native) | Orders | View and create shipments (blocked by holds, ORD-010) | Administrators; Vendors (own orders) |
| Misc.RFQ.AccessRFQ.Admin.AccessRFQ / Misc.RFQ.AccessRFQ.PublicStore.AccessRFQ (native, bundled Misc.RFQ) | Orders | Admin and storefront access to requests and quotes | Administrators / Administrators, Registered |
| Orders.Core.Configuration.View | Configuration | View stage model, reason codes, cancellation policy, service levels, invoice fields, Incoterms | Administrators |
| Orders.Core.Configuration.CreateEditDelete | Configuration | Edit the items above (audited) | Administrators |
| Orders.Core.Status.Override | Orders | Use the native order-status change with a reason, and correct stages | Administrators |
| Orders.Core.Interventions.Approve | Orders | Approve interventions that need a second person; cannot approve own | Administrators |
| Orders.Core.Holds.CreateEditDelete | Orders | Place and release order holds | Risk |
| Orders.Core.SellerOrders.Process | Orders | Accept, pack, hand over, reject and propose partial supply for own sub-orders; respond to RFQ invitations and counter-offers; post offers | Vendors |
| Orders.Core.Offers.Approve | Orders | Review and approve offers before publication | Administrators |
| Orders.Core.Contracts.View | Orders | View requisitions, contracts, letters, securities and the repository | Administrators |
| Orders.Core.Contracts.CreateEditDelete | Orders | Process requisitions, draft, amend and issue contracts, letters and proformas, manage call-offs and securities | Administrators |
| Orders.Core.Programmes.CreateEditDelete | Orders | Configure group deals and schemes; review scheme applications | Administrators |

ORD permissions are declared in an ORD plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix Orders.Core and the 5.00 view / create-edit-delete split (StandardPermission naming unchanged in 5.00.1); Category is from the native set. Native order, shipment and Misc.RFQ permissions are reused. Holding the native Orders.OrdersCreateEditDelete alone does not bypass reason capture: native admin order-edit actions are intercepted by the ORD action filter (BR-ORD-020); payment actions stay with PAY (BR-PAY-082). Native admin order actions are blocked for vendors in code (OrderController GetCurrentVendorAsync checks), so seller actions are ORD plugin endpoints with an ownership check. Default roles by system name use only native roles and the product role catalogue BR-IAM-050 (Risk); a catalogue role that is missing is created by the IAM plugin (BR-IAM-050); ORD relies on no other start-up role creation. The intervention approver and the KTDA sales, export, legal and programme roles are client-specific: they are configuration only (BR-IAM-050) and receive these permissions through the client configuration pack; ORD proposes no new product role. All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-ORD-PERM-01 | **Given** a user without Orders.OrdersView / Orders.OrdersCreateEditDelete / Orders.OrdersImportExport (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-02 | **Given** a user without Orders.CurrentCartsManage (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-03 | **Given** a user without Orders.ShipmentsView / Orders.ShipmentsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-04 | **Given** a user without Misc.RFQ.AccessRFQ.Admin.AccessRFQ / Misc.RFQ.AccessRFQ.PublicStore.AccessRFQ (native, bundled Misc.RFQ), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-05 | **Given** a user without Orders.Core.Configuration.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-06 | **Given** a user without Orders.Core.Configuration.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-07 | **Given** a user without Orders.Core.Status.Override, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-08 | **Given** a user without Orders.Core.Interventions.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-09 | **Given** a user without Orders.Core.Holds.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-10 | **Given** a user without Orders.Core.SellerOrders.Process, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-11 | **Given** a user without Orders.Core.Offers.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-12 | **Given** a user without Orders.Core.Contracts.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-13 | **Given** a user without Orders.Core.Contracts.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ORD-PERM-14 | **Given** a user without Orders.Core.Programmes.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-ORD-001 | Admin order list/search, order edit, notes, order/payment/shipping status changes, Excel/XML export, Excel import, PDF invoices, packaging slips; current carts and wishlists page. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:ExportExcelAll, ExportXmlAll, ImportFromXlsx, PdfInvoice, PdfPackagingSlip; src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.AutoUpdateOrderTotalsOnEditingOrder; src/Presentation/Nop.Web/Areas/Admin/Controllers/ShoppingCartController.cs:CurrentCarts; PG ADM-S03 | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-002 | Fixed OrderStatus enum: Pending, Processing, Complete, Cancelled (plus fixed payment/shipping statuses). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderStatus.cs:OrderStatus | Client-defined stages and allowed transitions as a sub-status entity mapped to the 4 native OrderStatus values (Pending, Processing, Complete, Cancelled). Changing the OrderStatus enum is prohibited. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-003 | Order notes; activity log of admin edits. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderNote.cs:OrderNote; src/Libraries/Nop.Core/Domain/Logging/ActivityLog.cs:ActivityLog | Reason codes, approvals, before/after snapshots, concurrency control, stage snapshots. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-004 | Admin cancel; 4.90 adds customer self-cancel (AllowCustomersCancelOrders). CanCancelOrder only checks status != Cancelled. \| NEW in 5.00: AutoCancelOrdersTask auto-cancels unpaid orders (PaymentStatus Pending, OrderStatus Pending/Processing) after OrderSettings.AutoCancelDelay minutes, with excluded payment methods and optional restore of items to the cart. \|\| 5.00.1 evidence: Libraries/Nop.Services/Orders/AutoCancelOrdersTask.cs:63-120; Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:184-204; Libraries/Nop.Services/Installation/InstallRequiredData.cs:3587; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.AllowCustomersCancelOrders; src/Presentation/Nop.Web/Controllers/OrderController.cs:CancelOrder; src/Libraries/Nop.Services/Orders/OrderProcessingService.cs:OrderProcessingService.CanCancelOrder; src/Presentation/Nop.Web/App_Data/Localization/defaultResources.nopres.xml Order.Cancel | Policy windows, cancellation reasons, seller cancel and auto-cancel on a missed SELLER deadline remain custom (5.00 auto-cancel is payment-timeout only). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-005 | Vendor admin area shows orders containing vendor products; vendor order-placed/paid/cancelled emails. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:HasAccessToOrderAsync; message templates OrderPlaced.VendorNotification, OrderPaid.VendorNotification; PG CAT-06 | Accept, pack and hand-over steps per seller. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-006 | Partial shipments (ShippingStatus.PartiallyShipped). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/ShippingStatus.cs:ShippingStatus.PartiallyShipped | Buyer acceptance of partial supply. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-007 | Custom order number mask with tokens {ID}, {YYYY}, {YY}, {MM}, {DD}. \| Re-verified in 5.00.1: zero-padding code still commented out in CustomNumberFormatter.GenerateOrderCustomNumber. \|\| 5.00.1 evidence: Libraries/Nop.Services/Orders/CustomNumberFormatter.cs:73-101; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.CustomOrderNumberMask; src/Libraries/Nop.Services/Orders/CustomNumberFormatter.cs:CustomNumberFormatter.GenerateOrderCustomNumber | Zero-padded sequence (e.g. MP-2026-000123) is not supported: the padding code is commented out in CustomNumberFormatter. Override ICustomNumberFormatter via DI in a plugin. (Mask without padding, e.g. MP-{YYYY}-{ID}, is configuration.) | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-008 | Re-order button re-adds items to cart through standard cart validation (stock/price rechecked). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.IsReOrderAllowed; src/Libraries/Nop.Services/Orders/OrderProcessingService.cs:OrderProcessingService.ReOrderAsync | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-009 | PDF invoice per order and per vendor; logo, two footer text columns, attach to emails. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Common/IPdfService.cs:IPdfService.PrintOrderToPdfAsync(vendor); src/Libraries/Nop.Core/Domain/Common/PdfSettings.cs:PdfSettings.InvoiceFooterTextColumn1, LogoPictureId; PG ORD-01, ORD-02, ORD-03 | Structured company/tax fields, seller identity and fees, combined receipt. Post Gebeya invoice extensions ORD-01/ORD-02 are AFR: AFR port required. IPdfService override in custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-010 | None (no hold state). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderStatus.cs:OrderStatus (no hold) | Hold/release blocking shipment. Custom plugin. ORD-010 is the core host of the IShipmentService.InsertShipmentAsync override and the Admin AddShipment filter (BR-ORD-055, IC-ORD-11 guard providers; decision OVR-REG). | Custom plugin (DI override) | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-011 | Delivery date ranges and transit days only. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/DeliveryDate.cs:DeliveryDate; src/Plugins/Nop.Plugin.Pickup.PickupInStore/Domain/StorePickupPoint.cs:StorePickupPoint.TransitDays | Daily cut-off times and handling SLAs per delivery service. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-012 | NEW in 4.90: bundled Misc.RFQ plugin (v4.90.15). Customer turns cart into a request for quote (requested qty/unit price, notes); store owner creates/sends a quote with offered qty/price and expiry; accepted quote prices apply in cart and become an order. \| 5.00: Misc.RFQ v5.00.18 adds CAPTCHA on the request page and customer quote PDF (RfqSettings.ShowCaptchaOnRequestPage, AllowCustomerGenerateQuotePdf). Still store-owner only: no vendor routing in plugin source. \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Misc.RFQ/RfqSettings.cs:13-23; Plugins/Nop.Plugin.Misc.RFQ/Services/RfqService.cs:907 PrintQuoteToPdfAsync; 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Misc.RFQ/Domains/RequestQuote.cs:RequestQuote; src/Plugins/Nop.Plugin.Misc.RFQ/Domains/Quote.cs:Quote.ExpirationDateUtc, OrderId; src/Plugins/Nop.Plugin.Misc.RFQ/Domains/QuoteItem.cs:QuoteItem.RequestedUnitPrice, OfferedUnitPrice; src/Plugins/Nop.Plugin.Misc.RFQ/Services/RfqService.cs:CreateRequestQuoteByShoppingCartAsync; src/Plugins/Nop.Plugin.Misc.RFQ/Services/EventConsumer.cs (GetShoppingCartItemUnitPriceEvent); PG STF-26 | Store-owner only: no routing to sellers/vendors, no structured terms, no clarification Q&A shared with invited sellers, catalog products only (no custom items). Extend Misc.RFQ in a custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-013 | Misc.RFQ: quote expiry (QuoteStatus.Expired), conversion to order (QuoteStatus.OrderCreated), buyer's requested price vs offered price. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Misc.RFQ/Domains/QuoteStatus.cs:QuoteStatus (CreatedFromRequestQuote, CreatedManuallyByStoreOwner, Submitted, OrderCreated, Expired) | Side-by-side comparison of several sellers' quotes, counter-offers within limits, K-01 buyer bids. Custom plugin extending Misc.RFQ. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-014 | Products can be scheduled via availability start/end dates; RFQ quotes can be created manually by store owner. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.AvailableStartDateTimeUtc; src/Plugins/Nop.Plugin.Misc.RFQ/Domains/QuoteStatus.cs:CreatedManuallyByStoreOwner | Seller offer posting, buyer responses, internal review. Custom plugin (scope per decision K-01). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-015 | None. \| 5.00: bundled Misc.PunchOut (cXML) integrates with external buyer e-procurement systems; it does not provide request forms or internal approval steps in nopCommerce. \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Misc.PunchOut/plugin.json; 4.90 evidence re-verified present in 5.00.1: No workflow entity in src/Libraries/Nop.Core/Domain | Request forms with multi-step internal approval. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-016 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No contract entity in src/Libraries/Nop.Core/Domain | Contract templates, generation, internal review. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-017 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No signature integration in src/Plugins | External e-signature provider (signing, signer evidence, quorum rules such as 3 of 5). nopCommerce needs an integration plugin to send contracts and record signatures. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: signing is performed by an external provider per the feature description |
| PRD-ORD-018 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No contract entity in src/Libraries/Nop.Core/Domain | Contract versions, approval, redline view. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-019 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No contract entity in src/Libraries/Nop.Core/Domain | Searchable contract store with export. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-020 | Message templates/queued email can send documents. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Messages/MessageTemplate.cs:MessageTemplate | Award/acceptance letter generation and deadline tracking. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-021 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No security/guarantee entity in src/Libraries/Nop.Core/Domain | Bank guarantee register, validity tracking, release/claim. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-022 | Recurring products and admin 'process next payment' exist but are not contract call-offs. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/RecurringPayment.cs:RecurringPayment | Contract-to-scheduled-orders/call-offs/milestones. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-023 | Tier prices apply per individual cart quantity only. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/TierPrice.cs:TierPrice | Pooled group orders with target quantity and retro price. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-024 | Customer roles and customer attributes can hold eligibility data. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Customers/CustomerAttribute.cs:CustomerAttribute | Application intake, eligibility checks, review/approval within budget. Custom plugin (eligibility sources may be external registries — not stated). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-ORD-025 | PDF invoice for placed orders only (option to disable for pending orders); RFQ quotes have no PDF. \| NEW in 5.00: Misc.RFQ can produce a quote PDF for the customer (RfqSettings.AllowCustomerGenerateQuotePdf; RfqService.PrintQuoteToPdfAsync). \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Misc.RFQ/RfqSettings.cs:23; Plugins/Nop.Plugin.Misc.RFQ/Services/RfqService.cs:907; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Common/IPdfService.cs:IPdfService.PrintOrderToPdfAsync; src/Libraries/Nop.Core/Domain/Common/PdfSettings.cs:PdfSettings.DisablePdfInvoicesForPendingOrders | Proforma PDF from the cart is not native; quote PDF exists but is not a proforma invoice layout (proforma fields not verified). Custom plugin (IPdfService extension) for cart proforma and proforma layout. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-026 | A checkout attribute (dropdown) can record an Incoterm on orders. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/CheckoutAttribute.cs:CheckoutAttribute; src/Plugins/Nop.Plugin.Misc.RFQ/Domains/Quote.cs:Quote | Incoterm on quotes and in transport-responsibility logic. Custom plugin extending Misc.RFQ. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-027 | Sample can be a separate product/variant with per-order max quantity; sample downloads exist only for downloadable products. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.OrderMaximumQuantity | Limit per buyer across orders is not native. Custom plugin (cart warning). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ORD-028 | Recurring products (cycle length/period/total cycles), recurring payment records, admin 'process next payment' and cancel; recurring email notifications. \| NEW in 5.00: next-recurring-payment reminder email (OrderSettings.NextRecurringPaymentNotificationDays; template NextRecurringPaymentNotification.CustomerNotification). Still no scheduled task processing due recurring payments; bundled methods: PayPalCommerce RecurringPaymentType.Manual, CheckMoneyOrder NotSupported; Payments.Manual removed. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:209; Libraries/Nop.Services/Orders/OrderProcessingService.cs:1559-1567; Libraries/Nop.Services/Installation/InstallRequiredData.cs:3488-3587 (default tasks); Plugins/Nop.Plugin.Payments.PayPalCommerce/PayPalCommercePaymentMethod.cs:568; Plugins/Nop.Plugin.Payments.CheckMoneyOrder/CheckMoneyOrderPaymentProcessor.cs:317; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.IsRecurring, RecurringCycleLength, RecurringCyclePeriodId; src/Presentation/Nop.Web/Areas/Admin/Controllers/RecurringPaymentController.cs:ProcessNextPayment; src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.ProcessRecurringPaymentAsync; src/Libraries/Nop.Services/Installation/InstallRequiredData.cs (schedule tasks) | Automatic repetition: no scheduled task processes due recurring payments (default tasks list has none) and bundled methods are RecurringPaymentType.Manual or NotSupported. Custom plugin: scheduled task + adapters implementing ProcessRecurringPaymentAsync (mobile money/card). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-ORD-001 Order management console

| Item | Value |
|---|---|
| Description (baseline) | A screen where staff find, view and edit orders, add notes, change status, export or import orders and print invoices and packing slips. Staff can also see customers' current carts and wishlists to help them. |
| Why it matters | Staff manage every order from one place. |
| Who benefits | Client staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-001-01 | As a member of client order staff, I want to find, view and edit orders, add notes and print invoices and packing slips from one console, so that I manage every order in one place. | D; REQ-MPC-FR-156 | Ready |
| US-ORD-001-02 | As an authorised user, I want to export orders filtered by date, status and seller, so that I can analyse orders offline and report. | REQ-MPC-FR-174 | Ready |
| US-ORD-001-03 | As a member of client order staff, I want to see customers' current carts and wishlists, so that I can help customers who are stuck. | D | Ready |
| US-ORD-001-04 | As a member of client order staff, I want one view of an order with its stages, notes, audit, payments, shipments and documents, so that I see the full history without searching. | FC-M04-009 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-001-01-01 | US-ORD-001-01 | **Given** the user has Orders.OrdersView, **when** the user opens the order list, **then** orders can be filtered by created date, order status, stage (ORD-002), payment status, shipping status, store, seller, payment method, product, billing email, phone and country, and order number; each row opens the order. | D; FIT (Admin OrderController.List) |
| AC-ORD-001-01-02 | US-ORD-001-01 | **Given** the user has Orders.OrdersCreateEditDelete, **when** the user makes any edit on the order page, **then** the edit needs a reason code (ORD-003) before it is saved. | REQ-MPC-FR-156; BR-ORD-020 |
| AC-ORD-001-01-03 | US-ORD-001-01 | **Given** an order is open, **when** the user prints, **then** the PDF invoice (ORD-009) and the packing slips of its shipments are produced. | D; FIT (PdfInvoice, PdfPackagingSlip) |
| AC-ORD-001-02-01 | US-ORD-001-02 | **Given** the user has Orders.OrdersImportExport and has filtered the list by date, status and seller, **when** the user exports all to Excel or XML, **then** the file contains exactly the filtered orders. | REQ-MPC-FR-174; FIT (ExportExcelAll / ExportXmlAll take the search model) |
| AC-ORD-001-02-02 | US-ORD-001-02 | **Given** the user lacks Orders.OrdersImportExport, **when** the user tries to export, **then** access is denied and no file is produced. | REQ-MPC-FR-174; FIT ([CheckPermission]) |
| AC-ORD-001-03-01 | US-ORD-001-03 | **Given** the user has Orders.CurrentCartsManage, **when** the user opens Current shopping carts, **then** each customer's cart and wishlist items are listed. | D; FIT (Admin ShoppingCartController.CurrentCarts) |
| AC-ORD-001-04-01 | US-ORD-001-04 | **Given** an order is opened, **when** the order page loads, **then** it shows the current stage and stage history, notes, intervention and audit entries, payment transactions (link to PAY-019), shipments, holds and generated documents. | FC-M04-009; Proposed |
| AC-ORD-001-01-04 | US-ORD-001-01 | **Given** the order list is shown, **when** it loads, **then** each row shows stage and service-level due time (ORD-011) so overdue orders can be sorted first. | FC-M04-006; Proposed |

**Business rules applied:** BR-ORD-020 (§8.1).


### 7.2 PRD-ORD-002 Configurable order status model

| Item | Value |
|---|---|
| Description (baseline) | The client defines its own order stages and which moves between stages are allowed. |
| Why it matters | Order handling matches each client's real process. |
| Who benefits | Clients |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: MSG-ROUTE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-002-01 | As a client administrator, I want to define our own order stages and the moves allowed between them, so that order handling matches our process. | D; REQ-MPC-FR-153; FC-M03-020 | Ready; conditions: MSG-ROUTE |
| US-ORD-002-02 | As a member of client order staff, I want moves that are not allowed to be blocked and logged, so that orders never reach an invalid state. | FC-M03-021 | Ready; conditions: MSG-ROUTE |
| US-ORD-002-03 | As a shopper, I want to see the current stage of my order, so that I know where it stands. | REQ-MPC-FR-153 | Ready; conditions: MSG-ROUTE |
| US-ORD-002-04 | As a business buyer, I want to confirm that I accept a delivered order, so that the seller can be paid and the order closed. | Proposed ( from PAY-007) | Ready; conditions: MSG-ROUTE |
| US-ORD-002-05 | As a client administrator, I want to decide when an order counts as confirmed, so that confirmation follows our rules. | REQ-KTDA-WF-006 | Ready; conditions: MSG-ROUTE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-002-01-01 | US-ORD-002-01 | **Given** the administrator defines stages, each mapped to the native OrderStatus values it may coexist with (Pending, Processing, Complete, Cancelled), and the allowed transitions, **when** the model is saved, **then** it is accepted only if every stage maps to at least one native value and every transition is between defined stages; the OrderStatus enum is not changed (BR-ORD-010). | REQ-MPC-FR-153; FC-M03-020; FIT (OrderStatus has 4 values) |
| AC-ORD-002-01-02 | US-ORD-002-01 | **Given** the Malawi Post stage set (Created, Awaiting Payment, Paid, Processing, Shipped, Ready for Pickup, Delivered, Completed, Cancelled, Returned, Refunded) is loaded from the configuration pack, **when** orders progress, **then** orders show these stages with the native status they map to. | REQ-MPC-FR-153 |
| AC-ORD-002-01-03 | US-ORD-002-01 | **Given** auto-advance rules link stages to native events (order placed, payment pending, OrderPaidEvent, ShipmentSentEvent, ShipmentReadyForPickupEvent, ShipmentDeliveredEvent, OrderStatusChangedEvent to Complete or Cancelled, OrderRefundedEvent, RET Return.Completed (BR-RET-064)), **when** the native or module event occurs, **then** the stage moves to the linked stage if that transition is declared; otherwise the order goes to the stage exceptions list (BR-ORD-012). | REQ-MPC-FR-153; FIT (events published by OrderProcessingService and Shipping EventPublisherExtensions) |
| AC-ORD-002-02-01 | US-ORD-002-02 | **Given** a manual stage change requests a transition that is not declared, **when** the user submits it, **then** it is refused with message Ord.TransitionNotAllowed, the stage is unchanged and the attempt is logged with user, order, from, to and time (AUD-ORD-002). | FC-M03-021 |
| AC-ORD-002-02-02 | US-ORD-002-02 | **Given** a manual stage change targets a stage mapped to a different native status, **when** the user submits it, **then** the change is made only through the native service (CancelOrderAsync for Cancelled); other native status changes come only from payment and shipping actions, so the stage change is refused with message Ord.TransitionNotAllowed (BR-ORD-011). | FC-M03-021; FIT |
| AC-ORD-002-02-03 | US-ORD-002-02 | **Given** a user posts the native admin order-status change (Admin OrderController.ChangeOrderStatus, which sets OrderStatusId directly), **when** the request arrives, **then** the ORD action filter allows it only with Orders.Core.Status.Override and a reason, re-aligns the stage to a stage mapped to the new status, and audits it (AUD-ORD-001); otherwise it is refused with message Ord.ReasonRequired. | FIT (ChangeOrderStatus, OrderController.cs:891 in 5.00.1; no ModelState check) |
| AC-ORD-002-03-01 | US-ORD-002-03 | **Given** a stage is marked visible to customers, **when** the stage changes, **then** My account order details show the localised stage name and date, and ORD raises the stage event code through IC-TRK-04 SendEvent so that TRK-005 sends the stage message on the configured channels (status changes of the native templates already pass through the TRK-005 engine). | REQ-MPC-FR-153 |
| AC-ORD-002-03-02 | US-ORD-002-03 | **Given** the ORD plugin is installed, or an administrator saves a stage that is visible to customers and set to notify, **when** installation runs or the stage is saved, **then** ORD registers each of its product event codes (names Proposed, listed in BR-TRK-023: Ord.Core.StageChanged, Ord.Core.Cancelled, Ord.Core.SellerDeadlineReminder, Ord.Core.PartialSupplyProposed, Ord.Core.SlaEscalation, Ord.Core.RfqInvitation, Ord.Core.RfqAnswered, Ord.Core.QuoteReceived, Ord.Core.CounterOffer, Ord.Core.QuoteDeclined, Ord.Core.QuoteExpired, Ord.Core.RequisitionDecided, Ord.Core.ContractForReview, Ord.Core.ContractForSigning, Ord.Core.LetterIssued, Ord.Core.SecurityExpiring, Ord.Core.GroupDealOutcome) through IC-TRK-04 RegisterEventCode with default channels and localised default content, and stores the code in OrderStageDefinition.TrkEventCode; a stage cannot be set to notify without a registered code. | Proposed; (BR-TRK-023); MSG-ROUTE |
| AC-ORD-002-04-01 | US-ORD-002-04 | **Given** acceptance is enabled for the order and the order is in the stage mapped to delivery, **when** the buyer selects Accept order in My account, **then** the stage moves to Accepted, OrderAcceptedEvent (new, BR-ORD-013) is published and the action is audited (AUD-ORD-003). | Proposed ( PAY-007) |
| AC-ORD-002-04-02 | US-ORD-002-04 | **Given** an acceptance window is configured (setting, default not stated) and a delivered order has no acceptance and no open dispute, **when** the window passes, **then** the ORD scheduled task records deemed acceptance and publishes OrderAcceptedEvent with Deemed = true; if no window is configured there is no deemed acceptance. | Proposed |
| AC-ORD-002-04-03 | US-ORD-002-04 | **Given** a dispute case is open for the order (RET-007), **when** the buyer or the task tries to record acceptance, **then** ORD calls IC-RET-01 HasOpenCase inside the order lock; acceptance is refused with message Ord.AcceptanceBlockedByDispute until the case is resolved. | Proposed; BR-PAY-031 |
| AC-ORD-002-05-01 | US-ORD-002-05 | **Given** the client configures the confirmation rule (at placement, at payment, or after seller or staff acceptance), **when** the condition is met, **then** the order moves to stage Confirmed and the confirmation notification is sent. | REQ-KTDA-WF-006; Proposed (rule options) |
| AC-ORD-002-01-04 | US-ORD-002-01 | **Given** a stage definition carries an operational stage code for ADM-007 (AwaitingPickup, AwaitingSorting, AwaitingDispatch, OutForLastMileDelivery), **when** ADM-007 builds its operational order view, **then** each order is placed in the operational stage of its current stage; where the stage alone does not decide it, the rule BR-ORD-015 uses shipment data (no shipment; shipment created and not shipped; Shipment.ShippedDateUtc set and DeliveryDateUtc empty); the Malawi Post mapping values are configuration and are not stated in source (MG-06). | see ADM-007 (REQ-MPC-FR-162); FIT (Shipment dates; Order.ShippingStatus); Proposed |
| AC-ORD-002-01-05 | US-ORD-002-01 | **Given** a line stage set is configured for a product type (the service stage set SM-SVC-01 of SVC-005 is the default for service lines), **when** an order with such a line is placed, **then** the line module starts its line stage at the first stage of the configured set (for service lines SVC-005 ServiceOrderStage) and asks ORD (IC-ORD-10 ValidateLineTransition) before every change; an undeclared transition is refused; the per-line state, its history and its event (Service.StageChanged) stay with the line module (BR-ORD-014). | D; Proposed (keeps the per-line store) |
| AC-ORD-002-01-06 | US-ORD-002-01 | **Given** an order has no shippable item (ShippingStatus ShippingNotRequired), **when** its payment is completed and native CheckOrderStatusAsync sets OrderStatus Complete, **then** the order stage moves only as far as the stage mapped to native Complete for that order type allows, and progress of its lines is carried by the line stages of the line module (SVC-005 for services); what happens to the native OrderCompleted.CustomerNotification for such orders (send, suppress or substitute) is the per-client action of TRK-005 for the order kind (BR-TRK-024, order-kind providers IC-TRK-05 of EGV and SVC); ORD sends, suppresses and rewords nothing. | FIT (OrderProcessingService.CheckOrderStatusAsync 1503-1509);,; MSG-ROUTE |

**Business rules applied:** BR-ORD-010; BR-ORD-011; BR-ORD-012; BR-ORD-013; BR-ORD-014; BR-ORD-015 (§8.1).


### 7.3 PRD-ORD-003 Order interventions with reason codes and audit

| Item | Value |
|---|---|
| Description (baseline) | Any manual change to an order needs a reason, is approved where required, and is recorded permanently with before-and-after snapshots. Simultaneous actions on the same order are handled safely and in the right sequence, and a snapshot of the order is saved at key stages such as settlement and close-out. |
| Why it matters | Full accountability for order changes. |
| Who benefits | Auditors; client managers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEC-004 |
| Status | Ready; conditions: ORD-INTERV |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-003-01 | As a member of client order staff, I want every manual change to an order to need a reason code, so that changes are accountable. | D; REQ-MPC-FR-156 | Ready; conditions: ORD-INTERV |
| US-ORD-003-02 | As an auditor, I want a permanent record of every state change and key field change with before and after values, so that I can prove what happened. | D; REQ-MPC-FR-175 | Ready; conditions: ORD-INTERV |
| US-ORD-003-03 | As a client manager, I want sensitive changes to need my approval, so that mistakes and fraud are caught. | D; FC-M03-024 | Ready; conditions: ORD-INTERV |
| US-ORD-003-04 | As a member of client order staff, I want simultaneous actions on one order to be handled safely and in order, so that no change is lost. | D; FC-M03-022 | Ready; conditions: ORD-INTERV |
| US-ORD-003-05 | As an auditor, I want a snapshot of the order at key stages, so that I can see the order as it was at settlement or close. | D; FC-M03-023 | Ready; conditions: ORD-INTERV |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-003-01-01 | US-ORD-003-01 | **Given** a user posts a native admin order edit (ChangeOrderStatus, CancelOrder, EditOrderTotals, EditOrderItem, DeleteOrderItem, EditShippingMethod, AddressEdit, AddProductToOrderDetails, OrderNoteDelete, Delete), **when** the request arrives without a reason code, **then** the ORD global action filter refuses it with message Ord.ReasonRequired and nothing changes. | REQ-MPC-FR-156; FIT (these actions take ids or forms; a ModelReceivedEvent veto would not run) |
| AC-ORD-003-01-02 | US-ORD-003-01 | **Given** the request carries a reason code from the configured list (and a comment where the code requires one), **when** the edit is applied, **then** the reason is stored as an OrderIntervention linked to the audit entry (AUD-ORD-001); payment actions are not handled here but by PAY (BR-PAY-082). | REQ-MPC-FR-156 |
| AC-ORD-003-02-01 | US-ORD-003-02 | **Given** any order state changes (OrderStatus, PaymentStatus, ShippingStatus, stage) or a key field changes (totals, items, addresses, shipping method), **when** the change is saved, **then** the SEC-004 audit trail records user, time, before and after values, and the ORD reason code; audit entries cannot be edited or deleted by any role. | REQ-MPC-FR-175; NFR-X-003 |
| AC-ORD-003-02-02 | US-ORD-003-02 | **Given** an order note is deleted, **when** the deletion is posted, **then** a reason is required and the deleted note text is kept in the audit entry (AUD-ORD-001). | REQ-MPC-FR-175 |
| AC-ORD-003-03-01 | US-ORD-003-03 | **Given** an intervention type is configured as needing approval (for example order total edit or status override), **when** a user submits it, **then** it is held as a Pending intervention (SM-ORD-11) with message Ord.ApprovalPending; it is applied only when a different user with Orders.Core.Interventions.Approve approves it; rejection needs a reason. | FC-M03-024; Proposed |
| AC-ORD-003-04-01 | US-ORD-003-04 | **Given** two users act on the same order at the same time, **when** both actions run, **then** each runs under ILocker key 'pay-order-{OrderId}' (the shared order key of BR-PAY-013); the second re-reads the order and is refused with message Ord.OrderBusy if the lock is held or its expected state no longer holds. | FC-M03-022; FIT (ILocker.PerformActionWithLockAsync returns false when the lock is held) |
| AC-ORD-003-05-01 | US-ORD-003-05 | **Given** the order reaches a stage configured for snapshots (for example Paid, Completed, Cancelled), **when** the stage is set, **then** a read-only JSON snapshot of the order, items, totals, addresses, stage, payment and shipping status is stored (OrderSnapshot). | FC-M03-023; Proposed |

**Business rules applied:** BR-ORD-020; BR-ORD-021 (§8.1).


### 7.4 PRD-ORD-004 Cancellation rules

| Item | Value |
|---|---|
| Description (baseline) | Buyers and sellers cancel orders according to policy, giving a reason; orders are cancelled automatically if a seller misses its deadline. |
| Why it matters | Fair, consistent cancellations. |
| Who benefits | Shoppers; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-004-01 | As a buyer, I want to cancel my order before fulfilment starts, giving a reason, so that I am not charged for something I no longer want. | D; REQ-MPC-FR-154 | Ready |
| US-ORD-004-02 | As a seller, I want to cancel or reject an order I cannot fulfil, with a reason code, so that buyers are told quickly. | D; REQ-MPC-FR-155 | Ready |
| US-ORD-004-03 | As a client administrator, I want to set seller fulfilment deadlines with automatic cancellation and penalties, so that sellers meet the marketplace rules. | REQ-MPC-FR-170 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-004-01-01 | US-ORD-004-01 | **Given** native OrderSettings.AllowCustomersCancelOrders is off, ORD buyer cancellation is on, the order has no shipment and its seller task is not Packed or HandedOver, and the cancellation window (setting, default not stated) has not passed, **when** the buyer selects Cancel order and chooses a reason, **then** under the order lock the platform calls CancelOrderAsync(order, notifyCustomer: true) and stores the reason (AUD-ORD-001); if the order was paid, the refund follows from RET-005 (its consumer of the native OrderStatusChangedEvent raises a Cancellation refund trigger and PAY-016 moves the money); ORD raises no refund itself. | REQ-MPC-FR-154; FIT (native self-cancel takes no reason and only checks status != Cancelled) |
| AC-ORD-004-01-02 | US-ORD-004-01 | **Given** fulfilment has started or the window has passed, **when** the buyer opens the order or posts a cancellation, **then** the Cancel button is not shown and a posted cancellation is refused with message Ord.CancelNotAllowed. | REQ-MPC-FR-154 |
| AC-ORD-004-02-01 | US-ORD-004-02 | **Given** a seller with Orders.Core.SellerOrders.Process owns the sub-order, **when** the seller rejects it with a reason code (for example out of stock), **then** the platform cancels it through CancelOrderAsync, the buyer is notified, any penalty rule is applied, and a paid sub-order is refunded through RET-005 (Cancellation trigger) as in criterion 01-01. | REQ-MPC-FR-155; FIT |
| AC-ORD-004-02-02 | US-ORD-004-02 | **Given** a seller rejects without a reason code, **when** the request is posted, **then** it is refused with message Ord.ReasonRequired. | REQ-MPC-FR-155 |
| AC-ORD-004-03-01 | US-ORD-004-03 | **Given** a seller acceptance deadline is configured (hours after payment or placement, default not stated), **when** a seller task is still New when the deadline passes, **then** the ORD scheduled task re-checks the state under the order lock and cancels the sub-order with reason "Seller deadline missed"; the buyer is notified and a paid sub-order is refunded through RET-005 (Cancellation trigger). | REQ-MPC-FR-170 |
| AC-ORD-004-03-02 | US-ORD-004-03 | **Given** a penalty rule is configured (type and amount, default not stated), **when** a sub-order is cancelled for a missed deadline or a seller rejection, **then** a SellerPenalty record is created and passed to SEL through IC-SEL-05 AddSellerCharge (source type Penalty); SEL-017 deducts it in the next settlement. | REQ-MPC-FR-170; Proposed |
| AC-ORD-004-02-03 | US-ORD-004-02 | **Given** a seller cannot supply only some lines, **when** the seller reports them, **then** the partial-supply flow of ORD-006 applies instead of a full rejection. | see ORD-006 (REQ-MPC-FR-158) |
| AC-ORD-004-03-03 | US-ORD-004-03 | **Given** the native automatic cancellation of unpaid orders (OrderSettings.AutoCancelEnabled, new in 5.00, install default off) is considered for a client, **when** the cancellation rules are configured, **then** it is used for no ORD-004 rule: it cancels only orders with PaymentStatus Pending (OrderStatus Pending or Processing) after one delay, through CancelOrderAsync; seller-deadline cancellation, reasons, windows and penalties stay ORD-004 builds, and the setting stays off under BR-PAY-170 while INV-004 owns the unpaid-order timeout. | VER-500; FIT (AutoCancelOrdersTask.cs:56-75; OrderSettings.cs:184-204; InstallRequiredData.cs:1895) |

**Business rules applied:** BR-ORD-030; BR-ORD-031 (§8.1).


### 7.5 PRD-ORD-005 Seller order processing

| Item | Value |
|---|---|
| Description (baseline) | Sellers accept orders, pack them and hand them over for delivery from their own dashboard, and receive notifications. |
| Why it matters | Sellers fulfil marketplace orders efficiently. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-005-01 | As a seller, I want a dashboard of my incoming orders and the actions due (accept, pack, hand over), so that I fulfil marketplace orders efficiently. | D; REQ-MPC-FR-152 | Ready; conditions: C-SELLER |
| US-ORD-005-02 | As a seller, I want notifications for new orders, payment confirmation and approaching deadlines, so that I never miss an order. | REQ-MPC-FR-160 | Ready; conditions: C-SELLER |
| US-ORD-005-03 | As a seller, I want to print pick lists and packing lists for several orders at once, so that I process orders in batches. | REQ-MPC-FR-168 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-005-01-01 | US-ORD-005-01 | **Given** a vendor user with Orders.Core.SellerOrders.Process, **when** the seller opens the dashboard, **then** own sub-orders are listed with task status (New, Accepted, Packed, HandedOver), stage, due time (ORD-011) and holds. | REQ-MPC-FR-152 |
| AC-ORD-005-01-02 | US-ORD-005-01 | **Given** a task is New and the order is paid or authorised, or its payment method is in the "fulfil before payment" list (for example COD, on account), **when** the seller selects Accept, **then** the task becomes Accepted (SM-ORD-02). | REQ-MPC-FR-152; Proposed (payment condition) |
| AC-ORD-005-01-03 | US-ORD-005-01 | **Given** a task is Accepted, **when** the seller selects Packed, **then** the task becomes Packed. | REQ-MPC-FR-152 |
| AC-ORD-005-01-04 | US-ORD-005-01 | **Given** a task is Packed and a shipment exists for its items (native AddShipment, allowed to vendors for their own items), **when** the seller selects Hand over, **then** the task becomes HandedOver and each step is audited (AUD-ORD-004); for a seller that ships with its own carrier the platform calls IOrderProcessingService.ShipAsync for the shipment; for a seller fulfilled through the postal network (LOG-008 allocation) hand-over starts a LOG-011 seller pickup request or a LOG-022 drop-off, and the shipment status then changes only through TRK-002 tracking events, not through ORD. | REQ-MPC-FR-152; FIT (vendors can add shipments; ShipAsync); Proposed |
| AC-ORD-005-01-05 | US-ORD-005-01 | **Given** the order has an active hold, **when** the seller selects Hand over, **then** it is refused with message Ord.OrderOnHold (ORD-010 guard: IC-CHK-07 for ShipAsync, ORD-010 shipment-guard host for shipment creation). | see ORD-010 (REQ-MPC-FR-169) |
| AC-ORD-005-02-01 | US-ORD-005-02 | **Given** an order or payment event occurs for a seller's sub-order, **when** the event is raised, **then** the native OrderPlaced.VendorNotification and OrderPaid.VendorNotification are sent; when the acceptance or SLA deadline is within the configured lead time a reminder is sent through TRK-005. | REQ-MPC-FR-160; FIT |
| AC-ORD-005-03-01 | US-ORD-005-03 | **Given** the seller selects several Accepted or Packed sub-orders on the dashboard, **when** the seller selects Print, **then** the batch pick list and packing list are produced by LOG-009 for those sub-orders with only the seller's items; ORD-005 only passes the selection. | see LOG-009 (REQ-MPC-FR-168) |

**Business rules applied:** BR-ORD-032 (§8.1).


### 7.6 PRD-ORD-006 Partial fulfilment approval

| Item | Value |
|---|---|
| Description (baseline) | If only part of an order can be supplied, the buyer is asked whether to accept the partial delivery. |
| Why it matters | The buyer stays in control of what they receive. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: ORD-UNAVAIL |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-006-01 | As a buyer, I want to be asked whether I accept a partial delivery when some items are unavailable, so that I stay in control of what I receive and pay. | D; REQ-MPC-FR-158 | Ready; conditions: ORD-UNAVAIL |
| US-ORD-006-02 | As a seller, I want to report which lines or quantities I cannot supply, so that the buyer can decide. | D | Ready; conditions: ORD-UNAVAIL |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-006-02-01 | US-ORD-006-02 | **Given** partial supply is enabled for the client and a task is Accepted, **when** the seller reports unavailable quantities per line, **then** a PartialSupplyProposal is created (SM-ORD-03) and the buyer is notified with the lines and the amount affected. | REQ-MPC-FR-158 |
| AC-ORD-006-01-01 | US-ORD-006-01 | **Given** a proposal is open, **when** the buyer accepts, **then** under the order lock the ORD partial-supply service reduces the quantities itself, never through the native admin EditOrderItem action (which returns stock through AdjustInventoryAsync): with AutoUpdateOrderTotalsOnEditingOrder on it calls IOrderProcessingService.UpdateOrderTotalsAsync with UpdateOrderParameters carrying the new quantity, otherwise it updates the item quantity and amounts through IOrderService.UpdateOrderItemAsync and adjusts the order totals itself; IProductService.AdjustInventoryAsync is not called, so stock is not returned (BR-ORD-033); if paid, ORD raises a refund trigger for those lines through RET-005 (IC-RET-04, source type PartialSupply, lines with quantity and amount) before any line change; the change is audited (AUD-ORD-001). | REQ-MPC-FR-158; FIT (Admin OrderController.EditOrderItem 1231, AdjustInventoryAsync 1287; OrderProcessingService.UpdateOrderTotalsAsync 1728; OrderTotalCalculationService 601) |
| AC-ORD-006-01-02 | US-ORD-006-01 | **Given** a proposal is open, **when** the buyer rejects, **then** the sub-order is cancelled as in ORD-004; a paid sub-order is refunded through RET-005 (Cancellation trigger). | REQ-MPC-FR-158 |
| AC-ORD-006-01-03 | US-ORD-006-01 | **Given** the buyer does not answer within the configured time (setting, default not stated), **when** the time passes, **then** the configured default action (accept or reject; default not stated) is applied. | REQ-MPC-FR-158 ("as configured") |
| AC-ORD-006-02-02 | US-ORD-006-02 | **Given** partial supply is disabled for the client, **when** the seller cannot supply some lines, **then** the seller can only fulfil all lines or reject the sub-order (ORD-004). | REQ-MPC-FR-158 ("as configured") |

**Business rules applied:** BR-ORD-033 (§8.1).


### 7.7 PRD-ORD-007 Order numbering

| Item | Value |
|---|---|
| Description (baseline) | The client chooses the order number format, for example MP-2026-000123. |
| Why it matters | Order numbers fit the client's records. |
| Who benefits | Clients |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-007-01 | As a client administrator, I want to choose the order number format, for example MP-2026-000123, so that order numbers fit our records and reporting. | D; REQ-MPC-FR-172 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-007-01-01 | US-ORD-007-01 | **Given** OrderSettings.CustomOrderNumberMask is MP-{YYYY}-{ID}, **when** an order is placed, **then** its custom order number is for example MP-2026-123 (native). | REQ-MPC-FR-172; FIT (CustomNumberFormatter) |
| AC-ORD-007-01-02 | US-ORD-007-01 | **Given** the mask uses the padded token {ID:6} (Proposed syntax), **when** an order is placed, **then** the number is for example MP-2026-000123; the padding is applied by the ORD ICustomNumberFormatter override registered through DI, because the native padding code is commented out. | D; FIT (CustomNumberFormatter commented code) |
| AC-ORD-007-01-03 | US-ORD-007-01 | **Given** different masks are set per store, **when** orders are placed in each store, **then** each store's orders use its own mask (store-overridable setting), separating for example trade and retail orders. | REQ-MPC-FR-172 |
| AC-ORD-007-01-04 | US-ORD-007-01 | **Given** masks per order type are configured (goods, service, quote, recurring) (Proposed), **when** an order of that type is placed, **then** the type mask is used instead of the store mask. | REQ-MPC-FR-172; Proposed |
| AC-ORD-007-01-05 | US-ORD-007-01 | **Given** a mask contains an unknown token, **when** the administrator saves it, **then** it is refused with message Ord.MaskInvalid. | Proposed |

**Business rules applied:** BR-ORD-040 (§8.1).


### 7.8 PRD-ORD-008 Reorder

| Item | Value |
|---|---|
| Description (baseline) | Customers repeat a past order with one click; prices and stock are checked again. |
| Why it matters | Quick repeat buying. |
| Who benefits | Shoppers; business buyers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-008-01 | As a buyer, I want to repeat a past order in one click, so that repeat buying is quick. | D; REQ-MPC-FR-173 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-008-01-01 | US-ORD-008-01 | **Given** OrderSettings.IsReOrderAllowed is on, **when** the buyer selects Re-order on a past order, **then** each item is added to the cart through AddToCartAsync, so current prices and stock apply; items that cannot be added are skipped and the native ShoppingCart.ReorderWarning is shown. | REQ-MPC-FR-173; FIT (ReOrderAsync) |
| AC-ORD-008-01-02 | US-ORD-008-01 | **Given** the past order came from a split checkout (CHK-004), **when** the buyer re-orders one sub-order, **then** only that sub-order's items are added. | D; Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.9 PRD-ORD-009 Invoices

| Item | Value |
|---|---|
| Description (baseline) | PDF invoices for each order and each seller, a combined receipt, the company and tax details, seller identity and fees. |
| Why it matters | Proper invoices for customers and for accounting. |
| Who benefits | Shoppers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-DOC-001 |
| Status | On hold: DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-009-01 | As a shopper, I want a PDF invoice for each order and each seller, and one receipt for my whole checkout, so that I have proper documents. | D; REQ-MPC-FR-120 | On hold: DOC-LIB |
| US-ORD-009-02 | As a member of finance staff, I want invoices that show the company and tax details, seller identity, service fees and tax, so that invoices meet accounting needs. | D; REQ-MPC-FR-171 | On hold: DOC-LIB |
| US-ORD-009-03 | As a member of finance staff, I want invoices to be issued automatically, so that no one has to create them by hand. | REQ-KTDA-ORD-002 | On hold: DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-009-03-01 | US-ORD-009-03 | **Given** the client has chosen the issue point (order placed, paid or completed; AttachPdfInvoiceTo* settings), **when** that event occurs, **then** an InvoiceDocument with its number is recorded, the PDF is rendered by DOC-001 from the invoice template (IC-DOC-01) and attached to the matching native email, and Invoice.Issued is published for PAY-025, without manual action (issue job enqueued by a consumer and executed by a scheduled task). | REQ-KTDA-ORD-002; FIT (OrderSettings.AttachPdfInvoiceToOrderPlacedEmail / PaidEmail / CompletedEmail) |
| AC-ORD-009-01-01 | US-ORD-009-01 | **Given** a checkout produced sub-orders per seller (CHK-004), **when** invoices are issued, **then** each sub-order has its own invoice naming its seller; for an order holding several sellers' items (Marketplace split off) a per-seller PDF is produced through PrintOrderToPdfAsync(vendor), whose vendor parameter the DOC-001 IPdfService override keeps. | REQ-MPC-FR-120; FIT (IPdfService vendor parameter); see DOC-001 |
| AC-ORD-009-01-02 | US-ORD-009-01 | **Given** a checkout produced more than one sub-order, **when** the buyer opens the checkout or the confirmation, **then** a consolidated receipt (ORD document type ConsolidatedReceipt, rendered by DOC-001 through IC-DOC-01) lists every sub-order, seller and amount and the total paid ("when applicable"). | REQ-MPC-FR-120 |
| AC-ORD-009-02-01 | US-ORD-009-02 | **Given** company legal name, address and tax registration number, and seller name and tax number are configured, **when** an invoice is generated, **then** it shows them, the platform service fees charged on the order (payment fee, delivery fee, service fee lines) and the tax per rate (Order.TaxRates); fields that native order tokens do not hold (checkout reference, sub-order list, seller name and tax number, company tax fields, fee lines) are supplied by the ORD token provider registered with DOC (IC-ORD-07 through IC-DOC-02). | REQ-MPC-FR-171 |
| AC-ORD-009-02-02 | US-ORD-009-02 | **Given** a mandatory company field is empty, **when** an invoice would be issued, **then** it is not issued, the order is listed with message Ord.InvoiceSettingsMissing for administrators, and issuing resumes when the field is filled. | Proposed |
| AC-ORD-009-02-03 | US-ORD-009-02 | **Given** PAY-025 has returned a fiscal number and QR for the invoice, **when** the PDF is generated, **then** they are printed on it through the PAY-025 token provider registered with DOC (IC-DOC-02); ORD does not read or print fiscal data itself. | see PAY-025 (REQ-KTDA-ORD-002); BR-DOC-001 |

**Business rules applied:** BR-ORD-041 (§8.1).


### 7.10 PRD-ORD-010 Order holds

| Item | Value |
|---|---|
| Description (baseline) | Staff place an order on hold for fraud or compliance checks; it cannot be shipped until released. |
| Why it matters | Stops suspicious orders being fulfilled. |
| Who benefits | Fraud and compliance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (DI override) |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-010-01 | As a member of fraud and compliance staff, I want to put an order on hold for a check, so that it cannot be shipped until I release it. | D; REQ-MPC-FR-169 | Ready; conditions: OVR-REG |
| US-ORD-010-02 | As a member of fraud and compliance staff, I want to release a hold with a reason, so that fulfilment continues. | D; REQ-MPC-FR-169 | Ready; conditions: OVR-REG |
| US-ORD-010-03 | As a member of fraud and compliance staff, I want risky payments flagged by PAY-018 to place a hold automatically where the rule says so, so that suspicious orders are stopped without delay. | Proposed | Ready; conditions: OVR-REG |
| US-ORD-010-04 | Technical enabler. As a member of the platform team, I want one shipment-guard host in the core order module that every module checking shipment creation plugs into, so that shipment rules hold for every client, with or without optional packs (decisions OVR-REG, D-01). | OVR-REG; D-01; Proposed | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-010-01-01 | US-ORD-010-01 | **Given** a user with Orders.Core.Holds.CreateEditDelete, **when** the user places a hold with a reason, **then** the hold is Active (SM-ORD-04), the order and the seller dashboard show it, and it is audited (AUD-ORD-005). | REQ-MPC-FR-169 |
| AC-ORD-010-01-02 | US-ORD-010-01 | **Given** a hold is Active, **when** anyone creates a shipment, marks a shipment shipped, ready for pickup or delivered, or a seller hands over, **then** the action is refused with message Ord.OrderOnHold: shipment insert by the ORD-010 guard registered with the ORD-010 shipment-guard host (IShipmentService.InsertShipmentAsync, IC-ORD-11; ORD side IC-ORD-02); the status actions by the ORD-010 guard registered with the CHK-003 IOrderProcessingService override of ShipAsync, ReadyForPickupAsync and DeliverAsync (IC-CHK-07). | REQ-MPC-FR-169; FIT (Admin SetAsShipped / SetAsReadyForPickup / SetAsDelivered call these methods); OVR-REG |
| AC-ORD-010-02-01 | US-ORD-010-02 | **Given** a hold is Active, **when** a permitted user releases it with a reason, **then** the hold becomes Released, fulfilment actions are allowed again and the release is audited (AUD-ORD-005). | REQ-MPC-FR-169 |
| AC-ORD-010-03-01 | US-ORD-010-03 | **Given** a PAY-018 rule with action Flag has option "hold order", **when** it matches at placement, **then** a hold with reason "risk rule {name}" is created automatically. | Proposed |
| AC-ORD-010-01-03 | US-ORD-010-01 | **Given** an order is on hold, **when** staff or the buyer cancel it, **then** cancellation is still allowed (ORD-004) and the hold is closed. | Proposed |
| AC-ORD-010-04-01 | US-ORD-010-04 | **Given** shipment guard providers are registered with the ORD-010 host (IC-ORD-11): the ORD-010 hold check and, where their packs are installed, the PAY-006 LC check and the EGV-004 issue check, **when** anyone creates a shipment through the admin page, a seller page, the API or code that calls IShipmentService.InsertShipmentAsync, **then** every provider is called in registration order; the first refusal stops the insert, nothing is saved, the refusal is audited (AUD-ORD-008) and the admin AddShipment action filter shows the message key returned by that provider (for example Ord.OrderOnHold, Pay.LcNotVerified, Egv.ShipmentNotAllowed); if all providers allow, the native insert runs (BR-ORD-055). | Proposed; OVR-REG; FIT (IShipmentService.InsertShipmentAsync; Admin OrderController.AddShipment does not check ModelState) |
| AC-ORD-010-04-02 | US-ORD-010-04 | **Given** a provider throws an error instead of answering, **when** the guard runs, **then** the insert is refused (fail closed), the error is logged and the refusal is audited (AUD-ORD-008); no shipment is saved. | Proposed |
| AC-ORD-010-04-03 | US-ORD-010-04 | **Given** only the core modules are installed (no B2B trade pack, no e-Government pack), **when** a shipment is created for an order without an Active hold, **then** the host runs with the ORD-010 hold guard only and the native insert runs; the host does not depend on PAY-006 or EGV-004. | Proposed; D-01 |

**Business rules applied:** BR-ORD-050; BR-ORD-055 (§8.1).


### 7.11 PRD-ORD-011 Cut-offs and service levels

| Item | Value |
|---|---|
| Description (baseline) | Sets daily cut-off times for orders and the promised handling time for each delivery service. |
| Why it matters | Clear promises and on-time fulfilment. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: CUTOFF |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-011-01 | As a client administrator, I want to set daily order cut-off times per service level, so that promises to customers are realistic. | D; REQ-MPC-FR-165 | Ready; conditions: CUTOFF |
| US-ORD-011-02 | As a client administrator, I want to set the handling time for each delivery service level (standard, express, pickup), so that orders are fulfilled on time. | D; REQ-MPC-FR-165; REQ-MPC-FR-184 | Ready; conditions: CUTOFF |
| US-ORD-011-03 | As a client administrator, I want service-level standards with escalations, including pickup deadlines, so that late orders are acted on. | REQ-MPC-FR-311 | Ready; conditions: CUTOFF |
| US-ORD-011-04 | As a client administrator, I want delivery service levels published to sellers and enforced, so that sellers know and meet the rules. | REQ-MPC-FR-046 | Ready; conditions: CUTOFF |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-011-01-01 | US-ORD-011-01 | **Given** service level S has cut-off time T in the store time zone and a working-day calendar, **when** an order for S is placed after T, **then** its service-level clock starts on the next working day; LOG-005 uses the same cut-off for the delivery estimate. | REQ-MPC-FR-165 |
| AC-ORD-011-02-01 | US-ORD-011-02 | **Given** service level S has a handling time, **when** a sub-order with S is placed or paid (start event is a setting), **then** its due time is calculated and stored and shown in the console and seller dashboard. | REQ-MPC-FR-165; REQ-MPC-FR-184 |
| AC-ORD-011-03-01 | US-ORD-011-03 | **Given** an order is not handed over by its due time, **when** the ORD scheduled task runs, **then** the order is flagged overdue and escalated to the roles configured for that level, through TRK-005 (escalation levels Proposed). | REQ-MPC-FR-311 |
| AC-ORD-011-03-02 | US-ORD-011-03 | **Given** a pickup deadline is configured for the pickup service, **when** an order ready for pickup is not collected by the deadline, **then** it is flagged and escalated in the same way; what happens to the parcel afterwards is LOG's. | REQ-MPC-FR-311 |
| AC-ORD-011-04-01 | US-ORD-011-04 | **Given** service levels and their handling times are published, **when** a seller opens the dashboard or the seller terms, **then** the levels and times are shown; missed seller deadlines drive ORD-004 automatic cancellation and penalties; the stored due time and the hand-over time of each sub-order are the measure SEL-011 uses for the on-time delivery indicator. | REQ-MPC-FR-046; see SEL-011 |

**Business rules applied:** BR-ORD-051 (§8.1).


### 7.12 PRD-ORD-012 Request for quotation

| Item | Value |
|---|---|
| Description (baseline) | A buyer asks for a price for listed or custom items; the request goes to suitable sellers, who reply with structured quotes and terms. Sellers can ask clarification questions, and the answers are shared with all invited sellers. |
| Why it matters | Supports negotiated and bulk purchases. |
| Who benefits | Business buyers; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-012-01 | As a business buyer, I want to ask for a price for listed or custom items, so that I can buy in bulk or to my specification. | D | Ready; conditions: SINGLE-FILTER |
| US-ORD-012-02 | As a business buyer, I want my request to go to suitable sellers who are notified, so that I get competing quotes. | D; FC-M03-014 | Ready; conditions: SINGLE-FILTER |
| US-ORD-012-03 | As a seller, I want to reply with a structured quote and terms, with documents, so that the buyer can compare like with like. | D; FC-M03-015; FC-M06-010 | Ready; conditions: SINGLE-FILTER |
| US-ORD-012-04 | As a seller, I want to ask the buyer a question and have the answer shared with all invited sellers, so that every seller quotes on the same information. | D | Ready; conditions: SINGLE-FILTER |
| US-ORD-012-05 | As a business buyer, I want my request, quote and resulting order to be linked, so that the purchase cycle from request to purchase is traceable. | Inference from REQ-KTDA-OFR-003 (purchase cycle not defined, KG-10) | Ready; conditions: SINGLE-FILTER |
| US-ORD-012-06 | As a shopper or business buyer, I want to ask for a quote from the product page of a call-for-price product or a price-on-request service without putting it in my cart, so that I can get a price for items that cannot be bought directly. | D; Proposed | Ready; conditions: SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-012-01-01 | US-ORD-012-01 | **Given** the bundled Misc.RFQ plugin is installed and the buyer has Misc.RFQ.AccessRFQ.PublicStore.AccessRFQ, **when** the buyer turns the cart into a request with requested quantities, unit prices and notes, **then** a native RequestQuote with its items is created (status Submitted). | D; FIT (RfqService.CreateRequestQuoteByShoppingCartAsync) |
| AC-ORD-012-01-02 | US-ORD-012-01 | **Given** the buyer adds a custom (not listed) item with description, quantity, unit and attachment, **when** the request is submitted, **then** the line is stored in RfqCustomLine linked to the request, because native request items require a ProductId; the attachment is stored as a native Download only after it passes the ADM-008 upload policy for the ORD upload context "RFQ attachment" (BR-ADM-060), and it is served only through the SEC-002 download ownership filter, to which ORD supplies the rule "the requesting buyer, invited sellers and staff with Misc.RFQ admin access" (decision SINGLE-FILTER). | D; FIT (RequestQuoteItem.ProductId); SINGLE-FILTER (Proposed) |
| AC-ORD-012-02-01 | US-ORD-012-02 | **Given** the Marketplace pack is on, **when** a request is submitted, **then** an RfqInvitation is created for each eligible seller (sellers of the listed products; for custom lines, sellers mapped to the chosen categories) and each is notified through TRK-005; where an approved supplier panel exists for the category (SEL-014), only its Approved, unexpired members are invited (BR-SEL-019). | D; FC-M03-014; Proposed (eligibility) |
| AC-ORD-012-02-02 | US-ORD-012-02 | **Given** the Marketplace pack is off, **when** a request is submitted, **then** the native store-owner flow applies: the store owner creates the quote in admin. | D; FIT (Misc.RFQ is buyer to store owner only) |
| AC-ORD-012-03-01 | US-ORD-012-03 | **Given** a seller with Orders.Core.SellerOrders.Process has an invitation, **when** the seller submits a quote with, per line, offered quantity and unit price, plus validity date, payment terms, delivery commitment, warranty and attachments, **then** a native Quote and QuoteItems are created with ExpirationDateUtc = validity date and status Submitted; terms are stored in QuoteTerms and the seller in QuoteVendor; the seller can quote only own products for listed lines. | FC-M03-015; FC-M06-010; FIT (Quote, QuoteItem) |
| AC-ORD-012-04-01 | US-ORD-012-04 | **Given** an invited seller asks a question on a request, **when** the buyer answers it, **then** the question and answer are visible to all sellers invited to that request; the asking seller's identity is not shown to other sellers. | D; Proposed (identity) |
| AC-ORD-012-05-01 | US-ORD-012-05 | **Given** a quote from a request is accepted and the order is placed (ORD-013), **when** the order is created, **then** the order, the quote and the request reference each other and the chain is shown on all three. | Inference from REQ-KTDA-OFR-003 (KG-10; K-01) |
| AC-ORD-012-06-01 | US-ORD-012-06 | **Given** a product is call-for-price (CAT-013) or a price-on-request service (SVC-001), Misc.RFQ is installed and the buyer has Misc.RFQ.AccessRFQ.PublicStore.AccessRFQ, **when** the buyer selects Request a quote on the product page with quantity, attributes and notes, **then** the ORD request service (IC-ORD-08) creates a native RequestQuote in status Submitted through IRepository<RequestQuote>, adds the item through RfqService.InsertRequestQuoteItemAsync and sends the native new-request message (RfqMessageService.CustomerSentNewRequestQuoteAsync); the buyer's cart is not read or changed; CAT and SVC call IC-ORD-08 and write no Misc.RFQ table themselves. | D; FIT (RfqService has no public request insert without the cart; InsertRequestQuoteItemAsync and CustomerSentNewRequestQuoteAsync are public) |
| AC-ORD-012-01-03 | US-ORD-012-01 | **Given** the bundled Misc.RFQ plugin (5.00.18) is used for a client, **when** the configuration pack is applied, **then** RfqSettings.Enabled is on (install default on; with it off the customer RFQ menu, pages and the cart-to-request flow are hidden), and the 5.00 settings ShowCaptchaOnRequestPage and AllowCustomerGenerateQuotePdf (install default off) are set per client. | VER-500; FIT (RfqSettings.cs; RfqPlugin.cs:109-111; RfqCustomerController.cs:79; CustomerRfqMenuComponent.cs:54) |

**Business rules applied:** BR-ORD-060; BR-ORD-061 (§8.1).


### 7.13 PRD-ORD-013 Quote negotiation and conversion

| Item | Value |
|---|---|
| Description (baseline) | The buyer compares quotes side by side, makes counter-offers within limits, and accepts one, which becomes an order. Quotes expire after a set date. (Whether KTDA's 'buyer bids' are handled here is decision K-01.) |
| Why it matters | A structured negotiation instead of emails and phone calls. |
| Who benefits | Business buyers; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ORD-012 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-013-01 | As a business buyer, I want to compare all quotes for my request side by side, so that I choose the best offer. | FC-M03-016 | Ready |
| US-ORD-013-02 | As a business buyer, I want to make counter-offers within limits and get counter-offers back, so that I can negotiate in the platform. | FC-M03-017; REQ-KTDA-OFR-002 | Ready; on hold: AC-ORD-013-02-03 (K-01) |
| US-ORD-013-03 | As a business buyer, I want to accept one quote and have it become an order with its terms, so that there is no manual re-typing. | FC-M03-018 | Ready |
| US-ORD-013-04 | As a seller, I want expired quotes to be impossible to accept, so that I am not bound by old prices. | FC-M03-019 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-013-01-01 | US-ORD-013-01 | **Given** a request has two or more Submitted quotes, **when** the buyer opens the comparison, **then** a table shows per seller the total, unit price per line in the request's unit, validity, payment terms and delivery commitment; the lowest total and lines that differ from the request are highlighted. | FC-M03-016 |
| AC-ORD-013-02-01 | US-ORD-013-02 | **Given** a quote is Submitted and the negotiation limits (number of rounds, total time; settings, defaults not stated) are not reached, **when** the buyer proposes new unit prices, **then** the seller sees the counter-offer and can accept it (the quote is updated), counter, or decline; every round is kept in NegotiationRound. | FC-M03-017 |
| AC-ORD-013-02-02 | US-ORD-013-02 | **Given** the round or time limit is reached, **when** either party tries another counter-offer, **then** it is refused with message Ord.NegotiationLimitReached. | FC-M03-017 |
| AC-ORD-013-02-03 | US-ORD-013-02 | **Given** KTDA "buyer bids" are treated as counter-offers on a quote, **when** a KTDA buyer submits one, **then** it follows the counter-offer criteria above — held by K-01 (bids are excluded by D-02). | REQ-KTDA-OFR-002 |
| AC-ORD-013-03-01 | US-ORD-013-03 | **Given** the buyer accepts a Submitted quote, **when** the acceptance is confirmed after message Ord.CartWillBeReplaced (the native conversion clears the cart), **then** native CreateShoppingCartAsync fills the cart with the quote items at the offered prices (GetShoppingCartItemUnitPriceEvent), the other quotes for the request become Declined and their sellers are notified; at placement the quote becomes OrderCreated with Quote.OrderId and the terms are copied to OrderQuoteTerms. | FC-M03-018; FIT (RfqService.CreateShoppingCartAsync; EventConsumer) |
| AC-ORD-013-03-02 | US-ORD-013-03 | **Given** an order is created from an accepted quote, **when** the order is shown, **then** it links to the quote and its request. | Inference from REQ-KTDA-OFR-003 (KG-10; K-01) |
| AC-ORD-013-04-01 | US-ORD-013-04 | **Given** a quote's ExpirationDateUtc has passed, **when** the buyer opens or accepts it, **then** the native lazy check sets it Expired and acceptance is refused with message Ord.QuoteExpired; the seller may issue a new quote for the same request. | FC-M03-019; FIT (CheckIsQuoteExpiredAsync) |
| AC-ORD-013-04-02 | US-ORD-013-04 | **Given** quotes reach their expiry date, **when** the ORD scheduled task runs, **then** they are set Expired and the buyer and seller are notified (Misc.RFQ has no expiry task or notification). | FC-M03-019; FIT |

**Business rules applied:** BR-ORD-060; BR-ORD-062 (§8.1).


### 7.14 PRD-ORD-014 Seller offers

| Item | Value |
|---|---|
| Description (baseline) | The client or a seller posts an offer, for example a bulk lot of tea, and buyers respond to it. (Scope depends on decision K-01.) Offers can be reviewed internally and scheduled to publish at a set date and time. |
| Why it matters | Sells large lots to interested buyers. |
| Who benefits | Sellers; business buyers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: K-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-014-01 | As a member of KTDA sales staff or a seller, I want to post an offer such as a bulk lot of tea, so that interested buyers can respond. | D; REQ-KTDA-OFR-001 | On hold: K-01 |
| US-ORD-014-02 | As a member of KTDA sales staff, I want offers to be reviewed before publication and published at a set date and time, so that only approved offers go live on time. | D | On hold: K-01 |
| US-ORD-014-03 | As a business buyer, I want to respond to an offer with the quantity and price I want, so that I can buy the lot. | D; REQ-KTDA-OFR-002 | On hold: K-01 |
| US-ORD-014-04 | As a business buyer, I want my response to lead to a quote and an order, so that the purchase cycle from offer to purchase is complete. | REQ-KTDA-OFR-003 | On hold: K-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-014-01-01 | US-ORD-014-01 | **Given** a user with Orders.Core.SellerOrders.Process or Orders.Core.Contracts.CreateEditDelete, **when** the user creates an offer (lot or product, quantity, minimum order quantity, indicative price or price on request, validity, terms), **then** the offer is saved as Draft (SM-ORD-05). | D; REQ-KTDA-OFR-001 |
| AC-ORD-014-02-01 | US-ORD-014-02 | **Given** an offer is submitted for review, **when** a user with Orders.Core.Offers.Approve approves it with a publish date and time, **then** it becomes Scheduled and is published at that time by the ORD scheduled task (Published); rejection returns it to Draft with a reason. | D |
| AC-ORD-014-03-01 | US-ORD-014-03 | **Given** an offer is Published, **when** a buyer submits a response with requested quantity and price, **then** the response is recorded and turned into an RFQ request to the offer owner (ORD-012); responses are not ranked and no auction runs (D-02). | REQ-KTDA-OFR-002; D-02 |
| AC-ORD-014-04-01 | US-ORD-014-04 | **Given** a response led to a quote that the buyer accepts, **when** the order is placed, **then** the offer's remaining quantity is reduced and the order links to the offer, response and quote; at zero remaining quantity the offer closes. | REQ-KTDA-OFR-003 |
| AC-ORD-014-01-02 | US-ORD-014-01 | **Given** the validity of an offer passes, **when** the task runs, **then** the offer becomes Closed and is no longer shown. | D |

**Business rules applied:** BR-ORD-063 (§8.1).


### 7.15 PRD-ORD-015 Configurable requisition workflows

| Item | Value |
|---|---|
| Description (baseline) | Online request forms for custom products or services (for example tea blends, contract packaging, forward contracts) that go through the client's internal approval steps. |
| Why it matters | Turns complex custom requests into a tracked process. |
| Who benefits | Business buyers; KTDA staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-015-01 | As a business buyer, I want to request a custom blend through an online form, so that my request is tracked. | D; REQ-KTDA-WF-001 | On hold: WF-ENG |
| US-ORD-015-02 | As a business buyer, I want to request contract packaging through an online form, so that my request is tracked. | REQ-KTDA-WF-002 | On hold: WF-ENG |
| US-ORD-015-03 | As a business buyer, I want to request a forward contract through an online form, so that my request is tracked. | REQ-KTDA-WF-003 | On hold: WF-ENG |
| US-ORD-015-04 | As a member of KTDA staff, I want requests to move through our internal approval stages, so that decisions are controlled. | REQ-KTDA-WF-004 | On hold: WF-ENG |
| US-ORD-015-05 | As a client administrator, I want request types for each business model to be configured, not coded, so that new models need no build. | Inference from REQ-KTDA-PRJ-002 (business models per ToR b.ii) | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-015-01-01 | US-ORD-015-01 | **Given** a request type "Custom blend" with its form fields and attachments is configured, **when** a buyer submits the form, **then** a Requisition is created (SM-ORD-06 Submitted) and a workflow instance starts on the ADM-002 engine. | REQ-KTDA-WF-001 |
| AC-ORD-015-02-01 | US-ORD-015-02 | **Given** a request type "Contract packaging" is configured, **when** a buyer submits the form, **then** a Requisition of that type is created and its workflow starts. | REQ-KTDA-WF-002 |
| AC-ORD-015-03-01 | US-ORD-015-03 | **Given** a request type "Forward contract" is configured, **when** a buyer submits the form, **then** a Requisition of that type is created and its workflow starts; on approval a draft contract is created (ORD-016). | REQ-KTDA-WF-003 |
| AC-ORD-015-04-01 | US-ORD-015-04 | **Given** a requisition is at an approval step, **when** the assigned approver decides in the ADM-006 queue, **then** approve moves it to the next step; reject needs a reason and ends it as Rejected; the buyer sees the status and reason. | REQ-KTDA-WF-004 |
| AC-ORD-015-05-01 | US-ORD-015-05 | **Given** a new request type is needed, **when** the administrator configures its form and workflow, **then** the new request type appears in the request-type list of buyers in My account, a request of that type can be submitted with the configured form and is routed through the configured workflow, and no code deployment was made. | Inference from REQ-KTDA-PRJ-002 |

**Business rules applied:** BR-ORD-070 (§8.1).


### 7.16 PRD-ORD-016 Contract drafting

| Item | Value |
|---|---|
| Description (baseline) | Creates contracts from templates with the agreed terms, and sends them for internal review. |
| Why it matters | Faster, consistent contracts. |
| Who benefits | Legal and sales staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-DOC-001 |
| Status | On hold: DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-016-01 | As a member of legal or sales staff, I want to create a contract from a template with the agreed terms filled in, so that contracts are fast and consistent. | D; FC-M08-005; FC-M08-007 | On hold: DOC-LIB |
| US-ORD-016-02 | As a member of legal staff, I want drafted contracts to go through internal review before issue, so that nothing is issued unchecked. | FC-M08-008 | On hold: DOC-LIB |
| US-ORD-016-03 | As a client administrator, I want a library of approved templates per transaction type, so that the right template is used. | FC-M08-006 | On hold: DOC-LIB |
| US-ORD-016-04 | As a business buyer, I want my approved forward-contract request to become a contract, so that the deal is formalised. | REQ-KTDA-WF-003 | On hold: DOC-LIB |
| US-ORD-016-05 | As a client administrator, I want a template set per business model, so that each business model gets the right contract. | Inference from REQ-KTDA-PRJ-002 (business models per ToR b.ii) | On hold: DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-016-01-01 | US-ORD-016-01 | **Given** an approved template (DOC-001) exists for the transaction type, **when** a user drafts a contract from a quote or requisition, **then** parties, value, scope, deliverables, schedule and terms are filled from the source; terms negotiated in the source override the template defaults; the draft is version 1. | FC-M08-005; FC-M08-007 |
| AC-ORD-016-02-01 | US-ORD-016-02 | **Given** a draft is ready, **when** it is sent for review, **then** it appears in the review queue; the reviewer approves (status Approved) or returns it with comments; only Approved contracts can be issued. | FC-M08-008 |
| AC-ORD-016-03-01 | US-ORD-016-03 | **Given** templates exist per transaction type and language, **when** a user drafts a contract, **then** only templates for that type are offered. | FC-M08-006 |
| AC-ORD-016-04-01 | US-ORD-016-04 | **Given** a forward-contract requisition is approved (ORD-015), **when** the approval completes, **then** a draft contract is created from the forward-contract template. | REQ-KTDA-WF-003 |
| AC-ORD-016-05-01 | US-ORD-016-05 | **Given** several business models are configured (retail, bulk, contract packaging, forward contracts), **when** contracts are drafted, **then** each model uses its own template set. | Inference from REQ-KTDA-PRJ-002 |

**Business rules applied:** BR-ORD-071 (§8.1).


### 7.17 PRD-ORD-017 Contract e-signature

| Item | Value |
|---|---|
| Description (baseline) | All parties sign contracts electronically through a signing provider, with a record of who signed when. Signing rules can require a minimum number of signers from one party, for example 3 of 5. |
| Why it matters | No printing or couriering of contracts. |
| Who benefits | Business buyers; client staff |
| Phase | P2 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-ORD-016 |
| Status | On hold: DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-017-01 | As a business buyer, I want to sign contracts electronically, so that no printing or couriering is needed. | D; FC-M08-009; FC-M08-010 | On hold: DOC-LIB |
| US-ORD-017-02 | As an auditor, I want a record of who signed and when, so that signatures can be proven. | FC-M08-011 | On hold: DOC-LIB |
| US-ORD-017-03 | As a member of legal staff, I want rules such as 3 of 5 signers from one party, so that the contract is valid only with enough signatures. | FC-M08-012 | On hold: DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-017-01-01 | US-ORD-017-01 | **Given** an e-signature adapter is configured (provider not named), **when** an Approved contract is sent for signing in the configured order (sequential or parallel), **then** each signer receives the signing request from the provider and the contract becomes AwaitingSignatures. | FC-M08-009; FC-M08-010 |
| AC-ORD-017-02-01 | US-ORD-017-02 | **Given** the provider reports a signature, **when** the callback is verified, **then** signer, time, IP address and certificate result as returned by the provider are stored and the event is audited (AUD-ORD-006); when the provider returns the signed PDF, its signature is checked through DOC-003 VerifySignature (IC-DOC-04) and the file is stored as a new version of the contract document (IC-DOC-03). | FC-M08-011; Proposed |
| AC-ORD-017-03-01 | US-ORD-017-03 | **Given** a party's quorum is set (for example 3 of 5), **when** signatures arrive, **then** the contract becomes Signed only when every party's quorum is met; a decline sets it Declined. | FC-M08-012 |

**Business rules applied:** BR-ORD-072 (§8.1).


### 7.18 PRD-ORD-018 Contract amendments

| Item | Value |
|---|---|
| Description (baseline) | Changes to a signed contract go through approval, with versions and a marked-up view of what changed. |
| Why it matters | Contract changes stay controlled and traceable. |
| Who benefits | Legal staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-018-01 | As a member of legal staff, I want to propose a change to a signed contract, so that changes are controlled. | D; FC-M08-017 | On hold: WF-ENG |
| US-ORD-018-02 | As an auditor, I want every amendment to create a new version with the old ones kept, so that history is complete. | FC-M08-018 | On hold: WF-ENG |
| US-ORD-018-03 | As a client manager, I want significant amendments to go through approval, so that material changes are authorised. | FC-M08-019 | On hold: WF-ENG |
| US-ORD-018-04 | As a member of legal staff, I want to see what changed between versions, so that I review quickly. | FC-M08-020 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-018-01-01 | US-ORD-018-01 | **Given** a contract is Signed, **when** either party proposes an amendment, **then** the counter-party can accept or reject it; accepted amendments go to signing (ORD-017). | FC-M08-017 |
| AC-ORD-018-02-01 | US-ORD-018-02 | **Given** an amendment is accepted, **when** it is saved, **then** a new contract version is created and every earlier version stays readable. | FC-M08-018 |
| AC-ORD-018-03-01 | US-ORD-018-03 | **Given** an amendment changes value, scope or duration beyond the configured limits (settings, defaults not stated), **when** it is proposed, **then** it goes through the approval chain on ADM-002 / ADM-006 before counter-party signing. | FC-M08-019 |
| AC-ORD-018-04-01 | US-ORD-018-04 | **Given** two versions exist, **when** a user opens the comparison, **then** added, deleted and changed text is shown side by side. | FC-M08-020 |

**Business rules applied:** BR-ORD-071 (§8.1).


### 7.19 PRD-ORD-019 Contract repository

| Item | Value |
|---|---|
| Description (baseline) | A searchable store of all contracts, with export. |
| Why it matters | Contracts are easy to find and audit. |
| Who benefits | Legal staff; auditors |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-019-01 | As a member of legal staff, I want to search all contracts, so that I find any contract quickly. | D; FC-M08-025 | Ready |
| US-ORD-019-02 | As an auditor, I want to export a complete contract package, so that I have the evidence in one file. | FC-M08-026 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-019-01-01 | US-ORD-019-01 | **Given** the user has Orders.Core.Contracts.View, **when** the user searches by party, value range, dates, terms text, status and type, **then** matching contracts are listed. | FC-M08-025 |
| AC-ORD-019-02-01 | US-ORD-019-02 | **Given** a contract is selected, **when** the user exports it, **then** a ZIP holds the signed PDF, the signature audit trail, supporting documents and the amendment history. | FC-M08-026 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.20 PRD-ORD-020 Award and acceptance letters

| Item | Value |
|---|---|
| Description (baseline) | Creates and sends award or acceptance letters and tracks whether they were accepted by the deadline. |
| Why it matters | Clear confirmation that a deal is agreed. |
| Who benefits | Client staff; business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-DOC-001 |
| Status | On hold: DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-020-01 | As a member of client staff, I want to generate and send an award or acceptance letter, so that the deal is confirmed formally. | D; FC-M08-001; FC-M08-002 | On hold: DOC-LIB |
| US-ORD-020-02 | As a member of client staff, I want to track whether the letter was accepted by the deadline, so that I know where each deal stands. | D; FC-M08-003 | On hold: DOC-LIB |
| US-ORD-020-03 | As a client administrator, I want letter templates per transaction type, vertical and language, so that letters fit each case. | FC-M08-004 | On hold: DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-020-01-01 | US-ORD-020-01 | **Given** a quote is accepted or a requisition approved and the type requires a letter, **when** the user generates the letter, **then** it is rendered by DOC-001 from the letter template with branding and statutory clauses (IC-DOC-01) and sent through the configured channels (TRK-005); ORD keeps the letter record, its deadline and status; delivery status is tracked. | FC-M08-001; FC-M08-002 |
| AC-ORD-020-02-01 | US-ORD-020-02 | **Given** a letter has an acceptance deadline (setting, default not stated), **when** the recipient acknowledges and accepts it, **then** it is marked Accepted with time; otherwise at the deadline it becomes Lapsed and staff are notified (SM-ORD-10). | FC-M08-003 |
| AC-ORD-020-03-01 | US-ORD-020-03 | **Given** templates exist per type, vertical and language, **when** a letter is generated, **then** the matching template is used. | FC-M08-004 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.21 PRD-ORD-021 Performance securities

| Item | Value |
|---|---|
| Description (baseline) | Records bank guarantees given by suppliers, tracks their validity, and releases or claims them. |
| Why it matters | Protects the client if a supplier fails to deliver. |
| Who benefits | Finance and legal staff |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-021-01 | As a member of finance staff, I want to record bank guarantees given by suppliers and track their validity, so that the client is protected if a supplier fails. | D; FC-M08-013; FC-M08-014 | Ready |
| US-ORD-021-02 | As a member of finance staff, I want to release or claim a guarantee, so that the guarantee follows the contract outcome. | D; FC-M08-015; FC-M08-016 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-021-01-01 | US-ORD-021-01 | **Given** a contract requires a guarantee, **when** finance staff record issuer bank, number, amount, currency and expiry date, **then** the guarantee is Active and linked to the contract (SM-ORD-09). | FC-M08-013 |
| AC-ORD-021-01-02 | US-ORD-021-01 | **Given** the expiry date is within the configured alert lead time (setting, default not stated), **when** the task runs, **then** finance staff are alerted and a renewal request can be sent. | FC-M08-014 |
| AC-ORD-021-02-01 | US-ORD-021-02 | **Given** the contract is completed, **when** finance staff release the guarantee, **then** it becomes Released. | FC-M08-015 |
| AC-ORD-021-02-02 | US-ORD-021-02 | **Given** the supplier defaults, **when** finance staff start invocation, **then** it needs approval and documents; on approval a bank notification letter is generated and the guarantee becomes Invoked. | FC-M08-016 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.22 PRD-ORD-022 Contract-to-order execution

| Item | Value |
|---|---|
| Description (baseline) | Turns a signed contract into scheduled orders, call-offs or milestone releases, and passes them to fulfilment. |
| Why it matters | Contracts are carried out on time. |
| Who benefits | Sales and logistics staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ORD-016 |
| Status | On hold: CALLOFF-PLACE, DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-022-01 | As a member of sales or logistics staff, I want a signed contract to turn into scheduled orders, call-offs or milestone releases, so that contracts are carried out on time. | D; FC-M08-021 | On hold: CALLOFF-PLACE, DOC-LIB |
| US-ORD-022-02 | As a business buyer, I want to draw down against a framework contract, so that I order what I need within the contract. | FC-M08-022 | On hold: CALLOFF-PLACE, DOC-LIB |
| US-ORD-022-03 | As a member of sales staff, I want multi-phase contracts to release each phase as a tracked order at its milestone, so that work follows the plan. | FC-M08-023 | On hold: CALLOFF-PLACE, DOC-LIB |
| US-ORD-022-04 | As a business buyer, I want my forward contract to be delivered as agreed, so that I receive the goods on schedule. | REQ-KTDA-WF-003 | On hold: CALLOFF-PLACE, DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-022-01-01 | US-ORD-022-01 | **Given** a Signed contract has a delivery schedule (dates, items, quantities), **when** a scheduled date arrives, **then** an order is created for the buyer with the contract prices (CAT-039 price list) and the contract payment method, through the placement path the tech lead decides (decision CALLOFF-PLACE; not designed here), is linked to the contract line, and LOG fulfils it — held by CALLOFF-PLACE. | FC-M08-021; FC-M08-024; CALLOFF-PLACE (open) |
| AC-ORD-022-02-01 | US-ORD-022-02 | **Given** a framework contract has remaining quantity, **when** the buyer submits a drawdown, **then** an order is created within the remaining quantity; a drawdown above it is refused with message Ord.ContractQuantityExceeded. | FC-M08-022 |
| AC-ORD-022-03-01 | US-ORD-022-03 | **Given** a milestone is marked complete by authorised staff, **when** the milestone is saved, **then** the next phase becomes a tracked order. | FC-M08-023 |
| AC-ORD-022-04-01 | US-ORD-022-04 | **Given** a forward contract from a requisition is Signed, **when** its schedule dates arrive, **then** its orders are created as in criterion 01 — held by CALLOFF-PLACE. | REQ-KTDA-WF-003 |
| AC-ORD-022-01-02 | US-ORD-022-01 | **Given** orders are created for several business models, **when** they are listed, **then** each shows its contract and business model. | Inference from REQ-KTDA-PRJ-002 |

**Business rules applied:** BR-ORD-073 (§8.1).


### 7.23 PRD-ORD-023 Group buying

| Item | Value |
|---|---|
| Description (baseline) | Buyers join together in one order; when a target quantity is reached, everyone gets the lower price. |
| Why it matters | Small buyers get bulk prices. |
| Who benefits | Shoppers; small businesses |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-023-01 | As a shopper or small business, I want to join others in a group order and get the lower price when the target is reached, so that small buyers get bulk prices. | D; FC-M02-001 | Ready |
| US-ORD-023-02 | As a client administrator, I want to set up a group deal with a target and deadline, so that I control the offer. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-023-02-01 | US-ORD-023-02 | **Given** an administrator creates a group deal (product, target quantity, group price, deadline), **when** it is published, **then** buyers see the deal and the quantity pledged so far. | D |
| AC-ORD-023-01-01 | US-ORD-023-01 | **Given** a deal is open, **when** a buyer pledges a quantity, **then** the pledge is recorded without payment (Proposed) and the pledged total is updated. | D; Proposed |
| AC-ORD-023-01-02 | US-ORD-023-01 | **Given** the pledged total reaches the target before the deadline, **when** the task runs, **then** each participant is notified and can buy the pledged quantity at the group price within the purchase window (price applied in the cart through the price event). | D; Proposed |
| AC-ORD-023-01-03 | US-ORD-023-01 | **Given** the deadline passes below target, **when** the task runs, **then** the deal closes and participants are notified; no order is created. | D; Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.24 PRD-ORD-024 Scheme applications

| Item | Value |
|---|---|
| Description (baseline) | People or businesses apply for a programme or scheme; eligibility is checked, applications are reviewed and approved within a budget, and support goes to the intended groups. |
| Why it matters | Supports government or development programmes delivered through the shop. |
| Who benefits | Programme staff; beneficiaries |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-024-01 | As a beneficiary, I want to apply for a programme with documents and declarations, so that I can receive support. | D; FC-M03-035; FC-M06-012 | On hold: WF-ENG |
| US-ORD-024-02 | As a member of programme staff, I want applications to be checked for eligibility automatically and the rest reviewed, so that decisions are consistent. | FC-M03-036; FC-M03-037 | On hold: WF-ENG |
| US-ORD-024-03 | As a member of programme staff, I want to approve applications within the budget and send the instruction to pay, so that support goes to the right people. | FC-M03-038; FC-M05-027; FC-M05-028; FC-M05-029 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-024-01-01 | US-ORD-024-01 | **Given** a scheme with form, documents and declarations is configured, **when** a beneficiary submits an application, **then** it is validated and created with a reference. | FC-M03-035; FC-M06-012 |
| AC-ORD-024-02-01 | US-ORD-024-02 | **Given** eligibility rules on application data are configured, **when** the application is submitted, **then** rules are evaluated; failing or flagged applications go to the review queue with all documents. | FC-M03-036; FC-M03-037 |
| AC-ORD-024-02-02 | US-ORD-024-02 | **Given** the scheme is linked to a FIN-004 subsidy scheme and a programme registry is configured (registry not named), **when** the application is submitted, **then** the registry check runs through IC-FIN-04 CheckEligibility (shared connector); on Eligible FIN-004 adds the customer to the scheme role with the expiry returned or configured; on Not eligible the application goes to the review queue. | D; Proposed |
| AC-ORD-024-03-01 | US-ORD-024-03 | **Given** the scheme budget has room and targeting rules (district, age, income band) pass, **when** an officer approves, **then** a sanction with reference and disbursement instruction is created for PAY-022. | FC-M03-038; FC-M05-027; FC-M05-029 |
| AC-ORD-024-03-02 | US-ORD-024-03 | **Given** the budget is exhausted, **when** an officer approves, **then** approval is blocked and the application is queued for the next allocation. | FC-M05-028 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.25 PRD-ORD-025 Proforma invoice

| Item | Value |
|---|---|
| Description (baseline) | A preliminary invoice issued before payment, from a cart or quote, which buyers need to open a letter of credit or pay in advance. |
| Why it matters | Gives buyers a formal priced document to open a letter of credit or pay in advance (inference from KTDA's letter-of-credit requirement). |
| Who benefits | International buyers; export staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-DOC-001 |
| Status | On hold: PH-INF, DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-025-01 | As an international buyer, I want a proforma invoice from my cart or quote, so that I can open a letter of credit or pay in advance. | D; Inference from REQ-KTDA-PAY-006 (LC needs a priced document) | On hold: PH-INF, DOC-LIB |
| US-ORD-025-02 | As a member of export staff, I want the proforma to be referenced when the LC is verified, so that the LC matches the deal. | Inference from REQ-KTDA-PAY-009 (verification before shipping) | On hold: PH-INF, DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-025-01-01 | US-ORD-025-01 | **Given** a buyer has a cart or an accepted quote, **when** the buyer or export staff generate a proforma, **then** ORD records the proforma with its number (mask setting), date and validity date, and DOC-001 renders the PDF from the proforma template (IC-DOC-01) with ORD tokens (IC-ORD-07): seller and client details, items, prices, taxes, Incoterm (ORD-026) and payment instructions; no order is created and no stock is reserved. | D; Inference from REQ-KTDA-PAY-006 (PH-INF) |
| AC-ORD-025-02-01 | US-ORD-025-02 | **Given** an LC record is opened for an order (PAY-006), **when** export staff link the proforma, **then** the LC record stores the proforma number and the order shows it. | Inference from REQ-KTDA-PAY-009 (PH-INF) |
| AC-ORD-025-01-02 | US-ORD-025-01 | **Given** a proforma's validity has passed, **when** someone tries to use it for an order, **then** the prices are recalculated and a new proforma is needed (message Ord.ProformaExpired). | Proposed |
| AC-ORD-025-01-03 | US-ORD-025-01 | **Given** a Misc.RFQ quote exists and RfqSettings.AllowCustomerGenerateQuotePdf is on (new in 5.00), **when** the buyer opens the quote in My account, **then** the buyer can download the native quote PDF (quote number = quote id, date, customer, expiry date, order number once ordered); it is not the ORD proforma, which is still produced for carts and accepted quotes as in criterion 01-01, because the quote PDF has no proforma number mask, seller details, Incoterm (ORD-026) or payment instructions. | VER-500; FIT (RfqService.PrintQuoteToPdfAsync, RfqService.cs:907-1016; RfqSettings.cs) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.26 PRD-ORD-026 Incoterms

| Item | Value |
|---|---|
| Description (baseline) | Records the agreed international trade terms (Incoterms, such as FOB or CIF) on quotes and orders, which decide who pays for and is responsible for transport. |
| Why it matters | Avoids disputes in export deals. |
| Who benefits | International buyers; export staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: PH-INF |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-026-01 | As an international buyer, I want to agree the Incoterm on my quote and order, so that it is clear who pays for and is responsible for transport. | D; Inference from REQ-KTDA-CUS-002 (international buyers; PH-INF) | On hold: PH-INF |
| US-ORD-026-02 | As a member of export staff, I want the Incoterm to drive whether the platform charges transport, so that charges match the agreed terms. | D; Inference from REQ-KTDA-LEG-001 (trade regulation) | On hold: PH-INF |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-026-01-01 | US-ORD-026-01 | **Given** an Incoterm list is configured (edition not stated) with a named-place field, **when** a buyer selects an Incoterm on a quote or at B2B checkout, **then** it is stored on the quote, order, invoice and proforma; the named place is required; Incoterm code and named place are exposed as document tokens by the ORD token provider (IC-ORD-07 through IC-DOC-02) for the commercial invoice and proforma templates (origin and HS code tokens are CAT-015's). | Inference from REQ-KTDA-CUS-002 (PH-INF) |
| AC-ORD-026-02-01 | US-ORD-026-02 | **Given** each Incoterm is configured with "seller arranges main carriage" yes or no, **when** the buyer selects one with no, **then** the delivery fee is not charged and the shipping option shown is "Buyer-arranged collection". | Inference from REQ-KTDA-LEG-001 (PH-INF); Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.27 PRD-ORD-027 Sample orders

| Item | Value |
|---|---|
| Description (baseline) | Small sample quantities of bulk products that buyers can order, with limits per buyer. |
| Why it matters | Buyers can test quality before a large order. |
| Who benefits | Business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-027-01 | As a business buyer, I want to order small samples of bulk products, so that I can test quality before a large order. | D | Ready |
| US-ORD-027-02 | As a client administrator, I want to limit samples per buyer, so that samples are not abused. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-027-01-01 | US-ORD-027-01 | **Given** a product or variant is flagged as a sample with its price, **when** a buyer adds it, **then** it is ordered like any product. | D |
| AC-ORD-027-02-01 | US-ORD-027-02 | **Given** a limit per buyer per period is set (settings, defaults not stated), **when** a buyer adds a sample beyond the limit across orders, **then** the ORD-027 cart check provider registered with the CHK-003 IShoppingCartService override (IC-CHK-01) refuses it with message Ord.SampleLimitReached. | D; FIT (Product.OrderMaximumQuantity is per order only) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.28 PRD-ORD-028 Recurring and subscription orders

| Item | Value |
|---|---|
| Description (baseline) | Customers set up orders that repeat automatically, for example every month. |
| Why it matters | Convenience for regular purchases and steady sales. |
| Who benefits | Shoppers; business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ORD-028-01 | As a shopper or business buyer, I want orders that repeat automatically, for example every month, so that I do not have to reorder. | D | Ready |
| US-ORD-028-02 | As a member of client staff, I want due recurring payments to be processed without manual action, so that repeat orders are not missed. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ORD-028-01-01 | US-ORD-028-01 | **Given** a product is recurring (Product.IsRecurring, cycle length, period, total cycles) and the payment method supports recurring payments, **when** the buyer orders it, **then** the native RecurringPayment is created with the first order. | D; FIT (CreateFirstRecurringPaymentAsync) |
| AC-ORD-028-02-01 | US-ORD-028-02 | **Given** a recurring payment is active, its method is RecurringPaymentType.Manual and its next payment date has come, **when** the ORD scheduled task runs, **then** under ILocker key 'ord-recurring-{RecurringPaymentId}' it checks that the cycle is not yet in RecurringPaymentHistory and calls ProcessNextRecurringPaymentAsync, which creates the next order (Pending for asynchronous methods; PAY completes it). | D; FIT (no recurring-payment task in the default task list, InstallRequiredData.cs:3488-3587) |
| AC-ORD-028-02-02 | US-ORD-028-02 | **Given** processing fails, **when** the native method returns errors, **then** the native RecurringPaymentFailed notification is sent, or the recurring payment is cancelled when PaymentSettings.CancelRecurringPaymentsAfterFailedPayment is on. | FIT |
| AC-ORD-028-02-03 | US-ORD-028-02 | **Given** the method is RecurringPaymentType.Automatic, **when** the date comes, **then** the task does nothing; the gateway charges and its callback creates the order. | FIT |
| AC-ORD-028-01-02 | US-ORD-028-01 | **Given** the selected method does not support recurring payments, **when** the buyer confirms, **then** the order is not placed (native error) and the method is not offered for recurring carts. | FIT |
| AC-ORD-028-01-03 | US-ORD-028-01 | **Given** OrderSettings.NextRecurringPaymentNotificationDays is above 0 (new in 5.00; install and upgrade default 1), **when** a recurring payment is created or a cycle is processed, **then** the native NextRecurringPaymentNotification.CustomerNotification email is queued to be sent that many days before the next payment date; it is sent through IWorkflowMessageService, whose single override is TRK-005, and the client sets the number of days or 0 to turn it off. | VER-500; FIT (OrderSettings.cs:209; OrderProcessingService.cs:1267-1274, 1557-1569; InstallRequiredData.cs:1889) |

**Business rules applied:** BR-ORD-074 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-ORD-010 | Order stages are a plugin entity. Each stage declares the native OrderStatus values (Pending, Processing, Complete, Cancelled) it may coexist with; the OrderStatus enum is never changed and OrderStatusId is never set directly by ORD. | ORD-002 | REQ-MPC-FR-153; FIT; L1 §6.3; FIT |
| BR-ORD-011 | A manual stage change may only use declared transitions. If the target stage needs a different native status, ORD calls the native service (CancelOrderAsync for Cancelled); Processing and Complete are reached only through native payment and shipping actions, so ORD refuses manual changes that would need them. | ORD-002 | FC-M03-021; FIT (CheckAndSaveOrderStatusAsync) |
| BR-ORD-012 | Stage auto-advance runs in consumers of native events (OrderPaidEvent, ShipmentSentEvent, ShipmentReadyForPickupEvent, ShipmentDeliveredEvent, OrderStatusChangedEvent, OrderRefundedEvent) and of the RET event Return.Completed (BR-RET-064). Consumers swallow exceptions, so a failed or undeclared auto-advance is written to a stage exceptions list that a scheduled task re-checks; no blocking logic is placed in consumers. | ORD-002 | FIT (EventPublisher); L1 §6.2 principle 8 |
| BR-ORD-013 | Order acceptance: OrderAcceptedEvent (new, published by the ORD service through IEventPublisher) carries OrderId, AcceptedOnUtc, AcceptedBy (buyer, staff or system) and Deemed (true when recorded by the acceptance-window task). It is published once per order, only from the delivery-mapped stage and only when no dispute is open (checked through IC-RET-01 HasOpenCase inside the order lock). PAY-007 consumes it to enqueue the escrow release; the release runs in PAY. | ORD-002 | Proposed; (PAY-007); product decision on order acceptance (2026-11-19) |
| BR-ORD-014 | Line stage sets: ORD-002 holds the stage-set definitions and transitions per product type in the same configuration as order stages (default for service lines: SM-SVC-01 of SVC-005) and answers transition checks (IC-ORD-10). One owner per behaviour: the per-line state, its history and its change event belong to the module of the line type (SVC-005 ServiceOrderStage and Service.StageChanged); ORD keeps no per-line store. The order stage and the native OrderStatus are not derived from line stages unless an auto-advance rule says so. | ORD-002 | D; Proposed |
| BR-ORD-015 | Operational stage for ADM-007: taken from the operational code of the current order stage; if that stage has none and LOG-011 is enabled for the store, the stage of the order's first open shipment returned by LOG (IC-LOG-07 GetOperationalStage, BR-LOG-170), so the order row and its shipment rows agree; otherwise AwaitingPickup when no shipment exists, AwaitingDispatch when a shipment exists and is not shipped, OutForLastMileDelivery when Shipment.ShippedDateUtc is set and DeliveryDateUtc is empty. AwaitingSorting is set only from a stage fed by LOG or TRK-002 events. The client mapping is configuration. | ORD-002 | see ADM-007 (REQ-MPC-FR-162); FIT (Shipment); Proposed |
| BR-ORD-020 | Native admin order-edit actions (ChangeOrderStatus, CancelOrder, EditOrderTotals, EditOrderItem, DeleteOrderItem, EditShippingMethod, AddressEdit, AddProductToOrderDetails, OrderNoteDelete, Delete) are intercepted by a global IAsyncActionFilter registered by the ORD plugin; they need a reason code, and ChangeOrderStatus also needs Orders.Core.Status.Override. A ModelReceivedEvent veto is not used: most of these actions take an id or a form, and ChangeOrderStatus does not check ModelState. Payment actions are excluded: PAY intercepts them (BR-PAY-082). | ORD-001, ORD-002, ORD-003 | REQ-MPC-FR-156; FIT (Admin OrderController) |
| BR-ORD-021 | Order-changing actions of ORD (stage change, cancellation, hold, partial supply, seller steps) run under ILocker key 'pay-order-{OrderId}', shared with PAY and INV-004; the action re-reads the order inside the lock and fails if its expected state no longer holds. | ORD-003 and all ORD order actions | FC-M03-022; FIT (ILocker); BR-PAY-013 |
| BR-ORD-030 | Buyer cancellation uses an ORD endpoint (native AllowCustomersCancelOrders stays off because the native action takes no reason and applies no policy). Cancellation is allowed only before fulfilment starts (no shipment; task not Packed or HandedOver) and within the policy window; it calls CancelOrderAsync(order, notifyCustomer: true). ORD raises no refund: RET-005 is the single owner of refund triggers and raises the Cancellation trigger for a paid order from OrderStatusChangedEvent; PAY-016 moves the money. | ORD-004 | REQ-MPC-FR-154; FIT (Nop.Web OrderController.CancelOrder; CanCancelOrder checks only != Cancelled); RET-005 single refund-trigger owner |
| BR-ORD-031 | Seller rejection and deadline cancellation require a reason code; a configured penalty creates a SellerPenalty record that ORD passes to SEL through IC-SEL-05 (AddSellerCharge, source type Penalty, source reference = SellerPenalty ID, idempotent) when the penalty is created; this push is the only path, SEL does not read SellerPenalty at batch close; SEL-017 deducts it in settlement (payouts are SEL-017, commission rules SEL-016). | ORD-004 | REQ-MPC-FR-155; REQ-MPC-FR-170; Proposed (penalty record) |
| BR-ORD-032 | Seller task steps: New → Accepted → Packed → HandedOver. The task is created in state New by the ORD placement participant (IC-CHK-06 Confirm) for each sub-order. Hand over needs a shipment; for own-carrier sellers it calls ShipAsync, for postal-network fulfilment it starts LOG-011 pickup or LOG-022 drop-off and TRK-002 events change the shipment. The seller acts only on own sub-orders (ownership check in the ORD endpoint). | ORD-005 | REQ-MPC-FR-152; FIT |
| BR-ORD-033 | Partial supply never edits a paid order without the buyer's acceptance; on acceptance quantities are reduced by the ORD service (UpdateOrderTotalsAsync with UpdateOrderParameters, or IOrderService.UpdateOrderItemAsync when automatic total update is off), never through the native admin EditOrderItem action, so stock is not returned for unavailable quantities (no AdjustInventoryAsync call); money is returned only through a RET-005 refund trigger (IC-RET-04, source type PartialSupply), which PAY-016 executes. | ORD-006 | REQ-MPC-FR-158; FIT; Proposed |
| BR-ORD-040 | Order numbers: native mask tokens {ID}, {YYYY}, {YY}, {MM}, {DD} plus the padded token {ID:n} through an ICustomNumberFormatter override (DI, INopStartup Order >= 3000); masks per store and optionally per order type. | ORD-007 | REQ-MPC-FR-172; FIT |
| BR-ORD-041 | ORD-009 does not override IPdfService: under decision OVR-REG DOC-001 owns that override (BR-DOC-001). ORD-009 supplies the Invoice and ConsolidatedReceipt document types and their template content, the invoice number, the issue rules and the ORD token provider (IC-ORD-07 through IC-DOC-02), which also serves proforma, contract, letter and Incoterm fields; PAY-025 prints fiscal number and QR through its own DOC token provider. Invoice issue jobs are enqueued by consumers and executed by a scheduled task; rendering is a DOC-001 call (IC-DOC-01). | ORD-009 | FIT (IPdfService); L1 §6.2 principles 7 and 8; OVR-REG |
| BR-ORD-050 | An active hold blocks shipment creation and the shipment status actions. The hold check is an IC-ORD-11 shipment guard of the ORD-010 shipment-guard host (BR-ORD-055; the PAY-006 LC check and EGV-004 are the other providers), and an order-action guard with the CHK-003 IOrderProcessingService override for ShipAsync, ReadyForPickupAsync and DeliverAsync (IC-CHK-07). It does not block cancellation or payment. | ORD-010 | REQ-MPC-FR-169; FIT; L1 §6.2 principle 7; OVR-REG |
| BR-ORD-055 | Shipment-guard host (core, decision OVR-REG; D-01): ORD-010 owns the only IShipmentService.InsertShipmentAsync override (DI, INopStartup Order >= 3000). It calls every registered shipment guard provider (IC-ORD-11) in registration order and refuses the insert on the first refusal; a provider error refuses the insert (fail closed). An ORD action filter on Admin OrderController.AddShipment [POST] calls the same providers and shows the first refusal message before the native action runs (AddShipment does not check ModelState, so a ModelReceivedEvent veto is not used; an event consumer cannot block). Providers: ORD-010 hold, PAY-006 letter of credit (BR-PAY-030), EGV-004 application Issued (BR-EGV-008). Lot and serial capture is not a guard (IC-INV-07, BR-INV-070). Listed in the ADM extension register (BR-ADM-001). | ORD-010 | FIT (IShipmentService.InsertShipmentAsync; Admin OrderController.AddShipment); OVR-REG; D-01; Proposed (host in ORD-010) |
| BR-ORD-051 | Service-level due time = start event time (moved to the next working day after the cut-off) + handling time of the level; cut-offs use the store time zone. | ORD-011 | REQ-MPC-FR-165; Proposed (formula) |
| BR-ORD-060 | RFQ extends the bundled Misc.RFQ plugin without changing it: RfqService is a concrete class with non-virtual methods, so ORD adds side tables (RfqInvitation, RfqCustomLine, QuoteVendor, QuoteTerms, NegotiationRound, RfqQuestion) and its own services and controllers, and reuses native RequestQuote, Quote, QuoteItem, the price event and CreateShoppingCartAsync. ORD is the only module that writes Misc.RFQ tables; CAT-013 and SVC-001 start requests from a product page through IC-ORD-08, which inserts the RequestQuote through IRepository<RequestQuote> (RfqService has no public insert without the cart). | ORD-012, ORD-013 | FIT (Misc.RFQ PluginNopStartup registers RfqService as itself) |
| BR-ORD-061 | A seller sees only the requests it is invited to and its own quotes; buyer answers to clarification questions are shared with all invited sellers. | ORD-012 | D |
| BR-ORD-062 | Accepting one quote declines the other quotes of the same request; expired quotes cannot be accepted (native lazy expiry plus ORD expiry task). | ORD-013 | FC-M03-018; FC-M03-019; FIT |
| BR-ORD-063 | Offer responses are converted into RFQ requests; there is no ranking, bidding or auction (D-02). | ORD-014 | D-02; K-01 |
| BR-ORD-070 | Requisition workflows run on the ADM-002 engine and ADM-006 queues; ORD stores the requisition and its form data only. | ORD-015 | REQ-KTDA-WF-004; WF-ENG |
| BR-ORD-071 | Contracts are versioned; only Approved versions can be issued or sent for signing; a Signed version is never edited, only amended. | ORD-016, ORD-018 | FC-M08-008; FC-M08-018 |
| BR-ORD-072 | A contract is Signed only when every party's signer quorum is met; signature evidence is stored as returned by the provider. | ORD-017 | FC-M08-011; FC-M08-012 |
| BR-ORD-073 | Call-off and drawdown orders never exceed the remaining contract quantity; each order links to its contract line. | ORD-022 | FC-M08-022 |
| BR-ORD-074 | The recurring task processes each cycle at most once (RecurringPaymentHistory check under ILocker key 'ord-recurring-{RecurringPaymentId}') and only for RecurringPaymentType.Manual methods. | ORD-028 | FIT (ProcessNextRecurringPaymentAsync; no native task) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-ORD-01 | OrderStage (per order) | any stage | native event or manual change | transition declared; native status compatible (BR-ORD-010, BR-ORD-011) | target stage | stage history; notification if configured; AUD-ORD-001 |
| SM-ORD-01 | OrderStage (per order) | delivery-mapped stage | buyer accepts, staff record acceptance, or acceptance window passes | no open dispute | Accepted | OrderAcceptedEvent (BR-ORD-013); AUD-ORD-003 |
| SM-ORD-01 | OrderStage (per order) | any stage | undeclared transition requested | — | unchanged | refused; AUD-ORD-002 |
| SM-ORD-02 | SellerTask | (none) | sub-order saved in the CHK-004 placement (ORD participant, IC-CHK-06 Confirm) | — | New | — |
| SM-ORD-02 | SellerTask | New | seller accepts | paid / authorised, or method in fulfil-before-payment list | Accepted | AUD-ORD-004 |
| SM-ORD-02 | SellerTask | Accepted | seller marks packed | — | Packed | AUD-ORD-004 |
| SM-ORD-02 | SellerTask | Packed | seller hands over | shipment exists; no active hold | HandedOver | ShipAsync (own carrier) or LOG-011 pickup / LOG-022 drop-off started; AUD-ORD-004 |
| SM-ORD-02 | SellerTask | New / Accepted | seller rejects with reason, or deadline passes | — | Rejected | CancelOrderAsync; refund through RET-005 (Cancellation trigger) if paid; penalty if configured |
| SM-ORD-03 | PartialSupplyProposal | (none) | seller reports unavailable quantities | task Accepted; partial supply enabled | Open | buyer notified |
| SM-ORD-03 | PartialSupplyProposal | Open | buyer accepts, or time passes with default accept | — | Accepted | quantities reduced; RET-005 refund trigger (PartialSupply) if paid |
| SM-ORD-03 | PartialSupplyProposal | Open | buyer rejects, or time passes with default reject | — | Rejected | sub-order cancelled; refund through RET-005 (Cancellation trigger) if paid |
| SM-ORD-04 | OrderHold | (none) | hold placed (manual or risk rule) | Orders.Core.Holds.CreateEditDelete or PAY-018 rule | Active | fulfilment blocked; AUD-ORD-005 |
| SM-ORD-04 | OrderHold | Active | hold released with reason | permitted user | Released | fulfilment allowed; AUD-ORD-005 |
| SM-ORD-04 | OrderHold | Active | order cancelled | — | Closed | — |
| SM-ORD-05 | Offer | Draft | submitted for review | — | InReview | — |
| SM-ORD-05 | Offer | InReview | approved with publish time | Orders.Core.Offers.Approve | Scheduled | — |
| SM-ORD-05 | Offer | InReview | rejected with reason | — | Draft | — |
| SM-ORD-05 | Offer | Scheduled | publish time reached | — | Published | — |
| SM-ORD-05 | Offer | Published | validity passed, quantity exhausted, or withdrawn | — | Closed | — |
| SM-ORD-06 | Requisition | (none) | buyer submits form | — | Submitted | workflow started (ADM-002) |
| SM-ORD-06 | Requisition | Submitted / InApproval | approver approves a step | — | InApproval / Approved | next step or outcome (quote or contract) |
| SM-ORD-06 | Requisition | Submitted / InApproval | approver rejects with reason | — | Rejected | buyer notified |
| SM-ORD-07 | Contract | (none) | drafted from template | — | Draft | version 1 |
| SM-ORD-07 | Contract | Draft | reviewer approves | — | Approved | — |
| SM-ORD-07 | Contract | Draft | reviewer returns with comments | — | Draft | new version |
| SM-ORD-07 | Contract | Approved | sent for signing | — | AwaitingSignatures | — |
| SM-ORD-07 | Contract | AwaitingSignatures | quorum met for every party | — | Signed | AUD-ORD-006 |
| SM-ORD-07 | Contract | AwaitingSignatures | a signer declines | — | Declined | — |
| SM-ORD-07 | Contract | Signed | amendment accepted and signed | approval if significant | Signed (new version) | old version kept |
| SM-ORD-08 | QuoteNegotiation (ORD view of native Quote) | Submitted | counter-offer made | within round and time limits | Countered | NegotiationRound saved |
| SM-ORD-08 | QuoteNegotiation (ORD view of native Quote) | Countered | other party accepts or counters | within limits | Submitted / Countered | — |
| SM-ORD-08 | QuoteNegotiation (ORD view of native Quote) | Submitted | buyer accepts | not expired | Accepted | native CreateShoppingCartAsync; other quotes Declined |
| SM-ORD-08 | QuoteNegotiation (ORD view of native Quote) | Submitted / Countered | another quote of the request accepted | — | Declined | seller notified |
| SM-ORD-08 | QuoteNegotiation (ORD view of native Quote) | Accepted | order placed | — | OrderCreated (native QuoteStatus) | Quote.OrderId set |
| SM-ORD-08 | QuoteNegotiation (ORD view of native Quote) | Submitted / Countered | ExpirationDateUtc passed | — | Expired (native QuoteStatus) | buyer and seller notified |
| SM-ORD-09 | PerformanceSecurity | (none) | guarantee recorded | — | Active | linked to contract |
| SM-ORD-09 | PerformanceSecurity | Active | contract completed and released | — | Released | — |
| SM-ORD-09 | PerformanceSecurity | Active | invocation approved | approval and documents | Invoked | bank notification letter generated |
| SM-ORD-09 | PerformanceSecurity | Active | expiry date passes without renewal | — | Expired | finance alerted |
| SM-ORD-10 | AwardLetter | (none) | letter generated and sent | — | Sent | delivery tracked |
| SM-ORD-10 | AwardLetter | Sent | recipient accepts before the deadline | — | Accepted | — |
| SM-ORD-10 | AwardLetter | Sent | deadline passes | — | Lapsed | staff notified |
| SM-ORD-11 | OrderIntervention | (none) | edit submitted with reason (no approval needed) | reason code valid | Applied | AUD-ORD-001 |
| SM-ORD-11 | OrderIntervention | (none) | edit submitted with reason (approval needed) | reason code valid | Pending | Ord.ApprovalPending |
| SM-ORD-11 | OrderIntervention | Pending | approver approves | approver is not the requester | Applied | change applied; AUD-ORD-001 |
| SM-ORD-11 | OrderIntervention | Pending | approver rejects with reason | — | Rejected | requester notified |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| OrderStageDefinition / OrderStageTransition / OrderStageHistory (new) | Definition: Code, Name (localised), NativeStatuses, VisibleToCustomer, Notify, TrkEventCode, AutoEvent, IsSnapshotStage, OperationalStage (ADM-007, optional), Scope (order / line stage set and product type); Transition: From, To; History: OrderId, Stage, ChangedOnUtc, ChangedBy, ReasonCodeId | ORD-002 | Native Order.OrderStatusId unchanged; enum not changed |
| OrderAcceptance (new) | OrderId, AcceptedOnUtc, AcceptedBy, Deemed | ORD-002 | Source of OrderAcceptedEvent |
| ReasonCode / OrderIntervention / OrderSnapshot (new) | ReasonCode: Code, Text, CommentRequired, NeedsApproval; Intervention: OrderId, Action, ReasonCodeId, Comment, RequestedBy, ApprovedBy, Status; Snapshot: OrderId, Stage, Json, CreatedOnUtc | ORD-003 | Before/after values in SEC-004 audit store |
| SellerTask / SellerPenalty (new) | Task: OrderId, VendorId, Status (SM-ORD-02), DueOnUtc, AcceptedOnUtc, PackedOnUtc, HandedOverOnUtc; Penalty: VendorId, OrderId, RuleId, Amount, Reason, SelChargeId | ORD-004, ORD-005 | Task created by the ORD participant of the CHK-003 placement (IC-ORD-09); penalties pushed to SEL through IC-SEL-05 when created (SelChargeId stores the returned charge ID); SEL does not read this table |
| PartialSupplyProposal / PartialSupplyLine (new) | Proposal: OrderId, Status (SM-ORD-03), DecisionDueUtc; Line: OrderItemId, UnavailableQty | ORD-006 | |
| InvoiceDocument (new) | Id, OrderId, VendorId, CheckoutSessionId (consolidated receipt), Type (Invoice / ConsolidatedReceipt / Proforma), Number, IssuedOnUtc, DocumentRecordId (DOC) | ORD-009, ORD-025 | PDF rendered by DOC-001 (IC-DOC-01) with ORD tokens (IC-ORD-07); Number = custom order number (Proposed) |
| OrderHold (new) | Id, OrderId, Reason, Source (manual / risk rule), Status (SM-ORD-04), PlacedBy, ReleasedBy, timestamps | ORD-010 | |
| ServiceLevel (new) | ShippingMethod or service code, CutOffTime, HandlingTime, PickupDeadline, EscalationRoles, Calendar | ORD-011 | Native DeliveryDate and transit days remain for display |
| RfqInvitation, RfqCustomLine, RfqQuestion, QuoteVendor, QuoteTerms, NegotiationRound, OrderQuoteTerms (new) | Invitation: RequestQuoteId, VendorId, Status; CustomLine: RequestQuoteId, Description, Qty, Unit, DownloadId; Question: RequestQuoteId, VendorId, Text, Answer; QuoteVendor: QuoteId, VendorId; QuoteTerms: QuoteId, PaymentTerms, DeliveryCommitment, Warranty, DownloadIds; Round: QuoteId, Party, Prices, CreatedOnUtc | ORD-012, ORD-013 | Native RequestQuote, RequestQuoteItem, Quote, QuoteItem (Misc.RFQ) reused unchanged |
| Offer / OfferResponse (new) | Offer: Owner (client or VendorId), Product or lot, Quantity, RemainingQty, MinQty, Price or on request, ValidTo, Status (SM-ORD-05), PublishOnUtc; Response: OfferId, CustomerId, Qty, Price, RequestQuoteId | ORD-014 | |
| RequestType / Requisition (new) | Type: Name, FormSchema, WorkflowDefinitionId; Requisition: TypeId, CustomerId, Data, Status (SM-ORD-06), WorkflowInstanceId | ORD-015 | Workflow on ADM-002 |
| Contract / ContractVersion / ContractParty / Signature / CallOffLine / Milestone / PerformanceSecurity / AwardLetter (new) | Contract: Type, Parties, Value, Status (SM-ORD-07), SourceQuoteId or RequisitionId; Version: Number, DocumentId; Signature: Signer, Time, Ip, CertificateResult; CallOffLine: Date, Items, Qty, OrderId; Security: Bank, Number, Amount, ExpiryDate, Status; Letter: Deadline, Status | ORD-016 to ORD-022 | Documents via DOC-001 |
| GroupDeal / GroupPledge (new) | Deal: Product, TargetQty, GroupPrice, Deadline, Status; Pledge: CustomerId, Qty | ORD-023 | P2 |
| Scheme / SchemeApplication (new) | Scheme: Form, Rules, Budget, Targeting; Application: Data, Documents, Status, SanctionReference | ORD-024 | P3; disbursement in PAY-022 |
| Incoterm (new) | Code, Name, SellerArrangesCarriage, NamedPlaceRequired; stored on quote, order, proforma | ORD-026 | A native checkout attribute could record it, but transport logic needs the flag |
| Recurring payments (native) | RecurringPayment, RecurringPaymentHistory | ORD-028 | Native; ORD adds the scheduled task only |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Order status model and reason codes | Status/transition tables (new), reason codes | vertical → client | ORD-002 / ORD-003 | Core |
| Agri-finance and schemes pack settings | Scheme definitions, eligibility rules, budgets, partner credit/insurance products, disbursement rails | vertical (Schemes pack) → client | ORD-024 / PAY-022 / FIN-001 – FIN-004 | Agri-finance and schemes pack |
| Engagement and loyalty pack settings | Reward-point rules, promotion types, pop-ups, abandoned-cart timing (5.00: remindersettings.*, native e-mail reminders), affiliates, recurring cycles | vertical (Engagement pack) → client → store | MKT-002 / MKT-003 / MKT-012 / ORD-028 | Engagement and loyalty pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Stage model and auto-advance rules | OrderStageDefinition / Transition (new) | vertical → client | Not stated (WF-006 logic not stated) | FR-153 stage list |
| Complete only when delivered | OrderSettings.CompleteOrderWhenDelivered (native) | client → store | Not stated | Proposed on (aligns Complete with Delivered) |
| Acceptance enabled; acceptance window | ORD settings (new) | client | Not stated (needed if escrow, PAY-007) | Not stated |
| Reason codes; interventions needing approval; snapshot stages | ReasonCode (new); ORD settings | vertical → client | Not stated | Reason codes required (FR-156); list not stated |
| Customer self-cancel (native) / ORD buyer cancellation and window | OrderSettings.AllowCustomersCancelOrders (native, kept off); ORD settings (new) | client → store | Not stated | Configurable policy (FR-154); window not stated |
| Seller acceptance deadline; penalty rules | ORD settings (new) | client | — | Configurable (FR-170); values not stated |
| Fulfil-before-payment payment methods | ORD settings (new) | client | Not stated | Not stated |
| Partial supply enabled; buyer decision time; default action | ORD settings (new) | client | — | "As configured" (FR-158); values not stated |
| Order number masks | OrderSettings.CustomOrderNumberMask (native, store-overridable); per order type masks (new) | client → store | Not stated | e.g. MP-2026-000123 (D); prefixes (FR-172) |
| Reorder allowed | OrderSettings.IsReOrderAllowed (native) | client → store | Not stated | On (FR-173) |
| Invoice issue point and attachments | OrderSettings.AttachPdfInvoiceToOrderPlacedEmail / PaidEmail / CompletedEmail (native); PdfSettings.* (native) | client → store | Automated (ORD-002) | Not stated |
| Invoice company and tax fields | ORD settings (new) | client | Not stated | Seller identity, fees, tax (FR-171); values not stated |
| Service levels, cut-offs, pickup deadlines, escalation roles, working calendar | ServiceLevel (new) | client | Not stated | FR-165, FR-184, FR-311; values not stated |
| RFQ routing and negotiation limits | ORD settings (new); Misc.RFQ settings (native) | client | Not stated (KG-10) | — |
| Offer review and publication | ORD settings (new) | client | Held by K-01 | — |
| Requisition types and workflows | RequestType (new) + ADM-002 definitions | client | WF-001–WF-004; steps not stated (KG-09) | — |
| Contract templates; letter templates; signing provider | DOC-001 templates; adapter settings (new, credentials per instance; every credential, key or token flagged secret in the ORD key catalogue and never in a configuration pack, BR-PLT-013, CFG-01) | client | Not stated | — |
| Incoterm list | Incoterm (new) | client | Not stated (PH-INF) | — |
| Sample limits | ORD settings (new) | client | Not stated | — |
| ADM-007 operational stage mapping; line stage sets | OrderStageDefinition.OperationalStage, Scope (new) | vertical → client | — | Mapping values not stated (MG-06); service stage set SM-SVC-01 (SVC) |
| Feature state per store | Setting productfeature.<prd-id> read through IC-PLT-02 (PLT-022) before ORD pages, widgets, providers, guards or scheduled tasks act for a store | store, else shared | Per pack | Per pack |
| Key catalogue | Every new ORD setting key is listed in the ORD plugin key catalogue (key, type, layer, secret flag, default) so pack validation accepts it (NFR-X-008) | global | — | — |
| Recurring task interval; cancel after failed payment; next-payment reminder | ScheduleTask (installation); PaymentSettings.CancelRecurringPaymentsAfterFailedPayment (native); OrderSettings.NextRecurringPaymentNotificationDays (native, 5.00, install default 1) | installation; client | Not stated | Not stated |
| Misc.RFQ settings (5.00) | RfqSettings.Enabled (install default on), ShowCaptchaOnRequestPage, AllowCustomerGenerateQuotePdf (install default off) | client → store | Not stated | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Admin | Order list and order page with stage, holds, interventions, snapshots | ORD-001, ORD-002, ORD-003, ORD-010 | Native pages extended |
| Admin | Stage model, reason codes, cancellation policy, service levels, numbering masks, invoice fields, Incoterms | ORD-002, ORD-003, ORD-004, ORD-007, ORD-009, ORD-011, ORD-026 | New configuration pages |
| Admin | Intervention approval queue; stage exceptions; overdue orders | ORD-002, ORD-003, ORD-011 | New |
| Seller portal | Order dashboard (accept, pack, hand over, reject, partial supply), batch printing, RFQ invitations and quotes, offers | ORD-005, ORD-006, ORD-012, ORD-013, ORD-014 | New ORD endpoints |
| Storefront — My account | Order stage, cancel with reason, accept order, partial-supply decision, re-order, invoices and consolidated receipt | ORD-002, ORD-004, ORD-006, ORD-008, ORD-009 | Native pages extended |
| Storefront — B2B | Requests for quote with custom items, quote comparison and negotiation, offers, requisition forms, contracts to sign, drawdowns, proformas | ORD-012 to ORD-017, ORD-022, ORD-025 | Misc.RFQ pages extended + new |
| Admin — B2B | Requisitions, contracts and versions, repository, letters, securities, call-offs, group deals, schemes | ORD-015 to ORD-024 | New |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Ord.TransitionNotAllowed | This change of order stage is not allowed. | AC-ORD-002-02-01, AC-ORD-002-02-02 |
| Ord.ReasonRequired | Please choose a reason for this change. | AC-ORD-002-02-03, AC-ORD-003-01-01, AC-ORD-004-02-02 |
| Ord.ApprovalPending | This change has been sent for approval. | AC-ORD-003-03-01 |
| Ord.OrderBusy | This order is being changed by someone else. Please try again. | AC-ORD-003-04-01 |
| Ord.AcceptanceBlockedByDispute | The order cannot be accepted while a dispute is open. | AC-ORD-002-04-03 |
| Ord.CancelNotAllowed | This order can no longer be cancelled. | AC-ORD-004-01-02 |
| Ord.OrderOnHold | This order is on hold and cannot be shipped or handed over. | AC-ORD-005-01-05, AC-ORD-010-01-02 |
| Ord.MaskInvalid | The order number format contains an unknown token. | AC-ORD-007-01-05 |
| Ord.InvoiceSettingsMissing | Invoices cannot be issued until the company invoice details are completed. | AC-ORD-009-02-02 |
| Ord.NegotiationLimitReached | No more counter-offers are allowed for this quote. | AC-ORD-013-02-02 |
| Ord.CartWillBeReplaced | Accepting this quote will replace the items in your cart. | AC-ORD-013-03-01 |
| Ord.QuoteExpired | This quote has expired and can no longer be accepted. | AC-ORD-013-04-01 |
| Ord.ContractQuantityExceeded | This drawdown is more than the quantity left on the contract. | AC-ORD-022-02-01 |
| Ord.ProformaExpired | This proforma invoice has expired. Please request a new one. | AC-ORD-025-01-02 |
| Ord.SampleLimitReached | You have reached the sample limit for this product. | AC-ORD-027-02-01 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Native resources (ShoppingCart.ReorderWarning, Plugins.Misc.RFQ.*) are reused unchanged.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| PAY (internal) | Acceptance event to escrow (IC-ORD-01); invoice issued (IC-ORD-04); LC and hold shipment guards (IC-ORD-11, ORD side IC-ORD-02) | PAY-007, PAY-025, PAY-006 | |
| RET (internal) | Refund trigger for partial supply (IC-RET-04, ORD side IC-ORD-05); open-case check before acceptance (IC-RET-01); Return.Completed to stage Returned | RET-005, RET-007, RET-004 | |
| CHK (internal) | Seller task at placement (IC-CHK-06, ORD side IC-ORD-09); hold guard on shipment status actions (IC-CHK-07); sample-limit cart check (IC-CHK-01) | CHK-004, CHK-003 | OVR-REG |
| ADM workflow engine and approval queues | Requisition, amendment and scheme workflows | ADM-002, ADM-006 | Held by WF-ENG |
| DOC document generation | Invoices, consolidated receipts, proformas, contracts and letters (IC-DOC-01 render; ORD tokens IC-ORD-07 through IC-DOC-02); signature verification (IC-DOC-04) | DOC-001, DOC-003 | |
| E-signature provider | Send for signing, callbacks with evidence | Not named | P2; external system |
| LOG | Cut-offs to delivery estimate; seller batch print; seller pickup and drop-off at hand-over; contract orders to fulfilment | LOG-005, LOG-009, LOG-011, LOG-022 | |
| SEL | Seller penalties to settlements (IC-SEL-05 AddSellerCharge); due times for the on-time KPI; panel members for RFQ invitations (BR-SEL-019) | SEL-017, SEL-011, SEL-014 | |
| CAT and SVC (internal) | Quote request from a product page (IC-ORD-08) | CAT-013, SVC-001 | |
| FIN (internal) | Registry eligibility for scheme applications (IC-FIN-04) | FIN-004 | P3 |
| TRK | Stage, deadline, quote, offer and letter notifications (IC-TRK-04 SendEvent) | TRK-005 | |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-ORD-01 | OrderAcceptedEvent (published) | OrderId, AcceptedOnUtc, AcceptedBy, Deemed | — | — | Plugin event class published with IEventPublisher by the ORD acceptance service; PAY-007 consumer only enqueues the release job |
| IC-ORD-02 | ORD-010 hold guard (ORD implements IC-ORD-11 and IC-CHK-07) | Order, shipment items or shipment, action, acting user | Allow, or refuse with message key Ord.OrderOnHold | Provider error = refuse (fail closed, as IC-ORD-11) | Registered with the ORD-010 shipment-guard host as an IC-ORD-11 provider (IShipmentService.InsertShipmentAsync override and Admin AddShipment action filter) and with the CHK-003 IOrderProcessingService override as an IC-CHK-07 order-action guard (ShipAsync, ReadyForPickupAsync, DeliverAsync). ORD-010 owns no override (OVR-REG) |
| IC-ORD-03 | Withdrawn in 0.2 | — | — | — | Was the fiscal data provider read by an ORD IPdfService override. Under OVR-REG DOC-001 owns IPdfService; ORD supplies document fields through its token provider IC-ORD-07 (via IC-DOC-02), and PAY-025 prints fiscal data through its own DOC token provider (IC-DOC-02, BR-DOC-001) |
| IC-ORD-04 | Invoice.Issued (published) | InvoiceDocumentId, OrderId, VendorId, Type | — | — | Plugin event; PAY-025 consumes it to queue fiscal submission |
| IC-ORD-05 | Refund trigger (called; RET contract IC-RET-04 RaiseRefundTrigger) | Source module ORD, source type PartialSupply, source ID (PartialSupplyProposal), order ID, lines (OrderItem ID, quantity, amount), reason | RefundTrigger ID and state | Unregistered source type; amount above refundable; duplicate key | RET-005 service; called by ORD-006 only. Cancellation refunds of ORD-004 are raised by RET-005 itself from OrderStatusChangedEvent; ORD never calls PAY-016 directly |
| IC-ORD-06 | E-signature adapter | Contract PDF, signers, order (sequential / parallel) | Envelope reference; callbacks with signer evidence | Provider error | ORD-017 adapter (provider not named); callback controller pattern as IC-PAY-01 HandleCallback; the returned signed PDF is verified through IC-DOC-04 VerifySignature |
| IC-ORD-07 | ORD document token provider (ORD provides; DOC-001 calls) | Document type (Invoice, ConsolidatedReceipt, Proforma, commercial invoice, contract, award letter), source record | Token values: invoice number, checkout reference, sub-order list, seller name and tax number, company tax fields, fee lines, Incoterm code and named place, contract parties, value and terms, letter deadline and reference | Required token without value (DOC refuses generation, Doc.GenerationDataMissing) | Registered with DOC through IC-DOC-02; documents are rendered by DOC-001 through IC-DOC-01 |
| IC-ORD-08 | Create quote request from a product (ORD provides; CAT-013 and SVC-001 call) | Customer, store, product, quantity, attributes XML, notes | RequestQuote ID | Misc.RFQ not installed; access denied (Misc.RFQ.AccessRFQ.PublicStore.AccessRFQ); product not quotable | ORD service: inserts RequestQuote (status Submitted) through IRepository<RequestQuote>, the item through RfqService.InsertRequestQuoteItemAsync, then RfqMessageService.CustomerSentNewRequestQuoteAsync; the cart is not used |
| IC-ORD-09 | Seller task creation (ORD participant of IC-CHK-06) | Saved sub-order (Confirm phase) | SellerTask in state New | Error (CHK lists a placement exception, AUD-CHK-007) | Registered with the CHK-003 IOrderProcessingService override; Reserve and Release are no-ops |
| IC-ORD-10 | ValidateLineTransition / GetLineStageSet (ORD provides; SVC-005 calls) | Product type or stage-set code; from stage, to stage | Allowed or refused; the ordered stage list with localised names | Unknown stage set | ORD stage configuration service; the line state and its event stay in the calling module (BR-ORD-014) |
| IC-ORD-11 | Shipment guard provider (defined by the core host ORD-010) | Order, shipment and its items, acting user | Allow, or refuse with message key | Provider error = refuse (fail closed) | Implemented by ORD-010 (hold, IC-ORD-02), PAY-006 (letter of credit, BR-PAY-030) and EGV-004 (application Issued, BR-EGV-008); registered in DI and called by the ORD-010 IShipmentService.InsertShipmentAsync override and the AddShipment action filter (BR-ORD-055) |

Operation signatures (C# interfaces) are produced at L2 build start and approved by the tech lead; this table fixes the operations and their mapping. Under decision OVR-REG (Proposed) ORD owns no nopCommerce service override except ICustomNumberFormatter (ORD-007, entered in the ADM extension register BR-ADM-001). ORD plugs into CHK-004 (IOrderProcessingService: IC-ORD-09 through IC-CHK-06, IC-ORD-02 through IC-CHK-07), ORD-010 (shipment-guard host, IC-ORD-11), DOC-001 (IPdfService: IC-ORD-07 through IC-DOC-02) and TRK-005 (IWorkflowMessageService: events through IC-TRK-04).

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Order.Accepted | OrderAcceptedEvent (new, published by the ORD acceptance service; IC-ORD-01) | PAY-007 consumer enqueues the escrow release job; RPT |
| Order.StageChanged | None (ORD event); driven by native OrderPaidEvent, ShipmentSentEvent, ShipmentReadyForPickupEvent, ShipmentDeliveredEvent, OrderStatusChangedEvent, OrderRefundedEvent and RET Return.Completed | TRK-005 notifications (IC-TRK-04), RPT, ORD snapshot, ADM-007 operational view |
| Order.Cancelled (ORD-004) | OrderStatusChangedEvent (native, raised by CancelOrderAsync) | RET-005 consumer raises the Cancellation refund trigger for a paid order (ORD raises no refund); CHK-006 window release and CHK-012 code revocation run as CHK-004 cancellation participants (IC-CHK-08); INV |
| Order.HoldPlaced / HoldReleased | None (ORD event) | Seller dashboard, SEC |
| Invoice.Issued | None (ORD event; IC-ORD-04) | PAY-025 fiscal submission |
| Quote.Accepted / Declined / Expired | None (ORD events); native QuoteStatus OrderCreated / Expired | TRK-005 notifications to buyer and sellers |
| Shipment creation and status actions (hold check) | IShipmentService.InsertShipmentAsync override (ORD-010 host, IC-ORD-11); IOrderProcessingService ShipAsync / ReadyForPickupAsync / DeliverAsync override (CHK-003, IC-CHK-07) | ORD-010 guard refuses while a hold is active; ShipmentCreatedEvent is notification only |
| Quote request from a product page | IC-ORD-08 call by CAT-013 or SVC-001 | Native RequestQuote inserted; native new-request message sent |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Buyer cancels while a payment callback arrives | ORD-004, PAY-004 | Both use ILocker key 'pay-order-{OrderId}'; whichever runs second re-reads: a paid order is cancelled and RET-005 raises the refund trigger; a callback after cancellation follows SuccessfulAfterCancel (SM-PAY-01) |
| Seller hands over while a hold is placed | ORD-005, ORD-010 | Same order lock; the second action re-reads and either refuses hand-over (Ord.OrderOnHold) or places the hold on a shipped order (shown for review) |
| Deadline task cancels while the seller accepts | ORD-004, ORD-005 | Same order lock; the task re-checks the task status inside the lock and does nothing if Accepted |
| Buyer accepts while a dispute is opened | ORD-002, RET-007 | Same order lock; acceptance re-checks for an open dispute inside the lock |
| Buyer accepts a quote while the seller sends a counter-offer on it | ORD-013 | ILocker key 'ord-quote-{QuoteId}'; the second action re-reads the quote status |
| Recurring task on two nodes | ORD-028 | ILocker key 'ord-recurring-{RecurringPaymentId}' plus the RecurringPaymentHistory check; distributed only when DistributedCacheConfig.Enabled (L1 §6.4) |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Stage changed (customer-visible stages) | Buyer | Per TRK-005 configuration | ORD-002 |
| Order cancelled (buyer, seller or deadline) | Buyer; seller | Email (native OrderCancelled templates) + SMS per TRK-005 | ORD-004 |
| New order / payment confirmed / deadline approaching | Seller | Email (native OrderPlaced.VendorNotification, OrderPaid.VendorNotification) + reminder via TRK-005 | ORD-005 |
| Partial supply proposed | Buyer | Email + SMS | ORD-006 |
| SLA breach escalation | Configured roles | Email / admin notification | ORD-011 |
| RFQ invitation; question answered; quote received; counter-offer; quote declined or expired | Sellers / buyer | Email + in-app | ORD-012, ORD-013 |
| Requisition decision; contract for review or signing; letter issued; security expiring | Buyer / staff | Email | ORD-015 to ORD-021 |
| Group deal target reached or closed | Participants | Email + SMS | ORD-023 |
| Recurring payment failed or cancelled | Buyer | Email (native RecurringPaymentFailed / RecurringPaymentCancelled templates) | ORD-028 |
| Next recurring payment due (5.00) | Buyer | Email (native NextRecurringPaymentNotification.CustomerNotification, through TRK-005) | ORD-028 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Order export with filters | ORD-001 | REQ-MPC-FR-174 |
| Interventions by reason code and user | ORD-003 | REQ-MPC-FR-156 |
| Cancellations by reason and party; seller penalties | ORD-004 | REQ-MPC-FR-155, FR-170 |
| Service-level performance and overdue orders | ORD-011 | REQ-MPC-FR-311 |
| Quotes and conversion by request and seller | ORD-012, ORD-013 | D |
| Contracts, call-offs and remaining quantities | ORD-019, ORD-022 | FC-M08-025 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-ORD-001 | Order intervention, stage change, cancellation or partial-supply change | Staff / buyer / seller / system | Order, OrderIntervention | action, reason code, comment, before and after values |
| AUD-ORD-002 | Refused stage transition | User / system | Order | from, to, requester, reason for refusal |
| AUD-ORD-003 | Order acceptance (explicit or deemed) | Buyer / staff / system | OrderAcceptance | accepted by, time, deemed |
| AUD-ORD-004 | Seller task step | Seller / system | SellerTask | from, to, time |
| AUD-ORD-005 | Hold placed or released | Risk staff / system | OrderHold | reason, source, user |
| AUD-ORD-006 | Contract approval, signature, amendment | Staff / signer / provider | Contract | version, signer evidence, decision |
| AUD-ORD-008 | Shipment insert refused by a shipment guard (BR-ORD-055) | User / system | Order (shipment not saved) | guard provider, message key, acting user, path |
| AUD-ORD-007 | Configuration change (stages, reason codes, policies, service levels, masks, Incoterms) | Administrator | Configuration entity | old and new values |

All audit events are written to the platform audit trail through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id (the order ID or the checkout reference); old and new values are captured by the IRepository<> decorator (BR-SEC-010); ORD writes every table through IRepository<> and does not use the activity log as audit. Names and fields are Proposed. AUD-ORD-007 covers every Orders.Core.Configuration.CreateEditDelete change.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-ORD-001 | Audit entries for order state transitions and key field changes are immutable. | REQ-MPC-FR-175; NFR-X-003 | AC-ORD-003-02-01; T-ORD-03 |
| NFR-ORD-002 | Concurrent actions on one order never lose a change (order lock and re-read). | FC-M03-022; NFR-X-007 | AC-ORD-003-04-01; T-ORD-04 |
| NFR-ORD-003 | No client-specific code: stages, reasons, policies, service levels and masks are configuration. | NFR-X-008 | AC-ORD-002-01-01; AC-ORD-011-02-01 |
| NFR-ORD-004 | Response-time targets for the order console and seller dashboard: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-ORD-001 | P1 | — | |
| PRD-ORD-002 | P1 | — | PRD-SVC-005 |
| PRD-ORD-003 | P1 | PRD-SEC-004 | |
| PRD-ORD-004 | P1 | — | |
| PRD-ORD-005 | P1 | — | |
| PRD-ORD-006 | P1 | — | |
| PRD-ORD-007 | P1 | — | |
| PRD-ORD-008 | P1 | — | |
| PRD-ORD-009 | P1 | PRD-DOC-001 | PRD-PAY-025 |
| PRD-ORD-010 | P1 | — | PRD-PAY-006, PRD-EGV-004 |
| PRD-ORD-011 | P1 | — | PRD-SVC-011 |
| PRD-ORD-012 | P1 | — | PRD-ORD-013 |
| PRD-ORD-013 | P1 | PRD-ORD-012 | |
| PRD-ORD-014 | P1 | — | |
| PRD-ORD-015 | P1 | PRD-ADM-002 | |
| PRD-ORD-016 | P1 | PRD-DOC-001 | PRD-ORD-017, PRD-ORD-022 |
| PRD-ORD-017 | P2 | PRD-ORD-016 | |
| PRD-ORD-018 | P2 | PRD-ADM-002 | |
| PRD-ORD-019 | P2 | — | |
| PRD-ORD-020 | P2 | PRD-DOC-001 | |
| PRD-ORD-021 | P3 | — | |
| PRD-ORD-022 | P1 | PRD-ORD-016 | |
| PRD-ORD-023 | P2 | — | |
| PRD-ORD-024 | P3 | PRD-ADM-002 | |
| PRD-ORD-025 | P1 | PRD-DOC-001 | |
| PRD-ORD-026 | P1 | — | |
| PRD-ORD-027 | P2 | — | |
| PRD-ORD-028 | P2 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-ORD-01 | Stages: every declared transition succeeds and every undeclared one is refused and logged; auto-advance from each native event; native status never set directly. |
| T-ORD-02 | Acceptance: explicit, deemed (window), blocked by dispute; OrderAcceptedEvent published exactly once; PAY-007 consumer only enqueues. |
| T-ORD-03 | Interventions: each native admin edit action without reason is refused; with reason it is applied and audited; approval cases; audit entries cannot be changed. |
| T-ORD-04 | Concurrency: cancellation vs payment callback, hand-over vs hold, deadline task vs accept, under the shared order lock. |
| T-ORD-05 | Holds: shipment insert (through the ORD-010 host, IC-ORD-11) and ShipAsync / ReadyForPickupAsync / DeliverAsync (through the CHK-003 override, IC-CHK-07) refused while Active, from admin, vendor, tracking and API paths; ORD registers no service override other than ICustomNumberFormatter. |
| T-ORD-06 | RFQ: seller isolation, shared answers, expiry task, acceptance declines other quotes, cart replacement warning, order links. |
| T-ORD-07 | Recurring: due Manual payments processed once per cycle across two runs and two nodes; Automatic ignored; failure path. |
| T-ORD-08 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-ORD-09 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
| T-ORD-10 | Refunds: a paid cancellation by buyer, seller and deadline task produces exactly one RET-005 Cancellation trigger and no ORD call to PAY; accepted partial supply raises one PartialSupply trigger with the line amounts. |
| T-ORD-11 | Documents and requests: invoice, consolidated receipt and proforma rendered by DOC-001 with ORD tokens (IC-ORD-07); missing company field blocks issue; a product-page quote request (IC-ORD-08) creates a Submitted request without touching the cart; line-stage transitions for service lines are checked through IC-ORD-10 against SM-SVC-01. |
| T-ORD-12 | accepted partial supply reduces quantities with no StockQuantityHistory entry and no call of the native EditOrderItem action, with AutoUpdateOrderTotalsOnEditingOrder on and off; ORD event codes are registered at installation and a notify stage cannot be saved without a code; a penalty creates exactly one IC-SEL-05 charge, also on retry. |
