# L2 Module PRD — MKT: Marketing, promotions, loyalty, content and SEO

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | MKT — Marketing, promotions, loyalty, content and SEO |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Gives client staff the tools to promote and explain the shop without developers: discounts and promo codes, advanced promotions (buy-X-get-Y, spend bands, bundles), reward points, gift cards and vouchers, newsletters and email campaigns, pop-ups, web content with approval and policy versions, search-engine optimisation, marketing tags and social links, customer segmentation, abandoned-cart reminders, affiliates and referrals, and seller-managed prices and discounts in a marketplace.

**In scope**

- Discounts and coupons, advanced promotions, reward points, gift cards and vouchers (MKT-001 to MKT-004)
- Newsletter subscriptions and email campaigns (MKT-005); abandoned-cart e-mail reminders through the native nopCommerce 5.00 reminders, optional Omnisend contact synchronisation (MKT-005, MKT-012); bundled Misc.Brevo is not installed (decision OVR-REG: IWorkflowMessageService belongs to TRK-005)
- On-site pop-ups (MKT-006)
- Content management (pages, blog, news, polls, menus, banners), content approval and policy versioning (MKT-007, MKT-008)
- SEO, marketing tags and social links (MKT-009, MKT-010)
- Customer segmentation attributes and segment roles (MKT-011)
- Affiliates and customer referrals (MKT-013)
- Seller-managed prices and vendor discounts (MKT-014, Marketplace pack)

**Not in this module**

| Item | Where it is |
|---|---|
| Marketing campaigns run by the vendor (Google Ads, social, print, electronic media) | Project service (REQ-KTDA-MKT-001; decision ORG-SVC) — MKT-010 supplies the tags |
| Drafting privacy, terms, shipping and returns policies | Project service (REQ-KTDA-LEG-002; ORG-SVC) — MKT-007 hosts them, MKT-008 versions them |
| Marketing campaign dashboards and analytics | RPT module (PRD-RPT-011) |
| Acceptance records of terms and policies, re-acceptance prompts | IAM module (PRD-IAM-016) — uses MKT-008 policy versions (IC-MKT-03) |
| Social login | CHN module (PRD-CHN-011) |
| Product pictures, videos and media | CAT module (PRD-CAT-016) |
| Knowledge base categories, search and agent canned answers | CRM module (PRD-CRM-007) |
| Guided tours | PLT module (PRD-PLT-019) |
| Price tiers by customer group | CAT module (PRD-CAT-012) |
| Stored-value wallet | PAY module (PRD-PAY-009) — native GiftCard and RewardPoints are not the wallet |
| Multi-channel notification engine and SMS gateway | TRK / CHN modules (PRD-TRK-005, CHN-005) |
| Marketing consent and data-protection profile | SEC module (PRD-SEC-012) |
| Payouts of affiliate commissions (money movement) | PAY module (PRD-PAY-024, IC-PAY-01 Payout) |
| Platform audit trail store | SEC module (PRD-SEC-004) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-MKT-001 | Discounts and coupons | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-MKT-002 | Advanced promotions | B2B + B2C | P1 | Code-level | Custom plugin | Engagement and loyalty pack | | |
| PRD-MKT-003 | Reward points | B2C | P1 | Configuration | None | Engagement and loyalty pack | | |
| PRD-MKT-004 | Gift cards and vouchers | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-MKT-005 | Newsletter and email campaigns | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-MKT-006 | On-site pop-ups | B2B + B2C | P1 | Code-level | Custom plugin | Engagement and loyalty pack | | |
| PRD-MKT-007 | Content management | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-MKT-008 | Content approval and policy versioning | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002 | WF-ENG |
| PRD-MKT-009 | SEO | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-MKT-010 | Marketing tags and social | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-MKT-011 | Customer segmentation attributes | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-MKT-012 | Abandoned-cart recovery | B2C | P2 | Configuration | None (email); Custom plugin if SMS reminders required | Engagement and loyalty pack | PRD-TRK-005 | |
| PRD-MKT-013 | Affiliates and referrals | B2C | P2 | Code-level | Custom plugin | Engagement and loyalty pack | | |
| PRD-MKT-014 | Seller-managed pricing and promotions | Seller / back-office | P1 | Configuration | None | Marketplace pack | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Uses promo codes, gift cards and reward points, subscribes to newsletters, sees pop-ups and content, shares products | Guests / Registered (native) |
| Marketing staff | Creates discounts, promotions, campaigns, pop-ups, segments, affiliates, referral rules; configures tags | Role system name "Marketing" (BR-IAM-050); native permissions mapped to it by the configuration pack |
| Content staff | Creates and edits pages, blog posts, news, polls, menus and banners | Role system name "Content" (BR-IAM-050) |
| Content approver (for example legal staff) | Approves content and policy changes; reads policy version history | Role system name "ContentApprover" (BR-IAM-050) |
| Seller | Sets own prices, tier prices and vendor discounts | Vendors (native) |
| Affiliate or referring customer | Shares a tracked link and earns commission or points | Affiliate record (native, no login) / Registered customer |
| Client administrator | Configures SEO, reward points, gift card, newsletter and plugin settings | Administrators (native) |
| Marketing SaaS (Omnisend, optional), Google, Meta (systems) | Receive contacts, cart events and tag data | External systems via bundled plugins |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Promotions.DiscountsView / Promotions.DiscountsCreateEditDelete (native) | Promotions | Discounts, coupons, requirement rules (incl. MKT-002 rules); vendors see only their own | Administrators, Vendors (native defaults); Marketing (pack mapping, Proposed) |
| Orders.GiftCardsView / Orders.GiftCardsCreateEditDelete (native) | Orders | Gift cards and vouchers | Administrators; Marketing (Proposed) |
| Promotions.SubscribersView / SubscribersCreateEditDelete / SubscribersImportExport; Promotions.SubscriptionTypeView / SubscriptionTypeCreateEditDelete (native) | Promotions | Newsletter subscribers and subscription types | Administrators; Marketing (Proposed) |
| Promotions.CampaignsView / CampaignsCreateEdit / CampaignsDelete / CampaignsSendEmails (native) | Promotions | Email campaigns | Administrators; Marketing (Proposed) |
| ContentManagement.TopicsView / TopicsCreateEditDelete; BlogView / BlogCreateEditDelete; MenusView / MenusCreateEditDelete (native); News.View / News.Manage (bundled Misc.News plugin, Plugins/Nop.Plugin.Misc.News/NewsDefaults.cs:139-140); Polls.View / Polls.Manage (bundled Misc.Polls plugin, Plugins/Nop.Plugin.Misc.Polls/PollsDefaults.cs:58-59) — the ContentManagement.News* and Polls* names were removed from core in 5.00 | ContentManagement | Pages, news, blog, polls, menus | Administrators; Content (Proposed) |
| Promotions.AffiliatesView / AffiliatesCreateEditDelete (native) | Promotions | Affiliates | Administrators; Marketing (Proposed) |
| Configuration.ManageWidgets (native) | Configuration | Widget plugins: Swiper banners, Google Analytics, Facebook Pixel, MKT pop-up widget activation | Administrators |
| Configuration.ManageSettings (native) | Configuration | SEO, sitemap, reward points, customer settings and customer attributes | Administrators |
| Configuration.ManagePlugins (native) | Configuration | Required for the Omnisend configuration page (natively since 5.00, BR-MKT-013) | Administrators |
| Marketing.Core.Content.Approve | ContentManagement | Approve or reject content revisions and policy versions | ContentApprover |
| Marketing.Core.PolicyVersions.View | ContentManagement | Read policy version history and old versions | Administrators, ContentApprover, Content |
| Marketing.Core.Segments.CreateEditDelete | Customers | Segment rules that maintain segment customer roles | Marketing |
| Marketing.Engagement.Popups.View | Promotions | View pop-ups and their statistics | Marketing |
| Marketing.Engagement.Popups.CreateEditDelete | Promotions | Create, schedule, activate pop-ups | Marketing |
| Marketing.Engagement.Referrals.View | Promotions | View referrals, affiliate commissions | Marketing, Finance (BR-IAM-050) |
| Marketing.Engagement.Referrals.CreateEditDelete | Promotions | Referral reward rules, affiliate commission rules, mark commissions payable | Marketing |

MKT reuses native permissions wherever they exist (StandardPermission.Promotions, ContentManagement, Orders, Configuration). New permissions are declared in classes implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager): prefix Marketing.Core for the Platform core plugin (content approval, policy versions, segments) and Marketing.Engagement for the Engagement and loyalty pack plugin (pop-ups, referrals); MKT-002 promotion rules are discount requirement-rule plugins under the native discount permissions. Mapping the native permissions to the roles Marketing, Content and ContentApprover is configuration-pack data (IAM-007). Every role name is in the IAM product role catalogue BR-IAM-050 (Finance, Marketing, Content, ContentApprover); missing catalogue roles are created by the IAM plugin at install and start (BR-IAM-050), and MKT relies on no other role creation. All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-MKT-PERM-01 | **Given** a user without Promotions.DiscountsView / Promotions.DiscountsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-02 | **Given** a user without Orders.GiftCardsView / Orders.GiftCardsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-03 | **Given** a user without Promotions.SubscribersView / SubscribersCreateEditDelete / SubscribersImportExport; Promotions.SubscriptionTypeView / SubscriptionTypeCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-04 | **Given** a user without Promotions.CampaignsView / CampaignsCreateEdit / CampaignsDelete / CampaignsSendEmails (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-05 | **Given** a user without ContentManagement.TopicsView / TopicsCreateEditDelete; BlogView / BlogCreateEditDelete; MenusView / MenusCreateEditDelete (native); News.View / News.Manage (bundled Misc.News plugin, Plugins/Nop.Plugin.Misc.News/NewsDefaults.cs:139-140); Polls.View / Polls.Manage (bundled Misc.Polls plugin, Plugins/Nop.Plugin.Misc.Polls/PollsDefaults.cs:58-59) — the ContentManagement.News* and Polls* names were removed from core in 5.00, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-06 | **Given** a user without Promotions.AffiliatesView / AffiliatesCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-07 | **Given** a user without Configuration.ManageWidgets (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-08 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-09 | **Given** a user without Configuration.ManagePlugins (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-10 | **Given** a user without Marketing.Core.Content.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-11 | **Given** a user without Marketing.Core.PolicyVersions.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-12 | **Given** a user without Marketing.Core.Segments.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-13 | **Given** a user without Marketing.Engagement.Popups.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-14 | **Given** a user without Marketing.Engagement.Popups.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-15 | **Given** a user without Marketing.Engagement.Referrals.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-MKT-PERM-16 | **Given** a user without Marketing.Engagement.Referrals.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-MKT-001 | Discount: DiscountType (OrderTotal, Skus, Categories, Manufacturers, Shipping, OrderSubTotal), UsePercentage/Amount, MaximumDiscountAmount, Start/EndDateUtc, RequiresCouponCode/CouponCode, DiscountLimitation (NTimesOnly, NTimesPerCustomer), IsCumulative, requirement rules (bundled DiscountRules.CustomerRoles). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Discounts/Discount.cs; src/Libraries/Nop.Core/Domain/Discounts/DiscountType.cs; src/Plugins/Nop.Plugin.DiscountRules.CustomerRoles; PG CHK-17] | Conditions beyond customer role need a discount-requirement plugin (see MKT-002). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-002 | MaximumDiscountedQuantity, tier prices, discount requirement framework; only DiscountRules.CustomerRoles bundled (unchanged). New 5.00 price lists (Libraries/Nop.Core/Domain/PriceLists/PriceList.cs: PriceCalculationType PercentageDecrease/Increase, AmountDecrease/Increase, FixedPrice; Start/EndDateUtc; per customer/customer role) give scheduled price adjustments, not BOGO, spend-band or bundle offers. | BOGO / spend-band / bundle discount requirement-rule plugins and cart calculation. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-003 | RewardPointsSettings: Enabled, ExchangeRate, PointsForPurchases_Amount/Points, PurchasesPointsValidity, RegistrationPointsValidity, MinimumRewardPointsToUse, MaximumRewardPointsToUsePerOrder, MaximumRedeemedRate, ActivationDelay; RewardPointsHistory. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Customers/RewardPointsSettings.cs; src/Libraries/Nop.Core/Domain/Customers/RewardPointsHistory.cs; PG ORD-09] | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-004 | Gift cards: Product.IsGiftCard, GiftCardType (Virtual/Physical), GiftCard, GiftCardUsageHistory, admin GiftCardController, cart redemption, GiftCard.Notification template. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/GiftCardType.cs; src/Libraries/Nop.Core/Domain/Orders/GiftCard.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/GiftCardController.cs; PG CHK-17] | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-005 | NewsLetterSubscription with multiple NewsLetterSubscriptionType (new in 4.90; admin NewsLetterSubscriptionTypeController), Campaign by store/customer role/subscription type with scheduled send; bundled Brevo and Omnisend sync. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Messages/Campaign.cs; src/Libraries/Nop.Core/Domain/Messages/NewsLetterSubscriptionType.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/CampaignController.cs; PG CNT-10, ADM-S06] | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-006 | Widget zones and widget plugins exist; no pop-up widget with display rules. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Cms/WidgetSettings.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/WidgetController.cs] | Pop-up widget plugin with rules (page, role, frequency, schedule) and newsletter capture. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-007 | Topics, Blog (core), Menus, Widgets.Swiper, ProductVideo unchanged; News and Polls moved out of core into bundled plugins Misc.News and Misc.Polls (Plugins/Nop.Plugin.Misc.News, Plugins/Nop.Plugin.Misc.Polls); Roxy Fileman replaced by elFinder file manager (Libraries/Nop.Services/Media/elFinder/ElFinderService.cs; Areas/Admin/Controllers/ElFinderController.cs). | Install bundled Misc.News and Misc.Polls plugins. Blog categories as on PG need NT Rich Blog if required (stock blog has tags only); Availability of a 5.00 build of this licensed vendor plugin is not verifiable from source (decision V-01). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-008 | Topic.Published and AvailableStart/EndDateTimeUtc only; no approval or version history. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Topics/Topic.cs] | Approval workflow and version store for topics/policy pages. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-009 | SeoSettings (PageTitleSeparator, CanonicalUrlsEnabled, WwwRequirement, OpenGraphMetaTags, TwitterMetaTags, CustomHeadTags, MicrodataEnabled, GenerateProductMetaDescription), SitemapXmlSettings, RobotsTxtSettings, per-entity slugs and meta fields; AI meta generation (ArtificialIntelligenceSettings.AllowMetaTitleGeneration…). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Seo/SeoSettings.cs; src/Libraries/Nop.Core/Domain/Common/SitemapXmlSettings.cs; src/Libraries/Nop.Core/Domain/Security/RobotsTxtSettings.cs; PG CNT-08] | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-010 | Widgets.GoogleAnalytics (now with EventConsumer.cs) and Widgets.FacebookPixel bundled; CatalogSettings.ShowShareButton/PageShareCode; StoreInformationSettings social links; SeoSettings.CustomHeadTags. New bundled Feed.ChatGptShopping product feed with sync task (Plugins/Nop.Plugin.Feed.ChatGptShopping/Services/ChatGptShoppingSyncTask.cs). | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-011 | CustomerSettings.GenderEnabled, DateOfBirthEnabled, CompanyEnabled…; CustomerAttribute (custom fields e.g. rural/urban, customer type) with AttributeControlType; customer roles. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Customers/CustomerSettings.cs; src/Libraries/Nop.Core/Domain/Customers/CustomerAttribute.cs; src/Libraries/Nop.Core/Domain/Attributes/BaseAttribute.cs] | Native newsletter campaigns target one customer role, not customer attributes; marketing use of segmentation attributes needs a small segment-to-role build (Proposed). Attributes themselves are configured per client. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-012 | New native core reminders (5.00): ReminderSettings.AbandonedCartEnabled (Libraries/Nop.Core/Domain/Reminders/ReminderSettings.cs:13), ProcessAbandonedCartsTask (Libraries/Nop.Services/Reminders/ProcessAbandonedCartsTask.cs:48) sending up to three follow-up emails (REMINDER_ABANDONED_CART_FOLLOW_UP_1..3 message templates with DelayBeforeSend) to registered customers with an email and cart/stash items; admin Reminders page (Presentation/Nop.Web/Areas/Admin/Controllers/ReminderController.cs), permission REMINDERS_MANAGE. Misc.Omnisend and Misc.Brevo still bundled. | Email reminders need no SaaS. SMS reminders are not native: Brevo SaaS (Kenya/Malawi SMS coverage not verified) or a small build on core ISmsService. Guests without an email on the customer record are not selected by the task (query requires Customer.Email). | None (email); Custom plugin if SMS reminders required | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-013 | Affiliate (FriendlyUrlName, Active), affiliate URL tracking to Order.AffiliateId, affiliate order lists in admin, OrderPlaced/OrderPaid.AffiliateNotification. No commission calculation, payout or customer self-referral. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Affiliates/Affiliate.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/AffiliateController.cs; src/Libraries/Nop.Core/Domain/Messages/MessageTemplateSystemNames (OrderPaid.AffiliateNotification)] | Commission/reward rules, payouts, customer referral links with reward points. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-MKT-014 | Vendor default permissions still include Products and Discounts View/Create-edit-delete (Libraries/Nop.Services/Security/DefaultPermissionConfigManager.cs); Discount.VendorId; tier prices with dates. New 5.00 price lists are Administrators-only (PRICE_LISTS_* permissions, DefaultPermissionConfigManager.cs:91). | Approval of vendor promotions, if required, is not native. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-MKT-001 Discounts and coupons

| Item | Value |
|---|---|
| Description (baseline) | Percentage or fixed discounts on products, categories, whole orders or delivery, with coupon codes, dates, usage limits and conditions. |
| Why it matters | Standard promotions without developers. |
| Who benefits | Marketing staff; shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-001-01 | As a member of marketing staff, I want to create percentage or fixed discounts on products, categories, manufacturers, the order subtotal or total, or delivery, with dates, usage limits and conditions, so that I run standard and sitewide promotions without developers. | D; REQ-KTDA-MKT-003; REQ-MPC-FR-062; FC-M01-016 | Ready; conditions: OVR-REG |
| US-MKT-001-02 | As a shopper, I want to enter a promo code in the cart and see the discount, so that I get the advertised offer. | D; REQ-KTDA-MKT-006; REQ-MPC-FR-109 | Ready; conditions: OVR-REG |
| US-MKT-001-03 | As a member of marketing staff, I want promo codes to be validated and every use and change recorded, so that codes cannot be abused and we can trace them. | REQ-MPC-FR-109 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-001-01-01 | US-MKT-001-01 | **Given** a discount "Assigned to categories" of a stated percentage with start and end dates and IsActive on is mapped to category C, **when** a shopper views a product of C between the dates, **then** the discounted price is shown; before the start or after the end the product shows its normal price. | REQ-MPC-FR-062 (category campaign); FC-M01-016; FIT (Discount.StartDateUtc / EndDateUtc / IsActive) |
| AC-MKT-001-01-02 | US-MKT-001-01 | **Given** a discount "Assigned to order subtotal" with no coupon is active for the store, **when** any cart in the store meets its requirements, **then** the discount is applied to the subtotal of every such cart (sitewide campaign). | REQ-MPC-FR-062 (sitewide) |
| AC-MKT-001-01-03 | US-MKT-001-01 | **Given** a discount has a requirement "customer role = R" (bundled DiscountRules.CustomerRoles), **when** a customer outside R reaches the cart, **then** the discount is not applied; a customer in R gets it. | REQ-KTDA-MKT-003; FIT |
| AC-MKT-001-01-04 | US-MKT-001-01 | **Given** a percentage discount has MaximumDiscountAmount M, **when** the computed discount exceeds M, **then** the discount applied equals M. | FIT (Discount.MaximumDiscountAmount) |
| AC-MKT-001-01-05 | US-MKT-001-01 | **Given** two non-cumulative discounts apply to the same item, **when** prices are calculated, **then** only one is applied, chosen by the native preferred-discount rule; cumulative discounts (IsCumulative on) are added together. | FIT (BR-MKT-001) |
| AC-MKT-001-02-01 | US-MKT-001-02 | **Given** a discount requires coupon code K, is active and within its dates, **when** the shopper enters K in the cart discount box (ShoppingCartSettings.ShowDiscountBox on), **then** the code is accepted, the discount line appears in the order totals and is stored on the order. | REQ-KTDA-MKT-006; REQ-MPC-FR-109 |
| AC-MKT-001-02-02 | US-MKT-001-02 | **Given** a code is unknown, expired, inactive or its requirements are not met, **when** the shopper enters it, **then** it is not applied and the native coupon error message is shown. | REQ-MPC-FR-109 (validation) |
| AC-MKT-001-03-01 | US-MKT-001-03 | **Given** a code has limitation "N times only" and N orders already used it, **when** another shopper enters it, **then** it is refused (DiscountService limitation check against DiscountUsageHistory). | REQ-MPC-FR-109; FIT |
| AC-MKT-001-03-02 | US-MKT-001-03 | **Given** a code has limitation "N times per customer", **when** a customer who used it N times enters it again, **then** it is refused; other customers can still use it. | REQ-MPC-FR-109; FIT |
| AC-MKT-001-03-03 | US-MKT-001-03 | **Given** an order with a discount is placed, **when** the order is saved, **then** a DiscountUsageHistory row records discount and order; creating, editing or deleting a discount writes the native activity log entries AddNewDiscount, EditDiscount, DeleteDiscount and the platform audit event AUD-MKT-001. | REQ-MPC-FR-109 (audit trail); FIT |
| AC-MKT-001-03-04 | US-MKT-001-03 | **Given** a code has limitation "N times only", N − 1 uses are recorded and two different customers confirm checkouts with it at the same time, **when** the CHK-003 placement override calls the MKT-001 placement participant (IC-MKT-04, registered through IC-CHK-06), **then** Reserve runs under ILocker key 'mkt-discount-{DiscountId}' and counts DiscountUsageHistory rows plus open DiscountReservation rows: the first checkout gets a reservation; the second is refused with message Mkt.DiscountLimitReached and its order is not placed; when the first sub-order is saved, Confirm ends the reservation (the native placement writes the DiscountUsageHistory row, so MKT writes no second usage row); if payment or placement fails, Release ends it (SM-MKT-08). | REQ-MPC-FR-109; Proposed (BR-CHK-020, IC-CHK-06); FIT (DiscountService NTimesOnly counts DiscountUsageHistory; OrderProcessingService inserts one DiscountUsageHistory row per applied discount) |

**Business rules applied:** BR-MKT-001; BR-MKT-002; BR-MKT-014 (§8.1).


### 7.2 PRD-MKT-002 Advanced promotions

| Item | Value |
|---|---|
| Description (baseline) | More advanced offers such as buy-one-get-one-free, discounts by spending band and bundle offers. |
| Why it matters | Richer promotions to drive sales. |
| Who benefits | Marketing staff; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-002-01 | As a member of marketing staff, I want buy-X-get-Y-free offers (for example buy one get one free), so that we can run richer promotions. | D; REQ-KTDA-MKT-002 | Ready; conditions: OVR-REG |
| US-MKT-002-02 | As a member of marketing staff, I want discounts that grow with the amount spent, in spending bands, so that larger baskets are rewarded. | D; Inference from REQ-KTDA-MKT-002 ("banding" undefined, KG-11) | Ready; conditions: OVR-REG |
| US-MKT-002-03 | As a member of marketing staff, I want bundle offers that apply when all products of a set are bought together, so that we can sell sets. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-002-01-01 | US-MKT-002-01 | **Given** a buy-X-get-Y rule "buy 1, get 1 free" is active on product P and linked to its discount, **when** a shopper has 2 units of P in the cart, **then** one unit is priced at zero; the line subtotal equals the price of one unit and the saving is shown as the line discount. | REQ-KTDA-MKT-002; Proposed (formula BR-MKT-003) |
| AC-MKT-002-01-02 | US-MKT-002-01 | **Given** the same rule, **when** the shopper has 1 unit or 3 units of P, **then** with 1 unit no unit is free; with 3 units one unit is free (free units = floor(quantity / (X + Y)) × Y). | REQ-KTDA-MKT-002; Proposed |
| AC-MKT-002-01-03 | US-MKT-002-01 | **Given** a buy-X-get-Y saving applies to a line, **when** the order is placed, **then** the order line stores the discounted subtotal and discount amount, because cart display, order totals and order placement all use IShoppingCartService.GetSubTotalAsync, whose single override (owner CHK-003, decision OVR-REG) calls the MKT buy-X-get-Y provider (BR-MKT-003). | FIT (OrderProcessingService and OrderTotalCalculationService call GetSubTotalAsync); OVR-REG |
| AC-MKT-002-01-04 | US-MKT-002-01 | **Given** a buy-X-get-Y saving and another non-cumulative discount both apply to the line, **when** prices are calculated, **then** only the larger saving applies. | Proposed |
| AC-MKT-002-02-01 | US-MKT-002-02 | **Given** three non-cumulative "order subtotal" discounts exist, each with a spend-band requirement rule [lower, upper), **when** the cart subtotal falls inside band 2, **then** only the band-2 discount applies. | Inference from REQ-KTDA-MKT-002 (banding = spend bands, KG-11); Proposed (BR-MKT-004) |
| AC-MKT-002-02-02 | US-MKT-002-02 | **Given** the cart subtotal equals the lower bound of band 2, **when** the cart is calculated, **then** band 2 applies (lower bound inclusive, upper bound exclusive). | Proposed |
| AC-MKT-002-03-01 | US-MKT-002-03 | **Given** a bundle requirement rule "all of products A, B, C in the cart" is attached to a discount assigned to A, B and C, **when** the cart holds A, B and C, **then** the discount applies to the three lines; removing any of them removes the discount from all. | D; Proposed (BR-MKT-005) |

**Business rules applied:** BR-MKT-001; BR-MKT-003; BR-MKT-004; BR-MKT-005 (§8.1).


### 7.3 PRD-MKT-003 Reward points

| Item | Value |
|---|---|
| Description (baseline) | Customers earn points when they buy and spend them on later purchases, with expiry dates and limits. |
| Why it matters | Rewards loyal customers. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-003-01 | As a shopper, I want to earn points when I buy and spend them on later purchases, so that I am rewarded for loyalty. | D; REQ-KTDA-MKT-002 | Ready |
| US-MKT-003-02 | As a member of marketing staff, I want to set the earning rate, value, limits and validity of points, so that the programme fits our budget. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-003-01-01 | US-MKT-003-01 | **Given** RewardPointsSettings.Enabled is on with PointsForPurchases_Amount and PointsForPurchases_Points set, and the order total is at least MinOrderTotalToAwardPoints, **when** the order status becomes Complete, **then** points are added to the customer's RewardPointsHistory, valid until the date given by PurchasesPointsValidity and usable after ActivationDelay. | REQ-KTDA-MKT-002; FIT (OrderProcessingService awards points when the order becomes Complete) |
| AC-MKT-003-01-02 | US-MKT-003-01 | **Given** points were awarded for an order, **when** the order is cancelled, **then** the awarded points are reduced (native ReduceRewardPointsAsync). | FIT |
| AC-MKT-003-01-03 | US-MKT-003-01 | **Given** the customer has a usable balance of at least MinimumRewardPointsToUse, **when** the customer chooses to use points at checkout, **then** points up to MaximumRewardPointsToUsePerOrder and within MaximumRedeemedRate are applied at ExchangeRate as an amount off the order total. | REQ-KTDA-MKT-002; FIT |
| AC-MKT-003-01-04 | US-MKT-003-01 | **Given** points have passed their end date, **when** the customer checks out, **then** they are not usable and do not count in the balance. | FIT (RewardPointsHistory.EndDateUtc) |
| AC-MKT-003-01-05 | US-MKT-003-01 | **Given** the customer opens My account, **when** reward points are enabled, **then** the balance and history with dates and messages are shown. | FIT |
| AC-MKT-003-02-01 | US-MKT-003-02 | **Given** an administrator changes the reward points settings, **when** the change is saved, **then** new awards and redemptions follow the new values; existing history is unchanged; the change is audited (AUD-MKT-002). | D; Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.4 PRD-MKT-004 Gift cards and vouchers

| Item | Value |
|---|---|
| Description (baseline) | Physical or digital gift cards and vouchers that customers buy and redeem. |
| Why it matters | Gift sales and promotions. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: GC-CONC |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-004-01 | As a shopper, I want to buy a virtual or physical gift card for someone, so that I can give a gift. | D | Ready; conditions: GC-CONC |
| US-MKT-004-02 | As a shopper, I want to redeem a gift card or voucher code at checkout, so that I can pay with it. | D; REQ-MPC-FR-109 | Ready; conditions: GC-CONC |
| US-MKT-004-03 | As a member of marketing staff, I want to issue vouchers and see where each was used, so that vouchers are validated and traceable. | REQ-MPC-FR-109 | Ready; conditions: GC-CONC |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-004-01-01 | US-MKT-004-01 | **Given** a product is a gift card (Product.IsGiftCard, GiftCardType Virtual), **when** an order for it is placed, **then** a GiftCard with a unique coupon code and the amount is created per unit; it is activated when the order is Complete if OrderSettings.ActivateGiftCardsAfterCompletingOrder is on, otherwise by staff; the recipient receives GiftCard.Notification. | D; FIT |
| AC-MKT-004-01-02 | US-MKT-004-01 | **Given** a physical gift card is ordered, **when** the order is shipped, **then** the card is activated per the same setting. | FIT |
| AC-MKT-004-02-01 | US-MKT-004-02 | **Given** an activated gift card with a remaining amount, **when** the shopper enters its code (ShoppingCartSettings.ShowGiftCardBox on), **then** the remaining amount, up to the order total, is deducted; after the order is placed a GiftCardUsageHistory row records the used amount. | REQ-MPC-FR-109; FIT |
| AC-MKT-004-02-02 | US-MKT-004-02 | **Given** a gift card is not activated or has no remaining amount, **when** the shopper enters its code, **then** it is not applied and the native gift card error message is shown. | REQ-MPC-FR-109 (validation); FIT (GiftCardService.IsGiftCardValidAsync) |
| AC-MKT-004-02-03 | US-MKT-004-02 | **Given** an order paid partly by gift card is cancelled and OrderSettings.DeleteGiftCardUsageHistory is on, **when** the cancellation completes, **then** the usage history row is deleted and the amount is available again. | FIT |
| AC-MKT-004-03-01 | US-MKT-004-03 | **Given** a user with Orders.GiftCardsCreateEditDelete, **when** creates a voucher (gift card) with amount and code in admin, **then** it is usable once activated, and its usage history lists each order and amount; changes are audited (AUD-MKT-001). | REQ-MPC-FR-109 (audit trail) |

**Business rules applied:** BR-MKT-002 (§8.1).


### 7.5 PRD-MKT-005 Newsletter and email campaigns

| Item | Value |
|---|---|
| Description (baseline) | Manage newsletter subscribers and send email campaigns to chosen groups. |
| Why it matters | Keeps customers engaged. |
| Who benefits | Marketing staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, MSG-ROUTE, OPTOUT-SCOPE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-005-01 | As a shopper, I want to subscribe to the newsletter types I choose and unsubscribe at any time, so that I get only the news I want. | D | Ready; conditions: OVR-REG, MSG-ROUTE, OPTOUT-SCOPE |
| US-MKT-005-02 | As a member of marketing staff, I want to send email campaigns to chosen groups, at a chosen time, so that customers stay engaged. | D; REQ-KTDA-MKT-004 | Ready; conditions: OVR-REG, MSG-ROUTE, OPTOUT-SCOPE |
| US-MKT-005-03 | As a member of marketing staff, I want subscribers synchronised with Omnisend if we use it, so that we can use its campaign tools. | D | Ready; conditions: OVR-REG, MSG-ROUTE, OPTOUT-SCOPE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-005-01-01 | US-MKT-005-01 | **Given** CustomerSettings.NewsletterEnabled is on, **when** a visitor subscribes with an email, **then** an inactive subscription is created and the activation email NewsLetterSubscription.ActivationMessage is sent; the subscription becomes Active only after the link is followed (SM-MKT-07). | D; FIT (NewsletterController) |
| AC-MKT-005-01-02 | US-MKT-005-01 | **Given** several subscription types exist (NewsLetterSubscriptionType), **when** the visitor subscribes, **then** the visitor can choose the types; types marked TickedByDefault are pre-selected. | FIT |
| AC-MKT-005-01-03 | US-MKT-005-01 | **Given** an active subscriber with NewsletterBlockAllowToUnsubscribe on, **when** asks to unsubscribe from the newsletter block and follows the link in the deactivation email (NewsLetterSubscription.DeactivationMessage), **then** the subscription is removed and no further campaigns are sent to that email. | D; FIT (NewsletterController.SubscriptionActivation with active = false) |
| AC-MKT-005-02-01 | US-MKT-005-02 | **Given** a campaign has subject, body, store, customer role, subscription type and DontSendBeforeDateUtc, **when** marketing staff send it, **then** one queued email per active subscriber matching store, role and type is created and is not sent before the date. | REQ-KTDA-MKT-004; FIT (Campaign) |
| AC-MKT-005-02-02 | US-MKT-005-02 | **Given** a campaign is drafted, **when** staff send a test email to an address, **then** only that address receives it. | REQ-KTDA-MKT-004; FIT (CampaignController.SendTestEmail) |
| AC-MKT-005-03-01 | US-MKT-005-03 | **Given** Misc.Omnisend is configured with the client's API key (OmnisendSettings.ApiKey), **when** a visitor subscribes or unsubscribes, or staff run the contact synchronisation from the configuration page, **then** the Omnisend event consumer (EmailSubscribedEvent, EmailUnsubscribedEvent) creates or updates the contact with its status, and the configuration-page action SyncContacts sends all contacts in batches. | D; FIT (Omnisend EventConsumer; OmnisendAdminController.SyncContacts) |
| AC-MKT-005-03-02 | US-MKT-005-03 | **Given** a client instance with TRK-005 installed, **when** the plugin list is checked, **then** Misc.Brevo is not installed, because its BrevoMessageService replaces IWorkflowMessageService (NopStartup Order 3000), which TRK-005 owns (BR-TRK-021). | OVR-REG; FIT (Misc.Brevo NopStartup) |
| AC-MKT-005-03-03 | US-MKT-005-03 | **Given** a user without Configuration.ManagePlugins (for example a vendor, who has admin panel access), **when** opens the Omnisend configuration page, **then** Withdrawn (VER-500): now native — every Configure action of OmnisendAdminController (GET, save, sync-contacts, sync-products) carries [CheckPermission(Configuration.ManagePlugins)] in 5.00.1 (Plugins/Nop.Plugin.Misc.Omnisend/Controllers/OmnisendAdminController.cs:73, 89, 124, 137); no MKT action filter is built; verified by AC-MKT-005-03-04. | VER-500; FIT (5.00.1: Plugins/Nop.Plugin.Misc.Omnisend/Controllers/OmnisendAdminController.cs:73-137) |
| AC-MKT-005-03-04 | US-MKT-005-03 | **Given** a vendor user (Vendors hold admin-panel access) without Configuration.ManagePlugins, **when** they open or post any Omnisend configuration action (configure, save, contact synchronisation, product synchronisation), **then** access is denied natively by [CheckPermission(Configuration.ManagePlugins)] and nothing changes (BR-MKT-013). | VER-500; FIT (5.00.1: Plugins/Nop.Plugin.Misc.Omnisend/Controllers/OmnisendAdminController.cs:73, 89, 124, 137) |

**Business rules applied:** BR-MKT-012; BR-MKT-013; BR-MKT-015 (§8.1).


### 7.6 PRD-MKT-006 On-site pop-ups

| Item | Value |
|---|---|
| Description (baseline) | Pop-up boxes on the site for promotions or newsletter sign-up, shown under rules the client sets. |
| Why it matters | Draws attention to offers. |
| Who benefits | Marketing staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-006-01 | As a member of marketing staff, I want to show pop-ups for promotions under rules I set (pages, customer role, schedule, frequency, language), so that offers get attention without annoying shoppers. | D; REQ-KTDA-MKT-005 | Ready; conditions: OVR-REG |
| US-MKT-006-02 | As a shopper, I want to subscribe to the newsletter from a pop-up, so that I can sign up quickly. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-006-01-01 | US-MKT-006-01 | **Given** a pop-up is Active with schedule S and page rule "home page and category pages", **when** a shopper opens a matching page within S, **then** the pop-up is rendered by the MKT widget in zone body_end_html_tag_before; it is not rendered on other pages or outside S. | REQ-KTDA-MKT-005 |
| AC-MKT-006-01-02 | US-MKT-006-01 | **Given** a pop-up is limited to customer role R, **when** a customer outside R opens a matching page, **then** it is not shown. | REQ-KTDA-MKT-005 |
| AC-MKT-006-01-03 | US-MKT-006-01 | **Given** a pop-up has frequency "once per N days per visitor" (N is a setting), **when** the visitor closes it, **then** it is not shown to that visitor again until N days have passed. | REQ-KTDA-MKT-005; Proposed |
| AC-MKT-006-01-04 | US-MKT-006-01 | **Given** a pop-up has content in the default language only, **when** a shopper using another language opens a matching page, **then** the default-language content is shown (Proposed fallback). | Proposed |
| AC-MKT-006-01-05 | US-MKT-006-01 | **Given** a pop-up is shown, **when** the shopper uses the keyboard, **then** the pop-up can be closed with the Escape key and its close button is reachable by Tab (NFR-X-005). | Proposed |
| AC-MKT-006-01-06 | US-MKT-006-01 | **Given** the MKT pop-up widget is mapped in the SEC-007 widget-category map to a cookie category the visitor has not accepted, **when** a matching page is rendered, **then** the pop-up is not rendered, because the SEC-007 IWidgetPluginManager override does not load the widget (BR-SEC-020). | Proposed; OVR-REG |
| AC-MKT-006-02-01 | US-MKT-006-02 | **Given** a pop-up contains a newsletter form, **when** the shopper submits an email, **then** the native subscription flow runs (inactive subscription and activation email); message Mkt.PopupSubscribed is shown. | D; FIT |

**Business rules applied:** BR-MKT-006; BR-MKT-012 (§8.1).


### 7.7 PRD-MKT-007 Content management

| Item | Value |
|---|---|
| Description (baseline) | Create and edit web pages, blog posts, news, banners and policy pages with pictures and video, without developers. Includes simple polls for customers. |
| Why it matters | The client keeps the site's content up to date itself. |
| Who benefits | Content staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-007-01 | As a member of content staff, I want to create and edit web pages, blog posts, news, polls and menus with pictures and video, so that the client keeps the site up to date itself. | D; REQ-KTDA-CNT-001; REQ-MPC-FR-313 | Ready |
| US-MKT-007-02 | As a member of content staff, I want to manage home-page banners, so that offers and campaigns are visible. | D; REQ-MPC-FR-313 | Ready |
| US-MKT-007-03 | As a client administrator, I want to publish the policy pages and legal notices (privacy, terms, shipping, returns, complaints), so that shoppers can read the rules. | REQ-MPC-FR-306 | Ready |
| US-MKT-007-04 | As a shopper, I want to read FAQ and help pages, so that I find answers myself. | REQ-MPC-FR-255 | Ready |
| US-MKT-007-05 | As a client administrator, I want to publish onboarding content and training material for users, so that new users get started. | REQ-MPC-FR-325 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-007-01-01 | US-MKT-007-01 | **Given** a user with ContentManagement.TopicsCreateEditDelete, **when** creates a topic with rich text, pictures uploaded through the editor, an embedded video, a URL name and Published on, **then** the page is available at its URL in the stores and roles it is limited to; with Published off it is not found. | REQ-KTDA-CNT-001; REQ-MPC-FR-313 (publish / unpublish); FIT (Topic) |
| AC-MKT-007-01-02 | US-MKT-007-01 | **Given** a topic has AvailableStartDateTimeUtc and AvailableEndDateTimeUtc, **when** a shopper opens it outside that window, **then** it is not shown. | REQ-MPC-FR-313; FIT |
| AC-MKT-007-01-03 | US-MKT-007-01 | **Given** a blog post (for example a farmer story or factory information) with pictures and start and end dates, **when** a shopper opens the blog, **then** the post is listed only between its dates. | REQ-KTDA-CNT-001; FIT (BlogPost.StartDateUtc / EndDateUtc) |
| AC-MKT-007-01-04 | US-MKT-007-01 | **Given** a news item (announcement) with Published on and start and end dates, **when** a shopper opens the news list, **then** it is listed only while published and between its dates; with Published off it is hidden. | REQ-MPC-FR-313 (announcements); FIT (5.00.1: news is the bundled plugin Misc.News, installed only if a client uses news; NewsItem.Published, Plugins/Nop.Plugin.Misc.News/Domain/NewsItem.cs:36) |
| AC-MKT-007-01-05 | US-MKT-007-01 | **Given** a customer service charter is created as a topic and linked from a menu (native menus), **when** a shopper opens the menu, **then** the charter page opens. | REQ-MPC-FR-313 (charter); FIT (Menu) |
| AC-MKT-007-01-06 | US-MKT-007-01 | **Given** the bundled Misc.Polls plugin is installed and a poll is published, **when** a registered shopper votes, **then** the vote is counted once per customer. | D; FIT (5.00.1: polls are the bundled plugin Misc.Polls, Plugins/Nop.Plugin.Misc.Polls/Domain/Poll.cs, PollVotingRecord.cs) |
| AC-MKT-007-02-01 | US-MKT-007-02 | **Given** the bundled Widgets.Swiper is active, **when** content staff add a slide with picture, title, alternative text and link, **then** the slide appears in the home-page slider; deleting it removes it. | REQ-MPC-FR-313 (banners); FIT (Swiper slide add / delete) |
| AC-MKT-007-03-01 | US-MKT-007-03 | **Given** topics PrivacyInfo, ConditionsOfUse and ShippingInfo exist natively, and topics for returns and complaints are created per client, **when** the footer and checkout are shown, **then** links to each policy page are shown; the conditions-of-use acceptance in checkout opens the ConditionsOfUse topic. | REQ-MPC-FR-306; FIT (InstallRequiredData topics) |
| AC-MKT-007-04-01 | US-MKT-007-04 | **Given** FAQ topics are published and grouped in a help menu with IncludeInSitemap on, **when** a shopper opens the help menu, **then** each FAQ page opens and is listed in the sitemap. | REQ-MPC-FR-255; FIT |
| AC-MKT-007-05-01 | US-MKT-007-05 | **Given** onboarding topics are published with ACL for the Registered role, **when** a newly registered customer opens My account, **then** links to the onboarding content are shown. | REQ-MPC-FR-325; Proposed (placement) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.8 PRD-MKT-008 Content approval and policy versioning

| Item | Value |
|---|---|
| Description (baseline) | New content and policy pages need approval before going live, and each version of a policy is kept. |
| Why it matters | Prevents mistakes on public pages and keeps a legal record of policies. |
| Who benefits | Content and legal staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-008-01 | As a content approver, I want new and changed pages, announcements and blog posts to need my approval before they go live, so that mistakes do not reach public pages. | D; REQ-MPC-FR-313 | On hold: WF-ENG |
| US-MKT-008-02 | As a member of legal staff, I want each published version of a policy kept with its effective date, and earlier versions readable, so that we have a legal record of our policies. | D; REQ-MPC-FR-306 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-008-01-01 | US-MKT-008-01 | **Given** approval is enabled for content type Topic and a user without Marketing.Core.Content.Approve, **when** saves an edit of a published topic (Admin TopicController.Edit [POST]), **then** the MKT action filter stores the posted content (all languages) as a ContentRevision PendingApproval and does not change the live topic; message Mkt.ContentSubmitted is shown. | REQ-MPC-FR-313; FIT (TopicController.Edit takes TopicModel) |
| AC-MKT-008-01-02 | US-MKT-008-01 | **Given** a revision is PendingApproval, **when** an approver who is not its author approves, **then** the revision is applied through ITopicService.UpdateTopicAsync and the localized values through ILocalizedEntityService; the revision becomes Approved; audited (AUD-MKT-003). | REQ-MPC-FR-313 |
| AC-MKT-008-01-03 | US-MKT-008-01 | **Given** a revision is PendingApproval, **when** the approver rejects it with a reason, **then** it becomes Rejected; the author sees the reason and can edit and resubmit. | REQ-MPC-FR-313 |
| AC-MKT-008-01-04 | US-MKT-008-01 | **Given** the author of a revision, **when** tries to approve it, **then** approval is refused with message Mkt.SelfApprovalNotAllowed (BR-MKT-007). | REQ-MPC-FR-313; Proposed |
| AC-MKT-008-01-05 | US-MKT-008-01 | **Given** approval is enabled and a user without approval rights creates a topic, news item or blog post, **when** the create form is saved, **then** no live item is created; the content is held as a PendingApproval revision and the item is created through the native service (InsertTopicAsync, the Misc.News plugin NewsService.InsertNewsAsync, InsertBlogPostAsync) only on approval, because BlogPost has no published flag. | REQ-MPC-FR-313; FIT (BlogPost has StartDateUtc / EndDateUtc only); Proposed |
| AC-MKT-008-02-01 | US-MKT-008-02 | **Given** a topic is flagged as a policy (for example PrivacyInfo, ConditionsOfUse, ShippingInfo, returns, complaints, VendorTermsOfService), **when** a revision of it is approved with an effective date, **then** a PolicyVersion is created with the policy system name, the next version number, effective date, the "re-acceptance required" flag set by the approver, full content in every language and approver; it becomes Effective on that date and the previous version Superseded (SM-MKT-02). | REQ-MPC-FR-306; Proposed (re-acceptance flag) |
| AC-MKT-008-02-02 | US-MKT-008-02 | **Given** a PolicyVersion becomes Effective, **when** the status is saved, **then** MKT publishes the event Policy.VersionPublished (policy system name, version number, effective date, re-acceptance required); IAM-016 reads the version and the flag through IC-MKT-03 and runs the re-acceptance prompt, for seller terms (SEL-006) as well, only when the flag is set; no other module keeps a re-acceptance flag (decision ONE-RECORD). | Proposed; ONE-RECORD |
| AC-MKT-008-01-06 | US-MKT-008-01 | **Given** approval is enabled for topics and a topic is flagged as a knowledge-base article (CRM-007), **when** an editor without Marketing.Core.Content.Approve saves a new or changed article, **then** it is held as a PendingApproval revision, is not visible to shoppers until approved, and the approver cannot be its author (BR-MKT-007). | see CRM-007 (REQ-MPC-FR-273); Proposed |
| AC-MKT-008-02-03 | US-MKT-008-02 | **Given** policy versions exist, **when** a user with Marketing.Core.PolicyVersions.View opens the history, **then** all versions are listed with number, effective date, approver, and each can be read in full. | REQ-MPC-FR-306 |
| AC-MKT-008-02-04 | US-MKT-008-02 | **Given** a PolicyVersion exists, **when** anyone tries to edit or delete it, **then** it cannot be changed; corrections are new versions (BR-MKT-008). | REQ-MPC-FR-306; Proposed |
| AC-MKT-008-02-05 | US-MKT-008-02 | **Given** a policy version becomes Effective, **when** an acceptance is recorded (IAM-016 for customers, SEL-006 for seller terms, both through IC-IAM-05), **then** the IAM acceptance record stores that version number read through IC-MKT-03; MKT keeps no acceptance records (decision ONE-RECORD). | D; ONE-RECORD; Proposed |

**Business rules applied:** BR-MKT-007; BR-MKT-008 (§8.1).


### 7.9 PRD-MKT-009 SEO

| Item | Value |
|---|---|
| Description (baseline) | Search-engine-friendly page addresses, page titles and descriptions, a sitemap and the other technical settings that help Google and social media show the shop properly. |
| Why it matters | More visitors from search engines. |
| Who benefits | Marketing staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-009-01 | As a member of marketing staff, I want search-friendly page addresses, titles and descriptions for every page, so that more visitors come from search engines. | D; REQ-KTDA-SEO-001; REQ-KTDA-SEO-002 | Ready |
| US-MKT-009-02 | As a member of marketing staff, I want a sitemap, robots file, canonical addresses and structured data, so that search engines index the shop correctly. | D; REQ-KTDA-SEO-003 | Ready |
| US-MKT-009-03 | As a member of marketing staff, I want correct previews when pages are shared on social media, so that shared links look right. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-009-01-01 | US-MKT-009-01 | **Given** a product, category, manufacturer, topic, blog post or news item has a URL name (UrlRecord) and meta title, description and keywords, **when** its page is requested, **then** the URL uses the name and the page head contains the meta title (with SeoSettings.PageTitleSeparator) and description. | REQ-KTDA-SEO-001; FIT (SeoSettings, ISlugSupported, IMetaTagsSupported) |
| AC-MKT-009-01-02 | US-MKT-009-01 | **Given** SeoSettings.GenerateProductMetaDescription is on and a product has no meta description, **when** the product page is requested, **then** a meta description generated from the product short description is used. | REQ-KTDA-SEO-002; FIT |
| AC-MKT-009-01-03 | US-MKT-009-01 | **Given** ArtificialIntelligenceSettings.Enabled and AllowMetaTitleGeneration / AllowMetaDescriptionGeneration are on (AI provider per AI module), **when** staff ask for generated meta text in admin, **then** the text is generated for review and saved only when staff save. | REQ-KTDA-SEO-002; FIT |
| AC-MKT-009-02-01 | US-MKT-009-02 | **Given** SitemapXmlSettings.SitemapXmlEnabled is on with the entity types to include, **when** /sitemap.xml is requested, **then** it lists the URLs of the included types; robots.txt is served from RobotsTxtSettings. | REQ-KTDA-SEO-003; FIT |
| AC-MKT-009-02-02 | US-MKT-009-02 | **Given** SeoSettings.CanonicalUrlsEnabled is on and WwwRequirement is set, **when** a page is requested with or without www, **then** the canonical link tag is present and the request is redirected to the required host form. | REQ-KTDA-SEO-003; FIT |
| AC-MKT-009-02-03 | US-MKT-009-02 | **Given** SeoSettings.MicrodataEnabled is on, **when** a product page is requested, **then** structured product data is included. | REQ-KTDA-SEO-003; FIT |
| AC-MKT-009-02-04 | US-MKT-009-02 | **Given** several languages are active and LocalizationSettings.SeoFriendlyUrlsForLanguagesEnabled is on, **when** a page is requested in a language, **then** the URL carries the language code and each language version is indexable. | REQ-KTDA-SEO-003; FIT |
| AC-MKT-009-03-01 | US-MKT-009-03 | **Given** SeoSettings.OpenGraphMetaTags and TwitterMetaTags are on, **when** a product page is shared, **then** Open Graph and Twitter tags with title, description and picture are present. | D; FIT |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.10 PRD-MKT-010 Marketing tags and social

| Item | Value |
|---|---|
| Description (baseline) | Connects marketing measurement tools (such as Google Analytics, Google Ads and Facebook Pixel) and adds social sharing buttons and links. |
| Why it matters | Measures marketing and makes sharing easy. |
| Who benefits | Marketing staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-010-01 | As a member of marketing staff, I want to connect Google Analytics, advertising tags and the Facebook Pixel, so that marketing can be measured. | D | Ready; conditions: OVR-REG |
| US-MKT-010-02 | As a shopper, I want to share products on social media and find the client's social pages, so that I can recommend the shop. | D; REQ-MPC-INT-003 | Ready; conditions: OVR-REG |
| US-MKT-010-03 | As a member of marketing staff, I want campaign data collected for the marketing performance dashboard, so that campaign results can be compared. | Inference from REQ-KTDA-ANL-006 (the dashboard needs campaign data) | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-010-01-01 | US-MKT-010-01 | **Given** the bundled Widgets.GoogleAnalytics is active with GoogleId and EnableEcommerce on, **when** a shopper browses and completes an order, **then** the Google tag is on every storefront page and ecommerce events are sent as the bundled plugin defines. | D; FIT (GoogleAnalyticsSettings) |
| AC-MKT-010-01-02 | US-MKT-010-01 | **Given** the bundled Widgets.FacebookPixel is configured, **when** a shopper browses, **then** the pixel and its configured events are rendered. | D; FIT |
| AC-MKT-010-01-03 | US-MKT-010-01 | **Given** another advertising tag (for example a Google Ads tag) is entered in SeoSettings.CustomHeadTags, **when** any storefront page is requested, **then** the tag is in the page head on every page, whatever the visitor's cookie choice, because CustomHeadTags is rendered by _Root.Head.cshtml and not through a widget (BR-MKT-012 allows it only where the country profile needs no consent for it). | D; FIT (_Root.Head.cshtml AppendHeadCustomParts) |
| AC-MKT-010-01-04 | US-MKT-010-01 | **Given** Widgets.GoogleAnalytics, Widgets.FacebookPixel and the Misc.Omnisend tracking widget are mapped in the SEC-007 widget-category map to the analytics or marketing category, and the profile requires consent (SEC-012), **when** a visitor who has not accepted that category opens a page, **then** the tag widgets are not rendered until consent is given, because the SEC-007 IWidgetPluginManager override does not load them (BR-SEC-020, BR-MKT-012). | Proposed; OVR-REG |
| AC-MKT-010-02-01 | US-MKT-010-02 | **Given** CatalogSettings.ShowShareButton is on with PageShareCode, **when** a shopper opens a product page, **then** share buttons are shown. | REQ-MPC-INT-003; FIT |
| AC-MKT-010-02-02 | US-MKT-010-02 | **Given** StoreInformationSettings FacebookLink, TwitterLink, YoutubeLink and InstagramLink are set, **when** any storefront page is shown, **then** the footer shows the social links. | REQ-MPC-INT-003; FIT |
| AC-MKT-010-03-01 | US-MKT-010-03 | **Given** Google Analytics ecommerce is on and campaign links carry UTM parameters, **when** an order results from a campaign link, **then** the order revenue is attributed to the campaign in Google Analytics, available to the RPT-011 dashboard. | Inference from REQ-KTDA-ANL-006 |

**Business rules applied:** BR-MKT-012; BR-MKT-015 (§8.1).


### 7.11 PRD-MKT-011 Customer segmentation attributes

| Item | Value |
|---|---|
| Description (baseline) | Records customer details such as gender, age group, rural or urban location and customer type, for targeting and reporting. |
| Why it matters | Better-targeted marketing and inclusion reporting. |
| Who benefits | Marketing staff; management |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-011-01 | As a client administrator, I want to record customer gender, age, rural or urban location and buyer type, and seller type, so that we can target marketing and report on inclusion. | D; REQ-MPC-FR-316 | Ready |
| US-MKT-011-02 | As a member of marketing staff, I want to target campaigns and discounts at a segment defined by these attributes, so that marketing reaches the right customers. | REQ-MPC-FR-316 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-011-01-01 | US-MKT-011-01 | **Given** CustomerSettings.GenderEnabled and DateOfBirthEnabled are on, **when** a customer registers or edits the profile, **then** gender and date of birth are captured (age is derived from date of birth). | REQ-MPC-FR-316; FIT |
| AC-MKT-011-01-02 | US-MKT-011-01 | **Given** customer attributes "location type" (rural / urban) and "buyer type" are configured as drop-downs, **when** a customer registers, **then** the values are captured and stored with the customer (native custom customer attributes). | REQ-MPC-FR-316; FIT (CustomerAttribute) |
| AC-MKT-011-01-03 | US-MKT-011-01 | **Given** a vendor attribute "seller size" (for example SME) is configured, **when** a seller applies or edits the profile, **then** the value is stored with the vendor. | REQ-MPC-FR-316 ("seller type SMEs"); FIT (VendorAttribute) |
| AC-MKT-011-02-01 | US-MKT-011-02 | **Given** a segment rule "location type = rural and buyer type = farmer" is saved with target role "Segment: rural farmers", **when** the segment task runs, **then** customers matching the rule are in that customer role and customers no longer matching are removed (BR-MKT-009). | REQ-MPC-FR-316; Proposed |
| AC-MKT-011-02-02 | US-MKT-011-02 | **Given** a segment role exists, **when** a campaign or a discount requirement (DiscountRules.CustomerRoles) uses it, **then** only customers of the segment receive the campaign or the discount. | REQ-MPC-FR-316; FIT (Campaign.CustomerRoleId) |

**Business rules applied:** BR-MKT-009 (§8.1).


### 7.12 PRD-MKT-012 Abandoned-cart recovery

| Item | Value |
|---|---|
| Description (baseline) | Sends a reminder by email or SMS to customers who left items in their cart without buying. |
| Why it matters | Recovers lost sales. |
| Who benefits | Marketing staff |
| Phase | P2 |
| Implementation | Configuration — None (email); Custom plugin if SMS reminders required |
| Depends on | PRD-TRK-005 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-012-01 | As a member of marketing staff, I want customers who left items in the cart to get an email or SMS reminder, so that lost sales are recovered. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-012-01-01 | US-MKT-012-01 | **Given** Misc.Omnisend is configured with tracking on, **when** a shopper with a known email leaves a cart, **then** Withdrawn (VER-500): now native — abandoned-cart e-mail reminders are sent by the core reminder task (ReminderSettings.AbandonedCartEnabled, Libraries/Nop.Core/Domain/Reminders/ReminderSettings.cs:13; ProcessAbandonedCartsTask, Libraries/Nop.Services/Reminders/ProcessAbandonedCartsTask.cs:48-156); Omnisend is no longer needed for MKT-012; verified by AC-MKT-012-01-04 to AC-MKT-012-01-06. | VER-500; FIT (5.00.1) |
| AC-MKT-012-01-02 | US-MKT-012-01 | **Given** the shopper has not given marketing consent where the data-protection profile requires it, **when** the shopper leaves a cart, **then** no reminder is sent to that shopper (BR-MKT-012): the native reminder task has no consent check, so the TRK-005 engine, which every reminder template reaches (BR-TRK-020), suppresses it under the marketing category of the Reminders.AbandonedCartFollowUp1 to 3 definitions and logs it Suppressed. | Proposed; FIT (5.00.1: ProcessAbandonedCartsTask selects on cart dates and e-mail only, Libraries/Nop.Services/Reminders/ProcessAbandonedCartsTask.cs:74-85) |
| AC-MKT-012-01-03 | US-MKT-012-01 | **Given** a client instance, **when** the abandoned-cart set-up is checked, **then** Misc.Brevo is not installed and no Brevo marketing automation or Brevo SMS is used, because Brevo replaces IWorkflowMessageService, which TRK-005 owns (BR-TRK-021). | OVR-REG; FIT (Misc.Brevo NopStartup) |
| AC-MKT-012-01-04 | US-MKT-012-01 | **Given** ReminderSettings.AbandonedCartEnabled is on and the templates Reminders.AbandonedCartFollowUp1, 2 and 3 are active with a DelayBeforeSend, **when** a registered customer with an e-mail address has shopping-cart or saved-for-later items and has not changed the cart for longer than the first delay, **then** the native reminder task sends follow-up 1, then follow-up 2 and 3 after their delays counted from the previous follow-up, with no reminder for a cart changed before ReminderSettings.ProcessingStartDateUtc; an inactive template stops the sequence at that step. | VER-500; FIT (5.00.1: Libraries/Nop.Services/Reminders/ProcessAbandonedCartsTask.cs:48-156; Libraries/Nop.Core/Domain/Messages/MessageTemplateSystemNames.cs:307-317) |
| AC-MKT-012-01-05 | US-MKT-012-01 | **Given** a follow-up template is triggered by the reminder task, **when** it is sent, **then** it passes through the TRK-005 engine like any native template (SendNotificationAsync), so TRK-006 preferences, the BR-MKT-012 consent rule and any SMS variant of its definition apply, and it is logged in TRK-007. | VER-500; see TRK-005; FIT (5.00.1: Libraries/Nop.Services/Messages/WorkflowMessageService.cs:2953-2990) |
| AC-MKT-012-01-06 | US-MKT-012-01 | **Given** a user with Promotions.ManageReminders (native since 5.00), **when** they open the admin Reminders page and change the abandoned-cart switch or a follow-up template, **then** the change is saved for the store; a user without the permission is refused. | VER-500; FIT (5.00.1: Presentation/Nop.Web/Areas/Admin/Controllers/ReminderController.cs:58-107; Libraries/Nop.Services/Security/StandardPermission.cs:96) |

**Business rules applied:** BR-MKT-012; BR-MKT-015 (§8.1).


### 7.13 PRD-MKT-013 Affiliates and referrals

| Item | Value |
|---|---|
| Description (baseline) | Partners or customers share special links and earn rewards for the sales they bring. |
| Why it matters | Lets existing customers and partners bring in new customers, with each referral tracked. |
| Who benefits | Marketing staff; affiliates |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-013-01 | As a member of marketing staff, I want partners to share tracked links and see the orders they bring, so that partner sales are tracked. | D | Ready |
| US-MKT-013-02 | As a registered customer, I want to share my referral link and earn reward points when a new customer buys, so that I am rewarded for recommending the shop. | D | Ready |
| US-MKT-013-03 | As a member of marketing staff, I want commission rules for affiliates and a record of what is payable, so that partners are rewarded correctly. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-013-01-01 | US-MKT-013-01 | **Given** an affiliate is Active with FriendlyUrlName, **when** a visitor arrives with ?affiliate=<name> or ?affiliateid=<id>, **then** the visitor's Customer.AffiliateId is set; orders placed carry Order.AffiliateId and appear in the affiliate's order list; OrderPlaced.AffiliateNotification and OrderPaid.AffiliateNotification are sent if active. | D; FIT (NopAffiliateDefaults query parameters) |
| AC-MKT-013-02-01 | US-MKT-013-02 | **Given** referrals are enabled and customer A has a referral link, **when** a new customer B registers through it (CustomerRegisteredEvent), **then** a referral A → B is Registered (SM-MKT-04). | D; Proposed |
| AC-MKT-013-02-02 | US-MKT-013-02 | **Given** a referral is Registered, **when** B's first order reaches Complete, **then** the referral becomes Qualified and A receives the configured points through IRewardPointService.AddRewardPointsHistoryEntryAsync; the referral becomes Rewarded. | D; Proposed |
| AC-MKT-013-02-03 | US-MKT-013-02 | **Given** B uses the same email, phone or device identifier as A, **when** B registers through A's link, **then** the referral is Void and no points are awarded (BR-MKT-010). | Proposed |
| AC-MKT-013-03-01 | US-MKT-013-03 | **Given** an affiliate commission rule (percentage of order subtotal) exists, **when** an affiliate order is paid, **then** a commission is Accrued; it becomes Payable when the hold period passes without refund, and Reversed if the order is refunded first (SM-MKT-05). | D; Proposed |
| AC-MKT-013-03-02 | US-MKT-013-03 | **Given** commissions are Payable, **when** finance staff pay them (through PAY-024 Payout or offline), **then** they become Paid with the payment reference. | D |

**Business rules applied:** BR-MKT-010 (§8.1).


### 7.14 PRD-MKT-014 Seller-managed pricing and promotions

| Item | Value |
|---|---|
| Description (baseline) | Sellers set their own base prices, discounts and promotional prices with start and end dates. |
| Why it matters | Sellers run their own shop within the marketplace. |
| Who benefits | Sellers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-MKT-014-01 | As a seller, I want to set my base prices and promotional prices with start and end dates, so that I run my own shop within the marketplace. | D; REQ-MPC-FR-061 | Ready |
| US-MKT-014-02 | As a seller, I want to create my own discounts with dates, so that I can run promotions on my products. | D; REQ-MPC-FR-061 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-MKT-014-01-01 | US-MKT-014-01 | **Given** a seller user has the native vendor product rights, **when** the seller edits the price of an own product, **then** the price is saved; products of other sellers are not visible or editable (native vendor scoping). | REQ-MPC-FR-061; FIT (Vendors default Catalog.ProductsCreateEditDelete) |
| AC-MKT-014-01-02 | US-MKT-014-01 | **Given** the seller adds a tier price with StartDateTimeUtc and EndDateTimeUtc, **when** a shopper buys within the window, **then** the tier price applies; outside the window the base price applies. | REQ-MPC-FR-061; FIT (TierPrice) |
| AC-MKT-014-02-01 | US-MKT-014-02 | **Given** a seller user creates a discount, **when** it is saved, **then** VendorId is set to the seller (native Create POST), the type is "Assigned to SKUs", and it applies to the seller's mapped products between its start and end dates. | REQ-MPC-FR-061; FIT (5.00.1: Discount.VendorId; Admin DiscountController.Create sets VendorId and DiscountType.AssignedToSkus for vendor users, Presentation/Nop.Web/Areas/Admin/Controllers/DiscountController.cs:114-123) |
| AC-MKT-014-02-02 | US-MKT-014-02 | **Given** a seller user posts a discount with another type, or adds a product of another seller to a discount, **when** the POST is made (Admin DiscountController Create / Edit / ProductAddPopup), **then** Withdrawn (VER-500): now native — in 5.00.1 the Create and Edit POST actions force DiscountType.AssignedToSkus for vendor users (DiscountController.cs:118-123, 182-183) and ProductAddPopup refuses another vendor's discount and skips other vendors' products (DiscountController.cs:495-506); no MKT action filter is built (BR-MKT-011); verified by AC-MKT-014-02-04. | VER-500; FIT (5.00.1: Presentation/Nop.Web/Areas/Admin/Controllers/DiscountController.cs:114-206, 487-512) |
| AC-MKT-014-02-03 | US-MKT-014-02 | **Given** a discount of seller V, **when** another seller opens or edits it, **then** access is refused (native GetCurrentVendorAsync check in DiscountController). | FIT |
| AC-MKT-014-01-03 | US-MKT-014-01 | **Given** a seller changes a price or discount, **when** it is saved, **then** the change is recorded in the platform audit trail (AUD-MKT-004). | Proposed (NFR-X-003) |
| AC-MKT-014-02-04 | US-MKT-014-02 | **Given** a seller user posts a discount with another type, adds a product of another seller to an own discount, or posts products to another seller's discount, **when** the POST is made (Admin DiscountController Create / Edit / ProductAddPopup), **then** the native action saves the discount as "Assigned to SKUs" with the seller's VendorId, skips the other seller's product, and refuses the other seller's discount ("This is not your discount"); nothing outside the seller's scope changes (BR-MKT-011). | VER-500; REQ-MPC-FR-061; FIT (5.00.1: Presentation/Nop.Web/Areas/Admin/Controllers/DiscountController.cs:114-123, 176-183, 487-506) |

**Business rules applied:** BR-MKT-011 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-MKT-001 | Native discount evaluation is used unchanged: active flag, dates, coupon code, limitation, requirement groups, maximum amount and quantity, and the native preferred-discount choice when discounts are not cumulative. The only change is the buy-X-get-Y subtotal (BR-MKT-003). MKT registers no IPriceCalculationService or IOrderTotalCalculationService override (owner CAT-042, decision OVR-REG); native discounts come last in the price precedence of BR-CAT-020. | MKT-001, MKT-002 | FIT (DiscountService, ShoppingCartService); OVR-REG |
| BR-MKT-002 | Every redemption of a promo code or gift card is recorded natively (DiscountUsageHistory, GiftCardUsageHistory); every change to a discount or gift card is in the activity log and the platform audit trail. | MKT-001, MKT-004 | REQ-MPC-FR-109; FIT |
| BR-MKT-003 | Buy-X-get-Y: for a qualifying line, free units = floor(quantity / (X + Y)) × Y, priced at zero. MKT implements it as a provider called by the single IShoppingCartService override owned by CHK-003 (decision OVR-REG), inside GetSubTotalAsync, the single path used by cart display, order totals and order placement; MKT registers no override of its own. The native GetShoppingCartItemUnitPriceEvent is not used, because consumer exceptions are swallowed and it sets a unit price only. | MKT-002 | REQ-KTDA-MKT-002; FIT (ShoppingCartService.GetSubTotalAsync callers; EventPublisher); OVR-REG; Proposed (formula) |
| BR-MKT-004 | Spend bands are separate non-cumulative order-subtotal discounts, each with a band requirement rule [lower, upper); at most one band applies. | MKT-002 | Inference from REQ-KTDA-MKT-002 (KG-11); Proposed |
| BR-MKT-005 | A bundle discount applies only while every product of its set is in the cart; it is assigned to the set's products. | MKT-002 | D; Proposed |
| BR-MKT-006 | A pop-up is shown only if every rule matches (page, role, store, language, schedule, frequency); newsletter capture uses the native subscription with activation email. | MKT-006 | REQ-KTDA-MKT-005; Proposed |
| BR-MKT-007 | When approval is enabled for a content type, a change by a user without Marketing.Core.Content.Approve becomes a revision and takes effect only when another user approves it; approval is enforced by an MKT action filter on the admin create and edit POST actions of the type (TopicController Create / Edit, BlogController BlogPostCreate / BlogPostEdit, and — only where the bundled Misc.News plugin is installed — the plugin controller NewsAdminController NewsItemCreate / NewsItemEdit, which replaced the core admin NewsController in 5.00). | MKT-008 | REQ-MPC-FR-313; FIT (these POST actions take TopicModel, BlogPostModel and the plugin NewsItemModel; 5.00.1: Plugins/Nop.Plugin.Misc.News/Admin/Controllers/NewsAdminController.cs:177, 226, [CheckPermission(News.Manage)]); Proposed |
| BR-MKT-008 | Policy versions are immutable; every approved change to a policy topic creates a new version with an effective date; acceptance records refer to a version number. | MKT-008 | REQ-MPC-FR-306; Proposed |
| BR-MKT-009 | Segment roles are maintained only by the segment task from the segment rule; manual changes to their membership are overwritten at the next run. | MKT-011 | Proposed |
| BR-MKT-010 | A referral reward is given once per referred customer, after the first order is Complete, and never when the referred customer matches the referrer by email, phone or device identifier. | MKT-013 | Proposed |
| BR-MKT-011 | A vendor discount always has VendorId = the current vendor and type "Assigned to SKUs", and can be mapped only to that vendor's products. Since nopCommerce 5.00 this is enforced natively by Admin DiscountController Create, Edit and ProductAddPopup [POST] for vendor users; MKT builds no action filter for it (VER-500) and removes its entry from the ADM extension register (BR-ADM-006). | MKT-014 | REQ-MPC-FR-061; FIT (5.00.1: Presentation/Nop.Web/Areas/Admin/Controllers/DiscountController.cs:114-123, 176-183, 487-506) |
| BR-MKT-012 | Marketing tags, contact synchronisation and abandoned-cart reminders respect the consent rules of the country data-protection profile. Every analytics or marketing widget plugin (Widgets.GoogleAnalytics, Widgets.FacebookPixel, Misc.Omnisend, the MKT pop-up widget) is mapped to a cookie category in the SEC-007 widget-category map before go-live; unmapped non-necessary widgets are not allowed. Consent gating of widgets is done by the SEC-007 IWidgetPluginManager override (BR-SEC-020), not by MKT. A tag that needs consent is never put in SeoSettings.CustomHeadTags, which is not gated. | MKT-005, MKT-006, MKT-010, MKT-012 | NFR-X-002; OVR-REG; FIT (_Root.Head.cshtml); Proposed |
| BR-MKT-013 | The Omnisend configuration page requires Configuration.ManagePlugins. Since nopCommerce 5.00 the bundled OmnisendAdminController enforces it natively on every Configure action, so MKT builds no action filter for it (VER-500) and removes its entry from the ADM extension register (BR-ADM-006). Misc.Brevo is not installed (decision OVR-REG; BR-TRK-021). | MKT-005 | FIT (5.00.1: Plugins/Nop.Plugin.Misc.Omnisend/Controllers/OmnisendAdminController.cs:73, 89, 124, 137); OVR-REG |
| BR-MKT-014 | "N times only" limits are checked natively against usage history in the cart; because the placement lock that the CHK-003 IOrderProcessingService override reproduces once per checkout is per customer, the limit is also guarded at placement by the MKT-001 participant (IC-MKT-04 through IC-CHK-06): Reserve counts recorded uses plus open reservations under ILocker key 'mkt-discount-{DiscountId}' and refuses when the limit would be exceeded; Confirm ends the reservation once the native placement has written the usage row; Release or expiry ends it without a use. It is a placement participant, not a validator. | MKT-001 | FIT (DiscountService limitation check; OrderProcessingService named mutex per customer; OrderProcessingService inserts DiscountUsageHistory); Proposed (BR-CHK-020) |
| BR-MKT-015 | MKT plugins (Platform core part and Engagement and loyalty pack): (a) check feature state through IC-PLT-02 IsEnabled (setting productfeature.<prd-id>, store then shared) before showing a page or widget or running a scheduled task for a store; (b) list every new setting key in the plugin key catalogue with key, type, layer, secret flag and default; (c) flag as secret the credentials of the bundled plugins MKT configures: GoogleAnalyticsSettings.ApiSecret and OmnisendSettings.ApiKey; the Facebook Pixel AccessToken is held in the plugin table FacebookPixelConfiguration, not in settings, and is never put in a configuration pack; (d) list every MKT action filter (since 5.00: the content-approval filter of BR-MKT-007 only) and provider registration (IC-MKT-01 as IC-CHK-05, IC-MKT-04 as IC-CHK-06) in the ADM extension register (BR-ADM-001); (e) register the MKT event codes (names Proposed, listed in BR-TRK-023: Mkt.Core.ContentRevisionPending, Mkt.Core.ContentRevisionDecided, Mkt.Core.ReferralRewarded) through IC-TRK-04 RegisterEventCode at installation and send them only through IC-TRK-04 SendEvent; TRK-006 preferences and opt-outs apply (MSG-ROUTE). | MKT-001, MKT-002, MKT-005, MKT-006, MKT-008, MKT-010, MKT-012, MKT-013 | Proposed; FIT (GoogleAnalyticsSettings, OmnisendSettings, FacebookPixelConfiguration); NFR-X-008 |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-MKT-01 | ContentRevision | (none) | non-approver saves create or edit | approval enabled for the type | PendingApproval | live item unchanged; a new item is not created until approval |
| SM-MKT-01 | ContentRevision | PendingApproval | approve | approver is not the author | Approved | applied through the native service; AUD-MKT-003; policy topic: new PolicyVersion |
| SM-MKT-01 | ContentRevision | PendingApproval | reject with reason | — | Rejected | author notified |
| SM-MKT-01 | ContentRevision | Rejected | author edits and resubmits | — | PendingApproval | — |
| SM-MKT-02 | PolicyVersion | (none) | policy revision approved with future effective date | — | Scheduled | — |
| SM-MKT-02 | PolicyVersion | (none) / Scheduled | effective date reached (or approved with immediate effect) | — | Effective | previous Effective version becomes Superseded |
| SM-MKT-02 | PolicyVersion | Effective | newer version becomes Effective | — | Superseded | kept read-only |
| SM-MKT-03 | Popup | (none) | created | — | Draft | — |
| SM-MKT-03 | Popup | Draft / Inactive | activate | — | Active | shown within schedule |
| SM-MKT-03 | Popup | Active | deactivate | — | Inactive | not shown |
| SM-MKT-03 | Popup | Active | schedule end passed | — | Expired | not shown |
| SM-MKT-04 | Referral | (none) | referred customer registers through link | — | Registered | — |
| SM-MKT-04 | Referral | (none) / Registered | self-referral detected | BR-MKT-010 | Void | no reward |
| SM-MKT-04 | Referral | Registered | first order of referred customer Complete | — | Qualified | — |
| SM-MKT-04 | Referral | Qualified | points added to referrer | — | Rewarded | RewardPointsHistory entry |
| SM-MKT-05 | AffiliateCommission | (none) | affiliate order paid | commission rule exists | Accrued | — |
| SM-MKT-05 | AffiliateCommission | Accrued | hold period passed without refund | — | Payable | — |
| SM-MKT-05 | AffiliateCommission | Accrued / Payable | order refunded | — | Reversed | — |
| SM-MKT-05 | AffiliateCommission | Payable | paid | — | Paid | payment reference stored |
| SM-MKT-06 | GiftCard (native) | not activated | order Complete with ActivateGiftCardsAfterCompletingOrder, or staff activate | — | activated | GiftCard.Notification to recipient |
| SM-MKT-06 | GiftCard (native) | activated | order cancelled with DeactivateGiftCardsAfterCancellingOrder, or staff deactivate | — | not activated | cannot be redeemed |
| SM-MKT-08 | DiscountReservation | (none) | Reserve (IC-MKT-04) at placement | recorded uses + open reservations < LimitationTimes | Reserved | — |
| SM-MKT-08 | DiscountReservation | Reserved | Confirm (sub-order saved) | — | Confirmed | native DiscountUsageHistory row exists for the order |
| SM-MKT-08 | DiscountReservation | Reserved | Release (payment or placement failed, or a later participant refused) | — | Released | no use counted |
| SM-MKT-08 | DiscountReservation | Reserved | reservation expiry reached (BR-CHK-020 setting) | — | Expired | no use counted |
| SM-MKT-07 | NewsLetterSubscription (native) | (none) | visitor subscribes | — | Inactive | activation email |
| SM-MKT-07 | NewsLetterSubscription (native) | Inactive | activation link followed | — | Active | receives campaigns |
| SM-MKT-07 | NewsLetterSubscription (native) | Active | unsubscribe requested from the newsletter block | NewsletterBlockAllowToUnsubscribe on | Active | deactivation email with link |
| SM-MKT-07 | NewsLetterSubscription (native) | Active / Inactive | deactivation link followed | — | (removed) | subscription deleted |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| Discount, DiscountRequirement, DiscountUsageHistory (native) | Native fields (type, percentage or amount, maximum amount, dates, coupon, cumulative, limitation, maximum discounted quantity, IsActive, VendorId) | MKT-001, MKT-002, MKT-014 | Reused unchanged |
| DiscountReservation (new) | DiscountId, CustomerId, CheckoutSessionId, OrderId (on Confirm), Status (SM-MKT-08), CreatedOnUtc, ExpiresOnUtc | MKT-001 | Open reservations count against "N times only" with DiscountUsageHistory (BR-MKT-014) |
| BuyXGetYRule (new) | DiscountId, ProductIds, BuyQuantity (X), GetQuantity (Y) | MKT-002 | Linked to a native discount for dates, activity and limits |
| SpendBand / BundleSet rule settings (new) | Requirement Id, LowerBound, UpperBound / ProductIds | MKT-002 | Stored as requirement-rule settings |
| RewardPointsHistory (native) | CustomerId, StoreId, Points, PointsBalance, UsedAmount, Message, CreatedOnUtc, EndDateUtc, ValidPoints, UsedWithOrder | MKT-003, MKT-013 | Reused |
| GiftCard, GiftCardUsageHistory (native) | Amount, IsGiftCardActivated, GiftCardCouponCode, recipient and sender, usage per order | MKT-004 | Reused; no expiry field |
| NewsLetterSubscription, NewsLetterSubscriptionType, Campaign (native) | Subscription: email, active, store, language, type; Campaign: subject, body, store, customer role, subscription type, DontSendBeforeDateUtc | MKT-005 | Reused |
| Popup (new) | Name, Content (localized), PageRules, RoleIds, StoreIds, StartsOnUtc, EndsOnUtc, FrequencyDays, HasNewsletterForm, Status (SM-MKT-03) | MKT-006 | Rendered by an MKT widget plugin |
| Topic, BlogPost, Menu, MenuItem (native); NewsItem (bundled Misc.News plugin), Poll (bundled Misc.Polls plugin) | Native and plugin fields | MKT-007 | Reused |
| ContentRevision (new) | EntityType, EntityId, BaseVersionStamp, Payload (all languages), AuthorId, Status (SM-MKT-01), ApproverId, Reason, CreatedOnUtc, DecidedOnUtc | MKT-008 | |
| PolicyVersion (new) | TopicId, SystemName, VersionNo, EffectiveFromUtc, ReacceptanceRequired, Content (all languages), ApprovedBy, Status (SM-MKT-02) | MKT-008 | Read by IAM-016 and SEL-006 (IC-MKT-03) |
| SegmentRule (new) | Name, Conditions (customer attribute, gender, age band, role), TargetCustomerRoleId, IsActive, LastRunUtc | MKT-011 | Target is a native CustomerRole marked system-managed |
| Referral / ReferralCode (new) | Code: CustomerId, Code; Referral: ReferrerId, ReferredCustomerId, Status (SM-MKT-04), QualifyingOrderId, PointsAwarded | MKT-013 | |
| AffiliateCommissionRule / AffiliateCommission (new) | Rule: AffiliateId or all, Percentage, HoldDays; Commission: AffiliateId, OrderId, Amount, Status (SM-MKT-05), PaymentReference | MKT-013 | Native Affiliate, Order.AffiliateId reused |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Content pages, policies, topics | Topic, BlogPost, NewsItem (in 5.00 an entity of the Misc.News plugin); policy versions | vertical → client → store | MKT-007 / MKT-008 | Core |
| Discount and promotion defaults | Discount templates | vertical → client | MKT-001 | Core |
| Customer attributes and checkout attributes | CustomerAttribute, CheckoutAttribute | vertical → client → store | MKT-011 / CHK-015 | Core |
| Further core setting groups | captchasettings.*, gdprsettings.*, multifactorauthenticationsettings.*, rewardpointssettings.*, localizationsettings.*, storeinformationsettings.* | global → client → store | SEC-013 / SEC-007 / IAM-004 / MKT-003 / PLT-009 / PLT-006 | Core |
| Engagement and loyalty pack settings | Reward-point rules, promotion types, pop-ups, abandoned-cart timing (5.00: remindersettings.*, native e-mail reminders), affiliates, recurring cycles | vertical (Engagement pack) → client → store | MKT-002 / MKT-003 / MKT-012 / ORD-028 | Engagement and loyalty pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Discount box and gift card box in cart | ShoppingCartSettings.ShowDiscountBox, ShowGiftCardBox (native) | client → store | Not stated | Not stated |
| Reward points programme | RewardPointsSettings.Enabled, ExchangeRate, PointsForPurchases_Amount, PointsForPurchases_Points, PurchasesPointsValidity, MinimumRewardPointsToUse, MaximumRewardPointsToUsePerOrder, MaximumRedeemedRate, MinOrderTotalToAwardPoints, ActivationDelay (native) | client → store | Loyalty rewards (MKT-002); values not stated (KG-11) | Not stated |
| Gift card activation and cancellation | OrderSettings.ActivateGiftCardsAfterCompletingOrder, DeactivateGiftCardsAfterCancellingOrder, DeleteGiftCardUsageHistory (native) | client | Not stated | Not stated |
| Newsletter | CustomerSettings.NewsletterEnabled, HideNewsletterBlock, NewsletterBlockAllowToUnsubscribe (native); subscription types | client → store | Email campaigns (MKT-004) | Not stated |
| Omnisend | OmnisendSettings (ApiKey — secret, UseTracking) (bundled plugin, optional); Misc.Brevo not installed (OVR-REG) | client instance only | Not stated | Not stated |
| Abandoned-cart reminders | ReminderSettings.AbandonedCartEnabled (native since 5.00); message templates Reminders.AbandonedCartFollowUp1 to 3 (IsActive, DelayBeforeSend, DelayPeriod) | client → store | Not stated | Not stated |
| Pop-ups | Popup (new); MKT widget in WidgetSettings.ActiveWidgetSystemNames (native) | client → store | Pop-ups (MKT-005) | Not stated |
| Content types requiring approval | MKT settings (new) | client | Not stated | Approval workflow (FR-313) |
| Policy topics under versioning | MKT settings (new) | client | Not stated | Version control (FR-306) |
| SEO | SeoSettings (PageTitleSeparator, GenerateProductMetaDescription, CanonicalUrlsEnabled, WwwRequirement, OpenGraphMetaTags, TwitterMetaTags, CustomHeadTags, MicrodataEnabled); SitemapXmlSettings; RobotsTxtSettings; LocalizationSettings.SeoFriendlyUrlsForLanguagesEnabled (native) | client → store | SEO (SEO-001 to 003) | Not stated |
| AI meta text | ArtificialIntelligenceSettings.Enabled, AllowMetaTitleGeneration, AllowMetaDescriptionGeneration, AllowMetaKeywordsGeneration (native) | client | Not stated | Not stated |
| Marketing tags | GoogleAnalyticsSettings.GoogleId, EnableEcommerce (bundled); Widgets.FacebookPixel (bundled, configuration in plugin table); SeoSettings.CustomHeadTags (only tags that need no consent, BR-MKT-012) | client → store | Google Ads, social (MKT-001 service) | Not stated |
| Share buttons and social links | CatalogSettings.ShowShareButton, PageShareCode; StoreInformationSettings.FacebookLink, TwitterLink, YoutubeLink, InstagramLink (native) | client → store | Not stated | Social plug-ins (INT-003) |
| Cookie category of each marketing widget | SEC-007 widget-category map (StoreInformationSettings.DisplayEuCookieLawWarning stays off; SEC-007 banner) | client → store | Not stated | Not stated |
| Google Analytics 4 property and export route to the warehouse | GoogleAnalyticsSettings.GoogleId, ApiSecret (secret) (bundled); export route Not stated (RPT) | client | Not stated | Not stated |
| Customer segmentation fields | CustomerSettings.GenderEnabled, DateOfBirthEnabled (native); CustomerAttribute (native); SegmentRule (new) | vertical → client | Not stated | Buyer type, gender, age, rural / urban, seller type (FR-316) |
| Referral and affiliate rules | MKT settings, AffiliateCommissionRule (new) | client | — | — |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Cart discount box and gift card box; reward points at checkout | MKT-001, MKT-003, MKT-004 | Native |
| Storefront | Newsletter block and subscription types; pop-ups | MKT-005, MKT-006 | Native block; new pop-up widget |
| Storefront | Pages, blog, news, polls, menus, banners, policy pages, FAQ | MKT-007 | Native |
| Storefront — My account | Reward points; referral link and status | MKT-003, MKT-013 | Native page; new referral tab |
| Admin | Discounts (with buy-X-get-Y, spend-band and bundle rules) | MKT-001, MKT-002 | Native page + requirement-rule plugins |
| Admin | Gift cards; reward points settings | MKT-003, MKT-004 | Native |
| Admin | Subscribers, subscription types, campaigns | MKT-005 | Native |
| Admin | Pop-ups | MKT-006 | New |
| Admin | Topics, blog, news, polls, menus, Swiper widget | MKT-007 | Native |
| Admin | Content approval queue; policy version history | MKT-008 | New |
| Admin | SEO, sitemap, robots, widgets (Google Analytics, Facebook Pixel) | MKT-009, MKT-010 | Native |
| Admin | Customer attributes; segment rules | MKT-011 | Native + new |
| Admin | Affiliates; referral and commission rules; commissions | MKT-013 | Native + new |
| Seller portal | Own products and tier prices; own discounts | MKT-014 | Native vendor-scoped pages, MKT filter |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Mkt.ContentSubmitted | Your change was saved for approval. It will be published when it is approved. | AC-MKT-008-01-01 |
| Mkt.SelfApprovalNotAllowed | You cannot approve your own change. | AC-MKT-008-01-04 |
| Mkt.PopupSubscribed | Thank you. Please check your email to confirm your subscription. | AC-MKT-006-02-01 |
| Mkt.DiscountLimitReached | This promo code has reached its usage limit. Your order was not placed; please remove the code and try again. | AC-MKT-001-03-04, IC-MKT-04 |
| Mkt.VendorDiscountScope | You can create discounts only for your own products. | AC-MKT-014-02-02 — Withdrawn (VER-500): key not installed, the native actions enforce the scope |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Native messages (coupon and gift card errors, newsletter activation) are native locale resources and are not redefined.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Google Analytics (MKT-010) | Tag and ecommerce events | Google | Bundled Widgets.GoogleAnalytics |
| Facebook Pixel (MKT-010) | Pixel events | Meta | Bundled Widgets.FacebookPixel |
| Omnisend (MKT-005, optional) | Contact and product sync, cart events | Omnisend SaaS | Bundled Misc.Omnisend; the only bundled marketing SaaS that may be used (Misc.Brevo not installed, OVR-REG); not needed for MKT-012 since 5.00 |
| Google Analytics 4 to warehouse (MKT-010, RPT-002, RPT-011) | Visits, behaviour, campaign traffic | Google (export route not stated) | RPT owns the extract (IC-RPT-01); route Not stated in source |
| AI provider (MKT-009) | Meta text generation | Per AI module | Native ArtificialIntelligenceSettings |
| Payouts of affiliate commissions (MKT-013) | IC-PAY-01 Payout | PAY-024 adapters | Optional; offline otherwise |
| Policy versions (MKT-008) | IC-MKT-03 | IAM-016, SEL-006 (internal) | |
| Cart subtotal (MKT-002) | IC-MKT-01 as IC-CHK-05 line subtotal adjuster | CHK-003 IShoppingCartService override (internal) | |
| Limited-use discounts at placement (MKT-001) | IC-MKT-04 as IC-CHK-06 placement participant | CHK-003 IOrderProcessingService override (internal) | |
| Consent gating (MKT-006, MKT-010, MKT-012) | Widget-category map | SEC-007 IWidgetPluginManager override (internal) | |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-MKT-01 | Discount requirement rules (SpendBand, BundleSet) | DiscountRequirementValidationRequest (DiscountRequirementId, Customer, Store); rule settings | Valid / not valid | — | IDiscountRequirementRule plugin (pattern: bundled DiscountRules.CustomerRoles) |
| IC-MKT-01 | Buy-X-get-Y subtotal (MKT provider → called by CHK-003) | ShoppingCartItem, includeDiscounts | subTotal, discountAmount, appliedDiscounts, maximumDiscountQty | — | Implements the CHK-003 line subtotal adjuster IC-CHK-05, called by the CHK-003 IShoppingCartService override after the native GetSubTotalAsync with the native result (decision OVR-REG); MKT registers no override |
| IC-MKT-02 | Content revision handler per type (Topic, NewsItem, BlogPost) | Posted admin model | Revision stored; on approval applied | Concurrent change of the live item (revision based on an old version is refused) | Action filter on Admin TopicController / NewsController / BlogController create and edit POST; apply through ITopicService / the Misc.News plugin NewsService (INewsService was removed from core in 5.00; Plugins/Nop.Plugin.Misc.News/Services/NewsService.cs:17) / IBlogService and ILocalizedEntityService |
| IC-MKT-04 | Limited-use discount participant: Reserve / Confirm / Release (MKT provider → called by CHK-003) | Reserve: applied discounts of the checkout with limitation "N times only", customer, checkout session; Confirm: reservation, saved order; Release: reservation, reason | Reserve: reservation reference, or refusal with message Mkt.DiscountLimitReached; Confirm and Release: done | — | Implements the CHK-003 placement participant contract IC-CHK-06 (BR-CHK-020); Reserve runs under ILocker key 'mkt-discount-{DiscountId}'; the native placement writes DiscountUsageHistory |
| IC-MKT-03 | GetEffectivePolicyVersion (IAM-016, SEL-006, CHK-009 → MKT) | Topic system name, time | Policy system name, version number, effective date, re-acceptance required flag, content | No version (policy not under versioning) | MKT service |
| IC-MKT-03 | Policy.VersionPublished (published) | Policy system name, version number, effective date, re-acceptance required flag | — | — | Plugin event class published with IEventPublisher when a PolicyVersion becomes Effective; IAM-016 consumer only refreshes the current version for its re-acceptance filter |

C# signatures are produced at L2 build start and approved by the tech lead; this table fixes the operations, owners and nopCommerce mapping.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Order completed | OrderStatusChangedEvent (native; reward points are awarded inside OrderProcessingService, not by MKT) | MKT-003 (native), MKT-013 consumer enqueues referral qualification |
| Order paid / refunded | OrderPaidEvent, OrderRefundedEvent (native) — consumers only enqueue commission accrual or reversal | MKT-013 |
| Customer registered | CustomerRegisteredEvent (native) — consumer records the referral | MKT-013 |
| Email subscribed / unsubscribed | EmailSubscribedEvent, EmailUnsubscribedEvent (native; consumed by bundled Omnisend) | MKT-005 Omnisend contact sync |
| Cart changed | EntityInsertedEvent / EntityDeletedEvent<ShoppingCartItem> (consumed by bundled Omnisend and, since 5.00, Widgets.GoogleAnalytics) | MKT-005 (Omnisend, optional), MKT-010; MKT-012 reads Customer.LastShoppingCartUpdateDateUtc through the native reminder task |
| Content revision approved | None (MKT service event) | MKT-008 policy version |
| Policy version effective | Policy.VersionPublished (MKT plugin event, IC-MKT-03) | IAM-016 re-acceptance filter; SEL-006 seller re-acceptance |
| Segment task, pop-up schedule, commission hold | IScheduleTask (MKT tasks under ILocker) | MKT-006, MKT-011, MKT-013 |
| Content approval gate; vendor discount scope; plugin configuration gate | Action filters on admin POST / GET actions (not events) | MKT-008, MKT-014, MKT-005 |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two shoppers use the last allowed use of an "N times only" code at the same time | MKT-001 | IC-MKT-04 Reserve under ILocker key 'mkt-discount-{DiscountId}' inside the CHK-003 placement (IC-CHK-06); the second placement is refused with Mkt.DiscountLimitReached (BR-MKT-014) |
| Two orders redeem the same gift card at the same time | MKT-004 | The native placement lock is per customer, so a gift card code shared between customers can be over-redeemed; no participant is specified for gift cards (decision GC-CONC) |
| A topic is edited live by an approver while a revision of it is pending | MKT-008 | The revision stores the version stamp of the item it was based on; approval is refused if the live item changed since (IC-MKT-02 error) and the author must rebase |
| Segment task runs while a campaign is being queued | MKT-011, MKT-005 | The segment task runs under ILocker key 'mkt-segment-{RuleId}'; the campaign uses role membership at the time of queuing (native) |
| Referral qualification event delivered twice | MKT-013 | Referral status checked before awarding (Qualified → Rewarded only once) |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Gift card issued | Recipient | Email (native GiftCard.Notification) | MKT-004 |
| Newsletter subscription activation / deactivation | Subscriber | Email (native templates) | MKT-005 |
| Campaign | Subscribers of the target | Email (native queued email) | MKT-005 |
| Abandoned cart reminder | Shopper | Native e-mail templates Reminders.AbandonedCartFollowUp1 to 3 through the TRK-005 engine (an SMS variant may be added to the definition) | MKT-012 |
| Affiliate order placed / paid | Affiliate | Email (native OrderPlaced / OrderPaid.AffiliateNotification) | MKT-013 |
| Content revision pending / decided | Approver / author | Admin notification + email through TRK-005 (IC-TRK-04 SendEvent, MKT event code; BR-MKT-015 e) | MKT-008 |
| Referral rewarded | Referrer | Email through TRK-005 (IC-TRK-04 SendEvent, MKT event code) | MKT-013 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Discount usage per discount and code | MKT-001 | REQ-MPC-FR-109; native DiscountUsageHistory |
| Gift card usage | MKT-004 | REQ-MPC-FR-109 |
| Pop-up impressions and sign-ups | MKT-006 | Proposed |
| Policy version history | MKT-008 | REQ-MPC-FR-306 |
| Affiliate orders and commissions; referrals | MKT-013 | D |
| Campaign performance dashboard | RPT-011 (not MKT) | REQ-KTDA-ANL-006 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-MKT-001 | Discount or gift card created, changed, deleted | Marketing staff / seller | Discount, GiftCard | old and new values |
| AUD-MKT-002 | Reward points, SEO, newsletter, tag or plugin settings changed | Administrator | Setting | old and new values |
| AUD-MKT-003 | Content revision submitted, approved, rejected; policy version created | Content staff / approver | ContentRevision, PolicyVersion | entity, version, decision, reason |
| AUD-MKT-004 | Seller price, tier price or discount changed | Seller | Product, TierPrice, Discount | old and new values |
| AUD-MKT-005 | Segment rule changed; segment membership run | Marketing staff / system | SegmentRule | rule, members added and removed (counts) |
| AUD-MKT-006 | Referral reward and affiliate commission status change | System / marketing staff | Referral, AffiliateCommission | status, amount, reference |

Business audit events AUD-MKT-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id; old and new entity values are captured by the SEC IRepository<> decorator and need no call. All MKT writes, including applying an approved revision through ITopicService / INewsService / IBlogService, go through IRepository<>; MKT does not write through INopDataProvider directly. Native activity log entries (AddNewDiscount, EditDiscount, DeleteDiscount) remain but are not the audit record. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-MKT-001 | Marketing tags and contact synchronisation follow the consent rules of the country data-protection profile. | NFR-X-002; Proposed | AC-MKT-010-01-04; AC-MKT-012-01-02; T-MKT-08 |
| NFR-MKT-002 | Pop-ups are accessible (keyboard close, focus) and do not block the page for screen-reader users. | NFR-X-005 (keyboard and screen-reader support) | AC-MKT-006-01-05 |
| NFR-MKT-003 | Every promotion, voucher, content and policy change is audited (NFR-X-003). | REQ-MPC-FR-109; REQ-MPC-FR-306 | §14.2 audit events |
| NFR-MKT-004 | Page-weight impact of tags and pop-ups and storefront performance targets: Not stated in source — requires confirmation. | NFR-X-006; NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-MKT-001 | P1 | — | |
| PRD-MKT-002 | P1 | — | |
| PRD-MKT-003 | P1 | — | |
| PRD-MKT-004 | P1 | — | |
| PRD-MKT-005 | P1 | — | |
| PRD-MKT-006 | P1 | — | |
| PRD-MKT-007 | P1 | — | |
| PRD-MKT-008 | P1 | PRD-ADM-002 | |
| PRD-MKT-009 | P1 | — | |
| PRD-MKT-010 | P1 | — | |
| PRD-MKT-011 | P1 | — | |
| PRD-MKT-012 | P2 | PRD-TRK-005 | |
| PRD-MKT-013 | P2 | — | |
| PRD-MKT-014 | P1 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-MKT-01 | Promotions: buy-X-get-Y, spend bands and bundles give the same totals in cart, checkout summary and stored order lines; native discounts are unchanged when no MKT rule applies. |
| T-MKT-02 | Coupon limits: "N times only" and "N times per customer" under sequential and concurrent orders (documents BR-MKT-014 behaviour). |
| T-MKT-03 | Content approval: non-approver edits never change the live page; approval applies all languages; stale revisions are refused. |
| T-MKT-04 | Policy versions: history immutable; IAM acceptance records (IC-IAM-05, for customers and seller terms) store the effective version number; IC-MKT-03 returns the re-acceptance flag. |
| T-MKT-05 | Vendor discount scope (native since 5.00): forged POSTs (other type, other seller's product, other seller's discount) are corrected, skipped or refused by the native actions; vendors cannot open the Omnisend configuration (native); Misc.Brevo is absent from every client instance. |
| T-MKT-08 | Consent: with analytics and marketing categories not accepted, no Google Analytics, Facebook Pixel, Omnisend or pop-up widget output is rendered; CustomHeadTags holds no tag that needs consent. |
| T-MKT-06 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-MKT-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
