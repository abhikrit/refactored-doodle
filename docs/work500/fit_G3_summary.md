# G3 re-fit to nopCommerce 5.00.1: summary

Scope: 157 features, areas TRK, RET, CRM, MKT, RPT, ADM, DOC, SEC, INT, CHN, AI, FIN, EGV, SVC. Source of 4.90 fit: PRD_Product_Backlog_v9.xlsx, sheet "nopCommerce 4.90 fit". Evidence: /home/claude/src/nop5001/src (paths below are relative to it). Detail per feature: fit_G3.csv.

## Counts by fit category

| Fit category | 4.90.8 | 5.00.1 | Delta |
|---|---|---|---|
| Out of the box | 22 | 23 | +1 |
| Third-party plugin | 5 | 5 | 0 |
| Code-level modification | 101 | 100 | -1 |
| Not implementable in nopCommerce | 29 | 29 | 0 |
| Total | 157 | 157 | |

Changed category: 1 feature. Evidence or gap text updated with no category change: 41 features. No change found: 115 features. For each of these, every evidence path cited in 4.90 was checked and exists in 5.00.1, except paths moved by 5.00 (Forums, Polls and PrivateMessage), which were re-cited.

## Changed features

| PRD ID | 4.90 | 5.00 | Reason |
|---|---|---|---|
| PRD-INT-012 Punch-out | Code-level modification | Out of the box | The bundled Plugins/Nop.Plugin.Misc.PunchOut provides cXML PunchOutSetupRequest (`/punchout/setup`, identity and shared secret), session start, and cart return as a PunchOutOrderMessage (`/punchout/return`). It also adds sessions, a log and admin pages. Partial: OCI is not in the 5.00.1 source, and neither is cXML OrderRequest (receiving a PO back). |

## Category unchanged, but build scope or evidence changed (main ones)

| PRD ID | 5.00 change |
|---|---|
| PRD-MKT-012 Abandoned-cart recovery | Now native in core: ReminderSettings.AbandonedCartEnabled and ProcessAbandonedCartsTask, with up to 3 email follow-ups to registered customers who have an email address. No SaaS is needed for email. SMS reminders are still Brevo SaaS or a build. |
| PRD-TRK-005, CHN-005, CHN-012, TRK-012 | New core SMS abstraction: ISmsProvider, ISmsService, a primary provider set in MessagesSettings.ActiveSmsProviderSystemName, and the bundled Sms.Twilio. It is only used for phone OTP and is not wired to message templates. It returns a bool, so there is no delivery status. It supports one primary provider and no inbound messages. The local-aggregator provider plugins, template wiring, fallback, inbound commands and STOP handling are still to build. |
| PRD-RET-001, RET-002 | New ReturnRequestSettings, moved from OrderSettings. Guest return/withdrawal lookup by order number + email + CAPTCHA, with an emailed token. New settings: reasons/actions toggles, completed-orders-only, and downloadables. Still one uploaded file per request. |
| PRD-TRK-011 Guest order-status lookup | Still not native: OrderController.Details and ShipmentDetails require the owner. The 5.00 guest withdrawal form (ReturnRequestController.Find) is a reusable pattern for the fallback build. |
| PRD-AI-003 AI chatbot | The bundled Widgets.Jotform embeds a Jotform AI agent (external SaaS) from embed code. It has no order data, no WhatsApp and no hand-off. Partial: covers the web widget only. |
| PRD-AI-007 ML recommendation engine | The bundled AIRecommendation.GoogleAI (Google Cloud Retail) only re-ranks keyword search (IAiRecommendationPlugin.SearchProductsAsync, ProductService.cs:899). No recommendation widget was found. The category stays Not implementable. |
| PRD-CRM-013, MKT-007, CRM-011 | Forums, News and Polls moved out of core into the bundled plugins Misc.Forums, Misc.News and Misc.Polls. They must be installed. Blog stays in core. |
| PRD-TRK-006, TRK-008, RET-011, CRM-009 | PrivateMessage and PrivateMessageSettings moved to the Customers domain. CRM-009/CRM-002: new configurable ContactFormAttribute fields on Contact us. |
| PRD-ADM-008 | Roxy Fileman was replaced by elFinder (ElFinderController). The antivirus hook must also cover this endpoint. |
| PRD-ADM-010 | New AutoCancelOrdersTask and pending-order customer reminders. Still no staff alerts. |
| PRD-MKT-002, MKT-014, FIN-004, SVC-001 | New native price lists, per customer or role, with fixed/percentage/amount prices and dates. They are not BOGO or bundles, they are Administrators-only by default, and they are usable as a subsidy price mechanism. |
| PRD-RPT-001 | All reports gain "export all" Excel/XML actions. Bestsellers are still sorted descending only. |
| PRD-MKT-010 | New bundled Feed.ChatGptShopping product feed. |
| PRD-SEC-013 | New CaptchaSettings.ShowOnWithdrawalForm. The forum and news CAPTCHA flags left core. |

## New 5.00 capabilities relevant to G3 features

- Core reminders: Libraries/Nop.Services/Reminders/*, Areas/Admin/Controllers/ReminderController.cs, permission REMINDERS_MANAGE.
- Core SMS: Libraries/Nop.Services/Messages/ISmsProvider.cs, SmsService.cs, Areas/Admin/Controllers/SmsController.cs, Plugins/Nop.Plugin.Sms.Twilio.
- PunchOut cXML: Plugins/Nop.Plugin.Misc.PunchOut.
- AI search provider: Libraries/Nop.Services/ArtificialIntelligence/IAiRecommendationPlugin.cs, Plugins/Nop.Plugin.AIRecommendation.GoogleAI (needs Widgets.GoogleAnalytics and Google Cloud credentials).
- Jotform AI agent widget: Plugins/Nop.Plugin.Widgets.Jotform. This is an embed-code-only widget.
- Guest returns: Presentation/Nop.Web/Controllers/ReturnRequestController.cs:120-176, Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs.
- Contact-form attributes: Libraries/Nop.Core/Domain/Common/ContactFormAttribute.cs.
- Price lists: Libraries/Nop.Core/Domain/PriceLists/*.
- ChatGPT Shopping feed: Plugins/Nop.Plugin.Feed.ChatGptShopping.
- RFQ quote PDF: Plugins/Nop.Plugin.Misc.RFQ/Services/Pdf/QuoteDocument.cs.
- Not found in the 5.00.1 source:
  - company or sub-user accounts (relevant to CRM-015)
  - push notifications
  - service worker / PWA (the web manifest is unchanged, with an empty name)
  - WhatsApp
  - inbound SMS
  - help desk
  - staff live chat
  - guest order-status page

## Paid stubs (code verified: only plugin class, controller, event consumer and Views/Configure.cshtml linking to nopcommerce.com; plugin.json SupportedVersions 5.00)

| Stub | Features affected |
|---|---|
| Plugins/Nop.Plugin.Misc.PowerBI | RPT-002, RPT-008 |
| Plugins/Nop.Plugin.Misc.WebApi.Frontend | INT-001 (and the CHN-001 app dependency) |
| Plugins/Nop.Plugin.Misc.NopMobileApp | CHN-001 |
| Plugins/Nop.Plugin.Misc.Dynamics365 | INT-005 |
| Plugins/Nop.Plugin.Misc.OmnibusDirective | Not a G3 feature. It is a stub as well: its 4 .cs files are of the same pattern. |

Not stubs, with real code: Misc.PunchOut, AIRecommendation.GoogleAI, Sms.Twilio, Widgets.Jotform, Feed.ChatGptShopping, Misc.Forums, Misc.News, Misc.Polls, Misc.RFQ, Misc.Brevo, Misc.Omnisend.

## Risks

- **Third-party vendor plugins with no verifiable 5.00 build.** It cannot be verified from source whether NopStation, Nop-Templates, FoxNetSoft or Nop-Plus have 5.00 builds. Affected:
  - CRM-001 Help Desk (Nop-Templates or nopStation)
  - CRM-008 Tawk.to (Nop-Plus)
  - TRK-011 guest order status (FoxNetSoft)
  - MKT-007 NT Rich Blog (optional)
  - CHN-011 NS Google Authentication (optional)

  These stay decision V-01. Fallbacks: custom plugins (TRK-011 can reuse the 5.00 guest withdrawal pattern).
- **Paid official plugins.** It cannot be verified from source whether the Web API, Mobile App, Power BI and Dynamics 365 plugins have 5.00 builds, or what their licence terms are. The stubs show only that they are marketed for 5.00.
- **Forums, News and Polls are now plugins.** An instance upgraded from 4.90 needs these bundled plugins installed. Data carry-over was not verified in this review.
- **Jotform and GoogleAI depend on external SaaS** (Jotform and Google Cloud Retail). Data residency (SEC-006) and Kenya/Malawi DPA (SEC-012) apply before enabling them.
- **SMS.** Only Twilio is bundled, and there is one primary provider per installation (setting-level). Local aggregators need ISmsProvider plugins. Twilio coverage and cost for Kenya and Malawi are not verified.
- **elFinder** replaces Roxy Fileman. Upload-security controls (ADM-008) and CREST VAPT scope must include it.
