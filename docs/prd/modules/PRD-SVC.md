# L2 Module PRD — SVC: Services commerce (booking, delivery and completion of services; SVC-007 covers electronically delivered goods)

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | SVC — Services commerce (booking, delivery and completion of services; SVC-007 covers electronically delivered goods) |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets the shop sell services the way they are delivered: priced by time, by unit or by quote; delivered by named providers and resources with qualifications, hours, coverage and capacity; booked at the customer site, at an outlet or remotely; changed, cancelled or missed under client rules; paid in full, by deposit or later; moved through service stages to a customer sign-off that releases payment or starts a refund; tracked against service-level targets with escalation; redeemed by voucher or e-ticket; reminded and followed up; and reported. It also covers electronically delivered goods (downloads) and the hire of items for a period.

**In scope**

- Service pricing: fixed, per time unit, per unit, from-price, price on request (SVC-001)
- Service providers and resources: type, qualifications, working hours, coverage, capacity per slot; availability supplied to CAT-027 (SVC-002)
- Booking changes, cancellations and no-shows under per-service policy (SVC-003)
- Deposits and advance payment as separate orders linked to the booking (SVC-004)
- Service order stages, completion, customer sign-off, release to payout and refund on failure (SVC-005)
- Service location at booking: customer site with map pin, outlet, remote; coverage check (SVC-006)
- Digital products and downloads on native downloadable products (SVC-007)
- Rental and hire with date availability (SVC-008)
- Service vouchers and e-tickets with code or QR and redemption (SVC-009)
- Service reminders before and feedback requests after (SVC-010)
- Service-level targets, tracking and escalation for service orders (SVC-011)
- Service reports (SVC-012)

**Not in this module**

| Item | Where it is |
|---|---|
| Service listings, service details and coverage area on the listing | CAT module (PRD-CAT-026) |
| Slot calendar, booking creation and slot holds | CAT module (PRD-CAT-027) — SVC-002 supplies availability, SVC-003 owns later changes |
| Configurable order status model and line stage-set definitions | ORD module (PRD-ORD-002) — holds the service stage set and checks transitions (IC-ORD-10); SVC-005 keeps the per-line stage |
| Cut-off times and delivery service levels | ORD module (PRD-ORD-011) — SVC-011 applies targets to service orders |
| Request for quotation | ORD module (PRD-ORD-012, Misc.RFQ) — SVC-001 starts it for price-on-request services |
| Refund money movement and refund triggers | PAY module (PRD-PAY-016); RET module (PRD-RET-005) |
| Seller settlements and payouts | SEL module (PRD-SEL-017) — SVC-005 marks lines eligible after sign-off |
| Serviceability rules by location | LOG module (PRD-LOG-004) — SVC-006 checks against them |
| Pickup points and outlets | LOG module (PRD-LOG-003) |
| Notification engine, channels and preferences | TRK module (PRD-TRK-005, TRK-006) |
| Product reviews and ratings | CAT module (PRD-CAT-029) |
| Gift cards and store credit | MKT module (PRD-MKT-004) |
| Services browsing area for the operator | SRC module (PRD-SRC-020) |
| Financial and partner services catalogue | FIN module (PRD-FIN-005) |
| e-Government appointments and applications | EGV module (PRD-EGV-002, EGV-003) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-SVC-001 | Service pricing models | B2B + B2C | P2 | Code-level | Custom plugin + Theme/view override | Services and bookings pack | PRD-CAT-026 | PO-REC-v8 |
| PRD-SVC-002 | Service providers and resources | Seller / back-office | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-026 | |
| PRD-SVC-003 | Booking changes, cancellations and no-shows | B2B + B2C | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-027 | FG-06, PO-REC-v8 |
| PRD-SVC-004 | Deposits and advance payment for bookings | B2B + B2C | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-027, PRD-PAY-016 | FG-06, PO-REC-v8 |
| PRD-SVC-005 | Service order lifecycle and completion sign-off | B2B + B2C | P1 | Code-level | Custom plugin | Services and bookings pack | PRD-ORD-002 | |
| PRD-SVC-006 | Service location at booking | B2B + B2C | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-LOG-004 | PO-REC-v8 |
| PRD-SVC-007 | Digital products and downloads | B2B + B2C | P2 | Configuration | None | Core (always on) | | PO-REC-v8 |
| PRD-SVC-008 | Rental and hire | B2B + B2C | P2 | Code-level | Custom plugin | Services and bookings pack | | |
| PRD-SVC-009 | Service vouchers and e-tickets | B2B + B2C | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-026 | PO-REC-v8 |
| PRD-SVC-010 | Service reminders and follow-up | B2B + B2C | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-TRK-005 | PO-REC-v8 |
| PRD-SVC-011 | Service-level targets for service orders | Platform / back-office | P1 | Code-level | Custom plugin | Services and bookings pack | PRD-ORD-011 | |
| PRD-SVC-012 | Service reports | Platform / back-office | P2 | Code-level | Custom plugin | Services and bookings pack | PRD-CAT-027 | FG-06, PO-REC-v8 |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Books, pays, reschedules, cancels, signs off or reports a service not delivered, downloads digital items, hires items, holds vouchers | Guests / Registered (native) |
| Business buyer | As shopper; requests quotes for price-on-request services | Registered + B2B role (IAM-022) |
| Service provider (seller) | Maintains resources and availability, confirms, schedules, starts and completes service orders, records no-shows, redeems vouchers | Vendors (native) + IAM-007 |
| Client operations staff | Sets service policies and service-level targets, handles escalations and disputed completions, acts on bookings for customers | Role system name "Operations" (BR-IAM-050) |
| Outlet staff (agent) | Redeems vouchers at outlets; takes balance payments at the counter (PAY-034) | Role system name "Agent" (BR-IAM-050; IAM-026) |
| Member of finance staff | Sees deposits, balances and refunds raised by service rules | Role system name "Finance" (BR-IAM-050) |
| Client administrator | Configures service products, pricing models, downloadable products, rental products | Administrators (native) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Services.Resources.View | Catalog | View providers, resources, qualifications, working hours and capacity (vendors: own only) | Administrators, Operations, Vendors |
| Services.Resources.CreateEditDelete | Catalog | Create and change resources, qualifications, working hours, coverage and capacity (vendors: own only) | Administrators, Operations, Vendors |
| Services.Bookings.View | Orders | View bookings, service stages, payment plans, no-shows and SLA clocks (vendors: own only) | Administrators, Operations, Vendors |
| Services.Bookings.CreateEditDelete | Orders | Change service stages, reschedule or cancel for a customer, record no-shows, decide disputed completions (always with a reason, audited) | Operations, Vendors (stage changes and provider no-show reports on own orders only) |
| Services.Policies.CreateEditDelete | Configuration | Edit cancellation, no-show, deposit, sign-off, reminder and service-level policies | Administrators, Operations |
| Services.Vouchers.Redeem | Orders | Validate and redeem vouchers and e-tickets (vendors: own services only) | Vendors, Agent |
| Services.Reports.View | Reports | Run service reports (vendors: own only) | Administrators, Operations, Vendors |

Permissions are declared in the SVC plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager), with the plugin prefix and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is taken from the native set. Every role name is spelled exactly as in the IAM product role catalogue BR-IAM-050 (Operations, Finance and Agent are in it). The IAM plugin creates every missing catalogue role (BR-IAM-050); the SVC plugin does not rely on native start-up to create them. Vendor users are limited to their own resources, bookings and orders by Customer.VendorId; SVC endpoints check that the record belongs to the current vendor (WebWorkContext.GetCurrentVendorAsync). Service products, pricing fields, downloadable and rental settings are native product fields edited under native Catalog.ProductsCreateEditDelete; no SVC duplicate. All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-SVC-PERM-01 | **Given** a user without Services.Resources.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SVC-PERM-02 | **Given** a user without Services.Resources.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SVC-PERM-03 | **Given** a user without Services.Bookings.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SVC-PERM-04 | **Given** a user without Services.Bookings.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SVC-PERM-05 | **Given** a user without Services.Policies.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SVC-PERM-06 | **Given** a user without Services.Vouchers.Redeem, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SVC-PERM-07 | **Given** a user without Services.Reports.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-SVC-001 | Fixed price, call for price, customer-entered price, rental pricing per day/week/month/year (RentalPricePeriod unchanged), RFQ plugin, plus new 5.00 price lists per customer/role. | Per-hour period (RentalPricePeriod has Days/Weeks/Months/Years only) and unit labels (per hectare/parcel) on price display. Custom plugin + view override. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SVC-002 | Vendors can represent providers; warehouses represent locations. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No resource/booking entity in src/Libraries/Nop.Core/Domain] | Staff/teams/equipment resources, qualifications, working hours, coverage area, slot capacity. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SVC-003 | Order cancel (admin; 4.90 customer self-cancel). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:OrderSettings.AllowCustomersCancelOrders] | Booking reschedule/cancel rules with fees, no-show handling. Custom plugin (booking entity). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SVC-004 | None: PaymentStatus has no partially-paid state; order total paid in one payment. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Payments/PaymentStatus.cs:PaymentStatus] | Deposit and balance collection and policy-based deposit refund via separate orders or a custom payment method; override IOrderProcessingService / IOrderTotalCalculationService only if the balance must stay on the same order (decide at L2). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SVC-005 | Fixed order statuses; shipment delivered; refunds. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderStatus.cs:OrderStatus] | Service stages, customer completion sign-off, release/refund on outcome. Custom plugin (depends on PRD-ORD-002). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SVC-006 | Shipping address and pickup point selection at checkout. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/Order.cs:Order.ShippingAddressId, PickupAddressId] | Service location type (site with map pin / outlet / remote) and provider coverage check. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SVC-007 | Downloadable products: download file, unlimited or max downloads, expiry days, activation when paid or manual, license file per order item, user agreement, sample download; 'Downloadable products' account page. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.IsDownload, MaxNumberOfDownloads, UnlimitedDownloads, DownloadExpirationDays, DownloadActivationTypeId, HasUserAgreement; src/Libraries/Nop.Core/Domain/Orders/OrderItem.cs:OrderItem.DownloadCount, LicenseDownloadId] | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SVC-008 | Rental products: start/end date entry, price by rental period, date validation (end after start, future start). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.IsRental, RentalPriceLength, RentalPricePeriodId; src/Libraries/Nop.Services/Orders/ShoppingCartService.cs:GetRentalProductWarningsAsync; src/Presentation/Nop.Web/App_Data/Localization/defaultResources.nopres.xml ShoppingCart.Rental.*] | Availability check for the chosen dates (no overlap/booking check in rental warnings). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SVC-009 | Gift cards (store credit) only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/GiftCard.cs:GiftCard] | Service voucher/e-ticket with code/QR and provider redemption scan. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SVC-010 | Message templates with DelayBeforeSend, queued email task; 5.00 reminders cover abandoned carts, pending orders and incomplete registration only (Libraries/Nop.Services/Reminders/NopReminderDefaults.cs). No booking reminders or post-service feedback requests. | Pre-service reminders and post-service feedback requests. Custom plugin (scheduled task + templates). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SVC-011 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No SLA entity in src/Libraries/Nop.Core/Domain] | Response/completion targets per service, tracking and escalation (depends on PRD-ORD-011). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SVC-012 | Sales and bestseller reports only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Orders/OrderReportService.cs] | Booking, utilisation, no-show and SLA reports. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |


## 7. Feature specifications


### 7.1 PRD-SVC-001 Service pricing models

| Item | Value |
|---|---|
| Description (baseline) | Services can be priced the way services are really sold: a fixed price, a price per hour, day or week, a price per unit (for example per hectare or per parcel), a 'from' price, or 'price on request' leading to a quote. |
| Why it matters | Lets each service be charged the way it is delivered: by time, by unit, or by quote. |
| Who benefits | Service providers; shoppers; business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | PRD-CAT-026 |
| Status | On hold: PO-REC-v8 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-001-01 | As a service provider, I want to sell a service at a fixed price, so that simple services are bought like any item. | D; FC-M01-028 | On hold: PO-REC-v8 |
| US-SVC-001-02 | As a service provider, I want to price a service per hour, day or week, so that time-based services are charged for the time booked. | D; FC-M01-029 | On hold: PO-REC-v8 |
| US-SVC-001-03 | As a service provider, I want to price a service per unit such as per hectare or per parcel, with the unit shown next to the price, so that the customer pays for the quantity of work. | D | On hold: PO-REC-v8 |
| US-SVC-001-04 | As a service provider, I want to show a from-price when the final price depends on the options chosen, so that customers see the lowest price before choosing. | D | On hold: PO-REC-v8 |
| US-SVC-001-05 | As a business buyer, I want to request a quote for a service marked price on request and then order at the quoted price, so that custom work is priced for my needs. | D | On hold: PO-REC-v8 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-001-01-01 | US-SVC-001-01 | **Given** a service product has a price and no pricing model other than Fixed, **when** the shopper adds it to the cart, **then** the native price applies and the item is ordered at that price. | D; FIT (Product.Price) |
| AC-SVC-001-02-01 | US-SVC-001-02 | **Given** a service uses the Per time unit model with unit Hour, Day or Week and a unit price, **when** the shopper books it through CAT-027 for a slot of a given length, **then** the quantity is set to the number of units covered by the slot (whole units, rounding up — Proposed) and the line total is unit price × quantity. | D; FC-M01-029; Proposed (unit model instead of RentalPricePeriod, which has no Hour) |
| AC-SVC-001-03-01 | US-SVC-001-03 | **Given** a service uses the Per unit model with unit label "hectare", **when** the shopper opens the product page, **then** the price is shown with the localised unit label (for example "per hectare") and the quantity box is labelled with the unit. | D; Proposed (view override) |
| AC-SVC-001-03-02 | US-SVC-001-03 | **Given** a Per unit service has a minimum and maximum number of units, **when** the shopper enters a quantity outside them, **then** the native quantity warning is shown and the item is not added. | FIT (Product.OrderMinimumQuantity, OrderMaximumQuantity) |
| AC-SVC-001-04-01 | US-SVC-001-04 | **Given** a service has required attributes whose values change the price and CatalogSettings.DisplayFromPrices is on, **when** the service is listed, **then** the native from-price (lowest possible price) is shown with the From label. | D; FIT (5.00.1: ProductModelFactory.GetFromPriceAsync, Presentation/Nop.Web/Factories/ProductModelFactory.cs:267) |
| AC-SVC-001-05-01 | US-SVC-001-05 | **Given** a service is marked Price on request in SVC (CallForPrice and DisableBuyButton stay off), **when** the shopper opens the product page, **then** no price is shown and the buy button is replaced by Request a quote, which calls IC-ORD-08 (ORD-012) to create a quote request for that service without using the cart. | D; Proposed (SVC flag); FIT (CallForPrice / DisableBuyButton items fail PlaceOrderAsync cart warnings) |
| AC-SVC-001-05-02 | US-SVC-001-05 | **Given** a service is Price on request, **when** anyone posts AddProductToCart_Catalog or AddProductToCart_Details for it directly, **then** the SVC action filter refuses it with message Svc.QuoteRequired; only lines created from an accepted quote (Misc.RFQ) enter the cart. | Proposed; FIT (5.00.1: Presentation/Nop.Web/Controllers/ShoppingCartController.cs:791, AddProductToCart_Details(productId, shoppingCartTypeId, form, customwishlistid) — the filter reads the product id only) |
| AC-SVC-001-05-03 | US-SVC-001-05 | **Given** a quote for the service is accepted, **when** the cart is created from the quote, **then** the quoted unit price applies through the Misc.RFQ GetShoppingCartItemUnitPriceEvent handler and the order is placed at that price. | FIT (Misc.RFQ EventConsumer) |

**Business rules applied:** BR-SVC-001; BR-SVC-002 (§8.1).


### 7.2 PRD-SVC-002 Service providers and resources

| Item | Value |
|---|---|
| Description (baseline) | Records who or what delivers each service — staff, teams, equipment or vehicles — with their qualifications, working hours, the area they cover and how many bookings they can take per time slot. |
| Why it matters | Bookings are only accepted when someone is actually free and qualified to deliver them. |
| Who benefits | Service providers; client operations staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CAT-026 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-002-01 | As a service provider, I want to record who or what delivers each service — staff, teams, equipment or vehicles, so that bookings are matched to real capacity. | D; FC-M01-028 | Ready |
| US-SVC-002-02 | As a service provider, I want to record qualifications and certifications with expiry dates and the services each requires, so that only qualified resources are booked. | D; FC-M01-030 | Ready |
| US-SVC-002-03 | As a service provider, I want to set working hours, closures and the area each resource covers, so that bookings are only offered when and where a resource can work. | D; FC-M01-030 | Ready |
| US-SVC-002-04 | As a client operations staff, I want bookings to be accepted only when a qualified, free resource covering the place has capacity, so that no booking is taken that cannot be delivered. | D; FC-M01-028 | Ready |
| US-SVC-002-05 | As a client administrator, I want service providers to be a supplier category, so that service-provider rules apply only to them. | FC-M11-014 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-002-01-01 | US-SVC-002-01 | **Given** a vendor in the service-provider category (SEL-010), **when** creates a resource of type Staff, Team, Equipment or Vehicle with a name, linked services and capacity per slot, **then** the resource is saved for that vendor only and appears in the vendor resource list. | D; FC-M01-028; FC-M11-014 |
| AC-SVC-002-05-01 | US-SVC-002-05 | **Given** a vendor not in the service-provider category, **when** opens the resources page, **then** access is refused with message Svc.NotServiceProvider. | FC-M11-014; Proposed |
| AC-SVC-002-02-01 | US-SVC-002-02 | **Given** a service requires qualification Q, **when** a resource without a valid Q (missing or expired) is checked for a slot, **then** the resource is not counted as available for that service (BR-SVC-010). | D; FC-M01-030 |
| AC-SVC-002-02-02 | US-SVC-002-02 | **Given** a qualification expires, **when** the daily SVC task runs, **then** the resource is marked not qualified for the services needing it, future bookings assigned to it are listed for the provider to reassign, and the provider is notified. | Proposed |
| AC-SVC-002-03-01 | US-SVC-002-03 | **Given** working hours and a closure date are set for a resource, **when** availability is calculated for that date, **then** no slot outside working hours or on the closure date is offered for that resource. | D |
| AC-SVC-002-03-02 | US-SVC-002-03 | **Given** a resource covers a set of areas (LOG-004 areas), **when** availability is requested for a location outside them, **then** the resource is not counted as available (see SVC-006). | D; FC-M01-030 |
| AC-SVC-002-04-01 | US-SVC-002-04 | **Given** CAT-027 asks which resources may serve a service for a period and location (IC-SVC-01 GetEligibleResources), **when** the SVC availability service answers, **then** only resources that meet BR-SVC-010 are returned, and CAT-027 shows only BookingSlots of those resources; each slot capacity is generated from the resource CapacityPerSlot and working hours (IC-SVC-01 GenerateSlots, written through IC-CAT-07 WriteSlots). | D; FC-M01-028; CAT-027 (BookingSlot.ResourceId, Capacity) |
| AC-SVC-002-04-02 | US-SVC-002-04 | **Given** a resource working hours, closures or capacity change, **when** the change is saved, **then** IC-SVC-01 GenerateSlots updates the future BookingSlots of that resource; a slot with confirmed bookings above the new capacity is not reduced below them and is listed for the provider to rebook (message Svc.CapacityConflict). | D; Proposed |

**Business rules applied:** BR-SVC-010; BR-SVC-011; BR-SVC-102 (§8.1).


### 7.3 PRD-SVC-003 Booking changes, cancellations and no-shows

| Item | Value |
|---|---|
| Description (baseline) | Customers can reschedule or cancel a booking within the rules the client sets (for example free cancellation up to 24 hours before, then a fee); no-shows by the customer or the provider are recorded and handled by policy. |
| Why it matters | Fair, predictable rules for changes protect both customers and providers. |
| Who benefits | Shoppers; service providers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CAT-027 |
| Status | On hold: FG-06, PO-REC-v8 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-003-01 | As a shopper, I want to reschedule my booking to another free slot within the rules, so that I can fit the service around my plans. | D | On hold: FG-06, PO-REC-v8 |
| US-SVC-003-02 | As a shopper, I want to cancel my booking and see any fee before I confirm, so that I know what I will get back. | D | On hold: FG-06, PO-REC-v8 |
| US-SVC-003-03 | As a client operations staff, I want to set per service a free-change period, a cancellation fee after it and a maximum number of reschedules, so that rules are fair and predictable. | D | On hold: FG-06, PO-REC-v8 |
| US-SVC-003-04 | As a service provider, I want to record that the customer did not come, and have the no-show policy applied, so that my time is protected. | D | On hold: FG-06, PO-REC-v8 |
| US-SVC-003-05 | As a shopper, I want a full refund and an offer to rebook when the provider does not turn up, so that I am not penalised for the provider failure. | D | On hold: FG-06, PO-REC-v8 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-003-03-01 | US-SVC-003-03 | **Given** a service policy is saved with a free-change period, a fee type (fixed or percentage) and value, and a maximum number of reschedules, **when** it is saved, **then** the policy is versioned with an effective date; bookings keep the version in force when they were made (BR-SVC-020); audited (AUD-SVC-003). | D; Proposed (versioning) |
| AC-SVC-003-01-01 | US-SVC-003-01 | **Given** a booking is Confirmed and the start is further away than the free-change period and the reschedule count is below the maximum, **when** the shopper picks another free slot, **then** SVC calls IC-CAT-07 Move; CAT moves the booking to the new slot under both slot locks and frees the old place (BR-CAT-021); the reschedule count increases and a confirmation is sent through TRK-005; if the new slot is full the move is refused with message Cat.SlotFull and nothing changes. | D |
| AC-SVC-003-01-02 | US-SVC-003-01 | **Given** the free-change period has passed or the maximum is reached, **when** the shopper tries to reschedule, **then** rescheduling is refused with message Svc.RescheduleNotAllowed. | D |
| AC-SVC-003-02-01 | US-SVC-003-02 | **Given** a paid booking is cancelled by the shopper inside the free-change period, **when** the shopper confirms, **then** SVC records outcome CancelledByCustomer through IC-CAT-07 RecordOutcome, which releases the place (SM-CAT-05 Released), and a full refund of the amount paid for the booking is requested through a RET-005 refund trigger (source BookingCancellation). | D |
| AC-SVC-003-02-02 | US-SVC-003-02 | **Given** a paid booking is cancelled by the shopper after the free-change period, **when** the shopper opens the cancel step, **then** the fee and the refund amount (paid minus fee, never below zero) are shown with message Svc.CancellationFee before confirmation; on confirmation a RET-005 refund trigger (source BookingCancellation) requests that amount. | D |
| AC-SVC-003-02-03 | US-SVC-003-02 | **Given** an order holding a booking is cancelled through the native storefront OrderController.CancelOrder action, **when** the request is posted, **then** the SVC action filter applies the booking cancellation rules first; for an unpaid order the native cancellation then runs; for a paid order the native cancel is not run and the SVC cancellation applies (the native action does not check payment status). | FIT (OrderController.CancelOrder; OrderProcessingService.CanCancelOrder) |
| AC-SVC-003-04-01 | US-SVC-003-04 | **Given** a booking is Confirmed and its start plus the grace period has passed, **when** the provider records Customer no-show, **then** SVC records outcome NoShowCustomer through IC-CAT-07 RecordOutcome (SM-CAT-05 Completed); no refund is raised unless the policy says so; any deposit follows SVC-004; audited (AUD-SVC-002). | D |
| AC-SVC-003-05-01 | US-SVC-003-05 | **Given** a booking is Confirmed, **when** operations staff confirm a provider no-show reported by the shopper or provider, **then** SVC records outcome NoShowProvider through IC-CAT-07 RecordOutcome, a full refund is requested through a RET-005 refund trigger (source ProviderNoShow), and the shopper is offered free slots to rebook without a fee. | D |
| AC-SVC-003-03-02 | US-SVC-003-03 | **Given** the provider cancels a booking, **when** the cancellation is saved with a reason, **then** SVC records outcome CancelledByProvider through IC-CAT-07 RecordOutcome (place released) and a full refund is requested through a RET-005 refund trigger (source BookingCancellation); the shopper is notified. | Proposed |

**Business rules applied:** BR-SVC-020; BR-SVC-021; BR-SVC-022; BR-SVC-102 (§8.1).


### 7.4 PRD-SVC-004 Deposits and advance payment for bookings

| Item | Value |
|---|---|
| Description (baseline) | A booking can require full payment, a deposit or no payment upfront; the balance is collected later, and deposits are refunded or kept according to the cancellation policy. |
| Why it matters | Reduces no-shows and protects providers' time. |
| Who benefits | Service providers; shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CAT-027, PRD-PAY-016 |
| Status | On hold: FG-06, PO-REC-v8 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-004-01 | As a client operations staff, I want to set per service whether a booking needs full payment, a deposit or no payment upfront, so that the payment rule fits the service. | D | On hold: FG-06, PO-REC-v8 |
| US-SVC-004-02 | As a shopper, I want to pay the deposit when I book and the balance later, so that I secure the slot without paying everything at once. | D | On hold: FG-06, PO-REC-v8 |
| US-SVC-004-03 | As a shopper, I want to pay the balance online or at an outlet before the due point, so that the booking is fully paid. | D | On hold: FG-06, PO-REC-v8 |
| US-SVC-004-04 | As a member of finance staff, I want deposits to be refunded or kept according to the cancellation policy, so that deposit handling is consistent. | D | On hold: FG-06, PO-REC-v8 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-004-01-01 | US-SVC-004-01 | **Given** a payment plan Deposit is set for a service with a fixed or percentage deposit and a balance due point (before the start or at completion), **when** it is saved, **then** the plan is versioned and a booking keeps the version in force when made (BR-SVC-020). | D |
| AC-SVC-004-02-01 | US-SVC-004-02 | **Given** a service has plan Deposit and the shopper books it, **when** the cart line is priced, **then** the line unit price is the deposit amount, set by the SVC handler of GetShoppingCartItemUnitPriceEvent (Misc.RFQ pattern) as the plan share of the full unit price returned by the IShoppingCartService.GetUnitPriceAsync product overload, which runs IPriceCalculationService (single owner CAT-042 under OVR-REG) and so keeps the CAT price precedence (BR-CAT-020); the order (order 1) is placed and paid in full natively for that amount; a BookingPaymentPlan records order 1 as the deposit (SM-SVC-03). | D; FIT (GetShoppingCartItemUnitPriceEvent; PaymentStatus has no partly-paid state) |
| AC-SVC-004-02-02 | US-SVC-004-02 | **Given** the confirm step is posted (CheckoutController.ConfirmOrder or OpcConfirmOrder) for a cart holding a booking line, **when** the SVC action filter compares the line unit price with the amount due under the plan, **then** if they differ (for example because the price handler failed, as event consumer exceptions are swallowed) the order is not placed and message Svc.PriceCheckFailed is shown (BR-SVC-031). | FIT (EventPublisher swallows consumer exceptions); Proposed |
| AC-SVC-004-02-03 | US-SVC-004-02 | **Given** a service has plan No payment upfront, **when** the shopper books it, **then** the booking line is priced zero, the native zero-total order is placed with PaymentStatus Paid and no payment step, and the whole price becomes the balance. | D; FIT (OrderProcessingService: no payment workflow when the total is zero) |
| AC-SVC-004-03-01 | US-SVC-004-03 | **Given** a balance is due, **when** the shopper selects Pay balance in My account, **then** a cart with one line for the service is created with the balance as unit price (same handler), the shopper pays it as order 2, and the plan records order 2 as the balance; the booking becomes fully paid when order 2 is Paid. | D; Proposed (separate orders) |
| AC-SVC-004-03-02 | US-SVC-004-03 | **Given** a shopper pays the balance at an outlet, **when** outlet staff create the balance order for the booking through assisted checkout (CHK-013) and record payment (PAY-034), **then** the plan records that order as the balance. | D |
| AC-SVC-004-03-03 | US-SVC-004-03 | **Given** the balance due point passes and the balance is unpaid, **when** the daily SVC task runs, **then** the plan becomes BalanceOverdue and the action in the plan is applied: remind the shopper, or cancel the booking with the deposit treated under the cancellation policy (action is a setting, default not stated). | Proposed |
| AC-SVC-004-04-01 | US-SVC-004-04 | **Given** a booking with a paid deposit is cancelled, **when** the cancellation policy (SVC-003) gives the refundable share, **then** a refund of that share of order 1 is requested through a RET-005 refund trigger (source DepositRefund) and the rest is kept; the plan becomes DepositRefunded or DepositForfeited (partly refunded deposits are DepositRefunded with the amount recorded). | D |

**Business rules applied:** BR-SVC-030; BR-SVC-031; BR-SVC-020; BR-SVC-102 (§8.1).


### 7.5 PRD-SVC-005 Service order lifecycle and completion sign-off

| Item | Value |
|---|---|
| Description (baseline) | A service order moves through clear stages — requested, confirmed, scheduled, in progress, completed — and the customer confirms the service was delivered (or reports it was not). Confirmation can release payment to the provider; a failed service starts a refund under the client's policy. The stages are configured in 'Configurable order status model'. |
| Why it matters | There is a clear record that a service was actually delivered before money changes hands. |
| Who benefits | Shoppers; service providers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ORD-002 |
| Status | Ready; conditions: MSG-ROUTE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-005-01 | As a service provider, I want to move a service order through Requested, Confirmed, Scheduled, In progress and Completed, so that everyone sees where the service stands. | D; REQ-MPC-FR-074 | Ready; conditions: MSG-ROUTE |
| US-SVC-005-02 | As a shopper, I want to confirm that the service was delivered, or report that it was not, so that there is a record before money moves. | D; REQ-MPC-FR-074 | Ready; conditions: MSG-ROUTE |
| US-SVC-005-03 | As a member of finance staff, I want the provider to become eligible for payout only after the customer confirms, so that money changes hands only for delivered services. | D | Ready; conditions: MSG-ROUTE |
| US-SVC-005-04 | As a shopper, I want a refund to start under the client policy when a service failed, so that I get my money back for a service not delivered. | D; REQ-MPC-FR-232 | Ready; conditions: MSG-ROUTE |
| US-SVC-005-05 | As a Malawi Post customer, I want to order Malawi Post services through an ordering flow that shows each step, so that I know each step of my service order. | REQ-MPC-FR-100 | Ready; conditions: MSG-ROUTE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-005-01-01 | US-SVC-005-01 | **Given** an order line is for a service product, **when** the order is placed, **then** a ServiceOrderStage record starts at the first stage of the line stage set returned by IC-ORD-10 GetLineStageSet (ORD-002; default SM-SVC-01, Requested); the native OrderStatus is not changed by SVC. | D; REQ-MPC-FR-074; depends on PRD-ORD-002 (workbook) |
| AC-SVC-005-01-02 | US-SVC-005-01 | **Given** a line is Requested, **when** the provider confirms and, where the service is booked, the CAT-027 booking exists, **then** the stage becomes Confirmed and then Scheduled with the booking date; each change records who and when and is shown to the shopper. | REQ-MPC-FR-074 |
| AC-SVC-005-01-03 | US-SVC-005-01 | **Given** a stage change is not in the configured transitions, **when** anyone posts it, **then** SVC asks IC-ORD-10 ValidateLineTransition before the change; on refusal the change is refused with message Svc.StageNotAllowed and nothing is saved (BR-ORD-014). | D; ORD-002 |
| AC-SVC-005-01-04 | US-SVC-005-01 | **Given** a line is In progress, **when** the provider marks it Completed with a completion note and optional evidence files, **then** the stage becomes Completed and the shopper is asked to confirm with message Svc.ConfirmService through TRK-005. | REQ-MPC-FR-074 |
| AC-SVC-005-02-01 | US-SVC-005-02 | **Given** a line is Completed, **when** the shopper confirms delivery, **then** the stage becomes Accepted, SVC records booking outcome Attended through IC-CAT-07 RecordOutcome, and the line is marked eligible for the provider settlement (SEL-017) (BR-SVC-041). | REQ-MPC-FR-074 |
| AC-SVC-005-02-02 | US-SVC-005-02 | **Given** a line is Completed, **when** the sign-off window passes without an answer, **then** the stage becomes Accepted automatically and the history records the auto-acceptance (window is a setting, default not stated). | Proposed |
| AC-SVC-005-04-01 | US-SVC-005-04 | **Given** a line is Completed, **when** the shopper reports Not delivered with a reason, **then** the stage becomes NotDelivered, payout eligibility is withheld, and operations staff are notified to review. | REQ-MPC-FR-232 |
| AC-SVC-005-04-02 | US-SVC-005-04 | **Given** a line is NotDelivered, **when** operations staff decide Failed, **then** the stage becomes Failed and SVC raises the module event Service.Failed (order, line, reason); RET-005 enqueues the refund trigger (source ServiceFailure) under the client refund policy; SVC never calls PAY-016 directly (BR-SVC-021). | REQ-MPC-FR-232 |
| AC-SVC-005-04-03 | US-SVC-005-04 | **Given** a line is NotDelivered, **when** operations staff decide Rework, **then** the stage returns to Scheduled and the booking is moved to a new slot through IC-CAT-07 Move. | Proposed |
| AC-SVC-005-03-01 | US-SVC-005-03 | **Given** a service order is paid and has no shippable item, **when** native order processing runs, **then** the native OrderStatus becomes Complete at payment (CheckAndSaveOrderStatusAsync) while the service stage stays Requested; reports and payout use the service stage, not the native status (BR-SVC-040). | FIT (OrderProcessingService.CheckAndSaveOrderStatusAsync) |
| AC-SVC-005-04-04 | US-SVC-005-04 | **Given** a service product is set NotReturnable, **when** the shopper opens the order, **then** no native return request is offered for the service line; service failure follows the NotDelivered path. | FIT (Product.NotReturnable; ReturnRequestService) |
| AC-SVC-005-05-01 | US-SVC-005-05 | **Given** an order holds Malawi Post service lines, **when** the shopper opens the order in My account, **then** each service line shows its current stage, the next step and the date of each stage change. | REQ-MPC-FR-100 |
| AC-SVC-005-03-02 | US-SVC-005-03 | **Given** the TRK-005 engine asks the SVC order-kind provider (IC-TRK-05) about an order before sending OrderCompleted.CustomerNotification, **when** the order lines are all service lines, or the order holds any other line, **then** the provider returns order kind Service in the first case and none in the second; it sends no message itself, and TRK-005 applies the action configured for the kind (BR-TRK-024). | Decision MSG-ROUTE; Proposed |

**Business rules applied:** BR-SVC-040; BR-SVC-041; BR-SVC-102 (§8.1).


### 7.6 PRD-SVC-006 Service location at booking

| Item | Value |
|---|---|
| Description (baseline) | When booking, the customer says where the service happens — at their site (with address or map pin), at an outlet, or remotely/online — and the system checks that the provider covers that place. |
| Why it matters | Avoids bookings that cannot be delivered where the customer needs them. |
| Who benefits | Shoppers; service providers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-LOG-004 |
| Status | On hold: PO-REC-v8 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-006-01 | As a shopper, I want to say where the service happens — at my site, at an outlet or remotely — when I book, so that the provider comes to the right place or contacts me the right way. | D | On hold: PO-REC-v8 |
| US-SVC-006-02 | As a shopper, I want to place a pin on a map for my site, so that the provider finds places without a street address. | D | On hold: PO-REC-v8 |
| US-SVC-006-03 | As a service provider, I want bookings only for places I cover, so that I do not receive bookings I cannot deliver. | D; FC-M01-030 | On hold: PO-REC-v8 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-006-01-01 | US-SVC-006-01 | **Given** a service allows the location types At site, At outlet and Remote, **when** the shopper books it, **then** the booking step asks for one allowed type; At site asks for an address, At outlet lists the allowed pickup points (StorePickupPoint), Remote asks for the contact channel. | D; Proposed |
| AC-SVC-006-01-02 | US-SVC-006-01 | **Given** the cart holds only services (no shippable item), **when** the shopper checks out, **then** the native shipping step is skipped, so the location is captured in the SVC booking step and stored on the booking, not on the order shipping address. | FIT (CheckoutController skips shipping when ShoppingCartRequiresShippingAsync is false) |
| AC-SVC-006-02-01 | US-SVC-006-02 | **Given** At site is chosen, **when** the shopper places a pin, **then** the latitude and longitude are stored on the BookingLocation (the native Address has no coordinates) and shown to the provider with the address. | D; FIT (Address has no coordinates) |
| AC-SVC-006-03-01 | US-SVC-006-03 | **Given** the chosen site or outlet is outside the coverage of every available resource (SVC-002) or not serviceable under LOG-004, **when** the shopper confirms the location, **then** the booking cannot continue and message Svc.LocationNotCovered is shown. | D; FC-M01-030; depends on PRD-LOG-004 (workbook) |
| AC-SVC-006-03-02 | US-SVC-006-03 | **Given** the location is covered, **when** availability is shown, **then** only slots of resources covering that location are offered (IC-SVC-01). | D |

**Business rules applied:** BR-SVC-011 (§8.1).


### 7.7 PRD-SVC-007 Digital products and downloads

| Item | Value |
|---|---|
| Description (baseline) | Sell items delivered electronically — such as e-documents, licences, reports or e-vouchers — which the customer downloads or receives by email after payment, with download limits and expiry. (Vouchers for a paid service are covered in 'Service vouchers and e-tickets'; store-credit gift cards in 'Gift cards and vouchers'.) |
| Why it matters | Items such as e-documents or licences can be sold and delivered without shipping. |
| Who benefits | Shoppers; business buyers |
| Phase | P2 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | On hold: PO-REC-v8 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-007-01 | As a shopper, I want to download an electronic item such as an e-document, licence or report after I pay, so that I get it at once without shipping. | D | On hold: PO-REC-v8 |
| US-SVC-007-02 | As a client administrator, I want to limit the number of downloads and the days a download stays available, so that files are not shared without limit. | D | On hold: PO-REC-v8 |
| US-SVC-007-03 | As a member of finance staff, I want a licence file per order line where a licence is sold, so that each buyer gets their own licence. | D | On hold: PO-REC-v8 |
| US-SVC-007-04 | As a shopper, I want to find my downloads in My account and in the order email, so that I can download again within the limits. | D | On hold: PO-REC-v8 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-007-01-01 | US-SVC-007-01 | **Given** a product is downloadable with activation When order is paid, **when** the order becomes Paid, **then** the download is allowed and the link appears in the order details and in order emails (native IsDownloadAllowedAsync, MessageTokenProvider). | D; FIT (Product.IsDownload, DownloadActivationType.WhenOrderIsPaid) |
| AC-SVC-007-01-02 | US-SVC-007-01 | **Given** a product is downloadable with activation Manually, **when** an administrator activates the item on the order, **then** the download becomes allowed for that order line only. | FIT (OrderItem.IsDownloadActivated; Admin OrderController.ActivateDownloadItem) |
| AC-SVC-007-02-01 | US-SVC-007-02 | **Given** Unlimited downloads is off and a maximum is set, **when** the shopper reaches the maximum, **then** further downloads are refused with the native message DownloadableProducts.ReachedMaximumNumber. | D; FIT (Product.MaxNumberOfDownloads) |
| AC-SVC-007-02-02 | US-SVC-007-02 | **Given** DownloadExpirationDays is set, **when** that many days have passed since the paid date (When order is paid) or since the order date (Manually), **then** the download is refused. | D; FIT (OrderService.IsDownloadAllowedAsync) |
| AC-SVC-007-02-03 | US-SVC-007-02 | **Given** the product has a user agreement, **when** the shopper starts the download, **then** the agreement must be accepted before the file is served. | FIT (Product.HasUserAgreement) |
| AC-SVC-007-02-04 | US-SVC-007-02 | **Given** CustomerSettings.DownloadableProductsValidateUser is on, **when** another customer opens the download link, **then** the download is refused. | FIT |
| AC-SVC-007-03-01 | US-SVC-007-03 | **Given** an administrator uploads a licence file for an order line, **when** the shopper opens the order, **then** the licence download is available for that line only, under the same rules. | D; FIT (OrderItem.LicenseDownloadId) |
| AC-SVC-007-04-01 | US-SVC-007-04 | **Given** downloads exist and HideDownloadableProductsTab is off, **when** the shopper opens My account, Downloadable products, **then** each allowed download is listed with its link. | D; FIT (CustomerController.DownloadableProducts) |

**Business rules applied:** BR-SVC-050 (§8.1).


### 7.8 PRD-SVC-008 Rental and hire

| Item | Value |
|---|---|
| Description (baseline) | Hire out items for a period (for example equipment or vehicles): the customer picks start and end dates, the price depends on the length of hire, and availability is checked for those dates. |
| Why it matters | Equipment and vehicles can earn money through hire, priced by length of use. |
| Who benefits | Shoppers; business buyers; service providers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-008-01 | As a shopper, I want to hire an item for chosen start and end dates and see the price for that length, so that I pay for the time I use. | D; FC-M01-028 | Ready; conditions: OVR-REG |
| US-SVC-008-02 | As a shopper, I want only dates on which an item is free to be offered, so that my hire is not refused later. | D | Ready; conditions: OVR-REG |
| US-SVC-008-03 | As a service provider, I want to set how many units of an item I can hire out, so that bookings match my fleet. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-008-01-01 | US-SVC-008-01 | **Given** a product is a rental product priced per day or week with a rental price length, **when** the shopper enters start and end dates, **then** the price is the native price × the number of rental periods (IProductService.GetRentalPeriods) and the dates are stored on the order line. | D; FIT (Product.IsRental, RentalPricePeriodId; PriceCalculationService) |
| AC-SVC-008-01-02 | US-SVC-008-01 | **Given** the end date is before the start date, or the start date is before today, **when** the shopper adds the item, **then** the native rental warning is shown and the item is not added. | FIT (ShoppingCartService.GetRentalProductWarningsAsync) |
| AC-SVC-008-03-01 | US-SVC-008-03 | **Given** a provider sets the number of hire units for a rental product (or links equipment resources from SVC-002), **when** it is saved, **then** availability for any date is that number minus units on overlapping non-cancelled order lines and active holds. | D; Proposed |
| AC-SVC-008-02-01 | US-SVC-008-02 | **Given** all units are taken for any day of the requested period, **when** the shopper adds the item or places the order, **then** the SVC rental-availability cart check provider (IC-CHK-01, which passes the candidate item with its rental start and end dates), called from GetShoppingCartItemWarningsAsync and GetRentalProductWarningsAsync by the single IShoppingCartService override owned by CHK-003 (BR-CHK-015), adds message Svc.RentalUnavailable and the item is not added; placement fails because PlaceOrderAsync re-runs GetShoppingCartItemWarningsAsync for each cart item. | D; OVR-REG; FIT (ShoppingCartService.GetShoppingCartItemWarningsAsync calls GetRentalProductWarningsAsync, public virtual; OrderProcessingService re-runs item warnings at placement) |
| AC-SVC-008-02-02 | US-SVC-008-02 | **Given** a unit is free for the period, **when** the item passes the check at the confirm step, **then** a RentalHold is created under ILocker key 'svc-rental-{ProductId}' and counted for other customers until the order is placed or the hold expires (hold time is a setting, default not stated). | Proposed |

**Business rules applied:** BR-SVC-060 (§8.1).


### 7.9 PRD-SVC-009 Service vouchers and e-tickets

| Item | Value |
|---|---|
| Description (baseline) | After paying, the customer receives a voucher or e-ticket with a code or QR code that the provider scans to redeem the service. These are proof of a paid service, not store credit (see 'Gift cards and vouchers') or a parcel pickup code (see 'Pickup code / QR'). |
| Why it matters | Simple, fraud-resistant proof that a service has been paid for. |
| Who benefits | Shoppers; service providers; outlet staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CAT-026 |
| Status | On hold: PO-REC-v8 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-009-01 | As a shopper, I want a voucher or e-ticket with a code and QR code after I pay for a service, so that I can prove I paid. | D | On hold: PO-REC-v8 |
| US-SVC-009-02 | As a service provider or outlet staff, I want to scan or type the code to check it and redeem it once, so that fraud is prevented. | D | On hold: PO-REC-v8 |
| US-SVC-009-03 | As a Malawi Post customer, I want to buy tickets for partner services listed by Malawi Post, so that I can use the post office for ticketing. | REQ-MPC-FR-336 | On hold: PO-REC-v8 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-009-01-01 | US-SVC-009-01 | **Given** a service product issues vouchers with a validity period and a number of uses, **when** an order line becomes Paid (OrderPaidEvent), **then** the consumer only enqueues an issue job; the task creates one voucher per unit with a unique, non-guessable code and QR payload (BR-SVC-070), status Issued, and sends it through TRK-005; issuing is idempotent per order line. | D; FIT (L1 §6.2 principle 8) |
| AC-SVC-009-01-02 | US-SVC-009-01 | **Given** vouchers were issued, **when** the shopper opens My account, **then** each voucher is shown with code, QR, service, validity and status. | D |
| AC-SVC-009-02-01 | US-SVC-009-02 | **Given** an Issued voucher for a service of the redeeming vendor is presented within its validity, **when** the user with Services.Vouchers.Redeem validates and redeems it, **then** its uses decrease by one; at zero it becomes Redeemed; the time, user and place are recorded; audited (AUD-SVC-004). | D |
| AC-SVC-009-02-02 | US-SVC-009-02 | **Given** a voucher is Redeemed, Expired, Cancelled or for another vendor service, **when** it is validated, **then** redemption is refused with message Svc.VoucherInvalid stating only that it is not valid. | D |
| AC-SVC-009-02-03 | US-SVC-009-02 | **Given** the same voucher is scanned at two places at once, **when** both redemptions run, **then** under ILocker key 'svc-voucher-{Code}' only one succeeds. | Proposed; FIT (ILocker) |
| AC-SVC-009-01-03 | US-SVC-009-01 | **Given** an unredeemed voucher line is refunded (PAY-016), **when** the refund completes, **then** the voucher becomes Cancelled. | Proposed |
| AC-SVC-009-01-04 | US-SVC-009-01 | **Given** the validity end passes, **when** the daily SVC task runs, **then** unredeemed vouchers become Expired. | D |
| AC-SVC-009-03-01 | US-SVC-009-03 | **Given** a ticketing partner service is listed under FIN-005 with voucher issue enabled, **when** the customer pays, **then** an e-ticket is issued as in story 01. | REQ-MPC-FR-336 |

**Business rules applied:** BR-SVC-070; BR-SVC-102 (§8.1).


### 7.10 PRD-SVC-010 Service reminders and follow-up

| Item | Value |
|---|---|
| Description (baseline) | Automatic reminders before a booked service and a follow-up afterwards asking for feedback or a rating. |
| Why it matters | Fewer missed appointments and better service quality. |
| Who benefits | Shoppers; service providers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-TRK-005 |
| Status | On hold: PO-REC-v8 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-010-01 | As a shopper, I want reminders before my booked service, so that I do not miss it. | D | On hold: PO-REC-v8 |
| US-SVC-010-02 | As a service provider, I want a feedback request sent after the service, so that I learn how to improve. | D | On hold: PO-REC-v8 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-010-01-01 | US-SVC-010-01 | **Given** reminder lead times are set for a service (for example a list of hours before the start; values not stated), **when** the SVC scheduled task runs and a Confirmed booking reaches a lead time, **then** one reminder per lead time is sent through TRK-005 on the channels the customer allows (TRK-006); it is not sent twice. | D; FIT (MessageTemplate.DelayBeforeSend counts from queueing, not from the booking start, so a scheduled task is needed) |
| AC-SVC-010-01-02 | US-SVC-010-01 | **Given** a booking is cancelled or rescheduled, **when** the task runs, **then** no reminder is sent for the cancelled slot; reminders follow the new slot. | D |
| AC-SVC-010-02-01 | US-SVC-010-02 | **Given** a service line becomes Accepted (SVC-005), **when** the follow-up delay passes, **then** a feedback request is sent with a link to the product review form (CAT-029); only one request per order line. | D; FIT (ProductReviewPossibleOnlyAfterPurchasing) |
| AC-SVC-010-02-02 | US-SVC-010-02 | **Given** the customer has opted out of feedback messages (TRK-006), **when** the follow-up is due, **then** no request is sent. | D |
| AC-SVC-010-01-03 | US-SVC-010-01 | **Given** the feature state productfeature.<prd-id> of PRD-SVC-010 is off for store S (IC-PLT-02), **when** the SVC reminder task runs, **then** no reminder or feedback request is sent for bookings or order lines of S (BR-SVC-100). | Proposed (IC-PLT-02, PLT) |

**Business rules applied:** BR-SVC-080; BR-SVC-100; BR-SVC-101; BR-SVC-102 (§8.1).


### 7.11 PRD-SVC-011 Service-level targets for service orders

| Item | Value |
|---|---|
| Description (baseline) | Applies the service-level targets set in 'Cut-offs and service levels' to service orders: for each service the client sets response and completion times (for example respond within 2 hours, complete within 3 days); the system tracks each booking against them and escalates when they are missed. |
| Why it matters | Services are delivered on time, and late ones are acted on. |
| Who benefits | Client operations staff; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ORD-011 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-011-01 | As a client operations staff, I want to set response and completion targets per service and service level, so that service orders have measurable promises. | D; REQ-MPC-FR-311; REQ-MPC-FR-165 | Ready |
| US-SVC-011-02 | As a client operations staff, I want each service order to be tracked against its targets and escalated when a target is at risk or missed, so that late services are acted on. | D; REQ-MPC-FR-311 | Ready |
| US-SVC-011-03 | As a shopper, I want to see the promised response and completion time when I order, so that I know what to expect. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-011-01-01 | US-SVC-011-01 | **Given** a target set is saved for a service (and optionally for a service level chosen as an attribute) with a response target, a completion target and the start point of each clock (order placed or scheduled start), **when** it is saved, **then** it is versioned with an effective date; orders keep the version in force when placed; audited (AUD-SVC-003). | REQ-MPC-FR-311; REQ-MPC-FR-165 |
| AC-SVC-011-02-01 | US-SVC-011-02 | **Given** a service order line starts its SLA clocks, **when** the targets apply, **then** the response due time (until Confirmed) and completion due time (until Completed) are computed and stored on the SlaClock (SM-SVC-05). | REQ-MPC-FR-311 |
| AC-SVC-011-02-02 | US-SVC-011-02 | **Given** the at-risk threshold of a clock is reached before the stage is reached, **when** the SVC task runs, **then** the clock becomes AtRisk and the first escalation level is notified. | REQ-MPC-FR-311 |
| AC-SVC-011-02-03 | US-SVC-011-02 | **Given** a due time passes before the stage is reached, **when** the SVC task runs, **then** the clock becomes Breached, each escalation level is notified in turn at its configured interval, and the breach is recorded for reports (SVC-012). | REQ-MPC-FR-311 |
| AC-SVC-011-02-04 | US-SVC-011-02 | **Given** the stage is reached before the due time, **when** the stage change is saved, **then** the clock becomes Met and no escalation is sent. | REQ-MPC-FR-311 |
| AC-SVC-011-03-01 | US-SVC-011-03 | **Given** targets exist for the service, **when** the shopper views the service and the order, **then** the response and completion targets are shown. | D |
| AC-SVC-011-01-02 | US-SVC-011-01 | **Given** a service level (for example express or standard) is chosen by the shopper as an attribute of the service, **when** the order is placed, **then** the targets of that service level apply to the line. | REQ-MPC-FR-165 |

**Business rules applied:** BR-SVC-090; BR-SVC-102 (§8.1).


### 7.12 PRD-SVC-012 Service reports

| Item | Value |
|---|---|
| Description (baseline) | Reports on bookings, how busy providers are, completed and cancelled services, no-shows and service-level performance. |
| Why it matters | Shows demand for services and where delivery needs to improve. |
| Who benefits | Management; operations staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CAT-027 |
| Status | On hold: FG-06, PO-REC-v8 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SVC-012-01 | As a member of management, I want reports on bookings, provider utilisation, completed and cancelled services, no-shows and service-level performance, so that I see demand and where delivery must improve. | D | On hold: FG-06, PO-REC-v8 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SVC-012-01-01 | US-SVC-012-01 | **Given** bookings exist, **when** the bookings report runs for a period, **then** counts by service, provider and status (Confirmed, Attended, CancelledByCustomer, CancelledByProvider, NoShowCustomer, NoShowProvider) are shown and exportable. | D |
| AC-SVC-012-01-02 | US-SVC-012-01 | **Given** resources with capacity exist, **when** the utilisation report runs, **then** for each resource and period, booked units ÷ available units (from working hours and capacity, SVC-002) is shown. | D |
| AC-SVC-012-01-03 | US-SVC-012-01 | **Given** service orders exist, **when** the completion report runs, **then** counts of Accepted, NotDelivered, Failed and cancelled service lines by service and provider are shown. | D |
| AC-SVC-012-01-04 | US-SVC-012-01 | **Given** SLA clocks exist, **when** the SLA report runs, **then** per service and target: Met, Breached, share met, and average time to response and completion. | D |
| AC-SVC-012-01-05 | US-SVC-012-01 | **Given** a vendor user runs any service report, **when** the report is shown, **then** only the vendor own services and resources are included. | D; FIT (vendor scoping) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-SVC-001 | Pricing model per service: Fixed, Per time unit (hour, day, week), Per unit (configurable unit label), From-price (native, attribute-driven), Price on request. Line total = unit price × quantity; for Per time unit the quantity is the number of units covered by the booked slot. | SVC-001 | D; FC-M01-029; Proposed (unit model) |
| BR-SVC-002 | A Price on request service keeps CallForPrice and DisableBuyButton off (both fail the cart warnings that PlaceOrderAsync re-runs); SVC hides the price and refuses direct add-to-cart; only lines created from an accepted quote enter the cart. | SVC-001 | FIT (ShoppingCartService warnings; Misc.RFQ RfqService) |
| BR-SVC-010 | A resource counts as available for a slot only if it is active, linked to the service, holds every valid qualification the service requires, works in that slot, covers the location, and has capacity left after holds and bookings. | SVC-002, SVC-006 | D; FC-M01-028; FC-M01-030 |
| BR-SVC-011 | Bookings are held, confirmed, moved, given an outcome and released only through the CAT-027 booking service IC-CAT-07 (Hold, Confirm, Move, RecordOutcome, Release, WriteSlots) under ILocker key 'cat-slot-{SlotId}' (BR-CAT-021); SVC never writes Booking or BookingSlot capacity directly; IC-SVC-01 GenerateSlots writes slots through IC-CAT-07 WriteSlots. The SVC column on the CAT Booking is Outcome (SM-SVC-02); the Booking Status (SM-CAT-05) is CAT's. | SVC-002, SVC-003, SVC-006 | CAT-027 (BR-CAT-021, IC-CAT-07); FIT (ILocker) |
| BR-SVC-020 | Cancellation, reschedule, no-show, deposit, sign-off, reminder and service-level policies are versioned with an effective date; a booking or order keeps the versions in force when it was made. | SVC-003, SVC-004, SVC-011 | Proposed |
| BR-SVC-021 | Refund on cancellation = amount paid for the booking minus the cancellation fee, never below zero; SVC raises BookingCancellation, ProviderNoShow and DepositRefund refunds through IC-RET-04 RaiseRefundTrigger with the order lines and the amount SVC computes; ServiceFailure triggers are created by RET-005 from the SVC module event Service.Failed; SVC never calls PAY-016 directly and never changes the order payment status. | SVC-003 | D; RET-005 (single refund-trigger owner); FIT (PAY BR-PAY-010) |
| BR-SVC-022 | Provider cancellation or provider no-show gives a full refund of the amount paid for the booking and a fee-free rebook offer. | SVC-003 | D |
| BR-SVC-030 | Deposit and balance are separate orders linked by the booking; each order is paid in full natively; the booking is fully paid when the sum of paid plan orders equals the plan total. | SVC-004 | Proposed; FIT (PaymentStatus has no partly-paid state) |
| BR-SVC-031 | At the confirm step the unit price of every booking line must equal the amount due under its plan; otherwise the order is not placed. | SVC-004 | Proposed; FIT (consumer exceptions swallowed) |
| BR-SVC-040 | Service progress is the SVC-005 line stage (stage set and transitions from ORD-002 through IC-ORD-10, BR-ORD-014), not the native OrderStatus, which becomes Complete at payment for orders without shippable items. | SVC-005 | FIT (CheckAndSaveOrderStatusAsync) |
| BR-SVC-041 | A service line is eligible for the provider settlement (SEL-017) only when Accepted; NotDelivered or Failed lines are not paid out. | SVC-005 | D |
| BR-SVC-050 | Downloads follow native rules: activation when paid or manually, maximum count, expiry from the paid date (when paid) or the order date (manual), user agreement, owner check when DownloadableProductsValidateUser is on. | SVC-007 | FIT (OrderService.IsDownloadAllowedAsync; DownloadController) |
| BR-SVC-060 | Rental availability for each day of a requested period = hire units minus units on overlapping non-cancelled order lines and active holds of other customers; a request with any day at zero is refused. | SVC-008 | D; Proposed |
| BR-SVC-070 | Voucher codes are unique per store, not guessable and include a check character; a voucher can be redeemed only by the vendor of its service (or outlet staff for operator services), within validity, while uses remain. | SVC-009 | D; Proposed (format) |
| BR-SVC-080 | At most one reminder per lead time and one feedback request per line; customer channel preferences (TRK-006) always apply. | SVC-010 | D; Proposed |
| BR-SVC-100 | Every SVC page, widget, seller-portal or outlet action, action filter and scheduled task checks the feature state of the PRD feature it serves through IC-PLT-02 IsEnabled (setting productfeature.<prd-id>, store value else client value) before it runs for a store; when off, nothing is shown and tasks skip that store. Native product fields used by SVC (price, download, rental) are not switched by it. | SVC-001 to SVC-012 | Proposed ( PLT, IC-PLT-02) |
| BR-SVC-101 | Every new SVC setting key (ServicesSettings) is listed in the SVC plugin key catalogue with key, type, layer, secret flag and default, so pack validation accepts it (PLT-003, NFR-X-008). SVC holds no credential, key or token setting. Per-service values are rows of SVC entities (ServicePolicy, ServicePricing, RentalCapacity), not setting keys. Keys are listed in §10. | SVC-001 to SVC-012 | Proposed ( PLT) |
| BR-SVC-102 | SVC sends no message itself. Customer, provider and staff notifications are sent by TRK-005 through IC-TRK-04 SendEvent with event codes SVC registers through IC-TRK-04 RegisterEventCode at installation (names Proposed, listed in BR-TRK-023): Svc.ConfirmService (sign-off request), Svc.Core.BookingConfirmed, Svc.Core.BookingRescheduled, Svc.Core.BookingCancelled, Svc.Core.CancellationFeeApplied, Svc.Core.BookingReminder, Svc.Core.VoucherIssued, Svc.Core.BalanceDue, Svc.Core.BalanceOverdue, Svc.Core.SlaAtRisk, Svc.Core.SlaBreached, Svc.Core.FeedbackRequest, Svc.Core.NotDelivered, Svc.Core.QualificationExpired; TRK-006 opt-outs apply. For OrderCompleted.CustomerNotification SVC supplies its order kind through IC-TRK-05; TRK-005 applies the per-client action (BR-TRK-024). | SVC-002 to SVC-005, SVC-009 to SVC-011 | Decision MSG-ROUTE; Proposed (code names) |
| BR-SVC-090 | Each service order line has a response clock and a completion clock; a clock is Met when its stage is reached before the due time, otherwise Breached; escalation levels are notified in order. | SVC-011 | REQ-MPC-FR-311; Proposed (clock definitions) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-SVC-01 | ServiceOrderStage (default line stage set held in ORD-002, IC-ORD-10) | (none) | order placed with a service line | — | Requested | SLA clocks start (SVC-011) |
| SM-SVC-01 | ServiceOrderStage | Requested | provider confirms | vendor owns line | Confirmed | response clock stops |
| SM-SVC-01 | ServiceOrderStage | Confirmed | booking exists or date set | — | Scheduled | — |
| SM-SVC-01 | ServiceOrderStage | Scheduled | provider starts | — | InProgress | — |
| SM-SVC-01 | ServiceOrderStage | InProgress | provider completes with note | — | Completed | shopper asked to confirm; completion clock stops |
| SM-SVC-01 | ServiceOrderStage | Completed | shopper confirms or sign-off window passes | — | Accepted | booking Attended; eligible for SEL-017 |
| SM-SVC-01 | ServiceOrderStage | Completed | shopper reports not delivered | reason given | NotDelivered | payout withheld; operations notified |
| SM-SVC-01 | ServiceOrderStage | NotDelivered | operations decide Failed | Services.Bookings.CreateEditDelete | Failed | Service.Failed event; RET-005 refund trigger |
| SM-SVC-01 | ServiceOrderStage | NotDelivered | operations decide Rework | Services.Bookings.CreateEditDelete | Scheduled | booking moved (IC-CAT-07 Move) |
| SM-SVC-01 | ServiceOrderStage | Requested / Confirmed / Scheduled | booking cancelled (SVC-003) | — | Cancelled | refund per BR-SVC-021 / BR-SVC-022 |
| SM-SVC-02 | Booking outcome (SVC column Outcome on the CAT-027 Booking; Booking status is SM-CAT-05) | Confirmed (SM-CAT-05) | shopper reschedules | BR-SVC-020 policy allows; new slot has a free place | Confirmed (SM-CAT-05), new slot | IC-CAT-07 Move; old place freed by CAT |
| SM-SVC-02 | Booking outcome | Confirmed (SM-CAT-05) | shopper cancels | — | CancelledByCustomer | IC-CAT-07 RecordOutcome; Booking Released; refund per BR-SVC-021 |
| SM-SVC-02 | Booking outcome | Confirmed (SM-CAT-05) | provider cancels | reason given | CancelledByProvider | IC-CAT-07 RecordOutcome; Booking Released; full refund (BR-SVC-022) |
| SM-SVC-02 | Booking outcome | Confirmed (SM-CAT-05) | provider records customer no-show | start + grace passed | NoShowCustomer | IC-CAT-07 RecordOutcome; Booking Completed; policy applied; AUD-SVC-002 |
| SM-SVC-02 | Booking outcome | Confirmed (SM-CAT-05) | operations confirm provider no-show | — | NoShowProvider | IC-CAT-07 RecordOutcome; Booking Completed; full refund; rebook offer |
| SM-SVC-02 | Booking outcome | Confirmed (SM-CAT-05) | service line Accepted | — | Attended | IC-CAT-07 RecordOutcome; Booking Completed |
| SM-SVC-03 | BookingPaymentPlan | (none) | booking with plan Full is paid | — | FullyPaid | — |
| SM-SVC-03 | BookingPaymentPlan | (none) | booking with plan Deposit or No payment upfront is ordered | — | DepositDue | — |
| SM-SVC-03 | BookingPaymentPlan | DepositDue | order 1 Paid | — | BalanceDue | balance due point stored |
| SM-SVC-03 | BookingPaymentPlan | DepositDue | order 1 cancelled unpaid | — | Cancelled | booking capacity released |
| SM-SVC-03 | BookingPaymentPlan | FullyPaid | booking cancelled | — | Cancelled | refund per BR-SVC-021 / BR-SVC-022 (RET-005 trigger) |
| SM-SVC-03 | BookingPaymentPlan | BalanceDue | balance order Paid | sum of paid orders = plan total | FullyPaid | — |
| SM-SVC-03 | BookingPaymentPlan | BalanceDue | due point passes unpaid | — | BalanceOverdue | plan action: remind or cancel |
| SM-SVC-03 | BookingPaymentPlan | BalanceOverdue | balance order Paid | — | FullyPaid | — |
| SM-SVC-03 | BookingPaymentPlan | BalanceDue / BalanceOverdue | booking cancelled | refundable share > 0 | DepositRefunded | refund requested (RET-005 trigger) |
| SM-SVC-03 | BookingPaymentPlan | BalanceDue / BalanceOverdue | booking cancelled | refundable share = 0 | DepositForfeited | — |
| SM-SVC-04 | ServiceVoucher | (none) | order line Paid | — | Issued | sent through TRK-005 |
| SM-SVC-04 | ServiceVoucher | Issued | redeemed (last use) | BR-SVC-070 | Redeemed | AUD-SVC-004 |
| SM-SVC-04 | ServiceVoucher | Issued | validity ends | — | Expired | — |
| SM-SVC-04 | ServiceVoucher | Issued | line refunded | — | Cancelled | — |
| SM-SVC-05 | SlaClock | (none) | clock start point reached | targets exist | Running | due time stored |
| SM-SVC-05 | SlaClock | Running | at-risk threshold reached | — | AtRisk | first escalation level notified |
| SM-SVC-05 | SlaClock | Running / AtRisk | due time passes | — | Breached | escalation levels notified in order |
| SM-SVC-05 | SlaClock | Running / AtRisk | stage reached in time | — | Met | — |
| SM-SVC-06 | RentalHold | (none) | rental line passes the confirm-step check | unit free | Held | — |
| SM-SVC-06 | RentalHold | Held | order placed | — | Converted | — |
| SM-SVC-06 | RentalHold | Held | hold time passes or line removed | — | Released | — |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| ServicePricing (new) | ProductId, Model (BR-SVC-001), UnitLabel (localised), PriceOnRequest | SVC-001 | Price, quantity limits, from-price, rental fields are native Product fields |
| ServiceResource / ResourceQualification / ResourceSchedule (new) | Resource: Id, VendorId, Type (Staff / Team / Equipment / Vehicle), Name, CapacityPerSlot, CoverageAreaIds (LOG-004), ServiceProductIds, IsActive; Qualification: ResourceId, Type, Evidence DownloadId, ValidTo; Schedule: weekly hours, closures | SVC-002, SVC-008 | Vendor is native; no native resource entity |
| Booking extensions (new, on the CAT-027 Booking) | Outcome (SM-SVC-02), RescheduleCount, PolicyVersionIds, ResourceId, CancelReason, NoShowRecordedBy | SVC-003 | Booking record and its Status (SM-CAT-05) owned by CAT-027; SVC writes Outcome only through IC-CAT-07 RecordOutcome |
| ServicePolicy (new) | ProductId or category, Type (Cancellation / NoShow / Deposit / SignOff / Reminder / Sla), Values, EffectiveFromUtc, Version | SVC-003, SVC-004, SVC-010, SVC-011 | |
| BookingPaymentPlan / BookingCartLink (new) | Plan: BookingId, PlanType (Full / Deposit / NoUpfront), Total, DepositAmount, BalanceDuePoint, DepositOrderId, BalanceOrderId, Status (SM-SVC-03); Link: ShoppingCartItemId, BookingId, Part (Full / Deposit / Balance), ExpectedUnitPrice | SVC-004 | Each plan order is a native Order paid in full |
| ServiceOrderStage (new) | OrderItemId, Stage (SM-SVC-01), StageHistory, CompletionNote, EvidenceDownloadIds, AcceptedBy (Customer / Auto), PayoutEligible | SVC-005 | SVC table per order line; stage set and transitions from ORD-002 through IC-ORD-10; the per-line store stays in SVC (BR-ORD-014) |
| BookingLocation (new) | BookingId, Type (AtSite / AtOutlet / Remote), AddressId, Latitude, Longitude, StorePickupPointId, RemoteContact | SVC-006 | Native Address has no coordinates; outlet = StorePickupPoint |
| Downloadable product (native) | Product.IsDownload, DownloadId, UnlimitedDownloads, MaxNumberOfDownloads, DownloadExpirationDays, DownloadActivationTypeId, HasUserAgreement, HasSampleDownload; OrderItem.DownloadCount, IsDownloadActivated, LicenseDownloadId | SVC-007 | Native; no new entity |
| RentalCapacity / RentalHold (new) | Capacity: ProductId, Units (or linked ResourceIds); Hold: ProductId, CustomerId, StartDate, EndDate, Units, ExpiresOnUtc, Status (SM-SVC-06) | SVC-008 | Rental dates on OrderItem.RentalStartDateUtc / RentalEndDateUtc are native |
| ServiceVoucher / VoucherRedemption (new) | Voucher: Code, OrderItemId, ProductId, VendorId, UsesTotal, UsesLeft, ValidFromUtc, ValidToUtc, Status (SM-SVC-04); Redemption: VoucherId, RedeemedBy, Place, RedeemedOnUtc | SVC-009 | Native GiftCard is store credit and is not reused |
| SlaClock / SlaEscalation (new) | Clock: OrderItemId, Type (Response / Completion), TargetVersionId, StartUtc, DueUtc, Status (SM-SVC-05); Escalation: ClockId, Level, NotifiedOnUtc | SVC-011 | |
| ReminderLog (new) | BookingId or OrderItemId, Type (Reminder / Feedback), LeadTime, SentOnUtc | SVC-010 | Prevents duplicates (BR-SVC-080) |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Pricing model and unit labels per service | ServicePricing (new) | vertical (Services pack) → client | — | — |
| Resources, qualifications, hours, coverage, capacity | ServiceResource (new) | client (vendor data) | — | — |
| Cancellation, reschedule, no-show policy per service | ServicePolicy (new) | vertical → client | Not stated | Not stated |
| Payment plan per service; balance due point; overdue action | ServicePolicy (new) | vertical → client | Not stated | Not stated |
| Service stage set and transitions | ORD-002 line stage set (owner ORD; read and checked through IC-ORD-10) | vertical → client | Not stated | Not stated |
| Action for OrderCompleted.CustomerNotification on service-only orders (send, suppress, substitute) | TRK settings (owner TRK-005, BR-TRK-024) | vertical (Services pack) → client | Not stated (open item) | Not stated (open item) |
| Sign-off window | ServicePolicy (new) | client | Not stated | Not stated |
| Location types per service | ServicePricing / product settings (new) | client | Not stated | Not stated |
| Downloadable products | Product download fields; CustomerSettings.DownloadableProductsValidateUser, HideDownloadableProductsTab (native) | client → store | Not stated | Not stated |
| Rental units and hold time | RentalCapacity (new); ServicesSettings (new): servicessettings.rentalholdminutes (key name Proposed; SVC key catalogue, BR-SVC-101) | client | Not stated | Not stated |
| Feature state per client and store | productfeature.<prd-id> for PRD-SVC-001 to PRD-SVC-012 (PLT-022, IC-PLT-02) | client → store | Not stated | Not stated |
| Voucher validity and uses per service | ServicePolicy (new, per service; not setting keys) | client | Not stated | Not stated |
| Reminder lead times; follow-up delay | ServicePolicy (new); TRK-005 templates | vertical → client | Not stated | Not stated |
| SLA targets, at-risk threshold, escalation levels and recipients | ServicePolicy (new) | client | Not stated | Configurable (FR-311, FR-165); values not stated |
| Service products not returnable | Product.NotReturnable (native) | client | Proposed on | Proposed on |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Service page: unit price label, Request a quote, location step, payment plan summary | SVC-001, SVC-004, SVC-006 | Native product page extended |
| Storefront — My account | Bookings (reschedule, cancel with fee preview), pay balance, service stages and sign-off, vouchers, downloads | SVC-003 to SVC-005, SVC-007, SVC-009 | New tabs; downloads tab native |
| Seller portal | Resources and schedules; bookings and stages; no-shows; voucher redemption; reports | SVC-002, SVC-003, SVC-005, SVC-009, SVC-012 | New |
| Admin | Service policies and SLA targets; disputed completions; escalations; reports | SVC-003 to SVC-005, SVC-011, SVC-012 | New |
| Outlet / agent | Voucher redemption; balance payment through assisted checkout | SVC-004, SVC-009 | New (with CHK-013, PAY-034) |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Svc.QuoteRequired | This service is priced on request. Please ask for a quote. | AC-SVC-001-05-02 |
| Svc.NotServiceProvider | Only service providers can manage service resources. | AC-SVC-002-05-01 |
| Svc.CapacityConflict | Some bookings exceed the new capacity of this resource and must be moved. | AC-SVC-002-04-02 |
| Svc.RescheduleNotAllowed | This booking can no longer be changed online. Please contact us. | AC-SVC-003-01-02 |
| Svc.CancellationFee | A cancellation fee applies. The amount shown will be refunded. | AC-SVC-003-02-02 |
| Svc.PriceCheckFailed | The amount for your booking could not be confirmed. Please try again or contact us. | AC-SVC-004-02-02 |
| Svc.StageNotAllowed | This step is not allowed for the service order at its current stage. | AC-SVC-005-01-03 |
| Svc.ConfirmService | Your service is marked as completed. Please confirm it was delivered or tell us if it was not. | AC-SVC-005-01-04 |
| Svc.LocationNotCovered | This service is not available at the chosen location. | AC-SVC-006-03-01 |
| Svc.RentalUnavailable | This item is not available for all the dates you chose. | AC-SVC-008-02-01 |
| Svc.VoucherInvalid | This voucher is not valid. | AC-SVC-009-02-02 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Slot calendar (CAT-027) | GetEligibleResources, GenerateSlots (IC-SVC-01); Move, RecordOutcome, WriteSlots (IC-CAT-07) | CAT module (internal) | CAT owns booking records and Booking status (BR-CAT-021, SM-CAT-05) |
| Quote requests (ORD-012, Misc.RFQ) | IC-ORD-08 create quote request from a product; quoted price in cart | ORD module (internal) | Native plugin extended by ORD; only ORD writes Misc.RFQ tables |
| Line stage sets (ORD-002) | IC-ORD-10 GetLineStageSet, ValidateLineTransition | ORD module (internal) | BR-ORD-014 |
| Notification engine (TRK-005) | IC-TRK-04 RegisterEventCode, SendEvent (booking confirmations, reminders, sign-off requests, vouchers, escalations); IC-TRK-05 order-kind provider | TRK module (internal) | Decision MSG-ROUTE; BR-TRK-024; TRK-006 opt-outs apply |
| Refunds (RET-005, then PAY-016) | RaiseRefundTrigger (IC-RET-04) for BookingCancellation, ProviderNoShow, DepositRefund; Service.Failed event for ServiceFailure | RET / PAY modules (internal) | RET-005 is the single refund-trigger owner |
| Cart rules (SVC-008) | Rental-availability cart check provider (IC-CHK-01) | CHK-003 IShoppingCartService owner (internal, OVR-REG, BR-CHK-015) | |
| Audit trail (all features) | IAuditTrail.WriteAsync (IC-SEC-01) | SEC-004 (internal) | |
| Settlements (SEL-017) | Payout eligibility after sign-off | SEL module (internal) | |
| Voucher redemption (IC-SVC-02) | Validate and redeem | Seller portal, outlet, CHN mobile channel | |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-SVC-01 | GetEligibleResources | Service product, period, location | Resources meeting BR-SVC-010 | No resource; location not covered | SVC availability service (new interface) consumed by the CAT-027 slot calendar |
| IC-SVC-01 | GenerateSlots | Resource, period | CAT BookingSlot rows (ResourceId, StartUtc, EndUtc, Capacity) created or updated | Capacity below confirmed bookings (listed, not reduced) | SVC task writing through IC-CAT-07 WriteSlots; hold, confirm, move, outcome and release stay in CAT-027 (BR-CAT-021) |
| IC-SVC-02 | ValidateVoucher / RedeemVoucher | Code, redeeming vendor or outlet, user | Valid / invalid; remaining uses | VoucherInvalid | SVC seller-portal and outlet endpoints; callable by the CHN mobile channel |

IC-SVC-01 is an internal contract between SVC and CAT-027: CAT owns slots, holds, bookings and their lock 'cat-slot-{SlotId}' (BR-CAT-021); SVC owns resources and supplies which resources may serve and the capacity of their slots. Signatures are produced at L2 build start and approved by the tech lead. SVC implements contracts owned by other modules: IC-CHK-01 cart check provider (CHK-003) and IC-TRK-05 order-kind provider (TRK-005; returns order kind Service when every line is a service line, otherwise none). SVC calls IC-CAT-07, IC-ORD-08, IC-ORD-10, IC-RET-04, IC-TRK-04, IC-PLT-02 and IC-SEC-01.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Service order paid | OrderPaidEvent (native) | SVC consumer enqueues voucher issue (SVC-009) and payment-plan update (SVC-004) |
| Order cancelled | OrderStatusChangedEvent (native) | SVC consumer enqueues booking capacity release; the reconciliation task repairs missed releases |
| Refund completed | OrderRefundedEvent (native) | SVC consumer enqueues voucher cancellation |
| Service failed | Module event Service.Failed (order ID, line, reason) raised by the SVC service | RET-005 enqueues a refund trigger (source ServiceFailure) |
| Service stage changed | Module event Service.StageChanged (order, line, from, to; raised by the SVC stage service, Proposed). ORD Order.StageChanged covers order-level stages only | SLA clocks (SVC-011), feedback (SVC-010), payout eligibility (SEL-017); the transition is checked first through IC-ORD-10 |
| Order completed message | IC-TRK-05 order-kind provider called by the TRK-005 engine | Returns order kind Service; TRK-005 applies the per-client action (BR-TRK-024) |
| Cart line unit price | GetShoppingCartItemUnitPriceEvent (native) | SVC handler sets deposit or balance price (SVC-004); re-checked at the confirm step (BR-SVC-031) |
| Direct add-to-cart and storefront cancel | Action filters on ShoppingCartController.AddProductToCart_Catalog / AddProductToCart_Details, CheckoutController.ConfirmOrder / OpcConfirmOrder, OrderController.CancelOrder | Price-on-request guard, price check, booking cancellation rules; each filter is listed in the ADM extension register (BR-ADM-001, OVR-REG) |
| Rental availability | IC-CHK-01 cart check provider called by the single IShoppingCartService override owned by CHK-003 (OVR-REG, BR-CHK-015); SVC registers no IShoppingCartService override | Overlap check at add-to-cart and at placement |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Last free place of a slot taken by two customers, or a reschedule into it | SVC-002, SVC-003, CAT-027 | The CAT booking service holds under ILocker key 'cat-slot-{SlotId}' (BR-CAT-021); the second request is refused by CAT |
| Reschedule and cancel of the same booking at once | SVC-003 | Both go through IC-CAT-07 (Move, RecordOutcome) under the CAT slot locks (BR-CAT-021); the second call reads the booking as left by the first and is applied to it or refused (transition not allowed) |
| Voucher scanned at two places | SVC-009 | ILocker key 'svc-voucher-{Code}'; one redemption succeeds |
| Overlapping rentals placed by two customers | SVC-008 | Holds and checks under ILocker key 'svc-rental-{ProductId}'; placement re-validates (BR-SVC-060) |
| SLA task and stage change at the same moment | SVC-011 | The task re-reads the stage before marking Breached; a stage reached before the due time wins |
| Balance payment and overdue cancellation at once | SVC-004 | Both take ILocker key 'svc-booking-{BookingId}'; whichever runs second re-reads the plan status |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Booking confirmed, rescheduled, cancelled | Shopper; provider | Email + SMS (TRK-005, IC-TRK-04; BR-SVC-102) | SVC-003 |
| Cancellation fee applied / refund raised | Shopper | Email | SVC-003 |
| Balance due and overdue | Shopper | Email + SMS | SVC-004 |
| Service completed — please confirm | Shopper | Email + SMS (Svc.ConfirmService) | SVC-005 |
| Service reported not delivered | Operations staff | Admin notification | SVC-005 |
| Qualification expired | Provider | Email | SVC-002 |
| Voucher or e-ticket issued | Shopper | Email + SMS | SVC-009 |
| Reminder before service; feedback request after | Shopper | Channels allowed by TRK-006 | SVC-010 |
| SLA at risk / breached | Escalation levels | Email / admin notification | SVC-011 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Bookings by service, provider and status | SVC-012 | D |
| Provider and resource utilisation | SVC-012 | D |
| Completed, not delivered, failed and cancelled services | SVC-012 | D |
| No-shows (customer and provider) | SVC-012 | D |
| Service-level performance | SVC-012, SVC-011 | REQ-MPC-FR-311 (via SVC-011) |
| Deposits and balances outstanding | SVC-004 | D |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-SVC-001 | Service stage change; disputed completion decided | Provider / shopper / operations staff | ServiceOrderStage | old stage, new stage, reason |
| AUD-SVC-002 | Booking rescheduled, cancelled or marked no-show | Shopper / provider / operations staff | Booking | old slot, new slot or status, fee, reason |
| AUD-SVC-003 | Policy or SLA target changed | Operations staff / administrator | ServicePolicy | old values, new values, effective date |
| AUD-SVC-004 | Voucher redeemed or refused | Provider / outlet staff | ServiceVoucher | code, user, place, result |
| AUD-SVC-005 | Resource or qualification changed | Provider | ServiceResource | old values, new values |

Business audit events AUD-SVC-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new entity values are captured by the SEC IRepository<> decorator and need no call. All SVC tables, and SVC changes to CAT booking records through the CAT booking service, are written through IRepository<>; SVC writes nothing through INopDataProvider directly (BR-SEC-010, BR-SEC-011). The native activity log is not used as the audit record. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-SVC-001 | No slot is booked beyond capacity under concurrent bookings. | D (SVC-002); BR-SVC-011 | AC-SVC-002-04-02; T-SVC-02 |
| NFR-SVC-002 | No voucher is redeemed more times than its uses. | D (SVC-009); BR-SVC-070 | AC-SVC-009-02-03; T-SVC-03 |
| NFR-SVC-003 | A booking line is never charged an amount different from its payment plan. | BR-SVC-031 | AC-SVC-004-02-02 |
| NFR-SVC-004 | Availability response time for the slot calendar: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-SVC-001 | P2 | PRD-CAT-026 | |
| PRD-SVC-002 | P2 | PRD-CAT-026 | |
| PRD-SVC-003 | P2 | PRD-CAT-027 | |
| PRD-SVC-004 | P2 | PRD-CAT-027, PRD-PAY-016 | |
| PRD-SVC-005 | P1 | PRD-ORD-002 | |
| PRD-SVC-006 | P2 | PRD-LOG-004 | |
| PRD-SVC-007 | P2 | — | |
| PRD-SVC-008 | P2 | — | |
| PRD-SVC-009 | P2 | PRD-CAT-026 | |
| PRD-SVC-010 | P2 | PRD-TRK-005 | |
| PRD-SVC-011 | P1 | PRD-ORD-011 | |
| PRD-SVC-012 | P2 | PRD-CAT-027 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-SVC-01 | End-to-end service journey per the workbook "Services view": list, find, book (with location), pay (full, deposit, none), deliver, sign off, refund on failure. |
| T-SVC-02 | Capacity: parallel bookings of the last unit; exactly one succeeds. |
| T-SVC-03 | Vouchers: parallel redemption; expiry; cancellation on refund. |
| T-SVC-04 | Payment plans: deposit and balance orders sum to the plan total; a failed price handler blocks the confirm step. |
| T-SVC-05 | Rental: overlapping requests across two customers; placement re-validation. |
| T-SVC-06 | Native behaviour checks: service-only order becomes Complete at payment while the stage stays Requested; storefront cancel of a paid booking order is routed to SVC rules. |
| T-SVC-07 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-SVC-08 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
