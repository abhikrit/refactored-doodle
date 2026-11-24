# G1 re-fit summary: nopCommerce 4.90.8 to 5.00.1 (PLT, IAM, SEL, CAT, INV; 135 features)

Detail is in `/home/claude/work500/fit_G1.csv`. Every feature from the workbook sheet "nopCommerce 4.90 fit" for these areas appears once (135 rows, checked by script).

Source checked: `/home/claude/src/nop5001/src`, compared with `/home/claude/src/nop4908/src`. All paths below are relative to `src/`.

"Changed" means the fit category changed. Where the category stayed the same but the gap got smaller, the CSV row says so in "Note on change".

## 1. Counts by category

| Category | 4.90 | 5.00 |
|---|---|---|
| Out of the box | 26 | 27 |
| Third-party plugin | 2 | 2 |
| Code-level modification | 100 | 99 |
| Not implementable in nopCommerce | 7 | 7 |
| **Total** | **135** | **135** |

| Area | OOTB 4.90 / 5.00 | Third-party 4.90 / 5.00 | Code-level 4.90 / 5.00 | Not implementable 4.90 / 5.00 |
|---|---|---|---|---|
| PLT (27) | 9 / 9 | 1 / 1 | 12 / 12 | 5 / 5 |
| IAM (27) | 3 / 3 | 0 / 0 | 23 / 23 | 1 / 1 |
| SEL (25) | 3 / 3 | 0 / 0 | 21 / 21 | 1 / 1 |
| CAT (43) | 9 / 10 | 1 / 1 | 33 / 32 | 0 / 0 |
| INV (13) | 2 / 2 | 0 / 0 | 11 / 11 | 0 / 0 |

## 2. Features whose category changed (1)

| PRD ID | 4.90 | 5.00 | Reason |
|---|---|---|---|
| PRD-CAT-039 Customer and company price lists | Code-level modification | Out of the box | 5.00 adds native price lists: `Libraries/Nop.Core/Domain/PriceLists/*`, `Libraries/Nop.Services/Catalog/PriceCalculationService.cs:77-140,454`, and `Presentation/Nop.Web/Areas/Admin/Controllers/PriceListController.cs`. A price list can be assigned to customers or customer roles, has start and end dates, and supports a manual price or a percentage/amount/fixed adjustment, a priority or lowest-price strategy, and Excel import/export. |

## 3. Same category, smaller gap (documented in the CSV)

| PRD ID | What 5.00.1 now covers | What remains |
|---|---|---|
| PRD-IAM-002 Mobile-number identity with OTP | SMS OTP login (`OtpSettings`, `CustomerController.SendOtp` and `OtpPhoneVerification`), phone verification at registration and phone change, `Customer.PhoneSmsVerified`, the SMS provider plugin type (`ISmsProvider` and `SmsPluginManager`, plus the admin `SmsController`), the bundled Twilio plugin, and E.164 normalisation with libphonenumber. | Registration still requires email and password (`CustomerRegistrationService.cs:264-281`). Password recovery works by email only. A KE/MW SMS gateway is needed if the client does not accept Twilio. |
| PRD-INV-004 Stock reservation and hold | `AutoCancelOrdersTask` cancels unpaid orders after a delay and returns the stock. Pending-order and abandoned-cart reminder emails (`Libraries/Nop.Services/Reminders/*`). | Stock hold when an item is added to the cart or when checkout starts. SMS reminders. |
| PRD-CAT-016 Product media | 3D objects: `Product3dObject`, `MediaSettings.Object3d*`, `ProductController.Upload3dObject`, and the vendor upload setting. | PDF brochures. A 360-degree photo spin, if a 3D model does not meet the requirement (the source does not say which format is meant). |
| PRD-CAT-035 Listing syndication | Bundled `Feed.ChatGptShopping`, a working feed plugin for one channel. | Other marketplaces and comparison sites. |
| PRD-CAT-020 Origin and provenance | `Manufacturer` responsible-person and address fields, shown on the product page when `GpsrSettings.Enabled` is on. | Attachments for certificates and chain-of-ownership documents. |
| PRD-PLT-023 Data migration toolkit | Price-list Excel import. | Import of reward-point and gift-card balances, and a reconciliation report. |
| PRD-IAM-021 Transaction history | RFQ quote PDF for customers (`RfqCustomerController.PdfDocument`). | Customer export of history to CSV/Excel. |
| PRD-IAM-004 MFA by role | `ISmsService` can be reused by a custom SMS MFA method. | Email, SMS and FIDO2 providers. Only GoogleAuthenticator is bundled. |

## 4. New 5.00 capabilities checked against G1 features

| 5.00 addition | Evidence | G1 relevance |
|---|---|---|
| Native price lists | `Libraries/Nop.Core/Domain/PriceLists`, `Libraries/Nop.Services/PriceLists`, `Admin/Controllers/PriceListController.cs` | CAT-039 changed. CAT-040 not affected (price only, no visibility control). CAT-042 not affected (no currency field). |
| SMS OTP and SMS provider framework, Twilio plugin | `OtpSettings.cs`, `Libraries/Nop.Services/Messages/ISmsProvider.cs`, `Plugins/Nop.Plugin.Sms.Twilio` | IAM-002, IAM-001, IAM-023, IAM-004, SEL-020 |
| Reminders (abandoned cart, incomplete registration, pending orders) and order auto-cancel | `Libraries/Nop.Services/Reminders/*`, `Libraries/Nop.Services/Orders/AutoCancelOrdersTask.cs`, `ReminderSettings`, `OrderSettings.AutoCancel*` | INV-004, IAM-001 |
| 3D product objects | `Product3dObject.cs`, `MediaSettings.Object3d*`, `VendorSettings.AllowVendorsToUpload3dObjects` | CAT-016, SEL-001 |
| GPSR (EU product safety) | `GpsrSettings.cs`, `Manufacturer.cs` new fields | CAT-019, CAT-020 (EU-specific; KE/MW applicability not stated in source) |
| ChatGPT Shopping feed | `Plugins/Nop.Plugin.Feed.ChatGptShopping` | CAT-035 |
| PunchOut (cXML) | `Plugins/Nop.Plugin.Misc.PunchOut` | IAM-005: not SSO, so no change. Relevant to B2B procurement areas outside G1. |
| Split multi-vendor carts | `ShoppingCartSettings.VendorEnabled/VendorRequired`, `ShoppingCartService.cs:604,1221` | SEL-016 and SEL-017: no settlement or commission, so no change |
| Private messages moved to core | `Domain/Customers/PrivateMessage.cs`, `Controllers/PrivateMessagesController.cs` | IAM-025 (inbox only), SEL-001 (contact vendor) |
| Report export to Excel/XML, registered-customers report, search-term history | `Admin/Controllers/ReportController.cs`, `RegisteredCustomersReportLine.cs`, `CatalogSettings.ShowSearchTermHistory` | CAT-034, INV-003, INV-013 |
| AI meta tags, AI recommendation provider (GoogleAI) | `MetaTagsGeneratingEvent.cs`, `Plugins/Nop.Plugin.AIRecommendation.GoogleAI` | CAT-017 (already OOTB). Recommendations are outside G1. |
| .NET 10, MySQL 8 type map | `Directory.Build.props:3`, `NopMySql8TypeMap.cs` | PLT-015, PLT-021 |
| Jotform widget, Omnibus, Swiper, Cloudflare Images | `src/Plugins` | No G1 feature affected. Cloudflare Images is noted as a media offload option under PLT-015. |
| Company accounts / sub-users | Not found in 5.00.1 source | IAM-022, IAM-027, CAT-040, SEL-009 unchanged |

## 5. Paid stubs in 5.00.1 (code verified)

Each of these plugins contains only a plugin class, a controller, an event consumer and a `Configure.cshtml` that links to nopcommerce.com. They contain no functional code.

| Plugin (version) | Link target | G1 feature |
|---|---|---|
| Misc.WebApi.Frontend (5.00.3) | nopcommerce.com/web-api | CAT-011 (stays Third-party plugin) |
| Misc.Dynamics365 (5.00.3) | nopcommerce.com/microsoft-dynamics-365 | INV-012 |
| Misc.PowerBI (5.00.3) | nopcommerce.com/microsoft-power-bi | CAT-034 |
| Misc.OmnibusDirective (5.00.3) | nopcommerce.com/omnibus-directive | none in G1 |
| Misc.NopMobileApp (5.00.3) | nopcommerce.com/ecommerce-mobile-app | none in G1 |

## 6. Risks and flags

1. **Third-party vendors.** Whether NopStation (Vendor Discount and Commission, SEL-016), Nop-Templates (Pavilion theme, PLT-006), FoxNetSoft and nopAccelerate (SMS, IAM-002) have 5.00 / .NET 10 builds cannot be verified from source; it needs confirmation from each vendor. The paid nopCommerce Web API plugin (CAT-011) has a 5.00 stub, but the plugin itself cannot be verified either.
2. **AFR extensions.** The AFR ports referenced for 4.70.5 (SEL-002, CAT-010, INV-002, INV-004, INV-006) must be rebuilt for .NET 10. This also cannot be verified from source.
3. **Price-list precedence (CAT-039).** A tier price, when one applies, replaces the price-list price (`PriceCalculationService.cs:459-462`). Price lists have no store or currency scope. A configuration rule is needed for clients that use both tier prices and contract price lists.
4. **Phone identity (IAM-002).** Registration still requires email (`CustomerRegistrationService.cs:264-268`). The client sources must confirm whether email is optional for KTDA and MPC customers. The SMS gateway (Twilio or a local aggregator) is not stated in source.
5. **Removed settings.** `CustomerSettings.PhoneNumberValidationUseRegex` and `PhoneNumberValidationRule` are removed in 5.00 and replaced by libphonenumber. Any 4.90 configuration pack entries that use them must be dropped (affects PLT-003 pack content).
6. **Hosting.** 5.00 needs .NET 10 and drops the MySQL 5 type map (PLT-015). Built-in backup is still SQL Server only (PLT-016).
7. **Rebuild of custom plugins.** Every custom and third-party plugin must declare `SupportedVersions` "5.00" and be rebuilt (PLT-021).
8. **Inherited flags.** Evidence for unchanged features was spot-checked: the key 4.90 paths and properties exist in 5.00.1. Where a domain file is byte-identical to 4.90.8, the CSV says so. Confidence levels inherited from 4.90 (for example PLT-018 accessibility and SEL-016) are not upgraded by this review.
