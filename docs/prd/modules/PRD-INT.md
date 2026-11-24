# L2 Module PRD — INT: Integrations and APIs

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | INT — Integrations and APIs |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Connects the shop to other systems: a documented and versioned public API that partner systems and apps call, an API gateway in front of it, outbound event notifications (webhooks), retries and dead-letter handling for every message the product sends, connector frameworks for ERP and finance systems, banks and government systems, the client adapters Malawi Post names (SAGE 200, PostGlobal, MANEPS), master-data synchronisation, plugin extensibility and, as a P3 option, procurement punch-out. A new external system is added by building one adapter on the matching framework, not by changing the shop.

**In scope**

- Public REST API on the licensed Web API plugin, with scopes, rate limits, versioning, OAuth 2.0 / OpenID Connect partner sign-in and optional GraphQL (INT-001; held by API-01, PAID-STUB; authorization server: decision API-GW)
- API gateway product in front of the API: console, allowed clients, rate limits, developer portal, registry, transformation, sandbox (INT-002, external system; product, hosting and licence: decision API-GW)
- Outbound webhooks with subscription registry, signed delivery, retries and delivery log (INT-003)
- Integration health monitoring, retry policy and dead-letter handling (INT-004)
- ERP and finance connector framework and connector kit (INT-005; held by PAID-STUB); SAGE 200 adapter (INT-006); banking adapters (INT-008)
- PostGlobal adapter for orders, shipments and tracking (INT-007)
- Government system connector framework (INT-009) and MANEPS adapter (INT-013)
- Master-data synchronisation of outlets, service catalogues and tariffs (INT-010)
- Plugin extensibility (INT-011, native) and punch-out (INT-012, P3)

**Not in this module**

| Item | Where it is |
|---|---|
| Payment provider adapters and the payment connector contract (IC-PAY-01) | PAY module (PRD-PAY-024); INT-008 bank adapters implement IC-PAY-01 |
| Carrier adapters and the carrier connector framework | LOG module (PRD-LOG-021, LOG-006 and the other carrier adapters) |
| Tracking status dictionary and tracking event hub | TRK module (PRD-TRK-002); INT-007 maps PostGlobal codes to it |
| Buyer tracking page and order dashboard | TRK module (PRD-TRK-001); CRM-003 agent view |
| Multi-channel notifications to people (email, SMS, WhatsApp) | TRK module (PRD-TRK-005) and CHN module |
| Report content and report delivery | RPT module (PRD-RPT-004); INT-001 exposes authorised exports |
| Stock synchronisation with WMS / ERP | INV module (PRD-INV-012), built on the INT-005 framework |
| Catalogue API scope | CAT module (PRD-CAT-011); same Web API base (API-01) |
| Idempotency keys for state-changing requests | PLT module (PRD-PLT-027); applied to the API |
| Platform audit trail | SEC module (PRD-SEC-004) |
| Identity and registry verification adapters | IAM module (PRD-IAM-020) |
| Statutory e-invoicing adapters | PAY module (PRD-PAY-025 to PAY-027) |
| Native mobile apps | CHN module (PRD-CHN-001); they consume INT-001 |
| API gateway product itself (hosting, licence) | External system; selection is decision API-GW (§17.1) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-INT-001 | Public REST API | Platform / back-office | P1 | Code-level | Custom plugin (on licensed Web API plugin) | Core (always on) | | API-01, PAID-STUB, API-GW |
| PRD-INT-002 | Integration layer (API gateway) | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | API-GW |
| PRD-INT-003 | Webhooks and events | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-INT-004 | Integration health and retries | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-INT-005 | ERP and finance connector framework | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | PAID-STUB |
| PRD-INT-006 | SAGE 200 adapter | Platform / back-office | P1 | Code-level | Custom plugin | Client: MPC | | |
| PRD-INT-007 | PostGlobal adapter | Platform / back-office | P1 | Code-level | Custom plugin | Client: MPC | | |
| PRD-INT-008 | Banking integrations | Platform / back-office | P1 | Code-level | Custom plugin | Commerce extensions pack | | |
| PRD-INT-009 | Government system connector framework | Platform / back-office | P1 | Code-level | Custom plugin | e-Government pack | | |
| PRD-INT-010 | Master data synchronisation | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-INT-011 | Plugin extensibility | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-INT-012 | Punch-out | B2B | P3 | Configuration | None (configure bundled plugin); Custom plugin only for OCI / cXML OrderRequest | B2B trade pack | | |
| PRD-INT-013 | MANEPS adapter | G2C / G2B | P1 | Code-level | Custom plugin | Client: MPC | PRD-INT-009 | MG-09 |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Partner system (ERP, bank, shipping system, MPC or government system) | Calls the API, receives webhooks, exchanges data through adapters | API client (new entity), authenticated per INT-001 |
| Partner developer | Reads the developer portal, tests in the sandbox, requests credentials | External user of the gateway portal (INT-002) |
| Client administrator | Registers API clients, webhook subscriptions and connector adapters; sets master-of-record per entity; installs plugins | Administrators (native) |
| Seller | Subscribes to webhooks for the own orders | Vendors (native) + IAM-007 |
| Finance staff | Monitors ERP and SAGE 200 postings and resolves reconciliation exceptions | Role system name "Finance" (product role catalogue BR-IAM-050) |
| Approver of government submissions | Approves or declines a submission to a regulator or government system before it is sent | Administrators (a second person; Proposed) |
| Malawi Post operations | Hands orders and shipments to PostGlobal and follows its tracking events | Role not stated (MG-08) |
| Business buyer (punch-out) | Shops from inside an own procurement system | Registered + B2B role (IAM-022) |
| Platform team | Builds and certifies adapters with the connector kit | Not a runtime role |
| API gateway (system) | Authenticates, throttles, transforms and routes API traffic | External system (INT-002) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Configuration.ManagePlugins (native) | Configuration | Install, uninstall and configure plugins, including every INT adapter plugin; set plugin store and role limits (INT-011) | Administrators |
| System.ManageScheduleTasks (native) | System | Change the interval of, or run, the sync, posting and delivery tasks | Administrators |
| Integrations.Core.ApiClients.View | Configuration | View API clients, scopes, store limits and versions in use | Administrators |
| Integrations.Core.ApiClients.CreateEditDelete | Configuration | Register, change or revoke an API client; assign scopes and store limits; rotate keys | Administrators |
| Integrations.Core.Webhooks.View | Configuration | View webhook subscriptions and their delivery history | Administrators; Vendors (own subscriptions only) |
| Integrations.Core.Webhooks.CreateEditDelete | Configuration | Create, change, pause, resume and delete webhook subscriptions | Administrators; Vendors (own subscriptions, own order events only) |
| Integrations.Core.Messages.View | System | View the integration message log, failures and the dead-letter list | Administrators, Finance |
| Integrations.Core.Messages.Replay | System | Replay or discard a dead-lettered message, always with a reason | Administrators |
| Integrations.Core.Connectors.CreateEditDelete | Configuration | Configure connector adapters (ERP, SAGE 200, PostGlobal, bank, government, MANEPS, master-data sync, punch-out), mappings and master-of-record per entity type | Administrators |
| Integrations.Core.Posting.View | Orders | View ERP and SAGE 200 posting batches and reconciliation exceptions | Administrators, Finance |
| Integrations.Core.Posting.CreateEditDelete | Orders | Re-post a failed batch; resolve a reconciliation exception with a note | Finance |
| Integrations.Core.GovSubmissions.Approve | Reports | Approve or decline a submission to a regulator or government system; cannot approve an own submission | Administrators |

Permissions are declared in an INT plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is taken from the native set; default roles are given by role system name; Finance is spelled exactly as in the IAM product role catalogue (BR-IAM-050), and IAM creates catalogue roles that are missing; INT relies on no native start-up role creation and proposes no new role. Native Configuration.ManagePlugins and System.ManageScheduleTasks are reused, not duplicated. API scopes (INT-001) are not admin permissions: they are granted per API client. Permissions of the licensed Web API plugin cannot be verified in source (stub only, API-01, V-01). All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-INT-PERM-01 | **Given** a user without Configuration.ManagePlugins (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-02 | **Given** a user without System.ManageScheduleTasks (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-03 | **Given** a user without Integrations.Core.ApiClients.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-04 | **Given** a user without Integrations.Core.ApiClients.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-05 | **Given** a user without Integrations.Core.Webhooks.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-06 | **Given** a user without Integrations.Core.Webhooks.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-07 | **Given** a user without Integrations.Core.Messages.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-08 | **Given** a user without Integrations.Core.Messages.Replay, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-09 | **Given** a user without Integrations.Core.Connectors.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-10 | **Given** a user without Integrations.Core.Posting.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-11 | **Given** a user without Integrations.Core.Posting.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-INT-PERM-12 | **Given** a user without Integrations.Core.GovSubmissions.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-INT-001 | No REST API in core. Bundled Misc.WebApi.Frontend is a stub in 5.00.1 (only plugin class, controller, event consumer and Views/Configure.cshtml linking to nopcommerce.com; plugin.json SupportedVersions 5.00) (Plugins/Nop.Plugin.Misc.WebApi.Frontend). | Licensed Web API plugin as base (which product — frontend or backend API — is decision API-01) + custom endpoints for custom modules (tracking, documents), rate limiting (or INT-002), versioning policy, optional GraphQL. Scope: OAuth 2.0 / OpenID Connect for partner sign-in (the licensed Web API plugin uses JWT; OAuth2/OIDC needs a gateway or custom build). | Custom plugin (on licensed Web API plugin) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INT-002 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No gateway component in src] | API gateway product (partner registry, rate limits, transformation, developer portal, sandbox) in front of nopCommerce APIs. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: API gateway is outside nopCommerce |
| PRD-INT-003 | Event publisher with domain events (OrderPlacedEvent, OrderPaidEvent, ShipmentSentEvent, EntityInserted/Updated) consumable by plugins via IConsumer<T>; no outbound webhook delivery in core (only Zettle/Brevo plugin-specific). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/OrderPlacedEvent.cs; src/Libraries/Nop.Services/Events (IConsumer); src/Plugins/Nop.Plugin.Misc.Zettle/Controllers/ZettleWebhookController.cs (plugin-specific)] | Webhook subscription registry, signed delivery, retries, delivery log. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INT-004 | QueuedEmail retries (SentTries) only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Messages/QueuedEmail.SentTries] | Integration monitoring, retry and dead-letter handling in the integration layer (INT-002). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INT-005 | No ERP framework. Bundled Misc.Dynamics365 is a stub in 5.00.1 (only plugin class, controller, event consumer and Views/Configure.cshtml linking to nopcommerce.com; plugin.json SupportedVersions 5.00) (Plugins/Nop.Plugin.Misc.Dynamics365). | Generic ERP/finance connector framework (posting, two-way master-data sync, connector kit, test tools). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INT-006 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No SAGE component in src] | SAGE 200 adapter on INT-005 (sales/payments posting, reconciliation). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |
| PRD-INT-007 | IShipmentTracker extension point only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs] | PostGlobal adapter (orders, shipments, tracking) and tracker implementation. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INT-008 | Payment plugin interface (IPaymentMethod) only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Payments/IPaymentMethod.cs] | Bank adapters for payments, statements, account validation. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INT-009 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No component in src] | Government system connector framework. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |
| PRD-INT-010 | Import/export (Excel/XML) for products, categories, manufacturers, customers; no scheduled sync of outlets/tariffs. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/ExportImport/ImportManager.cs; src/Libraries/Nop.Core/Domain/Shipping/Warehouse.cs] | Scheduled master-data sync for outlets (pickup points/warehouses), service catalogue and tariffs. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INT-011 | Plugin architecture: BasePlugin/IPlugin with plugin.json, plugin manager and admin PluginController, widget zones (IWidgetPlugin), IConsumer<T> event consumers, schedule tasks, DI registration (INopStartup). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Plugins/BasePlugin.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/PluginController.cs; src/Libraries/Nop.Services/Events; src/Libraries/Nop.Core/Domain/Cms/WidgetSettings.cs] | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-INT-012 | New bundled Misc.PunchOut 'PunchOut cXML Integration' (Plugins/Nop.Plugin.Misc.PunchOut; plugin.json SupportedVersions 5.00): cXML PunchOutSetupRequest endpoint POST /punchout/setup with sender identity + shared secret validation (Controllers/PunchOutController.cs:45; Services/PunchOutService.cs:121,332), session start GET /punchout/start (:69), cart returned to the procurement system as cXML PunchOutOrderMessage via GET /punchout/return (:88; PunchOutService.cs:509; Services/PunchOutXmlBuilder.cs:159), PunchOutIdentity, PunchOutSession, PunchOutLog entities with admin pages, settings TimeToExpire, UnitOfMeasureCode, RestrictedCustomerRoleIds, 'Submit for Approval' button. | OCI (SAP Open Catalog Interface) not found in 5.00.1 source; cXML OrderRequest (purchase order sent back from the procurement system) not found in 5.00.1 source. Build only if a client requires OCI or PO receipt. | None (configure bundled plugin); Custom plugin only for OCI / cXML OrderRequest | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |
| PRD-INT-013 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No component in src] | MANEPS adapter (external government e-procurement system). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |


## 7. Feature specifications


### 7.1 PRD-INT-001 Public REST API

| Item | Value |
|---|---|
| Description (baseline) | A secure, documented technical interface (API) that lets other systems and apps read and update products, customers, orders, shipments, payments and documents, with access keys, limits on how often it can be called, numbered versions with notice before old versions are retired, and an optional flexible query format (GraphQL). Partner systems sign in using the OAuth 2.0 / OpenID Connect standards. |
| Why it matters | Connects the shop to mobile apps and partner systems. |
| Who benefits | IT teams; partners |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (on licensed Web API plugin) |
| Depends on | — |
| Status | On hold: API-01, PAID-STUB, API-GW |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-001-01 | Technical enabler. As a partner system developer, I want to read and update products, customers, orders, shipments, payments and documents through a documented API, so that my system exchanges data with the shop without manual work. | D; REQ-KTDA-INT-001; REQ-KTDA-INT-002; REQ-KTDA-INT-003; REQ-MPC-INT-004 | On hold: API-01, PAID-STUB, API-GW |
| US-INT-001-02 | Technical enabler. As a partner system developer, I want my system to sign in with OAuth 2.0 and my users with OpenID Connect, so that access follows a recognised standard. | D; REQ-MPC-FR-338 | On hold: API-01, PAID-STUB, API-GW |
| US-INT-001-03 | As a client administrator, I want limits on how often each API client can call, so that one client cannot overload the shop. | D | On hold: API-01, PAID-STUB, API-GW |
| US-INT-001-04 | Technical enabler. As a partner system developer, I want numbered API versions, a change log and notice before an old version is retired, so that my integration keeps working while I migrate. | D; REQ-MPC-FR-347 | On hold: API-01, PAID-STUB, API-GW |
| US-INT-001-05 | Technical enabler. As a mobile app developer, I want to build Android and iOS apps on the same API, so that apps behave like the website. | REQ-MPC-MOB-002 | On hold: API-01, PAID-STUB, API-GW |
| US-INT-001-06 | As a government or Malawi Post system operator, I want to receive authorised report exports through the API or as batch files, so that reports are shared without manual handling. | REQ-MPC-FR-289 | On hold: API-01, PAID-STUB, API-GW |
| US-INT-001-07 | Technical enabler. As a partner system developer, I want an optional GraphQL endpoint, so that I fetch only the fields I need. | D; FC-M23-002 | On hold: API-01, PAID-STUB, API-GW |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-001-01-01 | US-INT-001-01 | **Given** an API client holds scope orders.read and is limited to store S, **when** it lists orders changed since a given time, **then** it receives, as JSON, only orders of store S changed since that time, in pages (page size a setting, default not stated). | D; FC-M23-001; Proposed (paging) |
| AC-INT-001-01-02 | US-INT-001-01 | **Given** an API client holds scope products.write, **when** it changes the price or the stock quantity of a product, **then** the price change is applied through IProductService, and so through the CAT-002 override that owns IProductService (OVR-REG); the stock change is posted through IC-INV-01 PostMovement (INV owns stock changes, BR-INV-001), which calls AdjustInventoryAsync for a single-warehouse product or UpdateProductWarehouseInventoryAsync with AddStockQuantityHistoryEntryAsync for a multi-warehouse product (BR-INV-034), so stock history is kept; nothing is written to a table directly; the change is audited by SEC-004 (BR-INT-001). | D; FIT (IProductService.AdjustInventoryAsync, UpdateProductWarehouseInventoryAsync, AddStockQuantityHistoryEntryAsync); OVR-REG |
| AC-INT-001-01-03 | US-INT-001-01 | **Given** the KTDA ERP adapter or the ERP itself is registered as an API client with scopes orders.read and products.write (ERP not named, KG-03), **when** it reads paid orders and writes product data, **then** both calls succeed through the same endpoints and rules as any other client. | REQ-KTDA-INT-001 |
| AC-INT-001-01-04 | US-INT-001-01 | **Given** a bank system is registered as an API client with scope payments.notify (bank not named, KG-04), **when** it posts a payment notification carrying a payment reference and an amount, **then** the notification is passed to PAY matching (PAY-005, BR-PAY-021); the API never marks an order paid itself; the response returns the matching result. | REQ-KTDA-INT-002 |
| AC-INT-001-01-05 | US-INT-001-01 | **Given** a shipping system is registered as an API client with scope shipments.write, **when** it posts a tracking event for a shipment, **then** the event is submitted to the tracking event hub through IC-TRK-01 (SubmitEvents); TRK-002 owns the code mapping; shipment status changes only through IOrderProcessingService.ShipAsync / DeliverAsync called by the hub. | REQ-KTDA-INT-003; FIT |
| AC-INT-001-01-06 | US-INT-001-01 | **Given** an API client holds scope documents.read, **when** it requests the documents of an order it may see, **then** it receives document metadata and download links; document content is owned by the DOC module. | D |
| AC-INT-001-01-07 | US-INT-001-01 | **Given** a new external system is registered with only the scopes it needs, **when** it calls an endpoint outside those scopes, **then** the API returns 403 and records the refusal (AUD-INT-007); calls inside its scopes succeed. | REQ-MPC-INT-004; BR-INT-002 |
| AC-INT-001-02-01 | US-INT-001-02 | **Given** an authorization server is configured for the API (gateway product or custom build: decision API-GW; Web API base: decision API-01), **when** a partner system requests a token with the OAuth 2.0 client-credentials grant, **then** it receives a token carrying only its granted scopes, and calls made with that token succeed within those scopes. | REQ-MPC-FR-338; FIT (: the licensed Web API plugin uses JWT; OAuth 2.0 / OIDC needs a gateway or custom build) |
| AC-INT-001-02-02 | US-INT-001-02 | **Given** a call carries no token, an expired token or a token with a bad signature, **when** it reaches the API, **then** the API returns 401 and no data is read or changed. | REQ-MPC-FR-338 |
| AC-INT-001-02-03 | US-INT-001-02 | **Given** a partner user signs in to a partner application through OpenID Connect, **when** the application calls the API with that user's token, **then** the user is mapped to one customer account (by the subject identifier stored on the account) and only that account's data is returned; an unmapped user gets 403. | REQ-MPC-FR-338; Proposed (mapping) |
| AC-INT-001-03-01 | US-INT-001-03 | **Given** a rate limit is set for an API client (value not stated), **when** the client exceeds it within the window, **then** further requests in that window get 429 and are not processed; other clients are not affected (BR-INT-004). | D; FC-M23-004 |
| AC-INT-001-03-02 | US-INT-001-03 | **Given** only the native global limiter is configured (CommonConfig.PermitLimit in appsettings), **when** any caller exceeds it, **then** requests are rejected with CommonConfig.RejectionStatusCode (default 503); this limiter is per user name or host, not per API client, so per-client limits are enforced at the gateway (INT-002) or in the INT plugin. | FIT (Nop.Web.Framework ServiceCollectionExtensions AddRateLimiter; CommonConfig) |
| AC-INT-001-04-01 | US-INT-001-04 | **Given** version v1 is live and v2 is released, **when** a client keeps calling v1, **then** v1 keeps answering for the deprecation window (setting, default not stated); every v1 response carries a deprecation notice with the retirement date (BR-INT-003). | REQ-MPC-FR-347; FC-M23-005 |
| AC-INT-001-04-02 | US-INT-001-04 | **Given** a change removes or renames a field, changes a type or changes the meaning of a value, **when** it is released, **then** it is released only in a new major version; the same version never changes incompatibly (BR-INT-003). | REQ-MPC-FR-347 |
| AC-INT-001-04-03 | US-INT-001-04 | **Given** a version is released or deprecated, **when** the developer opens the change log, **then** the change log lists every added, changed and deprecated item of that version with its date. | REQ-MPC-FR-347 |
| AC-INT-001-04-04 | US-INT-001-04 | **Given** the retirement date of v1 has passed, **when** a client calls v1, **then** the API returns 410 and no data is read or changed. | Proposed |
| AC-INT-001-05-01 | US-INT-001-05 | **Given** a mobile app client is registered with the customer-facing scopes, **when** a signed-in customer browses, fills a cart and places an order through the API, **then** prices, discounts, tax and the order created are the same as for the same customer on the web storefront, because the API uses the same native services; whether native apps are a deliverable is decision M-19. | REQ-MPC-MOB-002 |
| AC-INT-001-06-01 | US-INT-001-06 | **Given** a government or Malawi Post system is registered as an RPT-004 ExternalConsumer with its AuthorisedDatasets and is linked to an INT-001 API client, **when** that system requests a report dataset through the API, or the RPT-004 batch-file delivery runs (IC-RPT-04), **then** it receives only the datasets authorised in its ExternalConsumer record; a request for any other dataset gets 403 (AUD-INT-007); each delivery is logged by RPT (AUD-RPT-008), and batch files pass through the INT-004 message log with its retry. | REQ-MPC-FR-289 |
| AC-INT-001-07-01 | US-INT-001-07 | **Given** GraphQL is enabled (option), **when** a client queries an order with selected fields of its items, **then** only the requested fields are returned, under the same scopes, store limits and rate limits as the REST API. | D; FC-M23-002 |
| AC-INT-001-01-08 | US-INT-001-01 | **Given** the INT scope catalogue lists products.read, products.read.unpublished, products.write, orders.read, search.read, payments.notify, shipments.write, documents.read and webhooks.manage (BR-INT-006), **when** an administrator assigns scopes to an API client, **then** only catalogue scopes can be assigned; a client holding only products.read can list products through the catalogue API (IC-CAT-01) and gets 403 when it creates or changes a product. | Proposed (BR-INT-006; CAT-011 uses products.read) |

**Business rules applied:** BR-INT-001; BR-INT-002; BR-INT-003; BR-INT-004; BR-INT-006 (§8.1).


### 7.2 PRD-INT-002 Integration layer (API gateway)

| Item | Value |
|---|---|
| Description (baseline) | A central gateway that manages all connections with outside systems: which partner systems may connect and how often (rate limits), a register of connected systems and their versions, conversion between data formats (JSON, XML, CSV) with field mapping that staff can set up without code, a console, a developer portal and a test area for partners. |
| Why it matters | Integrations are secure, monitored and easy to add. |
| Who benefits | IT teams; partners |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | On hold: API-GW |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-002-01 | As a member of the client IT team, I want one gateway that exposes our APIs and consumes partner APIs, so that every connection is secured and controlled in one place. | D; REQ-MPC-FR-326; REQ-MPC-INT-004 | On hold: API-GW |
| US-INT-002-02 | As a client administrator, I want a console for API endpoints, credentials and the health of each connection, so that I manage integrations without code. | REQ-MPC-FR-314 | On hold: API-GW |
| US-INT-002-03 | As a client administrator, I want to set rate limits, throttling and the list of allowed client applications, and to detect abuse, so that partners use the API fairly and safely. | D; REQ-MPC-FR-321; REQ-MPC-FR-339 | On hold: API-GW |
| US-INT-002-04 | Technical enabler. As a partner developer, I want a developer portal with API documentation, so that I can build the integration myself. | D; REQ-MPC-FR-337 | On hold: API-GW |
| US-INT-002-05 | As a member of the client IT team, I want a registry of connected systems, interface versions and test and production endpoints, so that we know what is connected where. | D; REQ-MPC-FR-340 | On hold: API-GW |
| US-INT-002-06 | As a member of the client IT team, I want to convert between JSON, XML and CSV with field mapping I can set up without code, so that partners with different formats can connect. | D; REQ-MPC-FR-341; FC-M23-014 | On hold: API-GW |
| US-INT-002-07 | Technical enabler. As a partner developer, I want a test area (sandbox), so that I validate my integration before production. | D; REQ-MPC-FR-346 | On hold: API-GW |
| US-INT-002-08 | Technical enabler. As a partner developer, I want to authenticate with OAuth 2.0 or OpenID Connect at the gateway, so that access is standard and secure. | REQ-MPC-FR-338 | On hold: API-GW |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-002-01-01 | US-INT-002-01 | **Given** the gateway is deployed in front of the shop, **when** an external system calls a shop API, **then** the call reaches nopCommerce only through the gateway; a direct call to the API path from outside the gateway network is refused (network rule). | REQ-MPC-FR-326; Proposed (network rule) |
| AC-INT-002-01-02 | US-INT-002-01 | **Given** an INT adapter calls an external system and a gateway egress route is configured for that system, **when** the adapter sends a request, **then** the request passes through the gateway and appears in its traffic log. | REQ-MPC-FR-326 ("consume"); Proposed |
| AC-INT-002-01-03 | US-INT-002-01 | **Given** a new external system is to connect, **when** it is registered in the gateway and given an API client (INT-001), **then** it can call only the routes assigned to it. | REQ-MPC-INT-004 |
| AC-INT-002-02-01 | US-INT-002-02 | **Given** an administrator opens the integration console, **when** the console loads, **then** each endpoint is listed with its route, its credential status and its health status (up or down, last error time). | REQ-MPC-FR-314 |
| AC-INT-002-02-02 | US-INT-002-02 | **Given** an administrator saves a credential in the console, **when** the credential is shown again, **then** it is masked; it is held in the gateway secret store and never written to a configuration pack (CFG-01). | REQ-MPC-FR-314; CFG-01 |
| AC-INT-002-03-01 | US-INT-002-03 | **Given** a client application is not on the allowed list, **when** it calls an API, **then** the gateway rejects the call before it reaches nopCommerce. | REQ-MPC-FR-321 |
| AC-INT-002-03-02 | US-INT-002-03 | **Given** a per-client rate limit and a throttling rule are set (values not stated), **when** the client exceeds the limit, **then** the gateway rejects or delays further calls in that window as the rule states. | REQ-MPC-FR-321; REQ-MPC-FR-339 |
| AC-INT-002-03-03 | US-INT-002-03 | **Given** an abuse-detection rule is set (for example repeated authentication failures from one client; threshold not stated), **when** the rule fires, **then** the client is blocked for the configured period and an alert is sent to the configured recipients. | REQ-MPC-FR-339 |
| AC-INT-002-04-01 | US-INT-002-04 | **Given** the developer portal is published, **when** a partner developer opens it, **then** the reference for each published API version is shown, generated from that version's OpenAPI definition, and the developer can request credentials, which an administrator approves. | REQ-MPC-FR-337; Proposed (OpenAPI) |
| AC-INT-002-05-01 | US-INT-002-05 | **Given** a connected system is registered, **when** an administrator views the registry, **then** the entry shows system name, owner, interface version, test endpoint and production endpoint; a change of version or endpoint is kept as history. | REQ-MPC-FR-340 |
| AC-INT-002-06-01 | US-INT-002-06 | **Given** a CSV-to-JSON mapping is defined for a partner route, **when** the partner posts a CSV file, **then** the API receives the mapped JSON; a row that cannot be mapped is returned to the partner with the failing field. | REQ-MPC-FR-341 |
| AC-INT-002-06-02 | US-INT-002-06 | **Given** an XML mapping is defined for a partner route, **when** the partner posts XML, **then** the API receives the mapped JSON and the response is converted back to XML. | REQ-MPC-FR-341 |
| AC-INT-002-07-01 | US-INT-002-07 | **Given** the sandbox is set up with test data, **when** a partner calls the sandbox endpoint, **then** the call is answered by the test instance; no production data is read or changed. | REQ-MPC-FR-346 |
| AC-INT-002-08-01 | US-INT-002-08 | **Given** the gateway validates tokens issued under OAuth 2.0 or OpenID Connect (issuer: decision API-GW), **when** a call carries an invalid or expired token, **then** the gateway rejects it before it reaches nopCommerce. | REQ-MPC-FR-338 |

**Business rules applied:** BR-INT-002; BR-INT-004 (§8.1).


### 7.3 PRD-INT-003 Webhooks and events

| Item | Value |
|---|---|
| Description (baseline) | Sends automatic notifications to other systems when something happens, for example an order is placed. |
| Why it matters | Other systems react immediately without checking constantly. |
| Who benefits | IT teams |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-003-01 | As a member of the IT team of a connected system, I want to be notified automatically when an order or a shipment event happens, so that my system reacts at once without polling. | D; REQ-MPC-FR-166 | Ready |
| US-INT-003-02 | As a seller or partner, I want to subscribe through the API to order and shipment updates, so that I receive the events I need. | REQ-MPC-FR-217 | Ready |
| US-INT-003-03 | As a client administrator, I want publish-and-subscribe for key business events: order paid, shipment dispatched, service request submitted, so that other systems act on them. | REQ-MPC-FR-348 | Ready; on hold: AC-INT-003-03-03 (FG-06) |
| US-INT-003-04 | As a member of the IT team of a connected system, I want each notification to be signed, retried when my system is down, and never silently lost, so that I can trust it. | D; FC-M23-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-003-01-01 | US-INT-003-01 | **Given** a subscription to order.placed is Active, **when** an order is placed (native OrderPlacedEvent), **then** the INT consumer only writes an IntegrationMessage (BR-INT-010); the delivery task posts it to the subscriber URL and records the result. | REQ-MPC-FR-166; FIT (OrderProcessingService publishes OrderPlacedEvent) |
| AC-INT-003-01-02 | US-INT-003-01 | **Given** subscriptions to shipment.sent and shipment.delivered are Active, **when** IOrderProcessingService.ShipAsync or DeliverAsync runs (native ShipmentSentEvent, ShipmentDeliveredEvent), **then** one message per event is delivered to each subscriber. | REQ-MPC-FR-166; FIT |
| AC-INT-003-01-03 | US-INT-003-01 | **Given** a subscription to shipment.created is Active, **when** a shipment is created by any path (admin, API, adapter), **then** one message is delivered; it is raised from EntityInsertedEvent<Shipment>, because the native ShipmentCreatedEvent is published only by the admin AddShipment action. | REQ-MPC-FR-166; FIT (Admin OrderController publishes ShipmentCreatedEvent; ShipmentService.InsertShipmentAsync publishes the entity event) |
| AC-INT-003-01-04 | US-INT-003-01 | **Given** feature PRD-INT-003 is off for store S (setting productfeature.PRD-INT-003 read through IC-PLT-02, store value else shared value), **when** an order of store S is placed, **then** the INT consumer writes no IntegrationMessage for it and the delivery task sends nothing for store S (BR-INT-005). | Proposed (IC-PLT-02) |
| AC-INT-003-02-01 | US-INT-003-02 | **Given** an API client holds scope webhooks.manage, **when** it posts a subscription with an https URL and a list of event types, **then** the subscription is created as PendingVerification and becomes Active only after the URL answers the verification request (SM-INT-02). | REQ-MPC-FR-217; Proposed (verification) |
| AC-INT-003-02-02 | US-INT-003-02 | **Given** a seller has an Active subscription, **when** an order with items of that seller and of another seller changes, **then** the seller receives the event with only that seller's order lines; events of orders without that seller's items are not sent (BR-INT-011). | REQ-MPC-FR-217 |
| AC-INT-003-02-03 | US-INT-003-02 | **Given** a subscription URL is not https, **when** it is saved, **then** it is refused with message Int.WebhookUrlNotHttps (BR-INT-012). | Proposed |
| AC-INT-003-03-01 | US-INT-003-03 | **Given** a subscription to order.paid is Active, **when** an order is marked paid (native OrderPaidEvent), **then** one order.paid message is delivered. | REQ-MPC-FR-348; FIT |
| AC-INT-003-03-02 | US-INT-003-03 | **Given** a subscription to shipment.dispatched is Active, **when** a shipment is shipped (native ShipmentSentEvent), **then** one shipment.dispatched message is delivered. | REQ-MPC-FR-348; FIT |
| AC-INT-003-03-03 | US-INT-003-03 | **Given** EGV-002 raises the module event ServiceRequest.Submitted (application, service, agency, citizen, time) once when a ServiceApplication is created (AC-EGV-002-01-02), **when** that event is published, **then** the INT consumer writes one IntegrationMessage and one service_request.submitted message carrying those fields is delivered to each Active subscriber — held by FG-06 (EGV-002 is held). | REQ-MPC-FR-348 |
| AC-INT-003-04-01 | US-INT-003-04 | **Given** a message is delivered, **when** the subscriber receives it, **then** the request carries the message id, the event type, a timestamp and a signature computed over the body with the subscription secret; the subscriber can verify it (BR-INT-012). | D; FC-M23-003; Proposed (signature method) |
| AC-INT-003-04-02 | US-INT-003-04 | **Given** the subscriber answers with an error or does not answer within the timeout (setting, default not stated), **when** delivery is attempted, **then** the message is retried under the INT-004 policy with the same message id, so the subscriber can drop duplicates (BR-INT-013). | D; FC-M23-003 |
| AC-INT-003-04-03 | US-INT-003-04 | **Given** retries are exhausted, **when** the last attempt fails, **then** the message becomes DeadLettered (SM-INT-01), the subscription owner and administrators are notified, and the message can be replayed (INT-004). | D |
| AC-INT-003-04-04 | US-INT-003-04 | **Given** a message is built, **when** its payload is created, **then** it carries entity type, entity id, status, time and a link to the INT-001 resource; personal data beyond identifiers is not included (data minimisation, SEC-012). | Proposed |

**Business rules applied:** BR-INT-005; BR-INT-010; BR-INT-011; BR-INT-012; BR-INT-013 (§8.1).


### 7.4 PRD-INT-004 Integration health and retries

| Item | Value |
|---|---|
| Description (baseline) | Monitors connections with other systems, retries failed messages and keeps those that keep failing for investigation. |
| Why it matters | No data is lost when another system is temporarily down. |
| Who benefits | IT teams |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-004-01 | As a member of the client IT team, I want monitoring and alerts for API failures and for latency above thresholds, so that problems are found before users report them. | D; REQ-MPC-FR-342; FC-M23-012 | Ready |
| US-INT-004-02 | As a member of the client IT team, I want failed messages retried and, if they keep failing, kept for investigation, so that no data is lost when another system is down. | D; FC-M23-013 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-004-01-01 | US-INT-004-01 | **Given** a latency threshold is set for an API or adapter (value not stated), **when** its measured response time stays above the threshold for the configured period, **then** an alert is sent to the configured recipients with the integration name and the measured value. | REQ-MPC-FR-342 |
| AC-INT-004-01-02 | US-INT-004-01 | **Given** an error-rate threshold is set (value not stated), **when** failures exceed it in the configured period, **then** an alert is sent to the configured recipients. | REQ-MPC-FR-342 |
| AC-INT-004-01-03 | US-INT-004-01 | **Given** integrations are running, **when** an administrator opens the health view, **then** each integration shows success count, failure count, latency and throughput for the selected period. | FC-M23-012 |
| AC-INT-004-01-04 | US-INT-004-01 | **Given** an adapter has had no successful exchange within its expected interval (setting, default not stated), **when** the health check runs, **then** the adapter is shown as down and an alert is sent. | Proposed |
| AC-INT-004-02-01 | US-INT-004-02 | **Given** an outbound message fails with a transient error (timeout, 5xx, connection refused), **when** the retry policy applies, **then** it is retried after the configured delays up to the configured number of attempts (settings, defaults not stated). | D; FC-M23-013 |
| AC-INT-004-02-02 | US-INT-004-02 | **Given** an outbound message fails with a permanent error (the receiver rejects the content), **when** the response is received, **then** it becomes DeadLettered at once without further retries. | Proposed |
| AC-INT-004-02-03 | US-INT-004-02 | **Given** the last retry fails, **when** the attempt is recorded, **then** the message becomes DeadLettered, appears in the dead-letter list with every attempt and error, and administrators are notified. | D; FC-M23-013 |
| AC-INT-004-02-04 | US-INT-004-02 | **Given** a user with Integrations.Core.Messages.Replay opens a dead-lettered message, **when** they replay or discard it, **then** a reason is mandatory (message Int.ReasonRequired if empty); replay re-queues the same message id; the action is audited (AUD-INT-003). | FC-M23-013; Proposed (reason) |
| AC-INT-004-02-05 | US-INT-004-02 | **Given** another module sends to an external system through IC-INT-09 Enqueue (channel, event type, entity, payload, correlation id), **when** the delivery fails, **then** the message follows the same retry, dead-letter, replay and alert rules as INT messages and appears in the same dead-letter list (one outbox, BR-INT-015). | Proposed |

**Business rules applied:** BR-INT-013; BR-INT-014; BR-INT-015 (§8.1).


### 7.5 PRD-INT-005 ERP and finance connector framework

| Item | Value |
|---|---|
| Description (baseline) | A standard way to connect the shop to accounting or ERP systems to post sales and payments. It also keeps master data (products, customers, prices) in step in both directions, and includes a connector kit with templates and test tools for building new connections. |
| Why it matters | Finance systems stay up to date automatically. |
| Who benefits | Finance staff; IT |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-005-01 | As a member of finance staff, I want sales, payments and refunds posted to the accounting or ERP system automatically, so that the finance system stays up to date. | D | On hold: PAID-STUB |
| US-INT-005-02 | As a client administrator, I want products, customers and prices kept in step in both directions, with one system in charge of each type of data, so that there is one correct version of each record. | D | On hold: PAID-STUB |
| US-INT-005-03 | Technical enabler. As a member of the platform team, I want a connector kit with templates and test tools, so that a new ERP connection is built on the framework, not from scratch. | D; FC-M23-011 | On hold: PAID-STUB |
| US-INT-005-04 | As a KTDA finance manager (role to confirm, KG-16), I want the shop connected to the KTDA ERP, so that KTDA finance data stays in step. | D; REQ-KTDA-INT-001 | On hold: PAID-STUB |
| US-INT-005-05 | As a client administrator, I want workflow steps that call another system to use the operations of the INT adapters, so that processes reach external systems without new code. | Proposed (ADM-002 call-to-another-system step) | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-005-01-01 | US-INT-005-01 | **Given** an ERP adapter is active and posting is enabled for sales, **when** an order is paid (OrderPaidEvent), **then** the consumer only enqueues a posting; the posting task sends the sales document with order number, lines, tax and totals; the ERP reference is stored and the posting is Posted. | D; FIT (OrderPaidEvent) |
| AC-INT-005-01-02 | US-INT-005-01 | **Given** posting is enabled for refunds, **when** a refund is recorded (OrderRefundedEvent), **then** a refund or credit posting referencing the original posting is sent. | D; FIT |
| AC-INT-005-01-03 | US-INT-005-01 | **Given** the adapter is set to summarised posting, **when** the posting period closes (period a setting, default not stated), **then** one summarised posting per period and posting type is sent instead of one per order. | D; Proposed |
| AC-INT-005-01-04 | US-INT-005-01 | **Given** the ERP rejects a posting, **when** the response is received, **then** the posting becomes Failed with the ERP reason, appears in the posting exceptions list and the order is not changed. | Proposed |
| AC-INT-005-02-01 | US-INT-005-02 | **Given** the master of record for products is the ERP (BR-INT-020), **when** the ERP sends a changed product, **then** the change is applied through IProductService; the SEC-004 audit trail records before and after. | D |
| AC-INT-005-02-02 | US-INT-005-02 | **Given** the master of record for products is the ERP, **when** an administrator opens the product edit page, **then** fields managed by the ERP show message Int.ErpManagedField; a value changed there is not sent to the ERP and is replaced at the next synchronisation. | Proposed |
| AC-INT-005-02-03 | US-INT-005-02 | **Given** the master of record for customers is nopCommerce, **when** a customer is created or changed, **then** the consumer of EntityInsertedEvent<Customer> / EntityUpdatedEvent<Customer> enqueues the change and the adapter sends it to the ERP. | D; FIT |
| AC-INT-005-02-04 | US-INT-005-02 | **Given** stock levels come from the ERP, **when** the ERP sends stock, **then** stock synchronisation is done by INV-012 on this framework, not by INT-005. | D |
| AC-INT-005-03-01 | US-INT-005-03 | **Given** a developer starts a new ERP adapter, **when** they use the connector kit, **then** the kit gives a template adapter implementing IC-INT-03 and a contract test suite; the adapter is accepted only when every contract test passes against the ERP test system. | D; FC-M23-011 |
| AC-INT-005-04-01 | US-INT-005-04 | **Given** KTDA has named its ERP and its interface (KG-03) and the KTDA adapter is built on this framework, **when** a KTDA order is paid and a product changes in the ERP, **then** criteria AC-INT-005-01-01 and AC-INT-005-02-01 hold for that ERP — held by KG-03. | REQ-KTDA-INT-001 |
| AC-INT-005-05-01 | US-INT-005-05 | **Given** INT has registered the adapter operations a workflow step may call (operations of IC-INT-03, IC-INT-05 and IC-INT-06 that the active adapters support) in the ADM-002 step-operation catalogue through IC-ADM-01 RegisterStepOperation at installation, **when** an ADM-002 call-to-another-system step names such an operation and runs, **then** INT runs the operation on the adapter with the step payload and the correlation id, logs the call in the IntegrationMessage log (SM-INT-01) and returns the result or the error to the step; the timeout and retry count are those of the ADM step, not the INT-004 policy (BR-INT-023). | Proposed (ADM-002) |
| AC-INT-005-05-02 | US-INT-005-05 | **Given** the adapter of a registered operation is not active, **when** a step names that operation and runs, **then** INT returns the error AdapterInactive and sends nothing; the step fails as ADM-002 defines (case Failed, ADM-009 exception). | Proposed |

**Business rules applied:** BR-INT-001; BR-INT-010; BR-INT-020; BR-INT-021; BR-INT-023 (§8.1).


### 7.6 PRD-INT-006 SAGE 200 adapter

| Item | Value |
|---|---|
| Description (baseline) | Sends sales and payments to Malawi Post's SAGE 200 accounting system and reconciles them. |
| Why it matters | Malawi Post's accounts match the shop. |
| Who benefits | Malawi Post finance |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-006-01 | As a member of Malawi Post finance staff, I want summarised financial transactions posted to SAGE 200 as Malawi Post specifies, so that our accounts match the shop. | D; REQ-MPC-FR-138; REQ-MPC-FR-328 | Ready; on hold: AC-INT-006-01-01 (MG-09) |
| US-INT-006-02 | As a member of Malawi Post finance staff, I want to reconcile what the shop posted with what SAGE 200 holds, so that differences are found and resolved. | D; REQ-MPC-FR-138; REQ-MPC-FR-328 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-006-01-01 | US-INT-006-01 | **Given** the SAGE 200 adapter is configured with the posting specification Malawi Post provides, **when** the posting period closes, **then** one summarised posting per period and per posting type defined in that specification is sent to SAGE 200 and the SAGE reference stored — held by MG-09 (specification not received). | REQ-MPC-FR-138; REQ-MPC-FR-328 |
| AC-INT-006-01-02 | US-INT-006-01 | **Given** SAGE 200 rejects or does not acknowledge a posting, **when** the response or timeout is recorded, **then** the batch becomes Failed (SM-INT-03), finance staff are notified, and the batch is retried under the INT-004 policy; the period is not shown as posted. | REQ-MPC-FR-328; Proposed |
| AC-INT-006-02-01 | US-INT-006-02 | **Given** a batch is Posted, **when** reconciliation runs, **then** platform totals per period and posting type are compared with the totals read back from SAGE 200 (or imported from a SAGE 200 file); each difference is listed as an exception. | REQ-MPC-FR-138; REQ-MPC-FR-328 |
| AC-INT-006-02-02 | US-INT-006-02 | **Given** an exception is listed, **when** a user with Integrations.Core.Posting.CreateEditDelete resolves it, **then** a note is mandatory and the resolution is audited (AUD-INT-005); when no exception is open the batch becomes Reconciled. | REQ-MPC-FR-138; Proposed |

**Business rules applied:** BR-INT-021; BR-INT-022 (§8.1).


### 7.7 PRD-INT-007 PostGlobal adapter

| Item | Value |
|---|---|
| Description (baseline) | Exchanges orders, shipments and tracking information with Malawi Post's PostGlobal postal system. |
| Why it matters | Online orders flow into postal operations. |
| Who benefits | Malawi Post operations |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-007-01 | As a Malawi Post operations officer (role to confirm, MG-08), I want orders, shipments and tracking data exchanged with PostGlobal under the agreed interface specification, so that online orders flow into postal operations. | D; REQ-MPC-FR-327 | Ready; on hold: AC-INT-007-01-01 (FG-06) |
| US-INT-007-02 | As a Malawi Post operations officer (role to confirm, MG-08), I want PostGlobal notified of order and shipment events, so that postal operations start without re-keying. | REQ-MPC-FR-166 | Ready |
| US-INT-007-03 | As a Malawi Post operations officer (role to confirm, MG-08), I want PostGlobal status codes mapped to the platform's tracking dictionary, so that customers see one consistent set of statuses. | REQ-MPC-FR-221 | Ready |
| US-INT-007-04 | As a customer or stakeholder, I want the tracking view to show the PostGlobal events of my order, so that I can follow delivery. | REQ-MPC-ORD-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-007-01-01 | US-INT-007-01 | **Given** the PostGlobal interface specification is agreed and the adapter is configured, **when** an order to be handled by the postal network reaches the hand-off point (trigger to be fixed with the specification), **then** the order and shipment data are sent as the specification states and the PostGlobal reference is stored — held by FG-06 and the specification (not received). | REQ-MPC-FR-327 |
| AC-INT-007-01-02 | US-INT-007-01 | **Given** PostGlobal returns an item or tracking identifier for a shipment, **when** the adapter receives it, **then** it is set on the shipment through IShipmentService.UpdateShipmentAsync (Shipment.TrackingNumber); native ShipmentTrackingNumberSetEvent is not raised by this path (it is raised only by the admin controller). | REQ-MPC-FR-327; FIT |
| AC-INT-007-02-01 | US-INT-007-02 | **Given** PostGlobal is registered as a subscriber of order and shipment events (INT-003), or the specification requires a push by the adapter, **when** an order is placed or paid, or a shipment is created, shipped or delivered, **then** PostGlobal is notified once per event through the INT-003 delivery with the INT-004 retry policy. | REQ-MPC-FR-166 |
| AC-INT-007-03-01 | US-INT-007-03 | **Given** PostGlobal is registered as a TRK-002 tracking source (TrackingSource type PostGlobal) and its codes are mapped to the common event list in the TRK-002 source mapping table (SourceCodeMapping), **when** PostGlobal reports an event with a mapped code, **then** the INT-007 adapter submits it to TRK-002 through IC-TRK-01 with source code, reference, time and location; TRK-002 applies it with the mapped common code (BR-TRK-010); INT keeps no status map of its own (BR-INT-030). | REQ-MPC-FR-221 |
| AC-INT-007-03-02 | US-INT-007-03 | **Given** PostGlobal reports an event whose code has no mapping in SourceCodeMapping, **when** the adapter submits it through IC-TRK-01, **then** TRK-002 marks it Rejected in its rejected-events queue (SM-TRK-01) and no customer notification is sent for it; after the mapping is added TRK staff reprocess it. | REQ-MPC-FR-221 |
| AC-INT-007-04-01 | US-INT-007-04 | **Given** PostGlobal events exist for a shipment, **when** the customer or a stakeholder opens tracking (TRK-001, CRM-003), **then** the PostGlobal events applied by TRK-002 appear in the shipment timeline with common status, time and location. | REQ-MPC-ORD-001 |

**Business rules applied:** BR-INT-030; BR-INT-031 (§8.1).


### 7.8 PRD-INT-008 Banking integrations

| Item | Value |
|---|---|
| Description (baseline) | Connects to banks for payments, statements and account checks. |
| Why it matters | Faster, automated banking tasks. |
| Who benefits | Finance staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: KTDA-ADP |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-008-01 | As a member of finance staff, I want the shop connected to banks for payments, statements and account checks, so that banking tasks are automated. | D; REQ-KTDA-INT-002 | Ready; conditions: KTDA-ADP; on hold: AC-INT-008-01-04 (KG-04) |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-008-01-01 | US-INT-008-01 | **Given** a bank adapter implements the PAY-024 operations InitiatePayment, GetStatement and Payout that the bank supports (IC-PAY-01), **when** the statement task runs, **then** the statement lines are retrieved and handed to PAY-014 reconciliation. | D; REQ-KTDA-INT-002 |
| AC-INT-008-01-02 | US-INT-008-01 | **Given** the bank adapter offers account verification (IC-INT-04 VerifyAccount) and SEL-005 uses a bank check as its configured verification method for a seller bank payout account, **when** that account is PendingVerification (SM-SEL-04) and SEL-005 calls VerifyAccount, **then** INT-008 returns Match or Mismatch with the bank reference; SEL-005 sets the account Verified or Failed (INT-008 changes no account state itself); payouts are SEL-017. | D; Proposed |
| AC-INT-008-01-03 | US-INT-008-01 | **Given** the bank does not offer account verification, **when** SEL-005 calls VerifyAccount, **then** the adapter returns NotSupported and SEL-005 falls back to its other verification methods. | Proposed |
| AC-INT-008-01-04 | US-INT-008-01 | **Given** KTDA has named its bank and the bank interface (KG-04), **when** the KTDA bank adapter is configured, **then** statements and payment notifications from that bank reach PAY-005 and PAY-014 — held by KG-04. | REQ-KTDA-INT-002 |

**Business rules applied:** BR-INT-001 (§8.1).


### 7.9 PRD-INT-009 Government system connector framework

| Item | Value |
|---|---|
| Description (baseline) | A standard way to connect to government systems and regulators. |
| Why it matters | New government integrations are added without rebuilding. |
| Who benefits | Clients; government agencies |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-009-01 | As a client administrator, I want to exchange data with regulators and oversight bodies where required, such as reports and complaint escalations, only after approval, so that we meet oversight duties under control. | D; REQ-MPC-FR-343 | Ready |
| US-INT-009-02 | Technical enabler. As a member of the platform team, I want to add a government system as a plugin on one framework, so that new government integrations are added without rebuilding. | D; REQ-MPC-INT-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-009-01-01 | US-INT-009-01 | **Given** a regulator connector and a submission type (report or complaint escalation) are configured, **when** a submission is prepared, **then** it is stored as PendingApproval (SM-INT-04) and nothing is sent; the preparer sees message Int.SubmissionAwaitingApproval. | REQ-MPC-FR-343 |
| AC-INT-009-01-02 | US-INT-009-01 | **Given** a submission is PendingApproval, **when** a second user with Integrations.Core.GovSubmissions.Approve approves it, **then** it is sent through the connector and the response is stored; the approval is audited (AUD-INT-006). | REQ-MPC-FR-343 |
| AC-INT-009-01-03 | US-INT-009-01 | **Given** the preparer tries to approve the own submission, **when** the approval is posted, **then** it is refused with message Int.CannotApproveOwn (BR-INT-040). | REQ-MPC-FR-343 ("subject to approvals"); Proposed (segregation) |
| AC-INT-009-01-04 | US-INT-009-01 | **Given** an approver declines a submission, **when** the decline is saved, **then** it is not sent and the reason is recorded. | REQ-MPC-FR-343 |
| AC-INT-009-02-01 | US-INT-009-02 | **Given** a new government-system adapter implements IC-INT-05 and is installed as a plugin, **when** an administrator configures it, **then** it appears in the connector list and uses the same approval, retry and audit as other government connectors, with no change to the framework. | D; REQ-MPC-INT-001 |

**Business rules applied:** BR-INT-040 (§8.1).


### 7.10 PRD-INT-010 Master data synchronisation

| Item | Value |
|---|---|
| Description (baseline) | Keeps outlet lists, service catalogues and tariffs in step with the client's other systems. |
| Why it matters | One correct version of key reference data. |
| Who benefits | Client staff; IT |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-010-01 | As a Malawi Post administrator (role to confirm, MG-08), I want outlets, service catalogues and tariffs kept in step securely with other Malawi Post systems, so that one correct version of key reference data. | D; REQ-MPC-FR-349 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-010-01-01 | US-INT-010-01 | **Given** an outlet source system and its mapping are configured, **when** the outlet sync task runs, **then** each outlet is created or updated as a StorePickupPoint (bundled Pickup.PickupInStore) through IStorePickupPointService, linked to its external key; an outlet removed at the source is not deleted but closed through the LOG-003 outlet extension. | REQ-MPC-FR-349; FIT; Proposed (close, not delete) |
| AC-INT-010-01-02 | US-INT-010-01 | **Given** a service-catalogue source is configured, **when** the sync task runs, **then** service products are created or updated through IProductService by external key (CAT-026 service listings). | REQ-MPC-FR-349 |
| AC-INT-010-01-03 | US-INT-010-01 | **Given** a tariff source is configured, **when** the sync task runs, **then** tariff rows are written to the LOG-002 fee tables with their effective dates; orders already placed keep the tariff in force when placed. | REQ-MPC-FR-349 |
| AC-INT-010-01-04 | US-INT-010-01 | **Given** a record from the source fails validation, **when** the sync task runs, **then** that record is not applied, the others are, and the rejected record is reported with its reason in the message log (INT-004). | REQ-MPC-FR-349; Proposed |
| AC-INT-010-01-05 | US-INT-010-01 | **Given** the master of record for an entity type is the platform (BR-INT-020), **when** an administrator changes such a record, **then** the change is sent to the MPC system; the sync task does not overwrite it. | REQ-MPC-FR-349 ("between Platform and other MPC systems") |
| AC-INT-010-01-06 | US-INT-010-01 | **Given** a sync connection is configured, **when** data is exchanged, **then** the transfer uses TLS and the credentials stored encrypted for that system; a call with invalid credentials is rejected and logged. | REQ-MPC-FR-349 ("secure") |

**Business rules applied:** BR-INT-020; BR-INT-021 (§8.1).


### 7.11 PRD-INT-011 Plugin extensibility

| Item | Value |
|---|---|
| Description (baseline) | New modules can be added as add-ons without changing the core system. |
| Why it matters | The product grows without risky core changes. |
| Who benefits | Platform team |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-011-01 | Technical enabler. As a member of the platform team, I want to add a new module as an add-on without changing the core system, so that the product grows without risky core changes. | D; REQ-KTDA-NFR-001 | Ready; conditions: OVR-REG |
| US-INT-011-02 | As a client administrator, I want to install a module and limit it to chosen stores and customer roles, so that each client and store uses only what it needs. | D | Ready; conditions: OVR-REG |
| US-INT-011-03 | As a Malawi Post administrator (role to confirm, MG-08), I want other e-systems integrated through plug-ins or additional modules, so that new integrations do not need a rebuild. | REQ-MPC-INT-001; REQ-MPC-INT-004 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-011-01-01 | US-INT-011-01 | **Given** a plugin is built for nopCommerce 5.00 (target framework net10.0; plugin.json SupportedVersions contains 5.00), **when** it is uploaded and installed under Configuration > Local plugins by a user with Configuration.ManagePlugins and the application restarts, **then** its functions are available and no nopCommerce core file has changed. | D; REQ-KTDA-NFR-001; FIT (5.00.1: BasePlugin, Admin PluginController; Libraries/Nop.Core/NopVersion.cs:11; Directory.Build.props:3) |
| AC-INT-011-01-02 | US-INT-011-01 | **Given** a plugin's SupportedVersions does not contain 5.00 (for example a 4.90 build), **when** the application loads plugins, **then** the plugin is not loaded and is reported as incompatible with the current version. | FIT (5.00.1: Libraries/Nop.Services/Plugins/PluginsInfo.cs:212, NotCompatibleWithCurrentVersion) |
| AC-INT-011-01-03 | US-INT-011-01 | **Given** a new module needs storefront output, reactions to events, background jobs or a replaced service, **when** it is built, **then** it uses widget zones (IWidgetPlugin), event consumers (IConsumer<T>), scheduled tasks (IScheduleTask) or a DI registration in INopStartup with Order of at least 3000 recorded in the DI-override register (L1 §6.2 principle 7). | D; FIT |
| AC-INT-011-02-01 | US-INT-011-02 | **Given** a plugin is limited to store S and customer role R in its plugin.json (LimitedToStores, LimitedToCustomerRoles), **when** a customer of another store, or without role R, uses the shop, **then** the plugin is not active for them. | D; FIT |
| AC-INT-011-02-02 | US-INT-011-02 | **Given** an INT plugin is installed and its key catalogue lists every INT setting key with type, layer, secret flag and default (BR-INT-005), **when** a configuration pack sets an INT key that is not in the catalogue, or sets a key flagged secret, **then** the PLT pack validation refuses the pack (PLT-003) and nothing is written. | Proposed (PLT key catalogue; BR-PLT-013) |
| AC-INT-011-03-01 | US-INT-011-03 | **Given** the government connector framework (INT-009) is installed, **when** a new e-system adapter plugin is installed and configured, **then** it appears in the connector list and exchanges data without a change to other modules. | REQ-MPC-INT-001; REQ-MPC-INT-004 |

**Business rules applied:** BR-INT-005 (§8.1).


### 7.12 PRD-INT-012 Punch-out

| Item | Value |
|---|---|
| Description (baseline) | Business buyers shop from inside their own purchasing system and the cart returns to it for approval (punch-out). |
| Why it matters | Large organisations buy within their own procurement rules. |
| Who benefits | Business buyers |
| Phase | P3 |
| Implementation | Configuration — None (configure bundled plugin); Custom plugin only for OCI / cXML OrderRequest |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-012-01 | As a business buyer, I want to shop from inside my organisation's purchasing system and return the cart to it for approval, so that I buy within my procurement rules. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-012-01-01 | US-INT-012-01 | **Given** a punch-out connection is configured for a buyer organisation with a shared secret and protocol (cXML or OCI), **when** its purchasing system sends a valid punch-out setup request, **then** Withdrawn (VER-500): now native for cXML — the bundled Misc.PunchOut plugin validates the sender identity and shared secret, starts a PunchOutSession and signs in the contact of the setup request as a customer (found or created by e-mail); verified by AC-INT-012-01-05 and AC-INT-012-01-06; OCI is not native (open item). | VER-500; FIT (5.00.1: Plugins/Nop.Plugin.Misc.PunchOut/Controllers/PunchOutController.cs:45-86; Services/PunchOutService.cs:121-140, 332-490) |
| AC-INT-012-01-02 | US-INT-012-01 | **Given** the setup request carries a wrong secret, **when** it is received, **then** Withdrawn (VER-500): now native — the shared secret is compared with the stored hash of the PunchOutIdentity and an error response is returned with no session; verified by AC-INT-012-01-05. | VER-500; FIT (5.00.1: Plugins/Nop.Plugin.Misc.PunchOut/Services/PunchOutService.cs:121-140) |
| AC-INT-012-01-03 | US-INT-012-01 | **Given** a punch-out session is open, **when** the buyer returns the cart, **then** Withdrawn (VER-500): now native — the cart is returned as a cXML PunchOutOrderMessage to the session return URL and no order is created; verified by AC-INT-012-01-07. | VER-500; FIT (5.00.1: Plugins/Nop.Plugin.Misc.PunchOut/Controllers/PunchOutController.cs:88-102; Services/PunchOutService.cs:509-552) |
| AC-INT-012-01-04 | US-INT-012-01 | **Given** the purchasing system later sends a purchase order for a returned cart, **when** it is received, **then** an order is created through IOrderProcessingService.PlaceOrderAsync (CHK-003 override, OVR-REG) for that account and the PO number is stored; a PO for an unknown or expired session is refused. | D; Proposed |
| AC-INT-012-01-05 | US-INT-012-01 | **Given** the bundled Misc.PunchOut plugin is installed and a PunchOutIdentity is configured with the buyer system identity and shared secret, **when** the purchasing system posts a cXML PunchOutSetupRequest to punchout/setup with a wrong identity or secret, **then** a cXML error response is returned, the attempt is written to the punch-out log and no session starts. | VER-500; FIT (5.00.1: Plugins/Nop.Plugin.Misc.PunchOut/Controllers/PunchOutController.cs:45-67; Services/PunchOutService.cs:121-140, 332-360) |
| AC-INT-012-01-06 | US-INT-012-01 | **Given** the same identity and the correct secret, and a contact e-mail in the request, **when** the setup request is processed and the buyer follows the start URL (punchout/start), **then** a PunchOutSession is created for the store with buyer cookie and return URL, the customer with that e-mail is signed in (created if missing) unless the customer is in a role listed in PunchOutSettings.RestrictedCustomerRoleIds, and the storefront opens in punch-out mode. | VER-500; FIT (5.00.1: Plugins/Nop.Plugin.Misc.PunchOut/Services/PunchOutService.cs:362-490; PunchOutSettings.cs) |
| AC-INT-012-01-07 | US-INT-012-01 | **Given** a punch-out session is open with items in the cart, **when** the buyer chooses to return the cart (punchout/return), **then** the cart is sent to the session return URL as a cXML PunchOutOrderMessage with the PunchOutSettings.UnitOfMeasureCode, the session data is cleared and no nopCommerce order is created. | VER-500; D; FIT (5.00.1: Plugins/Nop.Plugin.Misc.PunchOut/Controllers/PunchOutController.cs:88-102; Services/PunchOutService.cs:509-552, 668) |

**Business rules applied:** BR-INT-001 (§8.1).


### 7.13 PRD-INT-013 MANEPS adapter

| Item | Value |
|---|---|
| Description (baseline) | Connects to Malawi's government e-procurement system (MANEPS). |
| Why it matters | Meets Malawi Post's integration requirement. |
| Who benefits | Malawi Post |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-INT-009 |
| Status | On hold: MG-09 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-INT-013-01 | As a Malawi Post administrator (role to confirm, MG-08), I want the shop connected to MANEPS through a plug-in, so that Malawi Post meets its stated integration requirement. | D; REQ-MPC-INT-001 | On hold: MG-09 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-INT-013-01-01 | US-INT-013-01 | **Given** Malawi Post has stated the purpose, data and interface of the MANEPS integration (MG-09) and the adapter is built on INT-009, **when** the data defined for MANEPS is exchanged, **then** it passes through the INT-009 framework with its approval, retry and audit rules — held by MG-09. | REQ-MPC-INT-001 |
| AC-INT-013-01-02 | US-INT-013-01 | **Given** MG-09 is not answered, **when** the MANEPS adapter is configured, **then** no data is sent to MANEPS; the adapter shows as not configured. | Proposed |

**Business rules applied:** BR-INT-040 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-INT-001 | Data written through the API or an adapter goes through the native nopCommerce service interfaces (for example IProductService, ICustomerService, IShipmentService, IOrderProcessingService), and so through the override that OVR-REG assigns to each (IProductService CAT-002, IOrderProcessingService CHK-003, IShipmentService.InsertShipmentAsync ORD-010); no adapter or endpoint writes core tables directly or changes order, payment or shipment status outside the service methods; INT registers no service override of its own. An INT endpoint or adapter that inserts a shipment for an order with lot- or serial-tracked lines calls INV IC-INV-07 Capture and Confirm around the insert (BR-INV-070; Proposed); the scope catalogue (BR-INT-006) has no shipment-creation scope today. | INT-001, INT-005, INT-008, INT-010, INT-012 | FIT; L1 §6.2; OVR-REG |
| BR-INT-005 | Every INT setting key is listed in the INT plugin key catalogue (key, type, layer, secret flag, default) so pack validation accepts it; INT keeps credentials, keys and secrets only in encrypted plugin-table fields (ConnectorConfig.CredentialsRef, WebhookSubscription.SecretRef, ApiClient.KeyHash), never in settings, and any setting that would hold one is flagged secret. INT pages, consumers and scheduled tasks act for a store only when IC-PLT-02 IsEnabled returns true for the INT feature concerned. | INT-003, INT-011 | CFG-01; BR-PLT-013; Proposed |
| BR-INT-002 | API access is denied by default: an API client has explicit scopes and store limits; every call outside them returns 403 and is logged. | INT-001, INT-002 | REQ-MPC-FR-338; Proposed |
| BR-INT-006 | API scope catalogue (names Proposed; owner INT-001): products.read (catalogue read, used by CAT-011 IC-CAT-01), products.read.unpublished (CAT-011 staff clients: unpublished listings as well), products.write, orders.read, search.read (SRC-024 search API for channel systems), payments.notify (PAY-005 bank notifications), shipments.write (TRK-002 tracking events), documents.read, webhooks.manage. A module that needs a new scope adds it to this catalogue; a scope outside the catalogue cannot be granted. | INT-001 | Proposed; CAT and |
| BR-INT-003 | API versions: a published version never changes incompatibly; incompatible changes go to a new major version; a deprecated version keeps working for the deprecation window and announces its retirement date in every response and in the change log (SM-INT-05). | INT-001 | REQ-MPC-FR-347; FC-M23-005 |
| BR-INT-004 | Rate limits apply per API client (gateway or INT plugin); the native global limiter (CommonConfig.PermitLimit, off by default) is not a per-client limit. | INT-001, INT-002 | D; FIT |
| BR-INT-010 | Event consumers only write an IntegrationMessage (outbox); delivery and adapter calls run in scheduled tasks, never inside the consumer (consumer exceptions are swallowed by the native event publisher). | INT-003, INT-005, INT-007 | FIT (EventPublisher); L1 §6.2 principle 8 |
| BR-INT-011 | A seller's subscription receives only events of orders that contain the seller's items, and only those lines. | INT-003 | REQ-MPC-FR-217; Proposed |
| BR-INT-012 | Webhook URLs are https only; every delivery is signed with the subscription secret and carries a message id and timestamp. | INT-003 | FC-M23-003; Proposed |
| BR-INT-013 | Delivery is at least once: retries keep the message id; receivers de-duplicate by message id; no message is deleted before it is Delivered or Discarded by a person. | INT-003, INT-004 | D (INT-004 "no data is lost"); Proposed |
| BR-INT-014 | Transient errors are retried under the policy; permanent errors go to dead letter at once; replay and discard need a reason and are audited. | INT-004 | FC-M23-013; Proposed |
| BR-INT-015 | One outbox: every outbound message the product sends to an external system is an IntegrationMessage, written by INT or by another module through IC-INT-09 Enqueue, and follows the INT-004 retry, dead-letter and replay rules. Callers: IAM-019 (account sync, BR-IAM-100) and INV-012 (stock sync, BR-INV-090). | INT-004 | D (INT-004 "no data is lost"); Proposed |
| BR-INT-020 | For each entity type exchanged with an external system, one master of record is configured per client (external system or nopCommerce); only changes from the master are applied; changes to a field mastered elsewhere are not sent and are replaced at the next sync. | INT-005, INT-010 | D ("in step in both directions"); Proposed |
| BR-INT-021 | Postings and sync exchanges are idempotent per external key: a repeated posting or record with the same key is not applied twice. | INT-005, INT-006, INT-010 | Proposed; NFR-X-007 |
| BR-INT-022 | A SAGE 200 posting batch is final only when SAGE 200 acknowledges it; a period is Reconciled only when no exception is open. | INT-006 | REQ-MPC-FR-138; Proposed |
| BR-INT-023 | INT adapter operations that workflow steps may call are registered in the ADM-002 step-operation catalogue through IC-ADM-01 RegisterStepOperation (ADM owns the catalogue); INT runs them only on active adapters, logs each call with the correlation id in the IntegrationMessage log, and leaves timeout and retry to the calling step. | INT-005 | Proposed (ADM-002) |
| BR-INT-030 | PostGlobal is a TRK-002 tracking source: the INT-007 adapter submits PostGlobal events through IC-TRK-01 and TRK-002 maps them with its SourceCodeMapping; INT keeps no status map of its own; unmapped codes are rejected by TRK-002 and send no customer notification. | INT-007 | REQ-MPC-FR-221; Proposed |
| BR-INT-031 | Tracking numbers returned by PostGlobal are written through IShipmentService.UpdateShipmentAsync; shipment shipped and delivered states change only through IOrderProcessingService.ShipAsync / DeliverAsync. | INT-007 | FIT |
| BR-INT-040 | Submissions to government systems are sent only after approval by a second person holding Integrations.Core.GovSubmissions.Approve. | INT-009, INT-013 | REQ-MPC-FR-343; Proposed (second person) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-INT-01 | IntegrationMessage | (none) | event or adapter request enqueued | — | Queued | record created with message id |
| SM-INT-01 | IntegrationMessage | Queued | delivery task picks it | task lock held (native ScheduleTaskRunner lock) | Sending | attempt counted |
| SM-INT-01 | IntegrationMessage | Sending | receiver acknowledges (2xx or adapter success) | — | Delivered | result stored |
| SM-INT-01 | IntegrationMessage | Sending | transient error or timeout | attempts below maximum | RetryWaiting | next attempt time set |
| SM-INT-01 | IntegrationMessage | RetryWaiting | next attempt time reached | — | Sending | — |
| SM-INT-01 | IntegrationMessage | Sending | permanent error, or transient error at maximum attempts | — | DeadLettered | owner and administrators notified |
| SM-INT-01 | IntegrationMessage | DeadLettered | replay with reason | Integrations.Core.Messages.Replay | Queued | AUD-INT-003; same message id |
| SM-INT-01 | IntegrationMessage | DeadLettered | discard with reason | Integrations.Core.Messages.Replay | Discarded | AUD-INT-003 |
| SM-INT-02 | WebhookSubscription | (none) | subscription created | https URL | PendingVerification | verification request sent |
| SM-INT-02 | WebhookSubscription | PendingVerification | URL answers verification | — | Active | AUD-INT-002 |
| SM-INT-02 | WebhookSubscription | Active | owner pauses, or consecutive dead letters reach the threshold (setting, default not stated) | — | Paused | owner notified |
| SM-INT-02 | WebhookSubscription | Paused | owner resumes | — | Active | queued messages resume |
| SM-INT-02 | WebhookSubscription | Active / Paused / PendingVerification | owner deletes | — | Deleted | no further messages |
| SM-INT-03 | PostingBatch | Open | period closes | — | Ready | — |
| SM-INT-03 | PostingBatch | Ready | sent and acknowledged | — | Posted | external reference stored |
| SM-INT-03 | PostingBatch | Ready | rejected or not acknowledged | — | Failed | finance notified; retry under INT-004 |
| SM-INT-03 | PostingBatch | Failed | re-post | Integrations.Core.Posting.CreateEditDelete or retry policy | Ready | AUD-INT-005 when manual |
| SM-INT-03 | PostingBatch | Posted | reconciliation finds differences | — | Exceptions | exceptions listed |
| SM-INT-03 | PostingBatch | Posted / Exceptions | no exception open | — | Reconciled | — |
| SM-INT-04 | GovSubmission | (none) | submission prepared | — | PendingApproval | nothing sent |
| SM-INT-04 | GovSubmission | PendingApproval | approved | second person (BR-INT-040) | Approved | AUD-INT-006 |
| SM-INT-04 | GovSubmission | PendingApproval | declined with reason | — | Declined | AUD-INT-006 |
| SM-INT-04 | GovSubmission | Approved | sent | — | Sent | IntegrationMessage (SM-INT-01) |
| SM-INT-04 | GovSubmission | Sent | authority response | — | Acknowledged / Rejected | response stored |
| SM-INT-05 | ApiVersion | Active | newer major version released and deprecation announced | — | Deprecated | notice in responses and change log; AUD-INT-009 |
| SM-INT-05 | ApiVersion | Deprecated | retirement date reached | — | Retired | calls return 410 |
| SM-INT-06 | PunchOutSession | (none) | valid setup request | secret valid | Started | buyer signed in (native Misc.PunchOut: PunchOutSession.IsActive) |
| SM-INT-06 | PunchOutSession | Started | cart returned | — | CartReturned | cart posted back; no order |
| SM-INT-06 | PunchOutSession | CartReturned | purchase order received | session known | Ordered | order placed natively |
| SM-INT-06 | PunchOutSession | Started / CartReturned | session time limit passes (native PunchOutSettings.TimeToExpire, value not stated) | — | Expired | later purchase order refused |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| ApiClient (new) | Id, Name, OwnerType (Partner / Vendor / App / Internal), VendorId, Scopes, StoreIds, AllowedVersions, RateLimit, ExternalClientId (authorization server), KeyHash, Status, CreatedOnUtc | INT-001 | Not a Customer; an OIDC user is mapped to a Customer by a stored subject identifier (Proposed) |
| ApiVersion (new) | Version, Status (SM-INT-05), ReleasedOnUtc, DeprecatedOnUtc, RetirementDate, ChangeLog | INT-001 | |
| WebhookSubscription (new) | Id, ApiClientId or VendorId, Url, EventTypes, SecretRef (encrypted), Status (SM-INT-02), ConsecutiveFailures | INT-003 | |
| IntegrationMessage (new, outbox) | Id (message id), Direction, Channel (webhook / adapter name), EventType, EntityName, EntityId, Payload, Status (SM-INT-01), Attempts, NextAttemptOnUtc, LastError, CorrelationId, CreatedOnUtc | INT-003, INT-004 and all adapters | Native QueuedEmail retries are email only (SentTries, maximum 3 in QueuedMessagesSendTask) |
| ConnectorConfig (new) | SystemName, AdapterType, Environment (Test / Production), EndpointUrl, CredentialsRef (encrypted with IEncryptionService), InterfaceVersion, MasterOfRecord per entity type, IsActive | INT-005 to INT-010, INT-013 | Credentials never in packs (CFG-01) |
| MasterDataLink (new) | EntityName, EntityId, SystemName, ExternalKey, LastHash, LastSyncedOnUtc | INT-005, INT-010 | Links native Product, Customer, StorePickupPoint to external keys; no column added to native tables |
| PostingBatch / PostingLine / PostingException (new) | Batch: SystemName, PeriodStart, PeriodEnd, PostingType, Amount, Status (SM-INT-03), ExternalReference; Line: OrderId or summary key, Amount; Exception: Difference, Note, ResolvedBy | INT-005, INT-006 | |
| GovSubmission (new) | Id, SystemName, Type, PayloadRef, Status (SM-INT-04), PreparedBy, ApprovedBy, DeclineReason, Response | INT-009, INT-013 | |
| PunchOutSession (native Misc.PunchOut since 5.00) and PunchOutSessionExt (new, only if OCI or purchase-order receipt is built) | Native: SessionId, BuyerCookie, ReturnUrl, CustomerId, StoreId, IsActive, CreatedOnUtc; extension: BuyerOrganisation, Protocol, Status (SM-INT-06), PoNumber | INT-012 | Plugins/Nop.Plugin.Misc.PunchOut/Domain/PunchOutSession.cs |
| Shipment.TrackingNumber (native) | — | INT-007 | Set through IShipmentService.UpdateShipmentAsync |
| StorePickupPoint (native, bundled Pickup.PickupInStore) | — | INT-010 | No active flag or external key natively; closure through LOG-003 extension; external key in MasterDataLink |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Integration adapters, API clients and scopes | API client registry and scopes (new, BR-INT-006); adapter endpoint settings; outbox (IC-INT-09) | country → client | INT-001 / INT-004 / INT-005 | Core |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| API clients, scopes, store limits | ApiClient (new) | client | Not stated | Not stated |
| Rate limit per API client; native global limiter | ApiClient.RateLimit (new) or gateway rule; CommonConfig.PermitLimit / QueueCount / RejectionStatusCode in App_Data/appsettings.json (native, installation-wide, 0 = off) | client (installation for the native limiter) | Not stated | Not stated |
| API deprecation window | INT settings (new) | client | Not stated | Not stated (backward-compatibility policy required, FR-347) |
| Webhook timeout, retry attempts and delays; auto-pause threshold | INT settings (new) | client | Not stated | Not stated |
| Health thresholds (latency, error rate) and alert recipients | Gateway configuration; INT settings (new) for adapters | client | Not stated | Not stated (FR-342) |
| ERP adapter, posting mode (per order / summarised), posting period, master of record per entity type | ConnectorConfig (new) | client | ERP not named (KG-03) | — |
| SAGE 200 adapter and posting specification | ConnectorConfig (new) | client | — | Required (FR-138, FR-328); specification not received (MG-09) |
| PostGlobal endpoint; PostGlobal code mapping | ConnectorConfig (new); TRK-002 TrackingSource and SourceCodeMapping (TRK module) | client | — | Required (FR-327, FR-221); specification not received; FG-06 |
| Bank adapters | ConnectorConfig (new) with PAY-024 adapter settings | country → client | Bank not named (KG-04) | Banks not named (MG-03) |
| Government connectors and submission types | ConnectorConfig (new) | country → client | — | Regulators not named (FR-343); MANEPS (MG-09) |
| Master-data sync sources and interval | ConnectorConfig (new); ScheduleTask.Seconds (native, installation-wide) | client | — | Systems not named (FR-349, MG-09) |
| Plugin store and role limits | LimitedToStores / LimitedToCustomerRoles in plugin.json (file); App_Data/plugins.json (installed list) | client → store | Not stated | Not stated |
| INT feature state per store | productfeature.PRD-INT-nnn (PLT-022, read through IC-PLT-02) | client → store | Not stated | Not stated |
| Credentials for every connector | ConnectorConfig.CredentialsRef (encrypted) | client instance only | Entered at deployment | Entered at deployment |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Admin | API clients and versions (scopes, store limits, keys, change log) | INT-001 | New |
| Admin | Webhook subscriptions and delivery history | INT-003 | New |
| Admin | Integration messages: log, failures, dead-letter list with replay and discard | INT-004 | New |
| Admin | Connectors: ERP, SAGE 200, PostGlobal, banks, government, master-data sync, punch-out | INT-005 to INT-010, INT-012, INT-013 | New |
| Admin | Posting batches and reconciliation exceptions | INT-005, INT-006 | New |
| Admin | Government submissions: approval queue | INT-009 | New |
| Admin | Local plugins (install, store and role limits) | INT-011 | Native |
| Admin — product edit | ERP-managed field marker | INT-005 | Native page extended |
| Seller portal | Own webhook subscriptions | INT-003 | New |
| Gateway (external) | Integration console, registry, developer portal, sandbox, health dashboard | INT-002, INT-004 | External product |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin patterns. Gateway screens are those of the selected product.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Int.WebhookUrlNotHttps | The notification address must start with https://. | AC-INT-003-02-03 |
| Int.ReasonRequired | Enter a reason before you continue. | AC-INT-004-02-04 |
| Int.ErpManagedField | This field is managed in the connected system. Changes made here are replaced at the next synchronisation. | AC-INT-005-02-02 |
| Int.SubmissionAwaitingApproval | The submission is saved and waits for approval. Nothing has been sent. | AC-INT-009-01-01 |
| Int.CannotApproveOwn | You cannot approve a submission you prepared. | AC-INT-009-01-03 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8). API error responses carry machine-readable codes, not locale texts.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Public API (INT-001) | Resource calls under scopes and versions (IC-INT-01) | Partner systems, ERP, banks, shipping systems, apps, MPC and government systems | Base product: decision API-01 |
| API gateway (INT-002) | Authentication, throttling, transformation, portal, sandbox, monitoring | Gateway product (not named) | External; decision API-GW |
| Webhooks (INT-003) | Signed event delivery (IC-INT-02) | Subscribers: PostGlobal, sellers, partners | — |
| ERP / finance (INT-005) | Posting, master-data sync (IC-INT-03) | KTDA ERP (not named, KG-03) | Connector kit |
| SAGE 200 (INT-006) | Summarised posting, reconciliation | Malawi Post SAGE 200 | Specification not received (MG-09) |
| PostGlobal (INT-007) | Orders, shipments, tracking (IC-INT-06) | Malawi Post PostGlobal | Specification not received; FG-06 |
| Banks (INT-008) | Payments, statements, payouts (IC-PAY-01), account verification (IC-INT-04) | Banks not named (KG-04, MG-03) | — |
| Government systems (INT-009, INT-013) | Approved submissions (IC-INT-05) | Regulators (not named); MANEPS (MG-09) | — |
| Master data (INT-010) | Outlets, service catalogues, tariffs | Malawi Post systems (not named) | — |
| Punch-out (INT-012) | cXML setup and cart return through the bundled Misc.PunchOut; OCI and order receipt only if built (IC-INT-07) | Buyer procurement systems (not named) | P3 |
| Workflow steps (ADM-002) | RegisterStepOperation (IC-ADM-01); step calls to INT adapter operations | ADM module (internal) | Held by WF-ENG |
| Module outbox (IC-INT-09) | Enqueue, GetStatus | IAM-019 (account sync); INV-012 (stock sync); other modules on request | Internal |
| Notifications (TRK-005) | RegisterEventCode, SendEvent (IC-TRK-04) | TRK module (internal) | Decision MSG-ROUTE |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-INT-01 | Public API resource call | API client token, version, resource, query or body | JSON resource or page; status codes 200, 201, 204 | 400 validation, 401, 403, 404, 409 conflict, 410 retired, 429 limited | Licensed Web API plugin endpoints (API-01) plus product controllers in INT plugins; writes via native services (BR-INT-001) |
| IC-INT-02 | Webhook delivery | IntegrationMessage | HTTP POST with body {messageId, type, occurredOnUtc, entity, entityId, status, link}; headers with signature and timestamp | non-2xx, timeout (retry); 410 from receiver (pause subscription, Proposed) | IScheduleTask delivery task reading the outbox |
| IC-INT-03 | ERP connector | PostDocument(document, idempotency key); GetPostingStatus(reference); PullChanges(entity type, since); PushChanges(entity type, records); GetTotals(period, posting type) | Posted / Failed with external reference; changed records; totals for reconciliation | NotSupported, rejected, unavailable | Adapter class registered by an INT-005 plugin; called from scheduled tasks; master data applied through native services |
| IC-INT-04 | Bank account verification — VerifyAccount(bank, account number, holder name) | Bank, account number, holder name | Match / Mismatch / NotSupported, bank reference | Unavailable | Bank adapter (INT-008) alongside its IC-PAY-01 operations (PAY-024); called by SEL-005 and PAY-022 |
| IC-INT-05 | Government connector | Submit(submission type, payload); GetStatus(reference) | Sent / Acknowledged / Rejected, reference, response | NotSupported, rejected, unavailable | Adapter registered by an INT-009 plugin; called only for Approved submissions |
| IC-INT-06 | PostGlobal adapter | SendOrder / SendShipment (per specification); ReceiveEvent (callback or poll) | PostGlobal reference; tracking identifier; events submitted to TRK-002 through IC-TRK-01 | Specification errors; unmapped code (rejected by TRK-002) | INT-007 plugin; further operations if FG-06 keeps postal operations in PostGlobal (LOG-011, LOG-022 to LOG-024) |
| IC-INT-09 | Outbound message enqueue | Enqueue(channel, event type, entity name and id, payload, correlation id); GetStatus(message id) | Message id; status (SM-INT-01) | Unknown channel | INT service writing IntegrationMessage through IRepository<>; sent by the INT delivery task under the INT-004 policy (BR-INT-015) |
| IC-INT-07 | Punch-out | Setup request (cXML or OCI), cart return, purchase order | Session start URL; cart message; order reference | Bad secret, unknown session | cXML setup, start and cart return: native Misc.PunchOut PunchOutController on route punchout/setup, punchout/start, punchout/return (5.00); OCI and the purchase order: INT-012 plugin controller deriving from Microsoft.AspNetCore.Mvc.Controller on its own route (IRouteProvider), built only if required |

Callback and webhook-receiving controllers derive from Microsoft.AspNetCore.Mvc.Controller on their own routes (IRouteProvider), as the bundled PayPalCommerceWebhookController does, and verify the caller before any change. Workflow step operations are listed in the ADM-002 step-operation catalogue (IC-ADM-01 RegisterStepOperation), not in an INT registry. C# signatures are produced at the start of the L2 build and approved by the tech lead; this table fixes the operations and their mapping.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| order.placed | OrderPlacedEvent (native) | INT-003 subscribers; INT-007 PostGlobal |
| order.paid | OrderPaidEvent (native) | INT-003 subscribers (FR-348); INT-005 / INT-006 posting |
| order.status_changed (includes cancelled) | OrderStatusChangedEvent (native; carries previous status) | INT-003 subscribers |
| order.refunded | OrderRefundedEvent (native) | INT-003 subscribers; INT-005 refund posting |
| shipment.created | EntityInsertedEvent<Shipment> (native; ShipmentCreatedEvent is raised only by the admin AddShipment action) | INT-003 subscribers; INT-007 |
| shipment.dispatched (shipment.sent) | ShipmentSentEvent (native, from IOrderProcessingService.ShipAsync) | INT-003 subscribers (FR-348); INT-007 |
| shipment.ready_for_pickup | ShipmentReadyForPickupEvent (native) | INT-003 subscribers |
| shipment.delivered | ShipmentDeliveredEvent (native, from DeliverAsync) | INT-003 subscribers; INT-007 |
| service_request.submitted | EGV module event ServiceRequest.Submitted (application, service, agency, citizen, time), raised once when a ServiceApplication is created (EGV-002, held by FG-06) | INT-003 subscribers (FR-348) |
| masterdata.changed | EntityInsertedEvent / EntityUpdatedEvent<Product, Customer> (native) | INT-005, INT-010 outbound sync for platform-mastered types |
| Integration.DeadLettered | None (INT event) | Administrators; subscription owner; INT-004 health |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two web nodes run the delivery task | INT-003, INT-004 | The native ScheduleTaskRunner runs each task under ILocker.PerformActionWithLockAsync keyed by the task type (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 §6.4); a message is also claimed by a status change Queued → Sending with a row-version check on the IntegrationMessage plugin table, so it is sent once per attempt |
| Same entity changed by the ERP sync and an administrator at the same time | INT-005, INT-010 | Only the master of record is applied (BR-INT-020); the sync applies a change under ILocker key 'int-entity-{EntityName}-{EntityId}'; the later write wins for platform-mastered fields only |
| Receiver down for a long period | INT-003, INT-004 | Messages wait in RetryWaiting and then DeadLettered; none is deleted (BR-INT-013); after replay they are sent in creation order per entity (Proposed) |
| Duplicate posting after a timeout | INT-005, INT-006 | The posting carries its idempotency key; GetPostingStatus is called before a re-post (BR-INT-021) |
| API write retried by the client | INT-001 | PLT-027 idempotency key on state-changing API calls; the second call returns the first result |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Message dead-lettered | Administrators; subscription owner (seller or partner contact) | Email through TRK-005 (IC-TRK-04 SendEvent) / admin notification | INT-003, INT-004 |
| Health threshold exceeded or adapter down | Configured recipients | Email through TRK-005 / gateway alert | INT-004 |
| Posting failed; reconciliation exceptions found | Finance staff | Email through TRK-005 / admin notification | INT-005, INT-006 |
| Submission awaiting approval | Approvers | Admin notification | INT-009 |
| API version deprecated | Owners of API clients using it | Email through TRK-005 | INT-001 |
| Subscription auto-paused | Subscription owner | Email through TRK-005 | INT-003 |
| Event codes | — | INT registers these event codes through IC-TRK-04 RegisterEventCode at installation (names Proposed, listed in BR-TRK-023): Int.Core.MessageDeadLettered (also for messages enqueued by IAM-019 and INV-012), Int.Core.HealthAlert, Int.Core.PostingFailed, Int.Core.ReconciliationExceptions, Int.Core.ApiVersionDeprecated, Int.Core.SubscriptionPaused; TRK-005 sends all of them (decision MSG-ROUTE) | All |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Integration health (success, failures, latency, throughput) | INT-004 | REQ-MPC-FR-342; FC-M23-012 |
| Dead-letter and replay log | INT-004 | FC-M23-013 |
| Posting and reconciliation report (ERP, SAGE 200) | INT-005, INT-006 | REQ-MPC-FR-138, FR-328 |
| Webhook delivery history | INT-003 | FC-M23-003 |
| Government submissions log | INT-009 | REQ-MPC-FR-343 |
| API change log per version | INT-001 | REQ-MPC-FR-347 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-INT-001 | API client created, changed, revoked or key rotated | Administrator | ApiClient | scopes, store limits, status (key never recorded) |
| AUD-INT-002 | Webhook subscription created, verified, paused, resumed or deleted | Administrator / seller / system | WebhookSubscription | URL, event types, status (secret never recorded) |
| AUD-INT-003 | Dead-lettered message replayed or discarded | Administrator | IntegrationMessage | message id, action, reason |
| AUD-INT-004 | Connector configuration changed | Administrator | ConnectorConfig | old and new values, credentials masked |
| AUD-INT-005 | Posting batch re-posted; reconciliation exception resolved | Finance staff | PostingBatch, PostingException | action, note, amounts |
| AUD-INT-006 | Government submission approved, declined or sent | Approver / system | GovSubmission | preparer, approver, reason, response |
| AUD-INT-007 | API call refused (401 or 403) | System | ApiClient | client, route, reason |
| AUD-INT-008 | External change applied to a native record (sync or API write) | System | Product, Customer, StorePickupPoint and others | captured by the SEC-004 repository decorator with before and after values |
| AUD-INT-009 | API version deprecated or retired | Administrator | ApiVersion | version, dates |

Business events AUD-INT-001 to AUD-INT-007 and AUD-INT-009 are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014). Old and new values of entity changes, including AUD-INT-008, are captured by the SEC-004 IRepository<> decorator and need no call (BR-SEC-010). All INT plugin tables are written through IRepository<>; no INT code writes through INopDataProvider directly (BR-SEC-011). The native activity log is not used as audit. Names and fields are Proposed. Secrets and keys are never written to the audit trail.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-INT-001 | All API, webhook and adapter traffic uses TLS; plain http endpoints are refused. | REQ-MPC-FR-326, FR-349 ("secure"); SEC-001 | AC-INT-003-02-03; AC-INT-010-01-06 |
| NFR-INT-002 | Connector credentials and webhook secrets are stored encrypted per client instance and never exported in configuration packs. | CFG-01; NFR-X-001 | AC-INT-002-02-02; T-INT-06 |
| NFR-INT-003 | No outbound message is lost when a receiver is unavailable (at-least-once delivery, dead letter, replay). | D (INT-004 "no data is lost"); BR-INT-013 | AC-INT-004-02-03; T-INT-03 |
| NFR-INT-004 | API and adapter writes never bypass native services or permissions. | BR-INT-001 | AC-INT-001-01-02; T-INT-05 |
| NFR-INT-005 | All configuration and manual interventions are audited (NFR-X-003). | REQ-MPC-FR-343; NFR-X-003 | §14.2 audit events |
| NFR-INT-006 | API response-time, throughput and availability targets: Not stated in source — requires confirmation. | NFR-X-009; REQ-MPC-FR-342 (thresholds configurable) | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-INT-001 | P1 | — | PRD-CAT-011 |
| PRD-INT-002 | P1 | — | |
| PRD-INT-003 | P1 | — | |
| PRD-INT-004 | P1 | — | |
| PRD-INT-005 | P1 | — | |
| PRD-INT-006 | P1 | — | |
| PRD-INT-007 | P1 | — | |
| PRD-INT-008 | P1 | — | |
| PRD-INT-009 | P1 | — | PRD-INT-013 |
| PRD-INT-010 | P1 | — | |
| PRD-INT-011 | P1 | — | |
| PRD-INT-012 | P3 | — | |
| PRD-INT-013 | P1 | PRD-INT-009 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-INT-01 | Each adapter passes its contract test suite against the partner test system before production (connector kit). |
| T-INT-02 | Webhooks: each event type in §12.3 is raised once per native event, including shipments created outside the admin controller; signature verifies; duplicates keep the message id. |
| T-INT-03 | Outage: the receiver is stopped, events are raised, the receiver restarts; every message is Delivered or DeadLettered, none lost; replay delivers the rest. |
| T-INT-04 | Versioning: a v1 client keeps working after v2 release; deprecation notice present; 410 after retirement. |
| T-INT-05 | API writes: price, stock, shipment and payment changes go through native services (stock history exists; order status changed only by IOrderProcessingService). |
| T-INT-06 | Secrets: export a configuration pack and scan the audit trail and logs; no credential, key or secret appears. |
| T-INT-07 | Permissions and scopes: each permission in §4 and each API scope has an allow and a deny case. |
| T-INT-09 | Configuration: every INT setting key is in the key catalogue; a pack with an unknown or secret INT key is refused; with an INT feature off for a store, no INT page, consumer or task acts for that store. |
| T-INT-10 | Step operations and outbox: each INT operation registered through IC-ADM-01 RegisterStepOperation runs from a workflow step and is logged with the correlation id; an operation of an inactive adapter returns AdapterInactive; a message enqueued through IC-INT-09 is retried and dead-lettered like an INT message. |
| T-INT-08 | State models: every transition in §8.2 is tested; transitions not listed are rejected. |
