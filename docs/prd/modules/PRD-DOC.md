# L2 Module PRD — DOC: Documents and records

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | DOC — Documents and records |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Generates the client's documents — invoices, packing lists, receipts, letters, certificates and the export document set — from templates filled automatically from the platform record, in several formats and languages, with the client's branding, seal, watermark and a QR code that links back to the record. It stores documents with versions, search, retention and legal hold, protects them with fingerprints and digital signatures, routes drafts through review, exports document sets for compliance, and defines and checks the documents each process needs.

**In scope**

- Template-based document generation replacing the native invoice and packing-slip PDFs (DOC-001)
- Document store with versions, search, retention classes, legal hold and the participant document vault (DOC-002)
- Document integrity: fingerprints (hashes), digital signatures, automatic watermarks, verification page (DOC-003)
- Document review and approval; compliance export packages (DOC-004)
- Document requirements per process and validation of uploaded documents (DOC-005)
- Export document set: commercial invoice, packing list, certificate of origin, phytosanitary certificate reference (DOC-006)

**Not in this module**

| Item | Where it is |
|---|---|
| Invoice numbering, invoice issue rules, proforma invoice and award letters as business objects | ORD-007, ORD-009, ORD-025, ORD-020 (DOC-001 renders their documents) |
| Statutory e-invoicing submission and fiscal number | PAY-025 to PAY-027 (fiscal fields are printed through a DOC token provider) |
| Contract e-signature process (signers, order, quorum, callbacks) | ORD-017 (multi-party envelope adapter IC-ORD-06; uses the DOC-003 contract IC-DOC-04 only to verify returned signatures and for the client's organisational signature) |
| Retention engine (record types, periods, disposal runs) | PLT-020 (DOC-002 registers document types as record types) |
| OCR and identity-document checks | AI-005 (AI pack; optional provider of IC-DOC-06 to DOC-005) |
| Upload type, size and virus checks | ADM-008 (DOC registers its upload contexts through IC-ADM-08) |
| Ownership check when a stored document file is requested through the native download actions | SEC-002 (single download-ownership filter; DOC is a rule provider through IC-SEC-05) |
| Approval queues used for document review | ADM-006 (held by WF-ENG) |
| Cross-border product fields (HS code, origin) and Incoterms | CAT-015, ORD-026 |
| Seller KYC process | SEL-002 (stores its documents in DOC-002) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-DOC-001 | Document generation | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | DOC-LIB |
| PRD-DOC-002 | Document storage | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-DOC-003 | Document integrity | Platform / back-office | P2 | Code-level | Custom plugin + External system + integration plugin | Core (always on) | | |
| PRD-DOC-004 | Document review and compliance export | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-DOC-005 | Document requirements and validation | Platform / back-office | P2 | External system | External system + integration plugin | Core (always on) | PRD-DOC-002 | |
| PRD-DOC-006 | Export document set | B2B | P1 | Code-level | Custom plugin | B2B trade pack | PRD-DOC-001 | DOC-LIB |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Client staff (finance, sales, export) | Generate, view and send documents; record certificate references | Administrators or roles holding the DOC permissions (IAM-007) |
| Template designer | Creates and changes document templates per type, language and store | Administrators |
| Shopper / business buyer / seller | Downloads own invoices and documents; keeps documents in the vault; uploads required documents | Registered (native); Vendors (native) for own documents |
| Reviewer | Reviews and approves draft documents | Roles named on the review chain (ADM-006) |
| Compliance staff / auditor | Places legal holds, runs compliance exports, verifies documents | Role system names "Compliance" and "Auditor" (Proposed; IAM role catalogue BR-IAM-050) |
| Any third party | Checks a document through its QR code on the verification page | Anonymous (public page, no personal data) |
| Signing service; OCR service (systems) | Sign documents; read text from scans | External systems (not named in source) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Orders.OrdersView (native) | Orders | Print invoices and packing slips from admin order pages (now rendered by DOC-001 templates) | Administrators, Vendors (native defaults; vendor prints only own items) |
| Documents.Core.Templates.View | ContentManagement | View document templates and versions | Administrators |
| Documents.Core.Templates.CreateEditDelete | ContentManagement | Create, change, activate and retire document templates | Administrators |
| Documents.Core.Documents.View | Orders | Search and open stored documents of all owners | Administrators, Compliance, Auditor |
| Documents.Core.Documents.CreateEditDelete | Orders | Generate, upload, supersede and delete documents (deletion blocked by legal hold) | Administrators |
| Documents.Core.LegalHold.CreateEditDelete | System | Place and release legal holds | Compliance |
| Documents.Core.Export.Create | System | Run compliance export packages | Compliance, Auditor |
| Documents.Core.Requirements.CreateEditDelete | Configuration | Define document requirements per process | Administrators |
| Documents.Core.ExportSet.CreateEditDelete | Orders | Produce the export document set and record certificate references | Administrators |

Permissions are declared in the DOC plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). Native Orders.OrdersView is reused for the admin PDF buttons. New system names use the plugin prefix Documents.Core and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is one of the native categories. Customers and vendors reach only their own documents through storefront and vendor endpoints that check ownership (customer of the order or document; vendor of the order items or document); native admin PDF actions for vendors keep their native vendor filter. Default roles are given by role system name. Every role name is in the IAM role catalogue (BR-IAM-050): Auditor and Compliance; IAM creates catalogue roles that are missing, and DOC relies on IAM for that. All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-DOC-PERM-01 | **Given** a user without Orders.OrdersView (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-DOC-PERM-02 | **Given** a user without Documents.Core.Templates.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-DOC-PERM-03 | **Given** a user without Documents.Core.Templates.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-DOC-PERM-04 | **Given** a user without Documents.Core.Documents.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-DOC-PERM-05 | **Given** a user without Documents.Core.Documents.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-DOC-PERM-06 | **Given** a user without Documents.Core.LegalHold.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-DOC-PERM-07 | **Given** a user without Documents.Core.Export.Create, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-DOC-PERM-08 | **Given** a user without Documents.Core.Requirements.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-DOC-PERM-09 | **Given** a user without Documents.Core.ExportSet.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-DOC-001 | PdfService (PrintOrderToPdfAsync, PrintPackagingSlipToPdfAsync, PrintProductsToPdfAsync) and PdfSettings unchanged (IPdfService method list identical to 4.90.8). RFQ plugin adds a quote PDF (Plugins/Nop.Plugin.Misc.RFQ/Services/Pdf/QuoteDocument.cs). No template engine, QR, seal, watermark, letters/certificates. | Template-based document generator (invoices, letters, certificates), multiple formats, branding, seal/watermark, QR code; replaces PG AFR custom invoice (ORD-02). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-DOC-002 | Download entity (binary/URL) for downloadable products and uploads; Misc.AzureBlob stores picture thumbs only. No document versions, retention or legal hold. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Media/Download.cs; src/Plugins/Nop.Plugin.Misc.AzureBlob/plugin.json ('store pictures (thumbs)')] | Document store with versions, search, retention and legal hold (custom plugin over blob storage, or integrate an external ECM). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-DOC-003 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No signing component in src/Libraries/Nop.Services] | Hashing, digital signatures (external PKI/HSM), watermarking on generated documents. | Custom plugin + External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |
| PRD-DOC-004 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No document entity in src/Libraries/Nop.Core/Domain] | Document review/approval (via ADM-006) and compliance bundle export. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |
| PRD-DOC-005 | File-type and size checks per attribute (ValidationFileAllowedExtensions, ValidationFileMaximumSize). No OCR, signature validation or profile matching. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/ProductAttributeMapping.ValidationFileAllowedExtensions] | OCR / document-verification and signature-validation service; nopCommerce needs a plugin defining required documents per process and calling the service. works without AI-005; with no IC-DOC-06 provider every document goes to manual review (AC-DOC-005-03-02). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-DOC-006 | Invoice and packaging slip PDFs only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Common/IPdfService.cs] | Export document set (commercial invoice, packing list, certificate of origin, phytosanitary reference) templates on DOC-001. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-DOC-001 Document generation

| Item | Value |
|---|---|
| Description (baseline) | Creates documents (invoices, letters, certificates) from templates that fill in details automatically, in several formats and languages, with the client's branding, seal or watermark and a QR code. |
| Why it matters | Professional, consistent documents without manual work. |
| Who benefits | Client staff; customers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-DOC-001-01 | As a member of client staff, I want documents such as invoices, receipts, letters and certificates created from templates that fill in the details from the record, so that documents are consistent and need no manual work. | D; FC-M16-001; FC-M02-034; FC-M02-035 | On hold: DOC-LIB |
| US-DOC-001-02 | As a member of client staff, I want the same document in several formats, so that I can print, edit or embed it as needed. | D; FC-M16-002 | On hold: DOC-LIB |
| US-DOC-001-03 | As a customer, I want documents in my language, so that I can read them. | D; FC-M16-003; FC-M02-036 | On hold: DOC-LIB |
| US-DOC-001-04 | As a client, I want documents to carry my branding, seal or watermark and a QR code linking back to the record, so that documents are recognisably ours and can be checked. | D; FC-M16-004; FC-M02-037 | On hold: DOC-LIB |
| US-DOC-001-05 | As a member of client staff, I want every invoice and packing slip the platform prints or attaches to e-mails to use the client template, so that there is one invoice layout everywhere. | D; FIT (gap: replaces the Post Gebeya AFR custom invoice, ORD-02) | On hold: DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-DOC-001-01-01 | US-DOC-001-01 | **Given** a template for a document type, language and store with tokens (for example %Order.OrderNumber%), **when** it is saved, **then** every token must be known to a token provider — native IMessageTokenProvider groups (store, order, shipment, customer, vendor, product, gift card, return request) or a module provider registered through IC-DOC-02; an unknown token refuses the save with message Doc.TemplateTokenUnknown. | D; FC-M02-035; FIT (5.00.1: IMessageTokenProvider — GetListOfAllowedTokensAsync(messageTemplate, tokenGroups) and AddReturnRequestTokensAsync(tokens, returnRequest, order, orderItem, languageId) changed signature in 5.00, Libraries/Nop.Services/Messages/IMessageTokenProvider.cs:91, 211; the forum and news token groups left core; ITokenizer.Replace; EntityTokensAddedEvent) |
| AC-DOC-001-01-02 | US-DOC-001-01 | **Given** an active template and a source record, **when** a document is generated (IC-DOC-01), **then** tokens are replaced with the record values (ITokenizer.Replace) and line tables are filled from the record lines; if a token marked required has no value, generation fails with message Doc.GenerationDataMissing naming it and no document is stored. | D; FC-M16-001; FC-M02-035 |
| AC-DOC-001-01-03 | US-DOC-001-01 | **Given** a document is generated, **when** generation completes, **then** the result is stored in DOC-002 as a new document or a new version, linked to the source record. | D; Proposed |
| AC-DOC-001-02-01 | US-DOC-001-02 | **Given** a template allows PDF, DOCX, image (PNG) and HTML outputs, **when** the user requests each format, **then** each is produced from the same template and data; PDF is always available. | D; FC-M16-002 |
| AC-DOC-001-03-01 | US-DOC-001-03 | **Given** the template exists in the customer's language, **when** a document is generated for that customer, **then** it is produced in that language; if not, in the store default language; for a language with Language.Rtl true the layout is right to left and uses PdfSettings.RtlFontName. | D; FC-M16-003; FIT (Language.Rtl; PdfSettings.RtlFontName, LtrFontName; OrderSettings.GeneratePdfInvoiceInCustomerLanguage) |
| AC-DOC-001-04-01 | US-DOC-001-04 | **Given** branding is set for the store, **when** a document is generated, **then** it carries the logo (template logo, else PdfSettings.LogoPictureId), the seal image and signing officer's designation set on the template, and footer texts (PdfSettings.InvoiceFooterTextColumn1 and 2 for invoices). | D; FC-M16-004; FC-M02-037; FIT (PdfSettings) |
| AC-DOC-001-04-02 | US-DOC-001-04 | **Given** a watermark rule applies to the document type or state (DOC-003), **when** a document is rendered, **then** the watermark text is drawn on every page. | D; FC-M02-037 |
| AC-DOC-001-04-03 | US-DOC-001-04 | **Given** QR codes are enabled for the document type, **when** a document is generated, **then** it carries a QR code encoding the verification URL of that document (DOC-003). | D; FC-M02-037 |
| AC-DOC-001-05-01 | US-DOC-001-05 | **Given** an active invoice template exists for the store, **when** an invoice PDF is requested from the admin order page, the storefront order page (GetPdfInvoice) or attached to an order e-mail (OrderSettings.AttachPdfInvoiceTo...Email via SaveOrderPdfToDiskAsync), **then** the PDF is rendered from the template through the DOC override of IPdfService (PrintOrderToPdfAsync, PrintOrdersToPdfAsync, SaveOrderPdfToDiskAsync), with the invoice data supplied by the ORD-009 token provider (IC-ORD-07, registered through IC-DOC-02); the vendor parameter still limits the lines to that vendor's items. | D; FIT (5.00.1: IPdfService unchanged, Libraries/Nop.Services/Common/IPdfService.cs:26-73; Admin and storefront OrderController; OrderProcessingService.SaveOrderPdfToDiskAsync calls); OVR-REG |
| AC-DOC-001-05-02 | US-DOC-001-05 | **Given** ORD-009 has registered its document token provider (IC-ORD-07) through IC-DOC-02 and supplied the Invoice and ConsolidatedReceipt template content, **when** an invoice or consolidated receipt is rendered, **then** the sub-order list, seller name and tax number, company tax fields and fee lines come from the ORD tokens and the layout from the active DOC-001 template; ORD registers no IPdfService implementation (BR-DOC-001). | OVR-REG; Proposed; see ORD-009 |
| AC-DOC-001-05-03 | US-DOC-001-05 | **Given** an active packing-slip template exists, **when** a packaging slip is printed from admin (PrintPackagingSlipToPdfAsync, PrintPackagingSlipsToPdfAsync), **then** it is rendered from the template. | FIT (IPdfService) |
| AC-DOC-001-05-04 | US-DOC-001-05 | **Given** no active template exists for a document type and store, **when** that document is requested, **then** the native nopCommerce rendering is used unchanged. | Proposed |
| AC-DOC-001-04-04 | US-DOC-001-04 | **Given** PAY-025 returns a fiscal number and QR payload for an invoice, **when** the invoice is rendered, **then** they are printed through the PAY token provider registered with DOC (IC-DOC-02); PAY does not override IPdfService (BR-DOC-001). | see PAY-025 (fiscal fields); OVR-REG; Proposed |
| AC-DOC-001-01-04 | US-DOC-001-01 | **Given** an AI-009 or AI-004 draft (contract, letter) is created from an active DOC-001 template, **when** the draft is saved, **then** it is stored in DOC-002 as a Draft document labelled as AI-generated; it becomes Final and can be issued or sent only after a person edits or approves it (DOC-004 review where the type requires review, otherwise the issuing staff member's explicit approval), and the approver is audited (AUD-DOC-002, BR-DOC-003). | Proposed (BR-AI-002); see AI-009 |
| AC-DOC-001-05-05 | US-DOC-001-05 | **Given** an order carries order-total adjustments recorded by the CAT-042 order-total host (OrderTotalAdjustment rows, BR-CAT-033; for example the PAY-009 wallet deduction under WAL-01 option (b)), **when** its invoice or consolidated receipt is rendered, **then** the template token %Order.TotalAdjustments%, registered by CAT through IC-DOC-02 and read from IC-CAT-06 GetOrderAdjustments, prints one line per adjustment with its label and amount, so the printed total equals the order total; DOC stores no adjustment data and calls no PAY or CAT service itself — held by WAL-01 (option (b) only). | Proposed; WAL-01; see CAT-042 |

**Business rules applied:** BR-DOC-001; BR-DOC-002; BR-DOC-003; BR-DOC-050; BR-DOC-060 (§8.1).


### 7.2 PRD-DOC-002 Document storage

| Item | Value |
|---|---|
| Description (baseline) | Stores documents with versions, search, retention rules and the ability to prevent deletion during legal matters. |
| Why it matters | Documents are safe, findable and kept as long as required. |
| Who benefits | Client staff; auditors |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-DOC-002-01 | As a member of client staff, I want every document kept with all its versions, so that the full history is available. | D; FC-M16-005 | Ready |
| US-DOC-002-02 | As a member of client staff, I want to find documents by their details and their content, so that documents are findable. | D; FC-M16-006 | Ready |
| US-DOC-002-03 | As a compliance staff member, I want retention rules per document type, so that documents are kept as long as required and no longer. | D; FC-M16-007 | Ready |
| US-DOC-002-04 | As a compliance staff member, I want to stop deletion of documents during a legal matter, so that evidence is preserved. | D | Ready |
| US-DOC-002-05 | As a buyer or seller, I want a vault of my uploaded documents (tax certificates, licences) for reuse, so that I do not upload the same document again. | FC-M06-016 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-DOC-002-01-01 | US-DOC-002-01 | **Given** a document is stored (generated, uploaded or received), **when** it is saved, **then** a DocumentRecord holds type, number, owner (customer, vendor), source entity, language, retention class and status, and a DocumentVersion holds the binary as a native Download (DownloadId), format, SHA-256 hash (DOC-003), created by and created on; uploads pass ADM-008 checks first. | D; FC-M16-005; FIT (Download entity) |
| AC-DOC-002-01-02 | US-DOC-002-01 | **Given** a document is regenerated, edited or superseded, **when** the new content is saved, **then** a new version is added and becomes current; earlier versions remain listable and downloadable. | D; FC-M16-005 |
| AC-DOC-002-02-01 | US-DOC-002-02 | **Given** documents exist, **when** a user with Documents.Core.Documents.View searches by type, number, owner, source entity, language or date range, **then** matching documents are listed with their current version. | D; FC-M16-006 |
| AC-DOC-002-02-02 | US-DOC-002-02 | **Given** text was extracted when a PDF, DOCX or text document was stored, **when** a user searches for a word in the content, **then** documents containing it are listed; scanned images are searchable only after OCR (DOC-005, AI-005). | D; FC-M16-006; Proposed |
| AC-DOC-002-03-01 | US-DOC-002-03 | **Given** a document type has a retention class registered as a PLT-020 record type (IC-PLT-08, hold check = legal hold), **when** the PLT-020 retention task runs, **then** documents past their period are disposed of by the rule action unless under legal hold (BR-DOC-010). | D; FC-M16-007 |
| AC-DOC-002-04-01 | US-DOC-002-04 | **Given** a legal hold is placed on a document, on all documents of an entity (for example a customer or order) or on a document type, with a reason, **when** anyone tries to delete a held document or the retention task reaches it, **then** deletion is refused with message Doc.LegalHoldActive and the retention task skips it (BR-DOC-010). | D |
| AC-DOC-002-04-02 | US-DOC-002-04 | **Given** a legal hold is released by a user with Documents.Core.LegalHold.CreateEditDelete, **when** the release is saved, **then** the documents become subject to normal retention again; placing and releasing are audited (AUD-DOC-003). | D; Proposed |
| AC-DOC-002-05-01 | US-DOC-002-05 | **Given** a registered buyer or a seller, **when** they upload a document to their vault with type and expiry date, **then** the file is checked by ADM-008 under the DOC context document vault (IC-ADM-08 CheckUpload) and stored as their document, and can be attached to later processes (DOC-005) without uploading again; another customer or vendor cannot open it, also not through the native download actions (BR-DOC-011). | FC-M06-016 |
| AC-DOC-002-05-02 | US-DOC-002-05 | **Given** a vault document has an expiry date, **when** the date passes, **then** it is marked expired and is no longer accepted by DOC-005 requirements that need a valid document. | FC-M06-016; Proposed |

**Business rules applied:** BR-DOC-010; BR-DOC-011; BR-DOC-050; BR-DOC-060 (§8.1).


### 7.3 PRD-DOC-003 Document integrity

| Item | Value |
|---|---|
| Description (baseline) | Protects documents against tampering using digital fingerprints, digital signatures and watermarks. |
| Why it matters | Anyone can check that a document is genuine. |
| Who benefits | Customers; auditors |
| Phase | P2 |
| Implementation | Code-level — Custom plugin + External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-DOC-003-01 | As an auditor, I want every document fingerprinted when created and checkable later, so that tampering is detected. | D; FC-M16-009 | Ready |
| US-DOC-003-02 | As a customer or auditor, I want documents signed digitally by the client, so that anyone can check a document is genuine. | D; FC-M16-008 | Ready |
| US-DOC-003-03 | As a member of client staff, I want watermarks applied automatically by document type or access context, so that drafts and copies are marked. | D; FC-M16-010 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-DOC-003-01-01 | US-DOC-003-01 | **Given** a document version is stored, **when** storage completes, **then** its SHA-256 hash is stored with the version and written to the audit trail (AUD-DOC-001). | D; FC-M16-009 |
| AC-DOC-003-01-02 | US-DOC-003-01 | **Given** a stored version, **when** a user or the scheduled integrity check verifies it, **then** the hash is recomputed; Match or Mismatch is recorded; a mismatch raises an alert and an ADM-009 exception. | D; FC-M16-009 |
| AC-DOC-003-01-03 | US-DOC-003-01 | **Given** a QR code on a document is scanned, **when** the verification page opens, **then** it shows document type, number, issue date, version and whether the stored hash matches, with no personal data. | D; Proposed |
| AC-DOC-003-02-01 | US-DOC-003-02 | **Given** organisational signing is configured with the external signing service (IC-DOC-04), **when** a document type marked "sign" is generated, **then** the PDF is signed by the service, the signature details (signer, time, certificate reference) are stored and the signed file becomes the current version. | D; FC-M16-008 |
| AC-DOC-003-02-02 | US-DOC-003-02 | **Given** a signed document, **when** its signature is verified, **then** the result (valid, invalid, expired certificate) is shown and stored. | FC-M16-008 |
| AC-DOC-003-03-01 | US-DOC-003-03 | **Given** a watermark rule (for example "DRAFT" while a document is in review, "COPY" when staff download a final document again), **when** a document matching the rule is rendered or downloaded, **then** the watermark is applied by DOC-001 at render or download; the stored original is unchanged. | D; FC-M16-010 |

**Business rules applied:** BR-DOC-020 (§8.1).


### 7.4 PRD-DOC-004 Document review and compliance export

| Item | Value |
|---|---|
| Description (baseline) | Documents go through review and approval, and sets of documents can be exported together for compliance checks. |
| Why it matters | Controlled documents and easy audits. |
| Who benefits | Compliance staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-DOC-004-01 | As a compliance staff member, I want draft documents to go through review and approval before they are final, so that controlled documents are correct. | D; FC-M16-011 | Ready |
| US-DOC-004-02 | As an auditor, I want to export a set of documents together for a compliance check, so that audits and legal requests are served quickly. | D; FC-M16-012 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-DOC-004-01-01 | US-DOC-004-01 | **Given** a document type requires review, **when** a draft is created, **then** it is submitted as an ADM-006 approval item (IC-ADM-03 Submit, object type Document) to the review chain; reviewers add comments; the DOC review service implements the IC-ADM-03 OnApproved and OnRejected callbacks; it becomes Final only when the last reviewer approves, and the Final version is locked (SM-DOC-01). | D; FC-M16-011 |
| AC-DOC-004-01-02 | US-DOC-004-01 | **Given** a reviewer rejects, **when** they give a reason, **then** the document returns to Draft with the reason shown to the author; every reviewer action is audited (AUD-DOC-002). | FC-M16-011 |
| AC-DOC-004-02-01 | US-DOC-004-02 | **Given** a user with Documents.Core.Export.Create selects documents by filter (type, owner, entity, date range), **when** they run the export, **then** a background job produces a ZIP with the current versions, a manifest (metadata per file), the SHA-256 hash of each file and the access and change log of each document (chain of custody); the package hash is recorded and the export is audited (AUD-DOC-004). | D; FC-M16-012 |
| AC-DOC-004-02-02 | US-DOC-004-02 | **Given** an export package is ready, **when** its download period ends (setting, default not stated), **then** the package is deleted and the export shows Expired. | Proposed |

**Business rules applied:** BR-DOC-030 (§8.1).


### 7.5 PRD-DOC-005 Document requirements and validation

| Item | Value |
|---|---|
| Description (baseline) | Defines which documents each process needs and checks uploaded files for the right format, reading text from scans where possible. It also checks digital signatures on uploaded files and compares details read from documents with the applicant's profile. |
| Why it matters | Incomplete or wrong documents are caught at once. |
| Who benefits | Applicants; client staff |
| Phase | P2 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-DOC-002 |
| Status | Ready; conditions: SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-DOC-005-01 | As a client administrator, I want to define which documents each process needs, so that applicants know what to provide. | D; FC-M02-032 | Ready; conditions: SINGLE-FILTER |
| US-DOC-005-02 | As an applicant (buyer, seller or citizen), I want my uploaded documents checked at once for format, readable details and signature, so that I can fix problems immediately. | D; FC-M02-033 | Ready; conditions: SINGLE-FILTER |
| US-DOC-005-03 | As a member of client staff, I want details read from documents compared with the applicant's profile, so that mismatches are caught. | D; FC-M02-033 | Ready; conditions: SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-DOC-005-01-01 | US-DOC-005-01 | **Given** a requirement set for a process (ADM-004 transaction type, SEL-002 seller onboarding, EGV-002 service application) lists document types as mandatory or optional with allowed formats, maximum size and whether a valid expiry date is needed, **when** an applicant submits without a mandatory document, **then** submission is refused with message Doc.DocumentMissing naming it; the allowed formats and maximum size of each requirement are held as an ADM-008 upload context that DOC registers (IC-ADM-08 RegisterUploadContext), not as a DOC check. | D; FC-M02-032 |
| AC-DOC-005-02-01 | US-DOC-005-02 | **Given** a document is uploaded for a requirement, **when** it is received, **then** the DOC upload endpoint calls IC-ADM-08 CheckUpload with the requirement's context, so file type, size and scanning are decided by ADM-008 (Adm.UploadTypeNotAllowed, Adm.UploadTooLarge) and DOC keeps no type or size check of its own; a document that needs an expiry date is refused when expired (message Doc.DocumentExpired). | D; FC-M02-033; SINGLE-FILTER |
| AC-DOC-005-03-01 | US-DOC-005-03 | **Given** OCR is configured (AI-005, IC-DOC-06), **when** a scanned document is uploaded, **then** the service extracts the fields of that document type; each field is compared with the profile and marked Match, Mismatch or Unreadable; any Mismatch or Unreadable sends the document to manual review (ADM-006) instead of rejecting it; the extracted fields and any identity-document check result (AI-005) are shown to the reviewer as suggestions and the reviewer decides (BR-DOC-040). | D; FC-M02-033 |
| AC-DOC-005-02-02 | US-DOC-005-02 | **Given** the document carries a digital signature, **when** it is validated through the signing service (IC-DOC-04), **then** the signature result is stored with the document and an invalid signature sends it to manual review. | D; FC-M02-033 |
| AC-DOC-005-01-02 | US-DOC-005-01 | **Given** a vault document of the applicant (DOC-002) matches a required type and is valid, **when** the applicant attaches it, **then** it satisfies the requirement without a new upload. | FC-M02-032; Proposed |
| AC-DOC-005-03-02 | US-DOC-005-03 | **Given** no IC-DOC-06 provider is registered (AI pack not installed) or the provider answers service unavailable, **when** a document is uploaded for a requirement, **then** the document passes the requirement checks of stories 01 and 02 and is placed in manual review (ADM-006) with no extracted fields; the reviewer records Accepted or Rejected with a reason; no step of DOC-005 waits for or fails because of AI-005 (BR-DOC-040). | Proposed; D-01 |

**Business rules applied:** BR-DOC-040; BR-DOC-060 (§8.1).


### 7.6 PRD-DOC-006 Export document set

| Item | Value |
|---|---|
| Description (baseline) | Produces the documents needed to export goods: commercial invoice, packing list, certificate of origin and phytosanitary (plant health) certificate reference. |
| Why it matters | Exports clear customs without paperwork delays. |
| Who benefits | Export staff; international buyers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-DOC-001 |
| Status | On hold: DOC-LIB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-DOC-006-01 | As a member of export staff, I want the commercial invoice, packing list, certificate of origin and phytosanitary certificate reference for an export order, so that exports clear customs without paperwork delays. | D; Inference from REQ-KTDA-CUS-002 (international buyers, by inference); REQ-KTDA-LEG-001 | On hold: DOC-LIB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-DOC-006-01-01 | US-DOC-006-01 | **Given** an export order with cross-border fields (CAT-015: origin, HS code) and Incoterms (ORD-026), **when** export staff generate the commercial invoice, **then** it is produced from the commercial-invoice template (DOC-001) with seller and buyer, Incoterm code and named place (ORD token provider IC-ORD-07, ORD-026 data), currency, lines with HS code, country of origin and duty note (CAT-015 token provider registered through IC-DOC-02), quantity and value, and is stored in DOC-002. | D; REQ-KTDA-LEG-001 (trade-regulation documents); Inference from REQ-KTDA-CUS-002 (international buyers) |
| AC-DOC-006-01-02 | US-DOC-006-01 | **Given** a shipment exists for the export order, **when** export staff generate the packing list, **then** it is produced from the shipment (Shipment, ShipmentItem) with packages, quantities, net and gross weights and dimensions where recorded. | D; FIT (Shipment.TotalWeight, ShipmentItem) |
| AC-DOC-006-01-03 | US-DOC-006-01 | **Given** the certificate of origin is required for the order, **when** export staff produce it, **then** a certificate-of-origin document is generated from the client template, or, where an authority issues it, its number, issuing body and date are recorded and the scanned certificate is attached (DOC-002). | D |
| AC-DOC-006-01-04 | US-DOC-006-01 | **Given** a phytosanitary certificate has been issued by the competent authority, **when** export staff record it, **then** its reference number, issuing authority and issue date are recorded on the export set and the scan attached; the product does not issue the certificate. | D |
| AC-DOC-006-01-05 | US-DOC-006-01 | **Given** an export set is incomplete, **when** export staff open the order, **then** the set shows which of the four documents are missing (message Doc.ExportSetIncomplete). | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-DOC-001 | DOC-001 is the only product plugin that overrides IPdfService (DI, INopStartup Order >= 3000; decision OVR-REG; ADM extension register BR-ADM-003). ORD-009 supplies the Invoice and ConsolidatedReceipt document types, their template content and an ORD token provider (IC-ORD-07) through IC-DOC-02; PAY-025 supplies fiscal number and QR through a token provider (IC-DOC-02); other modules add document fields through token providers or native EntityTokensAddedEvent consumers that only add tokens. No other module registers an IPdfService implementation. When no active template exists, the native rendering is used. The override derives from the native PdfService so that the native rendering stays available; in nopCommerce 5.00 PdfService.ResolvePdfFont was replaced by the protected GetFontInfo(pdfSettings, isRtl), which the override uses for the fallback fonts (the IPdfService interface itself is unchanged). | DOC-001 | FIT (L1 section 6.2 principle 7; 5.00.1: Libraries/Nop.Services/Common/IPdfService.cs; Libraries/Nop.Services/Common/PdfService.cs:239; EntityTokensAddedEvent); OVR-REG; Proposed |
| BR-DOC-003 | AI-generated drafts (AI-004, AI-009) are Draft documents; they become Final, and can be issued or sent, only after a named person approves them; DOC-001 is the only issuing path. | DOC-001 | Proposed; BR-AI-002 (AI module) |
| BR-DOC-002 | Every template token must exist in a registered token provider; required tokens without a value stop generation; generated documents are stored in DOC-002. | DOC-001 | FC-M02-035; Proposed |
| BR-DOC-010 | A document under legal hold (document, entity or type scope) cannot be deleted by any user or by retention; retention disposal of documents is executed by PLT-020 using the document type's retention class. | DOC-002 | D; Proposed |
| BR-DOC-011 | Document binaries are kept as native Download records; DocumentRecord and DocumentVersion hold the metadata; a customer or vendor can open only own documents. Because the native Nop.Web DownloadController.GetFileUpload and Admin DownloadController.DownloadFile serve any Download by GUID, DOC is a download-access rule provider (IC-SEC-05) to the single SEC-002 ownership filter: it claims the Downloads of DocumentVersion rows and allows them only to the document's customer or vendor and to staff holding Documents.Core.Documents.View; DOC adds no filter of its own on those actions. | DOC-002 | FIT (Download; DownloadController.GetFileUpload and Admin DownloadController.DownloadFile have no ownership check); SINGLE-FILTER; Proposed (allowed users) |
| BR-DOC-060 | DOC uploads (vault documents, requirement documents, staff uploads to the repository) are checked by ADM-008 under contexts that DOC registers through IC-ADM-08 (document vault, one context per document requirement, repository upload); DOC endpoints call IC-ADM-08 CheckUpload before storing and keep no file-type or size check of their own. DOC messages are sent through TRK-005: DOC registers its event codes through IC-TRK-04 RegisterEventCode at installation (names Proposed): Documents.Ready, Documents.ReviewRequested, Documents.ReviewDecided, Documents.IntegrityMismatch, Documents.RequirementAlert, Documents.VaultExpiring. | DOC-001, DOC-002, DOC-003, DOC-004, DOC-005, DOC-006 | SINGLE-FILTER; MSG-ROUTE; Proposed (context and code names) |
| BR-DOC-020 | Each document version has a SHA-256 hash recorded at creation; verification compares the recomputed hash; watermarks are applied at render or download and never change the stored original. | DOC-003 | FC-M16-009; FC-M16-010; Proposed (algorithm) |
| BR-DOC-030 | A document type that requires review becomes Final only after the last reviewer approves; a Final version cannot be edited, only superseded by a new version. | DOC-004 | FC-M16-011 |
| BR-DOC-040 | Automatic checks never reject a document for an OCR mismatch or an unreadable field; such documents go to manual review. OCR fields and identity-document checks (AI-005) are suggestions: a staff member decides the outcome (BR-AI-002). | DOC-005 | Proposed; BR-AI-002 (AI module) |
| BR-DOC-050 | DOC settings are listed in the DOC key catalogue (key, type, layer, secret flag, default); signing-service and OCR-service credentials are flagged secret, so packs refuse them and exports omit them (BR-PLT-013). DOC pages, widgets, scheduled tasks and the IPdfService override check the feature state for the store through IC-PLT-02 before acting; with DOC-001 off the native rendering is used. DOC registers each document type with the PLT-020 retention engine (IC-PLT-08) with the legal-hold check as its hold check. | DOC-001, DOC-002, DOC-003, DOC-005 | Proposed (: BR-PLT-013, AC-PLT-003-01-04, AC-PLT-022-02-01) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-DOC-01 | DocumentRecord | (none) | generated or uploaded | review not required | Final | version 1 stored |
| SM-DOC-01 | DocumentRecord | (none) | generated or uploaded | review required | Draft | — |
| SM-DOC-01 | DocumentRecord | Draft | submitted for review | — | InReview | ADM-006 approval item |
| SM-DOC-01 | DocumentRecord | InReview | last reviewer approves | — | Final | version locked |
| SM-DOC-01 | DocumentRecord | InReview | reviewer rejects with reason | — | Draft | author notified |
| SM-DOC-01 | DocumentRecord | Final | new version saved | — | Final | previous version kept as superseded |
| SM-DOC-01 | DocumentRecord | Final | retention disposal or deletion | no legal hold (BR-DOC-010) | Disposed | binary removed; metadata per PLT-020 action |
| SM-DOC-02 | LegalHold | (none) | hold placed with reason | Documents.Core.LegalHold.CreateEditDelete | Active | covered documents blocked from deletion |
| SM-DOC-02 | LegalHold | Active | hold released | Documents.Core.LegalHold.CreateEditDelete | Released | normal retention resumes |
| SM-DOC-03 | ComplianceExport | (none) | export requested | Documents.Core.Export.Create | Running | background job |
| SM-DOC-03 | ComplianceExport | Running | package built / error | — | Ready / Failed | package hash recorded / error logged |
| SM-DOC-03 | ComplianceExport | Ready | download period ends | — | Expired | package deleted |
| SM-DOC-04 | DocumentValidation | (none) | document uploaded for a requirement | ADM-008 checks passed | Validating | OCR and signature checks |
| SM-DOC-04 | DocumentValidation | Validating | all checks pass | — | Passed | requirement satisfied |
| SM-DOC-04 | DocumentValidation | Validating | mismatch, unreadable or invalid signature | — | NeedsReview | ADM-006 item |
| SM-DOC-04 | DocumentValidation | Validating | format, size or expiry fails | — | Failed | Doc.DocumentExpired or ADM-008 message |
| SM-DOC-04 | DocumentValidation | NeedsReview | reviewer accepts / rejects | — | Passed / Failed | applicant notified |
| SM-DOC-05 | DocumentTemplate | Draft | activate | tokens valid (BR-DOC-002) | Active | previous active version Retired |
| SM-DOC-05 | DocumentTemplate | Active | retire | — | Retired | native rendering used if no other active template |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| DocumentTemplate (new) | Id, Code, DocumentType, LanguageId, StoreId, Version, Status (SM-DOC-05), Body, Styles, RequiredTokens, OutputFormats, LogoPictureId, SealPictureId, SignatoryDesignation, QrEnabled, SignEnabled, ReviewRequired | DOC-001, DOC-003, DOC-004 | Native PdfSettings remain the defaults (logo, fonts, footers) |
| DocumentRecord (new) | Id, DocumentType, Number, EntityName, EntityId, CustomerId, VendorId, LanguageId, RetentionClass, Status (SM-DOC-01), CurrentVersionNo, ExpiryDate, IsVault | DOC-002, DOC-005 | Owner checks use native Customer and Vendor |
| DocumentVersion (new) | DocumentId, VersionNo, DownloadId, Format, Sha256, ExtractedText, SignatureInfo, SignatureValid, CreatedBy, CreatedOnUtc | DOC-002, DOC-003 | Binary in native Download (DownloadBinary or DownloadUrl) |
| LegalHold (new) | Id, Scope (Document / Entity / Type), ScopeRef, Reason, Status (SM-DOC-02), PlacedBy, PlacedOnUtc, ReleasedBy, ReleasedOnUtc | DOC-002 | Read by PLT-020 retention |
| ComplianceExport (new) | Id, Filter, Status (SM-DOC-03), DownloadId, PackageSha256, RequestedBy, RequestedOnUtc, ExpiresOnUtc | DOC-004 | — |
| DocumentRequirement / DocumentValidation (new) | Requirement: ProcessType, ProcessCode, DocumentType, Mandatory, UploadContextCode (ADM-008 context holding formats and maximum size), ExpiryRequired; Validation: DocumentVersionId, RequirementId, Status (SM-DOC-04), FieldResults, SignatureResult | DOC-005 | Upload checks by ADM-008 (IC-ADM-08) |
| ExportDocumentSet (new) | OrderId, CommercialInvoiceDocId, PackingListDocId, CertificateOfOrigin (DocId or Number, Issuer, IssueDate), Phytosanitary (Number, Authority, IssueDate, DocId) | DOC-006 | Fields from the CAT-015 token provider and the ORD token provider IC-ORD-07 (Incoterm, ORD-026) |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Document templates per type, language, store | DocumentTemplate (new; pack content) | vertical → client → store | Invoice; export set (DOC-006); content not stated (KG-23) | Not stated |
| Native PDF defaults | pdfsettings.logopictureid, .ltrfontname, .rtlfontname, .invoicefootertextcolumn1, .invoicefootertextcolumn2, .letterpagesizeenabled (native) | client → store | Not stated | Not stated |
| Invoice language and e-mail attachments | ordersettings.generatepdfinvoiceincustomerlanguage, .attachpdfinvoicetoorderplacedemail, .attachpdfinvoicetoorderpaidemail, .attachpdfinvoicetoorderprocessingemail, .attachpdfinvoicetoordercompletedemail (native) | client | Not stated | Not stated |
| Retention class per document type | DocumentTemplate / document type registration as PLT-020 record type | country → client | Not stated | Not stated |
| Watermark rules; QR and signing per type | DocumentTemplate (new) | client | Not stated | Not stated |
| Integrity check schedule | DOC settings (new) | client | Not stated | Not stated |
| Compliance export download period | DOC settings (new) | client | Not stated | Not stated |
| Document requirements per process | DocumentRequirement (new; pack content); formats and sizes in the ADM-008 upload context of each requirement | vertical → client | Not stated | Not stated |
| Signing and OCR service credentials | Adapter settings, encrypted (secret, never in packs) | client instance only | Entered at deployment | Entered at deployment |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Admin — Content | Document templates (editor, preview with sample record, versions) | DOC-001 | New |
| Admin — Orders | Invoice and packing-slip PDF buttons | DOC-001 | Native buttons, DOC rendering |
| Admin | Document repository: search, versions, legal holds, integrity checks | DOC-002, DOC-003 | New |
| Admin | Document review queue (ADM-006) and compliance exports | DOC-004 | New |
| Admin — Configuration | Document requirements per process; validation review | DOC-005 | New |
| Admin — Orders | Export document set for an order | DOC-006 | New |
| Storefront — My account | My documents (invoices, vault uploads with expiry) | DOC-001, DOC-002 | New tab; native invoice link kept |
| Seller portal | Own documents and vault | DOC-002 | New |
| Public | Document verification page (from QR) | DOC-003 | New |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Doc.TemplateTokenUnknown | The template uses an unknown field: {0}. | AC-DOC-001-01-01 |
| Doc.GenerationDataMissing | The document cannot be created because {0} has no value. | AC-DOC-001-01-02 |
| Doc.LegalHoldActive | This document is under legal hold and cannot be deleted. | AC-DOC-002-04-01 |
| Doc.DocumentMissing | Upload the required document: {0}. | AC-DOC-005-01-01 |
| Doc.DocumentExpired | This document has expired. Upload a valid one. | AC-DOC-005-02-01 |
| Doc.ExportSetIncomplete | The export document set is missing: {0}. | AC-DOC-006-01-05 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Signing service (DOC-003) | Sign, verify signature (IC-DOC-04) | Not named in source (PKI / HSM) | External |
| OCR service (DOC-005) | Extract fields (IC-DOC-06) | AI-005 service (not named) | External |
| Rendering library (DOC-001) | HTML to PDF, DOCX, PNG, QR | Not chosen (decision DOC-LIB) | Library; licence to confirm |
| Upload policy (DOC-002, DOC-005) | RegisterUploadContext, CheckUpload (IC-ADM-08) | ADM-008 (internal) | Internal |
| Download ownership (DOC-002) | Download-access rule provider (IC-SEC-05) | SEC-002 (internal) | Internal |
| Notifications (all DOC features) | RegisterEventCode, SendEvent (IC-TRK-04) | TRK-005 (internal) | Internal |
| Export authorities (DOC-006) | Certificate of origin, phytosanitary certificate (references recorded) | Not named (KG-23) | Manual reference entry |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-DOC-01 | Generate | Template code (or document type), source entity reference, language, store, format | DocumentRecord and version ID | Template missing; required data missing; render error | DOC service; IPdfService override calls it for invoices and packing slips |
| IC-DOC-02 | Register token provider | Provider name, entity type, token list, value callback | — | Duplicate token name | Module providers: PAY-025 fiscal fields; CAT-042 order-total adjustments, including the PAY-009 wallet deduction under WAL-01 option (b) (%Order.TotalAdjustments%, IC-CAT-06); ORD IC-ORD-07 invoice, receipt, proforma, contract, letter and Incoterm fields (ORD-026); CAT-015 HS code, country of origin and duty note; native IMessageTokenProvider groups are available by default (5.00: return-request tokens now also take the order) |
| IC-DOC-03 | Store | Bytes or Download ID, metadata (type, owner, entity, language, retention class), ADM-008 upload context code of the caller (for example SEL seller document; DOC contexts by default) | DocumentRecord and version ID | Upload policy refusal (ADM-008 message returned) | Native Download plus DOC tables; new bytes are checked through IC-ADM-08 CheckUpload with the given context before they are stored (BR-DOC-060) |
| IC-DOC-04 | Sign / VerifySignature | Document version | Signed file and signature details / validity result | Service unavailable; certificate expired | External signing service adapter (not named) |
| IC-DOC-05 | VerifyHash | Document version ID | Match / Mismatch | Unknown version | DOC service; verification page |
| IC-DOC-06 | Extract fields | File, document type | Field values with confidence | Unreadable; service unavailable | Optional provider: AI-005 OCR service adapter (external, AI pack); results are suggestions (BR-DOC-040); with no provider DOC sends each document to manual review |

C# signatures are produced at the start of the build and approved by the tech lead. The rendering library and the external signing and OCR services are not chosen in source.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Invoice e-mail attachment | OrderProcessingService calls IPdfService.SaveOrderPdfToDiskAsync when OrderSettings.AttachPdfInvoiceTo...Email is on | DOC override renders the template |
| Tokens for documents | EntityTokensAddedEvent (native) and IC-DOC-02 providers | Modules add fields; consumers only add tokens |
| Documents.Generated / Finalised / Superseded | None (DOC events) | Workflow document step (ADM-002), TRK notifications |
| Documents.IntegrityMismatch | None | ADM-009 exception; alert to compliance staff |
| Retention disposal | PLT-020 retention task | DOC-002 disposes binaries of eligible documents |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two regenerations of the same document at once | DOC-001, DOC-002 | Version numbering runs under ILocker key 'doc-document-{documentId}'; the second gets the next version number |
| Legal hold placed while retention disposal runs | DOC-002 | The disposal re-reads holds inside its delete transaction per batch; a document held before commit is skipped |
| Reviewer approves while the author edits | DOC-004 | An InReview document cannot be edited; the author must withdraw it first |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Document ready (invoice, export set) | Customer / export staff | E-mail with link or attachment through TRK-005 (Documents.Ready; templates TRK-004) | DOC-001, DOC-006 |
| Draft submitted / approved / rejected | Reviewers / author | Admin notification through TRK-005 (Documents.ReviewRequested, Documents.ReviewDecided) | DOC-004 |
| Integrity mismatch | Compliance staff | Admin notification + e-mail through TRK-005 (Documents.IntegrityMismatch) | DOC-003 |
| Required document missing, expired or needs review | Applicant / reviewer | E-mail / admin notification through TRK-005 (Documents.RequirementAlert) | DOC-005 |
| Vault document expiring | Document owner | E-mail through TRK-005 (Documents.VaultExpiring) | DOC-002 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Document register by type, owner and period | DOC-002 | D |
| Legal holds in force | DOC-002 | D |
| Integrity check results | DOC-003 | FC-M16-009 |
| Compliance export log | DOC-004 | FC-M16-012 |
| Document validation outcomes | DOC-005 | FC-M02-033 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-DOC-001 | Document version stored (with hash), signed, verified | System / staff | DocumentVersion | hash, signer, result |
| AUD-DOC-002 | Document submitted, reviewed, finalised, rejected | Author / reviewer | DocumentRecord | step, decision, reason |
| AUD-DOC-003 | Legal hold placed or released; deletion refused | Compliance staff / system | LegalHold, DocumentRecord | scope, reason |
| AUD-DOC-004 | Compliance export run and downloaded | Compliance staff / auditor | ComplianceExport | filter, count, package hash |
| AUD-DOC-005 | Template activated or retired | Template designer | DocumentTemplate | version, old and new content hash |
| AUD-DOC-006 | Document downloaded or viewed by staff (chain of custody) | Staff | DocumentRecord | user, time, version |

Business audit events AUD-DOC-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id; old and new values of DOC tables are captured by the SEC-004 IRepository<> decorator and need no call, so DOC writes only through IRepository<> (no direct INopDataProvider writes). The native activity log is not an audit substitute. AUD-DOC-006 entries feed the chain-of-custody log of compliance exports. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-DOC-001 | Every stored document version is hashed and verifiable. | FC-M16-009 | AC-DOC-003-01-01, AC-DOC-003-01-02 |
| NFR-DOC-002 | No held document can be deleted by any path. | D (legal hold) | AC-DOC-002-04-01; T-DOC-03 |
| NFR-DOC-003 | Customers and vendors reach only their own documents. | D; NFR-X-001 | T-DOC-04 |
| NFR-DOC-004 | Generated documents use language resources and support right-to-left languages (NFR-X-004). | FC-M16-003 | AC-DOC-001-03-01 |
| NFR-DOC-005 | Generation time and storage volume targets: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-DOC-001 | P1 | — | PRD-ORD-009, PRD-ORD-016, PRD-ORD-020, PRD-ORD-025, PRD-DOC-006 |
| PRD-DOC-002 | P1 | — | PRD-SEL-002, PRD-DOC-005 |
| PRD-DOC-003 | P2 | — | |
| PRD-DOC-004 | P2 | — | |
| PRD-DOC-005 | P2 | PRD-DOC-002 | |
| PRD-DOC-006 | P1 | PRD-DOC-001 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-DOC-01 | Invoice rendering: admin print, bulk print, storefront download and e-mail attachment all use the active template; vendor print shows only vendor lines; without a template the native PDF is produced. |
| T-DOC-02 | Languages: generate in an LTR and an RTL language; assert the right font and direction. |
| T-DOC-03 | Legal hold: attempt deletion through admin, retention task and API on held documents; assert all refused. |
| T-DOC-04 | Ownership: a customer and a vendor try to open another owner's document by direct link, by Nop.Web DownloadController.GetFileUpload and by Admin DownloadController.DownloadFile with the document's download GUID; assert denied (DOC rule provider of the SEC-002 filter). |
| T-DOC-05 | Integrity: alter a stored binary; assert the integrity check reports Mismatch and raises an exception. |
| T-DOC-06 | State models: every transition in section 8.2 is tested; every transition not listed is rejected. |
| T-DOC-07 | Permissions: each permission in section 4 has an allow and a deny case (section 4.1). |
