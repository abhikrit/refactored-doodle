# L2 Module PRD — CAT: Catalogue and listings

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | CAT — Catalogue and listings |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Holds everything a shop sells: the category tree, the product record with its attributes, variants, bundles, media, translations, tax and trade fields, prices by customer group, quantity and currency, and service listings with booking slots. It controls how a listing is created (by staff, sellers, bulk files or other systems), checked against category rules and listing policy, approved, published, paused, withdrawn and archived, keeps every version, and shows the shopper what to expect before buying (delivery promise, seller, returns and dispute summary, reviews, questions and answers).

**In scope**

- Category tree, product master record, identifiers, product and specification attributes, variants, bundles (CAT-001 to CAT-007)
- Cloning and listing templates, bulk import and export with a validation report, PDF catalogue, catalogue API (CAT-008 to CAT-011)
- Price tiers, call-for-price entry to quotes, product tax category, cross-border trade fields (CAT-012 to CAT-015)
- Media, translated content, questions and answers, regulatory metadata and certificates, origin and provenance content (CAT-016 to CAT-020)
- Listing policy enforcement, lifecycle and approval, version history and autosave, availability and withdrawal, stale listings, seller moderation, seller listing wizard (CAT-021 to CAT-025, CAT-038, CAT-043)
- Service listings and service booking slots, listing geo-location (CAT-026 to CAT-028)
- Reviews and ratings, returnability flag, product-page delivery promise, catalogue audit view, promoted listings, catalogue analytics, product feeds (CAT-029 to CAT-035)
- B2B catalogue: segmentation by buyer channel, order quantity rules, customer and company price lists, company assortment, units of measure, fixed prices per currency (CAT-036, CAT-037, CAT-039 to CAT-042)
- Owner of three overridden nopCommerce services under decision OVR-REG: IProductService (CAT-002, the core product master record) and IPriceCalculationService and IOrderTotalCalculationService (CAT-042); other modules plug in as providers through IC-CAT-04, IC-CAT-05 and IC-CAT-06
- Booking service used by SVC and EGV for holds, direct bookings, moves, outcomes and release (IC-CAT-07)

**Not in this module**

| Item | Where it is |
|---|---|
| Keyword search, faceted filter display, search relevance, listing-card delivery promise, services browsing area, taxonomy governance | SRC module (PRD-SRC-001, SRC-003, SRC-014, SRC-018, SRC-020, SRC-016) |
| Stock tracking, stock holds and release, batches and expiry | INV module (PRD-INV-001, INV-004, INV-009, INV-011) |
| Request for quotation, quote negotiation and conversion | ORD module (PRD-ORD-012, ORD-013) — CAT-013 is only the product-page entry point |
| Contract packaging, forward contracts, requisitions | ORD module (PRD-ORD-015, ORD-016, ORD-022) |
| Seller application, verification, tiers, ratings, commission and fee rules, payouts; listing eligibility rules and seller pause reasons | SEL module (PRD-SEL-001, SEL-003, SEL-010, SEL-012, SEL-016 commission and fees, SEL-017 payouts) — SEL calls the CAT-022 gate and pause through IC-SEL-01 and IC-CAT-03 |
| Service pricing models, providers and resources, booking changes and no-shows, service order lifecycle and completion | SVC module (PRD-SVC-001, SVC-002, SVC-003, SVC-005) — CAT-026/027 provide the listing and the slot |
| Seller-managed discounts and promotional prices; content pages | MKT module (PRD-MKT-014, MKT-007) |
| Platform audit trail store | SEC module (PRD-SEC-004) — CAT-032 adds catalogue views and staff-view logging |
| Workflow engine and generic approval queues | ADM module (PRD-ADM-002, ADM-006) — decision WF-ENG |
| Public REST API framework (keys, limits, versions) | INT module (PRD-INT-001) — CAT-011 is the catalogue scope of it |
| Tax calculation; currencies and exchange rates; multi-currency settlement | PAY-020; PLT-010, PLT-024; PAY-023 |
| Estimated delivery time calculation | LOG module (PRD-LOG-005) — CAT-031 displays it |
| Return requests and dispute cases | RET module (PRD-RET-001, RET-007) |
| Export document set; Incoterms | DOC-006; ORD-026 |
| AI translation and AI listing help; translation management | AI-001, AI-002; PLT-025 |
| Web analytics and KPI dashboards | SRC-021; RPT-002 |
| Upload policy for every upload endpoint (allowed types, sizes, virus scan) | ADM module (PRD-ADM-008, BR-ADM-060) — CAT sets no upload filter of its own; product pictures use the ADM-008 context product picture (Admin ProductController.ProductPictureAdd) and product documents admin download, and the CAT admin upload actions are registered with ADM-008 (admin picture, admin download, data imports) |
| Cart warning host (IShoppingCartService override) | CHK module (PRD-CHK-003, decision OVR-REG) — CAT cart checks are providers (IC-CHK-01) |
| Sellable stock from lots; search filters and ordering | INV-009, INV-011; SRC module — providers of the CAT-002 IProductService host (IC-CAT-04) |
| Wallet balance and its ledger; insurance premium rules | PAY-009 (WAL-01 option (b)); FIN-003 — providers of the CAT-042 IOrderTotalCalculationService host (IC-CAT-06); CAT records only the adjustment amount applied to each order |
| Service location capture, booking changes, outcomes after confirmation | SVC-003, SVC-006 — through the CAT booking service (IC-CAT-07) |
| Appointments linked to e-Government applications | EGV-003 — stores the BookingId on its application; CAT-027 holds slots per outlet and service |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-CAT-001 | Category taxonomy | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CAT-002 | Product master record | B2B + B2C | P1 | Code-level | Custom plugin (DI override) | Core (always on) | | |
| PRD-CAT-003 | Identifier patterns | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-004 | Product and specification attributes | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CAT-005 | Category attribute schema and listing quality rules | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-006 | Variants and attribute combinations | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CAT-007 | Bundles and kits | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Engagement and loyalty pack | | |
| PRD-CAT-008 | Product cloning and listing templates | B2B + B2C | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-009 | Bulk import/export and PDF catalogue | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-010 | Import validation report | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-011 | Catalogue API | B2B + B2C | P1 | Licensed plugin | None | Commerce extensions pack | PRD-INT-001 | API-01, PAID-STUB, API-GW |
| PRD-CAT-012 | Price tiers by customer group and quantity | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CAT-013 | Call-for-price / negotiable flag | B2B | P1 | Code-level | Custom plugin + Theme/view override | B2B trade pack | | |
| PRD-CAT-014 | Product tax category | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CAT-015 | Cross-border trade fields | B2B | P1 | Code-level | Custom plugin | B2B trade pack | | |
| PRD-CAT-016 | Product media | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-CAT-017 | Localised product content | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CAT-018 | Product questions and answers | Seller / back-office | P2 | Code-level | Custom plugin + Theme/view override | Marketplace pack | | |
| PRD-CAT-019 | Regulatory metadata and certificates | B2B + B2C | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-020 | Origin and provenance content | B2B + B2C | P1 | Code-level | Custom plugin | Commerce extensions pack | | |
| PRD-CAT-021 | Listing policy enforcement | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-CAT-022 | Listing lifecycle and operator approval | Seller / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002, PRD-CAT-002 | WF-ENG |
| PRD-CAT-023 | Listing version history and autosave | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-024 | Listing availability and withdrawal | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-025 | Stale listing detection | Seller / back-office | P2 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-CAT-026 | Service listings | B2B + B2C | P1 | Code-level | Custom plugin | Services and bookings pack | | |
| PRD-CAT-027 | Service booking | B2B + B2C | P1 | Code-level | Custom plugin | Services and bookings pack | | FG-06 |
| PRD-CAT-028 | Listing geo-location | B2B + B2C | P2 | Code-level | Custom plugin | Services and bookings pack | | |
| PRD-CAT-029 | Product reviews and ratings | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CAT-030 | Product returnability flag | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CAT-031 | Product page delivery promise | B2B + B2C | P1 | Code-level | Theme/view override + Custom plugin | Core (always on) | PRD-LOG-005 | |
| PRD-CAT-032 | Catalogue audit log | B2B + B2C | P2 | Code-level | Custom plugin | Core (always on) | PRD-SEC-004 | |
| PRD-CAT-033 | Promoted listings with fees | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-CAT-034 | Catalogue analytics | B2B + B2C | P1 | Code-level | Custom plugin | Analytics pack | | PAID-STUB |
| PRD-CAT-035 | Listing syndication and product feeds | B2B + B2C | P2 | Code-level | Custom plugin | Commerce extensions pack | | |
| PRD-CAT-036 | Catalogue segmentation by buyer channel | B2B | P1 | Configuration | None | B2B trade pack | | |
| PRD-CAT-037 | Order quantity rules | B2B + B2C | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CAT-038 | Guided seller listing wizard | Seller / back-office | P1 | Code-level | Custom plugin + Theme/view override | Marketplace pack | | |
| PRD-CAT-039 | Customer and company price lists | B2B | P1 | Configuration | None | B2B trade pack | PRD-IAM-022 | PH-INF |
| PRD-CAT-040 | Company-specific assortment | B2B | P2 | Code-level | Custom plugin | B2B trade pack | PRD-IAM-022 | PH-INF |
| PRD-CAT-041 | Units of measure and pack selling | B2B | P1 | Code-level | Custom plugin; Core modification (conditional, decision UOM-01) | B2B trade pack | | PH-INF, UOM-01 |
| PRD-CAT-042 | Fixed prices per currency | B2B + B2C | P1 | Code-level | Custom plugin (DI override) | Core (always on) | | PH-INF |
| PRD-CAT-043 | Seller listing moderation | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-CAT-022 | WF-ENG |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Browses categories and product pages, asks questions, writes reviews, reports listings, books service slots, requests quotes | Guests / Registered (native) |
| Business buyer | Sees the catalogue segment, price list and assortment of the company; requests quotes for call-for-price items | Registered + B2B role (IAM-022) |
| Seller | Creates and edits own listings (wizard, form, import), submits them for approval, answers questions, requests promoted placements | Vendors (native role; native Catalog.ProductsCreateEditDelete and Catalog.ProductsImportExport are granted to Vendors by default) |
| Catalogue staff | Maintains the category tree, products, attribute schemas, imports and templates | Custom role per client (IAM-007); role name not stated in source (KG-16, MG-08) |
| Approver (moderator) | Works the moderation queue: approves, rejects or returns listings with reasons | Holder of Misc.Catalogue.Listings.Approve; role names not stated (KG-16, MG-08) |
| Compliance staff | Maintains regulatory metadata and certificates, decides on listing reports and takedowns, sets prohibited items | Custom role per client; not stated |
| Marketing staff | Approves promoted placements, configures feeds, reads catalogue analytics | Custom role per client; not stated |
| Client administrator | Sets catalogue settings, moderation queues, assignment rules, SKU patterns, upload limits | Administrators (native) |
| Service provider | Publishes service listings and booking slots (as a seller or as client staff) | Vendors or staff role (SVC-002 owns providers) |
| External system | ERP or partner system using the catalogue API; comparison sites and marketplaces receiving feeds; web analytics | External, via API-01 / CAT-035 / SRC-021 |
| Other product modules | SEL (eligibility, vendor pauses), INV (sellable stock), SRC (search filters and ordering), PAY (order-total deduction), SVC and EGV (bookings), ADM-006 (approval callbacks), DOC (tokens) call CAT contracts or register as providers | System (no user role) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Catalog.ProductsView / Catalog.ProductsCreateEditDelete (native) | Catalog | View; create, edit, delete products (vendors: own products only, native) | Administrators, Vendors (native default) |
| Catalog.ProductsImportExport (native) | Catalog | Import and export products, PDF catalogue; with CAT installed the import first runs the CAT-010 validation | Administrators, Vendors (native default; vendors also need vendorsettings.allowvendorstoimportproducts) |
| Catalog.CategoriesCreateEditDelete (native) | Catalog | Maintain the category tree | Administrators |
| Catalog.ProductReviewsCreateEditDelete (native) | Catalog | Approve, edit, reply to and delete reviews | Administrators |
| Misc.Catalogue.Listings.Approve | Catalog | Decide a moderation step: approve, reject, request changes (never on a listing the user submitted) | Administrators |
| Misc.Catalogue.Listings.Manage | Catalog | Publish an approved listing, pause, resume, withdraw with reason, archive, restore a version | Administrators |
| Misc.Catalogue.Moderation.CreateEditDelete | Configuration | Configure moderation queues, approval steps and assignment rules | Administrators |
| Misc.Catalogue.Schema.CreateEditDelete | Catalog | Draft category attribute schemas and required listing fields | Administrators |
| Misc.Catalogue.Schema.Approve | Catalog | Approve a schema change (second person) | Administrators |
| Misc.Catalogue.Policy.CreateEditDelete | Catalog | Maintain prohibited categories, items and terms; decide listing reports and takedown requests | Administrators |
| Misc.Catalogue.Compliance.CreateEditDelete | Catalog | Maintain regulatory metadata, certificates and compliance status | Administrators |
| Misc.Catalogue.Promotions.CreateEditDelete | Promotions | Approve promoted placements, set placement rules and fees | Administrators |
| Misc.Catalogue.Pricing.CreateEditDelete | Catalog | Maintain company assortments, units of measure and fixed currency prices, and view the pricing-conflicts list; price lists themselves use the native 5.00 permissions Catalog.PriceListsView, Catalog.PriceListsCreateEditDelete and Catalog.PriceListsImportExport | Administrators |
| Misc.Catalogue.Questions.CreateEditDelete | Catalog | Moderate product questions and answers | Administrators |
| Misc.Catalogue.Bookings.CreateEditDelete | Catalog | Maintain booking slots and capacity of service listings | Administrators, Vendors (own products) |
| Misc.Catalogue.Feeds.CreateEditDelete | Configuration | Configure feed targets and run feeds | Administrators |
| Misc.Catalogue.Audit.View | Catalog | View the catalogue audit log per listing | Administrators, Auditor (BR-IAM-050) |
| Misc.Catalogue.Analytics.View | Reports | View catalogue analytics | Administrators |

New permissions are declared in a CAT plugin class implementing IPermissionConfigManager (pattern: Plugins/Nop.Plugin.Misc.RFQ/Services/RfqPermissionConfigManager.cs). System names use the plugin prefix and the 5.00 view / create-edit-delete split (unchanged from 4.90); Category is taken from the native set (nameof(StandardPermission.Catalog) and others). Native permissions are reused where they exist (Catalog.ProductsView, Catalog.ProductsCreateEditDelete, Catalog.ProductsImportExport, Catalog.CategoriesCreateEditDelete, Catalog.ProductReviewsCreateEditDelete; Libraries/Nop.Services/Security/StandardPermission.cs). Native default: Vendors hold Catalog.ProductsCreateEditDelete and Catalog.ProductsImportExport (Libraries/Nop.Services/Security/DefaultPermissionConfigManager.cs:70-71), so a vendor can set Published natively; CAT removes that path through BR-CAT-005. Default roles use only names from the IAM product role catalogue (BR-IAM-050) or native system roles: Administrators, Vendors and Auditor (audit view only). CAT proposes no new role. Other client roles are configuration (IAM-007). All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-CAT-PERM-01 | **Given** a user without Catalog.ProductsView / Catalog.ProductsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-02 | **Given** a user without Catalog.ProductsImportExport (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-03 | **Given** a user without Catalog.CategoriesCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-04 | **Given** a user without Catalog.ProductReviewsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-05 | **Given** a user without Misc.Catalogue.Listings.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-06 | **Given** a user without Misc.Catalogue.Listings.Manage, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-07 | **Given** a user without Misc.Catalogue.Moderation.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-08 | **Given** a user without Misc.Catalogue.Schema.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-09 | **Given** a user without Misc.Catalogue.Schema.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-10 | **Given** a user without Misc.Catalogue.Policy.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-11 | **Given** a user without Misc.Catalogue.Compliance.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-12 | **Given** a user without Misc.Catalogue.Promotions.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-13 | **Given** a user without Misc.Catalogue.Pricing.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-14 | **Given** a user without Misc.Catalogue.Questions.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-15 | **Given** a user without Misc.Catalogue.Bookings.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-16 | **Given** a user without Misc.Catalogue.Feeds.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-17 | **Given** a user without Misc.Catalogue.Audit.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CAT-PERM-18 | **Given** a user without Misc.Catalogue.Analytics.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-CAT-001 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Category tree (ParentCategoryId), localized names, SEO slugs, picture, DisplayOrder, ACL, store limits, published flag. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-002 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Product: Name, ShortDescription, FullDescription, Sku, Gtin, Price, Weight/Length/Width/Height, pictures, Published; vendor editing; ProductEditorSettings field visibility; VendorSettings.MaximumProductPicturesNumber; MediaSettings.MaximumImageSize. | Native ProductValidator requires Name only; document uploads have no type or size check and oversized images are resized, not refused. Mandatory product fields (MPC FR-051) and upload limits (FR-060) are a custom plugin; configurable mandatory fields per category are PRD-CAT-005. : CAT-002 is the core host of the IProductService override (publish gate and SKU generation through IC-CAT-04 providers, BR-CAT-031; decision OVR-REG). | Custom plugin (DI override) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-003 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: No SKU generator (OrderSettings.CustomOrderNumberMask exists for orders only); admin SkuReservedWarning only. | SKU pattern generator with per-store uniqueness (EntityInserted<Product> consumer). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-004 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Product attributes (mappings, values, price/weight adjustments) and specification attributes (Option/CustomText/Hyperlink, groups), localizable, spec filtering (CatalogSettings.EnableSpecificationAttributeFiltering). | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-005 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Attributes are not bound to categories; no publish-time completeness check. | Category attribute schema and publish validation. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-006 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Attribute combinations with Sku, Gtin, OverriddenPrice, StockQuantity, MinStockQuantity, pictures (ProductAttributeCombinationPicture); generate-all action. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-007 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Grouped products (ProductType.GroupedProduct), required products (RequireOtherProducts, AutomaticallyAddRequiredProducts), attribute values AttributeValueType.AssociatedToProduct (deducts component stock). | True bundle/kit with bundle price and component display (native options are workarounds). | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-008 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Copy product (Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:CopyProduct; NEW PostCopyProductEvent); NEW 4.90 bulk edit (BulkEdit, BulkEditSave). | Named reusable listing templates. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-009 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Excel import/export of products, XML export (no XML import), PDF catalogue (ProductController.DownloadCatalogAsPdf), vendor import (VendorSettings.AllowVendorsToImportProducts, MaximumProductNumber), split large files; columns matched by header name. \| 5.00.1: 5.00 import remains Excel-only (IImportManager.cs: *FromXlsxAsync, plus new ImportPriceListsFromXlsxAsync); PDF catalogue ProductController.DownloadCatalogAsPdf (l.2851) present. | CSV and XML import; fix attribute-picture re-import defect noted in PG CAT-10 (verify on 5.00.1). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-010 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Import throws on first fatal error (ArgumentException); no row-level pre-validation report; no size warning. \| 5.00.1: 5.00 imports still abort with ArgumentException (e.g. ImportManager price-list import 'Admin.PriceLists.Import.ProductsDontExist'); no pre-commit row report. | Row validation report before commit; large-file warning (PG ADM-03 is AFR — AFR port required). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-011 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: No REST API in core. 4.90.8 ships only a promo stub Misc.WebApi.Frontend whose configure page links to the official nopCommerce Web API plugin download (JWT, '1,100 methods'). \| 5.00.1: 5.00.1 ships Plugins/Nop.Plugin.Misc.WebApi.Frontend v5.00.3 as a promo stub (only WebApiFrontendPlugin.cs, Controllers/WebApiFrontendController.cs, Services/EventConsumer.cs, Views/Configure.cshtml linking to nopcommerce.com/web-api); no REST API code in source. | Licence the official nopCommerce Web API plugin (separate download, by nopCommerce team; stub (plugin.json SupportedVersions 5.00, Plugins/Nop.Plugin.Misc.WebApi.Frontend/plugin.json) confirms only that nopCommerce markets the paid plugin for 5.00; the paid plugin's 5.00 build, licence terms and scope are V-01 items to confirm with nopCommerce). The source contains only the Web API Frontend stub (storefront API); a backend (admin / catalog write) API product is not found in source — decision API-01. Do not assume the frontend API covers catalog write or ERP integration. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-012 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Tier prices by store, customer role, quantity, start/end dates. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-013 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Product.CallForPrice hides price and blocks add-to-cart (Libraries/Nop.Services/Orders/ShoppingCartService.cs adds 'Products.CallForPrice' warning). NEW 4.90 bundled Misc.RFQ is cart-based (button in OrderSummaryContentAfter zone), so call-for-price products cannot reach it. \| 5.00.1: Misc.RFQ in 5.00 still renders only in PublicWidgetZones.OrderSummaryContentAfter and AccountNavigationAfter (Plugins/Nop.Plugin.Misc.RFQ/RfqPlugin.cs:79-80); call-for-price items still blocked from cart (Libraries/Nop.Services/Orders/ShoppingCartService.cs:378-381). | Product-page 'Request a quote' button feeding Misc.RFQ (or allowing call-for-price items into a quote). | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-014 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Product.TaxCategoryId, Product.IsTaxExempt, TaxSettings.DefaultTaxCategoryId. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-015 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Can be stored as specification attributes (CustomText) only; no typed HS code/origin/duty fields. | Typed customs fields with validation, used in shipping documents. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-016 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Multiple pictures, product videos (ProductVideo, iframe settings), sizes and quality (MediaSettings.*PictureSize, DefaultImageQuality, MaximumImageSize), native zoom (MediaSettings.DefaultPictureZoomEnabled). \| 5.00.1: NEW 5.00: 3D product objects - Libraries/Nop.Core/Domain/Catalog/Product3dObject.cs (FileName, PreviewPictureId, AltAttribute); PictureType.Object3d; MediaSettings.Object3dCameraControlEnabled, Object3dZoomEnabled, Object3dAutoRotateEnabled, Object3dLazyLoadingEnabled, Object3dUploadSizeLimit; Admin ProductController.Upload3dObject / Product3dObjectSave; VendorSettings.AllowVendorsToUpload3dObjects. | PDF brochures per product; 360-degree photo spin if the 3D-model viewer is not accepted as the 360-degree view (source does not define format). | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-017 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Localized properties for product name/descriptions/SEO; NEW 4.90 machine pre-translate (Google/DeepL) and AI description generation (ArtificialIntelligenceSettings). \| 5.00.1: NEW 5.00: AI meta-tag generation event (Libraries/Nop.Services/ArtificialIntelligence/MetaTagsGeneratingEvent.cs); ArtificialIntelligenceSettings adds LogRequests. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-018 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (product email-a-friend and contact vendor only). | Product Q&A with moderation. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-019 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Product.AgeVerification/MinimumAgeToPurchase (NEW 4.90) only. \| 5.00.1: NEW 5.00: EU GPSR support - GpsrSettings.Enabled (Libraries/Nop.Core/Domain/Catalog/GpsrSettings.cs) and Manufacturer.ResponsiblePerson / PhysicalAddress / ElectronicAddress shown on product page - EU product-safety contact data only, no certificates or expiry. | Regulatory metadata, certificates with validity, expiry warnings, auto-hide, compliance status. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-020 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Manufacturers (producer records), specification attributes, topics. \| 5.00.1: NEW 5.00: Manufacturer.PhysicalAddress, ElectronicAddress, ResponsiblePerson, ResponsiblePersonPhysicalAddress, ResponsiblePersonElectronicAddress (Libraries/Nop.Core/Domain/Catalog/Manufacturer.cs) displayed via Presentation/Nop.Web/Views/Product/_ProductManufacturers.cshtml when GpsrSettings.Enabled. | Attach certificates/chain-of-ownership documents as proof of origin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-021 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Prohibited items/words filter, report-listing, takedown handling. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-022 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Published flag only; no vendor-product approval setting. | Lifecycle state side table and multi-step approval; publish gate via ModelReceivedEvent veto on Product POSTs, Product.Published forced false until approved. the IProductService override is hosted by core CAT-002; CAT-022 is its IC-CAT-04 publish-gate provider. (: no core change needed.) | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-023 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (activity log 'EditProduct' without values). | Version history, compare/undo, autosave. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-024 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Published, AvailableStartDateTimeUtc/AvailableEndDateTimeUtc, AvailableForPreOrder, PreOrderAvailabilityStartDateTimeUtc, back-in-stock subscriptions. | Withdrawal with reason, watcher notification, linked-object handling. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-025 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Product.UpdatedOnUtc only. | Stale detection, reminders, auto-pause task. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-026 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Non-shippable products (Product.IsShipEnabled=false). | Service details and coverage area. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-027 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Rental products with date range only (Product.IsRental, RentalPriceLength, RentalPricePeriodId); no slots/calendar capacity. | Slot calendar and booking. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-028 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (Address has no coordinates; Widgets.What3words removed in 4.90). | Listing coordinates/polygons and map display. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-029 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Reviews with approval (ProductReviewsMustBeApproved), helpfulness votes, purchase-only (ProductReviewPossibleOnlyAfterPurchasing), review types, store-owner reply notification. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-030 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Product.NotReturnable. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-031 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Delivery date and availability range on product (DeliveryDateId, ProductAvailabilityRangeId), vendor on product page (VendorSettings.ShowVendorOnProductDetailsPage), shipping estimate on product page (ShippingSettings.EstimateShippingProductPageEnabled). | Location-aware delivery promise and returns summary block. Scope: Dispute-resolution explanation and returns-policy summary on product and order pages. | Theme/view override + Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-032 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Activity log (EntityId, EntityName, IpAddress, Comment) for product add/edit/delete; no old/new values; no staff view logging. | Field-level audit with old/new values and view logging. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-033 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Featured products per category/manufacturer, ShowOnHomepage; no paid placement. | Paid promoted listings with rules, schedules and fees. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-034 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Reports: bestsellers, never purchased, low stock, popular search terms; bundled Widgets.GoogleAnalytics; official Misc.PowerBI is a promo stub (separate download). \| 5.00.1: NEW 5.00: report export to Excel/XML (Admin ReportController Export*ExcelAll / Export*XmlAll incl. LowStock, NeverSold, BestSellers), registered-customers report (Libraries/Nop.Core/Domain/Customers/RegisteredCustomersReportLine.cs), per-customer search-term history (CatalogSettings.ShowSearchTermHistory). Misc.PowerBI v5.00.3 is still a promo stub (Configure.cshtml links to nopcommerce.com). | Views-to-sales, out-of-stock rate, rejection reasons, filter usage, bounce (GA4) reporting. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-035 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None bundled (no Google Shopping feed in 4.90.8 src/Plugins). \| 5.00.1: NEW 5.00: bundled Plugins/Nop.Plugin.Feed.ChatGptShopping (ChatGptShoppingSettings: CurrencyId, LanguageId, TargetCountries, StoreCountry; Services/ChatGptShoppingSyncTask.cs, ChatGptShoppingService.cs) - real feed plugin for one channel (ChatGPT Shopping). | Feeds/syndication to other marketplaces and comparison sites (e.g. Google Merchant) still to build; ChatGPT Shopping covers one channel only, relevance to KE/MW not stated in source. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-036 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: ACL per customer role on products/categories/manufacturers; store mapping per storefront. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-037 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Product.OrderMinimumQuantity, OrderMaximumQuantity, AllowedQuantities (comma list). | True 'multiples of N' rule and over-maximum routing to approval. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-038 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Admin product form with ProductEditorSettings (basic/advanced field visibility). | Category-adaptive step-by-step listing wizard for sellers. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-039 | NEW in 5.00: native price lists. Libraries/Nop.Core/Domain/PriceLists/PriceList.cs (Name, Active, StartDateUtc, EndDateUtc, PriceCalculationType: PercentageDecrease/PercentageIncrease/AmountDecrease/AmountIncrease/FixedPrice, PriceCalculationValue, Priority), PriceListItem.cs (ProductId, ManualPrice), PriceListCustomer.cs, PriceListCustomerRole.cs; CatalogSettings.PriceListStrategy (MinimalPrice / UseByPriority); applied in Libraries/Nop.Services/Catalog/PriceCalculationService.cs:77-140 (GetPriceListPriceAsync, date-validity filter) and l.454; admin Presentation/Nop.Web/Areas/Admin/Controllers/PriceListController.cs (CRUD, product and customer assignment, Excel import/export); permissions StandardPermission.Catalog.PRICE_LISTS_*. | Configuration only. Company binding is per customer or per customer role until a company entity exists (PRD-IAM-022). Tier prices are applied after the price-list price and replace it (PriceCalculationService.cs:459-462) - configuration rule needed. Price lists have no store or currency scope (PriceList.cs has no StoreId/CurrencyId). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-040 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: ACL by customer role (role-per-company workaround). \| 5.00.1: 5.00 price lists change price only, not visibility; ACL by role still the only assortment control. | Company-level assortment beyond role ACL (depends on PRD-IAM-022). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-041 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Weight units (MeasureWeight), base-price display (Product.BasepriceEnabled, BasepriceUnitId), attribute values with PriceAdjustment/WeightAdjustment for pack sizes. | Selling by unit of measure with weight-based price. If fractional quantities (for example 2.5 kg) are required: change Quantity/StockQuantity from int to decimal in ShoppingCartItem, OrderItem, ShipmentItem, Product, ProductWarehouseInventory and all services/views (core modification). If not required: sell in integer base units (for example 100 g) with BasepriceEnabled (custom plugin). | Custom plugin; Core modification (conditional, decision UOM-01) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-042 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Prices held in primary store currency and converted by Currency.Rate. \| 5.00.1: 5.00 PriceList has no currency field (PriceList.cs); prices still converted from primary store currency. | Fixed per-currency prices: override IPriceCalculationService, Nop.Web IProductModelFactory / IShoppingCartModelFactory and IOrderTotalCalculationService. Orders store primary-currency amounts with Order.CurrencyRate, so fixed prices must be back-converted; reporting impact to specify at L2. | Custom plugin (DI override) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CAT-043 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (vendors publish directly; no approval setting). | Seller-listing moderation queue with reasons (shares CAT-022 workflow). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-CAT-001 Category taxonomy

| Item | Value |
|---|---|
| Description (baseline) | The tree of product categories (for example Tea > Black tea > Bulk) with names in each language, web-friendly links, pictures, display order and restrictions on who can see them. |
| Why it matters | Customers find products easily, and the shop stays organised. |
| Who benefits | Shoppers; catalogue staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-001-01 | As a member of catalogue staff, I want to maintain a category tree with names in each language, web addresses, pictures and display order, so that products are organised the way customers look for them. | D; REQ-MPC-FR-052 | Ready |
| US-CAT-001-02 | As a client administrator, I want to limit a category to certain customer groups or shops, so that each audience sees its own categories. | D | Ready |
| US-CAT-001-03 | As a shopper, I want to browse products by category and subcategory, so that I find products easily. | D; REQ-KTDA-CAT-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-001-01-01 | US-CAT-001-01 | **Given** a user holds Catalog.CategoriesCreateEditDelete, **when** they create a category with a parent category, **then** it is saved with ParentCategoryId and appears under the parent in the admin tree and, once published, in the storefront category navigation. | REQ-MPC-FR-052; FIT (Libraries/Nop.Core/Domain/Catalog/Category.cs:ParentCategoryId) |
| AC-CAT-001-01-02 | US-CAT-001-01 | **Given** a category has a localized name for each published language, **when** a shopper switches language, **then** the category name is shown in that language; where a localized name is empty the default-language name is shown. | D; FIT (LocalizedProperty) |
| AC-CAT-001-01-03 | US-CAT-001-01 | **Given** two categories are given the same search-engine name, **when** the second is saved, **then** it receives a unique slug (native ValidateSeNameAsync). | D; FIT |
| AC-CAT-001-01-04 | US-CAT-001-01 | **Given** a user without Catalog.CategoriesCreateEditDelete (for example a seller), **when** they post a category create or edit, **then** access is denied and nothing changes (native CheckPermission). | REQ-MPC-FR-052; FIT |
| AC-CAT-001-02-01 | US-CAT-001-02 | **Given** a category is limited to customer role R (SubjectToAcl) and catalogsettings.ignoreacl is false, **when** a customer without role R browses, **then** the category, its page and its menu entry are not shown. | D; FIT (AclRecord) |
| AC-CAT-001-02-02 | US-CAT-001-02 | **Given** a category is limited to store S, **when** a shopper browses store T, **then** the category is not shown in store T. | D; FIT (StoreMapping) |
| AC-CAT-001-02-03 | US-CAT-001-02 | **Given** a category is unpublished, **when** a shopper browses, **then** the category is not shown. | D; FIT |
| AC-CAT-001-03-01 | US-CAT-001-03 | **Given** a published category holds published products and subcategories, **when** a shopper opens the category page, **then** its subcategories and its products are listed, ordered by DisplayOrder. | D; REQ-KTDA-CAT-001 |

**Business rules applied:** BR-CAT-001 (§8.1).


### 7.2 PRD-CAT-002 Product master record

| Item | Value |
|---|---|
| Description (baseline) | The main product record: name, short and full description, product code (SKU), barcode, price, weight, size, pictures and whether it is published. Staff and sellers can edit it, with required fields and upload limits. |
| Why it matters | Every product has complete, consistent information. |
| Who benefits | Catalogue staff; sellers; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (DI override) |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-002-01 | As a member of catalogue staff, I want to create and edit a product with name, descriptions, SKU, barcode, price, weight, size, pictures and published state, so that every product has complete, consistent information. | D; REQ-KTDA-CAT-001 | Ready; conditions: OVR-REG |
| US-CAT-002-02 | As a seller, I want to create and manage my own listings with the mandatory fields title, description, price, stock and images, so that I can sell through the platform once approved. | REQ-MPC-FR-051 | Ready; conditions: OVR-REG |
| US-CAT-002-03 | As a seller, I want to record weight and dimensions for each product, so that logistics can price and plan delivery. | REQ-MPC-FR-057 | Ready; conditions: OVR-REG |
| US-CAT-002-04 | As a client administrator, I want to set which file types and sizes can be uploaded as product images and documents, checked by the server, so that bad or oversized files never reach the shop. | D; REQ-MPC-FR-060 | Ready; conditions: OVR-REG |
| US-CAT-002-05 | Technical enabler. As a developer of another product module (INV, SRC, SEL, CAT-022), I want one IProductService override, hosted by the core product master record CAT-002, into which my module plugs as a provider, so that the product service is overridden once and every rule runs on every path. | OVR-REG; FIT (L1 section 6.2 principle 7) | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-002-01-01 | US-CAT-002-01 | **Given** a user holds Catalog.ProductsCreateEditDelete, **when** they save a new product with name, short and full description, SKU, GTIN, price, weight and dimensions, **then** the product is stored with those values and the listing starts in state Draft (SM-CAT-01). | D; REQ-KTDA-CAT-001; FIT (Libraries/Nop.Core/Domain/Catalog/Product.cs) |
| AC-CAT-002-01-02 | US-CAT-002-01 | **Given** productEditorSettings hide a field, **when** a user opens the product form, **then** the field is not shown on the form (native ProductEditorSettings). | D; FIT |
| AC-CAT-002-02-01 | US-CAT-002-02 | **Given** a seller is signed in to the admin area as a vendor, **when** the seller creates a product, **then** VendorId is forced to the seller (native) and the seller sees and edits only own products. | REQ-MPC-FR-051; FIT (Admin ProductController Create/Edit) |
| AC-CAT-002-02-02 | US-CAT-002-02 | **Given** a listing lacks any of: name, full description, price (unless call for price), stock quantity (when stock is managed) or at least one picture, **when** the seller submits it for review or anyone tries to publish it, **then** the transition is refused with message Cat.MandatoryFieldMissing listing the missing fields; the listing stays Draft (BR-CAT-002). | REQ-MPC-FR-051 |
| AC-CAT-002-02-03 | US-CAT-002-02 | **Given** vendorsettings.maximumproductnumber is set above zero, **when** a seller at the limit tries to create a product, **then** creation is refused with the native message Admin.Catalog.Products.ExceededMaximumNumber. | D; FIT (VendorSettings.MaximumProductNumber) |
| AC-CAT-002-03-01 | US-CAT-002-03 | **Given** a seller edits a product, **when** they enter weight, length, width and height, **then** the values are stored on the product in the base weight and dimension units (measuresettings.baseweightid, basedimensionid) and are used by shipping. | REQ-MPC-FR-057; FIT |
| AC-CAT-002-04-01 | US-CAT-002-04 | **Given** the ADM-008 upload policy for context admin picture sets allowed extensions and a maximum size, **when** a user uploads a product image with another extension or above the size on the product edit page, **then** the upload is refused with message Adm.UploadTypeNotAllowed or Adm.UploadTooLarge and no Picture record is created (BR-CAT-003). | REQ-MPC-FR-060; see ADM-008 (BR-ADM-060) |
| AC-CAT-002-04-02 | US-CAT-002-04 | **Given** the ADM-008 upload policy for context admin download sets allowed extensions and a maximum size, **when** a user uploads a product document with another extension or above the size, **then** the upload is refused with message Adm.UploadTypeNotAllowed or Adm.UploadTooLarge and no Download record is created (BR-CAT-003). | REQ-MPC-FR-060; see ADM-008 (BR-ADM-060) |
| AC-CAT-002-04-03 | US-CAT-002-04 | **Given** vendorsettings.maximumproductpicturesnumber is set, **when** a seller adds a picture beyond the limit, **then** the picture is refused (native). | D; FIT (Admin ProductController.ProductPictureAdd) |
| AC-CAT-002-05-01 | US-CAT-002-05 | **Given** the CAT-002 IProductService override is registered (INopStartup Order >= 3000) and INV registers a sellable-stock adjuster (IC-CAT-04), **when** GetTotalStockQuantityAsync is called for a product, **then** the native result is computed first and then passed through every registered adjuster in their declared order; the adjusted result is returned. | OVR-REG; FIT (ProductService.GetTotalStockQuantityAsync is public virtual) |
| AC-CAT-002-05-02 | US-CAT-002-05 | **Given** SRC registers a search filter or ordering contributor (IC-CAT-04), **when** SearchProductsAsync runs for the storefront, **then** the host builds the native 5.00.1 query, applies each filter contributor after the native filters and before ordering and paging — also before the join with the results of an active AI recommendation provider, which in 5.00 returns early — and returns the paged result; admin searches (showHidden true) are not passed to SRC contributors. | OVR-REG; FIT (ProductService.SearchProductsAsync, Libraries/Nop.Services/Catalog/ProductService.cs:822-1148, AI-provider path 895-922; repositories are protected fields) |
| AC-CAT-002-05-03 | US-CAT-002-05 | **Given** an SRC ordering contributor is registered and the scoped search context carries a sort value it owns (for example popularity or distance), **when** SearchProductsAsync runs for the storefront, **then** the contributor orders the query in place of the native ProductSortingEnum ordering; without such a sort value the native ordering is kept, including the order of search-provider and AI-provider results when orderBy is Position (5.00.1: ProductExtensions.OrderBy with the provider results, Libraries/Nop.Services/Catalog/ProductExtensions.cs:99, called at ProductService.cs:908-910 and 1176). | OVR-REG; see SRC-005 (IC-SRC-02); FIT (ProductService.SearchProductsAsync) |
| AC-CAT-002-05-04 | US-CAT-002-05 | **Given** a second plugin registers its own IProductService, IPriceCalculationService or IOrderTotalCalculationService implementation, **when** the application starts, **then** the ADM extension register raises the double-registration warning (BR-ADM-001); provider modules register with the CAT host instead (BR-CAT-031). | OVR-REG; see ADM-001 (BR-ADM-001) |
| AC-CAT-002-05-05 | US-CAT-002-05 | **Given** the CAT-022 listing lifecycle is not delivered (held) and no publish-gate provider is registered, **when** a product is inserted or updated through the admin form, bulk edit, import or the API, **then** the CAT-002 host runs the native method with the providers that are registered (sellable stock, search contributors) and keeps the Published value the caller set; when CAT-022 is delivered it registers the publish-gate provider (IC-CAT-04) and BR-CAT-005 applies. | Proposed (host in CAT-002; OVR-REG) |

**Business rules applied:** BR-CAT-002; BR-CAT-003; BR-CAT-005; BR-CAT-031 (§8.1).


### 7.3 PRD-CAT-003 Identifier patterns

| Item | Value |
|---|---|
| Description (baseline) | Product codes are created automatically from a pattern the client sets (for example KTDA-2026-00045), unique within each shop. |
| Why it matters | No duplicate or inconsistent codes, without typing them by hand. |
| Who benefits | Catalogue staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-003-01 | As a member of catalogue staff, I want product codes created automatically from a pattern the client sets, so that codes are unique and consistent without typing them. | D; REQ-MPC-FR-064 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-003-01-01 | US-CAT-003-01 | **Given** an active SKU pattern exists (tokens Proposed: fixed prefix, year, sequence with a set number of digits), **when** a product is inserted with an empty SKU by any path (form, wizard, import, copy, API), **then** the SKU is generated from the pattern inside the IProductService.InsertProductAsync override before the insert (BR-CAT-004). | D; REQ-MPC-FR-064; FIT (ProductService.InsertProductAsync is public virtual) |
| AC-CAT-003-01-02 | US-CAT-003-01 | **Given** a generated or typed SKU already exists on another product or attribute combination, **when** the product is saved, **then** a generated SKU takes the next sequence number; a typed SKU is refused with message Cat.SkuDuplicate. | REQ-MPC-FR-064; FIT (GetProductBySkuAsync, GetProductAttributeCombinationBySkuAsync) |
| AC-CAT-003-01-03 | US-CAT-003-01 | **Given** two products are inserted at the same moment, **when** both need a generated SKU, **then** the sequence is read and advanced under ILocker key 'cat-sku-{PatternId}'; the two SKUs differ; if the lock is not obtained after the configured retries the insert is refused with message Cat.SkuGenerationBusy. | Proposed; FIT (ILocker.PerformActionWithLockAsync returns false when the lock is not acquired) |
| AC-CAT-003-01-04 | US-CAT-003-01 | **Given** a product is deleted, **when** a new product is generated, **then** the deleted product's sequence number is not reused. | Proposed |
| AC-CAT-003-01-05 | US-CAT-003-01 | **Given** the pattern is changed, **when** it is saved, **then** the change is audited (AUD-CAT-013); existing SKUs are not changed. | Proposed |

**Business rules applied:** BR-CAT-004 (§8.1).


### 7.4 PRD-CAT-004 Product and specification attributes

| Item | Value |
|---|---|
| Description (baseline) | Product options (such as pack size) and descriptive details (such as grade, origin or 'fragile'), which can be translated and used as search filters. |
| Why it matters | Customers can compare and filter products by what matters to them. |
| Who benefits | Shoppers; catalogue staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-004-01 | As a member of catalogue staff, I want product options such as pack size and descriptive details such as grade, origin or fragile, in each language, so that customers can compare and filter products. | D; REQ-KTDA-SRC-002 | Ready |
| US-CAT-004-02 | As a seller, I want to record fragility and handling notes on my products, so that logistics handles them correctly. | REQ-MPC-FR-057 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-004-01-01 | US-CAT-004-01 | **Given** a specification attribute "Size" with options and a specification attribute "Grade" exist and catalogsettings.enablespecificationattributefiltering is on, **when** products carry these values with AllowFiltering set, **then** the values are available to the category and search filters of SRC-003 and the filter shows only products with the chosen value. | REQ-KTDA-SRC-002; FIT (CatalogSettings.EnableSpecificationAttributeFiltering) |
| AC-CAT-004-01-02 | US-CAT-004-01 | **Given** a product attribute "Pack size" has values with price and weight adjustments, **when** a shopper selects a value, **then** the displayed price and the cart weight change by the adjustment (native). | D; FIT (ProductAttributeValue.PriceAdjustment, WeightAdjustment) |
| AC-CAT-004-01-03 | US-CAT-004-01 | **Given** attribute and option names have localized values, **when** a shopper views the product in another language, **then** the localized names are shown. | D; FIT |
| AC-CAT-004-02-01 | US-CAT-004-02 | **Given** specification attributes "Fragile" (option) and "Handling notes" (custom text) exist, **when** a seller sets them on a product, **then** they are stored on the product, shown on the product page and passed to shipping documents through LOG (attribute names configured per client). | REQ-MPC-FR-057; Proposed (names) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.5 PRD-CAT-005 Category attribute schema and listing quality rules

| Item | Value |
|---|---|
| Description (baseline) | For each category, the client decides which details must be filled in before a product can be published, and the system checks this. |
| Why it matters | Product information is complete and consistent. |
| Who benefits | Catalogue staff; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-005-01 | As a client administrator, I want to decide for each category which attributes and fields must be filled in before a product can be published, so that product information is complete and consistent. | D; REQ-MPC-FR-309 | Ready |
| US-CAT-005-02 | As a seller, I want the system to check my listing for missing fields and image quality before I submit it for approval, so that my listing is not returned for avoidable reasons. | REQ-MPC-FR-071 | Ready |
| US-CAT-005-03 | As a member of catalogue staff, I want changes to category attributes and required fields to go through an approval, so that the taxonomy changes under control. | REQ-MPC-FR-309 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-005-01-01 | US-CAT-005-01 | **Given** a category schema marks specification attribute A and field F as required for category C, **when** a listing in category C without A or F is submitted or published, **then** the transition is refused with message Cat.MandatoryFieldMissing naming A and F (BR-CAT-002). | D; REQ-MPC-FR-309 |
| AC-CAT-005-01-02 | US-CAT-005-01 | **Given** category C has a required attribute and subcategory D has none of its own, **when** a listing in D is submitted, **then** the requirement of C applies to D (inheritance, Proposed setting on the schema). | Proposed |
| AC-CAT-005-01-03 | US-CAT-005-01 | **Given** a listing belongs to two categories with different schemas, **when** it is submitted, **then** the union of both required sets is checked. | Proposed |
| AC-CAT-005-02-01 | US-CAT-005-02 | **Given** a listing has all required fields but a picture smaller than the configured minimum pixel size, **when** the seller runs the check or submits, **then** a warning with message Cat.ImageQualityLow is shown and the submission is allowed (BR-CAT-010). | REQ-MPC-FR-071 |
| AC-CAT-005-02-02 | US-CAT-005-02 | **Given** required fields are missing, **when** the seller opens the quality check, **then** every missing field is listed before submission, with message Cat.MandatoryFieldMissing. | REQ-MPC-FR-071 |
| AC-CAT-005-03-01 | US-CAT-005-03 | **Given** a user with Misc.Catalogue.Schema.CreateEditDelete changes a schema, **when** the change is saved, **then** it is stored as a draft version with message Cat.SchemaChangePending and has no effect until a different user with Misc.Catalogue.Schema.Approve approves it (SM-CAT-10). | REQ-MPC-FR-309; Proposed (second person) |
| AC-CAT-005-03-02 | US-CAT-005-03 | **Given** a schema version is approved, **when** listings already published in the category miss a new required field, **then** they stay published and are listed in a "schema gaps" view for their owners; they must meet the new schema at their next submission. | Proposed |
| AC-CAT-005-03-03 | US-CAT-005-03 | **Given** a schema version is approved or rejected, **when** the decision is saved, **then** who, when and the old and new required sets are audited (AUD-CAT-003). | REQ-MPC-FR-309 |

**Business rules applied:** BR-CAT-002; BR-CAT-009; BR-CAT-010 (§8.1).


### 7.6 PRD-CAT-006 Variants and attribute combinations

| Item | Value |
|---|---|
| Description (baseline) | One product can have versions (for example 250 g, 500 g, 1 kg), each with its own code, price, stock and picture. |
| Why it matters | Customers choose the exact version they want. |
| Who benefits | Shoppers; catalogue staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-006-01 | As a member of catalogue staff, I want one product to have versions such as 250 g, 500 g and 1 kg, each with its own code, price, stock and picture, so that customers choose the exact version they want. | D; REQ-MPC-FR-053 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-006-01-01 | US-CAT-006-01 | **Given** a product has attribute "Pack size" with three values, **when** staff run "generate all combinations", **then** one attribute combination per value is created (native GenerateAllAttributeCombinations). | D; FIT |
| AC-CAT-006-01-02 | US-CAT-006-01 | **Given** a combination has its own SKU, GTIN, overridden price, stock quantity and picture, **when** a shopper selects that combination, **then** the product page shows that SKU, price, stock availability and picture. | REQ-MPC-FR-053; FIT (ProductAttributeCombination) |
| AC-CAT-006-01-03 | US-CAT-006-01 | **Given** a combination has stock 0 and backorders are not allowed, **when** a shopper adds it to the cart, **then** the native out-of-stock warning is shown and the item is not added. | REQ-MPC-FR-053; FIT |
| AC-CAT-006-01-04 | US-CAT-006-01 | **Given** a combination SKU duplicates another SKU, **when** it is saved, **then** it is refused with message Cat.SkuDuplicate (BR-CAT-004). | Proposed |

**Business rules applied:** BR-CAT-004 (§8.1).


### 7.7 PRD-CAT-007 Bundles and kits

| Item | Value |
|---|---|
| Description (baseline) | Several products sold together as one bundle or kit with a bundle price. |
| Why it matters | Supports gift packs and combined offers. |
| Who benefits | Shoppers; marketing staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-007-01 | As a seller, I want to create a bundle or kit of several of my products and set the bundle price, so that I can sell gift packs and combined offers. | D; REQ-MPC-FR-065 | Ready |
| US-CAT-007-02 | As a shopper, I want to see what is in a bundle before buying it, so that I know what I get. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-007-01-01 | US-CAT-007-01 | **Given** a seller creates a bundle in the CAT bundle editor with components and quantities, **when** it is saved, **then** a bundle product is created whose price is the bundle price, and each component is stored as a required product attribute with one preselected value of type AssociatedToProduct (AssociatedProductId, Quantity, PriceAdjustment 0) (BR-CAT-016). | REQ-MPC-FR-065; FIT (AttributeValueType.AssociatedToProduct) |
| AC-CAT-007-01-02 | US-CAT-007-01 | **Given** a bundle is ordered, **when** stock is adjusted, **then** the stock of each component is reduced by bundle quantity times component quantity (native AdjustInventoryAsync handles AssociatedToProduct values). | D; FIT (Libraries/Nop.Services/Catalog/ProductService.cs AdjustInventoryAsync) |
| AC-CAT-007-01-03 | US-CAT-007-01 | **Given** a component is unpublished or out of stock, **when** a shopper adds the bundle to the cart, **then** the item is refused with the native associated-product warning and message Cat.BundleComponentUnavailable. | D; FIT (ShoppingCartService bundled products validation) |
| AC-CAT-007-01-04 | US-CAT-007-01 | **Given** a seller selects a component that belongs to another seller, **when** the bundle is saved, **then** it is refused; a seller bundles only own products. | Proposed |
| AC-CAT-007-02-01 | US-CAT-007-02 | **Given** a published bundle, **when** a shopper opens its page, **then** the components with names, quantities and pictures are listed instead of attribute drop-downs (view override). | D |

**Business rules applied:** BR-CAT-016 (§8.1).


### 7.8 PRD-CAT-008 Product cloning and listing templates

| Item | Value |
|---|---|
| Description (baseline) | Copy an existing product to create a new one with the same settings and pictures. Frequently used set-ups can also be saved as named listing templates for reuse. |
| Why it matters | Speeds up adding similar products. |
| Who benefits | Catalogue staff; sellers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-008-01 | As a member of catalogue staff, I want to copy an existing product with its settings and pictures, so that I add similar products quickly. | D; FC-M01-005 | Ready |
| US-CAT-008-02 | As a seller, I want to save a frequently used set-up as a named listing template and start new listings from it, so that I do not re-enter the same values. | D; FC-M01-004 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-008-01-01 | US-CAT-008-01 | **Given** a user copies a product with "copy images" selected (native CopyProduct), **when** the copy is created, **then** the copy holds the source values and pictures, its listing state is Draft and Published is false whatever "published" option was chosen (BR-CAT-005). | D; FIT (CopyProductService; PostCopyProductEvent) |
| AC-CAT-008-01-02 | US-CAT-008-01 | **Given** a vendor copies a product of another vendor, **when** the request is posted, **then** it is refused (native vendor ownership check). | FIT |
| AC-CAT-008-02-01 | US-CAT-008-02 | **Given** a seller saves product P as template "T", **when** the template is saved, **then** template T stores the field set of P (Proposed set: descriptions, category, attributes, tax category, dimensions, shipping flags; not SKU, stock or pictures) and is visible only to that seller (or to all staff for a staff template). | D; Proposed (field set) |
| AC-CAT-008-02-02 | US-CAT-008-02 | **Given** template T exists, **when** a user creates a new listing from T, **then** a new Draft product is created with the template values and an empty SKU (generated by CAT-003). | D |

**Business rules applied:** BR-CAT-005 (§8.1).


### 7.9 PRD-CAT-009 Bulk import/export and PDF catalogue

| Item | Value |
|---|---|
| Description (baseline) | Add or update many products at once from Excel or XML files, export the catalogue, and print a PDF catalogue; sellers can upload too, within limits. Files can be Excel, CSV or XML, and columns are matched to product fields automatically. |
| Why it matters | Saves hours of manual typing. |
| Who benefits | Catalogue staff; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-009-01 | As a member of catalogue staff, I want to add or update many products at once from Excel, CSV or XML files with columns matched by name, so that I save hours of typing. | D; REQ-MPC-FR-054 | Ready |
| US-CAT-009-02 | As a seller, I want to upload my own products in bulk within the limits the client sets, so that I can list my range quickly. | D | Ready |
| US-CAT-009-03 | As a member of catalogue staff, I want to export the catalogue to Excel or XML and print a PDF catalogue, so that I can use it offline and in tenders. | D; FC-M01-046 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-009-01-01 | US-CAT-009-01 | **Given** a file in the standard template (Excel) passes CAT-010 validation, **when** the import runs, **then** new products are created in state Draft and existing products (matched by SKU) are updated; columns are matched by header name (native). | D; REQ-MPC-FR-054; FIT (ImportManager.ImportProductsFromXlsxAsync) |
| AC-CAT-009-01-02 | US-CAT-009-01 | **Given** a CSV or XML file in the standard template is uploaded, **when** the import runs, **then** it is converted to the same row model as the Excel import and processed by the same validation and import rules. | D; REQ-MPC-FR-054 |
| AC-CAT-009-01-03 | US-CAT-009-01 | **Given** an import updates a Published listing, **when** the update is saved, **then** the re-approval rule BR-CAT-008 applies to imported changes as to form changes, and Published is never set by the file (BR-CAT-005). | Proposed |
| AC-CAT-009-01-04 | US-CAT-009-01 | **Given** a file has another format, **when** it is uploaded, **then** it is refused with message Cat.ImportFormatNotSupported. | Proposed |
| AC-CAT-009-02-01 | US-CAT-009-02 | **Given** vendorsettings.allowvendorstoimportproducts is off, **when** a seller posts an import, **then** access is denied (native). | D; FIT (Admin ProductController.ImportExcel) |
| AC-CAT-009-02-02 | US-CAT-009-02 | **Given** a seller imports, **when** the file holds products of another vendor or more products than vendorsettings.maximumproductnumber allows, **then** those rows are refused in the validation report; the vendor of every imported product is the seller. | D; FIT (ImportManager vendor check) |
| AC-CAT-009-03-01 | US-CAT-009-03 | **Given** a user holds Catalog.ProductsImportExport, **when** they export all or the filtered products to Excel or XML, or download the PDF catalogue, **then** the file is produced; a vendor gets only own products (native). | D; FC-M01-046; FIT (ExportExcelAll, ExportXmlAll, DownloadCatalogAsPdf) |
| AC-CAT-009-03-02 | US-CAT-009-03 | **Given** catalogsettings.exportimportsplitproductsfile is on, **when** a large Excel file is imported, **then** it is processed in parts of catalogsettings.exportimportproductscountinonefile rows (native). | FIT |

**Business rules applied:** BR-CAT-005; BR-CAT-008; BR-CAT-011 (§8.1).


### 7.10 PRD-CAT-010 Import validation report

| Item | Value |
|---|---|
| Description (baseline) | Before a bulk upload is saved, the system checks every row and lists any errors to fix. Very large files trigger a warning before the import starts. |
| Why it matters | Prevents bad data from going live. |
| Who benefits | Catalogue staff; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-010-01 | As a member of catalogue staff, I want every row of a bulk file checked and all errors listed before anything is saved, so that bad data never goes live. | D; REQ-MPC-FR-054 | Ready |
| US-CAT-010-02 | As a seller, I want a warning before a very large file starts importing, so that I can split it or wait. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-010-01-01 | US-CAT-010-01 | **Given** a file is uploaded, **when** validation runs, **then** every row is checked (required columns, data types, existence of categories, manufacturers, stores, attributes, SKU uniqueness, category schema CAT-005, prohibited terms CAT-021) and a report lists row number, column and error message for each error. | D; REQ-MPC-FR-054 |
| AC-CAT-010-01-02 | US-CAT-010-01 | **Given** the report has at least one error, **when** the user tries to commit, **then** nothing is imported and message Cat.ImportHasErrors is shown with a link to download the report (BR-CAT-012). | REQ-MPC-FR-054; Proposed (all or nothing) |
| AC-CAT-010-01-03 | US-CAT-010-01 | **Given** the report has no errors, **when** the user commits, **then** the import runs and the result (created, updated, unchanged counts) is stored with the job (SM-CAT-08) and audited (AUD-CAT-012). | REQ-MPC-FR-054 |
| AC-CAT-010-02-01 | US-CAT-010-02 | **Given** a file is larger than the configured row or size threshold, **when** it is uploaded, **then** message Cat.ImportLargeFile asks for confirmation before validation starts; the user can cancel. | D; FIT (PG ADM-03 is an AFR feature on 4.70.5; AFR port rebuilt for nopCommerce 5.00 / .NET 10, or a CAT build; a 5.00 AFR build cannot be verified from source, VER-500) |

**Business rules applied:** BR-CAT-012 (§8.1).


### 7.11 PRD-CAT-011 Catalogue API

| Item | Value |
|---|---|
| Description (baseline) | A secure technical connection that lets other systems (such as an ERP) create, update and read product information automatically. |
| Why it matters | Keeps the shop in step with the client's other systems without retyping. |
| Who benefits | IT teams; partners |
| Phase | P1 |
| Implementation | Licensed plugin — None |
| Depends on | PRD-INT-001 |
| Status | On hold: API-01, PAID-STUB, API-GW |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-011-01 | As an IT administrator of a partner system, I want to read product and category data through a secure API, so that our systems stay in step without retyping. | D; REQ-MPC-FR-072 | On hold: API-01, PAID-STUB, API-GW |
| US-CAT-011-02 | As an IT administrator of an ERP, I want to create and update products through the API, so that products are maintained once, in the ERP. | D; FC-M01-003 | On hold: API-01, PAID-STUB, API-GW |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-011-01-01 | US-CAT-011-01 | **Given** an API client registered in INT-001 holds a token (OAuth 2.0, decision API-GW) with the catalogue read scope (scope name Proposed: products.read) and is limited to store S, **when** it requests products changed since a date, **then** published products of store S with their prices, stock availability, categories and attributes are returned; unpublished listings are returned only to clients that also hold the scope products.read.unpublished (BR-INT-006). | REQ-MPC-FR-072; API-01; BR-INT-002; BR-INT-006 |
| AC-CAT-011-01-02 | US-CAT-011-01 | **Given** a request has no valid token, or the client lacks the scope or the store, **when** it is received, **then** it is refused with 401 or 403 and the refusal is logged (BR-INT-002); no data is returned. | REQ-MPC-FR-072; BR-INT-002 |
| AC-CAT-011-01-03 | US-CAT-011-01 | **Given** a rate limit is set for the API client (value not stated), **when** the client exceeds it on a catalogue endpoint, **then** further catalogue requests in that window get 429 and other clients are not affected (BR-INT-004). | REQ-MPC-FR-072; BR-INT-004 |
| AC-CAT-011-01-04 | US-CAT-011-01 | **Given** catalogue endpoints are published as version v1 on the API-01 base, **when** an incompatible change to a catalogue resource is needed, **then** it is released only in a new major version; v1 keeps answering for the deprecation window and announces its retirement date (BR-INT-003). | D; BR-INT-003 |
| AC-CAT-011-02-01 | US-CAT-011-02 | **Given** an API client with scope products.write (INT-001) creates or updates a product, **when** the request is processed, **then** the product goes through IProductService and therefore the same SKU, mandatory-field, policy and lifecycle rules as the admin form: a new product is Draft; Published is never set by the API (BR-CAT-005, BR-INT-001). | D; API-01; PAID-STUB |

**Business rules applied:** BR-CAT-005; BR-CAT-011 (§8.1).


### 7.12 PRD-CAT-012 Price tiers by customer group and quantity

| Item | Value |
|---|---|
| Description (baseline) | Different prices for different customer groups and quantities, for example a lower price when buying 100 units, with start and end dates. |
| Why it matters | Supports retail, dealer, bulk and institutional pricing. |
| Who benefits | Business buyers; sales staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-012-01 | As a member of sales staff, I want different prices for different customer groups and quantities with start and end dates, so that we support retail, dealer, bulk and institutional pricing. | D; Inference from REQ-KTDA-PRJ-002 (retail and bulk business models) | Ready |
| US-CAT-012-02 | As a seller, I want to manage the base price and dated prices of my products, so that my prices stay current. | REQ-MPC-FR-061 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-012-01-01 | US-CAT-012-01 | **Given** tier prices exist for a bulk-buyer role (name configured per client) at quantity 1 and 100 with start and end dates, **when** a customer in that role adds 100 units within the dates, **then** the 100-unit tier price is used in the product page price table and the cart (native GetPreferredTierPriceAsync). | D; Inference from REQ-KTDA-PRJ-002 (retail and bulk pricing tiers); FIT (TierPrice.CustomerRoleId, Quantity, StartDateTimeUtc, EndDateTimeUtc) |
| AC-CAT-012-01-02 | US-CAT-012-01 | **Given** a tier price has an end date in the past, **when** a customer adds the product, **then** the tier price is not used. | D; FIT |
| AC-CAT-012-01-03 | US-CAT-012-01 | **Given** a tier price is limited to store S, **when** a customer buys in store T, **then** it is not used. | FIT (TierPrice.StoreId) |
| AC-CAT-012-02-01 | US-CAT-012-02 | **Given** a seller edits own product, **when** they change the base price or add a dated tier price, **then** the new values apply from the stated dates; the change is in the version history (CAT-023). | REQ-MPC-FR-061; FIT |
| AC-CAT-012-02-02 | US-CAT-012-02 | **Given** a seller tries to change the price of another seller's product, **when** the request is posted, **then** it is refused (native vendor ownership check). | REQ-MPC-FR-061; FIT |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.13 PRD-CAT-013 Call-for-price / negotiable flag

| Item | Value |
|---|---|
| Description (baseline) | Hides the price on chosen products and shows a 'request a quote' button instead of 'add to cart'. |
| Why it matters | Bulk and negotiated items are sold by quote instead of a fixed price. |
| Who benefits | Business buyers; sales staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-013-01 | As a member of sales staff, I want to hide the price of chosen products and show a "request a quote" button instead of "add to cart", so that bulk and negotiated items are sold by quote. | D | Ready; conditions: OVR-REG |
| US-CAT-013-02 | As a business buyer, I want to request a quote from the product page of a call-for-price product, so that I start the negotiation without a cart. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-013-01-01 | US-CAT-013-01 | **Given** a product has CallForPrice set, **when** a shopper opens its page or listing card, **then** no price is shown, add to cart is not offered (native warning Products.CallForPrice blocks it) and button Cat.RequestQuote is shown in widget zone productdetails_add_info. | D; FIT (Product.CallForPrice; ShoppingCartService) |
| AC-CAT-013-02-01 | US-CAT-013-02 | **Given** Misc.RFQ is installed and rfqsettings.enabled is on and the buyer holds Misc.RFQ.AccessRFQ.PublicStore.AccessRFQ, **when** the buyer submits quantity, attributes and notes from the product page, **then** CAT calls the ORD request service IC-ORD-08 (customer, store, product, quantity, attributes XML, notes); ORD creates the Misc.RFQ request quote in status Submitted and sends the native new-request message; CAT shows message Cat.QuoteRequested; CAT writes no Misc.RFQ table and does not read or change the cart (BR-CAT-017). | D; see ORD-012 (IC-ORD-08); FIT (Misc.RFQ RequestQuote, RequestQuoteStatus) |
| AC-CAT-013-02-02 | US-CAT-013-02 | **Given** IC-ORD-08 refuses the request (Misc.RFQ not installed, access denied or product not quotable), **when** the buyer submits, **then** no request is created and message Cat.QuoteRequestRefused is shown; the product page is unchanged. | see ORD-012 (IC-ORD-08) |
| AC-CAT-013-02-03 | US-CAT-013-02 | **Given** the store owner converts the request to a quote and the buyer accepts it, **when** the quote is moved to the cart (native RfqService.CreateShoppingCartAsync), **then** the call-for-price warning is not raised for that cart item because it is linked to a quote item, and the quoted price is used (BR-CAT-017). | D; FIT (GetShoppingCartItemUnitPriceEvent handled by Misc.RFQ) |
| AC-CAT-013-01-02 | US-CAT-013-01 | **Given** a product is not call for price, **when** a shopper opens its page, **then** button Cat.RequestQuote is not shown; the native cart-level "request a quote" of Misc.RFQ is unchanged. | D |
| AC-CAT-013-02-04 | US-CAT-013-02 | **Given** a guest without the RFQ public-store permission, **when** opens a call-for-price product, **then** the button asks the guest to sign in. | Proposed |

**Business rules applied:** BR-CAT-017; BR-CAT-032 (§8.1).


### 7.14 PRD-CAT-014 Product tax category

| Item | Value |
|---|---|
| Description (baseline) | Assigns each product a tax category so the right tax is calculated. |
| Why it matters | Correct tax on every sale. |
| Who benefits | Finance staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-014-01 | As a member of finance staff, I want each product to carry a tax category or an exemption, so that the right tax is calculated on every sale. | D; REQ-KTDA-TAX-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-014-01-01 | US-CAT-014-01 | **Given** tax categories exist and taxsettings.defaulttaxcategoryid is set, **when** a product is created without a tax category, **then** the default tax category is pre-selected on the form. | D; FIT (TaxSettings.DefaultTaxCategoryId) |
| AC-CAT-014-01-02 | US-CAT-014-01 | **Given** a product has tax category T, **when** the tax provider calculates an order line, **then** the rate configured for T applies (PAY-020). | REQ-KTDA-TAX-001; FIT (TaxService uses Product.TaxCategoryId) |
| AC-CAT-014-01-03 | US-CAT-014-01 | **Given** a product is marked tax exempt, **when** it is sold, **then** no tax is charged on it (native IsTaxExemptAsync). | D; FIT (Product.IsTaxExempt) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.15 PRD-CAT-015 Cross-border trade fields

| Item | Value |
|---|---|
| Description (baseline) | Extra product details needed for export: customs (HS) code, country of origin and duty information. |
| Why it matters | Supports international shipping and customs paperwork. |
| Who benefits | Export staff; international buyers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-015-01 | As a member of export staff, I want typed customs fields on each product: HS code, country of origin and duty information, so that international shipping and customs papers are correct. | D; Inference from REQ-KTDA-CUS-002 (international buyers); REQ-KTDA-LEG-001 | Ready |
| US-CAT-015-02 | As a seller, I want to fill in the tax and duty fields needed for cross-border shipments where they apply, so that my products can be shipped abroad. | REQ-MPC-FR-063 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-015-01-01 | US-CAT-015-01 | **Given** the cross-border fields are enabled for the store, **when** staff save an HS code, a country of origin and a duty note on a product, **then** the values are stored in the CAT trade-fields table and printed on the export documents of DOC-006. | D; REQ-KTDA-LEG-001; Inference from REQ-KTDA-CUS-002 (international buyers) |
| AC-CAT-015-01-02 | US-CAT-015-01 | **Given** an HS code does not match the configured format, **when** the product is saved, **then** it is refused with message Cat.HsCodeInvalid. | Proposed (format setting, default not stated) |
| AC-CAT-015-01-03 | US-CAT-015-01 | **Given** country of origin is entered, **when** it is saved, **then** it must be a country from the native Country list. | Proposed |
| AC-CAT-015-02-01 | US-CAT-015-02 | **Given** a product is offered for international delivery (seller setting), **when** the seller submits it without the required cross-border fields, **then** submission is refused with message Cat.MandatoryFieldMissing (BR-CAT-002). | REQ-MPC-FR-063; Proposed (requirement trigger) |
| AC-CAT-015-01-04 | US-CAT-015-01 | **Given** the CAT token provider is registered with DOC through IC-DOC-02 (entity type Product; tokens %Product.HsCode%, %Product.CountryOfOrigin%, %Product.DutyNote%, names Proposed), **when** a commercial invoice template of DOC-006 using these tokens is generated for an order, **then** each order line shows the HS code, country of origin name and duty note of its product from ProductTradeFields; a product without a value gives an empty token, and DOC stops generation only if the template marks the token required (BR-DOC-002). | D; REQ-KTDA-LEG-001; Proposed (token names) |

**Business rules applied:** BR-CAT-002 (§8.1).


### 7.16 PRD-CAT-016 Product media

| Item | Value |
|---|---|
| Description (baseline) | Several pictures per product, videos, 360-degree views, PDF brochures and zoom, with configurable image sizes and quality. |
| Why it matters | Customers can see what they are buying. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-016-01 | As a shopper, I want several pictures, videos, zoom, 360-degree views and PDF brochures on the product page, so that I can see what I am buying. | D; REQ-KTDA-CNT-001 | Ready |
| US-CAT-016-02 | As a client administrator, I want image sizes and quality to be configurable and uploads to be validated by the server, so that pages load well and files are safe. | D; REQ-MPC-FR-060 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-016-01-01 | US-CAT-016-01 | **Given** a product has several pictures and a video, **when** a shopper opens the page, **then** the pictures are shown in display order with thumbnails and the video is embedded with the mediasettings.videoiframe* values (native). | D; REQ-KTDA-CNT-001; FIT (ProductPicture, ProductVideo) |
| AC-CAT-016-01-02 | US-CAT-016-01 | **Given** mediasettings.defaultpicturezoomenabled is on, **when** a shopper opens a picture, **then** the full-size picture opens over the page (native picture zoom). | D; FIT |
| AC-CAT-016-01-03 | US-CAT-016-01 | **Given** a 360-degree image set is attached to a product, **when** a shopper opens the 360 view, **then** the images rotate in sequence in a viewer below the main picture (widget zone productdetails_after_pictures). | D |
| AC-CAT-016-01-04 | US-CAT-016-01 | **Given** a PDF brochure is attached to a product, **when** a shopper opens the page, **then** a download link with the brochure title is shown. | D |
| AC-CAT-016-02-01 | US-CAT-016-02 | **Given** mediasettings.maximumimagesize is set, **when** an image larger than that pixel size is uploaded, **then** it is resized to the maximum (native ValidatePictureAsync); file type and byte size limits are the ADM-008 policy (BR-CAT-003). | D; FIT (Libraries/Nop.Services/Media/PictureService.cs:1004-1048) |
| AC-CAT-016-02-02 | US-CAT-016-02 | **Given** a brochure file is not in the allowed types or is above the size limit of the ADM-008 context admin download, **when** it is uploaded, **then** it is refused with message Adm.UploadTypeNotAllowed or Adm.UploadTooLarge and no Download record is created (BR-CAT-003). | REQ-MPC-FR-060; see ADM-008 (BR-ADM-060) |
| AC-CAT-016-01-05 | US-CAT-016-01 | **Given** a 3D model file (.glb only, up to MediaSettings.Object3dUploadSizeLimit MB) is uploaded on the product edit page by a user holding Catalog.ProductsCreateEditDelete, with a preview picture and alt text, **when** a shopper opens the product page, **then** the native 3D viewer shows the model with the camera control, zoom, auto-rotate and lazy-loading options set in MediaSettings.Object3dCameraControlEnabled, Object3dZoomEnabled, Object3dAutoRotateEnabled and Object3dLazyLoadingEnabled; one 3D object per product. | D; REQ-KTDA-CNT-001; FIT (Libraries/Nop.Core/Domain/Catalog/Product3dObject.cs; Libraries/Nop.Core/Domain/Media/MediaSettings.cs:143-163; Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:4184, 4256-4297; Presentation/Nop.Web/Views/Product/_ProductDetails3dObject.cshtml); VER-500 |
| AC-CAT-016-02-03 | US-CAT-016-02 | **Given** a seller is signed in to the admin area as a vendor, **when** the seller uploads a 3D model for a product, **then** the upload is accepted only when VendorSettings.AllowVendorsToUpload3dObjects is on and the product belongs to the seller (native); the ADM-008 upload policy also applies to this upload action (context admin 3D object, BR-CAT-003), which the native .glb and size checks do not replace. | REQ-MPC-FR-060; FIT (ProductController.cs:4264; Libraries/Nop.Core/Domain/Vendors/VendorSettings.cs:78); see ADM-008 (BR-ADM-060); VER-500 |

**Business rules applied:** BR-CAT-003 (§8.1).


### 7.17 PRD-CAT-017 Localised product content

| Item | Value |
|---|---|
| Description (baseline) | Product names, descriptions and details written in each language the shop offers. |
| Why it matters | Customers read product information in their own language. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-017-01 | As a shopper, I want product names, descriptions and details in the language I choose, so that I understand what I buy. | D; REQ-KTDA-LOC-001 | Ready |
| US-CAT-017-02 | As a member of catalogue staff, I want to pre-translate product content by machine and then check it, so that translation is faster. | D; FIT | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-017-01-01 | US-CAT-017-01 | **Given** the languages Kiswahili, English, French, Arabic, Russian and Mandarin are installed and published (PLT-009), **when** staff open a product, **then** a localized tab for name, short description, full description and SEO fields exists for each of the six languages. | REQ-KTDA-LOC-001; FIT (LocalizedProperty) |
| AC-CAT-017-01-02 | US-CAT-017-01 | **Given** a localized value exists for the shopper's language, **when** a shopper views the product, **then** the localized value is shown; if empty the default-language value is shown. | D; FIT |
| AC-CAT-017-02-01 | US-CAT-017-02 | **Given** translationsettings.allowpretranslate is on and a translation service key is entered, **when** staff request pre-translation, **then** the empty localized fields are filled from the source language and the listing is marked for review before publication (AI-001 owns review). | D; FIT (TranslationSettings) |
| AC-CAT-017-02-02 | US-CAT-017-02 | **Given** artificialintelligencesettings.allowproductdescriptiongeneration is on, **when** staff request a description, **then** a generated text is offered for editing and is saved only when staff save the product. | FIT (ArtificialIntelligenceSettings); see AI-002 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.18 PRD-CAT-018 Product questions and answers

| Item | Value |
|---|---|
| Description (baseline) | Shoppers ask questions on a product page; the seller or staff answer; answers are published after moderation. |
| Why it matters | Answers common questions once for everyone and builds confidence to buy. |
| Who benefits | Shoppers; sellers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-018-01 | As a shopper, I want to ask a question on a product page and read earlier answers, so that I can decide with confidence. | D; FC-M01-022 | Ready |
| US-CAT-018-02 | As a seller, I want to answer questions on my products, so that common questions are answered once for everyone. | D | Ready |
| US-CAT-018-03 | As a member of catalogue staff, I want to moderate questions and answers before they are published, so that nothing harmful is published. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-018-01-01 | US-CAT-018-01 | **Given** Q&A is enabled and the shopper is registered, **when** the shopper submits a question, **then** it is stored as Submitted and message Cat.QuestionSubmitted is shown; it is not public yet (SM-CAT-07). | D |
| AC-CAT-018-02-01 | US-CAT-018-02 | **Given** a question on the seller's product is published, **when** the seller writes an answer, **then** the answer is stored as Submitted and goes to moderation. | D |
| AC-CAT-018-03-01 | US-CAT-018-03 | **Given** a question or answer is Submitted, **when** a user with Misc.Catalogue.Questions.CreateEditDelete approves or rejects it, **then** approved items become Published and visible to all shoppers under the product; rejected items are hidden and the author is told; the decision is audited (AUD-CAT-015). | D |
| AC-CAT-018-01-02 | US-CAT-018-01 | **Given** an answer is published, **when** the question author has an email address, **then** the author is notified. | Proposed |
| AC-CAT-018-01-03 | US-CAT-018-01 | **Given** a guest tries to ask a question, **when** they submit, **then** they are asked to sign in. | Proposed |

**Business rules applied:** BR-CAT-011 (§8.1).


### 7.19 PRD-CAT-019 Regulatory metadata and certificates

| Item | Value |
|---|---|
| Description (baseline) | For regulated products, required legal details and certificates (with validity dates) are stored; the system warns before a certificate expires and can hide the product when it does. Each product shows its compliance review status (pending, validated, flagged, escalated or barred). |
| Why it matters | Avoids selling products without valid certification. |
| Who benefits | Compliance staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-019-01 | As a member of compliance staff, I want required legal details and certificates with validity dates stored for regulated products, so that we do not sell without valid certification. | D; FC-M01-023; FC-M01-024 | Ready |
| US-CAT-019-02 | As a member of compliance staff, I want a warning before a certificate expires and automatic hiding when it does, so that expired products leave the shop on time. | D | Ready |
| US-CAT-019-03 | As a member of compliance staff, I want each product to show its compliance review status, so that we know what is checked. | D; FC-M01-027 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-019-01-01 | US-CAT-019-01 | **Given** category C is marked regulated with required regulatory fields, **when** a listing in C is submitted without those fields or without a valid certificate, **then** submission is refused with message Cat.MandatoryFieldMissing (BR-CAT-002). | D |
| AC-CAT-019-01-02 | US-CAT-019-01 | **Given** a certificate is attached, **when** it is saved, **then** type, number, issuer, valid-from, valid-to and the file (Download) are stored; valid-to before valid-from is refused. | D; FC-M01-024 |
| AC-CAT-019-02-01 | US-CAT-019-02 | **Given** a certificate valid-to date is within the configured warning period, **when** the daily task runs, **then** the seller and compliance staff are notified once per certificate (SM-CAT-09). | D |
| AC-CAT-019-02-02 | US-CAT-019-02 | **Given** a certificate has expired and auto-hide is on for the category, **when** the daily task runs, **then** the listing moves to Paused with reason CertificateExpired and Published becomes false (SM-CAT-01); audited (AUD-CAT-008). | D |
| AC-CAT-019-03-01 | US-CAT-019-03 | **Given** a listing is regulated, **when** compliance staff set status Pending, Validated, Flagged, Escalated or Barred, **then** the status follows SM-CAT-03; a Barred listing cannot be submitted or published. | D; FC-M01-027 |

**Business rules applied:** BR-CAT-002; BR-CAT-018 (§8.1).


### 7.20 PRD-CAT-020 Origin and provenance content

| Item | Value |
|---|---|
| Description (baseline) | Shows where a product comes from (for example the factory, farm or region) using producer records, product details and content pages. Certificates and ownership-chain documents can be attached as proof of origin. |
| Why it matters | Buyers value knowing the origin and story of the product. |
| Who benefits | Shoppers; marketing staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-020-01 | As a shopper, I want to see where a product comes from — factory, farm or region — and the story behind it, so that I value its origin. | D; REQ-KTDA-CNT-001 | Ready |
| US-CAT-020-02 | As a member of marketing staff, I want to attach certificates and ownership-chain documents as proof of origin, so that buyers can verify the origin. | D; FC-M01-026 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-020-01-01 | US-CAT-020-01 | **Given** a producer record (native Manufacturer) with description and picture exists and is mapped to a product, **when** a shopper opens the product, **then** the producer name links to the producer page with its description, picture and products. | D; REQ-KTDA-CNT-001; FIT (Manufacturer) |
| AC-CAT-020-01-02 | US-CAT-020-01 | **Given** a content page (native Topic) for a factory or farmer story exists, **when** it is linked from the producer record, **then** the shopper can open it from the product page. | D; REQ-KTDA-CNT-001; FIT (Topic) |
| AC-CAT-020-02-01 | US-CAT-020-02 | **Given** a proof-of-origin document is attached to a product or producer, **when** a shopper opens the product, **then** the document title is listed with a download link; documents marked internal are not shown. | D |
| AC-CAT-020-02-02 | US-CAT-020-02 | **Given** a document is attached, **when** it is saved, **then** the BR-CAT-003 file checks apply. | D |

**Business rules applied:** BR-CAT-003 (§8.1).


### 7.21 PRD-CAT-021 Listing policy enforcement

| Item | Value |
|---|---|
| Description (baseline) | Blocks prohibited items and words, lets anyone report a listing, and handles takedown requests with evidence. |
| Why it matters | Keeps illegal or harmful items off the shop. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-021-01 | As a client administrator, I want to define prohibited categories, items and words and have listings checked automatically, so that illegal or harmful items stay off the shop. | D; REQ-MPC-FR-059 | Ready |
| US-CAT-021-02 | As a shopper, I want to report a suspicious listing from the product page or search results, so that the client can act on it. | D; REQ-MPC-FR-093 | Ready |
| US-CAT-021-03 | As a member of compliance staff, I want to handle takedown requests with the evidence attached, so that we can show what we did and why. | D; REQ-MPC-FR-073 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-021-01-01 | US-CAT-021-01 | **Given** a prohibited-term rule with action Block exists, **when** a listing whose name or descriptions (any language) contain the term is submitted, imported or sent through the API, **then** the submission is refused with message Cat.ProhibitedContent naming the term (BR-CAT-011). | REQ-MPC-FR-059 |
| AC-CAT-021-01-02 | US-CAT-021-01 | **Given** a rule with action Flag exists, **when** a matching listing is submitted, **then** it enters review with the flag reason shown to the approver. | REQ-MPC-FR-059; Proposed (Flag action) |
| AC-CAT-021-01-03 | US-CAT-021-01 | **Given** a category is marked prohibited, **when** anyone maps a product to it, **then** the listing cannot be submitted (message Cat.ProhibitedContent). | REQ-MPC-FR-059 |
| AC-CAT-021-01-04 | US-CAT-021-01 | **Given** a rule is created, changed or disabled, **when** it is saved, **then** who, when, old and new values are audited (AUD-CAT-004). | Proposed |
| AC-CAT-021-02-01 | US-CAT-021-02 | **Given** a shopper is on a product page or a search result, **when** they choose "report this listing", pick a reason and add text, **then** a listing report is created as Open (SM-CAT-04), message Cat.ReportReceived is shown and compliance staff are notified. | REQ-MPC-FR-093 |
| AC-CAT-021-02-02 | US-CAT-021-02 | **Given** the same reporter already has an Open report on the product, **when** they report again, **then** the new text is added to the existing report. | Proposed |
| AC-CAT-021-03-01 | US-CAT-021-03 | **Given** a takedown request is received with evidence files, **when** compliance staff record it, **then** the request, requester, basis and evidence (Download records) are stored against the product. | REQ-MPC-FR-073 |
| AC-CAT-021-03-02 | US-CAT-021-03 | **Given** a report or takedown is Upheld, **when** the decision is recorded with a reason, **then** the listing moves to Withdrawn with that reason (SM-CAT-01), the seller is notified, the evidence is kept and the decision is audited (AUD-CAT-005). | REQ-MPC-FR-073; REQ-MPC-FR-093 |
| AC-CAT-021-03-03 | US-CAT-021-03 | **Given** a report is Dismissed, **when** the decision is recorded with a reason, **then** the listing is unchanged and the reporter, if registered, is told the outcome. | Proposed |

**Business rules applied:** BR-CAT-011; BR-CAT-013 (§8.1).


### 7.22 PRD-CAT-022 Listing lifecycle and operator approval

| Item | Value |
|---|---|
| Description (baseline) | Products move through stages (draft, in review, approved, published, paused, archived), with approval by one or more configured approvers in sequence (for example catalogue staff, then a manager) before publishing. |
| Why it matters | Only checked products go live. |
| Who benefits | Catalogue staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002, PRD-CAT-002 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-022-01 | As a member of catalogue staff, I want products to move through stages — draft, in review, approved, published, paused, archived, so that only checked products go live. | D; FC-M01-031 | On hold: WF-ENG |
| US-CAT-022-02 | As a client administrator, I want approval by one or more approvers in sequence before publishing, so that each listing gets the checks it needs. | D; FC-M01-032 | On hold: WF-ENG |
| US-CAT-022-03 | As a client administrator, I want to configure moderation queues and the rules that assign listings to them, so that the right people review the right listings. | REQ-MPC-FR-319 | On hold: WF-ENG |
| US-CAT-022-04 | As a member of seller management staff (through SEL), I want all listings of a seller paused with a reason and resumed only when no reason remains, so that buyers cannot buy from a seller who may not sell. | Proposed (decision OVR-REG; BR-SEL-005, IC-SEL-01) | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-022-01-01 | US-CAT-022-01 | **Given** a listing is Draft, **when** its owner submits it and BR-CAT-002, BR-CAT-011 and the submission guard (IC-CAT-04: SEL CheckEligibility, IC-SEL-01) pass, **then** it moves to InReview and is placed in the queue chosen by the assignment rules (SM-CAT-01). | D; see SEL-007 (IC-SEL-01) |
| AC-CAT-022-01-02 | US-CAT-022-01 | **Given** a listing is Draft or Rejected and SEL CheckEligibility returns Fail, **when** its owner submits it by any path (form, wizard, bulk edit, import, API), **then** the submission is refused with message Sel.ListingNotEligible naming each failed rule; the listing keeps its state; no queue item is created. | Proposed; see SEL-007 (IC-SEL-01) |
| AC-CAT-022-01-03 | US-CAT-022-01 | **Given** a listing is in any state other than Published, **when** anyone saves the product form with Published ticked, **then** the save is refused with message Cat.PublishNotAllowed through a ModelReceivedEvent veto on Admin ProductController Create / Edit [POST] (both check ModelState.IsValid) (BR-CAT-005). | D; FIT (Admin ProductController.cs:1083, 1227; PublishModelEventsAttribute) |
| AC-CAT-022-01-04 | US-CAT-022-01 | **Given** a listing is not Published, **when** a path without ModelState sets Published (bulk edit, copy, Excel import, low-stock re-publish), **then** the CAT-002 IProductService host calls the CAT-022 publish-gate provider (IC-CAT-04), which makes it save Published false (BR-CAT-005). | D; FIT (BulkEditSave, CopyProductService, ImportManager, ApplyLowStockActivityAsync) |
| AC-CAT-022-01-05 | US-CAT-022-01 | **Given** a listing is Approved, its vendor has no pause reason and the publish guard passes (IC-CAT-04: SEL CheckEligibility, IC-SEL-01), **when** a user with Misc.Catalogue.Listings.Manage publishes it, or auto-publish on approval is on, **then** it moves to Published and Product.Published becomes true. | D; Proposed (guard) |
| AC-CAT-022-01-06 | US-CAT-022-01 | **Given** a listing is Approved and SEL CheckEligibility returns Fail, **when** anyone publishes it (lifecycle action or auto-publish), **then** the transition is refused with message Sel.ListingNotEligible naming each failed rule; the listing stays Approved and Published stays false. | Proposed; see SEL-007 (IC-SEL-01) |
| AC-CAT-022-01-07 | US-CAT-022-01 | **Given** a listing is Published and was unpublished by the native low-stock rule (LowStockActivity Unpublish), **when** stock returns and ApplyLowStockActivityAsync sets Published true and calls UpdateProductAsync, **then** the CAT-002 IProductService host calls the CAT-022 publish-gate provider, which runs the publish guard: on Pass Published true is saved; on Fail Published is saved false, the listing moves to Paused with reason NotEligible (SM-CAT-01) and the owner is notified. | Proposed; FIT (ProductService.ApplyLowStockActivityAsync calls UpdateProductAsync; catalogsettings.publishbackproductwhencancellingorders) |
| AC-CAT-022-01-08 | US-CAT-022-01 | **Given** a listing is Published, **when** a user with Misc.Catalogue.Listings.Manage pauses it, resumes it or archives it, **then** the state changes per SM-CAT-01; Published is true only in Published; each change is audited (AUD-CAT-001). | D |
| AC-CAT-022-02-01 | US-CAT-022-02 | **Given** a queue has two steps (step 1 role A, step 2 role B), **when** step 1 approves, **then** the listing stays InReview and step 2 becomes the current step; when the last step approves the listing becomes Approved. | D; FC-M01-032 |
| AC-CAT-022-02-02 | US-CAT-022-02 | **Given** a step rejects or requests changes, **when** the approver records the decision, **then** a reason is mandatory (message Cat.ReasonRequired if empty); reject → Rejected, request changes → Draft; the owner is notified with the reason. | D; FC-M01-032 |
| AC-CAT-022-02-03 | US-CAT-022-02 | **Given** the approver is the user who submitted the listing, **when** they try to decide it, **then** the decision is refused with message Cat.ApproveOwnListing (BR-CAT-006). | Proposed |
| AC-CAT-022-02-04 | US-CAT-022-02 | **Given** a seller edits a listing that is InReview, **when** the edit is saved, **then** the submission is withdrawn: the listing returns to Draft, the open step is closed and message Cat.SubmissionWithdrawn is shown (BR-CAT-008). | Proposed |
| AC-CAT-022-03-01 | US-CAT-022-03 | **Given** assignment rules exist by category, seller, seller tier (SEL-010) and store, each with a priority and a target queue, **when** a listing is submitted, **then** it goes to the queue of the first active rule that matches, in priority order; with no match it goes to the default queue (BR-CAT-007). | REQ-MPC-FR-319 |
| AC-CAT-022-03-02 | US-CAT-022-03 | **Given** a user with Misc.Catalogue.Moderation.CreateEditDelete changes a queue, its steps or a rule, **when** it is saved, **then** listings already in review keep their current queue; the change is audited (AUD-CAT-003). | REQ-MPC-FR-319; Proposed (no re-routing) |
| AC-CAT-022-03-03 | US-CAT-022-03 | **Given** WF-ENG selects the ADM-006 approval queues for listing moderation, **when** a listing is submitted, **then** CAT calls IC-ADM-03 Submit (object type Listing, object ID ProductId, requester, summary) and ADM-006 assigns it by its rules; the CAT OnApproved / OnRejected callback applies the decision through IC-CAT-03 Decide, so BR-CAT-006 and SM-CAT-02 still apply; a callback refused by CAT leaves the item decided in ADM and raises an exception to ADM-009. | REQ-MPC-FR-319; WF-ENG; see ADM-006 (IC-ADM-03) |
| AC-CAT-022-04-01 | US-CAT-022-04 | **Given** vendor V has Published, Approved and Draft listings, **when** SEL calls PauseListings(V, SellerSuspended) (IC-CAT-03), **then** under ILocker key 'cat-vendor-listings-{V}' the vendor pause reason SellerSuspended is stored; every Published listing of V moves to Paused with listing reason VendorPause and Published false; the number of listings paused is returned; audited (AUD-CAT-016) (BR-CAT-030). | Proposed ( BR-SEL-005) |
| AC-CAT-022-04-02 | US-CAT-022-04 | **Given** vendor V has pause reasons SellerSuspended and Vacation, **when** SEL calls ResumeListings(V, Vacation), **then** Vacation is removed; no listing resumes because SellerSuspended remains; the number resumed (0) is returned. | Proposed (BR-SEL-005) |
| AC-CAT-022-04-03 | US-CAT-022-04 | **Given** the last vendor pause reason of V is removed, **when** ResumeListings runs, **then** reason VendorPause is removed from the listings of V; each listing with no other pause reason (Manual, Stale, CertificateExpired, NotEligible) and a passing publish guard returns to Published with Published true; the others stay Paused; the number resumed is returned. | Proposed (BR-SEL-005) |
| AC-CAT-022-04-04 | US-CAT-022-04 | **Given** vendor V has a pause reason, **when** anyone publishes or resumes a listing of V by a lifecycle action, or a form, bulk edit, import, API call or low-stock re-publish tries to set Published, **then** lifecycle actions are refused with message Cat.SellerListingsPaused; the other paths save Published false (BR-CAT-005, BR-CAT-030). | Proposed (BR-SEL-005); FIT (BulkEditSave, ImportManager, ApplyLowStockActivityAsync all reach IProductService) |
| AC-CAT-022-04-05 | US-CAT-022-04 | **Given** a reason code outside Vacation, SellerSuspended, SellerBlacklisted, DocumentExpired, CommissionOverdue, PerformanceIntervention, **when** PauseListings or ResumeListings is called, **then** it is refused with error Unknown reason and nothing changes. | Proposed (IC-SEL-01) |

**Business rules applied:** BR-CAT-005; BR-CAT-006; BR-CAT-007; BR-CAT-008; BR-CAT-011; BR-CAT-030; BR-CAT-031 (§8.1).


### 7.23 PRD-CAT-023 Listing version history and autosave

| Item | Value |
|---|---|
| Description (baseline) | Keeps every saved version of a product so changes can be compared or undone, and saves drafts automatically. |
| Why it matters | No work is lost, and mistakes can be reversed. |
| Who benefits | Catalogue staff; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-023-01 | As a member of catalogue staff, I want every saved version of a product kept, compared and restorable, so that mistakes can be reversed and changes audited. | D; REQ-MPC-FR-064 | Ready |
| US-CAT-023-02 | As a seller, I want my unsaved edits saved automatically as a draft, so that no work is lost. | D; FC-M01-033 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-023-01-01 | US-CAT-023-01 | **Given** a product is saved by any path, **when** the IProductService update or insert override runs, **then** a version is written with version number, user, time, source (form, import, API, restore) and a snapshot of product fields, localized values, category mappings, specification attribute mappings, tier prices and picture references (BR-CAT-014). | D; REQ-MPC-FR-064 |
| AC-CAT-023-01-02 | US-CAT-023-01 | **Given** two versions exist, **when** staff choose compare, **then** the changed fields are listed with old and new values. | D |
| AC-CAT-023-01-03 | US-CAT-023-01 | **Given** staff restore version N, **when** the restore is confirmed, **then** a new version is created with the values of N; the lifecycle rules BR-CAT-005 and BR-CAT-008 apply; the restore is audited (AUD-CAT-007). | D |
| AC-CAT-023-02-01 | US-CAT-023-02 | **Given** a user edits the product form without saving, **when** the autosave interval passes, **then** the form values are saved to a draft buffer for that user and product; the live product is not changed. | D; Proposed (buffer) |
| AC-CAT-023-02-02 | US-CAT-023-02 | **Given** a draft buffer exists, **when** the user reopens the product, **then** they are offered to restore or discard the draft. | D |
| AC-CAT-023-02-03 | US-CAT-023-02 | **Given** another user saved the product after this user opened the form, **when** this user saves, **then** the save is refused with message Cat.EditConflict through the ModelReceivedEvent veto on Edit [POST] (BR-CAT-019). | Proposed; FIT (Edit POST checks ModelState.IsValid) |

**Business rules applied:** BR-CAT-014; BR-CAT-019 (§8.1).


### 7.24 PRD-CAT-024 Listing availability and withdrawal

| Item | Value |
|---|---|
| Description (baseline) | Show or hide a product, set when it is available, allow pre-orders, and withdraw it with a reason. Customers watching the product are told, and anything linked to it (held stock, payments in escrow, open disputes) is dealt with automatically. |
| Why it matters | Control over what customers can buy and when. |
| Who benefits | Catalogue staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-024-01 | As a member of catalogue staff, I want to set when a product is available and to allow pre-orders, so that products appear and sell at the right time. | D; REQ-MPC-FR-056 | Ready |
| US-CAT-024-02 | As a member of catalogue staff, I want to withdraw a product with a reason, telling watching customers and handling linked items, so that withdrawal is controlled and traceable. | D; FC-M01-035 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-024-01-01 | US-CAT-024-01 | **Given** AvailableStartDateTimeUtc and AvailableEndDateTimeUtc are set, **when** a shopper tries to buy outside the window, **then** the native warning ShoppingCart.NotAvailable is shown and the item is not added. | REQ-MPC-FR-056; FIT (ShoppingCartService) |
| AC-CAT-024-01-02 | US-CAT-024-01 | **Given** AvailableForPreOrder is on with a pre-order start date, **when** a shopper opens the product before that date, **then** the pre-order button and start date are shown and the order can be placed (native). | REQ-MPC-FR-056; FIT (Product.AvailableForPreOrder, PreOrderAvailabilityStartDateTimeUtc) |
| AC-CAT-024-02-01 | US-CAT-024-02 | **Given** a listing is Published or Paused, **when** a user with Misc.Catalogue.Listings.Manage withdraws it, **then** a reason is mandatory (message Cat.ReasonRequired), the state becomes Withdrawn, Published becomes false and the CAT event Listing.Withdrawn is raised (BR-CAT-015); audited (AUD-CAT-006). | D |
| AC-CAT-024-02-02 | US-CAT-024-02 | **Given** a listing is withdrawn, **when** back-in-stock subscribers and customers with it in a wishlist exist, **then** each is notified once with message template Catalogue.ListingWithdrawn.CustomerNotification. | D; Proposed (watchers = back-in-stock subscribers and wishlist holders) |
| AC-CAT-024-02-03 | US-CAT-024-02 | **Given** a withdrawn product is in a cart, **when** the shopper goes to checkout, **then** the native warning ShoppingCart.ProductUnpublished blocks checkout of that item. | D; FIT (ShoppingCartService:346) |
| AC-CAT-024-02-04 | US-CAT-024-02 | **Given** Listing.Withdrawn is raised, **when** consumers in INV, PAY and RET receive it, **then** each only enqueues work for its owner (INV-004 releases cart holds; PAY-007 escrow orders and RET-007 open cases are listed for staff); CAT does not change orders or payments. | D; FIT (consumers swallow exceptions) |

**Business rules applied:** BR-CAT-015 (§8.1).


### 7.25 PRD-CAT-025 Stale listing detection

| Item | Value |
|---|---|
| Description (baseline) | Flags products not updated for a set number of days, reminds the seller and can pause them automatically. |
| Why it matters | Keeps information and prices current. |
| Who benefits | Clients; shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-025-01 | As a client administrator, I want products not updated for a set number of days flagged, sellers reminded and stale listings paused, so that information and prices stay current. | D; FC-M01-034 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-025-01-01 | US-CAT-025-01 | **Given** category C has a stale period setting, **when** a Published listing in C has UpdatedOnUtc older than that period, **then** the daily task flags it Stale and the seller is reminded once (BR-CAT-026). | D |
| AC-CAT-025-01-02 | US-CAT-025-01 | **Given** a listing is flagged Stale, **when** the seller re-confirms it without changes or edits it, **then** the flag is cleared and the re-confirmation is recorded. | D |
| AC-CAT-025-01-03 | US-CAT-025-01 | **Given** a listing stays Stale beyond the grace period and auto-pause is on, **when** the daily task runs, **then** it moves to Paused with reason Stale (SM-CAT-01), Published becomes false and the seller is notified. | D |

**Business rules applied:** BR-CAT-026 (§8.1).


### 7.26 PRD-CAT-026 Service listings

| Item | Value |
|---|---|
| Description (baseline) | Lets the shop list services (not physical goods), with service details and the area covered; how a booked service is confirmed as delivered is handled by 'Service order lifecycle and completion sign-off'. |
| Why it matters | The same shop can sell services as well as products. |
| Who benefits | Service providers; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-026-01 | As a service provider, I want to list a service, not physical goods, with its details, delivery method and the area covered, so that I can sell services in the same shop. | D; REQ-MPC-FR-074 | Ready |
| US-CAT-026-02 | As a shopper, I want clear descriptions of the client's own services, so that I know what I order. | REQ-MPC-FR-100 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-026-01-01 | US-CAT-026-01 | **Given** service listings are enabled for the store (feature state productfeature.<prd-id> read through IC-PLT-02, PLT-022), **when** a seller creates a listing from the service template, **then** the product is saved with IsShipEnabled false, NotReturnable true and a CAT service record (service type, delivery method, coverage areas, qualifications). | D; REQ-MPC-FR-074; FIT (Product.IsShipEnabled, Product.NotReturnable); Proposed (NotReturnable default, SVC-005) |
| AC-CAT-026-01-02 | US-CAT-026-01 | **Given** service listings are disabled for the store (IC-PLT-02 returns false), **when** a seller opens the listing wizard, **then** the service template is not offered (BR-CAT-027). | REQ-MPC-FR-074 |
| AC-CAT-026-01-03 | US-CAT-026-01 | **Given** a service product is NotReturnable, **when** the shopper opens the return request page for the order, **then** the service line is not offered for return; a failed service follows the SVC-005 NotDelivered path. | Proposed; FIT (ReturnRequestController uses isNotReturnable: false); see SVC-005 (REQ-MPC-FR-074) |
| AC-CAT-026-01-04 | US-CAT-026-01 | **Given** a service covers districts D1 and D2, **when** a shopper whose delivery or service address is in D3 adds it to the cart, **then** the item is refused with message Cat.ServiceAreaNotCovered. | D |
| AC-CAT-026-01-05 | US-CAT-026-01 | **Given** a service is ordered, **when** the order is placed, **then** completion confirmation follows SVC-005; CAT records no fulfilment state. | D |
| AC-CAT-026-02-01 | US-CAT-026-02 | **Given** a service listing of the client, **when** a shopper opens it, **then** the service description, delivery method, coverage and price are shown; the price model of SVC-001 (price on request, payment plans) is shown only when SVC-001 (P2) is delivered, otherwise the native fixed product price applies. | REQ-MPC-FR-100; Proposed (P1 value) |

**Business rules applied:** BR-CAT-027; BR-CAT-032 (§8.1).


### 7.27 PRD-CAT-027 Service booking

| Item | Value |
|---|---|
| Description (baseline) | A calendar of available time slots where customers book a service. |
| Why it matters | Customers pick a time that suits them, and providers are not double-booked. |
| Who benefits | Shoppers; service providers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: FG-06 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-027-01 | As a shopper, I want to choose an available time slot when I book a service, so that I get a time that suits me. | D; FC-M06-013 | On hold: FG-06 |
| US-CAT-027-02 | As a service provider, I want slots never to be overbooked, so that I am not double-booked. | D; FC-M01-029 | On hold: FG-06 |
| US-CAT-027-03 | As a citizen (through EGV-003), I want to book a slot at an outlet that handles my e-government service without a cart, so that I can attend the in-person step of my application. | D; Proposed ( EGV-003) | On hold: FG-06 |
| US-CAT-027-04 | As a service provider (through SVC-003), I want to move, cancel and close bookings through the same booking service, so that capacity stays right after changes. | D; Proposed ( SM-SVC-02, BR-SVC-011) | On hold: FG-06 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-027-01-01 | US-CAT-027-01 | **Given** a service listing has slots with capacity, **when** a shopper opens the listing, **then** the free slots of the coming period are shown by day with remaining places; full slots are not selectable. | D; FC-M01-029 |
| AC-CAT-027-01-02 | US-CAT-027-01 | **Given** the cart holds only services, so checkout skips the native shipping step, **when** the shopper reaches the CAT booking step, **then** the free slots of the listing defined by staff (product, start, end, capacity, optional outlet) are offered with no location or resource step; only when the Services pack features are installed (SVC-006 location capture and SVC-002 eligible resources through IC-SVC-01, P2 extension points) is the location step shown first and the slots limited to the eligible resources. | D; FIT (CheckoutController skips shipping when ShoppingCartRequiresShippingAsync is false); Proposed (P1 path without SVC) |
| AC-CAT-027-01-03 | US-CAT-027-01 | **Given** a shopper selects a slot and adds the service to the cart, **when** the hold is created, **then** a booking hold is stored for the cart item (SM-CAT-05 Held) and counts against capacity until the hold expires. | D; Proposed (hold) |
| AC-CAT-027-02-01 | US-CAT-027-02 | **Given** one place is left in a slot, **when** two shoppers try to hold it at the same moment, **then** both requests run under ILocker key 'cat-slot-{SlotId}'; one gets the hold, the other gets message Cat.SlotFull. | D |
| AC-CAT-027-01-04 | US-CAT-027-01 | **Given** an order with a held slot is placed, **when** the order is placed, **then** the hold becomes Confirmed for the order item (ShoppingCartItemMovedToOrderItemEvent consumer links it; the hold already reserved the place). | D; FIT (ShoppingCartItemMovedToOrderItemEvent) |
| AC-CAT-027-01-05 | US-CAT-027-01 | **Given** a hold expires before the order is placed, **when** the shopper continues to checkout, **then** the item is refused with message Cat.SlotHoldExpired and the shopper chooses again. | Proposed |
| AC-CAT-027-02-02 | US-CAT-027-02 | **Given** an order with a Confirmed booking is cancelled, **when** OrderStatusChangedEvent reports Cancelled, **then** the consumer enqueues release; the release task frees the place (Released); a nightly task recounts capacity from bookings. | D; FIT (OrderStatusChangedEvent; consumers swallow exceptions) |
| AC-CAT-027-02-03 | US-CAT-027-02 | **Given** SVC-002 is installed (P2) and generates slots for a resource (IC-SVC-01 GenerateSlots through IC-CAT-07 WriteSlots), **when** a generated capacity is below the Confirmed bookings of a slot, **then** the capacity is not reduced and the slot is listed for staff; other slots are written. | Proposed; see SVC-002 (IC-SVC-01) |
| AC-CAT-027-03-01 | US-CAT-027-03 | **Given** slots for service S exist at outlets O1 and O2 (BookingSlot.StorePickupPointId, LOG-003 outlets), **when** EGV-003 asks for free slots of S, **then** the free slots of each outlet are returned with remaining places; outlets with no free slot return none. | D; Proposed (outlet on slot) |
| AC-CAT-027-03-02 | US-CAT-027-03 | **Given** a slot has a free place, **when** EGV-003 calls Book for a citizen and the slot (IC-CAT-07), **then** under ILocker key 'cat-slot-{SlotId}' a booking is created directly in state Confirmed with no cart item or order item, and its BookingId is returned for EGV to store on the application; a full slot is refused with message Cat.SlotFull. | D; Proposed (direct booking) |
| AC-CAT-027-04-01 | US-CAT-027-04 | **Given** a Confirmed booking and a slot T with a free place, **when** a caller of IC-CAT-07 Move (SVC-003 when the Services pack is installed; in P1 no feature calls it) moves the booking to T, **then** both slot locks are taken in ascending SlotId order; the booking moves to T and the old place is freed; if T is full the move is refused with message Cat.SlotFull and nothing changes. | Proposed; see SVC-003 (SM-SVC-02) |
| AC-CAT-027-04-02 | US-CAT-027-04 | **Given** a Confirmed booking, **when** a caller of IC-CAT-07 RecordOutcome (SVC-003 when installed) records outcome CancelledByCustomer or CancelledByProvider, **then** the booking becomes Released and its place is freed; the SVC outcome is stored on the booking (SVC extension columns). | Proposed; see SVC-003 (SM-SVC-02) |
| AC-CAT-027-04-03 | US-CAT-027-04 | **Given** a Confirmed booking, **when** a caller of IC-CAT-07 RecordOutcome (SVC-003 when installed) records outcome Attended, NoShowCustomer or NoShowProvider, **then** the booking becomes Completed and its place is not freed. | Proposed; see SVC-003 (SM-SVC-02) |
| AC-CAT-027-04-04 | US-CAT-027-04 | **Given** a booking is not Confirmed, **when** a caller (SVC-003 when installed) calls Move or RecordOutcome, **then** the call is refused with error Transition not allowed and nothing changes. | Proposed |
| AC-CAT-027-02-04 | US-CAT-027-02 | **Given** a user with Misc.Catalogue.Bookings.CreateEditDelete opens a service listing with no Services pack installed, **when** they add slots (start, end, capacity, optional outlet) and save, **then** the slots are written through IC-CAT-07 WriteSlots under the slot locks and are offered on the listing; a slot whose end is not after its start, or whose capacity is below its Confirmed bookings, is refused and nothing is saved. | Proposed (P1 slot definition without SVC-002) |

**Business rules applied:** BR-CAT-021; BR-CAT-032 (§8.1).


### 7.28 PRD-CAT-028 Listing geo-location

| Item | Value |
|---|---|
| Description (baseline) | Records a listing's map location and shows it on a map. An area, for example a farm plot, can be drawn as a shape on the map. |
| Why it matters | Customers can see where a product or service is located. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-028-01 | As a shopper, I want to see where a product or service is on a map, including an area drawn as a shape, so that I know where it is. | D; FC-M01-020 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-028-01-01 | US-CAT-028-01 | **Given** geo-location is enabled, **when** staff save latitude and longitude on a listing, **then** values outside -90..90 or -180..180 are refused with message Cat.CoordinatesInvalid; valid values are stored. | D |
| AC-CAT-028-01-02 | US-CAT-028-01 | **Given** a polygon is drawn for a listing, **when** it is saved, **then** it is stored as a closed polygon; an unclosed or self-crossing shape is refused with message Cat.CoordinatesInvalid. | D; Proposed (validation) |
| AC-CAT-028-01-03 | US-CAT-028-01 | **Given** a listing has a location and a map provider is configured, **when** a shopper opens the page, **then** a map shows the point or shape. | D |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.29 PRD-CAT-029 Product reviews and ratings

| Item | Value |
|---|---|
| Description (baseline) | Customers write reviews and give star ratings, which are moderated; others can mark reviews helpful; reviews can be limited to people who bought the product. |
| Why it matters | Honest feedback helps others decide. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-029-01 | As a shopper, I want to write a review and star rating after I bought a product and mark other reviews helpful, so that others can decide better. | D; REQ-KTDA-REV-001; REQ-MPC-FR-075 | Ready |
| US-CAT-029-02 | As a member of catalogue staff, I want to approve reviews before they appear and to reply to them, so that reviews are fair and answered. | D; REQ-MPC-FR-075 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-029-01-01 | US-CAT-029-01 | **Given** catalogsettings.productreviewpossibleonlyafterpurchasing is on, **when** a customer without a completed order for the product tries to review, **then** the review is refused with the native message Reviews.ProductReviewPossibleOnlyAfterPurchasing. | REQ-MPC-FR-075; FIT (ProductReviewService:185-193) |
| AC-CAT-029-01-02 | US-CAT-029-01 | **Given** a customer with a completed order writes a review with title, text and rating, **when** it is submitted, **then** it is stored with the rating and text (comments) and shown after approval. | REQ-KTDA-REV-001; REQ-MPC-FR-075; FIT (ProductReview) |
| AC-CAT-029-01-03 | US-CAT-029-01 | **Given** catalogsettings.onereviewperproductfromcustomer is on, **when** the customer tries a second review of the same product, **then** it is refused (native). | REQ-MPC-FR-075; FIT |
| AC-CAT-029-01-04 | US-CAT-029-01 | **Given** captchasettings.showonproductreviewpage and captchasettings.enabled are on, **when** a review is submitted without a valid captcha, **then** it is refused (native). | REQ-MPC-FR-075; FIT (CaptchaSettings.ShowOnProductReviewPage) |
| AC-CAT-029-01-05 | US-CAT-029-01 | **Given** a review is published, **when** another customer marks it helpful or not helpful, **then** HelpfulYesTotal or HelpfulNoTotal increases (native). | D; FIT (ProductReviewHelpfulness) |
| AC-CAT-029-02-01 | US-CAT-029-02 | **Given** catalogsettings.productreviewsmustbeapproved is on, **when** a review is submitted, **then** it is not shown until a user with Catalog.ProductReviewsCreateEditDelete approves it; approval raises ProductReviewApprovedEvent. | REQ-MPC-FR-075; FIT |
| AC-CAT-029-02-02 | US-CAT-029-02 | **Given** staff write a reply, **when** it is saved, **then** the reply is shown under the review and, if catalogsettings.notifycustomeraboutproductreviewreply is on, the reviewer is notified. | D; FIT (ProductReview.ReplyText) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.30 PRD-CAT-030 Product returnability flag

| Item | Value |
|---|---|
| Description (baseline) | Marks products that cannot be returned, in line with the returns policy. |
| Why it matters | Avoids disputes about non-returnable items. |
| Who benefits | Shoppers; client staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-030-01 | As a seller, I want to mark products that cannot be returned, so that shoppers know before buying and returns follow the policy. | D; REQ-MPC-FR-067 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-030-01-01 | US-CAT-030-01 | **Given** a seller sets NotReturnable on a product, **when** a shopper opens the return request page for an order holding it, **then** the item is not offered for return (native ReturnRequestController uses isNotReturnable: false). | REQ-MPC-FR-067; FIT (Product.NotReturnable; OrderService.GetOrderItemsAsync) |
| AC-CAT-030-01-02 | US-CAT-030-01 | **Given** a product is not returnable, **when** a shopper opens its page, **then** the label Cat.NotReturnable is shown near the price. | REQ-MPC-FR-067; Proposed (label) |
| AC-CAT-030-01-03 | US-CAT-030-01 | **Given** the platform returns policy marks a category as not returnable (setting), **when** a seller creates a product in it, **then** NotReturnable is pre-set and the seller cannot clear it. | REQ-MPC-FR-067 ("consistent with platform returns policy"); Proposed (mechanism) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.31 PRD-CAT-031 Product page delivery promise

| Item | Value |
|---|---|
| Description (baseline) | The product page shows how long delivery will take, who sells it, delivery options and a returns summary. The page also explains how disputes are resolved, and the same explanation appears on the order page; the returns-policy summary also appears on the order page. |
| Why it matters | Customers know what to expect before buying. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Theme/view override + Custom plugin |
| Depends on | PRD-LOG-005 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-031-01 | As a shopper, I want the product page to show price, seller, delivery options, estimated delivery time and a returns summary, so that I know what to expect before buying. | D; REQ-MPC-FR-068 | Ready |
| US-CAT-031-02 | As a shopper, I want to see the delivery window and whether pickup is available on the product page, so that I can plan to receive it. | REQ-MPC-FR-088 | Ready |
| US-CAT-031-03 | As a shopper, I want the returns policy and how disputes are resolved on the product page and the order page, so that I know my rights. | D; REQ-MPC-FR-234 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-031-01-01 | US-CAT-031-01 | **Given** vendorsettings.showvendoronproductdetailspage is on, **when** a shopper opens a seller's product, **then** the price and the seller name with a link to the seller page are shown. | REQ-MPC-FR-068; FIT (VendorSettings.ShowVendorOnProductDetailsPage) |
| AC-CAT-031-01-02 | US-CAT-031-01 | **Given** shippingsettings.estimateshippingproductpageenabled is on, **when** a shopper enters or has a delivery location, **then** the available delivery options with their fees are listed (native estimate). | REQ-MPC-FR-068; FIT (ShippingSettings.EstimateShippingProductPageEnabled) |
| AC-CAT-031-02-01 | US-CAT-031-02 | **Given** LOG-005 returns an estimated delivery window for the product and the shopper location, **when** a shopper opens the page, **then** the window is shown with label Cat.DeliveryPromise; without a location the native DeliveryDate of the product is shown. | REQ-MPC-FR-088; REQ-MPC-FR-068; depends on PRD-LOG-005 (workbook) |
| AC-CAT-031-02-02 | US-CAT-031-02 | **Given** pickup in store is active (shippingsettings.allowpickupinstore) and the product ships, **when** a shopper opens the page, **then** label Cat.PickupAvailable is shown. | REQ-MPC-FR-088; FIT (ShippingSettings.AllowPickupInStore) |
| AC-CAT-031-03-01 | US-CAT-031-03 | **Given** the returns-policy topic and the dispute-process topic are published and their system names are set in the RET settings (RET-001, RET-007; per language through the native Topic), **when** a shopper opens a product page or an order details page, **then** CAT shows a summary of both topics with links to the full topics (widget zones productdetails_overview_bottom and orderdetails_page_bottom); RET does not render them on these pages. | REQ-MPC-FR-234; REQ-MPC-FR-068; FIT (PublicWidgetZones, Topic) |
| AC-CAT-031-03-02 | US-CAT-031-03 | **Given** a topic system name is not set in the RET settings or the topic is not published, **when** a shopper opens a product page, **then** that summary is not shown and no broken link is rendered. | Proposed |
| AC-CAT-031-03-03 | US-CAT-031-03 | **Given** the product is not returnable, **when** the summary is shown, **then** it states that this item cannot be returned (Cat.NotReturnable). | REQ-MPC-FR-234 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.32 PRD-CAT-032 Catalogue audit log

| Item | Value |
|---|---|
| Description (baseline) | Records who viewed or changed what on a product, from which internet address, with old and new values. |
| Why it matters | Accountability for product and price changes. |
| Who benefits | Auditors; catalogue managers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEC-004 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-032-01 | As an auditor, I want a per-listing record of who viewed or changed what, from which internet address, with old and new values, so that product and price changes are accountable. | D; FC-M01-045 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-032-01-01 | US-CAT-032-01 | **Given** SEC-004 records changes with old and new values, **when** a user with Misc.Catalogue.Audit.View opens a listing's audit tab, **then** all changes, state changes and approval decisions for that product are listed with time, user, IP address, field, old and new value. | D |
| AC-CAT-032-01-02 | US-CAT-032-01 | **Given** a staff user opens the product edit page in admin, **when** the page is served, **then** a view entry with user, time and IP address is written (CAT action filter on Admin ProductController.Edit GET) (AUD-CAT-011). | D |
| AC-CAT-032-01-03 | US-CAT-032-01 | **Given** a user lacks Misc.Catalogue.Audit.View, **when** they open the audit tab, **then** access is denied. | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.33 PRD-CAT-033 Promoted listings with fees

| Item | Value |
|---|---|
| Description (baseline) | Sellers can pay to feature their products in prominent places, under rules and schedules the client sets. |
| Why it matters | An extra revenue stream for the client. |
| Who benefits | Sellers; clients |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-033-01 | As a seller, I want to pay to feature my products in prominent places, so that more buyers see them. | D; REQ-MPC-FR-070 | Ready |
| US-CAT-033-02 | As a member of marketing staff, I want placement rules, schedules and fees that I set, so that placements are fair and earn revenue. | D; REQ-MPC-FR-070 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-033-01-01 | US-CAT-033-01 | **Given** placement types (home page, category featured, search boost, banner) with fees per period are configured, **when** a seller requests a placement for a published product and dates, **then** a request is stored as Requested with the fee for the period (SM-CAT-06). | REQ-MPC-FR-070 |
| AC-CAT-033-02-01 | US-CAT-033-02 | **Given** a request is Requested, **when** marketing staff approve it, **then** it becomes Approved; on the start date the task sets the native flag (ShowOnHomepage or ProductCategory.IsFeaturedProduct) and it becomes Active; on the end date the flag is cleared and it becomes Ended. | REQ-MPC-FR-070; FIT (vendors cannot set ShowOnHomepage natively: ProductController Create/Edit) |
| AC-CAT-033-02-02 | US-CAT-033-02 | **Given** a placement type has a maximum number of slots, **when** approving a request would exceed it for any day of the period, **then** approval is refused with message Cat.PlacementFull (check under ILocker key 'cat-placement-{PlacementTypeId}'). | REQ-MPC-FR-070 |
| AC-CAT-033-02-03 | US-CAT-033-02 | **Given** an Active placement's product leaves state Published, **when** the change is saved, **then** the placement becomes Suspended and the native flag is cleared. | Proposed |
| AC-CAT-033-01-02 | US-CAT-033-01 | **Given** a placement is approved, **when** the fee is due, **then** the fee is recorded as a charge to the seller for SEL settlement. | Proposed; see Open items |

**Business rules applied:** BR-CAT-022 (§8.1).


### 7.34 PRD-CAT-034 Catalogue analytics

| Item | Value |
|---|---|
| Description (baseline) | Reports on product views, how often views turn into sales, out-of-stock rates and why listings were rejected. It also shows watchlist and cart additions, which filters people use, and how many visitors leave at once. |
| Why it matters | Shows which products work and what to improve. |
| Who benefits | Catalogue and marketing staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-034-01 | As a member of catalogue staff, I want reports on active listings, categories, out-of-stock rate and listing rejection reasons, so that we know which products work and what to improve. | D; REQ-MPC-FR-066 | On hold: PAID-STUB |
| US-CAT-034-02 | As a member of marketing staff, I want views, cart and wishlist additions and conversion per product and category, so that we improve the catalogue. | D; REQ-MPC-FR-091 | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-034-01-01 | US-CAT-034-01 | **Given** a user holds Misc.Catalogue.Analytics.View, **when** they open catalogue analytics for a period, **then** they see counts of listings by state and category, the out-of-stock rate (published listings with stock 0 over published listings), and rejection counts by reason from CAT-043. | REQ-MPC-FR-066 |
| AC-CAT-034-02-01 | US-CAT-034-02 | **Given** product pages are viewed, **when** the ProductDetailsModel is prepared (ModelPreparedEvent<BaseNopModel>), **then** a CAT consumer adds one view to the daily counter of the product; cart and wishlist additions are counted from EntityInsertedEvent<ShoppingCartItem>. | D; FIT (ModelPreparedEvent; Misc.RFQ uses the same event) |
| AC-CAT-034-02-02 | US-CAT-034-02 | **Given** counters and orders exist for a period, **when** the report runs, **then** views, cart additions, wishlist additions, orders and conversion (orders over views) are shown per product and per category. | REQ-MPC-FR-091 |
| AC-CAT-034-02-03 | US-CAT-034-02 | **Given** Widgets.GoogleAnalytics is configured, **when** the report shows filter use and bounce rate, **then** these values are read from the web analytics feed of SRC-021; without it the columns show "not available". | D; see SRC-021 |
| AC-CAT-034-02-04 | US-CAT-034-02 | **Given** a category page or a search results page is shown with products (ModelPreparedEvent<BaseNopModel> with CategoryModel, SearchModel or CatalogProductsModel), **when** the model is prepared, **then** a CAT consumer adds one list impression per listed product to the daily list counter of that product and source (Category with CategoryId, or Search). | REQ-MPC-FR-091; FIT (PublishModelEventsAttribute publishes ViewData.Model for CatalogController.Category, GetCategoryProducts, Search, SearchProducts) |
| AC-CAT-034-02-05 | US-CAT-034-02 | **Given** a product page request carries a Referer of a category page or the search page of the same store, **when** the ProductDetailsModel is prepared, **then** one list click is added for that product and source; requests without such a Referer count as views only. | REQ-MPC-FR-091; Proposed (Referer attribution) |
| AC-CAT-034-02-06 | US-CAT-034-02 | **Given** list impressions, list clicks, views, cart additions and orders exist for a period, **when** a user with Misc.Catalogue.Analytics.View runs the report by category or by search, **then** click-through (list clicks over list impressions) and conversion (orders over views) are shown per category and for search results. | REQ-MPC-FR-091 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.35 PRD-CAT-035 Listing syndication and product feeds

| Item | Value |
|---|---|
| Description (baseline) | Sends product information to other marketplaces and shopping comparison sites. |
| Why it matters | Reaches more buyers outside the shop. |
| Who benefits | Marketing staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-035-01 | As a member of marketing staff, I want to send product information to marketplaces and comparison sites, so that we reach buyers outside the shop. | D; FC-M01-048 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-035-01-01 | US-CAT-035-01 | **Given** a feed target with format, product filter and schedule is configured, **when** the feed task runs, **then** a feed file with published, in-stock-or-backorderable products matching the filter is generated through the target adapter and published to the target location (IC-CAT-02). | D |
| AC-CAT-035-01-02 | US-CAT-035-01 | **Given** a product in the feed is withdrawn or paused, **when** the next run happens, **then** it is removed from the feed. | D |
| AC-CAT-035-01-03 | US-CAT-035-01 | **Given** a run fails, **when** the adapter reports an error, **then** the run is marked Failed with the error and staff are notified. | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.36 PRD-CAT-036 Catalogue segmentation by buyer channel

| Item | Value |
|---|---|
| Description (baseline) | Shows different product ranges to different customer groups, for example bulk tea for traders and packaged tea for consumers. |
| Why it matters | Each audience sees what is relevant to them. |
| Who benefits | Shoppers; business buyers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-036-01 | As a client administrator, I want to show different product ranges to different customer groups, for example bulk tea to traders and packaged tea to consumers, so that each audience sees what is relevant. | D; REQ-KTDA-CAT-002 | Ready |
| US-CAT-036-02 | As a member of sales staff, I want the catalogue to support several business models through segments, so that retail and bulk buyers each get their range. | Inference from REQ-KTDA-PRJ-002 (retail and bulk business models) | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-036-01-01 | US-CAT-036-01 | **Given** bulk teas and packaged teas are in separate top-level categories, **when** a shopper browses, **then** the two ranges are listed separately in navigation and category pages. | REQ-KTDA-CAT-002; FIT (Category) |
| AC-CAT-036-01-02 | US-CAT-036-01 | **Given** the bulk category and its products are limited to a trader role (name configured per client) (ACL) and catalogsettings.ignoreacl is false, **when** a customer without that role browses or searches, **then** bulk products and the bulk category are not shown. | D; FIT (AclRecord; IAclSupported) |
| AC-CAT-036-02-01 | US-CAT-036-02 | **Given** a separate storefront exists for a business model (store mapping), **when** a product is mapped only to that store, **then** it is shown only in that store. | Inference from REQ-KTDA-PRJ-002 (retail and bulk business models); FIT (StoreMapping) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.37 PRD-CAT-037 Order quantity rules

| Item | Value |
|---|---|
| Description (baseline) | Sets minimum, maximum and allowed multiples of quantity per product (for example sold only in cartons of 12). Orders above the maximum can be sent for approval instead of being refused. |
| Why it matters | Prevents orders in quantities that cannot be supplied. |
| Who benefits | Business buyers; sales staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-037-01 | As a member of sales staff, I want minimum, maximum and multiples-of quantities per product, so that orders come in quantities we can supply. | D; FC-M01-013 | Ready; conditions: OVR-REG |
| US-CAT-037-02 | As a business buyer, I want to send an order above the maximum for approval instead of having it refused, so that I can still buy large quantities. | D; FC-M01-013 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-037-01-01 | US-CAT-037-01 | **Given** OrderMinimumQuantity and OrderMaximumQuantity are set, **when** a shopper enters a quantity outside them, **then** the native warnings ShoppingCart.MinimumQuantity / ShoppingCart.MaximumQuantity are shown (unless BR-CAT-023 approval applies). | D; FIT (ShoppingCartService:404-413) |
| AC-CAT-037-01-02 | US-CAT-037-01 | **Given** a multiple of 12 is set, **when** a shopper enters 30, **then** the item is refused with message Cat.QuantityNotMultiple; 24 or 36 are accepted (CAT cart rule provider IC-CHK-01 of the CHK-003 IShoppingCartService host, BR-CAT-032). | D; OVR-REG; see CHK-003 (IC-CHK-01) |
| AC-CAT-037-02-01 | US-CAT-037-02 | **Given** over-maximum approval is on for the product, **when** a buyer enters a quantity above the maximum, **then** message Cat.QuantityAboveMaximum offers "send for approval"; choosing it calls IC-ADM-03 Submit (object type OverMaxRequest) and the line is not added to the cart until approved. | D; Proposed (mechanism); see ADM-006 (IC-ADM-03) |
| AC-CAT-037-02-02 | US-CAT-037-02 | **Given** the approval is granted, **when** ADM-006 calls the CAT OnApproved callback (IC-ADM-03) and the buyer adds the line, **then** the OverMaxRequest becomes Approved and the line can be added once with the approved quantity; the native ShoppingCart.MaximumQuantity warning is dropped for that line by the CAT replacer registered with the CHK-003 host (BR-CAT-023). | Proposed; see CHK-003 (IC-CHK-01 replacer, BR-CHK-015) |

**Business rules applied:** BR-CAT-023; BR-CAT-032 (§8.1).


### 7.38 PRD-CAT-038 Guided seller listing wizard

| Item | Value |
|---|---|
| Description (baseline) | A step-by-step form that guides sellers through creating a listing, adapted to the category. |
| Why it matters | Sellers create complete listings without training. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-038-01 | As a seller, I want a step-by-step form that guides me through creating a listing and adapts to the category, so that I create complete listings without training. | D; REQ-MPC-FR-051; FC-M06-009 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-038-01-01 | US-CAT-038-01 | **Given** a seller starts a new listing in the wizard, **when** they choose a category, **then** the following steps (identification, attributes, pricing, media, compliance, tax) show the fields of the category schema (CAT-005), required ones marked. | D; FC-M06-009 |
| AC-CAT-038-01-02 | US-CAT-038-01 | **Given** a step has a missing required field, **when** the seller presses next, **then** the step is not left and message Cat.MandatoryFieldMissing names the field. | REQ-MPC-FR-051 |
| AC-CAT-038-01-03 | US-CAT-038-01 | **Given** the seller leaves the wizard part way, **when** they come back, **then** the listing is a Draft product with the entered values and the wizard resumes at the first incomplete step. | D; Proposed |
| AC-CAT-038-01-04 | US-CAT-038-01 | **Given** the last step is complete, **when** the seller presses submit, **then** the listing is submitted for review (CAT-022) with the same checks as the product form. | REQ-MPC-FR-051; D |

**Business rules applied:** BR-CAT-002 (§8.1).


### 7.39 PRD-CAT-039 Customer and company price lists

| Item | Value |
|---|---|
| Description (baseline) | Special price lists for a particular company or customer, including contract prices with validity dates, which override standard prices. |
| Why it matters | Supports negotiated prices for key customers. |
| Who benefits | Business buyers; sales staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | PRD-IAM-022 |
| Status | On hold: PH-INF |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-039-01 | As a member of sales staff, I want special price lists for a company or customer, including contract prices with validity dates, that override standard prices, so that key customers get their negotiated prices. | D; Inference from REQ-KTDA-PRJ-002 (contract and bulk business models) | On hold: PH-INF |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-039-01-01 | US-CAT-039-01 | **Given** price list L for company K (IAM-022) holds product P at a price with validity dates and is active, **when** a buyer of company K views or buys P within the dates, **then** Withdrawn (VER-500, PRICE-500): now native — nopCommerce 5.00.1 applies customer and customer-role price lists inside PriceCalculationService.GetFinalPriceAsync (GetPriceListPriceAsync, PriceCalculationService.cs:77-140, 454-456), verified by AC-CAT-039-01-07; company binding is AC-CAT-039-01-11. Superseded text: the list price replaces the standard price and tier prices (precedence per BR-CAT-020), on the product page and in the cart. | VER-500; PRICE-500; FIT (Libraries/Nop.Services/Catalog/PriceCalculationService.cs:77-140, 454-456) |
| AC-CAT-039-01-02 | US-CAT-039-01 | **Given** a buyer belongs to company K and to role R with a tier price, **when** both apply, **then** Withdrawn (VER-500, PRICE-500): now native — natively a tier price that applies replaces the price-list price and there is no precedence setting (PriceCalculationService.cs:454-462); the configuration rule BR-CAT-034 and AC-CAT-039-01-09 replace this criterion. Superseded text: the price-list price wins unless the precedence setting says lowest price wins (B2B pack setting, default not stated). | VER-500; PRICE-500; FIT (Libraries/Nop.Services/Catalog/PriceCalculationService.cs:454-462) |
| AC-CAT-039-01-03 | US-CAT-039-01 | **Given** catalogsettings.cacheproductprices is on, **when** two customers with the same roles but different companies view P, **then** Withdrawn (VER-500, PRICE-500): now native — the price-list price is computed natively inside the cached block, whose key holds roles but not the customer (NopCatalogDefaults.ProductPriceCacheKey; PriceCalculationService.cs:426-438); the configuration rule BR-CAT-034 and AC-CAT-039-01-10 replace the custom out-of-cache application. Superseded text: each sees the price of their own company: the price-list price is applied outside the native cached block, whose key holds roles but not the customer (BR-CAT-020). | VER-500; PRICE-500; FIT (PriceCalculationService.cs:426-456; NopCatalogDefaults.ProductPriceCacheKey) |
| AC-CAT-039-01-04 | US-CAT-039-01 | **Given** a price list is changed, **when** it is saved, **then** the change is audited (AUD-CAT-009): the native admin writes the activity-log entries AddNewPriceList, EditPriceList and DeletePriceList, and the SEC-004 repository decorator records old and new values of PriceList, PriceListItem, PriceListCustomer and PriceListCustomerRole rows; CAT writes no audit call of its own. | Proposed; FIT (Presentation/Nop.Web/Areas/Admin/Controllers/PriceListController.cs:133, 210, 240); see SEC-004 |
| AC-CAT-039-01-05 | US-CAT-039-01 | **Given** a quote item from Misc.RFQ is in the cart, **when** the cart price is computed, **then** the quoted price wins over the price list (GetShoppingCartItemUnitPriceEvent stops processing before GetFinalPriceAsync is called). | FIT (ShoppingCartService.GetUnitPriceAsync, Libraries/Nop.Services/Orders/ShoppingCartService.cs:1401-1405) |
| AC-CAT-039-01-06 | US-CAT-039-01 | **Given** the price-list provider is registered with the CAT-042 IPriceCalculationService host (IC-CAT-05), **when** GetFinalPriceAsync runs for a buyer of company K, **then** Withdrawn (VER-500, PRICE-500): now native — the native base method applies price lists, so CAT-039 registers no IC-CAT-05 provider and the CAT-042 host never applies a price list a second time (BR-CAT-020). Superseded text: the host computes the native result first and then asks the price providers in precedence order; the first provider that returns a price sets it (BR-CAT-020). | VER-500; PRICE-500; OVR-REG; FIT (PriceCalculationService.cs:454-456) |
| AC-CAT-039-01-07 | US-CAT-039-01 | **Given** a user holding Catalog.PriceListsCreateEditDelete creates price list L in Catalog > Price lists (name, active, start and end date, calculation type PercentageDecrease, PercentageIncrease, AmountDecrease, AmountIncrease or FixedPrice with its value, priority), adds product P (optionally with a manual price) and assigns customer C or customer role R, **when** C, or a member of R, views or buys P while L is active and within its dates, **then** the price-list price (the manual price of P, else the product price adjusted by the calculation type and value) replaces the product price on the product page, in the cart and in the order; outside the dates, or with L inactive, the product price applies. | D; Inference from REQ-KTDA-PRJ-002 (contract prices); FIT (Libraries/Nop.Core/Domain/PriceLists/PriceList.cs, PriceListItem.cs, PriceListCustomer.cs, PriceListCustomerRole.cs; Libraries/Nop.Services/PriceLists/PriceListService.cs:325-341; PriceCalculationService.cs:77-140; Presentation/Nop.Web/Areas/Admin/Controllers/PriceListController.cs:97-430; StandardPermission.cs:76-78); VER-500; PRICE-500 |
| AC-CAT-039-01-08 | US-CAT-039-01 | **Given** more than one active price list of the buyer contains P, **when** the price is computed, **then** with CatalogSettings.PriceListStrategy MinimalPrice (installation default) the lowest of the list prices applies; with UseByPriority the list with the lowest Priority number applies; the strategy is a client setting (BR-CAT-034). | FIT (PriceCalculationService.cs:111-138; Libraries/Nop.Services/Installation/InstallRequiredData.cs:1456); VER-500; PRICE-500 |
| AC-CAT-039-01-09 | US-CAT-039-01 | **Given** product P is in a price list of buyer B and a tier price of P also applies to B (role, store and quantity), **when** the price is computed, **then** the tier price is charged (native: the tier price replaces the price-list price); configuration rule BR-CAT-034: a product in a contract price list carries no tier price for the same buyers, and the CAT pricing-conflicts list in Catalog > Price lists shows every product where both apply so that sales staff remove the tier price or accept it. | FIT (PriceCalculationService.cs:454-462); PRICE-500; Proposed (conflicts list) |
| AC-CAT-039-01-10 | US-CAT-039-01 | **Given** any price list is assigned to individual customers (PriceListCustomer), **when** the client configuration is applied or validated (PLT-003), **then** catalogsettings.cacheproductprices must be off (installation default off); a pack that switches it on while customer-level price lists exist fails validation, because the cached price is keyed by customer roles and store, not by customer, and one customer's contract price would be shown to another customer with the same roles (BR-CAT-034); role-level price lists are safe with the cache on. | FIT (NopCatalogDefaults.ProductPriceCacheKey; PriceCalculationService.cs:426-456; InstallRequiredData.cs:1523); PRICE-500; Proposed (pack validation); see PLT-003 |
| AC-CAT-039-01-11 | US-CAT-039-01 | **Given** company K exists in IAM-022, **when** sales staff give K a contract price list, **then** the list is assigned to the system customer role of company K (the CompanyAssortment-{CompanyId} role created by CAT-040, BR-IAM-050) so that every member of K gets it and loses it with membership; until CAT-040 is delivered the list is assigned to each member customer (and BR-CAT-034 cache rule applies). | D; Proposed; see IAM-022 (IC-IAM-07) |
| AC-CAT-039-01-12 | US-CAT-039-01 | **Given** a user holds Catalog.PriceListsImportExport, **when** they export price lists to Excel or import a price-list workbook, **then** the native export and import run; an import that names a product that does not exist stops with the native message Admin.PriceLists.Import.ProductsDontExist and imports nothing from that file. | FIT (PriceListController.cs:435-489; IImportManager.ImportPriceListsFromXlsxAsync, Libraries/Nop.Services/ExportImport/IImportManager.cs:76); VER-500 |
| AC-CAT-039-01-13 | US-CAT-039-01 | **Given** a client runs several stores (PLT-013) or several currencies (PLT-010), **when** a price list applies to a buyer, **then** it applies in every store of the instance (PriceList has no store field) and its price is a primary-store-currency amount converted at display; a store-only or fixed foreign-currency contract price needs a store-specific role or the CAT-042 fixed currency price. | FIT (Libraries/Nop.Core/Domain/PriceLists/PriceList.cs: no StoreId or CurrencyId); PRICE-500 |

**Business rules applied:** BR-CAT-020; BR-CAT-034 (§8.1).


### 7.40 PRD-CAT-040 Company-specific assortment

| Item | Value |
|---|---|
| Description (baseline) | Controls exactly which products each company can see, beyond the standard customer-group rules. |
| Why it matters | Companies see only the products agreed for them. |
| Who benefits | Business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-IAM-022 |
| Status | On hold: PH-INF |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-040-01 | As a business buyer, I want to see exactly the products agreed for my company, so that I order only from my agreed range. | D | On hold: PH-INF |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-040-01-01 | US-CAT-040-01 | **Given** an assortment for company K lists products P1 and P2 (allow-list), **when** a buyer of K browses, **then** P1 and P2 are shown; products limited to other companies are not. | D; Proposed (mechanism) |
| AC-CAT-040-01-02 | US-CAT-040-01 | **Given** the assortment is saved, **when** the CAT plugin applies it, **then** a system customer role per company (created by CAT, linked to IAM-022; system name pattern Proposed: CompanyAssortment-{CompanyId}, as BR-IAM-050 leaves the pattern to CAT) is added to the ACL of the listed products (SubjectToAcl true); the native ACL then filters catalogue, search and product pages. | Proposed; FIT (AclRecord) |
| AC-CAT-040-01-03 | US-CAT-040-01 | **Given** a product is in no company assortment, **when** any buyer browses, **then** its visibility follows the normal ACL rules. | Proposed |
| AC-CAT-040-01-04 | US-CAT-040-01 | **Given** CAT-040 is registered as a membership provider with IAM (IC-IAM-07 OnMembershipChanged) and company K has an assortment role, **when** a customer is added to or removed from company K in IAM-022, **then** inside the same save CAT adds or removes the customer's mapping to the assortment role of K through ICustomerService; if CAT fails, IAM does not save the membership change. | Proposed; see IAM-022 (IC-IAM-07) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.41 PRD-CAT-041 Units of measure and pack selling

| Item | Value |
|---|---|
| Description (baseline) | Sell by kilogram, chest or carton, with pack sizes and prices based on weight. |
| Why it matters | Matches how bulk goods such as tea are really traded. |
| Who benefits | Business buyers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin; Core modification (conditional, decision UOM-01) |
| Depends on | — |
| Status | On hold: PH-INF, UOM-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-041-01 | As a business buyer, I want to buy by kilogram, chest or carton, with pack sizes and prices based on weight, so that I buy the way bulk tea is traded. | D; Inference from REQ-KTDA-PRJ-002 (bulk business model) | On hold: PH-INF, UOM-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-041-01-01 | US-CAT-041-01 | **Given** UOM-01 is decided "integer base units", product P has base unit 100 g and a price per base unit, and pack sizes 1 kg and chest are defined with their base-unit counts, **when** a buyer selects the chest pack, **then** quantity is held as an integer number of packs, the price is pack base-unit count times the price per base unit, and the base price per kg is shown (Product.BasepriceEnabled, BasepriceUnitId) — held by UOM-01. | D; Inference from REQ-KTDA-PRJ-002 (bulk); FIT (Product.BasepriceEnabled) |
| AC-CAT-041-01-02 | US-CAT-041-01 | **Given** UOM-01 is decided "fractional quantities", **when** a buyer enters 2.5 kg, **then** the quantity is accepted and stored as a decimal through cart, order, shipment and stock — held by UOM-01; this needs the core modification registered in L1 §6.3. | D; UOM-01 |
| AC-CAT-041-01-03 | US-CAT-041-01 | **Given** a unit of measure is defined, **when** it is saved, **then** it has a code, a name, a base unit and a conversion factor; a factor of zero or below is refused. | Proposed |

**Business rules applied:** BR-CAT-024 (§8.1).


### 7.42 PRD-CAT-042 Fixed prices per currency

| Item | Value |
|---|---|
| Description (baseline) | Set a fixed price in each currency instead of converting from the base currency. |
| Why it matters | Prices in foreign currencies stay stable and round. |
| Who benefits | International buyers; sales staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (DI override) |
| Depends on | — |
| Status | On hold: PH-INF |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-042-01 | As a member of sales staff, I want to set a fixed price in each currency instead of converting from the base currency, so that foreign-currency prices stay stable and round. | D; Inference from REQ-KTDA-LOC-002 (multi-currency) | On hold: PH-INF |
| US-CAT-042-02 | Technical enabler. As a developer of another product module (PAY-009 wallet, FIN-003 premium), I want one IOrderTotalCalculationService override owned by CAT-042 into which my module plugs an order-total adjustment, with the adjustment reserved, recorded against the order and kept on admin order edits, so that the order total is changed once, the same way on every path, and the amount used is recorded. | OVR-REG; WAL-01; FIT (L1 section 6.2 principle 7) | On hold: PH-INF |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-042-01-01 | US-CAT-042-01 | **Given** product P has a fixed price F in currency C and the shopper works in C, **when** the product page, cart and order total are shown, **then** the shopper sees and is charged exactly F per unit (IPriceCalculationService, Nop.Web IProductModelFactory / IShoppingCartModelFactory and IOrderTotalCalculationService overrides) (BR-CAT-025). | D; Inference from REQ-KTDA-LOC-002 (fixed prices in non-base currencies); FIT (Product.Price single; Currency.Rate) |
| AC-CAT-042-01-02 | US-CAT-042-01 | **Given** an order in currency C with fixed prices is placed, **when** the order is saved, **then** line amounts are stored in the primary store currency as F divided by Order.CurrencyRate, so that the native conversion on display gives back F; the order also records that fixed prices were used. | D; FIT (OrderProcessingService sets CurrencyRate = customer rate / primary rate) |
| AC-CAT-042-01-03 | US-CAT-042-01 | **Given** P has no fixed price in currency C, **when** the shopper works in C, **then** the native converted price is shown. | D; Proposed (fallback) |
| AC-CAT-042-01-04 | US-CAT-042-01 | **Given** catalogsettings.cacheproductprices is on, **when** shoppers in two currencies view P, **then** each sees the price of their currency: the fixed price is applied outside the native cached block, whose key does not hold the currency (BR-CAT-020). | FIT (ProductPriceCacheKey) |
| AC-CAT-042-01-05 | US-CAT-042-01 | **Given** a fixed price is changed, **when** it is saved, **then** the change is audited (AUD-CAT-014). | Proposed |
| AC-CAT-042-02-01 | US-CAT-042-02 | **Given** order-total adjustment providers are registered with the CAT IOrderTotalCalculationService host (IC-CAT-06 Adjust): PAY-009 of kind Deduction (only under WAL-01 option (b)) and, if confirmed, FIN-003 of kind Charge, **when** GetShoppingCartTotalAsync runs for a cart with total T after native discounts, gift cards and reward points, **then** the host calls each provider in its declared order with the running total; a Deduction (zero to the running total) is subtracted and a Charge (zero or more) is added; the result is never below zero; each applied adjustment is kept with provider, kind, amount, label and reference for the current request (BR-CAT-033). | OVR-REG; WAL-01; FIT (OrderTotalCalculationService.GetShoppingCartTotalAsync is public virtual and applies gift cards and reward points last, OrderTotalCalculationService.cs:1327-1416) |
| AC-CAT-042-02-02 | US-CAT-042-02 | **Given** a provider returns a Deduction above the running total or a negative amount, **when** the total is computed, **then** a Deduction is clamped to the running total, a negative amount is ignored, and the case is logged. | Proposed |
| AC-CAT-042-02-03 | US-CAT-042-02 | **Given** no provider is registered, or the provider's pack feature is off for the store (BR-CAT-027), **when** the total is computed, **then** the native result is returned unchanged. | OVR-REG |
| AC-CAT-042-02-04 | US-CAT-042-02 | **Given** an applied adjustment exists for the cart, **when** the cart or checkout order totals are shown, **then** each adjustment is shown as its own line with the provider label and amount (CAT override of Nop.Web IShoppingCartModelFactory.PrepareOrderTotalsModelAsync). | Proposed; FIT (ShoppingCartModelFactory.PrepareOrderTotalsModelAsync is public virtual and calls GetShoppingCartTotalAsync) |
| AC-CAT-042-02-05 | US-CAT-042-02 | **Given** the cart total included adjustments and the CHK-003 override places the order, **when** the IC-CHK-06 Reserve phase runs, **then** the CAT-042 placement participant calls IC-CAT-06 Reserve on each provider with exactly the amount used in the order total (from the same request); if a provider refuses (for example the PAY-009 wallet balance is now lower), the placement is refused with the provider message and earlier reservations are released (BR-CHK-020). | OVR-REG; see CHK-004 (IC-CHK-06); Proposed |
| AC-CAT-042-02-06 | US-CAT-042-02 | **Given** all reservations succeeded and the sub-order is saved, **when** the IC-CHK-06 Confirm phase runs for that sub-order, **then** CAT writes one OrderTotalAdjustment row per adjustment (order, provider, kind, amount, label, reference) and calls IC-CAT-06 Confirm on the provider with the order ID, so that PAY-009 debits the wallet and writes its ledger entry against the order; this happens before OrderPlacedEvent (BR-CAT-033). | OVR-REG; see PAY-009; FIT (native records gift card use after the order is saved, OrderProcessingService.cs:1616-1627) |
| AC-CAT-042-02-07 | US-CAT-042-02 | **Given** payment or a later step of placement fails after a provider reserved, **when** the IC-CHK-06 Release phase runs, **then** CAT calls IC-CAT-06 Release on each provider that reserved; no OrderTotalAdjustment row is written. | OVR-REG; see CHK-004 (BR-CHK-020) |
| AC-CAT-042-02-08 | US-CAT-042-02 | **Given** an order has confirmed adjustments, **when** staff edit an order item in admin and the native UpdateOrderTotalsAsync recalculates the order, **then** the CAT override of the protected UpdateTotalAsync re-applies the stored amounts after the native total is set (a Deduction capped at the new total); providers are not called again and no wallet or premium amount changes (BR-CAT-033). | Proposed; FIT (OrderTotalCalculationService.UpdateTotalAsync is protected virtual and sets OrderTotal, OrderTotalCalculationService.cs:236-296; Admin OrderController.cs:1311, 1378, 1703) |
| AC-CAT-042-02-09 | US-CAT-042-02 | **Given** an order has confirmed adjustments, **when** DOC, RPT or PAY asks for them (IC-CAT-06 GetOrderAdjustments), or a DOC template uses token %Order.TotalAdjustments% (registered by CAT through IC-DOC-02, name Proposed), **then** the stored rows are returned with provider, kind, amount, label and reference; the token renders one line per adjustment. | Proposed; see DOC-001 (IC-DOC-02) |
| AC-CAT-042-01-06 | US-CAT-042-01 | **Given** buyer B has a native price list (CAT-039) that contains product P within its dates and P also has a fixed price in currency C, **when** B works in C, **then** the price-list price applies, converted to C at the current rate; the CAT-042 fixed-price provider checks the customer's applicable price lists through IPriceListService with the same filter as the native method and does not replace a contract price (BR-CAT-020). | Proposed; PRICE-500; FIT (PriceCalculationService.cs:77-140; Libraries/Nop.Services/PriceLists/IPriceListService.cs) |

**Business rules applied:** BR-CAT-020; BR-CAT-025; BR-CAT-031; BR-CAT-033; BR-CAT-034 (§8.1).


### 7.43 PRD-CAT-043 Seller listing moderation

| Item | Value |
|---|---|
| Description (baseline) | Client staff review products submitted by sellers and approve, reject or request changes, with reasons. |
| Why it matters | Keeps the quality of marketplace listings high. |
| Who benefits | Client staff; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CAT-022 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CAT-043-01 | As an approver, I want to review products submitted by sellers and approve, reject or request changes with reasons, so that marketplace listings stay of good quality. | D; REQ-MPC-FR-058 | On hold: WF-ENG |
| US-CAT-043-02 | As a seller, I want to see the decision and the reason for each of my listings, so that I can fix and resubmit. | D; REQ-MPC-FR-058 | On hold: WF-ENG |
| US-CAT-043-03 | As a client administrator, I want separate queues for seller listings with assignment rules, so that reviews are shared out. | REQ-MPC-FR-319 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CAT-043-01-01 | US-CAT-043-01 | **Given** a seller listing is InReview in a queue the approver is assigned to, **when** the approver opens the queue, **then** the listing is shown with seller, category, submission time, quality-check result (CAT-005) and policy flags (CAT-021). | REQ-MPC-FR-058 |
| AC-CAT-043-01-02 | US-CAT-043-01 | **Given** the approver approves, rejects or requests changes, **when** the decision is saved, **then** reject and request changes need a reason from the configured reason list or free text (message Cat.ReasonRequired if empty); the state follows SM-CAT-01 and SM-CAT-02; audited (AUD-CAT-002). | REQ-MPC-FR-058 |
| AC-CAT-043-02-01 | US-CAT-043-02 | **Given** a decision is saved, **when** the seller opens the listing, **then** the decision, reason and decision time are shown and the seller is notified by message template Catalogue.ListingDecision.VendorNotification. | REQ-MPC-FR-058 |
| AC-CAT-043-03-01 | US-CAT-043-03 | **Given** a rule sends listings of seller tier T to queue Q, **when** a seller of tier T submits, **then** the listing is in queue Q (BR-CAT-007). | REQ-MPC-FR-319 |
| AC-CAT-043-01-03 | US-CAT-043-01 | **Given** listings submitted by staff (no vendor), **when** are submitted, **then** they follow the staff queue rules of CAT-022, not the seller queue. | D |

**Business rules applied:** BR-CAT-006; BR-CAT-007 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-CAT-001 | A category is shown to a shopper only if it is published, allowed by ACL for one of the shopper's roles and mapped to the current store (native; catalogsettings.ignoreacl and ignorestorelimitations must be false where segmentation is used). | CAT-001, CAT-036 | FIT (Category: SubjectToAcl, LimitedToStores, Published) |
| BR-CAT-002 | A listing can be submitted for review or published only when it has: name; full description; price (unless CallForPrice); stock quantity when stock is managed; at least one picture; every field and attribute required by the category schemas of all its categories (CAT-005); the cross-border fields when offered for international delivery (CAT-015); the regulatory fields and a valid certificate when its category is regulated (CAT-019). The check runs at the transition, not at the first save, because pictures are added after the product exists in the native editor. | CAT-002, CAT-005, CAT-015, CAT-019, CAT-038 | REQ-MPC-FR-051; REQ-MPC-FR-309; FIT (ProductValidator requires Name only) |
| BR-CAT-003 | Uploads of product pictures and documents are refused when the file extension is not in the allowed list or the file is larger than the maximum size. The limits and their enforcement are the ADM-008 upload policy (context product picture for pictures added on the product edit page, which posts its files to Admin ProductController.ProductPictureAdd(productId); context admin download for product documents posted to Admin DownloadController.AsyncUpload; global action filter on those actions with IPictureService / IDownloadService backstops, BR-ADM-060). CAT adds no upload filter or type check of its own (one owner per behaviour, decision on upload types). The upload actions of CAT's own admin pages (360 image sets and brochures CAT-016, certificates CAT-019, provenance documents CAT-020, takedown evidence CAT-021, import files CAT-009) are registered with ADM-008 under the contexts admin picture, admin download and data imports, so the ADM-008 filter covers them; CAT forwards the file to IPictureService / IDownloadService, where the ADM-008 backstop also applies. Product documents cannot be told apart from other admin downloads, because DownloadController.AsyncUpload takes no product argument; product pictures can, because ProductPictureAdd takes the product ID and inserts each file through IPictureService.InsertPictureAsync. Native behaviour kept: fixed image extension list and SVG switch (mediasettings.allowsvguploads); images larger than mediasettings.maximumimagesize pixels are resized, not refused. | CAT-002, CAT-016, CAT-020 | REQ-MPC-FR-060; see ADM-008 (BR-ADM-060); FIT (PictureService.InsertPictureAsync(IFormFile): imgExt list; Admin ProductController.ProductPictureAdd(int productId, IFormCollection form) inserts each file through InsertPictureAsync, endpoint set in Views/Product/_CreateOrUpdate.Multimedia.Pictures.cshtml; DownloadController.cs:93 AsyncUpload: no product argument, no type or size check) |
| BR-CAT-004 | SKUs are unique across products and attribute combinations. When a product is inserted with an empty SKU, the CAT IProductService.InsertProductAsync / InsertProductsAsync override generates it from the active pattern; the sequence is read and advanced under ILocker key 'cat-sku-{PatternId}'; if PerformActionWithLockAsync returns false after the configured retries the insert is refused (Cat.SkuGenerationBusy). Sequence numbers are never reused. | CAT-003, CAT-006 | REQ-MPC-FR-064; FIT (ILocker; GetProductBySkuAsync) |
| BR-CAT-005 | Product.Published is true only while the listing state (SM-CAT-01) is Published. Enforced by: (a) a ModelReceivedEvent<BaseNopModel> consumer that adds a ModelState error (Cat.PublishNotAllowed) on Admin ProductController.Create and Edit [POST], which both check ModelState.IsValid; (b) the IProductService DI override hosted by CAT-002 (INopStartup Order >= 3000), through the publish-gate provider that CAT-022 registers (IC-CAT-04), whose InsertProductAsync, InsertProductsAsync, UpdateProductAsync and UpdateProductsAsync force Published = false for any product not in state Published — this covers BulkEditSave, CopyProduct / CopyProductService, ImportManager, the API and the native low-stock re-publish in ApplyLowStockActivityAsync (catalogsettings.publishbackproductwhencancellingorders); (c) catalogsettings.allowviewunpublishedproductpage = false. Only the CAT lifecycle service sets Published = true, and only after the publish guard passes (IC-CAT-04: no vendor pause reason, BR-CAT-030; SEL CheckEligibility, IC-SEL-01). An update that would set Published from false to true for a listing in state Published (native low-stock re-publish) runs the same guard; on Fail Published is saved false and the listing moves to Paused with reason NotEligible. Native ProductService.SearchProductsAsync does not filter by vendor status, so storefront hiding of a suspended seller relies on this gate. | CAT-002, CAT-008, CAT-009, CAT-011, CAT-022 | D (CAT-022); FIT (ProductController.cs:1083-1093, 1227-1252, 983-996, 1524-1539; ProductService.cs:165-185, 590-623; ImportManager.cs:2607-2619; Web ProductController.cs:137; no Product repository insert or update outside ProductService in Libraries, Plugins or Presentation) |
| BR-CAT-006 | An approval step is decided only by a holder of Misc.Catalogue.Listings.Approve assigned to that step; the user who submitted the listing cannot decide any step of it; reject and request-changes need a reason. | CAT-022, CAT-043 | REQ-MPC-FR-058; Proposed (segregation) |
| BR-CAT-007 | On submission the listing goes to the queue of the first active assignment rule that matches (dimensions: category, seller, seller tier, store), in priority order; with no match it goes to the default queue. Changing rules does not move listings already in review. | CAT-022, CAT-043 | REQ-MPC-FR-319 |
| BR-CAT-008 | An edit by the seller of a listing in InReview withdraws the submission (back to Draft). An edit by the seller of a Published listing that changes a field in the re-approval set moves it to InReview with Published false until approved; the re-approval field set is a setting (default not stated). Edits by users holding Misc.Catalogue.Listings.Approve do not change the state. | CAT-009, CAT-022, CAT-023 | Proposed |
| BR-CAT-009 | A category schema change is a draft version until a different user with Misc.Catalogue.Schema.Approve approves it; it then applies to submissions made after approval; published listings that miss a new required field stay published and are listed for their owners. | CAT-005 | REQ-MPC-FR-309; Proposed |
| BR-CAT-010 | Missing required fields block submission; image-quality findings (minimum pixel size, setting) only warn. | CAT-005 | REQ-MPC-FR-071 |
| BR-CAT-011 | Prohibited rules (category, item, term) with action Block or Flag are applied to name, short and full description in every language and to category mappings, at submission, import validation (CAT-010), API create/update (CAT-011) and Q&A text (CAT-018). Block refuses; Flag routes to review with the reason. | CAT-009, CAT-011, CAT-018, CAT-021, CAT-022 | REQ-MPC-FR-059 |
| BR-CAT-012 | A bulk file is imported only after a validation run with zero errors (all or nothing); the validation report is kept with the import job. | CAT-010 | REQ-MPC-FR-054; Proposed (all or nothing) |
| BR-CAT-013 | A listing report or takedown that is upheld withdraws the listing with the decision reason; evidence files are kept; every decision is audited. | CAT-021 | REQ-MPC-FR-073; REQ-MPC-FR-093 |
| BR-CAT-014 | Every product save writes a version snapshot (product fields, localized values, category and specification attribute mappings, tier prices, picture references). Restoring creates a new version and is subject to BR-CAT-005 and BR-CAT-008. Autosave writes only to a per-user draft buffer, never to the product. | CAT-023 | REQ-MPC-FR-064; Proposed (snapshot scope, buffer) |
| BR-CAT-015 | Withdrawal needs a reason, sets state Withdrawn and Published false, notifies watchers once and raises Listing.Withdrawn. Consumers of Listing.Withdrawn in other modules only enqueue work; CAT changes no order, payment or case. | CAT-024 | D; FIT (EventPublisher swallows consumer exceptions) |
| BR-CAT-016 | A bundle is a product whose components are required attribute mappings with one preselected AssociatedToProduct value each (AssociatedProductId, Quantity, PriceAdjustment 0); the bundle price is the bundle product's price; component stock and availability are handled natively; a seller bundles only own products. | CAT-007 | REQ-MPC-FR-065; FIT (ProductService.AdjustInventoryAsync; ShoppingCartService bundled validation) |
| BR-CAT-017 | A call-for-price product cannot be added to the cart directly (native). The CAT product-page button creates a Misc.RFQ request for that product; a cart item created from an accepted Misc.RFQ quote (QuoteItem.ShoppingCartItemId set) is exempt from the native Products.CallForPrice warning. The exemption is a CAT provider of the CHK-003 IShoppingCartService host (decision OVR-REG, BR-CAT-032); CAT does not override ShoppingCartService. | CAT-013 | D; OVR-REG; FIT (ShoppingCartService.GetStandardWarningsAsync:380-385; RfqService.CreateShoppingCartAsync inserts through the repository; GetQuoteItemByShoppingCartItemIdAsync) |
| BR-CAT-018 | Compliance status follows SM-CAT-03; a Barred listing cannot be submitted or published; an expired certificate pauses the listing when auto-hide is on for its category. | CAT-019 | D; FC-M01-027 |
| BR-CAT-019 | A product edit form carries the version number it was opened with (hidden field added by a CAT admin widget); the Edit [POST] veto refuses the save when a newer version exists (Cat.EditConflict). | CAT-023 | Proposed; FIT (Edit POST checks ModelState.IsValid) |
| BR-CAT-020 | Price precedence for a customer, product and quantity (nopCommerce 5.00): accepted quote item (Misc.RFQ, GetShoppingCartItemUnitPriceEvent) > native tier price, when one applies > native price-list price of the customer or one of the customer's roles (CAT-039; CatalogSettings.PriceListStrategy between lists) > product price; native discounts apply to the result. A fixed currency price (CAT-042) replaces the converted price only when no price list of the customer contains the product within its dates (checked through IPriceListService with the same filter as the native method), so a contract price is never replaced by a list price in another currency. Price lists are applied by the native base method inside its cached block; the CAT-042 host never applies them again. Fixed currency prices are applied outside the native cached block of PriceCalculationService.GetFinalPriceAsync, whose cache key holds product, quantity, customer role IDs and store but not the customer or currency. | CAT-012, CAT-039, CAT-042 | FIT (PriceCalculationService.cs:77-140, 414-470; NopCatalogDefaults.ProductPriceCacheKey; ShoppingCartService.GetUnitPriceAsync, ShoppingCartService.cs:1401-1405); PRICE-500; Proposed (fixed currency price versus price list) |
| BR-CAT-021 | Bookings and slot capacity change only through the CAT booking service (IC-CAT-07): Hold (cart), Confirm (order placed), Book (direct, for EGV-003, no cart), Move, RecordOutcome, Release and slot writes from SVC GenerateSlots. A place is taken under ILocker key 'cat-slot-{SlotId}' only while held plus confirmed bookings are below capacity; a move takes both slot locks in ascending SlotId order; holds expire after the hold duration; confirmation links the hold to the order item; outcomes CancelledByCustomer and CancelledByProvider release the place, Attended, NoShowCustomer and NoShowProvider complete the booking; release on order cancellation is enqueued by a consumer and done by a task; a nightly task recounts capacity; generated capacity is never set below confirmed bookings. | CAT-027 | D; Proposed; (SM-SVC-02, BR-SVC-011); FIT (ShoppingCartItemMovedToOrderItemEvent, OrderStatusChangedEvent, ILocker) |
| BR-CAT-022 | A promoted placement is active only between its approved start and end dates and while its product is Published; approvals never exceed the slot limit of the placement type on any day; the native flags (ShowOnHomepage, ProductCategory.IsFeaturedProduct) are set and cleared only by the placement task. | CAT-033 | REQ-MPC-FR-070; Proposed |
| BR-CAT-023 | A cart line must meet OrderMinimumQuantity, OrderMaximumQuantity, AllowedQuantities (native) and the multiple-of rule (CAT); a quantity above the maximum is accepted only through an approved over-maximum request (IC-ADM-03 OnApproved) when that option is on for the product. The CAT checks run as providers of the CHK-003 IShoppingCartService host (BR-CAT-032). | CAT-037 | D; OVR-REG; FIT (ShoppingCartService.GetStandardWarningsAsync) |
| BR-CAT-024 | Until UOM-01 is decided, quantities stay integers: a unit of measure has a base unit and a positive conversion factor; pack prices are base-unit count times price per base unit. | CAT-041 | D; UOM-01 |
| BR-CAT-025 | For an order in currency C with fixed prices, each line is stored in the primary store currency as fixed price divided by Order.CurrencyRate; the amount shown and charged to the customer in C equals the fixed price, rounded to the minor unit of C. | CAT-042 | D; FIT (Order.CurrencyRate; ICurrencyService.ConvertFromPrimaryStoreCurrencyAsync) |
| BR-CAT-026 | A Published listing is Stale when Product.UpdatedOnUtc is older than the stale period of its category (setting); the seller is reminded once; re-confirmation or an edit clears the flag; after the grace period it is paused with reason Stale if auto-pause is on. | CAT-025 | D; FC-M01-034; FIT (Product.UpdatedOnUtc) |
| BR-CAT-027 | A CAT feature that belongs to a pack (Marketplace, Services and bookings, B2B trade, Commerce extensions, Engagement and loyalty, Analytics) checks its feature state through IC-PLT-02 IsEnabled (setting productfeature.<prd-id>, store value else shared value) before it shows a page or widget, accepts a provider call or runs scheduled work for a store; a feature that is off for the store does nothing for that store. Always-on features (including the hosts CAT-022 and CAT-042) do not check. | All CAT features | Proposed; (AC-PLT-022-02-01, IC-PLT-02) |
| BR-CAT-028 | Every new CAT setting key is listed in the CAT plugin key catalogue with key, type, layer, secret flag and default so that pack validation accepts it (NFR-X-008). Keys that hold a credential, key or token are flagged secret, so the pack loader refuses them and exports omit them (CFG-01): feed target credentials (CAT-035) and the map provider key (CAT-028). Native translation and AI keys (translationsettings, artificialintelligencesettings) are native settings entered per client instance. | All CAT features | Proposed; (BR-PLT-013, AC-PLT-003-01-04) |
| BR-CAT-029 | CAT business audit events AUD-CAT-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id; old and new values of entity changes come from the SEC IRepository<> decorator and need no call. CAT plugin tables are written only through IRepository<>; CAT never writes through INopDataProvider directly. The native activity log is not used as audit. | All CAT features | Proposed; (BR-SEC-010, BR-SEC-011, BR-SEC-014) |
| BR-CAT-030 | Vendor listing pause: SEL pauses and resumes all listings of a vendor through IC-CAT-03 PauseListings / ResumeListings with one of the reason codes Vacation, SellerSuspended, SellerBlacklisted, DocumentExpired, CommissionOverdue, PerformanceIntervention, under ILocker key 'cat-vendor-listings-{VendorId}'. While a vendor has any pause reason, its Published listings are Paused (listing reason VendorPause) and no listing of that vendor can be published by any path. A listing resumes only when neither its vendor nor the listing itself has a pause reason left and the publish guard passes. SEL never writes ListingState or Product.Published. | CAT-022 | Proposed; (BR-SEL-005, IC-SEL-01) |
| BR-CAT-031 | Decision OVR-REG: CAT is the only product plugin that overrides IProductService (host CAT-002, core; CAT-022 is its publish-gate provider), IPriceCalculationService and IOrderTotalCalculationService (CAT-042), each by one DI registration (INopStartup Order >= 3000) listed in the ADM extension register (BR-ADM-001). Other modules register providers (IC-CAT-04, IC-CAT-05, IC-CAT-06) and never register their own implementation of these interfaces. Each host first runs the native base method and then its providers in their declared order; a provider exception fails the call (it is not swallowed). A provider of a pack feature that is off for the store is skipped (BR-CAT-027). | CAT-002, CAT-022, CAT-039, CAT-042 | OVR-REG; FIT (L1 section 6.2 principle 7; ProductService, PriceCalculationService and OrderTotalCalculationService methods are public virtual) |
| BR-CAT-032 | CAT does not override IShoppingCartService (owner CHK-003, decision OVR-REG). CAT cart checks are providers of the CHK-003 host through IC-CHK-01: multiple-of quantity (CAT-037), call-for-price exemption for Misc.RFQ quote items (BR-CAT-017), over-maximum exemption for approved requests (BR-CAT-023), service area (CAT-026), booking hold expiry (CAT-027). The two exemptions are registered replacers of the named native warnings Products.CallForPrice (quote lines) and ShoppingCart.MaximumQuantity (approved over-maximum lines); the host matches them by resource key, never by text (BR-CHK-015). All other CAT checks only add warnings. | CAT-013, CAT-026, CAT-027, CAT-037 | OVR-REG; see CHK-003 (IC-CHK-01, BR-CHK-015) |
| BR-CAT-033 | Order-total adjustments (IC-CAT-06). Adjust is side-effect free and is called after the native GetShoppingCartTotalAsync result; a Deduction is between zero and the running total, a Charge is zero or more, the total is never below zero; the applied adjustments of the last calculation are kept for the current request. At placement CAT-042 is one IC-CHK-06 participant of the CHK-003 host: Reserve passes each provider exactly the amount used in the order total; Confirm, per saved sub-order and before OrderPlacedEvent, writes OrderTotalAdjustment rows and calls the provider Confirm, in which the provider writes its own money record (PAY-009 wallet ledger); Release reverses reservations when placement fails. On admin order edits the CAT override of the protected UpdateTotalAsync re-applies the stored amounts after the native total (a Deduction capped at the new total) and calls no provider. Adjustments are read through GetOrderAdjustments and the DOC token. CAT changes no wallet, premium or payment record itself. | CAT-042 | OVR-REG; WAL-01; Proposed; FIT (OrderTotalCalculationService.GetShoppingCartTotalAsync public virtual, UpdateTotalAsync protected virtual; OrderProcessingService.PreparePlaceOrderDetailsAsync calls GetShoppingCartTotalAsync once, OrderProcessingService.cs:399) |
| BR-CAT-034 | Price-list configuration rules (decision PRICE-500): (1) a product in a contract price list carries no tier price for the same buyers, because natively the tier price replaces the price-list price; CAT lists every product where both apply (pricing-conflicts list) and sales staff remove the tier price or record acceptance; (2) catalogsettings.cacheproductprices stays off while any price list is assigned to individual customers, because the cached price is keyed by roles and store, not by customer; the B2B pack validation refuses the combination; (3) CatalogSettings.PriceListStrategy (MinimalPrice or UseByPriority) is a client setting; (4) price lists have no store or currency scope. | CAT-039, CAT-042 | PRICE-500; FIT (PriceCalculationService.cs:77-140, 426-462; NopCatalogDefaults.ProductPriceCacheKey; Libraries/Nop.Core/Domain/PriceLists/PriceList.cs); Proposed (conflicts list, pack validation) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-CAT-01 | Listing (ListingState side table, 1:1 Product) | (none) | product inserted (any path) | — | Draft | Published forced false (BR-CAT-005) |
| SM-CAT-01 | Listing | Draft | owner submits | BR-CAT-002, BR-CAT-011 pass; submission guard passes (IC-CAT-04, IC-SEL-01); compliance status not Barred | InReview | queue assigned (BR-CAT-007); step 1 Pending |
| SM-CAT-01 | Listing | InReview | last step approves | BR-CAT-006 | Approved | owner notified; auto-publish if set |
| SM-CAT-01 | Listing | InReview | a step requests changes | reason given | Draft | owner notified with reason |
| SM-CAT-01 | Listing | InReview | seller edits the listing | — | Draft | open step closed (BR-CAT-008) |
| SM-CAT-01 | Listing | InReview | a step rejects | reason given | Rejected | owner notified with reason |
| SM-CAT-01 | Listing | Rejected | owner edits and resubmits | BR-CAT-002, BR-CAT-011 pass; submission guard passes (IC-CAT-04, IC-SEL-01) | InReview | new review round |
| SM-CAT-01 | Listing | Approved | publish (Misc.Catalogue.Listings.Manage or auto-publish) | no vendor pause reason (BR-CAT-030); publish guard passes (IC-CAT-04, IC-SEL-01) | Published | Product.Published = true |
| SM-CAT-01 | Listing | Published | seller edits a re-approval field | BR-CAT-008 | InReview | Product.Published = false |
| SM-CAT-01 | Listing | Published | pause (manual, stale CAT-025, certificate expired CAT-019) | reason recorded | Paused | Product.Published = false |
| SM-CAT-01 | Listing | Published | vendor pause (IC-CAT-03 PauseListings from SEL) | valid SEL reason code | Paused | listing reason VendorPause; Product.Published = false; AUD-CAT-016 |
| SM-CAT-01 | Listing | Published | native low-stock re-publish fails the publish guard | IC-CAT-04 returns Fail | Paused | listing reason NotEligible; Product.Published = false; owner notified |
| SM-CAT-01 | Listing | Paused | a pause reason is removed (manual resume: Misc.Catalogue.Listings.Manage; stale: re-confirmed; certificate: valid certificate; NotEligible: guard passes; VendorPause: last vendor reason removed) | no listing or vendor pause reason remains; publish guard passes | Published | Product.Published = true |
| SM-CAT-01 | Listing | Paused | a pause reason is removed | another listing or vendor pause reason remains | Paused | reason list updated |
| SM-CAT-01 | Listing | Published / Paused | withdraw (manual or upheld report / takedown) | reason given | Withdrawn | Published false; Listing.Withdrawn raised; watchers notified |
| SM-CAT-01 | Listing | Draft / Rejected / Paused / Withdrawn | archive | Misc.Catalogue.Listings.Manage | Archived | hidden from seller lists; kept for audit |
| SM-CAT-02 | ApprovalStep | Pending | approver approves | BR-CAT-006 | Approved | next step Pending, or listing Approved after the last step |
| SM-CAT-02 | ApprovalStep | Pending | approver rejects / requests changes | reason given | Rejected / ChangesRequested | listing Rejected / Draft |
| SM-CAT-02 | ApprovalStep | Pending | submission withdrawn by seller edit | — | Closed | listing Draft |
| SM-CAT-03 | ComplianceStatus | Pending | check passed | Misc.Catalogue.Compliance.CreateEditDelete | Validated | — |
| SM-CAT-03 | ComplianceStatus | Pending / Validated | inconsistency found | reason | Flagged | owner notified |
| SM-CAT-03 | ComplianceStatus | Flagged | escalated for legal review | — | Escalated | — |
| SM-CAT-03 | ComplianceStatus | Flagged / Escalated | resolved | — | Validated | — |
| SM-CAT-03 | ComplianceStatus | Flagged / Escalated | barred | reason | Barred | listing Withdrawn (SM-CAT-01) |
| SM-CAT-04 | ListingReport / TakedownRequest | (none) | report or request recorded | — | Open | compliance staff notified |
| SM-CAT-04 | ListingReport / TakedownRequest | Open | decision recorded | Misc.Catalogue.Policy.CreateEditDelete; reason | Upheld / Dismissed | Upheld: listing Withdrawn (BR-CAT-013) |
| SM-CAT-05 | Booking | (none) | slot selected and item added to cart | capacity free (BR-CAT-021) | Held | place reserved until hold expiry |
| SM-CAT-05 | Booking | Held | order placed | hold not expired | Confirmed | linked to order item |
| SM-CAT-05 | Booking | Held | hold expires or item removed | — | Released | place freed |
| SM-CAT-05 | Booking | Confirmed | order cancelled | — | Released | place freed by release task |
| SM-CAT-05 | Booking | (none) | direct booking (IC-CAT-07 Book, EGV-003) | capacity free (BR-CAT-021) | Confirmed | no cart or order item; BookingId returned to EGV |
| SM-CAT-05 | Booking | Confirmed | move to slot T (IC-CAT-07 Move, SVC-003) | T has a free place; both slot locks held | Confirmed | old place freed; SlotId = T |
| SM-CAT-05 | Booking | Confirmed | outcome CancelledByCustomer or CancelledByProvider recorded (IC-CAT-07 RecordOutcome, SM-SVC-02) | — | Released | place freed; SVC outcome stored |
| SM-CAT-05 | Booking | Confirmed | outcome Attended, NoShowCustomer or NoShowProvider recorded (IC-CAT-07 RecordOutcome, SM-SVC-02) | — | Completed | place not freed; SVC outcome stored |
| SM-CAT-05 | Booking | Confirmed | direct booking cancelled by EGV-003 (IC-CAT-07 Release) | — | Released | place freed |
| SM-CAT-06 | PromotedPlacement | (none) | seller requests | product Published | Requested | fee computed |
| SM-CAT-06 | PromotedPlacement | Requested | staff approve / reject | slot limit (BR-CAT-022) | Approved / Rejected | seller notified |
| SM-CAT-06 | PromotedPlacement | Approved | start date reached | product Published | Active | native flag set |
| SM-CAT-06 | PromotedPlacement | Active | end date reached | — | Ended | native flag cleared |
| SM-CAT-06 | PromotedPlacement | Active | product leaves Published | — | Suspended | native flag cleared |
| SM-CAT-07 | ProductQuestion / ProductAnswer | (none) | submitted | author signed in | Submitted | — |
| SM-CAT-07 | ProductQuestion / ProductAnswer | Submitted | moderator approves / rejects | Misc.Catalogue.Questions.CreateEditDelete | Published / Rejected | author notified |
| SM-CAT-08 | ImportJob | (none) | file uploaded | format supported | Uploaded | large-file warning if above threshold |
| SM-CAT-08 | ImportJob | Uploaded | validation run | — | Validated / Invalid | report stored |
| SM-CAT-08 | ImportJob | Validated | user commits | zero errors (BR-CAT-012) | Committed | counts stored; AUD-CAT-012 |
| SM-CAT-09 | Certificate | Valid | warning period reached | — | ExpiringSoon | owner and compliance staff notified |
| SM-CAT-09 | Certificate | Valid / ExpiringSoon | valid-to date passed | — | Expired | listing Paused if auto-hide on |
| SM-CAT-10 | CategorySchemaVersion | Draft | second user approves / rejects | Misc.Catalogue.Schema.Approve; approver is not the author | Approved / Rejected | Approved: previous version Superseded; AUD-CAT-003 |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| ListingState (new) | ProductId, State (SM-CAT-01), StateReason, QueueId, CurrentStepNo, SubmittedBy, SubmittedOnUtc, StateChangedOnUtc, StaleFlag, StaleSinceUtc, RowVersion | CAT-022, CAT-024, CAT-025, CAT-043 | 1:1 with Product; Product.Published mirrors state Published only |
| ListingPauseReason (new) | ProductId, ReasonCode (Manual, Stale, CertificateExpired, NotEligible, VendorPause), SetBy, SetOnUtc | CAT-019, CAT-022, CAT-025 | A Paused listing has at least one row; resumes when none remains (BR-CAT-030) |
| VendorListingPause (new) | VendorId, ReasonCode (SEL codes), SetBy, SetOnUtc | CAT-022 | Written only through IC-CAT-03 PauseListings / ResumeListings; Vendor.Active (native) is not used for listings |
| ModerationQueue / ApprovalStepDefinition / AssignmentRule (new) | Queue: Name, IsDefault, Scope (staff / seller); Step: QueueId, StepNo, ApproverRoleId or CustomerId; Rule: Priority, CategoryId, VendorId, SellerTier, StoreId, QueueId, IsActive | CAT-022, CAT-043 | |
| ApprovalStep (new) | ProductId, Round, StepNo, Status (SM-CAT-02), DecidedBy, DecidedOnUtc, ReasonCode, ReasonText | CAT-022, CAT-043 | |
| SkuPattern (new) | Id, Pattern, NextSequence, IsActive, RowVersion | CAT-003 | Product.Sku (native) holds the result |
| CategorySchema / CategorySchemaField (new) | Schema: CategoryId, Version, Status (SM-CAT-10), InheritToChildren, CreatedBy, ApprovedBy; Field: ProductFieldName or SpecificationAttributeId or ProductAttributeId, IsRequired | CAT-005, CAT-038 | Specification and product attributes stay native |
| Bundle (new, editor metadata) | BundleProductId, ComponentProductId, Quantity, DisplayOrder | CAT-007 | Runtime uses native ProductAttributeMapping / ProductAttributeValue (AssociatedToProduct) |
| ListingTemplate (new) | Id, Name, OwnerVendorId (0 = staff), FieldSetJson, CreatedOnUtc | CAT-008 | |
| ImportJob / ImportRowError (new) | Job: Format, FileDownloadId, Status (SM-CAT-08), Rows, Created, Updated, Unchanged, UserId; Error: JobId, RowNo, Column, Message | CAT-009, CAT-010 | Commit calls native IImportManager (Excel) or the CAT CSV/XML reader |
| ProductTradeFields (new) | ProductId, HsCode, CountryOfOriginId, DutyNote | CAT-015 | Country is native |
| ProductMediaExtra (new) | ProductId, Type (Image360Set / PdfBrochure), PictureIds or DownloadId, Title, DisplayOrder | CAT-016 | Native ProductPicture and ProductVideo remain |
| ProductQuestion / ProductAnswer (new) | Question: ProductId, CustomerId, Text, Status (SM-CAT-07), CreatedOnUtc; Answer: QuestionId, AuthorCustomerId, VendorId, Text, Status | CAT-018 | |
| RegulatoryField / ProductRegulatoryValue / ProductCertificate / ComplianceStatus (new) | Field: CategoryId, Name, IsRequired; Value: ProductId, FieldId, Value; Certificate: ProductId, Type, Number, Issuer, ValidFromUtc, ValidToUtc, DownloadId, Status (SM-CAT-09); Status: ProductId, Status (SM-CAT-03), Reason | CAT-019 | Native AgeVerification / MinimumAgeToPurchase reused for age limits |
| ProvenanceDocument (new) | ProductId or ManufacturerId, Title, DownloadId, IsPublic | CAT-020 | Producer = native Manufacturer; stories = native Topic |
| ProhibitedRule / ListingReport / TakedownRequest (new) | Rule: Type (category / item / term), Value, LanguageId, Action (Block / Flag), IsActive; Report: ProductId, ReporterCustomerId, ReasonCode, Text, Status (SM-CAT-04); Takedown: ProductId, Requester, Basis, EvidenceDownloadIds, Status, DecisionReason | CAT-021 | |
| ProductVersion / ProductDraftBuffer (new) | Version: ProductId, VersionNo, Source, SnapshotJson, CreatedBy, CreatedOnUtc; Buffer: ProductId, CustomerId, FormJson, SavedOnUtc | CAT-023 | Native ActivityLog keeps its EditProduct line |
| ServiceListing (new) | ProductId, ServiceTypeId, DeliveryMethodId, CoverageAreaIds, Qualifications | CAT-026 | Product.IsShipEnabled false (native) |
| BookingSlot / Booking (new) | Slot: ProductId, ResourceId (optional; set only when SVC-002 is installed), StorePickupPointId (outlet, LOG-003; optional), StartUtc, EndUtc, Capacity, RowVersion; Booking: SlotId, ShoppingCartItemId, OrderItemId (both empty for a direct booking), CustomerId, Source (Cart / Direct), Status (SM-CAT-05), HoldExpiresUtc | CAT-027 | SVC adds its extension columns (SM-SVC-02 outcome, resource) and BookingLocation (SVC-006); EGV keeps BookingId on its application |
| ListingLocation (new) | ProductId, Latitude, Longitude, PolygonGeoJson | CAT-028 | Native Address has no coordinates |
| CatalogueViewLog (new) | ProductId, CustomerId, IpAddress, ViewedOnUtc | CAT-032 | Changes come from SEC-004 |
| PlacementType / PromotedPlacement (new) | Type: Name, NativeTarget (homepage / category / search / banner), MaxSlots, FeePerPeriod; Placement: ProductId, VendorId, TypeId, CategoryId, StartUtc, EndUtc, Fee, Status (SM-CAT-06) | CAT-033 | Sets native ShowOnHomepage / ProductCategory.IsFeaturedProduct |
| ProductDailyCounter (new) | ProductId, Date, Views, CartAdds, WishlistAdds | CAT-034 | Orders from native order tables |
| ProductListCounter (new) | ProductId, Date, Source (Category / Search), CategoryId, Impressions, Clicks | CAT-034 | Click-through per category and for search (REQ-MPC-FR-091) |
| FeedTarget / FeedRun (new) | Target: Name, AdapterSystemName, Filter, LanguageId, CurrencyId, Schedule, Location, Credentials (secret, BR-CAT-028); Run: TargetId, StartedUtc, Status, Error, ItemCount | CAT-035 | Credentials never exported in a config pack (CFG-01) |
| QuantityRule / OverMaxRequest (new) | Rule: ProductId, Multiple, OverMaxApproval; Request: ProductId, CustomerId, Quantity, ApprovalItemId (ADM-006), Status | CAT-037 | Native OrderMinimumQuantity, OrderMaximumQuantity, AllowedQuantities remain |
| PriceList / PriceListItem / PriceListCustomer / PriceListCustomerRole (native, 5.00) | List: Name, Active, StartDateUtc, EndDateUtc, PriceCalculationTypeId, PriceCalculationValue, Priority; Item: PriceListId, ProductId, ManualPrice; assignment to customers and customer roles | CAT-039 | Native 5.00 entities (Libraries/Nop.Core/Domain/PriceLists); the former CAT PriceList table is withdrawn (VER-500, PRICE-500). No company, currency, combination or minimum-quantity field: company binding through the company role (AC-CAT-039-01-11); fixed currency prices are CAT-042 |
| CompanyAssortment (new) | CompanyId, ProductId, SystemCustomerRoleId | CAT-040 | Applied through native AclRecord |
| UnitOfMeasure / ProductUom (new) | Unit: Code, Name, BaseUnitId, Factor; ProductUom: ProductId, BaseUnitId, PricePerBaseUnit, PackDefinitions | CAT-041 | Native MeasureWeight and Basepricing remain |
| ProductCurrencyPrice (new) | ProductId, CombinationId, CurrencyId, Price | CAT-042 | Order line amounts stay in primary currency (BR-CAT-025) |
| OrderTotalAdjustment (new) | Id, OrderId, ProviderSystemName, Kind (Deduction / Charge), Amount (primary store currency), Label, ProviderReference, CreatedOnUtc | CAT-042 | Written only in the IC-CHK-06 Confirm phase (BR-CAT-033); the money record stays with the provider (PAY-009 WalletLedgerEntry); native Order is not changed beyond OrderTotal |
| Call-for-price quote request (native, Misc.RFQ) | RequestQuote, RequestQuoteItem | CAT-013 | No new table |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Category taxonomy and specification attributes | Category, SpecificationAttribute(Group), ProductAttribute | vertical → client | CAT-001 / CAT-004 | Core |
| Category attribute schemas and listing rules | Required-attribute sets (new) | vertical → client | CAT-005 | Core |
| B2B pack settings | Company account roles, credit terms, price lists (native in 5.00: PriceList entities, catalogsettings.priceliststrategy; decision PRICE-500), approval limits | vertical (B2B pack) → client | IAM-022 / CHK-016 / CAT-039 | B2B trade pack |
| Measures and units of measure | MeasureWeight, MeasureDimension, measuresettings.*; UoM list (new) | global → vertical → client | CAT-002 / CAT-041 | Core / B2B trade pack |
| Services and bookings pack settings | Service product templates, coverage areas, booking slots | vertical (Services pack) → client | CAT-026 / CAT-027 | Services and bookings pack |
| Commerce extensions pack settings | Cart restriction rules, return fees, feed/syndication targets, PayPal method enablement and options (credentials entered per client instance, not stored in the pack) | vertical → client → store | CHK-011 / RET-006 / CAT-035 / PAY-003 | Commerce extensions pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Allow viewing unpublished product page | catalogsettings.allowviewunpublishedproductpage (native) — must be false with CAT-022 | client → store | false (required) | false (required) |
| Re-publish after cancellation (low-stock) | catalogsettings.publishbackproductwhencancellingorders (native; gated by BR-CAT-005) | client → store | Not stated | Not stated |
| Ignore ACL / store limitations | catalogsettings.ignoreacl, catalogsettings.ignorestorelimitations (native) — false where CAT-036/040 are used | client | false where ACL segmentation is used (REQ-KTDA-CAT-002, CAT-036) | Not stated |
| Cache product prices | catalogsettings.cacheproductprices (native; see BR-CAT-020) | client | Not stated | Not stated |
| Product editor field visibility | productEditorSettings.* (native) | client | Not stated | Not stated |
| Vendor product limits | vendorsettings.maximumproductnumber, maximumproductpicturesnumber, allowvendorstoimportproducts (native) | client | — | Not stated |
| Upload limits (allowed extensions, maximum bytes) for product images and documents | ADM-008 upload policy, contexts product picture and admin download (no CAT setting); mediasettings.allowsvguploads, maximumimagesize, defaultimagequality, defaultpicturezoomenabled (native) | client | Not stated | Configurable by Admin (FR-060); values not stated |
| SKU pattern | SkuPattern (new) | client | Not stated | Not stated |
| Category schemas and required fields; schema inheritance | CategorySchema (new) | vertical → client | Not stated | Required (FR-309); content not stated |
| Image quality prompt (minimum pixel size) | CAT settings (new) | client | — | Required (FR-071); value not stated |
| Moderation queues, steps, assignment rules; auto-publish on approval; re-approval field set | ModerationQueue, AssignmentRule (new); CAT settings | client | Not stated | Required (FR-058, FR-319); values not stated |
| Prohibited categories, items, terms; report reasons | ProhibitedRule (new); CAT settings | country → client | Not stated | Required (FR-059, FR-093); content not stated |
| Import large-file thresholds; CSV/XML enabled | CAT settings (new); catalogsettings.exportimport* (native) | client | Not stated | Not stated |
| Autosave interval; version retention | CAT settings (new) | client | Not stated | Not stated |
| Stale period per category; grace period; auto-pause | CAT settings (new) | client | — | — |
| Certificate warning period; auto-hide per regulated category | CAT settings (new) | country → client | — | — |
| Specification attribute filtering | catalogsettings.enablespecificationattributefiltering (native) | client → store | On (KTDA SRC-002) | Not stated |
| Review rules | catalogsettings.productreviewsmustbeapproved, productreviewpossibleonlyafterpurchasing, onereviewperproductfromcustomer, notifycustomeraboutproductreviewreply; captchasettings.showonproductreviewpage (native) | client → store | Not stated | After purchase with moderation (FR-075) |
| Product page delivery and seller display | vendorsettings.showvendoronproductdetailspage, shippingsettings.estimateshippingproductpageenabled, shippingsettings.allowpickupinstore (native) | client → store | Not stated | On (FR-068, FR-088) |
| Returns and dispute summary topics | Topic system names held in the RET settings (RET-001, RET-007); CAT reads them, no CAT setting | client → store | KG-12 | Not provided (T-MISS) |
| Call for price buy by admins; RFQ enabled | ordersettings.allowadminstobuycallforpriceproducts (native); rfqsettings.enabled (Misc.RFQ) | client | Not stated | — |
| Default tax category | taxsettings.defaulttaxcategoryid (native) | country → client | KG-06 | MG-05 |
| Pre-translation and AI description | translationsettings.allowpretranslate; artificialintelligencesettings.allowproductdescriptiongeneration (native) | client | Languages LOC-001; KG-14 | Not stated |
| Service listings enabled; service types; delivery methods | PLT-022 toggle; ServiceListing lists (new) | vertical (Services pack) → client | — | Where enabled (FR-074); values not stated |
| Booking hold duration, slot length, horizon | CAT settings (new) | client | — | Not stated |
| Placement types, slots, fees | PlacementType (new) | client | — | Required (FR-070); values not stated |
| Feed targets | FeedTarget (new) | client | — | — |
| Price-list strategy (several lists for one buyer) | CatalogSettings.PriceListStrategy (native, 5.00: MinimalPrice or UseByPriority; installation default MinimalPrice); the former B2B precedence setting is withdrawn (tier price wins natively, BR-CAT-034) | vertical (B2B pack) → client | Not stated | — |
| Units of measure | UnitOfMeasure (new); measuresettings.baseweightid, basedimensionid (native) | global → vertical → client | Not stated (UOM-01) | — |
| Fixed currency prices enabled; fallback | CAT settings (new) | client | Not stated (C-FX, KG-15) | — |
| Feature state of CAT pack features | productfeature.<prd-id> (PLT setting, read through IC-PLT-02; BR-CAT-027) | client → store | Per pack selection | Per pack selection |
| CAT key catalogue (every new CAT key with type, layer, secret flag, default) | CAT plugin key catalogue (BR-CAT-028); secret: feed target credentials, map provider key | global | — | — |
| Map provider key | CAT setting (new, secret) | client | — | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Category pages and navigation | CAT-001, CAT-036 | Native |
| Storefront | Product page extensions: request-a-quote button, bundle contents, 360 viewer and brochures, provenance documents, delivery promise, pickup label, returns and dispute summary, Q&A, report listing, booking slot picker, map | CAT-007, CAT-013, CAT-016, CAT-018, CAT-020, CAT-021, CAT-027, CAT-028, CAT-031 | Native page + CAT widgets / view overrides |
| Storefront | Order details page: returns and dispute summary | CAT-031 | Native page + widget |
| Storefront | Reviews (write, list, helpful) | CAT-029 | Native |
| Admin (staff and vendors) | Product edit: listing state panel, submit, versions and compare, audit tab, trade fields, regulatory fields and certificates, service details, slots, location, fixed currency prices, quantity rules | CAT-002 to CAT-042 | Native page + CAT tabs |
| Admin (vendors) | Guided listing wizard | CAT-038 | New |
| Admin | Moderation queue and decision page | CAT-022, CAT-043 | New |
| Admin | Moderation queues, steps and assignment rules | CAT-022 | New |
| Admin | Category schemas and schema approval | CAT-005 | New |
| Admin | SKU patterns | CAT-003 | New |
| Admin | Bulk import with validation report | CAT-009, CAT-010 | Native import extended |
| Admin | Bundle editor; listing templates | CAT-007, CAT-008 | New |
| Admin | Prohibited rules; listing reports and takedowns | CAT-021 | New |
| Admin | Questions and answers moderation | CAT-018 | New |
| Admin | Compliance status and certificates list | CAT-019 | New |
| Admin | Promoted placements and placement types | CAT-033 | New |
| Admin | Catalogue analytics | CAT-034 | New |
| Admin | Feed targets and runs | CAT-035 | New |
| Admin | Price lists (native 5.00 Catalog > Price lists, plus the CAT pricing-conflicts list); company assortments, units of measure | CAT-039, CAT-040, CAT-041 | Native (price lists); New (conflicts list, assortments, units) |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Cat.MandatoryFieldMissing | This listing cannot be submitted yet. Complete these fields: {0}. | AC-CAT-002-02-02, AC-CAT-005-01-01, AC-CAT-005-02-02, AC-CAT-015-02-01, AC-CAT-019-01-01, AC-CAT-038-01-02 |
| Cat.ImageQualityLow | One or more pictures are smaller than recommended. You can still submit. | AC-CAT-005-02-01 |
| Cat.SchemaChangePending | This change is waiting for approval. | AC-CAT-005-03-01 |
| Cat.SkuDuplicate | This product code is already used. | AC-CAT-003-01-02, AC-CAT-006-01-04 |
| Cat.SkuGenerationBusy | The product code could not be created. Please try again. | AC-CAT-003-01-03 |
| Cat.BundleComponentUnavailable | This bundle is not available because one of its items is not available. | AC-CAT-007-01-03 |
| Cat.ImportFormatNotSupported | This file format is not supported. Use the Excel, CSV or XML template. | AC-CAT-009-01-04 |
| Cat.ImportHasErrors | The file has errors. Nothing was imported. Download the error report. | AC-CAT-010-01-02 |
| Cat.ImportLargeFile | This file is large and may take a long time to import. Do you want to continue? | AC-CAT-010-02-01 |
| Cat.RequestQuote | Request a quote | AC-CAT-013-01-01, AC-CAT-013-01-02 |
| Cat.QuoteRequested | Your request for a quote has been sent. | AC-CAT-013-02-01 |
| Cat.QuoteRequestRefused | A quote cannot be requested for this product. | AC-CAT-013-02-02 |
| Cat.HsCodeInvalid | The customs (HS) code is not in the expected format. | AC-CAT-015-01-02 |
| Cat.QuestionSubmitted | Your question has been sent. It will appear after review. | AC-CAT-018-01-01 |
| Cat.ProhibitedContent | This listing contains an item or word that is not allowed: {0}. | AC-CAT-021-01-01, AC-CAT-021-01-03 |
| Cat.ReportReceived | Thank you. Your report has been received. | AC-CAT-021-02-01 |
| Cat.PublishNotAllowed | This listing must be approved before it can be published. | AC-CAT-022-01-03 |
| Cat.ReasonRequired | A reason is required. | AC-CAT-022-02-02, AC-CAT-024-02-01, AC-CAT-043-01-02 |
| Cat.ApproveOwnListing | You cannot decide on a listing you submitted. | AC-CAT-022-02-03 |
| Cat.SubmissionWithdrawn | Your changes returned this listing to draft. Submit it again for review. | AC-CAT-022-02-04 |
| Cat.EditConflict | This listing was changed by someone else after you opened it. Reload it before saving. | AC-CAT-023-02-03 |
| Cat.ServiceAreaNotCovered | This service is not available in your area. | AC-CAT-026-01-04 |
| Cat.SlotFull | This time slot is no longer available. Please choose another. | AC-CAT-027-02-01, AC-CAT-027-03-02, AC-CAT-027-04-01 |
| Cat.SlotHoldExpired | Your time slot is no longer held. Please choose a slot again. | AC-CAT-027-01-05 |
| Cat.CoordinatesInvalid | The location is not valid. | AC-CAT-028-01-01, AC-CAT-028-01-02 |
| Cat.NotReturnable | This item cannot be returned. | AC-CAT-030-01-02, AC-CAT-031-03-03 |
| Cat.DeliveryPromise | Estimated delivery: {0} | AC-CAT-031-02-01 |
| Cat.PickupAvailable | Pickup available | AC-CAT-031-02-02 |
| Cat.PlacementFull | No placement slot is free for these dates. | AC-CAT-033-02-02 |
| Cat.QuantityNotMultiple | This product is sold in multiples of {0}. | AC-CAT-037-01-02 |
| Cat.QuantityAboveMaximum | The quantity is above the maximum of {0}. You can send it for approval. | AC-CAT-037-02-01 |
| Cat.SellerListingsPaused | This seller's listings are paused. The listing cannot be published now. | AC-CAT-022-04-04 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Upload refusals use the ADM-008 keys Adm.UploadTypeNotAllowed and Adm.UploadTooLarge; publish refusals by SEL use Sel.ListingNotEligible. Email templates are MessageTemplate entities installed by the CAT plugin (system names Catalogue.ListingDecision.VendorNotification, Catalogue.ListingWithdrawn.CustomerNotification and the others in §13), sent through IWorkflowMessageService (overridden only by TRK-005 under OVR-REG; CAT does not override it); a locale key alone sends nothing.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Catalogue API (CAT-011) | Read products and categories; create and update products (IC-CAT-01) | ERP, CRM, analytics, partners (not named; KG-03) | Held by API-01, PAID-STUB |
| Misc.RFQ (bundled plugin) | Create request quote for a call-for-price product; quote cart items | Internal plugin | CAT-013; owner of RFQ is ORD-012 |
| Feed targets (CAT-035) | BuildFeed and publish (IC-CAT-02) | Marketplaces and comparison sites (not named) | No client source |
| Web analytics (CAT-034) | Filter use and bounce rate per product | Widgets.GoogleAnalytics (bundled) via SRC-021 | External data |
| Translation and AI providers (CAT-017) | Pre-translate and generate descriptions | Google / DeepL translation; AI providers in ArtificialIntelligenceSettings (native) | Keys entered per client instance (CFG-01) |
| Map provider (CAT-028) | Show point or polygon | Not stated in source | P2 |
| LOG-005 delivery time engine | Estimated delivery window per product and location | Internal module | CAT-031 consumer |
| SEC-004 audit trail | Field changes with old and new values; business events through IC-SEC-01 WriteAsync | Internal module | CAT-032 reads; BR-CAT-029 |
| SEL (internal) | Publish guard CheckEligibility (IC-SEL-01, as IC-CAT-04 provider); PauseListings / ResumeListings (IC-CAT-03) | SEL-007, SEL-019 and the SEL pause sources | BR-CAT-030 |
| INV and SRC (internal) | Sellable-stock adjusters; search filter and ordering contributors (IC-CAT-04) | INV-009, INV-011; SRC (IC-SRC-02) | Providers of the CAT-002 IProductService host (OVR-REG) |
| PAY and FIN (internal) | Order-total adjustment providers: Adjust, Reserve, Confirm, Release; GetOrderAdjustments read (IC-CAT-06) | PAY-009 (WAL-01 option (b)); FIN-003 (if variable premiums are confirmed) | Providers of the CAT-042 IOrderTotalCalculationService host (OVR-REG, BR-CAT-033) |
| ORD (internal) | Quote request from a call-for-price product page (IC-ORD-08) | ORD-012 | CAT-013 calls; only ORD writes Misc.RFQ tables |
| CHK (internal) | CAT cart rule providers and two registered warning replacers (IC-CHK-01) in the CHK-003 IShoppingCartService host; CAT-042 order-total adjustment participant (IC-CHK-06) in the CHK-003 IOrderProcessingService host | CHK-003, CHK-004 | BR-CAT-032, BR-CAT-033 |
| SVC and EGV (internal) | Booking service (IC-CAT-07); eligible resources and slot generation (IC-SVC-01); location capture (SVC-006) | SVC-002, SVC-003, SVC-006, EGV-003 | BR-CAT-021 |
| IAM (internal) | Company of a customer (IC-IAM-07 GetCompanyOfCustomer); membership changes to the assortment role (IC-IAM-07 OnMembershipChanged, CAT-040 provider) | IAM-022 | CAT-039, CAT-040 |
| ADM-006 approval queues (internal) | Submit and OnApproved / OnRejected callbacks (IC-ADM-03) | ADM-006 | Listing moderation (if WF-ENG selects ADM-006) and over-maximum requests (CAT-037) |
| DOC (internal) | Token provider for HS code, country of origin and duty note (IC-DOC-02) | DOC-006 commercial invoice | CAT-015; Incoterm token from ORD-026 |
| PLT (internal) | Feature state IsEnabled (IC-PLT-02); key catalogue for pack validation | PLT-022, PLT-003 | BR-CAT-027, BR-CAT-028 |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-CAT-01 | Catalogue API — read | API client token with scope products.read (and products.read.unpublished for unpublished listings; BR-INT-006) and store limits; version; filters (changed since, category, store, language) | Products with price, stock availability, categories, attributes; categories | 401, 403 outside scope or store (BR-INT-002), 429 rate limit (BR-INT-004), 400 invalid filter | Same API-01 base and rules as IC-INT-01 (licensed or built Web API product, API-01, PAID-STUB); versioning BR-INT-003 |
| IC-CAT-01 | Catalogue API — create / update product | API client token with scope products.write; product payload | Product id, SKU, listing state (always Draft for new) | 400 validation (BR-CAT-002 at submit), prohibited content (BR-CAT-011), 409 duplicate SKU; 401, 403, 429 as above | Calls IProductService (CAT host applies BR-CAT-004, BR-CAT-005); never sets Published (BR-INT-001) |
| IC-CAT-02 | Feed adapter — BuildFeed | Feed target, product filter, language, currency | Feed file or payload | Target unavailable, format error | IScheduleTask per target; adapter per target format |
| IC-CAT-03 | Listing lifecycle service — Submit / Decide / Publish / Pause / Resume / Withdraw / Archive | Product id, actor, reason (where required) | New state (SM-CAT-01), audit id | Transition not allowed, reason missing, own listing, seller listings paused (Cat.SellerListingsPaused), publish guard failed | CAT service used by admin pages, wizard, CAT-019/021/025 tasks, the ADM-006 callbacks (IC-ADM-03 OnApproved / OnRejected) and other modules; the only code that sets Product.Published = true |
| IC-CAT-03 | PauseListings / ResumeListings (SEL to CAT) | Vendor id, reason code (Vacation, SellerSuspended, SellerBlacklisted, DocumentExpired, CommissionOverdue, PerformanceIntervention), actor | Number of listings paused or resumed | Unknown reason | Runs under ILocker key 'cat-vendor-listings-{VendorId}' and, per listing, 'cat-listing-{ProductId}' (BR-CAT-030); called by SEL through IC-SEL-01 |
| IC-CAT-04 | Product service host (CAT-002) — publish-gate provider | Product, requested Published value, path | Published value to save (false unless the listing state is Published, BR-CAT-005) | — | Provided by CAT-022 (listing lifecycle) when delivered; without it the host keeps the value the caller set (AC-CAT-002-05-05) |
| IC-CAT-04 | Product service host — submission and publish guard provider | Product, vendor, stage (Submit or Publish), path (lifecycle, form, wizard, bulk edit, import, API, low-stock re-publish) | Pass, or Fail with rule IDs and texts | — | Called by IC-CAT-03 Submit, Publish and Resume and by the IProductService host when an update would set Published true; provider: SEL CheckEligibility (IC-SEL-01), called at submission and at publish on every path |
| IC-CAT-04 | Product service host — sellable-stock adjuster | Product, warehouse id, useReservedQuantity, native total | Adjusted total stock quantity (not below zero) | — | IProductService.GetTotalStockQuantityAsync override (CAT-002 host, INopStartup Order >= 3000) calls base, then each adjuster in declared order; providers: INV-009, INV-011 lot statuses (BR-INV-071) |
| IC-CAT-04 | Product service host — search filter / ordering contributor | Scoped search context (from the request), the product query before ordering and paging, showHidden | Filtered or ordered product query | — | IProductService.SearchProductsAsync override reproduces the native 5.00.1 query composition (including the AI-provider path that returns early and the search-provider fallback CatalogSettings.UseStandardSearchWhenNoResults) and applies contributors before ordering and paging and before the AI-provider join; not applied when showHidden is true; providers: SRC (IC-SRC-02) |
| IC-CAT-05 | Price host — unit price provider | Product, customer, store, quantity, working currency, native result (priceWithoutDiscounts, finalPrice, discounts) | A price that replaces the result, or none | — | IPriceCalculationService.GetFinalPriceAsync override (CAT-042 plugin) calls the cached base, which already applies native price lists (5.00), then providers in precedence order outside the cached block (BR-CAT-020); provider: CAT-042 fixed currency prices. CAT-039 is no longer a provider (VER-500, PRICE-500). |
| IC-CAT-06 | Order total host — Adjust (provider operation) | Cart, customer, store, running total after native discounts, gift cards and reward points | Kind (Deduction or Charge), amount, label, provider reference; or none | Provider error fails the total calculation (BR-CAT-031) | Called by the IOrderTotalCalculationService.GetShoppingCartTotalAsync override (CAT-042 plugin) after the native result; side-effect free (it is called on every cart, checkout and payment-fee calculation); providers: PAY-009 wallet Deduction (WAL-01 option (b) only), FIN-003 premium Charge (only if confirmed) |
| IC-CAT-06 | Order total host — Reserve / Confirm / Release (provider operations) | Reserve: customer, store, CheckoutSession, the amount used in the order total, provider reference; Confirm: reservation, saved order ID; Release: reservation, reason | Reserve: reservation reference, or refusal with message key; Confirm, Release: done | Reserve refusal refuses the placement; Confirm error raises a placement exception (CHK-004, AUD-CHK-007); Release error is logged | Called by the CAT-042 placement participant registered with the CHK-003 IOrderProcessingService host (IC-CHK-06, BR-CHK-020); Confirm runs per saved sub-order before OrderPlacedEvent; PAY-009 debits the wallet and writes its ledger entry against the order in Confirm (BR-CAT-033) |
| IC-CAT-06 | Order total host — GetOrderAdjustments (read) | Order ID | Confirmed adjustments: provider, kind, amount, label, reference | Unknown order | CAT service over OrderTotalAdjustment; used by PAY, DOC (token %Order.TotalAdjustments% through IC-DOC-02, name Proposed) and RPT |
| IC-CAT-07 | Booking service — Hold / Confirm / Book / Move / RecordOutcome / Release / WriteSlots | Slot id or booking id; cart item, order item or customer; target slot; outcome (SM-SVC-02); generated slots (resource, outlet, start, end, capacity) | Booking id and state (SM-CAT-05); slots written and slots listed for staff | Slot full (Cat.SlotFull), hold expired (Cat.SlotHoldExpired), transition not allowed, capacity below confirmed bookings | CAT-027 service under ILocker key 'cat-slot-{SlotId}' (BR-CAT-021); callers: CAT checkout step, SVC-002 (GenerateSlots), SVC-003 (Move, RecordOutcome), EGV-003 (Book, Release) |

IC-CAT-01 is not binding until API-01 and PAID-STUB are decided. IC-CAT-03 is the single entry for state changes: other modules (SRC, SEL, ADM) call it and never write ListingState or Product.Published. IC-CAT-04 to IC-CAT-06 are the provider contracts of the three services CAT owns under decision OVR-REG (Proposed): providers register through DI as implementations of the CAT provider interfaces and the CAT host resolves them all; they never override the nopCommerce interface (BR-CAT-031). IC-CAT-06 providers: PAY-009 (used only if WAL-01 selects option (b)) and FIN-003 (only if variable premiums are confirmed); CAT-042 implements IC-CHK-06 as one placement participant for all of them, so providers register with CAT only (BR-CAT-033). IC-CAT-07 is the only way to change bookings and slot capacity (BR-CAT-021, BR-SVC-011, BR-EGV-007). CAT implements other modules' contracts: IC-ADM-03 callbacks (CAT-022, CAT-037, CAT-043), IC-DOC-02 token providers (CAT-015 trade fields; CAT-042 order-total adjustments), IC-CHK-01 cart rule providers and two warning replacers (BR-CAT-032), IC-CHK-06 placement participant (CAT-042, BR-CAT-033), IC-ORD-08 quote request (CAT-013), IC-PLT-02 feature state (BR-CAT-027), IC-SEC-01 audit (BR-CAT-029). C# signatures are produced at L2 build start and approved by the tech lead.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Listing.StateChanged (all SM-CAT-01 transitions) | None native (raised by IC-CAT-03) | SRC index refresh, SEL seller dashboard, RPT, TRK notifications |
| Listing.Withdrawn | None native | INV-004 (release cart holds), PAY-007 (list escrow orders for finance), RET-007 (list open cases), watchers notification |
| Publish gate | ModelReceivedEvent<BaseNopModel> on Admin ProductController Create / Edit [POST] (veto by ModelState error) + IProductService insert / update DI override (CAT-002 host with the CAT-022 publish-gate provider, OVR-REG) | BR-CAT-005; consumers do not throw, they add a ModelState error; the host calls the publish guard (IC-CAT-04) |
| Vendor listings paused / resumed | None native (IC-CAT-03 PauseListings / ResumeListings called by SEL after Seller.Suspended, Seller.Reinstated and similar SEL events) | Listing.StateChanged per listing; AUD-CAT-016 |
| Category or search list shown | ModelPreparedEvent<BaseNopModel> with CategoryModel, SearchModel or CatalogProductsModel (native) | CAT-034 list impressions |
| Product saved (version) | IProductService update / insert override (not EntityUpdatedEvent: a consumer failure would lose the version silently) | CAT-023 |
| Product copied | PostCopyProductEvent (native) | CAT-008 marks the copy Draft (gate already forced Published false) |
| Product page viewed | ModelPreparedEvent<BaseNopModel> with ProductDetailsModel (native) | CAT-034 counter |
| Cart item added | EntityInsertedEvent<ShoppingCartItem> (native) | CAT-034 counter |
| Cart item moved to order item | ShoppingCartItemMovedToOrderItemEvent (native) | CAT-027 links the booking hold to the order item |
| Order status changed to Cancelled | OrderStatusChangedEvent (native) | CAT-027 enqueues slot release |
| Review approved | ProductReviewApprovedEvent (native) | RPT; SEL-012 if seller ratings aggregate reviews |
| Upload received | ADM-008 global action filter on Admin PictureController.AsyncUpload / DownloadController.AsyncUpload [POST] and on the CAT admin upload actions registered with ADM-008 (not a CAT filter) | BR-CAT-003 |
| Quote cart price | GetShoppingCartItemUnitPriceEvent (native, handled by Misc.RFQ) | BR-CAT-020 precedence |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two approvers decide the same step at once | CAT-022, CAT-043 | Decisions run under ILocker key 'cat-listing-{ProductId}'; ListingState carries its own row version (plugin table); the second decision re-reads and is refused if the step is no longer Pending |
| Seller edits while an approver decides | CAT-022 | Both take 'cat-listing-{ProductId}'; whichever runs second re-reads the state: an approval after a withdrawal is refused; an edit after approval follows BR-CAT-008 |
| Two inserts need a generated SKU | CAT-003 | Sequence under 'cat-sku-{PatternId}'; when PerformActionWithLockAsync returns false the insert retries, then fails with Cat.SkuGenerationBusy (BR-CAT-004) |
| Two shoppers take the last place of a slot | CAT-027 | Holds under 'cat-slot-{SlotId}'; BookingSlot row version; capacity re-checked inside the lock (BR-CAT-021) |
| Two placements approved for the last slot | CAT-033 | Approvals under 'cat-placement-{PlacementTypeId}' (BR-CAT-022) |
| Stale or certificate task pauses a listing while the seller re-confirms | CAT-019, CAT-025 | Both take 'cat-listing-{ProductId}'; the task re-reads and skips listings changed since it selected them |
| Two staff save the same product form | CAT-023 | Version check in the Edit [POST] veto (BR-CAT-019); native already refuses when StockQuantity changed (Admin.Catalog.Products.Fields.StockQuantity.ChangedWarning) |
| Import updates a product being edited | CAT-009 | Last write wins at row level (native); both writes create versions (CAT-023) and the import result lists the product |
| Locks across web nodes | All | ILocker is distributed only when DistributedCacheConfig.Enabled; per host otherwise (L1 §6.4); plugin row versions are the backstop |
| Two SEL pause or resume calls for the same vendor at once (for example vacation ends while suspension starts) | CAT-022 | Serialised under 'cat-vendor-listings-{VendorId}'; each listing change also takes 'cat-listing-{ProductId}' (vendor lock first, then listing lock); listings resume only when no reason remains (BR-CAT-030) |
| A listing is published while its vendor is being paused | CAT-022 | Publish takes 'cat-listing-{ProductId}' and re-reads VendorListingPause inside the lock; a pause that committed first makes the publish fail with Cat.SellerListingsPaused; a publish that committed first is paused by the vendor run |
| Wallet balance changes between the cart total and placement (another order or a top-up) | CAT-042, PAY-009 | The CAT-042 participant reserves through the provider in the IC-CHK-06 Reserve phase under the provider's own lock key (named by PAY); a refusal refuses the placement and the shopper sees the recalculated total (BR-CAT-033, BR-CHK-020) |
| A booking is moved while another shopper takes the last place of the target slot | CAT-027 | Move takes both slot locks in ascending SlotId order and re-checks capacity inside them (BR-CAT-021) |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Listing submitted to a queue | Approvers of the current step | Admin notification + email | CAT-022 |
| Listing decision (approved, rejected, changes requested) with reason | Seller (or staff owner) | Email (MessageTemplate Catalogue.ListingDecision.VendorNotification) + admin notification | CAT-022, CAT-043 |
| Listing withdrawn | Back-in-stock subscribers, wishlist holders; seller | Email (Catalogue.ListingWithdrawn.CustomerNotification; Catalogue.ListingWithdrawn.VendorNotification) | CAT-024 |
| Listing report received | Compliance staff | Admin notification | CAT-021 |
| Report or takedown decided | Seller; registered reporter | Email (Catalogue.ListingReportDecision.*) | CAT-021 |
| Certificate expiring / expired | Seller; compliance staff | Email | CAT-019 |
| Listing stale / paused as stale | Seller | Email | CAT-025 |
| Question published / answer published | Seller / question author | Email | CAT-018 |
| Placement approved, rejected, started, ended, suspended | Seller | Email | CAT-033 |
| Schema change awaiting approval | Holders of Misc.Catalogue.Schema.Approve | Admin notification | CAT-005 |
| Import validation finished | Uploader | Admin notification | CAT-010 |
| Feed run failed | Marketing staff | Email | CAT-035 |
| Over-maximum request decided | Buyer | Email | CAT-037 |
| Listing paused as not eligible after low-stock re-publish | Seller (or staff owner) | Email + admin notification | CAT-022 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Catalogue analytics (listings by state and category, out-of-stock rate, rejection reasons) | CAT-034 | REQ-MPC-FR-066 |
| Product and category views, cart additions, click-through and conversion | CAT-034 | REQ-MPC-FR-091 (click-through and conversion: AC-CAT-034-02-04 to 02-06; native search-term counts: SRC-021) |
| Moderation queue ageing and decisions by approver | CAT-022, CAT-043 | Proposed |
| Import job results and error reports | CAT-010 | REQ-MPC-FR-054 |
| Listing reports and takedowns | CAT-021 | REQ-MPC-FR-073 |
| Certificates expiring | CAT-019 | D |
| Stale listings | CAT-025 | D |
| Promoted placements and fees | CAT-033 | REQ-MPC-FR-070 |
| Native: bestsellers, products never purchased, low stock, popular search terms | RPT-001 | FIT |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-CAT-001 | Listing state change | User / system task | ListingState | old state, new state, reason, actor |
| AUD-CAT-002 | Approval step decision | Approver | ApprovalStep | decision, reason, step, round |
| AUD-CAT-003 | Schema, queue or assignment-rule change and its approval | Staff / approver | CategorySchema, ModerationQueue, AssignmentRule | old and new values, approver |
| AUD-CAT-004 | Prohibited rule change | Compliance staff | ProhibitedRule | old and new values |
| AUD-CAT-005 | Report or takedown decision | Compliance staff | ListingReport, TakedownRequest | decision, reason, evidence ids |
| AUD-CAT-006 | Listing withdrawn | Staff | ListingState | reason, notified count |
| AUD-CAT-007 | Version restored | Staff / seller | ProductVersion | from version, new version |
| AUD-CAT-008 | Compliance status or certificate change; auto-pause on expiry | Compliance staff / system | ComplianceStatus, ProductCertificate | old and new values |
| AUD-CAT-009 | Price list change | Sales staff | PriceList, PriceListItem | old and new values |
| AUD-CAT-010 | Placement decision | Marketing staff | PromotedPlacement | decision, fee |
| AUD-CAT-011 | Staff view of a product edit page | Staff | CatalogueViewLog | user, IP address, time |
| AUD-CAT-012 | Import committed | Staff / seller | ImportJob | counts, file id |
| AUD-CAT-013 | SKU pattern change | Administrator | SkuPattern | old and new pattern |
| AUD-CAT-014 | Fixed currency price change | Sales staff | ProductCurrencyPrice | old and new values |
| AUD-CAT-015 | Question or answer moderated | Moderator | ProductQuestion, ProductAnswer | decision |
| AUD-CAT-016 | Vendor listings paused or resumed | SEL (system) / staff | VendorListingPause, ListingPauseReason | vendor, reason code, action, number of listings changed |

All CAT business audit events are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id (BR-CAT-029). Field-level old and new values of product and plugin-table edits come from the SEC IRepository<> decorator (PRD-SEC-004), so CAT writes only through IRepository<>. The native activity log is not an audit substitute. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-CAT-001 | No listing is visible or purchasable on the storefront unless its state is Published, whatever path changed it (form, bulk edit, copy, import, API, low-stock task). | D (CAT-022); BR-CAT-005 | AC-CAT-022-01-03, AC-CAT-022-01-04; test note T-CAT-01 |
| NFR-CAT-002 | Uploaded product files are validated on the server for type and size before they are stored (through the ADM-008 upload policy). | REQ-MPC-FR-060 | AC-CAT-002-04-01, AC-CAT-002-04-02; T-CAT-04 |
| NFR-CAT-003 | Every listing state change, approval decision and catalogue rule change is audited (NFR-X-003). | REQ-MPC-FR-058, FR-309; NFR-X-003 | §14.2 audit events |
| NFR-CAT-004 | Prices shown equal prices charged for each customer, company and currency even with price caching on (price caching stays off while customer-level price lists exist, BR-CAT-034). | BR-CAT-020, BR-CAT-025, BR-CAT-034 | AC-CAT-039-01-10, AC-CAT-042-01-04; T-CAT-03 |
| NFR-CAT-005 | All catalogue user-facing text is in locale resources (NFR-X-004). | REQ-KTDA-LOC-001; NFR-X-004 | §11.2 |
| NFR-CAT-006 | Import throughput, page-load and API response targets: Not stated in source — requires confirmation (KG-02, KG-18, MG-13). | NFR-X-009 | — (no target) |
| NFR-CAT-007 | Exactly one implementation of IProductService, IPriceCalculationService and IOrderTotalCalculationService is registered in a product installation, and it is the CAT host; every provider runs on every call path of the host. | OVR-REG; BR-CAT-031 | AC-CAT-002-05-04; T-CAT-09 |
| NFR-CAT-008 | The order total of a placed order always equals the native total plus Charges minus Deductions recorded in OrderTotalAdjustment, including after admin order edits. | OVR-REG; BR-CAT-033 | AC-CAT-042-02-06, AC-CAT-042-02-08; T-CAT-12 |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-CAT-001 | P1 | — | |
| PRD-CAT-002 | P1 | — | PRD-SEL-007, PRD-CAT-022, PRD-INV-009, PRD-INV-011, PRD-SRC-003, PRD-SRC-005, PRD-SRC-009 |
| PRD-CAT-003 | P1 | — | |
| PRD-CAT-004 | P1 | — | |
| PRD-CAT-005 | P1 | — | |
| PRD-CAT-006 | P1 | — | |
| PRD-CAT-007 | P1 | — | |
| PRD-CAT-008 | P2 | — | |
| PRD-CAT-009 | P1 | — | |
| PRD-CAT-010 | P1 | — | |
| PRD-CAT-011 | P1 | PRD-INT-001 | |
| PRD-CAT-012 | P1 | — | |
| PRD-CAT-013 | P1 | — | |
| PRD-CAT-014 | P1 | — | |
| PRD-CAT-015 | P1 | — | |
| PRD-CAT-016 | P1 | — | |
| PRD-CAT-017 | P1 | — | |
| PRD-CAT-018 | P2 | — | |
| PRD-CAT-019 | P2 | — | |
| PRD-CAT-020 | P1 | — | |
| PRD-CAT-021 | P1 | — | |
| PRD-CAT-022 | P1 | PRD-ADM-002, PRD-CAT-002 | PRD-CAT-043 |
| PRD-CAT-023 | P1 | — | |
| PRD-CAT-024 | P1 | — | |
| PRD-CAT-025 | P2 | — | |
| PRD-CAT-026 | P1 | — | PRD-SVC-001, PRD-SVC-002, PRD-SVC-009 |
| PRD-CAT-027 | P1 | — | PRD-EGV-003, PRD-SVC-003, PRD-SVC-004, PRD-SVC-012 |
| PRD-CAT-028 | P2 | — | |
| PRD-CAT-029 | P1 | — | |
| PRD-CAT-030 | P1 | — | |
| PRD-CAT-031 | P1 | PRD-LOG-005 | |
| PRD-CAT-032 | P2 | PRD-SEC-004 | |
| PRD-CAT-033 | P1 | — | |
| PRD-CAT-034 | P1 | — | |
| PRD-CAT-035 | P2 | — | |
| PRD-CAT-036 | P1 | — | |
| PRD-CAT-037 | P2 | — | |
| PRD-CAT-038 | P1 | — | |
| PRD-CAT-039 | P1 | PRD-IAM-022 | |
| PRD-CAT-040 | P2 | PRD-IAM-022 | |
| PRD-CAT-041 | P1 | — | |
| PRD-CAT-042 | P1 | — | |
| PRD-CAT-043 | P1 | PRD-CAT-022 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-CAT-01 | Publish gate: for each path (form, bulk edit, copy, Excel import, CSV/XML import, API, low-stock re-publish after order cancellation) try to publish a Draft listing; assert Published stays false. |
| T-CAT-02 | State model: every transition in SM-CAT-01 to SM-CAT-10 is tested; every transition not listed is refused. |
| T-CAT-03 | Pricing: two customers with the same roles but different customer-level native price lists see and pay their own price with catalogsettings.cacheproductprices off, and the pack validation refuses switching it on (BR-CAT-034); two currencies with fixed prices see and pay their own price with caching on; a tier price and a price list on the same product show the tier price and appear in the pricing-conflicts list; order amounts back-convert exactly (BR-CAT-020, BR-CAT-025). |
| T-CAT-04 | Uploads: each disallowed extension and an oversized file are refused for pictures and documents; allowed files pass. |
| T-CAT-05 | Concurrency: parallel SKU generation, last-slot booking and last-placement approval produce no duplicate or overbooking. |
| T-CAT-06 | Import: a file with one bad row imports nothing and lists the row; a clean file imports and records counts. |
| T-CAT-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1); a vendor cannot act on another vendor's product. |
| T-CAT-08 | Segregation: the submitter cannot decide any step of own listing (BR-CAT-006). |
| T-CAT-09 | Provider hosts (OVR-REG): with INV, SRC, SEL (submission and publish), CAT-042 fixed-price and test PAY-009 and FIN-003 providers registered (CAT-039 is native, VER-500), assert the DI container resolves the CAT host for each of the three interfaces, each provider is called on every path (storefront, admin, import, API, order placement) and a second implementation raises the BR-ADM-001 warning. |
| T-CAT-10 | Vendor pause: pause with two reasons, clear one, clear the other; assert listings stay Paused until both are gone; for each publish path (lifecycle, form, bulk edit, import, API, low-stock re-publish) assert Published stays false while a reason remains. |
| T-CAT-12 | Order-total adjustments: with a test Deduction provider and a test Charge provider, assert the cart total, the order totals lines, one OrderTotalAdjustment row per adjustment after placement, Release on a failed payment, refusal when Reserve is refused, unchanged amounts after an admin order-item edit, and the %Order.TotalAdjustments% token output (BR-CAT-033). |
| T-CAT-11 | Bookings: Book (direct), Move to a full and a free slot, RecordOutcome for each SVC outcome; assert capacity and SM-CAT-05 state after each call and no overbooking under parallel calls. |
