# L2 Module PRD — SEL: Sellers and marketplace onboarding

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | SEL — Sellers and marketplace onboarding |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets a client that runs a marketplace take businesses on as sellers: application and profile, KYC documents, verification and tiers, terms, listing rules, payout accounts, commission and fee rules, settlements and payouts, seller staff, locations, vacation, ratings, performance, notifications and reports. It also holds the platform block, watch and allow lists (SEL-013, Platform core) used by every module. The Marketplace pack applies to a client only if that client confirms a marketplace: the seller model is an open gap for both clients (KG-01 KTDA, MG-02 Malawi Post). For Malawi Post the sources conflict (decision C-SELLER): gap MG-02 says the seller model is not stated, while MPC FR-026 to FR-050 (fit-gap report copy, M-01) describe seller onboarding in detail; both stand until Malawi Post confirms, so the criteria citing REQ-MPC-FR-026 to FR-050 are specified here but bind Malawi Post only after confirmation.

**In scope**

- Seller application, profile, terms and KYC documents (SEL-001, SEL-002, SEL-006)
- Seller verification workflow, tiers, upgrade and appeal, identity and registry checks through IAM-020 adapters (SEL-003, SEL-004)
- Payout accounts with verification and maker-checker change approval (SEL-005)
- Marketplace rules and listing eligibility, supplied to the CAT-022 publish gate (SEL-007)
- Seller dashboard and onboarding checklist, seller staff accounts, seller categorisation, locations and fulfilment opt-in, vacation mode (SEL-008 to SEL-010, SEL-018, SEL-019)
- Seller performance monitoring, ratings, notifications, onboarding funnel report, diversity tracking, training content (SEL-011, SEL-012, SEL-020 to SEL-023)
- Platform block, watch and allow lists (Platform core) and seller blacklisting (SEL-013, SEL-024)
- Approved supplier panels (B2B trade pack) and bulk participant import and invitation (SEL-014, SEL-015)
- Commission and fee rules, seller settlements and payouts, commission invoicing to sellers paid directly (SEL-016, SEL-017, SEL-025)

**Not in this module**

| Item | Where it is |
|---|---|
| Product listing lifecycle, publish gate, pause and resume of listings, listing moderation queue | CAT module (PRD-CAT-022, CAT-043) — SEL supplies eligibility checks and pause reasons through IC-SEL-01 |
| Payment split per order line (seller share, logistics fee, commission) | PAY module (PRD-PAY-010) — SEL-017 consumes the split records |
| Payout money movement to providers (connector Payout operation) | PAY module (PRD-PAY-024, IC-PAY-01 Payout) |
| Direct payment to the seller and its offline confirmation | PAY module (PRD-PAY-035, PAY-036); SEL-025 invoices the commission |
| Tax on commission and fees; tax reports | PAY module (PRD-PAY-021) |
| Accounts receivable ledger; statutory e-invoicing submission | PAY module (PRD-PAY-033, PAY-025) |
| Checkout blocking for restricted customers (enforcement) | PAY module (PRD-PAY-018) — SEL-013 list entries feed it |
| Splitting a multi-seller cart into one order per seller | CHK module (PRD-CHK-004) — until PAY group payment exists, carts hold one seller only (decision SPLIT-PAY, Proposed) |
| Refund triggers and refund money movement | RET module (PRD-RET-005, IC-RET-04) raises triggers; PAY module (PRD-PAY-016) moves the money; SEL-017 only deducts completed refunds in settlement |
| Workflow engine and generic approval queues | ADM module (PRD-ADM-002, ADM-006) |
| Document storage with versions and retention | DOC module (PRD-DOC-002) |
| Identity verification adapter framework and country adapters | IAM module (PRD-IAM-020) |
| Versioned terms acceptance records for customers and sellers, re-acceptance prompts | IAM module (PRD-IAM-016, IC-IAM-05) — SEL-006 records seller terms acceptance through IC-IAM-05 (decision ONE-RECORD) |
| Multi-channel notification engine and preferences | TRK module (PRD-TRK-005, TRK-006) |
| Complaints process (source of complaint counts) | CRM module (PRD-CRM-004) |
| Guided tours | PLT module (PRD-PLT-019) |
| Seller quoting on requests for quotation | ORD module (PRD-ORD-012, ORD-013) — SEL-014 panels restrict who is invited |
| Delivery service levels and cut-offs | ORD module (PRD-ORD-011) |
| Seller-managed prices and vendor discounts | MKT module (PRD-MKT-014) |
| Platform audit trail store | SEC module (PRD-SEC-004) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-SEL-001 | Seller application and profile | Seller / back-office | P1 | Configuration | None | Marketplace pack | | |
| PRD-SEL-002 | Seller KYC documents | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-DOC-002 | |
| PRD-SEL-003 | Seller verification workflow and tiers | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-ADM-002 | WF-ENG |
| PRD-SEL-004 | Identity and registry verification adapters | Seller / back-office | P1 | External system | External system + integration plugin | Marketplace pack | PRD-IAM-020 | |
| PRD-SEL-005 | Payout accounts and verification | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-ADM-006 | WF-ENG |
| PRD-SEL-006 | Seller terms acceptance | Seller / back-office | P1 | Configuration | None | Marketplace pack | | |
| PRD-SEL-007 | Marketplace rules and listing eligibility | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-CAT-002 | |
| PRD-SEL-008 | Seller dashboard and onboarding checklist | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-009 | Seller staff accounts | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-010 | Seller categorisation | Seller / back-office | P2 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-011 | Seller performance monitoring | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-012 | Seller ratings | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-013 | Block and watch lists | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-SEL-014 | Approved supplier panels | B2B | P2 | Code-level | Custom plugin | B2B trade pack | | |
| PRD-SEL-015 | Bulk participant import and invitation | Seller / back-office | P2 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-016 | Commission and fee rules | Seller / back-office | P1 | Code-level | Custom plugin (on vendor plugin base) | Marketplace pack | | |
| PRD-SEL-017 | Seller settlements and payouts | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-PAY-010, PRD-SEL-005, PRD-PAY-024 | WF-ENG, PAY-DIRECT / LIC-01 |
| PRD-SEL-018 | Seller locations and fulfilment opt-in | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-019 | Seller vacation mode | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-020 | Seller notifications | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-021 | Seller onboarding funnel report | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-022 | Seller diversity tracking | Seller / back-office | P3 | Code-level | Custom plugin | Marketplace pack | | |
| PRD-SEL-023 | Seller training content | Seller / back-office | P1 | Configuration | None | Marketplace pack | | |
| PRD-SEL-024 | Seller blacklisting | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-SEL-013 | |
| PRD-SEL-025 | Commission invoicing to sellers | Seller / back-office | P2 | Code-level | Custom plugin | Marketplace pack | PRD-SEL-016, PRD-PAY-033, PRD-PAY-021, PRD-PAY-025 | PH-INF, PO-REC-v8, PAY-DIRECT / LIC-01, E-INV, PAID-STUB, DOC-LIB |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Applicant (registered customer applying to sell) | Applies, accepts the seller terms, uploads documents, follows the status of the application in My account (no admin access until approved) | Registered (native) |
| Seller (owner user) | Manages profile, documents, payout accounts, staff, locations, vacation, sees dashboard, statements and ratings | Vendors (native); Customer.VendorId set |
| Seller staff user | Works in the seller portal within the limits of a staff profile set by the seller owner | Vendors (native) + SEL staff profile (BR-SEL-010) |
| Compliance staff | Reviews applications and documents, decides verification and tiers, handles appeals, manages seller block and watch lists | Role system name "Compliance" (BR-IAM-050) |
| Finance staff | Maintains commission and fee rules, approves payout account changes, releases settlements, issues commission invoices | Role system name "Finance" (BR-IAM-050) |
| Fraud staff | Manages platform block, watch and allow lists | Role system name "Risk" (BR-IAM-050) |
| Procurement staff | Maintains approved supplier panels per category | Role system name "Procurement" (BR-IAM-050) |
| Client administrator | Switches the marketplace on, configures tiers, document types, rules, thresholds, staff profiles, notifications | Administrators (native) |
| Buyer (shopper or business buyer) | Rates the seller after a completed order; sees vacation messages | Registered (native) |
| Client management | Reads the onboarding funnel, performance and diversity reports | Role with Marketplace.Core.Reports.View |
| Identity and registry services (system) | Answer identity, tax, business-registry and mobile-money KYC checks | External system via IAM-020 adapter |
| Payment provider (system) | Executes seller payouts and reports results | External system via PAY-024 adapter |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Customers.VendorsView / Customers.VendorsCreateEditDelete (native) | Customers | Native vendor list and edit pages; with SEL installed, activation through the edit page is gated (BR-SEL-002) | Administrators |
| Marketplace.Core.SellerPortal.Access | Customers | Seller portal pages of the plugin: dashboard, documents, payout accounts, staff, locations, vacation, statements, ratings (own vendor only) | Vendors |
| Marketplace.Core.Applications.View | Customers | View seller applications, documents and history | Administrators, Compliance |
| Marketplace.Core.Applications.Decide | Customers | Assign, approve, reject, suspend and reinstate sellers; decide upgrade and appeal requests | Compliance |
| Marketplace.Core.Documents.Review | Customers | Accept, request resubmission of or reject seller documents | Compliance |
| Marketplace.Core.Rules.CreateEditDelete | Configuration | Edit tiers, document types, marketplace rules, KPI thresholds, staff profiles, settlement cycles | Administrators |
| Marketplace.Core.Commission.View | Configuration | View commission and fee rules and their versions | Administrators, Finance |
| Marketplace.Core.Commission.CreateEditDelete | Configuration | Create and edit commission and fee rules with effective dates | Finance |
| Marketplace.Core.PayoutAccounts.Approve | Customers | Approve or reject payout account changes (not own requests) | Finance |
| Marketplace.Core.Settlements.View | Orders | View settlement batches, payouts and statements of all sellers | Administrators, Finance |
| Marketplace.Core.Settlements.Release | Orders | Release a calculated settlement batch for payout; retry failed payouts | Finance |
| Marketplace.Core.CommissionInvoices.CreateEditDelete | Orders | Issue and correct commission invoices to sellers paid directly | Finance |
| Marketplace.Core.Ratings.Moderate | Catalog | Publish, reject or hide seller ratings | Administrators |
| Marketplace.Core.Panels.CreateEditDelete | Orders | Maintain approved supplier panels | Procurement |
| Marketplace.Core.Import.CreateEditDelete | Customers | Run bulk participant imports and send invitations | Administrators |
| Marketplace.Core.Reports.View | Reports | Onboarding funnel, performance and diversity reports | Administrators |
| Platform.Core.Lists.View | Customers | View block, watch and allow lists and appeals | Administrators, Risk, Compliance |
| Platform.Core.Lists.CreateEditDelete | Customers | Create, change, revoke list entries; decide appeals | Risk, Compliance |

Permissions are declared in classes implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager): one in the Marketplace pack plugin (prefix Marketplace.Core) and one in the Platform core plugin that holds SEL-013 (prefix Platform.Core), because SEL-013 is Platform core and must work when the Marketplace pack is off. Categories are taken from the native set (StandardPermission partial classes Customers, Orders, Reports, Catalog, Configuration). Default roles are given by role system name; every name is in the IAM product role catalogue BR-IAM-050 (Finance, Risk, Compliance, Procurement); missing catalogue roles are created by the IAM plugin at install and start (BR-IAM-050), and SEL relies on no other role creation. Native vendor rights are unchanged: the Vendors role holds by default Security.AccessAdminPanel, Orders, Shipments, Products, Product reviews, Product tags, Product attributes and Discounts view and create-edit-delete (DefaultPermissionConfigManager). Seller-owned data is scoped natively by IWorkContext.GetCurrentVendorAsync (Customer.VendorId of an active vendor). All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-SEL-PERM-01 | **Given** a user without Customers.VendorsView / Customers.VendorsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-02 | **Given** a user without Marketplace.Core.SellerPortal.Access, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-03 | **Given** a user without Marketplace.Core.Applications.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-04 | **Given** a user without Marketplace.Core.Applications.Decide, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-05 | **Given** a user without Marketplace.Core.Documents.Review, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-06 | **Given** a user without Marketplace.Core.Rules.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-07 | **Given** a user without Marketplace.Core.Commission.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-08 | **Given** a user without Marketplace.Core.Commission.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-09 | **Given** a user without Marketplace.Core.PayoutAccounts.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-10 | **Given** a user without Marketplace.Core.Settlements.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-11 | **Given** a user without Marketplace.Core.Settlements.Release, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-12 | **Given** a user without Marketplace.Core.CommissionInvoices.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-13 | **Given** a user without Marketplace.Core.Ratings.Moderate, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-14 | **Given** a user without Marketplace.Core.Panels.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-15 | **Given** a user without Marketplace.Core.Import.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-16 | **Given** a user without Marketplace.Core.Reports.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-17 | **Given** a user without Platform.Core.Lists.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEL-PERM-18 | **Given** a user without Platform.Core.Lists.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-SEL-001 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Apply-for-vendor page (VendorSettings.AllowCustomersToApplyForVendorAccount; Presentation/Nop.Web/Controllers/VendorController.cs:ApplyVendor), vendor profile (Name, Email, Description, PictureId, Address, SEO), vendor attributes, vendor features per store via settings. \| 5.00.1: VendorSettings adds AllowVendorsToUpload3dObjects (5.00); public VendorController adds private-message contact check (PrivateMessageSettings.AllowPrivateMessages). | None for profile; KYC/verification are SEL-002/003. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-002 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Vendor attributes exist but FileUpload control type is excluded for vendor attributes (admin view and public VendorModelFactory skip FileUpload). \| 5.00.1: Vendor attribute FileUpload still unsupported (Presentation/Nop.Web/Factories/VendorModelFactory.cs:147 'not supported attribute control types'). | Document upload per type, storage, expiry tracking, admin review. PG CAT-07 is AFR (4.70.5) — AFR port required. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-003 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Vendor.Active flag and vendor notes (Libraries/Nop.Core/Domain/Vendors/VendorNote.cs); VendorAccountApply.StoreOwnerNotification. | Stage workflow, verification tiers, upgrade/appeal requests, participant-visible status. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-004 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | External ID/tax/business-registry/MNO checks via the PRD-IAM-020 adapter framework. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-005 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (no payout account entity). | Payout account capture, verification and maker-checker change approval. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-006 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Vendor terms of service checkbox on application (VendorSettings.TermsOfServiceEnabled; topic VendorTermsOfService). | Versioned seller agreement re-acceptance not native (if required, reuse PRD-IAM-016). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-007 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: NEW vs 4.70.5: Category.RestrictFromVendors blocks vendors from listing in a category (enforced via Libraries/Nop.Services/Catalog/CategoryService.cs:CanVendorAddProductsAsync); VendorSettings.MaximumProductNumber. | Rules by seller type/item type, pre-publish eligibility checks. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-008 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Vendors use the admin area limited to their own data (dashboard, products, orders, reports). | Seller home with onboarding checklist, tasks and payout widgets. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-009 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Several customers can be linked to one vendor (Customer.VendorId; admin VendorController.AddCustomerToVendorPopup); all get the same vendor rights. | Seller-managed staff users with per-user limited permissions. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-010 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Vendor attributes can tag a type/tier. | Type-specific terms and processes. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-011 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Seller KPIs and threshold actions. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-012 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: NEW vs 4.70.5: public vendor reviews page aggregating product reviews of the vendor's products (Presentation/Nop.Web/Controllers/CatalogController.cs:VendorReviews; CatalogSettings.VendorProductReviewsPageSize). | Direct post-order seller rating with moderation. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-013 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Admin IP allow-list only (SecuritySettings.AdminAreaAllowedIpAddresses); customer Active flag; honeypot/CAPTCHA. | Block/watch lists for users, IPs, devices with reason/expiry/history and transaction screening. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-014 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Approved supplier panels per category with validity and renewal. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-015 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Customer Excel import exists (Libraries/Nop.Services/ExportImport/ImportManager.cs:ImportCustomersFromXlsxAsync, also in 4.70.5); no vendor import, no invitations, no per-row result report. | Participant import with row validation, duplicate detection, invitations. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-016 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None in core. \| 5.00.1: NEW 5.00 split carts per vendor (ShoppingCartSettings.VendorEnabled/VendorRequired; Libraries/Nop.Services/Orders/ShoppingCartService.cs:604,1221) are cart behaviour only; no commission entity. | Base: nopStation Vendor Discount and Commission (candidate; listed for 4.70 — 5.00 support to confirm with vendor); build delta: fee types and effective dates. | Custom plugin (on vendor plugin base) | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: plugin not in source; plugin evaluation only |
| PRD-SEL-017 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None in core. \| 5.00.1: No settlement/payout entity in 5.00.1; split vendor carts (ShoppingCartSettings.VendorEnabled) do not settle funds. | Settlement calculation, statements, mobile-money/bank payouts (nopStation Vendor Payout rejected: PayPal/Stripe only). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-018 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Vendor has one address (Vendor.AddressId); warehouses are global, not vendor-owned. | Multiple seller locations, pickup/drop-off options, client-fulfilment opt-in. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-019 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (only admin Vendor.Active). | Vacation mode with message and auto-pause/resume. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-020 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Vendor email templates: OrderPlaced/OrderPaid/OrderCancelled.VendorNotification, QuantityBelow.VendorNotification. \| 5.00.1: NEW 5.00 ISmsService is consumed only by Presentation/Nop.Web/Controllers/CustomerController.cs (OTP); no SMS notifications to vendors. | Verification and complaint notifications; SMS/app channels. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-021 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Seller onboarding funnel report (depends on SEL-003 stages). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-022 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Vendor attributes can capture characteristics (checkbox/dropdown). | Diversity share reporting. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-023 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Topics (CMS pages) with ACL by customer role (Vendors role) and store mapping; downloads via topic content. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-024 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None beyond Vendor.Active. | Seller block/watch list with period, appeal and automatic enforcement (shares SEL-013 engine). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEL-025 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Order invoice PDF only (customer-facing). | Periodic commission/fee invoices to sellers (fiscal e-invoice integration where applicable). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-SEL-001 Seller application and profile

| Item | Value |
|---|---|
| Description (baseline) | Businesses apply to sell on the platform and create a seller profile with name, description, logo and contact details. The marketplace can be switched on or off per client. |
| Why it matters | Lets a client run a marketplace with many sellers if it wants to. |
| Who benefits | Sellers; clients |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: K-SELLER, C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-001-01 | As an applicant, I want to create a seller account and submit a seller profile with name, description, logo and contact details, so that I can take part in the marketplace. | D; REQ-MPC-FR-026 | Ready; conditions: K-SELLER, C-SELLER |
| US-SEL-001-02 | As a client administrator, I want to switch the marketplace on or off for my instance, so that sellers can apply only if we run a marketplace. | D | Ready; conditions: K-SELLER, C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-001-01-01 | US-SEL-001-01 | **Given** VendorSettings.AllowCustomersToApplyForVendorAccount is on and the applicant is a registered customer who is not an administrator, **when** the applicant submits the native apply-for-vendor form with name, email, description, optional logo and the configured vendor attributes, **then** a vendor record is created with Active = false, Customer.VendorId is set to it, the store owner receives VendorAccountApply.StoreOwnerNotification, and SEL records the application as Submitted (SM-SEL-01). | REQ-MPC-FR-026; FIT (Nop.Web VendorController.ApplyVendorSubmit) |
| AC-SEL-001-01-02 | US-SEL-001-01 | **Given** a guest (not registered) opens the apply-for-vendor page, **when** the page is requested, **then** the guest is asked to log in or register first; no vendor record is created. | FIT (ApplyVendor returns Challenge for non-registered customers) |
| AC-SEL-001-01-03 | US-SEL-001-01 | **Given** a vendor attribute is configured as required, **when** the applicant submits without it, **then** the form is redisplayed with the attribute warning and no vendor record is created. | REQ-MPC-FR-026; FIT (VendorAttributeParser warnings) |
| AC-SEL-001-01-04 | US-SEL-001-01 | **Given** the application is Submitted or Under Review, **when** the applicant opens My account, **then** the seller application page shows the current status (SM-SEL-01) and the next required action; the applicant has no admin access (the customer is not yet in the Vendors role). | D; Proposed |
| AC-SEL-001-01-05 | US-SEL-001-01 | **Given** the vendor record was created but the SEL application record failed to save, **when** the application list is opened, **then** a vendor with Active = false and no application record is listed as Submitted (BR-SEL-002). | Proposed |
| AC-SEL-001-02-01 | US-SEL-001-02 | **Given** the client has not confirmed a marketplace (KG-01 / MG-02 open or answered single seller), **when** the instance is configured, **then** the Marketplace pack plugin is not installed and AllowCustomersToApplyForVendorAccount is off; the apply-for-vendor page redirects to the home page (BR-SEL-001). | D; FIT (ApplyVendorSubmit redirects when the setting is off) |

**Business rules applied:** BR-SEL-001; BR-SEL-002; BR-SEL-025 (§8.1).


### 7.2 PRD-SEL-002 Seller KYC documents

| Item | Value |
|---|---|
| Description (baseline) | Sellers upload required documents (registration, licences and so on); the system stores them, tracks expiry dates and lets staff review them. |
| Why it matters | Only properly documented businesses can sell. |
| Who benefits | Compliance staff; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-DOC-002 |
| Status | Ready; conditions: SINGLE-FILTER, C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-002-01 | As an applicant or seller, I want to upload the documents my seller type and tier require, with issue and expiry dates, so that my application can be verified. | D; REQ-MPC-FR-027 | Ready; conditions: SINGLE-FILTER, C-SELLER |
| US-SEL-002-02 | As a member of compliance staff, I want to review each document and accept it, ask for resubmission or reject it with a reason, so that only properly documented businesses sell. | D; FC-M11-012 | Ready; conditions: SINGLE-FILTER, C-SELLER |
| US-SEL-002-03 | As a client administrator, I want to configure the required profile fields and document types per seller type and tier without code, so that requirements change without a release. | REQ-MPC-FR-036; FC-M11-010 | Ready; conditions: SINGLE-FILTER, C-SELLER |
| US-SEL-002-04 | As a member of compliance staff, I want to be alerted before a document expires and to see expired documents, so that sellers renew in time. | D; FC-M11-011 | Ready; conditions: SINGLE-FILTER, C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-002-01-01 | US-SEL-002-01 | **Given** the seller type and tier require document types A and B, **when** the applicant opens the documents page, **then** A and B are listed as required with status Missing; each upload is stored through IC-DOC-03 Store (native Download plus DOC-002 metadata: type, owner = the vendor, vault flag, expiry date) and SEL records the document type, issue date, expiry date and DOC version, and the document becomes Uploaded (SM-SEL-03). | REQ-MPC-FR-027; FIT (vendor attributes exclude FileUpload, so documents are a SEL entity) |
| AC-SEL-002-01-02 | US-SEL-002-01 | **Given** identity and business registration details are configured as required vendor attributes (text box, for example registration number), **when** the applicant applies, **then** the values are stored with the vendor (native generic attribute VendorAttributes) and shown to compliance staff on the application. | REQ-MPC-FR-027; FIT (VendorAttribute, AttributeControlType text box) |
| AC-SEL-002-02-01 | US-SEL-002-02 | **Given** a document is Uploaded, **when** compliance staff accept it, request resubmission with a reason, or reject it with a reason, **then** the document becomes Accepted, ResubmitRequested or Rejected; the reason is mandatory for the last two and is shown to the seller; the action is audited (AUD-SEL-002). | D; FC-M11-012 |
| AC-SEL-002-02-02 | US-SEL-002-02 | **Given** the document was ResubmitRequested, **when** the seller uploads a new version, **then** the new version becomes Uploaded and the old version is kept as Superseded. | D; FC-M11-013 |
| AC-SEL-002-03-01 | US-SEL-002-03 | **Given** the administrator adds a required vendor attribute or a document type required for a tier, **when** the change is saved, **then** new applications and the checklist of existing sellers in that tier show the new requirement without a code change; the change is audited (AUD-SEL-005). | REQ-MPC-FR-036 |
| AC-SEL-002-04-01 | US-SEL-002-04 | **Given** a document is Accepted and its expiry date is within the configured alert lead time, **when** the daily expiry task runs, **then** the document becomes ExpiringSoon and the seller and compliance staff are notified (TRK event code Sel.DocumentExpiring.SellerNotification, IC-TRK-04). | D; FC-M11-011 |
| AC-SEL-002-04-02 | US-SEL-002-04 | **Given** an Accepted or ExpiringSoon document reaches its expiry date with no accepted renewal, **when** the expiry task runs, **then** the document becomes Expired; if the client setting "pause listings on expiry" is on, SEL requests a listing pause with reason DocumentExpired (IC-SEL-01). | FC-M11-011 |
| AC-SEL-002-01-03 | US-SEL-002-01 | **Given** a user other than the seller, its staff, compliance staff or an administrator, **when** requests a seller document file through the DOC-002 document endpoint or by its download GUID (Nop.Web DownloadController.GetFileUpload, Admin DownloadController.DownloadFile), **then** access is denied and the attempt is logged: the DOC-002 endpoint checks ownership (BR-DOC-011) and the SEC-002 download ownership filter, the single filter on the native download actions, applies the seller-document rule that SEL supplies as a rule provider (owning vendor's users, holders of Marketplace.Core.Applications.View or Marketplace.Core.Documents.Review, administrators); SEL adds no filter of its own on those actions. | FC-M11-013; SINGLE-FILTER; Proposed |
| AC-SEL-002-01-04 | US-SEL-002-01 | **Given** the seller already holds a valid vault document of a required type in DOC-002, **when** the seller attaches it to the application, **then** it satisfies the requirement without a new upload and is reviewed as above; an expired vault document is not accepted. | D; Proposed (reuses DOC-002 vault) |
| AC-SEL-002-01-05 | US-SEL-002-01 | **Given** the ADM-008 upload policy for the upload context "seller document" (registered by SEL) does not allow the file type, or the file is larger than its maximum, **when** the seller uploads the file, **then** IC-DOC-03 Store refuses it before anything is stored, with message Adm.UploadTypeNotAllowed or Adm.UploadTooLarge (BR-ADM-060); SEL keeps no type or size check of its own. | SINGLE-FILTER; Proposed |

**Business rules applied:** BR-SEL-004; BR-SEL-005 (§8.1).


### 7.3 PRD-SEL-003 Seller verification workflow and tiers

| Item | Value |
|---|---|
| Description (baseline) | Seller applications move through clear stages (submitted, under review, approved, rejected, suspended), with verification levels and the ability to request an upgrade or appeal. Participants see their current verification level, what it allows and what to do to reach the next level. |
| Why it matters | A fair, transparent and auditable onboarding process. |
| Who benefits | Sellers; client staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-003-01 | As a member of compliance staff, I want seller applications to move through Submitted, Under Review, Approved, Rejected and Suspended, so that onboarding is fair, transparent and auditable. | D; REQ-MPC-FR-028 | On hold: WF-ENG |
| US-SEL-003-02 | As a client administrator, I want to define verification tiers with the checks, documents and limits each tier needs, without code, so that verification is risk-based. | D; REQ-MPC-FR-029; REQ-MPC-FR-308 | On hold: WF-ENG |
| US-SEL-003-03 | As a seller, I want to see my verification level, what it allows and what unlocks the next level, and to request an upgrade or appeal a decision, so that I know how to progress. | D; REQ-MPC-FR-040; FC-M06-015 | On hold: WF-ENG |
| US-SEL-003-04 | As a client administrator, I want to configure the seller moderation queue and how applications are assigned to reviewers, so that the workload is shared. | REQ-MPC-FR-319 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-003-01-01 | US-SEL-003-01 | **Given** an application is Submitted, **when** SEL has submitted it to the ADM-006 seller-verification queue (IC-ADM-03 Submit) and a reviewer takes it from that queue, **then** it becomes Under Review and the assigned reviewer is recorded on the application. | REQ-MPC-FR-028; Proposed (IC-ADM-03) |
| AC-SEL-003-01-02 | US-SEL-003-01 | **Given** an application is Under Review, every required document of the tier is Accepted, the current seller terms are accepted (SEL-006) and the block-list check (SEL-013, SEL-024) passes, **when** the reviewer approves the ADM-006 item and ADM-006 calls the SEL OnApproved callback (IC-ADM-03), **then** the application becomes Approved; SEL sets Vendor.Active = true through IVendorService.UpdateVendorAsync and adds the applicant customer to the native Vendors role (ICustomerService.AddCustomerRoleMappingAsync); the seller is notified (Sel.ApplicationApproved.SellerNotification); audited (AUD-SEL-001). | REQ-MPC-FR-028; FIT (ApplyVendor leaves Active false and the Vendors role unassigned) |
| AC-SEL-003-01-03 | US-SEL-003-01 | **Given** a guard of the approval is not met, **when** the reviewer opens the application or tries to approve the ADM-006 item, **then** the application detail shows message Sel.ApprovalBlocked listing the unmet conditions; before recording an approval, an approval with conditions or the confirmation of conditions, ADM-006 calls the SEL guard IC-ADM-03 CanDecide, SEL refuses with the unmet conditions, and ADM records nothing and shows Adm.DecisionBlocked with the SEL reason (BR-ADM-031); if a guard becomes unmet after CanDecide and the OnApproved callback runs, SEL leaves the application Under Review and returns a module error (IC-ADM-03, raised to ADM-009). | REQ-MPC-FR-028; Proposed; see ADM-006 (IC-ADM-03 CanDecide) |
| AC-SEL-003-01-04 | US-SEL-003-01 | **Given** an application is Under Review, **when** the reviewer rejects the ADM-006 item with a reason (OnRejected callback, IC-ADM-03), **then** it becomes Rejected, the reason is shown to the applicant and sent (Sel.ApplicationRejected.SellerNotification); the vendor stays inactive. | REQ-MPC-FR-028 |
| AC-SEL-003-01-05 | US-SEL-003-01 | **Given** a seller is Approved, **when** compliance staff suspend it with a reason, **then** the application becomes Suspended; Vendor.Active is set to false (seller users are challenged in admin by the native ValidateVendor filter) and a listing pause with reason SellerSuspended is requested (IC-SEL-01), because Vendor.Active alone does not hide products (BR-SEL-006). | REQ-MPC-FR-028; FIT (ProductService.SearchProductsAsync has no vendor-status filter) |
| AC-SEL-003-01-06 | US-SEL-003-01 | **Given** a seller is Suspended, **when** compliance staff reinstate it, **then** it becomes Approved, Vendor.Active is set to true and the SellerSuspended pause reason is cleared. | REQ-MPC-FR-028 |
| AC-SEL-003-01-07 | US-SEL-003-01 | **Given** a user with Customers.VendorsCreateEditDelete edits a vendor whose application is not Approved, **when** they save the native vendor edit or create page with Active = true, **then** the SEL action filter on Admin VendorController.Create / Edit [POST] refuses the save with message Sel.ActivationBlocked (BR-SEL-002). | FIT (Admin VendorController.Edit takes VendorModel and checks ModelState); Proposed |
| AC-SEL-003-01-08 | US-SEL-003-01 | **Given** a user with Customers.VendorsCreateEditDelete opens a vendor whose application is Approved, **when** they save the native vendor edit page with Active = false, or delete the vendor (Admin VendorController.Delete [POST]), **then** the SEL action filter refuses the request with message Sel.UseSuspension; the seller can be taken off the marketplace only by suspension (SEL-003) or blacklisting (SEL-024), which also pause its listings (BR-SEL-006). | FIT (Admin VendorController.Edit copies Active from the posted model; Delete only clears Customer.VendorId and soft-deletes the vendor; neither unpublishes products); Proposed |
| AC-SEL-003-02-01 | US-SEL-003-02 | **Given** tiers T1 and T2 exist with different required document types, checks (for example IAM-020 identity check) and limits, **when** an applicant of seller type S applies, **then** the tier assigned by the configured rule for S applies, and only its requirements appear in the checklist. | REQ-MPC-FR-029; REQ-MPC-FR-308 |
| AC-SEL-003-02-02 | US-SEL-003-02 | **Given** an administrator changes a tier's required checks or limits, **when** the change is saved, **then** it applies to new decisions without a code change and is audited (AUD-SEL-005); sellers already approved keep their tier until re-verified (Proposed). | REQ-MPC-FR-308; Proposed |
| AC-SEL-003-02-03 | US-SEL-003-02 | **Given** a tier limit (for example maximum active listings) is configured, **when** a seller of that tier exceeds it at publish, **then** the CAT-022 publish gate receives a failed eligibility check from SEL with message Sel.ListingNotEligible. | REQ-MPC-FR-308; Proposed |
| AC-SEL-003-03-01 | US-SEL-003-03 | **Given** a seller is Approved at tier T1, **when** they open the verification page, **then** it shows the current tier, what it allows, what the next tier needs and a button to request an upgrade. | FC-M06-015; REQ-MPC-FR-040 |
| AC-SEL-003-03-02 | US-SEL-003-03 | **Given** a seller requests an upgrade or appeals a rejection or suspension with a statement and optional files, **when** the request is submitted, **then** a verification request is Open (SM-SEL-02) in the compliance queue; a decision Granted or Declined with a reason is shown to the seller; audited (AUD-SEL-001). | REQ-MPC-FR-040 |
| AC-SEL-003-03-03 | US-SEL-003-03 | **Given** a reviewer decided the original case, **when** the appeal of that case is assigned, **then** it cannot be assigned to the same reviewer (BR-SEL-003). | Proposed |
| AC-SEL-003-04-01 | US-SEL-003-04 | **Given** a seller-verification moderation queue is configured in ADM-006 with an assignment rule (round robin among Compliance role members, or by seller type, tier or country), **when** an application is Submitted, **then** SEL submits it through IC-ADM-03 with object type SellerApplication, the seller type and tier; ADM-006 places it in the matching queue and assigns it by the rule; unassigned items stay in the shared queue. | REQ-MPC-FR-319; Proposed (IC-ADM-03; rule types) |

**Business rules applied:** BR-SEL-002; BR-SEL-003; BR-SEL-006 (§8.1).


### 7.4 PRD-SEL-004 Identity and registry verification adapters

| Item | Value |
|---|---|
| Description (baseline) | Uses the identity verification connector to check a seller's ID, tax number, business registration and mobile-money registration against official sources. |
| Why it matters | Reduces fraud by fake sellers. |
| Who benefits | Compliance staff |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-IAM-020 |
| Status | Ready; conditions: ONE-RECORD, C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-004-01 | As a member of compliance staff, I want a seller's identity, tax number, business registration and mobile-money registration checked against official sources through the identity adapter, so that fake sellers are stopped. | D | Ready; conditions: ONE-RECORD, C-SELLER |
| US-SEL-004-02 | As a seller, I want my seller identity linked to my mobile-money verified identity where the provider allows it, so that I can be verified without extra documents. | REQ-MPC-FR-047 | Ready; conditions: ONE-RECORD, C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-004-01-01 | US-SEL-004-01 | **Given** an IAM-020 adapter supports the country and identity type (IC-IAM-02 GetCapabilities), and the tier requires the check, **when** the application reaches Under Review, **then** SEL calls IC-IAM-02 Verify with country, subject type, identity type, identity number and name, and stores the result Verified, NotVerified, Inconclusive or Unavailable with the adapter reference, matched fields and time. | D; Proposed (IC-IAM-02) |
| AC-SEL-004-01-02 | US-SEL-004-01 | **Given** the result is NotVerified, **when** the reviewer opens the application, **then** approval is blocked until a second authorised user records an override reason or the seller corrects the data and the check is re-run (BR-SEL-007). | Proposed |
| AC-SEL-004-01-03 | US-SEL-004-01 | **Given** the adapter returns Unavailable or times out, **when** the check runs, **then** the application stays Under Review with the check marked Unavailable and is retried by the scheduled task; a reviewer may decide manually with a reason. | Proposed |
| AC-SEL-004-02-01 | US-SEL-004-02 | **Given** IC-IAM-02 GetCapabilities reports mobile-money KYC support for the seller's provider, **when** the seller gives the mobile-money number, **then** SEL calls IC-IAM-02 Verify with identity type mobile number; the registered name returned is compared with the seller or owner name and the result is stored as above. | REQ-MPC-FR-047 |
| AC-SEL-004-02-02 | US-SEL-004-02 | **Given** no adapter reports mobile-money KYC support for the provider, **when** the seller gives the number, **then** the check is recorded as NotAvailable and document verification (SEL-002) applies instead. | REQ-MPC-FR-047 ("where feasible") |
| AC-SEL-004-01-04 | US-SEL-004-01 | **Given** the result is Inconclusive, **when** the reviewer opens the application, **then** the check is shown as needing manual review (decision ONE-RECORD); approval is blocked until a user with Marketplace.Core.Applications.Decide records a manual review outcome Confirmed or NotConfirmed with a reason and an evidence reference; Confirmed satisfies the check; NotConfirmed is treated as NotVerified (override rule above). | ONE-RECORD; Proposed (outcome values) |

**Business rules applied:** BR-SEL-007 (§8.1).


### 7.5 PRD-SEL-005 Payout accounts and verification

| Item | Value |
|---|---|
| Description (baseline) | Sellers register the bank or mobile-money account where they will be paid; the account is verified, and any change needs a second person to approve it. |
| Why it matters | Stops payouts being diverted to fraudulent accounts. |
| Who benefits | Sellers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-006 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-005-01 | As a seller, I want to register one or more payout accounts (mobile money and/or bank), so that I am paid where I choose. | D; REQ-MPC-FR-031 | On hold: WF-ENG |
| US-SEL-005-02 | As a member of finance staff, I want each payout account to be verified before it is used, so that payouts go only to accounts the seller controls. | D; FC-M11-009 | On hold: WF-ENG |
| US-SEL-005-03 | As a member of finance staff, I want changes to payout accounts to need approval by a second person, with an audit trail, so that payouts cannot be diverted. | D; REQ-MPC-FR-039 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-005-01-01 | US-SEL-005-01 | **Given** the seller is Approved, **when** the seller adds a mobile-money account (provider, number, account name) or a bank account (bank, branch, account number, account name), **then** the account is saved with status PendingVerification (SM-SEL-04); the account identifier is stored encrypted and shown masked (BR-SEL-008). | REQ-MPC-FR-031 |
| AC-SEL-005-01-02 | US-SEL-005-01 | **Given** the seller has two Verified accounts, **when** the seller marks one as default, **then** settlements are paid to the default account; only one account is default at a time. | REQ-MPC-FR-031; Proposed |
| AC-SEL-005-02-01 | US-SEL-005-02 | **Given** an account is PendingVerification, **when** the configured verification method completes with success (bank account check through INT-008 IC-INT-04 VerifyAccount; mobile-money registered-name check through IC-IAM-02 Verify where GetCapabilities reports mobile-money KYC; or confirmation by finance staff with evidence), **then** the account becomes Verified with the method and time recorded; on failure it becomes Failed with the reason. | D; Proposed (method) |
| AC-SEL-005-02-02 | US-SEL-005-02 | **Given** a bank payout account is PendingVerification and the verification method for bank accounts is bank check, **when** SEL calls IC-INT-04 VerifyAccount (bank, account number, holder name) on the INT-008 bank adapter, **then** Match sets the account Verified and Mismatch sets it Failed, each with the bank reference; NotSupported or Unavailable leaves it PendingVerification and the next configured method (finance confirmation with evidence) applies; INT-008 changes no account state itself. | D; Proposed (IC-INT-04) |
| AC-SEL-005-03-01 | US-SEL-005-03 | **Given** an account is Verified, **when** the seller changes its details, **then** a change record is created, the account becomes ChangePending and SEL submits an approval item to ADM-006 through IC-ADM-03 Submit (object type PayoutAccountChange); payouts continue to the current details until the change is approved; the seller's owner email and phone are notified of the request (Sel.PayoutAccountChangePending.SellerNotification). | REQ-MPC-FR-039 |
| AC-SEL-005-03-02 | US-SEL-005-03 | **Given** a change is ChangePending and verified, **when** a finance user who did not request it approves the ADM-006 item and ADM-006 calls the SEL OnApproved callback (IC-ADM-03), **then** the new details become active and the account Verified; audited with old and new values and the approval item reference (AUD-SEL-003). | REQ-MPC-FR-039 |
| AC-SEL-005-03-03 | US-SEL-005-03 | **Given** a change is ChangePending, **when** the requester or a seller staff user tries to approve it, or the OnApproved callback names the requester as approver, **then** approval is refused with message Sel.SelfApprovalNotAllowed; in the callback SEL keeps the change ChangePending and returns a module error (BR-SEL-007). | REQ-MPC-FR-039 |
| AC-SEL-005-03-04 | US-SEL-005-03 | **Given** a change is ChangePending, **when** finance staff reject the ADM-006 item with a reason (OnRejected callback, IC-ADM-03), **then** the old details stay active, the account returns to Verified, the seller sees the reason; audited (AUD-SEL-003). | REQ-MPC-FR-039 |

**Business rules applied:** BR-SEL-007; BR-SEL-008 (§8.1).


### 7.6 PRD-SEL-006 Seller terms acceptance

| Item | Value |
|---|---|
| Description (baseline) | Sellers must accept the seller agreement before they can start selling. |
| Why it matters | Gives a clear legal basis for the selling relationship. |
| Who benefits | Clients; sellers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: ONE-RECORD, C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-006-01 | As a client, I want sellers to accept the seller agreement before they can be activated, so that we have a clear legal basis for the selling relationship. | D; REQ-MPC-FR-030 | Ready; conditions: ONE-RECORD, C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-006-01-01 | US-SEL-006-01 | **Given** VendorSettings.TermsOfServiceEnabled is on and the topic VendorTermsOfService is published, **when** the applicant submits the apply-for-vendor form without ticking acceptance, **then** the SEL action filter on Nop.Web VendorController.ApplyVendor [POST] refuses the submission with message Sel.TermsRequired; no vendor record is created. | REQ-MPC-FR-030; FIT (native acceptance is checked only by browser script in ApplyVendor.cshtml) |
| AC-SEL-006-01-02 | US-SEL-006-01 | **Given** the applicant ticks acceptance, **when** the form is submitted and the vendor is created, **then** SEL records the acceptance through IC-IAM-05 RecordAcceptance with customer, vendor, policy system name VendorTermsOfService, version (the Effective MKT-008 PolicyVersion read through IC-MKT-03 GetEffectivePolicyVersion), channel and IP address; IAM stores it and writes the audit event (AUD-IAM-012); SEL keeps no acceptance record of its own (decision ONE-RECORD). | REQ-MPC-FR-030; ONE-RECORD |
| AC-SEL-006-01-03 | US-SEL-006-01 | **Given** IC-IAM-05 HasAcceptedCurrent (vendor, VendorTermsOfService) returns false, **when** the reviewer approves (SEL-003) or an administrator sets Active = true, **then** activation is refused (Sel.ApprovalBlocked / Sel.ActivationBlocked) (BR-SEL-002). | REQ-MPC-FR-030 |
| AC-SEL-006-01-04 | US-SEL-006-01 | **Given** a new PolicyVersion of VendorTermsOfService becomes Effective with the MKT-008 flag "re-acceptance required" set, **when** the owner user of an approved seller makes a request in the seller portal, **then** the IAM-016 re-acceptance filter (IC-IAM-05 HasAcceptedCurrent) redirects the owner to the seller terms acceptance page and seller portal pages stay blocked until the owner accepts; the acceptance is recorded through IC-IAM-05 as above. | D (gap: versioned re-acceptance); ONE-RECORD; Proposed (reuses IAM-016) |
| AC-SEL-006-01-05 | US-SEL-006-01 | **Given** a new PolicyVersion of VendorTermsOfService becomes Effective without the re-acceptance flag, **when** seller users use the portal, **then** no prompt is shown; new applicants accept the new version. | Proposed |

**Business rules applied:** BR-SEL-002 (§8.1).


### 7.7 PRD-SEL-007 Marketplace rules and listing eligibility

| Item | Value |
|---|---|
| Description (baseline) | Rules the client sets for what can be sold and by whom, checked before a listing goes live. |
| Why it matters | Keeps the marketplace within the client's policies. |
| Who benefits | Clients |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CAT-002 |
| Status | Ready; conditions: OVR-REG, C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-007-01 | As a client administrator, I want to configure and publish marketplace rules for sellers: prohibited products, listing standards and delivery service levels, so that sellers know what they may sell and how. | D; REQ-MPC-FR-046 | Ready; conditions: OVR-REG, C-SELLER |
| US-SEL-007-02 | As a client, I want listing eligibility rules to be enforced before a product is published, so that the marketplace stays within our policies. | D; REQ-MPC-FR-033 | Ready; conditions: OVR-REG, C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-007-01-01 | US-SEL-007-01 | **Given** the administrator creates SEL rules of the types seller type allowed per category, minimum pictures and tier listing limit, and prohibited categories, items and terms exist in CAT-021 (BR-CAT-011), **when** the rules are saved and published, **then** the SEL rules are versioned (BR-SEL-009) and the rule summary page (topic visible to the Vendors role) shows the published SEL version together with the current CAT-021 prohibited list and the CAT-002 mandatory fields; audited (AUD-SEL-005). | REQ-MPC-FR-046; Proposed (one owner per rule type: prohibited content CAT-021, mandatory fields CAT-002) |
| AC-SEL-007-01-02 | US-SEL-007-01 | **Given** delivery service levels are defined in ORD-011, **when** the rules page is published, **then** it shows the service levels sellers must meet; their measurement is SEL-011. | REQ-MPC-FR-046; see ORD-011 |
| AC-SEL-007-02-01 | US-SEL-007-02 | **Given** a category has the native flag RestrictFromVendors, **when** a seller tries to add a product to it, **then** the native check refuses it (CategoryService.CanVendorAddProductsAsync). | FIT |
| AC-SEL-007-02-02 | US-SEL-007-02 | **Given** VendorSettings.MaximumProductNumber is set, **when** a seller at the limit opens product create, **then** the native admin refuses with the maximum-products message. | FIT (Admin ProductController.Create) |
| AC-SEL-007-02-03 | US-SEL-007-02 | **Given** an active SEL rule is violated by a product (for example the seller type is not allowed in the category, or it has fewer pictures than required), **when** the seller or staff submit the product for review or publishing through any path (admin create or edit, bulk edit, import), **then** the CAT-002 IProductService host (decision OVR-REG) with the CAT-022 lifecycle as publish-gate provider, calls the SEL eligibility provider (IC-SEL-01 CheckEligibility, registered as the IC-CAT-04 publish guard provider) and the listing does not advance; message Sel.ListingNotEligible names each failed rule. | REQ-MPC-FR-033; REQ-MPC-FR-046; OVR-REG |
| AC-SEL-007-02-04 | US-SEL-007-02 | **Given** all SEL rules pass, **when** the product is submitted for publishing, **then** the SEL check returns Pass and CAT-022 continues with its own checks (BR-CAT-002, BR-CAT-011) and approval steps. | REQ-MPC-FR-033 |
| AC-SEL-007-02-05 | US-SEL-007-02 | **Given** a rule is changed so that published products now violate it, **when** the change is published, **then** the products are listed in a violations report for compliance staff; they are not unpublished automatically (Proposed). | Proposed |

**Business rules applied:** BR-SEL-009 (§8.1).


### 7.8 PRD-SEL-008 Seller dashboard and onboarding checklist

| Item | Value |
|---|---|
| Description (baseline) | A seller home page with a step-by-step onboarding checklist, tasks to do, orders and payouts. |
| Why it matters | Sellers get started quickly and know what to do next. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-008-01 | As a seller, I want a home page with an onboarding checklist, my tasks, orders and payouts, so that I know what to do next. | D; REQ-MPC-FR-034 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-008-01-01 | US-SEL-008-01 | **Given** an applicant is not yet Approved, **when** they open the seller application page in My account, **then** the checklist shows each item with done or open: profile complete, terms accepted, each required document Accepted, identity checks passed, payout account Verified; open items link to the page that completes them. | REQ-MPC-FR-034; Proposed (checklist items) |
| AC-SEL-008-01-02 | US-SEL-008-01 | **Given** a seller is Approved, **when** a seller user opens the admin home page, **then** a SEL widget on the vendor dashboard shows the checklist items still open (for example first product published, payout account Verified), required actions (documents ExpiringSoon or ResubmitRequested, payout change rejected, open appeal) and the next payout date and amount (SEL-017). | REQ-MPC-FR-034; FIT (vendors use the admin dashboard scoped to their data) |
| AC-SEL-008-01-03 | US-SEL-008-01 | **Given** every checklist item is done, **when** the dashboard is shown, **then** the checklist shows complete and is collapsed. | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.9 PRD-SEL-009 Seller staff accounts

| Item | Value |
|---|---|
| Description (baseline) | Sellers add their own staff users with limited permissions. |
| Why it matters | Seller businesses can share the work safely. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-009-01 | As a seller, I want to add my own staff users with limited permissions, so that my business can share the work safely. | D; REQ-MPC-FR-038 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-009-01-01 | US-SEL-009-01 | **Given** the administrator has defined seller staff profiles (for example Orders only, Catalogue only), each a subset of native vendor permissions, **when** the seller owner invites a staff user by email and chooses a profile, **then** the user receives an invitation; on acceptance the customer is linked to the seller (Customer.VendorId), added to the Vendors role and to the chosen profile; audited (AUD-SEL-009). | REQ-MPC-FR-038; FIT (Customer.VendorId; native Admin AddCustomerToVendorPopup needs vendor-edit rights the seller does not have) |
| AC-SEL-009-01-02 | US-SEL-009-01 | **Given** a staff user with profile Orders only, **when** opens or posts a product page in the admin area, **then** the SEL global action filter refuses with message Sel.StaffActionDenied; order pages work, scoped to the seller's orders by the native vendor scoping. | REQ-MPC-FR-038; BR-SEL-010 |
| AC-SEL-009-01-03 | US-SEL-009-01 | **Given** a staff user, **when** tries to change payout accounts, staff or terms, **then** refused (Sel.StaffActionDenied) unless the profile allows it. | Proposed |
| AC-SEL-009-01-04 | US-SEL-009-01 | **Given** the seller owner removes a staff user, **when** the removal is saved, **then** Customer.VendorId is cleared, the Vendors role and profile are removed and the user's sessions lose seller access on next request; audited (AUD-SEL-009). | REQ-MPC-FR-038 |
| AC-SEL-009-01-05 | US-SEL-009-01 | **Given** the seller is Suspended, **when** a staff user opens the admin area, **then** the native ValidateVendor filter challenges the user, because the user is in the Vendors role and the vendor is inactive (BR-SEL-010). | FIT (ValidateVendorAttribute) |

**Business rules applied:** BR-SEL-010 (§8.1).


### 7.10 PRD-SEL-010 Seller categorisation

| Item | Value |
|---|---|
| Description (baseline) | Groups sellers into types or tiers, each with its own terms and processes. |
| Why it matters | Different seller groups can be treated appropriately without custom code. |
| Who benefits | Clients |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-010-01 | As a client administrator, I want to group sellers into types and tiers, each with its own terms and processes, so that different seller groups are treated appropriately without custom code. | D; FC-M11-014 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-010-01-01 | US-SEL-010-01 | **Given** seller types (for example manufacturer, distributor, service provider) and sizes are configured, **when** a seller is classified, **then** the seller type is stored as the SEL SellerType (authoritative) and the size as the vendor attribute "seller size" captured under MKT-011 (AC-MKT-011-01-03); the type drives: verification tier (SEL-003), required documents (SEL-002), commission rules (SEL-016), settlement cycle (SEL-017) and terms version (SEL-006). | D; FC-M11-014 |
| AC-SEL-010-01-02 | US-SEL-010-01 | **Given** a seller's type is changed by compliance staff, **when** the change is saved, **then** the new type's rules apply from that time; the change is audited (AUD-SEL-005). | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.11 PRD-SEL-011 Seller performance monitoring

| Item | Value |
|---|---|
| Description (baseline) | Tracks each seller's performance (on-time fulfilment, cancellations, returns, complaints) and triggers warnings or action when thresholds are crossed. |
| Why it matters | Keeps marketplace quality high for buyers. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-011-01 | As a client, I want to see each seller's orders fulfilled, cancellation rate, return rate and complaints, so that marketplace quality stays high. | D; REQ-MPC-FR-037 | Ready; conditions: C-SELLER |
| US-SEL-011-02 | As a client administrator, I want to set thresholds that trigger a warning or action, including for delivery service levels, so that poor sellers are handled consistently. | D; REQ-MPC-FR-037; REQ-MPC-FR-046 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-011-01-01 | US-SEL-011-01 | **Given** orders, shipments, return requests and complaints exist for a seller, **when** the daily KPI task runs, **then** a snapshot per seller and period stores orders fulfilled, cancellation rate, return rate, complaint count and on-time delivery rate, computed from the seller's orders (single-seller orders, CHK-004) and ReturnRequest, with the complaint count read through IC-CRM-05 GetComplaintCounts (vendor, period). | REQ-MPC-FR-037 |
| AC-SEL-011-01-02 | US-SEL-011-01 | **Given** a user with Marketplace.Core.Reports.View, **when** opens the performance view, **then** KPIs per seller and period are listed with filters and export; a seller sees only its own KPIs in the seller portal. | REQ-MPC-FR-037 |
| AC-SEL-011-02-01 | US-SEL-011-02 | **Given** a threshold "return rate above X in period P: action Warn" is configured, **when** a seller crosses it, **then** the seller receives a warning notification and an intervention record is created; audited (AUD-SEL-006). | REQ-MPC-FR-037 |
| AC-SEL-011-02-02 | US-SEL-011-02 | **Given** a threshold with action PauseListings is configured, **when** a seller crosses it, **then** a listing pause with reason PerformanceIntervention is requested (IC-SEL-01) and compliance staff are notified. | REQ-MPC-FR-037; Proposed (action set) |
| AC-SEL-011-02-03 | US-SEL-011-02 | **Given** a threshold with action Suspend is configured, **when** a seller crosses it, **then** a suspension proposal is placed in the compliance queue; the seller is suspended only when compliance staff confirm (BR-SEL-014). | Proposed |
| AC-SEL-011-02-04 | US-SEL-011-02 | **Given** delivery service levels are defined (ORD-011), **when** a seller's on-time delivery rate falls below the configured threshold, **then** the configured action runs as above. | REQ-MPC-FR-046 |

**Business rules applied:** BR-SEL-014 (§8.1).


### 7.12 PRD-SEL-012 Seller ratings

| Item | Value |
|---|---|
| Description (baseline) | Buyers rate sellers after an order; ratings are moderated. |
| Why it matters | Helps buyers choose reliable sellers and motivates good service. |
| Who benefits | Shoppers; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-012-01 | As a buyer, I want to rate the seller and leave feedback after my order is completed, so that other buyers can choose reliable sellers. | D; REQ-MPC-FR-050 | Ready; conditions: C-SELLER |
| US-SEL-012-02 | As a client administrator, I want to moderate seller ratings and act on abuse, so that ratings stay fair. | REQ-MPC-FR-050 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-012-01-01 | US-SEL-012-01 | **Given** an order of seller V has OrderStatus Complete, **when** the buyer of that order opens it in My account, **then** a rate-the-seller form (score and comment) is offered once per order and seller. | REQ-MPC-FR-050; BR-SEL-015 |
| AC-SEL-012-01-02 | US-SEL-012-01 | **Given** the order is not Complete, or the user is not the buyer, or a rating exists for that order and seller, **when** a rating is posted, **then** it is refused with message Sel.RatingNotAllowed. | REQ-MPC-FR-050 |
| AC-SEL-012-02-01 | US-SEL-012-02 | **Given** ratings require approval (setting), **when** a rating is posted, **then** it is Pending and shown only after a moderator publishes it; a rejected rating keeps its reason (SM-SEL-06). | REQ-MPC-FR-050 |
| AC-SEL-012-02-02 | US-SEL-012-02 | **Given** a published rating is reported as abusive by the seller or a user, **when** a moderator upholds the report, **then** the rating becomes Hidden; audited (AUD-SEL-010). | REQ-MPC-FR-050 |
| AC-SEL-012-01-03 | US-SEL-012-01 | **Given** published ratings exist for seller V, **when** the vendor page is shown, **then** the average score and count of published ratings are shown next to the native vendor reviews link (CatalogController.VendorReviews, product reviews of the seller's products). | D; FIT |

**Business rules applied:** BR-SEL-015 (§8.1).


### 7.13 PRD-SEL-013 Block and watch lists

| Item | Value |
|---|---|
| Description (baseline) | Lists of blocked or watched users, internet addresses and devices, with reasons, time limits and history; transactions are checked against them. |
| Why it matters | Stops known fraudsters and abusers. |
| Who benefits | Security and fraud staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-013-01 | As a member of fraud staff, I want to keep lists of blocked, watched and allowed users, sellers, internet addresses and devices with reasons, time limits and history, so that known fraudsters and abusers are stopped. | D; REQ-MPC-FR-323; FC-M02-030 | Ready; conditions: OVR-REG |
| US-SEL-013-02 | As a member of fraud staff, I want transactions and checkouts to be checked against the lists, so that a blocked person cannot buy or sell. | D; REQ-MPC-FR-118 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-013-01-01 | US-SEL-013-01 | **Given** a user has Platform.Core.Lists.CreateEditDelete, **when** they add an entry with subject type (customer, vendor, email, phone, IP address or range, device identifier), list type (Block, Watch, Allow), scope (registration, login, checkout, seller application, all), reason, start and optional end, **then** the entry is Active from its start; every create, change and revoke is audited with old and new values (AUD-SEL-007). | REQ-MPC-FR-323 |
| AC-SEL-013-01-02 | US-SEL-013-01 | **Given** an Active entry has an end date, **when** the end date passes, **then** the entry becomes Expired automatically and no longer applies. | D |
| AC-SEL-013-02-01 | US-SEL-013-02 | **Given** a customer, the customer's email or phone, or the request IP matches an Active Block entry with scope checkout or all, **when** the customer reaches checkout, **then** an account restriction is raised for PAY-018 and checkout is blocked there with message Pay.CheckoutRestricted, which does not state the reason. | REQ-MPC-FR-118; see PAY-018 |
| AC-SEL-013-02-02 | US-SEL-013-02 | **Given** a subject matches an Active Block entry with scope registration or seller application, **when** the registration POST (native CustomerController.Register or the IAM mobile registration) or the apply-for-vendor POST is made, **then** the SEL action filter refuses it with message Sel.Blocked, which does not state the reason; the attempt is logged. | REQ-MPC-FR-118; FC-M02-030 |
| AC-SEL-013-02-03 | US-SEL-013-02 | **Given** a subject matches an Active Block entry with scope login or all, **when** the login POST is made (Nop.Web CustomerController.Login, including a 5.00 login by mobile number and code), **then** the SEL action filter refuses it with message Sel.Blocked before IAM authentication runs; the attempt is logged; IAM services (ICustomerRegistrationService, IAuthenticationService, owner IAM per OVR-REG) are not overridden. | REQ-MPC-FR-118; OVR-REG; Proposed |
| AC-SEL-013-02-04 | US-SEL-013-02 | **Given** a subject matches an Active Watch entry, **when** the subject places an order or applies to sell, **then** the action proceeds and a flag is raised in the review queue with the entry reason. | D |
| AC-SEL-013-01-03 | US-SEL-013-01 | **Given** a subject matches an Active Allow entry, **when** a Watch rule would flag it, **then** no Watch flag is raised (BR-SEL-016). | REQ-MPC-FR-323 (whitelist); Proposed (effect) |
| AC-SEL-013-02-05 | US-SEL-013-02 | **Given** the request IP matches an Active Block entry with scope all, **when** any storefront page is requested, **then** the response is HTTP 403 with message Sel.Blocked. | Proposed |
| AC-SEL-013-02-06 | US-SEL-013-02 | **Given** a mobile number or the request IP matches an Active Block entry with scope login or all, **when** a native 5.00 code-login action is called directly (CustomerController.SendOtp or CommonVerificationOtp), without passing the login POST, **then** the same SEL action filter refuses it with message Sel.Blocked before a code is sent or a sign-in happens; the attempt is logged. | REQ-MPC-FR-118; FIT (Presentation/Nop.Web/Controllers/CustomerController.cs:561, 649: both are public POST actions); Proposed; VER-500 |

**Business rules applied:** BR-SEL-016 (§8.1).


### 7.14 PRD-SEL-014 Approved supplier panels

| Item | Value |
|---|---|
| Description (baseline) | The client approves a set of suppliers for each category; only they are invited to quote for requests in that category. Each approval has a validity period, and suppliers are asked to renew before it expires. |
| Why it matters | Requests for quotation go only to vetted suppliers. |
| Who benefits | Procurement staff; suppliers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-014-01 | As a member of procurement staff, I want to approve a set of suppliers for each category, each approval with a validity period, so that requests for quotation go only to vetted suppliers. | D; FC-M11-016 | Ready |
| US-SEL-014-02 | As a supplier, I want to be asked to renew before my approval expires, so that I stay on the panel. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-014-01-01 | US-SEL-014-01 | **Given** a seller is Approved (SEL-003), **when** procurement staff add it to the panel of category C with a validity end date, **then** the panel membership is Approved (SM-SEL-09); audited (AUD-SEL-005). | D |
| AC-SEL-014-01-02 | US-SEL-014-01 | **Given** a buyer issues a request for quotation in category C and seller quoting exists (ORD-012 / ORD-013), **when** invitations are sent, **then** only Approved, unexpired panel members of C are invited (BR-SEL-019). | D |
| AC-SEL-014-02-01 | US-SEL-014-02 | **Given** a membership is within the configured renewal lead time of its end date, **when** the daily task runs, **then** it becomes RenewalDue and the supplier is notified (Sel.PanelExpiring.SellerNotification). | D |
| AC-SEL-014-02-02 | US-SEL-014-02 | **Given** the end date passes without renewal, **when** the task runs, **then** the membership becomes Expired and the supplier is no longer invited. | D |

**Business rules applied:** BR-SEL-019 (§8.1).


### 7.15 PRD-SEL-015 Bulk participant import and invitation

| Item | Value |
|---|---|
| Description (baseline) | Upload a spreadsheet of customers or sellers and invite them with their details already filled in. Each upload is checked field by field, duplicates are detected, and a result is shown for every row. |
| Why it matters | Brings many participants on board quickly. |
| Who benefits | Client staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-015-01 | As a member of client staff, I want to upload a spreadsheet of customers or sellers and invite them with their details filled in, so that many participants come on board quickly. | D; FC-M11-003; FC-M11-002 | Ready |
| US-SEL-015-02 | As a member of client staff, I want a result for every row, with errors and duplicates, so that I can correct and re-run. | D; FC-M11-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-015-01-01 | US-SEL-015-01 | **Given** a file in the published template is uploaded, **when** the import runs, **then** each row is validated field by field; valid rows create a pending invitation with the given details. | D; FC-M11-003 |
| AC-SEL-015-01-02 | US-SEL-015-01 | **Given** an invitation is created, **when** it is sent by email or SMS (TRK-005), **then** the recipient opens the link, confirms or completes the pre-filled profile, sets a password and, for sellers, lands on the seller application (SEL-001) with the details filled in. | FC-M11-002 |
| AC-SEL-015-02-01 | US-SEL-015-02 | **Given** a row's email or phone matches an existing customer or another row, **when** the import runs, **then** the row is marked Duplicate with message Sel.DuplicateRow and no invitation is created. | D |
| AC-SEL-015-02-02 | US-SEL-015-02 | **Given** the import completes, **when** the user opens the result, **then** every row shows Created, Duplicate or Error with the field and reason, and the result can be downloaded. | D |
| AC-SEL-015-01-03 | US-SEL-015-01 | **Given** an invitation is not accepted before its expiry (setting), **when** the expiry passes, **then** the invitation becomes Expired and can be re-sent. | Proposed |

**Business rules applied:** BR-SEL-020 (§8.1).


### 7.16 PRD-SEL-016 Commission and fee rules

| Item | Value |
|---|---|
| Description (baseline) | The client sets commission and fee rates by category, service or seller type, with dates from which they apply. |
| Why it matters | The marketplace earns revenue correctly and fees change without code changes. |
| Who benefits | Clients; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (on vendor plugin base) |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-016-01 | As a member of finance staff, I want to set commission and fee rates by category, service or listing type, seller type and logistics service, so that the marketplace earns revenue correctly. | D; REQ-MPC-FR-043 | Ready; conditions: C-SELLER |
| US-SEL-016-02 | As a member of finance staff, I want each rule to apply from a set date and to change without code, so that fees change on time. | D; REQ-MPC-FR-303 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-016-01-01 | US-SEL-016-01 | **Given** commission rules exist for category C (percentage) and for logistics service L (fixed fee), **when** an order line in C using L is paid, **then** PAY-010 asks SEL for the rules in force and records commission and logistics fee on the split with the rule version IDs (IC-SEL-02). | REQ-MPC-FR-043; see PAY-010 (REQ-MPC-FR-133) |
| AC-SEL-016-01-02 | US-SEL-016-01 | **Given** a rule for seller V and a rule for category C both match a line, **when** the rule is resolved, **then** the more specific rule applies in the order seller, seller type or tier, listing or service type, category, default (BR-SEL-011). | Proposed |
| AC-SEL-016-01-03 | US-SEL-016-01 | **Given** no rule matches a line, **when** the line is paid, **then** the default rule applies; if no default exists, the split is flagged as an exception for finance staff and no commission is assumed. | Proposed |
| AC-SEL-016-02-01 | US-SEL-016-02 | **Given** a rule version with a future effective date is saved, **when** an order is placed before that date, **then** the previous version applies and the line keeps the version in force at order placement (BR-PAY-070). | REQ-MPC-FR-303 |
| AC-SEL-016-02-02 | US-SEL-016-02 | **Given** a rule is created or changed, **when** it is saved, **then** the change takes effect without a release and is audited with old and new values and effective date (AUD-SEL-005). | REQ-MPC-FR-303 |
| AC-SEL-016-01-04 | US-SEL-016-01 | **Given** a fee type such as a listing fee is configured, **when** the triggering event occurs (for example a product is published), **then** a fee charge is recorded for the seller and deducted in the next settlement (SEL-017). | REQ-MPC-FR-043 ("listing type"); Proposed (fee types) |

**Business rules applied:** BR-SEL-011 (§8.1).


### 7.17 PRD-SEL-017 Seller settlements and payouts

| Item | Value |
|---|---|
| Description (baseline) | Calculates what each seller is owed, produces settlement statements and pays sellers on a regular cycle. |
| Why it matters | Sellers are paid correctly and on time. |
| Who benefits | Sellers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-010, PRD-SEL-005, PRD-PAY-024 |
| Status | On hold: WF-ENG, PAY-DIRECT / LIC-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-017-01 | As a member of finance staff, I want what each seller is owed to be calculated from the payment splits, so that sellers are paid correctly. | D | On hold: WF-ENG, PAY-DIRECT / LIC-01 |
| US-SEL-017-02 | As a member of finance staff, I want settlements to run on payout cycles I configure, daily or weekly, so that sellers are paid on time. | D; REQ-MPC-FR-145 | On hold: WF-ENG, PAY-DIRECT / LIC-01 |
| US-SEL-017-03 | As a seller, I want to view and download my monthly settlement statement, so that I can check what I earned, what was deducted and what was paid. | D; REQ-MPC-FR-042; FC-M13-018 | On hold: WF-ENG, PAY-DIRECT / LIC-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-017-01-01 | US-SEL-017-01 | **Given** PAY-010 split records exist for paid lines of seller V that meet the eligibility event and hold period (settings), **when** the settlement cycle of V closes, **then** a settlement batch is Calculated with: seller shares, minus refund reversals (BR-PAY-051), minus fee charges (SEL-016), minus seller charges supplied through IC-SEL-05 (ORD-004 penalties, FIN-001 repayment deductions, RET merchant-paid return charges), plus or minus adjustments; each split and each charge is included in exactly one batch (BR-SEL-012). | D; see PAY-010 (REQ-MPC-FR-133) |
| AC-SEL-017-01-02 | US-SEL-017-01 | **Given** the net amount of a batch is zero or negative, **when** the batch is calculated, **then** it becomes CarriedForward and the amount is carried to the next batch; no payout is made. | Proposed |
| AC-SEL-017-01-03 | US-SEL-017-01 | **Given** a refund completes after its split was paid out, **when** the next batch is calculated, **then** the reversal is deducted in that batch as an adjustment with the order reference. | Proposed |
| AC-SEL-017-01-04 | US-SEL-017-01 | **Given** an order line is a service line (SVC), **when** the batch is calculated, **then** the line is eligible only when its service stage is Accepted; lines NotDelivered or Failed are excluded (BR-SVC-041). | D; Proposed (depends on SVC stages) |
| AC-SEL-017-01-05 | US-SEL-017-01 | **Given** ORD-004 recorded a SellerPenalty (VendorId, OrderId, RuleId, Amount, Reason) for seller V and passed it through IC-SEL-05 AddSellerCharge with source type Penalty (BR-ORD-031), **when** the batch is calculated, **then** a penalty line with the order and rule reference is deducted and shown on the statement; penalty rules and amounts are ORD settings (not stated in source). | Proposed |
| AC-SEL-017-01-06 | US-SEL-017-01 | **Given** a return of seller V uses a merchant-paid return shipping model (BR-RET-020) and RET supplied the charge through IC-SEL-05, **when** the batch is calculated, **then** the charge is deducted as a seller charge line with the return reference. | Proposed |
| AC-SEL-017-01-07 | US-SEL-017-01 | **Given** a lender has instructed a repayment deduction for seller V (FIN-001), **when** the batch is calculated, **then** a deduction line is added through IC-SEL-05, capped at the lowest of the instructed amount, the outstanding loan balance and the batch net, with the lender and loan reference; it is shown on the statement. | Proposed (BR-FIN-003) |
| AC-SEL-017-01-08 | US-SEL-017-01 | **Given** a payment for an order line of seller V was allocated to a receivable Assigned to a lender (FIN-002) and flagged "assigned — not for seller payout" (BR-PAY-131), **when** the batch is calculated, **then** the related split is not included in any batch of V and is listed for finance staff as excluded with the receivable reference. | Proposed; see FIN-002 (BR-PAY-131) |
| AC-SEL-017-02-01 | US-SEL-017-02 | **Given** seller V has cycle Weekly and seller W has cycle Daily, **when** the settlement task runs, **then** each seller's batch closes on its own cycle; changing a cycle applies from the next period and is audited (AUD-SEL-005). | REQ-MPC-FR-145 |
| AC-SEL-017-02-02 | US-SEL-017-02 | **Given** a batch is Calculated and V has a Verified default payout account, **when** a user with Marketplace.Core.Settlements.Release releases it, **then** a payout is sent through the PAY-024 Payout operation (IC-PAY-01) with idempotency key batch ID + attempt, using the account snapshot taken at release; the batch becomes PayoutSent; audited (AUD-SEL-008). | D; FIT (IC-PAY-01 Payout) |
| AC-SEL-017-02-03 | US-SEL-017-02 | **Given** V has no Verified payout account, **when** release is attempted, **then** release is refused with message Sel.NoVerifiedPayoutAccount and V is notified. | Proposed |
| AC-SEL-017-02-04 | US-SEL-017-02 | **Given** the provider reports success or failure, **when** the payout result arrives, **then** the batch becomes Paid or Failed with the provider reference or reason; a Failed batch can be retried with a new attempt number. | D |
| AC-SEL-017-02-05 | US-SEL-017-02 | **Given** a batch becomes Paid and it holds FIN repayment deduction lines, **when** the status is saved, **then** SEL publishes the event Seller.SettlementPaid (VendorId, SettlementBatchId, PaidOnUtc, Net, deduction lines with source and reference); the FIN consumer only enqueues IC-FIN-01 ReportRepayment. | Proposed |
| AC-SEL-017-03-01 | US-SEL-017-03 | **Given** batches exist for V in a calendar month, **when** V opens or downloads the statement for that month, **then** the statement (PDF generated through DOC-001 IC-DOC-01, and CSV) lists, per order line: earned, commission, fees, tax on commission (PAY-021), refunds, penalties, repayment deductions with lender reference, other seller charges, adjustments, paid out, with batch and payout references, and the closing balance. | REQ-MPC-FR-042; FC-M13-018 |
| AC-SEL-017-03-02 | US-SEL-017-03 | **Given** another seller's statement is requested, **when** the request is made, **then** access is denied. | REQ-MPC-FR-042 |

**Business rules applied:** BR-SEL-012; BR-SEL-013 (§8.1).


### 7.18 PRD-SEL-018 Seller locations and fulfilment opt-in

| Item | Value |
|---|---|
| Description (baseline) | Sellers record their business locations, choose pickup or drop-off options, and can choose to let the client handle delivery for them. |
| Why it matters | Delivery can be organised from the right place. |
| Who benefits | Sellers; logistics staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-018-01 | As a seller, I want to record my business locations and choose pickup or drop-off options for each, so that delivery can be organised from the right place. | D; REQ-MPC-FR-032 | Ready; conditions: C-SELLER |
| US-SEL-018-02 | As a seller, I want to opt in to the client's fulfilment and logistics services where available, so that the client can handle delivery for me. | D; REQ-MPC-FR-044 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-018-01-01 | US-SEL-018-01 | **Given** the seller is Approved, **when** the seller adds a location with a native Address, type (business, pickup point, drop-off) and pickup or drop-off preference, **then** the location is saved for that seller only; it is the pickup origin for LOG-011 seller pickups, and the pickup or drop-off choice is read by LOG-011 (pickup) and LOG-022 (drop-off at an outlet). | REQ-MPC-FR-032 |
| AC-SEL-018-01-02 | US-SEL-018-01 | **Given** a location is used by open shipments, **when** the seller deactivates it, **then** deactivation is refused with message Sel.LocationInUse until the shipments are closed. | Proposed |
| AC-SEL-018-02-01 | US-SEL-018-02 | **Given** the client has marked a fulfilment service available for the seller's location area, **when** the seller opts in, **then** the opt-in is recorded with date and service and LOG-008 treats the seller's order lines as client-fulfilled unless the product overrides it (BR-LOG-060). | REQ-MPC-FR-044 |
| AC-SEL-018-02-02 | US-SEL-018-02 | **Given** no service is available for the seller's locations, **when** the seller opens the opt-in page, **then** no service is offered and message Sel.FulfilmentNotAvailable is shown. | REQ-MPC-FR-044 ("where available") |

**Business rules applied:** BR-SEL-024 (§8.1).


### 7.19 PRD-SEL-019 Seller vacation mode

| Item | Value |
|---|---|
| Description (baseline) | Sellers can temporarily pause their listings with a message, for example during holidays. |
| Why it matters | Avoids orders the seller cannot fulfil. |
| Who benefits | Sellers; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-019-01 | As a seller, I want to pause my listings for a period with a message to customers, so that I do not get orders I cannot fulfil. | D; REQ-MPC-FR-049 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-019-01-01 | US-SEL-019-01 | **Given** the seller schedules vacation with start, end and a localized message, **when** the start time is reached, **then** the vacation becomes Active and SEL requests a listing pause with reason Vacation (IC-SEL-01); Vendor.Active is not changed, so seller users keep portal access. | REQ-MPC-FR-049; FIT (inactive vendors are challenged in admin by ValidateVendor) |
| AC-SEL-019-01-02 | US-SEL-019-01 | **Given** vacation is Active, **when** a customer opens the seller's vendor page, **then** a notice (Sel.VacationNotice) with the seller's message and the end date is shown in widget zone vendordetails_top. | REQ-MPC-FR-049 |
| AC-SEL-019-01-03 | US-SEL-019-01 | **Given** vacation is Active and CatalogSettings.AllowViewUnpublishedProductPage is on, **when** a customer opens a paused product page, **then** the same notice is shown in widget zone productdetails_top; with the setting off the page returns not found (native). | REQ-MPC-FR-049; FIT (ProductController.ProductDetails) |
| AC-SEL-019-01-04 | US-SEL-019-01 | **Given** a customer has a paused product in the cart, **when** the cart is shown, **then** the native unpublished-product warning applies and the item cannot be checked out. | FIT (ShoppingCartService warnings on !Published) |
| AC-SEL-019-01-05 | US-SEL-019-01 | **Given** the end time is reached or the seller ends vacation early, **when** the vacation task runs, **then** the vacation becomes Ended and the Vacation pause reason is cleared; listings resume only if no other reason remains (BR-SEL-005). | REQ-MPC-FR-049; BR-SEL-005 |

**Business rules applied:** BR-SEL-005; BR-SEL-018 (§8.1).


### 7.20 PRD-SEL-020 Seller notifications

| Item | Value |
|---|---|
| Description (baseline) | Sellers receive notifications about their verification, new orders and complaints on the channels the client has set up. |
| Why it matters | Sellers react quickly. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: MSG-ROUTE, C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-020-01 | As a seller, I want notifications about verification issues, new and changed orders and complaints on the channels the client has set up, so that I react quickly. | D; REQ-MPC-FR-045 | Ready; conditions: MSG-ROUTE, C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-020-01-01 | US-SEL-020-01 | **Given** the native vendor templates OrderPlaced.VendorNotification, OrderPaid.VendorNotification, OrderCancelled.VendorNotification and QuantityBelow.VendorNotification are active, **when** an order event occurs, **then** the seller receives the email (native) and, where TRK-005 maps the event to further channels, the SMS or app message, in the seller's language. | REQ-MPC-FR-045; FIT |
| AC-SEL-020-01-02 | US-SEL-020-01 | **Given** a verification event occurs (application decision, document ResubmitRequested, Rejected, ExpiringSoon or Expired, payout account change decision), **when** the event is raised, **then** SEL calls IC-TRK-04 SendEvent with the SEL event code it registered at installation (IC-TRK-04 RegisterEventCode; BR-TRK-023) and TRK-005 notifies the seller on the configured channels with the required action and a link, applying the TRK-006 preferences and opt-outs. | REQ-MPC-FR-045; MSG-ROUTE |
| AC-SEL-020-01-03 | US-SEL-020-01 | **Given** a complaint against the seller is registered (CRM-004), **when** CRM publishes the event Complaint.Created (ticket, seller, category), **then** the SEL consumer only enqueues the seller notification with the complaint reference and the response due date; the job sends it through IC-TRK-04 SendEvent (TRK-005). | REQ-MPC-FR-045 |
| AC-SEL-020-01-04 | US-SEL-020-01 | **Given** a channel fails, **when** the gateway reports failure, **then** the TRK-005 fallback applies and the failure is logged. | Proposed |

**Business rules applied:** BR-SEL-022 (§8.1).


### 7.21 PRD-SEL-021 Seller onboarding funnel report

| Item | Value |
|---|---|
| Description (baseline) | A report showing how many sellers registered, submitted, were approved or rejected, and how long each step took. |
| Why it matters | Shows where seller onboarding gets stuck. |
| Who benefits | Client management |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-021-01 | As a member of client management, I want a report of sellers registered, submitted, approved and rejected, and how long each step took, so that I see where onboarding gets stuck. | D; REQ-MPC-FR-048 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-021-01-01 | US-SEL-021-01 | **Given** application history exists (SM-SEL-01 transitions with times), **when** the funnel report runs for a period, **then** it shows counts for registered, submitted, approved and rejected, and the median and maximum time from submitted to decision and between each step, filterable by seller type and tier, with export. | REQ-MPC-FR-048 |
| AC-SEL-021-01-02 | US-SEL-021-01 | **Given** the report is run, **when** "registered" is counted, **then** registered = customers who started a seller registration through the seller sign-up entry (Proposed definition); submitted = applications created (SEL-001). | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.22 PRD-SEL-022 Seller diversity tracking

| Item | Value |
|---|---|
| Description (baseline) | Records seller characteristics such as women-owned or youth-owned business and reports their share. |
| Why it matters | Supports inclusion targets in development programmes. |
| Who benefits | Clients; programme funders |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-022-01 | As a client, I want to record seller characteristics such as women-owned or youth-owned business and report their share, so that we can show inclusion results to programme funders. | D; FC-M11-018 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-022-01-01 | US-SEL-022-01 | **Given** characteristics are configured as vendor attributes (checkbox or dropdown), **when** sellers declare them at application or in their profile, **then** the values are stored with the vendor (native) and are visible to compliance staff. | D; FIT (VendorAttribute) |
| AC-SEL-022-01-02 | US-SEL-022-01 | **Given** values exist, **when** the diversity report runs for a period, **then** it shows the share of approved sellers, of active listings and of sales value per characteristic. | D; FC-M11-018 |

**Business rules applied:** BR-SEL-023 (§8.1).


### 7.23 PRD-SEL-023 Seller training content

| Item | Value |
|---|---|
| Description (baseline) | Help pages, templates and guides for sellers. |
| Why it matters | Sellers learn to use the platform without one-to-one training. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-023-01 | As a seller, I want help pages, templates and guides for listing products in the platform, so that I learn to use it without one-to-one training. | D; REQ-MPC-FR-035 | Ready; conditions: C-SELLER |
| US-SEL-023-02 | As a client administrator, I want to configure onboarding content and training materials for sellers, so that new sellers get started quickly. | REQ-MPC-FR-325 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-023-01-01 | US-SEL-023-01 | **Given** training topics are published with ACL limited to the Vendors role (Topic.SubjectToAcl), **when** a seller user opens the seller help page, **then** the topics and their downloadable templates are listed; customers outside the Vendors role cannot open them. | REQ-MPC-FR-035; FIT (Topic IAclSupported) |
| AC-SEL-023-02-01 | US-SEL-023-02 | **Given** onboarding topics are published for applicants (ACL Registered), **when** an applicant opens the seller application page, **then** links to the onboarding content are shown next to the checklist (SEL-008). | REQ-MPC-FR-325 |
| AC-SEL-023-02-02 | US-SEL-023-02 | **Given** a topic is changed, **when** it is saved, **then** the change follows MKT-008 approval when that is enabled for the topic. | see MKT-008 (REQ-MPC-FR-313) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.24 PRD-SEL-024 Seller blacklisting

| Item | Value |
|---|---|
| Description (baseline) | A blocked list and watch list specifically for sellers and suppliers with a history of fraud or abuse. Each entry has a period and an appeal route, and is applied automatically to all transactions. |
| Why it matters | Keeps bad sellers off the marketplace. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEL-013 |
| Status | Ready; conditions: C-SELLER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-024-01 | As a client, I want a blocked list and a watch list for sellers and suppliers with a history of fraud or abuse, each entry with a period and an appeal route, so that bad sellers are kept off the marketplace. | D; REQ-MPC-FR-041; FC-M11-017 | Ready; conditions: C-SELLER |
| US-SEL-024-02 | As a seller, I want to appeal a blacklisting, so that a wrong decision can be corrected. | D; FC-M11-017 | Ready; conditions: C-SELLER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-024-01-01 | US-SEL-024-01 | **Given** compliance staff blacklist seller V with reason and period (SEL-013 entry, subject vendor, list Block), **when** the entry becomes Active, **then** V is Suspended (SM-SEL-01), listings are paused with reason SellerBlacklisted (IC-SEL-01), and the identifiers of V (owner and staff email and phone, registration number, payout account identifiers) are added as linked Block entries (BR-SEL-017); audited (AUD-SEL-007). | REQ-MPC-FR-041; FC-M11-017 |
| AC-SEL-024-01-02 | US-SEL-024-01 | **Given** a linked identifier of a blacklisted seller, **when** is used in a new seller application, **then** the application is refused at submission with message Sel.Blocked. | REQ-MPC-FR-041; FC-M11-017 |
| AC-SEL-024-01-03 | US-SEL-024-01 | **Given** compliance staff add V to the watch list, **when** V lists products or receives orders, **then** actions proceed and each is flagged for review. | REQ-MPC-FR-041 |
| AC-SEL-024-02-01 | US-SEL-024-02 | **Given** V is blacklisted, **when** V submits an appeal from the seller account page (storefront, because admin access is suspended), **then** an appeal is Open (SM-SEL-08) for a reviewer who did not create the entry; Upheld revokes the entry and reinstates V; Dismissed keeps it; V is told the outcome. | FC-M11-017 |
| AC-SEL-024-01-04 | US-SEL-024-01 | **Given** the blacklist period ends, **when** the list task runs, **then** the entry becomes Expired; V stays Suspended until compliance staff reinstate it (Proposed). | FC-M11-017; Proposed |

**Business rules applied:** BR-SEL-016; BR-SEL-017 (§8.1).


### 7.25 PRD-SEL-025 Commission invoicing to sellers

| Item | Value |
|---|---|
| Description (baseline) | When buyers pay sellers directly, the client cannot deduct its commission and fees from the payment, so the platform issues each seller a regular invoice for commission and fees (as a fiscal invoice where electronic invoicing applies), records it in accounts receivable with statements and payment tracking, and can restrict sellers with overdue amounts. |
| Why it matters | The client still earns its commission under the direct-payment model. |
| Who benefits | Clients; finance staff; sellers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEL-016, PRD-PAY-033, PRD-PAY-021, PRD-PAY-025 |
| Status | On hold: PH-INF, PO-REC-v8, PAY-DIRECT / LIC-01, E-INV, PAID-STUB, DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEL-025-01 | As a member of finance staff, I want each seller paid directly by buyers to receive a regular invoice for our commission and fees, so that we still earn our commission under direct payment. | D | On hold: PH-INF, PO-REC-v8, PAY-DIRECT / LIC-01, E-INV, PAID-STUB, DOC-LIB |
| US-SEL-025-02 | As a member of finance staff, I want commission invoices recorded in accounts receivable with statements and payment tracking, and sellers with overdue amounts restricted, so that we get paid. | D | On hold: PH-INF, PO-REC-v8, PAY-DIRECT / LIC-01, E-INV, PAID-STUB, DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEL-025-01-01 | US-SEL-025-01 | **Given** an order of seller V was paid by direct payment (PAY-035), **when** the payment is recorded, **then** a commission accrual per line is recorded with the SEL-016 rule versions in force at order placement; no PAY-010 split exists for the order (BR-PAY-150). | D |
| AC-SEL-025-01-02 | US-SEL-025-01 | **Given** accruals exist for V in the closed invoicing period (setting), **when** the invoicing task runs, **then** a commission invoice is Issued to V with lines per order, commission, fees and tax on them (PAY-021); it is posted as a receivable in PAY-033 (IC-SEL-03); V can download it in the seller portal. | D |
| AC-SEL-025-01-03 | US-SEL-025-01 | **Given** e-invoicing applies (E-INV), **when** the invoice is issued, **then** it is submitted through PAY-025 as a fiscal document and becomes FiscalAccepted on acceptance. | D; E-INV |
| AC-SEL-025-02-01 | US-SEL-025-02 | **Given** an invoice is unpaid past its due date plus the configured grace days, **when** the daily task runs, **then** the invoice becomes Overdue, V is notified and, if the client setting is on, a listing pause with reason CommissionOverdue is requested (IC-SEL-01). | D |
| AC-SEL-025-02-02 | US-SEL-025-02 | **Given** V pays and PAY-033 allocates the payment, **when** allocation is recorded, **then** the invoice becomes PartlyPaid or Paid and the CommissionOverdue reason is cleared when nothing is overdue. | D |
| AC-SEL-025-01-04 | US-SEL-025-01 | **Given** a direct-paid line is refunded before invoicing, **when** the period closes, **then** the accrual is reduced in proportion (BR-PAY-051). | Proposed |

**Business rules applied:** BR-SEL-021 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-SEL-001 | The Marketplace pack (SEL features except SEL-013) is installed for a client, and VendorSettings.AllowCustomersToApplyForVendorAccount switched on, only after the client confirms a marketplace seller model (KG-01 KTDA, MG-02 Malawi Post). | SEL-001 and all Marketplace pack features | KG-01; MG-02; C-SELLER; D |
| BR-SEL-002 | A vendor becomes active only through SEL approval: Vendor.Active is set to true only by the SEL-003 Approved transition (all required documents Accepted, current seller terms accepted, list check passed). A SEL action filter on Admin VendorController.Create and Edit [POST] refuses Active = true otherwise (message Sel.ActivationBlocked). Vendors created in admin get an application record Under Review. A vendor with Active = false and no application record is treated as Submitted. The same filter refuses Active = false on Edit and refuses Delete [POST] for a vendor whose application is Approved (message Sel.UseSuspension): an approved seller leaves the marketplace only by suspension or blacklisting, which pause its listings. Current terms acceptance is read through IC-IAM-05 HasAcceptedCurrent. | SEL-001, SEL-003, SEL-006 | REQ-MPC-FR-028; REQ-MPC-FR-030; FIT (Admin VendorController.Edit/Create take VendorModel; Delete soft-deletes without unpublishing products); ONE-RECORD; Proposed |
| BR-SEL-003 | Segregation of duties in verification: an appeal is not decided by the reviewer who made the decision appealed; a reviewer cannot decide an application of a seller to which the reviewer's customer account is linked. | SEL-003, SEL-024 | Proposed |
| BR-SEL-004 | Required profile fields are native required vendor attributes (supported controls: drop-down, radio, checkboxes, text box, multiline; file upload and date picker are excluded natively); required documents are SEL document types per seller type and tier. | SEL-002 | REQ-MPC-FR-036; FIT (VendorAttribute admin view excludes FileUpload, Datepicker, ColorSquares, ImageSquares) |
| BR-SEL-005 | SEL never sets Product.Published. It is a provider to the CAT-002 IProductService override (decision OVR-REG) and requests pause and resume of a seller's listings from the CAT-022 lifecycle service (IC-CAT-03 PauseListings / ResumeListings for the vendor, BR-CAT-030) with a reason code (Vacation, SellerSuspended, SellerBlacklisted, DocumentExpired, CommissionOverdue, PerformanceIntervention). A listing resumes only when no pause reason remains. While any reason remains, every publish path (admin create and edit, bulk edit, import, and native low-stock republish in ProductService.ApplyLowStockActivityAsync) must keep the product unpublished. | SEL-002, SEL-011, SEL-019, SEL-024, SEL-025 | FIT (ProductService.UpdateProductAsync is the common path; low-stock activity sets Published); Proposed |
| BR-SEL-006 | Suspension sets Vendor.Active = false and pauses listings with reason SellerSuspended. Both are needed: Vendor.Active = false challenges seller users in admin (ValidateVendor) and hides the vendor page, but ProductService.SearchProductsAsync does not filter products by vendor status. In 5.00 the AI-provider and search-provider results are joined to the same published, ACL and store query, so a paused (unpublished) listing stays hidden on every search path. | SEL-003 | FIT (ValidateVendorAttribute; CatalogController.Vendor; ProductService.SearchProductsAsync, Libraries/Nop.Services/Catalog/ProductService.cs:822, 898-910) |
| BR-SEL-007 | Maker-checker: a payout account change and an override of a NotVerified identity check (or of a manual review outcome NotConfirmed; an Inconclusive result goes to manual review first, decision ONE-RECORD) take effect only after approval by an authorised user who is not the requester and not linked to the seller. Payout account changes are approved in ADM-006 (IC-ADM-03); SEL re-checks the rule in the OnApproved callback. Payouts use only Verified accounts. | SEL-004, SEL-005 | REQ-MPC-FR-039; Proposed |
| BR-SEL-008 | Payout account identifiers and KYC identifiers are stored encrypted and shown masked except to users with the approving permission; they are never exported in configuration packs. | SEL-002, SEL-005 | REQ-MPC-FR-027; NFR-X-001; CFG-01 |
| BR-SEL-009 | Marketplace rules are versioned; each publish creates a new version shown on the rule summary page; listing eligibility is checked against the current version at publish. A product passes only if every active rule passes, and the native checks (Category.RestrictFromVendors, VendorSettings.MaximumProductNumber) also apply. | SEL-007 | REQ-MPC-FR-033; REQ-MPC-FR-046; FIT |
| BR-SEL-010 | Seller staff users have Customer.VendorId of the seller and are in the native Vendors role, so the native ValidateVendor filter challenges them when the vendor is inactive. Per-user limits come from a staff profile and are enforced by a SEL global action filter on admin and seller-portal actions. Native fact: all customers linked to a vendor otherwise share the same vendor rights. A staff user is never given a non-Vendors role with admin access, because GetCurrentVendorAsync returns null for an inactive vendor and the user would then see unscoped data. | SEL-009 | REQ-MPC-FR-038; FIT (WebWorkContext.GetCurrentVendorAsync; ValidateVendorAttribute) |
| BR-SEL-011 | Commission and fee rule resolution: the most specific matching rule applies (seller, seller type or tier, listing or service type, category, default); rules are versioned with an effective date and an order line keeps the versions in force at order placement. | SEL-016, SEL-025 | REQ-MPC-FR-043; REQ-MPC-FR-303; Proposed (precedence) |
| BR-SEL-012 | Settlement amount = sum of seller shares of eligible PAY-010 splits, minus refund reversals, minus fee charges (SEL-016), minus seller charges supplied through IC-SEL-05 (ORD-004 SellerPenalty, FIN-001 repayment deduction capped at the lowest of the instructed amount (for basis Share: the instructed share of the batch net, computed by SEL-017 when the batch is calculated; Proposed), the outstanding balance and the batch net, RET merchant-paid return charge or seller-fault remedy), plus or minus adjustments. Service lines are eligible only when Accepted (BR-SVC-041). Splits whose payment was allocated to a receivable Assigned to a lender (BR-PAY-131) are excluded. Each split and each charge is included in exactly one batch. A zero or negative net is carried forward. | SEL-017 | D; Proposed; ORD, FIN, RET and SVC |
| BR-SEL-013 | A payout is sent only for a released batch, to the Verified default payout account snapshot taken at release, through IC-PAY-01 Payout with idempotency key batch ID + attempt number. | SEL-017 | D; FIT (IC-PAY-01) |
| BR-SEL-014 | KPI thresholds have a KPI, comparator, value, period and action (Warn, PauseListings, Suspend). Suspend only proposes; compliance staff confirm. | SEL-011 | REQ-MPC-FR-037; Proposed (actions) |
| BR-SEL-015 | A seller rating can be given only by the buyer of the order, once per order and seller, after OrderStatus Complete; moderation follows the approval setting. | SEL-012 | REQ-MPC-FR-050 |
| BR-SEL-016 | List types: Block prevents the actions in its scope; Watch raises a review flag without blocking; Allow suppresses Watch flags for the subject (Proposed). Entries have start and optional end, expire automatically, and every change is audited. Block messages do not state the reason. | SEL-013, SEL-024 | REQ-MPC-FR-323; FC-M02-030; Proposed (Allow effect) |
| BR-SEL-017 | Blacklisting a seller suspends it, pauses its listings and adds its identifiers (owner and staff email and phone, registration number, payout account identifiers) as linked Block entries with the same period. | SEL-024 | REQ-MPC-FR-041; FC-M11-017 |
| BR-SEL-018 | Vacation pauses listings with reason Vacation and does not change Vendor.Active; the notice is shown on the vendor page and, where unpublished product pages are viewable, on product pages. | SEL-019 | REQ-MPC-FR-049; FIT |
| BR-SEL-019 | Only Approved, unexpired panel members of a category are invited to quote for requests in that category. | SEL-014 | FC-M11-016 |
| BR-SEL-020 | Import rows are validated field by field; a row whose email or phone matches an existing customer or another row is a duplicate and creates no invitation. | SEL-015 | FC-M11-003; Proposed (keys) |
| BR-SEL-021 | For orders paid by direct payment, commission and fees accrue per line at the rule versions in force at order placement and are invoiced per seller per period; invoices are receivables in PAY-033 and fiscal documents through PAY-025 where E-INV applies. | SEL-025 | D |
| BR-SEL-022 | Seller notifications use the native vendor templates for order events (sent through the TRK-005 IWorkflowMessageService override) and TRK-005 for every other event and channel: SEL registers its event codes at installation through IC-TRK-04 RegisterEventCode (names Proposed, listed in BR-TRK-023: Sel.ApplicationApproved.SellerNotification, Sel.ApplicationRejected.SellerNotification, Sel.DocumentExpiring.SellerNotification, Sel.PayoutAccountChangePending.SellerNotification, Sel.PanelExpiring.SellerNotification, Sel.Core.VerificationDecided, Sel.Core.DocumentResubmissionRequested, Sel.Core.DocumentRejected, Sel.Core.DocumentExpired, Sel.Core.PayoutAccountChangeDecided, Sel.Core.SettlementPaid, Sel.Core.SettlementFailed, Sel.Core.CommissionInvoiceIssued, Sel.Core.CommissionInvoiceOverdue, Sel.Core.KpiWarning, Sel.Core.AppealDecided, Sel.Core.ComplaintRegistered, Sel.Core.Invitation) and sends through IC-TRK-04 SendEvent. SEL sends no message itself; TRK-006 preferences and opt-outs apply (MSG-ROUTE). | SEL-002, SEL-003, SEL-005, SEL-009, SEL-011, SEL-014, SEL-015, SEL-017, SEL-020, SEL-024, SEL-025 | REQ-MPC-FR-045; FIT; MSG-ROUTE; BR-TRK-023 |
| BR-SEL-023 | Diversity characteristics are vendor attributes declared by the seller; reports show shares, never individual values, to users without Marketplace.Core.Applications.View. | SEL-022 | Proposed |
| BR-SEL-024 | A fulfilment service is offered for opt-in only where the client marks it available for the seller's location area. | SEL-018 | REQ-MPC-FR-044 |
| BR-SEL-025 | SEL plugins (Marketplace pack and the Platform core part holding SEL-013): (a) check feature state through IC-PLT-02 IsEnabled (setting productfeature.<prd-id>, store then shared) before showing a page or widget or running a scheduled task for a store; (b) list every new setting key in the plugin key catalogue with key, type, layer, secret flag and default; no SEL setting holds a credential, and payout and KYC identifiers are data, never settings (BR-SEL-008); (c) list every SEL action filter and provider registration in the ADM extension register (BR-ADM-001); SEL registers no DI override of a native service (decision OVR-REG). | SEL-001 and all SEL features | Proposed; OVR-REG; NFR-X-008 |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-SEL-01 | SellerApplication | (none) | apply-for-vendor submitted (or vendor created in admin) | BR-SEL-016 block check passed | Submitted (admin-created: Under Review) | vendor Active = false; store owner notified (native) |
| SM-SEL-01 | SellerApplication | Submitted | ADM-006 assigns the queue item to a reviewer (IC-ADM-03) | — | Under Review | assigned reviewer recorded |
| SM-SEL-01 | SellerApplication | Under Review | approve (OnApproved callback) | required documents Accepted; current terms accepted (IC-IAM-05); identity checks Verified, manual review Confirmed, or overridden (BR-SEL-007); no Block entry | Approved | Vendor.Active = true; Vendors role added; seller notified; AUD-SEL-001 |
| SM-SEL-01 | SellerApplication | Under Review | reject with reason (OnRejected callback) | reason given | Rejected | seller notified; AUD-SEL-001 |
| SM-SEL-01 | SellerApplication | Rejected | applicant resubmits (Proposed) | not blocked | Submitted | history kept |
| SM-SEL-01 | SellerApplication | Approved | suspend with reason (manual, confirmed KPI proposal or blacklisting) | reason given | Suspended | Vendor.Active = false; pause reason SellerSuspended; AUD-SEL-001 |
| SM-SEL-01 | SellerApplication | Suspended | reinstate (manual or appeal Upheld) | no Active Block entry for the vendor | Approved | Vendor.Active = true; SellerSuspended reason cleared |
| SM-SEL-02 | VerificationRequest | (none) | seller requests upgrade or appeals | — | Open | placed in compliance queue |
| SM-SEL-02 | VerificationRequest | Open | reviewer starts | not the reviewer of the original decision (BR-SEL-003) | Under Review | — |
| SM-SEL-02 | VerificationRequest | Under Review | decide | reason given | Granted / Declined | tier change or reinstatement on Granted; seller notified |
| SM-SEL-03 | SellerDocument | (none) | upload | — | Uploaded | file stored (DOC-002 or native Download) |
| SM-SEL-03 | SellerDocument | Uploaded | review | reason for the last two | Accepted / ResubmitRequested / Rejected | seller notified; AUD-SEL-002 |
| SM-SEL-03 | SellerDocument | ResubmitRequested | seller uploads new version | — | Superseded | new version created as Uploaded |
| SM-SEL-03 | SellerDocument | Accepted | expiry within alert lead time (task) | — | ExpiringSoon | seller and compliance notified |
| SM-SEL-03 | SellerDocument | Accepted / ExpiringSoon | expiry date passed, no accepted renewal (task) | — | Expired | pause reason DocumentExpired if setting on |
| SM-SEL-03 | SellerDocument | Accepted / ExpiringSoon / Expired | renewal version Accepted | — | Superseded | DocumentExpired reason cleared if no other expired document |
| SM-SEL-04 | SellerPayoutAccount | (none) | seller adds account | seller Approved | PendingVerification | identifier encrypted |
| SM-SEL-04 | SellerPayoutAccount | PendingVerification | verification result | — | Verified / Failed | method and time recorded |
| SM-SEL-04 | SellerPayoutAccount | Verified | seller requests change | — | ChangePending | change record; ADM-006 item submitted (IC-ADM-03); seller owner notified |
| SM-SEL-04 | SellerPayoutAccount | ChangePending | approve (OnApproved callback; new details verified) | approver is not requester (BR-SEL-007) | Verified | new details active; AUD-SEL-003 |
| SM-SEL-04 | SellerPayoutAccount | ChangePending | reject with reason (OnRejected callback) | — | Verified | old details stay; AUD-SEL-003 |
| SM-SEL-04 | SellerPayoutAccount | Verified / Failed | seller removes account | not default of an unreleased batch | Inactive | — |
| SM-SEL-05 | SettlementBatch | (none) | cycle opens | — | Open | splits and charges accumulate |
| SM-SEL-05 | SettlementBatch | Open | cycle closes (task) | — | Calculated / CarriedForward | net computed (BR-SEL-012) |
| SM-SEL-05 | SettlementBatch | Calculated | release | Marketplace.Core.Settlements.Release; Verified default account | PayoutSent | IC-PAY-01 Payout; account snapshot; AUD-SEL-008 |
| SM-SEL-05 | SettlementBatch | PayoutSent | provider result | — | Paid / Failed | provider reference or reason stored; seller notified; on Paid: event Seller.SettlementPaid |
| SM-SEL-05 | SettlementBatch | Failed | retry | — | PayoutSent | new attempt number |
| SM-SEL-06 | SellerRating | (none) | buyer posts rating | BR-SEL-015 | Pending (approval on) / Published (approval off) | — |
| SM-SEL-06 | SellerRating | Pending | moderate | — | Published / Rejected | AUD-SEL-010 |
| SM-SEL-06 | SellerRating | Published | abuse report upheld | — | Hidden | AUD-SEL-010 |
| SM-SEL-07 | ListEntry | (none) | entry created | — | Active (from start date) | AUD-SEL-007 |
| SM-SEL-07 | ListEntry | Active | end date passed (task) | — | Expired | — |
| SM-SEL-07 | ListEntry | Active | revoke (manual or appeal Upheld) | reason given | Revoked | AUD-SEL-007 |
| SM-SEL-08 | ListAppeal | (none) | subject appeals | entry Active | Open | — |
| SM-SEL-08 | ListAppeal | Open | decide | reviewer did not create the entry | Upheld / Dismissed | Upheld: entry Revoked, seller reinstated; subject notified |
| SM-SEL-09 | PanelMembership | (none) | procurement approves supplier for category | seller Approved | Approved | AUD-SEL-005 |
| SM-SEL-09 | PanelMembership | Approved | renewal lead time reached (task) | — | RenewalDue | supplier notified |
| SM-SEL-09 | PanelMembership | RenewalDue | renewed | — | Approved | new end date |
| SM-SEL-09 | PanelMembership | Approved / RenewalDue | end date passed (task) | — | Expired | no longer invited |
| SM-SEL-10 | SellerVacation | (none) | seller schedules | — | Scheduled | — |
| SM-SEL-10 | SellerVacation | Scheduled | start time reached (task) | — | Active | pause reason Vacation |
| SM-SEL-10 | SellerVacation | Active / Scheduled | end time reached or seller ends | — | Ended | Vacation reason cleared |
| SM-SEL-11 | CommissionInvoice | (none) | invoicing period closes (task) | accruals exist | Issued | receivable posted (PAY-033); fiscal submission queued where E-INV applies |
| SM-SEL-11 | CommissionInvoice | Issued | authority accepts (PAY-025) | E-INV applies | FiscalAccepted | fiscal number stored |
| SM-SEL-11 | CommissionInvoice | Issued / FiscalAccepted | due date + grace passed unpaid (task) | — | Overdue | seller notified; pause reason CommissionOverdue if setting on |
| SM-SEL-11 | CommissionInvoice | Issued / FiscalAccepted / Overdue / PartlyPaid | payment allocated (PAY-033) | — | PartlyPaid / Paid | CommissionOverdue cleared when nothing is overdue |
| SM-SEL-12 | StaffInvitation / ImportInvitation | (none) | invitation sent | — | Sent | — |
| SM-SEL-12 | StaffInvitation / ImportInvitation | Sent | accepted / expiry passed | — | Accepted / Expired | Accepted: account linked; Expired: can be re-sent (new Sent) |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| SellerApplication / SellerApplicationHistory (new) | VendorId, CustomerId, Status (SM-SEL-01), SellerTypeId, TierId, AssignedTo, SubmittedOnUtc, DecidedOnUtc, DecidedBy, Reason, RowVersion; history: from, to, by, at, reason | SEL-001, SEL-003, SEL-021 | Vendor (native) stays the seller master; Vendor.Active is set only by SEL (BR-SEL-002) |
| SellerTier / SellerType (new) | Name, RequiredDocumentTypeIds, RequiredChecks, Limits (listing count, others), CommissionScheme reference, SettlementCycle, TermsTopicId | SEL-003, SEL-010 | Vendor attributes (native) may carry self-declared type; SEL type is authoritative |
| VerificationRequest (new) | VendorId, Type (Upgrade / Appeal), TargetTierId, Statement, DownloadIds, Status (SM-SEL-02), DecidedBy, Reason | SEL-003 | |
| SellerDocumentType / SellerDocument (new) | Type: Name, HasExpiry, AlertLeadDays, RequiredFor (types, tiers), DocRequirementSetId (DOC-005, when available); Document: VendorId, TypeId, DocumentRecordId and DocumentVersionId (DOC-002, stored through IC-DOC-03), IssuedOn, ExpiresOn, Status (SM-SEL-03), ReviewedBy, Reason | SEL-002 | Native vendor attributes exclude file upload; the file is a native Download held by DOC-002 (IC-DOC-03) |
| IdentityCheckResult (new) | VendorId, IdentityType, Country, Result (Verified / NotVerified / Inconclusive / Unavailable from IC-IAM-02; NotAvailable when no adapter supports the check), AdapterReference, MatchedFields, CheckedOnUtc, ManualReviewOutcome (Confirmed / NotConfirmed, for Inconclusive), ManualReviewBy, ManualReviewReason, EvidenceReference, OverrideBy, OverrideReason | SEL-004 | Result values follow IC-IAM-02 |
| SellerPayoutAccount / PayoutAccountChange (new) | VendorId, Type (MobileMoney / Bank), Provider or Bank, Branch, AccountIdentifier (encrypted), AccountName, IsDefault, Status (SM-SEL-04), VerifiedBy, Method (BankCheck IC-INT-04 / MobileMoneyKyc IC-IAM-02 / FinanceConfirmation), VerificationReference; change: new values, RequestedBy, ApprovedBy, Status | SEL-005 | Distinct from PAY SellerPaymentAccount (PAY-035) |
| Seller terms acceptance (no SEL table) | IAM PolicyAcceptance: CustomerId, VendorId, PolicySystemName VendorTermsOfService, VersionNo, Decision, Channel, IpAddress, CreatedOnUtc | SEL-006 | Written and read through IC-IAM-05 (decision ONE-RECORD); versions and re-acceptance flag from MKT-008 PolicyVersion (IC-MKT-03); SellerTermsAcceptance of is withdrawn |
| MarketplaceRule / MarketplaceRuleVersion (new) | Type, Parameters, Scope (categories, seller types), IsActive, Version, PublishedOnUtc, SummaryTopicId | SEL-007 | Native Category.RestrictFromVendors and VendorSettings.MaximumProductNumber remain |
| SellerStaffProfile / SellerStaffMember (new) | Profile: Name, AllowedActions; Member: CustomerId, VendorId, ProfileId, Status | SEL-009 | Customer.VendorId (native) + Vendors role |
| SellerKpiSnapshot / KpiThreshold / SellerIntervention (new) | Snapshot: VendorId, Period, OrdersFulfilled, CancellationRate, ReturnRate, Complaints, OnTimeRate; Threshold: Kpi, Comparator, Value, Period, Action; Intervention: VendorId, ThresholdId, Action, Status | SEL-011 | |
| SellerRating (new) | OrderId, VendorId, CustomerId, Score, Comment, Status (SM-SEL-06), ModeratedBy, Reason | SEL-012 | Native product reviews and VendorReviews page remain |
| ListEntry / ListAppeal (new, Platform core) | Entry: SubjectType, Value (hashed for devices), ListType (Block / Watch / Allow), Scope, Reason, StartsOnUtc, EndsOnUtc, Status (SM-SEL-07), LinkedToEntryId, CreatedBy; Appeal: EntryId, Statement, Status (SM-SEL-08), DecidedBy | SEL-013, SEL-024 | Native SecuritySettings.AdminAreaAllowedIpAddresses (admin only) remains |
| PanelMembership (new) | CategoryId, VendorId, ValidFrom, ValidTo, Status (SM-SEL-09) | SEL-014 | |
| ImportBatch / ImportRow / Invitation (new) | Batch: File, CreatedBy; Row: data, Result (Created / Duplicate / Error), Field, Reason; Invitation: Contact, Token, Status (SM-SEL-12), ExpiresOnUtc | SEL-015, SEL-009 | |
| CommissionRule / CommissionRuleVersion / FeeCharge (new) | Rule: Dimension values (vendor, seller type or tier, listing or service type, category, logistics service), FeeType, Basis (% or fixed), Value, EffectiveFromUtc, EffectiveToUtc, Version; FeeCharge: VendorId, Type, Amount, SettlementBatchId | SEL-016 | Consumed by PAY-010 (IC-SEL-02) |
| SellerCharge (new) | VendorId, SourceModule, SourceType (RepaymentDeduction / Penalty / ReturnShipping / SellerFaultRemedy), SourceReference (unique per source), Amount, CapRule, ExternalReference (lender, order or return), SettlementBatchId | SEL-017 | Written through IC-SEL-05; ORD SellerPenalty and FIN RepaymentDeduction stay in their modules |
| SettlementCycle / SettlementBatch / SettlementLine / SellerPayout / SellerStatement (new) | Cycle: VendorId or TierId, Frequency (Daily / Weekly / other), EligibilityEvent, HoldDays; Batch: VendorId, PeriodFrom, PeriodTo, Net, Status (SM-SEL-05), ReleasedBy; Line: PaymentSplitId or FeeChargeId or SellerChargeId or adjustment, Amount; Payout: BatchId, Attempt, AccountSnapshot, ProviderReference, Status; Statement: VendorId, Month, DownloadId | SEL-017 | PaymentSplit (PAY-010) gets SettlementBatchId |
| SellerLocation / FulfilmentOptIn (new) | Location: VendorId, AddressId (native Address), Type, Preference, IsActive; OptIn: VendorId, ServiceCode, OptedInOnUtc, Status | SEL-018 | Native Vendor.AddressId remains the main address |
| SellerVacation (new) | VendorId, StartsOnUtc, EndsOnUtc, Message (localized), Status (SM-SEL-10) | SEL-019 | |
| CommissionAccrual / CommissionInvoice (new) | Accrual: OrderItemId, VendorId, Commission, Fees, RuleVersionIds, InvoiceId; Invoice: VendorId, Period, Lines, Tax, Total, DueDate, ReceivableId, FiscalSubmissionId, Status (SM-SEL-11) | SEL-025 | Receivable in PAY-033; fiscal in PAY-025 |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Marketplace pack settings | vendorsettings.*, commission rules, seller tiers; shoppingcartsettings.vendorenabled and .vendorrequired = false (decision CART-500) | vertical (Marketplace pack) → client | SEL-003 / SEL-016 | Marketplace pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Marketplace on/off; apply-for-vendor allowed | Marketplace pack install (App_Data/plugins.json); VendorSettings.AllowCustomersToApplyForVendorAccount (native); productfeature.<prd-id> (IC-PLT-02) | client → store | Not stated (KG-01) | Not stated (MG-02); conflicts with FR-026 to FR-050 (C-SELLER) |
| Vendor terms required | VendorSettings.TermsOfServiceEnabled (native) + topic VendorTermsOfService | client | Not stated | Required for activation (FR-030) |
| Vendor may edit own info; notify owner of change | VendorSettings.AllowVendorsToEditInfo, NotifyStoreOwnerAboutVendorInformationChange (native) | client | Not stated | Not stated |
| Maximum products per vendor; maximum pictures per product | VendorSettings.MaximumProductNumber, MaximumProductPicturesNumber (native) | client | Not stated | Not stated |
| Vendors may import products | VendorSettings.AllowVendorsToImportProducts (native) | client | Not stated | Not stated |
| Show vendor on product and order pages; contact vendor; search by vendor | VendorSettings.ShowVendorOnProductDetailsPage, ShowVendorOnOrderDetailsPage, AllowCustomersToContactVendors, AllowSearchByVendor (native) | client → store | Not stated | Not stated |
| Required profile fields | Vendor attributes with IsRequired (native) | client | Not stated | Configurable (FR-036) |
| Seller types, tiers, required documents and checks, limits | SellerType, SellerTier, SellerDocumentType (new) | vertical → client | Not stated | Configurable (FR-029, FR-308, FR-036) |
| Document expiry alert lead time; pause listings on expiry | SEL settings (new) | client | Not stated | Not stated |
| Assignment rules for the seller queue | SEL settings (new) | client | Not stated | Configurable (FR-319) |
| Payout account verification method per type | SEL settings (new) | country → client | Not stated | Not stated |
| Re-acceptance of a new seller terms version | MKT-008 PolicyVersion re-acceptance flag (per version; no SEL setting) | client | Not stated | Not stated |
| Marketplace rules | MarketplaceRule (new) | vertical → client | Not stated | Configurable (FR-033, FR-046) |
| KPI thresholds and actions | KpiThreshold (new) | client | Not stated | Configurable (FR-037) |
| Seller rating scale; approval required | SEL settings (new) | client | Not stated | Not stated |
| Seller staff profiles | SellerStaffProfile (new) | client | Not stated | Not stated |
| Commission and fee rules | CommissionRule (new) | client | Not stated | Configurable (FR-043, FR-303) |
| Settlement cycles, eligibility event, hold period, minimum payout, second approver | SettlementCycle, SEL settings (new) | client | Not stated | Daily / weekly cycles (FR-145); other values not stated |
| Commission invoicing period, due days, grace days, pause on overdue | SEL settings (new) | client | Not stated | Not stated |
| Unpublished product pages viewable (vacation notice on product page) | CatalogSettings.AllowViewUnpublishedProductPage, DisplayDiscontinuedMessageForUnpublishedProducts (native) | client → store | Not stated | Not stated |
| Vendor product reviews page size | CatalogSettings.VendorProductReviewsPageSize (native) | client → store | Not stated | Not stated |
| List entries (block, watch, allow) | ListEntry (new, Platform core) | client | Not stated | Configurable (FR-323) |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Apply for vendor account (native form + SEL terms check and seller sign-up entry) | SEL-001, SEL-006, SEL-013 | Native page extended (widget zones applyvendor_top / applyvendor_bottom) |
| Storefront — My account | Seller application: status, checklist, documents, verification requests, appeals, onboarding content | SEL-001, SEL-002, SEL-003, SEL-008, SEL-023, SEL-024 | New |
| Storefront — My account | Rate the seller of a completed order | SEL-012 | New |
| Storefront | Vendor page and product page notices (vacation); seller rating summary | SEL-012, SEL-019 | Widget zones vendordetails_top, productdetails_top |
| Seller portal (admin area, vendor-scoped) | Dashboard widget with checklist and required actions | SEL-008 | New widget on native vendor dashboard |
| Seller portal | Documents; payout accounts; terms; staff; locations and fulfilment opt-in; vacation; statements; ratings; verification and tier | SEL-002 to SEL-006, SEL-009, SEL-017 to SEL-019 | New (permission Marketplace.Core.SellerPortal.Access) |
| Admin | Seller applications queue, application detail and decision | SEL-003, SEL-004 | New |
| Admin | Document review queue | SEL-002 | New |
| Admin | Tiers, types, document types, rules, KPI thresholds, staff profiles, settlement cycles | SEL-002, SEL-003, SEL-007, SEL-009 to SEL-011, SEL-017 | New |
| Admin | Payout account change approvals | SEL-005 | New |
| Admin | Commission and fee rules with versions | SEL-016 | New |
| Admin | Settlement batches, payouts, statements | SEL-017 | New |
| Admin | Commission invoices | SEL-025 | New |
| Admin | Seller performance, onboarding funnel, diversity reports | SEL-011, SEL-021, SEL-022 | New |
| Admin | Seller rating moderation | SEL-012 | New |
| Admin | Block, watch and allow lists; appeals | SEL-013, SEL-024 | New (Platform core) |
| Admin | Supplier panels | SEL-014 | New (B2B trade pack) |
| Admin | Participant import and invitations | SEL-015 | New |
| Admin — vendor edit | Native vendor pages with activation gate | SEL-003 | Native page, SEL filter |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Sel.TermsRequired | Please accept the seller terms to submit your application. | AC-SEL-006-01-01 |
| Sel.ActivationBlocked | This seller cannot be activated until the application is approved and the current seller terms are accepted. | AC-SEL-003-01-07, BR-SEL-002 |
| Sel.ApprovalBlocked | The application cannot be approved yet. Open items: {0}. | AC-SEL-003-01-03 |
| Sel.ApplicationApproved | Your seller application has been approved. | AC-SEL-003-01-02 (TRK event code Sel.ApplicationApproved.SellerNotification, IC-TRK-04) |
| Sel.ApplicationRejected | Your seller application was not approved. Reason: {0}. | AC-SEL-003-01-04 (TRK event code Sel.ApplicationRejected.SellerNotification, IC-TRK-04) |
| Sel.DocumentExpiring | Your document {0} expires on {1}. Please upload a renewed document. | AC-SEL-002-04-01 (TRK event code Sel.DocumentExpiring.SellerNotification, IC-TRK-04) |
| Sel.ListingNotEligible | This product cannot be published: {0}. | AC-SEL-007-02-03, AC-SEL-003-02-03 |
| Sel.PayoutAccountChangePending | A change to your payout account was requested and is waiting for approval. | AC-SEL-005-03-01 (TRK event code Sel.PayoutAccountChangePending.SellerNotification, IC-TRK-04) |
| Sel.SelfApprovalNotAllowed | You cannot approve a change you requested. | AC-SEL-005-03-03 |
| Sel.StaffActionDenied | Your seller staff profile does not allow this action. | AC-SEL-009-01-02 |
| Sel.RatingNotAllowed | You can rate this seller once, after your order is completed. | AC-SEL-012-01-02 |
| Sel.UseSuspension | This seller is active. Suspend or blacklist the seller instead, so that its listings are paused. | AC-SEL-003-01-08, BR-SEL-002 |
| Sel.Blocked | We cannot complete this request. Please contact us for help. | AC-SEL-013-02-02, AC-SEL-024-01-02 |
| Sel.VacationNotice | This seller is away until {0}. {1} | AC-SEL-019-01-02 |
| Sel.NoVerifiedPayoutAccount | The settlement cannot be paid until the seller has a verified payout account. | AC-SEL-017-02-03 |
| Sel.LocationInUse | This location is used by open shipments and cannot be deactivated yet. | AC-SEL-018-01-02 |
| Sel.FulfilmentNotAvailable | No fulfilment service is available for your locations yet. | AC-SEL-018-02-02 |
| Sel.DuplicateRow | This row matches an existing participant or another row. | AC-SEL-015-02-01 |
| Sel.PanelExpiring | Your approved-supplier status for {0} ends on {1}. Please renew. | AC-SEL-014-02-01 (TRK event code Sel.PanelExpiring.SellerNotification, IC-TRK-04) |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Where a key is sent by email, the email is a MessageTemplate installed by the plugin with the system name shown (key + ".SellerNotification"), sent through IWorkflowMessageService or TRK-005; the locale key is the on-screen and SMS text.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Identity and registry checks (SEL-004) | IC-IAM-02 Verify / GetCapabilities | National ID, tax, business-registry and MNO KYC services through IAM-020 adapters | Not named for Kenya or Malawi |
| Payouts (SEL-017) | IC-PAY-01 Payout through PAY-024 adapters | Mobile-money providers and banks named in PAY | Providers per client: PAY (MG-03, KG-05) |
| Payment splits (SEL-016, SEL-017) | IC-SEL-02 | PAY-010 (internal) | |
| Receivables and fiscal (SEL-025) | IC-SEL-03 | PAY-033, PAY-025 (internal); KRA eTIMS / MRA EIS via PAY | E-INV |
| Listing lifecycle (SEL-002, SEL-007, SEL-011, SEL-019, SEL-024, SEL-025) | IC-SEL-01 | CAT-022 (internal) | |
| Document storage (SEL-002) | IC-DOC-03 Store; DOC-005 requirement sets (P2) | DOC-002, DOC-005 (internal) | |
| Seller charges (SEL-017) | IC-SEL-05 AddSellerCharge; IC-SEL-07 Seller.SettlementPaid | FIN-001, ORD-004, RET (internal) | Penalty rules and return charging rules not stated |
| Policy versions (SEL-006) | IC-MKT-03 GetEffectivePolicyVersion | MKT-008 (internal) | Held by WF-ENG |
| Notifications (SEL-020 and all SEL events) | IC-TRK-04 RegisterEventCode / SendEvent | TRK-005; CHN-005 SMS | Channels not stated |
| Terms acceptance (SEL-006) | IC-IAM-05 RecordAcceptance / HasAcceptedCurrent | IAM-016 (internal) | Decision ONE-RECORD |
| Bank account verification (SEL-005) | IC-INT-04 VerifyAccount | INT-008 bank adapters | Banks not named (KG-04, MG-03) |
| Complaint counts (SEL-011) | IC-CRM-05 GetComplaintCounts; event Complaint.Created | CRM-004 (internal) | CRM-004 held by T-MISS |
| Seller document access and upload policy (SEL-002) | SEC-002 download ownership filter (SEL rule provider); ADM-008 upload context "seller document" | SEC-002, ADM-008 (internal) | Decision SINGLE-FILTER |
| Workflow and approval queues (SEL-003, SEL-005) | IC-ADM-03 Submit; callbacks IC-SEL-06 | ADM-002, ADM-006 (WF-ENG) | Held by WF-ENG |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-SEL-01 | CheckEligibility (SEL provider → called by the CAT-002 IProductService override and lifecycle service) | Product, vendor | Pass, or Fail with failed rule IDs and texts | — | SEL provider registered as the IC-CAT-04 publish guard provider of the CAT-002 host (decision OVR-REG: CAT-002 owns IProductService; SEL registers no override); called at submission (IC-CAT-04 stage Submit) and at publish (stage Publish: IC-CAT-03 Publish / Resume and the host when an update would set Published true), BR-CAT-030 |
| IC-SEL-01 | PauseListings / ResumeListings (SEL → CAT-022) | Vendor, reason code (Vacation, SellerSuspended, SellerBlacklisted, DocumentExpired, CommissionOverdue, PerformanceIntervention) | Number of listings paused or resumed | Unknown reason | Implemented by the CAT lifecycle service IC-CAT-03 PauseListings / ResumeListings (vendor id, reason code, actor); CAT keeps the vendor reason set (VendorListingPause) under ILocker key 'cat-vendor-listings-{VendorId}' and resumes a listing only when no reason remains (BR-CAT-030, BR-SEL-005); Product.Published changes only in CAT-022 |
| IC-SEL-02 | GetRulesInForce (PAY-010 → SEL) | Order line (product, category, vendor, logistics service), order placement time | Commission and fee amounts, rule version IDs | No rule (exception) | SEL service called by the PAY split service |
| IC-SEL-02 | GetEligibleSplits (SEL → PAY-010) | Vendor, cut-off time, eligibility event | PaymentSplit rows not yet settled, reversals; splits of payments flagged as assigned to a lender (BR-PAY-131) are excluded | — | Read of PAY PaymentSplit; each split marked with SettlementBatchId (BR-PAY-053) |
| IC-SEL-03 | PostReceivable / SubmitFiscal (SEL → PAY-033, PAY-025) | Commission invoice | Receivable ID; fiscal status | Rejected by authority | PAY services IC-PAY-08 PostReceivable and IC-PAY-09 SubmitFiscal; debtor = vendor (BR-PAY-130) |
| IC-SEL-04 | VerifyIdentity — withdrawn | — | — | — | SEL calls the IAM contract IC-IAM-02 Verify / GetCapabilities directly; ID kept for traceability |
| IC-SEL-05 | AddSellerCharge (FIN-001, ORD-004, RET → SEL) | Vendor, source module, source type (RepaymentDeduction, Penalty, ReturnShipping, SellerFaultRemedy), source reference, amount or (RepaymentDeduction with basis Share only) a share of the batch net, cap rule (FIN: instructed amount or share, and outstanding balance), lender or order reference | Charge ID; later the batch ID in which it was deducted | Unknown vendor, duplicate source reference (idempotent: same charge returned) | SEL service; ORD-004 passes each SellerPenalty through this operation (BR-ORD-031); RET passes merchant-paid return shipping and, if the client confirms seller-fault charging, seller-fault remedies; the charge is shown on the seller statement |
| IC-SEL-06 | OnApproved / OnRejected (ADM-006 → SEL, implementing IC-ADM-03 callbacks) | Approval item ID, object type (SellerApplication, VerificationRequest, PayoutAccountChange), decision, approver, reason | Effect applied (SM-SEL-01, SM-SEL-02, SM-SEL-04 transition) or module error with message key | Guard unmet (Sel.ApprovalBlocked), self-approval (Sel.SelfApprovalNotAllowed) | SEL service registered as the IC-ADM-03 handler for its object types |
| IC-SEL-07 | Seller.SettlementPaid (published) | VendorId, SettlementBatchId, PaidOnUtc, Net, deduction lines (source, reference, amount) | — | — | Plugin event class published with IEventPublisher by the SEL settlement service when a batch becomes Paid; FIN consumer only enqueues IC-FIN-01 ReportRepayment |

Operation signatures (C# interfaces) are produced at L2 build start with the owning modules (CAT, PAY, IAM, ADM, FIN, ORD, RET) and approved by the tech lead; this table fixes the operations, directions and owners. Payout money movement uses the PAY contract IC-PAY-01 Payout, identity checks the IAM contract IC-IAM-02, document storage the DOC contract IC-DOC-03, approval queues the ADM contract IC-ADM-03, policy versions the MKT contract IC-MKT-03, terms acceptance the IAM contract IC-IAM-05, bank account checks the INT contract IC-INT-04, complaint counts the CRM contract IC-CRM-05, notifications the TRK contract IC-TRK-04, listing state the CAT contract IC-CAT-03 and the publish guard the CAT provider contract IC-CAT-04; none is redefined here.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Seller.ApplicationSubmitted | EntityInsertedEvent<Vendor> (native, after ApplyVendorSubmit inserts the vendor) — consumer only creates the application record; absence defaults to Submitted | SEL-003 queue, SEL-021 funnel |
| Seller.Approved / Suspended / Reinstated | None (SEL service events; Vendor update through IVendorService.UpdateVendorAsync) | CAT-022 pause/resume, TRK-005, RPT |
| Order events for sellers | OrderPlacedEvent, OrderPaidEvent (native vendor emails sent by OrderProcessingService) | SEL-020 |
| Order completed | OrderStatusChangedEvent (native) — consumer only enqueues the rating invitation | SEL-012 |
| Refund completed | OrderRefundedEvent (native) — consumer only enqueues the settlement adjustment / accrual reduction | SEL-017, SEL-025 |
| Seller.SettlementPaid | None (SEL plugin event IC-SEL-07, published when a batch becomes Paid) | FIN (repayment reporting, IC-FIN-01 ReportRepayment), TRK-005 |
| Complaint created | Complaint.Created (CRM module event: ticket, seller, category) — consumer only enqueues the seller notification; KPI counts are read through IC-CRM-05 GetComplaintCounts | SEL-020 |
| Shipment delivered | ShipmentDeliveredEvent (native) — consumer only marks splits eligible where the eligibility event is delivery | SEL-017 |
| Document expiry, vacation start/end, list expiry, panel renewal, KPI snapshot, settlement cycle close, invoicing, overdue | IScheduleTask (SEL tasks, run under ILocker) | SEL-002, SEL-011, SEL-013, SEL-014, SEL-017, SEL-019, SEL-025 |
| Admin vendor activation and deactivation gate | Action filter on Admin VendorController.Create / Edit / Delete [POST] (not an event) | SEL-003 (BR-SEL-002) |
| Apply-for-vendor terms and block check | Action filter on Nop.Web VendorController.ApplyVendor [POST] | SEL-006, SEL-013 |
| Seller staff limits | Global action filter for vendor users | SEL-009 (BR-SEL-010) |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two reviewers decide the same application | SEL-003 | Decisions run under ILocker.PerformActionWithLockAsync key 'sel-app-{VendorId}'; SellerApplication carries its own row version (plugin table); the second decision re-reads and is refused if the status changed |
| Settlement batch calculation while a refund completes on the same order | SEL-017 | Batch build runs under key 'sel-settle-{VendorId}'; a reversal recorded after a split was included goes to the next batch as an adjustment; a split is never in two batches (SettlementBatchId set inside the lock) |
| Duplicate payout result callback | SEL-017 | Handled by IC-PAY-01 idempotency (batch ID + attempt); a second result for a Paid batch is logged and ignored |
| Payout account change approved while a batch is being released | SEL-005, SEL-017 | Release uses the account snapshot taken under the batch lock; the change applies to the next release |
| Two pause reasons set and one cleared at the same time (for example vacation ends while suspension starts) | SEL-019, SEL-003 | Pause and resume per reason are serialised by CAT-022 under key 'cat-vendor-listings-{VendorId}', then per listing under 'cat-listing-{ProductId}' (BR-CAT-030); listings resume only when no reason remains |
| Document renewal accepted while the expiry task runs | SEL-002 | Both run under key 'sel-doc-{DocumentId}'; the task re-reads and skips a document already Superseded |
| Same identifier used in two applications at once | SEL-013, SEL-024 | Block check is evaluated at submission and again at approval (guard), so a later-added entry still prevents approval |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Application received | Store owner | Email (native VendorAccountApply.StoreOwnerNotification) | SEL-001 |
| Application approved / rejected; verification request decided | Seller | Email + channels per TRK-005 | SEL-003 |
| Document resubmission requested, rejected, expiring, expired | Seller; compliance staff | Email + channels per TRK-005 | SEL-002 |
| Payout account change requested / decided | Seller owner | Email + SMS | SEL-005 |
| Order placed, paid, cancelled; low stock | Seller | Email (native vendor templates) + channels per TRK-005 | SEL-020 |
| Complaint registered | Seller | Channels per TRK-005 | SEL-020 |
| KPI warning; intervention | Seller; compliance staff | Email + admin notification | SEL-011 |
| Settlement paid / failed; statement available | Seller | Email | SEL-017 |
| Commission invoice issued / overdue | Seller | Email | SEL-025 |
| Panel renewal due | Supplier | Email | SEL-014 |
| Invitation | Invited participant or staff user | Email or SMS | SEL-009, SEL-015 |
| List appeal decided | Subject | Email | SEL-013, SEL-024 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Seller onboarding funnel and cycle time | SEL-021 | REQ-MPC-FR-048 |
| Seller performance (KPIs, thresholds crossed, interventions) | SEL-011 | REQ-MPC-FR-037 |
| Monthly settlement statement per seller | SEL-017 | REQ-MPC-FR-042; FC-M13-018 |
| Settlement batches and payout results | SEL-017 | REQ-MPC-FR-145 |
| Seller diversity shares | SEL-022 | FC-M11-018 |
| Listings violating a changed rule | SEL-007 | Proposed |
| Commission invoices and overdue amounts | SEL-025 | D |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-SEL-001 | Application or verification-request status change | Compliance staff / system | SellerApplication, VerificationRequest | old and new status, reason, reviewer |
| AUD-SEL-002 | Document review decision | Compliance staff | SellerDocument | decision, reason, version |
| AUD-SEL-003 | Payout account change requested, approved, rejected | Seller / finance staff | SellerPayoutAccount, PayoutAccountChange | old and new values (masked), requester, approver |
| AUD-SEL-004 | Withdrawn in : seller terms acceptance is audited by IAM (AUD-IAM-012) when SEL calls IC-IAM-05 (decision ONE-RECORD) | — | — | — |
| AUD-SEL-005 | Configuration change (tier, type, document type, rule, threshold, commission rule, cycle, panel) | Administrator / finance / procurement | Rule entity | old and new values, effective date |
| AUD-SEL-006 | Listing pause or resume requested; KPI intervention | System / compliance staff | SellerIntervention, pause reason | vendor, reason, listings affected |
| AUD-SEL-007 | List entry created, changed, revoked, expired; appeal decided | Risk / compliance staff / system | ListEntry, ListAppeal | subject, list type, scope, period, reason |
| AUD-SEL-008 | Settlement released; payout result | Finance staff / system | SettlementBatch, SellerPayout | amount, account snapshot (masked), provider reference, result |
| AUD-SEL-009 | Seller staff member added, changed, removed | Seller owner | SellerStaffMember | customer, profile |
| AUD-SEL-010 | Rating moderated or hidden | Moderator | SellerRating | decision, reason |
| AUD-SEL-011 | Commission invoice issued or corrected | Finance staff / system | CommissionInvoice | lines, totals, receivable reference |
| AUD-SEL-012 | Activation, deactivation or deletion refused by the gate; identity-check manual review outcome or override | Administrator / reviewer | Vendor, IdentityCheckResult | user, conditions unmet, outcome, override or review reason |

Business audit events AUD-SEL-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id (for an approval, the ADM-006 item and the resulting change share it); old and new entity values are captured by the SEC IRepository<> decorator and need no call. All SEL writes go through IRepository<>; SEL does not write through INopDataProvider directly. The native activity log is not used as the audit record. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-SEL-001 | KYC documents, identity numbers and payout account identifiers are encrypted at rest in plugin tables or the document store, access-limited by permission and masked in lists and exports. | REQ-MPC-FR-027; NFR-X-001; NFR-X-002 | AC-SEL-002-01-03; AC-SEL-005-01-01; test note T-SEL-06 |
| NFR-SEL-002 | Every verification, approval, payout and list decision is audited with before and after values (NFR-X-003). | REQ-MPC-FR-039; REQ-MPC-FR-323 | §14.2 audit events; T-SEL-07 |
| NFR-SEL-003 | Device identifiers and diversity characteristics are processed under the country data-protection profile (SEC-012). | NFR-X-002; Inference (personal data) | Review against SEC-012 profile |
| NFR-SEL-004 | Response-time and volume targets for seller pages, settlement runs and imports: Not stated in source — requires confirmation. | NFR-X-009; KG-02; MG-13 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-SEL-001 | P1 | — | |
| PRD-SEL-002 | P1 | PRD-DOC-002 | |
| PRD-SEL-003 | P1 | PRD-ADM-002 | |
| PRD-SEL-004 | P1 | PRD-IAM-020 | |
| PRD-SEL-005 | P1 | PRD-ADM-006 | PRD-SEL-017 |
| PRD-SEL-006 | P1 | — | |
| PRD-SEL-007 | P1 | PRD-CAT-002 | |
| PRD-SEL-008 | P1 | — | |
| PRD-SEL-009 | P1 | — | |
| PRD-SEL-010 | P2 | — | |
| PRD-SEL-011 | P1 | — | |
| PRD-SEL-012 | P1 | — | |
| PRD-SEL-013 | P1 | — | PRD-SEL-024, PRD-ADM-005 |
| PRD-SEL-014 | P2 | — | |
| PRD-SEL-015 | P2 | — | |
| PRD-SEL-016 | P1 | — | PRD-SEL-025 |
| PRD-SEL-017 | P1 | PRD-PAY-010, PRD-SEL-005, PRD-PAY-024 | PRD-CHK-004 |
| PRD-SEL-018 | P1 | — | |
| PRD-SEL-019 | P1 | — | |
| PRD-SEL-020 | P1 | — | |
| PRD-SEL-021 | P1 | — | |
| PRD-SEL-022 | P3 | — | |
| PRD-SEL-023 | P1 | — | |
| PRD-SEL-024 | P1 | PRD-SEL-013 | |
| PRD-SEL-025 | P2 | PRD-SEL-016, PRD-PAY-033, PRD-PAY-021, PRD-PAY-025 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-SEL-01 | Activation gate: native admin vendor edit with Active = true is refused unless the application is Approved and terms accepted (IC-IAM-05); native edit with Active = false and native delete of an Approved seller are refused (Sel.UseSuspension); apply-for-vendor without terms is refused server-side (browser script disabled). |
| T-SEL-02 | Listing pause: a suspended seller's products do not appear in search, category pages or product pages, and cannot be added to the cart; low-stock republish, bulk edit and import do not republish a paused product. |
| T-SEL-03 | Multi-reason pause: vacation end does not resume listings while suspension or document expiry remains. |
| T-SEL-04 | Seller staff: each profile has allow and deny cases on admin pages; a staff user of a suspended seller is challenged. |
| T-SEL-05 | Settlement: batch totals equal the sum of included splits, reversals, charges and adjustments; no split in two batches under concurrent runs and refunds. |
| T-SEL-06 | Sensitive data: payout and KYC identifiers are encrypted in the database and masked in lists, exports and logs. |
| T-SEL-07 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-SEL-08 | Permissions: each permission in §4 has an allow and a deny case (§4.1); seller-portal endpoints refuse access to another seller's data. |
| T-SEL-09 | Vendor discounts and data scoping of a vendor user are unchanged by SEL (regression of native vendor scoping). |
