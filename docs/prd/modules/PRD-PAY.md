# L2 Module PRD — PAY: Payments, tax, settlement and reconciliation

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | PAY — Payments, tax, settlement and reconciliation |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets buyers pay by every method the two clients require (card, PayPal, mobile money, bank transfer, letter of credit, escrow, cash on delivery and at outlets, wallet), records every payment through one status lifecycle, refunds and reverses money, splits marketplace payments, calculates tax, reconciles provider statements, connects statutory e-invoicing, and lets a new payment provider be added by building one adapter instead of changing the shop.

**In scope**

- Payment method activation and routing rules (PAY-001)
- Payment adapters: card framework and client card gateways, PayPal, mobile-money framework and M-Pesa / TNM Mpamba / Airtel Money adapters, bank transfer (PAY-002 to PAY-005, PAY-028 to PAY-032)
- Offline and trade instruments: letter of credit, escrow with staged release, cash on delivery and at outlet, banker's cheques and payment slips (PAY-006 to PAY-008)
- Wallet and store credit, split payments, direct payment to the seller and its offline confirmation (PAY-009, PAY-010, PAY-035, PAY-036)
- Payment lifecycle, idempotency, receipts, reconciliation, fees, refunds, chargebacks, risk controls, operations console (PAY-011 to PAY-019)
- Tax calculation, tax on fees and tax reports, statutory e-invoicing framework and the KRA eTIMS and MRA EIS adapters (PAY-020, PAY-021, PAY-025 to PAY-027)
- Multi-currency settlement, payment connector SDK, accounts receivable, outlet receipts and cash-up, bulk disbursements (PAY-022 to PAY-024, PAY-033, PAY-034)

**Not in this module**

| Item | Where it is |
|---|---|
| Checkout steps, address and cart validation | CHK module (PRD-CHK-002, CHK-003, CHK-008) |
| Assisted checkout by agents (order creation) | CHK module (PRD-CHK-013); PAY-034 records the agent's payment and receipt |
| Return requests and dispute cases (the refund money movement is in PAY) | RET module (PRD-RET-001, RET-007) |
| Automatic refund triggers (return accepted, paid order cancelled, service failure, other module sources) | RET module (PRD-RET-005, IC-RET-04) — the single owner; RET calls the PAY-016 refund request (IC-PAY-05, consumed as IC-RET-02) |
| Seller payouts schedule and seller statements | SEL module (PRD-SEL-017) — PAY-010 produces the split amounts it pays out |
| Commission and fee rules | SEL module (PRD-SEL-016) — PAY-010 reads the rules in force through IC-SEL-02 |
| Commission invoicing to sellers | SEL module (PRD-SEL-025) |
| Invoice numbering and invoice documents | ORD module (PRD-ORD-009) — PAY-025 submits them to the tax authority |
| Delivery and pickup fee tables | LOG module (PRD-LOG-002) — PAY-015 owns payment and COD fees |
| SMS gateway | CHN module (PRD-CHN-005) — PAY-013 uses it |
| Fraud case management beyond payment rules (referral cases) | CRM module (PRD-CRM-010) — it consumes the PAY-018 event Risk.Flagged; blocked and watched lists are SEL-013 |
| Invoice PDF rendering (IPdfService override) and invoice layout | DOC module (PRD-DOC-001) and ORD module (PRD-ORD-009) — PAY-025 supplies only the fiscal fields through a DOC token provider (IC-DOC-02) |
| Order total calculation override (IOrderTotalCalculationService) | CAT module (PRD-CAT-042, decision OVR-REG) — PAY-009 option (b) of WAL-01 would be a provider to it |
| Unpaid-order timeout per payment method | INV module (PRD-INV-004, decision INV-HOLD) |
| Holding buyer funds (escrow account itself) | External: a bank or payment-service provider (fit: Not implementable in nopCommerce, PAY-007) |
| Lending, factoring, insurance | FIN module |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-PAY-001 | Payment method framework and routing | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PAY-002 | Card payments (framework) | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 | |
| PRD-PAY-003 | PayPal | B2B + B2C | P1 | Configuration | None | Commerce extensions pack | | K-08 |
| PRD-PAY-004 | Mobile money (framework) | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024, PRD-INV-004 | |
| PRD-PAY-005 | Bank transfer | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 | |
| PRD-PAY-006 | Letters of credit | B2B | P1 | Code-level | Custom plugin (provider under OVR-REG) | B2B trade pack | PRD-ORD-010 | |
| PRD-PAY-007 | Escrow and staged release | B2B | P1 | External system | External system + integration plugin | B2B trade pack | | PAY-DIRECT / LIC-01 |
| PRD-PAY-008 | Cash on delivery and cash at outlet | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 | |
| PRD-PAY-009 | Wallet and store credit | B2B + B2C | P1 | Code-level | Custom plugin | Engagement and loyalty pack | | FG-06, PAY-DIRECT / LIC-01, WAL-01 |
| PRD-PAY-010 | Split payments | B2B + B2C | P1 | Code-level | Custom plugin | Marketplace pack | PRD-PAY-024 | PAY-DIRECT / LIC-01 |
| PRD-PAY-011 | Payment status lifecycle | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PAY-012 | Payment idempotency | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PAY-013 | Payment receipts | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-CHN-005 | |
| PRD-PAY-014 | Payment reconciliation | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 | |
| PRD-PAY-015 | Payment fees | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PAY-016 | Refunds | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-024 | |
| PRD-PAY-017 | Chargebacks | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PAY-018 | Payment and order risk controls | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-PAY-019 | Payments operations console | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PAY-020 | Tax calculation | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-PAY-021 | Tax on fees and tax reporting | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PAY-022 | Bulk disbursements | B2B + B2C | P3 | Code-level | Custom plugin | Agri-finance and schemes pack | PRD-PAY-024 | |
| PRD-PAY-023 | Multi-currency settlement | B2B + B2C | P1 | Code-level | Custom plugin | Commerce extensions pack | | C-FX |
| PRD-PAY-024 | Payment connector SDK | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PAY-025 | Fiscal e-invoicing framework | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-ORD-009 | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-026 | KRA eTIMS adapter | B2B + B2C | P1 | External system | External system + integration plugin | Country: Kenya | PRD-PAY-025 | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-027 | MRA EIS adapter | B2B + B2C | P1 | External system | External system + integration plugin | Country: Malawi | PRD-PAY-025 | PH-INF, E-INV, DOC-LIB |
| PRD-PAY-028 | M-Pesa (Kenya) adapter | B2B + B2C | P1 | Code-level | Custom plugin | Country: Kenya | PRD-PAY-004 | |
| PRD-PAY-029 | TNM Mpamba adapter | B2B + B2C | P1 | Code-level | Custom plugin | Country: Malawi | PRD-PAY-004 | |
| PRD-PAY-030 | Airtel Money adapter | B2B + B2C | P1 | Code-level | Custom plugin | Country: Kenya/Malawi | PRD-PAY-004 | |
| PRD-PAY-031 | KTDA bank card gateway adapter | B2B + B2C | P1 | Code-level | Custom plugin | Client: KTDA | PRD-PAY-002 | KG-04 |
| PRD-PAY-032 | MPC card gateway adapter | B2B + B2C | P1 | Code-level | Custom plugin | Client: MPC | PRD-PAY-002 | MG-03 |
| PRD-PAY-033 | Accounts receivable | B2B | P1 | Code-level | Custom plugin | B2B trade pack | | PAID-STUB |
| PRD-PAY-034 | Outlet receipt printing and cash-up | Platform / back-office | P1 | Code-level | Custom plugin | Assisted service pack | | PH-INF |
| PRD-PAY-035 | Direct payment to the seller | B2B + B2C | P2 | Code-level | Custom plugin | Marketplace pack | PRD-PAY-024 | PO-REC-v8, PAY-DIRECT / LIC-01 |
| PRD-PAY-036 | Offline direct payment confirmation | B2B + B2C | P2 | Code-level | Custom plugin | Marketplace pack | PRD-RET-007 | WF-ENG, PO-REC-v8, PAY-DIRECT / LIC-01 |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Pays, retries, sees payment status and receipts, requests refunds through returns | Guests / Registered (native) |
| Business buyer | Pays by bank transfer, letter of credit, escrow or on account; confirms offline direct payments | Registered + TradeBuyer (IAM-023; BR-IAM-050); company role in the IAM-022 company record (BR-IAM-120) |
| Seller | Sees split amounts; with direct payment, connects own payment account, marks offline payments paid, issues refunds — through PAY plugin endpoints (native admin payment actions are blocked for vendors) | Vendors (native) + IAM-007 |
| Finance staff | Reconciles, approves large refunds, manages fees, chargebacks, letters of credit, escrow releases, cash-up review, tax reports | Role system name "Finance" (Proposed; product role catalogue BR-IAM-050) |
| Outlet staff (agent) | Takes cash at outlets, records the payment method on assisted orders, prints receipts, closes the shift cash-up | Role system name "Agent" (IAM-026; BR-IAM-050) |
| Fraud staff | Configures risk rules, reviews flagged payments | Role system name "Risk" (Proposed; BR-IAM-050) |
| Client administrator | Activates payment methods, sets routing rules, enters provider credentials | Administrators (native) |
| Platform team | Builds and certifies payment adapters against the connector SDK | Not a runtime role |
| Payment provider / bank (system) | Sends payment results, reversals and statements | External system via adapter |
| Tax authority system (KRA eTIMS, MRA EIS) | Receives invoices and credit notes, returns fiscal number / QR | External system via adapter |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Configuration.ManagePaymentMethods (native) | Configuration | Activate payment methods, edit restrictions and credentials; with PAY installed also edit routing rules | Administrators |
| Payments.Core.Transactions.View | Orders | View payment transactions, logs and the exceptions list | Administrators, Finance, Risk |
| Payments.Core.Transactions.CreateEditDelete | Orders | Manual actions on a payment: re-query status, mark paid with evidence, capture, void (always with a reason, audited) | Finance |
| Payments.Core.Refunds.Request | Orders | Raise a refund (native refund buttons are intercepted and routed here) | Finance; Vendors (own direct-payment orders only) |
| Payments.Core.Refunds.Approve | Orders | Approve refunds above the threshold; cannot approve own request | Finance |
| Payments.Core.Fees.CreateEditDelete | Configuration | Edit fee schedules | Finance |
| Payments.Core.Reconciliation.CreateEditDelete | Orders | Import statements, resolve exceptions, export the daily file | Finance |
| Payments.Core.Risk.CreateEditDelete | Configuration | Create, enable and disable risk rules | Risk |
| Payments.Core.TradeFinance.CreateEditDelete | Orders | Record and verify letters of credit; approve escrow releases | Finance |
| Payments.Core.CashUp.CreateEditDelete | Orders | Open and close an outlet shift | Agent; review: Finance |
| Payments.Core.Tax.View | Orders | Run tax reports, filing files and e-invoicing submission lists | Finance |
| Payments.Core.Disbursement.Approve | Orders | Approve a bulk disbursement batch | Finance (second person) |

Permissions are declared in a PAY plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix and the 5.00 view / create-edit-delete split (StandardPermission naming unchanged in 5.00.1); Category is taken from the native set. Default roles are given by role system name; the names Finance, Risk and Agent are used exactly as in the IAM product role catalogue (BR-IAM-050), and the IAM plugin creates every missing catalogue role. PAY does not rely on native start-up for this: native PermissionService creates a missing default role only when it first inserts a new permission record. Holding the native Orders.OrdersCreateEditDelete alone must not allow payment actions: the native admin actions (mark as paid, refund, refund offline, partial refund, void, void offline, capture) are intercepted by PAY (BR-PAY-082). Group payment (IC-PAY-02) adds no permission: it runs inside checkout placement. The provider operations PAY exposes to other modules (IC-PAY-02 to IC-PAY-09) are in-process service calls, not endpoints, and check no permission of their own; the calling module checks its own. All names are Proposed. Source: NOP_Review_L2_PAY.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-PAY-PERM-01 | **Given** a user without Configuration.ManagePaymentMethods (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-02 | **Given** a user without Payments.Core.Transactions.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-03 | **Given** a user without Payments.Core.Transactions.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-04 | **Given** a user without Payments.Core.Refunds.Request, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-05 | **Given** a user without Payments.Core.Refunds.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-06 | **Given** a user without Payments.Core.Fees.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-07 | **Given** a user without Payments.Core.Reconciliation.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-08 | **Given** a user without Payments.Core.Risk.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-09 | **Given** a user without Payments.Core.TradeFinance.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-10 | **Given** a user without Payments.Core.CashUp.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-11 | **Given** a user without Payments.Core.Tax.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PAY-PERM-12 | **Given** a user without Payments.Core.Disbursement.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-PAY-001 | Activate/deactivate methods; restrict by country (Payment restrictions page); limit plugin to stores and customer roles; each method can hide itself per cart. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Payments/PaymentSettings.cs:PaymentSettings.ActivePaymentMethodSystemNames; src/Presentation/Nop.Web/Areas/Admin/Controllers/PaymentController.cs:MethodRestrictions; src/Libraries/Nop.Services/Plugins/PluginDescriptor.cs:PluginDescriptor.LimitedToStores, LimitedToCustomerRoles; src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.HidePaymentMethodAsync; PG CHK-13 | Routing by rural/urban, pickup vs delivery, service type. Post Gebeya pickup restriction is AFR (CHK-13): AFR port required. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-002 | Payment plugin contract supports redirect/hosted pages, capture, void, full/partial refund. \| 5.00: Payments.Manual plugin removed from the bundle; card fields on Order are obsolete ("not used since 5.00", removal in 5.10) and card properties were removed from ProcessPaymentRequest/ProcessPaymentResult; core no longer stores card data. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Orders/Order.cs (Obsolete properties region: AllowStoringCreditCardNumber, CardNumber, CardCvv2 ...); Libraries/Nop.Services/Payments/ProcessPaymentRequest.cs; Libraries/Nop.Services/Payments/IPaymentService.cs (GetMaskedCreditCardNumber removed); 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.PostProcessPaymentAsync, RefundAsync, VoidAsync, SupportPartiallyRefund; PG CHK-10 | Bank card gateway adapters with hosted payment page. Post Gebeya CyberSource (CHK-10, 3P AFR) built for 4.70.5: needs 5.00 version from vendor / AFR port required. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-003 | Bundled PayPal Commerce plugin (v4.90.20) with refund and partial refund. \| PayPal Commerce plugin v5.00.7 bundled in 5.00.1. \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Payments.PayPalCommerce/plugin.json; 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Payments.PayPalCommerce/plugin.json (SupportedVersions 4.90); PayPalCommercePaymentMethod.SupportRefund, SupportPartiallyRefund | None in code. PayPal merchant availability in Kenya/Malawi to confirm (not stated in source). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-004 | Payment plugin contract (process, post-process redirect, refund, void). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod; PG CHK-08 | Mobile-money framework: STK-push request, callback handling, reversals, QR, matching. Post Gebeya M-Pesa (CHK-08) is Ethiopian, not reusable. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-005 | Offline method (Check/Money order) shows instructions; staff mark order paid in admin. \| NEW in 5.00: pending-order reminders (ProcessPendingOrdersTask; templates Reminders.PendingOrderFollowUp1/2) remind customers of unpaid orders; optional auto-cancel of unpaid orders (OrderSettings.AutoCancel*). \|\| 5.00.1 evidence: Libraries/Nop.Services/Reminders/ProcessPendingOrdersTask.cs:17,54; Libraries/Nop.Core/Domain/Messages/MessageTemplateSystemNames.cs (REMINDER_PENDING_ORDER_FOLLOW_UP_1/2); Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:184-204; 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Payments.CheckMoneyOrder; src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:MarkOrderAsPaid | Unique payment reference per order and automatic matching of incoming bank payments. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-006 | Offline method + manual mark-as-paid. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Payments.CheckMoneyOrder; src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:MarkOrderAsPaid | Letter-of-credit capture, verification workflow, hold before shipping. Custom plugin; the shipment block is an IC-ORD-11 guard provider to the ORD-010 host. | Custom plugin (provider under OVR-REG) | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-PAY-007 | Payment status Authorized → Paid (capture) supports a simple hold/capture where the gateway allows it. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Payments/PaymentStatus.cs:PaymentStatus.Authorized; src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.CaptureAsync | Holding buyer funds is a regulated service of a bank/PSP escrow or trust account. nopCommerce needs an integration plugin that triggers staged releases on dispatch/delivery/acceptance events. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no escrow entity in source; fund custody is outside a storefront |
| PRD-PAY-008 | No cash-on-delivery plugin bundled in 4.90.8; Check/Money order can act as offline method; admin mark-as-paid; per-method fee and hide hook. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Plugins (no CashOnDelivery plugin); src/Plugins/Nop.Plugin.Payments.CheckMoneyOrder; src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.HidePaymentMethodAsync, GetAdditionalHandlingFeeAsync; PG CHK-11 | COD and cash-at-outlet with secure reference, restriction by seller/item/area, banker's cheques / payment slips matching. Post Gebeya COD (CHK-11, 3P AFR) built for 4.70.5: needs 5.00 version from vendor / AFR port required. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-009 | Reward points (with currency exchange rate) and gift cards act as store credit. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Customers/RewardPointsSettings.cs:RewardPointsSettings.ExchangeRate; src/Libraries/Nop.Core/Domain/Orders/GiftCard.cs:GiftCard.Amount | Wallet balance with top-up and spend. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-010 | None: no commission or split concept (grep 'commission' returns nothing in Libraries/Presentation). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Vendors/Vendor.cs:Vendor (no commission fields) | Seller share / delivery fee / commission split per payment, with PSP split API. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-PAY-011 | PaymentStatus: Pending, Authorized, Paid, PartiallyRefunded, Refunded, Voided; re-post payment for unpaid orders. \| 5.00: Order.LastPendingOrderFollowUpNumber/DateUtc (pending-order reminders) and AutoCancelOrdersTask (cancels orders with PaymentStatus Pending after AutoCancelDelay). PaymentStatus enum unchanged. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Orders/Order.cs:264,269; Libraries/Nop.Services/Orders/AutoCancelOrdersTask.cs:63-77; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Payments/PaymentStatus.cs:PaymentStatus; src/Libraries/Nop.Core/Domain/Payments/PaymentSettings.cs:PaymentSettings.AllowRePostingPayments; src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.CanRePostProcessPaymentAsync | Started/failed/reversed statuses and per-attempt transaction log shown to customer. Custom plugin (transaction entity). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-012 | Order-level duplicate protection (PlaceOrderWithLock, new in 4.90; MinimumOrderPlacementInterval); OrderGuid reuse within PaymentSettings.RegenerateOrderGuidInterval (default 180 s). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.PlaceOrderWithLock, MinimumOrderPlacementInterval; src/Libraries/Nop.Services/Orders/OrderProcessingService.cs:OrderProcessingService.PlaceOrderAsync | Payment-level idempotency keys for provider retries/callbacks, inside each adapter. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-013 | Order-paid email to customer; PDF invoice attachable to order-paid email. \| NEW in 5.00: SMS provider framework (ISmsService/ISmsProvider, admin SMS providers page) and bundled Sms.Twilio provider; in 5.00.1 the only caller is phone OTP verification - no SMS message templates or order/payment events send SMS. \|\| 5.00.1 evidence: Libraries/Nop.Services/Messages/ISmsService.cs, ISmsProvider.cs, SmsService.cs:39; Presentation/Nop.Web/Areas/Admin/Controllers/SmsController.cs; Plugins/Nop.Plugin.Sms.Twilio/TwilioProvider.cs:13,56; only caller: Presentation/Nop.Web/Controllers/CustomerController.cs:632 (phone OTP); 4.90 evidence re-verified present in 5.00.1: message template OrderPaid.CustomerNotification; src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.AttachPdfInvoiceToOrderPaidEmail | SMS receipt: event consumer (order paid) calling ISmsService + receipt text/tokens. SMS gateway: Twilio is bundled; coverage/cost for Kenya and Malawi not verifiable from source; a local aggregator needs a custom ISmsProvider plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-014 | Orders export (Excel/XML) with payment data. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:ExportExcelAll, ExportXmlAll | Provider statement import, auto-matching, daily finance file. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-PAY-015 | Additional fee per payment method (each plugin returns it; fixed or % is plugin-specific); fee taxability settings. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.GetAdditionalHandlingFeeAsync; src/Libraries/Nop.Core/Domain/Tax/TaxSettings.cs:TaxSettings.PaymentMethodAdditionalFeeIsTaxable; PG CHK-12 | Versioned provider/platform fee schedules. Custom plugin. Post Gebeya fee (CHK-12, 3P AFR) needs a 5.00 version / AFR port. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-016 | Full and partial refunds (online via gateway or offline), refund statuses, refund notifications. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.RefundAsync, SupportPartiallyRefund; src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:PartiallyRefundOrderPopup; src/Libraries/Nop.Core/Domain/Payments/PaymentStatus.cs:PartiallyRefunded; message template OrderRefunded.CustomerNotification; PG ADM-S03 | Approval step for large refunds. Custom plugin. Scope: Proportional fee adjustment on partial refunds; expected refund time shown per payment method. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-017 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No chargeback entity in src/Libraries/Nop.Core/Domain/Payments | Chargeback/dispute tracking. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-PAY-018 | Order placement interval throttle; CAPTCHA; customer IP stored on order. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.MinimumOrderPlacementInterval; src/Libraries/Nop.Core/Domain/Orders/Order.cs:Order.CustomerIp | Velocity, device and other risk rules with flags. Custom plugin (optionally external fraud service). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-019 | System log, activity log, order notes, admin order payment actions. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Logging/Log.cs:Log; src/Libraries/Nop.Core/Domain/Orders/OrderNote.cs:OrderNote | Dedicated payments console (problem payments, manual intervention, audited actions). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-020 | Tax categories, bundled fixed/by-country-state-zip tax provider, prices incl./excl. tax, tax display type and suffix. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Tax/TaxSettings.cs:TaxSettings.PricesIncludeTax, TaxDisplayType, DisplayTaxSuffix, TaxBasedOn; src/Plugins/Nop.Plugin.Tax.FixedOrByCountryStateZip; PG CHK-16 | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-021 | Tax on shipping and payment fees; order export. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Tax/TaxSettings.cs:TaxSettings.ShippingIsTaxable, PaymentMethodAdditionalFeeIsTaxable; src/Libraries/Nop.Services/Orders/OrderReportService.cs (no tax report) | Tax on platform commissions/fees (no commission concept) and tax reports/filing files. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-022 | None (no payout concept). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No payout entity in src/Libraries/Nop.Core/Domain | Batch disbursements with approval, PSP B2C payout calls, status, retry. Custom plugin + PSP payout APIs. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-PAY-023 | Multiple currencies, exchange-rate provider (bundled ECB), order stores customer currency code and rate; display customer currency on orders. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Directory/Currency.cs:Currency.Rate; src/Plugins/Nop.Plugin.ExchangeRate.EcbExchange; src/Libraries/Nop.Core/Domain/Orders/Order.cs:Order.CustomerCurrencyCode, CurrencyRate; src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.DisplayCustomerCurrencyOnOrders | Charge in customer currency / settle in base currency with FX disclosure — depends on gateway adapter. Custom plugin + view. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-024 | IPaymentMethod covers process, redirect, capture, refund, void, recurring. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod | Status check, reconciliation file retrieval and payout operations are not in the contract. Custom plugin defining an extended connector interface. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-025 | PDF invoice generation (overridable IPdfService). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Common/IPdfService.cs:IPdfService.PrintOrderToPdfAsync | Fiscal submission queue, retry, fiscal number/QR on invoice, credit notes. Custom plugin + IPdfService override; country adapters per PAY-026/027. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-PAY-026 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No tax-authority integration in src/Plugins | External: KRA eTIMS (government e-invoicing system). nopCommerce needs an adapter plugin on the PAY-025 framework (submit invoice/credit note, receive fiscal number/QR). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: external government system |
| PRD-PAY-027 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No tax-authority integration in src/Plugins | External: MRA EIS (government e-invoicing system). Adapter plugin on the PAY-025 framework. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: external government system |
| PRD-PAY-028 | Payment plugin contract (IPaymentMethod). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod; PG CHK-08 | Safaricom M-Pesa (Daraja STK push, callbacks, reversals) adapter on the mobile-money framework (PRD-PAY-004). Custom plugin. Post Gebeya CHK-08 is Ethiopian M-Pesa, not reusable. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such provider plugin in src/Plugins |
| PRD-PAY-029 | Payment plugin contract (IPaymentMethod). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod | TNM Mpamba adapter on the mobile-money framework (PRD-PAY-004). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such provider plugin in src/Plugins |
| PRD-PAY-030 | Payment plugin contract (IPaymentMethod). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod | Airtel Money (Malawi; Kenya if needed) adapter on the mobile-money framework (PRD-PAY-004). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such provider plugin in src/Plugins |
| PRD-PAY-031 | Payment plugin contract (IPaymentMethod). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod | Adapter for the KTDA-chosen CBK-regulated card gateway (gateway not named). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such gateway plugin in src/Plugins |
| PRD-PAY-032 | Payment plugin contract (IPaymentMethod). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod | Adapter for the Malawi Post-chosen card gateway (gateway not named). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such gateway plugin in src/Plugins |
| PRD-PAY-033 | None (no AR ledger). Bundled Misc.Dynamics365 is a stub only. \| Re-verified in 5.00.1: Misc.Dynamics365 (v5.00.3) still a stub (IMiscPlugin, configure page links to nopcommerce.com/microsoft-dynamics-365). \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Misc.Dynamics365/Views/Configure.cshtml; 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Misc.Dynamics365/Views/Configure.cshtml (stub) | Statements, credit notes, invoice matching, ageing. Custom plugin, or delegate to the client ERP (external) with integration. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-PAY-034 | PDF invoice and packaging slip (A4/letter). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Common/IPdfService.cs:IPdfService.PrintPackagingSlipToPdfAsync; src/Libraries/Nop.Core/Domain/Common/PdfSettings.cs:PdfSettings.LetterPageSizeEnabled | 80 mm receipt/pickup-slip layouts, outlet shift cash-up. Custom plugin (printer hardware external). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PAY-035 | Payment plugins are configured per store (settings), not per vendor; no per-vendor merchant credentials. \| 5.00: single-seller orders can be enforced natively (ShoppingCartSettings.VendorEnabled + VendorRequired, see PRD-CHK-004). Payment plugins remain configured per store; no per-vendor merchant credentials found in 5.00.1 source. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Orders/ShoppingCartSettings.cs:131 VendorEnabled, :136 VendorRequired; Libraries/Nop.Core/Domain/Orders/ShoppingCartType.cs:21 Stash; Libraries/Nop.Services/Orders/ShoppingCartService.cs:1221-1227 (checkout blocked with >1 vendor and no vendor chosen), :1980-2009 SetShoppingCartVendorAsync (other vendors' items moved to Stash); Libraries/Nop.Services/Orders/OrderProcessingService.cs:1639 (vendor selection reset after order, stashed items return); Presentation/Nop.Web/Controllers/ShoppingCartController.cs:1274-1289 ChangeVendorCart; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Plugins/PluginDescriptor.cs:PluginDescriptor.LimitedToStores; src/Libraries/Nop.Core/Domain/Vendors/Vendor.cs:Vendor | Per-seller payment accounts via connector kit, routing payment to seller, recording result, seller refunds/disputes. Depends on single-seller orders (PRD-CHK-004). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-PAY-036 | Admin 'mark as paid' (store owner); vendors see their orders. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:MarkOrderAsPaid | Seller marks paid with proof upload, buyer confirmation, dispute case. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |


## 7. Feature specifications


### 7.1 PRD-PAY-001 Payment method framework and routing

| Item | Value |
|---|---|
| Description (baseline) | The client switches payment methods on or off and decides where each is offered, for example by shop, country, customer type, rural or urban location, pickup or type of service. |
| Why it matters | The right payment options appear for each situation. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, FEE-CTRL |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-001-01 | As a client administrator, I want to switch each payment method on or off, so that only the methods we have contracts for are offered. | D | Ready; conditions: OVR-REG, FEE-CTRL |
| US-PAY-001-02 | As a client administrator, I want to decide where each method is offered — by shop, country, customer type, rural or urban location, pickup or delivery, and type of service, so that the right options appear for each situation. | D; REQ-MPC-FR-305 | Ready; conditions: OVR-REG, FEE-CTRL |
| US-PAY-001-03 | As a shopper, I want to choose a payment method at checkout from the methods available to me, so that I can pay the way I prefer. | REQ-MPC-FR-116 | Ready; conditions: OVR-REG, FEE-CTRL |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-001-01-01 | US-PAY-001-01 | **Given** a payment method plugin is installed, **when** the administrator deactivates it, **then** it is not offered at checkout in any store, and existing orders paid with it keep their records. | D; FIT (PaymentSettings.ActivePaymentMethodSystemNames) |
| AC-PAY-001-02-01 | US-PAY-001-02 | **Given** a routing rule "method X only for location type = rural" is active, **when** an urban shopper reaches the payment step, **then** method X is not listed; a rural shopper sees it. | REQ-MPC-FR-305 |
| AC-PAY-001-02-02 | US-PAY-001-02 | **Given** a rule limits a method to service type S, **when** the cart holds a service of another type, **then** the method is not listed. | REQ-MPC-FR-305 |
| AC-PAY-001-02-03 | US-PAY-001-02 | **Given** a rule limits a method to pickup orders, **when** the shopper chose home delivery, **then** the method is not listed. | D (pickup); PG CHK-13 |
| AC-PAY-001-02-04 | US-PAY-001-02 | **Given** two rules apply to the same method, **when** checkout evaluates them, **then** the method is shown only if every applicable rule allows it (BR-PAY-001). | Proposed |
| AC-PAY-001-03-01 | US-PAY-001-03 | **Given** at least one method is available, **when** the shopper reaches the payment step, **then** all available methods are listed with name, logo and any fee (PAY-015). | REQ-MPC-FR-116 |
| AC-PAY-001-03-02 | US-PAY-001-03 | **Given** no method is available for the cart, **when** the shopper reaches the payment step, **then** checkout stops showing message Pay.NoMethodAvailable with the support contact, and no order is placed. | Proposed |
| AC-PAY-001-01-02 | US-PAY-001-01 | **Given** a client has several gateways, **when** the administrator activates them, **then** each is an independent payment method under the same routing rules. | REQ-MPC-PAY-001 |
| AC-PAY-001-02-05 | US-PAY-001-02 | **Given** the delivery address or pickup point falls in a LOG-004 coverage area, **when** the location type of a routing rule is evaluated, **then** the value is read from that coverage area (ServiceArea.LocationType, LOG-004); PAY keeps no location-type data of its own; an address in no coverage area matches no rural or urban rule. | Proposed (one source: LOG-004) |
| AC-PAY-001-03-03 | US-PAY-001-03 | **Given** the shopper confirms the order, **when** the CHK-003 placement override calls the PAY placement validators (IC-PAY-03, consumed as IC-CHK-02) before payment, **then** the routing check BR-PAY-001 is evaluated again on the final cart; if the chosen method is no longer allowed, placement stops with message Pay.MethodNotAllowed and no order is placed. | Proposed; OVR-REG |

**Business rules applied:** BR-PAY-001; BR-PAY-002 (§8.1).


### 7.2 PRD-PAY-002 Card payments (framework)

| Item | Value |
|---|---|
| Description (baseline) | Customers pay by debit or credit card on the bank's secure payment page. Card details never touch the shop, and refunds go back to the card. Each bank or gateway is connected as a separate adapter. |
| Why it matters | Safe card payments that stay within card-security rules. |
| Who benefits | Shoppers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-002-01 | As a shopper, I want to pay by debit or credit card on the bank's secure payment page, so that my card details stay safe. | D; REQ-KTDA-PAY-002; REQ-MPC-FR-129 | Ready |
| US-PAY-002-02 | As a member of finance staff, I want card refunds to go back to the same card, so that the refund trail is clean. | D | Ready |
| US-PAY-002-03 | Technical enabler. As a member of the platform team, I want to connect each bank or gateway as a separate adapter on the card framework, so that a new card gateway needs no change to the shop. | D; REQ-KTDA-PAY-001; REQ-MPC-PAY-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-002-01-01 | US-PAY-002-01 | **Given** card payment is active, **when** the shopper confirms the order, **then** the shopper is redirected to the gateway's hosted page (PaymentMethodType Redirection); the shop never receives or stores the card number, expiry or CVV. | D; REQ-KTDA-PAY-002; REQ-KTDA-PAY-007; REQ-MPC-FR-129; BR-PAY-011 |
| AC-PAY-002-01-02 | US-PAY-002-01 | **Given** the gateway returns success, **when** the callback is received and its signature verified, **then** the transaction becomes Successful and the platform calls IOrderProcessingService.MarkOrderAsPaidAsync once (BR-PAY-010, BR-PAY-012). | D; FIT |
| AC-PAY-002-01-03 | US-PAY-002-01 | **Given** the gateway authorises without capture, **when** the callback is received, **then** the transaction becomes Authorized and the platform calls MarkAsAuthorizedAsync; capture follows per gateway configuration. | FIT (PaymentStatus.Authorized) |
| AC-PAY-002-01-04 | US-PAY-002-01 | **Given** the gateway returns failure or the shopper cancels, **when** the result is received, **then** the transaction becomes Failed, the order PaymentStatus stays Pending and the shopper sees the retry page (see PAY-011 (REQ-MPC-FR-150)). | D |
| AC-PAY-002-01-05 | US-PAY-002-01 | **Given** the gateway supports 3-D Secure and tokenisation, **when** the shopper pays, **then** the adapter passes the 3-D Secure flow and only a gateway token, if any, is stored. | FC-M13-003 (3-D Secure); REQ-MPC-FR-129 (tokenisation) |
| AC-PAY-002-01-06 | US-PAY-002-01 | **Given** the adapter receives the gateway's transaction identifiers, **when** the payment completes, **then** it sets ProcessPaymentResult.AuthorizationTransactionId / CaptureTransactionId so native capture, refund and void work. | FIT |
| AC-PAY-002-02-01 | US-PAY-002-02 | **Given** a card payment is Successful, **when** finance staff refund all or part of it, **then** the refund is sent through the same gateway and recorded with the gateway reference (PAY-016). | D |
| AC-PAY-002-03-01 | US-PAY-002-03 | **Given** a new card adapter is built, **when** it is installed, **then** it registers through the connector SDK (PAY-024) and needs no change to checkout code. | D; REQ-MPC-PAY-001 |
| AC-PAY-002-01-07 | US-PAY-002-01 | **Given** a card adapter built on nopCommerce 5.00.1 processes a payment or a callback, **when** the order is saved, **then** no value is written to the obsolete Order card fields (AllowStoringCreditCardNumber, CardType, CardName, CardNumber, MaskedCreditCardNumber, CardCvv2, CardExpirationMonth, CardExpirationYear), which 5.00 keeps only for the upgrade and will remove in 5.10; ProcessPaymentRequest carries no card properties, so the adapter receives none from checkout (T-PAY-05). | VER-500; FIT (Order.cs:313-387 obsolete region; ProcessPaymentRequest.cs; ProcessPaymentResult has no AllowStoringCreditCardNumber) |

**Business rules applied:** BR-PAY-010; BR-PAY-011; BR-PAY-012 (§8.1).


### 7.3 PRD-PAY-003 PayPal

| Item | Value |
|---|---|
| Description (baseline) | Customers can pay with PayPal. |
| Why it matters | Convenient for international buyers. |
| Who benefits | International shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | On hold: K-08 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-003-01 | As an international shopper, I want to pay with PayPal, so that I can use an account I already have. | D; REQ-KTDA-PAY-003 | On hold: K-08 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-003-01-01 | US-PAY-003-01 | **Given** PayPal Commerce is configured with the client's merchant credentials, **when** the shopper selects PayPal, **then** the bundled PayPal Commerce flow runs and the order is marked paid through IOrderProcessingService on success. | REQ-KTDA-PAY-003; REQ-KTDA-PAY-007; FIT (bundled PayPal Commerce 5.00.7) |
| AC-PAY-003-01-02 | US-PAY-003-01 | **Given** a PayPal payment is Paid, **when** finance staff refund all or part, **then** the refund is processed through PayPal (full and partial supported). | FIT |

**Business rules applied:** BR-PAY-010 (§8.1).


### 7.4 PRD-PAY-004 Mobile money (framework)

| Item | Value |
|---|---|
| Description (baseline) | Customers pay from their mobile-money wallet: a payment request pops up on their phone, they confirm with their PIN, and the shop is told the result. Includes reversals, refunds and matching payments to orders. Each provider (M-Pesa, Mpamba, Airtel Money) connects as an adapter. Customers can also pay by scanning a QR code where the provider supports it. |
| Why it matters | Both clients require mobile money: KTDA names M-Pesa; Malawi Post names TNM Mpamba and Airtel Money. |
| Who benefits | Shoppers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024, PRD-INV-004 |
| Status | Ready; conditions: INV-HOLD |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-004-01 | As a shopper, I want a payment request to pop up on my phone that I confirm with my PIN, so that I can pay from my mobile-money wallet. | D; REQ-KTDA-PAY-004; REQ-MPC-FR-126; REQ-MPC-FR-127 | Ready; conditions: INV-HOLD |
| US-PAY-004-02 | As a shopper, I want to pay by scanning a QR code where my provider supports it, so that I can pay without typing my number. | D | Ready; conditions: INV-HOLD |
| US-PAY-004-03 | As a member of finance staff, I want reversals made by the provider to be recorded against the order, so that the books match the provider. | D; REQ-MPC-FR-244 | Ready; conditions: INV-HOLD |
| US-PAY-004-04 | As a member of finance staff, I want refunds to go back to the shopper's wallet where the provider supports it, so that the refund trail is clean. | REQ-MPC-FR-140 | Ready; conditions: INV-HOLD |
| US-PAY-004-05 | Technical enabler. As a member of the platform team, I want each provider to connect as an adapter on one mobile-money framework, so that adding a provider does not change the framework. | D; REQ-MPC-PAY-001 | Ready; conditions: INV-HOLD |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-004-01-01 | US-PAY-004-01 | **Given** mobile money is available for the cart, **when** the shopper enters a mobile number and confirms, **then** the order is placed (native stock decrement at placement), a payment request is sent through the provider adapter, and the transaction becomes Pending. | D; REQ-KTDA-PAY-004; FIT; depends on PRD-INV-004 (workbook) |
| AC-PAY-004-01-02 | US-PAY-004-01 | **Given** a payment is Pending, **when** the provider callback reports success, **then** the callback controller verifies it, matches the transaction by reference, checks the transaction is not already Successful, sets it Successful and calls MarkOrderAsPaidAsync exactly once (BR-PAY-012). | D; REQ-MPC-FR-126; REQ-MPC-FR-127 |
| AC-PAY-004-01-03 | US-PAY-004-01 | **Given** a payment is Pending, **when** no callback arrives within the configured wait time, **then** the status-query task asks the provider; if still unknown the transaction stays Pending and appears in the console exceptions list (see PAY-019 (REQ-MPC-FR-144)). | Proposed |
| AC-PAY-004-01-04 | US-PAY-004-01 | **Given** a payment is Pending, **when** the provider reports failure or the shopper rejects, **then** the transaction becomes Failed; within the payment window the shopper can retry (PAY-011); when the window expires and the configured action for mobile money is cancel, INV-004 (owner of the unpaid-order timeout) cancels the order through CancelOrderAsync, which returns the stock (BR-PAY-013). | D; FIT; INV-HOLD |
| AC-PAY-004-01-05 | US-PAY-004-01 | **Given** the configured action is cancel and INV-004 cancelled the order after the payment window, **when** a verified success callback arrives, **then** the transaction becomes SuccessfulAfterCancel: MarkOrderAsPaidAsync is not called, the order stays Cancelled, a console exception is raised, a provider-side refund is opened through PAY-016, and on completion the shopper receives message template Pay.RefundAfterCancel.CustomerNotification; audited (AUD-PAY-001). | Proposed |
| AC-PAY-004-02-01 | US-PAY-004-02 | **Given** the provider supports QR payments, **when** the shopper chooses QR, **then** a QR code with the payment reference is shown and the result is handled as in story 01. | D |
| AC-PAY-004-03-01 | US-PAY-004-03 | **Given** a payment is Successful, **when** the provider reports a reversal, **then** the transaction becomes Reversed and the order is refunded offline through RefundOfflineAsync (or PartiallyRefundOfflineAsync if a refund already exists); finance staff are notified and the event is audited (AUD-PAY-004). | REQ-MPC-FR-244 |
| AC-PAY-004-04-01 | US-PAY-004-04 | **Given** the provider supports refunds to wallet, **when** finance staff refund, **then** the refund is sent through the adapter, the PAY Refund record moves Initiated → Processing → Completed, and the native refund is recorded only on completion (BR-PAY-083). | REQ-MPC-FR-140 |
| AC-PAY-004-05-01 | US-PAY-004-05 | **Given** a new provider adapter implements the connector SDK operations, **when** it is installed and configured, **then** it appears as a mobile-money option without changes to the framework. | D; REQ-MPC-PAY-001 |

**Business rules applied:** BR-PAY-010; BR-PAY-012; BR-PAY-013; BR-PAY-083 (§8.1).


### 7.5 PRD-PAY-005 Bank transfer

| Item | Value |
|---|---|
| Description (baseline) | Customers pay by bank transfer using a unique reference, and incoming payments are matched to orders. |
| Why it matters | Suits large business payments. |
| Who benefits | Business buyers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-005-01 | As a business buyer, I want to pay by bank transfer using a unique reference, so that my payment is matched to my order. | D; REQ-KTDA-PAY-005; REQ-MPC-FR-128 | Ready |
| US-PAY-005-02 | As a member of finance staff, I want incoming bank payments to be matched to orders automatically, so that orders are released without manual searching. | D; FC-M13-004; REQ-KTDA-INT-002 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-005-01-01 | US-PAY-005-01 | **Given** bank transfer is available, **when** the order is placed, **then** a unique payment reference is generated (BR-PAY-020) and shown with the client's bank details on the confirmation page and email. | D; REQ-MPC-FR-128; REQ-KTDA-PAY-005 |
| AC-PAY-005-02-01 | US-PAY-005-02 | **Given** a bank statement line carries a valid reference and the exact amount, **when** the statement is imported or received through the bank API, **then** the transaction is matched, set Successful and the order marked paid through MarkOrderAsPaidAsync. | D; REQ-KTDA-INT-002 |
| AC-PAY-005-02-02 | US-PAY-005-02 | **Given** the amount differs or the reference is unknown, **when** the line is processed, **then** it is placed in the reconciliation exceptions list (PAY-014); the order is not marked paid (BR-PAY-021). | Proposed |
| AC-PAY-005-02-03 | US-PAY-005-02 | **Given** a bank system registered on the API with scope payments.notify (INT-001) posts a payment notification with a reference and an amount, **when** the notification reaches PAY, **then** it is matched under BR-PAY-021 exactly like a statement line; the API never marks an order paid itself; an unmatched notification becomes a reconciliation exception. | Proposed (boundary with INT-001) |
| AC-PAY-005-01-02 | US-PAY-005-01 | **Given** a bank-transfer order stays unpaid, **when** the INV-004 unpaid-order timeout for that payment method expires, **then** INV-004 applies its configured action (reminder, flag for follow-up or cancel); PAY takes no action of its own (BR-PAY-013). | Proposed |
| AC-PAY-005-01-03 | US-PAY-005-01 | **Given** a client has several bank accounts, **when** bank transfer is configured, **then** each account is set per store; the shopper sees the account of the store. | D; Proposed |
| AC-PAY-005-01-04 | US-PAY-005-01 | **Given** a bank-transfer order is waiting for funds and BR-PAY-170 is applied, **when** the native pending-order reminder delays (3 and 10 days by default) pass, **then** no native Reminders.PendingOrderFollowUp1 / 2 email is sent and the native automatic cancellation does not cancel the order; the reminder or cancellation, if any, is the INV-004 timeout action and the PAY-011 notification. | VER-500; FIT (ProcessPendingOrdersTask.cs:54-90; AutoCancelOrdersTask.cs:56-75); Proposed |

**Business rules applied:** BR-PAY-020; BR-PAY-021; BR-PAY-170 (§8.1).


### 7.6 PRD-PAY-006 Letters of credit

| Item | Value |
|---|---|
| Description (baseline) | Buyers pay using a letter of credit from their bank; the client checks the letter of credit before shipping. |
| Why it matters | A standard, secure way to pay for international trade. |
| Who benefits | International buyers; export staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (provider under OVR-REG) |
| Depends on | PRD-ORD-010 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-006-01 | As an international buyer, I want to pay with a letter of credit from my bank, so that I can use the standard instrument for international trade. | D; REQ-KTDA-PAY-006 | Ready; conditions: OVR-REG |
| US-PAY-006-02 | As a member of export staff, I want to verify the letter of credit before the goods are shipped, so that we ship only against a valid instrument. | D; REQ-KTDA-PAY-009 | Ready; conditions: OVR-REG |
| US-PAY-006-03 | As a client administrator, I want to offer letters of credit and escrow only to bulk buyers, so that the instrument matches the buyer type. | REQ-KTDA-PAY-008 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-006-01-01 | US-PAY-006-01 | **Given** letter of credit is available for the buyer (B2B), **when** the buyer places the order, **then** the order is created with PaymentStatus Pending and an LC record is opened with the LC fields (data model). | D; REQ-KTDA-PAY-006 |
| AC-PAY-006-02-01 | US-PAY-006-02 | **Given** an LC record exists, **when** finance staff record verification as Verified, **then** the shipment hold is released and the event audited (AUD-PAY-006). | D; REQ-KTDA-PAY-009 |
| AC-PAY-006-02-02 | US-PAY-006-02 | **Given** the LC is not Verified, **when** anyone submits shipment creation for the order, **then** the shipment is refused before it is saved by the PAY LC guard provider (IC-ORD-11) called from the single IShipmentService.InsertShipmentAsync override hosted by the core feature ORD-010; the host action filter on AddShipment shows message Pay.LcNotVerified (BR-PAY-030, BR-ORD-055). | REQ-KTDA-PAY-009; FIT; OVR-REG |
| AC-PAY-006-02-03 | US-PAY-006-02 | **Given** the LC is rejected or expires, **when** finance staff record it, **then** the buyer and export staff are notified; the order stays unpaid. | Proposed |
| AC-PAY-006-03-01 | US-PAY-006-03 | **Given** a buyer is not in a bulk-buyer customer role, **when** the buyer reaches payment, **then** letter of credit and escrow are not offered; the definition of a bulk buyer is Not stated in source (KG-08), so the role is configured per client. | REQ-KTDA-PAY-008 |

**Business rules applied:** BR-PAY-030 (§8.1).


### 7.7 PRD-PAY-007 Escrow and staged release

| Item | Value |
|---|---|
| Description (baseline) | The buyer's money is held safely and released to the seller in stages, for example on dispatch, on delivery or when the buyer accepts the goods. |
| Why it matters | Both sides are protected in large transactions. |
| Who benefits | Business buyers; sellers |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | On hold: PAY-DIRECT / LIC-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-007-01 | As a business buyer, I want my money to be held safely and released to the seller in stages, so that I am protected in large transactions. | D; REQ-KTDA-PAY-008 | On hold: PAY-DIRECT / LIC-01 |
| US-PAY-007-02 | As a member of finance staff, I want releases to be triggered by dispatch, delivery or acceptance events, so that releases follow the agreed conditions. | D; FC-M13-008 | On hold: PAY-DIRECT / LIC-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-007-01-01 | US-PAY-007-01 | **Given** escrow is configured with a bank or PSP escrow account and the buyer is a bulk buyer (PAY-006 story 03), **when** the buyer pays, **then** funds go into the escrow account (external); the order is marked Authorized (MarkAsAuthorizedAsync) and the escrow balance is recorded per order. | D; REQ-KTDA-PAY-008; FIT (external system) |
| AC-PAY-007-02-01 | US-PAY-007-02 | **Given** release stages are defined for the order, **when** native ShipmentSentEvent or ShipmentDeliveredEvent, or the ORD event OrderAcceptedEvent (IC-ORD-01: OrderId, AcceptedOnUtc, AcceptedBy, Deemed), occurs, **then** the event consumer only enqueues a release job; the scheduled release task sends the instruction for that stage and records the result; after the final stage the order is marked paid. | D; FC-M13-008; FIT |
| AC-PAY-007-02-02 | US-PAY-007-02 | **Given** the buyer raises a dispute before acceptance, **when** the dispute case is open (RET-007), **then** no further release is sent until the case is resolved: the release task calls HasOpenCase(orderId) (IC-RET-01) synchronously inside the ILocker key 'pay-order-{OrderId}' before each release and does not rely on a RET event consumer (BR-PAY-031). | Proposed; BR-RET-062 |
| AC-PAY-007-02-03 | US-PAY-007-02 | **Given** a release instruction fails, **when** the provider returns an error, **then** the stage stays unreleased, finance staff are alerted and can retry; every action is audited (AUD-PAY-007). | Proposed |
| AC-PAY-007-02-04 | US-PAY-007-02 | **Given** an ADM-002 workflow step of type payment release reaches an escrow stage of the order, **when** the step calls the PAY escrow release operation (IC-PAY-06) with the order, stage and case reference, **then** PAY applies BR-PAY-031 (stage order, no open dispute) under the same lock and returns Released, Refused with reason, or Failed; the workflow changes no payment or order state itself; order payment state changes only through IOrderProcessingService. | Proposed; see ADM-002 (AC-ADM-002-02-04) |
| AC-PAY-007-02-05 | US-PAY-007-02 | **Given** the buyer or finance staff raise a payment dispute on an escrow order, **when** PAY opens it, **then** the case is opened through RET OpenCase (IC-RET-01, type PaymentDispute, source module PAY and the escrow agreement reference); PAY keeps no case record of its own. | Proposed; BR-RET-062 |
| AC-PAY-007-02-06 | US-PAY-007-02 | **Given** the CAT event Listing.Withdrawn is raised for a product (BR-CAT-015), **when** the PAY consumer receives it, **then** the consumer only enqueues a job; the PAY task lists for finance staff the orders with an unreleased escrow stage that contain the product; no release, refund or order change is made automatically. | Proposed (automatic action on escrow: Not stated in source) |

**Business rules applied:** BR-PAY-031 (§8.1).


### 7.8 PRD-PAY-008 Cash on delivery and cash at outlet

| Item | Value |
|---|---|
| Description (baseline) | Customers pay in cash on delivery or at an outlet, using a secure reference; the client decides which sellers, items or areas allow it. Banker's cheques and payment slips paid to the client (local instruments to be confirmed per client) are also accepted and matched by staff. |
| Why it matters | Serves customers without cards or mobile money. |
| Who benefits | Shoppers; outlet staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-008-01 | As a shopper, I want to pay in cash on delivery, so that I can buy without a card or mobile money. | D; REQ-MPC-FR-132 | Ready |
| US-PAY-008-02 | As a shopper, I want to pay in cash at an outlet for an order I placed online, using a secure reference, so that I can pay where I live. | D; REQ-MPC-FR-131 | Ready |
| US-PAY-008-03 | As a client administrator, I want to decide which sellers, items and areas allow cash on delivery, so that we control risk. | D; REQ-MPC-FR-132 | Ready |
| US-PAY-008-04 | As a member of finance staff, I want banker's cheques and payment slips paid to the client to be matched to orders, so that offline instruments are reconciled. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-008-01-01 | US-PAY-008-01 | **Given** COD is allowed for every item, seller and the delivery area, **when** the shopper chooses COD, **then** the order is placed with PaymentStatus Pending and payment method COD. | D; REQ-MPC-FR-132 |
| AC-PAY-008-03-01 | US-PAY-008-03 | **Given** one item or its seller does not allow COD, or the area is excluded, **when** the shopper reaches payment, **then** COD is not listed (BR-PAY-022). | REQ-MPC-FR-132 |
| AC-PAY-008-02-01 | US-PAY-008-02 | **Given** cash at outlet is chosen, **when** the order is placed, **then** a secure payment reference (BR-PAY-020) is issued and shown to the shopper. | REQ-MPC-FR-131 |
| AC-PAY-008-02-02 | US-PAY-008-02 | **Given** a shopper presents the reference at an outlet, **when** outlet staff take the cash and confirm, **then** the transaction is Successful, MarkOrderAsPaidAsync is called, a receipt is printed (PAY-034) and the amount is added to the staff member's open shift. | REQ-MPC-FR-131 |
| AC-PAY-008-02-03 | US-PAY-008-02 | **Given** outlet cash payments exist, **when** reconciliation runs, **then** they reconcile against the closed shifts (PAY-014, PAY-034). | REQ-MPC-FR-131 |
| AC-PAY-008-01-02 | US-PAY-008-01 | **Given** the courier collects cash, **when** delivery is confirmed with the collected amount, **then** the transaction becomes Successful and the order is marked paid through MarkOrderAsPaidAsync (PAY); the collected amount is the one recorded on the LOG-012 proof of delivery (ProofOfDelivery.CollectedCodAmount) and courier remittance is reconciled in LOG-014 (CodRemittance); PAY keeps no courier remittance record. | Proposed; boundary with LOG-012, LOG-014 |
| AC-PAY-008-04-01 | US-PAY-008-04 | **Given** a cheque or payment slip is received, **when** finance staff record its reference and amount against an order, **then** the transaction is matched and audited (AUD-PAY-002). | D |

**Business rules applied:** BR-PAY-020; BR-PAY-022 (§8.1).


### 7.9 PRD-PAY-009 Wallet and store credit

| Item | Value |
|---|---|
| Description (baseline) | Customers hold a balance in the shop, top it up and spend from it. |
| Why it matters | Faster repeat payments, and refunds can go to the wallet. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: FG-06, PAY-DIRECT / LIC-01, WAL-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-009-01 | As a shopper, I want to hold a balance in the shop, top it up and spend from it, so that repeat payments are faster. | D; REQ-MPC-FR-130 | On hold: FG-06, PAY-DIRECT / LIC-01, WAL-01 |
| US-PAY-009-02 | As a shopper, I want to check my wallet balance, so that I know what I can spend. | REQ-MPC-FR-130 | On hold: FG-06, PAY-DIRECT / LIC-01, WAL-01 |
| US-PAY-009-03 | As a member of finance staff, I want refunds to be credited to the wallet when the shopper chooses, so that refunds are instant. | D (why) | On hold: FG-06, PAY-DIRECT / LIC-01, WAL-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-009-01-01 | US-PAY-009-01 | **Given** the wallet is enabled by the client, **when** the shopper tops up, **then** the top-up is paid through an active payment method and the balance increases only after the top-up payment is Successful. | REQ-MPC-FR-130 |
| AC-PAY-009-01-02 | US-PAY-009-01 | **Given** the balance covers the order and spend model (a) of WAL-01 applies, **when** the shopper pays by wallet, **then** the balance is debited once, the order is marked paid, and a wallet ledger entry records the debit. | D; WAL-01 |
| AC-PAY-009-01-03 | US-PAY-009-01 | **Given** the balance is lower than the order total, **when** the shopper selects wallet, **then** held by WAL-01: under (a) wallet is not offered and message Pay.WalletInsufficient is shown; under (b) the balance is applied as an order-total deduction supplied by a PAY provider to the CAT-042 IOrderTotalCalculationService override (PAY does not override the interface) and the rest is paid by another method. | Proposed; WAL-01; OVR-REG |
| AC-PAY-009-02-01 | US-PAY-009-02 | **Given** the wallet is enabled, **when** the shopper opens My account, **then** the balance and ledger entries are shown. | REQ-MPC-FR-130 |
| AC-PAY-009-03-01 | US-PAY-009-03 | **Given** a refund is approved and the shopper chose wallet, **when** the refund is processed, **then** the wallet is credited, the ledger records the order reference, and the native refund is recorded offline. | D |
| AC-PAY-009-01-04 | US-PAY-009-01 | **Given** spend model (b) of WAL-01 applies and the PAY provider to the CAT-042 host (IC-CAT-06) returned a wallet deduction for the cart, **when** the CHK-003 placement override places the order and the CAT-042 placement participant (IC-CHK-06, BR-CAT-033) calls the PAY-009 provider operations of IC-CAT-06, **then** Reserve checks and holds the balance under ILocker key 'pay-wallet-{WalletId}' (a shortfall refuses placement with message Pay.WalletInsufficient); Confirm writes one WalletLedgerEntry of type Spend with the saved OrderId and the deducted amount; Release drops the hold; the deduction calculation itself writes nothing (BR-PAY-040); PAY registers no IC-CHK-06 participant of its own for the wallet, so the balance is reserved once. | Proposed; WAL-01; OVR-REG; see CAT-042 (BR-CAT-033) |
| AC-PAY-009-01-05 | US-PAY-009-01 | **Given** an order carries a wallet deduction (spend model (b)), **when** DOC-001 renders its invoice or RPT totals the order, **then** they read the deduction as an order-total adjustment through the CAT-042 record (IC-CAT-06 GetOrderAdjustments; DOC token %Order.TotalAdjustments%); PAY registers no document token for it; the PAY operation GetWalletDeduction (IC-PAY-10) returns the Spend ledger entries of the order only for wallet reconciliation (PAY-019, RPT); native Order has no field for it. | Proposed; WAL-01; FIT (Order has no field for a provider deduction); see CAT-042 (BR-CAT-033) |

**Business rules applied:** BR-PAY-040 (§8.1).


### 7.10 PRD-PAY-010 Split payments

| Item | Value |
|---|---|
| Description (baseline) | Each customer payment is automatically split into the seller's share, the delivery fee and the client's commission. |
| Why it matters | Everyone gets their correct share without manual calculation. |
| Who benefits | Sellers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024 |
| Status | On hold: PAY-DIRECT / LIC-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-010-01 | As a member of finance staff, I want each customer payment to be split automatically into the seller's share, the delivery fee and the client's commission, so that everyone gets their correct share without manual calculation. | D; REQ-MPC-FR-133 | On hold: PAY-DIRECT / LIC-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-010-01-01 | US-PAY-010-01 | **Given** commission and fee rules (SEL-016) and delivery fees are configured, **when** an order line is paid, **then** split records are created per line: seller share, logistics fee, platform commission, each with the rule version applied; commission and fee amounts and rule version IDs are obtained from SEL through IC-SEL-02 GetRulesInForce for the order placement time (BR-PAY-050, BR-PAY-070). | D; REQ-MPC-FR-133; see PAY-021 (REQ-MPC-FR-303) |
| AC-PAY-010-01-02 | US-PAY-010-01 | **Given** the provider offers a split API, **when** the payment is processed, **then** the split is passed to the provider; otherwise the split is recorded for payout by SEL-017. | D; FIT |
| AC-PAY-010-01-03 | US-PAY-010-01 | **Given** a line is partly refunded, **when** the refund completes, **then** split amounts are reversed in proportion with the rounding rule (BR-PAY-051, BR-PAY-052). | see PAY-016 (REQ-MPC-FR-141) |
| AC-PAY-010-01-04 | US-PAY-010-01 | **Given** the order was paid by direct payment to the seller (PAY-035), **when** the payment is recorded, **then** no split is created; commission is invoiced (SEL-025). | D (PAY-035) |
| AC-PAY-010-01-05 | US-PAY-010-01 | **Given** SEL-017 builds a settlement batch (IC-SEL-02 GetEligibleSplits), **when** it includes a split, **then** the split's SettlementBatchId is set by SEL inside its settlement lock; a split that already has a SettlementBatchId is not returned again, so each split is in one batch only (BR-PAY-053). | Proposed; BR-SEL-012 |
| AC-PAY-010-01-06 | US-PAY-010-01 | **Given** IC-SEL-02 returns no rule for an order line, **when** the split is calculated, **then** no split is written for that line, a reconciliation exception is raised for finance staff (PAY-019 console) and the payment itself is not affected. | Proposed |

**Business rules applied:** BR-PAY-050; BR-PAY-051; BR-PAY-052; BR-PAY-053 (§8.1).


### 7.11 PRD-PAY-011 Payment status lifecycle

| Item | Value |
|---|---|
| Description (baseline) | Every payment has a clear status (started, pending, successful, failed, reversed) linked to its order; customers see the status and can try again. |
| Why it matters | Fewer 'did my payment go through?' calls. |
| Who benefits | Shoppers; support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, INV-HOLD, SPLIT-PAY |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-011-01 | As a shopper, I want to see the status of my payment and what to do next, so that I know whether my payment went through. | D; REQ-MPC-FR-150 | Ready; conditions: OVR-REG, INV-HOLD, SPLIT-PAY |
| US-PAY-011-02 | As a shopper, I want to retry a failed or pending payment, so that I can complete my order. | D; REQ-MPC-FR-150 | Ready; conditions: OVR-REG, INV-HOLD, SPLIT-PAY |
| US-PAY-011-03 | As a member of finance staff, I want every payment attempt to have a status linked to its order, so that I can trace what happened. | REQ-MPC-FR-134 | Ready; conditions: OVR-REG, INV-HOLD, SPLIT-PAY |
| US-PAY-011-04 | As a shopper, I want to pay once for a checkout that the shop splits into one order per seller, so that I am charged one amount and every seller's order is paid. | Proposed; OVR-REG (CHK-004 group payment) | Ready; conditions: OVR-REG, INV-HOLD, SPLIT-PAY |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-011-03-01 | US-PAY-011-03 | **Given** a payment attempt starts, **when** the adapter is called, **then** a PaymentTransaction is created with status Initiated, AttemptNo and the order reference. | REQ-MPC-FR-134 |
| AC-PAY-011-03-02 | US-PAY-011-03 | **Given** a transaction exists, **when** its status changes, **then** only the transitions in state model SM-PAY-01 are allowed; each change is timestamped and audited (AUD-PAY-001); the native order PaymentStatus changes only through IOrderProcessingService (BR-PAY-010). | REQ-MPC-FR-134; FIT |
| AC-PAY-011-01-01 | US-PAY-011-01 | **Given** a payment is Pending or Failed, **when** the shopper opens the order or the status page, **then** the page shows the status, the next step (message keys Pay.Status.Pending / Pay.Status.Failed), a retry button where allowed and the support contact. | REQ-MPC-FR-150 |
| AC-PAY-011-02-01 | US-PAY-011-02 | **Given** a payment Failed or is still Pending, the order PaymentStatus is Pending and AllowRePostingPayments is on, **when** the shopper retries, **then** a new PaymentTransaction (AttemptNo + 1) is created on the same order; Redirection-type adapters use the native RePostPayment path; Standard-type adapters (for example STK push) use the PAY retry action, because native re-post is limited to Redirection methods. | D; REQ-MPC-FR-150; FIT |
| AC-PAY-011-02-02 | US-PAY-011-02 | **Given** the order was cancelled after the payment window, **when** the shopper tries to retry, **then** retry is not offered and message Pay.RetryExpired is shown. | Proposed |
| AC-PAY-011-03-03 | US-PAY-011-03 | **Given** INV-004 is about to cancel an unpaid order, **when** it calls the PAY read service HasSuccessfulOrAuthorizedTransaction(orderId) (IC-PAY-07, consumed as IC-INV-02) inside the ILocker key 'pay-order-{OrderId}', **then** the service returns true if any PaymentTransaction of the order, including a group transaction linked to it (BR-PAY-014), is Successful or Authorized, otherwise false; it reads only and changes nothing. | Proposed; INV-HOLD |
| AC-PAY-011-04-01 | US-PAY-011-04 | **Given** CHK-004 places a checkout of several sellers under one CheckoutSession and the chosen method supports group payment, **when** the CHK-003 placement override processes payment once, before any sub-order is saved (BR-CHK-006), by calling the PAY group payment operation (IC-PAY-02, consumed as IC-CHK-04) with the CheckoutSession reference, the total and the share of each seller, **then** one PaymentTransaction is created for the checkout with the CheckoutSession reference as the merchant reference and one share per seller; the provider is asked for the checkout total once; one ProcessPaymentResult is returned for the checkout (BR-PAY-014). | Proposed; OVR-REG; FIT (OrderProcessingService.PlaceOrderAsync processes payment before SaveOrderDetailsAsync) |
| AC-PAY-011-04-02 | US-PAY-011-04 | **Given** a group transaction is Pending, **when** a verified success callback arrives, **then** under the lock 'pay-checkout-{CheckoutSessionId}' and then 'pay-order-{OrderId}' per sub-order, MarkOrderAsPaidAsync is called once for each linked sub-order (BR-PAY-012 applies per sub-order); the transaction becomes Successful; a sub-order linked later is handled at its Confirm (AC-PAY-011-04-07). | Proposed; OVR-REG |
| AC-PAY-011-04-03 | US-PAY-011-04 | **Given** a group transaction fails or the shopper cancels, **when** the result is received, **then** the transaction becomes Failed, every sub-order stays Pending and the retry (story 02) applies to the whole checkout: the new attempt is again one group transaction for the sub-orders still Pending. | Proposed; OVR-REG |
| AC-PAY-011-04-04 | US-PAY-011-04 | **Given** the group method is a Redirection-type adapter, **when** native checkout calls PostProcessPaymentAsync with the one order it received from placement, **then** the adapter finds the group transaction linked to that order and redirects for the checkout total with the CheckoutSession reference, not for that order alone. | Proposed; FIT (IPaymentMethod.PostProcessPaymentAsync takes one Order; CheckoutController calls it once) |
| AC-PAY-011-04-05 | US-PAY-011-04 | **Given** a verified success arrives for a group transaction and one sub-order was cancelled meanwhile, **when** the callback is processed, **then** the other sub-orders are marked paid; the share of the cancelled sub-order follows the SuccessfulAfterCancel path for that share (console exception, provider-side refund through PAY-016, AUD-PAY-001). | Proposed |
| AC-PAY-011-04-06 | US-PAY-011-04 | **Given** the chosen method or adapter does not declare group-payment support, **when** a checkout with more than one sub-order reaches payment, **then** the method is not offered for that checkout (BR-PAY-014); single-seller checkouts are not affected. | Proposed; OVR-REG |
| AC-PAY-011-04-07 | US-PAY-011-04 | **Given** a group transaction exists for the checkout, **when** the CHK-003 placement host saves a sub-order and calls the PAY placement participant Confirm (IC-CHK-06; PAY uses Confirm only), **then** under 'pay-checkout-{CheckoutSessionId}' PAY writes the PaymentTransactionOrder link for that sub-order with its seller share; if the group result was Paid, the sub-order was saved Paid by native placement and PAY calls nothing more; if the group transaction became Successful by callback before the link, PAY calls MarkOrderAsPaidAsync for that sub-order once (BR-PAY-012). | Proposed; OVR-REG; FIT (SaveOrderDetailsAsync takes the ProcessPaymentResult; ProcessOrderPaidAsync runs when it is Paid) |
| AC-PAY-011-04-08 | US-PAY-011-04 | **Given** payment succeeded and a seller share has no saved sub-order because placement stopped (CheckoutSession PlacementException, AC-CHK-004-01-05), **when** PAY-019 lists exceptions, **then** the group transaction is shown with the unlinked share and the CheckoutSession reference as a console exception; PAY makes no refund on its own; a refund of that share arrives only from RET (source type PlacementFailure) through IC-PAY-05 (AC-PAY-016-01-08). | Proposed; see CHK-004 (placement exception) |
| AC-PAY-011-01-02 | US-PAY-011-01 | **Given** a configuration pack is applied to a store, **when** the pack loader runs, **then** ReminderSettings.PendingOrdersEnabled (install default on) and OrderSettings.AutoCancelEnabled (install default off) are set off unless the client pack states otherwise under BR-PAY-170, so no native reminder email goes to an order that is pending by design (on account, letter of credit, escrow, bank transfer awaiting funds) and payment-pending messages come only from the PAY notification Pay.Status.Pending through TRK-005. | VER-500; FIT (InstallRequiredData.cs:2207, 1164-1180, 1895-1899); Proposed |

**Business rules applied:** BR-PAY-010; BR-PAY-014; BR-PAY-170 (§8.1).


### 7.12 PRD-PAY-012 Payment idempotency

| Item | Value |
|---|---|
| Description (baseline) | Ensures that if a customer or the network retries a payment, they are only charged once. |
| Why it matters | Prevents double charges. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-012-01 | As a shopper, I want to be charged only once even if I or the network retry, so that I am never charged twice. | D; REQ-MPC-FR-135 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-012-01-01 | US-PAY-012-01 | **Given** a payment initiation request carries an idempotency key (default Order.OrderGuid + AttemptNo), **when** the same request is received again, **then** no second charge is initiated; the original result is returned. | REQ-MPC-FR-135 |
| AC-PAY-012-01-02 | US-PAY-012-01 | **Given** a provider sends the same callback twice, **when** the second callback arrives, **then** it is recognised by provider reference and transaction status and ignored after logging; MarkOrderAsPaidAsync is not called again, even if the order is PartiallyRefunded (BR-PAY-012). | REQ-MPC-FR-135; FIT |
| AC-PAY-012-01-03 | US-PAY-012-01 | **Given** the order is placed twice in quick succession on one host, **when** the second placement is attempted, **then** the native placement lock and minimum interval prevent a duplicate order; across several web nodes the PLT-027 idempotency key (P2) is required because the lock is per host; until PLT-027 is delivered an instance serves checkout from one web node (BR-PLT-004). | FIT |
| AC-PAY-012-01-04 | US-PAY-012-01 | **Given** checkout is retried within PaymentSettings.RegenerateOrderGuidInterval, **when** the order is placed, **then** the same OrderGuid is reused and passed to the provider as the merchant reference. | FIT |

**Business rules applied:** BR-PAY-012 (§8.1).


### 7.13 PRD-PAY-013 Payment receipts

| Item | Value |
|---|---|
| Description (baseline) | Payment receipts are sent by email and SMS. |
| Why it matters | Customers have proof of payment. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CHN-005 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-013-01 | As a shopper, I want to receive a payment receipt by email and SMS, so that I have proof of payment. | D; REQ-MPC-FR-136 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-013-01-01 | US-PAY-013-01 | **Given** a payment becomes Successful and MarkOrderAsPaidAsync has run, **when** the native OrderPaidEvent is raised, **then** the receipt is sent on the channels configured for the event in TRK-005 and allowed by the customer's preferences (TRK-006), default the native OrderPaid email (PDF invoice attachable) plus one SMS delivered by TRK-005 over the CHN-005 gateway in the shopper's language; PAY sends no SMS of its own and no second email is sent. | D; FIT; REQ-MPC-FR-136; TRK-005; TRK-006 |
| AC-PAY-013-01-02 | US-PAY-013-01 | **Given** the shopper has no mobile number, **when** the receipt is sent, **then** only email is sent and the skip is logged. | Proposed |
| AC-PAY-013-01-03 | US-PAY-013-01 | **Given** SMS delivery fails, **when** the gateway reports failure, **then** the failure is logged; email is unaffected. | Proposed |
| AC-PAY-013-01-04 | US-PAY-013-01 | **Given** the PAY plugin is installed, **when** installation runs, **then** PAY registers each PAY event code of §13 (BR-PAY-160) through IC-TRK-04 RegisterEventCode with its default channels and the default text of the message key of the same name; a PAY send with a code that is not registered is refused by TRK and logged. | Proposed; see TRK-005 (BR-TRK-023) |

**Business rules applied:** BR-PAY-160 (§8.1).


### 7.14 PRD-PAY-014 Payment reconciliation

| Item | Value |
|---|---|
| Description (baseline) | Automatically matches the shop's payments against statements from payment providers and produces a daily file for finance. |
| Why it matters | Finance can trust the numbers and find gaps quickly. |
| Who benefits | Finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-014-01 | As a member of finance staff, I want provider statements to be matched automatically against the shop's payments, so that I can trust the numbers and find gaps quickly. | D; REQ-MPC-FR-137 | Ready |
| US-PAY-014-02 | As a member of finance staff, I want a daily file for the finance system, so that we can upload it when there is no direct integration. | D; REQ-MPC-FR-149 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-014-01-01 | US-PAY-014-01 | **Given** a provider statement is retrieved through the adapter (GetStatement) or uploaded, **when** reconciliation runs, **then** each line is classed Matched, Unmatched — platform only, Unmatched — provider only, or Timing difference (BR-PAY-060). | D; FC-M13-017; REQ-MPC-FR-137 |
| AC-PAY-014-01-02 | US-PAY-014-01 | **Given** exceptions exist, **when** finance staff open the reconciliation screen, **then** they can filter and resolve each exception with a mandatory note; every resolution is audited (AUD-PAY-005). | REQ-MPC-FR-137 |
| AC-PAY-014-02-01 | US-PAY-014-02 | **Given** the day closes, **when** the scheduled task runs, **then** a daily reconciliation file is generated in the configured format and kept for download. | REQ-MPC-FR-149 |
| AC-PAY-014-01-03 | US-PAY-014-01 | **Given** a provider has no statement API, **when** finance staff upload the provider file, **then** the same matching runs. | Proposed |
| AC-PAY-014-01-04 | US-PAY-014-01 | **Given** a seller settlement batch exists (SEL-017), **when** reconciliation runs, **then** provider-settled amounts are compared with the batch totals per seller; differences are listed as exceptions. | REQ-MPC-FR-137 |

**Business rules applied:** BR-PAY-060 (§8.1).


### 7.15 PRD-PAY-015 Payment fees

| Item | Value |
|---|---|
| Description (baseline) | Add a fee for particular payment methods and keep versioned schedules of provider and platform fees. |
| Why it matters | Covers payment costs transparently. |
| Who benefits | Finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, FEE-CTRL |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-015-01 | As a member of finance staff, I want to add a fee for particular payment methods, so that payment costs are covered transparently. | D; REQ-MPC-FR-139 | Ready; conditions: OVR-REG, FEE-CTRL |
| US-PAY-015-02 | As a member of finance staff, I want to keep versioned schedules of provider and platform fees with effective dates, so that past orders keep the fee that applied when they were placed. | D; REQ-MPC-FR-139 | Ready; conditions: OVR-REG, FEE-CTRL |
| US-PAY-015-03 | As a member of finance staff, I want the COD fee to vary by service level and location, so that fees match our price tables. | REQ-MPC-FR-304 | Ready; conditions: OVR-REG, FEE-CTRL |
| US-PAY-015-04 | As a member of finance staff, I want the fee charged on each order line to be stored with the fee-schedule version, so that the refund calculation can adjust it correctly. | see PAY-016 (REQ-MPC-FR-141) | Ready; conditions: OVR-REG, FEE-CTRL |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-015-01-01 | US-PAY-015-01 | **Given** a fixed or percentage fee is set for a method, **when** the shopper selects it, **then** the fee is shown before payment and added to the order total; its taxability follows TaxSettings.PaymentMethodAdditionalFeeIsTaxable. | FIT; REQ-MPC-FR-139 |
| AC-PAY-015-02-01 | US-PAY-015-02 | **Given** a new fee schedule version is saved with a future effective date, **when** an order is placed before that date, **then** the previous version applies; the order records the version used (BR-PAY-070). | REQ-MPC-FR-139 |
| AC-PAY-015-03-01 | US-PAY-015-03 | **Given** a COD fee table by location type exists, **when** COD is chosen for a rural address (location type read from the LOG-004 coverage area, ServiceArea.LocationType), **then** the rural COD fee applies. | REQ-MPC-FR-304 |
| AC-PAY-015-03-02 | US-PAY-015-03 | **Given** a COD fee table by service level exists (for example express and standard), **when** COD is chosen with express delivery, **then** the express COD fee applies. | REQ-MPC-FR-304 |
| AC-PAY-015-04-01 | US-PAY-015-04 | **Given** a payment-method fee is charged on an order, **when** the order is placed, **then** the fee amount per order line and the fee-schedule version applied are stored, so the PAY-016 refund calculation can reduce it in proportion on a partial refund (one owner of the proportional adjustment: PAY-016, AC-PAY-016-04-01, BR-PAY-051). | see PAY-016 (REQ-MPC-FR-141); Proposed |
| AC-PAY-015-02-02 | US-PAY-015-02 | **Given** a schedule is changed, **when** it is saved, **then** who, when, old and new values are audited (AUD-PAY-003). | Proposed |

**Business rules applied:** BR-PAY-070; BR-PAY-051; BR-PAY-052 (§8.1).


### 7.16 PRD-PAY-016 Refunds

| Item | Value |
|---|---|
| Description (baseline) | Full or partial refunds back to the original payment method, with status tracking; large refunds need approval. When part of an order is refunded, related fees are adjusted in proportion, and customers are shown the expected refund time for each payment method. |
| Why it matters | Customers get their money back properly and fraud is controlled. |
| Who benefits | Shoppers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-016-01 | As a member of finance staff, I want to refund all or part of an order back to the original payment method, so that customers get their money back properly. | D; REQ-MPC-FR-140 | Ready |
| US-PAY-016-02 | As a shopper, I want to see the status of my refund and how long it should take for my payment method, so that I know when to expect my money. | D; REQ-MPC-FR-243 | Ready |
| US-PAY-016-03 | As a member of finance staff, I want refunds above a threshold to need approval by a second person, so that fraud is controlled. | D; REQ-MPC-FR-245 | Ready |
| US-PAY-016-04 | As a member of finance staff, I want fees to be adjusted in proportion on partial refunds at item level, so that amounts stay correct. | D; REQ-MPC-FR-141 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-016-01-01 | US-PAY-016-01 | **Given** the original method supports refunds, **when** a refund is approved, **then** a PAY Refund record is created (Initiated → Processing); for asynchronous providers the native order refund is recorded only on completion through RefundOfflineAsync / PartiallyRefundOfflineAsync; synchronous providers may use the native online RefundAsync (BR-PAY-083). | D; REQ-MPC-FR-140; FIT |
| AC-PAY-016-01-02 | US-PAY-016-01 | **Given** the original method does not support refunds, **when** a refund is approved, **then** the refund is recorded offline (or to wallet if chosen) and finance staff record the reference. | FIT; Proposed |
| AC-PAY-016-04-01 | US-PAY-016-04 | **Given** an order line is partly refunded, **when** the refund is calculated, **then** RefundLine records hold the line amounts; fees, commission and split amounts are adjusted in proportion (BR-PAY-051, BR-PAY-052); the total cannot exceed OrderTotal − RefundedAmount nor, per line, the line amount paid minus earlier line refunds (BR-PAY-081). | REQ-MPC-FR-141; FIT |
| AC-PAY-016-03-01 | US-PAY-016-03 | **Given** the refund amount exceeds the configured threshold, **when** it is submitted, **then** it waits for approval; the requester cannot approve it (BR-PAY-080). | REQ-MPC-FR-245 |
| AC-PAY-016-03-02 | US-PAY-016-03 | **Given** a user with only Orders.OrdersCreateEditDelete presses a native refund button, **when** the request is posted, **then** it is intercepted and routed to the PAY refund flow with threshold and approval (BR-PAY-082). | REQ-MPC-FR-245; FIT |
| AC-PAY-016-02-01 | US-PAY-016-02 | **Given** a refund exists, **when** the shopper opens the order, **then** the refund status and the expected completion time for that payment method are shown. | REQ-MPC-FR-243 |
| AC-PAY-016-01-03 | US-PAY-016-01 | **Given** a refund completes and the native refund is recorded, **when** OrderRefundedEvent is raised, **then** the native OrderRefunded customer notification is sent once. | FIT |
| AC-PAY-016-01-04 | US-PAY-016-01 | **Given** RET-005 requests a refund through the PAY refund request operation (IC-PAY-05, consumed as IC-RET-02) with order ID, lines (OrderItem ID, quantity, amount), reason, source type and source ID, and an idempotency key, **when** the request is received, **then** PAY applies BR-PAY-081 and BR-PAY-080 under the lock 'pay-order-{OrderId}', creates a Refund record (Initiated, or waiting for approval above the threshold) with the source reference, and returns the Refund ID and state; a second request with the same idempotency key returns the first Refund and creates nothing (BR-PAY-084). | Proposed; BR-RET-041 |
| AC-PAY-016-01-05 | US-PAY-016-01 | **Given** a Refund created from a RET request reaches Completed or Failed, **when** the state changes, **then** PAY raises the module event Refund.Completed or Refund.Failed carrying the RET source type and source ID; the RET consumer only enqueues its status sync; PAY never changes a return request. | Proposed |
| AC-PAY-016-01-06 | US-PAY-016-01 | **Given** a module other than RET (for example ORD-004 or ORD-006) needs an automatic refund, **when** it starts one, **then** it raises a refund trigger through RET (IC-RET-04); the PAY refund request operation accepts calls only from RET-005 and from PAY itself (finance staff refunds, SuccessfulAfterCancel); a call from another caller is refused and logged (BR-PAY-084). | Proposed (product refund-trigger decision: RET-005 single owner) |
| AC-PAY-016-01-07 | US-PAY-016-01 | **Given** RET requests a refund through IC-PAY-05 with order-level parts (component Shipping, PaymentFee or CheckoutAttribute and an amount), with or without order lines, **when** the request is received, **then** under 'pay-order-{OrderId}' PAY checks that the lines and the parts together do not exceed Order.OrderTotal minus Order.RefundedAmount (BR-PAY-081), stores each part as a RefundLine with its component and no OrderItemId, and on completion records the whole amount on the order through the native partial or full refund method; fees, commission and splits are adjusted only for the line amounts (BR-PAY-085). | Proposed (RET IC-RET-04 order-level parts); FIT (OrderProcessingService.PartiallyRefundOfflineAsync / PartiallyRefundAsync take an order amount and check OrderTotal minus RefundedAmount) |
| AC-PAY-016-01-08 | US-PAY-016-01 | **Given** RET requests a refund through IC-PAY-05 with source type PlacementFailure, no order ID, the CheckoutSession reference, the group PaymentTransaction ID and an amount, **when** the request is received, **then** under 'pay-checkout-{CheckoutSessionId}' PAY checks that the amount does not exceed the share of the group transaction that is linked to no sub-order minus earlier refunds of that share, creates a Refund with no OrderId, refunds provider-side only and on completion records it on the Refund record and the group transaction; no native order refund method is called, because no order exists (BR-PAY-085). | Proposed (RET PlacementFailure); see CHK-004 (placement exception) |

**Business rules applied:** BR-PAY-051; BR-PAY-052; BR-PAY-080; BR-PAY-081; BR-PAY-082; BR-PAY-083; BR-PAY-084; BR-PAY-085 (§8.1).


### 7.17 PRD-PAY-017 Chargebacks

| Item | Value |
|---|---|
| Description (baseline) | Tracks card payments that customers dispute with their bank (chargebacks). |
| Why it matters | Clients can respond in time and reduce losses. |
| Who benefits | Finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-017-01 | As a member of finance staff, I want to track card payments that customers dispute with their bank, so that we respond in time and reduce losses. | D; REQ-MPC-FR-142 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-017-01-01 | US-PAY-017-01 | **Given** a gateway reports a chargeback, or staff record one, **when** it is created, **then** a chargeback case is linked to the payment and order with reason, amount, deadline and status Open (SM-PAY-05). | D; REQ-MPC-FR-142 |
| AC-PAY-017-01-02 | US-PAY-017-01 | **Given** a case is open, **when** the response deadline is within the configured lead time, **then** assigned finance staff are notified. | Proposed |
| AC-PAY-017-01-03 | US-PAY-017-01 | **Given** a case is lost, **when** the outcome is recorded, **then** the transaction becomes Reversed and the order is refunded offline in full or in part by the chargeback amount (RefundOfflineAsync / PartiallyRefundOfflineAsync); audited (AUD-PAY-004). | Proposed; FIT |
| AC-PAY-017-01-04 | US-PAY-017-01 | **Given** a case is won, **when** the outcome is recorded, **then** no payment status changes; the case is closed and audited (AUD-PAY-004). | Proposed |

**Business rules applied:** BR-PAY-010 (§8.1).


### 7.18 PRD-PAY-018 Payment and order risk controls

| Item | Value |
|---|---|
| Description (baseline) | Configurable checks that flag suspicious behaviour, such as many payments in a short time, many accounts on one device or other warning signs. |
| Why it matters | Reduces fraud losses. |
| Who benefits | Fraud staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-018-01 | As a member of fraud staff, I want to configure rules that flag suspicious behaviour such as many payments in a short time or many accounts on one device, so that fraud losses fall. | D; REQ-MPC-FR-143 | Ready; conditions: OVR-REG |
| US-PAY-018-02 | As a member of fraud staff, I want to enable or disable rules and change thresholds with an audit trail, so that changes are controlled. | REQ-MPC-FR-320 | Ready; conditions: OVR-REG; on hold: AC-PAY-018-02-02 (WF-ENG) |
| US-PAY-018-03 | As a client administrator, I want checkout to be blocked for users with account restrictions, so that suspected fraudsters cannot buy. | REQ-MPC-FR-118 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-018-01-01 | US-PAY-018-01 | **Given** a velocity rule "more than N payment attempts per M minutes" is active, **when** a customer exceeds it, **then** the attempt is flagged (and blocked if the rule action is Block) and appears in the review queue. | REQ-MPC-FR-143; FC-M03-042 |
| AC-PAY-018-01-02 | US-PAY-018-01 | **Given** a device rule is active, **when** more accounts than allowed use the same device identifier, **then** the accounts are flagged. | D; FC-M03-040 |
| AC-PAY-018-02-01 | US-PAY-018-02 | **Given** a rule is created, changed, enabled or disabled, **when** it is saved, **then** who, when, old and new values are audited (AUD-PAY-003). | REQ-MPC-FR-320 |
| AC-PAY-018-03-01 | US-PAY-018-03 | **Given** a customer has an active restriction, **when** they reach checkout, **then** checkout is blocked with message Pay.CheckoutRestricted, which does not state the reason. | REQ-MPC-FR-118 |
| AC-PAY-018-03-02 | US-PAY-018-03 | **Given** a SEL-013 list entry of type Block with scope checkout or all is Active for the customer, their email, phone, IP address or device, **when** they reach checkout, **then** the entry is an account restriction that PAY-018 enforces exactly as in AC-PAY-018-03-01 (message Pay.CheckoutRestricted); PAY keeps no copy of the list. | REQ-MPC-FR-118; see SEL-013 (lists) |
| AC-PAY-018-01-03 | US-PAY-018-01 | **Given** the shopper confirms the order, **when** the CHK-003 placement override calls the PAY risk evaluation as a placement validator (IC-PAY-03, consumed as IC-CHK-02) before payment, **then** each active rule is evaluated; a rule with action Block stops placement with message Pay.CheckoutRestricted and no order is placed; a rule with action Flag lets placement continue and writes a RiskFlag after the order exists. | Proposed; OVR-REG |
| AC-PAY-018-01-04 | US-PAY-018-01 | **Given** a rule with action Flag and the option "hold order" matches at placement, **when** the order is placed, **then** PAY asks ORD-010 to create a hold with reason "risk rule {name}"; the hold blocks shipment through the ORD-010 guard provider (IC-ORD-11). | Proposed; see ORD-010 (automatic hold) |
| AC-PAY-018-01-05 | US-PAY-018-01 | **Given** a rule of type "model score above threshold" is active and the AI-006 fraud-scoring service returns a score for the transaction, **when** the score is above the rule threshold, **then** a RiskFlag is written for the review queue showing the score, the model version and the reasons returned; the payment is blocked only if that rule's action is Block. | Proposed; see AI-006 (fraud score) |
| AC-PAY-018-01-06 | US-PAY-018-01 | **Given** any rule fires, **when** the flag or block is recorded, **then** PAY writes the RiskFlag and raises the module event Risk.Flagged with the subject type (customer or transaction), the subject ID and the rule that fired; the CRM-010 consumer only enqueues, and its task creates a referral unless one is open for the same subject (AC-CRM-010-01-02); SEC-005 exports RiskFlag records with its own scheduled task (AC-SEC-005-01-01), not as an event consumer. | Proposed; see CRM-010 (referrals) |
| AC-PAY-018-02-02 | US-PAY-018-02 | **Given** risk rules are registered as a controlled configuration type with PLT-004 (IC-PLT-03), **when** a rule is created, changed, enabled or disabled, **then** when PLT-004 is delivered (it is held by WF-ENG) the change follows the PLT-004 approval and rollback flow before it takes effect; until then the change takes effect when saved by a user holding the PAY risk-rule permission, the previous rule version is kept so it can be restored, and the audit trail records old and new values (AUD-PAY-003). | REQ-MPC-FR-320; Proposed (IC-PLT-03) |
| AC-PAY-018-01-07 | US-PAY-018-01 | **Given** a model-score rule is active and the AI-006 scoring service does not answer in time, **when** a payment is initiated, **then** the model-score rule does not fire, every other active rule is evaluated as usual, the payment continues and the missing score is logged (as AC-AI-006-01-02); the score threshold is held only on the PAY-018 rule. | Proposed; see AI-006 (fraud score) |

**Business rules applied:** BR-PAY-090 (§8.1).


### 7.19 PRD-PAY-019 Payments operations console

| Item | Value |
|---|---|
| Description (baseline) | A screen for finance staff to see payment logs and problem payments and to step in manually, with every action recorded. |
| Why it matters | Payment problems are fixed quickly and transparently. |
| Who benefits | Finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: PAYEX-ADM |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-019-01 | As a member of finance staff, I want one screen to see payment logs and problem payments and to step in manually, so that problems are fixed quickly and transparently. | D; REQ-MPC-FR-144 | Ready; conditions: PAYEX-ADM |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-019-01-01 | US-PAY-019-01 | **Given** the user has Payments.Core.Transactions.View, **when** they open the console, **then** they see transactions with filters (date, method, status, order, provider reference) and an exceptions view (Pending beyond the wait time, callback errors, unmatched). | REQ-MPC-FR-144 |
| AC-PAY-019-01-02 | US-PAY-019-01 | **Given** the user has Payments.Core.Transactions.CreateEditDelete, **when** they take a manual action (re-query status, mark paid with evidence, capture, void, cancel attempt), **then** a reason is mandatory, the action calls IOrderProcessingService and is written to the audit trail (AUD-PAY-002). | REQ-MPC-FR-144 |
| AC-PAY-019-01-03 | US-PAY-019-01 | **Given** the user lacks the permission, **when** they open the console or post an action, **then** access is denied (standard permission criterion). | Proposed |

**Business rules applied:** BR-PAY-082; BR-PAY-100 (§8.1).


### 7.20 PRD-PAY-020 Tax calculation

| Item | Value |
|---|---|
| Description (baseline) | Calculates tax using tax categories and rates per country or region, and shows prices including or excluding tax as configured. |
| Why it matters | Correct tax on every sale. |
| Who benefits | Finance staff; shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-020-01 | As a member of finance staff, I want tax to be calculated using tax categories and rates per country or region, so that every sale has the correct tax. | D; REQ-KTDA-TAX-001 | Ready |
| US-PAY-020-02 | As a shopper, I want to see taxes and fees in the order summary before I pay, so that I know the total. | REQ-MPC-FR-107 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-020-01-01 | US-PAY-020-01 | **Given** tax categories and rates are configured (native provider), **when** an order is calculated, **then** tax is computed per line and shown including or excluding tax per the store setting. | FIT (Out of the box); REQ-KTDA-TAX-001 |
| AC-PAY-020-02-01 | US-PAY-020-02 | **Given** the shopper reaches the confirm step, **when** the summary is shown, **then** items, quantities, taxes, payment fees and delivery fees are listed before payment; the returns-policy acknowledgement is CHK's. | REQ-MPC-FR-107 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.21 PRD-PAY-021 Tax on fees and tax reporting

| Item | Value |
|---|---|
| Description (baseline) | Calculates tax on the client's own commissions and fees, and produces tax reports and files for tax filing. |
| Why it matters | Supports the client's tax returns. |
| Who benefits | Finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-021-01 | As a member of finance staff, I want tax on the client's own commissions and fees, so that fees are taxed correctly. | D; REQ-MPC-FR-147 | Ready |
| US-PAY-021-02 | As a member of finance staff, I want tax reports and filing files, so that we can file returns. | D; REQ-MPC-FR-147; REQ-MPC-FR-315 | Ready |
| US-PAY-021-03 | As a client administrator, I want to change commission, fee and tax rules with effective dates without code, so that rules change on time. | REQ-MPC-FR-303 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-021-01-01 | US-PAY-021-01 | **Given** a tax rule applies to platform commission, **when** a split is calculated (PAY-010), **then** tax on the commission is calculated and stored with the split. | REQ-MPC-FR-147 |
| AC-PAY-021-02-01 | US-PAY-021-02 | **Given** a period is selected, **when** the tax report runs, **then** totals by tax category, rate and transaction type are produced and exportable. | REQ-MPC-FR-147; REQ-MPC-FR-315 |
| AC-PAY-021-03-01 | US-PAY-021-03 | **Given** a rule has a future effective date, **when** transactions occur before it, **then** the old rule applies; the change is audited (AUD-PAY-003). | REQ-MPC-FR-303 |

**Business rules applied:** BR-PAY-070 (§8.1).


### 7.22 PRD-PAY-022 Bulk disbursements

| Item | Value |
|---|---|
| Description (baseline) | Pays many recipients at once (for example farmers or beneficiaries) after approval, then matches the payments. Each payment's status (succeeded, failed, reversed) is shown with a reason, and failed payments are retried automatically. |
| Why it matters | Large payout runs become efficient and controlled. |
| Who benefits | Finance staff; programme staff |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-022-01 | As a member of finance staff, I want to pay many recipients at once after approval, so that payout runs are efficient and controlled. | D; FC-M13-012 | Ready |
| US-PAY-022-02 | As a member of finance staff, I want each payment's status with a reason, and failed payments retried automatically, so that every recipient is paid. | D; FC-M13-013 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-022-01-01 | US-PAY-022-01 | **Given** a batch file of recipients is uploaded, **when** it is validated, **then** invalid rows are reported; the batch cannot be approved until fixed. | FC-M13-012 |
| AC-PAY-022-01-02 | US-PAY-022-01 | **Given** a valid batch exists, **when** a second authorised person approves it, **then** payouts are sent through the Payout operation of the connector SDK (BR-PAY-080). | D |
| AC-PAY-022-02-01 | US-PAY-022-02 | **Given** a payout fails with a transient error, **when** the retry policy applies, **then** it is retried up to the configured number; final status and reason are recorded (SM-PAY-08). | D; FC-M13-013 |
| AC-PAY-022-01-03 | US-PAY-022-01 | **Given** the recipient's bank offers account verification (INT-008, IC-INT-04 VerifyAccount), **when** a batch is validated, **then** each bank account and holder name is checked; a Mismatch is reported as an invalid row; NotSupported leaves the row valid and records that it was not verified. | Proposed; see INT-008 (account verification) |

**Business rules applied:** BR-PAY-080 (§8.1).


### 7.23 PRD-PAY-023 Multi-currency settlement

| Item | Value |
|---|---|
| Description (baseline) | The customer pays in their own currency while the client receives money in its base currency, with the exchange rate shown to the customer. |
| Why it matters | Clear, fair cross-currency payments. |
| Who benefits | International buyers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: C-FX |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-023-01 | As an international buyer, I want to pay in my own currency with the exchange rate shown, so that cross-currency payments are clear. | D; REQ-KTDA-LOC-002 | On hold: C-FX |
| US-PAY-023-02 | As a member of finance staff, I want to receive money in the base currency, so that our books are in one currency. | D; REQ-KTDA-LOC-002 | On hold: C-FX |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-023-01-01 | US-PAY-023-01 | **Given** several currencies are active and rates are maintained (native rate provider), **when** the shopper selects a currency, **then** prices and totals are shown in it; the order stores the customer currency and rate. | FIT; REQ-KTDA-LOC-002 |
| AC-PAY-023-01-02 | US-PAY-023-01 | **Given** the gateway supports multi-currency charging, **when** the shopper pays, **then** the charge is in the customer currency and the rate and any conversion fee are disclosed before payment. | D |
| AC-PAY-023-02-01 | US-PAY-023-02 | **Given** the gateway settles only in base currency, **when** the shopper pays, **then** the charge is made in base currency (USD for KTDA, C-FX) and the converted amount is shown before payment. | Proposed; REQ-KTDA-LOC-002 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.24 PRD-PAY-024 Payment connector SDK

| Item | Value |
|---|---|
| Description (baseline) | A standard technical 'plug' that every payment provider connects to: start a payment, receive the result, check status, reverse, refund, get the reconciliation file and pay out. |
| Why it matters | A new payment provider is added by building one adapter, not by changing the shop. |
| Who benefits | Platform team |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-024-01 | Technical enabler. As a member of the platform team, I want one standard connector contract every payment provider implements, so that a new provider is added by building one adapter. | D; REQ-MPC-FR-330; REQ-KTDA-PAY-007; REQ-MPC-PAY-001 | Ready; conditions: CFG-01 |
| US-PAY-024-02 | As a client administrator, I want to enter provider credentials per client instance, so that secrets are never in configuration packs. | CFG-01 | Ready; conditions: CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-024-01-01 | US-PAY-024-01 | **Given** an adapter implements the connector SDK, **when** it is installed, **then** it declares its PaymentMethodType and a capability flag for each of InitiatePayment, HandleCallback, QueryStatus, Reverse, Refund, GetStatement and Payout (contract IC-PAY-01); payment adapters implement IPaymentMethod and appear at checkout; payout-only adapters do not implement IPaymentMethod and appear only in the PAY payout registry. | D; REQ-MPC-PAY-001; Inference from REQ-KTDA-PAY-007 (a further global gateway is integrated as one more SDK adapter); FIT |
| AC-PAY-024-01-02 | US-PAY-024-01 | **Given** an adapter does not support an operation, **when** that operation is requested, **then** the framework returns NotSupported and the console offers the manual path. | Proposed |
| AC-PAY-024-01-03 | US-PAY-024-01 | **Given** a provider callback arrives on the adapter's callback route, **when** the SDK receives it, **then** the signature, token or IP allow-list is verified before any status change; failures are logged and audited (AUD-PAY-010; NFR-PAY-002). | REQ-MPC-FR-330 |
| AC-PAY-024-01-04 | US-PAY-024-01 | **Given** a provider refund is requested through the SDK, **when** the provider API is called, **then** the call uses TLS and the provider's authentication; credentials are read from the encrypted adapter settings. | REQ-MPC-FR-330 |
| AC-PAY-024-02-01 | US-PAY-024-02 | **Given** credentials are entered, **when** they are saved, **then** they are stored encrypted and never exported in a configuration pack (BR-PAY-110). | CFG-01; NFR-X-001 |
| AC-PAY-024-01-05 | US-PAY-024-01 | **Given** an adapter is used for recurring orders (ORD-028), **when** it is installed, **then** it declares RecurringPaymentType; for Manual it implements ProcessRecurringPaymentAsync, which native ProcessNextRecurringPaymentAsync calls when the ORD task runs (5.00: no stored card data is passed; the adapter uses its own provider token); a mobile-money adapter returns Pending and the next order is marked paid by the callback (AC-PAY-004-01-02); NotSupported makes the method unavailable for recurring carts (native). | Proposed; FIT (OrderProcessingService.ProcessNextRecurringPaymentAsync, OrderProcessingService.cs:1891; Libraries/Nop.Services/Payments/RecurringPaymentType.cs) |
| AC-PAY-024-02-02 | US-PAY-024-02 | **Given** an adapter has settings that hold a credential, key or token, **when** its keys are listed in the PAY key catalogue, **then** each such key is flagged secret, so the PLT configuration-pack loader refuses it and exports omit it (BR-PAY-110). | Proposed; CFG-01; see PLT-003 (key catalogue) |

**Business rules applied:** BR-PAY-012; BR-PAY-110; BR-PAY-111 (§8.1).


### 7.25 PRD-PAY-025 Fiscal e-invoicing framework

| Item | Value |
|---|---|
| Description (baseline) | Sends each invoice to the tax authority's electronic invoicing system, retries if it fails, prints the official fiscal number or QR code on the invoice, and also handles credit notes (corrections and refunds on invoices); each country connects as an adapter. |
| Why it matters | Kenya (KRA eTIMS) and Malawi (MRA EIS) operate electronic invoicing; the clients must confirm how it applies to them (decision E-INV). |
| Who benefits | Finance staff; tax authorities |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ORD-009 |
| Status | On hold: PH-INF, E-INV, DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-025-01 | As a member of finance staff, I want each invoice to be sent to the tax authority's e-invoicing system and retried if it fails, so that invoices meet the e-invoicing obligation, if E-INV confirms it applies (inference). | D; inference from REQ-KTDA-ORD-002 (PH-INF, E-INV) | On hold: PH-INF, E-INV, DOC-LIB |
| US-PAY-025-02 | As a shopper, I want the official fiscal number or QR code printed on my invoice, so that I have a valid tax invoice. | D | On hold: PH-INF, E-INV, DOC-LIB |
| US-PAY-025-03 | As a member of finance staff, I want credit notes for corrections and refunds to be submitted the same way, so that the tax record matches refunds. | D | On hold: PH-INF, E-INV, DOC-LIB |
| US-PAY-025-04 | As a member of finance staff, I want the tax on each fiscal invoice to come from the automated tax calculation, so that tax filed equals tax charged. | Inference from REQ-KTDA-TAX-001 (PH-INF, E-INV) | On hold: PH-INF, E-INV, DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-025-01-01 | US-PAY-025-01 | **Given** e-invoicing is enabled for the country, **when** an invoice is issued (ORD-009) and the ORD event Invoice.Issued is raised (IC-ORD-04, InvoiceDocument), **then** the PAY consumer only enqueues the submission; the PAY task submits it through the country adapter; status Submitted / Accepted / Rejected is recorded (SM-PAY-07). | D; inference from REQ-KTDA-ORD-002 (PH-INF, E-INV) |
| AC-PAY-025-01-02 | US-PAY-025-01 | **Given** submission fails, **when** the error is transient, **then** it is retried per the retry policy; persistent failure alerts finance staff. | D |
| AC-PAY-025-02-01 | US-PAY-025-02 | **Given** the authority returns a fiscal number or QR, **when** the invoice PDF is generated, **then** the fiscal number and QR payload are printed through a PAY token provider registered with DOC-001 (IC-DOC-02); PAY does not override IPdfService (DOC-001 is the only owner, BR-DOC-001, OVR-REG); an invoice with no fiscal data yet gets no fiscal tokens. | D; FIT (IMessageTokenProvider pattern); OVR-REG |
| AC-PAY-025-03-01 | US-PAY-025-03 | **Given** a refund is completed (PAY-016), **when** the credit note is issued, **then** it is rendered by DOC-001 templates with the PAY fiscal tokens in the same way, submitted through the same adapter and linked to the original invoice. | D; OVR-REG |
| AC-PAY-025-04-01 | US-PAY-025-04 | **Given** an invoice is submitted, **when** the payload is built, **then** line tax amounts and rates are those calculated by PAY-020 for the order. | Inference from REQ-KTDA-TAX-001 (PH-INF, E-INV) |
| AC-PAY-025-01-03 | US-PAY-025-01 | **Given** SEL-025 issues a commission invoice to a seller and calls PAY SubmitFiscal (IC-PAY-09, consumed as IC-SEL-03), **when** e-invoicing is enabled for the country, **then** a FiscalSubmission of document type CommissionInvoice is queued and handled as in story 01; the fiscal status is returned to SEL. | D; Proposed (document type) |

**Business rules applied:** BR-PAY-120 (§8.1).


### 7.26 PRD-PAY-026 KRA eTIMS adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects invoices to the Kenya Revenue Authority's electronic invoicing system (eTIMS). |
| Why it matters | Legal invoicing in Kenya (to be confirmed with KTDA). |
| Who benefits | KTDA finance |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-PAY-025 |
| Status | On hold: PH-INF, E-INV, DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-026-01 | As a member of KTDA finance staff, I want invoices connected to KRA eTIMS, so that invoices meet the Kenyan e-invoicing obligation, if E-INV confirms it applies (inference). | D; E-INV | On hold: PH-INF, E-INV, DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-026-01-01 | US-PAY-026-01 | **Given** the eTIMS adapter is configured with KTDA's credentials and the eTIMS interface specification has been received, **when** an invoice or credit note is submitted, **then** it is sent per that specification and the returned fiscal data stored — held by E-INV, not binding until the specification is received. | D; E-INV |

**Business rules applied:** BR-PAY-120 (§8.1).


### 7.27 PRD-PAY-027 MRA EIS adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects invoices to the Malawi Revenue Authority's electronic invoicing system. |
| Why it matters | Legal invoicing in Malawi (to be confirmed with Malawi Post). |
| Who benefits | Malawi Post finance |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-PAY-025 |
| Status | On hold: PH-INF, E-INV, DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-027-01 | As a member of Malawi Post finance staff, I want invoices connected to MRA EIS, so that invoices meet the Malawian e-invoicing obligation, if E-INV confirms it applies (inference). | D; E-INV | On hold: PH-INF, E-INV, DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-027-01-01 | US-PAY-027-01 | **Given** the EIS adapter is configured with Malawi Post's credentials and the EIS interface specification has been received, **when** an invoice or credit note is submitted, **then** it is sent per that specification and the returned fiscal data stored — held by E-INV, not binding until the specification is received. | D; E-INV |

**Business rules applied:** BR-PAY-120 (§8.1).


### 7.28 PRD-PAY-028 M-Pesa (Kenya) adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects the shop to Safaricom M-Pesa in Kenya: a payment request appears on the customer's phone, with confirmations and reversals. |
| Why it matters | KTDA requires M-Pesa payments. |
| Who benefits | Kenyan shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-004 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-028-01 | As a Kenyan shopper, I want to pay with Safaricom M-Pesa by a request on my phone, so that I can pay the way I usually do. | D; REQ-KTDA-PAY-004 | Ready; on hold: AC-PAY-028-01-02 (C-FX) |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-028-01-01 | US-PAY-028-01 | **Given** the M-Pesa adapter is configured (till or paybill and credentials), **when** the shopper pays, **then** the request, callback, status-query and reversal flows of PAY-004 run through Safaricom M-Pesa. | D; REQ-KTDA-PAY-004; FIT (Daraja STK push named in gap) |
| AC-PAY-028-01-02 | US-PAY-028-01 | **Given** C-FX is decided, **when** an M-Pesa payment settles, **then** the settlement currency and conversion follow the C-FX rule — held by C-FX. | REQ-KTDA-PAY-004 |

**Business rules applied:** BR-PAY-012 (§8.1).


### 7.29 PRD-PAY-029 TNM Mpamba adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects the shop to TNM Mpamba mobile money in Malawi. |
| Why it matters | Malawi Post requires TNM Mpamba payments. |
| Who benefits | Malawian shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-004 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-029-01 | As a Malawian shopper, I want to pay with TNM Mpamba, so that I can pay from my wallet. | D; REQ-MPC-FR-126 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-029-01-01 | US-PAY-029-01 | **Given** the Mpamba adapter is configured, **when** the shopper pays, **then** the PAY-004 flows run through TNM Mpamba over the provider's secure API, and refunds are sent through the provider refund API (AC-PAY-004-04-01). | REQ-MPC-FR-126; REQ-MPC-FR-330; REQ-MPC-PAY-001 |

**Business rules applied:** BR-PAY-012 (§8.1).


### 7.30 PRD-PAY-030 Airtel Money adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects the shop to Airtel Money (Malawi, and Kenya if needed). |
| Why it matters | Malawi Post requires Airtel Money payments; the same adapter can serve Kenya if a client asks. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-004 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-030-01 | As a shopper, I want to pay with Airtel Money, so that I can pay from my wallet. | D; REQ-MPC-FR-127 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-030-01-01 | US-PAY-030-01 | **Given** the Airtel Money adapter is configured for the country, **when** the shopper pays, **then** the PAY-004 flows run through Airtel Money over the provider's secure API, and refunds are sent through the provider refund API (AC-PAY-004-04-01). | REQ-MPC-FR-127; REQ-MPC-FR-330; REQ-MPC-PAY-001 |

**Business rules applied:** BR-PAY-012 (§8.1).


### 7.31 PRD-PAY-031 KTDA bank card gateway adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects card payments to the Central Bank of Kenya-regulated bank gateway that KTDA chooses. |
| Why it matters | Meets KTDA's requirement for a regulated bank gateway. |
| Who benefits | KTDA; KTDA shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-002 |
| Status | On hold: KG-04 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-031-01 | As a KTDA payments manager (role to confirm, KG-16), I want card payments connected to the CBK-regulated bank gateway KTDA chooses, so that we meet the gateway rule. | D; REQ-KTDA-PAY-001 | On hold: KG-04 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-031-01-01 | US-PAY-031-01 | **Given** KTDA names the bank gateway and its adapter is built on PAY-002, **when** a shopper pays by debit or credit card, **then** the PAY-002 criteria hold for that gateway. | D; REQ-KTDA-PAY-002 |
| AC-PAY-031-01-02 | US-PAY-031-01 | **Given** PAY-031 is configured with the merchant ID of the bank KTDA names, **when** a card payment is made, **then** the request goes to that bank's endpoint and the transaction records the acquirer reference — held by KG-04 (bank not named). | REQ-KTDA-PAY-001 |

**Business rules applied:** BR-PAY-011 (§8.1).


### 7.32 PRD-PAY-032 MPC card gateway adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects card payments to the gateway Malawi Post chooses. |
| Why it matters | Enables card payments for Malawi Post. |
| Who benefits | Malawi Post; Malawi Post shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-002 |
| Status | On hold: MG-03 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-032-01 | As a Malawi Post payments manager (role to confirm, MG-08), I want card payments connected to the gateway Malawi Post chooses, so that shoppers can pay by card. | D; REQ-MPC-FR-129 | On hold: MG-03 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-032-01-01 | US-PAY-032-01 | **Given** Malawi Post names the gateway and its adapter is built on PAY-002, **when** a shopper pays by card, **then** the PAY-002 criteria hold, including tokenisation. | REQ-MPC-FR-129; REQ-MPC-PAY-001 |

**Business rules applied:** BR-PAY-011 (§8.1).


### 7.33 PRD-PAY-033 Accounts receivable

| Item | Value |
|---|---|
| Description (baseline) | For customers who buy on credit: account statements, credit notes, matching payments to invoices and lists of overdue amounts by age. |
| Why it matters | The client gets paid and tracks who owes what. |
| Who benefits | Finance staff; business buyers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-033-01 | As a member of finance staff, I want account statements, credit notes, payment matching to invoices and ageing for customers on credit, so that we get paid and know who owes what. | D | On hold: PAID-STUB |
| US-PAY-033-02 | As a business buyer, I want to see my statement and what is overdue, so that I can pay on time. | D | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-033-01-01 | US-PAY-033-01 | **Given** a customer buys on account (CHK-016), **when** an invoice is issued, **then** an open receivable is created with due date = invoice issue date + CreditAccount.PaymentTermsDays of the buyer's CHK-016 credit account (BR-PAY-130). | D; phasing basis: dependency of PRD-CHK-016 |
| AC-PAY-033-01-02 | US-PAY-033-01 | **Given** a payment is received, **when** finance staff allocate it, **then** it is matched to one or more invoices; partial allocation is allowed. | D |
| AC-PAY-033-01-03 | US-PAY-033-01 | **Given** the ageing report runs, **when** receivables exist, **then** amounts are grouped by age band (bands are a setting). | D |
| AC-PAY-033-02-01 | US-PAY-033-02 | **Given** the buyer opens My account, **when** they have receivables, **then** the statement, open invoices and overdue amounts are shown. | D |
| AC-PAY-033-01-04 | US-PAY-033-01 | **Given** CHK-016 computes a buyer's available credit, **when** it calls the PAY receivables read operation (IC-PAY-08 GetOpenReceivables), **then** PAY returns the open amount of every receivable of that buyer (company or customer) that is not Settled; it changes nothing. | Proposed; see CHK-016 (available credit) |
| AC-PAY-033-01-05 | US-PAY-033-01 | **Given** FIN-002 offers an open, undisputed, unassigned receivable to a lender, **when** FIN calls IC-PAY-08 LockForOffer, then Assign or ReleaseLock, **then** the receivable becomes Offered (no second offer is accepted), then Assigned with the lender as payee and its remit-to details, or Open again (SM-PAY-09); audited (AUD-PAY-011). | Proposed; see FIN-002 (invoice discounting) |
| AC-PAY-033-01-06 | US-PAY-033-01 | **Given** a payment received by the client is allocated to an Assigned receivable, **when** the allocation is saved, **then** the allocation is flagged "assigned — not for seller payout" and listed for finance staff to forward to the lender (as AC-FIN-002-02-03); the PAY-010 splits of the order lines on that invoice are not returned by IC-SEL-02 GetEligibleSplits, so SEL-017 never settles them to the seller (BR-PAY-131). | Proposed; BR-FIN-004 |
| AC-PAY-033-02-02 | US-PAY-033-02 | **Given** a receivable of the buyer is Assigned, **when** the buyer opens the statement, **then** the lender is shown as the party to pay with its remit-to details, instead of the seller. | Proposed; see FIN-002 (statement) |
| AC-PAY-033-01-07 | US-PAY-033-01 | **Given** SEL-025 issues a commission invoice to a seller and calls PostReceivable (IC-PAY-08, consumed as IC-SEL-03), **when** the receivable is created, **then** its debtor is the vendor (debtor type Vendor) and it follows the same ageing and allocation rules. | Proposed; see SEL-025 (commission invoices) |
| AC-PAY-033-01-08 | US-PAY-033-01 | **Given** a receivable is Assigned and the lender reports to FIN-002 that the buyer paid it, **when** FIN calls IC-PAY-08 AllocateExternal with the receivable, the amount and the lender reference, **then** an allocation with source LenderReport and the lender reference is saved (no platform payment), the open amount falls and the receivable becomes Settled when it reaches zero (SM-PAY-09); audited (AUD-PAY-011). | Proposed; see FIN-002 (lender reports payment) |

**Business rules applied:** BR-PAY-130; BR-PAY-131 (§8.1).


### 7.34 PRD-PAY-034 Outlet receipt printing and cash-up

| Item | Value |
|---|---|
| Description (baseline) | Prints small (80 mm) receipts and pickup slips at outlet counters, and lets each outlet close its cash at the end of a shift. |
| Why it matters | Supports counter service at post offices and outlets. |
| Who benefits | Outlet staff; walk-in customers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: PH-INF |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-034-01 | As a member of outlet staff, I want to record the payment method on an order I create for a customer and print a small (80 mm) receipt or pickup slip, so that walk-in customers get proof. | D; REQ-MPC-FR-112 | On hold: PH-INF |
| US-PAY-034-02 | As a member of outlet staff, I want to close my cash at the end of a shift, so that the outlet cash is accounted for and reconciled. | D; REQ-MPC-FR-131 | On hold: PH-INF |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-034-01-01 | US-PAY-034-01 | **Given** an agent creates an assisted order (CHK-013), **when** the agent records the payment method and takes payment, **then** the transaction stores the agent identity and method; the 80 mm receipt shows order, amount, method, reference and agent identity. | REQ-MPC-FR-112; Proposed (fields) |
| AC-PAY-034-02-01 | US-PAY-034-02 | **Given** a shift is open, **when** staff close it and enter counted cash, **then** expected cash (from the shift's cash payments) and counted cash are recorded with the difference; the shift locks (SM-PAY-06). | D; BR-PAY-140 |
| AC-PAY-034-02-02 | US-PAY-034-02 | **Given** a difference is not zero, **when** the shift is closed, **then** it is flagged for finance review. | Proposed |
| AC-PAY-034-02-03 | US-PAY-034-02 | **Given** a shift is closed, **when** reconciliation runs, **then** the shift's cash payments, with their secure references, appear in PAY-014 reconciliation. | REQ-MPC-FR-131 |

**Business rules applied:** BR-PAY-140 (§8.1).


### 7.35 PRD-PAY-035 Direct payment to the seller

| Item | Value |
|---|---|
| Description (baseline) | The buyer pays the seller directly into the seller's own payment account (for example the seller's own M-Pesa till or paybill, card merchant account or bank account) instead of paying the client first. Each seller connects their own account through the payment connection kit, so the platform receives the payment result and records it against the order. The client decides which sellers or shops use this model; refunds are made by the seller, and the platform records them and opens a dispute case if the buyer contests. Split payments, escrow and seller payouts do not apply to orders paid this way; commission is collected through 'Commission invoicing to sellers'. |
| Why it matters | Lets sellers keep full control of their own money and lets the client run a marketplace without holding sellers' funds. |
| Who benefits | Sellers; shoppers; business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-024 |
| Status | On hold: PO-REC-v8, PAY-DIRECT / LIC-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-035-01 | As a seller, I want to receive the buyer's payment directly into my own payment account, so that I keep control of my money. | D | On hold: PO-REC-v8, PAY-DIRECT / LIC-01 |
| US-PAY-035-02 | As a client administrator, I want to decide which sellers or shops use direct payment, so that we control the model. | D | On hold: PO-REC-v8, PAY-DIRECT / LIC-01 |
| US-PAY-035-03 | As a buyer, I want refunds and disputes to work when I paid the seller directly, so that I am protected. | D | On hold: PO-REC-v8, PAY-DIRECT / LIC-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-035-01-01 | US-PAY-035-01 | **Given** direct payment is enabled for the seller and the seller has connected an account through the connection kit, **when** a buyer pays for that seller's single-seller order, **then** the adapter resolves credentials from SellerPaymentAccount by the order's vendor, the payment goes to the seller's account and the result is recorded against the order. | D; FIT |
| AC-PAY-035-02-01 | US-PAY-035-02 | **Given** direct payment is not enabled for a seller, **when** a buyer pays, **then** the normal client-collected flow applies. | D |
| AC-PAY-035-01-02 | US-PAY-035-01 | **Given** an order is paid directly, **when** post-payment processing runs, **then** no split, escrow or payout is created; commission is left to SEL-025 (BR-PAY-150). | D |
| AC-PAY-035-03-01 | US-PAY-035-03 | **Given** the seller refunds through the PAY seller endpoint, **when** the refund is reported, **then** the endpoint checks the order belongs to the vendor, the platform records the refund offline through IOrderProcessingService, and if the buyer contests, PAY opens a dispute case through RET OpenCase (IC-RET-01, type PaymentDispute, source PAY-035 and the refund reference). | D; FIT |
| AC-PAY-035-01-03 | US-PAY-035-01 | **Given** the cart has items from several sellers, **when** direct payment is selected, **then** direct payment is not offered: orders with more than one vendor cannot use it (CHK-004 creates single-seller orders). | FIT |

**Business rules applied:** BR-PAY-150 (§8.1).


### 7.36 PRD-PAY-036 Offline direct payment confirmation

| Item | Value |
|---|---|
| Description (baseline) | When a buyer pays a seller outside the platform (bank transfer, cash, cheque or letter of credit), the seller marks the order as paid and uploads proof; the buyer can confirm, and a contested payment becomes a dispute case. |
| Why it matters | Keeps the order record complete when a buyer pays a seller outside the platform, for example by bank transfer, cash, cheque or letter of credit. |
| Who benefits | Sellers; business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-RET-007 |
| Status | On hold: WF-ENG, PO-REC-v8, PAY-DIRECT / LIC-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PAY-036-01 | As a seller, I want to mark an order paid when the buyer paid me outside the platform and upload proof, so that the order record is complete. | D | On hold: WF-ENG, PO-REC-v8, PAY-DIRECT / LIC-01 |
| US-PAY-036-02 | As a business buyer, I want to confirm the payment or contest it, so that mistakes are caught. | D | On hold: WF-ENG, PO-REC-v8, PAY-DIRECT / LIC-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PAY-036-01-01 | US-PAY-036-01 | **Given** an order uses offline direct payment, **when** the seller marks it paid through the PAY seller endpoint and uploads proof, **then** the proof is stored as an OrderNote with DownloadId; the PAY transaction becomes AwaitingConfirmation; the native order PaymentStatus stays Pending. | D; FIT |
| AC-PAY-036-02-01 | US-PAY-036-02 | **Given** the transaction is AwaitingConfirmation, **when** the buyer confirms, **then** the platform calls MarkOrderAsPaidAsync and the transaction becomes Successful. | D; FIT |
| AC-PAY-036-02-02 | US-PAY-036-02 | **Given** the transaction is AwaitingConfirmation, **when** the buyer contests, **then** PAY opens a dispute case through RET OpenCase (IC-RET-01, type PaymentDispute, source PAY-036 and the transaction reference), the transaction returns to Pending and the order PaymentStatus remains Pending. | D; FIT |
| AC-PAY-036-01-02 | US-PAY-036-01 | **Given** a seller uploads proof through the PAY seller endpoint, **when** the file is received, **then** the PAY endpoint checks the file through IC-ADM-08 CheckUpload with the upload context "offline payment proof", which PAY registers at installation through IC-ADM-08 RegisterUploadContext (own endpoint), before it stores the file through IDownloadService; a refused file is not stored and the ADM message key is returned; PAY keeps no type check of its own; the OrderNote is saved with DisplayToCustomer on, so the buyer opens the proof through native DownloadController.GetOrderNoteFile, which serves it only to the order's customer. | Proposed; see ADM-008 (BR-ADM-060); FIT (GetOrderNoteFile checks Order.CustomerId) |

**Business rules applied:** BR-PAY-150; BR-PAY-010 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-PAY-001 | A payment method is shown only if it is active, allowed for the store and customer role, and every routing rule that applies to it allows it. | PAY-001 | REQ-MPC-FR-305; FIT; Proposed (all-rules-allow) |
| BR-PAY-002 | Routing rule dimensions: store, country, customer role or type, location type (rural/urban, read from the LOG-004 coverage area ServiceArea.LocationType; PAY stores none), fulfilment (pickup/delivery), service type, order value range, seller, item. | PAY-001 | D; REQ-MPC-FR-305; FC-M13-001 (value); REQ-MPC-FR-132 (seller/item) |
| BR-PAY-010 | Transaction statuses and transitions are those of state model SM-PAY-01. Native order PaymentStatus mapping: Initiated, Pending, AwaitingConfirmation, Failed → Pending (order stays retryable); Authorized → Authorized (MarkAsAuthorizedAsync); Successful → Paid (MarkOrderAsPaidAsync); Voided (only from Authorized) → Voided (VoidAsync / VoidOfflineAsync); Reversed or Refunded from Paid → Refunded or PartiallyRefunded (RefundAsync / RefundOfflineAsync if nothing was refunded before, otherwise PartiallyRefundAsync / PartiallyRefundOfflineAsync). The native order PaymentStatus is changed only through IOrderProcessingService, never by setting Order.PaymentStatusId directly. | PAY-011 and all adapters | REQ-MPC-FR-134; FIT |
| BR-PAY-011 | Card data (number, expiry, security code) is never received, stored or logged by the platform; only gateway tokens and references. | PAY-002, PAY-031, PAY-032 | REQ-MPC-FR-129; REQ-MPC-FR-148; SEC-003 |
| BR-PAY-012 | Every provider call that can charge or refund carries an idempotency key (default Order.OrderGuid + AttemptNo); every callback is de-duplicated by provider reference and transaction status before MarkOrderAsPaidAsync is called — native CanMarkOrderAsPaid alone is not sufficient because it returns true for PartiallyRefunded orders. | PAY-012 and all adapters | REQ-MPC-FR-135; FIT |
| BR-PAY-013 | Stock is decremented at order placement (native). The unpaid-order timeout, reminders and release are owned by PRD-INV-004: when the payment window for the payment method of the order expires, INV-004 applies its configured action (remind, flag or cancel); if the action is cancel, it cancels the order through IOrderProcessingService.CancelOrderAsync, which returns the stock. PAY keeps no separate stock hold and no timeout of its own. INV-004 cancels only if, under ILocker key 'pay-order-{OrderId}', the order PaymentStatus is still Pending and no PaymentTransaction for the order is Successful or Authorized; it calls CancelOrderAsync(order, notifyCustomer: true). CancelOrderAsync does not void or refund payments. | PAY-004 | FIT; depends on PRD-INV-004 (workbook); INV-HOLD |
| BR-PAY-014 | Group payment (Proposed): when CHK-004 places several sub-orders under one CheckoutSession, it processes payment once before any sub-order is saved (BR-CHK-006); PAY creates one PaymentTransaction for the checkout (merchant reference = CheckoutSession reference) with one share per seller, and links each sub-order through PaymentTransactionOrder when the CHK-003 placement host calls the PAY placement participant Confirm (IC-CHK-06) after saving it; the provider is charged once. A Paid result is applied by native placement to every sub-order; PAY never marks a sub-order paid twice. On success MarkOrderAsPaidAsync is called once per sub-order under 'pay-checkout-{CheckoutSessionId}' then 'pay-order-{OrderId}'; on failure all sub-orders stay Pending and retry is per checkout. Redirection adapters redirect for the checkout total from PostProcessPaymentAsync of the one order native checkout passes. A method whose adapter does not declare group support is not offered for a checkout with more than one sub-order. Until approved, CHK-004 is single-seller only. | PAY-011 | Proposed; OVR-REG; FIT (ProcessPaymentRequest.CustomValues; PostProcessPaymentRequest.Order; CheckoutController calls PostProcessPaymentAsync once) |
| BR-PAY-020 | Payment references are unique per order and payment attempt, not guessable, and include a check digit (format Proposed). | PAY-005, PAY-008 | REQ-MPC-FR-128; REQ-MPC-FR-131 ("secure payment reference") |
| BR-PAY-021 | A bank payment is matched only when reference and amount match; anything else is an exception. | PAY-005 | Proposed |
| BR-PAY-022 | COD is available only if every item and every seller in the cart allow it and the delivery address is in an allowed area. | PAY-008 | REQ-MPC-FR-132 |
| BR-PAY-030 | No shipment may be created for an LC-paid order until the LC is Verified. PAY-006 enforces this only as a shipment guard provider (IC-ORD-11) to the single IShipmentService.InsertShipmentAsync override hosted by the core feature ORD-010 (BR-ORD-055, decision OVR-REG; core behaviour is not hosted in the B2B trade pack, D-01); PAY registers no shipment override and no AddShipment filter of its own. A ModelReceivedEvent veto is not used (AddShipment does not check ModelState); an event consumer cannot block. | PAY-006 | REQ-KTDA-PAY-009; FIT; OVR-REG; D-01 |
| BR-PAY-031 | Escrow releases follow the stages defined for the order; no release while a dispute is open, checked by calling RET HasOpenCase(orderId) (IC-RET-01) synchronously inside the ILocker key 'pay-order-{OrderId}' before each release; release jobs are enqueued by event consumers (ShipmentSentEvent, ShipmentDeliveredEvent, OrderAcceptedEvent) and executed by a scheduled task; the ADM-002 payment-release step calls the same release operation (IC-PAY-06) and the same checks apply. | PAY-007 | FC-M13-008; Proposed; FIT; BR-RET-062 |
| BR-PAY-040 | Wallet balance never goes below zero; every change is a ledger entry with a reference. | PAY-009 | Proposed |
| BR-PAY-050 | Split = seller share + logistics fee + platform commission (+ tax on commission) = amount paid for the line, using the rule versions in force when the order was placed. | PAY-010 | REQ-MPC-FR-133; see PAY-021 (REQ-MPC-FR-303) |
| BR-PAY-051 | Partial refunds adjust fees, commission and split amounts in proportion to the refunded share of the line. | PAY-010, PAY-015, PAY-016 | REQ-MPC-FR-141 |
| BR-PAY-052 | Amounts are rounded per line to the currency's minor unit; any rounding remainder goes to the platform commission line, so the parts always sum to the line amount. | PAY-010, PAY-015, PAY-016 | Proposed |
| BR-PAY-053 | A PaymentSplit carries a SettlementBatchId set only by SEL-017 inside its settlement lock; a split with a SettlementBatchId is never included in another batch. | PAY-010 | Proposed; BR-SEL-012 |
| BR-PAY-060 | Reconciliation classes: Matched, Unmatched — platform only, Unmatched — provider only, Timing difference. | PAY-014 | FC-M13-017 |
| BR-PAY-070 | Fee, commission and tax rules are versioned with an effective date; an order keeps the versions in force when placed. | PAY-015, PAY-021 | REQ-MPC-FR-139; REQ-MPC-FR-303 |
| BR-PAY-080 | Segregation of duties: the person who requests a refund above the threshold, or creates a disbursement batch, cannot approve it. | PAY-016, PAY-022 | REQ-MPC-FR-245 |
| BR-PAY-081 | A refund cannot exceed Order.OrderTotal − Order.RefundedAmount (primary store currency), nor, per line, the line amount paid minus earlier line refunds. Order-level parts (BR-PAY-085) count against the order limit only. | PAY-016 | FIT |
| BR-PAY-082 | Native admin payment actions (mark as paid, refund, refund offline, partial refund, void, void offline, capture) are intercepted by PAY through a global IAsyncActionFilter registered by the PAY plugin for Admin OrderController actions CaptureOrder, MarkOrderAsPaid, RefundOrder, RefundOrderOffline, VoidOrder, VoidOrderOffline and PartiallyRefundOrderPopup [POST] (a ModelReceivedEvent veto cannot be used: except the partial-refund popup these actions take no model); they are allowed only with Payments.Core.Transactions.CreateEditDelete (mark paid, void, capture) or Payments.Core.Refunds.Request plus approval (refunds), with a reason, and are audited. Native admin payment actions remain blocked for vendors. | PAY-016, PAY-019 | REQ-MPC-FR-245; REQ-MPC-FR-144; FIT |
| BR-PAY-083 | Refund lifecycle: Initiated → Processing → Completed \| Failed (SM-PAY-02). For asynchronous providers the native order refund is recorded only on Completed, through the offline refund methods; the native OrderRefunded notification is therefore sent once, on completion. Exception: for a transaction in SuccessfulAfterCancel the refund is provider-side only; on Completed PAY records it on the Refund record and an OrderNote and does not call native refund methods (the order PaymentStatus is Pending and they would throw); the order stays Cancelled; the shopper is notified by the PAY message template Pay.RefundAfterCancel.CustomerNotification (new, installed by the PAY plugin), not the native OrderRefunded template. | PAY-004, PAY-016 | REQ-MPC-FR-140; FIT |
| BR-PAY-085 | IC-PAY-05 order-level parts and orderless requests (Proposed). (1) A RET request may carry order-level parts (component Shipping, PaymentFee or CheckoutAttribute, amount) beside or instead of order lines; each part is stored as a RefundLine with its component and no OrderItemId; the total of lines and parts is checked against BR-PAY-081 and recorded through the native refund method for the order amount; split and fee adjustments (BR-PAY-051) apply to line amounts only. (2) A RET request with source type PlacementFailure carries no order ID but the CheckoutSession reference and the group PaymentTransaction ID; its amount cannot exceed the share of that transaction linked to no sub-order minus earlier refunds of it; the refund is provider-side only and no native order refund method is called (as for SuccessfulAfterCancel, BR-PAY-083). | PAY-016 | Proposed (RET IC-RET-04, AC-RET-005-05-03, AC-RET-005-05-04); FIT (OrderProcessingService.PartiallyRefundOfflineAsync checks OrderTotal − RefundedAmount) |
| BR-PAY-084 | The PAY refund request operation (IC-PAY-05) is the only entry for refunds raised outside PAY and accepts calls only from RET-005 (refund-trigger owner); each request carries an idempotency key and a source reference; a repeated key returns the first Refund. PAY-internal refunds (finance staff, SuccessfulAfterCancel) use the same service. | PAY-016 | Proposed (product refund-trigger decision: RET-005 single owner); BR-RET-041 |
| BR-PAY-090 | Risk rules have a type (velocity, device, model score from AI-006, other), an action (Flag or Block; Flag may also request an ORD-010 hold), a threshold and an on/off state; Block is evaluated before payment as a CHK placement validator (IC-PAY-03); every firing raises Risk.Flagged; every change is audited and, as a PLT-004 controlled configuration type (IC-PLT-03), approved before it applies. | PAY-018 | REQ-MPC-FR-143; REQ-MPC-FR-320 |
| BR-PAY-100 | Every manual intervention on a payment needs a reason and is written to the audit trail. | PAY-019 | REQ-MPC-FR-144 |
| BR-PAY-110 | Provider credentials are stored encrypted per client instance and never exported in configuration packs; every PAY setting key that holds a credential, key or token is flagged secret in the PAY key catalogue so the PLT pack loader refuses it and exports omit it. | PAY-024 | CFG-01; BR-PLT-013 |
| BR-PAY-111 | Every PAY setting key is listed in the PAY key catalogue (key, type, layer, secret flag, default) so configuration-pack validation accepts it (NFR-X-008); PAY pages, widgets and scheduled tasks check the feature state through IC-PLT-02 (setting productfeature.<prd-id>, two-level) for the store before they run. | PAY-024 and all PAY features | Proposed; see PLT-003, PLT-022 |
| BR-PAY-120 | Where e-invoicing applies, an invoice is final only when the authority accepts it; credit notes reference the original invoice. | PAY-025 | D |
| BR-PAY-130 | A receivable is created per on-account invoice, at invoice issue, with due date = issue date + CreditAccount.PaymentTermsDays (CHK-016); the debtor is a customer, a company or a vendor (SEL-025 commission invoices). | PAY-033 | D; CHK-016; Proposed (vendor debtor) |
| BR-PAY-131 | A receivable offered to a lender (FIN-002) is locked against a second offer; once Assigned, its payee is the lender, allocations received by the client for it are flagged for forwarding to the lender, and the PAY-010 splits of its invoice lines are never returned to SEL-017 as eligible for settlement. A payment the buyer makes to the lender is recorded by FIN through AllocateExternal with the lender reference. | PAY-033 | Proposed; BR-FIN-004 |
| BR-PAY-140 | A shift cash-up records expected and counted cash; a closed shift cannot be edited. | PAY-034 | D; Proposed (lock) |
| BR-PAY-150 | Orders paid by direct payment to the seller create no split, escrow or payout; refunds are made by the seller through PAY endpoints and recorded by the platform. | PAY-035, PAY-036 | D |
| BR-PAY-170 | Unpaid-order reminder and cancellation configuration rule (VER-500): the native 5.00 pending-order reminders (ReminderSettings.PendingOrdersEnabled, install default on; message templates Reminders.PendingOrderFollowUp1 and 2, active by default after 3 and 10 days; email only) are sent for every order with PaymentStatus Pending, whatever the payment method, including on-account (CHK-016), letter-of-credit (PAY-006), escrow (PAY-007) and bank-transfer (PAY-005) orders that are pending by design. Every configuration pack sets PendingOrdersEnabled off unless the client asks for it; the payment-pending message is the PAY-011 notification (event code Pay.Status.Pending through TRK-005). The native automatic cancellation of unpaid orders (OrderSettings.AutoCancelEnabled, install default off; AutoCancelOrdersTask cancels through CancelOrderAsync after one AutoCancelDelay for all methods except AutoCancelIgnoredPaymentMethods) stays off while the unpaid-order timeout per payment method is INV-004 (decision INV-HOLD); if INV-004 adopts it, AutoCancelIgnoredPaymentMethods lists every on-account, letter-of-credit and escrow method. | PAY-005, PAY-011 | VER-500; FIT (ReminderSettings.cs:18; ProcessPendingOrdersTask.cs:54-90; AutoCancelOrdersTask.cs:56-75; InstallRequiredData.cs:1164-1180, 1895-1899, 2207); Proposed |
| BR-PAY-160 | PAY sends no email or SMS itself. Native templates and the PAY template Pay.RefundAfterCancel.CustomerNotification go through IWorkflowMessageService (single override TRK-005); every other PAY notification in §13 goes through IC-TRK-04 SendEvent with a PAY event code registered at installation through IC-TRK-04 RegisterEventCode. Each event code has the name of the message key that holds its default text. TRK-006 opt-outs apply to all. | PAY-013 and all PAY notifications | Proposed; owner decision on messages (TRK-005 sends all notifications); see TRK-005 (BR-TRK-020) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-PAY-01 | PaymentTransaction | (none) | attempt started | — | Initiated | create record (AttemptNo) |
| SM-PAY-01 | PaymentTransaction | Initiated | request accepted by provider | — | Pending | — |
| SM-PAY-01 | PaymentTransaction | Pending | callback / status: authorised | verified, not already Authorized/Successful | Authorized | MarkAsAuthorizedAsync |
| SM-PAY-01 | PaymentTransaction | Pending | callback / status: success | verified, not already Successful | Successful | MarkOrderAsPaidAsync (once) |
| SM-PAY-01 | PaymentTransaction | Pending | callback / status: failure, shopper rejects | — | Failed | order stays Pending; retry allowed within window |
| SM-PAY-01 | PaymentTransaction | Pending | seller marks offline payment paid (PAY-036) | vendor owns order | AwaitingConfirmation | OrderNote with proof; order stays Pending |
| SM-PAY-01 | PaymentTransaction | AwaitingConfirmation | buyer confirms | — | Successful | MarkOrderAsPaidAsync |
| SM-PAY-01 | PaymentTransaction | AwaitingConfirmation | buyer contests | — | Pending | dispute case (RET-007) |
| SM-PAY-01 | PaymentTransaction | Authorized | capture | — | Successful | online capture: IOrderProcessingService.CaptureAsync (raises OrderPaidEvent); provider-side capture reported by callback: MarkOrderAsPaidAsync — never both |
| SM-PAY-01 | PaymentTransaction | Authorized | void | — | Voided | VoidAsync / VoidOfflineAsync |
| SM-PAY-01 | PaymentTransaction | Successful | provider reversal or lost chargeback | — | Reversed | RefundOfflineAsync or PartiallyRefundOfflineAsync |
| SM-PAY-01 | PaymentTransaction | Successful | refund completed (full / part) | BR-PAY-081 | Refunded / PartiallyRefunded | native refund method per BR-PAY-083 |
| SM-PAY-01 | PaymentTransaction | Failed | payment window expires (INV-004) | configured action = cancel | Failed (final) | INV-004 cancels the order (CancelOrderAsync; stock returned) |
| SM-PAY-01 | PaymentTransaction | Failed | payment window expires (INV-004) | configured action = remind or flag | Failed | INV-004 reminds the shopper or flags the order; retry stays possible |
| SM-PAY-01 | PaymentTransaction | Failed (final) / Pending on a cancelled order | verified success callback after cancellation | order Cancelled | SuccessfulAfterCancel | no MarkOrderAsPaidAsync; order stays Cancelled; console exception; refund opened (PAY-016); AUD-PAY-001 |
| SM-PAY-02 | Refund | (none) | refund requested | BR-PAY-081; approval if above threshold | Initiated | — |
| SM-PAY-02 | Refund | Initiated | sent to provider | — | Processing | — |
| SM-PAY-02 | Refund | Processing | provider confirms | — | Completed | native refund recorded (except SuccessfulAfterCancel: PAY record and OrderNote only); notification per BR-PAY-083 |
| SM-PAY-02 | Refund | Processing | provider rejects | — | Failed | finance alerted |
| SM-PAY-03 | LetterOfCredit | Received | verification recorded | Payments.Core.TradeFinance.CreateEditDelete | Verified | shipment allowed |
| SM-PAY-03 | LetterOfCredit | Received | rejected / expiry date passed | — | Rejected / Expired | buyer and export staff notified |
| SM-PAY-04 | EscrowStage | Pending | trigger event (sent / delivered / accepted) | no open dispute | Releasing | release job enqueued |
| SM-PAY-04 | EscrowStage | Releasing | provider confirms | — | Released | after final stage: MarkOrderAsPaidAsync |
| SM-PAY-04 | EscrowStage | Releasing | provider error | — | Pending | finance alerted; retry |
| SM-PAY-05 | Chargeback | Open | outcome recorded: won | — | Won | case closed |
| SM-PAY-05 | Chargeback | Open | outcome recorded: lost | — | Lost | transaction Reversed |
| SM-PAY-06 | OutletShift | Open | close with counted cash | — | Closed | difference recorded; locked; flag if not zero |
| SM-PAY-07 | FiscalSubmission | Queued | submitted | — | Submitted | — |
| SM-PAY-07 | FiscalSubmission | Submitted | authority accepts / rejects | — | Accepted / Rejected | fiscal number and QR stored / finance alerted |
| SM-PAY-08 | DisbursementLine | Approved | payout sent | batch approved by second person | Sent | — |
| SM-PAY-08 | DisbursementLine | Sent | provider result | — | Succeeded / Failed | retry on transient failure |
| SM-PAY-09 | Receivable | (none) | on-account invoice issued, or PostReceivable (SEL-025) | — | Open | due date per BR-PAY-130 |
| SM-PAY-09 | Receivable | Open | allocations reach the full amount | — | Settled | — |
| SM-PAY-09 | Receivable | Open | FIN-002 LockForOffer | open, undisputed, not assigned (BR-FIN-004) | Offered | second offer refused; AUD-PAY-011 |
| SM-PAY-09 | Receivable | Offered | FIN-002 ReleaseLock (lender declines) | — | Open | AUD-PAY-011 |
| SM-PAY-09 | Receivable | Offered | FIN-002 Assign (lender accepts) | — | Assigned | payee = lender with remit-to details; AUD-PAY-011 |
| SM-PAY-09 | Receivable | Assigned | allocations reach the full amount (client-received or FIN-002 AllocateExternal) | — | Settled | client-received allocations flagged not for seller payout (BR-PAY-131); AUD-PAY-011 |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| PaymentTransaction (new) | Id, OrderId, AttemptNo, MethodSystemName, AdapterId, Status (SM-PAY-01), Amount, CurrencyCode, CustomerCurrencyCode, ExchangeRate, ProviderReference, PaymentReference, IdempotencyKey (default OrderGuid + AttemptNo), CheckoutSessionId (group payment, null otherwise), AgentId (assisted), FraudScore, FraudModelVersion (AI-006), StatusHistory, CreatedOnUtc, UpdatedOnUtc | PAY-011, PAY-012, PAY-023, PAY-034 | Adapters also set ProcessPaymentResult.AuthorizationTransactionId / CaptureTransactionId so Order.AuthorizationTransactionId / CaptureTransactionId stay filled for native capture, refund and void |
| PaymentTransactionOrder (new) | TransactionId, OrderId, Amount | PAY-011 | One row per sub-order of a group transaction (BR-PAY-014); for a single order OrderId on PaymentTransaction is used. CheckoutSession is the CHK-004 entity, not duplicated |
| PaymentRoutingRule (new) | Id, MethodSystemName, Dimension (BR-PAY-002), Operator, Values, IsActive, StoreId | PAY-001 | Native country restrictions (setting paymentmethodrestictions.<systemname>) and plugin.json store/role limits remain |
| PaymentFeeSchedule (new) | Id, Scope (method / provider / platform / COD), Basis (fixed / %), Value, LocationType, ServiceLevel, EffectiveFromUtc, Version | PAY-015 | Native per-method additional fee remains for simple cases |
| Refund / RefundLine (new) | Refund: Id, OrderId (empty only for source type PlacementFailure, BR-PAY-085), CheckoutSessionId (PlacementFailure only), TransactionId, Amount (primary store currency), CustomerCurrencyAmount (at Order.CurrencyRate), Reason, Status (SM-PAY-02), ProviderReference, RequestedBy, ApprovedBy, ExpectedCompletionDays, SourceType, SourceId, IdempotencyKey (RET requests, BR-PAY-084); RefundLine: RefundId, OrderItemId (empty for an order-level part), Component (Line, Shipping, PaymentFee, CheckoutAttribute; BR-PAY-085), Amount | PAY-016 | No native refund entity exists; kept in step with native Order.RefundedAmount and PaymentStatus through IOrderProcessingService refund methods |
| LetterOfCredit (new) | Id, OrderId, IssuingBank, LcNumber, Amount, Currency, ExpiryDate, Documents, Status (SM-PAY-03), VerifiedBy | PAY-006 | Fields Proposed; KTDA to confirm |
| EscrowAgreement / EscrowStage (new) | AgreementId, OrderId, ProviderReference, Balance; Stage: Sequence, Trigger (Sent / Delivered / Accepted), Share, Status (SM-PAY-04), ReleasedOnUtc | PAY-007 | Funds held externally; order Authorized until final release |
| Wallet / WalletLedgerEntry (new) | WalletId, CustomerId, Balance, HeldAmount (placement reservations, option (b)), Currency; Entry: Type (TopUp / Spend / Refund / Adjustment), Amount, OrderId (Spend and Refund), Reference, CreatedOnUtc | PAY-009 | Spend model WAL-01: (a) wallet as an IPaymentMethod, full-order payment only; or (b) partial spend as an order-total deduction through an IOrderTotalCalculationService override. Native GiftCard and RewardPoints are not reused. Under OVR-REG option (b) is a PAY deduction provider to the CAT-042 override (IC-CAT-06), not a PAY override; the deducted amount per order is the Spend entry with its OrderId (reconciliation read IC-PAY-10) and the CAT-042 OrderTotalAdjustment row (display read IC-CAT-06 GetOrderAdjustments); native Order has no field for it |
| PaymentSplit (new) | Id, OrderItemId, SellerShare, LogisticsFee, PlatformCommission, CommissionTax, RuleVersionIds (from SEL-016 via IC-SEL-02), SettlementBatchId (set by SEL-017, BR-PAY-053) | PAY-010, PAY-021 | Consumed by SEL-017 settlement and payouts |
| ReconciliationRun / ReconciliationLine (new) | Run: Provider, StatementDate, Source (API / upload); Line: ProviderReference, Amount, Class (BR-PAY-060), TransactionId, ResolutionNote, ResolvedBy | PAY-014 | |
| Chargeback (new) | Id, TransactionId, Reason, Amount, ResponseDeadline, Status (SM-PAY-05), Outcome | PAY-017 | |
| RiskRule / RiskFlag (new) | Rule: Type (velocity / device / model score / other), Threshold, Window, Action (Flag / Block), HoldOrder (Flag only), IsActive; Flag: RuleId, SubjectType (customer / transaction), SubjectId, TransactionId, Score, ModelVersion, Reasons, Status | PAY-018 | Restrictions from SEL-013 lists are read, not copied |
| FiscalSubmission (new) | Id, DocumentType (Invoice / CreditNote / CommissionInvoice), DocumentId (ORD InvoiceDocument, credit note or SEL-025 commission invoice), Country, Status (SM-PAY-07), FiscalNumber, QrPayload, Attempts, LastError | PAY-025 to PAY-027 | |
| Receivable / ReceivableAllocation (new) | Receivable: DebtorType (Customer / Company / Vendor), DebtorId, InvoiceId, DueDate, Amount, OpenAmount, Status (SM-PAY-09), PayeeType (Seller / Platform / Lender), PayeeName, RemitToDetails, FinancingReference (FIN-002), RowVersion; Allocation: Source (Payment / LenderReport), PaymentId, ExternalReference (lender reference), ReceivableId, Amount, AssignedNotForPayout | PAY-033 | Plugin tables; the lock against a second offer is the Offered state under the plugin row version |
| OutletShift (new) | Id, OutletId, StaffId, OpenedOnUtc, ClosedOnUtc, ExpectedCash, CountedCash, Difference, Status (SM-PAY-06) | PAY-034 | Outlet = StorePickupPoint (bundled Pickup.PickupInStore) + extensions |
| DisbursementBatch / DisbursementLine (new) | Batch: Status, CreatedBy, ApprovedBy; Line: Recipient, Account, Amount, Status (SM-PAY-08), Reason, Attempts | PAY-022 | |
| SellerPaymentAccount (new) | VendorId, AdapterId, AccountIdentifier, CredentialsRef (encrypted), IsActive | PAY-035 | Payment-plugin settings are per store, not per vendor; ProcessPaymentRequest has no vendor — the adapter resolves the account from the single vendor of the order |
| Offline payment proof (native) | OrderNote with DownloadId | PAY-036 | Native; no new file store |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Tax categories and rates | TaxCategory, tax-provider config | global → country → client | PAY-020 | Core |
| Fiscal e-invoicing adapter selection | Fiscal adapter config (new) | country → client | PAY-025 | Core |
| Payment methods and routing rules | Payment plugin activation, restrictions, routing rules (new) | country → client → store | PAY-001 / PAY-024 | Core |
| Countries, states/provinces, districts (Kenya counties, Malawi districts) | Country, StateProvince; addresssettings.countyenabled / .countyrequired (free-text County); district list (new) only if a controlled list is required | global → country → client | CHK-007 / LOG-002 / PAY-020 | Core |
| Payment fee schedules | Payment-method additional fee settings; provider/platform fee schedules (new) | country → client | PAY-015 | Core |
| Agri-finance and schemes pack settings | Scheme definitions, eligibility rules, budgets, partner credit/insurance products, disbursement rails | vertical (Schemes pack) → client | ORD-024 / PAY-022 / FIN-001 – FIN-004 | Agri-finance and schemes pack |
| Assisted service pack settings | Agent roles, outlet assignment, receipt printer profile, cash-up rules | vertical (Assisted pack) → client | IAM-026 / CHK-013 / PAY-034 | Assisted service pack |
| Commerce extensions pack settings | Cart restriction rules, return fees, feed/syndication targets, PayPal method enablement and options (credentials entered per client instance, not stored in the pack) | vertical → client → store | CHK-011 / RET-006 / CAT-035 / PAY-003 | Commerce extensions pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Unpaid-order reminders and automatic cancellation (5.00) | ReminderSettings.PendingOrdersEnabled (native, install default on; Proposed off), message templates Reminders.PendingOrderFollowUp1 / 2; OrderSettings.AutoCancelEnabled (native, install default off; stays off), AutoCancelDelay, AutoCancelIgnoredPaymentMethods (BR-PAY-170) | client → store | Not stated | Not stated |
| Active payment methods | PaymentSettings.ActivePaymentMethodSystemNames (native) | client → store | Card (bank gateway), PayPal, M-Pesa, bank transfer, LC, escrow (KTDA PAY-001–008) | Mpamba, Airtel Money, bank transfer, card, outlet cash, COD (MPC FR-126–132); wallet if enabled (FR-130) |
| Payment restrictions by country | Setting paymentmethodrestictions.<systemname> (native; source spelling; shared value, StoreId 0 only) | client | Not stated in source | Not stated in source |
| Payment method store / role limits | LimitedToStores / LimitedToCustomerRoles in plugin.json (file) | client → store | Not stated in source | Not stated in source |
| Routing rules | PaymentRoutingRule (new) | client | Not stated in source | Per service type and rural/urban (FR-305) |
| Re-posting payments allowed | PaymentSettings.AllowRePostingPayments (native; applies to Redirection-type methods only) | client | Not stated (Proposed: on) | On (FR-150 retry) |
| Order GUID reuse window | PaymentSettings.RegenerateOrderGuidInterval (native, seconds, default 180) | client | Not stated | Not stated |
| Mobile-money wait time and status-query count | PAY settings (new) | country → client | Not stated | Not stated |
| Payment window for unpaid orders, per payment method; action remind / flag / cancel (Proposed) | INV-004 settings (owner INV) | client | Not stated | Not stated |
| COD allowed areas / sellers / items | PAY settings + product/vendor flags (new) | client | — | Configurable (FR-132) |
| Fee schedules; fee taxability | PaymentFeeSchedule (new); TaxSettings.PaymentMethodAdditionalFeeIsTaxable (native) | country → client | Not stated | Versioned (FR-139); COD fee by location (FR-304) |
| Refund approval threshold | PAY settings (new) | client | Not stated | Configurable (FR-245); value not stated |
| Expected refund time per method | PAY settings (new) | client | Not stated | Required (FR-243); values not stated |
| Bulk-buyer customer role for LC and escrow | Customer role (native) referenced by PAY settings | client | Required (KTDA PAY-008); definition not stated (KG-08) | — |
| Risk rules and thresholds | RiskRule (new) | client | Not stated | Configurable (FR-143, FR-320) |
| Currencies, primary and exchange currency, rate provider | Currency, CurrencySettings (native), ECB rate plugin (bundled) | client → store | USD base; multi-currency (LOC-002); C-FX open | Not stated |
| Tax provider, categories, prices incl./excl. tax | TaxSettings (native) | country → client | Not stated (KG-06) | Not stated (MG-05) |
| E-invoicing adapter | FiscalSubmission settings (new) | country | KRA eTIMS (E-INV) | MRA EIS (E-INV) |
| Wallet enabled; spend model | PAY settings (new) | client | — | If enabled by Malawi Post (FR-130); WAL-01 |
| Direct payment to seller enabled, per seller | PAY settings + SellerPaymentAccount (new) | client | Not stated | Not stated |
| Provider credentials | Adapter settings, encrypted (new) | client instance only | Entered at deployment | Entered at deployment |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Payment method selection (checkout step) | PAY-001, PAY-015, PAY-020 | Native checkout step extended |
| Storefront | Payment status / retry page | PAY-011 | New (REQ-MPC-FR-150) |
| Storefront | Mobile-money waiting page (request sent / QR) | PAY-004 | New |
| Storefront | Bank transfer and outlet-cash instructions with reference | PAY-005, PAY-008 | Native confirmation page extended |
| Storefront — My account | Wallet balance and ledger; refunds with status and expected time; statement and receivables | PAY-009, PAY-016, PAY-033 | New tabs |
| Storefront — My account | Confirm or contest an offline direct payment | PAY-036 | New |
| Seller portal | Payment account connection; offline payment mark-paid with proof; refunds for direct-payment orders; split amounts per order | PAY-035, PAY-036, PAY-010 | New PAY endpoints (native admin payment actions are blocked for vendors) |
| Admin | Payment methods and routing rules | PAY-001 | Native list extended + new rules page |
| Admin | Payments operations console (transactions, exceptions, interventions) | PAY-019 | New |
| Admin — order edit | Native payment buttons intercepted (BR-PAY-082) | PAY-016, PAY-019 | Native page, PAY filter |
| Admin | Reconciliation (runs, exceptions, daily file) | PAY-014 | New |
| Admin | Fee schedules | PAY-015 | New |
| Admin | Refund approval queue | PAY-016 | New |
| Admin | Chargebacks | PAY-017 | New |
| Admin | Risk rules and review queue (with model score, model version and reasons where AI-006 applies) | PAY-018 | New |
| Admin | Letters of credit; escrow stages | PAY-006, PAY-007 | New |
| Admin | Tax reports; e-invoicing submissions | PAY-021, PAY-025 | New |
| Admin | Disbursement batches | PAY-022 | New (P3) |
| Outlet / agent | Payment recording on assisted orders, receipt print, shift cash-up | PAY-008, PAY-034 | New (with CHK-013 assisted checkout) |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Pay.NoMethodAvailable | No payment method is available for this order. Please contact us for help. | AC-PAY-001-03-02 |
| Pay.CheckoutRestricted | We cannot complete this checkout. Please contact us for help. | AC-PAY-018-03-01 |
| Pay.Status.Pending | Your payment is being confirmed. You will receive a message when it completes. | AC-PAY-011-01-01; §13 (TRK event code) |
| Pay.Status.Failed | Your payment did not go through. You can try again or choose another method. | AC-PAY-011-01-01; §13 (TRK event code) |
| Pay.RetryExpired | The time to pay for this order has passed. Please place a new order. | AC-PAY-011-02-02 |
| Pay.WalletInsufficient | Your wallet balance is not enough for this order. | AC-PAY-009-01-03, AC-PAY-009-01-04 |
| Pay.RefundAfterCancel | We received your payment after the order was cancelled. It is being refunded to you. | BR-PAY-083 (on-screen and SMS text; the email uses message template Pay.RefundAfterCancel.CustomerNotification) |
| Pay.LcNotVerified | A shipment cannot be created until the letter of credit is verified. | AC-PAY-006-02-02 |
| Pay.MethodNotAllowed | The payment method you chose is no longer available for this order. Please choose another method. | AC-PAY-001-03-03 |
| Pay.RefundStatus | Your refund for order {order} is now {status}. | §13 (TRK event code, BR-PAY-160) |
| Pay.ReversalRecorded | The provider reversed payment {reference} for order {order}. | §13 (TRK event code, BR-PAY-160) |
| Pay.RefundAwaitingApproval | Refund {reference} for order {order} is waiting for your approval. | §13 (TRK event code, BR-PAY-160) |
| Pay.LcRejected | The letter of credit for order {order} was rejected or has expired. | §13 (TRK event code, BR-PAY-160) |
| Pay.EscrowReleaseFailed | The escrow release for order {order}, stage {stage}, failed. | §13 (TRK event code, BR-PAY-160) |
| Pay.ChargebackDeadline | The response deadline for chargeback {reference} is approaching. | §13 (TRK event code, BR-PAY-160) |
| Pay.FiscalSubmissionFailed | Submission of document {document} to the tax authority keeps failing. | §13 (TRK event code, BR-PAY-160) |
| Pay.ShiftDifference | Shift {shift} was closed with a cash difference of {difference}. | §13 (TRK event code, BR-PAY-160) |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Keys used by §13 are also PAY event codes registered with TRK-005 (BR-PAY-160); their text is the default content and {placeholders} are the event tokens (names Proposed).


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Connector SDK (PAY-024) | InitiatePayment, HandleCallback, QueryStatus, Reverse, Refund, GetStatement, Payout (IC-PAY-01) | All adapters | See §12.2 interface contract |
| Card gateways (PAY-002, PAY-031, PAY-032) | Hosted page redirect, callback, capture, refund, void | KTDA bank (not named), MPC gateway (not named) | Gateways not named |
| PayPal Commerce (PAY-003) | Bundled plugin | PayPal | Native |
| Mobile money (PAY-004, PAY-028–030) | Request to phone, callback, status query, reversal, refund, QR | Safaricom M-Pesa; TNM Mpamba; Airtel Money | APIs: Not stated in source |
| Bank (PAY-005, PAY-014) | Statement retrieval or file upload; payment notification | KTDA bank (INT-002), MPC banks | Banks not named |
| Escrow provider (PAY-007) | Open escrow, release stage, balance | Bank / PSP (not named, KG-07) | External |
| Tax authorities (PAY-025–027) | Submit invoice / credit note, receive fiscal number and QR | KRA eTIMS; MRA EIS | E-INV |
| Finance systems (PAY-014) | Daily reconciliation export | SAGE 200 (MPC, INT-006); KTDA ERP (INT-005) | Format not stated |
| SMS and email (PAY-013, PAY-016) | Send receipt and status messages | TRK-005 (IWorkflowMessageService owner; IC-TRK-04) over the CHN-005 SMS gateway | PAY sends no email or SMS of its own (BR-PAY-160) |
| Bank notifications (PAY-005) | Payment notification with reference and amount, API scope payments.notify | INT-001 API; bank adapters of INT-008 implement IC-PAY-01; account check IC-INT-04 | Banks not named (KG-04) |
| Checkout (internal) | Placement validators IC-PAY-03; group payment IC-PAY-02 with Confirm participant (IC-CHK-06); wallet reservation through the CAT-042 participant (IC-CAT-06 Reserve / Confirm / Release, WAL-01 option (b)) | CHK-004, CAT-042 | Group payment Proposed |
| Order totals (internal) | Wallet deduction provider IC-CAT-06 (Adjust, Reserve, Confirm, Release); GetWalletDeduction IC-PAY-10 for reconciliation | CAT-042, RPT | WAL-01 option (b) only |
| Notifications (internal) | IC-TRK-04 RegisterEventCode and SendEvent; IWorkflowMessageService (TRK-005 override) | TRK-005, TRK-006 | BR-PAY-160 |
| Refunds from returns and triggers (internal) | IC-PAY-05 RequestRefund; events Refund.Completed / Refund.Failed | RET-005 (single refund-trigger owner) | |
| Disputes (internal) | IC-RET-01 OpenCase, HasOpenCase | RET-007 | Called synchronously |
| Shipment guard (internal) | IC-ORD-11 providers | ORD-010, EGV-004 (and PAY LC) | ORD-010 hosts the override |
| Documents (internal) | Fiscal token provider IC-DOC-02; Invoice.Issued IC-ORD-04 | DOC-001, ORD-009 | |
| Seller rules and settlement (internal) | IC-SEL-02 GetRulesInForce / GetEligibleSplits; IC-SEL-03 PostReceivable / SubmitFiscal (IC-PAY-08, IC-PAY-09) | SEL-016, SEL-017, SEL-025 | |
| Credit and financing (internal) | IC-PAY-08 GetOpenReceivables, LockForOffer, Assign, ReleaseLock | CHK-016, FIN-002 | |
| Coverage areas (internal) | ServiceArea.LocationType read | LOG-004 | Rural / urban attribute not stated |
| Fraud score (internal) | Score, model version, reasons per transaction | AI-006 (service not named) | |
| Workflow (internal) | IC-PAY-06 ReleaseEscrowStage | ADM-002 | |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-PAY-01 | InitiatePayment | Order, amount, currency, customer phone or card token, idempotency key | Pending / Authorized / Successful / Failed, provider reference, AuthorizationTransactionId, CaptureTransactionId | Validation, provider unavailable, duplicate | IPaymentMethod.ProcessPaymentAsync (+ PostProcessPaymentAsync for Redirection) |
| IC-PAY-01 | HandleCallback | Provider payload on the adapter route | Verified result mapped to SM-PAY-01 | Signature invalid (rejected, audited) | Plugin controller deriving from Microsoft.AspNetCore.Mvc.Controller (pattern: PayPalCommerceWebhookController), on its own route (IRouteProvider), with no antiforgery attribute; verifies the signature, then calls IOrderProcessingService |
| IC-PAY-01 | QueryStatus | Provider reference | Current provider status | Unknown, timeout | IScheduleTask polling Pending transactions |
| IC-PAY-01 | Reverse | Transaction | Voided (if Authorized) or refunded | NotSupported | VoidAsync when Authorized, otherwise RefundAsync |
| IC-PAY-01 | Refund | Transaction, amount, lines | Processing / Completed / Failed, provider reference | NotSupported, exceeds limit | RefundAsync (SupportRefund / SupportPartiallyRefund) or offline methods |
| IC-PAY-01 | GetStatement | Provider, date | Statement lines | NotSupported (use upload) | IPaymentConnector (PAY-024), not IPaymentMethod |
| IC-PAY-01 | Payout | Recipient, account, amount, idempotency key | Sent / Succeeded / Failed, reason | NotSupported, rejected | IPaymentConnector (PAY-024), not IPaymentMethod |
| IC-PAY-02 | Group payment (provided to CHK-004; CHK names it IC-CHK-04) | Pay: CheckoutSession reference, total, share per seller, payment method (called before any sub-order is saved, BR-CHK-006); Confirm (as IC-CHK-06 participant): CheckoutSession reference, saved sub-order | Pay: one PaymentTransaction and one ProcessPaymentResult for the checkout; Confirm: PaymentTransactionOrder link written; each linked sub-order paid once (BR-PAY-014) | Method without group support; payment failed (all sub-orders stay Pending); Confirm error (CHK placement exception) | PAY service called once per checkout by the CHK-003 PlaceOrderAsync override, plus the PAY Confirm participant after each sub-order save; adapters declare a group-support flag; CheckoutSession reference passed in ProcessPaymentRequest.CustomValues (Proposed) |
| IC-PAY-03 | Placement validators (provided to CHK-004; CHK names it IC-CHK-02) | PlaceOrderContainer details, ProcessPaymentRequest, CheckoutSession | Pass, or refusal with message key (Pay.MethodNotAllowed, Pay.CheckoutRestricted); risk Flag results recorded after placement | — | Two PAY validators, called synchronously by the CHK-003 override before payment in the order of BR-CHK-005: routing (BR-PAY-001) and risk (BR-PAY-090) |
| IC-PAY-04 | Shipment guard provider — withdrawn | — | — | — | Replaced by IC-ORD-11, defined by the core host ORD-010 (BR-ORD-055); PAY-006 implements IC-ORD-11 for the LC check |
| IC-PAY-05 | RequestRefund (provided to RET-005; RET names it IC-RET-02) | Order ID (none for source type PlacementFailure), lines (OrderItem ID, quantity, amount), order-level parts (component Shipping, PaymentFee or CheckoutAttribute; amount), for PlacementFailure the CheckoutSession reference and the group PaymentTransaction ID, amount, reason, source type and source ID, idempotency key | PAY Refund ID and state (Initiated / awaiting approval); later module events Refund.Completed / Refund.Failed with the source reference | Exceeds refundable amount (BR-PAY-081, BR-PAY-085), duplicate key (returns the first Refund), caller not RET (BR-PAY-084), order ID missing for a source type other than PlacementFailure | PAY-016 refund service (DI); order-level parts and orderless requests Proposed (BR-PAY-085) |
| IC-PAY-06 | ReleaseEscrowStage (provided to ADM-002) | Order ID, stage, workflow case reference | Released / Refused with reason / Failed | Open dispute, stage out of order, provider error | PAY-007 service; same lock and checks as the release task (BR-PAY-031) |
| IC-PAY-07 | HasSuccessfulOrAuthorizedTransaction (provided to INV-004; INV names it IC-INV-02) | Order ID | true / false | — | Read service over PaymentTransaction and PaymentTransactionOrder; called inside ILocker key 'pay-order-{OrderId}' |
| IC-PAY-08 | Receivables (provided to CHK-016, FIN-002, SEL-025; SEL names PostReceivable IC-SEL-03) | PostReceivable: debtor, invoice, amount, due date; GetOpenReceivables: buyer (debtor) or payee (seller whose receivables FIN-002 lists, Proposed); LockForOffer / ReleaseLock / Assign: receivable, lender and remit-to details; AllocateExternal: Assigned receivable, amount, lender reference | Receivable ID; open receivables with open amounts; new receivable state (SM-PAY-09) | Not open, already offered or assigned, disputed; AllocateExternal on a receivable that is not Assigned or above the open amount | PAY-033 service (DI) |
| IC-PAY-09 | SubmitFiscal (provided to SEL-025; part of IC-SEL-03) | Commission invoice reference, country | FiscalSubmission ID and status (SM-PAY-07) | E-invoicing not enabled; rejected by authority | PAY-025 service; same queue and adapters as order invoices |
| IC-PAY-10 | GetWalletDeduction (provided to RPT and PAY-019 for wallet reconciliation; documents and order totals read the CAT-042 record, IC-CAT-06 GetOrderAdjustments) | Order ID | Wallet amount deducted from the order (sum of its Spend ledger entries), ledger references | — | PAY-009 read service over WalletLedgerEntry (WAL-01 option (b) only) |

IC-PAY-02 to IC-PAY-09 are operations PAY provides to other modules; where the other module already named the contract (IC-CHK-02, IC-CHK-04, IC-RET-02, IC-INV-02, IC-SEL-03) the PAY ID is the provider side of the same contract. IC-PAY-04 is withdrawn: the IShipmentService.InsertShipmentAsync host is the core feature ORD-010 and its provider contract is IC-ORD-11, which PAY-006 implements (OVR-REG, D-01). PAY consumes IC-RET-01 (OpenCase, HasOpenCase), IC-SEL-02, IC-DOC-02 (fiscal token provider; the wallet deduction is printed through the CAT-042 token, BR-CAT-033), IC-ORD-01 (OrderAcceptedEvent), IC-ORD-04 (Invoice.Issued), IC-PLT-02, IC-PLT-03, IC-SEC-01, IC-INT-04 and IC-TRK-04 (event codes, BR-PAY-160); PAY implements IC-CHK-02 (validators), IC-CHK-06 (placement participant: group payment Confirm only) and IC-CAT-06 (wallet deduction provider with Reserve / Confirm / Release, called by the CAT-042 participant, WAL-01 option (b)). Each adapter declares PaymentMethodType (Standard / Redirection / Button), a capability flag per operation, timeouts per provider (settings, defaults not stated) and its Reversed → native mapping. Operation signatures (C# interface) are produced at L2 build start and approved by the tech lead; this table fixes the operations and their mapping.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Payment.Authorized | OrderAuthorizedEvent (raised by MarkAsAuthorizedAsync) | ORD, RPT |
| Payment.Succeeded | OrderPaidEvent (raised by MarkOrderAsPaidAsync; native OrderPaid emails sent) | ORD, PAY-013 SMS (must not duplicate the email), PAY-025 invoice submission, RPT |
| Payment.Failed / Payment.Pending | None (PAY event only) | TRK notifications, console |
| Payment.Voided (from Authorized) | OrderVoidedEvent | ORD, RPT |
| Refund.Completed / Payment.Reversed (from Paid) | OrderRefundedEvent (raised by the native refund call) | RET, TRK, PAY-025 credit note, RPT |
| Refund.Requested / Approved / Failed | None (PAY events only) | Approval queue, TRK |
| Refund.Completed / Refund.Failed for RET requests (with RET source type and ID) | None (PAY events; Completed also follows the native refund call) | RET-005 consumer enqueues its status sync |
| Reconciliation.ExceptionRaised | None | Console (PAY-019) |
| Risk.Flagged (subject type customer or transaction, subject ID, rule) | None | CRM-010 consumer enqueues; the CRM task creates the referral (AC-CRM-010-01-02); console. SEC-005 exports RiskFlag records by its own scheduled task, not as a consumer |
| Shipment creation (LC guard) | IShipmentService.InsertShipmentAsync override and Admin OrderController.AddShipment [POST] filter, both owned by the core host ORD-010 (BR-ORD-055, OVR-REG); ShipmentCreatedEvent is notification only | PAY-006 LC check is one IC-ORD-11 provider with ORD-010 hold and EGV-004 issue check; first refusal stops the insert |
| Escrow triggers | ShipmentSentEvent, ShipmentDeliveredEvent (native); OrderAcceptedEvent (ORD, IC-ORD-01: OrderId, AcceptedOnUtc, AcceptedBy, Deemed) | PAY-007 consumer enqueues a release job; the scheduled task releases |
| Invoice.Issued (ORD, IC-ORD-04) | None (ORD event) | PAY-025 consumer enqueues the fiscal submission |
| Listing.Withdrawn (CAT, BR-CAT-015) | None (CAT event) | PAY-007 consumer enqueues a job that lists escrow-held orders containing the product for finance; no automatic action |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Callback and status query arrive together | PAY-004, PAY-011 | Refunds, captures and callbacks for one order run under ILocker.PerformActionWithLockAsync keyed 'pay-order-{OrderId}' (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 §6.4); PaymentTransaction carries its own row version (plugin table, no core change); the second writer re-reads and applies BR-PAY-012, so the order is marked paid once |
| Callback arrives after INV-004 cancelled the order | PAY-004 | Transaction SuccessfulAfterCancel (SM-PAY-01); console exception and refund; the order is not re-opened automatically (Proposed) |
| Two refunds requested on the same order at once | PAY-016 | BR-PAY-081 is checked inside the refund service under the same ILocker key 'pay-order-{OrderId}'; the second request fails if the limit would be exceeded |
| Payment-window timeout and success callback at the same time | PAY-004, INV-004 | Both take the lock 'pay-order-{OrderId}'; whichever runs second re-reads: the callback sees Cancelled and goes to SuccessfulAfterCancel; the timeout sees Paid or Authorized and does not cancel (BR-PAY-013) |
| Duplicate order placement across web nodes | PAY-012 | Native lock is per host; the PLT-027 idempotency key protects across nodes |
| Provider timeout during InitiatePayment | All adapters | Transaction stays Pending; QueryStatus resolves it; no new charge without the same idempotency key |
| Wallet spend at placement (WAL-01 option (b)) while another order or a top-up changes the balance | PAY-009 | The IC-CAT-06 Reserve, Confirm and Release operations, called by the CAT-042 placement participant, take ILocker key 'pay-wallet-{WalletId}'; Reserve checks Balance minus HeldAmount; the second writer re-reads (BR-PAY-040) |
| Callback for a group transaction while CHK-004 is still saving sub-orders | PAY-011 | The callback and each Confirm take 'pay-checkout-{CheckoutSessionId}'; the callback marks paid only linked sub-orders; a later Confirm sees Successful and marks its sub-order paid once (AC-PAY-011-04-07) |
| Group payment callback while a sub-order is being cancelled | PAY-011, INV-004 | The callback takes 'pay-checkout-{CheckoutSessionId}' and then 'pay-order-{OrderId}' for each sub-order in ascending OrderId; INV-004 takes 'pay-order-{OrderId}' and reads IC-PAY-07, which includes group transactions; whichever runs second re-reads (BR-PAY-013, BR-PAY-014) |
| Escrow release from the task and from an ADM-002 step at once | PAY-007 | Both use 'pay-order-{OrderId}'; the second re-reads the stage and finds it Releasing or Released (BR-PAY-031) |
| Two lenders offered the same receivable | PAY-033, FIN-002 | LockForOffer checks the state Open and saves Offered under the Receivable row version; the second call fails (SM-PAY-09) |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Payment successful | Shopper | Email (native OrderPaid) + SMS, both through TRK-005 | PAY-013 |
| Payment failed / pending beyond wait time | Shopper | Email + SMS with retry link through TRK-005, event codes Pay.Status.Failed / Pay.Status.Pending (BR-PAY-160) | PAY-011 (Proposed channel) |
| Reversal recorded | Finance staff | Email / admin notification through TRK-005, event code Pay.ReversalRecorded | PAY-004 |
| Refund status change | Shopper | Email (native OrderRefunded on completion; for SuccessfulAfterCancel the PAY template below instead) + SMS through TRK-005, event code Pay.RefundStatus | PAY-016 |
| Refund completed for a payment received after cancellation | Shopper | Email: message template Pay.RefundAfterCancel.CustomerNotification (new, installed by the PAY plugin, sent through IWorkflowMessageService, override owned by TRK-005); SMS text from locale key Pay.RefundAfterCancel | PAY-004, PAY-016 |
| Refund awaiting approval | Approver | Admin notification through TRK-005, event code Pay.RefundAwaitingApproval | PAY-016 |
| LC rejected or expired | Buyer; export staff | Email through TRK-005, event code Pay.LcRejected | PAY-006 |
| Escrow release failed | Finance staff | Admin notification through TRK-005, event code Pay.EscrowReleaseFailed | PAY-007 |
| Chargeback deadline approaching | Finance staff | Email through TRK-005, event code Pay.ChargebackDeadline | PAY-017 |
| E-invoice submission failed persistently | Finance staff | Email through TRK-005, event code Pay.FiscalSubmissionFailed | PAY-025 |
| Shift difference flagged | Finance staff | Admin notification through TRK-005, event code Pay.ShiftDifference | PAY-034 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Reconciliation report and daily file | PAY-014 | REQ-MPC-FR-137, FR-149 |
| Tax report and filing files | PAY-021 | REQ-MPC-FR-147, FR-315 |
| Payment transactions log with exceptions | PAY-019 | REQ-MPC-FR-144 |
| Ageing of receivables | PAY-033 | D |
| Chargebacks | PAY-017 | REQ-MPC-FR-142 |
| Disbursement batch results | PAY-022 | FC-M13-013 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-PAY-001 | Payment transaction status change | System / user | PaymentTransaction | old status, new status, reason, provider reference |
| AUD-PAY-002 | Manual payment intervention (mark paid, capture, void, re-query, cheque match) | Finance staff | PaymentTransaction, Order | action, reason, evidence reference, before/after PaymentStatus |
| AUD-PAY-003 | Configuration change (fee schedule, risk rule, routing rule, tax/commission rule) | Finance / Risk / Administrator | Rule entity | old values, new values, effective date |
| AUD-PAY-004 | Reversal or chargeback outcome | System / Finance staff | PaymentTransaction, Chargeback | amount, provider reference, outcome |
| AUD-PAY-005 | Reconciliation exception resolved | Finance staff | ReconciliationLine | class, resolution note |
| AUD-PAY-006 | LC verification / rejection (shipment refusals are AUD-ORD-008) | Finance staff / system | LetterOfCredit; order (shipment attempt) | status, verifier, documents; for a refusal: provider, message key, acting user |
| AUD-PAY-007 | Escrow release sent / failed | System / Finance staff | EscrowStage | stage, amount, provider result |
| AUD-PAY-008 | Refund requested / approved / completed | Finance staff / approver / system | Refund | amount, lines, requester, approver, provider reference |
| AUD-PAY-009 | Shift closed | Outlet staff | OutletShift | expected, counted, difference |
| AUD-PAY-010 | Callback rejected (signature invalid) | System | Adapter | payload hash, source, reason |
| AUD-PAY-011 | Receivable offered, assigned, released or allocated from a lender report (FIN-002) | System (FIN call) / Finance staff | Receivable | old state, new state, lender, financing reference |

Business audit events AUD-PAY-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id; old and new entity values are captured automatically by the SEC-004 IRepository<> decorator, so every PAY write goes through IRepository<> (no direct INopDataProvider writes). The native activity log is not used as the audit trail. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-PAY-001 | No card data stored or logged; PCI-DSS scope limited to hosted payment pages and tokens. | REQ-MPC-FR-129, FR-148; SEC-003; BR-PAY-011 | AC-PAY-002-01-01; test note T-PAY-05 |
| NFR-PAY-002 | Every provider callback is authenticated (signature, token or IP allow-list as the provider supports) before it can change a status. | REQ-MPC-FR-330 ("secure APIs") | AC-PAY-024-01-03; AUD-PAY-010 |
| NFR-PAY-003 | Payment data encrypted in transit; encryption at rest is a database/hosting function (external). | REQ-MPC-FR-148 (roll-up note) | AC-PAY-024-01-04; hosting check (project service) |
| NFR-PAY-004 | No duplicate charge under retry (idempotency). | REQ-MPC-FR-135; BR-PAY-012 | AC-PAY-012-01-01, 012-01-02; test note T-PAY-02 |
| NFR-PAY-005 | All payment, refund and rule actions are audited (NFR-X-003). | REQ-MPC-FR-144, FR-245, FR-320 | §14.2 audit events |
| NFR-PAY-006 | Response-time and availability targets for payment flows: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-PAY-001 | P1 | — | |
| PRD-PAY-002 | P1 | PRD-PAY-024 | PRD-PAY-031, PRD-PAY-032 |
| PRD-PAY-003 | P1 | — | |
| PRD-PAY-004 | P1 | PRD-PAY-024, PRD-INV-004 | PRD-PAY-028, PRD-PAY-029, PRD-PAY-030 |
| PRD-PAY-005 | P1 | PRD-PAY-024 | |
| PRD-PAY-006 | P1 | PRD-ORD-010 | |
| PRD-PAY-007 | P1 | — | |
| PRD-PAY-008 | P1 | PRD-PAY-024 | |
| PRD-PAY-009 | P1 | — | |
| PRD-PAY-010 | P1 | PRD-PAY-024 | PRD-SEL-017, PRD-CHK-004 |
| PRD-PAY-011 | P1 | — | |
| PRD-PAY-012 | P1 | — | |
| PRD-PAY-013 | P1 | PRD-CHN-005 | |
| PRD-PAY-014 | P1 | PRD-PAY-024 | |
| PRD-PAY-015 | P1 | — | |
| PRD-PAY-016 | P1 | PRD-PAY-024 | PRD-RET-005, PRD-SVC-004 |
| PRD-PAY-017 | P1 | — | |
| PRD-PAY-018 | P1 | — | |
| PRD-PAY-019 | P1 | — | |
| PRD-PAY-020 | P1 | — | |
| PRD-PAY-021 | P1 | — | PRD-SEL-025 |
| PRD-PAY-022 | P3 | PRD-PAY-024 | |
| PRD-PAY-023 | P1 | — | |
| PRD-PAY-024 | P1 | — | PRD-SEL-017, PRD-PAY-002, PRD-PAY-004, PRD-PAY-005, PRD-PAY-008, PRD-PAY-010, PRD-PAY-014, PRD-PAY-016, PRD-PAY-022, PRD-PAY-035 |
| PRD-PAY-025 | P1 | PRD-ORD-009 | PRD-SEL-025, PRD-PAY-026, PRD-PAY-027 |
| PRD-PAY-026 | P1 | PRD-PAY-025 | |
| PRD-PAY-027 | P1 | PRD-PAY-025 | |
| PRD-PAY-028 | P1 | PRD-PAY-004 | |
| PRD-PAY-029 | P1 | PRD-PAY-004 | |
| PRD-PAY-030 | P1 | PRD-PAY-004 | |
| PRD-PAY-031 | P1 | PRD-PAY-002 | |
| PRD-PAY-032 | P1 | PRD-PAY-002 | |
| PRD-PAY-033 | P1 | — | PRD-SEL-025, PRD-CHK-016 |
| PRD-PAY-034 | P1 | — | |
| PRD-PAY-035 | P2 | PRD-PAY-024 | |
| PRD-PAY-036 | P2 | PRD-RET-007 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-PAY-01 | Each adapter is tested against the provider sandbox, including success, failure, timeout, duplicate callback and reversal. |
| T-PAY-02 | Idempotency: replay the same initiation and the same callback; assert one charge and one MarkOrderAsPaidAsync call, including after a partial refund. |
| T-PAY-03 | Rounding: partial refunds and splits sum exactly to the original amounts under BR-PAY-052. |
| T-PAY-04 | Segregation of duties: the requester cannot approve (BR-PAY-080); native refund buttons are intercepted (BR-PAY-082). |
| T-PAY-05 | Card data: scan logs and database for card numbers after test payments (BR-PAY-011), including the obsolete Order card fields kept by 5.00 for the upgrade (AC-PAY-002-01-07). |
| T-PAY-06 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-PAY-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
| T-PAY-08 | Group payment: one charge for a multi-seller checkout; every sub-order marked paid once; failure leaves all Pending; replayed callback marks nothing twice; a sub-order cancelled before success goes to the SuccessfulAfterCancel path for its share. |
| T-PAY-09 | Shipment guard host: each provider (LC, ORD-010 hold, EGV-004) refuses alone; a provider error refuses; admin, seller and API shipment creation are all refused; with all providers allowing, the native insert runs. |
| T-PAY-10 | Refund requests from RET: duplicate idempotency key returns the first Refund; a caller other than RET is refused; Refund.Completed / Failed carry the source reference. |
| T-PAY-11 | Group payment Confirm: a synchronous Paid result and an asynchronous callback arriving before, between and after sub-order saves each mark every sub-order paid exactly once; a share without a saved sub-order appears as a console exception. |
| T-PAY-12 | PAY notifications: every §13 event code is registered at installation; a send with an unregistered code is refused; a TRK-006 opt-out suppresses the channel. |
