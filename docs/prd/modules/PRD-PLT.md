# L2 Module PRD — PLT: Platform foundation and multi-client configuration

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | PLT — Platform foundation and multi-client configuration |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Gives every client its own isolated nopCommerce installation (live and test), built from the same product release and set up by applying layered configuration packs (global, vertical, client, store) instead of new code. It controls changes to important settings (validation, approval, history, rollback), moves configuration between instances, switches product features on or off per client and store, migrates a new client's data, keeps all clients on one release, and covers the platform basics every client needs: branding, domain and TLS, sender identity, languages, currencies and rates, time zone, fiscal calendar, multi-store, monitoring, backup, responsive and accessible storefront, help and tours, retention, translation, hosting sizing and data-consistency safeguards.

**In scope**

- Multi-client model: one installation and database per client and environment; instance provisioning and lifecycle (PLT-001, PLT-002)
- Configuration packs and the pack loader; settings change control; configuration export, import, promotion and cloning (PLT-003 to PLT-005)
- Feature and module registry; product release and upgrade management; client data migration toolkit (PLT-021 to PLT-023)
- Branding and theme, custom domain and TLS, email sender identity (PLT-006 to PLT-008)
- Languages, currencies and exchange-rate providers, time zone and formats, fiscal calendar, translation management (PLT-009 to PLT-012, PLT-024, PLT-025)
- Multi-store B2B and B2C storefronts within one client (PLT-013)
- Platform non-functional features: monitoring, scalable architecture, backup and recovery, responsive storefront, accessibility, help and tours, retention, hosting sizing, data-consistency safeguards (PLT-014 to PLT-020, PLT-026, PLT-027)

**Not in this module**

| Item | Where it is |
|---|---|
| Hosting supply, cloud accounts, DNS, TLS certificates, backup infrastructure, monitoring platform | Project service / external systems (L1 section 6.9; decision ORG-SVC); PLT-001, PLT-014, PLT-016 specify only the product side |
| Platform audit trail (store of before/after values) | SEC-004 (IRepository<> decorator); PLT-004 reads it |
| Approval queues and workflow runtime used by settings approval | ADM-006 and ADM-002 (held by WF-ENG) |
| Roles and permissions model, role system names | IAM-007, IAM-008 |
| Report content and dashboards (fiscal-period grouping is supplied by PLT-012) | RPT module |
| Data warehouse | RPT-003 (REQ-MPC-ARC-001 data-warehouse clause) |
| Localised product content and AI translation | CAT-017, AI-001 |
| Message templates (email) and the notification engine | TRK-004, TRK-005 |
| Country data-protection profile (legal retention values, consent texts) | SEC-012; PLT-020 applies the retention values it supplies |
| Document legal hold and document retention classes | DOC-002 (registers document types as PLT-020 record types) |
| Transaction types and their parameter schema (target of transaction-level overrides) | ADM-004, ADM-011 |
| Seller training content, content pages | SEL-023, MKT-007 |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-PLT-001 | Client instance provisioning | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | PRD-PLT-003, PRD-PLT-021 | |
| PRD-PLT-002 | Client data isolation | Platform / back-office | P1 | Configuration | None | Core (always on) | | F-CAT-B |
| PRD-PLT-003 | Configuration packs | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-PLT-022 | |
| PRD-PLT-004 | Settings change control | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-ADM-002, PRD-SEC-004 | WF-ENG |
| PRD-PLT-005 | Configuration export, import and promotion | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-PLT-003 | |
| PRD-PLT-006 | Branding and theme | Platform / back-office | P1 | Licensed plugin | None (or Theme/view override if no Pavilion licence) | Core (always on) | | |
| PRD-PLT-007 | Custom domain and SSL | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-PLT-008 | Email sender identity | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-PLT-009 | Languages and language packs | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-PLT-010 | Currencies and exchange rates | Platform / back-office | P1 | Configuration | None | Core (always on) | PRD-PLT-024 | |
| PRD-PLT-011 | Time zone and formats | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-PLT-012 | Fiscal calendar for reporting | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PLT-013 | Multi-store (B2B and B2C storefronts) | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-PLT-014 | Instance health and SLA monitoring | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-PLT-015 | Scalable, open architecture | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-PLT-016 | Backup and disaster recovery | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-PLT-017 | Responsive storefront | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-PLT-018 | Accessibility | Platform / back-office | P1 | Code-level | Theme/view override + Core modification (admin views) | Core (always on) | | |
| PRD-PLT-019 | Contextual help and guided tours | Platform / back-office | P1 | Code-level | Custom plugin + Theme/view override | Access and admin extensions pack | | |
| PRD-PLT-020 | Data retention and archival | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PLT-021 | Product release and upgrade management | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-PLT-022 | Feature and module registry | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PLT-023 | Client data migration toolkit | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PLT-024 | Exchange-rate provider framework | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-PLT-025 | Translation management | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-PLT-009 | |
| PRD-PLT-026 | Hosting profile and sizing NFR | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | C-SIZE |
| PRD-PLT-027 | Data consistency safeguards | Platform / back-office | P2 | Code-level | Core modification + Custom plugin | Core (always on) | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Platform team | Builds and certifies the product release, maintains global and vertical packs, provisions client instances, runs upgrades and data migrations | Role system name "PlatformOperator" in each instance (Proposed; IAM role catalogue BR-IAM-050) |
| Client administrator | Maintains client and store settings, branding, languages, currencies, feature switches; requests changes to controlled settings | Administrators (native) |
| Configuration approver | Approves or rejects changes to controlled settings; cannot approve own changes | Administrators (native), a different person from the requester |
| Auditor | Reads configuration history and change reports | Role system name "Auditor" (IAM role catalogue BR-IAM-050; SEC-010) |
| Content staff / translator | Exports text for translation, imports translations, marks translations checked | Administrators or a client role holding Configuration.ManageLanguages |
| Shopper / staff user | Uses the storefront or admin in their language, on any device, with accessibility options, help tips and tours | Guests / Registered / any admin role (native) |
| Provisioning pipeline (system) | Creates databases, applications, appsettings and plugin folders; drives installation; applies packs; reports instance status | External system (CI/CD and infrastructure tooling, not named in source) |
| Monitoring platform (system) | Collects health, metrics and logs; raises alerts; holds the operator cross-client view | External system (not named in source) |
| Exchange-rate source (system) | Supplies exchange rates | External system (not named in source, KG-15) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Configuration.ManageSettings (native) | Configuration | Edit settings pages and All settings; with PLT installed, edits to controlled keys create a change set instead of saving directly; also edit the fiscal calendar and retention settings | Administrators |
| Configuration.ManageStores (native) | Configuration | Edit stores, store URL, hosts and SSL flag (PLT-007, PLT-013) | Administrators |
| Configuration.ManageLanguages (native) | Configuration | Edit languages, import and export resources, run translation export/import and mark translations checked (PLT-009, PLT-025) | Administrators |
| Configuration.ManageCurrencies (native) | Configuration | Edit currencies, rates, primary currencies and the rate provider (PLT-010, PLT-024) | Administrators |
| Configuration.ManageEmailAccounts (native) | Configuration | Edit email accounts and the default sender (PLT-008) | Administrators |
| Configuration.ManagePlugins (native) | Configuration | Install and uninstall plugins and edit store and role limits; plugin changes made outside a pack are reported as pack deviations | Administrators |
| Platform.Core.ChangeControl.View | Configuration | View change sets, configuration history, version compare and the configuration-change report | Administrators, Auditor |
| Platform.Core.ChangeControl.Approve | Configuration | Approve or reject change sets (never own change sets, BR-PLT-020) | Administrators |
| Platform.Core.Packs.View | Configuration | View packs, apply runs, deviations and the applied pack set | Administrators, PlatformOperator |
| Platform.Core.Packs.CreateEditDelete | Configuration | Import, validate, apply, export, promote and clone configuration | PlatformOperator |
| Platform.Core.Features.View | Configuration | View the feature registry and the state per client and store | Administrators, PlatformOperator |
| Platform.Core.Features.CreateEditDelete | Configuration | Switch product features on or off per client and store | PlatformOperator |
| Platform.Core.Instance.CreateEditDelete | System | Record UAT sign-off and change the instance lifecycle status (normally called by the provisioning pipeline) | PlatformOperator |
| Platform.Core.Migration.CreateEditDelete | System | Upload migration files, run dry runs and imports, view reconciliation reports | PlatformOperator |
| Platform.Core.Retention.CreateEditDelete | System | Create and change retention rules and view retention runs | Administrators |
| Platform.Core.Releases.View | System | View the instance release version, upgrade runs and post-upgrade checks | Administrators, PlatformOperator |
| Platform.Core.Help.CreateEditDelete | ContentManagement | Create and edit help tips and guided tours | Administrators |

Permissions are declared in the PLT plugin class implementing IPermissionConfigManager (pattern: Plugins/Nop.Plugin.Misc.RFQ/Services/RfqPermissionConfigManager.cs). Native permissions are reused where they exist (StandardPermission.Configuration.MANAGE_SETTINGS, MANAGE_STORES, MANAGE_LANGUAGES, MANAGE_CURRENCIES, MANAGE_EMAIL_ACCOUNTS, MANAGE_PLUGINS). New system names use the plugin prefix Platform.Core and the 5.00 view / create-edit-delete split (unchanged from 4.90; for example StandardPermission.Catalog.PRICE_LISTS_VIEW and PRICE_LISTS_CREATE_EDIT_DELETE, Libraries/Nop.Services/Security/StandardPermission.cs:76-77); Category is one of the native categories. Default roles are given by role system name. Every role name is in the IAM role catalogue (BR-IAM-050): Auditor and PlatformOperator; IAM creates catalogue roles that are missing, and PLT relies on IAM for that. Holding Configuration.ManageSettings alone does not let a user change a controlled key without approval: the PLT action filter and the ISettingService override (BR-PLT-020; PLT-004 is the registered owner of ISettingService, decision OVR-REG) apply to every admin request. All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-PLT-PERM-01 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-02 | **Given** a user without Configuration.ManageStores (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-03 | **Given** a user without Configuration.ManageLanguages (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-04 | **Given** a user without Configuration.ManageCurrencies (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-05 | **Given** a user without Configuration.ManageEmailAccounts (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-06 | **Given** a user without Configuration.ManagePlugins (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-07 | **Given** a user without Platform.Core.ChangeControl.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-08 | **Given** a user without Platform.Core.ChangeControl.Approve, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-09 | **Given** a user without Platform.Core.Packs.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-10 | **Given** a user without Platform.Core.Packs.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-11 | **Given** a user without Platform.Core.Features.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-12 | **Given** a user without Platform.Core.Features.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-13 | **Given** a user without Platform.Core.Instance.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-14 | **Given** a user without Platform.Core.Migration.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-15 | **Given** a user without Platform.Core.Retention.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-16 | **Given** a user without Platform.Core.Releases.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-PLT-PERM-17 | **Given** a user without Platform.Core.Help.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-PLT-001 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Installer creates one store with required data (Libraries/Nop.Services/Installation/InstallationService + InstallRequiredData.cs); no client recipe, no test/live pair, no instance status. | Provisioning of live + test instances with lifecycle status belongs in DevOps/IaC pipeline (infra templates, DB create, appsettings). nopCommerce side: load client config pack (see PRD-PLT-003). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-002 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: One nopCommerce installation = one database (single-tenant by design); deploying one installation per client gives full isolation. | None in nopCommerce; enforce one-instance-per-client in hosting. Do NOT use multi-store for client separation (stores share one DB). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-003 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Settings are key/value rows (Libraries/Nop.Core/Domain/Configuration/Setting.cs) editable in Admin > All settings (Presentation/Nop.Web/Areas/Admin/Controllers/SettingController.cs:AllSettings); language XML import (LanguageController.ImportXml). No pack concept, no layered global/industry/client merge, no single-transaction apply. | Custom plugin: pack format (settings, roles/permissions, message templates, resources, categories), layered merge, transactional apply, version stamp. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-004 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Activity log type 'EditSettings' records that settings were edited (Libraries/Nop.Core/Domain/Logging/ActivityLog.cs: EntityName, Comment, IpAddress) without old/new values; no validation preview, approval, diff or rollback. | Maker-checker through a PAY-style action filter on admin setting actions (including SettingDelete(int id) and plugin Configure pages) plus an ISettingService override that refuses unapproved writes; pending change set applied on approval; old/new values via the SEC-004 repository decorator; impact preview, version compare and rollback. A ModelReceivedEvent veto is not sufficient (no model on some actions; consumer exceptions are swallowed). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-005 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Language resources export/import XML (Presentation/Nop.Web/Areas/Admin/Controllers/LanguageController.cs:ExportXml/ImportXml). No settings export/import or environment promotion. | Settings/config export-import and test-to-live promotion (reuse PRD-PLT-003 pack format). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-006 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Logo per store (Libraries/Nop.Core/Domain/StoreInformationSettings.cs:LogoPictureId), theme per store (StoreInformationSettings.DefaultStoreTheme, AllowCustomerToSelectTheme); only theme shipped: Presentation/Nop.Web/Themes/DefaultClean (no admin colour/font controls). \| 5.00.1: Still only theme shipped: Presentation/Nop.Web/Themes/DefaultClean. Theme resolution moved to Libraries/Nop.Services/Themes/IThemeContext.cs + ThemesMiddleware.cs (no admin colour/font editor). StoreInformationSettings adds XLink, TikTokLink, SnapchatLink, PinterestLink, TumblrLink. | Colours/fonts/layout per client without code: Nop-Templates Pavilion theme (PG PLT-02) — 5.00 version to confirm with vendor. Native alternative: per-client DefaultClean child theme (Theme/view override). Availability of this licensed plugin for 5.00 is not verifiable from source (evidence is Post Gebeya on 4.70.5); decision V-01. | None (or Theme/view override if no Pavilion licence) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in Post Gebeya (4.70.5) — confirm on 5.00.1 |
| PRD-PLT-007 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Store URL, host bindings and SSL flag per store (Libraries/Nop.Core/Domain/Stores/Store.cs:Url,Hosts,SslEnabled). | TLS certificate and DNS provisioned at hosting level. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-008 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Email accounts with sender address/display name, SMTP or OAuth2 (ClientId/TenantId) (Libraries/Nop.Core/Domain/Messages/EmailAccount.cs); account per message template (MessageTemplate.EmailAccountId); default account (EmailAccountSettings.DefaultEmailAccountId). | SPF/DKIM/DMARC DNS records at client domain (hosting/DNS task). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-009 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Languages with RTL flag (Libraries/Nop.Core/Domain/Localization/Language.cs:Rtl), language selector, per-store limitation; countries/states admin (Country, StateProvince, states.txt import). | Chichewa/Swahili resource translation is content work (PRD-PLT-025). Districts beyond state/province level not native (Address has County only). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-010 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Multiple currencies, manual rates, primary store/exchange currencies (Libraries/Nop.Core/Domain/Directory/Currency.cs:Rate,RoundingTypeId; CurrencySettings.PrimaryStoreCurrencyId,PrimaryExchangeRateCurrencyId,AutoUpdateEnabled). | Automatic KES/MWK rates via PRD-PLT-024. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-011 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Store time zone (Libraries/Nop.Services/Helpers/DateTimeSettings.cs:DefaultStoreTimeZoneId, AllowCustomersToSetTimeZone); date/number formats follow Language.LanguageCulture. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-012 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: No fiscal-year setting; reports filter by calendar date range only. | Fiscal calendar setting and period grouping in reports. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-013 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Multi-store: Store entity, store mapping on products/categories/manufacturers/topics/currencies/languages/etc. (IStoreMappingSupported), per-store settings overrides, per-store tier prices, per-store theme. | Per-store payment/shipping restriction is also native (plugin LimitedToStores). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-014 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Admin System info and Warnings pages (Presentation/Nop.Web/Areas/Admin/Controllers/CommonController.cs:SystemInfo,Warnings); system log (Libraries/Nop.Core/Domain/Logging/Log.cs); KeepAliveTask. \| 5.00.1: No health-check endpoint found in 5.00.1 (no HealthCheck usage in Libraries/Presentation). | Uptime/APM/SLA dashboards and alerting and cross-instance operator view need an external monitoring platform; nopCommerce exposes logs and a health endpoint (health endpoint to be added via small plugin). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-015 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: .NET cross-platform; SQL Server, MySQL, PostgreSQL data providers; distributed cache memory/sqlserver/redis for web farms; plugin architecture; bundled Misc.AzureBlob for shared media. \| 5.00.1: 5.00.1 targets .NET 10 (Directory.Build.props:3 net10.0); MySQL type map now Libraries/Nop.Data/DataProviders/Fluentmigrator/NopMySql8TypeMap.cs (NopMySql5TypeMap removed); bundled Misc.AzureBlob and Misc.CloudflareImages (real plugins) for media offload. | Server scaling, load balancer and OS choice are hosting. Hosting must provide .NET 10 runtime and MySQL 8+ if MySQL is used. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-016 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Admin Maintenance > Backup database (Presentation/Nop.Web/Areas/Admin/Controllers/CommonController.cs:BackupDatabase) — implemented for SQL Server only (MySQL/PostgreSQL providers do not implement it). \| 5.00.1: Backup still SQL Server only: PostgreSqlDataProvider.cs:263 and MySqlDataProvider.cs:232 throw 'This database provider does not support backup'. | Scheduled backups, tested restores, DR site and RTO/RPO are hosting/DB-platform capabilities. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-017 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Responsive DefaultClean theme. | None (verify on client theme if Pavilion/custom theme used). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-018 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: No WCAG conformance statement or accessibility settings; no high-contrast/large-text switch in theme. | WCAG 2.1 AA audit and fixes on storefront and admin views; contrast/text-size toggle. | Theme/view override + Core modification (admin views) | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: absence of settings verified; actual WCAG compliance needs audit |
| PRD-PLT-019 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Admin first-run configuration steps tour (resources Admin.ConfigurationSteps.*) and documentation links (AdminAreaSettings.ShowDocumentationReferenceLinks) — admin store setup only. | Per-screen help tips and guided tours for buyers, sellers and staff. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-020 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Scheduled cleanup only: ClearLogTask (CommonSettings.ClearLogOlderThanDays), DeleteGuestsTask, DeleteInactiveCustomersTask (GdprSettings.DeleteInactiveCustomersAfterMonths). | Retention rules per record type (orders, payments, tickets), archive store, purge jobs. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-021 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Versioned DB upgrade migrations (Libraries/Nop.Data/Migrations/UpgradeTo*) run on start; plugins declare SupportedVersions in plugin.json. \| 5.00.1: 5.00 upgrade migrations in Libraries/Nop.Data/Migrations/UpgradeTo500 and Presentation/Nop.Web.Framework/Migrations/UpgradeTo500; every bundled plugin.json declares SupportedVersions ["5.00"]. | Release pipeline, per-client upgrade orchestration and regression checks are CI/CD tooling outside nopCommerce. Every custom and third-party plugin must be rebuilt for 5.00 / .NET 10. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-022 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Plugins can be enabled and limited per store and per customer role (Libraries/Nop.Services/Plugins/PluginDescriptor.cs:LimitedToStores,LimitedToCustomerRoles); many core features have on/off settings. | Single feature registry/switchboard per client and store covering core features and custom modules. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-023 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Excel import of customers, orders, products, categories, manufacturers (Libraries/Nop.Services/ExportImport/IImportManager.cs:ImportCustomersFromXlsxAsync, ImportOrdersFromXlsxAsync, ImportProductsFromXlsxAsync). \| 5.00.1: NEW in 5.00: price-list Excel import (Libraries/Nop.Services/ExportImport/IImportManager.cs:76 ImportPriceListsFromXlsxAsync; Admin PriceListController.ImportExcel). | Import of reward-point balances, gift-card balances, address books; reconciliation report proving completeness. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-024 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Exchange-rate provider plugin interface (Libraries/Nop.Services/Directory/IExchangeRateProvider.cs) and UpdateExchangeRateTask; bundled ECB provider reads eurofxref-daily.xml. \| 5.00.1: Only bundled provider still Plugins/Nop.Plugin.ExchangeRate.EcbExchange; IExchangeRateProvider.cs identical to 4.90.8. | Provider plugin(s) for KES/MWK sources (e.g. central-bank feeds). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-025 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Resource XML export/import; NEW in 4.90: machine pre-translation of localized entity fields via Google Translate or DeepL (Libraries/Nop.Core/Domain/Translation/TranslationSettings.cs:AllowPreTranslate,TranslationServiceId; PreTranslate actions on Product/Category/Manufacturer/attributes). \| 5.00.1: TranslationSettings.cs identical to 4.90.8 (AllowPreTranslate, TranslationServiceId). | Translation review status (checked/unchecked) tracking and outbound/inbound translation workflow for all content. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-PLT-026 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: N/A — sizing document. | Hosting profile (MPC: 4 cores, 8 GB, 2 TB) is an infrastructure deliverable. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: non-functional hosting document |
| PRD-PLT-027 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Order placement lock (Libraries/Nop.Core/Domain/Orders/OrderSettings.cs:PlaceOrderWithLock, MinimumOrderPlacementInterval). No RowVersion/concurrency token on entities, no idempotency keys. \| 5.00.1: No RowVersion/concurrency token or idempotency key found in 5.00.1 Libraries; OrderSettings.PlaceOrderWithLock (OrderSettings.cs:169) unchanged. | Optimistic concurrency (row version on key tables + repository checks) and idempotency keys for state-changing requests/APIs. Row-version columns on core tables are a registered core modification; idempotency keys are plugin middleware. | Core modification + Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-PLT-001 Client instance provisioning

| Item | Value |
|---|---|
| Description (baseline) | A ready-made recipe that sets up a new client's website in one go: a live site plus a separate practice (test) site, already loaded with the settings chosen for that client. Each client site has a status (being set up, active, suspended, archived, restored) with the right behaviour at each stage. |
| Why it matters | New clients go live by switching things on, not by writing new code, so onboarding is fast and the same every time. |
| Who benefits | Platform team; new clients |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-PLT-003, PRD-PLT-021 |
| Status | Ready; conditions: CFG-01, PACK-FMT |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-001-01 | Technical enabler. As a member of the platform team, I want to set up a new client from one recipe that creates a live instance and a separate test instance with the settings chosen for that client, so that onboarding is the same every time and needs no new code. | D; REQ-KTDA-ENV-001; FC-M09-001; FC-M09-003 | Ready; conditions: CFG-01, PACK-FMT |
| US-PLT-001-02 | Technical enabler. As a member of the platform team, I want each client instance to have a lifecycle status with defined behaviour and a notification at each change, so that everyone knows what an instance can do at each stage. | D; FC-M09-013 | Ready; conditions: CFG-01, PACK-FMT |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-001-01-01 | US-PLT-001-01 | **Given** a provisioning request names the client code, the product release version and the client pack set (global, country, vertical, client), **when** the provisioning pipeline runs, **then** two installations are created, live and test, each with its own database, its own App_Data/appsettings.json connection string, its own App_Data folder (plugins.json, DataProtectionKeys) and the same product release (BR-PLT-001, BR-PLT-003). | D; REQ-KTDA-ENV-001; FIT (NopConfigurationDefaults.AppSettingsFilePath; NopDataProtectionDefaults.DataProtectionKeysPath) |
| AC-PLT-001-01-02 | US-PLT-001-01 | **Given** the installations exist, **when** nopCommerce installation completes on each, **then** only the plugins in the release plugin folder that are not listed in InstallationConfig.DisabledPlugins are installed (native installer behaviour), then the PLT plugin applies the client pack set through the pack loader (PLT-003) and records the applied pack set. | FIT (InstallController: InstallationConfig.DisabledPlugins, PreparePluginToInstallAsync); D |
| AC-PLT-001-01-03 | US-PLT-001-01 | **Given** a new client is provisioned, **when** provisioning completes, **then** the test instance reaches status Active first; the live instance cannot be set Active until a UAT sign-off (reference, signed by, date) is recorded on it; an attempt is refused with message Plt.InstanceNotSignedOff (BR-PLT-002). | REQ-KTDA-ENV-001; Proposed (sign-off gate) |
| AC-PLT-001-01-04 | US-PLT-001-01 | **Given** any provisioning step fails, **when** the pipeline stops, **then** the instance status becomes ProvisioningFailed, the failed step and the resources already created are reported to the platform team, and no live instance is set Active. | Proposed |
| AC-PLT-001-01-05 | US-PLT-001-01 | **Given** the test instance is created, **when** it is used, **then** it holds no production customer, order or payment data and uses its own provider credentials, entered per instance (BR-PLT-013). | D (separate practice site); CFG-01 |
| AC-PLT-001-01-06 | US-PLT-001-01 | **Given** a live instance is ready for go-live, **when** the go-live checklist is run, **then** each item is recorded as passed or failed with evidence, and the instance cannot be set Active while an item is failed (BR-PLT-004): HTTPS on every store (Store.SslEnabled true); forwarded headers set when TLS ends at a proxy (HostingConfig.UseProxy, ForwardedProtoHeaderName, ForwardedForHeaderName, KnownProxies or KnownNetworks); TLS versions and ciphers; encryption at rest for database, files and backups; web application firewall and DDoS protection in front; an application database login with insert and select only on audit tables (SEC-004); hosting region per DP-01; DistributedCacheConfig.Enabled when more than one web node. | Proposed (SEC hosting items); FIT (Store.SslEnabled; HostingConfig; DistributedCacheConfig) |
| AC-PLT-001-02-01 | US-PLT-001-02 | **Given** an instance is Active, **when** the platform team sets it Suspended with a reason, **then** StoreInformationSettings.StoreClosed is set true for every store, so the storefront shows the native store-closed page except to users holding PublicStore.AccessClosedStore; the client contact is notified; audited (AUD-PLT-001). | D; FC-M09-013; FIT (CheckAccessClosedStoreAttribute) |
| AC-PLT-001-02-02 | US-PLT-001-02 | **Given** an instance is Suspended, **when** it is set Active again, **then** StoreClosed returns to the value recorded before suspension; the client contact is notified; audited (AUD-PLT-001). | FC-M09-013; Proposed |
| AC-PLT-001-02-03 | US-PLT-001-02 | **Given** an instance is Active or Suspended, **when** the platform team sets it Archived, **then** a final backup is taken and verified (PLT-016), the application is stopped and the database is kept for the archive period (setting, default not stated); the client contact is notified. | D; FC-M09-013; Proposed |
| AC-PLT-001-02-04 | US-PLT-001-02 | **Given** an instance is Archived, **when** the platform team restores it, **then** the database and App_Data are restored from the archive backup, the status becomes Restored and then Active after a smoke test passes; any other transition is rejected (SM-PLT-01). | D; FC-M09-013; Proposed |

**Business rules applied:** BR-PLT-001; BR-PLT-002; BR-PLT-003; BR-PLT-004; BR-PLT-095; BR-PLT-096 (§8.1).


### 7.2 PRD-PLT-002 Client data isolation

| Item | Value |
|---|---|
| Description (baseline) | Each client gets its own copy of the system and its own database, so one client's customers, orders and prices can never be seen by another client. |
| Why it matters | Protects every client's business data and makes data-protection compliance simpler. |
| Who benefits | Clients; clients' customers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | On hold: F-CAT-B |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-002-01 | As a client, I want my own installation and database, separate from every other client, so that no other client can see or change my customers, orders or prices. | D; FC-M09-002 | On hold: F-CAT-B |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-002-01-01 | US-PLT-002-01 | **Given** two clients are provisioned, **when** their configuration is inspected, **then** each installation has its own database connection string, App_Data folder, data-protection keys and media storage; none of these is shared between clients (BR-PLT-003). | D; FC-M09-002; FIT (DataSettingsManager: one connection string per installation) |
| AC-PLT-002-01-02 | US-PLT-002-01 | **Given** two client instances use the same Redis or SQL Server distributed-cache server, **when** the instances are configured, **then** DistributedCacheConfig.InstanceName is unique per instance (the native default "nopCommerce" is never used), so cache keys and locks of one instance are never read by another. | FIT (DistributedCacheConfig.InstanceName default "nopCommerce"); Proposed |
| AC-PLT-002-01-03 | US-PLT-002-01 | **Given** a client needs a B2B and a B2C storefront, **when** the client is set up, **then** both are stores of the same client installation (PLT-013); stores are never used to separate two clients, because stores share one database and admin users are not limited by store. | D; FIT (Store entity, shared database) |
| AC-PLT-002-01-04 | US-PLT-002-01 | **Given** a user account exists in client A, **when** the same e-mail and password are used on client B, **then** sign-in fails on client B unless an account was created there; no customer, order or price of client A is returned by any page or API of client B. | D; FC-M09-002 |
| AC-PLT-002-01-05 | US-PLT-002-01 | **Given** the operator cross-client view is used (PLT-014), **when** it is opened, **then** it reads only monitoring data exported by each instance; no instance holds data of another client. | FC-M09-002; Proposed |

**Business rules applied:** BR-PLT-003 (§8.1).


### 7.3 PRD-PLT-003 Configuration packs

| Item | Value |
|---|---|
| Description (baseline) | Pre-packaged sets of settings (rules, roles, message wording, product categories and so on). A global pack applies to everyone, an industry pack adds sector settings, and a client pack adds that client's own choices. A single transaction type, or a single transaction, can override its client pack where justified; every override is recorded as a change from the pack. |
| Why it matters | This is the main tool that lets a new client be set up by choosing options rather than by new development. |
| Who benefits | Platform team; new clients |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PLT-022 |
| Status | Ready; conditions: CFG-01, PACK-FMT |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-003-01 | Technical enabler. As a member of the platform team, I want to keep configuration in packs at four layers — global, country, vertical (industry) and client — plus store entries, so that a new client is set up by choosing packs, not by development. | D; FC-M22-001; FC-M22-002; FC-M22-003; FC-M02-043; FC-M02-044 | Ready; conditions: CFG-01, PACK-FMT |
| US-PLT-003-02 | Technical enabler. As a member of the platform team, I want to apply a client's pack set to an instance in one operation that either fully succeeds or changes nothing, with a version stamp, so that instances are always in a known configuration. | D; FIT (gap: transactional apply, version stamp) | Ready; conditions: CFG-01, PACK-FMT |
| US-PLT-003-03 | As a client administrator, I want one transaction type, or one transaction, to override its client configuration where justified, with every override recorded, so that special cases are handled without changing the client pack. | D; FC-M22-004; FC-M02-045 | Ready; conditions: CFG-01, PACK-FMT |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-003-01-01 | US-PLT-003-01 | **Given** global, country, vertical and client packs that each state key K, **when** the loader merges them, **then** the client value wins over the vertical value, the vertical value over the country value and the country value over the global value; a key not stated by a higher layer keeps the value of the lower layer (BR-PLT-010). | D; CFG-01 |
| AC-PLT-003-01-02 | US-PLT-003-01 | **Given** the merged result, **when** it is applied, **then** merged shared keys are written as Setting rows with StoreId 0 and store entries as rows with StoreId of the named store; at run time SettingService.LoadSettingAsync returns the store row, else the StoreId 0 row, else the settings-class default; no other layer exists at run time (BR-PLT-011). | FIT (SettingService.LoadSettingAsync, GetSettingByKeyAsync with loadSharedValueIfNotFound) |
| AC-PLT-003-01-03 | US-PLT-003-01 | **Given** a store entry for key K was applied by the previous pack version and the new pack version no longer states it, **when** the new version is applied, **then** the store row for K is deleted, so the store again uses the StoreId 0 value (BR-PLT-011). | Proposed; FIT (SettingService.SaveSettingOverridablePerStoreAsync deletes store rows the same way) |
| AC-PLT-003-01-04 | US-PLT-003-01 | **Given** a pack is validated, **when** a setting key is not a property of a known ISettings class (lower-case <ClassName>.<PropertyName>) and not in the key catalogue of an installed product plugin, or a value cannot be converted by the property TypeConverter, **then** validation fails with message Plt.PackKeyUnknown naming the key and nothing is written. | Proposed; FIT (SettingService key format and TypeDescriptor conversion) |
| AC-PLT-003-01-05 | US-PLT-003-01 | **Given** a pack maps permissions to roles, **when** it is validated, **then** every permission system name must exist in the 5.00 permission set (StandardPermission or a plugin IPermissionConfigManager); a 4.70 name such as ManageProducts, or a 4.90 name removed in 5.00 (ContentManagement.NewsView, NewsCreateEditDelete, PollsView, PollsCreateEditDelete, ForumsCreateEditDelete; news, polls and forums are now the bundled plugins Misc.News, Misc.Polls and Misc.Forums with their own permissions), fails with message Plt.PackPermissionUnknown. | FIT (L1 section 6.1: 5.00 permission model; Libraries/Nop.Services/Security/StandardPermission.cs; Plugins/Nop.Plugin.Misc.News, Nop.Plugin.Misc.Polls, Nop.Plugin.Misc.Forums) |
| AC-PLT-003-01-06 | US-PLT-003-01 | **Given** a store entry names a store code that does not exist in the instance, **when** the pack is validated, **then** validation fails with message Plt.PackStoreUnknown and nothing is written. | Proposed |
| AC-PLT-003-01-07 | US-PLT-003-01 | **Given** a pack contains a key on the secret deny list (BR-PLT-013), **when** it is imported, **then** the import is refused with message Plt.PackSecretRefused naming the key. | CFG-01 |
| AC-PLT-003-01-08 | US-PLT-003-01 | **Given** a pack contains plugin enablement, **when** it is applied, **then** plugins to install are queued with IPluginService.PreparePluginToInstallAsync and the run ends with message Plt.RestartRequired (installation runs at application start, AppStartedConsumer); store and role limits are written to each plugin's plugin.json through PluginDescriptor.Save; active-provider lists (for example paymentsettings.activepaymentmethodsystemnames) are written as settings (BR-PLT-012). | FIT (PluginService.PreparePluginToInstallAsync; AppStartedConsumer.InstallPluginsAsync; PluginDescriptor.Save; NopPluginDefaults.PluginsInfoFilePath) |
| AC-PLT-003-01-09 | US-PLT-003-01 | **Given** the pack holds locale resources, message templates, roles, categories and specification attributes, feature states and ADM workflow and rule definitions, **when** it is applied, **then** each artefact is written through its native or owning service (ILocalizationService.ImportResourcesFromXmlAsync, IMessageTemplateService, IPermissionService.InsertPermissionMappingAsync, ICategoryService, the PLT-022 registry, the ADM-002 and ADM-003 contracts); no artefact is written by direct SQL. | FIT (ILocalizationService.ImportResourcesFromXmlAsync; IPermissionService.InsertPermissionMappingAsync); Proposed |
| AC-PLT-003-02-01 | US-PLT-003-02 | **Given** a validated pack set, **when** it is applied, **then** all database writes run in one TransactionScope under ILocker key 'plt-config-write'; if any write fails none is kept and the run status becomes Failed with message Plt.PackApplyFailed (BR-PLT-015). | Proposed; FIT (EntityRepository bulk writes open INopDataProvider.CreateTransactionScope: TransactionScopeOption.Required, Serializable, async flow enabled, so they join an outer scope — Libraries/Nop.Data/DataProviders/BaseDataProvider.cs:503-533; ILocker.PerformActionWithLockAsync) |
| AC-PLT-003-02-02 | US-PLT-003-02 | **Given** the database writes are committed and a file write (plugin.json or plugins.json) fails, **when** the loader detects the failure, **then** it restores the files and the database rows from the pre-apply snapshot, sets the run Failed and shows message Plt.PackApplyFailed (BR-PLT-015). | Proposed |
| AC-PLT-003-02-03 | US-PLT-003-02 | **Given** an apply succeeds, **when** the run completes, **then** the instance records the applied pack set (pack codes, versions, checksums, applied by, applied at) and the setting cache is cleared once at the end (settings are written with clearCache false, then ISettingService.ClearCacheAsync); audited (AUD-PLT-002). | D (version stamp); FIT (SettingService.SetSettingAsync clearCache parameter) |
| AC-PLT-003-02-04 | US-PLT-003-02 | **Given** the same pack set (same checksums) was already applied, **when** it is applied again, **then** nothing is written and the run reports "no changes" (BR-PLT-016). | Proposed |
| AC-PLT-003-02-05 | US-PLT-003-02 | **Given** a key was changed in the instance after the last apply, so its value differs from the value the last pack wrote, **when** a new pack version that states the key is applied, **then** the run stops before writing and lists each such key with message Plt.PackConflict; for each key the platform team chooses keep the instance value (recorded as a deviation) or take the pack value; audited (AUD-PLT-003). | Proposed |
| AC-PLT-003-03-01 | US-PLT-003-03 | **Given** a transaction type (ADM-004) has a parameter whose client default comes from the client pack, **when** a client administrator sets a type-level override with a reason, **then** transactions of that type use the override, other types use the client value, and the override is recorded as a deviation with pack value, override value, reason and user (BR-PLT-017). | D; FC-M22-004 |
| AC-PLT-003-03-02 | US-PLT-003-03 | **Given** a single transaction overrides a parameter of its type, **when** it is saved without a reason, **then** the save is refused with message Plt.OverrideReasonRequired; with a reason it is saved, recorded as a deviation and audited (AUD-PLT-012). | D; FC-M02-045 |
| AC-PLT-003-03-03 | US-PLT-003-03 | **Given** an override at transaction-type or transaction level names a native setting key (a Setting row), **when** it is saved, **then** it is refused with message Plt.OverrideNotAllowed, because native settings resolve only by store and shared value (BR-PLT-011, BR-PLT-017). | Proposed; FIT (SettingService two-level resolution) |
| AC-PLT-003-01-10 | US-PLT-003-01 | **Given** a pack set names no country pack, or two country packs, **when** it is validated, **then** validation fails with message Plt.PackCountryInvalid and nothing is written; a pack set with exactly one country pack (for example a Kenya or Malawi pack, contents Not stated in source) is applied at the country layer of BR-PLT-010 and its code, version and checksum are recorded with the applied pack set. | Proposed (country layer); CFG-01 |
| AC-PLT-003-01-11 | US-PLT-003-01 | **Given** a pack written for nopCommerce 4.90 states a setting key that 5.00 removed or moved (customersettings.phonenumbervalidationuseregex and customersettings.phonenumbervalidationrule are removed; ordersettings.returnrequestsenabled, returnrequestsallowfiles, returnrequestsfilemaximumsize, returnrequestnumbermask and numberofdaysreturnrequestavailable are now returnrequestsettings.*), **when** the pack is validated against a 5.00 instance, **then** validation fails with message Plt.PackKeyUnknown naming each such key and nothing is written; the pack is corrected by dropping the removed keys (5.00 validates phone numbers with libphonenumber when CustomerSettings.PhoneNumberValidationEnabled is on) and renaming the moved keys. | FIT (Libraries/Nop.Core/Domain/Customers/CustomerSettings.cs:43; Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs:13-33; Presentation/Nop.Web.Framework/Migrations/UpgradeTo500/SettingMigration.cs:118-146; Presentation/Nop.Web.Framework/Validators/PhoneNumberPropertyValidator.cs); VER-500 |

**Business rules applied:** BR-PLT-010; BR-PLT-011; BR-PLT-012; BR-PLT-013; BR-PLT-015; BR-PLT-016; BR-PLT-017; BR-PLT-096 (§8.1).


### 7.4 PRD-PLT-004 Settings change control

| Item | Value |
|---|---|
| Description (baseline) | Any change to important settings is checked when saved, shows in advance what it will affect, can be sent for approval, keeps a history of old and new values, and can be undone. Two versions of the settings can be compared side by side and changes copied between them. |
| Why it matters | Stops accidental or unauthorised changes from breaking the live shop, and shows who changed what. |
| Who benefits | Client administrators; auditors |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-ADM-002, PRD-SEC-004 |
| Status | On hold: WF-ENG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-004-01 | As a client administrator, I want changes to important settings to be checked when I save them, so that invalid settings never reach the live shop. | D; FC-M22-011; FC-M02-048 | On hold: WF-ENG |
| US-PLT-004-02 | As a client administrator, I want to see in advance what a change will affect, so that I understand the effect before it is applied. | D; FC-M22-008; FC-M02-050 | On hold: WF-ENG |
| US-PLT-004-03 | As a configuration approver, I want changes to important settings to need my approval before they take effect, so that unauthorised or accidental changes are stopped. | D; FC-M22-005 | On hold: WF-ENG |
| US-PLT-004-04 | As an auditor, I want a history of every configuration change with old and new values, who, when, why and who approved, so that I can show who changed what. | D; REQ-MPC-FR-318; REQ-MPC-FR-287; REQ-MPC-FR-320; FC-M22-007; FC-M02-046 | On hold: WF-ENG |
| US-PLT-004-05 | As a client administrator, I want to undo a change by returning selected settings to an earlier version, so that a bad change is reversed quickly. | D; REQ-MPC-FR-300; FC-M22-006; FC-M02-049 | On hold: WF-ENG |
| US-PLT-004-06 | Technical enabler. As a member of the platform team, I want to compare two configuration versions side by side and copy changes from one to the other, so that differences are visible and can be carried over. | D; FC-M22-012 | On hold: WF-ENG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-004-01-01 | US-PLT-004-01 | **Given** key K is on the controlled-items list and has a validator (type, range, reference or cross-key rule), **when** an administrator saves a settings page or the All settings grid with an invalid value for K, **then** nothing is written, the page shows message Plt.ConfigInvalid with the key and the reason, and the live value is unchanged. | D; FC-M22-011; FC-M02-048 |
| AC-PLT-004-01-02 | US-PLT-004-01 | **Given** key K is controlled, **when** an administrator saves a valid change to K through any admin page (settings pages, All settings SettingUpdate, SettingAdd, SettingDelete, a plugin Configure page), **then** the PLT action filter marks the request as change-controlled and the PLT ISettingService override records the write in a pending change set instead of writing the Setting row; the page shows message Plt.ChangePending; the live value is unchanged (BR-PLT-020). | Proposed; FIT (SettingService InsertSettingAsync, UpdateSettingAsync and DeleteSettingAsync are public virtual and are the only write path; 5.00.1 removed every synchronous ISettingService member, so the override implements async members only — Libraries/Nop.Services/Configuration/ISettingService.cs:27-192; SettingDelete(int id) takes no model, so a ModelReceivedEvent veto cannot cover it) |
| AC-PLT-004-01-03 | US-PLT-004-01 | **Given** key K is not controlled, **when** an administrator saves it, **then** it is saved natively; the SEC-004 repository decorator records the old and new value (BR-PLT-022). | D; FIT (SettingService writes through IRepository<Setting>) |
| AC-PLT-004-01-04 | US-PLT-004-01 | **Given** the instance role is Test, **when** a valid change to a controlled key is saved, **then** the change set is applied at once after validation, without approval, and is still recorded (BR-PLT-020). | FC-M22-005 (instant for sandbox) |
| AC-PLT-004-02-01 | US-PLT-004-02 | **Given** a change set is pending, **when** the requester or approver opens it, **then** the preview lists, per key, the store or shared scope, the current and new value, the stores that inherit the shared value, and the impact counts returned by any module registered for that key (IC-PLT-03), for example the number of open orders using a payment method. | D; FC-M22-008; FC-M02-050 |
| AC-PLT-004-03-01 | US-PLT-004-03 | **Given** a change set of impact level Low is pending, **when** one user holding Platform.Core.ChangeControl.Approve other than the requester approves it, **then** it is applied through the base SettingService under ILocker key 'plt-config-write' and the status becomes Applied; audited (AUD-PLT-004). | D; FC-M22-005 |
| AC-PLT-004-03-02 | US-PLT-004-03 | **Given** a change set of impact level High is pending, **when** one approver approves it, **then** it stays PendingApproval until a second, different approver approves it (BR-PLT-020). | FC-M22-005 (multi-approver for high-impact); Proposed (two approvers) |
| AC-PLT-004-03-03 | US-PLT-004-03 | **Given** the requester tries to approve their own change set, **when** they press approve, **then** the action is refused with message Plt.ApproveOwnChange. | D; Proposed |
| AC-PLT-004-03-04 | US-PLT-004-03 | **Given** a change set is approved, **when** the current value of any of its keys differs from the old value recorded in the change set, **then** the change set is not applied, its status becomes Stale and message Plt.ChangeStale is shown (BR-PLT-021). | Proposed |
| AC-PLT-004-03-05 | US-PLT-004-03 | **Given** an approver rejects a change set, **when** they enter a reason, **then** the change set becomes Rejected, nothing is written and the requester is notified with the reason. | D; Proposed |
| AC-PLT-004-04-01 | US-PLT-004-04 | **Given** any setting is written, controlled or not, **when** the write completes, **then** the configuration history shows actor, timestamp, key, store, old value and new value, read from the SEC-004 audit store; applied change sets also show reason and approvers. | REQ-MPC-FR-318; FC-M22-007 |
| AC-PLT-004-04-02 | US-PLT-004-04 | **Given** a user with Platform.Core.ChangeControl.View, **when** runs the configuration-change report for a period, **then** all configuration changes in the period are listed with actor, timestamp, key, store, old and new value, reason and approvers, filterable by user, key and store and exportable to a file. | REQ-MPC-FR-287; REQ-MPC-FR-318 |
| AC-PLT-004-04-03 | US-PLT-004-04 | **Given** a module registers a configuration type as controlled through IC-PLT-03, for example PAY risk rules, **when** a rule of that type is enabled or disabled, **then** the change follows the same change-set flow and is shown in the history with old and new values. | REQ-MPC-FR-320; Proposed (IC-PLT-03) |
| AC-PLT-004-05-01 | US-PLT-004-05 | **Given** the history of key K shows earlier values, **when** an administrator selects one or more keys and an earlier version and requests rollback, **then** a new change set restoring those values is created and goes through the same validation and approval; nothing is written until it is approved (BR-PLT-023). | REQ-MPC-FR-300; FC-M02-049 |
| AC-PLT-004-05-02 | US-PLT-004-05 | **Given** a rollback change set is previewed, **when** a key to be restored is used by in-flight records registered by a module (IC-PLT-03), **then** the preview lists the affected record counts before approval. | FC-M02-049 (safety checks) |
| AC-PLT-004-05-03 | US-PLT-004-05 | **Given** an auditor selects a past date, **when** they open the configuration as of that date, **then** the value of every controlled key at that date is shown, rebuilt from the history. | FC-M22-006 |
| AC-PLT-004-06-01 | US-PLT-004-06 | **Given** two configuration snapshots (two dates in this instance, or an exported pack of another instance), **when** a member of the platform team compares them, **then** keys with different values are listed side by side; selected differences can be copied into a new change set in this instance. | D; FC-M22-012 |

**Business rules applied:** BR-PLT-020; BR-PLT-021; BR-PLT-022; BR-PLT-023; BR-PLT-096 (§8.1).


### 7.5 PRD-PLT-005 Configuration export, import and promotion

| Item | Value |
|---|---|
| Description (baseline) | Settings can be saved to a file, loaded into another site, and moved from the test site to the live site once checked. |
| Why it matters | Changes are tried safely first and then copied to live without retyping them. |
| Who benefits | Platform team; client administrators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PLT-003 |
| Status | Ready; conditions: CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-005-01 | Technical enabler. As a member of the platform team, I want to export an instance's configuration to a file, so that configuration can be backed up and replicated. | D; REQ-MPC-FR-317; FC-M22-010; FC-M02-047 | Ready; conditions: CFG-01 |
| US-PLT-005-02 | Technical enabler. As a member of the platform team, I want to load an exported configuration file into another instance, so that dev, test and live environments can be replicated or recovered. | D; REQ-MPC-FR-317 | Ready; conditions: CFG-01 |
| US-PLT-005-03 | Technical enabler. As a member of the platform team, I want to promote checked changes from the test instance to the live instance, so that live is changed only with tested configuration and without retyping. | D; FC-M22-009 | Ready; conditions: CFG-01 |
| US-PLT-005-04 | Technical enabler. As a member of the platform team, I want to start a new client from a copy of an existing client's configuration, with permission, so that similar clients are onboarded faster. | FC-M09-004; FC-M02-047 | Ready; conditions: CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-005-01-01 | US-PLT-005-01 | **Given** a user with Platform.Core.Packs.CreateEditDelete, **when** they export the configuration, **then** a pack file is produced holding every exportable artefact of the configuration-pack schema (section 10.1) at client and store layers, store entries keyed by store code, with a manifest (instance code, product release version, export time, checksum); audited (AUD-PLT-006). | D; REQ-MPC-FR-317 |
| AC-PLT-005-01-02 | US-PLT-005-01 | **Given** the configuration contains secrets (BR-PLT-013) and instance-bound items (BR-PLT-014), **when** it is exported, **then** secrets are omitted and listed by key only in the manifest as "to be entered"; entity data (customers, orders, products) is not part of the export (data backup is PLT-016). | CFG-01; REQ-MPC-FR-317 |
| AC-PLT-005-02-01 | US-PLT-005-02 | **Given** an exported pack file, **when** it is imported into another instance, **then** it is validated and applied through the PLT-003 loader (all PLT-003 criteria apply), and the run lists the secrets to be entered in the target instance. | REQ-MPC-FR-317 |
| AC-PLT-005-02-02 | US-PLT-005-02 | **Given** the pack was exported from a newer product release than the target instance runs, **when** it is imported, **then** the import is refused with message Plt.PackVersionMismatch. | Proposed |
| AC-PLT-005-03-01 | US-PLT-005-03 | **Given** changes were made and accepted in the test instance, **when** a member of the platform team starts a promotion, **then** the differences between the test export and the live configuration are listed excluding instance-bound items (BR-PLT-014); the selected differences become a change set in the live instance that follows PLT-004 validation and approval. | D; FC-M22-009 |
| AC-PLT-005-04-01 | US-PLT-005-04 | **Given** client A's configuration is to be the starting point for client B, **when** a clone is requested without a recorded authorisation reference, **then** it is refused with message Plt.CloneNotAuthorised. | FC-M02-047 (with permission); Proposed |
| AC-PLT-005-04-02 | US-PLT-005-04 | **Given** an authorised clone, **when** it is exported from A and applied to B, **then** client-identifying items (store names, URLs, hosts, company details, logos, e-mail accounts, secrets) are excluded and listed for entry, and the result is recorded in B as a client pack derived from A; audited (AUD-PLT-006). | FC-M09-004; Proposed |

**Business rules applied:** BR-PLT-013; BR-PLT-014 (§8.1).


### 7.6 PRD-PLT-006 Branding and theme

| Item | Value |
|---|---|
| Description (baseline) | The client chooses its logo, colours, fonts and page layout so the shop looks like the client's own brand; each storefront can look different. |
| Why it matters | Customers recognise and trust the brand, and no design code is needed per client. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Licensed plugin — None (or Theme/view override if no Pavilion licence) |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-006-01 | As a client administrator, I want to set my logo, colours, fonts and page layout per storefront without code, so that the shop looks like my brand. | D; REQ-KTDA-UX-002; FC-M09-005 | Ready |
| US-PLT-006-02 | As a client administrator, I want generated documents and e-mails to carry the same branding, so that every customer touchpoint matches the brand. | FC-M09-005 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-006-01-01 | US-PLT-006-01 | **Given** a client logo is uploaded, **when** it is set for a store, **then** the storefront header shows it for that store (StoreInformationSettings.LogoPictureId, store-overridable). | FIT (StoreInformationSettings.LogoPictureId) |
| AC-PLT-006-01-02 | US-PLT-006-01 | **Given** the client brand guidelines (logo, colour values, fonts) are supplied, **when** they are entered through the theme settings — the licensed theme plugin admin if the vendor confirms a 5.00 build (open item under VER-500), otherwise a client child theme of DefaultClean whose colour and font values are set in one variables file, **then** every storefront page of the store uses those colours and fonts, with no change to product code. | REQ-KTDA-UX-002; FIT (Themes/DefaultClean; StoreInformationSettings.DefaultStoreTheme); VER-500 (supersedes V-01) |
| AC-PLT-006-01-03 | US-PLT-006-01 | **Given** two stores of one client, **when** each has its own theme (DefaultStoreTheme stored per store), **then** each storefront shows its own theme; customer theme selection is offered only if AllowCustomerToSelectTheme is on. | D; FIT (StoreInformationSettings.DefaultStoreTheme, AllowCustomerToSelectTheme) |
| AC-PLT-006-02-01 | US-PLT-006-02 | **Given** the branding is set, **when** an invoice PDF or a system e-mail is produced, **then** the PDF uses the logo of PdfSettings.LogoPictureId (or the DOC-001 template branding) and the e-mail uses the client header of the message template (TRK-004). | FC-M09-005; FIT (PdfSettings.LogoPictureId) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.7 PRD-PLT-007 Custom domain and SSL

| Item | Value |
|---|---|
| Description (baseline) | The shop runs on the client's own web address (for example shop.client.com) with the padlock security certificate in the browser. |
| Why it matters | Customers see a trusted, secure address that belongs to the client. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-007-01 | As a client, I want the shop to run on my own web address with a valid TLS certificate, so that customers see a trusted address that belongs to me. | D; FC-M09-006 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-007-01-01 | US-PLT-007-01 | **Given** the client domain points to the instance and a TLS certificate is installed at the hosting layer, **when** the store is configured with Store.Url (https address), Store.Hosts (comma-separated host names) and Store.SslEnabled = true, **then** requests on any listed host resolve to that store and HTTP requests are redirected to HTTPS by the native HttpsRequirement filter. | D; FIT (Store.Url, Store.Hosts, Store.SslEnabled; HttpsRequirementAttribute; StoreService host parsing) |
| AC-PLT-007-01-02 | US-PLT-007-01 | **Given** TLS ends at a load balancer or reverse proxy, **when** the instance is configured, **then** HostingConfig.UseProxy is true with the forwarded-protocol header set, so a secure request is recognised and no redirect loop occurs. | FIT (HostingConfig.UseProxy, ForwardedProtoHeaderName); Proposed |
| AC-PLT-007-01-03 | US-PLT-007-01 | **Given** Store.SslEnabled is false, **when** a secure request arrives, **then** the native filter redirects it to HTTP; therefore every client store is set SslEnabled = true (BR-PLT-003 checklist). | FIT (HttpsRequirementAttribute: redirects to HTTP when SslEnabled is false) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.8 PRD-PLT-008 Email sender identity

| Item | Value |
|---|---|
| Description (baseline) | System emails (order confirmations and so on) are sent from the client's own email address, set up so they are not marked as spam. |
| Why it matters | Customers receive and trust the emails. |
| Who benefits | Shoppers; clients |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready; conditions: CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-008-01 | As a client, I want system e-mails to be sent from my own address and not marked as spam, so that customers receive and trust them. | D; FC-M09-007 | Ready; conditions: CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-008-01-01 | US-PLT-008-01 | **Given** an e-mail account with the client address, display name and SMTP or OAuth2 authentication (EmailAuthenticationMethod Login, GmailOAuth2 or MicrosoftOAuth2) is created and set as default (EmailAccountSettings.DefaultEmailAccountId), **when** a system e-mail is sent, **then** it is sent from that address; a template with its own EmailAccountId uses that account instead. | FIT (EmailAccount; MessageTemplate.EmailAccountId; EmailAccountSettings.DefaultEmailAccountId) |
| AC-PLT-008-01-02 | US-PLT-008-01 | **Given** SPF, DKIM and DMARC records are published for the client domain (hosting task), **when** the native "Send test email" action is used, **then** the test e-mail is delivered and passes the receiving server's SPF and DKIM checks, recorded in the go-live checklist. | D; FIT (EmailAccountController.SendTestEmail) |
| AC-PLT-008-01-03 | US-PLT-008-01 | **Given** an e-mail account password or client secret is entered, **when** configuration is exported (PLT-005), **then** the password and client secret are not exported (BR-PLT-013). | CFG-01 |

**Business rules applied:** BR-PLT-013 (§8.1).


### 7.9 PRD-PLT-009 Languages and language packs

| Item | Value |
|---|---|
| Description (baseline) | The shop can be shown in several languages, including right-to-left languages such as Arabic, and visitors pick their language. Countries, regions and districts used in addresses are maintained in the same admin area. |
| Why it matters | People can shop in the language they understand best. |
| Who benefits | Shoppers; clients |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-009-01 | As a shopper, I want to choose the language of the shop, so that I can shop in the language I understand best. | D; REQ-KTDA-LOC-001; REQ-MPC-FR-023; FC-M09-010; FC-M06-022 | Ready |
| US-PLT-009-02 | As a shopper reading a right-to-left language, I want the shop to be laid out right to left, so that the pages read naturally. | D; REQ-KTDA-LOC-001 | Ready |
| US-PLT-009-03 | As a client administrator, I want to maintain countries and the regions or districts used in addresses, so that addresses use the right places. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-009-01-01 | US-PLT-009-01 | **Given** languages are added and published for a store (Language.Published, LimitedToStores), **when** a shopper opens the storefront, **then** the language selector lists only that store's published languages, and choosing one shows all interface text from that language's resources. | D; FIT (Language; LocalizationSettings) |
| AC-PLT-009-01-02 | US-PLT-009-01 | **Given** Kiswahili, English, French, Arabic, Russian and Mandarin are configured with translated resources (client content), **when** a shopper selects each in turn, **then** the interface text is shown in the selected language; untranslated resources show the default-language text and are reported by PLT-025. | REQ-KTDA-LOC-001 |
| AC-PLT-009-01-03 | US-PLT-009-01 | **Given** English and Chichewa language packs are installed (interface text packs imported as resource XML), **when** a shopper selects Chichewa, **then** interface text appears in Chichewa. | REQ-MPC-FR-023; FIT (LanguageController.ImportXml) |
| AC-PLT-009-02-01 | US-PLT-009-02 | **Given** Arabic is configured with Language.Rtl = true, **when** a shopper selects Arabic, **then** the storefront uses the right-to-left stylesheet (DefaultClean styles.rtl.css) and the admin follows LocalizationSettings.IgnoreRtlPropertyForAdminArea. | REQ-KTDA-LOC-001; FIT (Language.Rtl; LocalizationSettings.IgnoreRtlPropertyForAdminArea) |
| AC-PLT-009-03-01 | US-PLT-009-03 | **Given** the country list is maintained, **when** a region or district list is imported for a country (CountryController.ImportCsv) as StateProvince records, **then** address forms offer those regions or districts for that country. | D; FIT (Country, StateProvince, CountryController.ImportCsv) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.10 PRD-PLT-010 Currencies and exchange rates

| Item | Value |
|---|---|
| Description (baseline) | The shop can show and charge prices in more than one currency, with one main (base) currency for accounting. Exchange rates can be typed in; automatic rates come from the exchange-rate connector (see 'Exchange-rate provider framework'). |
| Why it matters | International and local buyers see prices in a currency they understand. |
| Who benefits | Shoppers; business buyers; finance staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | PRD-PLT-024 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-010-01 | As a shopper, I want to see and pay prices in a currency I understand, so that I know what I will pay. | D; REQ-KTDA-LOC-002; REQ-MPC-FR-023 | Ready |
| US-PLT-010-02 | As a member of finance staff, I want one primary currency for accounting, so that reports and orders use one base currency. | D; REQ-KTDA-LOC-002 | Ready; on hold: AC-PLT-010-02-02 (C-FX) |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-010-01-01 | US-PLT-010-01 | **Given** several currencies are published for a store with rates, **when** a shopper selects a currency, **then** prices and totals are shown in it, formatted by Currency.DisplayLocale or CustomFormatting and rounded by Currency.RoundingType. | REQ-KTDA-LOC-002; REQ-MPC-FR-023; FIT (Currency) |
| AC-PLT-010-02-01 | US-PLT-010-02 | **Given** the primary store currency and the primary exchange-rate currency are set (CurrencySettings.PrimaryStoreCurrencyId, PrimaryExchangeRateCurrencyId), **when** an order is placed in another currency, **then** order amounts are stored in the primary store currency with the customer currency and Order.CurrencyRate. | REQ-KTDA-LOC-002; FIT (CurrencySettings) |
| AC-PLT-010-02-02 | US-PLT-010-02 | **Given** USD is set as the primary store currency, **when** the instance is configured, **then** all reports and order totals use USD as base; the settlement currency of each payment method is held by C-FX (PAY-023). | REQ-KTDA-LOC-002 |
| AC-PLT-010-01-02 | US-PLT-010-01 | **Given** rates are maintained by hand, **when** an administrator edits Currency.Rate, **then** the new rate applies to prices shown after the save; automatic rates come from PLT-024. | D; FIT |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.11 PRD-PLT-011 Time zone and formats

| Item | Value |
|---|---|
| Description (baseline) | Sets the shop's local time zone and how dates and times are written. |
| Why it matters | Order times, deadlines and reports show the correct local time. |
| Who benefits | All users |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-011-01 | As a shopper or staff user, I want times and dates in the shop's local time zone and format, so that order times, deadlines and reports are correct. | D; REQ-MPC-FR-023; FC-M09-008 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-011-01-01 | US-PLT-011-01 | **Given** DateTimeSettings.DefaultStoreTimeZoneId is set for the client, **when** an order is placed, **then** it is stored in UTC and shown in admin and storefront in the store time zone (or the customer's time zone if AllowCustomersToSetTimeZone is on). | D; FIT (DateTimeSettings) |
| AC-PLT-011-01-02 | US-PLT-011-01 | **Given** a language with LanguageCulture is selected, **when** dates and numbers are shown, **then** they follow that culture's format. | REQ-MPC-FR-023; FIT (Language.LanguageCulture) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.12 PRD-PLT-012 Fiscal calendar for reporting

| Item | Value |
|---|---|
| Description (baseline) | Lets the client set when its financial year starts so reports group figures by the client's own financial periods. |
| Why it matters | Finance reports match the client's accounting year. |
| Who benefits | Finance staff; management |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-012-01 | As a member of finance staff, I want to set when the financial year starts, so that reports group figures by our own financial periods. | D; FC-M09-011 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-012-01-01 | US-PLT-012-01 | **Given** the fiscal-year start month and day are set (new setting FiscalCalendarSettings, client layer), **when** a report requests fiscal periods through the PLT fiscal-calendar service, **then** periods start on the configured date in the store time zone and each order date falls in exactly one period. | D; Proposed |
| AC-PLT-012-01-02 | US-PLT-012-01 | **Given** the fiscal-year start is changed, **when** reports are rerun, **then** past figures are regrouped by the new periods, and the change is in the configuration history (PLT-004). | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.13 PRD-PLT-013 Multi-store (B2B and B2C storefronts)

| Item | Value |
|---|---|
| Description (baseline) | One client can run several shops from the same system, for example a retail shop for the public and a trade shop for business buyers, each with its own products, prices, look, payment and delivery rules. |
| Why it matters | Serves business (B2B) and consumer (B2C) customers without running two systems. |
| Who benefits | Clients; shoppers; business buyers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-013-01 | As a client administrator, I want to run a retail shop for the public and a trade shop for business buyers from one installation, each with its own products, prices, look, payment and delivery rules, so that we serve B2B and B2C customers without two systems. | D; REQ-KTDA-CUS-003; Inference from REQ-KTDA-CUS-002 (B2B buyers by inference, PH-INF); Inference from REQ-KTDA-PRJ-002 (business models by inference) | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-013-01-01 | US-PLT-013-01 | **Given** two stores exist in one client installation (a retail store and a trade store) with their own Url and Hosts, **when** a product is mapped only to the trade store (StoreMapping), **then** it is listed, searchable and purchasable only in the trade store. | D; FIT (Store; StoreMapping; IStoreMappingSupported) |
| AC-PLT-013-01-02 | US-PLT-013-01 | **Given** a retail store is configured for consumers, **when** a guest or registered consumer browses it, **then** they see retail products and retail prices of that store. | REQ-KTDA-CUS-003 |
| AC-PLT-013-01-03 | US-PLT-013-01 | **Given** a trade store is configured for business buyers (B2B pack: customer roles, tier prices per store, payment terms), **when** a bulk or international buyer signs in, **then** they see the trade catalogue and the prices for their role in that store (TierPrice.StoreId). | Inference from REQ-KTDA-CUS-002 (B2B buyers, PH-INF); FIT (TierPrice.StoreId) |
| AC-PLT-013-01-04 | US-PLT-013-01 | **Given** retail, bulk, contract-packaging and forward-contract offers are set up as separate products, stores or transaction types, **when** a buyer uses each, **then** each model is reachable in the store it is mapped to; the model-specific behaviour is delivered by CAT and ORD features. | Inference from REQ-KTDA-PRJ-002 (business models; confirm with client) |
| AC-PLT-013-01-05 | US-PLT-013-01 | **Given** a store-specific value is saved for a setting (for example the theme, a payment method store limit or a shipping rule), **when** each store is used, **then** each store applies its own value and other stores use the shared value (BR-PLT-011). | D; FIT (SettingService per-store values; PluginDescriptor.LimitedToStores) |

**Business rules applied:** BR-PLT-011 (§8.1).


### 7.14 PRD-PLT-014 Instance health and SLA monitoring

| Item | Value |
|---|---|
| Description (baseline) | Dashboards and alerts that show whether each client's site is up, how fast it is, and whether agreed service levels are met. The platform operator also has a view, for its own staff only, that compares health and usage across all clients. |
| Why it matters | Problems are spotted and fixed before customers notice. |
| Who benefits | Platform team; clients |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-014-01 | Technical enabler. As a member of the platform team, I want dashboards and alerts showing whether each client site is up, how fast it is and whether service levels are met, so that problems are fixed before customers notice. | D; REQ-MPC-FR-290; REQ-MPC-FR-299; FC-M09-012; FC-M03-034 | Ready |
| US-PLT-014-02 | Technical enabler. As a member of the platform team, I want a view, for our staff only, comparing health and usage across all clients, so that we manage all clients from one place. | D; FC-M09-014 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-014-01-01 | US-PLT-014-01 | **Given** the PLT health endpoint is enabled (new plugin route; access by token or IP allow-list), **when** the monitoring platform calls it, **then** it returns the status of the database connection, the cache, the scheduled-task runner (last success time of each enabled task), the queued-e-mail backlog and the product release version, with no personal data; the native keepalive/index route remains for liveness. | REQ-MPC-FR-290; FIT (KeepAliveController; NopCommonDefaults.KeepAlivePath; ScheduleTask.LastSuccessUtc); Proposed |
| AC-PLT-014-01-02 | US-PLT-014-01 | **Given** request telemetry is exported to the monitoring platform, **when** the dashboard is opened, **then** it shows page views, API calls, error rates and response-time percentiles per instance. | REQ-MPC-FR-290; REQ-MPC-FR-299 |
| AC-PLT-014-01-03 | US-PLT-014-01 | **Given** key transactions are tagged (search, checkout, payment confirmation), **when** the performance dashboard is opened, **then** it shows the latency of each key transaction per instance over a chosen period. | REQ-MPC-FR-299 |
| AC-PLT-014-01-04 | US-PLT-014-01 | **Given** an alert rule with a threshold is configured for a metric, **when** the metric crosses the threshold, **then** the monitoring platform raises an alert to the configured recipients; thresholds are client settings, default not stated. | REQ-MPC-FR-290 |
| AC-PLT-014-02-01 | US-PLT-014-02 | **Given** several client instances report to the monitoring platform, **when** an operator opens the cross-client view, **then** health and usage of all instances are shown; client staff cannot open this view, and no instance stores another client's data (BR-PLT-003). | FC-M09-014; D |

**Business rules applied:** BR-PLT-003 (§8.1).


### 7.15 PRD-PLT-015 Scalable, open architecture

| Item | Value |
|---|---|
| Description (baseline) | The system is built so it can grow: more servers can be added when traffic rises, it can run on Windows or Linux, it uses an open database, and new modules plug in without changing the core. |
| Why it matters | The shop stays fast as it grows and is not locked to one vendor. |
| Who benefits | Platform team; clients |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-015-01 | Technical enabler. As a member of the platform team, I want an architecture that grows by adding servers, runs on Windows or Linux, uses an open database and accepts new modules as plugins, so that the shop stays fast as it grows and is not locked to one vendor. | D; REQ-KTDA-NFR-001; REQ-KTDA-HST-001; REQ-MPC-ARC-001; REQ-MPC-ARC-002; REQ-MPC-ARC-003; REQ-MPC-ARC-004; REQ-MPC-ARC-005 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-015-01-01 | US-PLT-015-01 | **Given** an instance runs on more than one web node, **when** it is configured, **then** DistributedCacheConfig.Enabled is true (Redis or SQL Server), media are on shared storage, data-protection keys are shared and every node has identical plugin folders (L1 section 6.4). | REQ-KTDA-NFR-001; FIT (DistributedCacheConfig; DistributedCacheType) |
| AC-PLT-015-01-02 | US-PLT-015-01 | **Given** a new product module is delivered, **when** it is deployed, **then** it is a plugin added to the plugin folder and installed; no core file changes outside the L1 section 6.3 register (BR-PLT-041). | REQ-KTDA-NFR-001; REQ-MPC-ARC-005; FIT (plugin architecture) |
| AC-PLT-015-01-03 | US-PLT-015-01 | **Given** a release is deployed on AWS or Azure virtual machines or app services, **when** the smoke tests run, **then** they pass with no dependency on one cloud provider (the optional media plugins Misc.AzureBlob and Misc.CloudflareImages are not required; both are in InstallationConfig.DisabledPlugins by default). | REQ-KTDA-HST-001; FIT (Libraries/Nop.Core/Configuration/InstallationConfig.cs:16) |
| AC-PLT-015-01-04 | US-PLT-015-01 | **Given** the database runs on a separate server from the application servers, **when** users connect through a browser, **then** the instance works with the database, application and client tiers separated. | REQ-MPC-ARC-001; REQ-MPC-ARC-002 |
| AC-PLT-015-01-05 | US-PLT-015-01 | **Given** an instance is installed with the PostgreSQL or MySQL data provider (MySQL 8.0 or newer: 5.00.1 ships only the MySQL 8 type map and targets MySqlVersion.MySql80), **when** all product features are tested, **then** they work on that provider: every product plugin uses FluentMigrator 8.0.1 migrations and the nopCommerce data layer, with no provider-specific SQL (BR-PLT-040). | REQ-MPC-ARC-003; FIT (MySqlDataProvider.cs:356; Libraries/Nop.Data/DataProviders/Fluentmigrator/NopMySql8TypeMap.cs, NopMySql5TypeMap removed; PostgreSqlDataProvider; Libraries/Nop.Data/Nop.Data.csproj:15-18) |
| AC-PLT-015-01-06 | US-PLT-015-01 | **Given** Windows Server 2019 or newer with the .NET 10 runtime required by nopCommerce 5.00, **when** the release is deployed, **then** the smoke tests pass on that server. | REQ-MPC-ARC-004; FIT (src/Directory.Build.props:3 TargetFramework net10.0); VER-500 |

**Business rules applied:** BR-PLT-040; BR-PLT-041 (§8.1).


### 7.16 PRD-PLT-016 Backup and disaster recovery

| Item | Value |
|---|---|
| Description (baseline) | Regular automatic backups, tested restores, and a plan to bring the shop back quickly if a server or data centre fails. |
| Why it matters | Orders and customer data are not lost, and downtime is kept short. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-016-01 | As a client, I want regular automatic backups and tested restores without stopping the shop, so that orders and customer data are not lost. | D; REQ-MPC-NFR-002 | Ready |
| US-PLT-016-02 | As a client, I want a disaster-recovery plan that brings the shop back if a server or data centre fails, so that downtime is kept short. | D; REQ-MPC-NFR-001 | Ready |
| US-PLT-016-03 | As an auditor, I want reports of backup success and the last restore test, so that I can audit backup and recovery. | REQ-MPC-FR-297 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-016-01-01 | US-PLT-016-01 | **Given** scheduled database and file backups are configured at the database or hosting layer, **when** a backup runs during trading hours, **then** the storefront and admin keep working and the backup completes without locking out users. | REQ-MPC-NFR-002 |
| AC-PLT-016-01-02 | US-PLT-016-01 | **Given** the instance uses MySQL or PostgreSQL, **when** an administrator uses Maintenance > Backup database, **then** the native action is not offered for those providers (they throw "does not support backup"); backups are provided only by the external backup service. | FIT (MySqlDataProvider and PostgreSqlDataProvider.BackupDatabaseAsync throw; MsSqlDataProvider implements it) |
| AC-PLT-016-02-01 | US-PLT-016-02 | **Given** a recovery site or zone is set up, **when** a failover test is run, **then** the instance is restored on the recovery site from the latest backup and passes the smoke tests; the measured recovery time and data loss are recorded. | REQ-MPC-NFR-001 |
| AC-PLT-016-03-01 | US-PLT-016-03 | **Given** backups and restore tests run, **when** the backup report is produced, **then** it lists each backup (time, size, success or failure) and the date and result of the last restore test, and failures raise an alert. | REQ-MPC-FR-297 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.17 PRD-PLT-017 Responsive storefront

| Item | Value |
|---|---|
| Description (baseline) | The shop adjusts itself to work well on mobile phones, tablets and computers. |
| Why it matters | Both clients require the shop to work on phones, tablets and computers. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-017-01 | As a shopper, I want the shop to adjust to my phone, tablet or computer, so that I can shop on any device. | D; REQ-KTDA-UX-001; REQ-MPC-UX-001; REQ-MPC-UX-002; REQ-MPC-UX-003; FC-M06-024; FC-M25-004 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-017-01-01 | US-PLT-017-01 | **Given** the client theme, **when** storefront pages are opened at phone, tablet and desktop widths, **then** at each viewport width of the test plan (Proposed: 360, 768 and 1280 CSS pixels) no horizontal scroll bar appears (document width not greater than viewport width) and every menu entry, button and form field present at desktop width can be reached and used. | REQ-KTDA-UX-001; REQ-MPC-UX-002; FC-M25-004 |
| AC-PLT-017-01-02 | US-PLT-017-01 | **Given** a phone browser (current Android and iOS default browsers), **when** a shopper browses, searches, adds to cart and checks out, **then** each step completes in the mobile browser. | REQ-MPC-UX-003; REQ-MPC-UX-001 |
| AC-PLT-017-01-03 | US-PLT-017-01 | **Given** a 360 px wide viewport, **when** each storefront page is opened, **then** content and controls fit the width. | FC-M25-004 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.18 PRD-PLT-018 Accessibility

| Item | Value |
|---|---|
| Description (baseline) | The shop and the admin screens follow the international accessibility standard (WCAG 2.1 AA) so people with disabilities, for example people using screen readers, can use them. Users can switch to high contrast and larger text. |
| Why it matters | Includes everyone and meets public-sector accessibility expectations. |
| Who benefits | Shoppers and staff with disabilities |
| Phase | P1 |
| Implementation | Code-level — Theme/view override + Core modification (admin views) |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-018-01 | As a shopper or staff user with a disability, I want the storefront and admin screens to meet WCAG 2.1 AA, so that I can use them with a screen reader or keyboard. | D; FC-M06-023 | Ready |
| US-PLT-018-02 | As a shopper with low vision, I want to switch to high contrast and larger text, so that I can read the pages. | D; FC-M06-023 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-018-01-01 | US-PLT-018-01 | **Given** a new or changed storefront or admin screen in an Increment, **when** it is checked with an automated WCAG 2.1 AA tool and a manual keyboard and screen-reader check, **then** no level A or AA failure remains open at the end of the Increment (Definition of Done 9). | D; FC-M06-023 |
| AC-PLT-018-01-02 | US-PLT-018-01 | **Given** admin views need fixes, **when** they are changed, **then** each change is a registered core modification (L1 section 6.3, PRD-PLT-018) committed separately and tagged with the PRD ID (BR-PLT-041). | FIT (L1 section 6.3) |
| AC-PLT-018-02-01 | US-PLT-018-02 | **Given** the accessibility toggle is shown on the storefront, **when** a shopper switches on high contrast (Plt.Accessibility.HighContrast) or larger text (Plt.Accessibility.LargerText), **then** all pages use the high-contrast or larger-text style until switched off; the choice is kept for the customer (GenericAttribute) or the browser session for guests. | D; Proposed |

**Business rules applied:** BR-PLT-041 (§8.1).


### 7.19 PRD-PLT-019 Contextual help and guided tours

| Item | Value |
|---|---|
| Description (baseline) | Short help tips on each screen and step-by-step guided tours for new buyers, sellers and staff. |
| Why it matters | People learn the system without training sessions and make fewer mistakes. |
| Who benefits | New users |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-019-01 | As a new buyer, seller or staff member, I want short help tips on each screen and a guided tour, so that I learn the system without training sessions. | D; REQ-MPC-FR-325; FC-M06-019 | Ready |
| US-PLT-019-02 | As a client administrator, I want to configure onboarding content, training materials and tours for users and sellers without code, so that content stays current. | REQ-MPC-FR-325 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-019-01-01 | US-PLT-019-01 | **Given** help tips are configured for a screen (route key) and role, **when** a user opens that screen, **then** the tips are shown in the user's language; screens without tips show none. | D; FC-M06-019 |
| AC-PLT-019-01-02 | US-PLT-019-01 | **Given** a guided tour is configured for a role (buyer, seller or staff), **when** a user of that role signs in for the first time, **then** the tour starts once; the user can skip it and replay it later (Plt.Help.TourReplay); completion is stored per user. | D; REQ-MPC-FR-325 |
| AC-PLT-019-02-01 | US-PLT-019-02 | **Given** a user with Platform.Core.Help.CreateEditDelete, **when** creates or edits help tips, tour steps and links to training materials (documents in DOC-002 or content pages in MKT-007), per language, **then** the change is shown to users without a deployment. | REQ-MPC-FR-325 |
| AC-PLT-019-01-03 | US-PLT-019-01 | **Given** the admin first-run steps exist natively (resources Admin.ConfigurationSteps.*) and AdminAreaSettings.ShowDocumentationReferenceLinks, **when** an administrator uses the admin area, **then** the native steps and links remain available alongside PLT tips. | FIT (AdminAreaSettings.ShowDocumentationReferenceLinks) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.20 PRD-PLT-020 Data retention and archival

| Item | Value |
|---|---|
| Description (baseline) | Rules for how long each kind of record (orders, payments, support tickets, logs) is kept, when it is archived and when it is deleted. |
| Why it matters | Meets legal record-keeping and data-protection rules and keeps the system tidy. |
| Who benefits | Clients; regulators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-020-01 | As a client administrator, I want to set how long each kind of record is kept, when it is archived and when it is deleted or anonymised, so that we meet legal record-keeping and data-protection rules. | D; REQ-MPC-FR-322; FC-M03-029; FC-M20-004 | Ready |
| US-PLT-020-02 | As a client administrator, I want retention and archival rules for tracking events, so that tracking history is kept only as long as needed. | REQ-MPC-FR-225 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-020-01-01 | US-PLT-020-01 | **Given** retention rules exist for record types orders, payments, support tickets and logs (record type, period, action Archive, Anonymise or Delete, active flag; country then client layer), **when** the retention task runs, **then** records older than the period are processed by the action in batches; counts per type and action are written to the retention run log (AUD-PLT-009). | REQ-MPC-FR-322; D |
| AC-PLT-020-01-02 | US-PLT-020-01 | **Given** the action is Delete, **when** records are processed, **then** they are physically removed through the repository predicate delete, because the per-entity delete only sets Deleted for soft-deletable entities such as Order, Customer and Product (BR-PLT-050). | FIT (EntityRepository.DeleteAsync: ISoftDeletedEntity sets Deleted; DeleteAsync(predicate) bulk-deletes) |
| AC-PLT-020-01-03 | US-PLT-020-01 | **Given** the action is Archive, **when** records are processed, **then** they are written to the archive store with a manifest and checksum, verified, and only then removed from the live database. | D; Proposed |
| AC-PLT-020-01-04 | US-PLT-020-01 | **Given** a record is under legal hold (DOC-002) or is linked to an open payment, refund, dispute or receivable, **when** the retention task reaches it, **then** it is skipped and counted as held (BR-PLT-050). | Proposed |
| AC-PLT-020-01-05 | US-PLT-020-01 | **Given** native maintenance tasks exist (ClearLogTask, DeleteGuestsTask, DeleteInactiveCustomersTask), **when** a retention rule for logs or inactive customers is saved, **then** the matching native settings are set from the rule (CommonSettings.ClearLogOlderThanDays, GdprSettings.DeleteInactiveCustomersAfterMonths) so there is one source of the value. | FIT (ClearLogTask; DeleteInactiveCustomersTask; CommonSettings.ClearLogOlderThanDays; GdprSettings.DeleteInactiveCustomersAfterMonths) |
| AC-PLT-020-02-01 | US-PLT-020-02 | **Given** a retention rule for tracking events (TRK-002) is configured, **when** the retention task runs, **then** tracking events older than the period are archived or deleted per the rule. | REQ-MPC-FR-225 |
| AC-PLT-020-01-06 | US-PLT-020-01 | **Given** a retention rule is created or changed, **when** it is saved, **then** the change is recorded with old and new values (AUD-PLT-009) and, if the key is controlled, follows PLT-004. | Proposed |
| AC-PLT-020-01-07 | US-PLT-020-01 | **Given** product modules register their record types with the retention engine (IC-PLT-08: record type code, owning module, entity, date field that starts the period, allowed actions, hold check), **when** the retention rules screen is opened, **then** a rule can be set for each registered type, and the release registers at least: orders, payments, support tickets and logs (REQ-MPC-FR-322); DOC-002 document types by retention class; CRM tickets, call logs, inbound messages and ratings; IAM AuthEvent, UserSession, PolicyAcceptance, PrivacyRequest, VerificationCase and OtpChallenge; RET return data, dispute cases, case messages and evidence Downloads; TRK tracking events (active period, then archive period) and the notification log; the SEC-004 audit trail; AI-003 chat transcripts; the ADM-003 rule evaluation log and ADM-007 work drafts; every period is Not stated in source (BR-PLT-051). | REQ-MPC-FR-322; Proposed |
| AC-PLT-020-01-08 | US-PLT-020-01 | **Given** a registered record type supplies a hold check (for example a DOC-002 legal hold, an open RET case or dispute, a record with a RET legal-hold flag), **when** the retention task reaches a record for which the check returns held, **then** the record is skipped and counted as held; it is never purged while held (BR-PLT-050). | REQ-MPC-FR-322; Proposed |
| AC-PLT-020-01-09 | US-PLT-020-01 | **Given** the record type is the SEC-004 audit trail, **when** the retention task runs, **then** only whole closed audit segments past the period are processed, by archive (verified copy) or removal with the signed checkpoint that SEC-004 writes (BR-SEC-016); single audit events are never deleted or anonymised. | Proposed; see SEC-004 |
| AC-PLT-020-02-02 | US-PLT-020-02 | **Given** a retention rule for tracking events sets an active period and an archive period, **when** the retention task runs, **then** events past the active period move to the archive and stay searchable by staff; events past the archive period are deleted; notification-log entries follow their own rule; each run is logged (AUD-PLT-009). | REQ-MPC-FR-225; Proposed (TRK BR-TRK-013) |

**Business rules applied:** BR-PLT-050; BR-PLT-051 (§8.1).


### 7.21 PRD-PLT-021 Product release and upgrade management

| Item | Value |
|---|---|
| Description (baseline) | A managed way to release new versions of the product and upgrade every client's site safely, including checks that each client's settings and plugins still work. |
| Why it matters | Keeps all clients on one product instead of each drifting into its own custom copy. |
| Who benefits | Platform team; all clients |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-021-01 | Technical enabler. As a member of the platform team, I want to release a new product version and upgrade each client safely, with checks that its settings and plugins still work, so that all clients stay on one product instead of drifting into custom copies. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-021-01-01 | US-PLT-021-01 | **Given** a product release is built (nopCommerce tag plus product plugins, each with a version), **when** it is deployed to a client, **then** it is deployed to the test instance first, the regression set passes there, and only then is it deployed to the live instance (BR-PLT-060). | D; Proposed |
| AC-PLT-021-01-02 | US-PLT-021-01 | **Given** the new release starts, **when** the application starts, **then** native upgrade migrations (Libraries/Nop.Data/Migrations/UpgradeTo*) and plugin updates (IPluginService.UpdatePluginsAsync at AppStarted) run, and the instance records the release version. | FIT (Libraries/Nop.Data/Migrations/UpgradeTo500: SchemaMigration, DataMigration, PriceListMigration, SearchTermMigration; Presentation/Nop.Web.Framework/Migrations/UpgradeTo500: SettingMigration, LocalizationMigration; AppStartedConsumer UpdatePluginsAsync) |
| AC-PLT-021-01-03 | US-PLT-021-01 | **Given** the release has started, **when** the post-upgrade check runs, **then** it reports incompatible plugins (IPluginsInfo.IncompatiblePlugins, from plugin.json SupportedVersions), re-validates the applied pack set against the new key catalogue (PLT-003), and checks the extension register (ADM-001); each failure appears as a system warning (SystemWarningCreatedEvent) and in the upgrade run report. | D; FIT (PluginsInfo.IncompatiblePlugins; PluginIncompatibleType; SystemWarningCreatedEvent) |
| AC-PLT-021-01-04 | US-PLT-021-01 | **Given** any check fails on the live instance, **when** the platform team decides to roll back, **then** the pre-upgrade database backup and the previous application and plugin folders are restored; the upgrade run is marked RolledBack (SM-PLT-05). | Proposed |
| AC-PLT-021-01-05 | US-PLT-021-01 | **Given** the release contains registered core modifications (L1 section 6.3), **when** a new nopCommerce release is adopted, **then** the product fork is rebased on the new tag, each core commit tagged with its PRD ID is re-applied and the register-driven regression set is run (L1 section 6.2 principle 2). | FIT (L1 section 6.2) |
| AC-PLT-021-01-06 | US-PLT-021-01 | **Given** an instance is upgraded from nopCommerce 4.90 to the 5.00 product release, **when** the native 5.00 setting migration runs, **then** the values of ordersettings.returnrequest* and numberofdaysreturnrequestavailable are copied to returnrequestsettings.*, the removed phone-validation keys are deleted, and the applied pack set is then re-validated (PLT-003); keys still named the 4.90 way in a client pack are reported as pack errors (Plt.PackKeyUnknown). | FIT (Presentation/Nop.Web.Framework/Migrations/UpgradeTo500/SettingMigration.cs:118-153); VER-500 |
| AC-PLT-021-01-07 | US-PLT-021-01 | **Given** a product plugin or a third-party plugin (NopStation, Nop-Templates, FoxNetSoft, AFR extensions) is in the release, **when** the release is built and started, **then** the plugin targets net10.0, declares SupportedVersions "5.00" in plugin.json, references FluentMigrator 8.0.1 and calls only the asynchronous data, settings, localization, logging, event and store APIs; a plugin without a 5.00 build is reported in IPluginsInfo.IncompatiblePlugins and is not loaded, and the release is not deployed to a live instance (BR-PLT-097). | FIT (src/Directory.Build.props:3; Plugins/Nop.Plugin.Misc.RFQ/plugin.json:6; Libraries/Nop.Data/Nop.Data.csproj:15; Libraries/Nop.Services/Plugins/IPluginsInfo.cs:70); VER-500 |

**Business rules applied:** BR-PLT-060; BR-PLT-041; BR-PLT-097 (§8.1).


### 7.22 PRD-PLT-022 Feature and module registry

| Item | Value |
|---|---|
| Description (baseline) | A master switchboard listing every product feature, with on/off switches per client and per shop. |
| Why it matters | Turning a feature on for a client is a setting, not a development job. |
| Who benefits | Platform team; client administrators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-022-01 | Technical enabler. As a member of the platform team, I want one switchboard listing every product feature with on/off switches per client and per store, so that turning a feature on is a setting, not a development job. | D | Ready |
| US-PLT-022-02 | Technical enabler. As a developer of a product plugin, I want to ask the registry whether a feature is on for the current store, so that features behave the same way in every module. | D; Proposed | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-022-01-01 | US-PLT-022-01 | **Given** the release ships the feature definitions (PRD ID, name, pack, tier, phase, depends on, implementing plugins), **when** a user with Platform.Core.Features.View opens the registry, **then** every product feature is listed with its state for the client and for each store. | D |
| AC-PLT-022-01-02 | US-PLT-022-01 | **Given** a feature is switched on or off, **when** it is saved, **then** the state is stored as setting productfeature.<prd-id> (StoreId 0 for the client, StoreId n for a store) and resolves store value, else client value, else off (BR-PLT-030); audited (AUD-PLT-007). | Proposed; FIT (SettingService two-level resolution) |
| AC-PLT-022-01-03 | US-PLT-022-01 | **Given** a feature depends on another feature that is off, **when** it is switched on, **then** the change is refused with message Plt.FeatureDependencyOff naming the dependency. | D (depends-on from the workbook); Proposed |
| AC-PLT-022-01-04 | US-PLT-022-01 | **Given** a feature of the Platform core tier, **when** it is switched off, **then** the change is refused with message Plt.FeatureAlwaysOn (decision D-01: Platform core is always on). | D-01 |
| AC-PLT-022-01-05 | US-PLT-022-01 | **Given** a feature is implemented by a plugin that is not installed, **when** it is switched on, **then** the plugin is queued for installation and the registry shows message Plt.RestartRequired; for plugin types that support store limits, store-level states are also written to the plugin's LimitedToStores (BR-PLT-012). | FIT (PluginService.PreparePluginToInstallAsync; PluginDescriptor.LimitedToStores) |
| AC-PLT-022-02-01 | US-PLT-022-02 | **Given** a product plugin calls the registry (IC-PLT-02) for feature F and store S, **when** F is off for S, **then** the feature's pages, widgets and actions are not shown for S and its scheduled work skips S. | Proposed |

**Business rules applied:** BR-PLT-030; BR-PLT-012 (§8.1).


### 7.23 PRD-PLT-023 Client data migration toolkit

| Item | Value |
|---|---|
| Description (baseline) | Tools to bring a new client's existing data (customers, addresses, open orders, balances, loyalty points, gift cards, order history) into the system, with checks and a report showing nothing was lost. |
| Why it matters | Clients can move from an old system without re-typing data or losing history. |
| Who benefits | New clients; platform team |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-023-01 | Technical enabler. As a member of the platform team, I want to import a new client's customers, addresses, open orders, order history, loyalty-point balances and gift-card balances, so that the client moves without retyping data. | D | Ready |
| US-PLT-023-02 | As a client, I want a report proving nothing was lost, so that I can accept the migration. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-023-01-01 | US-PLT-023-01 | **Given** source files in the migration format are uploaded, **when** a dry run is started, **then** every row is validated (required fields, references, duplicates) and a report lists rejected rows with reasons (Plt.MigrationRowInvalid); nothing is written. | D; Proposed |
| AC-PLT-023-01-02 | US-PLT-023-01 | **Given** the dry run has no blocking errors, **when** the import runs, **then** customers and orders are imported through the native importers (IImportManager.ImportCustomersFromXlsxAsync, ImportOrdersFromXlsxAsync); addresses through ICustomerService.InsertCustomerAddressAsync; loyalty balances as one opening entry per customer through IRewardPointService.AddRewardPointsHistoryEntryAsync; gift-card balances through IGiftCardService.InsertGiftCardAsync. | D; FIT (IImportManager; ICustomerService.InsertCustomerAddressAsync; IRewardPointService.AddRewardPointsHistoryEntryAsync; IGiftCardService.InsertGiftCardAsync) |
| AC-PLT-023-01-03 | US-PLT-023-01 | **Given** customer passwords are migrated as hashes, **when** the import runs, **then** hashed passwords are imported only if SecuritySettings.AllowStoreOwnerExportImportCustomersWithHashedPassword is on and the hash format matches; otherwise customers must reset their password. | FIT (ImportManager; SecuritySettings.AllowStoreOwnerExportImportCustomersWithHashedPassword) |
| AC-PLT-023-01-04 | US-PLT-023-01 | **Given** an import is run again with the same source keys, **when** rows already imported are found in the source-to-target key map, **then** they are updated or skipped, not duplicated. | Proposed |
| AC-PLT-023-02-01 | US-PLT-023-02 | **Given** an import completes, **when** the reconciliation report runs, **then** for each entity type it shows source count, imported count, rejected count, and for money values (order totals, loyalty points, gift-card balances) source total and imported total; any difference is highlighted. | D |
| AC-PLT-023-01-05 | US-PLT-023-01 | **Given** the new client also has customer or customer-group contract prices to migrate, **when** the import runs, **then** they are loaded as native price lists through the price-list Excel import (Catalog > Price lists > Import, IImportManager.ImportPriceListsFromXlsxAsync, permission Catalog.PriceListsImportExport) and counted in the reconciliation report like the other entities; the import stops on the first unknown product (native behaviour), so the dry run checks product references first. | FIT (Libraries/Nop.Services/ExportImport/IImportManager.cs:76; Presentation/Nop.Web/Areas/Admin/Controllers/PriceListController.cs:489; StandardPermission.cs:78); see CAT-039; VER-500 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.24 PRD-PLT-024 Exchange-rate provider framework

| Item | Value |
|---|---|
| Description (baseline) | Connects to sources of official or commercial exchange rates for currencies such as the Kenyan shilling and Malawian kwacha, which the built-in rate source does not cover, and updates rates on a schedule. |
| Why it matters | Prices in other currencies stay accurate without manual updates. |
| Who benefits | Finance staff; shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-024-01 | As a member of finance staff, I want exchange rates for currencies such as the Kenyan shilling and Malawian kwacha to update automatically from a chosen source, so that prices in other currencies stay accurate without manual updates. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-024-01-01 | US-PLT-024-01 | **Given** a PLT rate-provider plugin implementing IExchangeRateProvider is installed and selected (CurrencySettings.ActiveExchangeRateProviderSystemName) with CurrencySettings.AutoUpdateEnabled on, **when** the native UpdateExchangeRateTask runs, **then** the provider returns rates relative to the primary exchange-rate currency and the task updates Currency.Rate for each matching currency. | D; FIT (IExchangeRateProvider.GetCurrencyLiveRatesAsync; UpdateExchangeRateTask) |
| AC-PLT-024-01-02 | US-PLT-024-01 | **Given** the source is unavailable or returns an error, **when** the task runs, **then** no rate is changed and the error is written to the system log. | FIT (UpdateExchangeRateTask); Proposed |
| AC-PLT-024-01-03 | US-PLT-024-01 | **Given** a returned rate differs from the current rate by more than the configured tolerance (setting, default not stated), **when** the provider prepares its result, **then** that rate is left out of the result, so it is not applied, and the deviation is logged for finance staff. | Proposed (BR-PLT-070) |

**Business rules applied:** BR-PLT-070 (§8.1).


### 7.25 PRD-PLT-025 Translation management

| Item | Value |
|---|---|
| Description (baseline) | Tools to send all screen text and product content out for translation, bring translations back in, and track which translations are checked. |
| Why it matters | Makes running the shop in several languages manageable. |
| Who benefits | Content staff; translators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-PLT-009 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-025-01 | As a member of content staff, I want to send all screen text and product content out for translation and bring translations back in, so that the shop runs in several languages. | D; REQ-KTDA-LOC-001 | Ready |
| US-PLT-025-02 | As a member of content staff, I want to track which translations are checked, so that unchecked machine or vendor translations are reviewed before relying on them. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-025-01-01 | US-PLT-025-01 | **Given** a target language exists, **when** content staff export for translation, **then** one file per language holds every locale resource (native ExportXml) and every localized entity field (new export), each with its source text and current translation. | D; FIT (LanguageController.ExportXml) |
| AC-PLT-025-01-02 | US-PLT-025-01 | **Given** a translated file is imported, **when** the import runs, **then** resources and localized fields are updated and marked Unchecked (BR-PLT-090). | D; FIT (LanguageController.ImportXml) |
| AC-PLT-025-01-03 | US-PLT-025-01 | **Given** the languages required by KTDA are configured, **when** the coverage report is opened, **then** it shows per language the share of resources and content fields translated and checked. | REQ-KTDA-LOC-001 |
| AC-PLT-025-02-01 | US-PLT-025-02 | **Given** a translation is Unchecked, **when** a reviewer marks it Checked, **then** the status becomes Checked with reviewer and date (AUD-PLT-011). | D |
| AC-PLT-025-02-02 | US-PLT-025-02 | **Given** the source text of a Checked translation changes, **when** it is saved, **then** the translation becomes Unchecked. | Proposed |
| AC-PLT-025-02-03 | US-PLT-025-02 | **Given** the AI-001 approval step is on and a user with the AI approval permission approves an AiTranslationDraft, **when** AI-001 writes the text to LocalizedProperty, **then** AI-001 calls IC-PLT-09 SetStatus and the PLT-025 translation status of that field and language becomes Checked with the approver and date; with the AI approval step off, AI-filled text is saved as Unchecked; PLT-025 is the only owner of translation status (BR-PLT-090). | Proposed; see AI-001 |
| AC-PLT-025-01-04 | US-PLT-025-01 | **Given** machine pre-translation is enabled (TranslationSettings.AllowPreTranslate, TranslationServiceId Google Translate or DeepL), **when** a product is pre-translated, **then** the generated texts are marked Unchecked; the API keys (TranslationSettings.GoogleApiKey, DeepLAuthKey) are secrets never exported in a pack (BR-PLT-013). | FIT (TranslationSettings; ProductController.PreTranslate) |

**Business rules applied:** BR-PLT-090; BR-PLT-013 (§8.1).


### 7.26 PRD-PLT-026 Hosting profile and sizing NFR

| Item | Value |
|---|---|
| Description (baseline) | A written description of the server size each type of deployment needs. Malawi Post stated 4 processor cores, 8 GB memory and 2 TB storage for the first six months. |
| Why it matters | Hosting is sized correctly, and conflicts with heavier components are visible early. |
| Who benefits | Platform team; clients |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | On hold: C-SIZE |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-026-01 | Technical enabler. As a member of the platform team, I want a hosting profile stating the server size each type of deployment needs, so that hosting is sized correctly and conflicts with heavier components are visible early. | D; REQ-MPC-HST-002 | On hold: C-SIZE |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-026-01-01 | US-PLT-026-01 | **Given** the hosting profile document is produced for a deployment type (single node or web farm), **when** it is reviewed, **then** it lists every component hosted (application, database, cache, search engine, data warehouse, API gateway), its resource needs, and states the Malawi Post figures (4 cores at 2.0 GHz, 8 GB RAM, 2 TB storage, cloud hosting for the first 6 months) with whether the planned components fit within them. | D; REQ-MPC-HST-002 |
| AC-PLT-026-01-02 | US-PLT-026-01 | **Given** decision C-SIZE states whether the Malawi Post figures are a floor or a ceiling, **when** the profile is finalised, **then** the profile shows the sizing that follows the decision — held by C-SIZE. | REQ-MPC-HST-002; C-SIZE |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.27 PRD-PLT-027 Data consistency safeguards

| Item | Value |
|---|---|
| Description (baseline) | When two people or systems change the same record at the same time, the system detects it and prevents one change from silently overwriting the other; every request that changes data carries a unique key, so if it is sent twice (for example after a network drop) it is only carried out once. |
| Why it matters | Data stays correct when many users and systems work at once, especially on unreliable networks. |
| Who benefits | All users; IT teams |
| Phase | P2 |
| Implementation | Code-level — Core modification + Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-PLT-027-01 | As a staff user, I want a save to be refused when someone else changed the same record after I opened it, so that my change never silently overwrites theirs. | D; FC-M03-032 | Ready |
| US-PLT-027-02 | Technical enabler. As an integrator or app developer, I want every request that changes data to accept a unique key and run only once, so that a repeat after a network drop does not create a duplicate. | D; FC-M03-033 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-PLT-027-01-01 | US-PLT-027-01 | **Given** a key table has a row-version column (registered core modification, L1 section 6.3), **when** two users open the same record and both save, **then** the first save succeeds; the second update matches no row because the version changed, and the user sees message Plt.ConcurrencyConflict with the current values; nothing of the second save is written (BR-PLT-081). | D; FC-M03-032; FIT (no RowVersion or concurrency token in 5.00.1 Libraries) |
| AC-PLT-027-02-01 | US-PLT-027-02 | **Given** a state-changing request carries an idempotency key header, **when** the same key is received again from the same customer on the same route within the key retention period, **then** the stored response of the first execution is returned and the action is not executed again (BR-PLT-080). | D; FC-M03-033 |
| AC-PLT-027-02-02 | US-PLT-027-02 | **Given** two requests with the same key arrive at the same time, **when** both are processed, **then** one executes under ILocker key 'plt-idem-{key}'; the other waits and returns the stored response. | Proposed; FIT (ILocker.PerformActionWithLockAsync) |
| AC-PLT-027-02-03 | US-PLT-027-02 | **Given** the same key arrives with a different request body, **when** it is processed, **then** it is refused as a key reuse and nothing is executed. | Proposed |
| AC-PLT-027-02-04 | US-PLT-027-02 | **Given** a state-changing public API call (IC-INT-01: POST, PUT, PATCH or DELETE) is received, **when** it carries no idempotency key header, **then** it is refused with HTTP 400 and message Plt.IdempotencyKeyRequired and nothing is executed; with a key it follows BR-PLT-080 (the middleware covers every INT API route). | Proposed; see INT-001 |

**Business rules applied:** BR-PLT-080; BR-PLT-081; BR-PLT-041 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-PLT-001 | One nopCommerce installation and one database per client per environment (live, test). All instances of all clients run the same product release. | PLT-001, PLT-021 | D; REQ-KTDA-ENV-001; FIT (DataSettingsManager) |
| BR-PLT-002 | A client's live instance can be set Active only after its test instance is Active and a UAT sign-off (reference, signed by, date) is recorded. | PLT-001 | REQ-KTDA-ENV-001; Proposed (gate) |
| BR-PLT-004 | Go-live checklist per live instance (Proposed): HTTPS on every store; proxy forwarded headers when TLS ends at a proxy; TLS versions and ciphers; encryption at rest for database, files and backups; WAF and DDoS protection; database login with insert and select only on audit tables; region per DP-01; distributed cache enabled with more than one web node; until PLT-027 idempotency keys (P2) are delivered, checkout is served by one web node only (the native placement lock is per host; CHK-008). A live instance is set Active only when every item is recorded as passed. | PLT-001 | Proposed (SEC hosting items, BR-SEC-070); FIT (Store.SslEnabled; HostingConfig; DistributedCacheConfig) |
| BR-PLT-003 | Isolation checklist per instance: own database and connection string, own App_Data (appsettings.json, plugins.json, DataProtectionKeys), own media storage, own credentials; a shared Redis or SQL Server cache server is allowed only with a unique DistributedCacheConfig.InstanceName per instance; Store.SslEnabled true for every store; stores never separate two clients. | PLT-001, PLT-002, PLT-007, PLT-014 | D; FC-M09-002; FIT (DistributedCacheConfig.InstanceName; NopDataProtectionDefaults; HttpsRequirementAttribute) |
| BR-PLT-010 | Pack layers merge in the order global, country, vertical, client, then store entries (Proposed: the country layer is the one the workbook Config pack schema marks "country", for example tax, fiscal adapter, payment routing defaults, carriers, law profile, retention and SMS rules). A higher layer overrides only the keys it states; store entries apply to the named store only. A pack set names exactly one country pack, versioned and checksummed like every other pack; how one instance serves several countries is Not stated in source. | PLT-003 | CFG-01 (order to be extended with the country layer); D; Proposed (country layer) |
| BR-PLT-011 | Run-time resolution has two levels only: the Setting row of the store, else the row with StoreId 0, else the settings-class default (SettingService.LoadSettingAsync with loadSharedValueIfNotFound). The loader writes merged shared layers as StoreId 0 rows and store entries as StoreId n rows; when a store entry is removed from the pack, the store row is deleted. No run-time layer resolver is built. | PLT-003, PLT-013 | FIT (SettingService.cs LoadSettingAsync, GetSettingByKeyAsync); FIT (L1 section 6.5) |
| BR-PLT-012 | Plugin enablement lives in files and settings and the loader writes both: the installed list is App_Data/plugins.json (installedPlugins.json and InstalledPlugins.txt are obsolete), changed only through IPluginService.PreparePluginToInstallAsync / PreparePluginToUninstallAsync and effective after an application restart; store and role limits are LimitedToStores / LimitedToCustomerRoles in each plugin's plugin.json, written through PluginDescriptor.Save on every web node; active-provider lists are settings (paymentsettings.activepaymentmethodsystemnames, shippingsettings.activeshippingratecomputationmethodsystemnames, shippingsettings.activepickuppointprovidersystemnames, taxsettings.activetaxprovidersystemname, widgetsettings.activewidgetsystemnames, catalogsettings.activesearchprovidersystemname). Deployment must not overwrite plugin.json limits; at application start the PLT plugin reconciles each node's plugin.json limits with the last applied state. | PLT-003, PLT-022 | FIT (NopPluginDefaults.PluginsInfoFilePath, InstalledPluginsFilePath; PluginsInfo.SaveAsync; PluginDescriptor.Save; AppStartedConsumer); L1 section 6.5; Proposed (reconcile) |
| BR-PLT-013 | Secrets are never in packs, exports, promotions or clones: securitysettings.encryptionkey, captchasettings.recaptchaprivatekey, translationsettings.googleapikey, translationsettings.deeplauthkey, artificialintelligencesettings.geminiapikey, artificialintelligencesettings.chatgptapikey, artificialintelligencesettings.deepseekapikey, proxysettings.password, taxsettings.hmrcclientsecret, shippingsettings.googlemapsapikey, EmailAccount.Password and ClientSecret, appsettings.json; the credential keys of the bundled plugins: facebookexternalauthsettings.clientsecret, brevosettings.apikey, brevosettings.smtpkey, brevosettings.marketingautomationkey, omnisendsettings.apikey, googleanalyticssettings.apisecret, paypalcommercesettings.secretkey, zettlesettings.apikey, zettlesettings.webhookkey, avalarataxsettings.licensekey, upssettings.clientsecret, cloudflareimagessettings.accesstoken; and every product plugin setting flagged secret in the key catalogue. Secrets are entered per instance. | PLT-001, PLT-003, PLT-005, PLT-008, PLT-025 | CFG-01; FIT (SecuritySettings.EncryptionKey; CaptchaSettings.ReCaptchaPrivateKey; TranslationSettings; ArtificialIntelligenceSettings; ProxySettings.Password; TaxSettings.HmrcClientSecret; ShippingSettings.GoogleMapsApiKey; EmailAccount; FacebookExternalAuthSettings.ClientSecret; BrevoSettings; OmnisendSettings; GoogleAnalyticsSettings.ApiSecret; PayPalCommerceSettings.SecretKey; ZettleSettings; AvalaraTaxSettings.LicenseKey; UPSSettings.ClientSecret; CloudflareImagesSettings.AccessToken) |
| BR-PLT-014 | Instance-bound items are never promoted or cloned: Store.Url, Store.Hosts, Store.SslEnabled, store company details, logos (clone only), e-mail accounts, secrets (BR-PLT-013), the instance profile. | PLT-005 | Proposed |
| BR-PLT-015 | A pack apply holds ILocker key 'plt-config-write'; database writes run in one TransactionScope; file writes follow and are compensated from the pre-apply snapshot on failure; the setting cache is cleared once at the end. | PLT-003 | Proposed; FIT (EntityRepository bulk writes use INopDataProvider.CreateTransactionScope with TransactionScopeOption.Required, BaseDataProvider.cs:503-533; ILocker) |
| BR-PLT-016 | Each applied pack set is stamped (codes, versions, checksums, user, time). Applying an identical pack set changes nothing. | PLT-003 | D; Proposed |
| BR-PLT-017 | Transaction-type and single-transaction overrides apply only to ADM-004 parameters and ADM-011 templates, never to native Setting rows; a reason is mandatory; every override is recorded as a deviation. | PLT-003 | D; FC-M22-004; FC-M02-045; Proposed (scope) |
| BR-PLT-020 | Controlled keys: writes from admin requests are captured into a change set by the PLT action filter and the PLT ISettingService override (DI, INopStartup Order >= 3000, registered in the ADM-001 extension register); the change set is validated, previewed, approved (impact Low: one approver; High: two different approvers; never the requester) and applied through the base SettingService. In a Test instance a valid change set is applied at once. Writes outside admin requests (pack loader, plugin install, scheduled tasks) are not captured. The override implements the asynchronous members only; nopCommerce 5.00.1 has no synchronous ISettingService members. | PLT-004 | D; FC-M22-005; Proposed; FIT (SettingService public virtual write methods; Libraries/Nop.Services/Configuration/ISettingService.cs) |
| BR-PLT-021 | A change set is applied only if the current value of each key still equals the old value recorded in it; otherwise it becomes Stale. | PLT-004 | Proposed |
| BR-PLT-022 | Every Setting write, controlled or not, is recorded with actor, time, key, store, old and new value by the SEC-004 IRepository<> decorator. | PLT-004 | REQ-MPC-FR-318; FIT (SettingService writes through IRepository<Setting>) |
| BR-PLT-023 | Rollback creates a new change set with earlier values; it follows BR-PLT-020 and BR-PLT-021. | PLT-004 | REQ-MPC-FR-300; Proposed |
| BR-PLT-030 | Feature state is setting productfeature.<prd-id> (lower case) with the two-level resolution of BR-PLT-011 and default off; Platform core features are always on (D-01); a feature can be on only if every feature it depends on is on. | PLT-022 | D; D-01; Proposed |
| BR-PLT-040 | Every product plugin runs on the SQL Server, MySQL and PostgreSQL data providers: schema through FluentMigrator migrations, data access through the nopCommerce data layer, no provider-specific SQL. | PLT-015 | REQ-MPC-ARC-003; FIT (Nop.Data data providers) |
| BR-PLT-041 | Core modifications in this module are limited to PLT-018 (admin views) and PLT-027 (row version on core tables and the repository check), as registered in L1 section 6.3; each is a separate commit tagged with the PRD ID on the product fork. | PLT-015, PLT-018, PLT-021, PLT-027 | FIT (L1 sections 6.2 and 6.3) |
| BR-PLT-050 | Retention: one rule per record type (period, action Archive, Anonymise or Delete). Delete removes rows physically (repository predicate delete); Archive verifies the archive copy before removal; records under legal hold or linked to an open payment, refund, dispute or receivable are skipped. | PLT-020 | REQ-MPC-FR-322; FIT (EntityRepository.DeleteAsync); Proposed |
| BR-PLT-051 | Every record type that holds personal or business records is registered with the retention engine by its owning module (IC-PLT-08) with a hold check; the owning module names the type, PLT-020 runs the rule. Audit-trail retention works on closed segments only (SEC-004). | PLT-020 | REQ-MPC-FR-322; Proposed |
| BR-PLT-060 | A release is deployed to a client's test instance and passes the regression set before its live instance; post-upgrade checks cover incompatible plugins, pack validity and the extension register. | PLT-021 | D; Proposed |
| BR-PLT-070 | A rate provider returns rates relative to CurrencySettings.PrimaryExchangeRateCurrencyId and leaves out any rate that moves more than the configured tolerance (default not stated). | PLT-024 | FIT (IExchangeRateProvider); Proposed (tolerance) |
| BR-PLT-080 | Idempotency keys are scoped by customer and route; the first response is stored and replayed for the key retention period; a reused key with a different body is refused. | PLT-027 | FC-M03-033; Proposed |
| BR-PLT-081 | Optimistic concurrency: an update of a row-versioned table succeeds only if the row version read is unchanged; otherwise the user gets the current values and nothing is written. | PLT-027 | FC-M03-032; Proposed |
| BR-PLT-090 | Imported or machine-generated translations are Unchecked until a reviewer marks them Checked; a change of the source text resets the translation to Unchecked. PLT-025 is the only owner of translation status: AI-001 approval sets Checked through IC-PLT-09 and keeps no status of its own. | PLT-025 | D; Proposed |
| BR-PLT-096 | Messages raised inside a client instance (change sets pending, decided or stale; pack apply failed or awaiting decision; post-upgrade check failed; rate outside tolerance) are sent through TRK-005; PLT registers its event codes through IC-TRK-04 RegisterEventCode at installation (names Proposed): Platform.ChangeSetPending, Platform.ChangeSetDecided, Platform.PackApplyAttention, Platform.UpgradeCheckFailed, Platform.RateNotApplied. Messages about provisioning and instance status (PLT-001), monitoring (PLT-014) and backups (PLT-016) are sent by the provisioning pipeline or the monitoring platform outside the client instance; they go to the platform team and the client contact, never to customers. | PLT-001, PLT-003, PLT-004, PLT-014, PLT-016, PLT-021, PLT-024 | MSG-ROUTE; BR-TRK-023; Proposed (code names) |
| BR-PLT-095 | A Suspended instance closes every store (StoreInformationSettings.StoreClosed true) and restores the previous values when re-activated; users with PublicStore.AccessClosedStore keep access. | PLT-001 | FC-M09-013; FIT (CheckAccessClosedStoreAttribute); Proposed |
| BR-PLT-097 | Plugin build baseline for nopCommerce 5.00: every product plugin, and every third-party plugin or AFR extension in a release, targets net10.0, declares SupportedVersions "5.00", uses FluentMigrator 8.0.1 and only the asynchronous nopCommerce APIs (the synchronous IRepository, ISettingService, ILocalizationService, ILogger, IEventPublisher.Publish, IStoreContext and IStoreMappingService members were removed in 5.00). A plugin with no 5.00 build blocks the release of the features that depend on it. | PLT-021 | VER-500; FIT (src/Directory.Build.props:3; Libraries/Nop.Data/Nop.Data.csproj:15; Libraries/Nop.Data/IRepository.cs; Libraries/Nop.Services/Configuration/ISettingService.cs) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-PLT-01 | ClientInstance | (none) | provisioning started | — | Provisioning | — |
| SM-PLT-01 | ClientInstance | Provisioning | all steps succeed (test instance) | — | Active | client contact notified |
| SM-PLT-01 | ClientInstance | Provisioning | all steps succeed (live instance) | test instance Active, UAT sign-off recorded (BR-PLT-002) and go-live checklist passed (BR-PLT-004) | Active | client contact notified |
| SM-PLT-01 | ClientInstance | Provisioning | a step fails | — | ProvisioningFailed | failure report to platform team |
| SM-PLT-01 | ClientInstance | ProvisioningFailed | provisioning restarted | — | Provisioning | — |
| SM-PLT-01 | ClientInstance | Active | suspend (reason) | Platform.Core.Instance.CreateEditDelete | Suspended | StoreClosed true on all stores (BR-PLT-095); notified |
| SM-PLT-01 | ClientInstance | Suspended | re-activate | — | Active | StoreClosed restored; notified |
| SM-PLT-01 | ClientInstance | Active / Suspended | archive | final backup verified | Archived | application stopped; notified |
| SM-PLT-01 | ClientInstance | Archived | restore | archive backup available | Restored | database and App_Data restored |
| SM-PLT-01 | ClientInstance | Restored | smoke test passed | — | Active | notified |
| SM-PLT-02 | PackApplyRun | (none) | pack set imported | — | Imported | — |
| SM-PLT-02 | PackApplyRun | Imported | validation | no errors | Validated | — |
| SM-PLT-02 | PackApplyRun | Imported | validation | errors (unknown key, permission, store, secret) | Rejected | report with messages |
| SM-PLT-02 | PackApplyRun | Validated | apply started | lock plt-config-write | Applying | snapshot taken |
| SM-PLT-02 | PackApplyRun | Applying | conflicting instance values found | — | AwaitingDecision | Plt.PackConflict |
| SM-PLT-02 | PackApplyRun | AwaitingDecision | decision per key recorded | — | Applying | deviations recorded |
| SM-PLT-02 | PackApplyRun | Applying | all writes succeed | — | Applied | stamp recorded; cache cleared; restart flag if plugins queued |
| SM-PLT-02 | PackApplyRun | Applying | any write fails | — | Failed | database and files restored from snapshot |
| SM-PLT-03 | ChangeSet | (none) | controlled write captured | — | Captured | — |
| SM-PLT-03 | ChangeSet | Captured | validation fails | — | Invalid | Plt.ConfigInvalid; nothing written |
| SM-PLT-03 | ChangeSet | Captured | validation passes (Live instance) | — | PendingApproval | approval item (ADM-006, IC-ADM-03 Submit with object type ChangeSet) |
| SM-PLT-03 | ChangeSet | Captured | validation passes (Test instance) | — | Applied | written through base SettingService |
| SM-PLT-03 | ChangeSet | PendingApproval | approval | approver is not the requester; second approver if High | Approved | — |
| SM-PLT-03 | ChangeSet | PendingApproval | rejection with reason | — | Rejected | requester notified |
| SM-PLT-03 | ChangeSet | PendingApproval | requester withdraws | — | Withdrawn | — |
| SM-PLT-03 | ChangeSet | Approved | apply | current values equal recorded old values (BR-PLT-021) | Applied | written under lock plt-config-write |
| SM-PLT-03 | ChangeSet | Approved | apply | a current value differs | Stale | Plt.ChangeStale |
| SM-PLT-04 | MigrationRun | (none) | files uploaded | — | Uploaded | — |
| SM-PLT-04 | MigrationRun | Uploaded | dry run | no blocking errors | Validated | rejected-row report |
| SM-PLT-04 | MigrationRun | Uploaded | dry run | blocking errors | Rejected | rejected-row report |
| SM-PLT-04 | MigrationRun | Validated | import | — | Imported / Failed | key map updated |
| SM-PLT-04 | MigrationRun | Imported | reconciliation report | — | Reconciled | report kept |
| SM-PLT-05 | UpgradeRun | (none) | release deployed to test | — | TestDeployed | — |
| SM-PLT-05 | UpgradeRun | TestDeployed | regression and post-upgrade checks | all pass | TestPassed | — |
| SM-PLT-05 | UpgradeRun | TestDeployed | regression and post-upgrade checks | any fails | TestFailed | release not deployed to live |
| SM-PLT-05 | UpgradeRun | TestPassed | release deployed to live; post-upgrade checks | all pass | Completed | release version recorded |
| SM-PLT-05 | UpgradeRun | TestPassed | release deployed to live; post-upgrade checks | any fails and rollback decided | RolledBack | backup and previous folders restored |
| SM-PLT-06 | TranslationStatus | Untranslated | translation imported or machine-generated | — | Unchecked | — |
| SM-PLT-06 | TranslationStatus | Unchecked | reviewer marks checked | Configuration.ManageLanguages | Checked | AUD-PLT-011 |
| SM-PLT-06 | TranslationStatus | Untranslated / Unchecked | AI-001 draft approved (IC-PLT-09) | approver holds the AI approval permission | Checked | AUD-PLT-011 |
| SM-PLT-06 | TranslationStatus | Checked | source text changed | — | Unchecked | — |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| InstanceProfile (new, one row) | InstanceCode, ClientCode, Role (Live / Test), Status (SM-PLT-01), ReleaseVersion, UatSignOffRef, UatSignedBy, UatSignedOnUtc, StatusHistory, GoLiveChecklist (item, result, evidence, checked by, checked on) | PLT-001, PLT-021 | Mirror of the pipeline record; no native instance entity exists (fit evidence) |
| ConfigPack (new) | Id, Code, Layer (Global / Vertical / Client), VerticalCode, Version, Checksum, DownloadId, ImportedBy, ImportedOnUtc | PLT-003, PLT-005 | Pack file stored as a native Download |
| PackApplyRun / PackAppliedItem (new) | Run: Id, PackSet (codes, versions, checksums), Status (SM-PLT-02), SnapshotDownloadId, RestartRequired, AppliedBy, StartedOnUtc, EndedOnUtc, Report; Item: RunId, ArtefactType, Key, StoreId, AppliedValueHash | PLT-003 | Used for conflict detection (value differs from last applied) and plugin.json reconciliation |
| ConfigDeviation (new) | Id, Scope (Instance / TransactionType / Transaction), ScopeRef, Key, PackValue, CurrentValue, Reason, CreatedBy, CreatedOnUtc | PLT-003 | Transaction-level overrides reference ADM-004 parameters, not Setting rows |
| ControlledItem (new) | KeyPattern or ConfigTypeCode, ImpactLevel (Low / High), ValidatorCode, IsActive | PLT-004 | Default list shipped with the release (Proposed) |
| ChangeSet / ChangeItem (new) | ChangeSet: Id, Status (SM-PLT-03), Reason, ImpactLevel, RequestedBy, ApprovedBy1, ApprovedBy2, RejectReason, CreatedOnUtc, AppliedOnUtc, IsRollbackOf; Item: ChangeSetId, Kind (Setting / registered type), Key, StoreId, Operation (Insert / Update / Delete), OldValue, NewValue | PLT-004, PLT-005 | Applied through the base SettingService; values of secret keys are stored masked |
| ConfigSnapshot (new) | Id, TakenOnUtc, Reason, DownloadId (export content) | PLT-004, PLT-005 | For compare and as-of views |
| FeatureDefinition (new) | FeatureId (PRD ID), Name, Pack, Tier, Phase, DependsOn, PluginSystemNames, AlwaysOn | PLT-022 | State is not here: setting productfeature.<prd-id> (BR-PLT-030) |
| MigrationRun / MigrationKeyMap (new) | Run: Id, SourceSystem, Status (SM-PLT-04), Files, DryRunReport, ReconciliationReport; KeyMap: SourceSystem, EntityType, SourceKey, TargetId | PLT-023 | Imports call native services |
| RetentionRecordType (new) | Code, OwningModule, EntityName, DateField, AllowedActions, HoldCheckName | PLT-020 | Filled from IC-PLT-08 registrations at start |
| RetentionRule / RetentionRun (new) | Rule: RecordType, Period, Unit, Action (Archive / Anonymise / Delete), Layer (country / client), IsActive; Run: RuleId, StartedOnUtc, Processed, Archived, Anonymised, Deleted, Held | PLT-020 | Native settings ClearLogOlderThanDays and DeleteInactiveCustomersAfterMonths are set from the rules |
| UpgradeRun (new) | Id, FromVersion, ToVersion, Instance role, Status (SM-PLT-05), CheckResults, StartedOnUtc, EndedOnUtc | PLT-021 | |
| HelpTip / GuidedTour / TourStep (new) | Tip: RouteKey, RoleSystemName, LanguageId, Text; Tour: Code, RoleSystemName, IsActive; Step: TourId, Order, RouteKey, Element, Text (localized) | PLT-019 | Tour completion and accessibility choice stored as native GenericAttribute on the customer |
| TranslationStatus (new) | EntityName (or LocaleStringResource), EntityId, KeyGroup, LanguageId, Status (SM-PLT-06), CheckedBy, CheckedOnUtc | PLT-025 | Text itself stays in native LocaleStringResource and LocalizedProperty |
| IdempotencyRecord (new) | Key, CustomerId, Route, RequestHash, ResponseStatus, ResponseBody, CreatedOnUtc, ExpiresOnUtc | PLT-027 | Plugin table |
| RowVersion column on key core tables (core modification) | RowVersion on the tables confirmed for PLT-027 | PLT-027 | Registered core modification (L1 section 6.3); tables not stated in source |
| FiscalCalendarSettings (new settings class) | FiscalYearStartMonth, FiscalYearStartDay | PLT-012 | Setting rows fiscalcalendarsettings.* (client layer) |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Core settings (catalog, orders, customers, shopping cart, shipping, tax, media, SEO, security) | Setting table keys: catalogsettings.*, ordersettings.*, customersettings.*, shoppingcartsettings.*, shippingsettings.*, taxsettings.*, mediasettings.*, seosettings.*, securitysettings.*, returnrequestsettings.* (5.00 moved the return-request settings out of ordersettings: Libraries/Nop.Core/Domain/Orders/ReturnRequestSettings.cs) (key = lower-case <SettingsClassName>.<PropertyName>; verified in release-4.90.8, NOP_Review_L1 table c; re-verified in release-5.00.1) | global → vertical → client → store | PLT-003 | Core |
| Store definitions and store mapping | Store, StoreMapping entities | client → store | PLT-013 | Core |
| Theme and branding | storeinformationsettings.defaultstoretheme, .logopictureid, .allowcustomertoselecttheme; theme plugin configuration | client → store | PLT-006 | Core |
| Languages and locale resources | Language, LocaleStringResource (XML packs) | global → vertical → client | PLT-009 / PLT-025 | Core |
| Currencies and rate provider | Currency, currencysettings.*, rate-provider plugin config | client → store | PLT-010 / PLT-024 | Core |
| Time zone, formats, fiscal calendar | datetimesettings.defaultstoretimezoneid, .allowcustomerstosettimezone (class in Nop.Services/Helpers); date and number formats = Language.LanguageCulture; fiscal-calendar settings (new) | client | PLT-011 / PLT-012 | Core |
| Feature/module toggles | Feature registry (new): feature ID, on/off, per store | vertical (pack default) → client → store | PLT-022 | Core |
| Plugin enablement | Installed list: App_Data/plugins.json (file). Store/role limits: LimitedToStores / LimitedToCustomerRoles persisted in each plugin's plugin.json (file). Active providers: settings paymentsettings.activepaymentmethodsystemnames, shippingsettings.activeshippingratecomputationmethodsystemnames, shippingsettings.activepickuppointprovidersystemnames, taxsettings.activetaxprovidersystemname, widgetsettings.activewidgetsystemnames, catalogsettings.activesearchprovidersystemname, and since 5.00 artificialintelligencesettings.activeairecommendationprovidersystemname and messagessettings.activesmsprovidersystemname (database, store-overridable). The pack loader writes both the files and the settings; deployment must not overwrite plugin.json limits. | vertical → client → store | PLT-022 | Core |
| Data retention rules | Retention policy per data type (new); maintenance tasks | country → client | PLT-020 | Core |
| Further core setting groups | captchasettings.*, gdprsettings.*, multifactorauthenticationsettings.*, rewardpointssettings.*, localizationsettings.*, storeinformationsettings.* | global → client → store | SEC-013 / SEC-007 / IAM-004 / MKT-003 / PLT-009 / PLT-006 | Core |
| Access and admin extensions pack settings | Delegation rules, passwordless/biometric options, guided-tour content | vertical → client | IAM-009 / IAM-013 / PLT-019 | Access and admin extensions pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Client pack set and vertical | Pack files (PLT-003); InstanceProfile | global → vertical → client | Not stated (vertical undefined, FCAT-01) | Not stated (vertical undefined, FCAT-01) |
| Controlled settings list, impact levels, validators | ControlledItem (new) | global → client | Not stated | Not stated |
| Theme and logo per store | storeinformationsettings.defaultstoretheme, .logopictureid, .allowcustomertoselecttheme (native) | client → store | KTDA branding (REQ-KTDA-UX-002); guidelines not provided | Not stated |
| Store URL, hosts, SSL | Store.Url, Store.Hosts, Store.SslEnabled (native entity; instance-bound) | store | Not stated (domain) | Not stated (domain) |
| Proxy and TLS termination | HostingConfig.UseProxy, ForwardedProtoHeaderName (appsettings.json, per installation) | installation | Not stated | Not stated |
| Default sender account | EmailAccount entity; emailaccountsettings.defaultemailaccountid (native) | client | Not stated | Not stated |
| Languages and RTL | Language entity (Rtl, LanguageCulture, LimitedToStores, Published); localizationsettings.* (native) | global → vertical → client | Kiswahili, English, French, Arabic, Russian, Mandarin (REQ-KTDA-LOC-001) | English, Chichewa (REQ-MPC-FR-023) |
| Currencies, primary currencies, auto update, provider | Currency entity; currencysettings.primarystorecurrencyid, .primaryexchangeratecurrencyid, .autoupdateenabled, .activeexchangerateprovidersystemname (native) | client → store | USD base, multi-currency (REQ-KTDA-LOC-002); list and source not stated (KG-15) | Not stated (MG-04) |
| Rate tolerance | PLT rate-provider settings (new) | client | Not stated | Not stated |
| Time zone | datetimesettings.defaultstoretimezoneid, .allowcustomerstosettimezone (native) | client | Not stated | Not stated (MG-04) |
| Fiscal-year start | fiscalcalendarsettings.* (new) | client | Not stated | Not stated |
| Feature states | Setting productfeature.<prd-id> (new key family) | vertical (pack default) → client → store | Not stated | Not stated |
| Distributed cache | DistributedCacheConfig.Enabled, DistributedCacheType, InstanceName (appsettings.json) | installation | Not stated | Not stated |
| Installer plugin exclusions | InstallationConfig.DisabledPlugins (appsettings.json; default Misc.AzureBlob, Misc.CloudflareImages) | installation | Not stated | Not stated |
| Retention rules | RetentionRule (new); commonsettings.clearlogolderthandays, gdprsettings.deleteinactivecustomersaftermonths (native) | country → client | Not stated (KG-18) | Required for orders, payments, tickets, logs (FR-322); values not stated (MG-13) |
| Integration settings (INT) | API client templates without keys, webhook policy, connector configuration without credentials, PostGlobal status map, master of record per entity type (INT plugin settings and tables; keys flagged secret in the INT key catalogue) | vertical → client | Not stated | Not stated |
| Health endpoint access | PLT settings: token / IP allow-list (new; token is a secret) | installation | Not stated | Not stated |
| Alert thresholds | Monitoring platform (external) | client | Not stated | Not stated (FR-290) |
| Idempotency key retention | PLT settings (new) | global | Not stated | Not stated |
| Machine pre-translation | translationsettings.allowpretranslate, .translationserviceid (native); API keys are secrets | client | Not stated | Not stated |
| Hashed-password import | securitysettings.allowstoreownerexportimportcustomerswithhashedpassword (native) | client | Not stated | Not stated |
| Archive period of archived instances | Pipeline setting (external) | global | Not stated | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Admin — Configuration | Packs: list, import, validate, apply runs, conflicts, deviations, applied pack set | PLT-003, PLT-005 | New |
| Admin — Configuration | Change sets: my changes, pending approvals, history, as-of view, compare, configuration-change report | PLT-004 | New |
| Admin — Configuration | Settings pages and All settings (controlled keys show a "pending change" marker) | PLT-004 | Native pages, PLT action filter |
| Admin — Configuration | Feature registry | PLT-022 | New |
| Admin — Configuration | Stores, languages, currencies, e-mail accounts, countries | PLT-007 to PLT-011, PLT-013 | Native |
| Admin — Configuration | Fiscal calendar; retention rules and runs | PLT-012, PLT-020 | New |
| Admin — Configuration | Translation export/import, coverage and review status | PLT-025 | Native language pages extended + new |
| Admin — System | Instance profile and UAT sign-off; upgrade runs and checks; migration runs and reconciliation reports | PLT-001, PLT-021, PLT-023 | New |
| Admin — Content | Help tips and guided tours | PLT-019 | New |
| Storefront and admin | Help tips, guided tours, accessibility toggle | PLT-018, PLT-019 | New widgets |
| External | Monitoring dashboards and operator cross-client view; provisioning pipeline; backup reports | PLT-001, PLT-014, PLT-016 | External system |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Plt.ChangePending | Your change was saved for approval. It takes effect when it is approved. | AC-PLT-004-01-02 |
| Plt.ConfigInvalid | The value of {0} is not valid: {1}. | AC-PLT-004-01-01 |
| Plt.ChangeStale | This change cannot be applied because the setting was changed after the request. Create a new change. | AC-PLT-004-03-04 |
| Plt.ApproveOwnChange | You cannot approve a change you requested. | AC-PLT-004-03-03 |
| Plt.PackKeyUnknown | The pack contains an unknown setting key or an invalid value: {0}. | AC-PLT-003-01-04 |
| Plt.PackPermissionUnknown | The pack contains an unknown permission: {0}. | AC-PLT-003-01-05 |
| Plt.PackStoreUnknown | The pack refers to a store that does not exist here: {0}. | AC-PLT-003-01-06 |
| Plt.PackCountryInvalid | A pack set must name exactly one country pack. | AC-PLT-003-01-10 |
| Plt.PackSecretRefused | The pack contains a secret value ({0}). Secrets are entered in each instance, never in packs. | AC-PLT-003-01-07 |
| Plt.PackVersionMismatch | This pack was exported from a newer product release than this instance runs. | AC-PLT-005-02-02 |
| Plt.PackApplyFailed | The configuration could not be applied. Nothing was changed. See the run report. | AC-PLT-003-02-01, AC-PLT-003-02-02 |
| Plt.PackConflict | {0} settings were changed here since the last pack. Choose which value to keep for each. | AC-PLT-003-02-05 |
| Plt.RestartRequired | Plugin changes take effect after the application restarts. | AC-PLT-003-01-08, AC-PLT-022-01-05 |
| Plt.FeatureDependencyOff | This feature needs {0}, which is off. | AC-PLT-022-01-03 |
| Plt.FeatureAlwaysOn | This is a platform core feature and cannot be switched off. | AC-PLT-022-01-04 |
| Plt.OverrideNotAllowed | This setting cannot be overridden for a transaction type or a single transaction. | AC-PLT-003-03-03 |
| Plt.OverrideReasonRequired | Enter the reason for this override. | AC-PLT-003-03-02 |
| Plt.CloneNotAuthorised | A copy of another client's configuration needs a recorded authorisation. | AC-PLT-005-04-01 |
| Plt.InstanceNotSignedOff | The live site cannot be activated before UAT sign-off is recorded. | AC-PLT-001-01-03 |
| Plt.MigrationRowInvalid | Row {0}: {1} | AC-PLT-023-01-01 |
| Plt.IdempotencyKeyRequired | This request changes data and needs an idempotency key. | AC-PLT-027-02-04 |
| Plt.ConcurrencyConflict | Someone else changed this record after you opened it. Review the current values and save again. | AC-PLT-027-01-01 |
| Plt.Accessibility.HighContrast | High contrast | AC-PLT-018-02-01 |
| Plt.Accessibility.LargerText | Larger text | AC-PLT-018-02-01 |
| Plt.Help.TourReplay | Replay the tour | AC-PLT-019-01-02 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Provisioning pipeline (PLT-001) | Create instances, drive installation, apply packs, set status (IC-PLT-05) | CI/CD and infrastructure tooling (not named) | External |
| Monitoring platform (PLT-014) | Health endpoint (IC-PLT-04), telemetry export, alerts, cross-client view | Not named in source | External |
| Backup and DR service (PLT-016) | Scheduled backups, restore tests, failover, reports | Database or hosting platform (not named) | External |
| Exchange-rate sources (PLT-024) | GetCurrencyLiveRates (IC-PLT-06) | Not named (KG-15) | Rate-provider plugins |
| Machine translation (PLT-025) | Pre-translate (native) | Google Translate or DeepL (native options) | Native; keys are secrets |
| Migration sources (PLT-023) | File import | Client legacy systems (not named) | Files |
| Licensed theme (PLT-006) | Theme configuration | Licensed theme vendor (VER-500, which supersedes V-01) | Licensed plugin |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-PLT-01 | Validate | Pack set (codes, versions, files) | Validation report (errors and warnings per artefact) | Unknown key, permission or store; secret present; release mismatch; a cross-key rule declared by a module fails (for example BR-IAM-054 permission exclusions; nopCommerce 5.00 rules BR-CAT-034 price caching with customer price lists and BR-INV-023 native unpaid-order functions off) | PLT pack loader service |
| IC-PLT-01 | Apply | Validated pack set, decisions for conflicting keys | PackApplyRun (status, stamp, restart flag) | Lock busy, write failure (rolled back) | ISettingService (clearCache false), ILocalizationService.ImportResourcesFromXmlAsync, IMessageTemplateService, IPermissionService, ICategoryService, IPluginService.PreparePluginToInstallAsync, PluginDescriptor.Save, ADM-002/ADM-003 contracts |
| IC-PLT-01 | Export | Scope (client, stores), options (for promotion or clone) | Pack file with manifest | — | Reads Setting rows by StoreId; omits BR-PLT-013 and BR-PLT-014 items |
| IC-PLT-01 | Diff | Two snapshots or a pack and the instance | List of keys with values on both sides | — | Used by PLT-004 compare and PLT-005 promotion |
| IC-PLT-02 | IsEnabled | Feature ID, store ID | true / false | Unknown feature | ISettingService.GetSettingByKeyAsync<bool>(productfeature.<id>, storeId, loadSharedValueIfNotFound: true) |
| IC-PLT-02 | SetState | Feature ID, store ID or client, on/off | Result (applied, restart required) | Dependency off; always-on feature | Writes setting; may call IPluginService.PreparePluginToInstallAsync |
| IC-PLT-03 | Register controlled configuration type | Type code, owning module, impact level, validator, preview and apply handlers | — | Duplicate type code | Module registers at start; used by PLT-004 for non-setting configuration such as PAY risk rules |
| IC-PLT-03 | Validate / Preview / Apply / ReadCurrent | Change item | Errors; impact counts; applied; current value | Validation error | Called by PLT-004 for registered types; Setting keys are handled by PLT itself |
| IC-PLT-04 | Health | Token or allow-listed caller | Status per component, release version | Unauthorised | New plugin route (IRouteProvider) on a controller deriving from Microsoft.AspNetCore.Mvc.Controller, like the native KeepAliveController, so no customer-session filters run |
| IC-PLT-05 | Provisioning hooks | Instance code, role (Live/Test), pack set, release | Instance status | Step failure | Pipeline calls the PLT admin API or drops the pack set in a watched App_Data folder applied at start (choice Proposed) |
| IC-PLT-06 | GetCurrencyLiveRates | Primary exchange-rate currency code | List of ExchangeRate (code, rate) | Source unavailable | Native IExchangeRateProvider implemented by PLT rate-provider plugins |
| IC-PLT-07 | Idempotent request | Idempotency key header, customer, route, body hash | Stored response on repeat | Key reused with different body; key missing on an API write (Plt.IdempotencyKeyRequired) | Plugin middleware with ILocker; IdempotencyRecord table; applies to every state-changing storefront action that sends a key and to every IC-INT-01 write |
| IC-PLT-08 | Register record type | Record type code, owning module, entity, date field, allowed actions (Archive / Anonymise / Delete), hold check callback | — | Duplicate code | Called by modules at start (DOC, CRM, IAM, RET, TRK, SEC, AI, ADM); read by the PLT-020 retention task |
| IC-PLT-09 | SetStatus (translation) | Entity name or resource key, entity ID, key group, language, status, user | TranslationStatus | Unknown entity or language | Called by AI-001 on draft approval; PLT-025 is the only writer of TranslationStatus |

C# signatures are produced at the start of the build and approved by the tech lead; this table fixes the operations and their nopCommerce mapping. The pack file format is Proposed. The provisioning pipeline itself is external; IC-PLT-05 defines only what the product exposes to it.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Platform.PackApplied | None (PLT event); setting writes publish native entity events for Setting | PLT-022 cache refresh; RPT; audit |
| Platform.ChangeSetPending / Approved / Rejected / Applied / Stale | None (PLT events) | ADM-006 approval item; TRK notification to requester and approvers |
| Platform.InstanceStatusChanged | None | Notification to client contact; monitoring platform |
| Platform.FeatureStateChanged | None | Plugins read IC-PLT-02 on next request (cache cleared) |
| Plugin installation after pack apply | AppStartedConsumer: IPluginService.InstallPluginsAsync and UpdatePluginsAsync at start | Plugins installed or updated on restart |
| Post-upgrade warnings | SystemWarningCreatedEvent (consumer adds warnings) | Admin System > Warnings shows PLT check failures |
| Exchange rates updated | UpdateExchangeRateTask (native schedule task) updates Currency rows | Prices use new rates |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Pack apply and change-set apply at the same time | PLT-003, PLT-004 | Both take ILocker key 'plt-config-write' (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 section 6.4); the second waits or fails with lock busy and retries |
| Two change sets touching the same key | PLT-004 | The first applied wins; the second becomes Stale at apply time (BR-PLT-021) |
| plugin.json limits on a web farm | PLT-003, PLT-022 | PluginDescriptor.Save writes only the node handling the request; the run is flagged restart required and every node reconciles its plugin.json limits from PackAppliedItem at start (BR-PLT-012) |
| Setting cache on a web farm | PLT-003, PLT-004, PLT-022 | Settings are cached; with distributed cache the cache clear reaches all nodes; without it, a multi-node instance is not supported (L1 section 6.4) |
| Two requests with the same idempotency key | PLT-027 | Serialised under ILocker key 'plt-idem-{key}'; the second returns the stored response |
| Retention task and legal hold placed at the same time | PLT-020 | The task re-reads the hold flag per batch inside the delete transaction; a record held before the delete commits is skipped |
| Two edits of a row-versioned record | PLT-027 | Second update affects no row and returns a conflict (BR-PLT-081) |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Instance status changed | Client contact; platform team | E-mail from the provisioning pipeline (outside the instance, BR-PLT-096) | PLT-001 |
| Provisioning failed | Platform team | E-mail / pipeline alert (outside the instance) | PLT-001 |
| Change set pending approval | Approvers | Admin notification + e-mail through TRK-005 (Platform.ChangeSetPending) | PLT-004 |
| Change set approved, rejected or stale | Requester | Admin notification + e-mail through TRK-005 (Platform.ChangeSetDecided) | PLT-004 |
| Pack apply failed or awaiting decision | Platform team | Admin notification through TRK-005 (Platform.PackApplyAttention) | PLT-003 |
| Post-upgrade check failed | Platform team | System warning + e-mail through TRK-005 (Platform.UpgradeCheckFailed) | PLT-021 |
| Monitoring alert | Platform team; client contact (per rule) | Monitoring platform channels | PLT-014 |
| Backup or restore test failed | Platform team; client contact | Monitoring platform channels | PLT-016 |
| Rate outside tolerance not applied | Finance staff | Admin notification through TRK-005 (Platform.RateNotApplied) | PLT-024 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Configuration-change report | PLT-004 | REQ-MPC-FR-287, FR-318 |
| Configuration as of a date; version compare | PLT-004 | REQ-MPC-FR-300; FC-M22-006, FC-M22-012 |
| Applied pack set and deviations | PLT-003 | D |
| Migration dry-run and reconciliation reports | PLT-023 | D |
| Retention run log | PLT-020 | REQ-MPC-FR-322 |
| Upgrade run and post-upgrade checks | PLT-021 | D |
| Translation coverage per language | PLT-025 | REQ-KTDA-LOC-001 |
| Backup success and last restore test | PLT-016 | REQ-MPC-FR-297 (external) |
| Health, usage and performance dashboards | PLT-014 | REQ-MPC-FR-290, FR-299 (external) |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-PLT-001 | Instance status change; UAT sign-off recorded | Pipeline / platform team | InstanceProfile | old status, new status, reason, sign-off reference |
| AUD-PLT-002 | Pack imported, validated, applied or failed | Platform team | PackApplyRun | pack codes, versions, checksums, result |
| AUD-PLT-003 | Pack conflict decision; deviation recorded | Platform team | ConfigDeviation | key, pack value, instance value, choice |
| AUD-PLT-004 | Change set captured, approved, rejected, applied, stale or withdrawn | Administrator / approver / system | ChangeSet | items with old and new values (secrets masked), reason, approvers |
| AUD-PLT-005 | Rollback requested | Administrator | ChangeSet | keys, target version |
| AUD-PLT-006 | Configuration export, import, promotion or clone | Platform team | ConfigPack | scope, manifest checksum, authorisation reference |
| AUD-PLT-007 | Feature state changed | Platform team | Setting productfeature.* | feature, store, old state, new state |
| AUD-PLT-008 | Migration dry run, import or reconciliation | Platform team | MigrationRun | counts, totals, differences |
| AUD-PLT-009 | Retention rule changed; retention run | Administrator / system | RetentionRule, RetentionRun | old and new values; counts per action |
| AUD-PLT-010 | Upgrade run and check results; rollback | Platform team | UpgradeRun | versions, check results |
| AUD-PLT-011 | Translation marked checked | Content staff | TranslationStatus | entity, language, reviewer |
| AUD-PLT-012 | Transaction-type or transaction override | Administrator / user | ConfigDeviation | scope, key, values, reason |

Business audit events AUD-PLT-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id. Old and new entity values, including every Setting write (BR-PLT-022), are captured by the SEC-004 IRepository<> decorator and need no call; PLT writes only through IRepository<> or native services (no direct INopDataProvider writes). The native activity log is not an audit substitute. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-PLT-001 | Secrets are never written to packs, exports, promotions or clones. | CFG-01; NFR-X-001 | AC-PLT-003-01-07, AC-PLT-005-01-02; T-PLT-03 |
| NFR-PLT-002 | A pack apply either completes fully or leaves the instance unchanged. | D (transactional apply) | AC-PLT-003-02-01, AC-PLT-003-02-02; T-PLT-02 |
| NFR-PLT-003 | No data, cache key, lock or file of one client instance is readable by another. | FC-M09-002; BR-PLT-003 | AC-PLT-002-01-01, AC-PLT-002-01-02; T-PLT-01 |
| NFR-PLT-004 | Product plugins run on SQL Server, MySQL and PostgreSQL. | REQ-MPC-ARC-003 | AC-PLT-015-01-05; T-PLT-08 |
| NFR-PLT-005 | WCAG 2.1 AA on new or changed screens (NFR-X-005). | FC-M06-023; DoD 9 | AC-PLT-018-01-01 |
| NFR-PLT-006 | Every configuration change is attributable (actor, time, old and new value). | REQ-MPC-FR-318; NFR-X-003 | AC-PLT-004-04-01 |
| NFR-PLT-007 | Response time, availability, RTO and RPO targets: Not stated in source — requires confirmation. | NFR-X-009; KG-18, MG-13 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-PLT-001 | P1 | PRD-PLT-003, PRD-PLT-021 | |
| PRD-PLT-002 | P1 | — | |
| PRD-PLT-003 | P1 | PRD-PLT-022 | PRD-PLT-001, PRD-PLT-005 |
| PRD-PLT-004 | P1 | PRD-ADM-002, PRD-SEC-004 | |
| PRD-PLT-005 | P1 | PRD-PLT-003 | |
| PRD-PLT-006 | P1 | — | |
| PRD-PLT-007 | P1 | — | PRD-SEC-001 |
| PRD-PLT-008 | P1 | — | PRD-TRK-004 |
| PRD-PLT-009 | P1 | — | PRD-PLT-025 |
| PRD-PLT-010 | P1 | PRD-PLT-024 | |
| PRD-PLT-011 | P1 | — | |
| PRD-PLT-012 | P2 | — | |
| PRD-PLT-013 | P1 | — | |
| PRD-PLT-014 | P1 | — | |
| PRD-PLT-015 | P1 | — | |
| PRD-PLT-016 | P1 | — | |
| PRD-PLT-017 | P1 | — | |
| PRD-PLT-018 | P1 | — | |
| PRD-PLT-019 | P1 | — | |
| PRD-PLT-020 | P1 | — | |
| PRD-PLT-021 | P1 | — | PRD-PLT-001 |
| PRD-PLT-022 | P1 | — | PRD-PLT-003 |
| PRD-PLT-023 | P1 | — | |
| PRD-PLT-024 | P1 | — | PRD-PLT-010 |
| PRD-PLT-025 | P1 | PRD-PLT-009 | |
| PRD-PLT-026 | P1 | — | |
| PRD-PLT-027 | P2 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-PLT-01 | Isolation: two instances on one shared Redis with distinct InstanceName; assert no key or lock crosses; repeat with the default InstanceName to show the failure the rule prevents. |
| T-PLT-02 | Pack apply: inject a failure in each artefact writer and in the file step; assert database and files equal the pre-apply snapshot. |
| T-PLT-03 | Secrets: export, promote and clone an instance with every BR-PLT-013 key set; assert no secret value appears in any output. |
| T-PLT-04 | Two-level resolution: for a sample of keys set shared only, store only and both, assert LoadSettingAsync results per store, including deletion of a removed store entry. |
| T-PLT-05 | Change control: capture writes from every native settings page, All settings (update, add, delete) and a plugin Configure page; assert nothing is written before approval and that the requester cannot approve. |
| T-PLT-06 | State models: every transition in section 8.2 is tested; every transition not listed is rejected. |
| T-PLT-07 | Permissions: each permission in section 4 has an allow and a deny case (section 4.1). |
| T-PLT-08 | Data providers: run the product regression set on SQL Server, MySQL and PostgreSQL. |
| T-PLT-09 | Upgrade: deploy release N+1 over N on a test instance with all packs applied; assert post-upgrade checks and rollback from backup. |
| T-PLT-10 | Migration: reconciliation totals equal source totals for orders, loyalty points and gift cards; re-run creates no duplicates. |
| T-PLT-11 | Country layer: apply global, country, vertical and client packs that all state one key and assert the client value; remove the key from the client and vertical packs and assert the country value; validate a pack set with zero and with two country packs and assert Plt.PackCountryInvalid with nothing written. |
