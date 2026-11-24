# L2 Module PRD — INV: Inventory and warehouses

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | INV — Inventory and warehouses |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Keeps the stock count of every product, attribute combination and warehouse; shows customers whether an item is available; alerts staff and sellers when stock runs low; holds stock for shoppers and releases the stock of unpaid orders when the payment window for their payment method expires; records every stock change with a reason, an approval where needed and the document behind it (adjustment, goods receipt, transfer, count); tracks batches, expiry dates and serial numbers where a client needs them; keeps stock in step with the client's warehouse or ERP system; reports on stock health; and supplies stock-movement data to the RPT reports (decision ANL-002-OWN).

**In scope**

- Stock tracking per product and attribute combination, availability display, backorders, stock history (INV-001)
- Stock per warehouse with warehouse code and map coordinates (INV-002)
- Low-stock thresholds, alerts to the store owner and the seller, low-stock report (INV-003)
- Stock holds in cart and checkout, unpaid-order timeout, reminders and release by cancellation (INV-004; owner of the unpaid-order timeout for every payment method, decision INV-HOLD); the hold check is a cart rule provider to the CHK-003 IShoppingCartService override (OVR-REG)
- Stock adjustments with reason codes and approval; interception of native stock edits (INV-005)
- Goods receiving against purchase orders, discrepancies, inspection, bin location (INV-006)
- Warehouse transfers with in-transit stock, cycle counts (INV-007, INV-008; P2)
- Batch and lot tracking, serial numbers, expiry management with FEFO (INV-009 to INV-011; P2; side tables, a sellable-stock adjuster to the CAT-002 IProductService override (IC-CAT-04, OVR-REG) and the lot and serial capture for shipments (IC-INV-07))
- Stock and movement synchronisation with the client WMS / ERP on the INT-005 framework (INV-012)
- Inventory analytics: sell rate, days of cover, stock-outs, dead stock, ABC; stock-movement data for the RPT-001 reports (INV-013; decision ANL-002-OWN)

**Not in this module**

| Item | Where it is |
|---|---|
| Product master data, attributes and attribute combinations | CAT module |
| Payment transactions and payment status (INV-004 only reads them) | PAY module (PRD-PAY-011; BR-PAY-013 names INV-004 as owner of the unpaid-order timeout) |
| Shipment creation workflow, picking and packing, pickup points | LOG module — INV provides the lot and serial capture (IC-INV-07) that the INV AddShipment filter and every LOG shipment path call (BR-INV-070, BR-INV-080, BR-LOG-003) |
| Return requests and the decision to restock returned goods | RET module (PRD-RET-001); restocking posts through the INV adjustment service (IC-INV-01) |
| Back-in-stock subscriptions and price-drop alerts for shoppers | SRC module (PRD-SRC-011) |
| Hiding out-of-stock products from search results | SRC module (PRD-SRC-019) |
| General sales dashboards and sales performance | RPT module (PRD-RPT-001) |
| Fast and slow mover reports, stock-level reports and actual sales (REQ-KTDA-ANL-002) | RPT module (PRD-RPT-001), decision ANL-002-OWN (Proposed); INV-013 supplies stock-movement data (IC-INV-06) |
| The IProductService override (insert, update, sellable stock, search) and the IShoppingCartService override | CAT-002 and CHK-003 own them (decision OVR-REG); INV registers providers (IC-INV-04 as an IC-CAT-04 sellable-stock adjuster; IC-CHK-01 cart check and stock-warning replacer) and overrides neither service |
| Shelf location (zone, aisle, rack, shelf, bin) per product and warehouse | LOG module (LOG-009 ProductShelfLocation); INV-006 writes the location entered at receipt into it |
| Interception of stock changes on the native return-request edit page | RET module (BR-RET-001); restocking posts through IC-INV-01 |
| ERP / back-office connector framework and API gateway | INT module (PRD-INT-005, INT-001); INV-012 is the stock data flow over it |
| Purchase order creation and approval (procurement) | Not a feature of the product. Purchase orders come from the client ERP through INV-012 or are recorded in INV-006 (Proposed) |
| Platform audit trail store | SEC module (PRD-SEC-004) |
| Fractional stock quantities (for example 2.5 kg) | CAT-041, decision UOM-01; native stock is an integer |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-INV-001 | Stock tracking | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-INV-002 | Multi-warehouse stock | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-INV-003 | Low-stock thresholds and alerts | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-INV-004 | Stock reservation and hold | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-INV-005 | Stock adjustments with reason codes | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-INV-006 | Goods receiving | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-INV-007 | Warehouse transfers | Platform / back-office | P2 | Code-level | Custom plugin | Warehouse pack | | |
| PRD-INV-008 | Cycle counts | Platform / back-office | P2 | Code-level | Custom plugin | Warehouse pack | | |
| PRD-INV-009 | Batch and lot tracking | B2B + B2C | P2 | Code-level | Custom plugin (provider under OVR-REG) | Warehouse pack | PRD-CAT-002 | |
| PRD-INV-010 | Serial number tracking | B2B + B2C | P2 | Code-level | Custom plugin | Warehouse pack | | |
| PRD-INV-011 | Expiry management | B2B + B2C | P2 | Code-level | Custom plugin (provider under OVR-REG) | Warehouse pack | PRD-INV-009, PRD-CAT-002 | |
| PRD-INV-012 | WMS/ERP stock synchronisation | B2B + B2C | P1 | Code-level | External system + integration plugin | Warehouse pack | | PAID-STUB |
| PRD-INV-013 | Inventory analytics | B2B + B2C | P1 | Code-level | Custom plugin | Warehouse pack | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Sees availability; has stock held in cart or checkout; receives unpaid-order reminders | Guests / Registered (native) |
| Seller | Sets low-stock thresholds and alerts on own products; requests stock adjustments for own products; sees own low-stock report | Vendors (native) |
| Stock staff | Approves adjustments above the threshold; plans cycle counts; reviews holds and analytics | Role system name "Stock" (in BR-IAM-050) |
| Warehouse staff | Receives goods, transfers stock between warehouses, counts stock, records lots and serial numbers at receipt and shipment | Role system name "Warehouse" (in BR-IAM-050) |
| Quality staff | Records batch quality results and custody, releases, blocks and recalls batches | Role system name "Quality" (in BR-IAM-050) |
| Finance staff | Follows up flagged unpaid orders | Role system name "Finance" (in BR-IAM-050) |
| Support staff | Looks up serial numbers for warranty questions | Role system name "Support" (in BR-IAM-050); serial look-up needs Inventory.Core.Stock.View, which is not a Support default: the client grants it (Proposed) |
| Auditor | Reads stock history and adjustment records | Role system name "Auditor" (in BR-IAM-050) |
| Management and stock planners | Read inventory analytics | Role not named in BR-IAM-050 (not stated); default Administrators, Stock |
| Client administrator | Configures warehouses, hold windows, payment windows and actions per payment method, reason codes, thresholds, synchronisation | Administrators (native) |
| Client WMS / ERP (system) | Exchanges stock levels and movements; receives valuation and purchase triggers; sends purchase orders | External system via the INV-012 connector |
| Scheduled tasks (system) | Release expired holds, apply unpaid-order actions, expire lots, create due counts, synchronise, take the daily stock snapshot | IScheduleTask (native mechanism) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Catalog.ProductsCreateEditDelete (native) | Catalog | Edit product inventory settings (inventory method, thresholds, backorders, display, warehouses used). With INV installed, a direct change of a stock quantity through the native product pages is refused (BR-INV-030) | Administrators, Vendors (native default) |
| Reports.LowStock (native) | Reports | Low-stock report; a vendor sees own products only | Administrators, Vendors (native default) |
| Configuration.ManageShippingSettings (native) | Configuration | Create and edit warehouses, including the INV-002 code and coordinates | Administrators |
| Configuration.ManageSettings (native) | Configuration | INV settings: hold windows, payment windows and actions per payment method, reason codes, thresholds, analytics parameters | Administrators |
| Inventory.Core.Stock.View | Catalog | View stock by warehouse, stock history with reasons, holds, lots, serial numbers, transfers and counts | Administrators, Stock, Warehouse, Quality, Auditor; Vendors (own products only) |
| Inventory.Core.Adjustments.Request | Catalog | Request a stock adjustment with a reason code | Stock, Warehouse; Vendors (own products only) |
| Inventory.Core.Adjustments.Approve | Catalog | Approve or reject adjustments above the threshold (not own requests); run a product import that changes stock | Stock |
| Inventory.Core.Receiving.CreateEditDelete | Catalog | Record purchase orders (when not received from the ERP), goods receipts, discrepancies and bin locations | Warehouse |
| Inventory.Core.Transfers.CreateEditDelete | Catalog | Create, dispatch, receive and cancel warehouse transfers | Warehouse |
| Inventory.Core.Counts.CreateEditDelete | Catalog | Plan, enter and submit cycle counts | Stock (plan), Warehouse (count) |
| Inventory.Core.Lots.CreateEditDelete | Catalog | Create lots, record quality results and custody, release, block or recall a lot | Quality; Warehouse (create at receipt) |
| Inventory.Core.Serials.CreateEditDelete | Catalog | Record and correct serial numbers | Warehouse |
| Inventory.Core.UnpaidOrders.CreateEditDelete | Orders | View the unpaid-order list, dismiss a flag with a reason, release (cancel) a flagged unpaid order under BR-INV-020 | Administrators, Finance |
| Inventory.Core.Sync.CreateEditDelete | Configuration | Configure the WMS/ERP connector and resolve conflicts (failed outbound messages are replayed in the INT-004 message log with Integrations.Core.Messages.Replay) | Administrators |
| Inventory.Core.Analytics.View | Reports | Inventory analytics reports | Administrators, Stock |

Permissions are declared in an INV plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix and the 5.00 view / create-edit-delete split (unchanged from 4.90); Category is taken from the native set (Catalog, Orders, Reports, Configuration). Default roles are given by role system name. Every name INV uses (Finance, Auditor, Stock, Warehouse, Quality, Support) is in the product role catalogue BR-IAM-050, and the IAM plugin creates every missing catalogue role at install and at start (BR-IAM-050); INV does not rely on native start-up to create roles. Native permissions are reused where they exist: product inventory settings (Catalog.ProductsCreateEditDelete), low-stock report (Reports.LowStock), warehouses (Configuration.ManageShippingSettings), settings (Configuration.ManageSettings). Holding Catalog.ProductsCreateEditDelete alone must not allow a stock quantity change: the native product pages that change stock are intercepted by INV (BR-INV-030). Vendor rows are limited to the vendor's own products, as the native product pages are. All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-INV-PERM-01 | **Given** a user without Catalog.ProductsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-02 | **Given** a user without Reports.LowStock (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-03 | **Given** a user without Configuration.ManageShippingSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-04 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-05 | **Given** a user without Inventory.Core.Stock.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-06 | **Given** a user without Inventory.Core.Adjustments.Request, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-07 | **Given** a user without Inventory.Core.Adjustments.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-08 | **Given** a user without Inventory.Core.Receiving.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-09 | **Given** a user without Inventory.Core.Transfers.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-10 | **Given** a user without Inventory.Core.Counts.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-11 | **Given** a user without Inventory.Core.Lots.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-12 | **Given** a user without Inventory.Core.Serials.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-13 | **Given** a user without Inventory.Core.UnpaidOrders.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-14 | **Given** a user without Inventory.Core.Sync.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INV-PERM-15 | **Given** a user without Inventory.Core.Analytics.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-INV-001 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: ManageInventoryMethod (by product/by attributes), StockQuantity, DisplayStockAvailability/Quantity, BackorderMode, StockQuantityHistory. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-002 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Per-warehouse stock (ProductWarehouseInventory, Product.UseMultipleWarehouses) summed for availability; Warehouse has Name, AdminComment, AddressId only. | Warehouse/facility code and coordinates (PG CAT-09 is AFR — AFR port required). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-003 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Per-product/combination threshold (NotifyAdminForQuantityBelow, MinStockQuantity, LowStockActivity); store-owner AND (NEW vs 4.70.5) vendor email QuantityBelow.VendorNotification; low-stock report filtered to the vendor's own products; vendors edit thresholds on their products. \| 5.00.1: NEW 5.00: low-stock report line entity (Libraries/Nop.Core/Domain/Catalog/LowStockProductReportLine.cs) and export (Admin ReportController.ExportLowStockExcelAll / ExportLowStockXmlAll). | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-004 | NEW in 5.00: unpaid-order timeout. Libraries/Nop.Services/Orders/AutoCancelOrdersTask.cs cancels orders with PaymentStatus.Pending after OrderSettings.AutoCancelDelay (minutes), skipping OrderSettings.AutoCancelIgnoredPaymentMethods, optional AutoCancelRestoreShoppingCart; cancellation returns stock (OrderProcessingService.CancelOrderAsync l.2391: ReturnOrderStockAsync). Pending-order reminder emails (ReminderSettings.PendingOrdersEnabled; Libraries/Nop.Services/Reminders/ProcessPendingOrdersTask.cs; templates Reminders.PendingOrderFollowUp1/2) and abandoned-cart reminders (ProcessAbandonedCartsTask.cs; Reminders.AbandonedCartFollowUp1-3). Stock still decremented at order placement; ProductWarehouseInventory.ReservedQuantity for multi-warehouse. | Stock hold on add-to-cart and at checkout start (optional per client) still to build; reminders are email only (SMS reminders need custom work on ISmsService). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-005 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: StockQuantityHistory (QuantityAdjustment, Message, WarehouseId) written on admin edits. | Reason codes, approval thresholds. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-006 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (no purchase order entity). | Goods receipt against PO, discrepancies, bin location (PG CAT-03 shelf location is AFR). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-007 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Inter-warehouse transfers with in-transit state. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-008 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Scheduled cycle counts and variance correction. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-009 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (stock is a single integer per product/warehouse). | Lot/batch stock with dates, quality results, custody chain and lot allocation on orders: side tables + sellable-stock adjuster provider to the CAT-owned IProductService override (IC-CAT-04, decision OVR-REG) + order events. | Custom plugin (provider under OVR-REG) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-010 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Serial number capture per unit sold. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-011 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Expiry tracking, FEFO picking, near-expiry flags, auto-hide (depends on INV-009): side tables + sellable-stock adjuster provider to the CAT-owned IProductService override (IC-CAT-04, decision OVR-REG). | Custom plugin (provider under OVR-REG) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-012 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: No WMS/ERP connector in core; official Misc.Dynamics365 is a promo stub (separate download, Business Central) — relevant only if client ERP is D365. \| 5.00.1: Misc.Dynamics365 v5.00.3 is still a promo stub (Plugins/Nop.Plugin.Misc.Dynamics365/Views/Configure.cshtml links to nopcommerce.com). | Bi-directional stock/movement sync plugin per client ERP/WMS. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INV-013 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Low stock, bestsellers, never-purchased reports. \| 5.00.1: 5.00 adds Excel/XML export of low-stock, never-sold and bestseller reports (Admin ReportController); no sell-through/days-of-cover/ABC. | Sell-through, days of cover, dead stock, ABC analysis. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-INV-001 Stock tracking

| Item | Value |
|---|---|
| Description (baseline) | Keeps count of how many of each product (and each version of it) are in stock, shows customers whether it is available, optionally allows orders when out of stock, and keeps a history of stock changes. |
| Why it matters | Customers do not buy items that are not there, and staff know what to restock. |
| Who benefits | Shoppers; stock staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-001-01 | As a shopper, I want to see whether a product is in stock before I order, so that I do not order items that are not there. | D; REQ-KTDA-INV-002 | Ready |
| US-INV-001-02 | As a member of stock staff, I want the platform to keep the stock count of each product and each version of it (attribute combination) and to lower it when an order is placed, so that stock figures follow sales without manual work. | D; REQ-KTDA-INV-001; REQ-MPC-FR-055 | Ready |
| US-INV-001-03 | As a client administrator, I want to decide per product whether orders are allowed when stock runs out, so that we can sell items we restock quickly. | D | Ready |
| US-INV-001-04 | As a member of stock staff, I want a history of every stock change, so that I can explain every stock figure. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-001-02-01 | US-INV-001-02 | **Given** a product uses "manage stock" (ManageInventoryMethod ManageStock) in one warehouse with stock 10, **when** a shopper places an order for 3, **then** the stock becomes 7 and a stock history entry records -3, the new quantity 7 and the order number (native message Admin.StockQuantityHistory.Messages.PlaceOrder). | D; REQ-KTDA-INV-001; FIT (OrderProcessingService.cs:1340, ProductService.AdjustInventoryAsync) |
| AC-INV-001-02-02 | US-INV-001-02 | **Given** a product uses "manage stock by attributes" and one attribute combination has stock 5, **when** a shopper orders 2 of that combination, **then** the combination stock becomes 3 and the history entry carries the combination. | D; REQ-MPC-FR-055; FIT |
| AC-INV-001-02-03 | US-INV-001-02 | **Given** an order holding 3 units of a product is cancelled, **when** IOrderProcessingService.CancelOrderAsync runs, **then** the 3 units are returned to stock and the history entry uses the native message CancelOrder. | FIT (OrderProcessingService.cs:2391-2427) |
| AC-INV-001-02-04 | US-INV-001-02 | **Given** a seller manages a product of their own, **when** the seller changes its stock quantity, **then** the change is made through an INV-005 adjustment (BR-INV-030); the seller can open only their own products. | REQ-MPC-FR-055; FIT (vendor filter on admin product pages) |
| AC-INV-001-01-01 | US-INV-001-01 | **Given** DisplayStockAvailability and DisplayStockQuantity are on and the stock is 7, above MinStockQuantity, **when** the shopper opens the product page, **then** the page shows the native text Products.Availability.InStockWithQuantity with 7. | D; FIT (ProductService.FormatStockMessageAsync) |
| AC-INV-001-01-02 | US-INV-001-01 | **Given** the stock is at or below MinStockQuantity and LowStockActivity is Nothing, **when** the shopper opens the product page, **then** the page shows the native low-stock text (Products.Availability.LowStock or LowStockWithQuantity). | FIT |
| AC-INV-001-01-03 | US-INV-001-01 | **Given** the stock is 0 and BackorderMode is NoBackorders, **when** the shopper adds the product to the cart, **then** the cart refuses with the native warning ShoppingCart.OutOfStock (or ShoppingCart.QuantityExceedsStock when more than the stock is asked) and the product page shows Products.Availability.OutOfStock. | D; FIT (ShoppingCartService.GetStandardWarningsAsync) |
| AC-INV-001-01-04 | US-INV-001-01 | **Given** an order has just lowered the stock of a product, **when** any shopper requests the product page afterwards, **then** the page shows the lowered quantity on that request; there is no batch or scheduled update of stock figures. | REQ-KTDA-INV-002; FIT (GetProductByIdAsync uses a per-request cache only) |
| AC-INV-001-03-01 | US-INV-001-03 | **Given** BackorderMode is AllowQtyBelow0 and the stock is 0, **when** a shopper orders 2, **then** the order is accepted and the stock becomes -2. | D; FIT |
| AC-INV-001-04-01 | US-INV-001-04 | **Given** the user has Inventory.Core.Stock.View, **when** they open the stock history of a product, **then** every change is listed with date, quantity change, new quantity, warehouse and message; for INV documents the message carries the document reference and reason code (BR-INV-031). | D; FIT (StockQuantityHistory) |

**Business rules applied:** BR-INV-001; BR-INV-002; BR-INV-003; BR-INV-030; BR-INV-031 (§8.1).


### 7.2 PRD-INV-002 Multi-warehouse stock

| Item | Value |
|---|---|
| Description (baseline) | Tracks stock separately in each warehouse or store and adds it up to show total availability. Each warehouse or postal facility has a code and map coordinates. |
| Why it matters | Clients with several warehouses or factories see where stock is. |
| Who benefits | Stock staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-002-01 | As a member of stock staff, I want stock tracked separately in each warehouse or store and added up for availability, so that I see where the stock is. | D; REQ-KTDA-INV-001 | Ready |
| US-INV-002-02 | As a client administrator, I want each warehouse or postal facility to have a code and map coordinates, so that facilities are identified the same way in every system and can be shown on maps and used for nearby searches. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-002-01-01 | US-INV-002-01 | **Given** a product uses multiple warehouses with warehouse A stock 5 and warehouse B stock 3 and nothing reserved, **when** a shopper opens the product page, **then** the availability shown is 8, the sum over warehouses of stock minus reserved quantity. | D; REQ-KTDA-INV-001; FIT (ProductService.GetTotalStockQuantityAsync) |
| AC-INV-002-01-02 | US-INV-002-01 | **Given** the same product and no reservations, **when** an order for 6 is placed, **then** ReservedQuantity rises in the warehouse with the most free stock first (A by 5, B by 1); StockQuantity is unchanged until shipment; native writes no history entry at this point. | FIT (ProductService.ReserveInventoryAsync) |
| AC-INV-002-01-03 | US-INV-002-01 | **Given** units of that order are reserved in warehouse A, **when** the shipment from warehouse A is marked shipped, **then** StockQuantity and ReservedQuantity of warehouse A fall by the shipped quantity and a history entry is written (native message Ship). | FIT (OrderProcessingService.cs:2252, BookReservedInventoryAsync) |
| AC-INV-002-01-04 | US-INV-002-01 | **Given** the user has Inventory.Core.Stock.View, **when** they open stock by warehouse for a product, **then** they see per warehouse: stock, reserved, available, quantity in transit and the total; quantity in transit comes from INV-007 transfers when INV-007 (P2) is delivered and is 0 before that. | D; REQ-KTDA-INV-001; Proposed (P1 value) |
| AC-INV-002-02-01 | US-INV-002-02 | **Given** an administrator creates or edits a warehouse, **when** the code is empty or already used by another warehouse, **then** the save is refused with message Inv.WarehouseCodeDuplicate. | D; Proposed (uniqueness) |
| AC-INV-002-02-02 | US-INV-002-02 | **Given** the latitude is outside -90 to 90 or the longitude outside -180 to 180, **when** the warehouse is saved, **then** the save is refused with message Inv.CoordinatesInvalid. | Proposed |
| AC-INV-002-02-03 | US-INV-002-02 | **Given** a valid code and coordinates are entered, **when** the warehouse is saved, **then** they are stored in WarehouseExtension, shown in the warehouse list and available to SRC-004, LOG-002 and LOG-008 through IC-INV-05. | D |
| AC-INV-002-02-04 | US-INV-002-02 | **Given** warehouses A and B have coordinates and stock of a product, **when** LOG-002 chooses a distance band or LOG-008 chooses the nearest warehouse for an order line, **then** LOG reads the code and coordinates of A and B through IC-INV-05 (read only); a warehouse without coordinates is returned without them and LOG applies its own fallback (BR-LOG-011). | D; Proposed (IC-INV-05) |

**Business rules applied:** BR-INV-010 (§8.1).


### 7.3 PRD-INV-003 Low-stock thresholds and alerts

| Item | Value |
|---|---|
| Description (baseline) | The client sets a minimum stock level per product; when stock falls below it, staff or the seller are alerted and it appears on a low-stock report. |
| Why it matters | Popular items are restocked before they run out. |
| Who benefits | Stock staff; sellers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-003-01 | As a member of stock staff, I want to set a minimum stock level per product and be alerted when stock falls below it, so that popular items are restocked before they run out. | D; REQ-KTDA-INV-001; REQ-MPC-FR-055 | Ready |
| US-INV-003-02 | As a member of stock staff, I want a low-stock report, so that I see everything that needs restocking in one list. | D | Ready |
| US-INV-003-03 | As a seller, I want to set the alert levels on my own products and receive the alerts, so that I restock my own items in time. | D; REQ-MPC-FR-055 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-003-01-01 | US-INV-003-01 | **Given** NotifyAdminForQuantityBelow is 5 and the stock is 6, **when** an order for 2 is placed (stock 4), **then** the native email QuantityBelow.StoreOwnerNotification is sent; the email is sent only when stock goes down and ends strictly below the level. | D; REQ-KTDA-INV-001; FIT (ProductService.AdjustInventoryAsync) |
| AC-INV-003-03-01 | US-INV-003-03 | **Given** the product belongs to seller V and V set NotifyAdminForQuantityBelow, **when** the stock falls below it through an order, **then** the native email QuantityBelow.VendorNotification is sent to seller V. | REQ-MPC-FR-055; FIT (native since 4.80/4.90, unchanged in 5.00.1: QuantityBelow.VendorNotification) |
| AC-INV-003-03-02 | US-INV-003-03 | **Given** a seller opens the inventory section of one of their own products, **when** they change NotifyAdminForQuantityBelow, MinStockQuantity or LowStockActivity, **then** the values are saved for that product only; the seller cannot open another seller's product. | REQ-MPC-FR-055; FIT |
| AC-INV-003-02-01 | US-INV-003-02 | **Given** MinStockQuantity is 10 and the available stock is 10, **when** the user with Reports.LowStock opens the low-stock report, **then** the product is listed (available stock at or below MinStockQuantity); a seller sees only their own products. | D; FIT (ProductService.GetLowStockProductsAsync) |
| AC-INV-003-01-02 | US-INV-003-01 | **Given** LowStockActivity is DisableBuyButton, **when** the available stock falls to MinStockQuantity, **then** the buy and wishlist buttons are disabled; they are enabled again when stock rises above MinStockQuantity only if CatalogSettings.PublishBackProductWhenCancellingOrders is on. | FIT (ProductService.ApplyLowStockActivityAsync) |
| AC-INV-003-01-03 | US-INV-003-01 | **Given** an INV adjustment, receipt, transfer or count lowers the stock below NotifyAdminForQuantityBelow, **when** the INV movement is applied, **then** the same native low-stock emails are sent and the same LowStockActivity is applied as for an order (BR-INV-032). | Proposed |

**Business rules applied:** BR-INV-032 (§8.1).


### 7.4 PRD-INV-004 Stock reservation and hold

| Item | Value |
|---|---|
| Description (baseline) | Stock is held for a customer when they add it to the cart (optional, per client), start checkout or place an unpaid order; reminders are sent, and the hold is released automatically if they do not pay in time. |
| Why it matters | Prevents two people buying the last item, without locking stock forever. |
| Who benefits | Shoppers; stock staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, INV-HOLD |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-004-01 | As a shopper, I want the items I am buying held for me for a set time when I start checkout and, if the client enables it, when I add them to the cart, so that nobody else buys the last item while I pay. | D; FC-M26-002; FC-M03-005 | Ready; conditions: OVR-REG, INV-HOLD |
| US-INV-004-02 | As a shopper, I want a reminder to pay for an order I have not paid yet, so that I can still complete it. | D | Ready; conditions: OVR-REG, INV-HOLD |
| US-INV-004-03 | As a client administrator, I want the stock of unpaid orders released automatically when the payment window for the payment method expires, so that stock is not locked forever by orders that will never be paid. | D; INV-HOLD | Ready; conditions: OVR-REG, INV-HOLD |
| US-INV-004-04 | As a member of finance staff, I want unpaid orders that the system does not cancel listed for follow-up, so that someone contacts the buyer. | D; Proposed | Ready; conditions: OVR-REG, INV-HOLD |
| US-INV-004-05 | As a member of stock staff, I want to see the active holds on a product, so that I understand why less stock is available than counted. | D | Ready; conditions: OVR-REG, INV-HOLD |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-004-01-01 | US-INV-004-01 | **Given** the cart hold is enabled for the client, the hold window is set and a product has available stock 5 with no holds, **when** shopper A adds 2 to the cart, **then** after the cart line is saved, an InventoryHold of 2 for shopper A is created with expiry time now plus the hold window by the INV consumer of EntityInsertedEvent / EntityUpdatedEvent<ShoppingCartItem>; the stock others can add is 3; native stock is unchanged (BR-INV-021); if the consumer fails no hold exists and the native stock check at placement still applies. | D; FC-M26-002; FIT (ShoppingCartService.cs:1648, 1706 publish entity events); Proposed (consumer) |
| AC-INV-004-01-02 | US-INV-004-01 | **Given** shopper A holds 2 of a product with available stock 5, **when** shopper B tries to add 4, **then** the native stock check passes (4 is not more than 5), so the INV-004 cart check provider (IC-CHK-01) adds the warning Inv.HeldByOthers showing 3 and the cart refuses the item; the provider is called by the CHK-003 IShoppingCartService override from GetShoppingCartItemWarningsAsync (BR-CHK-015, decision OVR-REG); INV does not override IShoppingCartService. | D; FIT (ShoppingCartService.cs:427, 1141; native add to cart and cart update call GetShoppingCartItemWarningsAsync); OVR-REG |
| AC-INV-004-01-03 | US-INV-004-01 | **Given** shopper A holds 2 of a product with available stock 5 and shopper B has 4 in the cart without a hold, **when** B confirms the order, **then** the same provider runs in the placement cart check (OrderProcessingService calls GetShoppingCartItemWarningsAsync before payment) and the order is refused with Inv.HeldByOthers; A's own holds never count against A (BR-INV-021). | FIT (OrderProcessingService.cs:511); OVR-REG |
| AC-INV-004-01-04 | US-INV-004-01 | **Given** shopper A has items in the cart, **when** A opens checkout (CheckoutController Index or OnePageCheckout), **then** a hold is created or renewed for every cart line that manages stock, with expiry time now plus the checkout hold window, by an INV action filter on Nop.Web CheckoutController Index and OnePageCheckout [GET]. | D; FC-M03-005; FIT (CheckoutController.cs:342, 1495); Proposed (filter) |
| AC-INV-004-01-05 | US-INV-004-01 | **Given** a hold has passed its expiry time, **when** any availability check runs or the release task runs, **then** the hold is not counted any more and is set Released; the line stays in shopper A's cart and is checked again against stock at order placement. | D; FC-M03-005 |
| AC-INV-004-01-06 | US-INV-004-01 | **Given** shopper A holds stock, **when** A places the order, **then** native stock is lowered at placement and A's holds for those products are set Converted by an OrderPlacedEvent consumer; if the consumer fails, the holds still end at their expiry time (BR-INV-021). | FIT (OrderProcessingService.cs:1340; EventPublisher swallows consumer errors) |
| AC-INV-004-01-07 | US-INV-004-01 | **Given** a product does not manage stock or allows backorders, **when** it is added to the cart or checkout starts, **then** no hold is created. | Proposed |
| AC-INV-004-02-01 | US-INV-004-02 | **Given** an order is placed with payment method M, and M has a payment window, a reminder count and a reminder interval set, **when** the order is still unpaid (PaymentStatus Pending) when a reminder is due, **then** INV-004 asks TRK-005 to send the reminder (IC-TRK-04 SendEvent with event code Inv.UnpaidOrderReminder, registered by INV at installation through RegisterEventCode); the content carries the pay-again link of PAY-011; channels and TRK-006 opt-outs are applied by TRK (BR-TRK-020); the count of reminders sent is recorded; no reminder is sent after the order is paid, authorised or cancelled. | D; Proposed (event code) |
| AC-INV-004-03-01 | US-INV-004-03 | **Given** the payment window of method M has expired for an order and the configured action for M is Cancel, **when** the unpaid-order task processes the order, **then** under ILocker key 'pay-order-{OrderId}' the task re-reads the order; if PaymentStatus is still Pending, no PaymentTransaction of the order is Successful or Authorized (IC-INV-02) and the order has no shipment, it calls IOrderProcessingService.CancelOrderAsync(order, notifyCustomer: true); the stock is returned (native message CancelOrder), the native OrderCancelled.CustomerNotification is sent and the watch becomes Cancelled (AUD-INV-004). | D; FIT; INV-HOLD |
| AC-INV-004-03-02 | US-INV-004-03 | **Given** the payment window has expired and the action is Cancel, but a PaymentTransaction is Successful or Authorized, or PaymentStatus is no longer Pending, **when** the task re-reads the order under the lock, **then** the order is not cancelled and the watch becomes Closed; nothing else changes. | FIT (BR-PAY-013); INV-HOLD |
| AC-INV-004-03-03 | US-INV-004-03 | **Given** the payment window has expired and the action is Cancel, the payment guard passes but the order has a shipment, **when** the task processes the order, **then** the order is not cancelled; the watch becomes Flagged with reason "shipment exists" and appears in the unpaid-order list. | Proposed |
| AC-INV-004-03-04 | US-INV-004-03 | **Given** the payment window has expired and the action for M is Flag, **when** the task processes the order, **then** the watch becomes Flagged, an order note is added and the order appears in the unpaid-order list; stock and order status do not change. | D; Proposed |
| AC-INV-004-03-05 | US-INV-004-03 | **Given** the payment window has expired and the action for M is Remind, **when** the task processes the order, **then** a final reminder is sent and the watch becomes Expired; the order is not cancelled and stays payable. | Proposed |
| AC-INV-004-03-06 | US-INV-004-03 | **Given** the order's payment method has no payment window configured (for example cash on delivery, letter of credit or on-account), **when** the task runs, **then** the order is ignored; no reminder, flag or cancellation happens (BR-INV-020). | Proposed |
| AC-INV-004-04-01 | US-INV-004-04 | **Given** the user has Inventory.Core.UnpaidOrders.CreateEditDelete, **when** they open the unpaid-order list, **then** flagged orders are shown with payment method, amount, age and reminders sent; the user can release the order (cancel under the same guard as the task) or dismiss the flag with a mandatory reason; every action is audited (AUD-INV-004). | Proposed |
| AC-INV-004-05-01 | US-INV-004-05 | **Given** the user has Inventory.Core.Stock.View, **when** they open the holds of a product, **then** every active hold is listed with customer, quantity, source (cart or checkout) and expiry time. | D |
| AC-INV-004-01-08 | US-INV-004-01 | **Given** product P has active holds and CAT raises Listing.Withdrawn for P (CAT-024), **when** the INV consumer receives the event, **then** it only enqueues a release job for P; the hold-release task then sets every Active hold of P to Released; cart lines are not removed by INV and the native cart warning ShoppingCart.ProductUnpublished refuses P at placement. | D (CAT-024); FIT (consumers swallow exceptions; ShoppingCartService.cs:355); Proposed (job) |
| AC-INV-004-01-09 | US-INV-004-01 | **Given** shopper A holds 2 of a product with available stock 5 and INV-004 is registered with CHK-003 as the replacer of the native warnings ShoppingCart.OutOfStock and ShoppingCart.QuantityExceedsStock (IC-CHK-01), **when** shopper B tries to add 7, **then** the native check produces ShoppingCart.QuantityExceedsStock with 5; INV-004 replaces exactly that warning with Inv.HeldByOthers showing 3, so B sees one stock warning; when no other customer holds the product the native warning is kept unchanged (BR-CHK-015, BR-INV-021). | OVR-REG; FIT (ShoppingCartService.cs:427-430, 565-576); Proposed (replacement) |
| AC-INV-004-03-07 | US-INV-004-03 | **Given** the INV-004 unpaid-order watch is installed for a client, **when** the client configuration is applied or validated (PLT-003), **then** the native 5.00 automatic cancellation stays off for every store (OrderSettings.AutoCancelEnabled false; the native task "Auto-cancel unpaid orders" then skips the store), and a pack that switches it on fails validation (BR-INV-023); reason: the native task cancels every Pending or Processing order whose PaymentStatus is Pending after one delay per store (AutoCancelDelay minutes, AutoCancelIgnoredPaymentMethods), without the pay-order lock, the PaymentTransaction check (IC-INV-02), the shipment check or the Remind and Flag actions of BR-INV-020, so it could cancel an order whose payment succeeds at the same moment. | D; INV-HOLD; FIT (Libraries/Nop.Services/Orders/AutoCancelOrdersTask.cs:56-122; Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:184-204; OrderProcessingService.CanCancelOrder, OrderProcessingService.cs:2375-2383; Libraries/Nop.Services/Installation/InstallRequiredData.cs:3582-3591); VER-500 |
| AC-INV-004-02-02 | US-INV-004-02 | **Given** the INV-004 unpaid-order reminder is configured for a client, **when** the client configuration is applied or validated (PLT-003), **then** the native 5.00 pending-order reminder stays off (ReminderSettings.PendingOrdersEnabled false; templates Reminders.PendingOrderFollowUp1 and 2 inactive), so a buyer never receives both reminders (BR-INV-023); reason: the native reminder sends at most two emails per order, only to customers with an email address, with one delay per template and not per payment method, and not through TRK-005. | D; FIT (Libraries/Nop.Services/Reminders/ProcessPendingOrdersTask.cs:54-164; Libraries/Nop.Core/Domain/Reminders/ReminderSettings.cs; Libraries/Nop.Core/Domain/Messages/MessageTemplateSystemNames.cs:322-327); VER-500 |

**Business rules applied:** BR-INV-020; BR-INV-021; BR-INV-022; BR-INV-023 (§8.1).


### 7.5 PRD-INV-005 Stock adjustments with reason codes

| Item | Value |
|---|---|
| Description (baseline) | Staff correct stock levels (for example after damage or loss) by choosing a reason; large adjustments need approval; every change is recorded. |
| Why it matters | Stock figures stay accurate and losses are explained. |
| Who benefits | Stock staff; auditors |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-005-01 | As a member of stock staff, I want to correct a stock level by choosing a reason such as damage or loss, so that stock figures stay accurate and losses are explained. | D; REQ-KTDA-INV-001; FC-M26-007 | Ready |
| US-INV-005-02 | As a member of stock staff, I want large adjustments to need approval by a second person, so that mistakes and theft are controlled. | D; FC-M26-007 | Ready |
| US-INV-005-03 | As an auditor, I want every stock change recorded with who made it, why and when, so that I can check stock movements. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-005-01-01 | US-INV-005-01 | **Given** the user has Inventory.Core.Adjustments.Request and a single-warehouse product has stock 10, **when** they submit -2 with reason Damage and the change is below the approval threshold, **then** the adjustment is Applied at once: IProductService.AdjustInventoryAsync is called with -2 and a message holding the adjustment reference and reason (BR-INV-031); the stock becomes 8; the INV record keeps the requester, reason and note (AUD-INV-001). | D; REQ-KTDA-INV-001; FIT |
| AC-INV-005-01-02 | US-INV-005-01 | **Given** no reason code is chosen, **when** the adjustment is submitted, **then** it is refused with message Inv.AdjustmentReasonRequired. | D |
| AC-INV-005-01-03 | US-INV-005-01 | **Given** a multi-warehouse product and warehouse A are chosen, **when** an adjustment of +5 is applied, **then** StockQuantity of warehouse A rises by 5 through UpdateProductWarehouseInventoryAsync and a history entry is written through AddStockQuantityHistoryEntryAsync for warehouse A; ReservedQuantity is unchanged (BR-INV-034). | FIT (AdjustInventoryAsync changes reservations, not stock, for multi-warehouse products) |
| AC-INV-005-01-04 | US-INV-005-01 | **Given** the product does not allow backorders and the adjustment would take available stock below 0, **when** it is submitted, **then** it is refused with message Inv.AdjustmentBelowZero. | Proposed |
| AC-INV-005-02-01 | US-INV-005-02 | **Given** the size of the change is above the approval threshold, **when** it is submitted, **then** it becomes Requested, the stock does not change, users with Inventory.Core.Adjustments.Approve are notified and the requester sees message Inv.AdjustmentNeedsApproval. | D; FC-M26-007 |
| AC-INV-005-02-02 | US-INV-005-02 | **Given** an adjustment is Requested, **when** the requester tries to approve it, **then** the approval is refused with message Inv.CannotApproveOwn (BR-INV-033). | Proposed |
| AC-INV-005-02-03 | US-INV-005-02 | **Given** an adjustment is Requested, **when** another user with Inventory.Core.Adjustments.Approve approves it, **then** the stock changes as for an applied adjustment and the record becomes Applied with the approver (AUD-INV-001). | D |
| AC-INV-005-02-04 | US-INV-005-02 | **Given** an adjustment is Requested, **when** the approver rejects it with a reason, **then** the record becomes Rejected and the stock does not change. | D |
| AC-INV-005-03-01 | US-INV-005-03 | **Given** a user with only Catalog.ProductsCreateEditDelete changes a stock quantity on the native product edit page, bulk edit grid or attribute-combination popup, **when** the page is posted, **then** an INV action filter refuses the post before it is saved, shows message Inv.UseStockAdjustment and writes AUD-INV-002; posts that do not change a stock quantity are saved as normal (BR-INV-030). | FIT (ProductController Edit, BulkEditSave, ProductAttributeCombinationEditPopup; bulk edit writes no history) |
| AC-INV-005-03-02 | US-INV-005-03 | **Given** a user without Inventory.Core.Adjustments.Approve posts a product Excel import, **when** the import is posted, **then** the INV action filter refuses it with message Inv.UseStockAdjustment; a user with the permission can import and the native history message ImportProduct.Edit records each stock change. | FIT (ProductController.ImportExcel; ImportManager.cs:2624); Proposed |
| AC-INV-005-01-05 | US-INV-005-01 | **Given** an INV adjustment brings stock from 0 or below to above 0, **when** it is applied, **then** native back-in-stock notifications are sent as the native product edit does, and BR-INV-032 is applied. | FIT (ProductController.cs:1361-1370); Proposed |
| AC-INV-005-01-06 | US-INV-005-01 | **Given** a buyer accepted an ORD-006 partial-supply proposal, so the unavailable quantities were removed from the order without returning stock, **when** the seller (own products) or warehouse staff find that the physical stock differs from the platform figure, **then** they post an adjustment with a reason code through IC-INV-01 under the normal approval threshold; INV makes no automatic stock movement for partial supply. | D (ORD-006); Proposed |
| AC-INV-005-01-07 | US-INV-005-01 | **Given** RET-004 restocks a returned unit, **when** RET posts IC-INV-01 PostMovement with reason Return and the lot or serial number where tracked, **then** the movement is Applied without approval (document-backed, BR-INV-033); the history message carries the return reference (BR-INV-031). | D (RET-004); Proposed |

**Business rules applied:** BR-INV-030; BR-INV-031; BR-INV-032; BR-INV-033; BR-INV-034 (§8.1).


### 7.6 PRD-INV-006 Goods receiving

| Item | Value |
|---|---|
| Description (baseline) | Records goods arriving at the warehouse against the purchase order, notes any shortages or damage, and records where the goods are stored. |
| Why it matters | Stock levels are right from the moment goods arrive. |
| Who benefits | Warehouse staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: KG-03 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-006-01 | As a member of warehouse staff, I want to record goods arriving at the warehouse against the purchase order, so that stock levels are right from the moment goods arrive. | D; REQ-KTDA-INV-001; FC-M26-005 | Ready; conditions: KG-03 |
| US-INV-006-02 | As a member of warehouse staff, I want to note any shortage or damage, so that suppliers can be asked to correct them. | D | Ready; conditions: KG-03 |
| US-INV-006-03 | As a member of warehouse staff, I want to record where the goods are stored, so that they can be found for picking. | D | Ready; conditions: KG-03 |
| US-INV-006-04 | As a member of quality staff, I want goods that need inspection to be added to stock only after they pass, so that faulty goods are not sold. | FC-M26-005 | Ready; conditions: KG-03 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-006-01-01 | US-INV-006-01 | **Given** an open purchase order exists (received from the ERP through INV-012 or entered by staff) for warehouse W, **when** staff record a receipt of some or all lines and post it, **then** the accepted quantity of each line is added to stock in W through the adjustment service (IC-INV-01, reason Receipt, no approval: the receipt is the document, BR-INV-040); each line's received quantity is updated and the purchase order becomes PartiallyReceived or Received (SM-INV-04); AUD-INV-006. | D; REQ-KTDA-INV-001 |
| AC-INV-006-01-02 | US-INV-006-01 | **Given** no purchase order exists, **when** staff try to record a receipt, **then** it is refused with message Inv.ReceiptWithoutPo unless the client setting allows receipts without a purchase order; such a receipt is posted as an INV-005 adjustment with reason Receipt and follows its approval threshold. | Proposed |
| AC-INV-006-02-01 | US-INV-006-02 | **Given** a line receives fewer units than ordered, **when** the receipt is posted, **then** the shortage is recorded on the line as a discrepancy and the purchase-order line stays open for the rest. | D |
| AC-INV-006-02-02 | US-INV-006-02 | **Given** some received units are damaged, **when** the receipt is posted with the damaged quantity, **then** the damaged quantity is not added to stock and is recorded as a discrepancy with reason Damaged. | D |
| AC-INV-006-02-03 | US-INV-006-02 | **Given** a line receives more units than the open quantity plus the over-receipt tolerance, **when** the receipt is posted, **then** it is refused with message Inv.OverReceipt. | Proposed |
| AC-INV-006-03-01 | US-INV-006-03 | **Given** a bin location is entered for a line, **when** the receipt is posted, **then** the location (zone, aisle, rack, shelf, bin) is written to the LOG-009 ProductShelfLocation row of that product and warehouse, which LOG pick lists read; INV keeps no shelf-location table of its own. | D; LOG-009 |
| AC-INV-006-04-01 | US-INV-006-04 | **Given** inspection is required for the product's category (setting), **when** the receipt is recorded, **then** the line waits as AwaitingInspection and nothing is added to stock; when quality staff record Passed the accepted quantity is posted; a Failed quantity is recorded as a discrepancy. | FC-M26-005; Proposed |
| AC-INV-006-01-03 | US-INV-006-01 | **Given** the product is lot-tracked (INV-009) or serial-tracked (INV-010), **when** the receipt is posted, **then** the lot number with manufacture and expiry dates, or one serial number per unit, is required (messages Inv.LotRequired, Inv.SerialCountMismatch). | Proposed (INV-009, INV-010) |

**Business rules applied:** BR-INV-031; BR-INV-040 (§8.1).


### 7.7 PRD-INV-007 Warehouse transfers

| Item | Value |
|---|---|
| Description (baseline) | Moves stock between warehouses, showing it as 'in transit' while on the way. |
| Why it matters | Stock is not lost or counted twice during transfers. |
| Who benefits | Warehouse staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-007-01 | As a member of warehouse staff, I want to move stock from one warehouse to another and see it as in transit on the way, so that stock is not lost or counted twice during transfers. | D; FC-M26-006 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-007-01-01 | US-INV-007-01 | **Given** a transfer of 4 units of a multi-warehouse product from A to B is Draft and A has 4 available, **when** staff dispatch it, **then** StockQuantity of A falls by 4 (history entry with the transfer reference), the transfer becomes InTransit with 4 units in transit, and the in-transit units are not counted as available anywhere (SM-INV-05). | D; FC-M26-006 |
| AC-INV-007-01-02 | US-INV-007-01 | **Given** warehouse A has less available stock than the transfer quantity, **when** staff dispatch it, **then** the dispatch is refused with message Inv.TransferInsufficientStock. | Proposed |
| AC-INV-007-01-03 | US-INV-007-01 | **Given** a transfer is InTransit, **when** B records receipt of all units, **then** StockQuantity of B rises by 4 (history entry with the transfer reference) and the transfer becomes Received. | D |
| AC-INV-007-01-04 | US-INV-007-01 | **Given** a transfer is InTransit, **when** B records receipt of fewer units than sent, **then** B receives what arrived, the transfer becomes ReceivedWithDiscrepancy and the missing units become an INV-005 adjustment request with reason Lost in transit. | Proposed |
| AC-INV-007-01-05 | US-INV-007-01 | **Given** the product does not use multiple warehouses, **when** staff try to add it to a transfer, **then** it cannot be added: a single-warehouse product has one Product.WarehouseId and no stock per warehouse. | FIT |
| AC-INV-007-01-06 | US-INV-007-01 | **Given** a transfer is Draft, **when** staff cancel it, **then** it becomes Cancelled and no stock changes. | Proposed |
| AC-INV-007-01-07 | US-INV-007-01 | **Given** a transfer changes status, **when** the change is saved, **then** user, time and quantities are recorded (AUD-INV-005). | FC-M26-006 |

**Business rules applied:** BR-INV-050 (§8.1).


### 7.8 PRD-INV-008 Cycle counts

| Item | Value |
|---|---|
| Description (baseline) | Regular partial stock counts on a schedule, with differences investigated and corrected. |
| Why it matters | Keeps stock records accurate without closing for a full count. |
| Who benefits | Warehouse staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-008-01 | As a member of warehouse staff, I want regular partial stock counts on a schedule, so that records stay accurate without closing for a full count. | D; FC-M26-008 | Ready |
| US-INV-008-02 | As a member of stock staff, I want differences investigated and corrected, so that stock figures are trusted. | D | Ready |
| US-INV-008-03 | As a member of stock staff, I want periodic full counts of high-value or controlled stock, so that losses on those items are found. | FC-M26-008 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-008-01-01 | US-INV-008-01 | **Given** a count plan exists with a selection (warehouse, category, ABC class from INV-013 or product list) and a frequency, **when** the plan is due, **then** the count task creates a count with one line per product and warehouse and records the system quantity at that moment (SM-INV-06). | D; FC-M26-008 |
| AC-INV-008-01-02 | US-INV-008-01 | **Given** blind counting is on, **when** a counter opens a count, **then** the system quantity is not shown on the count sheet. | Proposed |
| AC-INV-008-02-01 | US-INV-008-02 | **Given** counted quantities are entered for all lines, **when** the count is submitted, **then** each line shows the variance = counted quantity - (system quantity at creation + net movements recorded in stock history since then). | D; Proposed (formula) |
| AC-INV-008-02-02 | US-INV-008-02 | **Given** a line variance is above the recount threshold, **when** the count is submitted, **then** the line is sent for recount before posting. | Proposed |
| AC-INV-008-02-03 | US-INV-008-02 | **Given** a submitted count has lines with variance not zero, **when** it is posted, **then** each variance becomes an adjustment with reason Count variance through the adjustment service and follows the INV-005 approval threshold; lines with zero variance are closed (BR-INV-060); AUD-INV-007. | D |
| AC-INV-008-03-01 | US-INV-008-03 | **Given** a plan of type Full is due for the selected products, **when** the count is created, **then** every selected product in every warehouse that holds it is in the count. | FC-M26-008 |

**Business rules applied:** BR-INV-060 (§8.1).


### 7.9 PRD-INV-009 Batch and lot tracking

| Item | Value |
|---|---|
| Description (baseline) | Records the batch (lot) number with manufacture and expiry dates, and which customers received each batch. Batch quality test results and the chain of custody (who held the batch and when) are recorded. |
| Why it matters | If a batch has a problem, affected customers can be found and the batch recalled. |
| Who benefits | Quality staff; shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin (provider under OVR-REG) |
| Depends on | PRD-CAT-002 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-009-01 | As a member of quality staff, I want to record the batch (lot) number with manufacture and expiry dates for goods received, so that each batch can be traced. | D; FC-M26-009; FC-M01-025 | Ready; conditions: OVR-REG |
| US-INV-009-02 | As a member of quality staff, I want to record batch quality test results and the chain of custody, so that we can prove the batch was handled correctly. | D; FC-M26-009 | Ready; conditions: OVR-REG |
| US-INV-009-03 | As a member of quality staff, I want to find which customers received a batch and recall it, so that affected customers are contacted and the batch is withdrawn. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-009-01-01 | US-INV-009-01 | **Given** a product is set as lot-tracked (only products with ManageInventoryMethod ManageStock), **when** stock is received (INV-006), **then** each receipt line needs a lot number, manufacture date and expiry date (message Inv.LotRequired) and the lot quantity in that warehouse rises by the accepted quantity. | D; FC-M26-009 |
| AC-INV-009-01-02 | US-INV-009-01 | **Given** a product uses "manage stock by attributes", **when** an administrator tries to set it lot-tracked, **then** it is refused: the native cart checks combination stock directly and not GetTotalStockQuantityAsync, so unsellable lots could not be excluded. | FIT (ShoppingCartService.cs:497) |
| AC-INV-009-02-01 | US-INV-009-02 | **Given** a quality result Failed is recorded for a lot, **when** it is saved, **then** the lot becomes Blocked; its quantity is no longer sellable because the INV sellable-stock provider (IC-INV-04), called by the CAT-002 IProductService override of GetTotalStockQuantityAsync (decision OVR-REG), subtracts the quantity of lots that are Blocked, Expired, Recalled or in Quarantine (BR-INV-071); AUD-INV-008. | D; FIT (ProductService.cs:1480 public virtual); OVR-REG |
| AC-INV-009-02-02 | US-INV-009-02 | **Given** a custody event (holder, from, to, note) is recorded for a lot, **when** it is saved, **then** it is added to the lot's custody chain; earlier custody events cannot be edited or deleted. | D; FC-M26-009 |
| AC-INV-009-03-01 | US-INV-009-03 | **Given** an order line for a lot-tracked product is shipped, **when** staff create the shipment (Admin OrderController.AddShipment [POST]), **then** before the action runs, an INV action filter calls IC-INV-07 Capture, which requires lots for the shipped quantity (pre-filled by FEFO, INV-011) and refuses lots that are not Released (message Inv.LotNotSellable), and on refusal nothing is saved; after the action has saved the shipment and its items, the filter calls IC-INV-07 Confirm, which writes LotAllocation rows linking lot, shipment item, order and customer and lowers the lot quantities (BR-INV-070). | D; FIT ( order events; OrderController.cs:2024-2032); Proposed (capture at shipment) |
| AC-INV-009-03-02 | US-INV-009-03 | **Given** quality staff recall a lot, **when** they confirm the recall, **then** the lot becomes Recalled, its remaining stock stops being sellable and a list of every order, customer, quantity and shipment date for that lot is produced and exportable. | D |
| AC-INV-009-03-03 | US-INV-009-03 | **Given** LOG creates a shipment for a packed line of a lot-tracked product (AC-LOG-009-03-03), **when** LOG calls IC-INV-07 Capture, inserts the shipment and its items, then calls Confirm, **then** Capture applies the same checks as the admin path (Inv.LotRequired, Inv.LotNotSellable) and on refusal LOG saves nothing; when a shipment guard (IC-ORD-11) refuses the insert or the insert fails, LOG calls Cancel and the capture becomes Cancelled with no lot quantity change (SM-INV-10). | Proposed (IC-INV-07); FIT (IShipmentService.InsertShipmentAsync) |
| AC-INV-009-03-04 | US-INV-009-03 | **Given** a shipment item of a lot- or serial-tracked product is saved by a path that did not call IC-INV-07 Confirm (for example an API write or a third-party plugin), **when** the INV consumer of EntityInsertedEvent<ShipmentItem> runs, **then** it only enqueues a check; the check lists the item as a capture exception (BR-INV-070, AUD-INV-012) and a user with Inventory.Core.Lots.CreateEditDelete records the lots or serial numbers through IC-INV-07 for that item; the shipment is not blocked. | FIT (ShipmentService.cs:307 inserts through IRepository.InsertAsync, which publishes EntityInsertedEvent; consumers swallow exceptions); Proposed |
| AC-INV-009-01-03 | US-INV-009-01 | **Given** a lot-tracked product, **when** the reconciliation task runs, **then** the sum of Released and unsellable lot quantities per warehouse is compared with native stock plus quantities placed but not yet shipped; any difference is listed as an exception (BR-INV-070). | Proposed |

**Business rules applied:** BR-INV-070; BR-INV-071 (§8.1).


### 7.10 PRD-INV-010 Serial number tracking

| Item | Value |
|---|---|
| Description (baseline) | Records the unique serial number of each unit sold and who bought it. |
| Why it matters | Supports warranties and tracing of high-value items. |
| Who benefits | Shoppers; support staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-010-01 | As a member of support staff, I want the serial number of each unit sold and who bought it, so that I can handle warranty questions and trace high-value items. | D; FC-M26-010; FC-M01-025 | Ready |
| US-INV-010-02 | As a member of warehouse staff, I want serial numbers recorded when units are received, so that the unit can be followed from arrival to delivery. | FC-M26-010 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-010-02-01 | US-INV-010-02 | **Given** a product is set as serial-tracked (ManageStock only), **when** a receipt of 3 units is posted (INV-006), **then** exactly 3 distinct serial numbers are required (message Inv.SerialCountMismatch) and each becomes InStock in that warehouse. | FC-M26-010 |
| AC-INV-010-01-01 | US-INV-010-01 | **Given** a shipment of 3 units of a serial-tracked product is created, **when** staff enter the serial numbers, **then** IC-INV-07 Capture requires exactly 3 distinct serial numbers in status InStock and not in another open capture; after the shipment items are saved, Confirm sets each to Shipped and links it to the shipment item, order and customer (SM-INV-08). | D; Proposed (IC-INV-07) |
| AC-INV-010-01-02 | US-INV-010-01 | **Given** a serial number is unknown or not InStock, **when** it is entered on a shipment, **then** it is refused with message Inv.SerialNotAvailable. | Proposed |
| AC-INV-010-01-03 | US-INV-010-01 | **Given** the user has Inventory.Core.Stock.View, **when** they search a serial number, **then** product, order, customer, shipment date and the serial's event history are shown. | D |
| AC-INV-010-01-04 | US-INV-010-01 | **Given** a returned unit is restocked through RET, **when** the restock is posted, **then** its serial number becomes InStock again with a Returned event. | Proposed |
| AC-INV-010-01-05 | US-INV-010-01 | **Given** the reconciliation task runs, **when** InStock serial numbers of a product differ from its native stock, **then** the difference is listed as an exception. | Proposed |

**Business rules applied:** BR-INV-080 (§8.1).


### 7.11 PRD-INV-011 Expiry management

| Item | Value |
|---|---|
| Description (baseline) | Tracks expiry dates per batch, picks items that expire soonest first, flags items close to expiry and can hide expired items from sale. |
| Why it matters | Reduces waste and stops expired goods being sold. |
| Who benefits | Warehouse staff; shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin (provider under OVR-REG) |
| Depends on | PRD-INV-009, PRD-CAT-002 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-011-01 | As a member of warehouse staff, I want the batches that expire soonest to be picked first, so that less stock expires on the shelf. | D; FC-M26-011 | Ready; conditions: OVR-REG |
| US-INV-011-02 | As a shopper, I want not to be sold expired items, so that I receive goods I can use. | D | Ready; conditions: OVR-REG |
| US-INV-011-03 | As a member of stock staff, I want items close to expiry flagged, so that we can sell or clear them in time. | D; FC-M26-011 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-011-01-01 | US-INV-011-01 | **Given** a product has lot L1 expiring before lot L2, both Released, **when** a shipment is created, **then** the lot selection is pre-filled from L1 first (FEFO); staff may change it only to another Released lot. | D; FC-M26-011 |
| AC-INV-011-02-01 | US-INV-011-02 | **Given** a lot reaches its expiry date, **when** the daily expiry task runs, **then** the lot becomes Expired and its quantity is excluded from sellable stock by the INV sellable-stock provider (IC-INV-04) to the CAT-002 GetTotalStockQuantityAsync override (BR-INV-071); when sellable stock reaches 0 the native out-of-stock behaviour and LowStockActivity apply. | D; FIT; OVR-REG |
| AC-INV-011-03-01 | US-INV-011-03 | **Given** the near-expiry window is set, **when** a Released lot enters the window, **then** the lot is flagged on the near-expiry list and stock staff are notified once. | D |
| AC-INV-011-02-02 | US-INV-011-02 | **Given** an Expired lot is disposed of, **when** staff post an adjustment with reason Expiry for the lot, **then** native stock and the lot quantity fall by the same amount through the adjustment service. | D; FC-M26-011 |

**Business rules applied:** BR-INV-071 (§8.1).


### 7.12 PRD-INV-012 WMS/ERP stock synchronisation

| Item | Value |
|---|---|
| Description (baseline) | Keeps stock and stock movements in step, in both directions, with the client's warehouse or ERP system. Stock values for accounting and purchase triggers are also passed to the ERP. |
| Why it matters | One set of stock figures across all systems. |
| Who benefits | Stock staff; IT |
| Phase | P1 |
| Implementation | Code-level — External system + integration plugin |
| Depends on | — |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-012-01 | As a member of stock staff, I want stock levels and stock movements kept in step in both directions with our warehouse or ERP system, so that there is one set of stock figures across all systems. | D; REQ-KTDA-INT-001; FC-M26-012 | On hold: PAID-STUB |
| US-INV-012-02 | As a member of finance staff, I want stock values and purchase triggers passed to the ERP, so that inventory is reflected in the financial records and buying starts in time. | D; FC-M26-013 | On hold: PAID-STUB |
| US-INV-012-03 | As a member of the IT team, I want failed messages retried and visible, so that no stock change is lost between systems. | D | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-012-01-01 | US-INV-012-01 | **Given** the connector is configured and stock levels flow inbound for a warehouse, **when** the ERP sends a stock level for a SKU in that warehouse, **then** the INV-012 connector, built on the INT-005 framework (IC-INT-03 PullChanges), posts the difference from platform stock through IC-INV-01 with reason ERP sync and the external message ID in the history message: IProductService.AdjustInventoryAsync for a single-warehouse product, UpdateProductWarehouseInventoryAsync with a history entry for a multi-warehouse product (BR-INV-034); it is exempt from the approval threshold and audited (AUD-INV-010). | D; REQ-KTDA-INT-001; FIT (ProductService.cs:1795-1803); Proposed (exemption) |
| AC-INV-012-01-02 | US-INV-012-01 | **Given** movements flow outbound, **when** a stock movement is committed on the platform (placement, cancellation, shipment, adjustment, receipt, transfer, count), **then** an outbound message with channel "stock sync" is written to the single INT-004 outbox through IC-INT-09 Enqueue (the INV consumer only enqueues) and the INT delivery task sends it through the INV-012 connector (IC-INV-03); it becomes Delivered when the connector reports the ERP acknowledgement (SM-INT-01); INV keeps no outbound queue of its own (BR-INV-090, BR-INT-015). | D; REQ-KTDA-INT-001; Proposed (one outbox) |
| AC-INV-012-01-03 | US-INV-012-01 | **Given** a message with an external message ID that was already applied arrives again, **when** it is processed, **then** it is applied once only (BR-INV-090, BR-INT-021). | Proposed; NFR-X-007 |
| AC-INV-012-01-04 | US-INV-012-01 | **Given** the same SKU and warehouse changed on both sides since the last sync, **when** the sync runs, **then** the master of record set for that data type (BR-INT-020) wins and the conflict is listed for review with both values. | Proposed |
| AC-INV-012-02-01 | US-INV-012-02 | **Given** valuation is enabled, **when** the valuation schedule runs, **then** quantity and value per SKU and warehouse are sent, with value = quantity x Product.ProductCost unless the client sets another method. | FC-M26-013; Proposed (method) |
| AC-INV-012-02-02 | US-INV-012-02 | **Given** purchase triggers are enabled, **when** available stock of a product reaches MinStockQuantity, **then** a purchase trigger with SKU, warehouse and quantity on hand is sent to the ERP once until stock rises above the level again. | D |
| AC-INV-012-03-01 | US-INV-012-03 | **Given** sending an outbound stock message fails, **when** the INT-004 retry policy applies, **then** it is retried up to the configured number of attempts (RetryWaiting, SM-INT-01); after the last attempt it becomes DeadLettered in the INT-004 outbox, the INT dead-letter notification is sent (event code Int.Core.MessageDeadLettered) and a user holding Integrations.Core.Messages.Replay replays or discards it with a reason (AUD-INT-003); no stock message is lost. | Proposed (one outbox, BR-INT-015) |

**Business rules applied:** BR-INV-090 (§8.1).


### 7.13 PRD-INV-013 Inventory analytics

| Item | Value |
|---|---|
| Description (baseline) | Reports on how fast stock sells, how many days of stock are left, items that never sell and which items matter most. |
| Why it matters | Better buying decisions and less money tied up in stock. |
| Who benefits | Management; stock planners |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: ANL-002-OWN |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INV-013-01 | As a manager, I want to see how fast stock sells and how many days of stock are left, so that we buy the right amounts. | D; FC-M26-014 | Ready; conditions: ANL-002-OWN |
| US-INV-013-02 | As a stock planner, I want to see items that never sell and which items matter most (ABC), so that less money is tied up in stock. | D; FC-M26-014 | Ready; conditions: ANL-002-OWN |
| US-INV-013-03 | As a manager, I want the RPT dashboard of fast and slow movers and stock levels to use the platform stock-movement data, so that reports and stock figures agree. | see RPT-001 (REQ-KTDA-ANL-002); ANL-002-OWN | Ready; conditions: ANL-002-OWN |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INV-013-01-01 | US-INV-013-01 | **Given** a period is selected, **when** the sell-rate report runs, **then** per product it shows units sold (order lines of orders placed in the period, cancelled orders excluded), average units sold per day, current sellable stock and days of cover = sellable stock / average units per day (blank when nothing was sold). | D; FC-M26-014; Proposed (formula) |
| AC-INV-013-01-02 | US-INV-013-01 | **Given** daily stock snapshots exist for the period, **when** the stock-out report runs, **then** per product it shows the number of days on which sellable stock was 0 or less. | FC-M26-014; Proposed |
| AC-INV-013-02-01 | US-INV-013-02 | **Given** the dead-stock window is set, **when** the dead-stock report runs, **then** it lists products with stock above 0 and no units sold within the window, with stock value (stock x Product.ProductCost). | D; Proposed |
| AC-INV-013-02-02 | US-INV-013-02 | **Given** the ABC cut-offs are set, **when** the ABC report runs for a period, **then** products are put in classes A, B and C by cumulative share of sales value in the period, highest first. | D; FC-M26-014 |
| AC-INV-013-03-01 | US-INV-013-03 | **Given** RPT-001 builds its fast and slow mover or stock-level view for a period, **when** it calls IC-INV-06, **then** INV returns per product and warehouse the daily sellable-stock snapshots, the stock movements by reason (from stock history and INV records) and the current sellable stock (BR-INV-100); INV-013 shows no fast / slow mover or stock-level dashboard of its own. | ANL-002-OWN; Proposed (IC-INV-06) |
| AC-INV-013-01-03 | US-INV-013-01 | **Given** a seller opens the INV-013 reports, **when** the data is loaded, **then** only the seller's own products are shown. | Proposed |

**Business rules applied:** BR-INV-100 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-INV-001 | Stock quantities change only through the native IProductService inventory methods (AdjustInventoryAsync, BookReservedInventoryAsync, ReverseBookedInventoryAsync, UpdateProductWarehouseInventoryAsync with AddStockQuantityHistoryEntryAsync) called by native order flows or by the INV adjustment service (IC-INV-01); every change writes a StockQuantityHistory entry. No product code sets Product.StockQuantity, ProductWarehouseInventory.StockQuantity or ProductAttributeCombination.StockQuantity directly. | INV-001 and all INV features | FIT (ProductService.cs:1787-1945, 2426-2519) |
| BR-INV-002 | Every INV page, widget, action filter, provider (IC-INV-04, IC-CHK-01) and scheduled task checks the state of its feature for the store through IC-PLT-02 (setting productfeature.<prd-id>, store then shared value) before it acts; when the feature is off the provider returns no change and native behaviour applies. Every new INV setting key is listed in the INV key catalogue (key, type, layer, secret flag, default); keys that hold a credential, key or token are flagged secret (BR-PLT-013, CFG-01). | All INV features | (AC-PLT-022-02-01, AC-PLT-003-01-04, BR-PLT-013); Proposed |
| BR-INV-003 | All INV plugin tables are written through IRepository<>, so the SEC decorator captures old and new values (BR-SEC-010); INV writes no data through INopDataProvider directly. Business events AUD-INV-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014). | All INV features | (BR-SEC-010, BR-SEC-011, BR-SEC-014) |
| BR-INV-010 | Every warehouse has a code, unique in the installation, and latitude and longitude; they are stored in the WarehouseExtension plugin table, not in the native Warehouse or Address tables. | INV-002 | D; Proposed (uniqueness); FIT (Warehouse and Address have no code or coordinates) |
| BR-INV-020 | INV-004 owns the unpaid-order timeout, reminders and release for every payment method. Stock is decremented at order placement (native). For each payment method the client sets a payment window, a reminder count and interval, and an expiry action Remind, Flag or Cancel (all defaults not stated); orders whose payment method has no window are never processed. When the window expires and the action is Cancel, INV-004 cancels only if, under ILocker key 'pay-order-{OrderId}', the order PaymentStatus is still Pending and no PaymentTransaction for the order is Successful or Authorized (IC-INV-02), and the order has no shipment (Proposed); it calls IOrderProcessingService.CancelOrderAsync(order, notifyCustomer: true), which returns the stock (the call reaches the CHK-003 IOrderProcessingService override, OVR-REG). CancelOrderAsync does not void or refund payments; a payment that succeeds after the cancellation is handled by PAY (SuccessfulAfterCancel); INV raises no refund trigger (refund triggers: RET-005). | INV-004 | FIT; INV-HOLD; consistent with BR-PAY-013 |
| BR-INV-021 | A hold never changes native stock. Stock available to a customer = GetTotalStockQuantityAsync (with the IC-INV-04 lot rules) - active holds of other customers. The check is an IC-CHK-01 cart check provider called by the CHK-003 IShoppingCartService override (BR-CHK-015, decision OVR-REG); INV overrides no cart method. When the native stock check passes but other customers' holds make the quantity unavailable, INV adds Inv.HeldByOthers; when the native check already produced ShoppingCart.OutOfStock or ShoppingCart.QuantityExceedsStock and other customers hold the product, INV, as the registered replacer of those two warnings, replaces that warning with Inv.HeldByOthers and the hold-adjusted quantity. Holds are created or renewed by an EntityInsertedEvent / EntityUpdatedEvent<ShoppingCartItem> consumer (cart) and an action filter on checkout start; a failed consumer only means no hold. A hold is active until its expiry time; expired holds are ignored even before the release task runs. Holds become Converted on order placement, or Released on expiry, removal from the cart (EntityDeletedEvent<ShoppingCartItem>) or a Listing.Withdrawn release job. | INV-004 | D; FC-M26-002; FC-M03-005; OVR-REG; FIT (ShoppingCartService.cs:1141, 1648, 1706); Proposed (formula, consumers) |
| BR-INV-022 | At most the configured number of reminders is sent per order, at the configured interval; none is sent once the order is paid, authorised or cancelled. | INV-004 | D; Proposed |
| BR-INV-023 | Native 5.00 unpaid-order functions stay off while INV-004 owns the unpaid-order timeout and reminders: OrderSettings.AutoCancelEnabled false and ReminderSettings.PendingOrdersEnabled false in every store; the pack validation (PLT-003) refuses a pack that switches either on for a client that uses INV-004. | INV-004 | INV-HOLD; FIT (AutoCancelOrdersTask.cs:56-122; ProcessPendingOrdersTask.cs:54-164); Proposed (pack validation); VER-500 |
| BR-INV-030 | Native admin pages that change a stock quantity are intercepted by a global IAsyncActionFilter registered by the INV plugin for Admin ProductController.Edit [POST], BulkEditSave [POST], ProductAttributeCombinationEditPopup [POST], ProductAttributeCombinationCreatePopup [POST] and ImportExcel [POST]. A post that changes a stock quantity (product, warehouse or combination) is refused before the action runs, with message Inv.UseStockAdjustment; ImportExcel is allowed only with Inventory.Core.Adjustments.Approve. Native order flows (placement, cancellation, shipment, order edit, deletion) are not intercepted. The native return-request edit (ReturnedQuantity, which adjusts stock) is intercepted by RET (BR-RET-001), not by INV. Every INV action filter is listed in the ADM extension register (BR-ADM-001). A ModelReceivedEvent veto is not used because BulkEditSave and ImportExcel do not check ModelState. | INV-001, INV-005 | FIT (ProductController.cs:983, 1227, 3061, 3887, 4047; 5.00.1 bulk edit sets StockQuantity with no history entry, ProductController.cs:4382) |
| BR-INV-031 | Every INV movement writes a stock history message in the form "<document type> <document reference> <reason code>" (Proposed) and an INV record that holds the user, time, reason, note and document. | INV-001, INV-005 to INV-012 | D; Proposed |
| BR-INV-032 | After an INV movement the INV service applies the same rules as native AdjustInventoryAsync: LowStockActivity against MinStockQuantity, QuantityBelow store-owner and vendor emails when the change lowers stock below NotifyAdminForQuantityBelow, and back-in-stock notifications when available stock rises from 0 or below to above 0. | INV-003, INV-005 | FIT (ProductService.cs:1814-1832; ProductController.cs:1361-1370); Proposed |
| BR-INV-033 | An adjustment whose size is above the approval threshold needs approval by a user with Inventory.Core.Adjustments.Approve who is not the requester. Document-backed movements (receipt, transfer, count posting below the threshold, ERP sync, RET-004 return restock) do not need a separate approval. | INV-005, INV-008 | D; FC-M26-007; Proposed (segregation, exemptions) |
| BR-INV-034 | For a product that uses multiple warehouses, an INV movement changes ProductWarehouseInventory.StockQuantity of the named warehouse through UpdateProductWarehouseInventoryAsync and writes AddStockQuantityHistoryEntryAsync for that warehouse; it never calls AdjustInventoryAsync, which for such products changes ReservedQuantity and spreads the quantity over warehouses. | INV-005 to INV-008, INV-012 | FIT (ProductService.cs:1795-1803, 406-483) |
| BR-INV-040 | A receipt adds only accepted quantities to stock; shortages, damaged units, failed inspection and over-receipts are discrepancies; a receipt above the open quantity plus tolerance is refused. | INV-006 | D; Proposed (tolerance) |
| BR-INV-050 | Transfer dispatch lowers the source warehouse; in-transit units are available nowhere; receipt raises the destination warehouse; a shortfall becomes an adjustment request with reason Lost in transit. | INV-007 | D; FC-M26-006; Proposed (shortfall) |
| BR-INV-060 | Count variance = counted quantity - (system quantity at count creation + net movements in stock history since then); variances are posted as adjustments with reason Count variance under BR-INV-033. | INV-008 | D; Proposed (formula) |
| BR-INV-070 | Lots are recorded for products with ManageInventoryMethod ManageStock only. Lot quantity rises at receipt and falls at shipment, disposal or adjustment. Shipment allocation is captured through IC-INV-07 (Capture before the shipment insert, Confirm after the shipment items are saved, Cancel when the insert is refused or fails), called by the INV filter on Admin OrderController.AddShipment [POST] and by every LOG shipment path (BR-LOG-003); a lot quantity or serial number in an open capture cannot be captured again; captures run under ILocker key 'inv-product-{ProductId}'. A shipment item of a tracked product saved without a confirmed capture is a capture exception. Per warehouse, sum of lot quantities = native stock + quantity placed but not yet shipped; differences are exceptions. Only Released lots can be shipped. | INV-009, INV-010, INV-011 | D; FIT (OrderController.cs:2024-2032); Proposed (shipment capture, invariant) |
| BR-INV-071 | Unsellable lot statuses are Quarantine, Blocked, Expired and Recalled. The INV sellable-stock provider (IC-INV-04), called by the CAT-002 IProductService override of GetTotalStockQuantityAsync (decision OVR-REG), subtracts the quantity of unsellable lots (per warehouse when a warehouse is given); INV does not override IProductService. Shipment lot selection is pre-filled by FEFO: earliest expiry first, then earliest receipt. | INV-009, INV-011 | D; FC-M26-011; FIT (ProductService.cs:1480); OVR-REG |
| BR-INV-080 | Serial-tracked products need exactly one distinct serial number per unit at receipt and at shipment; a serial number is unique per product. | INV-010 | D; FC-M26-010; Proposed (uniqueness) |
| BR-INV-090 | INV-012 runs on the INT-005 framework (IC-INT-03). Inbound sync messages are applied once per external message ID (BR-INT-021); the master of record is set per data type (stock level, movement, purchase order, valuation) as BR-INT-020 defines; every inbound stock change is posted through IC-INV-01 (BR-INV-001, BR-INV-034), never by writing stock fields; outbound messages are written to the single INT-004 outbox through IC-INT-09 Enqueue (channel stock sync) and follow the INT-004 retry, dead-letter and replay rules (SM-INT-01, BR-INT-015); INV keeps a record of applied inbound message IDs and the conflict list only, and no outbound queue, retry state or dead-letter state of its own. | INV-012 | (BR-INT-020, BR-INT-021, IC-INT-03); BR-INT-015 (one outbox); Proposed; NFR-X-007 |
| BR-INV-100 | Units sold count order lines of orders placed in the period, excluding cancelled orders; sellable stock is GetTotalStockQuantityAsync (including BR-INV-071); a daily snapshot of sellable stock per product and warehouse is taken by a scheduled task. Snapshots and movements by reason are read by RPT-001 through IC-INV-06 (decision ANL-002-OWN); INV-013 does not report fast and slow movers or stock levels itself. | INV-013 | ANL-002-OWN; Proposed |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-INV-01 | UnpaidOrderWatch | (none) | order placed with a payment method that has a payment window | — | Watching | — |
| SM-INV-01 | UnpaidOrderWatch | Watching | reminder due | PaymentStatus Pending; reminders sent < count | Watching | reminder sent; count + 1 |
| SM-INV-01 | UnpaidOrderWatch | Watching | order paid, authorised or cancelled elsewhere | — | Closed | no further reminders |
| SM-INV-01 | UnpaidOrderWatch | Watching | window expires | action = Cancel; BR-INV-020 guard passes; no shipment | Cancelled | CancelOrderAsync(order, notifyCustomer: true); stock returned; AUD-INV-004 |
| SM-INV-01 | UnpaidOrderWatch | Watching | window expires | action = Cancel; payment guard fails | Closed | no change to the order |
| SM-INV-01 | UnpaidOrderWatch | Watching | window expires | action = Cancel and a shipment exists, or action = Flag | Flagged | order note; listed for follow-up |
| SM-INV-01 | UnpaidOrderWatch | Watching | window expires | action = Remind | Expired | final reminder; order stays payable |
| SM-INV-01 | UnpaidOrderWatch | Flagged | staff release | Inventory.Core.UnpaidOrders.CreateEditDelete; BR-INV-020 guard passes | Cancelled | CancelOrderAsync(order, notifyCustomer: true); AUD-INV-004 |
| SM-INV-01 | UnpaidOrderWatch | Flagged | staff dismiss with reason / order paid | — | Closed | AUD-INV-004 |
| SM-INV-02 | InventoryHold | (none) | add to cart (cart hold on) or checkout start | product manages stock; no backorders | Active | expiry = now + window |
| SM-INV-02 | InventoryHold | Active | checkout start or renewal | — | Active | expiry renewed |
| SM-INV-02 | InventoryHold | Active | order placed | — | Converted | — |
| SM-INV-02 | InventoryHold | Active | expiry time passed / item removed from cart | — | Released | — |
| SM-INV-03 | StockAdjustment | (none) | submitted | reason given; BR-INV-033 size at or below threshold | Applied | stock changed (BR-INV-001, BR-INV-034); AUD-INV-001 |
| SM-INV-03 | StockAdjustment | (none) | submitted | size above threshold | Requested | approvers notified |
| SM-INV-03 | StockAdjustment | Requested | approved | approver is not the requester | Applied | stock changed; AUD-INV-001 |
| SM-INV-03 | StockAdjustment | Requested | rejected with reason / withdrawn by requester | — | Rejected | no stock change |
| SM-INV-04 | PurchaseOrder | (none) | received from ERP or entered | — | Open | — |
| SM-INV-04 | PurchaseOrder | Open / PartiallyReceived | receipt posted | BR-INV-040 | PartiallyReceived / Received | accepted quantity to stock |
| SM-INV-04 | PurchaseOrder | Open / PartiallyReceived | closed by staff or ERP | — | Closed | open quantity cancelled |
| SM-INV-05 | StockTransfer | Draft | dispatched | source has available stock | InTransit | source stock lowered |
| SM-INV-05 | StockTransfer | Draft | cancelled | — | Cancelled | — |
| SM-INV-05 | StockTransfer | InTransit | received in full | — | Received | destination stock raised |
| SM-INV-05 | StockTransfer | InTransit | received with shortfall | — | ReceivedWithDiscrepancy | destination raised by received units; adjustment request Lost in transit |
| SM-INV-06 | CycleCount | (none) | plan due | — | Open | lines created with system quantity |
| SM-INV-06 | CycleCount | Open | counts entered and submitted | all lines counted | Submitted | variances calculated |
| SM-INV-06 | CycleCount | Submitted | recount requested | variance above recount threshold | Open | recount lines |
| SM-INV-06 | CycleCount | Submitted | posted | — | Posted | variance adjustments (BR-INV-060); AUD-INV-007 |
| SM-INV-07 | Lot | (none) | received | inspection required | Quarantine | not sellable |
| SM-INV-07 | Lot | (none) | received | no inspection required | Released | sellable |
| SM-INV-07 | Lot | Quarantine | quality result Passed | — | Released | sellable |
| SM-INV-07 | Lot | Quarantine / Released | quality result Failed or block | Inventory.Core.Lots.CreateEditDelete | Blocked | not sellable; AUD-INV-008 |
| SM-INV-07 | Lot | Blocked | released after review | Inventory.Core.Lots.CreateEditDelete | Released | sellable; AUD-INV-008 |
| SM-INV-07 | Lot | Released | expiry date reached | — | Expired | not sellable |
| SM-INV-07 | Lot | Released / Blocked / Quarantine | recall confirmed | Inventory.Core.Lots.CreateEditDelete | Recalled | not sellable; recipient list produced |
| SM-INV-08 | SerialNumber | (none) | received | — | InStock | — |
| SM-INV-08 | SerialNumber | InStock | shipped | — | Shipped | linked to shipment item, order, customer |
| SM-INV-08 | SerialNumber | Shipped | returned and restocked (RET) | — | InStock | Returned event |
| SM-INV-08 | SerialNumber | InStock | written off by adjustment | — | WrittenOff | — |
| SM-INV-10 | ShipmentCapture | (none) | Capture accepted (IC-INV-07) | lots Released and serials InStock, none in another open capture | Open | quantities and serials kept from other captures |
| SM-INV-10 | ShipmentCapture | Open | Confirm after the shipment items are saved | — | Confirmed | LotAllocation rows; lot quantities lowered; serials Shipped |
| SM-INV-10 | ShipmentCapture | Open | Cancel (insert refused or failed) | — | Cancelled | no lot or serial change |
| SM-INV-10 | ShipmentCapture | Open | capture window passes without Confirm | window: setting, default not stated | Expired | listed as a capture exception; AUD-INV-012 |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| WarehouseExtension (new) | WarehouseId, Code (unique), Latitude, Longitude, FacilityType | INV-002 | One row per native Warehouse; Warehouse and Address are not altered; read by SRC and LOG through IC-INV-05 |
| InventoryHold (new) | Id, CustomerId, ProductId, CombinationId, Quantity, Source (Cart / Checkout), ExpiresOnUtc, Status (SM-INV-02), OrderId | INV-004 | Never changes native stock (BR-INV-021) |
| UnpaidOrderWatch (new) | OrderId, PaymentMethodSystemName, WindowEndsOnUtc, RemindersSent, LastReminderOnUtc, Action, Status (SM-INV-01), Reason | INV-004 | Reads Order.PaymentStatus and PAY PaymentTransaction (IC-INV-02); cancels through IOrderProcessingService |
| StockAdjustment / AdjustmentReason (new) | Adjustment: Id, ProductId, CombinationId, WarehouseId, QuantityChange, ReasonCode, Note, DocumentType, DocumentRef, ExternalMessageId, Status (SM-INV-03), RequestedBy, ApprovedBy, RequestedOnUtc, AppliedOnUtc; Reason: Code, Name (localised), IsActive | INV-005 to INV-008, INV-012 | Each applied adjustment has a native StockQuantityHistory entry (BR-INV-031) |
| PurchaseOrder / PurchaseOrderLine (new) | PO: Id, ExternalRef, SupplierName, WarehouseId, Status (SM-INV-04); Line: ProductId, CombinationId, OrderedQty, ReceivedQty | INV-006 | Minimal record; no native purchase-order entity exists |
| GoodsReceipt / GoodsReceiptLine (new) | Receipt: Id, PurchaseOrderId, WarehouseId, ReceivedBy, PostedOnUtc; Line: ProductId, AcceptedQty, ShortQty, DamagedQty, InspectionStatus, LotId | INV-006 | The location entered at receipt is written to LOG-009 ProductShelfLocation (owner LOG) |
| StockTransfer / StockTransferLine (new) | Transfer: Id, FromWarehouseId, ToWarehouseId, Status (SM-INV-05), DispatchedBy, ReceivedBy; Line: ProductId, Quantity, ReceivedQuantity, LotId | INV-007 | Products with UseMultipleWarehouses only |
| CountPlan / CycleCount / CycleCountLine (new) | Plan: Selection, Frequency, Type (Partial / Full), Blind; Count: Status (SM-INV-06), CreatedOnUtc; Line: ProductId, WarehouseId, SystemQty, CountedQty, Variance | INV-008 | |
| Lot / LotStock / LotQualityResult / LotCustodyEvent / LotAllocation (new) | Lot: Id, ProductId, LotNumber, ManufactureDate, ExpiryDate, Status (SM-INV-07); LotStock: LotId, WarehouseId, Quantity; QualityResult: LotId, Test, Result, RecordedBy; Custody: LotId, Holder, FromUtc, ToUtc, Note; Allocation: LotId, ShipmentItemId, OrderItemId, CustomerId, Quantity | INV-009, INV-011 | Side tables; sellable stock via the IC-INV-04 provider to the CAT-002 IProductService override |
| ShipmentCapture / ShipmentCaptureLine (new) | Capture: Id, OrderId, WarehouseId, Status (SM-INV-10), CreatedOnUtc, CreatedBy, Caller (AdminFilter / LOG); Line: OrderItemId, Quantity, LotId or SerialId, ShipmentItemId (set at Confirm) | INV-009, INV-010 | Read by the reconciliation (BR-INV-070); lots and serials of Open captures are not available to other captures |
| SerialNumber / SerialEvent (new) | Serial: Id, ProductId, Serial, WarehouseId, Status (SM-INV-08), ShipmentItemId, OrderItemId, CustomerId; Event: SerialId, Type, OnUtc, Reference | INV-010 | |
| SyncConnectorConfig / SyncInboundRecord / SyncConflict (new) | Config: Connector, DataType, Direction, MasterSystem; InboundRecord: ExternalMessageId, DataType, Result (Applied / Refused / Conflict), AppliedOnUtc; Conflict: SKU, Warehouse, PlatformValue, ExternalValue, Resolution | INV-012 | Credentials stored encrypted per instance, never in packs (CFG-01); outbound messages are INT-004 IntegrationMessage rows (IC-INT-09), retry policy is the INT-004 policy; no INV outbound queue |
| StockSnapshot (new) | Date, ProductId, WarehouseId, SellableQty | INV-013 | Written daily by a scheduled task; read by RPT-001 through IC-INV-06 |
| Stock history (native) | StockQuantityHistory: ProductId, CombinationId, WarehouseId, QuantityAdjustment, StockQuantity, Message, CreatedOnUtc | INV-001 to INV-012 | Reused; no user field (user on the INV record) |
| Per-warehouse stock (native) | ProductWarehouseInventory: ProductId, WarehouseId, StockQuantity, ReservedQuantity | INV-002, INV-005 to INV-008 | Reused; no core change |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Warehouse pack settings | Warehouse entities; batch/lot, serial, expiry and cycle-count settings (new); WMS/ERP sync config | vertical (Warehouse pack) → client | INV-002 / INV-009 / INV-011 / INV-012 | Warehouse pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Inventory method, backorders, stock display | Product.ManageInventoryMethodId, BackorderModeId, DisplayStockAvailability, DisplayStockQuantity (native, per product) | product data | Not stated | Not stated |
| Low-stock levels and activity | Product / ProductAttributeCombination NotifyAdminForQuantityBelow, MinStockQuantity; Product.LowStockActivityId (native) | product data | Not stated | Set by the seller (FR-055); values not stated |
| Re-enable after stock returns | CatalogSettings.PublishBackProductWhenCancellingOrders (native) | client -> store | Not stated | Not stated |
| Multiple warehouses per product | Product.UseMultipleWarehouses, Product.WarehouseId (native) | product data | Not stated (factories: G-ORG) | Not stated |
| Warehouse code and coordinates | WarehouseExtension (new) | client | Not stated | Not stated |
| Cart hold on / off; cart hold window; checkout hold window | INV settings (new) | client | Not stated | Not stated |
| Payment window, reminder count and interval, expiry action (Remind / Flag / Cancel) per payment method | INV settings (new; owner INV-004) | client | Not stated (M-Pesa, bank transfer: values not stated) | Not stated (mobile money, bank transfer: values not stated) |
| Native automatic cancellation and pending-order reminders (5.00) | ordersettings.autocancelenabled, ordersettings.autocanceldelay, ordersettings.autocancelignoredpaymentmethods, ordersettings.autocancelrestoreshoppingcart; remindersettings.pendingordersenabled (native) | store | Off (BR-INV-023) | Off (BR-INV-023) |
| Unpaid-order task and hold-release task run interval | ScheduleTask.Seconds of the INV tasks (native mechanism) | client instance | Not stated | Not stated |
| Adjustment reason codes | AdjustmentReason (new) | global -> client | Not stated | Not stated |
| Adjustment approval threshold (quantity and / or value) | INV settings (new) | client | Not stated | Not stated |
| Receipts without purchase order allowed; over-receipt tolerance; inspection per category | INV settings (new) | client | Not stated | Not stated |
| Count plans, blind counting, recount threshold | CountPlan, INV settings (new) | client | Not stated | Not stated |
| Lot tracking, serial tracking per product | INV product settings (new) | vertical (Warehouse pack) -> client | Not stated | Not stated |
| Shipment capture window (Open capture expires without Confirm) | INV settings (new) | client | Not stated | Not stated |
| Near-expiry window; expiry task | INV settings (new) | client | Not stated | Not stated |
| WMS / ERP connector, direction and master per data type, retry policy, valuation method, purchase triggers | SyncConnectorConfig (new) on the INT-005 framework; connector credentials are settings flagged secret (BR-PLT-013) | client instance | ERP not named (KG-03) | Not stated (MG-09) |
| Feature state per store | productfeature.<prd-id> (IC-PLT-02) for INV-001 to INV-013 | store -> shared | Not stated | Not stated |
| Analytics period, dead-stock window, ABC cut-offs, top / bottom list size | INV settings (new) | client | Not stated | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Product page availability text; cart stock warnings (native) and hold warning | INV-001, INV-004 | Native + INV message |
| Storefront | Unpaid-order reminder link to the pay-again page (PAY-011) | INV-004 | PAY page |
| Admin / seller portal | Product inventory section (native) with stock fields guarded by BR-INV-030 | INV-001, INV-003, INV-005 | Native page, INV filter |
| Admin / seller portal | Stock by warehouse; stock history (native tab) with INV reasons; holds | INV-001, INV-002, INV-004 | Native tab extended + new view |
| Admin | Warehouses with code and coordinates | INV-002 | Native page extended |
| Admin / seller portal | Low-stock report | INV-003 | Native |
| Admin | Unpaid-order list | INV-004 | New |
| Admin / seller portal | Stock adjustments and approval queue | INV-005 | New |
| Admin | Purchase orders and goods receipts, inspection queue | INV-006 | New |
| Admin | Transfers; cycle counts and count sheets | INV-007, INV-008 | New (P2) |
| Admin | Lots: quality results, custody, recall list; near-expiry list | INV-009, INV-011 | New (P2) |
| Admin | Serial number lookup | INV-010 | New (P2) |
| Admin — order shipment | Lot and serial capture on shipment creation | INV-009, INV-010, INV-011 | Native page extended, INV filter |
| Admin | Synchronisation monitor: applied inbound messages and conflicts; outbound messages are shown in the INT-004 message log | INV-012 | New |
| Admin / seller portal | Inventory analytics reports (sell rate, days of cover, stock-outs, dead stock, ABC); the fast / slow mover and stock-level dashboard is RPT-001 (ANL-002-OWN) | INV-013 | New |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Inv.HeldByOthers | Only {0} of this item can be added now because other customers are completing their purchase. | AC-INV-004-01-02, AC-INV-004-01-03, AC-INV-004-01-09 |
| Inv.UnpaidOrderReminder | Your order {0} is waiting for payment. Please complete your payment by {1}. | AC-INV-004-02-01 (default content of event code Inv.UnpaidOrderReminder, registered with TRK through IC-TRK-04 RegisterEventCode; TRK holds the channel variants) |
| Inv.UseStockAdjustment | Stock quantities are changed through a stock adjustment. Your changes were not saved. | AC-INV-005-03-01, AC-INV-005-03-02 |
| Inv.AdjustmentReasonRequired | Select a reason for this stock adjustment. | AC-INV-005-01-02 |
| Inv.AdjustmentBelowZero | This adjustment would make the available stock negative. | AC-INV-005-01-04 |
| Inv.AdjustmentNeedsApproval | This adjustment needs approval before the stock changes. | AC-INV-005-02-01 |
| Inv.CannotApproveOwn | You cannot approve an adjustment you requested. | AC-INV-005-02-02 |
| Inv.WarehouseCodeDuplicate | The warehouse code is empty or already used. | AC-INV-002-02-01 |
| Inv.CoordinatesInvalid | Latitude must be between -90 and 90 and longitude between -180 and 180. | AC-INV-002-02-02 |
| Inv.ReceiptWithoutPo | A receipt must refer to a purchase order. | AC-INV-006-01-02 |
| Inv.OverReceipt | The quantity received is more than the quantity still open on the purchase order. | AC-INV-006-02-03 |
| Inv.TransferInsufficientStock | The source warehouse does not have enough available stock for this transfer. | AC-INV-007-01-02 |
| Inv.LotRequired | Enter the lot number, manufacture date and expiry date. | AC-INV-006-01-03, AC-INV-009-01-01, AC-INV-009-03-03 |
| Inv.LotNotSellable | This lot cannot be shipped because it is not released. | AC-INV-009-03-01, AC-INV-009-03-03 |
| Inv.SerialCountMismatch | Enter one serial number for each unit. | AC-INV-006-01-03, AC-INV-010-02-01 (IC-INV-07) |
| Inv.SerialNotAvailable | This serial number is unknown or not in stock. | AC-INV-010-01-02 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Native texts used by criteria (Products.Availability.*, ShoppingCart.OutOfStock, ShoppingCart.QuantityExceedsStock) are native locale resources.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| WMS / ERP connector (INV-012) | PullPurchaseOrders, PullStockLevels, PullMovements, PushMovements, PushValuation, PushPurchaseTrigger, Acknowledge (IC-INV-03) | KTDA ERP (not named, KG-03); Malawi Post (not stated, MG-09) | On the INT-005 connector framework (IC-INT-03, BR-INT-020, BR-INT-021); outbound messages through the INT-004 outbox (IC-INT-09, BR-INT-015); Misc.Dynamics365 is a stub (PAID-STUB) |
| PAY payment state (INV-004) | HasSuccessfulOrAuthorizedTransaction (IC-INV-02) | PAY module | Internal |
| Product and cart service overrides (INV-004, INV-009, INV-011) | Sellable-stock adjuster (IC-CAT-04; INV side IC-INV-04); cart check provider and stock-warning replacer (IC-CHK-01) | CAT-002, CHK-003 (decision OVR-REG) | Internal; registered in the ADM extension register (BR-ADM-001) |
| Warehouse location and stock-movement data | GetWarehouseLocation (IC-INV-05); GetStockMovementData (IC-INV-06) | SRC-004, LOG-002, LOG-008; RPT-001 | Internal, read only |
| Lot and serial capture (INV-009, INV-010) | Capture / Confirm / Cancel (IC-INV-07) | INV AddShipment filter; LOG-009 (AC-LOG-009-03-03, BR-LOG-003) | Internal |
| Notifications (INV-003, INV-004) | Low-stock and back-in-stock emails (native templates through IWorkflowMessageService, owned by TRK-005); unpaid-order reminder through IC-TRK-04 SendEvent (event code Inv.UnpaidOrderReminder, registered by INV); channels, SMS through CHN-005 and TRK-006 opt-outs are applied by TRK | TRK-005 | Internal |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-INV-01 | PostMovement | Product, combination (optional), warehouse (optional), quantity change, reason code, document type and reference, actor, external message ID (optional) | Applied / Requested / Refused with reason, adjustment ID | Reason missing, below zero, product not managed, duplicate external ID | INV service; calls AdjustInventoryAsync (single warehouse, combinations) or UpdateProductWarehouseInventoryAsync + AddStockQuantityHistoryEntryAsync (multiple warehouses), then BR-INV-032. Callers: INV-005 to INV-012, RET-004 (reason Return, lot or serial where tracked) |
| IC-INV-02 | HasSuccessfulOrAuthorizedTransaction | OrderId | true / false | — | Read service provided by PAY over PaymentTransaction (PRD-PAY-011); called by INV-004 inside the ILocker key 'pay-order-{OrderId}' |
| IC-INV-03 | PullPurchaseOrders / PullStockLevels / PullMovements | Since (timestamp or cursor), warehouse codes | Lines with external message ID | Unavailable, authentication, mapping (unknown SKU or warehouse code) | INV data types carried by the INT-005 ERP connector (IC-INT-03 PullChanges); IScheduleTask polling or inbound endpoint; BR-INT-020, BR-INT-021 |
| IC-INV-03 | PushMovements / PushValuation / PushPurchaseTrigger / Acknowledge | Movement, valuation or trigger records with message IDs | Acknowledged / Failed with reason | Unavailable, rejected | INT-005 ERP connector (IC-INT-03 PushChanges); outbound queue processed by an IScheduleTask |
| IC-INV-04 | Sellable-stock adjuster (INV side of IC-CAT-04) | Product, warehouse id, useReservedQuantity, native total from GetTotalStockQuantityAsync | Adjusted total stock quantity: native total minus the quantity of unsellable lots (BR-INV-071), not below zero | — | Implemented by INV-009 / INV-011 as an IC-CAT-04 sellable-stock adjuster; called by the CAT-002 IProductService.GetTotalStockQuantityAsync override after the native method (decision OVR-REG, BR-CAT-031); INV does not override IProductService |
| IC-INV-05 | GetWarehouseLocation | Warehouse ID or code | Code, latitude, longitude, facility type, address ID | Unknown warehouse | INV read service over WarehouseExtension; used by SRC-004, LOG-002 (BR-LOG-011) and LOG-008 (BR-LOG-061) |
| IC-INV-07 | Lot and serial capture for shipments: Capture / Confirm / Cancel | Capture: order, warehouse, lines (order item, quantity, chosen lots or serial numbers; lots pre-filled by FEFO when not given); Confirm: capture reference, saved shipment items; Cancel: capture reference, reason | Capture: capture reference, or refusal with message key (Inv.LotRequired, Inv.LotNotSellable, Inv.SerialCountMismatch, Inv.SerialNotAvailable); Confirm and Cancel: done | Capture refused; Confirm on a capture that is not Open (refused, listed as a capture exception) | INV service (BR-INV-070, BR-INV-080, SM-INV-10); called by the INV action filter on Admin OrderController.AddShipment [POST] and by LOG on every LOG shipment path (AC-LOG-009-03-03, BR-LOG-003); lines of products that are neither lot- nor serial-tracked are accepted unchanged |
| IC-INV-06 | GetStockMovementData | Period, store, vendor (optional), product and warehouse filter | Daily sellable-stock snapshots, movements by reason and document type, current sellable stock per product and warehouse | Period too long (limit is a setting, default not stated) | INV read service over StockSnapshot, StockQuantityHistory and INV records; used by RPT-001 (decision ANL-002-OWN) |

Signatures (C# interfaces) are produced at the start of the L2 build and approved by the tech lead; this table fixes the operations and their nopCommerce mapping. Under decision OVR-REG (Proposed) INV overrides no nopCommerce service: IC-INV-04 is the INV implementation of the CAT IC-CAT-04 sellable-stock adjuster (CAT-002 IProductService host), and the INV-004 hold check implements IC-CHK-01 (cart check provider and registered replacer of the native stock warnings) of the CHK-003 IShoppingCartService override (BR-CHK-015). IC-INV-07 is the only way lots and serial numbers are captured for a shipment; it is not an IC-ORD-11 shipment guard. INV also uses IC-PLT-02 (feature state), IC-SEC-01 (audit), IC-INT-03 (ERP connector), IC-INT-09 (outbox Enqueue, INV-012) and IC-TRK-04 (SendEvent, RegisterEventCode).

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Stock lowered at placement | Native AdjustInventoryAsync inside PlaceOrderAsync; OrderPlacedEvent | INV-004 consumer sets holds Converted; INV-012 consumer enqueues an outbound movement |
| Cart line added, changed or removed | EntityInsertedEvent / EntityUpdatedEvent / EntityDeletedEvent<ShoppingCartItem> (native repository events) | INV-004 consumer creates, renews or releases the hold (BR-INV-021); the stock check itself is the IC-CHK-01 provider, not a consumer |
| Listing withdrawn | Listing.Withdrawn (CAT event, CAT-024; not native) | INV-004 consumer enqueues a hold-release job for the product only |
| Order cancelled | OrderStatusChangedEvent (raised by CancelOrderAsync); stock returned by ReturnOrderStockAsync | INV-012 enqueues; INV-004 watch closed |
| Shipment shipped (multi-warehouse booking) | Native BookReservedInventoryAsync in ShipAsync; ShipmentSentEvent | INV-012 enqueues |
| Shipment creation (lot and serial capture) | INV action filter on Admin OrderController.AddShipment [POST] (before: IC-INV-07 Capture; after success: Confirm); LOG calls IC-INV-07 on its own paths; ShipmentCreatedEvent is notification only | INV-009, INV-010 |
| Shipment item saved | EntityInsertedEvent<ShipmentItem> (native repository event, every path) | INV consumer enqueues a capture-exception check for lot- or serial-tracked items without a confirmed capture (AC-INV-009-03-04) |
| Native stock edit refused | INV action filter on Admin ProductController pages (BR-INV-030) | AUD-INV-002 |
| Inventory.AdjustmentApplied / Requested / Rejected | None (INV events only) | Approval queue, INV-012, TRK |
| Inventory.UnpaidOrderFlagged / Cancelled | OrderStatusChangedEvent for the cancellation | Unpaid-order list, TRK |
| Inventory.LotBlocked / Expired / Recalled | None (INV events only) | Near-expiry list, recall list, TRK |
| Low stock | Native QuantityBelow emails from AdjustInventoryAsync; INV applies the same for its movements (BR-INV-032) | Store owner, seller |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Unpaid-order timeout and payment success callback at the same time | INV-004, PAY-004 | Both take ILocker.PerformActionWithLockAsync with key 'pay-order-{OrderId}' (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 §6.4); whichever runs second re-reads the order and the transactions: the timeout sees Paid or Authorized and does not cancel; the callback sees Cancelled and PAY records SuccessfulAfterCancel |
| Two shoppers try to hold the last units | INV-004 | The IC-CHK-01 provider check and the hold creation each run under ILocker key 'inv-product-{ProductId}'; because the cart line is saved between the check and the hold, two holds may together exceed available stock for a short time; the provider check at placement (GetShoppingCartItemWarningsAsync) and the native stock decrement stay the final control |
| INV movement and order placement on the same product at the same time | INV-005 to INV-008, INV-012 | INV movements run under ILocker key 'inv-product-{ProductId}'; native placement does not take that key and updates Product.StockQuantity by read-modify-write, so a lost update stays possible until the PLT-027 row version on core tables is in place (L1 §6.3); the reconciliation of BR-INV-070 and count variances detect it |
| Two approvers act on the same adjustment | INV-005 | StockAdjustment carries its own row version (plugin table); the second approval fails and re-reads |
| Transfer dispatch and order reservation in the same warehouse | INV-007 | Dispatch re-checks available stock (stock - reserved) under ILocker key 'inv-product-{ProductId}' |
| Inbound ERP stock level and a local movement for the same SKU | INV-012 | Inbound messages are applied under the same product key; the master-system rule (BR-INV-090) decides conflicts; duplicate external IDs are ignored |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Stock below NotifyAdminForQuantityBelow | Store owner; seller | Email (native QuantityBelow.StoreOwnerNotification / QuantityBelow.VendorNotification) | INV-003 |
| Unpaid-order reminder | Shopper | Channels of event code Inv.UnpaidOrderReminder as set in TRK-005 (IC-TRK-04); TRK-006 opt-outs apply | INV-004 |
| Unpaid order cancelled by timeout | Shopper | Email (native OrderCancelled.CustomerNotification) | INV-004 |
| Adjustment awaiting approval | Approvers | Admin notification | INV-005 |
| Inspection due; lot near expiry; lot recalled | Quality staff; stock staff | Admin notification | INV-006, INV-009, INV-011 |
| Outbound stock message dead-lettered | Administrators (INT-004 recipients) | INT-004 dead-letter notification through TRK-005 (event code Int.Core.MessageDeadLettered; INT owns it) | INV-012 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Low-stock report (native) | INV-003 | D; FIT |
| Stock history (native) | INV-001 | D; FIT |
| Unpaid-order list | INV-004 | Proposed |
| Adjustments by reason and user | INV-005 | D |
| Receipt discrepancies | INV-006 | D |
| Count variances | INV-008 | D |
| Recall list per lot | INV-009 | D |
| Sell rate and days of cover, stock-outs, dead stock, ABC | INV-013 | FC-M26-014 |
| Stock-movement data for the RPT-001 fast / slow mover and stock-level reports (IC-INV-06) | INV-013 | ANL-002-OWN |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-INV-001 | Stock adjustment requested / approved / rejected / applied | Stock staff / seller / approver / system | StockAdjustment | product, warehouse, change, reason, document, requester, approver |
| AUD-INV-002 | Native stock edit refused | User | Product | page, product, attempted values |
| AUD-INV-003 | Warehouse code or coordinates changed | Administrator | WarehouseExtension | old and new values |
| AUD-INV-004 | Unpaid-order action: reminder, flag, cancel, closed, dismissed, released | System / finance staff | UnpaidOrderWatch, Order | action, guard result, reason |
| AUD-INV-005 | Transfer dispatched / received / cancelled | Warehouse staff | StockTransfer | quantities, warehouses |
| AUD-INV-006 | Goods receipt posted with discrepancies | Warehouse staff | GoodsReceipt | accepted, short, damaged, inspection result |
| AUD-INV-007 | Count posted | Stock staff | CycleCount | variances, adjustments created |
| AUD-INV-008 | Lot status change, quality result, custody event, recall | Quality staff / system | Lot | old and new status, result, custody entry |
| AUD-INV-009 | Serial number status change or correction | Warehouse staff | SerialNumber | old and new status, reference |
| AUD-INV-010 | Inbound sync message applied / refused / conflict resolved | System / administrator | SyncInboundRecord, SyncConflict | external ID, result, resolution |
| AUD-INV-011 | INV setting changed (windows, actions, thresholds, reason codes) | Administrator | Setting | old and new values |
| AUD-INV-012 | Shipment capture exception raised or resolved (item without confirmed capture, expired capture) | System / warehouse or quality staff | ShipmentCapture, ShipmentItem | shipment item, product, lots or serials recorded, resolver |

Business events AUD-INV-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new values of INV plugin tables are captured by the SEC IRepository<> decorator (BR-SEC-010), so INV writes only through IRepository<> (BR-INV-003). The native activity log is not used as audit. Names and fields are Proposed. Native StockQuantityHistory stays the stock ledger; it records no user, so the user is in these events.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-INV-001 | Every stock change can be traced to an order, a document or a user with a reason. | REQ-KTDA-INV-001; NFR-X-003; BR-INV-001, BR-INV-031 | AC-INV-001-04-01; AC-INV-005-03-01; test note T-INV-02 |
| NFR-INV-002 | No oversell beyond the native rules under concurrent orders; on more than one web node the distributed lock (DistributedCacheConfig.Enabled) and the PLT-027 row version are required. | NFR-X-007; L1 §6.4 | Test note T-INV-04 |
| NFR-INV-003 | Synchronisation is idempotent and loses no message. | NFR-X-007; BR-INV-090 | AC-INV-012-01-03; AC-INV-012-03-01 |
| NFR-INV-004 | Response time of product and cart pages with holds and lot rules active: target Not stated in source — requires confirmation; measured in the load test. | NFR-X-009 | — (no target); test note T-INV-06 |
| NFR-INV-005 | Every INV text shown to users is a locale resource. | NFR-X-004 | §11.2 |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-INV-001 | P1 | — | |
| PRD-INV-002 | P1 | — | |
| PRD-INV-003 | P1 | — | |
| PRD-INV-004 | P1 | — | PRD-PAY-004 |
| PRD-INV-005 | P1 | — | |
| PRD-INV-006 | P1 | — | |
| PRD-INV-007 | P2 | — | |
| PRD-INV-008 | P2 | — | |
| PRD-INV-009 | P2 | PRD-CAT-002 | PRD-INV-011 |
| PRD-INV-010 | P2 | — | |
| PRD-INV-011 | P2 | PRD-INV-009, PRD-CAT-002 | |
| PRD-INV-012 | P1 | — | |
| PRD-INV-013 | P1 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-INV-01 | Unpaid-order timeout: for each action (Remind, Flag, Cancel) and for a payment success at the same moment, assert one outcome under the pay-order lock and correct stock (BR-INV-020). |
| T-INV-02 | Native bypass: try every native page in BR-INV-030 with and without a stock change; assert refusal only when stock changes and an audit entry. |
| T-INV-03 | Multi-warehouse: placement, shipment, cancellation, adjustment and transfer keep sum(stock - reserved) correct per warehouse (BR-INV-034). |
| T-INV-04 | Concurrency: parallel orders and adjustments on one product on two web nodes with the distributed lock; record any lost update for the PLT-027 decision. |
| T-INV-05 | Lots and serials: receipt, FEFO shipment, expiry, recall and reconciliation keep the BR-INV-070 invariant; shipments through the admin page and every LOG path go through IC-INV-07; a guard refusal leaves the capture Cancelled with no lot change; an API-created shipment item is listed as a capture exception. |
| T-INV-06 | Load: product and cart pages with many active holds and lots; report timings against the target once set. |
| T-INV-07 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-INV-08 | Permissions: each permission in §4 has an allow and a deny case (§4.1); vendors see only their own products. |
| T-INV-09 | Providers: with the CAT-002 and CHK-003 overrides installed, the INV providers change sellable stock and cart warnings only when their feature is on (IC-PLT-02); with holds of other customers the native stock warning is replaced, never shown twice; the ADM extension register shows no INV override of IProductService or IShoppingCartService. |
| T-INV-10 | Listing.Withdrawn: holds of the withdrawn product are Released by the job; a consumer failure leaves orders and payments unchanged. |
