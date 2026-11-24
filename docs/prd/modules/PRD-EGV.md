# L2 Module PRD — EGV: e-Government and service catalogue (optional pack)

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | EGV — e-Government and service catalogue (optional pack) |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets a client such as Malawi Post offer government services through the shop: each agency lists its services with fees, required documents, process and delivery options; citizens apply online, upload documents, pay the fee, book an appointment where a visit is needed, follow the status and receive the issued document by delivery or collection through the post-office network; agencies manage their own users and service workflows; and the client collects government fees and reports what it owes and has remitted to each agency. The whole module is held until Malawi Post decides that e-Government is in product scope (FG-06) and provides its priority service list (T-MISS).

**In scope**

- e-Government service catalogue on native products, categories, vendors and search (EGV-001)
- Service applications: submission, required documents (file checks by ADM-008, file access by SEC-002 with the EGV rule), document review, resubmission, decision, issue and status tracking (EGV-002)
- Appointments for in-person steps on the CAT-027 booking, linked to the application, with notifications (EGV-003)
- Delivery or collection of issued documents through native shipments and pickup points with tracking (EGV-004)
- Government fee collection hooks, remittance lines, batches and reports per agency (EGV-005)
- Agency administration: agency users, their EGV roles and the workflow assigned to each service (EGV-006)
- Configurable identity and official-document application workflows without service-specific code (EGV-007)

**Not in this module**

| Item | Where it is |
|---|---|
| Workflow designer and runtime | ADM module (PRD-ADM-002), held by WF-ENG — EGV-002 and EGV-007 run their steps on it |
| Slot calendar, capacity per outlet and booking creation | CAT module (PRD-CAT-027) — EGV-003 links the booking to the application |
| Booking changes, cancellation and no-show rules | SVC module (PRD-SVC-003) |
| Fee payment, payment methods, refunds | PAY module (PRD-PAY-001, PAY-016); RET-005 for refund triggers |
| Delivery network, carriers, S10 identifiers, tracking events | LOG and TRK modules (PRD-LOG-020, LOG-021, TRK-002) — EGV-004 creates the shipment |
| Pickup points and outlets | LOG module (PRD-LOG-003) |
| Notification engine and channels | TRK module (PRD-TRK-005) |
| Document content checks (reading scans, signature validation, profile matching) | DOC module (PRD-DOC-005), external service, P2 |
| Separate browsing area for operator services | SRC module (PRD-SRC-020) |
| e-Government usage reports by agency | RPT module (PRD-RPT-012), external BI |
| Scoped permission model beyond vendor scope | IAM module (PRD-IAM-008) |
| National identity systems | External systems (not named); EGV-007 calls them through a connector |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-EGV-001 | e-Government service catalogue | G2C / G2B | P1 | Configuration | None | e-Government pack | | FG-06, T-MISS |
| PRD-EGV-002 | Service applications | G2C / G2B | P1 | Code-level | Custom plugin | e-Government pack | PRD-ADM-002 | FG-06, WF-ENG, T-MISS |
| PRD-EGV-003 | Appointments | G2C / G2B | P1 | Code-level | Custom plugin | e-Government pack | PRD-CAT-027 | FG-06, T-MISS |
| PRD-EGV-004 | Document delivery | G2C / G2B | P1 | Code-level | Custom plugin | e-Government pack | PRD-ORD-010 | FG-06, T-MISS |
| PRD-EGV-005 | Government fee collection | G2C / G2B | P1 | Code-level | Custom plugin | e-Government pack | | FG-06, T-MISS |
| PRD-EGV-006 | Agency administration | G2C / G2B | P1 | Code-level | Custom plugin | e-Government pack | | FG-06, T-MISS |
| PRD-EGV-007 | Digital ID service workflows | G2C / G2B | P1 | Code-level | Custom plugin + External system + integration plugin | e-Government pack | PRD-ADM-002 | FG-06, WF-ENG, T-MISS |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Citizen (shopper) | Finds a service, applies, uploads documents, pays the fee, books an appointment, follows status, receives or collects the document | Guests / Registered (native); registration required to apply (Proposed) |
| Agency officer | Reviews documents, requests resubmission, approves or rejects, records issue, hands documents to the delivery network | Role system name "AgencyOfficer" (BR-IAM-050) + Customer.VendorId = agency |
| Agency administrator | Maintains the agency services, users, their EGV roles and the workflow of each service | Role system name "AgencyAdmin" (BR-IAM-050) + Customer.VendorId = agency |
| Member of finance staff | Runs remittance batches, records remittance references, reviews fee reports | Role system name "Finance" (BR-IAM-050) |
| Outlet staff (agent) | Checks in appointments, hands over documents for collection | Role system name "Agent" (BR-IAM-050; IAM-026) |
| Client administrator | Creates agencies (vendors), the first agency administrator, categories, delivery options and connectors | Administrators (native) |
| Agency system (system) | Receives fee notifications and remittance reports; returns confirmations; may receive applications | External system via EGV connector (not named) |
| Identity system (system) | Verifies identity data or registers an ID application where a workflow step calls it | External system via EGV connector (not named) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| EGov.Applications.View | Orders | View applications, documents and status history of the own agency (all agencies for administrators) | Administrators, AgencyOfficer, AgencyAdmin |
| EGov.Applications.CreateEditDelete | Orders | Accept or reject documents, request resubmission, approve, reject, record issue, hand over for delivery (always with a reason where stated, audited) | AgencyOfficer |
| EGov.AgencyUsers.CreateEditDelete | Customers | Create, deactivate and assign EGV roles to users of the own agency only | AgencyAdmin; Administrators (any agency) |
| EGov.Workflows.CreateEditDelete | Configuration | Assign an ADM-002 workflow definition and its version to each service of the own agency | AgencyAdmin |
| EGov.Appointments.CreateEditDelete | Orders | Check in an appointment linked to an application | Agent, AgencyOfficer |
| EGov.Remittance.View | Reports | View fee collection and remittance reports (own agency for agency roles) | Finance, AgencyAdmin |
| EGov.Remittance.CreateEditDelete | Orders | Create remittance batches, record remittance references, record agency confirmation | Finance |

Permissions are declared in the EGV plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager), with the plugin prefix and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is taken from the native set. Every role name is spelled exactly as in the IAM product role catalogue BR-IAM-050 (Finance, Agent, AgencyOfficer and AgencyAdmin are in it). The IAM plugin creates every missing catalogue role (BR-IAM-050); the EGV plugin does not rely on native start-up to create them. Agency users are customers with Customer.VendorId set to the agency vendor: native admin pages already limit them to the vendor's products and orders (WebWorkContext.GetCurrentVendorAsync). Agency users are not placed in the native Vendors role (Proposed): the native permissions they need (Security.AccessAdminPanel, Catalog.ProductsView, and Catalog.ProductsCreateEditDelete for AgencyAdmin only, Orders.OrdersView, Orders.ShipmentsView / ShipmentsCreateEditDelete for AgencyOfficer) are declared here and mapped to the agency roles by the IAM-007 role pack (BR-IAM-053), so an officer cannot edit services natively. Agency administrators never receive the native Customers.CustomersCreateEditDelete permission; they manage users only through the EGV agency-users page, which forces VendorId to their own agency. All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-EGV-PERM-01 | **Given** a user without EGov.Applications.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-EGV-PERM-02 | **Given** a user without EGov.Applications.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-EGV-PERM-03 | **Given** a user without EGov.AgencyUsers.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-EGV-PERM-04 | **Given** a user without EGov.Workflows.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-EGV-PERM-05 | **Given** a user without EGov.Appointments.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-EGV-PERM-06 | **Given** a user without EGov.Remittance.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-EGV-PERM-07 | **Given** a user without EGov.Remittance.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-EGV-001 | Catalog can hold services: products (IsShipEnabled off) with price as fee, full description for process, specification attributes, FileUpload product attributes for required documents, categories by agency, vendor per agency, search (incl. bundled Search.Lucene). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs; src/Libraries/Nop.Core/Domain/Catalog/AttributeControlType.cs (FileUpload = 30); src/Libraries/Nop.Core/Domain/Catalog/ProductAttributeMapping.ValidationFileAllowedExtensions; src/Libraries/Nop.Core/Domain/Vendors/Vendor.cs; src/Plugins/Nop.Plugin.Search.Lucene] | Priority service list not provided; per-agency structured fields beyond attributes would need a plugin. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-EGV-002 | Order with file-upload attributes, payment and order status. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/AttributeControlType.cs; src/Libraries/Nop.Core/Domain/Orders/OrderStatus.cs] | Application workflow (document check, statuses beyond order status) on ADM-002/DOC-005. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-EGV-003 | Rental products (Product.IsRental, RentalPriceLength, RentalPricePeriod) give date ranges only; no time slots or capacity. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.IsRental; src/Libraries/Nop.Core/Domain/Catalog/RentalPricePeriod.cs] | Appointment booking (slots, capacity per outlet, reminders). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-EGV-004 | Shipments, pickup points (Pickup.PickupInStore), ShipmentReadyForPickup notification. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Plugins/Nop.Plugin.Pickup.PickupInStore; src/Libraries/Nop.Core/Domain/Shipping/ShipmentReadyForPickupEvent.cs] | Hand-off from issuing agency creating the shipment/pickup and status sync. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-EGV-005 | Order totals per vendor (vendor = agency) and admin order filters by vendor. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Vendors/Vendor.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs] | Agency fee split, remittance tracking and reports. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-EGV-006 | Vendor accounts with several users (Customer.VendorId) and vendor admin area; vendor-role permissions are global, not per agency. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Customers/Customer.VendorId; src/Libraries/Nop.Services/Security/DefaultPermissionConfigManager.cs] | Per-agency user/permission management and agency-owned service processes. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-EGV-007 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No component in src] | Configurable ID/official-document application workflows on ADM-002, and external ID system integration. | Custom plugin + External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: depends on ADM-002 |


## 7. Feature specifications


### 7.1 PRD-EGV-001 e-Government service catalogue

| Item | Value |
|---|---|
| Description (baseline) | A list of government services available through the platform, with fees, required documents, process and search. (The priority service list has not been provided yet.) |
| Why it matters | Citizens find government services in one place. |
| Who benefits | Citizens; government agencies |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | On hold: FG-06, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-EGV-001-01 | As a citizen, I want to search for a government service and see its fee, required documents, process and delivery options in one place, so that I know what I need before I apply. | D; REQ-MPC-FR-089 | On hold: FG-06, T-MISS |
| US-EGV-001-02 | As an agency administrator, I want to create and change a service entry with its definition, fee and required documents, so that the catalogue stays correct without a developer. | D; REQ-MPC-FR-307 | On hold: FG-06, T-MISS |
| US-EGV-001-03 | As a client administrator, I want each agency to have its own services, grouped by agency, so that citizens find services by agency and agencies see only their own. | D | On hold: FG-06, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-EGV-001-02-01 | US-EGV-001-02 | **Given** an agency administrator creates a service, **when** it is saved, **then** it is a native product of the agency vendor with: name and short description (definition), price = fee, full description = process, shipping disabled unless the service has a physical output (EGV-004), and one required FileUpload product attribute per required document with allowed file types and maximum size. | REQ-MPC-FR-307; FIT (Product, AttributeControlType.FileUpload, ProductAttributeMapping.ValidationFileAllowedExtensions / ValidationFileMaximumSize) |
| AC-EGV-001-02-02 | US-EGV-001-02 | **Given** a service exists, **when** the agency administrator changes its fee, **then** new applications use the new fee; existing orders keep the fee stored on their order items. | REQ-MPC-FR-307; FIT (OrderItem prices stored at placement) |
| AC-EGV-001-02-03 | US-EGV-001-02 | **Given** a service exists, **when** the agency administrator adds or removes a required document, **then** new applications require the changed set; submitted applications keep the documents they were submitted with. | REQ-MPC-FR-307 |
| AC-EGV-001-01-01 | US-EGV-001-01 | **Given** published e-Government services exist, **when** a citizen searches with a word in the service name or description, **then** matching services are returned by the active search provider (SRC module) and can be filtered by the agency category. | REQ-MPC-FR-089; FIT (search; Search.Lucene is still a stub in 5.00.1, Plugins/Nop.Plugin.Search.Lucene/LuceneSearchProvider.cs:10, PAID-STUB) |
| AC-EGV-001-01-02 | US-EGV-001-01 | **Given** a citizen opens a service, **when** the page is shown, **then** it shows the fee, the list of required documents with allowed file types, the process text, the agency, and the delivery options configured for the service (delivery, collection at an outlet, or none). | REQ-MPC-FR-089 |
| AC-EGV-001-03-01 | US-EGV-001-03 | **Given** an agency vendor and its category exist, **when** a service is created by a user of that agency, **then** the service is assigned to that vendor automatically and placed in the agency category; users of other agencies cannot see it in admin. | D; FIT (vendor scoping) |
| AC-EGV-001-02-04 | US-EGV-001-02 | **Given** a service is unpublished, **when** a citizen searches or opens its address, **then** it is not listed and cannot be applied for (native Published). | FIT |
| AC-EGV-001-02-05 | US-EGV-001-02 | **Given** a published service has no Published ADM-002 workflow definition and version assigned (EgvServiceConfig, EGV-006), **when** a citizen adds it to the cart, **then** the EGV cart check provider (IC-CHK-01, called by the single IShoppingCartService override owned by CHK-003 under OVR-REG) returns message Egv.WorkflowRequired and the item is not added — held by WF-ENG. | REQ-MPC-FR-307; WF-ENG; Proposed ( ADM, AC-ADM-002-07-01) |
| AC-EGV-001-03-02 | US-EGV-001-03 | **Given** the feature state productfeature.<prd-id> of PRD-EGV-001 is off for store S (IC-PLT-02), **when** a citizen of S opens My account or an agency user opens the EGV admin pages for S, **then** the EGV pages, widgets and actions are not shown for S and the EGV scheduled tasks skip S; e-Government service products are native and stay governed by Published and store mapping (BR-EGV-014). | Proposed (IC-PLT-02, PLT) |

**Business rules applied:** BR-EGV-001; BR-EGV-002; BR-EGV-013; BR-EGV-014; BR-EGV-015 (§8.1).


### 7.2 PRD-EGV-002 Service applications

| Item | Value |
|---|---|
| Description (baseline) | Citizens apply for a government service online, upload and check documents, pay the fee and follow the status. |
| Why it matters | Fewer trips to government offices. |
| Who benefits | Citizens |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: FG-06, WF-ENG, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-EGV-002-01 | As a citizen, I want to apply for a government service online, upload the required documents and pay the fee in one flow, so that I avoid a trip to the office. | D; REQ-MPC-FR-332 | On hold: FG-06, WF-ENG, T-MISS |
| US-EGV-002-02 | As a citizen, I want uploaded files to be checked for type and size and kept so that only I and the agency can see them, so that my documents are safe. | D; REQ-MPC-FR-333 | On hold: FG-06, WF-ENG, T-MISS |
| US-EGV-002-03 | As an agency officer, I want to check each document, ask for a replacement, and approve or reject the application, so that only complete, valid applications are approved. | D; REQ-MPC-FR-333 | On hold: FG-06, WF-ENG, T-MISS |
| US-EGV-002-04 | As a citizen, I want to follow the status of my application and be told when it changes, so that I know what to do next. | D; REQ-MPC-FR-332 | On hold: FG-06, WF-ENG, T-MISS |
| US-EGV-002-05 | As an agency administrator, I want each service to follow its own configured workflow, so that agencies run their own processes without code. | REQ-MPC-FR-307 | On hold: FG-06, WF-ENG, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-EGV-002-01-01 | US-EGV-002-01 | **Given** a registered citizen opens a service and every required FileUpload attribute has a file, **when** the citizen adds it to the cart and places the order, **then** one ServiceApplication is created per order line of an e-Government service with status AwaitingFee and one ApplicationDocument per uploaded file (SM-EGV-01, SM-EGV-02). | REQ-MPC-FR-332; FIT (FileUpload attributes in AttributesXml) |
| AC-EGV-002-01-02 | US-EGV-002-01 | **Given** a ServiceApplication is created, **when** the creation is saved, **then** the module event ServiceRequest.Submitted (application, service, agency, citizen, time) is raised once for INT-003 and other consumers. | REQ-MPC-FR-332; Proposed (event used by INT-003) |
| AC-EGV-002-01-03 | US-EGV-002-01 | **Given** a required document is missing, **when** the citizen adds the service to the cart, **then** the native required-attribute warning is shown and the item is not added. | FIT (ShoppingCartService.GetShoppingCartItemAttributeWarningsAsync) |
| AC-EGV-002-01-04 | US-EGV-002-01 | **Given** an application is AwaitingFee, **when** the order becomes Paid (through PAY), **then** the application becomes UnderReview; an OrderPaidEvent consumer starts this and a reconciliation task moves any application whose order is Paid but still AwaitingFee (BR-EGV-003). | REQ-MPC-FR-332; FIT (L1 §6.2 principle 8) |
| AC-EGV-002-01-05 | US-EGV-002-01 | **Given** an application is AwaitingFee, **when** the order is cancelled (INV-004 timeout or the citizen), **then** the application becomes Cancelled. | D |
| AC-EGV-002-02-01 | US-EGV-002-02 | **Given** a FileUpload attribute of an e-Government service allows only some file types and EGV has registered its upload context (e-Government application document) with ADM-008, **when** a file of another type, or over the size limit, is uploaded on the product page or on the application page, **then** the ADM-008 upload policy refuses it on the server before anything is stored, with message Adm.UploadTypeNotAllowed or Adm.UploadTooLarge, applying the stricter of the attribute limits (ValidationFileAllowedExtensions, ValidationFileMaximumSize) and the context policy (BR-ADM-060); EGV has no upload filter of its own. | REQ-MPC-FR-333; decision SINGLE-FILTER; FIT (native upload checks size only; extensions are checked only in the browser) |
| AC-EGV-002-02-02 | US-EGV-002-02 | **Given** a file is accepted, **when** it is stored, **then** the file is stored as a native Download record, SEC-002 records its UploadOwnership (download GUID, uploading customer, product; BR-SEC-005) and EGV links the Download to the ApplicationDocument. | REQ-MPC-FR-333; FIT (Download) |
| AC-EGV-002-02-03 | US-EGV-002-02 | **Given** a Download linked to an ApplicationDocument exists, **when** anyone other than the uploading customer, a user of the owning agency or an administrator requests it through DownloadController.GetFileUpload or Admin DownloadController.DownloadFile, **then** the single SEC-002 download ownership filter, applying the EGV rule provider for e-Government files, refuses it with message Sec.FileAccessDenied and SEC logs the attempt (BR-SEC-005, BR-EGV-004). | REQ-MPC-FR-333; decision SINGLE-FILTER; FIT (native GetFileUpload has no ownership check) |
| AC-EGV-002-03-01 | US-EGV-002-03 | **Given** an application is UnderReview, **when** the officer marks a document Rejected with a reason and requests resubmission, **then** the application becomes ResubmissionRequested, the citizen is notified with the reason and message Egv.ResubmissionRequested, and the rejected document stays stored with its status. | REQ-MPC-FR-333 |
| AC-EGV-002-03-02 | US-EGV-002-03 | **Given** an application is ResubmissionRequested, **when** the citizen uploads a replacement on the application page, **then** a new ApplicationDocument version is stored after the same ADM-008 checks and the application returns to UnderReview. | REQ-MPC-FR-333 |
| AC-EGV-002-03-03 | US-EGV-002-03 | **Given** an application is UnderReview and every required document is Accepted, **when** the officer approves, **then** the application becomes Approved; approval with any document not Accepted is refused with message Egv.DocumentsNotAccepted (BR-EGV-005). | D |
| AC-EGV-002-03-04 | US-EGV-002-03 | **Given** an application is UnderReview, **when** the officer rejects it with a reason, **then** the application becomes Rejected, the citizen is notified, and if EgvServiceConfig.RefundOnRejection is on for the service EGV calls IC-RET-04 RaiseRefundTrigger with source type ApplicationRejected, the order line and the amount EGV computes (the amount paid for that service line); RET-005 sends the refund to PAY-016. | D; Proposed (setting, amount); RET-005 (IC-RET-04) |
| AC-EGV-002-03-05 | US-EGV-002-03 | **Given** an application is Approved, **when** the officer records the issued document reference, **then** the application becomes Issued; without a physical output it then becomes Closed; with one, EGV-004 applies. | D |
| AC-EGV-002-04-01 | US-EGV-002-04 | **Given** an application exists, **when** the citizen opens My account, Applications, **then** the status, the date of each change, the reason of any rejection or resubmission request, and any appointment (EGV-003) or shipment tracking (EGV-004) are shown. | REQ-MPC-FR-332 |
| AC-EGV-002-04-02 | US-EGV-002-04 | **Given** the application status changes, **when** the change is saved, **then** the citizen receives a notification on the channels configured in TRK-005 for that status (message keys Egv.Status.*). | REQ-MPC-FR-332 |
| AC-EGV-002-05-01 | US-EGV-002-05 | **Given** a Published ADM-002 workflow definition and version are assigned to the service (EGV-006), **when** an application of that service is created, **then** EGV requests a case of that definition version through IC-ADM-01 StartCase (business key ServiceApplication and its Id, idempotency key the application Id) and stores the case Id on the application; the application runs as that case: EGV signals the case (IC-ADM-01 CompleteTask / Signal) on fee paid, document decisions and issue, and Approved can be set only after the case has completed the steps before approval (BR-EGV-005) — held by WF-ENG. | REQ-MPC-FR-307; WF-ENG; ADM (AC-ADM-002-07-01) |
| AC-EGV-002-03-06 | US-EGV-002-03 | **Given** two officers act on the same application at once, **when** the second saves, **then** the change is refused because the application was changed (row version), and the officer reloads it. | Proposed |
| AC-EGV-002-04-03 | US-EGV-002-04 | **Given** the TRK-005 engine asks the EGV order-kind provider (IC-TRK-05) about an order before sending OrderCompleted.CustomerNotification, **when** the order lines are all e-Government service lines, or the order holds any other line, **then** the provider returns order kind e-Government in the first case and none in the second; it sends no message itself, and TRK-005 applies the action configured for the kind (BR-TRK-024). | Decision MSG-ROUTE; Proposed |

**Business rules applied:** BR-EGV-003; BR-EGV-004; BR-EGV-005; BR-EGV-006; BR-EGV-016 (§8.1).


### 7.3 PRD-EGV-003 Appointments

| Item | Value |
|---|---|
| Description (baseline) | Citizens book an appointment for any step that must be done in person. |
| Why it matters | Less queuing. |
| Who benefits | Citizens |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CAT-027 |
| Status | On hold: FG-06, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-EGV-003-01 | As a citizen, I want to book an appointment for a step of my application that must be done in person, so that I do not queue. | D; REQ-MPC-FR-334 | On hold: FG-06, T-MISS |
| US-EGV-003-02 | As a citizen, I want reminders and changes of my appointment by message, so that I do not miss it. | REQ-MPC-FR-334 | On hold: FG-06, T-MISS |
| US-EGV-003-03 | As an outlet staff, I want to check in the citizen when they arrive, so that the agency sees the step was done. | D | On hold: FG-06, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-EGV-003-01-01 | US-EGV-003-01 | **Given** a service has an in-person step and CAT-027 slots are configured for the outlets that handle it, **when** the application reaches the step that needs a visit, **then** the citizen is offered the free slots of those outlets and books one through IC-CAT-07 Book (a direct booking, Confirmed with no cart or order item, SM-CAT-05); the returned BookingId is stored on the application and shown on the application page; a full slot is refused with message Cat.SlotFull. | D; REQ-MPC-FR-334; depends on PRD-CAT-027 (workbook) |
| AC-EGV-003-01-02 | US-EGV-003-01 | **Given** no slot is free at any outlet for the service, **when** the citizen opens the booking step, **then** message Egv.NoSlotAvailable is shown and the application stays at its step. | Proposed |
| AC-EGV-003-02-01 | US-EGV-003-02 | **Given** a citizen cancels or changes an appointment before it starts, **when** the change is confirmed, **then** EGV calls IC-CAT-07 Release for the booking (SM-CAT-05 Released); for a change it then books the new slot with IC-CAT-07 Book and stores the new BookingId. | Proposed |
| AC-EGV-003-02-02 | US-EGV-003-02 | **Given** an appointment is booked, changed or cancelled, **when** the change is saved, **then** the citizen receives a confirmation through TRK-005 with the date, time, outlet address and application reference. | REQ-MPC-FR-334 |
| AC-EGV-003-02-03 | US-EGV-003-02 | **Given** an appointment is booked, **when** the reminder lead time before it is reached, **then** a reminder is sent through TRK-005 (lead time is a setting, default not stated). | REQ-MPC-FR-334 |
| AC-EGV-003-03-01 | US-EGV-003-03 | **Given** a citizen arrives for a booked appointment, **when** outlet staff check in the appointment, **then** the check-in time and staff member are recorded on the application history; audited (AUD-EGV-001). | D |

**Business rules applied:** BR-EGV-007; BR-EGV-016 (§8.1).


### 7.4 PRD-EGV-004 Document delivery

| Item | Value |
|---|---|
| Description (baseline) | Issued documents (for example certificates or IDs) are delivered or collected through the post-office network. |
| Why it matters | Citizens receive documents near home. |
| Who benefits | Citizens; Malawi Post |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ORD-010 |
| Status | On hold: FG-06, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-EGV-004-01 | As a citizen, I want to choose delivery to my address or collection at a post office for the document I applied for, so that I receive it near home. | D; REQ-MPC-FR-335 | On hold: FG-06, T-MISS |
| US-EGV-004-02 | As an agency officer, I want to hand the issued document to the delivery network from the application, so that delivery starts without re-entering data. | D; REQ-MPC-FR-335 | On hold: FG-06, T-MISS |
| US-EGV-004-03 | As a citizen, I want to track my document until it is delivered or ready for collection, so that I know when and where to get it. | REQ-MPC-FR-335 | On hold: FG-06, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-EGV-004-01-01 | US-EGV-004-01 | **Given** a service with a physical output is set with shipping enabled and the delivery methods and pickup points allowed for it, **when** the citizen checks out, **then** the native shipping step offers the allowed delivery methods (fee from LOG-002) and collection at the allowed pickup points (Pickup.PickupInStore). | REQ-MPC-FR-335; FIT (Product.IsShipEnabled, Pickup.PickupInStore) |
| AC-EGV-004-02-01 | US-EGV-004-02 | **Given** an application is Issued, **when** the officer selects Hand over for delivery, **then** a native shipment is created for the order line with the tracking number from LOG (S10 or carrier, LOG-020 / LOG-021) and the application history records the hand-over. | REQ-MPC-FR-335; FIT (IShipmentService) |
| AC-EGV-004-02-02 | US-EGV-004-02 | **Given** an application is not Issued, **when** anyone submits shipment creation for its order line (admin AddShipment or any code calling IShipmentService.InsertShipmentAsync), **then** the EGV shipment-guard provider (IC-ORD-11) registered with the ORD-010 shipment-guard host refuses it: the host action filter on Admin OrderController.AddShipment [POST] shows message Egv.ShipmentNotAllowed before the call, and the host InsertShipmentAsync override refuses the insert for other callers; no shipment is saved (BR-EGV-008). | Proposed; OVR-REG; FIT (ShipmentService.InsertShipmentAsync; Admin OrderController.AddShipment) |
| AC-EGV-004-03-01 | US-EGV-004-03 | **Given** a shipment exists, **when** the citizen opens the application or the order, **then** the tracking number and shipment status are shown (native shipment details) with events from TRK-002. | REQ-MPC-FR-335; FIT |
| AC-EGV-004-03-02 | US-EGV-004-03 | **Given** collection was chosen and the document reaches the outlet, **when** outlet staff mark it ready, **then** native ReadyForPickupAsync runs and the native ShipmentReadyForPickup.CustomerNotification is sent. | REQ-MPC-FR-335; FIT (ShipmentReadyForPickupEvent) |
| AC-EGV-004-03-03 | US-EGV-004-03 | **Given** the citizen collects or the courier delivers, **when** staff confirm with the recipient identity check required by the service, **then** native DeliverAsync runs, the application becomes Closed and the identity check is recorded. | REQ-MPC-FR-335; Proposed (identity check) |

**Business rules applied:** BR-EGV-008 (§8.1).


### 7.5 PRD-EGV-005 Government fee collection

| Item | Value |
|---|---|
| Description (baseline) | Collects government fees and reports what is passed on to each agency. |
| Why it matters | Correct, transparent collection of government revenue. |
| Who benefits | Government agencies; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: FG-06, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-EGV-005-01 | As a member of finance staff, I want each paid government fee to create an amount owed to the agency, so that we know what to remit. | D; REQ-MPC-FR-331 | On hold: FG-06, T-MISS |
| US-EGV-005-02 | As an agency system, I want to be told when a fee is paid for one of my services, so that the agency starts its work without waiting for a report. | REQ-MPC-FR-146 | On hold: FG-06, T-MISS |
| US-EGV-005-03 | As a member of finance staff, I want to batch amounts owed per agency, record the remittance and get the agency confirmation, so that remittance is complete and traceable. | D; REQ-MPC-FR-146 | On hold: FG-06, T-MISS |
| US-EGV-005-04 | As an agency administrator, I want fee collection and remittance reports for my agency in the format the agency requires, so that the agency can reconcile its revenue. | D; REQ-MPC-FR-331 | On hold: FG-06, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-EGV-005-01-01 | US-EGV-005-01 | **Given** an order line of an agency service becomes Paid, **when** the payment is recorded, **then** a RemittanceLine is created with status Due for the fee amount of the line (excluding delivery fees) for that agency (SM-EGV-03, BR-EGV-009). | REQ-MPC-FR-331; FIT (OrderItem, Vendor) |
| AC-EGV-005-02-01 | US-EGV-005-02 | **Given** the agency has an active connector, **when** a RemittanceLine becomes Due, **then** a fee notification (agency, service, application reference, amount, paid date) is queued and sent through IC-EGV-01 NotifyFeePaid; failures are retried by the scheduled task and listed for finance staff. | REQ-MPC-FR-146 |
| AC-EGV-005-03-01 | US-EGV-005-03 | **Given** Due lines exist for an agency, **when** finance staff create a remittance batch for a period, **then** the lines move to Batched and the batch total equals the sum of its lines; audited (AUD-EGV-003). | REQ-MPC-FR-146 |
| AC-EGV-005-03-02 | US-EGV-005-03 | **Given** a batch is Batched, **when** finance staff record the payment reference and date, **then** the lines become Remitted; when the agency confirms (connector or manual entry) they become Confirmed. | REQ-MPC-FR-146 |
| AC-EGV-005-01-02 | US-EGV-005-01 | **Given** a Due line is refunded before batching (PAY-016), **when** the refund completes, **then** the line becomes Reversed and is not batched. | D |
| AC-EGV-005-01-03 | US-EGV-005-01 | **Given** a Remitted or Confirmed line is refunded, **when** the refund completes, **then** a recovery line with the negative amount is created as Due for that agency and appears in the next batch (BR-EGV-009). | Proposed |
| AC-EGV-005-04-01 | US-EGV-005-04 | **Given** an agency report format is configured (columns, file type), **when** the report is run for a period, **then** it lists collected, refunded, remitted and outstanding amounts per service and application reference in that format and can be sent through IC-EGV-01 RemittanceReport. | REQ-MPC-FR-331 |
| AC-EGV-005-04-02 | US-EGV-005-04 | **Given** an agency administrator runs the report, **when** the report is shown, **then** only lines of the own agency are included. | REQ-MPC-FR-331 |

**Business rules applied:** BR-EGV-009; BR-EGV-010; BR-EGV-016 (§8.1).


### 7.6 PRD-EGV-006 Agency administration

| Item | Value |
|---|---|
| Description (baseline) | Each government agency manages its own users, permissions and service processes. |
| Why it matters | Agencies run their own services on the platform. |
| Who benefits | Government agencies |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: FG-06, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-EGV-006-01 | As a client administrator, I want to create an agency with its first administrator, so that the agency can run its own services. | D | On hold: FG-06, T-MISS |
| US-EGV-006-02 | As an agency administrator, I want to add, deactivate and give roles to the users of my agency only, so that the right people do the right work. | D; REQ-MPC-FR-345 | On hold: FG-06, T-MISS |
| US-EGV-006-03 | As an agency administrator, I want to assign the workflow each of my services follows, so that each service runs the agency process. | D; REQ-MPC-FR-345; REQ-MPC-FR-307 | On hold: FG-06, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-EGV-006-01-01 | US-EGV-006-01 | **Given** the client administrator creates a vendor for the agency and an agency administrator user, **when** both are saved, **then** the user has Customer.VendorId = the agency vendor and the AgencyAdmin role; the agency category is created for its services. | D; FIT (Vendor, Customer.VendorId) |
| AC-EGV-006-02-01 | US-EGV-006-02 | **Given** an agency administrator adds a user on the EGV agency-users page, **when** the user is saved, **then** the user VendorId is forced to the administrator agency and only the roles AgencyOfficer or AgencyAdmin can be assigned; audited (AUD-EGV-002). | REQ-MPC-FR-345 |
| AC-EGV-006-02-02 | US-EGV-006-02 | **Given** an agency administrator tries to edit a user of another agency or assign any other role, **when** the request is posted, **then** it is refused with message Egv.NotYourAgency and nothing changes. | REQ-MPC-FR-345 |
| AC-EGV-006-02-03 | US-EGV-006-02 | **Given** an agency user is deactivated, **when** they try to sign in, **then** sign-in is refused (native Customer.Active). | REQ-MPC-FR-345; FIT |
| AC-EGV-006-02-04 | US-EGV-006-02 | **Given** an agency officer without Catalog.ProductsCreateEditDelete, **when** opens the native product edit page, **then** access is denied natively; the officer can view services only. | REQ-MPC-FR-345; FIT ([CheckPermission]) |
| AC-EGV-006-03-01 | US-EGV-006-03 | **Given** ADM-002 workflow definitions exist for the agency, **when** the agency administrator assigns a definition and version to a service, **then** new applications of the service follow that version; applications already submitted keep the version they started with; audited (AUD-EGV-002) — held by WF-ENG. | REQ-MPC-FR-345; REQ-MPC-FR-307; WF-ENG |

**Business rules applied:** BR-EGV-011 (§8.1).


### 7.7 PRD-EGV-007 Digital ID service workflows

| Item | Value |
|---|---|
| Description (baseline) | Configurable application processes for ID and official documents, without hard-coding. |
| Why it matters | New document services are set up quickly. |
| Who benefits | Government agencies; citizens |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + External system + integration plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: FG-06, WF-ENG, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-EGV-007-01 | As an agency administrator, I want to set up an identity or official-document service by configuration only, so that a new document service starts without a software release. | D; REQ-MPC-FR-350 | On hold: FG-06, WF-ENG, T-MISS |
| US-EGV-007-02 | As a citizen, I want to apply for an ID or official document online through the same application flow, so that I follow one familiar process. | D; REQ-MPC-FR-350 | On hold: FG-06, WF-ENG, T-MISS |
| US-EGV-007-03 | As an agency officer, I want workflow steps that check or register data in the identity system where the service needs it, so that the issued document matches the national record. | D | On hold: FG-06, WF-ENG, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-EGV-007-01-01 | US-EGV-007-01 | **Given** the service is defined as an EGV-001 service with its required documents and an ADM-002 workflow definition, **when** it is published, **then** citizens can apply and the application follows the workflow; no code specific to the service exists (BR-EGV-012) — held by WF-ENG. | REQ-MPC-FR-350; WF-ENG |
| AC-EGV-007-02-01 | US-EGV-007-02 | **Given** an identity-document service is published, **when** a citizen applies, **then** the EGV-002 flow applies unchanged: documents, fee, review, decision, issue and delivery. | REQ-MPC-FR-350 |
| AC-EGV-007-03-01 | US-EGV-007-03 | **Given** an External check step of the ADM-002 workflow definition names the EGV identity adapter operation VerifyOrRegister (IC-EGV-02; AC-ADM-002-07-03), **when** the step runs, **then** the request is sent through IC-EGV-02 VerifyOrRegister; the result (IC-IAM-02 values Verified, NotVerified, Inconclusive or Unavailable) and the external reference are stored on the application history and in the case variables; any result other than Verified stops the step and alerts the officer. | D; decision ONE-RECORD (result values); Proposed |
| AC-EGV-007-01-02 | US-EGV-007-01 | **Given** the identity service is not in the priority list received from Malawi Post, **when** the list is applied, **then** no identity service is configured (REQ-MPC-FR-350 "if included"). | REQ-MPC-FR-350 |

**Business rules applied:** BR-EGV-012 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-EGV-001 | A government service is a native product of the agency vendor: price = fee; full description = process; each required document = a required FileUpload product attribute; shipping enabled only when the service has a physical output. | EGV-001 | D; FIT |
| BR-EGV-002 | Changes to a service affect only applications submitted after the change; submitted applications keep fee, documents and workflow version. | EGV-001, EGV-006 | FIT (order item prices stored at placement); Proposed |
| BR-EGV-003 | An application moves out of AwaitingFee only when its order PaymentStatus is Paid (changed only by PAY through IOrderProcessingService); a consumer of OrderPaidEvent starts the move and a scheduled reconciliation task repairs any missed move, because consumer exceptions are swallowed. | EGV-002 | FIT (EventPublisher; PAY BR-PAY-010) |
| BR-EGV-004 | Files of e-Government applications are served only to the uploading citizen, users of the owning agency and administrators. EGV enforces this only as a rule provider to the single SEC-002 download ownership filter (GetFileUpload and admin DownloadFile, BR-SEC-005); upload type and size are enforced on the server by ADM-008 under the EGV upload context (BR-ADM-060). EGV registers no upload or download action filter of its own. | EGV-002 | REQ-MPC-FR-333; decision SINGLE-FILTER; FIT (GetFileUpload and UploadFileProductAttribute gaps) |
| BR-EGV-005 | An application can be Approved only when every required document is Accepted and every workflow step before approval is complete. | EGV-002 | D; Proposed |
| BR-EGV-006 | Every decision on a document or application records who, when and the reason (mandatory for reject and resubmission). | EGV-002 | Proposed; NFR-X-003 |
| BR-EGV-007 | An appointment is a CAT-027 direct booking linked to one application; it is created with IC-CAT-07 Book and released with IC-CAT-07 Release; a change is a release and a new booking. CAT enforces slot capacity (BR-CAT-021). | EGV-003 | D; depends on PRD-CAT-027 |
| BR-EGV-008 | A shipment for an e-Government order line can be created only when its application is Issued. EGV enforces this only as a guard provider (IC-ORD-11) to the ORD-010 shipment-guard host (single IShipmentService.InsertShipmentAsync override and AddShipment action filter, OVR-REG); EGV registers no override or filter of its own for shipments. | EGV-004 | Proposed; OVR-REG |
| BR-EGV-009 | A RemittanceLine is created per paid order line of an agency service for the fee amount (delivery fees excluded); refunds before batching reverse the line; refunds after remittance create a negative recovery line. | EGV-005 | REQ-MPC-FR-331; Proposed (reversal and recovery) |
| BR-EGV-010 | Remittance reports and batches are per agency; agency users see only their own agency. | EGV-005 | REQ-MPC-FR-331 |
| BR-EGV-011 | Agency users are limited to their own agency by Customer.VendorId; agency administrators can assign only the AgencyOfficer and AgencyAdmin roles and only to users of their own agency. | EGV-006 | REQ-MPC-FR-345; FIT (vendor scoping) |
| BR-EGV-013 | Every EGV adapter setting that holds a credential, key or token is stored encrypted and flagged secret in the key catalogue, so the pack loader refuses it and exports omit it (BR-PLT-013). | EGV-005, EGV-007 | CFG-01; PLT (BR-PLT-013) |
| BR-EGV-014 | Every EGV page, widget, admin action, callback and scheduled task checks the feature state of the PRD feature it serves through IC-PLT-02 IsEnabled (setting productfeature.<prd-id>, store value else client value) before it runs for a store; when off, nothing is shown and tasks skip that store. | EGV-001 to EGV-007 | Proposed ( PLT, IC-PLT-02) |
| BR-EGV-015 | Every new EGV setting key (EgovSettings and adapter settings) is listed in the EGV plugin key catalogue with key, type, layer, secret flag and default, so pack validation accepts it (PLT-003, NFR-X-008). Keys are listed in §10. | EGV-001 to EGV-007 | Proposed ( PLT) |
| BR-EGV-016 | EGV sends no message itself. Customer and staff notifications are sent by TRK-005 through IC-TRK-04 SendEvent with event codes EGV registers through IC-TRK-04 RegisterEventCode at installation (names Proposed, listed in BR-TRK-023): Egv.Status.* (application status), Egv.Core.ResubmissionRequested, Egv.Core.ApplicationToReview, Egv.Core.AppointmentConfirmed, Egv.Core.AppointmentChanged, Egv.Core.AppointmentReminder, Egv.Core.FeeNotificationFailed; TRK-006 opt-outs apply. For OrderCompleted.CustomerNotification EGV supplies its order kind through IC-TRK-05; TRK-005 applies the per-client action (BR-TRK-024). | EGV-002, EGV-003, EGV-005 | Decision MSG-ROUTE; Proposed (code names) |
| BR-EGV-012 | No code is specific to one government service: services differ only by catalogue data, required documents, workflow definition and connector configuration. | EGV-007 | REQ-MPC-FR-350 ("without hardcoding"); NFR-X-008 |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-EGV-01 | ServiceApplication | (none) | order placed with an e-Government service line | required documents present | AwaitingFee | ApplicationDocument records created |
| SM-EGV-01 | ServiceApplication | AwaitingFee | order PaymentStatus becomes Paid | — | UnderReview | officer queue; citizen notified |
| SM-EGV-01 | ServiceApplication | AwaitingFee | order cancelled | — | Cancelled | citizen notified |
| SM-EGV-01 | ServiceApplication | UnderReview | officer requests resubmission | a document Rejected with reason | ResubmissionRequested | citizen notified (Egv.ResubmissionRequested) |
| SM-EGV-01 | ServiceApplication | ResubmissionRequested | citizen uploads replacement | ADM-008 checks passed | UnderReview | new document version |
| SM-EGV-01 | ServiceApplication | UnderReview | officer approves | BR-EGV-005 | Approved | citizen notified |
| SM-EGV-01 | ServiceApplication | UnderReview | officer rejects with reason | EGov.Applications.CreateEditDelete | Rejected | refund requested through a RET-005 trigger if the service setting is on |
| SM-EGV-01 | ServiceApplication | Approved | officer records issued document reference | — | Issued | EGV-004 if physical output |
| SM-EGV-01 | ServiceApplication | Issued | no physical output | — | Closed | — |
| SM-EGV-01 | ServiceApplication | Issued | shipment delivered or collected (DeliverAsync) | identity check recorded | Closed | — |
| SM-EGV-02 | ApplicationDocument | (none) | file uploaded | ADM-008 type and size checks passed | Uploaded | Download stored; ownership recorded by SEC-002 |
| SM-EGV-02 | ApplicationDocument | Uploaded | officer accepts | — | Accepted | AUD-EGV-001 |
| SM-EGV-02 | ApplicationDocument | Uploaded | officer rejects with reason | — | Rejected | AUD-EGV-001 |
| SM-EGV-02 | ApplicationDocument | Rejected | citizen uploads replacement | checks passed | Replaced | new Uploaded version created |
| SM-EGV-03 | RemittanceLine | (none) | fee line paid | — | Due | fee notification queued |
| SM-EGV-03 | RemittanceLine | Due | added to a batch | EGov.Remittance.CreateEditDelete | Batched | AUD-EGV-003 |
| SM-EGV-03 | RemittanceLine | Due | refund before batching | — | Reversed | — |
| SM-EGV-03 | RemittanceLine | Batched | payment reference recorded | — | Remitted | AUD-EGV-003 |
| SM-EGV-03 | RemittanceLine | Remitted | agency confirmation | — | Confirmed | — |
| SM-EGV-03 | RemittanceLine | Remitted / Confirmed | refund after remittance | — | Remitted / Confirmed (unchanged) | negative recovery line created as Due |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| ServiceApplication (new) | Id, OrderId, OrderItemId, VendorId (agency), CustomerId, Status (SM-EGV-01), WorkflowDefinitionId, WorkflowVersion, WorkflowCaseId (IC-ADM-01), BookingId (EGV-003), IssuedReference, IdentityCheck, RowVersion, StatusHistory | EGV-002 to EGV-004, EGV-007 | Fee, payment and order status stay on the native Order / OrderItem |
| ApplicationDocument (new) | Id, ApplicationId, ProductAttributeMappingId, DownloadId, Version, Status (SM-EGV-02), Reason, DecidedBy, DecidedOnUtc | EGV-002 | File content in native Download; upload owner in SEC-002 UploadOwnership (BR-SEC-005); EGV keeps no upload-owner table |
| EgvServiceConfig (new) | ProductId, WorkflowDefinitionCode, WorkflowVersion, RefundOnRejection | EGV-001, EGV-002, EGV-006 | Per-service EGV configuration; the service itself is a native Product (Proposed) |
| RemittanceLine / RemittanceBatch (new) | Line: Id, VendorId, OrderItemId, Amount, Type (Fee / Recovery), Status (SM-EGV-03), BatchId; Batch: VendorId, PeriodFrom, PeriodTo, Total, PaymentReference, RemittedOnUtc, ConfirmedOnUtc | EGV-005 | |
| AgencyReportFormat (new) | VendorId, Columns, FileType, ConnectorSystemName | EGV-005 | Format per agency, not stated in source |
| Agency (native) | Vendor + Customer.VendorId + Category | EGV-001, EGV-006 | Native; no new agency entity |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| e-Government pack settings | Agency, service catalogue, fee schedules | vertical (e-Gov pack) → client | EGV-001 / EGV-005 | e-Government pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Agencies and agency categories | Vendor, Category (native) | client | — | Not stated (Table 13, T-MISS) |
| Services, fees, required documents, delivery options | Product, ProductAttributeMapping, shipping methods, pickup points (native) | client | — | Not stated (Table 13, T-MISS) |
| Refund on rejection, per service | EgvServiceConfig.RefundOnRejection (new) | client | — | Not stated |
| Appointment reminder lead time | EgovSettings (new): egovsettings.appointmentreminderleadhours (key name Proposed; EGV key catalogue, BR-EGV-015); templates in TRK-005 | client | — | Not stated |
| Connector timeouts and retry counts | EgovSettings (new): egovsettings.connectortimeoutseconds, egovsettings.connectorretrycount (key names Proposed; BR-EGV-015) | client | — | Not stated |
| Feature state per client and store | productfeature.<prd-id> for PRD-EGV-001 to PRD-EGV-007 (PLT-022, IC-PLT-02) | client → store | — | Not stated |
| Agency connectors and report formats | EGV adapter settings (credentials encrypted and flagged secret, BR-EGV-013), AgencyReportFormat (new) | client instance only | — | Not stated |
| Agency role permissions mapping | PermissionRecordCustomerRoleMapping via IAM-007 role pack (BR-IAM-053) | vertical (e-Gov pack) → client | — | Proposed |
| Upload context for application documents (allowed types, size, scan) | ADM-008 UploadPolicySettings (owner ADM-008, BR-ADM-060) | client | — | Not stated |
| Action for OrderCompleted.CustomerNotification on e-Government orders (send, suppress, substitute) | TRK settings (owner TRK-005, BR-TRK-024) | vertical (e-Gov pack) → client | — | Not stated (open item) |
| Workflow definition per service | ADM-002 definitions (WF-ENG); assignment in EgvServiceConfig (new) | client | — | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | e-Government service page (fee, documents, process, delivery options) | EGV-001 | Native product page; e-Gov template Proposed |
| Storefront — My account | Applications: status, history, resubmission upload, appointment, tracking | EGV-002 to EGV-004 | New |
| Admin (agency scope) | Application queue and review (documents, decisions, issue, hand-over) | EGV-002, EGV-004 | New |
| Admin (agency scope) | Agency users and roles; workflow per service | EGV-006, EGV-007 | New |
| Admin | Remittance lines, batches, agency reports and connector status | EGV-005 | New |
| Outlet / agent | Appointment check-in; document collection hand-over | EGV-003, EGV-004 | New (with LOG-003 outlet screens) |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Egv.ResubmissionRequested | The agency needs a new copy of one of your documents. Please see the reason and upload it again. | AC-EGV-002-03-01 |
| Egv.DocumentsNotAccepted | All required documents must be accepted before the application can be approved. | AC-EGV-002-03-03 |
| Egv.Status | Status texts per application status (Egv.Status.AwaitingFee, .UnderReview, .ResubmissionRequested, .Approved, .Rejected, .Issued, .Closed, .Cancelled). | AC-EGV-002-04-02 |
| Egv.NoSlotAvailable | No appointment is available at the moment. Please try again later or contact us. | AC-EGV-003-01-02 |
| Egv.WorkflowRequired | This service cannot be applied for at the moment. | AC-EGV-001-02-05 |
| Egv.ShipmentNotAllowed | The document cannot be sent before it is issued. | AC-EGV-004-02-02 |
| Egv.NotYourAgency | You can manage only users of your own agency. | AC-EGV-006-02-02 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Agency systems (EGV-005) | NotifyFeePaid, RemittanceReport, RemittanceConfirmation (IC-EGV-01) | Not named (per agency) | Formats not stated |
| Identity systems (EGV-007) | VerifyOrRegister (IC-EGV-02) | Not named | Conditional on Table 13; results in IC-IAM-02 values |
| Delivery network (EGV-004) | Shipment, tracking number, delivery events | LOG-020 / LOG-021, TRK-002 (internal) | EGV creates the native shipment |
| Workflow engine (EGV-002, EGV-006, EGV-007) | StartCase, CompleteTask / Signal (IC-ADM-01); External check steps call IC-EGV-02 (AC-ADM-002-07-03) | ADM-002 (internal, WF-ENG) | Applications run as cases |
| Appointments (EGV-003) | IC-CAT-07 Book, Release | CAT-027 (internal) | CAT owns bookings and slot capacity (BR-CAT-021) |
| File access and upload policy (EGV-002) | Rule provider to the SEC-002 download ownership filter; upload context registered with ADM-008 | SEC-002, ADM-008 (internal, decision SINGLE-FILTER) | IC-SEC-05 provider; IC-ADM-08 RegisterUploadContext with a resolver on UploadFileProductAttribute |
| Notifications (EGV-002, EGV-003, EGV-005) | IC-TRK-04 RegisterEventCode, SendEvent; IC-TRK-05 order-kind provider | TRK-005 (internal) | Decision MSG-ROUTE; BR-TRK-024 |
| Refund triggers (EGV-002) | RaiseRefundTrigger (IC-RET-04), source type ApplicationRejected | RET-005 (internal) | RET-005 sends the refund to PAY-016 |
| Shipment guard (EGV-004) | Guard provider (IC-ORD-11) to the ORD-010 shipment-guard host | ORD-010 (internal, OVR-REG) | IC-ORD-11 defined by ORD-010 (BR-ORD-055) |
| Cart rule (EGV-001) | Cart-rule provider (IC-CHK-01) | CHK-003 IShoppingCartService owner (internal, OVR-REG) | |
| Audit trail (all features) | IAuditTrail.WriteAsync (IC-SEC-01) | SEC-004 (internal) | |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-EGV-01 | NotifyFeePaid | Agency, service, application reference, amount, currency, paid date | Acknowledged | Agency unavailable (retried by task) | EGV agency connector (new interface); queued record sent by an IScheduleTask |
| IC-EGV-01 | RemittanceReport | Agency, period, lines in the configured format | Acknowledged or file reference | Agency unavailable; format rejected | EGV agency connector; file generated by the EGV report service |
| IC-EGV-01 | RemittanceConfirmation | Agency payload on the EGV callback route | Batch confirmed | Signature invalid (rejected, audited) | Plugin controller deriving from Microsoft.AspNetCore.Mvc.Controller on its own route (IRouteProvider), no antiforgery attribute (PayPalCommerceWebhookController pattern) |
| IC-EGV-02 | VerifyOrRegister | Application reference, identity data required by the step | Result (IC-IAM-02 values: Verified / NotVerified / Inconclusive / Unavailable), external reference | Not found; system unavailable (returned as Unavailable) | EGV identity connector (system not named); called by an ADM-002 External check step (AC-ADM-002-07-03) |

Connectors are interfaces defined by the EGV plugin; one adapter per agency or identity system declares the operations it supports. Signatures are produced at L2 build start and approved by the tech lead. Timeouts and retry counts are settings with defaults not stated. EGV implements contracts owned by other modules: IC-ORD-11 shipment guard provider (host and contract owner ORD-010, BR-ORD-055), IC-CHK-01 cart check provider (CHK-003), IC-TRK-05 order-kind provider (TRK-005; returns order kind e-Government when every line is an e-Government service line, otherwise none), and the rule provider of the SEC-002 download ownership filter (IC-SEC-05). EGV calls IC-ADM-01, IC-ADM-08 (RegisterUploadContext), IC-CAT-07, IC-RET-04, IC-TRK-04, IC-PLT-02 and IC-SEC-01.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| ServiceRequest.Submitted | None (EGV module event) | INT-003 delivers it as service_request.submitted; TRK-005 notifications |
| Application fee paid | OrderPaidEvent (native) | EGV consumer starts AwaitingFee → UnderReview; reconciliation task repairs misses; RemittanceLine created by the EGV service |
| Refund completed | OrderRefundedEvent (native) | EGV consumer enqueues remittance reversal or recovery |
| Order cancelled | OrderStatusChangedEvent (native) | EGV consumer enqueues the move to Cancelled |
| Document ready for collection / delivered | ShipmentReadyForPickupEvent, ShipmentDeliveredEvent (native) | Application history; Closed on delivery |
| Shipment creation guard | EGV guard provider (IC-ORD-11) called by the ORD-010 shipment-guard host: single IShipmentService.InsertShipmentAsync override + Admin OrderController.AddShipment [POST] action filter (BR-ORD-055, OVR-REG) | Refuses shipments for applications not Issued (BR-EGV-008) |
| File upload / download guard | EGV upload context in the ADM-008 upload policy (BR-ADM-060); EGV rule provider to the SEC-002 ownership filter on DownloadController.GetFileUpload and Admin DownloadController.DownloadFile (BR-SEC-005) | Server-side type and size check by ADM-008; access restriction (BR-EGV-004); EGV registers no action filter of its own on these actions (decision SINGLE-FILTER) |
| Order completed message | IC-TRK-05 order-kind provider called by the TRK-005 engine | Returns order kind e-Government; TRK-005 applies the per-client action (BR-TRK-024) |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two officers decide the same application | EGV-002 | ServiceApplication carries its own row version (plugin table); the second save is refused and reloaded |
| Refund and batching of the same line at once | EGV-005 | Both run under ILocker key 'egv-remit-{VendorId}'; whichever runs second re-reads the line status (Due, Batched) and acts per SM-EGV-03 |
| Payment callback and cancellation of an unpaid application order | EGV-002 | PAY and INV-004 order lock (BR-PAY-013) decides the order outcome; EGV follows the resulting order state through the reconciliation task |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Application status change | Citizen | Channels per TRK-005 (Egv.Status.*; IC-TRK-04, BR-EGV-016) | EGV-002 |
| Resubmission requested | Citizen | Email + SMS | EGV-002 |
| New application to review | Agency officers of the agency | Admin notification through TRK-005 (BR-EGV-016) | EGV-002 |
| Appointment confirmation, change, reminder | Citizen | Email + SMS | EGV-003 |
| Document ready for collection | Citizen | Native ShipmentReadyForPickup.CustomerNotification + SMS | EGV-004 |
| Fee notification failed after retries | Finance staff | Admin notification | EGV-005 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Fee collection and remittance per agency (collected, refunded, remitted, outstanding) | EGV-005 | REQ-MPC-FR-331 |
| Applications by service and status | EGV-002 | D |
| e-Government usage by agency (BI) | RPT-012 (RPT module) | see RPT-012 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-EGV-001 | Document or application decision; appointment check-in | Agency officer / outlet staff | ApplicationDocument, ServiceApplication | old status, new status, reason |
| AUD-EGV-002 | Agency user created, deactivated or role changed; workflow assigned | Agency administrator | Customer, ServiceApplication config | old values, new values |
| AUD-EGV-003 | Remittance batch created, remitted, confirmed | Finance staff | RemittanceBatch | total, lines, payment reference |

Business audit events AUD-EGV-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new entity values are captured by the SEC IRepository<> decorator and need no call. All EGV tables are written through IRepository<>; EGV writes nothing through INopDataProvider directly (BR-SEC-010, BR-SEC-011). Denied file access is logged by SEC-002 (BR-SEC-005), not by EGV. The native activity log is not used as the audit record. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-EGV-001 | Application files are served only to the owner, the owning agency and administrators; type and size are checked on the server. | REQ-MPC-FR-333 | AC-EGV-002-02-01, 002-02-03; T-EGV-02 |
| NFR-EGV-002 | Application files are encrypted in transit; encryption at rest is a database or hosting function (external). | REQ-MPC-FR-333 ("secure storage") | Hosting check (project service) |
| NFR-EGV-003 | Every decision and agency-user change is audited (NFR-X-003). | Proposed | §14.2 audit events |
| NFR-EGV-004 | Response-time, volume and availability targets for e-Government services: Not stated in source — requires confirmation. | NFR-X-009; MG-13 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-EGV-001 | P1 | — | |
| PRD-EGV-002 | P1 | PRD-ADM-002 | |
| PRD-EGV-003 | P1 | PRD-CAT-027 | |
| PRD-EGV-004 | P1 | PRD-ORD-010 | |
| PRD-EGV-005 | P1 | — | |
| PRD-EGV-006 | P1 | — | |
| PRD-EGV-007 | P1 | PRD-ADM-002 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-EGV-01 | End-to-end: apply, upload, pay, review, resubmit, approve, issue, deliver and collect for one sample service per output type. |
| T-EGV-02 | File security: request every uploaded file as another customer, another agency and an anonymous visitor; all are denied; a disallowed file type posted directly to the upload endpoint is refused. |
| T-EGV-03 | Remittance: totals of batches equal the sum of lines; refunds before and after remittance produce the right reversal or recovery. |
| T-EGV-04 | Agency scope: an agency user sees no service, application or report line of another agency. |
| T-EGV-05 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-EGV-06 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
