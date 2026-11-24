# L2 Module PRD — CHK: Cart and checkout

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | CHK — Cart and checkout |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets shoppers and business buyers collect items in a cart and complete a purchase safely: the checkout steps, guest or login rules per client, server-side validation before the order is placed, one checkout for items from several sellers, per-line delivery or pickup, delivery slots, addresses that work without street names, protection against lost and duplicate orders, legal notices and acknowledgements per country, cart restriction rules, pickup codes, orders placed by outlet agents, B2B buying on account, quick order and purchase approval, and the order confirmation.

**In scope**

- Cart, mini cart and save for later (CHK-001)
- Checkout steps, guest or login rule per client, order summary, secure totals (CHK-002), validation before placement (CHK-003)
- Multi-seller split into one order per seller within one checkout (CHK-004) and per-line delivery or pickup (CHK-005)
- Delivery slot and instructions (CHK-006), structured address capture (CHK-007), estimated delivery at checkout (CHK-014)
- Checkout reference, resume and duplicate-order protection (CHK-008); country legal notices and acknowledgements (CHK-009)
- Minimum order and fee thresholds (CHK-010), cart restriction rules (CHK-011), pickup code or QR (CHK-012)
- Assisted checkout by outlet agents (CHK-013); checkout attributes (CHK-015)
- B2B on-account buying with credit limits (CHK-016), quick order and bulk add (CHK-017), purchase approval (CHK-018)
- Order confirmation page and message (CHK-019)

**Not in this module**

| Item | Where it is |
|---|---|
| Payment methods, routing rules, payment execution, retries and receipts | PAY module (PRD-PAY-001, PAY-011, PAY-013); CHK calls PAY at placement |
| Risk rules and account restriction flags | PAY module (PRD-PAY-018); CHK-003 and CHK-011 enforce them at placement |
| Recording the payment taken by an agent, receipts and cash-up | PAY module (PRD-PAY-034); CHK-013 creates the order |
| Receivables, statements and ageing for on-account buyers | PAY module (PRD-PAY-033) |
| Order stages, seller task processing, cancellations, holds, invoices | ORD module (PRD-ORD-002, ORD-004, ORD-005, ORD-009, ORD-010) |
| Delivery fee calculation and estimated delivery time calculation | LOG module (PRD-LOG-002, LOG-005); CHK-014 displays the result |
| Pickup points and outlets, serviceability rules | LOG module (PRD-LOG-003, LOG-004) |
| Stock holds and the unpaid-order timeout per payment method | INV module (PRD-INV-004, decision INV-HOLD); INV-004 cart-hold check is a provider to the CHK-003 cart override |
| Company accounts and company roles (buyer, approver, company administrator) | IAM module (PRD-IAM-022) |
| Agent role, outlet assignment, scoping and the checks on the acting session (IAM agent filter on Place order for customer, BR-IAM-130) | IAM module (PRD-IAM-026, IAM-008); CHK-013 owns the order-to-agent and outlet record (AssistedOrder) |
| Handover at the outlet and the proof of collection | LOG module (PRD-LOG-012); CHK-012 issues the code, checks it and owns attempts and locking (IC-CHK-09) |
| Address coordinates (map pin storage) | LOG module (PRD-LOG-015, AddressGeo, BR-LOG-140); CHK-007 captures the pin |
| Order total and price calculation overrides (IOrderTotalCalculationService, IPriceCalculationService) | CAT module (PRD-CAT-042, decision OVR-REG) |
| Refund triggers after cancellation or failure | RET module (PRD-RET-005, IC-RET-04); PAY-016 moves the money |
| Notification channels and templates (SMS, email) | TRK module (PRD-TRK-005) and CHN module (PRD-CHN-005) |
| Acceptance records of terms and policies; policy versions | IAM module (PRD-IAM-016, IC-IAM-05) and MKT module (PRD-MKT-008, IC-MKT-03), decision ONE-RECORD; CHK-009 links each acceptance to its order |
| Data-protection consent texts and the country profile entity (CountryPrivacyProfile) | SEC module (PRD-SEC-012); CHK-009 owns the e-transactions fields of that entity and shows the notices at checkout |
| Idempotency middleware and row-version columns on core tables | PLT module (PRD-PLT-027) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-CHK-001 | Shopping cart | B2B + B2C | P1 | Code-level | Theme/view override + Custom plugin | Core (always on) | | |
| PRD-CHK-002 | Checkout | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CHK-003 | Checkout validation | B2B + B2C | P1 | Code-level | Custom plugin (DI override) | Core (always on) | | |
| PRD-CHK-004 | Multi-seller split checkout | B2B + B2C | P1 | Code-level | Custom plugin (provider under OVR-REG) | Marketplace pack | PRD-PAY-010, PRD-SEL-017, PRD-CHK-003 | WF-ENG, PAY-DIRECT / LIC-01 |
| PRD-CHK-005 | Fulfilment method per line | B2B + B2C | P1 | Code-level | Core modification | Postal and logistics pack | | |
| PRD-CHK-006 | Delivery slot and instructions | B2B + B2C | P1 | Code-level | Custom plugin | Postal and logistics pack | | |
| PRD-CHK-007 | Structured address capture | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-CHK-008 | Checkout resilience and idempotency | B2B + B2C | P1 | Code-level | Custom plugin; Core modification (conditional) | Core (always on) | | |
| PRD-CHK-009 | E-transactions consumer controls | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CHK-010 | Minimum order and fee thresholds | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CHK-011 | Cart restriction rules | B2B + B2C | P1 | Code-level | Custom plugin | Commerce extensions pack | | |
| PRD-CHK-012 | Pickup code / QR | B2B + B2C | P1 | Code-level | Custom plugin | Postal and logistics pack | PRD-CHN-005 | |
| PRD-CHK-013 | Assisted checkout | B2B + B2C | P1 | Code-level | Custom plugin | Assisted service pack | | |
| PRD-CHK-014 | Estimated delivery at checkout | B2B + B2C | P1 | Code-level | Theme/view override | Postal and logistics pack | PRD-LOG-005 | |
| PRD-CHK-015 | Checkout attributes | B2B + B2C | P1 | Configuration | None | Core (always on) | | PH-INF |
| PRD-CHK-016 | B2B on-account payment and credit limits | B2B | P1 | Code-level | Custom plugin | B2B trade pack | PRD-IAM-022, PRD-PAY-033 | PH-INF, PAID-STUB |
| PRD-CHK-017 | B2B quick order and bulk add | B2B | P1 | Licensed plugin | None | B2B trade pack | | PH-INF |
| PRD-CHK-018 | B2B purchase approval | B2B | P1 | Code-level | Custom plugin | B2B trade pack | PRD-ADM-002, PRD-IAM-022 | PH-INF, WF-ENG |
| PRD-CHK-019 | Order confirmation | B2B + B2C | P1 | Configuration | None | Core (always on) | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Fills the cart, checks out, chooses delivery or pickup per line, picks a slot, acknowledges notices, receives the confirmation and pickup code | Guests / Registered (native) |
| Business buyer | Buys on account within a credit limit, enters purchase-order numbers, uses quick order, submits orders for approval | Registered + B2B company role (IAM-022) |
| Company approver | Approves or rejects colleague orders above the company threshold | Company role "approver" (IAM-022; name to match IAM-022) |
| Seller | Receives a separate sub-order and task list for own items | Vendors (native) + IAM-007 |
| Agent (outlet staff) | Places orders for walk-in customers in an acting session (IAM-026); pickup codes are checked by CHK-012 and parcels handed over in the LOG-012 step | Role system name "Agent" (BR-IAM-050) |
| Finance staff | Approves and maintains credit accounts, limits and payment terms | Role system name "Finance" (BR-IAM-050) |
| Client administrator | Sets checkout settings, cart rules, delivery slots, legal notices, address fields and checkout attributes | Administrators (native) |
| Courier | Reads delivery instructions, slot and address pin (through LOG screens) | LOG module |
| Payment, logistics and notification modules (system) | PAY executes payment; LOG supplies delivery estimates; TRK sends messages | Internal services |
| Provider modules (system) | Add cart checks (CAT, INV-004, ADM-005, SVC, ORD-027), a line subtotal adjuster (MKT-002), placement participants (ADM-005, MKT-001, CHK-006, CHK-016, CAT-042, FIN-004, PAY-011, ORD-005) and order-action guards (ORD-010) to the CHK overrides | Internal services (contracts IC-CHK-01, 05, 06, 07, 08) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Configuration.ManageSettings (native) | Configuration | Edit checkout, cart, order and address settings (CHK-001, 002, 007, 008, 010, 019) | Administrators |
| Catalog.CheckoutAttributesView / Catalog.CheckoutAttributesCreateEditDelete (native) | Catalog | View and edit checkout attributes (CHK-006 instructions, CHK-015) | Administrators |
| Customers.CustomersImpersonation (native) | Customers | Start Place order for customer (acting session) for a customer (CHK-013); the single impersonation filter owned by IAM-026 (BR-IAM-130, decision SINGLE-FILTER) allows Agents only for customers of their own outlet | Administrators; Agent (role pack mapping, BR-IAM-053) |
| Checkout.Core.Rules.View | Configuration | View cart restriction rules, delivery slot definitions and legal notice profiles | Administrators |
| Checkout.Core.Rules.CreateEditDelete | Configuration | Create, change, enable and disable cart restriction rules, delivery slot definitions and legal notices (audited) | Administrators |
| Checkout.Core.AssistedOrders.View | Orders | View assisted orders filtered by agent and outlet | Administrators; Agent (own outlet only, IAM-008) |
| Checkout.Core.Credit.View | Customers | View credit accounts, limits, terms and credit used | Finance |
| Checkout.Core.Credit.CreateEditDelete | Customers | Approve, change, suspend and close credit accounts (audited) | Finance |
| Checkout.Core.Exceptions.View | Orders | View checkout exceptions (split placement failures, unsent confirmations) | Administrators |

CHK permissions are declared in a CHK plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix Checkout.Core and the 5.00 view / create-edit-delete split (StandardPermission naming unchanged in 5.00.1); Category is from the native set. Native permissions are reused where they exist (Configuration.ManageSettings, Catalog.CheckoutAttributes*). Default roles are given by role system name exactly as in the product role catalogue BR-IAM-050 (Agent, Finance); a catalogue role that is missing is created by the IAM plugin (BR-IAM-050); CHK relies on no other start-up role creation. Company roles that approve B2B orders (CHK-018) are storefront company roles kept in IAM plugin tables (BR-IAM-120), not admin permissions. Assisted checkout uses the native Place order for customer action (Admin CustomerController.Impersonate); agents also need Security.AccessAdminPanel and Identity.Core.AssistedService.Access (both mapped by IAM-026). That action has one filter, owned by IAM-026 (BR-IAM-130, decision SINGLE-FILTER): it allows Administrators, Agents for customers of their own outlet (CHK-013) and account managers for their assigned customers (CRM-015 rule provider); CHK adds no filter of its own. Pickup-code verification is done in the LOG-012 handover step, which calls CHK-012 (IC-CHK-09); CHK declares no verification permission. All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-CHK-PERM-01 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHK-PERM-02 | **Given** a user without Catalog.CheckoutAttributesView / Catalog.CheckoutAttributesCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHK-PERM-03 | **Given** a user without Customers.CustomersImpersonation (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHK-PERM-04 | **Given** a user without Checkout.Core.Rules.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHK-PERM-05 | **Given** a user without Checkout.Core.Rules.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHK-PERM-06 | **Given** a user without Checkout.Core.AssistedOrders.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHK-PERM-07 | **Given** a user without Checkout.Core.Credit.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHK-PERM-08 | **Given** a user without Checkout.Core.Credit.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHK-PERM-09 | **Given** a user without Checkout.Core.Exceptions.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-CHK-001 | Persistent cart, mini cart, editable quantities, cart item editing; 4.90 multiple custom wishlists with 'move to wishlist' modal after adding to wishlist. \| 5.00: new ShoppingCartType.Stash is used only by the vendor cart filter (items of non-selected vendors), not as a customer-facing save-for-later list. Abandoned-cart reminder emails are new (ReminderSettings.AbandonedCartEnabled). \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Orders/ShoppingCartType.cs:21; Libraries/Nop.Services/Orders/ShoppingCartService.cs:1980-2009; Libraries/Nop.Core/Domain/Reminders/ReminderSettings.cs:13; Libraries/Nop.Services/Reminders/ProcessAbandonedCartsTask.cs; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/ShoppingCartSettings.cs:ShoppingCartSettings.MiniShoppingCartEnabled, AllowCartItemEditing, AllowMultipleWishlist; src/Libraries/Nop.Core/Domain/Orders/ShoppingCartItem.cs:ShoppingCartItem.CustomWishlistId; src/Presentation/Nop.Web/Controllers/ShoppingCartController.cs (showMoveToWishlistModal); PG STF-04, STF-24 | 'Save for later' action from the cart (move cart line to a saved list and back). View override + small custom plugin using CustomWishlist. | Theme/view override + Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-002 | Multi-step or one-page checkout (address, shipping, payment, confirm); guest checkout on/off; terms of service on cart or confirm page. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.AnonymousCheckoutAllowed, OnePageCheckoutEnabled, TermsOfServiceOnShoppingCartPage, TermsOfServiceOnOrderConfirmPage, DisableBillingAddressCheckoutStep; PG CHK-01, CHK-18 | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-003 | Cart and order-placement warnings recheck stock, published state, ACL/store, quantities, prices, min order, payment form validation. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Orders/ShoppingCartService.cs:GetShoppingCartWarningsAsync, GetStandardWarningsAsync; src/Libraries/Nop.Services/Orders/OrderProcessingService.cs:OrderProcessingService.PlaceOrderAsync; src/Libraries/Nop.Services/Payments/IPaymentMethod.cs:IPaymentMethod.ValidatePaymentFormAsync | Fraud warning signs at placement. Custom plugin (order-placing validation hook / risk rules; see PRD-PAY-018). CHK-003 is the core host of the IOrderProcessingService.PlaceOrderAsync override (DI, startup Order ≥ 3000; placement lock and minimum-interval check once per checkout, BR-CHK-006) and of the IShoppingCartService override (decision OVR-REG). | Custom plugin (DI override) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-004 | Single order may contain items of several vendors; vendor sees own items; vendor email per order; per-vendor PDF invoice. \| NEW in 5.00: vendor cart filter. With ShoppingCartSettings.VendorEnabled the customer picks one vendor in the cart; other vendors' items move to the Stash cart type; with VendorRequired, checkout is refused while the cart holds several vendors and none is chosen; after the order is placed the selection is reset and stashed items return to the cart. Result: one order and one payment per seller, checked out sequentially. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Orders/ShoppingCartSettings.cs:131 VendorEnabled, :136 VendorRequired; Libraries/Nop.Core/Domain/Orders/ShoppingCartType.cs:21 Stash; Libraries/Nop.Services/Orders/ShoppingCartService.cs:1221-1227 (checkout blocked with >1 vendor and no vendor chosen), :1980-2009 SetShoppingCartVendorAsync (other vendors' items moved to Stash); Libraries/Nop.Services/Orders/OrderProcessingService.cs:1639 (vendor selection reset after order, stashed items return); Presentation/Nop.Web/Controllers/ShoppingCartController.cs:1274-1289 ChangeVendorCart; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Common/IPdfService.cs:IPdfService.PrintOrderToPdfAsync(vendor); message template OrderPlaced.VendorNotification; src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:HasAccessToOrderAsync | Separate sub-orders and task lists per seller: order-splitter provider IC-CHK-11 to the CHK-003 IOrderProcessingService host (the override itself is owned by core CHK-003). Calling base.PlaceOrderAsync once per sub-order does not work (the base method loads and clears the whole cart, and the placement interval lock refuses the second sub-order); the host reproduces the placement lock once per checkout. Do not split in an OrderPlacedEvent consumer. Paying once for several sub-orders needs PAY group payment; until then single-seller carts only (decision SPLIT-PAY). 5.00 delta: the SPLIT-PAY interim mode (single-seller orders) is now native configuration (VendorEnabled + VendorRequired); the order-splitter provider is still needed only for one checkout / one payment across several sellers. | Custom plugin (provider under OVR-REG) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-005 | Pickup vs delivery chosen once per order (Order.PickupInStore, PickupAddressId). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/Order.cs:Order.PickupInStore, PickupAddressId; src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.AllowPickupInStore | Per-line fulfilment choice. Requires changes to checkout flow, shipping calculation and order model. | Core modification | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-006 | Delivery instructions can be captured as a text checkout attribute. \| NEW in 5.00: customer can choose a desired delivery DATE per shipping method at the shipping-method step (ShippingSettings.AllowCustomerToChooseDeliveryDate, DeliveryDateRangeDays); stored on Order.DesiredDeliveryDateUtc and shown in order details and admin order page. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:126 AllowCustomerToChooseDeliveryDate, :131 DeliveryDateRangeDays; Presentation/Nop.Web/Factories/CheckoutModelFactory.cs:450-482 (dates offered from today + ShippingOption.TransitDays); Presentation/Nop.Web/Views/Checkout/_DesiredDeliveryDate.cshtml; Libraries/Nop.Core/Domain/Orders/Order.cs:44 DesiredDeliveryDateUtc; Libraries/Nop.Services/Orders/OrderProcessingService.cs:792-796; Presentation/Nop.Web/Areas/Admin/Views/Order/_OrderDetails.BillingShipping.cshtml:634; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/CheckoutAttribute.cs:CheckoutAttribute.TextPrompt | Delivery TIME window (slot) selection and slot capacity are not native: 5.00 offers whole dates only, without capacity. Delivery instructions remain a text checkout attribute. Custom plugin + view (can build on Order.DesiredDeliveryDateUtc for the date part). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-007 | Configurable address fields (enable/require) and admin-defined custom address attributes (e.g. landmark, address nickname, PO box / virtual post box). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Common/AddressSettings.cs:AddressSettings.StreetAddressRequired, ZipPostalCodeEnabled; src/Libraries/Nop.Core/Domain/Common/AddressAttribute.cs:AddressAttribute; src/Libraries/Nop.Core/Domain/Common/Address.cs:Address.CustomAttributes | Map-pin capture and landmark-based validation. Custom plugin + address view override. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-008 | 4.90 adds PlaceOrderWithLock (per-customer mutex + MinimumOrderPlacementInterval) to prevent duplicate orders; re-post payment for unpaid orders. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.PlaceOrderWithLock, MinimumOrderPlacementInterval; src/Libraries/Nop.Services/Orders/OrderProcessingService.cs:OrderProcessingService.PlaceOrderAsync (named Mutex); src/Libraries/Nop.Core/Domain/Payments/PaymentSettings.cs:PaymentSettings.AllowRePostingPayments, RegenerateOrderGuidInterval | Base in 5.00.1 (unchanged from 4.90.8): OrderGuid reuse (PaymentSettings.RegenerateOrderGuidInterval), OrderSettings.PlaceOrderWithLock, MinimumOrderPlacementInterval, RePostPayment for unpaid redirect orders. Build: pre-order reference shown before payment for non-redirect methods; core change only if the custom order number must exist before the Order insert. PlaceOrderWithLock uses a host-local named Mutex; with more than one web node, cross-node duplicate protection relies on the distributed-cache marker and the PLT-027 idempotency key. | Custom plugin; Core modification (conditional) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-009 | Terms-of-service checkbox, GDPR consents, topics/policy pages. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.TermsOfServiceOnOrderConfirmPage; src/Libraries/Nop.Core/Domain/Gdpr/GdprSettings.cs:GdprSettings; src/Libraries/Nop.Core/Domain/Gdpr/GdprConsent.cs:GdprConsent | Country-configurable legal notices/confirmations at defined checkout points. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-010 | Minimum order subtotal/total; free shipping over X (also zeroes pickup fee, since the pickup fee is computed inside the free-shipping check); rate tables by order subtotal range. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.MinOrderSubtotalAmount, MinOrderTotalAmount; src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.FreeShippingOverXEnabled, FreeShippingOverXValue; src/Libraries/Nop.Services/Orders/OrderTotalCalculationService.cs (PickupFee inside IsFreeShippingAsync check); src/Plugins/Nop.Plugin.Shipping.FixedByWeightByTotal (OrderSubtotalFrom/To) | None for stated example. Limitation: one free-over-X threshold applies to both delivery and pickup; separate thresholds would need code. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-011 | Product ACL by customer role, store limits, required products, min/max quantity, allowed quantities. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.SubjectToAcl, RequireOtherProducts, OrderMinimumQuantity, OrderMaximumQuantity; src/Libraries/Nop.Services/Orders/ShoppingCartService.cs:GetShoppingCartWarningsAsync | Combination-blocking rules and pickup-only items. Custom plugin (cart warning override). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-012 | Shipment 'ready for pickup' status and notification. \| Re-verified in 5.00.1: no QR/barcode library referenced in any project (package list); GoogleAuthenticator package is used for MFA only. \|\| 5.00.1 evidence: Plugins/Nop.Plugin.MultiFactorAuth.GoogleAuthenticator/Nop.Plugin.MultiFactorAuth.GoogleAuthenticator.csproj; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/Shipment.cs:Shipment.ReadyForPickupDateUtc; message template ShipmentReadyForPickup.CustomerNotification | Pickup code/QR generation and verification. No QR/barcode library in source. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-CHK-013 | Admin 'Place order (impersonate)' for a customer; offline payment method (Check/Money order). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.cs:Impersonate; src/Plugins/Nop.Plugin.Payments.CheckMoneyOrder; PG ADM-S05 | Outlet-agent role scoped to outlet, recording how the customer paid. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-014 | Transit days from rate records and pickup points produce an estimated delivery date in the cart/product shipping estimate; product delivery date ranges. \| NEW in 5.00: when AllowCustomerToChooseDeliveryDate is on and the shipping option has TransitDays, the shipping-method step lists selectable dates starting at today + transit days; the chosen date is stored on the order. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:126 AllowCustomerToChooseDeliveryDate, :131 DeliveryDateRangeDays; Presentation/Nop.Web/Factories/CheckoutModelFactory.cs:450-482 (dates offered from today + ShippingOption.TransitDays); Presentation/Nop.Web/Views/Checkout/_DesiredDeliveryDate.cshtml; Libraries/Nop.Core/Domain/Orders/Order.cs:44 DesiredDeliveryDateUtc; Libraries/Nop.Services/Orders/OrderProcessingService.cs:792-796; Presentation/Nop.Web/Areas/Admin/Views/Order/_OrderDetails.BillingShipping.cshtml:634; 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Factories/ShoppingCartModelFactory.cs (TransitDays → deliveryDateFormat in estimate); src/Plugins/Nop.Plugin.Pickup.PickupInStore/Domain/StorePickupPoint.cs:StorePickupPoint.TransitDays; src/Libraries/Nop.Core/Domain/Shipping/DeliveryDate.cs:DeliveryDate | Partial: the earliest date appears only as a "desired delivery date" selector (only for shipping options with TransitDays and only when the setting is on); it is not labelled as an expected date, and no expected collection date is shown for pickup points at checkout. View override + model event remains. | Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-015 | Checkout attributes (text, dropdown, etc.) with price adjustment, tax category, conditions, validation. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/CheckoutAttribute.cs:CheckoutAttribute.TextPrompt, ShippableProductRequired, TaxCategoryId; src/Libraries/Nop.Core/Domain/Orders/CheckoutAttributeValue.cs:CheckoutAttributeValue.PriceAdjustment | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHK-016 | Offline payment method (Check/Money order) usable as 'on account'; customer roles. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Payments.CheckMoneyOrder; PG LEG-01 (purchase-order payment leftovers only) | Credit limit, payment terms, invoice due dates, approval of B2B accounts. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-CHK-017 | 4.90 multiple named wishlists can serve as saved order lists. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/ShoppingCartSettings.cs:ShoppingCartSettings.AllowMultipleWishlist; src/Libraries/Nop.Core/Domain/Orders/CustomWishlist.cs:CustomWishlist; Plugin evaluation (nopStation Bulk Order) | SKU entry, paste and spreadsheet upload to cart → nopStation Bulk Order plugin (candidate; version not stated on listing; 5.00 support not verifiable from source; confirm with vendor). Build fallback if not available. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: bulk add not in source; plugin evidence is the plugin evaluation only |
| PRD-CHK-018 | None (no company/buyer hierarchy). \| 5.00: bundled Misc.PunchOut (cXML) connects to buyer e-procurement systems (e.g. SAP Ariba, Coupa), where approvals happen outside nopCommerce. No company/buyer hierarchy or approval workflow in 5.00.1 core. \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Misc.PunchOut/plugin.json; Plugins/Nop.Plugin.Misc.PunchOut/Services/PunchOutService.cs; 4.90 evidence re-verified present in 5.00.1: No company/approval entity in src/Libraries/Nop.Core/Domain | Company accounts, approval thresholds, approver workflow before order placement. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-CHK-019 | Order completed page with order number; order-placed email to customer; optional PDF invoice attachment. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.DisableOrderCompletedPage, AttachPdfInvoiceToOrderPlacedEmail; message template OrderPlaced.CustomerNotification | None (SMS confirmation, if required, depends on the SMS integration in other areas). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-CHK-001 Shopping cart

| Item | Value |
|---|---|
| Description (baseline) | Customers add, change and remove items in a cart that is remembered between visits, see a mini cart and can save items for later. |
| Why it matters | Customers can collect several items, review them and buy in one go. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Theme/view override + Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-001-01 | As a shopper, I want to add, change and remove items in a cart and see a mini cart, so that I can collect several items and buy them in one go. | D; REQ-KTDA-CHK-001; REQ-MPC-FR-101 | Ready |
| US-CHK-001-02 | As a registered shopper, I want my cart to be kept between visits and devices, so that I do not lose my selection. | REQ-MPC-FR-102 | Ready |
| US-CHK-001-03 | As a shopper, I want to move a cart line to a saved-for-later list and back, so that I can keep items without buying them now. | D; REQ-MPC-FR-123 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-001-01-01 | US-CHK-001-01 | **Given** a product is published, in stock and ShoppingCartSettings.AllowCartItemEditing is on, **when** the shopper adds it, changes its quantity or removes it, **then** the cart shows the change and the totals are recalculated from server-side prices; quantity limits (minimum, maximum, allowed quantities) give the native cart warnings. | REQ-MPC-FR-101; REQ-KTDA-CHK-001; FIT (ShoppingCartService.AddToCartAsync, UpdateShoppingCartItemAsync) |
| AC-CHK-001-01-02 | US-CHK-001-01 | **Given** ShoppingCartSettings.MiniShoppingCartEnabled is on, **when** an item is added, **then** the mini cart shows the number of items and the subtotal. | D; FIT |
| AC-CHK-001-02-01 | US-CHK-001-02 | **Given** a registered shopper has items in the cart, **when** the shopper signs out and later signs in on another device, **then** the same items and quantities are in the cart (ShoppingCartItem is stored per customer). | REQ-MPC-FR-102; FIT |
| AC-CHK-001-02-02 | US-CHK-001-02 | **Given** a guest has items in the cart, **when** the guest signs in or registers, **then** the guest cart is merged into the account cart (native MigrateShoppingCartAsync). | D; FIT |
| AC-CHK-001-03-01 | US-CHK-001-03 | **Given** save for later is enabled for the client (requires ShoppingCartSettings.AllowMultipleWishlist), **when** the shopper selects Save for later on a cart line, **then** the line leaves the cart and appears in the shopper's saved-for-later list (a native CustomWishlist named by locale key Chk.SavedForLater); the cart totals are recalculated. | REQ-MPC-FR-123; FIT (CustomWishlist, ShoppingCartItem.CustomWishlistId) |
| AC-CHK-001-03-02 | US-CHK-001-03 | **Given** an item is in the saved-for-later list, **when** the shopper selects Move to cart, **then** the item is added through AddToCartAsync with stock and price checks; if a warning is returned the item stays in the list and the warning is shown. | REQ-MPC-FR-123; BR-CHK-001 |

**Business rules applied:** BR-CHK-001 (§8.1).


### 7.2 PRD-CHK-002 Checkout

| Item | Value |
|---|---|
| Description (baseline) | The steps to complete a purchase: address, delivery, payment and review. Each client chooses whether guests can buy without an account or must log in first; customers accept the terms and see a correct, secure total. |
| Why it matters | A clear checkout means fewer abandoned purchases. (KTDA allows guest buying; Malawi Post requires login.) |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: ONE-RECORD |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-002-01 | As a shopper, I want to go through address, delivery, payment and review steps, so that I can complete my purchase. | D; REQ-KTDA-CHK-003; REQ-MPC-UX-001 | Ready; conditions: ONE-RECORD |
| US-CHK-002-02 | As a client administrator, I want to choose whether guests may buy without an account or must sign in before payment, so that checkout follows our policy. | D; REQ-KTDA-CUS-006; REQ-MPC-FR-125 | Ready; conditions: ONE-RECORD |
| US-CHK-002-03 | As a shopper, I want to see a full order summary before I pay, so that I know exactly what I pay for. | REQ-MPC-FR-107 | Ready; conditions: ONE-RECORD |
| US-CHK-002-04 | As a shopper, I want a secure checkout where prices and totals cannot be changed from my browser, so that I pay the correct amount. | REQ-KTDA-CHK-002; REQ-MPC-FR-121 | Ready; conditions: ONE-RECORD |
| US-CHK-002-05 | As a shopper, I want to accept the terms of service before ordering, so that the sale is on agreed terms. | D | Ready; conditions: ONE-RECORD |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-002-01-01 | US-CHK-002-01 | **Given** OrderSettings.OnePageCheckoutEnabled is set for the store, **when** the shopper starts checkout, **then** the steps billing address, shipping address (if any item is shippable), shipping method, payment method, payment information and confirm are shown in that order, on separate pages or on one page; DisableBillingAddressCheckoutStep is honoured. | D; FIT (CheckoutController) |
| AC-CHK-002-02-01 | US-CHK-002-02 | **Given** OrderSettings.AnonymousCheckoutAllowed is on (KTDA configuration), **when** a guest starts checkout, **then** the guest completes checkout without creating an account, giving an email address on the billing address step. | REQ-KTDA-CUS-006; FIT |
| AC-CHK-002-02-02 | US-CHK-002-02 | **Given** OrderSettings.AnonymousCheckoutAllowed is off (Malawi Post configuration), **when** a guest who has browsed and filled a cart selects Checkout, **then** the sign-in / registration page is shown; no address, shipping or payment step is reachable; after sign-in or registration the cart is kept and checkout continues. | REQ-MPC-FR-125; FIT (CheckoutController.Index Challenge; MigrateShoppingCartAsync) |
| AC-CHK-002-02-03 | US-CHK-002-02 | **Given** OrderSettings.AnonymousCheckoutAllowed is off, **when** a guest posts directly to any checkout action, including ConfirmOrder, **then** the request is challenged; no order is created and no payment is executed. | REQ-MPC-FR-125; FIT |
| AC-CHK-002-03-01 | US-CHK-002-03 | **Given** the shopper is on the confirm step, **when** the page is shown, **then** it lists every item with quantity and unit price, the subtotal, discounts, tax, payment fee, delivery or pickup fee and the order total, before payment is executed; the returns-policy acknowledgement is shown by CHK-009. | REQ-MPC-FR-107; FIT (confirm step precedes ProcessPaymentAsync) |
| AC-CHK-002-04-01 | US-CHK-002-04 | **Given** checkout is used, **when** any checkout page is requested or posted, **then** the request is served over HTTPS and every checkout POST must carry a valid antiforgery token, otherwise it is rejected. | REQ-KTDA-CHK-002; REQ-MPC-FR-121; FIT (CheckoutController [AutoValidateAntiforgeryToken]; BaseController HttpsRequirement) |
| AC-CHK-002-04-02 | US-CHK-002-04 | **Given** a client sends a changed price or total with the confirm request, **when** the order is placed, **then** line prices and the order total are recalculated on the server from the cart and catalogue and the sent value is ignored (PrepareAndValidateTotalsAsync sets ProcessPaymentRequest.OrderTotal) (BR-CHK-003). | REQ-MPC-FR-121; FIT |
| AC-CHK-002-05-01 | US-CHK-002-05 | **Given** OrderSettings.TermsOfServiceOnOrderConfirmPage or TermsOfServiceOnShoppingCartPage is on, **when** the shopper confirms without ticking the terms box, **then** the order is not placed and message Chk.TermsRequired is shown; the check is made on the server by the CHK-009 action filter, because the native check is in the browser only; when the box is ticked and the order is placed, the acceptance of the terms topic is recorded through IAM IC-IAM-05 RecordAcceptance (channel checkout) and linked to the order (BR-CHK-014). | D; FIT (Confirm.cshtml client-side check; ConfirmOrder has no server check); ONE-RECORD (Proposed) |
| AC-CHK-002-01-02 | US-CHK-002-01 | **Given** a registered shopper has a default delivery address set in IAM-014 (CustomerPreference.DefaultAddressId) that is still in the address book and allowed for the store's countries, **when** the shopper reaches the billing and shipping address steps, **then** that address is pre-selected on both steps (the native page pre-selects only Customer.BillingAddressId); the shopper can still choose another address. | see IAM-014 (REQ-MPC-FR-005); FIT (CheckoutModelFactory pre-selects BillingAddressId); Proposed |
| AC-CHK-002-01-03 | US-CHK-002-01 | **Given** the shopper is on any step of the multi-page checkout, **when** the step is shown and the shopper submits it with a required field empty or invalid, **then** the checkout progress indicator shows the current step and the steps still to come (native CheckoutProgress component); the step is shown again with the values already entered kept and a message next to each failed field (server-side ModelState validation, asp-validation-for); no step already completed has to be entered again. | Inference from REQ-KTDA-CHK-003 (easy-to-use checkout: the requirement states no measure; these observable behaviours are Proposed); FIT (CheckoutProgressViewComponent; CheckoutController ModelState checks; _CreateOrUpdateAddress.cshtml) |

**Business rules applied:** BR-CHK-002; BR-CHK-003; BR-CHK-014 (§8.1).


### 7.3 PRD-CHK-003 Checkout validation

| Item | Value |
|---|---|
| Description (baseline) | Just before the order is placed, the system rechecks stock, prices, whether the customer may buy the items, whether the chosen payment method is valid, and any fraud warning signs. |
| Why it matters | Prevents orders for items that are gone or wrongly priced. |
| Who benefits | Shoppers; client staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (DI override) |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, CART-FAILCLOSE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-003-01 | As a shopper, I want the order to be refused if stock or price changed since I added the item, so that I never pay for something that is gone or wrongly priced. | REQ-MPC-FR-103 | Ready; conditions: OVR-REG, CART-FAILCLOSE |
| US-CHK-003-02 | As a member of client staff, I want the payment method and fraud warning signs to be checked again just before the order is placed, so that invalid or risky orders are stopped. | D; FC-M03-004 | Ready; conditions: OVR-REG, CART-FAILCLOSE |
| US-CHK-003-03 | Technical enabler. As a member of the platform team, I want every cart and item check of every module to run in one IShoppingCartService override with provider slots, so that the cart service is overridden once and no module check is lost (decision OVR-REG). | OVR-REG; FIT; Proposed | Ready; conditions: OVR-REG, CART-FAILCLOSE |
| US-CHK-003-04 | Technical enabler. As a member of the platform team, I want every module that must act inside order placement or inside shipment status actions to plug into one IOrderProcessingService override hosted by this core checkout feature, so that order processing is overridden once and the module rules still apply (decision OVR-REG). | OVR-REG; FIT; Proposed | Ready; conditions: OVR-REG, CART-FAILCLOSE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-003-01-01 | US-CHK-003-01 | **Given** the stock of an item is below the cart quantity at placement, **when** the shopper confirms the order, **then** the order is not placed, the native stock warning is shown and no payment is initiated (cart warnings run before GetProcessPaymentResultAsync). | REQ-MPC-FR-103; FIT (PreparePlaceOrderDetailsAsync) |
| AC-CHK-003-01-02 | US-CHK-003-01 | **Given** the price of an item changed after the confirm page was shown, **when** the shopper confirms the order, **then** the order is not placed, the confirm page is shown again with the new total and message Chk.PriceChanged; the shopper can confirm again at the new total (BR-CHK-004). | REQ-MPC-FR-103; Proposed (total comparison) |
| AC-CHK-003-01-03 | US-CHK-003-01 | **Given** an item was unpublished, deleted, removed from the store or is no longer allowed by ACL for the customer, **when** the shopper confirms the order, **then** the order is not placed and the native cart warning is shown. | REQ-MPC-FR-103; FIT (GetShoppingCartItemWarningsAsync) |
| AC-CHK-003-02-01 | US-CHK-003-02 | **Given** the selected payment method is inactive or no longer allowed by the PAY routing rules (BR-PAY-001), **when** the shopper confirms the order, **then** the order is not placed and the shopper is returned to the payment method step: an inactive method gives message Chk.PaymentMethodInvalid; a method no longer allowed is refused by the PAY routing validator (IC-PAY-03, consumed as IC-CHK-02) with message Pay.MethodNotAllowed; native placement checks only that the method is active. | D; FC-M03-004; FIT (GetProcessPaymentResultAsync checks IsPluginActive only) |
| AC-CHK-003-02-02 | US-CHK-003-02 | **Given** a PAY-018 risk rule with action Block matches the placement, **when** the shopper confirms the order, **then** the order is not placed and message Pay.CheckoutRestricted is shown; with action Flag the order is placed and the flag is recorded (and an ORD-010 hold is created if the rule says so). | D; FC-M03-004; see PAY-018 (REQ-MPC-FR-143) |
| AC-CHK-003-02-03 | US-CHK-003-02 | **Given** several checks fail at once, **when** the order is validated, **then** checks run in the order stock and availability, price, buyer eligibility (ACL, restrictions, CHK-011 rules, CHK-018 approval), payment method, fraud signals; the first failure stops placement and its message key is shown. | FC-M03-004; Proposed (order) |
| AC-CHK-003-03-01 | US-CHK-003-03 | **Given** cart check providers are registered through IC-CHK-01 (CAT quantity, call-for-price, over-maximum, slot-hold and service-area checks; INV-004 holds; ADM-005 eligibility and quota; SVC rental availability; EGV-001 workflow check; CHK-011 cart rules; ORD-027 sample limits), **when** GetShoppingCartItemWarningsAsync or GetShoppingCartWarningsAsync runs (add to cart, cart page, checkout steps, and the re-validation inside PlaceOrderAsync), **then** the single CHK-003 override runs the native checks first and then every provider in its registered order, and returns all warnings; the item or cart is refused if any warning remains. | OVR-REG; FIT (ShoppingCartService.GetShoppingCartItemWarningsAsync, GetShoppingCartWarningsAsync are public virtual; PreparePlaceOrderDetailsAsync re-runs them); Proposed |
| AC-CHK-003-03-02 | US-CHK-003-03 | **Given** a provider is registered as the replacer of a named native warning (CAT: Products.CallForPrice for a cart line created from an accepted Misc.RFQ quote, and ShoppingCart.MaximumQuantity for a line with an approved over-maximum request; INV-004: ShoppingCart.OutOfStock and ShoppingCart.QuantityExceedsStock recalculated with other customers' holds), **when** the standard warnings are produced, **then** the CHK-003 override of the protected GetStandardWarningsAsync produces the native warnings with their resource keys, so the registered replacer can drop or replace exactly that warning by key; every other provider can only add warnings; no warning is matched on its text (BR-CHK-015). | OVR-REG; FIT (GetStandardWarningsAsync is protected virtual and returns plain strings; Products.CallForPrice 378-381, ShoppingCart.MaximumQuantity 406-408, stock 427-497 in 5.00.1); Proposed |
| AC-CHK-003-03-03 | US-CHK-003-03 | **Given** a provider throws an error while it checks an item, **when** the warnings are collected, **then** the item is refused with message Chk.CartCheckUnavailable and the error is logged; the check fails closed so no unchecked item can be ordered. | Proposed |
| AC-CHK-003-03-04 | US-CHK-003-03 | **Given** MKT-002 is registered as the line subtotal adjuster (IC-CHK-05), **when** GetSubTotalAsync runs for a cart line (cart page, order totals, order placement), **then** the override calls the native method and then the adjuster, and the same adjusted subtotal and discount amount are used on all three paths; at most one adjuster is registered for the product (BR-CHK-015). | OVR-REG; FIT (OrderTotalCalculationService and OrderProcessingService call IShoppingCartService.GetSubTotalAsync) |
| AC-CHK-003-02-04 | US-CHK-003-02 | **Given** the shipping address changed after the delivery step, or a seller's coverage (LOG-004) no longer includes it, **when** the shopper confirms the order, **then** the LOG-004 placement validator (IC-CHK-02) refuses the order with message Log.SellerAreaNotCovered and no payment is initiated. | see LOG-004 (REQ-MPC-FR-069); Proposed |
| AC-CHK-003-04-01 | US-CHK-003-04 | **Given** placement participants are registered through IC-CHK-06 (ADM-005 quota under ILocker key 'adm-quota-{quotaId}'; MKT-001 limited-use discounts under 'mkt-discount-{DiscountId}' (IC-MKT-04); CHK-006 delivery window; CHK-016 credit; CAT-042 order-total adjustments, which reserves through its IC-CAT-06 providers (PAY-009 wallet under WAL-01 option (b)); FIN-004 subsidy budget under 'fin-scheme-{SchemeId}'), **when** the shopper confirms, **then** after the IC-CHK-02 validators and before payment, each participant reserves what it needs under its own lock key; if any reservation fails, the earlier reservations are released, the order is not placed and the participant's message is shown (BR-CHK-020). | OVR-REG; FIT (ILocker.PerformActionWithLockAsync); Proposed |
| AC-CHK-003-04-02 | US-CHK-003-04 | **Given** participants hold reservations and payment succeeds, **when** each sub-order is saved, **then** each participant confirms its reservation for that sub-order before OrderPlacedEvent is published (ADM-005 records quota use; MKT-001 ends its reservation, because native placement already writes the DiscountUsageHistory row; CAT-042 writes its OrderTotalAdjustment rows and calls its providers' Confirm; FIN-004 consumes the subsidy; PAY-011 links the sub-order to the group transaction; ORD-005 creates the SellerTask in state New); if payment fails, every reservation is released. | OVR-REG; Proposed |
| AC-CHK-003-04-03 | US-CHK-003-04 | **Given** an order-action guard is registered through IC-CHK-07 (ORD-010 hold) and a hold is Active on the order, **when** anyone calls ShipAsync, ReadyForPickupAsync or DeliverAsync for a shipment of that order (admin, seller endpoint, TRK-002 tracking, LOG-012 handover, API), **then** the CHK-003 override calls the guards before the native method; the refusal raises an error carrying the guard message (Ord.OrderOnHold), the native method is not run and the admin page shows the message through its error notification. | OVR-REG; FIT (IOrderProcessingService.ShipAsync / ReadyForPickupAsync / DeliverAsync; Admin OrderController.SetAsShipped catches the exception and calls ErrorNotificationAsync) |
| AC-CHK-003-04-04 | US-CHK-003-04 | **Given** cancellation participants are registered through IC-CHK-08 (CHK-006 window release, CHK-012 code revocation), **when** an order is cancelled through CancelOrderAsync by any path (ORD-004, INV-004 timeout, admin), **then** the native method runs first; then each participant runs; a participant error is logged and listed in the checkout exceptions list, and the cancellation stands. | OVR-REG; FIT (CancelOrderAsync); Proposed |
| AC-CHK-003-04-05 | US-CHK-003-04 | **Given** no order splitter is registered (the Marketplace pack is off, or CHK-004 is not installed), **when** the shopper confirms a cart, **then** the CHK-003 placement host places exactly one order with the native sequence of BR-CHK-006 (lock and interval check, validators, Reserve, one payment, save, Confirm, OrderPlacedEvent); no behaviour of the host depends on an optional pack. | Proposed; OVR-REG; D-01 |

**Business rules applied:** BR-CHK-004; BR-CHK-005; BR-CHK-015; BR-CHK-006; BR-CHK-020; BR-CHK-021 (§8.1).


### 7.4 PRD-CHK-004 Multi-seller split checkout

| Item | Value |
|---|---|
| Description (baseline) | When a cart holds items from several sellers, one checkout creates a separate sub-order and task list for each seller. |
| Why it matters | Customers pay once while each seller handles their own part. |
| Who benefits | Shoppers; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (provider under OVR-REG) |
| Depends on | PRD-PAY-010, PRD-SEL-017, PRD-CHK-003 |
| Status | On hold: WF-ENG, PAY-DIRECT / LIC-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-004-01 | As a shopper, I want to check out and pay once for a cart with items from several sellers, so that buying from many sellers is as simple as buying from one. | D; REQ-MPC-FR-110 | On hold: WF-ENG, PAY-DIRECT / LIC-01 |
| US-CHK-004-02 | As a seller, I want a separate sub-order and task list for my own items, so that I fulfil only my part. | D; REQ-MPC-FR-110 | On hold: WF-ENG, PAY-DIRECT / LIC-01 |
| US-CHK-004-03 | As a member of finance staff, I want order-level amounts to be shared out exactly between the sub-orders, so that totals and settlements reconcile. | Proposed | On hold: WF-ENG, PAY-DIRECT / LIC-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-004-01-01 | US-CHK-004-01 | **Given** the Marketplace pack is on and the cart holds items from N sellers (Product.VendorId; VendorId 0 = the client's own items, counted as one seller), **when** the order is placed, **then** the CHK-004 order splitter (IC-CHK-11) returns one group per seller and the CHK-003 placement host creates N native orders, one per seller, each with its own OrderGuid and custom order number, all linked to one CheckoutSession (CHK-008); the confirmation page shows the checkout reference and every sub-order. | REQ-MPC-FR-110; FIT (IOrderProcessingService.PlaceOrderAsync override, BR-CHK-006) |
| AC-CHK-004-01-02 | US-CHK-004-01 | **Given** N sub-orders are being placed, **when** payment is processed, **then** one payment is initiated once, before any sub-order is saved (BR-CHK-006), for the checkout total with the CheckoutSession reference as merchant reference and the share of each seller (IC-CHK-04 = IC-PAY-02); the one payment result is applied by native placement to every sub-order saved; after each sub-order is saved the PAY placement participant Confirm (IC-CHK-06) links it to the group transaction; on failure all sub-orders stay with PaymentStatus Pending and retry applies to the whole checkout (BR-PAY-014). | REQ-MPC-FR-110; Proposed; see PAY-011 (group payment, BR-PAY-014 Proposed) |
| AC-CHK-004-01-03 | US-CHK-004-01 | **Given** order-level amounts exist (delivery fee, payment fee, order discount, checkout-attribute fee, reward points, gift cards), **when** sub-orders are created, **then** each amount is allocated to sub-orders by BR-CHK-007, and the sub-order totals add up exactly to the total shown on the confirm page. | Proposed |
| AC-CHK-004-01-04 | US-CHK-004-01 | **Given** OrderSettings.PlaceOrderWithLock is on, **when** the split placement runs, **then** the native per-customer mutex is taken once for the whole checkout and the MinimumOrderPlacementInterval cache key is set once after all sub-orders are saved, so the second sub-order is not refused by the interval check. | FIT (OrderProcessingService.PlaceOrderAsync 1681-1720) |
| AC-CHK-004-01-05 | US-CHK-004-01 | **Given** payment succeeded and saving a later sub-order fails, **when** the error occurs, **then** sub-orders already saved are kept, the CheckoutSession becomes PlacementException, an exception appears for Checkout.Core.Exceptions.View holders and is audited (AUD-CHK-007), and the shopper sees message Chk.SplitPlacementFailed with the checkout reference; any refund decided by staff for the share of a sub-order that was not saved is raised through RET-005 (IC-RET-04, source type PlacementFailure, with the CheckoutSession reference, the payment transaction and the share), never directly to PAY. | Proposed; RET-005 single refund-trigger owner |
| AC-CHK-004-02-01 | US-CHK-004-02 | **Given** a vendor user signs in to the admin area, **when** the vendor opens the order list, **then** only sub-orders that contain the vendor's products are listed (native HasAccessToOrderAsync), and each has a seller task list in state New (ORD-005, created by the split). | REQ-MPC-FR-110; FIT |
| AC-CHK-004-02-02 | US-CHK-004-02 | **Given** a sub-order is created for a seller, **when** placement completes, **then** the native OrderPlaced.VendorNotification is sent to that seller for that sub-order only. | D; FIT |
| AC-CHK-004-01-06 | US-CHK-004-01 | **Given** the cart holds items from one seller only, **when** the order is placed, **then** one order is created and linked to the CheckoutSession; no allocation is needed. | D |
| AC-CHK-004-03-01 | US-CHK-004-03 | **Given** an allocation leaves a rounding remainder, **when** sub-order amounts are calculated, **then** the remainder in the currency's minor unit goes to the sub-order with the largest subtotal, so the parts sum exactly (BR-CHK-007). | Proposed |
| AC-CHK-004-01-07 | US-CHK-004-01 | **Given** the Marketplace pack is on, the cart holds items from more than one seller and no active payment method of the store declares group support (IC-CHK-04, provided by PAY as IC-PAY-02), **when** the shopper opens the cart or checkout, **then** the CHK-003 cart override returns message Chk.MultiSellerNotSupported, checkout cannot be confirmed, and the shopper can remove items until one seller remains; when some methods declare group support, only those are offered for that checkout (BR-CHK-022). | Proposed (decision SPLIT-PAY); see PAY-011 (group payment) |
| AC-CHK-004-01-08 | US-CHK-004-01 | **Given** the Marketplace pack is on (decision CART-500), **when** a configuration pack is applied to a store or a store is set up, **then** ShoppingCartSettings.VendorEnabled and ShoppingCartSettings.VendorRequired are off for every store: both keys are in the CHK key catalogue with the fixed value off, so pack validation refuses another value; with them on, the native warning ShoppingCart.SelectVendorToCheckout would block a mixed-seller cart before the CHK-004 splitter runs and the items of other sellers would be moved to the Stash cart type (BR-CHK-023). | CART-500; FIT (ShoppingCartSettings.cs:131,136; ShoppingCartService.cs:1221-1227, 1980-2009; install default off, InstallRequiredData.cs:1856-1857) |
| AC-CHK-004-01-09 | US-CHK-004-01 | **Given** VendorEnabled is off, **when** a shopper with items of several sellers opens the cart and goes to checkout, **then** no vendor selector is shown, no item is moved to the Stash cart type and the one cart reaches the CHK-004 split placement (or, while BR-CHK-022 applies, the Chk.MultiSellerNotSupported warning). | CART-500; FIT (ShoppingCartModelFactory.cs:997-1001 and ShoppingCartService.cs:604, 1617 act only with VendorEnabled) |

**Business rules applied:** BR-CHK-006; BR-CHK-007; BR-CHK-008; BR-CHK-022; BR-CHK-023 (§8.1).


### 7.5 PRD-CHK-005 Fulfilment method per line

| Item | Value |
|---|---|
| Description (baseline) | For each item in the order, the customer chooses home delivery or pickup. |
| Why it matters | Flexibility when items come from different places. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Core modification |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-005-01 | As a shopper, I want to choose home delivery or pickup at an outlet for each item, so that I can collect some items and have others delivered. | D; REQ-MPC-FR-104 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-005-01-01 | US-CHK-005-01 | **Given** ShippingSettings.AllowPickupInStore is on, outlets exist (LOG-003) and an item can be picked up, **when** the shopper is on the shipping step, **then** each cart line offers Delivery or Pickup at a selected outlet; the choice is stored per line (CartLineFulfilment). | REQ-MPC-FR-104 |
| AC-CHK-005-01-02 | US-CHK-005-01 | **Given** lines have different fulfilment choices, **when** the shipping step and totals are calculated, **then** delivery options and fees are calculated for the delivery lines and pickup fees for each outlet group; the confirm page shows each group separately. | REQ-MPC-FR-104; core modification (L1 §6.3) |
| AC-CHK-005-01-03 | US-CHK-005-01 | **Given** the order is placed, **when** sub-orders are created, **then** lines are grouped by seller and fulfilment choice and each group becomes its own sub-order (CHK-004), so native Order.PickupInStore and PickupAddressId remain per order. | Proposed; FIT (Order.PickupInStore) |
| AC-CHK-005-01-04 | US-CHK-005-01 | **Given** an outlet does not serve an item or is closed on the expected collection date (LOG-003, LOG-004), **when** the shopper chooses pickup for that line, **then** the outlet is not offered for that line ("where available"). | REQ-MPC-FR-104 |
| AC-CHK-005-01-05 | US-CHK-005-01 | **Given** an item is pickup-only (CHK-011), **when** the shopper chooses fulfilment for its line, **then** Delivery is not offered for that line. | see CHK-011 (REQ-MPC-FR-111) |
| AC-CHK-005-01-06 | US-CHK-005-01 | **Given** the shopper has a preferred pickup point in IAM-015 (CustomerPreference.PreferredPickupPointId) that is open and serves the line, **when** the shopper chooses Pickup for a line, **then** that outlet is pre-selected (the native page pre-selects only the last selected pickup point attribute); if it does not serve the line, no outlet is pre-selected. | see IAM-015 (REQ-MPC-FR-005); FIT (CheckoutModelFactory SelectedPickupPointAttribute); Proposed |

**Business rules applied:** BR-CHK-009 (§8.1).


### 7.6 PRD-CHK-006 Delivery slot and instructions

| Item | Value |
|---|---|
| Description (baseline) | Customers choose a preferred delivery time window and add delivery instructions. |
| Why it matters | Fewer failed deliveries. |
| Who benefits | Shoppers; couriers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-006-01 | As a shopper, I want to choose a preferred delivery time window where the service supports it, so that I am at home when the courier comes. | REQ-MPC-FR-106 | Ready |
| US-CHK-006-02 | As a shopper, I want to add delivery instructions, so that the courier can find me. | REQ-MPC-FR-106 | Ready |
| US-CHK-006-03 | As a client administrator, I want to define delivery windows and their capacity per delivery service and area, so that we only offer windows we can serve. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-006-03-01 | US-CHK-006-03 | **Given** the administrator defines windows (day, start, end, capacity) for a delivery service and area, **when** the definition is saved, **then** the windows become available for that service and area; the change is audited (AUD-CHK-001). | D |
| AC-CHK-006-01-01 | US-CHK-006-01 | **Given** windows exist for the chosen delivery service and the shipping address area, **when** the shopper is on the shipping method step, **then** the windows with remaining capacity are listed and the shopper selects one; the selection is reserved at placement (SM-CHK-02). | REQ-MPC-FR-106 |
| AC-CHK-006-01-02 | US-CHK-006-01 | **Given** no windows are defined for the chosen service, **when** the shopper is on the shipping method step, **then** no window selection is shown and checkout continues ("where supported"). | REQ-MPC-FR-106 |
| AC-CHK-006-01-03 | US-CHK-006-01 | **Given** the last place in a window is taken by another order first, **when** the shopper confirms, **then** the order is not placed, message Chk.SlotFull is shown and the shopper chooses another window (capacity is reserved under lock by the CHK-006 placement participant, IC-CHK-06, BR-CHK-010). | Proposed |
| AC-CHK-006-02-01 | US-CHK-006-02 | **Given** a checkout attribute "Delivery instructions" (text box) is configured, **when** the shopper enters instructions, **then** the text is stored on the order (Order.CheckoutAttributeDescription) and shown on the order details used by staff, seller and courier. | REQ-MPC-FR-106; FIT (CheckoutAttribute) |
| AC-CHK-006-01-04 | US-CHK-006-01 | **Given** an order with a reserved window is cancelled, **when** the cancellation completes, **then** the window place is released by the CHK-006 cancellation participant (IC-CHK-08). | Proposed |
| AC-CHK-006-01-05 | US-CHK-006-01 | **Given** ShippingSettings.AllowCustomerToChooseDeliveryDate is on (install and 5.00 upgrade default on) and the chosen shipping option has TransitDays, **when** the shopper is on the shipping method step, **then** the native desired-date list offers DeliveryDateRangeDays dates starting at today plus the transit days; the chosen date is stored as Order.DesiredDeliveryDateUtc and shown on the order details and the admin order page. | VER-500; FIT (ShippingSettings.cs:126,131; CheckoutModelFactory.cs:450-482; Order.cs:44; OrderProcessingService.cs:790-797) |
| AC-CHK-006-01-06 | US-CHK-006-01 | **Given** windows exist for the chosen delivery service and area and the native date list is shown, **when** the shopper picks a date, **then** the CHK-006 window list shows only the windows of that date with remaining capacity, and the booking date (DeliverySlotBooking.Date) is the native desired date; CHK builds no date picker of its own. | VER-500; Proposed |
| AC-CHK-006-01-07 | US-CHK-006-01 | **Given** a checkout is split into several sub-orders (CHK-004) and the shopper chose a date, **when** the sub-orders are saved, **then** the CHK-003 placement host reads the desired date once and sets it on every sub-order, because native SaveOrderDetailsAsync copies it only to the first order saved and then clears the customer attribute (BR-CHK-006). | VER-500; FIT (OrderProcessingService.cs:790-797); Proposed |
| AC-CHK-006-03-02 | US-CHK-006-03 | **Given** the client offers no choice of delivery date for a store, **when** the configuration pack is applied, **then** ShippingSettings.AllowCustomerToChooseDeliveryDate is set off explicitly, because its install default is on and any shipping option with TransitDays would otherwise show the date list. | VER-500; FIT (InstallRequiredData.cs:1950-1951) |

**Business rules applied:** BR-CHK-010 (§8.1).


### 7.7 PRD-CHK-007 Structured address capture

| Item | Value |
|---|---|
| Description (baseline) | Address forms that suit places without formal street addresses: landmarks, map pin, a nickname for the address, with checks. A post-office box field (including virtual post box) can be enabled by the client. |
| Why it matters | Couriers can find customers in areas with no street numbers. |
| Who benefits | Shoppers; couriers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-007-01 | As a shopper, I want to give a landmark, a map pin and a name for my address, so that couriers can find me where there are no street numbers. | D; REQ-MPC-FR-113 | Ready |
| US-CHK-007-02 | As a client administrator, I want to switch on a post-office box field, including a virtual post box, so that customers can use their box address. | D | Ready |
| US-CHK-007-03 | As a courier, I want to see the pin and landmark of the delivery address, so that I find the customer first time. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-007-01-01 | US-CHK-007-01 | **Given** address attributes Landmark (text) and Address name (text) are configured and marked required or optional per client, **when** the shopper saves an address, **then** the values are validated and stored in Address.CustomAttributes and appear on the order addresses. | REQ-MPC-FR-113; FIT (AddressAttribute) |
| AC-CHK-007-01-02 | US-CHK-007-01 | **Given** map pin is enabled for the client, **when** the shopper places a pin on the map, **then** latitude and longitude are passed to LOG-015 and stored in its AddressGeo table keyed by AddressId with source "pin" (BR-LOG-140); CHK stores no coordinates of its own. | REQ-MPC-FR-113; Proposed |
| AC-CHK-007-01-03 | US-CHK-007-01 | **Given** the client rule requires at least one locator (street address, landmark or pin), **when** the shopper saves an address with none of them, **then** the address is not saved and message Chk.AddressLocatorRequired is shown. | REQ-MPC-FR-113; Proposed (rule) |
| AC-CHK-007-02-01 | US-CHK-007-02 | **Given** a PO box attribute (with a virtual post box option) is enabled, **when** the shopper edits an address, **then** the field is shown and saved; when disabled it is not shown. | D; FIT (AddressAttribute) |
| AC-CHK-007-01-04 | US-CHK-007-01 | **Given** AddressSettings.CountyEnabled / CountyRequired and the state/province list are configured per country, **when** the shopper selects a country, **then** the county and region fields follow the settings (Kenya counties, Malawi districts as configured). | D; FIT (AddressSettings) |
| AC-CHK-007-03-01 | US-CHK-007-03 | **Given** an order has a delivery address with a pin (LOG-015 AddressGeo), **when** staff, the seller or the courier open the order, **then** the pin is shown with a link to the map and the landmark is shown beside the address. | D; Proposed |

**Business rules applied:** BR-CHK-011 (§8.1).


### 7.8 PRD-CHK-008 Checkout resilience and idempotency

| Item | Value |
|---|---|
| Description (baseline) | An order number is created as soon as checkout starts and kept through payment and delivery; if payment is interrupted the customer can resume, and pressing 'pay' twice never creates two orders. |
| Why it matters | No lost or duplicate orders when networks are unreliable. |
| Who benefits | Shoppers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin; Core modification (conditional) |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-008-01 | As a shopper, I want an order reference from the moment checkout starts that stays the same through payment and delivery, so that I can quote one reference everywhere. | D; REQ-MPC-FR-108 | Ready |
| US-CHK-008-02 | As a shopper, I want to resume my checkout after a payment interruption, so that I do not have to start again. | D; REQ-MPC-FR-114 | Ready |
| US-CHK-008-03 | As a member of finance staff, I want pressing pay twice never to create two orders, so that there are no duplicate orders or charges. | D; REQ-MPC-FR-114 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-008-01-01 | US-CHK-008-01 | **Given** the shopper starts checkout, **when** the first checkout step loads, **then** a CheckoutSession with a unique reference is created, or the open session of the same customer and store is reused; the reference is shown on the payment and confirm steps (SM-CHK-01). | REQ-MPC-FR-108; Proposed |
| AC-CHK-008-01-02 | US-CHK-008-01 | **Given** the order is placed, **when** placement completes, **then** the reference is stored on every sub-order (OrderCheckoutLink), passed to PAY as merchant reference, shown on the order details, invoice and tracking pages, and searchable in admin; the native custom order number is still generated at order insert. | REQ-MPC-FR-108; FIT (SaveOrderDetailsAsync) |
| AC-CHK-008-02-01 | US-CHK-008-02 | **Given** the order was placed but payment was interrupted (order PaymentStatus Pending), **when** the shopper returns to the order, **then** the order details offer to complete payment through the PAY retry path (native RePostPayment for Redirection methods). | REQ-MPC-FR-114; see PAY-011 (REQ-MPC-FR-150) |
| AC-CHK-008-02-02 | US-CHK-008-02 | **Given** checkout was interrupted before the order was placed, **when** the shopper signs in again and opens checkout, **then** the cart, addresses, chosen shipping option and payment method are kept and the same CheckoutSession reference is shown. | REQ-MPC-FR-114; FIT (checkout data kept until IShoppingCartService.ResetCheckoutDataAsync after placement, OrderProcessingService.cs:1636-1637; moved from ICustomerService in 5.00) |
| AC-CHK-008-03-01 | US-CHK-008-03 | **Given** OrderSettings.PlaceOrderWithLock is on, **when** two confirm requests from the same customer reach the same web node, **then** only one order is created; the second request receives the native message Checkout.MinOrderPlacementInterval. | REQ-MPC-FR-114; FIT (named Mutex + OrderWithLockCacheKey) |
| AC-CHK-008-03-02 | US-CHK-008-03 | **Given** PLT-027 (P2) is delivered and the shop runs on more than one web node, **when** the same confirm request is sent twice to different nodes, **then** the PLT-027 idempotency key (CheckoutSession reference + cart hash) returns the existing order to the second request; no second order or charge is created. | REQ-MPC-FR-114; FC-M03-033; NFR-X-007 |
| AC-CHK-008-03-03 | US-CHK-008-03 | **Given** checkout is retried within PaymentSettings.RegenerateOrderGuidInterval, **when** the payment request is prepared, **then** the same OrderGuid is reused (native) and the provider sees the same merchant reference. | FIT (SetProcessPaymentRequestAsync) |
| AC-CHK-008-01-03 | US-CHK-008-01 | **Given** two requests update the same CheckoutSession at once, **when** the second write is saved, **then** it fails on the row version of the plugin table and is retried after re-reading. | FC-M03-032; Proposed |
| AC-CHK-008-03-04 | US-CHK-008-03 | **Given** PLT-027 is not delivered (P1), **when** the go-live checklist of an instance (BR-PLT-004) records more than one web node serving checkout, **then** the checklist item fails and the instance is not set Active; in P1 duplicate-order protection is the native per-host placement lock and minimum interval plus the CheckoutSession reference, which hold on a single web node (L1 §6.4). | Proposed (P1 single-node deployment until PLT-027); FIT (OrderProcessingService named mutex per host) |

**Business rules applied:** BR-CHK-012; BR-CHK-006 (§8.1).


### 7.9 PRD-CHK-009 E-transactions consumer controls

| Item | Value |
|---|---|
| Description (baseline) | Shows the confirmations and policy notices that e-commerce law requires, at the required points in checkout. Each country's rules are set as configuration. |
| Why it matters | Keeps online sales legal in each country. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: ONE-RECORD |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-009-01 | As a client administrator, I want to configure the legal notices and confirmations each country requires at each checkout point, so that online sales stay legal in each country. | D; REQ-MPC-FR-115 | Ready; conditions: ONE-RECORD |
| US-CHK-009-02 | As a shopper, I want to read and acknowledge the returns and refund policy where it applies before I pay, so that I know my rights. | REQ-MPC-FR-117; REQ-MPC-FR-107 | Ready; conditions: ONE-RECORD |
| US-CHK-009-03 | As a shopper, I want to receive the order confirmation within the time the law requires, so that I have proof of my order in time. | REQ-MPC-FR-115 | Ready; conditions: ONE-RECORD |
| US-CHK-009-04 | As a client administrator, I want the data-protection and e-commerce notices of the country to be shown at checkout, so that we meet local rules. | REQ-KTDA-LEG-001 | Ready; conditions: ONE-RECORD |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-009-01-01 | US-CHK-009-01 | **Given** the e-transactions part of the store country's profile (CountryPrivacyProfile, owned by SEC-012; read through IC-SEC-03 GetProfile) defines a notice for a checkout point (cart, shipping, payment, confirm, completed), **when** the shopper reaches that point, **then** the notice topic is shown; for a policy topic under MKT-008 versioning the text is its Effective version (IC-MKT-03 GetEffectivePolicyVersion); CHK keeps no notice versions of its own. | D; REQ-MPC-FR-115; ONE-RECORD (Proposed) |
| AC-CHK-009-02-01 | US-CHK-009-02 | **Given** an item, its category or the service type requires a returns or refund policy acknowledgement, **when** the shopper is on the confirm step, **then** a checkbox with a link to the policy is shown; if it is not ticked the order is not placed and message Chk.AcknowledgementRequired is shown (server-side action filter on CheckoutController.ConfirmOrder and OpcConfirmOrder [POST]). | REQ-MPC-FR-117; REQ-MPC-FR-107; FIT (ConfirmOrder takes no model, so a ModelReceivedEvent veto cannot be used) |
| AC-CHK-009-02-02 | US-CHK-009-02 | **Given** the shopper ticks the acknowledgement, **when** the order is placed, **then** the acceptance is recorded through IAM IC-IAM-05 RecordAcceptance (customer, policy system name, version from IC-MKT-03 or "unversioned", decision, channel checkout, IP, agent in an acting session); CHK stores only a NoticeAcknowledgement link of order, notice and the returned acceptance id (AUD-CHK-002); CHK keeps no acceptance record of its own. | REQ-MPC-FR-117; ONE-RECORD (Proposed) |
| AC-CHK-009-02-03 | US-CHK-009-02 | **Given** no item in the cart requires an acknowledgement, **when** the shopper is on the confirm step, **then** no acknowledgement is shown ("where applicable"). | REQ-MPC-FR-117 |
| AC-CHK-009-03-01 | US-CHK-009-03 | **Given** the country profile (e-transactions part, CHK-009 field) sets a confirmation time limit, **when** an order is placed, **then** the order confirmation is queued at placement; if QueuedEmail.SentOnUtc is still empty when the limit passes, the order appears in the checkout exceptions list and staff are alerted. | REQ-MPC-FR-115; FIT (QueuedEmail.SentOnUtc); Proposed (alert) |
| AC-CHK-009-04-01 | US-CHK-009-04 | **Given** the store country's profile holds data-protection consent texts (SEC-012 part) and e-commerce notices (CHK-009 part), read through IC-SEC-03, **when** a shopper checks out, **then** those notices are shown at their configured checkout points and consents are recorded through SEC-012. | REQ-KTDA-LEG-001 |

**Business rules applied:** BR-CHK-013; BR-CHK-014 (§8.1).


### 7.10 PRD-CHK-010 Minimum order and fee thresholds

| Item | Value |
|---|---|
| Description (baseline) | Set a minimum order value and fee thresholds, for example free pickup above a certain amount. |
| Why it matters | Avoids unprofitable small orders and encourages bigger baskets. |
| Who benefits | Clients |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-010-01 | As a client administrator, I want to set a minimum order value, so that we avoid unprofitable small orders. | D; REQ-MPC-FR-122 | Ready |
| US-CHK-010-02 | As a client administrator, I want to set a threshold above which delivery or pickup is free, so that customers buy larger baskets. | D; REQ-MPC-FR-122 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-010-01-01 | US-CHK-010-01 | **Given** OrderSettings.MinOrderSubtotalAmount (or MinOrderTotalAmount) is set, **when** the cart is below it, **then** checkout cannot be completed and the native warning Checkout.MinOrderSubtotalAmount (or Checkout.MinOrderTotalAmount) shows the minimum. | REQ-MPC-FR-122; FIT |
| AC-CHK-010-02-01 | US-CHK-010-02 | **Given** ShippingSettings.FreeShippingOverXEnabled is on with FreeShippingOverXValue, **when** the cart subtotal reaches the value, **then** the delivery fee and the pickup fee are zero (native: one threshold applies to both). | REQ-MPC-FR-122; FIT (OrderTotalCalculationService) |
| AC-CHK-010-01-02 | US-CHK-010-01 | **Given** different values are set per store, **when** a shopper checks out in a store, **then** the store's values apply (settings are store-overridable). | REQ-MPC-FR-122; FIT |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.11 PRD-CHK-011 Cart restriction rules

| Item | Value |
|---|---|
| Description (baseline) | Rules that stop certain combinations, make some items pickup-only, or restrict items to certain accounts. |
| Why it matters | Prevents orders that cannot or must not be fulfilled. |
| Who benefits | Clients |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-011-01 | As a client administrator, I want to block combinations of items that must not be ordered together, so that orders that cannot be fulfilled are not placed. | D; REQ-MPC-FR-111 | Ready |
| US-CHK-011-02 | As a client administrator, I want to make items pickup-only or limit where they can be delivered, so that items go only where they can. | D; REQ-MPC-FR-111 | Ready |
| US-CHK-011-03 | As a client administrator, I want users with account restrictions to be unable to check out, so that suspected fraudsters cannot buy. | REQ-MPC-FR-118 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-011-01-01 | US-CHK-011-01 | **Given** an active rule says items of product or category A cannot be in the same cart as B, **when** the shopper adds B while A is in the cart, **then** the item is not added and message Chk.CartRuleViolation shows the rule text. | REQ-MPC-FR-111 |
| AC-CHK-011-01-02 | US-CHK-011-01 | **Given** a rule becomes active after items were added, **when** the shopper starts checkout or confirms, **then** the cart warnings list the violation and the order is not placed. | REQ-MPC-FR-111; FIT (GetShoppingCartWarningsAsync runs at placement) |
| AC-CHK-011-02-01 | US-CHK-011-02 | **Given** an item is flagged pickup-only, **when** the shopper chooses delivery for the order or the line, **then** delivery is not offered; a placement with delivery is refused with message Chk.PickupOnly. | REQ-MPC-FR-111 |
| AC-CHK-011-02-02 | US-CHK-011-02 | **Given** an item cannot be delivered to the shipping address area (LOG-004 serviceability), **when** the shopper reaches the shipping step, **then** the item gets message Chk.CartRuleViolation with the rule text and the shopper may choose pickup or remove the item. | REQ-MPC-FR-111 |
| AC-CHK-011-03-01 | US-CHK-011-03 | **Given** PAY-018 sets an account restriction on the customer after checkout started, **when** the shopper confirms, **then** the placement override re-checks restrictions and refuses the order with message Pay.CheckoutRestricted. | REQ-MPC-FR-118; see PAY-018 (REQ-MPC-FR-118) |
| AC-CHK-011-01-03 | US-CHK-011-01 | **Given** a rule is created, changed, enabled or disabled, **when** it is saved, **then** who, when and old and new values are audited (AUD-CHK-001). | Proposed |

**Business rules applied:** BR-CHK-015 (§8.1).


### 7.12 PRD-CHK-012 Pickup code / QR

| Item | Value |
|---|---|
| Description (baseline) | After ordering, the customer receives a code or QR code to show when collecting the parcel. |
| Why it matters | Only the right person collects the order. |
| Who benefits | Shoppers; outlet staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CHN-005 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-012-01 | As a shopper, I want to choose whether I show an order code or a QR code when I collect my parcel, so that collection is quick and safe. | D; REQ-MPC-FR-124 | Ready |
| US-CHK-012-02 | As a member of outlet staff, I want the code I enter or scan in the LOG-012 collection step to be checked against the code CHK issued, so that only the right person collects the order. | D; see LOG-012 (REQ-MPC-FR-164) | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-012-01-01 | US-CHK-012-01 | **Given** pickup is chosen and the client has enabled code and QR, **when** the shopper is on the confirm step, **then** the shopper selects Order code or QR code; only enabled methods are offered. | REQ-MPC-FR-124 |
| AC-CHK-012-01-02 | US-CHK-012-01 | **Given** a pickup sub-order is placed, **when** placement completes, **then** a pickup code is generated (not guessable; stored as a hash), state Issued (SM-CHK-03). | D; Proposed |
| AC-CHK-012-01-03 | US-CHK-012-01 | **Given** the shipment is marked ready for pickup (native ReadyForPickupAsync), **when** ShipmentReadyForPickupEvent is raised, **then** the code or QR is sent by TRK-005 on the configured channels (SMS through CHN-005, email): by default inside the native ShipmentReadyForPickup.CustomerNotification, to which CHK-012 supplies the code token (TRK-012), or, where the client enables it, as the separate CHK event code Chk.PickupCode raised through IC-TRK-04; the code is shown in My account order details; state Sent. | REQ-MPC-FR-124; FIT (ShipmentReadyForPickupEvent); (BR-TRK-023) |
| AC-CHK-012-02-01 | US-CHK-012-02 | **Given** the order is ready for pickup at outlet O and its code is Sent, **when** LOG-012 calls IC-CHK-09 Verify with the shipment, outlet O and the entered or scanned code, **then** CHK answers Valid; after its own checks (holding charge, proof of collection) LOG-012 calls DeliverAsync once and then IC-CHK-09 MarkUsed, and the code becomes Used (AUD-CHK-004). | D; FIT (IOrderProcessingService.DeliverAsync) |
| AC-CHK-012-02-02 | US-CHK-012-02 | **Given** a wrong code is checked, **when** IC-CHK-09 Verify runs, **then** CHK answers Invalid with message Chk.PickupCodeInvalid and adds one failed attempt; when the failures reach the configured limit (setting, default not stated) the code becomes Locked and CHK answers Locked with message Chk.PickupCodeLocked, which tells staff to check identity manually; LOG-012 shows the CHK message and nothing is handed over. | Proposed |
| AC-CHK-012-02-03 | US-CHK-012-02 | **Given** a code is already Used, **when** IC-CHK-09 Verify runs for it again, **then** CHK answers Used with message Chk.PickupCodeUsed and nothing is handed over. | Proposed |
| AC-CHK-012-02-04 | US-CHK-012-02 | **Given** the code is checked at a different outlet, **when** IC-CHK-09 Verify runs, **then** CHK answers Invalid with message Chk.PickupCodeInvalid (the code is bound to one outlet). | Proposed |

**Business rules applied:** BR-CHK-016 (§8.1).


### 7.13 PRD-CHK-013 Assisted checkout

| Item | Value |
|---|---|
| Description (baseline) | An agent at an outlet places an order for a customer and records how the customer paid. |
| Why it matters | Serves customers who cannot order online themselves. |
| Who benefits | Walk-in customers; agents |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-013-01 | As an agent at an outlet, I want to place an order for a walk-in customer, so that customers who cannot order online are served. | D; REQ-MPC-FR-112 | Ready; conditions: SINGLE-FILTER |
| US-CHK-013-02 | As an agent, I want to record how the customer paid, so that the order and the cash at the outlet match. | REQ-MPC-FR-112 | Ready; conditions: SINGLE-FILTER |
| US-CHK-013-03 | As an outlet supervisor, I want to see the orders each agent placed, so that agent work is traceable. | D | Ready; conditions: SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-013-01-01 | US-CHK-013-01 | **Given** a user in role Agent with Customers.CustomersImpersonation, Security.AccessAdminPanel and Identity.Core.AssistedService.Access and an assigned outlet (IAM-026), **when** the agent finds or registers the customer and starts Place order for customer (Admin CustomerController.Impersonate), **then** the single impersonation filter owned by IAM-026 (BR-IAM-130) allows the agent only for a non-staff customer of the agent's own outlet, with the customer code where the setting requires it; then native impersonation starts, IAM writes the session record (AssistedServiceRecord, act) and the agent shops as that customer. | REQ-MPC-FR-112; FIT (CustomerController.Impersonate); see IAM-026 (REQ-MPC-FR-025); SINGLE-FILTER (Proposed) |
| AC-CHK-013-01-02 | US-CHK-013-01 | **Given** an agent is impersonating a customer, **when** the order is placed, **then** inside the CHK-003 placement override an AssistedOrder record stores OrderId, agent (IWorkContext.OriginalCustomerIfImpersonated) and outlet; this is the only order-to-agent record (IAM stores the session only); the native order note also names the agent (AUD-CHK-003). | REQ-MPC-FR-112; FIT (SendNotificationsAndSaveNotesAsync note); (BR-IAM-130) |
| AC-CHK-013-02-01 | US-CHK-013-02 | **Given** the agent reaches the payment step, **when** methods are listed, **then** only methods allowed for assisted orders by the PAY routing rules are offered, and the payment taken is recorded by PAY-034 with the agent identity (AC-PAY-034-01-01). | REQ-MPC-FR-112 |
| AC-CHK-013-01-03 | US-CHK-013-01 | **Given** the agent has no assigned outlet, **when** the agent tries to start an acting session, **then** IAM-026 refuses it with message Iam.AgentNotAssigned and no checkout is possible for the customer. | see IAM-026 (REQ-MPC-FR-025) |
| AC-CHK-013-03-01 | US-CHK-013-03 | **Given** assisted orders exist, **when** a user with Checkout.Core.AssistedOrders.View filters by agent, outlet and date, **then** the matching AssistedOrder records are listed; agents see only their own outlet (IAM-008 scope "outlet"). | D |
| AC-CHK-013-03-02 | US-CHK-013-03 | **Given** another module needs the agent and outlet of an order (CHN-009 network commission, IAM-008 outlet scope, RPT), **when** it calls IC-CHK-10 GetAssistedOrder with the order ID, or ListAssistedOrders with agent, outlet and period, **then** CHK returns agent, outlet and placement time from AssistedOrder, or "not assisted"; no other module keeps an order-to-agent link. | D; Proposed (one record per assisted order, BR-IAM-130) |

**Business rules applied:** BR-CHK-017 (§8.1).


### 7.14 PRD-CHK-014 Estimated delivery at checkout

| Item | Value |
|---|---|
| Description (baseline) | Checkout shows the expected delivery date or when the order can be collected. |
| Why it matters | Customers know when to expect their order. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Theme/view override |
| Depends on | PRD-LOG-005 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-014-01 | As a shopper, I want to see the expected delivery date or when I can collect, during checkout, so that I know when my order will arrive. | D; REQ-MPC-FR-119 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-014-01-01 | US-CHK-014-01 | **Given** LOG-005 returns an estimate for each shipping option and the shipping address (IC-CHK-03), **when** the shopper is on the shipping method step, **then** each option shows the earliest and latest date with message Log.EdtRange, calculated by LOG-005 (BR-LOG-030); CHK calculates no date. | REQ-MPC-FR-119 |
| AC-CHK-014-01-02 | US-CHK-014-01 | **Given** the shopper chooses pickup at an outlet, **when** pickup points are listed, **then** each outlet shows the date from which the order can be collected. | REQ-MPC-FR-119 |
| AC-CHK-014-01-03 | US-CHK-014-01 | **Given** LOG-005 has no estimate for an option, **when** the step is shown, **then** the native transit-days estimate is shown if available (StorePickupPoint.TransitDays, rate transit days); otherwise no date is shown and checkout continues. | FIT; Proposed |
| AC-CHK-014-01-04 | US-CHK-014-01 | **Given** an estimate was shown for the chosen option, **when** the order is placed, **then** the estimate is stored with the order and shown on the confirm step and in tracking (TRK-001). | REQ-MPC-FR-119; Proposed |
| AC-CHK-014-01-05 | US-CHK-014-01 | **Given** the native desired-date list is on for a shipping option (CHK-006), **when** the shipping method step is shown, **then** the LOG-005 estimate (Log.EdtRange) is the expected delivery shown to the shopper; the native list is labelled as a choice of preferred date and its first date (today plus TransitDays) is not presented as the estimate. | VER-500; FIT (CheckoutModelFactory.cs:450-482); Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.15 PRD-CHK-015 Checkout attributes

| Item | Value |
|---|---|
| Description (baseline) | Extra fields at checkout such as a purchase-order number, special instructions or a gift message, optionally with a fee. |
| Why it matters | Captures information business buyers and gift senders need. |
| Who benefits | Shoppers; business buyers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | On hold: PH-INF |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-015-01 | As a business buyer, I want to enter my purchase-order number at checkout, so that our accounts team can match the invoice. | D; Inference from REQ-KTDA-CUS-002 (B2B buyers named as target audience; PH-INF) | On hold: PH-INF |
| US-CHK-015-02 | As a shopper, I want to add a gift message or special instructions, with a fee where the client charges one, so that my order is handled as I want. | D | On hold: PH-INF |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-015-01-01 | US-CHK-015-01 | **Given** a checkout attribute "Purchase order number" (text box, required for the B2B store) with length validation is configured, **when** a business buyer checks out, **then** the value is required, validated (ValidationMinLength / MaxLength) and stored on the order and invoice. | Inference from REQ-KTDA-CUS-002 (PH-INF); FIT (CheckoutAttribute) |
| AC-CHK-015-02-01 | US-CHK-015-02 | **Given** a checkout attribute with a price adjustment and a tax category is configured, **when** the shopper selects it, **then** the fee is added to the order total with its tax. | D; FIT (CheckoutAttributeValue.PriceAdjustment, TaxCategoryId) |
| AC-CHK-015-02-02 | US-CHK-015-02 | **Given** an attribute has a condition on another attribute, **when** the shopper changes the first attribute, **then** the conditional attribute is shown or hidden accordingly. | D; FIT (ConditionAttributeXml) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.16 PRD-CHK-016 B2B on-account payment and credit limits

| Item | Value |
|---|---|
| Description (baseline) | Approved business customers buy now and pay later against an invoice, within a credit limit and agreed payment terms (for example 30 days). |
| Why it matters | Normal practice in business-to-business trade. |
| Who benefits | Business buyers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-IAM-022, PRD-PAY-033 |
| Status | On hold: PH-INF, PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-016-01 | As a business buyer, I want to buy now and pay later against an invoice within my credit limit and terms, so that I can trade as we normally do. | D; Inference from REQ-KTDA-CUS-002 (PH-INF) | On hold: PH-INF, PAID-STUB |
| US-CHK-016-02 | As a member of finance staff, I want to approve credit accounts and set the limit and payment terms, so that credit risk is controlled. | D | On hold: PH-INF, PAID-STUB |
| US-CHK-016-03 | As a member of finance staff, I want orders above the available credit to be refused, so that no one exceeds their limit. | D | On hold: PH-INF, PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-016-02-01 | US-CHK-016-02 | **Given** a company account (IAM-022) applies for credit, **when** finance staff set the limit, currency and payment terms and approve, **then** the credit account becomes Approved (SM-CHK-04) and the change is audited (AUD-CHK-005). | D |
| AC-CHK-016-01-01 | US-CHK-016-01 | **Given** the buyer's company has an Approved credit account and enough available credit, **when** the buyer reaches the payment step, **then** payment method "On account" is offered; the order is placed with PaymentStatus Pending, and on invoice issue PAY-033 creates a receivable due after the payment terms. | D; Inference from REQ-KTDA-CUS-002 (PH-INF) |
| AC-CHK-016-03-01 | US-CHK-016-03 | **Given** the order total exceeds available credit (limit minus open receivables minus unpaid on-account orders), **when** the buyer reaches the payment step or confirms, **then** On account is hidden (HidePaymentMethodAsync) and, if posted, ProcessPaymentAsync returns error message Chk.CreditLimitExceeded; no order is placed; open receivables are read from PAY-033 through IC-PAY-08 GetOpenReceivables. | D; FIT (IPaymentMethod); see PAY-033 (IC-PAY-08) |
| AC-CHK-016-03-02 | US-CHK-016-03 | **Given** two buyers of the same company confirm on-account orders at the same time, **when** credit is checked, **then** the check runs under ILocker key 'chk-credit-{CreditAccountId}'; the second order is refused if the limit would be exceeded. | Proposed |
| AC-CHK-016-02-02 | US-CHK-016-02 | **Given** a credit account is Suspended, **when** a buyer of that company checks out, **then** On account is not offered; existing receivables are unchanged. | Proposed |
| AC-CHK-016-03-03 | US-CHK-016-03 | **Given** the company has receivables overdue beyond the configured grace (setting, default not stated), **when** a buyer checks out, **then** On account is not offered when the client setting "block when overdue" is on. | Proposed |

**Business rules applied:** BR-CHK-018 (§8.1).


### 7.17 PRD-CHK-017 B2B quick order and bulk add

| Item | Value |
|---|---|
| Description (baseline) | Business buyers order quickly by typing product codes, uploading a spreadsheet or using saved order lists. |
| Why it matters | Large repeat orders take minutes, not hours. |
| Who benefits | Business buyers |
| Phase | P1 |
| Implementation | Licensed plugin — None |
| Depends on | — |
| Status | On hold: PH-INF |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-017-01 | As a business buyer, I want to order by typing product codes and quantities, so that large repeat orders take minutes. | D | On hold: PH-INF |
| US-CHK-017-02 | As a business buyer, I want to upload a spreadsheet of codes and quantities, so that I can order from my own lists. | D | On hold: PH-INF |
| US-CHK-017-03 | As a business buyer, I want to keep saved order lists and add a whole list to the cart, so that I reorder standard baskets quickly. | D | On hold: PH-INF |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-017-01-01 | US-CHK-017-01 | **Given** the buyer enters lines of SKU and quantity, **when** the buyer adds them to the cart, **then** each valid line is added through AddToCartAsync with stock and price checks; unknown SKUs are listed with message Chk.QuickOrderSkuNotFound and native warnings are listed per line. | D; Inference from REQ-KTDA-CUS-002 (PH-INF) |
| AC-CHK-017-02-01 | US-CHK-017-02 | **Given** the buyer uploads a file with columns SKU and Quantity (format Proposed), **when** the file is processed, **then** the same per-line rules apply and a result list shows added and refused lines. | D; Proposed (format) |
| AC-CHK-017-03-01 | US-CHK-017-03 | **Given** ShoppingCartSettings.AllowMultipleWishlist is on and the buyer has named lists, **when** the buyer selects Add all to cart on a list, **then** all items are added through AddToCartAsync and any warnings are shown per item. | D; FIT (CustomWishlist) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.18 PRD-CHK-018 B2B purchase approval

| Item | Value |
|---|---|
| Description (baseline) | Orders by company staff above a set amount must be approved by someone else in the company before they are placed. |
| Why it matters | Companies keep control of spending. |
| Who benefits | Business buyers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002, PRD-IAM-022 |
| Status | On hold: PH-INF, WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-018-01 | As a company buyer, I want orders above my limit to go to an approver in my company before they are placed, so that company spending rules are followed. | D; Inference from REQ-KTDA-CUS-002 (PH-INF) | On hold: PH-INF, WF-ENG |
| US-CHK-018-02 | As a company approver, I want to approve or reject a colleague's order with a reason, so that I control spending. | D; FC-M06-017 | On hold: PH-INF, WF-ENG |
| US-CHK-018-03 | As a company administrator, I want to set approval thresholds per company role, so that each person has the right limit. | D; FC-M06-017 | On hold: PH-INF, WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-018-03-01 | US-CHK-018-03 | **Given** a company administrator sets a threshold for the buyer role (IAM-022), **when** it is saved, **then** orders by users in that role above the threshold need approval; the change is audited (AUD-CHK-001). | D; FC-M06-017 |
| AC-CHK-018-01-01 | US-CHK-018-01 | **Given** the cart total is above the buyer's threshold, **when** the buyer submits it for approval, **then** a PurchaseApprovalRequest with the cart snapshot and total is created in state Pending (SM-CHK-05) and the approvers of the company are notified (ADM-006 queue). | D; Inference from REQ-KTDA-CUS-002 (PH-INF) |
| AC-CHK-018-01-02 | US-CHK-018-01 | **Given** approval is required and no Approved request matches the current cart, **when** the buyer confirms the order, **then** the placement override refuses it with message Chk.ApprovalRequired. | D |
| AC-CHK-018-02-01 | US-CHK-018-02 | **Given** a request is Pending, **when** an approver of the same company approves it, **then** it becomes Approved; the buyer can place the order while the cart matches the snapshot; the approver cannot be the requester. | D; FC-M06-017 |
| AC-CHK-018-02-02 | US-CHK-018-02 | **Given** an approver rejects a request, **when** the rejection is submitted, **then** a reason is mandatory, the request becomes Rejected and the buyer is notified with the reason. | D |
| AC-CHK-018-01-03 | US-CHK-018-01 | **Given** the cart changes after approval, **when** the buyer confirms, **then** the approval becomes Void and approval is required again. | Proposed |

**Business rules applied:** BR-CHK-019 (§8.1).


### 7.19 PRD-CHK-019 Order confirmation

| Item | Value |
|---|---|
| Description (baseline) | After ordering, the customer sees a confirmation page and receives a message with the order number. |
| Why it matters | Reassures the customer that the order went through. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, MSG-ROUTE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHK-019-01 | As a shopper, I want to see a confirmation page and receive a message with my order number, so that I know my order went through. | D; REQ-KTDA-WF-006; REQ-MPC-FR-159 | Ready; conditions: OVR-REG, MSG-ROUTE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHK-019-01-01 | US-CHK-019-01 | **Given** OrderSettings.DisableOrderCompletedPage is off, **when** the order is placed, **then** the completed page shows the custom order number, the checkout reference (CHK-008) and, for a split checkout, every sub-order with its seller. | REQ-MPC-FR-159; FIT |
| AC-CHK-019-01-02 | US-CHK-019-01 | **Given** an order is placed, **when** placement completes, **then** the native OrderPlaced.CustomerNotification email with the order number is queued, with the PDF invoice attached when AttachPdfInvoiceToOrderPlacedEmail is on, and an SMS is sent when TRK-005 is configured for this event. | REQ-MPC-FR-159; REQ-KTDA-WF-006; FIT |
| AC-CHK-019-01-03 | US-CHK-019-01 | **Given** a checkout produced several sub-orders (CHK-004), **when** placement completes, **then** the buyer receives one confirmation (message template Chk.OrderPlacedGroup.CustomerNotification, new) listing all sub-orders instead of one native email per sub-order, sent by TRK-005 (owner of the IWorkflowMessageService override, IC-TRK-04 SendEvent); seller notifications are unchanged. | Proposed; FIT (SendNotificationsAndSaveNotesAsync is protected virtual inside the CHK-003 override); OVR-REG |
| AC-CHK-019-01-04 | US-CHK-019-01 | **Given** the CHK plugin is installed, **when** installation runs, **then** CHK registers its product event codes with TRK-005 through IC-TRK-04 RegisterEventCode, with default channels and localised default content: Chk.OrderPlacedGroup (active) and Chk.PickupCode (inactive by default, because ShipmentReadyForPickup.CustomerNotification carries the code, TRK-012); a send with an unregistered code is refused by TRK. | Proposed; (BR-TRK-023); MSG-ROUTE |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-CHK-001 | Save for later uses a native CustomWishlist per customer; moving a line between cart and list goes through IShoppingCartService so stock, price and quantity checks run. | CHK-001 | REQ-MPC-FR-123; FIT; Proposed |
| BR-CHK-002 | Guest checkout is a per-client setting (OrderSettings.AnonymousCheckoutAllowed): KTDA on (CUS-006), Malawi Post off (FR-125). No code differs between clients. | CHK-002 | REQ-KTDA-CUS-006; REQ-MPC-FR-125; NFR-X-008 |
| BR-CHK-003 | Prices and totals are always calculated on the server at placement; no price or total sent by the browser is used. | CHK-002, CHK-003 | REQ-MPC-FR-121; FIT (PrepareAndValidateTotalsAsync) |
| BR-CHK-004 | The confirm page total is stored server-side when the page is shown; if the total calculated at placement differs, the order is not placed and the new total is shown (Chk.PriceChanged). | CHK-003 | REQ-MPC-FR-103; Proposed |
| BR-CHK-005 | Placement validation runs inside the IOrderProcessingService.PlaceOrderAsync override, before payment, in this order: native cart and item warnings; price check (BR-CHK-004); eligibility (ACL, PAY-018 restriction, CHK-011 rules, CHK-018 approval, LOG-004 serviceability and seller coverage); payment method active and allowed by PAY routing rules (BR-PAY-001); PAY-018 risk evaluation. The first failure stops placement. Validation is not placed in event consumers (L1 §6.2 principle 8). | CHK-003, CHK-011, CHK-018 | FC-M03-004; FIT; Proposed (order) |
| BR-CHK-006 | Placement host (core): the IOrderProcessingService override is one class for the product, owned by the core checkout feature CHK-003 (decision OVR-REG; L1 §6.2 principle 7; core behaviour is not hosted in an optional pack, D-01), registered in INopStartup with Order >= 3000. Its PlaceOrderAsync reproduces the native sequence once per checkout: when PlaceOrderWithLock is on, take the named Mutex keyed by customer once, check and later set NopOrderDefaults.OrderWithLockCacheKey once; prepare details once (PreparePlaceOrderDetailsAsync); run the IC-CHK-02 validators and the IC-CHK-06 Reserve phase; process payment once for the checkout; save the order (SaveOrderDetailsAsync) and move its cart lines; clear the cart once; publish OrderPlacedEvent and run CheckOrderStatusAsync per saved order. Without a registered order splitter one order is placed. When the Marketplace pack registers the CHK-004 order splitter (IC-CHK-11), the host saves one sub-order per group the splitter returns (SaveOrderDetailsAsync with a new OrderGuid per sub-order, moving only that group's cart lines); it never calls base.PlaceOrderAsync per sub-order, because base loads and clears the whole cart and would trip its own interval cache. Other modules plug in only through IC-CHK-02 validators, IC-CHK-06 placement participants, IC-CHK-07 order-action guards, IC-CHK-08 cancellation participants and the IC-CHK-11 splitter; the override is listed in the ADM extension register (BR-ADM-001). The host follows the 5.00.1 sequence: after the last order it calls IShoppingCartService.ResetCheckoutDataAsync (moved from ICustomerService) and SetShoppingCartVendorAsync(customer, null) once, and it sets the desired delivery date read once from the customer on every sub-order, because SaveOrderDetailsAsync copies it to the first order saved and clears it (OrderProcessingService.cs:790-797, 1634-1639). The override is rebased on the 5.00.1 OrderProcessingService (constructor and PlaceOrderAsync changed in 5.00). | CHK-003, CHK-004, CHK-006, CHK-008 | REQ-MPC-FR-110; FIT (OrderProcessingService 288-315, 723-817, 1283-1347, 1594-1720 in 5.00.1); L1 §6.3; OVR-REG; D-01; Proposed (host in CHK-003) |
| BR-CHK-007 | Order-level amounts (delivery fee, payment fee, order discount, checkout-attribute fee, redeemed reward points, gift cards) are allocated to sub-orders in proportion to sub-order subtotals, except a delivery fee calculated per seller by LOG-002, which stays with that seller's sub-order; amounts are rounded to the currency's minor unit and the remainder goes to the sub-order with the largest subtotal. | CHK-004 | Proposed |
| BR-CHK-008 | Each sub-order has one seller; direct payment to a seller (PAY-035) is offered only when the checkout has one seller. | CHK-004 | REQ-MPC-FR-110; BR-PAY-150 |
| BR-CHK-009 | Lines are grouped into sub-orders by seller and fulfilment choice (delivery, or pickup at outlet X); each sub-order has one native PickupInStore value. | CHK-005 | REQ-MPC-FR-104; Proposed |
| BR-CHK-010 | Delivery-window capacity is checked and reserved at placement under ILocker key 'chk-slot-{SlotId}-{Date}' by the CHK-006 placement participant (IC-CHK-06); a cancelled order releases its place through the CHK-006 cancellation participant (IC-CHK-08). | CHK-006 | Proposed |
| BR-CHK-011 | An address must have at least the locators the client rule requires (street address, landmark or pin); the rule is a client setting. | CHK-007 | REQ-MPC-FR-113; Proposed |
| BR-CHK-012 | One CheckoutSession per customer and store is open at a time; its reference is unique, not guessable, and kept on every order it produced. | CHK-008 | REQ-MPC-FR-108; Proposed |
| BR-CHK-013 | Acknowledgements and the terms checkbox are enforced on the server by a CHK global action filter on CheckoutController.ConfirmOrder and OpcConfirmOrder [POST]; a ModelReceivedEvent veto is not used because these actions take no model. | CHK-002, CHK-009 | REQ-MPC-FR-117; FIT |
| BR-CHK-014 | The notice set is taken from the e-transactions part of the store country's CountryPrivacyProfile (entity owned by SEC-012, fields owned by CHK-009, read through IC-SEC-03). Notice texts are native Topics; policy versions are MKT-008's (IC-MKT-03). Acknowledgements and the checkout terms acceptance are recorded by IAM through IC-IAM-05 RecordAcceptance; CHK stores only the link from the order to the IAM acceptance id (decision ONE-RECORD). | CHK-002, CHK-009 | REQ-MPC-FR-115; Proposed; ONE-RECORD |
| BR-CHK-015 | Under decision OVR-REG CHK-003 owns the only IShoppingCartService override (DI, INopStartup Order >= 3000, listed in the ADM extension register BR-ADM-001). It overrides GetShoppingCartItemWarningsAsync, GetShoppingCartWarningsAsync, the protected GetStandardWarningsAsync and GetRentalProductWarningsAsync to call cart check providers (IC-CHK-01) after the native checks, and GetSubTotalAsync to call the one line subtotal adjuster (IC-CHK-05, MKT-002). Providers run in their registered order and may only add warnings, except a provider registered as the replacer of a named native warning (CAT: Products.CallForPrice for quote lines; INV-004: stock warning with holds). A provider error refuses the item (Chk.CartCheckUnavailable). CHK-011 cart rules are one provider; no other module overrides the interface. The override subclasses the 5.00.1 ShoppingCartService, whose constructor and vendor / stash logic changed in 5.00; it calls the native warnings, including ShoppingCart.SelectVendorToCheckout, which never fires while VendorEnabled is off (BR-CHK-023); GetShoppingCartAsync now takes a list of cart types and ResetCheckoutDataAsync is an IShoppingCartService member. | CHK-003, CHK-011 | REQ-MPC-FR-111; FIT (ShoppingCartService 337, 1071, 1141, 1187, 1335 in 5.00.1); L1 §6.2 principle 7; OVR-REG |
| BR-CHK-016 | A pickup code is single-use, bound to one sub-order and one outlet, stored only as a hash and locked after the configured number of failed attempts (CHK-012 setting). CHK-012 issues the code, checks it and counts attempts (IC-CHK-09); the LOG-012 handover step calls the check, stores the proof of collection, calls DeliverAsync and then marks the code used. | CHK-012 | D; Proposed |
| BR-CHK-017 | An assisted order is placed in an acting session started through Place order for customer and allowed by the single impersonation filter owned by IAM-026 (BR-IAM-130, decision SINGLE-FILTER; CHK adds no filter); CHK-013 records agent and outlet once per order in AssistedOrder (the only order-to-agent record; IAM keeps the session, the native order note names the agent) and serves it to other modules through IC-CHK-10. Agents act only for non-staff customers of their own outlet (IAM-008 scope). | CHK-013 | REQ-MPC-FR-112; FIT; BR-IAM-130; SINGLE-FILTER |
| BR-CHK-018 | Available credit = credit limit minus open receivables (PAY-033, read through IC-PAY-08 GetOpenReceivables) minus unpaid on-account orders; it is checked in the On account payment method under ILocker key 'chk-credit-{CreditAccountId}'. | CHK-016 | D; Proposed |
| BR-CHK-019 | An approval is valid only for the cart snapshot it was given for (hash of lines, quantities and total); the requester cannot approve own requests. | CHK-018 | D; Proposed |
| BR-CHK-020 | Placement participants (IC-CHK-06) work in two phases inside the CHK-003 override: Reserve after the validators and before payment, each under its own ILocker key (for example 'adm-quota-{quotaId}', 'mkt-discount-{DiscountId}', 'chk-slot-{SlotId}-{Date}', 'chk-credit-{CreditAccountId}', 'fin-scheme-{SchemeId}', and 'pay-wallet-{WalletId}' taken by PAY-009 inside the CAT-042 participant); Confirm per saved sub-order before OrderPlacedEvent; Release when a later reservation, the payment or the placement fails. A reservation not confirmed or released ends at its expiry (setting, default not stated). This closes the race between a cart check and the order insert for limits shared by different customers, which the native per-customer placement lock does not cover. | CHK-003, CHK-006, CHK-016 | FIT (OrderProcessingService named mutex per customer; ILocker); Proposed;, |
| BR-CHK-021 | The CHK-003 override also wraps ShipAsync, ReadyForPickupAsync and DeliverAsync: it calls every order-action guard (IC-CHK-07) first and refuses with the guard message by raising an error, so every caller (admin, seller endpoints, TRK-002, LOG-012, API) is covered. It wraps CancelOrderAsync: the native method runs first, then cancellation participants (IC-CHK-08); a participant error is listed as a checkout exception and does not undo the cancellation. Shipment creation (IShipmentService.InsertShipmentAsync) is not part of this override: it belongs to the ORD-010 shipment-guard host (BR-ORD-050). | CHK-003 | OVR-REG; FIT (IOrderProcessingService; Admin OrderController.SetAsShipped error notification) |
| BR-CHK-023 | Configuration rule (decision CART-500): ShoppingCartSettings.VendorEnabled and VendorRequired stay off in every store of every client. The product keeps one cart for all sellers and splits order and payment in CHK-004; the native per-seller cart of 5.00 (vendor selector, Stash cart type, warning ShoppingCart.SelectVendorToCheckout) is not used. | CHK-004 | CART-500; FIT (ShoppingCartSettings.cs:131,136; ShoppingCartService.cs:1221-1227, 1980-2009) |
| BR-CHK-022 | Paying once for several sub-orders needs PAY group payment (IC-CHK-04 = IC-PAY-02; adapters declare group support). A multi-seller checkout offers only methods that declare group support; if none does, or until PAY group payment is built, a cart with items of more than one seller cannot be confirmed when the Marketplace pack is on (cart warning Chk.MultiSellerNotSupported). | CHK-004 | Proposed (decision SPLIT-PAY) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-CHK-01 | CheckoutSession | (none) | checkout started | no open session for customer and store | Open | reference generated |
| SM-CHK-01 | CheckoutSession | Open | checkout resumed | same customer and store | Open | — |
| SM-CHK-01 | CheckoutSession | Open | orders placed | placement succeeded for all sub-orders | Placed | OrderCheckoutLink per sub-order |
| SM-CHK-01 | CheckoutSession | Open | saving a sub-order fails after payment | — | PlacementException | exception listed; AUD-CHK-007 |
| SM-CHK-01 | CheckoutSession | PlacementException | staff resolve (complete the order, or cancel and refund through RET-005, IC-RET-04) | Checkout.Core.Exceptions.View holder with order rights | Placed | AUD-CHK-007 |
| SM-CHK-01 | CheckoutSession | Open | no activity within the session expiry (setting, default not stated) | — | Expired | — |
| SM-CHK-02 | DeliverySlotBooking | (none) | order placed with a window | capacity available (BR-CHK-010) | Reserved | — |
| SM-CHK-02 | DeliverySlotBooking | Reserved | order cancelled | — | Released | capacity returned |
| SM-CHK-02 | DeliverySlotBooking | Reserved | order delivered | — | Fulfilled | — |
| SM-CHK-03 | PickupCode | (none) | pickup sub-order placed | — | Issued | hash stored |
| SM-CHK-03 | PickupCode | Issued | shipment ready for pickup | — | Sent | code sent by TRK-005 |
| SM-CHK-03 | PickupCode | Sent | LOG-012 verifies a valid code at the right outlet and hands over (IC-CHK-09 MarkUsed) | code matches; outlet matches | Used | DeliverAsync by LOG-012; AUD-CHK-004 |
| SM-CHK-03 | PickupCode | Sent | failed attempts reach the limit (IC-CHK-09 Verify) | — | Locked | manual identity check at LOG-012; AUD-CHK-004 |
| SM-CHK-03 | PickupCode | Issued / Sent / Locked | order cancelled | — | Revoked | — |
| SM-CHK-04 | CreditAccount | (none) | company applies | company account approved in IAM-022 | Applied | — |
| SM-CHK-04 | CreditAccount | Applied | finance approves with limit and terms | Checkout.Core.Credit.CreateEditDelete | Approved | AUD-CHK-005 |
| SM-CHK-04 | CreditAccount | Approved | finance suspends | reason given | Suspended | AUD-CHK-005 |
| SM-CHK-04 | CreditAccount | Suspended | finance reinstates | reason given | Approved | AUD-CHK-005 |
| SM-CHK-04 | CreditAccount | Approved / Suspended | finance closes | no open receivables | Closed | AUD-CHK-005 |
| SM-CHK-05 | PurchaseApprovalRequest | (none) | buyer submits cart above threshold | — | Pending | approvers notified |
| SM-CHK-05 | PurchaseApprovalRequest | Pending | approver approves | approver is not the requester | Approved | AUD-CHK-006 |
| SM-CHK-05 | PurchaseApprovalRequest | Pending | approver rejects with reason | — | Rejected | buyer notified; AUD-CHK-006 |
| SM-CHK-05 | PurchaseApprovalRequest | Pending / Approved | expiry passes (setting, default not stated) | — | Expired | — |
| SM-CHK-05 | PurchaseApprovalRequest | Approved | order placed with matching cart | BR-CHK-019 | Used | — |
| SM-CHK-05 | PurchaseApprovalRequest | Approved | cart changed | — | Void | — |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| CheckoutSession (new) | Id, Reference (unique), CustomerId, StoreId, CheckoutOrderGuid, Status (SM-CHK-01), ConfirmTotalHash, CreatedOnUtc, UpdatedOnUtc, PlacedOnUtc, RowVersion | CHK-003, CHK-004, CHK-008 | Plugin table; native OrderGuid stays per order |
| OrderCheckoutLink (new) | OrderId, CheckoutSessionId, VendorId, FulfilmentGroup, AllocatedAmounts (delivery, payment fee, discount, attribute fee) | CHK-004, CHK-005, CHK-008 | One row per sub-order |
| PlacementReservation (new) | Id, CheckoutSessionId, Participant, ReservationReference, Status (Reserved / Confirmed / Released / Expired), ExpiresOnUtc | CHK-003 | Bookkeeping for IC-CHK-06 so that unreleased reservations can be listed; the reserved object stays in the participant module |
| CartLineFulfilment / OrderItemFulfilment (new) | ShoppingCartItemId or OrderItemId, Method (Delivery / Pickup), PickupPointId | CHK-005 | Pickup point = StorePickupPoint (bundled Pickup.PickupInStore) |
| DeliverySlotDefinition / DeliverySlotBooking (new) | Definition: ShippingMethod or service level, Area, DayOfWeek, Start, End, Capacity, IsActive; Booking: OrderId, DefinitionId, Date, Status (SM-CHK-02) | CHK-006 | Booking Date = native Order.DesiredDeliveryDateUtc (5.00); instructions use a native CheckoutAttribute |
| Address coordinates (LOG-015, not CHK) | AddressGeo: AddressId, Latitude, Longitude, Source (pin), ValidationResult | CHK-007 | Owned by LOG-015 (BR-LOG-140); landmark, address name and PO box are native AddressAttribute values in Address.CustomAttributes |
| CountryPrivacyProfile e-transactions fields (entity owned by SEC-012) / LegalNotice / NoticeAcknowledgement (new) | Profile fields owned by CHK-009: ConfirmationTimeLimit, notice set; Notice: Checkpoint, TopicSystemName, RequiresAcknowledgement, Scope (all / category / product / service type); Acknowledgement (link only): OrderId, NoticeId or terms, IamAcceptanceId | CHK-002, CHK-009 | One profile entity per country (SEC-012, read through IC-SEC-03); policy texts are native Topics, versions MKT-008 PolicyVersion (IC-MKT-03); the acceptance itself (customer, version, time, IP) is the IAM PolicyAcceptance row (IC-IAM-05); consent texts from SEC-012 |
| CartRestrictionRule (new) | Id, Type (ProhibitedCombination / PickupOnly / DeliveryConstraint), Scope A (product / category / vendor), Scope B, Areas, MessageText (localised), IsActive, StoreId | CHK-011 | Native ACL, store limits and quantity limits remain |
| PickupCode (new) | OrderId, ShipmentId, OutletId, Method (Code / QR), CodeHash, FailedAttempts, Status (SM-CHK-03), IssuedOnUtc, UsedOnUtc, VerifiedBy | CHK-012 | Proof of collection is LOG-012's record |
| AssistedOrder (new) | OrderId, AgentCustomerId, OutletId, CreatedOnUtc | CHK-013 | The only order-to-agent record (BR-IAM-130), read by other modules through IC-CHK-10; outlet = StorePickupPoint + LOG-003 extensions; the session is IAM-026 AssistedServiceRecord; payment recorded by PAY-034 |
| CreditAccount (new) | Id, CompanyId (IAM-022) or CustomerId, CreditLimit, CurrencyCode, PaymentTermsDays, Status (SM-CHK-04), ApprovedBy, RowVersion | CHK-016 | Receivables in PAY-033 |
| PurchaseApprovalRule / PurchaseApprovalRequest (new) | Rule: CompanyId, CompanyRole, Threshold; Request: CompanyId, RequesterId, CartSnapshot, CartHash, Total, Status (SM-CHK-05), ApproverId, Reason | CHK-018 | Approval queue on ADM-006 |
| Saved-for-later list (native) | CustomWishlist (Name, CustomerId) + ShoppingCartItem.CustomWishlistId | CHK-001 | Native; no new table |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Country law profile (e-transactions, data protection) | Law profile (new): consent texts, timelines, DSAR SLAs, breach deadlines | country | CHK-009 / SEC-012 | Core |
| B2B pack settings | Company account roles, credit terms, price lists (native in 5.00: PriceList entities, catalogsettings.priceliststrategy; decision PRICE-500), approval limits | vertical (B2B pack) → client | IAM-022 / CHK-016 / CAT-039 | B2B trade pack |
| Countries, states/provinces, districts (Kenya counties, Malawi districts) | Country, StateProvince; addresssettings.countyenabled / .countyrequired (free-text County); district list (new) only if a controlled list is required | global → country → client | CHK-007 / LOG-002 / PAY-020 | Core |
| Customer attributes and checkout attributes | CustomerAttribute, CheckoutAttribute | vertical → client → store | MKT-011 / CHK-015 | Core |
| Assisted service pack settings | Agent roles, outlet assignment, receipt printer profile, cash-up rules | vertical (Assisted pack) → client | IAM-026 / CHK-013 / PAY-034 | Assisted service pack |
| Commerce extensions pack settings | Cart restriction rules, return fees, feed/syndication targets, PayPal method enablement and options (credentials entered per client instance, not stored in the pack) | vertical → client → store | CHK-011 / RET-006 / CAT-035 / PAY-003 | Commerce extensions pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Guest checkout | OrderSettings.AnonymousCheckoutAllowed (native) | client → store | On (CUS-006) | Off (FR-125) |
| One-page or multi-step checkout; billing step | OrderSettings.OnePageCheckoutEnabled, DisableBillingAddressCheckoutStep (native) | client → store | Not stated | Not stated |
| Terms of service on cart / confirm page | OrderSettings.TermsOfServiceOnShoppingCartPage, TermsOfServiceOnOrderConfirmPage (native) | client → store | Not stated | Not stated |
| Duplicate-order lock and interval | OrderSettings.PlaceOrderWithLock (native, install default off; Proposed on), MinimumOrderPlacementInterval (native, minutes, install default 1) | client | Not stated | Not stated |
| Order GUID reuse window | PaymentSettings.RegenerateOrderGuidInterval (native; owner PAY) | client | Not stated | Not stated |
| Minimum order value | OrderSettings.MinOrderSubtotalAmount, MinOrderTotalAmount, MinOrderSubtotalAmountIncludingTax (native) | client → store | Not stated | Configurable (FR-122); value not stated |
| Free delivery and pickup threshold | ShippingSettings.FreeShippingOverXEnabled, FreeShippingOverXValue, FreeShippingOverXIncludingTax (native) | client → store | Not stated | "e.g. free pickup" (FR-122); value not stated |
| Cart behaviour | ShoppingCartSettings.MiniShoppingCartEnabled, AllowCartItemEditing, AllowMultipleWishlist (native; AllowMultipleWishlist required for save for later) | client → store | Not stated | Save for later (FR-123) |
| Pickup allowed | ShippingSettings.AllowPickupInStore (native) | client → store | Not stated | On (FR-104) |
| Per-seller cart (5.00) | ShoppingCartSettings.VendorEnabled, VendorRequired (native) — fixed off (CART-500, BR-CHK-023) | global | Off | Off |
| Desired delivery date (5.00) | ShippingSettings.AllowCustomerToChooseDeliveryDate (native, install default on), DeliveryDateRangeDays (native, install default 7) | client → store | Not stated | Date of the time window (FR-106); value not stated |
| Address fields and attributes | AddressSettings.* (native); AddressAttribute: Landmark, Address name, PO box (native entity); locator rule (new) | country → client | Not stated | Landmark / pin / alias (FR-113) |
| Map pin enabled; map provider key | CHK settings (new); the provider key is flagged secret in the CHK key catalogue (BR-PLT-013, CFG-01) and is never in a configuration pack | client | Not stated | Pin (FR-113); provider not stated |
| Delivery windows and capacity | DeliverySlotDefinition (new) | client | — | Where supported (FR-106); values not stated |
| E-transactions notices and confirmation time limit | CountryPrivacyProfile e-transactions fields (owned by CHK-009 in the SEC-012 entity); LegalNotice (new) | country | Not stated (LEG-001) | ETCSA controls (FR-115); not stated |
| Cart restriction rules | CartRestrictionRule (new) | client | Not stated | Configurable (FR-111) |
| Pickup identification methods; code failure limit | CHK settings (new) | client | — | Code and QR (FR-124); limit not stated |
| Payment methods for assisted orders | PAY routing rules (owner PAY) | client | — | Not stated (MG-07) |
| Checkout session expiry; placement reservation expiry | CHK settings (new) | client | Not stated | Not stated |
| Order completed page and confirmation attachment | OrderSettings.DisableOrderCompletedPage, AttachPdfInvoiceToOrderPlacedEmail (native) | client → store | Not stated | Not stated |
| Credit terms, limits, overdue blocking | CreditAccount (new); CHK settings | client | Not stated (PH-INF) | — |
| Purchase approval thresholds | PurchaseApprovalRule (new) | client (per company) | Not stated (PH-INF) | — |
| Feature state per store | Setting productfeature.<prd-id> read through IC-PLT-02 (PLT-022) before CHK pages, widgets, providers or scheduled tasks act for a store | store, else shared | Per pack | Per pack |
| Key catalogue | Every new CHK setting key above is listed in the CHK plugin key catalogue (key, type, layer, secret flag, default) so pack validation accepts it (NFR-X-008) | global | — | — |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Cart, mini cart, saved-for-later list | CHK-001 | Native pages extended |
| Storefront | Checkout steps (address with IAM-014 default pre-selected, shipping with per-line fulfilment and IAM-015 preferred outlet, windows and estimates, payment, confirm with notices and acknowledgements) | CHK-002, CHK-005, CHK-006, CHK-009, CHK-014 | Native checkout extended |
| Storefront | Address form with landmark, name, PO box and map pin | CHK-007 | Native form extended |
| Storefront | Order completed page with checkout reference and sub-orders | CHK-008, CHK-019 | Native page extended |
| Storefront — My account | Pickup code / QR on order details | CHK-012 | New block |
| Storefront — B2B | Quick order (SKU entry, upload), saved lists, approval requests and approver queue | CHK-017, CHK-018 | New (or licensed plugin for CHK-017) |
| Admin | Cart restriction rules; delivery windows; e-transactions notices | CHK-006, CHK-009, CHK-011 | New |
| Admin | Credit accounts | CHK-016 | New |
| Admin | Checkout exceptions (split placement, unsent confirmations, participant errors, unreleased reservations) | CHK-004, CHK-009 | New |
| Admin — outlet | Place order for customer (native impersonation start, IAM agent filter), assisted orders list | CHK-013 | Native impersonation + new list; pickup-code entry is on the LOG-012 handover screen |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Chk.SavedForLater | Saved for later | AC-CHK-001-03-01 (name of the list) |
| Chk.TermsRequired | Please accept the terms of service to place your order. | AC-CHK-002-05-01 |
| Chk.PriceChanged | The price of one or more items has changed. Please check the new total and confirm again. | AC-CHK-003-01-02 |
| Chk.PaymentMethodInvalid | The selected payment method is no longer available for this order. Please choose another method. | AC-CHK-003-02-01 |
| Chk.CartCheckUnavailable | We could not check this item just now. Please try again later. | AC-CHK-003-03-03 |
| Chk.SplitPlacementFailed | We could not complete your order. Please contact us with your checkout reference. | AC-CHK-004-01-05 |
| Chk.MultiSellerNotSupported | Items from different sellers cannot yet be bought in one order. Please buy them in separate orders. | AC-CHK-004-01-07 |
| Chk.SlotFull | The delivery window you chose is now full. Please choose another window. | AC-CHK-006-01-03 |
| Chk.AddressLocatorRequired | Please give a street address, a landmark or a map pin so we can find you. | AC-CHK-007-01-03 |
| Chk.AcknowledgementRequired | Please confirm that you have read the returns and refund policy. | AC-CHK-009-02-01 |
| Chk.CartRuleViolation | This item cannot be ordered with the items in your cart: {rule text} | AC-CHK-011-01-01, AC-CHK-011-02-02 |
| Chk.PickupOnly | This item can only be collected from an outlet. | AC-CHK-011-02-01 |
| Chk.PickupCodeInvalid | The pickup code is not valid for this outlet. | AC-CHK-012-02-02, AC-CHK-012-02-04 (shown by LOG-012) |
| Chk.PickupCodeUsed | This pickup code has already been used. | AC-CHK-012-02-03 (shown by LOG-012) |
| Chk.PickupCodeLocked | Too many wrong codes. Check the customer's identity before handing over. | AC-CHK-012-02-02 (shown by LOG-012) |
| Chk.PickupCode | Your pickup code for order {order number} at {outlet}: {code} | AC-CHK-012-01-03, AC-CHK-019-01-04 (TRK-005 event code; inactive by default) |
| Chk.CreditLimitExceeded | This order is above your available credit. Choose another payment method or contact us. | AC-CHK-016-03-01 |
| Chk.QuickOrderSkuNotFound | Product code not found: {code} | AC-CHK-017-01-01 |
| Chk.ApprovalRequired | This order needs approval from your company before it can be placed. | AC-CHK-018-01-02 |
| Chk.OrderPlacedGroup | Your order {reference} has been placed. It will be delivered by {count} sellers. | AC-CHK-019-01-03, AC-CHK-019-01-04 (text; email uses message template Chk.OrderPlacedGroup.CustomerNotification) |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Native resources (Checkout.MinOrderPlacementInterval, Checkout.MinOrderSubtotalAmount, cart warnings) are reused unchanged. Messages of other modules shown in CHK flows are defined there: Pay.CheckoutRestricted, Pay.MethodNotAllowed (PAY), Log.SellerAreaNotCovered, Log.EdtRange (LOG), Iam.AgentNotAssigned (IAM), Ord.OrderOnHold (ORD). An agent without an outlet is refused by the IAM agent filter (Iam.AgentNotAssigned); CHK has no message of its own for it.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| PAY (internal) | Routing-rule check and risk evaluation at placement; group payment for split checkout; payment recording for assisted orders; open receivables for available credit | PAY-001, PAY-018, PAY-011, PAY-034, PAY-033 | IC-CHK-02 = IC-PAY-03, IC-CHK-04 = IC-PAY-02, IC-PAY-08 |
| LOG (internal) | Delivery estimate; outlets; serviceability and seller coverage at placement; address coordinates; pickup-code check and handover | LOG-005, LOG-003, LOG-004, LOG-015, LOG-012 | IC-CHK-03, IC-CHK-02, IC-CHK-09 |
| Cart check and subtotal providers (internal) | Add warnings or replace a named native warning; adjust a line subtotal | CAT, INV-004, ADM-005, SVC, EGV-001, ORD-027, MKT-002 | IC-CHK-01, IC-CHK-05 (OVR-REG) |
| Order processing providers (internal) | Placement reservations, seller task creation, order-action guards, cancellation clean-up | ADM-005, MKT-001, ORD-005, ORD-010 | IC-CHK-06, IC-CHK-07, IC-CHK-08 (OVR-REG) |
| IAM (internal) | Single impersonation filter on the acting session; default address and preferred pickup point | IAM-026, IAM-014, IAM-015 | BR-IAM-130 (decision SINGLE-FILTER); CustomerPreference |
| Assisted order readers (internal) | Agent and outlet of an order | CHN-009, IAM-008, RPT | IC-CHK-10 |
| SEC (internal) | Country profile (e-transactions fields owned by CHK-009); audit trail | SEC-012, SEC-004 | IC-SEC-03, IC-SEC-01 |
| IAM and MKT (internal) | Acceptance records of acknowledgements and checkout terms; Effective policy versions | IAM-016, MKT-008 | IC-IAM-05, IC-MKT-03 (decision ONE-RECORD) |
| RET (internal) | Refunds decided on placement exceptions | RET-005 | IC-RET-04 |
| Notifications | Order confirmation, pickup code, approval requests; event-code registration at installation | TRK-005 (IC-TRK-04 SendEvent, RegisterEventCode), CHN-005 (SMS through TRK-005) | Decision MSG-ROUTE: CHK sends no message outside TRK-005 |
| Map provider | Pin capture and display | Not named | Not stated in source |
| Bulk order plugin (CHK-017) | SKU entry and upload | nopStation Bulk Order (candidate; 5.00 build to confirm, VER-500) | Licensed plugin; build fallback |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-CHK-01 | Cart check provider (CHK-003 hosts) | Cart lines, or the candidate item at add to cart or update (product, quantity, attributes XML, customer-entered price, rental start and end dates, shopping cart item ID if any), customer, store, cart type, fulfilment choices, the native warnings produced so far with their resource keys | Warnings to add (message key + text); for a registered replacer only, the native warning it replaces and its replacement | Provider error (item refused, Chk.CartCheckUnavailable) | Called by the single CHK-003 IShoppingCartService override from GetShoppingCartItemWarningsAsync, GetShoppingCartWarningsAsync, GetStandardWarningsAsync and GetRentalProductWarningsAsync. Providers: CAT (quantity multiples, call-for-price quote exemption, over-maximum approval, slot hold, service area), INV-004 (holds; replacer of the stock warning), ADM-005 (eligibility, quota), SVC (rental availability), EGV-001 (service workflow check), CHK-011 (cart rules, including LOG-004 delivery constraints), ORD-027 (sample limits), CHK-004 (single-seller rule BR-CHK-022). Registration order fixes the call order. |
| IC-CHK-02 | Placement validator (CHK-003 hosts) | PlaceOrderContainer details, ProcessPaymentRequest, CheckoutSession | Pass, or refusal with message key | — | Called in order by the IOrderProcessingService.PlaceOrderAsync override before payment (BR-CHK-005); PAY-001 routing and PAY-018 risk (PAY side IC-PAY-03), LOG-004 serviceability and seller coverage, CHK-011 restrictions and CHK-018 approval are validators |
| IC-CHK-03 | Delivery estimate | Shipping option or pickup point, address, cart, placement time | Earliest and latest date, or none | No estimate (CHK-014 falls back) | Supplied by LOG-005 (BR-LOG-030); displayed by CHK-014 with message Log.EdtRange |
| IC-CHK-04 | Checkout payment (group) | CheckoutSession reference, total, share per seller, payment method (called once, before any sub-order is saved, BR-CHK-006) | One payment result for the checkout, applied by native placement to every sub-order saved; each sub-order is linked to the group transaction when the PAY participant Confirm (IC-CHK-06) runs after its save | Payment failed (all sub-orders stay Pending) | Supplied by PAY as IC-PAY-02 (BR-PAY-014, Proposed); CHK-004 calls it once per checkout; adapters declare group support |
| IC-CHK-05 | Line subtotal adjuster (CHK-003 hosts) | ShoppingCartItem, includeDiscounts, the native result (subTotal, discountAmount, appliedDiscounts, maximumDiscountQty) | Adjusted subTotal, discountAmount, appliedDiscounts, maximumDiscountQty | — | Called by the CHK-003 override of IShoppingCartService.GetSubTotalAsync after the native method; one adjuster for the product: MKT-002 buy-X-get-Y (IC-MKT-01) |
| IC-CHK-06 | Placement participant (CHK-003 hosts): Reserve / Confirm / Release | Reserve: PlaceOrderContainer details, CheckoutSession; Confirm: reservation, saved sub-order; Release: reservation, reason | Reserve: reservation reference, or refusal with message key; Confirm and Release: done | Participant error (Reserve: placement refused; Confirm: placement exception, AUD-CHK-007; Release: logged, reservation ends at expiry) | Called by the CHK-003 PlaceOrderAsync override (BR-CHK-020). Participants: ADM-005 quota ('adm-quota-{quotaId}'); MKT-001 limited-use discounts (IC-MKT-04, 'mkt-discount-{DiscountId}'); CHK-006 delivery window ('chk-slot-{SlotId}-{Date}'); CHK-016 credit ('chk-credit-{CreditAccountId}'); CAT-042 order-total adjustments (BR-CAT-033), the only participant for IC-CAT-06 providers (PAY-009 wallet under WAL-01 option (b) under 'pay-wallet-{WalletId}'; FIN-003 premium if confirmed); FIN-004 subsidy budget (BR-FIN-007, 'fin-scheme-{SchemeId}'); PAY-011 group payment, Confirm only (links the sub-order, BR-PAY-014); ORD-005 seller task creation, Confirm only (IC-ORD-09) |
| IC-CHK-07 | Order-action guard (CHK-003 hosts) | Action (Ship, ReadyForPickup, Deliver), shipment, order, acting user | Allow, or refuse with message key | — | Called by the CHK-003 override of IOrderProcessingService.ShipAsync, ReadyForPickupAsync and DeliverAsync before the native method (BR-CHK-021); ORD-010 hold is a guard. Shipment insert is guarded by the ORD-010 shipment-guard host, not here |
| IC-CHK-08 | Cancellation participant (CHK-003 hosts) | Cancelled order, previous order status | Done | Participant error (listed as checkout exception; cancellation stands) | Called by the CHK-003 override of IOrderProcessingService.CancelOrderAsync after the native method (BR-CHK-021); participants: CHK-006 window release, CHK-012 code revocation |
| IC-CHK-09 | Pickup code check (CHK-012 provides, LOG-012 calls) | Verify: shipment, outlet, entered or scanned code; MarkUsed: shipment, verifying user | Verify: Valid / Invalid / Used / Locked with message key (Chk.PickupCodeInvalid, Chk.PickupCodeUsed, Chk.PickupCodeLocked); MarkUsed: done | Unknown shipment | CHK-012 service; called by the LOG-012 handover step inside its shipment lock, ILocker key 'shipment-{ShipmentId}' (BR-LOG-001); Verify also counts attempts inside that lock |
| IC-CHK-10 | Assisted order read (CHK-013 provides; CHN-009, IAM-008, RPT call) | GetAssistedOrder: order ID; ListAssistedOrders: agent, outlet, period | Agent customer ID, outlet ID, placed on (UTC); or "not assisted"; a list for the filter | — | CHK-013 read service over AssistedOrder (Proposed); read only |
| IC-CHK-11 | Order splitter (CHK-004 provides; the CHK-003 placement host calls it) | Cart lines with seller and fulfilment choice, order-level amounts, CheckoutSession | Groups of cart lines, one per sub-order, with the order-level amounts allocated by BR-CHK-007 | Splitter error (placement refused, nothing saved) | Registered only when the Marketplace pack is on; at most one splitter; without it the host places one order (BR-CHK-006) |

Operation signatures (C# interfaces) are produced at L2 build start and approved by the tech lead; this table fixes the operations. Under decision OVR-REG (Proposed) CHK-003 owns both the IShoppingCartService and the IOrderProcessingService overrides; IC-CHK-01, IC-CHK-02 and IC-CHK-05 to IC-CHK-08 are the provider contracts through which other modules plug in. Providers are registered through DI as implementations of the provider interface (one class per module), never as a second override; both overrides are entered in the ADM extension register (BR-ADM-001). IC-CHK-04 is the consumer side of PAY IC-PAY-02 and IC-CHK-02 of PAY IC-PAY-03 (same contracts). Until BR-PAY-014 group payment is approved, CHK-004 is buildable only for single-seller carts (BR-CHK-022). IC-CHK-09 and IC-CHK-10 are CHK services that other modules call.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Checkout.Placed (per CheckoutSession) | OrderPlacedEvent per sub-order (native, raised in the override) | ORD-005 seller task is created by the ORD participant through IC-CHK-06 Confirm before the event (not by a consumer); TRK, RPT and IAM-026 consumers notify or record only |
| Checkout.PlacementException | None (CHK event) | Checkout exceptions list, admin notification |
| Pickup code sending | ShipmentReadyForPickupEvent (native) | Native ShipmentReadyForPickup.CustomerNotification carries the CHK-012 code token (TRK-012); where enabled, the CHK consumer enqueues event code Chk.PickupCode (IC-TRK-04); it does not change the order |
| Slot release and code revocation | Order cancelled through IOrderProcessingService.CancelOrderAsync (any path) | CHK-006 and CHK-012 cancellation participants run inside the CHK-003 override after the native method (IC-CHK-08), not in a consumer |
| Order-action guard | IOrderProcessingService ShipAsync / ReadyForPickupAsync / DeliverAsync (CHK-003 override) | ORD-010 refuses while a hold is active (IC-CHK-07) |
| Acknowledgement recorded | None (CHK call to IC-IAM-05; no CHK event) | IAM writes the acceptance (AUD-IAM-012); CHK writes the order link (AUD-CHK-002) |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Double click on Confirm on one web node | CHK-008 | Native named Mutex per customer (PlaceOrderWithLock on) and the interval cache key; second request gets Checkout.MinOrderPlacementInterval |
| Same confirm request on two web nodes | CHK-008 | PLT-027 idempotency key (CheckoutSession reference + cart hash); the native lock is per host (L1 §6.4) |
| Placement (single or split) and a second checkout by the same customer | CHK-003 (with the CHK-004 splitter) | The CHK-003 placement host holds the native lock for the whole checkout, including every sub-order; the second checkout waits, then sees the interval key |
| Two customers take the last reserved quota units or the last uses of a limited discount | CHK-003 (ADM-005, MKT-001 participants) | IC-CHK-06 Reserve under ILocker key 'adm-quota-{quotaId}' or 'mkt-discount-{DiscountId}'; the second placement is refused with the participant message (BR-CHK-020) |
| Two orders take the last delivery-window place | CHK-006 | ILocker key 'chk-slot-{SlotId}-{Date}' in the CHK-006 participant; the second placement is refused (Chk.SlotFull) |
| Two on-account orders of one company at once | CHK-016 | ILocker key 'chk-credit-{CreditAccountId}'; CreditAccount row version |
| Pickup code verified at two counters at once | CHK-012 (called by the LOG-012 handover step) | IC-CHK-09 runs inside the LOG-012 shipment lock, ILocker key 'shipment-{ShipmentId}' (BR-LOG-001, shared with TRK); the second sees Used |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Order placed | Shopper | Email (native OrderPlaced.CustomerNotification, or Chk.OrderPlacedGroup.CustomerNotification for split checkout) + SMS if configured (TRK-005) | CHK-019 |
| Order placed (seller part) | Seller | Email (native OrderPlaced.VendorNotification) | CHK-004 |
| Pickup code / QR | Shopper | SMS (CHN-005) and email, per TRK-005 configuration | CHK-012 |
| Approval requested / approved / rejected | Approver / buyer | Email through TRK-005 (ADM-006 queue notification step, BR-TRK-023) and the ADM-006 queue | CHK-018 |
| Confirmation not sent within the time limit | Client staff | Admin notification | CHK-009 |
| Split placement exception or participant error | Client staff | Admin notification | CHK-004 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Assisted orders by agent and outlet | CHK-013 | D |
| Checkout exceptions | CHK-004, CHK-009 | Proposed |
| Credit usage by company | CHK-016 | D |
| Acknowledgement records by order (CHK link joined to the IAM consent trail, IC-IAM-05 GetConsentTrail) | CHK-009 | REQ-MPC-FR-117 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-CHK-001 | Configuration change (cart rule, delivery window, e-transactions notice) | Administrator | Rule entity | old values, new values |
| AUD-CHK-002 | Acknowledgement linked to order (the acceptance itself is audited by IAM, AUD-IAM-012) | Shopper | NoticeAcknowledgement | order, notice, IAM acceptance id |
| AUD-CHK-003 | Assisted order placed | Agent | AssistedOrder | agent, outlet, customer, order |
| AUD-CHK-004 | Pickup code checked (valid, failed), locked, used or revoked | Outlet staff through LOG-012 / system | PickupCode | outlet, result, attempts |
| AUD-CHK-005 | Credit account change | Finance staff | CreditAccount | old and new limit, terms, status, reason |
| AUD-CHK-006 | Purchase approval decision | Company approver | PurchaseApprovalRequest | decision, reason, total |
| AUD-CHK-007 | Split placement exception, participant error and its resolution | System / staff | CheckoutSession | sub-orders saved, payment reference, participant, resolution |

All audit events are written to the platform audit trail through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id (the CheckoutSession reference where one exists); old and new entity values are captured by the IRepository<> decorator (BR-SEC-010). CHK writes every table through IRepository<>; the native activity log is not used as audit. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-CHK-001 | No duplicate order or charge under retry or double submission, on one or several web nodes. | REQ-MPC-FR-114; NFR-X-007 | AC-CHK-008-03-01, AC-CHK-008-03-02; T-CHK-02 |
| NFR-CHK-002 | Prices and totals are calculated on the server only. | REQ-MPC-FR-121; BR-CHK-003 | AC-CHK-002-04-02; T-CHK-03 |
| NFR-CHK-003 | Checkout is served over HTTPS and every POST is antiforgery-protected. | REQ-KTDA-CHK-002; REQ-MPC-FR-121 | AC-CHK-002-04-01 |
| NFR-CHK-004 | Pickup codes are not guessable and are stored only as hashes. | BR-CHK-016 (Proposed) | AC-CHK-012-01-02; T-CHK-05 |
| NFR-CHK-005 | Checkout response time and low-bandwidth targets: Not stated in source — requires confirmation. | NFR-X-006; NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-CHK-001 | P1 | — | |
| PRD-CHK-002 | P1 | — | |
| PRD-CHK-003 | P1 | — | PRD-CHK-004 |
| PRD-CHK-004 | P1 | PRD-PAY-010, PRD-SEL-017, PRD-CHK-003 | |
| PRD-CHK-005 | P1 | — | |
| PRD-CHK-006 | P1 | — | |
| PRD-CHK-007 | P1 | — | |
| PRD-CHK-008 | P1 | — | |
| PRD-CHK-009 | P1 | — | |
| PRD-CHK-010 | P1 | — | |
| PRD-CHK-011 | P1 | — | |
| PRD-CHK-012 | P1 | PRD-CHN-005 | |
| PRD-CHK-013 | P1 | — | |
| PRD-CHK-014 | P1 | PRD-LOG-005 | |
| PRD-CHK-015 | P1 | — | |
| PRD-CHK-016 | P1 | PRD-IAM-022, PRD-PAY-033 | |
| PRD-CHK-017 | P1 | — | |
| PRD-CHK-018 | P1 | PRD-ADM-002, PRD-IAM-022 | |
| PRD-CHK-019 | P1 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-CHK-01 | Split checkout: carts with 1, 2 and 3 sellers, with and without PlaceOrderWithLock; assert one order per seller, exact allocation (BR-CHK-007), one payment, no interval refusal between sub-orders, the desired delivery date on every sub-order and VendorEnabled off (no Stash items); with group payment off, a multi-seller cart is refused (BR-CHK-022). |
| T-CHK-02 | Duplicate submission: double click on one node, replay on a second node; assert one order and one payment initiation. |
| T-CHK-03 | Tampering: post a changed total or price; assert the server total is used and the price-change refusal (BR-CHK-004) works. |
| T-CHK-04 | Guest rule: run checkout with AnonymousCheckoutAllowed on and off; post directly to every checkout action as a guest. |
| T-CHK-05 | Pickup codes through IC-CHK-09: wrong code, used code, wrong outlet, lock after the limit; database holds no plain code. |
| T-CHK-06 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-CHK-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
| T-CHK-08 | Providers (OVR-REG): with every registered IC-CHK-01 provider, each warning appears at add to cart and again at placement; only registered replacers remove a native warning; a throwing provider refuses the item; GetSubTotalAsync returns the MKT-002 adjusted value on cart, totals and placement paths; the container holds exactly one IShoppingCartService and one IOrderProcessingService product override. |
| T-CHK-10 | Records owned elsewhere: an acknowledgement and the checkout terms acceptance create one IAM acceptance (IC-IAM-05) and one CHK link, and no CHK acceptance row; IC-CHK-10 returns agent and outlet of an assisted order and "not assisted" for others; CHK registers its two event codes at installation (IC-TRK-04). |
| T-CHK-09 | Participants and guards: concurrent placements against the last quota unit, the last discount use and the last window place (one succeeds); payment failure releases every reservation; a hold refuses ShipAsync, ReadyForPickupAsync and DeliverAsync from admin, seller, tracking and API paths; cancellation runs window release and code revocation. |
