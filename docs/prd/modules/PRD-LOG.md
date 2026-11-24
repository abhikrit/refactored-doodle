# L2 Module PRD — LOG: Shipping, logistics and fulfilment

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | LOG — Shipping, logistics and fulfilment |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Offers the delivery and pickup options each client requires, prices them by its fee rules, promises a realistic delivery date, allocates and fulfils each order from the right place, connects to couriers and postal systems through one carrier framework, prints labels that postal and courier scanners can read, records proof of delivery, handles failed deliveries, cash on delivery and parcels waiting at outlets, and supports the Malawi Post postal network (seller pickups, drop-off, hub sorting, last mile, S10 identifiers, cross-border exchange) where decision FG-06 keeps it in the product.

**In scope**

- Shipping methods (service levels), rates, delivery fee rule engine, serviceability, estimated delivery time (LOG-001 to LOG-005)
- Pickup points and outlets on the native StorePickupPoint, with capacity flag and temporary closures (LOG-003)
- Carrier connector framework and carrier adapters: DHL, FedEx, G4S, Skynet, Wells Fargo (Kenya), Aramex, shipping lines and agents, Malawi Post delivery partners (LOG-006, LOG-021, LOG-025 to LOG-031)
- Shipments, labels and barcodes, fulfilment allocation, warehouse pick, pack, stage and dispatch, manifests (LOG-007 to LOG-010)
- Proof of delivery, delivery exceptions, COD cash reconciliation, address validation and geocoding (LOG-012 to LOG-015)
- Cross-border postal exchange (UPU CDS, IPS, GMS), S10 identifiers, holding charges and pre-dispatch changes, logistics KPIs (LOG-016 to LOG-018, LOG-020)
- Postal operations held by FG-06: logistics tasks and seller pickup, post-office drop-off, hub sorting, last-mile route lists, own-fleet POD capture (LOG-011, LOG-022 to LOG-024, LOG-032)
- Specialised logistics (cold chain, hazardous goods), P3 (LOG-019)

**Not in this module**

| Item | Where it is |
|---|---|
| Tracking event store, event dictionary, missed-scan rules, public tracking page | TRK module (PRD-TRK-001, TRK-002) — LOG adapters and postal interfaces feed events into TRK-002 |
| Scanning and field operations app (handheld scanning at pickup, hub and delivery) | TRK module (PRD-TRK-003, external app, held by FG-06) |
| Customer notifications for shipment events (shipped, out for delivery, ready for pickup, attempt failed, pickup reminders) | TRK module (PRD-TRK-012) through the TRK-005 engine |
| Payment and COD fees; marking a COD order paid | PAY module (PRD-PAY-015, PAY-008) — LOG-002 owns delivery and pickup fee tables; LOG-014 reconciles the courier cash |
| Pickup code or QR issued to the buyer, its check, attempts and locking | CHK module (PRD-CHK-012) — the LOG-012 hand-over step calls the CHK-012 check (IC-CHK-09) |
| Estimated delivery shown at checkout; delivery slot and instructions; structured address and map pin | CHK module (PRD-CHK-014, CHK-006, CHK-007) — LOG-005 computes the date; LOG-015 stores coordinates |
| Per-line fulfilment choice (delivery or pickup per item) | CHK module (PRD-CHK-005, core modification) |
| Splitting a multi-seller order into seller sub-orders | CHK module (PRD-CHK-004) |
| Seller order acceptance and hand-over screens | ORD module (PRD-ORD-005) — LOG-009 and LOG-011 provide the fulfilment steps |
| Warehouses, stock per warehouse, warehouse and postal-facility codes and coordinates | INV module (PRD-INV-002) |
| Seller locations and fulfilment opt-in | SEL module (PRD-SEL-018) |
| PostGlobal exchange | INT module (PRD-INT-007) |
| Executive KPI framework and external BI | RPT module (PRD-RPT-002, RPT-008) |
| Hub sorting operations and IPS / CDS / GMS systems themselves | External systems (fit: Not implementable in nopCommerce, LOG-016, LOG-023) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-LOG-001 | Shipping methods and rates | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-LOG-002 | Delivery fee rule engine | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-003 | Pickup points and outlets | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-004 | Serviceability rules | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-005 | Estimated delivery time engine | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-006 | DHL adapter | B2B + B2C | P1 | Licensed plugin | None | Carrier adapter (reusable) | PRD-LOG-021 | |
| PRD-LOG-007 | Shipping labels and barcodes | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-008 | Fulfilment allocation and routing | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-009 | Warehouse pick, pack, dispatch | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-010 | Shipments | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-LOG-011 | Logistics task creation and seller pickup | Platform / back-office | P1 | Code-level | Custom plugin | Postal and logistics pack | | FG-06 |
| PRD-LOG-012 | Proof of delivery record | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-013 | Delivery exceptions | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-014 | COD cash reconciliation | Platform / back-office | P1 | Code-level | Custom plugin | Postal and logistics pack | | |
| PRD-LOG-015 | Address validation and geocoding | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-016 | Cross-border shipping | B2B + B2C | P1 | External system | External system + integration plugin | Postal and logistics pack | | |
| PRD-LOG-017 | Holding charges and pre-dispatch changes | B2B + B2C | P1 | Code-level | Custom plugin | Postal and logistics pack | | |
| PRD-LOG-018 | Logistics KPIs | Platform / back-office | P1 | Code-level | Custom plugin | Postal and logistics pack | | PAID-STUB |
| PRD-LOG-019 | Specialised logistics | B2B + B2C | P3 | External system | External system + integration plugin | Warehouse pack | | |
| PRD-LOG-020 | S10 identifiers | B2B + B2C | P1 | Code-level | Custom plugin | Postal and logistics pack | | |
| PRD-LOG-021 | Carrier connector framework | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-LOG-022 | Post-office drop-off acceptance | Platform / back-office | P1 | Code-level | Custom plugin | Postal and logistics pack | PRD-TRK-003 | FG-06 |
| PRD-LOG-023 | Hub-and-spoke sorting | Platform / back-office | P1 | External system | External system + integration plugin | Postal and logistics pack | PRD-TRK-003 | FG-06 |
| PRD-LOG-024 | Last-mile route lists and attempts | Platform / back-office | P1 | Code-level | Custom plugin | Postal and logistics pack | PRD-TRK-003 | FG-06 |
| PRD-LOG-025 | FedEx adapter | B2B + B2C | P1 | Code-level | Custom plugin | Carrier adapter (reusable) | PRD-LOG-021 | |
| PRD-LOG-026 | G4S adapter | B2B + B2C | P1 | Code-level | Custom plugin | Carrier adapter (reusable, Kenya) | PRD-LOG-021 | |
| PRD-LOG-027 | Skynet adapter | B2B + B2C | P1 | Code-level | Custom plugin | Carrier adapter (reusable, Kenya) | PRD-LOG-021 | |
| PRD-LOG-028 | Wells Fargo (Kenya) courier adapter | B2B + B2C | P1 | Code-level | Custom plugin | Carrier adapter (reusable, Kenya) | PRD-LOG-021 | |
| PRD-LOG-029 | Aramex adapter | B2B + B2C | P1 | Code-level | Custom plugin | Carrier adapter (reusable) | PRD-LOG-021 | |
| PRD-LOG-030 | Shipping lines and agents adapter | B2B + B2C | P1 | Code-level | Custom plugin | Carrier adapter (reusable, Kenya) | PRD-LOG-021 | |
| PRD-LOG-031 | MPC delivery partner adapters | B2B + B2C | P1 | Code-level | Custom plugin | Client: MPC | PRD-LOG-021 | |
| PRD-LOG-032 | Own-fleet POD capture | Platform / back-office | P1 | External system | External system + integration plugin | Postal and logistics pack | PRD-TRK-003, PRD-LOG-012 | FG-06, PAID-STUB |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Chooses a delivery method or pickup point, sees fees, breakdown and expected dates, changes the address before dispatch, collects parcels | Guests / Registered (native) |
| Business buyer | Same as shopper; international and bulk orders (KTDA) | Registered; company accounts IAM-022; role TradeBuyer (BR-IAM-050) |
| Seller | Sets delivery coverage, prints pick and packing lists and labels for own orders, hands parcels over (pickup or drop-off) | Vendors (native) |
| Warehouse staff | Pick, pack, stage, dispatch, print labels and manifests | Role system name "Warehouse" (BR-IAM-050) |
| Logistics operations staff | Allocation overrides, carrier bookings, delivery exceptions, seller pickups, logistics tasks, customs declarations, outlet status | Role system name "LogisticsOps" (BR-IAM-050) |
| Outlet / post-office staff (agent) | Accepts drop-offs, hands parcels to collectors, verifies pickup codes, collects holding charges | Role system name "Agent" (BR-IAM-050) |
| Courier (own fleet) | Works the daily route list, records attempts, captures proof of delivery, collects COD cash | Role system name "Courier" (BR-IAM-050); app external (LOG-032) |
| Finance staff | Reconciles courier COD cash | Role system name "Finance" (BR-IAM-050) |
| Logistics manager | Reads the logistics KPI dashboard | Role system name "LogisticsOps" (BR-IAM-050) |
| Client administrator | Configures service levels, fee tables, coverage areas, delivery standards, outlets, carriers, label templates, proof methods, postal-pack settings | Administrators (native) |
| Platform team | Builds and certifies carrier adapters against the connector framework | Not a runtime role |
| Carrier / delivery partner (system) | Returns rates, bookings, labels and tracking events | External system via adapter |
| UPU and postal systems (CDS, IPS, GMS), PostGlobal (system) | Receive and send customs and tracking data | External systems via integration plugin / INT-007 |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Configuration.ManageShippingSettings (native) | Configuration | Shipping methods, rate tables, warehouses, pickup points; with LOG installed also fee tables, coverage areas, delivery standards, outlet status, carrier adapters and rules, label templates, proof methods and postal-pack settings | Administrators |
| Orders.ShipmentsView (native) | Orders | View shipments and packaging slips; with LOG also labels, manifests and proof-of-delivery summary | Administrators, Vendors (own shipments, native filter) |
| Orders.ShipmentsCreateEditDelete (native) | Orders | Create shipments, set tracking numbers, mark shipped, ready for pickup and delivered (native actions intercepted per BR-LOG-160) | Administrators, Vendors (own shipments) |
| Logistics.Core.Fulfilment.View | Orders | View allocation, pick lists, packing and dispatch queues and manifests | Warehouse, LogisticsOps |
| Logistics.Core.Fulfilment.CreateEditDelete | Orders | Confirm pick, pack, stage and dispatch; override allocation with a reason; book and cancel carriers; print labels | Warehouse, LogisticsOps |
| Logistics.Core.Operations.CreateEditDelete | Orders | Logistics tasks, seller pickup schedules, drop-off acceptance, route lists and attempts, customs declarations | LogisticsOps, Agent (drop-off), Courier (own route list) |
| Logistics.Core.Exceptions.CreateEditDelete | Orders | Record and resolve delivery exceptions and incidents; schedule redelivery; return to sender; waive holding charges | LogisticsOps |
| Logistics.Core.ProofOfDelivery.View | Orders | View proof-of-delivery media, signatures and coordinates | LogisticsOps |
| Logistics.Core.CashReconciliation.CreateEditDelete | Orders | Record courier COD remittances and resolve discrepancies | Finance |
| Logistics.Core.Reports.View | Reports | Logistics KPI dashboard | LogisticsOps, Administrators |

Permissions are declared in a LOG plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). Native permissions are reused where they exist: Configuration.ManageShippingSettings guards the native shipping and pickup-point pages (FIT: Admin ShippingController, PickupInStoreController), Orders.ShipmentsView / Orders.ShipmentsCreateEditDelete guard the native shipment actions and are granted to Vendors by default (FIT: DefaultPermissionConfigManager). New names use the plugin prefix and the 5.00 view / create-edit-delete split (StandardPermission naming unchanged in 5.00.1); Category is from the native set. Every default role is spelled as in the product role catalogue BR-IAM-050 (Warehouse, LogisticsOps, Courier, Agent and Finance are listed there); the IAM plugin creates a missing catalogue role at install and at start (BR-IAM-050). LOG does not rely on native start-up to create roles: PermissionService creates a missing default role only when it installs a new permission. Holding Orders.ShipmentsCreateEditDelete alone does not bypass LOG rules: the native admin shipment actions listed in BR-LOG-160 are intercepted by a LOG action filter. All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-LOG-PERM-01 | **Given** a user without Configuration.ManageShippingSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-02 | **Given** a user without Orders.ShipmentsView (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-03 | **Given** a user without Orders.ShipmentsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-04 | **Given** a user without Logistics.Core.Fulfilment.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-05 | **Given** a user without Logistics.Core.Fulfilment.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-06 | **Given** a user without Logistics.Core.Operations.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-07 | **Given** a user without Logistics.Core.Exceptions.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-08 | **Given** a user without Logistics.Core.ProofOfDelivery.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-09 | **Given** a user without Logistics.Core.CashReconciliation.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-LOG-PERM-10 | **Given** a user without Logistics.Core.Reports.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-LOG-001 | Shipping methods with country restrictions; bundled Fixed/By-weight-by-total rates (by store, warehouse, country, state, zip, weight and subtotal ranges, transit days); free shipping over X; delivery date ranges. \| Fixed/By-weight-by-total plugin v5.00.8 bundled. \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Shipping.FixedByWeightByTotal/plugin.json; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/ShippingMethod.cs:ShippingMethod; src/Plugins/Nop.Plugin.Shipping.FixedByWeightByTotal/Domain/ShippingByWeightByTotalRecord.cs (WeightFrom/To, OrderSubtotalFrom/To, TransitDays); src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.FreeShippingOverXEnabled; src/Libraries/Nop.Core/Domain/Shipping/DeliveryDate.cs:DeliveryDate; PG CHK-04, CHK-06 | None for the stated feature. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-002 | Rates by country/state/zip/warehouse, weight and subtotal; pickup fee per point. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Plugins/Nop.Plugin.Shipping.FixedByWeightByTotal | Distance/zone, speed, rural/urban rules, fee breakdown, partner revenue share. Custom IShippingRateComputationMethod plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-003 | Bundled Pickup in store: pickup points with address, opening hours text, fee, lat/long, transit days, store; map display. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Pickup.PickupInStore/Domain/StorePickupPoint.cs:StorePickupPoint.OpeningHours, PickupFee, Latitude, Longitude, TransitDays; src/Libraries/Nop.Services/Shipping/Pickup/IPickupPointProvider.cs; src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.DisplayPickupPointsOnMap; PG CHK-03 | Capacity and temporary closures. Custom IPickupPointProvider plugin or extension. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-004 | Shipping-method country restrictions; rates by state/zip. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/ShippingMethodCountryMapping.cs; src/Plugins/Nop.Plugin.Shipping.FixedByWeightByTotal | Serviceability by location/outlet and per-seller coverage areas. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-005 | Transit days per rate/pickup point; delivery date ranges. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Pickup.PickupInStore/Domain/StorePickupPoint.cs:StorePickupPoint.TransitDays; src/Libraries/Nop.Core/Domain/Shipping/DeliveryDate.cs:DeliveryDate | EDT engine from service standards, cut-offs and transport links. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-006 | Carrier plugin contract (rates + tracking). Only UPS is bundled in 4.90.8. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker; src/Plugins/Nop.Plugin.Shipping.UPS; Plugin evaluation | DHL rates/booking/labels/tracking → candidates nopStation DHL Shipping Integration (lists 4.70) or FoxNetSoft DHL Connector 2 (lists 4.70). 5.00 support not verifiable from source; confirm with vendor; build fallback. Availability of this licensed plugin for 5.00 is not verifiable from source (evidence is Post Gebeya on 4.70.5); decision V-01. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: plugin evidence is the plugin evaluation (marketplace listings for 4.70); no DHL plugin in source |
| PRD-LOG-007 | PDF packaging slips per shipment. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Common/IPdfService.cs:IPdfService.PrintPackagingSlipToPdfAsync; PG ORD-06, INT-04 | Barcoded labels (no barcode library in source) and ZPL network printing. Post Gebeya Zebra (ORD-06, INT-04) is AFR evidence only: AFR port required. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-008 | Multiple warehouses with per-warehouse stock; shipping origin from warehouse. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.UseMultipleWarehouses; src/Libraries/Nop.Core/Domain/Catalog/ProductWarehouseInventory.cs:ProductWarehouseInventory; src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.UseWarehouseLocation | Allocation to seller/client/3PL and nearest-warehouse routing. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-009 | Shipments, packaging slips (bulk PDF). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:PdfPackagingSlipAll; PG CAT-03 | Pick lists, pack/dispatch confirmation, manifests, shelf location (Post Gebeya CAT-03 is AFR: AFR port required). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-010 | Multiple shipments per order with tracking number, shipped/ready-for-pickup/delivered dates, packaging slip, customer notifications, shipment events. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/Shipment.cs:Shipment.TrackingNumber, ShippedDateUtc, ReadyForPickupDateUtc, DeliveryDateUtc; message templates ShipmentSent/ShipmentReadyForPickup/ShipmentDelivered.CustomerNotification; src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.DisplayShipmentEventsToCustomers; PG ORD-05, ADM-S03 | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-011 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No logistics task entity in src/Libraries/Nop.Core/Domain | Logistics tasks (collect/sort/dispatch/deliver) and seller pickup scheduling. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-LOG-012 | Shipment delivered date only. \| 5.00 OTP (OtpSettings, phone verification via ISmsService) is for customer phone login/verification only, not delivery confirmation. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Customers/OtpSettings.cs; Presentation/Nop.Web/Controllers/CustomerController.cs:632; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/Shipment.cs:Shipment.DeliveryDateUtc | POD record (courier confirmation, OTP/QR check at counter). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-013 | Customer return requests exist (not delivery exceptions). \| 5.00: return-request settings moved to ReturnRequestSettings (adds guest returns, withdrawal link); still customer returns, not delivery exceptions. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/ReturnRequest.cs:ReturnRequest | Failed delivery handling: redelivery, address correction, RTS, incidents, escalation. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-LOG-014 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No cash/run entity in src/Libraries/Nop.Core/Domain | Courier cash-to-order/run matching. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-LOG-015 | Address fields and custom address attributes; Google Maps key used for pickup map only. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Common/Address.cs:Address (no lat/long); src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.GoogleMapsApiKey; PG CUS-05 | Validation and geocoding (lat/long on address), digital postcodes. Requires an external geocoding/validation API + custom plugin; candidate NopStation address validation (PG CUS-05, Google only; 5.00 support not verifiable from source; confirm with vendor) covers validation only. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-016 | Shipping by country; shipments with tracking. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/Shipment.cs:Shipment; PG CHK-05, INT-03 | External UPU CDS (customs declarations) and IPS (international tracking). nopCommerce needs an integration plugin (customs data on items/shipments, EDI exchange, duties display). Post Gebeya CHK-05/INT-03 are AFR: AFR port required. Scope: UPU GMS (Global Monitoring System) data exchange in addition to CDS and IPS. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: CDS and IPS are external postal systems named in the feature |
| PRD-LOG-017 | Admin can edit order shipping address. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs:AddressEdit | Customer self-service address change before dispatch; daily storage fee after free days. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-018 | Shipment dates available as data; bundled Misc.PowerBI is a stub (link to purchase). \| Re-verified in 5.00.1: Misc.PowerBI (v5.00.3) still a stub. \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Misc.PowerBI/Views/Configure.cshtml; 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Misc.PowerBI/Views/Configure.cshtml (stub); src/Libraries/Nop.Core/Domain/Shipping/Shipment.cs:Shipment | On-time, success-rate and transit-time dashboards. Custom admin report plugin (or external BI). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-019 | Product attributes/specifications can flag cold-chain or hazardous goods. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/SpecificationAttribute.cs:SpecificationAttribute | Temperature recording through the journey and out-of-range alerts require external IoT/telematics; certified carriers and documents are carrier-side. nopCommerce needs an integration plugin (receive telemetry/alerts, attach documents, restrict carriers). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: telemetry capture is outside a storefront |
| PRD-LOG-020 | Shipment tracking number field. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/Shipment.cs:Shipment.TrackingNumber; PG ORD-04 | S10 identifier generation with check digit and validation. Post Gebeya ORD-04 (mail identifier counters) is AFR: AFR port required. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-LOG-021 | Carrier contract covers rates and tracking (URL + status events); bundled UPS plugin uses it. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod.GetShippingOptionsAsync, GetShipmentTrackerAsync; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker.GetShipmentEventsAsync; src/Plugins/Nop.Plugin.Shipping.UPS | Booking, label, cancel operations and best-carrier selection rules. Custom plugin defining extended carrier interface. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-LOG-022 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No acceptance entity in src/Libraries/Nop.Core/Domain | Counter drop-off acceptance with scanning. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-LOG-023 | Shipment status events can be displayed from a tracker. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker.GetShipmentEventsAsync | Hub sorting and handover scans belong to the postal operations / track-and-trace system (e.g. IPS or the operator's sorting system — not named in source). nopCommerce needs an integration (IShipmentTracker events in, status updates). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: hub sorting is a postal operations function, not a storefront function |
| PRD-LOG-024 | None. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: No route/attempt entity in src/Libraries/Nop.Core/Domain | Daily driver/courier route lists and attempt recording (mobile-friendly admin pages). Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-LOG-025 | Carrier contract; no FedEx plugin in 4.90.8 (only UPS bundled). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker; Plugin evaluation | FedEx adapter. Custom plugin; candidate marketplace 'Shipping plugin for FedEx' (4.70 not stated) to evaluate. Scope: Carrier tracking events fed into the tracking event hub (TRK-002), as far as each carrier system allows (carrier API availability unverified, F-3). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no FedEx plugin in src/Plugins |
| PRD-LOG-026 | Carrier plugin contract (rates + tracking). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker; Plugin evaluation | G4S (Kenya) adapter on the carrier framework (PRD-LOG-021). Custom plugin. the search found no nopCommerce plugin. Scope: Carrier tracking events fed into the tracking event hub (TRK-002), as far as each carrier system allows (carrier API availability unverified, F-3). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such carrier plugin in src/Plugins |
| PRD-LOG-027 | Carrier plugin contract (rates + tracking). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker; Plugin evaluation | Skynet adapter on the carrier framework (PRD-LOG-021). Custom plugin. the search found no nopCommerce plugin. Scope: Carrier tracking events fed into the tracking event hub (TRK-002), as far as each carrier system allows (carrier API availability unverified, F-3). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such carrier plugin in src/Plugins |
| PRD-LOG-028 | Carrier plugin contract (rates + tracking). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker; Plugin evaluation | Wells Fargo (Kenya) adapter on the carrier framework (PRD-LOG-021). Custom plugin. the search found no nopCommerce plugin. Scope: Carrier tracking events fed into the tracking event hub (TRK-002), as far as each carrier system allows (carrier API availability unverified, F-3). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such carrier plugin in src/Plugins |
| PRD-LOG-029 | Carrier plugin contract (rates + tracking). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker; Plugin evaluation | Aramex adapter on the carrier framework (PRD-LOG-021). Custom plugin. the search found no nopCommerce plugin. Scope: Carrier tracking events fed into the tracking event hub (TRK-002), as far as each carrier system allows (carrier API availability unverified, F-3). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such carrier plugin in src/Plugins |
| PRD-LOG-030 | Carrier plugin contract (rates + tracking). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker; Plugin evaluation | Shipping lines/agents (not named) adapter on the carrier framework (PRD-LOG-021). Custom plugin. the search found no nopCommerce plugin. Scope: Carrier tracking events fed into the tracking event hub (TRK-002), as far as each carrier system allows (carrier API availability unverified, F-3). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such carrier plugin in src/Plugins |
| PRD-LOG-031 | Carrier plugin contract (rates + tracking). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Shipping/IShippingRateComputationMethod.cs:IShippingRateComputationMethod; src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs:IShipmentTracker; Plugin evaluation | Malawi Post delivery partners (not named) adapter on the carrier framework (PRD-LOG-021). Custom plugin. the search found no nopCommerce plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such carrier plugin in src/Plugins |
| PRD-LOG-032 | Bundled Misc.NopMobileApp is a stub (configure page only); no POD fields on Shipment. \| Re-verified in 5.00.1: Misc.NopMobileApp (v5.00.3) still a stub (configure page links to nopcommerce.com/ecommerce-mobile-app). \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Misc.NopMobileApp/Views/Configure.cshtml; 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Misc.NopMobileApp/Views/Configure.cshtml (stub); src/Libraries/Nop.Core/Domain/Shipping/Shipment.cs:Shipment | Phone app for own-fleet staff capturing signature, photo, GPS — native mobile app build is outside nopCommerce. nopCommerce needs an API plugin receiving POD and attaching it to the shipment. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-LOG-001 Shipping methods and rates

| Item | Value |
|---|---|
| Description (baseline) | Delivery options by country with prices by weight or order value, free delivery above a threshold, and expected delivery date ranges. |
| Why it matters | Customers see delivery cost and timing clearly. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-001-01 | As a client administrator, I want to set up several delivery methods (service levels) such as standard, express and pickup, each with its price rule and delivery time, so that buyers can choose how their order reaches them. | D; REQ-KTDA-LOG-002; REQ-MPC-FR-184 | Ready |
| US-LOG-001-02 | As a shopper, I want the delivery charge to be calculated for my cart and address, so that I pay the right amount. | D; REQ-KTDA-LOG-001 | Ready |
| US-LOG-001-03 | As a client administrator, I want free delivery above an order value I choose, so that larger orders are encouraged. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-001-01-01 | US-LOG-001-01 | **Given** three shipping methods are active and allowed for the shopper's country (ShippingMethodCountryMapping), **when** the shopper reaches the delivery step, **then** all three are listed with name, description, price and expected delivery range, in the configured display order. | REQ-KTDA-LOG-002; REQ-MPC-FR-184; FIT |
| AC-LOG-001-01-02 | US-LOG-001-01 | **Given** a shipping method is not allowed for the destination country, **when** the shopper reaches the delivery step, **then** that method is not listed. | FIT (ShippingMethodCountryMapping) |
| AC-LOG-001-01-03 | US-LOG-001-01 | **Given** a service level has transit days set (rate table TransitDays or LOG-005 standard), **when** its price is shown, **then** the expected delivery range for that level is shown next to it (LOG-005); the service level, price and promised range are stored with the order. | REQ-MPC-FR-184; FIT (ShippingByWeightByTotalRecord.TransitDays) |
| AC-LOG-001-02-01 | US-LOG-001-02 | **Given** a rate table by weight and order subtotal is configured for a method, **when** the cart weight or subtotal changes, **then** the delivery charge is recalculated on the next display of the delivery step and of the order summary. | REQ-KTDA-LOG-001; FIT (FixedByWeightByTotal) |
| AC-LOG-001-02-02 | US-LOG-001-02 | **Given** the LOG-002 fee engine is the active rate method, **when** the shopper reaches the delivery step, **then** the charge comes from the LOG-002 fee rules (BR-LOG-010), not from a fixed amount. | REQ-KTDA-LOG-001; see LOG-002 (REQ-MPC-FR-105) |
| AC-LOG-001-03-01 | US-LOG-001-03 | **Given** ShippingSettings.FreeShippingOverXEnabled is on with a value set, **when** the order subtotal reaches the value, **then** the delivery charge is zero for every method and the summary shows free delivery. | D; FIT (FreeShippingOverXValue, FreeShippingOverXIncludingTax) |
| AC-LOG-001-01-04 | US-LOG-001-01 | **Given** no method is available for the address, **when** the shopper reaches the delivery step, **then** checkout stops with message Log.NoDeliveryAvailable and offers pickup points if any are available (LOG-003). | Proposed |

**Business rules applied:** BR-LOG-002; BR-LOG-010 (§8.1).


### 7.2 PRD-LOG-002 Delivery fee rule engine

| Item | Value |
|---|---|
| Description (baseline) | Calculates delivery fees from distance or zone, service speed, rural or urban location and pickup versus delivery, shows the breakdown, and can share revenue with delivery partners. |
| Why it matters | Fair, accurate delivery pricing. |
| Who benefits | Shoppers; logistics staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-002-01 | As a client administrator, I want to define delivery fees from distance or zone, weight, service speed, rural or urban location and pickup versus delivery, so that fees follow our price tables. | D; REQ-MPC-FR-105; REQ-MPC-FR-304 | Ready |
| US-LOG-002-02 | As a shopper, I want to see how my delivery fee is made up before I pay, so that I understand what I pay for. | D; REQ-MPC-FR-105 | Ready |
| US-LOG-002-03 | As a client administrator, I want to set pickup fees and delivery fees separately and keep versions with effective dates, so that past orders keep the fee that applied. | REQ-MPC-FR-198; REQ-MPC-FR-304 | Ready |
| US-LOG-002-04 | As a member of logistics operations staff, I want a share of each delivery fee to be recorded for the delivery partner that carries the parcel, so that partner revenue share is calculated without manual work. | D; REQ-MPC-FR-198 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-002-01-01 | US-LOG-002-01 | **Given** a fee table defines a base fee per service level and zone, a weight band component and a rural surcharge, **when** an order for a rural address with a weight in band 2 is quoted, **then** the fee = base (service level, zone) + band-2 component + rural component, using the table version in force (BR-LOG-010, BR-LOG-012). | REQ-MPC-FR-105; REQ-MPC-FR-304 |
| AC-LOG-002-01-02 | US-LOG-002-01 | **Given** a fee table uses distance bands, **when** the origin and the destination both have coordinates (origin warehouse read through IC-INV-05 GetWarehouseLocation; destination LOG-015), **then** the distance band is chosen from the straight-line distance (BR-LOG-011). | REQ-MPC-FR-105; Proposed (distance method) |
| AC-LOG-002-01-03 | US-LOG-002-01 | **Given** a fee table uses distance bands, **when** the destination has no coordinates, **then** the zone table of the same service level applies; if none exists, the option is not offered and the case is logged (BR-LOG-011). | Proposed |
| AC-LOG-002-01-04 | US-LOG-002-01 | **Given** a delivery and a pickup option exist for the same service level, **when** the fees are calculated, **then** the pickup option uses the pickup fee table and the outlet's PickupFee, and the delivery option uses the delivery table. | REQ-MPC-FR-105; REQ-MPC-FR-304; FIT (StorePickupPoint.PickupFee) |
| AC-LOG-002-01-05 | US-LOG-002-01 | **Given** the location type of the destination area is urban and the urban table differs from the rural table, **when** the fee is calculated, **then** the urban table applies; location type comes from the LOG-004 coverage area (BR-LOG-021). | REQ-MPC-FR-304 |
| AC-LOG-002-01-06 | US-LOG-002-01 | **Given** the shopper changes the address, cart weight or service level, **when** the delivery step is shown again, **then** the fee is recalculated (dynamic calculation). | REQ-KTDA-LOG-001 |
| AC-LOG-002-02-01 | US-LOG-002-02 | **Given** a fee has more than one component, **when** the delivery options and the order summary are shown, **then** each component (base, weight, distance or zone, location type, pickup or delivery) is listed with its amount under label Log.FeeBreakdown, and the components sum to the fee. | REQ-MPC-FR-105 |
| AC-LOG-002-02-02 | US-LOG-002-02 | **Given** an order is placed, **when** the order is inserted, **then** the quote used (components, table version, service level) is stored against the order (OrderDeliveryQuote) from the selected shipping option; if it cannot be linked, the order is listed in the logistics exceptions view. | Proposed; FIT (SelectedShippingOption generic attribute is reset before OrderPlacedEvent) |
| AC-LOG-002-03-01 | US-LOG-002-03 | **Given** a new fee table version is saved with a future effective date, **when** an order is placed before that date, **then** the previous version applies and the order records the version used (BR-LOG-012); the change is audited (AUD-LOG-002). | REQ-MPC-FR-304; REQ-MPC-FR-198 |
| AC-LOG-002-03-02 | US-LOG-002-03 | **Given** pickup fees are configured per outlet and per service level, **when** a pickup option is quoted, **then** the pickup fee configured for that outlet and level applies. | REQ-MPC-FR-198 |
| AC-LOG-002-03-03 | US-LOG-002-03 | **Given** the INT-010 tariff sync delivers rows with an external key and an effective date, **when** the rows are written to the fee tables, **then** they are stored as a fee-table version with that effective date and external key; a row whose external key and effective date already exist replaces the stored row only while no order has used that version, otherwise it is refused and listed in the configuration exceptions list; orders keep the version in force when they were placed (BR-LOG-012). | REQ-MPC-FR-304; see INT-010 (REQ-MPC-FR-349); Proposed (replace rule) |
| AC-LOG-002-04-01 | US-LOG-002-04 | **Given** a revenue-share rule (fixed or percentage of the delivery fee) exists for a partner and service level, **when** a shipment is assigned to that partner (LOG-021), **then** the partner share and the client share are recorded per shipment, sum to the delivery fee and use the rule version in force at assignment (BR-LOG-013). | REQ-MPC-FR-198 |
| AC-LOG-002-04-02 | US-LOG-002-04 | **Given** no revenue-share rule exists for the assigned partner, **when** the shipment is assigned, **then** no share is recorded and the shipment appears in the configuration exceptions list. | Proposed |

**Business rules applied:** BR-LOG-010; BR-LOG-011; BR-LOG-012; BR-LOG-013; BR-LOG-014; BR-LOG-021 (§8.1).


### 7.3 PRD-LOG-003 Pickup points and outlets

| Item | Value |
|---|---|
| Description (baseline) | A list of pickup points and outlets with opening hours, capacity, temporary closures and a map. |
| Why it matters | Customers choose a convenient collection point. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-003-01 | As a shopper, I want to choose a pickup point or outlet from a list and a map with its opening hours, so that I can collect my order where it suits me. | D; REQ-MPC-FR-188 | Ready |
| US-LOG-003-02 | As a member of logistics operations staff, I want to mark an outlet as temporarily closed for a period or as full, so that buyers are not sent to an outlet that cannot take their parcel. | D; REQ-MPC-FR-188 | Ready |
| US-LOG-003-03 | As a client administrator, I want to maintain outlets with address, opening hours, fee and coordinates, so that the outlet list is correct. | D; FIT | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-003-03-01 | US-LOG-003-03 | **Given** an outlet is created as a StorePickupPoint (bundled Pickup.PickupInStore data) with address, OpeningHours, PickupFee, Latitude, Longitude and TransitDays, **when** it is saved, **then** it is stored once in the native table; the LOG outlet extension (capacity flag, closures) references it by StorePickupPointId; no second outlet table is created. | D; FIT (StorePickupPoint) |
| AC-LOG-003-01-01 | US-LOG-003-01 | **Given** pickup is allowed (ShippingSettings.AllowPickupInStore) and the LOG outlet provider is active (ActivePickupPointProviderSystemNames), **when** the shopper chooses pickup, **then** outlets of the current store are listed with name, address, opening hours and fee; with DisplayPickupPointsOnMap on they appear on the map. | REQ-MPC-FR-188; FIT (IPickupPointProvider, GoogleMapsApiKey) |
| AC-LOG-003-02-01 | US-LOG-003-02 | **Given** an outlet has a closure from date A to date B, **when** a shopper whose expected arrival date (LOG-005) falls between A and B chooses pickup, **then** that outlet is not offered, or is shown disabled with message Log.OutletClosed (BR-LOG-020). | REQ-MPC-FR-188 |
| AC-LOG-003-02-02 | US-LOG-003-02 | **Given** an outlet is flagged full, **when** a shopper chooses pickup, **then** that outlet is not offered and message Log.OutletFull is shown on the outlet list. | REQ-MPC-FR-188 |
| AC-LOG-003-02-03 | US-LOG-003-02 | **Given** an outlet's status changes (closure added or ended, capacity flag set or cleared), **when** it is saved, **then** the change is audited (AUD-LOG-011); orders already placed for that outlet are listed for operations follow-up. | Proposed |
| AC-LOG-003-03-02 | US-LOG-003-03 | **Given** an outlet synchronised by INT-010 is removed in the Malawi Post source system, **when** the outlet sync runs, **then** the StorePickupPoint row is not deleted (it has no active flag); a closure with reason "Removed at source" and no end date is added through the outlet extension, so the outlet is no longer offered (BR-LOG-020) and orders already placed keep their outlet. | see INT-010 (REQ-MPC-FR-349); FIT (StorePickupPoint has no active flag) |
| AC-LOG-003-03-03 | US-LOG-003-03 | **Given** an administrator links an outlet to the warehouse that supplies it (PickupPointWarehouse), **when** the link is saved, **then** it is stored once in the LOG table and used for outlet availability (IC-LOG-06), SRC-004 nearby pickup and SRC-018 pickup windows; the change is audited (AUD-LOG-011). | Proposed (owner of the SRC-004 link) |
| AC-LOG-003-03-04 | US-LOG-003-03 | **Given** an administrator sets the outlet flag "accepts returns" on an outlet, **when** it is saved, **then** the outlet is returned by IC-LOG-06 GetOutlets with the returns filter, which RET-003 uses to list drop-off outlets for returns; the change is audited (AUD-LOG-011). | Proposed; see RET-003 (REQ-MPC-FR-189) |
| AC-LOG-003-01-02 | US-LOG-003-01 | **Given** an order is placed with pickup, **when** the order is inserted, **then** the chosen outlet id is stored against the order (OrderOutlet) from the SelectedPickupPoint generic attribute, because the order stores only a copy of the outlet address (Order.PickupAddressId). | FIT (OrderProcessingService.PrepareAndValidateShippingInfoAsync, OrderProcessingService.cs:426-432; IShoppingCartService.ResetCheckoutDataAsync before OrderPlacedEvent, OrderProcessingService.cs:1636-1637; moved from ICustomerService in 5.00) |

**Business rules applied:** BR-LOG-020 (§8.1).


### 7.4 PRD-LOG-004 Serviceability rules

| Item | Value |
|---|---|
| Description (baseline) | Rules for where delivery is available, by location or outlet, and which areas each seller covers. |
| Why it matters | Customers are not offered delivery that cannot happen. |
| Who benefits | Shoppers; logistics staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: RURAL-SRC |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-004-01 | As a client administrator, I want to define the areas where delivery is available for each service level and which outlets serve them, so that buyers are only offered delivery that can happen. | D; REQ-MPC-FR-197 | Ready; conditions: RURAL-SRC |
| US-LOG-004-02 | As a seller, I want to set the districts I can deliver to, so that I do not receive orders I cannot fulfil. | D; REQ-MPC-FR-069 | Ready; conditions: RURAL-SRC |
| US-LOG-004-03 | As a shopper, I want to see only the delivery and pickup options available for my location, so that I do not choose an option that will fail. | REQ-MPC-FR-197 | Ready; conditions: RURAL-SRC |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-004-01-01 | US-LOG-004-01 | **Given** coverage areas are defined by country, region (StateProvince), district (County) and postal-code pattern, each with service levels allowed, outlets serving it and a location type (rural / urban), **when** an area is saved, **then** it is stored with its attributes and audited (AUD-LOG-002). | D; REQ-MPC-FR-197; Proposed (area keys) |
| AC-LOG-004-03-01 | US-LOG-004-03 | **Given** the shopper's address is not in any coverage area for service level S, **when** the delivery step is shown, **then** service level S is not listed (BR-LOG-020). | REQ-MPC-FR-197 |
| AC-LOG-004-03-02 | US-LOG-004-03 | **Given** the shopper's address is in an area served by outlets X and Y only, **when** the shopper chooses pickup, **then** only outlets X and Y are listed. | REQ-MPC-FR-197 |
| AC-LOG-004-03-03 | US-LOG-004-03 | **Given** no delivery and no pickup option is available, **when** the delivery step is shown, **then** checkout stops with message Log.NoDeliveryAvailable and no order can be placed. | REQ-MPC-FR-197 |
| AC-LOG-004-03-04 | US-LOG-004-03 | **Given** a ship-enabled product has a list of allowed service levels and outlets (ProductDeliveryOption, for example an e-Government service with a physical output, EGV-004), **when** the shopper reaches the delivery step with that product, **then** only the allowed service levels and outlets are offered for its (sub-)order; with no list, every option allowed by the coverage area applies (BR-LOG-020). | Proposed; see EGV-004 |
| AC-LOG-004-03-05 | US-LOG-004-03 | **Given** another module asks whether an item can be delivered to an area or address for a service level (CHK-005 and CHK-011 at checkout, SVC-006 at booking, SRC-004 for the delivery filter) through IC-LOG-06 IsServiceable, **when** the call is made, **then** the answer is computed by BR-LOG-020 exactly as at the delivery step, with the reason when not serviceable (area not covered, seller area, product restriction). | REQ-MPC-FR-197; Proposed (contract) |
| AC-LOG-004-02-01 | US-LOG-004-02 | **Given** the Marketplace pack is on and a seller has saved coverage districts, **when** a buyer outside them has that seller's items in the cart, **then** delivery is not offered for that seller's (sub-)order and message Log.SellerAreaNotCovered names the items concerned. | REQ-MPC-FR-069; see CHK-004 (multi-seller split) |
| AC-LOG-004-02-02 | US-LOG-004-02 | **Given** a seller's coverage is enforced at the delivery step, **when** the order is submitted, **then** checkout validation re-checks coverage before placement so an address changed in between is refused (CHK-003). | REQ-MPC-FR-069; Proposed |

**Business rules applied:** BR-LOG-020; BR-LOG-021 (§8.1).


### 7.5 PRD-LOG-005 Estimated delivery time engine

| Item | Value |
|---|---|
| Description (baseline) | Calculates the expected delivery time from service standards, cut-off times and transport links. |
| Why it matters | Realistic delivery promises. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-005-01 | As a shopper, I want to see a realistic expected delivery or collection date, so that I can plan for it. | D; REQ-MPC-FR-182 | Ready |
| US-LOG-005-02 | As a client administrator, I want to set service standards, daily cut-off times and transport links per route, so that the promise matches how we operate. | D; REQ-MPC-FR-182 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-005-02-01 | US-LOG-005-02 | **Given** a delivery standard defines, per origin, destination area and service level, transit days (minimum and maximum) and the days on which the transport link departs; the cut-off time, handling time and working-day calendar of the service level are those of ORD-011 ServiceLevel, **when** the standard is saved, **then** it is stored and audited (AUD-LOG-002); LOG stores no cut-off, handling time or calendar of its own (one source, ORD-011). | REQ-MPC-FR-182; see ORD-011 (REQ-MPC-FR-165) |
| AC-LOG-005-01-01 | US-LOG-005-01 | **Given** an order is quoted before the ORD-011 cut-off time of its service level on a working day of the ORD-011 calendar, **when** the EDT is calculated, **then** the dispatch day is today; otherwise the next working day (BR-LOG-030). | REQ-MPC-FR-182; see ORD-011 (REQ-MPC-FR-165) |
| AC-LOG-005-01-02 | US-LOG-005-01 | **Given** the transport link departs only on certain days, **when** the EDT is calculated, **then** the dispatch day moves to the next departure day before transit days are added (connectivity constraint, BR-LOG-030). | REQ-MPC-FR-182 |
| AC-LOG-005-01-03 | US-LOG-005-01 | **Given** the EDT is calculated, **when** it is presented, **then** the earliest and latest dates are shown with message Log.EdtRange at the delivery step (CHK-014), on the order and on the tracking page (TRK-001); non-working days are skipped. | REQ-MPC-FR-182; see CHK-014 |
| AC-LOG-005-01-04 | US-LOG-005-01 | **Given** no standard exists for the route, **when** the EDT is requested, **then** the native transit days of the rate or pickup point are used if set; otherwise message Log.EdtUnavailable is shown. | FIT (TransitDays, DeliveryDate); Proposed |
| AC-LOG-005-01-05 | US-LOG-005-01 | **Given** an order is placed, **when** the order is inserted, **then** the promised range is stored with the order and used by LOG-018 for on-time measurement. | Proposed |
| AC-LOG-005-01-06 | US-LOG-005-01 | **Given** CHK-014 requests an estimate through IC-CHK-03 for a shipping option, or for a pickup point, with the address and cart, **when** LOG-005 answers (IC-LOG-06 GetDeliveryEstimate), **then** it returns the earliest and latest date by BR-LOG-030 (for a pickup point: the date from which the order can be collected), or none when neither a standard nor native transit days exist. | REQ-MPC-FR-182; see CHK-014 (REQ-MPC-FR-119) |
| AC-LOG-005-01-07 | US-LOG-005-01 | **Given** delivery standards exist and the precompute task runs (interval: setting, default not stated), **when** it finishes, **then** a delivery window per product and district (and a store default window when no district is chosen) is stored in DeliveryWindowCache; SRC-018 listing cards and the SRC-004 delivery filter read it through IC-LOG-06 GetDeliveryWindow without any shipping-rate call per card. | Proposed; see SRC-018 (REQ-MPC-FR-088) |

**Business rules applied:** BR-LOG-030 (§8.1).


### 7.6 PRD-LOG-006 DHL adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects to DHL for delivery prices, booking, labels and tracking. |
| Why it matters | DHL is one of the couriers KTDA names. |
| Who benefits | Logistics staff; shoppers |
| Phase | P1 |
| Implementation | Licensed plugin — None |
| Depends on | PRD-LOG-021 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-006-01 | As a member of logistics operations staff, I want to get DHL prices, book DHL shipments, print DHL labels and receive DHL tracking, so that KTDA can ship with DHL from the platform. | D; REQ-KTDA-LOG-003; REQ-KTDA-INT-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-006-01-01 | US-LOG-006-01 | **Given** a DHL plugin built for nopCommerce 5.00 is licensed and installed (5.00 build not verifiable from source, VER-500), or the custom fallback adapter on LOG-021 is built, **when** the plugin is configured with KTDA's DHL account, **then** it appears as a carrier in LOG-021 and, if enabled for checkout, as a rate method (IShippingRateComputationMethod.GetShippingOptionsAsync). | D; FIT; VER-500 |
| AC-LOG-006-01-02 | US-LOG-006-01 | **Given** a shipment is assigned to DHL, **when** staff book it, **then** a DHL booking is created, the DHL waybill number is set as the shipment tracking number (ShipmentTrackingNumberSetEvent) and the DHL label is stored for printing (LOG-007). | D; REQ-KTDA-INT-003 |
| AC-LOG-006-01-03 | US-LOG-006-01 | **Given** DHL reports a tracking event through its API (push or polling), **when** the adapter receives it, **then** it is passed to the TRK-002 hub with the DHL status code, which maps it to the common event list; the timeline shows it. | D; REQ-KTDA-LOG-003 |
| AC-LOG-006-01-04 | US-LOG-006-01 | **Given** the licensed plugin does not implement booking, label or event push, **when** the gap is found in the VER-500 plugin test, **then** the missing operations are reported as NotSupported in its capability record (IC-LOG-01) and are provided by the fallback adapter or done manually. | Proposed; VER-500 |

**Business rules applied:** BR-LOG-040; BR-LOG-041 (§8.1).


### 7.7 PRD-LOG-007 Shipping labels and barcodes

| Item | Value |
|---|---|
| Description (baseline) | Prints shipping labels with barcodes that postal and courier scanners can read. Labels can be printed on network label printers (for example Zebra) as well as PDF. |
| Why it matters | Parcels can be scanned and tracked at every step. |
| Who benefits | Warehouse staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-007-01 | As a member of warehouse staff, I want to print a shipping label with a barcode for each parcel, so that postal and courier scanners can read every parcel. | D; REQ-MPC-FR-183; FC-M15-007 | Ready; conditions: OVR-REG |
| US-LOG-007-02 | As a member of warehouse staff, I want to print labels on a network label printer as well as to PDF, so that we can use our label printers. | D | Ready; conditions: OVR-REG |
| US-LOG-007-03 | As a seller, I want to print packing slips and shipping labels for my own orders from configured templates, so that I can prepare my parcels. | REQ-MPC-FR-157 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-007-01-01 | US-LOG-007-01 | **Given** a shipment exists, **when** a label is generated, **then** it shows sender, recipient, weight, service level, the shipment identifier and the tracking number as a barcode in the configured symbology; for a carrier booking it is the carrier's label (IC-LOG-01 GetLabel). | REQ-MPC-FR-183; FC-M15-007 |
| AC-LOG-007-01-02 | US-LOG-007-01 | **Given** the shipment is international postal and has no tracking number, **when** the label is generated, **then** an S10 identifier is assigned first (LOG-020) and printed as the barcode. | REQ-MPC-FR-183; see LOG-020 |
| AC-LOG-007-01-03 | US-LOG-007-01 | **Given** a digital postcode or address alias is stored for the address (LOG-015), **when** the label is generated, **then** it is printed on the label. | see LOG-015 (REQ-MPC-FR-200) |
| AC-LOG-007-01-04 | US-LOG-007-01 | **Given** a label is printed, **when** its barcode is scanned with the client's postal scanner in acceptance testing, **then** the scanner returns the identifier printed on the label (test T-LOG-04). | REQ-MPC-FR-183 |
| AC-LOG-007-02-01 | US-LOG-007-02 | **Given** a network printer address is configured for the warehouse or outlet, **when** staff choose network print, **then** the label is sent in the printer language of the configured printer (ZPL for Zebra-type printers); otherwise a PDF or PNG is produced. | D; FC-M15-007 (PDF or PNG) |
| AC-LOG-007-03-01 | US-LOG-007-03 | **Given** label and packing-slip templates are configured, **when** a seller prints for selected own orders, **then** packing slips (native PrintPackagingSlipsToPdfAsync) and labels are produced only for shipments of that seller (native vendor filter). | REQ-MPC-FR-157; FIT (IPdfService, OrderController.PdfPackagingSlipSelected) |
| AC-LOG-007-01-05 | US-LOG-007-01 | **Given** RET-003 needs a return label for a ReturnShipment (not a native Shipment), **when** it requests the label with the return reference, sender (shopper or outlet) and destination, **then** the label is produced by the same templates and barcode rules with the return tracking reference as the barcode (the carrier label when IC-LOG-01 BookReturn returned one) and stored as a Download referenced by the ReturnShipment; the reference is the one RET-003 registered with TRK-002 (IC-TRK-01 RegisterExternalReference), so scans of the label are applied to the return. | Proposed; see RET-003 (REQ-MPC-FR-246) |

**Business rules applied:** BR-LOG-050 (§8.1).


### 7.8 PRD-LOG-008 Fulfilment allocation and routing

| Item | Value |
|---|---|
| Description (baseline) | Decides who fulfils each order (the seller, the client or a logistics company) and from which warehouse, choosing the nearest. |
| Why it matters | Faster, cheaper delivery. |
| Who benefits | Logistics staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-008-01 | As a member of logistics operations staff, I want each order line to be allocated to the seller, the client or a logistics company according to the fulfilment model, so that the right party fulfils it. | D; REQ-MPC-FR-161 | Ready |
| US-LOG-008-02 | As a member of logistics operations staff, I want client-fulfilled lines to be routed to the nearest warehouse that has the stock, so that delivery is faster and cheaper. | D; FC-M15-001 | Ready |
| US-LOG-008-03 | As a member of logistics operations staff, I want to override an allocation with a reason, so that I can handle special cases. | Proposed; REQ-KTDA-WF-007 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-008-01-01 | US-LOG-008-01 | **Given** the fulfilment model of a line is merchant-fulfilled, client-fulfilled or third-party (BR-LOG-060), **when** the order is paid or, for COD and on-account orders, placed, **then** a fulfilment task is created for the party of that model and appears in its queue (seller dashboard ORD-005, warehouse queue LOG-009, or the partner booking LOG-021). | REQ-MPC-FR-161; REQ-KTDA-WF-007 |
| AC-LOG-008-01-02 | US-LOG-008-01 | **Given** a seller opted in to client fulfilment (SEL-018), **when** that seller's line is allocated, **then** the model is client-fulfilled unless the product overrides it (BR-LOG-060). | REQ-MPC-FR-161; see SEL-018 |
| AC-LOG-008-02-01 | US-LOG-008-02 | **Given** two warehouses hold enough stock for the line (ProductWarehouseInventory) and both have coordinates (read through IC-INV-05 GetWarehouseLocation), **when** the line is allocated, **then** the warehouse nearest to the destination is chosen (BR-LOG-061). | FC-M15-001; FIT (UseMultipleWarehouses) |
| AC-LOG-008-02-02 | US-LOG-008-02 | **Given** no single warehouse holds enough stock, **when** the line is allocated, **then** the line is split across warehouses in order of distance, or flagged for manual allocation when the client disallows splits (setting, default not stated). | Proposed |
| AC-LOG-008-03-01 | US-LOG-008-03 | **Given** a user with Logistics.Core.Fulfilment.CreateEditDelete changes an allocation, **when** they save it with a reason, **then** the task moves to the new party or warehouse and the change is audited (AUD-LOG-004). | Proposed |
| AC-LOG-008-01-03 | US-LOG-008-01 | **Given** a KTDA fulfilment workflow (ADM-002) is started from a queued order event and reaches an allocation, pick, pack or dispatch step, **when** the step runs, **then** it calls the LOG fulfilment service (IC-LOG-07) with the task and acting user; LOG applies its rules and state model (SM-LOG-01) and returns the result; the workflow never changes order, shipment or task state itself (BR-LOG-190). | REQ-KTDA-WF-007; see ADM-002 (REQ-KTDA-WF-007) |

**Business rules applied:** BR-LOG-060; BR-LOG-061 (§8.1).


### 7.9 PRD-LOG-009 Warehouse pick, pack, dispatch

| Item | Value |
|---|---|
| Description (baseline) | Picking lists, packing confirmation, dispatch confirmation and manifests for the warehouse. Each product has a shelf location (zone, aisle, rack, shelf, bin), shown on pick lists and order lines. |
| Why it matters | Organised, accurate dispatch. |
| Who benefits | Warehouse staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-009-01 | As a member of warehouse staff, I want pick lists that show each product's shelf location in walking order, so that picking is quick and accurate. | D; FC-M15-002 | Ready; conditions: OVR-REG |
| US-LOG-009-02 | As a member of warehouse staff, I want to confirm each packed item against the order before sealing, so that wrong items are not sent. | D; FC-M15-003 | Ready; conditions: OVR-REG |
| US-LOG-009-03 | As a member of warehouse staff, I want to stage packed parcels and confirm dispatch with the carrier and waybill number, so that we know what left and with whom. | D; FC-M15-004; REQ-MPC-FR-181 | Ready; conditions: OVR-REG |
| US-LOG-009-04 | As a member of logistics operations staff, I want a daily dispatch manifest per linehaul or transport operator, so that hand-over is documented. | D; REQ-MPC-FR-199 | Ready; conditions: OVR-REG |
| US-LOG-009-05 | As a seller, I want to batch several orders and print one pick list and packing list for them, so that I can process many orders at once. | REQ-MPC-FR-168 | Ready; conditions: OVR-REG |
| US-LOG-009-06 | As a member of warehouse staff, I want to run the shipping steps in the configured order, so that the shipping workflow is the same every time. | REQ-KTDA-WF-005 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-009-01-01 | US-LOG-009-01 | **Given** each product has a shelf location per warehouse (zone, aisle, rack, shelf, bin), **when** a pick list is generated for selected orders, **then** each line shows product, quantity and shelf location, sorted by zone, aisle, rack, shelf and bin. | D; FC-M15-002 |
| AC-LOG-009-01-02 | US-LOG-009-01 | **Given** a product has no shelf location in the picking warehouse, **when** the pick list is generated, **then** the line is listed last with the location shown as missing. | Proposed |
| AC-LOG-009-02-01 | US-LOG-009-02 | **Given** items are picked, **when** the packer scans or ticks each item, **then** the package can be confirmed only when every order item and quantity matches; otherwise message Log.PackMismatch is shown and the task stays Picked (BR-LOG-070). | FC-M15-003 |
| AC-LOG-009-03-01 | US-LOG-009-03 | **Given** MPC fulfilment is enabled and a package is Packed, **when** staff move it to a staging location, **then** the task becomes Staged with the location recorded (SM-LOG-01). | REQ-MPC-FR-181 |
| AC-LOG-009-03-02 | US-LOG-009-03 | **Given** a package is Staged and a carrier or route is assigned, **when** staff confirm dispatch with the waybill or tracking number, **then** a native shipment exists with the tracking number, IOrderProcessingService.ShipAsync is called once (ShipmentSentEvent, ShippedDateUtc, order ShippingStatus) and the task becomes Dispatched. | FC-M15-004; REQ-MPC-FR-181; FIT (ShipAsync) |
| AC-LOG-009-03-03 | US-LOG-009-03 | **Given** a package holds a lot-tracked or serial-tracked product (INV-009, INV-010), **when** LOG creates the native shipment for it, **then** LOG first calls IC-INV-07 Capture for the packed quantities (BR-INV-070, BR-INV-080), then inserts the shipment through IShipmentService.InsertShipmentAsync and its items, then calls IC-INV-07 Confirm with the saved shipment items (BR-LOG-003); if Capture is refused nothing is saved, the INV message key is shown and the task stays Packed or Staged. | see INV-009; see INV-010; Proposed |
| AC-LOG-009-03-04 | US-LOG-009-03 | **Given** a shipment guard provider registered with the ORD-010 host (IC-ORD-11: PAY letter of credit not Verified, ORD-010 order hold, EGV application not Issued) refuses the insert, **when** LOG creates the shipment, **then** no shipment is saved, any open IC-INV-07 capture is cancelled (Cancel with the refusal reason), the message key returned by the provider is shown and the task stays in its state (BR-LOG-003). | FIT (IShipmentService.InsertShipmentAsync is the single host, OVR-REG); see PAY-006 (REQ-KTDA-PAY-009) |
| AC-LOG-009-03-05 | US-LOG-009-03 | **Given** the order is a pickup order, **when** staff confirm the parcel reached the outlet, **then** ReadyForPickupAsync is called instead, because native ShipAsync refuses pickup orders. | FIT (OrderProcessingService.ShipAsync throws for PickupInStore) |
| AC-LOG-009-04-01 | US-LOG-009-04 | **Given** parcels were dispatched today to transport operator T, **when** the manifest is generated, **then** it lists each parcel (tracking number, order, destination, weight) for T with totals, and is printable and exportable. | REQ-MPC-FR-199 |
| AC-LOG-009-05-01 | US-LOG-009-05 | **Given** the seller selects several of their orders, **when** they print, **then** one combined pick list and one packing list are produced for those orders, containing only the seller's items. | REQ-MPC-FR-168; see ORD-005 |
| AC-LOG-009-06-01 | US-LOG-009-06 | **Given** the client has the pick, pack, stage and dispatch steps enabled, **when** a task skips a step, **then** the skipped transition is refused (SM-LOG-01). | REQ-KTDA-WF-005; Proposed |
| AC-LOG-009-06-02 | US-LOG-009-06 | **Given** a KTDA shipping workflow (ADM-002) is bound to the native shipment events and its step asks LOG to stage or dispatch a package, **when** the step runs, **then** the LOG fulfilment service (IC-LOG-07) performs the transition with the same checks as the staff screen; the workflow only starts from queued requests and never sets shipment dates or status (BR-LOG-190). | REQ-KTDA-WF-005; see ADM-002 (REQ-KTDA-WF-005) |

**Business rules applied:** BR-LOG-001; BR-LOG-070 (§8.1).


### 7.10 PRD-LOG-010 Shipments

| Item | Value |
|---|---|
| Description (baseline) | One order can ship in several parcels, each with a tracking number and status (shipped, ready for pickup, delivered) and a packing slip. |
| Why it matters | Customers can follow each part of their order. |
| Who benefits | Shoppers; logistics staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-010-01 | As a member of logistics operations staff, I want to ship one order in several parcels, each with its tracking number and status, so that large or split orders can be followed part by part. | D; REQ-KTDA-WF-005 | Ready |
| US-LOG-010-02 | As a shopper, I want to see each parcel of my order with its status, so that I know what has arrived. | D | Ready |
| US-LOG-010-03 | As a member of warehouse staff, I want a packing slip per parcel, so that the contents are documented. | D; REQ-MPC-FR-157 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-010-01-01 | US-LOG-010-01 | **Given** an order has items not yet in a shipment, **when** staff create a shipment for some items, **then** a native Shipment with ShipmentItems is created; the order ShippingStatus becomes PartiallyShipped when that shipment is shipped and other items remain. | D; FIT (Shipment, ShipmentItem, ShippingStatus.PartiallyShipped) |
| AC-LOG-010-01-02 | US-LOG-010-01 | **Given** a shipment is created through the admin AddShipment page or the LOG fulfilment flow, **when** it is shipped, made ready for pickup or delivered, **then** the change is made only through IOrderProcessingService.ShipAsync / ReadyForPickupAsync / DeliverAsync (BR-LOG-001), which set the dates, send the native template through the TRK-005 engine and raise the native event. | REQ-KTDA-WF-005; FIT |
| AC-LOG-010-01-03 | US-LOG-010-01 | **Given** a user edits a shipped, ready-for-pickup or delivered date on the admin shipment page, **when** the POST is sent, **then** the LOG action filter requires a reason (message Log.DateEditReasonRequired), records a correction event in TRK-002 and audits it (AUD-LOG-001), because the native edit actions update the date without any event. | FIT (OrderController.EditShippedDate / EditDeliveryDate / EditReadyForPickupDate) |
| AC-LOG-010-02-01 | US-LOG-010-02 | **Given** an order has two shipments, **when** the shopper opens the order, **then** both are listed with tracking number and status (shipped, ready for pickup, delivered) and a link to the shipment details. | D; FIT (ShipmentDetails) |
| AC-LOG-010-03-01 | US-LOG-010-03 | **Given** a shipment exists, **when** staff print its packing slip, **then** the native packaging slip PDF is produced for that shipment. | REQ-MPC-FR-157; FIT (PrintPackagingSlipToPdfAsync) |

**Business rules applied:** BR-LOG-001; BR-LOG-160 (§8.1).


### 7.11 PRD-LOG-011 Logistics task creation and seller pickup

| Item | Value |
|---|---|
| Description (baseline) | Creates delivery work tasks (collect, sort, dispatch, deliver) and lets Malawi Post schedule collections from sellers and record that they happened. |
| Why it matters | Connects online orders to postal operations. |
| Who benefits | Malawi Post operations |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: FG-06 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-011-01 | As a member of Malawi Post operations staff, I want delivery work tasks (collect, sort, dispatch, deliver) to be created from online orders, so that online orders flow into postal operations. | D; REQ-MPC-FR-176 | On hold: FG-06 |
| US-LOG-011-02 | As a member of Malawi Post operations staff, I want to schedule collections from sellers and record that each happened, so that parcels are collected on time. | D; REQ-MPC-FR-177 | On hold: FG-06 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-011-01-01 | US-LOG-011-01 | **Given** an order line is allocated to client fulfilment through the postal network (LOG-008), **when** the order is released for fulfilment, **then** tasks of types collect (if the parcel is at the seller), sort, dispatch and deliver or collection-at-outlet are created for the shipment leg with status Created (SM-LOG-04). | REQ-MPC-FR-176 |
| AC-LOG-011-01-02 | US-LOG-011-01 | **Given** a task is completed, **when** the corresponding scan or confirmation is recorded (TRK-002 event), **then** the task becomes Completed and the next task becomes due. | REQ-MPC-FR-176; Proposed |
| AC-LOG-011-02-01 | US-LOG-011-02 | **Given** a seller has parcels ready (ORD-005 hand-over) at a registered SellerLocation with preference pickup (SEL-018), **when** operations staff schedule a pickup with a date and time window, **then** a seller pickup request is Scheduled with that SellerLocation address as the collection address and the seller is notified through TRK-005 (event code Log.SellerPickupScheduled, IC-TRK-04 SendEvent). | REQ-MPC-FR-177; see SEL-018 (REQ-MPC-FR-032) |
| AC-LOG-011-02-02 | US-LOG-011-02 | **Given** a pickup is Scheduled, **when** the collector records the parcels collected (scan or list), **then** the request becomes Collected, each parcel gets a pickup event in TRK-002 and the confirmation is audited (AUD-LOG-012). | REQ-MPC-FR-177 |
| AC-LOG-011-02-03 | US-LOG-011-02 | **Given** the collector finds no parcel or the seller is closed, **when** the visit is recorded, **then** the request becomes Missed with a reason and can be rescheduled. | Proposed |
| AC-LOG-011-01-03 | US-LOG-011-01 | **Given** a return parcel (RET-003 ReturnShipment) is handed in at an outlet that is not its destination and the Postal and logistics pack is active, **when** RET requests an onward task, **then** a logistics task of type onward (outlet to seller, warehouse or outlet) is created with the ReturnShipment reference instead of a shipment id, and completes on the matching TRK-002 event for the return reference. | Proposed; see RET-003 (REQ-MPC-FR-189) |
| AC-LOG-011-01-04 | US-LOG-011-01 | **Given** an operator opens the ADM-007 operational order view, **when** LOG supplies the stage of each open shipment (IC-LOG-07 GetOperationalStage), **then** each shipment is placed in awaiting pickup, awaiting sorting, awaiting dispatch or out for last-mile delivery by BR-LOG-170, or in none of them. | Proposed; see ADM-007 (REQ-MPC-FR-162) |

**Business rules applied:** BR-LOG-130 (§8.1).


### 7.12 PRD-LOG-012 Proof of delivery record

| Item | Value |
|---|---|
| Description (baseline) | Stores proof that an order was delivered or collected, for example confirmation from the courier, or an OTP or QR code checked at the pickup counter. |
| Why it matters | Settles 'I never received it' disputes. |
| Who benefits | Support staff; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-012-01 | As a member of support staff, I want proof that an order was delivered or collected, stored with the order, so that I can settle "I never received it" disputes. | D; REQ-MPC-FR-164; FC-M15-010 | Ready; conditions: SINGLE-FILTER |
| US-LOG-012-02 | As a client administrator, I want to choose which proof methods (signature, OTP, QR scan) are required for each service level, so that proof matches the risk of each service. | D; REQ-MPC-FR-195 | Ready; conditions: SINGLE-FILTER |
| US-LOG-012-03 | As a member of outlet staff, I want to check the buyer's pickup code or QR at the counter before handing over the parcel, so that parcels go to the right person. | D; REQ-MPC-FR-164 | Ready; conditions: SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-012-01-01 | US-LOG-012-01 | **Given** a delivery or collection is confirmed by a carrier event, a courier app (LOG-032), or outlet staff, **when** the confirmation is received, **then** a proof-of-delivery record is stored with method, time, location if provided, recipient name, collector or courier identity and any media; it is linked to the shipment and order and an order note with the media DownloadId is added (native OrderNote, DisplayToCustomer false). | REQ-MPC-FR-164; FC-M15-010; FIT (OrderNote.DownloadId) |
| AC-LOG-012-01-02 | US-LOG-012-01 | **Given** a proof-of-delivery record is stored, **when** the save completes, **then** the module event ProofOfDeliveryRecorded (OrderId, ShipmentId, RecordId; IC-LOG-05) is published; consumers (RET-007 evidence link) only enqueue work. | Proposed; see RET-007 (REQ-MPC-FR-239) |
| AC-LOG-012-02-01 | US-LOG-012-02 | **Given** service level S requires OTP, **when** a delivery of level S is confirmed without a matching OTP record, **then** DeliverAsync is not called and the shipment stays undelivered; staff see message Log.PodRequired (BR-LOG-080). | REQ-MPC-FR-195 |
| AC-LOG-012-02-02 | US-LOG-012-02 | **Given** service level S requires a proof method, **when** a user presses the native admin Set as delivered (single or selected), **then** the LOG action filter refuses it with message Log.PodRequired unless a POD record of a required method exists (BR-LOG-160). | REQ-MPC-FR-195; FIT (OrderController.SetAsDelivered, SetAsDeliveredSelected) |
| AC-LOG-012-02-03 | US-LOG-012-02 | **Given** a proof-method configuration is changed, **when** it is saved, **then** it is audited (AUD-LOG-002) and applies to shipments created after the change. | Proposed |
| AC-LOG-012-03-01 | US-LOG-012-03 | **Given** a buyer presents the pickup code or QR issued by CHK-012 and IC-CHK-09 Verify answers Valid for this shipment and outlet, **when** outlet staff confirm the hand-over, **then** under ILocker key 'shipment-{ShipmentId}' (BR-LOG-001; IC-CHK-09 runs inside this lock) the step re-reads the parcel, requires any holding charge (LOG-017) to be recorded as paid or waived, stores the POD record with method Code or QR, calls DeliverAsync once and then calls IC-CHK-09 MarkUsed; if DeliverAsync is refused (for example an ORD-010 hold through the CHK-003 override), MarkUsed is not called and the code stays Sent. | REQ-MPC-FR-164; see CHK-012 (REQ-MPC-FR-124) |
| AC-LOG-012-03-02 | US-LOG-012-03 | **Given** IC-CHK-09 Verify answers Invalid, Used or Locked, **when** outlet staff try to hand over, **then** nothing is handed over, no POD record is stored and the CHK message key returned (Chk.PickupCodeInvalid, Chk.PickupCodeUsed, Chk.PickupCodeLocked) is shown; code attempts and locking are CHK-012 rules (BR-CHK-016), not LOG rules. | see CHK-012 (REQ-MPC-FR-124) |
| AC-LOG-012-02-04 | US-LOG-012-02 | **Given** service level S requires a home-delivery OTP and the courier enters a wrong OTP, **when** the configured number of wrong attempts is reached (setting, default not stated), **then** the shipment is locked for OTP entry, message Log.CodeInvalid is shown, the failed attempts are audited (AUD-LOG-005) and operations staff are alerted (BR-LOG-081). | REQ-MPC-FR-195; Proposed (lock) |
| AC-LOG-012-01-03 | US-LOG-012-01 | **Given** a user without Logistics.Core.ProofOfDelivery.View opens the order, **when** the order page loads, **then** the POD summary (method, time) is visible but signature, photo and coordinates are hidden. | Proposed; NFR-X-002 |
| AC-LOG-012-01-04 | US-LOG-012-01 | **Given** media (photo, signature image, video) arrive with a proof-of-delivery confirmation from the outlet or courier page, a carrier, or IC-LOG-04, **when** they are stored, **then** each file is first checked through IC-ADM-08 CheckUpload for the LOG upload context "proof-of-delivery media" (BR-LOG-082); a refused file is not stored and the ADM message key is shown or returned; on admin DownloadFile the SEC-002 filter asks the LOG download-access provider (IC-SEC-05), which claims the file and allows it only to holders of Logistics.Core.ProofOfDelivery.View. | SINGLE-FILTER; NFR-X-002; FIT (Admin DownloadController.DownloadFile checks only admin access; admin order notes link DownloadGuid) |

**Business rules applied:** BR-LOG-080; BR-LOG-081; BR-LOG-082 (§8.1).


### 7.13 PRD-LOG-013 Delivery exceptions

| Item | Value |
|---|---|
| Description (baseline) | Handles failed deliveries: redelivery, address corrections, return to sender, incident reports and escalation. |
| Why it matters | Problem deliveries are resolved, not forgotten. |
| Who benefits | Logistics staff; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-013-01 | As a member of logistics operations staff, I want each failed delivery to be recorded with a reason code and a next action (redelivery, address correction, return to sender), so that problem deliveries are resolved, not forgotten. | D; REQ-MPC-FR-193; FC-M15-011 | Ready; conditions: SINGLE-FILTER |
| US-LOG-013-02 | As a shopper, I want to reschedule a failed delivery or correct my address, so that I still receive my parcel. | D; REQ-MPC-FR-193; REQ-MPC-FR-207 | Ready; conditions: SINGLE-FILTER |
| US-LOG-013-03 | As a member of logistics operations staff, I want to report incidents such as a lost, damaged or delayed parcel and have them escalated, so that serious problems reach the right people in time. | D; REQ-MPC-FR-186; FC-M15-012 | Ready; conditions: SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-013-01-01 | US-LOG-013-01 | **Given** a delivery attempt fails (courier, carrier or route list LOG-024), **when** the attempt is recorded with a reason code from the configured list (initial codes from source: unreachable, not at home, address issue), **then** a delivery exception is opened with status Open (SM-LOG-03), a TRK-002 attempt-failed event is recorded and TRK-012 notifies the buyer with the reason. | REQ-MPC-FR-193; REQ-MPC-FR-207; FC-M15-011 |
| AC-LOG-013-01-02 | US-LOG-013-01 | **Given** the number of failed attempts reaches the configured maximum (setting, default not stated), **when** another attempt fails, **then** no further redelivery is offered and the exception action becomes return to sender (BR-LOG-090). | FC-M15-011 |
| AC-LOG-013-02-01 | US-LOG-013-02 | **Given** an exception is Open, **when** the buyer opens the rescheduling link from the notification or the order page, **then** they can choose a new delivery date from the offered dates or change the address (subject to LOG-004 serviceability); the choice creates a redelivery task and the exception becomes InProgress. | REQ-MPC-FR-207; REQ-MPC-FR-193 |
| AC-LOG-013-02-02 | US-LOG-013-02 | **Given** the address is corrected, **when** it is saved, **then** the order address copy is updated through IAddressService, the fee is re-checked (BR-LOG-110) and the change is audited (AUD-LOG-008). | REQ-MPC-FR-193; FIT (order address is a cloned Address row) |
| AC-LOG-013-01-03 | US-LOG-013-01 | **Given** return to sender is chosen, **when** staff confirm it, **then** a return leg is created to the origin, the exception becomes Resolved with outcome ReturnedToSender and the module event DeliveryOutcomeRecorded (OrderId, ShipmentId, Outcome; IC-LOG-05) is published; RET-007 opens an OrderIssue case; LOG raises no refund itself (refunds are owned by RET-005 and executed by PAY-016). | REQ-MPC-FR-193; see RET-007 (REQ-MPC-FR-240) |
| AC-LOG-013-03-01 | US-LOG-013-03 | **Given** staff record an incident of type lost, damaged or delayed, **when** it is saved, **then** an exception of that type is Open with evidence attachments, each checked through IC-ADM-08 CheckUpload for the LOG upload context "delivery exception evidence" before it is stored (BR-LOG-082), and is visible in the operations queue. | REQ-MPC-FR-186; SINGLE-FILTER |
| AC-LOG-013-03-02 | US-LOG-013-03 | **Given** an exception stays Open beyond the escalation threshold for its type (setting, default not stated), or TRK-002 flags a long-stuck shipment, **when** the escalation task runs, **then** the exception becomes Escalated, the escalation contact for that type is notified (event code Log.ExceptionEscalated, IC-TRK-04 SendEvent) and, where configured, the buyer is informed (AUD-LOG-006). | REQ-MPC-FR-186; FC-M15-012 |
| AC-LOG-013-03-03 | US-LOG-013-03 | **Given** an Escalated exception is resolved, **when** staff record the outcome (redelivered, returned, lost, damaged), **then** the exception becomes Resolved and the outcome is audited (AUD-LOG-006); for Lost, Damaged and ReturnedToSender the DeliveryOutcomeRecorded event is published once per shipment and outcome, so compensation is handled by RET-007 and RET-005. | REQ-MPC-FR-186; Proposed |

**Business rules applied:** BR-LOG-090; BR-LOG-082 (§8.1).


### 7.14 PRD-LOG-014 COD cash reconciliation

| Item | Value |
|---|---|
| Description (baseline) | Matches cash collected by couriers to the orders and delivery runs it belongs to. |
| Why it matters | Cash is accounted for and losses are spotted. |
| Who benefits | Finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-014-01 | As a member of finance staff, I want cash collected by couriers on COD deliveries to be matched to the orders and delivery runs it belongs to, so that cash is accounted for and losses are spotted. | D; REQ-MPC-FR-194 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-014-01-01 | US-LOG-014-01 | **Given** a COD delivery is confirmed with the collected amount (POD record, LOG-012), **when** the confirmation is stored, **then** the amount is added to the courier's open remittance for that delivery run with status Expected (SM-LOG-05); PAY-008 marks the order paid from the same collected amount (AC-PAY-008-01-02). | REQ-MPC-FR-194; see PAY-008 |
| AC-LOG-014-01-02 | US-LOG-014-01 | **Given** a courier hands over cash at the depot, **when** the cashier records the remitted amount for the run, **then** expected (sum of collected amounts of the run) and remitted are compared: equal → Reconciled; different → Discrepancy and finance staff are alerted (event code Log.CodDiscrepancy, IC-TRK-04 SendEvent; BR-LOG-100). | REQ-MPC-FR-194 |
| AC-LOG-014-01-03 | US-LOG-014-01 | **Given** a Discrepancy exists, **when** finance staff resolve it with a note, **then** the remittance becomes Resolved, locked, and audited (AUD-LOG-007). | REQ-MPC-FR-194; Proposed |
| AC-LOG-014-01-04 | US-LOG-014-01 | **Given** delivery runs (LOG-024) are not in use, **when** a COD delivery is confirmed, **then** the run is the courier and the delivery date (Proposed). | Proposed |
| AC-LOG-014-01-05 | US-LOG-014-01 | **Given** a delivery partner collects COD, **when** the partner remittance file is imported, **then** its lines are matched by tracking number to collected amounts; unmatched lines are listed as exceptions. | Proposed |

**Business rules applied:** BR-LOG-100 (§8.1).


### 7.15 PRD-LOG-015 Address validation and geocoding

| Item | Value |
|---|---|
| Description (baseline) | Checks addresses and turns them into map coordinates, including digital postcodes where available. |
| Why it matters | Fewer delivery failures. |
| Who benefits | Couriers; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-015-01 | As a shopper, I want my address checked and placed on the map when I enter it, so that my parcel does not fail because of a wrong address. | D; REQ-MPC-FR-185 | Ready |
| US-LOG-015-02 | As a courier, I want coordinates stored for each delivery address, so that I can find the address on the last mile. | D; REQ-MPC-FR-185 | Ready |
| US-LOG-015-03 | As a client administrator, I want to use a digital postcode or address alias system if the country adopts one, and show it on labels and tracking, so that addresses without street names can be found. | D; REQ-MPC-FR-200 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-015-01-01 | US-LOG-015-01 | **Given** a validation and geocoding provider is configured (IC-LOG-03), **when** an address is saved at checkout or in My account, **then** the provider's result is shown (valid, suggested correction, not found) and the shopper can accept the suggestion or keep the entry. | REQ-MPC-FR-185 |
| AC-LOG-015-02-01 | US-LOG-015-02 | **Given** the provider returns coordinates or the shopper placed a map pin (CHK-007), **when** the address is saved, **then** latitude, longitude and source (pin, provider, manual) are stored in a plugin table keyed by AddressId, because the native Address has no coordinates (BR-LOG-140). | REQ-MPC-FR-185; FIT (Address); see CHK-007 |
| AC-LOG-015-02-02 | US-LOG-015-02 | **Given** an order is placed, **when** the order is inserted, **then** the coordinates of the chosen address are copied to the order's cloned shipping address; if none exist, a geocoding job is enqueued for it. | REQ-MPC-FR-185; FIT (CloneAddress at placement) |
| AC-LOG-015-01-02 | US-LOG-015-01 | **Given** no provider is configured or the provider is unavailable, **when** an address is saved, **then** it is saved without validation and the order is not blocked; the address is flagged "not validated" for operations. | REQ-MPC-FR-185 ("where available"); Proposed |
| AC-LOG-015-03-01 | US-LOG-015-03 | **Given** a digital postcode adapter is configured, **when** an address is saved, **then** the digital postcode or alias is resolved and stored, and is printed on labels (LOG-007) and shown on the tracking page (TRK-001). | REQ-MPC-FR-200 |

**Business rules applied:** BR-LOG-140 (§8.1).


### 7.16 PRD-LOG-016 Cross-border shipping

| Item | Value |
|---|---|
| Description (baseline) | Handles international postal shipping: customs declarations, international tracking and duties, using the postal systems CDS and IPS. It also exchanges data with the UPU Global Monitoring System (GMS). |
| Why it matters | International parcels can clear customs and be tracked across postal networks. |
| Who benefits | Malawi Post; international shoppers |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-016-01 | As a member of Malawi Post operations staff, I want customs declarations generated for international postal items and exchanged with UPU CDS, so that international parcels clear customs. | D; REQ-MPC-FR-190; REQ-MPC-FR-329 | Ready |
| US-LOG-016-02 | As an international shopper, I want to see international postal tracking from IPS on the tracking page, so that I can follow my parcel across postal networks. | D; REQ-MPC-FR-191; REQ-MPC-FR-329 | Ready |
| US-LOG-016-03 | As a member of Malawi Post operations staff, I want data exchanged with the UPU Global Monitoring System, so that international service quality is monitored. | D; REQ-MPC-FR-329 | Ready |
| US-LOG-016-04 | Technical enabler. As a member of the platform team, I want IPS event codes mapped to the common tracking event list, so that IPS events appear like every other event. | REQ-MPC-FR-221 | Ready |
| US-LOG-016-05 | As an international shopper, I want duties shown where the data is available, so that I know what I may have to pay. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-016-01-01 | US-LOG-016-01 | **Given** an order line ships internationally by post, **when** the shipment is created, **then** a customs declaration is drafted from the order (items, quantities, values, origin and customs fields from product data) with status Draft (SM-LOG-06). | REQ-MPC-FR-190 |
| AC-LOG-016-01-02 | US-LOG-016-01 | **Given** a declaration is complete and CDS is integrated, **when** staff submit it, **then** it is sent through the CDS interface; the response sets Accepted or Rejected with reasons, and the result is audited (AUD-LOG-013). | REQ-MPC-FR-190; REQ-MPC-FR-329 |
| AC-LOG-016-01-03 | US-LOG-016-01 | **Given** the declaration is not Accepted, **when** staff try to dispatch the parcel, **then** dispatch is refused with message Log.CustomsNotAccepted (BR-LOG-150). | Proposed |
| AC-LOG-016-02-01 | US-LOG-016-02 | **Given** IPS is integrated, **when** IPS sends events for an item's S10 identifier, **then** the events go into TRK-002 and appear on the buyer's tracking timeline. | REQ-MPC-FR-191; REQ-MPC-FR-329 |
| AC-LOG-016-04-01 | US-LOG-016-04 | **Given** an IPS event code is received, **when** it is processed, **then** it is translated to the common event code through the IPS mapping table; an unmapped code is rejected to the TRK-002 review queue. | REQ-MPC-FR-221; see TRK-002 |
| AC-LOG-016-03-01 | US-LOG-016-03 | **Given** GMS is integrated, **when** the exchange runs, **then** the data set defined by the GMS interface specification is sent or received and the run is logged with its result. | REQ-MPC-FR-329 |
| AC-LOG-016-05-01 | US-LOG-016-05 | **Given** duties are returned by an integrated system for the destination, **when** the shopper views the order or tracking page, **then** the duty amount and its source are shown; if none is available nothing is shown. | D |

**Business rules applied:** BR-LOG-150 (§8.1).


### 7.17 PRD-LOG-017 Holding charges and pre-dispatch changes

| Item | Value |
|---|---|
| Description (baseline) | Lets customers change the address before dispatch, and charges a daily storage fee after a number of free days at the outlet. |
| Why it matters | Encourages timely collection and covers storage costs. |
| Who benefits | Malawi Post; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: HOLD-BILL |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-017-01 | As a shopper, I want to change my delivery address or instructions before my order is dispatched, so that my parcel goes to the right place. | D; REQ-MPC-FR-167 | Ready; conditions: HOLD-BILL |
| US-LOG-017-02 | As a client administrator, I want to set how many days a parcel is stored free at an outlet and the daily charge after that, so that buyers collect on time and storage costs are covered. | D; REQ-MPC-FR-167 | Ready; conditions: HOLD-BILL |
| US-LOG-017-03 | As a client administrator, I want to set the pickup deadline and what happens when it passes, so that uncollected parcels are escalated. | REQ-MPC-FR-311 | Ready; conditions: HOLD-BILL |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-017-01-01 | US-LOG-017-01 | **Given** no shipment of the order is dispatched, no carrier booking is Booked, and the change window set by the client is open, **when** the shopper submits a new address or new instructions, **then** the change is checked for serviceability (LOG-004) and fee (LOG-002); if the fee is unchanged it is applied to the order address copy and audited (AUD-LOG-008) (BR-LOG-110). | REQ-MPC-FR-167 |
| AC-LOG-017-01-02 | US-LOG-017-01 | **Given** a shipment is dispatched or the change window is closed, **when** the shopper opens the change form, **then** the form is not offered and message Log.AddressChangeNotAllowed is shown. | REQ-MPC-FR-167 |
| AC-LOG-017-01-03 | US-LOG-017-01 | **Given** the new address gives a different delivery fee, **when** the change is submitted, **then** it is refused with message Log.AddressChangeFeeDiffers (Proposed). | Proposed |
| AC-LOG-017-01-04 | US-LOG-017-01 | **Given** an administrator edits the shipping address of an order with an active carrier booking (native AddressEdit POST), **when** the POST is sent, **then** the LOG action filter refuses it with message Log.ShipmentLocked until the booking is cancelled (BR-LOG-160). | FIT (OrderController.AddressEdit) |
| AC-LOG-017-02-01 | US-LOG-017-02 | **Given** a parcel is ready for pickup (ReadyForPickupDateUtc set), **when** the free storage days for the outlet pass, **then** the daily charge starts accruing (SM-LOG-08) and the buyer sees the amount due with message Log.HoldingCharge on the order page and in TRK-012 reminders (BR-LOG-111). | REQ-MPC-FR-167 |
| AC-LOG-017-02-02 | US-LOG-017-02 | **Given** a chargeable parcel is collected, **when** outlet staff hand it over, **then** the accrued charge is shown to staff; the hand-over is allowed only after staff record the charge on the OutletParcel as paid (with the receipt reference) or waived (AUD-LOG-009); accrual stops at that moment. LOG records the status only and moves no money. | REQ-MPC-FR-167; Proposed |
| AC-LOG-017-02-03 | US-LOG-017-02 | **Given** a user with Logistics.Core.Exceptions.CreateEditDelete waives a charge, **when** they save with a reason, **then** the charge is set to zero and the waiver audited (AUD-LOG-009). | Proposed |
| AC-LOG-017-03-01 | US-LOG-017-03 | **Given** the pickup deadline of the service level (ORD-011 ServiceLevel.PickupDeadline, counted from ReadyForPickupDateUtc) passes and the parcel is not collected, **when** the daily task runs, **then** the parcel is flagged Uncollected, TRK-012 sends the uncollected notice and, after the configured return delay, a return-to-sender exception is opened (LOG-013); the order-level flag and role escalation are ORD-011's. | REQ-MPC-FR-311; see ORD-011 (REQ-MPC-FR-311) |

**Business rules applied:** BR-LOG-110; BR-LOG-111 (§8.1).


### 7.18 PRD-LOG-018 Logistics KPIs

| Item | Value |
|---|---|
| Description (baseline) | Dashboards for on-time delivery, delivery success rate and transit times. |
| Why it matters | Shows how well delivery is performing. |
| Who benefits | Logistics managers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-018-01 | As a logistics manager, I want a dashboard of on-time delivery, delivery success rate and average transit time, so that I can see how delivery is performing. | D; REQ-MPC-FR-196 | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-018-01-01 | US-LOG-018-01 | **Given** shipments with promised ranges (LOG-005) were delivered in the period, **when** the dashboard is opened by a user with Logistics.Core.Reports.View, **then** the on-time rate is computed by the active RPT-002 KPI catalogue definition (BR-RPT-010, BR-LOG-120) and shown by service level, carrier and area; RPT-010 shows the same figure for the same filters. | REQ-MPC-FR-196 |
| AC-LOG-018-01-02 | US-LOG-018-01 | **Given** shipments in the period ended delivered, returned to sender or lost, **when** the dashboard is opened, **then** delivery success rate per BR-LOG-120 is shown with the same filters. | REQ-MPC-FR-196 |
| AC-LOG-018-01-03 | US-LOG-018-01 | **Given** shipments were shipped and delivered in the period, **when** the dashboard is opened, **then** average transit time = average of DeliveryDateUtc − ShippedDateUtc is shown in days with the same filters. | REQ-MPC-FR-196; FIT (Shipment dates) |
| AC-LOG-018-01-04 | US-LOG-018-01 | **Given** a user lacks Logistics.Core.Reports.View, **when** they open the dashboard, **then** access is denied (standard permission criterion). | Proposed |
| AC-LOG-018-01-05 | US-LOG-018-01 | **Given** the Logistics and postal pack is applied, **when** the KPI catalogue is loaded, **then** the BR-LOG-120 definitions are present as Draft entries with code, formula and owner LOG-018 (loaded by RPT-002, AC-RPT-002-02-01); the dashboard shows a KPI only while its catalogue entry is active. | see RPT-002; Proposed |

**Business rules applied:** BR-LOG-120 (§8.1).


### 7.19 PRD-LOG-019 Specialised logistics

| Item | Value |
|---|---|
| Description (baseline) | Special handling for goods that must stay cold — with the temperature recorded throughout the journey and alerts when it goes out of range — and for hazardous goods, with compliant packaging, certified carriers and the required documents. |
| Why it matters | Safe delivery of sensitive goods. |
| Who benefits | Logistics staff |
| Phase | P3 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-019-01 | As a member of logistics operations staff, I want to flag products that must stay cold and to receive temperature readings and out-of-range alerts during the journey, so that cold goods arrive safely. | D; FC-M15-017 | Ready |
| US-LOG-019-02 | As a member of logistics operations staff, I want hazardous goods to be sent only with certified carriers and with the required documents, so that hazardous shipments are compliant. | D; FC-M15-018 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-019-01-01 | US-LOG-019-01 | **Given** a product carries the cold-chain specification attribute, **when** it is allocated and booked, **then** only carriers flagged cold-chain capable are eligible (carrier rule, BR-LOG-040). | D; FIT (SpecificationAttribute) |
| AC-LOG-019-01-02 | US-LOG-019-01 | **Given** a telemetry provider is integrated, **when** an out-of-range reading is received for a shipment, **then** a TRK-002 exception event is recorded and a LOG-013 incident of type delayed or damaged is opened for review. | D; FC-M15-017 |
| AC-LOG-019-02-01 | US-LOG-019-02 | **Given** a product carries the hazardous specification attribute, **when** a shipment is booked, **then** only carriers flagged as certified for that class are eligible, and dispatch is refused until the required documents are attached to the shipment. | D; FC-M15-018 |

**Business rules applied:** BR-LOG-040 (§8.1).


### 7.20 PRD-LOG-020 S10 identifiers

| Item | Value |
|---|---|
| Description (baseline) | Creates and checks international postal tracking numbers in the UPU S10 format (for example RR123456789MW). |
| Why it matters | Required for international postal tracking. |
| Who benefits | Malawi Post |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-020-01 | As a member of Malawi Post operations staff, I want international postal items to get S10 identifiers from our allocated series, so that they can be tracked in international postal networks. | D; REQ-MPC-FR-205 | Ready |
| US-LOG-020-02 | As a member of Malawi Post operations staff, I want S10 numbers entered or received to be checked for format and check digit, so that wrong numbers are caught. | D; REQ-MPC-FR-205 | Ready |
| US-LOG-020-03 | As a member of support staff, I want each shipment identifier linked to the order lines it carries and its tracking references, so that I can find any parcel from any reference. | REQ-MPC-FR-163 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-020-01-01 | US-LOG-020-01 | **Given** an S10 series (service indicator, serial range, country code) is configured in the Postal pack, **when** an identifier is requested for an international postal shipment, **then** the next unused serial in the range is taken under ILocker key 'log-s10-{series}', its check digit computed per UPU S10, and the identifier (format of the baseline example RR123456789MW) set as Shipment.TrackingNumber through IShipmentService with ShipmentTrackingNumberSetEvent; it is audited (AUD-LOG-010) (BR-LOG-050). | REQ-MPC-FR-205; FIT |
| AC-LOG-020-01-02 | US-LOG-020-01 | **Given** a series is exhausted, **when** another identifier is requested, **then** none is issued and operations staff are alerted to configure a new range. | Proposed |
| AC-LOG-020-02-01 | US-LOG-020-02 | **Given** a user enters a tracking number on an international postal shipment (admin SetTrackingNumber or AddShipment POST), **when** the POST is sent, **then** the LOG action filter validates format and check digit; an invalid number is refused with message Log.S10Invalid (BR-LOG-160). | REQ-MPC-FR-205; FIT (SetTrackingNumber has no validation) |
| AC-LOG-020-03-01 | US-LOG-020-03 | **Given** a shipment carries an S10 identifier and a partner or carrier reference, **when** either reference is searched, **then** the shipment, its ShipmentItems and their order lines are found; references are unique per type (ShipmentReference). | REQ-MPC-FR-163; FIT (ShipmentItem.OrderItemId) |

**Business rules applied:** BR-LOG-050 (§8.1).


### 7.21 PRD-LOG-021 Carrier connector framework

| Item | Value |
|---|---|
| Description (baseline) | A standard technical 'plug' for delivery companies: get a price, book, print a label, track and cancel, plus rules to choose the best carrier. |
| Why it matters | A new courier is added by building one adapter, not by changing the shop. |
| Who benefits | Platform team; logistics staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-021-01 | Technical enabler. As a member of the platform team, I want one standard connector every courier adapter implements for price, booking, label, tracking and cancel, so that a new courier is added by building one adapter. | D; REQ-KTDA-INT-003; REQ-KTDA-LOG-003 | Ready; conditions: OVR-REG |
| US-LOG-021-02 | As a member of logistics operations staff, I want rules that assign each shipment to a delivery partner (own fleet or private courier), so that the right partner carries each parcel. | D; REQ-MPC-FR-180 | Ready; conditions: OVR-REG |
| US-LOG-021-03 | As a member of logistics operations staff, I want to compare carrier quotes for a shipment and pick the cheapest that meets the service level, so that we control delivery cost. | FC-M15-006 | Ready; conditions: OVR-REG |
| US-LOG-021-04 | As a shopper, I want courier tracking updates to reach the platform as they happen, so that I see where my parcel is. | REQ-KTDA-LOG-003; FC-M15-008 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-021-01-01 | US-LOG-021-01 | **Given** an adapter implements the connector (IC-LOG-01), **when** it is installed, **then** it declares a capability flag for GetRates, Book, GetLabel, Track, HandleCallback and Cancel, its supported service levels and label formats; carriers offering checkout rates also implement IShippingRateComputationMethod. | D; REQ-KTDA-INT-003; FIT |
| AC-LOG-021-01-02 | US-LOG-021-01 | **Given** an adapter does not support an operation, **when** that operation is requested, **then** the framework returns NotSupported and the screen offers the manual path (enter waybill, upload label; an uploaded label is checked through IC-ADM-08 CheckUpload for the LOG upload context "carrier label", BR-LOG-082). | Proposed |
| AC-LOG-021-01-03 | US-LOG-021-01 | **Given** a booking request is retried after a timeout, **when** the adapter is called again, **then** the same idempotency key (ShipmentId + attempt) is sent and no second active booking exists (BR-LOG-041). | Proposed |
| AC-LOG-021-01-04 | US-LOG-021-01 | **Given** the adapter is a carrier rate method, or the order uses the LOG fee engine or the LOG outlet provider (including the postal service levels), **when** GetShipmentTrackerAsync is called, **then** it returns the TRK-002 hub tracker, so the native shipment pages show the common event timeline including PostGlobal events received through INT-007; LOG does not override IShipmentService.GetShipmentTrackerAsync (BR-LOG-042). | FIT (ShipmentService.GetShipmentTrackerAsync loads the tracker from the order's rate method or pickup provider); OVR-REG |
| AC-LOG-021-01-05 | US-LOG-021-01 | **Given** an adapter declares the reverse-booking capability and RET-003 requests a return pickup (IC-RET-03), **when** IC-LOG-01 BookReturn is called with the pickup address or drop-off outlet, destination (seller, warehouse or outlet), parcel data and return reference, **then** a CarrierBooking linked to the ReturnShipment (not to a native Shipment) is Requested and becomes Booked with booking and tracking references and a label if the carrier supplies one; the tracking reference is returned to RET-003, which registers it with TRK-002 (IC-TRK-01 RegisterExternalReference), so carrier events for it are applied; cancellation uses IC-LOG-01 Cancel; an adapter without the capability returns NotSupported. | Proposed; see RET-003 (REQ-MPC-FR-189) |
| AC-LOG-021-02-01 | US-LOG-021-02 | **Given** assignment rules exist by destination area, service level, weight band, seller and fulfilment model, with priorities, **when** a shipment needs a partner, **then** the first matching rule by priority assigns the partner; with no match the default partner applies; the assignment is shown on the shipment (BR-LOG-040). | REQ-MPC-FR-180 |
| AC-LOG-021-02-02 | US-LOG-021-02 | **Given** staff override the assigned partner, **when** they save with a reason, **then** the shipment is reassigned, any active booking with the old partner is cancelled first, and the change is audited (AUD-LOG-004). | REQ-MPC-FR-180; Proposed |
| AC-LOG-021-03-01 | US-LOG-021-03 | **Given** rate shopping is enabled for a rule and two adapters return quotes for the service level, **when** the shipment is assigned, **then** the cheapest quote is selected and both quotes are stored with the shipment. | FC-M15-006 |
| AC-LOG-021-04-01 | US-LOG-021-04 | **Given** an adapter supports push callbacks, **when** a carrier calls the adapter route, **then** the callback is authenticated (signature, token or IP allow-list), then passed to TRK-002; a failed check is rejected and audited (AUD-LOG-003). | REQ-KTDA-LOG-003; FC-M15-008; Proposed (authentication) |
| AC-LOG-021-04-02 | US-LOG-021-04 | **Given** an adapter supports only polling, **when** the tracking poll task runs, **then** undelivered shipments of that carrier are polled at the configured interval (setting, default not stated) and new events passed to TRK-002. | REQ-KTDA-LOG-003; FC-M15-008 |

**Business rules applied:** BR-LOG-040; BR-LOG-041 (§8.1).


### 7.22 PRD-LOG-022 Post-office drop-off acceptance

| Item | Value |
|---|---|
| Description (baseline) | Post offices and agencies accept parcels dropped off by sellers, scanning them in. |
| Why it matters | Sellers hand over parcels at any post office. |
| Who benefits | Sellers; post-office staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-TRK-003 |
| Status | On hold: FG-06 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-022-01 | As a seller, I want to drop my parcels at any post office or agency and have them accepted by scan, so that I do not need to wait for a collection. | D; REQ-MPC-FR-178 | On hold: FG-06 |
| US-LOG-022-02 | As a member of outlet staff, I want to scan a dropped-off parcel and accept it only if the platform expects it, so that unknown parcels are not taken in. | D; REQ-MPC-FR-178 | On hold: FG-06 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-022-02-01 | US-LOG-022-02 | **Given** a parcel label belongs to a shipment awaiting drop-off, **when** outlet staff scan it (TRK-003 app or the admin acceptance page with a barcode reader), **then** the shipment gets an accepted event in TRK-002 with outlet, staff and time; the seller receives an acceptance receipt (event code Log.DropOffAccepted, IC-TRK-04 SendEvent) and the event is audited (AUD-LOG-012). | REQ-MPC-FR-178 |
| AC-LOG-022-02-02 | US-LOG-022-02 | **Given** the scanned code matches no shipment awaiting drop-off, **when** the scan is submitted, **then** acceptance is refused with message Log.UnknownParcel and the attempt logged. | REQ-MPC-FR-178; Proposed |
| AC-LOG-022-01-01 | US-LOG-022-01 | **Given** the seller chose drop-off (SEL-018), **when** the order is released for fulfilment, **then** the seller sees the parcels to drop off and the outlets that accept drop-offs. | D; see SEL-018 |
| AC-LOG-022-02-03 | US-LOG-022-02 | **Given** weight capture is enabled at the outlet, **when** the parcel is accepted, **then** the weight is recorded and differences against the declared weight are flagged. | Proposed |

**Business rules applied:** BR-LOG-130 (§8.1).


### 7.23 PRD-LOG-023 Hub-and-spoke sorting

| Item | Value |
|---|---|
| Description (baseline) | Parcels are sorted at central hubs and sent out to branches, with a scan at every handover. |
| Why it matters | Parcels can be traced through the postal network. |
| Who benefits | Malawi Post operations |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-TRK-003 |
| Status | On hold: FG-06 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-023-01 | As a member of Malawi Post operations staff, I want every hand-over scan at a hub or branch recorded on the parcel, so that parcels can be traced through the postal network. | D; REQ-MPC-FR-192 | On hold: FG-06 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-023-01-01 | US-LOG-023-01 | **Given** the postal sorting system (external, not named) sends hand-over scan events, **when** they are received through the TRK-002 ingestion interface, **then** each scan is stored with hub, time and event code and appears in the timeline. | REQ-MPC-FR-192; FIT (external system) |
| AC-LOG-023-01-02 | US-LOG-023-01 | **Given** a hub route is configured with the expected sequence of hubs, **when** a parcel misses an expected hand-over scan, **then** TRK-002 flags it for operations review (missed-scan rule). | REQ-MPC-FR-192; see TRK-002 (REQ-MPC-FR-209) |
| AC-LOG-023-01-03 | US-LOG-023-01 | **Given** hubs are configured (Postal pack settings), **when** a scan names an unknown hub, **then** the event is rejected to the TRK-002 review queue. | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.24 PRD-LOG-024 Last-mile route lists and attempts

| Item | Value |
|---|---|
| Description (baseline) | Daily delivery lists for drivers and couriers, where they record each delivery attempt. |
| Why it matters | Organised last-mile delivery. |
| Who benefits | Couriers; Malawi Post |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-TRK-003 |
| Status | On hold: FG-06 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-024-01 | As a courier, I want a daily list of my deliveries in a sensible order, so that I can plan my round. | D; REQ-MPC-FR-179 | On hold: FG-06 |
| US-LOG-024-02 | As a courier, I want to record each delivery attempt and its result on my phone, so that attempts and failures are known at once. | D; REQ-MPC-FR-179 | On hold: FG-06 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-024-01-01 | US-LOG-024-01 | **Given** shipments for an area are ready for last-mile delivery, **when** operations staff create the day's route list for a courier, **then** the list holds the shipments in the planned sequence (manual order, or by postal code and street when no routing provider exists) and each item becomes Assigned (SM-LOG-09). | REQ-MPC-FR-179; Proposed (sequencing) |
| AC-LOG-024-02-01 | US-LOG-024-02 | **Given** the courier starts the round, **when** they open the list (mobile-friendly page or app), **then** items become OutForDelivery and TRK-002 records an out-for-delivery event per shipment, which triggers the TRK-012 notification. | REQ-MPC-FR-179 |
| AC-LOG-024-02-02 | US-LOG-024-02 | **Given** an item is OutForDelivery, **when** the courier records Delivered with proof (LOG-012 / LOG-032), **then** the item becomes Delivered and DeliverAsync is called once. | REQ-MPC-FR-179; FIT |
| AC-LOG-024-02-03 | US-LOG-024-02 | **Given** an item is OutForDelivery, **when** the courier records Failed with a reason code, **then** the item becomes Failed and a LOG-013 exception opens. | REQ-MPC-FR-179; see LOG-013 (REQ-MPC-FR-207) |
| AC-LOG-024-01-02 | US-LOG-024-01 | **Given** a route list exists, **when** a courier opens a list that is not theirs, **then** access is denied. | Proposed |

**Business rules applied:** BR-LOG-090 (§8.1).


### 7.25 PRD-LOG-025 FedEx adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects to FedEx for delivery services (as far as FedEx's system allows). This includes shipment tracking events, which are fed into the tracking event hub. |
| Why it matters | Access to another international courier. |
| Who benefits | Logistics staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-LOG-021 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-025-01 | As a member of KTDA logistics staff, I want FedEx connected through the carrier framework, as far as the FedEx system allows, so that KTDA can ship with FedEx and receive its tracking updates. | D; REQ-KTDA-LOG-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-025-01-01 | US-LOG-025-01 | **Given** the FedEx adapter is built on LOG-021 and configured with KTDA's account, **when** it is installed, **then** its capability record (IC-LOG-01) lists the operations the FedEx system supports; unsupported operations return NotSupported. | D; REQ-KTDA-LOG-003 |
| AC-LOG-025-01-02 | US-LOG-025-01 | **Given** a shipment is assigned to FedEx and FedEx offers tracking by API, **when** FedEx reports an event (push or poll), **then** the event is passed to TRK-002, mapped to the common event list and shown on the timeline. | D; REQ-KTDA-LOG-003 |
| AC-LOG-025-01-03 | US-LOG-025-01 | **Given** FedEx offers no tracking API, **when** a shipment is assigned to it, **then** staff record the waybill number and hand-over manually; the timeline shows only platform events and the shipment is marked "carrier updates not available". | Proposed |

**Business rules applied:** BR-LOG-040; BR-LOG-041 (§8.1).


### 7.26 PRD-LOG-026 G4S adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects to G4S courier services in Kenya. This includes shipment tracking events, which are fed into the tracking event hub. |
| Why it matters | A local courier option for KTDA. |
| Who benefits | KTDA logistics |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-LOG-021 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-026-01 | As a member of KTDA logistics staff, I want G4S (Kenya) connected through the carrier framework, as far as the G4S (Kenya) system allows, so that KTDA can ship with G4S (Kenya) and receive its tracking updates. | D; REQ-KTDA-LOG-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-026-01-01 | US-LOG-026-01 | **Given** the G4S (Kenya) adapter is built on LOG-021 and configured with KTDA's account, **when** it is installed, **then** its capability record (IC-LOG-01) lists the operations the G4S (Kenya) system supports; unsupported operations return NotSupported. | D; REQ-KTDA-LOG-003 |
| AC-LOG-026-01-02 | US-LOG-026-01 | **Given** a shipment is assigned to G4S (Kenya) and G4S (Kenya) offers tracking by API, **when** G4S (Kenya) reports an event (push or poll), **then** the event is passed to TRK-002, mapped to the common event list and shown on the timeline. | D; REQ-KTDA-LOG-003 |
| AC-LOG-026-01-03 | US-LOG-026-01 | **Given** G4S (Kenya) offers no tracking API, **when** a shipment is assigned to it, **then** staff record the waybill number and hand-over manually; the timeline shows only platform events and the shipment is marked "carrier updates not available". | Proposed |

**Business rules applied:** BR-LOG-040; BR-LOG-041 (§8.1).


### 7.27 PRD-LOG-027 Skynet adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects to Skynet courier services. This includes shipment tracking events, which are fed into the tracking event hub. |
| Why it matters | A courier option named by KTDA. |
| Who benefits | KTDA logistics |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-LOG-021 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-027-01 | As a member of KTDA logistics staff, I want Skynet connected through the carrier framework, as far as the Skynet system allows, so that KTDA can ship with Skynet and receive its tracking updates. | D; REQ-KTDA-LOG-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-027-01-01 | US-LOG-027-01 | **Given** the Skynet adapter is built on LOG-021 and configured with KTDA's account, **when** it is installed, **then** its capability record (IC-LOG-01) lists the operations the Skynet system supports; unsupported operations return NotSupported. | D; REQ-KTDA-LOG-003 |
| AC-LOG-027-01-02 | US-LOG-027-01 | **Given** a shipment is assigned to Skynet and Skynet offers tracking by API, **when** Skynet reports an event (push or poll), **then** the event is passed to TRK-002, mapped to the common event list and shown on the timeline. | D; REQ-KTDA-LOG-003 |
| AC-LOG-027-01-03 | US-LOG-027-01 | **Given** Skynet offers no tracking API, **when** a shipment is assigned to it, **then** staff record the waybill number and hand-over manually; the timeline shows only platform events and the shipment is marked "carrier updates not available". | Proposed |

**Business rules applied:** BR-LOG-040; BR-LOG-041 (§8.1).


### 7.28 PRD-LOG-028 Wells Fargo (Kenya) courier adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects to Wells Fargo courier services in Kenya. This includes shipment tracking events, which are fed into the tracking event hub. |
| Why it matters | A local courier option named by KTDA. |
| Who benefits | KTDA logistics |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-LOG-021 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-028-01 | As a member of KTDA logistics staff, I want Wells Fargo (Kenya) connected through the carrier framework, as far as the Wells Fargo (Kenya) system allows, so that KTDA can ship with Wells Fargo (Kenya) and receive its tracking updates. | D; REQ-KTDA-LOG-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-028-01-01 | US-LOG-028-01 | **Given** the Wells Fargo (Kenya) adapter is built on LOG-021 and configured with KTDA's account, **when** it is installed, **then** its capability record (IC-LOG-01) lists the operations the Wells Fargo (Kenya) system supports; unsupported operations return NotSupported. | D; REQ-KTDA-LOG-003 |
| AC-LOG-028-01-02 | US-LOG-028-01 | **Given** a shipment is assigned to Wells Fargo (Kenya) and Wells Fargo (Kenya) offers tracking by API, **when** Wells Fargo (Kenya) reports an event (push or poll), **then** the event is passed to TRK-002, mapped to the common event list and shown on the timeline. | D; REQ-KTDA-LOG-003 |
| AC-LOG-028-01-03 | US-LOG-028-01 | **Given** Wells Fargo (Kenya) offers no tracking API, **when** a shipment is assigned to it, **then** staff record the waybill number and hand-over manually; the timeline shows only platform events and the shipment is marked "carrier updates not available". | Proposed |

**Business rules applied:** BR-LOG-040; BR-LOG-041 (§8.1).


### 7.29 PRD-LOG-029 Aramex adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects to Aramex courier services. This includes shipment tracking events, which are fed into the tracking event hub. |
| Why it matters | A regional and international courier named by KTDA. |
| Who benefits | KTDA logistics |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-LOG-021 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-029-01 | As a member of KTDA logistics staff, I want Aramex connected through the carrier framework, as far as the Aramex system allows, so that KTDA can ship with Aramex and receive its tracking updates. | D; REQ-KTDA-LOG-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-029-01-01 | US-LOG-029-01 | **Given** the Aramex adapter is built on LOG-021 and configured with KTDA's account, **when** it is installed, **then** its capability record (IC-LOG-01) lists the operations the Aramex system supports; unsupported operations return NotSupported. | D; REQ-KTDA-LOG-003 |
| AC-LOG-029-01-02 | US-LOG-029-01 | **Given** a shipment is assigned to Aramex and Aramex offers tracking by API, **when** Aramex reports an event (push or poll), **then** the event is passed to TRK-002, mapped to the common event list and shown on the timeline. | D; REQ-KTDA-LOG-003 |
| AC-LOG-029-01-03 | US-LOG-029-01 | **Given** Aramex offers no tracking API, **when** a shipment is assigned to it, **then** staff record the waybill number and hand-over manually; the timeline shows only platform events and the shipment is marked "carrier updates not available". | Proposed |

**Business rules applied:** BR-LOG-040; BR-LOG-041 (§8.1).


### 7.30 PRD-LOG-030 Shipping lines and agents adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects to shipping lines and shipping agents for sea freight. This includes shipment tracking events, which are fed into the tracking event hub. |
| Why it matters | Supports export of bulk tea by sea. |
| Who benefits | KTDA export staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-LOG-021 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-030-01 | As a member of KTDA export staff, I want shipping lines and shipping agents connected for sea freight, as far as their systems allow, so that bulk tea exports by sea can be booked and followed. | D; REQ-KTDA-LOG-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-030-01-01 | US-LOG-030-01 | **Given** an adapter for a named shipping line or agent is built on LOG-021, **when** it is installed, **then** its capability record lists the operations the line supports (for example booking reference and container or bill-of-lading tracking). | D; REQ-KTDA-LOG-003 |
| AC-LOG-030-01-02 | US-LOG-030-01 | **Given** a sea-freight shipment has a bill-of-lading or container reference, **when** the line reports a milestone (push or poll), **then** the milestone is passed to TRK-002, mapped to the common event list and shown on the timeline. | D; REQ-KTDA-LOG-003 |
| AC-LOG-030-01-03 | US-LOG-030-01 | **Given** the line offers no API, **when** a sea-freight shipment is created, **then** staff enter milestones manually in TRK-002 with the source "manual". | Proposed |

**Business rules applied:** BR-LOG-040 (§8.1).


### 7.31 PRD-LOG-031 MPC delivery partner adapters

| Item | Value |
|---|---|
| Description (baseline) | Connects to Malawi Post's delivery partners once Malawi Post names them. |
| Why it matters | Lets partners carry Malawi Post deliveries. |
| Who benefits | Malawi Post |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-LOG-021 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-031-01 | As a member of Malawi Post operations staff, I want Malawi Post's delivery partners connected through the carrier framework once they are named, so that partners can carry Malawi Post deliveries under the assignment rules. | D; REQ-MPC-FR-180 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-031-01-01 | US-LOG-031-01 | **Given** Malawi Post names a delivery partner and its adapter is built on LOG-021, **when** a shipment matches an assignment rule for that partner, **then** the shipment is assigned to it and the partner's supported operations (IC-LOG-01) are used. | D; REQ-MPC-FR-180 |
| AC-LOG-031-01-02 | US-LOG-031-01 | **Given** a partner has no API, **when** a shipment is assigned to it, **then** the partner works from a printable or exported job list and its hand-over and delivery are recorded manually. | Proposed |

**Business rules applied:** BR-LOG-040 (§8.1).


### 7.32 PRD-LOG-032 Own-fleet POD capture

| Item | Value |
|---|---|
| Description (baseline) | Malawi Post's own delivery staff capture the customer's signature, a photo and the GPS location on a phone app as proof of delivery. |
| Why it matters | Strong proof of delivery for the operator's own fleet. |
| Who benefits | Malawi Post couriers |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-TRK-003, PRD-LOG-012 |
| Status | On hold: FG-06, PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-LOG-032-01 | As a courier of the own fleet, I want to capture the customer's signature, a photo and the GPS position on my phone at delivery, so that there is strong proof of delivery. | D; REQ-MPC-FR-187 | On hold: FG-06, PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-LOG-032-01-01 | US-LOG-032-01 | **Given** the own-fleet app (external) is registered as a device of an authorised courier (TRK-003 device register), **when** it posts a POD with time, coordinates, recipient acknowledgement method (signature, OTP, QR or scan), recipient name and media, **then** the POD intake API (IC-LOG-04) authenticates it, checks each media file through IC-ADM-08 CheckUpload (context "proof-of-delivery media", BR-LOG-082), stores it as a LOG-012 proof-of-delivery record with the media as downloads, and calls DeliverAsync once. | REQ-MPC-FR-187; FIT (external app + integration plugin) |
| AC-LOG-032-01-02 | US-LOG-032-01 | **Given** the app captured a POD while offline, **when** it syncs later, **then** the original capture time is kept and the late arrival is shown on the record. | REQ-MPC-FR-187; Proposed |
| AC-LOG-032-01-03 | US-LOG-032-01 | **Given** a POD arrives for a shipment already delivered, **when** it is received, **then** it is stored as additional evidence and DeliverAsync is not called again. | Proposed |
| AC-LOG-032-01-04 | US-LOG-032-01 | **Given** location capture is used, **when** the courier captures a POD, **then** coordinates are taken from the device location service with the consent recorded by the app. | NFR-X-002; Proposed |

**Business rules applied:** BR-LOG-080; BR-LOG-082 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-LOG-001 | Native shipment state changes only through IOrderProcessingService.ShipAsync (not for pickup orders), ReadyForPickupAsync (pickup orders only) and DeliverAsync; code never sets Shipment.ShippedDateUtc, ReadyForPickupDateUtc, DeliveryDateUtc or Order.ShippingStatusId directly. Each call is made at most once per shipment and state, under ILocker key 'shipment-{ShipmentId}' (shared with TRK), after re-reading the shipment. IOrderProcessingService is overridden by CHK-003 only (OVR-REG); if that override refuses the call through an ORD hook (for example an ORD-010 hold), the LOG step keeps its state and shows the refusal message. | LOG-009, LOG-010, LOG-012, LOG-024, LOG-032 | FIT (OrderProcessingService.ShipAsync, ReadyForPickupAsync, DeliverAsync throw if already set); OVR-REG |
| BR-LOG-003 | LOG creates native shipments only through IShipmentService.InsertShipmentAsync, never through the repository, so the single override hosted by ORD-010 (OVR-REG) runs every shipment guard provider registered through IC-ORD-11 (PAY letter of credit, ORD-010 hold, EGV-004 issue check). For lot- or serial-tracked lines on every LOG path (fulfilment screens, IC-LOG-07, APIs) LOG calls IC-INV-07 Capture before the insert, Confirm after the shipment items are saved, and Cancel when a guard refuses or the insert fails (BR-INV-070, BR-INV-080); Admin OrderController.AddShipment is covered by the INV action filter. A refusal or a refused capture saves nothing. LOG registers no override of IShipmentService. | LOG-009, LOG-010, LOG-011 | OVR-REG; FIT (ShipmentService.InsertShipmentAsync); IC-ORD-11; IC-INV-07;, |
| BR-LOG-002 | A shipping option is shown only if its rate method is active (ShippingSettings.ActiveShippingRateComputationMethodSystemNames), the shipping method is allowed for the destination country (ShippingMethodCountryMapping) and serviceability allows it (BR-LOG-020). | LOG-001 | FIT; REQ-MPC-FR-197 |
| BR-LOG-010 | Delivery fee = sum of the components defined for the service level in the fee-table version in force: base by zone or distance band, weight band, location type (rural / urban), pickup or delivery; each component is kept for the breakdown; amounts are rounded per component to the currency minor unit and the fee is the sum of the rounded components. | LOG-001, LOG-002 | REQ-MPC-FR-105; REQ-MPC-FR-304; Proposed (rounding) |
| BR-LOG-011 | Distance bands use the straight-line distance between origin and destination coordinates (origin warehouse coordinates read through IC-INV-05 GetWarehouseLocation; destination LOG-015 AddressGeo). If either has no coordinates, the zone table of the same service level applies; if there is no zone table, the option is not offered and the case is logged. | LOG-002 | Proposed |
| BR-LOG-012 | Fee tables, pickup fees and partner share rules are versioned with an effective date; an order keeps the versions in force when it was quoted and placed. | LOG-002 | REQ-MPC-FR-304; Proposed |
| BR-LOG-013 | Partner revenue share per partner and service level is fixed or a percentage of the delivery fee; partner share + client share = delivery fee; recorded per shipment at partner assignment. | LOG-002 | REQ-MPC-FR-198; Proposed (method) |
| BR-LOG-014 | LOG-002 owns delivery and pickup fee tables; COD fees are PAY-015; payment-method fees are PAY-015. | LOG-002 | boundary (PRD-PAY-015) |
| BR-LOG-020 | Delivery for a service level is offered only if the destination is in a coverage area allowing that level, with the Marketplace pack in the coverage of every seller of the (sub-)order, and, where a product of the (sub-)order has a ProductDeliveryOption list, in that list; pickup is offered only at outlets serving the destination area that are not closed on the expected arrival date, not flagged full and, where a list exists, allowed for every product. IC-LOG-06 IsServiceable and GetOutlets apply the same rule for other modules. | LOG-001, LOG-003, LOG-004 | REQ-MPC-FR-197; REQ-MPC-FR-069; REQ-MPC-FR-188; Proposed (product list, EGV-004) |
| BR-LOG-021 | Location type (rural / urban) is an attribute of the coverage area (Proposed). LOG-002 fees and PAY routing and COD fee rules read it from there; there is one source. | LOG-002, LOG-004 | REQ-MPC-FR-304; Proposed |
| BR-LOG-030 | EDT: dispatch day = order day if before the ORD-011 cut-off of the service level on a working day of the ORD-011 calendar, else the next working day; then moved to the next departure day of the transport link; earliest = dispatch day + ORD-011 handling time + minimum transit days, latest = dispatch day + ORD-011 handling time + maximum transit days, skipping non-working days of the ORD-011 calendar. The range is stored with the order as the promise. Cut-off, handling time and calendar have one source, ORD-011 ServiceLevel. | LOG-005 | REQ-MPC-FR-182; Proposed (formula) |
| BR-LOG-040 | Carrier assignment rules are evaluated by priority on destination area, service level, weight band, seller, fulfilment model and special handling (cold chain, hazardous); optional rate shopping picks the cheapest quote among eligible carriers; with no match the default carrier applies; manual override needs a reason. | LOG-006, LOG-019, LOG-021, LOG-025 to LOG-031 | REQ-MPC-FR-180; FC-M15-006; D |
| BR-LOG-041 | One active booking per shipment or return shipment; every booking request carries the idempotency key ShipmentId (or ReturnShipmentId) + attempt; reassignment cancels the active booking first. LOG returns the tracking reference of a return booking to RET-003, which registers it with TRK-002 (IC-TRK-01 RegisterExternalReference); LOG registers no reference itself. | LOG-006, LOG-021 | Proposed |
| BR-LOG-042 | Tracker resolution: every product shipping-rate method (LOG fee engine, carrier adapters, postal service levels) and the LOG outlet provider return the TRK-002 hub tracker from GetShipmentTrackerAsync. IShipmentService.GetShipmentTrackerAsync is not overridden, because IShipmentService has one owner (ORD-010, OVR-REG); PostGlobal events reach the hub through INT-007, so no PostGlobal tracker is needed on shipment pages. | LOG-021 | FIT (ShipmentService.GetShipmentTrackerAsync); OVR-REG |
| BR-LOG-050 | S10 identifiers follow the UPU S10 format (service indicator, serial, check digit, ISO country code). Serials are taken in order from the configured range under ILocker key 'log-s10-{series}', stored with a unique index, and never reused. Entered or received S10 numbers are validated for format and check digit. | LOG-007, LOG-020 | REQ-MPC-FR-205; REQ-MPC-FR-163 |
| BR-LOG-060 | Fulfilment model per order line: product setting, else seller opt-in (SEL-018), else client default; values merchant-fulfilled, client-fulfilled, third-party. | LOG-008 | REQ-MPC-FR-161; Proposed (precedence) |
| BR-LOG-061 | Nearest warehouse: among warehouses with enough stock for the line (ProductWarehouseInventory), the one with the shortest straight-line distance to the destination (warehouse coordinates through IC-INV-05 GetWarehouseLocation; a warehouse without coordinates is not a candidate for distance); ties go to the lowest warehouse Id. | LOG-008 | FC-M15-001; Proposed (tie rule) |
| BR-LOG-070 | A package can be confirmed packed only when every picked item and quantity matches the order lines of the task; dispatch requires a carrier or route assignment and a tracking reference. | LOG-009 | FC-M15-003; FC-M15-004 |
| BR-LOG-080 | Each service level has a set of accepted proof methods (signature, OTP, QR scan, courier confirmation, staff confirmation). DeliverAsync is called only after a POD record of an accepted method exists for the shipment. | LOG-012, LOG-032 | REQ-MPC-FR-195; REQ-MPC-FR-164 |
| BR-LOG-081 | A home-delivery OTP generated by LOG-012 is valid only for its shipment, is single-use, and is locked after the configured number of wrong attempts. Pickup codes and QR codes are CHK-012 (BR-CHK-016); LOG calls IC-CHK-09 Verify and acts only on Valid, and calls IC-CHK-09 MarkUsed after DeliverAsync succeeds. | LOG-012 | REQ-MPC-FR-195; Proposed (lock) |
| BR-LOG-082 | Files that LOG receives (proof-of-delivery media from outlet and courier pages, carriers and IC-LOG-04; delivery exception evidence; manually uploaded carrier labels) belong to the LOG upload contexts "proof-of-delivery media", "delivery exception evidence" and "carrier label", which LOG registers at installation through IC-ADM-08 RegisterUploadContext as own-endpoint contexts; each file is checked through IC-ADM-08 CheckUpload (type, size, signature, scan) before it is stored with IDownloadService.InsertDownloadAsync, because the ADM-008 IDownloadService backstop sees only IFormFile uploads. LOG keeps no type or size check of its own. LOG implements a download-access rule provider (IC-SEC-05) that claims proof-of-delivery media (ProofOfDelivery.MediaDownloadIds) and allows them on admin DownloadFile only to holders of Logistics.Core.ProofOfDelivery.View; LOG registers no download filter. | LOG-012, LOG-013, LOG-021, LOG-032 | SINGLE-FILTER; IC-ADM-08; IC-SEC-05; FIT (DownloadService.InsertDownloadAsync takes bytes, GetDownloadBitsAsync takes IFormFile; Admin DownloadController.DownloadFile has only AuthorizeAdmin); Proposed (context names) |
| BR-LOG-090 | Delivery exception reason codes are a configurable list (initial values from source: unreachable, not at home, address issue, refused; incident types lost, damaged, delayed). After the configured maximum of failed attempts the action is return to sender. An exception open beyond the threshold for its type is escalated. | LOG-013, LOG-024 | REQ-MPC-FR-207; REQ-MPC-FR-186; FC-M15-011 |
| BR-LOG-100 | COD remittance: expected = sum of collected COD amounts on the run's POD records; remitted = amount the cashier records; equal → Reconciled, otherwise Discrepancy; a Reconciled or Resolved remittance cannot be edited. | LOG-014 | REQ-MPC-FR-194; Proposed (lock) |
| BR-LOG-110 | A buyer may change the delivery address or instructions only while no shipment of the order is dispatched, no carrier booking is Booked or LabelIssued, and the client change window is open; the new address must pass BR-LOG-020; if the recalculated fee differs, the change is refused (Proposed). | LOG-013, LOG-017 | REQ-MPC-FR-167; Proposed (fee rule) |
| BR-LOG-111 | Holding charge: free days start at Shipment.ReadyForPickupDateUtc; after them a daily charge accrues until collection, return or waiver; free days and daily charge are settings per client or outlet (values not stated); waivers need a reason. | LOG-017 | REQ-MPC-FR-167 |
| BR-LOG-120 | LOG-018 KPIs are computed from the active RPT-002 KPI catalogue definitions (BR-RPT-010), so LOG-018 and RPT-010 show the same figures. Definitions proposed by LOG for the catalogue: on-time rate = shipments delivered on or before the promised latest date ÷ shipments delivered in the period; delivery success rate = shipments delivered or collected ÷ shipments that ended delivered, collected, returned to sender or lost in the period; average transit time = mean of DeliveryDateUtc − ShippedDateUtc. | LOG-018 | REQ-MPC-FR-196; Proposed |
| BR-LOG-130 | Logistics tasks and seller pickups follow SM-LOG-04 and SM-LOG-10; a task is completed only by its matching scan or confirmation. | LOG-011, LOG-022 | REQ-MPC-FR-176; REQ-MPC-FR-177; Proposed |
| BR-LOG-140 | Address coordinates are stored in a plugin table keyed by AddressId with source (pin, provider, manual) and validation result; the native Address table is not changed. | LOG-015 | FIT (Address has no coordinates) |
| BR-LOG-150 | An international postal shipment cannot be dispatched while its customs declaration is not Accepted, where CDS is integrated (Proposed). | LOG-016 | Proposed |
| BR-LOG-170 | Operational stages for ADM-007 (Proposed; stage definitions not stated, MG-06): awaiting pickup = a SellerPickup Scheduled or Missed, or a FulfilmentTask of a merchant-fulfilled line Allocated and not handed over; awaiting sorting = a LogisticsTask of type sort Created or Scheduled, or the last TRK-002 event ARRIVED_HUB; awaiting dispatch = a FulfilmentTask Packed or Staged, or a native shipment with no ShippedDateUtc; out for last-mile delivery = a RouteListItem OutForDelivery or the last TRK-002 event OUT_FOR_DELIVERY and no DeliveryDateUtc. A shipment with ReadyForPickupDateUtc or DeliveryDateUtc set is in none of these stages. The first matching stage in this order applies. The stage per order is ORD BR-ORD-015; ADM-007 shows both (AC-ADM-007-02-01). | LOG-011 | see ADM-007 (REQ-MPC-FR-162); Proposed |
| BR-LOG-180 | Every LOG setting key is listed in the LOG plugin key catalogue (key, type, layer, secret flag, default); every carrier, geocoding, postal and printer credential is flagged secret, so packs refuse it and exports omit it (BR-PLT-013). LOG pages, widgets and scheduled tasks check the feature state through IC-PLT-02 (productfeature.<prd-id>, per store) before they show or run. LOG sends no message itself: its notifications are sent by TRK-005 through IC-TRK-04 SendEvent with event codes LOG registers at installation through IC-TRK-04 RegisterEventCode (Proposed names: Log.SellerPickupScheduled, Log.DropOffAccepted, Log.ExceptionEscalated, Log.CodDiscrepancy, Log.StaffAlert); shipment messages to buyers are TRK-012 templates; TRK-006 opt-outs apply (decision MSG-ROUTE). | All LOG features | CFG-01; NFR-X-008; MSG-ROUTE; BR-TRK-023 |
| BR-LOG-190 | Workflow steps (ADM-002) and other modules act on fulfilment only through the LOG fulfilment service (IC-LOG-07), which applies the LOG state models and BR-LOG-001; they never change order, shipment or task state directly. Workflow starts are queued requests raised from native events; consumers only enqueue. | LOG-008, LOG-009, LOG-010 | see ADM-002 (REQ-KTDA-WF-005); FIT (EventPublisher swallows consumer exceptions) |
| BR-LOG-160 | Native admin shipment actions are intercepted by a global IAsyncActionFilter registered by the LOG plugin on Admin OrderController: SetAsDelivered and SetAsDeliveredSelected (BR-LOG-080), EditShippedDate, EditDeliveryDate and EditReadyForPickupDate (reason, correction event, audit — the native actions change the date without raising an event), SetTrackingNumber and AddShipment [POST] (S10 validation), DeleteShipment (refused while a carrier booking is active) and AddressEdit [POST] (refused while a carrier booking is active). A ModelReceivedEvent veto is not used: these actions do not check ModelState before saving. The filter is listed in the ADM extension register (BR-ADM-005); AddShipment [POST] also carries the ORD-010 shipment-guard host filter and the INV filter, each with its own check. | LOG-010, LOG-012, LOG-017, LOG-020 | FIT (OrderController actions); OVR-REG |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-LOG-01 | FulfilmentTask | (none) | order line allocated (LOG-008) | — | Allocated | task in the queue of the fulfilling party |
| SM-LOG-01 | FulfilmentTask | Allocated | pick started | — | Picking | — |
| SM-LOG-01 | FulfilmentTask | Picking | all lines picked | — | Picked | — |
| SM-LOG-01 | FulfilmentTask | Picked | pack confirmed | BR-LOG-070 items match | Packed | package record |
| SM-LOG-01 | FulfilmentTask | Packed | moved to staging (MPC fulfilment) | — | Staged | staging location recorded |
| SM-LOG-01 | FulfilmentTask | Packed / Staged | dispatch confirmed | carrier or route assigned; tracking reference; customs Accepted where required (BR-LOG-150) | Dispatched | ShipAsync (delivery) or ReadyForPickupAsync on arrival at outlet (pickup) |
| SM-LOG-01 | FulfilmentTask | Allocated / Picking / Picked / Packed / Staged | order cancelled or line reallocated | — | Cancelled | picked stock returned to location |
| SM-LOG-02 | CarrierBooking | (none) | booking requested (shipment, or RET return shipment through BookReturn) | one active booking per shipment or return shipment (BR-LOG-041) | Requested | — |
| SM-LOG-02 | CarrierBooking | Requested | carrier confirms | — | Booked | waybill set as tracking number |
| SM-LOG-02 | CarrierBooking | Requested | carrier rejects or times out after retries | — | Failed | staff alerted; manual path |
| SM-LOG-02 | CarrierBooking | Booked | label received | — | LabelIssued | label stored (LOG-007) |
| SM-LOG-02 | CarrierBooking | Booked / LabelIssued | cancel (reassignment, address change, order cancelled) | carrier supports Cancel, else manual confirmation | Cancelled | AUD-LOG-003 |
| SM-LOG-03 | DeliveryException | (none) | failed attempt or incident recorded | — | Open | TRK-002 event; TRK-012 notice |
| SM-LOG-03 | DeliveryException | Open | redelivery scheduled or address correction submitted | attempts < maximum | InProgress | redelivery task |
| SM-LOG-03 | DeliveryException | Open / InProgress | threshold passed or long-stuck flag (TRK-002) | — | Escalated | escalation contact notified (AUD-LOG-006) |
| SM-LOG-03 | DeliveryException | Open / InProgress / Escalated | outcome recorded (redelivered, returned to sender, lost, damaged) | — | Resolved | outcome audited; DeliveryOutcomeRecorded published for returned, lost or damaged (IC-LOG-05) |
| SM-LOG-04 | LogisticsTask | (none) | shipment leg released (LOG-011), or onward return task requested by RET-003 | — | Created | — |
| SM-LOG-04 | LogisticsTask | Created | scheduled with date and resource | — | Scheduled | — |
| SM-LOG-04 | LogisticsTask | Scheduled | matching scan or confirmation | — | Completed | next task due |
| SM-LOG-04 | LogisticsTask | Scheduled | not done (reason) | — | Failed | rescheduling or exception |
| SM-LOG-04 | LogisticsTask | Created / Scheduled | order cancelled | — | Cancelled | — |
| SM-LOG-05 | CodRemittance | (none) | COD delivery confirmed with collected amount | — | Expected | amount added to the run |
| SM-LOG-05 | CodRemittance | Expected | cashier records remitted amount | remitted = expected | Reconciled | locked |
| SM-LOG-05 | CodRemittance | Expected | cashier records remitted amount | remitted ≠ expected | Discrepancy | finance alerted |
| SM-LOG-05 | CodRemittance | Discrepancy | finance resolves with note | — | Resolved | locked; AUD-LOG-007 |
| SM-LOG-06 | CustomsDeclaration | (none) | international postal shipment created | — | Draft | — |
| SM-LOG-06 | CustomsDeclaration | Draft | submitted to CDS | declaration complete | Submitted | — |
| SM-LOG-06 | CustomsDeclaration | Submitted | CDS response | — | Accepted / Rejected | AUD-LOG-013; rejected returns to Draft for correction |
| SM-LOG-06 | CustomsDeclaration | Rejected | corrected by staff | — | Draft | — |
| SM-LOG-07 | OutletAvailability | Open | closure period starts or capacity flag set | — | TemporarilyClosed / Full | outlet not offered (BR-LOG-020); AUD-LOG-011 |
| SM-LOG-07 | OutletAvailability | TemporarilyClosed / Full | closure period ends or flag cleared | — | Open | outlet offered again |
| SM-LOG-08 | OutletParcel | (none) | ReadyForPickupAsync called | — | AwaitingCollection | free period starts |
| SM-LOG-08 | OutletParcel | AwaitingCollection | free days pass | — | Chargeable | daily charge accrues (BR-LOG-111) |
| SM-LOG-08 | OutletParcel | AwaitingCollection / Chargeable | code verified (IC-CHK-09 Valid) and parcel handed over | charge recorded paid or waived | Collected | DeliverAsync; IC-CHK-09 MarkUsed; accrual stops |
| SM-LOG-08 | OutletParcel | AwaitingCollection / Chargeable | pickup deadline passes | — | Uncollected | TRK-012 escalation notice |
| SM-LOG-08 | OutletParcel | Uncollected | return delay passes or staff decide | — | Returned | LOG-013 return to sender |
| SM-LOG-08 | OutletParcel | Uncollected | code verified (IC-CHK-09 Valid) and parcel handed over | charge recorded paid or waived | Collected | DeliverAsync; IC-CHK-09 MarkUsed |
| SM-LOG-09 | RouteListItem | (none) | added to a courier route list | — | Assigned | — |
| SM-LOG-09 | RouteListItem | Assigned | courier starts the round | — | OutForDelivery | TRK-002 out-for-delivery event |
| SM-LOG-09 | RouteListItem | OutForDelivery | delivered with accepted proof | BR-LOG-080 | Delivered | DeliverAsync |
| SM-LOG-09 | RouteListItem | OutForDelivery | attempt failed with reason | — | Failed | LOG-013 exception |
| SM-LOG-10 | SellerPickup | (none) | pickup requested or scheduled by operations | — | Scheduled | seller notified |
| SM-LOG-10 | SellerPickup | Scheduled | parcels collected and scanned | — | Collected | TRK-002 pickup events; AUD-LOG-012 |
| SM-LOG-10 | SellerPickup | Scheduled | nothing collected (reason) | — | Missed | can be rescheduled |
| SM-LOG-10 | SellerPickup | Missed | rescheduled | — | Scheduled | — |
| SM-LOG-10 | SellerPickup | Scheduled / Missed | cancelled | — | Cancelled | — |
| SM-LOG-11 | AddressChangeRequest | (none) | buyer submits a change | — | Submitted | — |
| SM-LOG-11 | AddressChangeRequest | Submitted | checks pass (BR-LOG-110) | — | Applied | order address copy updated; AUD-LOG-008 |
| SM-LOG-11 | AddressChangeRequest | Submitted | a check fails | — | Refused | message shown |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| DeliveryFeeTable / DeliveryFeeComponent (new) | Table: Id, ShippingMethodId (service level), Basis (zone / distance), Version, EffectiveFromUtc, ExternalKey (INT-010 tariff sync, optional), StoreId; Component: Type (base, weight band, distance band, zone, location type, pickup, delivery), From, To, Amount or Rate | LOG-002 | Used by the LOG fee engine (custom IShippingRateComputationMethod) |
| OrderDeliveryQuote (new) | OrderId, ShippingMethodId, Components (JSON), FeeTableVersion, PromisedEarliest, PromisedLatest, OriginWarehouseId | LOG-002, LOG-005 | Native Order keeps ShippingMethod name, ShippingRateComputationMethodSystemName and OrderShippingInclTax/ExclTax |
| PartnerShareRule / ShipmentPartnerShare (new) | Rule: PartnerId, ShippingMethodId, Basis (fixed / %), Value, Version, EffectiveFromUtc; Share: ShipmentId, PartnerAmount, ClientAmount, RuleVersion | LOG-002 | — |
| ProductDeliveryOption (new) | ProductId, AllowedShippingMethodIds, AllowedStorePickupPointIds | LOG-004 | Proposed; used for e-Government services with a physical output (EGV-004) |
| ServiceArea (new) | Id, CountryId, StateProvinceId, County (district), PostalCodePattern, LocationType (rural / urban), AllowedShippingMethodIds, ServingStorePickupPointIds, StoreId | LOG-004, LOG-002 | Native Country / StateProvince reused; ShippingMethodCountryMapping still applies |
| SellerCoverage (new) | VendorId, ServiceAreaId or County list | LOG-004 | Native Vendor not changed |
| DeliveryStandard (new) | OriginId, ServiceAreaId, ShippingMethodId, TransitMin, TransitMax, DepartureWeekdays | LOG-005 | Cut-off, handling time and calendar are ORD-011 ServiceLevel; native DeliveryDate and TransitDays remain as fallback |
| DeliveryWindowCache (new) | ProductId, District (or store default), StoreId, Earliest, Latest, ComputedOnUtc | LOG-005 | Read by SRC-018 and SRC-004 through IC-LOG-06 |
| OutletExtension / OutletClosure (new) | StorePickupPointId, IsFull, AcceptsReturns, FreeStorageDays, DailyCharge, NetworkPrinterAddress; Closure: StorePickupPointId, FromUtc, ToUtc (empty = open-ended, for example removed at source), Reason | LOG-003, LOG-017, LOG-007 | Outlet = native StorePickupPoint (bundled Pickup.PickupInStore); no duplicate outlet table; pickup deadline is ORD-011 ServiceLevel.PickupDeadline |
| PickupPointWarehouse (new) | StorePickupPointId, WarehouseId | LOG-003 | Owned by LOG; read by SRC-004 and SRC-018; warehouse code and coordinates are INV WarehouseExtension (BR-INV-010) |
| OrderOutlet (new) | OrderId, StorePickupPointId | LOG-003, LOG-017 | Native Order stores only PickupAddressId (address copy) |
| FulfilmentTask / Package (new) | Task: Id, OrderId, OrderItemIds, Model, PartyId, WarehouseId, Status (SM-LOG-01), StagingLocation; Package: TaskId, ShipmentId, Items, Weight | LOG-008, LOG-009 | Linked to native Shipment / ShipmentItem |
| ProductShelfLocation (new) | ProductId, WarehouseId, Zone, Aisle, Rack, Shelf, Bin | LOG-009 | — |
| DispatchManifest (new) | Id, OperatorId, Date, ShipmentIds, Totals | LOG-009 | — |
| Carrier / CarrierRule / CarrierBooking (new) | Carrier: SystemName, Capabilities, ServiceLevels, CredentialsRef (encrypted), IsColdChain, HazardClasses; Rule: Priority, conditions (BR-LOG-040), CarrierId, RateShopping; Booking: ShipmentId or ReturnShipmentId (RET), CarrierId, Reference, IdempotencyKey, Status (SM-LOG-02), Quotes, LabelDownloadId | LOG-021, LOG-006, LOG-019, LOG-025 to LOG-031 | Native Shipment.TrackingNumber holds the primary reference |
| ShipmentReference (new) | ShipmentId, Type (S10, carrier waybill, partner, bill of lading), Value (unique per type) | LOG-020, LOG-021 | — |
| S10Series (new) | ServiceIndicator, CountryCode, RangeFrom, RangeTo, NextSerial | LOG-020 | Postal pack settings |
| ProofOfDelivery (new) | Id, ShipmentId, OrderId, Method, CapturedOnUtc, ReceivedOnUtc, Latitude, Longitude, RecipientName, CollectedCodAmount, CapturedBy, DeviceId, MediaDownloadIds | LOG-012, LOG-032, LOG-014 | Media also attached as native OrderNote with DownloadId |
| ServiceLevelProofMethod (new) | ShippingMethodId, Methods | LOG-012 | — |
| DeliveryException (new) | Id, ShipmentId, Type, ReasonCode, Attempts, Status (SM-LOG-03), Action, Outcome, Evidence | LOG-013 | — |
| CodRemittance (new) | Id, CourierId or PartnerId, RunId or Date, Expected, Remitted, Status (SM-LOG-05), Note | LOG-014 | — |
| AddressGeo (new) | AddressId, Latitude, Longitude, Source, ValidationResult, DigitalPostcode | LOG-015 | Native Address unchanged |
| CustomsDeclaration (new) | Id, ShipmentId, Lines, Status (SM-LOG-06), CdsReference, Response | LOG-016 | Fields per CDS specification (not stated) |
| OutletParcel / AddressChangeRequest (new) | Parcel: ShipmentId, StorePickupPointId, Status (SM-LOG-08), ChargeAccrued, ChargeStatus (paid / waived), ChargeReceiptReference, ChargeWaivedBy; Request: OrderId, NewAddress, Status (SM-LOG-11) | LOG-017 | — |
| LogisticsTask / SellerPickup / RouteList / RouteListItem (new) | Task: ShipmentId or ReturnShipmentId (onward return task), Type, Status (SM-LOG-04); Pickup: VendorId, SellerLocationId (SEL-018), Window, Status (SM-LOG-10); List: CourierId, Date; Item: ShipmentId, Sequence, Status (SM-LOG-09), ReasonCode | LOG-011, LOG-022, LOG-024 | — |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Shipping methods, rates, delivery dates | ShippingMethod, rate tables, DeliveryDate | client → store | LOG-001 / LOG-002 | Core |
| Carrier adapter selection | Carrier adapter config (new) | country → client | LOG-021 | Core |
| Pickup points and outlets | StorePickupPoint (bundled Pickup.PickupInStore plugin) + outlet extensions such as capacity and closures (new) | client | LOG-003 | Core |
| Postal pack settings | S10 series, hubs, routes, holding charges | vertical (Postal pack) → client | LOG-020 / LOG-023 / LOG-017 | Postal and logistics pack |
| Countries, states/provinces, districts (Kenya counties, Malawi districts) | Country, StateProvince; addresssettings.countyenabled / .countyrequired (free-text County); district list (new) only if a controlled list is required | global → country → client | CHK-007 / LOG-002 / PAY-020 | Core |
| Serviceability rules | Coverage areas per outlet/seller (new) | client | LOG-004 | Core |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Shipping methods (service levels) | ShippingMethod + ShippingMethodCountryMapping (native) | client → store | Not stated (KG-13) | Standard, express, pickup (FR-184); prices and SLAs not stated |
| Active rate methods and pickup providers | ShippingSettings.ActiveShippingRateComputationMethodSystemNames, ActivePickupPointProviderSystemNames, AllowPickupInStore (native) | client → store | Not stated | LOG fee engine; LOG outlet provider (Proposed) |
| Pickup map | ShippingSettings.DisplayPickupPointsOnMap, GoogleMapsApiKey (native) | client | — | Not stated |
| Free delivery threshold | ShippingSettings.FreeShippingOverXEnabled, FreeShippingOverXValue, FreeShippingOverXIncludingTax (native) | client → store | Not stated | Not stated |
| Origin from warehouse | ShippingSettings.UseWarehouseLocation, ShippingOriginAddressId (native) | client | Not stated | Not stated |
| Fee tables and versions | DeliveryFeeTable (new) | country → client | Dynamic charges (LOG-001); rules not stated (KG-13) | Weight, distance, service level, pickup vs delivery, rural/urban (FR-105, FR-304); values not stated |
| Partner revenue share | PartnerShareRule (new) | client | — | Where applicable (FR-198); values not stated |
| Coverage areas, location type, outlets per area | ServiceArea (new) | client | Not stated | Required (FR-197); rural/urban source not stated |
| Seller coverage | SellerCoverage (new) | client | — (seller model KG-01) | Deliverable districts (FR-069) |
| Delivery standards and transport-link days | DeliveryStandard (new); cut-offs, handling times and working calendar in ORD-011 ServiceLevel | client | Not stated | Required (FR-182); values not stated |
| Delivery-window precompute interval | LOG settings (new) | client | — | Not stated |
| Outlet capacity flag, accepts-returns flag, closures, free storage days, daily charge; outlet-warehouse links | OutletExtension, OutletClosure, PickupPointWarehouse (new); Postal pack settings; pickup deadline in ORD-011 | vertical (Postal pack) → client | — | Required (FR-188, FR-167, FR-311); values not stated |
| Allowed service levels and outlets per product | ProductDeliveryOption (new) | client | — | e-Government services with a physical output (EGV-004); values not stated |
| Carrier adapters, assignment rules, rate shopping | Carrier, CarrierRule (new) | country → client | DHL, FedEx, G4S, Skynet, Wells Fargo, Aramex, shipping lines (LOG-003); APIs F-3 | Partners not named (FR-180) |
| Carrier and provider credentials | Adapter settings, encrypted, flagged secret in the LOG key catalogue (BR-LOG-180, BR-PLT-013) | client instance only | Entered at deployment | Entered at deployment |
| Label templates, barcode symbology, network printers | LOG settings (new) | client | Not stated | Configured templates (FR-157); scanner spec not stated (MG-06) |
| S10 series | S10Series (Postal pack) | vertical (Postal pack) → client | — | Indicators and ranges not stated |
| Proof methods per service level | ServiceLevelProofMethod (new) | client | Not stated | Signature, OTP, QR per level (FR-195) |
| Reason codes, maximum attempts, escalation thresholds and contacts | LOG settings (new) | client | Not stated | Reason codes from FR-207 and FR-186; numbers not stated |
| Address change window and rules | LOG settings (new) | client | — | Configurable (FR-167); values not stated |
| Geocoding / validation provider; digital postcode system | Adapter settings (new) | country → client | — | "Where available" / "if adopted" (FR-185, FR-200) |
| CDS, IPS, GMS endpoints | Integration plugin settings (new) | country | — | Specifications not stated (MG-09) |
| Fulfilment model default; allow splits across warehouses | LOG settings (new) + SEL-018 opt-in | client | Not stated | Merchant / MPC / third-party (FR-161) |
| Tracking poll interval per carrier; carrier call timeouts | Adapter settings (new) | client | Not stated | Not stated |
| Upload contexts "proof-of-delivery media", "delivery exception evidence", "carrier label" (allowed types, size, scan) | ADM-008 UploadPolicySettings per context (owner ADM-008, BR-LOG-082) | global → client | Not stated | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Delivery step: methods, fees with breakdown, expected range; pickup point list and map with closures and full flags | LOG-001 to LOG-005 | Native checkout step extended |
| Storefront — My account | Order: change address or instructions before dispatch; holding charge due; reschedule a failed delivery | LOG-013, LOG-017 | New |
| Seller portal | Delivery coverage districts; batch pick and packing lists; labels; drop-off list | LOG-004, LOG-007, LOG-009, LOG-022 | New |
| Admin — configuration | Fee tables; coverage areas; delivery standards; outlet extensions and closures; carriers and assignment rules; label templates and printers; proof methods; S10 series; postal-pack settings | LOG-002 to LOG-005, LOG-007, LOG-012, LOG-017, LOG-020, LOG-021 | New (Configuration.ManageShippingSettings) |
| Admin — fulfilment | Allocation queue; pick lists; pack confirmation; staging; dispatch; manifests; carrier booking and labels | LOG-007 to LOG-009, LOG-021 | New |
| Admin — shipments | Native shipment pages with LOG filters (BR-LOG-160), proof-of-delivery panel, references | LOG-010, LOG-012, LOG-020 | Native, extended by widget zone admin_order_shipment_details_buttons |
| Admin — operations | Delivery exceptions and incidents; COD remittances; logistics tasks and seller pickups; drop-off acceptance; route lists; customs declarations | LOG-011, LOG-013, LOG-014, LOG-016, LOG-022, LOG-024 | New |
| Admin — reports | Logistics KPI dashboard | LOG-018 | New (or external BI, PAID-STUB) |
| Outlet counter | Code check and hand-over; holding charge; drop-off acceptance | LOG-012, LOG-017, LOG-022 | New (with PAY-034 outlet pages) |
| Courier (mobile page or external app) | Route list, attempts, proof of delivery | LOG-024, LOG-032 | New page / external app |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Log.NoDeliveryAvailable | Delivery is not available to this address. Please choose another address or a pickup point. | AC-LOG-001-01-04, AC-LOG-004-03-03 |
| Log.SellerAreaNotCovered | Some items cannot be delivered to this address by their seller: {0}. | AC-LOG-004-02-01 |
| Log.OutletClosed | This pickup point is temporarily closed. | AC-LOG-003-02-01 |
| Log.OutletFull | This pickup point cannot accept more parcels at the moment. | AC-LOG-003-02-02 |
| Log.FeeBreakdown | Delivery fee breakdown | AC-LOG-002-02-01 |
| Log.EdtRange | Expected delivery: {0} to {1} | AC-LOG-005-01-03 |
| Log.EdtUnavailable | The expected delivery date is not available. | AC-LOG-005-01-04 |
| Log.PackMismatch | The packed items do not match the order. Check the items before sealing. | AC-LOG-009-02-01 |
| Log.DateEditReasonRequired | Enter a reason for changing this date. | AC-LOG-010-01-03 |
| Log.PodRequired | This shipment needs proof of delivery before it can be marked as delivered. | AC-LOG-012-02-01, AC-LOG-012-02-02 |
| Log.CodeInvalid | The code does not match. Please check it and try again. | AC-LOG-012-02-04 |
| Log.CustomsNotAccepted | The customs declaration must be accepted before this parcel is dispatched. | AC-LOG-016-01-03 |
| Log.AddressChangeNotAllowed | The delivery address can no longer be changed for this order. | AC-LOG-017-01-02 |
| Log.AddressChangeFeeDiffers | This change would change the delivery fee. Please contact us to make it. | AC-LOG-017-01-03 |
| Log.ShipmentLocked | This shipment has an active courier booking. Cancel the booking first. | AC-LOG-017-01-04; BR-LOG-160 |
| Log.HoldingCharge | Storage charge due at collection: {0} | AC-LOG-017-02-01 |
| Log.S10Invalid | The tracking number is not a valid S10 identifier. | AC-LOG-020-02-01 |
| Log.UnknownParcel | This parcel is not expected for drop-off. | AC-LOG-022-02-02 |
| Log.SellerPickupScheduled | A collection of your parcels is booked for {0} between {1} and {2}. | Event code default text (BR-LOG-180; AC-LOG-011-02-01) |
| Log.DropOffAccepted | Your parcel {0} was accepted at {1} on {2}. | Event code default text (BR-LOG-180; AC-LOG-022-02-01) |
| Log.ExceptionEscalated | Delivery exception {0} for shipment {1} has been escalated: {2}. | Event code default text (BR-LOG-180; AC-LOG-013-03-02) |
| Log.CodDiscrepancy | Cash on delivery remittance {0} differs from the expected amount by {1}. | Event code default text (BR-LOG-180; AC-LOG-014-01-02) |
| Log.StaffAlert | Logistics alert: {0} | Event code default text (BR-LOG-180; §13 staff alerts) |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. The keys Log.SellerPickupScheduled, Log.DropOffAccepted, Log.ExceptionEscalated, Log.CodDiscrepancy and Log.StaffAlert are also the TRK-005 event codes that LOG registers through IC-TRK-04 RegisterEventCode; they hold the default text of the event (BR-LOG-180).


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Carrier connector (LOG-021) | GetRates, Book, GetLabel, Track, HandleCallback, Cancel (IC-LOG-01) | All carrier and partner adapters | See §12.2 |
| DHL (LOG-006) | Rates, booking, labels, tracking | DHL (licensed plugin candidate, VER-500) | nopCommerce 5.00 build to confirm with vendor |
| Couriers (LOG-025 to LOG-029) | As far as each carrier system allows | FedEx, G4S, Skynet, Wells Fargo (Kenya), Aramex | API availability unverified (F-3) |
| Shipping lines and agents (LOG-030) | Booking reference, milestones | Not named | F-3 |
| Malawi Post delivery partners (LOG-031) | Per partner | Not named (FR-180) | — |
| UPU CDS, IPS, GMS (LOG-016) | Customs declarations, international tracking events, monitoring data (IC-LOG-02) | UPU systems via Malawi Post | Specifications not stated (MG-09) |
| PostGlobal (INT-007) | Orders, shipments, tracking | Malawi Post PostGlobal | Owned by INT-007; FG-06 decides the split |
| Geocoding / address validation / digital postcode (LOG-015) | Validate, Geocode, ResolveDigitalPostcode (IC-LOG-03) | Provider not stated | — |
| Network label printers (LOG-007) | Send label in printer language | Client printers (Zebra-type) | Printer models not stated |
| Own-fleet app (LOG-032) | POD intake (IC-LOG-04) | External app (builder not stated) | FG-06, PAID-STUB |
| Postal sorting system (LOG-023) | Hand-over scan events into TRK-002 | Not named | External |
| Telemetry provider (LOG-019) | Temperature readings and alerts | Not stated | P3 |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-LOG-01 | GetRates | Origin, destination, packages (weight, dimensions), service levels, idempotency not needed | Quotes per service level (amount, currency, transit days) | Carrier unavailable, NotSupported, timeout | IShippingRateComputationMethod.GetShippingOptionsAsync / GetFixedRateAsync when used at checkout; framework call when used for rate shopping |
| IC-LOG-01 | Book | Shipment, packages, service level, sender, recipient, idempotency key (ShipmentId + attempt) | Booked / Failed, carrier reference (waybill) | Validation, rejected, NotSupported, timeout | New framework operation; waybill written through IShipmentService.UpdateShipmentAsync + ShipmentTrackingNumberSetEvent |
| IC-LOG-01 | GetLabel | Carrier reference, format (PDF, PNG, ZPL) | Label document | NotSupported (upload label) | New framework operation; stored as a Download linked to the shipment |
| IC-LOG-01 | Track | Carrier reference | Carrier events (code, time, location) | Unknown reference, NotSupported | IScheduleTask polling; events passed to TRK-002 ingestion (IC-TRK-01); IShipmentTracker returned to nopCommerce is the TRK-002 hub tracker |
| IC-LOG-01 | HandleCallback | Carrier payload on the adapter route | Verified events | Authentication failed (rejected, audited) | Plugin controller deriving from Microsoft.AspNetCore.Mvc.Controller (pattern: PayPalCommerceWebhookController) on its own route (IRouteProvider); passes to TRK-002 |
| IC-LOG-01 | Cancel | Carrier reference | Cancelled | Not cancellable, NotSupported | New framework operation |
| IC-LOG-01 | BookReturn | Return reference (RET ReturnShipment id), pickup address or drop-off outlet, destination (seller location, warehouse or outlet), parcels, idempotency key (ReturnShipmentId + attempt) | Booked / Failed, booking reference, tracking reference, label if supplied | NotSupported (no reverse-booking capability), no slot, rejected | New framework operation called by RET-003 (implements IC-RET-03); the booking is linked to the ReturnShipment, not to a native Shipment; RET-003 registers the returned tracking reference with TRK-002 (IC-TRK-01 RegisterExternalReference), so tracking events go to TRK-002 against the return reference |
| IC-LOG-02 | SubmitCustomsDeclaration / ReceiveResponse (CDS) | Declaration | Accepted / Rejected, reasons | Specification not stated | Integration plugin; transport and format per CDS specification (not stated) |
| IC-LOG-02 | ReceiveEvents (IPS) / ExchangeData (GMS) | Item identifier (S10), events or monitoring data | Events into TRK-002; exchange log | Specification not stated | Integration plugin; IPS events mapped to the TRK-002 dictionary |
| IC-LOG-03 | Validate / Geocode / ResolveDigitalPostcode | Address fields | Validity, suggestion, coordinates, digital postcode | Not found, provider unavailable (address saved unvalidated) | Address saved through native forms; result stored in plugin table (BR-LOG-140) |
| IC-LOG-05 | Module events (published) | DeliveryOutcomeRecorded: OrderId, ShipmentId, Outcome (Lost, Damaged, ReturnedToSender); ProofOfDeliveryRecorded: OrderId, ShipmentId, RecordId | — | — | Plugin event classes published with IEventPublisher after the save; consumers (RET-007) only enqueue |
| IC-LOG-06 | Delivery data for other modules | GetDeliveryEstimate (shipping option or pickup point, address, cart, time); GetOutlets (store, area, item list, date, returns filter); IsServiceable (item, area or address, service level); GetDeliveryWindow (product, district or store default) | Earliest and latest date or none; outlets with availability; true or false with reason; stored window | No estimate, unknown area | LOG service registered by the LOG plugin; implements IC-CHK-03 for CHK-014; used by CHK-005, CHK-011, SRC-004, SRC-018, SVC-006, RET-003; GetDeliveryWindow reads DeliveryWindowCache only |
| IC-LOG-07 | Fulfilment service | Allocate, StartPick, ConfirmPick, ConfirmPack, Stage, Dispatch, MarkReadyAtOutlet (task, data, acting user); GetOperationalStage (shipment) | Result with new state, or refusal with message key; stage of BR-LOG-170 | Transition not allowed (SM-LOG-01), guard refusal (BR-LOG-003) | LOG service; called by LOG screens, ADM-002 workflow steps and ADM-007; applies BR-LOG-001, BR-LOG-003 and BR-LOG-070 |
| IC-LOG-04 | SubmitProofOfDelivery | Device id, courier id, shipment reference, capture time, coordinates, method, recipient name, media | Accepted / Rejected | Unknown device or shipment, duplicate | Authenticated plugin API endpoint (device register of TRK-003); media checked through IC-ADM-08 CheckUpload (BR-LOG-082); creates LOG-012 record and calls DeliverAsync once |

Each carrier adapter declares a capability flag per IC-LOG-01 operation, its service levels, label formats, timeouts and retry policy (settings, defaults not stated), and its carrier-code → TRK-002 event mapping. Adapters that are rate methods return the TRK-002 hub tracker from GetShipmentTrackerAsync. C# signatures are produced at build start and approved by the tech lead. CDS, IPS and GMS specifications are not stated in source (MG-09). LOG overrides no nopCommerce service (OVR-REG): it relies on IShipmentService (ORD-010, guard providers IC-ORD-11), IOrderProcessingService (CHK-003) and IPdfService (DOC-001) as hosted by their owners, and registers only the BR-LOG-160 action filter. LOG calls IC-CHK-09 (pickup codes), IC-INV-05 and IC-INV-07 (warehouse location, lot and serial capture), IC-ADM-08 (upload contexts), IC-TRK-01 and IC-TRK-04 (tracking events, notifications), and implements an IC-SEC-05 download-access rule provider (BR-LOG-082).

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Shipment.Created | ShipmentCreatedEvent (published after insert; notification only) | TRK-002 records a created event; label job may be enqueued |
| Shipment.TrackingNumberSet | ShipmentTrackingNumberSetEvent | TRK-002 links the reference (validation is done before by the BR-LOG-160 filter) |
| Shipment.Dispatched | ShipmentSentEvent (raised by ShipAsync; native ShipmentSent template sent through the TRK-005 engine) | TRK-002, TRK-012, PAY-007 escrow release job, LOG-018 |
| Shipment.ReadyForPickup | ShipmentReadyForPickupEvent (raised by ReadyForPickupAsync) | LOG-017 holding period starts (job enqueued), TRK-012 |
| Shipment.Delivered | ShipmentDeliveredEvent (raised by DeliverAsync) | PAY-007, LOG-018, TRK-012 |
| Order.Inserted (capture) | EntityInsertedEvent<Order> — SelectedShippingOption and SelectedPickupPoint generic attributes are reset by IShoppingCartService.ResetCheckoutDataAsync (moved from ICustomerService in 5.00) before OrderPlacedEvent | LOG enqueues capture of OrderDeliveryQuote, OrderOutlet and order address coordinates; a missing capture is listed in the logistics exceptions view |
| Delivery.OutcomeRecorded | DeliveryOutcomeRecorded (LOG module event, IC-LOG-05) | RET-007 consumer enqueues an OrderIssue case for Lost, Damaged, ReturnedToSender |
| Pod.Recorded | ProofOfDeliveryRecorded (LOG module event, IC-LOG-05) | RET-007 consumer enqueues the evidence link |
| Workflow start (KTDA WF-005, WF-007) | ShipmentCreatedEvent, ShipmentSentEvent, ShipmentDeliveredEvent, OrderPlacedEvent, OrderPaidEvent (native) | ADM-002 consumers enqueue start requests; steps call IC-LOG-07 (BR-LOG-190) |
| Delivery.AttemptFailed | None (LOG event) | LOG-013 exception, TRK-002 event, TRK-012 notification |
| Delivery.ExceptionEscalated | None (LOG event) | Escalation contact; buyer notice through TRK-005; ADM-009 queue |
| Carrier.Booked / Cancelled / Failed | None (LOG events) | Label, audit, staff alert |
| Cod.Discrepancy | None (LOG event) | Finance alert |
| Parcel.Uncollected | None (LOG scheduled task) | TRK-012 escalation; LOG-013 return to sender |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Carrier delivered event and admin Set as delivered at the same time | LOG-010, LOG-012 | Both run under ILocker key 'shipment-{ShipmentId}' (shared with TRK); the second re-reads DeliveryDateUtc and does not call DeliverAsync again (native would throw) |
| Two S10 requests on the same series | LOG-020 | ILocker key 'log-s10-{series}' plus a unique index on ShipmentReference (Type, Value); a duplicate insert fails and the request retries with the next serial |
| Booking retried after timeout | LOG-021 | Same idempotency key; one active booking per shipment (BR-LOG-041) checked under 'shipment-{ShipmentId}' |
| Buyer address change and dispatch confirmation at the same time | LOG-009, LOG-017 | Both take ILocker key 'log-order-{OrderId}'; whichever runs second re-reads: dispatch sees the new address, or the change sees the shipment dispatched and is refused |
| Two cashiers record the same remittance | LOG-014 | ILocker key 'log-cod-{RemittanceId}'; CodRemittance carries its own row version (plugin table) |
| Holding-charge task and collection at the same time | LOG-017 | 'shipment-{ShipmentId}' lock; the task re-reads the parcel status and stops accrual if Collected |
| Pickup hand-over at two counters at once | LOG-012 | Verify, POD record, DeliverAsync and MarkUsed run inside ILocker key 'shipment-{ShipmentId}' (BR-LOG-001; CHK runs IC-CHK-09 inside it). ILocker.PerformActionWithLockAsync does not wait (it returns false when the key is held), so the second counter is told to retry; on retry it re-reads and IC-CHK-09 answers Used |
| Carrier API timeout during checkout quotes | LOG-001, LOG-021 | The option is omitted after the configured timeout and the case logged; checkout continues with the other options (NFR-LOG-001) |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Seller pickup scheduled | Seller | Through TRK-005, event code Log.SellerPickupScheduled (channels per TRK-006) | LOG-011 |
| Drop-off accepted (receipt) | Seller | Through TRK-005, event code Log.DropOffAccepted | LOG-022 |
| Delivery attempt failed (with reason and rescheduling link) | Buyer | Through TRK-005 (template owned by TRK-012) | LOG-013 |
| Exception escalated | Escalation contact; buyer where configured | Through TRK-005, event code Log.ExceptionEscalated; admin notification | LOG-013 |
| Outlet closure affects placed orders | Logistics operations staff | Admin notification; email through TRK-005 (Log.StaffAlert) | LOG-003 |
| Holding charge accruing; pickup deadline passed | Buyer | Through TRK-005 (TRK-012 reminders) | LOG-017 |
| COD discrepancy | Finance staff | Admin notification; email through TRK-005 (Log.CodDiscrepancy) | LOG-014 |
| Carrier booking failed; S10 series exhausted; code entry locked | Logistics operations staff | Admin notification; email through TRK-005 (Log.StaffAlert) | LOG-012, LOG-020, LOG-021 |
| Out-of-range temperature (P3) | Logistics operations staff | Admin notification; email through TRK-005 (Log.StaffAlert) | LOG-019 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Logistics KPI dashboard (on-time, success rate, transit time) | LOG-018 | REQ-MPC-FR-196 |
| Daily dispatch manifest per transport operator | LOG-009 | REQ-MPC-FR-199 |
| Delivery exceptions and incidents by type and age | LOG-013 | REQ-MPC-FR-186 |
| COD remittances and discrepancies | LOG-014 | REQ-MPC-FR-194 |
| Partner revenue share per period | LOG-002 | REQ-MPC-FR-198 |
| Uncollected parcels and holding charges per outlet | LOG-017 | REQ-MPC-FR-167 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-LOG-001 | Shipment date corrected through a native admin edit | Staff | Shipment | field, old value, new value, reason |
| AUD-LOG-002 | Configuration change (fee table, coverage area, delivery standard, carrier rule, proof method, holding-charge rule) | Administrator | Rule entity | old values, new values, effective date |
| AUD-LOG-003 | Carrier booking created, cancelled or failed; callback rejected | Staff / system | CarrierBooking | carrier, reference, result, reason |
| AUD-LOG-004 | Allocation or partner assignment overridden | Staff | FulfilmentTask, Shipment | old party, new party, reason |
| AUD-LOG-005 | Proof of delivery stored; code verification failed | Staff / courier / system | ProofOfDelivery | method, time, actor, device, result |
| AUD-LOG-006 | Delivery exception action, escalation or resolution | Staff / system | DeliveryException | status, action, outcome |
| AUD-LOG-007 | COD remittance recorded or discrepancy resolved | Cashier / Finance staff | CodRemittance | expected, remitted, difference, note |
| AUD-LOG-008 | Delivery address or instructions changed after placement | Buyer / staff | Order address | old address, new address, request id |
| AUD-LOG-009 | Holding charge recorded paid or waived | Staff | OutletParcel | amount, paid or waived, receipt reference or reason |
| AUD-LOG-010 | S10 identifier assigned or entered manually | System / staff | ShipmentReference | series, serial, value |
| AUD-LOG-011 | Outlet closure or capacity flag changed | Staff | OutletExtension | old, new, period |
| AUD-LOG-012 | Drop-off accepted; seller pickup confirmed | Outlet staff / collector | SellerPickup, Shipment | parcels, time, location, staff |
| AUD-LOG-013 | Customs declaration submitted and result | Staff / system | CustomsDeclaration | status, CDS reference, reasons |

All audit events AUD-LOG-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new entity values are captured by the SEC IRepository<> decorator, so every LOG write goes through IRepository<> (no direct INopDataProvider writes). The native activity log is not used as audit. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-LOG-001 | Carrier, geocoding and postal calls have per-adapter timeouts and retry policies (settings, defaults not stated); a slow carrier never blocks checkout: its options are omitted after the timeout. | Proposed; NFR-X-009 | §12.4 last case; test note T-LOG-01 |
| NFR-LOG-002 | Carrier and provider credentials are stored encrypted per client instance, flagged secret in the LOG key catalogue and never exported in configuration packs (BR-LOG-180). | CFG-01; NFR-X-001 | Configuration-pack export test (T-LOG-07) |
| NFR-LOG-003 | Proof-of-delivery media, signatures and coordinates are personal data: shown only with Logistics.Core.ProofOfDelivery.View, kept per the PLT-020 retention rules, and captured with consent where a device location is used. | NFR-X-002; REQ-MPC-FR-187 | AC-LOG-012-01-03; AC-LOG-032-01-04 |
| NFR-LOG-004 | Printed labels are readable by the client's postal and courier scanners. | REQ-MPC-FR-183 | Test note T-LOG-04 (scanner specification not stated, MG-06) |
| NFR-LOG-005 | Response-time targets for fee, serviceability and delivery-date calculation at checkout: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |
| NFR-LOG-006 | All logistics configuration changes and manual interventions are audited (NFR-X-003). | REQ-MPC-FR-186; NFR-X-003 | §14.2 audit events |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-LOG-001 | P1 | — | |
| PRD-LOG-002 | P1 | — | |
| PRD-LOG-003 | P1 | — | |
| PRD-LOG-004 | P1 | — | PRD-SVC-006 |
| PRD-LOG-005 | P1 | — | PRD-CAT-031, PRD-SRC-018, PRD-CHK-014 |
| PRD-LOG-006 | P1 | PRD-LOG-021 | |
| PRD-LOG-007 | P1 | — | |
| PRD-LOG-008 | P1 | — | |
| PRD-LOG-009 | P1 | — | |
| PRD-LOG-010 | P1 | — | |
| PRD-LOG-011 | P1 | — | |
| PRD-LOG-012 | P1 | — | PRD-LOG-032 |
| PRD-LOG-013 | P1 | — | |
| PRD-LOG-014 | P1 | — | |
| PRD-LOG-015 | P1 | — | |
| PRD-LOG-016 | P1 | — | |
| PRD-LOG-017 | P1 | — | |
| PRD-LOG-018 | P1 | — | |
| PRD-LOG-019 | P3 | — | |
| PRD-LOG-020 | P1 | — | |
| PRD-LOG-021 | P1 | — | PRD-LOG-006, PRD-LOG-025, PRD-LOG-026, PRD-LOG-027, PRD-LOG-028, PRD-LOG-029, PRD-LOG-030, PRD-LOG-031 |
| PRD-LOG-022 | P1 | PRD-TRK-003 | |
| PRD-LOG-023 | P1 | PRD-TRK-003 | |
| PRD-LOG-024 | P1 | PRD-TRK-003 | |
| PRD-LOG-025 | P1 | PRD-LOG-021 | |
| PRD-LOG-026 | P1 | PRD-LOG-021 | |
| PRD-LOG-027 | P1 | PRD-LOG-021 | |
| PRD-LOG-028 | P1 | PRD-LOG-021 | |
| PRD-LOG-029 | P1 | PRD-LOG-021 | |
| PRD-LOG-030 | P1 | PRD-LOG-021 | |
| PRD-LOG-031 | P1 | PRD-LOG-021 | |
| PRD-LOG-032 | P1 | PRD-TRK-003, PRD-LOG-012 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-LOG-01 | Each carrier adapter is tested against the carrier sandbox where one exists: quote, booking, label, cancel, push and poll tracking, timeout and duplicate booking. |
| T-LOG-02 | Fee engine: a table-driven test of every component combination (service level, zone or distance band, weight band, rural or urban, pickup or delivery) with expected breakdown and total (BR-LOG-010). |
| T-LOG-03 | Delivery date: orders before and after cut-off, on non-working days and with link departure days (BR-LOG-030). |
| T-LOG-04 | Labels: print on each client printer and scan with each client scanner model; S10 check digits against published UPU S10 examples. |
| T-LOG-05 | Native admin interception: SetAsDelivered, SetAsDeliveredSelected, Edit*Date, SetTrackingNumber, AddShipment, DeleteShipment and AddressEdit with and without the LOG conditions (BR-LOG-160). |
| T-LOG-06 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-LOG-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1); configuration export contains no credentials; every LOG key is in the key catalogue (BR-LOG-180). |
| T-LOG-08 | Shipment creation from every LOG path with each IC-ORD-11 guard refusing (PAY, ORD-010, EGV-004) and with lot- and serial-tracked lines: nothing is saved on refusal; IC-INV-07 Capture runs before the insert, Confirm after the items are saved, Cancel on refusal (BR-LOG-003). |
| T-LOG-09 | Contracts for other modules: IC-LOG-06 answers equal the delivery-step results for the same inputs; IC-LOG-05 events are published once per outcome; ADM-007 stages follow BR-LOG-170. |
| T-LOG-10 | Pickup hand-over: IC-CHK-09 Valid, Invalid, Used and Locked; holding charge unpaid, paid and waived; DeliverAsync refused by an ORD-010 hold (code stays Sent); MarkUsed called only after DeliverAsync; uploads refused by IC-ADM-08 CheckUpload are not stored and POD media are refused on admin DownloadFile without Logistics.Core.ProofOfDelivery.View (BR-LOG-082). |
