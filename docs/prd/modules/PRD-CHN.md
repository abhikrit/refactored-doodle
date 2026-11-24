# L2 Module PRD — CHN: Channels: mobile app, PWA, USSD, SMS, WhatsApp, assisted/agent

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | CHN — Channels: mobile app, PWA, USSD, SMS, WhatsApp, assisted/agent |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets customers reach the shop on every channel the clients name or the product needs: native apps, an installable light website, USSD and voice menus for basic phones, SMS with simple commands, WhatsApp, WeChat and Telegram, push notifications, social media, and people who serve customers in person (agents, field staff). Each channel is a delivery adapter: what is sent and when is decided by the notification engine (TRK-005), conversations are handled in the live chat and help desk (CRM), and orders and payments use the same native services as the website.

**In scope**

- Licensed nopCommerce mobile app for Android and iOS (CHN-001; held by M-19, PAID-STUB)
- Installable website (PWA) and light pages for weak connections (CHN-002)
- USSD menus through a gateway (CHN-003) and IVR / voice calls (CHN-004, P2)
- SMS provider adapters, delivery receipts and inbound SMS commands (CHN-005); sender ID and STOP opt-out keyword handling (CHN-012, P2); opt-out records and quiet hours are TRK-006
- WhatsApp Business (CHN-006), WeChat (CHN-007) and Telegram (CHN-008, P3) channel adapters
- Agent and correspondent networks and agent commission (CHN-009, P2; agent accounts and outlets are IAM-026, the agent-order record is CHK-013 AssistedOrder) and the agent functions of the one field app (CHN-010, P2; scanning is TRK-003, decision FIELD-APP)
- Social sign-in (CHN-011, native); share buttons and social links are MKT-010
- Push notifications to apps and installed websites (CHN-013, P2)

**Not in this module**

| Item | Where it is |
|---|---|
| Which notification goes to whom, on which channel, with fallback | TRK module (PRD-TRK-005 engine, TRK-006 preferences, TRK-007 delivery audit); CHN adapters implement IC-TRK-02 |
| Quiet hours, SMS opt-out preferences and opt-out records for phone numbers without an account | TRK module (PRD-TRK-006, decision MSG-ROUTE); CHN-012 passes STOP and START replies to it |
| Live chat console and agents' conversations | CRM module (PRD-CRM-008 live web chat); CHN-006 / CHN-007 deliver the WhatsApp and WeChat legs |
| Chatbot answers | AI module (PRD-AI-003) |
| Mobile-number identity and OTP | IAM module (PRD-IAM-002), sending through CHN-005 |
| Agent accounts, outlet assignment, acting sessions and the single impersonation filter; assisted checkout and the order-to-agent record (AssistedOrder); outlet receipts | IAM-026 (BR-IAM-130, decision SINGLE-FILTER); CHK-013; PAY-034 |
| Public API used by apps, USSD, IVR and the field app | INT module (PRD-INT-001) |
| Mobile-money payment requests | PAY module (PRD-PAY-004) |
| Scanning functions of the field app | TRK module (PRD-TRK-003, held by FG-06); one field app with CHN-010 (decision FIELD-APP) |
| Marketing tags and pixels; share buttons and social links | MKT module (PRD-MKT-010) |
| USSD gateway, IVR platform, SMS aggregators, Meta / WeChat / Telegram platforms, app stores | External systems (not named in any source) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-CHN-001 | Native mobile apps | B2B + B2C | P1 | Licensed plugin | None | Channels pack | | M-19, PAID-STUB |
| PRD-CHN-002 | PWA and low-bandwidth mode | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-CHN-003 | USSD channel | B2B + B2C | P1 | External system | External system + integration plugin | Channels pack | | |
| PRD-CHN-004 | IVR channel | B2B + B2C | P2 | External system | External system + integration plugin | Channels pack | PRD-TRK-005 | |
| PRD-CHN-005 | SMS gateway and SMS commands | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-TRK-005 | |
| PRD-CHN-006 | WhatsApp Business | B2B + B2C | P1 | Code-level | External system + integration plugin | Channels pack | PRD-TRK-005 | |
| PRD-CHN-007 | WeChat | B2B + B2C | P1 | Code-level | External system + integration plugin | Channels pack | | |
| PRD-CHN-008 | Telegram bot | B2B + B2C | P3 | Code-level | External system + integration plugin | Channels pack | | |
| PRD-CHN-009 | Agent and correspondent networks | B2B + B2C | P2 | Code-level | Custom plugin | Assisted service pack | | |
| PRD-CHN-010 | Field agent app | Platform / back-office | P2 | External system | External system + integration plugin | Assisted service pack | PRD-TRK-003 | FG-06 |
| PRD-CHN-011 | Social media integration | B2B + B2C | P1 | Configuration | None | Channels pack | | |
| PRD-CHN-012 | SMS sender ID and opt-out | B2B + B2C | P2 | Code-level | Custom plugin | Core (always on) | PRD-CHN-005 | |
| PRD-CHN-013 | Push notifications | B2B + B2C | P2 | Code-level | External system + integration plugin | Channels pack | PRD-TRK-005 | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper | Uses the app, the installed website, USSD, IVR, SMS, WhatsApp, WeChat, Telegram; opts in or out | Guests / Registered (native) |
| International buyer | Chats on WeChat or WhatsApp | Registered (native) |
| Client administrator | Connects channel accounts and providers, sets sender ID, keywords, menus, manifest and social settings | Administrators (native) |
| Marketing staff | Manages app home content and social links | Role not stated (KG-16, MG-08) |
| Support agent | Answers WhatsApp and WeChat conversations in the live chat console | CRM-008 role (licensed plugin) |
| Agent (outlet or correspondent) | Serves walk-in customers and places orders for them; belongs to an agent network | Role system name "Agent" (product role catalogue BR-IAM-050); account and outlets in IAM-026 |
| Field agent | Captures data offline in the field app | External app user authenticated through INT-001 |
| Channel providers (system) | USSD gateway, IVR platform, SMS aggregator, WhatsApp Business Platform, WeChat, Telegram, push services | External systems via adapters |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Configuration.ManageSettings (native) | Configuration | Edit share button, page share code, social links, favicon and app icons (manifest link) and PWA settings | Administrators |
| Configuration.ManageExternalAuthenticationMethods (native) | Configuration | Activate and configure social sign-in (Facebook) | Administrators |
| Channels.Core.Sms.View | System | View the SMS log, delivery receipts, inbound commands and opt-outs | Administrators |
| Channels.Core.Sms.CreateEditDelete | Configuration | Configure SMS providers, sender IDs, command and opt-out keywords | Administrators |
| Channels.Core.Messaging.CreateEditDelete | Configuration | Connect WhatsApp, WeChat and Telegram accounts; manage provider templates and routing | Administrators |
| Channels.Core.Voice.CreateEditDelete | Configuration | Configure USSD and IVR menus and gateway connections | Administrators |
| Channels.Core.Push.CreateEditDelete | Configuration | Configure push providers and keys | Administrators |
| Channels.Core.Agents.View | Customers | View agent networks, network members and commissions | Administrators, Finance |
| Channels.Core.Agents.CreateEditDelete | Customers | Create agent networks; add IAM-026 agents to a network, suspend or deactivate their membership; set commission rules | Administrators |

Permissions are declared in a CHN plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager), with the plugin prefix, the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs) and a native Category. Native Configuration.ManageSettings and Configuration.ManageExternalAuthenticationMethods are reused. Agent accounts, outlet assignment and acting for a customer are IAM-026 (Identity.Core.Agents.CreateEditDelete, Identity.Core.AssistedService.Access); the one filter on Admin CustomerController.Impersonate is IAM-026 (BR-IAM-130, decision SINGLE-FILTER); CHN grants no impersonation permission and adds no filter. Roles Agent and Finance are spelled exactly as in the product role catalogue (BR-IAM-050), and IAM creates catalogue roles that are missing; CHN relies on no native start-up role creation and proposes no new role. Permissions of the licensed mobile app cannot be verified in source (stub, V-01). All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-CHN-PERM-01 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHN-PERM-02 | **Given** a user without Configuration.ManageExternalAuthenticationMethods (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHN-PERM-03 | **Given** a user without Channels.Core.Sms.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHN-PERM-04 | **Given** a user without Channels.Core.Sms.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHN-PERM-05 | **Given** a user without Channels.Core.Messaging.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHN-PERM-06 | **Given** a user without Channels.Core.Voice.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHN-PERM-07 | **Given** a user without Channels.Core.Push.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHN-PERM-08 | **Given** a user without Channels.Core.Agents.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-CHN-PERM-09 | **Given** a user without Channels.Core.Agents.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-CHN-001 | Bundled Misc.NopMobileApp is a stub in 5.00.1 (only plugin class, controller, event consumer and Views/Configure.cshtml linking to nopcommerce.com; plugin.json SupportedVersions 5.00); no app code in source (Plugins/Nop.Plugin.Misc.NopMobileApp). | Licensed official nopCommerce mobile app (or NS app per PG INT-02). The 5.00 stub confirms only that nopCommerce markets the paid app for 5.00; build, licence and scope are V-01 items; app-store publishing outside nopCommerce. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHN-002 | Responsive theme, bundling/minification (WebOptimizer), lazy loading in Swiper; a minimal web app manifest is shipped (icons and colours only, empty name, no start URL) and the .webmanifest file type is mapped; no service worker. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web (no manifest/service worker found); src/Plugins/Nop.Plugin.Widgets.Swiper/SwiperSettings.LazyLoading] | Complete the PWA manifest (name, start URL, display), service worker/offline, light-page mode. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHN-003 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No USSD component in src] | USSD gateway (mobile network operator/aggregator) running the menus; nopCommerce needs an API plugin for order lookup, simple order and payment. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: USSD is a telecom gateway |
| PRD-CHN-004 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No IVR component in src] | IVR / voice platform; nopCommerce needs an API/notification plugin. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: IVR is a telecom platform |
| PRD-CHN-005 | 5.00 adds a core SMS provider abstraction: ISmsProvider (Libraries/Nop.Services/Messages/ISmsProvider.cs, SendSmsAsync(phone,text) returns bool), ISmsService/SmsService (Libraries/Nop.Services/Messages/SmsService.cs:39) loading one primary provider from MessagesSettings.ActiveSmsProviderSystemName (Libraries/Nop.Core/Domain/Messages/MessagesSettings.cs:25), admin provider list (Presentation/Nop.Web/Areas/Admin/Controllers/SmsController.cs), bundled Sms.Twilio provider (Plugins/Nop.Plugin.Sms.Twilio/TwilioProvider.cs:13,56; TwilioSettings AccountSID/AuthToken/PhoneNumber). The only caller of ISmsService is phone OTP verification (Presentation/Nop.Web/Controllers/CustomerController.cs:632, OtpSettings); message templates / WorkflowMessageService do not send SMS (no SMS reference in Libraries/Nop.Services/Messages/WorkflowMessageService.cs). Bundled Misc.Brevo SMS per template unchanged. No inbound SMS (not found in 5.00.1 source). | ISmsProvider plugin(s) for each client's local SMS aggregator (only Twilio bundled); wiring of message templates/notifications to ISmsService; inbound SMS commands (webhook). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHN-006 | None in source; PG CNT-05 (3P WhatsApp, strings only). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: PG CNT-05] | WhatsApp Business Platform integration (external Meta API) for notifications and chat. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in Post Gebeya (4.70.5) — confirm on 5.00.1 |
| PRD-CHN-007 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No component in src] | WeChat integration plugin (external API). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |
| PRD-CHN-008 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No component in src] | Telegram bot integration plugin (external Bot API). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: none found |
| PRD-CHN-009 | Impersonation (assisted ordering), vendors, pickup points/warehouses as outlets. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.Impersonate; src/Libraries/Nop.Core/Domain/Shipping/PickupPoint.cs] | Agent/correspondent entities, agent roles, commissions, network integrations. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHN-010 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No app in src] | Native/cross-platform offline field agent app; nopCommerce needs API endpoints (INT-001). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: a native mobile app build is outside nopCommerce |
| PRD-CHN-011 | Bundled ExternalAuth.Facebook (social login), CatalogSettings.ShowShareButton/PageShareCode, StoreInformationSettings social links (FacebookLink, InstagramLink…). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Plugins/Nop.Plugin.ExternalAuth.Facebook/FacebookAuthenticationMethod.cs; src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.ShowShareButton; src/Libraries/Nop.Core/Domain/StoreInformationSettings.cs; PG CNT-07, CUS-02] | Google sign-in needs NS Google Authentication (PG CUS-02; 5.00 support to confirm) if required. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHN-012 | Sms.Twilio sends from TwilioSettings.PhoneNumber (Plugins/Nop.Plugin.Sms.Twilio/TwilioSettings.cs); Brevo SmsSenderName (Brevo only). No STOP handling or quiet hours (not found in 5.00.1 source). | Per-client sender ID on local aggregators, STOP opt-out processing, quiet hours. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-CHN-013 | None in core. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No push component in src] | Push notification plugin (FCM/APNs, Web Push) wired to TRK-005. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: official mobile app push capability not verifiable (stub only) |


## 7. Feature specifications


### 7.1 PRD-CHN-001 Native mobile apps

| Item | Value |
|---|---|
| Description (baseline) | Shop apps for Android and iPhone. The app's home page, sliders, product carousels and menus are managed from the admin panel. |
| Why it matters | A faster, app-based shopping experience. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Licensed plugin — None |
| Depends on | — |
| Status | On hold: M-19, PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-001-01 | As a shopper, I want to shop from an Android or iPhone app with the same account, prices and orders as the website, so that I can buy the way I prefer. | D; REQ-MPC-MOB-001 | On hold: M-19, PAID-STUB |
| US-CHN-001-02 | As a member of marketing staff, I want to manage the app home page, sliders, product carousels and menus from the admin panel, so that the app shows current offers without a new release. | D | On hold: M-19, PAID-STUB |
| US-CHN-001-03 | Technical enabler. As a member of the platform team, I want the app to work only through the public API, so that other apps can be added on the same base. | REQ-MPC-MOB-002 | On hold: M-19, PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-001-01-01 | US-CHN-001-01 | **Given** the licensed nopCommerce Mobile App is configured for the client store and published in the app stores (publishing is a project service), **when** a shopper signs in, browses, adds to cart and places an order in the app, **then** the order is created in the same store through native order placement, with the same prices, discounts and tax as on the website. | D; REQ-MPC-MOB-001 |
| AC-CHN-001-01-02 | US-CHN-001-01 | **Given** a shopper placed an order in the app, **when** they sign in to the website with the same account, **then** the order appears in My account with the same status. | REQ-MPC-MOB-001 |
| AC-CHN-001-01-03 | US-CHN-001-01 | **Given** a payment method is active on the website, **when** the shopper reaches payment in the app, **then** only methods whose plugins support the app flow are offered; which PAY adapters support it is checked under V-01 and listed per client before release. | D; Proposed |
| AC-CHN-001-02-01 | US-CHN-001-02 | **Given** the app home content is managed in admin (capability stated by the vendor; verification V-01), **when** an administrator changes a slider, carousel or menu and the shopper reopens the app, **then** the change appears without a new app release. | D |
| AC-CHN-001-03-01 | US-CHN-001-03 | **Given** the app is configured, **when** it exchanges data with the shop, **then** every call goes through the official Web API plugin endpoints (stated as included in the stub text) under an INT-001 API client; the app has no direct database access. | REQ-MPC-MOB-002; FIT (Misc.NopMobileApp Configure.cshtml) |

**Business rules applied:** BR-CHN-001 (§8.1).


### 7.2 PRD-CHN-002 PWA and low-bandwidth mode

| Item | Value |
|---|---|
| Description (baseline) | The website can be installed like an app, keeps working with a weak connection and has light pages that use little data. |
| Why it matters | Works for customers with basic phones or expensive data. |
| Who benefits | Shoppers in low-connectivity areas |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-002-01 | As a shopper with a low-end phone, I want to install the website on my home screen like an app, so that I reach the shop in one tap. | D; FC-M25-003 | Ready |
| US-CHN-002-02 | As a shopper with a weak or costly connection, I want light pages that use little data, so that I can shop on a basic phone or with expensive data. | D; REQ-MPC-FR-019 | Ready |
| US-CHN-002-03 | As a shopper whose connection drops, I want to see an offline page and the pages I already viewed instead of a browser error, so that I can keep reading and know what happened. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-002-01-01 | US-CHN-002-01 | **Given** the PWA settings of the store are filled (name, short name, start address, display mode, theme colour, icons), **when** a supported mobile browser loads the store, **then** the store serves a complete web app manifest for that store and the browser offers installation; the installed app opens the start address in standalone display. | D; FIT (5.00.1 still ships Presentation/Nop.Web/wwwroot/icons/icons_0/site.webmanifest with icons and colours only — empty name, no start_url or display — linked from CommonSettings.FaviconAndAppIconsHeadCode; no service worker in the 5.00.1 source) |
| AC-CHN-002-01-02 | US-CHN-002-01 | **Given** two stores run in one installation, **when** each is loaded, **then** each serves its own manifest (name, icons, start address); the shared static file is not used. | Proposed |
| AC-CHN-002-01-03 | US-CHN-002-01 | **Given** feature PRD-CHN-002 is off for store S (productfeature.PRD-CHN-002 read through IC-PLT-02), **when** a page of store S loads, **then** no CHN manifest link and no service-worker registration are output for store S; the native head code (CommonSettings.FaviconAndAppIconsHeadCode) is unchanged (BR-CHN-003). | Proposed (IC-PLT-02) |
| AC-CHN-002-02-01 | US-CHN-002-02 | **Given** light mode is on for the store (setting), **when** a catalogue page loads, **then** pictures use the light-mode picture size (setting, default not stated) and pictures below the first screen load only when scrolled into view. | REQ-MPC-FR-019; Proposed (mechanism) |
| AC-CHN-002-02-02 | US-CHN-002-02 | **Given** the native WebOptimizer settings are at their defaults, **when** a page loads, **then** scripts and styles are served bundled (WebOptimizerConfig.EnableJavaScriptBundling and EnableCssBundling, default true). | REQ-MPC-FR-019; FIT (Nop.Web.Framework WebOptimizerConfig) |
| AC-CHN-002-02-03 | US-CHN-002-02 | **Given** a page-weight and load-time target is stated (NFR-X-006), **when** the home, category, product and checkout pages are measured on the agreed connection profile, **then** each page is within the target value of NFR-X-006 (value Not stated in source; tested once the value is set). | REQ-MPC-FR-019 |
| AC-CHN-002-03-01 | US-CHN-002-03 | **Given** the service worker is installed, **when** the connection drops and the shopper opens a page viewed before, **then** the cached copy is shown with banner Chn.OfflineBanner; a page never viewed shows the offline page Chn.OfflinePage. | D; Proposed |
| AC-CHN-002-03-02 | US-CHN-002-03 | **Given** the shopper is offline, **when** they try to add to cart, sign in or place an order, **then** the action is not sent and message Chn.OfflineActionBlocked is shown; nothing is queued for later sending (BR-CHN-002). | Proposed |
| AC-CHN-002-03-03 | US-CHN-002-03 | **Given** the service worker caches pages, **when** any page is cached, **then** only public catalogue pages, topics and static files are cached; account, cart, checkout and order pages are never cached (BR-CHN-002). | Proposed; SEC-012 |

**Business rules applied:** BR-CHN-002; BR-CHN-003 (§8.1).


### 7.3 PRD-CHN-003 USSD channel

| Item | Value |
|---|---|
| Description (baseline) | Simple menus reached by dialling a short code (for example *123#) on any mobile phone to check orders, place simple orders or pay. |
| Why it matters | Reaches customers without smartphones or internet. |
| Who benefits | Shoppers on basic phones |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-003-01 | As a shopper with a basic phone, I want to dial a short code and check my orders, so that I get updates without a smartphone or internet. | D; REQ-MPC-INT-002 | Ready; conditions: OVR-REG |
| US-CHN-003-02 | As a shopper with a basic phone, I want to place a simple order from a short menu, so that I can buy without internet. | D | Ready; conditions: OVR-REG |
| US-CHN-003-03 | As a shopper with a basic phone, I want to pay for that order from my mobile-money wallet, so that I can complete the purchase on the same phone. | D | Ready; conditions: OVR-REG |
| US-CHN-003-04 | As a client administrator, I want to set up the menus in each language without code, so that menus match our services. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-003-01-01 | US-CHN-003-01 | **Given** the USSD gateway (operator or aggregator, not named, MG-10) is connected to the CHN USSD endpoint (IC-CHN-02), **when** a session request arrives with session id, phone number and input, **then** the endpoint verifies the gateway (BR-CHN-012) and returns the next menu text and a continue-or-end flag. | REQ-MPC-INT-002 |
| AC-CHN-003-01-02 | US-CHN-003-01 | **Given** the caller's phone number belongs to one customer account (IAM-002), **when** the caller chooses My orders, **then** the most recent orders (count a setting, default not stated) are listed with number and status. | D |
| AC-CHN-003-01-03 | US-CHN-003-01 | **Given** the caller's phone number belongs to no customer account, **when** the caller chooses My orders, **then** the reply is Chn.UssdNotRegistered and no order data is shown. | Proposed |
| AC-CHN-003-01-04 | US-CHN-003-01 | **Given** the caller enters an order number, **when** the order does not exist or belongs to another customer, **then** the same reply Chn.UssdOrderNotFound is given in both cases (BR-CHN-011). | Proposed |
| AC-CHN-003-02-01 | US-CHN-003-02 | **Given** a simple-order menu lists configured products, **when** the caller picks a product and quantity, picks pickup or delivery to the saved address, and confirms, **then** an order is placed through IOrderProcessingService.PlaceOrderAsync (CHK-003 override, OVR-REG) for the caller's account with payment Pending, and the order number is returned. | D; Proposed (saved address) |
| AC-CHN-003-02-02 | US-CHN-003-02 | **Given** the gateway ends the session before confirmation, **when** the session closes, **then** no order is placed. | Proposed |
| AC-CHN-003-03-01 | US-CHN-003-03 | **Given** an order was placed through USSD and mobile money is available (PAY-004), **when** the caller confirms payment, **then** the PAY-004 payment request is sent to the caller's phone number; payment status follows PAY-004. | D |
| AC-CHN-003-04-01 | US-CHN-003-04 | **Given** a user with Channels.Core.Voice.CreateEditDelete edits the menu tree, **when** they save it, **then** the new menu is used by new sessions in each configured language; open sessions finish on the old menu. | D; Proposed |

**Business rules applied:** BR-CHN-011; BR-CHN-012 (§8.1).


### 7.4 PRD-CHN-004 IVR channel

| Item | Value |
|---|---|
| Description (baseline) | Automated phone menus in local languages, and automated voice calls for urgent notifications to customers who cannot use text. |
| Why it matters | Serves customers who prefer voice or cannot read well. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-TRK-005 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-004-01 | As a shopper, I want phone menus in my language to check my order, so that I can use the service by voice. | D; FC-M25-006 | Ready |
| US-CHN-004-02 | As a shopper who cannot read text messages, I want urgent notifications as automated voice calls, so that I do not miss important updates. | D; FC-M17-005 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-004-01-01 | US-CHN-004-01 | **Given** the IVR platform (not named) is connected to the CHN IVR endpoint (IC-CHN-03), **when** a caller selects a language and the order-status option and keys an order number, **then** the status of that order is read out if the calling number belongs to the order's customer; otherwise the not-found prompt is played (BR-CHN-011). | D |
| AC-CHN-004-02-01 | US-CHN-004-02 | **Given** TRK-005 sends a notification on the voice channel to a customer whose preference is voice (TRK-006), **when** the call is placed, **then** the voice adapter receives it through IC-TRK-02 Send with the message id as idempotency key, the message is played in the customer's language, and the call result (answered, not answered, failed) is returned through IC-TRK-02 DeliveryReceipt; TRK-005 applies its fallback. | D; FC-M17-005 |
| AC-CHN-004-02-02 | US-CHN-004-02 | **Given** no recorded or synthesised prompt exists for the customer's language, **when** a voice notification is due, **then** the voice channel is skipped and TRK-005 uses the next channel. | Proposed |

**Business rules applied:** BR-CHN-010; BR-CHN-011 (§8.1).


### 7.5 PRD-CHN-005 SMS gateway and SMS commands

| Item | Value |
|---|---|
| Description (baseline) | Connects to SMS providers to send text messages, and lets customers send simple text commands (for example to check an order). |
| Why it matters | Sends updates to basic phones without internet; Malawi Post requires SMS notifications. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-TRK-005 |
| Status | Ready; conditions: OVR-REG, MSG-ROUTE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-005-01 | As a client administrator, I want to send text messages through local SMS providers, so that customers on basic phones get updates. | D | Ready; conditions: OVR-REG, MSG-ROUTE |
| US-CHN-005-02 | As a shopper, I want to text a simple command and get my order status back, so that I can check my order without internet. | D; FC-M25-007 | Ready; conditions: OVR-REG, MSG-ROUTE |
| US-CHN-005-03 | Technical enabler. As a member of the platform team, I want one SMS provider contract every provider adapter implements, so that a new aggregator is added by building one adapter. | D | Ready; conditions: OVR-REG, MSG-ROUTE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-005-01-01 | US-CHN-005-01 | **Given** an SMS provider adapter is active, **when** TRK-005 sends an SMS notification through IC-TRK-02 Send (idempotency key = TRK message id), or IAM-002 sends a one-time code through IC-IAM-01 SendCode, **then** the message is queued as QueuedSms (SM-CHN-01), sent through the adapter, and the provider's delivery receipt sets it Delivered or Failed; for TRK-005 messages the status is reported through IC-TRK-02 DeliveryReceipt. | D; Proposed (queue) |
| AC-CHN-005-01-02 | US-CHN-005-01 | **Given** the provider returns a transient error, **when** sending is attempted, **then** it is retried per the retry setting (default not stated); if a secondary provider is configured it is used after the retries; otherwise the message becomes Failed and the failure is logged. | Proposed |
| AC-CHN-005-01-03 | US-CHN-005-01 | **Given** a client instance is configured, **when** the configuration check runs, **then** the bundled Misc.Brevo plugin is not installed (not in App_Data/plugins.json), because it replaces IWorkflowMessageService (NopStartup Order 3000), which OVR-REG gives to TRK-005; CHN registers no IWorkflowMessageService override (BR-CHN-010, BR-TRK-021). | FIT (Misc.Brevo BrevoMessageService, NopStartup); OVR-REG |
| AC-CHN-005-02-01 | US-CHN-005-02 | **Given** the command keyword for order status is set (Proposed default STATUS; catalog example FC-M25-007), **when** an SMS "STATUS <order number>" arrives from the phone number of that order's customer or billing address, **then** the reply gives the order number and status. | FC-M25-007; Proposed |
| AC-CHN-005-02-02 | US-CHN-005-02 | **Given** an order-status command arrives from a number that does not belong to the order, or names an unknown order, **when** it is processed, **then** the reply is Chn.SmsCommandNotFound in both cases (BR-CHN-011). | Proposed |
| AC-CHN-005-02-03 | US-CHN-005-02 | **Given** an SMS with an unknown keyword arrives, **when** it is processed, **then** the reply is Chn.SmsCommandHelp listing the available commands. | Proposed |
| AC-CHN-005-02-04 | US-CHN-005-02 | **Given** an inbound SMS callback arrives, **when** it fails provider verification (signature, token or source address as the provider supports), **then** it is rejected and logged; no reply is sent (BR-CHN-012). | Proposed |
| AC-CHN-005-03-01 | US-CHN-005-03 | **Given** a new provider adapter implements IC-CHN-01 (Send, ParseDeliveryReceipt, ParseInbound) and, since nopCommerce 5.00, the core ISmsProvider plugin type (SendSmsAsync) in the same plugin, **when** it is installed and configured, **then** SMS can be sent through it with no change to TRK-005 or IAM-002, and it is listed as an SMS provider in the native admin SMS provider list. | D; FIT (5.00.1: Libraries/Nop.Services/Messages/ISmsProvider.cs:8-17; Presentation/Nop.Web/Areas/Admin/Controllers/SmsController.cs) |
| AC-CHN-005-03-02 | US-CHN-005-03 | **Given** TRK-005 repeats IC-TRK-02 Send with a message id the SMS channel has already accepted, **when** the request is received, **then** no second SMS is queued and the first provider message id is returned. | Proposed (IC-TRK-02 idempotency key) |
| AC-CHN-005-01-04 | US-CHN-005-01 | **Given** a reply to an inbound SMS command is to be sent by CHN-005 outside TRK-005 (decision MSG-ROUTE), **when** before sending, CHN-005 calls IC-TRK-06 CheckAllowed with the phone number, channel SMS, category Conversation replies and sender CHN, and TRK answers Blocked (for example a ContactOptOut record OptedOut, BR-TRK-033), **then** the reply is not sent and the QueuedSms becomes Suppressed (SM-CHN-01); with Allowed it is sent; one-time codes are not checked again by CHN-005, because IAM-002 checks the opt-out before it calls IC-IAM-01 (BR-IAM-150, BR-TRK-026). | MSG-ROUTE; Proposed |
| AC-CHN-005-03-03 | US-CHN-005-03 | **Given** the client's aggregator adapter is selected as the primary SMS provider (MessagesSettings.ActiveSmsProviderSystemName) and IAM uses the native 5.00 phone one-time-code flow, **when** nopCommerce sends a code through ISmsService.SendSmsAsync, **then** the adapter calls IC-TRK-06 CheckAllowed (channel SMS, category Security codes), queues the message as QueuedSms (SM-CHN-01), sends it and returns true only when the provider accepted it; the delivery receipt later updates QueuedSms; the bundled Sms.Twilio is not the primary provider unless the client has confirmed it (open item). | VER-500; FIT (5.00.1: Libraries/Nop.Services/Messages/SmsService.cs:39-49; Libraries/Nop.Core/Domain/Messages/MessagesSettings.cs:25; Presentation/Nop.Web/Controllers/CustomerController.cs:632); MSG-ROUTE; Proposed |

**Business rules applied:** BR-CHN-003; BR-CHN-010; BR-CHN-011; BR-CHN-012; BR-CHN-020 (§8.1).


### 7.6 PRD-CHN-006 WhatsApp Business

| Item | Value |
|---|---|
| Description (baseline) | Order updates, notifications and chat on WhatsApp. |
| Why it matters | KTDA requires chat integrated with WhatsApp Business. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — External system + integration plugin |
| Depends on | PRD-TRK-005 |
| Status | Ready; conditions: SINGLE-FILTER, MSG-ROUTE, CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-006-01 | As a shopper, I want order updates and notifications on WhatsApp, so that I see updates where I already chat. | D; FC-M17-004 | Ready; conditions: SINGLE-FILTER, MSG-ROUTE, CFG-01 |
| US-CHN-006-02 | As a shopper, I want to chat live with support on WhatsApp, so that I get help on a channel I use. | D; REQ-KTDA-CHT-001 | Ready; conditions: SINGLE-FILTER, MSG-ROUTE, CFG-01 |
| US-CHN-006-03 | As a client administrator, I want to connect our own WhatsApp Business account, so that messages come from our verified business name. | D | Ready; conditions: SINGLE-FILTER, MSG-ROUTE, CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-006-01-01 | US-CHN-006-01 | **Given** a WhatsApp Business Platform account is connected and the notification templates are approved by the provider, **when** TRK-005 sends a notification on the WhatsApp channel to a customer who opted in (TRK-006), **then** the WhatsApp adapter receives it through IC-TRK-02 Send (idempotency key = message id), the template message is sent through the provider API in the customer's language, and its delivery status is returned through IC-TRK-02 DeliveryReceipt. | D; FC-M17-004 |
| AC-CHN-006-01-02 | US-CHN-006-01 | **Given** the customer has not opted in to WhatsApp, **when** a notification is due, **then** nothing is sent on WhatsApp and TRK-005 uses the next channel. | D (TRK-006) |
| AC-CHN-006-02-01 | US-CHN-006-02 | **Given** WhatsApp chat routing is on, **when** a customer sends a WhatsApp message to the business number, **then** the inbound handler stores it as an inbound ChannelMessage, publishes the module event Channel.MessageReceived (channel, channel message ID, sender, text, attachments) and routes it: to the AI-003 chatbot first when it is enabled for WhatsApp, otherwise to the live chat console (CRM-008) or, when routing is set to tickets, to CRM intake through IC-CRM-04 ReceiveInbound (BR-CHN-014). | REQ-KTDA-CHT-001; Proposed (routing setting) |
| AC-CHN-006-02-02 | US-CHN-006-02 | **Given** a conversation or ticket exists for a WhatsApp sender, **when** an agent replies in CRM-008 or on the CRM ticket, or the chatbot answers, **then** the reply is delivered to the sender on WhatsApp through IC-CHN-04 SendReply, outside TRK-005, after SendReply has called IC-TRK-06 CheckAllowed for that sender and channel (decision MSG-ROUTE, BR-TRK-026); when TRK answers Blocked nothing is sent and the reply is Refused with reason opted out, which CRM shows to the agent, and its delivery status is stored on the ChannelMessage. | REQ-KTDA-CHT-001; MSG-ROUTE |
| AC-CHN-006-02-03 | US-CHN-006-02 | **Given** a conversation is open, **when** the customer sends an image or a document, **then** it is attached to the conversation in the live chat console. | FC-M25-008 |
| AC-CHN-006-02-04 | US-CHN-006-02 | **Given** the provider refuses a message for the conversation (provider policy), **when** an agent sends it, **then** the agent sees Chn.MessageRefusedByProvider with the provider reason, and the message is not shown as sent. | Proposed |
| AC-CHN-006-03-01 | US-CHN-006-03 | **Given** an administrator enters the account credentials, **when** they are saved, **then** they are stored encrypted per client instance and never exported in a configuration pack (CFG-01); inbound callbacks are accepted only after provider verification (BR-CHN-012). | D; CFG-01 |
| AC-CHN-006-02-05 | US-CHN-006-02 | **Given** CHN has registered the upload context "channel inbound media" (own endpoint) with ADM-008 through IC-ADM-08 RegisterUploadContext at installation, **when** an inbound WhatsApp or WeChat message carries an image or a document, **then** the inbound handler calls IC-ADM-08 CheckUpload with that context before it stores the file; a refused file is not stored or passed on, the message is routed without it and the refusal reason is stored on the ChannelMessage; CHN keeps no file-type or size check of its own (BR-ADM-060). | Proposed; SINGLE-FILTER |

**Business rules applied:** BR-CHN-010; BR-CHN-012; BR-CHN-013; BR-CHN-014; BR-CHN-020 (§8.1).


### 7.7 PRD-CHN-007 WeChat

| Item | Value |
|---|---|
| Description (baseline) | Chat with customers on WeChat. |
| Why it matters | Reaches Chinese buyers (relevant to KTDA's international market). |
| Who benefits | International buyers |
| Phase | P1 |
| Implementation | Code-level — External system + integration plugin |
| Depends on | — |
| Status | Ready; conditions: CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-007-01 | As an international buyer, I want to chat with the seller on WeChat, so that I can ask questions on the app I use. | D; REQ-KTDA-CHT-001 | Ready; conditions: CFG-01 |
| US-CHN-007-02 | As a client administrator, I want to connect our WeChat official account, so that messages reach our support team. | D | Ready; conditions: CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-007-01-01 | US-CHN-007-01 | **Given** a WeChat official account is connected (account type and registration not stated, KG-24), **when** a buyer sends a message to the account, **then** it is stored and published as Channel.MessageReceived and routed as in AC-CHN-006-02-01 (live chat console CRM-008, or CRM intake through IC-CRM-04); the agent's replies are delivered to the buyer on WeChat through IC-CHN-04 SendReply (BR-CHN-014). | REQ-KTDA-CHT-001 |
| AC-CHN-007-01-02 | US-CHN-007-01 | **Given** WeChat refuses a message (provider policy), **when** an agent sends it, **then** the agent sees Chn.MessageRefusedByProvider with the reason. | Proposed |
| AC-CHN-007-02-01 | US-CHN-007-02 | **Given** an administrator enters the account credentials, **when** they are saved, **then** they are stored encrypted and never exported in a configuration pack; inbound callbacks are accepted only after WeChat signature verification (BR-CHN-012). | D; CFG-01 |

**Business rules applied:** BR-CHN-012; BR-CHN-013; BR-CHN-014; BR-CHN-020 (§8.1).


### 7.8 PRD-CHN-008 Telegram bot

| Item | Value |
|---|---|
| Description (baseline) | A Telegram channel or bot for customers. |
| Why it matters | Adds Telegram as an optional channel (catalog feature; no client has asked for it). |
| Who benefits | Shoppers |
| Phase | P3 |
| Implementation | Code-level — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-008-01 | As a shopper, I want a Telegram bot that tells me my order status and sends my notifications, so that I can use Telegram for the shop. | D; FC-M25-009 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-008-01-01 | US-CHN-008-01 | **Given** the Telegram bot is connected and the shopper has linked the account with a one-time code shown in My account, **when** the shopper asks the bot for order status, **then** the bot replies with the status of that shopper's recent orders; an unlinked chat gets the link instructions. | D; Proposed (linking) |
| AC-CHN-008-01-02 | US-CHN-008-01 | **Given** the shopper has linked Telegram and opted in (TRK-006), **when** TRK-005 sends a notification on the Telegram channel through IC-TRK-02 Send, **then** the message is delivered through the bot and its status returned through IC-TRK-02 DeliveryReceipt. | D |

**Business rules applied:** BR-CHN-010; BR-CHN-013 (§8.1).


### 7.9 PRD-CHN-009 Agent and correspondent networks

| Item | Value |
|---|---|
| Description (baseline) | Connects to networks of outlets, agents and banking agents who serve customers in person. |
| Why it matters | Extends reach to areas without online shoppers. |
| Who benefits | Agents; walk-in customers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-009-01 | As an agent, I want orders I place for walk-in customers at my outlet counted for my network, so that in-person sales through agent networks are measured. | D | Ready |
| US-CHN-009-02 | As a client administrator, I want to manage agent networks and their members, so that in-person service is organised by network. | D | Ready |
| US-CHN-009-03 | As a member of finance staff, I want agent commissions calculated from the orders agents handle, so that agents are paid correctly. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-009-01-01 | US-CHN-009-01 | **Given** an agent of outlet O places an order for a customer in an IAM-026 acting session (assisted checkout, CHK-013), **when** the order is placed, **then** CHK-013 records order, agent and outlet once in its AssistedOrder record (IAM-026 keeps only the session in AssistedServiceRecord, BR-IAM-130); CHN-009 reads it through the CHK read contract IC-CHK-10 (GetAssistedOrder, ListAssistedOrders) to attribute the order to the agent's network and keeps no order link of its own. | D; Proposed (one owner: CHK-013, BR-CHK-017) |
| AC-CHN-009-02-01 | US-CHN-009-02 | **Given** an administrator holding Channels.Core.Agents.CreateEditDelete selects a customer account that holds the Agent role and has outlets assigned in IAM-026, **when** they add it to a network, **then** an Active network membership (SM-CHN-03) is saved; outlet assignment and the customers the agent may serve stay with IAM-026 and IAM-008. | D |
| AC-CHN-009-02-02 | US-CHN-009-02 | **Given** an agent's network membership is Deactivated (SM-CHN-03), **when** an order is later placed in that agent's acting session, **then** no commission accrues for it; past commissions and attributions are kept; the agent's login and assisted access are controlled by IAM-026, not by CHN. | Proposed |
| AC-CHN-009-03-01 | US-CHN-009-03 | **Given** a commission rule is set for the agent's network (basis and value not stated), **when** an agent-attributed order is paid (OrderPaidEvent), **then** the consumer only enqueues the accrual; the commission task records an Accrued commission with the rule version used. | D; Proposed |
| AC-CHN-009-03-02 | US-CHN-009-03 | **Given** an agent-attributed order is refunded in full or in part (OrderRefundedEvent, after the RET-005 / PAY-016 refund completes), **when** the refund is recorded, **then** the commission is reversed in proportion to the refunded amount. | Proposed |
| AC-CHN-009-02-03 | US-CHN-009-02 | **Given** an external agent or correspondent network sends agent transactions through the API (INT-001), **when** they arrive, **then** each is matched to a network member by external code; unmatched records are listed as exceptions. | D |

**Business rules applied:** BR-CHN-030 (§8.1).


### 7.10 PRD-CHN-010 Field agent app

| Item | Value |
|---|---|
| Description (baseline) | A mobile app for field agents that works offline, records location and supports verification. |
| Why it matters | Agents can work in remote areas. |
| Who benefits | Field agents |
| Phase | P2 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-TRK-003 |
| Status | On hold: FG-06 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-010-01 | As a field agent, I want to capture records without network and send them when I am back online, so that I can work in remote areas. | D; FC-M04-026 | On hold: FG-06 |
| US-CHN-010-02 | As a field agent, I want each record tagged with location and time where I allow location access, so that records can be verified. | D; FC-M04-027 | On hold: FG-06 |
| US-CHN-010-03 | As a field agent, I want to attach photos and complete the verification steps of a record, so that checks are documented. | D; FC-M25-012 | On hold: FG-06 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-010-01-01 | US-CHN-010-01 | **Given** the field app (external) holds records captured offline, each with a client-generated id, **when** connectivity returns and the app syncs through INT-001, **then** each record is applied once (PLT-027 idempotency key); a record changed on the server since the agent downloaded it is refused with 409 and shown to the agent as a conflict. | D; Proposed |
| AC-CHN-010-02-01 | US-CHN-010-02 | **Given** the agent has allowed device location access, **when** a record is captured, **then** it carries latitude, longitude and capture time. | FC-M04-027 |
| AC-CHN-010-02-02 | US-CHN-010-02 | **Given** the agent has refused location access, **when** a record is captured, **then** it is saved without coordinates and marked "no location". | FC-M04-027 ("with consent"); Proposed |
| AC-CHN-010-03-01 | US-CHN-010-03 | **Given** a record has photos, **when** it is synced, **then** the photos are stored and linked to the record; the record shows which verification steps are complete. | D; FC-M25-012 |
| AC-CHN-010-03-02 | US-CHN-010-03 | **Given** CHN has registered the upload context "field record photo" (own endpoint) with ADM-008 through IC-ADM-08 RegisterUploadContext at installation, **when** a synced record carries a photo, **then** the sync endpoint calls IC-ADM-08 CheckUpload with that context before storing the photo through IPictureService; a refused photo is not stored, the record is applied without it and the ADM refusal reason is returned to the app for that photo; CHN keeps no file-type or size check of its own (BR-ADM-060). | Proposed; SINGLE-FILTER |

**Business rules applied:** BR-CHN-031 (§8.1).


### 7.11 PRD-CHN-011 Social media integration

| Item | Value |
|---|---|
| Description (baseline) | Share buttons, links to social media pages and login with social media accounts. |
| Why it matters | Easier sign-up and free promotion. |
| Who benefits | Shoppers; marketing staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-011-02 | As a shopper, I want to sign up and sign in with my social media account, so that I do not need another password. | D; REQ-MPC-INT-003 | Ready; conditions: CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-011-02-01 | US-CHN-011-02 | **Given** the bundled ExternalAuth.Facebook plugin is active and configured with the client's Facebook app credentials, **when** a shopper chooses Facebook on the sign-in page and consents, **then** the shopper is signed in to the account linked to that Facebook identity, or a new account is registered and linked. | REQ-MPC-INT-003; FIT |
| AC-CHN-011-02-02 | US-CHN-011-02 | **Given** the Facebook app secret is entered in the plugin configuration, **when** a configuration pack is exported or applied, **then** facebookexternalauthsettings.clientsecret is not exported and a pack that contains it is refused (BR-CHN-003). | CFG-01; BR-PLT-013 |

**Business rules applied:** BR-CHN-003 (§8.1).


### 7.12 PRD-CHN-012 SMS sender ID and opt-out

| Item | Value |
|---|---|
| Description (baseline) | Each client's SMS messages come from its own sender name, customers can reply STOP to opt out, and quiet hours are respected. |
| Why it matters | Professional, legal and respectful SMS. |
| Who benefits | Shoppers; clients |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-CHN-005 |
| Status | Ready; conditions: MSG-ROUTE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-012-01 | As a client administrator, I want all our SMS to come from our own sender name, so that customers recognise and trust them. | D | Ready; conditions: MSG-ROUTE |
| US-CHN-012-02 | As a shopper, I want to reply STOP to stop messages, so that I control what I receive. | D | Ready; conditions: MSG-ROUTE |
| US-CHN-012-03 | As a shopper, I want no non-urgent messages at night, so that I am not disturbed. | D | Ready; conditions: MSG-ROUTE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-012-01-01 | US-CHN-012-01 | **Given** a sender ID is set for the client on the provider adapter, **when** any SMS is sent, **then** it carries that sender ID; if the provider rejects the sender ID the message becomes Failed with the reason and administrators are alerted. | D |
| AC-CHN-012-02-01 | US-CHN-012-02 | **Given** opt-out keywords are set (Proposed default STOP), **when** a customer texts an opt-out keyword from a phone number that belongs to a customer account, **then** CHN-012 records the keyword (InboundSms) and calls IC-TRK-06 UpdatePreference (customer, channel SMS, all non-mandatory categories, opted out, source keyword), which sets that customer's SMS preference to off (AC-TRK-006-01-05); a confirmation Chn.SmsOptOutConfirmed is sent once through TRK-005; later non-mandatory SMS are not sent because TRK-005 applies the preference (BR-CHN-020, BR-TRK-031). | D; Proposed (scope of opt-out) |
| AC-CHN-012-02-02 | US-CHN-012-02 | **Given** the customer has opted out by SMS, **when** the customer texts the opt-in keyword (Proposed default START), **then** CHN-012 calls IC-TRK-06 UpdatePreference with opted in; the TRK-006 SMS preference (and any ContactOptOut record of that number) is set back on and Chn.SmsOptInConfirmed is sent through TRK-005. | Proposed; MSG-ROUTE |
| AC-CHN-012-02-03 | US-CHN-012-02 | **Given** an opt-out keyword arrives from a phone number that belongs to no customer account, **when** it is processed, **then** CHN-012 calls IC-TRK-06 UpdatePreference with the number in international format, channel SMS, opted out and source keyword; TRK-006 keeps the ContactOptOut record (SM-TRK-09, BR-TRK-033); CHN keeps no consent record of its own; later non-mandatory SMS to that number are not sent: notifications by TRK-005, command replies by AC-CHN-005-01-04, one-time codes by the IAM-002 check. | MSG-ROUTE; Proposed |
| AC-CHN-012-03-01 | US-CHN-012-03 | **Given** quiet hours are set in TRK-006 (customer or client default), **when** a non-urgent SMS notification falls inside them, **then** TRK-005 holds it and releases it when quiet hours end (BR-TRK-032); CHN-005 receives it only when released; CHN-012 holds no quiet-hours setting of its own (BR-CHN-021). | D |
| AC-CHN-012-03-02 | US-CHN-012-03 | **Given** IAM-002 requests a one-time code through IC-IAM-01 inside quiet hours, **when** the request is received, **then** the code is sent at once (BR-CHN-021). | Proposed |

**Business rules applied:** BR-CHN-020; BR-CHN-021 (§8.1).


### 7.13 PRD-CHN-013 Push notifications

| Item | Value |
|---|---|
| Description (baseline) | Notifications that pop up on the customer's phone from the app or installed website. |
| Why it matters | Timely updates that customers notice. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | Code-level — External system + integration plugin |
| Depends on | PRD-TRK-005 |
| Status | Ready; conditions: MSG-ROUTE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-CHN-013-01 | As a shopper, I want notifications that pop up on my phone from the app or the installed website, so that I notice updates in time. | D; FC-M17-003 | Ready; conditions: MSG-ROUTE |
| US-CHN-013-02 | As a shopper, I want a tap on a notification to open the matching page, so that I see the details at once. | FC-M17-003 | Ready; conditions: MSG-ROUTE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-CHN-013-01-01 | US-CHN-013-01 | **Given** the shopper grants notification permission in the app or the installed website, **when** permission is granted, **then** a PushSubscription (platform, token or endpoint, customer) is stored and the push opt-in is recorded in TRK-006 through IC-TRK-06 UpdatePreference (channel push, source channel opt-in); no subscription is stored without permission. | D; Proposed; MSG-ROUTE |
| AC-CHN-013-01-02 | US-CHN-013-01 | **Given** TRK-005 sends a notification on the push channel through IC-TRK-02 Send to a customer with a PushSubscription, **when** the push adapter sends it (FCM, APNs or Web Push), **then** it is delivered to each of the customer's devices, the result is returned through IC-TRK-02 DeliveryReceipt, and a token the service reports as invalid is removed. | D |
| AC-CHN-013-01-03 | US-CHN-013-01 | **Given** the shopper signs out on a device, **when** sign-out completes, **then** that device's subscription is unlinked from the customer. | Proposed |
| AC-CHN-013-02-01 | US-CHN-013-02 | **Given** a notification refers to an order, **when** the shopper taps it, **then** the app or website opens that order's page; if not signed in, the sign-in page opens first. | FC-M17-003 |

**Business rules applied:** BR-CHN-010; BR-CHN-020 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-CHN-001 | The mobile app uses only the public API under an INT-001 API client; it never reads the database directly. | CHN-001 | REQ-MPC-MOB-002; FIT |
| BR-CHN-002 | The service worker caches only public catalogue pages, topics and static files; account, cart, checkout and order pages are never cached; actions that change data are never queued offline. | CHN-002 | Proposed; SEC-012 |
| BR-CHN-003 | Every CHN setting key is listed in the CHN plugin key catalogue (key, type, layer, secret flag, default) so pack validation accepts it; every setting that holds a credential, key or token (SMS provider keys, push keys, facebookexternalauthsettings.clientsecret of the bundled ExternalAuth.Facebook plugin) is flagged secret, so packs refuse it and exports omit it; channel account credentials live in encrypted plugin-table fields (ChannelAccount.CredentialsRef). CHN pages, widgets, consumers and scheduled tasks act for a store only when IC-PLT-02 IsEnabled returns true for the CHN feature concerned. | CHN-002, CHN-005, CHN-011 | CFG-01; BR-PLT-013; Proposed |
| BR-CHN-010 | TRK-005 decides which notification is sent, to whom and on which channel; CHN adapters implement IC-TRK-02 (Send with idempotency key = message id; DeliveryReceipt; capability flags) and only deliver and report status. The bundled Misc.Brevo plugin is not installed in a client instance, because IWorkflowMessageService belongs to TRK-005 (OVR-REG, BR-TRK-021); CHN registers no IWorkflowMessageService override. Only two kinds of CHN send are outside TRK-005 (decision MSG-ROUTE, BR-TRK-026): conversational replies in a conversation the customer started (IC-CHN-04 SendReply for CRM agents and AI-003; CHN-005 replies to inbound SMS commands) and one-time codes that reach CHN-005 from IAM-002 through IC-IAM-01; both respect TRK-006 opt-outs (BR-CHN-020). | CHN-004, CHN-005, CHN-006, CHN-008, CHN-013 | FIT (Misc.Brevo replaces IWorkflowMessageService); OVR-REG; MSG-ROUTE; L1 §6.2 principle 7 |
| BR-CHN-011 | Order data is given on USSD, IVR, SMS and bot channels only to the phone number or linked account of the order's customer; "not found" and "not yours" get the same answer. | CHN-003, CHN-004, CHN-005 | Proposed; SEC-012 |
| BR-CHN-012 | Inbound callbacks from channel providers are verified (signature, token or source address as the provider supports) before they are processed; failures are logged and audited. | CHN-003, CHN-005, CHN-006, CHN-007 | Proposed; NFR-X-001 |
| BR-CHN-013 | Channel account credentials are stored encrypted per client instance and never exported in configuration packs. | CHN-006, CHN-007, CHN-008 | CFG-01 |
| BR-CHN-014 | Inbound messages (WhatsApp, WeChat, Telegram) are first stored as ChannelMessage, then published as module event Channel.MessageReceived (consumers only notify or enqueue), then routed by the inbound handler: chatbot first when AI-003 is enabled for the channel, otherwise live chat (CRM-008) or CRM intake through IC-CRM-04, per the routing setting. Replies by people or the chatbot in a conversation the customer started go back through IC-CHN-04 SendReply, which calls IC-TRK-06 CheckAllowed before each send and sends nothing when Blocked; notifications go only through TRK-005. | CHN-006, CHN-007 | REQ-KTDA-CHT-001; MSG-ROUTE; Proposed |
| BR-CHN-020 | TRK-006 is the single store of channel preferences and opt-outs, also for phone numbers without an account (decision MSG-ROUTE, BR-TRK-033). Every opt-out or opt-in received on a CHN channel (SMS keywords, push permission) is passed to TRK-006 through IC-TRK-06 UpdatePreference; the keyword is recorded in InboundSms with time and source. Before any CHN send outside TRK-005 (SendReply, SMS command reply) CHN calls IC-TRK-06 CheckAllowed and sends nothing when Blocked; one-time codes are checked by IAM-002 before IC-IAM-01. CHN keeps no opt-out record of its own. | CHN-005, CHN-006, CHN-007, CHN-012, CHN-013 | D; MSG-ROUTE; Proposed |
| BR-CHN-021 | CHN holds no quiet-hours setting: quiet hours are applied by TRK-005 from TRK-006 (BR-TRK-032); they do not apply to sends outside TRK-005 (BR-TRK-026), so one-time codes from IAM-002 (IC-IAM-01) are sent at once. | CHN-012 | D; MSG-ROUTE; Proposed |
| BR-CHN-030 | Agent commission is accrued on payment of an order attributed to an Active network member through the CHK-013 AssistedOrder record (read through IC-CHK-10), and reversed in proportion to refunds, using the rule version in force when the order was paid. | CHN-009 | D; Proposed |
| BR-CHN-031 | Field records are applied once per client-generated id; a server-side change after download makes the sync of that record a conflict, never a silent overwrite. The field app is one app (decision FIELD-APP): CHN-010 owns its agent functions; its scanning functions are TRK-003 (BR-TRK-011). | CHN-010 | FC-M04-026; FIELD-APP; Proposed |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-CHN-01 | QueuedSms | (none) | message queued | — | Queued | — |
| SM-CHN-01 | QueuedSms | Queued | due time reached | TRK-005 notification or one-time code; or a command reply for which IC-TRK-06 CheckAllowed answers Allowed | Sending | — |
| SM-CHN-01 | QueuedSms | Queued | due time reached | command reply for which IC-TRK-06 CheckAllowed answers Blocked | Suppressed | logged with the reason; not sent |
| SM-CHN-01 | QueuedSms | Sending | provider accepts | — | Sent | provider message id stored |
| SM-CHN-01 | QueuedSms | Sending | transient error | attempts below maximum | Queued | next attempt time; secondary provider after retries if configured |
| SM-CHN-01 | QueuedSms | Sending | permanent error or attempts exhausted | — | Failed | logged; TRK-005 informed |
| SM-CHN-01 | QueuedSms | Sent | delivery receipt: delivered / failed | — | Delivered / Failed | status to TRK-007 |
| SM-CHN-02 | ChannelMessage (WhatsApp, WeChat, Telegram, push, voice) | (none) | send requested by TRK-005 (IC-TRK-02) or a reply requested by CRM or AI-003 (SendReply) | — | Queued | — |
| SM-CHN-02 | ChannelMessage | (none) | inbound message received and verified | not a duplicate channel message ID | Received | Channel.MessageReceived published; routed (BR-CHN-014) |
| SM-CHN-02 | ChannelMessage | Queued | SendReply and IC-TRK-06 CheckAllowed answers Blocked | — | Refused | reason opted out returned to CRM or AI-003; nothing sent |
| SM-CHN-02 | ChannelMessage | Queued | provider accepts | — | Sent | — |
| SM-CHN-02 | ChannelMessage | Queued | provider refuses | — | Refused | reason shown to agent (Chn.MessageRefusedByProvider) or to TRK-005 |
| SM-CHN-02 | ChannelMessage | Sent | provider status: delivered / failed | — | Delivered / Failed | status to TRK-007 |
| SM-CHN-03 | AgentNetworkMember | (none) | agent added to a network | Agent role and IAM-026 outlets | Active | AUD-CHN-003 |
| SM-CHN-03 | AgentNetworkMember | Active | suspended | — | Suspended | no commission accrues |
| SM-CHN-03 | AgentNetworkMember | Suspended | reinstated | — | Active | — |
| SM-CHN-03 | AgentNetworkMember | Active / Suspended | deactivated | — | Deactivated | no commission accrues; past attributions kept |
| SM-CHN-04 | AgentCommission | (none) | agent-linked order paid | commission rule exists | Accrued | rule version stored |
| SM-CHN-04 | AgentCommission | Accrued | refund recorded | — | Accrued (reduced) / Reversed | proportional reversal |
| SM-CHN-04 | AgentCommission | Accrued | paid out (process not stated) | — | Paid | AUD-CHN-003 |
| SM-CHN-05 | UssdSession | (none) | first request from gateway | gateway verified | InMenu | — |
| SM-CHN-05 | UssdSession | InMenu | caller completes the flow | — | Completed | order or answer returned |
| SM-CHN-05 | UssdSession | InMenu | gateway ends session or time limit | — | TimedOut | no order placed |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| QueuedSms (new) | Id, To, Text, SenderId, Kind (TRK notification / one-time code / command reply), Priority (OTP / transactional / promotional), ProviderSystemName, ProviderMessageId, Status (SM-CHN-01), Attempts, NotBeforeUtc, LastError, CreatedOnUtc | CHN-005, CHN-012 | Native QueuedEmail is email only |
| InboundSms (new) | Id, From, Text, Keyword, ProcessedAs, ReplyText, ReceivedOnUtc | CHN-005, CHN-012 | |
| ChannelAccount (new) | Channel (WhatsApp / WeChat / Telegram / push / voice / USSD), StoreId, CredentialsRef (encrypted), IsActive | CHN-003 to CHN-008, CHN-013 | Credentials never in packs (CFG-01) |
| ChannelTemplate (new) | Channel, TemplateName, LanguageId, ProviderStatus, TRK-005 event | CHN-006, CHN-007 | |
| ChannelMessage (new) | Id, Channel, CustomerId, ExternalUserId, Direction, Body or template, Attachments, ProviderMessageId (inbound: channel message ID, unique per channel), TrkMessageId (IC-TRK-02 idempotency key), Status (SM-CHN-02), ConversationRef (CRM-008 / CRM ticket / AI-003) | CHN-004, CHN-006 to CHN-008, CHN-013 | |
| ChannelIdentity (new) | Channel, ExternalUserId (WhatsApp number, WeChat open id, Telegram chat id), CustomerId, LinkedOnUtc | CHN-006 to CHN-008 | |
| UssdMenu / UssdSession (new) | Menu: Node, ParentNode, LanguageId, Text, Action; Session: SessionId, PhoneNumber, State (SM-CHN-05), CurrentNode, Data | CHN-003 | IVR menus use the same structure (CHN-004) |
| PushSubscription (new) | Id, CustomerId, Platform (Android / iOS / Web), TokenOrEndpoint, CreatedOnUtc | CHN-013 | |
| PwaSettings (new settings class) | Name, ShortName, StartUrl, Display, ThemeColour, BackgroundColour, IconSet, LightMode, LightModePictureSize | CHN-002 | Per store (settings with StoreId); replaces the shared static site.webmanifest by a per-store manifest route (Proposed) |
| AgentNetwork / AgentNetworkMember (new) | Network: Name, ExternalSystem; Member: CustomerId (Agent role, IAM-026 AgentProfile), NetworkId, ExternalCode, Status (SM-CHN-03) | CHN-009 | Outlets are IAM-026 (AgentProfile); the agent-order record is CHK-013 AssistedOrder; not duplicated |
| AgentCommissionRule / AgentCommission (new) | Rule: NetworkId, Basis, Value, EffectiveFromUtc, Version; Commission: OrderId, AgentId, Amount, RuleVersion, Status (SM-CHN-04) | CHN-009 | |
| FieldRecord (new) | ClientId (from app), AgentId, Type, Payload, Latitude, Longitude, CapturedOnUtc, PictureIds, VerificationSteps, ServerVersion | CHN-010 | Pictures checked through IC-ADM-08 CheckUpload (context field record photo) and stored through native IPictureService |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| SMS gateway and sender ID | SMS provider plugin settings (5.00: ISmsProvider plugin selected by messagessettings.activesmsprovidersystemname); sender ID; opt-out keywords; quiet hours | country → client | CHN-005 / CHN-012 | Core |
| Channels pack settings | Mobile app branding and API client; USSD menus; IVR menus; WhatsApp/WeChat/Telegram accounts; push provider | vertical (Channels pack) → client | CHN-001 / CHN-003 / CHN-004 / CHN-006 / CHN-013 | Channels pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| SMS providers, retry, secondary provider (provider keys flagged secret, BR-CHN-003) | SMS provider plugin settings (new) | country → client | Not stated (KTDA SMS only by inference via IAM-002 OTP) | Required (MPC report §5.1); provider not named |
| Misc.Brevo not installed in client instances | App_Data/plugins.json (installed list) | installation | Not installed (OVR-REG, BR-CHN-010) | Not installed (OVR-REG, BR-CHN-010) |
| Sender ID; opt-out and opt-in keywords | CHN-012 settings (new); opt-out records and quiet hours are TRK-006 (ContactOptOut, preferences) | country → client | Not stated | Not stated |
| Inbound message routing per channel (chatbot, live chat, tickets) | CHN-006 / CHN-007 settings (new) | client | Not stated (KG-24) | Chatbot on WhatsApp (FR-256) |
| CHN feature state per store | productfeature.PRD-CHN-nnn (PLT-022, read through IC-PLT-02) | client → store | Not stated | Not stated |
| SMS command keywords | CHN-005 settings (new) | client | Not stated | Not stated |
| PWA manifest and light mode | PwaSettings (new, per store); CommonSettings.FaviconAndAppIconsHeadCode (native) | client → store | Not stated | Low-bandwidth required (FR-019); values not stated |
| Script and style bundling | WebOptimizerConfig in App_Data/appsettings.json (native, installation-wide, default on) | installation | Default | Default |
| USSD gateway and menus | ChannelAccount, UssdMenu (new) | country → client | — | Required (INT-002); gateway not named (MG-10) |
| IVR platform and menus | ChannelAccount, UssdMenu (new) | country → client | Not stated | Not stated |
| WhatsApp, WeChat, Telegram accounts and templates | ChannelAccount, ChannelTemplate (new) | client | WhatsApp and WeChat (CHT-001); KG-24 | WhatsApp for the chatbot (FR-256) |
| Push provider keys | ChannelAccount (new) | client | Not stated | Not stated |
| Mobile app branding and API client | Licensed app configuration (V-01); INT-001 API client | client | — | M-19 |
| Social sign-in, share code, social links | ExternalAuth.Facebook settings; CatalogSettings.ShowShareButton, PageShareCode; StoreInformationSettings.FacebookLink, TwitterLink, YoutubeLink, InstagramLink (native) | client → store | Not stated | Required (INT-003); accounts not stated |
| Agent networks and commission rules | AgentNetwork, AgentCommissionRule (new) | client | Not stated | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Installable website, offline page and banner, light mode | CHN-002 | Theme/view override + plugin |
| Storefront — My account | Link Telegram; notification permission; SMS opt-in status | CHN-008, CHN-012, CHN-013 | New |
| Storefront | Social sign-in | CHN-011 | Native |
| Admin | SMS providers, log, inbound commands, opt-out keywords | CHN-005, CHN-012 | New |
| Admin | Channel accounts and templates (WhatsApp, WeChat, Telegram, push, voice) | CHN-004, CHN-006 to CHN-008, CHN-013 | New |
| Admin | USSD and IVR menu editor | CHN-003, CHN-004 | New |
| Admin | PWA settings per store | CHN-002 | New |
| Admin | Agent networks, members, commission rules and commissions | CHN-009 | New |
| Admin | External authentication | CHN-011 | Native |
| Live chat console | WhatsApp and WeChat conversations | CHN-006, CHN-007 | CRM-008 licensed plugin |
| Mobile app | App screens and admin content configuration | CHN-001 | Licensed product (V-01) |
| Field app | Capture, offline queue, sync conflicts | CHN-010 | External app |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns. USSD, IVR and SMS texts are locale resources.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Chn.OfflineBanner | You are offline. This page may not be up to date. | AC-CHN-002-03-01 |
| Chn.OfflinePage | You are offline. Check your connection and try again. | AC-CHN-002-03-01 |
| Chn.OfflineActionBlocked | You need a connection to do this. Nothing has been sent. | AC-CHN-002-03-02 |
| Chn.UssdNotRegistered | This phone number is not registered with us. Visit our website or an outlet to register. | AC-CHN-003-01-03 |
| Chn.UssdOrderNotFound | We could not find that order for this phone number. | AC-CHN-003-01-04 |
| Chn.SmsCommandNotFound | We could not find that order for this phone number. | AC-CHN-005-02-02 |
| Chn.SmsCommandHelp | Commands you can send: {commands}. | AC-CHN-005-02-03 |
| Chn.MessageRefusedByProvider | The message was not sent. Reason from the provider: {reason}. | AC-CHN-006-02-04, AC-CHN-007-01-02 |
| Chn.SmsOptOutConfirmed | You will no longer receive these messages. Reply START to receive them again. | AC-CHN-012-02-01 |
| Chn.SmsOptInConfirmed | You will receive our messages again. Reply STOP to stop them. | AC-CHN-012-02-02 |

Default English text and keywords are Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it, including USSD and IVR prompts.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| SMS providers (CHN-005, CHN-012) | Send, delivery receipt, inbound SMS (IC-CHN-01) | Local aggregators (not named) | — |
| USSD gateway (CHN-003) | Session callbacks (IC-CHN-02) | Operator or aggregator (MG-10) | External |
| IVR / voice platform (CHN-004) | Menus, voice calls (IC-CHN-03) | Not named | External; P2 |
| WhatsApp Business Platform (CHN-006) | Templates, chat, media, status (IC-CHN-04) | Meta (account owner KG-24) | — |
| WeChat official account (CHN-007) | Chat, status (IC-CHN-04) | WeChat (KG-24) | — |
| Telegram Bot API (CHN-008) | Bot chat, notifications (IC-CHN-04) | Telegram | P3 |
| Push services (CHN-013) | FCM, APNs, Web Push (IC-CHN-05) | Google, Apple, browsers | P2 |
| Mobile app (CHN-001) | Web API (INT-001) | Licensed nopCommerce Mobile App | V-01, M-19 |
| Field app (CHN-010) | Sync (IC-CHN-06) through INT-001 | External app (not named) | P2 |
| Live chat (CRM-008) | Conversation hand-over | Licensed live chat plugin (V-01) | Interface to confirm |
| Preferences and opt-outs (TRK-006) | UpdatePreference, CheckAllowed (IC-TRK-06) | TRK module (internal) | Decision MSG-ROUTE |
| Upload policy (ADM-008) | RegisterUploadContext, CheckUpload (IC-ADM-08) | ADM module (internal) | Contexts channel inbound media and field record photo (decision SINGLE-FILTER) |
| Assisted orders (CHK-013) | AssistedOrder read through IC-CHK-10 GetAssistedOrder / ListAssistedOrders | CHK module (internal) | Read only |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-CHN-01 | SMS provider adapter | Send(to, text, sender ID, idempotency key); ParseDeliveryReceipt(callback); ParseInbound(callback) | Provider message id; Delivered / Failed; inbound sender and text | Transient, permanent, sender ID rejected, verification failed | Adapter registered by a CHN-005 plugin; the SMS channel implements IC-TRK-02 for TRK-005 and serves IC-IAM-01 for IAM-002; called by the SMS task; callbacks on a plugin controller deriving from Microsoft.AspNetCore.Mvc.Controller on its own route (IRouteProvider) |
| IC-CHN-02 | USSD session endpoint | Session id, phone number, service code, input | Menu text, continue or end flag | Gateway not verified, unknown session | CHN-003 plugin controller on its own route; orders through native order placement |
| IC-CHN-03 | IVR endpoint and voice send | Call id, calling number, key input; voice notification (to, language, text or recording) | Prompt to play; call result | Platform error | CHN-004 plugin controller; voice channel adapter implementing IC-TRK-02 for TRK-005 |
| IC-CHN-04 | Messaging channel adapter | SendTemplate, SendText, SendMedia (notifications, through IC-TRK-02); SendReply(conversation or ticket ref, text, attachments) for CRM-008, CRM tickets and AI-003; ParseInbound; ParseStatus | Provider message id; status; inbound message (channel, channel message ID, sender, text, attachments) published as Channel.MessageReceived and routed to AI-003, CRM-008 or IC-CRM-04 | Refused by provider (reason), refused by TRK-006 (opted out), attachment refused by ADM-008, verification failed, duplicate channel message ID | One adapter each for WhatsApp, WeChat, Telegram; hand-over to CRM-008 through its integration interface (to be confirmed with the licensed plugin, V-01); tickets through IC-CRM-04 |
| IC-CHN-05 | Push adapter | Register(customer, platform, token or endpoint); Send(subscription, title, text, link) | Sent; invalid token | Invalid token (subscription removed), provider error | FCM / APNs / Web Push adapter implementing IC-TRK-02 for the TRK-005 push channel |
| IC-CHN-06 | Field app sync | Records with client id, location, time, photos; reference data request | Applied / Conflict (409) per record | Validation, conflict | INT-001 endpoints with PLT-027 idempotency keys; scan events from the same app go to IC-TRK-01 (TRK-003) |

C# signatures are produced at the start of the L2 build and approved by the tech lead; this table fixes the operations and their mapping. Provider-specific message rules (templates, windows, media sizes) are read from each provider's documentation at build; none is stated in a client source.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Notification send on a CHN channel | None natively; TRK-005 channel call | CHN adapters deliver; status to TRK-007 |
| Order paid (agent commission) | OrderPaidEvent (native) | CHN-009 consumer enqueues the commission accrual |
| Order refunded (agent commission) | OrderRefundedEvent (native) | CHN-009 proportional reversal |
| Agent-assisted order | CHK-013 AssistedOrder record (order, agent, outlet), written in the CHK-003 placement override | CHN-009 reads it and attributes the order to the network |
| Channel.MessageReceived (WhatsApp, WeChat, Telegram) | None natively; CHN module event published through IEventPublisher after the inbound ChannelMessage is stored | Consumers notify or enqueue only; routing to AI-003, CRM-008 or IC-CRM-04 is done by the inbound handler (BR-CHN-014) |
| Inbound SMS, USSD, IVR | None natively; provider callback on plugin route | CHN command handling; STOP / START to TRK-006 through IC-TRK-06 UpdatePreference (CHN-012) |
| Channel.MessageFailed | None (CHN event); status returned through IC-TRK-02 DeliveryReceipt | TRK-005 fallback; TRK-007 |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Duplicate inbound callback from a provider | CHN-005 to CHN-007 | Callbacks are de-duplicated by channel message ID before processing (and again by CRM, BR-CRM-003); a command is answered once and an event is published once |
| The SMS task runs on two nodes | CHN-005 | The native ScheduleTaskRunner lock per task type applies; a QueuedSms row is claimed by the status change Queued → Sending with a row-version check on the plugin table |
| STOP received while a message to that number is already queued in CHN | CHN-012 | TRK-005 applied preferences before handing its messages to CHN; messages it releases after the STOP are not sent (BR-TRK-031, BR-TRK-033); a queued command reply is checked with IC-TRK-06 CheckAllowed when the SMS task takes it, so it becomes Suppressed |
| TRK-005 retries IC-TRK-02 Send after a timeout | CHN-004 to CHN-006, CHN-008, CHN-013 | The TRK message id is the idempotency key; a repeated Send returns the first result and sends nothing |
| USSD session repeats the confirm step | CHN-003 | The session state allows one order per session; the second confirm returns the same order number |
| Field record synced twice (retry) | CHN-010 | PLT-027 idempotency key on the record's client id; the second call returns the first result |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| SMS opt-out or opt-in confirmed | Customer | SMS through TRK-005 (once) | CHN-012 |
| SMS provider failing or sender ID rejected | Administrators | Admin notification / email through TRK-005 | CHN-005, CHN-012 |
| Channel account credentials rejected by provider | Administrators | Admin notification | CHN-006 to CHN-008 |
| Event codes | — | CHN registers these event codes through IC-TRK-04 RegisterEventCode at installation (names Proposed, listed in BR-TRK-023): Chn.Core.SmsOptOutConfirmed, Chn.Core.SmsOptInConfirmed, Chn.Core.SmsProviderAlert (provider failing, sender ID rejected), Chn.Core.AgentMembershipDeactivated | All |
| Agent network membership deactivated | Agent | Email through TRK-005 | CHN-009 (Proposed) |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| SMS log, delivery rates and opt-outs | CHN-005, CHN-012 | D |
| Channel message delivery by channel | CHN-006 to CHN-008, CHN-013 | D (feeds TRK-007) |
| Agent orders and commissions | CHN-009 | D |
| USSD sessions and outcomes | CHN-003 | D |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-CHN-001 | Channel provider or account configured or changed | Administrator | ChannelAccount | old and new values, credentials masked |
| AUD-CHN-002 | Opt-out or opt-in keyword processed and passed to TRK-006 | System (customer SMS) | InboundSms (the preference change itself is AUD-TRK-005) | number, keyword, result of IC-TRK-06 UpdatePreference, time |
| AUD-CHN-003 | Network member added, suspended, reinstated or deactivated; commission rule changed; commission paid | Administrator / Finance | AgentNetworkMember, AgentCommissionRule, AgentCommission | old and new values |
| AUD-CHN-004 | Inbound callback rejected (verification failed) | System | ChannelAccount | provider, source, reason |
| AUD-CHN-005 | USSD or IVR menu changed | Administrator | UssdMenu | old and new nodes |

Business events AUD-CHN-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new values of entity changes are captured by the SEC-004 IRepository<> decorator and need no call (BR-SEC-010). All CHN plugin tables are written through IRepository<>; no CHN code writes through INopDataProvider directly (BR-SEC-011). The native activity log is not used as audit. Names and fields are Proposed; credentials are never recorded.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-CHN-001 | Light pages for low-bandwidth and low-end devices; page-weight and load-time targets: Not stated in source — requires confirmation. | REQ-MPC-FR-019; NFR-X-006 | AC-CHN-002-02-01 to 02-03 (target held) |
| NFR-CHN-002 | Every inbound provider callback is verified before processing. | BR-CHN-012; NFR-X-001 | AC-CHN-005-02-04; AUD-CHN-004 |
| NFR-CHN-003 | Channel credentials encrypted per client instance, never in packs. | CFG-01; BR-PLT-013 | AC-CHN-006-03-01; AC-CHN-007-02-01; AC-CHN-011-02-02 |
| NFR-CHN-004 | Order data on phone-based channels only to the order's own customer. | BR-CHN-011; SEC-012 | AC-CHN-003-01-04; AC-CHN-005-02-02 |
| NFR-CHN-005 | USSD and IVR answers within the gateway's response limit: limit Not stated in source. | REQ-MPC-INT-002 | AC-CHN-003-01-01 (limit held) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-CHN-001 | P1 | — | |
| PRD-CHN-002 | P1 | — | PRD-SRC-023 |
| PRD-CHN-003 | P1 | — | |
| PRD-CHN-004 | P2 | PRD-TRK-005 | |
| PRD-CHN-005 | P1 | PRD-TRK-005 | PRD-IAM-002, PRD-CHK-012, PRD-PAY-013, PRD-TRK-012, PRD-CHN-012 |
| PRD-CHN-006 | P1 | PRD-TRK-005 | PRD-CRM-008, PRD-AI-003 |
| PRD-CHN-007 | P1 | — | |
| PRD-CHN-008 | P3 | — | |
| PRD-CHN-009 | P2 | — | |
| PRD-CHN-010 | P2 | PRD-TRK-003 | |
| PRD-CHN-011 | P1 | — | |
| PRD-CHN-012 | P2 | PRD-CHN-005 | |
| PRD-CHN-013 | P2 | PRD-TRK-005 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-CHN-01 | Each provider adapter is tested against the provider sandbox: send, receipt, inbound, refusal, failed verification. |
| T-CHN-02 | Privacy: order status requested by USSD, IVR and SMS from a number that is not the customer's returns the same answer as an unknown order. |
| T-CHN-03 | PWA: installation on Android Chrome and iOS Safari; offline page; account, cart and checkout pages absent from the service-worker cache. |
| T-CHN-04 | Brevo check: Misc.Brevo is not installed in a client instance and exactly one IWorkflowMessageService registration exists (TRK-005). |
| T-CHN-05 | Opt-out and quiet hours: a STOP from a customer number and from a no-account number each call IC-TRK-06 UpdatePreference once; later non-mandatory SMS are not sent; a command reply and a SendReply to an opted-out recipient are not sent (CheckAllowed Blocked); quiet hours are applied by TRK-005 only; a one-time code passes at once when IAM-002 sends it. |
| T-CHN-08 | Channel contract: each adapter passes the IC-TRK-02 tests (idempotent Send, DeliveryReceipt, capability flags); inbound WhatsApp and WeChat messages publish Channel.MessageReceived once and reach AI-003, CRM-008 or IC-CRM-04 per routing. |
| T-CHN-09 | Configuration: every CHN setting key is in the key catalogue; secret keys are refused in packs and omitted in exports; with a CHN feature off for a store, no CHN page, widget or task acts for that store. |
| T-CHN-06 | Permissions: each permission in §4 has an allow and a deny case. |
| T-CHN-07 | State models: every transition in §8.2 is tested; transitions not listed are rejected. |
