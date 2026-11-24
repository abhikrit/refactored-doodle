# L2 Module PRD — AI: AI capabilities

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | AI — AI capabilities |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Adds AI where a client asks for it and where it saves staff time, under one set of governance rules. In P1 this is the chatbot Malawi Post requires (website chat and WhatsApp, answering from approved responses, order-status look-up and hand-off to support agents) with the governance that must ship with it (telling users AI is in use, explaining answers, letting them reach a person). The P2 and P3 AI pack adds translation and listing help on top of the native nopCommerce features, document reading and ID checks, drafting and summaries, and external machine-learning services for fraud scoring, recommendations, forecasting and photo inspection.

**In scope**

- AI chatbot on the website and WhatsApp with order-status look-up and hand-off (AI-003, P1)
- AI governance: disclosure, explanations, opt-out to a person, AI use register, bias-monitoring links (AI-010, P1)
- AI translation on top of native pre-translation (AI-001, P3) and listing assistance on top of native AI descriptions and meta tags (AI-002, P3)
- Reply drafting and document summaries (AI-004, P3); contract and letter drafting (AI-009, P3)
- OCR and ID-document checks through an external service (AI-005, P2)
- External ML services: fraud scoring (AI-006), recommendations (AI-007), forecasting and photo inspection (AI-008), all P3

**Not in this module**

| Item | Where it is |
|---|---|
| Scripted responses, their versions and approval (knowledge base) | CRM module (PRD-CRM-007); AI-003 answers from it |
| Live chat console and support agents | CRM module (PRD-CRM-008 live web chat; CRM-001 help desk) |
| WhatsApp channel adapter and inbound routing to the chatbot | CHN module (PRD-CHN-006, BR-CHN-014) |
| Translation workflow and language packs | PLT module (PRD-PLT-025, PLT-009) |
| Payment risk rules, model-score thresholds and the review queue | PAY module (PRD-PAY-018, BR-PAY-090); AI-006 supplies a score |
| Consent for personalisation, product eligibility and showing recommendations | SRC module (PRD-SRC-009, BR-SRC-050, BR-SRC-080); AI-007 supplies the model results and forwards consented events |
| Document generation and document requirements | DOC module (PRD-DOC-001, DOC-005) |
| Identity and registry verification adapters | IAM module (PRD-IAM-020) |
| Country data-protection profile and consent | SEC module (PRD-SEC-012, SEC-007) |
| LLM, OCR and ML model hosting, training and monitoring | External systems (not named in any source) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-AI-001 | AI translation | B2B + B2C | P3 | Code-level | Custom plugin + Theme/view override | AI pack | | |
| PRD-AI-002 | AI listing assistance | B2B + B2C | P3 | Code-level | Custom plugin | AI pack | | |
| PRD-AI-003 | AI chatbot | B2B + B2C | P1 | Code-level | Custom plugin + External system + integration plugin | AI pack | PRD-CHN-006, PRD-AI-010 | |
| PRD-AI-004 | AI drafting and summarisation | B2B + B2C | P3 | Code-level | Custom plugin | AI pack | | |
| PRD-AI-005 | OCR and ID document checks | B2B + B2C | P2 | External system | External system + integration plugin | AI pack | | |
| PRD-AI-006 | ML fraud detection | B2B + B2C | P3 | External system | External system + integration plugin | AI pack | | |
| PRD-AI-007 | ML recommendation engine | B2B + B2C | P3 | External system | External system + integration plugin | AI pack | PRD-SRC-009 | |
| PRD-AI-008 | Forecasting and image inspection | B2B + B2C | P3 | External system | External system + integration plugin | AI pack | | |
| PRD-AI-009 | AI contract and letter drafting | B2B + B2C | P3 | Code-level | Custom plugin | AI pack | | |
| PRD-AI-010 | AI governance | B2B + B2C | P1 | External system | External system + integration plugin | AI pack | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper | Chats with the bot on the website or WhatsApp; asks for a person; sees disclosures | Guests / Registered (native) |
| Support agent | Takes over handed-off conversations; uses reply drafts | CRM-008 / CRM-001 roles (licensed plugins, V-01) |
| Content and catalogue staff | Use translation, description, meta-tag, price and image help; approve AI translations | Administrators or roles holding the native catalogue and content permissions |
| Seller | Uses listing help for own products | Vendors (native) + IAM-007 |
| Fraud staff | Review payments with a high fraud score | Role system name "Risk" (product role catalogue BR-IAM-050) |
| Client administrator | Configures AI providers, the chatbot, disclosures and the AI use register | Administrators (native) |
| AI, OCR and ML services (system) | Return generated text, translations, extracted data, scores and predictions | External systems via adapters |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Configuration.ManageSettings (native) | Configuration | Edit ArtificialIntelligenceSettings (provider, keys, allowed generations, prompts) and TranslationSettings (pre-translation, service, keys) | Administrators |
| Catalog.ProductsCreateEditDelete (native) | Catalog | Use the native product description generator (Admin ProductController.FullDescriptionGeneratorPopup) | Roles holding it (native defaults) |
| AI.Core.Chatbot.View | ContentManagement | View chatbot conversations, hand-offs and unanswered questions | Administrators |
| AI.Core.Chatbot.CreateEditDelete | ContentManagement | Configure the chatbot: channels, knowledge sources, languages, hand-off rules | Administrators |
| AI.Core.Translation.Approve | ContentManagement | Approve or reject AI translations held for approval | Administrators |
| AI.Core.Assist.Use | Catalog | Use price suggestions, attribute quality checks and image generation | Administrators; Vendors (own products) |
| AI.Core.Drafting.Use | ContentManagement | Generate reply drafts, document summaries, contract and letter drafts | Administrators |
| AI.Core.Governance.View | Security | View the AI use register, AI use log, explanations and bias-report links | Administrators |
| AI.Core.Governance.CreateEditDelete | Security | Maintain the AI use register and disclosure texts | Administrators |

Permissions are declared in an AI plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager), with the plugin prefix, the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs) and a native Category. Native Configuration.ManageSettings and Catalog.ProductsCreateEditDelete are reused. The native Admin ArtificialIntelligenceController.GenerateMetaTags action carries no CheckPermission attribute (only admin-area access through BaseAdminController); the AI plugin adds an action filter that requires the entity's native create-edit-delete permission (BR-AI-004). The action filter is listed in the ADM extension register (BR-ADM-001, OVR-REG); AI registers no service override. Role Risk is spelled exactly as in the product role catalogue (BR-IAM-050), and IAM creates catalogue roles that are missing; AI relies on no native start-up role creation and proposes no new role. All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-AI-PERM-01 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-AI-PERM-02 | **Given** a user without Catalog.ProductsCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-AI-PERM-03 | **Given** a user without AI.Core.Chatbot.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-AI-PERM-04 | **Given** a user without AI.Core.Chatbot.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-AI-PERM-05 | **Given** a user without AI.Core.Translation.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-AI-PERM-06 | **Given** a user without AI.Core.Assist.Use, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-AI-PERM-07 | **Given** a user without AI.Core.Drafting.Use, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-AI-PERM-08 | **Given** a user without AI.Core.Governance.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-AI-PERM-09 | **Given** a user without AI.Core.Governance.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-AI-001 | New in 4.90: TranslationSettings (AllowPreTranslate, TranslateFromLanguageId, NotTranslateLanguages, GoogleApiKey, DeepLAuthKey) pre-fills localized fields in admin edit forms for products, categories, manufacturers, product attributes, specification attributes; staff review before saving. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Translation/TranslationSettings.cs; src/Presentation/Nop.Web.Framework/Factories/TranslationModelFactory.PrepareTranslationModelAsync; src/Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs; defaultResources.nopres.xml Admin.Configuration.Settings.GeneralCommon.TranslationService] | Extend pre-translation to topics, blog, news, menus, message templates, vendor content and resource strings; optional approval step. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-AI-002 | ArtificialIntelligenceSettings (Gemini/ChatGPT/DeepSeek) with CreateProductDescriptionAsync and meta tag generation unchanged; 5.00 adds ArtificialIntelligenceSettings.LogRequests and MetaTagsGeneratingEvent (Libraries/Nop.Services/ArtificialIntelligence/MetaTagsGeneratingEvent.cs). | Price suggestions, data-quality checks and image generation. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-AI-003 | AI provider client (ArtificialIntelligenceHttpClient) unchanged. New bundled Widgets.Jotform embeds a Jotform AI agent (external SaaS) as a site chatbot from an admin-entered EmbedCode (Plugins/Nop.Plugin.Widgets.Jotform/JotformSettings.cs; WidgetJotformViewComponent.cs:38-41); no access to nopCommerce order data, no WhatsApp, no help-desk hand-off. | Order-status lookup, WhatsApp channel (CHN-006) and help-desk hand-off still to build; web widget can be the bundled Jotform agent if the client accepts Jotform SaaS, or a custom LLM chatbot plugin. | Custom plugin + External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-AI-004 | AI provider client only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/ArtificialIntelligence/ArtificialIntelligenceHttpClient.cs] | Reply drafting in help desk and document summarisation via external LLM. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-AI-005 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No OCR component in src] | OCR and ID-document verification service; nopCommerce integration plugin. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: ML/OCR service hosting is outside nopCommerce |
| PRD-AI-006 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No fraud component in src] | ML fraud-scoring service; plugin calls it at checkout/payment. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: ML model hosting is outside nopCommerce |
| PRD-AI-007 | New in 5.00: IAiRecommendationPlugin (Libraries/Nop.Services/ArtificialIntelligence/IAiRecommendationPlugin.cs) and bundled AIRecommendation.GoogleAI ('Google AI Commerce Search', Plugins/Nop.Plugin.AIRecommendation.GoogleAI; depends on Widgets.GoogleAnalytics) syncing products to Google Cloud Retail and ranking keyword search results (ProductService.SearchProductsAsync, Libraries/Nop.Services/Catalog/ProductService.cs:899). The interface exposes only SearchProductsAsync; no recommendation widget or 'recommended for you' call found in 5.00.1 source. Manual related/cross-sell products unchanged. | ML recommendation service and widget rendering still required. Inference: the bundled Google Retail integration (catalogue sync, visitor ID) can be extended to call the same service's recommendation API, reducing integration effort. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: ML model hosting is outside nopCommerce |
| PRD-AI-008 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No component in src] | Demand forecasting and image-inspection ML services; integration plugin. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: ML model hosting is outside nopCommerce |
| PRD-AI-009 | AI provider client only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/ArtificialIntelligence/ArtificialIntelligenceHttpClient.cs] | Contract/letter drafting from templates and entered data via external LLM, on DOC-001. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-AI-010 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No component in src] | AI disclosure notices (plugin/view) plus explainability and bias monitoring in the ML/LLM operations platform. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: bias monitoring runs where models run |


## 7. Feature specifications


### 7.1 PRD-AI-001 AI translation

| Item | Value |
|---|---|
| Description (baseline) | Automatic translation of product and site content, checked by a person before publishing. |
| Why it matters | Multi-language content at lower cost. |
| Who benefits | Content staff |
| Phase | P3 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-001-01 | As a member of content staff, I want translations of product, category, manufacturer and attribute texts pre-filled for me to check before saving, so that multi-language content costs less. | D; FC-M01-043 | Ready |
| US-AI-001-02 | As a member of content staff, I want the same pre-fill for topics, blog, news, menus, message templates, vendor content and resource strings, so that all site content can be translated the same way. | D; FC-M24-001 | Ready |
| US-AI-001-03 | As a content manager, I want an optional approval step before AI translations go live, so that high-value texts are checked by a second person. | D; FC-M24-001 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-001-01-01 | US-AI-001-01 | **Given** TranslationSettings.AllowPreTranslate is on, TranslateFromLanguageId is set and the DeepL or Google key is entered, **when** an editor asks for pre-translation on the product edit page, **then** empty localized fields of every language not in NotTranslateLanguages are filled in the form; nothing is saved until the editor saves. | FIT (TranslationModelFactory.PrepareTranslationModelAsync; Admin ProductController) |
| AC-AI-001-01-02 | US-AI-001-01 | **Given** a localized field already has text, **when** pre-translation runs, **then** that field is not changed. | FIT (TranslationModelFactory skips non-empty values) |
| AC-AI-001-01-03 | US-AI-001-01 | **Given** the translation service returns an error for a language, **when** pre-translation runs, **then** the error is written to the system log, fields already translated keep their values and the form shows that errors occurred; for DeepL an unsupported language stops the run. | FIT (TranslationModelFactory: HasErrors, ILogger — async members only in 5.00.1, Libraries/Nop.Services/Logging/ILogger.cs) |
| AC-AI-001-02-01 | US-AI-001-02 | **Given** the AI pack extension is installed, **when** an editor asks for pre-translation on a topic, blog post, news item, menu, message template or vendor edit page, **then** the same pre-fill rules as AC-AI-001-01-01 and 01-02 apply. | D |
| AC-AI-001-02-02 | US-AI-001-02 | **Given** a language pack lacks resource strings present in the source language, **when** an editor runs resource pre-translation, **then** the missing strings are pre-filled into a review list; none is saved as a locale resource until the editor accepts it. | D; Proposed |
| AC-AI-001-03-01 | US-AI-001-03 | **Given** the approval step is on for an entity type, **when** an editor saves an AI-filled translation, **then** it is held as an AiTranslationDraft (SM-AI-02); the storefront keeps showing the current text until a user with AI.Core.Translation.Approve approves it, which writes it to the native LocalizedProperty and calls IC-PLT-09 SetStatus so the PLT-025 translation status becomes Checked (BR-PLT-090); approval is audited (AUD-AI-002). | D; Proposed |
| AC-AI-001-03-02 | US-AI-001-03 | **Given** the approval step is off, **when** an editor saves an AI-filled translation, **then** it is saved to LocalizedProperty at once, as in native nopCommerce, and its PLT-025 translation status is Unchecked (BR-PLT-090); AI keeps no translation status of its own. | FIT; Proposed (PLT-025 owner) |

**Business rules applied:** BR-AI-002; BR-AI-005 (§8.1).


### 7.2 PRD-AI-002 AI listing assistance

| Item | Value |
|---|---|
| Description (baseline) | Help for sellers and staff to write product descriptions, suggest prices, check details and create images. |
| Why it matters | Better listings in less time. |
| Who benefits | Sellers; catalogue staff |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-002-01 | As a member of catalogue staff or seller, I want a product description written from the name, keywords and tone I give, so that listings are written faster. | D; FC-M01-041 | Ready; conditions: OVR-REG, CFG-01 |
| US-AI-002-02 | As a member of catalogue staff, I want meta title, keywords and description generated for products and other pages, so that search listings improve with less effort. | D | Ready; conditions: OVR-REG, CFG-01 |
| US-AI-002-03 | As a seller, I want a suggested price based on comparable products, so that I price competitively. | D; FC-M01-042 | Ready; conditions: OVR-REG, CFG-01 |
| US-AI-002-04 | As a member of catalogue staff, I want attribute values that look wrong flagged for me, so that listing data is reliable. | D; FC-M01-044 | Ready; conditions: OVR-REG, CFG-01 |
| US-AI-002-05 | As a seller without professional photos, I want extra product images generated from the description, so that my listing looks complete. | D; FC-M24-013 | Ready; conditions: OVR-REG, CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-002-01-01 | US-AI-002-01 | **Given** ArtificialIntelligenceSettings.Enabled and AllowProductDescriptionGeneration are on and a provider (Gemini, ChatGPT or DeepSeek) is set, **when** a user with Catalog.ProductsCreateEditDelete opens the description generator, enters keywords and tone and generates, **then** the generated text is shown in the popup and is written to the product only when the user saves. | FIT (Admin ProductController.FullDescriptionGeneratorPopup; ArtificialIntelligenceService.CreateProductDescriptionAsync) |
| AC-AI-002-01-02 | US-AI-002-01 | **Given** the provider returns an error, **when** generation is requested, **then** the AI pack shows message Ai.GenerationFailed and keeps the save button disabled; native nopCommerce instead places the error text in the description field, which could then be saved. | FIT (5.00.1: Admin ProductController.FullDescriptionGeneratorPopup catches NopException into GeneratedDescription, Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:1608-1628); Proposed (override) |
| AC-AI-002-02-01 | US-AI-002-02 | **Given** AllowMetaTitleGeneration, AllowMetaKeywordsGeneration and AllowMetaDescriptionGeneration are on, **when** a user generates meta tags for a product, category, manufacturer, blog post, news item, topic or vendor, **then** only meta fields that are empty are filled; a news item is supported only where the bundled Misc.News plugin is installed, through its consumer of MetaTagsGeneratingEvent. | FIT (5.00.1: public ArtificialIntelligenceService.CreateMetaTagsAsync(entity, languageId) and CreateMetaTagsAsync(entityTypeName, entityId, languageId), which publishes MetaTagsGeneratingEvent for entity types outside core, Libraries/Nop.Services/ArtificialIntelligence/ArtificialIntelligenceService.cs:364-400; the entity overload with current meta values became protected, :229-256; Plugins/Nop.Plugin.Misc.News/Services/Events/EventConsumer.cs:196; Admin ArtificialIntelligenceController.GenerateMetaTags) |
| AC-AI-002-02-02 | US-AI-002-02 | **Given** a user lacks the native create-edit-delete permission for that entity type, **when** they call meta-tag generation, **then** the call is refused by the AI pack action filter and nothing is sent to the provider (BR-AI-004). | FIT (5.00.1: GenerateMetaTags has no CheckPermission, Presentation/Nop.Web/Areas/Admin/Controllers/ArtificialIntelligenceController.cs:53); Proposed |
| AC-AI-002-03-01 | US-AI-002-03 | **Given** at least the minimum number of comparable products (setting, default not stated) exist in the same category, region and season window, **when** a seller asks for a price suggestion, **then** a suggested price is shown with the number of comparables and their price range; the product price changes only if the seller saves it. | FC-M01-042; Proposed |
| AC-AI-002-03-02 | US-AI-002-03 | **Given** fewer comparable products than the minimum exist, **when** a seller asks for a price suggestion, **then** message Ai.NotEnoughData is shown and no price is suggested. | Proposed |
| AC-AI-002-04-01 | US-AI-002-04 | **Given** value rules exist for the category (CAT-005 attribute schemas), **when** a quality check runs on a product, **then** values outside the expected range or inconsistent with another attribute are listed as flags; saving is not blocked. | FC-M01-044; Proposed (flag, not block) |
| AC-AI-002-05-01 | US-AI-002-05 | **Given** an image-generation provider is configured, **when** a seller generates an image from the description, **then** the image is shown for review with the label Ai.GeneratedLabel and becomes a product picture only when the seller accepts it (SM-AI-03). | FC-M24-013; Proposed |

**Business rules applied:** BR-AI-002; BR-AI-004; BR-AI-005 (§8.1).


### 7.3 PRD-AI-003 AI chatbot

| Item | Value |
|---|---|
| Description (baseline) | An automated assistant on the website and WhatsApp that answers common questions and order-status queries, and helps the support desk. |
| Why it matters | Instant answers at any hour. |
| Who benefits | Shoppers; support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + External system + integration plugin |
| Depends on | PRD-CHN-006, PRD-AI-010 |
| Status | Ready; conditions: MSG-ROUTE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-003-01 | As a shopper, I want answers to common questions in the website chat and on WhatsApp at any hour, so that I get help at once. | D; REQ-MPC-FR-256; REQ-MPC-CHT-001 | Ready; conditions: MSG-ROUTE |
| US-AI-003-02 | As a shopper, I want to ask the assistant for the status of my order, so that I do not have to wait for an agent. | D | Ready; conditions: MSG-ROUTE |
| US-AI-003-03 | As a shopper, I want to be handed to a support agent when the assistant cannot help or when I ask, so that I always reach a person if I need one. | D; REQ-MPC-FR-256 | Ready; conditions: MSG-ROUTE |
| US-AI-003-04 | As a client administrator, I want to set the assistant's channels, knowledge sources, languages and hand-off rules, so that it answers only what we approve. | D | Ready; conditions: MSG-ROUTE |
| US-AI-003-05 | As a member of support staff, I want to see the questions the assistant could not answer, so that we improve the approved responses. | D | Ready; conditions: MSG-ROUTE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-003-01-01 | US-AI-003-01 | **Given** the chatbot is enabled for the web widget (IWidgetPlugin in zone body_end_html_tag_before), **when** a shopper asks a question that matches an approved ready-made answer returned by IC-CRM-02 GetApprovedAnswers (CRM-007), **then** the assistant answers with that approved version; draft or unapproved versions are never used, because IC-CRM-02 returns Approved versions only (BR-AI-001). | REQ-MPC-FR-256; FIT (PublicWidgetZones.BodyEndHtmlTagBefore) |
| AC-AI-003-01-02 | US-AI-003-01 | **Given** the CHN-006 routing setting sends WhatsApp messages to the chatbot first (BR-CHN-014), **when** a shopper sends the same question on WhatsApp, **then** the same approved answer is sent on WhatsApp through IC-CHN-04 SendReply, outside TRK-005 as a conversational reply; SendReply sends nothing when IC-TRK-06 CheckAllowed answers Blocked for that sender (decision MSG-ROUTE, BR-TRK-026). | REQ-MPC-FR-256; MSG-ROUTE |
| AC-AI-003-01-03 | US-AI-003-01 | **Given** a question matches no scripted response and the language-model answer option is on, **when** the shopper asks it, **then** the assistant answers only from approved answers read through IC-CRM-02 and published topics, through the configured provider; if no approved content supports an answer it replies Ai.BotNoAnswer and offers a person (BR-AI-001). | REQ-MPC-CHT-001; Proposed (reading of "machine-learning capability", MG-11) |
| AC-AI-003-01-04 | US-AI-003-01 | **Given** a conversation starts on any channel, **when** the first message is shown, **then** it begins with the disclosure Ai.Disclosure (BR-AI-010). | D; FC-M24-014 |
| AC-AI-003-02-01 | US-AI-003-02 | **Given** a signed-in shopper asks about an order on the website, **when** the assistant looks it up, **then** it returns the status of that customer's orders only, read through the native order service; it never states order data from the language model. | D; Proposed |
| AC-AI-003-02-02 | US-AI-003-02 | **Given** a WhatsApp sender asks about an order, **when** the assistant looks it up, **then** it answers only if the sender's number belongs to the order's customer; otherwise it replies Ai.OrderNotFound, the same as for an unknown order (BR-CHN-011). | D; Proposed |
| AC-AI-003-03-01 | US-AI-003-03 | **Given** the shopper asks for a person, or the assistant fails to answer the configured number of times in a row (default not stated), **when** hand-off is triggered, **then** the conversation and its transcript pass to the live chat console (CRM-008) and the shopper sees Ai.HandOffAgent; when no agent is available a ticket is created through IC-CRM-04 ReceiveInbound with channel Chat (web) or WhatsApp and the transcript, and the shopper sees Ai.HandOffTicket. | REQ-MPC-FR-256 ("Support Agents"); D |
| AC-AI-003-03-02 | US-AI-003-03 | **Given** the language-model provider returns an error or exceeds ArtificialIntelligenceSettings.RequestTimeout (native default 30 seconds when unset), **when** the assistant needs it, **then** the assistant replies Ai.BotUnavailable and offers a person; the error is logged. | FIT (ArtificialIntelligenceHttpClient.SendQueryAsync throws NopException; ArtificialIntelligenceDefaults.RequestTimeout) |
| AC-AI-003-04-01 | US-AI-003-04 | **Given** a user with AI.Core.Chatbot.CreateEditDelete changes channels, sources, languages or hand-off rules, **when** they save, **then** new conversations use the new settings and the change is audited (AUD-AI-001). | D |
| AC-AI-003-04-02 | US-AI-003-04 | **Given** feature PRD-AI-003 is off for store S (productfeature.PRD-AI-003 read through IC-PLT-02), **when** a page of store S is rendered or a WhatsApp message for store S arrives, **then** the chat widget is not rendered and CHN-006 does not route the message to the chatbot (BR-AI-006). | Proposed (IC-PLT-02) |
| AC-AI-003-05-01 | US-AI-003-05 | **Given** questions were answered with Ai.BotNoAnswer or handed off, **when** a user with AI.Core.Chatbot.View opens the unanswered list, **then** each question is listed with its count and last date, with a link to create or update a CRM-007 response. | D; Proposed |

**Business rules applied:** BR-AI-001; BR-AI-003; BR-AI-006; BR-AI-010 (§8.1).


### 7.4 PRD-AI-004 AI drafting and summarisation

| Item | Value |
|---|---|
| Description (baseline) | Drafts replies for support agents and summarises long documents. |
| Why it matters | Agents and staff work faster. |
| Who benefits | Support and client staff |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-004-01 | As a support agent, I want a draft reply to a ticket based on similar resolved tickets and the knowledge base, so that I answer faster. | D; FC-M24-003 | Ready |
| US-AI-004-02 | As a member of client staff, I want a summary of a long document with its key dates, requirements and obligations, so that I understand it quickly. | D; FC-M24-002 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-004-01-01 | US-AI-004-01 | **Given** drafting is enabled and the agent holds AI.Core.Drafting.Use, **when** the agent asks for a draft on a ticket, **then** a draft labelled Ai.GeneratedLabel is placed in the reply box; nothing is sent until the agent sends it. | D; Proposed |
| AC-AI-004-02-01 | US-AI-004-02 | **Given** a document is stored in the DOC module, **when** a user with AI.Core.Drafting.Use asks for a summary, **then** a summary labelled Ai.GeneratedLabel is stored linked to the document; the document itself is not changed. | D |

**Business rules applied:** BR-AI-002; BR-AI-005 (§8.1).


### 7.5 PRD-AI-005 OCR and ID document checks

| Item | Value |
|---|---|
| Description (baseline) | Reads data from scanned documents and checks whether ID documents look genuine. |
| Why it matters | Faster, more reliable document checks. |
| Who benefits | Compliance staff |
| Phase | P2 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready; conditions: ONE-RECORD |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-005-01 | As a member of compliance staff, I want text extracted from scanned or photographed documents, so that documents become searchable and processable. | D; FC-M24-005 | Ready; conditions: ONE-RECORD |
| US-AI-005-02 | As a member of compliance staff, I want a check of whether an identity document looks genuine, so that fraudulent documents are caught. | D; FC-M24-007 | Ready; conditions: ONE-RECORD |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-005-01-01 | US-AI-005-01 | **Given** an OCR service is configured (not named), **when** a document image is submitted, **then** the extracted text and fields are stored with their confidence; fields below the confidence threshold (setting, default not stated) are marked for manual review; the original file is not changed. | D; Proposed |
| AC-AI-005-02-01 | US-AI-005-02 | **Given** an ID-check service is configured (not named), **when** an identity document is submitted, **then** the result is stored as one of the product identity-result values Verified, NotVerified, Inconclusive or Unavailable (IC-IAM-02 standard, decision ONE-RECORD) with its reasons; the decision on the person is taken by a staff member, never by the service alone (BR-AI-002, BR-IAM-110). | D; ONE-RECORD; Proposed |
| AC-AI-005-01-02 | US-AI-005-01 | **Given** an OCR service is configured and DOC-005 calls IC-DOC-06 Extract fields with a file and a document type, **when** the service returns, **then** AI-005 returns the field values of that document type, each with its confidence; an unreadable file returns Unreadable and an unavailable service returns the service-unavailable error; DOC-005 decides Match, Mismatch or manual review (BR-DOC-040). | D; Proposed (carry) |

**Business rules applied:** BR-AI-002; BR-AI-006 (§8.1).


### 7.6 PRD-AI-006 ML fraud detection

| Item | Value |
|---|---|
| Description (baseline) | A trained model that scores how likely a transaction is to be fraud. |
| Why it matters | Catches fraud patterns that simple rules miss. |
| Who benefits | Fraud staff |
| Phase | P3 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-006-01 | As a member of fraud staff, I want each transaction scored by a trained model for fraud risk, so that patterns that rules miss are caught. | D; FC-M24-009 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-006-01-01 | US-AI-006-01 | **Given** the fraud-scoring service is configured (not named) and a PAY-018 rule of type model score is active (its threshold and action are held on the PAY-018 rule, BR-PAY-090), **when** PAY-018 requests a score for a payment through IC-AI-03 Score, **then** AI-006 returns the score, the model version and the main reasons and stores them as a ModelResult; PAY stores FraudScore and FraudModelVersion on the transaction; AI applies no threshold and writes no flag: PAY-018 compares the score with the rule threshold, writes the RiskFlag and blocks only if the rule action is Block. | D; Proposed; BR-PAY-090 |
| AC-AI-006-01-02 | US-AI-006-01 | **Given** the scoring service does not answer within the IC-AI-03 timeout (setting, default not stated), **when** a payment is initiated, **then** IC-AI-03 Score returns Unavailable and the missing score is logged; PAY-018 then does not fire the model-score rule, evaluates the other rules and the payment continues (as PAY-018 specifies). | Proposed |

**Business rules applied:** BR-AI-002; BR-AI-011 (§8.1).


### 7.7 PRD-AI-007 ML recommendation engine

| Item | Value |
|---|---|
| Description (baseline) | A trained model that produces the product suggestions shown in 'Personalised recommendations'. |
| Why it matters | More relevant suggestions. |
| Who benefits | Shoppers |
| Phase | P3 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-SRC-009 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-007-01 | As a shopper, I want product suggestions that fit what I look at and buy, so that I find relevant products faster. | D; FC-M24-010 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-007-01-01 | US-AI-007-01 | **Given** the recommendation service is configured (not named), **when** SRC-009 asks for suggestions for a customer and a surface (product page, cart, home) through IC-AI-03 Recommend, **then** AI-007 returns the ranked product ids with the model version and stores a ModelResult; AI applies no product filter of its own: SRC-009 removes products that are not eligible under BR-SRC-050 before display (out-of-stock products only where that client rule applies). | D; Proposed (SRC-009 owns eligibility) |
| AC-AI-007-01-02 | US-AI-007-01 | **Given** the AI pack is installed and the recommendation service is configured, **when** the AI-007 plugin starts, **then** it registers itself as the SRC-009 recommendation provider (IC-SRC-04) and maps Recommend, SendEvents and DeleteSubjectData to IC-AI-03; when it is uninstalled or disabled SRC-009 uses its own fallback (AC-SRC-009-01-04; AI-007 specifies no fallback of its own). | Proposed (AI-007 is an optional provider to SRC-009) |
| AC-AI-007-01-03 | US-AI-007-01 | **Given** the shopper has given personalisation consent, which SRC-009 checks (BR-SRC-080), **when** SRC-009 passes view, add-to-cart and purchase events through IC-AI-03 SendEvents with a pseudonymous customer key, **then** AI-007 forwards them to the recommendation service with that key only; no name, contact or address is sent (BR-AI-005). | Proposed (SRC-009, IC-SRC-04) |
| AC-AI-007-01-04 | US-AI-007-01 | **Given** the shopper withdraws consent, **when** SRC-009 calls IC-AI-03 DeleteSubjectData with the pseudonymous key, **then** AI-007 sends the deletion request to the service and records the request time and the service answer; later events for that key are not forwarded until consent is given again. | Proposed (SRC-009) |

**Business rules applied:** BR-AI-005; BR-AI-011 (§8.1).


### 7.8 PRD-AI-008 Forecasting and image inspection

| Item | Value |
|---|---|
| Description (baseline) | Predicts future demand, and checks product quality from photos. |
| Why it matters | Better stock planning and quality control. |
| Who benefits | Stock planners; quality staff |
| Phase | P3 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-008-01 | As a stock planner, I want a forecast of demand by category, region and time, so that I plan stock better. | D; FC-M24-011 | Ready |
| US-AI-008-02 | As a member of quality staff, I want product photos checked for defects, so that quality control scales. | D; FC-M24-006 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-008-01-01 | US-AI-008-01 | **Given** the forecasting service is configured (not named) and receives order history, **when** a forecast run completes, **then** forecasts by category, region and period are stored with the run date and shown in reports; they change no stock or order. | D |
| AC-AI-008-02-01 | US-AI-008-02 | **Given** the inspection service is configured (not named), **when** a product photo is submitted, **then** detected defects are stored with the photo and confidence; a staff member confirms or rejects each finding. | D; Proposed |

**Business rules applied:** BR-AI-002 (§8.1).


### 7.9 PRD-AI-009 AI contract and letter drafting

| Item | Value |
|---|---|
| Description (baseline) | Drafts contracts and letters from the details entered. |
| Why it matters | Faster document preparation. |
| Who benefits | Legal and sales staff |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-009-01 | As a member of legal or sales staff, I want a first draft of a contract or letter from a template and the details I enter, so that documents are prepared faster. | D; FC-M24-012 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-009-01-01 | US-AI-009-01 | **Given** a DOC-001 template exists and drafting is enabled, **when** a user with AI.Core.Drafting.Use enters the details and asks for a draft, **then** a draft labelled Ai.GeneratedLabel is created from the template; it is issued only after a person edits or approves it and issues it through DOC-001. | D; FC-M24-012 |

**Business rules applied:** BR-AI-002; BR-AI-005 (§8.1).


### 7.10 PRD-AI-010 AI governance

| Item | Value |
|---|---|
| Description (baseline) | Tells users when AI is used, explains its decisions, and monitors for unfair bias. |
| Why it matters | Responsible, trustworthy use of AI. |
| Who benefits | All users; regulators |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-AI-010-01 | As a shopper or citizen, I want to be told whenever AI is used to answer me or to make content I see, so that I know what I am dealing with. | D; FC-M24-014 | Ready |
| US-AI-010-02 | As a shopper or citizen affected by an AI answer or decision, I want an explanation of how an AI answer or decision was reached, so that I can trust or question it. | D; FC-M24-014 | Ready |
| US-AI-010-03 | As a shopper or citizen, I want to opt out of AI and reach a person where appropriate, so that I am not forced to use AI. | FC-M24-014 | Ready |
| US-AI-010-04 | As a client administrator, I want a register of where AI is used and monitoring for unfair bias, so that we use AI responsibly and can show it. | D; FC-M24-014 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-AI-010-01-01 | US-AI-010-01 | **Given** the chatbot is enabled, **when** a conversation starts on any channel, **then** the disclosure Ai.Disclosure is the first message (BR-AI-010). | D; FC-M24-014 |
| AC-AI-010-01-02 | US-AI-010-01 | **Given** content was generated or translated by AI and accepted by a person, **when** it is saved, **then** an AiUseLog entry records feature, user, entity, provider and time (AUD-AI-003). | D; Proposed |
| AC-AI-010-02-01 | US-AI-010-02 | **Given** the chatbot answered from approved content, **when** the shopper asks why or where the answer came from, **then** the assistant lists the titles of the source responses or topics used (Ai.AnswerSources). | D; Proposed |
| AC-AI-010-02-02 | US-AI-010-02 | **Given** a model score affected a transaction (AI-006), **when** fraud staff open the flag, **then** the score, the model version and the main reasons are shown. | D |
| AC-AI-010-03-01 | US-AI-010-03 | **Given** a shopper is chatting with the assistant, **when** they ask for a person at any time, **then** hand-off follows AC-AI-003-03-01. | FC-M24-014 |
| AC-AI-010-04-01 | US-AI-010-04 | **Given** an AI feature is enabled for a client, **when** an administrator opens the AI use register, **then** the feature is listed with provider, data categories sent, disclosure text, owner and review date; a feature without a register entry is shown as incomplete. | D; Proposed |
| AC-AI-010-04-02 | US-AI-010-04 | **Given** a model that scores or ranks people is enabled (AI-006, AI-007), **when** its monitoring period ends, **then** the external platform's bias report for that model is linked in the register; a model without a report for the period is shown as overdue. | D; Proposed |

**Business rules applied:** BR-AI-010; BR-AI-011 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-AI-001 | The chatbot answers only from approved scripted responses (current approved version, CRM-007) and published content; it never states order, payment or account data that it did not read from native services, and it says it has no answer rather than guess. | AI-003 | REQ-MPC-FR-256 (approval); Proposed |
| BR-AI-002 | AI output is a suggestion: generated text, translations (when approval is on), images, prices, drafts, OCR fields, ID checks, inspections and scores change no record and decide nothing about a person until a person accepts or decides. | AI-001, AI-002, AI-004 to AI-006, AI-008, AI-009 | FC-M24-014; FC-M24-012 ("human review"); Proposed |
| BR-AI-003 | Order data in a chat is given only to the signed-in customer, or on WhatsApp to the phone number of the order's customer; "not found" and "not yours" get the same reply. | AI-003 | Proposed; BR-CHN-011 |
| BR-AI-004 | Native AI generation actions are allowed only to users holding the native create-edit-delete permission of the entity concerned; the AI plugin adds an action filter for Admin ArtificialIntelligenceController.GenerateMetaTags, which has no CheckPermission attribute; the filter is listed in the ADM extension register (BR-ADM-001). | AI-002 | FIT; Proposed; OVR-REG |
| BR-AI-005 | Content sent to an external AI or translation provider is limited to the fields needed; personal data is sent only where the AI use register entry allows it and the country profile (SEC-012) permits it; recommendation events carry only a pseudonymous customer key. | AI-001 to AI-004, AI-007, AI-009 | DP-01; SEC-012; Proposed |
| BR-AI-006 | Every AI setting key is listed in the AI plugin key catalogue (key, type, layer, secret flag, default) so pack validation accepts it; every key, token or credential setting (native AI and translation keys as listed in BR-PLT-013, and the keys of the OCR, ID-check, ML and image services) is flagged secret, so packs refuse it and exports omit it. AI widgets, routing and scheduled work act for a store only when IC-PLT-02 IsEnabled returns true for the AI feature concerned. | AI-003, AI-005 | CFG-01; BR-PLT-013; Proposed |
| BR-AI-010 | Every chatbot conversation starts with the AI disclosure; every AI-generated item shown to a customer carries the AI label. | AI-003, AI-010 | FC-M24-014 |
| BR-AI-011 | Every model that scores or ranks people stores its version and main reasons per result and has a bias-report link per monitoring period in the AI use register. | AI-006, AI-007, AI-010 | FC-M24-014; Proposed |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-AI-01 | ChatConversation | (none) | shopper opens chat or sends a message | chatbot enabled for the channel | BotActive | disclosure sent |
| SM-AI-01 | ChatConversation | BotActive | shopper asks for a person, or failure count reached | agent available | HandedOff | transcript to CRM-008 |
| SM-AI-01 | ChatConversation | BotActive | shopper asks for a person, or failure count reached | no agent available | Ticketed | ticket through IC-CRM-04 with transcript |
| SM-AI-01 | ChatConversation | BotActive | no message for the inactivity period (setting, default not stated) | — | Closed | — |
| SM-AI-01 | ChatConversation | HandedOff / Ticketed | closed by CRM | — | Closed | — |
| SM-AI-02 | AiTranslationDraft | (none) | AI-filled translation saved | approval step on | Pending | storefront unchanged |
| SM-AI-02 | AiTranslationDraft | Pending | approved | AI.Core.Translation.Approve | Approved | written to LocalizedProperty; AUD-AI-002 |
| SM-AI-02 | AiTranslationDraft | Pending | rejected with reason | AI.Core.Translation.Approve | Rejected | AUD-AI-002 |
| SM-AI-03 | AiSuggestion (description, image, price, draft, summary) | (none) | generated | — | Generated | shown for review |
| SM-AI-03 | AiSuggestion | Generated | accepted by the user | — | Accepted | record changed; AiUseLog (AUD-AI-003) |
| SM-AI-03 | AiSuggestion | Generated | discarded or closed | — | Discarded | no change |
| SM-AI-04 | DocumentCheck (OCR or ID check) | (none) | result received | — | NeedsReview | — |
| SM-AI-04 | DocumentCheck | NeedsReview | staff confirms | — | Confirmed | fields accepted |
| SM-AI-04 | DocumentCheck | NeedsReview | staff rejects | — | Rejected | reason stored |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| ChatConversation / ChatMessage (new) | Conversation: Id, Channel (web / WhatsApp), CustomerId, ExternalUserId, LanguageId, Status (SM-AI-01), FailureCount, HandOffRef; Message: Role (customer / bot / agent), Text, SourceIds, CreatedOnUtc | AI-003, AI-010 | Retention per PLT-020 |
| ChatUnanswered (new) | QuestionText (normalised), Count, LastAskedOnUtc, LinkedResponseId | AI-003 | |
| AiTranslationDraft (new) | EntityName, EntityId, LanguageId, PropertyName, Value, Status (SM-AI-02), CreatedBy, ApprovedBy | AI-001 | Written to native LocalizedProperty on approval |
| AiSuggestion (new) | Feature, EntityName, EntityId, Content or PictureId, Status (SM-AI-03), CreatedBy | AI-002, AI-004, AI-009 | |
| AiUseLog (new) | Feature, UserId, EntityName, EntityId, Provider, Model, CreatedOnUtc | AI-010 (all features) | |
| AiUseRegister (new) | Feature, Provider, DataCategoriesSent, DisclosureText, Owner, ReviewDate, BiasReportLink per period | AI-010 | |
| DocumentCheck (new) | DocumentRef, Type (OCR / ID), Result, Fields with confidence, Reasons, Status (SM-AI-04), ReviewedBy | AI-005 | |
| ModelResult (new) | Model, ModelVersion, EntityName, EntityId, Score or Ranking, Reasons, CreatedOnUtc | AI-006, AI-007, AI-008 | The fraud score is also stored by PAY on the transaction (FraudScore, FraudModelVersion) |
| SubjectDeletionRequest (new) | PseudonymousKey, RequestedOnUtc, ServiceAnswer | AI-007 | |
| ArtificialIntelligenceSettings, TranslationSettings (native) | — | AI-001 to AI-003 | Native settings; AI settings are saved with StoreId 0 by the admin settings page |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| AI pack settings | AI provider, model and feature toggles per use; translation languages; governance disclosures | vertical (AI pack) → client | AI-001 – AI-010 | AI pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| AI provider, key, timeout, allowed generations and prompts | ArtificialIntelligenceSettings: Enabled, ProviderType, GeminiApiKey / ChatGptApiKey / DeepSeekApiKey, RequestTimeout (native default 30 s), AllowProductDescriptionGeneration, AllowMeta*Generation, *Query, and since 5.00 LogRequests (native; Libraries/Nop.Core/Domain/ArtificialIntelligence/ArtificialIntelligenceSettings.cs:13-83). ActiveAIRecommendationProviderSystemName and UseStandardSearchWhenNoResults (5.00, :88-93) belong to the search pipeline (SRC) and stay empty unless an AI search provider is approved | client (shared value) | Not stated (KG-17 AI platforms) | Not stated (MG-11) |
| Pre-translation | TranslationSettings: AllowPreTranslate, TranslateFromLanguageId, NotTranslateLanguages, TranslationServiceId, GoogleApiKey, DeepLAuthKey (native) | client → store | Languages KG-14 | Languages MG-04 |
| Translation approval per entity type | AI pack settings (new) | client | Not stated | Not stated |
| Chatbot channels, sources, languages, failure count, inactivity period, language-model option | AI pack settings (new) | client | — | Required (FR-256, CHT-001); values not stated (MG-11) |
| Disclosure texts | Locale resources Ai.Disclosure, Ai.GeneratedLabel; AiUseRegister | client | — | Required with AI-003 |
| External ML, OCR, ID-check and image services | AI pack settings (new), credentials encrypted | client | Not stated | Not stated |
| Thresholds (OCR confidence, comparables minimum); the fraud-score threshold is on the PAY-018 rule | AI pack settings (new); PAY-018 RiskRule.Threshold | client | Not stated | Not stated |
| Cookie category of the AI chat widget | SEC-007 WidgetCategoryMap row for the AI chat widget system name (SEC-007 product default functional, Proposed) | client → store | Not stated | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Chat widget with disclosure, sources and hand-off | AI-003, AI-010 | New (widget) |
| Admin — edit pages | Pre-translation on further entity types; description and meta generation; price suggestion, quality flags, image generation | AI-001, AI-002 | Native pages extended |
| Admin | Translation approval queue | AI-001 | New |
| Admin | Chatbot settings, conversations and unanswered questions | AI-003 | New |
| Admin | AI use register and AI use log | AI-010 | New |
| Admin | Document checks review | AI-005 | New |
| Help desk / DOC | Draft reply, summary, contract and letter drafts | AI-004, AI-009 | Licensed help desk and DOC pages extended |
| Admin | Fraud score on the PAY-018 review queue | AI-006 | PAY screen extended |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Ai.Disclosure | You are chatting with an automated assistant. You can ask for a person at any time. | AC-AI-003-01-04, AC-AI-010-01-01 |
| Ai.BotNoAnswer | I do not have an answer to that. Would you like to talk to a person? | AC-AI-003-01-03 |
| Ai.OrderNotFound | I could not find that order for you. | AC-AI-003-02-02 |
| Ai.HandOffAgent | I am passing you to a member of our team. | AC-AI-003-03-01 |
| Ai.HandOffTicket | Our team is not available now. We have recorded your question and will reply. | AC-AI-003-03-01 |
| Ai.BotUnavailable | The assistant is not available at the moment. Would you like to talk to a person? | AC-AI-003-03-02 |
| Ai.AnswerSources | This answer is based on: {sources}. | AC-AI-010-02-01 |
| Ai.GenerationFailed | The text could not be generated. Nothing has been changed. | AC-AI-002-01-02 |
| Ai.NotEnoughData | There are not enough comparable products to suggest a price. | AC-AI-002-03-02 |
| Ai.GeneratedLabel | Generated with AI | AC-AI-002-05-01, AC-AI-004-01-01, AC-AI-004-02-01, AC-AI-009-01-01 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Language-model provider (AI-002, AI-003, AI-004, AI-009) | Query (IC-AI-01) | Gemini, ChatGPT or DeepSeek (native options); provider not named in sources | DP-01 |
| Translation service (AI-001) | Translate (IC-AI-05) | Google Cloud Translation or DeepL (native options) | DP-01 |
| Live chat and help desk (AI-003, AI-004) | Approved answers (IC-CRM-02), hand-off, ticket (IC-CRM-04), draft (IC-AI-02) | CRM-008, CRM-001 licensed plugins | V-01 |
| WhatsApp (AI-003) | Inbound messages routed by CHN-006; replies through IC-CHN-04 SendReply | CHN-006 | |
| OCR and ID-check service (AI-005) | IC-AI-04 | Not named | External |
| ML services (AI-006 to AI-008) | IC-AI-03 | Not named | External |
| Internal callers of IC-AI-03 | Score (PAY-018); Recommend, SendEvents, DeleteSubjectData (SRC-009, IC-SRC-04) | PAY and SRC modules | Internal |
| Translation status (PLT-025) | SetStatus (IC-PLT-09) | PLT module (internal) | On AI-001 approval |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-AI-01 | Language-model query | Prompt built by the plugin (question, approved content excerpts, instructions, language) | Answer text | Provider error (NopException), timeout (RequestTimeout) | Native ArtificialIntelligenceHttpClient.SendQueryAsync(string) with the provider from ArtificialIntelligenceSettings, or a plugin client if conversation features are needed (decision at build) |
| IC-AI-02 | Chat channel | Web widget message; CHN-006 inbound WhatsApp message routed by CHN (BR-CHN-014); hand-off request | Bot reply (web widget, or WhatsApp through IC-CHN-04 SendReply); hand-off to CRM-008 or ticket through IC-CRM-04 | Channel refused, live chat unavailable | IWidgetPlugin view component; CHN IC-CHN-04; approved answers through IC-CRM-02; CRM-008 interface (V-01); IC-CRM-04 |
| IC-AI-03 | External ML service | Score(transaction); Recommend(customer, surface); SendEvents(pseudonymous key, events: view, add to cart, purchase); DeleteSubjectData(pseudonymous key); Forecast(history); Inspect(photo) | Score with reasons and model version; ranked product ids with model version; accepted; deletion requested; forecast rows; findings with confidence | Unavailable, timeout (fall back per feature) | Integration plugins; results stored in plugin tables. Score is called by PAY-018 (BR-PAY-090); Recommend, SendEvents and DeleteSubjectData are called by AI-007 as the IC-SRC-04 provider of SRC-009, which checks consent and product eligibility |
| IC-AI-04 | Document service | OCR(image); CheckId(image, document type); Extract fields(file, document type) = IC-DOC-06 | Text and fields with confidence; Verified / NotVerified / Inconclusive / Unavailable with reasons (IC-IAM-02 values, decision ONE-RECORD); field values with confidence | Unavailable, unsupported document, unreadable | Integration plugin; implements IC-DOC-06 for DOC-005; used by IAM flows |
| IC-AI-05 | Translation | Source language, text, target language, HTML flag | Translated text | Service error, unsupported language | Native TranslationModelFactory (Google Cloud Translation, DeepL clients); AI pack reuses it for further entity types |

C# signatures are produced at the start of the L2 build and approved by the tech lead; this table fixes the operations and their mapping. Providers are not named in any source.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Chat.HandedOff / Chat.Ticketed | None natively (AI event) | CRM-008, CRM-001 |
| Model-score rule evaluated (fraud score) | PAY-018 rule evaluation (BR-PAY-090), not a native event | PAY calls IC-AI-03 Score; PAY-018 writes the RiskFlag |
| AiSuggestion.Accepted | None natively (AI event) | AiUseLog (AI-010) |
| Translation.Approved | None natively; LocalizedProperty written through ILocalizedEntityService | Storefront shows the new text |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Shopper sends messages faster than the model answers | AI-003 | Messages of one conversation are answered in order; a new message waits until the previous answer is sent (Proposed) |
| Two approvers act on the same translation draft | AI-001 | The status change Pending → Approved / Rejected uses a row-version check on the plugin table; the second action fails and is shown as already decided |
| Hand-off requested while an answer is being generated | AI-003 | Hand-off wins; the late answer is discarded and not sent |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Conversation handed off | Support agents (via CRM-008) | Live chat console | AI-003 |
| Ticket created from chat | Shopper | Email through TRK-005 (CRM event code Ticket.Created) | AI-003 |
| Translation awaiting approval | Approvers | Admin notification | AI-001 |
| Bias report overdue; register entry incomplete | Administrators | Admin notification | AI-010 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Chatbot conversations, hand-offs, unanswered questions | AI-003 | D |
| AI use log and AI use register | AI-010 | FC-M24-014 |
| Demand forecasts | AI-008 | FC-M24-011 |
| Document check outcomes | AI-005 | D |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-AI-001 | Chatbot configuration changed | Administrator | Chatbot settings | old and new values |
| AUD-AI-002 | AI translation approved or rejected | Approver | AiTranslationDraft | entity, language, value, reason |
| AUD-AI-003 | AI suggestion accepted (content, image, price, draft) | User | AiSuggestion, target entity | feature, provider, before and after (SEC-004) |
| AUD-AI-004 | AI use register entry created or changed | Administrator | AiUseRegister | old and new values |
| AUD-AI-005 | Document check decided | Compliance staff | DocumentCheck | result, decision, reason |

Business events AUD-AI-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new values of entity changes (for example a LocalizedProperty written on approval) are captured by the SEC-004 IRepository<> decorator and need no call (BR-SEC-010). All AI plugin tables are written through IRepository<>; no AI code writes through INopDataProvider directly (BR-SEC-011). The native activity log is not used as audit. Names and fields are Proposed. Provider keys are never written to the audit trail.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-AI-001 | The chatbot never states data it did not read from approved content or native services. | BR-AI-001; REQ-MPC-FR-256 (approval) | AC-AI-003-01-03; AC-AI-003-02-01; T-AI-01 |
| NFR-AI-002 | Users are told when AI is used and can reach a person at any time. | FC-M24-014; BR-AI-010 | AC-AI-010-01-01; AC-AI-003-03-01 |
| NFR-AI-003 | Personal data sent to external AI providers is limited and recorded in the AI use register. | DP-01; SEC-012; BR-AI-005 | AC-AI-010-04-01; T-AI-03 |
| NFR-AI-004 | Provider keys entered per instance, never in packs. | CFG-01 | T-AI-04 |
| NFR-AI-005 | Chatbot response time and availability targets: Not stated in source — requires confirmation. | NFR-X-009; MG-11 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-AI-001 | P3 | — | |
| PRD-AI-002 | P3 | — | |
| PRD-AI-003 | P1 | PRD-CHN-006, PRD-AI-010 | |
| PRD-AI-004 | P3 | — | |
| PRD-AI-005 | P2 | — | |
| PRD-AI-006 | P3 | — | |
| PRD-AI-007 | P3 | PRD-SRC-009 | |
| PRD-AI-008 | P3 | — | |
| PRD-AI-009 | P3 | — | |
| PRD-AI-010 | P1 | — | PRD-AI-003 |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-AI-01 | Grounding: questions outside approved content get Ai.BotNoAnswer; no answer contains order data not read from native services; draft responses are never used. |
| T-AI-02 | Hand-off: request for a person, repeated failures and provider outage all reach CRM-008 or a CRM-001 ticket with the transcript. |
| T-AI-03 | Data sent: inspect provider requests for each AI feature; only fields allowed by the AI use register entry are present. |
| T-AI-04 | Secrets: export a configuration pack; no AI or translation key appears; a pack that sets one is refused; every AI setting key is in the key catalogue. |
| T-AI-08 | Contracts: IC-DOC-06 returns fields with confidence, Unreadable and service-unavailable cases; chatbot reads only IC-CRM-02 Approved answers; hand-off without an agent creates one ticket through IC-CRM-04. |
| T-AI-09 | Recommendations and scores: AI returns ranked ids without filtering; events are forwarded only with a pseudonymous key; a deletion request is sent on consent withdrawal; Score returns score, model version and reasons, and Unavailable on timeout. |
| T-AI-05 | Native behaviour: pre-translation does not overwrite filled fields; meta generation fills only empty fields; GenerateMetaTags is refused without the entity permission. |
| T-AI-06 | Permissions: each permission in §4 has an allow and a deny case. |
| T-AI-07 | State models: every transition in §8.2 is tested; transitions not listed are rejected. |
