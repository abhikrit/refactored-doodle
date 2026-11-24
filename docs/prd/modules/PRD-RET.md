# L2 Module PRD — RET: Returns, refunds and disputes

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | RET — Returns, refunds and disputes |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets customers return items from their orders under rules set by the client and its sellers, moves the returned items back to the right place, records the inspection, starts the refund automatically through the payment module, applies return fees, and runs one case file for order issues and disputes with evidence, timed steps, remedies the customer accepts, escalation and buyer-seller mediation. It also keeps the case records for the required period and reports on them. RET never moves money: every refund is requested from PRD-PAY-016.

**In scope**

- Return requests on the native nopCommerce return function, extended with several evidence files and status detail (RET-001)
- Return eligibility rules by category, seller and product (RET-002)
- Return logistics: shipping models, pickup or drop-off, labels or instructions, tracking reference, routing to the destination (RET-003)
- Inspection of returned items with condition, photos and outcome; restocking through the native returned-quantity path (RET-004)
- Automatic refund requests to PAY-016 on accepted returns, paid-order cancellations and service failures, at item level (RET-005)
- Restocking and return-delivery fees (RET-006)
- Dispute and order-issue cases: evidence including proof of delivery, decision, remedy accepted by the customer, timed steps, escalation; case service used by PAY-007, PAY-035 and PAY-036 (RET-007)
- Dispute time limits, triage, escalation matrix and export of the case file to external bodies (RET-008)
- Retention of return and dispute records and periodic reports (RET-009)
- Seller review of return requests (RET-010) and buyer-seller messaging with moderation and mediation (RET-011)

**Not in this module**

| Item | Where it is |
|---|---|
| Refund money movement, refund approval threshold, refund to wallet, native order refund status | PAY module (PRD-PAY-016, BR-PAY-080 to BR-PAY-083); RET requests the refund through IC-RET-02 |
| Display of the returns summary and the dispute explanation on product and order pages | CAT module (PRD-CAT-031); RET supplies the policy topics |
| Carrier booking, labels and tracking operations | LOG module (PRD-LOG-021 carrier framework, LOG-007 labels, LOG-011 logistics tasks); tracking events through TRK-002 |
| Proof-of-delivery record | LOG module (PRD-LOG-012); RET links it to cases |
| Help-desk tickets, ticket-to-case links, complaint process and its escalation matrix | CRM module (PRD-CRM-001, CRM-006, CRM-004) |
| Time-limit (SLA) timer component and escalation levels | CRM module (PRD-CRM-014, Proposed single owner); RET-007, RET-008 and RET-010 configure and use it |
| Retention rules engine and purge jobs | PLT module (PRD-PLT-020); RET registers its record types |
| Workflow engine for case steps | ADM module (PRD-ADM-002, decision WF-ENG) |
| Upload scanning and file-type controls | ADM module (PRD-ADM-008) |
| Stock movements for restocked returns | INV module (IC-INV-01 PostMovement, reason Return) |
| Delivery SLA and pickup deadline standards | ORD module (PRD-ORD-011) and LOG module (PRD-LOG-017) |
| Return dashboards in the external BI tool | RPT module (PRD-RPT-010) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-RET-001 | Return requests | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-RET-002 | Return eligibility rules | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-RET-003 | Return logistics | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | T-MISS |
| PRD-RET-004 | Return inspection | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-RET-005 | Automatic refund trigger | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-PAY-016 | |
| PRD-RET-006 | Return fees | B2B + B2C | P1 | Code-level | Custom plugin | Commerce extensions pack | | |
| PRD-RET-007 | Dispute and issue cases | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002, PRD-CRM-014 | WF-ENG |
| PRD-RET-008 | Dispute SLAs and escalation | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-ADM-002, PRD-RET-007, PRD-CRM-014 | WF-ENG |
| PRD-RET-009 | Case retention and reports | B2B + B2C | P1 | Code-level | Custom plugin | Service desk extensions pack | | |
| PRD-RET-010 | Seller return review | Seller / back-office | P1 | Code-level | Custom plugin | Marketplace pack | PRD-RET-001, PRD-CRM-014 | |
| PRD-RET-011 | Buyer–seller mediation | B2B + B2C | P1 | Code-level | Custom plugin | Marketplace pack | PRD-RET-007 | WF-ENG |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (registered) | Requests returns, uploads evidence, chooses pickup or drop-off, follows status, raises issues and disputes, accepts or rejects remedies, messages the seller in a case | Registered (native); the native return pages require a registered customer who owns the order |
| Seller | Reviews and answers return requests for own products, inspects returns where the client allows, replies in dispute cases — through RET seller endpoints only | Vendors (native); no native return-request permission is granted to Vendors |
| Member of support staff | Works return requests and cases, records decisions, moderates case messages, escalates | Role system name "Support" (BR-IAM-050) |
| Support manager | Sets time limits, triage rules and escalation, decides escalated cases, exports case files, reads reports | Role system name "SupportManager" (BR-IAM-050) |
| Member of warehouse or outlet staff | Receives returned items and records the inspection | Role system names "Warehouse" and "Agent" (BR-IAM-050; Agent from IAM-026) |
| Member of finance staff | Approves refunds above the PAY threshold (in PAY-016); sees the refund state on the return | Role system name "Finance" (BR-IAM-050) |
| Client administrator | Configures return window, reasons, actions, eligibility rules, shipping models, fees, issue types, policies | Administrators (native) |
| Carrier (system) | Books return pickups, issues labels and tracking events | External system via LOG-021 adapter |
| External dispute body | Receives the exported case file when a case is escalated outside the client (for example MACRA, named as an example in REQ-MPC-FR-247) | External; no system integration stated |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Orders.ReturnRequestsView (native) | Orders | See the admin return-request list and details | Administrators, Support, SupportManager |
| Orders.ReturnRequestsCreateEditDelete (native) | Orders | Edit return requests in admin; with RET installed every status change is checked against SM-RET-01 (BR-RET-001) | Administrators, Support, SupportManager |
| Configuration.ManageSettings (native) | Configuration | Maintain return reasons and actions (native lists) and the native return settings | Administrators |
| Returns.Core.Rules.CreateEditDelete | Configuration | Edit eligibility rules, shipping models, destination rules, fee rules, issue types, condition grades, triage rules | Administrators |
| Returns.Core.Inspection.CreateEditDelete | Orders | Record receipt and inspection of returned items | Warehouse, Agent, Support |
| Returns.Core.Cases.View | Orders | See dispute and issue cases, evidence and case log | Support, SupportManager |
| Returns.Core.Cases.CreateEditDelete | Orders | Open cases, add evidence, propose remedies, record decisions, escalate internally | Support, SupportManager |
| Returns.Core.Cases.Moderate | Orders | Hide or release case messages; join a case as mediator | Support, SupportManager |
| Returns.Core.Cases.ExternalEscalation | Orders | Escalate a case to an external body and export the case file | SupportManager |
| Returns.Core.Seller.Review | Orders | Seller list and actions for returns and cases of own products (vendor-scoped endpoints) | Vendors |
| Returns.Core.Reports.View | Reports | Run and download return and dispute reports | SupportManager, Administrators |
| Returns.Core.PublicStore.Cases | PublicStore | Raise order issues and disputes, accept or reject remedies, post case messages from My account | Registered |

Permissions are declared in a RET plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix Returns.Core and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs:32-33); Category is taken from the native set (Orders, Configuration, Reports, PublicStore). Default roles are given by role system name. Every role used here (Support, SupportManager, Warehouse, Agent, Finance) is in the IAM product role catalogue BR-IAM-050; the IAM plugin creates catalogue roles that are missing, at install and at start (BR-IAM-050). RET creates no role and does not rely on native start-up to create one. The native permissions Orders.ReturnRequestsView and Orders.ReturnRequestsCreateEditDelete are granted only to Administrators by default (DefaultPermissionConfigManager) and must never be granted to Vendors: the admin ReturnRequestController has no vendor filter, so a vendor holding them would see every return in the store (BR-RET-090). All plugin permission names are Proposed. Source: Libraries/Nop.Services/Security/DefaultPermissionConfigManager.cs; Presentation/Nop.Web/Areas/Admin/Controllers/ReturnRequestController.cs.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-RET-PERM-01 | **Given** a user without Orders.ReturnRequestsView (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-02 | **Given** a user without Orders.ReturnRequestsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-03 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-04 | **Given** a user without Returns.Core.Rules.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-05 | **Given** a user without Returns.Core.Inspection.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-06 | **Given** a user without Returns.Core.Cases.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-07 | **Given** a user without Returns.Core.Cases.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-08 | **Given** a user without Returns.Core.Cases.Moderate, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-09 | **Given** a user without Returns.Core.Cases.ExternalEscalation, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-10 | **Given** a user without Returns.Core.Seller.Review, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-11 | **Given** a user without Returns.Core.Reports.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RET-PERM-12 | **Given** a user without Returns.Core.PublicStore.Cases, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-RET-001 | Return settings moved from OrderSettings to ReturnRequestSettings (Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs): ReturnRequestsEnabled, NumberOfDaysReturnRequestAvailable, ReturnRequestsAllowFiles, ReturnRequestsFileMaximumSize, plus new GuestReturnRequestsAllowed (:43), ReturnReasonsEnabled, ReturnActionsEnabled, WithdrawalLinkDaysValid (:58), ReturnRequestsForCompletedOrdersOnly, DownloadableProductsReturnRequestsAllowed, UseEuWithdrawalLocales. Guest withdrawal form (Presentation/Nop.Web/Controllers/ReturnRequestController.cs:135, Views/ReturnRequest/Find.cshtml, template RETURN_REQUEST_WITHDRAWAL_LINK_MESSAGE, CaptchaSettings.ShowOnWithdrawalForm). ReturnRequestReason, ReturnRequestAction, ReturnRequestStatus, customer pages, policy via Topic unchanged. | Only one uploaded file per request (ReturnRequest.UploadedFileId, Libraries/Nop.Core/Domain/Orders/ReturnRequest.cs:56); multiple photos would need a plugin. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-002 | Product.NotReturnable and global ReturnRequestSettings (NumberOfDaysReturnRequestAvailable, new ReturnRequestsForCompletedOrdersOnly, DownloadableProductsReturnRequestsAllowed; Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs). No rules by category or vendor (not found in 5.00.1 source). | Eligibility rules by category and by vendor policy (window, conditions), evaluated on the return form. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-003 | None beyond ReturnRequestAction text values. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/ReturnRequestAction.cs] | Return labels/instructions, collection or drop-off booking, routing to outlet/vendor/warehouse; link to shipping/TRK. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-004 | ReturnRequestStatus (Pending, Received, ReturnAuthorized, ItemsRepaired, ItemsRefunded, RequestRejected), StaffNotes, ReturnedQuantity. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/ReturnRequestStatus.cs; src/Libraries/Nop.Core/Domain/Orders/ReturnRequest.StaffNotes] | Inspection record with condition grade, photos, inspector, location and outcome decision. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-005 | Manual full/partial refund from the admin order page through the payment plugin (IPaymentMethod refund support); OrderRefunded templates. No automatic link from return approval or cancellation to refund. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.RefundOrder, PartiallyRefundOrderPopup; src/Libraries/Nop.Core/Domain/Orders/OrderRefundedEvent.cs; PG ADM-S03] | Event consumer on ReturnRequest/Order status change that calls the refund (partial by item) and logs outcome. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-006 | None (no fee on return requests). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/ReturnRequest.cs (no fee fields)] | Restocking and return-delivery fee rules deducted from refund. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-007 | None for disputes. Order notes (OrderNote.DisplayToCustomer) only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderNote.cs; PG CNT-02 (help desk only)] | Dispute case entity, evidence incl. proof of delivery, decision, remedy, customer acceptance, timers, escalation to client policy. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-008 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No dispute entity in src/Libraries/Nop.Core/Domain] | SLA timers, priority triage, escalation path, case-file export. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no SLA/escalation types found in Domain or Services |
| PRD-RET-009 | No retention policy for return requests; GdprSettings.DeleteInactiveCustomersAfterMonths applies to customers only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Gdpr/GdprSettings.DeleteInactiveCustomersAfterMonths; src/Libraries/Nop.Services/Gdpr/DeleteInactiveCustomersTask] | Retention rules and reports for return and dispute cases. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-010 | Return request permissions (RETURN_REQUESTS_VIEW / CREATE_EDIT_DELETE) default to Administrators only (Libraries/Nop.Services/Security/DefaultPermissionConfigManager.cs:45-46); admin ReturnRequestController has no vendor filter. | Vendor-scoped return list, response actions and SLA timers. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RET-011 | ContactVendor form (VendorSettings.AllowCustomersToContactVendors) and private messages (PrivateMessage moved from Forums to Customers domain (Libraries/Nop.Core/Domain/Customers/PrivateMessage.cs) with PrivateMessageSettings (AllowPrivateMessages, NotifyAboutPrivateMessages, ShowAlertForPM; Libraries/Nop.Core/Domain/Customers/PrivateMessageSettings.cs); public PrivateMessagesController stays in core (Presentation/Nop.Web/Controllers/PrivateMessagesController.cs).) are not case-scoped or moderated. | Case-scoped buyer-seller messaging with moderation and record, client mediation. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-RET-001 Return requests

| Item | Value |
|---|---|
| Description (baseline) | Customers ask to return an item within the allowed time, choose a reason and what they want (refund, replacement), attach photos and follow the status; the returns policy is shown. |
| Why it matters | A clear, fair returns process. |
| Who benefits | Shoppers; support staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-001-01 | As a shopper, I want to request a return of items from my order within the allowed time, choosing a reason and what I want (refund, replacement or another configured action), so that I can send back what is wrong. | D; REQ-MPC-FR-226; REQ-MPC-FR-227 | Ready; conditions: SINGLE-FILTER |
| US-RET-001-02 | As a shopper, I want to describe the problem and attach photos, so that staff can judge my return fairly. | D; REQ-MPC-FR-227 | Ready; conditions: SINGLE-FILTER |
| US-RET-001-03 | As a shopper, I want to follow the status of each return request, so that I know what happens next. | D | Ready; conditions: SINGLE-FILTER |
| US-RET-001-04 | As a shopper, I want to read the returns policy where I request a return, so that I know the rules before I ask. | D; REQ-MPC-FR-234 | Ready; conditions: SINGLE-FILTER |
| US-RET-001-05 | As a client administrator, I want to set the return window and the lists of return reasons and requested actions, so that returns follow our policy. | D; REQ-KTDA-RET-001 | Ready; conditions: SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-001-01-01 | US-RET-001-01 | **Given** ReturnRequestSettings.ReturnRequestsEnabled is on, ReturnRequestSettings.ReturnRequestsForCompletedOrdersOnly is on and the order status is Complete, and fewer than ReturnRequestSettings.NumberOfDaysReturnRequestAvailable days have passed since the order was placed (0 = no limit), **when** the shopper opens the order details, **then** the return link is shown, and the return form lists only items whose product is not marked NotReturnable, is not a downloadable product (ReturnRequestSettings.DownloadableProductsReturnRequestsAllowed off) and whose quantity is not already requested in a return request that is not Cancelled. | FIT (5.00.1: OrderProcessingService.IsReturnRequestAllowedAsync, Libraries/Nop.Services/Orders/OrderProcessingService.cs:3157-3182; ReturnRequestService.GetReturnRequestAvailabilityAsync, Libraries/Nop.Services/Orders/ReturnRequestService.cs:123-150; Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:13-68); REQ-MPC-FR-226 |
| AC-RET-001-01-02 | US-RET-001-01 | **Given** the order is not Complete (with ReturnRequestsForCompletedOrdersOnly on) or the window has passed, **when** the shopper calls the return page of that order, **then** no return form is shown and the native controller redirects to the home page; no return request is created. | FIT (5.00.1: ReturnRequestController.ReturnRequest(orderId, token), Presentation/Nop.Web/Controllers/ReturnRequestController.cs:179-205); REQ-MPC-FR-226 |
| AC-RET-001-01-03 | US-RET-001-01 | **Given** RET-002 eligibility rules are active, **when** the return form is prepared, **then** the items listed are those allowed by BR-RET-010 (see RET-002 (REQ-MPC-FR-237)). | Proposed |
| AC-RET-001-01-04 | US-RET-001-01 | **Given** the shopper enters a quantity for one or more items, picks one reason and one action from the configured lists and submits, **when** the request is accepted, **then** one native ReturnRequest is created per item with status Pending (RET status Requested, SM-RET-01) and a quantity capped at the quantity still available for return, a custom number from ReturnRequestSettings.ReturnRequestNumberMask, and the native NewReturnRequest.StoreOwnerNotification and NewReturnRequest.CustomerNotification messages are sent; RET also stores the reason ID and action ID, because the native record keeps only the localised names (BR-RET-002). | FIT (5.00.1: ReturnRequestController.ReturnRequestSubmit, Presentation/Nop.Web/Controllers/ReturnRequestController.cs:209-318: quantity capped at line 267, custom number at 292); REQ-MPC-FR-227; REQ-KTDA-RET-001 |
| AC-RET-001-02-01 | US-RET-001-02 | **Given** ReturnRequestSettings.ReturnRequestsAllowFiles is on, **when** the shopper uploads a file larger than ReturnRequestSettings.ReturnRequestsFileMaximumSize (kilobytes), **then** the upload is refused with the native message ShoppingCart.MaximumUploadedFileSize and nothing is stored. | FIT (5.00.1: ReturnRequestController.UploadFileReturnRequest, Presentation/Nop.Web/Controllers/ReturnRequestController.cs:322-369) |
| AC-RET-001-02-02 | US-RET-001-02 | **Given** the RET evidence upload is enabled, **when** the shopper adds free-text details and several photos before submitting, **then** each file is stored as a native Download and linked to every return request of the submission (ReturnEvidence); the number of files is limited by a RET setting (default not stated) and above the limit message Ret.EvidenceLimit is shown; file type, size and scanning are applied by the ADM-008 upload policy for the upload context "return evidence" that RET registers with ADM-008, so a refused file gets Adm.UploadTypeNotAllowed or Adm.UploadTooLarge and is not stored; RET keeps no file-type check of its own (BR-RET-092). | D (photos); REQ-MPC-FR-227; FIT (native keeps one file per request: ReturnRequest.UploadedFileId); SINGLE-FILTER |
| AC-RET-001-02-03 | US-RET-001-02 | **Given** an evidence file of a return or case exists (native Download referenced by ReturnEvidence or by ReturnRequest.UploadedFileId), **when** anyone requests it through Nop.Web DownloadController.GetFileUpload or Admin DownloadController.DownloadFile with its GUID, **then** the single SEC-002 ownership filter (BR-SEC-005) asks the RET rule provider, which allows the shopper of the order, users of the vendor that owns the returned item, and staff holding Orders.ReturnRequestsView or Returns.Core.Cases.View; anyone else is refused by the SEC-002 filter and nothing is served (BR-RET-092). | SINGLE-FILTER; Proposed; FIT (GetFileUpload(Guid downloadId) and Admin DownloadFile(Guid downloadGuid) serve any Download by GUID without an ownership check) |
| AC-RET-001-03-01 | US-RET-001-03 | **Given** the shopper has return requests, **when** they open My account, Return requests (native CustomerReturnRequests page), **then** each request shows its number, item, quantity, reason, requested action, native status and date, and the RET detail: approval, return shipment and tracking reference, inspection outcome and refund state reported by PAY-016. | D; FIT |
| AC-RET-001-04-01 | US-RET-001-04 | **Given** the client has published the returns-policy topic and set its system name in the RET settings, **when** the shopper opens the return form, **then** the policy text is shown on the form with a link to the full topic; the same topic system name is used by CAT-031 on product and order pages. | D; REQ-MPC-FR-234 |
| AC-RET-001-05-01 | US-RET-001-05 | **Given** the administrator maintains the native return reasons and return actions, **when** they are saved, **then** they appear on the return form in their display order and in the shopper's language. | FIT (ReturnRequestReason, ReturnRequestAction); REQ-KTDA-RET-001 |
| AC-RET-001-05-02 | US-RET-001-05 | **Given** the administrator changes ReturnRequestSettings.NumberOfDaysReturnRequestAvailable (setting key returnrequestsettings.numberofdaysreturnrequestavailable) for a store, **when** an order of that store is checked, **then** the store value applies, otherwise the shared value (StoreId 0). | FIT (setting resolution, L1 §6.5; 5.00.1: Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:33) |
| AC-RET-001-05-03 | US-RET-001-05 | **Given** the product configuration pack is applied to a store, **when** the return settings are read, **then** ReturnRequestSettings.ReturnRequestsForCompletedOrdersOnly, ReturnReasonsEnabled and ReturnActionsEnabled are on, and GuestReturnRequestsAllowed, UseEuWithdrawalLocales and DownloadableProductsReturnRequestsAllowed are off (the 5.00.1 defaults); with ReturnReasonsEnabled or ReturnActionsEnabled off the native submit would store "not available" instead of the chosen reason or action, which BR-RET-002 relies on. | VER-500; FIT (5.00.1: Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:38-68; Libraries/Nop.Services/Installation/InstallRequiredData.cs:1902-1915; Presentation/Nop.Web/Controllers/ReturnRequestController.cs:282-283); Proposed |

**Business rules applied:** BR-RET-001; BR-RET-002; BR-RET-010; BR-RET-091; BR-RET-092 (§8.1).


### 7.2 PRD-RET-002 Return eligibility rules

| Item | Value |
|---|---|
| Description (baseline) | Rules for which items can be returned, by category and by seller policy. |
| Why it matters | Returns follow policy automatically. |
| Who benefits | Clients; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-002-01 | As a client administrator, I want to define which items can be returned, and within which window and conditions, by category, by seller policy and by product, so that returns follow policy automatically. | D; REQ-MPC-FR-237 | Ready; conditions: OVR-REG |
| US-RET-002-02 | As a shopper, I want to be offered only the items I am allowed to return, so that I do not ask for returns that will be refused. | REQ-MPC-FR-237 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-002-01-01 | US-RET-002-01 | **Given** a rule marks category C not returnable, **when** a shopper opens the return form for an order with a product in C, **then** that item is not listed; other eligible items are listed (BR-RET-010). | REQ-MPC-FR-237; FIT (GetReturnRequestAvailabilityAsync is virtual) |
| AC-RET-002-01-02 | US-RET-002-01 | **Given** a seller policy gives vendor V a return window of W days counted from the configured start (order date or delivery date), **when** W days have passed for an order line of V, **then** that line is not listed while lines of other sellers inside their window remain listed. | REQ-MPC-FR-237; D |
| AC-RET-002-01-03 | US-RET-002-01 | **Given** a product is marked NotReturnable (native) and a category rule says returnable, **when** eligibility is evaluated, **then** the product is not returnable: the native flag always wins, then product rule, then seller rule, then category rule, then the global setting (BR-RET-011). | Proposed; FIT (Product.NotReturnable) |
| AC-RET-002-01-04 | US-RET-002-01 | **Given** RET-002 rules set any window, **when** the rules are saved, **then** RET checks that ReturnRequestSettings.NumberOfDaysReturnRequestAvailable is 0 or not shorter than the longest rule window, because the native order-level check runs first; otherwise the save is refused with message Ret.WindowSettingConflict. | FIT (5.00.1: IsReturnRequestAllowedAsync checks the global window before availability, Libraries/Nop.Services/Orders/OrderProcessingService.cs:3169-3182); Proposed |
| AC-RET-002-01-05 | US-RET-002-01 | **Given** a rule has conditions text (for example about the state of the item), **when** the shopper selects that item, **then** the conditions are shown on the form and the shopper must tick a confirmation before submitting. | D (conditions); Proposed |
| AC-RET-002-02-01 | US-RET-002-02 | **Given** a submitted form contains a quantity for an item that is not eligible, or more than the quantity still available, **when** the POST reaches ReturnRequestController.ReturnRequestSubmit, **then** a RET action filter on that action re-checks every line against BR-RET-010, refuses the whole submission, shows the form again with message Ret.ItemNotEligible and creates no ReturnRequest; the IReturnRequestService.InsertReturnRequestAsync override refuses any ineligible insert as a second guard (BR-RET-012). | REQ-MPC-FR-237; FIT (5.00.1: the native submit, Presentation/Nop.Web/Controllers/ReturnRequestController.cs:244-267, skips lines without available quantity and caps each posted quantity at the quantity returned by GetReturnRequestAvailabilityAsync — the RET override, so ineligible lines are already never inserted — but it does so silently and checks ModelState only after inserting (line 314), so a ModelReceivedEvent veto cannot be used and the filter is kept to refuse the whole submission with a message) |
| AC-RET-002-01-06 | US-RET-002-01 | **Given** a rule is created, changed or deleted, **when** it is saved, **then** who, when, old and new values are audited (AUD-RET-002). | Proposed |

**Business rules applied:** BR-RET-010; BR-RET-011; BR-RET-012 (§8.1).


### 7.3 PRD-RET-003 Return logistics

| Item | Value |
|---|---|
| Description (baseline) | How returned items travel back: return labels or instructions, collection from the customer or drop-off, and routing back to the right place. |
| Why it matters | Returns arrive back where they should. |
| Who benefits | Shoppers; logistics staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-003-01 | As a shopper, I want to choose pickup from my address or drop-off at an outlet, and to get a return label or clear instructions, so that I can send the item back easily. | D; REQ-MPC-FR-189; REQ-MPC-FR-246; FC-M15-014 | On hold: T-MISS |
| US-RET-003-02 | As a member of logistics staff, I want a return pickup or drop-off task to be created automatically when a return is approved, with a tracking reference, so that returns are collected without manual set-up. | REQ-MPC-FR-229 | On hold: T-MISS |
| US-RET-003-03 | As a client administrator, I want to configure who pays for return shipping (merchant-paid, customer-paid, shared, client-subsidised) and when each model applies, so that return costs follow policy. | REQ-MPC-FR-228 | On hold: T-MISS |
| US-RET-003-04 | As a member of logistics staff, I want returned items to be routed to the seller, warehouse or outlet that should receive them, so that items arrive back where they should. | D; REQ-MPC-FR-189 | On hold: T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-003-01-01 | US-RET-003-01 | **Given** a return is Approved and its shipping model allows pickup, **when** the shopper chooses pickup and an offered time slot, **then** a pickup booking is requested through the carrier adapter of LOG-021 (IC-RET-03, served by LOG IC-LOG-01 BookReturn where the adapter declares the reverse-booking capability) for the shopper's address, a ReturnShipment is created (SM-RET-03, status Booked) and the booking time is shown to the shopper (message Ret.PickupBooked). | REQ-MPC-FR-189; FC-M15-014 |
| AC-RET-003-01-02 | US-RET-003-01 | **Given** a return is Approved and its shipping model allows drop-off, **when** the shopper chooses drop-off, **then** the outlets that accept returns (StorePickupPoint outlets of LOG-003 with the flag accepts returns, read through LOG IC-LOG-06 GetOutlets with the returns filter) are listed, and message Ret.DropOffInstructions is shown with the return reference. | REQ-MPC-FR-189; REQ-MPC-FR-246 |
| AC-RET-003-01-03 | US-RET-003-01 | **Given** the shipping model of the return requires a label, **when** the booking is confirmed, **then** a return label is generated through LOG-007 and offered as a PDF download on the return page; when no label is required, the instructions of the model are shown instead. | REQ-MPC-FR-246 |
| AC-RET-003-02-01 | US-RET-003-02 | **Given** a return becomes Approved, **when** RET processes the approval, **then** a ReturnShipment with type (pickup or drop-off), destination and tracking reference (from the carrier, otherwise generated by RET with a check digit) is created and shown to the shopper and to the seller; RET registers the tracking reference with TRK through IC-TRK-01 RegisterExternalReference (owning module RET, entity type ReturnShipment, entity id) so that TRK-002 matches incoming events to it; a reference already registered for another entity is refused and RET generates a new one. | REQ-MPC-FR-229; Proposed (IC-TRK-01) |
| AC-RET-003-02-02 | US-RET-003-02 | **Given** a ReturnShipment exists, **when** tracking events for its reference arrive through TRK-002, **then** the ReturnShipment status follows SM-RET-03; when it is delivered at the destination the return request becomes Received (SM-RET-01). | REQ-MPC-FR-229; Proposed |
| AC-RET-003-03-01 | US-RET-003-03 | **Given** shipping models are configured with their payer, **when** a return is approved, **then** the model selected for the return is recorded on it; customer-paid and shared models create a return-delivery fee through RET-006; merchant-paid models charge the seller: RET calls IC-SEL-05 AddSellerCharge (source module RET, source type ReturnShipping, return reference, amount) and SEL-017 deducts it in the next settlement; client-subsidised models charge no one in the shop (BR-RET-020). | REQ-MPC-FR-228; Proposed (charging paths; IC-SEL-05) |
| AC-RET-003-03-02 | US-RET-003-03 | **Given** Malawi Post Table 10 is received, **when** models and selection rules are loaded from it, **then** the model applied to each return follows the Table 10 rules — held by T-MISS (Table 10 not provided). | REQ-MPC-FR-228; T-MISS |
| AC-RET-003-04-01 | US-RET-003-04 | **Given** destination rules are configured (seller-fulfilled items go to the seller address; client stock goes to the warehouse or outlet that shipped it — Proposed), **when** a return shipment is created, **then** its destination follows the rule; if the shopper dropped the item at an outlet that is not the destination, an onward task is created through LOG-011 where the Postal and logistics pack is active. | D; REQ-MPC-FR-189; Proposed |

**Business rules applied:** BR-RET-020 (§8.1).


### 7.4 PRD-RET-004 Return inspection

| Item | Value |
|---|---|
| Description (baseline) | Staff inspect returned items at the outlet or warehouse, record the condition with photos and decide the outcome. |
| Why it matters | Fair decisions based on evidence. |
| Who benefits | Warehouse and outlet staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-004-01 | As a member of warehouse or outlet staff, I want to record the condition of a returned item with photos and decide to accept it, accept part of it or reject it, so that decisions are fair and based on evidence. | D; REQ-MPC-FR-250 | Ready |
| US-RET-004-02 | As a seller, I want to inspect returns of my products when the client lets sellers inspect, so that I decide on goods returned to me. | FC-M15-015 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-004-01-01 | US-RET-004-01 | **Given** a return request is Received, **when** staff record the inspection with location, condition grade from the configured list, photos, notes and accepted quantity, **then** a ReturnInspection is created and linked to the return; the RET status becomes Accepted, PartiallyAccepted or InspectionRejected (SM-RET-01); the action is audited (AUD-RET-003). | REQ-MPC-FR-250; D |
| AC-RET-004-01-02 | US-RET-004-01 | **Given** a return request is not yet Received, **when** staff try to record an inspection, **then** it is refused with message Ret.StatusChangeNotAllowed and nothing changes. | Proposed |
| AC-RET-004-01-03 | US-RET-004-01 | **Given** the outcome is Accepted or PartiallyAccepted and the restock option is chosen, **when** the inspection is saved, **then** ReturnRequest.ReturnedQuantity is increased by the restocked quantity and the stock movement is posted once through the INV adjustment service (IC-INV-01 PostMovement, reason Return, with lot or serial number where tracked); RET does not change stock directly. | FIT (ReturnRequest.ReturnedQuantity); Proposed (IC-INV-01) |
| AC-RET-004-01-04 | US-RET-004-01 | **Given** the outcome is Accepted or PartiallyAccepted, **when** the inspection is saved, **then** RET-005 starts the refund for the accepted quantity (see RET-005 (REQ-MPC-FR-232)). | FC-M15-015 |
| AC-RET-004-01-05 | US-RET-004-01 | **Given** the outcome is Accepted or PartiallyAccepted, **when** the inspection is saved and committed, **then** RET publishes the module event Return.Completed (OrderId, ReturnRequestIds, Outcome, AcceptedQuantity, CompletedOnUtc) once per return through IEventPublisher; ORD maps it to the order stage Returned where that stage is configured; consumers only notify or enqueue (BR-RET-064). | Proposed (BR-ORD-013) |
| AC-RET-004-01-06 | US-RET-004-01 | **Given** the outcome is InspectionRejected, **when** the inspection is saved, **then** the native status becomes RequestRejected, the shopper is told the reason, and may open a dispute case (RET-007). | FC-M15-015; Proposed |
| AC-RET-004-02-01 | US-RET-004-02 | **Given** the client allows seller inspection (setting) and the destination of the return is the seller, **when** the seller records the inspection through the RET seller endpoint, **then** the endpoint checks that the product belongs to the seller's vendor and applies the same rules as story 01. | FC-M15-015; Proposed |

**Business rules applied:** BR-RET-001; BR-RET-030; BR-RET-064 (§8.1).


### 7.5 PRD-RET-005 Automatic refund trigger

| Item | Value |
|---|---|
| Description (baseline) | When a return or cancellation is approved, the refund starts automatically, including for part of an order. |
| Why it matters | Customers are refunded quickly without manual steps. |
| Who benefits | Shoppers; finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PAY-016 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-005-01 | As a shopper, I want my refund to start automatically when my return is accepted, so that I am refunded without chasing anyone. | D; REQ-MPC-FR-232; FC-M15-016 | Ready |
| US-RET-005-02 | As a shopper, I want my refund to start automatically when my paid order is cancelled or a service I paid for fails, so that I get my money back without asking. | D; REQ-MPC-FR-232 | Ready |
| US-RET-005-03 | As a shopper, I want to return and be refunded for part of an order, item by item, so that I keep what is fine. | REQ-MPC-FR-233 | Ready |
| US-RET-005-04 | As a member of finance staff, I want each automatic refund request to be made once and linked to its source, so that no customer is refunded twice. | Proposed | Ready |
| US-RET-005-05 | Technical enabler. As a member of the platform team, I want other modules to start refunds only through the RET refund trigger, each with its own source type and amount, so that there is one place where automatic refunds start. | Proposed (refund-trigger decision: RET-005 single owner; from SVC, FIN, EGV, ORD, CHK) | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-005-01-01 | US-RET-005-01 | **Given** an inspection accepts quantity q of order line L, **when** the inspection is saved, **then** RET creates a RefundTrigger (source Return) and calls the PAY-016 refund request (IC-RET-02) with the order, line L, quantity q, the amount of BR-RET-040 and the reason; PAY creates its Refund record (Initiated) and RET sets the return to RefundRequested (SM-RET-01). | REQ-MPC-FR-232; REQ-MPC-FR-233; FC-M15-016 |
| AC-RET-005-01-02 | US-RET-005-01 | **Given** a return is RefundRequested, **when** PAY reports Refund.Completed for it, **then** RET sets the return to Refunded, sets the native status ItemsRefunded through IReturnRequestService.UpdateReturnRequestAsync and the shopper receives the native ReturnRequestStatusChanged.CustomerNotification (BR-RET-030). | FC-M15-016; FIT |
| AC-RET-005-01-03 | US-RET-005-01 | **Given** a return is RefundRequested, **when** PAY reports the refund waiting for approval or Failed, **then** the return stays RefundRequested, the PAY state is shown on the return, and no second request is sent. | Proposed; BR-PAY-080 |
| AC-RET-005-02-01 | US-RET-005-02 | **Given** an order with PaymentStatus Paid or PartiallyRefunded is cancelled, **when** the native OrderStatusChangedEvent (new status Cancelled) is raised, **then** the RET consumer only enqueues a RefundTrigger (source Cancellation); the RET task then requests from PAY-016 a refund of the amount still refundable (PAY applies BR-PAY-081); the native CancelOrderAsync itself refunds nothing. | REQ-MPC-FR-232; FIT (CancelOrderAsync does not void or refund; consumers swallow exceptions) |
| AC-RET-005-02-02 | US-RET-005-02 | **Given** a cancelled order has PaymentStatus Pending, **when** the cancellation is processed, **then** no refund is requested. | Proposed |
| AC-RET-005-02-03 | US-RET-005-02 | **Given** SVC-005 records a service failure for a paid service order and raises the module event Service.Failed (order, line, reason), **when** RET receives it, **then** a RefundTrigger (source ServiceFailure) is enqueued and processed as for cancellations; the amount rule for service failures is Not stated in source — requires confirmation. | REQ-MPC-FR-232 |
| AC-RET-005-03-01 | US-RET-005-03 | **Given** an order has several lines and only one line is returned, in part, **when** the refund is requested, **then** the request covers only that line and the accepted quantity; fees, commission and split amounts are adjusted by PAY (BR-PAY-051). | REQ-MPC-FR-233 |
| AC-RET-005-04-01 | US-RET-005-04 | **Given** a RefundTrigger exists for a source type and source ID, **when** the same source fires again (duplicate event, retry or a second inspection save), **then** no second refund request is sent: the trigger idempotency key is unique (BR-RET-041). | Proposed |
| AC-RET-005-05-01 | US-RET-005-05 | **Given** a module raises a trigger through IC-RET-04 with a source type registered for that module in BR-RET-042 (BookingCancellation, ProviderNoShow, DepositRefund from SVC-003 and SVC-004; PolicyIssueFailed, PartnerFulfilmentFailed from FIN-003 and FIN-005; ApplicationRejected from EGV-002; PartialSupply from ORD-006), the order lines and the amount computed by that module, **when** RET receives it, **then** RET checks the source type is registered for the calling module and the amount does not exceed the line amounts still refundable, then sends one refund request to PAY-016 as in story 01; an unregistered source type, or a registered type raised by another module, is refused and logged. | Proposed; BR-RET-042 |
| AC-RET-005-05-02 | US-RET-005-05 | **Given** ORD-006 raises PartialSupply through IC-RET-04 (ORD side IC-ORD-05) with the PartialSupplyProposal as source ID and, per order line, the unavailable quantity and the amount ORD computed, **when** RET receives it, **then** one RefundTrigger per line is created with key RET-PartialSupply-{ProposalId}-{OrderItemId} and one refund request for those lines is sent to PAY-016; a repeat of the same proposal sends nothing (BR-RET-041). | Proposed (IC-ORD-05, BR-ORD-033) |
| AC-RET-005-05-03 | US-RET-005-05 | **Given** a trigger concerns an amount that is not on an order line (shipping, payment fee, or a checkout-attribute charge such as the FIN-003 transit-insurance premium) and the raising module passes it as an order-level part (component and amount), **when** RET receives it, **then** RET checks the part does not exceed the order-level amount still refundable (Order.OrderTotal minus Order.RefundedAmount minus the line amounts of the same request) and passes it to PAY-016 with the lines; a paid-order Cancellation trigger includes the order-level remainder in the same way. | Proposed; FIT (checkout-attribute prices are added at order level from CheckoutAttributesXml in OrderTotalCalculationService, with no OrderItem; native PartiallyRefundAsync takes an order amount) |
| AC-RET-005-05-04 | US-RET-005-05 | **Given** CHK-004 placed several sub-orders under one group payment (BR-PAY-014), a later sub-order could not be saved (CheckoutSession PlacementException) and staff choose to refund it, **when** CHK raises a trigger through IC-RET-04 with source type PlacementFailure, the CheckoutSession as source ID, the PaymentTransaction ID and the share of the unsaved sub-order computed by CHK (BR-CHK-007), **then** RET creates one RefundTrigger without order or order line, keyed RET-PlacementFailure-{CheckoutSessionId}-0, and requests the refund of that share against the payment transaction from PAY-016; a second trigger for the same CheckoutSession sends nothing. | Proposed (AC-CHK-004-01-05, SM-CHK-01) |

**Business rules applied:** BR-RET-040; BR-RET-041; BR-RET-042; BR-RET-030 (§8.1).


### 7.6 PRD-RET-006 Return fees

| Item | Value |
|---|---|
| Description (baseline) | Charges such as restocking or return delivery fees can be applied to returns. |
| Why it matters | Covers the cost of returns where policy allows. |
| Who benefits | Clients |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-006-01 | As a client administrator, I want to set restocking fees and return-delivery fees, so that the cost of returns is covered where policy allows. | D; REQ-MPC-FR-238 | Ready |
| US-RET-006-02 | As a shopper, I want to see any return fee before I send my request and on my refund, so that I know what I will get back. | REQ-MPC-FR-238 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-006-01-01 | US-RET-006-01 | **Given** a restocking fee rule exists (fixed amount or percentage of the line amount, by category, seller or reason, with an effective date), **when** an inspection accepts the item, **then** the fee is calculated with the rule version in force on the return date, recorded on the return and deducted from the amount requested from PAY-016 (BR-RET-050). | REQ-MPC-FR-238 |
| AC-RET-006-01-02 | US-RET-006-01 | **Given** the shipping model of the return is customer-paid or shared, **when** the return shipment is booked, **then** a return-delivery fee is recorded on the return from the configured fee rule (see RET-003 (REQ-MPC-FR-228)). | REQ-MPC-FR-238; Proposed |
| AC-RET-006-01-03 | US-RET-006-01 | **Given** the fees of a return are higher than the refund amount, **when** the refund amount is calculated, **then** the refund requested is zero, no negative amount is sent and staff are alerted on the return. | Proposed |
| AC-RET-006-02-01 | US-RET-006-02 | **Given** fee rules apply to items selected on the return form, **when** the form is shown, **then** the estimated fees per item are shown with message Ret.FeesNotice before the shopper submits. | REQ-MPC-FR-238 |
| AC-RET-006-02-02 | US-RET-006-02 | **Given** fees were deducted, **when** the shopper opens the return, **then** the refund breakdown shows the item amount, each fee and the net refund. | REQ-MPC-FR-238 |
| AC-RET-006-01-04 | US-RET-006-01 | **Given** a fee rule is created or changed, **when** it is saved, **then** who, when, old and new values are audited (AUD-RET-005). | Proposed |

**Business rules applied:** BR-RET-050 (§8.1).


### 7.7 PRD-RET-007 Dispute and issue cases

| Item | Value |
|---|---|
| Description (baseline) | A case file for customer problems and disputes with the client: the customer raises an issue, evidence (including proof of delivery) is attached, the decision is recorded, the remedy is carried out, and unresolved cases can be escalated to the client's dispute process (for Malawi Post, its complaints and dispute policy). The customer accepts the proposed remedy before the case is closed, and each step is timed. |
| Why it matters | Problems are resolved fairly and recorded. |
| Who benefits | Shoppers; support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002, PRD-CRM-014 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-007-01 | As a shopper, I want to report a missing, damaged or wrong item without starting a formal return, where policy allows, so that the problem is fixed quickly. | D; REQ-MPC-FR-240 | On hold: WF-ENG |
| US-RET-007-02 | As a member of support staff, I want one case file per problem with status, parties, evidence and a log of every decision, so that I can resolve and prove what happened. | D; REQ-MPC-FR-235; FC-M18-006 | On hold: WF-ENG |
| US-RET-007-03 | As a member of support staff, I want proof of delivery to be attached to the case automatically, so that delivery disputes are decided on evidence. | D; REQ-MPC-FR-239; FC-M18-010 | On hold: WF-ENG |
| US-RET-007-04 | As a shopper, I want to accept or reject the remedy proposed before the case is closed, so that the case closes only on an outcome I agreed to. | D; FC-M18-006 | On hold: WF-ENG |
| US-RET-007-05 | As a member of support staff, I want to escalate a case I cannot resolve to the client's dispute process, so that unresolved disputes follow policy. | D; REQ-MPC-FR-231 | On hold: WF-ENG |
| US-RET-007-06 | As a shopper, I want to know how disputes are resolved, so that I know my options. | REQ-MPC-FR-234 | On hold: WF-ENG |
| US-RET-007-07 | As a member of finance staff, I want payment disputes raised by other modules to open a case and hold the related payment steps while it is open, so that money is not released while a dispute is open. | Proposed (dependants PAY-007, PAY-035, PAY-036) | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-007-01-01 | US-RET-007-01 | **Given** an order has been delivered and the issue type chosen (missing item, damaged item, wrong item, or another configured type) allows a case without a return, **when** the shopper reports it from the order page (entry point owned by CRM-014) with a description and evidence, **then** a DisputeCase of type OrderIssue opens (SM-RET-02, Open) with the order and items filled in, a case number, and message Ret.CaseOpened is shown; no ReturnRequest is created. | REQ-MPC-FR-240 |
| AC-RET-007-01-02 | US-RET-007-01 | **Given** LOG-013 records a delivery outcome Lost, Damaged or ReturnedToSender for a shipment of a paid order, **when** RET receives the LOG module event DeliveryOutcomeRecorded (OrderId, ShipmentId, Outcome; IC-LOG-05), **then** the consumer only enqueues; the RET task opens an OrderIssue case for the order (source LOG-013) unless one is open for that shipment, and the shopper receives message Ret.CaseOpened; any refund follows only from a remedy accepted in the case (RefundTrigger source Case). | Proposed (IC-LOG-05) |
| AC-RET-007-01-03 | US-RET-007-01 | **Given** an issue type is configured as not allowed without a return, **when** the shopper reports that issue, **then** the shopper is sent to the return form (RET-001) instead. | REQ-MPC-FR-240; Proposed |
| AC-RET-007-02-01 | US-RET-007-02 | **Given** a case exists, **when** support staff open it, **then** the case view shows status, type, parties (customer, seller, client staff), linked order, return, ticket (CRM-006) and payment, the evidence list, and the event log with actor and time of each step and decision. | REQ-MPC-FR-235; FC-M18-006 |
| AC-RET-007-02-02 | US-RET-007-02 | **Given** staff record a decision (outcome, reasons, remedy: refund, replacement, repair or none, and amount), **when** it is saved, **then** the decision is written to the case log (AUD-RET-007) and the case becomes RemedyProposed; message Ret.RemedyProposed is sent to the shopper. | REQ-MPC-FR-235; FC-M18-011 |
| AC-RET-007-03-01 | US-RET-007-03 | **Given** a proof-of-delivery record exists for a shipment of the order (LOG-012), **when** a case is opened for that order, or the record arrives later (LOG module event ProofOfDeliveryRecorded, IC-LOG-05, consumed by enqueue only), **then** the record is linked to the case as evidence of type ProofOfDelivery. | REQ-MPC-FR-239 |
| AC-RET-007-04-01 | US-RET-007-04 | **Given** a case is RemedyProposed, **when** the shopper accepts in My account, **then** the case becomes RemedyAccepted; a refund remedy is requested through RET-005 (RefundTrigger source Case); when the remedy is done the case becomes Closed. | D; FC-M18-011 |
| AC-RET-007-04-02 | US-RET-007-04 | **Given** a case is RemedyProposed, **when** the shopper rejects with a reason, **then** the case returns to UnderInvestigation, or becomes Escalated if the configured number of rejections is reached (default not stated). | D; Proposed |
| AC-RET-007-04-03 | US-RET-007-04 | **Given** a case is RemedyProposed and the shopper has not answered within the acceptance wait time (setting, default not stated), **when** the wait time expires, **then** the case is flagged for staff; staff may close it as ClosedNoResponse with a reason; it is never closed automatically. | Proposed |
| AC-RET-007-02-03 | US-RET-007-02 | **Given** a case moves to a new step, **when** the step starts, **then** a timer for that step starts in the SLA component (CRM-014) and its due time is shown on the case. | D (each step is timed) |
| AC-RET-007-05-01 | US-RET-007-05 | **Given** a case is not resolved at the internal levels, **when** staff escalate it to the client's dispute process, **then** the case becomes Escalated, is assigned to the next level of the escalation matrix and the escalation is audited (AUD-RET-008); the Malawi Post levels follow its Complaints and ADR Policy — held by T-MISS (policy not provided). | REQ-MPC-FR-231; T-MISS |
| AC-RET-007-06-01 | US-RET-007-06 | **Given** the client has published the dispute-process topic and set its system name in the RET settings, **when** a case is opened or viewed, **then** the case page links to the topic; the same topic is used by CAT-031 on product and order pages. | REQ-MPC-FR-234 |
| AC-RET-007-07-01 | US-RET-007-07 | **Given** PAY-007, PAY-035 or PAY-036 calls OpenCase (IC-RET-01) for an order, **when** the call is processed, **then** a case of type PaymentDispute opens with the source module and reference; HasOpenCase(orderId) returns true until the case is Closed, ClosedNoResponse, Withdrawn or ClosedExternal (BR-RET-062). | Proposed; AC-PAY-007-02-02, AC-PAY-036-02-02 |
| AC-RET-007-07-02 | US-RET-007-07 | **Given** a case of any type is open for an order, **when** ORD-002 checks HasOpenCase (IC-RET-01) before recording buyer or deemed acceptance, **then** true is returned and ORD refuses the acceptance; once every case of the order is in a closed state false is returned. | Proposed (ORD-002, BR-ORD-013) |
| AC-RET-007-02-04 | US-RET-007-02 | **Given** CAT-024 raises Listing.Withdrawn for a product, **when** the RET consumer receives it, **then** the consumer only enqueues; the RET task flags every open case of an order that contains the product in the cases queue with the withdrawal reference; no case status, remedy or refund changes (BR-CAT-015). | Proposed (BR-CAT-015) |

**Business rules applied:** BR-RET-060; BR-RET-061; BR-RET-062; BR-RET-092 (§8.1).


### 7.8 PRD-RET-008 Dispute SLAs and escalation

| Item | Value |
|---|---|
| Description (baseline) | Time limits for handling disputes, automatic sorting by urgency, an escalation path up to regulators or independent resolution, and export of the full case file. |
| Why it matters | Disputes do not get stuck, and external bodies receive complete files. |
| Who benefits | Support managers; regulators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002, PRD-RET-007, PRD-CRM-014 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-008-01 | As a support manager, I want time limits for seller response and for support resolution, with timers on every case, so that disputes do not get stuck. | D; REQ-MPC-FR-241 | On hold: WF-ENG |
| US-RET-008-02 | As a support manager, I want cases to be sorted by urgency automatically from reason codes and transaction details, so that urgent cases are handled first. | D; REQ-MPC-FR-242 | On hold: WF-ENG |
| US-RET-008-03 | As a support manager, I want to escalate a case to a regulator or independent body and export the full case file, so that external bodies receive complete files. | D; REQ-MPC-FR-247 | On hold: WF-ENG |
| US-RET-008-04 | As a client administrator, I want to configure dispute rules and the escalation matrix in line with our complaints and dispute policy, so that escalation follows policy. | REQ-MPC-FR-312 | On hold: WF-ENG |
| US-RET-008-05 | As a client administrator, I want to configure the service-level standards for returns and disputes and what happens when they are missed, so that time limits are enforced. | REQ-MPC-FR-311 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-008-01-01 | US-RET-008-01 | **Given** an SLA policy exists for a case type and category, with a metric (seller response or resolution) and a duration (values not stated), **when** a case of that type opens, **then** a timer starts in the SLA component (CRM-014); the due time is shown on the case and in the queue. | REQ-MPC-FR-241; FC-M18-005 |
| AC-RET-008-01-02 | US-RET-008-01 | **Given** a timer passes its due time, **when** the SLA task runs, **then** the case is marked Breached, escalated one level in the matrix, and the assignee and the next level are notified; the breach is audited (AUD-RET-008). | REQ-MPC-FR-241; FC-M18-005 |
| AC-RET-008-01-03 | US-RET-008-01 | **Given** the case is waiting for the customer and the policy pauses on that state (setting), **when** the case enters that state, **then** the resolution timer pauses and resumes when the customer answers. | Proposed |
| AC-RET-008-02-01 | US-RET-008-02 | **Given** a triage rule "reason code R and order value above V gives priority P and queue Q" is active (values configured), **when** a case with reason R and a higher order value opens, **then** the case gets priority P and queue Q, and the rule applied is written to the case log. | REQ-MPC-FR-242 |
| AC-RET-008-03-01 | US-RET-008-03 | **Given** external escalation is allowed for the case category and the external bodies are configured, **when** a support manager escalates the case externally, **then** the case becomes EscalatedExternal, a case file is generated (summary PDF, evidence files and the case log including messages, in one ZIP), its hash is recorded and the export is audited (AUD-RET-008). | REQ-MPC-FR-247 |
| AC-RET-008-03-02 | US-RET-008-03 | **Given** a case is EscalatedExternal, **when** staff record the external outcome, **then** the case becomes ClosedExternal with the outcome and reference recorded. | Proposed |
| AC-RET-008-04-01 | US-RET-008-04 | **Given** escalation-matrix levels are configured per category (internal steps and external points), **when** a case is escalated, **then** it moves to the next configured level; the Malawi Post levels follow its Complaints and ADR Policy — held by T-MISS (policy not provided). | REQ-MPC-FR-312; T-MISS |
| AC-RET-008-05-01 | US-RET-008-05 | **Given** return and dispute service-level standards and their escalation actions are configured, **when** a return or case misses a standard, **then** the configured escalation action runs (notify, raise priority, move up a level). | REQ-MPC-FR-311 |

**Business rules applied:** BR-RET-070; BR-RET-071 (§8.1).


### 7.9 PRD-RET-009 Case retention and reports

| Item | Value |
|---|---|
| Description (baseline) | Keeps return and dispute cases for the required period and reports on them. |
| Why it matters | Shows trends and meets record-keeping rules. |
| Who benefits | Management; auditors |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-009-01 | As a client administrator, I want return and dispute records and their evidence to be kept for the required period and then archived or deleted, so that we meet record-keeping rules. | D; REQ-MPC-FR-248 | Ready |
| US-RET-009-02 | As a manager, I want periodic reports on return rates, dispute reasons, resolution times and outcomes, so that we see trends and act on them. | D; REQ-MPC-FR-249 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-009-01-01 | US-RET-009-01 | **Given** retention rules for the RET record types (return data, dispute cases, case messages, evidence files) are set in PLT-020 (periods not stated), **when** the retention period of a closed case or return has passed, **then** the PLT-020 job archives or deletes the records and their Download files as the rule says; records of open cases or with a legal-hold flag are never purged; each purge is audited (AUD-RET-010). | REQ-MPC-FR-248; Proposed (legal hold) |
| AC-RET-009-02-01 | US-RET-009-02 | **Given** the user has Returns.Core.Reports.View, **when** they run the returns and disputes report for a period, **then** it shows return rate (items returned divided by items sold in the period, definition Proposed), returns and cases by reason code, resolution time from open to close, and outcomes, and can be exported to Excel. | REQ-MPC-FR-249 |
| AC-RET-009-02-02 | US-RET-009-02 | **Given** a report period is configured (setting, default not stated), **when** the period ends, **then** a scheduled task generates the report for that period and stores it for download. | REQ-MPC-FR-249; Proposed |

**Business rules applied:** BR-RET-002; BR-RET-080 (§8.1).


### 7.10 PRD-RET-010 Seller return review

| Item | Value |
|---|---|
| Description (baseline) | Sellers review return requests for their products and respond within set time limits. |
| Why it matters | Marketplace returns are handled by the right seller on time. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-RET-001, PRD-CRM-014 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-010-01 | As a seller, I want to see return requests for my products and respond within the set time, so that marketplace returns are handled by the right seller on time. | D; REQ-MPC-FR-230 | Ready |
| US-RET-010-02 | As a client administrator, I want to decide what happens when a seller does not respond in time, and to override a seller decision, so that customers are not left waiting. | Proposed | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-010-01-01 | US-RET-010-01 | **Given** a return request is for an order item whose product belongs to vendor V, **when** a user of vendor V opens the RET seller return list, **then** the request is listed with order, item, quantity, reason, evidence and due time; requests of other vendors are not listed. | REQ-MPC-FR-230; FIT (admin ReturnRequestController has no vendor filter) |
| AC-RET-010-01-02 | US-RET-010-01 | **Given** a seller calls the detail of a return of another vendor, **when** the request is processed, **then** access is denied and nothing is shown (ownership check through OrderItem to Product.VendorId). | Proposed |
| AC-RET-010-01-03 | US-RET-010-01 | **Given** a return is Requested, **when** the seller approves, rejects with a reason, or asks the shopper for more information, **then** the response is recorded, the RET status changes per SM-RET-01, the shopper is notified and the response is audited (AUD-RET-011). | REQ-MPC-FR-230 |
| AC-RET-010-01-04 | US-RET-010-01 | **Given** a return request is created for a product of vendor V, **when** it is saved, **then** the seller receives the RET event code Returns.Core.SellerReturnRequested through IC-TRK-04 SendEvent (TRK-005 channels; the native NewReturnRequest template goes only to the store owner). | REQ-MPC-FR-230; FIT |
| AC-RET-010-02-01 | US-RET-010-02 | **Given** the seller response time (RET-008 SLA policy) passes without a response, **when** the SLA task runs, **then** the configured action applies: escalate to client support staff, or approve automatically (setting; default not stated). | REQ-MPC-FR-230; Proposed |
| AC-RET-010-02-02 | US-RET-010-02 | **Given** a seller rejected a return, **when** client support staff override with a reason, **then** the return moves to Approved and the override is audited (AUD-RET-011). | Proposed |

**Business rules applied:** BR-RET-090 (§8.1).


### 7.11 PRD-RET-011 Buyer–seller mediation

| Item | Value |
|---|---|
| Description (baseline) | Buyer and seller message each other inside a dispute case, with moderation and a record, and the client can mediate. |
| Why it matters | Buyers and sellers can try to settle a dispute directly, with a record kept and the client able to step in. |
| Who benefits | Shoppers; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-RET-007 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RET-011-01 | As a shopper, I want to message the seller inside my dispute or return case, so that we can try to settle it directly. | D; REQ-MPC-FR-236; FC-M18-008 | On hold: WF-ENG |
| US-RET-011-02 | As a seller, I want to reply to the buyer inside the case, so that I can resolve the dispute. | D; REQ-MPC-FR-236 | On hold: WF-ENG |
| US-RET-011-03 | As a member of support staff, I want to moderate case messages and to step in as mediator, so that the conversation stays proper and the client can settle the case. | D; REQ-MPC-FR-236; FC-M18-009 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RET-011-01-01 | US-RET-011-01 | **Given** a case of type ReturnDispute or BuyerSellerDispute is linked to vendor V, **when** the shopper posts a message with optional attachments, **then** the message is stored with sender and time, shown to the seller of V and to client staff, and the seller is notified. | REQ-MPC-FR-236; FC-M18-008 |
| AC-RET-011-02-01 | US-RET-011-02 | **Given** a case is linked to vendor V, **when** a user of V replies through the seller portal, **then** the reply is shown to the shopper and staff; users who are not parties or staff cannot read the thread (access denied). | REQ-MPC-FR-236 |
| AC-RET-011-03-01 | US-RET-011-03 | **Given** a message breaks the moderation rules, **when** a user with Returns.Core.Cases.Moderate hides it with a reason, **then** the parties see message Ret.MessageHidden in its place, the original is kept in the case record, and the action is audited (AUD-RET-009). | REQ-MPC-FR-236 |
| AC-RET-011-03-02 | US-RET-011-03 | **Given** pre-moderation is on for the store (setting, default not stated), **when** a party posts a message, **then** the message is held until staff release it. | Proposed |
| AC-RET-011-03-03 | US-RET-011-03 | **Given** staff join the case as mediator, **when** they record a decision with reasons, **then** the decision follows the RET-007 remedy flow (RemedyProposed, customer acceptance). | FC-M18-009; D |
| AC-RET-011-03-04 | US-RET-011-03 | **Given** a case is exported (RET-008), **when** the case file is generated, **then** the full message thread, including hidden messages and moderation actions, is in the file (see RET-008 (REQ-MPC-FR-247)). | Proposed |

**Business rules applied:** BR-RET-063; BR-RET-092 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-RET-001 | The RET status of a return follows SM-RET-01. The native ReturnRequestStatus is changed only by RET services through IReturnRequestService.UpdateReturnRequestAsync, using the mapping in SM-RET-01. A status change posted from the native admin edit page (Admin ReturnRequestController.Edit [POST]) is checked by a RET action filter against SM-RET-01; a change not allowed is refused with message Ret.StatusChangeNotAllowed and nothing is saved. The same filter refuses changes to ReturnedQuantity on that page, because the native action adjusts stock directly (IProductService.AdjustInventoryAsync); restocking goes only through RET-004 and IC-INV-01. | RET-001, RET-004, RET-005, RET-010 | Proposed; FIT (the admin Edit POST takes ReturnRequestModel and checks ModelState; an action filter is used because event consumers swallow exceptions) |
| BR-RET-002 | For each return request RET stores the reason ID and action ID chosen; reports and rules use these IDs, not the localised names that the native record keeps. | RET-001, RET-009 | FIT (ReturnRequest.ReasonForReturn, RequestedAction are text) |
| BR-RET-010 | An order item is eligible for return only if: native returns are enabled; the order is Complete; the product is not NotReturnable; the RET rule that applies (BR-RET-011) allows it; the rule window counted from its start has not passed; and quantity remains after earlier requests that are not Cancelled. Applied by a DI override of IReturnRequestService.GetReturnRequestAvailabilityAsync. | RET-001, RET-002 | REQ-MPC-FR-237; FIT |
| BR-RET-011 | Rule precedence: native Product.NotReturnable, then product rule, then seller rule, then category rule, then the global setting. When RET rules set windows, ReturnRequestSettings.NumberOfDaysReturnRequestAvailable is 0 or not shorter than the longest rule window, because the native order-level check runs first. | RET-002 | Proposed; FIT (IsReturnRequestAllowedAsync) |
| BR-RET-012 | Eligibility is enforced on submit by a RET action filter on ReturnRequestController.ReturnRequestSubmit [POST] and by a DI override of IReturnRequestService.InsertReturnRequestAsync; a ModelReceivedEvent veto is not used because the action does not check ModelState. | RET-002 | FIT |
| BR-RET-020 | Each approved return records the shipping model applied (merchant-paid, customer-paid, shared, client-subsidised). Customer-paid and shared models create a return-delivery fee (RET-006); merchant-paid models are charged to the seller through IC-SEL-05 AddSellerCharge (source type ReturnShipping, idempotent on the return reference) and deducted by SEL-017 settlement; client-subsidised models create no charge in the shop. | RET-003 | REQ-MPC-FR-228; Proposed (charging paths) |
| BR-RET-030 | On every change of the native return status RET sends the native ReturnRequestStatusChanged.CustomerNotification through IWorkflowMessageService, and the channels configured for the event in TRK-005. | RET-001, RET-004, RET-005 | FC-M15-016 (buyer informed at each step); FIT (native sends it only on the admin Notify customer button) |
| BR-RET-040 | Refund amount requested for a return line = (OrderItem.PriceInclTax / OrderItem.Quantity) x accepted quantity, minus the fees of RET-006, never below zero. Treatment of shipping and order-level discounts: Not stated in source — requires confirmation. | RET-005 | Proposed; REQ-MPC-FR-233 |
| BR-RET-041 | Each refund trigger has a unique idempotency key "RET-{SourceType}-{SourceId}-{OrderItemId}"; for an order-level part the component name replaces the OrderItemId, and for PlacementFailure the OrderItemId is 0. A second trigger with the same key sends nothing to PAY. | RET-005 | Proposed; NFR-X-007 |
| BR-RET-042 | Refund source-type register (RET-005 is the single owner of refund triggers; every automatic refund outside PAY starts here). Source type, raising module, how it is raised, and who computes the amount: Return (RET-004 inspection; RET, BR-RET-040); Cancellation (RET consumer of the native OrderStatusChangedEvent for a paid order cancelled by any path: ORD-004 buyer, seller or deadline cancellation, ORD-006 rejected proposal, INV-004, admin, CHK-004 staff resolution; RET, amount still refundable); ServiceFailure (RET consumer of SVC-005 Service.Failed; amount rule Not stated in source); Case (RET-007 accepted refund remedy; RET, decided remedy amount); BookingCancellation and ProviderNoShow (SVC-003, IC-RET-04; SVC, BR-SVC-021); DepositRefund (SVC-004, IC-RET-04; SVC); PolicyIssueFailed (FIN-003, IC-RET-04; FIN, BR-FIN-005); PartnerFulfilmentFailed (FIN-005, IC-RET-04; FIN, BR-FIN-005); ApplicationRejected (EGV-002, IC-RET-04; EGV); PartialSupply (ORD-006, IC-RET-04 through IC-ORD-05; ORD, BR-ORD-033); PlacementFailure (CHK-004 staff resolution of a PlacementException, IC-RET-04; CHK, share of the unsaved sub-order, BR-CHK-007). IC-RET-04 refuses a source type that is not in this register or that is raised by a module other than the one named. A new source type is added only by a change to this rule. | RET-005 | Proposed (refund-trigger decision: RET-005 single owner; BR-SVC-021; BR-FIN-005; EGV-002; IC-ORD-05; SM-CHK-01) |
| BR-RET-050 | Return fees are versioned rules with an effective date; a return uses the rule versions in force on the date the return was requested; fees never make the refund negative. | RET-006 | REQ-MPC-FR-238; Proposed |
| BR-RET-060 | A dispute case follows SM-RET-02. A case closes as Closed only after the customer accepts the remedy; otherwise it closes only as ClosedNoResponse (by staff, after the acceptance wait time), Withdrawn (by the customer) or ClosedExternal. | RET-007 | D (customer accepts before close); Proposed |
| BR-RET-061 | Every case step, decision, evidence addition and escalation is written to the case log with actor and time. | RET-007 | REQ-MPC-FR-235 |
| BR-RET-062 | HasOpenCase(orderId) is true while any case of the order is not Closed, ClosedNoResponse, Withdrawn or ClosedExternal; PAY uses it before releasing escrow or confirming disputed payments; ORD-002 uses it before recording order acceptance. | RET-007 | Proposed (PAY-007 BR-PAY-031; PAY-035; PAY-036; ORD-002) |
| BR-RET-064 | Return.Completed is published once per return, after the inspection with outcome Accepted or PartiallyAccepted is committed; it carries OrderId, ReturnRequestIds, Outcome, AcceptedQuantity and CompletedOnUtc. It is a notification only: ORD maps it to the stage Returned; no consumer may change money or stock from it. | RET-004 | Proposed (BR-ORD-013) |
| BR-RET-063 | Only the parties of a case (customer, the linked seller) and staff with case permissions can read or post case messages; hidden messages are kept and are visible to staff. | RET-011 | REQ-MPC-FR-236 |
| BR-RET-070 | Case timers come from SLA policies in the SLA component (CRM-014); a breach escalates the case one level of the escalation matrix and notifies the assignee and the next level. | RET-008, RET-007, RET-010 | REQ-MPC-FR-241; FC-M18-005 |
| BR-RET-071 | A case file exported to an external body contains the summary, all evidence, the case log and the full message thread; the file hash and the export are recorded. | RET-008 | REQ-MPC-FR-247; Proposed (content) |
| BR-RET-080 | Return and dispute records are purged only through PLT-020 retention rules, never while a case is open or under legal hold. | RET-009 | REQ-MPC-FR-248; Proposed (legal hold) |
| BR-RET-091 | Platform conformance (all RET features): every new RET setting key is listed in the RET plugin key catalogue (key, type, layer, secret flag, default) so pack validation accepts it; RET holds no credential of its own (carrier credentials are LOG settings), and any key added later that holds a credential, key or token is flagged secret. RET pages, widgets and scheduled tasks run for a store only when IC-PLT-02 IsEnabled(productfeature.<RET feature ID>) is true for that store. All RET writes go through IRepository<> so SEC-004 captures old and new values; business audit events AUD-RET-nnn are written through IC-SEC-01 WriteAsync with a correlation id. | All RET features | Proposed (BR-PLT-013, AC-PLT-003-01-04, AC-PLT-022-02-01; BR-SEC-010, BR-SEC-011, BR-SEC-014) |
| BR-RET-092 | Files (decision SINGLE-FILTER): RET evidence and case-message uploads are checked only by the ADM-008 upload policy, for the upload contexts "return evidence" and "case attachment" that the RET plugin registers with ADM-008 at installation; RET has no file-type or size check of its own except the number of files per return (setting). Downloads of RET files through Nop.Web DownloadController.GetFileUpload or Admin DownloadController.DownloadFile are decided by the single SEC-002 ownership filter (BR-SEC-005); RET is a rule provider to it and allows the shopper of the order, users of the vendor that owns the item, the parties of the case, and staff holding Orders.ReturnRequestsView or Returns.Core.Cases.View. | RET-001, RET-007, RET-011 | SINGLE-FILTER; FIT (DownloadController.GetFileUpload, Admin DownloadController.DownloadFile) |
| BR-RET-090 | Sellers act on returns and cases only through RET seller endpoints that check the order item belongs to their vendor; the native return-request permissions are never granted to Vendors. | RET-010, RET-011, RET-004 | FIT (no vendor filter in admin ReturnRequestController; DefaultPermissionConfigManager) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-RET-01 | Return (RET status; native status in brackets) | (none) | shopper submits | BR-RET-010, BR-RET-012 | Requested [Pending] | native notifications; seller notified (RET-010) |
| SM-RET-01 | Return | Requested | seller or staff approves | permission / vendor ownership | Approved [ReturnAuthorized] | return shipment created (RET-003); status e-mail |
| SM-RET-01 | Return | Requested | seller or staff rejects with reason | reason given | RequestRejected [RequestRejected] | status e-mail; dispute possible (RET-007) |
| SM-RET-01 | Return | Requested | staff cancel at shopper request | — | Cancelled [Cancelled] | quantity available again |
| SM-RET-01 | Return | Approved | return shipment delivered at destination, or item handed in at the destination outlet | — | Received [Received] | status e-mail |
| SM-RET-01 | Return | Received | inspection recorded: accept / part / reject | Returns.Core.Inspection.CreateEditDelete | Accepted / PartiallyAccepted [Received] or InspectionRejected [RequestRejected] | restock if chosen; refund trigger (RET-005) for accepted quantity; Return.Completed for accepted outcomes (BR-RET-064) |
| SM-RET-01 | Return | Accepted / PartiallyAccepted | refund requested from PAY-016 | BR-RET-041 | RefundRequested [Received] | — |
| SM-RET-01 | Return | RefundRequested | PAY Refund.Completed | — | Refunded [ItemsRefunded] | status e-mail |
| SM-RET-01 | Return | Accepted | repair completed (action Repair) | — | Repaired [ItemsRepaired] | status e-mail |
| SM-RET-01 | Return | RequestRejected | staff override with reason (RET-010) | Orders.ReturnRequestsCreateEditDelete | Approved [ReturnAuthorized] | AUD-RET-011 |
| SM-RET-02 | DisputeCase | (none) | opened by shopper, staff, ticket (CRM-006) or PAY (IC-RET-01) | — | Open | timer starts; POD linked if present |
| SM-RET-02 | DisputeCase | Open | staff take the case | — | UnderInvestigation | — |
| SM-RET-02 | DisputeCase | UnderInvestigation | decision with remedy recorded | Returns.Core.Cases.CreateEditDelete | RemedyProposed | shopper notified (Ret.RemedyProposed) |
| SM-RET-02 | DisputeCase | RemedyProposed | shopper accepts | — | RemedyAccepted | remedy executed (refund through RET-005) |
| SM-RET-02 | DisputeCase | RemedyAccepted | remedy done | — | Closed | timers stop |
| SM-RET-02 | DisputeCase | RemedyProposed | shopper rejects | rejections below configured number | UnderInvestigation | — |
| SM-RET-02 | DisputeCase | RemedyProposed | shopper rejects | configured number reached | Escalated | next matrix level assigned |
| SM-RET-02 | DisputeCase | RemedyProposed | acceptance wait time passed and staff close | reason given | ClosedNoResponse | — |
| SM-RET-02 | DisputeCase | Open / UnderInvestigation | staff escalate, or SLA breach | — | Escalated | next matrix level assigned; AUD-RET-008 |
| SM-RET-02 | DisputeCase | Escalated | decision with remedy recorded at the new level | — | RemedyProposed | — |
| SM-RET-02 | DisputeCase | Escalated | external escalation | Returns.Core.Cases.ExternalEscalation | EscalatedExternal | case file exported (BR-RET-071) |
| SM-RET-02 | DisputeCase | EscalatedExternal | external outcome recorded | — | ClosedExternal | — |
| SM-RET-02 | DisputeCase | Open / UnderInvestigation | shopper withdraws | — | Withdrawn | — |
| SM-RET-03 | ReturnShipment | (none) | return approved | — | Created | tracking reference assigned |
| SM-RET-03 | ReturnShipment | Created | carrier booking confirmed (pickup) or shopper chooses drop-off | — | Booked | label or instructions issued |
| SM-RET-03 | ReturnShipment | Booked | collected from shopper or handed in at outlet | — | InTransit | — |
| SM-RET-03 | ReturnShipment | InTransit | delivered at destination | — | Delivered | return becomes Received |
| SM-RET-03 | ReturnShipment | Booked / InTransit | carrier reports failure | — | Failed | staff alerted; new booking possible |
| SM-RET-03 | ReturnShipment | Created / Booked | return cancelled | — | Cancelled | carrier booking cancelled through LOG-021 |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| ReturnRequestExt (new) | ReturnRequestId, RetStatus (SM-RET-01), ReasonId, ActionId, VendorId, ShippingModelId, EligibilityRuleId, SellerResponseDueUtc, RefundTriggerId, FeeTotal, CaseId | RET-001 to RET-006, RET-010 | Side table 1:1 with native ReturnRequest; the native entity is not altered |
| ReturnEvidence (new) | Id, ReturnRequestId or CaseId, DownloadId, Type (Photo, Document, ProofOfDelivery, Inspection), UploadedBy, CreatedOnUtc | RET-001, RET-004, RET-007 | Files are native Download records; native ReturnRequest.UploadedFileId still holds the first file |
| ReturnEligibilityRule (new) | Id, Scope (Product, Vendor, Category), ScopeId, Returnable, WindowDays, WindowStart (OrderDate, DeliveryDate), ConditionsText (localised), StoreId, IsActive | RET-002 | Native Product.NotReturnable and OrderSettings window remain |
| ReturnShippingModel / ReturnDestinationRule (new) | Model: Name, Payer (Merchant, Customer, Shared, ClientSubsidised), RequiresLabel, InstructionsTopic, FeeRuleId; Rule: Condition (fulfilled by seller / client stock), Destination (Vendor address, Warehouse, StorePickupPoint) | RET-003 | Warehouse and StorePickupPoint are native entities |
| ReturnShipment (new) | Id, ReturnRequestIds, Type (Pickup, DropOff), DestinationType, DestinationId, CarrierAdapter, BookingReference, TrackingReference, LabelDownloadId, SlotUtc, Status (SM-RET-03) | RET-003 | Not a native Shipment: a native Shipment would change the order shipping status |
| ReturnInspection (new) | Id, ReturnRequestId, Location, InspectorId, ConditionGrade, AcceptedQuantity, RestockedQuantity, Outcome, Notes, CreatedOnUtc | RET-004 | Restock updates native ReturnRequest.ReturnedQuantity; the stock movement is posted through INV (IC-INV-01) |
| RefundTrigger (new) | Id, SourceType (BR-RET-042: Return, Cancellation, ServiceFailure, Case, BookingCancellation, ProviderNoShow, DepositRefund, PolicyIssueFailed, PartnerFulfilmentFailed, ApplicationRejected, PartialSupply, PlacementFailure), SourceModule, SourceId, OrderId (null for PlacementFailure), OrderItemId (null for order-level parts and PlacementFailure), OrderLevelComponent (Shipping, PaymentFee, CheckoutAttribute), CheckoutSessionId, PaymentTransactionId, Quantity, Amount, IdempotencyKey (unique), PayRefundId, Status, CreatedOnUtc | RET-005 | PAY Refund record (PAY-016) holds the money state |
| ReturnFeeRule / ReturnFee (new) | Rule: Type (Restocking, ReturnDelivery), Basis (Fixed, Percent), Value, Scope (Category, Vendor, Reason), EffectiveFromUtc, Version; Fee: ReturnRequestId, RuleId, Version, Amount | RET-006 | |
| DisputeCase (new) | Id, Number, Type, OrderId, OrderItemIds, ReturnRequestId, TicketId (CRM), SourceModule, SourceReference, RaisedByCustomerId, VendorId, ReasonCode, Priority, Queue, Status (SM-RET-02), AssignedTo, EscalationLevel, Decision, DecisionReasons, RemedyType, RemedyAmount, RejectionCount, CustomerAcceptedOnUtc, LegalHold, CreatedOnUtc, ClosedOnUtc | RET-007, RET-008 | Native OrderNote is not used for case content |
| CaseEvent (new) | Id, CaseId, Step, Actor, Note, CreatedOnUtc | RET-007 | Case log (BR-RET-061); platform audit through SEC-004 as well |
| CaseMessage (new) | Id, CaseId, FromCustomerId, Role (Customer, Seller, Staff), Text, AttachmentDownloadIds, IsHeld, IsHidden, HiddenReason, ModeratedBy, CreatedOnUtc | RET-011 | Native PrivateMessage and ContactVendor are not case-scoped and are not reused |
| TriageRule / ExternalBody / CaseExport (new) | Rule: Conditions (reason code, order value, case type, category), Priority, Queue, IsActive; Body: Name, Contact; Export: CaseId, BodyId, DownloadId, Sha256, ExportedBy, CreatedOnUtc | RET-008 | SLA policies, timers and escalation levels live in the CRM-014 component |
| IssueType (new) | Id, Name (localised), RequiresReturn, EvidenceRequired, IsActive | RET-007 | Values missing, damaged, wrong item from REQ-MPC-FR-240 |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Return reasons and actions | ReturnRequestReason, ReturnRequestAction | vertical → client | RET-001 | Core |
| Commerce extensions pack settings | Cart restriction rules, return fees, feed/syndication targets, PayPal method enablement and options (credentials entered per client instance, not stored in the pack) | vertical → client → store | CHK-011 / RET-006 / CAT-035 / PAY-003 | Commerce extensions pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Return requests enabled; window days; files allowed; file size (KB); number mask | ReturnRequestSettings.ReturnRequestsEnabled, NumberOfDaysReturnRequestAvailable, ReturnRequestsAllowFiles, ReturnRequestsFileMaximumSize, ReturnRequestNumberMask (native; moved from OrderSettings in 5.00, Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:13-33) | client → store | Not stated (KG-12) | Window "configured" (FR-226); value not stated |
| Return reasons and requested actions | ReturnRequestReason, ReturnRequestAction (native lists; config pack row) | vertical → client | Not stated (KG-12) | Standardised list (FR-227); values not stated |
| Returns-policy topic and dispute-process topic system names | RET settings (new) + Topic (native) | client → store | Policy content not provided (KG-12) | Dispute policy not provided (T-MISS) |
| Evidence upload enabled; maximum files per request | RET settings (new) | client | Not stated | Evidence "where permitted" (FR-227); limit not stated |
| Eligibility rules; window start | ReturnEligibilityRule (new) | vertical → client | Not stated | Per category and seller policy (FR-237); values not stated |
| Return shipping models and destination rules | ReturnShippingModel, ReturnDestinationRule (new) | client | Not stated | Four models (FR-228); rules in Table 10 — not provided (T-MISS) |
| Inspection condition grades; seller inspection allowed | RET settings (new) | client | Not stated | Not stated |
| Return fee rules | ReturnFeeRule (new); Commerce extensions pack row | vertical → client → store | Not stated | Could (FR-238); values not stated |
| Issue types and whether each needs a return | IssueType (new) | client | Not stated | Missing, damaged, wrong item (FR-240) |
| Remedy acceptance wait time; rejections before escalation | RET settings (new) | client | Not stated | Not stated |
| SLA policies (seller response, resolution) and escalation levels | CRM-014 SLA component (owner CRM) | client | Not stated | Configurable (FR-241, FR-311, FR-312); values not stated (T-MISS) |
| Triage rules | TriageRule (new) | client | Not stated | Configurable (FR-242) |
| External bodies for escalation | ExternalBody (new) | client | Not stated | Example MACRA named in FR-247; list not stated |
| Seller response timeout action (escalate / auto-approve) | RET settings (new) | client | Not stated | Not stated |
| Message pre-moderation | RET settings (new) | client | Not stated | Not stated |
| Retention periods for return and dispute records | PLT-020 retention rules (owner PLT) | country → client | Not stated (KG-18) | Per retention policy (FR-248); not stated (MG-13) |
| Report period for scheduled reports | RET settings (new) | client | Not stated | "Periodic" (FR-249); period not stated |
| Return conditions added in 5.00: completed orders only; downloadable products returnable; return reasons on; return actions on; guest returns; EU withdrawal wording; withdrawal link days | ReturnRequestSettings.ReturnRequestsForCompletedOrdersOnly, DownloadableProductsReturnRequestsAllowed, ReturnReasonsEnabled, ReturnActionsEnabled, GuestReturnRequestsAllowed, UseEuWithdrawalLocales, WithdrawalLinkDaysValid (native, Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:38-68) | client → store | Not stated | Not stated; product values on / off / on / on / off / off (VER-500, Proposed) |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront — order details | Return items link; Report a problem (entry owned by CRM-014) | RET-001, RET-007 | Native page; CRM-014 widget |
| Storefront | Return form with eligibility, conditions, evidence upload, fees notice, policy text | RET-001, RET-002, RET-006 | Native page extended (view override) |
| Storefront — My account | Return requests with RET detail, return shipment choice (pickup slot or drop-off), label download, refund breakdown | RET-001, RET-003, RET-005, RET-006 | Native list extended + new detail |
| Storefront — My account | My cases: case detail, evidence, remedy accept / reject, case messages | RET-007, RET-011 | New |
| Seller portal | Return requests of own products; seller inspection; case messages | RET-004, RET-010, RET-011 | New RET seller endpoints |
| Admin | Return requests (native list) with RET status and actions; status changes checked by BR-RET-001 | RET-001, RET-005 | Native page, RET filter and widget |
| Admin | Receipt and inspection (outlet or warehouse) | RET-004 | New |
| Admin | Cases queue and case view (log, evidence, decision, escalation, export) | RET-007, RET-008 | New |
| Admin | Eligibility rules, shipping models, destinations, fee rules, issue types, triage rules, external bodies | RET-002, RET-003, RET-006, RET-007, RET-008 | New |
| Admin | Returns and disputes report | RET-009 | New |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Ret.ItemNotEligible | One or more selected items cannot be returned. Please check your selection. | AC-RET-002-02-01 |
| Ret.WindowSettingConflict | The global return window is shorter than a rule window. Set it to 0 or to at least the longest rule window. | AC-RET-002-01-04 |
| Ret.EvidenceLimit | You have reached the maximum number of files for this return. | AC-RET-001-02-02 |
| Ret.PickupBooked | Your return pickup is booked. Keep the item ready at the time shown. | AC-RET-003-01-01 |
| Ret.DropOffInstructions | Take the item to one of the outlets listed and quote your return reference. | AC-RET-003-01-02 |
| Ret.StatusChangeNotAllowed | This status change is not allowed for this return or case. | AC-RET-004-01-02; BR-RET-001 |
| Ret.FeesNotice | Return fees may apply to these items. The estimated amounts are shown below. | AC-RET-006-02-01 |
| Ret.CaseOpened | Your case has been opened. We will contact you about the next steps. | AC-RET-007-01-01 |
| Ret.RemedyProposed | We have proposed a solution for your case. Please accept or reject it in your account. | AC-RET-007-02-02 |
| Ret.MessageHidden | This message has been hidden by a moderator. | AC-RET-011-03-01 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Every RET message goes through TRK-005 (decision MSG-ROUTE). Native return messages use the native templates NewReturnRequest.StoreOwnerNotification, NewReturnRequest.CustomerNotification and ReturnRequestStatusChanged.CustomerNotification, sent through IWorkflowMessageService, whose single override is TRK-005 (BR-TRK-020). RET's own notifications are product event codes registered by the RET plugin at installation through IC-TRK-04 RegisterEventCode and sent through IC-TRK-04 SendEvent (BR-TRK-023, RET return and case updates; names Proposed): Returns.Core.SellerReturnRequested, Returns.Core.ReturnShipmentBooked, Returns.Core.CaseUpdated, Returns.Core.CaseMessage, Returns.Core.SlaBreached, Returns.Core.RefundAttention. TRK-005 applies channels and TRK-006 preferences to all of them. RET-011 case messages are notices that a message is waiting, not conversational replies sent outside TRK.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| PAY-016 refund service | RequestRefund (IC-PAY-05, consumed as IC-RET-02); Refund.Completed / Refund.Failed events | PAY module | RET moves no money |
| Refund-trigger sources | RaiseRefundTrigger (IC-RET-04) | SVC-003, SVC-004, FIN-003, FIN-005, EGV-002, ORD-006 (IC-ORD-05), CHK-004 | Source types per BR-RET-042 |
| Seller settlement (SEL-017) | AddSellerCharge (IC-SEL-05), source type ReturnShipping | SEL module | Merchant-paid return shipping (BR-RET-020) |
| Tracking references and notifications (TRK) | RegisterExternalReference (IC-TRK-01); RegisterEventCode and SendEvent (IC-TRK-04) | TRK module | — |
| Files (ADM-008, SEC-002) | Upload contexts registered with ADM-008; download rule provider to the SEC-002 filter | ADM, SEC modules | Decision SINGLE-FILTER |
| Carrier connector framework (LOG-021), labels (LOG-007), logistics tasks (LOG-011) | Book return pickup, label, cancel booking (IC-RET-03) | Carriers (not named for returns) | Reverse booking is an adapter capability |
| Tracking event hub (TRK-002) | Tracking events for return references registered through IC-TRK-01 | Carriers, outlet scans | — |
| Proof of delivery (LOG-012) | POD records linked to cases | LOG module | — |
| Help desk (CRM-001, CRM-006, CRM-014) | Case from ticket, ticket link, Report a problem entry, SLA timers and escalation levels | CRM module | — |
| Retention (PLT-020) | Record types and purge handler | PLT module | — |
| External dispute bodies | Case file export (ZIP) handed over outside the system | For example MACRA (FR-247 example) | No system interface stated |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-RET-01 | OpenCase | Type (OrderIssue, ReturnDispute, BuyerSellerDispute, PaymentDispute), order ID, item IDs, source module and reference, raised-by, description, evidence Download IDs | Case ID and number | Order not found, not allowed for the caller | RET service (DI), called by PAY-007, PAY-035, PAY-036, CRM-006, CRM-014 (Report a problem) and the RET storefront pages |
| IC-RET-01 | HasOpenCase / GetCases | Order ID | True or false; list of cases with status | — | RET service; used synchronously by PAY before escrow release or payment confirmation and by ORD-002 before order acceptance (BR-RET-062) |
| IC-RET-01 | Case events | — | DisputeCase.Opened, RemedyProposed, Closed (with source reference); Return.Completed (BR-RET-064) | — | RET module events published through IEventPublisher; consumers notify or enqueue only |
| IC-RET-02 | RequestRefund (RET to PAY-016) | Order ID (none for PlacementFailure), lines (OrderItem ID, quantity, amount), order-level parts (component, amount), for PlacementFailure the CheckoutSession reference and PaymentTransaction ID, reason, source type and ID, idempotency key (BR-RET-041) | PAY Refund ID and state (Initiated / awaiting approval) | Exceeds refundable amount (BR-PAY-081), duplicate key | PAY-016 refund request operation IC-PAY-05 (BR-PAY-085 for order-level parts and PlacementFailure), consumed by RET as IC-RET-02; PAY accepts it only from RET-005 and returns the first Refund for a repeated idempotency key (BR-PAY-084); PAY then raises Refund.Completed or Refund.Failed carrying the RET source type and source ID |
| IC-RET-04 | RaiseRefundTrigger (other modules to RET) | Source module, source type registered for that module (BR-RET-042), source ID, order ID (none for PlacementFailure), lines (OrderItem ID, quantity, amount), order-level parts (component Shipping, PaymentFee or CheckoutAttribute; amount), for PlacementFailure the CheckoutSession ID, PaymentTransaction ID and amount, reason | RefundTrigger ID and state | Unregistered source type or wrong module, amount above refundable, duplicate key (returns the first trigger) | RET service; the only path from SVC, FIN, EGV, ORD (IC-ORD-05), CHK and any other module to PAY-016 (refund-trigger decision: RET-005 single owner). Order-level parts and PlacementFailure are passed to PAY in IC-PAY-05 (BR-PAY-085, Proposed) |
| IC-RET-03 | BookReturn (RET to LOG-021) | Pickup address or drop-off outlet, destination, parcel data, return reference | Booking reference, tracking reference, label (if any) | Not supported by adapter, no slot | LOG-021 carrier connector operation BookReturn (IC-LOG-01, reverse-booking capability per adapter); cancellation through IC-LOG-01 Cancel |

RET exposes IC-RET-01 and IC-RET-04 and consumes IC-RET-02 (PAY IC-PAY-05) and IC-RET-03 (LOG IC-LOG-01 BookReturn). It also calls IC-TRK-01 RegisterExternalReference and IC-TRK-04 (TRK), IC-SEL-05 AddSellerCharge (SEL), and is a rule provider to the SEC-002 download filter and an upload-context registrant of ADM-008 (decision SINGLE-FILTER). Operation signatures (C# interfaces) are produced at L2 build start and approved by the tech lead; this table fixes the operations and their meaning. All names are Proposed.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Refund trigger raised by another module | IC-RET-04 call (SVC, FIN, EGV, ORD, CHK; BR-RET-042) | RET-005 creates the RefundTrigger and requests the refund from PAY-016 |
| Return.Requested | None specific (RET raises it from the IReturnRequestService.InsertReturnRequestAsync override after the insert) | RET-010 seller notification, RPT |
| Return.StatusChanged | None specific (RET services; native EntityUpdatedEvent<ReturnRequest> carries no previous value) | TRK-005 notifications, RPT |
| Order cancelled | OrderStatusChangedEvent (native, with PreviousOrderStatus) | RET consumer enqueues a refund trigger (RET-005) |
| Refund.Completed / Refund.Failed | PAY module events (PAY-016) | RET consumer enqueues a status sync; the RET task applies it |
| Service.Failed | SVC-005 module event | RET consumer enqueues a refund trigger |
| Delivery outcome lost, damaged or returned to sender | DeliveryOutcomeRecorded (LOG module event, IC-LOG-05) | RET consumer enqueues; the RET task opens an OrderIssue case (RET-007) |
| Listing.Withdrawn | CAT-024 module event | RET consumer enqueues; the RET task flags open cases of orders containing the product (AC-RET-007-02-04); no automatic action (not stated in source) |
| Return.Completed | None (RET module event, BR-RET-064) | ORD-002 maps it to the order stage Returned; RPT |
| Return tracking event | TRK-002 tracking event (module event) | RET consumer enqueues a ReturnShipment update |
| POD recorded | ProofOfDeliveryRecorded (LOG module event, IC-LOG-05) | RET consumer enqueues the evidence link |
| Sla.Breached | CRM-014 SLA component event | RET escalation (BR-RET-070), through the SLA task, not the consumer |
| DisputeCase.Opened / RemedyProposed / Closed | None (RET module events) | CRM-006 ticket link, TRK notifications, RPT |
| Admin status change | Admin ReturnRequestController.Edit [POST] — RET action filter | BR-RET-001 check before save |
| Return submit | ReturnRequestController.ReturnRequestSubmit [POST] — RET action filter; InsertReturnRequestAsync override | BR-RET-012 check before insert |
| File download | Nop.Web DownloadController.GetFileUpload, Admin DownloadController.DownloadFile — single SEC-002 filter (BR-SEC-005) | RET rule provider answers for RET files (BR-RET-092) |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Seller response and SLA timeout on the same return | RET-010, RET-008 | Both run under ILocker.PerformActionWithLockAsync keyed 'ret-request-{ReturnRequestId}' (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 §6.4); whichever runs second re-reads the status and does nothing if it changed |
| Two staff save an inspection or status change on the same return | RET-004, RET-001 | Same lock; ReturnRequestExt carries its own row version (plugin table, no core change); the second save fails with message Ret.StatusChangeNotAllowed and is re-read |
| Duplicate refund triggers (event replay, retry, double click) | RET-005 | Unique idempotency key on RefundTrigger (BR-RET-041); PAY additionally applies BR-PAY-081 under its lock 'pay-order-{OrderId}' |
| Customer accepts a remedy while staff escalate the case | RET-007, RET-008 | Case actions run under the lock 'ret-case-{CaseId}'; the second action re-reads the state and is refused if the transition is no longer allowed (SM-RET-02) |
| PAY asks HasOpenCase while a case is being opened | RET-007, PAY-007 | OpenCase commits before returning; PAY calls HasOpenCase inside its own escrow-release lock, so a case committed before the call blocks the release (BR-RET-062) |
| Tracking event arrives for a cancelled return shipment | RET-003 | Ignored after logging; the shipment stays Cancelled |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Return request submitted | Store owner; shopper | Email (native NewReturnRequest templates) | RET-001 |
| Return request for a seller's product | Seller | Event code Returns.Core.SellerReturnRequested (IC-TRK-04), channels per TRK-005 | RET-010 |
| Return status changed | Shopper | Email (native ReturnRequestStatusChanged.CustomerNotification) + channels per TRK-005 | RET-001, RET-004, RET-005 |
| Return pickup booked / drop-off instructions | Shopper | Event code Returns.Core.ReturnShipmentBooked (IC-TRK-04), channels per TRK-005 | RET-003 |
| Case opened, remedy proposed, case closed | Shopper; seller where linked | Event code Returns.Core.CaseUpdated (IC-TRK-04), channels per TRK-005 | RET-007 |
| New case message | Other party | Event code Returns.Core.CaseMessage (IC-TRK-04), channels per TRK-005 | RET-011 |
| SLA breached / case escalated | Assignee; next level | Admin notification + event code Returns.Core.SlaBreached (IC-TRK-04) | RET-008 |
| Refund request failed or waiting for approval | Support and finance staff | Admin notification + event code Returns.Core.RefundAttention (IC-TRK-04) | RET-005 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Returns and disputes report (rate, reasons, resolution time, outcomes) | RET-009 | REQ-MPC-FR-249 |
| Cases queue with priority, due time and breach flag | RET-008 | REQ-MPC-FR-241, FR-242 |
| Seller return list with due times | RET-010 | REQ-MPC-FR-230 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-RET-001 | Return status change | System / staff / seller | ReturnRequest, ReturnRequestExt | old and new RET status, old and new native status, reason |
| AUD-RET-002 | Eligibility rule change | Administrator | ReturnEligibilityRule | old values, new values |
| AUD-RET-003 | Inspection recorded | Warehouse / outlet staff / seller | ReturnInspection | outcome, accepted and restocked quantity, condition grade |
| AUD-RET-004 | Refund trigger created / sent | System | RefundTrigger | source, amount, idempotency key, PAY refund ID |
| AUD-RET-005 | Fee rule change | Administrator | ReturnFeeRule | old values, new values, effective date |
| AUD-RET-006 | Case opened / status change | Shopper / staff / system | DisputeCase | old and new status, source |
| AUD-RET-007 | Decision and remedy recorded; remedy accepted or rejected | Staff / shopper | DisputeCase | decision, reasons, remedy, amount |
| AUD-RET-008 | Escalation (internal, SLA breach, external) and case export | Staff / system | DisputeCase, CaseExport | level, target, file hash |
| AUD-RET-009 | Case message hidden or released | Staff | CaseMessage | reason, moderator |
| AUD-RET-010 | Records purged or archived under retention | System | Retention run | record types, counts, rule |
| AUD-RET-011 | Seller response or staff override | Seller / staff | ReturnRequestExt | response, reason |

Business audit events AUD-RET-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id; old and new entity values are captured by the SEC-004 IRepository<> decorator, so every RET write goes through IRepository<> (BR-RET-091). The native activity log is not used as the audit record. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-RET-001 | Evidence files are stored as native Download records, limited in number and size by settings, and checked for type and content by ADM-008 before they are linked. | REQ-MPC-FR-227; ADM-008 | AC-RET-001-02-01, AC-RET-001-02-02 |
| NFR-RET-002 | A refund is requested at most once per source and line (idempotency). | NFR-X-007; BR-RET-041 | AC-RET-005-04-01; test note T-RET-03 |
| NFR-RET-003 | Every return, case, decision, escalation, moderation and purge action is audited (NFR-X-003). | REQ-MPC-FR-235, FR-236, FR-248 | §14.2 audit events |
| NFR-RET-004 | Case data and evidence are personal data handled under the country data-protection profile (SEC-012) and purged only by retention rules. | NFR-X-002; REQ-MPC-FR-248 | AC-RET-009-01-01 |
| NFR-RET-005 | Exported case files are complete and verifiable (hash recorded). | REQ-MPC-FR-247 | AC-RET-008-03-01 |
| NFR-RET-006 | Response-time targets for return and case pages: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-RET-001 | P1 | — | PRD-RET-010 |
| PRD-RET-002 | P1 | — | |
| PRD-RET-003 | P1 | — | |
| PRD-RET-004 | P1 | — | |
| PRD-RET-005 | P1 | PRD-PAY-016 | |
| PRD-RET-006 | P1 | — | |
| PRD-RET-007 | P1 | PRD-ADM-002, PRD-CRM-014 | PRD-PAY-036, PRD-RET-008, PRD-RET-011, PRD-CRM-004 |
| PRD-RET-008 | P1 | PRD-ADM-002, PRD-RET-007, PRD-CRM-014 | |
| PRD-RET-009 | P1 | — | |
| PRD-RET-010 | P1 | PRD-RET-001, PRD-CRM-014 | |
| PRD-RET-011 | P1 | PRD-RET-007 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-RET-01 | Eligibility: for each precedence level of BR-RET-011, test listed and not-listed items; post crafted forms with ineligible items and excess quantities and assert no ReturnRequest is created. |
| T-RET-02 | State models: every transition of SM-RET-01, SM-RET-02 and SM-RET-03 is tested; every transition not listed is rejected, including from the native admin edit page. |
| T-RET-03 | Refund triggers: replay inspection saves, cancellation events and PAY events; assert one PAY refund request per source and line, and correct partial amounts after fees. For every source type of BR-RET-042, raise it from its registered module (accepted once) and from another module (refused); PartialSupply from ORD-006 refunds only the proposal lines; PlacementFailure and order-level parts are recorded and listed for finance staff until IC-PAY-05 supports them. |
| T-RET-04 | Seller isolation: a seller cannot list, open or act on returns, inspections or case messages of another vendor; Vendors hold no native return-request permission. |
| T-RET-05 | Case file export: content matches the case log, evidence and messages; the recorded hash matches the file. |
| T-RET-06 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
| T-RET-07 | Conformance: with productfeature.<RET feature ID> off for a store, RET pages, widgets and tasks do nothing for that store; every RET setting key is in the key catalogue; Return.Completed is published once per accepted return and HasOpenCase blocks ORD acceptance. |
