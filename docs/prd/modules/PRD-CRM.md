# L2 Module PRD — CRM: Customer service, help desk and chat

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | CRM — Customer service, help desk and chat |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Gives customers one place to ask for help and complain — by web form, e-mail, phone, WhatsApp, chat or at an outlet — and gives support staff a help desk where every request becomes a ticket that is routed, timed, escalated and audited, with a full view of the customer, internal notes, links to return and dispute cases, a knowledge base and approved ready-made answers. It also measures service quality, captures customer feedback, refers suspected fraud, and supports forums and B2B account managers. The help desk itself is a licensed plugin; the product wraps it in an adapter so it can be replaced.

**In scope**

- Help desk ticketing on the licensed plugin, with acknowledgement, assignment, statuses, attachments, customer ticket list and SLA timers (CRM-001)
- Case intake from e-mail, phone, WhatsApp, outlets and web forms; duplicate merge; full communication history (CRM-002)
- Agent 360-degree customer view with masking of sensitive data (CRM-003)
- Formal complaints process and escalation matrix (CRM-004)
- Post-resolution rating, support dashboards, complaint trends and early warnings (CRM-005)
- Internal notes, ticket-to-case links and ticket audit (CRM-006)
- Knowledge base on native topics, with approval, and approved ready-made answers (CRM-007)
- Live web chat (licensed plugin) and chat on WhatsApp Business and WeChat through the Channels pack (CRM-008)
- Native contact-us, contact-the-seller and messaging (CRM-009)
- Fraud referral cases (CRM-010), experience feedback (CRM-011), support channel directory (CRM-012), forums (CRM-013)
- Issue routing, escalation, the Report a problem entry on orders, and the SLA timer component used by CRM and RET (CRM-014)
- Named account managers for business customers (CRM-015)

**Not in this module**

| Item | Where it is |
|---|---|
| Dispute and order-issue cases that need a remedy (missing, damaged, wrong item), returns | RET module (PRD-RET-007, RET-001); CRM opens and links them |
| WhatsApp Business, WeChat and SMS channel connections | CHN module (PRD-CHN-006, CHN-007, CHN-005) |
| Multi-channel notification engine and preferences | TRK module (PRD-TRK-005, TRK-006) |
| AI chatbot | AI module (PRD-AI-003); it reads approved answers from CRM-007 |
| Content approval and policy versioning of topics | MKT module (PRD-MKT-008); CRM-007 knowledge-base articles use it |
| Product reviews | CAT module (PRD-CAT-029) |
| Payment risk rules and flags | PAY module (PRD-PAY-018); CRM-010 receives its flags |
| Block and watch lists | SEL module (PRD-SEL-013) |
| Field classification and masking across the platform | SEC module (PRD-SEC-014, P2); CRM-003 masks its own view from P1 |
| Platform audit store | SEC module (PRD-SEC-004) |
| Support dashboards in the external BI tool | RPT module (PRD-RPT-010) |
| Company accounts for business buyers | IAM module (PRD-IAM-022) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-CRM-001 | Help desk ticketing | B2B + B2C | P1 | Licensed plugin | None | Core (always on) | PRD-CRM-014 | |
| PRD-CRM-002 | Multi-channel case intake | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CRM-003 | Agent 360° view | Platform / back-office | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-CRM-004 | Complaints process | B2B + B2C | P1 | Code-level | Custom plugin | Service desk extensions pack | PRD-ADM-002, PRD-RET-007, PRD-CRM-014 | WF-ENG, T-MISS |
| PRD-CRM-005 | Support quality analytics | B2B + B2C | P1 | Code-level | Custom plugin | Analytics pack | | |
| PRD-CRM-006 | Ticket collaboration and audit | Platform / back-office | P1 | Code-level | Custom plugin | Service desk extensions pack | PRD-SEC-004 | |
| PRD-CRM-007 | Knowledge base | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-CRM-008 | Live web chat | B2B + B2C | P1 | Licensed plugin | None | Engagement and loyalty pack | PRD-CHN-006 | |
| PRD-CRM-009 | Contact and messaging | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-CRM-010 | Fraud reporting and referral | B2B + B2C | P1 | Code-level | Custom plugin | Service desk extensions pack | | |
| PRD-CRM-011 | Experience feedback | B2B + B2C | P1 | Code-level | Custom plugin | Engagement and loyalty pack | | |
| PRD-CRM-012 | Support channel directory | B2B + B2C | P2 | Code-level | Custom plugin | Service desk extensions pack | | |
| PRD-CRM-013 | Community forums | B2C | P3 | Configuration | None | Engagement and loyalty pack | | |
| PRD-CRM-014 | Issue routing and escalation | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-CRM-015 | B2B account management | B2B | P2 | Code-level | Custom plugin | B2B trade pack | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Asks questions and complains by any channel; registered shoppers see their tickets, report order problems, rate the service, give feedback | Guests / Registered (native) |
| Business buyer | Has a named account manager | Registered + B2B role (IAM-022) |
| Seller | Receives contact-the-seller messages | Vendors (native) |
| Member of support staff | Works tickets, logs calls, merges duplicates, writes internal notes, opens cases, refers fraud, uses ready-made answers | Role system name "Support" (BR-IAM-050) |
| Support manager | Sets categories, routing, time limits, escalation and early warnings; approves ready-made answers; reads dashboards; may see unmasked data | Role system name "SupportManager" (BR-IAM-050) |
| Member of outlet staff (agent) | Records questions from walk-in customers | Role system name "Agent" (BR-IAM-050, IAM-026) |
| Member of fraud staff | Reviews fraud referrals and records outcomes | Role system name "Risk" (BR-IAM-050) |
| Account manager | Serves assigned business customers and places orders for them | Role system name "AccountManager" (BR-IAM-050) |
| Forum moderator | Moderates forum posts | ForumModerators (created by the bundled Misc.Forums plugin, ForumDefaults.ForumModeratorsRoleName; Plugins/Nop.Plugin.Misc.Forums/ForumDefaults.cs:23) |
| Client administrator | Configures intake channels, help desk, knowledge base, directory, forums | Administrators (native) |
| Help-desk plugin (system) | Stores tickets, departments and messages | Licensed plugin (Nop-Templates Nop Help Desk or nopStation Helpdesk Ticket, V-01) |
| Mail server, WhatsApp, WeChat, chat provider (systems) | Deliver inbound and outbound messages | External systems via CRM-002, CHN-006, CHN-007, CRM-008 |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Support.Core.Tickets.View | Customers | View tickets, queues and ticket history | Support, SupportManager, Agent |
| Support.Core.Tickets.CreateEditDelete | Customers | Create, reply, assign, change status, log calls, merge, add internal notes, link cases | Support, SupportManager, Agent |
| Support.Core.Customer360.View | Customers | Open the agent 360-degree view with sensitive fields masked | Support, SupportManager |
| Support.Core.Customer360.ViewSensitive | Customers | Reveal masked fields in the 360-degree view (audited) | SupportManager |
| Support.Core.Routing.CreateEditDelete | Configuration | Edit categories, issue types, routing rules, SLA policies, escalation levels and matrix, intake channels, channel directory, early-warning rules | Administrators, SupportManager |
| Support.Core.Knowledge.CreateEditDelete | ContentManagement | Write knowledge-base articles and ready-made answers (drafts) | Support, SupportManager |
| Support.Core.Knowledge.Approve | ContentManagement | Approve or reject ready-made answer versions (not own drafts) | SupportManager |
| Support.Core.Analytics.View | Reports | Support dashboards, ratings, complaint trends | SupportManager, Administrators |
| Support.Core.Fraud.Refer | Customers | Refer a ticket, case or customer as suspected fraud | Support, SupportManager |
| Support.Core.Fraud.CreateEditDelete | Customers | Review fraud referrals and record outcomes | Risk |
| Support.Core.Feedback.CreateEditDelete | Customers | Review experience feedback and record actions | SupportManager, Administrators |
| Support.Core.AccountManagers.CreateEditDelete | Customers | Assign account managers to business customers | Administrators |
| Support.Core.PublicStore.Tickets | PublicStore | My tickets, Report a problem, ratings and feedback in My account | Registered |
| ContentManagement.TopicsCreateEditDelete (native) | ContentManagement | Edit topics used as knowledge-base articles (publishing goes through MKT-008 approval) | Administrators |
| Forums.Manage (bundled Misc.Forums plugin; replaces ContentManagement.ForumsCreateEditDelete in 5.00) | ContentManagement | Manage forum groups and forums | Administrators |
| Customers.CustomersImpersonation (native) | Customers | Place orders on behalf of a customer; for account managers the single IAM-026 impersonation filter allows only assigned customers, through the CRM-015 rule provider (BR-CRM-070) | Administrators (native default); AccountManager (role pack mapping, BR-IAM-053) |

Permissions are declared in a CRM plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix Support.Core and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is taken from the native set. Default roles are given by role system name; every role used here (Support, SupportManager, AccountManager, Agent, Risk) is in the IAM product role catalogue BR-IAM-050, and the IAM plugin creates catalogue roles that are missing, at install and at start (BR-IAM-050); CRM creates no role and does not rely on native start-up to create one. The native Customers.CustomersImpersonation permission is given to AccountManager by the role pack (BR-IAM-053), not by the CRM permission class. The licensed help-desk plugin brings its own permissions; under V-01 they must be IPermissionConfigManager system names of a nopCommerce 5.00 build (4.70 names grant nothing) and are mapped to the roles above. Support roles must not hold the native Customers.CustomersView permission, because the native admin customer page shows every field unmasked (BR-CRM-030). All plugin permission names are Proposed. Source: Libraries/Nop.Services/Security/StandardPermission.cs; Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.cs.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-CRM-PERM-01 | **Given** a user without Support.Core.Tickets.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-02 | **Given** a user without Support.Core.Tickets.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-03 | **Given** a user without Support.Core.Customer360.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-04 | **Given** a user without Support.Core.Customer360.ViewSensitive, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-05 | **Given** a user without Support.Core.Routing.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-06 | **Given** a user without Support.Core.Knowledge.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-07 | **Given** a user without Support.Core.Knowledge.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-08 | **Given** a user without Support.Core.Analytics.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-09 | **Given** a user without Support.Core.Fraud.Refer, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-10 | **Given** a user without Support.Core.Fraud.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-11 | **Given** a user without Support.Core.Feedback.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-12 | **Given** a user without Support.Core.AccountManagers.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-13 | **Given** a user without Support.Core.PublicStore.Tickets, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-14 | **Given** a user without ContentManagement.TopicsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-15 | **Given** a user without Forums.Manage (bundled Misc.Forums plugin; replaces ContentManagement.ForumsCreateEditDelete in 5.00), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CRM-PERM-16 | **Given** a user without Customers.CustomersImpersonation (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-CRM-001 | No native help desk/ticketing in 4.90.8 (no ticket entity in Domain). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No ticket entity under src/Libraries/Nop.Core/Domain; PG CNT-02 (NT); Plugin evaluation] | Nop-Templates Nop Help Desk (in use on PG) or nopStation Helpdesk Ticket. Availability of a 5.00 build of this licensed vendor plugin is not verifiable from source (decision V-01). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in Post Gebeya (4.70.5) — confirm on 5.00.1 |
| PRD-CRM-002 | ContactUs form -> QueuedEmail (unchanged). New in 5.00: configurable contact-form attributes (ContactFormAttribute/ContactFormAttributeValue, Libraries/Nop.Core/Domain/Common/ContactFormAttribute.cs; parsing in Presentation/Nop.Web/Controllers/CommonController.cs:110; admin ContactFormAttributeController). No email-to-ticket, phone/WhatsApp/outlet intake, de-duplication (not found in 5.00.1 source). | Multi-channel intake adapters (mailbox polling, call logging form, WhatsApp via CHN-006, outlet entry) and merge, on the CRM-001 help desk base. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CRM-003 | Admin customer edit page: info, addresses, orders, current cart/wishlist, activity log, reward points, back-in-stock, impersonation. No payments/tracking/tickets/disputes in one view, no masking. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.Edit; src/Presentation/Nop.Web/Areas/Admin/Factories/CustomerModelFactory; PG ADM-S05] | Agent 360 view aggregating help-desk tickets, disputes, payments and tracking with field masking (SEC-014). | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CRM-004 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No complaint entity in src/Libraries/Nop.Core/Domain] | Formal complaints workflow and escalation per client policy (Malawi Post policy not provided). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no complaint types in Domain/Services |
| PRD-CRM-005 | None (no CSAT, no support dashboards). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No survey/CSAT entity in src/Libraries/Nop.Core/Domain] | CSAT survey after ticket close, support dashboards, complaint trends, early-warning thresholds. Scope: Post-resolution rating with optional comment feeding dashboards. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: Polls exist but are not tied to tickets |
| PRD-CRM-006 | Depends on help desk plugin; native ActivityLog records admin actions without ticket linkage. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Logging/ActivityLog.cs; PG CNT-02] | Internal notes, ticket-dispute links, full action history on the CRM-001 base. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CRM-007 | Topics (localized, ACL, store-limited, published, password, IncludeInSitemap) serve as FAQ/help pages. No approval step, no agent canned responses. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Topics/Topic.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/TopicController.cs; PG STF-30] | Article approval workflow (shared with MKT-008), KB categories/search, canned responses for agents. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CRM-008 | No native staff live chat. New bundled Widgets.Jotform ('Jotform AI agent widget') renders an admin-entered EmbedCode as raw HTML in body_end_html_tag_before (Plugins/Nop.Plugin.Widgets.Jotform/Components/WidgetJotformViewComponent.cs:38-41; JotformPlugin.cs:52); intended for a Jotform AI agent (bot), not staff chat. SeoSettings.CustomHeadTags still available. | Tawk.to via Nop-Plus plugin as on PG. Availability of a 5.00 build of this licensed vendor plugin is not verifiable from source (decision V-01). Inference (not verified in a running store): a chat provider's script could be placed in CustomHeadTags or the Jotform EmbedCode field without the vendor plugin. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in Post Gebeya (4.70.5) — confirm on 5.00.1 |
| PRD-CRM-009 | Contact us (CommonController.ContactUs) now with configurable ContactFormAttribute fields (5.00), contact vendor (VendorSettings.AllowCustomersToContactVendors), private messages (PrivateMessage moved from Forums to Customers domain (Libraries/Nop.Core/Domain/Customers/PrivateMessage.cs) with PrivateMessageSettings (AllowPrivateMessages, NotifyAboutPrivateMessages, ShowAlertForPM; Libraries/Nop.Core/Domain/Customers/PrivateMessageSettings.cs); public PrivateMessagesController stays in core (Presentation/Nop.Web/Controllers/PrivateMessagesController.cs).), admin CustomerController.SendPm/SendEmail (Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.cs:1018,1066), order notes visible to customer. | Private messages are flat PMs, not shop-managed conversation threads; if threaded inbox is required, reuse CRM-001 help desk. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CRM-010 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No fraud entity in src/Libraries/Nop.Core/Domain] | Fraud report intake, referral routing to fraud team, case record. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no fraud types in Domain/Services |
| PRD-CRM-011 | Product reviews (ProductReview) in core; Polls moved out of core into bundled plugin Misc.Polls (Plugins/Nop.Plugin.Misc.Polls). No service/experience feedback (not found in 5.00.1 source). | Experience feedback capture (post-order/post-ticket), staff action tracking. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CRM-012 | Static channel list possible in a Topic; no waiting-time data. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Topics/Topic.cs] | Support channel directory widget with live/expected waiting times from help desk/chat. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CRM-013 | Forums moved out of core into bundled plugin Misc.Forums (Plugins/Nop.Plugin.Misc.Forums: Domain/Forum.cs, ForumGroup.cs, ForumTopic.cs, ForumPost.cs, ForumSubscription.cs; ForumDefaults.ForumModeratorsRoleName :23; plugin.json SupportedVersions 5.00). Core Domain/Forums, admin ForumController and public BoardsController removed. | None beyond installing the bundled Misc.Forums plugin; currently switched off on PG. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CRM-014 | None natively; help desk plugin offers departments. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: PG CNT-02] | Category-based auto-routing, tiered escalation rules, customer 'report a problem' on order page. Scope: Ticket auto-populated with order details when raised from an order. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in Post Gebeya (4.70.5) — confirm on 5.00.1 |
| PRD-CRM-015 | Admin impersonation (Place order on behalf): CustomerController.Impersonate, permission Customers.CustomersImpersonation. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.Impersonate; src/Libraries/Nop.Services/Security/StandardPermission.Customers.CUSTOMERS_IMPERSONATION] | Named account manager assignment per B2B customer, restriction of impersonation to assigned manager, audit. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-CRM-001 Help desk ticketing

| Item | Value |
|---|---|
| Description (baseline) | A help desk where customer questions and problems become tickets, assigned to departments with status, deadlines and attachments; customers see their own tickets and get an automatic acknowledgement. |
| Why it matters | No customer request gets lost. |
| Who benefits | Shoppers; support staff |
| Phase | P1 |
| Implementation | Licensed plugin — None |
| Depends on | PRD-CRM-014 |
| Status | Ready; conditions: SINGLE-FILTER, MSG-ROUTE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-001-01 | As a shopper, I want to send a question or complaint and get an automatic acknowledgement with a ticket number, so that I know my request was received and what happens next. | D; REQ-MPC-FR-271; FC-M18-003 | Ready; conditions: SINGLE-FILTER, MSG-ROUTE |
| US-CRM-001-02 | As a member of support staff, I want every request to be a ticket assigned to a department or agent, with a status and a deadline, so that no customer request gets lost. | D; REQ-MPC-FR-252 | Ready; conditions: SINGLE-FILTER, MSG-ROUTE |
| US-CRM-001-03 | As a shopper, I want to see my tickets and their status in my account, so that I can follow my request without calling. | D; REQ-MPC-FR-264; FC-M18-007 | Ready; conditions: SINGLE-FILTER, MSG-ROUTE |
| US-CRM-001-04 | As a shopper, I want to attach files to my ticket, so that I can show the problem. | D; REQ-MPC-FR-265 | Ready; conditions: SINGLE-FILTER, MSG-ROUTE |
| US-CRM-001-05 | As a client administrator, I want to set support service levels and what happens when they are missed, so that tickets are answered on time. | REQ-MPC-FR-311 | Ready; conditions: SINGLE-FILTER, MSG-ROUTE |
| US-CRM-001-06 | Technical enabler. As a member of the platform team, I want all CRM features to use the help desk through one product adapter, so that the licensed plugin can be replaced without changing CRM features. | Proposed; V-01 | Ready; conditions: SINGLE-FILTER, MSG-ROUTE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-001-01-01 | US-CRM-001-01 | **Given** the help desk is installed and the ticket form is published, **when** a shopper submits category, subject, description and optionally an order, **then** a ticket is created with a unique number and status New (SM-CRM-01), routed by CRM-014, and the acknowledgement is sent through TRK-005 as the CRM event code Ticket.Created (IC-TRK-04 SendEvent) with the ticket number, the expected response time from the SLA policy and how to follow up; message Crm.TicketCreated is shown. | REQ-MPC-FR-271; FC-M18-003; MSG-ROUTE |
| AC-CRM-001-01-02 | US-CRM-001-01 | **Given** an acknowledgement time window is configured (value not stated), **when** a ticket is created through any intake channel (CRM-002), **then** the acknowledgement is queued at creation and sent within the window; a send failure is retried and logged through TRK-007. | REQ-MPC-FR-271 |
| AC-CRM-001-02-01 | US-CRM-001-02 | **Given** a ticket is New, **when** support staff assign it to an agent or a department, **then** the assignment is stored, the assignee is notified and the change is audited (AUD-CRM-001). | REQ-MPC-FR-252 |
| AC-CRM-001-02-02 | US-CRM-001-02 | **Given** a ticket exists, **when** its status changes, **then** only the transitions of SM-CRM-01 are allowed; the adapter maps each product status to the status of the licensed plugin. | REQ-MPC-FR-252; Proposed |
| AC-CRM-001-02-03 | US-CRM-001-02 | **Given** SLA policies exist for first response and resolution by category and priority (values not stated), **when** a ticket is created, **then** timers start in the SLA component (CRM-014); the due times are shown on the ticket and in the queue; a missed due time marks the ticket Breached and escalates it (BR-CRM-010). | REQ-MPC-FR-252 |
| AC-CRM-001-02-04 | US-CRM-001-02 | **Given** a ticket is Resolved and the customer does not reply within the auto-close period (setting, default not stated), **when** the close task runs, **then** the ticket becomes Closed. | FIT (PG CNT-02 auto-close); Proposed |
| AC-CRM-001-03-01 | US-CRM-001-03 | **Given** a registered shopper has tickets, **when** they open My account, My tickets, **then** each ticket shows number, subject, status, last update and the conversation without internal notes. | REQ-MPC-FR-264; FC-M18-007 |
| AC-CRM-001-03-02 | US-CRM-001-03 | **Given** a shopper calls the ticket page of another customer, **when** the request is processed, **then** access is denied and nothing is shown. | Proposed |
| AC-CRM-001-03-03 | US-CRM-001-03 | **Given** a ticket is AwaitingCustomer, **when** the shopper replies, **then** the ticket becomes Open and the resolution timer resumes. | Proposed |
| AC-CRM-001-04-01 | US-CRM-001-04 | **Given** the ADM-008 upload policy for the upload context "ticket attachment" (registered by the CRM plugin with ADM-008) sets allowed file types and maximum size (values not stated), **when** a shopper or agent uploads a file of a type or size outside that policy, **then** ADM-008 refuses it with message Adm.UploadTypeNotAllowed or Adm.UploadTooLarge before anything is stored; CRM keeps no file-type or size check of its own (BR-CRM-005). | REQ-MPC-FR-265; SINGLE-FILTER |
| AC-CRM-001-04-02 | US-CRM-001-04 | **Given** the maximum number of files per ticket is configured (CRM setting, value not stated), **when** a shopper or agent adds a file above that number, **then** the file is refused with message Crm.AttachmentLimit and nothing is stored. | REQ-MPC-FR-265 |
| AC-CRM-001-04-03 | US-CRM-001-04 | **Given** the V-01 test finds that the help desk stores attachments as native Download records served through Nop.Web DownloadController.GetFileUpload or Admin DownloadController.DownloadFile, **when** anyone requests a ticket attachment by its GUID, **then** the single SEC-002 ownership filter (BR-SEC-005) asks the CRM rule provider, which allows the ticket customer and staff holding Support.Core.Tickets.View; anyone else is refused by the SEC-002 filter and nothing is served (BR-CRM-005). | SINGLE-FILTER; Proposed; FIT (GetFileUpload and Admin DownloadFile serve any Download by GUID) |
| AC-CRM-001-05-01 | US-CRM-001-05 | **Given** support service-level standards and their escalation actions are configured, **when** a ticket misses a standard, **then** the configured action runs (notify, raise priority, move to the next level) and is written to the ticket history. | REQ-MPC-FR-311 |
| AC-CRM-001-06-01 | US-CRM-001-06 | **Given** the licensed help desk (or its alternative) is installed with its adapter, **when** CRM-002, CRM-003, CRM-006 or CRM-014 create, read, update or link tickets, **then** they call only the adapter operations of IC-CRM-01; replacing the plugin requires a new adapter and no change to those features. | Proposed; V-01 |
| AC-CRM-001-06-02 | US-CRM-001-06 | **Given** RPT-003 configures the help-desk datasets, **when** the RPT export task reads them, **then** it reads only the read-only extract views of IC-CRM-05 (tickets with TicketExt, message metadata, status history, ratings, fraud referrals, call logs), never the licensed plugin tables directly; replacing the plugin keeps the view columns unchanged. | Proposed (see RPT-003 (REQ-MPC-FR-275)) |
| AC-CRM-001-06-03 | US-CRM-001-06 | **Given** the nopCommerce 5.00 build of the chosen plugin is installed on release-5.00.1 for the V-01 test, **when** the V-01 checklist runs (departments, assignment, statuses, attachments with limits, customer ticket list, e-mails, auto-close, IPermissionConfigManager permission names, writes through the async IRepository<> members — the synchronous Insert, Update, Delete, GetById and GetAll were removed in 5.00, Libraries/Nop.Data/IRepository.cs), **then** each item passes or is listed as a build item of the CRM extension. | V-01; FIT (PG CNT-02) |

**Business rules applied:** BR-CRM-001; BR-CRM-002; BR-CRM-005; BR-CRM-010; BR-CRM-080 (§8.1).


### 7.2 PRD-CRM-002 Multi-channel case intake

| Item | Value |
|---|---|
| Description (baseline) | Questions arriving by email, phone, WhatsApp or in person at an outlet also become tickets in the same system, duplicates are merged, and all communication is kept with the ticket. |
| Why it matters | Support sees every contact, whatever the channel. |
| Who benefits | Support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: MSG-ROUTE, CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-002-01 | As a member of support staff, I want e-mails to the support address to become tickets, so that e-mail requests are tracked like any other. | D; REQ-MPC-FR-253 | Ready; conditions: MSG-ROUTE, CFG-01 |
| US-CRM-002-02 | As a member of support staff, I want to log phone calls as new tickets or on existing tickets, so that calls are part of the record. | D; REQ-MPC-FR-253; REQ-MPC-FR-260 | Ready; conditions: MSG-ROUTE, CFG-01 |
| US-CRM-002-03 | As a member of support staff, I want WhatsApp messages to become tickets and replies to go back on WhatsApp, so that I answer customers where they write. | D; FC-M18-002 | Ready; conditions: MSG-ROUTE, CFG-01 |
| US-CRM-002-04 | As a member of outlet staff, I want to record a walk-in customer's question as a ticket, so that outlet questions are followed up. | D; FC-M18-002 | Ready; conditions: MSG-ROUTE, CFG-01 |
| US-CRM-002-05 | As a member of support staff, I want duplicate tickets to be merged, so that the same request is not worked twice. | D | Ready; conditions: MSG-ROUTE, CFG-01 |
| US-CRM-002-06 | As a member of support staff, I want every message, call and e-mail kept in the ticket history, so that I see the whole conversation. | D; REQ-MPC-FR-260 | Ready; conditions: MSG-ROUTE, CFG-01 |
| US-CRM-002-07 | As a shopper, I want my contact-us form to become a ticket, so that I can follow it like any other request. | REQ-MPC-FR-253 | Ready; conditions: MSG-ROUTE, CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-002-01-01 | US-CRM-002-01 | **Given** a support mailbox is configured (connection and credentials entered per client instance, encrypted, never in packs), **when** the mailbox task reads a new e-mail, **then** a ticket is created with channel E-mail, the sender matched to a customer by e-mail address, and attachments stored within the CRM-001 limits, each file first checked through IC-ADM-08 CheckUpload with the ticket attachment context (BR-CRM-005, BR-ADM-060); e-mails whose subject carries an existing ticket number are added to that ticket. | REQ-MPC-FR-253; CFG-01 |
| AC-CRM-002-01-02 | US-CRM-002-01 | **Given** an incoming e-mail is an automatic reply or a delivery failure (by its headers), **when** the mailbox task reads it, **then** no ticket is created and the message is logged. | Proposed |
| AC-CRM-002-01-03 | US-CRM-002-01 | **Given** the same e-mail is read twice (same Message-ID), **when** the mailbox task runs on any node, **then** only one ticket or message results (BR-CRM-003). | Proposed |
| AC-CRM-002-02-01 | US-CRM-002-02 | **Given** an agent takes a call, **when** the agent fills the call form (caller, phone, category, notes, duration) and chooses new or existing ticket, **then** the call is stored as a ticket entry with channel Phone, actor and time. | REQ-MPC-FR-253; REQ-MPC-FR-260 |
| AC-CRM-002-03-01 | US-CRM-002-03 | **Given** WhatsApp Business is connected through CHN-006, **when** a customer message arrives, **then** it creates a ticket with channel WhatsApp or is added to the customer's open WhatsApp ticket; agent replies on the ticket are conversational replies sent back through IC-CHN-04 SendReply, outside TRK-005, only after the TRK-006 opt-out record for that number and channel is checked (BR-CRM-004). | D; FC-M18-002; MSG-ROUTE |
| AC-CRM-002-03-02 | US-CRM-002-03 | **Given** the customer's number is opted out of WhatsApp in TRK-006 (including a number without an account), **when** an agent sends a reply on the WhatsApp ticket, **then** no message is sent, the reply stays on the ticket as not delivered and the agent sees message Crm.RecipientOptedOut (BR-CRM-004). | MSG-ROUTE; Proposed |
| AC-CRM-002-04-01 | US-CRM-002-04 | **Given** an agent works at an outlet (IAM-026), **when** the agent records a walk-in question for a customer, **then** a ticket is created with channel Outlet and the outlet and agent recorded. | D; FC-M18-002 |
| AC-CRM-002-05-01 | US-CRM-002-05 | **Given** two tickets belong to the same request, **when** an agent merges the source into the target, **then** the target keeps all messages, attachments and history of both, the source becomes Merged with a link to the target, and the merge is audited (AUD-CRM-002). | D |
| AC-CRM-002-05-02 | US-CRM-002-05 | **Given** a new ticket has the same customer, order and category as an open ticket created within the duplicate window (setting, default not stated), **when** the ticket is created, **then** both tickets are flagged with message Crm.PossibleDuplicate for an agent to decide; nothing is merged automatically. | Proposed |
| AC-CRM-002-06-01 | US-CRM-002-06 | **Given** a ticket exists, **when** any inbound or outbound message, call log, chat transcript (CRM-008), outlet note or notification e-mail about it is created, **then** it is stored in the ticket history with channel, time and author, and is shown in time order. | REQ-MPC-FR-260 |
| AC-CRM-002-07-01 | US-CRM-002-07 | **Given** contact-to-ticket is on and the help desk is active, **when** a shopper submits the native contact-us form successfully (ContactUsModel.SuccessfullySent), **then** a CRM action filter on CommonController.ContactUsSend [POST] creates a ticket with channel Web form through IC-CRM-01; the native Service.ContactUs e-mail is still sent. | REQ-MPC-FR-253; FIT (5.00.1: CommonController.ContactUsSend(model, captchaValid, IFormCollection form), Presentation/Nop.Web/Controllers/CommonController.cs:276-300; the filter reads the model after the action and needs no form parameter of its own) |
| AC-CRM-002-07-02 | US-CRM-002-07 | **Given** the client defines contact-form attributes on the contact-us form (native since 5.00: ContactFormAttribute and its values, admin Contact form attributes page under Configuration.ManageSettings), for example order number and issue category, **when** a shopper submits the contact-us form with them, **then** required attributes are validated by the native action, their values are added to the native Service.ContactUs e-mail, and the CRM contact-to-ticket filter copies each attribute name and value into the ticket fields mapped in the CRM settings (unmapped attributes go into the ticket description). | VER-500; FIT (5.00.1: Libraries/Nop.Core/Domain/Common/ContactFormAttribute.cs:8; Presentation/Nop.Web/Controllers/CommonController.cs:110, 276-292; Libraries/Nop.Services/Messages/MessageTokenProvider.cs:1004; Presentation/Nop.Web/Areas/Admin/Controllers/ContactFormAttributeController.cs:85); Proposed (mapping) |

**Business rules applied:** BR-CRM-001; BR-CRM-003; BR-CRM-004; BR-CRM-005 (§8.1).


### 7.3 PRD-CRM-003 Agent 360° view

| Item | Value |
|---|---|
| Description (baseline) | One screen for support agents showing a customer's profile, orders, payments, tracking, tickets and disputes, with sensitive personal details hidden. |
| Why it matters | Agents solve problems in one call. |
| Who benefits | Support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready; conditions: ONE-RECORD |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-003-01 | As a member of support staff, I want one screen with a customer's profile, orders, payments, tracking, tickets, returns and disputes, so that I can solve the problem in one call. | D; REQ-MPC-FR-254; REQ-MPC-FR-211 | Ready; conditions: ONE-RECORD |
| US-CRM-003-02 | As a support manager, I want agents to see sensitive personal data only when their role allows it, so that customer data is protected. | D; REQ-MPC-FR-263 | Ready; conditions: ONE-RECORD |
| US-CRM-003-03 | As a member of support staff, I want to see the customer's consent and terms-acceptance history, so that I can resolve consent questions. | REQ-MPC-FR-022 | Ready; conditions: ONE-RECORD |
| US-CRM-003-04 | As a member of support staff, I want to track and trace a customer's order linked to its delivery from the same view, so that I can answer "where is my order" at once. | Inference from REQ-MPC-ORD-001 (support staff read as stakeholders) | Ready; conditions: ONE-RECORD |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-003-01-01 | US-CRM-003-01 | **Given** a user has Support.Core.Customer360.View, **when** they search by name, e-mail, phone, order number or ticket number and open a customer, **then** the view shows profile (name, contact, roles, registration date, active flag), orders with order, payment and shipping status, PAY transactions and refunds, the tracking timeline (TRK-002), the notification log (TRK-007), tickets (IC-CRM-01), returns and dispute cases (IC-RET-01) on one page. | REQ-MPC-FR-254; REQ-MPC-FR-211 |
| AC-CRM-003-01-02 | US-CRM-003-01 | **Given** a support query is about one order, **when** the agent opens that order from the view, **then** the order status, the payment status with the latest PAY transaction status and the latest tracking event are shown together. | REQ-MPC-FR-211 |
| AC-CRM-003-01-03 | US-CRM-003-01 | **Given** the view is open, **when** the agent wants to refund, cancel or edit, **then** the view offers links to the owning screens, which apply their own permissions; the view itself changes nothing. | Proposed |
| AC-CRM-003-02-01 | US-CRM-003-02 | **Given** a field is classed sensitive in the CRM masking list (setting; list not stated) and the user lacks Support.Core.Customer360.ViewSensitive, **when** the view is shown, **then** the value is masked; when SEC-014 is live its masking rule is used. | REQ-MPC-FR-263 |
| AC-CRM-003-02-02 | US-CRM-003-02 | **Given** a user with Support.Core.Customer360.ViewSensitive reveals a masked field, **when** the field is revealed, **then** the reveal is audited with user, customer, field and time (AUD-CRM-003). | REQ-MPC-FR-263; Proposed |
| AC-CRM-003-02-03 | US-CRM-003-02 | **Given** an agent role has Support.Core.Customer360.View but not the native Customers.CustomersView, **when** the agent calls the native admin customer edit page, **then** access is denied, so masking cannot be bypassed (BR-CRM-030). | REQ-MPC-FR-263; FIT (native CustomerController.Edit shows all fields) |
| AC-CRM-003-03-01 | US-CRM-003-03 | **Given** the customer has consent records (native GdprLog ConsentAgree / ConsentDisagree) and terms-acceptance records per policy version (IAM-016), and the agent role holds Identity.Core.ConsentTrail.View (IAM), **when** the agent opens the consent tab, **then** the entries are read through IC-IAM-05 GetConsentTrail (IAM is the single owner of acceptance and consent records, decision ONE-RECORD) and listed read-only with date, consent or policy version and action; CRM stores no copy. | REQ-MPC-FR-022; FIT (GdprLog; GdprSettings.LogPrivacyPolicyConsent); ONE-RECORD |
| AC-CRM-003-04-01 | US-CRM-003-04 | **Given** an order has shipments, **when** the agent opens its tracking from the view, **then** the tracking timeline (TRK-002 events, carrier, proof of delivery) linked to each shipment is shown. | Inference from REQ-MPC-ORD-001 (support staff read as stakeholders) |

**Business rules applied:** BR-CRM-030 (§8.1).


### 7.4 PRD-CRM-004 Complaints process

| Item | Value |
|---|---|
| Description (baseline) | A formal complaints process that follows the complaints and dispute-resolution policy, with a clear escalation path. (The Malawi Post policy has not been provided yet.) |
| Why it matters | Complaints are handled consistently and as policy requires. |
| Who benefits | Shoppers; support managers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002, PRD-RET-007, PRD-CRM-014 |
| Status | On hold: WF-ENG, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-004-01 | As a shopper, I want to submit a formal complaint through a standard process, so that my complaint is handled as the policy says. | D; REQ-MPC-FR-269 | On hold: WF-ENG, T-MISS |
| US-CRM-004-02 | As a client administrator, I want to configure the complaints escalation matrix with internal steps and external escalation points, so that complaints escalate as policy requires. | D; REQ-MPC-FR-270 | On hold: WF-ENG, T-MISS |
| US-CRM-004-03 | As a support manager, I want complaints about a transaction to be linked to a dispute case, so that the remedy follows the dispute process. | Proposed (depends on RET-007, workbook) | On hold: WF-ENG, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-004-01-01 | US-CRM-004-01 | **Given** the complaint form fields and steps of the client policy are configured, **when** a shopper submits a complaint, **then** a ticket of type Complaint is created with a complaint reference, acknowledged as in CRM-001 and routed to the complaints queue; for Malawi Post the fields and steps follow its Complaints and ADR Policy — held by T-MISS (policy not provided). | REQ-MPC-FR-269; T-MISS |
| AC-CRM-004-01-02 | US-CRM-004-01 | **Given** a complaint ticket is open, **when** staff try to close it, **then** closing needs a recorded outcome and a customer notification; otherwise it is refused with message Crm.ComplaintOutcomeRequired. | Proposed |
| AC-CRM-004-02-01 | US-CRM-004-02 | **Given** matrix levels are configured per complaint category (level, target team or external body, trigger by time or by hand), **when** a complaint is escalated, **then** it moves to the next level, the target is notified and the escalation is audited (AUD-CRM-005). | REQ-MPC-FR-270 |
| AC-CRM-004-02-02 | US-CRM-004-02 | **Given** the next level of a complaint is an external regulator, **when** the complaint is escalated to it, **then** the submission goes through INT-009 with second-person approval (BR-INT-040) and its reference is stored on the ticket. | REQ-MPC-FR-270; Proposed (INT-009) |
| AC-CRM-004-02-03 | US-CRM-004-02 | **Given** the matrix is changed, **when** it is saved, **then** who, when, old and new values are audited (AUD-CRM-004). | Proposed |
| AC-CRM-004-01-03 | US-CRM-004-01 | **Given** a complaint names a seller, **when** the complaint ticket is created, **then** the seller is stored on the ticket and the module event Complaint.Created (ticket, seller, category) is published once after the ticket is saved; SEL-020 notifies the seller from it (the consumer only enqueues); SEL-011 reads complaint counts per seller and period through IC-CRM-05 GetComplaintCounts. | Proposed (SEL-011, SEL-020) |
| AC-CRM-004-03-01 | US-CRM-004-03 | **Given** a complaint concerns a transaction remedy, **when** staff open a dispute case from it, **then** a RET-007 case is opened through IC-RET-01 and linked to the complaint both ways (CRM-006). | Proposed |

**Business rules applied:** BR-CRM-010 (§8.1).


### 7.5 PRD-CRM-005 Support quality analytics

| Item | Value |
|---|---|
| Description (baseline) | Customer satisfaction scores, support dashboards, complaint trends and early warnings. Customers are asked to rate the service, with an optional comment, after their ticket is resolved, and these scores feed the dashboards. |
| Why it matters | Shows where service needs to improve. |
| Who benefits | Support managers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-005-01 | As a shopper, I want to rate the service with an optional comment after my ticket is resolved, so that the client knows how well I was helped. | D; REQ-MPC-FR-261 | Ready |
| US-CRM-005-02 | As a support manager, I want dashboards of ticket volume, resolution time and missed deadlines by queue and agent, so that I see where service needs to improve. | D; REQ-MPC-FR-262 | Ready |
| US-CRM-005-03 | As a support manager, I want complaint trends and early warnings, so that I act before problems grow. | D; FC-M18-012 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-005-01-01 | US-CRM-005-01 | **Given** a ticket becomes Resolved, **when** the resolution notification is sent, **then** it carries a rating link; the shopper picks a rating on the configured scale (setting; scale not stated) and may add a comment; one rating is stored per ticket with ticket, agent and department. | REQ-MPC-FR-261 |
| AC-CRM-005-01-02 | US-CRM-005-01 | **Given** a ticket already has a rating, **when** the shopper opens the rating link again, **then** message Crm.AlreadyRated is shown and nothing is stored. | Proposed |
| AC-CRM-005-01-03 | US-CRM-005-01 | **Given** the rating link is older than the rating window (setting, default not stated), **when** the shopper opens it, **then** message Crm.RatingExpired is shown and nothing is stored. | Proposed |
| AC-CRM-005-02-01 | US-CRM-005-02 | **Given** a user has Support.Core.Analytics.View, **when** they open the support dashboard for a period, **then** it shows tickets created and resolved, first-response and resolution times, SLA breaches (count and share) and average rating, each by queue and by agent, with filters for channel and category, and an Excel export. | REQ-MPC-FR-262; FC-M18-013 |
| AC-CRM-005-03-01 | US-CRM-005-03 | **Given** complaint tickets exist, **when** the manager opens the complaint trend view, **then** complaints by category are shown over time for the period chosen. | D; FC-M18-012 |
| AC-CRM-005-03-02 | US-CRM-005-03 | **Given** an early-warning rule "complaints in category C within period P above T" is active (values configured; not stated), **when** the daily task finds T exceeded, **then** support managers are notified with the category, count and period. | D; Proposed |

**Business rules applied:** BR-CRM-040 (§8.1).


### 7.6 PRD-CRM-006 Ticket collaboration and audit

| Item | Value |
|---|---|
| Description (baseline) | Agents leave internal notes, link tickets to disputes, and every action on a ticket is recorded. |
| Why it matters | Teamwork and accountability in support. |
| Who benefits | Support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEC-004 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-006-01 | As a member of support staff, I want to write internal notes on a ticket that the customer never sees, so that we can work together on a case. | D; REQ-MPC-FR-272 | Ready |
| US-CRM-006-02 | As a member of support staff, I want to create a dispute or return case from a ticket, with links both ways, so that the case and the ticket stay connected. | D; REQ-MPC-FR-268 | Ready |
| US-CRM-006-03 | As a support manager, I want every change to a ticket logged with who did it and when, so that we are accountable. | D; REQ-MPC-FR-274 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-006-01-01 | US-CRM-006-01 | **Given** a ticket exists, **when** an agent adds an internal note, **then** the note is visible to staff only, and never appears on the customer pages, in customer e-mails or in data returned to the customer. | REQ-MPC-FR-272 |
| AC-CRM-006-01-02 | US-CRM-006-01 | **Given** a ticket has internal notes, **when** the customer opens it in My account, **then** the page and its data contain no internal note. | REQ-MPC-FR-272 |
| AC-CRM-006-02-01 | US-CRM-006-02 | **Given** a ticket concerns an order, **when** an agent chooses Create case, **then** a RET-007 case is opened through IC-RET-01 with the ticket ID; the case shows the ticket link and the ticket shows the case link and status. | REQ-MPC-FR-268 |
| AC-CRM-006-02-02 | US-CRM-006-02 | **Given** a return request or a case already exists (for example opened by PAY), **when** an agent links it to a ticket, **then** the link is shown on both records. | REQ-MPC-FR-268 |
| AC-CRM-006-03-01 | US-CRM-006-03 | **Given** any change is made to a ticket (status, assignment, priority, category, fields, notes, merge), **when** it is saved, **then** an audit record with actor, time, old and new values is written through the SEC-004 audit trail (AUD-CRM-001); if the licensed plugin writes without IRepository<>, the adapter writes the audit record itself (V-01 check). | REQ-MPC-FR-274; FIT (NFR-X-003) |
| AC-CRM-006-03-02 | US-CRM-006-03 | **Given** a user with Support.Core.Tickets.View opens a ticket, **when** they open its history, **then** all audit entries of the ticket are listed in time order. | REQ-MPC-FR-274 |

**Business rules applied:** BR-CRM-020 (§8.1).


### 7.7 PRD-CRM-007 Knowledge base

| Item | Value |
|---|---|
| Description (baseline) | A library of help articles and FAQs, approved before publishing, plus ready-made answers for agents. |
| Why it matters | Customers help themselves, and agents answer consistently. |
| Who benefits | Shoppers; support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-007-01 | As a shopper, I want help articles and FAQs in the shop, so that I can help myself. | D; REQ-MPC-FR-255 | Ready |
| US-CRM-007-02 | As a support manager, I want knowledge-base articles approved before they are published, so that published guidance is accurate and follows policy. | D; REQ-MPC-FR-273 | Ready |
| US-CRM-007-03 | As a member of support staff, I want approved ready-made answers with versions, that chat, WhatsApp and the chatbot use too, so that answers are consistent everywhere. | D; REQ-MPC-FR-256 | Ready |
| US-CRM-007-04 | As a shopper, I want to find articles by category and by search, so that I find an answer quickly. | FIT (gap: KB categories and search) | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-007-01-01 | US-CRM-007-01 | **Given** topics marked as knowledge-base articles are published, **when** a shopper opens the help centre, **then** articles are listed by knowledge-base category; each opens as a native Topic page (localised, ACL and store limits applied). | REQ-MPC-FR-255; FIT (Topic) |
| AC-CRM-007-02-01 | US-CRM-007-02 | **Given** an editor submits a new or changed knowledge-base article, **when** it is submitted, **then** a ContentRevision of type Topic is created through the MKT-008 revision handler (IC-MKT-02) and the article is not visible to shoppers until the revision is Approved (SM-MKT-01) by an approver other than the author; CRM keeps no approval flow of its own for articles. | REQ-MPC-FR-273 |
| AC-CRM-007-02-02 | US-CRM-007-02 | **Given** an approver rejects an article, **when** the rejection is saved, **then** the article stays unpublished and the reason is shown to the author. | REQ-MPC-FR-273 |
| AC-CRM-007-03-01 | US-CRM-007-03 | **Given** a ready-made answer is written, **when** the author saves it, **then** a new version is stored as Draft (SM-CRM-04); a user with Support.Core.Knowledge.Approve who is not the author approves it, and only the latest Approved version can be used. | REQ-MPC-FR-256 |
| AC-CRM-007-03-02 | US-CRM-007-03 | **Given** an approved answer exists, **when** an agent inserts it into a ticket reply, **then** placeholders (for example customer name and order number) are filled from the ticket, and the version used is recorded on the message. | REQ-MPC-FR-256; Proposed |
| AC-CRM-007-03-03 | US-CRM-007-03 | **Given** approved answers exist, **when** CRM-008 chat, CHN-006 WhatsApp replies or the AI-003 chatbot request answers through IC-CRM-02, **then** only Approved versions in the requested language are returned. | REQ-MPC-FR-256 |
| AC-CRM-007-03-04 | US-CRM-007-03 | **Given** a question appears in the AI-003 unanswered list, **when** a user with Support.Core.Knowledge.CreateEditDelete follows its link, **then** a new ready-made answer, or a new Draft version of the linked answer, opens with the question text filled in; it follows SM-CRM-04 and is returned to the chatbot only after approval. | Proposed (BR-AI-001) |
| AC-CRM-007-03-05 | US-CRM-007-03 | **Given** an answer has several versions, **when** a user opens its history, **then** all versions with author, approver and dates are shown. | REQ-MPC-FR-256 |
| AC-CRM-007-04-01 | US-CRM-007-04 | **Given** articles are published in the shopper's language, **when** the shopper searches the help centre by keyword, **then** matching published articles are listed; articles limited by ACL or store are not. | FIT (gap); Proposed |

**Business rules applied:** BR-CRM-050 (§8.1).


### 7.8 PRD-CRM-008 Live web chat

| Item | Value |
|---|---|
| Description (baseline) | A live chat window on the website where customers chat with staff. |
| Why it matters | Instant help while shopping. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Licensed plugin — None |
| Depends on | PRD-CHN-006 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-008-01 | As a shopper, I want to chat live with staff on the website, so that I get instant help while shopping. | D; REQ-KTDA-CHT-001 | Ready |
| US-CRM-008-02 | As a KTDA customer, I want to chat with KTDA through WhatsApp Business and WeChat, so that I use the app I already have. | REQ-KTDA-CHT-001 | Ready |
| US-CRM-008-03 | As a member of support staff, I want chat transcripts kept with the customer's ticket, so that the conversation is not lost. | Proposed | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-008-01-01 | US-CRM-008-01 | **Given** the chat plugin (Tawk.to through Nop-Plus, V-01) is configured with the client's chat account, **when** a shopper opens a storefront page, **then** the chat widget is shown; a message reaches online staff; when no staff are online the message is stored and creates a ticket (CRM-002). | REQ-KTDA-CHT-001; FIT (PG STF-06) |
| AC-CRM-008-01-02 | US-CRM-008-01 | **Given** the licensed chat plugin is not available for nopCommerce 5.00 (V-01), **when** the client still wants web chat, **then** the chat provider script is inserted through SeoSettings.CustomHeadTags without a plugin and the widget behaves as above, except that tickets are created from the provider's e-mail transcripts (CRM-002). | FIT (SeoSettings.CustomHeadTags) |
| AC-CRM-008-01-03 | US-CRM-008-01 | **Given** a registered shopper is signed in and has consented where the data-protection profile requires it (SEC-012), **when** the widget loads, **then** the shopper's name and e-mail are passed to the chat provider. | Proposed |
| AC-CRM-008-02-01 | US-CRM-008-02 | **Given** WhatsApp Business is connected (CHN-006) and the chat plugin offers an integration interface (V-01), **when** a KTDA customer writes on WhatsApp, **then** the conversation arrives from the CHN-006 adapter (IC-CHN-04) in the live chat console, and agent replies, including images and documents, go back through IC-CHN-04 SendReply as conversational replies outside TRK-005, respecting the TRK-006 opt-out record (BR-CRM-004); if the chat plugin has no such interface, the conversation is handled as a ticket conversation (CRM-002) and the live-chat choice is reviewed. | REQ-KTDA-CHT-001; Proposed (IC-CHN-04) |
| AC-CRM-008-02-02 | US-CRM-008-02 | **Given** WeChat is connected (CHN-007), **when** a KTDA customer writes on WeChat, **then** the conversation is handled in the same way through the CHN-007 adapter (IC-CHN-04). | REQ-KTDA-CHT-001 |
| AC-CRM-008-03-01 | US-CRM-008-03 | **Given** the AI-003 chatbot hands a conversation to staff, **when** the hand-off happens, **then** the transcript is passed to the live chat console; when no agent is available a ticket with the transcript is created through IC-CRM-04; the hand-off interface of the licensed chat and help-desk plugins is confirmed under V-01. | Proposed; V-01 |
| AC-CRM-008-03-02 | US-CRM-008-03 | **Given** a chat ends, **when** the transcript is received, **then** it is attached to an open ticket of that customer or to a new ticket with channel Chat. | Proposed |

**Business rules applied:** BR-CRM-001; BR-CRM-004 (§8.1).


### 7.9 PRD-CRM-009 Contact and messaging

| Item | Value |
|---|---|
| Description (baseline) | Contact-us and contact-the-seller forms, and message threads between customers and the shop. |
| Why it matters | Customers can easily ask questions. |
| Who benefits | Shoppers; sellers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-009-01 | As a shopper, I want to contact the shop with a form, so that I can ask a question or complain. | D; REQ-MPC-FR-251 | Ready |
| US-CRM-009-02 | As a shopper, I want to contact a seller, so that I can ask about the seller's products. | D | Ready |
| US-CRM-009-03 | As a shopper, I want my messages with the shop kept as conversations, so that I can see what was said. | D; FC-M06-018 | Ready |
| US-CRM-009-04 | As a member of support staff, I want to send a message or e-mail to a customer from admin, so that I can reach the customer. | FIT | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-009-01-01 | US-CRM-009-01 | **Given** the contact-us page is available, **when** a shopper submits name, e-mail and enquiry (and subject if CommonSettings.SubjectFieldOnContactUsForm is on), passing CAPTCHA if CaptchaSettings.Enabled and CaptchaSettings.ShowOnContactUsPage are on, **then** the native template Service.ContactUs is sent to the store, the native text ContactUs.YourEnquiryHasBeenSent is shown and activity PublicStore.ContactUs is logged. | REQ-MPC-FR-251; FIT (CommonController.ContactUsSend) |
| AC-CRM-009-01-02 | US-CRM-009-01 | **Given** the CAPTCHA answer is wrong, **when** the form is submitted, **then** nothing is sent and the native error Common.WrongCaptchaMessage is shown. | FIT |
| AC-CRM-009-01-03 | US-CRM-009-01 | **Given** contact-to-ticket is on, **when** the form is sent successfully, **then** a ticket is also created (see CRM-002 (REQ-MPC-FR-253)). | REQ-MPC-FR-251 |
| AC-CRM-009-02-01 | US-CRM-009-02 | **Given** VendorSettings.AllowCustomersToContactVendors is on, **when** a shopper sends the contact-vendor form, **then** the native template Service.ContactVendor is sent to the seller. | FIT (CommonController.ContactVendorSend) |
| AC-CRM-009-02-02 | US-CRM-009-02 | **Given** VendorSettings.AllowCustomersToContactVendors is off, **when** a shopper calls the contact-vendor page, **then** the page is not available (native redirect). | FIT |
| AC-CRM-009-03-01 | US-CRM-009-03 | **Given** the help desk is active, **when** a registered shopper opens My account, My tickets, **then** every exchange with the shop is shown as a conversation thread (CRM-001); native private messages (PrivateMessageSettings.AllowPrivateMessages, moved from ForumSettings to the customer domain in 5.00: Libraries/Nop.Core/Domain/Customers/PrivateMessageSettings.cs:13) are not used for shop conversations. | D; FC-M06-018; Proposed |
| AC-CRM-009-04-01 | US-CRM-009-04 | **Given** a user has Customers.CustomersCreateEditDelete, **when** they use Send e-mail or Send private message on the admin customer page, **then** the native e-mail is queued or the private message is stored. | FIT (5.00.1: Admin CustomerController.SendEmail, SendPm, Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.cs:1018, 1066; private messages need PrivateMessageSettings.AllowPrivateMessages) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.10 PRD-CRM-010 Fraud reporting and referral

| Item | Value |
|---|---|
| Description (baseline) | When fraud is suspected, a defined process refers the case to the right team. |
| Why it matters | Fraud is dealt with quickly and consistently. |
| Who benefits | Fraud staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-010-01 | As a member of fraud staff, I want cases referred to me automatically when fraud indicators appear, such as repeated complaints or a suspicious seller, so that fraud is dealt with quickly and consistently. | D; REQ-MPC-FR-266 | Ready |
| US-CRM-010-02 | As a member of support staff, I want to refer a ticket, case or customer as suspected fraud, so that I hand it to the right team. | D; REQ-MPC-FR-266 | Ready |
| US-CRM-010-03 | As a member of fraud staff, I want one referral record with the evidence and the outcome, so that decisions are recorded. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-010-01-01 | US-CRM-010-01 | **Given** an indicator rule "N complaints against seller V within period P" is active (values not stated), **when** the daily task finds the rule met, **then** a FraudReferral (SM-CRM-03, Open) is created for V with the linked tickets, and fraud staff are notified. | REQ-MPC-FR-266 |
| AC-CRM-010-01-02 | US-CRM-010-01 | **Given** PAY-018 raises Risk.Flagged for a customer or transaction, **when** the event is received, **then** the consumer only enqueues; the CRM task creates a referral unless one is open for the same subject. | REQ-MPC-FR-266; Proposed |
| AC-CRM-010-02-01 | US-CRM-010-02 | **Given** a user has Support.Core.Fraud.Refer, **when** they refer a ticket, case or customer with a reason, **then** a referral is created with the reason and links, and routed to the fraud queue. | REQ-MPC-FR-266 |
| AC-CRM-010-03-01 | US-CRM-010-03 | **Given** a referral is Open, **when** fraud staff review it and record Confirmed or Unfounded with notes and actions taken, **then** the referral moves per SM-CRM-03, the outcome is stored and audited (AUD-CRM-008); actions such as blocking are taken in SEL-013 or IAM, not here. | D; Proposed |
| AC-CRM-010-03-02 | US-CRM-010-03 | **Given** a user without Support.Core.Fraud.CreateEditDelete opens a referral, **when** the request is processed, **then** access is denied. | Proposed |

**Business rules applied:** BR-CRM-060 (§8.1).


### 7.11 PRD-CRM-011 Experience feedback

| Item | Value |
|---|---|
| Description (baseline) | Customers give feedback on service and their overall experience, and staff can act on it. |
| Why it matters | The client learns what to improve. |
| Who benefits | Shoppers; management |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-011-01 | As a shopper, I want to give feedback on the service, the products and my overall experience, so that the client learns what to improve. | D; REQ-KTDA-REV-002 | Ready |
| US-CRM-011-02 | As a member of staff, I want to see feedback and record what we did about it, so that feedback leads to action. | D; Inference from REQ-KTDA-REV-003 (user read as staff) | Ready |
| US-CRM-011-03 | As a shopper, I want to see my feedback and the response to it, so that I know it was heard. | Inference from REQ-KTDA-REV-003 (user read as customer) | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-011-01-01 | US-CRM-011-01 | **Given** an order is Complete and feedback invitations are on (timing setting, default not stated), **when** the invitation is sent, **then** the shopper can rate the overall experience and the service with an optional comment; the feedback is stored with type Order and the order reference. | REQ-KTDA-REV-002 |
| AC-CRM-011-01-02 | US-CRM-011-01 | **Given** the general feedback form is published, **when** a registered shopper submits it, **then** the feedback is stored with type General. | REQ-KTDA-REV-002 |
| AC-CRM-011-01-03 | US-CRM-011-01 | **Given** the shopper wants to give product feedback, **when** they follow the product link of the invitation, **then** the native product review form opens (CAT-029); product feedback is not duplicated in CRM. | REQ-KTDA-REV-002; FIT (ProductReview) |
| AC-CRM-011-01-04 | US-CRM-011-01 | **Given** a ticket is resolved, **when** the shopper is asked to rate it, **then** that rating is the CRM-005 rating (see CRM-005 (REQ-MPC-FR-261)). | Proposed |
| AC-CRM-011-02-01 | US-CRM-011-02 | **Given** a user has Support.Core.Feedback.CreateEditDelete, **when** they open the feedback list, **then** feedback is listed with filters (type, rating, period); the user records an action note and moves it through SM-CRM-05; the action is audited (AUD-CRM-009). | Inference from REQ-KTDA-REV-003 (user read as staff) |
| AC-CRM-011-03-01 | US-CRM-011-03 | **Given** KTDA confirms that "user" means the customer, **when** a shopper opens My account, My feedback, **then** their feedback and the staff response are shown. | Inference from REQ-KTDA-REV-003 (user read as customer) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.12 PRD-CRM-012 Support channel directory

| Item | Value |
|---|---|
| Description (baseline) | Shows the ways to get help (phone, chat, email) with expected waiting times. |
| Why it matters | Customers choose the fastest way to get help. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-012-01 | As a shopper, I want to see the ways to get help with their opening hours and expected waiting times, so that I choose the fastest way. | D; FC-M06-020 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-012-01-01 | US-CRM-012-01 | **Given** support channels are configured (phone numbers, chat, e-mail, WhatsApp, outlets) with opening hours, **when** a shopper opens the help page, **then** the channels are listed with their hours. | D |
| AC-CRM-012-01-02 | US-CRM-012-01 | **Given** help-desk and chat data exist, **when** the directory is shown, **then** the expected waiting time for chat and tickets is the median first-response time over the trailing window (setting, default not stated); without data message Crm.WaitTimeUnknown is shown. | D; Proposed (formula) |
| AC-CRM-012-01-03 | US-CRM-012-01 | **Given** a channel is outside its opening hours, **when** the directory is shown, **then** the channel is shown closed with its next opening time (message Crm.ChannelClosed). | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.13 PRD-CRM-013 Community forums

| Item | Value |
|---|---|
| Description (baseline) | Online discussion forums for customers, moderated by staff. |
| Why it matters | Builds a community and peer support. |
| Who benefits | Shoppers |
| Phase | P3 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-013-01 | As a shopper, I want to discuss with other customers in forums, so that I get peer help. | D; FC-M06-021 | Ready |
| US-CRM-013-02 | As a forum moderator, I want to moderate forum posts, so that the forums stay useful and proper. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-013-01-01 | US-CRM-013-01 | **Given** the bundled Misc.Forums plugin is installed, its ForumSettings.ForumsEnabled is on and forums are set up, **when** a registered shopper posts a topic or reply, **then** it is published as the forum settings allow. | FIT (5.00.1: Plugins/Nop.Plugin.Misc.Forums, plugin.json SupportedVersions 5.00; ForumSettings.cs:14; Domain/Forum.cs, ForumTopic.cs, ForumPost.cs) |
| AC-CRM-013-02-01 | US-CRM-013-02 | **Given** a user is in the ForumModerators role, **when** they edit or delete a post or topic, **then** the change is applied. | FIT (5.00.1: ForumDefaults.ForumModeratorsRoleName, Plugins/Nop.Plugin.Misc.Forums/ForumDefaults.cs:23; ForumService.cs:1215; the role is created by the plugin installation, ForumInstallService.cs:564) |
| AC-CRM-013-02-02 | US-CRM-013-02 | **Given** a user has Forums.Manage, **when** they manage forum groups and forums in admin, **then** the changes are saved. | FIT (5.00.1: plugin admin ForumController, Plugins/Nop.Plugin.Misc.Forums/Admin/Controllers/ForumController.cs:183-266, [CheckPermission(ForumDefaults.Permissions.FORUMS_MANAGE)]; ForumDefaults.cs:282-283) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.14 PRD-CRM-014 Issue routing and escalation

| Item | Value |
|---|---|
| Description (baseline) | Support requests are grouped into categories and sent automatically to the right team, and escalated from first-line support to specialists; customers can report order problems directly. When a customer reports a problem with an order, the ticket is filled in automatically with that order's details. |
| Why it matters | Requests reach the right person fast. |
| Who benefits | Support staff; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-014-01 | As a shopper, I want to report a problem with my order from the order page, with the order details filled in for me, so that I do not have to type them. | D; REQ-MPC-FR-257 | Ready |
| US-CRM-014-02 | As a support manager, I want support categories and routing rules by service type, order status and geography that send each request to the right team, so that requests reach the right person fast. | D; REQ-MPC-FR-259; FC-M18-004 | Ready |
| US-CRM-014-03 | As a member of first-line support, I want to escalate a ticket to a specialised team such as payments operations, logistics operations or technical support, so that specialist problems are solved by specialists. | D; REQ-MPC-FR-258 | Ready |
| US-CRM-014-04 | As a support manager, I want one time-limit (SLA) component for tickets, return requests and dispute cases, so that all deadlines work the same way. | Proposed | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-014-01-01 | US-CRM-014-01 | **Given** an order is in the shopper's account, **when** the shopper chooses Report a problem on the order page (widget zone orderdetails_page_overview), **then** the issue form opens with order number, date, items, order, payment and shipping status and tracking numbers filled in read-only, and the issue types (missing parcel, delayed delivery, payment issue and any configured type). | REQ-MPC-FR-257; FIT (PublicWidgetZones.OrderDetailsPageOverview) |
| AC-CRM-014-01-02 | US-CRM-014-01 | **Given** the issue form is submitted, **when** the ticket is created, **then** the ticket stores the order link and a snapshot of the order details, and its category comes from the issue type. | REQ-MPC-FR-257 |
| AC-CRM-014-01-03 | US-CRM-014-01 | **Given** the issue type is one that needs an item remedy (missing, damaged or wrong item; IssueType.NeedsItemRemedy), **when** the form is submitted, **then** a RET-007 case of type OrderIssue is also opened through IC-RET-01 with the ticket ID and the link is stored on both records (TicketLink, CRM-006). | Proposed; see RET-007 (REQ-MPC-FR-240) |
| AC-CRM-014-01-04 | US-CRM-014-01 | **Given** the issue type is a delivery or payment problem (NeedsItemRemedy off), **when** the form is submitted, **then** only the ticket is created; no RET case is opened. | Proposed |
| AC-CRM-014-01-05 | US-CRM-014-01 | **Given** a shopper calls the issue form for an order that is not theirs, **when** the request is processed, **then** access is denied. | Proposed |
| AC-CRM-014-02-01 | US-CRM-014-02 | **Given** routing rules "category C, service type S, order status O, region R gives department D" are active, **when** a ticket matching them is created, **then** it is assigned to D and the rule applied is written to the ticket history. | REQ-MPC-FR-259; FC-M18-004 |
| AC-CRM-014-02-02 | US-CRM-014-02 | **Given** rules are ordered, **when** a ticket matches more than one rule, or none, **then** the first match in order applies; with no match the default department applies. | Proposed |
| AC-CRM-014-02-03 | US-CRM-014-02 | **Given** a ticket has an order, **when** geography is evaluated, **then** it is taken from the shipping address (country, state or province, county, and district where a list is configured). | REQ-MPC-FR-259; Proposed |
| AC-CRM-014-03-01 | US-CRM-014-03 | **Given** a ticket is at first-line level, **when** an agent escalates it to a specialised team with a reason, **then** the department changes, the escalation level increases, the team is notified and the escalation is audited (AUD-CRM-005). | REQ-MPC-FR-258 |
| AC-CRM-014-03-02 | US-CRM-014-03 | **Given** an escalation level is set to trigger on an SLA breach, **when** the timer of a ticket at that level breaches, **then** the ticket is escalated automatically to the next level. | REQ-MPC-FR-258; Proposed |
| AC-CRM-014-04-01 | US-CRM-014-04 | **Given** an SLA policy exists for a subject type (Ticket, ReturnRequest, DisputeCase), category, priority and metric, **when** a subject enters the start state, **then** a timer starts with a due time computed from the policy and its calendar (round the clock or business hours, setting, default not stated); it pauses and resumes on the configured states and stops on the end state (SM-CRM-02). | Proposed |
| AC-CRM-014-04-02 | US-CRM-014-04 | **Given** a running timer passes its due time, **when** the SLA task runs, **then** the timer becomes Breached and the module event Sla.Breached is published once for that timer. | Proposed |

**Business rules applied:** BR-CRM-010; BR-CRM-011 (§8.1).


### 7.15 PRD-CRM-015 B2B account management

| Item | Value |
|---|---|
| Description (baseline) | A business customer can be given a named account manager, who can place orders on its behalf. |
| Why it matters | Personal service for important business customers. |
| Who benefits | Business buyers; sales staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: SINGLE-FILTER |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CRM-015-01 | As a business buyer, I want a named account manager, so that I get personal service. | D | Ready; conditions: SINGLE-FILTER |
| US-CRM-015-02 | As an account manager, I want to place orders on behalf of my business customers, so that I can serve them fully. | D | Ready; conditions: SINGLE-FILTER |
| US-CRM-015-03 | As a client administrator, I want only the assigned account manager to place orders on behalf of a business customer, with a record, so that orders on behalf are controlled. | FIT (gap) | Ready; conditions: SINGLE-FILTER |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CRM-015-01-01 | US-CRM-015-01 | **Given** a business customer exists (IAM-022), **when** an administrator assigns an account manager, **then** the assignment is stored and audited (AUD-CRM-010), and the buyer sees the manager's name and contact details in My account. | D |
| AC-CRM-015-02-01 | US-CRM-015-02 | **Given** an assigned manager has Customers.CustomersImpersonation, **when** they choose Place order on behalf on the customer page, **then** the native impersonation starts and the order placed is recorded with an order note naming the manager. | D; FIT (CustomerController.Impersonate) |
| AC-CRM-015-03-01 | US-CRM-015-03 | **Given** a user in the AccountManager role (and not an Administrator, and not an Agent acting for a customer of the agent's own outlet, IAM-026) holds Customers.CustomersImpersonation and is not the assigned manager of the customer, **when** they post the impersonation action (Admin CustomerController.Impersonate, route action name Edit), **then** the single IAM-026 impersonation filter (BR-IAM-130) asks the CRM-015 rule provider (IC-IAM-09 EvaluateImpersonation), which answers refuse with message Crm.NotAssignedManager; the impersonation does not start and the refusal is audited (AUD-CRM-010); CRM registers no filter of its own on the action. | SINGLE-FILTER; FIT (Impersonate takes only the customer ID); Proposed |
| AC-CRM-015-03-02 | US-CRM-015-03 | **Given** an Administrator, or an Agent for a customer of the agent's own outlet (IAM-026), starts impersonation of a business customer that has an assigned account manager, **when** the IAM-026 filter evaluates the request, **then** the CRM-015 rule provider does not refuse it: the assignment rule applies only to users in the AccountManager role (BR-CRM-070). | SINGLE-FILTER |
| AC-CRM-015-03-03 | US-CRM-015-03 | **Given** impersonation starts and finishes, **when** the native activity log runs, **then** activities Impersonation.Started and Impersonation.Finished are recorded. | FIT |

**Business rules applied:** BR-CRM-070 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-CRM-001 | Every customer request from any channel becomes a ticket in the help desk through the adapter IC-CRM-01, with its channel recorded; CRM features never write to the licensed plugin tables directly. | CRM-001, CRM-002, CRM-008 | D; Proposed (adapter) |
| BR-CRM-002 | Ticket statuses and transitions are those of SM-CRM-01; the adapter maps them to the statuses of the licensed plugin. | CRM-001 | REQ-MPC-FR-252; Proposed |
| BR-CRM-003 | Inbound messages are de-duplicated by their channel message ID (for example the e-mail Message-ID); the same message never creates two tickets or two entries. | CRM-002 | Proposed; NFR-X-007 |
| BR-CRM-004 | Messages (decision MSG-ROUTE): notifications about tickets (acknowledgement, status change, resolution with rating link, staff alerts) are sent only through TRK-005 as CRM event codes registered with IC-TRK-04 RegisterEventCode at installation and sent with IC-TRK-04 SendEvent. Agent replies in a conversation the customer started (ticket e-mail reply, WhatsApp, WeChat, chat) are conversational replies and may be sent outside TRK-005 (e-mail reply through the native e-mail account; channels through IC-CHN-04 SendReply), but never to a recipient opted out of that channel in TRK-006, including phone numbers without an account. | CRM-001, CRM-002, CRM-008 | MSG-ROUTE; Proposed |
| BR-CRM-005 | Files (decision SINGLE-FILTER): ticket attachment type, size and scanning are checked only by the ADM-008 upload policy for the upload context "ticket attachment" that the CRM plugin registers with ADM-008; CRM keeps only the number of files per ticket. Where attachments are native Download records, downloads through GetFileUpload or Admin DownloadFile are decided by the single SEC-002 filter (BR-SEC-005), to which CRM is a rule provider (ticket customer, staff with Support.Core.Tickets.View). | CRM-001, CRM-002 | SINGLE-FILTER; FIT (DownloadController.GetFileUpload, Admin DownloadController.DownloadFile) |
| BR-CRM-010 | SLA timers come from SLA policies in the CRM-014 component; a breach marks the subject Breached and runs the escalation action of its level. | CRM-001, CRM-004, CRM-014 | REQ-MPC-FR-252; REQ-MPC-FR-311; Proposed |
| BR-CRM-011 | Routing rules are evaluated in their configured order; the first match assigns the department; no match assigns the default department. | CRM-014 | REQ-MPC-FR-259; Proposed |
| BR-CRM-020 | Internal notes are visible only to staff with ticket permissions; they are excluded from customer pages, customer e-mails and customer data. | CRM-006 | REQ-MPC-FR-272 |
| BR-CRM-030 | Sensitive fields in the 360-degree view are masked unless the user has Support.Core.Customer360.ViewSensitive; every reveal is audited. Support roles do not hold native Customers.CustomersView, because the native customer page shows all fields. | CRM-003 | REQ-MPC-FR-263; FIT (admin CustomerController.Edit) |
| BR-CRM-040 | One rating per resolved ticket; ratings are linked to ticket, agent and department and are used only in aggregate on dashboards. | CRM-005 | REQ-MPC-FR-261; Proposed |
| BR-CRM-050 | A ready-made answer version is usable only when Approved by a user other than its author; earlier versions are kept. | CRM-007 | REQ-MPC-FR-256 |
| BR-CRM-060 | At most one open fraud referral exists per subject (customer, seller or transaction); new indicators are added to the open referral. | CRM-010 | Proposed |
| BR-CRM-080 | Platform conformance (all CRM features): every new CRM setting key is listed in the CRM plugin key catalogue (key, type, layer, secret flag, default) so pack validation accepts it; keys and fields that hold a credential, key or token (support mailbox credentials, chat account keys) are flagged secret, so the pack loader refuses them and exports omit them. CRM pages, widgets and scheduled tasks run for a store only when IC-PLT-02 IsEnabled(productfeature.<CRM feature ID>) is true for that store. CRM writes go through IRepository<>; if the licensed help desk writes without it, the adapter calls IC-SEC-01 WriteAsync for each change. Business audit events AUD-CRM-nnn are written through IC-SEC-01 with a correlation id. | All CRM features | Proposed (BR-PLT-013, AC-PLT-003-01-04, AC-PLT-022-02-01; BR-SEC-010, BR-SEC-011, BR-SEC-014); CFG-01 |
| BR-CRM-070 | When CRM-015 is active, a user in the AccountManager role may impersonate only the customers assigned to that user. CRM-015 supplies this as a rule provider to the single IAM-026 impersonation filter (BR-IAM-130), which also allows Administrators and Agents for customers of their own outlet (IC-IAM-09 provider); CRM has no action filter on Admin CustomerController.Impersonate. | CRM-015 | D; SINGLE-FILTER; Proposed |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-CRM-01 | Ticket | (none) | created by any channel | — | New | acknowledgement; routing; timers start |
| SM-CRM-01 | Ticket | New | assigned or first staff reply | — | Open | first-response timer stops |
| SM-CRM-01 | Ticket | Open | agent asks the customer | — | AwaitingCustomer | resolution timer pauses (if policy says) |
| SM-CRM-01 | Ticket | AwaitingCustomer | customer replies | — | Open | timer resumes |
| SM-CRM-01 | Ticket | New / Open | escalated by agent or SLA breach | — | Escalated | next level assigned; AUD-CRM-005 |
| SM-CRM-01 | Ticket | Escalated | taken by the specialised team | — | Open | — |
| SM-CRM-01 | Ticket | Open / Escalated | resolved with a resolution note | complaint: outcome recorded | Resolved | rating link sent (CRM-005) |
| SM-CRM-01 | Ticket | Resolved | customer replies within the auto-close period | — | Open | — |
| SM-CRM-01 | Ticket | Resolved | auto-close period passes | — | Closed | timers stop |
| SM-CRM-01 | Ticket | New / Open / AwaitingCustomer | merged into another ticket | — | Merged | link to target; AUD-CRM-002 |
| SM-CRM-02 | SlaTimer | (none) | subject enters start state | policy exists | Running | due time computed |
| SM-CRM-02 | SlaTimer | Running | subject enters a pause state | — | Paused | — |
| SM-CRM-02 | SlaTimer | Paused | subject leaves the pause state | — | Running | due time moved by the paused duration |
| SM-CRM-02 | SlaTimer | Running | subject reaches end state before due time | — | Met | — |
| SM-CRM-02 | SlaTimer | Running | due time passes | — | Breached | Sla.Breached published once; escalation action |
| SM-CRM-03 | FraudReferral | (none) | indicator rule met, risk flag or manual referral | no open referral for the subject | Open | fraud staff notified |
| SM-CRM-03 | FraudReferral | Open | fraud staff start review | Support.Core.Fraud.CreateEditDelete | UnderReview | — |
| SM-CRM-03 | FraudReferral | UnderReview | outcome recorded | — | Confirmed / Unfounded | AUD-CRM-008 |
| SM-CRM-03 | FraudReferral | Confirmed / Unfounded | referral closed | actions noted | Closed | — |
| SM-CRM-04 | ReadyMadeAnswerVersion | (none) | draft saved | — | Draft | — |
| SM-CRM-04 | ReadyMadeAnswerVersion | Draft | approved | approver is not the author | Approved | previous Approved version becomes Superseded; AUD-CRM-006 |
| SM-CRM-04 | ReadyMadeAnswerVersion | Draft | rejected with reason | — | Rejected | author notified |
| SM-CRM-05 | ExperienceFeedback | (none) | submitted | — | New | — |
| SM-CRM-05 | ExperienceFeedback | New | staff start review | — | InReview | — |
| SM-CRM-05 | ExperienceFeedback | InReview | action recorded | action note given | Actioned | AUD-CRM-009 |
| SM-CRM-05 | ExperienceFeedback | Actioned | closed | — | Closed | — |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| Ticket (licensed plugin entity) | As provided by the plugin: number, customer, department, status, priority, messages, attachments | CRM-001 | Not altered; extended by TicketExt |
| TicketExt (new) | TicketId, Channel (WebForm, Email, Phone, WhatsApp, WeChat, Chat, Outlet), OrderId, VendorId, OrderSnapshot, CategoryId, IssueTypeId, ProductStatus (SM-CRM-01), EscalationLevel, MergedIntoTicketId, OutletId, AgentId, ComplaintReference, ComplaintOutcome | CRM-001, CRM-002, CRM-004, CRM-014 | |
| TicketLink (new) | TicketId, LinkedType (DisputeCase, ReturnRequest, Order, FraudReferral), LinkedId, CreatedBy, CreatedOnUtc | CRM-006 | RET cases keep the ticket ID too |
| InboundMessage / CallLog (new) | Message: Channel, ChannelMessageId (unique per channel), TicketId, RawRef; Call: TicketId, Caller, Phone, DurationSeconds, Notes, AgentId | CRM-002 | |
| SupportMailbox (new) | Host, Protocol, Username, CredentialsRef (encrypted), PollIntervalSeconds, StoreId, IsActive | CRM-002 | Native EmailAccount is outbound SMTP only |
| SupportCategory / IssueType / RoutingRule (new) | Category: Name, Parent, DefaultDepartment; IssueType: Name, NeedsItemRemedy, CategoryId; Rule: Order, Conditions (category, service type, order status, region), DepartmentId, IsActive | CRM-014 | |
| SlaPolicy / SlaTimer / EscalationLevel (new) | Policy: SubjectType, CategoryId, Priority, Metric, Duration, Calendar, StartState, PauseStates, EndState; Timer: SubjectType, SubjectId, PolicyId, DueUtc, PausedSeconds, Status (SM-CRM-02); Level: SubjectType, CategoryId, Level, Target (team or external body), Trigger | CRM-014 (owner); used by CRM-001, CRM-004, RET-007, RET-008, RET-010 | |
| MaskedField (new) | EntityName, FieldName, MaskRule | CRM-003 | Replaced by SEC-014 classification when live |
| KbCategory / TopicKbCategory (new) | Category: Name (localised), DisplayOrder; mapping TopicId to KbCategoryId | CRM-007 | Articles are native Topic records; approval and versions in MKT-008 |
| ReadyMadeAnswer / ReadyMadeAnswerVersion (new) | Answer: Name, CategoryId, LanguageId; Version: Number, Body with placeholders, Status (SM-CRM-04), AuthorId, ApproverId, ApprovedOnUtc | CRM-007 | |
| TicketRating (new) | TicketId (unique), Rating, Comment, AgentId, DepartmentId, CreatedOnUtc | CRM-005 | |
| EarlyWarningRule (new) | CategoryId, PeriodDays, Threshold, Recipients, IsActive | CRM-005 | |
| FraudReferral (new) | Id, SubjectType, SubjectId, Source (Rule, RiskFlag, Manual), Reason, Evidence, Status (SM-CRM-03), Outcome, Actions, AssignedTo | CRM-010 | |
| ExperienceFeedback (new) | Id, CustomerId, Type (Order, General), OrderId, Rating, ServiceRating, Comment, Status (SM-CRM-05), ActionNote, ResponseText | CRM-011 | Product feedback stays in native ProductReview (CAT-029) |
| SupportChannel (new) | Type, Label, Contact, OpeningHours, ShowWaitTime, DisplayOrder | CRM-012 | |
| AccountManagerAssignment (new) | CustomerId, ManagerCustomerId, AssignedBy, AssignedOnUtc | CRM-015 | Uses native impersonation |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Service desk extensions pack settings | Complaint categories and ADR escalation matrix, support channel directory | vertical → client | CRM-004 / CRM-012 | Service desk extensions pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Help-desk plugin and adapter | Licensed plugin settings; adapter selection (new) | client | Help desk (V-01) | Ticketing (FR-252) (V-01) |
| Acknowledgement window; auto-close period | CRM settings (new) | client | Not stated | Configured (FR-271); value not stated |
| Attachment types and size; attachments per ticket | ADM-008 upload policy for the context ticket attachment (owner ADM); CRM setting for the count (new) | client | Not stated | Controls required (FR-265); values not stated |
| SLA policies, calendars and escalation levels | SlaPolicy, EscalationLevel (new, CRM-014) | client | Not stated (KG-19) | Configurable (FR-252, FR-311); values not stated |
| Support categories, issue types, routing rules | SupportCategory, IssueType, RoutingRule (new) | vertical → client | Not stated | By service type, order status, geography (FR-259); values not stated |
| Support mailbox connection | SupportMailbox (new); credentials per instance, encrypted | client instance only | Not stated | Email-to-ticket (FR-253) |
| Contact-to-ticket | CRM settings (new) | client | Not stated | Not stated |
| Contact-us options | CommonSettings.SubjectFieldOnContactUsForm, UseSystemEmailForContactUsForm; CaptchaSettings.ShowOnContactUsPage (native) | client → store | Not stated | Not stated |
| Contact the seller | VendorSettings.AllowCustomersToContactVendors (native) | client | Not stated | Not stated |
| Private messages and forums | PrivateMessageSettings.AllowPrivateMessages (native, customer domain since 5.00); ForumSettings.ForumsEnabled (bundled Misc.Forums plugin, installed only with CRM-013) | client → store | Not stated | Not stated |
| Masked fields | MaskedField (new) | country → client | Not stated | Restrict sensitive data (FR-263); list not stated |
| Complaint form fields and escalation matrix | Service desk extensions pack row (CRM-004) | vertical → client | Not stated | Complaints and ADR Policy (FR-269, FR-270) — not provided (T-MISS) |
| Rating scale, rating window, early-warning rules | CRM settings, EarlyWarningRule (new) | client | Not stated | Not stated |
| Knowledge-base categories | KbCategory (new); Topic (native) | vertical → client | Not stated | Not stated |
| Chat plugin and account | Licensed plugin settings or SeoSettings.CustomHeadTags (native) | client → store | WhatsApp and WeChat (CHT-001); scope KG-24 | Not stated |
| Support channel directory | SupportChannel (new); Service desk extensions pack row (CRM-012) | client | Not stated | Not stated |
| Fraud indicator rules | CRM settings (new) | client | Not stated | Indicators e.g. repeated complaints, suspicious sellers (FR-266); thresholds not stated |
| Feedback invitation timing | CRM settings (new) | client | Not stated (REV-002) | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Ticket form; contact-us page (native); contact-the-seller page (native) | CRM-001, CRM-009 | Plugin + native |
| Storefront — order details | Report a problem (issue form with order details) | CRM-014 | New widget (orderdetails_page_overview) |
| Storefront — My account | My tickets; ticket conversation; rating page; My feedback; account manager | CRM-001, CRM-005, CRM-011, CRM-015 | Plugin + new |
| Storefront | Help centre (knowledge-base categories, search, articles); support channel directory; chat widget; forums | CRM-007, CRM-012, CRM-008, CRM-013 | Native topics/forums + new |
| Admin | Ticket queues and ticket view (notes, history, links, merge, escalate, call log, ready-made answers) | CRM-001, CRM-002, CRM-006, CRM-014 | Plugin pages + CRM extension |
| Admin | Agent 360-degree view | CRM-003 | New page + admin_customer_details_block widget |
| Admin | Complaints queue and escalation matrix | CRM-004 | New |
| Admin | Support dashboard, complaint trends, early-warning rules | CRM-005 | New |
| Admin | Ready-made answers and approval; knowledge-base categories | CRM-007 | New |
| Admin | Fraud referrals | CRM-010 | New |
| Admin | Experience feedback | CRM-011 | New |
| Admin | Categories, issue types, routing rules, SLA policies, mailboxes, channel directory | CRM-002, CRM-012, CRM-014 | New |
| Admin | Account manager assignment | CRM-015 | New |

Screen layouts are not specified here. They follow the approved designs (to be produced), the licensed plugin pages where used, and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Crm.TicketCreated | Thank you. Your request has been received. Your ticket number is shown below. | AC-CRM-001-01-01 |
| Crm.AttachmentLimit | You have reached the maximum number of files for this request. | AC-CRM-001-04-02 |
| Crm.RecipientOptedOut | This customer has opted out of this channel. The reply was not sent. | AC-CRM-002-03-02 |
| Crm.PossibleDuplicate | This ticket may duplicate another open ticket. | AC-CRM-002-05-02 |
| Crm.ComplaintOutcomeRequired | Record the outcome and notify the customer before closing this complaint. | AC-CRM-004-01-02 |
| Crm.AlreadyRated | You have already rated this request. Thank you. | AC-CRM-005-01-02 |
| Crm.RatingExpired | The time to rate this request has passed. | AC-CRM-005-01-03 |
| Crm.WaitTimeUnknown | Waiting time not available. | AC-CRM-012-01-02 |
| Crm.ChannelClosed | Closed now. Opens again at the time shown. | AC-CRM-012-01-03 |
| Crm.NotAssignedManager | Only the assigned account manager can place orders for this customer. | AC-CRM-015-03-01 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Notifications go through TRK-005 (BR-CRM-004, decision MSG-ROUTE): native Service.ContactUs and Service.ContactVendor templates through IWorkflowMessageService (single override TRK-005), and CRM event codes registered at installation through IC-TRK-04 RegisterEventCode and sent with IC-TRK-04 SendEvent: Ticket.Created (acknowledgement), Ticket.StatusChanged, Ticket.Resolved (with the rating link) as listed in BR-TRK-023, and the staff alerts Support.Core.SlaBreached, Support.Core.EarlyWarning, Support.Core.FraudReferral and Support.Core.AccountManagerAssigned (names Proposed; all listed in BR-TRK-023). The licensed help desk's own e-mail templates are used only if the V-01 test shows they go through IWorkflowMessageService; otherwise they are switched off and replaced by the event codes above. Agent replies in customer-started conversations are not notifications (BR-CRM-004).


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Licensed help desk (CRM-001) | Ticket operations through IC-CRM-01 | Nop-Templates Nop Help Desk or nopStation Helpdesk Ticket (V-01) | Adapter per plugin |
| Support mailbox (CRM-002) | Read new e-mails; send replies through native e-mail accounts | Client mail server (not named) | Protocol not stated |
| WhatsApp Business, WeChat (CRM-002, CRM-008) | Inbound messages, replies | CHN-006, CHN-007 (Channels pack) | KTDA CHT-001 |
| Chat provider (CRM-008) | Widget, transcripts; WhatsApp and WeChat conversations through IC-CHN-04 | Tawk.to through Nop-Plus (V-01) or script in SeoSettings.CustomHeadTags | Integration interface of the plugin to confirm (V-01) |
| Regulators (CRM-004) | Complaint escalation submissions | INT-009 framework | Second-person approval (BR-INT-040) |
| RET (CRM-006, CRM-014, CRM-004) | OpenCase, GetCases (IC-RET-01) | RET module | — |
| Reporting extracts (CRM-001 adapter) | GetExtractViews (IC-CRM-05) | RPT-003 | Read only |
| Seller KPIs and notifications (CRM-004) | GetComplaintCounts (IC-CRM-05); Complaint.Created event | SEL-011 (counts), SEL-020 (notification) | Read only; consumers only enqueue |
| PAY, TRK, ORD data (CRM-003) | Read order, payment and tracking data for the 360-degree view | PAY, TRK, ORD modules | Read only |
| AI chatbot (CRM-007) | GetApprovedAnswers (IC-CRM-02) | AI-003 | — |
| Notification engine | Event codes Ticket.Created, Ticket.StatusChanged, Ticket.Resolved and staff alerts (IC-TRK-04 RegisterEventCode, SendEvent); opt-out records read before conversational replies | TRK-005, TRK-006 | Decision MSG-ROUTE |
| Conversational replies | SendReply (IC-CHN-04) | CHN-006, CHN-007 | Outside TRK-005; TRK-006 opt-outs respected (BR-CRM-004) |
| Impersonation (CRM-015) | Rule provider to the single IAM-026 filter (BR-IAM-130) | IAM module | Decision SINGLE-FILTER |
| Files (CRM-001) | Upload context ticket attachment (ADM-008); download rule provider (SEC-002, BR-SEC-005) | ADM, SEC modules | Decision SINGLE-FILTER |
| Consent trail (CRM-003) | GetConsentTrail (IC-IAM-05) | IAM module | Read only; decision ONE-RECORD |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-CRM-01 | CreateTicket | Channel, customer (ID or e-mail / phone), category or issue type, subject, body, attachments, order ID, order snapshot, outlet and agent | Ticket ID and number | Validation, attachment refused, help desk unavailable | Adapter over the licensed plugin services (V-01); one adapter per supported plugin |
| IC-CRM-01 | AddMessage / AddInternalNote / LogCall | Ticket ID, author, channel, text, attachments, visibility | Message ID | Ticket closed or merged | Adapter |
| IC-CRM-01 | Assign / ChangeStatus / Escalate / Merge | Ticket ID, target, reason | New state | Transition not allowed (SM-CRM-01) | Adapter; audit through SEC-004 |
| IC-CRM-01 | GetTickets / GetTicket / Link | Customer ID or ticket ID; linked object (case, return, order) | Tickets with status and history; link stored | — | Adapter + CRM link table |
| IC-CRM-02 | GetApprovedAnswers | Language, category, keyword | Approved answer versions with ID, title and placeholders; never drafts | — | CRM service used by CRM-008, CHN-006 replies and AI-003 |
| IC-CRM-03 | StartTimer / Pause / Resume / Stop | Subject type and ID, policy key | Timer ID and due time | No policy | CRM-014 SLA component service; IScheduleTask raises Sla.Breached |
| IC-CRM-05 | GetExtractViews | Dataset name (Tickets, TicketMessagesMeta, TicketStatusHistory, TicketRatings, FraudReferrals, CallLogs), watermark | Read-only rows with stable columns independent of the licensed plugin | Unknown dataset | Read-only database views or adapter query per supported plugin; consumed by RPT-003 (IC-RPT-01) |
| IC-CRM-05 | GetComplaintCounts (SEL-011 → CRM) | Vendor, period | Number of complaint tickets naming the seller in the period, by category | Unknown vendor | CRM read service over the complaint tickets (seller stored on the ticket, CRM-004); used by the SEL-011 KPI calculation (one read path; Complaint.Created serves the SEL-020 notification only) |
| IC-CRM-04 | ReceiveInbound | Channel, channel message ID, sender, content, attachments | Ticket ID and message ID | Duplicate (BR-CRM-003) | Intake service used by the mailbox task, CHN-006, CHN-007 and the chat transcript handler |

IC-CRM-01 isolates the licensed help desk: CRM-002, CRM-003, CRM-006, CRM-014 and RET use only these operations. IC-CRM-03 is the single SLA timer component for CRM and RET (Proposed single owner). IC-CRM-05 gives RPT read-only data without exposing the licensed plugin tables, and SEL-011 complaint counts (GetComplaintCounts); Complaint.Created serves SEL-020 notifications. CRM is also a rule provider to the IAM-026 impersonation filter (CRM-015) and to the SEC-002 download filter, registers the ticket attachment upload context with ADM-008 (decision SINGLE-FILTER), registers its event codes with IC-TRK-04 and sends conversational replies through IC-CHN-04 SendReply (decision MSG-ROUTE). Operation signatures (C# interfaces) are produced at L2 build start and approved by the tech lead.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Ticket.Created / StatusChanged / Resolved | None (CRM module events published by the adapter) | CRM-005 rating link, CRM-011, RPT, TRK notifications |
| Complaint.Created | None (CRM module event: ticket, seller, category) | SEL-020 notifications (SEL-011 reads counts through IC-CRM-05) |
| Contact-us sent | CommonController.ContactUsSend [POST] — CRM action filter after a successful send | CRM-002 ticket creation |
| Inbound WhatsApp / WeChat message | CHN-006 / CHN-007 module events | CRM-002 intake (IC-CRM-04) |
| Risk.Flagged | PAY-018 module event | CRM-010 consumer enqueues; the CRM task creates the referral |
| DisputeCase.Opened / Closed | RET module events | CRM-006 link status shown on the ticket |
| Sla.Breached | None (CRM-014 SLA task publishes it) | CRM escalation; RET-007, RET-008, RET-010 |
| Impersonation | Admin CustomerController.Impersonate [POST] — single IAM-026 filter (BR-IAM-130) with the CRM-015 rule provider; native activities Impersonation.Started / Finished | CRM-015 |
| Customer page block | Admin widget zone admin_customer_details_block | CRM-003 link to the 360-degree view |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Customer reply and auto-close task at the same time | CRM-001 | Ticket actions run under ILocker.PerformActionWithLockAsync keyed 'crm-ticket-{TicketId}' (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 §6.4); the second action re-reads the status; a reply always reopens a Resolved ticket before close |
| Mailbox task on several web nodes | CRM-002 | The schedule-task lock prevents parallel runs; the unique ChannelMessageId (BR-CRM-003) prevents duplicates if two runs overlap |
| Two agents merge or reply to the same ticket | CRM-002, CRM-006 | Same ticket lock; TicketExt carries its own row version (plugin table); the losing action is refused and re-read |
| Timer breach and resolution at the same time | CRM-014 | Timer updates run under the lock 'crm-sla-{TimerId}'; Sla.Breached is published only if the timer is still Running when the lock is taken |
| Two risk flags for the same subject | CRM-010 | Referral creation runs under the lock 'crm-fraud-{SubjectType}-{SubjectId}' (BR-CRM-060) |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Ticket created | Shopper | Event code Ticket.Created (IC-TRK-04), channels per TRK-005 | CRM-001 |
| Ticket status changed | Shopper | Event code Ticket.StatusChanged (IC-TRK-04), channels per TRK-005 | CRM-001 |
| Ticket assigned | Assignee | Admin notification | CRM-001 |
| Staff reply in a customer-started conversation | Shopper | Conversational reply on the ticket channel: e-mail reply, or IC-CHN-04 SendReply for WhatsApp and WeChat; outside TRK-005, TRK-006 opt-outs respected (BR-CRM-004) | CRM-001, CRM-002, CRM-008 |
| Ticket resolved, with rating link | Shopper | Event code Ticket.Resolved (IC-TRK-04), channels per TRK-005 | CRM-001, CRM-005 |
| SLA breached / escalated | Assignee; next level | Event code Support.Core.SlaBreached (IC-TRK-04) + admin notification | CRM-001, CRM-004, CRM-014 |
| Early warning | Support managers | Event code Support.Core.EarlyWarning (IC-TRK-04) | CRM-005 |
| Fraud referral created | Fraud staff | Event code Support.Core.FraudReferral (IC-TRK-04) | CRM-010 |
| Contact-us and contact-the-seller | Store; seller | Email (native Service.ContactUs, Service.ContactVendor) through TRK-005 | CRM-009 |
| Account manager assigned | Business buyer | Event code Support.Core.AccountManagerAssigned (IC-TRK-04) | CRM-015 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Support dashboard by queue and agent | CRM-005 | REQ-MPC-FR-262 |
| Ratings after resolution | CRM-005 | REQ-MPC-FR-261 |
| Complaint trends | CRM-005 | D; FC-M18-012 |
| Fraud referrals and outcomes | CRM-010 | REQ-MPC-FR-266 |
| Experience feedback summary | CRM-011 | REQ-KTDA-REV-002 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-CRM-001 | Ticket change (status, assignment, priority, category, fields, notes) | Staff / system | Ticket, TicketExt | actor, time, old values, new values |
| AUD-CRM-002 | Ticket merge | Staff | Ticket | source, target |
| AUD-CRM-003 | Sensitive field revealed in the 360-degree view | Support manager | Customer | field, customer, time |
| AUD-CRM-004 | Configuration change (routing, SLA policy, escalation matrix, categories, mailbox, masking list) | Administrator / support manager | Rule entity | old values, new values |
| AUD-CRM-005 | Escalation (manual or SLA breach) | Staff / system | Ticket | from level, to level, reason |
| AUD-CRM-006 | Ready-made answer version approved or rejected | Support manager | ReadyMadeAnswerVersion | version, approver, reason |
| AUD-CRM-007 | Knowledge-base article approval | Approver | Topic | recorded by MKT-008 |
| AUD-CRM-008 | Fraud referral status and outcome | Fraud staff | FraudReferral | old status, new status, outcome |
| AUD-CRM-009 | Feedback action recorded | Staff | ExperienceFeedback | status, action note |
| AUD-CRM-010 | Account manager assigned; impersonation refused | Administrator / system | AccountManagerAssignment | customer, manager, outcome |

Business audit events AUD-CRM-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id; old and new values are captured by the SEC-004 IRepository<> decorator (BR-CRM-080). The native activity log is not used as the audit record. Names and fields are Proposed. Whether the licensed help desk writes through IRepository<> is a V-01 test item (AC-CRM-006-03-01).


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-CRM-001 | Sensitive customer data is masked in the 360-degree view unless the role allows it; reveals are audited. | REQ-MPC-FR-263; NFR-X-002 | AC-CRM-003-02-01, AC-CRM-003-02-03 |
| NFR-CRM-002 | Acknowledgements are sent within the configured window for every intake channel. | REQ-MPC-FR-271 | AC-CRM-001-01-02; test note T-CRM-02 |
| NFR-CRM-003 | Every ticket change is audited with actor and time (NFR-X-003). | REQ-MPC-FR-274 | AC-CRM-006-03-01 |
| NFR-CRM-004 | Mailbox and channel credentials are stored encrypted per client instance and never exported in configuration packs. | CFG-01; NFR-X-001 | AC-CRM-002-01-01 |
| NFR-CRM-005 | The licensed help desk and chat plugins run on release-5.00.1 (.NET 10) with IPermissionConfigManager permission names and only the async data and settings APIs. | V-01; L1 §6.1 | AC-CRM-001-06-02 |
| NFR-CRM-006 | Response-time targets for support pages: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-CRM-001 | P1 | PRD-CRM-014 | |
| PRD-CRM-002 | P1 | — | |
| PRD-CRM-003 | P1 | — | |
| PRD-CRM-004 | P1 | PRD-ADM-002, PRD-RET-007, PRD-CRM-014 | |
| PRD-CRM-005 | P1 | — | |
| PRD-CRM-006 | P1 | PRD-SEC-004 | |
| PRD-CRM-007 | P1 | — | |
| PRD-CRM-008 | P1 | PRD-CHN-006 | |
| PRD-CRM-009 | P1 | — | |
| PRD-CRM-010 | P1 | — | |
| PRD-CRM-011 | P1 | — | |
| PRD-CRM-012 | P2 | — | |
| PRD-CRM-013 | P3 | — | |
| PRD-CRM-014 | P1 | — | PRD-RET-007, PRD-RET-008, PRD-RET-010, PRD-CRM-001, PRD-CRM-004 |
| PRD-CRM-015 | P2 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-CRM-01 | Adapter: run every IC-CRM-01 operation against each supported help-desk plugin; replace the plugin in a test instance and rerun CRM-002, CRM-003, CRM-006 and CRM-014 tests unchanged. |
| T-CRM-02 | Intake: e-mail (new, reply, auto-reply, duplicate Message-ID), call log, WhatsApp, WeChat, outlet and contact-us each create exactly one ticket or entry with the right channel and acknowledgement. |
| T-CRM-03 | SLA: start, pause, resume, meet and breach for tickets and for RET subjects; Sla.Breached published once per timer. |
| T-CRM-04 | Masking: agent without ViewSensitive sees masked values in the 360-degree view and cannot open the native customer page; reveal is audited. |
| T-CRM-05 | Internal notes never appear in customer pages, e-mails or customer data. |
| T-CRM-06 | State models: every transition of SM-CRM-01 to SM-CRM-05 is tested; transitions not listed are rejected. |
| T-CRM-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
| T-CRM-08 | Conformance: with productfeature.<CRM feature ID> off for a store, CRM pages, widgets and tasks do nothing for that store; every CRM setting key is in the key catalogue and credential keys are flagged secret and absent from pack exports; IC-CRM-05 views return the same columns with each supported help-desk plugin. |
| T-CRM-09 | Messages and filters: ticket notifications go only through IC-TRK-04 event codes; a reply to an opted-out WhatsApp number is not sent; the IAM-026 impersonation filter with the CRM-015 provider refuses an unassigned account manager and allows Administrators and in-reach Agents; ticket attachments outside the ADM-008 policy are refused. |
