# nopCommerce 5.00.1 re-fit: G2 (SRC, CHK, PAY, ORD, LOG): 142 features

Method: each feature's 4.90 classification was checked against the 5.00.1 source (`/home/claude/src/nop5001/src`). Every 4.90 evidence path for G2 was confirmed present in 5.00.1 by script. Two exceptions: `Plugins/Nop.Plugin.Payments.Manual` was removed, and `CatalogSettings.UseStandardSearchWhenSearchProviderThrowsException` was renamed to `UseStandardSearchWhenNoResults`. A source diff of 4.90.8 against 5.00.1 (domain, settings, services, controllers, views, bundled plugins) was screened for anything that changes a G2 gap. Output: `/home/claude/work500/fit_G2.csv` (142 rows, each ID once, checked against the workbook sheet "nopCommerce 4.90 fit").

## 1. Counts by category

| Fit category | 4.90 | 5.00 | Delta |
|---|---|---|---|
| Out of the box | 18 | 20 | +2 |
| Third-party plugin | 4 | 4 | 0 |
| Code-level modification | 111 | 109 | -2 |
| Not implementable in nopCommerce | 9 | 9 | 0 |
| **Total** | **142** | **142** | |

By area (4.90 → 5.00):

| Area | OOB | 3P plugin | Code-level | Not implementable |
|---|---|---|---|---|
| SRC (27) | 8 → 10 | 2 → 2 | 16 → 14 | 1 → 1 |
| CHK (19) | 4 → 4 | 1 → 1 | 14 → 14 | 0 → 0 |
| PAY (36) | 2 → 2 | 0 → 0 | 31 → 31 | 3 → 3 |
| ORD (28) | 2 → 2 | 0 → 0 | 25 → 25 | 1 → 1 |
| LOG (32) | 2 → 2 | 1 → 1 | 25 → 25 | 4 → 4 |

## 2. Changed features (2)

| PRD ID | 4.90 → 5.00 | Reason (one line) |
|---|---|---|
| PRD-SRC-001 Keyword search | Code-level → Out of the box (conditional) | The bundled `Nop.Plugin.AIRecommendation.GoogleAI` sends free-text queries to Google Cloud Retail Search from inside `ProductService.SearchProductsAsync` (ProductService.cs:897-924). This covers the 4.90 natural-language gap without a custom ISearchProvider. It requires a Google Cloud account and the GA plugin, and the natural-language quality is Google's and cannot be verified from source. |
| PRD-SRC-012 Search history | Code-level → Out of the box | `SearchTerm` now has `CustomerId`/`CreatedOnUtc`. The per-customer history shows in search-box autocomplete and can be repeated or deleted (CatalogSettings.cs:251/256; CatalogController.cs:413-438). It is on by default. |

## 3. Unchanged category, narrower gap (5.00 additions relevant to G2)

| PRD ID | 5.00 addition (evidence) | Remaining gap |
|---|---|---|
| PRD-CHK-004 Multi-seller split checkout | New vendor cart filter: `ShoppingCartSettings.VendorEnabled`/`VendorRequired` and `ShoppingCartType.Stash`. Checkout is refused with several vendors and no vendor selected (ShoppingCartService.cs:1221-1227). Stashed items return after the order (OrderProcessingService.cs:1639). | The SPLIT-PAY interim mode (single-seller orders, sequential checkouts) is now configuration. Splitting one checkout and one payment into sub-orders is still custom. |
| PRD-PAY-035 Direct payment to seller | Single-seller orders can be enforced natively (same settings). | Per-vendor merchant credentials and routing are still custom. |
| PRD-CHK-006 Delivery slot | Desired delivery **date** per shipping method (`ShippingSettings.AllowCustomerToChooseDeliveryDate`, `DeliveryDateRangeDays`; `Order.DesiredDeliveryDateUtc`). | Time window and capacity. |
| PRD-CHK-014 Estimated delivery at checkout | The date list starts at today + TransitDays (CheckoutModelFactory.cs:450-482). | It is not labelled as an expected date, and there is no pickup collection date at checkout. |
| PRD-SRC-014 Search engine | Google AI plugin can provide relevance ranking. Lucene is still a stub. | Admin boosting rules with audit, and multilingual sync (the plugin syncs the default admin language only, GoogleAiService.cs:248). |
| PRD-SRC-009 Personalised recommendations | The Google AI plugin passes the GA client-id as VisitorId, so Google may personalise search ranking. | It has no recommendation widget or predict call, no event export and no consent gate. Stays Not implementable. |
| PRD-PAY-013 Payment receipts | New SMS framework (`ISmsService`, `ISmsProvider`, admin SMS page) and bundled `Sms.Twilio`. The only caller is phone OTP (CustomerController.cs:632). | Wiring order-paid to SMS. A local aggregator needs a custom `ISmsProvider`. |
| PRD-ORD-004 Cancellation rules | `AutoCancelOrdersTask` auto-cancels unpaid orders after a delay. | Reasons, policy windows, seller cancel, and auto-cancel on a missed seller deadline. |
| PRD-PAY-005 / PAY-011 | Pending-order reminder emails (`ProcessPendingOrdersTask`, `Order.LastPendingOrderFollowUp*`) and auto-cancel of unpaid orders. | Unique reference and matching; attempt log and extended statuses. |
| PRD-ORD-025 Proforma invoice | Misc.RFQ v5.00.18 generates a customer quote PDF (`AllowCustomerGenerateQuotePdf`, RfqService.cs:907). | Proforma from cart, and a proforma layout. |
| PRD-ORD-012 RFQ | Misc.RFQ adds CAPTCHA on the request page and the quote PDF. | It is still store-owner only, with no vendor routing. |
| PRD-ORD-028 Recurring orders | Next-recurring-payment reminder email (`OrderSettings.NextRecurringPaymentNotificationDays`). | There is still no task that processes due recurring payments (default task list, InstallRequiredData.cs:3488-3587). |
| PRD-PAY-002 Card payments | `Payments.Manual` removed. Card fields on `Order` are obsolete (removal in 5.10), and the card properties were removed from `ProcessPaymentRequest`. | Gateway adapters. 5.00 no longer stores card data, which fits the hosted-page requirement. |

Other 5.00 additions checked that do not affect G2 classifications: PunchOut cXML (`Misc.PunchOut`, an external e-procurement integration, noted on CHK-018/ORD-015), native price lists, abandoned-cart and incomplete-registration reminders, Jotform chatbot widget, ChatGPT Shopping feed, OTP phone verification (noted on LOG-012), withdrawal/return-request settings (noted on LOG-013), GPSR, 3D objects, Cloudflare images, Swiper v5.00.6. No company/sub-user (buyer hierarchy) entity was found in the 5.00.1 source, so CHK-018 is unchanged.

## 4. Paid stubs in 5.00.1 (configuration page only links to nopcommerce.com; class implements IMiscPlugin only)

| Plugin (version) | Evidence | G2 features affected |
|---|---|---|
| Search.Lucene (5.00.3) | Plugins/Nop.Plugin.Search.Lucene/LuceneSearchProvider.cs; Views/Configure.cshtml | SRC-014 |
| Misc.WebApi.Frontend (5.00.3) | Plugins/Nop.Plugin.Misc.WebApi.Frontend/Views/Configure.cshtml | SRC-024 |
| Misc.NopMobileApp (5.00.3) | Plugins/Nop.Plugin.Misc.NopMobileApp/Views/Configure.cshtml | LOG-032 |
| Misc.PowerBI (5.00.3) | Plugins/Nop.Plugin.Misc.PowerBI/Views/Configure.cshtml | LOG-018 |
| Misc.Dynamics365 (5.00.3) | Plugins/Nop.Plugin.Misc.Dynamics365/Views/Configure.cshtml | PAY-033 |
| Misc.OmnibusDirective (5.00.3) | Plugins/Nop.Plugin.Misc.OmnibusDirective/Views/Configure.cshtml | none in G2 |

These plugins are real (not stubs): AIRecommendation.GoogleAI (about 1,600 lines; Google.Cloud.Retail.V2), Sms.Twilio, Misc.PunchOut, Feed.ChatGptShopping, Widgets.Jotform, Misc.RFQ, PayPalCommerce.

## 5. Risks / Flags / Open items

| # | Item |
|---|---|
| R-01 | Third-party vendors (NopStation, Nop-Templates, FoxNetSoft) and AFR extensions: availability of 5.00 builds **cannot be verified from source**. Affected: SRC-007, SRC-027, CHK-017, LOG-006 (Third-party plugin), plus vendor candidates named in SRC-009 and LOG-015, and AFR/Post Gebeya ports in PAY-001/002/008/015, ORD-009, LOG-007/009/016/020. Decision V-01 still applies. |
| R-02 | SRC-001 is OOB only if the client accepts Google Cloud Retail. That means sending catalogue data and visitor IDs to Google, which needs Kenya DPA / Malawi data-protection confirmation (not stated in source), plus Google Cloud cost and the GA plugin. If not accepted, SRC-001 reverts to Code-level modification (custom ISearchProvider). |
| R-03 | Google AI search fallback: if `ArtificialIntelligenceSettings.UseStandardSearchWhenNoResults` is false, a Google error or empty result returns the product query **without the keyword filter** (ProductService.cs:915-922). Set it to true in the config pack. |
| R-04 | Google AI search runs only when the GA client-id cookie is present (GoogleAiService.cs:730-731). Visitors who decline analytics cookies fall back to standard search, so behaviour differs by consent state. |
| R-05 | `Payments.Manual` is removed in 5.00.1. Any 4.90 test or demo set-up that used it must switch to CheckMoneyOrder or a gateway adapter. Order card fields are obsolete and will be removed in 5.10. |
| R-06 | Twilio is the only bundled SMS provider. Coverage and cost for Kenya and Malawi cannot be verified from source, so a local aggregator `ISmsProvider` is likely to be needed (PAY-013, LOG-012). |
| R-07 | The 5.00 vendor cart filter gives one order per seller with separate payments. Customers would pay several times in one session; confirm with KTDA/MPC that this is acceptable as the interim mode (decision SPLIT-PAY). |
| R-08 | CHK-003/CHK-004/ORD-010 DI overrides (OrderProcessingService, ShoppingCartService, ShipmentService) must be rebased. `OrderProcessingService` changed in 5.00 (desired date at :792-796, vendor reset at :1639), and `ShoppingCartService` gained vendor/stash logic (:604, :1221, :1617, :1980). |
