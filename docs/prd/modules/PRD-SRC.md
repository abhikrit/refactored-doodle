# L2 Module PRD — SRC: Search, discovery and merchandising

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | SRC — Search, discovery and merchandising |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets shoppers find products by typing, by browsing categories and menus, by filters, by location and delivery option, and through recommendations, wish lists, comparison and saved searches; ranks results by relevance with synonyms, word forms, typing mistakes and several languages; keeps ineligible products out of results; lets marketing staff place banners, collections, featured sellers and campaign pages with dates; governs the category tree; measures search and browsing; and offers search to other channels through an API.

**In scope**

- Keyword search, search-as-you-type, filters, sorting, category browse, tag pages (SRC-001 to SRC-003, SRC-005, SRC-006)
- Location and delivery-option discovery, nearby pickup (SRC-004)
- Merchandising: menus, sliders, carousels, collections, ribbons, dated placements, campaign pages, seller badges and featured sellers (SRC-007, SRC-017)
- Recommendations: rules-based (native) and personalised with consent through an external service (SRC-008, SRC-009)
- Wish list, saved searches and alerts, search history, comparison, storefront conveniences (SRC-010 to SRC-013, SRC-027)
- Search engine plugin: relevance, synonyms, word forms, typing mistakes, languages, admin boosting rules with audit (SRC-014)
- Trending and bestsellers, result eligibility, delivery promise on listing cards (SRC-015, SRC-018, SRC-019)
- Taxonomy governance, services browsing area, web analytics, accessible search, low-connectivity behaviour, search API, unified search, freshness (SRC-016, SRC-020 to SRC-026)

**Not in this module**

| Item | Where it is |
|---|---|
| Product data, categories as data, specification attributes, required listing fields | CAT module (PRD-CAT-004, CAT-005); SRC-016 governs the category tree only |
| Stock figures and sellable stock | INV module (GetTotalStockQuantityAsync incl. lot rules, IC-INV-04); warehouse code and coordinates through IC-INV-05 |
| The IProductService override (SearchProductsAsync and the other product methods) | CAT-002 owns it (decision OVR-REG); SRC registers search filter and ordering contributors (IC-CAT-04; SRC side IC-SRC-02) and overrides no product service method |
| Seller suspension and hiding a suspended seller's products | SEL module (SEL-003, BR-SEL-006) through the CAT-022 listing pause; SRC adds no vendor-status filter |
| Recommendation model and the connection to the recommendation service | AI module (PRD-AI-007, P3, optional IC-SRC-04 provider; IC-AI-03); SRC-009 owns consent, display and the native fallback |
| Delivery estimates and delivery options data | LOG module (PRD-LOG-005); SRC-018 shows them on cards |
| Service booking, pricing and ordering flows | SVC module (PRD-SVC-005); SRC-020 is the browsing area only |
| Consent records and data-protection profile | SEC module (PRD-SEC-012) and native GDPR consents |
| USSD, SMS and kiosk channel front ends | CHN module (PRD-CHN-003, CHN-005); SRC-024 is the search API they call |
| Admin reporting dashboards beyond search terms | CAT-034 / RPT module |
| Workflow engine used by taxonomy approvals | ADM module (PRD-ADM-002, decision WF-ENG) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-SRC-001 | Keyword search | B2B + B2C | P1 | Configuration | None (configuration of bundled plugin + external Google Cloud Retail account) | Core (always on) | | |
| PRD-SRC-002 | Search-as-you-type | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-SRC-003 | Faceted filters | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | PRD-CAT-002 | |
| PRD-SRC-004 | Location and delivery-option discovery | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Postal and logistics pack | | |
| PRD-SRC-005 | Sorting options | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | PRD-CAT-002 | |
| PRD-SRC-006 | Category browse | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-SRC-007 | Merchandising widgets and landing pages | B2B + B2C | P1 | Licensed plugin | None | Core (both clients) | | |
| PRD-SRC-008 | Rules-based recommendations | B2B + B2C | P1 | Configuration | None | Engagement and loyalty pack | | |
| PRD-SRC-009 | Personalised recommendations and ranking | B2B + B2C | P1 | External system | External system + integration plugin | Analytics pack | PRD-SRC-008, PRD-CAT-002 | |
| PRD-SRC-010 | Wishlist | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-SRC-011 | Saved searches and watch alerts | B2B + B2C | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-SRC-012 | Search history | B2B + B2C | P2 | Configuration | None | Core (always on) | | |
| PRD-SRC-013 | Product comparison | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-SRC-014 | Search engine: relevance, synonyms, multilingual | B2B + B2C | P1 | Code-level | Custom plugin | Core (both clients) | | PAID-STUB |
| PRD-SRC-015 | Trending and bestsellers | B2B + B2C | P2 | Code-level | Custom plugin | Analytics pack | | |
| PRD-SRC-016 | Taxonomy governance | B2B + B2C | P1 | Code-level | Custom plugin | Commerce extensions pack | PRD-ADM-002 | WF-ENG |
| PRD-SRC-017 | Seller badges and featured sellers | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Marketplace pack | | |
| PRD-SRC-018 | Delivery promise on listing cards | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Postal and logistics pack | PRD-LOG-005 | |
| PRD-SRC-019 | Search result eligibility | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-SRC-020 | Services browsing area | B2B + B2C | P1 | Configuration | None | Services and bookings pack | | FG-06 |
| PRD-SRC-021 | Web analytics | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-SRC-022 | Accessible search and navigation | B2B + B2C | P1 | Code-level | Theme/view override | Core (always on) | | |
| PRD-SRC-023 | Low-connectivity resilience | B2B + B2C | P1 | Code-level | Theme/view override | Core (always on) | PRD-CHN-002 | |
| PRD-SRC-024 | Search API for channels | B2B + B2C | P1 | Code-level | Custom plugin | Analytics pack | | PAID-STUB |
| PRD-SRC-025 | Unified search | B2B + B2C | P2 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-SRC-026 | Search performance and freshness | B2B + B2C | P2 | Configuration | None | Core (always on) | | |
| PRD-SRC-027 | Storefront conveniences | B2C | P2 | Licensed plugin | None | Core (always on) | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Searches, browses, filters, sorts, compares, saves wish lists and searches, receives alerts | Guests / Registered (native) |
| Business buyer | Same as shopper; searches own orders and quotes (SRC-025) | Registered + B2B role (IAM-022) |
| Seller | Shown with badges; featured for set dates | Vendors (native) |
| Marketing staff | Builds menus, sliders, collections, campaign pages, featured placements; reads analytics | Role system name "Marketing" (in BR-IAM-050) |
| Catalogue manager | Proposes, approves and retires categories; manages synonyms and boosting rules | Role system name "Catalogue" (in BR-IAM-050) |
| Client administrator | Sets search, catalog, wish-list and analytics settings; selects the search provider; registers channel systems as INT-001 API clients | Administrators (native) |
| Channel system (USSD, SMS, kiosk) | Calls the search API | External system registered as an INT-001 API client |
| External recommendation service | Receives consented behaviour events; returns recommendations through AI-007 when installed | External system (connection owned by AI-007; optional) |
| Web analytics property | Receives page and e-commerce events | External (Google Analytics, Facebook Pixel) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Configuration.ManageSettings (native) | Configuration | Catalog and search settings, search-provider selection, SRC settings | Administrators |
| Configuration.ManageWidgets (native) | Configuration | Widgets: slider, analytics, recommendation, badge and delivery-promise widgets | Administrators, Marketing |
| ContentManagement.MenusCreateEditDelete (native) | ContentManagement | Main and footer menus | Administrators, Marketing |
| ContentManagement.TopicsCreateEditDelete (native) | ContentManagement | Topic pages used for campaign and services landing pages | Administrators, Marketing |
| Catalog.ProductTagsCreateEditDelete (native) | Catalog | Product tags and tag pages | Administrators, Catalogue |
| Catalog.CategoriesCreateEditDelete (native) | Catalog | Direct category create, edit and delete; with SRC-016 active these posts are intercepted (BR-SRC-060) | Administrators |
| Search.Core.Merchandising.CreateEditDelete | ContentManagement | Dated placements, collections, ribbons, featured sellers | Marketing |
| Search.Core.Badges.CreateEditDelete | Customers | Seller badge types and assignment to sellers | Administrators, Marketing |
| Search.Core.Relevance.View | Configuration | View synonyms and boosting rules with their change history | Administrators, Catalogue, Marketing |
| Search.Core.Relevance.CreateEditDelete | Configuration | Create, change, enable and disable synonyms and boosting rules (audited) | Catalogue |
| Search.Core.Taxonomy.Propose | Catalog | Propose a new, changed or retired category | Catalogue |
| Search.Core.Taxonomy.Approve | Catalog | Approve or reject a category proposal (not own) | Administrators, Catalogue |
| Search.Core.SavedSearches.Use | PublicStore | Save searches and watch products in the storefront | Registered |

Permissions are declared in an SRC plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix and the 5.00 view / create-edit-delete split (StandardPermission naming unchanged in 5.00.1); Category is taken from the native set. Default roles are given by role system name. Every name SRC uses (Marketing, Catalogue) is in the product role catalogue BR-IAM-050, and the IAM plugin creates every missing catalogue role at install and at start (BR-IAM-050); SRC does not rely on native start-up to create roles. Native permissions are reused for settings, widgets, menus, topics, tags and categories. The public-store wish list keeps the native PublicStore.EnableWishlist. All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-SRC-PERM-01 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-02 | **Given** a user without Configuration.ManageWidgets (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-03 | **Given** a user without ContentManagement.MenusCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-04 | **Given** a user without ContentManagement.TopicsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-05 | **Given** a user without Catalog.ProductTagsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-06 | **Given** a user without Catalog.CategoriesCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-07 | **Given** a user without Search.Core.Merchandising.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-08 | **Given** a user without Search.Core.Badges.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-09 | **Given** a user without Search.Core.Relevance.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-10 | **Given** a user without Search.Core.Relevance.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-11 | **Given** a user without Search.Core.Taxonomy.Propose, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-12 | **Given** a user without Search.Core.Taxonomy.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SRC-PERM-13 | **Given** a user without Search.Core.SavedSearches.Use, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-SRC-001 | Keyword search over name, short/full description, SKU, manufacturer part number and product tags (localized names when >1 language); product tag pages with paging and price filter. \| NEW in 5.00: bundled plugin Nop.Plugin.AIRecommendation.GoogleAI ("Google AI Commerce Search", v5.00.01) implements IAiRecommendationPlugin; ProductService.SearchProductsAsync sends the free-text keywords to Google Cloud Retail Search before the standard/ISearchProvider search and orders results by Google relevance; catalogue (name, descriptions, categories, manufacturers, specification attributes, tags, price, availability) is synced to Google. Fallback to standard search controlled by ArtificialIntelligenceSettings.UseStandardSearchWhenNoResults. \|\| 5.00.1 evidence: Libraries/Nop.Services/Catalog/ProductService.cs:897-924; Libraries/Nop.Services/ArtificialIntelligence/IAiRecommendationPlugin.cs; Libraries/Nop.Core/Domain/ArtificialIntelligence/ArtificialIntelligenceSettings.cs:93; Plugins/Nop.Plugin.AIRecommendation.GoogleAI/GoogleAiPlugin.cs:17,62; Plugins/Nop.Plugin.AIRecommendation.GoogleAI/Services/GoogleAiService.cs:246-296 (product mapping), :718-745 (SearchRequest, Query=keywords), :914-976; Plugins/Nop.Plugin.AIRecommendation.GoogleAI/plugin.json; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Catalog/ProductService.cs:ProductService.SearchProductsAsync(searchDescriptions, searchSku, searchProductTags, languageId); src/Libraries/Nop.Services/Catalog/ISearchProvider.cs:ISearchProvider; src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.ActiveSearchProviderSystemName; src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.NumberOfProductTags, ProductsByTagPageSize; src/Presentation/Nop.Web/App_Data/Localization/defaultResources.nopres.xml Search.SearchInTags, Search.SearchInDescriptions; PG STF-17 | No code build. Configuration and conditions: Google Cloud project with Retail API catalog (ProjectId, LocationId, CatalogId, BranchId) and service-account credentials; catalogue sync; bundled Google Analytics plugin must be active (search is skipped when the GA client-id cookie is missing, GoogleAiService.cs:730-731). Natural-language understanding (e.g. "black tea in 1 kg packs") is performed by Google, not by nopCommerce code: quality not verifiable from source; acceptance test with KTDA/MPC queries required. Product sync uses the default admin language only (GoogleAiService.cs:248). Set UseStandardSearchWhenNoResults = true: otherwise, when Google returns nothing or fails, the catch branch returns the product query without the keyword filter (ProductService.cs:915-922). Transfer of catalogue and visitor IDs to Google Cloud needs client data-protection confirmation (Kenya / Malawi) - not stated in source. | None (configuration of bundled plugin + external Google Cloud Retail account) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-002 | Search-box autocomplete with product images and 'view all results' link; number of suggestions configurable. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:221 ProductSearchAutoCompleteEnabled; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.ProductSearchAutoCompleteEnabled, ShowProductImagesInSearchAutoComplete, ProductSearchAutoCompleteNumberOfProducts, ShowLinkToAllResultInSearchAutoComplete, ProductSearchTermMinimumLength; PG STF-03 (NT alternative) | None. (Post Gebeya used NT Instant Search; optional styling only.) | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-003 | Category/manufacturer/vendor/tag/search pages filter by price range, specification attributes (usable for 'grade') and manufacturer; vendor filter only as an advanced-search field; 4.90 adds FilterLevels (3-level cascading filter). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.EnablePriceRangeFiltering, EnableSpecificationAttributeFiltering, EnableManufacturerFiltering, SearchPagePriceRangeFiltering; src/Libraries/Nop.Core/Domain/Vendors/VendorSettings.cs:VendorSettings.AllowSearchByVendor; src/Libraries/Nop.Core/Domain/FilterLevels/FilterLevelSettings.cs:FilterLevelSettings; src/Presentation/Nop.Web/App_Data/Localization/defaultResources.nopres.xml Search.Vendor, Search.FilterLevelValues; PG STF-15 (NT) | No 'in stock' facet anywhere in source; seller (vendor) is not a facet on category pages. Needs custom filter plugin + view override, or NT Ajax Filters (PG STF-15 covers vendor facet; in-stock facet not stated in PG — confirm with vendor; 5.00 support not verifiable from source; confirm with vendor). | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source (absence of in-stock facet: grep 'InStock' in Nop.Services/Catalog and Nop.Web/Factories finds only availability messages) |
| PRD-SRC-004 | Pickup points with address, latitude/longitude, opening hours, shown on a Google map at checkout only. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Pickup.PickupInStore/Domain/StorePickupPoint.cs:StorePickupPoint.Latitude, Longitude, OpeningHours; src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.DisplayPickupPointsOnMap, GoogleMapsApiKey; src/Presentation/Nop.Web/Views/Checkout/_PickupPoints.cshtml; PG CHK-03 | No catalogue browsing/filtering by district, distance or delivery option; no 'available for pickup near me' product filter. Custom plugin (geo filter on catalog) + view override. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-005 | Sorting by position, name A–Z/Z–A, price low/high, creation date (newest); each option can be disabled. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/ProductSortingEnum.cs:ProductSortingEnum (Position, NameAsc, NameDesc, PriceAsc, PriceDesc, CreatedOn); src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.AllowProductSorting, ProductSortingEnumDisabled | Popularity and origin sorting do not exist. Add sort options via DI override of the product search/catalog model factory in a plugin (or extend ProductSortingEnum in core) and expose in view. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-006 | Category pages with breadcrumb, subcategories, products from subcategories, featured products, grid/list view switch and page sizes. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.CategoryBreadcrumbEnabled, ShowProductsFromSubcategories, AllowProductViewModeChanging, DefaultViewMode, IncludeFeaturedProductsInNormalLists, DefaultCategoryPageSizeOptions; src/Libraries/Nop.Core/Domain/Catalog/ProductCategory.cs:ProductCategory.IsFeaturedProduct; PG STF-13 | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-007 | 4.90 adds a native menu builder (Main/Footer menus; items: category, manufacturer, vendor, product, topic, custom link) and the bundled Widgets.Swiper home slider; Topics for campaign pages; product 'Mark as new' with date window; product availability start/end dates. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Menus/Menu.cs:Menu; src/Libraries/Nop.Core/Domain/Menus/MenuItemType.cs:MenuItemType; src/Plugins/Nop.Plugin.Widgets.Swiper/SwiperSettings.cs:SwiperSettings.Slides, Autoplay; src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.MarkAsNew, MarkAsNewStartDateTimeUtc, AvailableStartDateTimeUtc; PG STF-02, STF-07, STF-08, STF-09, STF-11, CNT-03, NT-01 | Product carousels, curated collections, ribbons ('New'/'Sale' labels on pictures), HTML widgets and date-scheduled widget display are not native → Nop-Templates JCarousel (STF-08), Smart Product Collections (STF-09), Product Ribbons (STF-11), Html Widgets (CNT-03), NT framework scheduling (NT-01). Built for 4.70.5: needs 5.00 version from vendor (5.00 support not verifiable from source; confirm with vendor). Availability of this licensed plugin for 5.00 is not verifiable from source (evidence is Post Gebeya on 4.70.5); decision V-01. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in Post Gebeya (4.70.5) — confirm on 5.00.1 (native menus/slider verified in 4.90.8 and 5.00.1 source) |
| PRD-SRC-008 | Related products, cross-sells, 'customers who bought this also bought', recently viewed products, new products page. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/RelatedProduct.cs:RelatedProduct; src/Libraries/Nop.Core/Domain/Catalog/CrossSellProduct.cs:CrossSellProduct; src/Libraries/Nop.Core/Domain/Orders/ShoppingCartSettings.cs:ShoppingCartSettings.CrossSellsNumber; src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.ProductsAlsoPurchasedEnabled, RecentlyViewedProductsEnabled, NewProductsEnabled; src/Libraries/Nop.Services/Orders/OrderReportService.cs:GetAlsoPurchasedProductsIdsAsync; PG STF-23, STF-27 | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-009 | Consent capture exists (GDPR consents); behaviour data exists (orders, activity log 'PublicStore.ViewProduct'). No personalisation or ML ranking in source (4.90 AI settings cover only description/meta generation and translation). \| 5.00: bundled Google AI plugin passes the GA client-id as VisitorId to Google Retail Search, so Google may personalise keyword-search ranking (GoogleAiService.cs:730-741). The plugin does not send user events, has no recommendation (predict) call or widget (IAiRecommendationPlugin has SearchProductsAsync only) and no consent gate (only "registered users only", GoogleAiPlugin.cs:133). \|\| 5.00.1 evidence: Plugins/Nop.Plugin.AIRecommendation.GoogleAI/Services/GoogleAiService.cs:718-745; Libraries/Nop.Services/ArtificialIntelligence/IAiRecommendationPlugin.cs; Plugins/Nop.Plugin.AIRecommendation.GoogleAI/GoogleAiPlugin.cs:133; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Gdpr/GdprConsent.cs:GdprConsent; src/Libraries/Nop.Core/Domain/ArtificialIntelligence/ArtificialIntelligenceSettings.cs:ArtificialIntelligenceSettings (AllowProductDescriptionGeneration, AllowMetaTitleGeneration only); src/Libraries/Nop.Services/Installation/InstallRequiredData.cs activity type PublicStore.ViewProduct; Plugin evaluation | External ML recommendation service (candidates: nopStation Amazon Personalize — lists 4.70, 5.00 support not verifiable from source; confirm with vendor; Google Recommendations AI plugin — version not stated). nopCommerce needs an integration plugin: consent-gated event export, recommendation widget; keyword-search ranking via ISearchProvider (returns ordered product IDs); category/listing ranking needs an IProductService or catalog model factory override. 5.00 delta: the bundled Google AI plugin can serve as the keyword-search ranking part; consent-gated event export, recommendation widgets and category/listing ranking remain. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no recommendation/personalisation service in Nop.Services; model hosting is an external ML service by nature |
| PRD-SRC-010 | Wishlist with email-a-friend sharing, move items to cart; 4.90 adds multiple named custom wishlists per customer. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/ShoppingCartSettings.cs:ShoppingCartSettings.EmailWishlistEnabled, MoveItemsFromWishlistToCart, AllowMultipleWishlist, MaximumNumberOfCustomWishlist; src/Libraries/Nop.Core/Domain/Orders/CustomWishlist.cs:CustomWishlist; message template Wishlist.EmailAFriend; PG STF-25 | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-011 | Back-in-stock subscriptions per product with email notification. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.AllowBackInStockSubscriptions; src/Libraries/Nop.Services/Catalog/BackInStockSubscriptionService.cs; src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.MaximumBackInStockSubscriptions; message template Customer.BackInStock | Saved searches with new-match alerts and price-drop alerts are not native. Custom plugin (saved query entity, scheduled task, message templates). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-012 | NEW in 5.00: per-customer search-term history. SearchTerm now stores CustomerId and CreatedOnUtc (soft-deletable); the search box shows the customer's recent terms in the autocomplete list (one click repeats the search) and the customer can delete entries. Enabled by default (ShowSearchTermHistory = true, NumberOfSearchTermHistoryItems = 10). Recently viewed products block unchanged. \|\| 5.00.1 evidence: Libraries/Nop.Core/Domain/Common/SearchTerm.cs:6,21; Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:251 ShowSearchTermHistory, :256 NumberOfSearchTermHistoryItems; Libraries/Nop.Services/Common/SearchTermService.cs:161 SearchTermHistoryItemsAsync; Presentation/Nop.Web/Controllers/CatalogController.cs:413-438 (SearchTermHistoryAutoComplete, DeleteProductSearchTermItems); Presentation/Nop.Web/Views/Shared/Components/SearchBox/Default.cshtml:74; Libraries/Nop.Services/Installation/InstallRequiredData.cs:1566-1567; Admin: Presentation/Nop.Web/Areas/Admin/Views/Common/_Maintenance.ClearSearchHistory.cshtml; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.RecentlyViewedProductsEnabled, RecentlyViewedProductsNumber; src/Libraries/Nop.Core/Domain/Common/SearchTerm.cs:SearchTerm | None. Optional theme styling only. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-013 | Product comparison list with configurable maximum and description options. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.CompareProductsEnabled, CompareProductsNumber, IncludeShortDescriptionInCompareProducts; src/Presentation/Nop.Web/App_Data/Localization/defaultResources.nopres.xml Products.Compare.*; PG STF-27 | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-014 | Search-provider extension point (ISearchProvider) with fallback to standard search. The bundled Search.Lucene plugin in release-4.90.8 is a promotional stub: LuceneSearchProvider implements IMiscPlugin only and its configure page links to 'Get the plugin' on nopcommerce.com. \| Re-verified in 5.00.1: Search.Lucene (v5.00.3) is still a promotional stub (LuceneSearchProvider : IMiscPlugin, configure page links to nopcommerce.com/full-text-search-lucene). Setting renamed: CatalogSettings.UseStandardSearchWhenNoResults (was UseStandardSearchWhenSearchProviderThrowsException). NEW in 5.00: bundled Google AI Commerce Search plugin gives relevance ranking from an external Google engine (see PRD-SRC-001). \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Search.Lucene/LuceneSearchProvider.cs; Plugins/Nop.Plugin.Search.Lucene/Views/Configure.cshtml; Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:617; Plugins/Nop.Plugin.AIRecommendation.GoogleAI/Services/GoogleAiService.cs:248; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Catalog/ISearchProvider.cs:ISearchProvider; src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.ActiveSearchProviderSystemName, UseStandardSearchWhenNoResults; src/Plugins/Nop.Plugin.Search.Lucene/LuceneSearchProvider.cs:LuceneSearchProvider (BasePlugin, IMiscPlugin); src/Plugins/Nop.Plugin.Search.Lucene/Views/Configure.cshtml | Partial: relevance, synonyms, typo tolerance can be delegated to Google Retail via the bundled Google AI plugin (Google-side behaviour not verifiable from source). Not covered: admin boosting rules (category, featured, location) with audit of rule changes inside nopCommerce; multilingual index (plugin syncs only the default admin language, GoogleAiService.cs:248). Build: custom plugin for boosting rules + audit and multi-language sync, or a custom ISearchProvider (e.g. Lucene.NET) if Google Cloud is not accepted. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-015 | Bestsellers report and bestsellers on home page; product view events in activity log. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Orders/OrderReportService.cs:BestSellersReportAsync; src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.ShowBestsellersOnHomepage, NumberOfBestsellersOnHomepage; PG STF-08 | Most-viewed and trending lists by region or category. Custom plugin (aggregation task + widgets). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-016 | Category CRUD in admin, activity log of category changes, ACL/store mapping. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/CategoryController.cs; src/Libraries/Nop.Core/Domain/Logging/ActivityLog.cs:ActivityLog | Propose/approve/retire workflow with change record. Custom plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SRC-017 | Vendor entity, vendor pages, vendor custom attributes; 4.90 menus can link vendors. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Vendors/Vendor.cs:Vendor; src/Libraries/Nop.Core/Domain/Vendors/VendorAttribute.cs:VendorAttribute; src/Libraries/Nop.Core/Domain/Menus/MenuItemType.cs:MenuItemType.Vendor; PG CAT-06 | Badges ('verified', 'top rated') and date-scheduled featured sellers. Custom plugin + view override. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SRC-018 | Product delivery date shown on product details page; transit days per shipping rate and pickup point used in shipping estimate. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Factories/ProductModelFactory.cs:ProductModelFactory (DeliveryDate set in product details model only); src/Libraries/Nop.Core/Domain/Catalog/Product.cs:Product.DeliveryDateId; src/Plugins/Nop.Plugin.Pickup.PickupInStore/Domain/StorePickupPoint.cs:StorePickupPoint.TransitDays | Delivery time and pickup availability on product tiles in listings. Custom plugin (model-prepared event) + product-box view override. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-019 | Search excludes unpublished, deleted, out-of-availability-window products; low-stock activity can auto-unpublish out-of-stock products. \| Re-verified in 5.00.1: ProductService.SearchProductsAsync still has no vendor Active filter; the Google AI search path joins its result to the same product query, so the gap applies to both paths. \|\| 5.00.1 evidence: Libraries/Nop.Services/Catalog/ProductService.cs:897-924; 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Catalog/ProductService.cs:SearchProductsAsync (Published, AvailableStartDateTimeUtc/AvailableEndDateTimeUtc); src/Libraries/Nop.Core/Domain/Catalog/LowStockActivity.cs:LowStockActivity.Unpublish; src/Presentation/Nop.Web/Controllers/CatalogController.cs (vendor.Active check on vendor page only) | Products of a suspended (inactive) vendor are not excluded from search: SearchProductsAsync has no vendor Active filter (vendor page is hidden only). Custom plugin (event consumer unpublishing on vendor deactivation, or search-filter override). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-020 | A separate services area can be configured with a dedicated root category tree, a 4.90 Main/Footer menu entry, Topic landing pages, ACL/store mapping (or a separate store under multi-store). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Menus/Menu.cs:Menu; src/Libraries/Nop.Core/Domain/Menus/MenuItemType.cs:MenuItemType.Category, TopicPage; src/Libraries/Nop.Core/Domain/Catalog/Category.cs:Category.SubjectToAcl, LimitedToStores | None for browsing. Service-specific behaviour (booking, pricing models) is in PRD-SVC-*. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-021 | Bundled Google Analytics widget with e-commerce events; bundled Facebook Pixel widget. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Widgets.GoogleAnalytics/GoogleAnalyticsSettings.cs:GoogleAnalyticsSettings.EnableEcommerce, GoogleId, ApiSecret; src/Plugins/Nop.Plugin.Widgets.FacebookPixel; PG CNT-09 | None in nopCommerce (analytics property is external). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-022 | Search box has aria-label; main and footer menu views carry some aria attributes. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Views/Shared/Components/SearchBox/Default.cshtml (aria-label Search.SearchBox.Text.Label); src/Presentation/Nop.Web/Views/Shared/Components/MainMenu/*.cshtml | Full keyboard-only operation and screen-reader labelling across search, filters and menus is not verified in source; needs accessibility audit and theme fixes. | Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source (partial aria only) |
| PRD-SRC-023 | None specific. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Presentation/Nop.Web/Views/Shared/Components/SearchBox/Default.cshtml | Weak-connection messages and retry logic in search UI (client-side JS). | Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SRC-024 | Bundled Misc.WebApi.Frontend in 4.90.8 is a stub (configure page 'Download plugin' link to nopcommerce.com/web-api); no REST search endpoint in core. \| Re-verified in 5.00.1: Misc.WebApi.Frontend (v5.00.3) is still a stub (WebApiFrontendPlugin : IMiscPlugin; configure page links to nopcommerce.com/web-api). \|\| 5.00.1 evidence: Plugins/Nop.Plugin.Misc.WebApi.Frontend/Views/Configure.cshtml; 4.90 evidence re-verified present in 5.00.1: src/Plugins/Nop.Plugin.Misc.WebApi.Frontend/Views/Configure.cshtml; src/Libraries/Nop.Services/Catalog/ProductService.cs:SearchProductsAsync | Search API for USSD/SMS/kiosk channels: custom API plugin (or the commercial nopCommerce Web API plugin — not evaluated in PG). USSD/SMS gateways are external. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-025 | Product search only; orders, RFQ requests/quotes and account records have separate list pages. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Catalog/ProductService.cs:SearchProductsAsync; src/Plugins/Nop.Plugin.Misc.RFQ/Controllers/RfqCustomerController.cs:CustomerQuotes | One search across products, orders, quotes and own records. Custom plugin + view override. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no entity, setting, service or resource for this capability found by grep of Nop.Core/Domain, Nop.Services, Nop.Web and src/Plugins; native base cited is verified |
| PRD-SRC-026 | Native search queries the database live, so new/changed products appear immediately (subject to cache clearing on entity events). \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Services/Catalog/ProductService.cs:SearchProductsAsync; src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.CacheProductPrices | Response-time target is an NFR to load-test; no guarantee in source. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SRC-027 | Email a friend and shipping estimate on product page are native. \|\| 5.00.1 evidence: 4.90 evidence re-verified present in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/CatalogSettings.cs:CatalogSettings.EmailAFriendEnabled; src/Libraries/Nop.Core/Domain/Shipping/ShippingSettings.cs:ShippingSettings.EstimateShippingProductPageEnabled; PG STF-12, STF-19, STF-20, STF-21 | Quick view, 'Buy now' and previous/next product links are not in source (grep 'BuyNow' returns nothing) → Nop-Templates Quick View (STF-12), Buy now (STF-20, NT part), Prev/Next Product (STF-19). Built for 4.70.5: 5.00 support not verifiable from source; confirm with vendor. Availability of this licensed plugin for 5.00 is not verifiable from source (evidence is Post Gebeya on 4.70.5); decision V-01. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in Post Gebeya (4.70.5) — confirm on 5.00.1 (native parts verified in 4.90.8 and 5.00.1 source) |


## 7. Feature specifications


### 7.1 PRD-SRC-001 Keyword search

| Item | Value |
|---|---|
| Description (baseline) | Customers type words and the shop finds matching products by name, description, product code or tags. Customers can also type questions in everyday language (for example 'black tea in 1 kg packs'), and products can carry tags with their own tag pages. |
| Why it matters | Lets customers find products by typing what they want. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None (configuration of bundled plugin + external Google Cloud Retail account) |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-001-01 | As a shopper, I want to type words and find matching products by name, description, product code or tags, so that I find products by typing what I want. | D; REQ-MPC-FR-076; REQ-KTDA-SRC-001 | Ready |
| US-SRC-001-02 | As a shopper, I want to type a request in everyday language such as "black tea in 1 kg packs", so that I do not have to know the exact product name. | D | Ready |
| US-SRC-001-03 | As a shopper, I want product tag pages, so that I can see all products with the same tag. | D | Ready |
| US-SRC-001-04 | As a shopper, I want both a simple search box and an advanced search form, so that I can search in the way that suits my experience. | REQ-MPC-UX-004 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-001-01-01 | US-SRC-001-01 | **Given** no search provider is selected and a published product is named "Green Tea", **when** the shopper searches "tea", **then** the product is found: the name is matched as a substring (SQL LIKE through string.Contains); SKU and manufacturer part number match only when equal to the whole term. | REQ-MPC-FR-076; REQ-KTDA-SRC-001; FIT (ProductService.SearchProductsAsync) |
| AC-SRC-001-01-02 | US-SRC-001-01 | **Given** the SRC search provider (SRC-014) is selected, **when** the shopper searches a word that appears only in a product's full description or tags, **then** the product is found, because the provider indexes name, short and full description, SKU, manufacturer part number and tags. | D |
| AC-SRC-001-01-03 | US-SRC-001-01 | **Given** no search provider is selected, **when** the shopper uses the simple search box, **then** descriptions and tags are not searched; they are searched only when the shopper ticks "search in product descriptions" or "search in product tags" in the advanced search (native). | FIT (CatalogModelFactory.cs:1691-1712) |
| AC-SRC-001-01-04 | US-SRC-001-01 | **Given** two or more languages are published and the working language is L, **when** the shopper searches, **then** localized names and short descriptions in L are also matched. | FIT |
| AC-SRC-001-01-05 | US-SRC-001-01 | **Given** the term is shorter than CatalogSettings.ProductSearchTermMinimumLength, **when** the shopper searches, **then** no search runs and the native message Search.SearchTermMinimumLengthIsNCharacters is shown. | FIT |
| AC-SRC-001-01-06 | US-SRC-001-01 | **Given** a product has an attribute combination with its own SKU, **when** the shopper searches that exact SKU, **then** the product is found. | FIT |
| AC-SRC-001-02-01 | US-SRC-001-02 | **Given** the SRC provider is selected and a client mapping links units (for example kg) to the specification attribute that holds pack size, **when** the shopper searches "black tea in 1 kg packs", **then** Withdrawn (VER-500): now native — the free-text request is sent by the bundled Google AI Commerce Search plugin (AIRecommendation.GoogleAI 5.00.01, the AI recommendation provider of SearchProductsAsync) to Google Cloud Retail Search as SearchRequest.Query, against the synced catalogue (title, descriptions, categories, manufacturers, specification attributes, tags, price, availability), and the products come back in Google relevance order; no SRC parser or unit mapping is built; Google-side understanding of quantities is verified by AC-SRC-001-02-05. | VER-500; FIT (ProductService.cs:899-933; GoogleAiService.cs:246-296, 718-745) |
| AC-SRC-001-02-02 | US-SRC-001-02 | **Given** the active ISearchProvider throws an error or returns no product and CatalogSettings.UseStandardSearchWhenNoResults is on (5.00 name of UseStandardSearchWhenSearchProviderThrowsException), **when** the shopper searches, **then** results of the native standard search are shown; native code does not log the provider error (empty catch), so the SRC provider logs its own errors before it throws (Proposed). | FIT (ProductService.cs:937-951; CatalogSettings.cs:617) |
| AC-SRC-001-03-01 | US-SRC-001-03 | **Given** a product has tags, **when** the shopper opens a tag page, **then** products with that tag are listed with paging (ProductsByTagPageSize) and, if ProductsByTagPriceRangeFiltering is on, a price filter. | D; FIT |
| AC-SRC-001-04-01 | US-SRC-001-04 | **Given** the storefront is open, **when** the shopper looks for products, **then** a search box is on every page; the search page offers an advanced form (category with subcategories, manufacturer, seller if VendorSettings.AllowSearchByVendor, price, search in descriptions, search in tags); category menus and tag pages are also available. | REQ-MPC-UX-004; FIT |
| AC-SRC-001-02-03 | US-SRC-001-02 | **Given** the client has accepted Google Cloud Retail for its store (data protection and cost confirmed, open items below), **when** the client instance is configured, **then** the bundled Google AI Commerce Search plugin is installed and named in ArtificialIntelligenceSettings.ActiveAIRecommendationProviderSystemName; GoogleAiSettings.Enabled and SearchAllowed are on and ProjectId, LocationId, CatalogId and BranchId are set; the Google service-account key is supplied to the host through Application Default Credentials (environment variable GOOGLE_APPLICATION_CREDENTIALS), never in a configuration pack (BR-PLT-013); the bundled Google Analytics widget it depends on is active; the catalogue sync has run; and ArtificialIntelligenceSettings.UseStandardSearchWhenNoResults and CatalogSettings.UseStandardSearchWhenNoResults are on (BR-SRC-150). | VER-500; FIT (GoogleAiPlugin.cs:17; plugin.json DependsOn Widgets.GoogleAnalytics; GoogleAiSettings.cs:13-49; ArtificialIntelligenceSettings.cs:93) |
| AC-SRC-001-02-04 | US-SRC-001-02 | **Given** the Google AI plugin is active and GoogleAiSettings.EnableForRegisteredUsersOnly is on (install default), **when** a guest searches, **then** the plugin returns no product, the standard path (ISearchProvider or native search) answers with the keywords, and the everyday-language behaviour of story 02 applies only to registered shoppers; whether guests are included is a client setting (EnableForRegisteredUsersOnly off includes them). | VER-500; FIT (GoogleAiService.cs:925-931; GoogleAiPlugin.cs:97) |
| AC-SRC-001-02-05 | US-SRC-001-02 | **Given** the Google AI plugin is active, **when** the client acceptance set of everyday-language queries (KTDA and Malawi Post examples such as "black tea in 1 kg packs") is run, **then** each query returns the products the client marked as expected among the first results; result quality is Google-side behaviour that cannot be verified from source, so this test is the acceptance evidence. | VER-500; Proposed (acceptance set Not stated in source) |
| AC-SRC-001-02-06 | US-SRC-001-02 | **Given** the Google AI plugin is active and Google fails or returns no product, **when** the shopper searches, **then** with ArtificialIntelligenceSettings.UseStandardSearchWhenNoResults on, the ISearchProvider or the native search runs with the keywords; with it off native code would return the product list without any keyword filter, which BR-SRC-150 forbids. | VER-500; FIT (ProductService.cs:915-922) |
| AC-SRC-001-02-07 | US-SRC-001-02 | **Given** the Google AI plugin is active and the visitor has no Google Analytics client-id cookie (for example analytics cookies refused), **when** the shopper searches, **then** no request is sent to Google and the standard path answers, so results can differ by cookie-consent state. | VER-500; FIT (GoogleAiService.cs:730-731) |
| AC-SRC-001-02-08 | US-SRC-001-02 | **Given** the Google AI plugin is active and two or more languages are published, **when** the catalogue is synced, **then** only the default admin language is sent to Google, so searches in another language are matched against default-language text; multilingual search stays a SRC-014 build. | VER-500; FIT (GoogleAiService.cs:248) |

**Business rules applied:** BR-SRC-001; BR-SRC-002; BR-SRC-120; BR-SRC-130; BR-SRC-150 (§8.1).


### 7.2 PRD-SRC-002 Search-as-you-type

| Item | Value |
|---|---|
| Description (baseline) | Suggestions with pictures appear while the customer is still typing. |
| Why it matters | Faster searching and fewer spelling problems. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-002-01 | As a shopper, I want suggestions with pictures while I type, so that I search faster and with fewer spelling problems. | D; REQ-MPC-FR-079; REQ-KTDA-SRC-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-002-01-01 | US-SRC-002-01 | **Given** ProductSearchAutoCompleteEnabled is on and ProductSearchTermMinimumLength is reached, **when** the shopper types in the search box, **then** up to ProductSearchAutoCompleteNumberOfProducts product suggestions appear (10 when the setting is 0), with pictures when ShowProductImagesInSearchAutoComplete is on. | D; REQ-MPC-FR-079; REQ-KTDA-SRC-001; FIT (CatalogController.SearchTermAutoComplete) |
| AC-SRC-002-01-02 | US-SRC-002-01 | **Given** more products match than are shown and ShowLinkToAllResultInSearchAutoComplete is on, **when** suggestions appear, **then** a "view all results" link is shown. | FIT |
| AC-SRC-002-01-03 | US-SRC-002-01 | **Given** fewer characters than the minimum are typed, **when** the shopper types, **then** no suggestions are shown. | FIT |
| AC-SRC-002-01-04 | US-SRC-002-01 | **Given** the SRC provider is selected (or the AI recommendation provider, which SearchProductsAsync calls first, BR-SRC-150), **when** suggestions are requested, **then** they come from that provider, because autocomplete calls SearchProductsAsync with the keywords. | FIT (CatalogController.cs:375; ProductService.cs:899-951) |
| AC-SRC-002-01-05 | US-SRC-002-01 | **Given** ShowSearchBoxCategories is on and the shopper chose a category in the search box, **when** suggestions are requested, **then** only products of that category and its subcategories are suggested. | FIT |

**Business rules applied:** BR-SRC-001 (§8.1).


### 7.3 PRD-SRC-003 Faceted filters

| Item | Value |
|---|---|
| Description (baseline) | Filters beside search results and category pages, for example price range, grade, brand, seller and 'in stock'. |
| Why it matters | Customers narrow a long list down to what they want. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | PRD-CAT-002 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-003-01 | As a shopper, I want to filter by price range and by attributes such as size, grade, features and brand, so that I narrow a long list to what I want. | D; REQ-KTDA-SRC-002; REQ-MPC-FR-077 | Ready; conditions: OVR-REG |
| US-SRC-003-02 | As a shopper, I want to filter by seller, so that I see the products of the sellers I trust. | D; REQ-MPC-FR-077 | Ready; conditions: OVR-REG |
| US-SRC-003-03 | As a shopper, I want to show only items in stock, so that I do not open items I cannot buy. | D; REQ-KTDA-SRC-002 | Ready; conditions: OVR-REG |
| US-SRC-003-04 | As a shopper, I want filters on category and search pages, so that I can refine both ways of finding products. | REQ-MPC-UX-004; REQ-MPC-FR-077 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-003-01-01 | US-SRC-003-01 | **Given** CatalogSettings.EnablePriceRangeFiltering is on, **when** the shopper sets a price range on a category page, **then** only products within the range are listed. | FIT; REQ-MPC-FR-077 (price range) |
| AC-SRC-003-01-02 | US-SRC-003-01 | **Given** a specification attribute (for example Grade or Size) has options with AllowFiltering on, **when** the shopper ticks one option, **then** only products with that option are listed. | FIT; REQ-KTDA-SRC-002 (size, features, other attributes) |
| AC-SRC-003-01-03 | US-SRC-003-01 | **Given** the shopper ticks two options of one attribute and one option of another, **when** the list refreshes, **then** products matching either of the first two and the third are listed (OR within an attribute, AND across attributes). | FIT (ProductService.cs:1151-1172) |
| AC-SRC-003-01-04 | US-SRC-003-01 | **Given** EnableManufacturerFiltering is on, **when** the shopper picks a brand, **then** only that brand's products are listed. | FIT |
| AC-SRC-003-02-01 | US-SRC-003-02 | **Given** the seller facet is on (setting), **when** a category or search page is shown, **then** a seller filter lists the active sellers that have products in the result; picking one restricts the list through the SRC search-filter provider (IC-SRC-02) of the CAT-002 IProductService override (decision OVR-REG). | D; REQ-MPC-FR-077 (seller); OVR-REG |
| AC-SRC-003-03-01 | US-SRC-003-03 | **Given** the in-stock facet is on (setting), **when** the shopper ticks "In stock only", **then** only products with sellable stock above 0, products that do not manage stock and products that allow backorders are listed (BR-SRC-011). | D; REQ-KTDA-SRC-002 (availability) |
| AC-SRC-003-04-01 | US-SRC-003-04 | **Given** the shopper is on the search page, **when** they choose a category in the advanced form with "include subcategories", **then** results are limited to that category and its subcategories. | FIT; REQ-MPC-FR-077 (category) |
| AC-SRC-003-04-02 | US-SRC-003-04 | **Given** filters are configured, **when** the shopper opens a category page or the search page, **then** the same filters (price, attributes, brand, seller, in stock) are offered on both pages. | REQ-MPC-UX-004; Proposed |

**Business rules applied:** BR-SRC-010; BR-SRC-011; BR-SRC-012 (§8.1).


### 7.4 PRD-SRC-004 Location and delivery-option discovery

| Item | Value |
|---|---|
| Description (baseline) | Customers browse or filter by district, distance or delivery option, or find items available for pickup at a nearby outlet. |
| Why it matters | Customers see what they can actually get where they are. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-004-01 | As a shopper, I want to browse or filter by district, so that I see what I can get where I am. | D; REQ-MPC-FR-077 | Ready |
| US-SRC-004-02 | As a shopper, I want to filter by distance from me, so that I see what is close. | D | Ready |
| US-SRC-004-03 | As a shopper, I want to filter by delivery option, so that I see only items I can get the way I want. | D; REQ-MPC-FR-077 | Ready |
| US-SRC-004-04 | As a shopper, I want to find items available for pickup at a nearby outlet or in my district, so that I can collect them myself. | D; REQ-MPC-FR-084 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-004-01-01 | US-SRC-004-01 | **Given** district is defined per client as the state/province or county of an address, and warehouses have addresses, **when** the shopper chooses district X, **then** only products with sellable stock in a warehouse whose address is in district X are listed. | REQ-MPC-FR-077 (location); Proposed (definition) |
| AC-SRC-004-02-01 | US-SRC-004-02 | **Given** warehouses have coordinates (INV-002) and the shopper gives a location (browser location with consent, or a chosen district centre) and a radius, **when** the distance filter is applied, **then** only products with sellable stock (GetTotalStockQuantityAsync per warehouse, which subtracts unsellable lots through IC-INV-04) in a warehouse within the radius (great-circle distance from the coordinates read through IC-INV-05) are listed, nearest first when sorted by distance. | D; Proposed; INV-002 |
| AC-SRC-004-02-02 | US-SRC-004-02 | **Given** the shopper gave no location and refused browser location, **when** they choose the distance filter, **then** the filter is not applied and message Src.LocationNeeded asks for a district. | Proposed |
| AC-SRC-004-03-01 | US-SRC-004-03 | **Given** delivery options come from LOG (for example home delivery and pickup), **when** the shopper filters by an option, **then** only products that can be fulfilled with that option for the shopper's district are listed. | REQ-MPC-FR-077 (delivery option); Proposed |
| AC-SRC-004-04-01 | US-SRC-004-04 | **Given** pickup points (native StorePickupPoint) are linked to warehouses (LOG-003 PickupPointWarehouse, read through IC-LOG-06), **when** the shopper selects an outlet in "nearby pickup" mode, **then** only products with sellable stock in the warehouse linked to that outlet are listed, and the outlet's address and opening hours are shown. | REQ-MPC-FR-084 |
| AC-SRC-004-04-02 | US-SRC-004-04 | **Given** the shopper selects a district in "nearby pickup" mode, **when** the list is shown, **then** products available at any outlet in that district are listed with the outlets that have them. | REQ-MPC-FR-084 |

**Business rules applied:** BR-SRC-020 (§8.1).


### 7.5 PRD-SRC-005 Sorting options

| Item | Value |
|---|---|
| Description (baseline) | Customers sort results by name, price, newest, popularity or origin. |
| Why it matters | Helps customers compare quickly. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | PRD-CAT-002 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-005-01 | As a shopper, I want to sort results by relevance, name, price, newest, popularity or place of origin, so that I compare quickly. | D; REQ-MPC-FR-078 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-005-01-01 | US-SRC-005-01 | **Given** CatalogSettings.AllowProductSorting is on, **when** the shopper opens the sort list on a category or search page, **then** the native options position, name A-Z, name Z-A, price low to high, price high to low and newest are offered, except those in ProductSortingEnumDisabled, in the order of ProductSortingEnumDisplayOrder. | FIT; REQ-MPC-FR-078 (price, newest) |
| AC-SRC-005-01-02 | US-SRC-005-01 | **Given** the SRC search provider is selected, **when** the shopper searches with the sort "position", **then** results keep the provider's order, and the option is labelled with locale key Src.SortRelevance on the search page. | FIT (ProductExtensions.OrderBy, ProductExtensions.cs:99, called at ProductService.cs:1176 for the ISearchProvider and at :911 for the AI provider); REQ-MPC-FR-078 (relevance) |
| AC-SRC-005-01-03 | US-SRC-005-01 | **Given** the popularity basis is set (units sold in a period, default not stated), **when** the shopper sorts by popularity, **then** products are ordered by units sold in that period, highest first; products with no sales follow in position order. | REQ-MPC-FR-078 (popularity); Proposed (basis) |
| AC-SRC-005-01-04 | US-SRC-005-01 | **Given** a specification attribute is configured as "origin", **when** the shopper sorts by origin, **then** products are ordered by the origin value alphabetically in the working language; products without an origin come last. | REQ-MPC-FR-078 (place of origin); Proposed |
| AC-SRC-005-01-05 | US-SRC-005-01 | **Given** popularity or origin is chosen, **when** the list is built, **then** the sort is applied by an SRC ordering provider (IC-SRC-02) of the CAT-002 IProductService override (decision OVR-REG) and the options are added by an override of the Nop.Web CatalogModelFactory.PrepareSortingOptionsAsync (public virtual); the native ProductSortingEnum and its values are not changed in core. | FIT (ProductExtensions.OrderBy falls back to display order for unknown values); OVR-REG; Proposed |

**Business rules applied:** BR-SRC-030 (§8.1).


### 7.6 PRD-SRC-006 Category browse

| Item | Value |
|---|---|
| Description (baseline) | Category pages with a 'you are here' trail, sub-categories, featured items and grid or list views. |
| Why it matters | Easy browsing for customers who do not search. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-006-01 | As a shopper, I want category pages with a "you are here" trail, sub-categories, featured items and a grid or list view, so that I can browse without searching. | D; REQ-MPC-FR-080; REQ-KTDA-SRC-001 | Ready |
| US-SRC-006-02 | As a shopper, I want to move through the category tree in several ways, so that I find products easily whatever my experience. | REQ-MPC-UX-004; Inference from REQ-MPC-UX-001 (no measurable criterion) | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-006-01-01 | US-SRC-006-01 | **Given** CategoryBreadcrumbEnabled is on, **when** the shopper opens a sub-category page, **then** the breadcrumb shows the path from the home page. | D; FIT |
| AC-SRC-006-01-02 | US-SRC-006-01 | **Given** a category has published sub-categories, **when** its page is opened, **then** the sub-categories are shown with pictures, and if ShowProductsFromSubcategories is on their products are listed too. | D; REQ-MPC-FR-080; FIT |
| AC-SRC-006-01-03 | US-SRC-006-01 | **Given** products are marked IsFeaturedProduct in a category, **when** its page is opened, **then** they are shown in the featured block; they also appear in the normal list only if IncludeFeaturedProductsInNormalLists is on. | D; REQ-MPC-FR-080; FIT |
| AC-SRC-006-01-04 | US-SRC-006-01 | **Given** AllowProductViewModeChanging is on, **when** the shopper switches between grid and list, **then** the list is shown in the chosen view; DefaultViewMode applies on first visit; page sizes follow DefaultCategoryPageSizeOptions. | D; REQ-KTDA-SRC-001; FIT |
| AC-SRC-006-02-01 | US-SRC-006-02 | **Given** the main menu is configured with categories (native menus, Libraries/Nop.Core/Domain/Menus), **when** the shopper opens the menu, **then** categories can be reached from the menu, the category pages and the breadcrumb. | REQ-MPC-UX-004; Inference from REQ-MPC-UX-001 (no measurable criterion); FIT |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.7 PRD-SRC-007 Merchandising widgets and landing pages

| Item | Value |
|---|---|
| Description (baseline) | Tools for marketing staff to build menus, sliders, product carousels, curated collections and campaign pages scheduled to appear on set dates. Labels ('ribbons') such as 'New' or 'Sale' can be shown on product pictures. |
| Why it matters | Promotions and seasonal campaigns without developers. |
| Who benefits | Marketing staff |
| Phase | P1 |
| Implementation | Licensed plugin — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-007-01 | As a member of marketing staff, I want to build menus, sliders, product carousels and curated collections without developers, so that promotions run on time. | D; REQ-KTDA-SRC-001 | Ready |
| US-SRC-007-02 | As a member of marketing staff, I want banners and featured categories that appear and disappear on set dates, so that campaigns start and stop by themselves. | D; REQ-MPC-FR-082 | Ready |
| US-SRC-007-03 | As a member of marketing staff, I want campaign landing pages made of configurable blocks, so that each campaign has its own page. | REQ-MPC-FR-094 | Ready |
| US-SRC-007-04 | As a shopper, I want labels such as "New" or "Sale" on product pictures, so that I notice offers. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-007-01-01 | US-SRC-007-01 | **Given** the user has ContentManagement.MenusCreateEditDelete, **when** they add menu items of type category, manufacturer, vendor, product, topic or custom link to the main or footer menu, **then** the storefront menu shows them in the set order. | D; REQ-KTDA-SRC-001; FIT (Menu, MenuItemType; Libraries/Nop.Core/Domain/Menus) |
| AC-SRC-007-01-02 | US-SRC-007-01 | **Given** the bundled Widgets.Swiper plugin is configured with slides, **when** the home page is opened, **then** the slides rotate with the configured autoplay. | FIT (SwiperSettings) |
| AC-SRC-007-01-03 | US-SRC-007-01 | **Given** a product carousel or collection is defined by a product list or a rule (category, tag, new, on sale), **when** the page holding its widget zone is opened, **then** the carousel shows the matching published products. | D |
| AC-SRC-007-02-01 | US-SRC-007-02 | **Given** a banner or featured category has a start and an end date, **when** the storefront is opened before, during and after the window, **then** it is shown only during the window (store time zone); native Swiper slides have no dates, so dated placements come from the licensed plugin or the SRC build. | REQ-MPC-FR-082 (banners, featured categories); FIT (Slide has no dates) |
| AC-SRC-007-03-01 | US-SRC-007-03 | **Given** a campaign page is built from a topic and blocks (HTML, carousel, banner) placed in widget zones, **when** the shopper opens the campaign URL, **then** the blocks are shown in the configured order; the page is visible only between its start and end dates. | REQ-MPC-FR-094 |
| AC-SRC-007-04-01 | US-SRC-007-04 | **Given** a product has MarkAsNew on and today is inside its "mark as new" dates, or has an old price above its price, **when** its card is shown, **then** the ribbon "New" or "Sale" is shown on the picture. | D; FIT (Product.MarkAsNew, MarkAsNewStartDateTimeUtc) |

**Business rules applied:** BR-SRC-070 (§8.1).


### 7.8 PRD-SRC-008 Rules-based recommendations

| Item | Value |
|---|---|
| Description (baseline) | Shows related products, 'customers also bought', recently viewed and new arrivals using simple rules. |
| Why it matters | Customers discover more products and spend more. |
| Who benefits | Shoppers; clients |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-008-01 | As a shopper, I want related products, "customers also bought", recently viewed items and new arrivals, so that I discover more products. | D; REQ-MPC-FR-087 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-008-01-01 | US-SRC-008-01 | **Given** related products are defined for a product, **when** its page is opened, **then** the related products are shown. | D; FIT (RelatedProduct) |
| AC-SRC-008-01-02 | US-SRC-008-01 | **Given** cross-sell products are defined and ShoppingCartSettings.CrossSellsNumber is above 0, **when** the shopper opens the cart, **then** up to that number of cross-sells are shown. | D; FIT |
| AC-SRC-008-01-03 | US-SRC-008-01 | **Given** ProductsAlsoPurchasedEnabled is on, **when** a product page is opened, **then** up to ProductsAlsoPurchasedNumber products bought in the same orders are shown. | D; FIT (OrderReportService.GetAlsoPurchasedProductsIdsAsync) |
| AC-SRC-008-01-04 | US-SRC-008-01 | **Given** RecentlyViewedProductsEnabled is on, **when** the shopper has viewed products, **then** up to RecentlyViewedProductsNumber recently viewed products are shown in the recently viewed block and page (stored in a cookie). | REQ-MPC-FR-087; FIT (RecentlyViewedProductsService) |
| AC-SRC-008-01-05 | US-SRC-008-01 | **Given** NewProductsEnabled is on, **when** the shopper opens the new products page, **then** products marked as new are listed. | D; FIT |
| AC-SRC-008-01-06 | US-SRC-008-01 | **Given** a product in a recommendation block is not eligible (BR-SRC-050), **when** the block is built, **then** it is not shown. | Proposed |

**Business rules applied:** BR-SRC-050 (§8.1).


### 7.9 PRD-SRC-009 Personalised recommendations and ranking

| Item | Value |
|---|---|
| Description (baseline) | Recommends products and orders search results based on what each customer has browsed and bought, only with their consent. |
| Why it matters | More relevant suggestions for each customer. |
| Who benefits | Shoppers; clients |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-SRC-008, PRD-CAT-002 |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-009-01 | As a shopper who has given consent, I want recommendations and search results ordered by what I browse and buy, so that suggestions are more relevant to me. | D; REQ-MPC-FR-081 | Ready; conditions: OVR-REG |
| US-SRC-009-02 | As a shopper, I want no personal data used for recommendations unless I agree, so that my choice is respected. | D; REQ-MPC-FR-081 | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-009-02-01 | US-SRC-009-02 | **Given** the consent for personalisation (native GdprConsent) is not given, **when** the shopper browses and buys, **then** no behaviour event is sent to the recommendation service and only rules-based blocks (SRC-008) are shown. | REQ-MPC-FR-081 (where consented) |
| AC-SRC-009-01-01 | US-SRC-009-01 | **Given** the consent is given, **when** the shopper views products, adds to cart and buys, **then** when a recommendation provider is registered (IC-SRC-04; AI-007 when the AI pack is installed), these events are passed to it with a pseudonymous customer key only; with no provider registered no event leaves the platform. | REQ-MPC-FR-081 |
| AC-SRC-009-01-02 | US-SRC-009-01 | **Given** a registered recommendation provider (IC-SRC-04 Recommend) returns ranked product IDs for the shopper and surface, **when** a page with the recommendation widget is shown, **then** the recommended products are shown after removing products that are unpublished, hidden, or not allowed by ACL or store mapping (BR-SRC-050). | D; REQ-MPC-FR-081; Proposed (provider contract) |
| AC-SRC-009-01-03 | US-SRC-009-01 | **Given** personalised ranking is on and the shopper searches with keywords, **when** results are built, **then** the SRC search provider orders the IDs using the ranking of the registered recommendation provider (IC-SRC-04), and keeps the native relevance order when none is registered (ISearchProvider returns ordered product IDs); category listings use an SRC ordering provider (IC-SRC-02) of the CAT-002 IProductService override (decision OVR-REG). | FIT; OVR-REG |
| AC-SRC-009-02-02 | US-SRC-009-02 | **Given** the shopper withdraws consent, **when** the withdrawal is saved, **then** events stop at once and, when a recommendation provider is registered, a deletion request for the shopper's data is passed to it (IC-SRC-04 DeleteSubjectData). | Proposed |
| AC-SRC-009-01-04 | US-SRC-009-01 | **Given** no recommendation provider is registered (P1 default, AI pack not installed), or the registered provider does not answer within its timeout or is unavailable, **when** a page with the recommendation widget is shown, **then** the widget shows the native related, cross-sell or bestseller products (RelatedProduct, CrossSellProduct, bestsellers report; SRC-008, SRC-015), filtered by BR-SRC-050, and the page is not delayed beyond the timeout; this is the only fallback specification for recommendations. | Proposed; FIT (RelatedProduct, CrossSellProduct) |

**Business rules applied:** BR-SRC-080; BR-SRC-140 (§8.1).


### 7.10 PRD-SRC-010 Wishlist

| Item | Value |
|---|---|
| Description (baseline) | Customers save products to a wish list, share it by email and move items to the cart later. |
| Why it matters | Customers can come back and buy later. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-010-01 | As a shopper, I want to save products to a wish list, share it by email and move items to the cart later, so that I can come back and buy later. | D; REQ-MPC-FR-086 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-010-01-01 | US-SRC-010-01 | **Given** the shopper has PublicStore.EnableWishlist, **when** they add a product to the wish list, **then** it is saved for the shopper (registered or guest record) up to MaximumWishlistItems. | D; REQ-MPC-FR-086; FIT |
| AC-SRC-010-01-02 | US-SRC-010-01 | **Given** EmailWishlistEnabled is on, **when** the shopper sends the wish list to a friend, **then** the native message template Wishlist.EmailAFriend is sent. | D; FIT |
| AC-SRC-010-01-03 | US-SRC-010-01 | **Given** the shopper selects items in the wish list, **when** they choose "add to cart", **then** the items are added to the cart, and removed from the wish list if MoveItemsFromWishlistToCart is on. | D; FIT |
| AC-SRC-010-01-04 | US-SRC-010-01 | **Given** AllowMultipleWishlist is on, **when** the shopper creates named wish lists, **then** up to MaximumNumberOfCustomWishlist lists can be created. | FIT (CustomWishlist, Libraries/Nop.Core/Domain/Orders/CustomWishlist.cs) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.11 PRD-SRC-011 Saved searches and watch alerts

| Item | Value |
|---|---|
| Description (baseline) | Customers save a search or watch a product and are told when new matches appear, the price drops or it is back in stock. |
| Why it matters | Brings customers back at the right moment. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-011-01 | As a shopper, I want to save a search and be told when new matching products appear, so that I come back at the right moment. | D; FC-M12-011; FC-M06-008 | Ready |
| US-SRC-011-02 | As a shopper, I want to watch a product and be told when its price drops or it is back in stock, so that I buy when it suits me. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-011-01-01 | US-SRC-011-01 | **Given** the shopper is registered and has Search.Core.SavedSearches.Use, **when** they save the current search (keywords and filters), **then** it is stored up to the per-customer limit; above the limit message Src.SavedSearchLimit is shown. | D; Proposed (limit) |
| AC-SRC-011-01-02 | US-SRC-011-01 | **Given** a saved search exists, **when** the alert task runs and products published since the last run match it, **then** SRC asks TRK-005 to send one alert listing the new matches (IC-TRK-04 SendEvent, event code Src.SavedSearchMatch registered by SRC at installation through RegisterEventCode, email as the default channel); TRK applies the channels and TRK-006 opt-outs; nothing is sent when there are no new matches. | D; FC-M12-011; Proposed (event code) |
| AC-SRC-011-02-01 | US-SRC-011-02 | **Given** the shopper watches a product at price P, **when** the price falls below P, **then** one price-drop alert is sent for that drop through TRK-005 (IC-TRK-04 SendEvent, event code Src.PriceDrop). | D; Proposed (event code) |
| AC-SRC-011-02-02 | US-SRC-011-02 | **Given** AllowBackInStockSubscriptions is on and the product is out of stock, **when** the shopper subscribes to "notify me" and stock returns, **then** the native message template Customer.BackInStock is sent; MaximumBackInStockSubscriptions limits subscriptions per customer. | D; FIT (BackInStockSubscriptionService) |
| AC-SRC-011-01-03 | US-SRC-011-01 | **Given** an alert is received, **when** the shopper uses its unsubscribe link, **then** the saved search or watch is stopped. | Proposed |

**Business rules applied:** BR-SRC-140 (§8.1).


### 7.12 PRD-SRC-012 Search history

| Item | Value |
|---|---|
| Description (baseline) | Shows the customer's recent searches and recently viewed products so they can repeat them with one tap. |
| Why it matters | Saves time for returning customers. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-012-01 | As a shopper, I want to see my recent searches and recently viewed products and repeat a search with one tap, so that I save time. | D; FC-M12-012 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-012-01-01 | US-SRC-012-01 | **Given** a shopper searches, **when** the native ProductSearchEvent is published, **then** Withdrawn (VER-500): now native — the search model factory inserts one SearchTerm row per search with the customer, store and time, so no SRC consumer of ProductSearchEvent is built. | VER-500; FIT (CatalogModelFactory.cs:1781-1790; SearchTerm.cs:21-26) |
| AC-SRC-012-01-02 | US-SRC-012-01 | **Given** the shopper has recent searches, **when** they focus the search box, **then** Withdrawn (VER-500): now native — with CatalogSettings.ShowSearchTermHistory on, focusing the empty search box lists the customer's own recent terms for the store (up to NumberOfSearchTermHistoryItems) and choosing one runs that search; verified by AC-SRC-012-01-05. | VER-500; FIT (CatalogController.cs:413-424; Views/Shared/Components/SearchBox/Default.cshtml:71-122) |
| AC-SRC-012-01-03 | US-SRC-012-01 | **Given** the shopper chooses "clear history", **when** the request is confirmed, **then** Withdrawn (VER-500): now native — the shopper removes terms one at a time from the history list (CatalogController.DeleteProductSearchTermItems), verified by AC-SRC-012-01-06; a one-step "clear all" for the shopper is not native and is not built (open item); message Src.HistoryCleared is not used. | VER-500; FIT (CatalogController.cs:427-438) |
| AC-SRC-012-01-04 | US-SRC-012-01 | **Given** the customer record is deleted under the data-protection functions, **when** deletion runs, **then** the SRC erasure provider (BR-SRC-140, IC-IAM-08) hard-deletes every SearchTerm row of the customer, including rows already soft-deleted by the shopper, through IRepository<SearchTerm>.DeleteAsync(predicate); native erasure does not delete search terms. | Proposed; NFR-X-002; FIT (GdprService.PermanentDeleteCustomerAsync has no SearchTerm deletion; EntityRepository.cs:500-505 bulk delete) |
| AC-SRC-012-01-05 | US-SRC-012-01 | **Given** CatalogSettings.ShowSearchTermHistory is on and NumberOfSearchTermHistoryItems is set (install and 5.00 upgrade default: on, 10), **when** a shopper (registered or guest record) who has searched focuses the empty search box, **then** only that customer's own most recent terms for the current store are listed, at most NumberOfSearchTermHistoryItems, and choosing one runs the search; no term of another customer is listed. | VER-500; FIT (CatalogController.cs:413-424; SearchTermService.SearchTermHistoryItemsAsync; InstallRequiredData.cs:1566-1567) |
| AC-SRC-012-01-06 | US-SRC-012-01 | **Given** a term is in the shopper's history list, **when** the shopper deletes it from the list, **then** the term no longer appears in that shopper's history; its rows are soft-deleted (SearchTerm.Deleted) and still counted in the admin popular-search-terms report. | VER-500; FIT (CatalogController.cs:427-438; SearchTermService.cs:44-65, 121-140) |

**Business rules applied:** BR-SRC-140 (§8.1).


### 7.13 PRD-SRC-013 Product comparison

| Item | Value |
|---|---|
| Description (baseline) | Customers put chosen products side by side to compare their details. |
| Why it matters | Easier, better-informed choices. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-013-01 | As a shopper, I want to put chosen products side by side and compare their details, so that I make a better-informed choice. | D; REQ-KTDA-CAT-003; REQ-MPC-FR-085 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-013-01-01 | US-SRC-013-01 | **Given** CompareProductsEnabled is on, **when** the shopper adds products to the comparison list, **then** up to CompareProductsNumber products are kept; adding one more removes the oldest. | REQ-KTDA-CAT-003; FIT |
| AC-SRC-013-01-02 | US-SRC-013-01 | **Given** products in the comparison list have specification attributes, **when** the shopper opens the comparison page, **then** name, price and each specification attribute are shown side by side, and the short and full descriptions if IncludeShortDescriptionInCompareProducts / IncludeFullDescriptionInCompareProducts are on. | REQ-MPC-FR-085 (selected attributes); FIT |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.14 PRD-SRC-014 Search engine: relevance, synonyms, multilingual

| Item | Value |
|---|---|
| Description (baseline) | A more powerful search engine that ranks the best matches first, understands synonyms and word forms, tolerates typing mistakes and works across languages. Administrators can set boosting rules (for example by category, featured items or location), and every change to these rules is recorded. |
| Why it matters | Customers find what they mean, not only exact words. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-014-01 | As a shopper, I want the best matches ranked first, including synonyms, other word forms and small typing mistakes, so that I find what I mean, not only exact words. | D | On hold: PAID-STUB |
| US-SRC-014-02 | As a shopper, I want to search in my language with a fallback when nothing matches, so that I can search in any language the shop offers. | D; REQ-MPC-FR-095; FC-M12-004 | On hold: PAID-STUB |
| US-SRC-014-03 | As a catalogue manager, I want to set boosting rules by category, featured status and location, with every change recorded, so that we tune results without developers and can show who changed what. | D; REQ-MPC-FR-090 | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-014-01-01 | US-SRC-014-01 | **Given** the SRC provider plugin is installed and named in CatalogSettings.ActiveSearchProviderSystemName, **when** the shopper searches with keywords, **then** the provider returns an ordered list of product IDs; native code then applies store mapping, ACL, published, deleted and availability-date filters and keeps the provider order when the sort is "position" (BR-SRC-002). | FIT (ISearchProvider; ProductService.cs:937-951, 1176; ProductExtensions.cs:99) |
| AC-SRC-014-01-02 | US-SRC-014-01 | **Given** the bundled Search.Lucene plugin is installed, **when** the administrator looks for a search provider to select, **then** it is not selectable and nothing changes, because it implements IMiscPlugin and not ISearchProvider (PAID-STUB). | FIT (LuceneSearchProvider.cs:10, Search.Lucene 5.00.3) |
| AC-SRC-014-01-03 | US-SRC-014-01 | **Given** a synonym group "A, B" is saved for language L, **when** the shopper searches A in language L, **then** products matching B are also returned. | D |
| AC-SRC-014-01-04 | US-SRC-014-01 | **Given** a stemmer exists for language L, **when** the shopper searches the plural of a word in a product name, **then** the product with the singular form is found. | D |
| AC-SRC-014-01-05 | US-SRC-014-01 | **Given** the allowed typing distance is set, **when** the shopper misspells a word by that many characters, **then** the intended product is found, ranked below exact matches. | D; Proposed (distance setting) |
| AC-SRC-014-02-01 | US-SRC-014-02 | **Given** two or more languages are published and the working language is L, **when** the shopper searches, **then** the provider searches the localized values in L, reading the language from IWorkContext because ISearchProvider.SearchProductsAsync receives only the keywords and an isLocalized flag; when nothing matches in L it searches the default language. | REQ-MPC-FR-095; FC-M12-004; FIT |
| AC-SRC-014-03-01 | US-SRC-014-03 | **Given** a boosting rule raises category C (or featured products, or products stocked in the shopper's district) by a weight, **when** the shopper searches a term matching products inside and outside C equally, **then** products in C are ranked first. | REQ-MPC-FR-090 |
| AC-SRC-014-03-02 | US-SRC-014-03 | **Given** the user has Search.Core.Relevance.CreateEditDelete, **when** they create, change, enable or disable a boosting rule or synonym group, **then** the change is saved as a new version and audited with user, time, old and new values (AUD-SRC-001); users with Search.Core.Relevance.View can read the history. | REQ-MPC-FR-090 (audit of changes) |
| AC-SRC-014-01-06 | US-SRC-014-01 | **Given** the provider index is behind the database, **when** an unpublished product is still in the index, **then** it is not shown, because native filters run after the provider. | FIT |
| AC-SRC-014-01-07 | US-SRC-014-01 | **Given** an administrator searches products in the admin area, **when** the search runs, **then** the native standard search is used (the provider is not called when showHidden is set). | FIT |
| AC-SRC-014-01-08 | US-SRC-014-01 | **Given** an AI recommendation provider (Google AI Commerce Search, SRC-001) and the SRC ISearchProvider are both active for the store, **when** the shopper searches with keywords, **then** the AI provider answers first; the SRC provider, its synonyms and its boosting rules are used only when the AI provider returns nothing or fails and ArtificialIntelligenceSettings.UseStandardSearchWhenNoResults is on; the client configuration names one primary relevance engine per store (BR-SRC-150). | VER-500; FIT (ProductService.cs:899-951) |
| AC-SRC-014-01-09 | US-SRC-014-01 | **Given** the SRC provider returns an empty list for the keywords, **when** the search completes, **then** with CatalogSettings.UseStandardSearchWhenNoResults on, the native standard search runs with the keywords (5.00: an empty provider result also falls back, not only an exception). | VER-500; FIT (ProductService.cs:941-951) |

**Business rules applied:** BR-SRC-001; BR-SRC-002; BR-SRC-040; BR-SRC-150 (§8.1).


### 7.15 PRD-SRC-015 Trending and bestsellers

| Item | Value |
|---|---|
| Description (baseline) | Lists of best sellers, most viewed and trending products by region or category. |
| Why it matters | Shows customers what is popular. |
| Who benefits | Shoppers; marketing staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-015-01 | As a shopper, I want lists of best sellers, most viewed and trending products by region or category, so that I see what is popular. | D; FC-M12-009 | Ready |
| US-SRC-015-02 | As a member of marketing staff, I want those lists to refresh by themselves, so that I do not maintain them by hand. | D; FC-M12-009 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-015-01-01 | US-SRC-015-01 | **Given** ShowBestsellersOnHomepage is on, **when** the home page is opened, **then** up to NumberOfBestsellersOnHomepage best sellers are shown. | FIT (OrderReportService.BestSellersReportAsync) |
| AC-SRC-015-01-02 | US-SRC-015-01 | **Given** the aggregation task has run, **when** a category page or region page with the trending widget is opened, **then** most viewed and trending products for that category or for the region of the shopper's chosen district are listed. | D |
| AC-SRC-015-02-01 | US-SRC-015-02 | **Given** the refresh interval is set, **when** the interval passes, **then** the aggregation task recalculates views and sales per product, category and region; trending = growth of views and units sold in the latest window compared with the previous window (Proposed). | D; FC-M12-009; Proposed |
| AC-SRC-015-01-03 | US-SRC-015-01 | **Given** a product in a list is not eligible (BR-SRC-050), **when** the widget is built, **then** it is not shown. | Proposed |

**Business rules applied:** BR-SRC-050 (§8.1).


### 7.16 PRD-SRC-016 Taxonomy governance

| Item | Value |
|---|---|
| Description (baseline) | A controlled process to propose, approve and retire product categories, with a record of changes. |
| Why it matters | Keeps the category structure tidy as the catalogue grows. |
| Who benefits | Catalogue managers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-016-01 | As a catalogue manager, I want to propose a new category, a change or the retirement of a category, so that the category structure stays tidy as the catalogue grows. | D; REQ-MPC-FR-099; REQ-MPC-FR-309 | On hold: WF-ENG |
| US-SRC-016-02 | As a catalogue manager, I want proposals approved by another person, with every step recorded, so that changes are controlled and can be audited. | D; REQ-MPC-FR-099 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-016-01-01 | US-SRC-016-01 | **Given** the user has Search.Core.Taxonomy.Propose, **when** they submit a new-category proposal with name, parent and reason, **then** the proposal is Submitted and no category is visible in the storefront (SM-SRC-02). | REQ-MPC-FR-099 (propose); REQ-MPC-FR-309 |
| AC-SRC-016-02-01 | US-SRC-016-02 | **Given** a proposal is Submitted, **when** another user with Search.Core.Taxonomy.Approve approves it, **then** the category is created or changed through ICategoryService and the proposal becomes Approved; the proposer cannot approve their own proposal (message Src.CannotApproveOwn). | REQ-MPC-FR-099 (approve) |
| AC-SRC-016-02-02 | US-SRC-016-02 | **Given** a proposal is Submitted, **when** the approver rejects it with a reason, **then** the proposal becomes Rejected and nothing changes in the category tree. | REQ-MPC-FR-099 |
| AC-SRC-016-01-02 | US-SRC-016-01 | **Given** a retirement proposal is approved for a category, **when** it is applied, **then** the category is unpublished, no new product can be mapped to it and a list of its products that need another category is produced. | REQ-MPC-FR-099 (deprecate) |
| AC-SRC-016-01-03 | US-SRC-016-01 | **Given** SRC-016 is active, **when** a user posts the native category Create, Edit, Delete, DeleteSelected or ImportFromXlsx action, **then** an SRC action filter refuses it with message Src.UseTaxonomyWorkflow; only the governance service changes the tree (BR-SRC-060). | FIT (Admin CategoryController) |
| AC-SRC-016-02-03 | US-SRC-016-02 | **Given** any proposal changes status, **when** it is saved, **then** user, time, old and new values are audited (AUD-SRC-002). | REQ-MPC-FR-099 (audit trail); REQ-MPC-FR-309 |

**Business rules applied:** BR-SRC-060 (§8.1).


### 7.17 PRD-SRC-017 Seller badges and featured sellers

| Item | Value |
|---|---|
| Description (baseline) | Badges such as 'verified' or 'top rated' for sellers, and featured sellers for set dates. |
| Why it matters | Builds buyer trust and rewards good sellers. |
| Who benefits | Shoppers; sellers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-017-01 | As a shopper, I want badges such as "verified" or "top rated" on sellers, so that I trust the seller. | D; REQ-MPC-FR-083 | Ready |
| US-SRC-017-02 | As a member of marketing staff, I want to feature sellers for set dates, so that good sellers are rewarded. | D; REQ-MPC-FR-082 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-017-01-01 | US-SRC-017-01 | **Given** the user has Search.Core.Badges.CreateEditDelete, **when** they create a badge type with name and icon and assign it to a seller, **then** the badge is shown on the seller page, on product pages of that seller and on product cards through the productbox_addinfo widget zones. | REQ-MPC-FR-083; FIT (_ProductBox.cshtml widget zones) |
| AC-SRC-017-01-02 | US-SRC-017-01 | **Given** a badge assignment has an end date, **when** the date passes, **then** the badge is no longer shown. | Proposed |
| AC-SRC-017-01-03 | US-SRC-017-01 | **Given** a seller is deactivated (Vendor.Active off), **when** any page is shown, **then** none of the seller's badges or featured placements are shown. | Proposed |
| AC-SRC-017-02-01 | US-SRC-017-02 | **Given** a seller is featured with start and end dates, **when** the home page is opened before, during and after the window, **then** the seller appears in the featured-sellers block only during the window. | REQ-MPC-FR-082 (featured sellers) |

**Business rules applied:** BR-SRC-070 (§8.1).


### 7.18 PRD-SRC-018 Delivery promise on listing cards

| Item | Value |
|---|---|
| Description (baseline) | Product tiles in search results show the expected delivery time and whether pickup is available. |
| Why it matters | Customers can choose by delivery speed before opening the product. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | PRD-LOG-005 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-018-01 | As a shopper, I want product cards in lists to show the expected delivery time and whether pickup is available, so that I choose by delivery speed before opening the product. | D; REQ-MPC-FR-088 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-018-01-01 | US-SRC-018-01 | **Given** LOG-005 provides a delivery window for the product and the shopper's district (or the store default when none is chosen), **when** a listing page is shown, **then** each card shows the window through a widget in the productbox_addinfo_middle zone. | REQ-MPC-FR-088 (listing cards) |
| AC-SRC-018-01-02 | US-SRC-018-01 | **Given** the same data exists, **when** the product page is opened, **then** the same window is shown on the product page. | REQ-MPC-FR-088 (product pages) |
| AC-SRC-018-01-03 | US-SRC-018-01 | **Given** the product can be picked up at an outlet in the shopper's district (SRC-004), **when** a listing page is shown, **then** the card shows "Pickup available" (locale key Src.PickupAvailable). | REQ-MPC-FR-088 (pickup availability) |
| AC-SRC-018-01-04 | US-SRC-018-01 | **Given** no delivery window can be calculated for a product, **when** its card is shown, **then** no delivery text is shown. | Proposed |
| AC-SRC-018-01-05 | US-SRC-018-01 | **Given** a listing page with many cards is shown, **when** the cards are built, **then** the windows are read from the LOG-005 precomputed DeliveryWindowCache through IC-LOG-06, not from a shipping-rate call per card. | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.19 PRD-SRC-019 Search result eligibility

| Item | Value |
|---|---|
| Description (baseline) | Rules that hide unpublished, suspended or out-of-stock products from search results. |
| Why it matters | Customers do not see things they cannot buy. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-019-01 | As a shopper, I want search results without unpublished, suspended or out-of-stock items, according to rules the client sets, so that I do not see things I cannot buy. | D; REQ-MPC-FR-098 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-019-01-01 | US-SRC-019-01 | **Given** a product is unpublished, deleted or outside its availability dates, **when** the shopper searches, **then** it is not in the results. | REQ-MPC-FR-098 (unpublished); FIT (SearchProductsAsync) |
| AC-SRC-019-01-02 | US-SRC-019-01 | **Given** a seller is suspended under SEL-003 (Vendor.Active false and a listing pause with reason SellerSuspended through CAT-022, BR-SEL-006), **when** the shopper searches or opens a category, **then** the seller's products are not listed, because the paused listings have Published false and native search excludes unpublished products; SRC adds no vendor-status filter, since SearchProductsAsync has none. | REQ-MPC-FR-098 (suspended); FIT (no vendor Active filter in SearchProductsAsync); (BR-SEL-006) |
| AC-SRC-019-01-03 | US-SRC-019-01 | **Given** SEL-003 reinstates the seller and the SellerSuspended pause reason is cleared, **when** the shopper searches, **then** the listings that return to Published are listed again; SRC changes no product data. | Proposed |
| AC-SRC-019-01-04 | US-SRC-019-01 | **Given** the rule "hide out-of-stock items in search" is on, **when** a product manages stock, does not allow backorders and has sellable stock 0 or less, **then** it is not in the search results. | REQ-MPC-FR-098 (out-of-stock, configurable rules) |
| AC-SRC-019-01-05 | US-SRC-019-01 | **Given** the rule is off, **when** the same product matches a search, **then** it is listed and its page shows the native out-of-stock text. | REQ-MPC-FR-098 (configurable rules) |
| AC-SRC-019-01-06 | US-SRC-019-01 | **Given** a product has LowStockActivity Unpublish, **when** its stock reaches MinStockQuantity, **then** the product is unpublished by native code and disappears from results. | FIT |
| AC-SRC-019-01-07 | US-SRC-019-01 | **Given** an administrator searches in the admin area, **when** the search runs, **then** eligibility rules of this feature are not applied. | Proposed |

**Business rules applied:** BR-SRC-050 (§8.1).


### 7.20 PRD-SRC-020 Services browsing area

| Item | Value |
|---|---|
| Description (baseline) | A separate area of the shop for the operator's own services, such as postal, logistics or financial services. |
| Why it matters | Services are easy to find apart from goods. |
| Who benefits | Shoppers; Malawi Post |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | On hold: FG-06 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-020-01 | As a shopper, I want a separate area for the operator's own services such as postal, logistics or financial services, so that services are easy to find apart from goods. | D; REQ-MPC-FR-100 | On hold: FG-06 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-020-01-01 | US-SRC-020-01 | **Given** a root category for services with sub-categories, a main-menu entry and a topic landing page are configured, **when** the shopper opens the services menu entry, **then** the landing page and the services categories are shown apart from the goods categories. | REQ-MPC-FR-100; FIT (Menu, Category, Topic) |
| AC-SRC-020-01-02 | US-SRC-020-01 | **Given** services categories use ACL or store mapping, **when** a shopper without access opens the store, **then** the services area is not shown to them. | FIT |
| AC-SRC-020-01-03 | US-SRC-020-01 | **Given** a service in the area is opened, **when** the shopper reads it, **then** the service page shows its description; ordering follows the SVC flow (SVC-005). | REQ-MPC-FR-100 (service descriptions) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.21 PRD-SRC-021 Web analytics

| Item | Value |
|---|---|
| Description (baseline) | Connects to web analytics to measure what people click and buy after searching or browsing. |
| Why it matters | Shows what works so the shop can be improved. |
| Who benefits | Marketing staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-021-01 | As a member of marketing staff, I want web analytics on what people click and buy after searching or browsing, so that we see what works and improve the shop. | D; REQ-KTDA-ANL-001; REQ-MPC-FR-091 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-021-01-01 | US-SRC-021-01 | **Given** the bundled Google Analytics widget is configured with GoogleId and EnableEcommerce is on, **when** a shopper views a product, adds it to the cart and buys, **then** the e-commerce events are sent to the client's analytics property. | REQ-KTDA-ANL-001; FIT (GoogleAnalyticsSettings) |
| AC-SRC-021-01-02 | US-SRC-021-01 | **Given** the native search-term statistics run, **when** shoppers search, **then** each search is stored as a SearchTerm row with its store (and, from 5.00, the customer, which SRC-012 uses as history) and the admin popular-search-terms report lists the terms by number of searches. | REQ-MPC-FR-091 (search analytics); FIT (SearchTerm; SearchTermService.GetStatsAsync; Admin CommonController.PopularSearchTermsReport, CommonController.cs:489) |
| AC-SRC-021-01-03 | US-SRC-021-01 | **Given** the Facebook Pixel widget is configured, **when** pages are viewed, **then** the pixel events are sent. | FIT |
| AC-SRC-021-01-04 | US-SRC-021-01 | **Given** the cookie consent required by the data-protection profile is not given, **when** a page is shown, **then** analytics scripts are not loaded. | Proposed; NFR-X-002 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.22 PRD-SRC-022 Accessible search and navigation

| Item | Value |
|---|---|
| Description (baseline) | Search and menus can be used with a keyboard only and are labelled for screen readers. |
| Why it matters | People with disabilities can find products. |
| Who benefits | Shoppers with disabilities |
| Phase | P1 |
| Implementation | Code-level — Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-022-01 | As a shopper with a disability, I want to use search and menus with a keyboard only and with a screen reader, so that I can find products. | D; REQ-MPC-FR-092 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-022-01-01 | US-SRC-022-01 | **Given** the shopper uses only the keyboard, **when** they move to the search box, type, move through suggestions with the arrow keys and press Enter, **then** the chosen suggestion or the results page opens; focus is always visible. | REQ-MPC-FR-092 (keyboard) |
| AC-SRC-022-01-02 | US-SRC-022-01 | **Given** the shopper uses only the keyboard, **when** they use the filters and the main and footer menus, **then** every filter and menu item can be reached, opened and applied with the keyboard. | REQ-MPC-FR-092 (keyboard) |
| AC-SRC-022-01-03 | US-SRC-022-01 | **Given** a screen reader is used, **when** the search box, suggestions list, filters and menus are read, **then** each has a label from a locale resource and the number of suggestions is announced. | REQ-MPC-FR-092 (screen-reader labels); FIT (search box has aria-label only) |
| AC-SRC-022-01-04 | US-SRC-022-01 | **Given** the accessibility audit (PLT-018) runs on search and navigation, **when** it completes, **then** no WCAG 2.1 AA failure remains on these pages. | NFR-X-005 (Proposed level) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.23 PRD-SRC-023 Low-connectivity resilience

| Item | Value |
|---|---|
| Description (baseline) | When the internet connection is weak, search shows clear messages and retries instead of failing. |
| Why it matters | Works for customers on slow mobile networks. |
| Who benefits | Shoppers in low-connectivity areas |
| Phase | P1 |
| Implementation | Code-level — Theme/view override |
| Depends on | PRD-CHN-002 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-023-01 | As a shopper on a weak mobile connection, I want search to show a message and let me retry instead of failing, so that I can still search. | D; REQ-MPC-FR-096 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-023-01-01 | US-SRC-023-01 | **Given** a search or suggestion request takes longer than the configured timeout, **when** the timeout passes, **then** message Src.SearchSlow is shown with a retry button and the typed text is kept. | REQ-MPC-FR-096 |
| AC-SRC-023-01-02 | US-SRC-023-01 | **Given** the browser reports that it is offline, **when** the shopper submits a search, **then** message Src.Offline is shown and the search is sent once automatically when the browser reports it is online again. | REQ-MPC-FR-096 |
| AC-SRC-023-01-03 | US-SRC-023-01 | **Given** retries keep failing, **when** the configured number of retries is reached, **then** no more automatic retries are made and the retry button stays. | Proposed |
| AC-SRC-023-01-04 | US-SRC-023-01 | **Given** suggestions fail to load, **when** the shopper presses Enter, **then** the normal search page request is still sent. | Proposed |

**Business rules applied:** BR-SRC-110 (§8.1).


### 7.24 PRD-SRC-024 Search API for channels

| Item | Value |
|---|---|
| Description (baseline) | A technical search service that other channels (USSD, SMS, kiosks) can use. |
| Why it matters | Customers without smartphones can still search. |
| Who benefits | Shoppers on basic phones |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-024-01 | As a channel system (USSD, SMS or kiosk), I want a search service I can call, so that customers without smartphones can still search. | D; REQ-MPC-FR-097 | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-024-01-01 | US-SRC-024-01 | **Given** a channel system is registered as an API client in INT-001 and holds a token (OAuth 2.0, decision API-GW) with scope search.read (BR-INT-006), **when** it calls the search endpoint with keywords, page, page size and language, **then** it receives product ID, name, price, availability text and product URL, built with the same SearchProductsAsync, provider and eligibility rules as the storefront. | REQ-MPC-FR-097 |
| AC-SRC-024-01-02 | US-SRC-024-01 | **Given** the token is missing, expired or revoked, or lacks scope search.read, **when** the endpoint is called, **then** it answers 401 (or 403 outside the scope or store) and no data (BR-INT-002). | Proposed; API-GW |
| AC-SRC-024-01-03 | US-SRC-024-01 | **Given** a client exceeds its INT-001 per-client rate limit, **when** it calls again, **then** it answers 429 (BR-INT-004). | Proposed; API-GW |
| AC-SRC-024-01-04 | US-SRC-024-01 | **Given** the compact format is requested, **when** results are returned, **then** each result has only ID, a shortened name and price, for SMS or USSD screens. | Proposed |

**Business rules applied:** BR-SRC-090 (§8.1).


### 7.25 PRD-SRC-025 Unified search

| Item | Value |
|---|---|
| Description (baseline) | One search box that finds products, the user's orders, quotes and their own records. |
| Why it matters | Users find anything from one place. |
| Who benefits | Shoppers; business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-025-01 | As a business buyer, I want one search box that finds products, my orders, my quotes and my own records, so that I find anything from one place. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-025-01-01 | US-SRC-025-01 | **Given** a signed-in buyer searches a term, **when** the unified results page is shown, **then** results are grouped into products, own orders (order number or custom order number), own RFQ requests and quotes (Misc.RFQ) and own account records, each group with a link to its page. | D |
| AC-SRC-025-01-02 | US-SRC-025-01 | **Given** a guest searches, **when** the page is shown, **then** only products are returned. | Proposed |
| AC-SRC-025-01-03 | US-SRC-025-01 | **Given** a term matches another customer's order number, **when** a buyer searches it, **then** the order is not returned. | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.26 PRD-SRC-026 Search performance and freshness

| Item | Value |
|---|---|
| Description (baseline) | Search answers within a target time, and new or changed products appear in results immediately. |
| Why it matters | Customers see current stock and prices in search results without delay. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-026-01 | As a shopper, I want search to answer quickly and show new or changed products at once, so that I see current stock and prices. | D; FC-M12-014 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-026-01-01 | US-SRC-026-01 | **Given** no provider is selected, **when** a product is published or its price changes, **then** the next search shows the change, because native search queries the database. | FIT; FC-M12-014 |
| AC-SRC-026-01-02 | US-SRC-026-01 | **Given** the SRC provider is selected, **when** a product is created, changed or deleted, **then** an entity-event consumer queues the product for re-indexing and the index task applies it within the configured interval; until then native filters still hide unpublished or deleted products. | FC-M12-014; Proposed |
| AC-SRC-026-01-03 | US-SRC-026-01 | **Given** the SRC provider is selected and CAT raises Listing.StateChanged for a product, **when** the SRC consumer receives the event, **then** it only queues the product for re-indexing; the index task keeps the product in the index only while its listing state is Published (BR-CAT-005); native filters after the provider still hide any product that is no longer published. | D (BR-CAT-005); FIT (consumers swallow exceptions); Proposed |
| AC-SRC-026-01-04 | US-SRC-026-01 | **Given** a response-time target is approved, **when** the load test runs, **then** the 95th percentile of search response time is reported against the target. | Proposed; NFR-X-009 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.27 PRD-SRC-027 Storefront conveniences

| Item | Value |
|---|---|
| Description (baseline) | Handy shop features: quick product preview, a 'buy now' button, 'email a friend' and a delivery-cost estimate on the product page. Also links to the previous and next product in the same category. |
| Why it matters | Faster, easier buying. |
| Who benefits | Shoppers |
| Phase | P2 |
| Implementation | Licensed plugin — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SRC-027-01 | As a shopper, I want quick product preview, a "buy now" button, "email a friend", a delivery-cost estimate on the product page and links to the previous and next product, so that I buy faster and more easily. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SRC-027-01-01 | US-SRC-027-01 | **Given** EmailAFriendEnabled is on, **when** the shopper sends a product to a friend, **then** the native message template Service.EmailAFriend is sent. | D; FIT (CatalogSettings.EmailAFriendEnabled) |
| AC-SRC-027-01-02 | US-SRC-027-01 | **Given** EstimateShippingProductPageEnabled is on, **when** the shopper enters a destination on the product page, **then** the shipping options and costs are estimated. | D; FIT |
| AC-SRC-027-01-03 | US-SRC-027-01 | **Given** the quick-view plugin is installed, **when** the shopper uses quick view on a card, **then** a preview of the product opens without leaving the list. | D; FIT (licensed plugin; 5.00 build to confirm, VER-500) |
| AC-SRC-027-01-04 | US-SRC-027-01 | **Given** the buy-now function is installed, **when** the shopper presses "buy now", **then** the product is added to the cart and checkout opens. | D; FIT (licensed plugin; 5.00 build to confirm, VER-500) |
| AC-SRC-027-01-05 | US-SRC-027-01 | **Given** previous / next links are installed, **when** the shopper opens a product in a category, **then** links to the previous and next product of that category are shown. | D; FIT (licensed plugin; 5.00 build to confirm, VER-500) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-SRC-001 | Keyword search runs through IProductService.SearchProductsAsync. Without a provider it is the native database search: LIKE (string.Contains) on names (and descriptions or tags only when the advanced options are ticked), equality on SKU and manufacturer part number, localized names when two or more languages are published. With the SRC provider selected (CatalogSettings.ActiveSearchProviderSystemName), keyword search on the storefront, in suggestions and in the search API uses the provider; admin searches (showHidden) always use the native search. In 5.00 an active AI recommendation provider is called before the ISearchProvider (BR-SRC-150). | SRC-001, SRC-002, SRC-014, SRC-024 | FIT (ProductService.cs:822-1178; AI provider 899-933; ISearchProvider 937-951) |
| BR-SRC-002 | The provider returns product IDs in relevance order for the keywords only. Native code then applies store mapping, ACL, published, deleted, availability dates, category, manufacturer, price and specification filters; the provider order is kept only when the sort is "position". A provider error or an empty provider result falls back to the native search when CatalogSettings.UseStandardSearchWhenNoResults is on (5.00 name of UseStandardSearchWhenSearchProviderThrowsException). | SRC-001, SRC-005, SRC-009, SRC-014 | FIT (ISearchProvider.cs; ProductService.cs:937-965, 1176; ProductExtensions.cs:99) |
| BR-SRC-010 | Filters combine with OR inside one attribute and AND across attributes and filter types (native for specification attributes; Proposed for seller, in-stock and location). | SRC-003, SRC-004 | FIT; Proposed |
| BR-SRC-011 | "In stock" = the product does not manage stock, or allows backorders, or GetTotalStockQuantityAsync (including INV unsellable-lot rules) is above 0; for products managed by attributes, at least one combination has stock above 0 or allows out-of-stock orders. | SRC-003, SRC-019 | Proposed; IC-INV-04 |
| BR-SRC-012 | Seller, in-stock, location, eligibility and new sort options are implemented as search filter and ordering providers (IC-SRC-02) registered as IC-CAT-04 search filter / ordering contributors with the single IProductService override owned by CAT-002 (decision OVR-REG, BR-CAT-031); the host applies them before ordering and paging and not when showHidden is true; SRC does not override IProductService itself. The filter state comes from the request (query string) through a scoped search context. Every SRC provider, override and action filter is listed in the ADM extension register (BR-ADM-001). | SRC-003, SRC-004, SRC-005, SRC-009, SRC-019 | FIT (L1 §6.2 principle 7); OVR-REG; Proposed |
| BR-SRC-020 | Product location = the warehouses holding sellable stock of the product (INV-002 coordinates and address); district = the address field configured per client; nearby pickup = pickup points linked to such warehouses. Distance is great-circle distance in kilometres. | SRC-004 | Proposed |
| BR-SRC-030 | Popularity = units sold in the configured period (order lines of non-cancelled orders); origin = the value of the specification attribute configured as origin. Native sort values are unchanged. | SRC-005 | Proposed |
| BR-SRC-040 | Boosting rules have a dimension (category, featured, location), a weight, an on/off state and a version; synonyms are groups per language. Every create, change, enable or disable is a new version and is audited (AUD-SRC-001). Boosting changes order only, never which products are eligible. | SRC-014 | REQ-MPC-FR-090; Proposed (versioning) |
| BR-SRC-050 | A product is eligible for results, recommendations and lists only if published (Product.Published is true only while the CAT listing state is Published, BR-CAT-005), not deleted, inside its availability dates and allowed by store mapping and ACL; out-of-stock products are excluded from search results only when the client rule is on. Products of a suspended seller are excluded because SEL-003 pauses their listings (BR-SEL-006); SRC applies no vendor-status filter of its own. | SRC-008, SRC-009, SRC-015, SRC-019 | REQ-MPC-FR-098; FIT; CAT and |
| BR-SRC-060 | With SRC-016 active, the category tree changes only through approved proposals; native Admin CategoryController Create, Edit, Delete, DeleteSelected and ImportFromXlsx [POST] are refused by an SRC global action filter (Src.UseTaxonomyWorkflow). Approver and proposer must differ. The filter is listed in the ADM extension register (BR-ADM-001). | SRC-016 | REQ-MPC-FR-099; FIT (CategoryController.cs:177, 244, 350, 370, 425); Proposed (segregation) |
| BR-SRC-070 | Dated placements (banners, featured categories, featured sellers, campaign pages, badges with end date) are shown only when the current time in the store time zone is between start and end; an open end means no end. | SRC-007, SRC-017 | REQ-MPC-FR-082; Proposed |
| BR-SRC-080 | Personalisation events are sent only while the customer's personalisation consent is given; withdrawal stops sending at once and triggers a deletion request to the service. | SRC-009 | REQ-MPC-FR-081; Proposed (deletion) |
| BR-SRC-090 | The search API returns only what the storefront search would return for the same store and language; every call carries a valid INT-001 token with scope search.read; calls above the INT-001 per-client rate limit are refused (BR-INT-002, BR-INT-004). | SRC-024 | REQ-MPC-FR-097; Proposed |
| BR-SRC-110 | Search requests on the storefront have a client-side timeout and a retry limit (settings); the typed text is never lost on failure. | SRC-023 | REQ-MPC-FR-096 |
| BR-SRC-120 | Every SRC page, widget, action filter, search provider, IC-SRC-02 provider and scheduled task checks the state of its feature for the store through IC-PLT-02 (setting productfeature.<prd-id>, store then shared value) before it acts; when the feature is off the provider returns the query unchanged. Every new SRC setting key is listed in the SRC key catalogue (key, type, layer, secret flag, default); credentials and keys (recommendation service, API signing) are flagged secret (BR-PLT-013, CFG-01). | All SRC features | (AC-PLT-022-02-01, AC-PLT-003-01-04, BR-PLT-013); Proposed |
| BR-SRC-140 | Erasure and consent withdrawal: SRC registers a provider of IAM IC-IAM-08 (ErasePersonalData, ConsentWithdrawn). On erasure it deletes the customer's recent search terms (SRC-012), saved searches and alerts (SRC-011) and personalisation records, and, when a recommendation provider is registered, passes a deletion request for the pseudonymous data to it (IC-SRC-04 DeleteSubjectData; AI-007 forwards it through IC-AI-03); on withdrawal of the personalisation consent it stops events at once (BR-SRC-080). From 5.00 the native SearchTerm rows carry the customer id and are the SRC-012 history; native erasure does not delete them, so the SRC provider hard-deletes the customer's SearchTerm rows through IRepository<SearchTerm>.DeleteAsync(predicate). A provider failure keeps the IAM request InProgress. | SRC-009, SRC-011, SRC-012 | IAM-017 (IC-IAM-08, BR-IAM-092); FIT (SearchTerm.cs:21; EntityRepository.cs:500-505); Proposed |
| BR-SRC-150 | Search path configuration rule (VER-500): SearchProductsAsync calls the AI recommendation provider (ArtificialIntelligenceSettings.ActiveAIRecommendationProviderSystemName) before the ISearchProvider for every storefront keyword search, suggestion and search-API call. Every configuration pack sets ArtificialIntelligenceSettings.UseStandardSearchWhenNoResults and CatalogSettings.UseStandardSearchWhenNoResults on, because with the AI setting off a failed or empty AI search returns products without any keyword filter. The Google AI Commerce Search plugin is selected only for a client that has confirmed the transfer of catalogue data and visitor IDs to Google (Not stated in source); then the client names it or the SRC provider as the primary relevance engine of the store, and SRC boosting rules and synonyms apply only on the SRC provider path. | SRC-001, SRC-002, SRC-014, SRC-024 | VER-500; FIT (ProductService.cs:899-951; ArtificialIntelligenceSettings.cs:93; CatalogSettings.cs:617) |
| BR-SRC-130 | All SRC plugin tables are written through IRepository<>, so the SEC decorator captures old and new values (BR-SEC-010); SRC writes no data through INopDataProvider directly (provider index files are not audited data). Business events AUD-SRC-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014). | All SRC features | (BR-SEC-010, BR-SEC-011, BR-SEC-014) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-SRC-01 | BoostingRule / SynonymGroup | (none) | created | Search.Core.Relevance.CreateEditDelete | Active / Inactive (as chosen) | version 1; AUD-SRC-001 |
| SM-SRC-01 | BoostingRule / SynonymGroup | Active | disabled | Search.Core.Relevance.CreateEditDelete | Inactive | new version; AUD-SRC-001 |
| SM-SRC-01 | BoostingRule / SynonymGroup | Inactive | enabled | Search.Core.Relevance.CreateEditDelete | Active | new version; AUD-SRC-001 |
| SM-SRC-01 | BoostingRule / SynonymGroup | Active / Inactive | changed | Search.Core.Relevance.CreateEditDelete | (unchanged) | new version; AUD-SRC-001 |
| SM-SRC-02 | TaxonomyProposal | (none) | submitted | Search.Core.Taxonomy.Propose | Submitted | — |
| SM-SRC-02 | TaxonomyProposal | Submitted | approved | approver is not the proposer | Approved | category created, changed or retired through ICategoryService; AUD-SRC-002 |
| SM-SRC-02 | TaxonomyProposal | Submitted | rejected with reason | approver is not the proposer | Rejected | AUD-SRC-002 |
| SM-SRC-02 | TaxonomyProposal | Submitted | withdrawn by proposer | — | Withdrawn | AUD-SRC-002 |
| SM-SRC-03 | Placement (banner, featured category, featured seller, campaign page, badge) | Scheduled | start time reached | — | Live | shown |
| SM-SRC-03 | Placement | Live | end time reached | — | Ended | hidden |
| SM-SRC-03 | Placement | Scheduled / Live | withdrawn by staff | Search.Core.Merchandising.CreateEditDelete | Ended | hidden; AUD-SRC-003 |
| SM-SRC-04 | SavedSearch / ProductWatch | (none) | saved | registered; below limit | Active | — |
| SM-SRC-04 | SavedSearch / ProductWatch | Active | unsubscribed or deleted | — | Stopped | no alerts |
| SM-SRC-05 | IndexEntry | (none) / Indexed | product created, changed or deleted | — | Pending | queued |
| SM-SRC-05 | IndexEntry | Pending | index task applies it | — | Indexed | — |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| SynonymGroup / BoostingRule (new) | Synonym: Id, LanguageId, Terms, IsActive, Version; Boost: Id, Dimension (Category / Featured / Location), Target, Weight, IsActive, Version, ChangedBy, ChangedOnUtc | SRC-014 | Read by the SRC provider; history kept per version |
| SearchIndex (new, provider storage) | Product ID, store, language, indexed fields | SRC-014, SRC-026 | Index files or tables of the provider; not a core table |
| UnitAttributeMapping — Withdrawn (VER-500) | Was: Unit, SpecificationAttributeId | SRC-001 | Not built: everyday-language queries go to Google AI Commerce Search (AC-SRC-001-02-01); reinstated only if the client rejects Google Cloud (SRC-001 open item) |
| Placement (new) | Id, Type (Banner / FeaturedCategory / FeaturedSeller / CampaignPage / Collection / Ribbon), Target, WidgetZone, StartUtc, EndUtc, Status (SM-SRC-03), StoreId | SRC-007, SRC-017 | If the licensed plugin (5.00 build to confirm, VER-500) is used, its own tables replace this |
| SellerBadge / SellerBadgeAssignment (new) | Badge: Id, Name (localised), PictureId; Assignment: VendorId, BadgeId, EndUtc | SRC-017 | Vendor (native) unchanged |
| PickupPointWarehouse (LOG table, read only) | StorePickupPointId, WarehouseId | SRC-004, SRC-018 | Owned by LOG-003; SRC reads it through IC-LOG-06 and defines no table of its own |
| SavedSearch / ProductWatch (new) | SavedSearch: CustomerId, Query, Filters, LastRunUtc, Status (SM-SRC-04); Watch: CustomerId, ProductId, PriceAtWatch, Status | SRC-011 | Native BackInStockSubscription reused for back-in-stock |
| CustomerSearchHistory — Withdrawn (VER-500) | Was: CustomerId, Term, StoreId, SearchedOnUtc | SRC-012 | Not built: native SearchTerm holds CustomerId, StoreId, CreatedOnUtc and Deleted in 5.00 (SearchTerm.cs:6-31) |
| PopularityStats (new) | ProductId, CategoryId, Region, Window, Views, UnitsSold | SRC-005, SRC-015 | Written by the aggregation task |
| TaxonomyProposal (new) | Id, Type (New / Change / Retire), CategoryId, ProposedValues, Reason, Status (SM-SRC-02), ProposedBy, DecidedBy | SRC-016 | Category (native) changed only through ICategoryService on approval |
| Native reused | SearchTerm (5.00: one row per search with the customer; SRC-012 history and SRC-021 counts), CustomWishlist, BackInStockSubscription, RelatedProduct, CrossSellProduct, Menu / MenuItem, Topic, GdprConsent, StorePickupPoint | SRC-002 to SRC-021 | No change |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Search provider | CatalogSettings.ActiveSearchProviderSystemName, UseStandardSearchWhenNoResults (native; on in every pack, BR-SRC-150) | client | Not stated | Not stated |
| AI search provider (Google AI Commerce Search, optional) | ArtificialIntelligenceSettings.ActiveAIRecommendationProviderSystemName, UseStandardSearchWhenNoResults (native; on, BR-SRC-150); GoogleAiSettings.Enabled, SearchAllowed, EnableForRegisteredUsersOnly, ProjectId, LocationId, CatalogId, BranchId (bundled plugin); Google service-account key on the host through GOOGLE_APPLICATION_CREDENTIALS (secret, never in a pack, BR-PLT-013); bundled Widgets.GoogleAnalytics active | client instance | Not stated | Not stated |
| Search history | CatalogSettings.ShowSearchTermHistory, NumberOfSearchTermHistoryItems (native; install default on, 10) | client -> store | Not stated | Not stated |
| Search box and suggestions | CatalogSettings.ProductSearchEnabled, ProductSearchAutoCompleteEnabled, ProductSearchAutoCompleteNumberOfProducts, ShowProductImagesInSearchAutoComplete, ShowLinkToAllResultInSearchAutoComplete, ProductSearchTermMinimumLength, ShowSearchBoxCategories (native) | client -> store | Not stated | Required (FR-079); values not stated |
| Search by category / manufacturer name; search by vendor | CatalogSettings.AllowCustomersToSearchWithCategoryName, AllowCustomersToSearchWithManufacturerName; VendorSettings.AllowSearchByVendor (native) | client -> store | Not stated | Not stated |
| Filters | CatalogSettings.EnablePriceRangeFiltering, EnableSpecificationAttributeFiltering, EnableManufacturerFiltering, SearchPagePriceRangeFiltering; FilterLevelSettings (native); seller, in-stock and location facets on / off (new) | client -> store | Size, features, availability (SRC-002) | Category, price, seller, location, delivery option (FR-077) |
| Sorting | CatalogSettings.AllowProductSorting, ProductSortingEnumDisabled, ProductSortingEnumDisplayOrder (native); popularity period, origin attribute (new) | client -> store | Not stated | Relevance, price, popularity, newest, origin (FR-078) |
| Category pages | CatalogSettings.CategoryBreadcrumbEnabled, ShowProductsFromSubcategories, IncludeFeaturedProductsInNormalLists, AllowProductViewModeChanging, DefaultViewMode, DefaultCategoryPageSizeOptions (native) | client -> store | Not stated | Not stated |
| Recommendations (rules) | CatalogSettings.ProductsAlsoPurchasedEnabled / Number, RecentlyViewedProductsEnabled / Number, NewProductsEnabled; ShoppingCartSettings.CrossSellsNumber (native) | client -> store | Not stated | Recently viewed (FR-087) |
| Personalisation service and consent | AI-007 connection settings (owner AI; credentials flagged secret, BR-PLT-013); SRC consent and timeout settings (new); GdprConsent (native) | client instance | — | Where consented (FR-081) |
| Wish list | ShoppingCartSettings.EmailWishlistEnabled, MoveItemsFromWishlistToCart, AllowMultipleWishlist, MaximumNumberOfCustomWishlist, MaximumWishlistItems (native) | client -> store | Not stated | Required (FR-086) |
| Comparison | CatalogSettings.CompareProductsEnabled, CompareProductsNumber, IncludeShortDescriptionInCompareProducts, IncludeFullDescriptionInCompareProducts (native) | client -> store | Required (CAT-003) | Required (FR-085) |
| Synonyms, boosting, typing distance, unit mapping | SynonymGroup, BoostingRule, UnitAttributeMapping, SRC settings (new) | client | Not stated | Boosting by category, featured, location (FR-090) |
| Eligibility rules | SRC settings: hide out-of-stock in search, apply to category lists (new) | client | Not stated | Configurable (FR-098) |
| District field, distance radius options | SRC settings (new); pickup-point links are LOG-003 configuration | client | Not stated | District / outlet (FR-084) |
| Saved searches, history, trending | SRC settings: limits, alert frequency, trending windows and refresh (new); history size is native (Search history row) | client | Not stated | Not stated |
| Analytics | GoogleAnalyticsSettings.GoogleId, EnableEcommerce, ApiSecret (bundled plugin); Facebook Pixel (bundled) | client instance | Analytics dashboard (ANL-001) | Search and category analytics (FR-091) |
| Low-connectivity timeout and retries | SRC settings (new) | global -> client | — | Required (FR-096); values not stated |
| Feature state per store | productfeature.<prd-id> (IC-PLT-02) for SRC-001 to SRC-027 | store -> shared | Not stated | Not stated |
| Search API clients and rate limit | INT-001 API client registry (scope search.read, BR-INT-006) | client instance | — | Where implemented (FR-097) |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Search box with suggestions; search results page with advanced form, filters and sorting | SRC-001 to SRC-005, SRC-022, SRC-023 | Native extended |
| Storefront | Category pages, tag pages, menus, services area | SRC-006, SRC-020 | Native |
| Storefront | Location and nearby-pickup mode | SRC-004 | New |
| Storefront | Product cards with ribbons, badges, delivery promise, pickup availability | SRC-007, SRC-017, SRC-018 | Native card + widgets in productbox_addinfo zones |
| Storefront | Recommendation, recently viewed, also-bought, trending and featured-seller blocks | SRC-008, SRC-009, SRC-015, SRC-017 | Native + widgets |
| Storefront — My account | Wish lists; saved searches and watches; search history | SRC-010, SRC-011, SRC-012 | Native + new tabs |
| Storefront | Comparison page; conveniences (quick view, buy now, previous / next) | SRC-013, SRC-027 | Native + licensed plugins (5.00 builds to confirm, VER-500) |
| Storefront | Unified search results | SRC-025 | New (P2) |
| Admin | Menus, topics, slider, widgets, placements and collections | SRC-007, SRC-017 | Native + new / licensed |
| Admin | Synonyms and boosting rules with history | SRC-014 | New |
| Admin | Taxonomy proposals and approval queue | SRC-016 | New |
| Admin | Seller badges | SRC-017 | New |
| Admin | Popular search terms report (native); analytics plugin configuration | SRC-021 | Native |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Src.SortRelevance | Relevance | AC-SRC-005-01-02 (label of the "position" sort on the search page) |
| Src.LocationNeeded | Choose your district to use this filter. | AC-SRC-004-02-02 |
| Src.PickupAvailable | Pickup available | AC-SRC-018-01-03 |
| Src.SavedSearchLimit | You have reached the maximum number of saved searches. | AC-SRC-011-01-01 |
| Src.HistoryCleared | Withdrawn (VER-500): not used; history terms are deleted one at a time natively | AC-SRC-012-01-03 (withdrawn) |
| Src.CannotApproveOwn | You cannot approve a proposal you submitted. | AC-SRC-016-02-01 |
| Src.UseTaxonomyWorkflow | Categories are changed through a category proposal. Your changes were not saved. | AC-SRC-016-01-03 |
| Src.SearchSlow | The search is taking longer than usual. Try again. | AC-SRC-023-01-01 |
| Src.Offline | You are offline. We will search again when your connection returns. | AC-SRC-023-01-02 |
| Src.SavedSearchMatch | New products match your saved search {0}. | AC-SRC-011-01-02 (default content of the TRK event code, registered through IC-TRK-04 RegisterEventCode) |
| Src.PriceDrop | The price of {0} has dropped to {1}. | AC-SRC-011-02-01 (default content of the TRK event code) |
| Src.TaxonomyDecision | A category proposal needs your decision, or your proposal was decided: {0}. | SRC-016 notifications (default content of the TRK event code) |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Native texts used by criteria (for example Search.SearchTermMinimumLengthIsNCharacters) are native locale resources.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| AI search provider (SRC-001, SRC-014; optional) | Catalogue sync; keyword search through IAiRecommendationPlugin.SearchProductsAsync, called first by SearchProductsAsync | Google Cloud Retail through the bundled AIRecommendation.GoogleAI 5.00.01, only if the client accepts it | External SaaS; data protection and cost Not stated in source (BR-SRC-150) |
| Search provider (SRC-014) | SearchProductsAsync (IC-SRC-01); index build and update | SRC provider plugin (built) or licensed nopCommerce search plugin (PAID-STUB) | In-process plugin |
| Recommendation service (SRC-009) | Optional recommendation provider IC-SRC-04, implemented by AI-007 (P3, AI pack), which connects to the external service (IC-AI-03) | Not chosen (5.00 builds of candidates to confirm, VER-500); connection owned by AI-007 | External |
| Product service override (SRC-003, SRC-004, SRC-005, SRC-009, SRC-019) | Search filter and ordering contributors (IC-CAT-04; SRC side IC-SRC-02) | CAT-002 (decision OVR-REG) | Internal; ADM extension register (BR-ADM-001) |
| Warehouse location and sellable stock (SRC-003, SRC-004) | GetWarehouseLocation (IC-INV-05); sellable stock with lot rules (IC-INV-04) | INV-002, INV-009, INV-011 | Internal, read only |
| Web analytics (SRC-021) | Page and e-commerce events | Google Analytics, Facebook Pixel (bundled widgets) | Property owned by the client |
| Privacy requests (SRC-009, SRC-011, SRC-012) | Erasure and consent-withdrawal provider (IC-IAM-08) | IAM-017 (internal) | BR-SRC-140 |
| Channel systems (SRC-024) | Search API (IC-SRC-03); clients and tokens through INT-001 (BR-INT-002) | USSD / SMS / kiosk (CHN) | Where implemented (FR-097); decision API-GW |
| Delivery estimates and outlets (SRC-004, SRC-018) | Delivery window per product and district; outlets and serviceability (IC-LOG-06) | LOG-003, LOG-005 | Internal |
| Notifications (SRC-011, SRC-016) | SendEvent and RegisterEventCode (IC-TRK-04) for Src.SavedSearchMatch, Src.PriceDrop, Src.TaxonomyDecision; back-in-stock through the native template (IWorkflowMessageService, owned by TRK-005) | TRK-005 | Internal |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-SRC-01 | SearchProductsAsync (ISearchProvider) | Keywords, isLocalized flag; language and store read from IWorkContext / IStoreContext | Ordered list of product IDs | Exception or empty result → native search if CatalogSettings.UseStandardSearchWhenNoResults | SRC provider plugin implementing ISearchProvider, selected in CatalogSettings.ActiveSearchProviderSystemName; in 5.00 reached only when no AI recommendation provider answers first (BR-SRC-150) |
| IC-SRC-02 | Search filter / ordering provider (SRC to the CAT-002 host) | Scoped search context (seller, in stock, district, distance, delivery option, sort value), the product query before ordering and paging, showHidden | Filtered or ordered product query | — | SRC implementation of the IC-CAT-04 search filter / ordering contributor, called by the CAT-002 IProductService.SearchProductsAsync override; not called when showHidden is true (admin searches); SRC does not override IProductService |
| IC-SRC-03 | Search API GET | INT-001 token with scope search.read, keywords, page, page size, language, format (full / compact) | Product ID, name, price, availability text, URL; total count | 401, 429, 400 (validation) | SRC plugin route (IRouteProvider) calling SearchProductsAsync |
| IC-SRC-04 | Recommendation provider (defined by SRC-009; optional; implemented by AI-007) | Recommend(customer, surface); SendEvents(pseudonymous key, consented events: view, add to cart, purchase); DeleteSubjectData(pseudonymous key) | Ordered product IDs; accepted; deletion requested | Timeout or unavailable → native related, cross-sell or bestseller fallback (AC-SRC-009-01-04); no provider registered → same fallback, no events sent | SRC widget in public widget zones; at most one provider; SRC gates events by consent (BR-SRC-080) and applies BR-SRC-050 to every result |

ISearchProvider receives only the keywords and an isLocalized flag, so the provider reads language and store from the work and store context. In 5.00 SearchProductsAsync returns early with the AI recommendation provider's page when that provider answers (ProductService.cs:899-913), so the CAT-002 host must apply the IC-SRC-02 filters and ordering on that path too (CAT to confirm). C# signatures for IC-SRC-02 to IC-SRC-04 are produced at the start of the L2 build and approved by the tech lead. Under decision OVR-REG (Proposed) SRC overrides no nopCommerce service: IC-SRC-02 is the SRC implementation of the CAT IC-CAT-04 search filter / ordering contributor of the CAT-002 IProductService override. SRC also uses IC-INV-04 / IC-INV-05 (sellable stock through the CAT-002 GetTotalStockQuantityAsync override, warehouse location), IC-AI-03 (recommendations), IC-CAT-03 events (Listing.StateChanged), IC-LOG-06 (outlets, delivery windows), IC-TRK-04 (SendEvent, RegisterEventCode), IC-PLT-02 (feature state) and IC-SEC-01 (audit).

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Search performed | ProductSearchEvent (native, Nop.Web.Framework) | No SRC consumer (VER-500): the per-customer SearchTerm row is stored natively (SRC-012) |
| Product created / changed / deleted | EntityInsertedEvent / EntityUpdatedEvent / EntityDeletedEvent<Product> (native) | SRC-026 consumer queues re-indexing (the index task does the work) |
| Seller suspended or reinstated | No SRC consumer: SEL-003 pauses or clears the listing pause through CAT-022 (BR-SEL-006); Published changes and Listing.StateChanged follows | SRC-019 (through Published), SRC-026 (re-index) |
| Listing state changed | Listing.StateChanged (CAT event raised by IC-CAT-03; not native) | SRC-026 consumer queues re-indexing only |
| Relevance.RuleChanged / Taxonomy.ProposalDecided | None (SRC events only) | Audit, provider cache refresh, TRK |
| Category create / edit / delete posted | SRC action filter on Admin CategoryController (BR-SRC-060) | Refused when SRC-016 is active |
| Personalisation consent changed | Native GDPR consent change (customer record) | SRC-009 starts or stops event export |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Index update and search at the same time | SRC-014, SRC-026 | Searches read the last committed index; native filters after the provider hide products unpublished in the meantime |
| Two approvers decide the same proposal | SRC-016 | TaxonomyProposal carries its own row version (plugin table); the second decision fails and re-reads |
| Two staff change the same boosting rule | SRC-014 | Each save is a new version; the second save fails if its base version is no longer current and the user re-reads |
| Placement window boundary | SRC-007, SRC-017 | Visibility is computed from start and end times at request time, so no task is needed at the boundary |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| New matches for a saved search; price drop | Shopper | Channels of event codes Src.SavedSearchMatch and Src.PriceDrop as set in TRK-005 (IC-TRK-04; email by default); TRK-006 opt-outs apply | SRC-011 |
| Back in stock | Shopper | Email (native Customer.BackInStock) | SRC-011 |
| Taxonomy proposal awaiting decision; decision made | Approvers; proposer | Channels of event code Src.TaxonomyDecision as set in TRK-005 (IC-TRK-04) | SRC-016 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Popular search terms (native) | SRC-021 | REQ-MPC-FR-091; FIT |
| Synonym and boosting rule history | SRC-014 | REQ-MPC-FR-090 |
| Taxonomy proposal log | SRC-016 | REQ-MPC-FR-099 |
| Trending and best sellers lists | SRC-015 | D |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-SRC-001 | Synonym group or boosting rule created / changed / enabled / disabled | Catalogue manager | SynonymGroup, BoostingRule | version, old and new values |
| AUD-SRC-002 | Taxonomy proposal submitted / approved / rejected / withdrawn; native category change refused | Catalogue manager / approver | TaxonomyProposal, Category | type, values, decision, reason |
| AUD-SRC-003 | Placement or badge created, changed or withdrawn | Marketing staff | Placement, SellerBadgeAssignment | dates, target, old and new values |

Business events AUD-SRC-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new values of SRC plugin tables are captured by the SEC IRepository<> decorator (BR-SEC-010), so SRC writes only through IRepository<> (BR-SRC-130). The native activity log is not used as audit. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-SRC-001 | Search response time and index freshness targets: Not stated in source — requires confirmation; the catalog figure (200 ms) is not adopted. | NFR-X-009; FCAT-10 | AC-SRC-026-01-03 |
| NFR-SRC-002 | Search and navigation are keyboard operable and labelled for screen readers; WCAG 2.1 AA proposed. | REQ-MPC-FR-092; NFR-X-005 | AC-SRC-022-01-01 to 01-04 |
| NFR-SRC-003 | Search keeps working on weak connections without losing the typed text. | REQ-MPC-FR-096; NFR-X-006 | AC-SRC-023-01-01, 01-02 |
| NFR-SRC-004 | Personal data for personalisation and history is used only with consent and deleted with the customer. | REQ-MPC-FR-081; NFR-X-002 | AC-SRC-009-02-01, AC-SRC-012-01-04 |
| NFR-SRC-005 | Relevance and taxonomy changes are audited. | REQ-MPC-FR-090, FR-099; NFR-X-003 | §14.2 audit events |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-SRC-001 | P1 | — | |
| PRD-SRC-002 | P1 | — | |
| PRD-SRC-003 | P1 | PRD-CAT-002 | |
| PRD-SRC-004 | P1 | — | |
| PRD-SRC-005 | P1 | PRD-CAT-002 | |
| PRD-SRC-006 | P1 | — | |
| PRD-SRC-007 | P1 | — | |
| PRD-SRC-008 | P1 | — | PRD-SRC-009 |
| PRD-SRC-009 | P1 | PRD-SRC-008, PRD-CAT-002 | PRD-AI-007 |
| PRD-SRC-010 | P1 | — | |
| PRD-SRC-011 | P2 | — | |
| PRD-SRC-012 | P2 | — | |
| PRD-SRC-013 | P1 | — | |
| PRD-SRC-014 | P1 | — | |
| PRD-SRC-015 | P2 | — | |
| PRD-SRC-016 | P1 | PRD-ADM-002 | |
| PRD-SRC-017 | P1 | — | |
| PRD-SRC-018 | P1 | PRD-LOG-005 | |
| PRD-SRC-019 | P1 | — | |
| PRD-SRC-020 | P1 | — | |
| PRD-SRC-021 | P1 | — | |
| PRD-SRC-022 | P1 | — | |
| PRD-SRC-023 | P1 | PRD-CHN-002 | |
| PRD-SRC-024 | P1 | — | |
| PRD-SRC-025 | P2 | — | |
| PRD-SRC-026 | P2 | — | |
| PRD-SRC-027 | P2 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-SRC-01 | Provider contract: with and without the provider, with and without the AI recommendation provider (Google AI), with provider errors and empty results, with both UseStandardSearchWhenNoResults settings on and off, with and without the GA client-id cookie, as guest and registered shopper, assert result sets, order kept only for "position", and native filters applied after the provider. |
| T-SRC-02 | Eligibility: unpublished, deleted, outside dates, inactive seller and out-of-stock (rule on / off) products never appear where BR-SRC-050 excludes them, in search, suggestions, API and recommendation blocks. |
| T-SRC-03 | Filters: combinations of price, attributes, brand, seller, in stock and location give the BR-SRC-010 results and correct paging. |
| T-SRC-04 | Multilingual: searches in each published language, with fallback, and synonyms per language. |
| T-SRC-05 | Accessibility: keyboard-only and screen-reader run of search, suggestions, filters and menus (with PLT-018). |
| T-SRC-06 | Weak network: throttled and offline browser profiles for SRC-023. |
| T-SRC-07 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-SRC-08 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
| T-SRC-09 | Providers and feature state: with the CAT-002 override installed, each IC-SRC-02 provider filters or orders only when its feature is on (IC-PLT-02); the ADM extension register shows no SRC override of IProductService; a suspended seller (SEL-003) disappears from search, categories, suggestions and the API and returns on reinstatement. |
