# L2 Module PRD — TRK: Tracking and notifications

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | TRK — Tracking and notifications |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Collects tracking updates from the client's scanners, couriers and international postal systems into one event hub with one list of event names, shows buyers, guests, sellers and staff where each parcel is, flags parcels that missed an expected scan, and sends every customer message (email, SMS, app, WhatsApp, in-app) through one notification engine that applies each customer's channel, quiet-hour and per-order preferences and records whether each message was delivered.

**In scope**

- Buyer shipment tracking page, share link and refresh; guest order-status lookup (TRK-001, TRK-011)
- Tracking event hub: common event list, source mappings, ingestion interface, missed-scan rules, retention (TRK-002)
- Ingestion interface for the external scanning and field operations app, held by FG-06 (TRK-003)
- Email templates and bounce handling on native message templates (TRK-004)
- Multi-channel notification engine with fallback — a Product Goal enabler (TRK-005)
- Notification preferences, quiet hours, limits and per-order subscribe / unsubscribe; opt-out records for phone numbers without an account; the preference and opt-out service used by CHN and by senders outside the engine (TRK-006)
- Notification delivery log, reports and audit link to orders and shipments (TRK-007)
- In-app notification feed, P2 (TRK-008); proactive outreach and outage notices (TRK-009); seller shipment visibility (TRK-010)
- Shipment and pickup event notifications (TRK-012)

**Not in this module**

| Item | Where it is |
|---|---|
| Carrier adapters, postal interfaces (CDS, IPS, GMS), proof-of-delivery capture, delivery exceptions | LOG module (PRD-LOG-012, LOG-013, LOG-016, LOG-021, LOG-025 to LOG-032) — they feed TRK-002 |
| SMS gateway, WhatsApp, push, IVR channel adapters and SMS sender ID / STOP keyword | CHN module (PRD-CHN-005, CHN-006, CHN-013, CHN-004, CHN-012) — they implement the TRK-005 channel contract |
| Email sender identity (domain, SPF/DKIM set-up) | PLT module (PRD-PLT-008) |
| Marketing newsletters and campaigns | MKT module (native Campaign and NewsLetterSubscription) |
| Order confirmation page | CHK module (PRD-CHK-019) — TRK-005 sends the confirmation message |
| PostGlobal exchange of tracking data | INT module (PRD-INT-007) |
| Support agent 360° view | CRM module (PRD-CRM-003) — shows the TRK-002 timeline and TRK-007 log |
| Retention policy engine | PLT module (PRD-PLT-020) — TRK applies its rules to tracking events and the notification log |
| The scanning app itself (mobile build) | External (fit: Not implementable in nopCommerce, TRK-003; builder decided by FG-06) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-TRK-001 | Buyer shipment tracking | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-TRK-002 | |
| PRD-TRK-002 | Tracking event hub | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-TRK-003 | Scanning and field operations app | Platform / back-office | P1 | External system | External system + integration plugin | Postal and logistics pack | | FG-06 |
| PRD-TRK-004 | Email notifications and templates | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-PLT-008 | |
| PRD-TRK-005 | Notification engine (multi-channel) | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-TRK-006 | Notification preferences | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-TRK-007 | Notification delivery tracking and audit | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-004 | |
| PRD-TRK-008 | In-app notification feed | B2B + B2C | P2 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-TRK-009 | Proactive outreach and outage notices | B2B + B2C | P1 | Code-level | Custom plugin | Postal and logistics pack | | |
| PRD-TRK-010 | Seller shipment visibility | Seller / back-office | P1 | Configuration | None | Marketplace pack | | |
| PRD-TRK-011 | Guest order-status lookup | B2C | P1 | Licensed plugin | None | Core (always on) | PRD-TRK-002 | |
| PRD-TRK-012 | Shipment and pickup event notifications | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-CHN-005, PRD-TRK-005 | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (registered) | Tracks own orders, shares a tracking link, sets notification preferences, subscribes to one order's updates, reads the in-app feed | Registered (native) |
| Guest or third party (for example the recipient) | Tracks by tracking number or share link; guest looks up an order with order number and phone or email | Guests (native) / anonymous |
| Seller | Sees hand-over and delivery events for own shipments | Vendors (native) |
| Logistics operations staff | Searches track and trace, reviews missed scans and rejected events, enters manual events, registers devices | Role system name "LogisticsOps" (BR-IAM-050) |
| Field and hub staff | Scan parcels with the external app; their staff and device identifiers are recorded | Role system names "Courier" / "Agent" (BR-IAM-050) |
| Support staff | Reads the notification log, sends proactive notices, manages outage banners | Role system name "Support" (BR-IAM-050; also used by CRM and RET) |
| Client administrator | Edits templates, notification definitions, channels, preference defaults, event mappings and scan rules | Administrators (native) |
| Carrier, postal system, scanning app (system) | Send tracking events through the ingestion interface | External systems via IC-TRK-01 |
| Channel provider (system) | Sends messages and returns delivery receipts and bounces | External systems via CHN adapters (IC-TRK-02, IC-TRK-03) |
| Senders outside the engine (system) | CHN-012 keyword handling and CHN opt-in pages update preferences; CHN reply adapters and CHN-005 command replies (CRM agents, AI-003), CRM ticket e-mail replies and IAM one-time codes check opt-outs before sending | CHN, CRM, AI, IAM services via IC-TRK-06 (decision MSG-ROUTE) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| ContentManagement.MessageTemplatesView (native) | ContentManagement | View message templates; with TRK also notification definitions and channel content | Administrators |
| ContentManagement.MessageTemplatesCreateEditDelete (native) | ContentManagement | Edit message templates; with TRK also notification definitions and channel content per event | Administrators |
| System.ManageMessageQueue (native) | System | Native queued-email list | Administrators |
| Tracking.Core.Events.View | Orders | Track-and-trace search, shipment timelines, missed-scan alerts and rejected events | LogisticsOps, Support |
| Tracking.Core.Events.CreateEditDelete | Orders | Enter manual events, reprocess rejected events, resolve missed-scan alerts | LogisticsOps |
| Tracking.Core.Configuration.CreateEditDelete | Configuration | Event list, source mappings, expected-scan rules, tracking sources and their credentials | Administrators |
| Tracking.Core.Devices.CreateEditDelete | Configuration | Register and revoke scanning devices and link staff identifiers | LogisticsOps, Administrators |
| Tracking.Core.Notifications.View | System | Notification log and delivery reports | Support, Administrators |
| Tracking.Core.NotificationSettings.CreateEditDelete | Configuration | Channels, fallback order, preference defaults, mandatory categories, quiet hours and limits | Administrators |
| Tracking.Core.Outreach.CreateEditDelete | Promotions | Create proactive notices and service banners | Support |
| Tracking.Core.Outreach.Send | Promotions | Send or schedule a proactive notice; activate a banner | Support, Administrators |

Permissions are declared in a TRK plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). Native permissions are reused: ContentManagement.MessageTemplatesView / CreateEditDelete for templates and System.ManageMessageQueue for the email queue (FIT: DefaultPermissionConfigManager). Sellers see shipments through the native Orders.ShipmentsView, which Vendors hold by default (TRK-010). New names use the plugin prefix and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is from the native set. Every default role is spelled as in the product role catalogue BR-IAM-050 (LogisticsOps, Support, Courier, Agent are listed there); the IAM plugin creates a missing catalogue role at install and at start (BR-IAM-050). TRK does not rely on native start-up to create roles: PermissionService creates a missing default role only when it installs a new permission, so a deleted role or a role that holds only native permissions would not be re-created. Public tracking and guest lookup are anonymous pages protected by rate limits and CAPTCHA, not permissions. All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-TRK-PERM-01 | **Given** a user without ContentManagement.MessageTemplatesView (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-02 | **Given** a user without ContentManagement.MessageTemplatesCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-03 | **Given** a user without System.ManageMessageQueue (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-04 | **Given** a user without Tracking.Core.Events.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-05 | **Given** a user without Tracking.Core.Events.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-06 | **Given** a user without Tracking.Core.Configuration.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-07 | **Given** a user without Tracking.Core.Devices.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-08 | **Given** a user without Tracking.Core.Notifications.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-09 | **Given** a user without Tracking.Core.NotificationSettings.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-10 | **Given** a user without Tracking.Core.Outreach.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-TRK-PERM-11 | **Given** a user without Tracking.Core.Outreach.Send, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-TRK-001 | Shipment.TrackingNumber; IShipmentTracker.GetUrlAsync/GetShipmentEventsAsync feeds the customer ShipmentDetails page (ShipmentStatusEvents) for signed-in owners only; bundled tracker only in Shipping.UPS. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Shipping/Tracking/IShipmentTracker.cs; src/Presentation/Nop.Web/Controllers/OrderController.ShipmentDetails; src/Presentation/Nop.Web/Factories/OrderModelFactory (ShipmentStatusEvents, TrackingNumberUrl); PG STF-31 (AFR, port required)] | Custom IShipmentTracker for the client postal/courier sources; public track page by order or tracking number (no login), share link, refresh, CAPTCHA. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-002 | Shipment entity with ShippedDateUtc, ReadyForPickupDateUtc, DeliveryDateUtc; events ShipmentSentEvent, ShipmentReadyForPickupEvent, ShipmentDeliveredEvent. No tracking-event store, no event taxonomy, no missed-scan detection. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Shipping/Shipment.cs; src/Libraries/Nop.Core/Domain/Shipping/ShipmentSentEvent.cs, ShipmentDeliveredEvent.cs; PG ORD-07, INT-03 (AFR, port required)] | Tracking event store with canonical event codes, ingestion adapters (own scanners, couriers, international postal EDI), missed-scan rules (schedule task). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-003 | None. nopCommerce has no scanning/field app; admin shipment create/mark shipped/delivered only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/OrderController (Shipment* actions); no mobile scanning component in src] | Native or cross-platform field scanning app (offline, device ID, GPS, photo/voice/video evidence) outside nopCommerce; nopCommerce needs an authenticated API/plugin to receive scan events into TRK-002. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no app project in the solution; a native mobile app build is outside nopCommerce |
| PRD-TRK-004 | MessageTemplate (localized, LimitedToStores, DelayBeforeSend, AttachedDownloadId), 50+ system templates (OrderPlaced, ShipmentSent, ShipmentDelivered...), tokens, QueuedEmail queue + QueuedMessagesSendTask; EmailAccount with EmailAuthenticationMethod. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Messages/MessageTemplate.cs; src/Libraries/Nop.Core/Domain/Messages/MessageTemplateSystemNames.cs; src/Libraries/Nop.Core/Domain/Messages/QueuedEmail.cs (no bounce field); src/Libraries/Nop.Services/Messages/QueuedMessagesSendTask; PG ORD-11, ADM-S09] | Bounce detection (mailbox/ESP webhook) and flagging the customer address; any client-specific custom tokens (PG CNT-04 AFR). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-005 | 5.00 adds a core SMS provider abstraction: ISmsProvider (Libraries/Nop.Services/Messages/ISmsProvider.cs, SendSmsAsync(phone,text) returns bool), ISmsService/SmsService (Libraries/Nop.Services/Messages/SmsService.cs:39) loading one primary provider from MessagesSettings.ActiveSmsProviderSystemName (Libraries/Nop.Core/Domain/Messages/MessagesSettings.cs:25), admin provider list (Presentation/Nop.Web/Areas/Admin/Controllers/SmsController.cs), bundled Sms.Twilio provider (Plugins/Nop.Plugin.Sms.Twilio/TwilioProvider.cs:13,56; TwilioSettings AccountSID/AuthToken/PhoneNumber). The only caller of ISmsService is phone OTP verification (Presentation/Nop.Web/Controllers/CustomerController.cs:632, OtpSettings); message templates / WorkflowMessageService do not send SMS (no SMS reference in Libraries/Nop.Services/Messages/WorkflowMessageService.cs). Email channel unchanged (IWorkflowMessageService, QueuedEmail). Bundled Misc.Brevo still sends SMS per template via Brevo (Plugins/Nop.Plugin.Misc.Brevo/BrevoSettings.cs:48,53). | Multi-channel engine still to build (one definition rendered per channel, language selection, channel fallback, push/WhatsApp). SMS leg can call core ISmsService instead of a custom provider abstraction; only one primary SMS provider per installation and a bool result, so fallback and delivery status remain build. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-006 | Newsletter subscription types (NewsLetterSubscription/NewsLetterSubscriptionType, unchanged) and PrivateMessageSettings.NotifyAboutPrivateMessages (moved from ForumSettings; Libraries/Nop.Core/Domain/Customers/PrivateMessageSettings.cs). No per-event/channel preferences, quiet hours or caps (not found in 5.00.1 source). | Customer notification preference centre (per event x channel), quiet hours, frequency caps, enforced by the TRK-005 engine. Scope: Per-order subscribe/unsubscribe for updates. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-007 | QueuedEmail.SentOnUtc, SentTries (email only), admin Message queue. New ISmsProvider.SendSmsAsync returns only bool (Libraries/Nop.Services/Messages/ISmsProvider.cs); no SMS log, no delivery receipts (not found in 5.00.1 source). | Message log per channel with sent/delivered/failed status from provider callbacks, linked to order/shipment; audit view. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-008 | PrivateMessage moved from Forums to Customers domain (Libraries/Nop.Core/Domain/Customers/PrivateMessage.cs) with PrivateMessageSettings (AllowPrivateMessages, NotifyAboutPrivateMessages, ShowAlertForPM; Libraries/Nop.Core/Domain/Customers/PrivateMessageSettings.cs); public PrivateMessagesController stays in core (Presentation/Nop.Web/Controllers/PrivateMessagesController.cs). No notification feed (not found in 5.00.1 source). | In-app notification feed (bell icon, unread count, list) fed by the TRK-005 engine; theme widget. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-009 | Campaign (StoreId, CustomerRoleId, NewsLetterSubscriptionTypeId, DontSendBeforeDateUtc) emails newsletter subscribers by role; StoreInformationSettings.StoreClosed. No affected-customer targeting, no service-disruption banner. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Messages/Campaign.cs; src/Libraries/Nop.Core/Domain/StoreInformationSettings.cs] | Segment builder for affected customers (by order/shipment/outlet), multi-channel send via TRK-005, scheduled site banner widget for outages. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-010 | Vendor role has 'Shipments. View' by default; admin shipment list filters to the vendor (GetAllShipmentsAsync(vendorId…)) and shows shipped/ready-for-pickup/delivered dates. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Security/DefaultPermissionConfigManager (Admin area. Shipments. View -> Vendors); src/Presentation/Nop.Web/Areas/Admin/Factories/OrderModelFactory.PrepareShipmentListModelAsync (vendorId filter); src/Libraries/Nop.Core/Domain/Shipping/Shipment.ShippedDateUtc, DeliveryDateUtc] | None for handover/delivery dates. Courier-scan level events depend on TRK-002. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-TRK-011 | Not native: OrderController.Details and ShipmentDetails still require customer.Id == order.CustomerId (Presentation/Nop.Web/Controllers/OrderController.cs:173-179, 292-299). New in 5.00: guest return/withdrawal lookup by order number + billing email with CAPTCHA, emailing a time-limited token link (Presentation/Nop.Web/Controllers/ReturnRequestController.cs:135; route returnrequest/find in Presentation/Nop.Web/Infrastructure/RouteProvider.cs:469-471; ReturnRequestSettings.GuestReturnRequestsAllowed / WithdrawalLinkDaysValid). It does not display order status. | FoxNetSoft guest order-status plugin as used on PG. Availability of a 5.00 build of this licensed vendor plugin is not verifiable from source (decision V-01). Fallback custom plugin can reuse the 5.00 order-number + email + CAPTCHA + token pattern of ReturnRequestController.Find. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in Post Gebeya (4.70.5) — confirm on 5.00.1 |
| PRD-TRK-012 | Templates ShipmentSent/ShipmentReadyForPickup/ShipmentDelivered.CustomerNotification (email), PickupPoint address (unchanged). Core ISmsService/ISmsProvider exists in 5.00 (Libraries/Nop.Services/Messages/SmsService.cs) but is not wired to message templates. | Failed delivery attempt (+reason), pickup details (hours, ID to bring), pickup-deadline and uncollected reminders (schedule task), SMS/WhatsApp via TRK-005. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-TRK-001 Buyer shipment tracking

| Item | Value |
|---|---|
| Description (baseline) | Customers enter an order or tracking number and see a timeline of where the parcel has been, can share a tracking link and refresh it. |
| Why it matters | Customers know where their order is without calling support. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-TRK-002 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-001-01 | As a shopper, I want to track a parcel by its tracking number and see a timeline of where it has been, so that I know where my order is without calling support. | D; REQ-MPC-FR-201; REQ-MPC-FR-208; REQ-KTDA-ORD-001 | Ready |
| US-TRK-001-02 | As a shopper, I want to share a tracking link with the recipient without showing my account, so that the recipient can follow the parcel. | D; REQ-MPC-FR-220 | Ready |
| US-TRK-001-03 | As a shopper, I want the tracking page to refresh by itself and on request, so that I see the latest status. | D; REQ-MPC-FR-222 | Ready |
| US-TRK-001-04 | As a registered shopper, I want a dashboard of my orders with the delivery status of each, so that I can track all my orders in one place. | REQ-MPC-ORD-001; REQ-KTDA-ORD-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-001-01-01 | US-TRK-001-01 | **Given** a shipment has events in TRK-002, **when** anyone enters its tracking number (Shipment.TrackingNumber or another ShipmentReference such as S10 or waybill) on the public tracking page, **then** the timeline lists each event with common event name, local date and time and location where the source gave one, newest first, plus the expected delivery range (LOG-005). | REQ-MPC-FR-201; REQ-MPC-FR-208; REQ-KTDA-ORD-001 |
| AC-TRK-001-01-02 | US-TRK-001-01 | **Given** the number matches no shipment, **when** it is submitted, **then** message Trk.TrackNotFound is shown and nothing else is revealed. | REQ-MPC-FR-201; Proposed |
| AC-TRK-001-01-03 | US-TRK-001-01 | **Given** the public page is used, **when** the timeline is shown, **then** it shows no customer name, address, phone or email; delivery-agent contact is shown only if the source supplied it and the client enabled it (BR-TRK-030). | FC-M15-009; NFR-X-002; Proposed |
| AC-TRK-001-01-04 | US-TRK-001-01 | **Given** the configured number of lookups from one client address is exceeded in the period (setting, default not stated), **when** another lookup is made, **then** a CAPTCHA (SEC-013) is required before the result is shown. | Proposed; FIT (fit: CAPTCHA) |
| AC-TRK-001-04-01 | US-TRK-001-04 | **Given** a signed-in shopper opens an own order, **when** the order page loads, **then** each shipment shows its timeline from TRK-002 (native ShipmentDetails through the hub tracker when ShippingSettings.DisplayShipmentEventsToCustomers is on); the order ID path to tracking is available to the order owner only. | REQ-MPC-FR-201; REQ-MPC-FR-208; FIT (OrderController.ShipmentDetails requires the order customer) |
| AC-TRK-001-04-02 | US-TRK-001-04 | **Given** a signed-in shopper has orders, **when** they open My account orders, **then** each order shows its latest tracking event and expected delivery range. | REQ-MPC-ORD-001; REQ-KTDA-ORD-001 |
| AC-TRK-001-02-01 | US-TRK-001-02 | **Given** a shipment is shown to its owner or on a tracking page, **when** the shopper creates a share link, **then** a signed link with an expiry (setting, default not stated) is created; opening it shows the public timeline only, never account details (SM-TRK-06). | REQ-MPC-FR-220 |
| AC-TRK-001-02-02 | US-TRK-001-02 | **Given** a share link exists, **when** the owner revokes it or it expires, **then** opening it shows message Trk.ShareLinkExpired; creation and revocation are audited (AUD-TRK-007). | REQ-MPC-FR-220 |
| AC-TRK-001-03-01 | US-TRK-001-03 | **Given** the tracking page is open, **when** the configured refresh interval passes (setting, default not stated), **then** the timeline reloads from TRK-002 without a full page reload and the time is shown with message Trk.LastUpdated. | REQ-MPC-FR-222 |
| AC-TRK-001-03-02 | US-TRK-001-03 | **Given** the tracking page is open, **when** the user presses refresh (message Trk.Refresh), **then** the timeline reloads at once; if the carrier supports on-demand Track (IC-LOG-01), a pull is requested no more often than the per-shipment minimum interval (setting). | REQ-MPC-FR-222 |
| AC-TRK-001-01-05 | US-TRK-001-01 | **Given** the shipment has no events yet, **when** the timeline is shown, **then** message Trk.NoEventsYet is shown with the shipment creation date. | Proposed |

**Business rules applied:** BR-TRK-030 (§8.1).


### 7.2 PRD-TRK-002 Tracking event hub

| Item | Value |
|---|---|
| Description (baseline) | Collects tracking updates from the client's own scanners, from courier companies and from international postal systems into one place, using one common list of event names, and flags parcels that missed an expected scan. |
| Why it matters | One reliable tracking picture whatever carrier moves the parcel. |
| Who benefits | Logistics staff; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-002-01 | As a member of logistics operations staff, I want tracking updates from our scanners, couriers and international postal systems collected in one place under one list of event names, so that we have one tracking picture whatever carries the parcel. | D; REQ-MPC-FR-203; REQ-KTDA-LOG-003; REQ-KTDA-INT-003 | Ready |
| US-TRK-002-02 | As a client administrator, I want a standard event dictionary with a mapping for each external system, so that every source speaks the same language. | D; REQ-MPC-FR-221 | Ready |
| US-TRK-002-03 | As a member of logistics operations staff, I want parcels that missed an expected scan flagged for review, so that delays are caught early. | D; REQ-MPC-FR-209 | Ready |
| US-TRK-002-04 | As a client administrator, I want tracking events kept and archived according to retention rules, so that we meet compliance and keep the store manageable. | REQ-MPC-FR-225 | Ready |
| US-TRK-002-05 | As a member of logistics operations staff, I want a track-and-trace screen to find any order or parcel and see its full history, so that I can answer stakeholders. | REQ-MPC-ORD-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-002-01-01 | US-TRK-002-01 | **Given** a source (scanner app, carrier adapter, postal interface, PostGlobal via INT-007, manual entry) is registered with credentials, **when** it posts a batch of events (IC-TRK-01), **then** each event is authenticated, stored as Received with source, source code, reference, event time, location, staff and device identifiers, then processed (SM-TRK-01). | REQ-MPC-FR-203; REQ-KTDA-INT-003 |
| AC-TRK-002-01-02 | US-TRK-002-01 | **Given** an event's reference matches a shipment and its source code has a mapping, **when** it is processed, **then** it becomes Applied with its common event code and appears in the shipment timeline. | REQ-MPC-FR-203; REQ-KTDA-LOG-003 |
| AC-TRK-002-01-03 | US-TRK-002-01 | **Given** a shipping system registered as an API client with scope shipments.write (INT-001), or PostGlobal through INT-007, is a tracking source, **when** it sends an event, **then** the event enters through IC-TRK-01 and is mapped by that source's rows in the TRK-002 SourceCodeMapping (for PostGlobal the rows of the PostGlobal source; INT keeps no status map, BR-INT-030); only TRK-002 calls ShipAsync or DeliverAsync for it (BR-TRK-012); the API and INT-007 never change shipment state. | REQ-KTDA-INT-003; see INT-007 (REQ-MPC-FR-221); FIT (BR-INT-031) |
| AC-TRK-002-01-04 | US-TRK-002-01 | **Given** an event's reference is a return tracking reference registered by RET-003 through IC-TRK-01 RegisterExternalReference (carrier or RET-generated reference), **when** it is processed, **then** it becomes Applied against that return reference, appears in the return timeline, changes no native shipment state, sends no TRK-012 message and is published as Tracking.EventApplied with the ReturnShipment id, which the RET consumer only enqueues. | Proposed; see RET-003 (REQ-MPC-FR-229) |
| AC-TRK-002-01-05 | US-TRK-002-01 | **Given** the same event is received twice (same source event id, or same shipment, code, time and location), **when** the second is processed, **then** it becomes Duplicate and nothing else changes (BR-TRK-011). | Proposed |
| AC-TRK-002-01-06 | US-TRK-002-01 | **Given** an Applied event has a common code flagged "shipped" and the order is not a pickup order and ShippedDateUtc is not set, **when** it is applied, **then** IOrderProcessingService.ShipAsync is called once under ILocker key 'shipment-{ShipmentId}' (BR-TRK-012, BR-LOG-001). | FIT (ShipAsync); Proposed (flag) |
| AC-TRK-002-01-07 | US-TRK-002-01 | **Given** an Applied event is READY_FOR_PICKUP on a pickup order, or DELIVERED / COLLECTED, **when** it is applied, **then** ReadyForPickupAsync, or DeliverAsync after the proof check of BR-LOG-080, is called once; a carrier DELIVERED event counts as proof method "courier confirmation" only where the service level accepts it. | FIT (ReadyForPickupAsync, DeliverAsync); see LOG-012 (REQ-MPC-FR-195) |
| AC-TRK-002-01-08 | US-TRK-002-01 | **Given** events arrive out of order, **when** they are applied, **then** the timeline is ordered by event time; native shipment state never moves backwards. | Proposed |
| AC-TRK-002-02-01 | US-TRK-002-02 | **Given** the event dictionary holds the common codes (BR-TRK-010) and each source has a mapping table from its codes to them, **when** an administrator edits a mapping, **then** it is saved, audited (AUD-TRK-002) and used for events received after the change. | REQ-MPC-FR-221 |
| AC-TRK-002-02-02 | US-TRK-002-02 | **Given** an event arrives with a source code that has no mapping or a reference that matches no shipment, **when** it is processed, **then** it becomes Rejected with the reason, appears in the rejected-events queue and triggers no customer notification (BR-INT-030); after the mapping is added or the shipment linked, staff reprocess it and it becomes Applied (AUD-TRK-001). | REQ-MPC-FR-221; REQ-MPC-FR-209 |
| AC-TRK-002-03-01 | US-TRK-002-03 | **Given** an expected-scan rule says that after event X on route or service level R, event Y must follow within a time limit (setting, default not stated), **when** the limit passes without Y, **then** a scan alert opens (SM-TRK-02) in the operations queue with shipment, last event and expected event. | REQ-MPC-FR-209 |
| AC-TRK-002-03-02 | US-TRK-002-03 | **Given** a scan alert is Open, **when** event Y arrives or staff resolve it with a note, **then** the alert becomes Resolved; a staff resolution is audited (AUD-TRK-008). | REQ-MPC-FR-209 |
| AC-TRK-002-03-03 | US-TRK-002-03 | **Given** a scan alert stays Open beyond the long-stuck limit (setting), **when** the alert task runs, **then** the alert becomes Escalated and a LOG-013 incident of type delayed is opened. | REQ-MPC-FR-209; see LOG-013 (REQ-MPC-FR-186) |
| AC-TRK-002-04-01 | US-TRK-002-04 | **Given** a retention rule for tracking events exists in PLT-020 (active period, archive period), **when** the retention task runs, **then** Applied events older than the active period are moved to the archive store and remain searchable by staff; events older than the archive period are deleted; each run is logged. | REQ-MPC-FR-225; see PLT-020 (REQ-MPC-FR-225) |
| AC-TRK-002-05-01 | US-TRK-002-05 | **Given** a user with Tracking.Core.Events.View searches by order number, tracking reference, S10 or customer phone, **when** the search runs, **then** matching shipments are listed and each opens its full timeline, scan alerts and notification log (TRK-007). | REQ-MPC-ORD-001 |

**Business rules applied:** BR-TRK-010; BR-TRK-011; BR-TRK-012; BR-TRK-013 (§8.1).


### 7.3 PRD-TRK-003 Scanning and field operations app

| Item | Value |
|---|---|
| Description (baseline) | A mobile app for field and hub staff to scan parcels at collection, sorting and delivery. It records who scanned and on which device, works without signal, and adds location, photos, voice notes and video as evidence. |
| Why it matters | Every handover of a parcel is recorded. |
| Who benefits | Malawi Post field staff |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | On hold: FG-06 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-003-01 | As a member of Malawi Post field or hub staff, I want to scan parcels at collection, sorting and delivery with a phone app, so that every hand-over of a parcel is recorded. | D; REQ-MPC-FR-204 | On hold: FG-06 |
| US-TRK-003-02 | As a member of logistics operations staff, I want each scan to carry the staff and device identifiers, so that we know who scanned what and on which device. | D; REQ-MPC-FR-224 | On hold: FG-06 |
| US-TRK-003-03 | As a member of field staff, I want to keep scanning without signal and add location, photos, voice notes and video as evidence, so that work continues in remote areas and evidence is kept. | D; FC-M04-026; FC-M04-027; FC-M04-028 | On hold: FG-06 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-003-01-01 | US-TRK-003-01 | **Given** the external app sends scans of type pickup, hub arrival or departure, or delivery through IC-TRK-01, **when** the batch is received, **then** each scan becomes a TRK-002 event of the matching common code and appears in the timeline. | REQ-MPC-FR-204; FIT (external app + integration plugin) |
| AC-TRK-003-02-01 | US-TRK-003-02 | **Given** a device is registered by a user with Tracking.Core.Devices.CreateEditDelete and linked to a staff identifier, **when** the device submits scans, **then** every event stores the staff identifier and device identifier; a scan from an unregistered or revoked device is rejected and audited (AUD-TRK-003). | REQ-MPC-FR-224 |
| AC-TRK-003-03-01 | US-TRK-003-03 | **Given** scans were captured offline, **when** the device syncs, **then** events keep their capture time from the device, the receipt time is recorded, and events older than the configured sync window are accepted but flagged late (setting, default not stated). | FC-M04-026 |
| AC-TRK-003-03-02 | US-TRK-003-03 | **Given** the scan carries coordinates, **when** it is stored, **then** the coordinates are kept with the event; location is captured with the consent recorded by the app. | FC-M04-027; NFR-X-002 |
| AC-TRK-003-03-03 | US-TRK-003-03 | **Given** the scan carries photo, voice or video files, **when** it is stored, **then** each file is checked through IC-ADM-08 CheckUpload for the TRK upload context "tracking scan media" (registered by TRK at installation through IC-ADM-08 RegisterUploadContext) before it is stored as a Download linked to the event; a refused file is not stored and the event keeps the ADM message key as refusal reason; on admin DownloadFile the SEC-002 filter asks the TRK download-access provider (IC-SEC-05), which claims the file and allows it only to holders of Tracking.Core.Events.View. | FC-M04-028; SINGLE-FILTER; FIT (DownloadService.InsertDownloadAsync takes bytes and is not covered by the ADM-008 IFormFile backstop) |
| AC-TRK-003-01-02 | US-TRK-003-01 | **Given** the app requests the work list of the signed-in staff member, **when** the request is authorised, **then** it receives that member's route list (LOG-024) or pickup list (LOG-011). | Proposed |

**Business rules applied:** BR-TRK-011 (§8.1).


### 7.4 PRD-TRK-004 Email notifications and templates

| Item | Value |
|---|---|
| Description (baseline) | Automatic emails triggered by events (order placed, shipped and so on), using templates that fill in details such as name and order number, in each language and shop. Bounced emails are detected and the address is flagged. |
| Why it matters | Customers are kept informed automatically. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PLT-008 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-004-01 | As a client administrator, I want event-triggered emails (order placed, shipped and others) from templates that fill in details such as name and order number, in each language and shop, so that customers are kept informed automatically. | D; REQ-MPC-FR-212; FC-M17-009 | Ready |
| US-TRK-004-02 | As a client administrator, I want bounced emails detected and the address flagged, so that we stop sending to dead addresses and use another channel. | D; FC-M17-001 | Ready |
| US-TRK-004-03 | As a client administrator, I want to configure email templates and the email channel from the admin, so that we change wording without developers. | REQ-MPC-FR-310 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-004-01-01 | US-TRK-004-01 | **Given** a native message template (for example OrderPlaced.CustomerNotification, ShipmentSent.CustomerNotification) is active for the store, **when** its trigger occurs, **then** the email is rendered with tokens (for example %Order.OrderNumber%, %Customer.FullName%) in the customer's language through LocalizedProperty and queued (QueuedEmail) through the TRK-005 engine. | REQ-MPC-FR-212; FC-M17-009; FIT (MessageTemplate, MessageTokenProvider) |
| AC-TRK-004-01-02 | US-TRK-004-01 | **Given** a template is limited to store A (LimitedToStores) and a store-B copy exists, **when** an order of store B triggers it, **then** the store-B copy is used. | FIT (StoreMapping) |
| AC-TRK-004-01-03 | US-TRK-004-01 | **Given** TRK adds tokens (for example outlet opening hours, pickup code, expected delivery range), **when** an administrator edits a template, **then** the new tokens are listed in the allowed-token list and are filled at send time by the TRK-005 engine. | FC-M02-040; FIT (AdditionalTokensAddedEvent for the list); Proposed |
| AC-TRK-004-02-01 | US-TRK-004-02 | **Given** a bounce feed is configured (IC-TRK-03), **when** a hard bounce is reported for an address, **then** the customer with that email is flagged with the bounce date (SM-TRK-07), the flag shows on the admin customer page with message Trk.EmailBounced, and the email channel is skipped for that customer so the engine uses the fallback channel. | FC-M17-001 |
| AC-TRK-004-02-02 | US-TRK-004-02 | **Given** a customer is flagged bounced, **when** they change or revalidate their email, **then** the flag is cleared and email resumes; both changes are audited (AUD-TRK-009). | Proposed |
| AC-TRK-004-03-01 | US-TRK-004-03 | **Given** a user with ContentManagement.MessageTemplatesCreateEditDelete edits subject, body, active flag, delay or attachment of a template, **when** it is saved, **then** the next message uses the new content; the change is audited through the platform audit trail (AUD-TRK-002). | REQ-MPC-FR-310; FIT (MessageTemplate.DelayBeforeSend, AttachedDownloadId) |

**Business rules applied:** BR-TRK-020 (§8.1).


### 7.5 PRD-TRK-005 Notification engine (multi-channel)

| Item | Value |
|---|---|
| Description (baseline) | The central messaging engine: one message is written once and sent by SMS, email, app notification or WhatsApp in the right language, with a fallback channel if the first fails. |
| Why it matters | Consistent messages on every channel without building each one separately. |
| Who benefits | Shoppers; client staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, MSG-ROUTE, ORDER-MAIL |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-005-01 | As a client administrator, I want to write a message once per event and have it sent by SMS, email, app notification or WhatsApp, so that messages are consistent on every channel. | D; REQ-MPC-FR-214; FC-M17-007; FC-M02-039 | Ready; conditions: OVR-REG, MSG-ROUTE, ORDER-MAIL |
| US-TRK-005-02 | As a shopper, I want messages in my language, so that I understand them. | D; FC-M17-008 | Ready; conditions: OVR-REG, MSG-ROUTE, ORDER-MAIL |
| US-TRK-005-03 | As a client administrator, I want a fallback channel when the first channel fails, so that important messages still arrive. | D | Ready; conditions: OVR-REG, MSG-ROUTE, ORDER-MAIL |
| US-TRK-005-04 | As a shopper, I want an order confirmation after I order and a message whenever my order status changes, so that I always know where my order stands. | REQ-MPC-FR-159; FC-M02-038 | Ready; conditions: OVR-REG, MSG-ROUTE, ORDER-MAIL |
| US-TRK-005-05 | As a client administrator, I want to configure content per event and channel and switch channels on or off, so that each client uses the channels it has. | REQ-MPC-FR-212; REQ-MPC-FR-310 | Ready; conditions: OVR-REG, MSG-ROUTE, ORDER-MAIL |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-005-01-01 | US-TRK-005-01 | **Given** the TRK plugin overrides IWorkflowMessageService (WorkflowMessageService.SendNotificationAsync; INopStartup Order ≥ 3000), **when** any native or product message is sent, **then** it passes through the engine, which resolves the notification definition for the template name or product event code and sends on each channel the definition lists (BR-TRK-020). | D; FIT (5.00.1: WorkflowMessageService.SendNotificationAsync is public virtual, signature unchanged, Libraries/Nop.Services/Messages/WorkflowMessageService.cs:2847-2853; Misc.Brevo BrevoMessageService uses the same override, Plugins/Nop.Plugin.Misc.Brevo/Infrastructure/NopStartup.cs:44) |
| AC-TRK-005-01-02 | US-TRK-005-01 | **Given** a definition lists SMS and email for an event and both channels are enabled, **when** the event occurs, **then** one email (native QueuedEmail) and one SMS (through the CHN-005 adapter) are sent from the channel variants of the same definition, with the same tokens. | REQ-MPC-FR-214; FC-M17-007 |
| AC-TRK-005-01-03 | US-TRK-005-01 | **Given** in-app is enabled for the client and the definition lists it, **when** the event occurs, **then** an in-app notification is created for the customer (TRK-008). | REQ-MPC-FR-214 |
| AC-TRK-005-01-04 | US-TRK-005-01 | **Given** a channel is disabled for the client, **when** an event listing it occurs, **then** that channel is skipped and the skip is logged (TRK-007). | REQ-MPC-FR-214 ("where channels are enabled") |
| AC-TRK-005-01-05 | US-TRK-005-01 | **Given** the recipient must be found for SMS, WhatsApp, push or in-app, **when** the engine resolves it, **then** it uses the Order.OrderId token, else the Shipment.ShipmentNumber token (shipment id), else the Customer.Email token, to load the customer; the phone is Customer.Phone, else the billing address phone (Proposed). | FIT (MessageTokenProvider tokens); Proposed |
| AC-TRK-005-02-01 | US-TRK-005-02 | **Given** the customer's language is L (a language published in the store) and the SMS variant has a translation in L, **when** the message is sent, **then** the L text is used (the native languageId passed by WorkflowMessageService). | FC-M17-008; FIT |
| AC-TRK-005-02-02 | US-TRK-005-02 | **Given** a channel variant has no translation for the customer's language, **when** the message is sent, **then** the client default-language text is used and the gap is logged (Proposed; differs from FC-M17-008, see §5.2). | Proposed |
| AC-TRK-005-03-01 | US-TRK-005-03 | **Given** a definition sets SMS first and email as fallback, **when** the SMS provider reports failure, or the customer has no phone, **then** the email is sent and both attempts are logged with their outcome (SM-TRK-03). | D |
| AC-TRK-005-04-01 | US-TRK-005-04 | **Given** an order is placed, **when** OrderPlaced.CustomerNotification is triggered by native placement, **then** the confirmation with the order number is sent on the channels of its definition. | REQ-MPC-FR-159; see CHK-019 |
| AC-TRK-005-04-02 | US-TRK-005-04 | **Given** an order changes status (native OrderProcessing, OrderCompleted, OrderCancelled templates; shipment templates; ORD-002 product statuses through the engine API IC-TRK-04), **when** the change is saved, **then** the status message for that status is sent on the channels of its definition. | REQ-MPC-FR-159 |
| AC-TRK-005-05-01 | US-TRK-005-05 | **Given** a user with Tracking.Core.NotificationSettings.CreateEditDelete edits a definition (channels, order, fallback, category, mandatory, urgent) or the channel content of an event, **when** it is saved, **then** the next message uses it and the change is audited (AUD-TRK-002). | REQ-MPC-FR-212; REQ-MPC-FR-310 |
| AC-TRK-005-01-06 | US-TRK-005-01 | **Given** Misc.Brevo is installed, **when** TRK is installed, **then** installation is refused with a message that Misc.Brevo also overrides IWorkflowMessageService (BR-TRK-021). | FIT (5.00.1: Brevo NopStartup Order 3000, Plugins/Nop.Plugin.Misc.Brevo/Infrastructure/NopStartup.cs:44); OVR-REG |
| AC-TRK-005-05-02 | US-TRK-005-05 | **Given** a module registers a product event code with its default definition (IC-TRK-04 RegisterEventCode) at plugin installation, **when** an administrator opens notification definitions, **then** the code is listed with its owning module and default channels and can be configured like a native template; codes in the BR-TRK-023 catalogue are registered by their owners. | Proposed ( ADM, CHK, CRM, ORD, SEL, SVC, SEC, EGV) |
| AC-TRK-005-01-07 | US-TRK-005-01 | **Given** a channel adapter (SMS IC-CHN-01, messaging IC-CHN-04, push IC-CHN-05, voice IC-CHN-03) returns Refused for a message, **when** the result is received, **then** the log row becomes Refused with the provider reason and the next channel of the definition is tried, as for Failed (SM-TRK-03). | REQ-MPC-FR-214; see CHN-005 |
| AC-TRK-005-04-03 | US-TRK-005-04 | **Given** a native message that nopCommerce sends only by email (order placed, paid, shipped, password recovery, GDPR) is triggered for a customer whose account has a mobile number and no email (IAM-002), **when** the engine receives it with no recipient email address, **then** no QueuedEmail with an empty address is created; the SMS variant of the definition is sent to the account phone; if the definition has no SMS variant the message is logged Failed with reason no address (BR-TRK-025). | Proposed; see IAM-002 (REQ-MPC-FR-001); FIT (WorkflowMessageService.SendNotificationAsync queues the email without checking the address) |
| AC-TRK-005-04-04 | US-TRK-005-04 | **Given** an order whose lines are all e-Government services (EGV) or service products (SVC) is set to Complete at payment by native CheckAndSaveOrderStatusAsync, **when** OrderCompleted.CustomerNotification is triggered, **then** the engine asks the registered order-kind providers (IC-TRK-05); for a matching order kind it applies the configured action — send the native template, suppress it, or send the substitute definition of that order kind (BR-TRK-024); the store-owner notification is unchanged. | Proposed; FIT (OrderProcessingService.SetOrderStatusAsync sends OrderCompleted.CustomerNotification when status becomes Complete) |
| AC-TRK-005-01-08 | US-TRK-005-01 | **Given** nopCommerce 5.00 sends one of its new templates (Reminders.AbandonedCartFollowUp1 to 3, Reminders.PendingOrderFollowUp1 and 2, Reminders.RegistrationFollowUp, NextRecurringPaymentNotification.CustomerNotification, ReturnRequest.WithdrawalLinkMessage), **when** the template is triggered by its native task or action, **then** it reaches the engine through SendNotificationAsync; TRK installs an e-mail-only default definition for each, so it is sent as natively until the client adds channels, and the ignoreDelayBeforeSend value of the native call is kept (BR-TRK-020). | VER-500; FIT (5.00.1: Libraries/Nop.Core/Domain/Messages/MessageTemplateSystemNames.cs:172, 224, 307-332; Libraries/Nop.Services/Messages/WorkflowMessageService.cs:2847-2853); Proposed (default definitions) |

**Business rules applied:** BR-TRK-020; BR-TRK-021; BR-TRK-022; BR-TRK-026 (§8.1).


### 7.6 PRD-TRK-006 Notification preferences

| Item | Value |
|---|---|
| Description (baseline) | Customers choose which messages they want and on which channels, set quiet hours and limits, and follow a particular order. Customers can also subscribe to, or unsubscribe from, updates for a single order. |
| Why it matters | Customers get useful messages, not spam. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: MSG-ROUTE, OTP-OPTOUT |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-006-01 | As a shopper, I want to choose which messages I receive and on which channels, so that I get useful messages, not spam. | D; REQ-MPC-FR-009; FC-M17-010 | Ready; conditions: MSG-ROUTE, OTP-OPTOUT |
| US-TRK-006-02 | As a shopper, I want to set quiet hours, so that I am not disturbed at night. | D; FC-M17-011 | Ready; conditions: MSG-ROUTE, OTP-OPTOUT |
| US-TRK-006-03 | As a shopper, I want to subscribe to or unsubscribe from updates for a single order, so that I follow only the orders I care about. | D; REQ-MPC-FR-210 | Ready; conditions: MSG-ROUTE, OTP-OPTOUT |
| US-TRK-006-04 | As a client administrator, I want to configure suppression rules: default quiet hours and limits on how many messages a customer receives, so that customers are not overwhelmed. | REQ-MPC-FR-219; REQ-MPC-FR-310; FC-M17-012 | Ready; conditions: MSG-ROUTE, OTP-OPTOUT |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-006-01-01 | US-TRK-006-01 | **Given** notification categories and channels are configured, **when** a signed-in shopper opens notification preferences in My account, **then** a matrix of category × enabled channel is shown with the client defaults; mandatory categories are shown as not changeable. | REQ-MPC-FR-009; FC-M17-010 |
| AC-TRK-006-01-02 | US-TRK-006-01 | **Given** the shopper turns off SMS for category "Shipping updates", **when** a shipping update is sent, **then** no SMS is sent to them; the message is logged Suppressed (preference); other channels follow their settings; the change is audited (AUD-TRK-005). | REQ-MPC-FR-009 |
| AC-TRK-006-01-03 | US-TRK-006-01 | **Given** a category is marked mandatory by the client, **when** the shopper has turned a channel off, **then** mandatory messages still go on their primary channel (BR-TRK-031). | Proposed |
| AC-TRK-006-02-01 | US-TRK-006-02 | **Given** the shopper set quiet hours and a non-urgent message falls inside them, **when** the engine processes it, **then** it is Held and released when the quiet period ends; urgent messages are sent at once (BR-TRK-032). | FC-M17-011 |
| AC-TRK-006-03-01 | US-TRK-006-03 | **Given** a shopper opens an order or the tracking page of a shipment they can see, **when** they press unsubscribe from updates for this order, **then** tracking-update messages for that order are no longer sent to them (message Trk.Unsubscribed); mandatory messages still go. | REQ-MPC-FR-210 |
| AC-TRK-006-03-02 | US-TRK-006-03 | **Given** a shopper unsubscribed from an order, **when** they press subscribe, **then** updates resume for later events (message Trk.Subscribed). | REQ-MPC-FR-210 |
| AC-TRK-006-03-03 | US-TRK-006-03 | **Given** a message about an order is sent, **when** it is rendered, **then** it contains a signed one-click link to unsubscribe from that order's updates, usable without signing in. | REQ-MPC-FR-210; Proposed |
| AC-TRK-006-04-01 | US-TRK-006-04 | **Given** the client sets default quiet hours per channel and a limit of N non-mandatory messages per customer per channel per period (values not stated), **when** the limit is reached, **then** further non-mandatory messages in the period are Suppressed (limit) and logged (BR-TRK-032). | REQ-MPC-FR-219; REQ-MPC-FR-310; FC-M17-012 |
| AC-TRK-006-04-02 | US-TRK-006-04 | **Given** the client changes suppression defaults, **when** they are saved, **then** customers who have not set their own values follow the new defaults; the change is audited (AUD-TRK-002). | REQ-MPC-FR-219 |
| AC-TRK-006-01-04 | US-TRK-006-01 | **Given** a channel needs opt-in (WhatsApp, Telegram, push, voice) and the customer has not opted in, **when** a message lists that channel, **then** the channel is skipped for that customer and the next channel is used; opting in or out from My account, or from the channel (CHN-006, CHN-013, CHN-004 call IC-TRK-06 UpdatePreference), is stored in TRK-006 and audited (AUD-TRK-005). | REQ-MPC-FR-009; see CHN-006 |
| AC-TRK-006-01-05 | US-TRK-006-01 | **Given** a customer texts the SMS opt-out keyword from the phone number of their account, **when** CHN-012 calls IC-TRK-06 UpdatePreference with the customer, channel SMS, opted out and source keyword, **then** SMS is turned off for every non-mandatory category for that customer and the change is audited (AUD-TRK-005); mandatory messages still go by SMS only if SMS is their primary channel (BR-TRK-031). | REQ-MPC-FR-009; see CHN-012; MSG-ROUTE |
| AC-TRK-006-01-06 | US-TRK-006-01 | **Given** a customer has no event-level preference for a category and has a default preferred channel in IAM-015, **when** a message of that category is sent, **then** the default preferred channel is used first, then the definition order (BR-TRK-031). | REQ-MPC-FR-009; see IAM-015 (REQ-MPC-FR-004) |
| AC-TRK-006-01-07 | US-TRK-006-01 | **Given** an opt-out keyword arrives at CHN-012 from a phone number that belongs to no customer account, **when** CHN-012 calls IC-TRK-06 UpdatePreference with the number in international format (BR-IAM-010), channel SMS, opted out and source keyword, **then** a ContactOptOut record for that number and channel becomes OptedOut (SM-TRK-09) and is audited (AUD-TRK-005); no customer record is created (BR-TRK-033). | MSG-ROUTE; see CHN-012 |
| AC-TRK-006-01-08 | US-TRK-006-01 | **Given** a ContactOptOut record for a phone number is OptedOut, **when** the engine is to send a non-mandatory SMS to that number (for example a guest order, or an account whose phone is that number), **then** the SMS is not sent; the message is logged Suppressed with reason opted out and the next channel of the definition is tried (BR-TRK-031, BR-TRK-033). | MSG-ROUTE; Proposed |
| AC-TRK-006-01-09 | US-TRK-006-01 | **Given** a ContactOptOut record is OptedOut for the phone number of a signed-in customer, **when** the customer turns SMS on in My account, or texts the opt-in keyword and CHN-012 calls IC-TRK-06 UpdatePreference with opted in, **then** the customer preference is set on and the ContactOptOut record becomes OptedIn with the source; both changes are audited (AUD-TRK-005). | Proposed |
| AC-TRK-006-01-10 | US-TRK-006-01 | **Given** a sender outside the engine is about to send (a reply in a conversation the customer started: IC-CHN-04 SendReply for a CRM agent or AI-003, a CHN-005 reply to an inbound SMS command, a CRM agent e-mail reply on a ticket; or an IAM-002 one-time code through IC-IAM-01), **when** it calls IC-TRK-06 CheckAllowed with the recipient (customer id, or phone number or channel address), channel, category and sender module, **then** TRK answers Allowed, or Blocked with the reason, by BR-TRK-031 and BR-TRK-033 (quiet hours and limits do not apply, BR-TRK-026); the sender sends nothing when Blocked, and a Blocked answer is logged in the notification log as Suppressed with the sender module and reason. | MSG-ROUTE; Proposed (operation) |

**Business rules applied:** BR-TRK-031; BR-TRK-032; BR-TRK-033 (§8.1).


### 7.7 PRD-TRK-007 Notification delivery tracking and audit

| Item | Value |
|---|---|
| Description (baseline) | Records whether each message was sent, delivered or failed on each channel, linked to the order or shipment. |
| Why it matters | Proves customers were notified, and failed messages can be fixed. |
| Who benefits | Support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEC-004 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-007-01 | As a member of support staff, I want a record of whether each message was sent, delivered or failed on each channel, linked to the order or shipment, so that I can prove customers were notified and fix failed messages. | D; REQ-MPC-FR-215; FC-M17-013; FC-M17-014 | Ready |
| US-TRK-007-02 | As a client administrator, I want delivery reports by channel and event type, so that I can see which channels work. | D; REQ-MPC-FR-213 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-007-01-01 | US-TRK-007-01 | **Given** the engine sends, holds, suppresses or fails a message, **when** the outcome is known, **then** a log row stores channel, definition, template version, recipient, order and shipment ids where known, status (SM-TRK-03), provider message id and times. | REQ-MPC-FR-215; FC-M17-013; FC-M02-042 |
| AC-TRK-007-01-02 | US-TRK-007-01 | **Given** a provider sends a delivery receipt or failure (IC-TRK-02), **when** it is received, **then** the log row moves to Delivered, Failed or Refused by provider message id; a failure or refusal starts the fallback channel if one is defined. | FC-M17-013 |
| AC-TRK-007-01-03 | US-TRK-007-01 | **Given** a module sends one notice to many people and must prove each delivery (for example SEC-008 breach notices to affected persons), **when** the notices are sent through IC-TRK-04, **then** one log row per person and channel is kept with its outcome, and the sending module can read the outcome per person by its reference. | FC-M17-013; Proposed |
| AC-TRK-007-01-04 | US-TRK-007-01 | **Given** an email is queued, **when** QueuedMessagesSendTask sends it or reaches the native retry limit, **then** the log row moves to Sent (QueuedEmail.SentOnUtc set) or Failed; Delivered is set only if the email provider reports delivery. | FIT (QueuedEmail.SentOnUtc, SentTries) |
| AC-TRK-007-01-05 | US-TRK-007-01 | **Given** a user with Tracking.Core.Notifications.View opens an order in admin, **when** the notifications panel loads (admin_order_details_block), **then** every message for that order and its shipments is listed with channel, status and time, and the content can be viewed. | REQ-MPC-FR-215; FIT (AdminWidgetZones.OrderDetailsBlock) |
| AC-TRK-007-02-01 | US-TRK-007-02 | **Given** messages were sent in a period, **when** the delivery report is run, **then** counts of sent, delivered, failed, held and suppressed are shown by channel and event type, and exported. | REQ-MPC-FR-213 |
| AC-TRK-007-01-06 | US-TRK-007-01 | **Given** the PLT-020 retention period for the notification log passes, **when** the retention task runs, **then** rows older than the period are deleted and the run is logged. | FC-M17-014; see PLT-020 |

**Business rules applied:** BR-TRK-022 (§8.1).


### 7.8 PRD-TRK-008 In-app notification feed

| Item | Value |
|---|---|
| Description (baseline) | A bell icon in the customer's account showing their recent notifications. |
| Why it matters | Customers can see past messages in one place. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-008-01 | As a shopper, I want a bell icon in my account with my recent notifications and an unread count, so that I can see past messages in one place. | D; FC-M17-006; FC-M06-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-008-01-01 | US-TRK-008-01 | **Given** in-app is enabled and the customer has unread notifications, **when** any storefront page loads for the signed-in customer, **then** the bell in the header (widget zone header_links_after) shows the unread count. | FC-M17-006; FIT (PublicWidgetZones.HeaderLinksAfter) |
| AC-TRK-008-01-02 | US-TRK-008-01 | **Given** the customer opens the bell, **when** the list is shown, **then** notifications are listed newest first with text, time and link to the order or shipment; opening one marks it Read (SM-TRK-08). | FC-M06-003 |
| AC-TRK-008-01-03 | US-TRK-008-01 | **Given** the customer clears a notification, **when** they confirm, **then** it is Cleared and no longer listed; it stays until cleared otherwise. | FC-M17-006 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.9 PRD-TRK-009 Proactive outreach and outage notices

| Item | Value |
|---|---|
| Description (baseline) | Sends messages to chosen groups of customers (for example everyone affected by a delay) and shows a banner on the site when a service is disrupted. |
| Why it matters | Customers hear about problems before they complain. |
| Who benefits | Shoppers; support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-009-01 | As a member of support staff, I want to send a message to a chosen group of affected customers, for example everyone whose parcel is delayed at one hub, so that customers hear about problems before they complain. | D; REQ-MPC-FR-267 | Ready |
| US-TRK-009-02 | As a member of support staff, I want a banner on the site and the tracking page when a service is disrupted or tracking updates are delayed, so that customers know updates may be late. | D; REQ-MPC-FR-223 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-009-01-01 | US-TRK-009-01 | **Given** a user with Tracking.Core.Outreach.CreateEditDelete builds a notice with criteria (shipment status or last event, outlet, area, carrier, order status, date range), **when** they preview it, **then** the number of matching customers and a sample are shown before sending. | REQ-MPC-FR-267 |
| AC-TRK-009-01-02 | US-TRK-009-01 | **Given** a notice is ready, **when** a user with Tracking.Core.Outreach.Send sends it now or schedules it, **then** each matching customer receives it through the TRK-005 engine in their language, preferences applied for the category "Service notices"; the send is audited (AUD-TRK-006) (SM-TRK-04). | REQ-MPC-FR-267 |
| AC-TRK-009-02-01 | US-TRK-009-02 | **Given** a banner with text, stores, start and end time is created and activated, **when** a storefront or tracking page loads within the period, **then** the banner is shown at the top of the page (widget zone header_before) and disappears after the end time (SM-TRK-05). | REQ-MPC-FR-223; FIT (PublicWidgetZones.HeaderBefore) |
| AC-TRK-009-02-02 | US-TRK-009-02 | **Given** a tracking source has sent no events for longer than its stall limit (setting, default not stated), **when** the source monitor runs, **then** an automatic banner with message Trk.UpdatesDelayed is activated on the tracking pages for shipments of that source, and removed when events resume. | REQ-MPC-FR-223 |
| AC-TRK-009-01-03 | US-TRK-009-01 | **Given** a notice is scheduled, **when** the user cancels it before the time, **then** it is Cancelled and nothing is sent. | Proposed |

**Business rules applied:** BR-TRK-031 (§8.1).


### 7.10 PRD-TRK-010 Seller shipment visibility

| Item | Value |
|---|---|
| Description (baseline) | Sellers see when their parcels were handed over and delivered. |
| Why it matters | Sellers can answer their own customers' questions. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-010-01 | As a seller, I want to see when my parcels were handed over and delivered, so that I can answer my own customers. | D; REQ-MPC-FR-218 | Ready |
| US-TRK-010-02 | As a seller, I want to see the full tracking timeline of my shipments, so that I can follow problem parcels. | REQ-MPC-FR-218; REQ-MPC-ORD-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-010-01-01 | US-TRK-010-01 | **Given** a seller signs in to the admin area (Vendors role, Orders.ShipmentsView), **when** they open the shipment list, **then** only shipments of their own products are listed with shipped, ready-for-pickup and delivered dates. | REQ-MPC-FR-218; FIT (PrepareShipmentListModelAsync vendor filter) |
| AC-TRK-010-02-01 | US-TRK-010-02 | **Given** ShippingSettings.DisplayShipmentEventsToStoreOwner is on, **when** the seller opens one of their shipments, **then** the TRK-002 timeline is shown through the hub tracker, including hand-over events (pickup, drop-off accepted) and delivery. | REQ-MPC-FR-218; REQ-MPC-ORD-001; FIT (admin OrderModelFactory uses GetShipmentTrackerAsync) |
| AC-TRK-010-01-02 | US-TRK-010-01 | **Given** the seller opens a shipment of another seller by id, **when** the page is requested, **then** access is refused (native HasAccessToShipmentAsync). | FIT |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.11 PRD-TRK-011 Guest order-status lookup

| Item | Value |
|---|---|
| Description (baseline) | Anyone can check an order's status with the order number and their phone number or email, without logging in. |
| Why it matters | Easy tracking for guest buyers. |
| Who benefits | Guest shoppers |
| Phase | P1 |
| Implementation | Licensed plugin — None |
| Depends on | PRD-TRK-002 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-011-01 | As a guest shopper, I want to check my order status with the order number and my phone number or email, without logging in, so that I can track an order placed as a guest. | D; REQ-MPC-FR-201 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-011-01-01 | US-TRK-011-01 | **Given** the FoxNetSoft guest order-status plugin for nopCommerce 5.00 is licensed and installed (V-01), or the custom fallback is built, **when** a guest enters an order number and the phone or email of the order, **then** if both match one order, its status, shipments and TRK-002 timeline are shown without personal details beyond the masked contact. | REQ-MPC-FR-201; V-01 |
| AC-TRK-011-01-02 | US-TRK-011-01 | **Given** the order number and contact do not match, **when** the lookup is submitted, **then** message Trk.GuestLookupFailed is shown without saying which field is wrong. | REQ-MPC-FR-201; Proposed |
| AC-TRK-011-01-03 | US-TRK-011-01 | **Given** the configured number of failed lookups from one client address is exceeded, **when** another lookup is made, **then** a CAPTCHA (SEC-013) is required. | Proposed |

**Business rules applied:** BR-TRK-030 (§8.1).


### 7.12 PRD-TRK-012 Shipment and pickup event notifications

| Item | Value |
|---|---|
| Description (baseline) | Automatic messages when a parcel is on its way, ready for pickup (with where, when and what to bring), when a delivery attempt failed and why, and reminders before the pickup deadline or when a parcel is still uncollected. |
| Why it matters | Fewer missed deliveries and uncollected parcels. |
| Who benefits | Shoppers; Malawi Post |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CHN-005, PRD-TRK-005 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-TRK-012-01 | As a shopper, I want messages when my parcel is shipped, out for delivery, ready for pickup and delivered, on the channels I use, so that I always know what is happening. | D; REQ-MPC-FR-202 | Ready |
| US-TRK-012-02 | As a shopper, I want the pickup message to say where, when and what to bring, so that I can collect without a wasted trip. | D; REQ-MPC-FR-206 | Ready |
| US-TRK-012-03 | As a shopper, I want to be told when a delivery attempt failed, why, and how to reschedule, so that I can arrange another attempt. | D; REQ-MPC-FR-207 | Ready |
| US-TRK-012-04 | As a shopper, I want reminders before the pickup deadline and a notice when my parcel is still uncollected, so that I do not lose my parcel. | D; REQ-MPC-FR-216 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-TRK-012-01-01 | US-TRK-012-01 | **Given** a shipment is shipped through ShipAsync, **when** ShipmentSent.CustomerNotification is triggered, **then** the message is sent on the channels of its definition with the tracking number and tracking link. | REQ-MPC-FR-202; FIT |
| AC-TRK-012-01-02 | US-TRK-012-01 | **Given** TRK-002 applies an OUT_FOR_DELIVERY event, **when** it is applied, **then** template ShipmentOutForDelivery.CustomerNotification (new) is sent once per shipment, with the delivery OTP where the service level requires it (LOG-012). | REQ-MPC-FR-202 |
| AC-TRK-012-01-03 | US-TRK-012-01 | **Given** a shipment is delivered or collected through DeliverAsync, **when** ShipmentDelivered.CustomerNotification is triggered, **then** the message is sent on the channels of its definition. | REQ-MPC-FR-202; FIT |
| AC-TRK-012-02-01 | US-TRK-012-02 | **Given** a pickup shipment is made ready through ReadyForPickupAsync, **when** ShipmentReadyForPickup.CustomerNotification is triggered, **then** the message includes the outlet name and address, opening hours (StorePickupPoint.OpeningHours), the pickup code or QR (CHK-012), the configured text on identification to bring, and the pickup deadline. | REQ-MPC-FR-206; FIT (StorePickupPoint); see CHK-012 |
| AC-TRK-012-03-01 | US-TRK-012-03 | **Given** a delivery attempt fails with a reason code (LOG-013), **when** the attempt is recorded, **then** template ShipmentDeliveryAttemptFailed.CustomerNotification (new) is sent with the reason text and a signed link to the LOG-013 rescheduling page. | REQ-MPC-FR-207; see LOG-013 |
| AC-TRK-012-04-01 | US-TRK-012-04 | **Given** a parcel awaits collection and the reminder lead time before the deadline is reached (setting, default not stated), **when** the reminder task runs, **then** template ShipmentPickupReminder.CustomerNotification (new) is sent once per reminder step with the deadline and any holding charge due (LOG-017). | REQ-MPC-FR-216 |
| AC-TRK-012-04-02 | US-TRK-012-04 | **Given** the pickup deadline passes and the parcel is not collected (LOG-017 Uncollected), **when** the reminder task runs, **then** ShipmentUncollected.CustomerNotification (new) goes to the buyer and ShipmentUncollected.StoreOwnerNotification (new) to the outlet and operations contacts. | REQ-MPC-FR-216 |
| AC-TRK-012-01-04 | US-TRK-012-01 | **Given** the same event is applied twice for a shipment, **when** the notification step runs, **then** no second message is sent for that shipment and event (BR-TRK-022). | Proposed |

**Business rules applied:** BR-TRK-022 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-TRK-010 | Common event codes (Proposed; source terms in brackets): CREATED, ACCEPTED (drop-off, hand-over), PICKED_UP, ARRIVED_HUB, DEPARTED_HUB (hand-over at hubs), IN_TRANSIT, CUSTOMS_HELD, CUSTOMS_CLEARED, OUT_FOR_DELIVERY, ATTEMPT_FAILED (with reason code), READY_FOR_PICKUP, DELIVERED, COLLECTED, RETURNED_TO_SENDER, EXCEPTION, CORRECTION. Each code has a "shipped" flag (default on for ACCEPTED, PICKED_UP, ARRIVED_HUB, DEPARTED_HUB, IN_TRANSIT, OUT_FOR_DELIVERY) and a display name per language. Each source has a mapping table from its codes to these codes. | TRK-002, TRK-003 | REQ-MPC-FR-221; REQ-MPC-FR-202; REQ-MPC-FR-207; FC-M15-008; Proposed (list) |
| BR-TRK-011 | An event is a duplicate if its source event id was already received from the same source, or, when no id is given, if an event with the same shipment, code, event time and location exists. Duplicates change nothing. | TRK-002, TRK-003 | Proposed |
| BR-TRK-012 | Applying an event changes native shipment state only forwards and only through IOrderProcessingService (ShipAsync for the first "shipped" code on a non-pickup order; ReadyForPickupAsync for READY_FOR_PICKUP on a pickup order; DeliverAsync for DELIVERED or COLLECTED after BR-LOG-080), under ILocker key 'shipment-{ShipmentId}'. Every product shipping-rate method and pickup provider returns the TRK hub tracker from GetShipmentTrackerAsync so native shipment pages show the hub timeline; TRK does not override IShipmentService (owner ORD-010, OVR-REG) or IOrderProcessingService (owner CHK-003); if the CHK-003 override refuses a call through an ORD hook (for example an ORD-010 hold), the event stays Applied in the timeline and the refusal is listed in the operations queue for retry. Events from the public API (INT-001, scope shipments.write) and PostGlobal (INT-007) follow the same rule; those modules never change shipment state. | TRK-002, TRK-010 | FIT (ShipmentService.GetShipmentTrackerAsync; OrderProcessingService); OVR-REG;, |
| BR-TRK-013 | Tracking events follow the PLT-020 retention rules: active period, then archive (still searchable by staff), then deletion; each run is logged. | TRK-002 | REQ-MPC-FR-225 |
| BR-TRK-020 | Every notification goes through the engine (the only messages outside it are those of BR-TRK-026): the TRK plugin overrides IWorkflowMessageService (derived from WorkflowMessageService, override of SendNotificationAsync, INopStartup Order ≥ 3000). For each send the engine finds the notification definition for the template name (native templates, and plugin message templates sent through IWorkflowMessageService such as PAY Pay.RefundAfterCancel.CustomerNotification and the CAT Catalogue.* templates) or product event code (IC-TRK-04), applies TRK-006 preferences, renders each channel variant with the same tokens in the customer language, sends, and logs (TRK-007). It returns the queued email id when email is sent, otherwise 0. The override keeps the optional parameter ignoreDelayBeforeSend and passes it on: the 5.00 reminder senders set it to true because the reminder task has already applied the delay. The senders added in 5.00 (SendAbandonedCartFollowUpCustomerNotificationAsync, SendPendingOrderFollowUpCustomerNotificationAsync, SendIncompleteRegistrationNotificationMessageAsync, SendNextRecurringPaymentNotificationCustomerMessageAsync, SendWithdrawalRequestConfirmationNotificationAsync) all end in SendNotificationAsync, so their templates reach the engine like any native template; the forum and news senders left core (forum and news templates are sent by the bundled Misc.Forums and Misc.News plugins, which also call IWorkflowMessageService.SendNotificationAsync). | TRK-004, TRK-005 | FIT (5.00.1: Libraries/Nop.Services/Messages/WorkflowMessageService.cs:2847-2853 SendNotificationAsync is virtual; new senders at :1486, :1884, :2910, :2953, :3002; Plugins/Nop.Plugin.Misc.Forums/Services/ForumService.cs:371; Brevo pattern) |
| BR-TRK-021 | IWorkflowMessageService has one owner, TRK-005 (OVR-REG). The bundled Misc.Brevo (BrevoMessageService, Order 3000) is not installed in client instances; TRK installation is refused while Brevo is installed, and SMS goes through CHN-005 instead of Brevo. The SMS leg of the engine is the CHN-005 adapter (IC-CHN-01); since 5.00 that adapter sends through local-aggregator ISmsProvider plugins (see CHN-005), but the engine does not call the core ISmsService directly, because ISmsService returns only true or false and uses one primary provider, so it gives no delivery status (TRK-007) and no fallback. The override is entry (8) of the ADM extension register (BR-ADM-003). | TRK-005 | FIT (5.00.1: Plugins/Nop.Plugin.Misc.Brevo/Infrastructure/NopStartup.cs:44; Libraries/Nop.Services/Messages/ISmsService.cs:14; Libraries/Nop.Services/Messages/SmsService.cs:39-49); L1 §6.2 principle 7; OVR-REG |
| BR-TRK-022 | A notification is sent at most once per occurrence: the key is definition + entity (order or shipment) + event occurrence + channel + recipient; a fallback attempt is a new row linked to the first. | TRK-005, TRK-007, TRK-012 | Proposed |
| BR-TRK-023 | Product event code catalogue. Each owning module registers its codes through IC-TRK-04 RegisterEventCode at installation and names them in its own chapter (names Proposed by the owners); this list is complete for the codes named in the owner chapters and a chapter that adds or removes a code updates it in the same change. ADM (BR-ADM-085): Administration.ApprovalAssigned, Administration.ApprovalDecided, Administration.WorkflowCaseFailed, Administration.AlertRaised, Administration.UploadInfected, Administration.ScreeningMatch. CHK (AC-CHK-019-01-04): Chk.OrderPlacedGroup.CustomerNotification (split checkout confirmation, CHK-019); Chk.PickupCode (CHK-012; inactive by default because ShipmentReadyForPickup.CustomerNotification carries the code token that CHK-012 supplies, TRK-012; AC-CHK-012-01-03). CHN (CHN NOTIF): Chn.Core.SmsOptOutConfirmed, Chn.Core.SmsOptInConfirmed, Chn.Core.SmsProviderAlert, Chn.Core.AgentMembershipDeactivated. CRM (BR-CRM-004): Ticket.Created, Ticket.StatusChanged, Ticket.Resolved, Support.Core.SlaBreached, Support.Core.EarlyWarning, Support.Core.FraudReferral, Support.Core.AccountManagerAssigned. DOC (BR-DOC-060): Documents.Ready, Documents.ReviewRequested, Documents.ReviewDecided, Documents.IntegrityMismatch, Documents.RequirementAlert, Documents.VaultExpiring. EGV (BR-EGV-016): Egv.Status.* (application status), Egv.Core.ResubmissionRequested, Egv.Core.ApplicationToReview, Egv.Core.AppointmentConfirmed, Egv.Core.AppointmentChanged, Egv.Core.AppointmentReminder, Egv.Core.FeeNotificationFailed. FIN (BR-FIN-013): Fin.Core.ReferralStatusChanged, Fin.Core.RepaymentDeducted, Fin.Core.InvoiceFinancingDecided, Fin.Core.PolicyIssued, Fin.Core.PolicyIssueFailed, Fin.Core.ClaimStatusChanged, Fin.Core.PartnerFulfilmentCompleted, Fin.Core.PartnerFulfilmentFailed. IAM (BR-IAM-150): Iam.NewCountryLogin.CustomerNotification, Iam.Invitation.Email, Iam.TradeApplicationApproved.CustomerNotification, Iam.Core.TradeApplicationRejected, Iam.Core.MobileRegistrationCompleted, Iam.Core.SuspiciousLogin, Iam.Core.AccessReviewOpened, Iam.Core.AccessReviewOverdue, Iam.Core.PolicyAcceptanceRequired, Iam.Core.PrivacyRequestUpdated, Iam.Core.AccountDeactivated, Iam.Core.AccountReactivated. INT (INT NOTIF): Int.Core.MessageDeadLettered (also for messages INV-012 and IAM-019 enqueue through IC-INT-09), Int.Core.HealthAlert, Int.Core.PostingFailed, Int.Core.ReconciliationExceptions, Int.Core.ApiVersionDeprecated, Int.Core.SubscriptionPaused. INV (INV NOTIF): Inv.UnpaidOrderReminder. LOG (BR-LOG-180): Log.SellerPickupScheduled, Log.DropOffAccepted, Log.ExceptionEscalated, Log.CodDiscrepancy, Log.StaffAlert. MKT (BR-MKT-015 (e)): Mkt.Core.ContentRevisionPending, Mkt.Core.ContentRevisionDecided, Mkt.Core.ReferralRewarded. ORD (AC-ORD-002-03-02): Ord.Core.StageChanged (default for customer-visible stages; a stage may name another registered code in OrderStageDefinition.TrkEventCode), Ord.Core.Cancelled, Ord.Core.SellerDeadlineReminder, Ord.Core.PartialSupplyProposed, Ord.Core.SlaEscalation, Ord.Core.RfqInvitation, Ord.Core.RfqAnswered, Ord.Core.QuoteReceived, Ord.Core.CounterOffer, Ord.Core.QuoteDeclined, Ord.Core.QuoteExpired, Ord.Core.RequisitionDecided, Ord.Core.ContractForReview, Ord.Core.ContractForSigning, Ord.Core.LetterIssued, Ord.Core.SecurityExpiring, Ord.Core.GroupDealOutcome. PAY (BR-PAY-160): Pay.Status.Failed, Pay.Status.Pending, Pay.ReversalRecorded, Pay.RefundStatus, Pay.RefundAwaitingApproval, Pay.LcRejected, Pay.EscrowReleaseFailed, Pay.ChargebackDeadline, Pay.FiscalSubmissionFailed, Pay.ShiftDifference. PLT (BR-PLT-096): Platform.ChangeSetPending, Platform.ChangeSetDecided, Platform.PackApplyAttention, Platform.UpgradeCheckFailed, Platform.RateNotApplied. RET (RET MESSAGE_NOTE): Returns.Core.SellerReturnRequested, Returns.Core.ReturnShipmentBooked, Returns.Core.CaseUpdated, Returns.Core.CaseMessage, Returns.Core.SlaBreached, Returns.Core.RefundAttention. RPT (RPT MESSAGE_NOTE): Analytics.Core.ExtractFailed. SEC (BR-SEC-100): Sec.BreachNotice, Sec.Core.AuditChainBroken, Sec.Core.ExportBacklog, Sec.Core.BreachDeadline, Sec.Core.AuditorAccess, Sec.Core.ImpactAssessmentReview, Sec.Core.ProfileIncomplete. SEL (BR-SEL-022): Sel.ApplicationApproved.SellerNotification, Sel.ApplicationRejected.SellerNotification, Sel.DocumentExpiring.SellerNotification, Sel.PayoutAccountChangePending.SellerNotification, Sel.PanelExpiring.SellerNotification, Sel.Core.VerificationDecided, Sel.Core.DocumentResubmissionRequested, Sel.Core.DocumentRejected, Sel.Core.DocumentExpired, Sel.Core.PayoutAccountChangeDecided, Sel.Core.SettlementPaid, Sel.Core.SettlementFailed, Sel.Core.CommissionInvoiceIssued, Sel.Core.CommissionInvoiceOverdue, Sel.Core.KpiWarning, Sel.Core.AppealDecided, Sel.Core.ComplaintRegistered, Sel.Core.Invitation. SRC (SRC NOTIF): Src.SavedSearchMatch, Src.PriceDrop, Src.TaxonomyDecision. SVC (BR-SVC-102): Svc.ConfirmService, Svc.Core.BookingConfirmed, Svc.Core.BookingRescheduled, Svc.Core.BookingCancelled, Svc.Core.CancellationFeeApplied, Svc.Core.BookingReminder, Svc.Core.VoucherIssued, Svc.Core.BalanceDue, Svc.Core.BalanceOverdue, Svc.Core.SlaAtRisk, Svc.Core.SlaBreached, Svc.Core.FeedbackRequest, Svc.Core.NotDelivered, Svc.Core.QualificationExpired. AI and CAT register no codes (AI-003 uses the CRM code Ticket.Created; CAT message templates go through IWorkflowMessageService, BR-TRK-020). A send with an unregistered code is refused (IC-TRK-04 error). | TRK-005 | Proposed; MSG-ROUTE (all owner chapters) |
| BR-TRK-024 | Order-kind action for native order templates: modules that own an order kind (EGV e-Government applications, SVC service orders) register an order-kind provider (IC-TRK-05). When OrderCompleted.CustomerNotification is triggered for an order whose lines all belong to one registered kind, the engine applies the action configured for that kind: Send (native template), Suppress (logged Suppressed, reason order kind), or Substitute (the substitute definition of the kind is sent instead). No default is set (Not stated in source). | TRK-005 | Proposed; FIT (OrderProcessingService.SetOrderStatusAsync);, |
| BR-TRK-025 | No-email route: when a native template reaches the engine with an empty recipient email address, the email channel is skipped (no QueuedEmail is created) and the SMS variant is sent to Customer phone, else billing address phone; with no SMS variant or no phone the message is logged Failed with reason no address. TRK installs SMS variants for OrderPlaced, OrderPaid, ShipmentSent, CustomerPasswordRecovery and the GDPR customer templates (Proposed content). | TRK-005 | Proposed; FIT (WorkflowMessageService.SendNotificationAsync); (IAM-002) |
| BR-TRK-030 | Pages without sign-in (tracking number, share link, guest lookup) show no customer name, address, phone or email (a masked contact at most); repeated lookups from one client address beyond a setting require a CAPTCHA. | TRK-001, TRK-011 | REQ-MPC-FR-220; NFR-X-002; Proposed |
| BR-TRK-031 | Preference order (applied by the engine and by IC-TRK-06 CheckAllowed): a mandatory category is always sent on its primary channel; otherwise a message is sent on a channel only if the customer (or, if unset, the client default) allows that category on that channel, the channel is opted in where it needs opt-in (WhatsApp, Telegram, push, voice), SMS is not opted out (customer preference, or a ContactOptOut record for the phone number, BR-TRK-033), and the customer has not unsubscribed from that order's updates. Channel order: the customer's event-level preference, else the IAM-015 default preferred channel, else the definition order. | TRK-006, TRK-009 | REQ-MPC-FR-009; REQ-MPC-FR-210; Proposed (mandatory, order);,; MSG-ROUTE |
| BR-TRK-026 | Messages outside the engine (decision MSG-ROUTE, Proposed): TRK-005 sends every notification. Only two kinds of message may be sent without it: (1) conversational replies in a conversation the customer started: CHN channel replies through IC-CHN-04 SendReply (CRM agents, AI-003 chatbot), CHN-005 replies to inbound SMS commands, and CRM agent e-mail replies on a ticket through the native e-mail account (BR-CRM-004); (2) IAM one-time codes sent to CHN-005 through IC-IAM-01 (BR-IAM-150); where IAM uses the native 5.00 phone one-time-code flow, the code is sent by CustomerController through the core ISmsService to the primary ISmsProvider, which is the CHN-005 aggregator plugin, and that plugin makes the CheckAllowed call (see CHN-005; Presentation/Nop.Web/Controllers/CustomerController.cs:632). Before each such send the sender calls IC-TRK-06 CheckAllowed with the recipient, channel and category (Conversation replies or Security codes, Proposed names) and does not send when Blocked. Quiet hours and message limits (BR-TRK-032) do not apply to them; delivery results stay in the sender's own log (CHN ChannelMessage, IAM OtpChallenge). | TRK-005, TRK-006 | MSG-ROUTE; Proposed (operation, category names) |
| BR-TRK-033 | Opt-outs of phone numbers without an account (decision MSG-ROUTE): TRK-006 keeps one ContactOptOut record per phone number (international format, BR-IAM-010) and channel, with status (SM-TRK-09), source and time. It is written only through IC-TRK-06 UpdatePreference (CHN-012 keywords, staff on request). A non-mandatory message on that channel to that number is not sent, whether or not the number later belongs to an account; when a customer with that phone number turns the channel on in My account or texts the opt-in keyword, the record becomes OptedIn. No customer record is created for such a number. | TRK-006 | MSG-ROUTE; Proposed (record, opt-in rule) |
| BR-TRK-040 | Every TRK setting key is listed in the TRK plugin key catalogue (key, type, layer, secret flag, default); source, device and provider credentials are flagged secret, so packs refuse them and exports omit them (BR-PLT-013). TRK pages, widgets and scheduled tasks check the feature state through IC-PLT-02 (productfeature.<prd-id>, per store) before they show or run. | All TRK features | CFG-01; NFR-X-008 |
| BR-TRK-032 | Suppression: a non-urgent message inside the customer's (or default) quiet hours is Held until they end; a non-mandatory message over the customer's limit for the channel and period is Suppressed; urgent messages ignore quiet hours. Held messages are re-checked against preferences when released. | TRK-006 | REQ-MPC-FR-219; FC-M17-011; FC-M17-012 |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-TRK-01 | TrackingEvent | (none) | received from a source | source authenticated | Received | stored with raw payload |
| SM-TRK-01 | TrackingEvent | Received | processed | duplicate (BR-TRK-011) | Duplicate | nothing else |
| SM-TRK-01 | TrackingEvent | Received | processed | code mapped and shipment found | Applied | timeline; native state per BR-TRK-012; notification per TRK-012 |
| SM-TRK-01 | TrackingEvent | Received | processed | code mapped and reference is a registered return reference (RET-003) | Applied | return timeline; Tracking.EventApplied with ReturnShipment id; no native state change; no TRK-012 message |
| SM-TRK-01 | TrackingEvent | Received | processed | code unmapped or shipment not found | Rejected | rejected-events queue |
| SM-TRK-01 | TrackingEvent | Rejected | reprocessed after mapping or link fixed | Tracking.Core.Events.CreateEditDelete | Received | AUD-TRK-001 |
| SM-TRK-01 | TrackingEvent | Applied | active period passes (BR-TRK-013) | — | Archived | moved to archive store |
| SM-TRK-01 | TrackingEvent | Archived | archive period passes | — | Deleted | run logged |
| SM-TRK-02 | ScanAlert | (none) | expected event not received within limit | — | Open | operations queue |
| SM-TRK-02 | ScanAlert | Open | expected event arrives, or staff resolve with note | — | Resolved | staff resolution audited (AUD-TRK-008) |
| SM-TRK-02 | ScanAlert | Open | long-stuck limit passes | — | Escalated | LOG-013 incident (delayed) |
| SM-TRK-02 | ScanAlert | Escalated | LOG-013 incident resolved | — | Resolved | — |
| SM-TRK-03 | NotificationMessage | (none) | engine processes a send | — | Pending | log row |
| SM-TRK-03 | NotificationMessage | Pending | preference, limit or bounce check fails | not mandatory | Suppressed | reason logged |
| SM-TRK-03 | NotificationMessage | Pending | inside quiet hours | not urgent | Held | — |
| SM-TRK-03 | NotificationMessage | Held | quiet period ends | preferences re-checked | Pending | — |
| SM-TRK-03 | NotificationMessage | Pending | provider accepts (email: QueuedEmail.SentOnUtc set) | — | Sent | provider message id stored |
| SM-TRK-03 | NotificationMessage | Pending / Sent | provider error, no address, failure receipt or native email retry limit | — | Failed | fallback channel message created if defined |
| SM-TRK-03 | NotificationMessage | Sent | delivery receipt | — | Delivered | — |
| SM-TRK-03 | NotificationMessage | Pending / Sent | channel adapter or provider refuses (for example template not approved, recipient not opted in at the provider) | — | Refused | reason logged; fallback channel message created if defined |
| SM-TRK-04 | OutreachNotice | (none) | created | — | Draft | — |
| SM-TRK-04 | OutreachNotice | Draft | send now or schedule | Tracking.Core.Outreach.Send | Scheduled | AUD-TRK-006 |
| SM-TRK-04 | OutreachNotice | Scheduled | send time reached | — | Sending | messages through the engine |
| SM-TRK-04 | OutreachNotice | Sending | all recipients processed | — | Completed | counts stored |
| SM-TRK-04 | OutreachNotice | Draft / Scheduled | cancelled | — | Cancelled | — |
| SM-TRK-05 | ServiceBanner | (none) | created with period, or source stall detected | Tracking.Core.Outreach.Send for manual banners | Scheduled | — |
| SM-TRK-05 | ServiceBanner | Scheduled | start time reached, or stall detected | — | Active | banner shown |
| SM-TRK-05 | ServiceBanner | Active | end time reached, cancelled, or events resume (automatic banner) | — | Ended | banner removed |
| SM-TRK-06 | ShareLink | (none) | owner creates link | owner of the shipment | Active | AUD-TRK-007 |
| SM-TRK-06 | ShareLink | Active | owner revokes | — | Revoked | AUD-TRK-007 |
| SM-TRK-06 | ShareLink | Active | expiry reached | — | Expired | — |
| SM-TRK-07 | EmailBounceFlag | Valid | hard bounce reported | — | Bounced | email channel skipped; AUD-TRK-009 |
| SM-TRK-07 | EmailBounceFlag | Bounced | email changed or revalidated | — | Valid | AUD-TRK-009 |
| SM-TRK-08 | InAppNotification | (none) | engine delivers in-app message | — | Unread | unread count +1 |
| SM-TRK-08 | InAppNotification | Unread | opened | — | Read | unread count −1 |
| SM-TRK-08 | InAppNotification | Unread / Read | cleared by customer | — | Cleared | not listed |
| SM-TRK-09 | ContactOptOut | (none) | opt-out keyword from a number with no account, or staff record a request (IC-TRK-06 UpdatePreference) | number in international format | OptedOut | non-mandatory messages on that channel not sent; AUD-TRK-005 |
| SM-TRK-09 | ContactOptOut | OptedOut | opt-in keyword, or the customer with that number turns the channel on in My account (IC-TRK-06 UpdatePreference) | — | OptedIn | AUD-TRK-005 |
| SM-TRK-09 | ContactOptOut | OptedIn | opt-out keyword again (IC-TRK-06 UpdatePreference) | — | OptedOut | AUD-TRK-005 |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| EventCode / SourceCodeMapping (new) | EventCode: Code, ShippedFlag, DisplayName (localized), IsCustomerVisible; Mapping: SourceId, SourceCode, EventCode | TRK-002 | — |
| TrackingSource (new) | Id, Type (scanner app, carrier, postal interface, PostGlobal, manual), CredentialsRef (encrypted), StallLimit, LastEventOnUtc | TRK-002, TRK-009 | — |
| TrackingEvent / TrackingEventArchive (new) | Id, ShipmentId, SourceId, SourceEventId, SourceCode, EventCode, EventTimeUtc, ReceivedOnUtc, Location, Latitude, Longitude, StaffId, DeviceId, ReasonCode, AttachmentDownloadIds, Status (SM-TRK-01), RejectReason | TRK-002, TRK-003 | Linked to native Shipment; unique index on (SourceId, SourceEventId) |
| ScanExpectationRule / ScanAlert (new) | Rule: AfterCode, ExpectedCode, RouteOrServiceLevel, Limit, LongStuckLimit; Alert: ShipmentId, RuleId, Status (SM-TRK-02), Note | TRK-002 | — |
| Device (new) | DeviceId, StaffCustomerId, TokenHash, Status, RegisteredBy | TRK-003 | — |
| ShareLink (new) | Id, ShipmentId, TokenHash, ExpiresOnUtc, Status (SM-TRK-06), CreatedByCustomerId | TRK-001 | — |
| NotificationDefinition / ChannelContent (new) | Definition: Key (native template name or product event code), Category, Mandatory, Urgent, Channels in order, Fallback; Content: DefinitionId, Channel, Text (localized), Version | TRK-005, TRK-012 | Email content stays in native MessageTemplate |
| NotificationPreference / QuietHours / OrderSubscription (new) | Preference: CustomerId, Category, Channel, Allowed; QuietHours: CustomerId, Channel, From, To; OrderSubscription: OrderId, CustomerId or contact, Subscribed | TRK-006 | Native NewsLetterSubscription unchanged (marketing) |
| ContactOptOut (new) | PhoneNumber (international format, BR-IAM-010), Channel, Status (SM-TRK-09), Source, ChangedOnUtc; unique on (PhoneNumber, Channel) | TRK-006 | Phone numbers without an account (decision MSG-ROUTE); CHN keeps no opt-out record (BR-CHN-020) |
| NotificationMessage (new) | Id, DefinitionId, ContentVersion, Channel, Recipient, CustomerId, OrderId, ShipmentId, OccurrenceKey, Status (SM-TRK-03), ProviderMessageId, QueuedEmailId, FallbackOfId, Reason, timestamps | TRK-007 | Links to native QueuedEmail for email |
| Email bounce flag (native GenericAttribute) | Customer generic attribute EmailBouncedOnUtc (Proposed name) and bounce type | TRK-004 | Native GenericAttribute; no new table |
| InAppNotification (new) | Id, CustomerId, Text, Link, Status (SM-TRK-08), CreatedOnUtc | TRK-008 | — |
| OutreachNotice / ServiceBanner (new) | Notice: Criteria, DefinitionId or text, Status (SM-TRK-04), Counts; Banner: Text (localized), Stores, FromUtc, ToUtc, SourceId (automatic), Status (SM-TRK-05) | TRK-009 | Native Campaign not used |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Message templates (email) | MessageTemplate entities with tokens; per language via LocalizedProperty; per store by separate template rows with StoreMapping | global → vertical → client → store | TRK-004 | Core |
| Multi-channel notification templates and routing | Notification engine templates per event/channel (new) | global → vertical → client | TRK-005 | Core |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Email templates (per event, language, store) | MessageTemplate (native) with LocalizedProperty and StoreMapping | global → vertical → client → store | Not stated | Configurable content per event (FR-212, FR-310) |
| Show tracking events on native shipment pages | ShippingSettings.DisplayShipmentEventsToCustomers, DisplayShipmentEventsToStoreOwner (native) | client → store | Not stated (Proposed: on) | On (FR-208, FR-218) |
| Notification definitions, channels per event, fallback order | NotificationDefinition (new) | global → vertical → client | Not stated | SMS, email, in-app where enabled (FR-214) |
| Enabled channels and providers | Channel adapter settings (CHN-005, CHN-006, CHN-013) (new) | country → client | Not stated (WhatsApp KG-24) | SMS, email, in-app (FR-214) |
| Preference categories, mandatory and urgent categories, default opt-ins | TRK settings (new) | vertical → client | Not stated | Opt-in/out per channel and type (FR-009) |
| Categories for messages outside the engine (Conversation replies, Security codes) and whether each is mandatory | TRK settings (new) | client | Not stated | Not stated (MSG-ROUTE; BR-TRK-026) |
| Default quiet hours and message limits | TRK settings (new) | client | Not stated | Configurable (FR-219, FR-310); values not stated |
| Event dictionary display names and source mappings | EventCode, SourceCodeMapping (new) | global → client | Carrier codes per adapter | IPS, PostGlobal mappings (FR-221) |
| Expected-scan rules, limits, long-stuck limits | ScanExpectationRule (new) | client | Not stated | Required (FR-209); values not stated |
| Tracking-event and notification-log retention | PLT-020 retention policy | country → client | Not stated (KG-18) | Required (FR-225); values not stated (MG-13) |
| Public tracking: refresh interval, share-link expiry, lookup limit before CAPTCHA | TRK settings (new); captchasettings.* (native, SEC-013) | client | Not stated | Not stated |
| Source stall limits for automatic outage banner | TrackingSource.StallLimit (new) | client | — | Not stated |
| Pickup reminder lead times; identification text | TRK settings (new) | client | — | Required (FR-206, FR-216); values not stated |
| Bounce feed provider | IC-TRK-03 settings (new) | client | Not stated | Not stated |
| Upload context "tracking scan media" (allowed types, size, scan) | ADM-008 UploadPolicySettings per context (owner ADM-008, decision SINGLE-FILTER) | global → client | Not stated | Not stated |
| Action per order kind for OrderCompleted.CustomerNotification (send, suppress, substitute) and the substitute definitions | TRK settings (new) | vertical (e-Government, Services packs) → client | Not stated | Not stated (EGV, SVC) |
| SMS variants of native email-only templates | NotificationDefinition / ChannelContent (new) | global → client | Not stated | Accounts without email (FR-001) |
| Source and provider credentials | Encrypted settings (new), flagged secret in the TRK key catalogue (BR-TRK-040) | client instance only | Entered at deployment | Entered at deployment |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Public tracking page (by tracking number), share-link view, refresh; outage banner | TRK-001, TRK-009 | New |
| Storefront | Guest order-status lookup | TRK-011 | Licensed plugin or new |
| Storefront — My account | Orders with latest tracking status; shipment timeline; notification preferences; per-order subscribe / unsubscribe; bell and notification list | TRK-001, TRK-006, TRK-008 | Native pages extended (widget zones) + new tabs |
| Seller (admin area) | Shipment list and shipment details with hub timeline | TRK-010 | Native |
| Admin | Track-and-trace search; rejected events; scan alerts; manual event entry | TRK-002 | New |
| Admin | Event dictionary, source mappings, sources, expected-scan rules; devices | TRK-002, TRK-003 | New |
| Admin | Message templates (native) and notification definitions with channel content; channel settings; preference defaults | TRK-004, TRK-005, TRK-006 | Native list extended + new pages |
| Admin — order edit | Notifications panel (widget zone admin_order_details_block) | TRK-007 | Native page, widget |
| Admin | Notification log and delivery reports | TRK-007 | New |
| Admin | Proactive notices and service banners | TRK-009 | New |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Trk.TrackNotFound | We could not find a parcel with this number. Please check it and try again. | AC-TRK-001-01-02 |
| Trk.NoEventsYet | There are no tracking updates for this parcel yet. | AC-TRK-001-01-05 |
| Trk.ShareLinkExpired | This tracking link has expired or was withdrawn. | AC-TRK-001-02-02 |
| Trk.LastUpdated | Last updated: {0} | AC-TRK-001-03-01 |
| Trk.Refresh | Refresh | AC-TRK-001-03-02 |
| Trk.EmailBounced | Emails to this address are bouncing. | AC-TRK-004-02-01 |
| Trk.Unsubscribed | You will no longer receive updates for this order. | AC-TRK-006-03-01 |
| Trk.Subscribed | You will receive updates for this order. | AC-TRK-006-03-02 |
| Trk.UpdatesDelayed | Tracking updates are delayed at the moment. Your parcel is still on its way. | AC-TRK-009-02-02 |
| Trk.GuestLookupFailed | We could not find an order with these details. | AC-TRK-011-01-02 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. New message templates (ShipmentOutForDelivery, ShipmentDeliveryAttemptFailed, ShipmentPickupReminder, ShipmentUncollected) are installed by the TRK plugin with Proposed English content.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Tracking ingestion (TRK-002, TRK-003) | SubmitEvents, RegisterDevice, GetWorkList (IC-TRK-01) | Scanning app (external), LOG carrier adapters, LOG-016 postal interfaces, INT-007 PostGlobal, manual entry | See §12.2 |
| Notification channels (TRK-005) | Send, DeliveryReceipt (IC-TRK-02) | CHN-005 SMS, CHN-006 WhatsApp, CHN-013 push, CHN-004 IVR, native email | Providers owned by CHN |
| Email bounce feed (TRK-004) | ReceiveBounce (IC-TRK-03) | Email service or mailbox (not stated) | — |
| Engine API (TRK-005) | SendEvent (IC-TRK-04) | Product modules (LOG, PAY, ORD, others) | Internal |
| Preference and opt-out service (TRK-006) | UpdatePreference, CheckAllowed (IC-TRK-06) | CHN-012, CHN-006, CHN-013, CHN-004; CHN reply adapters and CHN-005 command replies (CRM, AI-003); CRM ticket e-mail replies; IAM-002 one-time codes | Internal (decision MSG-ROUTE) |
| Guest lookup plugin (TRK-011) | Order lookup | FoxNetSoft plugin (V-01) or custom | — |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-TRK-01 | SubmitEvents | Source id and credentials (system key or registered device token); batch of events: source event id, reference (tracking number, S10, waybill, bill of lading), source code, event time with offset, location text and coordinates, staff id, device id, reason code, attachment references | Per event: Received with id, or rejected with reason | Authentication failed (batch rejected, AUD-TRK-003), payload invalid | Plugin API controller deriving from Microsoft.AspNetCore.Mvc.Controller on its own route (IRouteProvider), no customer-session filters; events stored, then processed by a queue worker or IScheduleTask under 'shipment-{ShipmentId}' |
| IC-TRK-01 | RegisterDevice / RevokeDevice | Device id, staff id | Device token | Unknown staff | Admin page (Tracking.Core.Devices.CreateEditDelete) |
| IC-TRK-01 | RegisterExternalReference | Owning module, entity type (for example ReturnShipment), entity id, reference value | Registered | Reference already registered for another entity | Service called by RET-003 for every return tracking reference it assigns (carrier reference returned by LOG IC-LOG-01 BookReturn, or RET-generated); registering the same reference again for the same entity returns Registered; TRK-002 matches incoming events against shipments and registered references |
| IC-TRK-01 | GetWorkList | Device token | Route list (LOG-024) or pickup list (LOG-011) of the staff member | Not authorised | Same API controller |
| IC-TRK-02 | Send | Channel content, recipient address, language, idempotency key (message id) | Accepted with provider message id, or error | Provider unavailable, invalid recipient | Implemented by channel adapters, which only deliver and report Sent / Delivered / Failed / Refused (BR-CHN-010): email = native QueuedEmail; SMS = CHN-005 (IC-CHN-01); WhatsApp and Telegram = CHN-006 and the CHN messaging adapters (IC-CHN-04); push = CHN-013 (IC-CHN-05); voice = CHN-004 (IC-CHN-03); in-app = TRK-008 |
| IC-TRK-02 | DeliveryReceipt | Provider message id, status, time | Log row updated | Unknown id (kept for retry matching) | Adapter callback route; authenticated per provider |
| IC-TRK-03 | ReceiveBounce | Address, bounce type (hard / soft), time | Bounce flag updated | Unknown address (logged) | Webhook route or mailbox polling task, per provider (not stated) |
| IC-TRK-04 | SendEvent | Product event code, entity references (order, shipment, customer, or a recipient list), sender reference, extra tokens | Message ids per channel and recipient | Unknown (unregistered) event code | Engine service used by LOG, PAY, ORD and other modules for events without a native template |
| IC-TRK-04 | RegisterEventCode | Event code, owning module, category, default channels, default content per channel (localised), mandatory and urgent flags | Registered | Duplicate code | Called by each product plugin at installation; codes listed in BR-TRK-023 |
| IC-TRK-05 | Order-kind provider | Order (id, lines) | Order kind code or none | — | Implemented by EGV (order kind e-Government) and SVC (order kind Service); called by the engine for OrderCompleted.CustomerNotification (BR-TRK-024); a provider never sends messages itself |
| IC-TRK-06 | UpdatePreference | Subject (customer id, or phone number in international format for a number without an account), channel, category or all non-mandatory categories, allowed or opted out, source (My account, keyword, channel opt-in, staff), time | Updated; for a phone number the ContactOptOut status | Invalid number, unknown customer, unknown channel | TRK-006 service (DI) called by CHN-012 (SMS keywords), CHN-006, CHN-013, CHN-004 (channel opt-in) and the TRK My account pages; audited (AUD-TRK-005); BR-TRK-031, BR-TRK-033 (decision MSG-ROUTE) |
| IC-TRK-06 | CheckAllowed | Recipient (customer id, or phone number or channel address), channel, category, sender module | Allowed, or Blocked with reason (opted out, not opted in, category off) | Unknown channel (Blocked) | TRK-006 service (DI) called synchronously by senders outside the engine before each send (BR-TRK-026): CHN IC-CHN-04 SendReply (CRM agents, AI-003), CHN-005 SMS command replies, CRM ticket e-mail replies, IAM-002 before IC-IAM-01 one-time codes; the engine applies the same rules internally |

Every channel adapter declares capability flags (delivery receipts, read receipts, maximum length) and timeouts (settings, defaults not stated). C# signatures are produced at build start and approved by the tech lead. Ingestion sources are configured per client; credentials are encrypted, flagged secret in the key catalogue and never in configuration packs (CFG-01, BR-TRK-040). Under OVR-REG TRK-005 owns IWorkflowMessageService; other modules plug in through IC-TRK-04 and IC-TRK-05 and do not override it. Under MSG-ROUTE TRK-006 provides IC-TRK-06 as the single preference and opt-out service; no other module keeps opt-out records.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Shipment.Dispatched | ShipmentSentEvent (from ShipAsync, called by LOG or by TRK-002) | Native ShipmentSent template through the engine (TRK-012) |
| Shipment.ReadyForPickup | ShipmentReadyForPickupEvent | Native template through the engine with outlet tokens (TRK-012); LOG-017 |
| Shipment.Delivered | ShipmentDeliveredEvent | Native template through the engine (TRK-012); PAY-007; LOG-018 |
| Shipment.Created / TrackingNumberSet | ShipmentCreatedEvent, ShipmentTrackingNumberSetEvent | TRK-002 records CREATED and links the reference (consumer enqueues only) |
| Tracking.EventApplied | None (TRK event; carries ShipmentId or the registered return reference and ReturnShipment id) | TRK-012 for OUT_FOR_DELIVERY and ATTEMPT_FAILED; scan-alert resolution; LOG-011 task completion; RET-003 return status (consumer enqueues only) |
| Tracking.ScanOverdue / Escalated | None (TRK events) | Operations queue; LOG-013 incident |
| Tracking.SourceStalled / Resumed | None (TRK events) | TRK-009 automatic banner |
| Notification.Failed | None (TRK event) | Fallback channel; TRK-007 |
| Order.Placed / status messages | OrderPlacedEvent and native order templates (sent by OrderProcessingService through IWorkflowMessageService) | Engine applies definitions (TRK-005); ORD-002 statuses through IC-TRK-04; OrderCompleted on e-Government and service orders per BR-TRK-024 |
| Product events of other modules | Module events of the owners listed in BR-TRK-023 | Owning module calls IC-TRK-04 SendEvent (its consumers only enqueue the call) |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Push and poll deliver the same carrier event at once | TRK-002 | Unique index on (SourceId, SourceEventId) and the duplicate rule (BR-TRK-011); processing per shipment under ILocker key 'shipment-{ShipmentId}' (shared with LOG) |
| DELIVERED event and admin Set as delivered at the same time | TRK-002, LOG-010 | Same lock; the second re-reads DeliveryDateUtc and does not call DeliverAsync again |
| Events arrive out of order | TRK-002 | Timeline ordered by event time; native state only forwards (BR-TRK-012) |
| Event replay triggers the same notification twice | TRK-012 | Occurrence key unique per channel and recipient (BR-TRK-022) |
| Delivery receipt arrives before the send result is stored | TRK-007 | Receipt kept by provider message id and matched when the row is written (retry) |
| Held message released after the customer changed preferences | TRK-006 | Preferences re-checked at release (BR-TRK-032) |
| Opt-out keyword arrives while a reply or one-time code to that number is being sent | TRK-006 | CheckAllowed reads the committed record at the time of the call; a send already accepted by CHN is not recalled; the next call sees OptedOut. Updates of one number run under ILocker key 'trk-optout-{PhoneNumber}' (Proposed) |
| Scan alert task and late expected event at the same time | TRK-002 | Both under the shipment lock; the task re-reads and does not open or escalate a resolved alert |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Shipped, out for delivery, ready for pickup, delivered | Buyer | Channels of the definition (email, SMS, in-app, WhatsApp where enabled) | TRK-012 |
| Delivery attempt failed (reason, rescheduling link) | Buyer | Channels of the definition | TRK-012 |
| Pickup reminder; uncollected notice | Buyer; outlet and operations contacts | Channels of the definition; email to staff | TRK-012 |
| Order confirmation and status changes | Buyer | Channels of the definition | TRK-005 |
| Proactive notice | Selected buyers | Channels of the definition (category Service notices) | TRK-009 |
| Scan overdue / escalated; rejected events | Logistics operations staff | Admin notification | TRK-002 |
| Source stalled | Logistics operations staff; support | Admin notification + automatic banner | TRK-009 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Notification delivery report by channel and event type | TRK-007 | REQ-MPC-FR-213 |
| Scan alerts and rejected events by source and age | TRK-002 | REQ-MPC-FR-209 |
| Track-and-trace search results | TRK-002 | REQ-MPC-ORD-001 |
| Outreach results (recipients, sent, failed) | TRK-009 | REQ-MPC-FR-267 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-TRK-001 | Manual event entered, corrected or reprocessed | Staff | TrackingEvent | event, old and new code, reason |
| AUD-TRK-002 | Configuration change (mapping, scan rule, notification definition, channel content, template, preference defaults) | Administrator | Rule entity | old values, new values |
| AUD-TRK-003 | Ingestion authentication rejected | System | TrackingSource / Device | source, device, reason |
| AUD-TRK-004 | Device registered or revoked | Staff | Device | device id, staff id |
| AUD-TRK-005 | Customer preference, per-order subscription or phone-number opt-out changed | Customer / staff / system (keyword) | NotificationPreference, OrderSubscription, ContactOptOut | old, new, source |
| AUD-TRK-006 | Proactive notice sent or scheduled; banner activated | Staff | OutreachNotice, ServiceBanner | criteria, count, text |
| AUD-TRK-007 | Share link created or revoked | Customer | ShareLink | shipment, expiry |
| AUD-TRK-008 | Scan alert resolved by staff | Staff | ScanAlert | note |
| AUD-TRK-009 | Email bounce flag set or cleared | System / customer | Customer | address, type |

All audit events AUD-TRK-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new entity values are captured by the SEC IRepository<> decorator, so every TRK write goes through IRepository<> (no direct INopDataProvider writes); the native activity log is not used as audit. Names and fields are Proposed. The notification log (TRK-007) is the business record of messages; the audit trail records changes to it and to configuration.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-TRK-001 | Pages without sign-in reveal no customer personal data (BR-TRK-030). | REQ-MPC-FR-220; NFR-X-002 | AC-TRK-001-01-03; AC-TRK-011-01-01 |
| NFR-TRK-002 | Every ingestion source and device is authenticated before an event is stored; failures are audited. | REQ-MPC-FR-224; NFR-X-001 | AC-TRK-003-02-01; AUD-TRK-003 |
| NFR-TRK-003 | Public lookup pages are protected against enumeration by rate limits and CAPTCHA (SEC-013). | Proposed; SEC-013 | AC-TRK-001-01-04; AC-TRK-011-01-03 |
| NFR-TRK-004 | Tracking events and the notification log follow the retention rules (PLT-020). | REQ-MPC-FR-225; FC-M17-014 | AC-TRK-002-04-01; AC-TRK-007-01-06 |
| NFR-TRK-005 | Event ingestion volume, end-to-end tracking latency and notification latency targets: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |
| NFR-TRK-006 | All customer-facing message content is localised (NFR-X-004). | NFR-X-004; FC-M17-008 | AC-TRK-005-02-01 |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-TRK-001 | P1 | PRD-TRK-002 | |
| PRD-TRK-002 | P1 | — | PRD-TRK-001, PRD-TRK-011 |
| PRD-TRK-003 | P1 | — | PRD-LOG-022, PRD-LOG-023, PRD-LOG-024, PRD-LOG-032, PRD-CHN-010 |
| PRD-TRK-004 | P1 | PRD-PLT-008 | |
| PRD-TRK-005 | P1 | — | PRD-TRK-012, PRD-MKT-012, PRD-CHN-004, PRD-CHN-005, PRD-CHN-006, PRD-CHN-013, PRD-SVC-010 |
| PRD-TRK-006 | P1 | — | |
| PRD-TRK-007 | P1 | PRD-SEC-004 | |
| PRD-TRK-008 | P2 | — | |
| PRD-TRK-009 | P1 | — | |
| PRD-TRK-010 | P1 | — | |
| PRD-TRK-011 | P1 | PRD-TRK-002 | |
| PRD-TRK-012 | P1 | PRD-CHN-005, PRD-TRK-005 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-TRK-01 | Ingestion: replay a recorded batch from each source type (scanner app, each carrier adapter, IPS, manual) including duplicates, out-of-order events, unmapped codes and unknown references. |
| T-TRK-02 | Native state: assert ShipAsync, ReadyForPickupAsync and DeliverAsync are each called once per shipment for any event sequence (BR-TRK-012). |
| T-TRK-03 | Engine: for each native template and product event, assert one message per enabled channel, correct language, fallback on failure, and no duplicate on replay (BR-TRK-020, BR-TRK-022). |
| T-TRK-04 | Preferences: matrix test of mandatory, urgent, quiet hours, limits and per-order unsubscribe (BR-TRK-031, BR-TRK-032). |
| T-TRK-05 | Public pages: no personal data in responses; CAPTCHA after the configured lookups (BR-TRK-030). |
| T-TRK-06 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-TRK-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1); Misc.Brevo and TRK cannot be installed together (BR-TRK-021). |
| T-TRK-08 | Engine edge cases: account without email (BR-TRK-025); OrderCompleted on e-Government and service-only orders for each action (BR-TRK-024); unregistered event code refused; Refused status and fallback for each CHN adapter; return-reference events change no native state (SM-TRK-01). |
| T-TRK-09 | Configuration: every TRK key is in the key catalogue and credentials are refused by pack import and omitted from export (BR-TRK-040). |
| T-TRK-10 | Opt-outs (MSG-ROUTE): keyword opt-out and opt-in for a customer number and for a number without an account; engine SMS to an opted-out number is Suppressed; CheckAllowed answers for each category and channel, including a mandatory and a non-mandatory Security codes category (BR-TRK-026, BR-TRK-033). |
