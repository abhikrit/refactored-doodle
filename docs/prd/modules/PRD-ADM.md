# L2 Module PRD — ADM: Administration, workflow and operations console

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | ADM — Administration, workflow and operations console |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Gives client staff one back office to run the shop, and gives the product the configurable machinery that replaces per-client code: a workflow engine for business processes, a business rules engine, a registry of transaction types with their parameters, eligibility and quota rules, approval queues, an operations console with work queues, upload and virus-scanning controls, an exception queue, operational alerts and a versioned template library. It also keeps the product register of nopCommerce service overrides and action filters, so that two plugins never silently replace the same core service.

**In scope**

- Administration console on the native nopCommerce admin, bulk product actions, customer suspension, and the product extension register (ADM-001)
- Workflow engine and business rules engine (ADM-002, ADM-003; held by WF-ENG)
- Transaction types and parameter schema; eligibility, quota and sanctions-screening rules (ADM-004, ADM-005)
- Approval queues, operations console and work queues, exception management, operational alerts (ADM-006, ADM-007, ADM-009, ADM-010)
- Upload policy and content scanning (ADM-008)
- Transaction template library, template analytics and shared library (ADM-011, ADM-012)

**Not in this module**

| Item | Where it is |
|---|---|
| Settings change control and configuration packs | PLT-003, PLT-004 (PLT-004 uses ADM-006 for approvals) |
| Business behaviour inside each process (order, shipment, payment, seller, listing rules) | The owning module (ORD, LOG, PAY, SEL, CAT); workflow steps call their services |
| Payment exceptions console and payment manual actions | PAY-019 (PAY may also raise items into ADM-009) |
| Notification delivery and templates | TRK-004, TRK-005 |
| Document generation and storage used by workflow steps | DOC-001, DOC-002 |
| Block and watch lists used by eligibility screening | SEL-013 |
| Delegation of authority used to scope approval queues | IAM-009 |
| Audit store | SEC-004 |
| Tender, auction and bid transaction types | Excluded by decision D-02 |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-ADM-001 | Administration console | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-ADM-002 | Workflow engine | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | WF-ENG |
| PRD-ADM-003 | Business rules engine | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-ADM-004 | Transaction types and parameter schema | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | PRD-ADM-003 | |
| PRD-ADM-005 | Eligibility and quota rules | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | PRD-SEL-013 | |
| PRD-ADM-006 | Approval queues | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002 | WF-ENG |
| PRD-ADM-007 | Operations console and work queues | Platform / back-office | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-ADM-008 | Upload and content scanning controls | Platform / back-office | P1 | Code-level | Custom plugin + External system + integration plugin | Core (always on) | | |
| PRD-ADM-009 | Exception management | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-ADM-010 | Operational alerts | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-ADM-011 | Template library | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | PRD-ADM-004 | |
| PRD-ADM-012 | Template analytics and shared marketplace | Platform / back-office | P3 | Code-level | Custom plugin | Commerce extensions pack | PRD-ADM-011 | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Client administrator | Runs the back office; designs workflows, rules, transaction types, eligibility rules, queues, alerts and templates | Administrators (native) |
| Approver | Acts on approval items assigned by role, authority and delegation | Any role named on an approval step (IAM-007) |
| Operations staff | Work queues, operational order view, exceptions, alerts, personal dashboard | Role system name "Operations" (Proposed; IAM role catalogue BR-IAM-050) |
| Catalogue manager | Bulk edits and archives products | Administrators or a role holding Catalog.ProductsCreateEditDelete (native) |
| Programme or compliance staff | Eligibility, quota and sanctions-screening rules and reviews | Role system name "Compliance" (Proposed; IAM role catalogue BR-IAM-050) |
| Auditor | Replays workflow cases, reads rule evaluation logs and resolution history | Role system name "Auditor" (IAM role catalogue BR-IAM-050; SEC-010) |
| Platform team | Maintains the extension register, rule pattern library and shared template library | Role system name "PlatformOperator" (Proposed by PLT; IAM role catalogue BR-IAM-050) |
| Owning modules (system) | Start workflow cases, evaluate rules, submit approval items, raise exceptions through ADM contracts | Product plugins |
| Antivirus engine; sanctions-list source (systems) | Scan uploaded files; supply sanctions lists | External systems (not named in source) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Security.AccessAdminPanel (native) | Security | Open the admin area | Administrators, Vendors (native defaults) and roles granted by IAM-007 |
| System.ManageScheduleTasks (native) | System | Edit scheduled tasks and run them now | Administrators |
| Catalog.ProductsCreateEditDelete (native) | Catalog | Bulk edit, unpublish and delete products | Administrators, Vendors (native defaults; vendors act on own products only) |
| Configuration.ManageSettings (native) | Configuration | Edit the upload policy settings (ADM-008) | Administrators |
| Administration.Core.Extensions.View | System | View the product extension register and its start-up check | Administrators, PlatformOperator |
| Administration.Core.Workflows.View | Configuration | View workflow definitions, cases and replays | Administrators, Auditor |
| Administration.Core.Workflows.CreateEditDelete | Configuration | Design, simulate, publish and retire workflow definitions | Administrators |
| Administration.Core.Rules.View | Configuration | View rule sets, rules, test results and evaluation logs | Administrators, Auditor |
| Administration.Core.Rules.CreateEditDelete | Configuration | Write, test, set precedence, activate and retire rules | Administrators |
| Administration.Core.TransactionTypes.CreateEditDelete | Configuration | Define transaction types, parameter schemas and chains | Administrators |
| Administration.Core.Eligibility.CreateEditDelete | Configuration | Define eligibility rules, quotas and screening settings; review screening matches | Compliance |
| Administration.Core.Approvals.Act | Orders | Open and decide approval items assigned to the user | Administrators; roles named on approval steps |
| Administration.Core.Approvals.Configure | Configuration | Define approval chains, moderation queues, assignment rules and reason codes | Administrators |
| Administration.Core.WorkQueues.View | Orders | Open the operations console, work queues, operational order view and personal dashboard | Administrators, Operations |
| Administration.Core.Exceptions.CreateEditDelete | Orders | Act on exceptions, including bulk actions, and edit reason codes | Administrators, Operations |
| Administration.Core.Alerts.CreateEditDelete | Configuration | Define alert rules and acknowledge alerts | Administrators, Operations |
| Administration.Core.Templates.View | Configuration | View the template library, versions and usage analytics | Administrators |
| Administration.Core.Templates.CreateEditDelete | Configuration | Create, clone and change templates | Administrators |
| Administration.Core.Templates.Approve | Configuration | Approve template changes (never own changes) | Administrators |

Permissions are declared in the ADM plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). Native permissions are reused where they exist (Security.AccessAdminPanel, System.ManageScheduleTasks, System.ManageSystemLog, System.ManageMaintenance, Configuration.ManageSettings, Configuration.ManagePlugins, Configuration.ManageWidgets, Catalog.ProductsCreateEditDelete, Customers.CustomersCreateEditDelete). New system names use the plugin prefix Administration.Core and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is one of the native categories. Default roles are given by role system name. Every role name is in the IAM role catalogue (BR-IAM-050): Auditor, Operations, Compliance and PlatformOperator; IAM creates catalogue roles that are missing, and ADM relies on IAM for that. Acting on an approval item also requires the item's step to name one of the user's roles (BR-ADM-030). All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-ADM-PERM-01 | **Given** a user without Security.AccessAdminPanel (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-02 | **Given** a user without System.ManageScheduleTasks (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-03 | **Given** a user without Catalog.ProductsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-04 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-05 | **Given** a user without Administration.Core.Extensions.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-06 | **Given** a user without Administration.Core.Workflows.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-07 | **Given** a user without Administration.Core.Workflows.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-08 | **Given** a user without Administration.Core.Rules.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-09 | **Given** a user without Administration.Core.Rules.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-10 | **Given** a user without Administration.Core.TransactionTypes.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-11 | **Given** a user without Administration.Core.Eligibility.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-12 | **Given** a user without Administration.Core.Approvals.Act, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-13 | **Given** a user without Administration.Core.Approvals.Configure, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-14 | **Given** a user without Administration.Core.WorkQueues.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-15 | **Given** a user without Administration.Core.Exceptions.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-16 | **Given** a user without Administration.Core.Alerts.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-17 | **Given** a user without Administration.Core.Templates.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-18 | **Given** a user without Administration.Core.Templates.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-ADM-PERM-19 | **Given** a user without Administration.Core.Templates.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-ADM-001 | Admin settings, plugins, widgets, schedule tasks, logs, maintenance, product BulkEdit and DeleteSelected unchanged (Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:841). 5.00 adds Maintenance 'clear search history' and replaces Roxy Fileman with elFinder. | 'Archive' = bulk unpublish or soft delete; no separate archive status. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-002 | None (no workflow engine). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No workflow types in src/Libraries/Nop.Core/Domain or src/Libraries/Nop.Services] | Workflow designer/runtime (embedded .NET workflow library or custom), versioning, replay, step library. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |
| PRD-ADM-003 | Discount requirement rules are the only rule mechanism. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Discounts/IDiscountRequirementRule.cs] | Business rules engine with testing, conflict detection, precedence, change log, rule library. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-004 | Fixed-price sale native; bundled Misc.RFQ retained in 5.00 with QuoteStatus (Plugins/Nop.Plugin.Misc.RFQ/Domains/QuoteStatus.cs) and new quote PDF (Plugins/Nop.Plugin.Misc.RFQ/Services/Pdf/QuoteDocument.cs); new bundled Misc.PunchOut (cXML) session type. | Transaction-type registry with per-type parameter schema and chaining (e.g. RFQ then contract). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-005 | ACL by customer role (AclRecord on products/categories/manufacturers/topics), store mapping, customer-role discounts. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Security/AclRecord.cs; src/Libraries/Nop.Core/Domain/Security/IAclSupported.cs] | Eligibility rule sets, reserved quotas, sanctions-list screening (external list feed). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-006 | Approvals only for specific objects (vendor applications, product reviews IsApproved, blog/news comments). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/ProductReview.cs (IsApproved); src/Libraries/Nop.Core/Domain/Messages/MessageTemplateSystemNames (VendorAccountApply)] | Generic multi-step, conditional approval queues with reasons, conditions, resubmit/appeal. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-007 | Admin grids with filters; online customers list; no work queues or personal dashboards. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OnlineCustomerController.cs] | Operations console, queues, saved views, shortcuts, live counts, mobile view, Malawi Post ops view, per-operator dashboard. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-008 | Per-field upload limits unchanged (ValidationFileAllowedExtensions, ValidationFileMaximumSize; ReturnRequestSettings.ReturnRequestsFileMaximumSize). New elFinder admin file manager endpoint (Presentation/Nop.Web/Areas/Admin/Controllers/ElFinderController.cs). No antivirus scanning (not found in 5.00.1 source). | Central upload policy and antivirus scan hook (external AV engine) on all upload endpoints, including the new elFinder endpoint. | Custom plugin + External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-009 | System log (Log, LogLevel) only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Logging/Log.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/LogController.cs] | Exception queue with severity, reason codes, bulk actions, resolution history, root-cause detection. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-010 | Low-stock email alerts unchanged. New 5.00 AutoCancelOrdersTask auto-cancels unpaid orders after OrderSettings.AutoCancelDelay (Libraries/Nop.Services/Orders/AutoCancelOrdersTask.cs; OrderSettings.AutoCancelEnabled :184) and ProcessPendingOrdersTask sends customer reminders (Libraries/Nop.Services/Reminders/ProcessPendingOrdersTask.cs:54). No staff alerts for stuck orders or SLA breach. | Configurable operational alerts (stuck orders, SLA breach) via schedule task + TRK-005. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-011 | Multi-store with per-store settings, themes, message templates; no transaction-template library. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Stores; src/Libraries/Nop.Core/Domain/Messages/MessageTemplate.LimitedToStores] | Versioned template library with inheritance, copy, approval; client admin workspace. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-ADM-012 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No template entity in src/Libraries/Nop.Core/Domain] | Template usage analytics and shared cross-client library. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: depends on ADM-011 |


## 7. Feature specifications


### 7.1 PRD-ADM-001 Administration console

| Item | Value |
|---|---|
| Description (baseline) | The back-office control panel for settings, add-ons, page widgets, scheduled jobs, system logs, maintenance, products and customers. Staff can change details or status for many products at once and archive products in bulk. |
| Why it matters | Staff run the shop day to day. |
| Who benefits | Client administrators |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-001-01 | As a client administrator, I want one back office for settings, add-ons, page widgets, scheduled jobs, system logs, maintenance, products and customers, so that staff run the shop day to day. | D; REQ-MPC-FR-301 | Ready; conditions: OVR-REG, SINGLE-FILTER |
| US-ADM-001-02 | As a catalogue manager, I want to change details or status of many products at once and archive products in bulk, so that catalogue work at scale is fast. | D; FC-M04-021 | Ready; conditions: OVR-REG, SINGLE-FILTER |
| US-ADM-001-03 | As a client administrator, I want to suspend and reactivate customer accounts and to process deletion requests, so that problem accounts and privacy requests are handled. | FC-M04-022 | Ready; conditions: OVR-REG, SINGLE-FILTER |
| US-ADM-001-04 | Technical enabler. As a member of the platform team, I want one register of every nopCommerce service override and global action filter the product installs, checked at start, so that two plugins never silently replace the same core service. | Proposed; FIT (L1 section 6.2 principle 7) | Ready; conditions: OVR-REG, SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-001-01-01 | US-ADM-001-01 | **Given** a user holds Security.AccessAdminPanel and the native permission of each area, **when** they open Configuration > Settings, Plugins and Widgets, System > Schedule tasks, Log and Maintenance, Catalog > Products and Customers, **then** each area opens; an area whose native permission the user lacks is denied (CheckPermission attribute). | D; REQ-MPC-FR-301; FIT (SettingController, PluginController, WidgetController, ScheduleTaskController, LogController, CommonController.Maintenance) |
| AC-ADM-001-01-02 | US-ADM-001-01 | **Given** a scheduled task exists, **when** an administrator with System.ManageScheduleTasks edits its interval (Seconds), Enabled or StopOnError, or runs it now, **then** the change applies to the whole installation (ScheduleTask has no store scope) and LastStartUtc, LastEndUtc and LastSuccessUtc show the result. | REQ-MPC-FR-301; FIT (ScheduleTask) |
| AC-ADM-001-02-01 | US-ADM-001-02 | **Given** products are selected in the bulk-edit grid, **when** the catalogue manager changes Name, Sku, Price, OldPrice, Quantity or IsPublished and saves, **then** every selected product is updated in one save (native ProductController.BulkEditSave). | D; FIT (5.00.1: Admin ProductController.BulkEdit, BulkEditSave, Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:972, 983) |
| AC-ADM-001-02-02 | US-ADM-001-02 | **Given** products are selected, **when** the catalogue manager archives them, **then** they are unpublished (IsPublished false) and disappear from the storefront but stay in admin; deletion (DeleteSelected) is a separate soft delete (Product.Deleted). | D; FIT (no separate archive status; ProductController.DeleteSelected) |
| AC-ADM-001-03-01 | US-ADM-001-03 | **Given** a customer account is active, **when** an administrator deactivates it (Customer.Active false) with a reason, **then** the customer can no longer sign in and the reason is recorded (AUD-ADM-001); reactivation restores sign-in. | FC-M04-022; FIT (Customer.Active) |
| AC-ADM-001-03-02 | US-ADM-001-03 | **Given** a customer asks for deletion, **when** an administrator with Customers.GDPRManage processes it, **then** the native GDPR delete runs; consent and privacy rules are those of SEC-007. | FC-M04-022; FIT (StandardPermission Customers.GDPRManage) |
| AC-ADM-001-04-01 | US-ADM-001-04 | **Given** product plugins register DI overrides (INopStartup Order >= 3000), decorators and global action or result filters, **when** the application starts, **then** the ADM INopStartup, which runs after every other product plugin startup (Proposed), reads the IServiceCollection; for each interface in the register it lists the implementation registered by a product plugin; if an interface has more than one product implementation, or an implementation from a plugin that is not its registered owner, the conflict is recorded and shown on System > Warnings through an ADM consumer of SystemWarningCreatedEvent (BR-ADM-001). | Proposed; OVR-REG; FIT (INopStartup.ConfigureServices receives IServiceCollection; SystemWarningCreatedEvent published by Admin CommonModelFactory, Presentation/Nop.Web/Areas/Admin/Factories/CommonModelFactory.cs:1027 in 5.00.1) |
| AC-ADM-001-04-02 | US-ADM-001-04 | **Given** the register is opened by a user with Administration.Core.Extensions.View, **when** it is shown, **then** every entry of BR-ADM-002 to BR-ADM-008 is listed with target (interface and method, or controller and action), mechanism (DI override, decorator, action filter, result filter, middleware, model-factory override, core modification), owning feature, provider features and the rule that specifies it. | OVR-REG; Proposed |
| AC-ADM-001-04-03 | US-ADM-001-04 | **Given** a feature needs to change the behaviour of a service whose owner in the register is another feature (for example ADM-005 quota checks on IShoppingCartService, owned by CHK-003), **when** the feature is built, **then** it implements the provider interface published by the owner (for example IC-CHK-01) and registers no implementation of the service itself; a build that registers one is shown as a conflict by the start-up check. | OVR-REG; Proposed |
| AC-ADM-001-04-04 | US-ADM-001-04 | **Given** several product plugins register global action filters on the same controller action (for example Admin OrderController.AddShipment: PAY, INV and LOG), **when** the action is requested, **then** the filters run in the order recorded in the register (filter order value, Proposed), each can refuse the request independently, and a refusal by any filter stops the action before it runs (BR-ADM-005). | Proposed; FIT (ASP.NET Core global filter order) |
| AC-ADM-001-04-05 | US-ADM-001-04 | **Given** the bundled Misc.Brevo plugin, which replaces IWorkflowMessageService (BrevoMessageService, NopStartup Order 3000), is installed in an instance where TRK-005 owns IWorkflowMessageService, **when** the start-up check runs, **then** a conflict is shown; client instances do not install Misc.Brevo (BR-ADM-003). | OVR-REG; FIT (Plugins/Nop.Plugin.Misc.Brevo/Infrastructure/NopStartup.cs) |
| AC-ADM-001-04-06 | US-ADM-001-04 | **Given** an action whose decision has one owner in the register (Admin CustomerController.Impersonate: IAM-026; Nop.Web DownloadController.GetFileUpload and Admin DownloadController.DownloadFile: SEC-002; every upload action: ADM-008), **when** another feature needs to change who is allowed or which files are accepted (for example CRM-015 account managers on impersonation, EGV-002 agency files on downloads, EGV-002 or CAT upload types), **then** it supplies a rule to the owner (a rule provider of the owner filter, or an upload context through IC-ADM-08) and registers no action filter of its own on that action; the register shows the owner and its rule providers (BR-ADM-001, BR-ADM-006, BR-ADM-007), and the release check (T-ADM-09) fails on a second filter. | SINGLE-FILTER; OVR-REG |

**Business rules applied:** BR-ADM-001; BR-ADM-002; BR-ADM-003; BR-ADM-004; BR-ADM-005; BR-ADM-006; BR-ADM-007; BR-ADM-008; BR-ADM-080 (§8.1).


### 7.2 PRD-ADM-002 Workflow engine

| Item | Value |
|---|---|
| Description (baseline) | A visual tool to design business processes (for example approvals) as steps with branches and parallel paths, test them, keep versions, and replay how a past case moved through the steps. Processes are built from a library of ready-made steps such as approval, notification, document creation, payment release and a call to another system. |
| Why it matters | Clients change their processes by configuration instead of new code. |
| Who benefits | Client administrators; platform team |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-002-01 | As a client administrator, I want to design a business process as steps with branches and parallel paths, so that processes change by configuration instead of new code. | D; FC-M02-014; FC-M02-016; FC-M02-017 | On hold: WF-ENG |
| US-ADM-002-02 | As a client administrator, I want to build processes from ready-made steps: approval, notification, document creation, payment release and a call to another system, so that common steps are reused. | D; FC-M02-015 | On hold: WF-ENG |
| US-ADM-002-03 | As a client administrator, I want to test a process with sample data before publishing it, so that I see where it would block before it goes live. | D; FC-M02-018 | On hold: WF-ENG |
| US-ADM-002-04 | As a client administrator, I want processes to have versions so that running cases finish on the version they started with, so that changes never break cases in progress. | D; FC-M02-019 | On hold: WF-ENG |
| US-ADM-002-05 | As an auditor, I want to replay how a past case moved through the steps, so that disputes and audits can be answered. | D; FC-M02-020 | On hold: WF-ENG |
| US-ADM-002-06 | As an operations manager, I want internal approval stages, the shipping workflow and the fulfilment processes to run as configured workflows, so that our processes follow our own stages. | REQ-KTDA-WF-004; REQ-KTDA-WF-005; REQ-KTDA-WF-007 | On hold: WF-ENG |
| US-ADM-002-07 | As an e-government service administrator, I want each service catalogue entry to use a configured workflow, so that each service follows its own process. | REQ-MPC-FR-307 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-002-01-01 | US-ADM-002-01 | **Given** a definition with a start, task steps, exclusive and parallel gateways and ends, **when** it is published, **then** it is accepted only if every path reaches an end, every exclusive gateway has a default path and every parallel join matches its split; otherwise publishing is refused with message Adm.WorkflowInvalid naming the faulty element (BR-ADM-010). | D; FC-M02-016; FC-M02-017 |
| AC-ADM-002-01-02 | US-ADM-002-01 | **Given** a case reaches an exclusive gateway, **when** its conditions are evaluated (ADM-003 expressions over case variables) in their set order, **then** exactly one outgoing path is taken: the first whose condition is true, else the default path. | FC-M02-016 |
| AC-ADM-002-01-03 | US-ADM-002-01 | **Given** a case reaches a parallel split, **when** it continues, **then** all outgoing branches become active; the matching join continues only when every incoming branch has arrived. | FC-M02-017 |
| AC-ADM-002-01-04 | US-ADM-002-01 | **Given** a definition is saved, **when** it is exported, **then** it is exported and imported as BPMN 2.0 XML; if WF-ENG selects an engine without BPMN 2.0 support this criterion is re-decided. | FC-M02-014 |
| AC-ADM-002-02-01 | US-ADM-002-02 | **Given** a case reaches an approval step naming a role and an authority limit, **when** the step starts, **then** an ADM-006 approval item is created for that role; the case waits until the item is decided and then follows the approved or rejected path. | D; FC-M02-015 |
| AC-ADM-002-02-02 | US-ADM-002-02 | **Given** a case reaches a notification step with an event code, **when** the step runs, **then** the notification is sent through the TRK-005 notification engine for that event code (IC-TRK-04 SendEvent) and the step completes; a definition naming an event code that is not registered with TRK-005 (IC-TRK-04 RegisterEventCode) is refused at publishing with message Adm.WorkflowInvalid (BR-ADM-085). | D; FC-M02-015 |
| AC-ADM-002-02-03 | US-ADM-002-02 | **Given** a case reaches a document step with a template code, **when** the step runs, **then** DOC-001 generates the document from the case record, DOC-002 stores it and its reference is added to the case variables. | D; FC-M02-015 |
| AC-ADM-002-02-04 | US-ADM-002-02 | **Given** a case reaches a payment-release step, **when** the step runs, **then** the step calls the release operation exposed by PAY for that case (for example an escrow stage release, PAY-007) and waits for its result; the workflow never changes payment or order state itself (BR-ADM-011). | D; FC-M02-015 |
| AC-ADM-002-02-05 | US-ADM-002-02 | **Given** a case reaches a call-to-another-system step, **when** the step runs, **then** it calls the named operation of the step-operation catalogue — an INT adapter operation (INT-005) or a module connector operation that its owning module registered through IC-ADM-01 RegisterStepOperation (for example EGV IC-EGV-02 VerifyOrRegister) — with the configured timeout and retry count; after the last failed retry the case status becomes Failed and an ADM-009 exception is raised; an operation not in the catalogue cannot be named, and publishing is refused with message Adm.WorkflowInvalid. | D; FC-M02-015; Proposed |
| AC-ADM-002-02-06 | US-ADM-002-02 | **Given** an AI summarisation step is in a definition (FC-M02-015), **when** the AI pack is off for the client (PLT-022), **then** publishing is refused with message Adm.WorkflowStepUnavailable. | FC-M02-015; Proposed |
| AC-ADM-002-03-01 | US-ADM-002-03 | **Given** a draft definition and a sample data set, **when** the administrator runs the simulator, **then** the path taken, the step where it would wait or block and the outputs of each step are shown; no notification is sent, no document stored, no external call made and no payment step executed (BR-ADM-012). | D; FC-M02-018 |
| AC-ADM-002-04-01 | US-ADM-002-04 | **Given** cases are running on version 1, **when** version 2 is published, **then** running cases continue on version 1 and new cases start on version 2. | D; FC-M02-019 |
| AC-ADM-002-05-01 | US-ADM-002-05 | **Given** a case has completed or failed, **when** an auditor opens the replay, **then** each executed step is shown in order with time, actor, inputs, outputs and gateway decisions; the replay is read-only and changes nothing. | D; FC-M02-020 |
| AC-ADM-002-06-01 | US-ADM-002-06 | **Given** an approval workflow with several sequential internal approval stages is published for a document or order type, **when** an item of that type is submitted, **then** it passes each stage in order and continues only after every stage approves; a rejection at any stage stops it (with ADM-006). | REQ-KTDA-WF-004 |
| AC-ADM-002-06-02 | US-ADM-002-06 | **Given** a shipping workflow is bound to the native shipment events, **when** a shipment is created, sent or delivered (ShipmentCreatedEvent, ShipmentSentEvent, ShipmentDeliveredEvent), **then** the event consumer only enqueues a start or signal request and the engine runner starts or advances the shipping case (BR-ADM-011). | REQ-KTDA-WF-005; FIT (native shipment events; EventPublisher swallows consumer exceptions) |
| AC-ADM-002-06-03 | US-ADM-002-06 | **Given** a fulfilment workflow is bound to order events, **when** an order is placed or paid (OrderPlacedEvent, OrderPaidEvent), **then** a fulfilment case is started through the queue and runs its configured steps, calling LOG services for allocation, picking and dispatch. | REQ-KTDA-WF-007; FIT (OrderPlacedEvent, OrderPaidEvent) |
| AC-ADM-002-07-01 | US-ADM-002-07 | **Given** an e-government service catalogue entry (EGV-001) references a published workflow definition, **when** a citizen or business submits an application for that service (EGV-002), **then** the application runs as a case of that definition. | REQ-MPC-FR-307 |
| AC-ADM-002-01-05 | US-ADM-002-01 | **Given** a start request carries an idempotency key, **when** the same request is received again, **then** no second case is started (BR-ADM-011). | Proposed |
| AC-ADM-002-07-02 | US-ADM-002-07 | **Given** a workflow definition is assigned to a service product (EGV-001) and applications have already been submitted on version 1, **when** version 2 of the definition is published, **then** applications already submitted continue on version 1; applications submitted after publication start on version 2 (version pinning per case, as AC-ADM-002-04-01). | REQ-MPC-FR-307; Proposed |
| AC-ADM-002-07-03 | US-ADM-002-07 | **Given** an EGV definition has an "External check" step naming an EGV connector operation (IC-EGV-02 VerifyOrRegister) and a parallel split of pre-approval steps before its approval step, **when** a case reaches the step and then the join, **then** the External check step calls IC-EGV-02 through the EGV service with the configured timeout and retry count and stores the result and external reference in the case variables; the approval step starts only when every pre-approval branch has completed (parallel join, AC-ADM-002-01-03), so EGV approval waits for all pre-approval steps (BR-EGV-005). | REQ-MPC-FR-307; Proposed |

**Business rules applied:** BR-ADM-010; BR-ADM-011; BR-ADM-012; BR-ADM-085 (§8.1).


### 7.3 PRD-ADM-003 Business rules engine

| Item | Value |
|---|---|
| Description (baseline) | A place to write and test business rules (for example 'orders over X need approval'), which detects conflicting rules, sets which rule wins, and records changes. Rules can be started from a library of ready-made, categorised rule patterns, and every time a rule is applied the inputs, the result and the rule version are logged. |
| Why it matters | Business rules change without developers. |
| Who benefits | Client administrators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-003-01 | As a client administrator, I want to write business rules — for example "orders over a set amount need approval" — in a constrained rule language without code, so that rules change without developers. | D; FC-M02-021 | Ready |
| US-ADM-003-02 | As a client administrator, I want to start rules from a library of categorised patterns, so that common rules are quick to set up. | D; FC-M02-022 | Ready |
| US-ADM-003-03 | As a client administrator, I want to test rules against sample data before activating them, so that I know which inputs pass, which fail and why. | D; FC-M02-023 | Ready |
| US-ADM-003-04 | As a client administrator, I want conflicting rules to be detected and a precedence order set, so that the right rule wins. | D; FC-M02-024; FC-M02-025 | Ready |
| US-ADM-003-05 | As an auditor, I want every rule evaluation logged with its inputs, result, rule version and time, so that decisions can be audited later. | D; FC-M02-026 | Ready |
| US-ADM-003-06 | As an auditor, I want every change to a rule recorded, so that rule changes are traceable. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-003-01-01 | US-ADM-003-01 | **Given** a rule set declared by an owning module with its fact schema (for example Order.Total, Customer.Roles), **when** an administrator writes a rule as a condition (comparison, logical, arithmetic and set operators over declared facts) and an outcome, **then** the rule is saved as a draft; the language offers no code execution, reflection, file, network or database access (BR-ADM-020). | D; FC-M02-021 |
| AC-ADM-003-01-02 | US-ADM-003-01 | **Given** a rule refers to an undeclared fact or has a syntax error, **when** it is saved, **then** it is refused with message Adm.RuleInvalid giving the position of the error. | FC-M02-021; Proposed |
| AC-ADM-003-01-03 | US-ADM-003-01 | **Given** an active rule "Order.Total greater than A gives outcome RequireApproval", with A a client value, **when** a module evaluates the rule set for an order whose total is above A, **then** the outcome RequireApproval is returned with the rule ID and version; for a total not above A the default outcome is returned. | D |
| AC-ADM-003-02-01 | US-ADM-003-02 | **Given** the pattern library holds patterns in the categories eligibility, pricing, validation and routing, **when** an administrator creates a rule from a pattern, **then** a draft copy is created with the pattern's parameters to fill in; the pattern itself is unchanged. | D; FC-M02-022 |
| AC-ADM-003-03-01 | US-ADM-003-03 | **Given** a draft rule and a set of sample inputs, **when** the administrator runs the test, **then** each input is shown as pass or fail with the conditions that matched; no entry is written to the production evaluation log and no outcome is acted on. | D; FC-M02-023 |
| AC-ADM-003-04-01 | US-ADM-003-04 | **Given** two rules of the same rule set both match at least one input of the rule set's test data and give different outcomes, **when** one of them is activated, **then** activation is refused with message Adm.RuleConflict naming both rules, until a precedence order is set or a rule is changed (BR-ADM-021). | D; FC-M02-024 |
| AC-ADM-003-04-02 | US-ADM-003-04 | **Given** a rule set uses the strategy "first match by priority", **when** several active rules match an input, **then** only the outcome of the highest-priority matching rule is returned; with the strategy "all matches" every matching outcome is returned in priority order. | D; FC-M02-025 |
| AC-ADM-003-05-01 | US-ADM-003-05 | **Given** a rule set is evaluated in production, **when** the evaluation completes, **then** a log entry holds rule set, matched rule IDs and versions, inputs (fields classified as personal or secret are masked: per SEC-014 when it is delivered, otherwise by replacing the value with "[masked]" for every input field flagged personal or secret in the rule-set definition, Proposed), outcome, time and caller reference; log retention follows PLT-020. | D; FC-M02-026 |
| AC-ADM-003-06-01 | US-ADM-003-06 | **Given** an active rule is edited, **when** it is saved, **then** a new draft version is created; the active version stays in force until the new version is activated; who, when, old and new expression are audited (AUD-ADM-003). | D; Proposed |

**Business rules applied:** BR-ADM-020; BR-ADM-021 (§8.1).


### 7.4 PRD-ADM-004 Transaction types and parameter schema

| Item | Value |
|---|---|
| Description (baseline) | Defines the types of transaction the platform supports (for example fixed-price sale or request for quotation) and the information each type needs. Two transaction types can be combined in one transaction, for example a request for quotation followed by a contract. |
| Why it matters | New ways of trading are set up by configuration. |
| Who benefits | Platform team; client administrators |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-003 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-004-01 | Technical enabler. As a member of the platform team, I want to define the types of transaction the platform supports and the information each type needs, so that new ways of trading are set up by configuration. | D; FC-M02-004; FC-M02-001 | Ready |
| US-ADM-004-02 | As an operator, I want to pick the type when I start a transaction and have the fields, workflow and documents adapt, so that each transaction follows its type. | FC-M02-002 | Ready |
| US-ADM-004-03 | As an operator, I want to combine two types in one transaction, for example a request for quotation followed by a contract, so that multi-stage deals stay one record. | D; FC-M02-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-004-01-01 | US-ADM-004-01 | **Given** the product ships the type registry, **when** it is opened, **then** it lists fixed-price sale (native Product and Order), request for quotation (bundled Misc.RFQ: RequestQuote, Quote, Order), contract (ORD-016), group buying (ORD-023) and scheme application (ORD-024), each with owning module, parameter schema, workflow binding (ADM-002), required documents (DOC-005) and templates (ADM-011); auction and tender types are not offered (D-02). | D; FC-M02-001; FIT (Misc.RFQ Domains RequestQuote, Quote, QuoteStatus); D-02 |
| AC-ADM-004-01-02 | US-ADM-004-01 | **Given** a parameter of a type is marked Required, Optional or Fixed with a data type and allowed values, **when** a transaction of that type is created without a required parameter, **then** creation is refused with message Adm.ParameterRequired. | D; FC-M02-004 |
| AC-ADM-004-01-03 | US-ADM-004-01 | **Given** a parameter is Fixed at type level, **when** a user tries to change it on a transaction, **then** the change is refused with message Adm.ParameterFixed. | FC-M02-004 |
| AC-ADM-004-02-01 | US-ADM-004-02 | **Given** the operator starts a new transaction, **when** they choose a type, **then** the form shows that type's parameters, the case starts on the type's workflow and the type's document requirements apply. | FC-M02-002 |
| AC-ADM-004-03-01 | US-ADM-004-03 | **Given** a chain "request for quotation, then contract" is defined with a parameter mapping, **when** the quote is accepted (Misc.RFQ quote converted), **then** a contract transaction (ORD-016) is created with the mapped values and linked to the quote; both appear as one chained transaction. | D; FC-M02-003; FIT (Misc.RFQ QuoteStatus) |
| AC-ADM-004-02-02 | US-ADM-004-02 | **Given** a transaction overrides a type parameter, **when** it is saved, **then** a reason is required and the override is recorded as a PLT deviation (see PLT-003 rule BR-PLT-017). | D; Proposed |

**Business rules applied:** BR-ADM-040 (§8.1).


### 7.5 PRD-ADM-005 Eligibility and quota rules

| Item | Value |
|---|---|
| Description (baseline) | Rules for who may see, buy or take part in something, reserved quotas, and screening against sanctions lists. |
| Why it matters | Supports programmes with eligibility rules. |
| Who benefits | Programme and compliance staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEL-013 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-005-01 | As a member of compliance staff, I want rules for who may see, buy or take part in something, so that programmes reach only eligible customers. | D; FC-M02-027 | Ready; conditions: OVR-REG |
| US-ADM-005-02 | As a member of compliance staff, I want to reserve a quota of a product or programme for a defined group, so that policy categories get their share. | D; FC-M02-028 | Ready; conditions: OVR-REG |
| US-ADM-005-03 | As a member of compliance staff, I want customers screened against sanctions lists where the client's jurisdiction requires it, so that we do not trade with sanctioned parties. | D; FC-M02-031 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-005-01-01 | US-ADM-005-01 | **Given** an eligibility rule set (ADM-003) is bound to a customer role, **when** a customer's profile changes, or the nightly recomputation task runs, **then** the customer is added to or removed from that role according to the rule outcome, and native ACL (AclRecord by customer role) then decides which products, categories and topics the customer sees (BR-ADM-050). | D; FC-M02-027; FIT (AclRecord, IAclSupported) |
| AC-ADM-005-01-02 | US-ADM-005-01 | **Given** a product is restricted to an eligibility role, **when** a customer outside the role tries to add it to the cart by direct link, **then** the ADM cart rule provider (IC-CHK-01, called by the CHK-003 IShoppingCartService override) returns warning Adm.NotEligible and the item is not added. | FC-M02-027; Proposed; OVR-REG |
| AC-ADM-005-02-01 | US-ADM-005-02 | **Given** a quota reserves a quantity of a product for a customer role over a period, **when** a customer outside that role adds a quantity that would use the reserved part, **then** the ADM cart rule provider (IC-CHK-01) returns warning Adm.QuotaReserved through the CHK-003 IShoppingCartService override and the quantity is not added; ADM registers no IShoppingCartService implementation of its own (BR-ADM-002); the same check runs again at order placement because PlaceOrderAsync calls GetShoppingCartItemWarningsAsync. | D; FC-M02-028; OVR-REG; FIT (OrderProcessingService.PlaceOrderAsync calls GetShoppingCartWarningsAsync and GetShoppingCartItemWarningsAsync) |
| AC-ADM-005-02-02 | US-ADM-005-02 | **Given** two customers place orders for the last reserved units at the same moment, **when** both orders are placed, **then** ADM is a placement participant (IC-CHK-06) of the CHK-003 PlaceOrderAsync override: in Reserve it re-checks the quota under ILocker key 'adm-quota-{quotaId}' and reserves the quantity, or refuses placement with message Adm.QuotaReserved; Confirm consumes the reservation per saved sub-order; Release frees it when placement or payment fails (BR-CHK-020); so only one of the two orders gets the last reserved units. | Proposed; FIT (ILocker.PerformActionWithLockAsync); see CHK-004 |
| AC-ADM-005-03-01 | US-ADM-005-03 | **Given** sanctions screening is enabled for a customer type, **when** a customer of that type registers or places an order, **then** the party is screened through the sanctions-screening adapter; on a possible match the account is flagged, checkout is blocked with message Adm.ScreeningHold and a review item is created (ADM-006). | D; FC-M02-031 |
| AC-ADM-005-03-02 | US-ADM-005-03 | **Given** a reviewer clears or confirms a match, **when** they decide, **then** cleared: the flag is removed and checkout works; confirmed: the customer is added to the SEL-013 block list; both are audited (AUD-ADM-005). | FC-M02-031; Proposed |

**Business rules applied:** BR-ADM-050 (§8.1).


### 7.6 PRD-ADM-006 Approval queues

| Item | Value |
|---|---|
| Description (baseline) | Each approver sees a queue of items waiting for them; approvals can have several steps or depend on conditions, and rejections need a reason. An approval can carry conditions (corrections to make), which are tracked; when something is rejected, the person sees the reason and what they can do next, such as correct and resubmit or appeal. |
| Why it matters | Approvals are fast, visible and traceable. |
| Who benefits | Approvers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-006-01 | As an approver, I want a queue of the items waiting for me, limited to my role, authority and delegations, so that I see only what I may approve. | D; FC-M04-016 | On hold: WF-ENG |
| US-ADM-006-02 | As a client administrator, I want approvals with several steps or steps that apply only under conditions, so that approvals follow our chain of authority. | D; FC-M04-017; REQ-KTDA-WF-004 | On hold: WF-ENG |
| US-ADM-006-03 | As an approver, I want to approve subject to corrections and have the corrections tracked, so that approval takes effect only when the corrections are done. | D; FC-M04-018 | On hold: WF-ENG |
| US-ADM-006-04 | As an approver, I want to reject with a reason, and the requester to see the reason and what they can do next, so that rejections are fair and actionable. | D; FC-M04-019 | On hold: WF-ENG |
| US-ADM-006-05 | As a member of compliance staff, I want high-risk actions such as payout account changes to need approval with an audit trail, so that fraud through account changes is stopped. | REQ-MPC-FR-039 | On hold: WF-ENG |
| US-ADM-006-06 | As a client administrator, I want to configure product and seller moderation queues and how items are assigned, so that moderation work is shared and controlled. | REQ-MPC-FR-319 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-006-01-01 | US-ADM-006-01 | **Given** approval items exist for several roles and authority limits, **when** an approver opens the queue, **then** only items whose current step names one of the approver's roles, whose amount is within the approver's authority limit, or that are delegated to the approver (IAM-009) are listed (BR-ADM-030). | D; FC-M04-016 |
| AC-ADM-006-01-02 | US-ADM-006-01 | **Given** an item is not assigned to the user, **when** the user opens it by direct link, **then** access is denied and nothing changes. | FC-M04-016 |
| AC-ADM-006-02-01 | US-ADM-006-02 | **Given** a chain has steps 1 and 2, **when** step 1 approves, **then** the item moves to step 2; the chain and the current step are shown on the item; it is approved only when the last step approves. | D; FC-M04-017; REQ-KTDA-WF-004 |
| AC-ADM-006-02-02 | US-ADM-006-02 | **Given** a step has a condition (ADM-003 rule, for example amount above a client threshold), **when** the item reaches that step, **then** the step is included only if the condition is true, otherwise it is skipped and the skip is recorded. | D; FC-M04-017 |
| AC-ADM-006-02-03 | US-ADM-006-02 | **Given** the requester, or a user who decided an earlier step of the same item, opens the item, **when** they try to approve, **then** the action is refused with message Adm.ApproveOwnItem (BR-ADM-030). | Proposed |
| AC-ADM-006-03-01 | US-ADM-006-03 | **Given** an approver approves with conditions, **when** they list the corrections, **then** the item becomes ApprovedWithConditions; the owning module is not told to apply the approval until the requester marks every correction done and the approver confirms (SM-ADM-04). | D; FC-M04-018 |
| AC-ADM-006-04-01 | US-ADM-006-04 | **Given** an approver rejects, **when** no reason code is chosen, **then** the rejection is refused with message Adm.ReasonRequired; with a reason code and text the item becomes Rejected and the requester is notified (TRK-005) with the reason and the recourse options (correct and resubmit, appeal). | D; FC-M04-019 |
| AC-ADM-006-04-02 | US-ADM-006-04 | **Given** an item is Rejected, **when** the requester resubmits after correcting it, **then** a new round of the same item starts at step 1 and the history of earlier rounds is kept. | D |
| AC-ADM-006-04-03 | US-ADM-006-04 | **Given** an item is Rejected, **when** the requester appeals, **then** the item goes to the appeal step of the chain (an approver role other than the one that rejected); the appeal outcome is final. | D; Proposed |
| AC-ADM-006-05-01 | US-ADM-006-05 | **Given** a seller changes the payout account (SEL-005), **when** the change is submitted, **then** an approval item is created through IC-ADM-03; the old account stays in use until the item is approved; every decision is written to the audit trail (AUD-ADM-004). | REQ-MPC-FR-039 |
| AC-ADM-006-05-02 | US-ADM-006-05 | **Given** a module registers another action as high-risk, **when** that action is requested, **then** it follows the same approval flow. | REQ-MPC-FR-039; Proposed |
| AC-ADM-006-06-01 | US-ADM-006-06 | **Given** moderation queues are configured for product listings (CAT-022, CAT-043) and seller applications (SEL-003) with an assignment rule (round robin among role members, or by category, or by seller tier), **when** a new item enters a queue, **then** it is assigned to a member by that rule and appears in that member's queue. | REQ-MPC-FR-319 |
| AC-ADM-006-01-03 | US-ADM-006-01 | **Given** an approval item is decided, **when** the decision is recorded, **then** the owning module's callback (IC-ADM-03) applies the effect through the module's own service; ADM never changes the object itself (BR-ADM-011). | Proposed |
| AC-ADM-006-01-04 | US-ADM-006-01 | **Given** the owning module of an item's object type implements the pre-decision guard (IC-ADM-03 CanDecide; for example SEL-003 seller-application guards, Sel.ApprovalBlocked), **when** an approver approves, approves with conditions, or confirms that conditions are done, **then** ADM calls the guard before it records the decision; if the guard refuses, nothing is recorded, the item stays in its current status (SM-ADM-04) and message Adm.DecisionBlocked shows the module's reason; rejection is not guarded (BR-ADM-031). | Proposed (SEL round-2 mismatch: decided ADM item with an unchanged SEL object) |

**Business rules applied:** BR-ADM-030; BR-ADM-031; BR-ADM-011; BR-ADM-085 (§8.1).


### 7.7 PRD-ADM-007 Operations console and work queues

| Item | Value |
|---|---|
| Description (baseline) | Work queues for operations staff, tracking of unfinished work, saved views, keyboard shortcuts, live counts of active users, a mobile version, and a Malawi Post operations view. Each operator also has a personal dashboard of their own queues, alerts and figures, arranged to suit their role. |
| Why it matters | Operations staff work efficiently. |
| Who benefits | Operations staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-007-01 | As a member of operations staff, I want one console where I switch between approval, exception, dispute and audit queues without losing my place, so that I work through queues efficiently. | D; FC-M04-002 | Ready |
| US-ADM-007-02 | As a member of operations staff, I want an operational view of orders needing pickup, sorting, dispatch and last-mile delivery actions, so that no order is forgotten at any stage. | D; REQ-MPC-FR-162 | Ready |
| US-ADM-007-03 | As a member of operations staff, I want a personal dashboard of my queues, alerts and figures arranged for my role, so that I see my work at a glance. | D; FC-M04-001 | Ready |
| US-ADM-007-04 | As a member of operations staff, I want to save my filters as named views, so that I return to common lists in one click. | D; FC-M04-005 | Ready |
| US-ADM-007-05 | As a member of operations staff, I want work I started and did not finish kept across sessions, so that I do not lose partial work. | D; FC-M04-003 | Ready |
| US-ADM-007-06 | As an experienced operator, I want keyboard shortcuts for common console actions, so that I work without the mouse. | D; FC-M04-004 | Ready |
| US-ADM-007-07 | As a member of operations staff, I want a live count of active users, so that I see current load. | D; FC-M04-010 | Ready |
| US-ADM-007-08 | As a field operator, I want the console to work on a tablet or phone, so that I can work away from a desk. | D; FC-M04-025 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-007-01-01 | US-ADM-007-01 | **Given** the user holds Administration.Core.WorkQueues.View and the permission of each queue, **when** they switch between the queue tabs, **then** each tab keeps its filters and scroll position for the session; a queue whose permission the user lacks is not shown. | D; FC-M04-002 |
| AC-ADM-007-02-01 | US-ADM-007-02 | **Given** orders exist in different fulfilment stages, **when** an operator opens the operational order view, **then** orders are grouped by stage — awaiting pickup, awaiting sorting, awaiting dispatch, out for last-mile delivery — with counts, filters by branch or outlet, and a link to the owning LOG action; the stage of each order is the operational stage that ORD supplies (OrderStageDefinition.OperationalStage, with the LOG shipment stage or the native shipment dates as fallback, BR-ORD-015), and the stage of each open shipment is the one LOG supplies (IC-LOG-07 GetOperationalStage, BR-LOG-170); ADM derives no stage itself. | REQ-MPC-FR-162; FIT (Shipment; ShippingStatus); see ORD-002, LOG-011 |
| AC-ADM-007-03-01 | US-ADM-007-03 | **Given** an operator arranges dashboard tiles from the tiles allowed for their role, **when** they sign in again, **then** the same arrangement is shown; tiles show only data the operator may see. | D; FC-M04-001 |
| AC-ADM-007-04-01 | US-ADM-007-04 | **Given** an operator saves the current filter as a named view, **when** they open the view later, **then** the list shows the same filter applied to current data. | D; FC-M04-005 |
| AC-ADM-007-05-01 | US-ADM-007-05 | **Given** an operator leaves a form with unsaved changes in an ADM screen, **when** they come back in a later session, **then** the draft is offered for restore; drafts are kept per user and deleted after the retention period (setting, default not stated). | D; FC-M04-003 |
| AC-ADM-007-06-01 | US-ADM-007-06 | **Given** shortcuts are enabled, **when** an operator presses the shortcut for open queue, approve, reject, comment, escalate or search, **then** the action runs as if its button was pressed, with the same permission checks and confirmations. | D; FC-M04-004 |
| AC-ADM-007-07-01 | US-ADM-007-07 | **Given** customers were active within CustomerSettings.OnlineCustomerMinutes, **when** the console header is shown, **then** it shows the count of online customers (native online-customer data). | D; FIT (OnlineCustomerController; CustomerSettings.OnlineCustomerMinutes) |
| AC-ADM-007-08-01 | US-ADM-007-08 | **Given** the console is opened at tablet and phone widths, **when** an operator works a queue, **then** all queue actions are usable without horizontal scrolling. | D; FC-M04-025 |
| AC-ADM-007-01-02 | US-ADM-007-01 | **Given** a work-queue item (approval item, exception, or a queue item raised by another module) is assigned, completed or reopened, **when** the change is saved, **then** a WorkItemEvent records item, queue, event (Assigned, Completed, Reopened), assignee, actor and time; the events are readable by RPT-009 for operator productivity and service-level metrics (BR-ADM-075). | Proposed (RPT-009 operator metrics) |

**Business rules applied:** BR-ADM-075 (§8.1).


### 7.8 PRD-ADM-008 Upload and content scanning controls

| Item | Value |
|---|---|
| Description (baseline) | Controls which file types and sizes can be uploaded and scans uploads for viruses. |
| Why it matters | Protects the system from harmful files. |
| Who benefits | All users |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + External system + integration plugin |
| Depends on | — |
| Status | Ready; conditions: SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-008-01 | As a client administrator, I want to set which file types and sizes may be uploaded in each place, so that only expected files enter the system. | D; REQ-MPC-FR-324 | Ready; conditions: SINGLE-FILTER |
| US-ADM-008-02 | As a client administrator, I want every upload scanned for viruses before it is stored, so that harmful files never reach the system. | D; REQ-MPC-FR-324 | Ready; conditions: SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-008-01-01 | US-ADM-008-01 | **Given** an upload policy per context (ADM contexts for native actions: storefront attribute file, checkout attribute file, return-request file, avatar, vendor picture, admin picture, product picture, product 3D object, admin download, data imports, language import, store icons, plugin upload, HTML-editor files, other upload; plus the contexts other modules register through IC-ADM-08) sets allowed extensions and a maximum size, **when** a file with an extension not allowed is uploaded, **then** it is refused with message Adm.UploadTypeNotAllowed before anything is stored. | REQ-MPC-FR-324; FIT (upload actions listed in BR-ADM-006 and BR-ADM-007) |
| AC-ADM-008-01-02 | US-ADM-008-01 | **Given** the same policy, **when** a file larger than the maximum is uploaded, **then** it is refused with message Adm.UploadTooLarge before anything is stored. | REQ-MPC-FR-324 |
| AC-ADM-008-01-03 | US-ADM-008-01 | **Given** a native per-field limit also applies (ProductAttributeMapping.ValidationFileAllowedExtensions / ValidationFileMaximumSize, CheckoutAttribute equivalents, ReturnRequestSettings.ReturnRequestsFileMaximumSize — moved from OrderSettings in 5.00 — and the elFinder allow-list and 10 MB limit of the HTML editor), **when** a file is uploaded, **then** the stricter of the native limit and the policy applies (BR-ADM-060). | FIT (5.00.1: ProductAttributeMapping; CheckoutAttribute; Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:23; Libraries/Nop.Services/Media/elFinder/ElFinderService.cs:68-85, NopElFinderDefaults.cs:16) |
| AC-ADM-008-01-04 | US-ADM-008-01 | **Given** the file content does not match its extension (file signature check), **when** it is uploaded, **then** it is refused with message Adm.UploadTypeNotAllowed. | Proposed |
| AC-ADM-008-02-01 | US-ADM-008-02 | **Given** scanning is enabled, **when** a file passes the type and size checks, **then** it is sent to the antivirus engine (IC-ADM-05) before it is stored; a clean file is stored, an infected file is refused with message Adm.UploadInfected and the event is audited (AUD-ADM-006). | REQ-MPC-FR-324 |
| AC-ADM-008-02-02 | US-ADM-008-02 | **Given** the antivirus engine is unavailable, **when** a file is uploaded, **then** the configured fail mode applies: reject with message Adm.UploadScanUnavailable (Proposed default) or accept into quarantine, not usable until scanned. | Proposed |
| AC-ADM-008-01-05 | US-ADM-008-01 | **Given** any upload endpoint is used, including ones that read the file through IDownloadService.GetDownloadBitsAsync or IPictureService.InsertPictureAsync, **when** the policy is enforced, **then** a global action filter on the known upload actions (BR-ADM-006, BR-ADM-007) checks Request.Form.Files before the action runs, and DI overrides of IDownloadService.GetDownloadBitsAsync(IFormFile) and IPictureService.InsertPictureAsync(IFormFile, ...) apply the same checks as a backstop (BR-ADM-060). | FIT (5.00.1: DownloadService.GetDownloadBitsAsync and PictureService.InsertPictureAsync are public virtual; Admin PictureController.AsyncUpload, DownloadController.AsyncUpload, ProductController.ProductPictureAdd, ProductController.Upload3dObject, PriceListController.ImportExcel, ElFinderController.Connector; Nop.Web ShoppingCartController, ReturnRequestController, CustomerController.UploadAvatar, VendorController.ApplyVendorSubmit and Info) |
| AC-ADM-008-01-06 | US-ADM-008-01 | **Given** a module registers an upload context through IC-ADM-08 RegisterUploadContext (code, owning feature, default extensions and size, scan flag, and either the native upload actions it covers with a resolver that recognises its uploads from the route values, or its own upload endpoint) — for example EGV-002 application documents on ShoppingCartController.UploadFileProductAttribute for attributes of e-Government services, IAM trade application documents, RET return evidence, DOC-005 required documents, **when** a file is uploaded through a covered action or endpoint, **then** the ADM-008 filter, or the module endpoint through IC-ADM-08 CheckUpload, applies that context's policy (a resolver match takes precedence over the ADM default context of the action) and the refusal uses the ADM-008 messages; the module keeps no file-type or size check of its own and registers no upload filter (BR-ADM-060). | SINGLE-FILTER; REQ-MPC-FR-324 |
| AC-ADM-008-01-07 | US-ADM-008-01 | **Given** an administrator opens the upload policy page, **when** it is shown, **then** every context is listed with its owning feature, covered actions or endpoint and current values; values of a module context are edited here, not in the owning module. | Proposed |
| AC-ADM-008-01-08 | US-ADM-008-01 | **Given** an upload policy is set for the contexts product 3D object, data imports and HTML-editor files, **when** a file is posted to one of the upload actions added in nopCommerce 5.00 (Admin ProductController.Upload3dObject, PriceListController.ImportExcel, ElFinderController.Connector upload command), **then** the ADM-008 filter applies the context policy and the scan before the action stores the file; a refused file gets Adm.UploadTypeNotAllowed, Adm.UploadTooLarge or Adm.UploadInfected and nothing is written; for elFinder the stricter of the policy and the elFinder allow-list applies. | VER-500; REQ-MPC-FR-324; FIT (5.00.1: Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:4256-4300; PriceListController.cs:489; ElFinderController.cs:43; Libraries/Nop.Services/Media/elFinder/ElFinderService.cs:68-85) |

**Business rules applied:** BR-ADM-060 (§8.1).


### 7.9 PRD-ADM-009 Exception management

| Item | Value |
|---|---|
| Description (baseline) | A queue of problems (failed checks, stuck orders, integration errors) ranked by severity, with reason codes, bulk actions, a record of how each was fixed, and detection of repeated causes. |
| Why it matters | Problems are fixed systematically, not ad hoc. |
| Who benefits | Operations staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-009-01 | As a member of operations staff, I want failed checks, stuck items and integration errors in one queue ranked by severity and age, so that I fix the worst problems first. | D; FC-M04-011 | Ready |
| US-ADM-009-02 | As a member of operations staff, I want structured reason codes and a record of how each exception was fixed, so that fixes are consistent and traceable. | D; FC-M04-013; FC-M04-014 | Ready |
| US-ADM-009-03 | As a member of operations staff, I want to apply the same action to many exceptions at once where it is safe, so that repeated problems are cleared quickly. | D; FC-M04-012 | Ready |
| US-ADM-009-04 | As an operations manager, I want exceptions that share a root cause to be grouped, so that the cause is fixed once. | D; FC-M04-015 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-009-01-01 | US-ADM-009-01 | **Given** modules raise exceptions through IC-ADM-04 (type, severity, reason code, entity reference, details, allowed actions), **when** an operator opens the queue, **then** exceptions are listed by severity, then by age (oldest first), with filters by type, reason code and module. | D; FC-M04-011 |
| AC-ADM-009-02-01 | US-ADM-009-02 | **Given** an operator resolves an exception, **when** they save the resolution, **then** a reason code and an action are mandatory (message Adm.ReasonRequired if missing) and operator, action, reason code, comment and outcome are recorded (AUD-ADM-007). | D; FC-M04-013; FC-M04-014 |
| AC-ADM-009-03-01 | US-ADM-009-03 | **Given** several exceptions of a type that declares an action batch-safe are selected, **when** the operator applies that action (approve, reject, retry or escalate), **then** the action runs on each item through the owning module's handler and the result per item is shown; actions not declared batch-safe are not offered for multiple items. | D; FC-M04-012 |
| AC-ADM-009-03-02 | US-ADM-009-03 | **Given** a retry fails again, **when** the result returns, **then** the exception returns to Open with the attempt count increased. | Proposed |
| AC-ADM-009-04-01 | US-ADM-009-04 | **Given** several open exceptions share reason code and source (for example the same integration endpoint) within the configured window, **when** the pattern task runs, **then** they are grouped under one pattern with a count, shown at the top of the queue. | D; FC-M04-015 |

**Business rules applied:** BR-ADM-070 (§8.1).


### 7.10 PRD-ADM-010 Operational alerts

| Item | Value |
|---|---|
| Description (baseline) | Alerts when something needs attention, for example orders stuck too long or service targets missed, with thresholds the client sets. |
| Why it matters | Issues are caught early. |
| Who benefits | Operations managers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-010-01 | As an operations manager, I want alerts when something needs attention, such as orders stuck too long or service targets missed, with thresholds I set, so that issues are caught early. | D; FC-M04-008 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-010-01-01 | US-ADM-010-01 | **Given** an alert rule names a measure (orders in status S longer than a set time, service-level breach reported by ORD-011, open exceptions of a type above a count), a threshold, recipients and a channel, **when** the alert task runs and the threshold is crossed, **then** an alert is raised and sent through TRK-005 to the recipients; it is not sent again for the same rule and subject until it is cleared or the repeat interval passes. | D; FC-M04-008 |
| AC-ADM-010-01-02 | US-ADM-010-01 | **Given** an alert is raised, **when** an operator acknowledges it, **then** it shows who acknowledged and when; when the measure falls back below the threshold the alert clears automatically. | Proposed |
| AC-ADM-010-01-03 | US-ADM-010-01 | **Given** a rule is created or changed, **when** it is saved, **then** the change is audited (AUD-ADM-008). | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.11 PRD-ADM-011 Template library

| Item | Value |
|---|---|
| Description (baseline) | A library of reusable transaction templates for each client, with versions, the ability to base one template on another, copying, and approval before use. Includes a workspace where client administrators manage branding, wording, workflows, rules and templates in one place. |
| Why it matters | Repeat transactions are set up quickly and consistently. |
| Who benefits | Client administrators |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-004 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-011-01 | As a client administrator, I want a private library of transaction templates derived from the vertical defaults, so that repeat transactions are set up quickly and consistently. | D; FC-M02-007 | Ready |
| US-ADM-011-02 | As a client administrator, I want every template version kept with author, time and summary, with rollback, so that changes are traceable and reversible. | D; FC-M02-008 | Ready |
| US-ADM-011-03 | As a client administrator, I want a template to inherit from a parent with visible overrides, and to clone a template, so that variants stay consistent with their base. | D; FC-M02-009; FC-M02-010 | Ready |
| US-ADM-011-04 | As a template approver, I want changes to active templates to be approved before use, so that untested changes do not reach transactions. | D; FC-M02-011 | Ready |
| US-ADM-011-05 | As a client administrator, I want one workspace to reach branding, wording, workflows, rules, document and notification templates, so that configuration is managed in one place. | D; FC-M04-023 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-011-01-01 | US-ADM-011-01 | **Given** the vertical pack (PLT-003) supplies template defaults, **when** the client library is opened, **then** each client template shows the default it derives from; editing a client template never changes the vertical default. | D; FC-M02-007 |
| AC-ADM-011-02-01 | US-ADM-011-02 | **Given** a template is changed, **when** it is saved, **then** a new version with author, time and change summary is created; an earlier version can be restored as a new version. | D; FC-M02-008 |
| AC-ADM-011-03-01 | US-ADM-011-03 | **Given** a child template inherits from a parent, **when** the child is opened, **then** every field shows whether it is inherited or overridden, and an overridden field shows the parent value. | D; FC-M02-009 |
| AC-ADM-011-03-02 | US-ADM-011-03 | **Given** a template is cloned, **when** the clone is saved, **then** it is a new template with the same values and its own version history. | FC-M02-010 |
| AC-ADM-011-04-01 | US-ADM-011-04 | **Given** an active template is changed, **when** the change is submitted, **then** it waits for approval (ADM-006) by a user holding Administration.Core.Templates.Approve other than the author; transactions keep using the active version until approval. | D; FC-M02-011 |
| AC-ADM-011-05-01 | US-ADM-011-05 | **Given** the configuration workspace is opened, **when** an administrator chooses an area, **then** they are taken to the owning screen (PLT-006 branding, locale resources, ADM-002 workflows, ADM-003 rules, DOC-001 document templates, TRK-004 notification templates); no area is edited in a second place. | FC-M04-023; Proposed |

**Business rules applied:** BR-ADM-040 (§8.1).


### 7.12 PRD-ADM-012 Template analytics and shared marketplace

| Item | Value |
|---|---|
| Description (baseline) | Shows which templates are used most, and lets clients share templates with others in a common library. |
| Why it matters | Good templates are reused across clients. |
| Who benefits | Client administrators |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-011 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-ADM-012-01 | As a client administrator, I want to see which templates are used most, which are stale and which have errored transactions, so that I maintain the right templates. | D; FC-M02-012 | Ready |
| US-ADM-012-02 | As a client administrator, I want to publish anonymised templates to a shared library and adopt templates others published, so that good templates are reused across clients. | D; FC-M02-013 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-ADM-012-01-01 | US-ADM-012-01 | **Given** templates are used by transactions, **when** the analytics page is opened, **then** it shows per template the number of transactions in a chosen period, the date last used, and the number of failed or exception cases; templates unused for the configured period are marked stale. | D; FC-M02-012 |
| AC-ADM-012-02-01 | US-ADM-012-02 | **Given** a client administrator publishes a template, **when** it is exported, **then** client identifiers (names, codes, addresses, users) are removed and the package goes to the central product library outside every client instance (one installation per client, PLT-002). | D; FC-M02-013; Proposed |
| AC-ADM-012-02-02 | US-ADM-012-02 | **Given** a package from the shared library, **when** another client imports it, **then** it is added as a draft template in that client's library and follows the ADM-011 approval before use. | FC-M02-013 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-ADM-001 | Product extension register. Every DI service override (INopStartup Order >= 3000), repository decorator, global action or result filter, middleware, Nop.Web model-factory override, ModelReceivedEvent veto and registered core modification installed by a product plugin is listed in BR-ADM-002 to BR-ADM-008 with target, mechanism, owning feature, provider features and the rule that specifies it. One owner per overridden interface (decision OVR-REG): other features plug in through the provider interface the owner publishes and never register their own implementation. One owner per intercepted decision on a native action (decision SINGLE-FILTER): the impersonation action (IAM-026, rule providers IC-IAM-09), the two native download actions (SEC-002, rule providers IC-SEC-05) and every upload action (ADM-008, upload contexts IC-ADM-08) carry exactly one product filter for that decision; other features supply rules to it and register no filter of their own for it. Several global action filters may run on one action when each checks a different thing; each is listed with its filter order (Proposed) and refuses independently. Filters identify an action by controller and method name, because some route names differ from the method (Impersonate and ApplyVendorSubmit are routed as Edit and ApplyVendor). The ADM start-up check reads the IServiceCollection and reports, as a system warning, an interface with more than one product implementation or with an implementation from a plugin other than its owner. A chapter that adds or removes an entry updates this register in the same change. | ADM-001 | OVR-REG; SINGLE-FILTER; FIT (L1 section 6.2 principle 7; L1 section 6.3 DI list; Admin CustomerController.Impersonate has ActionName Edit; Nop.Web VendorController.ApplyVendorSubmit has ActionName ApplyVendor); Proposed |
| BR-ADM-002 | Register — DI overrides of order, checkout, cart and price services (owner, then providers). (1) IOrderProcessingService: owner CHK-003, the core checkout feature (PlaceOrderAsync with the placement lock and minimum-interval check once per checkout, BR-CHK-006; core host, D-01; CHK-004 is the order splitter IC-CHK-11 when the Marketplace pack is on; ShipAsync, ReadyForPickupAsync, DeliverAsync and CancelOrderAsync wrappers; BR-CHK-006, BR-CHK-021); providers: placement validators IC-CHK-02 (PAY-001 routing and PAY-018 risk through IC-PAY-03, LOG-004 serviceability and seller coverage, CHK-011 restrictions, CHK-018 approval); placement participants IC-CHK-06 (ADM-005 quota, MKT-001 limited-use discounts through IC-MKT-04, CHK-006 delivery window, CHK-016 credit, CAT-042 order-total adjustments (BR-CAT-033; the only participant for IC-CAT-06 providers, so the PAY-009 wallet under WAL-01 option (b) is reserved through it, not by a PAY participant), FIN-004 subsidy budget (BR-FIN-007), PAY-011 group payment (Confirm only, BR-PAY-014); ORD-005 seller task creation uses Confirm only (IC-ORD-09)); group payment IC-CHK-04 (PAY, IC-PAY-02); order-action guards IC-CHK-07 (ORD-010 hold, IC-ORD-02); cancellation participants IC-CHK-08 (CHK-006 window release, CHK-012 code revocation). (2) IShoppingCartService: owner CHK-003 (GetShoppingCartWarningsAsync, GetShoppingCartItemWarningsAsync, GetRentalProductWarningsAsync, GetSubTotalAsync, and the protected virtual GetStandardWarningsAsync, reachable only inside the owner class; BR-CHK-015); in 5.00 the interface gains SetShoppingCartVendorAsync and ResetCheckoutDataAsync (moved from ICustomerService), GetShoppingCartAsync becomes two overloads (one ShoppingCartType, or a list of types) and ShoppingCartService loses IsCustomerShoppingCartEmptyAsync — the owner derives from ShoppingCartService and keeps the native members; configuration rule (decision CART-500): ShoppingCartSettings.VendorEnabled stays off, because with it on the native warning ShoppingCart.SelectVendorToCheckout blocks a mixed-vendor checkout before the CHK-004 splitter runs (Libraries/Nop.Services/Orders/ShoppingCartService.cs:1187); providers: cart check providers IC-CHK-01 (CHK-011 restrictions, ORD-027 sample limits, CAT-037 / CAT-026 / CAT-027 checks and the two registered CAT replacers of native warnings, INV-004 holds as replacer of the stock warning, SVC-008 rental availability, EGV-001 workflow check, ADM-005 eligibility and quota) and the line subtotal adjuster IC-CHK-05 (MKT-002 buy-X-get-Y, IC-MKT-01). (3) IPriceCalculationService and IOrderTotalCalculationService: owner CAT-042 (GetShoppingCartTotalAsync and the protected UpdateTotalAsync used by admin order edits; BR-CAT-025, BR-CAT-031, BR-CAT-033); providers: CAT-039 price lists (since 5.00 native price lists applied by PriceCalculationService.GetFinalPriceAsync before tier prices, Libraries/Nop.Services/Catalog/PriceCalculationService.cs:77, 454; decision PRICE-500; the owner does not apply them a second time and the IC-CAT-05 provider is as the CAT chapter states); order-total adjustments IC-CAT-06: PAY-009 wallet deduction only under WAL-01 option (b), FIN-003 charge only if variable premiums are confirmed; any future PAY-015 or CHK-005 total change is a provider, never a second override. (4) Nop.Web IProductModelFactory and IShoppingCartModelFactory: CAT-042 (fixed prices per currency, BR-CAT-025; not named in OVR-REG, single claimant); in 5.00 the ProductModelFactory constructor and PrepareProductToWishlistModelAsync changed and GetBaseProductPriceAsync moved to IProductService. | ADM-001 | OVR-REG; CART-500; PRICE-500; FIT (5.00.1: IOrderProcessingService, IShoppingCartService incl. protected GetStandardWarningsAsync (Libraries/Nop.Services/Orders/IShoppingCartService.cs), IPriceCalculationService, IOrderTotalCalculationService incl. protected UpdateTotalAsync, Nop.Web Factories); BR-CHK-006, BR-CHK-015, BR-CHK-020, BR-CHK-021, BR-CAT-031, BR-CAT-032, BR-CAT-033 |
| BR-ADM-003 | Register — DI overrides of catalogue, shipment, document, messaging, settings, returns and numbering services. (5) IProductService (5.00 adds GetBaseProductPriceAsync and the Product3dObject members; a class derived from ProductService is unaffected): owner CAT-002, the core product master record (CAT-022 is the publish-gate provider for Insert/Update, BR-CAT-005; CAT-003 SKU generation BR-CAT-004); providers IC-CAT-04: CAT-022 publish gate, INV-009 / INV-011 sellable-stock adjusters (GetTotalStockQuantityAsync, IC-INV-04), SRC search-filter and ordering contributors (SearchProductsAsync, IC-SRC-02, BR-SRC-012), SEL eligibility check (IC-SEL-01); decision PS-OVR is replaced by OVR-REG. (6) IShipmentService.InsertShipmentAsync: owner ORD-010 shipment-guard host (core, BR-ORD-055, D-01); guard providers IC-ORD-11: PAY letter of credit, ORD-010 order hold (IC-ORD-02), EGV-004 application Issued (BR-EGV-008); INV lot and serial capture runs before the insert on LOG paths and in the INV AddShipment filter (IC-INV-07, BR-INV-070), not as a guard provider; LOG and TRK register no shipment override (BR-LOG-003, BR-LOG-042). (7) IPdfService (interface unchanged in 5.00; PdfService.ResolvePdfFont was replaced by GetFontInfo): owner DOC-001 (BR-DOC-001); providers through IC-DOC-02 token providers: ORD-009 invoice, receipt, proforma, contract, letter and Incoterm fields (IC-ORD-07), PAY-025 fiscal number and QR, CAT-015 trade fields, CAT-042 order-total adjustments. (8) IWorkflowMessageService: owner TRK-005 (SendNotificationAsync, signature unchanged in 5.00, BR-TRK-020; the 5.00 reminder, recurring-payment and withdrawal senders end in it; the forum and news senders left core with the Misc.Forums and Misc.News plugins; SendContactUsMessageAsync gains customAttributes); modules send their own event codes through IC-TRK-04; the bundled Misc.Brevo (BrevoMessageService, NopStartup Order 3000) is not installed in client instances (BR-TRK-021, BR-CHN-010). (9) ISettingService: owner PLT-004 (Insert/Update/DeleteSettingAsync capture of controlled keys, BR-PLT-020; 5.00 removed the synchronous members, so only the async members are overridden). (10) IReturnRequestService: owner RET (GetReturnRequestAvailabilityAsync, InsertReturnRequestAsync; BR-RET-010, BR-RET-012). (11) ICustomNumberFormatter: ORD-007 (padded order number, BR-ORD-040; not named in OVR-REG, single claimant). | ADM-001 | OVR-REG; FIT (5.00.1: IProductService, IShipmentService, IPdfService, IWorkflowMessageService, ISettingService (Libraries/Nop.Services/Configuration/ISettingService.cs), IReturnRequestService, ICustomNumberFormatter; Plugins/Nop.Plugin.Misc.Brevo/Infrastructure/NopStartup.cs:44) |
| BR-ADM-004 | Register — DI overrides and decorators of identity, security and media services. (12) ICustomerRegistrationService and IAuthenticationService: owner IAM (IAM-002 mobile identity, IAM-006 sessions; BR-IAM-011, BR-IAM-040); 5.00 adds ICustomerRegistrationService.ValidateCustomerByPhoneAsync and a native phone one-time-code login (OtpSettings), which IAM-002 uses as the IAM chapter states. (13) IPermissionService: IAM (scopes, delegations and SEC-010 time-bound grants; BR-IAM-060, BR-SEC-050; single claimant). (14) IGdprService.PermanentDeleteCustomerAsync: IAM-017 (erasure providers IC-IAM-08; BR-IAM-092; in 5.00 the native method no longer deletes forum or news data, which the plugins handle, and also deletes custom wishlists and private messages). (15) IRepository<> decorator: SEC-004 (INopStartup Order greater than 10; BR-SEC-010; 5.00 removed the synchronous Insert, Update, Delete, GetById and GetAll, so the decorator implements the async members only). (16) IAclService.SaveAclAsync and IStoreMappingService.SaveStoreMappingsAsync: SEC-004 (BR-SEC-011; unchanged in 5.00, which removed only the synchronous Authorize and GetStoresIdsWithAccess). (17) IWidgetPluginManager.LoadActivePluginsAsync and, since 5.00, IsPluginActiveAsync: owner SEC-007 (consent categories, BR-SEC-020; IsPluginActiveAsync gates the server-side Google Analytics cart events, BR-SEC-021; MKT and AI widgets are mapped to categories, BR-MKT-012). (18) IExportManager: SEC-014 (masking in staff exports, BR-SEC-060; 5.00 adds 17 report export members — sales summary, low stock, best sellers, never sold, country sales, registered and best customers — which the masking covers). (19) IDownloadService.GetDownloadBitsAsync(IFormFile) and IPictureService.InsertPictureAsync(IFormFile, ...): ADM-008 (upload policy backstop for IFormFile uploads, BR-ADM-060; files received as bytes are checked through IC-ADM-08 CheckUpload). (20) Nop.Web ICatalogModelFactory.PrepareSortingOptionsAsync: SRC-005 (new sort options). Not an override: the SRC ISearchProvider plugin is a native provider type selected by catalogsettings.activesearchprovidersystemname. | ADM-001 | OVR-REG; FIT (5.00.1: IGdprService.PermanentDeleteCustomerAsync; ICustomerRegistrationService.ValidateCustomerByPhoneAsync; IRepository (Libraries/Nop.Data/IRepository.cs); IAclService.SaveAclAsync; IStoreMappingService.SaveStoreMappingsAsync; WidgetPluginManager.LoadActivePluginsAsync and IsPluginActiveAsync public virtual, Libraries/Nop.Services/Cms/WidgetPluginManager.cs:42, 76; IExportManager; IDownloadService; IPictureService; ICatalogModelFactory.PrepareSortingOptionsAsync); BR-SEC-070 |
| BR-ADM-005 | Register — global action filters on Admin OrderController (one filter class per module; refusing guards run before capture filters, order value Proposed). PAY (PAY-016, PAY-019): CaptureOrder, MarkOrderAsPaid, RefundOrder, RefundOrderOffline, VoidOrder, VoidOrderOffline, PartiallyRefundOrderPopup [POST] (BR-PAY-082). ORD-010 shipment-guard host: AddShipment [POST], showing the first IC-ORD-11 refusal (BR-ORD-055). INV-009: AddShipment [POST], lot and serial capture through IC-INV-07 (BR-INV-070). LOG (LOG-010, LOG-012, LOG-017, LOG-020): SetAsDelivered, SetAsDeliveredSelected, EditShippedDate, EditDeliveryDate, EditReadyForPickupDate, SetTrackingNumber, AddShipment [POST], DeleteShipment, AddressEdit [POST] (BR-LOG-160). ORD (ORD-002, ORD-003): ChangeOrderStatus, CancelOrder, EditOrderTotals, EditOrderItem, DeleteOrderItem, EditShippingMethod, AddressEdit, AddProductToOrderDetails, OrderNoteDelete, Delete (BR-ORD-020); disjoint from the PAY payment actions. ADM-008: ImportFromXlsx [POST] (upload policy, data imports context; BR-ADM-060). Shared actions: AddShipment (ORD-010 host, INV, LOG) and AddressEdit (ORD reason, LOG carrier-booking lock). | ADM-001 | FIT (Admin OrderController actions verified in 5.00.1: name, verb and attributes unchanged; EditCreditCardInfo, removed in 5.00, is not registered); BR-PAY-082, BR-ORD-055, BR-INV-070, BR-LOG-160, BR-ORD-020, BR-ADM-060; Proposed (order) |
| BR-ADM-006 | Register — global action filters on other Admin controllers. PLT-004: SettingController POSTs including SettingUpdate, SettingAdd, SettingDelete, and plugin Configure POSTs (BR-PLT-020). INV-001 / INV-005: ProductController.Edit, BulkEditSave, ProductAttributeCombinationEditPopup, ProductAttributeCombinationCreatePopup, ImportExcel [POST] (BR-INV-030). CAT-032: ProductController.Edit [GET] view log (AUD-CAT-011). ADM-008, the single upload filter (BR-ADM-060, decision SINGLE-FILTER): PictureController.AsyncUpload (admin picture), DownloadController.AsyncUpload (admin download; product documents included), ProductController.ProductPictureAdd (product picture; CAT-002 product pictures, BR-CAT-003) and the file fields of ProductAttributeCombinationCreatePopup / EditPopup, the imports ProductController.ImportExcel, CategoryController and ManufacturerController ImportFromXlsx, CustomerController.ImportExcel, FilterLevelValueController.ImportFromXlsx, CountryController.ImportCsv, NewsLetterSubscriptionController.ImportCsv (data imports), LanguageController.ImportXml (language import), SettingController.UploadIcons (store icons), PluginController.UploadPluginsAndThemes (plugin upload), and the upload actions added in 5.00: ProductController.Upload3dObject (product 3D object; reads the file through IDownloadService.GetDownloadBitsAsync), PriceListController.ImportExcel (data imports) and ElFinderController.Connector (HTML-editor files; elFinder replaced Roxy Fileman and applies its own allow-list of images, plain text and PDF up to 10 MB, the stricter limit applies); CAT adds no upload filter: its own admin upload actions (CAT-016 360 image sets and brochures, CAT-019 certificates, CAT-020 provenance documents, CAT-021 takedown evidence, CAT-009 import files) are registered with ADM-008 under admin picture, admin download and data imports (BR-CAT-003); the RPT-011 ad-spend file uses data imports. SRC-016: CategoryController Create, Edit, Delete, DeleteSelected, ImportFromXlsx [POST] (BR-SRC-060). SEL-003: VendorController Create, Edit and Delete [POST] activation and deactivation gate (BR-SEL-002). SEL-009: global seller-staff filter on admin and seller-portal actions for vendor users (BR-SEL-010). MKT-008: TopicController Create / Edit, BlogController BlogPostCreate / BlogPostEdit [POST], and the Misc.News plugin controller NewsAdminController NewsItemCreate / NewsItemEdit [POST] only where that bundled plugin is installed (the core admin NewsController was removed in 5.00) (BR-MKT-007). MKT-014 and MKT-005: no filter since 5.00 — vendor discount scope (DiscountController Create, Edit, ProductAddPopup) and the Omnisend Configuration.ManagePlugins check are native (BR-MKT-011, BR-MKT-013; VER-500); Misc.Brevo is not installed. IAM-026, the single impersonation filter (BR-IAM-130, decision SINGLE-FILTER): CustomerController.Impersonate [POST] (route action name Edit), after the native CheckPermission; it allows Administrators and, for other users, asks the rule providers IC-IAM-09: the IAM-026 agent rule (customers of the agent outlets; CHK-013 acting sessions) and the CRM-015 account-manager rule (BR-CRM-070); CRM and CHK register no filter on this action. IAM-007: CustomerRoleController Edit and Delete [POST] (product role protection); SecurityController.PermissionEditPopup [POST] (permission exclusions, BR-IAM-054). IAM: read-access logging on admin customer and order views (BR-IAM-080) and the scope check on single-record actions (BR-IAM-060). RET: ReturnRequestController.Edit [POST] (BR-RET-001). SEC-002, the single download-ownership filter (BR-SEC-005, decision SINGLE-FILTER): DownloadController.DownloadFile, shared with Nop.Web DownloadController.GetFileUpload (BR-ADM-007); rule providers IC-SEC-05: EGV-002, RET, CRM-001, ORD, SEL-002, DOC-002, LOG-012, TRK-003. AI-002: ArtificialIntelligenceController.GenerateMetaTags (no native CheckPermission; BR-AI-004). SEC-007: Widgets.GoogleAnalytics WidgetsGoogleAnalyticsController.Configure [POST] refuses EnableEcommerce = true while the country profile requires consent or is not configured (BR-SEC-021); it runs beside the PLT-004 Configure filter and checks a different thing. | ADM-001 | FIT (controller actions verified in 5.00.1; NewsAdminController: Plugins/Nop.Plugin.Misc.News/Admin/Controllers/NewsAdminController.cs:177, 226; ProductController.Upload3dObject :4256; PriceListController.ImportExcel :489; ElFinderController.Connector :43, Libraries/Nop.Services/Media/elFinder/ElFinderService.cs:68-85); SINGLE-FILTER; VER-500; rules cited per entry; Proposed (order) |
| BR-ADM-007 | Register — global action filters on Nop.Web (storefront) controllers. CHK-009 / CHK-002: CheckoutController.ConfirmOrder and OpcConfirmOrder [POST] (BR-CHK-013). SVC-004: the same actions (payment-plan price check, BR-SVC-031). SVC-001: ShoppingCartController.AddProductToCart_Catalog and AddProductToCart_Details (price on request, BR-SVC-002; in 5.00 AddProductToCart_Details takes an extra customwishlistid parameter, which the filter ignores). SVC-003: OrderController.CancelOrder (booking cancellation rules). INV-004: CheckoutController Index and OnePageCheckout [GET] (checkout hold, BR-INV-021). ADM-008, the single upload filter (BR-ADM-060, decision SINGLE-FILTER): ShoppingCartController.UploadFileProductAttribute (storefront attribute file; EGV-002 e-Government application document by resolver) and UploadFileCheckoutAttribute (checkout attribute file), ReturnRequestController.UploadFileReturnRequest (return-request file), CustomerController.UploadAvatar (avatar), VendorController.ApplyVendorSubmit [POST] (route action name ApplyVendor) and VendorController.Info [POST] (vendor picture); EGV-002 registers no upload filter (BR-EGV-004). SEC-002: ShoppingCartController.UploadFileProductAttribute, UploadFileCheckoutAttribute and ReturnRequestController.UploadFileReturnRequest [POST] record upload ownership only (no file check), and DownloadController.GetFileUpload carries the single download-ownership filter with the IC-SEC-05 rule providers (BR-SEC-005); EGV-002 registers no download filter (BR-EGV-004). RET-002: ReturnRequestController.ReturnRequestSubmit [POST] (BR-RET-012; in 5.00 the action also accepts a guest withdrawal token, which stays unused while ReturnRequestSettings.GuestReturnRequestsAllowed is off). CRM-002: CommonController.ContactUsSend [POST] (in 5.00 with an extra IFormCollection parameter for contact-form attributes), ticket after a successful send. SEL-006 / SEL-013: VendorController.ApplyVendorSubmit [POST] (route action name ApplyVendor; terms and block check). SEL-013: CustomerController.Register and Login [POST] and the IAM mobile registration and login POST actions (block scope; BR-IAM-003; in 5.00 Login and Register redirect to the native phone one-time-code verification when OtpSettings.LoginByPhoneEnabled is on, and Login shows the generic wrong-credentials message for unknown and unregistered accounts). IAM: CustomerController.PasswordRecoverySend [POST] (BR-IAM-020; in 5.00 the native action no longer reveals an unknown e-mail); global MFA-by-role redirect (BR-IAM-030); global policy re-acceptance redirect, also in the seller portal (BR-IAM-091). | ADM-001 | FIT (controller actions verified in 5.00.1: Presentation/Nop.Web/Controllers/ShoppingCartController.cs:791, ReturnRequestController.cs:209, CommonController.cs:276, CustomerController.cs:447, 857, 1001); SINGLE-FILTER; rules cited per entry; Proposed (order) |
| BR-ADM-008 | Register — other mechanisms. Widgets in native widget zones (for example CRM in admin_customer_details_block and orderdetails_page_overview) replace nothing and are not register entries. (21) Result filter on admin view models and JSON results: owner SEC-014 (masking in staff views, BR-SEC-060; applied only when SEC-014 is delivered). (22) Middleware for request idempotency keys: owner PLT-027 (IC-PLT-07; until PLT-027 is delivered checkout runs on one web node, BR-PLT-004). (23) ModelReceivedEvent veto on Admin ProductController.Create and Edit [POST] for the publish gate: owner CAT-022 (BR-CAT-005; CAT-022 owns only this veto). (24) ModelReceivedEvent handler on Admin ProductController.Edit [POST] for the edit-version check: owner CAT-023 (BR-CAT-019). (25) Registered core modification, row version and repository check: owner PLT-027 (L1 section 6.3). (26) Registered core modification, admin views: owner PLT-018 (L1 section 6.3). (27) Registered core modification, admin query filtering by scope: owner IAM-008 (BR-IAM-060; L1 section 6.3). (28) Registered core modification, per-line fulfilment: owner CHK-005 (L1 section 6.3). (29) Conditional core modification, decimal quantities: owner CAT-041 (only if decision UOM-01 requires it; L1 section 6.3). (30) Conditional core modification, order number before the Order insert: owner CHK-008 (only if the custom order number must exist before the Order insert; otherwise the CheckoutSession reference is used and there is no core change; L1 section 6.3, workbook fit: Custom plugin; Core modification (conditional)). | ADM-001 | OVR-REG; SINGLE-FILTER; FIT (L1 section 6.3); Proposed |
| BR-ADM-010 | A workflow definition is published only if every path reaches an end, every exclusive gateway has a default path, every parallel join matches its split and every step type is available for the client. | ADM-002 | FC-M02-016; FC-M02-017; Proposed |
| BR-ADM-011 | Workflow steps and approval decisions never change native or module state directly: they call the owning module's service (which uses the native service, for example IOrderProcessingService). Event consumers only enqueue start or signal requests, carrying an idempotency key; the engine runner (scheduled task) processes them, because nopCommerce event consumers swallow exceptions. | ADM-002, ADM-006 | FIT (Libraries/Nop.Services/Events/EventPublisher.cs; L1 section 6.2 principle 8); Proposed |
| BR-ADM-012 | Simulation and rule testing have no side effects: no notification, document, external call, payment or production log entry. | ADM-002, ADM-003 | FC-M02-018; FC-M02-023 |
| BR-ADM-020 | The rule language is declarative and constrained: operators over declared facts only; no code, reflection, file, network or database access. | ADM-003 | FC-M02-021 |
| BR-ADM-021 | A rule cannot be activated while it conflicts (same rule set, overlapping matches in the test data, different outcomes) unless a precedence order resolves it; strategies are first match by priority or all matches. | ADM-003 | FC-M02-024; FC-M02-025 |
| BR-ADM-030 | An approval item is visible and actionable only to users whose role is named on the current step, within their authority limit or by active delegation; the requester never approves own items and one user decides at most one step of an item. | ADM-006 | FC-M04-016; Proposed (one step per user) |
| BR-ADM-031 | An owning module may implement a pre-decision guard for its object types (IC-ADM-03 CanDecide). ADM calls it before recording an approval, an approval with conditions or the confirmation of conditions; a refusal records nothing and shows Adm.DecisionBlocked with the module reason. The OnApproved callback still re-checks, and a callback error leaves the item decided and raises an ADM-009 exception, as before. | ADM-006 | Proposed |
| BR-ADM-040 | A transaction parameter marked Fixed cannot be changed on a transaction; a Required parameter must be present; overrides need a reason and are recorded as deviations (PLT BR-PLT-017). | ADM-004, ADM-011 | FC-M02-004; D |
| BR-ADM-050 | Eligibility affects visibility only through native ACL by customer role: eligibility rules compute role membership; purchase limits and quotas are enforced by an ADM cart rule provider (IC-CHK-01) of the CHK-003 IShoppingCartService override, which PlaceOrderAsync re-runs, and reserved at placement by an ADM placement participant (IC-CHK-06, Reserve / Confirm / Release, BR-CHK-020) of the CHK-003 override. ADM overrides neither IShoppingCartService nor IOrderProcessingService (OVR-REG). | ADM-005 | FIT (AclRecord; OrderProcessingService calls GetShoppingCartItemWarningsAsync); OVR-REG; Proposed |
| BR-ADM-060 | Upload policy: ADM-008 is the single owner of server-side upload checks (file type, size, file signature, virus scan) for every upload in the product. Each upload belongs to one context: an ADM context of the native action, or a context that a module registers through IC-ADM-08 (with a resolver for native actions, or a CheckUpload call from its own endpoint); a resolver match takes precedence over the ADM default context. A file that reaches the IFormFile backstop from an endpoint with no context gets the ADM context other upload (Proposed; values not stated). Files a module receives as bytes (APIs, mailboxes, apps) are covered only through CheckUpload, because the backstop sees IFormFile uploads only. The stricter of the native per-field limit and the context policy applies. The policy is enforced before the file is stored, by one ADM global action filter on the upload actions listed in BR-ADM-006 and BR-ADM-007 and by the IDownloadService / IPictureService overrides as backstop; scanning happens before storage. No other module keeps a file-type or size check or registers an upload filter; SEC-002 records upload ownership on the same actions and checks nothing about the file. | ADM-008 | REQ-MPC-FR-324; FIT (DownloadService, PictureService public virtual); SINGLE-FILTER |
| BR-ADM-070 | Every exception resolution records operator, action, reason code, comment and outcome; bulk actions are allowed only for actions the exception type declares batch-safe. | ADM-009 | FC-M04-012; FC-M04-014 |
| BR-ADM-075 | Work-queue items (approval items, exceptions and items raised into the console by other modules) record assignment, completion and reopen events with assignee, actor and time; RPT-009 reads them for operator metrics. | ADM-006, ADM-007, ADM-009 | Proposed |
| BR-ADM-085 | ADM messages are sent only through TRK-005. ADM registers its event codes through IC-TRK-04 RegisterEventCode at installation (names Proposed): Administration.ApprovalAssigned, Administration.ApprovalDecided (approved, approved with conditions, rejected with reason and recourse), Administration.WorkflowCaseFailed, Administration.AlertRaised, Administration.UploadInfected (administrator summary) and Administration.ScreeningMatch. A workflow notification step (ADM-002) may name only an event code registered with TRK-005; alert rules (ADM-010) send through TRK-005 on the channels of the rule. | ADM-002, ADM-006, ADM-010 | MSG-ROUTE; BR-TRK-023; Proposed (code names) |
| BR-ADM-080 | ADM settings are listed in the ADM key catalogue (key, type, layer, secret flag, default); antivirus-engine and sanctions-provider credentials are flagged secret, so packs refuse them and exports omit them (BR-PLT-013). ADM pages, widgets, filters, providers and scheduled tasks check the feature state for the store through IC-PLT-02 before acting. ADM registers the rule evaluation log and work drafts as PLT-020 record types (IC-PLT-08). ADM writes only through IRepository<> and writes business audit events through IC-SEC-01. | ADM-001 and all ADM features | Proposed (PLT and) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-ADM-01 | WorkflowDefinition | (none) | created | — | Draft | — |
| SM-ADM-01 | WorkflowDefinition | Draft | publish | BR-ADM-010 | Published | version number assigned |
| SM-ADM-01 | WorkflowDefinition | Draft | publish | invalid | Draft | Adm.WorkflowInvalid |
| SM-ADM-01 | WorkflowDefinition | Published | retire | no new cases wanted | Retired | running cases continue |
| SM-ADM-02 | WorkflowCase | (none) | start request processed | idempotency key unused | Running | — |
| SM-ADM-02 | WorkflowCase | Running | task or approval step reached | — | Waiting | approval item / task created |
| SM-ADM-02 | WorkflowCase | Waiting | task completed or item decided | — | Running | next step |
| SM-ADM-02 | WorkflowCase | Running | end reached | — | Completed | — |
| SM-ADM-02 | WorkflowCase | Running | step fails after retries | — | Failed | ADM-009 exception raised |
| SM-ADM-02 | WorkflowCase | Failed | operator retries the step | — | Running | — |
| SM-ADM-02 | WorkflowCase | Running / Waiting / Failed | cancel by owning module or administrator | reason given | Cancelled | open items withdrawn |
| SM-ADM-03 | Rule | (none) | created | — | Draft | — |
| SM-ADM-03 | Rule | Draft | activate | valid; no unresolved conflict (BR-ADM-021) | Active | previous active version Retired |
| SM-ADM-03 | Rule | Draft | activate | conflict | Draft | Adm.RuleConflict |
| SM-ADM-03 | Rule | Active | retire | — | Retired | — |
| SM-ADM-04 | ApprovalItem | (none) | submitted by owning module | — | InReview | step 1 (skipped steps recorded) |
| SM-ADM-04 | ApprovalItem | InReview | step approved, more steps remain | BR-ADM-030 | InReview | next step |
| SM-ADM-04 | ApprovalItem | InReview | approve or approve with conditions | module guard refuses (IC-ADM-03 CanDecide, BR-ADM-031) | InReview | nothing recorded; Adm.DecisionBlocked |
| SM-ADM-04 | ApprovalItem | ApprovedWithConditions | confirm conditions done | module guard refuses (IC-ADM-03 CanDecide, BR-ADM-031) | ApprovedWithConditions | nothing recorded; Adm.DecisionBlocked |
| SM-ADM-04 | ApprovalItem | InReview | last step approved | BR-ADM-030 | Approved | owning module callback applies the effect |
| SM-ADM-04 | ApprovalItem | InReview | approved with conditions | — | ApprovedWithConditions | conditions listed |
| SM-ADM-04 | ApprovalItem | ApprovedWithConditions | all conditions done and confirmed | — | Approved | owning module callback |
| SM-ADM-04 | ApprovalItem | InReview | rejected with reason | reason code present | Rejected | requester notified with recourse |
| SM-ADM-04 | ApprovalItem | Rejected | resubmitted | — | InReview | new round from step 1 |
| SM-ADM-04 | ApprovalItem | Rejected | appealed | appeal step defined | InAppeal | appeal approver |
| SM-ADM-04 | ApprovalItem | InAppeal | appeal decided | — | Approved / RejectedFinal | owning module callback |
| SM-ADM-04 | ApprovalItem | InReview / Rejected | withdrawn by requester | — | Withdrawn | — |
| SM-ADM-05 | ExceptionRecord | (none) | raised by module | — | Open | — |
| SM-ADM-05 | ExceptionRecord | Open | operator takes it | — | InProgress | — |
| SM-ADM-05 | ExceptionRecord | Open / InProgress | resolved with action and reason code | BR-ADM-070 | Resolved | AUD-ADM-007 |
| SM-ADM-05 | ExceptionRecord | Open / InProgress | retry | — | Retrying | owning handler called |
| SM-ADM-05 | ExceptionRecord | Retrying | retry succeeds / fails | — | Resolved / Open | attempt count increased on failure |
| SM-ADM-05 | ExceptionRecord | Open / InProgress | escalate | — | Escalated | assigned to escalation role |
| SM-ADM-06 | TransactionTemplate | Draft | submit | — | PendingApproval | approval item (ADM-006) |
| SM-ADM-06 | TransactionTemplate | PendingApproval | approved / rejected | approver is not the author | Active / Draft | previous active version Superseded |
| SM-ADM-06 | TransactionTemplate | Active | retire | — | Retired | — |
| SM-ADM-07 | AlertEvent | (none) | threshold crossed | no open alert for rule and subject | Raised | sent through TRK-005 |
| SM-ADM-07 | AlertEvent | Raised | acknowledged | — | Acknowledged | — |
| SM-ADM-07 | AlertEvent | Raised / Acknowledged | measure back below threshold | — | Cleared | — |
| SM-ADM-08 | UploadScan | (none) | file passes type and size checks | scanning enabled | Scanning | — |
| SM-ADM-08 | UploadScan | Scanning | engine result clean / infected | — | Clean / Infected | store / refuse with Adm.UploadInfected |
| SM-ADM-08 | UploadScan | Scanning | engine unavailable | fail mode | Rejected / Quarantined | Adm.UploadScanUnavailable or quarantine |
| SM-ADM-08 | UploadScan | Quarantined | scan completes clean / infected | — | Clean / Infected | released / deleted |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| WorkflowDefinition (new) | Id, Code, Version, Status (SM-ADM-01), DefinitionXml (BPMN 2.0), PublishedBy, PublishedOnUtc | ADM-002 | — |
| WorkflowCase / WorkflowStepExecution / WorkflowStartRequest (new) | Case: Id, DefinitionId, Version, BusinessKeyType, BusinessKeyId, Status (SM-ADM-02), Variables; Execution: CaseId, StepId, Status, Actor, Input, Output, Decision, StartedOnUtc, EndedOnUtc; StartRequest: IdempotencyKey, DefinitionCode, BusinessKey, Payload, ProcessedOnUtc | ADM-002 | Start requests are written by event consumers and processed by a scheduled task |
| RuleSet / Rule / RulePattern / RuleTestCase / RuleEvaluationLog (new) | RuleSet: Code, OwningModule, FactSchema, Strategy; Rule: RuleSetId, Version, Expression, Outcome, Priority, Status (SM-ADM-03); Pattern: Category, Template, Parameters; TestCase: RuleSetId, Facts, Expected; Log: RuleSetId, MatchedRules, Inputs (masked), Outcome, CallerRef, EvaluatedOnUtc | ADM-003 | Log retention via PLT-020 |
| TransactionType / TransactionTypeChain / TransactionParameterValue (new) | Type: Code, OwningModule, ParameterSchema, WorkflowCode, DocumentRequirementSet, IsActive; Chain: FromType, ToType, ParameterMapping; Value: TransactionRef, Key, Value, OverrideReason | ADM-004 | Fixed-price and RFQ map to native Order and Misc.RFQ entities |
| EligibilityBinding / Quota / ScreeningResult (new) | Binding: RuleSetId, CustomerRoleId; Quota: Scope (product / scheme), RefId, CustomerRoleId, Quantity or Value, PeriodStart, PeriodEnd; Screening: CustomerId, ListVersion, Result, Score, ReviewedBy, Decision | ADM-005 | Visibility through native AclRecord and CustomerRole |
| ApprovalChain / ApprovalStepDefinition / ApprovalItem / ApprovalStep / ApprovalCondition / ReasonCode / ModerationQueue (new) | Chain: ObjectType, Steps; StepDefinition: Order, ApproverRole, AuthorityLimit, ConditionRuleSet, IsAppealStep; Item: ObjectType, ObjectId, RequesterId, Status (SM-ADM-04), CurrentStep, Round; Step: ItemId, Order, Decision, DecidedBy, ReasonCode, Comment, DecidedOnUtc; Condition: ItemId, Text, DoneBy, ConfirmedBy; ReasonCode: Context, Code, Text (localized); Queue: ObjectType, AssignmentRule | ADM-006 | Native approvals (vendor apply, product review IsApproved) remain unless moved |
| SavedView / WorkDraft / DashboardLayout (new) | SavedView: CustomerId, Screen, Name, Filters; WorkDraft: CustomerId, FormKey, Draft, UpdatedOnUtc; Layout: CustomerId, Tiles | ADM-007 | Drafts may contain personal data: retention setting applies |
| WorkItemEvent (new) | Id, QueueCode, ItemType, ItemId, Event (Assigned / Completed / Reopened), AssigneeId, ActorId, OccurredOnUtc; current AssigneeId, AssignedOnUtc, CompletedOnUtc, ReopenCount also kept on ApprovalItem and ExceptionRecord | ADM-007, ADM-006, ADM-009 | Read by RPT-009; retention per PLT-020 |
| UploadContext / UploadScan (new) | UploadContext: Code, OwningFeature, CoveredActions, ResolverName, OwnEndpoint flag, AllowedExtensions, MaxSizeKb, ScanEnabled, FailMode (ADM contexts seeded at installation; module contexts added through IC-ADM-08); Scan: FileHash, Context, Status (SM-ADM-08), Engine, Result, ScannedOnUtc | ADM-008 | Native per-field limits remain (BR-ADM-060) |
| StepOperation (new) | Code, OwningModule, InputSchema, OutputSchema, DefaultTimeout, DefaultRetries | ADM-002 | Filled through IC-ADM-01 RegisterStepOperation |
| ExceptionRecord / ExceptionPattern (new) | Record: Type, Severity, ReasonCode, EntityRef, Details, Status (SM-ADM-05), Attempts, ResolvedBy, Action, Comment, Outcome; Pattern: ReasonCode, Source, Count, FirstSeen, LastSeen | ADM-009 | Native Log remains for system errors |
| AlertRule / AlertEvent (new) | Rule: Measure, Threshold, Window, Recipients, Channel, RepeatInterval, IsActive; Event: RuleId, Subject, Status (SM-ADM-07), RaisedOnUtc, AcknowledgedBy, ClearedOnUtc | ADM-010 | Delivery through TRK-005 |
| TransactionTemplate / TemplateVersion / TemplateUsage (new) | Template: Code, ParentId, TypeCode, Status (SM-ADM-06); Version: TemplateId, No, Values, Author, Summary, CreatedOnUtc; Usage: TemplateId, TransactionRef, Outcome, UsedOnUtc | ADM-011, ADM-012 | Vertical defaults come from PLT-003 packs |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Workflow definitions | Workflow engine definitions (new) | vertical → client | ADM-002 | Core |
| Business rules | Rules engine library (new) | vertical → client | ADM-003 | Core |
| Transaction types and templates | Transaction type schemas, template library (new) | vertical → client | ADM-004 / ADM-011 | Core |
| Scheduled tasks | ScheduleTask entries and intervals (installation-wide; no store scope) | installation only (no store scope) | ADM-001 | Core |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Scheduled tasks (interval, enabled, stop on error) | ScheduleTask entries (native; installation-wide, no store scope) | installation only | Not stated | Not stated |
| Workflow definitions | WorkflowDefinition (new; pack content) | vertical → client | Internal approval stages, shipping and fulfilment workflows (WF-004, WF-005, WF-007); steps not stated (KG-09, KG-13) | Service-entry workflows (FR-307; FG-06, T-MISS) |
| Business rules and pattern library | RuleSet, Rule, RulePattern (new; pack content) | vertical → client | Not stated | Not stated |
| Transaction types and chains | TransactionType, TransactionTypeChain (new; pack content) | vertical → client | Not stated (business models by inference, PRJ-002) | Not stated |
| Eligibility bindings, quotas, screening | EligibilityBinding, Quota, screening settings (new) | client | Not stated | Not stated |
| Approval chains, reason codes, moderation queues and assignment rules | ApprovalChain, ReasonCode, ModerationQueue (new) | vertical → client | Internal approval stages (WF-004); content not stated | Moderation queues (FR-319); high-risk actions (FR-039) |
| Upload policy per context (ADM and module contexts); scanning; fail mode | UploadContext (new; pack content) | global → client | Not stated | Required (FR-324); values not stated |
| Alert rules | AlertRule (new) | client | Not stated | Not stated |
| Work-draft retention | ADM settings (new) | client | Not stated | Not stated |
| Online-customer window | customersettings.onlinecustomerminutes (native) | client | Not stated | Not stated |
| Template library defaults | TransactionTemplate (new; pack content) | vertical → client | Not stated | Not stated |
| Antivirus engine and sanctions-provider credentials | ADM adapter settings, flagged secret in the ADM key catalogue (never in packs or exports, BR-ADM-080) | client instance only | Entered at deployment | Entered at deployment |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Admin | Native admin areas: settings, plugins, widgets, schedule tasks, log, maintenance, products (bulk edit), customers | ADM-001 | Native |
| Admin — System | Product extension register and start-up check | ADM-001 | New |
| Admin — Configuration | Workflow designer, simulator, versions; case list and replay | ADM-002 | New |
| Admin — Configuration | Rule sets, rule editor, pattern library, test harness, evaluation log | ADM-003 | New |
| Admin — Configuration | Transaction types, parameter schemas, chains | ADM-004 | New |
| Admin — Configuration | Eligibility bindings, quotas, screening review | ADM-005 | New |
| Admin — Operations | Approval queue and item page; chain and reason-code configuration; moderation queues | ADM-006 | New |
| Admin — Operations | Operations console (queue tabs, personal dashboard, saved views, operational order view, live count) | ADM-007 | New (mobile-responsive) |
| Admin — Configuration | Upload policy | ADM-008 | New settings page |
| Admin — Operations | Exception queue and patterns | ADM-009 | New |
| Admin — Operations | Alert rules and alerts | ADM-010 | New |
| Admin — Configuration | Template library, versions, analytics, shared library; configuration workspace | ADM-011, ADM-012 | New |
| Storefront | Eligibility and quota messages in cart and checkout | ADM-005 | Native cart warnings (through the CHK-003 provider host) |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Adm.WorkflowInvalid | The workflow cannot be published: {0}. | AC-ADM-002-01-01, AC-ADM-002-02-02, AC-ADM-002-02-05 |
| Adm.WorkflowStepUnavailable | The workflow uses a step that is not available for this client: {0}. | AC-ADM-002-02-06 |
| Adm.RuleInvalid | The rule is not valid at position {0}: {1}. | AC-ADM-003-01-02 |
| Adm.RuleConflict | This rule conflicts with rule {0}. Set the precedence or change one of the rules. | AC-ADM-003-04-01 |
| Adm.ParameterRequired | Enter {0}. It is required for this type of transaction. | AC-ADM-004-01-02 |
| Adm.ParameterFixed | {0} is fixed for this type of transaction and cannot be changed. | AC-ADM-004-01-03 |
| Adm.NotEligible | This item is not available for your account. | AC-ADM-005-01-02 |
| Adm.QuotaReserved | The remaining quantity of this item is reserved. You can order up to {0}. | AC-ADM-005-02-01, AC-ADM-005-02-02 |
| Adm.ScreeningHold | We need to complete a check on your account before you can place orders. Please contact us. | AC-ADM-005-03-01 |
| Adm.ApproveOwnItem | You cannot approve this item because you requested it or decided an earlier step. | AC-ADM-006-02-03 |
| Adm.ReasonRequired | Choose a reason. | AC-ADM-006-04-01, AC-ADM-009-02-01 |
| Adm.DecisionBlocked | This item cannot be approved yet: {0}. | AC-ADM-006-01-04 |
| Adm.UploadTypeNotAllowed | This type of file cannot be uploaded here. | AC-ADM-008-01-01, AC-ADM-008-01-04 |
| Adm.UploadTooLarge | The file is larger than {0}. | AC-ADM-008-01-02 |
| Adm.UploadInfected | The file was rejected by the virus check. | AC-ADM-008-02-01 |
| Adm.UploadScanUnavailable | The file cannot be checked right now. Please try again later. | AC-ADM-008-02-02 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Customer-facing texts do not state the reason for eligibility or screening holds.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Workflow engine (ADM-002) | Engine runtime if embedded (WF-ENG) | Not chosen (WF-ENG) | Held |
| Antivirus engine (ADM-008) | Scan (IC-ADM-05) | Not named in source | External |
| Sanctions-list provider (ADM-005) | Screen party (IC-ADM-06) | Not named in source | External |
| Owning modules | StartCase, RegisterStepOperation, Evaluate, Submit approval, CanDecide guard, Raise exception (IC-ADM-01 to IC-ADM-04) | ORD, LOG, PAY, SEL, CAT, EGV, DOC, PLT, TRK | Internal |
| Modules with uploads | RegisterUploadContext, CheckUpload (IC-ADM-08) | EGV-002, IAM, RET, DOC-005, CAT; SEC-002 records ownership on the same actions | Internal |
| Notification engine | RegisterEventCode, SendEvent (IC-TRK-04) | TRK-005 | Internal (BR-ADM-085) |
| Central template library (ADM-012) | Publish / import packages | Product team (outside client instances) | Proposed |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-ADM-01 | StartCase | Definition code, business key (entity type, id), variables, idempotency key | Case ID | Unknown or retired definition; duplicate key | Workflow engine service (engine choice WF-ENG); requests queued by event consumers and processed by a scheduled task |
| IC-ADM-01 | CompleteTask / Signal | Case ID, step ID, outcome, data | Case state | Step not waiting | Called by ADM-006 on decision, by modules on external events |
| IC-ADM-01 | RegisterStepOperation | Owning module, operation code, input and output schema, default timeout and retry count | Registered (operation appears in the step-operation catalogue) | Duplicate code | Called by modules at installation for connector operations used in call-to-another-system steps (for example EGV IC-EGV-02 VerifyOrRegister); INT-005 adapter operations are listed by INT the same way |
| IC-ADM-01 | Simulate | Definition (draft), sample data | Path, waits, outputs | Invalid definition | No side effects (BR-ADM-012) |
| IC-ADM-01 | GetHistory (replay) | Case ID | Ordered step executions with inputs, outputs, decisions | Unknown case | Read-only |
| IC-ADM-02 | Evaluate | Rule-set code, facts, caller reference | Outcome(s), matched rule IDs and versions | Unknown rule set; missing fact | Rules engine service; writes the evaluation log |
| IC-ADM-02 | Test | Draft rules, sample facts | Pass/fail per input with matched conditions | Invalid rule | No production log entry |
| IC-ADM-03 | Submit | Object type, object ID, requester, summary, amount | Approval item ID | No chain for object type | Owning module calls; ADM-006 routes. Object types named by modules so far: Document (DOC-004), ChangeSet (PLT-004), PayoutAccountChange (SEL-005), SellerApplication and VerificationRequest (SEL-003), Listing (CAT-022, CAT-043), OverMaxRequest (CAT-037), TransactionTemplate (ADM-011), ScreeningMatch (ADM-005) |
| IC-ADM-03 | CanDecide (pre-decision guard, optional) | Item ID, object type, object ID, intended decision | Allowed / Refused with the module message | — | Implemented by the owning module (for example SEL for SellerApplication guards, Sel.ApprovalBlocked); called by ADM-006 before an approval is recorded (BR-ADM-031) |
| IC-ADM-03 | OnApproved / OnRejected / OnConditionsMet (callbacks) | Item ID, decision, conditions | Effect applied by the module | Module error (item stays decided; exception raised to ADM-009) | Implemented by the owning module's service (for object type Document: the DOC-004 review service) |
| IC-ADM-04 | Raise exception | Type, severity, reason code, entity reference, details, allowed actions (batch-safe flags) | Exception ID | — | Called by any module |
| IC-ADM-04 | Handle action | Exception ID, action | Result | Action not allowed | Implemented by the owning module per exception type |
| IC-ADM-05 | Scan | File bytes, file name, content type | Clean / Infected (signature name) / Error | Engine unavailable, timeout | External antivirus engine adapter (engine not named) |
| IC-ADM-06 | Screen party | Name, country, identifiers, date of birth or registration | No match / Possible match (list, score) | Provider unavailable | External sanctions-list provider adapter (not named) |
| IC-ADM-07 | Get type schema / Validate parameters | Type code, parameter values | Schema; validation errors | Unknown type | Transaction type registry service |
| IC-ADM-08 | RegisterUploadContext | Context code, owning feature, covered native upload actions with a resolver (route values to yes or no), or own endpoint; default allowed extensions, maximum size, scan flag | Registered (context shown on the upload policy page) | Duplicate code; action not an upload action | Called by modules at installation; values are then edited only on the ADM-008 page (BR-ADM-060). Module contexts named so far: e-Government application document (EGV-002, resolver on UploadFileProductAttribute); trade application document (IAM-023); return evidence and case attachment (RET); ticket attachment (CRM-001); RFQ attachment and other ORD attachments (ORD); seller document (SEL-002, through IC-DOC-03); document vault, requirement documents and repository upload (DOC); proof-of-delivery media, delivery exception evidence and carrier label (LOG); tracking scan media (TRK-003); channel inbound media and field record photo (CHN); offline payment proof (PAY-036, own endpoint); product picture is an ADM context (ProductController.ProductPictureAdd), and the CAT admin upload actions use admin picture, admin download and data imports (BR-CAT-003) |
| IC-ADM-08 | CheckUpload | Context code, file name, content type, bytes | Accepted (scan result) / refused with Adm.UploadTypeNotAllowed, Adm.UploadTooLarge, Adm.UploadInfected or Adm.UploadScanUnavailable | Unknown context | Called by a module's own upload endpoint before it stores the file (for example DOC-005 requirement uploads) |

C# signatures are produced at the start of the build and approved by the tech lead. The workflow engine (ADM-002) may be built or embedded (decision WF-ENG); IC-ADM-01 is engine-independent and every step type calls the owning module's service, never native state directly.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Workflow start / signal requests | OrderPlacedEvent, OrderPaidEvent, ShipmentCreatedEvent, ShipmentSentEvent, ShipmentDeliveredEvent (native) and module events | ADM-002 consumers enqueue requests only; a scheduled task processes them (BR-ADM-011) |
| Administration.ApprovalDecided | None (ADM event) | Owning module callback through its service; TRK notification |
| Administration.ExceptionRaised / Resolved | None | Console, alerts (ADM-010) |
| Administration.AlertRaised | None | TRK-005 delivery |
| Customer profile changed (eligibility recomputation) | EntityUpdatedEvent<Customer> and GenericAttribute changes (native entity events) | ADM-005 consumer enqueues recomputation; nightly task also recomputes |
| Extension register check | SystemWarningCreatedEvent (native) | ADM-001 adds a warning when two plugins override the same interface |
| Upload scanning | None (runs inside the upload filter and service overrides) | ADM-008 |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two approvers decide the same item step at once | ADM-006 | The decision runs under ILocker key 'adm-approval-{itemId}'; the second sees the step already decided and its action is refused |
| Same start request delivered twice | ADM-002 | Idempotency key on WorkflowStartRequest; the second is ignored |
| Quota consumption by parallel orders | ADM-005 | The ADM placement participant (IC-CHK-06) reserves under ILocker key 'adm-quota-{quotaId}' inside the CHK-003 override before payment; the second order is refused with Adm.QuotaReserved; the nightly quota report checks for overruns |
| Rule activated while being evaluated | ADM-003 | Evaluations read the active version at start; the result records that version |
| Bulk exception action overlapping a single action | ADM-009 | Each item is processed under ILocker key 'adm-exception-{id}'; an item already resolved is skipped and reported |
| Template approved while a transaction starts | ADM-011 | The transaction uses the version active at its start |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Approval item assigned | Approver | Admin notification + e-mail through TRK-005 (Administration.ApprovalAssigned) | ADM-006 |
| Item rejected (reason and recourse) / approved | Requester | E-mail / admin notification through TRK-005 (Administration.ApprovalDecided) | ADM-006 |
| Workflow case failed | Operations staff | Admin notification through TRK-005 (Administration.WorkflowCaseFailed) | ADM-002 |
| Alert raised | Rule recipients | Channel of the rule through TRK-005 (Administration.AlertRaised) | ADM-010 |
| Upload infected | Uploader (message); administrators (summary) | Screen message (Adm.UploadInfected key); admin summary through TRK-005 | ADM-008 |
| Screening possible match | Compliance staff | Admin notification through TRK-005 (Administration.ScreeningMatch) | ADM-005 |
| Extension register conflict | Platform team | System warning | ADM-001 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Workflow case history and replay | ADM-002 | FC-M02-020 |
| Rule evaluation log | ADM-003 | FC-M02-026 |
| Approval turnaround and backlog per queue | ADM-006 | Proposed |
| Operational order view by stage | ADM-007 | REQ-MPC-FR-162 |
| Exception resolution history and patterns | ADM-009 | FC-M04-014, FC-M04-015 |
| Template usage analytics | ADM-012 | FC-M02-012 |
| Nightly quota report (overruns) | ADM-005 | Proposed |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-ADM-001 | Customer deactivated or reactivated; bulk product edit or archive | Administrator | Customer, Product | reason, items, old and new values |
| AUD-ADM-002 | Workflow definition published or retired; case cancelled or step retried manually | Administrator / operator | WorkflowDefinition, WorkflowCase | version, reason |
| AUD-ADM-003 | Rule created, changed, activated or retired; precedence changed | Administrator | Rule, RuleSet | old and new expression, version |
| AUD-ADM-004 | Approval decision (approve, approve with conditions, reject, appeal, condition confirmed) | Approver / requester | ApprovalItem | step, decision, reason code, comment |
| AUD-ADM-005 | Eligibility binding, quota or screening decision | Compliance staff | EligibilityBinding, Quota, ScreeningResult | old and new values, decision |
| AUD-ADM-006 | Upload refused (type, size, infected, scan unavailable) | System | UploadScan | context, file hash, reason |
| AUD-ADM-007 | Exception resolved, retried, escalated (single or bulk) | Operator | ExceptionRecord | action, reason code, comment, outcome |
| AUD-ADM-008 | Alert rule changed; alert acknowledged | Operator / administrator | AlertRule, AlertEvent | old and new values |
| AUD-ADM-009 | Transaction type, template version approved or restored | Administrator / approver | TransactionType, TransactionTemplate | version, approver |

Business audit events AUD-ADM-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id; old and new values of ADM tables and of native entities changed through native services are captured by the SEC-004 IRepository<> decorator and need no call, so ADM writes only through IRepository<> (no direct INopDataProvider writes). The native activity log is not an audit substitute. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-ADM-001 | Workflow and approval actions never change native state except through the owning module's service; no critical logic in event consumers. | L1 section 6.2 principle 8; BR-ADM-011 | AC-ADM-002-02-04, AC-ADM-002-06-02, AC-ADM-006-01-03 |
| NFR-ADM-002 | The rule language cannot execute code or reach data outside the declared facts. | FC-M02-021; BR-ADM-020 | AC-ADM-003-01-01; test note T-ADM-03 |
| NFR-ADM-003 | Every upload is checked and scanned before it is stored. | REQ-MPC-FR-324 | AC-ADM-008-01-01, AC-ADM-008-02-01; T-ADM-04 |
| NFR-ADM-004 | Every approval, exception resolution and rule change is audited (NFR-X-003). | REQ-MPC-FR-039; FC-M04-014; FC-M02-026 | section 14.2 audit events |
| NFR-ADM-005 | Console usable on tablet and phone widths. | FC-M04-025 | AC-ADM-007-08-01 |
| NFR-ADM-006 | Throughput and latency targets for rule evaluation and workflow steps: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-ADM-001 | P1 | — | |
| PRD-ADM-002 | P1 | — | PRD-PLT-004, PRD-SEL-003, PRD-CAT-022, PRD-SRC-016, PRD-CHK-018, PRD-ORD-015, PRD-ORD-018, PRD-ORD-024, PRD-RET-007, PRD-RET-008, PRD-CRM-004, PRD-MKT-008, PRD-ADM-006, PRD-EGV-002, PRD-EGV-007 |
| PRD-ADM-003 | P1 | — | PRD-ADM-004 |
| PRD-ADM-004 | P2 | PRD-ADM-003 | PRD-ADM-011 |
| PRD-ADM-005 | P2 | PRD-SEL-013 | |
| PRD-ADM-006 | P1 | PRD-ADM-002 | PRD-SEL-005 |
| PRD-ADM-007 | P1 | — | |
| PRD-ADM-008 | P1 | — | |
| PRD-ADM-009 | P2 | — | |
| PRD-ADM-010 | P2 | — | |
| PRD-ADM-011 | P2 | PRD-ADM-004 | PRD-ADM-012 |
| PRD-ADM-012 | P3 | PRD-ADM-011 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-ADM-01 | Workflow: publish validation on faulty definitions; parallel join waits for all branches; version pinning of running cases; simulation produces no side effect. |
| T-ADM-02 | Consumer failure: make a start-request consumer throw; assert the order or shipment flow is unaffected and the request is retried by the runner. |
| T-ADM-03 | Rule language: attempt code execution, reflection and data access in expressions; assert all are refused. |
| T-ADM-04 | Uploads: every upload action listed in BR-ADM-006 and BR-ADM-007 for ADM-008, and every module context registered through IC-ADM-08, refuses a disallowed type, an oversize file and the EICAR test file; a resolver context (for example an e-Government attribute file) applies its own values instead of the action default. |
| T-ADM-05 | Approvals: requester and earlier-step approvers cannot approve; condition tracking blocks the effect until confirmed; resubmission and appeal paths. |
| T-ADM-06 | State models: every transition in section 8.2 is tested; every transition not listed is rejected. |
| T-ADM-07 | Permissions: each permission in section 4 has an allow and a deny case (section 4.1). |
| T-ADM-08 | Extension register: install two test plugins overriding the same interface, and one plugin overriding an interface owned by another feature; assert the start-up warning for both. |
| T-ADM-09 | Register completeness: at build start and at each release, compare the DI registrations and global filters found in the product plugins with BR-ADM-002 to BR-ADM-008; any unlisted entry fails the release check (PLT-021 post-upgrade check). |
| T-ADM-10 | Single-owner filters: for Admin CustomerController.Impersonate, Nop.Web DownloadController.GetFileUpload, Admin DownloadController.DownloadFile and every upload action, assert that exactly one product filter decides (the owner in the register) and that changing a rule provider (CRM-015, EGV-002, a module upload context) changes the outcome without a second filter. |
